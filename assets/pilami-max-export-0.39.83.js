/* Pilami native Max for Live export prototype. SPDX-License-Identifier: AGPL-3.0-or-later */
(function(){
 'use strict';
 const templateURL=new URL('max4live/template-v1.json',document.currentScript.src).href;
 const float=n=>{if(!Number.isFinite(Number(n)))throw Error('Valeur numérique non finie.');const s=String(Number(n));return /[.e]/i.test(s)?s:s+'.0';};
 const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const clone=o=>JSON.parse(JSON.stringify(o));
 function compile({source,entries,context},utilities){
  if(!context?.source||context.all)throw Error('Lance un visuel avec une seule sortie, par exemple render(o0), puis réessaie.');
  if(entries.length>16)throw Error('Ce prototype accepte au maximum 16 contrôleurs.');
  if(!Number.isFinite(context.speed))throw Error('La vitesse Hydra doit être un nombre fixe.');
  const tree=acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true}),decls=new Map(),count={out:0},bands=new Set();
  function walk(n){
   if(!n||typeof n!=='object')return;
   if(n.type==='VariableDeclarator'&&n.id.type==='Identifier')decls.set(n.id.name,n.init);
   if(n.type==='AssignmentExpression'&&n.left.type==='Identifier'&&['update','time','bpm'].includes(n.left.name))throw Error('Les scripts qui redéfinissent '+n.left.name+' ne sont pas encore exportables.');
   if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.property.name==='out')count.out++;
   for(const [k,v]of Object.entries(n)){if(k==='loc')continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object'&&v.type)walk(v);}
  }walk(tree);
  if(count.out!==1)throw Error('Ce prototype exporte une seule chaîne .out(). Les simulations à plusieurs buffers viendront ensuite.');
  const controls=entries.map((e,i)=>{
   if(![e.value,e.min,e.max].every(Number.isFinite)||e.min>=e.max)throw Error('Bornes invalides : '+e.label);
   if(e.audio&&(!Number.isInteger(e.audio.band)||e.audio.band<0||e.audio.band>=16||!Number.isFinite(e.audio.depth)))throw Error('Les sources par notes ne sont pas prises en charge : '+e.label);
   return{label:String(e.label),value:e.value,min:e.min,max:e.max,kind:e.kind,audio:e.audio?{band:e.audio.band,depth:e.audio.depth}:null};
  });
  const bins=(()=>{let max=6;function find(n){if(!n||!n.type)return;if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object.name==='a'&&n.callee.property.name==='setBins'&&n.arguments[0]?.type==='Literal')max=Number(n.arguments[0].value);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(find);else if(v?.type)find(v);}}find(tree);return Math.max(1,Math.min(16,max));})();
  function band(n){if(!Number.isInteger(n)||n<0||n>=16)throw Error('Bande audio non prise en charge : '+n);bands.add(n);return 'pilamiAudio.'+(n<bins/3?'x':n<bins*2/3?'y':'z');}
  function control(i){const e=controls[i];let v='pilamiP'+i;if(e.audio)v='clamp('+v+' + '+band(e.audio.band)+' * pilamiGain * '+float(e.audio.depth)+', '+float(e.min)+', '+float(e.max)+')';if(e.kind==='toggle')v='mix('+float(e.min)+', '+float(e.max)+', step('+float((e.min+e.max)/2)+', '+v+'))';return v;}
  const names=new Map(entries.map((e,i)=>[e.label,i])),getters=new Map(entries.map((e,i)=>[e.get,i]));
  function numeric(n,seen=new Set(),props=''){
   if(!n)throw Error('Expression vide dans un paramètre.');
   if(n.type==='Literal'&&typeof n.value==='number')return float(n.value);
   if(n.type==='Identifier'){
    if(n.name==='time')return 'time';
    if(names.has(n.name))return control(names.get(n.name));
    if(seen.has(n.name)||!decls.has(n.name))throw Error('Expression non exportable : '+n.name);
    const next=new Set(seen);next.add(n.name);return numeric(decls.get(n.name),next,props);
   }
   if(n.type==='UnaryExpression'&&['+','-'].includes(n.operator))return '('+n.operator+numeric(n.argument,seen,props)+')';
   if(n.type==='BinaryExpression'&&['+','-','*','/','%','**'].includes(n.operator)){
    const a=numeric(n.left,seen,props),b=numeric(n.right,seen,props);
    return n.operator==='%'?'mod('+a+','+b+')':n.operator==='**'?'pow('+a+','+b+')':'('+a+n.operator+b+')';
   }
   if(n.type==='MemberExpression'){
    if(n.object.name==='Math'&&n.property.name==='PI')return float(Math.PI);
    if(n.object.name==='Math'&&n.property.name==='E')return float(Math.E);
    if(props&&n.object.name===props&&n.property.name==='time')return 'time';
    if(n.computed&&n.object.type==='MemberExpression'&&n.object.object.name==='a'&&n.object.property.name==='fft'&&n.property.type==='Literal')return '('+band(n.property.value)+' * pilamiGain)';
   }
   if(n.type==='CallExpression'){
    if(n.callee.type==='Identifier'&&n.arguments.length===0)return numeric(n.callee,seen,props);
    if(n.callee.type==='MemberExpression'&&n.callee.object.name==='Math'&&!n.callee.computed){
     const key=n.callee.property.name,arity={sin:1,cos:1,tan:1,abs:1,sqrt:1,exp:1,log:1,floor:1,ceil:1,pow:2,min:2,max:2};
     if(arity[key]===n.arguments.length)return key+'('+n.arguments.map(a=>numeric(a,seen,props)).join(',')+')';
    }
   }
   if(['ArrowFunctionExpression','FunctionExpression'].includes(n.type)){
    let body=n.body;if(body.type==='BlockStatement'){if(body.body.length!==1||body.body[0].type!=='ReturnStatement')throw Error('Un callback contient des instructions non exportables.');body=body.body[0].argument;}
    const arg=n.params[0];if(n.params.length>1||arg&&arg.type!=='Identifier')throw Error('Signature de callback non prise en charge.');
    return numeric(body,seen,arg?.name||'');
   }
   throw Error('Expression JavaScript non prise en charge : '+n.type+'. Utilise une formule numérique simple.');
  }
  function dynamic(fn){if(getters.has(fn))return control(getters.get(fn));let ast;try{ast=acorn.parse('('+Function.prototype.toString.call(fn)+')',{ecmaVersion:'latest'}).body[0].expression;}catch(_){throw Error('Callback impossible à convertir.');}return numeric(ast);}
  const functions=new Map(),active=new Set();let steps=0;
  function generate(chain,uv){
   if(!chain?.transforms||active.has(chain))throw Error('Chaîne Hydra circulaire non prise en charge.');
   active.add(chain);let result='';
   for(const t of chain.transforms){
    if(++steps>256)throw Error('Chaîne trop complexe pour ce prototype.');
    const def=t.transform;if(!['src','coord','color','combine','combineCoord'].includes(def.type))throw Error('Transformation non prise en charge : '+t.name);
    functions.set(t.name,def.glsl);
    const args=def.inputs.map((spec,i)=>{
     const v=i<t.userArgs.length?t.userArgs[i]:spec.default;
     if(v?.transforms)return {chain:v};
     if(v&&typeof v.getTexture==='function'){
      if(v!==context.output)throw Error('Les images, caméras et références à un autre buffer ne sont pas encore exportables.');
      return spec.type==='sampler2D'?{expr:'tex0'}:{texture:true};
     }
     if(typeof v==='function'){if(spec.type!=='float')throw Error('Callback vectoriel non pris en charge.');return {expr:dynamic(v)};}
     if(Array.isArray(v)){
      if(!/^vec[234]$/.test(spec.type))throw Error('Les séquences de valeurs Hydra ne sont pas encore exportables. Utilise une automation Live.');
      const size=Number(spec.type.slice(3)),vals=v.slice(0,size);while(vals.length<size)vals.push(vals.length===3?1:0);
      return {expr:spec.type+'('+vals.map(float).join(',')+')'};
     }
     if(spec.type==='float')return {expr:float(v)};
     throw Error('Argument non pris en charge : '+t.name+'.'+spec.name);
    });
    function argument(a,st){if(a.chain){let res=generate(a.chain,st);return res;}if(a.texture)return 'pilamiSample(tex0,'+st+')';return a.expr;}
    const previous=result;
    // Coordinate composition requires a function of UV, not an already rendered string.
    const call=(input,rest)=>'pilamiHydra_'+t.name+'('+[input,...rest].join(',')+')';
    if(def.type==='src')result=st=>call(st,args.map(a=>argument(a,st)));
    else if(def.type==='coord')result=st=>previous(call(st,args.map(a=>argument(a,st))));
    else if(def.type==='color')result=st=>call(previous(st),args.map(a=>argument(a,st)));
    else if(def.type==='combine')result=st=>call(previous(st),args.map(a=>argument(a,st)));
    else result=st=>previous(call(st,args.map(a=>argument(a,st))));
   }
   if(typeof result!=='function')throw Error('Chaîne Hydra vide.');
   const expression=result(uv);active.delete(chain);return expression;
  }
  const expression=generate(context.source,'uv');
  // Prefix transform names to avoid GLSL built-in overload collisions on NVIDIA.
  let body=utilities+'\n'+[...functions].map(([name,code])=>code.replace(new RegExp('\\b'+name+'\\s*\\('),'pilamiHydra_'+name+'(')).join('\n')+'\nvoid main(){ gl_FragColor='+expression+'; }';
  body=body.replace(/\bsampler2D\b/g,'sampler2DRect').replace(/\btexture2D\s*\(/g,'pilamiSample(');
  if(/\]\]>/.test(body))throw Error('Le shader contient une séquence XML non prise en charge.');
  const uniforms=[['tex0','int','0'],['texdim0','vec2',null],['time','float','0'],['pilamiGain','float','4'],['pilamiAudio','vec3','0 0 0'],...controls.map((c,i)=>['pilamiP'+i,'float',String(c.value)])];
  const fragment='#version 120\nuniform sampler2DRect tex0;\nuniform vec2 texdim0;\nuniform float time,pilamiGain;\nuniform vec3 pilamiAudio;\nvarying vec2 uv;\n'+controls.map((c,i)=>'uniform float pilamiP'+i+';').join('\n')+'\nvec4 pilamiSample(sampler2DRect t,vec2 st){return texture2DRect(t,fract(st)*texdim0);}\n'+body;
  const vertex='#version 120\nuniform vec2 texdim0;\nvarying vec2 uv;\nvoid main(){gl_Position=ftransform();uv=vec2(gl_TextureMatrix[0]*gl_MultiTexCoord0)/texdim0;}';
  const jxs='<jittershader name="pilami.hydra.export.v1">\n<description>Hydra shader exported by Pilami. See LICENSE and NOTICE.</description>\n'+uniforms.map(([n,t,v])=>'<param name="'+n+'" type="'+t+'" '+(n==='texdim0'?'state="TEXDIM0"':'default="'+xml(v)+'"')+'/>').join('\n')+'\n<language name="glsl" version="1.0">\n'+uniforms.map(([n])=>'<bind param="'+n+'" program="fp"/>').join('\n')+'\n<bind param="texdim0" program="vp"/>\n<program name="vp" type="vertex"><![CDATA[\n'+vertex+'\n]]></program>\n<program name="fp" type="fragment"><![CDATA[\n'+fragment+'\n]]></program>\n</language></jittershader>\n';
  return {controls,jxs,fragment,bands:[...bands],speed:context.speed};
 }
 function device(template,compiled,slug,resolution){
  const p=clone(template.patcher),controls=compiled.controls,n=controls.length;
  const sizes=[[640,360],[960,540],[1280,720],[1920,1080],[2560,1440],[3840,2160]];
  const requested=[Number(resolution?.width),Number(resolution?.height)];let choice=sizes.findIndex(s=>s[0]===requested[0]&&s[1]===requested[1]);if(choice<0)choice=1;
  const link=(s,o,d,i=0)=>p.lines.push({patchline:{source:[s,o],destination:[d,i]}});
  const paramData=[...controls,{label:'Sensibilite audio',min:0,max:20,value:4},{label:'Vitesse animation',min:Math.min(-4,compiled.speed),max:Math.max(4,compiled.speed),value:compiled.speed}];
  for(let i=0;i<paramData.length;i++){
   const c=paramData[i],id='dial'+i,d=clone(template.dial);let rect;
   if(i<n)rect=[18+(i%8)*94,38+Math.floor(i/8)*71,65,37];
   else rect=[945+(i-n)*82,32,65,37];
   d.id=id;d.varname='pilamiP'+i;d.presentation_rect=rect;d.patching_rect=[18+(i%8)*94,58+Math.floor(i/8)*85,65,37];
   const v=d.saved_attribute_attributes.valueof;Object.assign(v,{parameter_initial:[c.value],parameter_mmin:c.min,parameter_mmax:c.max,parameter_longname:c.label+' ['+(i+1)+']',parameter_shortname:c.label.slice(0,12)});
   p.boxes.push({box:d},{box:{id:'lab'+i,maxclass:'comment',text:c.label.replace(/_/g,' '),fontsize:10,numinlets:1,numoutlets:0,patching_rect:[rect[0]-8,rect[1]-16,94,18],presentation:1,presentation_rect:[rect[0]-8,rect[1]-16,94,18]}},{box:{id:'pre'+i,maxclass:'newobj',text:'prepend param '+i,numinlets:1,numoutlets:1,patching_rect:[18+(i%8)*94,110+Math.floor(i/8)*85,90,20]}});
   p.parameters[id]=[v.parameter_longname,v.parameter_shortname,0];link(id,0,'pre'+i);link('pre'+i,0,'js');
  }
  for(const x of p.boxes){const b=x.box;
   if(b.id==='js'){b.text='js '+slug+'-runtime.js';b.saved_object_attributes.filename=slug+'-runtime.js';}
   if(b.id==='slab')b.text=b.text.replace('pilami-hyper.jxs',slug+'.jxs');
   if(['slab','history','zero'].includes(b.id))b.text=b.text.replace(/(?:@dim |char )960 540/,m=>m.replace('960 540',sizes[choice].join(' ')));
   if(b.id==='resolution')b.saved_attribute_attributes.valueof.parameter_initial=[choice];
  }
  p.dependency_cache=[{name:slug+'-runtime.js',type:'TEXT',implicit:1},{name:slug+'.jxs',type:'TEXT',implicit:1}];
  // Native Live parameter banks, so controllers can also be reached from hardware.
  const ids=paramData.map((_,i)=>'dial'+i);for(let i=0;i<ids.length;i+=8)p.parameters.parameterbanks[i/8]={index:i/8,name:'Visuel '+(i/8+1),parameters:ids.slice(i,i+8).concat(Array(8).fill('-')).slice(0,8)};
  const json=new TextEncoder().encode(JSON.stringify({patcher:p})+'\n\0'),data=new Uint8Array(32+json.length);data.set(template.header);new DataView(data.buffer).setUint32(28,json.length,true);data.set(json,32);
  const runtime='/* SPDX-License-Identifier: AGPL-3.0-or-later */\nautowatch=1;inlets=1;outlets=1;\nvar values='+JSON.stringify(paramData.map(c=>c.value))+';\nvar bands=[0,0,0],clock=0,last=0;\nfunction param(i,v){i=Number(i);v=Number(v);if(i>=0&&i<values.length&&isFinite(v))values[i]=v;}\nfunction low(v){bands[0]=Math.max(0,Number(v)||0);}\nfunction mid(v){bands[1]=Math.max(0,Number(v)||0);}\nfunction high(v){bands[2]=Math.max(0,Number(v)||0);}\nfunction tick(){var now=new Date().getTime();if(last)clock+=Math.min(100,Math.max(0,now-last))*0.001*values['+(n+1)+'];last=now;outlet(0,"param","time",clock);outlet(0,"param","pilamiGain",values['+n+']);outlet(0,["param","pilamiAudio",bands[0],bands[1],bands[2]]);for(var i=0;i<'+n+';i++)outlet(0,"param","pilamiP"+i,values[i]);}\n';
  return{amxd:data,runtime};
 }
 const crcTable=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
 function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
 function zip(files){
  const enc=new TextEncoder(),parts=[],central=[];let offset=0,total=0;
  for(const f of files){const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data),local=new Uint8Array(30+name.length),l=new DataView(local.buffer);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,0x21,true);l.setUint32(14,crc,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,name.length,true);local.set(name,30);parts.push(local,data);const entry=new Uint8Array(46+name.length),c=new DataView(entry.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);entry.set(name,46);central.push(entry);total+=entry.length;offset+=local.length+data.length;}
  const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,total,true);v.setUint32(16,offset,true);return new Blob([...parts,...central,end],{type:'application/zip'});
 }
 function build(options,template){
  const compiled=compile(options,template.utilities),slug=(options.name||'Visuel-Pilami').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,64)||'Visuel-Pilami';
  const native=device(template,compiled,slug,options.resolution);
  const readme='PILAMI — EXPORT MAX FOR LIVE — PROTOTYPE 1\n\n1. Extraire TOUT le ZIP dans un dossier permanent.\n2. Glisser '+slug+'.amxd sur une piste audio, un groupe ou le Master dans Live 11 Suite (Max 8).\n3. Activer « Visuel actif ». Le son de cette piste traverse le périphérique sans modification.\n4. Régler Sensibilite audio pour doser la réaction. Les paramètres visuels sont automatisables dans Live.\n5. Conserver les fichiers .js et .jxs à côté du .amxd. Aucun copier-coller dans Max n’est nécessaire.\n\nExport natif Jitter, sans navigateur. Une seule chaîne Hydra et 16 contrôleurs maximum. Les extensions déjà chargées et les fonctions GLSL de la chaîne sont intégrées. Le feedback de la sortie est conservé ; son image précédente repart du noir à chaque chargement.\n\nL’audio est adapté en trois enveloppes (graves/médiums/aigus), pas une reproduction exacte de l’analyse FFT du navigateur. Le gain peut nécessiter un ajustement. Les sources par notes, images, vidéos, simulations multi-buffers, tableaux temporels et callbacks JavaScript complexes sont refusés.\n\nLes snapshots, le séquenceur, les affectations MIDI et Link du labo ne sont pas transférés dans cette version. Utiliser les automations et les affectations MIDI de Live. La vitesse d’animation reste réglable.\n\nLes fichiers LICENSE et NOTICE contiennent les licences du moteur et du shader. Les droits du code du preset restent ceux de son auteur.\n';
  return{compiled,files:[{name:slug+'.amxd',data:native.amxd},{name:slug+'-runtime.js',data:native.runtime},{name:slug+'.jxs',data:compiled.jxs},{name:'LISEZ-MOI.txt',data:readme},{name:'LICENSE',data:template.license},{name:'NOTICE.txt',data:template.notice}],slug};
 }
 function validateShader(compiled,gl){
  if(!gl||gl.isContextLost())throw Error('Le moteur graphique est indisponible. Relance le visuel.');
  const shader=gl.createShader(gl.FRAGMENT_SHADER);
  try{
   const source=compiled.fragment.replace('#version 120','precision highp float;').replace(/sampler2DRect/g,'sampler2D').replace('texture2DRect(t,fract(st)*texdim0)','texture2D(t,fract(st))');
   gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Cette chaîne ne passe pas encore la conversion du shader : '+gl.getShaderInfoLog(shader));
  }finally{gl.deleteShader(shader);}
 }
 let templatePromise;
 async function download(options){
  const doc=options.document||document;
  if(!doc.defaultView||doc.defaultView.closed)throw Error('La fenêtre d’export a été fermée.');
  if(!templatePromise)templatePromise=fetch(templateURL,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('Modèle Max inaccessible. Recharge le labo après la mise à jour.');return r.json();}).catch(e=>{templatePromise=null;throw e;});
  const result=build(options,await templatePromise);validateShader(result.compiled,options.context.gl);const url=URL.createObjectURL(zip(result.files)),a=doc.createElement('a');a.href=url;a.download=result.slug+'-Max-for-Live.zip';doc.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return result;
 }
 window.PilamiMaxExport={compile,device,build,zip,download,validateShader};
})();
