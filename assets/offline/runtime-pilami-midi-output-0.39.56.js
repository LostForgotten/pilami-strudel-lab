// Pilami collision MIDI output. AGPL-3.0-or-later.
// No permission request or device selection on page load.
(function(){
  'use strict';
  const listeners=new Set();
  const state={available:false,busy:false,enabled:false,running:false,source:false,ports:[],port:'',channel:1,number:36,duration:80,dynamic:true,velocity:100,impacts:0,notes:0,tests:0,message:'Autorise le MIDI, choisis une sortie, puis active l’envoi.',error:false};
  let access=null,pending=null,owner=null,voice=null,connectionTicket=0;
  const emit=()=>{for(const fn of listeners)fn();};
  function say(message,error=false){state.message=message;state.error=error;emit();}
  function silence(){
    const note=voice;voice=null;
    if(!note)return;
    // Note Off is scheduled in the MIDI queue, independent of animation frames.
    // Before a stop/retrigger, cancel that queue and explicitly close our note.
    try{note.port.clear();}catch(_){}
    try{note.port.send([0x80|note.channel,note.number,0]);}catch(_){}
  }
  function output(){return access?.outputs.get(state.port);}
  function refreshPorts(){
    state.ports=[...access?.outputs.values()||[]].filter(p=>p.state!=='disconnected').map(p=>({id:p.id,name:p.name||'Sortie MIDI',manufacturer:p.manufacturer||''}));
    if(state.port&&!state.ports.some(p=>p.id===state.port)){
      connectionTicket++;silence();state.enabled=false;state.port='';
      say('Sortie MIDI déconnectée. Choisis une sortie et réactive l’envoi.',true);return;
    }
    emit();
  }
  async function connect(){
    if(access){refreshPorts();return true;}
    if(pending)return pending;
    state.busy=true;say('Autorisation MIDI…');
    pending=(async()=>{
      try{
        if(window.PilamiHydraMidi?.access)access=await window.PilamiHydraMidi.access();
        else{
          if(typeof navigator.requestMIDIAccess!=='function')throw Error('Accès Web MIDI indisponible. Utilise un navigateur compatible, en HTTPS ou sur localhost.');
          access=await navigator.requestMIDIAccess({sysex:false});
        }
        access.addEventListener('statechange',refreshPorts);state.available=true;refreshPorts();
        say(state.ports.length?'Choisis une sortie MIDI, puis active l’envoi.':'Aucune sortie MIDI. Lance loopMIDI et crée un port ; la liste se met à jour automatiquement.');return true;
      }catch(error){say('Accès MIDI impossible : '+error.message,true);return false;}
      finally{state.busy=false;pending=null;emit();}
    })();return pending;
  }
  function disable(message='Envoi MIDI désactivé.'){
    connectionTicket++;silence();state.enabled=false;say(message);
  }
  async function enable(){
    if(!access&&!await connect())return false;
    const port=output();if(!port||port.state==='disconnected'){say('Choisis une sortie MIDI disponible.',true);return false;}
    const ticket=++connectionTicket;state.busy=true;emit();
    try{
      await port.open();
      if(ticket!==connectionTicket||port!==output()||port.state==='disconnected')return false;
      state.enabled=true;say('Envoi actif vers '+(port.name||'la sortie MIDI')+'.');return true;
    }catch(error){if(ticket===connectionTicket)disable('Sortie MIDI inaccessible : '+error.message);return false;}
    finally{state.busy=false;emit();}
  }
  function configure(key,value){
    if(key==='port'){
      if(value!==''&&!state.ports.some(p=>p.id===value))return false;
      disable();state.port=value;say(value?'Sortie choisie. Clique sur Activer l’envoi.':'Choisis une sortie MIDI.');return true;
    }
    if(key==='dynamic')value=Boolean(value);
    else{
      const bounds={channel:[1,16],number:[0,127],duration:[10,2000],velocity:[1,127]};
      if(!bounds[key]||!Number.isInteger(value)||value<bounds[key][0]||value>bounds[key][1])return false;
    }
    silence();state[key]=value;emit();return true;
  }
  function send(strength=1,test=false){
    const port=output();if(!state.enabled||!port||port.state==='disconnected')return false;
    if(!Number.isFinite(strength))return false;
    const velocity=state.dynamic?Math.max(1,Math.min(127,Math.round(127*Math.max(0,Math.min(1,strength))))):state.velocity;
    const channel=state.channel-1,number=state.number,now=performance.now();
    // One ball owns one voice. A retrigger cannot inherit an older Note Off.
    silence();
    try{
      port.send([0x90|channel,number,velocity]);voice={port,channel,number};
      port.send([0x80|channel,number,0],now+state.duration);
      if(test)state.tests++;else state.notes++;
      say((test?'Test':'Impact')+' → note '+number+' · canal '+state.channel+' · vélocité '+velocity);return true;
    }catch(error){disable('Envoi MIDI interrompu : '+error.message);return false;}
  }
  function release(){
    const previous=owner;owner=null;silence();state.source=false;state.running=false;
    previous?.dispose?.();emit();
  }
  function source({reset,dispose}={}){
    release();const token={reset,dispose};owner=token;state.source=true;state.impacts=state.notes=state.tests=0;emit();
    return{
      hit(strength){if(owner!==token||!state.running)return false;state.impacts++;const sent=send(strength);if(!sent)emit();return sent;},
      dispose(){if(owner===token)release();}
    };
  }
  function setRunning(running){state.running=Boolean(running);if(!running)silence();emit();}
  function reset(){if(!owner)return;silence();owner.reset?.();state.impacts=state.notes=state.tests=0;emit();}
  function mount(host){
    const doc=host.ownerDocument,win=doc.defaultView;
    if(!doc.querySelector('[data-midi-output-style]')){
      const style=doc.createElement('style');style.dataset.midiOutputStyle='';
      style.textContent='.pilami-midi-output{box-sizing:border-box;margin:12px 0;padding:14px;border:1px solid #6dcbb96b;border-radius:10px;color:inherit;font:inherit}.pilami-midi-output[hidden]{display:none}.pilami-midi-output h4{margin:0 0 10px;font-size:16px}.pilami-midi-output .pmo-fields,.pilami-midi-output .pmo-actions{display:flex;flex-wrap:wrap;align-items:end;gap:10px;margin:10px 0}.pilami-midi-output label{display:flex;flex-direction:column;gap:4px;font-size:13px}.pilami-midi-output select,.pilami-midi-output input[type=number]{box-sizing:border-box;max-width:100%;padding:7px;border:1px solid #8997a766;border-radius:6px;color:var(--pilami-editor-text,var(--editor-text,CanvasText));background:var(--pilami-editor-bg,var(--editor-bg,Canvas));font:inherit}.pilami-midi-output input[type=number]{width:90px}.pilami-midi-output .pmo-check{flex-direction:row;align-items:center}.pilami-midi-output button{font:inherit;cursor:pointer}.pilami-midi-output button[aria-pressed=true]{outline:2px solid #6dcbb9}.pilami-midi-output p{font-size:13px;line-height:1.5;margin:8px 0}.pilami-midi-output [data-pmo-error=true]{color:#ef928a}.pilami-midi-output output{font-variant-numeric:tabular-nums}';
      doc.head.append(style);
    }
    const make=(tag,text,attributes={})=>{const el=doc.createElement(tag);if(text)el.textContent=text;for(const [k,v]of Object.entries(attributes))el.setAttribute(k,v);return el;};
    const box=make('section',null,{class:'pilami-midi-output','data-midi-output-panel':'','aria-label':'Rebond : sortie MIDI'});
    box.append(make('h4','Rebond → sortie MIDI'));
    const actions=make('div',null,{class:'pmo-actions'}),authorize=make('button','Autoriser le MIDI',{type:'button','data-pmo-connect':''}),arm=make('button','Activer l’envoi',{type:'button','data-pmo-enable':'','aria-pressed':'false'}),test=make('button','Envoyer une note de test',{type:'button','data-pmo-test':''}),drop=make('button','Relâcher la balle',{type:'button','data-pmo-reset':''});
    actions.append(authorize,arm,test,drop);box.append(actions);
    const fields=make('div',null,{class:'pmo-fields'}),portLabel=make('label','Sortie MIDI'),select=make('select',null,{'data-pmo-port':'','aria-label':'Sortie MIDI vers Ableton'});portLabel.append(select);fields.append(portLabel);
    const inputs={};
    for(const [key,label,min,max]of [['channel','Canal',1,16],['number','Note MIDI',0,127],['duration','Durée (ms)',10,2000],['velocity','Vélocité fixe',1,127]]){
      const row=make('label',label),input=make('input',null,{type:'number',min:String(min),max:String(max),step:'1','data-pmo-field':key,'aria-label':label});row.append(input);fields.append(row);inputs[key]=input;
      input.addEventListener('change',()=>{if(!input.value.trim()||!configure(key,input.valueAsNumber)){input.value=String(state[key]);say('Valeur entière attendue : '+min+' à '+max+'.',true);}});
      input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();input.dispatchEvent(new win.Event('change'));}});
    }
    box.append(fields);
    const dynamicLabel=make('label','Vélocité selon la force du choc',{class:'pmo-check'}),dynamic=make('input',null,{type:'checkbox','data-pmo-dynamic':''});dynamicLabel.prepend(dynamic);box.append(dynamicLabel);
    const status=make('p','',{role:'status','aria-live':'polite','data-pmo-status':''}),counts=make('output','',{'data-pmo-counts':''});box.append(status,counts);
    const help=make('details'),summary=make('summary','Branchement vers Ableton');help.append(summary,make('p','Windows : lance loopMIDI et crée un port Pilami Rebond. Autorise le MIDI ici, sélectionne ce port et active l’envoi. Dans Live : active Piste en entrée pour ce port ; sur une piste MIDI avec un instrument, choisis ce port et Monitor In (ou Auto avec la piste armée). La note 36 convient pour commencer avec un Drum Rack.'),make('p','Les notes s’arrêtent automatiquement. Arrêter le visuel coupe la note en cours. Les réglages de sortie restent dans cette session ; le MIDI Learn des entrées est indépendant. Les exports de pages publiques jouent uniquement le visuel, sans MIDI.'));
    box.append(help);host.append(box);
    let portsKey='',disposed=false;
    function refresh(){
      box.hidden=!state.source;
      const key=JSON.stringify(state.ports);
      if(key!==portsKey||!select.children.length){portsKey=key;select.replaceChildren(make('option','Choisir une sortie…',{value:''}));for(const p of state.ports)select.append(make('option',p.name,{value:p.id}));}
      select.value=state.port;select.disabled=state.busy||!state.available;
      authorize.disabled=state.busy;authorize.textContent=state.available?'Actualiser les sorties':'Autoriser le MIDI';
      arm.disabled=state.busy||!state.port;arm.textContent=state.enabled?'Désactiver l’envoi':'Activer l’envoi';arm.setAttribute('aria-pressed',String(state.enabled));
      test.disabled=!state.enabled||state.busy;drop.disabled=!state.source;
      for(const [key,input]of Object.entries(inputs)){if(doc.activeElement!==input)input.value=String(state[key]);}
      inputs.velocity.disabled=state.dynamic;dynamic.checked=state.dynamic;
      const text=(state.running?'':'Visuel en pause. ')+state.message;if(status.textContent!==text)status.textContent=text;status.dataset.pmoError=String(state.error);
      counts.textContent='Impacts : '+state.impacts+' · Notes de rebond envoyées : '+state.notes+' · Tests : '+state.tests;
    }
    authorize.addEventListener('click',connect);arm.addEventListener('click',()=>state.enabled?disable():enable());test.addEventListener('click',()=>send(1,true));drop.addEventListener('click',reset);
    select.addEventListener('change',()=>configure('port',select.value));dynamic.addEventListener('change',()=>configure('dynamic',dynamic.checked));
    listeners.add(refresh);refresh();
    function dispose(){if(disposed)return;disposed=true;listeners.delete(refresh);win.removeEventListener('pagehide',dispose);box.remove();}
    win.addEventListener('pagehide',dispose,{once:true});return{dispose};
  }
  window.PilamiMidiOutput=Object.freeze({state,connect,enable,disable,configure,source,release,setRunning,silence,mount});
  window.addEventListener('pagehide',()=>{disable();release();});
})();
