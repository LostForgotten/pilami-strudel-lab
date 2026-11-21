/* PILAMI_MAX_WEB_PLAYER_VERSION:0.39.96 */
/* Pilami Max 9.2 embedded web player. AGPL-3.0-or-later. */
(function(){
 'use strict';
 const pack=JSON.parse(document.querySelector('[data-max-pack]').textContent),root=document.querySelector('[data-pilami-strudel]'),status=document.querySelector('#status');
 let hydra,failed=false,ready=false,running=false,requested=false,frame=null,last=null,gain=4,speed=1,midiEnabled=false;
 let levels=[0,0,0],size={...pack.resolution},midiSource=null;
 const send=(...args)=>window.max?.outlet(...args);
 function pause(){running=false;if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;send('flush');}
 function fail(error){failed=true;pause();requested=false;status.hidden=false;status.textContent='Erreur du visuel : '+(error?.message||String(error));console.error(error);send('error',error?.message||String(error));}
 function resume(){if(failed||!ready||!requested||running)return;running=true;last=null;frame=requestAnimationFrame(draw);}
 const audio={fft:Array(6).fill(0),vol:0,smooth:.85,cutoff:2,scale:10,
  setBins(n){n=Math.max(1,Math.min(16,Math.floor(Number(n)||6)));this.fft=Array(n).fill(0);return this;},
  setSmooth(v){this.smooth=Math.max(0,Math.min(.999,Number(v)||0));return this;},setCutoff(v){this.cutoff=Number(v);return this;},setScale(v){this.scale=Number(v);return this;},setMax(){return this;},show(){},hide(){},
  tick(dt){const alpha=1-Math.pow(this.smooth,Math.max(0,dt)/16.667);this.fft=this.fft.map((v,i)=>{const target=Math.max(0,levels[i<this.fft.length/3?0:i<this.fft.length*2/3?1:2]*gain);return v+(target-v)*alpha;});this.vol=Math.max(...this.fft);}
 };
 function draw(now){if(!running)return;try{const dt=last===null?0:Math.min(100,Math.max(0,now-last));audio.tick(dt);hydra.synth.speed=speed;window.speed=speed;hydra.tick(dt);last=now;frame=requestAnimationFrame(draw);}catch(error){fail(error);}}
 function resolution(w,h){if(Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0)size={width:Math.round(w),height:Math.round(h)};if(hydra)hydra.setResolution(size.width,size.height);}
 async function initHydra(options={}){
  if(hydra)return hydra;
  const {detectAudio,audioConnect,feedStrudel,canvas,makeGlobal,autoLoop,src,pixelRatio,...config}=options;
  const target=document.createElement('canvas');target.id='hydra-canvas';root.append(target);
  hydra=new Hydra({...config,canvas:target,detectAudio:false,enableStreamCapture:false,makeGlobal:true,autoLoop:false,width:size.width,height:size.height});
  hydra.synth.a=audio;window.a=audio;
  for(const input of hydra.s){const image=input.initImage.bind(input);input.initImage=url=>image(mappedImage(url));input.initCam=input.initScreen=input.initVideo=()=>{throw Error('Caméra, capture et vidéo non incluses dans cet export.');};}
  return hydra;
 }
 const images=new Map((pack.photos||[]).map(p=>[p.url,p.data]));
 function mappedImage(url){if(images.has(url))return images.get(url);if(/^data:image\//.test(url))return url;throw Error('Image non intégrée dans cet export : '+url);}
 async function imageSource(input,url){const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Image intégrée illisible.'));image.src=mappedImage(url);});input.init({src:image,dynamic:false});return image;}
 function control(index,initial){const saved=pack.controls[index];if(!saved)throw Error('Contrôleur absent : '+index);const read=()=>{let v=Number(saved.value);if(saved.audio)v+=(Math.max(0,Math.min(1,audio.fft[saved.audio.band]||0))*saved.audio.depth);v=Math.max(saved.min,Math.min(saved.max,v));return saved.kind==='toggle'?(v>=(saved.min+saved.max)/2?saved.max:saved.min):v;};read._pilamiIndex=index;return read;}
 const model={entries:pack.controls};root._pilamiHydraControls=model;
 const local={initHydra,setResolution:()=>resolution(),a:audio,imageSource,__pilamiMaxControl:control,H:v=>typeof v==='function'?v:()=>Number(v)||0,xyPad:()=>{},
  audioMod:(input,options={})=>{if(input?._pilamiIndex!==undefined&&pack.controls[input._pilamiIndex].audio)return input;return ()=>{let v=Number(typeof input==='function'?input():input)+(Math.max(0,Math.min(1,audio.fft[options.band]||0))*(Number(options.depth)||0));const c=pack.controls[input?._pilamiIndex];return c?Math.max(c.min,Math.min(c.max,v)):v;};},
  setFunction:def=>hydra.synth.setFunction(def),loadHydraExtension:async name=>{if(!hydra)await initHydra();return PilamiHydraExtensions.load(name,local.setFunction);},loadScript:async url=>{const name=PilamiHydraExtensions.identify(url);if(!name)throw Error('Bibliothèque non intégrée.');return local.loadHydraExtension(name);},clearHydra:()=>hydra?.hush(),hush:()=>hydra?.hush()
 };
 const scope=new Proxy(local,{has:(o,k)=>k!==Symbol.unscopables&&(k in o||k in window),get:(o,k)=>k===Symbol.unscopables?undefined:k in o?o[k]:window[k],set:(o,k,v)=>{if(hydra&&['speed','bpm','fps','update'].includes(k)){window[k]=v;hydra.synth[k]=v;}else o[k]=v;return true;}});
 const midiState={enabled:false,running:false};
 window.PilamiMidiOutput={state:midiState,source(handlers={}){midiSource?.dispose?.();midiSource=handlers;return {hit(strength){if(!midiState.enabled||!midiState.running||!Number.isFinite(strength))return false;send('hit',Math.max(0,Math.min(1,strength)));return true;},dispose(){send('flush');midiSource=null;}};},setRunning(v){midiState.running=!!v;},silence(){send('flush');}};
 window.PilamiStrudelHydra={audio:()=>audio,isRunning:()=>running,pause,resume,cancel:pause,clear:()=>hydra?.hush(),renderResolution:()=>({...size})};
 function state(run,nextGain,nextSpeed,allowMidi,low,mid,high,...values){
  requested=Number(run)>0;gain=Math.max(0,Number(nextGain)||0);speed=Number(nextSpeed)||0;midiEnabled=pack.deviceType==='midi'&&Number(allowMidi)>0;
  levels=[low,mid,high].map(v=>Math.max(0,Number(v)||0));midiState.enabled=midiEnabled;midiState.running=requested&&ready;
  let changed=false;pack.selectedControls.forEach((index,slot)=>{const c=pack.controls[index],v=Number(values[slot]);if(Number.isFinite(v)&&c.value!==v){c.value=Math.max(c.min,Math.min(c.max,v));changed=true;}});
  // Values change within the same controller model. The controllers-change event
  // denotes a model replacement and may dispose a preset's WebGL resources.
  if(changed)root.dispatchEvent(new Event('pilami-hydra-parameter-change'));
  if(!requested)pause();else resume();
 }
 window.PilamiMaxWebPlayer={state,resolution,pause,controls:pack.controls,audio,get ready(){return ready;},get running(){return running;}};
 if(window.max){window.max.bindInlet('pilami_state',state);window.max.bindInlet('pilami_resolution',resolution);}
 window.addEventListener('error',e=>fail(e.error||e.message));window.addEventListener('unhandledrejection',e=>fail(e.reason));
 window.addEventListener('pagehide',()=>{pause();midiSource?.dispose?.();});
 (async()=>{try{if(!pack.hasInit)await initHydra();const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;await new AsyncFunction('__scope','with(__scope){\n'+pack.source+'\n}')(scope);resolution();ready=true;midiState.running=requested;status.hidden=true;root.dispatchEvent(new Event('pilami-hydra-controllers-change'));send('ready');resume();}catch(error){fail(error);}})();
})();
