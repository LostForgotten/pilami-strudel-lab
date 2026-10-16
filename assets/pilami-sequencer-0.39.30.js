/* Pilami Strudel Lab — step-grid snapshot sequencer v0.39.30 (AGPL-3.0-or-later).
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
    let linkMode=false,baseBeat=0,baseTime=0,span=.25,periodMs=125,stepCount=0,lastTransport=null,lastTransportEvent=null,missingLinkSince=null;
    const state={...initial,running:false,armed:false,activeColumn:-1,clock:'Interne',message:initial.converted?'Ancienne séquence convertie en grille : vérifie les déclenchements.':'Clique une case pour ajouter un déclenchement.',error:false,structureVersion:0,cellVersion:0};
    delete state.converted;
    const publish=()=>{for(const fn of [...listeners])try{fn();}catch(error){console.error('Pilami grid listener:',error);}};
    const save=()=>{try{localStorage.setItem(bankKey(bank),JSON.stringify({columns:state.columns,division:state.division,cells:state.cells,loop:state.loop,followStop:state.followStop,followPlay:state.followPlay,bpm:state.bpm}));}catch(_){}};
    const clearTimer=()=>{if(timer!==null)clearTimeout(timer);timer=null;timerDue=0;};
    const healthyLink=()=>{const s=clock?.sample?.();return clock?.connected() && s && Number.isFinite(s.beat) && Number.isFinite(s.bpm) && s.bpm>0?s:null;};
    function reset(message='Séquence arrêtée.',error=false,stopMorph=false){
      clearTimer();missingLinkSince=null;state.running=false;state.armed=false;state.activeColumn=-1;state.message=message;state.error=error;
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
    // The Link beat position is the source of truth, not setTimeout. Background
    // Firefox windows can throttle timers, but an incoming WebSocket sample
    // can still advance the sequencer without waiting for a timer to fire.
    function fireStep(eventStep=stepCount,displayStep=eventStep){
      if(disposed||!state.running)return;
      const col=eventStep%state.columns;
      if(eventStep>=state.columns&&!state.loop){reset('Séquence terminée.');return;}
      state.activeColumn=displayStep%state.columns;state.armed=false;
      const event=state.cells[col];
      if(event){
        if(!model.state.slots[event.slot]){state.message='Pas '+(col+1)+' · Snapshot '+(event.slot+1)+' non capturé · déclenchement ignoré.';}else{
        const beatTarget=baseBeat+eventStep*span;
        const bpm=linkMode?(healthyLink()?.bpm||state.bpm):state.bpm;
        const durationBeats=nextTriggerDistance(col)*span;
        model.stop();
        if(event.action==='morph'){
          model.morphTo(event.slot,linkMode?{startBeat:beatTarget,durationBeats,seconds:durationBeats*60/bpm}:{seconds:durationBeats*60/bpm});
        } else model.recall(event.slot);
        state.message='Pas '+(col+1)+' · Snapshot '+(event.slot+1)+' · '+(event.action==='morph'?'Morphing':'Rappel');
        }
      }
      stepCount=displayStep+1;
      schedule();
      if(event||stepCount===1||eventStep!==displayStep)publish();
    }
    function waitForLink(){
      // Keep the pattern armed during brief network reconnects and background
      // freezes. Never play from a stale clock or silently fall back to 120 BPM.
      const now=performance.now();
      if(missingLinkSince===null){
        missingLinkSince=now;
        state.message='Link momentanément indisponible · attente de reconnexion…';
        publish();
      }
      if(now-missingLinkSince>30000){reset('Connexion Ableton Link perdue · séquence arrêtée.',true,true);return;}
      if(timer===null){timer=setTimeout(()=>{timer=null;if(state.running) schedule();},700);}
    }
    function clockTime(){
      const sample=linkMode?healthyLink():null;
      if(linkMode&&!sample)return null;
      const targetBeat=baseBeat+stepCount*span;
      return linkMode ? (targetBeat-sample.beat)*60000/sample.bpm : baseTime+stepCount*periodMs-performance.now();
    }
    function syncLink(sample){
      if(disposed||!state.running||!linkMode)return;
      if(!sample){waitForLink();return;}
      missingLinkSince=null;
      // Small tolerance only for setTimeout jitter near a beat boundary.
      const toleranceBeats=sample.bpm*6/60000;
      const due=Math.floor((sample.beat-baseBeat+toleranceBeats)/span);
      if(due<stepCount){schedule();return;}
      if(!state.loop && due>=state.columns){reset('Séquence terminée.');return;}
      if(due===stepCount){fireStep();return;}
      // If Firefox throttled or suspended the tab, skip old steps rather than
      // firing a burst of old snapshots. Restore only the most recent trigger
      // since the last executed step, preserving the musical Link position.
      const earliest=Math.max(stepCount,due-state.columns+1);
      let latestEvent=-1;
      for(let n=due;n>=earliest;n--){
        const evt=state.cells[n%state.columns];
        if(evt && model.state.slots[evt.slot]){latestEvent=n;break;}
      }
      if(latestEvent>=0)fireStep(latestEvent,due);
      else {
        state.activeColumn=due%state.columns;state.armed=false;
        stepCount=due+1;
        schedule();publish();
      }
    }
    function tick(){
      timer=null;if(disposed||!state.running)return;
      if(linkMode){syncLink(healthyLink());return;}
      const remaining=clockTime();
      if(remaining>9){schedule();return;}
      if(remaining< -Math.max(220,periodMs*1.5)){
        // Internal clock also skips missed steps if another window was focused.
        const due=Math.floor((performance.now()-baseTime)/periodMs);
        if(!state.loop && due>=state.columns){reset('Séquence terminée.');return;}
        if(due>stepCount){stepCount=due;state.message='Horloge interne · reprise au pas actuel.';}
      }
      fireStep();
    }
    function schedule(){
      if(!state.running||disposed)return;
      const remaining=clockTime();
      if(remaining===null){clearTimer();waitForLink();return;}
      missingLinkSince=null;
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
      state.running=true;state.armed=linkMode;state.activeColumn=-1;state.error=false;stepCount=0;missingLinkSince=null;
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
        const current=state.cells[column],sameRow=current?.slot===row;
        // Each mouse button toggles its own type. A click of the opposite
        // button replaces the current action in one gesture, even while playing.
        // A missing snapshot may still be cleared with the button that owns it.
        const sameAction=sameRow&&current.action===action;
        if(!sameAction&&!model.state.slots[row]){
          state.message='Capture d’abord le snapshot '+(row+1)+' pour activer cette ligne.';
          state.error=true;publish();return false;
        }
        return edit(()=>{
          state.cells[column]=sameAction?null:{slot:row,action};
          state.cellVersion++;
        },true);
      },
      randomize(density){
        if(!Number.isInteger(density)||density<0||density>100)return false;
        // Never schedule nonexistent snapshots; one event maximum per column.
        const available=model.state.slots.map((slot,index)=>slot?index:-1).filter(index=>index>=0);
        if(!available.length && density>0){
          state.message='Capture au moins un snapshot avant de remplir la grille au hasard.';
          state.error=true;publish();return false;
        }
        const count=Math.round(state.columns*density/100);
        const columns=Array.from({length:state.columns},(_,index)=>index);
        for(let i=columns.length-1;i>0;i--){
          const j=Math.floor(Math.random()*(i+1));
          [columns[i],columns[j]]=[columns[j],columns[i]];
        }
        return edit(()=>{
          const cells=empty(state.columns);
          for(let i=0;i<count;i++){
            const row=available[Math.floor(Math.random()*available.length)];
            cells[columns[i]]={slot:row,action:Math.random()<.5?'recall':'morph'};
          }
          state.cells=cells;state.cellVersion++;
        },true);
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
        // Preserve last known STOP/PLAY through a short WebSocket reconnect.
        // Otherwise a Play that arrived while Firefox was suspended is lost
        // when the first returning sample is treated as an initial state.
        if(state.running && linkMode) syncLink(null);
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
      // Every fresh WebSocket clock sample can drive the sequence, even when
      // Firefox throttles timeouts in an unfocused/background tab.
      if(state.running && linkMode)syncLink(sample);
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
    const linkHelpToggle=element(doc,'button','ⓘ Aide Link',{type:'button',class:'pilami-seq-link-help-toggle','aria-expanded':'false',title:'Téléchargement du bridge et aide à la synchronisation avec Live'});
    const linkHelp=element(doc,'div',null,{class:'pilami-seq-link-help',role:'note'});
    const helpTitle=element(doc,'strong','Pilami Link Bridge · Windows 10/11 64 bits');
    const helpIntro=element(doc,'p','Le bridge est gratuit et facultatif. Il permet à ce navigateur de suivre le BPM, les temps et le transport d’Ableton Link. Aucun compte GitHub ni installation de Node.js n’est nécessaire.');
    const helpActions=element(doc,'div',null,{class:'pilami-seq-link-help-actions'});
    const download=element(doc,'a','↓ Télécharger le bridge Windows (bêta v0.1.0)',{
      href:'https://github.com/LostForgotten/pilami-link-bridge/releases/download/v0.1.0-beta.1/Pilami-Link-Windows-x64-v0.1.0-beta.1.zip',
      class:'pilami-seq-link-download',target:'_blank',rel:'noopener noreferrer',
      'aria-label':'Télécharger Pilami Link Bridge pour Windows 64 bits, version bêta 0.1.0'});
    const releases=element(doc,'a','Toutes les versions et sources sur GitHub ↗',{
      href:'https://github.com/LostForgotten/pilami-link-bridge/releases',
      class:'pilami-seq-link-releases',target:'_blank',rel:'noopener noreferrer'});
    helpActions.append(download,releases);
    const helpSteps=element(doc,'ol',null,{class:'pilami-seq-link-help-steps'});
    for(const step of [
      'Décompresse complètement le ZIP, puis lance Pilami-Link.exe. Laisse sa fenêtre ouverte.',
      'Dans Ableton Live, active Link. Pour synchroniser Play/Stop, active aussi « Synchro de démarrage arrêt » (Start/Stop Sync) : cette option est distincte et peut être désactivée par défaut.',
      'Reviens dans Pilami, clique sur « Connecter Link », puis active « Play avec Live » et « Stop avec Live » si souhaité.'
    ]) helpSteps.append(element(doc,'li',step));
    const helpTroubleshooting=element(doc,'p','Si le BPM suit mais pas Play/Stop, vérifie d’abord Start/Stop Sync dans les paramètres Link de Live. Ferme l’ancien bridge avant de lancer le nouveau : les deux utiliseraient le même port.',{class:'pilami-seq-link-help-troubleshooting'});
    const helpOther=element(doc,'p','Linux / macOS : pas encore de paquet prêt à l’emploi. L’application Pilami reste utilisable sans bridge.',{class:'pilami-seq-link-help-other'});
    linkHelp.append(helpTitle,helpIntro,helpActions,helpSteps,helpTroubleshooting,helpOther);
    linkHelp.hidden=true;
    linkHelpToggle.addEventListener('click',()=>{linkHelp.hidden=!linkHelp.hidden;linkHelpToggle.setAttribute('aria-expanded',String(!linkHelp.hidden));});
    toolbar.append(play,loopLabel,followPlayLabel,followStopLabel,lengthLabel,divisionLabel,bpmLabel,link,transportIndicator,linkHelpToggle);
    const paintBar=element(doc,'div',null,{class:'pilami-seq-paintbar'});
    const legendLeft=element(doc,'span','Clic gauche : ■ Rappel / désactiver Rappel',{class:'pilami-seq-legend pilami-seq-legend-recall'});
    const legendRight=element(doc,'span','Clic droit : ◇ Morphing / désactiver Morphing',{class:'pilami-seq-legend pilami-seq-legend-morph'});
    const actions=element(doc,'div',null,{class:'pilami-seq-pattern-actions'});
    const clear=element(doc,'button','Effacer la grille',{type:'button','data-seq-clear':''});
    const random=element(doc,'button','🎲 Random',{type:'button','data-seq-random':'',title:'Remplacer la grille par des déclenchements aléatoires parmi les snapshots capturés'});
    const densityLabel=element(doc,'label',null,{class:'pilami-seq-density',title:'Pourcentage des colonnes remplies au hasard'});
    const densityText=element(doc,'span','Densité 35 %',{class:'pilami-seq-density-text'});
    const density=element(doc,'input',null,{type:'range',min:'0',max:'100',step:'5',value:'35','aria-label':'Densité du remplissage aléatoire en pourcentage','aria-valuetext':'35 pour cent'});
    try {const raw=doc.defaultView.localStorage.getItem('pilami-seq-random-density'),saved=raw===null?NaN:Number(raw);
      if(Number.isInteger(saved)&&saved>=0&&saved<=100&&saved%5===0)density.value=String(saved);
    } catch (_) {}
    densityText.textContent='Densité '+density.value+' %';density.setAttribute('aria-valuetext',density.value+' pour cent');
    densityLabel.append(densityText,density);
    actions.append(clear,densityLabel,random);
    paintBar.append(legendLeft,legendRight,actions);
    const scroller=element(doc,'div',null,{class:'pilami-seq-scroll',role:'region','aria-label':'Grille de déclenchement des snapshots',tabindex:'0'}),matrix=element(doc,'div',null,{class:'pilami-seq-matrix'});
    scroller.append(matrix);
    const foot=element(doc,'div',null,{class:'pilami-seq-footer'}),status=element(doc,'span','',{class:'pilami-control-help',role:'status'}),help=element(doc,'p','Édition en direct : clic gauche pour activer/désactiver un Rappel ; clic droit pour activer/désactiver un Morphing. Un clic avec l’autre bouton remplace directement le type de la case, même pendant la lecture. Maj + Entrée permet aussi de poser un Morphing au clavier. Le bouton Random remplace le pattern selon la densité choisie (un seul déclenchement par colonne). Une seule action par colonne. Les changements s’appliquent au prochain passage du pas. Avec Link, les pas sont recalés sur l’horloge même après une pause du navigateur. Les lignes sans snapshot capturé sont désactivées ; les anciens déclenchements manquants sont ignorés. Pour Play/Stop avec Live, active Start/Stop Sync dans les paramètres Link d’Ableton.',{class:'pilami-control-help pilami-seq-help'});
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
          button.addEventListener('click',()=>seq.setCell(row,col,'recall'));
          button.addEventListener('contextmenu',event=>{event.preventDefault();seq.setCell(row,col,'morph');});
          // Keyboard equivalent of secondary click for accessibility.
          button.addEventListener('keydown',event=>{
            if(event.key==='Enter'&&event.shiftKey){event.preventDefault();event.stopPropagation();seq.setCell(row,col,'morph');}
          });
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
          const clickHelp=selected?(event.action==='morph'
            ?'clic gauche : Rappel · clic droit : retirer'
            :'clic gauche : retirer · clic droit : Morphing')
            :'clic gauche : Rappel · clic droit : Morphing';
          button.title=!available?(selected?'Snapshot '+(row+1)+' non capturé · '+(event.action==='morph'?'clic droit':'clic gauche')+' pour retirer cette ancienne case':'Snapshot '+(row+1)+' non capturé · capture-le avant de dessiner sur cette ligne'):
            'Pas '+(col+1)+(selected?' · '+(event.action==='morph'?'Morphing':'Rappel'):' · libre')+' · '+clickHelp;
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
      loop.disabled=s.running;clear.disabled=s.running;random.disabled=false;
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
    density.addEventListener('input',()=>{
      densityText.textContent='Densité '+density.value+' %';
      density.setAttribute('aria-valuetext',density.value+' pour cent');
      try {doc.defaultView.localStorage.setItem('pilami-seq-random-density',density.value);} catch (_) {}
    });
    random.addEventListener('click',()=>seq.randomize(Number(density.value)));
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
