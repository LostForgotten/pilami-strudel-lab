/* Pilami Strudel Lab — step-grid snapshot sequencer (AGPL-3.0-or-later).
 * One snapshot trigger per column, browser-local patterns, Ableton Link read-only.
 * No tempo/transport messages are sent to Live. Approximate browser scheduling.
 */
(() => {
  'use strict';
  const SNAPSHOTS = 10, LENGTHS = [16,32];
  const SUBDIVISIONS = Object.freeze({'1/16':.25,'1/8':.5,'1/4':1,'1 mesure':4});
  const PALETTE=['#69bac2','#6f9ce3','#8f91dd','#ad88d3','#d18cb3','#cf938d','#d3aa7a','#b5bb77','#8ab987','#76b6aa'];
  const views=new Set();
  const bankKey = id => 'pilami-visual-sequencer-v2:'+id;
  const oldKey = id => 'pilami-visual-sequencer-v1:'+id;
  const validTrigger = item => item===null || (item && Number.isInteger(item.slot) && item.slot>=0 && item.slot<SNAPSHOTS && ['recall','morph'].includes(item.action));
  const empty = length => Array.from({length},()=>null);
  function read(id){
    try {
      const saved=JSON.parse(localStorage.getItem(bankKey(id))||'null');
      if(saved && LENGTHS.includes(saved.columns) && SUBDIVISIONS[saved.division] &&
          Array.isArray(saved.cells) && saved.cells.length===saved.columns && saved.cells.every(validTrigger)){
        return {columns:saved.columns,division:saved.division,cells:saved.cells.map(t=>t?{slot:t.slot,action:t.action}:null),
          loop:saved.loop!==false,followStop:saved.followStop!==false,followPlay:saved.followPlay!==false,bpm:Number.isInteger(saved.bpm)&&saved.bpm>=40&&saved.bpm<=240?saved.bpm:120,converted:false};
      }
    } catch (_) {}
    // Old timeline (v0.39.17/18): retain triggers and approximate their placement
    // without altering its existing saved data; users can still reinstall v0.39.18.
    try {
      const old=JSON.parse(localStorage.getItem(oldKey(id))||'null');
      if(old && Array.isArray(old.steps) && old.steps.length>0 && old.steps.length<=8 && old.steps.every(t=>t && Number.isInteger(t.slot)&&t.slot>=0&&t.slot<SNAPSHOTS && [1,2,4,8].includes(t.bars) && ['recall','morph'].includes(t.action))){
        const cells=empty(32),total=old.steps.reduce((sum,t)=>sum+t.bars*4,0),scale=total>32?32/total:1;
        let beat=0;
        for(const item of old.steps){const col=Math.min(31,Math.floor(beat*scale));cells[col]={slot:item.slot,action:item.action};beat+=item.bars*4;}
        return {columns:32,division:'1/4',cells,loop:old.loop!==false,followStop:true,followPlay:true,bpm:Number.isInteger(old.bpm)?old.bpm:120,converted:true};
      }
    } catch (_) {}
    return {columns:16,division:'1/16',cells:empty(16),loop:true,followStop:true,followPlay:true,bpm:120,converted:false};
  }
  function create({model,identity}){
    const clock=window.PilamiAbletonLink;
    const listeners=new Set();
    let bank=identity,initial=read(identity),disposed=false,timer=null,timerDue=0;
    let linkMode=false,baseBeat=0,baseTime=0,span=.25,periodMs=125,stepCount=0,lastTransport=null,lastTransportEvent=null;
    const state={...initial,running:false,armed:false,activeColumn:-1,clock:'Interne',message:initial.converted?'Ancienne séquence convertie en grille : vérifie les déclenchements.':'Clique une case pour ajouter un déclenchement.',error:false,structureVersion:0,cellVersion:0};
    delete state.converted;
    const publish=()=>{for(const fn of [...listeners])try{fn();}catch(error){console.error('Pilami grid listener:',error);}};
    const save=()=>{try{localStorage.setItem(bankKey(bank),JSON.stringify({columns:state.columns,division:state.division,cells:state.cells,loop:state.loop,followStop:state.followStop,followPlay:state.followPlay,bpm:state.bpm}));}catch(_){}};
    const clearTimer=()=>{if(timer!==null)clearTimeout(timer);timer=null;timerDue=0;};
    const healthyLink=()=>{const s=clock?.sample?.();return clock?.connected() && s && Number.isFinite(s.beat) && Number.isFinite(s.bpm) && s.bpm>0?s:null;};
    function reset(message='Séquence arrêtée.',error=false,stopMorph=false){
      clearTimer();state.running=false;state.armed=false;state.activeColumn=-1;state.message=message;state.error=error;
      if(stopMorph)model.stop();publish();
    }
    function stop(){if(!state.running)return false;reset('Séquence arrêtée.',false,true);return true;}
    const stepBeats=()=>SUBDIVISIONS[state.division];
    function nextTriggerDistance(column){
      for(let n=1;n<=state.columns;n++){
        if(!state.loop&&column+n>=state.columns)break;
        if(state.cells[(column+n)%state.columns] && model.state.slots[state.cells[(column+n)%state.columns].slot])return n;
      }
      return state.columns-column; // final morph in a one-shot sequence
    }
    function fireStep(){
      if(disposed||!state.running)return;
      const col=stepCount%state.columns;
      if(stepCount===state.columns&&!state.loop){reset('Séquence terminée.');return;}
      state.activeColumn=col;state.armed=false;
      const event=state.cells[col];
      if(event){
        if(!model.state.slots[event.slot]){state.message='Pas '+(col+1)+' · Snapshot '+(event.slot+1)+' non capturé · déclenchement ignoré.';}else{
        const beatTarget=baseBeat+stepCount*span;
        const bpm=linkMode?(healthyLink()?.bpm||state.bpm):state.bpm;
        const durationBeats=nextTriggerDistance(col)*span;
        model.stop();
        if(event.action==='morph'){
          model.morphTo(event.slot,linkMode?{startBeat:beatTarget,durationBeats,seconds:durationBeats*60/bpm}:{seconds:durationBeats*60/bpm});
        } else model.recall(event.slot);
        state.message='Pas '+(col+1)+' · Snapshot '+(event.slot+1)+' · '+(event.action==='morph'?'Morphing':'Rappel');
        }
      }
      stepCount++;
      schedule();
      if(event||stepCount===1)publish();
    }
    function clockTime(){
      const sample=linkMode?healthyLink():null;
      if(linkMode&&!sample)return null;
      const targetBeat=baseBeat+stepCount*span;
      return linkMode ? (targetBeat-sample.beat)*60000/sample.bpm : baseTime+stepCount*periodMs-performance.now();
    }
    function tick(){
      timer=null;if(disposed||!state.running)return;
      const remaining=clockTime();
      if(remaining===null){reset('Connexion Ableton Link perdue · séquence arrêtée.',true,true);return;}
      // Reject a dormant/background tab rather than launching stale triggers in a burst.
      if(remaining < -Math.max(220,periodMs*1.5)){reset('Horloge interrompue · relance la séquence.',true,true);return;}
      if(remaining>9){schedule();return;}
      fireStep();
    }
    function schedule(){
      if(!state.running||disposed)return;
      const remaining=clockTime();
      if(remaining===null){reset('Connexion Ableton Link perdue · séquence arrêtée.',true,true);return;}
      const due=performance.now()+Math.max(0,remaining);
      if(timer!==null&&Math.abs(timerDue-due)<7)return;
      clearTimer();timerDue=due;timer=setTimeout(tick,Math.max(0,remaining));
    }
    function start(fromLive=false){
      if(disposed||state.running)return false;
      const events=state.cells.filter(Boolean);
      if(!events.length){state.message='Ajoute au moins un déclenchement dans la grille.';state.error=true;publish();return false;}
      if(!events.some(t=>Boolean(model.state.slots[t.slot]))){state.message='Capture au moins un snapshot utilisé avant de lancer la grille.';state.error=true;publish();return false;}
      const link=healthyLink();linkMode=Boolean(link);state.clock=linkMode?'Ableton Link':'Interne';
      state.running=true;state.armed=linkMode;state.activeColumn=-1;state.error=false;stepCount=0;
      span=stepBeats();periodMs=span*60000/state.bpm;
      baseTime=performance.now();
      if(linkMode){baseBeat=(Math.floor(link.beat/4)+1)*4;state.message=fromLive?'Live ▶ · départ au prochain premier temps…':'Link · départ à la prochaine mesure…';schedule();}
      else{baseBeat=0;state.message='Horloge interne · '+state.bpm+' BPM';fireStep();}
      publish();return true;
    }
    function edit(fn,live=false){
      if(disposed||(!live&&state.running))return false;
      fn();save();state.error=false;
      state.message=state.running
        ? 'Pattern modifié en direct · prochain passage du pas concerné.'
        : 'Grille enregistrée dans ce navigateur.';
      publish();return true;
    }
    const api={state,start,stop,
      subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
      setLoop(value){return edit(()=>{state.loop=Boolean(value);});},
      setFollowStop(value){return edit(()=>{state.followStop=Boolean(value);},true);},
      setFollowPlay(value){return edit(()=>{state.followPlay=Boolean(value);},true);},
      setBpm(value){if(!Number.isInteger(value)||value<40||value>240)return false;return edit(()=>{state.bpm=value;});},
      setDivision(value){if(!Object.hasOwn(SUBDIVISIONS,value))return false;return edit(()=>{state.division=value;state.structureVersion++;});},
      setColumns(value){if(!LENGTHS.includes(value))return false;return edit(()=>{
        state.cells=[...state.cells.slice(0,value),...empty(Math.max(0,value-state.cells.length))];state.columns=value;state.structureVersion++;state.cellVersion++;
      });},
      setCell(row,column,action){
        if(!Number.isInteger(row)||row<0||row>=SNAPSHOTS||!Number.isInteger(column)||column<0||column>=state.columns||!['recall','morph'].includes(action))return false;
        if(state.cells[column]?.slot!==row && !model.state.slots[row]){
          state.message='Capture d’abord le snapshot '+(row+1)+' pour activer cette ligne.';
          state.error=true;publish();return false;
        }
        return edit(()=>{const current=state.cells[column];state.cells[column]=current?.slot===row?null:{slot:row,action};state.cellVersion++;},true);
      },
      swapAction(row,column){
        if(!Number.isInteger(column)||column<0||column>=state.columns || state.cells[column]?.slot!==row)return false;
        return edit(()=>{state.cells[column]={slot:row,action:state.cells[column].action==='recall'?'morph':'recall'};state.cellVersion++;},true);
      },
      clear(){return edit(()=>{state.cells=empty(state.columns);state.cellVersion++;});},
      view(){
        let position=0;
        if(state.running){
          if(linkMode){const sample=healthyLink();if(sample)position=(sample.beat-baseBeat)/span;}
          else position=(performance.now()-baseTime)/periodMs;
        }
        const armed=state.armed || position<0;
        return {running:state.running,armed,column:armed?-1:Math.max(0,Math.min(state.columns-.0001,position<0?0:(state.loop?position%state.columns:position))),clock:state.clock};
      },
      switchBank(next){if(disposed)return;reset('Séquence prête.',false,true);bank=next;initial=read(bank);
        Object.assign(state,{columns:initial.columns,division:initial.division,cells:initial.cells,loop:initial.loop,followStop:initial.followStop,followPlay:initial.followPlay,bpm:initial.bpm,
          message:initial.converted?'Ancienne séquence convertie : vérifie le placement.':'Séquence prête.',structureVersion:state.structureVersion+1,cellVersion:state.cellVersion+1});publish();},
      dispose(){if(disposed)return;stop();disposed=true;unsubscribe?.();listeners.clear();}
    };
    // Observe Link even while our grid is stopped. Only real transport
    // edges (not the first sample after connecting) can auto-start/stop.
    const unsubscribe=clock?.subscribe(()=>{
      const sample=healthyLink();
      if(!sample || sample.startStopSync!==true || !(sample.peers>0) || typeof sample.playing!=='boolean') {
        lastTransport=null;lastTransportEvent=null;
        if(state.running && linkMode) schedule();
        return;
      }
      const playing=sample.playing;
      const was=lastTransport;
      const eventNumber=Number.isSafeInteger(sample.transportEvent)?sample.transportEvent:null;
      const eventEdge=eventNumber!==null && lastTransportEvent!==null && eventNumber>lastTransportEvent;
      lastTransport=playing;
      lastTransportEvent=eventNumber;
      // Support the native Link start/stop callback as well as polling.
      // Ignore the initial state on first connection (not a user Play command).
      if(((was===false && playing===true)||(eventEdge && playing===true)) && state.followPlay && !state.running){
        start(true); // clock is read-only; Live transport is never changed here.
      } else if(((was===true && playing===false)||(eventEdge && playing===false)) && state.followStop && state.running && linkMode){
        reset('Arrêt demandé par Ableton Link.',false,true);
        return;
      }
      if(state.running && linkMode)schedule();
    });
    return api;
  }
  function element(doc,tag,content=null,attrs={}){const node=doc.createElement(tag);if(content!==null)node.textContent=content;for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);return node;}
  function mount({model,doc}){
    const seq=model.sequencer;if(!seq)return null;
    const section=element(doc,'section',null,{class:'pilami-seq','aria-label':'Séquenceur visuel par grille'});
    const details=element(doc,'details'),summary=element(doc,'summary'),heading=element(doc,'strong','▦ Séquenceur visuel'),info=element(doc,'span','',{class:'pilami-seq-summary'});
    summary.append(heading,info);details.append(summary);
    const content=element(doc,'div',null,{class:'pilami-seq-content'}),toolbar=element(doc,'div',null,{class:'pilami-seq-tools'});
    const play=element(doc,'button','▶ Lancer',{type:'button','data-seq-play':''});
    const loop=element(doc,'input',null,{type:'checkbox'}),loopLabel=element(doc,'label',' Boucle');loopLabel.prepend(loop);
    const followPlay=element(doc,'input',null,{type:'checkbox','aria-label':'Démarrer le séquenceur quand Ableton Live démarre'}),followPlayLabel=element(doc,'label',' Play avec Live');followPlayLabel.title='Lance le séquenceur sur le prochain premier temps après un Play dans Live. Nécessite Start/Stop Sync dans Live.';followPlayLabel.prepend(followPlay);
    const followStop=element(doc,'input',null,{type:'checkbox','aria-label':'Arrêter le séquenceur quand Ableton Live est arrêté'}),followStopLabel=element(doc,'label',' Stop avec Live');followStopLabel.title='Nécessite Start/Stop Sync activé dans Live et le bridge Link à jour.';followStopLabel.prepend(followStop);
    const length=element(doc,'select',null,{'aria-label':'Longueur du pattern'});
    for(const n of LENGTHS)length.append(element(doc,'option',n+' pas',{value:String(n)}));
    const lengthLabel=element(doc,'label','Longueur ');lengthLabel.append(length);
    const division=element(doc,'select',null,{'aria-label':'Durée de chaque pas'});
    for(const d of Object.keys(SUBDIVISIONS))division.append(element(doc,'option',d,{value:d}));
    const divisionLabel=element(doc,'label','Pas ');divisionLabel.append(division);
    const bpm=element(doc,'input',null,{type:'number',min:'40',max:'240',step:'1',class:'pilami-seq-bpm','aria-label':'BPM interne'}),bpmLabel=element(doc,'label','BPM interne ');bpmLabel.append(bpm);
    const link=element(doc,'span','',{class:'pilami-seq-clock'});
    const transportIndicator=element(doc,'span','',{class:'pilami-seq-transport','data-state':'error',title:'État du transport reçu du bridge Link local'});
    const linkHelpToggle=element(doc,'button','ⓘ Aide Link',{type:'button',class:'pilami-seq-link-help-toggle','aria-expanded':'false',title:'Que faire si le BPM suit mais pas Play/Stop ?'});
    const linkHelp=element(doc,'p','Si le BPM suit Ableton mais pas Play/Stop : dans les paramètres Link d’Ableton Live, active « Synchro de démarrage arrêt » (Start/Stop Sync), en plus du bouton Link. Vérifie aussi « Play avec Live » et « Stop avec Live » ci-dessus. Cette option n’est pas automatiquement activée dans Live.',{class:'pilami-seq-link-help',role:'note'});
    linkHelp.hidden=true;
    linkHelpToggle.addEventListener('click',()=>{linkHelp.hidden=!linkHelp.hidden;linkHelpToggle.setAttribute('aria-expanded',String(!linkHelp.hidden));});
    toolbar.append(play,loopLabel,followPlayLabel,followStopLabel,lengthLabel,divisionLabel,bpmLabel,link,transportIndicator,linkHelpToggle);
    const paintBar=element(doc,'div',null,{class:'pilami-seq-paintbar'}),paintLabel=element(doc,'span','Dessiner : '),mode=element(doc,'select',null,{'aria-label':'Type de déclenchement'});
    mode.append(element(doc,'option','Rappel',{value:'recall'}),element(doc,'option','Morphing',{value:'morph'}));
    const clear=element(doc,'button','Effacer la grille',{type:'button','data-seq-clear':''});
    paintBar.append(paintLabel,mode,element(doc,'span','■ Rappel',{class:'pilami-seq-legend pilami-seq-legend-recall'}),element(doc,'span','◇ Morphing',{class:'pilami-seq-legend pilami-seq-legend-morph'}),clear);
    const scroller=element(doc,'div',null,{class:'pilami-seq-scroll',role:'region','aria-label':'Grille de déclenchement des snapshots',tabindex:'0'}),matrix=element(doc,'div',null,{class:'pilami-seq-matrix'});
    scroller.append(matrix);
    const foot=element(doc,'div',null,{class:'pilami-seq-footer'}),status=element(doc,'span','',{class:'pilami-control-help',role:'status'}),help=element(doc,'p','Édition en direct : clique pour poser, déplacer ou retirer un trigger, même pendant la lecture. Clic droit sur une case active : Rappel ↔ Morphing. Une seule action par colonne. Les changements s’appliquent au prochain passage du pas. Les lignes sans snapshot capturé sont désactivées ; les anciens déclenchements manquants sont ignorés. Pour Play/Stop avec Live, active Start/Stop Sync dans les paramètres Link d’Ableton.',{class:'pilami-control-help pilami-seq-help'});
    foot.append(status);content.append(toolbar,linkHelp,paintBar,scroller,foot,help);details.append(content);section.append(details);
    let cells=[],labels=[],playhead=null,lastStructure=-1,lastCells=-1,lastSlotSignature='',painting=null,previousHighlight=-1;
    const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
    function rebuild(){
      const s=seq.state;matrix.replaceChildren();matrix.style.setProperty('--cols',String(s.columns));cells=[];labels=[];previousHighlight=-1;lastCells=-1;lastSlotSignature='';
      const top=element(doc,'div',null,{class:'pilami-seq-row pilami-seq-ruler'}),corner=element(doc,'span','Snapshots',{class:'pilami-seq-row-label'});top.append(corner);
      const beatsPerStep=SUBDIVISIONS[s.division];
      for(let c=0;c<s.columns;c++){
        const barStart=(c*beatsPerStep)%4<.00001,caption=String(c+1);
        const tick=element(doc,'span',caption,{class:'pilami-seq-ruler-cell'+(barStart?' is-bar-start':'')});top.append(tick);
      }
      matrix.append(top);
      for(let row=0;row<SNAPSHOTS;row++){
        const lane=element(doc,'div',null,{class:'pilami-seq-row pilami-seq-lane'});
        lane.style.setProperty('--seq-lane',PALETTE[row]);
        const label=element(doc,'span','Snapshot '+(row+1),{class:'pilami-seq-row-label'});labels.push(label);lane.append(label);
        const rowCells=[];
        for(let col=0;col<s.columns;col++){
          const isBarStart=((col*beatsPerStep)%4)<.00001;
          const button=element(doc,'button','',{type:'button',class:'pilami-seq-cell'+(isBarStart?' is-bar-start':''),'data-col':String(col),'data-row':String(row)});
          // The PNG sits in its own layer: theme-wide button:hover backgrounds
          // can no longer erase a recall/morph state on mouseover.
          button.append(element(doc,'span',null,{class:'pilami-seq-cell-skin','aria-hidden':'true'}));
          // Space activates a focused <button> by browser default. Here Space must
          // never edit a pattern accidentally after a mouse click. Enter still works.
          for(const kind of ['keydown','keyup'])button.addEventListener(kind,event=>{
            if(event.code==='Space'||event.key===' '||event.key==='Spacebar'){event.preventDefault();event.stopPropagation();}
          });
          button.addEventListener('click',()=>seq.setCell(row,col,mode.value));
          button.addEventListener('contextmenu',event=>{event.preventDefault();seq.swapAction(row,col);});
          lane.append(button);rowCells.push(button);
        }
        matrix.append(lane);cells.push(rowCells);
      }
      playhead=element(doc,'div',null,{class:'pilami-seq-playhead','aria-hidden':'true'});playhead.hidden=true;matrix.append(playhead);
      text(info,s.columns+' pas · '+s.division+(s.running?' · lecture':' · arrêt'));
    }
    function updateCells(){
      const s=seq.state;
      for(let col=0;col<s.columns;col++){
        const event=s.cells[col];
        for(let row=0;row<SNAPSHOTS;row++){
          const button=cells[row]?.[col];if(!button)continue;
          const selected=event?.slot===row;
          const available=Boolean(model.state.slots[row]);
          button.classList.toggle('is-unavailable',!available);
          button.classList.toggle('is-on',selected);
          if(selected)button.dataset.action=event.action;else delete button.dataset.action;
          button.setAttribute('aria-pressed',String(selected));
          button.setAttribute('aria-label','Pas '+(col+1)+' · Snapshot '+(row+1)+(selected?' · '+(event.action==='morph'?'Morphing':'Rappel'):available?' · vide':' · non capturé, indisponible'));
          // An old pattern may reference a deleted snapshot: leave its occupied
          // cell clickable so the user can remove it, but forbid new placements.
          button.disabled=!available&&!selected;
          button.title=!available?(selected?'Snapshot '+(row+1)+' non capturé · clic pour retirer cette ancienne case':'Snapshot '+(row+1)+' non capturé · capture-le avant de dessiner sur cette ligne'):
            'Pas '+(col+1)+' : '+(selected?(event.action==='morph'?'Morphing':'Rappel')+' · clic pour retirer / clic droit pour changer':'cliquer pour déclencher Snapshot '+(row+1));
        }
      }
      for(let row=0;row<SNAPSHOTS;row++){
        const available=Boolean(model.state.slots[row]);labels[row].classList.toggle('is-empty',!available);
        labels[row].title=available?'Snapshot '+(row+1)+' capturé':'Snapshot '+(row+1)+' non capturé';
      }
    }
    function paint(){
      const view=seq.view(),s=seq.state;
      if(!playhead)return;
      const current=view.running&&!view.armed?Math.min(s.columns-1,Math.max(0,Math.floor(view.column))):-1;
      if(current!==previousHighlight){
        if(previousHighlight>=0)for(const row of cells)row[previousHighlight]?.classList.remove('is-current');
        if(current>=0)for(const row of cells)row[current]?.classList.add('is-current');
        previousHighlight=current;
      }
      playhead.hidden=current<0;
      if(current>=0){
        const pos=view.column*28; // --seq-cell = 24px, --seq-gap = 4px.
        const transform='translateX('+pos.toFixed(2)+'px)';
        if(playhead.style.transform!==transform)playhead.style.transform=transform;
      }
    }
    function refresh(){
      const s=seq.state;
      if(lastStructure!==s.structureVersion){lastStructure=s.structureVersion;rebuild();}
      text(info,s.columns+' pas · '+s.division+(s.running?' · '+(s.armed?'attente Link':'lecture'):' · arrêt'));
      text(play,s.running?'■ Arrêter':'▶ Lancer');
      loop.checked=s.loop;followPlay.checked=s.followPlay;followStop.checked=s.followStop;
      for(const [control,value]of [[length,String(s.columns)],[division,s.division],[bpm,String(s.bpm)]]){
        if(doc.activeElement!==control && control.value!==value)control.value=value;
        control.disabled=s.running;
      }
      loop.disabled=s.running;clear.disabled=s.running;mode.disabled=false;
      const transport=window.PilamiAbletonLink?.sample?.();
      text(link,s.running?s.clock:(window.PilamiAbletonLink?.connected()?'Link disponible':'Horloge interne'));
      let indicator='LINK absent',indicatorState='error';
      if(transport){
        if(!(transport.peers>0))indicator='LINK · 0 pair';
        else if(transport.startStopSync!==true)indicator='LINK · transport désactivé';
        else if(typeof transport.playing!=='boolean')indicator='LINK · transport inconnu';
        else {indicator='LIVE '+(transport.playing?'▶ PLAY':'■ STOP');indicatorState=transport.playing?'play':'stop';}
      }
      text(transportIndicator,indicator);transportIndicator.dataset.state=indicatorState;
      const transportHelp=transport?.playing===null||transport?.playing===undefined
        ? 'Transport non disponible. Vérifie le bridge et « Synchro de démarrage arrêt » dans les paramètres Link de Live.'
        : transport.peers>0?'Si Live joue mais que ce témoin reste sur STOP, active « Synchro de démarrage arrêt » dans les paramètres Link de Live.': 'Aucun autre participant Link : vérifie que Link est actif dans Live.';
      transportIndicator.title=transportHelp;followStopLabel.title=transportHelp;followPlayLabel.title=transportHelp;
      text(status,s.message);status.classList.toggle('is-error',s.error);
      const slots=s.cells.length+':'+model.state.slots.map(Boolean).join('');
      if(lastCells!==s.cellVersion||lastSlotSignature!==slots){lastCells=s.cellVersion;lastSlotSignature=slots;updateCells();}
      paint();
    }
    function animate(){
      if(!details.open||!seq.state.running||doc.defaultView.closed){painting=null;return;}
      paint();painting=doc.defaultView.requestAnimationFrame(animate);
    }
    function animation(){
      if(details.open&&seq.state.running&&painting===null)painting=doc.defaultView.requestAnimationFrame(animate);
      else if((!details.open||!seq.state.running)&&painting!==null){doc.defaultView.cancelAnimationFrame(painting);painting=null;}
    }
    const onUpdate=()=>{refresh();animation();};
    play.addEventListener('click',()=>seq.state.running?seq.stop():seq.start());
    loop.addEventListener('change',()=>seq.setLoop(loop.checked));
    followStop.addEventListener('change',()=>seq.setFollowStop(followStop.checked));
    followPlay.addEventListener('change',()=>seq.setFollowPlay(followPlay.checked));
    bpm.addEventListener('change',()=>{if(!seq.setBpm(Number(bpm.value)))bpm.value=String(seq.state.bpm);});
    division.addEventListener('change',()=>seq.setDivision(division.value));
    length.addEventListener('change',()=>{
      const target=Number(length.value),s=seq.state;
      if(target<s.columns && s.cells.slice(target).some(Boolean) && !doc.defaultView.confirm('Les déclenchements des colonnes '+(target+1)+' à '+s.columns+' seront supprimés. Continuer ?')){
        length.value=String(s.columns);return;
      }
      seq.setColumns(target);
    });
    clear.addEventListener('click',()=>{if(seq.state.cells.some(Boolean)&&!doc.defaultView.confirm('Effacer tous les déclenchements de cette grille ?'))return;seq.clear();});
    const unsubscribe=seq.subscribe(onUpdate),unLink=window.PilamiAbletonLink?.subscribe(refresh);
    details.addEventListener('toggle',animation);refresh();
    const instance={seq,doc,details};views.add(instance);
    return {node:section,refresh,dispose(){views.delete(instance);unsubscribe();unLink?.();details.removeEventListener('toggle',animation);if(painting!==null)doc.defaultView.cancelAnimationFrame(painting);}};
  }
  function togglePanel(seq,preferredDoc=document){
    const list=[...views].filter(view=>view.seq===seq && view.details.isConnected && !view.doc.defaultView.closed);
    const selected=list.find(v=>v.doc===preferredDoc)||list.find(v=>v.doc===document)||list[0];
    if(!selected)return false;
    if(selected.details.open){selected.details.open=false;return true;}
    let ancestor=selected.details.parentElement;
    while(ancestor){if(ancestor.tagName==='DETAILS')ancestor.open=true;ancestor=ancestor.parentElement;}
    selected.details.open=true;
    selected.details.scrollIntoView?.({behavior:'smooth',block:'nearest'});
    return true;
  }
  window.PilamiHydraSequencer={create,mount,togglePanel};
})();
