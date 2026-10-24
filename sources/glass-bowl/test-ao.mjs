import assert from 'node:assert/strict';
import {LocalOcclusion} from './occlusion.mjs';
import {BowlSimulation} from './scene.mjs';
const s=new BowlSimulation(),ao=new LocalOcclusion();s.reset(7,4,1,0,0);s.r.set([.3,.14,.2,.1]);s.p.set([0,1,0,.42,1,.35,-.5,1,0,10,1,0]);
const c={aoEnabled:1,aoIntensity:1,aoRange:.5,aoQuality:1};
ao.build(s,c,32);assert.equal(ao.data[1],1);assert.equal(ao.data[3*4+1],0);let at=ao.data[0]*4;assert(Math.abs(ao.data[at]+.5)<1e-6);assert(Math.abs(ao.data[at+3]-.2)<1e-6);
ao.build(s,{...c,aoQuality:8},32);assert.equal(ao.data[1],2);assert(ao.stats.links>=4);
for(const patch of[{aoEnabled:0},{aoIntensity:0},{aoRange:0},{aoQuality:0}]){ao.build(s,{...c,...patch},32);assert.equal(ao.stats.links,0);assert(ao.data.every(v=>v===0));}
s.big.r=.25;s.big.p.set([0,1,.55]);ao.build(s,{...c,aoQuality:8},32);assert(ao.data[s.n*4+1]>0);assert.equal(ao.data[1],3);
// Regrowth keeps the required per-body header even when all spheres are zero.
s.setCount(0);s.big.r=0;ao.build(s,c,32);assert.equal(ao.stats.links,0);
s.reset(7,250,1,0,0);for(let i=0;i<250;i++)s.p.set([i*10,1,0],i*3);ao.build(s,c,32);assert.equal(ao.stats.links,0);assert(ao.stats.candidates<1000);assert(ao.height>1);
console.log('PASS strongest angular occluders, variable radii, controls off, mixer, zero bodies and sparse 250-body spatial AO');
