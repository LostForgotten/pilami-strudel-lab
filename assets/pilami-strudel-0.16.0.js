(function () {
  'use strict';
  const PRESETS = {
    debut: `setcps(.65)
stack(
  s("bd sd").gain(.72),
  s("hh*4").gain(.28)
)`,

    batterie: `setcps(.75)
stack(
  s("bd*4").gain(.78),
  s("[~ sd]*2").gain(.55),
  s("hh*8").gain(.24)
)`,

    ambient: `setcps(.35)
stack(
  note("<c3 eb3 g3 bb3>")
    .s("sine")
    .room(.8)
    .delay(.35)
    .gain(.48),
  note("<g4 bb4 c5 eb5>/2")
    .s("triangle")
    .room(.9)
    .gain(.22)
)`,

    techno: `setcps(.72)
stack(
  s("kick909*4").gain(.76),
  s("[~ 808sd]*2").gain(.52),
  s("808oh*8").gain(.22)
)`,

    melodie: `setcps(.55)
n("0 2 4 7 4 2")
  .scale("C4:minor")
  .s("triangle")
  .room(.4)
  .gain(.48)`,

    surprise: `setcps(.68)
stack(
  s("bd [~ bd] sd bd").gain(.62),
  n("[0 2 4 7]*2")
    .scale("D3:minor")
    .s("sawtooth")
    .lpf(900)
    .room(.5)
    .sometimes(x => x.rev())
    .gain(.3)
)`
  };

  let engine, ready, activeRoot, request = 0;
  let masterVolume = .6;
  const api = () => window.strudel;
  const setStatus = (root, message, error = false) => {
    const status = root.querySelector('[data-status]');
    status.textContent = message;
    status.classList.toggle('is-error', error);
  };
  function applyVolume() {
    if (!engine) return;
    const gain = api().getSuperdoughAudioController().output.destinationGain.gain;
    const time = api().getAudioContext().currentTime;
    if (masterVolume === 0) {
      gain.cancelScheduledValues(time);
      gain.setValueAtTime(0, time);
    } else gain.setTargetAtTime(masterVolume, time, .015);
  }
  let sliderSession;
  function mountSliders(root) {
    const editor = root.querySelector('[data-code]');
    const panel = root.querySelector('[data-sliders]');
    const list = root.querySelector('[data-slider-list]');
    let entries = new Map(), original = '', expected = '', writing = false;
    const clear = () => { panel.hidden = true; list.replaceChildren(); };
    root.addEventListener('pilami-code-change', clear);
    editor.addEventListener('input', () => { if (!writing) clear(); });
    const session = {
      begin(source) { original = expected = source; entries = new Map(); clear(); sliderSession = session; },
      slider(id, initial = .5, min = 0, max = 1, step) {
        const values = [initial, min, max].map(Number);
        if (!values.every(Number.isFinite) || values[1] >= values[2]) throw new Error('slider : valeurs numériques et min < max requis.');
        let entry = entries.get(id);
        if (!entry) {
          entry = {id, value: Math.max(values[1], Math.min(values[2], values[0])), min: values[1], max: values[2], step: Number(step) > 0 ? Number(step) : 'any'};
          entries.set(id, entry);
        }
        return api().signal(() => entry.value);
      },
      render(widgets) {
        for (const widget of widgets.filter(w => w.type === 'slider')) {
          const entry = entries.get('slider_' + widget.from);
          if (!entry) continue;
          entry.from = widget.from; entry.to = widget.to;
          const before = original.slice(0, widget.from);
          const method = before.match(/\.([\w]+)\(\s*slider\(\s*$/);
          const variables = [...before.matchAll(/\b(?:let|const|var)\s+(\w+)\s*=/g)];
          const track = variables.length ? variables[variables.length - 1][1] + ' · ' : '';
          const label = document.createElement('label'); label.className = 'pilami-strudel-slider';
          const title = document.createElement('span'); title.textContent = track + (method ? method[1] : 'Paramètre') + ' · ligne ' + (before.split('\n').length);
          const input = document.createElement('input'); input.type = 'range'; input.min = entry.min; input.max = entry.max; input.step = entry.step; input.value = entry.value;
          input.setAttribute('aria-label', title.textContent);
          const output = document.createElement('output'); output.textContent = String(entry.value);
          input.addEventListener('input', () => {
            entry.value = Number(input.value); output.textContent = input.value;
            if (editor.value !== expected) return;
            let changed = original;
            [...entries.values()].filter(e => Number.isInteger(e.from)).sort((a,b) => b.from-a.from).forEach(e => {
              changed = changed.slice(0,e.from) + String(e.value) + changed.slice(e.to);
            });
            const start = editor.selectionStart, end = editor.selectionEnd, scroll = editor.scrollTop;
            editor.value = expected = changed;
            editor.setSelectionRange(Math.min(start, changed.length), Math.min(end, changed.length)); editor.scrollTop = scroll;
            writing = true; editor.dispatchEvent(new Event('input', {bubbles:true})); writing = false;
          });
          label.append(title, input, output); list.append(label);
        }
        panel.hidden = list.childElementCount === 0;
      }
    };
    return session;
  }

  function ensureStrudel(root) {
    if (ready) return ready;
    ready = (async () => {
      if (!api() || typeof api().initStrudel !== 'function') {
        throw new Error('Moteur absent. Recharge la page ou vérifie le cache du site.');
      }
      engine = await api().initStrudel({
        prebake: async () => {
          await api().evalScope({sliderWithID: (id, ...args) => {
            if (!sliderSession) throw new Error('Curseurs non initialisés.');
            return sliderSession.slider(id, ...args);
          }});
          await window.PilamiStrudelHydra.register();
          window.PilamiStrudelVisuals.register();
          window.PilamiStrudelInline.register();
          window.PilamiStrudelGM.register();
          await api().samples(Object.fromEntries(
          ['bd', 'sd', 'hh', 'kick909', '808sd', '808oh', 'cp'].map(name =>
            [name, [new URL(name + '.wav', new URL(root.dataset.samples, document.baseURI)).href]])
        ));
          // Legacy short names used by public Strudel scripts; sample files load on demand.
          await api().samples({
            sr16_rim: ['https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/AlesisSR16/alesissr16-rim/Rim.wav'],
            '9000_sd': ['https://raw.githubusercontent.com/ritchse/tidal-drum-machines/main/machines/Linn9000/linn9000-sd/0Snaredrum.wav']
          });
        },
        onUpdateState: state => {
          if (activeRoot && state.schedulerError) {
            setStatus(activeRoot, 'Erreur audio : ' + state.schedulerError.message, true);
          }
        }
      });
      // Preserve master level when Strudel resets its audio graph on Update.
      const controller = api().getSuperdoughAudioController();
      const reset = controller.reset.bind(controller);
      controller.reset = () => { reset(); applyVolume(); window.dispatchEvent(new Event('pilami-audio-reset')); };
      applyVolume();
      return engine;
    })().catch(error => { ready = null; throw error; });
    return ready;
  }
  function initLab(root) {
    if (root.dataset.initialized) return;
    root.dataset.initialized = 'true';
    const code = root.querySelector('[data-code]');
    const volume = root.querySelector('[data-volume]');
    const playButton = root.querySelector('[data-action="play"]');
    window.PilamiStrudelMenus.mount(root);
    const buttons = root.querySelectorAll('[data-preset]');
    const definitions = JSON.parse(root.querySelector('[data-preset-config]')?.textContent || '{}');
    const presets = {...PRESETS};
    for (const [key, preset] of Object.entries(definitions)) {
      if (typeof preset.code === 'string') presets[key] = preset.code;
    }
    let currentPreset = root.dataset.initialPreset || 'debut', tools;
    if (!presets[currentPreset]?.trim()) currentPreset = 'debut';
    const sliders = mountSliders(root);
    window.PilamiStrudelVisuals.mount(root);
    window.addEventListener('pilami-hydra-error',event=> { if (activeRoot===root) setStatus(root,'Erreur Hydra : '+event.detail.message,true); });
    function selectPreset(name) {
      currentPreset = name;
      code.value = presets[name]?.trim() ? presets[name] : PRESETS.debut;
      root.dispatchEvent(new Event('pilami-code-change'));
      buttons.forEach(button => {
        const selected = button.dataset.preset === name;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      root.querySelectorAll('[data-preset-section]').forEach(section => section.querySelector('[data-section-toggle]').classList.toggle('is-active', !!section.querySelector('[data-preset].is-active')));
      setStatus(root, 'Preset chargé dans l’éditeur. Ctrl + Entrée pour l’appliquer.');
    }
    buttons.forEach(button => button.addEventListener('click', event => {
      event.preventDefault();
      selectPreset(button.dataset.preset);
      code.focus(); code.setSelectionRange(0,0); code.scrollTop = 0;
    }));
    selectPreset(currentPreset);
    const stop = () => {
      request++;
      if (engine) api().hush();
      window.PilamiStrudelHydra.cancelStrudel();
      window.PilamiStrudelInline.pause();
      window.PilamiStrudelVisuals.pause();
      if (tools) tools.finish();
      setStatus(root, 'Arrêté.');
    };
    const play = async () => {
      const ticket = ++request;
      const source = code.value;
      try {
        if (!source.trim()) throw new Error('Écris un pattern avant de lancer la lecture.');
        playButton.disabled = true;
        setStatus(root, 'Préparation audio…');
        // Resume directly in the user gesture, including touch and keyboard.
        const audioReady = api() ? api().initAudio() : Promise.resolve();
        await Promise.all([ensureStrudel(root), audioReady]);
        if (ticket !== request) return;
        setStatus(root, 'Chargement des instruments…');
        await window.PilamiStrudelGM.prepare(source);
        if (ticket !== request) return;
        activeRoot = root;
        window.PilamiStrudelVisuals.activate(root);
        window.PilamiStrudelVisuals.clear();
        window.PilamiStrudelHydra.before(root,source);
        window.PilamiStrudelInline.begin(root);
        sliders.begin(source);
        await api().evaluate(source);
        if (ticket !== request) { api().hush(); window.PilamiStrudelHydra.cancelStrudel(); return; }
        if (engine.state.evalError) throw engine.state.evalError;
        window.PilamiStrudelHydra.resumeStrudel();
        window.PilamiStrudelInline.resume();
        window.PilamiStrudelVisuals.resume();
        sliders.render(engine.state.widgets || []);
        applyVolume();
        setStatus(root, 'En lecture. Modifie le code puis clique sur Update.');
        return true;
      } catch (error) {
        if (ticket === request) {
          if (engine) api().hush();
          window.PilamiStrudelHydra.pauseStrudel();
          window.PilamiStrudelInline.clear();
          window.PilamiStrudelVisuals.pause();
          setStatus(root, 'Erreur : ' + error.message, true);
        }
      } finally { playButton.disabled = false; }
    };
    playButton.addEventListener('click', play);
    root.querySelector('[data-action="stop"]').addEventListener('click', stop);
    root.querySelector('[data-action="reset"]').addEventListener('click', () => {
      selectPreset(currentPreset);
      setStatus(root, 'Exemple réinitialisé.');
    });
    volume.addEventListener('input', () => {
      masterVolume = Number(volume.value) / 100;
      document.querySelectorAll('[data-pilami-strudel]').forEach(lab => {
        lab.querySelector('[data-volume]').value = volume.value;
        lab.querySelector('[data-volume-value]').textContent = volume.value + ' %';
      });
      applyVolume();
    });
    code.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault(); if (!playButton.disabled) play();
      } else if (event.altKey && event.key === '.') {
        event.preventDefault(); stop();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        code.setRangeText('  ', code.selectionStart, code.selectionEnd, 'end');
        code.dispatchEvent(new Event('input', {bubbles:true}));
      }
    });
    tools = window.PilamiStrudelTools.mount(root, {stop, play, prepare: async () => {
      const audioReady = api() ? api().initAudio() : Promise.resolve();
      await Promise.all([ensureStrudel(root), audioReady]);
      await window.PilamiStrudelGM.prepare(code.value);
      await window.PilamiStrudelHydra.prepare(root,code.value);
    }});
    const hydraSpace = window.PilamiHydraWorkspace.mount(root);
    if (window.PilamiHydraWorkspace.isVisual(code.value)) {
      hydraSpace.set(code.value,root.querySelector('[data-save-name]').value);
      root.querySelector('[data-save-name]').value='';
      selectPreset('debut');
    }
    window.PilamiStrudelShare.mount(root, {stop, selectPreset, presets, hydraSpace});
    window.PilamiDetachable.mount(root);
    const initialRequest = request;
    ensureStrudel(root).then(() => {
      if (request === initialRequest) setStatus(root, 'Prêt.');
    }).catch(error => setStatus(root, 'Erreur : ' + error.message, true));
  }
  const boot = () => document.querySelectorAll('[data-pilami-strudel]').forEach(initLab);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('pagehide', () => { request++; if (engine) api().hush(); });
})();
