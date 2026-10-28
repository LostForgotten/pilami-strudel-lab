// Pilami custom frequency sources. AGPL-3.0-or-later.
(function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const marker=/\/\* PILAMI_NOTE_SOURCES_V1 ([^]*?) \*\//g;
  const defaults={name:'G3',frequency:195.997718,width:5,gain:20,threshold:.18,attack:15,release:250,cooldown:300,retrigger:1.8,guard:true};
  const scale=[['C3',48],['F3',53],['G3',55],['A#3',58],['C4',60],['D4',62],['E4',64],['F4',65],['G4',67],['A#4',70],['C5',72]];
  let current=null;const audioViews=new WeakMap(),fftViews=new WeakMap();
  function scriptAudio(audio){
    if(!audio||typeof audio!=='object')return audio;
    if(!audioViews.has(audio))audioViews.set(audio,new Proxy(audio,{get(target,key){
      const value=Reflect.get(target,key,target);
      if(key==='fft'&&Array.isArray(value)){
        if(!fftViews.has(value))fftViews.set(value,new Proxy(value,{get(values,property,receiver){if(typeof property==='string'&&/^(?:0|[1-9][0-9]*)$/.test(property))return current?.scriptEnabled(Number(property))?Reflect.get(values,property,receiver):0;return Reflect.get(values,property,receiver);}}));
        return fftViews.get(value);
      }
      return typeof value==='function'?value.bind(target):value;
    }}));return audioViews.get(audio);
  }
  function detectScriptFFT(source){
    const tree=window.acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true});
    const nodes=[],parents=new WeakMap(),contexts=new WeakMap(),bindings=new Map(),functions=new Map(),names=new WeakMap(),calls=new Map(),mutated=new Set();
    function walk(node,parent=null,context=null){
      if(!node||typeof node!=='object'||!node.type)return;
      parents.set(node,parent);if(/Function/.test(node.type))context=node;contexts.set(node,context);nodes.push(node);
      for(const value of Object.values(node))if(Array.isArray(value))value.forEach(child=>walk(child,node,context));else if(value&&typeof value==='object'&&value.type)walk(value,node,context);
    }
    walk(tree);
    for(const node of nodes){
      if(node.type==='VariableDeclarator'&&node.id.type==='Identifier'&&node.init){bindings.set(node.id.name,node.init);if(/Function/.test(node.init.type)){functions.set(node.id.name,node.init);names.set(node.init,node.id.name);}}
      if(node.type==='FunctionDeclaration'&&node.id){functions.set(node.id.name,node);names.set(node,node.id.name);}
      if(node.type==='CallExpression'&&node.callee.type==='Identifier'){const list=calls.get(node.callee.name)||[];list.push(node);calls.set(node.callee.name,list);}
      if((node.type==='AssignmentExpression'||node.type==='UpdateExpression')&&(node.left||node.argument)?.type==='Identifier')mutated.add((node.left||node.argument).name);
    }
    function resolve(node,context,seen=new Set(),depth=0){
      if(!node||depth>12||seen.has(node))return null;seen=new Set(seen);seen.add(node);
      if(node.type==='Literal'&&Number.isFinite(node.value))return [node.value];
      if(node.type==='Identifier'){
        const index=context?.params?.findIndex(p=>p.type==='Identifier'&&p.name===node.name)??-1;
        if(index>=0){const list=calls.get(names.get(context))||[];if(!list.length)return null;const values=[];for(const call of list){const next=resolve(call.arguments[index],contexts.get(call),seen,depth+1);if(!next)return null;values.push(...next);}return [...new Set(values)];}
        if(mutated.has(node.name))return null;return resolve(bindings.get(node.name),null,seen,depth+1);
      }
      if(node.type==='UnaryExpression'&&['+','-'].includes(node.operator)){const values=resolve(node.argument,context,seen,depth+1);return values?.map(v=>node.operator==='-'?-v:v)||null;}
      if(node.type==='BinaryExpression'&&['+','-','*','/','%'].includes(node.operator)){
        const a=resolve(node.left,context,seen,depth+1),b=resolve(node.right,context,seen,depth+1);if(!a||!b||a.length*b.length>64)return null;
        const values=[];for(const x of a)for(const y of b){const v=node.operator==='+'?x+y:node.operator==='-'?x-y:node.operator==='*'?x*y:node.operator==='/'?x/y:x%y;if(!Number.isFinite(v))return null;values.push(v);}return [...new Set(values)];
      }return null;
    }
    let count=16;
    const bins=nodes.filter(n=>n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object?.name==='a'&&n.callee.property?.name==='setBins').flatMap(n=>resolve(n.arguments[0],contexts.get(n))||[]).filter(n=>Number.isInteger(n)&&n>0&&n<=16);
    if(bins.length)count=Math.max(...bins);
    const bands=new Set();
    for(const node of nodes){
      if(node.type!=='MemberExpression'||node.object?.name!=='a'||(node.computed?node.property?.value:node.property?.name)!=='fft')continue;
      const parent=parents.get(node),values=parent?.type==='MemberExpression'&&parent.object===node&&parent.computed?resolve(parent.property,contexts.get(parent)):null;
      for(const band of values||Array.from({length:count},(_,i)=>i))if(Number.isInteger(band)&&band>=0&&band<16)bands.add(band);
    }
    return [...bands].sort((a,b)=>a-b);
  }

  function valid(s){return s&&Number.isInteger(s.band)&&s.band>=16&&s.band<=47&&typeof s.name==='string'&&s.name.length>0&&s.name.length<=80&&Number.isFinite(s.frequency)&&s.frequency>=20&&s.frequency<=20000&&Number.isFinite(s.width)&&s.width>=1&&s.width<=1000&&s.width<s.frequency&&Number.isFinite(s.gain)&&s.gain>=.1&&s.gain<=1000&&Number.isFinite(s.threshold)&&s.threshold>=.01&&s.threshold<=1&&Number.isFinite(s.attack)&&s.attack>=1&&s.attack<=2000&&Number.isFinite(s.release)&&s.release>=1&&s.release<=10000&&Number.isFinite(s.cooldown)&&s.cooldown>=50&&s.cooldown<=10000&&Number.isFinite(s.retrigger)&&s.retrigger>=1.1&&s.retrigger<=10&&typeof s.guard==='boolean';}
  function validate(data){
    if(!data||data.version!==1||!Array.isArray(data.sources)||data.sources.length>32||!Array.isArray(data.triggers)||data.triggers.length>48)return null;
    const seen=new Set();if(data.sources.some(s=>!valid(s)||seen.has(s.band)||(seen.add(s.band),false)))return null;
    const targets=new Set();if(data.triggers.some(t=>!t||!Number.isInteger(t.band)||t.band<0||t.band>47||(t.band>=16&&!seen.has(t.band))||!/^snapshot:[0-9]$|^morph:snapshot:[0-9]$/.test(t.target)||targets.has(t.band)||(targets.add(t.band),false)))return null;
    const mutedBands=data.mutedBands??[];if(!Array.isArray(mutedBands)||mutedBands.length>16||new Set(mutedBands).size!==mutedBands.length||mutedBands.some(b=>!Number.isInteger(b)||b<0||b>15))return null;
    const scriptBands=data.scriptBands??[];if(!Array.isArray(scriptBands)||scriptBands.length>16||new Set(scriptBands).size!==scriptBands.length||scriptBands.some(b=>!Number.isInteger(b)||b<0||b>15))return null;
    return JSON.parse(JSON.stringify({...data,mutedBands,scriptBands}));
  }
  function read(source){const matches=[...source.matchAll(marker)];if(!matches.length)return{version:1,sources:[],triggers:[],mutedBands:[],scriptBands:[]};try{const data=validate(JSON.parse(matches[matches.length-1][1]));if(!data)throw Error();return data;}catch(_){throw Error('Configuration des sources par note invalide.');}}
  function write(source,data){const clean=source.replace(marker,'').trimEnd();return data.sources.length||data.triggers.length||data.mutedBands?.length||data.scriptBands?.length?clean+'\n\n/* PILAMI_NOTE_SOURCES_V1 '+JSON.stringify(data).replace(/\*/g,'\\u002a').replace(/</g,'\\u003c')+' */\n':clean;}
  function envelope(previous,raw,dt,s){const tau=raw>previous?s.attack:s.release;return previous+(raw-previous)*(1-Math.exp(-dt/tau));}
  function gate(state,raw,now,s){
    if(raw<s.threshold*.55)state.armed=true;
    const rise=raw>=s.threshold&&(state.armed||raw>Math.max(s.threshold,state.baseline*s.retrigger));
    const fire=rise&&now-state.last>=s.cooldown;
    // Slow baseline follows sustain; a new rise can retrigger without silence.
    state.baseline=raw>state.baseline?raw:state.baseline+(raw-state.baseline)*.12;
    if(fire){state.last=now;state.armed=false;}return fire;
  }
  function create(model,source,commit,say){
    const codeBands=detectScriptFFT(source);
    let data=read(source),nodes=new Map(),input=null,audio=null,alive=true,last=performance.now(),readyAt=Infinity,frame=null,connected=false;
    const gates=new Map(),values=new Map(),flashes=new Map();
    function reset(){if(input)for(const n of nodes.values()){try{input.disconnect(n.filter);n.filter.disconnect();n.analyser.disconnect();}catch(_){}}nodes.clear();gates.clear();values.clear();connected=false;}
    function configure(next,action=()=>{}){const validData=validate(next);if(!validData){say('Réglages audio invalides.',true);return false;}const previous=data;data=validData;if(!commit(action)){data=previous;return false;}reset();return true;}
    function build(){
      const next=window.PilamiStrudelHydra.audio();
      if(!next?.stream?.active||next.context?.state!=='running'||!window.PilamiStrudelHydra.isRunning()||!model.available()){reset();input=null;audio=null;return false;}
      if(audio!==next||input!==next.inputSource){reset();audio=next;input=next.inputSource;}
      if(!connected){
        for(const s of data.sources){if(s.frequency+s.width>=audio.context.sampleRate/2)continue;const filter=audio.context.createBiquadFilter(),analyser=audio.context.createAnalyser();filter.type='bandpass';filter.frequency.value=s.frequency;filter.Q.value=s.frequency/(2*s.width);analyser.fftSize=1024;input.connect(filter);filter.connect(analyser);nodes.set(s.band,{filter,analyser,buffer:new Float32Array(1024)});}
        connected=true;readyAt=performance.now()+250;
      }return true;
    }
    function tick(now){
      if(!alive)return;const dt=clamp(now-last,1,100);last=now;
      if(build()){
        const raw=new Map(),rms=new Map();
        for(const s of data.sources){const n=nodes.get(s.band);if(!n)continue;n.analyser.getFloatTimeDomainData(n.buffer);let power=0;for(const x of n.buffer)power+=x*x;const r=Math.sqrt(power/n.buffer.length);rms.set(s.band,r);raw.set(s.band,clamp(r*s.gain,0,1));}
        const fired=new Set();
        for(const s of [...data.sources].sort((a,b)=>a.frequency-b.frequency)){
          const r=raw.get(s.band)||0;values.set(s.band,envelope(values.get(s.band)||0,r,dt,s));
          let g=gates.get(s.band);if(!g){g={armed:false,baseline:r,last:now};gates.set(s.band,g);}
          const hit=gate(g,r,now,s);
          // Only suppress coincident rises with a stronger known fundamental.
          // This is a heuristic, never a promise of polyphonic recognition.
          const harmonic=s.guard&&data.sources.some(low=>{const ratio=s.frequency/low.frequency,integer=Math.round(ratio);return low.frequency<s.frequency&&integer>=2&&integer<=6&&Math.abs(s.frequency-integer*low.frequency)<=s.width+integer*low.width&&(fired.has(low.band)||now-(flashes.get(low.band)||-Infinity)<80)&&(rms.get(low.band)||0)>(rms.get(s.band)||0)*.7;});
          if(hit&&!harmonic&&now>=readyAt){fired.add(s.band);flashes.set(s.band,now);}
        }
        for(const t of data.triggers){
          if(t.band<16){const rawLevel=clamp(Number(audio.fft[t.band])||0,0,1);let g=gates.get(t.band);if(!g){g={armed:false,baseline:rawLevel,last:now};gates.set(t.band,g);}if(gate(g,rawLevel,now,defaults)&&now>=readyAt)fired.add(t.band);}
          if(!fired.has(t.band)||model.snapshots?.state.running||model.snapshots?.state.busy)continue;
          const i=Number(t.target.split(':').pop());if(!model.snapshots?.state.slots[i])continue;
          const action=t.target.startsWith('morph:')?model.snapshots.triggerMorphTo(i):model.snapshots.triggerRecall(i);Promise.resolve(action).catch(error=>say(error.message,true));
        }
      }
      frame=setTimeout(()=>tick(performance.now()),20);
    }
    const api={data:()=>data,level:band=>values.get(band)||0,flash:band=>performance.now()-(flashes.get(band)||-Infinity)<180,
      label:band=>data.sources.find(s=>s.band===band)?.name||'a.fft['+band+']',
      isMuted:band=>data.mutedBands.includes(band),
      usesScriptSource:band=>codeBands.includes(band)||data.scriptBands.includes(band),
      scriptEnabled:band=>(codeBands.includes(band)||data.scriptBands.includes(band))&&!data.mutedBands.includes(band),
      disableScriptSource(band){if(!Number.isInteger(band)||band<0||band>15)return false;return configure({...data,mutedBands:[...new Set([...data.mutedBands,band])],scriptBands:data.scriptBands.filter(b=>b!==band)});},
      enableScriptSource(band){if(!Number.isInteger(band)||band<0||band>15)return false;return configure({...data,scriptBands:[...new Set([...data.scriptBands,band])],mutedBands:data.mutedBands.filter(b=>b!==band)});},
      unmuteSource(band,action=()=>{}){return data.mutedBands.includes(band)?configure({...data,mutedBands:data.mutedBands.filter(b=>b!==band)},action):commit(action);},
      async enable(){const a=await window.PilamiStrudelHydra.enableControlAudio(0);if(!a?.stream?.active)throw Error('Entrée audio non connectée. Autorise le micro puis reconnecte.');},
      add(s){const band=Array.from({length:32},(_,i)=>i+16).find(b=>!data.sources.some(s=>s.band===b));if(band===undefined){say('32 sources maximum.',true);return false;}return configure({...data,sources:[...data.sources,{...defaults,...s,band}]});},
      update(s){return configure({...data,sources:data.sources.map(old=>old.band===s.band?s:old)});},
      remove(band){if(model.entries.some(e=>e.audio?.band===band)||model.snapshots?.state.slots.some(slot=>slot?.values.some(e=>e.audio?.band===band))){say('Délie cette source des contrôleurs et snapshots avant de la supprimer.',true);return false;}return configure({...data,sources:data.sources.filter(s=>s.band!==band),triggers:data.triggers.filter(t=>t.band!==band)});},
      addScale(reference=440){if(!Number.isFinite(reference)||reference<300||reference>600){say('Diapason : choisis A4 entre 300 et 600 Hz.',true);return false;}let next=data.sources.slice();for(const [name,midi]of scale){if(next.some(s=>s.name===name))continue;const band=Array.from({length:32},(_,i)=>i+16).find(b=>!next.some(s=>s.band===b));if(band===undefined){say('Pas assez de place pour les 11 notes.',true);return false;}next.push({...defaults,name,frequency:reference*2**((midi-69)/12),band});}return configure({...data,sources:next});},
      trigger(band,target){return configure({...data,triggers:[...data.triggers.filter(t=>t.band!==band),...(target?[{band,target}]:[])]});},
      unlinkSource(band){
        if(!model.available()||!Number.isInteger(band)||band<0||band>47)return false;
        const targets=model.entries.filter(e=>e.audio?.band===band);
        model.cancelAudioBindings();
        if(band>=16&&!targets.length&&!data.triggers.some(t=>t.band===band))return true;
        const changed=configure({...data,triggers:data.triggers.filter(t=>t.band!==band),scriptBands:data.scriptBands.filter(b=>b!==band),mutedBands:band<16?[...new Set([...data.mutedBands,band])]:data.mutedBands},()=>targets.forEach(e=>{e.audio=null;}));
        if(changed){if(model.selectedBand===band)model.selectBand(band);say(api.label(band)+' délié : modulations et déclenchement retirés.');}
        return changed;
      },
      dispose(){alive=false;clearTimeout(frame);reset();if(current===api)current=null;}
    };if(model.entries.some(e=>e.audio?.band>=16&&!data.sources.some(s=>s.band===e.audio.band)))throw Error('Une liaison fait référence à une source par note absente.');current=api;tick(performance.now());return api;
  }
  window.PilamiNoteSources={detectScriptFFT,scriptAudio,defaults,validate,read,write,create,envelope,gate,level:band=>current?.level(band)||0,label:band=>current?.label(band)||'Source '+band};
})();

(function(){
  'use strict';
  const cssURL="data:text/css;base64,LnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2V7LS1wYy1iZzp2YXIoLS1waWxhbWktZWRpdG9yLWJnLHZhcigtLWVkaXRvci1iZywjZmZmKSk7LS1wYy10ZXh0OnZhcigtLXBpbGFtaS1lZGl0b3ItdGV4dCx2YXIoLS1lZGl0b3ItdGV4dCwjMTcyYjQyKSk7LS1wYy1hY2NlbnQ6dmFyKC0tcGlsYW1pLWFjY2VudCx2YXIoLS1hY2NlbnQsIzQ2NzZhZCkpO2NvbG9yOnZhcigtLXBjLXRleHQpO2ZvbnQ6MTRweC8xLjUgc3lzdGVtLXVpLHNhbnMtc2VyaWY7bWluLXdpZHRoOjA7d2lkdGg6MTAwJX0KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgKntib3gtc2l6aW5nOmJvcmRlci1ib3h9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGg0e2ZvbnQ6NjAwIDE1cHgvMS40IHN5c3RlbS11aSxzYW5zLXNlcmlmO2NvbG9yOmluaGVyaXQ7bWFyZ2luOjB9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGJ1dHRvbiwucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBzZWxlY3QsLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgaW5wdXRbdHlwZT1udW1iZXJde2JhY2tncm91bmQ6dmFyKC0tcGMtYmcpIWltcG9ydGFudDtjb2xvcjp2YXIoLS1wYy10ZXh0KSFpbXBvcnRhbnQ7Zm9udDppbmhlcml0O2JvcmRlcjoxcHggc29saWQgIzg5OTdhNzc3O2JvcmRlci1yYWRpdXM6N3B4O3BhZGRpbmc6NnB4IDhweDttYXgtd2lkdGg6MTAwJTttaW4td2lkdGg6MH0KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgYnV0dG9ue2N1cnNvcjpwb2ludGVyfQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBidXR0b246Zm9jdXMtdmlzaWJsZSwucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBpbnB1dDpmb2N1cy12aXNpYmxlLC5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIHNlbGVjdDpmb2N1cy12aXNpYmxlLC5waWxhbWkteHktcGFkOmZvY3VzLXZpc2libGV7b3V0bGluZTozcHggc29saWQgdmFyKC0tcGMtYWNjZW50KTtvdXRsaW5lLW9mZnNldDoycHh9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIFtoaWRkZW5de2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9Ci5waWxhbWktYXVkaW8tYmFua3twb3NpdGlvbjpzdGlja3k7dG9wOjA7ei1pbmRleDozO2JvcmRlcjoxcHggc29saWQgIzg5OTdhNzY2O2JvcmRlci1yYWRpdXM6MTBweDtwYWRkaW5nOjE0cHg7bWFyZ2luLWJvdHRvbToxNnB4O2JhY2tncm91bmQ6dmFyKC0tcGMtYmcpfQoucGlsYW1pLWF1ZGlvLWhlYWRpbmcsLnBpbGFtaS1jb250cm9sLWhlYWRpbmd7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTBweDtmbGV4LXdyYXA6d3JhcH0KLnBpbGFtaS1hdWRpby1oZWFkaW5nIGJ1dHRvbntmb250LXNpemU6MTJweH0ucGlsYW1pLWNvbnRyb2wtaGVscHtmb250LXNpemU6MTJweDtvcGFjaXR5Oi44O2xpbmUtaGVpZ2h0OjEuNTttYXJnaW46OHB4IDAgMH0KLnBpbGFtaS1hdWRpby1zb3VyY2Vze2Rpc3BsYXk6ZmxleDtmbGV4LXdyYXA6d3JhcDtnYXA6OHB4O21hcmdpbjoxMnB4IDB9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGJ1dHRvbi5waWxhbWktYXVkaW8tc291cmNle2Rpc3BsYXk6ZmxleDtmbGV4OjE7bWluLXdpZHRoOjgwcHg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo2cHg7cGFkZGluZzo5cHg7Y3Vyc29yOmdyYWJ9Ci5waWxhbWktYXVkaW8tc291cmNlIHNwYW57Zm9udDoxMnB4IHVpLW1vbm9zcGFjZSxDb25zb2xhcyxtb25vc3BhY2V9LnBpbGFtaS1hdWRpby1zb3VyY2UgbWV0ZXJ7d2lkdGg6MTAwJTtoZWlnaHQ6MTJweDthY2NlbnQtY29sb3I6dmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgYnV0dG9uLnBpbGFtaS1hdWRpby1zb3VyY2UuaXMtc2VsZWN0ZWR7Ym9yZGVyLWNvbG9yOnZhcigtLXBjLWFjY2VudCk7Ym94LXNoYWRvdzowIDAgMCAycHggdmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS1jb250cm9sLWdyaWR7ZGlzcGxheTpncmlkO2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoYXV0by1maXQsbWlubWF4KG1pbigxMDAlLDI2MHB4KSwxZnIpKTtnYXA6MTJweDthbGlnbi1pdGVtczpzdGFydH0KLnBpbGFtaS1jb250cm9sLWNhcmQsLnBpbGFtaS14eS1jYXJke21pbi13aWR0aDowO3BhZGRpbmc6MTRweDtib3JkZXI6MXB4IHNvbGlkICM4OTk3YTc2Njtib3JkZXItcmFkaXVzOjEwcHg7YmFja2dyb3VuZDp2YXIoLS1wYy1iZyk7c2Nyb2xsLW1hcmdpbi10b3A6MjIwcHh9Ci8qIFJlc2VydmUgdHdvIGxpbmVzOiBsaXZlIGF1ZGlvIGRpZ2l0cyBuZXZlciBjaGFuZ2UgdGhlIGNhcmQgaGVpZ2h0LiAqLwoucGlsYW1pLWNvbnRyb2wtY2FyZCBbZGF0YS1jb250cm9sLWVmZmVjdGl2ZV17aGVpZ2h0OjNlbTttaW4taGVpZ2h0OjNlbTtvdmVyZmxvdzpoaWRkZW47Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQoucGlsYW1pLWNvbnRyb2wtY2FyZCBbZGF0YS1jb250cm9sLWVmZmVjdGl2ZV0+c3BhbntkaXNwbGF5OmJsb2NrO3doaXRlLXNwYWNlOm5vd3JhcDtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpc30KLnBpbGFtaS1hdWRpby1zZWxlY3Rpb257ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtnYXA6MTBweDtmbGV4LXdyYXA6d3JhcDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLXBjLWFjY2VudCk7Ym9yZGVyLXJhZGl1czo4cHg7cGFkZGluZzo4cHggMTBweDttYXJnaW4tYm90dG9tOjEycHg7YmFja2dyb3VuZDp2YXIoLS1wYy1iZyl9Ci5waWxhbWktYXVkaW8tc2VsZWN0aW9uIC5waWxhbWktY29udHJvbC1oZWxwe21hcmdpbjowO2ZsZXg6MSAxIDIyMHB4O292ZXJmbG93LXdyYXA6YW55d2hlcmV9Ci5waWxhbWktYXVkaW8tc2VsZWN0aW9uIGJ1dHRvbntmb250LXNpemU6MTJweDtmbGV4Om5vbmV9Ci5waWxhbWktYXVkaW8tYmFuayBbZGF0YS1jb250cm9sLWF1ZGlvLXN0YXR1c10uaXMtZXJyb3J7Y29sb3I6I2QxNmI3MztvcGFjaXR5OjF9Ci5waWxhbWktY29udHJvbC1kZXN0aW5hdGlvbntmb250LXdlaWdodDo2MDAhaW1wb3J0YW50O3RleHQtYWxpZ246Y2VudGVyO292ZXJmbG93LXdyYXA6YW55d2hlcmU7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IWltcG9ydGFudDtwYWRkaW5nOjZweCA4cHghaW1wb3J0YW50fQoucGlsYW1pLWNvbnRyb2wtaGVhZGluZyBzZWxlY3R7Zm9udC1zaXplOjExcHg7bWF4LXdpZHRoOjE1MHB4fS5waWxhbWktY29udHJvbC12YWx1ZXtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMnB4O21pbi1oZWlnaHQ6NDhweDttYXJnaW4tdG9wOjEwcHh9Ci5waWxhbWktY29udHJvbC12YWx1ZSBpbnB1dFt0eXBlPXJhbmdlXXtmbGV4OjE7bWluLXdpZHRoOjA7d2lkdGg6MTAwJTthY2NlbnQtY29sb3I6dmFyKC0tcGMtYWNjZW50KTtwYWRkaW5nOjA7YmFja2dyb3VuZDp0cmFuc3BhcmVudDtjdXJzb3I6cG9pbnRlcn0KLnBpbGFtaS1jb250cm9sLXZhbHVlIG91dHB1dHtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7Zm9udDoxM3B4IHVpLW1vbm9zcGFjZSxDb25zb2xhcyxtb25vc3BhY2U7bWluLXdpZHRoOjU1cHg7dGV4dC1hbGlnbjpyaWdodDttYXJnaW4tbGVmdDphdXRvfQoucGlsYW1pLWNvbnRyb2wtdmFsdWUgaW5wdXQucGlsYW1pLWNvbnRyb2wtbnVtYmVye2ZsZXg6MCAxIDEwMHB4O3dpZHRoOjEwMHB4O21pbi13aWR0aDo2NHB4O21hcmdpbi1sZWZ0OmF1dG87dGV4dC1hbGlnbjpyaWdodDtmb250OjEzcHggdWktbW9ub3NwYWNlLENvbnNvbGFzLG1vbm9zcGFjZTtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXM7YmFja2dyb3VuZDp2YXIoLS1wYy1iZykhaW1wb3J0YW50O2NvbG9yOnZhcigtLXBjLXRleHQpIWltcG9ydGFudDtib3JkZXI6MXB4IHNvbGlkICM4OTk3YTc3Nztib3JkZXItcmFkaXVzOjdweDtwYWRkaW5nOjZweCA4cHh9Ci5waWxhbWktY29udHJvbC12YWx1ZSBpbnB1dC5waWxhbWktY29udHJvbC1udW1iZXJbYXJpYS1pbnZhbGlkPXRydWVde2JvcmRlci1jb2xvcjojZDE2YjczfQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBidXR0b24ucGlsYW1pLWtub2J7cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6NzJweDtoZWlnaHQ6NzJweDtib3JkZXItcmFkaXVzOjUwJTtwYWRkaW5nOjA7YmFja2dyb3VuZDpyYWRpYWwtZ3JhZGllbnQoY2lyY2xlIGF0IDM1JSAyNSUsIzkxYTdiZSwjMjAzMzQ4KSFpbXBvcnRhbnQ7Ym9yZGVyOjNweCBzb2xpZCAjODk5N2E3O3RvdWNoLWFjdGlvbjpub25lO2ZsZXg6bm9uZTtjdXJzb3I6bnMtcmVzaXplfQoucGlsYW1pLWtub2ItbmVlZGxle3Bvc2l0aW9uOmFic29sdXRlO2luc2V0OjVweDt0cmFuc2Zvcm0tb3JpZ2luOmNlbnRlcn0KLnBpbGFtaS1rbm9iLW5lZWRsZTphZnRlcntjb250ZW50OicnO3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6Y2FsYyg1MCUgLSAycHgpO3RvcDowO3dpZHRoOjRweDtoZWlnaHQ6MTdweDtib3JkZXItcmFkaXVzOjJweDtiYWNrZ3JvdW5kOiNmN2ZiZmZ9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGJ1dHRvbi5waWxhbWktdG9nZ2xlW2FyaWEtY2hlY2tlZD10cnVlXXtib3JkZXItY29sb3I6dmFyKC0tcGMtYWNjZW50KTtib3gtc2hhZG93Omluc2V0IDAgMCAwIDJweCB2YXIoLS1wYy1hY2NlbnQpfQoucGlsYW1pLWNvbnRyb2wtdmFsdWUgaW5wdXQucGlsYW1pLWZhZGVye3dyaXRpbmctbW9kZTp2ZXJ0aWNhbC1scjtkaXJlY3Rpb246cnRsO3dpZHRoOjMycHg7aGVpZ2h0OjEzMHB4O2ZsZXg6MCAwIDMycHg7bWFyZ2luOjRweCBhdXRvfQoucGlsYW1pLWF1ZGlvLXJvdXRpbmd7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwO2JvcmRlci10b3A6MXB4IHNvbGlkICM4OTk3YTc0NDttYXJnaW4tdG9wOjEwcHg7cGFkZGluZy10b3A6MTBweH0KLnBpbGFtaS1hdWRpby1yb3V0aW5nIGxhYmVse2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjZweDtmb250LXNpemU6MTJweH0ucGlsYW1pLWF1ZGlvLXJvdXRpbmcgaW5wdXRbdHlwZT1udW1iZXJde3dpZHRoOjkwcHg7Zm9udC1zaXplOjEycHh9LnBpbGFtaS1hdWRpby1yb3V0aW5nIGJ1dHRvbiwucGlsYW1pLWF1ZGlvLXJvdXRpbmcgc2VsZWN0e2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLXh5LWNhcmR7Z3JpZC1jb2x1bW46MS8tMX0ucGlsYW1pLXh5LXpvbmVze2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwO21hcmdpbjoxMHB4IDB9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIC5waWxhbWkteHktem9uZXMgYnV0dG9uLmhhcy1hdWRpb3tib3JkZXItY29sb3I6dmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS14eS1wYWR7cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MTAwJTtoZWlnaHQ6MjMwcHg7b3ZlcmZsb3c6aGlkZGVuO3RvdWNoLWFjdGlvbjpub25lO2N1cnNvcjpjcm9zc2hhaXI7Ym9yZGVyOjFweCBzb2xpZCAjODk5N2E3ODg7Ym9yZGVyLXJhZGl1czo4cHg7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQoIzg5OTdhNzFhIDFweCx0cmFuc3BhcmVudCAxcHgpLGxpbmVhci1ncmFkaWVudCg5MGRlZywjODk5N2E3MWEgMXB4LHRyYW5zcGFyZW50IDFweCk7YmFja2dyb3VuZC1zaXplOjEwJSAxMCV9Ci5waWxhbWkteHktcGFkOmJlZm9yZSwucGlsYW1pLXh5LXBhZDphZnRlcntjb250ZW50OicnO3Bvc2l0aW9uOmFic29sdXRlO2JhY2tncm91bmQ6Izg5OTdhNzY2O3BvaW50ZXItZXZlbnRzOm5vbmV9LnBpbGFtaS14eS1wYWQ6YmVmb3Jle3dpZHRoOjFweDtoZWlnaHQ6MTAwJTtsZWZ0OjUwJX0ucGlsYW1pLXh5LXBhZDphZnRlcntoZWlnaHQ6MXB4O3dpZHRoOjEwMCU7dG9wOjUwJX0KLnBpbGFtaS14eS1kb3QsLnBpbGFtaS14eS1iYXNle3Bvc2l0aW9uOmFic29sdXRlO3dpZHRoOjE0cHg7aGVpZ2h0OjE0cHg7dHJhbnNmb3JtOnRyYW5zbGF0ZSgtNTAlLC01MCUpO2JvcmRlci1yYWRpdXM6NTAlO3BvaW50ZXItZXZlbnRzOm5vbmV9LnBpbGFtaS14eS1kb3R7YmFja2dyb3VuZDp2YXIoLS1wYy1hY2NlbnQpO2JveC1zaGFkb3c6MCAwIDAgNHB4ICM4OTk3YTczM30ucGlsYW1pLXh5LWJhc2V7d2lkdGg6MjJweDtoZWlnaHQ6MjJweDtib3JkZXI6MXB4IGRhc2hlZCB2YXIoLS1wYy10ZXh0KX0KLnBpbGFtaS14eS1jYXJkIG91dHB1dHtkaXNwbGF5OmJsb2NrO21hcmdpbi10b3A6OHB4O2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtcztmb250LXNpemU6MTNweH0KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgLmlzLWRyb3AtdGFyZ2V0e2JvcmRlci1jb2xvcjp2YXIoLS1wYy1hY2NlbnQpIWltcG9ydGFudDtvdXRsaW5lOjNweCBzb2xpZCB2YXIoLS1wYy1hY2NlbnQpO291dGxpbmUtb2Zmc2V0OjJweH0KQG1lZGlhKG1heC13aWR0aDo2MDBweCl7LnBpbGFtaS1hdWRpby1iYW5rLC5waWxhbWktY29udHJvbC1jYXJkLC5waWxhbWkteHktY2FyZHtwYWRkaW5nOjEwcHh9LnBpbGFtaS14eS1wYWR7aGVpZ2h0OjIwMHB4fS5waWxhbWktYXVkaW8tc291cmNlc3tkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCg1LG1pbm1heCgwLDFmcikpO2dhcDo1cHh9LnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgYnV0dG9uLnBpbGFtaS1hdWRpby1zb3VyY2V7bWluLXdpZHRoOjAhaW1wb3J0YW50O3BhZGRpbmc6N3B4IDNweH0ucGlsYW1pLWF1ZGlvLXNvdXJjZSBzcGFue2ZvbnQtc2l6ZToxMHB4fX0KCi8qIE5hdGl2ZSBzZWxlY3QgbWVudXMgbXVzdCB1c2UgdGhlIGNvbnRyb2xsZXIgcGFsZXR0ZSwgaW5jbHVkaW5nIGRldGFjaGVkIHdpbmRvd3MuICovCi5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIHNlbGVjdHtjb2xvci1zY2hlbWU6aW5oZXJpdH0KaHRtbFtkYXRhLXBpbGFtaS10aGVtZT0iZGFyayJdIC5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIHNlbGVjdHtjb2xvci1zY2hlbWU6ZGFya30KaHRtbFtkYXRhLXBpbGFtaS10aGVtZT0ibGlnaHQiXSAucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBzZWxlY3R7Y29sb3Itc2NoZW1lOmxpZ2h0fQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBzZWxlY3Qgb3B0aW9uLC5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIHNlbGVjdCBvcHRncm91cHtiYWNrZ3JvdW5kOnZhcigtLXBjLWJnKSFpbXBvcnRhbnQ7Y29sb3I6dmFyKC0tcGMtdGV4dCkhaW1wb3J0YW50fQoKLnBpbGFtaS1jb250cm9sLWJvdW5kc3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7ZmxleC13cmFwOndyYXA7bWFyZ2luLXRvcDoxMHB4O3BhZGRpbmctdG9wOjEwcHg7Ym9yZGVyLXRvcDoxcHggc29saWQgIzg5OTdhNzQ0fQoucGlsYW1pLWNvbnRyb2wtYm91bmRzIGxhYmVse2Rpc3BsYXk6ZmxleDtmbGV4OjEgMSA4MHB4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NXB4O2ZvbnQtc2l6ZToxMnB4O21pbi13aWR0aDowfQoucGlsYW1pLWNvbnRyb2wtYm91bmRzIGlucHV0W3R5cGU9bnVtYmVyXXt3aWR0aDoxMDAlO21pbi13aWR0aDowO2ZvbnQtc2l6ZToxMnB4O2ZvbnQtdmFyaWFudC1udW1lcmljOnRhYnVsYXItbnVtc30KLnBpbGFtaS1jb250cm9sLWJvdW5kcyBidXR0b257Zm9udC1zaXplOjEycHh9Ci5waWxhbWktY29udHJvbC1ib3VuZHMgLnBpbGFtaS1yYW5nZS1zdGF0dXN7ZmxleC1iYXNpczoxMDAlO21hcmdpbjowO2NvbG9yOnZhcigtLXBjLXRleHQpO29wYWNpdHk6MX0KLnBpbGFtaS1jb250cm9sLWJvdW5kcyBpbnB1dFthcmlhLWludmFsaWQ9dHJ1ZV17Ym9yZGVyLWNvbG9yOiNkMTZiNzN9CgoucGlsYW1pLXNuYXBzaG90LXBhbmVse3Bvc2l0aW9uOnN0aWNreTt0b3A6MDt6LWluZGV4OjQ7YmFja2dyb3VuZDp2YXIoLS1wYy1iZyk7Ym9yZGVyOjFweCBzb2xpZCAjODk5N2E3NjY7Ym9yZGVyLXJhZGl1czoxMHB4O3BhZGRpbmc6MTJweDttYXJnaW4tYm90dG9tOjE0cHh9Ci5waWxhbWktc25hcHNob3QtaGVhZGluZ3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2dhcDo4cHg7ZmxleC13cmFwOndyYXB9LnBpbGFtaS1zbmFwc2hvdC1oZWFkaW5nIC5waWxhbWktY29udHJvbC1oZWxwe21hcmdpbjowfQoucGlsYW1pLXNuYXBzaG90LXNsb3Rze2Rpc3BsYXk6Z3JpZDtncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDUsbWlubWF4KDAsMWZyKSk7Z2FwOjhweDttYXJnaW46MTBweCAwfQoucGlsYW1pLXNuYXBzaG90LXNsb3R7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6NHB4O21pbi13aWR0aDowfS5waWxhbWktc25hcHNob3Qtc2xvdCBidXR0b257Zm9udC1zaXplOjEycHh9Ci5waWxhbWktc25hcHNob3QtYWN0aW9uc3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6c3RyZXRjaDttaW4td2lkdGg6MH0KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgLnBpbGFtaS1zbmFwc2hvdC1hY3Rpb25zIFtkYXRhLXNuYXBzaG90LXNsb3Rde2ZsZXg6MTttaW4td2lkdGg6MDtib3JkZXItcmFkaXVzOjdweCAwIDAgN3B4O292ZXJmbG93LXdyYXA6YW55d2hlcmV9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIC5waWxhbWktc25hcHNob3QtYWN0aW9ucyBbZGF0YS1zbmFwc2hvdC1tb3JwaC10b117ZmxleDowIDAgMzJweDttaW4td2lkdGg6MzJweDttYXgtd2lkdGg6MzJweDtib3JkZXItcmFkaXVzOjAgN3B4IDdweCAwO21hcmdpbi1sZWZ0Oi0xcHg7cGFkZGluZzo2cHggNHB4O2ZvbnQtc2l6ZToxOHB4O2xpbmUtaGVpZ2h0OjF9Ci5waWxhbWktc25hcHNob3QtYWN0aW9ucyBidXR0b246Zm9jdXMtdmlzaWJsZXtwb3NpdGlvbjpyZWxhdGl2ZTt6LWluZGV4OjF9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIC5waWxhbWktc25hcHNob3QtYWN0aW9ucyBbZGF0YS1zbmFwc2hvdC1taWRpXXtmbGV4OjAgMCAzMnB4O3dpZHRoOjMycHg7bWluLXdpZHRoOjMycHg7Ym9yZGVyLXJhZGl1czowO21hcmdpbi1sZWZ0Oi0xcHg7cGFkZGluZzo2cHggNHB4O2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcn0KLnBpbGFtaS1zbmFwc2hvdC1taWRpLWljb24sLnBpbGFtaS1taWRpLWxlYXJuLWljb257ZGlzcGxheTpibG9jazt3aWR0aDoxOHB4O2hlaWdodDoxOHB4O2JhY2tncm91bmQ6Y3VycmVudENvbG9yO21hc2stcmVwZWF0Om5vLXJlcGVhdDttYXNrLXNpemU6Y29udGFpbjttYXNrLXBvc2l0aW9uOmNlbnRlcjstd2Via2l0LW1hc2stcmVwZWF0Om5vLXJlcGVhdDstd2Via2l0LW1hc2stc2l6ZTpjb250YWluOy13ZWJraXQtbWFzay1wb3NpdGlvbjpjZW50ZXJ9Ci5waWxhbWktc25hcHNob3QtYWN0aW9ucyBbZGF0YS1zbmFwc2hvdC1taWRpXS5oYXMtbWlkaSwucGlsYW1pLXNuYXBzaG90LWFjdGlvbnMgW2RhdGEtc25hcHNob3QtbWlkaV0uaXMtbGVhcm5pbmd7Ym9yZGVyLWNvbG9yOnZhcigtLXBjLWFjY2VudCl9Ci5waWxhbWktc25hcHNob3QtYWN0aW9ucyBbZGF0YS1zbmFwc2hvdC1taWRpXS5pcy1sZWFybmluZyAucGlsYW1pLXNuYXBzaG90LW1pZGktaWNvbnthbmltYXRpb246cGlsYW1pLW1pZGktd2FpdCAuOXMgZWFzZS1pbi1vdXQgaW5maW5pdGV9CkBrZXlmcmFtZXMgcGlsYW1pLW1pZGktd2FpdHswJSwxMDAle29wYWNpdHk6MX01MCV7b3BhY2l0eTouMn19CkBtZWRpYShwcmVmZXJzLXJlZHVjZWQtbW90aW9uOnJlZHVjZSl7LnBpbGFtaS1zbmFwc2hvdC1hY3Rpb25zIFtkYXRhLXNuYXBzaG90LW1pZGldLmlzLWxlYXJuaW5nIC5waWxhbWktc25hcHNob3QtbWlkaS1pY29ue2FuaW1hdGlvbjpub25lfS5waWxhbWktc25hcHNob3QtYWN0aW9ucyBbZGF0YS1zbmFwc2hvdC1taWRpXS5pcy1sZWFybmluZ3tib3gtc2hhZG93Omluc2V0IDAgMCAwIDJweCB2YXIoLS1wYy1hY2NlbnQpfX0KLnBpbGFtaS1zbmFwc2hvdC1zbG90e3Bvc2l0aW9uOnJlbGF0aXZlfQoucGlsYW1pLXNuYXBzaG90LW1pZGktbWVudXtwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjA7dG9wOjEwMCU7ei1pbmRleDo4O2Rpc3BsYXk6Z3JpZDtnYXA6NnB4O3dpZHRoOm1pbigyODBweCxjYWxjKDEwMHZ3IC0gNDhweCkpO3BhZGRpbmc6MTBweDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLXBjLWFjY2VudCk7Ym9yZGVyLXJhZGl1czo4cHg7YmFja2dyb3VuZDp2YXIoLS1wYy1iZyk7Ym94LXNoYWRvdzowIDVweCAxOHB4ICMwMDA0fQoucGlsYW1pLXNuYXBzaG90LW1pZGktbWVudSAucGlsYW1pLWNvbnRyb2wtaGVscHttYXJnaW46MH0ucGlsYW1pLXNuYXBzaG90LW1pZGktbWVudSBidXR0b257dGV4dC1hbGlnbjpsZWZ0fQoucGlsYW1pLXNuYXBzaG90LXNsb3Q6bnRoLWNoaWxkKDVuKSAucGlsYW1pLXNuYXBzaG90LW1pZGktbWVudXtsZWZ0OmF1dG87cmlnaHQ6MH0KQG1lZGlhKG1heC13aWR0aDo2MDBweCl7LnBpbGFtaS1zbmFwc2hvdC1zbG90Om50aC1jaGlsZCg1bikgLnBpbGFtaS1zbmFwc2hvdC1taWRpLW1lbnV7bGVmdDowO3JpZ2h0OmF1dG99LnBpbGFtaS1zbmFwc2hvdC1zbG90Om50aC1jaGlsZCgybikgLnBpbGFtaS1zbmFwc2hvdC1taWRpLW1lbnV7bGVmdDphdXRvO3JpZ2h0OjB9fQoucGlsYW1pLXNuYXBzaG90LXNsb3QgW2RhdGEtc25hcHNob3QtbW9ycGgtdG9dLmlzLXNhdmVke2JvcmRlci1jb2xvcjp2YXIoLS1wYy1hY2NlbnQpfQoucGlsYW1pLXNuYXBzaG90LXNsb3QgW2RhdGEtc25hcHNob3QtY2FwdHVyZV17Zm9udC1zaXplOjExcHg7cGFkZGluZzozcHggNnB4fQoucGlsYW1pLXNuYXBzaG90LXNsb3QgW2RhdGEtc25hcHNob3Qtc2xvdF17ZmxleDoxfQoucGlsYW1pLXNuYXBzaG90LXNsb3QgW2RhdGEtc25hcHNob3Qtc2xvdF0uaXMtc2F2ZWR7Ym9yZGVyLWNvbG9yOnZhcigtLXBjLWFjY2VudCl9Ci5waWxhbWktc25hcHNob3Qtc2xvdCBbYXJpYS1wcmVzc2VkPXRydWVde2JveC1zaGFkb3c6aW5zZXQgMCAwIDAgMnB4IHZhcigtLXBjLWFjY2VudCl9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlLmhhcy1zbmFwc2hvdHMgLnBpbGFtaS1hdWRpby1iYW5re3Bvc2l0aW9uOnN0YXRpY30KLnBpbGFtaS1tb3JwaC1zZXR0aW5nc3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo4cHg7ZmxleC13cmFwOndyYXB9Ci5waWxhbWktbW9ycGgtc2V0dGluZ3MgbGFiZWx7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NXB4O2ZvbnQtc2l6ZToxMnB4O21pbi13aWR0aDowfQoucGlsYW1pLW1vcnBoLXNldHRpbmdzIHNlbGVjdCwucGlsYW1pLW1vcnBoLXNldHRpbmdzIGJ1dHRvbntmb250LXNpemU6MTJweH0KLnBpbGFtaS1tb3JwaC1zZXR0aW5ncyAucGlsYW1pLW1vcnBoLWR1cmF0aW9ue3dpZHRoOjY1cHg7YmFja2dyb3VuZDp2YXIoLS1wYy1iZyk7Y29sb3I6dmFyKC0tcGMtdGV4dCk7Zm9udDppbmhlcml0O2JvcmRlcjoxcHggc29saWQgIzg5OTdhNzc3O2JvcmRlci1yYWRpdXM6N3B4O3BhZGRpbmc6NnB4fQoucGlsYW1pLW1vcnBoLWR1cmF0aW9uW2FyaWEtaW52YWxpZD10cnVlXXtib3JkZXItY29sb3I6I2QxNmI3MyFpbXBvcnRhbnR9Ci5waWxhbWktbW9ycGgtcG9zaXRpb257ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDttYXJnaW4tdG9wOjEwcHh9Ci5waWxhbWktbW9ycGgtcG9zaXRpb24gaW5wdXR7ZmxleDoxO21pbi13aWR0aDowO3dpZHRoOjEwMCU7YWNjZW50LWNvbG9yOnZhcigtLXBjLWFjY2VudCl9Ci5waWxhbWktbW9ycGgtcG9zaXRpb24gb3V0cHV0e2ZvbnQ6MTJweCB1aS1tb25vc3BhY2UsQ29uc29sYXMsbW9ub3NwYWNlO3RleHQtYWxpZ246cmlnaHQ7bWluLXdpZHRoOjkwcHh9Ci5waWxhbWktc25hcHNob3QtcGFuZWwgYnV0dG9uOmRpc2FibGVkLC5waWxhbWktc25hcHNob3QtcGFuZWwgaW5wdXQ6ZGlzYWJsZWR7b3BhY2l0eTouNTtjdXJzb3I6ZGVmYXVsdH0KLnBpbGFtaS1zbmFwc2hvdC1wYW5lbCAuaXMtZXJyb3J7Y29sb3I6I2QxNmI3M30KQG1lZGlhKG1heC13aWR0aDo2MDBweCl7LnBpbGFtaS1zbmFwc2hvdC1wYW5lbHtwYWRkaW5nOjEwcHh9LnBpbGFtaS1zbmFwc2hvdC1zbG90c3tncmlkLXRlbXBsYXRlLWNvbHVtbnM6cmVwZWF0KDIsbWlubWF4KDAsMWZyKSl9LnBpbGFtaS1zbmFwc2hvdC1oZWFkaW5nIC5waWxhbWktY29udHJvbC1oZWxwe2ZvbnQtc2l6ZToxMXB4fX0KCi8qIE9wdGlvbmFsIGF1dG9tYXRpYyBtb3JwaCBlYXNpbmcuICovCi5waWxhbWktbW9ycGgtZWFzaW5ne21hcmdpbi10b3A6OHB4fQoucGlsYW1pLW1vcnBoLWVhc2luZyBpbnB1dFt0eXBlPWNoZWNrYm94XXt3aWR0aDphdXRvO21pbi13aWR0aDowO21hcmdpbjowIDVweCAwIDA7YWNjZW50LWNvbG9yOnZhcigtLXBpbGFtaS1hY2NlbnQsIzhkYmNlOCl9Ci5waWxhbWktbW9ycGgtZWFzaW5nIGxhYmVse2Rpc3BsYXk6aW5saW5lLWZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo0cHh9Ci5waWxhbWktZWFzaW5nLXByZXZpZXd7d2lkdGg6OTZweDtoZWlnaHQ6NDBweDtmbGV4OjAgMCA5NnB4O2JvcmRlcjoxcHggc29saWQgY3VycmVudENvbG9yO2JvcmRlci1yYWRpdXM6NXB4O29wYWNpdHk6Ljg1fQoucGlsYW1pLWVhc2luZy1oZWxwe21hcmdpbjo1cHggMCAwfQoKLyogTUlESSBMZWFybjogY29tcGFjdCwgc2hhcmVkIGJldHdlZW4gbWFpbiBhbmQgZGV0YWNoZWQgY29udHJvbHMuICovCi5waWxhbWktbWlkaS1wYW5lbHtiYWNrZ3JvdW5kOnZhcigtLXBjLWJnKTtib3JkZXI6MXB4IHNvbGlkICM4OTk3YTc2Njtib3JkZXItcmFkaXVzOjEwcHg7cGFkZGluZzoxMnB4O21hcmdpbi1ib3R0b206MTRweH0KLnBpbGFtaS1taWRpLXNldHRpbmdze2Rpc3BsYXk6ZmxleDtnYXA6OHB4O2FsaWduLWl0ZW1zOmNlbnRlcjtmbGV4LXdyYXA6d3JhcDttYXJnaW4tdG9wOjlweH0KLnBpbGFtaS1taWRpLXNldHRpbmdzIGxhYmVse2Rpc3BsYXk6ZmxleDtnYXA6NXB4O2FsaWduLWl0ZW1zOmNlbnRlcjttaW4td2lkdGg6MDtmbGV4OjEgMSAxODBweDtmb250LXNpemU6MTJweH0KLnBpbGFtaS1taWRpLXNldHRpbmdzIHNlbGVjdHttaW4td2lkdGg6MDttYXgtd2lkdGg6MTAwJTtmbGV4OjE7Zm9udC1zaXplOjEycHh9Ci5waWxhbWktbWlkaS1zZXR0aW5ncyBidXR0b24sLnBpbGFtaS1taWRpLWJpbmRpbmcgYnV0dG9ue2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLW1pZGktc21vb3RoaW5nIGlucHV0W3R5cGU9cmFuZ2Vde2ZsZXg6MTttaW4td2lkdGg6NjBweDt3aWR0aDoxMDAlO2FjY2VudC1jb2xvcjp2YXIoLS1wYy1hY2NlbnQpfQoucGlsYW1pLW1pZGktc21vb3RoaW5nIGlucHV0W3R5cGU9bnVtYmVyXXtmbGV4OjAgMCA2OHB4O3dpZHRoOjY4cHg7Zm9udC12YXJpYW50LW51bWVyaWM6dGFidWxhci1udW1zfQoucGlsYW1pLW1pZGktbW9uaXRvcntvdmVyZmxvdy13cmFwOmFueXdoZXJlO2ZvbnQtZmFtaWx5OnVpLW1vbm9zcGFjZSxDb25zb2xhcyxtb25vc3BhY2V9Ci5waWxhbWktbWlkaS1wYW5lbCBkZXRhaWxze21hcmdpbi10b3A6OXB4fS5waWxhbWktbWlkaS1wYW5lbCBzdW1tYXJ5e2ZvbnQtc2l6ZToxMnB4O2N1cnNvcjpwb2ludGVyfQoucGlsYW1pLW1pZGktYmluZGluZ3N7ZGlzcGxheTpncmlkO2dhcDo2cHg7bWFyZ2luLXRvcDo4cHh9Ci5waWxhbWktbWlkaS1iaW5kaW5ne2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjhweDtmbGV4LXdyYXA6d3JhcDtib3JkZXItdG9wOjFweCBzb2xpZCAjODk5N2E3NDQ7cGFkZGluZy10b3A6NnB4O2ZvbnQtc2l6ZToxMnB4O292ZXJmbG93LXdyYXA6YW55d2hlcmV9Ci5waWxhbWktbWlkaS1iaW5kaW5nPnNwYW46Zmlyc3QtY2hpbGR7Zm9udC13ZWlnaHQ6NjAwfS5waWxhbWktbWlkaS1iaW5kaW5nIC5waWxhbWktY29udHJvbC1oZWxwe21hcmdpbjowO2ZsZXg6MSAxIDE4MHB4fQoucGlsYW1pLWNvbnRyb2wtY2FyZD4ucGlsYW1pLWNvbnRyb2wtaGVhZGluZ3tmbGV4LXdyYXA6bm93cmFwfQoucGlsYW1pLWNvbnRyb2wtY2FyZD4ucGlsYW1pLWNvbnRyb2wtaGVhZGluZz4ucGlsYW1pLWNvbnRyb2wtZGVzdGluYXRpb257ZmxleDoxO21pbi13aWR0aDowfQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSAucGlsYW1pLWNvbnRyb2wtaGVhZGluZyAucGlsYW1pLW1pZGktY29udHJvbC1sZWFybntkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7ZmxleDowIDAgMzBweDt3aWR0aDozMHB4O21pbi13aWR0aDozMHB4O21hcmdpbjowO3BhZGRpbmc6NHB4fQoucGlsYW1pLW1pZGktY29udHJvbC1sZWFybi5oYXMtbWlkaSwucGlsYW1pLW1pZGktY29udHJvbC1sZWFybi5pcy1sZWFybmluZ3tib3JkZXItY29sb3I6dmFyKC0tcGMtYWNjZW50KSFpbXBvcnRhbnR9Ci5waWxhbWktbWlkaS1jb250cm9sLWxlYXJuLmlzLWxlYXJuaW5nIC5waWxhbWktbWlkaS1sZWFybi1pY29ue2FuaW1hdGlvbjpwaWxhbWktbWlkaS13YWl0IC45cyBlYXNlLWluLW91dCBpbmZpbml0ZX0KLnBpbGFtaS1taWRpLWNvbnRyb2wtbGVhcm46ZGlzYWJsZWR7b3BhY2l0eTouNTtjdXJzb3I6ZGVmYXVsdH0KQG1lZGlhKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246cmVkdWNlKXsucGlsYW1pLW1pZGktY29udHJvbC1sZWFybi5pcy1sZWFybmluZyAucGlsYW1pLW1pZGktbGVhcm4taWNvbnthbmltYXRpb246bm9uZX0ucGlsYW1pLW1pZGktY29udHJvbC1sZWFybi5pcy1sZWFybmluZ3tib3gtc2hhZG93Omluc2V0IDAgMCAwIDJweCB2YXIoLS1wYy1hY2NlbnQpfX0KLnBpbGFtaS1jb250cm9sLW1pZGktYWN0aW9uc3tkaXNwbGF5OmZsZXg7Z2FwOjZweDthbGlnbi1pdGVtczpjZW50ZXI7ZmxleC13cmFwOndyYXA7bWFyZ2luLXRvcDoxMHB4fQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSAucGlsYW1pLWNvbnRyb2wtbWlkaS1hY3Rpb25zIGJ1dHRvbnttYXJnaW4tdG9wOjA7Zm9udC1zaXplOjExcHg7cGFkZGluZzo0cHggN3B4fQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSAucGlsYW1pLWNvbnRyb2wtbWlkaS1hY3Rpb25zIC5waWxhbWktbWlkaS1jb250cm9sLWludmVydHttYXJnaW4tbGVmdDphdXRvO21pbi13aWR0aDoyOHB4O2ZvbnQtd2VpZ2h0OjcwMDtmb250LXNpemU6MTVweDtsaW5lLWhlaWdodDoxfQoucGlsYW1pLW1pZGktY29udHJvbC1pbnZlcnRbYXJpYS1wcmVzc2VkPXRydWVde2JvcmRlci1jb2xvcjp2YXIoLS1wYy1hY2NlbnQpIWltcG9ydGFudDtib3gtc2hhZG93Omluc2V0IDAgMCAwIDFweCB2YXIoLS1wYy1hY2NlbnQpfQoucGlsYW1pLW1pZGktcGFuZWwgLmlzLWVycm9ye2NvbG9yOiNkMTZiNzM7b3BhY2l0eToxfS5waWxhbWktbWlkaS1wYW5lbCBidXR0b246ZGlzYWJsZWR7b3BhY2l0eTouNTtjdXJzb3I6ZGVmYXVsdH0KQG1lZGlhKG1heC13aWR0aDo2MDBweCl7LnBpbGFtaS1taWRpLXBhbmVse3BhZGRpbmc6MTBweH0ucGlsYW1pLW1pZGktc2V0dGluZ3MgbGFiZWx7ZmxleC1iYXNpczoxMDAlfX0KLyogT24gYSBuYXJyb3cgb3Igc2hvcnQgc2NyZWVuLCBsZWF2ZSByb29tIHRvIHNjcm9sbCB0byBNSURJIGFuZCBwYXJhbWV0ZXJzLiAqLwpAbWVkaWEobWF4LXdpZHRoOjYwMHB4KSwobWF4LWhlaWdodDo4NTBweCl7LnBpbGFtaS1zbmFwc2hvdC1wYW5lbHtwb3NpdGlvbjpzdGF0aWN9fQoKLyogUmFuZG9tIHZhcmlhdGlvbnMgc2hhcmUgdGhlIGxpdmUgbW9kZWwgaW4gdGhlIHBhZ2UgYW5kIGRldGFjaGVkIHdpbmRvd3MuICovCi5waWxhbWktcmFuZG9tLXBhbmVse2JhY2tncm91bmQ6dmFyKC0tcGMtYmcpO2JvcmRlcjoxcHggc29saWQgIzg5OTdhNzY2O2JvcmRlci1yYWRpdXM6MTBweDtwYWRkaW5nOjEycHg7bWFyZ2luLWJvdHRvbToxNHB4fQoucGlsYW1pLXJhbmRvbS1hY3Rpb25ze2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7ZmxleC13cmFwOndyYXA7Z2FwOjEwcHh9Ci5waWxhbWktcmFuZG9tLWFjdGlvbnMgW2RhdGEtY29udHJvbC1yYW5kb21de2ZvbnQtd2VpZ2h0OjYwMDtib3JkZXItY29sb3I6dmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS1yYW5kb20tcG93ZXJ7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6N3B4O2ZsZXg6MSAxIDIzMHB4O21pbi13aWR0aDowO2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLXJhbmRvbS1wb3dlciBpbnB1dFt0eXBlPXJhbmdlXXtmbGV4OjE7d2lkdGg6MTAwJTttaW4td2lkdGg6NDVweDthY2NlbnQtY29sb3I6dmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS1yYW5kb20tcG93ZXIgaW5wdXRbdHlwZT1udW1iZXJde2ZsZXg6MCAwIDYycHg7d2lkdGg6NjJweDtmb250LXZhcmlhbnQtbnVtZXJpYzp0YWJ1bGFyLW51bXN9Ci5waWxhbWktcmFuZG9tLXBhbmVsIFtkYXRhLWNvbnRyb2wtcmFuZG9tLXVuZG9de2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLXJhbmRvbS1wYW5lbCBidXR0b246ZGlzYWJsZWQsLnBpbGFtaS1yYW5kb20tcGFuZWwgaW5wdXQ6ZGlzYWJsZWR7b3BhY2l0eTouNTtjdXJzb3I6ZGVmYXVsdH0KLnBpbGFtaS1yYW5kb20tcG93ZXIgaW5wdXRbYXJpYS1pbnZhbGlkPXRydWVde2JvcmRlci1jb2xvcjojZDE2YjczfQpAbWVkaWEobWF4LXdpZHRoOjYwMHB4KXsucGlsYW1pLXJhbmRvbS1wYW5lbHtwYWRkaW5nOjEwcHh9LnBpbGFtaS1yYW5kb20tcG93ZXJ7ZmxleC1iYXNpczoxMDAlO29yZGVyOjN9fQoKLyogTm90ZSBzb3VyY2VzIHNoYXJlIHRoZSBjb250cm9sbGVyIG1vZGVsIGluIGRldGFjaGVkIHdpbmRvd3MuICovCi5waWxhbWktYXVkaW8tYmFua3twb3NpdGlvbjpzdGF0aWN9Ci5waWxhbWktbm90ZS1zZXR0aW5nc3ttYXJnaW4tdG9wOjEwcHg7Ym9yZGVyLXRvcDoxcHggc29saWQgIzg5OTdhNzQ0O3BhZGRpbmctdG9wOjEwcHh9Ci5waWxhbWktbm90ZS1zZXR0aW5ncyBzdW1tYXJ5e2N1cnNvcjpwb2ludGVyO2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjYwMH0KLnBpbGFtaS1ub3RlLWFjdGlvbnN7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtmbGV4LXdyYXA6d3JhcDtnYXA6OHB4O21hcmdpbi10b3A6MTJweH0KLnBpbGFtaS1ub3RlLWFjdGlvbnMgbGFiZWx7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NnB4O2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLW5vdGUtYWN0aW9ucyBpbnB1dHt3aWR0aDo4MHB4fQoucGlsYW1pLW5vdGUtbGlzdHtkaXNwbGF5OmdyaWQ7Z2FwOjZweDttYXJnaW4tdG9wOjEycHh9Ci5waWxhbWktbm90ZS1yb3d7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwO2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLW5vdGUtcm93PnNwYW57ZmxleDoxIDEgMjAwcHh9LnBpbGFtaS1ub3RlLXJvdyBidXR0b257Zm9udC1zaXplOjEycHh9Ci5waWxhbWktbm90ZS1kaWFsb2d7YmFja2dyb3VuZDp2YXIoLS1wYy1iZyk7Y29sb3I6dmFyKC0tcGMtdGV4dCk7Ym9yZGVyOjFweCBzb2xpZCAjODk5N2E3Nzc7Ym9yZGVyLXJhZGl1czoxMnB4O3BhZGRpbmc6MjBweDt3aWR0aDptaW4oNTQwcHgsOTR2dyk7bWF4LWhlaWdodDo4OHZoO292ZXJmbG93OmF1dG87Ym94LXNoYWRvdzowIDE0cHggNzBweCAjMDAwNn0KLnBpbGFtaS1ub3RlLWRpYWxvZzo6YmFja2Ryb3B7YmFja2dyb3VuZDojMDAwOH0KLnBpbGFtaS1ub3RlLWRpYWxvZz5sYWJlbHtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo4cHg7bWFyZ2luLXRvcDoxNnB4fQoucGlsYW1pLW5vdGUtZm9ybXtkaXNwbGF5OmdyaWQ7Z2FwOjEwcHg7bWFyZ2luLXRvcDoxNnB4fQoucGlsYW1pLW5vdGUtZm9ybSBsYWJlbHtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2dhcDoxMnB4O2ZvbnQtc2l6ZToxM3B4fQoucGlsYW1pLW5vdGUtZm9ybSBpbnB1dDpub3QoW3R5cGU9Y2hlY2tib3hdKXt3aWR0aDoxNDBweDtiYWNrZ3JvdW5kOnZhcigtLXBjLWJnKTtjb2xvcjp2YXIoLS1wYy10ZXh0KTtwYWRkaW5nOjZweDtib3JkZXI6MXB4IHNvbGlkICM4OTk3YTc3Nztib3JkZXItcmFkaXVzOjdweDttaW4td2lkdGg6MH0KLnBpbGFtaS1ub3RlLWZvcm0gaW5wdXRbdHlwZT1jaGVja2JveF17d2lkdGg6YXV0b30KLyogQ29sb3IgY29udmV5cyByb3V0aW5nLCBpbmRlcGVuZGVudGx5IG9mIG1pY3JvcGhvbmUgb3IgRkZUIGF2YWlsYWJpbGl0eS4gKi8KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgYnV0dG9uLnBpbGFtaS1hdWRpby1zb3VyY2UuaXMtdW5saW5rZWR7b3BhY2l0eTouNTU7ZmlsdGVyOmdyYXlzY2FsZSgxKTtiYWNrZ3JvdW5kOnZhcigtLXBjLWJnKSFpbXBvcnRhbnQ7Ym9yZGVyLWNvbG9yOiM4OTk3YTc2Njtib3gtc2hhZG93Om5vbmV9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGJ1dHRvbi5waWxhbWktYXVkaW8tc291cmNlLmlzLXVubGlua2VkLmlzLXNlbGVjdGVke2JvcmRlci1zdHlsZTpkYXNoZWQ7Ym9yZGVyLWNvbG9yOiM4OTk3YTc7Ym94LXNoYWRvdzowIDAgMCAxcHggIzg5OTdhNzQ0fQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBidXR0b24ucGlsYW1pLWF1ZGlvLXNvdXJjZS5pcy11bmxpbmtlZCBtZXRlcntmaWx0ZXI6Z3JheXNjYWxlKDEpfQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBidXR0b24ucGlsYW1pLWF1ZGlvLXNvdXJjZS5pcy1saW5rZWR7b3BhY2l0eToxO2ZpbHRlcjpub25lO2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KCM5ZDg2YmQyNCwjOWQ4NmJkMjQpLHZhcigtLXBjLWJnKSFpbXBvcnRhbnQ7Ym9yZGVyLWNvbG9yOiM5ZDg2YmR9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGJ1dHRvbi5waWxhbWktYXVkaW8tc291cmNlLmlzLWxpbmtlZC5pcy1zZWxlY3RlZHtib3JkZXItY29sb3I6dmFyKC0tcGMtYWNjZW50KX0KLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgYnV0dG9uLnBpbGFtaS1hdWRpby1zb3VyY2UuaXMtbGlua2VkLmlzLW5vdGUtaGl0e2JvcmRlci1jb2xvcjojNTBhZjk4O2JveC1zaGFkb3c6MCAwIDAgMnB4ICM1MGFmOTg2Nn0KQG1lZGlhKG1heC13aWR0aDo0MjBweCl7LnBpbGFtaS1ub3RlLWZvcm0gbGFiZWx7YWxpZ24taXRlbXM6ZmxleC1zdGFydDtmbGV4LWRpcmVjdGlvbjpjb2x1bW59LnBpbGFtaS1ub3RlLWZvcm0gaW5wdXQ6bm90KFt0eXBlPWNoZWNrYm94XSl7d2lkdGg6MTAwJX19CgovKiBBbWJlciBpZGVudGlmaWVzIGEgZGlyZWN0IEZGVCByZWFkIGluIHRoZSBzY3JpcHQ7IGludGVyZmFjZSBsaW5rcyBrZWVwIG1hdXZlLiAqLwoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBidXR0b24ucGlsYW1pLWF1ZGlvLXNvdXJjZS5pcy1saW5rZWQuaXMtc2NyaXB0LWxpbmtlZDpub3QoLmhhcy1jb250cm9sLWxpbmspe2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KCNjOWE0NjUyNiwjYzlhNDY1MjYpLHZhcigtLXBjLWJnKSFpbXBvcnRhbnQ7Ym9yZGVyLWNvbG9yOiNjOWE0NjV9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIGJ1dHRvbi5waWxhbWktYXVkaW8tc291cmNlLmlzLWxpbmtlZC5pcy1zY3JpcHQtbGlua2VkOm5vdCguaGFzLWNvbnRyb2wtbGluaykuaXMtc2VsZWN0ZWR7Ym9yZGVyLWNvbG9yOnZhcigtLXBjLWFjY2VudCl9CgovKiBQYXJhbWV0ZXJzIGNvbWUgZmlyc3QuIFRlY2huaWNhbCB0b29scyByZW1haW4gYXZhaWxhYmxlIGluIG5hdGl2ZSBkaXNjbG9zdXJlcy4gKi8KLnBpbGFtaS1jb250cm9sbGVyLXBhcmFtZXRlcnM+LnBpbGFtaS1jb250cm9sLWhlbHB7bWFyZ2luOjAgMCAxMnB4fQoucGlsYW1pLWNvbnRyb2xsZXItc2VjdGlvbntib3JkZXI6MXB4IHNvbGlkICM4OTk3YTc2Njtib3JkZXItcmFkaXVzOjEwcHg7YmFja2dyb3VuZDp2YXIoLS1wYy1iZyk7bWFyZ2luOjE0cHggMDtjb2xvcjp2YXIoLS1wYy10ZXh0KX0KLnBpbGFtaS1jb250cm9sbGVyLXNlY3Rpb24+c3VtbWFyeXtmb250LXdlaWdodDo2MDA7Zm9udC1zaXplOjE0cHg7cGFkZGluZzoxMnB4O2N1cnNvcjpwb2ludGVyO292ZXJmbG93LXdyYXA6YW55d2hlcmV9Ci5waWxhbWktY29udHJvbGxlci1zZWN0aW9uW29wZW5dPnN1bW1hcnl7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgIzg5OTdhNzMzfQoucGlsYW1pLWNvbnRyb2xsZXItc2VjdGlvbj4ucGlsYW1pLWNvbnRyb2wtaGVscHttYXJnaW46MTBweCAxMnB4fQoucGlsYW1pLWNvbnRyb2xsZXItc2VjdGlvbj5kaXYsLnBpbGFtaS1jb250cm9sbGVyLXNlY3Rpb24+LnBpbGFtaS1hdWRpby1iYW5re21hcmdpbjoxMnB4fQoucGlsYW1pLWNvbnRyb2xsZXItc2VjdGlvbiAucGlsYW1pLWF1ZGlvLWJhbmssLnBpbGFtaS1jb250cm9sbGVyLXNlY3Rpb24gLnBpbGFtaS1zbmFwc2hvdC1wYW5lbCwucGlsYW1pLWNvbnRyb2xsZXItc2VjdGlvbiAucGlsYW1pLW1pZGktcGFuZWx7Ym9yZGVyOjA7cGFkZGluZzowO3Bvc2l0aW9uOnN0YXRpYzttYXJnaW4tYm90dG9tOjB9Ci5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIHN1bW1hcnk6Zm9jdXMtdmlzaWJsZXtvdXRsaW5lOjNweCBzb2xpZCB2YXIoLS1wYy1hY2NlbnQpO291dGxpbmUtb2Zmc2V0OjJweDtib3JkZXItcmFkaXVzOjdweH0KLnBpbGFtaS1jb250cm9sLWFkdmFuY2Vke2JvcmRlci10b3A6MXB4IHNvbGlkICM4OTk3YTczMzttYXJnaW4tdG9wOjEycHg7cGFkZGluZy10b3A6OHB4O2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLWNvbnRyb2wtYWR2YW5jZWQgc3VtbWFyeXtjdXJzb3I6cG9pbnRlcjtmb250LXdlaWdodDo1MDA7cGFkZGluZzozcHggMH0KLnBpbGFtaS1jb250cm9sLWFkdmFuY2VkPmxhYmVse2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjhweDttYXJnaW4tdG9wOjEwcHh9Ci5waWxhbWktY29udHJvbC1hZHZhbmNlZCBzZWxlY3R7ZmxleDoxO2ZvbnQtc2l6ZToxMnB4fQoucGlsYW1pLWNvbnRyb2wtYWR2YW5jZWQgLnBpbGFtaS1jb250cm9sLWJvdW5kc3tib3JkZXItdG9wOjA7cGFkZGluZy10b3A6MH0KLnBpbGFtaS1yYW5kb20tcGFuZWx7bWFyZ2luLXRvcDoxNHB4fQoKLnBpbGFtaS1jb250cm9sbGVyLXN1cmZhY2UgW2RhdGEtbWlkaS1lZGl0LWxlYXJuXXtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7ZmxleDowIDAgMzRweDt3aWR0aDozNHB4O21pbi13aWR0aDozNHB4O3BhZGRpbmc6NnB4fQoucGlsYW1pLWNvbnRyb2xsZXItc3VyZmFjZSBbZGF0YS1taWRpLWVkaXQtbGVhcm5dLmlzLWxlYXJuaW5ne2JvcmRlci1jb2xvcjp2YXIoLS1wYy1hY2NlbnQpfQpbZGF0YS1taWRpLWVkaXQtbGVhcm5dLmlzLWxlYXJuaW5nIC5waWxhbWktbWlkaS1sZWFybi1pY29ue2FuaW1hdGlvbjpwaWxhbWktbWlkaS13YWl0IC45cyBlYXNlLWluLW91dCBpbmZpbml0ZX0KQG1lZGlhKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246cmVkdWNlKXtbZGF0YS1taWRpLWVkaXQtbGVhcm5dLmlzLWxlYXJuaW5nIC5waWxhbWktbWlkaS1sZWFybi1pY29ue2FuaW1hdGlvbjpub25lfS5waWxhbWktY29udHJvbGxlci1zdXJmYWNlIFtkYXRhLW1pZGktZWRpdC1sZWFybl0uaXMtbGVhcm5pbmd7Ym94LXNoYWRvdzppbnNldCAwIDAgMCAycHggdmFyKC0tcGMtYWNjZW50KX19Cg==";
  const midiLearnIconURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDcuMS1jMDAwIDc5LmRhYmFjYmIsIDIwMjEvMDQvMTQtMDA6Mzk6NDQgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NjQ4ODljY2MtYWNjMy1lYjQ3LWFjMWItZDcxMjI2NGJiYzE0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkE3OTVGNjQ0QzY3RDExRjFCQTBCQ0QzOUM0NENGNkU4IiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkE3OTVGNjQzQzY3RDExRjFCQTBCQ0QzOUM0NENGNkU4IiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMy4wIChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjY0ODg5Y2NjLWFjYzMtZWI0Ny1hYzFiLWQ3MTIyNjRiYmMxNCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2NDg4OWNjYy1hY2MzLWViNDctYWMxYi1kNzEyMjY0YmJjMTQiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4qLBoNAAAHUklEQVR42sxaaWxUVRSe9zqdznQF2kKnLRTUili2EJVqKuAWlRCjItGoJIrBGAJEY0gMiokoiZHljxiQsMUfqCgoGoIQg6JsSiKyuFSMoFKoSOlGoZSZ1nPKd83x5L7pzLRTe5Iv7727n3vPPcu9z+no6Bjk8/lafIlTO+GC+C4g3EQYTignDCMMJOQgn/s4S/iN8CuhmnCAcFq0kUlwkxhLlkOM+LpJdxMeIFQRKhKs+wthH+FjIHkiRrKZmQSRR1hIONXRc3SOsIxQlMR4snlFsomf8wnw/jzhBYhSLKonNBJaeb4IQYhZV/VYXBcTFkJ846GEGLmB8DZhnEf+T4SdhIPYAyewLy6DkXTsgcHYQ2MItxHGerR3jPAM2uySkXhFa2YMkXifMJmQoeoE0XYuwO8hVSaNMImwNkb78+IRrXgYed2jg3cJ49S+YfkO41mCtH87Q5opw+gv8isIqzz6Wt3dPfIWYZZF9p8ifIRvVt9pSp79ULUOYRq+WSs1o3xElHUgerX4ZnFbRyhT/W4iPJSMaNlW4gvCQOQXEIoxwxosSjmEL0XdQ6ib5VGH2xqEtrnMZkv/6xMVrRmWRjaI/BIhQjZwmbmWNhYjrygGSkU/b1ramG9jxGZF2TKvUWkbCY9C8wyGNqqHanU8lrufJW2AR1keRxuhgdBEKIWGmwPxlrSIcHM8BvGYmoG9SA8QyggONFIZNJWLWZSzGsKq1Yh2mgkjUEevQAAabChEkvsbAhHj9y1qTA0o7ylaWhzOE/JFw+mE4YT9hDrCHkI5Bif3SwkYHAbxWEkYjXZkuTD657QdaPMwYTwmbDAG7Cf8qca2RDNiZoAH2aoKTxWd98NKHFVl9qGzAZaZThedOZa9VYg8vbHPor0s1OEyt1j2i6mf6wq1uYCQIaRuK1ReAdQjq+ghFsewklBs8aBZxeZD3RpE0ZahNrguVaou1xuJNqOou9eyd5fheZlnyejxi2jUELsOhzDIdmxsLvMtYbQot5swARs5PUGflQf5N5TJNJF+Bkon0mkjriiDvwhhwnHYJUPcZ8QFExMVE5+BiUKxYpl4slH6HHHEdsITWMmMJJxvPwY6l7AZRpFnfjKMZ66IfXgsJwnrVRuPdFpVxCOrYa0NTYFoFVss9ikwH8Z7Gt4jSUYSfqzKJUIJ3tvw3i5E0cHksRh+rbbAFGYkB7M/DBl/EK7BDGdbOnbQKYtaiBBQcp8MOfCSWyAZQY82W7FS7GGPQhqHCuNYtG4VTDBtQ6M5XrEYBp8L+ex2iIk2eGXyMIFebWZiX20SaVxnAjNyvSr8na/vkhHzoyp9hB9iJKlazFIalrIJaUGoxmiKB5wGd8Wo9Cy4PFHk/QDxNgpmpKsYaUZkF8BSn0NljtSehU05jcZSRX6o3yB8rTl4P4O8EFSxPH0p8asYug6zEMAqcP6nUM9MzxEmQU3mpYiResz+ThhFpqcJtyMvHfasQR4HuVg2qRXaYICYkYcFEz5Y9pfRUEeKGOGJnC2Y8OF9NvKMp9wq8oOuOhDTg7MZuVAvbOpgjDTHMlbHVT5SEEvXDhvyntIQvIdeg+g5KWKCJ2o5oUak1SAuCWFsAcVsqx/7QgY+mXAQC7Gp7sCyZsI9OGqx+D1JAzDwKigZppVwT8IQ+ZDaoxfYsmv3hBvYQyjCZq/DnjCRXFi5DqnUXG34DuAcOYJDjaGEw0LMd/hx/irpOjDioGKe4j7aC3skYgmLI+JZofbqEVcYQENj+rBlN4pJx0TVLuKJkyLxHlRo6YOMGJV7v1LXu13sgV0ioxyHZE1J3lWkihx4GnwGfaNI38/nzmagG1SlWUou+xI9rr4/kIGVD667DCFHEH5OsapNZDVYW/WHLyg3OnsmF1wRwuqDsFcFg/83dWAcLyomtuA+JWQixGYEUo3KYt+F+Lykl9Sul0tfg4jwsMpje/I7B3muMGzMzCuq4AbMwKkUu+6xmDgr94KgdWCiM+CyXSvU4hzJ0Hao5BCMVLQXmWjCBL9DmK6MYz9hIqyH2Pepb761XQU35VwSKxMR12/JMLFIMWHsSIvNUkriA7h5Km0mHLeLkFd/FxrGha9UC9GogwNaizwnDj/LeNrzVf5SHAH9t9MYN1ZrCU+qNL51egyawnZTJW+frsVMVmFw+7HnDsIBTNMxBZ4mhOXj0Rmq/604c9PU5R3ih5aD4+OEiaJMWBxMFyPtXlwjaIoSpqvLnjDqOUgfS/jeUver7l6GrvO4oFxOuFqU6497jvI4fg6oxAl+vqhfGuPi9ZOeuNVlvOTRwSXCCqyQuXhZHQcj20TbzNRSQqNH2SU9dT1tcCfhRIzBHSAsULdUXlSHu8BdXZSZGu8vHIn+i8IXPW9A1lNJK5TY9TgjBlcR1kC0epL4L4pRyf5U0x3rm4GzrwcJ4xHnJ0JsYL+BWt+oDt0Sc4+78eNZVBxK+HDDVImYvwKHFLnCWzVXAmxjfvRd+QmHfzw7oo6j/EmMJesfAQYAZve5F/WVcKIAAAAASUVORK5CYII=";
  const MIME='application/x-pilami-audio-band';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const number=value=>String(Math.round(value*1e6)/1e6);
  const randomStorageKey='pilami-hydra-random-strength-v1';
  function randomStrength(){try{const raw=localStorage.getItem(randomStorageKey),next=Number(raw);return raw!==null&&Number.isFinite(next)?Math.round(clamp(next,0,100)):20;}catch(_){return 20;}}
  function audioLevel(band){if(band>=16)return window.PilamiNoteSources.level(band);const level=Number(window.PilamiStrudelHydra.audio()?.fft[band]);return Number.isFinite(level)?clamp(level,0,1):0;}
  function validateAudio(options){
    if(!options||!Number.isInteger(options.band)||options.band<0||options.band>47||!Number.isFinite(options.depth))throw new Error('audioMod : band de 0 à 47 et depth numérique requis.');
    return {band:options.band,depth:options.depth};
  }
  function value(entry){const result=clamp(entry.value+(entry.audio?audioLevel(entry.audio.band)*entry.audio.depth:0),entry.min,entry.max);return entry.kind==='toggle'?(result>=(entry.min+entry.max)/2?entry.max:entry.min):result;}
  function create({source,parsed,entries,pairs,active,write,say,snapshotContext}){
    let alive=true,randomUndo=null,audioTicket=0,pendingAudioBinding=null;const listeners=new Set();
    // Keep launch values outside snapshot state and live code rewrites.
    const launchValues=new Map(entries.map(entry=>[entry,entry.value]));
    const available=()=>alive&&active();
    const notify=()=>listeners.forEach(listener=>listener());
    function code(){
      const edits=entries.map(entry=>{
        let call=source.slice(entry.callFrom,entry.callTo);
        // Apply edits against original AST offsets, preserving comments, the step
        // expression and other arguments through repeated live changes.
        const args=entry.args||[],values=entry.stepEdited?[entry.value,entry.min,entry.max,entry.step==='any'?'undefined':entry.step]:entry.rangeEdited?[entry.value,entry.min,entry.max]:[entry.value],changes=[];
        values.forEach((next,index)=>{if(args[index])changes.push({...args[index],text:String(next)});});
        if(args.length<values.length){
          const last=args[args.length-1],at=last?last.to:entry.callTo-1;
          changes.push({from:at,to:at,text:(last?', ':'')+values.slice(args.length).join(', ')});
        }
        for(const edit of changes.sort((a,b)=>b.from-a.from||b.to-a.to))call=call.slice(0,edit.from-entry.callFrom)+edit.text+call.slice(edit.to-entry.callFrom);
        call=entry.kind+call.slice(entry.calleeTo-entry.callFrom);
        if(entry.kind!==entry.declaredKind&&(entry.kind==='toggle'||entry.declaredKind==='toggle'))call=entry.kind+'('+entry.value+', '+entry.min+', '+entry.max+', '+(entry.step==='any'?'undefined':entry.step)+')';
        const body=source.slice(entry.bodyFrom,entry.callFrom)+call+source.slice(entry.callTo,entry.bodyTo);
        return {from:entry.replaceFrom,to:entry.replaceTo,text:entry.audio?'audioMod('+body+', {band: '+entry.audio.band+', depth: '+String(entry.audio.depth)+'})':body};
      });
      const required=Math.max(0,...entries.filter(e=>e.audio&&e.audio.band<16).map(e=>e.audio.band+1));
      parsed.bins.forEach(bin=>{if(bin.value<required)edits.push({...bin,text:String(required)});});
      let output=source,previous=Infinity;
      for(const edit of edits.sort((a,b)=>b.from-a.from)){
        if(edit.to>previous)throw new Error('Ces contrôleurs imbriqués ne peuvent pas être édités automatiquement.');
        output=output.slice(0,edit.from)+edit.text+output.slice(edit.to);previous=edit.from;
      }
      output=window.PilamiNoteSources.write(output,model.notes?.data()||window.PilamiNoteSources.read(source));
      if(new TextEncoder().encode(output).length>65536)throw new Error('Le code dépasserait 64 Ko.');
      return output;
    }
    function change(action,midiEntries=null,keepRandom=false){
      if(!available())return false;
      const beforeRandom=randomUndo;
      const before=entries.map(entry=>({entry,value:entry.value,min:entry.min,max:entry.max,rangeEdited:entry.rangeEdited,stepEdited:entry.stepEdited,kind:entry.kind,step:entry.step,sliderStep:entry.sliderStep,audio:entry.audio?{...entry.audio}:null}));
      try{action();write(code());if(!keepRandom)randomUndo=null;model.snapshots?.edited(midiEntries);notify();return true;}
      catch(error){randomUndo=beforeRandom;before.forEach(({entry,...saved})=>Object.assign(entry,saved));say(error.message,true);notify();return false;}
    }
    function quantize(entry,next){const step=Number(entry.step);return clamp(step>0?Number((entry.min+Math.round((next-entry.min)/step)*step).toPrecision(14)):next,entry.min,entry.max);}
    const pads=pairs.slice(),used=new Set(pairs.flatMap(pair=>[pair.x,pair.y]));
    entries.forEach(x=>{
      const match=x.label.match(/^(.*?)[_]?[Xx]$/);if(!match||!match[1]||used.has(x))return;
      const prefix=match[1].replace(/_$/,'');const y=entries.find(e=>e!==x&&e.label.replace(/_?[Yy]$/,'')===prefix&&/[Yy]$/.test(e.label)&&!used.has(e));
      if(y){pads.push({title:prefix.replace(/_/g,' '),x,y});used.add(x);used.add(y);}
    });
    const model={
      entries,pads,selectedBand:null,audioFeedback:{text:'',error:false},available,
      subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
      defaultValue(entry){return launchValues.get(entry);},
      resetBase(target){
        const targets=[...new Set(Array.isArray(target)?target:[target])];
        if(!available()||!targets.length||targets.some(entry=>!launchValues.has(entry)))return false;
        model.midi?.cancelControls(targets);
        return change(()=>targets.forEach(entry=>{entry.value=quantize(entry,launchValues.get(entry));}));
      },
      setBase(entry,next){if(!Number.isFinite(next))return false;model.midi?.cancelControls([entry]);return change(()=>{entry.value=quantize(entry,next);});},
      setMidiValues(values){const valid=values.filter(({entry,value})=>entries.includes(entry)&&Number.isFinite(value));return valid.length?change(()=>valid.forEach(({entry,value,continuous})=>{entry.value=continuous&&entry.kind!=='toggle'&&!(Number(entry.step)>=1)?clamp(value,entry.min,entry.max):quantize(entry,value);}),valid.map(({entry})=>entry)):false;},
      setRange(entry,min,max){
        if(!available())return false;
        if(entry.kind==='toggle'){say('Un interrupteur garde ses bornes 0 et 1.',true);return false;}
        if(!Number.isFinite(min)||!Number.isFinite(max)||min>=max){say('Bornes : deux nombres finis et Min < Max sont requis.',true);return false;}
        if(entry.min===min&&entry.max===max)return true;
        model.midi?.cancelControls([entry]);return change(()=>{entry.min=min;entry.max=max;entry.rangeEdited=true;entry.value=clamp(entry.value,min,max);});
      },
      setXY(pair,x,y){model.midi?.cancelControls([pair.x,pair.y]);change(()=>{pair.x.value=quantize(pair.x,x);pair.y.value=quantize(pair.y,y);});},
      setKind(entry,kind){if(!['slider','knob','fader','toggle'].includes(kind))return;if(kind==='toggle'&&(entry.min!==0||entry.max!==1))return;model.midi?.cancelControls([entry]);change(()=>{entry.kind=kind;entry.step=kind==='toggle'?1:entry.sliderStep;if(kind==='toggle')entry.value=entry.value>=.5?1:0;});},
      cancelAudioBindings(){audioTicket++;},
      async bind(targets,band){
        if(!available()||!Number.isInteger(band)||band<0||band>47||!targets.length||targets.some(e=>!entries.includes(e)))return false;
        if(band>=16&&!model.notes.data().sources.some(s=>s.band===band))return false;
        // Several clicks while the audio permission is pending form one operation.
        if(pendingAudioBinding?.band===band&&pendingAudioBinding.ticket===audioTicket){targets.forEach(entry=>pendingAudioBinding.targets.add(entry));return pendingAudioBinding.promise;}
        const request={band,ticket:++audioTicket,targets:new Set(targets),promise:null};pendingAudioBinding=request;
        request.promise=(async()=>{
          try{const audio=await window.PilamiStrudelHydra.enableControlAudio(band<16?band:0);if(!available()||request.ticket!==audioTicket)return false;if(!audio?.stream?.active)throw Error('Entrée audio non connectée. Autorise le micro puis reconnecte.');
            const linked=[...request.targets],apply=()=>linked.forEach(entry=>{entry.audio={band,depth:entry.audio?.depth??(entry.max-entry.min)*.15};});
            if(change(apply)){model.audioFeedback={text:model.notes.label(band)+' lié à '+linked.map(e=>e.label).join(' + ')+'.',error:false};notify();return true;}return false;
          }catch(error){if(available()&&request.ticket===audioTicket){model.audioFeedback={text:error.message,error:true};notify();}return false;}
          finally{if(pendingAudioBinding===request)pendingAudioBinding=null;}
        })();return request.promise;
      },
      setDepth(entry,depth){if(Number.isFinite(depth))change(()=>{if(entry.audio)entry.audio.depth=depth;});},
      unlink(entry){audioTicket++;return change(()=>{entry.audio=null;});},
      selectBand(band){this.selectedBand=this.selectedBand===band?null:band;this.audioFeedback={text:'',error:false};notify();},
      finishAudioSelection(){this.selectedBand=null;this.audioFeedback={text:'',error:false};notify();},
      captureState(){return entries.map(e=>({label:e.label,kind:e.kind,value:e.value,min:e.min,max:e.max,step:e.step,sliderStep:e.sliderStep,audio:e.audio?{...e.audio}:null}));},
      applyState(state){
        const next=window.PilamiHydraSnapshots.validateState(state,entries);
        if(!next)return false;
        return change(()=>entries.forEach((entry,index)=>{const saved=next[index];if(entry.min!==saved.min||entry.max!==saved.max)entry.rangeEdited=true;if(entry.step!==saved.step)entry.stepEdited=true;Object.assign(entry,saved);}));
      },
      dispose(){alive=false;audioTicket++;model.notes?.dispose();randomUndo=null;model.midi?.dispose();model.snapshots?.dispose();listeners.clear();}
    };
    model.random={
      strength:randomStrength(),
      busy:()=>Boolean(model.snapshots?.state.running||model.snapshots?.state.busy),
      canUndo:()=>Boolean(randomUndo),
      setStrength(next){
        if(!available()||!Number.isFinite(next))return false;
        this.strength=Math.round(clamp(next,0,100));
        try{localStorage.setItem(randomStorageKey,String(this.strength));}catch(_){}
        notify();return true;
      },
      run(){
        if(!available()||!entries.length||this.busy())return false;
        const power=this.strength/100;if(power<=0)return false;
        model.midi?.cancelPending();
        const before=entries.map(entry=>entry.value);
        const next=entries.map(entry=>{
          if(entry.kind==='toggle')return Math.random()<power?(Math.random()<.5?entry.min:entry.max):entry.value;
          const sample=Math.random(),target=entry.min*(1-sample)+entry.max*sample;
          const next=quantize(entry,entry.value*(1-power)+target*power);
          return Number.isFinite(next)?next:entry.value;
        });
        if(next.every((value,index)=>value===before[index])){say('Random : aucune variation à cette puissance et avec ces pas.');return false;}
        const changed=change(()=>{entries.forEach((entry,index)=>{entry.value=next[index];});randomUndo=before;},null,true);
        if(changed)say('Random · puissance '+this.strength+' %. Capture un snapshot pour garder cette variation.');
        return changed;
      },
      undo(){
        if(!available()||this.busy()||!randomUndo)return false;
        model.midi?.cancelPending();
        const values=randomUndo.slice();
        const changed=change(()=>{entries.forEach((entry,index)=>{entry.value=values[index];});randomUndo=null;},null,true);
        if(changed)say('Random annulé · valeurs précédentes restaurées.');
        return changed;
      }
    };
    if(snapshotContext&&window.PilamiHydraSnapshots)model.snapshots=window.PilamiHydraSnapshots.create({model,source,context:snapshotContext,say,notify});
    if(model.snapshots&&window.PilamiHydraMidi)model.midi=window.PilamiHydraMidi.create(model);
    model.notes=window.PilamiNoteSources.create(model,source,(action=()=>{})=>change(action),say);
    return model;
  }
  function element(doc,tag,text,attributes={}){const node=doc.createElement(tag);if(text!==null)node.textContent=text;Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,value));return node;}
  function sourceDestinations(model,band){
    if(!model)return [];
    const labels=model.entries.filter(e=>e.audio?.band===band).map(entry=>{
      const pair=model.pads.find(p=>p.x===entry||p.y===entry);
      return entry.label+(pair?' ('+(pair.x===entry?'X':'Y')+' · '+pair.title+')':'');
    });
    if(model.notes.scriptEnabled(band))labels.push('Code du script · a.fft['+band+']');
    const trigger=model.notes.data().triggers.find(t=>t.band===band);
    if(trigger){const index=Number(trigger.target.split(':').pop())+1;labels.push((trigger.target.startsWith('morph:')?'Morpher vers le snapshot ':'Rappeler le snapshot ')+index);}
    return labels;
  }
  function mountNotes(bank,model,doc,refresh){
    const details=element(doc,'details',null,{class:'pilami-note-settings'}),summary=element(doc,'summary','Sources par note / fréquence');details.append(summary);bank.append(details);
    const actions=element(doc,'div',null,{class:'pilami-note-actions'}),add=element(doc,'button','+ Source personnalisée',{type:'button','data-note-add':''}),scale=element(doc,'button','+ C Mixophonic · 11 notes',{type:'button','data-note-scale':''}),referenceLabel=element(doc,'label','Diapason pour ajout · A4 = '),reference=element(doc,'input',null,{type:'number',min:'300',max:'600',step:'any','aria-label':'Diapason A4 en Hz',value:'440'});
    referenceLabel.append(reference,element(doc,'span','Hz'));actions.append(add,scale,referenceLabel);details.append(actions,element(doc,'p','Les fréquences sont en notation américaine : A4 = 440 Hz, G3 ≈ 196 Hz. Fréquences affichées sans décimales ; détection précise conservée. Largeur : demi-bande approximative à −3 dB ; les fréquences voisines sont atténuées progressivement. Clic droit sur une source : lier, déclencher ou régler.',{class:'pilami-control-help'}));
    const list=element(doc,'div',null,{class:'pilami-note-list'});details.append(list);
    const dialog=element(doc,'dialog',null,{class:'pilami-note-dialog','aria-label':'Source audio : réglages et liaisons'});bank.append(dialog);let listKey='',alive=true;
    function close(){dialog.close();dialog.replaceChildren();}
    function open(title){dialog.replaceChildren();dialog.append(element(doc,'h4',title));dialog.showModal();}
    function button(text,action){const b=element(doc,'button',text,{type:'button'});b.addEventListener('click',action);return b;}
    function message(text){let status=dialog.querySelector('[data-note-dialog-status]');if(!status){status=element(doc,'p','',{role:'status','data-note-dialog-status':'',class:'pilami-control-help'});dialog.append(status);}status.textContent=text;}
    function editor(source=null){
      if(!model?.available())return;const initial=source||{...window.PilamiNoteSources.defaults};open(source?'Réglages · '+source.name:'Nouvelle source audio');
      const form=element(doc,'form',null,{class:'pilami-note-form'}),fields={};
      const settings=[['name','Nom','text'],['frequency','Fréquence centrale (Hz)','number',20,20000],['width','Largeur ± (Hz)','number',1,1000],['gain','Sensibilité ×','number',.1,1000],['threshold','Seuil de frappe (0–1)','number',.01,1],['attack','Attaque du niveau (ms)','number',1,2000],['release','Relâchement du niveau (ms)','number',1,10000],['cooldown','Délai minimum entre frappes (ms)','number',50,10000],['retrigger','Nouvelle frappe : montée ×','number',1.1,10]];
      for(const [key,title,type,min,max]of settings){const label=element(doc,'label',title),input=element(doc,'input',null,{type,required:'','aria-label':title,'data-note-field':key});input.value=String(key==='frequency'?Math.trunc(initial[key]):initial[key]);if(type==='number'){input.min=min;input.max=max;input.step=key==='frequency'?'1':'any';}else input.maxLength=80;label.append(input);form.append(label);fields[key]=input;}
      const guardLabel=element(doc,'label','Réduire les déclenchements liés aux harmoniques'),guard=element(doc,'input',null,{type:'checkbox','aria-label':'Réduire les déclenchements liés aux harmoniques'});guard.checked=initial.guard;guardLabel.prepend(guard);form.append(guardLabel);
      const note=element(doc,'p','Le seuil porte sur le niveau après sensibilité. Commence à 0,18 : frappe la note et ajuste pour séparer bruit de fond et frappe. La protection des harmoniques est une aide ; les accords et les octaves peuvent demander des ajustements.',{class:'pilami-control-help'});form.append(note);
      const save=element(doc,'button','Appliquer',{type:'submit'}),buttons=element(doc,'div',null,{class:'pilami-note-actions'});buttons.append(save,button('Annuler',close));if(source)buttons.append(button('Supprimer',()=>{if(model.notes.remove(source.band)){close();refresh();}else message('Délie cette source des contrôleurs et des snapshots avant de la supprimer.');}));form.append(buttons);dialog.append(form);
      form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const s={...initial,guard:guard.checked};for(const [key,field]of Object.entries(fields))s[key]=key==='name'?field.value.trim():key==='frequency'&&field.value===String(Math.trunc(initial.frequency))?initial.frequency:Number(field.value);const ok=source?model.notes.update(s):model.notes.add(s);if(ok){close();refresh();}else message('Réglages non appliqués. La largeur doit rester inférieure à la fréquence ; vérifie aussi le message de Hydra.');});
    }
    async function route(band){
      if(!model?.available())return;open('Source audio · '+model.notes.label(band));
      const label=element(doc,'label','Destination '),select=element(doc,'select',null,{'aria-label':'Destination de la source audio','data-note-destination':''});
      select.append(element(doc,'option','Aucune destination — choisir une cible',{value:'','data-note-no-destination':''}));
      const controls=element(doc,'optgroup',null,{label:'Moduler un paramètre'});model.entries.forEach((e,i)=>controls.append(element(doc,'option',e.label,{value:'control:'+i})));select.append(controls);
      if(model.pads.length){const group=element(doc,'optgroup',null,{label:'Pads XY'});model.pads.forEach((p,i)=>{for(const [value,label]of [['x','X'],['y','Y'],['both','X + Y']])group.append(element(doc,'option',p.title+' · '+label,{value:'pad:'+i+':'+value}));});select.append(group);}
      if(model.snapshots){for(const [prefix,title]of [['snapshot:','Déclencher un snapshot'],['morph:snapshot:','Morpher vers un snapshot']]){const group=element(doc,'optgroup',null,{label:title});model.snapshots.state.slots.forEach((slot,i)=>{const opt=element(doc,'option','Snapshot '+(i+1)+(slot?'':' · vide'),{value:prefix+i});opt.disabled=!slot;group.append(opt);});select.append(group);}}
      label.append(select);dialog.append(label,element(doc,'p','Paramètres : niveau continu du son. Snapshots : une nouvelle frappe dépassant le seuil ; les frappes pendant un morphing sont ignorées.',{class:'pilami-control-help'}));
      const buttons=element(doc,'div',null,{class:'pilami-note-actions'}),apply=button('Lier',async()=>{
        const target=select.value;if(!target||select.selectedOptions[0]?.disabled)return;apply.disabled=true;
        try{if(target.startsWith('control:')){if(!await model.bind([model.entries[Number(target.split(':')[1])]],band))throw Error('Liaison non appliquée. Vérifie le message de Hydra.');}
          else if(target.startsWith('pad:')){const [,index,axis]=target.split(':'),p=model.pads[Number(index)];if(!await model.bind(axis==='both'?[p.x,p.y]:[p[axis]],band))throw Error('Liaison non appliquée.');}
          else{await model.notes.enable();if(!alive||!model.available())return;if(!model.notes.trigger(band,target))throw Error('Déclenchement non enregistré.');}
          close();refresh();
        }catch(error){message(error.message);}finally{apply.disabled=!select.value||Boolean(select.selectedOptions[0]?.disabled);}
      });
      select.value='';apply.disabled=true;select.addEventListener('change',()=>{apply.disabled=!select.value||Boolean(select.selectedOptions[0]?.disabled);});
      buttons.append(apply,button('Fermer',close));
      const source=model.notes.data().sources.find(s=>s.band===band);if(source)buttons.append(button('Régler la source',()=>editor(source)));
      const trigger=model.notes.data().triggers.find(t=>t.band===band);if(trigger){dialog.append(element(doc,'p','Déclenchement actuel : '+trigger.target.replace('morph:snapshot:','Morphing · snapshot ').replace('snapshot:','Snapshot ').replace(/\d+$/,x=>String(Number(x)+1)),{class:'pilami-control-help'}));buttons.append(button('Retirer le déclenchement',()=>{if(model.notes.trigger(band,null)){close();refresh();}}));}
      const muted=model.notes.isMuted(band);
      const scriptEnabled=model.notes.scriptEnabled(band);
      if(band<16&&model.notes.usesScriptSource(band)){
        dialog.append(element(doc,'p','Liaison dans le code : '+(scriptEnabled?'activée.':'désactivée. Les liaisons aux paramètres restent indépendantes.'),{class:'pilami-control-help'}));
        if(scriptEnabled)buttons.append(button('Désactiver la liaison du code',()=>{if(model.notes.disableScriptSource(band)){close();refresh();}}));
        else buttons.append(button('Réactiver la liaison du code',async()=>{try{await model.notes.enable();if(alive&&model.available()&&model.notes.enableScriptSource(band)){close();refresh();}}catch(error){message(error.message);}}));
      }
      const linked=model.entries.filter(e=>e.audio?.band===band);
      if(linked.length)dialog.append(element(doc,'p','Paramètres liés : '+linked.map(e=>e.label).join(', '),{class:'pilami-control-help'}));
      const unlink=button('Délier cette source',()=>{if(model.notes.unlinkSource(band)){close();refresh();}else message('Les liaisons n’ont pas été retirées. Vérifie le message de Hydra.');});
      unlink.dataset.noteUnlink=String(band);unlink.hidden=unlink.disabled=!linked.length&&!trigger&&!scriptEnabled;
      buttons.append(unlink);dialog.append(buttons);
    }
    add.addEventListener('click',()=>editor());scale.addEventListener('click',()=>{if(model?.notes.addScale(Number(reference.value)))refresh();});
    return{route,refresh(){const usable=Boolean(model?.available());add.disabled=scale.disabled=!usable;const data=model?.notes.data(),key=JSON.stringify(data||null);if(key===listKey)return;listKey=key;list.replaceChildren();if(!data)return;for(const s of data.sources){const row=element(doc,'div',null,{class:'pilami-note-row'});row.append(element(doc,'span',s.name+' · '+String(Math.trunc(s.frequency))+' Hz ± '+s.width),button('Régler',()=>editor(s)),button('Lier…',()=>route(s.band)));list.append(row);}if(!data.sources.length)list.append(element(doc,'p','Ajoute une note, ou charge les 11 notes de ton C Mixophonic.',{class:'pilami-control-help'}));},dispose(){alive=false;if(dialog.open)dialog.close();dialog.remove();}};
  }

  function mount(host,root,model){
    const doc=host.ownerDocument,win=doc.defaultView;let alive=true,frame=null,last=0,signature='',rows=[],pads=[],bankCount='',meters=[];
    const disclosures=root._pilamiControllerDisclosures||(root._pilamiControllerDisclosures={});
    function fold(key,title,body,help){const box=element(doc,'details',null,{class:'pilami-controller-section','data-controller-section':key});box.open=Boolean(disclosures[key]);box.append(element(doc,'summary',title));if(help)box.append(element(doc,'p',help,{class:'pilami-control-help'}));box.append(body);box.addEventListener('toggle',()=>{disclosures[key]=box.open;});return box;}
    const surface=element(doc,'div',null,{class:'pilami-controller-surface'}),bank=element(doc,'section',null,{class:'pilami-audio-bank','aria-label':'Sources audio'});
    const heading=element(doc,'div',null,{class:'pilami-audio-heading'}),connect=element(doc,'button','Activer l’entrée audio',{type:'button','data-control-audio-connect':''});
    heading.append(element(doc,'h4','Sources audio'),connect);
    const hint=element(doc,'p','Une source peut piloter plusieurs paramètres, chacun avec sa profondeur. Clique une source, puis les titres des paramètres ou les axes XY à lier. Termine avec Terminer les liaisons, ou reclique la source. Le glisser-déposer et le clic droit restent disponibles. Gris : aucune liaison. Mauve : liaison dans l’interface. Ambre : liaison dans le code.',{class:'pilami-control-help'});
    const sources=element(doc,'div',null,{class:'pilami-audio-sources'}),audioStatus=element(doc,'p','Lance un visuel pour activer l’entrée audio.',{class:'pilami-control-help','data-control-audio-status':'',role:'status'});
    bank.append(heading,hint,sources,audioStatus);
    const noteView=mountNotes(bank,model,doc,refresh);
    const empty=element(doc,'p','Aucun paramètre à ajuster ici. Les snapshots, le séquenceur et le panneau MIDI restent accessibles. Pour capturer une variation, lance un visuel contenant au moins un contrôleur.',{'data-control-empty':'',class:'pilami-control-help'}),content=element(doc,'div',null,{class:'pilami-control-grid'});
    const snapshotHost=element(doc,'div',null,{'data-snapshot-host':''}),midiHost=element(doc,'div',null,{'data-midi-host':''});
    const randomPanel=element(doc,'section',null,{class:'pilami-random-panel','aria-label':'Randomisation des contrôleurs','data-control-random-panel':''});
    const randomButton=element(doc,'button','Varier au hasard',{type:'button','data-control-random':'',title:'Faire varier les valeurs du preset courant dans leurs bornes Min–Max.'}),undoRandom=element(doc,'button','Annuler la variation',{type:'button','data-control-random-undo':''});
    const powerLabel=element(doc,'label','Puissance ',{class:'pilami-random-power'}),power=element(doc,'input',null,{type:'range',min:'0',max:'100',step:'1','aria-label':'Intensité de la variation','data-control-random-strength':''}),powerNumber=element(doc,'input',null,{type:'number',min:'0',max:'100',step:'1','aria-label':'Intensité de la variation en pourcentage','data-control-random-number':''});
    powerLabel.append(power,powerNumber,element(doc,'span','%'));
    const randomActions=element(doc,'div',null,{class:'pilami-random-actions'});randomActions.append(randomButton,powerLabel,undoRandom);
    randomPanel.append(randomActions,element(doc,'p','Petites variations à faible puissance · 100 % : toute la plage Min–Max. Les bornes et liaisons audio restent en place.',{class:'pilami-control-help'}));
    randomButton.addEventListener('click',()=>model?.random.run());undoRandom.addEventListener('click',()=>model?.random.undo());
    power.addEventListener('input',()=>model?.random.setStrength(Number(power.value)));
    function applyPower(){if(!powerNumber.value.trim()||!Number.isFinite(powerNumber.valueAsNumber)){powerNumber.setAttribute('aria-invalid','true');return;}powerNumber.removeAttribute('aria-invalid');model?.random.setStrength(powerNumber.valueAsNumber);powerNumber.value=String(model?.random.strength??20);}
    powerNumber.addEventListener('change',applyPower);powerNumber.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();applyPower();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();powerNumber.value=String(model?.random.strength??20);powerNumber.removeAttribute('aria-invalid');}});
    const parameters=element(doc,'section',null,{class:'pilami-controller-parameters','aria-label':'Paramètres du visuel'});
    const selection=element(doc,'div',null,{class:'pilami-audio-selection','data-control-audio-selection':''}),selectionText=element(doc,'p','',{class:'pilami-control-help',role:'status'}),finishSelection=element(doc,'button','Terminer les liaisons',{type:'button','data-control-audio-finish':''});selection.hidden=true;selection.append(selectionText,finishSelection);
    finishSelection.addEventListener('click',()=>model?.finishAudioSelection());
    surface.addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.defaultPrevented&&model?.selectedBand!==null&&model?.selectedBand!==undefined&&!event.target.closest('input,select,textarea,dialog,[contenteditable="true"]')){event.preventDefault();event.stopPropagation();model.finishAudioSelection();}});
    parameters.append(element(doc,'p','Ajuste ces paramètres pendant la lecture. Le code suit tes changements.',{class:'pilami-control-help'}),selection,empty,content);
    const snapshots=fold('snapshots','Snapshots · mémoriser et retrouver une variation',snapshotHost,'Capture tes réglages. Le bouton rappelle une capture ; sa flèche fait une transition vers elle.');
    const audioBox=fold('audio','Réagir au son · sources et liaisons audio',bank,'Active l’entrée audio, puis clique une source et le paramètre à faire varier.');
    const midiBox=fold('midi','Contrôler avec un appareil MIDI',midiHost,'Associe une note, un bouton ou un potentiomètre de ton appareil à une commande.');
    surface.append(parameters,randomPanel,snapshots,audioBox,midiBox);host.replaceChildren(surface);
    const midiOutputView=window.PilamiMidiOutput?.mount(surface);
    const performanceView=window.PilamiPerformance?.mount(parameters,root,model);
    const snapshotView=window.PilamiHydraSnapshots?.mount(snapshotHost,model?.snapshots),midiView=window.PilamiHydraMidi?.mount(midiHost,model?.midi);surface.classList.toggle('has-snapshots',Boolean(model?.snapshots));
    connect.addEventListener('click',async()=>{connect.disabled=true;try{await window.PilamiStrudelHydra.enableControlAudio(0,true);}catch(error){audioStatus.textContent=error.message;}finally{connect.disabled=false;refresh();}});
    function dropZone(node,targets){
      node.dataset.controlDrop=targets.map(entry=>entry.label).join('+');
      node.addEventListener('dragover',event=>{if(Array.from(event.dataTransfer.types).includes(MIME)){event.preventDefault();event.dataTransfer.dropEffect='link';node.classList.add('is-drop-target');}});
      node.addEventListener('dragleave',()=>node.classList.remove('is-drop-target'));
      node.addEventListener('drop',event=>{
        if(!Array.from(event.dataTransfer.types).includes(MIME))return;event.preventDefault();event.stopPropagation();node.classList.remove('is-drop-target');const raw=event.dataTransfer.getData(MIME);
        if(!/^\d+$/.test(raw))return;model.bind(targets,Number(raw));
      });
      node.addEventListener('click',event=>{const widget=event.target.closest('input,select,button,summary');if(widget&&widget!==node&&!widget.classList.contains('pilami-control-destination'))return;if(model.selectedBand!==null){event.preventDefault();event.stopPropagation();model.bind(targets,model.selectedBand);}});
    }
    function renderBank(){
      const count=Math.min(16,Math.max(5,window.PilamiStrudelHydra.audio()?.fft.length||0)),bands=[...Array.from({length:count},(_,i)=>i),...(model?.notes.data().sources.map(s=>s.band)||[])],key=bands.map(b=>b+':'+(model?.notes.label(b)||'')).join('|');if(key===bankCount)return;bankCount=key;sources.replaceChildren();
      meters=bands.map(band=>{
        const button=element(doc,'button',null,{type:'button',draggable:'true',class:'pilami-audio-source is-unlinked','data-audio-band':String(band),'aria-label':'Source audio a.fft['+band+']','aria-pressed':'false'}),meter=element(doc,'meter',null,{min:'0',max:'1',value:'0','aria-label':'Niveau de la bande '+band});
        button.append(element(doc,'span',model?.notes.label(band)||'a.fft['+band+']'),meter);
        if(band>=16){const s=model.notes.data().sources.find(s=>s.band===band);button.title=String(Math.trunc(s.frequency))+' Hz · ± '+s.width+' Hz · clic droit : réglages et liaison';}
        button.dataset.sourceTitle=button.title||'Bande audio '+band;
        button.addEventListener('contextmenu',event=>{event.preventDefault();if(model)noteView.route(band);});
        button.addEventListener('dragstart',event=>{event.dataTransfer.setData(MIME,String(band));event.dataTransfer.effectAllowed='link';});
        button.addEventListener('click',()=>{if(model){model.selectBand(band);refresh();}else audioStatus.textContent='Lance un visuel avec des contrôleurs avant de créer une liaison.';});sources.append(button);return{band,button,meter};
      });
    }
    function resetOnRightClick(widget,targets,after=()=>{}){
      widget.title=(widget.title?widget.title+' ':'')+'Clic droit : valeur au lancement du preset (dans les bornes actuelles).';
      widget.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();if(model.resetBase(targets))after();});
    }
    function makeCard(entry){
      const card=element(doc,'section',null,{class:'pilami-control-card','data-control-id':entry.id}),top=element(doc,'div',null,{class:'pilami-control-heading'});
      const title=element(doc,'button',entry.label,{type:'button',class:'pilami-control-destination','aria-label':'Lier une source à '+entry.label}),kind=element(doc,'select',null,{'aria-label':'Présentation de '+entry.label,'data-control-kind':entry.label});
      const kinds=[['slider','Curseur'],['knob','Potentiomètre'],['fader','Fader vertical']];if(entry.min===0&&entry.max===1)kinds.push(['toggle','Interrupteur']);
      kinds.forEach(([value,label])=>kind.append(element(doc,'option',label,{value})));kind.value=entry.kind;kind.addEventListener('change',()=>model.setKind(entry,kind.value));top.append(title);
      const control=element(doc,'div',null,{class:'pilami-control-value'}),input=element(doc,'input',null,{type:'range',min:entry.min,max:entry.max,step:entry.step,'aria-label':entry.label,'data-control-base':entry.label}),output=element(doc,'input',null,{type:'text',inputmode:'decimal',class:'pilami-control-number','aria-label':'Valeur manuelle de '+entry.label,'data-control-value':entry.label,autocomplete:'off',spellcheck:'false',title:'Entrée ou clic ailleurs : appliquer. Échap : annuler. Point ou virgule pour les décimales.'});input.value=entry.value;output.value=String(entry.value);
      const valueStatus=element(doc,'p','',{class:'pilami-control-help',role:'status','data-control-value-status':entry.label});valueStatus.hidden=true;
      let valueDraft=false;
      function cleanValue(){valueDraft=false;output.value=String(entry.value);output.removeAttribute('aria-invalid');valueStatus.hidden=true;}
      function applyValue(){
        if(!valueDraft)return;
        const raw=output.value.trim(),next=/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(raw)?Number(raw.replace(',','.')):NaN;
        if(!Number.isFinite(next)){output.setAttribute('aria-invalid','true');valueStatus.textContent='Saisis un nombre, ou Échap pour revenir à la valeur actuelle.';valueStatus.hidden=false;return;}
        if(model.setBase(entry,next))cleanValue();
        else{valueStatus.textContent='La valeur n’a pas été appliquée. Vérifie le message de Hydra.';valueStatus.hidden=false;}
      }
      output.addEventListener('input',()=>{valueDraft=true;output.removeAttribute('aria-invalid');valueStatus.hidden=true;if(model.snapshots?.state.running)model.snapshots.stop();});
      output.addEventListener('blur',applyValue);
      output.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();applyValue();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cleanValue();}});
      input.addEventListener('input',()=>model.setBase(entry,Number(input.value)));control.append(input,output);
      const knob=element(doc,'button',null,{type:'button',class:'pilami-knob','aria-label':entry.label,title:'Glisse verticalement. Maj : réglage fin. Les flèches fonctionnent aussi.',role:'slider',tabindex:'0','aria-valuemin':entry.min,'aria-valuemax':entry.max,'data-control-knob':entry.label}),needle=element(doc,'span',null,{class:'pilami-knob-needle'});knob.append(needle);knob.hidden=entry.kind!=='knob';
      knob.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();const startY=event.clientY,start=entry.value;knob.setPointerCapture(event.pointerId);const move=next=>model.setBase(entry,start+(startY-next.clientY)*(entry.max-entry.min)/180*(next.shiftKey ? 0.1 : 1));const end=()=>{knob.removeEventListener('pointermove',move);knob.removeEventListener('pointerup',end);knob.removeEventListener('pointercancel',end);};knob.addEventListener('pointermove',move);knob.addEventListener('pointerup',end);knob.addEventListener('pointercancel',end);});
      knob.addEventListener('keydown',event=>{const step=Number(entry.step)>0?Number(entry.step):(entry.max-entry.min)/100;let next;if(['ArrowUp','ArrowRight'].includes(event.key))next=entry.value+step;if(['ArrowDown','ArrowLeft'].includes(event.key))next=entry.value-step;if(event.key==='Home')next=entry.min;if(event.key==='End')next=entry.max;if(next!==undefined){event.preventDefault();model.setBase(entry,next);}});
      const toggle=element(doc,'button','Activer',{type:'button',class:'pilami-toggle',role:'switch','aria-label':entry.label,'aria-checked':'false','data-control-toggle':entry.label});toggle.hidden=entry.kind!=='toggle';toggle.addEventListener('click',()=>model.setBase(entry,entry.value>=.5?0:1));
      for(const widget of [input,output,knob,toggle])resetOnRightClick(widget,entry,cleanValue);
      input.hidden=['knob','toggle'].includes(entry.kind);input.classList.toggle('pilami-fader',entry.kind==='fader');control.prepend(knob,toggle);
      const effective=element(doc,'p',null,{class:'pilami-control-help','data-control-effective':entry.label}),effectiveLabel=element(doc,'span','Valeur manuelle'),effectiveDetail=element(doc,'span','',{'data-control-effective-detail':''});effective.append(effectiveLabel,effectiveDetail);card.append(top,control,valueStatus,effective);
      const bounds=element(doc,'div',null,{class:'pilami-control-bounds','data-control-bounds':entry.label});
      const minLabel=element(doc,'label','Min '),maxLabel=element(doc,'label','Max ');
      const min=element(doc,'input',null,{type:'number',step:'any','aria-label':'Minimum de '+entry.label,'data-control-min':entry.label});min.value=String(entry.min);
      const max=element(doc,'input',null,{type:'number',step:'any','aria-label':'Maximum de '+entry.label,'data-control-max':entry.label});max.value=String(entry.max);
      const apply=element(doc,'button','Appliquer',{type:'button','aria-label':'Appliquer les bornes de '+entry.label,'data-control-range-apply':entry.label});
      const rangeStatus=element(doc,'p','',{class:'pilami-control-help pilami-range-status',role:'status','data-control-range-status':entry.label});rangeStatus.hidden=true;
      let rangeDraft=false;
      function cleanRange(){rangeDraft=false;min.value=String(entry.min);max.value=String(entry.max);rangeStatus.hidden=true;min.removeAttribute('aria-invalid');max.removeAttribute('aria-invalid');}
      function applyRange(){
        const low=min.value.trim()?min.valueAsNumber:NaN,high=max.value.trim()?max.valueAsNumber:NaN;
        if(!Number.isFinite(low)||!Number.isFinite(high)||low>=high){
          rangeStatus.textContent='Saisis deux nombres avec Min < Max.';rangeStatus.hidden=false;min.setAttribute('aria-invalid','true');max.setAttribute('aria-invalid','true');return;
        }
        if(model.setRange(entry,low,high))cleanRange();
        else{rangeStatus.textContent='Les bornes n’ont pas été appliquées. Vérifie le message de Hydra.';rangeStatus.hidden=false;}
      }
      [min,max].forEach(field=>{field.addEventListener('input',()=>{rangeDraft=true;rangeStatus.hidden=true;min.removeAttribute('aria-invalid');max.removeAttribute('aria-invalid');if(model.snapshots?.state.running)model.snapshots.stop();});field.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();applyRange();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cleanRange();}});});
      apply.addEventListener('click',applyRange);minLabel.append(min);maxLabel.append(max);bounds.append(minLabel,maxLabel,apply,rangeStatus);bounds.hidden=entry.kind==='toggle';
      const advanced=element(doc,'details',null,{class:'pilami-control-advanced','data-control-advanced':entry.id});advanced.open=Boolean(disclosures['control:'+entry.id]);
      advanced.append(element(doc,'summary','Réglages du contrôleur'));const kindLabel=element(doc,'label','Présentation ');kindLabel.append(kind);advanced.append(kindLabel,bounds);
      advanced.addEventListener('toggle',()=>{disclosures['control:'+entry.id]=advanced.open;});card.append(advanced);
      let depth=null;
      if(entry.audio){
        const routing=element(doc,'div',null,{class:'pilami-audio-routing'}),source=element(doc,'select',null,{'aria-label':'Bande audio de '+entry.label,'data-control-band':entry.label});
        const count=Math.max(5,window.PilamiStrudelHydra.audio()?.fft.length||0,entry.audio.band+1);for(let band=0;band<Math.min(16,count);band++)source.append(element(doc,'option','a.fft['+band+']',{value:String(band)}));model.notes.data().sources.forEach(s=>source.append(element(doc,'option',s.name,{value:String(s.band)})));source.value=entry.audio.band;source.addEventListener('change',()=>model.bind([entry],Number(source.value)));
        const label=element(doc,'label','Profondeur ');depth=element(doc,'input',null,{type:'number',step:'any','aria-label':'Profondeur audio de '+entry.label,'data-control-depth':entry.label});depth.value=number(entry.audio.depth);depth.addEventListener('input',()=>{if(model.snapshots?.state.running)model.snapshots.stop();});depth.addEventListener('change',()=>{if(depth.value.trim())model.setDepth(entry,Number(depth.value));else refresh();});label.append(depth);
        const remove=element(doc,'button','Délier',{type:'button','data-control-unlink':entry.label});remove.addEventListener('click',()=>model.unlink(entry));routing.append(source,label,remove);card.append(routing);
      }
      const midiActions=element(doc,'div',null,{class:'pilami-control-midi-actions'}),midiButton=element(doc,'button',null,{type:'button',class:'pilami-midi-control-learn','data-control-midi':entry.label,'aria-label':'Apprendre le MIDI pour '+entry.label}),midiUnlink=element(doc,'button','Délier MIDI',{type:'button',class:'pilami-midi-control-unlink','data-control-midi-unlink':entry.label,'aria-label':'Délier le MIDI de '+entry.label});const midiIcon=element(doc,'span',null,{class:'pilami-midi-learn-icon','aria-hidden':'true'});midiIcon.style.maskImage=midiIcon.style.webkitMaskImage='url('+JSON.stringify(midiLearnIconURL)+')';midiButton.append(midiIcon);midiButton.addEventListener('click',()=>{const target='control:'+model.entries.indexOf(entry),learning=window.PilamiHydraMidi?.state.learning;if(learning?.owner===model.midi&&learning.target===target)model.midi.cancel();else model.midi?.learn(target);});midiUnlink.addEventListener('click',()=>{if(model.midi?.remove('control:'+model.entries.indexOf(entry)))midiButton.focus();});top.append(midiButton);midiActions.append(midiUnlink);card.append(midiActions);
      const midiInvert=element(doc,'button','+',{type:'button',class:'pilami-midi-control-invert','data-control-midi-invert':entry.label,'aria-label':'Inverser plage MIDI de '+entry.label,'aria-pressed':'false',title:'Inverser plage MIDI'});midiInvert.hidden=true;midiInvert.addEventListener('click',()=>{const target='control:'+model.entries.indexOf(entry),binding=model.midi?.mappings().find(m=>m.target===target);if(binding)model.midi.setInverted(target,!binding.inverted);});midiActions.append(midiInvert);
      dropZone(card,[entry]);content.append(card);return{entry,input,output,midiButton,midiUnlink,midiInvert,midiActions,knob,needle,toggle,effective,effectiveLabel,effectiveDetail,depth,kind,bounds,min,max,rangeDraft:()=>rangeDraft,valueDraft:()=>valueDraft};
    }
    function makePad(pair){
      const card=element(doc,'section',null,{class:'pilami-xy-card','data-control-pad':pair.title}),title=element(doc,'h4',pair.title+' · Pad XY'),zones=element(doc,'div',null,{class:'pilami-xy-zones'});
      const x=element(doc,'button','Lier X · '+pair.x.label,{type:'button','data-control-axis':'x'}),y=element(doc,'button','Lier Y · '+pair.y.label,{type:'button','data-control-axis':'y'});dropZone(x,[pair.x]);dropZone(y,[pair.y]);zones.append(x,y);
      const pad=element(doc,'div',null,{class:'pilami-xy-pad',tabindex:'0',role:'group','aria-label':pair.title+' : flèches pour déplacer X et Y','data-xy-surface':pair.title}),dot=element(doc,'span',null,{class:'pilami-xy-dot'}),base=element(doc,'span',null,{class:'pilami-xy-base'});pad.append(base,dot);dropZone(pad,[pair.x,pair.y]);
      pad.addEventListener('pointerdown',event=>{
        if(event.button!==0||model.selectedBand!==null)return;event.preventDefault();pad.focus();pad.setPointerCapture(event.pointerId);
        const move=next=>{const bounds=pad.getBoundingClientRect();model.setXY(pair,pair.x.min+clamp((next.clientX-bounds.left)/bounds.width,0,1)*(pair.x.max-pair.x.min),pair.y.max-clamp((next.clientY-bounds.top)/bounds.height,0,1)*(pair.y.max-pair.y.min));};
        const end=()=>{pad.removeEventListener('pointermove',move);pad.removeEventListener('pointerup',end);pad.removeEventListener('pointercancel',end);};move(event);pad.addEventListener('pointermove',move);pad.addEventListener('pointerup',end);pad.addEventListener('pointercancel',end);
      });
      resetOnRightClick(pad,[pair.x,pair.y]);
      pad.addEventListener('keydown',event=>{const stepX=Number(pair.x.step)>0?Number(pair.x.step):(pair.x.max-pair.x.min)/100,stepY=Number(pair.y.step)>0?Number(pair.y.step):(pair.y.max-pair.y.min)/100;let dx=0,dy=0;if(event.key==='ArrowLeft')dx=-stepX;if(event.key==='ArrowRight')dx=stepX;if(event.key==='ArrowUp')dy=stepY;if(event.key==='ArrowDown')dy=-stepY;if(dx||dy){event.preventDefault();model.setXY(pair,pair.x.value+dx,pair.y.value+dy);}});
      const output=element(doc,'output','');card.append(title,zones,pad,output,element(doc,'p','Glisse ici une bande pour lier X et Y ensemble. Le point plein suit le son ; le cercle indique la position manuelle. Clic droit : réinitialiser X et Y.',{class:'pilami-control-help'}));content.append(card);return{pair,dot,base,output,xButton:x,yButton:y};
    }
    function render(){
      if(!model)return;const next=model.entries.map(entry=>entry.id+':'+entry.kind+':'+(entry.audio?entry.audio.band:'-')).join('|')+JSON.stringify(model.notes.data().sources.map(s=>[s.band,s.name]));if(next===signature)return;signature=next;content.replaceChildren();pads=model.pads.map(makePad);rows=model.entries.map(makeCard);
    }
    function refresh(){
      if(!alive)return;renderBank();render();snapshotView?.refresh();midiView?.refresh();noteView.refresh();empty.hidden=Boolean(model?.entries.length);snapshots.hidden=!model?.snapshots;midiBox.hidden=!model?.midi;
      randomPanel.hidden=!model?.entries.length;
      if(model?.random){const usable=model.available(),busy=model.random.busy();randomButton.disabled=!usable||busy||model.random.strength===0;undoRandom.disabled=!usable||busy||!model.random.canUndo();power.disabled=powerNumber.disabled=!usable;if(doc.activeElement!==power)power.value=String(model.random.strength);if(doc.activeElement!==powerNumber)powerNumber.value=String(model.random.strength);}
      const audio=window.PilamiStrudelHydra.audio();connect.textContent=audio?.stream?.active?'Reconnecter l’entrée audio':'Activer l’entrée audio';
      const mic=root.querySelector('[data-hydra-audio-status]')?.textContent;
      const selected=model?.selectedBand!==null&&model?.selectedBand!==undefined;
      selection.hidden=!selected;
      if(selected){const destinations=sourceDestinations(model,model.selectedBand),text=model.notes.label(model.selectedBand)+' → '+(destinations.length?destinations.join(' · '):'aucun paramètre lié')+' · Clique d’autres titres pour ajouter des liaisons.';if(selectionText.textContent!==text)selectionText.textContent=text;}
      audioStatus.classList.toggle('is-error',Boolean(model?.audioFeedback.error));
      if(model?.audioFeedback.error){audioStatus.textContent=model.audioFeedback.text;}
      else if(selected){
        const destinations=sourceDestinations(model,model.selectedBand),label=model.notes.label(model.selectedBand);
        const text=destinations.length?label+' → '+destinations.join(' · ')+' · Clique d’autres titres pour ajouter des liaisons ; clic droit pour modifier ou délier.':label+' · Aucune liaison : clique une ou plusieurs destinations.';
        if(audioStatus.textContent!==text)audioStatus.textContent=text;
      }else if(model?.audioFeedback.text){if(audioStatus.textContent!==model.audioFeedback.text)audioStatus.textContent=model.audioFeedback.text;}
      else{const text=mic?mic+' · '+(audio?.fft.length||0)+' bandes, des graves aux aigus.':audio?.stream?.active?'Entrée audio active · clique une source pour créer des liaisons.':'Lance un visuel puis active l’entrée audio pour créer des liaisons.';if(audioStatus.textContent!==text)audioStatus.textContent=text;}
      meters.forEach(({band,button,meter})=>{
        const targets=(model?.entries||[]).filter(e=>e.audio?.band===band),trigger=model?.notes.data().triggers.find(t=>t.band===band),linked=targets.length>0||Boolean(trigger)||Boolean(model?.notes.scriptEnabled(band));
        button.classList.toggle('is-linked',linked);button.classList.toggle('is-script-linked',Boolean(model?.notes.scriptEnabled(band)));button.classList.toggle('has-control-link',targets.length>0||Boolean(trigger));button.classList.toggle('is-unlinked',!linked);button.dataset.sourceLinked=String(linked);
        button.setAttribute('aria-label','Source audio '+(model?.notes.label(band)||'a.fft['+band+']')+(linked?' · liée':' · non liée'));
        button.title=button.dataset.sourceTitle+(model?.notes.isMuted(band)?' · FFT neutralisée dans le script':'')+(linked?' · Liée : '+sourceDestinations(model,band).join(', '):' · Aucune liaison');
        meter.value=audioLevel(band);button.classList.toggle('is-note-hit',linked&&Boolean(model?.notes.flash(band)));button.setAttribute('aria-pressed',String(model?.selectedBand===band));button.classList.toggle('is-selected',model?.selectedBand===band);button.classList.toggle('is-unavailable',!audio||(band<16&&band>=audio.fft.length));});
      rows.forEach(row=>{const e=row.entry,current=value(e),target='control:'+model.entries.indexOf(e),binding=model.midi?.mappings().find(m=>m.target===target),learning=window.PilamiHydraMidi?.state.learning;
        const waiting=learning?.owner===model.midi&&learning.target===target;row.midiButton.classList.toggle('is-learning',waiting);row.midiButton.classList.toggle('has-midi',Boolean(binding));row.midiButton.setAttribute('aria-busy',String(waiting));row.midiButton.setAttribute('aria-label',(waiting?'Annuler l’apprentissage MIDI pour ':'Apprendre le MIDI pour ')+e.label);row.midiButton.title=waiting?'En attente MIDI · clique pour annuler':binding?'MIDI Learn · '+window.PilamiHydraMidi.describe(binding)+' · clique pour réapprendre':'MIDI Learn · clique puis envoie un message MIDI';row.midiButton.hidden=!model.midi;row.midiButton.disabled=Boolean(window.PilamiHydraMidi?.state.busy)||!model.available();
        row.midiUnlink.hidden=!binding;row.midiActions.hidden=!model.midi||!binding;
        row.midiInvert.hidden=binding?.type!=='cc';row.midiInvert.textContent=binding?.inverted?'−':'+';row.midiInvert.setAttribute('aria-pressed',String(Boolean(binding?.inverted)));row.midiInvert.title='Inverser plage MIDI · '+(binding?.inverted?'sens inversé : 0 → Max, 127 → Min':'sens normal : 0 → Min, 127 → Max');
        row.input.min=e.min;row.input.max=e.max;row.input.step=e.step;row.knob.setAttribute('aria-valuemin',e.min);row.knob.setAttribute('aria-valuemax',e.max);
        if(!row.rangeDraft()){row.min.value=String(e.min);row.max.value=String(e.max);}
        const toggleOption=row.kind.querySelector('option[value="toggle"]');
        if(e.min===0&&e.max===1){if(!toggleOption)row.kind.append(element(doc,'option','Interrupteur',{value:'toggle'}));}else toggleOption?.remove();
        if(row.input.value!==String(e.value))row.input.value=e.value;if(!row.valueDraft())row.output.value=String(e.value);row.knob.setAttribute('aria-valuenow',number(e.value));row.needle.style.transform='rotate('+(-135+(e.value-e.min)/(e.max-e.min)*270)+'deg)';row.toggle.setAttribute('aria-checked',String(e.value>=.5));row.toggle.textContent=e.value>=.5?'Activé':'Désactivé';
        const effectiveLabel=e.audio?'Valeur avec audio':'Valeur manuelle',effectiveDetail=e.audio?number(current)+' · '+model.notes.label(e.audio.band)+' × '+number(e.audio.depth):'';
        if(row.effectiveLabel.textContent!==effectiveLabel)row.effectiveLabel.textContent=effectiveLabel;if(row.effectiveDetail.textContent!==effectiveDetail)row.effectiveDetail.textContent=effectiveDetail;row.effective.title=effectiveLabel+(effectiveDetail?' : '+effectiveDetail:'');
        if(row.depth&&doc.activeElement!==row.depth)row.depth.value=number(e.audio.depth);
      });
      pads.forEach(({pair,dot,base,output,xButton,yButton})=>{const x=value(pair.x),y=value(pair.y);dot.style.left=(x-pair.x.min)/(pair.x.max-pair.x.min)*100+'%';dot.style.top=(pair.y.max-y)/(pair.y.max-pair.y.min)*100+'%';base.style.left=(pair.x.value-pair.x.min)/(pair.x.max-pair.x.min)*100+'%';base.style.top=(pair.y.max-pair.y.value)/(pair.y.max-pair.y.min)*100+'%';output.textContent='X '+number(x)+' · Y '+number(y);[[xButton,pair.x,'X'],[yButton,pair.y,'Y']].forEach(([button,entry,axis])=>{button.textContent=entry.audio?axis+' · '+model.notes.label(entry.audio.band)+' × '+number(entry.audio.depth):'Lier '+axis+' · '+entry.label;button.classList.toggle('has-audio',Boolean(entry.audio));});});
    }
    // The existing 20 Hz UI clock is sufficient during morphing; model values
    // and the renderer still advance on every animation frame. Refresh endpoints
    // and direct edits immediately.
    const unsubscribe=model?.subscribe(()=>{if(!model.snapshots?.state.running)refresh();});
    function tick(now){if(!alive||win.closed||!host.isConnected)return;if(now-last>=50){last=now;refresh();}frame=win.requestAnimationFrame(tick);}
    refresh();frame=win.requestAnimationFrame(tick);
    return{refresh,dispose(){alive=false;midiOutputView?.dispose();performanceView?.dispose();unsubscribe?.();snapshotView?.dispose();midiView?.dispose();noteView.dispose();if(frame&&!win.closed)win.cancelAnimationFrame(frame);}};
  }
  window.PilamiHydraControls={create,mount,value,validateAudio,audioLevel,cssURL};
})();
