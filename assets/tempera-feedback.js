(() => {
  'use strict';
  const root = document.querySelector('[data-tempera-feedback]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';

  const grid = root.querySelector('[data-tempera-grid]');
  const canvas = root.querySelector('[data-particle-canvas]');
  const ctx = canvas.getContext('2d');
  const status = root.querySelector('[data-midi-status]');
  const statusWrap = root.querySelector('.pt-status-wrap');
  const statusDot = root.querySelector('[data-status-dot]');
  const select = root.querySelector('[data-midi-input]');
  const connect = root.querySelector('[data-midi-connect]');
  const help = root.querySelector('[data-midi-help]');
  const countLabel = root.querySelector('[data-particle-count]');
  const colors = ['#42baff', '#ff5478', '#55e1a3', '#ffc74c'];
  const cells = [];
  const held = new Map();
  const particles = [];
  let access = null, input = null, emitter = 0, last = 0, raf = 0;

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
    return {
      x: ((col + 0.5) / 8) * canvas.width,
      y: ((row + 0.5) / 8) * canvas.height,
      emitter, velocity: Math.max(1, velocity), col, row,
      boxWidth: box.width, boxHeight: box.height
    };
  }
  function spawn(source, amount) {
    if (!source) return;
    const n = amount || 16;
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.25 + Math.random() * 1.5) * (0.5 + source.velocity / 127);
      particles.push({
        x: source.x, y: source.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0, max: 0.5 + Math.random() * 1.5,
        radius: (1 + Math.random() * 2.4) * (0.65 + source.velocity / 127),
        color: colors[source.emitter]
      });
    }
    if (particles.length > 1500) particles.splice(0, particles.length - 1500);
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
      if (number === 10) setEmitter(Math.floor(value / 32));
      return;
    }
    if (type === 0x90 && value > 0) {
      if (number >= 96 && number <= 99) { setEmitter(number - 96); return; }
      const index = cellForNote(number);
      if (index < 0) return;
      const key = channel + ':' + number;
      const source = pulseCell(index, value);
      held.set(key, { source, lastSpawn: performance.now() });
      spawn(source, 18 + Math.round(value / 12));
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
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const item of held.values()) {
      if (now - item.lastSpawn > 42) {
        spawn(item.source, 1);
        item.lastSpawn = now;
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.max) { particles.splice(i, 1); continue; }
      p.x += p.vx * canvas.width * dt * 0.25;
      p.y += p.vy * canvas.height * dt * 0.25;
      p.vx *= 0.996; p.vy *= 0.996;
      const alpha = Math.sin(Math.PI * p.life / p.max) * 0.8;
      const radius = p.radius * (0.7 + p.life / p.max);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = radius * 5;
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
  buildGrid();
  resize();
  raf = requestAnimationFrame(draw);
})();
