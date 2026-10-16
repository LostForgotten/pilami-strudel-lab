// Pilami keyboard shortcuts and display routing. AGPL-3.0-or-later.
(function(){
  'use strict';
  const KEY='pilami-window-shortcuts-v1';
  const actions=[{id:'visual',label:'Visuel',key:'f',screen:'auto:2'},
    {id:'controllers',label:'Contrôleurs Hydra',key:'g',screen:'auto:3'},
    {id:'code',label:'Code Hydra',key:'h',screen:'auto:1'}];
  const defaults=()=>({enabled:true,actions:Object.fromEntries(actions.map(a=>[a.id,{key:a.key,screen:a.screen}]))});
  function validSettings(value){
    const next=defaults(),keys=new Set();
    if(!value||typeof value!=='object')return next;
    next.enabled=value.enabled!==false;
    for(const a of actions){
      const entry=value.actions?.[a.id];
      if(!entry||typeof entry.key!=='string'||!/^([a-z0-9]|)$/.test(entry.key.toLowerCase()))return defaults();
      const key=entry.key.toLowerCase();if(key&&keys.has(key))return defaults();if(key)keys.add(key);
      next.actions[a.id]={key,screen:typeof entry.screen==='string'&&entry.screen.length<600?entry.screen:a.screen};
    }
    return next;
  }
  let settings=defaults();try{settings=validSettings(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(_){}
  let screenDetails=null,permission=null,detecting=false,activeRoot=null;
  const views=new Map(),documents=new WeakMap(),pending=new Set();
  const node=(tag,text,attrs={})=>{const el=document.createElement(tag);if(text!==null)el.textContent=text;for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;};
  function screens(){
    return Array.from(screenDetails?.screens||[]).sort((a,b)=>Number(b.isPrimary)-Number(a.isPrimary)||a.left-b.left||a.top-b.top);
  }
  function displayKey(s){return 'display:'+JSON.stringify([s.label||'',s.left,s.top,s.width,s.height]);}
  function destination(id){
    const available=screens(),primary=available.find(s=>s.isPrimary)||available[0]||null,choice=settings.actions[id].screen;
    if(choice==='current')return {screen:null,fallback:false};
    if(!available.length)return {screen:null,fallback:false,unknown:true};
    const index=/^auto:[123]$/.test(choice)?Number(choice.slice(5))-1:-1;
    const selected=index>=0?available[index]:available.find(s=>displayKey(s)===choice);
    return {screen:selected||primary,fallback:!selected};
  }
  function message(root,text,error=false){
    const view=views.get(root);if(!view)return;
    view.status.textContent=text;view.status.classList.toggle('is-error',error);
  }
  function ignored(event){
    if(event.defaultPrevented||event.repeat||event.isComposing||event.key==='Dead'||event.ctrlKey||event.altKey||event.metaKey)return true;
    const path=event.composedPath?.()||[event.target];
    return path.some(el=>el?.isContentEditable||el?.matches?.('input,textarea,select,[role="textbox"],[contenteditable]:not([contenteditable="false"])'));
  }
  function bindDocument(doc,root){
    const previous=documents.get(doc);if(previous){previous.root=root;return;}
    const context={root};documents.set(doc,context);
    doc.addEventListener('keydown',event=>{
      if(!settings.enabled||ignored(event))return;
      const action=actions.find(a=>settings.actions[a.id].key&&settings.actions[a.id].key===event.key.toLowerCase());
      if(!action)return;
      // Capture prevents the output's legacy F listener from toggling a second time.
      event.preventDefault();event.stopImmediatePropagation();
      run(action.id,context.root||activeRoot,doc);
    },true);
  }
  function offerFullscreen(session,root,label){
    const doc=session.doc;
    let notice=doc.querySelector('[data-pilami-shortcut-notice]');
    if(!notice){
      notice=doc.createElement('div');notice.dataset.pilamiShortcutNotice='';notice.setAttribute('role','status');
      notice.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;z-index:2147483646;padding:12px;border:1px solid #91adc8;border-radius:9px;background:#182b40;color:#fff;font:14px system-ui;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
      doc.body.append(notice);
    }
    notice.replaceChildren();
    const text=doc.createElement('span');text.textContent='Clique pour terminer le plein écran, ou utilise F11 dans cette fenêtre.';
    const button=doc.createElement('button');button.type='button';button.textContent='⛶ Plein écran';
    button.style.cssText='padding:8px 12px;color:#fff;background:#355878;border:1px solid #91adc8;border-radius:7px;cursor:pointer';
    button.addEventListener('click',()=>{
      const id=actions.find(a=>a.label===label)?.id;
      enterFullscreen(session,id?destination(id).screen:null).then(()=>notice.remove()).catch(()=>message(root,'Utilise F11 dans la fenêtre '+label+'.',true));
    });notice.append(text,button);
  }
  function enterFullscreen(session,screen){
    // No await before this request: preserve the key/click's transient activation.
    try{return Promise.resolve(session.doc.documentElement.requestFullscreen(screen?{screen}:undefined));}
    catch(error){return Promise.reject(error);}
  }
  function run(id,root,sourceDoc=document){
    if(!root||pending.has(id))return;
    activeRoot=root;
    const action=actions.find(a=>a.id===id);if(!action)return;
    let session;
    try{
      session=id==='visual'?window.PilamiStrudelVisuals?.ensureOutput?.(root):root._pilamiWindows?.ensure(id==='code'?'hydra-code':'hydra-sliders');
    }catch(_){message(root,'Impossible d’ouvrir '+action.label+'. Autorise les fenêtres séparées puis réessaie.',true);return;}
    if(!session){message(root,'Fenêtre bloquée ou indisponible. Autorise les pop-up pour ce site, puis réessaie.',true);return;}
    const {win,doc}=session;
    bindDocument(doc,root);
    // Same shortcut in its own fullscreen window returns to windowed mode.
    if(doc===sourceDoc&&doc.fullscreenElement){
      Promise.resolve(doc.exitFullscreen()).catch(()=>message(root,'Utilise Échap pour quitter le plein écran.',true));return;
    }
    const target=destination(id);
    if(!doc.fullscreenElement&&target.screen){
      const s=target.screen;
      try{win.moveTo(s.availLeft,s.availTop);win.resizeTo(s.availWidth,s.availHeight);}catch(_){}
    }
    try{win.focus();}catch(_){}
    if(doc.fullscreenElement){message(root,action.label+' déjà en plein écran.');return;}
    pending.add(id);
    enterFullscreen(session,target.screen).then(()=>{
      doc.querySelector('[data-pilami-shortcut-notice]')?.remove();
      message(root,action.label+' en plein écran.'+(target.fallback?' Écran absent : repli sur l’écran principal.':target.unknown?' Placement manuel : détecte les écrans si ton navigateur le permet.':''));
    }).catch(()=>{
      offerFullscreen(session,root,action.label);
      message(root,action.label+' ouvert'+(target.fallback?' sur l’écran principal':'')+'. Clique sur Plein écran dans sa fenêtre ou utilise F11.');
    }).finally(()=>pending.delete(id));
  }
  function refillDisplays(view){
    const available=screens();
    for(const a of actions){
      const select=view.rows[a.id].screen,choice=select.value||settings.actions[a.id].screen;
      select.replaceChildren();
      const add=(value,text)=>select.append(node('option',text,{value}));
      add('auto:1','Écran 1 (principal)');add('auto:2','Écran 2, sinon 1');add('auto:3','Écran 3, sinon 1');add('current','Écran de la fenêtre (placement manuel)');
      available.forEach((s,i)=>add(displayKey(s),'Écran '+(i+1)+' · '+(s.label||'Moniteur')+' · '+s.width+' × '+s.height+(s.isPrimary?' · principal':'')));
      if(!Array.from(select.options).some(o=>o.value===choice))add(choice,'Écran choisi déconnecté → principal');
      select.value=choice;
    }
    view.detect.disabled=detecting||typeof window.getScreenDetails!=='function';
    view.detect.textContent=detecting?'Détection…':'Détecter les écrans';
    view.info.textContent=available.length?available.length+' écran'+(available.length>1?'s':'')+' détecté'+(available.length>1?'s':'')+'. La numérotation ci-dessus appartient à l’appli ; vérifie le nom du moniteur.':typeof window.getScreenDetails==='function'?'Clique sur Détecter les écrans et autorise leur gestion pour activer le placement automatique.':'Ce navigateur ne détecte pas les écrans. Déplace les fenêtres manuellement, puis utilise les raccourcis ou leur bouton Plein écran.';
  }
  function refresh(){
    for(const view of views.values()){
      view.enabled.checked=settings.enabled;
      for(const a of actions){view.rows[a.id].key.value=settings.actions[a.id].key.toUpperCase();view.rows[a.id].screen.value=settings.actions[a.id].screen;}
      refillDisplays(view);
    }
  }
  function changedScreens(){
    // Preserve drafts while screen topology changes.
    for(const view of views.values())refillDisplays(view);
  }
  function useDetails(details){
    screenDetails?.removeEventListener?.('screenschange',changedScreens);
    screenDetails=details;screenDetails?.addEventListener?.('screenschange',changedScreens);changedScreens();
  }
  async function detect(root){
    if(detecting||typeof window.getScreenDetails!=='function')return;
    detecting=true;changedScreens();
    try{useDetails(await window.getScreenDetails());message(root,'Écrans détectés. Choisis les destinations, puis enregistre les réglages.');}
    catch(_){useDetails(null);message(root,'Accès aux écrans refusé. Le placement manuel reste disponible.',true);}
    finally{detecting=false;changedScreens();}
  }
  function mount(root){
    if(views.has(root))return;activeRoot=root;
    const space=root.querySelector('[data-hydra-space]');if(!space)return;
    const bar=space.querySelector('.pilami-detach-bar')||space;
    const toggle=node('button','⌨ Raccourcis et écrans',{type:'button','aria-expanded':'false','data-window-shortcuts':''});
    const panel=node('section',null,{class:'pilami-shortcuts-panel','aria-label':'Raccourcis et écrans','data-shortcuts-panel':''});panel.hidden=true;
    const heading=node('h3','Raccourcis et écrans');
    const intro=node('p','Ouvre une fenêtre ou retrouve celle déjà ouverte. Les lettres restent disponibles pendant la saisie du code et des noms. Échap quitte le plein écran.');
    const enabledLabel=node('label',null,{class:'pilami-shortcuts-enabled'}),enabled=node('input',null,{type:'checkbox'});enabledLabel.append(enabled,node('span','Activer les raccourcis'));
    const rows={};
    panel.append(heading,intro,enabledLabel);
    for(const a of actions){
      const row=node('div',null,{class:'pilami-shortcuts-row'}),caption=node('strong',a.label);
      const keyLabel=node('label','Touche '),key=node('input',null,{type:'text',maxlength:'1',size:'2',autocomplete:'off',spellcheck:'false','aria-label':'Touche pour '+a.label,'data-shortcut-key':a.id});keyLabel.append(key);
      const screenLabel=node('label','Destination '),screen=node('select',null,{'aria-label':'Écran pour '+a.label,'data-shortcut-screen':a.id});screenLabel.append(screen);
      const test=node('button','Tester',{type:'button','aria-label':'Tester '+a.label,'data-shortcut-test':a.id});test.addEventListener('click',()=>{if(save(root))run(a.id,root);});
      row.append(caption,keyLabel,screenLabel,test);panel.append(row);rows[a.id]={key,screen};
    }
    const buttons=node('div',null,{class:'pilami-shortcuts-buttons'}),detectButton=node('button','Détecter les écrans',{type:'button','data-shortcut-detect':''}),saveButton=node('button','Enregistrer',{type:'button','data-shortcut-save':''}),reset=node('button','Réglages d’origine',{type:'button','data-shortcut-reset':''});
    buttons.append(detectButton,saveButton,reset);
    const info=node('p','',{class:'pilami-shortcuts-info'}),status=node('p','',{role:'status','aria-live':'polite','data-shortcut-status':''});
    status.className='pilami-shortcuts-status';panel.append(buttons,info);bar.append(toggle);bar.after(panel);panel.after(status);
    views.set(root,{panel,toggle,enabled,rows,detect:detectButton,info,status});
    toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));activeRoot=root;});
    detectButton.addEventListener('click',()=>detect(root));saveButton.addEventListener('click',()=>save(root));
    reset.addEventListener('click',()=>{settings=defaults();persist(root);refresh();message(root,'Réglages d’origine : F → visuel, G → contrôleurs, H → code.');});
    root.addEventListener('pointerdown',()=>{activeRoot=root;});root.addEventListener('focusin',()=>{activeRoot=root;});
    // Main document routes to the most recently used workspace, child documents to their owner.
    if(!documents.has(document))bindDocument(document,null);
    refresh();
  }
  function persist(root){
    try{localStorage.setItem(KEY,JSON.stringify(settings));return true;}
    catch(_){message(root,'Réglages actifs pour cette session ; le navigateur refuse leur mémorisation.',true);return false;}
  }
  function save(root){
    const view=views.get(root);if(!view)return false;
    const next=defaults(),keys=new Set();next.enabled=view.enabled.checked;
    for(const a of actions){
      const key=view.rows[a.id].key.value.trim().toLowerCase();
      if(!/^([a-z0-9]|)$/.test(key)){message(root,'Utilise une lettre ou un chiffre par raccourci. Un champ vide désactive cette action.',true);return false;}
      if(key&&keys.has(key)){message(root,'Chaque action doit avoir une touche différente.',true);return false;}if(key)keys.add(key);
      next.actions[a.id]={key,screen:view.rows[a.id].screen.value};
    }
    settings=next;const saved=persist(root);refresh();
    if(saved)message(root,'Réglages mémorisés dans ce navigateur.');return true;
  }
  window.addEventListener('storage',event=>{if(event.key===KEY){try{settings=validSettings(JSON.parse(event.newValue||'null'));refresh();}catch(_){}}});
  // Restore an already-authorized display list without prompting on page load.
  if(typeof window.getScreenDetails==='function'&&navigator.permissions?.query){
    navigator.permissions.query({name:'window-management'}).then(value=>{
      permission=value;
      const restore=()=>{
        if(permission.state==='granted')window.getScreenDetails().then(useDetails).catch(()=>useDetails(null));
        else useDetails(null);
      };
      permission.addEventListener?.('change',restore);restore();
    }).catch(()=>{});
  }
  window.PilamiShortcuts={mount,bindDocument,run};
})();
