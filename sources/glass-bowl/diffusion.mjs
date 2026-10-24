import {glowEnvelope} from './glow.mjs';
export class NeighborLights{
 constructor(){this.stats={sources:0,links:0,candidates:0};}
 build(physics,glow,c,colorFor){
  const result=new Map(),stats=this.stats={sources:0,links:0,candidates:0};
  const range=Math.max(0,c.spillRange??.65),quality=Math.max(0,Math.round(c.spillQuality??4));
  if(!(c.spillEnabled>.5&&c.spillIntensity>0&&range>0&&quality>0&&glow.enabled(c)))return result;
  const sources=[];let maxR=physics.big.r;
  for(let i=0;i<physics.n;i++)maxR=Math.max(maxR,physics.r[i]);
  const cell=Math.max(1e-6,range+2*maxR),grid=new Map(),key=(x,y,z)=>x+','+y+','+z;
  // One finite spherical emitter per genuinely glowing body. Receiver light
  // never becomes a new emitter: no feedback loop or quadratic light bounces.
  for(const[id,spots]of glow.bodies){
   let energy=0;for(const s of spots)energy+=s.level*glowEnvelope(glow.time-s.start,s.duration,s.attack,s.release,s.smooth);
   const radius=id===-2?physics.big.r:physics.r[id];if(!(energy>0&&radius>0)||id>=physics.n)continue;
   const p=id===-2?physics.big.p:physics.p.subarray(id*3,id*3+3),light={id,p:[...p],radius,energy:energy*c.glowIntensity*c.spillIntensity,color:colorFor(id)};
   sources.push(light);const k=key(Math.floor(p[0]/cell),Math.floor(p[1]/cell),Math.floor(p[2]/cell));if(!grid.has(k))grid.set(k,[]);grid.get(k).push(light);
  }
  stats.sources=sources.length;
  for(let i=0;i<=physics.n;i++){
   const id=i===physics.n?-2:i,radius=id===-2?physics.big.r:physics.r[id];if(!(radius>0))continue;
   const p=id===-2?physics.big.p:physics.p.subarray(id*3,id*3+3),x=Math.floor(p[0]/cell),y=Math.floor(p[1]/cell),z=Math.floor(p[2]/cell),best=[];
   for(let dz=-1;dz<=1;dz++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const bucket=grid.get(key(x+dx,y+dy,z+dz));if(!bucket)continue;
    for(const light of bucket){
     if(light.id===id)continue;stats.candidates++;
     const distance=Math.hypot(p[0]-light.p[0],p[1]-light.p[1],p[2]-light.p[2]),gap=Math.max(0,distance-radius-light.radius);
     if(gap>=range)continue;
     const score=light.energy*(1-gap/range)**2/(1+distance*distance/(light.radius*light.radius+.04));
     if(best.length>=quality&&score<=best[best.length-1].score)continue;
     const entry={light,score};let j=best.length;while(j>0&&best[j-1].score<score)j--;best.splice(j,0,entry);if(best.length>quality)best.pop();
    }
   }
   if(best.length){result.set(i,best.map(e=>e.light));stats.links+=best.length;}
  }
  return result;
 }
}
