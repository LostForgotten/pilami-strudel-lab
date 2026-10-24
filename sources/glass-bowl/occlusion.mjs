export class LocalOcclusion{
 constructor(){this.width=1;this.height=1;this.data=new Float32Array(4);this.stats={links:0,candidates:0};}
 build(s,c,maxTextureSize=4096){
  const rows=s.n+1,range=Math.max(0,c.aoRange??.4),quality=Math.max(0,Math.round(c.aoQuality??6)),enabled=c.aoEnabled>.5&&c.aoIntensity>0&&range>0&&quality>0;
  const records=[],stats=this.stats={links:0,candidates:0};let count=rows;
  if(enabled){
   let maxR=s.big.r;for(let i=0;i<s.n;i++)maxR=Math.max(maxR,s.r[i]);
   const cell=Math.max(1e-6,range+2*maxR),grid=new Map(),key=(x,y,z)=>x+','+y+','+z,bodies=[];
   for(let i=0;i<rows;i++){
    const radius=i===s.n?s.big.r:s.r[i];if(!(radius>0))continue;
    const p=i===s.n?s.big.p:s.p.subarray(i*3,i*3+3),body={i,p,radius};bodies.push(body);
    const k=key(Math.floor(p[0]/cell),Math.floor(p[1]/cell),Math.floor(p[2]/cell));if(!grid.has(k))grid.set(k,[]);grid.get(k).push(body);
   }
   for(const b of bodies){
    const x=Math.floor(b.p[0]/cell),y=Math.floor(b.p[1]/cell),z=Math.floor(b.p[2]/cell),best=[];
    for(let dz=-1;dz<=1;dz++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const bucket=grid.get(key(x+dx,y+dy,z+dz));if(!bucket)continue;
     for(const other of bucket){
      if(other.i===b.i)continue;stats.candidates++;
      const d=Math.hypot(b.p[0]-other.p[0],b.p[1]-other.p[1],b.p[2]-other.p[2]),gap=Math.max(0,d-b.radius-other.radius);if(gap>=range)continue;
      const score=other.radius*other.radius/Math.max(d*d,1e-12)*(1-gap/range)**2;
      if(best.length>=quality&&score<=best[best.length-1].score)continue;
      let j=best.length;while(j>0&&best[j-1].score<score)j--;best.splice(j,0,{other,score});if(best.length>quality)best.pop();
     }
    }
    if(best.length){records.push({row:b.i,offset:count,best});count+=best.length;stats.links+=best.length;}
   }
  }
  const width=Math.min(256,maxTextureSize);let height=this.width===width?this.height:1;while(width*height<count)height*=2;
  if(height>maxTextureSize)throw Error('Trop de voisins AO pour cette carte graphique. Réduire Qualite_AO.');
  if(width!==this.width||height!==this.height){this.width=width;this.height=height;this.data=new Float32Array(width*height*4);}else this.data.fill(0);
  for(const{row,offset,best}of records){this.data[row*4]=offset;this.data[row*4+1]=best.length;for(let i=0;i<best.length;i++)this.data.set([...best[i].other.p,best[i].other.radius],(offset+i)*4);}
  return this;
 }
}
