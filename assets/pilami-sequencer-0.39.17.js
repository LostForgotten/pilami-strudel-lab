/* Pilami Strudel Lab — visual snapshot sequencer, AGPL-3.0-or-later.
 * Browser-local programs, Link clock when present, internal clock otherwise.
 * No tempo or transport instructions are sent to Ableton Live.
 */
(() => {
  'use strict';
  const MAX_STEPS = 8;
  const BARS = [1, 2, 4, 8];
  const DEFAULTS = [
    {slot:0,bars:2,action:'recall'},
    {slot:1,bars:2,action:'morph'},
    {slot:2,bars:2,action:'morph'},
    {slot:3,bars:2,action:'morph'}
  ];
  const copySteps = steps => steps.map(step=>({...step}));
  const validStep = step => step && Number.isInteger(step.slot) && step.slot>=0 && step.slot<10 &&
    BARS.includes(step.bars) && ['recall','morph'].includes(step.action);
  const key = identity => 'pilami-visual-sequencer-v1:'+identity;
  const read = identity => {
    try {
      const saved=JSON.parse(localStorage.getItem(key(identity)) || 'null');
      if(saved && Array.isArray(saved.steps) && saved.steps.length>=1 && saved.steps.length<=MAX_STEPS && saved.steps.every(validStep)){
        return {steps:copySteps(saved.steps),loop:saved.loop!==false,bpm:Number.isFinite(saved.bpm)&&saved.bpm>=40&&saved.bpm<=240?saved.bpm:120};
      }
    } catch (_) {}
    return {steps:copySteps(DEFAULTS),loop:true,bpm:120};
  };
  function create({model,identity}){
    const clock=window.PilamiAbletonLink;
    const observers=new Set();
    let bank=identity, settings=read(bank), disposed=false, timer=null, timerDue=0, nextBeat=null, nextIndex=0, index=-1, linkMode=false, internalDeadline=0, internalBpm=120, generation=0, activeStart=0, activeDuration=0;
    const state={steps:settings.steps,loop:settings.loop,bpm:settings.bpm,running:false,armed:false,active:-1,clock:'Interne',message:'Configure les étapes, puis lance la séquence.',error:false};
    const publish=()=>{for(const observer of [...observers])try{observer();}catch(error){console.error('Pilami sequencer UI:',error);}};
    function save(){try{localStorage.setItem(key(bank),JSON.stringify({steps:state.steps,loop:state.loop,bpm:state.bpm}));}catch(_){}}
    function clearTimer(){if(timer!==null)clearTimeout(timer);timer=null;timerDue=0;}
    function reset(message='Séquence arrêtée.',error=false){
      generation++;clearTimer();nextBeat=null;index=-1;nextIndex=0;state.running=false;state.armed=false;state.active=-1;state.message=message;state.error=error;publish();
    }
    function stop(message){if(!state.running)return false;reset(message||'Séquence arrêtée.');return true;}
    function healthyLink(){const sample=clock?.sample?.();return clock?.connected()&&sample&&Number.isFinite(sample.beat)&&Number.isFinite(sample.bpm)&&sample.bpm>0?sample:null;}
    function runStep(beatTarget=null){
      if(disposed||!state.running)return;
      const step=state.steps[nextIndex];if(!step||!model.state.slots[step.slot]){reset('Une étape référence un snapshot vide. Séquence arrêtée.',true);return;}
      const targetIndex=nextIndex;
      index=targetIndex;state.active=index;state.armed=false;
      const bpm=linkMode?(healthyLink()?.bpm||internalBpm):internalBpm;
      const durationSeconds=step.bars*4*60/bpm;
      activeStart=performance.now();activeDuration=durationSeconds*1000;
      // A new step takes over from the previous visual morph. No MIDI mappings are deleted.
      model.stop();
      if(step.action==='morph'){
        model.morphTo(step.slot, linkMode?{startBeat:beatTarget,durationBeats:step.bars*4,seconds:durationSeconds}:{seconds:durationSeconds});
      }else model.recall(step.slot);
      state.message='Étape '+(index+1)+'/'+state.steps.length+' · snapshot '+(step.slot+1)+' · '+step.bars+' mesure'+(step.bars>1?'s':'');
      const advance=targetIndex+1;
      if(advance>=state.steps.length && !state.loop){
        // The last step keeps playing until its full duration ends.
        nextIndex=-1;
      }else nextIndex=advance%state.steps.length;
      if(linkMode){nextBeat=beatTarget+step.bars*4;scheduleLink();}
      else{internalDeadline=performance.now()+durationSeconds*1000;scheduleInternal();}
      publish();
    }
    function internalFire(){timer=null;if(disposed||!state.running)return;if(nextIndex===-1){reset('Séquence terminée.');return;}runStep();}
    function scheduleInternal(){
      if(!state.running||linkMode)return;
      clearTimer();
      const due=Math.max(0,internalDeadline-performance.now());
      timer=setTimeout(internalFire,due);timerDue=internalDeadline;
    }
    function linkFire(){
      timer=null;if(disposed||!state.running||!linkMode)return;
      const sample=healthyLink();if(!sample){reset('Connexion Link perdue · séquence arrêtée.',true);return;}
      // An inactive/background tab must not catch up by bursting old steps.
      if(sample.beat-nextBeat>2){reset('Horloge Link interrompue · relance la séquence.',true);return;}
      const ms=(nextBeat-sample.beat)*60000/sample.bpm;
      if(ms>12){scheduleLink();return;}
      if(nextIndex===-1){reset('Séquence terminée.');return;}
      runStep(nextBeat);
    }
    function scheduleLink(){
      if(disposed||!state.running||!linkMode)return;
      const sample=healthyLink();if(!sample){reset('Connexion Link perdue · séquence arrêtée.',true);return;}
      const remaining=(nextBeat-sample.beat)*60000/sample.bpm;
      if(remaining< -600){reset('Horloge Link interrompue · relance la séquence.',true);return;}
      const due=performance.now()+Math.max(0,remaining);
      if(timer!==null && Math.abs(timerDue-due)<7)return;
      clearTimer();timerDue=due;timer=setTimeout(linkFire,Math.max(0,remaining));
    }
    function start(){
      if(disposed||state.running)return false;
      if(!state.steps.length||state.steps.some(step=>!model.state.slots[step.slot])){
        state.message='Capture les snapshots utilisés par les étapes avant de lancer.';state.error=true;publish();return false;
      }
      generation++;index=-1;nextIndex=0;state.active=-1;state.running=true;state.armed=true;state.error=false;
      const sample=healthyLink();linkMode=Boolean(sample);state.clock=linkMode?'Ableton Link':'Interne';internalBpm=state.bpm;
      if(linkMode){
        nextBeat=(Math.floor(sample.beat/4)+1)*4;
        state.message='Link · attente de la prochaine mesure…';scheduleLink();
      }else{
        state.message='Horloge interne · '+state.bpm+' BPM';runStep();
      }
      publish();return true;
    }
    function edit(mutator){if(disposed||state.running)return false;mutator();save();state.message='Séquence modifiée · enregistrée sur ce navigateur.';state.error=false;publish();return true;}
    const api={state,start,stop,
      subscribe(fn){observers.add(fn);return()=>observers.delete(fn);},
      setLoop(value){return edit(()=>state.loop=Boolean(value));},
      setBpm(value){if(!Number.isInteger(value)||value<40||value>240)return false;return edit(()=>state.bpm=value);},
      updateStep(i,patch){if(!Number.isInteger(i)||i<0||i>=state.steps.length||!validStep({...state.steps[i],...patch}))return false;return edit(()=>state.steps[i]={...state.steps[i],...patch});},
      addStep(){if(state.steps.length>=MAX_STEPS)return false;return edit(()=>state.steps.push({slot:state.steps.length%10,bars:2,action:'morph'}));},
      removeStep(i){if(state.steps.length===1||i<0||i>=state.steps.length)return false;return edit(()=>state.steps.splice(i,1));},
      move(i,d){const j=i+d;if(i<0||j<0||i>=state.steps.length||j>=state.steps.length)return false;return edit(()=>{const step=state.steps.splice(i,1)[0];state.steps.splice(j,0,step);});},
      view(){
        let fraction=0;
        if(state.running&&!state.armed&&activeDuration){
          if(linkMode){const sample=healthyLink(),step=state.steps[index];fraction=sample&&step?Math.max(0,Math.min(1,(sample.beat-(nextBeat-step.bars*4))/(step.bars*4))):0;}
          else fraction=Math.max(0,Math.min(1,(performance.now()-activeStart)/activeDuration));
        }
        return {fraction,mode:state.clock,active:state.active,armed:state.armed,running:state.running};
      },
      switchBank(next){if(disposed)return;reset('Séquence prête.');bank=next;settings=read(bank);state.steps=settings.steps;state.loop=settings.loop;state.bpm=settings.bpm;publish();},
      dispose(){if(disposed)return;stop();disposed=true;unsubscribe?.();observers.clear();}
    };
    // Link state changes reschedule against the musical timeline (even at changing BPM).
    const unsubscribe=clock?.subscribe(()=>{if(state.running&&linkMode)scheduleLink();});
    return api;
  }
  function element(doc,tag,text,attrs={}){const el=doc.createElement(tag);if(text!==null)el.textContent=text;for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;}
  function mount({model,doc}){
    const seq=model.sequencer;
    if(!seq)return null;
    const section=element(doc,'section',null,{class:'pilami-seq', 'aria-label':'Séquenceur visuel de snapshots'});
    const details=element(doc,'details'),summary=element(doc,'summary',null),summaryLabel=element(doc,'strong','▦ Séquenceur visuel'),summaryInfo=element(doc,'span','',{class:'pilami-seq-summary'});
    summary.append(summaryLabel,summaryInfo);details.append(summary);
    const content=element(doc,'div',null,{class:'pilami-seq-content'}),tools=element(doc,'div',null,{class:'pilami-seq-tools'}),play=element(doc,'button','▶ Lancer',{type:'button','data-seq-play':''}),loop=element(doc,'input',null,{type:'checkbox','data-seq-loop':''});
    const loopLabel=element(doc,'label',' Boucle');loopLabel.prepend(loop);
    const bpm=element(doc,'input',null,{type:'number',min:'40',max:'240',step:'1',class:'pilami-seq-bpm','data-seq-bpm':''}),bpmLabel=element(doc,'label','BPM interne ');bpmLabel.append(bpm);
    const clockBadge=element(doc,'span','',{class:'pilami-seq-clock','data-seq-clock':''});tools.append(play,loopLabel,bpmLabel,clockBadge);
    const lanes=element(doc,'div',null,{class:'pilami-seq-steps','data-seq-steps':''}),footer=element(doc,'div',null,{class:'pilami-seq-footer'}),add=element(doc,'button','+ Étape',{type:'button','data-seq-add':''}),status=element(doc,'span','',{class:'pilami-control-help','data-seq-status':'',role:'status'});
    footer.append(add,status);content.append(tools,lanes,footer,element(doc,'p','Un morphing occupe toute la durée de son étape. Avec Link, lecture à partir de la prochaine mesure ; sans Link, horloge interne. Programme local à ce navigateur.',{class:'pilami-control-help pilami-seq-help'}));details.append(content);section.append(details);
    play.addEventListener('click',()=>seq.state.running?seq.stop():seq.start());
    add.addEventListener('click',()=>seq.addStep());
    loop.addEventListener('change',()=>seq.setLoop(loop.checked));
    bpm.addEventListener('change',()=>{if(!seq.setBpm(Number(bpm.value)))bpm.value=seq.state.bpm;});
    let rows=[],lastSignature='';
    const text=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
    function rebuild(){
      lanes.replaceChildren();rows=[];
      seq.state.steps.forEach((step,i)=>{
        const row=element(doc,'div',null,{class:'pilami-seq-step','data-seq-step':String(i)}),number=element(doc,'span',String(i+1),{class:'pilami-seq-index'});
        const slot=element(doc,'select',null,{'aria-label':'Snapshot étape '+(i+1)}),action=element(doc,'select',null,{'aria-label':'Action étape '+(i+1)}),bars=element(doc,'select',null,{'aria-label':'Durée étape '+(i+1)});
        for(let s=0;s<10;s++)slot.append(element(doc,'option','Snapshot '+(s+1),{value:String(s)}));
        for(const [value,label]of [['recall','Rappel'],['morph','Morphing']])action.append(element(doc,'option',label,{value}));
        for(const count of BARS)bars.append(element(doc,'option',count+' mesure'+(count>1?'s':''),{value:String(count)}));
        slot.value=String(step.slot);action.value=step.action;bars.value=String(step.bars);
        slot.addEventListener('change',()=>seq.updateStep(i,{slot:Number(slot.value)}));
        action.addEventListener('change',()=>seq.updateStep(i,{action:action.value}));
        bars.addEventListener('change',()=>seq.updateStep(i,{bars:Number(bars.value)}));
        const up=element(doc,'button','↑',{type:'button','aria-label':'Monter étape '+(i+1)}),down=element(doc,'button','↓',{type:'button','aria-label':'Descendre étape '+(i+1)}),del=element(doc,'button','×',{type:'button','aria-label':'Supprimer étape '+(i+1)}),track=element(doc,'div',null,{class:'pilami-seq-track'}),fill=element(doc,'span',null,{class:'pilami-seq-fill'});
        up.addEventListener('click',()=>seq.move(i,-1));down.addEventListener('click',()=>seq.move(i,1));del.addEventListener('click',()=>seq.removeStep(i));track.append(fill);
        row.append(number,slot,action,bars,up,down,del,track);lanes.append(row);
        rows.push({row,slot,action,bars,up,down,del,fill});
      });
    }
    let painting=null;
    function refresh(){
      const s=seq.state;
      const signature=JSON.stringify(s.steps);
      if(signature!==lastSignature){lastSignature=signature;rebuild();}
      text(summaryInfo,s.steps.length+' étapes'+(s.running?' · '+(s.armed?'attente Link':'lecture'):' · arrêt'));
      text(play,s.running?'■ Arrêter':'▶ Lancer');loop.checked=s.loop;
      if(doc.activeElement!==bpm)bpm.value=String(s.bpm);
      bpm.disabled=s.running;
      loop.disabled=s.running;add.disabled=s.running||s.steps.length>=MAX_STEPS;
      const sample=window.PilamiAbletonLink?.connected();
      text(clockBadge,s.running?s.clock:(sample?'Link disponible':'Horloge interne'));
      text(status,s.message);status.classList.toggle('is-error',s.error);
      rows.forEach(({row,slot,action,bars,up,down,del,fill},i)=>{
        const disabled=s.running;for(const input of [slot,action,bars,up,down,del])input.disabled=disabled;
        up.disabled=disabled||i===0;down.disabled=disabled||i===rows.length-1;del.disabled=disabled||rows.length===1;
        for(const option of slot.options)option.disabled=!model.state.slots[Number(option.value)]&&Number(option.value)!==s.steps[i].slot;
        row.classList.toggle('is-active',s.active===i);row.classList.toggle('is-armed',s.armed&&i===0);
      });
      paint();
    }
    function paint(){const view=seq.view();rows.forEach(({fill},i)=>{const fraction=i===view.active&&!view.armed?view.fraction:0;fill.style.width=(fraction*100).toFixed(1)+'%';});}
    // Animation is UI-only and stays idle when the panel is closed or playback stops.
    function animate(){
      if(!details.open||!seq.state.running||doc.defaultView.closed){painting=null;return;}
      paint();painting=doc.defaultView.requestAnimationFrame(animate);
    }
    function manageAnimation(){
      if(details.open&&seq.state.running&&painting===null)painting=doc.defaultView.requestAnimationFrame(animate);
      else if((!details.open||!seq.state.running)&&painting!==null){doc.defaultView.cancelAnimationFrame(painting);painting=null;}
    }
    const onUpdate=()=>{refresh();manageAnimation();};
    const unsubscribe=seq.subscribe(onUpdate);
    details.addEventListener('toggle',manageAnimation);
    refresh();
    return {node:section,refresh,dispose(){details.removeEventListener('toggle',manageAnimation);unsubscribe();if(painting!==null)doc.defaultView.cancelAnimationFrame(painting);}};
  }
  window.PilamiHydraSequencer={create,mount};
})();
