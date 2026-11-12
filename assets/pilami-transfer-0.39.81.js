// Portable complete Hydra presets. AGPL-3.0-or-later.
(function(){
  'use strict';
  const marker=/\/\* PILAMI_PRESET_FULL_V1 ([^]*?) \*\//g;
  const snapshots=()=>window.PilamiHydraSnapshots;
  function strip(source){return source.replace(marker,'').trimEnd();}
  function validateMidiSettings(raw){
    if(raw===undefined||raw===null)return null;
    if(!Number.isInteger(raw.smoothing)||raw.smoothing<0||raw.smoothing>300)return false;
    const o=raw.output;
    if(o!==null&&(!o||typeof o.dynamic!=='boolean'||!Object.entries({channel:[1,16],number:[0,127],duration:[10,2000],velocity:[1,127]}).every(([k,[min,max]])=>Number.isInteger(o[k])&&o[k]>=min&&o[k]<=max)))return false;
    return{ smoothing:raw.smoothing, output:o?{channel:o.channel,number:o.number,duration:o.duration,velocity:o.velocity,dynamic:o.dynamic}:null };
  }
  function read(source,entries){
    const matches=[...source.matchAll(marker)];if(!matches.length)return null;
    if(matches.length!==1)throw Error('Plusieurs blocs d’export complet dans ce fichier.');
    let raw;try{raw=JSON.parse(matches[0][1]);}catch(_){throw Error('Export complet illisible.');}
    if(raw?.version!==1||raw.signature!==snapshots().fingerprint(source).signature)throw Error('Export complet incompatible avec ce code.');
    const midi=raw.midi===null?null:window.PilamiHydraMidi.validate(raw.midi,entries);
    const sequencer=raw.sequencer===null?null:window.PilamiHydraSequencer.validatePattern(raw.sequencer);
    if((raw.midi!==null&&!midi)||(raw.sequencer!==null&&!sequencer))throw Error('Associations MIDI ou séquenceur du fichier invalides.');
    const restore=raw.restore??{audio:true,snapshots:true,midi:true,sequencer:true};
    if(!['audio','snapshots','midi','sequencer'].every(k=>typeof restore[k]==='boolean'))throw Error('Options de restauration invalides.');
    const midiSettings=validateMidiSettings(raw.midiSettings);if(midiSettings===false)throw Error('Réglages MIDI invalides.');
    const bank=snapshots().readPortable(source,entries);
    return {version:1,signature:raw.signature,midi,sequencer,midiSettings,restore:{audio:restore.audio,snapshots:restore.snapshots,midi:restore.midi,sequencer:restore.sequencer},bank};
  }
  function append(source,data){
    const output=strip(source)+'\n\n/* PILAMI_PRESET_FULL_V1 '+JSON.stringify(data).replace(/\*/g,'\\u002a').replace(/</g,'\\u003c')+' */\n';
    if(new TextEncoder().encode(output).length>16777216)throw Error('L’export complet dépasse 16 Mo.');return output;
  }
  function exportFull(options){
    const source=strip(options.source),bank=snapshots().getExportBank({...options,source,portableFallback:false}),previous=read(options.source,options.entries);
    const midi=bank?(bank.midi||null):(previous?.midi||null);
    const identity=options.storageKey+'|'+options.preset+':'+snapshots().fingerprint(source).hash;
    const sequencer=options.sequencer??window.PilamiHydraSequencer.readStoredPattern(identity)??previous?.sequencer??window.PilamiHydraSequencer.readPattern(identity);
    const output=window.PilamiMidiOutput?.state;
    const midiSettings={smoothing:window.PilamiHydraMidi.state.smoothing,output:output?{channel:output.channel,number:output.number,duration:output.duration,velocity:output.velocity,dynamic:output.dynamic}:null};
    const text=snapshots().writePortable(source,bank||previous?.bank,options.entries);
    const result=append(text,{version:1,signature:snapshots().fingerprint(source).signature,midi,sequencer,midiSettings,restore:{audio:true,snapshots:true,midi:true,sequencer:true}});
    read(result,options.entries);return result;
  }
  function withoutAudio(source){
    const edits=[],tree=window.acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true});
    function walk(node){
      if(!node||typeof node!=='object')return;
      if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&node.callee.name==='audioMod'&&node.arguments.length){const first=node.arguments[0];edits.push({from:node.start,to:first.start},{from:first.end,to:node.end});walk(first);return;}
      for(const value of Object.values(node))if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);
    }walk(tree);
    let result=source;for(const edit of edits.sort((a,b)=>b.from-a.from))result=result.slice(0,edit.from)+result.slice(edit.to);
    return window.PilamiNoteSources.write(result,{version:1,sources:[],triggers:[],scales:[],mutedBands:Array.from({length:16},(_,i)=>i),scriptBands:[]});
  }
  function select(source,entries,choices){
    const full=read(source,entries);if(!full)throw Error('Ce fichier ne contient pas d’export complet.');
    let text=strip(source),bank=choices.snapshots?full.bank:null;
    text=snapshots().writePortable(text,null,entries);
    if(!choices.audio){text=withoutAudio(text);if(bank)bank={...bank,slots:bank.slots.map(slot=>slot?{...slot,values:slot.values.map(v=>({...v,audio:null}))}:null)};}
    text=snapshots().writePortable(text,bank,entries);
    return append(text,{version:1,signature:snapshots().fingerprint(text).signature,midi:choices.midi?full.midi:null,midiSettings:choices.midi?full.midiSettings:null,sequencer:choices.sequencer?full.sequencer:null,restore:{audio:Boolean(choices.audio),snapshots:Boolean(choices.snapshots),midi:Boolean(choices.midi),sequencer:Boolean(choices.sequencer)}});
  }
  function choose(doc,full){return new Promise(resolve=>{
    const dialog=doc.createElement('dialog');dialog.className='pilami-note-dialog';dialog.setAttribute('aria-label','Restaurer un preset complet');
    const heading=doc.createElement('h3');heading.textContent='Restaurer le preset complet';dialog.append(heading);
    const help=doc.createElement('p');help.textContent='Choisis les éléments à reprendre. Les éléments cochés remplacent ceux de ce preset dans ce navigateur. Le séquenceur restera arrêté.';dialog.append(help);
    const fields={};
    for(const [key,title]of [['audio','Sources, gammes et liaisons audio'],['snapshots','Snapshots et réglages de morphing · '+(full.bank?.slots.filter(Boolean).length||0)+' captures'],['midi','Associations MIDI · '+(full.midi?.mappings.length||0)],['sequencer','Grille et réglages du séquenceur']]){
      const label=doc.createElement('label'),input=doc.createElement('input');input.type='checkbox';input.checked=full.restore[key];input.disabled=(key==='snapshots'&&!full.bank)||(key==='sequencer'&&!full.sequencer);if(input.disabled)input.checked=false;
      label.append(input,doc.createTextNode(' '+title));dialog.append(label);fields[key]=input;
    }
    const hint=doc.createElement('p');hint.className='pilami-control-help';hint.textContent='Sur un autre ordinateur, sélectionne les périphériques MIDI et l’entrée audio disponibles. Aucune connexion n’est activée par cet import.';dialog.append(hint);
    const buttons=doc.createElement('div');buttons.className='pilami-note-actions';const cancel=doc.createElement('button'),apply=doc.createElement('button');cancel.type=apply.type='button';cancel.textContent='Annuler';apply.textContent='Restaurer la sélection';buttons.append(cancel,apply);dialog.append(buttons);
    let done=false;function finish(value){if(done)return;done=true;dialog.close();dialog.remove();resolve(value);}
    cancel.addEventListener('click',()=>finish(null));apply.addEventListener('click',()=>finish(Object.fromEntries(Object.entries(fields).map(([k,f])=>[k,f.checked]))));dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null);});
    doc.body.append(dialog);dialog.showModal();apply.focus();
  });}
  function restore(manager,full){
    if(full.restore.snapshots&&full.bank)manager.restorePortable(full.bank);
    if(full.restore.midi){
      if(!manager.setMidi(full.midi||{version:1,mappings:[]}))throw Error('Associations MIDI non restaurées.');
      const settings=full.midiSettings;
      if(settings){manager.midiManager()?.setSmoothing(settings.smoothing);if(settings.output&&window.PilamiMidiOutput){window.PilamiMidiOutput.disable();for(const [key,value]of Object.entries(settings.output))window.PilamiMidiOutput.configure(key,value);}}
    }
    if(full.restore.sequencer&&full.sequencer&&!manager.sequencer?.importPattern(full.sequencer))throw Error('Séquenceur non restauré.');
  }
  window.PilamiHydraTransfer={restore,read,strip,exportFull,select,choose,withoutAudio};
})();
