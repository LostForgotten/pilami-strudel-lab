const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path'),asset=path.join(__dirname,'..','assets','max4live');
// Models the preset lifecycle: one model notification arms cleanup; a later
// model replacement disposes the renderer and loses its owned WebGL context.
const functions={
 changed:'function changed(){if(!armed){armed=true;return;}dispose();}',
 dispose:'function dispose(){if(!alive)return;alive=false;host.removeEventListener("pilami-hydra-controllers-change",changed);gl.getExtension("WEBGL_lose_context").loseContext();}'
};
class Event{constructor(type){this.type=type;}}
class Hub{constructor(){this.listeners=new Map();this.events=[];}addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}dispatchEvent(e){this.events.push(e.type);for(const fn of [...this.listeners.get(e.type)||[]])fn(e);}append(){}}
async function run(reader){
 const host=new Hub(),win=new Hub(),status={},bindings={},out=[],raf=new Map();let id=0;
 const controls=Array.from({length:16},(_,i)=>({label:'Param'+i,id:'c'+i,value:i/20,min:0,max:5,kind:'slider',audio:null}));
 const fixture=`await initHydra();
 var host=document.querySelector('[data-pilami-strudel]'),view=window,_tfHydra=await initHydra(),alive=true,armed=false;
 var texture={},buffer={},program={},api={},_tfBaseClear=function(){},_tfSource={};var down=function(){},move=function(){},up=function(){},blur=function(){};_tfSource._pilamiTourbillons=api;
 var gl={deleteTexture(){},deleteBuffer(){},deleteProgram(){},getExtension(){return {loseContext(){window.lost++;}};}};
 ${functions.changed}\n${functions.dispose}
 host.addEventListener('pilami-hydra-controllers-change',changed);
 window.readers=[${controls.map((c,i)=>'H(__pilamiMaxControl('+i+','+c.value+'))').join(',')}];
 update=function(dt){if(alive)window.ticks++;};window.isAlive=function(){return alive;};`;
 const pack={source:fixture,hasInit:true,selectedControls:controls.map((_,i)=>i),controls,resolution:{width:960,height:540},deviceType:'audio',photos:[]};
 win.max={bindInlet:(key,fn)=>bindings[key]=fn,outlet:(...args)=>out.push(args)};win.ticks=0;win.lost=0;
 class Hydra{constructor(config){win.update=()=>{};this.synth={};this.s=[];this.canvas=new Hub();this.canvas.width=config.width;this.canvas.height=config.height;}setResolution(w,h){this.canvas.width=w;this.canvas.height=h;}tick(dt){this.synth.update?.(dt);}hush(){}}
 const env={window:win,document:{querySelector:q=>q==='[data-max-pack]'?{textContent:JSON.stringify(pack)}:q==='#status'?status:host,createElement:()=>new Hub()},Hydra,Event,console,requestAnimationFrame:fn=>{raf.set(++id,fn);return id;},cancelAnimationFrame:n=>raf.delete(n)};
 vm.createContext(env);vm.runInContext(reader,env);for(let i=0;i<30;i++)await Promise.resolve();assert(win.PilamiMaxWebPlayer.ready,status.textContent);
 let timestamp=0;const frame=()=>{const first=raf.entries().next().value;assert(first);raf.delete(first[0]);timestamp+=33;first[1](timestamp);};
 const state=values=>bindings.pilami_state(1,4,1,0,.1,.2,.3,...values);
 state(controls.map(c=>c.value));frame();
 for(let turn=0;turn<30;turn++)for(let control=0;control<16;control++){
  const values=win.PilamiMaxWebPlayer.controls.map(c=>c.value);values[control]=(turn+1)/10;state(values);frame();
 }
 return {win,host,bindings,frame,out};
}
(async()=>{
 const old=await run(fs.readFileSync(path.join(asset,'web-player-0.39.96.js'),'utf8').replace("if(changed)root.dispatchEvent(new Event('pilami-hydra-parameter-change'))","if(changed)root.dispatchEvent(new Event('pilami-hydra-controllers-change'))"));assert.equal(old.win.lost,1);assert.equal(old.win.isAlive(),false);const frozen=old.win.ticks;old.frame();assert.equal(old.win.ticks,frozen);console.log('Reproduced: regressed reader runs the preset lifecycle callbacks and loses the context after pot changes.');
 const fixed=await run(fs.readFileSync(path.join(asset,'web-player-0.39.96.js'),'utf8'));
 assert.equal(fixed.win.lost,0);assert.equal(fixed.win.isAlive(),true);assert.equal(fixed.host.events.filter(e=>e==='pilami-hydra-controllers-change').length,1);assert.equal(fixed.host.events.filter(e=>e==='pilami-hydra-parameter-change').length,479);
 assert(fixed.win.ticks>480);for(const get of fixed.win.readers)assert.equal(get(),3);
 const before=fixed.win.ticks;fixed.frame();assert(fixed.win.ticks>before);const model=fixed.host._pilamiHydraControls;assert.strictEqual(model.entries,fixed.win.PilamiMaxWebPlayer.controls);
 fixed.host.dispatchEvent(new Event('pilami-hydra-controllers-change'));assert.equal(fixed.win.lost,1);assert.equal(fixed.win.isAlive(),false);
 console.log('Fixed: all 16 controls changed 30 times, rendering and getters continue; one initial model notification, distinct value notifications, explicit cleanup still works.');
})().catch(e=>{console.error(e);process.exit(1)});
