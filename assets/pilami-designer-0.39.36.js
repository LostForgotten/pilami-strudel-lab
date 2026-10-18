(function(){
  'use strict';
  const C=window.PilamiDesignerCore;
  const cssURL=new URL('pilami-designer-0.25.1.css',document.currentScript.src).href;
  const colors={'Sources':'#77ad9c','Transformations':'#779fc4','Couleur':'#bd99bd','Mix':'#c0a479','Modulations':'#a396c8','Sorties':'#a0a9b8','Audio & contrôleurs':'#c093a3'};
  function el(doc,tag,text,attrs={}){const n=doc.createElement(tag);if(text!==null)n.textContent=text;for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
  function mount(root){
    if(root._pilamiDesigner)return root._pilamiDesigner;
    const editor=root.querySelector('[data-hydra-code]'),name=root.querySelector('[data-hydra-name]'),space=root.querySelector('[data-hydra-space]');
    const entry=el(document,'button','◈ Designer',{type:'button','data-designer-open':'','aria-expanded':'false'});
    (space.querySelector('.pilami-detach-bar')||space).append(entry);
    const container=el(document,'section',null,{class:'pilami-designer','aria-label':'Hydra Designer'});container.hidden=true;space.append(container);
    let graph=C.demo(),views=new Set(),visible=false,popup=null,owned=false,drift=false,lastSource='',syncing=false,history=[],future=[],pending=null,dirty=false,timer=null;
    const key='pilami-hydra-designer-v1:'+location.pathname+':'+[...document.querySelectorAll('[data-pilami-strudel]')].indexOf(root);
    function message(text,error=false){for(const v of views){v.status.textContent=text;v.status.classList.toggle('error',error);}}
    function remember(){try{localStorage.setItem(key,JSON.stringify({graph,dirty,source:lastSource}));}catch(_){message('Le brouillon Designer ne peut pas être conservé dans ce navigateur.',true);}}
    function availableGraph(){try{return C.compile(graph);}catch(_){return null;}}
    function syncSource(force=false){
      if(syncing||(!force&&lastSource===editor.value))return;
      const source=editor.value;lastSource=source;
      let patch;
      try{patch=C.read(source);if(patch){graph=patch.graph;owned=true;drift=patch.drift;dirty=false;history=[];future=[];pending=null;drawAll();message(drift?'Le code a été modifié à la main. Le graphe est conservé ; Envoyer le code demande confirmation.':'Graphe restauré avec ce preset. Update lance le visuel.',drift);}}
      catch(error){owned=false;drift=true;message('Graphe illisible : '+error.message,true);return;}
      if(!patch){owned=false;drift=false;drawAll();message('Ce script est en mode Code. Clique sur Importer le code pour retrouver ses nœuds.');}
      remember();
    }
    function push(){history.push(C.clone(graph));if(history.length>60)history.shift();future=[];}
    function mutate(action){
      const previous=C.clone(graph);try{action();graph=C.validate(graph);history.push(previous);if(history.length>60)history.shift();future=[];dirty=true;pending=null;remember();drawAll();if(owned&&!drift)send(false,false);}
      catch(error){graph=previous;drawAll();message(error.message,true);}
    }
    function send(play=false,confirm=true){
      try{
        const result=C.compile(graph);
        if(confirm&&(!owned||drift)&&editor.value.trim()&&editor.value!==result.code&&!window.confirm('Remplacer le code Hydra affiché par ce patch Designer ? Le preset WordPress ne sera modifié qu’à sa sauvegarde.'))return false;
        syncing=true;editor.value=result.code;editor.dispatchEvent(new Event('input',{bubbles:true}));syncing=false;
        lastSource=editor.value;owned=true;drift=false;dirty=false;
        if(!name.value.trim()||name.value==='Ondes colorées'&&!confirm){name.value='Patch Designer';name.dispatchEvent(new Event('input',{bubbles:true}));}
        remember();drawAll();message('Code envoyé à Hydra.'+(result.unused?' '+result.unused+' nœud(s) non relié(s) à une sortie.':'')+(play?'':' Clique sur Update pour l’appliquer.'));
        if(play)root.querySelector('[data-hydra-action="play"]').click();return true;
      }catch(error){syncing=false;message(error.message,true);return false;}
    }
    function add(type){const number=Math.max(0,...graph.nodes.map(n=>Number(n.id.slice(1))))+1;const view=views.values().next().value;const center={x:((view?.canvas.clientWidth||800)/2-graph.view.x)/graph.view.zoom,y:(140-graph.view.y)/graph.view.zoom};mutate(()=>graph.nodes.push(C.newNode(type,'n'+number,center.x,center.y)));}
    function connect(from,to){
      if(!from||!to)return;
      mutate(()=>{graph.edges=graph.edges.filter(e=>!(e.to===to.id&&e.input===to.pin));graph.edges.push({from:from.id,output:from.pin,to:to.id,input:to.pin});});
    }
    function save(action){if(send(false)){root.querySelector('[data-hydra-action="'+action+'"]').click();}}
    function newPatch(demo){if((dirty||graph.nodes.length)&&!window.confirm(demo?'Charger le patch de démonstration dans le Designer ?':'Vider le Designer pour créer un nouveau patch ?'))return;push();graph=demo?C.demo():{version:1,nodes:[],edges:[],view:{x:40,y:40,zoom:1}};owned=false;drift=false;dirty=true;pending=null;remember();drawAll();message(demo?'Démo chargée. Update l’envoie à Hydra et lance le visuel.':'Ajoute une source et une sortie, puis relie leurs ports.');}
    function fit(v){if(!graph.nodes.length)return;const xs=graph.nodes.map(n=>n.x),ys=graph.nodes.map(n=>n.y),left=Math.min(...xs),top=Math.min(...ys),right=Math.max(...xs)+260,bottom=Math.max(...graph.nodes.map(n=>n.y+(v.world.querySelector('[data-pd-node="'+n.id+'"]')?.offsetHeight||Math.max(150,60+C.def(n.type).params.length*33+(['slider','knob'].includes(n.type)?115:0)))));graph.view.zoom=Math.max(.2,Math.min(1.2,(v.canvas.clientWidth-50)/(right-left),(v.canvas.clientHeight-50)/(bottom-top)));graph.view.x=(v.canvas.clientWidth-(right-left)*graph.view.zoom)/2-left*graph.view.zoom;graph.view.y=(v.canvas.clientHeight-(bottom-top)*graph.view.zoom)/2-top*graph.view.zoom;remember();views.forEach(v=>transform(v));}
    const undo=()=>{if(!history.length)return;future.push(C.clone(graph));graph=history.pop();dirty=true;pending=null;remember();drawAll();if(owned&&!drift)send(false,false);};
    const redo=()=>{if(!future.length)return;history.push(C.clone(graph));graph=future.pop();dirty=true;pending=null;remember();drawAll();if(owned&&!drift)send(false,false);};
    function exportJSON(v){try{const valid=C.validate(graph),url=URL.createObjectURL(new Blob([JSON.stringify(valid,null,2)],{type:'application/json'})),a=el(v.doc,'a',null,{href:url,download:'patch-hydra.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){message(error.message,true);}}
    function importJSON(v){v.file.click();}
    function importCurrent(v){
      try{
        const result=window.PilamiDesignerImport.importCode(editor.value);
        if(dirty&&!window.confirm('Remplacer le brouillon Designer par le script Hydra affiché ? Le code et le preset restent inchangés.'))return;
        push();graph=result.graph;owned=false;drift=false;dirty=true;pending=null;lastSource=editor.value;remember();drawAll();fit(v);
        message(result.restored?'Graphe du script restauré.':graph.nodes.length+' nœuds importés · '+result.expressions+' expression(s) · '+result.blocks+' bloc(s) conservé(s). Le code original reste intact jusqu’à Envoyer le code ou Update.');
      }catch(error){message('Import impossible : '+error.message+' Le code et le graphe actuels restent intacts.',true);}
    }
    function openWindow(){
      if(popup&&!popup.closed){popup.focus();return;}
      popup=window.open('','_blank','popup=yes,width=1450,height=900,resizable=yes,scrollbars=yes');
      if(!popup){message('Autorise les fenêtres de pilami.fr pour détacher le Designer.',true);return;}
      const win=popup,doc=win.document;doc.title='Pilami · Hydra Designer';doc.documentElement.lang='fr';doc.head.append(el(doc,'link',null,{rel:'stylesheet',href:cssURL}));doc.body.className='pd-window';window.PilamiShortcuts?.bindDocument(doc,root);window.PilamiStudio?.apply(doc,root);
      const host=el(doc,'section',null,{class:'pilami-designer pd-detached'});doc.body.replaceChildren(host);const v=buildView(host,true);
      mirrorTheme(v);
      container.hidden=true;entry.textContent='◈ Revenir au Designer';
      const finish=()=>{views.delete(v);v.dispose();if(popup===win){popup=null;container.hidden=!visible;entry.textContent='◈ Designer';drawAll();updateActivity();}};
      win.addEventListener('pagehide',finish,{once:true});v.attach.addEventListener('click',()=>win.close());drawAll();updateActivity();requestAnimationFrame(()=>fit(v));
    }
    function transform(v){v.world.style.transform='translate('+graph.view.x+'px,'+graph.view.y+'px) scale('+graph.view.zoom+')';}
    function mirrorTheme(v){if(v.doc===document)return;window.PilamiStudio?.apply(v.doc,root);const style=getComputedStyle(root);for(const property of ['--pilami-panel-bg','--pilami-panel-text','--pilami-editor-bg','--pilami-editor-text']){const value=style.getPropertyValue(property).trim();if(value)v.host.style.setProperty(property,value);}v.doc.documentElement.style.colorScheme=window.PilamiStudio?.theme()||(document.documentElement.getAttribute('data-pilami-theme')==='dark'?'dark':'light');}
    function point(v,event){const r=v.canvas.getBoundingClientRect();return {x:(event.clientX-r.left-graph.view.x)/graph.view.zoom,y:(event.clientY-r.top-graph.view.y)/graph.view.zoom};}
    function socketPoint(v,id,pin,direction){const socket=v.world.querySelector('[data-pd-id="'+id+'"][data-pd-pin="'+pin+'"][data-pd-direction="'+direction+'"]');if(!socket)return null;const r=socket.getBoundingClientRect(),canvas=v.canvas.getBoundingClientRect();return {x:(r.left+r.width/2-canvas.left-graph.view.x)/graph.view.zoom,y:(r.top+r.height/2-canvas.top-graph.view.y)/graph.view.zoom};}
    function path(a,b){const dx=Math.max(70,Math.abs(b.x-a.x)*.45);return 'M '+a.x+' '+a.y+' C '+(a.x+dx)+' '+a.y+' '+(b.x-dx)+' '+b.y+' '+b.x+' '+b.y;}
    function wire(v,a,b,value=false,index=null){const p=v.doc.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',path(a,b));p.setAttribute('class','pd-wire'+(value?' value':'')+(index===null?' pending':''));if(index!==null){p.setAttribute('data-pd-edge',String(index));p.addEventListener('click',()=>mutate(()=>graph.edges.splice(index,1)));}v.wires.append(p);}
    function wires(v,cursor){v.wires.replaceChildren();graph.edges.forEach((e,index)=>{const a=socketPoint(v,e.from,e.output,'out'),b=socketPoint(v,e.to,e.input,'in');if(a&&b)wire(v,a,b,e.output!=='texture',index);});if(pending&&cursor){const a=socketPoint(v,pending.id,pending.pin,'out');if(a)wire(v,a,cursor,pending.pin!=='texture');}}
    function port(v,n,pin,direction){const type=pin==='texture'||pin==='a'||pin==='b'?'texture':'value',p=el(v.doc,'button',null,{type:'button',class:'pd-port '+type,'data-pd-id':n.id,'data-pd-pin':pin,'data-pd-direction':direction,'aria-label':(direction==='out'?'Sortie ':'Entrée ')+pin+' de '+n.type+' '+n.id,title:(direction==='out'?'Relier la sortie':'Relier l’entrée')+' '+pin});
      const connected=graph.edges.some(e=>direction==='out'?e.from===n.id&&e.output===pin:e.to===n.id&&e.input===pin);p.classList.toggle('connected',connected);p.classList.toggle('armed',direction==='out'&&pending?.id===n.id&&pending?.pin===pin);
      if(direction==='out'){
        p.addEventListener('pointerdown',event=>{event.stopPropagation();pending={id:n.id,pin};let moved=false;const start={x:event.clientX,y:event.clientY};
          const move=e=>{if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)moved=true;wires(v,point(v,e));};
          const up=e=>{v.doc.removeEventListener('pointermove',move);v.doc.removeEventListener('pointerup',up);if(moved){const dest=v.doc.elementFromPoint(e.clientX,e.clientY)?.closest('[data-pd-direction="in"]');if(dest)connect(pending,{id:dest.dataset.pdId,pin:dest.dataset.pdPin});else {pending=null;drawAll();}}else drawAll();};v.doc.addEventListener('pointermove',move);v.doc.addEventListener('pointerup',up,{once:true});
        });
        p.addEventListener('click',event=>{if(event.detail===0){pending={id:n.id,pin};drawAll();}});
      }else p.addEventListener('click',event=>{event.stopPropagation();if(pending)connect(pending,{id:n.id,pin});else if(connected)mutate(()=>{graph.edges=graph.edges.filter(e=>!(e.to===n.id&&e.input===pin));});else message('Clique d’abord sur une sortie à droite d’un nœud.');});
      return p;
    }
    function controller(v,n,body){
      const p=n.params,knob=n.type==='knob',wrap=el(v.doc,'div',null,{class:'pd-controller '+(knob?'pd-rotary':'pd-fader')}),control=knob?el(v.doc,'div',null,{class:'pd-dial',role:'slider',tabindex:'0','aria-orientation':'vertical'}):el(v.doc,'input',null,{class:'pd-range',type:'range',min:p.min,max:p.max,step:p.step});
      control.setAttribute('data-pd-control',n.id);control.setAttribute('aria-label',(knob?'Bouton rotatif':'Slider')+' '+n.id);control.title=knob?'Glisse vers le haut ou le bas ; flèches au clavier.':'Glisse le curseur ; flèches au clavier.';
      const readout=el(v.doc,'output',null,{class:'pd-control-value','aria-hidden':'true'}),bounds=el(v.doc,'div',null,{class:'pd-control-bounds'});bounds.append(el(v.doc,'span',String(p.min)),el(v.doc,'span',String(p.max)));
      if(knob){
        const svg=v.doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
        for(const cls of ['pd-dial-track','pd-dial-progress']){const arc=v.doc.createElementNS(svg.namespaceURI,'circle');for(const [key,value] of Object.entries({cx:50,cy:50,r:42,pathLength:100,class:cls}))arc.setAttribute(key,value);svg.append(arc);}control.append(svg,el(v.doc,'span',null,{class:'pd-dial-face','aria-hidden':'true'}),el(v.doc,'span',null,{class:'pd-dial-pointer','aria-hidden':'true'}));
        control.setAttribute('aria-valuemin',p.min);control.setAttribute('aria-valuemax',p.max);
      }
      wrap.append(control,readout,bounds);body.append(wrap);
      const quantize=value=>value<=p.min?p.min:value>=p.max?p.max:Math.max(p.min,Math.min(p.max,Number((p.min+Math.round((value-p.min)/p.step)*p.step).toPrecision(15))));
      const paint=value=>{const ratio=Math.max(0,Math.min(1,(value-p.min)/(p.max-p.min)));readout.textContent=String(value);control.style.setProperty('--pd-position',(ratio*100)+'%');if(knob){control.setAttribute('aria-valuenow',value);control.setAttribute('aria-valuetext',String(value));control.querySelector('.pd-dial-pointer').style.transform='rotate('+(-135+270*ratio)+'deg)';control.querySelector('.pd-dial-progress').setAttribute('stroke-dasharray',(ratio*75)+' 100');}else control.value=value;const field=body.querySelector('[aria-label="'+n.id+' value"]');if(field)field.value=value;};
      const commit=value=>{const focused=v.doc.activeElement===control;if(value!==p.value)mutate(()=>graph.nodes.find(x=>x.id===n.id).params.value=value);if(focused)v.world.querySelector('[data-pd-control="'+n.id+'"]')?.focus({preventScroll:true});};
      paint(p.value);
      control.addEventListener('wheel',event=>event.stopPropagation(),{passive:true});
      if(!knob){control.addEventListener('pointerdown',event=>event.stopPropagation());control.addEventListener('input',()=>paint(control.valueAsNumber));control.addEventListener('change',()=>commit(control.valueAsNumber));return;}
      control.addEventListener('keydown',event=>{let value=Number(control.getAttribute('aria-valuenow'));const increment=p.step*(event.shiftKey?10:1);if(['ArrowUp','ArrowRight'].includes(event.key))value+=increment;else if(['ArrowDown','ArrowLeft'].includes(event.key))value-=increment;else if(event.key==='Home')value=p.min;else if(event.key==='End')value=p.max;else if(event.key==='PageUp')value+=p.step*10;else if(event.key==='PageDown')value-=p.step*10;else return;event.preventDefault();event.stopPropagation();value=quantize(value);paint(value);commit(value);});
      control.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;event.preventDefault();event.stopPropagation();control.focus({preventScroll:true});control.setPointerCapture(event.pointerId);const start=event.clientY,initial=p.value,zoom=graph.view.zoom;let value=initial;
        const move=e=>{value=quantize(initial+(start-e.clientY)/(200*zoom)*(p.max-p.min));paint(value);};
        const finish=e=>{control.removeEventListener('pointermove',move);control.removeEventListener('pointerup',finish);control.removeEventListener('pointercancel',finish);control.removeEventListener('lostpointercapture',finish);if(e.type==='pointerup'){move(e);commit(value);}else paint(initial);};
        control.addEventListener('pointermove',move);control.addEventListener('pointerup',finish);control.addEventListener('pointercancel',finish);control.addEventListener('lostpointercapture',finish);
      });
    }
    function draw(v){
      v.world.querySelectorAll('.pd-node').forEach(n=>n.remove());v.meters=[];
      for(const n of graph.nodes){
        const d=C.def(n.type),card=el(v.doc,'article',null,{class:'pd-node','data-pd-node':n.id});card.style.left=n.x+'px';card.style.top=n.y+'px';card.style.setProperty('--pd-category',colors[d.group]);
        const head=el(v.doc,'div',null,{class:'pd-node-head'}),remove=el(v.doc,'button','×',{type:'button','aria-label':'Supprimer '+n.type+' '+n.id});head.append(el(v.doc,'span',(n.label||d.label||n.type)+' · '+n.id),remove);card.append(head);remove.addEventListener('click',()=>mutate(()=>{graph.nodes=graph.nodes.filter(x=>x.id!==n.id);graph.edges=graph.edges.filter(e=>e.from!==n.id&&e.to!==n.id);}));
        const body=el(v.doc,'div',null,{class:'pd-node-body'});card.append(body);
        C.outputs(n).forEach(pin=>{const row=el(v.doc,'div',null,{class:'pd-row pd-output'});row.append(el(v.doc,'span',pin==='texture'?'Image':pin==='value'?'Valeur':pin.toUpperCase()),port(v,n,pin,'out'));body.append(row);});
        C.inputs(n).filter(p=>p.type==='texture').forEach(p=>{const row=el(v.doc,'div',null,{class:'pd-row'});row.append(port(v,n,p.key,'in'),el(v.doc,'span',p.label,{class:'pd-input-label'}));body.append(row);});
        if(['slider','knob'].includes(n.type))controller(v,n,body);
        for(const p of d.params){
          const row=el(v.doc,'div',null,{class:'pd-row'}),label=el(v.doc,'label',p.code?'Expression JavaScript':p.name),input=p.code?el(v.doc,'textarea',null,{rows:'3',spellcheck:'false','aria-label':n.id+' '+p.name}):el(v.doc,'input',null,{type:p.text?'url':'number','aria-label':n.id+' '+p.name,step:p.step||'any'});input.value=n.params[p.name];if(p.min!==undefined)input.min=p.min;if(p.max!==undefined)input.max=p.max;
          const binding=C.inputs(n).find(x=>x.key==='p:'+p.name);if(binding)row.append(port(v,n,binding.key,'in'));
          const linked=binding&&graph.edges.some(e=>e.to===n.id&&e.input===binding.key);input.disabled=Boolean(linked);if(linked)input.title='Valeur fournie par le câble. Clique le port pour débrancher.';
          label.append(input);if(p.text||p.code){row.style.flexWrap='wrap';input.style.display='block';}else {label.style.display='flex';label.style.alignItems='center';label.style.justifyContent='space-between';label.style.gap='5px';}row.append(label);body.append(row);
          input.addEventListener('change',()=>{const value=p.text||p.code?input.value.trim():input.valueAsNumber;if(!p.text&&!p.code&&!Number.isFinite(value)){input.value=n.params[p.name];return message('Entre un nombre valide.',true);}mutate(()=>graph.nodes.find(x=>x.id===n.id).params[p.name]=value);});
        }
        if(['fft','amplitude'].includes(n.type)){const meter=el(v.doc,'div',null,{class:'pd-meter'});body.prepend(meter);v.meters.push({node:n,element:meter});}
        head.addEventListener('pointerdown',event=>{
          if(event.target.closest('button'))return;event.preventDefault();card.classList.add('selected');const before=C.clone(graph),start=point(v,event),x=n.x,y=n.y;let moved=false;head.setPointerCapture(event.pointerId);
          const move=e=>{const pos=point(v,e);n.x=x+pos.x-start.x;n.y=y+pos.y-start.y;card.style.left=n.x+'px';card.style.top=n.y+'px';moved=true;wires(v);};
          const end=()=>{head.removeEventListener('pointermove',move);head.removeEventListener('pointerup',end);head.removeEventListener('pointercancel',end);if(moved){history.push(before);future=[];dirty=true;remember();drawAll();}else card.classList.remove('selected');};head.addEventListener('pointermove',move);head.addEventListener('pointerup',end,{once:true});head.addEventListener('pointercancel',end,{once:true});
        });v.world.append(card);
      }
      transform(v);wires(v);v.undo.disabled=!history.length;v.redo.disabled=!future.length;
      const result=availableGraph();v.preview.textContent=result?result.body:'Relie une source à une sortie pour générer le code.';v.send.disabled=v.play.disabled=!result;
      v.preserved.hidden=!graph.flow;v.preservedCode.textContent=(graph.flow||[]).filter(p=>p.text!==undefined).map(p=>p.text).join('\n').trim();
      if(result)message((drift?'Code modifié à la main : confirmation avant remplacement. ':owned?'Patch relié au code Hydra. ':'Patch prêt à envoyer. ')+graph.nodes.length+' nœuds · '+graph.edges.length+' câbles'+(result.unused?' · '+result.unused+' nœud(s) inutilisé(s)':'')+(dirty?' · modifications dans le Designer':''),drift);
      else {try{C.compile(graph);}catch(e){message(e.message,true);}}
      v.name.value=name.value;
      for(const [action,mirror] of v.saveButtons){const source=root.querySelector('[data-hydra-action="'+action+'"]');mirror.hidden=source.hidden;mirror.disabled=source.disabled;}
    }
    function viewActive(v){return !v.win.closed&&!v.host.hidden&&v.doc.visibilityState!=='hidden'&&v.doc.hasFocus();}
    function drawAll(){for(const v of views){if(viewActive(v)){draw(v);v.pendingDraw=false;}else v.pendingDraw=true;}}
    function updateActivity(){
      const active=[...views].filter(viewActive);
      for(const v of views){if(active.includes(v)){if(v.pendingDraw){draw(v);v.pendingDraw=false;}if(v.frame===null)v.frame=v.win.requestAnimationFrame(v.meterLoop);}else if(v.frame!==null){v.win.cancelAnimationFrame(v.frame);v.frame=null;}}
      if(active.length){if(timer===null)timer=setInterval(refreshActive,400);}else if(timer!==null){clearInterval(timer);timer=null;}
    }
    function buildView(host,detached=false){
      const doc=host.ownerDocument,win=doc.defaultView,v={doc,win,host,saveButtons:new Map(),meters:[],frame:null};views.add(v);
      const header=el(doc,'header',null);host.append(header);header.append(el(doc,'h3','◈ Hydra Designer · expérimental'));
      const button=(text,action,cls='')=>{const b=el(doc,'button',text,{type:'button',class:cls});b.addEventListener('click',action);header.append(b);return b;};
      button('Importer le code',()=>importCurrent(v),'pd-import');v.send=button('Envoyer le code',()=>send(false),'pd-send');v.play=button('▶ Update',()=>send(true),'pd-play');button('Stop',()=>root.querySelector('[data-hydra-action="stop"]').click());
      v.undo=button('↶',undo);v.undo.title='Annuler';v.redo=button('↷',redo);v.redo.title='Rétablir';button('Cadrer',()=>fit(v));button('Démo',()=>newPatch(true));button('Nouveau',()=>newPatch(false));button('JSON ↓',()=>exportJSON(v));button('JSON ↑',()=>importJSON(v));
      if(detached){v.attach=button('Rattacher',()=>{});button('Plein écran',async()=>{try{if(doc.fullscreenElement)await doc.exitFullscreen();else await host.requestFullscreen();}catch(_){message('Utilise F11 pour le plein écran.');}});}else button('En fenêtre',openWindow);
      const layout=el(doc,'div',null,{class:'pd-layout'}),library=el(doc,'aside',null,{class:'pd-library','aria-label':'Nœuds disponibles'}),main=el(doc,'div',null,{class:'pd-main'});layout.append(library,main);host.append(layout);
      const search=el(doc,'input',null,{type:'search',placeholder:'Chercher un nœud…','aria-label':'Chercher un nœud'});library.append(search);
      for(const group of Object.keys(colors)){
        const details=el(doc,'details',null),summary=el(doc,'summary',group);details.open=['Sources','Audio & contrôleurs','Sorties'].includes(group);details.append(summary);library.append(details);
        for(const [type,d] of Object.entries(C.defs).filter(([,d])=>d.group===group)){const b=el(doc,'button',d.label||type,{type:'button','data-pd-add':type});b.style.setProperty('--pd-category',colors[group]);b.addEventListener('click',()=>add(type));details.append(b);}
      }
      search.addEventListener('input',()=>{const term=search.value.toLowerCase();library.querySelectorAll('details').forEach(d=>{let count=0;d.querySelectorAll('button').forEach(b=>{b.hidden=!b.textContent.toLowerCase().includes(term);if(!b.hidden)count++;});d.hidden=!count;if(term&&count)d.open=true;});});
      v.canvas=el(doc,'div',null,{class:'pd-canvas',tabindex:'0','aria-label':'Graphe : molette pour zoomer, fond pour déplacer'});v.world=el(doc,'div',null,{class:'pd-world'});v.wires=doc.createElementNS('http://www.w3.org/2000/svg','svg');v.wires.setAttribute('class','pd-wires');v.world.append(v.wires);v.canvas.append(v.world);main.append(v.canvas);
      const codeBox=el(doc,'details',null,{class:'pd-code-box'});codeBox.append(el(doc,'summary','Code Hydra généré'));v.preview=el(doc,'pre','');codeBox.append(v.preview);main.append(codeBox);
      v.preserved=el(doc,'details',null,{class:'pd-code-box'});v.preserved.append(el(doc,'summary','Code conservé : initialisation, fonctions et contrôleurs'));v.preservedCode=el(doc,'pre','');v.preserved.append(v.preservedCode);main.append(v.preserved);
      v.status=el(doc,'div','',{class:'pd-status',role:'status','aria-live':'polite'});host.append(v.status);host.append(el(doc,'p','Ports bleus : images. Ports mauves : valeurs. Glisse une sortie vers une entrée, ou clique les deux ports. Clique un câble pour le retirer. Le bouton Update applique les changements.',{class:'pd-help'}));
      v.engineStatus=el(doc,'div','',{class:'pd-status',role:'status','aria-live':'polite'});host.append(v.engineStatus);
      const saveBar=el(doc,'div',null,{class:'pd-save-bar'});v.name=el(doc,'input',null,{type:'text',maxlength:'100',placeholder:'Nom du patch','aria-label':'Nom du patch'});saveBar.append(v.name);
      for(const [action,label] of [['create-preset','Créer un preset WordPress'],['update-preset','Mettre à jour le preset'],['save','Sauvegarder l’essai local']]){const b=el(doc,'button',label,{type:'button','data-pd-save':action});saveBar.append(b);b.addEventListener('click',()=>save(action));v.saveButtons.set(action,b);}host.append(saveBar);v.name.addEventListener('input',()=>{name.value=v.name.value;name.dispatchEvent(new Event('input',{bubbles:true}));});
      v.file=el(doc,'input',null,{type:'file',accept:'.json,application/json',hidden:''});host.append(v.file);v.file.addEventListener('change',async()=>{const file=v.file.files[0];try{if(!file)return;if(file.size>262144)throw new Error('Le graphe JSON dépasse 256 Ko.');const imported=C.validate(JSON.parse(await file.text()));if(!window.confirm('Charger ce graphe dans le Designer ?'))return;push();graph=imported;owned=false;drift=false;dirty=true;remember();drawAll();fit(v);message('Graphe importé. Envoyer le code ou Update pour l’utiliser.');}catch(error){message(error.message,true);}finally{v.file.value='';}});
      v.canvas.addEventListener('wheel',event=>{event.preventDefault();const before=point(v,event),rect=v.canvas.getBoundingClientRect();graph.view.zoom=Math.max(.2,Math.min(2.5,graph.view.zoom*Math.exp(-event.deltaY*.001)));graph.view.x=event.clientX-rect.left-before.x*graph.view.zoom;graph.view.y=event.clientY-rect.top-before.y*graph.view.zoom;remember();views.forEach(transform);},{passive:false});
      v.canvas.addEventListener('pointermove',event=>{if(pending)wires(v,point(v,event));});
      v.canvas.addEventListener('pointerdown',event=>{if(event.target.closest('.pd-node,.pd-wire'))return;if(pending){pending=null;drawAll();return;}event.preventDefault();const start={x:event.clientX,y:event.clientY},view={...graph.view};v.canvas.setPointerCapture(event.pointerId);
        const move=e=>{graph.view.x=view.x+e.clientX-start.x;graph.view.y=view.y+e.clientY-start.y;views.forEach(transform);};const end=()=>{v.canvas.removeEventListener('pointermove',move);v.canvas.removeEventListener('pointerup',end);v.canvas.removeEventListener('pointercancel',end);remember();};v.canvas.addEventListener('pointermove',move);v.canvas.addEventListener('pointerup',end,{once:true});v.canvas.addEventListener('pointercancel',end,{once:true});});
      host.addEventListener('keydown',event=>{if(event.key==='Escape'){pending=null;drawAll();}if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();send(true);}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.target.matches('input')){event.preventDefault();event.shiftKey?redo():undo();}});
      const resize=new ResizeObserver(()=>{if(viewActive(v))wires(v);});resize.observe(v.canvas);
      const meterLoop=()=>{v.frame=null;if(!host.isConnected||!viewActive(v))return;const levels=window.PilamiStrudelHydra?.audio()?.fft||[];for(const m of v.meters){const level=m.node.type==='fft'?(levels[m.node.params.band]||0):[0,1,2,3,4,5].reduce((sum,i)=>sum+(levels[i]||0),0)/6;m.element.style.transform='scaleX('+Math.max(0,Math.min(1,level))+')';}v.frame=win.requestAnimationFrame(meterLoop);};v.meterLoop=meterLoop;
      const activity=()=>{updateActivity();if(viewActive(v))refreshActive();};doc.addEventListener('visibilitychange',activity);win.addEventListener('focus',activity);win.addEventListener('blur',activity);
      v.dispose=()=>{resize.disconnect();if(v.frame!==null)win.cancelAnimationFrame(v.frame);doc.removeEventListener('visibilitychange',activity);win.removeEventListener('focus',activity);win.removeEventListener('blur',activity);};return v;
    }
    let restoreDraft=false;
    try{const stored=JSON.parse(localStorage.getItem(key)||'null');if(stored){graph=C.validate(stored.graph);dirty=Boolean(stored.dirty);restoreDraft=dirty&&stored.source===editor.value;}}catch(_){}
    buildView(container);
    if(restoreDraft){lastSource=editor.value;try{const patch=C.read(editor.value);owned=Boolean(patch);drift=Boolean(patch?.drift);}catch(_){owned=false;}drawAll();message('Dernier brouillon Designer restauré. Envoyer le code ou Update pour l’appliquer.');}
    else syncSource(true);
    entry.addEventListener('click',()=>{if(popup&&!popup.closed){popup.focus();return;}visible=!visible;container.hidden=!visible;entry.setAttribute('aria-expanded',String(visible));if(visible){syncSource();drawAll();const v=[...views][0];requestAnimationFrame(()=>fit(v));}updateActivity();if(visible)refreshActive();});
    // Live slider/morph updates are already applied to Hydra. Visible Designer
    // views catch up through their existing timer; a hidden graph need not redraw.
    editor.addEventListener('input',event=>{if(!syncing&&!event.pilamiHydraLive&&[...views].some(viewActive))syncSource();});root.addEventListener('pilami-hydra-code-change',()=>{if(!syncing&&[...views].some(viewActive))syncSource();});
    function refreshActive(){if(!root.isConnected){clearInterval(timer);views.forEach(v=>v.dispose());return;}const active=[...views].filter(viewActive);if(!active.length){updateActivity();return;}syncSource();for(const v of active){mirrorTheme(v);const engineStatus=root.querySelector('[data-hydra-status]');v.engineStatus.textContent=engineStatus?.textContent||'';v.engineStatus.hidden=!engineStatus?.textContent;v.engineStatus.classList.toggle('error',Boolean(engineStatus?.classList.contains('is-error')));if(v.doc.activeElement!==v.name)v.name.value=name.value;for(const [action,mirror] of v.saveButtons){const source=root.querySelector('[data-hydra-action="'+action+'"]');mirror.hidden=source.hidden;mirror.disabled=source.disabled;}v.play.disabled=!availableGraph()||root.querySelector('[data-hydra-action="play"]').disabled;}}
    updateActivity();
    window.addEventListener('pagehide',()=>{clearInterval(timer);views.forEach(v=>v.dispose());if(popup&&!popup.closed)popup.close();});
    return root._pilamiDesigner={open(){if(!visible)entry.click();},getGraph:()=>C.clone(graph)};
  }
  window.PilamiHydraDesigner={mount};
})();
