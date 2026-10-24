import assert from 'node:assert/strict';
import {CollisionGlow,glowEnvelope,localDirection} from './glow.mjs';
import {CollisionAudio} from './collisions.mjs';
import {BowlSimulation} from './scene.mjs';
globalThis.document=new EventTarget();globalThis.window=new EventTarget();
const c={soundEnabled:0,soundThreshold:.25,soundSpacing:.045,physicsSpeed:1,glowEnabled:1,glowIntensity:3,glowDuration:1,glowAttack:.2,glowRelease:.4,glowSize:.5,soundDynamics:0};
const g=new CollisionGlow(),s=new BowlSimulation();s.reset(7,2);s.base.set([.16,.16]);s.r.set([.16,.16]);s.mass.set([1,1]);s.p.set([-.4,1,0,.4,1,0]);s.v.set([2,0,0,-2,0,0]);
const sound=new CollisionAudio(()=>c,{root:null,running:()=>true,onImpact:(event,physics,cfg)=>g.impact(event,physics,cfg)});
for(let i=0;i<60;i++){g.tick(1/120,c,s);s.step(1/120,{gravity:0,damping:0,friction:0,restitution:.8,stirrer:false,boundary:false});sound.collect(s,c);sound.flush(c);}
assert.equal(g.stats.impacts,1);assert.equal(sound.pending.size,0);assert.equal(sound.context,null);assert.equal(g.bodies.size,2);
const da=g.bodies.get(0)[0].dir,db=g.bodies.get(1)[0].dir;assert(da[0]>.99&&db[0]<-.99);
assert.equal(glowEnvelope(0,1,.2,.4),0);assert.equal(glowEnvelope(.2,1,.2,.4),1);assert.equal(glowEnvelope(.6,1,.2,.4),1);assert(Math.abs(glowEnvelope(.8,1,.2,.4)-.5)<1e-10);assert.equal(glowEnvelope(1,1,.2,.4),0);
assert(glowEnvelope(.05,1,.2,.4,true)<glowEnvelope(.05,1,.2,.4,false));
assert.equal(glowEnvelope(0,1,0,0),1);assert.equal(glowEnvelope(0,0,0,0),0);
for(let t=0;t<=1;t+=.001)assert(Number.isFinite(glowEnvelope(t,1,2,5)));
const q=[0,Math.SQRT1_2,0,Math.SQRT1_2],local=localDirection(0,0,1,q);assert(Math.abs(local[0]+1)<1e-10&&Math.abs(local[2])<1e-10);
// New events add independent spots rather than replacing an existing fade.
g.reset();g.impact({a:0,b:1,nx:-1,ny:0,nz:0,speed:2},s,c);g.time=.1;g.impact({a:0,b:1,nx:0,ny:1,nz:0,speed:2},s,c);g.time=.3;g.pack(s,32);assert.equal(g.stats.spots,4);assert.equal(g.data[1],2);
g.tick(1.1,c,s);g.pack(s,32);assert.equal(g.stats.spots,0);assert.equal(g.bodies.size,0);
// Body removal drops obsolete spots; mixer uses its own stable key (-2).
g.impact({a:0,b:-2,nx:0,ny:0,nz:1,speed:2},s,c);g.time+=.2;g.pack(s,32);assert.equal(g.data[s.n*4+1],1);s.setCount(1,1);g.tick(0,c,s);g.pack(s,32);assert.equal(g.data[s.n*4+1],1);
g.tick(0,{...c,glowEnabled:0},s);assert.equal(g.bodies.size,0);sound.dispose();
console.log('PASS real collision -> 2 rotating local spots with sound off; no resting retrigger; ease envelope, overlap, expiry, body removal and mixer identity');
