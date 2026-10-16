(function () {
  'use strict';
  const DEFAULT_KEY = 'pilami-hydra-essais-v1';
  const offlineTemplateURL = new URL('offline/pilami-hydra-vj.html',document.currentScript.src || location.href).href;
  const parser = window.acorn;
  const folded = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const generators = new Set(['osc','noise','voronoi','shape','gradient','solid','src','render']);
  function compile(source) {
    const tree = parser.parse(source, {ecmaVersion:'latest', allowAwaitOutsideFunction:true, locations:true});
    const sliders = [], replacements = [], bins=[], images=[];let hasInit=false, hasHydra=false, hasMusic=false, hasAudioMappings=false;
    function walk(node, label = '', ancestors = []) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') label = node.id.name;
      if(node.type==='CallExpression'){
        const method=node.callee.type==='Identifier'?node.callee.name:node.callee.type==='MemberExpression'&&!node.callee.computed?node.callee.property.name:'';
        if(method==='initHydra')hasInit=true;
        if(method==='imageSource'){
          hasHydra=true;
          if(node.arguments[0]?.type==='Identifier' && node.arguments[0].name==='s0' && node.arguments[1]?.type==='Literal' && typeof node.arguments[1].value==='string')images.push({url:node.arguments[1].value,from:node.arguments[1].start,to:node.arguments[1].end});
        }

        if(node.callee.type==='Identifier'&&method==='audioMod')hasAudioMappings=true;
        if(method==='initHydra'||generators.has(method)||method==='out')hasHydra=true;
        if(['s','sound','note','n','stack','setcps','setcpm','samples','pianoroll','_punchcard'].includes(method))hasMusic=true;
      }
      if(node.type==='CallExpression'&&node.callee.type==='MemberExpression'&&node.callee.object.name==='a'&&node.callee.property.name==='setBins'&&node.arguments[0]?.type==='Literal'&&Number.isInteger(node.arguments[0].value))bins.push({from:node.arguments[0].start,to:node.arguments[0].end,value:node.arguments[0].value});
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && ['slider','knob','fader','toggle'].includes(node.callee.name)) {
        const id = String(node.start), first = node.arguments[0];
        let body=node,index=ancestors.length-1;
        while(ancestors[index]?.type==='CallExpression'&&ancestors[index].callee.name==='H'&&ancestors[index].arguments[0]===body)body=ancestors[index--];
        const wrapper=ancestors[index]?.type==='CallExpression'&&ancestors[index].callee.name==='audioMod'&&ancestors[index].arguments[0]===body?ancestors[index]:null;
        sliders.push({id,kind:node.callee.name,label:label || 'Paramètre · ligne '+node.loc.start.line,from:first?.start,to:first?.end,args:node.arguments.map(arg=>({from:arg.start,to:arg.end})),callFrom:node.start,callTo:node.end,calleeFrom:node.callee.start,calleeTo:node.callee.end,replaceFrom:wrapper?.start??node.start,replaceTo:wrapper?.end??node.end,bodyFrom:wrapper?body.start:node.start,bodyTo:wrapper?body.end:node.end});
        replacements.push({from:node.callee.start,to:node.callee.end,text:'__pilamiControl.bind(null,'+JSON.stringify(node.callee.name)+','+JSON.stringify(id)+')'});
      }
      for (const [key,value] of Object.entries(node)) {
        if (key === 'loc') continue;
        if (Array.isArray(value)) value.forEach(child=>walk(child,label,[...ancestors,node]));
        else if (value && typeof value === 'object' && value.type) walk(value,label,[...ancestors,node]);
      }
    }
    walk(tree);
    let output = source;
    replacements.sort((a,b)=>b.from-a.from).forEach(r=>{output=output.slice(0,r.from)+r.text+output.slice(r.to);});
    return {output, sliders, bins, images, hasInit, hasAudioMappings, isVisual:hasHydra&&!hasMusic};
  }
  function mount(root) {
    const KEY = root.dataset.hydraStorageKey || DEFAULT_KEY;
    const $ = selector => root.querySelector(selector);
    const editor = $('[data-hydra-code]'), name = $('[data-hydra-name]'), status = $('[data-hydra-status]');
    const panel = $('[data-hydra-sliders]'), sliderList = $('[data-hydra-slider-list]');
    const category = $('[data-hydra-category]'), search = $('[data-hydra-search]'), list = $('[data-hydra-presets]');
    const saved = $('[data-hydra-saved]'), playButton = $('[data-hydra-action="play"]');
    const catalog = JSON.parse($('[data-hydra-catalog]').textContent || '[]');
    const draftKey = location.pathname+':'+Array.from(document.querySelectorAll('[data-pilami-strudel]')).indexOf(root);
    let selected = '', selectedRevision = '', request = 0, writing = false;
    let editorSession = null, savingPreset = false, importingPreset = false, savingCategories = false, deletingPreset = false, categoryOptions = [], contentVersion = 0;
    const importButton = $('[data-hydra-action="import"]');
    const createButton = $('[data-hydra-action="create-preset"]');
    const updateButton = $('[data-hydra-action="update-preset"]');
    const deleteButton = $('[data-hydra-action="delete-preset"]') || (() => {
      const button=document.createElement('button');button.type='button';button.dataset.hydraAction='delete-preset';button.dataset.colorRole='stop';button.hidden=true;button.disabled=true;updateButton.after(button);return button;
    })();
    const offlineButton = $('[data-hydra-action="offline-export"]') || (()=>{
      const button=document.createElement('button');button.type='button';button.dataset.hydraAction='offline-export';button.textContent='↓ Pack VJ hors ligne';button.hidden=true;button.disabled=true;playButton.parentElement.append(button);return button;
    })();
    let exportingOffline=false;
    offlineButton.addEventListener('click',async()=>{
      if(!editorSession || exportingOffline || root.dataset.offline==='1')return;
      exportingOffline=true;offlineButton.disabled=true;
      say('Préparation du pack VJ autonome…');
      try{
        const data={version:'0.30.0',exportId:crypto.randomUUID(),catalog:catalog.map(({id,name,code,categories,category_colors})=>({id,name,code,categories,category_colors})),draft:{code:editor.value,name:name.value,presetId:selected},items:store().items,snapshots:window.PilamiHydraSnapshots?.exportBanks(KEY)};
        const response=await fetch(offlineTemplateURL,{credentials:'same-origin',cache:'no-store'});
        if(!response.ok)throw new Error('Le fichier autonome est inaccessible. Recharge la page après la mise à jour du plugin.');
        const template=await response.text(),marker='{"__pilamiOfflinePlaceholder":true}';
        if(!template.includes(marker))throw new Error('Le modèle du pack VJ est invalide.');
        const json=JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
        const html=template.replace(marker,()=>json),blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
        link.href=url;link.download='Pilami-Hydra-VJ-'+new Date().toISOString().slice(0,10)+'.html';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
        say('Pack VJ téléchargé : ouvre le fichier HTML sur ton ordinateur. Presets, brouillon et essais locaux inclus ; images distantes et autres bibliothèques externes à préparer séparément.');
      }catch(error){say('Export VJ : '+error.message,true);}
      finally{exportingOffline=false;offlineButton.disabled=!editorSession;}
    });
    const presetNote = $('[data-hydra-preset-note]');
    const categoryPanel = $('[data-hydra-preset-categories]'), categoryFields = $('[data-hydra-category-fields]');
    const categoryChoices = $('[data-hydra-category-choices]'), categoryHelp = $('[data-hydra-category-help]');
    const categorySave = $('[data-hydra-action="save-categories"]');
    const categoryIds = () => [...categoryChoices.querySelectorAll('input:checked')].map(input=>Number(input.value)).sort((a,b)=>a-b);
    const validIds = ids => Array.isArray(ids) && ids.every(id=>Number.isSafeInteger(id) && id > 0) && new Set(ids).size === ids.length;
    function acceptCategoryOptions(options) {
      if (Array.isArray(options)) categoryOptions = options.filter(option=>Number.isSafeInteger(option.id) && option.id>0 && typeof option.name==='string');
    }
    function rebuildCategoryFilter() {
      const previous = category.value;
      category.replaceChildren(new Option('Toutes les catégories', ''));
      [...new Set([...catalog.flatMap(item=>item.categories), ...categoryOptions.map(option=>option.name)])].sort((a,b)=>a.localeCompare(b,'fr')).forEach(label=>category.add(new Option(label,label)));
      category.value = previous;
      if (category.selectedIndex < 0) category.value = '';
    }
    function refreshCategoryEditor(item) {
      categoryPanel.hidden = !editorSession;
      const editable = item && validIds(item.category_ids) && /^[a-f0-9]{64}$/.test(item.category_revision);
      const key = JSON.stringify([item?.id, item?.category_revision, categoryOptions]);
      if (categoryChoices.dataset.key !== key) {
        categoryChoices.dataset.key = key; categoryChoices.replaceChildren();
        categoryOptions.forEach(option=>{
          const label=document.createElement('label'), input=document.createElement('input'), caption=document.createElement('span');
          input.type='checkbox'; input.value=String(option.id); input.dataset.hydraCategoryId=String(option.id);
          input.checked=Boolean(item?.category_ids?.includes(option.id)); caption.textContent=option.name;
          label.append(input,caption); categoryChoices.append(label);
        });
      }
      const unknown = editable && item.category_ids.some(id=>!categoryOptions.some(option=>option.id===id));
      categoryFields.disabled = !editorSession || !editable || unknown || savingPreset || importingPreset || savingCategories || deletingPreset;
      categorySave.disabled = categoryFields.disabled || JSON.stringify(categoryIds())===JSON.stringify(item?.category_ids);
      categorySave.textContent = savingCategories ? 'Enregistrement…' : 'Enregistrer les catégories';
      categoryHelp.textContent = !item ? 'Choisis un preset de la bibliothèque.'
        : !editable || unknown ? 'Les catégories ne sont pas disponibles. Recharge la page avant de réessayer.'
        : 'Preset : « '+item.name+' » · Plusieurs catégories possibles. Décoche tout pour « Sans catégorie ».';
    }
    categoryChoices.addEventListener('change', refreshPresetUpdate);
    categorySave.addEventListener('click', async () => {
      const item = catalog.find(entry=>entry.id===selected);
      if (!editorSession || !item || categorySave.disabled) return;
      const ids=categoryIds(), revision=item.category_revision;
      savingCategories=true; refreshPresetUpdate(); say('Enregistrement des catégories…');
      try {
        const response=await fetch(editorSession.api+'/'+encodeURIComponent(item.id)+'/categories', {
          method:'POST', credentials:'same-origin', cache:'no-store',
          headers:{'Content-Type':'application/json','X-WP-Nonce':editorSession.nonce},
          body:JSON.stringify({category_ids:ids, category_revision:revision})
        });
        const result=await response.json();
        if (!response.ok) {
          if (response.status===401 || response.status===403) throw new Error('Ta session WordPress a expiré. Reconnecte-toi et recharge la page ; ton brouillon est conservé.');
          throw new Error(result.message || 'Impossible d’enregistrer les catégories.');
        }
        if (result.id!==item.id || !validIds(result.category_ids) || JSON.stringify(result.category_ids)!==JSON.stringify(ids) || !/^[a-f0-9]{64}$/.test(result.category_revision) || !Array.isArray(result.categories) || !result.categories.every(label=>typeof label==='string')) throw new Error('La réponse d’enregistrement des catégories est invalide.');
        // Keep editor drafts, the code revision and live controllers untouched.
        item.category_ids=result.category_ids; item.category_revision=result.category_revision;
        item.categories=result.categories; item.category_colors=result.category_colors;
        acceptCategoryOptions(result.category_options); rebuildCategoryFilter();
        if (selected===item.id && category.value && !item.categories.includes(category.value)) category.value=item.categories[0] || '';
        renderCatalog(); say('Catégories du preset « '+item.name+' » enregistrées.');
      } catch(error) { say(error.message,true); }
      finally { savingCategories=false; refreshPresetUpdate(); }
    });
    const say = (text,error=false)=>{status.textContent=text;status.classList.toggle('is-error',error);};
    const imageDescriptor = () => {try{return compile(editor.value).images[0] || null;}catch(_){return null;}};
    const imageView = window.PilamiHydraImages.mount(root,{
      getCode:()=>editor.value, getKey:()=>selected || 'draft', getDescriptor:imageDescriptor,
      writeURL:(url,expected)=>{
        if(editor.value!==expected)return false;
        const descriptor=imageDescriptor();if(!descriptor)return false;
        const source=editor.value.slice(0,descriptor.from)+JSON.stringify(url)+editor.value.slice(descriptor.to);
        if(new TextEncoder().encode(source).length>65536)throw new Error('Le script dépasse 64 Ko.');
        editor.value=source;editor.dispatchEvent(new Event('input',{bubbles:true}));return true;
      }
    });
    root._pilamiHydraImages=imageView;

    function refreshPresetUpdate() {
      const item = catalog.find(i => i.id === selected);
      offlineButton.hidden = !editorSession || root.dataset.offline==='1';
      offlineButton.disabled = !editorSession || exportingOffline;
      createButton.hidden = !editorSession;
      createButton.disabled = !editorSession || savingPreset || importingPreset || savingCategories || deletingPreset || !name.value.trim() || !editor.value.trim();
      createButton.textContent = importingPreset ? 'Enregistrement…' : '＋ Créer un preset WordPress';
      updateButton.hidden = !editorSession;
      updateButton.disabled = !editorSession || !item || !selectedRevision || savingPreset || importingPreset || savingCategories || deletingPreset || (editor.value === item.code && name.value.trim() === item.name);
      updateButton.textContent = savingPreset ? 'Enregistrement…' : '💾 Mettre à jour le preset';
      deleteButton.hidden = !editorSession;
      deleteButton.disabled = !editorSession || !item || !/^[a-f0-9]{64}$/.test(selectedRevision) || !/^[a-f0-9]{64}$/.test(item.category_revision) || savingPreset || importingPreset || savingCategories || deletingPreset;
      deleteButton.textContent = deletingPreset ? 'Suppression…' : '🗑 Supprimer le preset';
      presetNote.hidden = !editorSession;
      presetNote.textContent = item
        ? 'Preset : « ' + item.name + ' »' + ((editor.value !== item.code || name.value.trim() !== item.name) ? ' · Modifications non enregistrées.' : ' · Enregistré.')
        : 'Choisis un preset de la bibliothèque pour le mettre à jour.';
      importButton.disabled = savingPreset || importingPreset || savingCategories || deletingPreset;
      refreshCategoryEditor(item);
      imageView.setSession(editorSession);
      root.dispatchEvent(new Event('pilami-hydra-preset-state'));
    }
    async function loadEditorSession() {
      const endpoint = root.querySelector('[data-hydra-space]').dataset.hydraEditorSession;
      if (!endpoint) return false;
      let resolved = false;
      try {
        const url = new URL(endpoint, location.href);
        url.searchParams.set('action', 'pilami_hydra_editor_session');
        url.searchParams.set('_', String(Date.now()));
        const response = await fetch(url, {credentials: 'same-origin', cache: 'no-store'});
        const result = await response.json();
        resolved = response.ok && result.success === true;
        if (resolved && result.data?.allowed) acceptCategoryOptions(result.data.category_options);
        if (resolved && Array.isArray(result.data?.catalog)) {
          const before = catalog.find(i => i.id === selected);
          const untouched = before && editor.value === before.code && name.value.trim() === before.name;
          catalog.splice(0, catalog.length, ...result.data.catalog);
          const current = catalog.find(i => i.id === selected);
          if (untouched && current) {
            selectedRevision = current.revision; setCode(current.code, current.name, false);
          } else if (selected && !current) { selected = ''; selectedRevision = ''; persist(); }
          else if (current && name.value.trim() === current.name && selectedRevision !== current.revision && window.crypto?.subtle) {
            // Upgrade a pre-0.21 draft's code-only revision without losing edited code.
            const previousRevision = selectedRevision;
            const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(current.code));
            const legacyRevision = [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
            if (legacyRevision === previousRevision && selected === current.id && selectedRevision === previousRevision && name.value.trim() === current.name) { selectedRevision = current.revision; persist(); }
          }
          rebuildCategoryFilter();
          renderCatalog();
        }
        editorSession = response.ok && result.success && result.data?.allowed ? result.data : null;
      } catch (_) { editorSession = null; resolved = false; }
      refreshPresetUpdate();
      return resolved;
    }
    async function updatePreset() {
      const item = catalog.find(i => i.id === selected);
      if (!editorSession || !item || savingPreset || importingPreset || savingCategories || deletingPreset) return;
      const source = editor.value, revision = selectedRevision, title = name.value.trim(), nameAtSave = name.value;
      try {
        if (!source.trim() || new TextEncoder().encode(source).length > 65536 || source.includes('\0')) throw new Error('Le code est vide, invalide ou dépasse 64 Ko.');
        if (!title || new TextEncoder().encode(title).length > 400 || title.includes('\0')) throw new Error('Donne un nom au preset (100 caractères maximum).');
        if (source !== item.code) compile(source); // A rename never runs or changes the visual.
        savingPreset = true; refreshPresetUpdate();
        say('Enregistrement du preset « ' + item.name + ' »…');
        const response = await fetch(editorSession.api + '/' + encodeURIComponent(item.id), {
          method: 'POST', credentials: 'same-origin', cache: 'no-store',
          headers: {'Content-Type': 'application/json', 'X-WP-Nonce': editorSession.nonce},
          body: JSON.stringify({code: source, name: title, revision})
        });
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) throw new Error('Ta session WordPress a expiré ou ne permet pas cette modification. Reconnecte-toi et recharge la page ; ton brouillon est conservé.');
          throw new Error(result.message || 'Impossible d’enregistrer le preset.');
        }
        if (result.id !== item.id || result.code !== source || typeof result.revision !== 'string' || typeof result.name !== 'string') throw new Error('La réponse d’enregistrement est invalide.');
        item.code = result.code; item.revision = result.revision; item.name = result.name;
        if (selected === item.id && name.value === nameAtSave) name.value = result.name;
        if (selected === item.id && selectedRevision === revision) selectedRevision = result.revision;
        persist(); renderCatalog();
        if (selected === item.id) say('Preset « ' + item.name + ' » mis à jour.' + ((editor.value !== source || name.value.trim() !== result.name) ? ' Des modifications plus récentes restent à enregistrer.' : ''));
      } catch (error) { say(error.message, true); }
      finally { savingPreset = false; refreshPresetUpdate(); }
    }
    updateButton.addEventListener('click', updatePreset);
    deleteButton.addEventListener('click', async () => {
      const item=catalog.find(entry=>entry.id===selected);
      if (!editorSession || !item || deleteButton.disabled || deletingPreset) return;
      const revision=selectedRevision, categoryRevision=item.category_revision;
      if (!window.confirm('Supprimer le preset « '+item.name+' » de la bibliothèque ?\n\nIl sera placé dans la corbeille WordPress. Le code affiché et les visuels en cours seront conservés.')) return;
      deletingPreset=true; refreshPresetUpdate(); say('Suppression du preset « '+item.name+' »…');
      try {
        const response=await fetch(editorSession.api+'/'+encodeURIComponent(item.id), {
          method:'DELETE', credentials:'same-origin', cache:'no-store',
          headers:{'Content-Type':'application/json','X-WP-Nonce':editorSession.nonce},
          body:JSON.stringify({revision, category_revision:categoryRevision})
        });
        const result=await response.json();
        if (!response.ok) {
          if (response.status===401 || response.status===403) throw new Error('Ta session WordPress a expiré ou ne permet pas cette suppression. Reconnecte-toi et recharge la page ; ton brouillon est conservé.');
          throw new Error(result.message || 'Impossible de supprimer le preset.');
        }
        if (result.id!==item.id || result.trashed!==true) throw new Error('La réponse de suppression est invalide.');
        const index=catalog.findIndex(entry=>entry.id===item.id);
        if (index>=0) catalog.splice(index,1);
        if (selected===item.id) { selected=''; selectedRevision=''; }
        persist(); rebuildCategoryFilter(); renderCatalog();
        say('Preset « '+item.name+' » placé dans la corbeille WordPress. Le code et les visuels en cours sont conservés.');
      } catch(error) { say(error.message,true); }
      finally { deletingPreset=false; refreshPresetUpdate(); }
    });
    async function createWordPressPreset(text, title, version) {
      const response = await fetch(editorSession.api, {
        method:'POST', credentials:'same-origin', cache:'no-store',
        headers:{'Content-Type':'application/json','X-WP-Nonce':editorSession.nonce},
        body:JSON.stringify({name:title, code:text})
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error('Ta session WordPress a expiré ou ne permet pas cet enregistrement. Reconnecte-toi ; ton brouillon est conservé.');
        throw new Error(result.message || 'Impossible de créer le preset dans WordPress.');
      }
      if (!/^[1-9][0-9]*$/.test(result.id) || result.code !== text || !/^[a-f0-9]{64}$/.test(result.revision) || typeof result.name !== 'string' || !Array.isArray(result.categories)) throw new Error('La réponse d’enregistrement est invalide.');
      const existing = catalog.find(i => i.id === result.id);
      if (existing) Object.assign(existing, result); else catalog.push(result);
      acceptCategoryOptions(result.category_options); rebuildCategoryFilter();
      if (contentVersion === version) {
        selected = result.id; selectedRevision = result.revision;
        if (name.value.trim() === title) name.value = result.name;
        category.value = result.categories[0] || ''; search.value = '';
        persist();
      }
      renderCatalog();
      say('Preset « ' + result.name + ' » ' + (result.created ? 'ajouté à WordPress.' : 'déjà présent dans WordPress.')
        + (contentVersion === version && (editor.value !== text || name.value.trim() !== result.name) ? ' Tes nouvelles modifications restent à enregistrer.' : ''));
      return result;
    }
    createButton.addEventListener('click', async () => {
      if (!editorSession || importingPreset || savingPreset || savingCategories || deletingPreset) return;
      const text = editor.value, title = name.value.trim(), version = contentVersion;
      try {
        if (!title || new TextEncoder().encode(title).length > 400 || title.includes('\0')) throw new Error('Donne un nom au preset (100 caractères maximum).');
        if (!text.trim() || new TextEncoder().encode(text).length > 65536 || text.includes('\0')) throw new Error('Le code est vide, invalide ou dépasse 64 Ko.');
        compile(text); // Validate only: saving never plays the code.
        importingPreset = true; refreshPresetUpdate(); importButton.disabled = true;
        say('Création du preset dans WordPress…');
        await createWordPressPreset(text, title, version);
      } catch (error) { say(error.message, true); }
      finally { importingPreset = false; importButton.disabled = false; refreshPresetUpdate(); }
    });

    let controls=null,controlView=null;
    const clearSliders = ()=>{imageView.end();controls?.dispose();controls=null;root._pilamiHydraControls=null;controlView?.dispose();controlView=window.PilamiHydraControls.mount(sliderList,root,null);panel.hidden=false;root.dispatchEvent(new Event('pilami-hydra-controllers-change'));};
    function store() {
      const data = JSON.parse(localStorage.getItem(KEY) || '{"items":[],"drafts":{}}');
      if (!data || !Array.isArray(data.items) || !data.drafts || typeof data.drafts !== 'object') throw new Error('Les essais Hydra sont illisibles.');
      return data;
    }
    function persist() {
      try {const data=store();data.drafts[draftKey]={code:editor.value,name:name.value,presetId:selected,presetRevision:selectedRevision};localStorage.setItem(KEY,JSON.stringify(data));}
      catch (error) {say('Sauvegarde du brouillon indisponible : '+error.message,true);}
      refreshPresetUpdate();
    }
    function refreshSaved() {
      try {
        const previous=saved.value;saved.replaceChildren(new Option('Choisir un essai…',''));
        store().items.slice().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).forEach(item=>saved.add(new Option(item.name,item.id)));
        saved.value=previous;
      } catch(error) {say(error.message,true);}
    }
    function categoryColor(item, name) {
      const color = item?.category_colors?.[name];
      return typeof color === 'string' && /^#[a-f0-9]{3}(?:[a-f0-9]{3})?$/i.test(color) ? color : '';
    }
    function renderCatalog() {
      const filteredItem = catalog.find(item => item.categories.includes(category.value));
      const filterColor = categoryColor(filteredItem, category.value);
      if (filterColor) category.style.setProperty('--pilami-category-color',filterColor); else category.style.removeProperty('--pilami-category-color');
      const term=folded(search.value.trim());
      const items=catalog.filter(item=>(!category.value || item.categories.includes(category.value)) && (!term || folded(item.name+' '+item.categories.join(' ')).includes(term)));
      list.replaceChildren();
      items.forEach(item=> {
        const button=document.createElement('button');button.type='button';button.dataset.hydraPreset=item.id;
        const color = categoryColor(item, category.value || item.categories[0]);
        if (color) button.style.setProperty('--pilami-category-color',color);
        button.textContent=item.name;button.title=item.categories.join(' · ');button.classList.toggle('is-active',item.id===selected);button.setAttribute('aria-pressed',String(item.id===selected));
        button.addEventListener('click',()=>{selected=item.id;selectedRevision=item.revision;setCode(item.code,item.name,false);renderCatalog();editor.focus();editor.setSelectionRange(0,0);editor.scrollTop=0;say('Preset Hydra chargé. Ctrl + Entrée pour l’appliquer.');});
        list.append(button);
      });
      $('[data-hydra-count]').textContent=items.length+' preset'+(items.length===1?'':'s')+' · '+catalog.length+' dans la bibliothèque';
      if (!items.length) {const empty=document.createElement('p');empty.textContent='Aucun preset dans cette sélection.';list.append(empty);}
    }
    [...new Set(catalog.flatMap(item=>item.categories))].sort((a,b)=>a.localeCompare(b,'fr')).forEach(c=>category.add(new Option(c,c)));
    category.addEventListener('change',renderCatalog);search.addEventListener('input',renderCatalog);
    function stop() {request++;controls?.snapshots?.stop();imageView.end();window.PilamiStrudelHydra.cancel();say('Hydra arrêté.');}
    function setCode(source,title='',pause=true) {
      if (pause) stop();
      contentVersion++;
      editor.value=source;name.value=title;clearSliders();persist();
      root.dispatchEvent(new Event('pilami-hydra-code-change'));
    }
    async function play() {
      const ticket=++request, source=editor.value;
      try {
        if (!source.trim()) throw new Error('Charge un preset ou écris du code Hydra.');
        if (new TextEncoder().encode(source).length>65536) throw new Error('Le code Hydra dépasse 64 Ko.');
        const parsed=compile(source), entries=new Map(), controlFunctions=new WeakMap(), pairs=[];let expected=source, instance;
        playButton.disabled=true;clearSliders();say('Préparation des visuels…');
        window.PilamiStrudelHydra.pause();window.PilamiStrudelVisuals.activate(root);
        const check=()=>{if(ticket!==request)throw new Error('Exécution Hydra annulée.');};
        const loadExtension=async extension=>{
          check();if(!instance)throw new Error('Appelle initHydra avant de charger une extension.');
          const result=window.PilamiHydraExtensions.load(extension,definition=>{check();generators.add(definition.name);window.PilamiStrudelHydra.defineStandalone(definition);});
          check();return result;
        };
        const local={
          loadHydraExtension:loadExtension,
          loadScript:async url=>{
            check();const extension=window.PilamiHydraExtensions.identify(url);
            if(extension)return loadExtension(extension);
            if(root.dataset.offline==='1')throw new Error('Cette bibliothèque externe n’est pas incluse dans le pack hors ligne : '+url);
            if(typeof window.loadScript!=='function')throw new Error('Initialise Hydra avant de charger une bibliothèque externe.');
            const result=await window.loadScript(url);check();return result;
          },
          initHydra:async(options={})=>{check();instance=await window.PilamiStrudelHydra.initStandalone(root,parsed.hasAudioMappings?{...options,detectAudio:true}:options);check();return instance;},
          imageSource:(input,url)=>{check();return imageView.load(input,url,check);},
          clearHydra:()=>{check();window.PilamiStrudelHydra.clear();},
          hush:()=>{check();instance?.hush();},
          H:input=>typeof input==='function'?input:()=>{if(input?.queryArc)return input.queryArc(window.strudel.getTime(),window.strudel.getTime())[0]?.value??0;return Number(input)||0;},
          __pilamiControl:(kind,id,initial=.5,min=0,max=1,step)=>{
            if(kind==='toggle'){initial=initial?1:0;min=0;max=1;step=1;}
            check();if(![initial,min,max].every(v=>Number.isFinite(Number(v))) || Number(min)>=Number(max))throw new Error('slider : nombres et min < max requis.');
            let entry=entries.get(id);
            if(!entry){const increment=Number.isFinite(Number(step))&&Number(step)>0?Number(step):'any';entry={id,kind,value:Math.max(Number(min),Math.min(Number(max),Number(initial))),min:Number(min),max:Number(max),step:increment,sliderStep:increment,audio:null};entry.get=()=>window.PilamiHydraControls.value(entry);entries.set(id,entry);controlFunctions.set(entry.get,entry);}
            return entry.get;
          },
          audioMod:(control,options)=>{check();const entry=controlFunctions.get(control);if(!entry)throw new Error('audioMod attend un slider, knob, fader ou toggle.');entry.audio=window.PilamiHydraControls.validateAudio(options);return control;},
          xyPad:(title,x,y)=>{check();const xEntry=controlFunctions.get(x),yEntry=controlFunctions.get(y);if(!xEntry||!yEntry||xEntry===yEntry)throw new Error('xyPad attend deux contrôleurs distincts.');pairs.push({title:String(title),x:xEntry,y:yEntry});},
          setFunction:definition=>{check();generators.add(definition.name);return window.PilamiStrudelHydra.defineStandalone(definition);}
        };
        const scope=new Proxy(local,{
          has(target,key){return key!==Symbol.unscopables && (key in target || key in window);},
          get(target,key){
            if(key===Symbol.unscopables)return undefined;
            if(key in target)return target[key];
            const value=window[key];
            if(generators.has(key) && typeof value==='function')return(...args)=>{check();return value.apply(window,args);};
            return value;
          },
          set(target,key,value){if(instance && ['speed','bpm','fps','update'].includes(key)){window[key]=value;instance.synth[key]=value;}else target[key]=value;return true;}
        });
        // Hydra code is ordinary JavaScript: quotes and GLSL templates stay intact.
        if (!parsed.hasInit) await local.initHydra();
        const evaluate=new AsyncFunction('__scope','with (__scope) {\n'+parsed.output+'\n}');
        await evaluate(scope);check();
        for(const descriptor of parsed.sliders){const entry=entries.get(descriptor.id);if(entry)Object.assign(entry,descriptor,{kind:entry.kind,declaredKind:descriptor.kind});}
        const mapped=[...entries.values()].filter(e=>e.audio);
        if(mapped.length){await window.PilamiStrudelHydra.enableControlAudio(Math.max(...mapped.map(e=>e.audio.band)));check();}
        controls=window.PilamiHydraControls.create({source,parsed,entries:[...entries.values()],pairs,active:()=>editor.value===expected,
          write:changed=>{const start=editor.selectionStart,end=editor.selectionEnd,scroll=editor.scrollTop;editor.value=expected=changed;editor.setSelectionRange(Math.min(start,changed.length),Math.min(end,changed.length));editor.scrollTop=scroll;writing=true;editor.dispatchEvent(new Event('input',{bubbles:true}));writing=false;},
          say,snapshotContext:{storageKey:KEY,preset:selected?'preset:'+selected:'code'}});
        root._pilamiHydraControls=controls;controlView?.dispose();controlView=window.PilamiHydraControls.mount(sliderList,root,controls);panel.hidden=false;
        root.dispatchEvent(new Event('pilami-hydra-controllers-change'));window.PilamiStrudelHydra.resume();say(root.dataset.offline==='1'?'Hydra en lecture hors ligne.':'Hydra en lecture. La musique Strudel reste indépendante.');return true;
      } catch(error) {if(ticket===request){window.PilamiStrudelHydra.pause();say('Erreur Hydra : '+error.message,true);}}
      finally {playButton.disabled=false;}
    }
    playButton.addEventListener('click',play);$('[data-hydra-action="stop"]').addEventListener('click',stop);
    $('[data-hydra-action="reset"]').addEventListener('click',()=>{const item=catalog.find(i=>i.id===selected);if(item){selectedRevision=item.revision;setCode(item.code,item.name,false);say('Preset Hydra réinitialisé dans l’éditeur.');}else say('Choisis un preset Hydra pour le réinitialiser.');});
    editor.addEventListener('input',()=>{if(!writing)clearSliders();persist();});name.addEventListener('input',persist);
    editor.addEventListener('keydown',event=>{
      if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();if(!playButton.disabled)play();}
      else if(event.altKey&&event.key==='.'){event.preventDefault();stop();}
      else if(event.key==='Tab'){event.preventDefault();editor.setRangeText('  ',editor.selectionStart,editor.selectionEnd,'end');editor.dispatchEvent(new Event('input',{bubbles:true}));}
    });
    $('[data-hydra-action="save"]').addEventListener('click',()=>{
      try {
        const title=name.value.trim().slice(0,100);if(!title || !editor.value.trim())throw new Error('Donne un nom au visuel et ajoute son code.');
        const data=store();let item=data.items.find(i=>i.name===title);
        if(item&&!window.confirm('Remplacer l’essai Hydra « '+title+' » ?'))return;
        if(!item){item={id:crypto.randomUUID()};data.items.push(item);}
        Object.assign(item,{name:title,code:editor.value,updatedAt:new Date().toISOString()});localStorage.setItem(KEY,JSON.stringify(data));refreshSaved();saved.value=item.id;persist();say('Essai Hydra sauvegardé.');
      } catch(error){say(error.message,true);}
    });
    $('[data-hydra-action="load"]').addEventListener('click',()=>{try{const item=store().items.find(i=>i.id===saved.value);if(!item)throw new Error('Choisis un essai Hydra.');selected='';selectedRevision='';setCode(item.code,item.name);renderCatalog();say('Essai chargé. Clique sur Hydra / Update.');}catch(error){say(error.message,true);}});
    $('[data-hydra-action="delete"]').addEventListener('click',()=>{try{const data=store(),item=data.items.find(i=>i.id===saved.value);if(!item)return;if(!window.confirm('Supprimer l’essai Hydra « '+item.name+' » ?'))return;data.items=data.items.filter(i=>i.id!==item.id);localStorage.setItem(KEY,JSON.stringify(data));refreshSaved();say('Essai Hydra supprimé.');}catch(error){say(error.message,true);}});
    $('[data-hydra-action="export"]').addEventListener('click',()=>{
      const url=URL.createObjectURL(new Blob([editor.value],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');
      a.href=url;a.download=(name.value||'essai-hydra').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,80)+'.hydra.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);say('Code Hydra exporté en fichier texte.');
    });
    importButton.addEventListener('click',()=> $('[data-hydra-import]').click());
    $('[data-hydra-import]').addEventListener('change', async event => {
      if (importingPreset || savingPreset || savingCategories || deletingPreset) { event.target.value = ''; return; }
      let loaded = false;
      try {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 65536) throw new Error('Le fichier dépasse 64 Ko.');
        const text = await file.text();
        if (!text.trim() || text.includes('\0') || new TextEncoder().encode(text).length > 65536) throw new Error('Choisis un fichier texte Hydra valide de moins de 64 Ko.');
        if (!compile(text).isVisual) throw new Error('Choisis un fichier contenant du code Hydra.');
        importingPreset = true; importButton.disabled = true; refreshPresetUpdate();
        // Always refresh authentication; do not silently fall back after a network error.
        if (root.dataset.offline!=='1' && !await loadEditorSession()) throw new Error('Impossible de vérifier ta session WordPress. Réessaie l’import.');
        const title = file.name.replace(/(?:\.hydra)?\.(?:js|txt)$/i, '').slice(0, 100) || 'Preset importé';
        selected = ''; selectedRevision = ''; setCode(text, title, false); loaded = true;
        const version = contentVersion;
        renderCatalog();
        if (!editorSession) {
          say('Code Hydra importé dans ce navigateur. Clique sur Hydra / Update.');
          return;
        }
        say('Création du preset « ' + title + ' » dans WordPress…');
        await createWordPressPreset(text, title, version);
      } catch (error) {
        say(error.message + (loaded ? ' Le code importé reste dans l’éditeur et dans le brouillon.' : ''), true);
      } finally {
        importingPreset = false; importButton.disabled = false;
        event.target.value = ''; refreshPresetUpdate();
      }
    });
    const first=catalog.find(item=>item.name==='Ondes colorées') || catalog[0];
    if(first){selected=first.id;selectedRevision=first.revision;editor.value=first.code;name.value=first.name;}
    try {
      const oldKey='pilami-strudel-essais-v1',old=JSON.parse(localStorage.getItem(oldKey)||'null');
      const moving=old?.items?.filter(item=>typeof item.code==='string' && window.PilamiHydraWorkspace.isVisual(item.code))||[];
      if(moving.length){
        const data=store();moving.forEach(item=>{
          const existing=data.items.find(i=>i.id===item.id);
          if(!existing)data.items.push({...item});
          else if(existing.code!==item.code)data.items.push({...item,id:crypto.randomUUID(),name:item.name+' (ancien)'});
        });
        localStorage.setItem(KEY,JSON.stringify(data));
        old.items=old.items.filter(item=>!moving.includes(item));localStorage.setItem(oldKey,JSON.stringify(old));
        root.dispatchEvent(new Event('pilami-saves-migrated'));
      }
    }catch(error){say('Migration des essais Hydra indisponible : '+error.message,true);}
    try {const draft=store().drafts[draftKey];if(draft&&typeof draft.code==='string'&&new TextEncoder().encode(draft.code).length<=65536){editor.value=draft.code;name.value=typeof draft.name==='string'?draft.name:'';selected=catalog.some(i=>i.id===draft.presetId)?draft.presetId:'';selectedRevision=selected&&typeof draft.presetRevision==='string'?draft.presetRevision:'';say('Dernier brouillon Hydra restauré.');}}catch(error){say(error.message,true);}
    refreshSaved();renderCatalog();refreshPresetUpdate();loadEditorSession();
    if(!controlView)clearSliders();
    window.addEventListener('pilami-hydra-error',event=>{if(window.PilamiStrudelHydra.isDedicated())say('Erreur Hydra : '+event.detail.message,true);});
    window.addEventListener('storage',event=>{if(event.key===KEY)refreshSaved();});
    return {
      get:()=>({code:editor.value,name:name.value.trim().slice(0,100)}),
      set(source,title){selected='';selectedRevision='';setCode(source,title);renderCatalog();say('Visuel chargé. Clique sur Hydra / Update.');},
      stop,play
    };
  }
  window.PilamiHydraWorkspace={mount,compile,isVisual:source=>{try{return compile(source).isVisual;}catch(_){return false;}}};
})();
