// Pilami standalone public-page export. AGPL-3.0-or-later.
(function(){
 'use strict';
 const templateURL=new URL('offline/pilami-hydra-public.html',document.currentScript.src||location.href).href;
 function prepare(source,descriptors,entries){
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
  const byId=new Map(entries.map(e=>[e.id,e])),controls=calls.map((node,i)=>{const descriptor=descriptors[i],entry=byId.get(descriptor.id);edits.push({from:node.callee.start,to:node.callee.end,text:'__pilamiPublicControl.bind(null,'+i+')'});return entry?{label:entry.label,value:entry.value}:null;});
  let output=source;for(const edit of edits.sort((a,b)=>b.from-a.from))output=output.slice(0,edit.from)+edit.text+output.slice(edit.to);
  return{source:output,controls,hasInit,images:[...images]};
 }
 async function dataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Impossible d’intégrer une image.'));reader.readAsDataURL(blob);});}
 async function build({source,descriptors,entries,name,resolution,exportPhotos}){
  // Capture values synchronously, before any asset request or subsequent MIDI edit.
  const prepared=prepare(source,descriptors,entries),pack={version:'0.39.51',name:String(name||'Visuel Pilami').slice(0,160),original:source,source:prepared.source,controls:prepared.controls,hasInit:prepared.hasInit,resolution:{width:resolution.width,height:resolution.height},photos:[]};
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
  return{html:template.replace(marker,()=>safe),name:pack.name};
 }
 async function download(options){const result=await build(options),url=URL.createObjectURL(new Blob([result.html],{type:'text/html;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=(result.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,80)||'visuel-pilami')+'.html';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);return result;}
 window.PilamiPublicExport=Object.freeze({build,download});
})();
