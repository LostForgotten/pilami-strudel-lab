/* Pilami session connections. AGPL-3.0-or-later. */
(() => {
  'use strict';
  const roots=document.querySelectorAll('[data-pilami-strudel]');
  for(const root of roots) {
    const toolbar=root.querySelector('[data-pilami-connections]');if(!toolbar)continue;
    const audio=root.querySelector('[data-connection="audio"]'),midi=root.querySelector('[data-connection="midi"]');
    const audioButton=audio.querySelector('button'),midiButton=midi.querySelector('button');
    function paint(group,button,{active,busy,error,message},label) {
      group.dataset.state=busy?'connecting':error?'error':active?'connected':'offline';
      group.querySelector('[data-connection-status]').textContent=message;
      button.disabled=!!busy;button.setAttribute('aria-pressed',String(!!active));
      button.textContent=busy?'Connexion…':(active?'Désactiver ':'Activer ')+label;
      button.title=(active?'Désactiver ':'Activer ')+label+' · '+message;
    }
    const refreshAudio=()=>paint(audio,audioButton,window.PilamiStrudelHydra.inputState,'l’audio');
    const refreshMidi=()=>{
      const state=window.PilamiHydraMidi.state;
      const message=state.busy?'Autorisation…':state.error?state.message:!state.enabled?'Désactivé':state.inputs.length?state.inputs.length+' entrée'+(state.inputs.length>1?'s':''):'Actif · aucune entrée';
      paint(midi,midiButton,{active:state.enabled,busy:state.busy,error:state.error,message},'le MIDI');
    };
    audioButton.addEventListener('click',async()=>{
      const api=window.PilamiStrudelHydra;
      try {if(api.inputState.active)api.disableInputAudio();else await api.enableInputAudio();}
      catch(_) {/* The input state carries a readable permission/device error. */}
      refreshAudio();
    });
    midiButton.addEventListener('click',()=>{
      const api=window.PilamiHydraMidi;if(api.state.enabled)api.disconnect();else api.connect();
    });
    window.addEventListener('pilami-audio-input-change',refreshAudio);
    const unsubscribe=window.PilamiHydraMidi.subscribe(refreshMidi);
    const link=toolbar.querySelector('[data-pilami-link-bar]'),button=link?.querySelector('[data-link-connect]');
    const refreshLink=()=>{
      if(!button)return;
      button.setAttribute('aria-pressed',String(link.dataset.state==='connected'));
      button.title=button.textContent+' · '+link.querySelector('[data-link-status]').textContent;
    };
    const observer=new MutationObserver(refreshLink);
    if(link)observer.observe(link,{attributes:true,attributeFilter:['data-state'],childList:true,subtree:true,characterData:true});
    refreshAudio();refreshMidi();refreshLink();
    window.addEventListener('pagehide',()=>{window.removeEventListener('pilami-audio-input-change',refreshAudio);unsubscribe();observer.disconnect();},{once:true});
  }
})();
