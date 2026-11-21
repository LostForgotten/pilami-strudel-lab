/* Pilami Max 9.2 web export. SPDX-License-Identifier: AGPL-3.0-or-later */
(function(){
 'use strict';
 const PLAYER_VERSION='0.39.96',PLAYER_FILE='player-0.39.96.js';
 const base=new URL('max4live/',document.currentScript.src),clone=o=>JSON.parse(JSON.stringify(o));
 function clean(source){
  source=window.PilamiHydraTransfer?.sanitizeExport(source)||source;
  const comments=[];acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true,onComment:comments});
  for(const c of comments.reverse())if(/^\s*PILAMI_(?:NOTE_SOURCES|SNAPSHOTS|PRESET_FULL)_V1\s/.test(c.value))source=source.slice(0,c.start)+source.slice(c.end);
  return source.trim();
 }
 function analyze(source){
  if(!source.trim())return {status:'idle',reason:'Choisis un preset.'};
  let tree;try{tree=acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true});}catch(e){return {status:'unsupported',reason:'Code JavaScript invalide : '+e.message};}
  const calls=[],images=new Set();let hasInit=false,midi=false,reason='';
  function walk(n){
   if(!n?.type)return;
   if(n.type==='ImportExpression')reason='Import JavaScript externe : intègre la bibliothèque au preset avant cet export.';
   if(n.type==='NewExpression'&&['AudioContext','webkitAudioContext','Audio'].includes(n.callee.name))reason='Audio WebAudio direct non relié à Live dans cet export. Utilise une adaptation native dédiée.';
   if(n.type==='MemberExpression'&&n.property?.name==='PilamiMidiOutput')midi=true;
   if(n.type==='CallExpression'){
    const c=n.callee,method=c.type==='MemberExpression'&&!c.computed?c.property.name:c.type==='Identifier'?c.name:'';
    if(c.type==='Identifier'&&['slider','knob','fader','toggle'].includes(method))calls.push(n);
    if(method==='initHydra')hasInit=true;
    if(['initCam','initScreen','initVideo','getUserMedia','getDisplayMedia','requestMIDIAccess'].includes(method))reason='Caméra, capture, vidéo et accès aux périphériques non inclus dans cet export.';
    if(['createAnalyser','getFloatTimeDomainData','getByteTimeDomainData','connectStream'].includes(method))reason='Ce preset lit les échantillons audio bruts : liaison WebAudio directe absente de cet export. Utilise sa version native dédiée.';
    if(method==='requestAnimationFrame')reason='Boucle requestAnimationFrame autonome : cet export pilote les animations via update(dt).';
    if(method==='fetch')reason='Ressource récupérée par fetch : intègre-la au preset avant cet export autonome.';
    if(method==='loadScript'&&(n.arguments[0]?.type!=='Literal'||!window.PilamiHydraExtensions?.identify(n.arguments[0].value)))reason='Bibliothèque externe non intégrée au lecteur embarqué.';
    if(method==='loadHydraExtension'&&(n.arguments[0]?.type!=='Literal'||!window.PilamiHydraExtensions?.names.includes(n.arguments[0].value)))reason='Extension absente du lecteur embarqué.';
    if(method==='imageSource'||method==='initImage'){
     const arg=n.arguments[method==='imageSource'?1:0];if(arg?.type!=='Literal'||typeof arg.value!=='string')reason='URL d’image calculée : utilise une URL fixe pour intégrer cette image.';else images.add(arg.value);
    }
   }
   for(const v of Object.values(n)){if(Array.isArray(v))v.forEach(walk);else if(v?.type)walk(v);}
  }walk(tree);calls.sort((a,b)=>a.start-b.start);
  return {status:reason?'unsupported':'pending',reason:reason||'Cible Live 12 / Max 9.2 : moteur web embarqué, expérimental.',tree,calls,images:[...images],hasInit,midi};
 }
 function prepare(options){
  const info=analyze(options.source);if(info.status!=='pending')throw Error(info.reason);
  const entries=options.entries||[],descriptors=options.descriptors||[];
  if(info.calls.length!==descriptors.length)throw Error('Relance le visuel avant cet export pour actualiser les contrôleurs.');
  const byId=new Map(entries.map(e=>[e.id,e]));
  const controls=descriptors.map((d,i)=>{
   const e=byId.get(d.id);if(!e||![e.value,e.min,e.max].every(Number.isFinite)||e.min>=e.max)throw Error('Contrôleur absent ou bornes invalides : '+(e?.label||i));
   if(e.audio&&(!Number.isInteger(e.audio.band)||e.audio.band<0||e.audio.band>=16||!Number.isFinite(e.audio.depth)))throw Error('Sources par notes non transférées : '+e.label);
   return {id:e.id,label:String(e.label),value:Math.max(e.min,Math.min(e.max,e.value)),min:e.min,max:e.max,step:e.step,kind:e.kind,audio:e.audio?{band:e.audio.band,depth:e.audio.depth}:null};
  });
  const chosen=window.PilamiMaxExport.selection(entries,options.selectedControls),indexById=new Map(controls.map((c,i)=>[c.id,i]));
  const selectedControls=chosen.map(i=>indexById.get(entries[i].id));if(selectedControls.some(i=>i===undefined))throw Error('Un contrôleur choisi est introuvable.');
  const edits=info.calls.map((n,i)=>({from:n.callee.start,to:n.callee.end,text:'__pilamiMaxControl.bind(null,'+i+')'}));
  let source=options.source;for(const e of edits.sort((a,b)=>b.from-a.from))source=source.slice(0,e.from)+e.text+source.slice(e.to);
  source=clean(source);
  return {source,controls,selectedControls,hasInit:info.hasInit,images:info.images,midi:info.midi};
 }
 async function text(name){const response=await fetch(new URL(name+'?ver='+PLAYER_VERSION,base),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Fichier du lecteur Max 9.2 inaccessible : '+name+' (HTTP '+response.status+').');return response.text();}
 function device(template,pack,slug){
  const p=clone(template.patcher);p.boxes=[];p.lines=[];p.parameters={parameterbanks:{},inherited_shortname:1};p.dependency_cache=[];
  Object.assign(p,{appversion:{major:9,minor:2,revision:0,architecture:'x64',modernui:1},minimum_live_version:'12.0',minimum_max_version:'9.2.0',devicewidth:1320,openrect:[0,0,1320,169],rect:[80,80,1320,850],title:pack.name,description:'Moteur web embarqué — Live 12 / Max 9.2 — expérimental',openinpresentation:1});
  const box=(id,text,numinlets=1,numoutlets=1,other={})=>{const b={id,maxclass:'newobj',text,numinlets,numoutlets,patching_rect:[20+(p.boxes.length%5)*250,240+Math.floor(p.boxes.length/5)*35,235,22],...other};p.boxes.push({box:b});return b;};
  const link=(s,o,d,i=0)=>p.lines.push({patchline:{source:[s,o],destination:[d,i]}});
  const label=(id,text,r)=>box(id,text,1,0,{maxclass:'comment',fontsize:10,presentation:1,presentation_rect:r,patching_rect:r});
  label('title','PILAMI · WEB EMBARQUÉ · LIVE 12 / MAX 9.2 · EXPÉRIMENTAL',[10,2,700,18]);
  const ids=[],controls=pack.selectedControls.map(i=>pack.controls[i]),globals=pack.deviceType==='midi'?[
   {label:'Vitesse animation',min:Math.min(-4,pack.speed),max:Math.max(4,pack.speed),value:pack.speed},{label:'Note MIDI',min:0,max:127,value:pack.midiSettings.number,integer:true},
   {label:'Duree note ms',min:10,max:2000,value:pack.midiSettings.duration,integer:true},{label:'Velocite',min:1,max:127,value:pack.midiSettings.velocity,integer:true}
  ]:[{label:'Sensibilite audio',min:0,max:20,value:4},{label:'Vitesse animation',min:Math.min(-4,pack.speed),max:Math.max(4,pack.speed),value:pack.speed}];
  for(const [i,c]of [...controls,...globals].entries()){
   const n=controls.length,r=i<n?[18+(i%8)*94,38+Math.floor(i/8)*71,65,37]:[925+((i-n)%4)*94,38,65,37],d=clone(template.dial);
   Object.assign(d,{id:'dial'+i,varname:'pilamiWeb'+i,presentation_rect:r,patching_rect:r});
   Object.assign(d.saved_attribute_attributes.valueof,{parameter_initial:[c.value],parameter_mmin:c.min,parameter_mmax:c.max,parameter_longname:c.label+' ['+(i+1)+']',parameter_shortname:c.label.slice(0,14),parameter_type:c.integer?1:0});
   p.boxes.push({box:d});p.parameters[d.id]=[d.saved_attribute_attributes.valueof.parameter_longname,c.label.slice(0,14),0];ids.push(d.id);
   label('label'+i,c.label.replace(/_/g,' '),[r[0]-8,r[1]-16,94,18]);box('pre'+i,'prepend param '+i);link(d.id,0,'pre'+i);link('pre'+i,0,'js');
  }
  const toggleSeed=template.patcher.boxes.find(x=>x.box.id==='run').box;
  function toggle(id,name,x,y,value,selector){const d=clone(toggleSeed);Object.assign(d,{id,varname:id,presentation_rect:[x,y,18,18],patching_rect:[x,y,18,18]});Object.assign(d.saved_attribute_attributes.valueof,{parameter_initial:[value],parameter_longname:name,parameter_shortname:name});p.boxes.push({box:d});label(id+'label',name,[x+25,y,145,18]);p.parameters[id]=[name,name,0];ids.push(id);box(id+'pre','prepend '+selector);link(id,0,id+'pre');link(id+'pre',0,'js');}
  toggle('run','Visuel actif',925,88,0,'run');toggle('full','Plein ecran',1110,88,0,'full');
  if(pack.deviceType==='midi'){toggle('midienabled','MIDI actif',925,113,1,'midi');toggle('dynamic','Dynamique',1110,113,pack.midiSettings.dynamic?1:0,'dynamic');}
  const res=clone(template.patcher.boxes.find(x=>x.box.id==='resolution').box),sizes=[[640,360],[960,540],[1280,720],[1920,1080],[2560,1440],[3840,2160]];
  let choice=sizes.findIndex(s=>s[0]===pack.resolution.width&&s[1]===pack.resolution.height);if(choice<0)choice=1;pack.resolution={width:sizes[choice][0],height:sizes[choice][1]};
  Object.assign(res,{id:'resolution',presentation_rect:[925,145,172,18],patching_rect:[925,145,172,18]});res.saved_attribute_attributes.valueof.parameter_initial=[choice];p.boxes.push({box:res});p.parameters.resolution=['Resolution rendu','Resolution',0];box('respre','prepend resolution');link('resolution',0,'respre');link('respre',0,'js');ids.push('resolution');
  box('reload','Recharger',1,3,{maxclass:'textbutton',mode:0,parameter_enable:0,presentation:1,presentation_rect:[1110,145,140,18]});box('reloadmsg','reload',2,1,{maxclass:'message'});link('reload',0,'reloadmsg');link('reloadmsg',0,'js');
  box('js','js '+slug+'-bridge.js',1,6,{saved_object_attributes:{filename:slug+'-bridge.js',parameter_enable:0}});
  box('world','jit.world @enable 0 @fps 30 @floating 0 @size '+sizes[choice].join(' ')+' @erase_color 0 0 0 1',1,3);link('js',1,'world');
  box('web','jit.gl.web @dim '+sizes[choice].join(' ')+' @fps 30 @consolelog 1',1,2);link('js',0,'web');
  box('route','route ready hit flush error jit_gl_texture jit_matrix',1,7);link('web',0,'route');link('web',1,'route');
  for(const [port,name]of ['ready','hit','flush','error'].entries()){box('in'+name,'prepend '+name);link('route',port,'in'+name);link('in'+name,0,'js');}
  box('tex','prepend jit_gl_texture');box('mat','prepend jit_matrix');link('route',4,'tex');link('route',5,'mat');
  box('screen','jit.gl.videoplane @transform_reset 2 @depth_enable 0');link('tex',0,'screen');link('mat',0,'screen');
  box('metro','qmetro 33');box('tick','tick',2,1,{maxclass:'message'});link('js',4,'metro');link('metro',0,'tick');link('tick',0,'js');
  box('load','loadbang');box('defer','deferlow');box('init','init',2,1,{maxclass:'message'});link('load',0,'defer');link('defer',0,'init');link('init',0,'js');box('free','freebang');box('stop','stop',2,1,{maxclass:'message'});link('free',0,'stop');link('stop',0,'js');
  box('print','print Pilami-Web-export',1,0);link('js',5,'print');
  if(pack.deviceType==='audio'){
   const keep=new Set(['audioin','audioout','mono','half','lowfilter','low0','low1','low2','low3','midfilter','midlp','mid0','mid1','mid2','mid3','highfilter','high0','high1','high2','high3','midsubtract','highsubtract']);
   for(const x of template.patcher.boxes)if(keep.has(x.box.id))p.boxes.push(clone(x));
   for(const l of template.patcher.lines)if(keep.has(l.patchline.source[0])&&(keep.has(l.patchline.destination[0])||l.patchline.destination[0]==='js'))p.lines.push(clone(l));
  }else{
   box('midiin','midiin');box('midiout','midiout',1,0);link('midiin',0,'midiout');
   box('notes','makenote 100 80 @repeatmode 1',3,2);box('pack','pack 0 0',2,1);box('format','midiformat',7,2);link('js',2,'notes');link('js',3,'notes');link('notes',1,'pack',1);link('notes',0,'pack');link('pack',0,'format');link('format',0,'midiout');
  }
  for(let i=0;i<ids.length;i+=8)p.parameters.parameterbanks[i/8]={index:i/8,name:'Web '+(i/8+1),parameters:ids.slice(i,i+8).concat(Array(8).fill('-')).slice(0,8)};
  p.dependency_cache=[{name:slug+'-bridge.js',type:'TEXT',implicit:1},{name:slug+'-web.html',type:'TEXT',implicit:1},{name:PLAYER_FILE,type:'TEXT',implicit:1}];
  const bytes=new TextEncoder().encode(JSON.stringify({patcher:p})+'\n\0'),amxd=new Uint8Array(bytes.length+32);amxd.set(template.header);if(pack.deviceType==='midi')amxd.set([109,109,109,109],8);new DataView(amxd.buffer).setUint32(28,bytes.length,true);amxd.set(bytes,32);
  const runtime=`/* Pilami web bridge. AGPL-3.0-or-later. */
autowatch=1;inlets=1;outlets=6;
var values=${JSON.stringify([...controls,...globals].map(c=>c.value))},n=${controls.length},isMidi=${pack.deviceType==='midi'},on=0,midiOn=1,dyn=${pack.midiSettings.dynamic?1:0},bands=[0,0,0],res=${choice};
var sizes=[[640,360],[960,540],[1280,720],[1920,1080],[2560,1440],[3840,2160]],loaded=0;
function flush(){outlet(3,'flush');}
function param(i,v){i=Number(i);v=Number(v);if(i>=0&&i<values.length&&isFinite(v)){if(isMidi&&i>n)flush();values[i]=v;}tick();}
function run(v){on=Number(v)>0?1:0;if(!on)flush();outlet(1,['enable',on]);outlet(4,on);tick();}
function full(v){outlet(1,['fullscreen',Number(v)>0?1:0]);}
function midi(v){midiOn=Number(v)>0?1:0;if(!midiOn)flush();tick();}
function dynamic(v){dyn=Number(v)>0?1:0;flush();}
function low(v){bands[0]=Math.max(0,Number(v)||0);}
function mid(v){bands[1]=Math.max(0,Number(v)||0);}
function high(v){bands[2]=Math.max(0,Number(v)||0);}
function tick(){outlet(0,['pilami_state',on,isMidi?0:values[n],isMidi?values[n]:values[n+1],isMidi?midiOn:0,bands[0],bands[1],bands[2]].concat(values.slice(0,n)));}
function resolution(v){res=Math.max(0,Math.min(5,Math.round(Number(v)||0)));var s=sizes[res];outlet(0,['dim',s[0],s[1]]);outlet(0,['pilami_resolution',s[0],s[1]]);}
function ready(){loaded=1;resolution(res);tick();}
function hit(strength){strength=Number(strength);if(!isMidi||!on||!midiOn||!isFinite(strength))return;var velocity=dyn?Math.round(127*Math.max(0,Math.min(1,strength))):Math.round(values[n+3]);flush();outlet(2,[Math.round(values[n+1]),Math.max(1,Math.min(127,velocity)),values[n+2]]);}
function error(){flush();outlet(5,['Erreur'].concat(arrayfromargs(arguments)));}
function stop(){on=0;flush();outlet(4,0);tick();outlet(1,['enable',0]);}
function notifydeleted(){flush();}
function reload(){flush();outlet(0,'reload');}
function init(){var path=String(this.patcher.filepath||''),at=Math.max(path.lastIndexOf('/'),path.lastIndexOf('\\\\'));outlet(0,['readfile',(at>=0?path.slice(0,at+1):'')+${JSON.stringify(slug+'-web.html')}]);resolution(res);tick();}
`;
  return {amxd,runtime,patcher:p};
 }
 async function photoData(url,options){
  if(/^data:image\//.test(url))return url;
  if(url.startsWith('pilami-photo:')){const all=await options.exportPhotos?.([url]);const photo=all?.find(p=>url.endsWith(p.id));if(!photo?.data)throw Error('Photo locale absente de cet export.');return photo.data;}
  const response=await fetch(new URL(url,location.href),{credentials:'omit',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Image inaccessible : HTTP '+response.status);const blob=await response.blob();if(!/^image\//.test(blob.type))throw Error('La source n’est pas une image.');return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Image illisible.'));r.readAsDataURL(blob);});
 }
 async function build(options,template){
  const prepared=prepare(options),slug=(options.name||'Visuel-Pilami').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,64)||'Visuel-Pilami';
  const deviceType=options.deviceType||(prepared.midi?'midi':'audio');if(!['midi','audio'].includes(deviceType))throw Error('Type de périphérique invalide.');
  if(prepared.midi&&deviceType!=='midi')throw Error('Ce preset génère du MIDI : choisis Effet MIDI pour conserver ses notes.');
  const m=options.midiSettings||window.PilamiMidiOutput?.state||{},bound=(v,a,b,f)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):f;
  const pack={...prepared,name:options.name||'Visuel Pilami',speed:Number.isFinite(options.context?.speed)?options.context.speed:1,resolution:{...options.resolution},deviceType,midiSettings:{number:Math.round(bound(m.number,0,127,36)),duration:Math.round(bound(m.duration,10,2000,80)),velocity:Math.round(bound(m.velocity,1,127,100)),dynamic:m.dynamic!==false},photos:[]};
  if(![pack.resolution.width,pack.resolution.height].every(v=>Number.isInteger(v)&&v>0))throw Error('Lance le visuel avant de capturer sa résolution.');
  for(const url of prepared.images)pack.photos.push({url,data:await photoData(url,options)});
  const native=device(template,pack,slug),[htmlTemplate,player]=await Promise.all([text('web-player-0.39.96.html'),text('web-player-0.39.96.js')]);
  if(!player.includes('PILAMI_MAX_WEB_PLAYER_VERSION:'+PLAYER_VERSION)||player.includes("if(changed)root.dispatchEvent(new Event('pilami-hydra-controllers-change'))"))throw Error('Lecteur Max for Live périmé : recharger le labo puis réessayer cet export.');
  const safe=JSON.stringify(pack).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  if(!htmlTemplate.includes('{"__pilamiMaxWebPlaceholder":true}'))throw Error('Modèle web invalide.');
  const html=htmlTemplate.replace('{"__pilamiMaxWebPlaceholder":true}',()=>safe).replace('src="player.js"','src="'+PLAYER_FILE+'"');
  if(!html.includes('src="'+PLAYER_FILE+'"'))throw Error('Référence du lecteur Max for Live invalide.');
  const readme='PILAMI — WEB EMBARQUÉ — EXPÉRIMENTAL\n\nRequiert LIVE 12 avec MAX 9.2 ou plus récent sélectionné dans les préférences de Live. Live 12 seul ne garantit pas la présence de jit.gl.web. Incompatible avec Live 11 / Max 8.\n\n1. Extraire TOUT le ZIP dans un dossier permanent.\n2. Glisser '+slug+'.amxd '+(deviceType==='midi'?'sur une piste MIDI, AVANT un instrument.':'sur une piste audio, un groupe ou le Master.')+'\n3. Activer Visuel actif. Garder le HTML, '+PLAYER_FILE+' et le bridge JS ensemble à côté du .amxd.\n4. Les contrôleurs choisis sont exposés dans Live. Les autres gardent leur valeur de base exportée et leur modulation audio compatible. Les horloges et buffers redémarrent au chargement.\n\nLe moteur WebGL/WebGL2 original tourne dans Chromium embarqué via jit.gl.web, puis son image est affichée par Jitter : ce n’est pas une conversion native des shaders. Aucun site ni navigateur externe n’est requis au jeu. Les bibliothèques locales et images déclarées sont intégrées.\n\n'+(deviceType==='audio'?'Le son traverse directement sans traitement. Les bandes audio sont approximées par trois enveloppes MSP ; Sensibilite audio permet de les calibrer. Ce n’est pas la FFT originale, et les réglages WebAudio cutoff/scale ne sont pas reproduits exactement.':'Le MIDI entrant traverse le périphérique. Les événements PilamiMidiOutput deviennent des notes Live avec Note MIDI, Duree note ms, Velocite et Dynamique. Couper Visuel ou MIDI actif relâche la voix générée. En mode MIDI, il n’y a PAS d’entrée audio : a.fft reste à zéro.')+'\n\nNon transférés : snapshots/morphing, séquenceur, Link, apprentissages et sources audio par notes du labo. Utiliser les automations et le MIDI de Live. Caméras, vidéos, code distant et lecture des échantillons audio bruts restent refusés. Le son éventuellement synthétisé dans une page web n’est pas routé par cette cible.\n\nSi la fenêtre reste noire, ouvrir la console Max. Recharger relance la page locale. La compatibilité GPU et le fonctionnement réel dans Max 9.2 doivent être testés sur la machine cible : la validation du navigateur de développement ne remplace pas ce test.\n\nCONTRÔLEURS LIVE\n'+prepared.selectedControls.map(i=>'- '+prepared.controls[i].label).join('\n')+'\n\nLe code du preset et ses licences sont conservés dans preset.hydra.txt et le HTML. Le moteur et le bridge sont sous AGPL-3.0-or-later ; les droits du preset restent ceux de son auteur.\n';
  return {target:'web',deviceType,slug,pack,files:[{name:slug+'.amxd',data:native.amxd},{name:slug+'-bridge.js',data:native.runtime},{name:slug+'-web.html',data:html},{name:PLAYER_FILE,data:player},{name:'preset.hydra.txt',data:clean(options.source)},{name:'LISEZ-MOI.txt',data:readme},{name:'LICENSE',data:template.license},{name:'NOTICE.txt',data:template.notice+'\n\nCible web : le moteur Hydra et les extensions intégrées conservent leurs licences ; leurs sources et notices sont incluses dans le bloc data-public-sources du HTML. Les notices du preset sont conservées dans preset.hydra.txt.\n'}]};
 }
 window.PilamiMaxWebExport={eligibility:source=>{const r=analyze(source);return {status:r.status,reason:r.reason,midi:r.midi};},prepare,device,build};
})();
