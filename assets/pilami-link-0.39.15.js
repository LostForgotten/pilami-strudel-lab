/* Pilami Strudel Lab — optional local Ableton Link display. No transport or tempo writes. */
(() => {
  'use strict';
  const BRIDGE = 'ws://127.0.0.1:8765';
  const bar = document.querySelector('[data-pilami-strudel] [data-pilami-link-bar]');
  if (!bar) return;
  const status = bar.querySelector('[data-link-status]');
  const bpm = bar.querySelector('[data-link-bpm]');
  const beat = bar.querySelector('[data-link-beat]');
  const peers = bar.querySelector('[data-link-peers]');
  const button = bar.querySelector('[data-link-connect]');
  let socket = null;
  let reconnect = null;
  let wanted = false;
  let lastMessage = 0;
  const setState = (state, label) => { bar.dataset.state = state; status.textContent = label; button.textContent = wanted ? 'Déconnecter Link' : 'Connecter Link'; };
  const clear = () => { bpm.textContent = '—'; beat.textContent = '— / 4'; peers.textContent = '— pairs'; };
  function disconnect() {
    wanted = false;
    clearTimeout(reconnect); reconnect = null;
    if (socket) { const old = socket; socket = null; old.close(); }
    clear(); setState('offline', 'Autonome');
  }
  function connect() {
    if (!wanted || socket) return;
    setState('connecting', 'Connexion locale…');
    let ws;
    try { ws = new WebSocket(BRIDGE); } catch (_) { retry(); return; }
    socket = ws;
    ws.onopen = () => { if (socket === ws) { lastMessage = Date.now(); setState('connected', 'Bridge connecté'); } };
    ws.onmessage = event => {
      if (socket !== ws) return;
      let payload;
      try { payload = JSON.parse(event.data); } catch (_) { return; }
      if (payload?.type !== 'link-state' || !Number.isFinite(payload.bpm) || payload.bpm < 20 || payload.bpm > 999) return;
      lastMessage = Date.now();
      bpm.textContent = payload.bpm.toFixed(1);
      const phase = Number.isFinite(payload.phase) ? payload.phase : null;
      beat.textContent = phase === null ? '— / 4' : `${Math.floor(((phase % 4) + 4) % 4) + 1} / 4`;
      const count = Number.isSafeInteger(payload.peers) && payload.peers >= 0 ? payload.peers : 0;
      peers.textContent = `${count} pair${count > 1 ? 's' : ''}`;
      setState('connected', count ? 'Synchronisé' : 'Link actif · aucun pair');
    };
    ws.onclose = () => { if (socket !== ws) return; socket = null; clear(); if (wanted) retry(); };
    ws.onerror = () => { /* onclose handles reconnect */ };
  }
  function retry() {
    if (!wanted) return;
    setState('error', 'Bridge indisponible');
    clearTimeout(reconnect);
    reconnect = setTimeout(connect, 3000);
  }
  button.addEventListener('click', () => { if (wanted) disconnect(); else { wanted = true; connect(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && wanted && socket?.readyState === WebSocket.OPEN && Date.now() - lastMessage > 6000) socket.close(); });
  window.addEventListener('pagehide', disconnect, { once: true });
  setState('offline', 'Autonome');
})();
