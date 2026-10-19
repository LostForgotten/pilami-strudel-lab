(function () {
  'use strict';
  // The page owns the engines and canonical fields. Windows edit those fields
  // through their existing events, so saving, sharing and live sliders use one state.
  const popupCSS = `
    :root{color-scheme:light dark;--bg:#f7f9fc;--text:#172b42;--editor-bg:#fff;--editor-text:#172b42;--accent:#4676ad}
    *{box-sizing:border-box}html,body{margin:0;height:100%;background:var(--bg);color:var(--text);font:15px system-ui,sans-serif}
    body{display:flex;flex-direction:column;padding:16px;gap:12px}
    .window-name{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px}.window-name input{font:inherit;max-width:100%;width:340px;padding:8px 10px;border:1px solid #8997a7;border-radius:7px;background:var(--editor-bg);color:var(--editor-text)}
    header{display:flex;flex-wrap:wrap;align-items:center;gap:10px}h1{font-size:20px;margin:0 auto 0 0}
    nav{display:flex;gap:8px;flex-wrap:wrap}button{font:inherit;padding:8px 12px;border:1px solid #8997a7;border-radius:7px;background:var(--editor-bg);color:var(--editor-text);cursor:pointer}
    button:focus-visible,textarea:focus-visible,input:focus-visible{outline:3px solid var(--accent);outline-offset:2px}button:disabled{opacity:.5;cursor:wait}
    html[data-role-colors='1'] button{--button-color:var(--pilami-color-utility,#739bc0);background:color-mix(in srgb,var(--button-color) 20%,var(--bg));color:var(--text);border-color:var(--button-color)}
    html[data-role-colors='1'] [data-window-play]{--button-color:var(--pilami-color-play,#609e88)}
    html[data-role-colors='1'] [data-window-reload-preset]{--button-color:var(--pilami-color-reset,#b29a71)}
    html[data-role-colors='1'] :is([data-window-stop],[data-window-delete-preset]){--button-color:var(--pilami-color-stop,#bb7580)}
    html[data-role-colors='1'] :is([data-window-update-preset],[data-window-create-preset],[data-hydra-action="save-categories"]){--button-color:var(--pilami-color-save,#6fa3a5)}
    html[data-role-colors='1'] button:hover:not(:disabled){background:color-mix(in srgb,var(--button-color) 30%,var(--bg))}
    html[data-role-colors='1'] button:focus-visible{outline-color:var(--button-color)}
    [data-window-play]{background:var(--accent);color:#fff}p{margin:0;line-height:1.5}[data-window-status]{font-size:13px;min-height:1.5em}.is-error{color:#e75d51}
    main{min-height:0;flex:1;display:flex;flex-direction:column;overflow:auto}textarea{flex:1;width:100%;min-height:180px;resize:none;border:1px solid #8997a7;border-radius:8px;padding:16px;background:var(--editor-bg);color:var(--editor-text);font:14px/1.6 ui-monospace,Consolas,monospace;tab-size:2;white-space:pre;overflow:auto}
    [data-window-sliders]{width:100%;max-width:1400px;margin:0 auto}.slider{display:grid;grid-template-columns:minmax(150px,1fr) minmax(120px,3fr) 80px;gap:16px;align-items:center;padding:16px 0;border-bottom:1px solid #8997a744}
    .slider input{width:100%;min-width:0;accent-color:var(--accent);height:28px}.slider output{text-align:right;font-variant-numeric:tabular-nums}
    [hidden]{display:none!important}
    /* Code stays first; preset tools scroll below it instead of consuming its height. */
    body[data-window-panel$="-code"]{min-width:0;overflow:auto}
    body[data-window-panel$="-code"]>header,body[data-window-panel$="-code"]>footer,body[data-window-panel$="-code"]>[data-window-status],body[data-window-panel$="-code"]>[data-window-notice]{flex-shrink:0;min-width:0}
    body[data-window-panel$="-code"] nav{min-width:0;max-width:100%}
    body[data-window-panel$="-code"] nav button{max-width:100%;white-space:normal}
    body[data-window-panel$="-code"] main{flex:1 0 180px;min-height:180px;gap:12px}
    body[data-window-panel$="-code"] textarea{flex:1 0 240px;min-height:240px;min-width:0}
    /* Controller windows share one fluid column and one scrolling area. */
    body[data-window-panel="hydra-sliders"]{overflow:hidden;min-width:0}
    body[data-window-panel="hydra-sliders"]>header,body[data-window-panel="hydra-sliders"]>footer,body[data-window-panel="hydra-sliders"]>[data-window-status],body[data-window-panel="hydra-sliders"]>[data-window-notice]{flex-shrink:0;min-width:0}
    body[data-window-panel="hydra-sliders"] nav{flex-wrap:wrap;min-width:0;max-width:100%}
    body[data-window-panel="hydra-sliders"] nav button{max-width:100%;white-space:normal}
    .pilami-window-main{width:100%;min-width:0;scrollbar-gutter:stable}
    .pilami-window-content{display:flex;flex-direction:column;gap:12px;width:100%;min-width:0;flex:0 0 auto}
    .pilami-window-content [data-window-sliders]{width:100%;max-width:none;margin:0;min-width:0;flex:0 0 auto}
    .pilami-window-tools{border:1px solid #8997a766;border-radius:8px;flex:0 0 auto;min-width:0}
    .pilami-window-tools>summary{padding:10px 12px;cursor:pointer;font-weight:600;line-height:1.5}
    .pilami-window-tools-body{display:flex;flex-direction:column;gap:12px;padding:0 12px 12px;min-width:0}
    .pilami-window-tools-body .window-name input{flex:1 1 240px;width:auto;min-width:0}
    .pilami-window-tools-body .pilami-image-source,.pilami-window-tools-body [data-hydra-preset-categories]{margin:0}
    .pilami-window-content [data-empty-controls="true"] .pilami-controller-parameters>.pilami-control-help:not([data-control-empty]){display:none}
    body[data-window-panel="hydra-sliders"] [hidden]{display:none!important}
    footer{font-size:12px;opacity:.75}@media(max-width:600px){body{padding:12px}.slider{grid-template-columns:1fr 80px;gap:8px}.slider span{grid-column:1/-1}h1{flex-basis:100%;font-size:18px}button{font-size:13px}}
  `;
  function node(doc, tag, text, attributes={}) {
    const element=doc.createElement(tag);if(text!==null)element.textContent=text;
    Object.entries(attributes).forEach(([name,value])=>element.setAttribute(name,value));return element;
  }
  function mount(root) {
    if(root.dataset.windowsMounted)return;root.dataset.windowsMounted='1';
    const sessions=new Map(),launchers=new Map();let timer=null;
    const configurations=[
      {key:'strudel',title:'Strudel',space:'[data-strudel-space]',editor:'[data-code]',list:'[data-slider-list]',play:'[data-action="play"]',stop:'[data-action="stop"]',status:'[data-status]'},
      {key:'hydra',title:'Hydra',space:'[data-hydra-space]',editor:'[data-hydra-code]',list:'[data-hydra-slider-list]',play:'[data-hydra-action="play"]',stop:'[data-hydra-action="stop"]',status:'[data-hydra-status]'}
    ];
    function finish(session, close=true, focus=false) {
      if(sessions.get(session.key)!==session)return;
      sessions.delete(session.key);session.source.classList.remove('pilami-is-detached');
      session.controllerView?.dispose();session.imageView?.dispose();session.resolutionView?.dispose();
      session.placeholder.hidden=true;session.launcher.textContent=session.label;session.launcher.setAttribute('aria-expanded','false');
      if(close&&!session.win.closed)session.win.close();
      if(!sessions.size&&timer){clearInterval(timer);timer=null;}
      if(focus)session.launcher.focus();
    }
    function synchronize(session) {
      if(session.win.closed){finish(session,false);return;}
      // A popup may have navigated elsewhere. Release its field without touching it.
      try {if(session.win.document!==session.doc){finish(session,false);return;}}
      catch(_){finish(session,false);return;}
      const {config,doc}=session,sourceStatus=root.querySelector(config.status),play=root.querySelector(config.play);
      session.status.textContent=sourceStatus.textContent;session.status.classList.toggle('is-error',sourceStatus.classList.contains('is-error'));
      session.play.disabled=play.disabled;session.play.textContent=play.textContent;
      if(session.presetImport)session.presetImport.disabled=Boolean(root.querySelector('[data-hydra-action="import"]')?.disabled);
      if(session.presetReload){const actions=root._pilamiHydraPresetActions;session.presetReload.disabled=!actions?.canReload();session.presetReload.textContent=actions?.busy()?'Rechargement…':'Recharger le preset';}
      if(session.nameField){const originalName=root.querySelector('[data-hydra-name]');if(session.nameField.value!==originalName.value)session.nameField.value=originalName.value;}
      if(session.presetDelete){const original=root.querySelector('[data-hydra-action="delete-preset"]');session.presetDelete.hidden=original.hidden;session.presetDelete.disabled=original.disabled;session.presetDelete.textContent=original.textContent;}
      if(session.presetCreate){const original=root.querySelector('[data-hydra-action="create-preset"]');session.presetCreate.hidden=original.hidden;session.presetCreate.disabled=original.disabled;session.presetCreate.textContent=original.textContent;}
      if(session.presetUpdate){
        const original=root.querySelector('[data-hydra-action="update-preset"]');
        session.presetUpdate.hidden=original.hidden;session.presetUpdate.disabled=original.disabled;
        session.presetUpdate.textContent=original.textContent;
      }
      if(session.presetShare){
        const original=root.querySelector('[data-action="copy-hydra-link"]');
        session.presetShare.hidden=original.hidden;session.presetShare.disabled=original.disabled;
        const source=root.querySelector('[data-hydra-share-feedback]'), mirror=session.shareFeedback;
        if(source&&mirror){
          mirror.querySelector('[data-hydra-share-status]').textContent=source.querySelector('[data-hydra-share-status]').textContent;
          mirror.querySelector('[data-hydra-share-status]').className=source.querySelector('[data-hydra-share-status]').className;
          mirror.querySelector('[data-hydra-share-result]').hidden=source.querySelector('[data-hydra-share-result]').hidden;
          const field=mirror.querySelector('[data-hydra-share-link]'), value=source.querySelector('[data-hydra-share-link]').value;
          if(field.value!==value)field.value=value;
        }
      }
      if(session.categoryPanel){
        const original=root.querySelector('[data-hydra-preset-categories]'), mirror=session.categoryPanel;
        mirror.hidden=original.hidden;
        const sourceChoices=original.querySelector('[data-hydra-category-choices]'), choices=mirror.querySelector('[data-hydra-category-choices]');
        if(choices.dataset.key!==sourceChoices.dataset.key){choices.replaceChildren(...Array.from(sourceChoices.children,child=>doc.importNode(child,true)));choices.dataset.key=sourceChoices.dataset.key;}
        for(const input of choices.querySelectorAll('input')){const source=sourceChoices.querySelector('[data-hydra-category-id="'+input.value+'"]');input.checked=Boolean(source?.checked);}
        mirror.querySelector('[data-hydra-category-fields]').disabled=original.querySelector('[data-hydra-category-fields]').disabled;
        mirror.querySelector('[data-hydra-category-help]').textContent=original.querySelector('[data-hydra-category-help]').textContent;
        const sourceDeleteSelect=original.querySelector('[data-hydra-category-delete-select]'), deleteSelect=mirror.querySelector('[data-hydra-category-delete-select]');
        if(sourceDeleteSelect&&deleteSelect){
          if(deleteSelect.dataset.key!==sourceDeleteSelect.dataset.key){deleteSelect.replaceChildren(...Array.from(sourceDeleteSelect.children,child=>doc.importNode(child,true)));deleteSelect.dataset.key=sourceDeleteSelect.dataset.key;}
          deleteSelect.value=sourceDeleteSelect.value;deleteSelect.disabled=sourceDeleteSelect.disabled;
          const sourceDelete=original.querySelector('[data-hydra-action="delete-category"]'), del=mirror.querySelector('[data-hydra-action="delete-category"]');
          del.disabled=sourceDelete.disabled;del.textContent=sourceDelete.textContent;
          const status=mirror.querySelector('[data-hydra-category-delete-status]'), sourceStatus=original.querySelector('[data-hydra-category-delete-status]');
          status.textContent=sourceStatus.textContent;status.className=sourceStatus.className;
        }
        const sourceSave=original.querySelector('[data-hydra-action="save-categories"]'), save=mirror.querySelector('[data-hydra-action="save-categories"]');save.disabled=sourceSave.disabled;save.textContent=sourceSave.textContent;
        const sourceName=original.querySelector('[data-hydra-category-name]'), mirroredName=mirror.querySelector('[data-hydra-category-name]');
        if(sourceName && mirroredName){
          if(mirroredName.value!==sourceName.value)mirroredName.value=sourceName.value;
          mirroredName.disabled=sourceName.disabled;
          const sourceCreate=original.querySelector('[data-hydra-action="create-category"]'), create=mirror.querySelector('[data-hydra-action="create-category"]');
          create.disabled=sourceCreate.disabled;create.textContent=sourceCreate.textContent;
          const status=mirror.querySelector('[data-hydra-category-create-status]'), sourceStatus=original.querySelector('[data-hydra-category-create-status]');
          status.textContent=sourceStatus.textContent;status.className=sourceStatus.className;
        }
      }
      doc.documentElement.dataset.roleColors=root.dataset.roleColors;
      window.PilamiStudio?.apply(doc,root);
      const style=getComputedStyle(root);
      // CSS des PNG du séquenceur partagé par la page et la fenêtre Contrôleurs.
      if(session.kind==='sliders' && config.key==='hydra'){
        for(const kind of ['empty','recall','morph','active']){
          const name='--pilami-seq-image-'+kind;
          session.content.style.setProperty(name,style.getPropertyValue(name));
        }
      }
      for(const role of ['play','stop','reset','utility','save','preset']){const key='--pilami-color-'+role;doc.documentElement.style.setProperty(key,style.getPropertyValue(key));}
      const palette={'--bg':'--pilami-panel-bg','--text':'--pilami-panel-text','--editor-bg':'--pilami-editor-bg','--editor-text':'--pilami-editor-text','--accent':'--pilami-accent'};
      for(const [target,source] of Object.entries(palette)){const value=style.getPropertyValue(source).trim();if(value)doc.documentElement.style.setProperty(target,value);}
      doc.documentElement.style.colorScheme=window.PilamiStudio?.theme()||(document.documentElement.getAttribute('data-pilami-theme')==='dark'?'dark':'light');
      if(session.kind==='code'){
        if(session.field.value!==session.editor.value){
          const start=session.field.selectionStart,end=session.field.selectionEnd,scroll=session.field.scrollTop;
          session.field.value=session.editor.value;session.field.setSelectionRange(Math.min(start,session.field.value.length),Math.min(end,session.field.value.length));session.field.scrollTop=scroll;
        }
      }else{
        if(config.key==='hydra'){
          const model=root._pilamiHydraControls;
          if(!session.controllerView||session.controllerModel!==model){session.controllerView?.dispose();session.controllerModel=model;session.controllerView=window.PilamiHydraControls.mount(session.content,root,model);}
          session.empty.hidden=Boolean(model);session.content.dataset.emptyControls=String(!model?.entries.length);session.controllerView.refresh();return;
        }
        const inputs=Array.from(session.source.querySelectorAll('input[type="range"]'));
        if(inputs.length!==session.rows.length||inputs.some((input,i)=>session.rows[i]?.source!==input)){
          session.content.replaceChildren();session.rows=inputs.map(input=>{
            const parent=input.closest('label'),label=node(doc,'label',null,{class:'slider'}),caption=parent.querySelector('span')?.textContent||input.getAttribute('aria-label')||'Paramètre';
            const mirror=node(doc,'input',null,{type:'range',min:input.min,max:input.max,step:input.step,'aria-label':caption});mirror.value=input.value;
            const output=node(doc,'output',input.value);label.append(node(doc,'span',caption),mirror,output);session.content.append(label);
            mirror.addEventListener('input',()=>{
              if(!session.source.contains(input))return;
              input.value=mirror.value;input.dispatchEvent(new Event('input',{bubbles:true}));synchronizeAll();
            });return {source:input,mirror,output};
          });
          session.empty.hidden=inputs.length>0;
        }
        session.rows.forEach(row=>{if(row.mirror.value!==row.source.value)row.mirror.value=row.source.value;row.output.textContent=row.source.value;});
      }
    }
    function synchronizeAll(){for(const session of [...sessions.values()])synchronize(session);}
    function open(config,kind,launcher,placeholder,ensure=false) {
      const key=config.key+'-'+kind,existing=sessions.get(key);
      if(existing&&!existing.win.closed){
        if(ensure){existing.win.focus();return existing;}
        finish(existing,true,true);return;
      }
      if(existing)finish(existing,false);
      let win;
      try{win=window.open('', '_blank', 'popup=yes,width='+(kind==='code'?1000:850)+',height=760,resizable=yes,scrollbars=yes');}catch(_){win=null;}
      const notice=root.querySelector('[data-windows-notice="'+config.key+'"]');
      if(!win){notice.textContent='Le navigateur a bloqué la fenêtre. Autorise les fenêtres de pilami.fr, puis réessaie.';return;}
      notice.textContent='';
      const controlTitle=config.key==='hydra'?'Contrôleurs':'Curseurs';
      const doc=win.document;doc.title='Pilami — '+config.title+' · '+(kind==='code'?'Code':controlTitle);doc.documentElement.lang='fr';
      const meta=node(doc,'meta',null,{charset:'utf-8'}),viewport=node(doc,'meta',null,{name:'viewport',content:'width=device-width,initial-scale=1'}),style=node(doc,'style',popupCSS);
      doc.head.append(meta,viewport,style);doc.body.replaceChildren();doc.body.dataset.windowPanel=config.key+'-'+kind;window.PilamiStudio?.apply(doc,root);
      if(config.key==='hydra'&&kind==='sliders'){
        doc.head.append(node(doc,'link',null,{rel:'stylesheet',href:window.PilamiHydraControls.cssURL}));
        const seqCSS=document.querySelector('link[id="pilami-hydra-sequencer-css"]');
        if(seqCSS)doc.head.append(node(doc,'link',null,{rel:'stylesheet',href:seqCSS.href}));
      }
      const header=node(doc,'header',null),nav=node(doc,'nav',null,{'aria-label':'Commandes '+config.title});header.append(node(doc,'h1',config.title+' · '+(kind==='code'?'Code':controlTitle)),nav);
      const play=node(doc,'button','Lancer / appliquer',{type:'button','data-window-play':''}),stop=node(doc,'button','Arrêter',{type:'button','data-window-stop':''});
      const fullscreen=node(doc,'button','Plein écran',{type:'button','data-window-fullscreen':''}),attach=node(doc,'button','Rattacher',{type:'button','data-window-attach':''});nav.append(play,stop,fullscreen,attach);
      const status=node(doc,'p','',{role:'status','aria-live':'polite','data-window-status':''}),windowNotice=node(doc,'p','',{role:'status','aria-live':'polite','data-window-notice':''}),main=node(doc,'main',null,{class:'pilami-window-main'}),footer=node(doc,'footer','Ctrl + Entrée : appliquer · Alt + point : arrêter · Garde la page principale ouverte.');
      windowNotice.hidden=true;doc.body.append(header,status,windowNotice,main,footer);
      const controllerWindow=config.key==='hydra'&&kind==='sliders';
      let contentHost=main,presetHost=null;
      if(controllerWindow){
        contentHost=node(doc,'div',null,{class:'pilami-window-content'});main.append(contentHost);
      }
      if(config.key==='hydra'){
        const tools=node(doc,'details',null,{class:'pilami-window-tools','data-window-preset-tools':''});
        const toolsKey=controllerWindow?'_pilamiWindowPresetToolsOpen':'_pilamiWindowCodePresetToolsOpen';
        tools.open=Boolean(root[toolsKey]);
        tools.append(node(doc,'summary',controllerWindow?'Photos et réglages du preset':'Preset · nom, photos, partage et catégories'));
        presetHost=node(doc,'div',null,{class:'pilami-window-tools-body'});tools.append(presetHost);contentHost.append(tools);
        tools.addEventListener('toggle',()=>{root[toolsKey]=tools.open;});
      }
      const placePreset=nodeToPlace=>{if(presetHost)presetHost.append(nodeToPlace);else doc.body.insertBefore(nodeToPlace,main);};
      const editor=root.querySelector(config.editor),source=kind==='code'?editor.closest('.pilami-strudel-editor-wrap'):root.querySelector(config.list);
      const session={key,config,kind,win,doc,editor,source,launcher,placeholder,play,status,rows:[],label:launcher.textContent};
      if(config.key==='hydra'){
        const resolutionHost=node(doc,'div',null,{'data-window-resolution':''});header.insertBefore(resolutionHost,nav);
        session.resolutionView=window.PilamiStrudelHydra.mountResolution(resolutionHost,{compact:true});
        const sourceImport=root.querySelector('[data-hydra-action="import"]'),sourceInput=root.querySelector('[data-hydra-import]');
        if(sourceImport&&sourceInput){
          session.presetImport=node(doc,'button','↑ Importer un preset',{type:'button','data-window-import-preset':'',title:'Importer un fichier Hydra (.hydra.txt, .txt ou .js) · Ctrl + I'});
          const picker=node(doc,'input',null,{type:'file',accept:sourceInput.accept||'.js,.txt','data-window-import-file':'',hidden:''});
          nav.insertBefore(session.presetImport,fullscreen);nav.append(picker);
          session.presetImport.addEventListener('click',()=>{if(!sourceImport.disabled){picker.value='';picker.click();}});
          picker.addEventListener('change',()=>{
            if(sourceImport.disabled||!picker.files.length){picker.value='';return;}
            // Open the native picker in this window, then reuse validation and WordPress saving.
            sourceInput.files=picker.files;
            sourceInput.dispatchEvent(new Event('change',{bubbles:true}));
            picker.value='';synchronizeAll();
          });
        }
        if(kind==='sliders'){
          session.presetReload=node(doc,'button','Recharger le preset',{type:'button','data-window-reload-preset':'',title:'Restaurer le code, les snapshots et le MIDI enregistrés, puis relancer le visuel. Les modifications non enregistrées sont remplacées.'});session.presetReload.disabled=true;nav.insertBefore(session.presetReload,stop);
          session.presetReload.addEventListener('click',async()=>{try{await root._pilamiHydraPresetActions?.reload();}finally{synchronizeAll();}});
        }
        const label=node(doc,'label','Nom du preset / essai',{class:'window-name'});
        session.nameField=node(doc,'input',null,{type:'text',maxlength:'100'});label.append(session.nameField);placePreset(label);
        session.nameField.addEventListener('input',()=>{const originalName=root.querySelector('[data-hydra-name]');originalName.value=session.nameField.value;originalName.dispatchEvent(new Event('input',{bubbles:true}));synchronizeAll();});
        session.presetCreate=node(doc,'button','＋ Créer un preset WordPress',{type:'button','data-window-create-preset':''});session.presetCreate.hidden=true;nav.insertBefore(session.presetCreate,fullscreen);
        session.presetCreate.addEventListener('click',()=>{root.querySelector('[data-hydra-action="create-preset"]').click();synchronizeAll();});
        session.presetUpdate=node(doc,'button','💾 Mettre à jour le preset',{type:'button','data-window-update-preset':''});
        session.presetUpdate.hidden=true;nav.insertBefore(session.presetUpdate,fullscreen);
        session.presetUpdate.addEventListener('click',()=>{root.querySelector('[data-hydra-action="update-preset"]').click();synchronizeAll();});
        session.presetDelete=node(doc,'button','🗑 Supprimer le preset',{type:'button','data-window-delete-preset':''});
        session.presetDelete.hidden=true;session.presetDelete.disabled=true;nav.insertBefore(session.presetDelete,fullscreen);
        session.presetDelete.addEventListener('click',()=>{root.querySelector('[data-hydra-action="delete-preset"]').click();synchronizeAll();});
        const sourceShare=root.querySelector('[data-action="copy-hydra-link"]'), sourceFeedback=root.querySelector('[data-hydra-share-feedback]');
        if(sourceShare&&sourceFeedback){
          session.presetShare=node(doc,'button','🔗 Partager ce preset',{type:'button','data-window-share-preset':''});placePreset(session.presetShare);
          session.shareFeedback=doc.importNode(sourceFeedback,true);placePreset(session.shareFeedback);
          session.presetShare.addEventListener('click',()=>{sourceShare.click();synchronizeAll();});
          session.shareFeedback.querySelector('[data-hydra-share-link]').addEventListener('click',event=>event.target.select());
        }
        if(root._pilamiHydraImages){
          const anchor=node(doc,'div',null,{'data-window-image-anchor':''});placePreset(anchor);
          session.imageView=root._pilamiHydraImages.view(anchor);
          const imageCSS=window.PilamiHydraImages.cssURL;
          if(imageCSS)doc.head.append(node(doc,'link',null,{rel:'stylesheet',href:imageCSS}));
        }
        const categories=root.querySelector('[data-hydra-preset-categories]');
        if(categories){
          session.categoryPanel=doc.importNode(categories,true);placePreset(session.categoryPanel);
          const css=document.querySelector('link[href*="pilami-categories-0.39.42.css"]') || document.querySelector('style[data-pilami-categories-style="0.39.42"]');
          if(css)doc.head.append(css.tagName==='LINK' ? node(doc,'link',null,{rel:'stylesheet',href:css.href}) : doc.importNode(css,true));
          session.categoryPanel.addEventListener('change',event=>{
            const id=event.target.dataset.hydraCategoryId;
            if(!id)return;
            const original=categories.querySelector('[data-hydra-category-id="'+id+'"]');
            if(original&&!categories.querySelector('fieldset').disabled){original.checked=event.target.checked;original.dispatchEvent(new Event('change',{bubbles:true}));}
            synchronizeAll();
          });
          session.categoryPanel.querySelector('[data-hydra-action="save-categories"]').addEventListener('click',()=>{categories.querySelector('[data-hydra-action="save-categories"]').click();synchronizeAll();});
          const deleteSelect=session.categoryPanel.querySelector('[data-hydra-category-delete-select]');
          if(deleteSelect){
            deleteSelect.addEventListener('change',()=>{const source=categories.querySelector('[data-hydra-category-delete-select]');source.value=deleteSelect.value;source.dispatchEvent(new Event('change',{bubbles:true}));synchronizeAll();});
            session.categoryPanel.querySelector('[data-hydra-action="delete-category"]').addEventListener('click',()=>{categories.querySelector('[data-hydra-action="delete-category"]').click();synchronizeAll();});
          }
          const categoryName=session.categoryPanel.querySelector('[data-hydra-category-name]');
          if(categoryName){
            categoryName.addEventListener('input',()=>{const source=categories.querySelector('[data-hydra-category-name]');source.value=categoryName.value;source.dispatchEvent(new Event('input',{bubbles:true}));synchronizeAll();});
            const create=session.categoryPanel.querySelector('[data-hydra-action="create-category"]');
            create.addEventListener('click',()=>{categories.querySelector('[data-hydra-action="create-category"]').click();synchronizeAll();});
            categoryName.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();create.click();}});
          }
        }

      }
      if(kind==='code'){
        const field=node(doc,'textarea',null,{spellcheck:'false',autocapitalize:'off',autocomplete:'off','aria-label':'Code '+config.title,'data-window-code':''});field.value=editor.value;main.prepend(field);session.field=field;
        field.addEventListener('input',()=>{editor.value=field.value;editor.setSelectionRange(field.selectionStart,field.selectionEnd);editor.dispatchEvent(new Event('input',{bubbles:true}));synchronizeAll();});
        field.addEventListener('keydown',event=>{
          if(event.key==='Tab'){event.preventDefault();field.setRangeText('  ',field.selectionStart,field.selectionEnd,'end');field.dispatchEvent(new win.Event('input',{bubbles:true}));}
        });
      }else{
        session.empty=node(doc,'p','Lance un preset avec des contrôleurs pour les ajuster ici en direct.',{'data-window-empty':''});
        session.content=node(doc,'div',null,{'data-window-sliders':''});
        if(config.key==='hydra')session.content.classList.add('pilami-strudel-lab');
        contentHost.append(session.empty,session.content);
      }
      sessions.set(key,session);source.classList.add('pilami-is-detached');placeholder.hidden=false;launcher.textContent='Rattacher '+(kind==='code'?'le code':config.key==='hydra'?'les contrôleurs':'les curseurs');launcher.setAttribute('aria-expanded','true');
      play.addEventListener('click',()=>{root.querySelector(config.play).click();synchronizeAll();});stop.addEventListener('click',()=>{root.querySelector(config.stop).click();synchronizeAll();});
      attach.addEventListener('click',()=>finish(session,true,true));
      fullscreen.addEventListener('click',async()=>{
        windowNotice.hidden=true;
        try{if(doc.fullscreenElement)await doc.exitFullscreen();else await doc.documentElement.requestFullscreen();}
        catch(_){windowNotice.textContent='Le plein écran est indisponible. Utilise F11 ou agrandis la fenêtre.';windowNotice.hidden=false;}
      });
      doc.addEventListener('fullscreenchange',()=>{fullscreen.textContent=doc.fullscreenElement?'Quitter le plein écran':'Plein écran';});
      doc.addEventListener('keydown',event=>{
        if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();if(!play.disabled)play.click();}
        else if(event.altKey&&event.key==='.'){event.preventDefault();stop.click();}
      });
      win.addEventListener('pagehide',()=>finish(session,false));
      window.PilamiShortcuts?.bindDocument(doc,root);
      synchronize(session);if(!timer)timer=setInterval(synchronizeAll,200);
      win.focus();if(session.field)session.field.focus();
      return session;
    }
    configurations.forEach(config=>{
      const space=root.querySelector(config.space),editor=root.querySelector(config.editor),bar=node(document,'div',null,{class:'pilami-detach-bar','aria-label':'Fenêtres '+config.title});
      bar.append(node(document,'span','Détacher :'));const placeholders=[];
      ['code','sliders'].forEach(kind=>{
        const launcher=node(document,'button',kind==='code'?'Code en fenêtre':config.key==='hydra'?'Contrôleurs en fenêtre':'Curseurs en fenêtre',{type:'button','data-detach':config.key+'-'+kind,'aria-expanded':'false'});
        const placeholder=node(document,'p',(kind==='code'?'Le code':config.key==='hydra'?'Les contrôleurs':'Les curseurs')+' '+config.title+(kind==='code'?' est':' sont')+' dans une fenêtre séparée.',{class:'pilami-detach-placeholder'});placeholder.hidden=true;
        bar.append(launcher);placeholders.push(placeholder);launcher.addEventListener('click',()=>open(config,kind,launcher,placeholder));
        launchers.set(config.key+'-'+kind,{config,kind,launcher,placeholder});
      });
      bar.append(...placeholders);
      const notice=node(document,'p','',{class:'pilami-detach-notice','data-windows-notice':config.key,role:'status','aria-live':'polite'});
      space.insertBefore(bar,editor.closest('.pilami-strudel-editor-wrap'));space.insertBefore(notice,bar.nextSibling);
    });
    root._pilamiWindows={
      ensure(key){const entry=launchers.get(key);return entry?open(entry.config,entry.kind,entry.launcher,entry.placeholder,true):null;}
    };
    window.PilamiShortcuts?.mount(root);
    // The 200 ms mirror timer handles live code values. User edits and preset
    // actions still synchronize immediately.
    root.addEventListener('input',event=>{if(!event.pilamiHydraLive)synchronizeAll();});root.addEventListener('pilami-code-change',synchronizeAll);
    root.addEventListener('pilami-hydra-controllers-change',synchronizeAll);
    root.addEventListener('pilami-hydra-preset-state',synchronizeAll);
    root.addEventListener('pilami-hydra-share-state',synchronizeAll);
    window.addEventListener('pagehide',()=>{for(const session of [...sessions.values()])finish(session);});
  }
  window.PilamiDetachable={mount};
})();
