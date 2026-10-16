// Hydra adapter for the shared Strudel engine. AGPL-3.0-or-later.
(function () {
  'use strict';
  let hydra, loading, frame, lastTime, restore = new Map(), optionsKey, root, running = false, generation = 0, frameHost;
  const api = () => window.strudel;
  let micGeneration = 0, dedicated = false;
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
    button.addEventListener('click',()=> { if (root === element && hydra?.synth.a) connectMic(hydra.synth.a); });
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
    audio.stream?.getTracks().forEach(track=>track.stop()); audio.stream = null;
    if (audio.context && audio.context.state !== 'closed') audio.context.close().catch(()=>{});
    audio.context = null; audio.fft.fill(0);
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
    const ticket = ++micGeneration;
    disposeAudio(audio); micStatus('connexion en cours…',true);
    let stream, context;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Entrée audio indisponible dans ce navigateur.');
      context = new AudioContext(); context.resume().catch(()=>{});
      stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      if (ticket !== micGeneration || hydra?.synth.a !== audio) { stream.getTracks().forEach(t=>t.stop()); context.close().catch(()=>{}); return; }
      audio.connectStream(stream,context);
      context.addEventListener('statechange',()=>refreshMic(audio));
      stream.getAudioTracks().forEach(track=>['ended','mute','unmute'].forEach(event=>track.addEventListener(event,()=>refreshMic(audio))));
      refreshMic(audio);
    } catch(error) {
      stream?.getTracks().forEach(t=>t.stop()); if (context && context.state !== 'closed') context.close().catch(()=>{});
      if (ticket !== micGeneration || hydra?.synth.a !== audio) return;
      const messages = {NotAllowedError:'autorisation refusée. Autorise le micro pour pilami.fr, puis reconnecte.',NotFoundError:'aucune entrée audio trouvée.',NotReadableError:'entrée audio inaccessible ou occupée.'};
      micStatus(messages[error.name] || error.message);
    }
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
    const {feedStrudel=false,detectAudio=false,pixelRatio=1,pixelated=true,src,canvas:customCanvas,autoLoop,makeGlobal,...config} = options;
    const key=JSON.stringify({...config,feedStrudel:!!feedStrudel,detectAudio:!!detectAudio,pixelRatio,pixelated});
    if (hydra && optionsKey===key) {
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
      // Keep Strudel's global hush available; Stop pauses Hydra without losing its image.
      window.hush=()=> { api().hush();pause(); };
      optionsKey=key;
      if (detectAudio) connectMic(hydra.synth.a);
      window.PilamiStrudelVisuals.attachHydra(canvas,!!feedStrudel,(width,height)=> {
        if (hydra && (hydra.canvas.width!==width || hydra.canvas.height!==height)) hydra.setResolution(width,height);
      });
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
    async enableControlAudio(band = 0, reconnect = false) {
      if (!hydra || !dedicated) throw new Error('Lance un visuel Hydra avant de relier une bande audio.');
      if (!Number.isInteger(band) || band < 0 || band > 15) throw new Error('Bande audio invalide.');
      if (!hydra.synth.a) {
        if (!restore.has('a')) restore.set('a',Object.getOwnPropertyDescriptor(window,'a'));
        // Pinned Hydra's audio initializer does not touch the WebGL renderer.
        hydra._initAudio({autoConnect:false});hydra.detectAudio=true;window.a=hydra.synth.a;
        const options=JSON.parse(optionsKey);options.detectAudio=true;optionsKey=JSON.stringify(options);
      }
      const audio=hydra.synth.a;
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
  window.addEventListener('pagehide',()=> { pause();micGeneration++;disposeAudio(hydra?.synth.a); });
})();
