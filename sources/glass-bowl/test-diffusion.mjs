import assert from 'node:assert/strict';
import {NeighborLights} from './diffusion.mjs';
import {CollisionGlow} from './glow.mjs';
import {BowlSimulation} from './scene.mjs';
const s=new BowlSimulation(),g=new CollisionGlow(),l=new NeighborLights();s.reset(7,6,1,0,0);s.r.fill(.16);s.p.set([0,1,0,.4,1,0,.6,1,0,.8,1,0,1,1,0,4,1,0]);
const c={glowEnabled:1,glowIntensity:3,glowDuration:1,glowSize:.55,glowAttack:0,glowRelease:.5,spillEnabled:1,spillIntensity:1,spillRange:1,spillQuality:2,soundDynamics:0};
for(const a of[0,2,3,4])g.impact({a,b:-1,nx:0,ny:0,nz:-1,speed:3},s,c);g.time=.1;
const colors=id=>[1,id/5,0];let map=l.build(s,g,c,colors);
assert(map.get(1).length===2);assert(map.get(1).every(a=>a.id!==1));assert(!map.has(5));assert.equal(l.stats.sources,4);assert(!g.bodies.has(1));
// Check spatial selection against an independent all-source ranking.
const score=id=>{const d=Math.abs(s.p[id*3]-s.p[3]),gap=Math.max(0,d-.32);return 3*(1-gap)**2/(1+d*d/(.16*.16+.04));};
assert.deepEqual(map.get(1).map(a=>a.id),[0,2,3,4].sort((a,b)=>score(b)-score(a)).slice(0,2));
g.pack(s,32,map);assert.equal(g.data[1*4+1],0);assert.equal(g.data[1*4+3],2);const offset=g.data[1*4+2];assert.deepEqual([...g.data.slice((offset+1)*4,(offset+1)*4+3)].map(v=>Math.round(v*10)),[10,4,0]);
assert.equal(l.build(s,g,{...c,spillEnabled:0},colors).size,0);assert.equal(l.build(s,g,{...c,spillRange:0},colors).size,0);assert.equal(l.build(s,g,{...c,spillQuality:0},colors).size,0);
map=l.build(s,g,{...c,spillQuality:8},colors);assert.equal(map.get(1).length,4);
g.time=.9;const fading=l.build(s,g,c,colors).get(1)[0].energy;assert(fading<1);g.time=1.1;assert.equal(l.build(s,g,c,colors).size,0);
// Sparse 250-emitter scene: spatial queries avoid all 62,500 pairs.
s.reset(7,250,1,0,0);g.reset();for(let i=0;i<250;i++){s.p.set([i*10,1,0],i*3);g.impact({a:i,b:-1,nx:0,ny:0,nz:-1,speed:3},s,c);}g.time=.1;
assert.equal(l.build(s,g,c,colors).size,0);assert.equal(l.stats.sources,250);assert(l.stats.candidates<1000);
console.log('PASS nearest strong local lights, range/off/quality, colored texture metadata, shared fade, no secondary emitters and sparse 250-body spatial culling');
