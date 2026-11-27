(() => {
  'use strict';
  const root = document.querySelector('[data-tempera-feedback]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';

  const grid = root.querySelector('[data-tempera-grid]');
  const canvas = root.querySelector('[data-particle-canvas]');
  const ctx = canvas.getContext('2d');
  const shaderCanvas = root.querySelector('[data-shader-canvas]');
  const shaderError = root.querySelector('[data-shader-error]');
  const presetSelect = root.querySelector('[data-visual-preset]');
  const VISUAL_PRESETS_KEY = 'pilami-tempera-visual-presets-v1';
  const importVisualButton = root.querySelector('[data-import-visual]');
  const importVisualInput = root.querySelector('[data-visual-import-file]');
  const customVisualPresets = loadCustomVisualPresets();
  let shaderRenderer = null, shaderElapsed = 0, lastShaderFrame = 0;
  const status = root.querySelector('[data-midi-status]');
  const statusWrap = root.querySelector('.pt-status-wrap');
  const statusDot = root.querySelector('[data-status-dot]');
  const select = root.querySelector('[data-midi-input]');
  const connect = root.querySelector('[data-midi-connect]');
  const help = root.querySelector('[data-midi-help]');
  const countLabel = root.querySelector('[data-particle-count]');
  const colors = ['#42baff', '#ff5478', '#55e1a3', '#ffc74c'];
  const emitterParameters = Array.from({ length: 4 }, () => ({}));
  const ccParameterMap = new Map();
  [
    [0, { volume:40, grainLengthCell:41, grainLengthNote:42, grainDensity:43, grainShape:44, grainAttack:45, grainPan:46, tuneSpread:47, octave:48, relativeX:49, relativeY:50, sprayX:51, sprayY:52, toneWidth:53, toneCenter:54, effectsSend:55 }],
    [1, { volume:56, grainLengthCell:57, grainLengthNote:58, grainDensity:59, grainShape:60, grainAttack:61, grainPan:62, tuneSpread:63, octave:65, relativeX:67, relativeY:68, sprayX:69, sprayY:70, toneWidth:72, toneCenter:73, effectsSend:75 }],
    [2, { volume:76, grainLengthCell:77, grainLengthNote:78, grainDensity:79, grainShape:80, grainAttack:81, grainPan:82, tuneSpread:83, octave:84, relativeX:85, relativeY:86, sprayX:87, sprayY:88, toneWidth:89, toneCenter:90, effectsSend:91 }],
    [3, { volume:92, grainLengthCell:93, grainLengthNote:94, grainDensity:95, grainShape:96, grainAttack:97, grainPan:98, tuneSpread:99, octave:102, relativeX:103, relativeY:104, sprayX:105, sprayY:106, toneWidth:107, toneCenter:108, effectsSend:109 }]
  ].forEach(([index, parameters]) => {
    Object.entries(parameters).forEach(([name, cc]) => ccParameterMap.set(cc, { emitter: index, name }));
  });
  const cells = [];
  const held = new Map();
  const particles = [];
  let access = null, input = null, emitter = 0, last = 0, raf = 0;


  function setupAccountIndicator() {
    const button = root.querySelector('[data-tempera-account]');
    if (!button) return;
    let login = null;
    try {
      if (button.dataset.accountLogin) {
        const url = new URL(button.dataset.accountLogin, location.href);
        if (url.origin === location.origin && /^https?:$/.test(url.protocol)) login = url;
      }
    } catch (_) {}
    let endpoint;
    try {
      endpoint = new URL(button.dataset.accountApi, location.href);
      if (endpoint.origin !== location.origin) return;
    } catch (_) { return; }

    let seen = false, checking = false, disposed = false, lastCheck = 0, controller = null;
    let timer = null;
    function show(state, label) {
      button.hidden = !seen;
      button.dataset.state = state;
      button.title = label + (state === 'disconnected' && login ? ' · Cliquer pour se connecter' : ' · Cliquer pour vérifier');
      button.setAttribute('aria-label', button.title);
      button.querySelector('[data-account-label]').textContent = label;
    }
    async function check(force) {
      if (disposed || checking || document.hidden || (!force && Date.now() - lastCheck < 15000)) return;
      if (!root.isConnected) { dispose(); return; }
      checking = true;
      lastCheck = Date.now();
      controller = new AbortController();
      show('checking', 'Vérification de la connexion WordPress');
      const timeout = window.setTimeout(() => controller && controller.abort(), 8000);
      try {
        const url = new URL(endpoint);
        url.searchParams.set('action', 'pilami_strudel_connection');
        url.searchParams.set('_', String(Date.now()));
        const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
        const result = await response.json();
        const state = result.data;
        if (!response.ok || result.success !== true || typeof state?.authenticated !== 'boolean' || typeof state.admin !== 'boolean') throw new Error('Session indisponible');
        if (disposed) return;
        seen = true;
        if (state.authenticated) show('connected', state.admin ? 'Connecté à WordPress · Administrateur' : 'Connecté à WordPress');
        else show('disconnected', 'Déconnecté de WordPress');
      } catch (_) {
        if (!disposed) show('unknown', 'Connexion WordPress à vérifier');
      } finally {
        window.clearTimeout(timeout);
        checking = false;
        controller = null;
      }
    }
    function onClick() {
      if (button.dataset.state === 'disconnected' && login) { location.assign(login.href); return; }
      check(true);
    }
    function onHide(event) { if (!event.persisted) dispose(); }
    function dispose() {
      if (disposed) return;
      disposed = true;
      window.clearInterval(timer);
      if (controller) controller.abort();
      button.removeEventListener('click', onClick);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
    }
    function onFocus() { check(false); }
    function onVisibility() { if (!document.hidden) check(true); }
    button.addEventListener('click', onClick);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    timer = window.setInterval(() => check(false), 120000);
    check(true);
  }

  function setStatus(text, kind) {
    status.textContent = text;
    statusWrap.classList.toggle('is-connected', kind === 'connected');
    statusWrap.classList.toggle('is-error', kind === 'error');
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }
  function cellForNote(note) {
    if (note < 0 || note > 91) return -1;
    const col = Math.floor(note / 12);
    const row = note % 12;
    return col < 8 && row < 8 ? col * 8 + row : -1;
  }
  function setEmitter(index) {
    emitter = Math.max(0, Math.min(3, index));
    root.querySelectorAll('[data-emitter]').forEach(button => {
      button.setAttribute('aria-pressed', Number(button.dataset.emitter) === emitter ? 'true' : 'false');
    });
    refreshParameterReadout();
  }
  function rawParameter(index, name, fallback = 64) {
    const value = emitterParameters[index][name];
    return Number.isFinite(value) ? value : fallback;
  }
  function normalizedParameter(index, name, fallback = 64) {
    return Math.max(0, Math.min(127, rawParameter(index, name, fallback))) / 127;
  }
  function refreshParameterReadout() {
    const values = root.querySelector('.pt-parameter-values');
    if (!values) return;
    const state = emitterParameters[emitter];
    const length = state.grainLengthMode === 'cell'
      ? (state.grainLengthCell / 127 * 8).toFixed(1) + ' cell'
      : state.grainLengthMode === 'note'
        ? Math.round(state.grainLengthNote / 127 * 100) + '%'
        : '—';
    const display = {
      grainLength: length,
      grainDensity: state.grainDensity == null ? '—' : Math.round(state.grainDensity / 127 * 100) + '%',
      sprayX: state.sprayX == null ? '—' : Math.round(state.sprayX / 127 * 100) + '%',
      sprayY: state.sprayY == null ? '—' : Math.round(state.sprayY / 127 * 100) + '%',
      relativeX: state.relativeX == null ? '—' : Math.round((state.relativeX - 64) / 63 * 100) + '%',
      relativeY: state.relativeY == null ? '—' : Math.round((state.relativeY - 64) / 63 * 100) + '%'
    };
    Object.entries(display).forEach(([name, text]) => {
      const output = values.querySelector('[data-parameter="' + name + '"]');
      if (output) output.textContent = text;
    });
    const label = root.querySelector('[data-parameter-emitter]');
    if (label) label.textContent = 'PARAMÈTRES · E' + (emitter + 1);
  }
  function pulseCell(index, velocity) {
    const cell = cells[index];
    if (!cell) return null;
    cell.style.setProperty('--cell-color', colors[emitter]);
    cell.classList.add('is-active');
    window.clearTimeout(cell._pulseTimer);
    cell._pulseTimer = window.setTimeout(() => cell.classList.remove('is-active'), 180);
    const box = canvas.getBoundingClientRect();
    const col = Math.floor(index / 8), row = index % 8;
    const relX = (normalizedParameter(emitter, 'relativeX') - 0.5) * 0.16;
    const relY = (normalizedParameter(emitter, 'relativeY') - 0.5) * 0.16;
    const params = { ...emitterParameters[emitter] };
    const lengthRaw = params.grainLengthMode === 'note' ? params.grainLengthNote : params.grainLengthCell;
    return {
      x: (((col + 0.5) / 8) + relX) * canvas.width,
      y: (((row + 0.5) / 8) + relY) * canvas.height,
      emitter, velocity: Math.max(1, velocity), col, row, params,
      grainLength: Number.isFinite(lengthRaw) ? lengthRaw / 127 : 0.5,
      boxWidth: box.width, boxHeight: box.height
    };
  }
  function spawn(source, amount) {
    if (!source) return;
    const params = source.params || {};
    const density = rawParameter(source.emitter, 'grainDensity') / 127;
    const sprayX = Number.isFinite(params.sprayX) ? params.sprayX / 127 : 0.4;
    const sprayY = Number.isFinite(params.sprayY) ? params.sprayY / 127 : 0.4;
    const pan = Number.isFinite(params.grainPan) ? params.grainPan / 127 : 0.5;
    const volume = Number.isFinite(params.volume) ? params.volume / 127 : 0.8;
    const shape = Number.isFinite(params.grainShape) ? params.grainShape / 127 : 0.5;
    const send = Number.isFinite(params.effectsSend) ? params.effectsSend / 127 : 0.5;
    const tuneSpread = Number.isFinite(params.tuneSpread) ? params.tuneSpread / 127 : 0.25;
    const size = Number.isFinite(params.octave) ? 0.75 + (params.octave / 127) * 0.5 : 1;
    const n = amount || 16;
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.25 + Math.random() * (1.5 + tuneSpread)) * (0.5 + source.velocity / 127);
      const vx = Math.cos(angle) * speed * (0.12 + sprayX * 2.1) + (pan - 0.5) * speed * 0.45;
      const vy = Math.sin(angle) * speed * (0.12 + sprayY * 2.1);
      const grainLength = Number.isFinite(source.grainLength) ? source.grainLength : 0.5;
      particles.push({
        x: source.x, y: source.y, vx, vy,
        life: 0, max: 0.25 + Math.random() * (0.35 + grainLength * 2.1) + send * 0.45,
        radius: (1 + Math.random() * (1.4 + shape * 2.2)) * (0.65 + source.velocity / 127) * size,
        color: colors[source.emitter], alpha: (0.22 + volume * 0.78),
        softness: shape, trail: 0.25 + grainLength * 1.3
      });
    }
    if (particles.length > 1800) particles.splice(0, particles.length - 1800);
  }
  function buildGrid() {
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 8; row++) {
        const index = col * 8 + row;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pt-cell';
        button.setAttribute('aria-label', 'Cellule ' + (index + 1));
        button.title = 'Cellule ' + (index + 1) + ' · note ' + (col * 12 + row);
        button.addEventListener('click', () => {
          const source = pulseCell(index, 104);
          spawn(source, 24);
        });
        grid.appendChild(button);
        cells[index] = button;
      }
    }
  }
  function onMidi(event) {
    const [statusByte, number, value] = event.data;
    if (statusByte === undefined || number === undefined) return;
    const type = statusByte & 0xf0;
    const channel = statusByte & 0x0f;
    if (type === 0xb0) {
      if (number === 10) {
        setEmitter(Math.floor(value / 32));
      } else {
        const mapped = ccParameterMap.get(number);
        if (mapped) {
          const state = emitterParameters[mapped.emitter];
          state[mapped.name] = value;
          if (mapped.name === 'grainLengthCell') state.grainLengthMode = 'cell';
          if (mapped.name === 'grainLengthNote') state.grainLengthMode = 'note';
          if (mapped.emitter === emitter) refreshParameterReadout();
        }
      }
      return;
    }
    if (type === 0x90 && value > 0) {
      if (number >= 96 && number <= 99) { setEmitter(number - 96); return; }
      const index = cellForNote(number);
      if (index < 0) return;
      const key = channel + ':' + number;
      const source = pulseCell(index, value);
      held.set(key, { source, lastSpawn: performance.now() });
      const density = normalizedParameter(emitter, 'grainDensity');
      spawn(source, Math.round((8 + value / 6) * (0.25 + density * 1.75)));
      return;
    }
    if (type === 0x80 || (type === 0x90 && value === 0)) {
      held.delete(channel + ':' + number);
    }
  }
  function refreshInputs(preferred) {
    const inputs = Array.from(access.inputs.values());
    select.replaceChildren();
    if (!inputs.length) {
      const option = document.createElement('option');
      option.textContent = 'Aucune entrée MIDI détectée';
      select.appendChild(option);
      select.disabled = true;
      input = null;
      setStatus('LoopMIDI non détecté', 'error');
      help.textContent = 'Vérifie le port LoopMIDI et le routage de la piste Ableton vers cette entrée.';
      return;
    }
    inputs.forEach(port => {
      const option = document.createElement('option');
      option.value = port.id;
      option.textContent = port.name || 'Entrée MIDI';
      select.appendChild(option);
    });
    select.disabled = false;
    const choice = preferred || inputs.find(port => /loop.?midi|tempera/i.test(port.name || ''))?.id || inputs[0].id;
    select.value = choice;
    select.onchange = () => selectInput(select.value);
    selectInput(choice);
  }
  function selectInput(id) {
    if (input) input.onmidimessage = null;
    input = Array.from(access.inputs.values()).find(port => port.id === id) || null;
    if (input) {
      input.onmidimessage = onMidi;
      setStatus('MIDI connecté · ' + (input.name || 'entrée active'), 'connected');
      help.textContent = 'Joue sur Tempera : la cellule s’allume et son spray se propage dans le canvas.';
    }
  }
  async function connectMidi() {
    if (!navigator.requestMIDIAccess) {
      setStatus('Web MIDI indisponible', 'error');
      help.textContent = 'Utilise une page HTTPS dans un navigateur compatible Web MIDI.';
      return;
    }
    connect.disabled = true;
    connect.textContent = 'Ouverture…';
    try {
      access = await navigator.requestMIDIAccess({ sysex: false });
      refreshInputs();
      access.onstatechange = () => refreshInputs(select.value || undefined);
    } catch (error) {
      setStatus('Accès MIDI refusé', 'error');
      help.textContent = error && error.message ? error.message : 'Autorise l’accès MIDI dans le navigateur, puis réessaie.';
    } finally {
      connect.disabled = false;
      connect.textContent = 'Connecter le MIDI';
    }
  }
  function draw(now) {
    resize();
    const dt = Math.min(0.05, Math.max(0, (now - (last || now)) / 1000));
    last = now;
    ctx.globalCompositeOperation = 'source-over';
    if (shaderRenderer) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (shaderRenderer && now - lastShaderFrame >= 66) {
      shaderElapsed += lastShaderFrame ? Math.min(0.1, (now - lastShaderFrame) / 1000) : 0;
      shaderRenderer.render(shaderElapsed);
      lastShaderFrame = now;
    }
    for (const item of held.values()) {
      const density = normalizedParameter(item.source.emitter, 'grainDensity');
      const interval = 115 - density * 90;
      if (now - item.lastSpawn > interval) {
        spawn(item.source, 1 + Math.round(density * 2));
        item.lastSpawn = now;
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.max) { particles.splice(i, 1); continue; }
      const oldX = p.x, oldY = p.y;
      p.x += p.vx * canvas.width * dt * 0.25;
      p.y += p.vy * canvas.height * dt * 0.25;
      p.vx *= 0.996; p.vy *= 0.996;
      const fade = Math.sin(Math.PI * p.life / p.max);
      const alpha = fade * 0.8 * (p.alpha || 1);
      const radius = p.radius * (0.7 + p.life / p.max);
      ctx.globalAlpha = alpha * Math.min(1, p.trail || 0.5);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(0.7, radius * (0.18 + (p.trail || 0.5) * 0.35));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(oldX, oldY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = radius * (2 + (p.softness || 0.5) * 5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
    countLabel.textContent = particles.length + (particles.length === 1 ? ' particule' : ' particules');
    raf = requestAnimationFrame(draw);
  }

  function loadCustomVisualPresets() {
    try {
      const saved = JSON.parse(localStorage.getItem(VISUAL_PRESETS_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter(item => item && typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        (typeof item.imageSource === 'string' || typeof item.bufferSource === 'string') &&
        (item.bufferSource == null || typeof item.bufferSource === 'string') &&
        (item.commonSource == null || typeof item.commonSource === 'string')) : [];
    } catch (_) { return []; }
  }
  function refreshVisualPresetOptions() {
    root.querySelectorAll('option[data-custom-visual]').forEach(option => option.remove());
    customVisualPresets.forEach(item => {
      const option = document.createElement('option');
      option.value = 'custom:' + item.id;
      option.textContent = item.name;
      option.dataset.customVisual = '1';
      presetSelect.appendChild(option);
    });
  }
  function fileRole(file) {
    const name = file.name.replace(/\(\d+\)(?=\.[^.]+$)/, '').replace(/\.txt$/i, '').toLowerCase();
    if (/buffer[\s_-]*a|buffera|buffer\s*0/.test(name)) return 'buffer';
    if (/^common$|common[\s_-]*functions/.test(name)) return 'common';
    if (/^image$|^fragment$|^shader$/.test(name)) return 'image';
    return null;
  }
  async function importVisualPreset() {
    const files = Array.from(importVisualInput.files || []);
    if (!files.length) return;
    try {
      if (files.length > 3) throw new Error('Sélectionne au maximum Buffer A, Common et Image.');
      if (files.some(file => !/\.txt$/i.test(file.name))) throw new Error('Choisis des fichiers .txt.');
      if (files.some(file => file.size > 1024 * 1024) ||
          files.reduce((sum, file) => sum + file.size, 0) > 2 * 1024 * 1024) {
        throw new Error('Le preset dépasse la limite de 2 Mo.');
      }
      const sources = await Promise.all(files.map(file => file.text()));
      if (sources.some(source => !source.trim())) throw new Error('Un des fichiers ne contient pas de code shader.');
      const preset = { bufferSource: null, commonSource: null, imageSource: null };
      if (files.length === 1) {
        const role = fileRole(files[0]);
        if (role === 'buffer') preset.bufferSource = sources[0];
        else if (role === 'common') preset.commonSource = sources[0];
        else preset.imageSource = sources[0];
      } else {
        files.forEach((file, index) => {
          const role = fileRole(file);
          if (!role) throw new Error('Pour un import multipasse, nomme les fichiers Buffer A.txt, Common.txt et Image.txt.');
          if (preset[role === 'buffer' ? 'bufferSource' : role === 'common' ? 'commonSource' : 'imageSource']) {
            throw new Error('Deux fichiers correspondent au même passe : ' + role + '.');
          }
          preset[role === 'buffer' ? 'bufferSource' : role === 'common' ? 'commonSource' : 'imageSource'] = sources[index];
        });
        if (!preset.imageSource && !preset.bufferSource) throw new Error('Aucun code Image ou Buffer A détecté.');
      }
      if (!preset.imageSource && !preset.bufferSource) throw new Error('Le fichier Common doit accompagner un passe Image ou Buffer A.');
      const stem = files[0].name.replace(/\.txt$/i, '').replace(/\(\d+\)/g, '').trim();
      const label = files.length > 1 ? stem.replace(/\s*(Buffer A|Common|Image)\s*/i, '').trim() || 'Preset Shadertoy importé' : stem || 'Preset importé';
      const item = { id: 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name: label.slice(0, 48), ...preset };
      const updated = [...customVisualPresets.filter(existing => existing.name.toLocaleLowerCase() !== item.name.toLocaleLowerCase()), item];
      const encoded = JSON.stringify(updated);
      if (encoded.length > 3 * 1024 * 1024) throw new Error('Le stockage local est plein. Réduis la taille des fichiers importés.');
      localStorage.setItem(VISUAL_PRESETS_KEY, encoded);
      customVisualPresets.splice(0, customVisualPresets.length, ...updated);
      refreshVisualPresetOptions();
      presetSelect.value = 'custom:' + item.id;
      selectVisualPreset();
      shaderError.textContent = 'Preset importé et conservé dans ce navigateur.';
      shaderError.hidden = false;
      window.setTimeout(() => { if (shaderError.textContent.startsWith('Preset importé')) shaderError.hidden = true; }, 3500);
    } catch (error) {
      shaderError.textContent = error && error.message ? error.message : 'Import du preset impossible.';
      shaderError.hidden = false;
    } finally {
      importVisualInput.value = '';
    }
  }

  function selectVisualPreset() {
    if (shaderRenderer) { shaderRenderer.dispose(); shaderRenderer = null; }
    shaderError.hidden = true;
    shaderError.textContent = '';
    const custom = presetSelect.value.startsWith('custom:') ?
      customVisualPresets.find(item => 'custom:' + item.id === presetSelect.value) : null;
    const useShader = presetSelect.value === 'particles-party' || Boolean(custom);
    root.classList.toggle('has-shader-preset', useShader);
    if (!useShader) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const factory = window.PilamiTemperaShaders;
    if (!factory || !shaderCanvas) {
      shaderError.textContent = 'Le moteur WebGL du preset ne s’est pas chargé.';
      shaderError.hidden = false;
      return;
    }
    shaderRenderer = factory.create(shaderCanvas, message => {
      shaderError.textContent = 'Shader indisponible : ' + message;
      shaderError.hidden = false;
      root.classList.remove('has-shader-preset');
    }, custom || null);
    shaderElapsed = 0;
    lastShaderFrame = 0;
  }
  refreshVisualPresetOptions();
  importVisualButton.addEventListener('click', () => importVisualInput.click());
  importVisualInput.addEventListener('change', importVisualPreset);
  presetSelect.addEventListener('change', selectVisualPreset);
  selectVisualPreset();

  root.querySelectorAll('[data-emitter]').forEach(button => button.addEventListener('click', () => setEmitter(Number(button.dataset.emitter))));
  connect.addEventListener('click', connectMidi);
  root.querySelector('[data-test-cell]').addEventListener('click', () => {
    const index = Math.floor(Math.random() * 64);
    spawn(pulseCell(index, 110), 28);
  });
  root.querySelector('[data-fullscreen]').addEventListener('click', () => {
    if (root.requestFullscreen) root.requestFullscreen();
  });
  document.addEventListener('fullscreenchange', () => {
    root.classList.toggle('is-fullscreen', document.fullscreenElement === root);
  });
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(raf);
    if (input) input.onmidimessage = null;
    if (access) access.onstatechange = null;
  }, { once: true });
  setupAccountIndicator();
  refreshParameterReadout();
  buildGrid();
  resize();
  raf = requestAnimationFrame(draw);
})();
