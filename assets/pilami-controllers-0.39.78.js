// Read-only, bounded AST analysis. This never evaluates user JavaScript or GLSL.
// It follows named values, tuples, short numeric loops and local helper calls.
(function(){
 'use strict';
 function analyze(source,entries,bands){
  const result=new Map(bands.map(b=>[b,{effects:[],shared:[],references:[],limited:false}]));
  let tree;try{tree=window.acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true,locations:true})}catch(_){return result}
  const controlNames=new Set(entries.map(e=>e.label)),functions=[],nodes=[],called=new Set(),parents=new WeakMap(),records=new Map();let work=0,depth=0,limited=false;
  const fresh=()=>({bands:new Set(),controls:new Set(),constant:undefined,items:null,props:null,fn:null,controller:null});
  function constant(c){const v=fresh();v.constant=c;return v}
  function merge(...values){
   const out=fresh();values=values.filter(Boolean);
   for(const v of values){for(const b of v.bands)out.bands.add(b);for(const c of v.controls)out.controls.add(c)}
   if(values.length&&values.every(v=>v.constant===values[0].constant))out.constant=values[0].constant;
   const arrays=values.filter(v=>v.items);if(arrays.length){const size=Math.min(64,Math.max(...arrays.map(v=>v.items.length)));out.items=Array.from({length:size},(_,i)=>merge(...arrays.map(v=>v.items[i])))}
   const objects=values.filter(v=>v.props);if(objects.length){out.props=new Map();for(const v of objects)for(const key of v.props.keys())out.props.set(key,merge(...objects.map(v=>v.props.get(key))))}
   return out;
  }
  function flatten(v){if(!v)return fresh();const out=fresh();for(const b of v.bands)out.bands.add(b);for(const c of v.controls)out.controls.add(c);for(const child of [...(v.items||[]),...(v.props?.values()||[])]){const c=flatten(child);for(const b of c.bands)out.bands.add(b);for(const name of c.controls)out.controls.add(name)}return out}
  function spread(v,taint){const out=merge(v,taint);if(v.items)out.items=v.items.map(item=>spread(item,taint));if(v.props)out.props=new Map([...v.props].map(([key,item])=>[key,spread(item,taint)]));return out}
  class Env{constructor(parent=null){this.parent=parent;this.values=new Map()}get(key){return this.values.has(key)?this.values.get(key):this.parent?.get(key)}set(key,value){if(this.values.has(key)||!this.parent)this.values.set(key,value);else this.parent.set(key,value)}}
  function walk(node,parent=null){if(!node?.type)return;nodes.push(node);parents.set(node,parent);for(const value of Object.values(node))if(Array.isArray(value))value.forEach(n=>walk(n,node));else if(value?.type)walk(value,node)}walk(tree);
  function directControls(node,env,out=new Set()){
   if(!node?.type)return out;
   if(node.type==='CallExpression'&&node.callee.type==='Identifier'){const c=env.get(node.callee.name)?.controller;if(c)out.add(c)}
   for(const value of Object.values(node))if(Array.isArray(value))value.forEach(n=>directControls(n,env,out));else if(value?.type)directControls(value,env,out);
   return out;
  }
  function nativeContext(node){for(let i=0,n=node;i<5&&n;i++,n=parents.get(n)){const parent=parents.get(n);if(parent?.type==='CallExpression'&&parent.arguments.includes(n)){const c=parent.callee;return c.type==='MemberExpression'&&!c.computed?c.property.name:c.type==='Identifier'?c.name:null}}return null}
  function record(node,value,env,kind){
   if(['ObjectExpression','ArrayExpression'].includes(node.type))return;
   const v=flatten(value);if(!v.bands.size)return;
   const controls=[...directControls(node,env)],method=nativeContext(node);
   if(!controls.length&&!method)return;
   // An FFT read is a source, not itself a destination.
   if(!controls.length&&['Math','min','max','abs','pow','sqrt','round','floor'].includes(method))return;
   const key=node.start+':'+node.end,old=records.get(key)||{bands:new Set(),controls,upstream:[...v.controls].filter(c=>!controls.includes(c)),method,kind,line:node.loc.start.line,expression:source.slice(node.start,node.end).slice(0,320)};
   for(const c of v.controls)if(!old.controls.includes(c)&&!old.upstream.includes(c))old.upstream.push(c);for(const b of v.bands)if(result.has(b))old.bands.add(b);records.set(key,old);
  }
  function pattern(node,value,env){
   if(!node)return;if(node.type==='Identifier')env.values.set(node.name,value);
   else if(node.type==='ArrayPattern')node.elements.forEach((child,i)=>pattern(child,value.items?.[i]||flatten(value),env));
   else if(node.type==='ObjectPattern')for(const prop of node.properties)if(prop.type==='Property')pattern(prop.value,value.props?.get(prop.key.name??prop.key.value)||fresh(),env);
   else if(node.type==='AssignmentPattern')pattern(node.left,value,env);
  }
  function assign(node,value,env){
   if(node?.type==='Identifier')env.set(node.name,value);
   else if(node?.type==='MemberExpression'){
    const object=expr(node.object,env),key=node.computed?expr(node.property,env).constant:node.property.name;
    if(object.items&&Number.isInteger(key)&&key>=0&&key<64)object.items[key]=value;
    else if(object.props&&typeof key==='string')object.props.set(key,value);
   }
  }
  function invoke(fn,args){
   if(!fn?.fn||depth>=10){if(depth>=10)limited=true;return merge(...args)}
   const{node,env}=fn.fn;called.add(node);const local=new Env(env);node.params.forEach((p,i)=>pattern(p,args[i]||fresh(),local));depth++;
   let value;try{value=node.body.type==='BlockStatement'?block(node.body.body,local):expr(node.body,local);if(node.body.type!=='BlockStatement')record(node.body,value,local,'arrow')}finally{depth--}return value||fresh();
  }
  function expr(node,env){
   if(!node)return fresh();if(++work>50000){limited=true;return fresh()}
   switch(node.type){
    case'Literal':return constant(node.value);
    case'Identifier':return env.get(node.name)||fresh();
    case'ArrayExpression':{const v=fresh();v.items=node.elements.slice(0,64).map(n=>expr(n,env));return v}
    case'ObjectExpression':{const v=fresh();v.props=new Map();for(const p of node.properties)if(p.type==='Property'){const value=expr(p.value,env);v.props.set(p.key.name??p.key.value,value);record(p.value,value,env,'property')}return v}
    case'FunctionExpression':case'ArrowFunctionExpression':{const v=fresh();v.fn={node,env};functions.push(v);return v}
    case'MemberExpression':{
     if(node.object?.type==='MemberExpression'&&node.object.object?.name==='a'&&(node.object.computed?node.object.property.value:node.object.property.name)==='fft'){
      const v=fresh(),index=expr(node.property,env).constant;for(const b of Number.isInteger(index)?[index]:bands)if(result.has(b))v.bands.add(b);return v;
     }
     const object=expr(node.object,env),key=node.computed?expr(node.property,env).constant:node.property.name;
     if(key==='length'&&object.items)return constant(object.items.length);
     if(object.items&&Number.isInteger(key))return object.items[key]||fresh();
     if(object.props&&typeof key==='string')return object.props.get(key)||fresh();
     return flatten(object);
    }
    case'ConditionalExpression':{const t=flatten(expr(node.test,env)),a=expr(node.consequent,env),b=expr(node.alternate,env);return spread(merge(a,b),t)}
    case'LogicalExpression':case'BinaryExpression':{
     const a=expr(node.left,env),b=expr(node.right,env),v=merge(flatten(a),flatten(b)),x=a.constant,y=b.constant;
     if(typeof x==='number'&&typeof y==='number'){
      if(node.operator==='+')v.constant=x+y;else if(node.operator==='-')v.constant=x-y;else if(node.operator==='*')v.constant=x*y;else if(node.operator==='/')v.constant=y?x/y:undefined;else if(node.operator==='%')v.constant=y?x%y:undefined;
     }return v;
    }
    case'UnaryExpression':{const a=expr(node.argument,env),v=merge(a);if(typeof a.constant==='number'&&['+','-'].includes(node.operator))v.constant=node.operator==='-'?-a.constant:a.constant;return v}
    case'AssignmentExpression':{let v=expr(node.right,env);if(node.operator!=='=')v=merge(expr(node.left,env),v);assign(node.left,v,env);record(node.right,v,env,'assignment');return v}
    case'UpdateExpression':{const v=expr(node.argument,env),next=constant(typeof v.constant==='number'?v.constant+(node.operator==='++'?1:-1):undefined);assign(node.argument,next,env);return next}
    case'AwaitExpression':case'ChainExpression':return expr(node.argument||node.expression,env);
    case'TemplateLiteral':return merge(...node.expressions.map(n=>expr(n,env)));
    case'SequenceExpression':{let v=fresh();for(const n of node.expressions)v=expr(n,env);return v}
    case'CallExpression':{
     const callee=expr(node.callee,env),args=node.arguments.map(n=>expr(n,env));
     if(callee.controller){const v=fresh();v.controls.add(callee.controller);return v}
     if(callee.fn)return invoke(callee,args);
     if(node.callee.type==='MemberExpression'){
      const object=expr(node.callee.object,env),method=node.callee.property.name;
      if(method==='fill'&&object.items){object.items=object.items.map(()=>args[0]||fresh());return object}
      if(method==='entries'&&node.callee.object.name==='Object'&&args[0]?.props){const v=fresh();v.items=[...args[0].props].slice(0,64).map(([key,value])=>{const pair=fresh();pair.items=[constant(key),value];return pair});return v}
      if(['forEach','map'].includes(method)&&args[0]?.fn){const values=(object.items||[fresh()]).slice(0,16).map((v,i)=>invoke(args[0],[v,constant(i)]));const out=fresh();out.items=values;return out}
     }
     // Hydra callbacks are consumers: inspect their expressions, never run them.
     if(!['addEventListener','removeEventListener','observe','then','catch','finally'].includes(node.callee.property?.name))for(const v of args)if(v.fn)invoke(v,[]);
     return merge(...args.map(flatten));
    }
    case'NewExpression':{const v=fresh();if(node.callee.name==='Array'&&node.arguments[0]?.type==='Literal'&&node.arguments[0].value<=64)v.items=Array.from({length:Math.max(0,node.arguments[0].value)},fresh);return v}
    default:return fresh();
   }
  }
  function statement(node,env){
   if(!node||work>50000)return fresh();
   switch(node.type){
    case'VariableDeclaration':for(const d of node.declarations){let v;if(d.id.type==='Identifier'&&controlNames.has(d.id.name)&&d.init?.type==='CallExpression'&&d.init.callee.name==='H'){v=fresh();v.controller=d.id.name}else v=expr(d.init,env);pattern(d.id,v,env);if(d.init)record(d.init,v,env,'variable')}break;
    case'ExpressionStatement':expr(node.expression,env);break;
    case'ReturnStatement':{const v=expr(node.argument,env);if(node.argument)record(node.argument,v,env,'return');return v}
    case'BlockStatement':return block(node.body,new Env(env));
    case'IfStatement':expr(node.test,env);return merge(statement(node.consequent,env),statement(node.alternate,env));
    case'ForStatement':{
     const loop=new Env(env);if(node.init?.type==='VariableDeclaration')statement(node.init,loop);else expr(node.init,loop);
     const id=node.init?.declarations?.[0]?.id?.name,limit=expr(node.test?.right,loop).constant,start=loop.get(id)?.constant;
     if(id&&Number.isInteger(start)&&Number.isInteger(limit)&&limit>=start&&limit-start<=16&&node.test?.operator==='<'){
      for(let i=start;i<limit;i++){loop.values.set(id,constant(i));statement(node.body,loop)}
     }else{limited=true;statement(node.body,loop)}break;
    }
    case'ForOfStatement':{const v=expr(node.right,env),loop=new Env(env);for(const item of(v.items||[flatten(v)]).slice(0,32)){const id=node.left.declarations?.[0]?.id||node.left;pattern(id,item,loop);statement(node.body,loop)}break}
    case'WhileStatement':case'DoWhileStatement':limited=true;statement(node.body,new Env(env));break;
    case'TryStatement':return merge(statement(node.block,env),statement(node.handler?.body,new Env(env)),statement(node.finalizer,env));
   }return fresh();
  }
  function block(nodes,env){for(const n of nodes)if(n.type==='FunctionDeclaration'){const v=fresh();v.fn={node:n,env};env.values.set(n.id.name,v);functions.push(v)}const values=[];for(const n of nodes)values.push(statement(n,env));return merge(...values)}
  try{block(tree.body,new Env());for(let i=0;i<functions.length&&i<64&&work<=50000;i++)if(!called.has(functions[i].fn.node))invoke(functions[i],[])}catch(_){limited=true}
  const all=[...records.values()].filter(r=>r.bands.size),common=new Set();
  const usage=new Map();for(const r of all)for(const name of [...r.controls,...r.upstream]){const set=usage.get(name)||new Set();r.bands.forEach(b=>set.add(b));usage.set(name,set)}
  for(const[name,set]of usage)if(bands.length>1&&set.size===bands.length&&!all.some(r=>r.controls.includes(name)&&r.controls.length>1))common.add(name);
  for(const band of bands){
   const item=result.get(band),candidates=all.filter(r=>r.bands.has(band));
   const exact=candidates.filter(r=>r.controls.some(c=>!common.has(c))&&!(r.controls.length===1&&['variable','return'].includes(r.kind)&&!r.method&&r.bands.size>1));
   for(const r of exact){const names=r.controls.filter(c=>!common.has(c));if(!names.length)continue;const key=names.join('|');if(item.effects.some(e=>e.key===key))continue;item.effects.push({key,parameters:names,line:r.line,expression:r.expression})}
   // Prefer a clear render call if it has no named control; otherwise show the read.
   if(!item.effects.length)for(const r of candidates.filter(r=>r.method&&!r.controls.length).slice(0,3))item.effects.push({key:r.expression,parameters:[],line:r.line,expression:r.expression,method:r.method});
   item.shared=[...common].filter(c=>candidates.some(r=>r.controls.includes(c)||r.upstream.includes(c)));
   item.limited=limited;
  }
  const lines=String(source).split(/\r?\n/);
  for(const node of nodes){if(node.type!=='MemberExpression'||node.object?.type!=='MemberExpression'||node.object.object?.name!=='a'||(node.object.computed?node.object.property.value:node.object.property.name)!=='fft')continue;
   const ids=node.computed&&node.property.type==='Literal'?[node.property.value]:bands;
   for(const band of ids){const item=result.get(band);if(item&&!item.references.some(r=>r.line===node.loc.start.line))item.references.push({line:node.loc.start.line,expression:lines[node.loc.start.line-1].trim().slice(0,320)});}
  }
  return result;
 }
 window.PilamiAudioCodeLinks={analyze};
})();

// Pilami custom frequency sources. AGPL-3.0-or-later.
(function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const marker=/\/\* PILAMI_NOTE_SOURCES_V1 ([^]*?) \*\//g;
  const defaults={name:'G3',frequency:195.997718,width:5,gain:20,threshold:.18,attack:15,release:250,cooldown:300,retrigger:1.8,guard:true};
  const scale=[['C3',48],['F3',53],['G3',55],['A#3',58],['C4',60],['D4',62],['E4',64],['F4',65],['G4',67],['A#4',70],['C5',72]];
  function noteInfo(value,reference=440){
    const m=/^([A-Ga-g])([#b♯♭]?)(-?\d)$/.exec(String(value).trim());
    if(!m||![440,432].includes(Number(reference)))return null;
    const midi=(Number(m[3])+1)*12+({C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1].toUpperCase()])+(m[2]==='#'||m[2]==='♯'?1:m[2]==='b'||m[2]==='♭'?-1:0);
    const frequency=Number(reference)*2**((midi-69)/12);
    if(frequency<20||frequency>20000)return null;
    return {name:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][((midi%12)+12)%12]+(Math.floor(midi/12)-1),midi,frequency};
  }
  function parseScaleNotes(text){return String(text).replace(/(\d)\s*-\s*(?=[A-Ga-g])/g,'$1 ').trim().split(/[\s,;|/–—−]+/).filter(n=>n&&n!=='-');}
  function validScale(s){return s&&typeof s.name==='string'&&s.name.trim().length>0&&s.name.length<=80&&[440,432].includes(s.reference)&&Array.isArray(s.notes)&&s.notes.length>0&&s.notes.length<=32&&s.notes.every(n=>typeof n==='string'&&noteInfo(n,s.reference))&&new Set(s.notes.map(n=>noteInfo(n,s.reference).midi)).size===s.notes.length;}
  let current=null;const audioViews=new WeakMap(),fftViews=new WeakMap();
  function scriptAudio(audio){
    if(!audio||typeof audio!=='object')return audio;
    if(!audioViews.has(audio))audioViews.set(audio,new Proxy(audio,{get(target,key){
      const value=Reflect.get(target,key,target);
      if(key==='fft'&&Array.isArray(value)){
        if(!fftViews.has(value))fftViews.set(value,new Proxy(value,{get(values,property,receiver){if(typeof property==='string'&&/^(?:0|[1-9][0-9]*)$/.test(property))return current?.scriptEnabled(Number(property))?Reflect.get(values,property,receiver):0;return Reflect.get(values,property,receiver);}}));
        return fftViews.get(value);
      }
      return typeof value==='function'?value.bind(target):value;
    }}));return audioViews.get(audio);
  }
  function detectScriptFFT(source){
    const tree=window.acorn.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true});
    const nodes=[],parents=new WeakMap(),contexts=new WeakMap(),bindings=new Map(),functions=new Map(),names=new WeakMap(),calls=new Map(),mutated=new Set();
    function walk(node,parent=null,context=null){
      if(!node||typeof node!=='object'||!node.type)return;
      parents.set(node,parent);if(/Function/.test(node.type))context=node;contexts.set(node,context);nodes.push(node);
      for(const value of Object.values(node))if(Array.isArray(value))value.forEach(child=>walk(child,node,context));else if(value&&typeof value==='object'&&value.type)walk(value,node,context);
    }
    walk(tree);
    for(const node of nodes){
      if(node.type==='VariableDeclarator'&&node.id.type==='Identifier'&&node.init){bindings.set(node.id.name,node.init);if(/Function/.test(node.init.type)){functions.set(node.id.name,node.init);names.set(node.init,node.id.name);}}
      if(node.type==='FunctionDeclaration'&&node.id){functions.set(node.id.name,node);names.set(node,node.id.name);}
      if(node.type==='CallExpression'&&node.callee.type==='Identifier'){const list=calls.get(node.callee.name)||[];list.push(node);calls.set(node.callee.name,list);}
      if((node.type==='AssignmentExpression'||node.type==='UpdateExpression')&&(node.left||node.argument)?.type==='Identifier')mutated.add((node.left||node.argument).name);
    }
    function resolve(node,context,seen=new Set(),depth=0){
      if(!node||depth>12||seen.has(node))return null;seen=new Set(seen);seen.add(node);
      if(node.type==='Literal'&&Number.isFinite(node.value))return [node.value];
      if(node.type==='Identifier'){
        const index=context?.params?.findIndex(p=>p.type==='Identifier'&&p.name===node.name)??-1;
        if(index>=0){const list=calls.get(names.get(context))||[];if(!list.length)return null;const values=[];for(const call of list){const next=resolve(call.arguments[index],contexts.get(call),seen,depth+1);if(!next)return null;values.push(...next);}return [...new Set(values)];}
        if(mutated.has(node.name))return null;return resolve(bindings.get(node.name),null,seen,depth+1);
      }
      if(node.type==='UnaryExpression'&&['+','-'].includes(node.operator)){const values=resolve(node.argument,context,seen,depth+1);return values?.map(v=>node.operator==='-'?-v:v)||null;}
      if(node.type==='BinaryExpression'&&['+','-','*','/','%'].includes(node.operator)){
        const a=resolve(node.left,context,seen,depth+1),b=resolve(node.right,context,seen,depth+1);if(!a||!b||a.length*b.length>64)return null;
        const values=[];for(const x of a)for(const y of b){const v=node.operator==='+'?x+y:node.operator==='-'?x-y:node.operator==='*'?x*y:node.operator==='/'?x/y:x%y;if(!Number.isFinite(v))return null;values.push(v);}return [...new Set(values)];
      }return null;
    }
    let count=16;
    const bins=nodes.filter(n=>n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object?.name==='a'&&n.callee.property?.name==='setBins').flatMap(n=>resolve(n.arguments[0],contexts.get(n))||[]).filter(n=>Number.isInteger(n)&&n>0&&n<=16);
    if(bins.length)count=Math.max(...bins);
    const bands=new Set();
    for(const node of nodes){
      if(node.type!=='MemberExpression'||node.object?.name!=='a'||(node.computed?node.property?.value:node.property?.name)!=='fft')continue;
      const parent=parents.get(node),values=parent?.type==='MemberExpression'&&parent.object===node&&parent.computed?resolve(parent.property,contexts.get(parent)):null;
      for(const band of values||Array.from({length:count},(_,i)=>i))if(Number.isInteger(band)&&band>=0&&band<16)bands.add(band);
    }
    return [...bands].sort((a,b)=>a-b);
  }

  function valid(s){return s&&Number.isInteger(s.band)&&s.band>=16&&s.band<=47&&typeof s.name==='string'&&s.name.length>0&&s.name.length<=80&&Number.isFinite(s.frequency)&&s.frequency>=20&&s.frequency<=20000&&Number.isFinite(s.width)&&s.width>=1&&s.width<=1000&&s.width<s.frequency&&Number.isFinite(s.gain)&&s.gain>=.1&&s.gain<=1000&&Number.isFinite(s.threshold)&&s.threshold>=.01&&s.threshold<=1&&Number.isFinite(s.attack)&&s.attack>=1&&s.attack<=2000&&Number.isFinite(s.release)&&s.release>=1&&s.release<=10000&&Number.isFinite(s.cooldown)&&s.cooldown>=50&&s.cooldown<=10000&&Number.isFinite(s.retrigger)&&s.retrigger>=1.1&&s.retrigger<=10&&typeof s.guard==='boolean';}
  function validate(data){
    if(!data||data.version!==1||!Array.isArray(data.sources)||data.sources.length>32||!Array.isArray(data.triggers)||data.triggers.length>48)return null;
    const seen=new Set();if(data.sources.some(s=>!valid(s)||seen.has(s.band)||(seen.add(s.band),false)))return null;
    const targets=new Set();if(data.triggers.some(t=>!t||!Number.isInteger(t.band)||t.band<0||t.band>47||(t.band>=16&&!seen.has(t.band))||!/^snapshot:[0-9]$|^morph:snapshot:[0-9]$/.test(t.target)||targets.has(t.band)||(targets.add(t.band),false)))return null;
    const mutedBands=data.mutedBands??[];if(!Array.isArray(mutedBands)||mutedBands.length>16||new Set(mutedBands).size!==mutedBands.length||mutedBands.some(b=>!Number.isInteger(b)||b<0||b>15))return null;
    const scriptBands=data.scriptBands??[];if(!Array.isArray(scriptBands)||scriptBands.length>16||new Set(scriptBands).size!==scriptBands.length||scriptBands.some(b=>!Number.isInteger(b)||b<0||b>15))return null;
    const scales=data.scales??[];if(!Array.isArray(scales)||scales.length>64||!scales.every(validScale))return null;
    return JSON.parse(JSON.stringify({...data,mutedBands,scriptBands,scales}));
  }
  function read(source){const matches=[...source.matchAll(marker)];if(!matches.length)return{version:1,sources:[],triggers:[],mutedBands:[],scriptBands:[]};try{const data=validate(JSON.parse(matches[matches.length-1][1]));if(!data)throw Error();return data;}catch(_){throw Error('Configuration des sources par note invalide.');}}
  function write(source,data){const clean=source.replace(marker,'').trimEnd();return data.sources.length||data.triggers.length||data.mutedBands?.length||data.scriptBands?.length||data.scales?.length?clean+'\n\n/* PILAMI_NOTE_SOURCES_V1 '+JSON.stringify(data).replace(/\*/g,'\\u002a').replace(/</g,'\\u003c')+' */\n':clean;}
  function envelope(previous,raw,dt,s){const tau=raw>previous?s.attack:s.release;return previous+(raw-previous)*(1-Math.exp(-dt/tau));}
  function gate(state,raw,now,s){
    if(raw<s.threshold*.55)state.armed=true;
    const rise=raw>=s.threshold&&(state.armed||raw>Math.max(s.threshold,state.baseline*s.retrigger));
    const fire=rise&&now-state.last>=s.cooldown;
    // Slow baseline follows sustain; a new rise can retrigger without silence.
    state.baseline=raw>state.baseline?raw:state.baseline+(raw-state.baseline)*.12;
    if(fire){state.last=now;state.armed=false;}return fire;
  }
  function create(model,source,commit,say){
    const codeBands=detectScriptFFT(source);
    const codeUses=window.PilamiAudioCodeLinks.analyze(source,model.entries,codeBands),codeControls=new Map();
    for(const[band,use]of codeUses)for(const name of [...new Set([...use.effects.flatMap(effect=>effect.parameters),...use.shared])]){if(!codeControls.has(name))codeControls.set(name,[]);if(!codeControls.get(name).includes(band))codeControls.get(name).push(band);}
    let data=read(source),nodes=new Map(),input=null,audio=null,alive=true,last=performance.now(),readyAt=Infinity,frame=null,connected=false;
    const gates=new Map(),values=new Map(),flashes=new Map();
    function reset(){if(input)for(const n of nodes.values()){try{input.disconnect(n.filter);n.filter.disconnect();n.analyser.disconnect();}catch(_){}}nodes.clear();gates.clear();values.clear();connected=false;}
    function configure(next,action=()=>{}){const validData=validate(next);if(!validData){say('Réglages audio invalides.',true);return false;}const previous=data;data=validData;if(!commit(action)){data=previous;return false;}reset();return true;}
    function build(){
      const next=window.PilamiStrudelHydra.audio();
      if(!next?.stream?.active||next.context?.state!=='running'||!window.PilamiStrudelHydra.isRunning()||!model.available()){reset();input=null;audio=null;return false;}
      if(audio!==next||input!==next.inputSource){reset();audio=next;input=next.inputSource;}
      if(!connected){
        for(const s of data.sources){if(s.frequency+s.width>=audio.context.sampleRate/2)continue;const filter=audio.context.createBiquadFilter(),analyser=audio.context.createAnalyser();filter.type='bandpass';filter.frequency.value=s.frequency;filter.Q.value=s.frequency/(2*s.width);analyser.fftSize=1024;input.connect(filter);filter.connect(analyser);nodes.set(s.band,{filter,analyser,buffer:new Float32Array(1024)});}
        connected=true;readyAt=performance.now()+250;
      }return true;
    }
    function tick(now){
      if(!alive)return;const dt=clamp(now-last,1,100);last=now;
      if(build()){
        const raw=new Map(),rms=new Map();
        for(const s of data.sources){const n=nodes.get(s.band);if(!n)continue;n.analyser.getFloatTimeDomainData(n.buffer);let power=0;for(const x of n.buffer)power+=x*x;const r=Math.sqrt(power/n.buffer.length);rms.set(s.band,r);raw.set(s.band,clamp(r*s.gain,0,1));}
        const fired=new Set();
        for(const s of [...data.sources].sort((a,b)=>a.frequency-b.frequency)){
          const r=raw.get(s.band)||0;values.set(s.band,envelope(values.get(s.band)||0,r,dt,s));
          let g=gates.get(s.band);if(!g){g={armed:false,baseline:r,last:now};gates.set(s.band,g);}
          const hit=gate(g,r,now,s);
          // Only suppress coincident rises with a stronger known fundamental.
          // This is a heuristic, never a promise of polyphonic recognition.
          const harmonic=s.guard&&data.sources.some(low=>{const ratio=s.frequency/low.frequency,integer=Math.round(ratio);return low.frequency<s.frequency&&integer>=2&&integer<=6&&Math.abs(s.frequency-integer*low.frequency)<=s.width+integer*low.width&&(fired.has(low.band)||now-(flashes.get(low.band)||-Infinity)<80)&&(rms.get(low.band)||0)>(rms.get(s.band)||0)*.7;});
          if(hit&&!harmonic&&now>=readyAt){fired.add(s.band);flashes.set(s.band,now);}
        }
        for(const t of data.triggers){
          if(t.band<16){const rawLevel=clamp(Number(audio.fft[t.band])||0,0,1);let g=gates.get(t.band);if(!g){g={armed:false,baseline:rawLevel,last:now};gates.set(t.band,g);}if(gate(g,rawLevel,now,defaults)&&now>=readyAt)fired.add(t.band);}
          if(!fired.has(t.band)||model.snapshots?.state.running||model.snapshots?.state.busy)continue;
          const i=Number(t.target.split(':').pop());if(!model.snapshots?.state.slots[i])continue;
          const action=t.target.startsWith('morph:')?model.snapshots.triggerMorphTo(i):model.snapshots.triggerRecall(i);Promise.resolve(action).catch(error=>say(error.message,true));
        }
      }
      frame=setTimeout(()=>tick(performance.now()),20);
    }
    const api={data:()=>data,level:band=>values.get(band)||0,flash:band=>performance.now()-(flashes.get(band)||-Infinity)<180,
      label:band=>data.sources.find(s=>s.band===band)?.name||'a.fft['+band+']',
      isMuted:band=>data.mutedBands.includes(band),
      usesScriptSource:band=>codeBands.includes(band)||data.scriptBands.includes(band),
      scriptUses:band=>codeUses.get(band)||{effects:[],shared:[],references:[],limited:false},
      scriptControlBands:name=>codeControls.get(name)||[],
      scriptEnabled:band=>(codeBands.includes(band)||data.scriptBands.includes(band))&&!data.mutedBands.includes(band),
      disableScriptSource(band){if(!Number.isInteger(band)||band<0||band>15)return false;return configure({...data,mutedBands:[...new Set([...data.mutedBands,band])],scriptBands:data.scriptBands.filter(b=>b!==band)});},
      enableScriptSource(band){if(!Number.isInteger(band)||band<0||band>15)return false;return configure({...data,scriptBands:[...new Set([...data.scriptBands,band])],mutedBands:data.mutedBands.filter(b=>b!==band)});},
      unmuteSource(band,action=()=>{}){return data.mutedBands.includes(band)?configure({...data,mutedBands:data.mutedBands.filter(b=>b!==band)},action):commit(action);},
      async enable(){const a=await window.PilamiStrudelHydra.enableControlAudio(0);if(!a?.stream?.active)throw Error('Entrée audio non connectée. Autorise le micro puis reconnecte.');},
      add(s){const band=Array.from({length:32},(_,i)=>i+16).find(b=>!data.sources.some(s=>s.band===b));if(band===undefined){say('32 sources maximum.',true);return false;}return configure({...data,sources:[...data.sources,{...defaults,...s,band}]});},
      update(s){return configure({...data,sources:data.sources.map(old=>old.band===s.band?s:old)});},
      remove(band){if(model.entries.some(e=>e.audio?.band===band)||model.snapshots?.state.slots.some(slot=>slot?.values.some(e=>e.audio?.band===band))){say('Délie cette source des contrôleurs et snapshots avant de la supprimer.',true);return false;}return configure({...data,sources:data.sources.filter(s=>s.band!==band),triggers:data.triggers.filter(t=>t.band!==band)});},
      saveScales(scales){return configure({...data,scales});},
      addScale(reference=440,notes=scale.map(s=>s[0])){
        if(!validScale({name:'Gamme',reference,notes})){say('Gamme invalide : vérifie les notes et le diapason.',true);return false;}
        // Reserve the identities of common notes before reusing any old band.
        const used=new Set(),next=notes.map(name=>{
          const info=noteInfo(name,reference),old=data.sources.find(s=>!used.has(s.band)&&noteInfo(s.name,reference)?.midi===info.midi);
          if(old)used.add(old.band);
          return {...(old||defaults),name:info.name,frequency:info.frequency,band:old?.band??null};
        });
        const removed=data.sources.filter(s=>!used.has(s.band)).map(s=>s.band),removedSet=new Set(removed);
        for(const s of next)if(s.band===null){s.band=Array.from({length:32},(_,i)=>i+16).find(b=>!used.has(b));used.add(s.band);}
        model.cancelAudioBindings?.();
        const ok=configure({...data,sources:next,triggers:data.triggers.filter(t=>!removedSet.has(t.band))},()=>{
          for(const entry of model.entries)if(removedSet.has(entry.audio?.band))entry.audio=null;
        });
        if(!ok)return false;
        model.snapshots?.removeAudioSources(removed);
        if(model.selectedBand>=16)model.finishAudioSelection?.();
        say('Gamme appliquée · '+next.length+' notes. Les anciennes notes absentes de cette gamme ont été retirées.');return true;
      },
      trigger(band,target){return configure({...data,triggers:[...data.triggers.filter(t=>t.band!==band),...(target?[{band,target}]:[])]});},
      unlinkSource(band){
        if(!model.available()||!Number.isInteger(band)||band<0||band>47)return false;
        const targets=model.entries.filter(e=>e.audio?.band===band);
        model.cancelAudioBindings();
        if(band>=16&&!targets.length&&!data.triggers.some(t=>t.band===band))return true;
        const changed=configure({...data,triggers:data.triggers.filter(t=>t.band!==band),scriptBands:data.scriptBands.filter(b=>b!==band),mutedBands:band<16?[...new Set([...data.mutedBands,band])]:data.mutedBands},()=>targets.forEach(e=>{e.audio=null;}));
        if(changed){if(model.selectedBand===band)model.selectBand(band);say(api.label(band)+' délié : modulations et déclenchement retirés.');}
        return changed;
      },
      dispose(){alive=false;clearTimeout(frame);reset();if(current===api)current=null;}
    };if(model.entries.some(e=>e.audio?.band>=16&&!data.sources.some(s=>s.band===e.audio.band)))throw Error('Une liaison fait référence à une source par note absente.');current=api;tick(performance.now());return api;
  }
  window.PilamiNoteSources={noteInfo,parseScaleNotes,validScale,detectScriptFFT,scriptAudio,defaults,validate,read,write,create,envelope,gate,level:band=>current?.level(band)||0,label:band=>current?.label(band)||'Source '+band};
})();

(function(){
  'use strict';
  const cssURL=new URL('pilami-controllers-0.39.62.css',document.currentScript.src).href;
  const midiLearnIconURL=new URL('images/midi-learn.png',document.currentScript.src).href;
  const MIME='application/x-pilami-audio-band';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const number=value=>String(Math.round(value*1e6)/1e6);
  const randomStorageKey='pilami-hydra-random-strength-v1';
  function randomStrength(){try{const raw=localStorage.getItem(randomStorageKey),next=Number(raw);return raw!==null&&Number.isFinite(next)?Math.round(clamp(next,0,100)):20;}catch(_){return 20;}}
  function audioLevel(band){if(band>=16)return window.PilamiNoteSources.level(band);const level=Number(window.PilamiStrudelHydra.audio()?.fft[band]);return Number.isFinite(level)?clamp(level,0,1):0;}
  function validateAudio(options){
    if(!options||!Number.isInteger(options.band)||options.band<0||options.band>47||!Number.isFinite(options.depth))throw new Error('audioMod : band de 0 à 47 et depth numérique requis.');
    return {band:options.band,depth:options.depth};
  }
  function value(entry){const result=clamp(entry.value+(entry.audio?audioLevel(entry.audio.band)*entry.audio.depth:0),entry.min,entry.max);return entry.kind==='toggle'?(result>=(entry.min+entry.max)/2?entry.max:entry.min):result;}
  function create({source,parsed,entries,pairs,active,write,say,snapshotContext}){
    let alive=true,randomUndo=null,audioTicket=0,pendingAudioBinding=null;const listeners=new Set();
    // Keep launch values outside snapshot state and live code rewrites.
    const launchValues=new Map(entries.map(entry=>[entry,entry.value]));
    const available=()=>alive&&active();
    const notify=()=>listeners.forEach(listener=>listener());
    function code(){
      const edits=entries.map(entry=>{
        let call=source.slice(entry.callFrom,entry.callTo);
        // Apply edits against original AST offsets, preserving comments, the step
        // expression and other arguments through repeated live changes.
        const args=entry.args||[],values=entry.stepEdited?[entry.value,entry.min,entry.max,entry.step==='any'?'undefined':entry.step]:entry.rangeEdited?[entry.value,entry.min,entry.max]:[entry.value],changes=[];
        values.forEach((next,index)=>{if(args[index])changes.push({...args[index],text:String(next)});});
        if(args.length<values.length){
          const last=args[args.length-1],at=last?last.to:entry.callTo-1;
          changes.push({from:at,to:at,text:(last?', ':'')+values.slice(args.length).join(', ')});
        }
        for(const edit of changes.sort((a,b)=>b.from-a.from||b.to-a.to))call=call.slice(0,edit.from-entry.callFrom)+edit.text+call.slice(edit.to-entry.callFrom);
        call=entry.kind+call.slice(entry.calleeTo-entry.callFrom);
        if(entry.kind!==entry.declaredKind&&(entry.kind==='toggle'||entry.declaredKind==='toggle'))call=entry.kind+'('+entry.value+', '+entry.min+', '+entry.max+', '+(entry.step==='any'?'undefined':entry.step)+')';
        const body=source.slice(entry.bodyFrom,entry.callFrom)+call+source.slice(entry.callTo,entry.bodyTo);
        return {from:entry.replaceFrom,to:entry.replaceTo,text:entry.audio?'audioMod('+body+', {band: '+entry.audio.band+', depth: '+String(entry.audio.depth)+'})':body};
      });
      const required=Math.max(0,...entries.filter(e=>e.audio&&e.audio.band<16).map(e=>e.audio.band+1));
      parsed.bins.forEach(bin=>{if(bin.value<required)edits.push({...bin,text:String(required)});});
      let previous=source.length;const chunks=[];
      for(const edit of edits.sort((a,b)=>b.from-a.from)){
        if(edit.to>previous)throw new Error('Ces contrôleurs imbriqués ne peuvent pas être édités automatiquement.');
        chunks.push(source.slice(edit.to,previous),edit.text);previous=edit.from;
      }
      chunks.push(source.slice(0,previous));let output=chunks.reverse().join('');
      output=window.PilamiNoteSources.write(output,model.notes?.data()||window.PilamiNoteSources.read(source));
      if(new TextEncoder().encode(output).length>16777216)throw new Error('Le code dépasserait 16 Mo.');
      return output;
    }
    function change(action,midiEntries=null,keepRandom=false){
      if(!available())return false;
      const beforeRandom=randomUndo;
      const before=entries.map(entry=>({entry,value:entry.value,min:entry.min,max:entry.max,rangeEdited:entry.rangeEdited,stepEdited:entry.stepEdited,kind:entry.kind,step:entry.step,sliderStep:entry.sliderStep,audio:entry.audio?{...entry.audio}:null}));
      try{action();write(code());if(!keepRandom)randomUndo=null;model.snapshots?.edited(midiEntries);notify();return true;}
      catch(error){randomUndo=beforeRandom;before.forEach(({entry,...saved})=>Object.assign(entry,saved));say(error.message,true);notify();return false;}
    }
    function quantize(entry,next){const step=Number(entry.step);return clamp(step>0?Number((entry.min+Math.round((next-entry.min)/step)*step).toPrecision(14)):next,entry.min,entry.max);}
    const pads=pairs.slice(),used=new Set(pairs.flatMap(pair=>[pair.x,pair.y]));
    entries.forEach(x=>{
      const match=x.label.match(/^(.*?)[_]?[Xx]$/);if(!match||!match[1]||used.has(x))return;
      const prefix=match[1].replace(/_$/,'');const y=entries.find(e=>e!==x&&e.label.replace(/_?[Yy]$/,'')===prefix&&/[Yy]$/.test(e.label)&&!used.has(e));
      if(y){pads.push({title:prefix.replace(/_/g,' '),x,y});used.add(x);used.add(y);}
    });
    const model={
      entries,pads,selectedBand:null,audioFeedback:{text:'',error:false},available,
      subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
      defaultValue(entry){return launchValues.get(entry);},
      resetBase(target){
        const targets=[...new Set(Array.isArray(target)?target:[target])];
        if(!available()||!targets.length||targets.some(entry=>!launchValues.has(entry)))return false;
        model.midi?.cancelControls(targets);
        return change(()=>targets.forEach(entry=>{entry.value=quantize(entry,launchValues.get(entry));}));
      },
      setBase(entry,next){if(!Number.isFinite(next))return false;model.midi?.cancelControls([entry]);return change(()=>{entry.value=quantize(entry,next);});},
      setMidiValues(values){const valid=values.filter(({entry,value})=>entries.includes(entry)&&Number.isFinite(value));return valid.length?change(()=>valid.forEach(({entry,value,continuous})=>{entry.value=continuous&&entry.kind!=='toggle'&&!(Number(entry.step)>=1)?clamp(value,entry.min,entry.max):quantize(entry,value);}),valid.map(({entry})=>entry)):false;},
      setRange(entry,min,max){
        if(!available())return false;
        if(entry.kind==='toggle'){say('Un interrupteur garde ses bornes 0 et 1.',true);return false;}
        if(!Number.isFinite(min)||!Number.isFinite(max)||min>=max){say('Bornes : deux nombres finis et Min < Max sont requis.',true);return false;}
        if(entry.min===min&&entry.max===max)return true;
        model.midi?.cancelControls([entry]);return change(()=>{entry.min=min;entry.max=max;entry.rangeEdited=true;entry.value=clamp(entry.value,min,max);});
      },
      setXY(pair,x,y){model.midi?.cancelControls([pair.x,pair.y]);change(()=>{pair.x.value=quantize(pair.x,x);pair.y.value=quantize(pair.y,y);});},
      setKind(entry,kind){if(!['slider','knob','fader','toggle'].includes(kind))return;if(kind==='toggle'&&(entry.min!==0||entry.max!==1))return;model.midi?.cancelControls([entry]);change(()=>{entry.kind=kind;entry.step=kind==='toggle'?1:entry.sliderStep;if(kind==='toggle')entry.value=entry.value>=.5?1:0;});},
      cancelAudioBindings(){audioTicket++;},
      async bind(targets,band){
        if(!available()||!Number.isInteger(band)||band<0||band>47||!targets.length||targets.some(e=>!entries.includes(e)))return false;
        if(band>=16&&!model.notes.data().sources.some(s=>s.band===band))return false;
        // Several clicks while the audio permission is pending form one operation.
        if(pendingAudioBinding?.band===band&&pendingAudioBinding.ticket===audioTicket){targets.forEach(entry=>pendingAudioBinding.targets.add(entry));return pendingAudioBinding.promise;}
        const request={band,ticket:++audioTicket,targets:new Set(targets),promise:null};pendingAudioBinding=request;
        request.promise=(async()=>{
          try{const audio=await window.PilamiStrudelHydra.enableControlAudio(band<16?band:0);if(!available()||request.ticket!==audioTicket)return false;if(!audio?.stream?.active)throw Error('Entrée audio non connectée. Autorise le micro puis reconnecte.');
            const linked=[...request.targets],apply=()=>linked.forEach(entry=>{entry.audio={band,depth:entry.audio?.depth??(entry.max-entry.min)*.15};});
            if(change(apply)){model.audioFeedback={text:model.notes.label(band)+' lié à '+linked.map(e=>e.label).join(' + ')+'.',error:false};notify();return true;}return false;
          }catch(error){if(available()&&request.ticket===audioTicket){model.audioFeedback={text:error.message,error:true};notify();}return false;}
          finally{if(pendingAudioBinding===request)pendingAudioBinding=null;}
        })();return request.promise;
      },
      setDepth(entry,depth){if(Number.isFinite(depth))change(()=>{if(entry.audio)entry.audio.depth=depth;});},
      unlink(entry){audioTicket++;return change(()=>{entry.audio=null;});},
      selectBand(band){this.selectedBand=this.selectedBand===band?null:band;this.audioFeedback={text:'',error:false};notify();},
      finishAudioSelection(){this.selectedBand=null;this.audioFeedback={text:'',error:false};notify();},
      captureState(){return entries.map(e=>({label:e.label,kind:e.kind,value:e.value,min:e.min,max:e.max,step:e.step,sliderStep:e.sliderStep,audio:e.audio?{...e.audio}:null}));},
      applyState(state){
        const next=window.PilamiHydraSnapshots.validateState(state,entries);
        if(!next)return false;
        return change(()=>entries.forEach((entry,index)=>{const saved=next[index];if(entry.min!==saved.min||entry.max!==saved.max)entry.rangeEdited=true;if(entry.step!==saved.step)entry.stepEdited=true;Object.assign(entry,saved);}));
      },
      dispose(){alive=false;audioTicket++;model.notes?.dispose();randomUndo=null;model.midi?.dispose();model.snapshots?.dispose();listeners.clear();}
    };
    model.random={
      strength:randomStrength(),
      busy:()=>Boolean(model.snapshots?.state.running||model.snapshots?.state.busy),
      canUndo:()=>Boolean(randomUndo),
      setStrength(next){
        if(!available()||!Number.isFinite(next))return false;
        this.strength=Math.round(clamp(next,0,100));
        try{localStorage.setItem(randomStorageKey,String(this.strength));}catch(_){}
        notify();return true;
      },
      run(){
        if(!available()||!entries.length||this.busy())return false;
        const power=this.strength/100;if(power<=0)return false;
        model.midi?.cancelPending();
        const before=entries.map(entry=>entry.value);
        const next=entries.map(entry=>{
          if(entry.kind==='toggle')return Math.random()<power?(Math.random()<.5?entry.min:entry.max):entry.value;
          const sample=Math.random(),target=entry.min*(1-sample)+entry.max*sample;
          const next=quantize(entry,entry.value*(1-power)+target*power);
          return Number.isFinite(next)?next:entry.value;
        });
        if(next.every((value,index)=>value===before[index])){say('Random : aucune variation à cette puissance et avec ces pas.');return false;}
        const changed=change(()=>{entries.forEach((entry,index)=>{entry.value=next[index];});randomUndo=before;},null,true);
        if(changed)say('Random · puissance '+this.strength+' %. Capture un snapshot pour garder cette variation.');
        return changed;
      },
      undo(){
        if(!available()||this.busy()||!randomUndo)return false;
        model.midi?.cancelPending();
        const values=randomUndo.slice();
        const changed=change(()=>{entries.forEach((entry,index)=>{entry.value=values[index];});randomUndo=null;},null,true);
        if(changed)say('Random annulé · valeurs précédentes restaurées.');
        return changed;
      }
    };
    if(snapshotContext&&window.PilamiHydraSnapshots)model.snapshots=window.PilamiHydraSnapshots.create({model,source,context:snapshotContext,say,notify});
    if(model.snapshots&&window.PilamiHydraMidi)model.midi=window.PilamiHydraMidi.create(model);
    model.notes=window.PilamiNoteSources.create(model,source,(action=()=>{})=>change(action),say);
    return model;
  }
  function element(doc,tag,text,attributes={}){const node=doc.createElement(tag);if(text!==null)node.textContent=text;Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,value));return node;}
  function codeEffectLabel(effect){
    const params=effect.parameters||[],base=params.filter(name=>!/^Audio[_ ]/i.test(name)),depth=params.filter(name=>/^Audio[_ ]/i.test(name));
    return base.length?base.join(' · ')+(depth.length?' via '+depth.join(', '):''):params.length?params.join(' · '):effect.method||'Formule du script';
  }
  function codeSourceLabels(model,band){return(model?.notes.scriptUses(band).effects||[]).map(codeEffectLabel);}
  function appendCodeUses(dialog,model,band,doc){
    if(!model.notes.usesScriptSource(band))return;
    const info=model.notes.scriptUses(band),box=element(doc,'section',null,{class:'pilami-code-uses','data-code-uses':String(band)});
    box.append(element(doc,'h5','Ce que pilote le code'));
    if(info.effects.length){
      const list=element(doc,'ul',null,{class:'pilami-code-use-list'});
      for(const effect of info.effects){
        const row=element(doc,'li',null);row.append(element(doc,'strong',codeEffectLabel(effect)));
        const detail=element(doc,'details',null),summary=element(doc,'summary','Voir la formule · ligne '+effect.line),pre=element(doc,'pre',null);pre.append(element(doc,'code',effect.expression));detail.append(summary,pre);row.append(detail);list.append(row);
      }box.append(list);
      box.append(element(doc,'p','Ces modulations sont calculées par le script : les valeurs de base affichées sur les contrôleurs restent inchangées.',{class:'pilami-control-help'}));
    }else box.append(element(doc,'p','Cette source est disponible dans le code. Sa destination n’a pas pu être identifiée automatiquement.',{class:'pilami-control-help'}));
    if(info.shared.length)box.append(element(doc,'p','Réglages communs : '+info.shared.join(', '),{class:'pilami-control-help','data-code-shared':''}));
    if(!info.effects.length&&info.references.length){const detail=element(doc,'details',null);detail.append(element(doc,'summary','Voir les lectures de cette source'));for(const reference of info.references.slice(0,4)){detail.append(element(doc,'small','Ligne '+reference.line));const pre=element(doc,'pre',null);pre.append(element(doc,'code',reference.expression));detail.append(pre);}box.append(detail);}
    dialog.append(box);
  }
  function sourceDestinations(model,band){
    if(!model)return [];
    const labels=model.entries.filter(e=>e.audio?.band===band).map(entry=>{
      const pair=model.pads.find(p=>p.x===entry||p.y===entry);
      return entry.label+(pair?' ('+(pair.x===entry?'X':'Y')+' · '+pair.title+')':'');
    });
    if(model.notes.scriptEnabled(band)){const uses=codeSourceLabels(model,band);labels.push(...(uses.length?uses.map(label=>'Code → '+label):['Code du script · destination à consulter']));}
    const trigger=model.notes.data().triggers.find(t=>t.band===band);
    if(trigger){const index=Number(trigger.target.split(':').pop())+1;labels.push((trigger.target.startsWith('morph:')?'Morpher vers le snapshot ':'Rappeler le snapshot ')+index);}
    return labels;
  }
  function mountNotes(bank,model,doc,refresh,setRelated){
    const details=element(doc,'details',null,{class:'pilami-note-settings'}),summary=element(doc,'summary','Sources par note / fréquence');details.append(summary);bank.append(details);
    const actions=element(doc,'div',null,{class:'pilami-note-actions'}),add=element(doc,'button','+ Source personnalisée',{type:'button','data-note-add':''}),scale=element(doc,'button','Appliquer la gamme',{type:'button','data-note-scale':''}),manage=element(doc,'button','Mes gammes',{type:'button'}),referenceLabel=element(doc,'label','Diapason · A4 = '),reference=element(doc,'select',null,{'aria-label':'Diapason A4 en Hz'}),scaleChoice=element(doc,'select',null,{'aria-label':'Gamme à ajouter'});
    for(const hz of [440,432])reference.append(element(doc,'option',hz+' Hz',{value:String(hz)}));
    referenceLabel.append(reference);actions.append(add,scaleChoice,scale,manage,referenceLabel);
    details.append(actions,element(doc,'p','Choisis une note pour calculer sa fréquence selon le diapason. Affichage : partie entière ; détection précise conservée. Appliquer une gamme remplace les sources par note actuelles. Les liaisons des notes communes sont conservées ; celles des notes retirées sont supprimées, y compris dans les snapshots.',{class:'pilami-control-help'}));
    const scaleKey='pilami-custom-note-scales-v1';
    function savedScales(){let local=[];try{local=JSON.parse(localStorage.getItem(scaleKey)||'[]');}catch(_){}if(!Array.isArray(local))local=[];const result=new Map();for(const s of [...local,...(model?.notes.data().scales||[])])if(window.PilamiNoteSources.validScale(s))result.set(s.name,s);return [...result.values()].slice(0,64);}
    function scaleOptions(){const selected=scaleChoice.value;scaleChoice.replaceChildren(element(doc,'option','C Mixophonic · 11 notes',{value:''}));for(const s of savedScales())scaleChoice.append(element(doc,'option',s.name+' · '+s.reference+' Hz',{value:s.name}));scaleChoice.value=[...scaleChoice.options].some(o=>o.value===selected)?selected:'';}
    scaleOptions();
    scaleChoice.addEventListener('change',()=>{const s=savedScales().find(s=>s.name===scaleChoice.value);if(s)reference.value=String(s.reference);});
    const list=element(doc,'div',null,{class:'pilami-note-list'});details.append(list);
    const dialog=element(doc,'dialog',null,{class:'pilami-note-dialog','aria-label':'Source audio : réglages et liaisons'});bank.append(dialog);let listKey='',alive=true;
    function close(){dialog.close();dialog.replaceChildren();}
    function open(title){dialog.replaceChildren();dialog.append(element(doc,'h4',title));dialog.showModal();}
    function button(text,action){const b=element(doc,'button',text,{type:'button'});b.addEventListener('click',action);return b;}
    function message(text){let status=dialog.querySelector('[data-note-dialog-status]');if(!status){status=element(doc,'p','',{role:'status','data-note-dialog-status':'',class:'pilami-control-help'});dialog.append(status);}status.textContent=text;}
    function editor(source=null){
      if(!model?.available())return;const initial=source||{...window.PilamiNoteSources.defaults};open(source?'Réglages · '+source.name:'Nouvelle source audio');
      const form=element(doc,'form',null,{class:'pilami-note-form'}),fields={};
      const settings=[['name','Nom','text'],['frequency','Fréquence centrale (Hz)','number',20,20000],['width','Largeur ± (Hz)','number',1,1000],['gain','Sensibilité ×','number',.1,1000],['threshold','Seuil de frappe (0–1)','number',.01,1],['attack','Attaque du niveau (ms)','number',1,2000],['release','Relâchement du niveau (ms)','number',1,10000],['cooldown','Délai minimum entre frappes (ms)','number',50,10000],['retrigger','Nouvelle frappe : montée ×','number',1.1,10]];
      for(const [key,title,type,min,max]of settings){const label=element(doc,'label',title),input=element(doc,'input',null,{type,required:'','aria-label':title,'data-note-field':key});input.value=String(key==='frequency'?Math.trunc(initial[key]):initial[key]);if(type==='number'){input.min=min;input.max=max;input.step=key==='frequency'?'1':'any';}else input.maxLength=80;label.append(input);form.append(label);fields[key]=input;}
      const pitchLabel=element(doc,'label','Note (calcul automatique)'),pitch=element(doc,'select',null,{'aria-label':'Note à calculer'}),tuning=reference.cloneNode(true);
      tuning.value=reference.value;pitch.append(element(doc,'option','Fréquence libre',{value:''}));
      for(let midi=16;midi<=135;midi++){const name=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][midi%12]+(Math.floor(midi/12)-1);if(window.PilamiNoteSources.noteInfo(name,Number(tuning.value)))pitch.append(element(doc,'option',name,{value:name}));}
      const initialInfo=window.PilamiNoteSources.noteInfo(initial.name,Number(tuning.value));pitch.value=initialInfo?.name||'';
      let calculated=null;
      function calculate(){const info=window.PilamiNoteSources.noteInfo(pitch.value,Number(tuning.value));if(!info)return;calculated=info.frequency;fields.name.value=info.name;fields.frequency.value=String(Math.trunc(calculated));}
      const down=button('▼',()=>transpose(-1)),up=button('▲',()=>transpose(1));
      down.setAttribute('aria-label','Descendre la note d’un demi-ton');down.title='Descendre d’un demi-ton';up.setAttribute('aria-label','Monter la note d’un demi-ton');up.title='Monter d’un demi-ton';
      function stepState(){const i=pitch.selectedIndex;down.disabled=i<=1;up.disabled=i<1||i>=pitch.options.length-1;}
      function transpose(delta){const i=pitch.selectedIndex+delta;if(i<1||i>=pitch.options.length)return;pitch.selectedIndex=i;calculate();stepState();}
      pitch.addEventListener('change',()=>{calculate();stepState();});tuning.addEventListener('change',calculate);fields.frequency.addEventListener('input',()=>{calculated=null;pitch.value='';stepState();});
      if(!source)calculate();stepState();const pitchControls=element(doc,'span',null,{class:'pilami-note-actions'});pitchControls.append(down,pitch,up);pitchLabel.append(pitchControls);const tuningLabel=element(doc,'label','Diapason');tuningLabel.append(tuning);form.prepend(pitchLabel,tuningLabel);
      const guardLabel=element(doc,'label','Réduire les déclenchements liés aux harmoniques'),guard=element(doc,'input',null,{type:'checkbox','aria-label':'Réduire les déclenchements liés aux harmoniques'});guard.checked=initial.guard;guardLabel.prepend(guard);form.append(guardLabel);
      const note=element(doc,'p','Le seuil porte sur le niveau après sensibilité. Commence à 0,18 : frappe la note et ajuste pour séparer bruit de fond et frappe. La protection des harmoniques est une aide ; les accords et les octaves peuvent demander des ajustements.',{class:'pilami-control-help'});form.append(note);
      const save=element(doc,'button','Appliquer',{type:'submit'}),buttons=element(doc,'div',null,{class:'pilami-note-actions'});buttons.append(save,button('Annuler',close));if(source)buttons.append(button('Supprimer',()=>{if(model.notes.remove(source.band)){close();refresh();}else message('Délie cette source des contrôleurs et des snapshots avant de la supprimer.');}));form.append(buttons);dialog.append(form);
      form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const s={...initial,guard:guard.checked};for(const [key,field]of Object.entries(fields))s[key]=key==='name'?field.value.trim():key==='frequency'&&calculated!==null?calculated:key==='frequency'&&field.value===String(Math.trunc(initial.frequency))?initial.frequency:Number(field.value);const ok=source?model.notes.update(s):model.notes.add(s);if(ok){close();refresh();}else message('Réglages non appliqués. La largeur doit rester inférieure à la fréquence ; vérifie aussi le message de Hydra.');});
    }
    async function route(band){
      if(!model?.available())return;open('Source audio · '+model.notes.label(band));appendCodeUses(dialog,model,band,doc);
      const label=element(doc,'label','Ajouter une liaison '),select=element(doc,'select',null,{'aria-label':'Destination de la source audio','data-note-destination':''});
      select.append(element(doc,'option','Choisir un paramètre, un pad ou un snapshot…',{value:'','data-note-no-destination':''}));
      const controls=element(doc,'optgroup',null,{label:'Moduler un paramètre'});model.entries.forEach((e,i)=>controls.append(element(doc,'option',e.label,{value:'control:'+i})));select.append(controls);
      if(model.pads.length){const group=element(doc,'optgroup',null,{label:'Pads XY'});model.pads.forEach((p,i)=>{for(const [value,label]of [['x','X'],['y','Y'],['both','X + Y']])group.append(element(doc,'option',p.title+' · '+label,{value:'pad:'+i+':'+value}));});select.append(group);}
      if(model.snapshots){for(const [prefix,title]of [['snapshot:','Déclencher un snapshot'],['morph:snapshot:','Morpher vers un snapshot']]){const group=element(doc,'optgroup',null,{label:title});model.snapshots.state.slots.forEach((slot,i)=>{const opt=element(doc,'option','Snapshot '+(i+1)+(slot?'':' · vide'),{value:prefix+i});opt.disabled=!slot;group.append(opt);});select.append(group);}}
      label.append(select);dialog.append(label,element(doc,'p','Paramètres : niveau continu du son. Snapshots : une nouvelle frappe dépassant le seuil ; les frappes pendant un morphing sont ignorées.',{class:'pilami-control-help'}));
      const buttons=element(doc,'div',null,{class:'pilami-note-actions'}),apply=button('Lier',async()=>{
        const target=select.value;if(!target||select.selectedOptions[0]?.disabled)return;apply.disabled=true;
        try{if(target.startsWith('control:')){if(!await model.bind([model.entries[Number(target.split(':')[1])]],band))throw Error('Liaison non appliquée. Vérifie le message de Hydra.');}
          else if(target.startsWith('pad:')){const [,index,axis]=target.split(':'),p=model.pads[Number(index)];if(!await model.bind(axis==='both'?[p.x,p.y]:[p[axis]],band))throw Error('Liaison non appliquée.');}
          else{await model.notes.enable();if(!alive||!model.available())return;if(!model.notes.trigger(band,target))throw Error('Déclenchement non enregistré.');}
          close();refresh();
        }catch(error){message(error.message);}finally{apply.disabled=!select.value||Boolean(select.selectedOptions[0]?.disabled);}
      });
      select.value='';apply.disabled=true;select.addEventListener('change',()=>{apply.disabled=!select.value||Boolean(select.selectedOptions[0]?.disabled);});
      const related=model.entries.filter(e=>e.audio?.band===band||model.notes.scriptControlBands(e.label).includes(band));if(related.length){const openRelated=button('Ouvrir ces contrôleurs ('+related.length+')',()=>{close();setRelated(true,band);}),closeRelated=button('Refermer ces contrôleurs',()=>{close();setRelated(false,band);});openRelated.dataset.relatedSourceOpen=String(band);closeRelated.dataset.relatedSourceClose=String(band);buttons.append(openRelated,closeRelated);}
      buttons.append(apply,button('Fermer',close));
      const source=model.notes.data().sources.find(s=>s.band===band);if(source)buttons.append(button('Régler la source',()=>editor(source)));
      const trigger=model.notes.data().triggers.find(t=>t.band===band);if(trigger){dialog.append(element(doc,'p','Déclenchement actuel : '+trigger.target.replace('morph:snapshot:','Morphing · snapshot ').replace('snapshot:','Snapshot ').replace(/\d+$/,x=>String(Number(x)+1)),{class:'pilami-control-help'}));buttons.append(button('Retirer le déclenchement',()=>{if(model.notes.trigger(band,null)){close();refresh();}}));}
      const muted=model.notes.isMuted(band);
      const scriptEnabled=model.notes.scriptEnabled(band);
      if(band<16&&model.notes.usesScriptSource(band)){
        dialog.append(element(doc,'p','Liaison dans le code : '+(scriptEnabled?'activée.':'désactivée. Les liaisons aux paramètres restent indépendantes.'),{class:'pilami-control-help'}));
        if(scriptEnabled)buttons.append(button('Désactiver la liaison du code',()=>{if(model.notes.disableScriptSource(band)){close();refresh();}}));
        else buttons.append(button('Réactiver la liaison du code',async()=>{try{await model.notes.enable();if(alive&&model.available()&&model.notes.enableScriptSource(band)){close();refresh();}}catch(error){message(error.message);}}));
      }
      const linked=model.entries.filter(e=>e.audio?.band===band);
      if(linked.length)dialog.append(element(doc,'p','Liaisons ajoutées dans l’interface : '+linked.map(e=>e.label).join(', '),{class:'pilami-control-help'}));
      const unlink=button('Délier cette source',()=>{if(model.notes.unlinkSource(band)){close();refresh();}else message('Les liaisons n’ont pas été retirées. Vérifie le message de Hydra.');});
      unlink.dataset.noteUnlink=String(band);unlink.hidden=unlink.disabled=!linked.length&&!trigger&&!scriptEnabled;
      buttons.append(unlink);dialog.append(buttons);
    }
    function scaleEditor(existing=null){
      open(existing?'Modifier la gamme':'Nouvelle gamme');
      const form=element(doc,'form',null,{class:'pilami-note-form'}),name=element(doc,'input',null,{required:'',maxlength:'80','aria-label':'Nom de la gamme',placeholder:'Nom de la gamme'}),tuning=reference.cloneNode(true),notes=element(doc,'textarea',null,{required:'',rows:'3','aria-label':'Notes de la gamme',placeholder:'C3 F3 G3 A#3 C4 D4 E4 F4 G4 A#4 C5'}),preview=element(doc,'p','',{class:'pilami-control-help'});
      name.value=existing?.name||'';tuning.value=String(existing?.reference||reference.value);notes.value=existing?.notes.join(' ')||'';
      for(const [title,field]of [['Nom',name],['Diapason',tuning],['Notes séparées par des espaces ou tirets',notes]]){const label=element(doc,'label',title);label.append(field);form.append(label);}
      function values(){return window.PilamiNoteSources.parseScaleNotes(notes.value);}
      function update(){const items=values().map(n=>window.PilamiNoteSources.noteInfo(n,Number(tuning.value)));preview.textContent=items.map((n,i)=>n?n.name+' : '+Math.trunc(n.frequency)+' Hz':values()[i]+' : note invalide').join(' · ');notes.setCustomValidity(items.length&&items.length<=32&&items.every(Boolean)&&new Set(items.map(n=>n?.midi)).size===items.length?'':'Choisis de 1 à 32 notes valides et distinctes, par exemple F3 ou Bb3.');}
      notes.addEventListener('input',update);tuning.addEventListener('change',update);update();
      function persist(next){if(!model.notes.saveScales(next)){message('Gamme non enregistrée. Vérifie le message de Hydra.');return false;}try{localStorage.setItem(scaleKey,JSON.stringify(next));}catch(_){}scaleOptions();return true;}
      const buttons=element(doc,'div',null,{class:'pilami-note-actions'});buttons.append(element(doc,'button','Enregistrer la gamme',{type:'submit'}),button('Annuler',close));
      if(existing)buttons.append(button('Supprimer la gamme',()=>{if(persist(savedScales().filter(s=>s.name!==existing.name))){close();refresh();}}));
      form.append(preview,buttons);dialog.append(form);
      form.addEventListener('submit',event=>{event.preventDefault();update();if(!form.reportValidity())return;const next=savedScales().filter(s=>s.name!==existing?.name),title=name.value.trim();if(next.some(s=>s.name===title)){message('Ce nom existe déjà. Choisis un autre nom.');return;}const item={name:title,reference:Number(tuning.value),notes:values().map(n=>window.PilamiNoteSources.noteInfo(n,Number(tuning.value)).name)};next.push(item);if(!window.PilamiNoteSources.validScale(item)||next.length>64){message('Nom ou gamme invalide (64 gammes maximum).');return;}if(persist(next)){scaleChoice.value=title;reference.value=String(item.reference);close();refresh();}});
    }
    manage.addEventListener('click',()=>{open('Mes gammes');dialog.append(element(doc,'p','Gammes mémorisées dans ce navigateur et incluses dans le code du preset lors de leur enregistrement. Enregistre ensuite ton preset pour les conserver dans WordPress.',{class:'pilami-control-help'}),button('+ Créer une gamme',()=>scaleEditor()));for(const s of savedScales())dialog.append(button(s.name+' · '+s.reference+' Hz',()=>scaleEditor(s)));dialog.append(button('Fermer',close));});
    add.addEventListener('click',()=>editor());scale.addEventListener('click',()=>{const s=savedScales().find(s=>s.name===scaleChoice.value);if(model?.notes.addScale(Number(reference.value),s?.notes))refresh();});
    return{route,refresh(){const usable=Boolean(model?.available());add.disabled=scale.disabled=manage.disabled=!usable;const data=model?.notes.data(),key=JSON.stringify(data||null);if(key===listKey)return;listKey=key;list.replaceChildren();if(!data)return;for(const s of data.sources){const row=element(doc,'div',null,{class:'pilami-note-row'});row.append(element(doc,'span',s.name+' · '+String(Math.trunc(s.frequency))+' Hz ± '+s.width),button('Régler',()=>editor(s)),button('Lier…',()=>route(s.band)));list.append(row);}if(!data.sources.length)list.append(element(doc,'p','Ajoute une note, ou applique une gamme.',{class:'pilami-control-help'}));},dispose(){alive=false;if(dialog.open)dialog.close();dialog.remove();}};
  }

  function mount(host,root,model){
    const doc=host.ownerDocument,win=doc.defaultView;let alive=true,frame=null,last=0,signature='',rows=[],pads=[],bankCount='',meters=[];
    const disclosures=root._pilamiControllerDisclosures||(root._pilamiControllerDisclosures={});
    function fold(key,title,body,help){const box=element(doc,'details',null,{class:'pilami-controller-section','data-controller-section':key});box.open=Boolean(disclosures[key]);box.append(element(doc,'summary',title));if(help)box.append(element(doc,'p',help,{class:'pilami-control-help'}));box.append(body);box.addEventListener('toggle',()=>{disclosures[key]=box.open;});return box;}
    const surface=element(doc,'div',null,{class:'pilami-controller-surface'}),bank=element(doc,'section',null,{class:'pilami-audio-bank','aria-label':'Sources audio'});
    const heading=element(doc,'div',null,{class:'pilami-audio-heading'}),connect=element(doc,'button','Activer l’entrée audio',{type:'button','data-control-audio-connect':''});
    heading.append(element(doc,'h4','Sources audio'),connect);
    const hint=element(doc,'p','Une source peut piloter plusieurs paramètres, chacun avec sa profondeur. Clique une source, puis les titres des paramètres ou les axes XY à lier. Termine avec Terminer les liaisons, ou reclique la source. Le glisser-déposer et le clic droit restent disponibles. Gris : aucune liaison. Mauve : liaison dans l’interface. Ambre : liaison dans le code.',{class:'pilami-control-help'});
    const sources=element(doc,'div',null,{class:'pilami-audio-sources'}),audioStatus=element(doc,'p','Lance un visuel pour activer l’entrée audio.',{class:'pilami-control-help','data-control-audio-status':'',role:'status'});
    bank.append(heading,hint,sources,audioStatus);
    const noteView=mountNotes(bank,model,doc,refresh,setRelated);
    const empty=element(doc,'p','Aucun paramètre à ajuster ici. Les snapshots, le séquenceur et le panneau MIDI restent accessibles. Pour capturer une variation, lance un visuel contenant au moins un contrôleur.',{'data-control-empty':'',class:'pilami-control-help'}),content=element(doc,'div',null,{class:'pilami-control-grid'});
    const snapshotHost=element(doc,'div',null,{'data-snapshot-host':''}),midiHost=element(doc,'div',null,{'data-midi-host':''});
    const randomPanel=element(doc,'section',null,{class:'pilami-random-panel','aria-label':'Randomisation des contrôleurs','data-control-random-panel':''});
    const randomButton=element(doc,'button','Varier au hasard',{type:'button','data-control-random':'',title:'Faire varier les valeurs du preset courant dans leurs bornes Min–Max.'}),undoRandom=element(doc,'button','Annuler la variation',{type:'button','data-control-random-undo':''});
    const powerLabel=element(doc,'label','Puissance ',{class:'pilami-random-power'}),power=element(doc,'input',null,{type:'range',min:'0',max:'100',step:'1','aria-label':'Intensité de la variation','data-control-random-strength':''}),powerNumber=element(doc,'input',null,{type:'number',min:'0',max:'100',step:'1','aria-label':'Intensité de la variation en pourcentage','data-control-random-number':''});
    powerLabel.append(power,powerNumber,element(doc,'span','%'));
    const randomActions=element(doc,'div',null,{class:'pilami-random-actions'});randomActions.append(randomButton,powerLabel,undoRandom);
    randomPanel.append(randomActions,element(doc,'p','Petites variations à faible puissance · 100 % : toute la plage Min–Max. Les bornes et liaisons audio restent en place.',{class:'pilami-control-help'}));
    randomButton.addEventListener('click',()=>model?.random.run());undoRandom.addEventListener('click',()=>model?.random.undo());
    power.addEventListener('input',()=>model?.random.setStrength(Number(power.value)));
    function applyPower(){if(!powerNumber.value.trim()||!Number.isFinite(powerNumber.valueAsNumber)){powerNumber.setAttribute('aria-invalid','true');return;}powerNumber.removeAttribute('aria-invalid');model?.random.setStrength(powerNumber.valueAsNumber);powerNumber.value=String(model?.random.strength??20);}
    powerNumber.addEventListener('change',applyPower);powerNumber.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();applyPower();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();powerNumber.value=String(model?.random.strength??20);powerNumber.removeAttribute('aria-invalid');}});
    const parameters=element(doc,'section',null,{class:'pilami-controller-parameters','aria-label':'Paramètres du visuel'});
    const selection=element(doc,'div',null,{class:'pilami-audio-selection','data-control-audio-selection':''}),selectionText=element(doc,'p','',{class:'pilami-control-help',role:'status'}),finishSelection=element(doc,'button','Terminer les liaisons',{type:'button','data-control-audio-finish':''});selection.hidden=true;selection.append(selectionText,finishSelection);
    finishSelection.addEventListener('click',()=>model?.finishAudioSelection());
    surface.addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.defaultPrevented&&model?.selectedBand!==null&&model?.selectedBand!==undefined&&!event.target.closest('input,select,textarea,dialog,[contenteditable="true"]')){event.preventDefault();event.stopPropagation();model.finishAudioSelection();}});
    const relatedActions=element(doc,'div',null,{class:'pilami-related-actions','data-related-controls':''}),relatedOpen=element(doc,'button','Ouvrir les contrôleurs liés',{type:'button','data-related-open':''}),relatedClose=element(doc,'button','Refermer les contrôleurs liés',{type:'button','data-related-close':''}),relatedStatus=element(doc,'span','',{class:'pilami-control-help',role:'status','data-related-status':''});relatedActions.append(relatedOpen,relatedClose,relatedStatus);relatedOpen.addEventListener('click',()=>setRelated(true));relatedClose.addEventListener('click',()=>setRelated(false));
    parameters.append(element(doc,'p','Ajuste ces paramètres pendant la lecture. Le code suit tes changements.',{class:'pilami-control-help'}),relatedActions,selection,empty,content);
    const snapshots=fold('snapshots','Snapshots · mémoriser et retrouver une variation',snapshotHost,'Capture tes réglages. Le bouton rappelle une capture ; sa flèche fait une transition vers elle.');
    const audioBox=fold('audio','Réagir au son · sources et liaisons audio',bank,'Active l’entrée audio, puis clique une source et le paramètre à faire varier.');
    const midiBox=fold('midi','Contrôler avec un appareil MIDI',midiHost,'Associe une note, un bouton ou un potentiomètre de ton appareil à une commande.');
    surface.append(parameters,randomPanel,snapshots,audioBox,midiBox);host.replaceChildren(surface);
    const midiOutputView=window.PilamiMidiOutput?.mount(surface);
    const performanceView=window.PilamiPerformance?.mount(parameters,root,model);
    const snapshotView=window.PilamiHydraSnapshots?.mount(snapshotHost,model?.snapshots),midiView=window.PilamiHydraMidi?.mount(midiHost,model?.midi);surface.classList.toggle('has-snapshots',Boolean(model?.snapshots));
    connect.addEventListener('click',async()=>{connect.disabled=true;try{await window.PilamiStrudelHydra.enableControlAudio(0,true);}catch(error){audioStatus.textContent=error.message;}finally{connect.disabled=false;refresh();}});
    function dropZone(node,targets){
      node.dataset.controlDrop=targets.map(entry=>entry.label).join('+');
      node.addEventListener('dragover',event=>{if(Array.from(event.dataTransfer.types).includes(MIME)){event.preventDefault();event.dataTransfer.dropEffect='link';node.classList.add('is-drop-target');}});
      node.addEventListener('dragleave',()=>node.classList.remove('is-drop-target'));
      node.addEventListener('drop',event=>{
        if(!Array.from(event.dataTransfer.types).includes(MIME))return;event.preventDefault();event.stopPropagation();node.classList.remove('is-drop-target');const raw=event.dataTransfer.getData(MIME);
        if(!/^\d+$/.test(raw))return;model.bind(targets,Number(raw));
      });
      node.addEventListener('click',event=>{const widget=event.target.closest('input,select,button,summary');if(widget&&widget!==node&&!widget.classList.contains('pilami-control-destination'))return;if(model.selectedBand!==null){event.preventDefault();event.stopPropagation();model.bind(targets,model.selectedBand);}});
    }
    function renderBank(){
      const count=Math.min(16,Math.max(5,window.PilamiStrudelHydra.audio()?.fft.length||0)),bands=[...Array.from({length:count},(_,i)=>i),...(model?.notes.data().sources.map(s=>s.band)||[])],key=bands.map(b=>b+':'+(model?.notes.label(b)||'')).join('|');if(key===bankCount)return;bankCount=key;sources.replaceChildren();
      meters=bands.map(band=>{
        const button=element(doc,'button',null,{type:'button',draggable:'true',class:'pilami-audio-source is-unlinked','data-audio-band':String(band),'aria-label':'Source audio a.fft['+band+']','aria-pressed':'false'}),meter=element(doc,'meter',null,{min:'0',max:'1',value:'0','aria-label':'Niveau de la bande '+band});
        const codeLabel=element(doc,'small','',{class:'pilami-audio-code-targets','data-source-code-label':String(band)});button.append(element(doc,'span',model?.notes.label(band)||'a.fft['+band+']'),meter,codeLabel);
        if(band>=16){const s=model.notes.data().sources.find(s=>s.band===band);button.title=String(Math.trunc(s.frequency))+' Hz · ± '+s.width+' Hz · clic droit : réglages et liaison';}
        button.dataset.sourceTitle=button.title||'Bande audio '+band;
        button.addEventListener('contextmenu',event=>{event.preventDefault();if(model)noteView.route(band);});
        button.addEventListener('dragstart',event=>{event.dataTransfer.setData(MIME,String(band));event.dataTransfer.effectAllowed='link';});
        button.addEventListener('click',()=>{if(model){model.selectBand(band);refresh();}else audioStatus.textContent='Lance un visuel avec des contrôleurs avant de créer une liaison.';});sources.append(button);return{band,button,meter,codeLabel};
      });
    }
    function resetOnRightClick(widget,targets,after=()=>{}){
      widget.title=(widget.title?widget.title+' ':'')+'Clic droit : valeur au lancement du preset (dans les bornes actuelles).';
      widget.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();if(model.resetBase(targets))after();});
    }
    function makeCard(entry){
      const card=element(doc,'section',null,{class:'pilami-control-card','data-control-id':entry.id}),top=element(doc,'div',null,{class:'pilami-control-heading'});
      const title=element(doc,'button',entry.label,{type:'button',class:'pilami-control-destination','aria-label':'Lier une source à '+entry.label}),kind=element(doc,'select',null,{'aria-label':'Présentation de '+entry.label,'data-control-kind':entry.label});
      const kinds=[['slider','Curseur'],['knob','Potentiomètre'],['fader','Fader vertical']];if(entry.min===0&&entry.max===1)kinds.push(['toggle','Interrupteur']);
      kinds.forEach(([value,label])=>kind.append(element(doc,'option',label,{value})));kind.value=entry.kind;kind.addEventListener('change',()=>model.setKind(entry,kind.value));top.append(title);
      const control=element(doc,'div',null,{class:'pilami-control-value'}),input=element(doc,'input',null,{type:'range',min:entry.min,max:entry.max,step:entry.step,'aria-label':entry.label,'data-control-base':entry.label}),output=element(doc,'input',null,{type:'text',inputmode:'decimal',class:'pilami-control-number','aria-label':'Valeur manuelle de '+entry.label,'data-control-value':entry.label,autocomplete:'off',spellcheck:'false',title:'Entrée ou clic ailleurs : appliquer. Échap : annuler. Point ou virgule pour les décimales.'});input.value=entry.value;output.value=String(entry.value);
      const valueStatus=element(doc,'p','',{class:'pilami-control-help',role:'status','data-control-value-status':entry.label});valueStatus.hidden=true;
      let valueDraft=false;
      function cleanValue(){valueDraft=false;output.value=String(entry.value);output.removeAttribute('aria-invalid');valueStatus.hidden=true;}
      function applyValue(){
        if(!valueDraft)return;
        const raw=output.value.trim(),next=/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(raw)?Number(raw.replace(',','.')):NaN;
        if(!Number.isFinite(next)){output.setAttribute('aria-invalid','true');valueStatus.textContent='Saisis un nombre, ou Échap pour revenir à la valeur actuelle.';valueStatus.hidden=false;return;}
        if(model.setBase(entry,next))cleanValue();
        else{valueStatus.textContent='La valeur n’a pas été appliquée. Vérifie le message de Hydra.';valueStatus.hidden=false;}
      }
      output.addEventListener('input',()=>{valueDraft=true;output.removeAttribute('aria-invalid');valueStatus.hidden=true;if(model.snapshots?.state.running)model.snapshots.stop();});
      output.addEventListener('blur',applyValue);
      output.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();applyValue();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cleanValue();}});
      input.addEventListener('input',()=>model.setBase(entry,Number(input.value)));control.append(input,output);
      const knob=element(doc,'button',null,{type:'button',class:'pilami-knob','aria-label':entry.label,title:'Glisse verticalement. Maj : réglage fin. Les flèches fonctionnent aussi.',role:'slider',tabindex:'0','aria-valuemin':entry.min,'aria-valuemax':entry.max,'data-control-knob':entry.label}),needle=element(doc,'span',null,{class:'pilami-knob-needle'});knob.append(needle);knob.hidden=entry.kind!=='knob';
      knob.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();const startY=event.clientY,start=entry.value;knob.setPointerCapture(event.pointerId);const move=next=>model.setBase(entry,start+(startY-next.clientY)*(entry.max-entry.min)/180*(next.shiftKey ? 0.1 : 1));const end=()=>{knob.removeEventListener('pointermove',move);knob.removeEventListener('pointerup',end);knob.removeEventListener('pointercancel',end);};knob.addEventListener('pointermove',move);knob.addEventListener('pointerup',end);knob.addEventListener('pointercancel',end);});
      knob.addEventListener('keydown',event=>{const step=Number(entry.step)>0?Number(entry.step):(entry.max-entry.min)/100;let next;if(['ArrowUp','ArrowRight'].includes(event.key))next=entry.value+step;if(['ArrowDown','ArrowLeft'].includes(event.key))next=entry.value-step;if(event.key==='Home')next=entry.min;if(event.key==='End')next=entry.max;if(next!==undefined){event.preventDefault();model.setBase(entry,next);}});
      const toggle=element(doc,'button','Activer',{type:'button',class:'pilami-toggle',role:'switch','aria-label':entry.label,'aria-checked':'false','data-control-toggle':entry.label});toggle.hidden=entry.kind!=='toggle';toggle.addEventListener('click',()=>model.setBase(entry,entry.value>=.5?0:1));
      for(const widget of [input,output,knob,toggle])resetOnRightClick(widget,entry,cleanValue);
      input.hidden=['knob','toggle'].includes(entry.kind);input.classList.toggle('pilami-fader',entry.kind==='fader');control.prepend(knob,toggle);
      const effective=element(doc,'p',null,{class:'pilami-control-help','data-control-effective':entry.label}),effectiveLabel=element(doc,'span','Valeur manuelle'),effectiveDetail=element(doc,'span','',{'data-control-effective-detail':''});effective.append(effectiveLabel,effectiveDetail);card.append(top,control,valueStatus,effective);
      const bounds=element(doc,'div',null,{class:'pilami-control-bounds','data-control-bounds':entry.label});
      const minLabel=element(doc,'label','Min '),maxLabel=element(doc,'label','Max ');
      const min=element(doc,'input',null,{type:'number',step:'any','aria-label':'Minimum de '+entry.label,'data-control-min':entry.label});min.value=String(entry.min);
      const max=element(doc,'input',null,{type:'number',step:'any','aria-label':'Maximum de '+entry.label,'data-control-max':entry.label});max.value=String(entry.max);
      const apply=element(doc,'button','Appliquer',{type:'button','aria-label':'Appliquer les bornes de '+entry.label,'data-control-range-apply':entry.label});
      const rangeStatus=element(doc,'p','',{class:'pilami-control-help pilami-range-status',role:'status','data-control-range-status':entry.label});rangeStatus.hidden=true;
      let rangeDraft=false;
      function cleanRange(){rangeDraft=false;min.value=String(entry.min);max.value=String(entry.max);rangeStatus.hidden=true;min.removeAttribute('aria-invalid');max.removeAttribute('aria-invalid');}
      function applyRange(){
        const low=min.value.trim()?min.valueAsNumber:NaN,high=max.value.trim()?max.valueAsNumber:NaN;
        if(!Number.isFinite(low)||!Number.isFinite(high)||low>=high){
          rangeStatus.textContent='Saisis deux nombres avec Min < Max.';rangeStatus.hidden=false;min.setAttribute('aria-invalid','true');max.setAttribute('aria-invalid','true');return;
        }
        if(model.setRange(entry,low,high))cleanRange();
        else{rangeStatus.textContent='Les bornes n’ont pas été appliquées. Vérifie le message de Hydra.';rangeStatus.hidden=false;}
      }
      [min,max].forEach(field=>{field.addEventListener('input',()=>{rangeDraft=true;rangeStatus.hidden=true;min.removeAttribute('aria-invalid');max.removeAttribute('aria-invalid');if(model.snapshots?.state.running)model.snapshots.stop();});field.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();applyRange();}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cleanRange();}});});
      apply.addEventListener('click',applyRange);minLabel.append(min);maxLabel.append(max);bounds.append(minLabel,maxLabel,apply,rangeStatus);bounds.hidden=entry.kind==='toggle';
      const advanced=element(doc,'details',null,{class:'pilami-control-advanced','data-control-advanced':entry.id});advanced.open=Boolean(disclosures['control:'+entry.id]);
      advanced.append(element(doc,'summary','Réglages du contrôleur'));const kindLabel=element(doc,'label','Présentation ');kindLabel.append(kind);advanced.append(kindLabel,bounds);
      advanced.addEventListener('toggle',()=>{disclosures['control:'+entry.id]=advanced.open;});card.append(advanced);
      let depth=null;
      if(entry.audio){
        const routing=element(doc,'div',null,{class:'pilami-audio-routing'}),source=element(doc,'select',null,{'aria-label':'Bande audio de '+entry.label,'data-control-band':entry.label});
        const count=Math.max(5,window.PilamiStrudelHydra.audio()?.fft.length||0,entry.audio.band+1);for(let band=0;band<Math.min(16,count);band++)source.append(element(doc,'option','a.fft['+band+']',{value:String(band)}));model.notes.data().sources.forEach(s=>source.append(element(doc,'option',s.name,{value:String(s.band)})));source.value=entry.audio.band;source.addEventListener('change',()=>model.bind([entry],Number(source.value)));
        const label=element(doc,'label','Profondeur ');depth=element(doc,'input',null,{type:'number',step:'any','aria-label':'Profondeur audio de '+entry.label,'data-control-depth':entry.label});depth.value=number(entry.audio.depth);depth.addEventListener('input',()=>{if(model.snapshots?.state.running)model.snapshots.stop();});depth.addEventListener('change',()=>{if(depth.value.trim())model.setDepth(entry,Number(depth.value));else refresh();});label.append(depth);
        const remove=element(doc,'button','Délier',{type:'button','data-control-unlink':entry.label});remove.addEventListener('click',()=>model.unlink(entry));routing.append(source,label,remove);card.append(routing);
      }
      const midiActions=element(doc,'div',null,{class:'pilami-control-midi-actions'}),midiButton=element(doc,'button',null,{type:'button',class:'pilami-midi-control-learn','data-control-midi':entry.label,'aria-label':'Apprendre le MIDI pour '+entry.label}),midiUnlink=element(doc,'button','Délier MIDI',{type:'button',class:'pilami-midi-control-unlink','data-control-midi-unlink':entry.label,'aria-label':'Délier le MIDI de '+entry.label});const midiIcon=element(doc,'span',null,{class:'pilami-midi-learn-icon','aria-hidden':'true'});midiIcon.style.maskImage=midiIcon.style.webkitMaskImage='url('+JSON.stringify(midiLearnIconURL)+')';midiButton.append(midiIcon);midiButton.addEventListener('click',()=>{const target='control:'+model.entries.indexOf(entry),learning=window.PilamiHydraMidi?.state.learning;if(learning?.owner===model.midi&&learning.target===target)model.midi.cancel();else model.midi?.learn(target);});midiUnlink.addEventListener('click',()=>{if(model.midi?.remove('control:'+model.entries.indexOf(entry)))midiButton.focus();});top.append(midiButton);midiActions.append(midiUnlink);card.append(midiActions);
      const midiInvert=element(doc,'button','+',{type:'button',class:'pilami-midi-control-invert','data-control-midi-invert':entry.label,'aria-label':'Inverser plage MIDI de '+entry.label,'aria-pressed':'false',title:'Inverser plage MIDI'});midiInvert.hidden=true;midiInvert.addEventListener('click',()=>{const target='control:'+model.entries.indexOf(entry),binding=model.midi?.mappings().find(m=>m.target===target);if(binding)model.midi.setInverted(target,!binding.inverted);});midiActions.append(midiInvert);
      const codeBadge=element(doc,'p','',{class:'pilami-control-code-label','data-control-code-label':entry.label});card.append(codeBadge);
      dropZone(card,[entry]);content.append(card);return{entry,codeBadge,advanced,card,input,output,midiButton,midiUnlink,midiInvert,midiActions,knob,needle,toggle,effective,effectiveLabel,effectiveDetail,depth,kind,bounds,min,max,rangeDraft:()=>rangeDraft,valueDraft:()=>valueDraft};
    }
    function makePad(pair){
      const card=element(doc,'section',null,{class:'pilami-xy-card','data-control-pad':pair.title}),title=element(doc,'h4',pair.title+' · Pad XY'),zones=element(doc,'div',null,{class:'pilami-xy-zones'});
      const x=element(doc,'button','Lier X · '+pair.x.label,{type:'button','data-control-axis':'x'}),y=element(doc,'button','Lier Y · '+pair.y.label,{type:'button','data-control-axis':'y'});dropZone(x,[pair.x]);dropZone(y,[pair.y]);zones.append(x,y);
      const pad=element(doc,'div',null,{class:'pilami-xy-pad',tabindex:'0',role:'group','aria-label':pair.title+' : flèches pour déplacer X et Y','data-xy-surface':pair.title}),dot=element(doc,'span',null,{class:'pilami-xy-dot'}),base=element(doc,'span',null,{class:'pilami-xy-base'});pad.append(base,dot);dropZone(pad,[pair.x,pair.y]);
      pad.addEventListener('pointerdown',event=>{
        if(event.button!==0||model.selectedBand!==null)return;event.preventDefault();pad.focus();pad.setPointerCapture(event.pointerId);
        const move=next=>{const bounds=pad.getBoundingClientRect();model.setXY(pair,pair.x.min+clamp((next.clientX-bounds.left)/bounds.width,0,1)*(pair.x.max-pair.x.min),pair.y.max-clamp((next.clientY-bounds.top)/bounds.height,0,1)*(pair.y.max-pair.y.min));};
        const end=()=>{pad.removeEventListener('pointermove',move);pad.removeEventListener('pointerup',end);pad.removeEventListener('pointercancel',end);};move(event);pad.addEventListener('pointermove',move);pad.addEventListener('pointerup',end);pad.addEventListener('pointercancel',end);
      });
      resetOnRightClick(pad,[pair.x,pair.y]);
      pad.addEventListener('keydown',event=>{const stepX=Number(pair.x.step)>0?Number(pair.x.step):(pair.x.max-pair.x.min)/100,stepY=Number(pair.y.step)>0?Number(pair.y.step):(pair.y.max-pair.y.min)/100;let dx=0,dy=0;if(event.key==='ArrowLeft')dx=-stepX;if(event.key==='ArrowRight')dx=stepX;if(event.key==='ArrowUp')dy=stepY;if(event.key==='ArrowDown')dy=-stepY;if(dx||dy){event.preventDefault();model.setXY(pair,pair.x.value+dx,pair.y.value+dy);}});
      const output=element(doc,'output','');card.append(title,zones,pad,output,element(doc,'p','Glisse ici une bande pour lier X et Y ensemble. Le point plein suit le son ; le cercle indique la position manuelle. Clic droit : réinitialiser X et Y.',{class:'pilami-control-help'}));content.append(card);return{pair,dot,base,output,xButton:x,yButton:y};
    }
    function relatedEntries(band=null){return(model?.entries||[]).filter(e=>(e.audio&&(band===null||e.audio.band===band))||model.notes.scriptControlBands(e.label).some(b=>band===null||b===band));}
    function syncDisclosures(){for(const row of rows)row.advanced.open=Boolean(disclosures['control:'+row.entry.id]);}
    function setRelated(open,band=null){
      const targets=relatedEntries(band);for(const entry of targets)disclosures['control:'+entry.id]=open;
      syncDisclosures();root.dispatchEvent(new CustomEvent('pilami-controller-disclosures-change'));
      relatedStatus.textContent=targets.length+' contrôleur(s) '+(open?'ouverts':'refermés')+(band===null?'':' · '+model.notes.label(band));
      if(open&&band!==null){const first=rows.find(row=>targets.includes(row.entry));first?.card.scrollIntoView({block:'nearest',behavior:'auto'});}
    }
    root.addEventListener('pilami-controller-disclosures-change',syncDisclosures);
    function render(){
      if(!model)return;const next=model.entries.map(entry=>entry.id+':'+entry.kind+':'+(entry.audio?entry.audio.band:'-')).join('|')+JSON.stringify(model.notes.data().sources.map(s=>[s.band,s.name]));if(next===signature)return;signature=next;content.replaceChildren();pads=model.pads.map(makePad);rows=model.entries.map(makeCard);
    }
    function refresh(){
      if(!alive)return;renderBank();render();snapshotView?.refresh();midiView?.refresh();noteView.refresh();empty.hidden=Boolean(model?.entries.length);snapshots.hidden=!model?.snapshots;midiBox.hidden=!model?.midi;
      randomPanel.hidden=!model?.entries.length;
      if(model?.random){const usable=model.available(),busy=model.random.busy();randomButton.disabled=!usable||busy||model.random.strength===0;undoRandom.disabled=!usable||busy||!model.random.canUndo();power.disabled=powerNumber.disabled=!usable;if(doc.activeElement!==power)power.value=String(model.random.strength);if(doc.activeElement!==powerNumber)powerNumber.value=String(model.random.strength);}
      const related=relatedEntries();relatedActions.hidden=!related.length;relatedOpen.disabled=relatedClose.disabled=!related.length;relatedOpen.title=relatedClose.title=related.length+' contrôleur(s) repérés dans le code ou liés dans l’interface. Ouvre ou referme leurs réglages sans changer les valeurs.';
      const audio=window.PilamiStrudelHydra.audio();connect.textContent=audio?.stream?.active?'Reconnecter l’entrée audio':'Activer l’entrée audio';
      const mic=root.querySelector('[data-hydra-audio-status]')?.textContent;
      const selected=model?.selectedBand!==null&&model?.selectedBand!==undefined;
      selection.hidden=!selected;
      if(selected){const destinations=sourceDestinations(model,model.selectedBand),text=model.notes.label(model.selectedBand)+' → '+(destinations.length?destinations.join(' · '):'aucun paramètre lié')+' · Clique d’autres titres pour ajouter des liaisons.';if(selectionText.textContent!==text)selectionText.textContent=text;}
      audioStatus.classList.toggle('is-error',Boolean(model?.audioFeedback.error));
      if(model?.audioFeedback.error){audioStatus.textContent=model.audioFeedback.text;}
      else if(selected){
        const destinations=sourceDestinations(model,model.selectedBand),label=model.notes.label(model.selectedBand);
        const text=destinations.length?label+' → '+destinations.join(' · ')+' · Clique d’autres titres pour ajouter des liaisons ; clic droit pour modifier ou délier.':label+' · Aucune liaison : clique une ou plusieurs destinations.';
        if(audioStatus.textContent!==text)audioStatus.textContent=text;
      }else if(model?.audioFeedback.text){if(audioStatus.textContent!==model.audioFeedback.text)audioStatus.textContent=model.audioFeedback.text;}
      else{const text=mic?mic+' · '+(audio?.fft.length||0)+' bandes, des graves aux aigus.':audio?.stream?.active?'Entrée audio active · clique une source pour créer des liaisons.':'Lance un visuel puis active l’entrée audio pour créer des liaisons.';if(audioStatus.textContent!==text)audioStatus.textContent=text;}
      meters.forEach(({band,button,meter,codeLabel})=>{
        const targets=(model?.entries||[]).filter(e=>e.audio?.band===band),trigger=model?.notes.data().triggers.find(t=>t.band===band),linked=targets.length>0||Boolean(trigger)||Boolean(model?.notes.scriptEnabled(band));
        button.classList.toggle('is-linked',linked);button.classList.toggle('is-script-linked',Boolean(model?.notes.scriptEnabled(band)));button.classList.toggle('has-control-link',targets.length>0||Boolean(trigger));button.classList.toggle('is-unlinked',!linked);button.dataset.sourceLinked=String(linked);
        const codeText=model?.notes.usesScriptSource(band)?(model.notes.scriptEnabled(band)?'Code → ':'Code désactivé → ')+([...new Set(model.notes.scriptUses(band).effects.flatMap(e=>{const names=e.parameters.filter(n=>!/^Audio[_ ]/i.test(n));return names.length?names:e.parameters.length?e.parameters:[e.method||'Formule'];}))].join(' · ')||'voir les lectures'):'';if(codeLabel.textContent!==codeText)codeLabel.textContent=codeText;codeLabel.hidden=!codeText;
        button.setAttribute('aria-label','Source audio '+(model?.notes.label(band)||'a.fft['+band+']')+(linked?' · liée':' · non liée'));
        button.title=button.dataset.sourceTitle+(model?.notes.isMuted(band)?' · FFT neutralisée dans le script':'')+(linked?' · Liée : '+sourceDestinations(model,band).join(', '):' · Aucune liaison');
        meter.value=audioLevel(band);button.classList.toggle('is-note-hit',linked&&Boolean(model?.notes.flash(band)));button.setAttribute('aria-pressed',String(model?.selectedBand===band));button.classList.toggle('is-selected',model?.selectedBand===band);button.classList.toggle('is-unavailable',!audio||(band<16&&band>=audio.fft.length));});
      rows.forEach(row=>{const e=row.entry,scriptBands=model.notes.scriptControlBands(e.label),activeScriptBands=scriptBands.filter(b=>model.notes.scriptEnabled(b)),codeText=scriptBands.length?(activeScriptBands.length?'Code : '+activeScriptBands.map(b=>'a.fft['+b+']').join(', '):'Liaison du code désactivée'):'';if(row.codeBadge.textContent!==codeText)row.codeBadge.textContent=codeText;row.codeBadge.hidden=!codeText;row.codeBadge.title='Ce paramètre figure dans une formule audio du script ; la valeur affichée reste sa valeur de base.';const current=value(e),target='control:'+model.entries.indexOf(e),binding=model.midi?.mappings().find(m=>m.target===target),learning=window.PilamiHydraMidi?.state.learning;
        const waiting=learning?.owner===model.midi&&learning.target===target;row.midiButton.classList.toggle('is-learning',waiting);row.midiButton.classList.toggle('has-midi',Boolean(binding));row.midiButton.setAttribute('aria-busy',String(waiting));row.midiButton.setAttribute('aria-label',(waiting?'Annuler l’apprentissage MIDI pour ':'Apprendre le MIDI pour ')+e.label);row.midiButton.title=waiting?'En attente MIDI · clique pour annuler':binding?'MIDI Learn · '+window.PilamiHydraMidi.describe(binding)+' · clique pour réapprendre':'MIDI Learn · clique puis envoie un message MIDI';row.midiButton.hidden=!model.midi;row.midiButton.disabled=Boolean(window.PilamiHydraMidi?.state.busy)||!model.available();
        row.midiUnlink.hidden=!binding;row.midiActions.hidden=!model.midi||!binding;
        row.midiInvert.hidden=binding?.type!=='cc';row.midiInvert.textContent=binding?.inverted?'−':'+';row.midiInvert.setAttribute('aria-pressed',String(Boolean(binding?.inverted)));row.midiInvert.title='Inverser plage MIDI · '+(binding?.inverted?'sens inversé : 0 → Max, 127 → Min':'sens normal : 0 → Min, 127 → Max');
        row.input.min=e.min;row.input.max=e.max;row.input.step=e.step;row.knob.setAttribute('aria-valuemin',e.min);row.knob.setAttribute('aria-valuemax',e.max);
        if(!row.rangeDraft()){row.min.value=String(e.min);row.max.value=String(e.max);}
        const toggleOption=row.kind.querySelector('option[value="toggle"]');
        if(e.min===0&&e.max===1){if(!toggleOption)row.kind.append(element(doc,'option','Interrupteur',{value:'toggle'}));}else toggleOption?.remove();
        if(row.input.value!==String(e.value))row.input.value=e.value;if(!row.valueDraft())row.output.value=String(e.value);row.knob.setAttribute('aria-valuenow',number(e.value));row.needle.style.transform='rotate('+(-135+(e.value-e.min)/(e.max-e.min)*270)+'deg)';row.toggle.setAttribute('aria-checked',String(e.value>=.5));row.toggle.textContent=e.value>=.5?'Activé':'Désactivé';
        const effectiveLabel=e.audio?'Valeur avec audio':'Valeur manuelle',effectiveDetail=e.audio?number(current)+' · '+model.notes.label(e.audio.band)+' × '+number(e.audio.depth):'';
        if(row.effectiveLabel.textContent!==effectiveLabel)row.effectiveLabel.textContent=effectiveLabel;if(row.effectiveDetail.textContent!==effectiveDetail)row.effectiveDetail.textContent=effectiveDetail;row.effective.title=effectiveLabel+(effectiveDetail?' : '+effectiveDetail:'');
        if(row.depth&&doc.activeElement!==row.depth)row.depth.value=number(e.audio.depth);
      });
      pads.forEach(({pair,dot,base,output,xButton,yButton})=>{const x=value(pair.x),y=value(pair.y);dot.style.left=(x-pair.x.min)/(pair.x.max-pair.x.min)*100+'%';dot.style.top=(pair.y.max-y)/(pair.y.max-pair.y.min)*100+'%';base.style.left=(pair.x.value-pair.x.min)/(pair.x.max-pair.x.min)*100+'%';base.style.top=(pair.y.max-pair.y.value)/(pair.y.max-pair.y.min)*100+'%';output.textContent='X '+number(x)+' · Y '+number(y);[[xButton,pair.x,'X'],[yButton,pair.y,'Y']].forEach(([button,entry,axis])=>{button.textContent=entry.audio?axis+' · '+model.notes.label(entry.audio.band)+' × '+number(entry.audio.depth):'Lier '+axis+' · '+entry.label;button.classList.toggle('has-audio',Boolean(entry.audio));});});
    }
    // The existing 20 Hz UI clock is sufficient during morphing; model values
    // and the renderer still advance on every animation frame. Refresh endpoints
    // and direct edits immediately.
    const unsubscribe=model?.subscribe(()=>{if(!model.snapshots?.state.running)refresh();});
    function tick(now){if(!alive||win.closed||!host.isConnected)return;if(now-last>=50){last=now;refresh();}frame=win.requestAnimationFrame(tick);}
    refresh();frame=win.requestAnimationFrame(tick);
    return{refresh,dispose(){alive=false;root.removeEventListener('pilami-controller-disclosures-change',syncDisclosures);midiOutputView?.dispose();performanceView?.dispose();unsubscribe?.();snapshotView?.dispose();midiView?.dispose();noteView.dispose();if(frame&&!win.closed)win.cancelAnimationFrame(frame);}};
  }
  window.PilamiHydraControls={create,mount,value,validateAudio,audioLevel,cssURL};
})();
