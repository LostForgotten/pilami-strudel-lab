// Pilami Hydra MIDI Learn. AGPL-3.0-or-later. No MIDI permission requested on load.
(function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),listeners=new Set(),attached=new Map();
  const midiLearnIconURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDcuMS1jMDAwIDc5LmRhYmFjYmIsIDIwMjEvMDQvMTQtMDA6Mzk6NDQgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NjQ4ODljY2MtYWNjMy1lYjQ3LWFjMWItZDcxMjI2NGJiYzE0IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkE3OTVGNjQ0QzY3RDExRjFCQTBCQ0QzOUM0NENGNkU4IiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkE3OTVGNjQzQzY3RDExRjFCQTBCQ0QzOUM0NENGNkU4IiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMy4wIChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjY0ODg5Y2NjLWFjYzMtZWI0Ny1hYzFiLWQ3MTIyNjRiYmMxNCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo2NDg4OWNjYy1hY2MzLWViNDctYWMxYi1kNzEyMjY0YmJjMTQiLz4g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";
  const smoothingKey='pilami-hydra-midi-smoothing-ms-v1';
  function readSmoothing(){try{const raw=localStorage.getItem(smoothingKey),value=Number(raw);return raw!==null&&raw.trim()!==''&&Number.isFinite(value)?Math.round(clamp(value,0,300)):60;}catch(_){return 60;}}
  const state={enabled:false,busy:false,inputs:[],input:'*',channel:'*',smoothing:readSmoothing(),learning:null,last:'Aucun message reçu.',message:'Active le MIDI, puis choisis une destination à apprendre.',error:false};
  let midiAccess=null,pendingAccess=null,pendingConnect=null,active=null,library=null;
  const emit=()=>listeners.forEach(fn=>fn());
  const say=(message,error=false)=>{state.message=message;state.error=error;emit();};
  const targets=model=>[
    ...model.entries.map((entry,index)=>({id:'control:'+index,label:entry.label,cc:true,note:entry.kind==='toggle'})),
    ...Array.from({length:10},(_,i)=>({id:'snapshot:'+i,label:'Rappeler le snapshot '+(i+1),cc:true,note:true})),
    ...Array.from({length:10},(_,i)=>({id:'morph:snapshot:'+i,label:'Morpher vers le snapshot '+(i+1),cc:true,note:true})),
    ...[['forward','Morphing A → B'],['reverse','Morphing B → A'],['stop','Pause du morphing'],['position','Position du morphing'],['duration','Durée du morphing · 0,1 à 30 s']].map(([id,label])=>({id:'morph:'+id,label,cc:true,note:!['position','duration'].includes(id)}))
  ];
  function validate(data,entries){
    if(data===undefined||data===null)return null;
    if(data.version!==1||!Array.isArray(data.mappings)||data.mappings.length>153)return null;
    const result=[],seen=new Set(),sources=[];
    for(const m of data.mappings){
      if(!m||!/^control:(?:0|[1-9][0-9]{0,2})$|^snapshot:[0-9]$|^morph:snapshot:[0-9]$|^morph:(?:forward|reverse|stop|position|duration)$/.test(m.target)||!['note','cc'].includes(m.type)||!Number.isInteger(m.number)||m.number<0||m.number>127||!Number.isInteger(m.channel)||m.channel<0||m.channel>15||seen.has(m.target))return null;
      if(['morph:position','morph:duration'].includes(m.target)&&m.type!=='cc')return null;
      if(m.inverted!==undefined&&(typeof m.inverted!=='boolean'||m.type!=='cc'||!m.target.startsWith('control:')))return null;
      if(!['inputId','inputName','manufacturer','label'].every(k=>typeof m[k]==='string'&&m[k].length<=256)||(!m.inputId&&!m.inputName))return null;
      const index=m.target.startsWith('control:')?Number(m.target.split(':')[1]):-1;
      if(index>=128||(entries&&index>=0&&(!entries[index]||entries[index].label!==m.label)))return null;
      if(sources.some(other=>sameSource(m,other)&&!canShare(m,other)))return null;sources.push(m);
      seen.add(m.target);result.push({target:m.target,label:m.label,type:m.type,number:m.number,channel:m.channel,inputId:m.inputId,inputName:m.inputName,manufacturer:m.manufacturer,...(m.inverted===true?{inverted:true}:{})});
    }
    return{version:1,mappings:result};
  }
  function sameSource(a,b){return a.type===b.type&&a.number===b.number&&a.channel===b.channel&&((a.inputId&&a.inputId===b.inputId)||(a.inputName&&a.inputName===b.inputName&&a.manufacturer===b.manufacturer));}
  function canShare(a,b){return a.type==='cc'&&b.type==='cc'&&a.target.startsWith('control:')&&b.target.startsWith('control:');}
  function portMatches(mapping,input){
    if(mapping.inputId===input.id)return true;
    // Browser IDs can differ on another computer. Fall back only to a unique name.
    return Boolean(mapping.inputName&&mapping.inputName===(input.name||'')&&mapping.manufacturer===(input.manufacturer||'')&&state.inputs.filter(p=>p.name===mapping.inputName&&p.manufacturer===mapping.manufacturer).length===1);
  }
  function parse(event){
    const bytes=event.data;if(!bytes||bytes.length<3)return null;const status=bytes[0],kind=status&240;
    if(![128,144,176].includes(kind)||![...bytes].every(v=>Number.isInteger(v)&&v>=0&&v<=255)||bytes[1]>127||bytes[2]>127)return null;
    return{type:kind===176?'cc':'note',number:bytes[1],value:bytes[2],channel:status&15,pressed:kind===144&&bytes[2]>0,input:event.target};
  }
  function handle(event){
    if(!state.enabled)return;const message=parse(event);if(!message||!message.input)return;
    if((state.input!=='*'&&message.input.id!==state.input)||(state.channel!=='*'&&message.channel!==Number(state.channel)))return;
    state.last=(message.input.name||'Entrée MIDI')+' · canal '+(message.channel+1)+' · '+(message.type==='cc'?'CC ':'Note ')+message.number+' · '+message.value;
    if(active?.model.available())active.receive(message);
  }
  function refreshPorts(){
    const current=new Map();for(const input of midiAccess?.inputs.values()||[]){if(input.state==='disconnected')continue;current.set(input.id,input);const old=attached.get(input.id);if(old!==input){old?.removeEventListener('midimessage',handle);input.addEventListener('midimessage',handle);attached.set(input.id,input);}}
    for(const [id,input]of attached)if(!current.has(id)){input.removeEventListener('midimessage',handle);attached.delete(id);}
    state.inputs=[...current.values()].map(p=>({id:p.id,name:p.name||'',manufacturer:p.manufacturer||''}));
    active?.cancelPending();active?.resetGates();if(state.enabled)say(state.inputs.length?'MIDI actif · '+state.inputs.length+' entrée(s) disponible(s).':'MIDI actif · branche une entrée MIDI ou ouvre ton port virtuel.');else emit();
  }
  async function access(){
    if(midiAccess)return midiAccess;if(pendingAccess)return pendingAccess;
    if(typeof navigator.requestMIDIAccess!=='function')throw Error(window.isSecureContext===false?'Le MIDI nécessite HTTPS ou un serveur local sur localhost.':'Ce navigateur ne propose pas l’accès MIDI. Essaie un navigateur compatible Web MIDI.');
    pendingAccess=navigator.requestMIDIAccess({sysex:false}).then(result=>{midiAccess=result;result.addEventListener('statechange',refreshPorts);refreshPorts();return result;}).finally(()=>{pendingAccess=null;});return pendingAccess;
  }
  function connect(){
    if(state.enabled&&midiAccess)return Promise.resolve(true);if(pendingConnect)return pendingConnect;
    state.busy=true;say('Autorisation MIDI…');
    pendingConnect=(async()=>{try{await access();state.enabled=true;refreshPorts();return true;}
      catch(error){state.enabled=false;say('Accès MIDI impossible : '+error.message+' Autorise le MIDI pour cette page dans ton navigateur.',true);return false;}
      finally{state.busy=false;pendingConnect=null;emit();}})();return pendingConnect;
  }
  function disconnect(){state.enabled=false;state.learning=null;active?.cancelPending();active?.resetGates();library?.midi.pause();say('MIDI désactivé. Les associations sont conservées.');}
  function create(model){
    let alive=true,frame=null,frameHost=null,learnTicket=0;const pending=new Map(),gates=new Map(),hosts=new Set();
    const mappings=()=>model.snapshots.state.midi?.mappings||[];
    function cancelPending(){if(frame!==null){frameHost.cancelAnimationFrame(frame);frame=null;}pending.clear();}
    function schedule(){
      if(frame!==null||!pending.size)return;
      let host=window.PilamiStrudelVisuals?.animationHost?.()||window;for(const candidate of hosts)if(!candidate.closed&&candidate.document.visibilityState==='visible')host=candidate;
      frameHost=host;frame=host.requestAnimationFrame(flush);
    }
    function cancelControls(entries){for(const entry of entries)pending.delete('control:'+model.entries.indexOf(entry));if(!pending.size)cancelPending();}
    function flush(){
      frame=null;if(!alive||active!==api||!state.enabled||!model.available()){pending.clear();return;}
      const work=new Map(),values=[],now=performance.now();
      for(const [target,ramp]of pending){
        // Use the opener's clock: detached windows have different RAF time origins.
        const progress=ramp.duration?clamp((now-ramp.started)/ramp.duration,0,1):1;
        const value=progress===1?ramp.to:ramp.from+(ramp.to-ramp.from)*progress;
        if(progress===1)pending.delete(target);
        if(target.startsWith('control:')){
          const entry=model.entries[Number(target.split(':')[1])];
          if(!entry||entry!==ramp.entry||entry.kind!==ramp.kind||entry.min!==ramp.min||entry.max!==ramp.max||entry.step!==ramp.step){pending.delete(target);continue;}
          values.push({entry,value,continuous:ramp.duration>0});
        }else work.set(target,value);
      }
      if(values.length&&model.setMidiValues(values)===false){cancelPending();return;}
      if(work.has('morph:duration'))model.snapshots.setDuration(Number((.1+work.get('morph:duration')*29.9).toFixed(3)));
      if(work.has('morph:position')&&!model.snapshots.morph(work.get('morph:position')))say('Capture deux snapshots et choisis De / Vers pour piloter le morphing.',true);
      schedule();
    }
    function enqueue(target,value){
      const entry=target.startsWith('control:')?model.entries[Number(target.split(':')[1])]:null;
      if(target.startsWith('control:')&&!entry)return;
      let to=value,duration=0;
      if(entry){
        const mapped=entry.min+value*(entry.max-entry.min),step=Number(entry.step);
        to=entry.kind==='toggle'?(value>=.5?1:0):clamp(step>0?Number((entry.min+Math.round((mapped-entry.min)/step)*step).toPrecision(14)):mapped,entry.min,entry.max);
        // Integer/quality settings and switches retain their discrete semantics.
        if(entry.kind!=='toggle'&&!(step>=1))duration=state.smoothing;
      }
      const previous=pending.get(target);
      if(previous&&previous.to===to&&previous.entry===entry&&previous.kind===entry?.kind&&previous.min===entry?.min&&previous.max===entry?.max&&previous.step===entry?.step)return;
      pending.set(target,{from:entry?.value??to,to,started:performance.now(),duration,entry,kind:entry?.kind,min:entry?.min,max:entry?.max,step:entry?.step});schedule();
    }
    function bind(destination,message){
      const binding={target:destination.id,label:destination.id.startsWith('control:')?model.entries[Number(destination.id.split(':')[1])].label:destination.label,type:message.type,number:message.number,channel:message.channel,inputId:message.input.id||'',inputName:message.input.name||'',manufacturer:message.input.manufacturer||''};
      if(binding.type==='cc'&&binding.target.startsWith('control:')&&mappings().find(m=>m.target===binding.target)?.inverted)binding.inverted=true;
      const conflict=mappings().find(m=>m.target!==binding.target&&sameSource(m,binding)&&!canShare(m,binding));
      if(conflict){say(describe(binding)+' est déjà associé à '+conflict.label+'. Le partage d’un CC est disponible entre paramètres du visuel ; cette liaison est conservée.',true);return false;}
      const next=mappings().filter(m=>m.target!==binding.target);next.push(binding);
      if(!model.snapshots.setMidi({version:1,mappings:next})){say('Association MIDI impossible : les réglages actuels ne permettent pas cet enregistrement.',true);return false;}
      cancelPending();state.learning=null;gates.clear();const shared=next.filter(m=>sameSource(m,binding)).length;say(destination.label+' associé à '+describe(binding)+'.'+(shared>1?' Ce CC pilote '+shared+' paramètres.':''));return true;
    }
    const api={model,mappings,targets:()=>targets(model),cancelPending,cancelControls,resetGates:()=>gates.clear(),
      setSmoothing(value){
        if(!Number.isFinite(value))return false;
        const next=Math.round(clamp(value,0,300));state.smoothing=next;
        try{localStorage.setItem(smoothingKey,String(next));}catch(_){}
        for(const ramp of pending.values())if(ramp.duration){ramp.from=ramp.entry.value;ramp.started=performance.now();ramp.duration=next;}
        emit();return true;
      },
      async learn(target,capture=null){
        if(!alive||!model.available())return;const destination=targets(model).find(t=>t.id===target);if(!destination)return;
        const ticket=++learnTicket;active=api;if(!state.enabled&&!await connect())return;if(!alive||active!==api||!model.available()||ticket!==learnTicket)return;
        state.learning={target,owner:api,...(typeof capture==='function'?{capture}:{})};model.snapshots.stop();cancelPending();say('Apprentissage : '+destination.label+' · '+(destination.note?'joue une note ou bouge un CC.':'bouge un contrôleur CC.'));
      },
      cancel(){learnTicket++;if(state.learning?.owner===api){state.learning=null;say('Apprentissage annulé.');}},
      assignCC(target,number,channel){
        if(!alive||active!==api||!model.available())return false;
        if(!state.enabled){say('Active le MIDI avant d’attribuer un CC manuellement.',true);return false;}
        const destination=targets(model).find(t=>t.id===target);
        if(!destination?.cc){say('Choisis une destination MIDI.',true);return false;}
        if(!Number.isInteger(number)||number<0||number>127||!Number.isInteger(channel)||channel<0||channel>15){say('Saisis un CC entier de 0 à 127 et un canal de 1 à 16.',true);return false;}
        const input=state.input==='*'?(state.inputs.length===1?state.inputs[0]:null):state.inputs.find(p=>p.id===state.input);
        if(!input){say('Sélectionne une entrée MIDI précise dans Entrée, puis attribue le CC.',true);return false;}
        if(state.channel!=='*'&&channel!==Number(state.channel)){say('Le canal choisi est filtré. Sélectionne ce canal dans Canal MIDI, ou Tous les canaux.',true);return false;}
        const ok=bind(destination,{type:'cc',number,channel,input});if(ok)model.snapshots.stop();return ok;
      },
      edit(target,changes,expected){
        if(!alive||active!==api||!model.available())return false;
        const current=mappings().find(m=>m.target===target);
        if(!current||expected&&JSON.stringify(current)!==JSON.stringify(expected)){say('Cette association a changé. Rouvre Modifier pour retrouver ses réglages actuels.',true);return false;}
        const destination=targets(model).find(t=>t.id===changes.target);
        if(!destination||!['cc','note'].includes(changes.type)||!destination[changes.type]){say('Ce type de message n’est pas accepté par la destination choisie.',true);return false;}
        if(!Number.isInteger(changes.number)||changes.number<0||changes.number>127||!Number.isInteger(changes.channel)||changes.channel<0||changes.channel>15){say('Saisis un numéro entier de 0 à 127 et un canal de 1 à 16.',true);return false;}
        const input=state.inputs.find(p=>p.id===changes.inputId)||(changes.inputId===current.inputId?{id:current.inputId,name:current.inputName,manufacturer:current.manufacturer}:null);
        if(!input){say('Choisis une entrée MIDI disponible.',true);return false;}
        const binding={target:destination.id,label:destination.id.startsWith('control:')?model.entries[Number(destination.id.split(':')[1])].label:destination.label,type:changes.type,number:changes.number,channel:changes.channel,inputId:input.id,inputName:input.name||'',manufacturer:input.manufacturer||''};
        if(current.inverted&&binding.type==='cc'&&binding.target.startsWith('control:'))binding.inverted=true;
        const others=mappings().filter(m=>m.target!==target),occupied=others.find(m=>m.target===binding.target),conflict=others.find(m=>sameSource(m,binding)&&!canShare(m,binding));
        if(occupied){say('La destination '+destination.label+' possède déjà une association. Choisis une autre destination ou délie celle-ci d’abord.',true);return false;}
        if(conflict){say(describe(binding)+' est déjà associé à '+conflict.label+'. Les associations sont conservées.',true);return false;}
        const next=mappings().map(m=>m.target===target?binding:m);
        if(!model.snapshots.setMidi({version:1,mappings:next})){say('La modification n’a pas pu être enregistrée. L’association précédente est conservée.',true);return false;}
        cancelPending();state.learning=null;gates.clear();model.snapshots.stop();say('Association modifiée : '+destination.label+' → '+describe(binding)+'.');return true;
      },
      setInverted(target,inverted){
        if(!alive||active!==api||!model.available()||typeof inverted!=='boolean')return false;
        const binding=mappings().find(m=>m.target===target);if(!binding||binding.type!=='cc'||!target.startsWith('control:'))return false;
        const next=mappings().map(m=>{if(m.target!==target)return m;const {inverted:previous,...plain}=m;return inverted?{...plain,inverted:true}:plain;});
        if(!model.snapshots.setMidi({version:1,mappings:next}))return false;
        cancelControls([model.entries[Number(target.split(':')[1])]]);say(binding.label+' · plage MIDI '+(inverted?'inversée : 0 → Max, 127 → Min.':'normale : 0 → Min, 127 → Max.'));return true;
      },
      remove(target){
        if(!alive||active!==api||!model.available())return false;
        const binding=mappings().find(m=>m.target===target);if(!binding)return false;
        const next=mappings().filter(m=>m.target!==target);if(!model.snapshots.setMidi({version:1,mappings:next}))return false;
        if(state.learning?.owner===api&&state.learning.target===target)api.cancel();
        if(target.startsWith('control:'))cancelControls([model.entries[Number(target.split(':')[1])]]);
        else{pending.delete(target);if(!pending.size)cancelPending();}
        gates.delete(JSON.stringify(binding));say('MIDI délié de '+binding.label+'. Les autres associations sont conservées.');return true;
      },
      receive(message){
        const learning=state.learning?.owner===api?state.learning:null;
        if(learning){
          if(message.type==='note'&&!message.pressed)return;const destination=targets(model).find(t=>t.id===learning.target);if(!destination)return;
          if(!destination[message.type]){say('Cette destination attend un contrôleur CC. Bouge un potentiomètre ou une automation MIDI.');return;}
          if(learning.capture){
            state.learning=null;
            try{learning.capture(message);say('Message MIDI détecté pour '+destination.label+'. Clique sur Enregistrer pour modifier l’association.');}
            catch(error){say(error.message,true);}return;
          }
          bind(destination,message);return;
        }
        for(const binding of mappings()){
          if(binding.type!==message.type||binding.number!==message.number||binding.channel!==message.channel||!portMatches(binding,message.input))continue;
          const continuous=binding.target==='morph:position'||binding.target==='morph:duration'||binding.target.startsWith('control:');
          if(continuous&&binding.type==='cc'){enqueue(binding.target,binding.inverted?1-message.value/127:message.value/127);continue;}
          const gate=JSON.stringify(binding),pressed=message.type==='note'?message.pressed:message.value>=64,previous=gates.get(gate)||false;gates.set(gate,pressed);
          if(!pressed||(message.type==='cc'&&previous))continue;
          if(binding.target.startsWith('control:')){const entry=model.entries[Number(binding.target.split(':')[1])];if(entry?.kind==='toggle'){cancelPending();model.setMidiValues([{entry,value:entry.value>=.5?0:1}]);}continue;}
          const snapshots=model.snapshots;
          if(binding.target.startsWith('morph:snapshot:')){
            if(!snapshots.state.running&&!snapshots.state.busy){cancelPending();snapshots.morphTo(Number(binding.target.split(':')[2])).catch(error=>say(error.message,true));}
            continue;
          }
          cancelPending();
          if(binding.target.startsWith('snapshot:')){const index=Number(binding.target.split(':')[1]);if(!snapshots.state.slots[index])say('Snapshot '+(index+1)+' vide : capture une variation avant de le rappeler en MIDI.',true);else snapshots.recall(index).catch(error=>say(error.message,true));}
          else if(binding.target==='morph:stop')snapshots.stop();
          else if(!snapshots.start(binding.target==='morph:reverse'))say('Capture deux snapshots et choisis De / Vers avant de lancer une transition MIDI.',true);
        }
      },
      host(win){hosts.add(win);return()=>{hosts.delete(win);if(frameHost===win&&frame!==null){win.cancelAnimationFrame(frame);frame=null;schedule();}};},
      dispose(){alive=false;cancelPending();api.cancel();hosts.clear();if(active===api)active=null;emit();}
    };
    active?.cancelPending();active?.cancel();active=api;return api;
  }
  function describe(m){return(m.inputName||'Entrée MIDI')+' · ch '+(m.channel+1)+' · '+(m.type==='cc'?'CC ':'note ')+m.number+(m.inverted?' · plage inversée':'');}
  function element(doc,tag,text,attrs={}){const e=doc.createElement(tag);if(text!==null)e.textContent=text;for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;}
  function mount(host,manager){
    host.hidden=!manager;if(!manager)return{refresh(){},dispose(){}};const doc=host.ownerDocument,win=doc.defaultView;
    const panel=element(doc,'section',null,{class:'pilami-midi-panel','aria-label':'MIDI Learn'}),heading=element(doc,'div',null,{class:'pilami-audio-heading'}),connectButton=element(doc,'button','Activer le MIDI',{type:'button','data-midi-connect':''});heading.append(element(doc,'h4','MIDI Learn'),connectButton);
    const row=element(doc,'div',null,{class:'pilami-midi-settings'}),inputs=element(doc,'select',null,{'data-midi-input':'','aria-label':'Entrée MIDI'}),channels=element(doc,'select',null,{'data-midi-channel':'','aria-label':'Canal MIDI'});
    channels.append(element(doc,'option','Tous les canaux',{value:'*'}));for(let i=0;i<16;i++)channels.append(element(doc,'option','Canal '+(i+1),{value:i}));
    const inputLabel=element(doc,'label','Entrée '),channelLabel=element(doc,'label','Canal ');inputLabel.append(inputs);channelLabel.append(channels);row.append(inputLabel,channelLabel);
    const smoothingRow=element(doc,'div',null,{class:'pilami-midi-settings pilami-midi-smoothing'}),smoothingLabel=element(doc,'label','Lissage MIDI '),smoothing=element(doc,'input',null,{type:'range',min:'0',max:'300',step:'1','aria-label':'Lissage MIDI en millisecondes','data-midi-smoothing':''}),smoothingNumber=element(doc,'input',null,{type:'number',min:'0',max:'300',step:'1','aria-label':'Durée du lissage MIDI en millisecondes','data-midi-smoothing-number':''});
    smoothingLabel.append(smoothing);smoothingRow.append(smoothingLabel,smoothingNumber,element(doc,'span','ms'));
    smoothing.addEventListener('input',()=>manager.setSmoothing(Number(smoothing.value)));
    smoothingNumber.addEventListener('change',()=>{if(!smoothingNumber.value.trim()||!manager.setSmoothing(smoothingNumber.valueAsNumber))smoothingNumber.value=String(state.smoothing);});
    const smoothingHelp=element(doc,'p','0 ms : immédiat · 60 ms : fluide · 150–300 ms : plus d’inertie. Pads XY, potards et faders ; les boutons, snapshots et paramètres entiers restent immédiats. Choix mémorisé dans ce navigateur.',{class:'pilami-control-help'});
    const learningRow=element(doc,'div',null,{class:'pilami-midi-settings'}),destination=element(doc,'select',null,{'data-midi-target':'','aria-label':'Destination MIDI Learn'}),learn=element(doc,'button','Apprendre',{type:'button','data-midi-learn':''}),cancel=element(doc,'button','Annuler',{type:'button','data-midi-cancel':''});
    for(const target of manager.targets())destination.append(element(doc,'option',target.label,{value:target.id}));const destLabel=element(doc,'label','Destination ');destLabel.append(destination);learningRow.append(destLabel,learn,cancel);
    const manual=element(doc,'details',null,{'data-midi-manual':''}),manualRow=element(doc,'div',null,{class:'pilami-midi-settings'}),cc=element(doc,'input',null,{type:'number',min:'0',max:'127',step:'1',placeholder:'0–127','aria-label':'Numéro de CC manuel','data-midi-manual-cc':''}),manualChannel=element(doc,'select',null,{'aria-label':'Canal du CC manuel','data-midi-manual-channel':''}),assign=element(doc,'button','Attribuer le CC',{type:'button','data-midi-manual-assign':''});
    for(let i=0;i<16;i++)manualChannel.append(element(doc,'option','Canal '+(i+1),{value:i}));
    const ccLabel=element(doc,'label','CC '),manualChannelLabel=element(doc,'label','Canal ');ccLabel.append(cc);manualChannelLabel.append(manualChannel);manualRow.append(ccLabel,manualChannelLabel,assign);
    manual.append(element(doc,'summary','Attribuer un CC manuellement'),element(doc,'p','Utilise la destination choisie ci-dessus et sélectionne ton entrée MIDI. Pour un pad XY : attribue CC1 à X et CC2 à Y, sur le canal transmis par Ableton. Aucun geste sur le pad n’est nécessaire.',{class:'pilami-control-help'}),manualRow);
    function fillManual(){const binding=manager.mappings().find(m=>m.target===destination.value);cc.value=binding?.type==='cc'?String(binding.number):'';manualChannel.value=String(state.channel!=='*'?Number(state.channel):binding?.channel??0);}
    destination.addEventListener('change',()=>{manager.cancel();fillManual();});manual.addEventListener('toggle',()=>{if(manual.open)manager.cancel();});
    assign.addEventListener('click',()=>manager.assignCC(destination.value,cc.value.trim()?cc.valueAsNumber:NaN,Number(manualChannel.value)));
    const status=element(doc,'p','',{class:'pilami-control-help','data-midi-status':'',role:'status'}),last=element(doc,'p','',{class:'pilami-control-help pilami-midi-monitor','data-midi-last':''}),help=element(doc,'p','Un même CC peut piloter plusieurs paramètres du visuel : apprends ou attribue ce CC à chaque paramètre, avec ses propres bornes Min/Max. Délier MIDI sur un paramètre conserve les autres associations. Paramètres et position : CC. Un paramètre piloté en MIDI pendant un morphing reste sous ta main jusqu’à l’arrivée ; les autres continuent leur transition. Snapshots et transitions : notes ou CC (seuil 64), avec une seule destination par source. Morpher vers un snapshot part des réglages actuels, avec la durée et le lissage choisis ; les déclenchements sont ignorés pendant une transition ou si la cible est déjà atteinte. Durée : CC de 0,1 à 30 s. Enregistre les associations avec les snapshots dans WordPress.',{class:'pilami-control-help'});
    const details=element(doc,'details',null),summary=element(doc,'summary','Associations'),list=element(doc,'div',null,{class:'pilami-midi-bindings','data-midi-bindings':''});details.append(summary,list);panel.append(heading,row,smoothingRow,smoothingHelp,learningRow,manual,status,last,details,help);host.replaceChildren(panel);
    connectButton.addEventListener('click',()=>state.enabled?disconnect():connect());inputs.addEventListener('change',()=>{state.input=inputs.value;state.learning=null;manager.cancelPending();manager.resetGates();say('Entrée MIDI sélectionnée.');});channels.addEventListener('change',()=>{state.channel=channels.value;state.learning=null;manager.cancelPending();manager.resetGates();say('Canal MIDI sélectionné.');fillManual();});
    learn.addEventListener('click',()=>manager.learn(destination.value));cancel.addEventListener('click',()=>manager.cancel());
    let portSignature='',bindingSignature='',modelInput=null,modelChannel=null,modelTarget=null;const editors=new Set();
    const text=(e,v)=>{if(e.textContent!==v)e.textContent=v;},property=(e,k,v)=>{if(e[k]!==v)e[k]=v;};
    function makeBinding(mapping){
      const title=manager.targets().find(t=>t.id===mapping.target)?.label||mapping.label;
      const line=element(doc,'div',null,{class:'pilami-midi-binding'}),label=element(doc,'span',title),source=element(doc,'span',describe(mapping),{class:'pilami-control-help'}),edit=element(doc,'button','Modifier',{type:'button','data-midi-edit':mapping.target,'aria-label':'Modifier l’association MIDI de '+title}),remove=element(doc,'button','Délier',{type:'button','data-midi-remove':mapping.target,'aria-label':'Délier le MIDI de '+title});
      line.append(label,source,edit,remove);remove.addEventListener('click',()=>manager.remove(mapping.target));
      edit.addEventListener('click',()=>{
        manager.cancel();if(line.querySelector('[data-midi-editor]'))return;
        const current=manager.mappings().find(m=>m.target===mapping.target);if(!current)return;
        const editor=element(doc,'div',null,{class:'pilami-midi-settings','data-midi-editor':mapping.target,role:'group','aria-label':'Modifier l’association MIDI de '+title});editor.style.flexBasis='100%';
        const target=element(doc,'select',null,{'aria-label':'Destination de l’association '+title,'data-midi-edit-target':''}),type=element(doc,'select',null,{'aria-label':'Type de message de l’association '+title,'data-midi-edit-type':''}),number=element(doc,'input',null,{type:'number',min:'0',max:'127',step:'1','aria-label':'Numéro de l’association '+title,'data-midi-edit-number':''}),channel=element(doc,'select',null,{'aria-label':'Canal de l’association '+title,'data-midi-edit-channel':''}),input=element(doc,'select',null,{'aria-label':'Entrée de l’association '+title,'data-midi-edit-input':''});
        manager.targets().forEach(t=>target.append(element(doc,'option',t.label,{value:t.id})));target.value=current.target;
        function fillTypes(){const prior=type.value||current.type,dest=manager.targets().find(t=>t.id===target.value);type.replaceChildren();for(const [value,label]of [['cc','CC'],['note','Note']])if(dest?.[value])type.append(element(doc,'option',label,{value}));type.value=dest?.[prior]?prior:'cc';}
        fillTypes();target.addEventListener('change',fillTypes);number.value=String(current.number);
        for(let i=0;i<16;i++)channel.append(element(doc,'option','Canal '+(i+1),{value:i}));channel.value=String(current.channel);
        const ports=[...state.inputs];if(!ports.some(p=>p.id===current.inputId))ports.push({id:current.inputId,name:(current.inputName||'Entrée MIDI')+' · déconnectée'});
        ports.forEach(p=>input.append(element(doc,'option',p.name||p.id,{value:p.id})));input.value=current.inputId;
        for(const [caption,field]of [['Destination ',target],['Message ',type],['Numéro ',number],['Canal ',channel],['Entrée ',input]]){const fieldLabel=element(doc,'label',caption);fieldLabel.append(field);editor.append(fieldLabel);}
        const editLearn=element(doc,'button',null,{type:'button','data-midi-edit-learn':'',title:'Apprendre','aria-label':'Apprendre une nouvelle association MIDI','aria-busy':'false'}),learnStatus=element(doc,'p','Clique le logo MIDI Learn, puis bouge le contrôleur ou joue une note. Le message remplit les champs ; Enregistrer valide le changement.',{class:'pilami-control-help','data-midi-edit-learn-status':'',role:'status'}),save=element(doc,'button','Enregistrer',{type:'button','data-midi-edit-save':''}),cancelEdit=element(doc,'button','Annuler',{type:'button','data-midi-edit-cancel':''}),error=element(doc,'p','',{class:'pilami-control-help is-error',role:'status'});error.hidden=true;error.style.flexBasis=learnStatus.style.flexBasis='100%';const learnIcon=element(doc,'span',null,{class:'pilami-midi-learn-icon','aria-hidden':'true'});learnIcon.style.maskImage=learnIcon.style.webkitMaskImage='url('+JSON.stringify(midiLearnIconURL)+')';editLearn.append(learnIcon);editor.append(editLearn,save,cancelEdit,learnStatus,error);line.append(editor);edit.hidden=true;
        let requested=false,closed=false,wasWaiting=false;
        function captureDraft(message){
          if(closed)return;
          type.value=message.type;number.value=String(message.number);channel.value=String(message.channel);
          if(!Array.from(input.options).some(p=>p.value===message.input.id))input.append(element(doc,'option',message.input.name||message.input.id,{value:message.input.id}));input.value=message.input.id;
          learnStatus.textContent='Message détecté : '+(message.type==='cc'?'CC ':'note ')+message.number+' · canal '+(message.channel+1)+' · '+(message.input.name||'Entrée MIDI')+'. Clique Enregistrer pour valider.';error.hidden=true;
        }
        function stopCapture(){if(requested||state.learning?.capture===captureDraft)manager.cancel();requested=false;}
        const session={capture:captureDraft,close(){closed=true;stopCapture();editors.delete(session);},refresh(){const waiting=state.learning?.owner===manager&&state.learning.capture===captureDraft;editLearn.classList.toggle('is-learning',waiting);editLearn.title=waiting?'Annuler l’apprentissage MIDI':'Apprendre';editLearn.setAttribute('aria-label',waiting?'Annuler l’apprentissage MIDI':'Apprendre une nouvelle association MIDI');editLearn.setAttribute('aria-busy',String(waiting));editLearn.disabled=state.busy||!manager.model.available();if(waiting)learnStatus.textContent='En attente : bouge un contrôleur CC ou joue une note compatible avec la destination choisie.';else if(wasWaiting&&learnStatus.textContent.startsWith('En attente'))learnStatus.textContent='Apprentissage arrêté. Les champs et l’association précédente sont conservés.';wasWaiting=waiting;}};editors.add(session);
        editLearn.addEventListener('click',async()=>{if(state.learning?.capture===captureDraft){stopCapture();learnStatus.textContent='Apprentissage annulé. Les champs et l’association précédente sont conservés.';return;}requested=true;try{await manager.learn(target.value,captureDraft);}finally{requested=false;session.refresh();}});
        target.addEventListener('change',stopCapture);type.addEventListener('change',stopCapture);number.addEventListener('input',stopCapture);channel.addEventListener('change',stopCapture);input.addEventListener('change',stopCapture);
        cancelEdit.addEventListener('click',()=>{session.close();editor.remove();edit.hidden=false;edit.focus();});
        save.addEventListener('click',()=>{stopCapture();const ok=manager.edit(current.target,{target:target.value,type:type.value,number:number.value.trim()?number.valueAsNumber:NaN,channel:Number(channel.value),inputId:input.value},current);if(!ok){error.textContent=state.message;error.hidden=false;}else{session.close();editor.remove();edit.hidden=false;refresh();list.querySelector('[data-midi-edit="'+target.value+'"]')?.focus();}});
        editor.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancelEdit.click();}});target.focus();
      });return line;
    }
    function refresh(){
      property(smoothing,'value',String(state.smoothing));smoothing.setAttribute('aria-valuetext',state.smoothing+' millisecondes');if(doc.activeElement!==smoothingNumber)property(smoothingNumber,'value',String(state.smoothing));
      const ports=JSON.stringify([state.inputs,state.input]);if(ports!==portSignature){portSignature=ports;inputs.replaceChildren(element(doc,'option','Toutes les entrées',{value:'*'}));for(const p of state.inputs)inputs.append(element(doc,'option',p.name||p.id,{value:p.id}));if(state.input!=='*'&&!state.inputs.some(p=>p.id===state.input))inputs.append(element(doc,'option','Entrée déconnectée',{value:state.input}));inputs.value=state.input;modelInput=state.input;}
      if(modelInput!==state.input){inputs.value=state.input;modelInput=state.input;}if(modelChannel!==state.channel){channels.value=state.channel;modelChannel=state.channel;}
      const learning=state.learning?.owner===manager?state.learning.target:null;
      if(learning&&learning!==modelTarget){destination.value=learning;modelTarget=learning;fillManual();}if(!learning)modelTarget=null;
      const mappings=manager.mappings(),signature=JSON.stringify(mappings);if(signature!==bindingSignature){bindingSignature=signature;for(const session of [...editors])session.close();list.replaceChildren();for(const mapping of mappings)list.append(makeBinding(mapping));text(summary,'Associations ('+mappings.length+')');}
      for(const session of editors)session.refresh();
      property(assign,'disabled',state.busy||!state.enabled||!manager.model.available());property(details,'hidden',!mappings.length);property(cancel,'hidden',!learning);property(connectButton,'disabled',state.busy);text(connectButton,state.busy?'Connexion…':state.enabled?'Désactiver le MIDI':'Activer le MIDI');property(learn,'disabled',state.busy||!manager.model.available());text(learn,learning?'En attente…':'Apprendre');text(status,state.message);status.classList.toggle('is-error',state.error);text(last,state.last);
    }
    const releaseHost=manager.host(win);listeners.add(refresh);refresh();fillManual();return{refresh,dispose(){listeners.delete(refresh);for(const session of [...editors])session.close();releaseHost();}};
  }
  window.PilamiHydraMidi={state,connect,disconnect,access,create,mount,validate,describe,releaseScript(){if(!library)return;library.midi.pause();library.midi.hide();for(const name of ['noteOnEvents','ccEvents','aftEvents','playingNotes'])library.midiState[name].clear();},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},setLibrary(value){library=value;},library:()=>library,identify(url){try{const u=new URL(String(url));return ['cdn.jsdelivr.net','unpkg.com'].includes(u.hostname)&&/^\/(?:npm\/)?hydra-midi(?:@[^/]+)?\/dist\/index.js$/.test(u.pathname);}catch(_){return false;}}};
})();
