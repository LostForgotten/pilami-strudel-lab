// Hydra adapter for the shared Strudel engine. AGPL-3.0-or-later.
(function () {
  'use strict';
  let hydra, loading, frame, lastTime, restore = new Map(), optionsKey, root, running = false, generation = 0, frameHost;
  // Display preferences override render size without rewriting a preset's code.
  const resolutionKey='pilami-hydra-render-resolution-v1';
  const resolutions=[['preset','Selon le preset',null],['640x360','640 × 360 · léger',[640,360]],['800x450','800 × 450',[800,450]],['960x540','960 × 540',[960,540]],['1280x720','1280 × 720 · HD',[1280,720]],['1920x1080','1920 × 1080 · Full HD',[1920,1080]]];
  let resolutionChoice='preset',resolutionLock=null,displaySize=null,resizeEngine=null;
  const resolutionListeners=new Set();
  try{const saved=localStorage.getItem(resolutionKey);if(resolutions.some(r=>r[0]===saved))resolutionChoice=saved;}catch(_){}
  function resolutionState(){return{choice:resolutionChoice,width:hydra?.canvas.width||0,height:hydra?.canvas.height||0};}
  function notifyResolution(){for(const listener of resolutionListeners)listener();}
  function applyRenderSize(force=false) {
    const fixed=resolutions.find(r=>r[0]===resolutionChoice)[2],size=fixed?{width:fixed[0],height:fixed[1]}:resolutionLock||displaySize;
    if(hydra&&resizeEngine&&size&&(force||hydra.canvas.width!==size.width||hydra.canvas.height!==size.height)){
      resizeEngine(size.width,size.height);notifyResolution();
    }
  }
  function chooseResolution(choice){
    if(!resolutions.some(r=>r[0]===choice))return false;
    const previous=resolutionChoice;resolutionChoice=choice;
    try{applyRenderSize();}catch(error){resolutionChoice=previous;try{applyRenderSize();}catch(_){}notifyResolution();throw error;}
    try{localStorage.setItem(resolutionKey,choice);}catch(_){}
    notifyResolution();return true;
  }
  function fitResolution(width,height) {displaySize={width,height};applyRenderSize();}
  function resetPresetResolution() {
    resolutionLock=null;
    const instance=hydra;
    // Let the preset declare its size after await initHydra before fitting layout.
    window.PilamiStrudelVisuals.animationHost().requestAnimationFrame(()=> {
      if(hydra===instance&&!resolutionLock)applyRenderSize();
    });
  }
  function trackResolution(instance) {
    const resize=instance.setResolution.bind(instance);resizeEngine=resize;
    instance.setResolution=(width,height)=> {
      const w=Math.floor(Number(width)),h=Math.floor(Number(height));
      if(!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1)throw Error('setResolution attend une largeur et une hauteur positives.');
      if(hydra!==instance)return resize(w,h);
      const previous=resolutionLock;resolutionLock={width:w,height:h};
      try{applyRenderSize(true);}catch(error){resolutionLock=previous;throw error;}
    };
    instance.sandbox.set('setResolution',instance.setResolution);
  }
  function mountResolution(host,{compact=false}={}) {
    const doc=host.ownerDocument,win=doc.defaultView;
    if(!doc.querySelector('[data-pilami-resolution-style]')){
      const style=doc.createElement('style');style.dataset.pilamiResolutionStyle='';
      style.textContent='.pilami-resolution-control{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;min-width:0;max-width:100%;font:inherit;color:inherit}.pilami-resolution-control>.pilami-resolution-label{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:0;min-width:0;max-width:100%;font-size:13px}.pilami-resolution-control select{box-sizing:border-box;width:auto;min-width:0;max-width:100%;padding:7px 9px;border:1px solid #8997a766;border-radius:7px;font:inherit;color:var(--pilami-editor-text,var(--editor-text,CanvasText));background:var(--pilami-editor-bg,var(--editor-bg,Canvas))}.pilami-resolution-control option{color:var(--pilami-editor-text,var(--editor-text,CanvasText));background:var(--pilami-editor-bg,var(--editor-bg,Canvas))}.pilami-resolution-control>output{font-size:12px;text-align:left;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.pilami-resolution-control>small{flex-basis:100%;font-size:12px;line-height:1.5;opacity:.8}.pilami-resolution-control[data-compact]{flex:0 1 auto}';
      doc.head.append(style);
    }
    const box=doc.createElement('div');box.className='pilami-resolution-control';if(compact)box.dataset.compact='';
    const label=doc.createElement('label');label.className='pilami-resolution-label';label.append('Résolution Hydra ');
    const select=doc.createElement('select');select.dataset.hydraResolutionChoice='';select.setAttribute('aria-label','Résolution de rendu Hydra');
    for(const [value,text]of resolutions){const option=doc.createElement('option');option.value=value;option.textContent=text;select.append(option);}
    const help='Selon le preset : utilise sa résolution, sinon celle de la fenêtre. Choix mémorisé sur ce navigateur pour tous les presets.';
    select.title=help;label.append(select);const output=doc.createElement('output');output.setAttribute('aria-live','polite');output.dataset.hydraResolutionStatus='';box.append(label,output);
    if(!compact){const small=doc.createElement('small');small.textContent=help;box.append(small);}
    host.append(box);
    function refresh(){const state=resolutionState();select.value=state.choice;output.textContent=state.width?state.width+' × '+state.height+' en cours':'Au prochain lancement';}
    select.addEventListener('change',()=>{try{chooseResolution(select.value);}catch(error){refresh();output.textContent='Résolution non appliquée : '+error.message;}});
    resolutionListeners.add(refresh);refresh();let disposed=false;
    function dispose(){if(disposed)return;disposed=true;resolutionListeners.delete(refresh);win.removeEventListener('pagehide',dispose);box.remove();}
    win.addEventListener('pagehide',dispose,{once:true});return{dispose};
  }
  const api = () => window.strudel;
  let micGeneration = 0, dedicated = false;
  // One input connection belongs to the session, independent of preset renderers.
  let inputStream=null,inputContext=null,inputPending=null,inputTicket=0,inputMuted=false;
  const inputState={active:false,busy:false,error:false,message:'Désactivé'};
  function inputStatus(message,error=false,busy=false) {
    const track=inputStream?.getAudioTracks()[0];
    Object.assign(inputState,{active:!!track&&track.readyState==='live'&&inputContext?.state==='running',busy,error,message});
    window.dispatchEvent(new CustomEvent('pilami-audio-input-change'));
  }
  function refreshInput() {
    if(inputMuted){inputStatus('Désactivé');return;}
    const track=inputStream?.getAudioTracks()[0];
    inputStatus(!track||track.readyState!=='live'?'Entrée déconnectée':inputContext?.state!=='running'?'Audio suspendu':track.muted?'Entrée muette':'Connecté');
    if(hydra?.synth.a)refreshMic(hydra.synth.a);
  }
  async function acquireInput() {
    if(inputStream?.active&&inputContext?.state!=='closed') {await inputContext.resume();refreshInput();return;}
    if(inputPending)return inputPending;
    disposeAudio(hydra?.synth.a);
    inputStream?.getTracks().forEach(t=>t.stop());inputStream=null;
    if(inputContext&&inputContext.state!=='closed')inputContext.close().catch(()=>{});inputContext=null;
    const ticket=++inputTicket;inputStatus('Connexion…',false,true);
    inputPending=(async()=>{
      let stream,context;
      try {
        if(!navigator.mediaDevices?.getUserMedia)throw Error('Entrée audio indisponible dans ce navigateur.');
        context=new AudioContext();context.resume().catch(()=>{});
        stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
        if(ticket!==inputTicket) {stream.getTracks().forEach(t=>t.stop());context.close().catch(()=>{});return;}
        inputStream=stream;inputContext=context;
        context.addEventListener('statechange',refreshInput);
        stream.getAudioTracks().forEach(track=>['ended','mute','unmute'].forEach(event=>track.addEventListener(event,refreshInput)));
        refreshInput();
      } catch(error) {
        stream?.getTracks().forEach(t=>t.stop());if(context&&context.state!=='closed')context.close().catch(()=>{});
        if(ticket!==inputTicket)return;
        const messages={NotAllowedError:'Autorisation audio refusée',NotFoundError:'Aucune entrée audio',NotReadableError:'Entrée audio occupée ou inaccessible'};
        inputStatus(messages[error.name]||error.message,true);throw error;
      }
    })().finally(()=>{if(ticket===inputTicket)inputPending=null;});
    return inputPending;
  }
  function disableInputAudio() {
    inputMuted=true;inputTicket++;micGeneration++;inputPending=null;
    disposeAudio(hydra?.synth.a);
    inputStream?.getTracks().forEach(track=>track.stop());inputStream=null;
    if(inputContext&&inputContext.state!=='closed')inputContext.close().catch(()=>{});inputContext=null;
    inputStatus('Désactivé');if(root)micStatus('désactivé.',false);
  }
  function ensureAnalyzer() {
    if(!hydra)return null;
    if(!hydra.synth.a) {
      if(!restore.has('a'))restore.set('a',Object.getOwnPropertyDescriptor(window,'a'));
      hydra._initAudio({autoConnect:false});hydra.detectAudio=true;window.a=hydra.synth.a;
      const options=JSON.parse(optionsKey);options.detectAudio=true;optionsKey=JSON.stringify(options);
    }
    return hydra.synth.a;
  }
  async function enableInputAudio() {
    inputMuted=false;await acquireInput();
    if(inputMuted)return;
    const audio=ensureAnalyzer();if(audio)await connectMic(audio);
    return inputState.active;
  }
  let builtinNames = new Set(), overriddenBuiltins = new Map();
  function restoreBuiltins() {
    // Stored transforms are already processed GLSL. The pinned factory's
    // _addMethod restores them without wrapping or changing their inputs again.
    for (const [name,transform] of overriddenBuiltins) hydra?.generator._addMethod(name,transform);
    overriddenBuiltins.clear();
  }
  function mountMic(element) {
    if (!element || element.querySelector('[data-hydra-audio]')) return;
    const panel = document.createElement('div'); panel.dataset.hydraAudio = ''; panel.className = 'pilami-strudel-transport'; panel.hidden = true;
    const status = document.createElement('span'); status.dataset.hydraAudioStatus = ''; status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    const button = document.createElement('button'); button.type = 'button'; button.dataset.hydraAudioReconnect = ''; button.textContent = 'Reconnecter l’entrée audio';
    button.addEventListener('click',()=> { if (root === element && hydra?.synth.a) {inputMuted=false;connectMic(hydra.synth.a);} });
    panel.append(status,button); (element.querySelector('[data-hydra-mic-anchor]') || element.querySelector('.pilami-strudel-volume'))?.after(panel);
  }
  function micStatus(message, disabled = false) {
    mountMic(root);
    const panel = root?.querySelector('[data-hydra-audio]'); if (!panel) return;
    panel.hidden = false;
    panel.querySelector('[data-hydra-audio-status]').textContent = 'Micro Hydra : ' + message;
    panel.querySelector('button').disabled = disabled;
  }
  function disposeAudio(audio) {
    if (!audio) return;
    audio.meyda?.stop(); audio.meyda = null;
    audio.inputSource?.disconnect(); audio.inputSource = null;
    if(audio.stream!==inputStream)audio.stream?.getTracks().forEach(track=>track.stop()); audio.stream = null;
    if (audio.context && audio.context!==inputContext && audio.context.state !== 'closed') audio.context.close().catch(()=>{});
    audio.context = null; audio.vol=0;audio.fft.fill(0);audio.bins?.fill(0);audio.prevBins?.fill(0);
  }
  function refreshMic(audio) {
    if (hydra?.synth.a !== audio) return;
    const track = audio.stream?.getAudioTracks()[0];
    if (!track || track.readyState !== 'live') return micStatus('entrée déconnectée.');
    if (audio.context?.state !== 'running') return micStatus('audio suspendu — clique sur Reconnecter.');
    if (track.muted) return micStatus('entrée temporairement muette.');
    micStatus('connecté' + (track.label ? ' — ' + track.label : '') + '.');
  }
  async function connectMic(audio) {
    if(inputMuted) {disposeAudio(audio);micStatus('désactivé.',false);return;}
    const ticket=micGeneration;
    micStatus('connexion en cours…',true);
    try {
      await acquireInput();
      if(ticket!==micGeneration||inputMuted||hydra?.synth.a!==audio||!inputStream?.active)return;
      if(audio.stream!==inputStream||audio.context!==inputContext||!audio.meyda) {
        disposeAudio(audio);audio.connectStream(inputStream,inputContext);
      }
      refreshMic(audio);
    } catch(error) {if(ticket===micGeneration&&hydra?.synth.a===audio)micStatus(inputState.message+'.');}
  }
  function load() {
    if (window.Hydra) return Promise.resolve();
    if (!loading) loading = new Promise((resolve,reject)=> {
      const script = document.createElement('script');
      const timer = setTimeout(()=> { script.remove();loading=null;reject(new Error('Chargement d’Hydra trop long. Recharge la page et réessaie.')); },20000);
      script.src = new URL(root.dataset.hydra,document.baseURI).href;
      script.onload = ()=> { clearTimeout(timer);resolve(); };
      script.onerror = ()=> { clearTimeout(timer);script.remove();loading=null;reject(new Error('Impossible de charger Hydra. Recharge la page et vérifie le cache.')); };
      document.head.append(script);
    });
    return loading;
  }
  function pause() { running=false;if(frame && frameHost && !frameHost.closed)frameHost.cancelAnimationFrame(frame);frame=null;lastTime=null; }
  function resume() {
    if (!hydra || running) return;
    running=true;lastTime=null;
    const draw = now=> {
      if (!running || !hydra) return;
      try { hydra.tick(lastTime == null ? 0 : Math.min(100,now-lastTime));lastTime=now;window.PilamiStrudelVisuals.present(); }
      catch(error) { pause();window.dispatchEvent(new CustomEvent('pilami-hydra-error',{detail:error}));return; }
      frameHost=window.PilamiStrudelVisuals.animationHost();frame=frameHost.requestAnimationFrame(draw);
    };
    frameHost=window.PilamiStrudelVisuals.animationHost();frame=frameHost.requestAnimationFrame(draw);
  }
  function clearHydra() {
    generation++;
    micGeneration++;
    pause();
    if (hydra) {
      const audio = hydra.synth.a;
      disposeAudio(audio); audio?.canvas?.remove();
      try { hydra.hush();hydra.s.forEach(source=>source.clear());hydra.regl.destroy(); } catch (_) {}
      hydra.canvas.remove();hydra=null;
    }
    for (const [name,descriptor] of restore) {
      try { if (descriptor) Object.defineProperty(window,name,descriptor);else delete window[name]; } catch (_) {}
    }
    resolutionLock=null;displaySize=null;resizeEngine=null;notifyResolution();
    restore.clear();optionsKey=null;builtinNames.clear();overriddenBuiltins.clear();
    if (root?.querySelector('[data-hydra-audio]')) micStatus('désactivé.',true);
    window.PilamiStrudelVisuals.attachHydra(null,false);
  }
  async function initHydra(options = {}) {
    if (!options || typeof options!=='object' || Array.isArray(options)) throw new Error('initHydra attend un objet de réglages.');
    if (!root) root=document.querySelector('[data-pilami-strudel]');
    const startedGeneration = generation;
    await load();
    if (startedGeneration !== generation) throw new Error('Initialisation Hydra annulée.');
    const {feedStrudel=false,detectAudio:requestedAudio=false,pixelRatio=1,pixelated=true,src,canvas:customCanvas,autoLoop,makeGlobal,...config} = options;
    const detectAudio=requestedAudio||(!inputMuted&&!!inputStream?.active);
    const key=JSON.stringify({...config,feedStrudel:!!feedStrudel,detectAudio:!!detectAudio,pixelRatio,pixelated});
    if (hydra && optionsKey===key) {
      resetPresetResolution();
      const audio = hydra.synth.a;
      if (audio) {
        if (!audio.stream?.active || audio.context?.state === 'closed') connectMic(audio);
        else { audio.context.resume().catch(()=>{}); refreshMic(audio); }
      }
      resume();return hydra;
    }
    clearHydra();
    const before = new Map(Object.getOwnPropertyNames(window).map(name=>[name,Object.getOwnPropertyDescriptor(window,name)]));
    restore.set('loadScript',before.get('loadScript'));
    const canvas=document.createElement('canvas');canvas.id='hydra-canvas';canvas.setAttribute('aria-hidden','true');
    if (pixelated) canvas.style.imageRendering='pixelated';
    try {
      // Local pinned library; the controller owns placement and animation lifecycle.
      // Audio uses canvas.parentNode for its FFT meter, even when hidden.
      root.appendChild(canvas);
      hydra=new window.Hydra({...config,detectAudio:!!detectAudio,audioConnect:false,enableStreamCapture:false,canvas,makeGlobal:true,autoLoop:false,width:Math.min(innerWidth,1600),height:Math.min(innerHeight,1000)});
      builtinNames = new Set(Object.keys(hydra.generator.glslTransforms));
      for (const name of [...Object.keys(hydra.synth),'loadScript']) restore.set(name,before.get(name));
      trackResolution(hydra);
      // Keep Strudel's global hush available; Stop pauses Hydra without losing its image.
      window.hush=()=> { api().hush();pause(); };
      optionsKey=key;
      if (detectAudio) connectMic(hydra.synth.a);
      window.PilamiStrudelVisuals.attachHydra(canvas,!!feedStrudel,fitResolution);
      if (feedStrudel) hydra.synth.s0.init({src:document.getElementById('test-canvas')});
      resume();return hydra;
    } catch(error) {
      clearHydra();canvas.remove();throw new Error('Hydra ne peut pas démarrer : '+error.message);
    }
  }
  // Official H semantics, with silence represented by zero rather than an exception.
  const H = input=>()=> { const time=api().getTime();return api().reify(input).queryArc(time,time)[0]?.value ?? 0; };
  window.PilamiStrudelHydra={
    async prepare(rootElement,source) { root=rootElement;if (/\binitHydra\s*\(/.test(api().transpiler(source).output)) await load(); },
    async register() { await api().evalScope({initHydra: options => { if (dedicated) throw new Error('Pilote les visuels dans l’éditeur Hydra séparé.'); return initHydra(options); },clearHydra,H}); },
    before(rootElement,source) { if (dedicated) return;root=rootElement;pause();const code=api().transpiler(source).output;if(!/\binitHydra\s*\(/.test(code))clearHydra(); },
    isRunning: () => running,
    pause,resume,cancel() { generation++;pause(); },clear:clearHydra,
    isDedicated: () => dedicated,
    audio: () => hydra?.synth.a,
    inputState,enableInputAudio,disableInputAudio,
    mountResolution,setRenderResolution:chooseResolution,renderResolution:resolutionState,
    async enableControlAudio(band = 0, reconnect = false) {
      if (!hydra || !dedicated) throw new Error('Lance un visuel Hydra avant de relier une bande audio.');
      if (!Number.isInteger(band) || band < 0 || band > 15) throw new Error('Bande audio invalide.');
      const audio=ensureAnalyzer();
      if(reconnect)inputMuted=false;
      if(audio.fft.length<=band)audio.setBins(band+1);
      if(reconnect||!audio.stream?.active)await connectMic(audio);
      else {await audio.context?.resume();refreshMic(audio);}
      return audio;
    },
    async initStandalone(element, options = {}) { root=element;dedicated=true;const result=await initHydra(options);pause();restoreBuiltins();return result; },
    defineStandalone(definition) {
      if (!restore.has(definition.name)) restore.set(definition.name,Object.getOwnPropertyDescriptor(window,definition.name));
      if (builtinNames.has(definition.name) && !overriddenBuiltins.has(definition.name)) overriddenBuiltins.set(definition.name,hydra.generator.glslTransforms[definition.name]);
      return hydra.synth.setFunction(definition);
    },
    pauseStrudel() { if (!dedicated) pause(); },
    resumeStrudel() { if (!dedicated) resume(); },
    cancelStrudel() { if (!dedicated) {generation++;pause();} }
  };
  window.addEventListener('pilami-visual-clock',()=> { if(running){ pause();resume(); } });
  window.addEventListener('pagehide',()=> { pause();disableInputAudio(); });
})();
