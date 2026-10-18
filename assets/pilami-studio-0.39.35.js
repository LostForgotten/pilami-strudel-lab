// Pilami Studio window palette sharing. AGPL-3.0-or-later.
(function(){
  'use strict';
  const cssURL=new URL('pilami-studio-0.39.35.css',document.currentScript?.src||location.href).href;
  function theme(){return document.documentElement.dataset.pilamiTheme||(getComputedStyle(document.documentElement).colorScheme.includes('dark')?'dark':'light');}
  function apply(doc,root){
    if(doc===document)return;
    doc.body.classList.add('pilami-studio-window');
    if(!doc.querySelector('[data-pilami-studio-style]')){
      const embedded=document.querySelector('style[data-pilami-studio-style]');
      const style=doc.createElement(embedded?'style':'link');style.dataset.pilamiStudioStyle='';
      if(embedded)style.textContent=embedded.textContent;else{style.rel='stylesheet';style.href=cssURL;}
      doc.head.append(style);
    }
    const sheet=doc.querySelector('[data-pilami-studio-style]');if(sheet&&doc.head.lastElementChild!==sheet)doc.head.append(sheet);
    const currentTheme=theme();doc.documentElement.dataset.pilamiTheme=currentTheme;
    const source=getComputedStyle(root);
    for(const name of ['--pilami-panel-bg','--pilami-panel-text','--pilami-editor-bg','--pilami-editor-text','--pilami-accent']){const value=source.getPropertyValue(name).trim();if(value)doc.documentElement.style.setProperty(name,value);}
    doc.documentElement.style.colorScheme=currentTheme;
  }
  window.PilamiStudio={apply,theme,cssURL};
})();
