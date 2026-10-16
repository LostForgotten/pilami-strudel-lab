// Pilami Hydra VJ, standalone browser host. AGPL-3.0-or-later.
(function(){
  'use strict';
  const root=document.querySelector('[data-pilami-strudel]'),stage=document.querySelector('[data-offline-stage]');
  let canvas=null,resize=null,popup=null;
  function size(){
    if(!canvas || !resize)return;
    const rect=(popup&&!popup.closed?popup.document.body:stage).getBoundingClientRect();
    resize(Math.max(1,Math.round(rect.width)),Math.max(1,Math.round(rect.height)));
  }
  window.strudel={hush(){},getTime:()=>performance.now()/1000};
  window.PilamiStrudelVisuals={
    activate(){},
    ensureOutput:openProjection,
    attachHydra(next,feed,callback){canvas=next;resize=callback;if(next){(popup&&!popup.closed?popup.document.body:stage).append(next);requestAnimationFrame(size);}},
    present(){},
    animationHost:()=>popup&&!popup.closed?popup:window
  };
  new ResizeObserver(size).observe(stage);
  window.addEventListener('resize',size);
  document.querySelector('[data-offline-fullscreen]').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}
    catch(error){document.querySelector('[data-offline-note]').textContent=error.message;}
  });
  function returnProjection(){
    if(!popup)return;
    const wasRunning=window.PilamiStrudelHydra.isRunning();
    window.PilamiStrudelHydra.pause();popup=null;
    if(canvas)stage.append(canvas);size();
    if(wasRunning)window.PilamiStrudelHydra.resume();
  }
  function openProjection(){
    if(popup&&!popup.closed){popup.focus();return {win:popup,doc:popup.document};}
    const win=window.open('','pilami-hydra-vj-projection','popup,width=1280,height=720');
    if(!win){document.querySelector('[data-offline-note]').textContent='Autorise les fenêtres séparées dans ton navigateur.';return;}
    const doc=win.document;doc.open();doc.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Pilami · Projection Hydra</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}canvas{display:block;width:100%;height:100%;object-fit:contain}button{position:fixed;right:12px;top:12px;z-index:2;padding:10px;color:white;background:#222;border:1px solid #888;border-radius:8px;cursor:pointer}button:hover{opacity:1}button{opacity:.3}</style></head><body><button type="button">Plein écran</button></body></html>');doc.close();
    doc.querySelector('button').addEventListener('click',async()=>{try{if(doc.fullscreenElement)await doc.exitFullscreen();else await doc.documentElement.requestFullscreen();}catch(_){}});
    const wasRunning=window.PilamiStrudelHydra.isRunning();window.PilamiStrudelHydra.pause();popup=win;
    if(canvas)doc.body.append(canvas);size();
    if(wasRunning)window.PilamiStrudelHydra.resume();
    win.addEventListener('resize',size);win.addEventListener('pagehide',returnProjection);
    window.PilamiShortcuts?.bindDocument(doc,root);
    win.focus();
    return {win,doc};
  }
  document.querySelector('[data-offline-project]').addEventListener('click',openProjection);
  window.addEventListener('pagehide',()=>{popup?.close();});
  document.querySelector('[data-offline-toggle]').addEventListener('click',event=>{
    const layout=document.querySelector('[data-offline-layout]'),hidden=layout.classList.toggle('editor-hidden');
    event.target.textContent=hidden?'Afficher l’éditeur':'Masquer l’éditeur';event.target.setAttribute('aria-expanded',String(!hidden));
  });
  const pack=JSON.parse(document.querySelector('[data-offline-pack]').textContent);
  const catalog=Array.isArray(pack.catalog)?pack.catalog:JSON.parse(document.querySelector('[data-offline-demo]').textContent);
  document.querySelector('[data-hydra-catalog]').textContent=JSON.stringify(catalog);
  const identity=String(pack.exportId || 'demonstration'),storageKey='pilami-hydra-offline-v1:'+identity;
  root.dataset.hydraStorageKey=storageKey;
  try{
    if(!localStorage.getItem(storageKey)){
      const draftKey=location.pathname+':0';
      localStorage.setItem(storageKey,JSON.stringify({items:Array.isArray(pack.items)?pack.items:[],drafts:pack.draft?{[draftKey]:pack.draft}:{}}));
    }
  }catch(_){}
  window.PilamiHydraSnapshots.seed(storageKey,pack.snapshots);
  root._pilamiHydraWorkspace=window.PilamiHydraWorkspace.mount(root);
  window.PilamiDetachable.mount(root);
  window.PilamiHydraDesigner.mount(root);
  window.PilamiInterface.mount(root);
  document.querySelector('[data-offline-sources-button]').addEventListener('click',()=>{
    const blob=new Blob([document.querySelector('[data-offline-sources]').textContent],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='Pilami-Hydra-VJ-sources-0.39.14.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  });
})();
