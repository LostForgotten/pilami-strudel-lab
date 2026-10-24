const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=(x,smooth)=>smooth?x*x*(3-2*x):x;
export function glowEnvelope(age,duration,attack,release,smooth=true){
 if(age<0||!(duration>0)||age>=duration)return 0;
 attack=Math.max(0,attack);release=Math.max(0,release);
 const scale=Math.min(1,duration/Math.max(attack+release,1e-12));attack*=scale;release*=scale;
 if(attack>0&&age<attack)return ease(clamp(age/attack,0,1),smooth);
 if(release>0&&age>duration-release)return ease(clamp((duration-age)/release,0,1),smooth);
 return 1;
}
// A spot is stored in body coordinates at the instant of contact. The same
// quaternion that draws the sphere subsequently carries the luminous mark.
export function localDirection(x,y,z,q,offset=0){
 const a=-q[offset],b=-q[offset+1],c=-q[offset+2],w=q[offset+3];
 const tx=2*(b*z-c*y),ty=2*(c*x-a*z),tz=2*(a*y-b*x);
 const dx=x+w*tx+b*tz-c*ty,dy=y+w*ty+c*tx-a*tz,dz=z+w*tz+a*ty-b*tx;
 const length=Math.hypot(dx,dy,dz)||1;return[dx/length,dy/length,dz/length];
}
export class CollisionGlow{
 constructor(){this.time=0;this.bodies=new Map();this.stats={impacts:0,spots:0};this.width=1;this.height=1;this.data=new Float32Array(4);}
 enabled(c){return c.glowEnabled>.5&&c.glowIntensity>0&&c.glowDuration>0&&c.glowSize>0;}
 reset(){this.time=0;this.bodies.clear();this.stats.spots=0;this.data.fill(0);}
 tick(dt,c,physics){
  this.time+=dt;
  if(!this.enabled(c)){this.bodies.clear();return;}
  for(const[id,spots]of this.bodies){
   if(id>=physics.n||id>=0&&!(physics.r[id]>0)||id===-2&&!(physics.big.r>0)){this.bodies.delete(id);continue;}
   const alive=spots.filter(s=>this.time-s.start<s.duration);
   if(alive.length)this.bodies.set(id,alive);else this.bodies.delete(id);
  }
 }
 impact(event,physics,c){
  if(!this.enabled(c))return;
  const dynamics=clamp(c.soundDynamics??.75,0,1),level=(1-dynamics)+dynamics*Math.sqrt(clamp(event.speed/3,0,1));
  const add=(id,sign)=>{
   const q=id===-2?physics.big.q:physics.q,offset=id===-2?0:id*4;
   const dir=localDirection(event.nx*sign,event.ny*sign,event.nz*sign,q,offset);
   const spot={dir,start:this.time,duration:Math.max(0,c.glowDuration),attack:Math.max(0,c.glowAttack??.04),release:Math.max(0,c.glowRelease??.6),smooth:c.glowSmooth!==0,level};
   if(!this.bodies.has(id))this.bodies.set(id,[]);this.bodies.get(id).push(spot);
  };
  add(event.a,-1);if(event.b>=0||event.b===-2)add(event.b,1);this.stats.impacts++;
 }
 pack(physics,maxTextureSize=4096,neighbors=new Map()){
  // Header: one (offset,count) texel per body; following texels contain all
  // live contact spots. No per-body spot cap and no particle-count cap.
  const records=[];let count=physics.n+1;this.stats.spots=0;
  for(const[id,spots]of this.bodies){
   const row=id===-2?physics.n:id;if(row<0||row>=physics.n&&id!==-2)continue;
   const live=spots.map(s=>[s,...s.dir,s.level*glowEnvelope(this.time-s.start,s.duration,s.attack,s.release,s.smooth)]).filter(s=>s[4]>0);
   if(live.length){records.push({row,offset:count,live});count+=live.length;this.stats.spots+=live.length;}
  }
  const lighting=[];for(const[row,lights]of neighbors){if(row<0||row>physics.n||!lights.length)continue;lighting.push({row,offset:count,lights});count+=lights.length*2;}
  const width=Math.min(256,maxTextureSize);let height=this.width===width?this.height:1;
  while(width*height<count)height*=2;
  if(height>maxTextureSize)throw Error('Trop de points lumineux pour cette carte graphique. Réduire Duree_Lueur.');
  if(width!==this.width||height!==this.height){this.width=width;this.height=height;this.data=new Float32Array(width*height*4);}else this.data.fill(0);
  for(const{row,offset,live}of records){this.data[row*4]=offset;this.data[row*4+1]=live.length;for(let i=0;i<live.length;i++)this.data.set(live[i].slice(1),(offset+i)*4);}
  for(const{row,offset,lights}of lighting){this.data[row*4+2]=offset;this.data[row*4+3]=lights.length;for(let i=0;i<lights.length;i++){const l=lights[i];this.data.set([...l.p,l.energy],(offset+i*2)*4);this.data.set([...l.color,l.radius],(offset+i*2+1)*4);}}
  return this;
 }
}
