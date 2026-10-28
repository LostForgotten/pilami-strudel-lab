// Fold the existing site header into a disclosure; keep its nodes and theme listeners.
(function(){
 'use strict';
 function mount(root){
  if(root._pilamiSiteMenu||root.dataset.offline==='1')return;
  const header=document.getElementById('header');if(!header||root.contains(header)||header.contains(root))return;
  // Blocksy measures a horizontal header and can hide all links under “More”
  // when this disclosure is closed. Its vertical menu needs no overflow folding.
  const navStates=new Map();
  function unfoldMenus(){for(const nav of header.querySelectorAll('nav[data-id^="menu"]')){
   if(!navStates.has(nav))navStates.set(nav,nav.getAttribute('data-responsive'));
   nav.removeAttribute('data-responsive');
   for(const more of nav.querySelectorAll('.more-items-container')){const list=more.querySelector(':scope > .sub-menu');if(list)for(const item of [...list.children])more.before(item);more.remove();}
  }}
  unfoldMenus();
  const menuObserver=new MutationObserver(unfoldMenus);menuObserver.observe(header,{subtree:true,childList:true,attributes:true,attributeFilter:['data-responsive']});
  const marker=document.createComment('Pilami site header position');header.before(marker);
  const button=document.createElement('button'),panel=document.createElement('div');
  const id='pilami-site-menu-'+Math.random().toString(36).slice(2);
  button.type='button';button.className='pilami-site-menu-toggle';button.dataset.siteMenuToggle='';
  button.title='Menu et recherche du site';button.setAttribute('aria-label',button.title);button.setAttribute('aria-controls',id);button.setAttribute('aria-expanded','false');
  button.innerHTML='<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="2.5" width="14" height="15" rx="1.2"/><path d="M5.5 6h9M5.5 10h9M5.5 14h9"/></svg>';
  panel.id=id;panel.className='pilami-site-menu-panel';panel.dataset.siteMenuPanel='';panel.setAttribute('role','region');panel.setAttribute('aria-label','Menu et recherche du site');panel.hidden=true;panel.inert=true;
  root.prepend(button,panel);panel.append(header);root.dataset.siteMenuReady='1';
  let open=false,disposed=false;
  function themeModalOpen(){return [...document.querySelectorAll('.ct-panel:not([inert])')].some(el=>!panel.contains(el)&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');}
  function close(restoreFocus=false){if(!open)return;open=false;panel.hidden=true;panel.inert=true;button.setAttribute('aria-expanded','false');if(restoreFocus)button.focus();}
  function show(focus=false){if(disposed)return;open=true;panel.hidden=false;panel.inert=false;button.setAttribute('aria-expanded','true');if(focus)panel.querySelector('a[href],button:not([disabled]),input:not([disabled])')?.focus();}
  function toggle(e){if(open)close();else show(e.detail===0);}
  function outside(e){if(open&&!panel.contains(e.target)&&!button.contains(e.target)&&!themeModalOpen())close();}
  function escape(e){if(e.key!=='Escape'||!open||themeModalOpen())return;e.preventDefault();e.stopPropagation();close(true);}
  function focus(e){if(open&&!panel.contains(e.target)&&e.target!==button&&!themeModalOpen())close();}
  function onHide(e){close();if(!e.persisted)dispose();}
  function dispose(){if(disposed)return;disposed=true;close();menuObserver.disconnect();for(const[nav,value]of navStates){if(value===null)nav.removeAttribute('data-responsive');else nav.setAttribute('data-responsive',value);}button.removeEventListener('click',toggle);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);document.removeEventListener('focusin',focus);window.removeEventListener('pagehide',onHide);if(marker.parentNode)marker.replaceWith(header);button.remove();panel.remove();delete root.dataset.siteMenuReady;delete root._pilamiSiteMenu;}
  button.addEventListener('click',toggle);document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);document.addEventListener('focusin',focus);window.addEventListener('pagehide',onHide);
  root._pilamiSiteMenu={open:show,close,dispose};
 }
 function start(){const root=document.querySelector('[data-pilami-strudel]');if(root)mount(root);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
