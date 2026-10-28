// Pilami standalone public-page export. AGPL-3.0-or-later.
(function(){
 'use strict';
 const templateURL=new URL('offline/pilami-hydra-public.html',document.currentScript.src||location.href).href;
 function prepare(source,descriptors,entries,interactive=[]){
  if(!Array.isArray(interactive)||interactive.length>2||new Set(interactive).size!==interactive.length)throw Error('Choisis au maximum deux contrôleurs différents.');
  const selected=new Set(interactive.map(String)),found=new Set();
  const tree=acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true}),calls=[],images=new Set(),edits=[];let hasInit=false;
  function walk(node){
   if(!node||typeof node!=='object')return;
   if(node.type==='ImportExpression'&&node.source.type==='Literal'&&/^https?:/.test(node.source.value))throw Error('Ce preset importe encore une bibliothèque distante. Intègre-la au preset avant cet export autonome.');
   if(node.type==='CallExpression'){
    const member=node.callee.type==='MemberExpression'&&!node.callee.computed?node.callee.property.name:null,name=node.callee.type==='Identifier'?node.callee.name:member;
    if(['slider','knob','fader','toggle'].includes(name)&&node.callee.type==='Identifier')calls.push(node);
    if(name==='initHydra')hasInit=true;
    if(['initCam','initScreen','initVideo','getUserMedia','getDisplayMedia','requestMIDIAccess'].includes(member))throw Error('Les captures caméra/écran, vidéos et demandes de périphériques ne sont pas prises en charge par cet export de page.');
    if(name==='loadScript'){
     const url=node.arguments[0];if(url?.type!=='Literal'||!PilamiHydraExtensions.identify(url.value))throw Error('Une bibliothèque externe de ce preset ne fait pas partie du lecteur autonome.');
    }
    if(name==='loadHydraExtension'&&(node.arguments[0]?.type!=='Literal'||!PilamiHydraExtensions.names.includes(node.arguments[0].value)))throw Error('Extension locale non prise en charge dans cette page.');
    if(name==='imageSource'||member==='initImage'){
     const url=node.arguments[name==='imageSource'?1:0];if(url?.type!=='Literal'||typeof url.value!=='string')throw Error('Utilise une URL d’image fixe pour exporter cette page.');images.add(url.value);
    }
   }
   for(const [key,value]of Object.entries(node)){if(key==='loc')continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object'&&value.type)walk(value);}
  }walk(tree);calls.sort((a,b)=>a.start-b.start);
  if(calls.length!==descriptors.length)throw Error('Applique le code avec Hydra / Update avant de l’exporter.');
  const byId=new Map(entries.map(e=>[e.id,e])),controls=calls.map((node,i)=>{const descriptor=descriptors[i],entry=byId.get(descriptor.id);edits.push({from:node.callee.start,to:node.callee.end,text:'__pilamiPublicControl.bind(null,'+i+')'});if(!entry)return null;
   const saved={label:entry.label,value:entry.value};
   if(selected.has(String(entry.id))){
    const min=Number(entry.min),max=Number(entry.max),step=entry.step==='any'?'any':Number(entry.step);
    if(!Number.isFinite(min)||!Number.isFinite(max)||min>=max||!Number.isFinite(entry.value)||entry.value<min||entry.value>max||!(step==='any'||Number.isFinite(step)&&step>0))throw Error('Vérifie les bornes et le pas du contrôleur '+entry.label+'.');
    saved.interactive={min,max,step,kind:entry.kind==='toggle'?'toggle':'slider'};found.add(String(entry.id));
   }
   return saved;});
  if(found.size!==selected.size)throw Error('Un contrôleur choisi n’est plus disponible. Applique le code et rouvre l’export.');
  let output=source;for(const edit of edits.sort((a,b)=>b.from-a.from))output=output.slice(0,edit.from)+edit.text+output.slice(edit.to);
  return{source:output,controls,hasInit,images:[...images]};
 }
 async function dataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Impossible d’intégrer une image.'));reader.readAsDataURL(blob);});}
 async function build({source,descriptors,entries,name,title,description='',sharing,interactive=[],resolution,exportPhotos}){
  // Capture values synchronously, before any asset request or subsequent MIDI edit.
  const prepared=prepare(source,descriptors,entries,interactive),pack={version:'0.39.53',name:String(title||name||'Visuel Pilami').trim().slice(0,160),original:source,source:prepared.source,controls:prepared.controls,hasInit:prepared.hasInit,resolution:{width:resolution.width,height:resolution.height},photos:[]};
  if(!Number.isInteger(pack.resolution.width)||!Number.isInteger(pack.resolution.height)||pack.resolution.width<1||pack.resolution.height<1)throw Error('Lance le visuel avant de capturer sa résolution.');
  const local=await exportPhotos(prepared.images);
  for(const url of prepared.images){
   if(url.startsWith('pilami-photo:')){const photo=local.find(p=>url.endsWith(p.id));if(!photo?.data)throw Error('Photo locale absente de cet export.');pack.photos.push({url,data:photo.data});}
   else if(/^data:image\//.test(url))pack.photos.push({url,data:url});
   else{const response=await fetch(new URL(url,location.href),{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error('Impossible d’intégrer une image ('+response.status+').');const blob=await response.blob();if(!/^image\//.test(blob.type))throw Error('Une source n’est pas une image.');pack.photos.push({url,data:await dataURL(blob)});}
  }
  let template;
  if(document.querySelector('[data-public-page-template]'))template=JSON.parse(document.querySelector('[data-public-page-template]').textContent);
  else{const response=await fetch(templateURL,{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw Error('Modèle de page inaccessible. Recharge la page après la mise à jour du plugin.');template=await response.text();}
  const marker='{"__pilamiPublicPlaceholder":true}';if(!template.includes(marker))throw Error('Modèle de page invalide.');
  const safe=JSON.stringify(pack).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const meta=metadata({title:pack.name,description,sharing});
  let html=template.replace(marker,()=>safe);
  html=html.replace(/<title>[^<]*<\/title>/,()=>'<title>'+escapeHTML(pack.name)+'</title>');
  const metaMarker='<!--__PILAMI_PUBLIC_META__-->';
  html=html.includes(metaMarker)?html.replace(metaMarker,()=>meta.tags):html.replace('</head>',()=>meta.tags+'</head>');
  return{html,name:pack.name,...meta};
 }
 // Metadata is rendered into the initial HTML, before the bundled engines.
 function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function publicLocation(value){
  let url;try{url=new URL(String(value).trim());}catch(_){throw Error('Indique une adresse publique complète, par exemple https://ton-site.fr/visuels/ma-scene/.');}
  if(url.protocol!=='https:'||url.username||url.password)throw Error('Utilise une adresse publique HTTPS sans identifiant ni mot de passe.');
  url.hash='';
  let htmlFilename='index.html';
  if(/\.html?$/i.test(url.pathname)){
   htmlFilename=url.pathname.split('/').pop();
   if(!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.html?$/i.test(htmlFilename))throw Error('Choisis une adresse de dossier ou un nom de fichier HTML simple.');
  }else if(!url.pathname.endsWith('/'))url.pathname+='/';
  return{url:url.href,htmlFilename};
 }
 function metadata({title,description='',sharing}){
  description=String(description).trim().slice(0,320);
  const tag=(property,value)=>'<meta property="'+property+'" content="'+escapeHTML(value)+'">';
  let tags='<meta name="description" content="'+escapeHTML(description)+'">',info={htmlFilename:'index.html'};
  if(sharing?.enabled){
   info=publicLocation(sharing.url);
   if(!/^apercu-[a-f0-9]{8}\.jpg$/.test(sharing.imageFilename||''))throw Error('Capture la miniature avant de préparer le partage.');
   const imageURL=new URL(sharing.imageFilename,info.url).href;
   tags+='<link rel="canonical" href="'+escapeHTML(info.url)+'">';
   for(const[k,v]of Object.entries({'og:type':'website','og:title':title,'og:description':description,'og:url':info.url,'og:image':imageURL,'og:image:width':'1200','og:image:height':'630','og:image:type':'image/jpeg','og:image:alt':title}))tags+=tag(k,v);
   for(const[k,v]of Object.entries({'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':imageURL}))tags+='<meta name="'+k+'" content="'+escapeHTML(v)+'">';
   info.imageURL=imageURL;
  }
  return{...info,tags};
 }
 const crcTable=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
 function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
 function zip(files){
  const encoder=new TextEncoder(),parts=[],central=[];let offset=0,centralSize=0;
  for(const file of files){
   const name=encoder.encode(file.name),data=typeof file.data==='string'?encoder.encode(file.data):file.data;
   if(data.length>0xffffffff||offset+data.length>0xffffffff)throw Error('Cette page est trop volumineuse pour le ZIP de partage.');
   const local=new Uint8Array(30+name.length),v=new DataView(local.buffer),crc=crc32(data);
   v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,0x21,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);local.set(name,30);
   const entry=new Uint8Array(46+name.length),c=new DataView(entry.buffer);
   c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);entry.set(name,46);
   parts.push(local,data);central.push(entry);offset+=local.length+data.length;centralSize+=entry.length;
  }
  const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
  return new Blob([...parts,...central,end],{type:'application/zip'});
 }
 function freezeOptions(options){return{...options,resolution:{...options.resolution},descriptors:options.descriptors.map(d=>({...d})),entries:options.entries.map(e=>({id:e.id,label:e.label,value:e.value,min:e.min,max:e.max,step:e.step,kind:e.kind})),interactive:[...(options.interactive||[])],sharing:options.sharing?{...options.sharing}:undefined};}
 async function buildPackage(options){
  options=freezeOptions(options);
  publicLocation(options.sharing?.url);
  const canvas=(options.captureFrame||(()=>PilamiStrudelHydra.captureFrame()))();
  if(canvas.width!==1200||canvas.height!==630)throw Error('La miniature doit mesurer 1200 × 630 pixels.');
  const jpeg=await new Promise((resolve,reject)=>{try{canvas.toBlob(b=>b?resolve(b):reject(Error('Impossible de créer la miniature JPEG.')),'image/jpeg',.9);}catch(error){reject(error);}});
  const thumbnail=new Uint8Array(await jpeg.arrayBuffer()),imageFilename='apercu-'+crc32(thumbnail).toString(16).padStart(8,'0')+'.jpg';
  options.sharing={...options.sharing,enabled:true,imageFilename};
  const result=await build(options);
  const readme='PAGE WEB ET APERÇU DE PARTAGE\n\nDécompresse le ZIP, puis dépose '+result.htmlFilename+' et '+imageFilename+' dans le même dossier public de ton site. Ne téléverse pas le ZIP dans la médiathèque WordPress.\n\nAdresse prévue : '+result.url+'\nMiniature : '+result.imageURL+'\n\nSi des contrôleurs ont été choisis, le bouton Réglages permet de les manipuler et de revenir à leurs valeurs de départ. Les changements du visiteur restent propres à cette visite.\n\nLa miniature est une image fixe du visuel au téléchargement. Le rendu animé garde les réglages capturés, mais les simulations redémarrent à l’ouverture.\n\nAprès une mise à jour, utilise le débogueur de partage Facebook (https://developers.facebook.com/tools/debug/), puis Re-collecter. Si la publication affiche encore l’ancien aperçu, actualise Facebook avec Ctrl + F5 et crée une nouvelle publication. Le service peut conserver son propre cache.\n\nPour les sons de collision, le visiteur doit cliquer sur Activer le son. Aucun micro ni MIDI n’est demandé.\n';
  return{...result,imageFilename,thumbnail,blob:zip([{name:result.htmlFilename,data:result.html},{name:imageFilename,data:thumbnail},{name:'LISEZ-MOI.txt',data:readme}])};
 }
 function slug(name){return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,80)||'visuel-pilami';}
 async function download(options){
  const shared=!!options.sharing?.enabled,result=shared?await buildPackage(options):await build(options),doc=options.document||document;
  if(!doc.defaultView||doc.defaultView.closed)throw Error('La fenêtre d’export a été fermée.');
  const url=URL.createObjectURL(shared?result.blob:new Blob([result.html],{type:'text/html;charset=utf-8'})),link=doc.createElement('a');
  link.href=url;link.download=slug(result.name)+(shared?'-web.zip':'.html');doc.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);return result;
 }
 function open({document:doc=document,getOptions,captureFrame,preferencesKey='pilami-public-export-settings-v1'}){
  return new Promise(resolve=>{
   const win=doc.defaultView,dialog=doc.createElement('dialog');dialog.className='pilami-public-export-dialog';dialog.dataset.publicExportDialog='';
   dialog.setAttribute('aria-label','Exporter une page web');
   const style=doc.createElement('style');style.textContent=`
    dialog.pilami-public-export-dialog{box-sizing:border-box;position:fixed;inset:0;width:min(660px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;margin:auto;padding:24px;border:1px solid #7688a6;border-radius:16px;background:var(--pilami-editor-bg,var(--editor-bg,#122033));color:var(--pilami-editor-text,var(--editor-text,#edf4ff));font:14px/1.5 system-ui,sans-serif;box-shadow:0 20px 80px #0008}
    .pilami-public-export-dialog::backdrop{background:#0009}.pilami-public-export-dialog *{box-sizing:border-box}.pilami-public-export-dialog h2{margin:0 0 8px;font-size:21px;color:inherit}.pilami-public-export-dialog p{margin:8px 0 14px}.pilami-public-export-dialog label{display:block;margin:12px 0 5px;font:inherit;color:inherit}.pilami-public-export-dialog input:not([type=checkbox]),.pilami-public-export-dialog textarea{display:block;width:100%;padding:10px;border:1px solid #8193b088;border-radius:7px;color:inherit;background:transparent;font:inherit}.pilami-public-export-dialog select{display:block;width:100%;padding:10px;border:1px solid #8193b088;border-radius:7px;color:inherit;background:var(--pilami-editor-bg,var(--editor-bg,#122033));font:inherit}.pilami-public-export-dialog h3{font-size:16px;margin:20px 0 6px}.pilami-public-export-dialog textarea{min-height:74px;resize:vertical}.pilami-public-export-dialog .public-export-check{display:flex;gap:9px;align-items:center}.pilami-public-export-dialog input[type=checkbox]{width:18px;height:18px;flex:0 0 auto;margin:0}.pilami-public-export-dialog button{font:inherit;padding:9px 14px;border:1px solid #8193b088;border-radius:8px;background:transparent;color:inherit;cursor:pointer}.pilami-public-export-dialog button:disabled{opacity:.5;cursor:default}.pilami-public-export-dialog button[type=submit]{background:#356aab;color:white}.pilami-public-export-dialog .public-export-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:20px}.pilami-public-export-dialog img{display:block;width:100%;height:auto;aspect-ratio:1200/630;object-fit:contain;background:#05080d;border-radius:8px;margin:12px 0}.pilami-public-export-dialog small{display:block;opacity:.8;line-height:1.5}.pilami-public-export-dialog [hidden]{display:none!important}.pilami-public-export-dialog [role=alert]{color:#ee8f83;overflow-wrap:anywhere}.pilami-public-export-dialog :focus-visible{outline:2px solid #83baff;outline-offset:3px}.pilami-public-export-dialog fieldset{border:0;padding:0;margin:0;min-width:0}
   `;dialog.append(style);
   const make=(tag,text,attrs={})=>{const e=doc.createElement(tag);if(text!==null)e.textContent=text;for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
   dialog.addEventListener('keydown',event=>event.stopPropagation());
   const form=make('form',null),fields=make('fieldset',null);dialog.append(form);form.append(make('h2','Exporter une page web'),make('p','Choisis le titre de ta scène et prépare, si tu le souhaites, son aperçu pour les réseaux sociaux.'),fields);
   const field=(text,tag,attrs)=>{const label=make('label',text),input=make(tag,null,attrs);label.append(input);fields.append(label);return input;};
   const initial=getOptions();let saved={};try{saved=JSON.parse(localStorage.getItem(preferencesKey)||'{}')||{};}catch(_){}
   const title=field('Titre','input',{type:'text',maxlength:'160',required:'','data-public-export-title':''});title.value=saved.title||initial.name||'Visuel Pilami';
   const description=field('Description','textarea',{maxlength:'320',rows:'2','data-public-export-description':''});description.value=saved.description??'Une expérience visuelle générative créée avec Pilami Strudel Lab.';
   fields.append(make('h3','Contrôleurs pour le visiteur'),make('small','Facultatif : choisis jusqu’à deux paramètres. Leurs bornes Min / Max et leur pas actuels seront conservés.'));
   const selectors=[1,2].map(n=>{const select=field('Contrôleur '+n,'select',{'data-public-export-control':String(n)});select.append(make('option','Aucun',{value:''}));for(const entry of initial.entries)select.append(make('option',entry.label,{value:String(entry.id)}));return select;});
   const savedInteractive=Array.isArray(saved.interactive)?saved.interactive:[];
   selectors.forEach((select,i)=>{const spec=savedInteractive[i];if(!spec)return;const entry=initial.entries.filter(e=>e.label===spec.label)[spec.occurrence||0];if(entry)select.value=String(entry.id);});
   if(selectors[0].value&&selectors[0].value===selectors[1].value)selectors[1].value='';
   const ranges=make('small','',{'data-public-export-control-ranges':''});fields.append(ranges);
   function updateSelections(){selectors.forEach((select,i)=>{for(const option of select.options)option.disabled=!!option.value&&option.value===selectors[1-i].value;});ranges.textContent=selectors.map(select=>initial.entries.find(e=>String(e.id)===select.value)).filter(Boolean).map(e=>e.label+' : '+e.min+' à '+e.max+' · pas '+e.step).join(' ; ');}
   selectors.forEach(select=>select.addEventListener('change',updateSelections));updateSelections();
   const check=make('label',null,{class:'public-export-check'}),sharing=make('input',null,{type:'checkbox','data-public-export-sharing':''});check.append(sharing,'Préparer une miniature pour Facebook et les réseaux sociaux');fields.append(check);sharing.checked=!!saved.enabled;
   const social=make('div',null,{'data-public-export-social':''});fields.append(social);
   const urlLabel=make('label','Adresse publique de la page'),url=make('input',null,{type:'url',placeholder:'https://ton-site.fr/visuels/ma-scene/','data-public-export-url':''});url.value=saved.url||'';urlLabel.append(url);social.append(urlLabel,make('small','Le ZIP contiendra la page HTML et son image JPEG. Dépose les deux fichiers ensemble à cette adresse.'));
   const preview=make('img',null,{alt:'Miniature du visuel, cadrage conservé en 1200 × 630','data-public-export-preview':''}),recapture=make('button','Capturer maintenant',{type:'button','data-public-export-capture':''});social.append(preview,recapture,make('small','1200 × 630 · proportions conservées. La miniature finale sera capturée au clic sur Télécharger.'));
   const note=make('small','La variation et la résolution sont capturées au téléchargement. Seuls les contrôleurs choisis restent accessibles au visiteur. Les simulations se recalculent à l’ouverture. Aucun micro ni MIDI dans la page publiée.');fields.append(note);
   const error=make('p','',{role:'alert','data-public-export-error':''});error.hidden=true;form.append(error);
   const actions=make('div',null,{class:'public-export-actions'}),cancel=make('button','Annuler',{type:'button','data-public-export-cancel':''}),submit=make('button','Télécharger le HTML',{type:'submit','data-public-export-download':''});actions.append(cancel,submit);form.append(actions);
   let busy=false,done=false;
   function close(value){if(done)return;done=true;win.removeEventListener('pagehide',abandon);if(dialog.open)dialog.close();dialog.remove();resolve(value);}
   function abandon(){close(null);}
   function showError(e){error.textContent=e.message||String(e);error.hidden=false;}
   function capture(){try{const canvas=captureFrame();preview.src=canvas.toDataURL('image/jpeg',.9);preview.hidden=false;error.hidden=true;}catch(e){preview.hidden=true;showError(e);}}
   function update(){social.hidden=!sharing.checked;url.required=sharing.checked;submit.textContent=sharing.checked?'Télécharger le ZIP de partage':'Télécharger le HTML';if(sharing.checked)capture();}
   sharing.addEventListener('change',update);recapture.addEventListener('click',capture);cancel.addEventListener('click',()=>close(null));dialog.addEventListener('cancel',e=>{e.preventDefault();if(!busy)close(null);});
   form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;error.hidden=true;
    let options;try{if(sharing.checked)publicLocation(url.value);options=freezeOptions({...getOptions(),title:title.value.trim(),description:description.value,interactive:selectors.map(select=>select.value).filter(Boolean),sharing:{enabled:sharing.checked,url:url.value},captureFrame,document:doc});if(!options.title)throw Error('Indique un titre pour la page.');}catch(e){showError(e);return;}
    busy=true;fields.disabled=true;submit.disabled=true;cancel.disabled=true;submit.textContent='Préparation…';
    try{const result=await download(options);try{localStorage.setItem(preferencesKey,JSON.stringify({title:options.title,description:options.description,url:options.sharing.url,enabled:options.sharing.enabled,interactive:options.interactive.map(id=>{const entry=initial.entries.find(e=>String(e.id)===id);return{label:entry.label,occurrence:initial.entries.filter(e=>e.label===entry.label).indexOf(entry)};})}));}catch(_){}close(result);}
    catch(e){showError(e);}
    finally{if(!done){busy=false;fields.disabled=false;submit.disabled=false;cancel.disabled=false;submit.textContent=sharing.checked?'Télécharger le ZIP de partage':'Télécharger le HTML';}}
   });
   (doc.fullscreenElement||doc.body).append(dialog);win.addEventListener('pagehide',abandon,{once:true});dialog.showModal();update();title.focus();
  });
 }
 window.PilamiPublicExport=Object.freeze({build,buildPackage,download,open});
})();
