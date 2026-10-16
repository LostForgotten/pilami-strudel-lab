(function () {
  'use strict';
  const KEY = 'pilami-strudel-essais-v1';
  const MAX_CODE = 1024 * 1024;
  const MAX_SECONDS = 300;
  let recording = null, loadingWorklet = null;

  function filename(name) {
    return (name || 'essai-strudel').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'essai-strudel';
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function encodeWav(chunks, sampleRate, frames) {
    const buffer = new ArrayBuffer(44 + frames * 4), view = new DataView(buffer);
    const text = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset+i, value.charCodeAt(i)); };
    text(0, 'RIFF'); view.setUint32(4, 36 + frames * 4, true); text(8, 'WAVE');
    text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 2, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true);
    text(36, 'data'); view.setUint32(40, frames * 4, true);
    let offset = 44;
    for (const chunk of chunks) for (const value of chunk) {
      const s = Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0));
      view.setInt16(offset, Math.round(s * (s < 0 ? 32768 : 32767)), true); offset += 2;
    }
    return new Blob([buffer], {type:'audio/wav'});
  }
  function readStore() {
    const text = localStorage.getItem(KEY);
    if (!text) return {items:[], drafts:{}};
    const store = JSON.parse(text);
    if (!store || !Array.isArray(store.items) || typeof store.drafts !== 'object' || !store.drafts) {
      throw new Error('Sauvegardes illisibles. Exporte ton code pour le conserver.');
    }
    return store;
  }
  function mount(root, hooks) {
    const $ = selector => root.querySelector(selector);
    const code = $('[data-code]'), name = $('[data-save-name]'), list = $('[data-saved-list]');
    const message = $('[data-save-status]'), recMessage = $('[data-record-status]');
    const recButton = $('[data-action="record"]'), finishButton = $('[data-action="finish-record"]');
    const draftKey = location.pathname + ':' + Array.from(document.querySelectorAll('[data-pilami-strudel]')).indexOf(root);
    let selected = '', draftEnabled = true, audioURL = null;
    const say = (text, error = false) => { message.textContent = text; message.classList.toggle('is-error', error); };
    const safely = fn => { try { return fn(); } catch (error) { say('Sauvegarde indisponible : ' + error.message, true); return false; } };
    const saveDraft = () => {
      if (!draftEnabled) return;
      safely(() => {
        const store = readStore();
        store.drafts[draftKey] = {code:code.value, name:name.value, volume:Number($('[data-volume]').value)};
        localStorage.setItem(KEY, JSON.stringify(store));
      });
    };
    function refresh() {
      safely(() => {
        const items = readStore().items;
        list.replaceChildren(new Option('Choisir un essai…', ''));
        items.slice().sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).forEach(item => {
          if (typeof item.id === 'string' && typeof item.name === 'string') list.add(new Option(item.name, item.id));
        });
        list.value = selected;
        $('[data-action="load-save"]').disabled = !list.value;
        $('[data-action="delete-save"]').disabled = !list.value;
      });
    }
    function useCode(source, title, volume) {
      hooks.stop();
      code.value = source; name.value = title;
      root.querySelectorAll('[data-preset]').forEach(button => {button.classList.remove('is-active');button.setAttribute('aria-pressed','false');});
      if (Number.isFinite(volume) && volume >= 0 && volume <= 100) {
        $('[data-volume]').value = volume;
        $('[data-volume]').dispatchEvent(new Event('input', {bubbles:true}));
      }
      saveDraft();
    }
    refresh();
    safely(() => {
      const draft = readStore().drafts[draftKey];
      if (draft && typeof draft.code === 'string' && draft.code.length <= MAX_CODE) {
        useCode(draft.code, typeof draft.name === 'string' ? draft.name : '', draft.volume);
        say('Dernier brouillon restauré.');
      }
    });
    code.addEventListener('input', saveDraft);
    name.addEventListener('input', saveDraft);
    $('[data-volume]').addEventListener('input', saveDraft);
    root.addEventListener('pilami-code-change', saveDraft);
    list.addEventListener('change', () => {selected = list.value;refresh();});
    $('[data-action="save"]').addEventListener('click', () => safely(() => {
      const title = name.value.trim().slice(0, 100);
      if (!title) {say('Donne un nom à ton essai.', true);name.focus();return;}
      if (!code.value.trim()) {say('Le code est vide.', true);return;}
      const store = readStore();
      let item = store.items.find(item => item.name === title);
      if (item && !window.confirm('Remplacer l’essai « '+title+' » ?')) return;
      if (!item) {item = {id:crypto.randomUUID()};store.items.push(item);}
      Object.assign(item, {name:title,code:code.value,volume:Number($('[data-volume]').value),updatedAt:new Date().toISOString()});
      localStorage.setItem(KEY, JSON.stringify(store));selected=item.id;refresh();saveDraft();say('Essai « '+title+' » sauvegardé.');
    }));
    $('[data-action="load-save"]').addEventListener('click', () => safely(() => {
      const item = readStore().items.find(item => item.id === list.value);
      if (!item || typeof item.code !== 'string') throw new Error('Cet essai est introuvable.');
      useCode(item.code, item.name, item.volume);say('Essai chargé. Clique sur Lecture.');
    }));
    $('[data-action="delete-save"]').addEventListener('click', () => safely(() => {
      const store = readStore(), item = store.items.find(item => item.id === list.value);
      if (!item || !window.confirm('Supprimer l’essai « '+item.name+' » de ce navigateur ?')) return;
      store.items = store.items.filter(other => other.id !== item.id);
      localStorage.setItem(KEY, JSON.stringify(store));selected='';refresh();say('Essai supprimé. Le code affiché est conservé.');
    }));
    $('[data-action="export-code"]').addEventListener('click', () => {
      download(new Blob([code.value], {type:'text/plain;charset=utf-8'}), filename(name.value)+'.strudel.js');
      say('Code exporté.');
    });
    $('[data-action="import-code"]').addEventListener('click', () => $('[data-import-file]').click());
    $('[data-import-file]').addEventListener('change', async event => {
      const file = event.target.files[0];
      try {
        if (!file) return;
        if (file.size > MAX_CODE) throw new Error('Le fichier dépasse 1 Mo.');
        const source = await file.text();
        if (source.includes('\0')) throw new Error('Choisis un fichier de code texte.');
        useCode(source, file.name.replace(/(?:\.strudel)?\.(?:js|txt)$/i, ''));selected='';refresh();say('Code importé. Clique sur Lecture.');
      } catch (error) {say('Import impossible : '+error.message, true);}
      finally {event.target.value='';}
    });
    window.addEventListener('storage', event => {if (event.key === KEY) refresh();});
    root.addEventListener('pilami-saves-migrated', refresh);

    function reconnect() {
      if (!recording || recording.root !== root || !recording.node) return;
      const source = window.strudel.getSuperdoughAudioController().output.destinationGain;
      if (recording.source === source) return;
      if (recording.source) {try {recording.source.disconnect(recording.node);} catch (_) {}}
      source.connect(recording.node);recording.source=source;
    }
    window.addEventListener('pilami-audio-reset', reconnect);
    function cleanup(session) {
      clearInterval(session.timer);
      if (session.source) {try {session.source.disconnect(session.node);} catch (_) {}}
      if (session.node) {session.node.disconnect();session.node.port.close();}
      if (session.sink) session.sink.disconnect();
      recButton.disabled=false;finishButton.disabled=true;
      if (recording === session) recording=null;
    }
    const finish = () => {
      if (!recording || recording.root !== root || recording.finishing) return;
      if (!recording.node) {cleanup(recording);recMessage.textContent='Enregistrement annulé.';return;}
      recording.finishing=true;finishButton.disabled=true;
      clearInterval(recording.timer);
      recMessage.textContent='Préparation du WAV…';
      recording.node.port.postMessage('stop');
    };
    finishButton.addEventListener('click', finish);
    recButton.addEventListener('click', async () => {
      if (recording) {recMessage.textContent='Un enregistrement est déjà en cours.';return;}
      const session = {root, chunks:[], sampleRate:0, frames:0, finishing:false};
      recording=session;recButton.disabled=true;recMessage.textContent='Préparation de l’enregistrement…';
      try {
        await hooks.prepare();
        if (recording !== session) return;
        const ctx=window.strudel.getAudioContext();
        if (!ctx.audioWorklet || typeof AudioWorkletNode === 'undefined') throw new Error('Enregistrement audio non pris en charge par ce navigateur.');
        if (!loadingWorklet) loadingWorklet=ctx.audioWorklet.addModule(new URL(root.dataset.recorder, document.baseURI).href).catch(error => {loadingWorklet=null;throw error;});
        await loadingWorklet;
        if (recording !== session) return;
        session.sampleRate=ctx.sampleRate;
        session.node=new AudioWorkletNode(ctx, 'pilami-recorder-040', {
          numberOfInputs:1, numberOfOutputs:1, outputChannelCount:[2], channelCount:2,
          channelCountMode:'explicit', processorOptions:{maxFrames:MAX_SECONDS * ctx.sampleRate}
        });
        session.sink=ctx.createGain();session.sink.gain.value=0;
        session.node.connect(session.sink);session.sink.connect(ctx.destination);
        session.node.onprocessorerror=()=>{cleanup(session);recMessage.textContent='Erreur d’enregistrement. Réessaie.';};
        session.node.port.onmessage = event => {
          if (recording !== session) return;
          if (event.data.type === 'chunk') {session.chunks.push(event.data.data);session.frames+=event.data.data.length/2;}
          if (event.data.type === 'done') {
            try {
              const blob=encodeWav(session.chunks, session.sampleRate, session.frames);
              if (audioURL) URL.revokeObjectURL(audioURL);
              audioURL=URL.createObjectURL(blob);
              const link=$('[data-wav-link]');link.href=audioURL;
              link.download=filename(name.value)+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.wav';
              $('[data-wav-preview]').src=audioURL;$('[data-record-result]').hidden=false;
              recMessage.textContent='WAV prêt · '+(session.frames/session.sampleRate).toFixed(1)+' s'+(session.frames>=MAX_SECONDS*session.sampleRate?' · limite de 5 min atteinte':'');
            } catch (error) {recMessage.textContent='Export impossible : '+error.message;}
            finally {cleanup(session);session.chunks=[];}
          }
        };
        reconnect();
        session.node.port.postMessage('start');
        const played=await hooks.play();
        if (!played) throw new Error('Corrige le code avant d’enregistrer.');
        if (recording !== session || session.finishing) return;
        finishButton.disabled=false;
        session.started=ctx.currentTime;
        session.timer=setInterval(()=>{
          const seconds=Math.floor(ctx.currentTime-session.started);
          recMessage.textContent='● Enregistrement '+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
        },250);
        recMessage.textContent='● Enregistrement 00:00';
      } catch (error) {cleanup(session);recMessage.textContent='Enregistrement impossible : '+error.message;}
    });
    return {saveDraft, finish};
  }
  window.PilamiStrudelTools = {mount};
})();
