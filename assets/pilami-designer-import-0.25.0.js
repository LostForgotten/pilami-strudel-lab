/* AST import only: the preset is parsed, never evaluated during import. */
(function(g){
  'use strict';
  const C=g.PilamiDesignerCore;
  function importCode(source){
    if(typeof source!=='string'||!source.trim()||source.includes('\0')||new TextEncoder().encode(source).length>65536)throw new Error('Choisis un script Hydra de moins de 64 Ko.');
    const existing=C.read(source);if(existing)return {graph:existing.graph,expressions:0,blocks:0,restored:true};
    const parser=g.acorn;if(!parser)throw new Error('L’analyseur JavaScript est indisponible. Recharge la page.');
    let tree;try{tree=parser.parse(source,{ecmaVersion:'latest',allowAwaitOutsideFunction:true,locations:true});}catch(error){throw new Error('Erreur JavaScript : '+error.message);}
    const graph={version:1,nodes:[],edges:[],flow:[],view:{x:0,y:0,zoom:1}},symbols=new Set(),custom=new Set(),decls=new Map(),rawCache=new Map(),textureCache=new Map();
    let count=0,expressions=0,blocks=0;
    const slice=n=>source.slice(n.start,n.end);
    const method=n=>n?.type==='CallExpression'&&n.callee.type==='MemberExpression'&&!n.callee.computed&&n.callee.property.type==='Identifier'?n.callee.property.name:'';
    const number=n=>n?.type==='Literal'&&typeof n.value==='number'&&Number.isFinite(n.value)?n.value:n?.type==='UnaryExpression'&&['-','+'].includes(n.operator)&&n.argument.type==='Literal'&&typeof n.argument.value==='number'?(n.operator==='-'?-n.argument.value:n.argument.value):null;
    const buffer=n=>n?.type==='Identifier'&&/^o[0-3]$/.test(n.name)?Number(n.name.slice(1)):null;
    const fail=(message,n)=>{throw new Error(message+(n?.loc?' (ligne '+n.loc.start.line+')':''));};
    function walk(n,action){if(!n||typeof n!=='object')return;action(n);for(const [key,v] of Object.entries(n)){if(key==='loc')continue;if(Array.isArray(v))v.forEach(child=>walk(child,action));else if(v&&typeof v==='object')walk(v,action);}}
    for(const statement of tree.body){if(statement.type==='VariableDeclaration')for(const d of statement.declarations)if(d.id.type==='Identifier'){symbols.add(d.id.name);decls.set(d.id.name,d.init);}if(statement.type==='FunctionDeclaration')symbols.add(statement.id.name);}
    walk(tree,n=>{if(n.type==='CallExpression'&&n.callee.type==='Identifier'&&n.callee.name==='setFunction'&&n.arguments[0]?.type==='ObjectExpression'){const field=n.arguments[0].properties.find(p=>!p.computed&&(p.key.name||p.key.value)==='name');if(field?.value.type==='Literal'&&typeof field.value.value==='string')custom.add(field.value.value);}});
    function add(type,params,label){const n=C.newNode(type,'n'+(++count));if(params)Object.assign(n.params,params);if(label)n.label=label;graph.nodes.push(n);if(count>100)fail('Ce preset nécessite plus de 100 nœuds.');return n;}
    const wire=(from,output,to,input)=>graph.edges.push({from:from.id,output,to:to.id,input});
    function rawValue(ast,target,param){
      const code=slice(ast);let n=rawCache.get(code);if(!n){const label=ast.type==='Identifier'?ast.name:code.includes('a.fft')?'Expression audio FFT':ast.type==='ArrayExpression'||code.includes('.smooth(')||code.includes('.fast(')?'Séquence de valeurs':'Expression';n=add('valueCode',{code},label);rawCache.set(code,n);expressions++;}wire(n,'value',target,'p:'+param);
    }
    function argumentsTo(ast,n,offset=0){
      const params=C.def(n.type).params,args=ast.arguments.slice(offset);
      if(args.some(a=>a.type==='SpreadElement'))fail('Les arguments étalés (...) ne peuvent pas être séparés en paramètres.',ast);
      if(args.length>params.length)fail('Trop de paramètres pour '+n.type+'.',ast);
      args.forEach((arg,i)=>{if(arg.type==='Identifier'&&arg.name==='undefined')return;const value=number(arg);if(value!==null)n.params[params[i].name]=value;else rawValue(arg,n,params[i].name);});
    }
    function codeTexture(ast,label){const code=slice(ast);let n=textureCache.get(code);if(!n){n=add('textureCode',{code},label||'Bloc Hydra conservé');textureCache.set(code,n);blocks++;}return n;}
    function texture(ast){
      if(!ast)fail('Source Hydra manquante.');
      if(ast.type==='Identifier'){
        const b=buffer(ast);if(b!==null)return add('buffer',{buffer:b});
        if(/^s[0-3]$/.test(ast.name))return codeTexture(ast,'Source '+ast.name);
        if(symbols.has(ast.name))return codeTexture(ast,'Texture '+ast.name);
        fail('Texture inconnue : '+ast.name+'.',ast);
      }
      if(ast.type!=='CallExpression')fail('Cette source Hydra ne peut pas encore être importée.',ast);
      if(ast.callee.type==='Identifier'){
        const name=ast.callee.name;
        if(Object.hasOwn(C.defs,name)&&C.def(name).kind==='source'&&Object.hasOwn(g.PilamiDesignerCatalog,name)){
          const n=add(name);argumentsTo(ast,n);return n;
        }
        if(name==='src'){
          if(ast.arguments.length!==1)fail('src() attend une source unique.',ast);
          const b=buffer(ast.arguments[0]);if(b!==null)return add('buffer',{buffer:b});
          return codeTexture(ast,'Source '+slice(ast.arguments[0]).slice(0,100));
        }
        if(custom.has(name)||symbols.has(name))return codeTexture(ast,'Générateur '+name);
        fail('Générateur non reconnu : '+name+'. Le script reste disponible dans Code.',ast);
      }
      const name=method(ast);
      if(name==='out')fail('Une sortie imbriquée dans une texture n’est pas importable.',ast);
      if(Object.hasOwn(C.defs,name)&&['effect','mix'].includes(C.def(name).kind)&&Object.hasOwn(g.PilamiDesignerCatalog,name)){
        const a=texture(ast.callee.object),d=C.def(name);
        // Hydra accepts an output buffer directly as a sampler argument.
        const b=d.kind==='mix'?texture(ast.arguments[0]):null,n=add(name);
        wire(a,'texture',n,'a');if(b)wire(b,'texture',n,'b');argumentsTo(ast,n,b?1:0);return n;
      }
      // Keep a custom effect as one explicit block. Validate its root without
      // adding disconnected duplicates of the chain preserved in that block.
      let receiver=ast.callee.object;
      while(receiver?.type==='CallExpression'&&receiver.callee.type==='MemberExpression'){if(method(receiver)==='out')fail('Sortie imbriquée non importable.',receiver);receiver=receiver.callee.object;}
      const known=receiver?.type==='Identifier'&&(buffer(receiver)!==null||/^s[0-3]$/.test(receiver.name)||symbols.has(receiver.name))||receiver?.type==='CallExpression'&&receiver.callee.type==='Identifier'&&(receiver.callee.name==='src'||custom.has(receiver.callee.name)||symbols.has(receiver.callee.name)||Object.hasOwn(g.PilamiDesignerCatalog,receiver.callee.name)&&C.def(receiver.callee.name).kind==='source');
      if(!known)fail('Ce bloc ne commence pas par une source Hydra reconnue.',ast);
      return codeTexture(ast,'Bloc '+(name||'personnalisé'));
    }
    const outputStatements=[];
    function collect(n,ancestors=[]){if(!n||typeof n!=='object')return;
      if(n.type==='ExpressionStatement'&&method(n.expression)==='out'){
        if(ancestors.some(a=>!['Program','BlockStatement','TryStatement','CatchClause'].includes(a.type)))fail('Cette sortie est conditionnelle ou se trouve dans une fonction ou une boucle. Elle doit rester dans Code.',n);
        outputStatements.push(n);
      }
      for(const [key,v] of Object.entries(n)){if(key==='loc')continue;if(Array.isArray(v))v.forEach(child=>collect(child,[...ancestors,n]));else if(v&&typeof v==='object'&&v.type)collect(v,[...ancestors,n]);}
    }
    collect(tree);outputStatements.sort((a,b)=>a.start-b.start);
    if(!outputStatements.length)fail('Aucune chaîne Hydra terminée par .out() n’a été trouvée. Les sorties dans une fonction ou une boucle ne sont pas encore importables.');
    const handled=new Set(outputStatements.map(s=>s.expression));
    walk(tree,n=>{if(method(n)==='out'&&!handled.has(n))fail('Une sortie se trouve dans une fonction, une boucle ou une affectation. Elle ne peut pas être déplacée dans le graphe.',n);});
    // Guard statements that alter the graph conditionally instead of silently
    // dropping or flattening their execution order.
    let previous=0;const destinations=new Set();
    for(const statement of outputStatements){
      const out=statement.expression;if(out.arguments.length>1)fail('out() attend un seul buffer.',out);
      const b=out.arguments.length?buffer(out.arguments[0]):0;if(b===null)fail('La sortie doit utiliser o0, o1, o2 ou o3.',out);
      if(destinations.has(b))fail('Plusieurs chaînes écrivent vers o'+b+'. Garde une seule sortie par buffer avant l’import.',out);destinations.add(b);
      const before=source.slice(previous,statement.start);graph.flow.push({text:before});
      const node=texture(out.callee.object),output=add('out',{buffer:b});wire(node,'texture',output,'a');graph.flow.push({node:output.id});previous=statement.end;
    }
    graph.flow.push({text:source.slice(previous)});
    // Lay out texture chains in columns and scalar expressions under their
    // destinations. Branches get distinct rows; shared values stay single nodes.
    const depths=new Map(),byId=new Map(graph.nodes.map(n=>[n.id,n]));
    function depth(n){if(depths.has(n.id))return depths.get(n.id);const parents=graph.edges.filter(e=>e.to===n.id&&e.output==='texture').map(e=>byId.get(e.from));const value=parents.length?1+Math.max(...parents.map(depth)):0;depths.set(n.id,value);return value;}
    const slots=new Map();graph.nodes.filter(n=>C.def(n.type).kind!=='control').forEach(n=>{const x=depth(n),row=slots.get(x)||0;slots.set(x,row+1);n.x=40+x*310;n.y=50+row*285;});
    const scalarSlots=new Map();graph.nodes.filter(n=>C.def(n.type).kind==='control').forEach(n=>{const target=byId.get(graph.edges.find(e=>e.from===n.id)?.to),column=target?Math.round((target.x-40)/310):0,row=scalarSlots.get(column)||0;scalarSlots.set(column,row+1);n.x=40+column*310;n.y=70+(slots.get(column)||1)*285+row*210;});
    const valid=C.validate(graph);C.compile(valid);return {graph:valid,expressions,blocks,restored:false};
  }
  g.PilamiDesignerImport={importCode};
})(typeof window!=='undefined'?window:globalThis);
