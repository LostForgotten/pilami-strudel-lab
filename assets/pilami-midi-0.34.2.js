// Pilami Hydra MIDI Learn. AGPL-3.0-or-later. No MIDI permission requested on load.
(function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),listeners=new Set(),attached=new Map();
  const state={enabled:false,busy:false,inputs:[],input:'*',channel:'*',learning:null,last:'Aucun message reçu.',message:'Active le MIDI, puis choisis une destination à apprendre.',error:false};
  let midiAccess=null,pendingAccess=null,pendingConnect=null,active=null,library=null;
  const emit=()=>listeners.forEach(fn=>fn());
  const say=(message,error=false)=>{state.message=message;state.error=error;emit();};
  const targets=model=>[
    ...model.entries.map((entry,index)=>({id:'control:'+index,label:entry.label,cc:true,note:entry.kind==='toggle'})),
    ...Array.from({length:4},(_,i)=>({id:'snapshot:'+i,label:'Rappeler le snapshot '+(i+1),cc:true,note:true})),
    ...Array.from({length:4},(_,i)=>({id:'morph:snapshot:'+i,label:'Morpher vers le snapshot '+(i+1),cc:true,note:true})),
    ...[['forward','Morphing A → B'],['reverse','Morphing B → A'],['stop','Pause du morphing'],['position','Position du morphing'],['duration','Durée du morphing · 0,1 à 30 s']].map(([id,label])=>({id:'morph:'+id,label,cc:true,note:!['position','duration'].includes(id)}))
  ];
  function validate(data,entries){
    if(data===undefined||data===null)return null;
    if(data.version!==1||!Array.isArray(data.mappings)||data.mappings.length>141)return null;
    const result=[],seen=new Set(),sources=[];
    for(const m of data.mappings){
      if(!m||!/^control:(?:0|[1-9][0-9]{0,2})$|^snapshot:[0-3]$|^morph:snapshot:[0-3]$|^morph:(?:forward|reverse|stop|position|duration)$/.test(m.target)||!['note','cc'].includes(m.type)||!Number.isInteger(m.number)||m.number<0||m.number>127||!Number.isInteger(m.channel)||m.channel<0||m.channel>15||seen.has(m.target))return null;
      if(['morph:position','morph:duration'].includes(m.target)&&m.type!=='cc')return null;
      if(!['inputId','inputName','manufacturer','label'].every(k=>typeof m[k]==='string'&&m[k].length<=256)||(!m.inputId&&!m.inputName))return null;
      const index=m.target.startsWith('control:')?Number(m.target.split(':')[1]):-1;
      if(index>=128||(entries&&index>=0&&(!entries[index]||entries[index].label!==m.label)))return null;
      if(sources.some(other=>sameSource(m,other)))return null;sources.push(m);
      seen.add(m.target);result.push({target:m.target,label:m.label,type:m.type,number:m.number,channel:m.channel,inputId:m.inputId,inputName:m.inputName,manufacturer:m.manufacturer});
    }
    return{version:1,mappings:result};
  }
  function sameSource(a,b){return a.type===b.type&&a.number===b.number&&a.channel===b.channel&&((a.inputId&&a.inputId===b.inputId)||(a.inputName&&a.inputName===b.inputName&&a.manufacturer===b.manufacturer));}
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
    active?.resetGates();if(state.enabled)say(state.inputs.length?'MIDI actif · '+state.inputs.length+' entrée(s) disponible(s).':'MIDI actif · branche une entrée MIDI ou ouvre ton port virtuel.');else emit();
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
    let alive=true,frame=null,frameHost=null;const pending=new Map(),gates=new Map(),hosts=new Set();
    const mappings=()=>model.snapshots.state.midi?.mappings||[];
    function cancelPending(){if(frame!==null){frameHost.cancelAnimationFrame(frame);frame=null;}pending.clear();}
    function flush(){
      frame=null;if(!alive||active!==api||!state.enabled||!model.available()){pending.clear();return;}
      const work=new Map(pending);pending.clear();const values=[];
      for(const [target,value]of work){if(target.startsWith('control:')){const entry=model.entries[Number(target.split(':')[1])];if(entry)values.push({entry,value:entry.kind==='toggle'?(value>=.5?1:0):entry.min+value*(entry.max-entry.min)});}}
      if(values.length)model.setMidiValues(values);
      if(work.has('morph:duration'))model.snapshots.setDuration(Number((.1+work.get('morph:duration')*29.9).toFixed(3)));
      if(work.has('morph:position')&&!model.snapshots.morph(work.get('morph:position')))say('Capture deux snapshots et choisis De / Vers pour piloter le morphing.',true);
    }
    function enqueue(target,value){pending.set(target,value);if(frame!==null)return;let host=window.PilamiStrudelVisuals?.animationHost?.()||window;for(const candidate of hosts)if(!candidate.closed&&candidate.document.visibilityState==='visible')host=candidate;frameHost=host;frame=host.requestAnimationFrame(flush);}
    const api={model,mappings,targets:()=>targets(model),cancelPending,resetGates:()=>gates.clear(),
      async learn(target){
        if(!alive||!model.available())return;const destination=targets(model).find(t=>t.id===target);if(!destination)return;
        active=api;if(!state.enabled&&!await connect())return;if(!alive||active!==api||!model.available())return;
        state.learning={target,owner:api};model.snapshots.stop();cancelPending();say('Apprentissage : '+destination.label+' · '+(destination.note?'joue une note ou bouge un CC.':'bouge un contrôleur CC.'));
      },
      cancel(){if(state.learning?.owner===api){state.learning=null;say('Apprentissage annulé.');}},
      remove(target){api.cancel();cancelPending();const next=mappings().filter(m=>m.target!==target);if(model.snapshots.setMidi({version:1,mappings:next}))say('Association MIDI supprimée.');},
      receive(message){
        const learning=state.learning?.owner===api?state.learning:null;
        if(learning){
          if(message.type==='note'&&!message.pressed)return;const destination=targets(model).find(t=>t.id===learning.target);if(!destination)return;
          if(!destination[message.type]){say('Cette destination attend un contrôleur CC. Bouge un potentiomètre ou une automation MIDI.');return;}
          const binding={target:destination.id,label:destination.id.startsWith('control:')?model.entries[Number(destination.id.split(':')[1])].label:destination.label,type:message.type,number:message.number,channel:message.channel,inputId:message.input.id||'',inputName:message.input.name||'',manufacturer:message.input.manufacturer||''};
          const next=mappings().filter(m=>m.target!==binding.target&&!sameSource(m,binding));next.push(binding);
          if(model.snapshots.setMidi({version:1,mappings:next})){state.learning=null;gates.clear();say(destination.label+' associé à '+describe(binding)+'.');}return;
        }
        for(const binding of mappings()){
          if(binding.type!==message.type||binding.number!==message.number||binding.channel!==message.channel||!portMatches(binding,message.input))continue;
          const continuous=binding.target==='morph:position'||binding.target==='morph:duration'||binding.target.startsWith('control:');
          if(continuous&&binding.type==='cc'){enqueue(binding.target,message.value/127);continue;}
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
      host(win){hosts.add(win);return()=>{hosts.delete(win);if(frameHost===win&&frame!==null){win.cancelAnimationFrame(frame);frame=null;if(pending.size)enqueue(...pending.entries().next().value);}};},
      dispose(){alive=false;cancelPending();api.cancel();hosts.clear();if(active===api)active=null;emit();}
    };
    active?.cancelPending();active?.cancel();active=api;return api;
  }
  function describe(m){return(m.inputName||'Entrée MIDI')+' · ch '+(m.channel+1)+' · '+(m.type==='cc'?'CC ':'note ')+m.number;}
  function element(doc,tag,text,attrs={}){const e=doc.createElement(tag);if(text!==null)e.textContent=text;for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;}
  function mount(host,manager){
    host.hidden=!manager;if(!manager)return{refresh(){},dispose(){}};const doc=host.ownerDocument,win=doc.defaultView;
    const panel=element(doc,'section',null,{class:'pilami-midi-panel','aria-label':'MIDI Learn'}),heading=element(doc,'div',null,{class:'pilami-audio-heading'}),connectButton=element(doc,'button','Activer le MIDI',{type:'button','data-midi-connect':''});heading.append(element(doc,'h4','MIDI Learn'),connectButton);
    const row=element(doc,'div',null,{class:'pilami-midi-settings'}),inputs=element(doc,'select',null,{'data-midi-input':'','aria-label':'Entrée MIDI'}),channels=element(doc,'select',null,{'data-midi-channel':'','aria-label':'Canal MIDI'});
    channels.append(element(doc,'option','Tous les canaux',{value:'*'}));for(let i=0;i<16;i++)channels.append(element(doc,'option','Canal '+(i+1),{value:i}));
    const inputLabel=element(doc,'label','Entrée '),channelLabel=element(doc,'label','Canal ');inputLabel.append(inputs);channelLabel.append(channels);row.append(inputLabel,channelLabel);
    const learningRow=element(doc,'div',null,{class:'pilami-midi-settings'}),destination=element(doc,'select',null,{'data-midi-target':'','aria-label':'Destination MIDI Learn'}),learn=element(doc,'button','Apprendre',{type:'button','data-midi-learn':''}),cancel=element(doc,'button','Annuler',{type:'button','data-midi-cancel':''});
    for(const target of manager.targets())destination.append(element(doc,'option',target.label,{value:target.id}));const destLabel=element(doc,'label','Destination ');destLabel.append(destination);learningRow.append(destLabel,learn,cancel);
    const status=element(doc,'p','',{class:'pilami-control-help','data-midi-status':'',role:'status'}),last=element(doc,'p','',{class:'pilami-control-help pilami-midi-monitor','data-midi-last':''}),help=element(doc,'p','Paramètres et position : CC. Un paramètre piloté en MIDI pendant un morphing reste sous ta main jusqu’à l’arrivée ; les autres continuent leur transition. Snapshots et transitions : notes ou CC (seuil 64). Morpher vers un snapshot part des réglages actuels, avec la durée et le lissage choisis ; les déclenchements sont ignorés pendant une transition ou si la cible est déjà atteinte. Durée : CC de 0,1 à 30 s. Enregistre les associations avec les snapshots dans WordPress.',{class:'pilami-control-help'});
    const details=element(doc,'details',null),summary=element(doc,'summary','Associations'),list=element(doc,'div',null,{class:'pilami-midi-bindings','data-midi-bindings':''});details.append(summary,list);panel.append(heading,row,learningRow,status,last,details,help);host.replaceChildren(panel);
    connectButton.addEventListener('click',()=>state.enabled?disconnect():connect());inputs.addEventListener('change',()=>{state.input=inputs.value;state.learning=null;manager.cancelPending();manager.resetGates();say('Entrée MIDI sélectionnée.');});channels.addEventListener('change',()=>{state.channel=channels.value;state.learning=null;manager.cancelPending();manager.resetGates();say('Canal MIDI sélectionné.');});
    learn.addEventListener('click',()=>manager.learn(destination.value));cancel.addEventListener('click',()=>manager.cancel());
    let portSignature='',bindingSignature='',modelInput=null,modelChannel=null,modelTarget=null;
    const text=(e,v)=>{if(e.textContent!==v)e.textContent=v;},property=(e,k,v)=>{if(e[k]!==v)e[k]=v;};
    function refresh(){
      const ports=JSON.stringify([state.inputs,state.input]);if(ports!==portSignature){portSignature=ports;inputs.replaceChildren(element(doc,'option','Toutes les entrées',{value:'*'}));for(const p of state.inputs)inputs.append(element(doc,'option',p.name||p.id,{value:p.id}));if(state.input!=='*'&&!state.inputs.some(p=>p.id===state.input))inputs.append(element(doc,'option','Entrée déconnectée',{value:state.input}));inputs.value=state.input;modelInput=state.input;}
      if(modelInput!==state.input){inputs.value=state.input;modelInput=state.input;}if(modelChannel!==state.channel){channels.value=state.channel;modelChannel=state.channel;}
      const learning=state.learning?.owner===manager?state.learning.target:null;
      if(learning&&learning!==modelTarget){destination.value=learning;modelTarget=learning;}if(!learning)modelTarget=null;
      const mappings=manager.mappings(),signature=JSON.stringify(mappings);if(signature!==bindingSignature){bindingSignature=signature;list.replaceChildren();for(const mapping of mappings){const line=element(doc,'div',null,{class:'pilami-midi-binding'}),label=element(doc,'span',manager.targets().find(t=>t.id===mapping.target)?.label||mapping.label),source=element(doc,'span',describe(mapping),{class:'pilami-control-help'}),remove=element(doc,'button','Délier',{type:'button','data-midi-remove':mapping.target,'aria-label':'Délier le MIDI de '+label.textContent});remove.addEventListener('click',()=>manager.remove(mapping.target));line.append(label,source,remove);list.append(line);}text(summary,'Associations ('+mappings.length+')');}
      property(details,'hidden',!mappings.length);property(cancel,'hidden',!learning);property(connectButton,'disabled',state.busy);text(connectButton,state.busy?'Connexion…':state.enabled?'Désactiver le MIDI':'Activer le MIDI');property(learn,'disabled',state.busy||!manager.model.available());text(learn,learning?'En attente…':'Apprendre');text(status,state.message);status.classList.toggle('is-error',state.error);text(last,state.last);
    }
    const releaseHost=manager.host(win);listeners.add(refresh);refresh();return{refresh,dispose(){listeners.delete(refresh);releaseHost();}};
  }
  window.PilamiHydraMidi={state,connect,disconnect,access,create,mount,validate,describe,releaseScript(){if(!library)return;library.midi.pause();library.midi.hide();for(const name of ['noteOnEvents','ccEvents','aftEvents','playingNotes'])library.midiState[name].clear();},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},setLibrary(value){library=value;},library:()=>library,identify(url){try{const u=new URL(String(url));return ['cdn.jsdelivr.net','unpkg.com'].includes(u.hostname)&&/^\/(?:npm\/)?hydra-midi(?:@[^/]+)?\/dist\/index.js$/.test(u.pathname);}catch(_){return false;}}};
})();
