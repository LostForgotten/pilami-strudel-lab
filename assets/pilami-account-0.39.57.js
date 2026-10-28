// WordPress account indicator. No identity, nonce or permission is inferred from cached HTML.
(function(){
 'use strict';
 function mount(root){
  const button=root.querySelector('[data-pilami-account]');
  if(!button||root.dataset.offline==='1'||root._pilamiAccount)return;
  let endpoint;try{endpoint=new URL(root.dataset.accountApi,location.href);if(endpoint.origin!==location.origin)return;}catch(_){return;}
  let seen=false,checking=false,disposed=false,lastCheck=0,controller=null,timer=null;
  function show(state,label){
   button.hidden=!seen;button.dataset.state=state;
   button.title=label+' · Cliquer pour vérifier';button.setAttribute('aria-label',button.title);
   button.querySelector('[data-account-label]').textContent=label;
   root.dataset.accountVisible=seen?'1':'0';
  }
  async function check(force=false){
   if(disposed||checking||document.hidden||(!force&&Date.now()-lastCheck<15000))return;
   if(!root.isConnected){dispose();return;}
   checking=true;lastCheck=Date.now();controller=new AbortController();
   show('checking','Vérification de la connexion WordPress');
   const timeout=window.setTimeout(()=>controller?.abort(),8000);
   try{
    const url=new URL(endpoint);url.searchParams.set('action','pilami_strudel_connection');url.searchParams.set('_',String(Date.now()));
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
    const result=await response.json(),state=result.data;
    if(!response.ok||result.success!==true||typeof state?.authenticated!=='boolean'||typeof state.admin!=='boolean')throw Error('Session indisponible');
    if(disposed)return;
    if(state.authenticated){seen=true;show('connected',state.admin?'Connecté à WordPress · Administrateur':'Connecté à WordPress');}
    else show('disconnected','Déconnecté de WordPress');
   }catch(_){if(!disposed)show('unknown','Connexion WordPress à vérifier');}
   finally{window.clearTimeout(timeout);checking=false;controller=null;}
  }
  function onFocus(){check();}
  function onVisibility(){if(!document.hidden)check(true);}
  function onClick(){check(true);}
  function onHide(e){if(!e.persisted)dispose();}
  function dispose(){if(disposed)return;disposed=true;window.clearInterval(timer);controller?.abort();button.removeEventListener('click',onClick);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('pagehide',onHide);}
  button.addEventListener('click',onClick);window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onVisibility);window.addEventListener('pagehide',onHide);
  timer=window.setInterval(()=>check(),120000);root._pilamiAccount={check,dispose};check(true);
 }
 function start(){document.querySelectorAll('[data-pilami-strudel][data-account-api]').forEach(mount);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
