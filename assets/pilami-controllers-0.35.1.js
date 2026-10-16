(function(){
  'use strict';
  const cssURL=new URL('pilami-controllers-0.35.1.css',document.currentScript.src).href;
  const MIME='application/x-pilami-audio-band';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const number=value=>String(Math.round(value*1e6)/1e6);
  function audioLevel(band){const level=Number(window.PilamiStrudelHydra.audio()?.fft[band]);return Number.isFinite(level)?clamp(level,0,1):0;}
  function validateAudio(options){
    if(!options||!Number.isInteger(options.band)||options.band<0||options.band>15||!Number.isFinite(options.depth))throw new Error('audioMod : band de 0 à 15 et depth numérique requis.');
    return {band:options.band,depth:options.depth};
  }
  function value(entry){const result=clamp(entry.value+(entry.audio?audioLevel(entry.audio.band)*entry.audio.depth:0),entry.min,entry.max);return entry.kind==='toggle'?(result>=(entry.min+entry.max)/2?entry.max:entry.min):result;}
  function create({source,parsed,entries,pairs,active,write,say,snapshotContext}){
    let alive=true;const listeners=new Set();
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
      const required=Math.max(0,...entries.filter(e=>e.audio).map(e=>e.audio.band+1));
      parsed.bins.forEach(bin=>{if(bin.value<required)edits.push({...bin,text:String(required)});});
      let output=source,previous=Infinity;
      for(const edit of edits.sort((a,b)=>b.from-a.from)){
        if(edit.to>previous)throw new Error('Ces contrôleurs imbriqués ne peuvent pas être édités automatiquement.');
        output=output.slice(0,edit.from)+edit.text+output.slice(edit.to);previous=edit.from;
      }
      if(new TextEncoder().encode(output).length>65536)throw new Error('Le code dépasserait 64 Ko.');
      return output;
    }
    function change(action,midiEntries=null){
      if(!available())return false;
      const before=entries.map(entry=>({entry,value:entry.value,min:entry.min,max:entry.max,rangeEdited:entry.rangeEdited,stepEdited:entry.stepEdited,kind:entry.kind,step:entry.step,sliderStep:entry.sliderStep,audio:entry.audio?{...entry.audio}:null}));
      try{action();write(code());model.snapshots?.edited(midiEntries);notify();return true;}
      catch(error){before.forEach(({entry,...saved})=>Object.assign(entry,saved));say(error.message,true);notify();return false;}
    }
    function quantize(entry,next){const step=Number(entry.step);return clamp(step>0?Number((entry.min+Math.round((next-entry.min)/step)*step).toPrecision(14)):next,entry.min,entry.max);}
    const pads=pairs.slice(),used=new Set(pairs.flatMap(pair=>[pair.x,pair.y]));
    entries.forEach(x=>{
      const match=x.label.match(/^(.*?)[_]?[Xx]$/);if(!match||!match[1]||used.has(x))return;
      const prefix=match[1].replace(/_$/,'');const y=entries.find(e=>e!==x&&e.label.replace(/_?[Yy]$/,'')===prefix&&/[Yy]$/.test(e.label)&&!used.has(e));
      if(y){pads.push({title:prefix.replace(/_/g,' '),x,y});used.add(x);used.add(y);}
    });
    const model={
      entries,pads,selectedBand:null,available,
      subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
      setBase(entry,next){return Number.isFinite(next)?change(()=>{entry.value=quantize(entry,next);}):false;},
      setMidiValues(values){const valid=values.filter(({entry,value})=>entries.includes(entry)&&Number.isFinite(value));return valid.length?change(()=>valid.forEach(({entry,value})=>{entry.value=quantize(entry,value);}),valid.map(({entry})=>entry)):false;},
      setRange(entry,min,max){
        if(!available())return false;
        if(entry.kind==='toggle'){say('Un interrupteur garde ses bornes 0 et 1.',true);return false;}
        if(!Number.isFinite(min)||!Number.isFinite(max)||min>=max){say('Bornes : deux nombres finis et Min < Max sont requis.',true);return false;}
        if(entry.min===min&&entry.max===max)return true;
        return change(()=>{entry.min=min;entry.max=max;entry.rangeEdited=true;entry.value=clamp(entry.value,min,max);});
      },
      setXY(pair,x,y){change(()=>{pair.x.value=quantize(pair.x,x);pair.y.value=quantize(pair.y,y);});},
      setKind(entry,kind){if(!['slider','knob','fader','toggle'].includes(kind))return;if(kind==='toggle'&&(entry.min!==0||entry.max!==1))return;change(()=>{entry.kind=kind;entry.step=kind==='toggle'?1:entry.sliderStep;if(kind==='toggle')entry.value=entry.value>=.5?1:0;});},
      async bind(targets,band){
        if(!available()||!Number.isInteger(band)||band<0||band>15)return;
        // Create the analyzer in the current renderer; the visual's phase and zoom stay intact.
        try{await window.PilamiStrudelHydra.enableControlAudio(band);if(!available())return;
          if(change(()=>targets.forEach(entry=>{entry.audio={band,depth:entry.audio?.depth??(entry.max-entry.min)*.15};}))){this.selectedBand=null;notify();say('a.fft['+band+'] lié à '+targets.map(e=>e.label).join(' + ')+'.');}
        }catch(error){say(error.message,true);}
      },
      setDepth(entry,depth){if(Number.isFinite(depth))change(()=>{if(entry.audio)entry.audio.depth=depth;});},
      unlink(entry){change(()=>{entry.audio=null;});},
      selectBand(band){this.selectedBand=this.selectedBand===band?null:band;notify();},
      captureState(){return entries.map(e=>({label:e.label,kind:e.kind,value:e.value,min:e.min,max:e.max,step:e.step,sliderStep:e.sliderStep,audio:e.audio?{...e.audio}:null}));},
      applyState(state){
        const next=window.PilamiHydraSnapshots.validateState(state,entries);
        if(!next)return false;
        return change(()=>entries.forEach((entry,index)=>{const saved=next[index];if(entry.min!==saved.min||entry.max!==saved.max)entry.rangeEdited=true;if(entry.step!==saved.step)entry.stepEdited=true;Object.assign(entry,saved);}));
      },
      dispose(){alive=false;model.midi?.dispose();model.snapshots?.dispose();listeners.clear();}
    };
    if(snapshotContext&&entries.length&&window.PilamiHydraSnapshots)model.snapshots=window.PilamiHydraSnapshots.create({model,source,context:snapshotContext,say,notify});
    if(model.snapshots&&window.PilamiHydraMidi)model.midi=window.PilamiHydraMidi.create(model);
    return model;
  }
  function element(doc,tag,text,attributes={}){const node=doc.createElement(tag);if(text!==null)node.textContent=text;Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,value));return node;}
  function mount(host,root,model){
    const doc=host.ownerDocument,win=doc.defaultView;let alive=true,frame=null,last=0,signature='',rows=[],pads=[],bankCount=0,meters=[];
    const surface=element(doc,'div',null,{class:'pilami-controller-surface'}),bank=element(doc,'section',null,{class:'pilami-audio-bank','aria-label':'Sources audio'});
    const heading=element(doc,'div',null,{class:'pilami-audio-heading'}),connect=element(doc,'button','Activer l’entrée audio',{type:'button','data-control-audio-connect':''});
    heading.append(element(doc,'h4','Sources audio'),connect);
    const hint=element(doc,'p','Glisse une bande sur un paramètre, sur X, sur Y ou sur le pad entier. Tu peux aussi cliquer la source, puis la destination.',{class:'pilami-control-help'});
    const sources=element(doc,'div',null,{class:'pilami-audio-sources'}),audioStatus=element(doc,'p','Lance un visuel pour activer l’entrée audio.',{class:'pilami-control-help','data-control-audio-status':'',role:'status'});
    bank.append(heading,hint,sources,audioStatus);
    const empty=element(doc,'p','Lance un visuel avec slider() pour afficher ses paramètres.',{'data-control-empty':'',class:'pilami-control-help'}),content=element(doc,'div',null,{class:'pilami-control-grid'});
    const snapshotHost=element(doc,'div',null,{'data-snapshot-host':''}),midiHost=element(doc,'div',null,{'data-midi-host':''});surface.append(snapshotHost,midiHost,bank,empty,content);host.replaceChildren(surface);
    const snapshotView=window.PilamiHydraSnapshots?.mount(snapshotHost,model?.snapshots),midiView=window.PilamiHydraMidi?.mount(midiHost,model?.midi);surface.classList.toggle('has-snapshots',Boolean(model?.snapshots&&model.entries.length));
    connect.addEventListener('click',async()=>{connect.disabled=true;try{await window.PilamiStrudelHydra.enableControlAudio(0,true);}catch(error){audioStatus.textContent=error.message;}finally{connect.disabled=false;refresh();}});
    function dropZone(node,targets){
      node.dataset.controlDrop=targets.map(entry=>entry.label).join('+');
      node.addEventListener('dragover',event=>{if(Array.from(event.dataTransfer.types).includes(MIME)){event.preventDefault();event.dataTransfer.dropEffect='link';node.classList.add('is-drop-target');}});
      node.addEventListener('dragleave',()=>node.classList.remove('is-drop-target'));
      node.addEventListener('drop',event=>{
        if(!Array.from(event.dataTransfer.types).includes(MIME))return;event.preventDefault();event.stopPropagation();node.classList.remove('is-drop-target');const raw=event.dataTransfer.getData(MIME);
        if(!/^\d+$/.test(raw))return;model.bind(targets,Number(raw));
      });
      node.addEventListener('click',event=>{const widget=event.target.closest('input,select,button');if(widget&&widget!==node&&!widget.classList.contains('pilami-control-destination'))return;if(model.selectedBand!==null){event.preventDefault();event.stopPropagation();model.bind(targets,model.selectedBand);}});
    }
    function renderBank(){
      const count=Math.min(16,Math.max(5,window.PilamiStrudelHydra.audio()?.fft.length||0));if(count===bankCount)return;bankCount=count;sources.replaceChildren();
      meters=Array.from({length:count},(_,band)=>{
        const button=element(doc,'button',null,{type:'button',draggable:'true',class:'pilami-audio-source','data-audio-band':String(band),'aria-label':'Source audio a.fft['+band+']','aria-pressed':'false'}),meter=element(doc,'meter',null,{min:'0',max:'1',value:'0','aria-label':'Niveau de la bande '+band});
        button.append(element(doc,'span','a.fft['+band+']'),meter);
        button.addEventListener('dragstart',event=>{event.dataTransfer.setData(MIME,String(band));event.dataTransfer.effectAllowed='link';});
        button.addEventListener('click',()=>{if(model){model.selectBand(band);refresh();}else audioStatus.textContent='Lance un visuel avec des contrôleurs avant de créer une liaison.';});sources.append(button);return{band,button,meter};
      });
    }
    function makeCard(entry){
      const card=element(doc,'section',null,{class:'pilami-control-card','data-control-id':entry.id}),top=element(doc,'div',null,{class:'pilami-control-heading'});
      const title=element(doc,'button',entry.label,{type:'button',class:'pilami-control-destination','aria-label':'Lier une source à '+entry.label}),kind=element(doc,'select',null,{'aria-label':'Présentation de '+entry.label,'data-control-kind':entry.label});
      const kinds=[['slider','Curseur'],['knob','Potentiomètre'],['fader','Fader vertical']];if(entry.min===0&&entry.max===1)kinds.push(['toggle','Interrupteur']);
      kinds.forEach(([value,label])=>kind.append(element(doc,'option',label,{value})));kind.value=entry.kind;kind.addEventListener('change',()=>model.setKind(entry,kind.value));top.append(title,kind);
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
      input.hidden=['knob','toggle'].includes(entry.kind);input.classList.toggle('pilami-fader',entry.kind==='fader');control.prepend(knob,toggle);
      const effective=element(doc,'p','',{class:'pilami-control-help','data-control-effective':entry.label});card.append(top,control,valueStatus,effective);
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
      apply.addEventListener('click',applyRange);minLabel.append(min);maxLabel.append(max);bounds.append(minLabel,maxLabel,apply,rangeStatus);bounds.hidden=entry.kind==='toggle';card.append(bounds);
      let depth=null;
      if(entry.audio){
        const routing=element(doc,'div',null,{class:'pilami-audio-routing'}),source=element(doc,'select',null,{'aria-label':'Bande audio de '+entry.label,'data-control-band':entry.label});
        const count=Math.max(5,window.PilamiStrudelHydra.audio()?.fft.length||0,entry.audio.band+1);for(let band=0;band<Math.min(16,count);band++)source.append(element(doc,'option','a.fft['+band+']',{value:String(band)}));source.value=entry.audio.band;source.addEventListener('change',()=>model.bind([entry],Number(source.value)));
        const label=element(doc,'label','Profondeur ');depth=element(doc,'input',null,{type:'number',step:'any','aria-label':'Profondeur audio de '+entry.label,'data-control-depth':entry.label});depth.value=number(entry.audio.depth);depth.addEventListener('input',()=>{if(model.snapshots?.state.running)model.snapshots.stop();});depth.addEventListener('change',()=>{if(depth.value.trim())model.setDepth(entry,Number(depth.value));else refresh();});label.append(depth);
        const remove=element(doc,'button','Délier',{type:'button','data-control-unlink':entry.label});remove.addEventListener('click',()=>model.unlink(entry));routing.append(source,label,remove);card.append(routing);
      }
      const midiButton=element(doc,'button','MIDI Learn',{type:'button',class:'pilami-midi-control-learn','data-control-midi':entry.label,'aria-label':'Apprendre le MIDI pour '+entry.label});midiButton.addEventListener('click',()=>model.midi?.learn('control:'+model.entries.indexOf(entry)));card.append(midiButton);
      dropZone(card,[entry]);content.append(card);return{entry,input,output,midiButton,knob,needle,toggle,effective,depth,kind,bounds,min,max,rangeDraft:()=>rangeDraft,valueDraft:()=>valueDraft};
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
      pad.addEventListener('keydown',event=>{const stepX=Number(pair.x.step)>0?Number(pair.x.step):(pair.x.max-pair.x.min)/100,stepY=Number(pair.y.step)>0?Number(pair.y.step):(pair.y.max-pair.y.min)/100;let dx=0,dy=0;if(event.key==='ArrowLeft')dx=-stepX;if(event.key==='ArrowRight')dx=stepX;if(event.key==='ArrowUp')dy=stepY;if(event.key==='ArrowDown')dy=-stepY;if(dx||dy){event.preventDefault();model.setXY(pair,pair.x.value+dx,pair.y.value+dy);}});
      const output=element(doc,'output','');card.append(title,zones,pad,output,element(doc,'p','Glisse ici une bande pour lier X et Y ensemble. Le point plein suit le son ; le cercle indique la position manuelle.',{class:'pilami-control-help'}));content.append(card);return{pair,dot,base,output,xButton:x,yButton:y};
    }
    function render(){
      if(!model)return;const next=model.entries.map(entry=>entry.id+':'+entry.kind+':'+(entry.audio?entry.audio.band:'-')).join('|');if(next===signature)return;signature=next;content.replaceChildren();pads=model.pads.map(makePad);rows=model.entries.map(makeCard);
    }
    function refresh(){
      if(!alive)return;renderBank();render();snapshotView?.refresh();midiView?.refresh();empty.hidden=Boolean(model?.entries.length);
      const audio=window.PilamiStrudelHydra.audio();connect.textContent=audio?.stream?.active?'Reconnecter l’entrée audio':'Activer l’entrée audio';
      const mic=root.querySelector('[data-hydra-audio-status]')?.textContent;
      if(model?.selectedBand!==null&&model?.selectedBand!==undefined)audioStatus.textContent='a.fft['+model.selectedBand+'] sélectionné : clique une destination.';
      else if(mic)audioStatus.textContent=mic+' · '+(audio?.fft.length||0)+' bandes, des graves aux aigus.';
      meters.forEach(({band,button,meter})=>{meter.value=audioLevel(band);button.setAttribute('aria-pressed',String(model?.selectedBand===band));button.classList.toggle('is-selected',model?.selectedBand===band);button.classList.toggle('is-unavailable',!audio||band>=audio.fft.length);});
      rows.forEach(row=>{const e=row.entry,current=value(e),target='control:'+model.entries.indexOf(e),binding=model.midi?.mappings().find(m=>m.target===target),learning=window.PilamiHydraMidi?.state.learning;
        const midiText=learning?.owner===model.midi&&learning.target===target?'En attente MIDI…':binding?'MIDI · '+(binding.type==='cc'?'CC ':'note ')+binding.number:'MIDI Learn';if(row.midiButton.textContent!==midiText)row.midiButton.textContent=midiText;row.midiButton.title=binding?window.PilamiHydraMidi.describe(binding):'Clique puis envoie un message MIDI';row.midiButton.hidden=!model.midi;
        row.input.min=e.min;row.input.max=e.max;row.input.step=e.step;row.knob.setAttribute('aria-valuemin',e.min);row.knob.setAttribute('aria-valuemax',e.max);
        if(!row.rangeDraft()){row.min.value=String(e.min);row.max.value=String(e.max);}
        const toggleOption=row.kind.querySelector('option[value="toggle"]');
        if(e.min===0&&e.max===1){if(!toggleOption)row.kind.append(element(doc,'option','Interrupteur',{value:'toggle'}));}else toggleOption?.remove();
        if(row.input.value!==String(e.value))row.input.value=e.value;if(!row.valueDraft())row.output.value=String(e.value);row.knob.setAttribute('aria-valuenow',number(e.value));row.needle.style.transform='rotate('+(-135+(e.value-e.min)/(e.max-e.min)*270)+'deg)';row.toggle.setAttribute('aria-checked',String(e.value>=.5));row.toggle.textContent=e.value>=.5?'Activé':'Désactivé';row.effective.textContent=e.audio?'Valeur avec audio : '+number(current)+' · a.fft['+e.audio.band+'] × '+number(e.audio.depth):'Valeur manuelle';if(row.depth&&doc.activeElement!==row.depth)row.depth.value=number(e.audio.depth);
      });
      pads.forEach(({pair,dot,base,output,xButton,yButton})=>{const x=value(pair.x),y=value(pair.y);dot.style.left=(x-pair.x.min)/(pair.x.max-pair.x.min)*100+'%';dot.style.top=(pair.y.max-y)/(pair.y.max-pair.y.min)*100+'%';base.style.left=(pair.x.value-pair.x.min)/(pair.x.max-pair.x.min)*100+'%';base.style.top=(pair.y.max-pair.y.value)/(pair.y.max-pair.y.min)*100+'%';output.textContent='X '+number(x)+' · Y '+number(y);[[xButton,pair.x,'X'],[yButton,pair.y,'Y']].forEach(([button,entry,axis])=>{button.textContent=entry.audio?axis+' · a.fft['+entry.audio.band+'] × '+number(entry.audio.depth):'Lier '+axis+' · '+entry.label;button.classList.toggle('has-audio',Boolean(entry.audio));});});
    }
    // The existing 20 Hz UI clock is sufficient during morphing; model values
    // and the renderer still advance on every animation frame. Refresh endpoints
    // and direct edits immediately.
    const unsubscribe=model?.subscribe(()=>{if(!model.snapshots?.state.running)refresh();});
    function tick(now){if(!alive||win.closed||!host.isConnected)return;if(now-last>=50){last=now;refresh();}frame=win.requestAnimationFrame(tick);}
    refresh();frame=win.requestAnimationFrame(tick);
    return{refresh,dispose(){alive=false;unsubscribe?.();snapshotView?.dispose();midiView?.dispose();if(frame&&!win.closed)win.cancelAnimationFrame(frame);}};
  }
  window.PilamiHydraControls={create,mount,value,validateAudio,audioLevel,cssURL};
})();
