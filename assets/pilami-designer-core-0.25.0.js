/* Pilami Hydra Designer — original graph compiler. No ONDA source code used. */
(function(g){
  'use strict';
  const defs = {...g.PilamiDesignerCatalog,
    buffer:{group:'Sources',kind:'source',label:'Feedback / buffer',params:[{name:'buffer',value:0,min:0,max:3,step:1}]},
    image:{group:'Sources',kind:'source',label:'Image (s0)',params:[{name:'url',value:'',text:true}]},
    out:{group:'Sorties',kind:'out',label:'Sortie',params:[{name:'buffer',value:0,min:0,max:3,step:1}]},
    fft:{group:'Audio & contrôleurs',kind:'control',label:'Audio FFT',params:[{name:'band',value:0,min:0,max:5,step:1},{name:'gain',value:1},{name:'offset',value:0}]},
    amplitude:{group:'Audio & contrôleurs',kind:'control',label:'Amplitude (moyenne FFT)',params:[{name:'gain',value:1},{name:'offset',value:0}]},
    slider:{group:'Audio & contrôleurs',kind:'control',label:'Slider',params:[{name:'value',value:0.5},{name:'min',value:0},{name:'max',value:1},{name:'step',value:0.01}]},
    knob:{group:'Audio & contrôleurs',kind:'control',label:'Bouton rotatif',params:[{name:'value',value:0.5},{name:'min',value:0},{name:'max',value:1},{name:'step',value:0.01}]},
    xy:{group:'Audio & contrôleurs',kind:'control',label:'Pad XY',params:[{name:'x',value:0},{name:'y',value:0},{name:'min',value:-1},{name:'max',value:1},{name:'step',value:0.01}]},
    lfo:{group:'Audio & contrôleurs',kind:'control',label:'LFO (sinus)',params:[{name:'frequency',value:0.1},{name:'gain',value:0.5},{name:'offset',value:0.5}]},
    beat:{group:'Audio & contrôleurs',kind:'control',label:'LFO au BPM manuel',params:[{name:'bpm',value:120},{name:'beats',value:4},{name:'gain',value:0.5},{name:'offset',value:0.5}]},
    valueCode:{group:'Audio & contrôleurs',kind:'control',label:'Expression conservée',params:[{name:'code',value:'() => a.fft[0] || 0',code:true}]},
    textureCode:{group:'Sources',kind:'source',label:'Source / bloc de code',params:[{name:'code',value:'src(s0)',code:true}]}
  };
  const clone = value=>JSON.parse(JSON.stringify(value));
  const def=type=>{if(!Object.hasOwn(defs,type))throw new Error('Type de nœud inconnu : '+type);return defs[type];};
  const inputs=node=>{const d=def(node.type);return [...(d.kind==='effect'||d.kind==='mix'||d.kind==='out'?[{key:'a',type:'texture',label:'Image A'}]:[]),...(d.kind==='mix'?[{key:'b',type:'texture',label:'Image B'}]:[]),...(d.kind!=='out'&&d.kind!=='control'?d.params.filter(p=>!p.text&&!p.code&&!['buffer'].includes(p.name)).map(p=>({key:'p:'+p.name,type:'value',label:p.name})):[])];};
  const outputs=node=>def(node.type).kind==='out'?[]:def(node.type).kind==='control'?(node.type==='xy'?['x','y']:['value']):['texture'];
  function newNode(type,id,x=40,y=40){return {id,type,x,y,params:Object.fromEntries(def(type).params.map(p=>[p.name,p.value]))};}
  function validate(raw){
    if(!raw||raw.version!==1||!Array.isArray(raw.nodes)||!Array.isArray(raw.edges)||raw.nodes.length>100||raw.edges.length>500)throw new Error('Graphe invalide (100 nœuds maximum).');
    const graph={version:1,nodes:[],edges:[],view:{x:0,y:0,zoom:1}},ids=new Set(),targets=new Set();
    for(const n of raw.nodes){
      if(!n||!/^n[1-9]\d{0,6}$/.test(n.id)||ids.has(n.id)||!Number.isFinite(n.x)||!Number.isFinite(n.y)||Math.abs(n.x)>100000||Math.abs(n.y)>100000)throw new Error('Identifiant ou position de nœud invalide.');
      ids.add(n.id);const d=def(n.type),node=newNode(n.type,n.id,n.x,n.y);
      for(const p of d.params){const v=n.params?.[p.name]??p.value;
        if(p.code){if(typeof v!=='string'||!v.trim()||v.length>32768||v.includes('\0'))throw new Error('Expression de code invalide.');if(!g.acorn)throw new Error('Analyseur JavaScript indisponible.');g.acorn.parse('('+v+'\n)',{ecmaVersion:'latest',allowAwaitOutsideFunction:true});}
        else if(p.text){if(typeof v!=='string'||v.length>3000)throw new Error('URL image invalide.');if(v&&(!/^https?:\/\//i.test(v)||/[\r\n\0]/.test(v)))throw new Error('Utilise une URL image HTTP(S).');}
        else if(!Number.isFinite(v)||Math.abs(v)>1e9||(p.min!==undefined&&v<p.min)||(p.max!==undefined&&v>p.max)||(p.step===1&&!Number.isInteger(v)))throw new Error('Valeur invalide pour '+p.name+'.');
        node.params[p.name]=v;
      }
      if(['slider','knob','xy'].includes(n.type)){const p=node.params;if(p.min>=p.max||p.step<=0||(['slider','knob'].includes(n.type)?p.value<p.min||p.value>p.max:p.x<p.min||p.x>p.max||p.y<p.min||p.y>p.max))throw new Error('Contrôleur : min < max, pas positif et valeur dans la plage requis.');}
      if(n.type==='beat'&&(node.params.bpm<=0||node.params.beats<=0))throw new Error('BPM et durée doivent être positifs.');
      if(n.label!==undefined){if(typeof n.label!=='string'||n.label.length>150)throw new Error('Nom de nœud invalide.');node.label=n.label;}
      graph.nodes.push(node);
    }
    const byId=new Map(graph.nodes.map(n=>[n.id,n]));
    for(const e of raw.edges){
      const from=byId.get(e?.from),to=byId.get(e?.to),pin=to&&inputs(to).find(p=>p.key===e.input),key=e?.to+':'+e?.input;
      if(!from||!to||!pin||!outputs(from).includes(e.output)||pin.type!==(e.output==='texture'?'texture':'value')||targets.has(key))throw new Error('Connexion incompatible ou entrée déjà occupée.');
      targets.add(key);graph.edges.push({from:e.from,output:e.output,to:e.to,input:e.input});
    }
    const done=new Set(),active=new Set();
    function visit(id){if(active.has(id))throw new Error('Boucle interdite : utilise un nœud Feedback / buffer.');if(done.has(id))return;active.add(id);graph.edges.filter(e=>e.to===id).forEach(e=>visit(e.from));active.delete(id);done.add(id);}
    graph.nodes.forEach(n=>visit(n.id));
    if(raw.flow!==undefined){
      if(!Array.isArray(raw.flow)||raw.flow.length>300)throw new Error('Initialisation importée invalide.');
      const referenced=new Set();let bytes=0;
      graph.flow=raw.flow.map(part=>{
        if(part&&typeof part.text==='string'&&part.node===undefined){bytes+=new TextEncoder().encode(part.text).length;if(bytes>65536||part.text.includes('\0'))throw new Error('Initialisation trop volumineuse.');return {text:part.text};}
        if(part&&typeof part.node==='string'&&part.text===undefined&&/^n[1-9]\d{0,6}$/.test(part.node)&&!referenced.has(part.node)){referenced.add(part.node);const n=byId.get(part.node);if(n&&n.type!=='out')throw new Error('La séquence importée doit référencer une sortie.');return {node:part.node};}
        throw new Error('Séquence importée invalide.');
      });
    }
    if(raw.view&&[raw.view.x,raw.view.y,raw.view.zoom].every(Number.isFinite))graph.view={x:Math.max(-100000,Math.min(100000,raw.view.x)),y:Math.max(-100000,Math.min(100000,raw.view.y)),zoom:Math.max(.2,Math.min(2.5,raw.view.zoom))};
    return graph;
  }
  function compile(raw){
    const graph=validate(raw),byId=new Map(graph.nodes.map(n=>[n.id,n])),used=new Set(),vars=new Map(),images=new Set();let audio=false;
    const incoming=(id,input)=>graph.edges.find(e=>e.to===id&&e.input===input);
    const variable=(n,axis)=>'D_'+n.id+(axis?'_'+axis:'');
    function signal(n,output){used.add(n.id);const p=n.params;
      if(n.type==='fft'){audio=true;return '('+p.offset+' + '+p.gain+' * Math.max(0, Math.min(1, a.fft['+p.band+'] || 0)))';}
      if(n.type==='valueCode')return p.code;
      if(n.type==='amplitude'){audio=true;return '('+p.offset+' + '+p.gain+' * ([0,1,2,3,4,5].reduce((sum, i) => sum + Math.max(0, Math.min(1, a.fft[i] || 0)), 0) / 6))';}
      if(n.type==='lfo')return '('+p.offset+' + '+p.gain+' * Math.sin(time * Math.PI * 2 * '+p.frequency+'))';
      if(n.type==='beat')return '('+p.offset+' + '+p.gain+' * Math.sin(time * Math.PI * 2 * '+p.bpm+' / 60 / '+p.beats+'))';
      if(n.type==='xy'){
        for(const axis of ['x','y'])vars.set(variable(n,axis),'var '+variable(n,axis)+' = H(slider('+[p[axis],p.min,p.max,p.step].join(', ')+'))');
        vars.set(variable(n)+'_pad','xyPad('+JSON.stringify('Pad '+n.id)+', '+variable(n,'x')+', '+variable(n,'y')+')');
        return variable(n,output)+'()';
      }
      vars.set(variable(n),'var '+variable(n)+' = H('+n.type+'('+[p.value,p.min,p.max,p.step].join(', ')+'))');
      return variable(n)+'()';
    }
    const parameter=(n,p)=>{const e=incoming(n.id,'p:'+p.name);if(!e)return String(n.params[p.name]);const source=byId.get(e.from),expression=signal(source,e.output);return source.type==='valueCode'?'('+expression+'\n)':'() => '+expression;};
    function texture(id){const n=byId.get(id),d=def(n.type);used.add(id);
      if(n.type==='buffer')return 'src(o'+n.params.buffer+')';
      if(n.type==='textureCode')return '('+n.params.code+'\n)';
      if(n.type==='image'){if(!n.params.url)throw new Error('Ajoute l’URL de l’image dans '+n.id+'.');images.add(n.params.url);if(images.size>1)throw new Error('Cette version utilise une seule image s0 par patch.');return 'src(s0)';}
      const args=d.params.map(p=>parameter(n,p));
      if(d.kind==='source')return n.type+'('+args.join(', ')+')';
      const a=incoming(id,'a');if(!a)throw new Error('Relie Image A de '+n.type+' ('+id+').');
      if(d.kind==='mix'){const b=incoming(id,'b');if(!b)throw new Error('Relie Image B de '+n.type+' ('+id+').');args.unshift(texture(b.from));}
      return texture(a.from)+'\n  .'+n.type+'('+args.join(', ')+')';
    }
    const outs=graph.nodes.filter(n=>n.type==='out');
    if(!outs.length)throw new Error('Ajoute un nœud Sortie et relie une image.');
    if(new Set(outs.map(n=>n.params.buffer)).size!==outs.length)throw new Error('Deux sorties utilisent le même buffer.');
    if(!graph.flow)outs.sort((a,b)=>a.params.buffer-b.params.buffer);
    const chains=outs.map(n=>{used.add(n.id);const e=incoming(n.id,'a');if(!e)throw new Error('Relie Image A de la sortie '+n.id+'.');return texture(e.from)+'\n  .out(o'+n.params.buffer+')';});
    let body='// Hydra Designer — Pilami\nawait initHydra({ detectAudio: '+audio+' })\n';
    if(audio)body+='a.setBins(6)\na.setSmooth(0.88)\n';
    for(const url of images)body+='await imageSource(s0, '+JSON.stringify(url)+')\n';
    body+=[...vars.values()].join('\n')+'\n\n'+chains.join('\n\n')+'\nrender(o'+outs[0].params.buffer+')\n';
    if(graph.flow){
      const chainMap=new Map(outs.map((n,i)=>[n.id,chains[i]])),raw=graph.flow.filter(p=>p.text!==undefined).map(p=>p.text).join('\n');
      let hasInit=false;
      function walk(n){if(!n||typeof n!=='object')return;if(n.type==='CallExpression'&&n.callee.type==='Identifier'&&n.callee.name==='initHydra')hasInit=true;for(const [k,v] of Object.entries(n)){if(k==='loc')continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}
      walk(g.acorn.parse(raw,{ecmaVersion:'latest',allowAwaitOutsideFunction:true}));
      body='// Hydra Designer — Pilami · preset importé\n';
      if(!hasInit)body+='await initHydra({ detectAudio: '+audio+' })\n';
      let inserted=false;
      const declarations=()=>{
        let text=[...vars.values()].join('\n')+'\n';
        for(const url of images)text+='await imageSource(s0, '+JSON.stringify(url)+')\n';
        if(audio)text+='await window.PilamiStrudelHydra.enableControlAudio(5)\n';
        return text;
      };
      graph.flow.forEach((part,index)=>{
        if(part.text!==undefined){body+='\n// @pilami-section-v1 '+index+'\n'+part.text+'\n// @pilami-endsection-v1 '+index+'\n';}
        else if(chainMap.has(part.node)){if(!inserted){body+=declarations();inserted=true;}body+='\n'+chainMap.get(part.node)+';\n';chainMap.delete(part.node);}
      });
      if(chainMap.size){if(!inserted)body+=declarations();body+='\n'+[...chainMap.values()].join(';\n\n')+';\n';}
      g.acorn.parse(body,{ecmaVersion:'latest',allowAwaitOutsideFunction:true});
    }
    const code=body+'\n// @pilami-designer-v1 '+encodeURIComponent(JSON.stringify(graph))+'\n';
    if(new TextEncoder().encode(code).length>65536)throw new Error('Le patch dépasse 64 Ko. Réduis le nombre de nœuds.');
    return {code,body,graph,unused:graph.nodes.filter(n=>!used.has(n.id)).length};
  }
  function read(code){
    const match=code.match(/\n\/\/ @pilami-designer-v1 ([^\r\n]+)\s*$/);if(!match)return null;
    let graph=validate(JSON.parse(decodeURIComponent(match[1])));
    if(graph.flow){for(const [index,part] of graph.flow.entries()){if(part.text===undefined)continue;const start='\n// @pilami-section-v1 '+index+'\n',end='\n// @pilami-endsection-v1 '+index+'\n',from=code.indexOf(start),to=code.indexOf(end,from+start.length);if(from>=0&&to>from)part.text=code.slice(from+start.length,to);}}
    // Keep slider/XY changes made by the existing Controllers window.
    if(g.acorn){
      const ast=g.acorn.parse(code,{ecmaVersion:'latest',allowAwaitOutsideFunction:true});
      const numeric=n=>n?.type==='Literal'&&typeof n.value==='number'?n.value:n?.type==='UnaryExpression'&&n.operator==='-'&&n.argument.type==='Literal'?-n.argument.value:NaN;
      for(const statement of ast.body){if(statement.type!=='VariableDeclaration')continue;
        for(const v of statement.declarations){const m=v.id.name?.match(/^D_(n\d+)(?:_([xy]))?$/),n=m&&graph.nodes.find(n=>n.id===m[1]);if(!n||!['slider','knob','xy'].includes(n.type))continue;
          const call=v.init?.callee?.name==='H'?v.init.arguments[0]:null;
          if(!call||!['slider','knob'].includes(call.callee?.name)||call.arguments.length!==4)continue;
          const values=call.arguments.map(numeric);if(!values.every(Number.isFinite))continue;
          if(n.type==='xy'){n.params[m[2]]=values[0];}else {n.type=call.callee.name;n.params.value=values[0];}
          [n.params.min,n.params.max,n.params.step]=values.slice(1);
        }
      }
      graph=validate(graph);
    }
    const current=code.slice(0,match.index).trim(),expected=compile(graph).body.trim();
    return {graph,drift:current!==expected};
  }
  function demo(){
    const nodes=[newNode('osc','n1',40,70),newNode('noise','n2',40,400),newNode('modulate','n3',360,95),newNode('color','n4',670,95),newNode('out','n5',980,100),newNode('fft','n6',360,450),newNode('knob','n7',680,430)];
    nodes[0].params={frequency:30,sync:.05,offset:.6};nodes[1].params={scale:3,offset:.15};nodes[3].params={r:1,g:.55,b:.8,a:1};nodes[5].params={band:0,gain:.3,offset:.05};nodes[6].params={value:.8,min:0,max:2,step:.01};
    return validate({version:1,nodes,edges:[{from:'n1',output:'texture',to:'n3',input:'a'},{from:'n2',output:'texture',to:'n3',input:'b'},{from:'n3',output:'texture',to:'n4',input:'a'},{from:'n4',output:'texture',to:'n5',input:'a'},{from:'n6',output:'value',to:'n3',input:'p:amount'},{from:'n7',output:'value',to:'n4',input:'p:b'}]});
  }
  g.PilamiDesignerCore={defs,def,inputs,outputs,newNode,validate,compile,read,demo,clone};
})(typeof window!=='undefined'?window:globalThis);
