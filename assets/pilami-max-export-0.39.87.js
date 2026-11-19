/* Pilami native Max for Live export prototype. SPDX-License-Identifier: AGPL-3.0-or-later */
(function(){
 'use strict';
 const templateURL=new URL('max4live/template-v1.json',document.currentScript.src).href;
 const float=n=>{if(!Number.isFinite(Number(n)))throw Error('Valeur numérique non finie.');const s=String(Number(n));return /[.e]/i.test(s)?s:s+'.0';};
 const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const clone=o=>JSON.parse(JSON.stringify(o));
 function selection(entries,selectedControls){
  const selected=selectedControls===undefined?entries.slice(0,16).map((_,i)=>i):selectedControls;
  if(!Array.isArray(selected)||selected.length>16||new Set(selected).size!==selected.length||selected.some(i=>!Number.isInteger(i)||i<0||i>=entries.length))throw Error('Choisis au maximum 16 contrôleurs différents dans cette liste.');
  return selected.slice();
 }
 function compile({source,entries,context,selectedControls},utilities){
  if(!context?.source||context.all)throw Error('Lance un visuel avec une seule sortie, par exemple render(o0), puis réessaie.');
  const chosen=selection(entries,selectedControls),slots=new Map(chosen.map((index,slot)=>[index,slot]));
  if(!Number.isFinite(context.speed))throw Error('La vitesse Hydra doit être un nombre fixe.');
  const notices=[],tree=acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true,onComment:(_block,text)=>{if(/copyright|SPDX-License-Identifier|@license|licen[sc]e/i.test(text))notices.push(text.trim());}}),decls=new Map(),count={out:0},bands=new Set();
  function walk(n){
   if(!n||typeof n!=='object')return;
   if(n.type==='VariableDeclarator'&&n.id.type==='Identifier')decls.set(n.id.name,n.init);
   if(n.type==='AssignmentExpression'&&n.left.type==='Identifier'&&['update','time','bpm'].includes(n.left.name))throw Error('Les scripts qui redéfinissent '+n.left.name+' ne sont pas encore exportables.');
   if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.property.name==='out')count.out++;
   for(const [k,v]of Object.entries(n)){if(k==='loc')continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object'&&v.type)walk(v);}
  }walk(tree);
  if(count.out!==1)throw Error('Ce prototype exporte une seule chaîne .out(). Les simulations à plusieurs buffers viendront ensuite.');
  const allControls=entries.map((e,i)=>{
   if(![e.value,e.min,e.max].every(Number.isFinite)||e.min>=e.max)throw Error('Bornes invalides : '+e.label);
   if(e.audio&&(!Number.isInteger(e.audio.band)||e.audio.band<0||e.audio.band>=16||!Number.isFinite(e.audio.depth)))throw Error('Les sources par notes ne sont pas prises en charge : '+e.label);
   return{label:String(e.label),value:e.value,min:e.min,max:e.max,kind:e.kind,audio:e.audio?{band:e.audio.band,depth:e.audio.depth}:null};
  });
  const controls=chosen.map(i=>allControls[i]);
  const bins=(()=>{let max=6;function find(n){if(!n||!n.type)return;if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object.name==='a'&&n.callee.property.name==='setBins'&&n.arguments[0]?.type==='Literal')max=Number(n.arguments[0].value);for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(find);else if(v?.type)find(v);}}find(tree);return Math.max(1,Math.min(16,max));})();
  function band(n){if(!Number.isInteger(n)||n<0||n>=16)throw Error('Bande audio non prise en charge : '+n);bands.add(n);return 'pilamiAudio.'+(n<bins/3?'x':n<bins*2/3?'y':'z');}
  function control(i){const e=allControls[i];let v=slots.has(i)?'pilamiP'+slots.get(i):float(e.value);if(e.audio)v='clamp('+v+' + '+band(e.audio.band)+' * pilamiGain * '+float(e.audio.depth)+', '+float(e.min)+', '+float(e.max)+')';if(e.kind==='toggle')v='mix('+float(e.min)+', '+float(e.max)+', step('+float((e.min+e.max)/2)+', '+v+'))';return v;}
  const names=new Map(entries.map((e,i)=>[e.label,i])),getters=new Map(entries.map((e,i)=>[e.get,i]));
  function numeric(n,seen=new Set(),props='',locals=new Map()){
   if(!n)throw Error('Expression vide dans un paramètre.');
   const expr=node=>numeric(node,seen,props,locals);
   if(n.type==='Literal'&&typeof n.value==='number')return float(n.value);
   if(n.type==='Literal'&&typeof n.value==='boolean')return n.value?'1.0':'0.0';
   if(n.type==='ChainExpression')return expr(n.expression);
   if(n.type==='Identifier'){
    if(locals.has(n.name))return locals.get(n.name);
    if(n.name==='time')return 'time';
    if(names.has(n.name))return control(names.get(n.name));
    if(seen.has(n.name)||!decls.has(n.name))throw Error('Expression non exportable : '+n.name);
    const next=new Set(seen);next.add(n.name);return numeric(decls.get(n.name),next,props,locals);
   }
   if(n.type==='UnaryExpression'&&['+','-','!'].includes(n.operator))return n.operator==='!'?'(('+expr(n.argument)+') == 0.0 ? 1.0 : 0.0)':'('+n.operator+expr(n.argument)+')';
   if(n.type==='LogicalExpression'){
    const a=expr(n.left),b=expr(n.right);
    if(n.operator==='??')return a; // Supported operands are finite numeric controls, bands or numeric formulas.
    if(n.operator==='||')return '(('+a+') != 0.0 ? ('+a+') : ('+b+'))';
    if(n.operator==='&&')return '(('+a+') != 0.0 ? ('+b+') : ('+a+'))';
   }
   if(n.type==='ConditionalExpression')return '(('+expr(n.test)+') != 0.0 ? ('+expr(n.consequent)+') : ('+expr(n.alternate)+'))';
   if(n.type==='BinaryExpression'){
    const a=expr(n.left),b=expr(n.right);
    if(['<','<=','>','>=','==','===','!=','!=='].includes(n.operator))return '('+a+({'===':'==','!==':'!='}[n.operator]||n.operator)+b+' ? 1.0 : 0.0)';
    if(['+','-','*','/','%','**'].includes(n.operator))return n.operator==='%'?'mod('+a+','+b+')':n.operator==='**'?'pow('+a+','+b+')':'('+a+n.operator+b+')';
   }
   if(n.type==='MemberExpression'){
    if(n.object.name==='Math'&&n.property.name==='PI')return float(Math.PI);
    if(n.object.name==='Math'&&n.property.name==='E')return float(Math.E);
    if(props&&n.object.name===props&&n.property.name==='time')return 'time';
    if(n.computed&&n.object.type==='MemberExpression'&&n.object.object.name==='a'&&n.object.property.name==='fft'&&n.property.type==='Literal')return '('+band(n.property.value)+' * pilamiGain)';
   }
   if(n.type==='CallExpression'){
    if(n.callee.type==='Identifier'&&n.arguments.length===0)return expr(n.callee);
    if(n.callee.type==='Identifier'&&['H','Number'].includes(n.callee.name)&&n.arguments.length===1)return expr(n.arguments[0]);
    if(n.callee.type==='MemberExpression'&&n.callee.object.name==='Number'&&n.callee.property.name==='isFinite'&&n.arguments.length===1){const v=expr(n.arguments[0]);return '(('+v+') == ('+v+') && abs('+v+') <= 3.402823e38 ? 1.0 : 0.0)';}
    if(n.callee.type==='MemberExpression'&&n.callee.object.name==='Math'&&!n.callee.computed){
     const key=n.callee.property.name,arity={sin:1,cos:1,tan:1,abs:1,sqrt:1,exp:1,log:1,floor:1,ceil:1,pow:2,min:2,max:2};
     if(arity[key]===n.arguments.length)return key+'('+n.arguments.map(expr).join(',')+')';
    }
   }
   if(['ArrowFunctionExpression','FunctionExpression'].includes(n.type)){
    let body=n.body;const inner=new Map(locals),arg=n.params[0];let innerProps=props;
    if(n.params.length>1)throw Error('Signature de callback non prise en charge.');
    if(arg?.type==='Identifier')innerProps=arg.name;
    else if(arg?.type==='ObjectPattern'){
     for(const property of arg.properties){if(property.type!=='Property'||property.computed||property.key.name!=='time'||property.value.type!=='Identifier')throw Error('Seule la propriété time est prise en charge dans ce callback.');inner.set(property.value.name,'time');}
    }else if(arg)throw Error('Signature de callback non prise en charge.');
    const convert=node=>numeric(node,seen,innerProps,inner);
    if(body.type==='BlockStatement'){
     const statements=body.body.filter(node=>node.type!=='EmptyStatement');let result=null;
     for(const statement of statements){
      if(result!==null)throw Error('Instructions après le return du callback non prises en charge.');
      if(statement.type==='VariableDeclaration'){
       for(const d of statement.declarations){if(d.id.type!=='Identifier'||!d.init)throw Error('Déclaration locale non prise en charge.');inner.set(d.id.name,convert(d.init));}
      }else if(statement.type==='ReturnStatement'&&statement.argument)result=convert(statement.argument);
      else throw Error('Instruction de callback non prise en charge : '+statement.type+'. Les variables locales et un return numérique sont acceptés.');
     }
     if(result===null)throw Error('Le callback doit retourner un nombre.');return result;
    }
    return convert(body);
   }
   throw Error('Expression JavaScript non prise en charge : '+n.type+'. Utilise une formule numérique simple.');
  }
  function dynamic(fn){
   if(getters.has(fn))return control(getters.get(fn));
   const meta=Object.prototype.hasOwnProperty.call(fn,'_pilamiMaxValue')?fn._pilamiMaxValue:null;
   if(meta?.kind==='constant')return float(meta.value);
   if(meta?.kind==='control'){
    const index=entries.findIndex(e=>e.id===meta.id);if(index>=0)return control(index);
   }
   let ast;try{ast=acorn.parse('('+Function.prototype.toString.call(fn)+')',{ecmaVersion:'latest'}).body[0].expression;}catch(_){throw Error('Callback impossible à convertir.');}
   return numeric(ast);
  }
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
      const target=context.source._pilamiMaxTarget||context.output;
      const same=v===target||!!(v.fbos&&target?.fbos&&v.fbos===target.fbos);
      if(!same){
       const label=typeof v.label==='string'?v.label:'',targetLabel=typeof target?.label==='string'?target.label:'sortie courante';
       const kind=context.outputs?.includes(v)||/^o[0-9]+$/.test(label)?'un autre buffer '+label+' (sortie exportée : '+targetLabel+')':/^s[0-9]+$/.test(label)?'une source externe '+label:'une texture externe';
       throw Error('Référence à '+kind+' dans '+t.name+'.'+spec.name+' : ce prototype ne prend en charge que le feedback de la sortie exportée.');
      }
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
  const uniforms=[['tex0','int','0'],['texdim0','vec2',null],['resolution','vec2',null],['time','float','0'],['pilamiGain','float','4'],['pilamiAudio','vec3','0 0 0'],...controls.map((c,i)=>['pilamiP'+i,'float',String(c.value)])];
  const fragment='#version 120\nuniform sampler2DRect tex0;\nuniform vec2 texdim0,resolution;\nuniform float time,pilamiGain;\nuniform vec3 pilamiAudio;\nvarying vec2 uv;\n'+controls.map((c,i)=>'uniform float pilamiP'+i+';').join('\n')+'\nvec4 pilamiSample(sampler2DRect t,vec2 st){return texture2DRect(t,fract(st)*texdim0);}\n'+body;
  const vertex='#version 120\nuniform vec2 texdim0;\nvarying vec2 uv;\nvoid main(){gl_Position=ftransform();uv=vec2(gl_TextureMatrix[0]*gl_MultiTexCoord0)/texdim0;}';
  const jxs='<jittershader name="pilami.hydra.export.v1">\n<description>Hydra shader exported by Pilami. See LICENSE and NOTICE.</description>\n'+uniforms.map(([n,t,v])=>'<param name="'+n+'" type="'+t+'" '+(['texdim0','resolution'].includes(n)?'state="TEXDIM0"':'default="'+xml(v)+'"')+'/>').join('\n')+'\n<language name="glsl" version="1.0">\n'+uniforms.map(([n])=>'<bind param="'+n+'" program="fp"/>').join('\n')+'\n<bind param="texdim0" program="vp"/>\n<program name="vp" type="vertex"><![CDATA[\n'+vertex+'\n]]></program>\n<program name="fp" type="fragment"><![CDATA[\n'+fragment+'\n]]></program>\n</language></jittershader>\n';
  return {controls,allControls,selectedControls:chosen,notices,jxs,fragment,bands:[...bands],speed:context.speed};
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
  const readme='PILAMI — EXPORT MAX FOR LIVE — PROTOTYPE 1\n\n1. Extraire TOUT le ZIP dans un dossier permanent.\n2. Glisser '+slug+'.amxd sur une piste audio, un groupe ou le Master dans Live 11 Suite (Max 8).\n3. Activer « Visuel actif ». Le son de cette piste traverse le périphérique sans modification.\n4. Régler Sensibilite audio pour doser la réaction. Les paramètres visuels sont automatisables dans Live.\n5. Conserver les fichiers .js et .jxs à côté du .amxd. Aucun copier-coller dans Max n’est nécessaire.\n\nExport natif Jitter, sans navigateur. Une seule chaîne Hydra et 16 contrôleurs exposés maximum. Les autres conservent leur valeur de base au moment de l’export et leur modulation audio compatible. Paramètres globaux audio/vitesse ajoutés séparément. Les extensions déjà chargées et les fonctions GLSL de la chaîne sont intégrées. Le feedback de la sortie est conservé ; son image précédente repart du noir à chaque chargement.\n\nL’audio est adapté en trois enveloppes (graves/médiums/aigus), pas une reproduction exacte de l’analyse FFT du navigateur. Le gain peut nécessiter un ajustement. Les sources par notes, images, vidéos, simulations multi-buffers, tableaux temporels et callbacks JavaScript complexes sont refusés.\n\nLes snapshots, le séquenceur, les affectations MIDI et Link du labo ne sont pas transférés dans cette version. Utiliser les automations et les affectations MIDI de Live. La vitesse d’animation reste réglable.\n\nLes fichiers LICENSE et NOTICE contiennent les licences du moteur et du shader. Les droits du code du preset restent ceux de son auteur.\n';
  return{compiled,files:[{name:slug+'.amxd',data:native.amxd},{name:slug+'-runtime.js',data:native.runtime},{name:slug+'.jxs',data:compiled.jxs},{name:'LISEZ-MOI.txt',data:readme+'\n\nCONTRÔLEURS EXPOSÉS DANS LIVE\n'+compiled.controls.map(c=>'- '+c.label).join('\n')+'\n\nCONTRÔLEURS NON EXPOSÉS (VALEUR DE BASE CONSERVÉE)\n'+compiled.allControls.filter((c,i)=>!compiled.selectedControls.includes(i)).map(c=>'- '+c.label+' : '+c.value+(c.audio?' (modulation audio conservée)':'')).join('\n')+'\n'},{name:'LICENSE',data:template.license},{name:'NOTICE.txt',data:template.notice+(compiled.notices.length?'\n\nPRESET — NOTICES FOURNIES AVEC LE CODE\n'+compiled.notices.join('\n'):'')}],slug};
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
 // Static checks also run before playback, so unsupported presets are labelled immediately.
 function eligibility(source){
  if(!source.trim())return {status:'idle',reason:'Choisis un preset.'};
  let tree;try{tree=acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true});}catch(e){return {status:'unsupported',reason:'Code JavaScript invalide : '+e.message};}
  let outputs=0,controls=0,reason='';
  function walk(n){
   if(!n||!n.type)return;
   if(n.type==='CallExpression'){
    const c=n.callee,method=c.type==='MemberExpression'&&!c.computed?c.property.name:c.type==='Identifier'?c.name:'';
    if(method==='out')outputs++;
    if(c.type==='Identifier'&&['slider','knob','fader','toggle'].includes(method))controls++;
    if(['imageSource','initImage','initVideo','initCam','initScreen'].includes(method))reason='Images, vidéos et captures non prises en charge.';
   }
   for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v?.type)walk(v);}
  }walk(tree);
  if(outputs>1)return {status:'unsupported',reason:'Plusieurs chaînes .out() / buffers : une seule chaîne est prise en charge pour le moment.'};
  if(outputs===0)return {status:'unsupported',reason:'Aucune chaîne Hydra .out() à exporter.'};
  if(reason)return {status:'unsupported',reason};
  return {status:'pending',reason:controls>16?controls+' contrôleurs disponibles, jusqu’à 16 à choisir pour Live. Lance le visuel pour vérifier sa compatibilité.':'Lance le visuel pour vérifier sa compatibilité.'};
 }
 let templatePromise;
 function loadTemplate(){
  if(!templatePromise)templatePromise=fetch(templateURL,{credentials:'same-origin',signal:AbortSignal.timeout(15000)}).then(r=>{if(!r.ok)throw Error('Modèle Max inaccessible (HTTP '+r.status+'). Recharge le labo après la mise à jour.');return r.json();}).catch(e=>{templatePromise=null;throw e;});
  return templatePromise;
 }
 async function inspect(options){
  const staticResult=eligibility(options.source);
  if(staticResult.status!=='pending')return staticResult;
  if(!options.ready)return staticResult;
  let template;try{template=await loadTemplate();}catch(e){return {status:'error',reason:'Vérification impossible : '+e.message};}
  try{const compiled=compile(options,template.utilities);validateShader(compiled,options.context?.gl);return {status:'ready',reason:options.entries.length>16?'Exportable — choisis jusqu’à 16 contrôleurs parmi les '+options.entries.length+' disponibles.':'Exportable — choisis les contrôleurs à afficher dans Live (16 maximum).'};}
  catch(e){return {status:'unsupported',reason:e.message};}
 }
 async function download(options){
  const doc=options.document||document;
  if(!doc.defaultView||doc.defaultView.closed)throw Error('La fenêtre d’export a été fermée.');
  const result=build(options,await loadTemplate());validateShader(result.compiled,options.context.gl);const url=URL.createObjectURL(zip(result.files)),a=doc.createElement('a');a.href=url;a.download=result.slug+'-Max-for-Live.zip';doc.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return result;
 }
 function open({document:doc=document,getOptions}){
  return new Promise((resolve,reject)=>{
   if(!doc.defaultView||doc.defaultView.closed){reject(Error('La fenêtre d’export a été fermée.'));return;}
   const initial=getOptions(),signature=o=>JSON.stringify([o.source,o.entries.map(e=>[e.id,e.label])]),identity=signature(initial);
   const dialog=doc.createElement('dialog');dialog.className='pilami-max-export-dialog';dialog.setAttribute('aria-label','Exporter pour Max for Live');
   const make=(tag,text,attrs={})=>{const e=doc.createElement(tag);if(text!==null)e.textContent=text;for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
   const style=make('style',`
    dialog.pilami-max-export-dialog{box-sizing:border-box;position:fixed;inset:0;width:min(720px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;margin:auto;padding:24px;border:1px solid #7688a6;border-radius:14px;background:var(--pilami-editor-bg,var(--editor-bg,#122033));color:var(--pilami-editor-text,var(--editor-text,#edf4ff));font:14px/1.5 system-ui,sans-serif;box-shadow:0 20px 80px #0008}
    .pilami-max-export-dialog::backdrop{background:#0009}.pilami-max-export-dialog *{box-sizing:border-box}.pilami-max-export-dialog h2{margin:0 0 10px;color:inherit;font-size:21px}.pilami-max-export-dialog p{margin:10px 0}.pilami-max-export-dialog button{padding:8px 12px;margin:0;border:1px solid #8193b088;border-radius:7px;background:transparent;color:inherit;font:inherit;cursor:pointer}.pilami-max-export-dialog button[type=submit]{background:#356aab;color:white}.pilami-max-export-dialog button:disabled{opacity:.5;cursor:default}.pilami-max-export-dialog .max-export-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:14px}.pilami-max-export-dialog .max-export-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:7px;margin:14px 0}.pilami-max-export-dialog label{display:flex;gap:10px;align-items:flex-start;padding:9px;border:1px solid #8193b044;border-radius:7px;overflow-wrap:anywhere}.pilami-max-export-dialog input{flex:0 0 auto;width:18px;height:18px;margin:2px 0 0}.pilami-max-export-dialog small{display:block;opacity:.75}.pilami-max-export-dialog [role=alert]{color:#ee9c89;white-space:pre-wrap;overflow-wrap:anywhere}.pilami-max-export-dialog :focus-visible{outline:2px solid #83baff;outline-offset:3px}
   `);
   const form=make('form',null),counter=make('p','',{role:'status','aria-live':'polite','data-max-counter':''}),list=make('div',null,{class:'max-export-list'}),alert=make('p','',{role:'alert'}),actions=make('div',null,{class:'max-export-actions'}),tools=make('div',null,{class:'max-export-actions'});
   form.append(make('h2','Exporter pour Max for Live'),make('p','Choisis jusqu’à 16 contrôleurs à afficher et automatiser dans Live. Les autres gardent leur valeur actuelle et leur modulation audio compatible dans le visuel.'),make('small','Les réglages seront capturés au moment de cliquer sur Exporter. Sensibilité audio, vitesse et résolution restent disponibles séparément.'),tools,counter,list,alert,actions);dialog.append(style,form);
   const first=make('button','Les 16 premiers',{type:'button'}),none=make('button','Tout désélectionner',{type:'button'});tools.append(first,none);
   const checks=initial.entries.map((e,i)=>{
    const label=make('label',null),input=make('input',null,{type:'checkbox','data-max-control':String(i)}),text=make('span',e.label),detail=make('small','Valeur : '+e.value+' · '+e.min+' → '+e.max+(e.audio?' · audio':''));input.checked=i<16;text.append(detail);label.append(input,text);list.append(label);return input;
   });
   const submit=make('button','Exporter',{type:'submit'}),cancel=make('button','Annuler',{type:'button'});actions.append(cancel,submit);
   let busy=false,settled=false;
   const selected=()=>checks.flatMap((input,i)=>input.checked?[i]:[]);
   function refresh(){const count=selected().length;counter.textContent=count+' / 16 contrôleurs sélectionnés · '+(checks.length-count)+' non exposés';submit.textContent=busy?'Préparation…':'Exporter ('+count+'/16)';submit.disabled=busy||count>16;first.disabled=none.disabled=busy;checks.forEach(input=>{input.disabled=busy||!input.checked&&count>=16;});}
   function finish(result){if(settled)return;settled=true;doc.defaultView.removeEventListener('unload',unload);if(dialog.open)dialog.close();dialog.remove();resolve(result);}
   function unload(){finish(null);}
   checks.forEach(input=>input.addEventListener('change',refresh));first.addEventListener('click',()=>{checks.forEach((input,i)=>input.checked=i<16);refresh();});none.addEventListener('click',()=>{checks.forEach(input=>input.checked=false);refresh();});
   cancel.addEventListener('click',()=>finish(null));dialog.addEventListener('cancel',event=>{event.preventDefault();if(!busy)finish(null);});dialog.addEventListener('keydown',event=>event.stopPropagation());
   form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;alert.textContent='';
    try{
     const fresh=getOptions();if(signature(fresh)!==identity)throw Error('Le preset a changé. Ferme cette fenêtre puis relance l’export.');
     const selectedControls=selection(fresh.entries,selected());busy=true;cancel.disabled=true;refresh();counter.textContent='Préparation du pack Max for Live…';
     const result=await download({...fresh,document:doc,selectedControls});finish(result);
    }catch(error){if(!settled)alert.textContent=error.message;}
    finally{busy=false;cancel.disabled=false;if(!settled)refresh();}
   });
   doc.defaultView.addEventListener('unload',unload,{once:true});doc.body.append(dialog);refresh();dialog.showModal();
  });
 }
 window.PilamiMaxExport={compile,device,build,zip,download,validateShader,eligibility,inspect,selection,open};
})();
