// Progressive presentation of the existing workspaces. AGPL-3.0-or-later.
(function(){
  'use strict';
  const node=(tag,text,attrs={})=>{const el=document.createElement(tag);if(text!==null)el.textContent=text;for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);return el;};
  function section(title,key){
    const details=node('details',null,{class:'pilami-interface-section','data-interface-section':key});
    details.append(node('summary',title));return details;
  }
  function mount(root){
    if(root.dataset.interfaceMounted)return;root.dataset.interfaceMounted='1';
    for(const key of ['strudel','hydra']){
      const space=root.querySelector('[data-'+key+'-space]');
      if(!space||key==='strudel'&&root.dataset.offline==='1')continue;
      const hydra=key==='hydra',editor=space.querySelector(hydra?'[data-hydra-code]':'[data-code]');
      if(!editor)continue;
      const wrap=editor.closest('.pilami-strudel-editor-wrap');
      // Move the original nodes; listeners and the canonical editor stay intact.
      const code=section(hydra?'Modifier le code du visuel':'Modifier le code de la musique',key+'-code');
      wrap.before(code);
      code.append(node('p','Modifie le code, puis applique tes changements avec le bouton de lecture ou Ctrl + Entrée.',{class:'pilami-interface-help'}));
      const image=space.querySelector('[data-hydra-image-anchor]');if(image)code.before(image);
      code.append(wrap);
      const gm=space.querySelector('[data-interface-gm]');if(gm)code.append(gm);
      const controls=space.querySelector(hydra?'[data-hydra-sliders]':'[data-sliders]');
      if(controls)code.before(controls);

      const tools=section('Sauvegarder et partager',key+'-saves'),actions=node('div',null,{class:'pilami-interface-actions'});
      const transport=space.querySelector('.pilami-strudel-transport');
      if(transport){
        for(const button of Array.from(transport.querySelectorAll('button'))){
          const action=button.dataset.hydraAction||button.dataset.action;
          if(!['play','stop','reset'].includes(action))actions.append(button);
        }
        const reset=transport.querySelector(hydra?'[data-hydra-action="reset"]':'[data-action="reset"]');
        if(reset){reset.textContent='↺ Revenir au preset';code.append(reset);}
      }
      tools.append(actions);
      if(hydra){
        const presets=space.querySelector('[data-hydra-presets]');
        const library=node('div',null,{class:'pilami-preset-library','data-hydra-library':''});
        const browser=node('div',null,{class:'pilami-preset-browser'});
        const inspector=node('div',null,{class:'pilami-preset-inspector','data-hydra-preset-inspector':'','aria-label':'Preset sélectionné'});
        presets.before(library);library.append(browser,inspector);browser.append(presets);
        inspector.append(node('h3','Preset sélectionné'));
        const identity=node('div',null,{class:'pilami-preset-identity'});inspector.append(identity);
        const name=space.querySelector('.pilami-hydra-name-field');if(name)identity.append(name);
        const note=space.querySelector('[data-hydra-preset-note]');if(note)identity.append(note);
        const categories=space.querySelector('[data-hydra-preset-categories]');
        if(categories){categories.open=true;inspector.append(categories);}
        const presetActions=node('div',null,{class:'pilami-interface-actions'});identity.append(presetActions);
        for(const action of ['import','import-update','update-preset','create-preset','delete-preset']){
          const selector='[data-hydra-action="'+action+'"]';
          const button=space.querySelector(selector) || actions.querySelector(selector);if(button){if(action==='import'){button.textContent='↑ Importer un preset';button.title='Importer un fichier Hydra (.hydra.txt, .txt ou .js) · Ctrl + I';}presetActions.append(button);}
        }
        const share=space.querySelector('[data-action="copy-hydra-link"]') || actions.querySelector('[data-action="copy-hydra-link"]');
        if(share){
          share.textContent='🔗 Partager ce preset';share.title='Créer un lien vers le code et les réglages actuels du visuel';
          share.hidden=root.dataset.offline==='1';presetActions.prepend(share);
        }
        const exportPreset=space.querySelector('[data-hydra-action="export"]');
        if(exportPreset){exportPreset.textContent='↓ Exporter le preset';presetActions.append(exportPreset);}
        const feedback=space.querySelector('[data-hydra-share-feedback]');if(feedback)identity.append(feedback);
        const filter=space.querySelector('[data-hydra-category]');
        if(filter){const caption=filter.closest('label')?.firstChild;if(caption?.nodeType===3)caption.textContent='Filtrer par catégorie ';}

      }
      const saves=space.querySelector('details.pilami-strudel-tools');
      if(saves){
        // Keep the existing visibility preference and avoid nested disclosure boxes.
        const body=node('div',null,{class:'pilami-interface-save-body'});body.hidden=saves.hidden;
        for(const child of Array.from(saves.children))if(child.tagName!=='SUMMARY')body.append(child);
        tools.append(body);saves.remove();
      }
      space.append(tools);
      const recording=space.querySelector('.pilami-recording');
      if(recording){
        const audio=section('Enregistrer la musique en WAV',key+'-recording');
        audio.hidden=recording.hidden;recording.before(audio);audio.append(recording);
      }
      const bar=space.querySelector('.pilami-detach-bar');
      if(bar){
        const windows=section('Fenêtres et outils avancés',key+'-windows');
        space.append(windows);windows.append(bar);
        for(const panel of space.querySelectorAll('[data-shortcuts-panel],[data-shortcut-status]'))windows.append(panel);
        const caption=bar.querySelector(':scope > span');if(caption)caption.textContent='Ouvrir séparément :';
        const notice=space.querySelector('[data-windows-notice]');if(notice)windows.append(notice);
        // A popup error must remain visible even when its launcher group is closed.
        if(notice)new MutationObserver(()=>{if(notice.textContent.trim())windows.open=true;}).observe(notice,{childList:true,subtree:true,characterData:true});
      }
      const mic=space.querySelector('[data-hydra-mic-anchor]');
      if(mic){const audio=section('Entrée audio · connexion et réglages',key+'-audio');space.append(audio);audio.append(mic);const panel=space.querySelector('[data-hydra-audio]');if(panel)audio.append(panel);}
      const heading=space.querySelector('h2');
      if(heading){
        const help=node('p','Choisis un preset, clique sur '+(hydra?'Lancer le visuel':'Lancer la musique')+', puis ajuste les contrôleurs.',{class:'pilami-interface-help pilami-interface-start'});
        heading.after(help);
        const next=help.nextElementSibling;
        if(hydra&&next?.matches('p.pilami-strudel-muted'))next.remove();
      }
    }
  }
  window.PilamiInterface={mount};
})();
