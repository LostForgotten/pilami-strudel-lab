import assert from 'node:assert/strict';
import {BowlSimulation} from './scene.mjs';
const a=new BowlSimulation(),b=new BowlSimulation();
a.reset(7,250,1,.48,.8);b.reset(7,250,1,.48,.8);
assert.deepEqual(a.r,b.r);assert.deepEqual(a.p,b.p);
const radii=[...a.r.slice(0,a.n)];assert(Math.min(...radii)<.06&&Math.max(...radii)>.27);
for(let i=0;i<a.n;i++){assert(a.r[i]>=.16*.2-1e-10&&a.r[i]<=.16*1.8+1e-10);assert(Math.abs(a.mass[i]-(.16/a.r[i])**3)<1e-8);}
const config={size:1,sizeVariation:0,stirrer:false,boundary:false,gravity:0,damping:0};
const base=a.base.slice(),hues=a.hue.slice();
for(let i=0;i<120;i++)a.step(1/120,config);
assert.equal(a.n,250);assert.deepEqual(a.base,base);assert.deepEqual(a.hue,hues);
for(const r of a.r.slice(0,a.n))assert(Math.abs(r-.16)<1e-12);
// Size transitions retain a stable target and never jump at slider changes.
const before=a.r[0];a.step(1/120,{...config,sizeVariation:1});assert(Math.abs(a.r[0]-before)<=.24/120+1e-12);
for(let i=0;i<180;i++)a.step(1/120,{...config,sizeVariation:1});
const final=a.r.slice(0,a.n);a.step(1/120,{...config,sizeVariation:1});assert.deepEqual(a.r.slice(0,a.n),final);
a.setCount(280,1,1);assert.equal(a.n,280);for(let i=250;i<280;i++)assert(Math.abs(a.r[i]-a.radiusFor(a.base[i],1,1))<1e-12);
// Different radii collide at the sum of their physical radii. Equal-and-
// opposite impulses conserve linear momentum with inverse volume masses.
const pair=new BowlSimulation();pair.reset(2,2,1,0,0);pair.base.set([.08,.16]);pair.r.set([.08,.16]);pair.mass.set([8,1]);pair.p.set([-.25,1,0,.25,1,0]);pair.v.set([1,0,0,-1,0,0]);
let hit=false;
for(let i=0;i<60;i++){
 pair.step(1/120,{...config,sizeVariation:.16,restitution:.8,friction:0});
 if(pair.contactCount){hit=true;assert(Math.hypot(pair.p[0]-pair.p[3],pair.p[1]-pair.p[4],pair.p[2]-pair.p[5])>=pair.r[0]+pair.r[1]-1e-5);break;}
}
assert(hit);assert(Math.abs(pair.v[0]/8+pair.v[3]+.875)<1e-6);
console.log('PASS 250 deterministic varied radii; live uniform/spread morph; stable samples/hues, append, mass and unequal-size collision');
