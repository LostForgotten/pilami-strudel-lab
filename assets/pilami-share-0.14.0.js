(function () {
  'use strict';
  const MAX_LEGACY_LINK = 100000;
  const validID = id => typeof id === 'string' && /^[a-f0-9]{24}$/.test(id);
  function validate(data) {
    if (data?.v===2) {
      if (!['strudel','hydra','duo'].includes(data.mode)) throw new Error('Le partage est invalide.');
      if (data.mode!=='hydra') validate({...data.strudel,v:1});
      if (data.mode!=='strudel') validate({...data.hydra,v:1,volume:0});
      return data;
    }
    if (!data || data.v !== 1 || typeof data.code !== 'string' || !data.code.trim() || data.code.includes('\0') || typeof data.name !== 'string' || new TextEncoder().encode(data.name).length > 400 || !Number.isFinite(data.volume) || data.volume < 0 || data.volume > 100) throw new Error('Le morceau partagé est invalide.');
    return data;
  }
  function unpack(value) {
    if (!value || value.length > MAX_LEGACY_LINK || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Le lien est incomplet ou invalide.');
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    return validate(JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(Uint8Array.from(binary, c => c.charCodeAt(0)))));
  }
  function mount(root, hooks) {
    const $ = selector => root.querySelector(selector);
    const code = $('[data-code]'), name = $('[data-save-name]'), volume = $('[data-volume]');
    const button = $('[data-action="copy-link"]'), status = $('[data-share-status]');
    const shareButtons=[button,$('[data-action="copy-hydra-link"]'),$('[data-action="copy-duo-link"]')];
    const hydraSpace=hooks.hydraSpace;
    const field = $('[data-share-link]'), result = $('[data-share-result]');
    const apiURL = new URL(root.dataset.shareApi, location.href);
    const definitions = JSON.parse($('[data-preset-config]')?.textContent || '{}');
    const title = key => (definitions[key]?.label || Array.from(root.querySelectorAll('[data-preset]')).find(b => b.dataset.preset === key)?.textContent || 'Morceau partagé').trim().slice(0,100);
    const say = (text, error = false) => {status.textContent = text;status.classList.toggle('is-error', error);};
    let loading = null, generation = 0, applying = false, lastSnapshot = '', lastLink = '';
    // Handle WordPress both with pretty REST URLs and with ?rest_route=....
    function endpoint(id) {
      const url = new URL(apiURL);
      if (id) {
        if (url.searchParams.has('rest_route')) url.searchParams.set('rest_route', url.searchParams.get('rest_route').replace(/\/$/, '')+'/'+id);
        else url.pathname = url.pathname.replace(/\/$/, '')+'/'+id;
      }
      return url.href;
    }
    async function request(url, options = {}, controller = new AbortController()) {
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(url, {...options, credentials:'omit', cache:'no-store', signal:controller.signal});
        let data;
        try {data = await response.json();}
        catch (_) {throw new Error('Le serveur n’a pas répondu correctement. Réessaie.');}
        if (!response.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'Le partage est indisponible. Réessaie.');
        return data;
      } catch (error) {
        if (error.name === 'AbortError') throw new Error('Le serveur met trop de temps à répondre. Réessaie.');
        throw error;
      } finally {clearTimeout(timer);}
    }
    function cancelLoading() {
      if (applying) return;
      generation++;
      if (loading) {loading.abort();loading = null;say('Chargement du partage annulé pour conserver tes modifications.');}
    }
    function apply(data, key) {
      applying = true;
      try {
        if(data.v===1){
          const visual=window.PilamiHydraWorkspace.isVisual(data.code);
          data={v:2,mode:visual?'hydra':'strudel',strudel:visual?null:{code:data.code,name:data.name,volume:data.volume},hydra:visual?{code:data.code,name:data.name}:null};
        }
        if(data.mode!=='hydra'){
          hooks.stop();
          if(key) hooks.selectPreset(key);
          else {
            code.value=data.strudel.code;
            root.querySelectorAll('[data-preset]').forEach(b=>{b.classList.remove('is-active');b.setAttribute('aria-pressed','false');});
            root.querySelectorAll('[data-section-toggle]').forEach(b=>b.classList.remove('is-active'));
          }
          name.value=data.strudel.name;volume.value=String(data.strudel.volume);
          volume.dispatchEvent(new Event('input',{bubbles:true}));
          code.dispatchEvent(new Event('input',{bubbles:true}));
          root.dispatchEvent(new Event('pilami-code-change'));
        }
        if(data.mode!=='strudel')hydraSpace.set(data.hydra.code,data.hydra.name);
        say(data.mode==='duo'?'Musique et visuels chargés. Lance Strudel et Hydra avec leurs boutons.':data.mode==='hydra'?'Visuel chargé dans Hydra. Clique sur Hydra / Update.':'Morceau chargé dans Strudel. Clique sur Strudel / Update.');
      } finally {applying = false;}
    }
    async function loadLink() {
      if (loading) loading.abort();
      loading = null;
      const ticket = ++generation;
      const params = new URLSearchParams(location.hash.slice(1));
      const id = new URL(location.href).searchParams.get('partage');
      try {
        // Explicit legacy fragments still take priority when a URL has both formats.
        if (params.has('pilami')) {apply(unpack(params.get('pilami')));return;}
        if (params.has('preset')) {
          const key = params.get('preset');
          if (!Object.hasOwn(hooks.presets, key) || !hooks.presets[key]?.trim()) throw new Error('Ce preset est introuvable sur cette page.');
          apply(validate({v:1, code:hooks.presets[key], name:title(key), volume:params.has('volume') ? Number(params.get('volume')) : Number(volume.value)}), key);
          return;
        }
        if (id === null) return;
        if (!validID(id)) throw new Error('Le lien de partage est invalide.');
        say('Chargement du morceau partagé…');
        const controller = new AbortController();loading = controller;
        const data = validate(await request(endpoint(id), {}, controller));
        if (ticket !== generation) return;
        loading = null;apply(data);
      } catch (error) {
        if (ticket !== generation) return;
        loading = null;say('Impossible de charger le lien : '+error.message, true);
      }
    }
    function snapshot(mode) {
      const key=$('[data-preset].is-active')?.dataset.preset;
      const data={v:2,mode,strudel:mode==='hydra'?null:{code:code.value,name:(name.value.trim()||(key?title(key):'Morceau partagé')).slice(0,100),volume:Number(volume.value)},hydra:mode==='strudel'?null:hydraSpace.get()};
      validate(data);
      for(const part of [data.strudel,data.hydra])if(part&&new TextEncoder().encode(part.code).length>65536)throw new Error('Le code dépasse 64 Ko. Utilise « Exporter » pour le partager.');
      return data;
    }
    async function copy(mode) {
      if(shareButtons.some(b=>b.disabled))return;
      try {
        if(loading)throw new Error('Attends la fin du chargement du partage.');
        const serialized=JSON.stringify(snapshot(mode));
        shareButtons.forEach(b=>b.disabled=true);result.hidden=true;say('Création du lien court…');
        let link=lastLink;
        if(serialized!==lastSnapshot||!link){
          const saved=await request(endpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:serialized});
          if(!validID(saved?.id))throw new Error('Le serveur n’a pas renvoyé de lien valide.');
          const url=new URL(location.href);url.hash='';url.searchParams.set('partage',saved.id);
          link=url.href;lastSnapshot=serialized;lastLink=link;
        }
        field.value=link;result.hidden=false;
        try {
          if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(link);say('Lien court copié ! Tu peux l’envoyer à tes amis.');
        }catch(_){field.focus();field.select();say('Le lien est sélectionné : copie-le avec Ctrl + C (Cmd + C sur Mac).');}
      }catch(error){say(error.message,true);}
      finally{shareButtons.forEach(b=>b.disabled=false);}
    }
    button.addEventListener('click',()=>copy('strudel'));
    $('[data-action="copy-hydra-link"]').addEventListener('click',()=>copy('hydra'));
    $('[data-action="copy-duo-link"]').addEventListener('click',()=>copy('duo'));
    field.addEventListener('click', () => field.select());
    if (document.querySelector('[data-pilami-strudel]') === root) {
      code.addEventListener('input', cancelLoading);
      name.addEventListener('input', cancelLoading);
      volume.addEventListener('input', cancelLoading);
      root.addEventListener('pilami-code-change', cancelLoading);
      root.addEventListener('pilami-hydra-code-change', cancelLoading);
      $('[data-hydra-code]').addEventListener('input', cancelLoading);
      $('[data-hydra-name]').addEventListener('input', cancelLoading);
      $('[data-hydra-action="play"]').addEventListener('click', cancelLoading);
      $('[data-hydra-code]').addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter')cancelLoading();});
      $('[data-action="play"]').addEventListener('click', cancelLoading);
      code.addEventListener('keydown', event => {if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') cancelLoading();});
      loadLink();
      window.addEventListener('hashchange', loadLink);
      window.addEventListener('popstate', loadLink);
    }
  }
  window.PilamiStrudelShare = {mount};
})();
