// Pilami public Hydra player. AGPL-3.0-or-later. Source included in each export.
(function(){
 'use strict';
 const pack=JSON.parse(document.querySelector('[data-public-pack]').textContent),root=document.querySelector('[data-pilami-strudel]'),status=document.querySelector('[data-public-status]');
 const pauseButton=document.querySelector('[data-public-pause]'),soundButton=document.querySelector('[data-public-sound]');
 let hydra,running=false,frame=null,last=null,ready=false,soundAllowed=false,wasRunning=false;
 const frozenAudio={fft:Array(48).fill(0),vol:0,setBins(n){this.fft=Array(Math.max(48,n)).fill(0);return this;},setSmooth(){return this;},setCutoff(){return this;},setScale(){return this;},show(){},hide(){}};
 const fail=error=>{pause();status.hidden=false;status.textContent='Ce visuel ne peut pas démarrer : '+(error?.message||String(error));window.dispatchEvent(new CustomEvent('pilami-hydra-error',{detail:error}));};
 function pause(){running=false;if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;pauseButton.textContent='▶';pauseButton.title='Reprendre';pauseButton.setAttribute('aria-label','Reprendre');window.__pilamiGlassBowl?.audio?.silence();}
 function resume(){if(!hydra||running||!ready)return;running=true;last=null;pauseButton.textContent='Ⅱ';pauseButton.title='Pause';pauseButton.setAttribute('aria-label','Pause');frame=requestAnimationFrame(draw);}
 function draw(now){if(!running)return;try{hydra.tick(last===null?0:Math.min(100,now-last));last=now;frame=requestAnimationFrame(draw);}catch(error){fail(error);}}
 window.PilamiStrudelHydra={isRunning:()=>running,pause,resume,cancel:pause,audio:()=>({fft:frozenAudio.fft}),clear:()=>hydra?.hush()};
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
  hydra=new Hydra({...config,canvas:target,detectAudio:false,audioConnect:false,enableStreamCapture:false,makeGlobal:true,autoLoop:false,width:chosenResolution.width,height:chosenResolution.height});
  window.a=frozenAudio;
  for(const input of hydra.s){const original=input.initImage.bind(input);input.initImage=url=>{if(!inputImages[url])throw Error('Image absente de la page autonome.');return original(inputImages[url]);};input.initCam=input.initScreen=()=>{throw Error('Les captures caméra/écran ne sont pas incluses dans cette page.');};}
  return hydra;
 }
 const local={initHydra,setResolution:resolution,a:frozenAudio,imageSource,
  __pilamiPublicControl:(index,initial)=>()=>{const saved=pack.controls[index];if(saved?.label==='Son_Collisions'&&!soundAllowed)return 0;return saved?.value??(Number(initial)||0);},
  H:input=>typeof input==='function'?input:()=>Number(input)||0,audioMod:input=>input,xyPad:()=>{},
  setFunction:definition=>{if(!hydra)throw Error('Initialise Hydra avant setFunction.');return hydra.synth.setFunction(definition);},
  loadHydraExtension:async name=>{if(!hydra)await initHydra();return PilamiHydraExtensions.load(name,local.setFunction);},
  loadScript:async url=>{const name=PilamiHydraExtensions.identify(url);if(!name)throw Error('Bibliothèque absente de cette page autonome.');return local.loadHydraExtension(name);},
  clearHydra:()=>hydra?.hush(),hush:()=>hydra?.hush()
 };
 const scope=new Proxy(local,{has:(target,key)=>key!==Symbol.unscopables&&(key in target||key in window),get:(target,key)=>key===Symbol.unscopables?undefined:key in target?target[key]:window[key],set:(target,key,value)=>{if(hydra&&['speed','bpm','fps','update'].includes(key)){window[key]=value;hydra.synth[key]=value;}else target[key]=value;return true;}});
 const menuButton=document.querySelector('[data-public-menu-button]'),menuPanel=document.querySelector('[data-public-menu]');
 function menuOpen(open,focus=false){menuPanel.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');menuButton.title=open?'Fermer le menu':'Ouvrir le menu';if(!open)controlsOpen(false);if(focus)menuButton.focus();}
 menuButton.onclick=()=>menuOpen(menuPanel.hidden);
 document.addEventListener('pointerdown',event=>{if(!menuPanel.hidden&&!event.target.closest('[data-public-navigation],dialog'))menuOpen(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]')&&!menuPanel.hidden){event.preventDefault();menuOpen(false,true);}});
 const controlsButton=document.querySelector('[data-public-controls-button]'),controlsPanel=document.querySelector('[data-public-controls]'),controlRows=[];
 function controlsOpen(open){controlsPanel.hidden=!open;controlsButton.setAttribute('aria-expanded',String(open));document.body.classList.toggle('public-controls-open',open);}
 for(const [index,saved]of pack.controls.entries()){
  if(!saved?.interactive)continue;
  const config=saved.interactive,initial=saved.value,row=document.createElement('div'),label=document.createElement('label');row.dataset.publicControl=String(index);row.className='public-control';label.textContent=saved.label.replace(/_/g,' ');row.append(label);
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
  row.addEventListener('contextmenu',event=>{event.preventDefault();set(initial,true);});controlRows.push({reset:()=>set(initial,true)});refresh();controlsPanel.querySelector('[data-public-control-list]').append(row);
 }
 controlsButton.hidden=!controlRows.length;controlsButton.onclick=()=>controlsOpen(controlsPanel.hidden);document.querySelector('[data-public-controls-reset]').onclick=()=>controlRows.forEach(row=>row.reset());
 controlsPanel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();controlsOpen(false);controlsButton.focus();}});
 pauseButton.onclick=()=>running?pause():resume();
 soundButton.hidden=!pack.controls.some(c=>c?.label==='Son_Collisions'&&(c.value>0||c.interactive));
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
