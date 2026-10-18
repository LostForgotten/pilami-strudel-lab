(function(){
  'use strict';
  const TYPES=new Set(['image/jpeg','image/png','image/webp','image/gif']);
  const LIMIT=10*1024*1024;
  const PHOTO_PREFIX='pilami-photo:';
  let databasePromise;
  function database(){
    if(!databasePromise)databasePromise=new Promise((resolve,reject)=>{
      if(!window.indexedDB)return reject(Error('Le stockage des photos est indisponible dans ce navigateur.'));
      const request=indexedDB.open('pilami-hydra-photos-v1',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('photos',{keyPath:'id'});
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(Error('Impossible d’ouvrir la photothèque locale.'));
      request.onblocked=()=>reject(Error('Ferme les autres onglets Pilami pour ouvrir la photothèque.'));
    });
    return databasePromise;
  }
  async function photoStore(mode,action){
    const db=await database();
    return new Promise((resolve,reject)=>{
      const transaction=db.transaction('photos',mode),request=action(transaction.objectStore('photos'));
      transaction.oncomplete=()=>resolve(request.result);
      transaction.onerror=transaction.onabort=()=>reject(Error('Enregistrement local impossible : espace insuffisant ou stockage du navigateur indisponible.'));
    });
  }
  const validPhoto=record=>record&&typeof record.id==='string'&&/^[a-f0-9-]{36}$/i.test(record.id)&&typeof record.name==='string'&&record.file instanceof Blob&&TYPES.has(record.file.type)&&record.file.size<=LIMIT&&typeof record.preview==='string'&&record.preview.startsWith('data:image/png;');
  const photoURL=record=>PHOTO_PREFIX+record.id;
  function fileData(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Impossible de lire une photo pour le pack VJ.'));reader.readAsDataURL(file);});}
  function safeURL(value){const url=new URL(value,location.href);if(!['http:','https:'].includes(url.protocol))throw new Error('Utilise une URL http ou https directe vers une image.');if(location.protocol==='https:'&&url.protocol!=='https:')throw new Error('Utilise une image en https.');return url.href;}
  function decode(url){return new Promise((resolve,reject)=>{
    const img=new Image(),timer=setTimeout(()=>{img.src='';reject(new Error('Le chargement de l’image a pris trop de temps. Choisis un fichier ou une autre URL.'));},15000);
    img.crossOrigin='anonymous';img.onload=()=>{clearTimeout(timer);if(!img.naturalWidth||!img.naturalHeight)return reject(new Error('Cette image est vide.'));resolve(img);};
    img.onerror=()=>{clearTimeout(timer);reject(new Error('Image inaccessible : vérifie son URL ou choisis un fichier depuis ton ordinateur.'));};img.src=url;
  });}
  function prepare(img){
    const factor=Math.min(1,2048/img.naturalWidth,2048/img.naturalHeight),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    const thumb=document.createElement('canvas'),ratio=Math.min(96/canvas.width,96/canvas.height);thumb.width=Math.max(1,Math.round(canvas.width*ratio));thumb.height=Math.max(1,Math.round(canvas.height*ratio));thumb.getContext('2d').drawImage(canvas,0,0,thumb.width,thumb.height);
    return {canvas,preview:thumb.toDataURL('image/png')};
  }
  function mount(root,{getCode,getKey,getDescriptor,writeURL,createPhotoPreset}){
    const views=new Set(),locals=new Map(),photos=new Map();let galleryVersion=0;let session=null,binding=null,loading=0,busy=false,uploading=false,importing=false;
    let state={show:true,key:'',url:'',file:null,prepared:null,message:'',error:false};
    const notify=()=>{for(const view of views)view.render();};
    const say=(message,error=false)=>{state.message=message;state.error=error;notify();};
    // Only explicitly exported, referenced photos travel with a VJ pack.
    const ready=(async()=>{
      try{for(const record of await photoStore('readonly',store=>store.getAll()))if(validPhoto(record))photos.set(record.id,record);}
      catch(error){say(error.message,true);}
      try{
        const embedded=JSON.parse(document.querySelector('[data-offline-pack]')?.textContent||'{}').photos;
        for(const item of Array.isArray(embedded)?embedded:[]){
          if(!item||typeof item.data!=='string'||item.data.length>Math.ceil(LIMIT*4/3)+100||!/^data:image\/(?:jpeg|png|webp|gif);base64,/.test(item.data))continue;
          const bytes=Uint8Array.from(atob(item.data.slice(item.data.indexOf(',')+1)),c=>c.charCodeAt(0));
          const record={...item,file:new File([bytes],item.name,{type:item.data.slice(5,item.data.indexOf(';'))})};delete record.data;
          if(validPhoto(record))photos.set(record.id,record);
        }
      }catch(_){say('Une photo du pack VJ est illisible. Réimporte son fichier.',true);}
      galleryVersion++;notify();
    })();
    async function preparedPhoto(record){
      const objectURL=URL.createObjectURL(record.file);
      try{return prepare(await decode(objectURL));}finally{URL.revokeObjectURL(objectURL);}
    }
    async function importPhotos(files){
      if(busy||uploading||importing)return;
      importing=true;await ready;notify();let count=0,failures=[];
      for(const file of Array.from(files)){
        try{
          if(!TYPES.has(file.type)||file.size>LIMIT)throw Error('JPG, PNG, WebP ou GIF de 10 Mo maximum.');
          const prepared=await preparedPhoto({file});
          const record={id:crypto.randomUUID(),name:file.name.slice(0,200),file,preview:prepared.preview,width:prepared.canvas.width,height:prepared.canvas.height};
          await photoStore('readwrite',store=>store.put(record));
          photos.set(record.id,record);count++;
        }catch(error){failures.push(file.name+' : '+error.message);}
      }
      importing=false;galleryVersion++;notify();
      say((count?count+' photo'+(count>1?'s importées':' importée')+' dans ce navigateur. Choisis « Nouveau visuel » ou « Utiliser ». ':'')+failures.join(' '),failures.length>0);
    }
    async function usePhoto(record,create){
      if(busy||uploading||importing)return;
      try{
        if(create){if(!createPhotoPreset)throw Error('La création de visuel photo est indisponible. Recharge la page.');createPhotoPreset(photoURL(record),record.name);}
        else if(!getDescriptor())throw Error('Ce preset ne prend pas d’image. Choisis « Nouveau visuel ».');
        else if(!writeURL(photoURL(record),getCode()))throw Error('Le code a changé. Réessaie après Hydra / Update.');
        setContext(photoURL(record));state.file=record.file;
        say('Photo « '+record.name+' » choisie. Clique sur Hydra / Update pour lancer le visuel.');
      }catch(error){say(error.message,true);}
    }
    async function removePhoto(record){
      if(busy||uploading||!window.confirm('Supprimer « '+record.name+' » de ce navigateur ? Les presets qui utilisent cette photo locale devront recevoir une autre image.'))return;
      busy=true;notify();
      try{await photoStore('readwrite',store=>store.delete(record.id));photos.delete(record.id);for(const key of locals.keys())if(key.endsWith('\0'+photoURL(record)))locals.delete(key);galleryVersion++;say('Photo retirée de la photothèque. Le visuel déjà lancé reste affiché.');}
      catch(error){say(error.message,true);}finally{busy=false;notify();}
    }
    function context(url){return getKey()+'\0'+url;}
    function setContext(url){const key=context(url);if(state.key!==key){const local=locals.get(key),record=url.startsWith(PHOTO_PREFIX)?photos.get(url.slice(PHOTO_PREFIX.length)):null;state={show:true,key,url,file:local?.file||record?.file||null,prepared:local?.prepared||null,message:'',error:false};}else state.show=true;notify();return key;}
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
        await ready;
        let prepared=locals.get(key)?.prepared;
        if(url.startsWith(PHOTO_PREFIX)){
          const record=photos.get(url.slice(PHOTO_PREFIX.length));
          if(!record)throw Error('Cette photo locale est absente de ce navigateur. Importe-la dans Photos, puis choisis « Utiliser » ; pour la partager, enregistre-la dans WordPress.');
          if(!prepared)prepared=await preparedPhoto(record);
          if(ticket!==loading||current!==binding)return;
          state.file=record.file;
          locals.delete(key);locals.set(key,{file:record.file,prepared});while(locals.size>4)locals.delete(locals.keys().next().value);
        }
        if(!prepared)prepared=prepare(await decode(safeURL(url)));
        if(ticket!==loading||current!==binding)return;
        state.prepared=prepared;apply(prepared,current);
        say(state.file?'Image locale : '+state.file.name+' · Non enregistrée dans WordPress.':'Image du script chargée.');
      }catch(error){if(ticket===loading&&current===binding){
        state.prepared=null;const previous=current.source.tex;current.source.clear();if(previous&&previous!==current.source.tex)previous.destroy();say(error.message,true);
      }}
      finally{if(ticket===loading){busy=false;notify();}}
    }
    async function original(){
      if(busy||uploading||importing)return;locals.delete(state.key);state.file=null;state.prepared=null;
      if(binding)await load(binding.source,state.url,binding.check);else say('Image locale retirée. Clique sur Hydra / Update pour charger l’image du script.');
    }
    function useURL(value){
      if(busy||uploading||importing)return;
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
      details.innerHTML='<summary>Photos · importer et choisir une image</summary><div class="pilami-photo-toolbar"><button type="button" data-photo-import>Importer des photos…</button><input type="file" data-photo-files accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden><span data-photo-count></span></div><p class="pilami-image-help">Photos conservées dans ce navigateur. Utilise-les dans un preset image ou crée un nouveau visuel ; Hydra / Update lance le rendu.</p><div class="pilami-photo-grid" data-photo-grid></div><div data-image-current><div class="pilami-image-preview"><img data-image-preview alt="Image utilisée par le visuel"><p data-image-status role="status" aria-live="polite"></p></div><div class="pilami-image-actions"><button type="button" data-image-original>Recharger l’image du script</button><button type="button" data-image-upload hidden>Enregistrer l’image dans WordPress</button></div><label class="pilami-image-url">URL directe de l’image<input type="url" data-image-url placeholder="https://…/photo.jpg"></label><button type="button" data-image-use-url>Utiliser cette URL dans le code</button><p class="pilami-image-help">Les photos locales restent dans ce navigateur. Pour partager le preset, enregistre l’image dans WordPress, puis le preset.</p></div><p data-photo-message role="status" aria-live="polite"></p>';
      const $=selector=>details.querySelector(selector),field=$('[data-photo-files]'),url=$('[data-image-url]');let displayedURL=null,renderedGallery=-1,renderedDescriptor=null;
      $('[data-photo-import]').addEventListener('click',()=>field.click());field.addEventListener('change',()=>{const files=Array.from(field.files);field.value='';importPhotos(files);});
      $('[data-image-original]').addEventListener('click',original);$('[data-image-upload]').addEventListener('click',upload);$('[data-image-use-url]').addEventListener('click',()=>useURL(url.value));
      const instance={render(){
        details.hidden=false;
        const descriptor=getDescriptor();$('[data-image-current]').hidden=!descriptor;
        $('[data-photo-message]').hidden=Boolean(descriptor);$('[data-photo-message]').textContent=state.message;$('[data-photo-message]').classList.toggle('is-error',state.error);
        $('[data-photo-count]').textContent=photos.size+' photo'+(photos.size>1?'s':'')+' · JPG, PNG, WebP, GIF · 10 Mo max.';
        if(renderedGallery!==galleryVersion||renderedDescriptor!==Boolean(descriptor)){
          renderedGallery=galleryVersion;renderedDescriptor=Boolean(descriptor);const grid=$('[data-photo-grid]');grid.replaceChildren();
          for(const record of [...photos.values()].reverse()){
            const card=doc.createElement('article'),img=doc.createElement('img'),caption=doc.createElement('p'),actions=doc.createElement('div');
            card.className='pilami-photo-card';img.src=record.preview;img.alt='';caption.textContent=record.name;caption.title=record.name;
            const button=(label,handler,key)=>{const b=doc.createElement('button');b.type='button';b.textContent=label;b.dataset[key]=record.id;b.addEventListener('click',handler);actions.append(b);return b;};
            const use=button('Utiliser',()=>usePhoto(record,false),'photoUse');use.hidden=!descriptor;
            button('Nouveau visuel',()=>usePhoto(record,true),'photoCreate');button('Supprimer',()=>removePhoto(record),'photoDelete');
            card.append(img,caption,actions);grid.append(card);
          }
        }
        const preview=$('[data-image-preview]');preview.hidden=!state.prepared;if(state.prepared&&preview.src!==state.prepared.preview)preview.src=state.prepared.preview;
        const status=$('[data-image-status]');status.textContent=state.message||'Lance le visuel pour charger son image, ou choisis une image locale.';status.classList.toggle('is-error',state.error);
        if(displayedURL!==state.url){url.value=state.url.startsWith(PHOTO_PREFIX)?'':state.url;displayedURL=state.url;}
        for(const button of details.querySelectorAll('button'))button.disabled=busy||uploading||importing;
        url.disabled=busy||uploading||importing;$('[data-image-original]').disabled=busy||uploading||!state.file;
        const save=$('[data-image-upload]');save.hidden=!session?.allowed||!session.media_api;save.disabled=busy||uploading||importing||!state.file;save.textContent=uploading?'Enregistrement…':'Enregistrer l’image dans WordPress';
      },dispose(){views.delete(instance);details.remove();}};container.append(details);views.add(instance);instance.render();return instance;
    }
    const anchor=document.createElement('div');anchor.dataset.hydraImageAnchor='';root.querySelector('[data-hydra-code]').closest('.pilami-strudel-editor-wrap').before(anchor);view(anchor);
    const api={load,view,ready,async exportPhotos(urls){
      await ready;const result=[];
      for(const url of new Set(urls))if(url.startsWith(PHOTO_PREFIX)){
        const record=photos.get(url.slice(PHOTO_PREFIX.length));if(!record)throw Error('Une photo locale utilisée par les presets est absente. Réimporte-la avant de préparer le pack VJ.');
        const {file,...info}=record;result.push({...info,data:await fileData(file)});
      }
      return result;
    },setSession(auth){session=auth;notify();},end(){loading++;busy=false;binding=null;const descriptor=getDescriptor();if(descriptor)setContext(descriptor.url);else{state.key='';state.url='';state.file=null;state.prepared=null;notify();}}};
    window.addEventListener('pagehide',()=>{api.end();locals.clear();});return api;
  }
  window.PilamiHydraImages={mount,cssURL:"data:text/css;base64,LnBpbGFtaS1pbWFnZS1zb3VyY2VbaGlkZGVuXXtkaXNwbGF5Om5vbmUhaW1wb3J0YW50fQoucGlsYW1pLWltYWdlLXNvdXJjZXttYXJnaW46MTJweCAwO3BhZGRpbmc6MTJweDtib3JkZXI6MXB4IHNvbGlkICM4OTk3YTc2Njtib3JkZXItcmFkaXVzOjhweDtjb2xvcjppbmhlcml0O2JhY2tncm91bmQ6dHJhbnNwYXJlbnQ7ZmxleC1zaHJpbms6MH0KLnBpbGFtaS1pbWFnZS1zb3VyY2Ugc3VtbWFyeXtmb250LXdlaWdodDo2MDA7Y3Vyc29yOnBvaW50ZXI7bGluZS1oZWlnaHQ6MS41fQoucGlsYW1pLWltYWdlLXByZXZpZXd7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDttYXJnaW46MTJweCAwO21pbi13aWR0aDowfQoucGlsYW1pLWltYWdlLXByZXZpZXcgaW1ne3dpZHRoOjk2cHg7bWF4LWhlaWdodDo5NnB4O29iamVjdC1maXQ6Y29udGFpbjtib3JkZXItcmFkaXVzOjVweDtmbGV4LXNocmluazowfQoucGlsYW1pLWltYWdlLXByZXZpZXcgcHtmb250LXNpemU6MTNweDtsaW5lLWhlaWdodDoxLjU7bWFyZ2luOjA7b3ZlcmZsb3ctd3JhcDphbnl3aGVyZX0KLnBpbGFtaS1pbWFnZS1hY3Rpb25ze2Rpc3BsYXk6ZmxleDtmbGV4LXdyYXA6d3JhcDtnYXA6OHB4O21hcmdpbi1ib3R0b206MTBweH0KLnBpbGFtaS1pbWFnZS1zb3VyY2UgLnBpbGFtaS1pbWFnZS11cmx7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6NXB4O2ZvbnQtc2l6ZToxM3B4O21heC13aWR0aDoxMDAlO21hcmdpbjoxMHB4IDA7Y29sb3I6aW5oZXJpdDt0ZXh0LWFsaWduOmxlZnR9Ci5waWxhbWktaW1hZ2UtdXJsIGlucHV0e3dpZHRoOjEwMCU7bWF4LXdpZHRoOjEwMCU7bWluLXdpZHRoOjA7cGFkZGluZzo4cHggMTBweDtib3JkZXI6MXB4IHNvbGlkICM4OTk3YTc7Ym9yZGVyLXJhZGl1czo2cHg7YmFja2dyb3VuZDp2YXIoLS1waWxhbWktZWRpdG9yLWJnLHZhcigtLWVkaXRvci1iZywjZmZmKSk7Y29sb3I6dmFyKC0tcGlsYW1pLWVkaXRvci10ZXh0LHZhcigtLWVkaXRvci10ZXh0LCMxNzJiNDIpKTtmb250OmluaGVyaXR9Ci5waWxhbWktaW1hZ2UtaGVscHtmb250LXNpemU6MTJweDtsaW5lLWhlaWdodDoxLjU7bWFyZ2luOjEwcHggMCAwO29wYWNpdHk6Ljg1fQoucGlsYW1pLWltYWdlLXNvdXJjZSAuaXMtZXJyb3J7Y29sb3I6I2U3NWQ1MX0KW2RhdGEtcm9sZS1jb2xvcnM9IjEiXSBbZGF0YS1pbWFnZS11cGxvYWRdey0tYnV0dG9uLWNvbG9yOnZhcigtLXBpbGFtaS1jb2xvci1zYXZlLCM2ZmEzYTUpO2JhY2tncm91bmQ6Y29sb3ItbWl4KGluIHNyZ2IsdmFyKC0tYnV0dG9uLWNvbG9yKSAyMCUsdmFyKC0tcGlsYW1pLXBhbmVsLWJnLHZhcigtLWJnLCNmN2Y5ZmMpKSk7Y29sb3I6aW5oZXJpdDtib3JkZXItY29sb3I6dmFyKC0tYnV0dG9uLWNvbG9yKX0KQG1lZGlhKG1heC13aWR0aDo1MDBweCl7LnBpbGFtaS1pbWFnZS1wcmV2aWV3e2FsaWduLWl0ZW1zOmZsZXgtc3RhcnR9LnBpbGFtaS1pbWFnZS1hY3Rpb25zIGJ1dHRvbnttYXgtd2lkdGg6MTAwJTt3aGl0ZS1zcGFjZTpub3JtYWx9fQoucGlsYW1pLXBob3RvLXRvb2xiYXJ7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTJweDtmbGV4LXdyYXA6d3JhcDttYXJnaW46MTJweCAwIDhweH0KLnBpbGFtaS1waG90by10b29sYmFyIHNwYW57Zm9udC1zaXplOjEycHg7b3BhY2l0eTouODV9Ci5waWxhbWktcGhvdG8tZ3JpZHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdChhdXRvLWZpbGwsbWlubWF4KDE1NXB4LDFmcikpO2dhcDoxMHB4O21heC1oZWlnaHQ6MzYwcHg7b3ZlcmZsb3c6YXV0bzttYXJnaW46MTJweCAwfQoucGlsYW1pLXBob3RvLWNhcmR7Ym9yZGVyOjFweCBzb2xpZCAjODk5N2E3NjY7Ym9yZGVyLXJhZGl1czo4cHg7cGFkZGluZzoxMHB4O21pbi13aWR0aDowfQoucGlsYW1pLXBob3RvLWNhcmQ+aW1ne2Rpc3BsYXk6YmxvY2s7d2lkdGg6MTAwJTtoZWlnaHQ6OTZweDtvYmplY3QtZml0OmNvbnRhaW47YmFja2dyb3VuZDojMTAxODIwO2JvcmRlci1yYWRpdXM6NHB4fQoucGlsYW1pLXBob3RvLWNhcmQ+cHtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpczt3aGl0ZS1zcGFjZTpub3dyYXA7Zm9udC1zaXplOjEycHg7bWFyZ2luOjhweCAwfQoucGlsYW1pLXBob3RvLWNhcmQ+ZGl2e2Rpc3BsYXk6ZmxleDtnYXA6NXB4O2ZsZXgtd3JhcDp3cmFwfQoucGlsYW1pLXBob3RvLWNhcmQgYnV0dG9ue2ZvbnQtc2l6ZToxMnB4O3BhZGRpbmc6NXB4IDdweDttaW4taGVpZ2h0OjMycHg7d2hpdGUtc3BhY2U6bm9ybWFsfQoucGlsYW1pLXBob3RvLWNhcmQgW2RhdGEtcGhvdG8tZGVsZXRlXXtvcGFjaXR5Oi44fQoucGlsYW1pLWltYWdlLXNvdXJjZSBbZGF0YS1waG90by1tZXNzYWdlXXtmb250LXNpemU6MTNweDtsaW5lLWhlaWdodDoxLjU7b3ZlcmZsb3ctd3JhcDphbnl3aGVyZX0KLnBpbGFtaS1pbWFnZS1zb3VyY2UgW2RhdGEtcGhvdG8tbWVzc2FnZV06ZW1wdHl7ZGlzcGxheTpub25lfQpAbWVkaWEobWF4LXdpZHRoOjUwMHB4KXsucGlsYW1pLXBob3RvLWdyaWR7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOnJlcGVhdCgyLG1pbm1heCgwLDFmcikpfX0KCi5waWxhbWktaW1hZ2Utc291cmNlIFtoaWRkZW5de2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9Cg=="};
})();
