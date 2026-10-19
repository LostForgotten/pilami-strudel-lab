(function () {
  'use strict';
  const KEY = 'pilami-strudel-visuals-v1';
  const defaults = {mode:'background', opacity:100, hue:0, saturation:100, height:300};
  const settings = {...defaults};
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (saved.mode === 'window') settings.mode = 'panel';
    if (saved.mode === 'panel' || saved.mode === 'background') settings.mode = saved.mode;
    for (const [key,min,max] of [['opacity',0,100],['hue',0,360],['saturation',0,200],['height',180,600]]) {
      if (typeof saved[key] === 'number' && Number.isFinite(saved[key])) settings[key] = Math.max(min,Math.min(max,saved[key]));
    }
  } catch (_) {}
  const panels = new Map();
  let hydraCanvas, hydraResize, feedStrudel = false;
  let outputWindow, outputCanvas, outputContext, outputTimer, outputStage, outputMessage;
  let outputPinned = false, outputGeneration = 0, pinPending = false, pinButton;
  let drawEntries = new Map(), visualFrame, visualHost, drawing = false;
  let canvas, dock, dockContent, dockToggle, modeButton, optionsButton, popover, activeRoot, frame, positionFrame;
  const persist = () => { try { localStorage.setItem(KEY,JSON.stringify(settings)); } catch (_) {} };
  function setOutputMessage(message) {
    if (outputMessage) { outputMessage.textContent = message; outputMessage.hidden = !message; }
  }
  const animationHost = () => settings.mode === 'window' && outputWindow && !outputWindow.closed ? outputWindow : window;
  function pauseDrawing() {
    drawing = false;
    if (visualFrame && visualHost && !visualHost.closed) visualHost.cancelAnimationFrame(visualFrame);
    visualFrame = null;
  }
  function resumeDrawing() {
    const wasRunning = drawing; pauseDrawing();
    drawing = wasRunning || drawEntries.size > 0;
    if (!drawing || !drawEntries.size) return;
    const tick = () => {
      if (!drawing) return;
      const time = window.strudel.getTime();
      for (const entry of drawEntries.values()) {
        const end = time + entry.ahead;
        entry.haps = entry.haps.filter(h => h.isInNearPast(entry.behind,time));
        const from = Math.max(entry.previous ?? end, end-.1);
        entry.haps.push(...entry.pattern.queryArc(from,end).filter(h => h.hasOnset()));
        entry.previous = end;
        entry.paint(entry.haps,time,end,entry.pattern);
      }
      paintOutput(); visualHost = animationHost(); visualFrame = visualHost.requestAnimationFrame(tick);
    };
    visualHost = animationHost(); visualFrame = visualHost.requestAnimationFrame(tick);
  }
  function paintOutput() {
    if (settings.mode !== 'window' || !outputContext || !outputWindow || outputWindow.closed) return;
    // Hydra's WebGL canvas is displayed directly. Only 2D Strudel visuals need a mirror.
    outputCanvas.hidden = !!hydraCanvas || feedStrudel;
    if (outputCanvas.hidden || !canvas) return;
    if (outputCanvas.width !== canvas.width) outputCanvas.width = canvas.width;
    if (outputCanvas.height !== canvas.height) outputCanvas.height = canvas.height;
    const ctx = outputContext;
    ctx.clearRect(0,0,outputCanvas.width,outputCanvas.height);
    ctx.drawImage(canvas,0,0);
    outputCanvas.style.opacity = settings.opacity/100;
    outputCanvas.style.filter = 'hue-rotate('+settings.hue+'deg) saturate('+settings.saturation+'%)';
  }
  function closeOutput() {
    outputGeneration++;
    if (outputTimer) clearInterval(outputTimer);
    outputTimer = null;
    // Rescue the WebGL canvas before closing its document. Its context and feedback survive.
    if (hydraCanvas && outputWindow && hydraCanvas.ownerDocument === outputWindow.document) document.body.prepend(hydraCanvas);
    outputContext = outputCanvas = outputStage = null;
    const child = outputWindow; outputWindow = null; outputPinned = false;
    if (child && !child.closed) child.close();
    updatePinButton();
  }
  function openOutput() {
    if (outputWindow && !outputWindow.closed) { outputWindow.focus(); return true; }
    // This call stays in the button's click handler so browsers allow the popup.
    const child = window.open('', 'pilami-strudel-output', 'popup=yes,width=1100,height=720,resizable=yes,scrollbars=no');
    if (!child) { setOutputMessage('Autorise les fenêtres pop-up pour ce site, puis clique à nouveau sur Visuels.'); return false; }
    return configureOutput(child, false);
  }
  function updatePinButton() {
    if (!pinButton) return;
    pinButton.disabled = pinPending;
    pinButton.textContent = pinPending ? 'Ouverture…' : '📌 Au-dessus';
    pinButton.setAttribute('aria-pressed', String(outputPinned));
    pinButton.title = outputPinned ? 'Revenir à la fenêtre classique' : 'Garder les visuels au-dessus des autres fenêtres';
    pinButton.setAttribute('aria-label',pinButton.title);
  }
  async function togglePinnedOutput() {
    if (pinPending) return;
    if (outputPinned) {
      closeOutput();
      settings.mode = openOutput() ? 'window' : 'panel';
      apply(); persist(); return;
    }
    if (typeof window.documentPictureInPicture?.requestWindow !== 'function') {
      setOutputMessage('Le mode Au-dessus n’est pas disponible dans ce navigateur. Essaie un navigateur de bureau récent. Sous Windows, PowerToys permet aussi d’épingler la fenêtre classique avec Win + Ctrl + T.');
      return;
    }
    const ticket = ++outputGeneration;
    pinPending = true; updatePinButton();
    try {
      // Must be called from the main page's own click, before any await.
      const child = await window.documentPictureInPicture.requestWindow({width:800, height:450});
      if (ticket !== outputGeneration) { child.close(); return; }
      // Keep the existing output alive until the browser has granted PiP.
      closeOutput();
      if (configureOutput(child, true)) {
        settings.mode = 'window'; apply(); persist();
      } else {
        settings.mode = 'panel'; apply(); persist();
      }
    } catch (error) {
      if (ticket === outputGeneration) setOutputMessage('Impossible d’activer Au-dessus : '+error.message+'. La fenêtre actuelle reste disponible.');
    } finally {
      pinPending = false; updatePinButton();
    }
  }
  function configureOutput(child, pinned) {
    outputWindow = child; outputPinned = pinned; updatePinButton();
    try {
      const doc = child.document;
      doc.title = pinned ? 'Pilami — Visuels au-dessus' : 'Pilami — Visuels'; doc.documentElement.lang = 'fr';
      doc.head.replaceChildren(); doc.body.replaceChildren();
      const style = doc.createElement('style');
      style.textContent = 'html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000;color:#fff;font:14px system-ui,sans-serif}#stage{position:fixed;inset:0;background:#000}#stage>canvas{position:absolute!important;inset:0!important;left:0!important;top:0!important;width:100%!important;height:100%!important;pointer-events:auto!important}[hidden]{display:none!important}.controls{position:fixed;z-index:2;top:16px;right:16px;display:flex;gap:8px;align-items:center;transition:opacity .3s}.controls button{font:inherit;color:#fff;background:#18212bcc;border:1px solid #ffffff66;border-radius:8px;padding:10px 14px;cursor:pointer}.controls button:focus-visible{outline:3px solid #86baff;outline-offset:2px}.hint{position:fixed;left:16px;bottom:16px;color:#ddd;text-shadow:0 1px 3px #000;transition:opacity .3s}body.idle .controls,body.idle .hint{opacity:0}body.idle{cursor:none}.controls:focus-within{opacity:1!important}';
      doc.head.append(style);
      const stage = doc.createElement('div'); stage.id = 'stage'; outputStage = stage;
      stage.setAttribute('aria-label','Visuels Strudel et Hydra en direct');
      const controls = doc.createElement('div'); controls.className = 'controls';
      const full = doc.createElement('button'); full.id = 'fullscreen'; full.type = 'button'; full.textContent = '⛶ Plein écran'; full.hidden = pinned;
      const quit = doc.createElement('button'); quit.type = 'button'; quit.textContent = 'Fermer';
      const hint = doc.createElement('div'); hint.id = 'hint'; hint.className = 'hint'; hint.textContent = pinned ? '📌 Toujours au-dessus · Déplace et redimensionne cette fenêtre.' : 'Déplace cette fenêtre sur ton écran. Double-clic ou F : plein écran. Le bouton 📌 Au-dessus se trouve sur la page principale.';
      controls.append(full,quit); doc.body.append(stage,controls,hint);
      // Fullscreen handlers run in the output window's own realm and user activation.
      const script = doc.createElement('script');
      script.textContent = `(function(){
        const full=document.getElementById('fullscreen'), stage=document.getElementById('stage'), hint=document.getElementById('hint');
        async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(error){hint.textContent='Plein écran refusé : '+error.message+'. Essaie F11 dans cette fenêtre.';}}
        const pinned=${pinned};
        if(!pinned){
          full.addEventListener('click',event=>{fullscreen();if(event.detail)full.blur();});
          stage.addEventListener('dblclick',fullscreen);
          document.addEventListener('keydown',event=>{if(!window.opener?.PilamiShortcuts&&!event.repeat&&event.key.toLowerCase()==='f'&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();fullscreen();}});
        }
        document.addEventListener('fullscreenchange',()=>{full.textContent=document.fullscreenElement?'⛶ Quitter le plein écran':'⛶ Plein écran';});
        let timer;function reveal(){document.body.classList.remove('idle');clearTimeout(timer);timer=setTimeout(()=>document.body.classList.add('idle'),2500);}
        document.addEventListener('pointermove',reveal);document.addEventListener('keydown',reveal);reveal();
      })();`;
      doc.body.append(script);
      window.PilamiShortcuts?.bindDocument(doc,activeRoot);
      quit.addEventListener('click',()=>child.close());
      child.addEventListener('resize',()=> { sizeCanvas(); });
      doc.addEventListener('fullscreenchange',()=> { sizeCanvas(); });
      outputCanvas = doc.createElement('canvas'); outputCanvas.id = 'strudel-output-canvas';
      outputContext = outputCanvas.getContext('2d'); stage.append(outputCanvas);
      outputTimer = setInterval(()=> {
        if (outputWindow && outputWindow.closed) {
          closeOutput(); settings.mode = 'panel'; apply(); persist();
          setOutputMessage('Fenêtre fermée : les visuels sont revenus dans le panneau.');
        }
      },400);
      child.addEventListener('pagehide',()=> {
        if (outputWindow !== child) return;
        if (hydraCanvas && hydraCanvas.ownerDocument === doc) document.body.prepend(hydraCanvas);
        closeOutput();
        settings.mode = 'panel'; apply(); persist();
        setOutputMessage('Fenêtre fermée : les visuels sont revenus dans le panneau.');
      });
      setOutputMessage(pinned ? 'Les visuels restent au-dessus des autres fenêtres. Reclique sur 📌 Au-dessus pour revenir à la fenêtre classique.' : 'Déplace la nouvelle fenêtre sur ton écran, puis clique sur Plein écran.');
      return true;
    } catch (error) {
      closeOutput(); setOutputMessage('Impossible d’ouvrir les visuels : '+error.message); return false;
    }
  }
  function sizeCanvas() {
    frame = null;
    if (!canvas || !activeRoot) return;
    const panel = panels.get(activeRoot);
    const width = settings.mode === 'panel' ? panel.stage.clientWidth : settings.mode === 'window' && outputWindow && !outputWindow.closed ? outputWindow.innerWidth : innerWidth;
    const height = settings.mode === 'panel' ? settings.height : settings.mode === 'window' && outputWindow && !outputWindow.closed ? outputWindow.innerHeight : innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.max(1, Math.round(width*ratio)), pixelHeight = Math.max(1, Math.round(height*ratio));
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    // Hydra renders at CSS resolution to keep feedback textures consistent.
    if (hydraResize) hydraResize(Math.max(1,width),Math.max(1,height));
    paintOutput();
  }
  const scheduleSize = () => { if (!frame) frame = requestAnimationFrame(sizeCanvas); };
  function placeDock() {
    positionFrame = null;
    if (!dock) return;
    const theme = document.getElementById('pilami-theme-toggle');
    if (theme) {
      const rect = theme.getBoundingClientRect();
      dock.style.right = Math.max(12,innerWidth-rect.right)+'px';
      dock.style.bottom = Math.max(12,innerHeight-rect.top+10)+'px';
    } else {
      dock.style.right = ''; dock.style.bottom = '';
    }
  }
  const schedulePosition = () => { if (!positionFrame) positionFrame = requestAnimationFrame(placeDock); };
  function apply() {
    if (!canvas || !activeRoot) return;
    const panelMode = settings.mode === 'panel';
    const windowMode = settings.mode === 'window';
    const panel = panels.get(activeRoot);
    panels.forEach(item=> { item.section.hidden = true; });
    panel.section.hidden = !panelMode;
    panel.stage.style.height = settings.height+'px';
    const target = panelMode ? panel.stage : document.body;
    if (canvas.parentNode !== target) {
      if (panelMode) target.append(canvas); else target.prepend(canvas);
    }
    canvas.hidden = feedStrudel;
    canvas.className = 'pilami-visual-canvas '+(panelMode ? 'is-panel' : windowMode ? 'is-output-source' : 'is-background');
    canvas.style.opacity = settings.opacity/100;
    canvas.style.filter = 'hue-rotate('+settings.hue+'deg) saturate('+settings.saturation+'%)';
    if (hydraCanvas) {
      const hydraTarget = windowMode && outputStage ? outputStage : target;
      if (hydraCanvas.parentNode !== hydraTarget) { if (panelMode || windowMode) hydraTarget.append(hydraCanvas);else canvas.after(hydraCanvas); }
      hydraCanvas.className = 'pilami-visual-canvas '+(panelMode ? 'is-panel' : windowMode ? 'is-output-source' : 'is-background');
      hydraCanvas.style.opacity = settings.opacity/100;
      hydraCanvas.style.filter = canvas.style.filter;
    }
    modeButton.textContent = 'Visuels : '+(panelMode ? 'Panneau' : windowMode ? (outputPinned ? 'Au-dessus' : 'Fenêtre séparée') : 'Fond');
    updatePinButton();
    modeButton.removeAttribute('aria-pressed');
    modeButton.setAttribute('aria-label',modeButton.textContent+'. Passer en '+(panelMode ? 'fenêtre séparée.' : windowMode ? 'fond de page.' : 'panneau.'));
    popover.querySelector('[data-visual-height]').disabled = !panelMode;
    popover.querySelectorAll('[data-visual-setting]').forEach(input=> {
      input.value = settings[input.dataset.visualSetting];
      const suffix = input.dataset.visualSetting === 'hue' ? '°' : input.dataset.visualSetting === 'height' ? ' px' : ' %';
      input.parentNode.querySelector('output').textContent = input.value+suffix;
    });
    if (drawing) resumeDrawing();
    window.dispatchEvent(new Event('pilami-visual-clock'));
    paintOutput(); scheduleSize();
  }
  function setDockExpanded(expanded) {
    dockContent.hidden=!expanded;
    dockToggle.textContent=expanded?'−':'▤';
    dockToggle.title=expanded?'Réduire les commandes visuelles':'Afficher les commandes visuelles';
    dockToggle.setAttribute('aria-label',dockToggle.title);
    dockToggle.setAttribute('aria-expanded',String(expanded));
    if(!expanded){popover.hidden=true;optionsButton.setAttribute('aria-expanded','false');}
    schedulePosition();
  }
  function cycleMode(root) {
    if(root&&panels.has(root))activeRoot=root;
    if(!canvas||!activeRoot)return null;
    outputGeneration++; // Cancel an outstanding PiP request on a mode change.
    if(settings.mode==='panel'){
      if(!openOutput())return null;
      settings.mode='window';
    }else{
      if(settings.mode==='window')closeOutput();
      settings.mode=settings.mode==='background'?'panel':'background';
      setOutputMessage('');
    }
    apply();persist();return settings.mode;
  }
  function createUI() {
    canvas = document.getElementById('test-canvas') || document.createElement('canvas');
    canvas.id = 'test-canvas';
    canvas.setAttribute('aria-hidden','true');
    // The bundled Strudel default drawing context uses this exact canvas ID.
    dock = document.createElement('div'); dock.className = 'pilami-visual-dock';
    dock.innerHTML = '<div id="pilami-visual-dock-content" hidden><div class="pilami-visual-buttons"><button type="button" data-visual-mode></button><button type="button" data-visual-pin aria-pressed="false" aria-label="Garder les visuels au-dessus des autres fenêtres">📌 Au-dessus</button><button type="button" data-visual-shortcuts aria-label="Raccourcis et écrans" title="Ouvrir les raccourcis et écrans">⌨</button><button type="button" data-visual-options aria-label="Réglages visuels" aria-controls="pilami-visual-options" aria-expanded="false">⚙</button></div><div id="pilami-visual-options" class="pilami-visual-options" hidden><h3>Réglages visuels</h3><p>Ces réglages changent l’image pendant la lecture.</p></div></div><button type="button" data-visual-dock-toggle aria-controls="pilami-visual-dock-content" aria-expanded="false" aria-label="Afficher les commandes visuelles" title="Afficher les commandes visuelles">▤</button>';
    dockContent=dock.querySelector('#pilami-visual-dock-content');dockToggle=dock.querySelector('[data-visual-dock-toggle]');
    outputMessage = document.createElement('p'); outputMessage.className = 'pilami-visual-message'; outputMessage.hidden = true; outputMessage.setAttribute('role','status'); outputMessage.setAttribute('aria-live','polite'); dockContent.append(outputMessage);
    document.body.append(dock);
    modeButton = dock.querySelector('[data-visual-mode]'); optionsButton = dock.querySelector('[data-visual-options]'); popover = dock.querySelector('.pilami-visual-options');
    dockToggle.addEventListener('click',()=>setDockExpanded(dockContent.hidden));setDockExpanded(false);
    pinButton = dock.querySelector('[data-visual-pin]');
    pinButton.addEventListener('click',togglePinnedOutput); updatePinButton();
    // A reliable entry point inside our OWN floating dock, not the WordPress
    // theme button whose visible label and parent can vary.
    dock.querySelector('[data-visual-shortcuts]').addEventListener('click',()=>{
      const shortcuts=window.PilamiShortcuts;
      if(shortcuts?.openPanel?.(activeRoot))return;
      setOutputMessage('Ouvre Hydra une fois pour initialiser les réglages Raccourcis et écrans.');
    });

    for (const [key,label,min,max] of [['opacity','Opacité',0,100],['hue','Teinte',0,360],['saturation','Intensité des couleurs',0,200],['height','Hauteur du panneau',180,600]]) {
      const row = document.createElement('label');
      const title = document.createElement('span'); title.textContent = label;
      const input = document.createElement('input'); input.type = 'range'; input.min=min; input.max=max; input.step=1; input.dataset.visualSetting=key; input.setAttribute('aria-label',label);
      if (key==='height') input.dataset.visualHeight='';
      const output = document.createElement('output');
      input.addEventListener('input',()=> { settings[key]=Number(input.value); apply(); persist(); });
      row.append(title,input,output); popover.append(row);
    }
    window.PilamiStrudelHydra?.mountResolution(popover);
    const reset = document.createElement('button'); reset.type='button'; reset.textContent='Réglages d’origine'; reset.dataset.visualReset='';
    reset.addEventListener('click',()=> { closeOutput(); setOutputMessage(''); Object.assign(settings,defaults);window.PilamiStrudelHydra?.setRenderResolution('preset'); apply(); persist(); }); popover.append(reset);
    const close = () => { popover.hidden=true; optionsButton.setAttribute('aria-expanded','false'); };
    optionsButton.addEventListener('click',()=> { popover.hidden=!popover.hidden; optionsButton.setAttribute('aria-expanded',String(!popover.hidden)); });
    modeButton.addEventListener('click',()=>cycleMode());
    document.addEventListener('pointerdown',event=> { if (!dock.contains(event.target)) close(); });
    dock.addEventListener('keydown',event=> { if (event.key==='Escape') { event.preventDefault();event.stopPropagation();if(!popover.hidden){close();optionsButton.focus();}else{setDockExpanded(false);dockToggle.focus();} } });
    window.addEventListener('resize',()=> { scheduleSize();schedulePosition(); });
    const theme = document.getElementById('pilami-theme-toggle');
    if (theme) new ResizeObserver(schedulePosition).observe(theme);
    // Covers the theme's deferred boot and changing button labels.
    window.addEventListener('load',schedulePosition);
    schedulePosition();
  }
  window.PilamiStrudelVisuals = {
    cycleMode,
    ensureOutput(root) {
      if(root&&panels.has(root))activeRoot=root;
      if(outputPinned)closeOutput();
      if(!openOutput())return null;
      settings.mode='window';apply();persist();
      return {win:outputWindow,doc:outputWindow.document};
    },
    mount(root) {
      const section = root.querySelector('[data-visual-panel]');
      if (!section) return;
      panels.set(root,{section,stage:section.querySelector('[data-visual-stage]')});
      new ResizeObserver(scheduleSize).observe(section.querySelector('[data-visual-stage]'));
      if (!canvas) { activeRoot=root;createUI();apply(); }
    },
    activate(root) { if (!panels.has(root)) return; activeRoot=root;apply(); },
    attachHydra(node,feed,resize) { hydraCanvas=node;feedStrudel=feed;hydraResize=resize;apply(); },
    animationHost,
    register() {
      window.strudel.Pattern.prototype.draw = function(paint,config = {}) {
        const time = Math.max(window.strudel.getTime(),0), ahead = config.lookahead || 0;
        drawEntries.set(config.id ?? 1,{paint,pattern:this,behind:Math.abs(config.lookbehind || 0),ahead,haps:this.queryArc(time,time+ahead).filter(h=>h.hasOnset())});
        return this;
      };
    },
    pause: pauseDrawing, resume: resumeDrawing,
    present: paintOutput,
    clear() { pauseDrawing(); drawEntries.clear(); if (canvas) canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height); paintOutput(); }
  };
  window.addEventListener('pagehide',closeOutput);
})();
