// Pilami public Hydra player. AGPL-3.0-or-later. Source included in each export.
(function(){
 'use strict';
 const pack=JSON.parse(document.querySelector('[data-public-pack]').textContent),root=document.querySelector('[data-pilami-strudel]'),status=document.querySelector('[data-public-status]');
 const pauseButton=document.querySelector('[data-public-pause]'),soundButton=document.querySelector('[data-public-sound]');
 let hydra,running=false,frame=null,last=null,ready=false,soundAllowed=false,wasRunning=false;
 const silentAudio={fft:Array(48).fill(0),vol:0,setBins(n){this.fft=Array(Math.max(48,n)).fill(0);return this;},setSmooth(){return this;},setCutoff(){return this;},setScale(){return this;},show(){},hide(){}};
 // Keep one facade so presets holding a reference to a see the live analyser.
 const publicAudio=new Proxy(silentAudio,{get(target,key){const audio=hydra?.synth.a||target;const value=audio[key];return typeof value==='function'?value.bind(audio):value;}});
 const fail=error=>{pause();status.hidden=false;status.textContent='Ce visuel ne peut pas démarrer : '+(error?.message||String(error));window.dispatchEvent(new CustomEvent('pilami-hydra-error',{detail:error}));};
 function pause(){running=false;if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;pauseButton.textContent='▶';pauseButton.title='Reprendre';pauseButton.setAttribute('aria-label','Reprendre');window.__pilamiGlassBowl?.audio?.silence();}
 function resume(){if(!hydra||running||!ready)return;running=true;last=null;pauseButton.textContent='Ⅱ';pauseButton.title='Pause';pauseButton.setAttribute('aria-label','Pause');frame=requestAnimationFrame(draw);}
 function draw(now){if(!running)return;try{hydra.tick(last===null?0:Math.min(100,now-last));if(audioStream)audioMeter.value=Math.min(1,Math.max(0,...publicAudio.fft));last=now;frame=requestAnimationFrame(draw);}catch(error){fail(error);}}
 window.PilamiStrudelHydra={isRunning:()=>running,pause,resume,cancel:pause,audio:()=>publicAudio,clear:()=>hydra?.hush()};
 const inputImages=Object.create(null);for(const image of pack.photos||[])inputImages[image.url]=image.data;
 async function imageSource(input,url){const mapped=inputImages[url];if(!mapped)throw Error('Image absente de cette page autonome.');const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Image illisible.'));image.src=mapped;});input.init({src:image,dynamic:false},{mag:'linear',min:'linear'});return image;}
 let chosenResolution={...pack.resolution};
 function resolution(){if(hydra)hydra.setResolution(chosenResolution.width,chosenResolution.height);}
 const resolutionSelect=document.querySelector('[data-public-resolution]');
 for(const [value,label]of [['original','Origine · '+pack.resolution.width+' × '+pack.resolution.height],['640x360','360p · 640 × 360'],['800x450','450p · 800 × 450'],['1280x720','HD · 1280 × 720'],['1920x1080','Full HD · 1920 × 1080']]){const option=document.createElement('option');option.value=value;option.textContent=label;resolutionSelect.append(option);}
 resolutionSelect.onchange=()=>{chosenResolution=resolutionSelect.value==='original'?{...pack.resolution}:(()=>{const [width,height]=resolutionSelect.value.split('x').map(Number);return{width,height};})();resolution();if(ready&&!running)hydra.tick(0);};
 async function initHydra(options={}){
  if(hydra)return hydra;
  const {detectAudio,feedStrudel,canvas,pixelRatio,makeGlobal,autoLoop,src,...config}=options;
  const target=document.createElement('canvas');target.id='hydra-canvas';target.setAttribute('aria-label',pack.name||'Visuel Pilami');root.append(target);
  hydra=new Hydra({...config,canvas:target,detectAudio:true,audioConnect:false,enableStreamCapture:false,makeGlobal:true,autoLoop:false,width:chosenResolution.width,height:chosenResolution.height});
  window.a=hydra.synth.a;
  // Public pages keep the audio analyser overlay out of the visual.
  hydra.synth.a.show=hydra.synth.a.hide=()=>{hydra.synth.a.isDrawing=false;hydra.synth.a.canvas.hidden=true;hydra.synth.a.canvas.style.display='none';};hydra.synth.a.hide();
  for(const input of hydra.s){const original=input.initImage.bind(input);input.initImage=url=>{if(!inputImages[url])throw Error('Image absente de la page autonome.');return original(inputImages[url]);};input.initCam=input.initScreen=()=>{throw Error('Les captures caméra/écran ne sont pas incluses dans cette page.');};}
  return hydra;
 }
 const local={initHydra,setResolution:resolution,a:publicAudio,imageSource,
  __pilamiPublicControl:(index,initial)=>{const saved=pack.controls[index],read=()=>{if(saved?.label==='Son_Collisions'&&!soundAllowed)return 0;return saved?.value??(Number(initial)||0);};read.publicBounds=saved?.bounds||saved?.available||saved?.interactive;return read;},
  H:input=>typeof input==='function'?input:()=>Number(input)||0,audioMod:(input,options={})=>()=>{let value=(typeof input==='function'?Number(input()):Number(input))+(Math.max(0,Math.min(1,Number(publicAudio.fft[options.band])||0))*(Number(options.depth)||0));const bounds=input?.publicBounds;if(bounds){value=Math.max(bounds.min,Math.min(bounds.max,value));if(bounds.kind==='toggle')value=value>=(bounds.min+bounds.max)/2?bounds.max:bounds.min;}return value;},xyPad:()=>{},
  setFunction:definition=>{if(!hydra)throw Error('Initialise Hydra avant setFunction.');return hydra.synth.setFunction(definition);},
  loadHydraExtension:async name=>{if(!hydra)await initHydra();return PilamiHydraExtensions.load(name,local.setFunction);},
  loadScript:async url=>{const name=PilamiHydraExtensions.identify(url);if(!name)throw Error('Bibliothèque absente de cette page autonome.');return local.loadHydraExtension(name);},
  clearHydra:()=>hydra?.hush(),hush:()=>hydra?.hush()
 };
 const scope=new Proxy(local,{has:(target,key)=>key!==Symbol.unscopables&&(key in target||key in window),get:(target,key)=>key===Symbol.unscopables?undefined:key in target?target[key]:window[key],set:(target,key,value)=>{if(hydra&&['speed','bpm','fps','update'].includes(key)){window[key]=value;hydra.synth[key]=value;}else target[key]=value;return true;}});
 const audioButton=document.querySelector('[data-public-audio-toggle]'),audioSelect=document.querySelector('[data-public-audio-device]'),audioStatus=document.querySelector('[data-public-audio-status]'),audioMeter=document.querySelector('[data-public-audio-meter]');
 let audioGeneration=0,audioStream=null,audioContext=null,audioBusy=false;
 function audioReset(){const audio=hydra?.synth.a;if(!audio)return;audio.meyda?.stop();audio.meyda=null;audio.inputSource?.disconnect();audio.inputSource=null;audio.stream=null;audio.context=null;audio.vol=0;audio.fft.fill(0);audio.bins?.fill(0);audio.prevBins?.fill(0);}
 function stopInput(message='Entrée audio désactivée.'){
  audioGeneration++;audioBusy=false;audioReset();const stream=audioStream,context=audioContext;audioStream=null;audioContext=null;
  stream?.getTracks().forEach(track=>track.stop());context?.close().catch(()=>{});
  audioButton.disabled=false;audioSelect.disabled=false;audioButton.textContent='Activer l’entrée audio';audioButton.setAttribute('aria-pressed','false');audioStatus.textContent=message;audioMeter.value=0;
 }
 async function devices(){
  if(!navigator.mediaDevices?.enumerateDevices)return;
  const selected=audioSelect.value,inputs=(await navigator.mediaDevices.enumerateDevices()).filter(device=>device.kind==='audioinput');
  audioSelect.replaceChildren();const automatic=document.createElement('option');automatic.value='';automatic.textContent='Entrée par défaut du système';audioSelect.append(automatic);
  inputs.forEach((device,index)=>{if(!device.deviceId)return;const option=document.createElement('option');option.value=device.deviceId;option.textContent=device.label||'Entrée audio '+(index+1);audioSelect.append(option);});
  audioSelect.value=inputs.some(device=>device.deviceId===selected)?selected:'';
 }
 async function startInput(){
  stopInput();const ticket=audioGeneration;audioBusy=true;audioButton.disabled=true;audioSelect.disabled=true;audioStatus.textContent='Autorise l’entrée audio dans le navigateur…';
  let stream,context;
  try{
   if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('Ouvre cette page en HTTPS pour activer l’entrée audio.');
   if(!ready||!hydra?.synth.a)throw Error('Attends le démarrage du visuel.');
   const AudioContext=window.AudioContext||window.webkitAudioContext;context=new AudioContext();audioContext=context;await context.resume();
   if(ticket!==audioGeneration){await context.close().catch(()=>{});return;}
   const deviceId=audioSelect.value;
   stream=await navigator.mediaDevices.getUserMedia({video:false,audio:{...(deviceId?{deviceId:{exact:deviceId}}:{}),echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
   if(ticket!==audioGeneration){stream.getTracks().forEach(track=>track.stop());await context.close().catch(()=>{});return;}
   audioStream=stream;hydra.synth.a.connectStream(stream,context);
   stream.getAudioTracks().forEach(track=>track.addEventListener('ended',()=>{if(audioStream===stream)stopInput('Entrée déconnectée. Clique pour reconnecter.');}));
   audioButton.textContent='Désactiver l’entrée audio';audioButton.setAttribute('aria-pressed','true');audioStatus.textContent='Écoute active'+(stream.getAudioTracks()[0]?.label?' · '+stream.getAudioTracks()[0].label:'')+'.';
   try{await devices();}catch(_){} // A listing error must not disconnect a working input.
  }catch(error){
   stream?.getTracks().forEach(track=>track.stop());
   if(ticket===audioGeneration){const denied=['NotAllowedError','PermissionDeniedError'].includes(error.name);stopInput(denied?'Accès refusé. Autorise le micro pour cette page, puis réessaie.':error.name==='NotFoundError'?'Aucune entrée audio disponible.':error.name==='NotReadableError'?'Entrée occupée ou inaccessible. Vérifie les autres logiciels.':error.message||'Connexion audio impossible.');}
   else context?.close().catch(()=>{});
  }finally{if(ticket===audioGeneration){audioBusy=false;audioButton.disabled=false;audioSelect.disabled=false;}}
 }
 audioButton.onclick=()=>{if(audioStream||audioBusy)stopInput();else startInput();};
 audioSelect.onchange=()=>{if(audioStream)startInput();};
 window.addEventListener('pagehide',()=>stopInput());
 const menuButton=document.querySelector('[data-public-menu-button]'),menuPanel=document.querySelector('[data-public-menu]');
 function menuOpen(open,focus=false){menuPanel.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');menuButton.title=open?'Fermer le menu':'Ouvrir le menu';if(!open)controlsOpen(false);if(focus)menuButton.focus();wakeNavigation();}
 const navigation=document.querySelector('[data-public-navigation]');let navigationTimer=null;
 function wakeNavigation(){
  clearTimeout(navigationTimer);navigation.classList.remove('public-navigation-idle');
  navigationTimer=setTimeout(()=>{if(menuPanel.hidden&&!navigation.querySelector(':focus-visible'))navigation.classList.add('public-navigation-idle');},3000);
 }
 for(const event of ['pointermove','pointerdown','keydown','focusin','focusout'])document.addEventListener(event,wakeNavigation,{passive:true});
 wakeNavigation();
 menuButton.onclick=()=>menuOpen(menuPanel.hidden);
 document.addEventListener('pointerdown',event=>{if(!menuPanel.hidden&&!event.target.closest('[data-public-navigation],dialog'))menuOpen(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]')&&!menuPanel.hidden){event.preventDefault();menuOpen(false,true);}});
 const controlsButton=document.querySelector('[data-public-controls-button]'),controlsPanel=document.querySelector('[data-public-controls]'),controlRows=[];
 function controlsOpen(open){controlsPanel.hidden=!open;controlsButton.setAttribute('aria-expanded',String(open));document.body.classList.toggle('public-controls-open',open);}
 const initialValues=pack.controls.map(control=>control?.value);
 const candidates=pack.controls.map((control,index)=>control?.available?index:null).filter(index=>index!==null);
 const assignments=pack.controls.map((control,index)=>control?.interactive?index:null).filter(index=>index!==null);
 if(pack.reassignable&&candidates.length){while(assignments.length<2)assignments.push(null);}
 const list=controlsPanel.querySelector('[data-public-control-list]');
 function renderControls(){
 list.replaceChildren();controlRows.length=0;
 assignments.forEach((index,slot)=>{
  const saved=index===null?null:pack.controls[index];
  const row=document.createElement('div'),label=document.createElement('label');row.dataset.publicControl=String(index);row.className='public-control';
  if(pack.reassignable&&candidates.length){
   const select=document.createElement('select');select.setAttribute('aria-label','Paramètre du contrôleur '+(slot+1));select.dataset.publicParameter=String(slot);
   const none=document.createElement('option');none.value='';none.textContent='Aucun';select.append(none);
   for(const candidate of candidates){const option=document.createElement('option');option.value=String(candidate);option.textContent=pack.controls[candidate].label.replace(/_/g,' ');option.disabled=assignments.some((value,other)=>other!==slot&&value===candidate);select.append(option);}
   select.value=index===null?'':String(index);select.onchange=()=>{const next=select.value===''?null:Number(select.value);if(next!==null&&(!candidates.includes(next)||assignments.some((value,other)=>other!==slot&&value===next)))return;assignments[slot]=next;renderControls();};
   const heading=document.createElement('label');heading.textContent='Contrôleur '+(slot+1);heading.append(select);row.append(heading);
  }
  list.append(row);if(!saved)return;
  const config=saved.available||saved.interactive,initial=initialValues[index];
  label.textContent=saved.label.replace(/_/g,' ');row.append(label);
  let range,number,toggle;
  function refresh(){if(toggle){const on=saved.value>=(config.min+config.max)/2;toggle.textContent=on?'Activé':'Désactivé';toggle.setAttribute('aria-checked',String(on));}else{range.value=String(saved.value);number.value=String(saved.value);}}
  function set(value,exact=false){if(!Number.isFinite(value)){refresh();return;}value=Math.max(config.min,Math.min(config.max,value));const step=Number(config.step);if(!exact&&step>0)value=Math.max(config.min,Math.min(config.max,Number((config.min+Math.round((value-config.min)/step)*step).toPrecision(14))));saved.value=value;refresh();root.dispatchEvent(new Event('input'));}
  if(config.kind==='toggle'){
   toggle=document.createElement('button');toggle.type='button';toggle.id='public-control-'+index;toggle.setAttribute('role','switch');toggle.setAttribute('aria-label',saved.label);label.htmlFor=toggle.id;toggle.onclick=()=>set(saved.value>=(config.min+config.max)/2?config.min:config.max,true);row.append(toggle);
  }else{
   const inputs=document.createElement('div');inputs.className='public-control-inputs';range=document.createElement('input');number=document.createElement('input');range.type='range';number.type='number';range.id='public-control-'+index;label.htmlFor=range.id;
   for(const input of[range,number]){input.min=config.min;input.max=config.max;input.step=config.step;input.setAttribute('aria-label',saved.label);}
   range.dataset.publicRange=String(index);number.dataset.publicValue=String(index);range.oninput=()=>set(Number(range.value));number.onchange=()=>number.value.trim()?set(Number(number.value)):refresh();inputs.append(range,number);row.append(inputs);
   const bounds=document.createElement('small');bounds.textContent=config.min+' à '+config.max;row.append(bounds);
  }
  row.addEventListener('contextmenu',event=>{event.preventDefault();set(initial,true);});controlRows.push({reset:()=>set(initial,true)});refresh();list.append(row);
 });
 }
 renderControls();
 controlsButton.hidden=!assignments.length;controlsButton.onclick=()=>controlsOpen(controlsPanel.hidden);document.querySelector('[data-public-controls-reset]').onclick=()=>controlRows.forEach(row=>row.reset());
 controlsPanel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();controlsOpen(false);controlsButton.focus();}});
 pauseButton.onclick=()=>running?pause():resume();
 soundButton.hidden=!pack.controls.some(c=>c?.label==='Son_Collisions'&&(c.value>0||c.interactive||c.available));
 soundButton.onclick=()=>{soundAllowed=!soundAllowed;soundButton.textContent=soundAllowed?'Son activé':'Activer le son';soundButton.setAttribute('aria-pressed',String(soundAllowed));if(!soundAllowed)window.__pilamiGlassBowl?.audio?.silence();root.dispatchEvent(new Event('input'));};
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(error){status.hidden=false;status.textContent='Le plein écran est indisponible dans ce navigateur.';}}
 document.querySelector('[data-public-fullscreen]').onclick=fullscreen;
 document.addEventListener('keydown',event=>{if(event.target.closest?.('button,dialog,input,textarea,select,[data-public-controls]'))return;if(event.code==='Space'){event.preventDefault();running?pause():resume();}if(event.key.toLowerCase()==='f')fullscreen();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){wasRunning=running;pause();}else{const restore=wasRunning;wasRunning=false;if(restore)resume();}});
 window.addEventListener('pagehide',event=>{wasRunning=wasRunning||running;pause();if(!event.persisted)window.__pilamiGlassBowl?.dispose();});
 window.addEventListener('pageshow',event=>{if(event.persisted){const restore=wasRunning;wasRunning=false;if(restore)resume();}});
 document.querySelector('[data-public-sources-button]').onclick=()=>document.querySelector('[data-public-sources-dialog]').showModal();
 document.querySelector('[data-public-close-sources]').onclick=()=>document.querySelector('[data-public-sources-dialog]').close();
 document.querySelector('[data-public-download-sources]').onclick=()=>{const included=JSON.parse(document.querySelector('[data-public-sources]').textContent);included['preset.hydra.txt']=pack.original;included['public-player.js']=document.querySelector('[data-public-runtime]').textContent;const url=URL.createObjectURL(new Blob([JSON.stringify(included,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Pilami-sources-et-licences.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
 (async()=>{try{document.title=pack.name||'Pilami · Visuel';if(!pack.hasInit)await initHydra();const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;await new AsyncFunction('__scope','with (__scope) {\n'+pack.source+'\n}')(scope);resolution();ready=true;status.hidden=true;resume();window.dispatchEvent(new Event('pilami-public-ready'));}catch(error){fail(error);}})();
})();
