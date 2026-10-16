(function(){
  'use strict';
  const TYPES=new Set(['image/jpeg','image/png','image/webp','image/gif']);
  const LIMIT=10*1024*1024;
  function safeURL(value){const url=new URL(value,location.href);if(!['http:','https:'].includes(url.protocol))throw new Error('Utilise une URL http ou https directe vers une image.');if(location.protocol==='https:'&&url.protocol!=='https:')throw new Error('Utilise une image en https.');return url.href;}
  function decode(url){return new Promise((resolve,reject)=>{
    const img=new Image(),timer=setTimeout(()=>{img.src='';reject(new Error('Le chargement de l’image a pris trop de temps. Choisis un fichier ou une autre URL.'));},15000);
    img.crossOrigin='anonymous';img.onload=()=>{clearTimeout(timer);if(!img.naturalWidth||!img.naturalHeight)return reject(new Error('Cette image est vide.'));resolve(img);};
    img.onerror=()=>{clearTimeout(timer);reject(new Error('Image inaccessible : vérifie son URL ou choisis un fichier depuis ton ordinateur.'));};img.src=url;
  });}
  function prepare(img){
    const factor=Math.min(1,2048/img.naturalWidth,2048/img.naturalHeight),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    const thumb=document.createElement('canvas');thumb.width=96;thumb.height=Math.max(1,Math.round(96*canvas.height/canvas.width));thumb.getContext('2d').drawImage(canvas,0,0,thumb.width,thumb.height);
    return {canvas,preview:thumb.toDataURL('image/png')};
  }
  function mount(root,{getCode,getKey,getDescriptor,writeURL}){
    const views=new Set(),locals=new Map();let session=null,binding=null,loading=0,busy=false,uploading=false;
    let state={show:false,key:'',url:'',file:null,prepared:null,message:'',error:false};
    const notify=()=>{for(const view of views)view.render();};
    const say=(message,error=false)=>{state.message=message;state.error=error;notify();};
    function context(url){return getKey()+'\0'+url;}
    function setContext(url){const key=context(url);if(state.key!==key){const local=locals.get(key);state={show:true,key,url,file:local?.file||null,prepared:local?.prepared||null,message:'',error:false};}else state.show=true;notify();return key;}
    function apply(prepared,current=binding){
      if(!current||current!==binding||current.key!==state.key)return false;
      current.check();
      const previous=current.source.tex;
      current.source.init({src:prepared.canvas,dynamic:false},{mag:'linear',min:'linear'});
      if(previous&&previous!==current.source.tex)previous.destroy();
      return true;
    }
    async function load(source,url,check){
      if(source!==window.s0)throw new Error('imageSource utilise s0 pour le panneau Image source.');
      if(typeof url!=='string')throw new Error('imageSource attend une URL d’image entre guillemets.');
      const key=setContext(url),current=binding={source,key,check},ticket=++loading;busy=true;notify();
      try{
        let prepared=locals.get(key)?.prepared;
        if(!prepared)prepared=prepare(await decode(safeURL(url)));
        if(ticket!==loading||current!==binding)return;
        state.prepared=prepared;apply(prepared,current);
        say(state.file?'Image locale : '+state.file.name+' · Non enregistrée dans WordPress.':'Image du script chargée.');
      }catch(error){if(ticket===loading&&current===binding){
        state.prepared=null;const previous=current.source.tex;current.source.clear();if(previous&&previous!==current.source.tex)previous.destroy();say(error.message,true);
      }}
      finally{if(ticket===loading){busy=false;notify();}}
    }
    async function choose(file){
      if(!file)return;
      const descriptor=getDescriptor();if(!descriptor)return say('Lance un script utilisant imageSource(s0, URL).',true);
      setContext(descriptor.url);const key=state.key,ticket=++loading;busy=true;notify();
      let objectURL;
      try{
        if(!TYPES.has(file.type)||file.size>LIMIT)throw new Error('Choisis une image JPG, PNG, WebP ou GIF de 10 Mo maximum.');
        objectURL=URL.createObjectURL(file);const prepared=prepare(await decode(objectURL));
        if(ticket!==loading||state.key!==key)return;
        locals.delete(key);locals.set(key,{file,prepared});
        while(locals.size>4)locals.delete(locals.keys().next().value);
        state.file=file;state.prepared=prepared;
        const live=apply(prepared);say('Image locale : '+file.name+(live?' · Aperçu actif.':' · Clique sur Hydra / Update pour l’appliquer.')+' Pour la conserver avec le preset, enregistre-la dans WordPress.');
      }catch(error){if(ticket===loading)say(error.message,true);}
      finally{if(objectURL)URL.revokeObjectURL(objectURL);if(ticket===loading){busy=false;notify();}}
    }
    async function original(){
      if(busy||uploading)return;locals.delete(state.key);state.file=null;state.prepared=null;
      if(binding)await load(binding.source,state.url,binding.check);else say('Image locale retirée. Clique sur Hydra / Update pour charger l’image du script.');
    }
    function useURL(value){
      if(busy||uploading)return;
      try{const url=safeURL(value),code=getCode();locals.delete(state.key);if(!writeURL(url,code))throw new Error('Le script a changé. Relance-le avant de changer son image.');say('URL ajoutée au code. Clique sur Hydra / Update, puis enregistre le preset pour la conserver.');}
      catch(error){say(error.message,true);}
    }
    async function upload(){
      if(!session?.allowed||!session.media_api||!state.file||busy||uploading)return;
      const key=state.key,file=state.file,code=getCode(),auth=session;
      uploading=true;notify();say('Enregistrement de l’image dans WordPress…');
      try{
        const form=new FormData();form.append('file',file,file.name);
        const response=await fetch(auth.media_api,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'X-WP-Nonce':auth.nonce},body:form});
        const result=await response.json();
        if(!response.ok)throw new Error(response.status===401||response.status===403?'Ta session WordPress ne permet pas cet enregistrement. Reconnecte-toi ; l’aperçu local reste disponible.':result.message||'Impossible d’enregistrer cette image dans WordPress.');
        if(result.media_type!=='image'||typeof result.source_url!=='string')throw new Error('La réponse WordPress ne contient pas une image valide.');
        const url=safeURL(result.source_url);
        if(key!==state.key||getCode()!==code){if(key===state.key)say('Image enregistrée dans WordPress, mais ton code a changé. Copie son URL depuis la médiathèque pour l’utiliser.');return;}
        locals.delete(key);
        if(!writeURL(url,code))throw new Error('Image enregistrée dans WordPress. Le code a changé : utilise son URL depuis la médiathèque.');
        say('Image enregistrée dans WordPress et URL ajoutée au code. Clique sur Hydra / Update, puis sur Mettre à jour le preset ou Créer un preset WordPress.');
      }catch(error){if(key===state.key)say(error.message,true);}
      finally{uploading=false;notify();}
    }
    function view(container){
      const doc=container.ownerDocument,details=doc.createElement('details');details.className='pilami-image-source';details.dataset.hydraImagePanel='';
      details.innerHTML='<summary>Image source · s0</summary><div class="pilami-image-preview"><img data-image-preview alt="Image utilisée par le visuel"><p data-image-status role="status" aria-live="polite"></p></div><div class="pilami-image-actions"><button type="button" data-image-choose>Choisir une image…</button><input type="file" data-image-file accept="image/jpeg,image/png,image/webp,image/gif" hidden><button type="button" data-image-original>Revenir à l’image du script</button><button type="button" data-image-upload hidden>Enregistrer l’image dans WordPress</button></div><label class="pilami-image-url">URL directe de l’image<input type="url" data-image-url placeholder="https://…/photo.jpg"></label><button type="button" data-image-use-url>Utiliser cette URL dans le code</button><p class="pilami-image-help">Le fichier choisi sert d’aperçu local. Pour le retrouver avec ton preset, enregistre l’image dans WordPress, puis le preset. JPG, PNG, WebP, GIF · 10 Mo max.</p>';
      const $=selector=>details.querySelector(selector),field=$('[data-image-file]'),url=$('[data-image-url]');let displayedURL=null;
      $('[data-image-choose]').addEventListener('click',()=>field.click());field.addEventListener('change',()=>{choose(field.files[0]);field.value='';});
      $('[data-image-original]').addEventListener('click',original);$('[data-image-upload]').addEventListener('click',upload);$('[data-image-use-url]').addEventListener('click',()=>useURL(url.value));
      const instance={render(){
        details.hidden=!state.show;
        const preview=$('[data-image-preview]');preview.hidden=!state.prepared;if(state.prepared&&preview.src!==state.prepared.preview)preview.src=state.prepared.preview;
        const status=$('[data-image-status]');status.textContent=state.message||'Lance le visuel pour charger son image, ou choisis une image locale.';status.classList.toggle('is-error',state.error);
        if(displayedURL!==state.url){url.value=state.url;displayedURL=state.url;}
        for(const button of details.querySelectorAll('button'))button.disabled=busy||uploading;
        url.disabled=busy||uploading;$('[data-image-original]').disabled=busy||uploading||!state.file;
        const save=$('[data-image-upload]');save.hidden=!session?.allowed||!session.media_api;save.disabled=busy||uploading||!state.file;save.textContent=uploading?'Enregistrement…':'Enregistrer l’image dans WordPress';
      },dispose(){views.delete(instance);details.remove();}};container.append(details);views.add(instance);instance.render();return instance;
    }
    const anchor=document.createElement('div');anchor.dataset.hydraImageAnchor='';root.querySelector('[data-hydra-code]').closest('.pilami-strudel-editor-wrap').before(anchor);view(anchor);
    const api={load,view,setSession(auth){session=auth;notify();},end(){loading++;busy=false;binding=null;const descriptor=getDescriptor();if(descriptor)setContext(descriptor.url);else{state.show=false;notify();}}};
    window.addEventListener('pagehide',()=>{api.end();locals.clear();});return api;
  }
  window.PilamiHydraImages={mount};
})();
