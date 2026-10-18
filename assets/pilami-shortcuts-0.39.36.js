// Pilami keyboard shortcuts and display routing. AGPL-3.0-or-later.
(function(){
  'use strict';
  const KEY='pilami-window-shortcuts-v1';
  const actions=[{id:'visual',label:'Visuel',key:'f',screen:'auto:2'},
    {id:'controllers',label:'Contrôleurs Hydra',key:'g',screen:'auto:3'},
    {id:'code',label:'Code Hydra',key:'h',screen:'auto:1'},
    {id:'sequence-panel',label:'Afficher / masquer le séquenceur',key:'j',screen:null},
    {id:'sequence-play',label:'Lancer / arrêter le séquenceur',key:'k',screen:null},
    {id:'visual-mode',label:'Visuels : Panneau → Fenêtre séparée → Fond',key:'v',screen:null},
    {id:'visual-play',label:'Lancer / arrêter le visuel',key:'p',screen:null}];
  const defaults=()=>({enabled:true,actions:Object.fromEntries(actions.map(a=>[a.id,{key:a.key,screen:a.screen}]))});
  function validSettings(value){
    const next=defaults(),keys=new Set();
    if(!value||typeof value!=='object')return next;
    next.enabled=value.enabled!==false;
    for(const a of actions){
      const entry=value.actions?.[a.id];
      if(!entry){const chosen=keys.has(a.key)?'':a.key;if(chosen)keys.add(chosen);next.actions[a.id]={key:chosen,screen:a.screen};continue;}
      if(typeof entry.key!=='string'||!/^([a-z0-9]|)$/.test(entry.key.toLowerCase()))return defaults();
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
    const available=screens(),primary=available.find(s=>s.isPrimary)||available[0]||null,choice=settings.actions[id]?.screen;
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
  const hintDocuments=new Set(),hintRecords=new WeakMap();
  function actionKey(id){return settings.enabled?settings.actions[id]?.key?.toUpperCase()||'':'';}
  function hint(element,description,extra=[],aria=[]){
    if(!element)return;
    let record=hintRecords.get(element);
    if(!record){record={base:element.getAttribute('title')||description,last:null};hintRecords.set(element,record);}
    else if(element.getAttribute('title')!==record.last)record.base=element.getAttribute('title')||description;
    const title=(record.base||description)+(extra.length?' · Raccourcis : '+extra.join(' · '):'');
    if(element.title!==title)element.title=title;record.last=title;
    if(aria.length)element.setAttribute('aria-keyshortcuts',aria.join(' '));else element.removeAttribute('aria-keyshortcuts');
  }
  function updateHints(doc){
    if(!doc?.defaultView||doc.defaultView.closed)return;
    const toggle=actionKey('visual-play'),toggleHint=toggle?[toggle+' : lancer / arrêter']:[];
    const each=(selector,description,extra,aria)=>doc.querySelectorAll(selector).forEach(el=>hint(el,description,extra,aria));
    each('[data-hydra-action="play"]','Lancer ou appliquer le visuel',['Ctrl + Entrée',...toggleHint],['Control+Enter','Meta+Enter',...(toggle?[toggle]:[])]);
    each('[data-hydra-action="stop"]','Arrêter le visuel',['Alt + .',...toggleHint],['Alt+.',...(toggle?[toggle]:[])]);
    const music=doc.body.dataset.windowPanel?.startsWith('strudel-');
    each('[data-window-play]','Lancer / appliquer',['Ctrl + Entrée',...(!music?toggleHint:[])],['Control+Enter','Meta+Enter',...(!music&&toggle?[toggle]:[])]);
    each('[data-window-stop]','Arrêter',['Alt + .',...(!music?toggleHint:[])],['Alt+.',...(!music&&toggle?[toggle]:[])]);
    each('[data-action="play"]','Lancer la musique',['Ctrl + Entrée dans l’éditeur musical'],['Control+Enter','Meta+Enter']);
    each('[data-action="stop"]','Arrêter la musique',['Alt + . dans l’éditeur musical'],['Alt+.']);
    for(const [selector,id,label]of [
      ['[data-detach="hydra-code"]','code','Ouvrir le code Hydra'],
      ['[data-detach="hydra-sliders"]','controllers','Ouvrir les contrôleurs Hydra'],
      ['[data-visual-mode]','visual-mode','Changer le mode visuel'],
      ['[data-seq-play]','sequence-play','Lancer / arrêter le séquenceur'],
      ['.pilami-seq > details > summary','sequence-panel','Afficher / masquer le séquenceur']
    ]){const key=actionKey(id);each(selector,label,key?[key]:[],key?[key]:[]);}
    doc.querySelectorAll('[data-shortcut-test]').forEach(el=>{const key=actionKey(el.dataset.shortcutTest);hint(el,'Tester ce raccourci',key?[key]:[],key?[key]:[]);});
    const panel=doc.body.dataset.windowPanel;
    if(doc!==document&&!panel&&!doc.body.classList.contains('pd-window')){const full=doc.getElementById('fullscreen')||Array.from(doc.body.children).find(el=>el.tagName==='BUTTON'&&el.textContent.includes('Plein écran'));const key=actionKey('visual');if(full)hint(full,'Plein écran',key?[key,'F11']:['F11'],key?[key,'F11']:['F11']);}
    if(panel?.startsWith('hydra-')){const key=actionKey(panel.endsWith('-code')?'code':'controllers');each('[data-window-fullscreen]','Plein écran',key?[key,'F11']:['F11'],key?[key,'F11']:['F11']);}
  }
  function bindHints(doc){
    hintDocuments.add(doc);updateHints(doc);
    // Delegation also covers controls created after a preset has been launched.
    for(const name of ['pointerover','focusin'])doc.addEventListener(name,event=>{if(event.target.closest?.('[data-hydra-action],[data-window-play],[data-window-stop],[data-action],[data-detach],[data-visual-mode],[data-seq-play],[data-shortcut-test],[data-window-fullscreen],.pilami-seq summary'))updateHints(doc);});
    doc.defaultView?.addEventListener('pagehide',()=>hintDocuments.delete(doc),{once:true});
  }
  function fixedVisualShortcut(event,doc,root){
    if(event.defaultPrevented||event.repeat||event.isComposing)return false;
    const play=(event.ctrlKey||event.metaKey)&&!event.altKey&&event.key==='Enter';
    const stop=event.altKey&&!event.ctrlKey&&!event.metaKey&&(event.key==='.'||event.code==='Period');
    if(!play&&!stop)return false;
    if(doc.body.dataset.windowPanel?.startsWith('strudel-'))return false;
    const path=event.composedPath?.()||[event.target];
    if(path.some(el=>el?.matches?.('[data-strudel-space]')))return false;
    const editable=path.find(el=>el?.isContentEditable||el?.matches?.('input,textarea,select,[role="textbox"]'));
    if(editable&&!editable.matches?.('[data-hydra-code],[data-window-code]'))return false;
    const button=root?.querySelector(play?'[data-hydra-action="play"]':'[data-hydra-action="stop"]');
    if(!button||button.disabled)return false;
    event.preventDefault();event.stopImmediatePropagation();button.click();return true;
  }

  function bindDocument(doc,root){
    const previous=documents.get(doc);if(previous){previous.root=root;updateHints(doc);return;}
    const context={root};documents.set(doc,context);bindHints(doc);
    doc.addEventListener('keydown',event=>{
      if(fixedVisualShortcut(event,doc,context.root||activeRoot))return;
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
    if(id==='visual-play'){
      const play=root.querySelector('[data-hydra-action="play"]');if(!play||play.disabled)return;
      const stop=root.querySelector('[data-hydra-action="stop"]');
      if(window.PilamiStrudelHydra?.isRunning())stop?.click();else play.click();
      return;
    }
    if(id==='visual-mode'){
      const mode=window.PilamiStrudelVisuals?.cycleMode?.(root);
      if(mode)message(root,'Visuels : '+({panel:'Panneau',window:'Fenêtre séparée',background:'Fond'}[mode])+'.');
      else message(root,'Impossible de changer le mode visuel. Autorise les fenêtres pop-up pour ce site, puis réessaie.',true);
      return;
    }
    if(id==='sequence-panel'||id==='sequence-play'){
      const seq=root._pilamiHydraControls?.snapshots?.sequencer;
      if(!seq){message(root,'Ouvre Hydra pour accéder au séquenceur.',true);return;}
      if(id==='sequence-panel')window.PilamiHydraSequencer?.togglePanel?.(seq,sourceDoc);
      else if(seq.state.running)seq.stop();else seq.start();
      return;
    }
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
      if(!a.screen)continue;
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
    for(const doc of hintDocuments){if(doc.defaultView?.closed)hintDocuments.delete(doc);else updateHints(doc);}
    for(const view of views.values()){
      view.enabled.checked=settings.enabled;
      for(const a of actions){view.rows[a.id].key.value=settings.actions[a.id].key.toUpperCase();if(view.rows[a.id].screen)view.rows[a.id].screen.value=settings.actions[a.id].screen;}
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


  function openPanel(targetRoot){
    const root=views.has(targetRoot)?targetRoot:views.has(activeRoot)?activeRoot:views.keys().next().value;
    const view=root&&views.get(root);
    if(!view)return false;
    activeRoot=root;
    // Expand native details before revealing the form, preserving all user values.
    let element=view.panel.parentElement;
    while(element){if(element.tagName==='DETAILS')element.open=true;element=element.parentElement;}
    view.panel.hidden=false;
    view.toggle.setAttribute('aria-expanded','true');
    view.panel.scrollIntoView?.({behavior:'smooth',block:'nearest'});
    return true;
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
      const screenLabel=a.screen?node('label','Destination '):null,screen=a.screen?node('select',null,{'aria-label':'Écran pour '+a.label,'data-shortcut-screen':a.id}):null;if(screenLabel)screenLabel.append(screen);
      const test=node('button','Tester',{type:'button','aria-label':'Tester '+a.label,'data-shortcut-test':a.id});test.addEventListener('click',()=>{if(save(root))run(a.id,root);});
      row.append(caption,keyLabel);if(screenLabel)row.append(screenLabel);row.append(test);panel.append(row);rows[a.id]={key,screen};
    }
    const buttons=node('div',null,{class:'pilami-shortcuts-buttons'}),detectButton=node('button','Détecter les écrans',{type:'button','data-shortcut-detect':''}),saveButton=node('button','Enregistrer',{type:'button','data-shortcut-save':''}),reset=node('button','Réglages d’origine',{type:'button','data-shortcut-reset':''});
    buttons.append(detectButton,saveButton,reset);
    const info=node('p','',{class:'pilami-shortcuts-info'}),status=node('p','',{role:'status','aria-live':'polite','data-shortcut-status':''});
    status.className='pilami-shortcuts-status';panel.append(buttons,info);bar.append(toggle);bar.after(panel);panel.after(status);
    views.set(root,{panel,toggle,enabled,rows,detect:detectButton,info,status});
    toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));activeRoot=root;});
    detectButton.addEventListener('click',()=>detect(root));saveButton.addEventListener('click',()=>save(root));
    reset.addEventListener('click',()=>{settings=defaults();persist(root);refresh();message(root,'Réglages d’origine : F → visuel, G → contrôleurs, H → code, J → grille, K → lecture/stop, V → mode visuel, P → lancer / arrêter le visuel.');});
    root.addEventListener('pilami-hydra-controllers-change',()=>updateHints(root.ownerDocument));
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
      next.actions[a.id]={key,screen:view.rows[a.id].screen?view.rows[a.id].screen.value:null};
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
  window.PilamiShortcuts={mount,bindDocument,run,openPanel};
})();
