/* Pilami Strudel Lab — local Ableton Link clock and visual-action quantization.
 * The bridge is read-only: never changes Live tempo/transport.
 * Visual scheduling is approximate (browser/WebSocket), not audio-sample-accurate.
 */
(() => {
  'use strict';
  const BRIDGE = 'ws://127.0.0.1:8765';
  const MODES = Object.freeze({
    immediate:{quantum:0,label:'Immédiat'},
    beat:{quantum:1,label:'Prochain temps'},
    bar:{quantum:4,label:'Prochaine mesure'},
    bars4:{quantum:16,label:'Prochain cycle de 4 mesures'},
    bars8:{quantum:32,label:'Prochain cycle de 8 mesures'}
  });
  const STORAGE_KEY = 'pilami-link-quantize-v1';
  const bar = document.querySelector('[data-pilami-strudel] [data-pilami-link-bar]');
  if (!bar) return;
  const status = bar.querySelector('[data-link-status]');
  const bpm = bar.querySelector('[data-link-bpm]');
  const beat = bar.querySelector('[data-link-beat]');
  const peers = bar.querySelector('[data-link-peers]');
  const button = bar.querySelector('[data-link-connect]');
  let socket = null, reconnect = null, wanted = false, lastMessage = 0;
  let clock = null, pending = null, sequence = 0;
  let mode = 'immediate';
  try { const stored = localStorage.getItem(STORAGE_KEY); if (MODES[stored]) mode=stored; } catch (_) {}
  const observers = new Set();
  const publish = () => { for (const fn of [...observers]) try { fn(); } catch (error) { console.error('Pilami Link listener:', error); } };
  const healthy = () => socket?.readyState === WebSocket.OPEN && clock && performance.now() - clock.received < 1600;
  const phaseFor = (sample, quantum) => {
    const start = quantum === 1 ? sample.phase : quantum === 4 ? sample.phase : quantum === 16 ? sample.phase16 : sample.phase32;
    if (!Number.isFinite(start)) return NaN;
    const projected = start + Math.max(0,performance.now()-sample.received)*sample.bpm/60000;
    return ((projected % quantum) + quantum) % quantum;
  };
  const setState = (state, label) => {
    bar.dataset.state = state; status.textContent = label;
    button.textContent = wanted ? 'Déconnecter Link' : 'Connecter Link';
  };
  const clear = () => { bpm.textContent = '—'; beat.textContent = '— / 4'; peers.textContent = '— pairs'; };
  function cancel(owner=null) {
    if (!pending || (owner && pending.owner !== owner)) return false;
    clearTimeout(pending.timer); pending = null; publish(); return true;
  }
  function fire(expectedId) {
    if (!pending || pending.id !== expectedId) return;
    const {action} = pending; pending = null; publish();
    try { Promise.resolve(action()).catch(error => console.error('Pilami Link action:', error)); }
    catch(error) { console.error('Pilami Link action:', error); }
  }
  function adjust() {
    if (!pending || !healthy()) return;
    const q = pending.quantum, ph = phaseFor(clock, q);
    if (!Number.isFinite(ph)) { cancel(); return; }
    const now=performance.now();
    // The first queued boundary is always in the future. Never recalculate
    // when we are on top of it: a packet just after the wrap refers to the
    // *following* boundary, and must not push this action one cycle away.
    if (now >= pending.due - 45) return;
    const ms = (q - ph) * 60000 / clock.bpm;
    const nextDue = now + ms;
    if (Math.abs(nextDue - pending.due) < 12) return;
    pending.due = nextDue;
    const pendingId = pending.id;
    clearTimeout(pending.timer);
    pending.timer = setTimeout(() => fire(pendingId), Math.max(0,ms));
    publish();
  }
  function trigger(action,label,owner) {
    if (typeof action !== 'function') return false;
    cancel();
    const setting=MODES[mode];
    if (!setting.quantum || !healthy()) return action();
    const q=setting.quantum, ph=phaseFor(clock,q);
    if (!Number.isFinite(ph)) return action(); // old bridge without 4/8-bar phases
    const delay=(q-ph)*60000/clock.bpm;
    const id=++sequence;
    pending={id,owner,action,quantum:q,label:String(label||'Snapshot'),due:performance.now()+delay,timer:null};
    pending.timer=setTimeout(()=>fire(id),Math.max(0,delay));
    publish();
    return true;
  }
  function disconnect() {
    wanted=false; clearTimeout(reconnect); reconnect=null;
    cancel(); clock=null;
    if (socket) { const old=socket; socket=null; old.close(); }
    clear(); setState('offline','Autonome'); publish();
  }
  function retry() {
    if (!wanted) return;
    setState('error','Bridge indisponible');
    clearTimeout(reconnect); reconnect=setTimeout(connect,3000);
  }
  function connect() {
    if (!wanted || socket) return;
    setState('connecting','Connexion locale…');
    let ws;
    try { ws=new WebSocket(BRIDGE); } catch (_) { retry(); return; }
    socket=ws;
    ws.onopen=()=>{if(socket===ws){lastMessage=Date.now();setState('connected','Bridge connecté');}};
    ws.onmessage=event=>{
      if(socket!==ws) return;
      let payload;try { payload=JSON.parse(event.data); } catch (_) { return; }
      if(payload?.type!=='link-state'||!Number.isFinite(payload.bpm)||payload.bpm<20||payload.bpm>999) return;
      lastMessage=Date.now();
      const incomingPhase=Number(payload.phase);
      clock={bpm:payload.bpm,beat:Number.isFinite(Number(payload.beat))?Number(payload.beat):NaN,phase:Number.isFinite(incomingPhase)?incomingPhase:NaN,
        phase16:typeof payload.phase16==='number'?payload.phase16:NaN,
        phase32:typeof payload.phase32==='number'?payload.phase32:NaN,
        playing:typeof payload.playing==='boolean'?payload.playing:null,
        startStopSync:payload.startStopSync===true,transportEvent:Number.isSafeInteger(payload.transportEvent)?payload.transportEvent:null,bridgeVersion:payload.bridgeVersion||null,peers:Number.isSafeInteger(payload.peers)?payload.peers:0,
        received:performance.now()};
      bpm.textContent=payload.bpm.toFixed(1);
      beat.textContent=Number.isFinite(incomingPhase)?`${Math.floor(((incomingPhase%4)+4)%4)+1} / 4`:'— / 4';
      const count=Number.isSafeInteger(payload.peers)&&payload.peers>=0?payload.peers:0;
      peers.textContent=`${count} pair${count>1?'s':''}`;
      setState('connected',count?'Synchronisé':'Link actif · aucun pair (vérifie Live)');
      adjust();publish();
    };
    ws.onclose=()=>{if(socket!==ws)return;socket=null;clock=null;cancel();clear();if(wanted)retry();publish();};
    ws.onerror=()=>{};
  }
  button.addEventListener('click',()=>{if(wanted)disconnect();else{wanted=true;connect();}});
  document.addEventListener('visibilitychange',()=>{
    if (!document.hidden && wanted && socket?.readyState===WebSocket.OPEN && Date.now()-lastMessage>6000) socket.close();
  });
  // No scheduled visual change should fire on an outdated Link sample.
  const watchdog=setInterval(()=>{if(clock && !healthy()){clock=null;cancel();clear();if(socket?.readyState===WebSocket.OPEN)socket.close();else publish();}},700);
  window.addEventListener('pagehide',()=>{clearInterval(watchdog);disconnect();},{once:true});
  window.PilamiAbletonLink={
    modes:MODES,getMode:()=>mode,connected:()=>Boolean(healthy()),
    availableQuantum:q=>Boolean(healthy() && Number.isFinite(phaseFor(clock,q))),
    sample:()=>{if(!healthy())return null;const elapsed=(performance.now()-clock.received)*clock.bpm/60000;return {bpm:clock.bpm,beat:clock.beat+elapsed,phase:clock.phase+elapsed,phase16:clock.phase16+elapsed,phase32:clock.phase32+elapsed,playing:clock.playing,startStopSync:clock.startStopSync,transportEvent:clock.transportEvent,bridgeVersion:clock.bridgeVersion,peers:clock.peers};},
    getPending:()=>pending?{owner:pending.owner,label:pending.label,quantum:pending.quantum,remainingMs:Math.max(0,pending.due-performance.now())}:null,
    setMode(value){if(!MODES[value])return false;cancel();mode=value;try{localStorage.setItem(STORAGE_KEY,mode);}catch(_){}publish();return true;},
    trigger,cancel,subscribe(fn){observers.add(fn);return()=>observers.delete(fn);}
  };
  setState('offline','Autonome');
})();
