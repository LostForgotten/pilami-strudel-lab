// Pilami Performance — AGPL-3.0-or-later.
(function(){
  'use strict';
  const base=new URL('.',document.currentScript?.src||location.href);
  let loading=null;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const ratio=e=>clamp((e.value-e.min)/(e.max-e.min));
  const format=v=>Number(v.toPrecision(5)).toString();
  function node(doc,tag,text,attrs={}){const n=doc.createElement(tag);if(text!==null)n.textContent=text;for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;}
  function libraries(){
    if(loading)return loading;
    loading=(async()=>{
      const embedded=document.querySelector('[data-performance-vendors]');
      const sources=embedded?JSON.parse(embedded.textContent):null;
      for(const file of ['pilami-pixi-ui-8.14.3-2.3.2-particles.min.js']){
        await new Promise((resolve,reject)=>{const script=document.createElement('script');if(sources){script.textContent=sources[file];document.head.append(script);resolve();}else{script.src=new URL('vendor/'+file,base).href;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Le panneau graphique n’a pas pu charger ses composants. Ferme puis réessaie.'));};document.head.append(script);}});
      }
      if(!window.PilamiPerformancePixi?.ui?.Button)throw Error('Composants graphiques indisponibles.');
    })().catch(error=>{loading=null;throw error;});return loading;
  }
  function mount(host,root,model){
    const doc=root.ownerDocument,win=doc.defaultView;
    const launch=node(host.ownerDocument,'button','Performance ✦',{type:'button','data-performance-open':'',title:'Ouvrir le panneau de performance expérimental'});
    host.prepend(launch);let dialog=null,closeCurrent=null,disposed=false;
    launch.addEventListener('click',open);
    async function open(){
      if(disposed)return;if(dialog){win.focus();return;}
      win.focus();const d=node(doc,'dialog',null,{class:'pilami-performance','aria-label':'Performance · contrôleurs du visuel'});dialog=d;
      const header=node(doc,'header',null),titles=node(doc,'div',null);titles.append(node(doc,'small','PILAMI / LABORATOIRE'),node(doc,'h2','Performance'),node(doc,'p','Joue les paramètres du visuel en direct.'));
      const exit=node(doc,'button','Fermer',{type:'button'});header.append(titles,exit);
      const message=node(doc,'p','Préparation du panneau…',{role:'status'}),layout=node(doc,'div',null,{class:'pp-layout'}),left=node(doc,'section',null,{class:'pp-pad-section'}),right=node(doc,'section',null,{class:'pp-parameters'});
      const xSelect=node(doc,'select',null,{'aria-label':'Paramètre axe X'}),ySelect=node(doc,'select',null,{'aria-label':'Paramètre axe Y'});
      const axes=node(doc,'div',null,{class:'pp-axes'});for(const [label,select]of [['X',xSelect],['Y',ySelect]]){const wrap=node(doc,'label',label);wrap.append(select);axes.append(wrap);}
      const canvasHost=node(doc,'div',null,{class:'pp-canvas'}),coordinates=node(doc,'output','',{class:'pp-coordinates'});
      left.append(node(doc,'h3','Espace XY'),axes,canvasHost,coordinates,node(doc,'p','Glisse dans le pad. Les curseurs permettent aussi de jouer au clavier.',{class:'pp-hint'}));
      layout.append(left,right);
      const snapshots=node(doc,'section',null,{class:'pp-snapshots'}),snapshotTop=node(doc,'div',null,{class:'pp-snapshot-top'}),mode=node(doc,'select',null,{'aria-label':'Action des snapshots'});
      for(const [value,label]of [['recall','Rappeler'],['morph','Morpher'],['capture','Capturer']])mode.append(node(doc,'option',label,{value}));
      const duration=node(doc,'input',null,{type:'number',min:'.1',max:'600',step:'.1','aria-label':'Durée du morphing en secondes'});duration.value=String(model?.snapshots?.state.duration||5);
      const durationLabel=node(doc,'label','Transition (s) ');durationLabel.append(duration);
      const stop=node(doc,'button','Arrêter la transition',{type:'button'});snapshotTop.append(node(doc,'h3','Snapshots'),mode,durationLabel,stop);
      const snapHost=node(doc,'div',null,{class:'pp-snapshot-canvas'}),snapKeys=node(doc,'div',null,{class:'pp-snapshot-keys','aria-label':'Snapshots au clavier'}),progress=node(doc,'progress',null,{max:'1',value:'0','aria-label':'Progression du morphing'});
      snapshots.append(snapshotTop,snapHost,snapKeys,progress);
      d.append(header,message,layout,snapshots);doc.body.append(d);
      let app=null,snapshotApp=null,initializing=false,observer=null,closed=false,last=0,pointer=null,trail=[],cards=[],snapViews=[],restoring=false,unsubscribe=null;
      const entries=model?.entries||[],numeric=entries.filter(e=>e.kind!=='toggle');
      const options=select=>entries.forEach((e,i)=>select.append(node(doc,'option',e.label.replace(/_/g,' '),{value:String(i)})));
      options(xSelect);options(ySelect);
      const pair=model?.pads?.[0];xSelect.value=String(Math.max(0,entries.indexOf(pair?.x||numeric[0])));ySelect.value=String(Math.max(0,entries.indexOf(pair?.y||numeric[1]||numeric[0])));
      function releaseApps(){const apps=[snapshotApp,app].filter(Boolean);snapshotApp=null;app=null;for(const a of apps){a.ticker?.stop();for(const child of a.stage.removeChildren())child.destroy({children:true});}for(const a of apps)a.destroy(true,{children:false});}
      function close(){if(closed)return;closed=true;observer?.disconnect();unsubscribe?.();try{if(app&&!initializing)releaseApps();}finally{d.close();d.remove();dialog=null;closeCurrent=null;if(launch.isConnected)launch.focus();}}
      closeCurrent=close;exit.onclick=close;d.addEventListener('cancel',e=>{e.preventDefault();close();});d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
      d.showModal();exit.focus();
      const available=()=>Boolean(model?.available());
      function change(entry,value){if(available())model.setBase(entry,value);}
      function card(entry,index){
        const c=node(doc,'article',null,{class:'pp-card'}),select=node(doc,'select',null,{'aria-label':'Paramètre commande '+(index+1)});options(select);select.value=String(entries.indexOf(entry));
        const out=node(doc,'output',''),range=node(doc,'input',null,{type:'range','aria-label':'Valeur commande '+(index+1)}),meter=node(doc,'span','',{class:'pp-meter'});
        const row={entry,select,out,range,meter};select.onchange=()=>{row.entry=entries[Number(select.value)];refresh();};range.oninput=()=>change(row.entry,Number(range.value));c.append(select,out,range,meter);right.append(c);cards.push(row);
      }
      const chosen=[...numeric,...entries.filter(e=>e.kind==='toggle')];chosen.slice(0,4).forEach(card);
      // Both XY axes remain reachable by keyboard, even if they are not among the four cards.
      for(const [axis,select]of [['X',xSelect],['Y',ySelect]]){const wrap=node(doc,'label','Axe '+axis,{class:'pp-axis-range'}),input=node(doc,'input',null,{type:'range','aria-label':'Valeur axe '+axis});wrap.append(input);left.append(wrap);cards.push({get entry(){return entries[Number(select.value)];},range:input});input.oninput=()=>change(entries[Number(select.value)],Number(input.value));}
      for(const select of [xSelect,ySelect])select.onchange=()=>{trail=[];refresh();};
      const manager=model?.snapshots;
      function action(i){if(!manager||!available()||manager.state.busy)return;const existing=manager.state.slots[i];if(mode.value==='capture'){if(existing&&!win.confirm('Remplacer le snapshot '+(i+1)+' par les réglages actuels ?'))return;manager.capture(i);}else if(existing){Promise.resolve(mode.value==='morph'?manager.triggerMorphTo(i):manager.triggerRecall(i)).catch(error=>{message.textContent=error.message;});}refresh();}
      duration.onchange=()=>{if(!manager?.setDuration(Number(duration.value)))duration.value=String(manager?.state.duration||5);};stop.onclick=()=>manager?.stop();
      const keys=(manager?.state.slots||[]).map((slot,i)=>{const b=node(doc,'button',String(i+1),{type:'button'});b.onclick=()=>action(i);snapKeys.append(b);return b;});
      function refresh(){
        if(closed)return;const enabled=available();
        for(const row of cards){const e=row.entry;if(!e)continue;row.range.min=String(e.min);row.range.max=String(e.max);row.range.step=String(e.step);row.range.value=String(e.value);row.range.style.setProperty('--pp-level',ratio(e)*100+'%');row.range.disabled=!enabled;if(row.out)row.out.textContent=format(e.value);if(row.meter)row.meter.style.setProperty('--level',ratio(e)*100+'%');}
        xSelect.disabled=ySelect.disabled=!enabled||!entries.length;
        const x=entries[Number(xSelect.value)],y=entries[Number(ySelect.value)];coordinates.textContent=x&&y?'X '+format(x.value)+'  /  Y '+format(y.value):'Lance un visuel contenant des contrôleurs.';
        const s=manager?.state;keys.forEach((b,i)=>{b.disabled=!enabled||s.busy||(mode.value==='capture'?!manager.canCapture():!s.slots[i])||(mode.value==='morph'&&s.running);b.setAttribute('aria-label',(mode.value==='capture'?'Capturer':mode.value==='morph'?'Morpher vers':'Rappeler')+' le snapshot '+(i+1)+(s.slots[i]?'':' · vide'));b.setAttribute('aria-pressed',String(s.active===i));});
        snapViews.forEach((v,i)=>{v.button.enabled=!keys[i].disabled;});
        if(s){progress.value=s.running?(s.transitionTarget!==null?s.transitionProgress:s.amount||0):s.active!==null?1:0;stop.disabled=!s.running&&!s.busy;if(doc.activeElement!==duration)duration.value=String(s.duration);}
        if(!restoring)message.textContent=!enabled?'Lance ou applique un preset avec des contrôleurs pour jouer.':s?.message||'Prêt · paramètres synchronisés avec le preset.';
      }
      mode.onchange=refresh;refresh();unsubscribe=model?.subscribe(refresh);
      try{
        await libraries();if(closed)return;
        const P=window.PilamiPerformancePixi;app=new P.Application();initializing=true;await app.init({width:760,height:400,backgroundAlpha:0,antialias:true,resolution:Math.min(win.devicePixelRatio||1,2),autoDensity:true,preference:'webgl'});
        initializing=false;if(closed){releaseApps();return;}
        const graphics=new P.Graphics(),stage=app.stage;stage.addChild(graphics);app.canvas.setAttribute('aria-label','Pad XY et snapshots graphiques ; commandes équivalentes accessibles au clavier');app.canvas.setAttribute('role','img');canvasHost.append(app.canvas);
        initializing=true;snapshotApp=new P.Application();await snapshotApp.init({width:760,height:154,backgroundAlpha:0,antialias:true,resolution:Math.min(win.devicePixelRatio||1,2),autoDensity:true,autoStart:false,preference:'webgl'});
        initializing=false;if(closed){releaseApps();return;}
        snapHost.append(snapshotApp.canvas);snapshotApp.canvas.setAttribute('role','img');snapshotApp.canvas.setAttribute('aria-label','Snapshots graphiques');snapKeys.classList.add('pp-keyboard');
        keys.forEach((key,i)=>{const container=new P.Container(),g=new P.Graphics(),label=new P.Text({text:String(i+1).padStart(2,'0'),style:{fontFamily:'Arial',fontSize:19,fill:0xe6ecff}});label.anchor.set(.5);container.addChild(g,label);const button=new P.ui.Button(container);button.onPress.connect(()=>action(i));snapshotApp.stage.addChild(container);snapViews.push({container,g,label,button});});
        const hit=new P.Graphics();stage.addChild(hit);hit.eventMode='static';hit.cursor='crosshair';
        let width=760,padHeight=270,snapWidth=760;
        function size(){if(closed||!app)return;width=Math.max(240,Math.floor(canvasHost.clientWidth));padHeight=Math.max(220,Math.min(340,width*.62));app.renderer.resize(width,padHeight);snapWidth=Math.max(240,Math.floor(snapHost.clientWidth));snapshotApp.renderer.resize(snapWidth,154);hit.clear().rect(0,0,width,padHeight).fill({color:0xffffff,alpha:.001});}
        observer=new ResizeObserver(size);observer.observe(canvasHost);observer.observe(snapHost);size();
        function move(event){if(pointer!==event.pointerId||!available())return;const pos=stage.toLocal(event.global),x=entries[Number(xSelect.value)],y=entries[Number(ySelect.value)];if(!x||!y)return;const nx=clamp((pos.x-15)/(width-30)),ny=clamp(1-(pos.y-15)/(padHeight-30));if(x===y)model.setBase(x,x.min+nx*(x.max-x.min));else model.setXY({x,y},x.min+nx*(x.max-x.min),y.min+ny*(y.max-y.min));}
        hit.on('pointerdown',event=>{pointer=event.pointerId;move(event);});hit.on('globalpointermove',move);const release=()=>{pointer=null;};hit.on('pointerup',release);hit.on('pointerupoutside',release);hit.on('pointercancel',release);
        app.ticker.maxFPS=30;
        app.ticker.add(()=>{
          if(closed)return;const now=win.performance.now();if(now-last>50){refresh();last=now;}
          const g=graphics;g.clear();g.roundRect(0,0,width,padHeight,18).fill(0x101b2d).stroke({color:0x31415a,width:1});
          for(let i=1;i<8;i++){const x=15+(width-30)*i/8,y=15+(padHeight-30)*i/8;g.moveTo(x,15).lineTo(x,padHeight-15).stroke({color:0x24344b,width:1});g.moveTo(15,y).lineTo(width-15,y).stroke({color:0x24344b,width:1});}
          const ex=entries[Number(xSelect.value)],ey=entries[Number(ySelect.value)];if(ex&&ey){const x=15+ratio(ex)*(width-30),y=15+(1-ratio(ey))*(padHeight-30);trail.push({x,y});while(trail.length>(win.matchMedia('(prefers-reduced-motion: reduce)').matches?1:24))trail.shift();trail.forEach((p,i)=>g.circle(p.x,p.y,2+i/12).fill({color:0x68e8d4,alpha:(i/trail.length)*.3}));g.moveTo(x,15).lineTo(x,padHeight-15).stroke({color:0x68e8d4,alpha:.25,width:1});g.moveTo(15,y).lineTo(width-15,y).stroke({color:0x68e8d4,alpha:.25,width:1});g.circle(x,y,18).fill({color:0x68e8d4,alpha:.08});g.circle(x,y,8).fill(0x68e8d4);g.circle(x,y,3).fill(0xffffff);}
          const s=manager?.state,cols=Math.min(5,keys.length),gap=8,cell=(snapWidth-gap*(cols-1))/cols;
          snapViews.forEach((v,i)=>{const active=s?.active===i,target=s?.transitionTarget===i,filled=Boolean(s?.slots[i]);v.container.position.set((i%cols)*(cell+gap),4+Math.floor(i/cols)*74);v.button.enabled=!keys[i].disabled;v.g.clear().roundRect(0,0,cell,66,12).fill(active?0x204f4c:filled?0x26324d:0x151e30).stroke({color:target?0xf3bc73:active?0x68e8d4:0x3a4864,width:target||active?2:1});if(target)v.g.roundRect(4,58,(cell-8)*clamp(s.transitionProgress),3,1).fill(0xf3bc73);v.label.position.set(cell/2,32);v.container.alpha=keys[i].disabled?.45:1;});snapshotApp.render();
        });
        restoring=false;refresh();
      }catch(error){observer?.disconnect();try{releaseApps();}catch(_){}snapKeys.classList.remove('pp-keyboard');restoring=true;message.textContent='Le pad graphique est indisponible : '+error.message+' Les curseurs et snapshots ci-dessous restent utilisables.';}
    }
    return{dispose(){disposed=true;closeCurrent?.();launch.remove();}};
  }
  window.PilamiPerformance={mount};
})();
