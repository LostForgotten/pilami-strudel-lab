// Pilami Hydra controller snapshots and morphing. AGPL-3.0-or-later.
(function(){
  'use strict';
  const kinds=new Set(['slider','knob','fader','toggle']),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const key=storageKey=>storageKey+':snapshots-v1';
  const parseNumber=raw=>/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(raw.trim())?Number(raw.trim().replace(',','.')):NaN;
  function validateState(state,entries){
    if(!Array.isArray(state)||state.length!==entries.length)return null;
    const copy=[];
    for(let i=0;i<state.length;i++){
      const s=state[i],validStep=v=>v==='any'||(Number.isFinite(v)&&v>0);
      if(!s||s.label!==entries[i].label||!kinds.has(s.kind)||![s.value,s.min,s.max].every(Number.isFinite)||s.min>=s.max||s.value<s.min||s.value>s.max||!validStep(s.step)||!validStep(s.sliderStep))return null;
      if(s.kind==='toggle'&&(s.min!==0||s.max!==1||s.step!==1||![0,1].includes(s.value)))return null;
      if(s.audio!==null&&(!s.audio||!Number.isInteger(s.audio.band)||s.audio.band<0||s.audio.band>15||!Number.isFinite(s.audio.depth)))return null;
      copy.push({label:s.label,kind:s.kind,value:s.value,min:s.min,max:s.max,step:s.step,sliderStep:s.sliderStep,audio:s.audio?{band:s.audio.band,depth:s.audio.depth}:null});
    }
    return copy;
  }
  function readBanks(storageKey){
    const data=JSON.parse(localStorage.getItem(key(storageKey))||'{"version":1,"banks":{}}');
    if(data?.version!==1||!data.banks||typeof data.banks!=='object'||Array.isArray(data.banks))throw Error('Snapshots enregistrés illisibles.');
    return data;
  }
  function exportBanks(storageKey){try{return readBanks(storageKey);}catch(_){return{version:1,banks:{}};}}
  function seed(storageKey,data){
    if(!data||data.version!==1||!data.banks||typeof data.banks!=='object'||Array.isArray(data.banks))return;
    try{if(!localStorage.getItem(key(storageKey)))localStorage.setItem(key(storageKey),JSON.stringify(data));}catch(_){}
  }
  function fingerprint(source){
    // Erase the complete H/audioMod/control wrapper chains, then ignore comments
    // and whitespace. Parameter edits, routing edits and changed AST offsets keep
    // the same bank; a changed shader or Hydra pipeline gets a separate bank.
    const tree=acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true}),edits=[];
    function walk(node,parents=[]){
      if(!node||typeof node!=='object')return;
      if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&kinds.has(node.callee.name)){
        let outer=node,index=parents.length-1;
        while(parents[index]?.type==='CallExpression'&&['H','audioMod'].includes(parents[index].callee?.name)&&parents[index].arguments[0]===outer)outer=parents[index--];
        edits.push({from:outer.start,to:outer.end});return;
      }
      if(node.type==='CallExpression'&&node.callee.type==='MemberExpression'&&node.callee.object?.name==='a'&&node.callee.property?.name==='setBins'&&node.arguments[0]){edits.push({from:node.arguments[0].start,to:node.arguments[0].end});return;}
      for(const [name,value]of Object.entries(node)){if(name==='loc')continue;if(Array.isArray(value))value.forEach(child=>walk(child,[...parents,node]));else if(value&&typeof value==='object'&&value.type)walk(value,[...parents,node]);}
    }
    walk(tree);let normal=source;
    for(const edit of edits.sort((a,b)=>b.from-a.from))normal=normal.slice(0,edit.from)+'__pilamiSnapshotControl()'+normal.slice(edit.to);
    const tokens=[];acorn.parse(normal,{ecmaVersion:'latest',allowAwaitOutsideFunction:true,onToken:tokens});
    const signature=JSON.stringify(tokens.map(t=>[t.type.label,t.value??null]));let a=2166136261,b=2246822507;
    for(let i=0;i<signature.length;i++){const c=signature.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,3266489909);}
    return{signature,hash:(a>>>0).toString(16)+(b>>>0).toString(16)};
  }
  function interpolate(a,b,t){
    if(t===0)return a.map(s=>({...s,audio:s.audio?{...s.audio}:null}));
    if(t===1)return b.map(s=>({...s,audio:s.audio?{...s.audio}:null}));
    const mix=(x,y)=>x*(1-t)+y*t;
    return a.map((x,i)=>{
      const y=b[i],discrete=x.kind==='toggle',side=t<.5?x:y;
      let audio=null;
      if(x.audio&&y.audio&&x.audio.band===y.audio.band)audio={band:x.audio.band,depth:mix(x.audio.depth,y.audio.depth)};
      else if(!x.audio&&y.audio)audio={band:y.audio.band,depth:y.audio.depth*t};
      else if(x.audio&&!y.audio)audio={band:x.audio.band,depth:x.audio.depth*(1-t)};
      else if(x.audio&&y.audio)audio=t<.5?{band:x.audio.band,depth:x.audio.depth*(1-2*t)}:{band:y.audio.band,depth:y.audio.depth*(2*t-1)};
      const min=discrete?0:mix(x.min,y.min),max=discrete?1:mix(x.max,y.max);
      let value=discrete?side.value:mix(x.value,y.value);
      // Integer controls (iterations/quality) stay integer; small-step continuous
      // controls morph smoothly instead of snapping on every input increment.
      if(!discrete&&Number.isInteger(x.value)&&Number.isInteger(y.value)&&Number(x.step)>=1&&Number(y.step)>=1)value=clamp(Math.round(value),Math.ceil(min),Math.floor(max));
      return{...side,value:clamp(value,min,max),min,max,audio};
    });
  }
  function create({model,source,context,say,notify}){
    const family=fingerprint(source),bankId=context.preset+':'+family.hash;
    let alive=true,applying=false,frame=null,frameHost=null,last=0,direction=1,ticket=0;
    const hosts=new Set();
    const state={slots:[null,null,null,null],from:0,to:1,duration:5,amount:null,active:null,running:false,ready:false,busy:false,message:'Capture tes réglages dans un emplacement vide.',error:false};
    const validSlot=i=>Number.isInteger(i)&&i>=0&&i<4;
    function message(text,error=false){state.message=text;state.error=error;notify();}
    function save(){
      try{const data=readBanks(context.storageKey);data.banks[bankId]={signature:family.signature,slots:state.slots,from:state.from,to:state.to,duration:state.duration};localStorage.setItem(key(context.storageKey),JSON.stringify(data));return true;}
      catch(_){message('Snapshots gardés pour cette session ; leur sauvegarde dans le navigateur est indisponible.',true);return false;}
    }
    try{
      const bank=readBanks(context.storageKey).banks[bankId];
      if(bank?.signature===family.signature){
        state.slots=Array.from({length:4},(_,i)=>{const slot=bank.slots?.[i],values=validateState(slot?.values,model.entries);return values?{values,savedAt:typeof slot.savedAt==='string'?slot.savedAt:''}:null;});
        if(validSlot(bank.from))state.from=bank.from;if(validSlot(bank.to))state.to=bank.to;
        if(Number.isFinite(bank.duration)&&bank.duration>=.1&&bank.duration<=600)state.duration=bank.duration;
        if(state.slots.some(Boolean))state.message='Snapshots restaurés pour ce preset. Choisis deux emplacements pour morpher.';
      }
    }catch(_){state.message='Les snapshots de ce navigateur sont indisponibles ; tu peux en capturer pour cette session.';state.error=true;}
    function pair(){
      if(state.from===state.to)return{error:'Choisis deux snapshots différents.'};
      const a=state.slots[state.from]?.values,b=state.slots[state.to]?.values;
      if(!a||!b)return{error:'Capture deux snapshots, puis choisis De et Vers.'};
      const mismatch=a.findIndex((e,i)=>(e.kind==='toggle')!==(b[i].kind==='toggle'));
      if(mismatch>=0)return{error:a[mismatch].label+' doit être un interrupteur dans les deux snapshots, ou dans aucun des deux.'};
      return{a,b};
    }
    async function ensureAudio(values){
      const bands=values.filter(e=>e.audio).map(e=>e.audio.band);
      if(bands.length&&(!window.PilamiStrudelHydra.audio()||window.PilamiStrudelHydra.audio().fft.length<=Math.max(...bands)))await window.PilamiStrudelHydra.enableControlAudio(Math.max(...bands));
    }
    async function prepare(){
      const current=++ticket,p=pair();state.ready=false;
      if(p.error){state.busy=false;notify();return;}
      state.busy=true;notify();
      try{await ensureAudio([...p.a,...p.b]);if(alive&&model.available()&&current===ticket){state.ready=true;state.busy=false;notify();}}
      catch(error){if(alive&&current===ticket){state.busy=false;message(error.message,true);}}
    }
    function stop(){
      state.running=false;if(frame!==null){try{frameHost.cancelAnimationFrame(frame);}catch(_){}frame=null;}notify();
    }
    function apply(values){applying=true;try{return model.applyState(values);}finally{applying=false;}}
    function morph(amount,automatic=false){
      if(!alive||!model.available()||!state.ready||!Number.isFinite(amount))return false;
      if(!automatic)stop();const p=pair();if(p.error){message(p.error,true);return false;}
      const t=clamp(amount,0,1);
      if(!apply(interpolate(p.a,p.b,t))){stop();return false;}
      state.amount=t;state.active=t===0?state.from:t===1?state.to:null;notify();return true;
    }
    function schedule(){
      let host=window.PilamiStrudelVisuals?.animationHost?.()||window;
      for(const candidate of hosts)if(!candidate.closed&&candidate.document.visibilityState==='visible')host=candidate;
      frameHost=host;frame=host.requestAnimationFrame(tick);
    }
    function tick(){
      frame=null;if(!alive||!state.running||!model.available()){stop();return;}
      const now=performance.now(),dt=Math.max(0,(now-last)/1000);last=now;
      const next=clamp(state.amount+direction*dt/state.duration,0,1);
      if(!morph(next,true))return;
      if(next===0||next===1){state.running=false;message('Morphing terminé · snapshot '+(state.active+1)+'.');}else schedule();
    }
    const api={state,
      capture(index){
        if(!validSlot(index)||!alive||!model.available())return false;stop();
        const values=validateState(model.captureState(),model.entries);if(!values)return false;
        state.slots[index]={values,savedAt:new Date().toISOString()};state.active=index;state.amount=null;
        const filled=state.slots.map((v,i)=>v?i:-1).filter(i=>i>=0);
        if(!state.slots[state.from]||!state.slots[state.to]){state.from=filled[0]??0;state.to=filled[1]??(state.from===0?1:0);}
        if(save())message('Snapshot '+(index+1)+' capturé · réglages et liaisons audio.');prepare();return true;
      },
      async recall(index){
        if(!validSlot(index)||!state.slots[index]||!alive||!model.available())return false;stop();const current=++ticket,slot=state.slots[index];state.busy=true;notify();
        try{await ensureAudio(slot.values);if(!alive||!model.available()||current!==ticket)return false;
          if(!apply(slot.values))return false;state.active=index;state.amount=index===state.from?0:index===state.to?1:null;message('Snapshot '+(index+1)+' rappelé.');return true;
        }catch(error){message(error.message,true);return false;}finally{if(alive&&current===ticket){state.busy=false;notify();prepare();}}
      },
      setPair(from,to){if(!validSlot(from)||!validSlot(to))return;stop();state.from=from;state.to=to;state.amount=null;state.active=null;save();const p=pair();message(p.error||'Morphing entre les snapshots '+(from+1)+' et '+(to+1)+'.',Boolean(p.error));prepare();},
      setDuration(seconds){if(!Number.isFinite(seconds)||seconds<.1||seconds>600){message('Durée : un nombre de 0,1 à 600 secondes.',true);return false;}state.duration=seconds;save();notify();return true;},
      morph,
      start(reverse=false){
        if(!state.ready||state.busy||!model.available())return false;stop();direction=reverse?-1:1;
        if(!morph(reverse?1:0,true))return false;state.running=true;last=performance.now();message('Morphing en cours · '+state.duration+' s.');schedule();return true;
      },
      stop,
      edited(){if(applying)return;stop();state.active=null;state.amount=null;state.message='Réglage libre · capture une nouvelle variation quand elle te plaît.';state.error=false;},
      host(win){hosts.add(win);return()=>{hosts.delete(win);if(state.running&&frameHost===win){try{win.cancelAnimationFrame(frame);}catch(_){}frame=null;schedule();}};},
      pair,
      dispose(){stop();alive=false;++ticket;hosts.clear();}
    };
    prepare();return api;
  }
  function element(doc,tag,text,attrs={}){const el=doc.createElement(tag);if(text!==null)el.textContent=text;for(const [name,value]of Object.entries(attrs))el.setAttribute(name,value);return el;}
  function mount(host,model){
    host.hidden=!model;if(!model)return{refresh(){},dispose(){}};
    const doc=host.ownerDocument,win=doc.defaultView;
    const panel=element(doc,'section',null,{class:'pilami-snapshot-panel','aria-label':'Snapshots et morphing'}),heading=element(doc,'div',null,{class:'pilami-snapshot-heading'});
    heading.append(element(doc,'h4','Snapshots & Morphing'),element(doc,'span','4 variations · sauvegarde sur ce navigateur',{class:'pilami-control-help'}));
    const slots=element(doc,'div',null,{class:'pilami-snapshot-slots'}),buttons=[];
    for(let i=0;i<4;i++){
      const card=element(doc,'div',null,{class:'pilami-snapshot-slot'}),main=element(doc,'button','Snapshot '+(i+1),{type:'button','data-snapshot-slot':i,'aria-pressed':'false'}),replace=element(doc,'button','Remplacer',{type:'button','data-snapshot-capture':i,'aria-label':'Remplacer le snapshot '+(i+1)});
      main.addEventListener('click',()=>model.state.slots[i]?model.recall(i):model.capture(i));replace.addEventListener('click',()=>model.capture(i));card.append(main,replace);slots.append(card);buttons.push({main,replace});
    }
    const row=element(doc,'div',null,{class:'pilami-morph-settings'}),from=element(doc,'select',null,{'aria-label':'Snapshot de départ','data-snapshot-from':''}),to=element(doc,'select',null,{'aria-label':'Snapshot d’arrivée','data-snapshot-to':''});
    for(let i=0;i<4;i++){from.append(element(doc,'option','Snapshot '+(i+1),{value:i}));to.append(element(doc,'option','Snapshot '+(i+1),{value:i}));}
    const fromLabel=element(doc,'label','De '),toLabel=element(doc,'label','Vers ');fromLabel.append(from);toLabel.append(to);from.addEventListener('change',()=>model.setPair(Number(from.value),Number(to.value)));to.addEventListener('change',()=>model.setPair(Number(from.value),Number(to.value)));
    const duration=element(doc,'input',null,{type:'text',inputmode:'decimal',class:'pilami-morph-duration','aria-label':'Durée du morphing en secondes','data-morph-duration':'',title:'De 0,1 à 600 secondes'}),durationLabel=element(doc,'label','Durée (s) ');durationLabel.append(duration);duration.value=model.state.duration;let durationDraft=false;
    const resetDuration=()=>{durationDraft=false;duration.value=model.state.duration;duration.removeAttribute('aria-invalid');};
    const commitDuration=()=>{if(!durationDraft)return;if(model.setDuration(parseNumber(duration.value)))resetDuration();else duration.setAttribute('aria-invalid','true');};
    duration.addEventListener('input',()=>{durationDraft=true;duration.removeAttribute('aria-invalid');});duration.addEventListener('blur',commitDuration);duration.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();commitDuration();}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();resetDuration();}});
    const forward=element(doc,'button','A → B',{type:'button','data-morph-forward':'','aria-label':'Morpher du snapshot de départ vers le snapshot d’arrivée'}),reverse=element(doc,'button','B → A',{type:'button','data-morph-reverse':'','aria-label':'Morpher du snapshot d’arrivée vers le snapshot de départ'}),stop=element(doc,'button','Pause',{type:'button','data-morph-stop':''});
    forward.addEventListener('click',()=>model.start(false));reverse.addEventListener('click',()=>model.start(true));stop.addEventListener('click',()=>model.stop());row.append(fromLabel,toLabel,durationLabel,forward,reverse,stop);
    const position=element(doc,'div',null,{class:'pilami-morph-position'}),range=element(doc,'input',null,{type:'range',min:0,max:1,step:.001,'aria-label':'Position du morphing entre les deux snapshots','data-morph-position':''}),output=element(doc,'output','Réglage libre',{'data-morph-value':''});
    range.addEventListener('input',()=>model.morph(Number(range.value)));position.append(range,output);
    const status=element(doc,'p','',{class:'pilami-control-help','data-snapshot-status':'',role:'status'});
    panel.append(heading,slots,row,position,status);host.replaceChildren(panel);
    const release=model.host(win),selection=new Map();
    const text=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
    const property=(el,name,value)=>{if(el[name]!==value)el[name]=value;};
    const attribute=(el,name,value)=>{if(el.getAttribute(name)!==value)el.setAttribute(name,value);};
    function selectSnapshot(select,value){
      // Native menus can hold a tentative keyboard selection before change.
      // Only a changed model selection may write it, never the animation clock.
      if(selection.get(select)!==value){select.value=String(value);selection.set(select,value);}
    }
    function refresh(){
      const s=model.state,available=!s.busy;
      buttons.forEach(({main,replace},i)=>{const filled=Boolean(s.slots[i]);text(main,'Snapshot '+(i+1)+(filled?' · Rappeler':' · Capturer'));property(main,'disabled',!available);attribute(main,'aria-pressed',String(s.active===i));property(main,'title',filled?'Rappeler les réglages capturés':'Capturer les réglages actuels');property(replace,'hidden',!filled);property(replace,'disabled',!available);if(main.classList.contains('is-saved')!==filled)main.classList.toggle('is-saved',filled);});
      selectSnapshot(from,s.from);selectSnapshot(to,s.to);for(const select of [from,to])for(const option of select.options)property(option,'disabled',!s.slots[Number(option.value)]);
      if(!durationDraft)property(duration,'value',String(s.duration));for(const el of [forward,reverse,range])property(el,'disabled',!s.ready||s.busy);property(stop,'disabled',!s.running);
      text(forward,(s.from+1)+' → '+(s.to+1));text(reverse,(s.to+1)+' → '+(s.from+1));
      if(s.amount!==null)property(range,'value',String(s.amount));text(output,s.amount===null?'Réglage libre':(Math.round(s.amount*1000)/10)+' %');
      text(status,s.busy?'Préparation des liaisons audio…':s.message);if(status.classList.contains('is-error')!==s.error)status.classList.toggle('is-error',s.error);
    }
    refresh();return{refresh,dispose(){release();}};
  }
  window.PilamiHydraSnapshots={create,mount,validateState,interpolate,exportBanks,seed,fingerprint};
})();
