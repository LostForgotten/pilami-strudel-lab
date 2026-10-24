const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class CollisionAudio {
 constructor(getConfig,{root=document.querySelector('[data-pilami-strudel]'),running=()=>window.PilamiStrudelHydra?.isRunning()??true,onImpact=()=>{}}={}){
  this.onImpact=onImpact;
  this.getConfig=getConfig;this.running=running;this.root=root;this.context=null;this.output=null;this.master=null;this.noise=null;
  this.dead=false;this.primed=false;this.active=new Map();this.recent=new Map();this.pending=new Map();this.voices=[];this.pruned=0;
  this.stats={impacts:0,played:0,lastFrequency:0,lastType:'',state:'off',peakVoices:0};
  this.gesture=()=>this.sync();this.stopEvent=()=>this.silence();this.codeChange=()=>this.dispose();
  this.stopClick=event=>{if(event.target?.closest?.('[data-hydra-action="stop"],[data-window-stop]'))this.silence();};
  this.stopKey=event=>{if(event.altKey&&event.key==='.')this.silence();};
  root?.addEventListener('input',this.gesture);root?.addEventListener('pilami-hydra-code-change',this.codeChange);
  document.addEventListener('click',this.gesture);document.addEventListener('keydown',this.gesture);
  document.addEventListener('click',this.stopClick,true);document.addEventListener('keydown',this.stopKey,true);
  window.addEventListener('pagehide',this.codeChange);window.addEventListener('pilami-hydra-error',this.stopEvent);
 }
 enabled(c){return !this.dead&&c.soundEnabled>.5&&c.soundVolume>0&&c.soundDuration>0&&c.physicsSpeed>0;}
 ensure(){
  if(this.dead)return null;
  if(!this.context){
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){this.stats.state='unsupported';return null;}
   try{
    const ctx=this.context=new Audio({latencyHint:'interactive'}),master=this.master=ctx.createGain(),limit=this.output=ctx.createDynamicsCompressor();
    master.gain.value=0;limit.threshold.value=-12;limit.knee.value=12;limit.ratio.value=12;limit.attack.value=.002;limit.release.value=.08;
    master.connect(limit);limit.connect(ctx.destination);
    this.noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.5),ctx.sampleRate);const data=this.noise.getChannelData(0);let seed=0x13579bdf;
    for(let i=0;i<data.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;data[i]=((seed>>>0)/4294967296)*2-1;}
   }catch(error){this.stats.state='error';console.warn('Son des collisions :',error.message);return null;}
  }
  const ctx=this.context;if(ctx.state==='suspended'&&!this.resuming)this.resuming=ctx.resume().catch(()=>{}).finally(()=>{this.resuming=null;});
  this.stats.state=ctx.state;return ctx;
 }
 sync(){
  if(this.dead)return;
  const c=this.getConfig();if(!this.enabled(c)||!this.running()){this.mute();return;}
  this.ensure();
 }
 separated(s,a,b){
  const r=s.r[a];if(a>=s.n||!(r>0)||b>=s.n||b>=0&&!(s.r[b]>0))return true;
  const k=a*3,x=s.p[k],y=s.p[k+1],z=s.p[k+2],tolerance=Math.max(1e-8,r*.003);let gap;
  if(b>=0)gap=Math.hypot(x-s.p[b*3],y-s.p[b*3+1],z-s.p[b*3+2])-r-s.r[b];
  else if(b===-2)gap=s.big.r>0?Math.hypot(x-s.big.p[0],y-s.big.p[1],z-s.big.p[2])-r-s.big.r:Infinity;
  else if(b===-3)gap=y-r+.11;
  else{const d=Math.hypot(x,y-s.R,z),surfaceY=s.R+s.R*(y-s.R)/(d||1),wall=surfaceY<=s.rim+.001?(s.inside[a]?s.R-r-d:d-s.R-.07-r):Infinity;
   gap=Math.min(wall,Math.hypot(Math.hypot(x,z)-s.rimR,y-s.rim)-r-.035);}
  return gap>tolerance;
 }
 collect(physics,c){
  if(this.dead)return;
  const sound=this.enabled(c),glow=c.glowEnabled>.5&&c.glowIntensity>0&&c.glowDuration>0&&c.glowSize>0;
  if(!sound&&!glow){this.pending.clear();this.active.clear();this.primed=false;return;}
  if(!sound)this.pending.clear();
  const threshold=Math.max(0,c.soundThreshold??.25),spacing=Math.max(0,c.soundSpacing??.045);
  // A solver can omit an exactly tangent contact for a step. Require a real
  // geometric separation before rearming, rather than treating that as a hit.
  for(const[key,[a,b]]of this.active)if(this.separated(physics,a,b))this.active.delete(key);
  for(let i=0;i<physics.contactCount;i++){
   const k=i*7,a=physics.contacts[k],b=physics.contacts[k+1],key=a+':'+b,wasActive=this.active.has(key);this.active.set(key,[a,b]);
   const speed=-physics.contacts[k+5];
   // Contacts retained by the solver are support/rolling contacts, not new
   // impacts. Only an approaching, newly touching pair can trigger a sound.
   if(!this.primed||wasActive||!Number.isFinite(speed)||speed<=threshold||physics.time-(this.recent.get(key)??-Infinity)<spacing)continue;
   const x=b>=0?(physics.p[a*3]+physics.p[b*3])*.5:physics.p[a*3],z=b>=0?(physics.p[a*3+2]+physics.p[b*3+2])*.5:physics.p[a*3+2];
   const event={a,b,speed,x,z,nx:physics.contacts[k+2],ny:physics.contacts[k+3],nz:physics.contacts[k+4]};
   this.onImpact(event,physics,c);
   if(sound&&(!this.pending.has(key)||this.pending.get(key).speed<speed))this.pending.set(key,event);
   this.recent.set(key,physics.time);this.stats.impacts++;
  }
  this.primed=true;
  if(physics.time-this.pruned>2){for(const[key,t]of this.recent)if(physics.time-t>2)this.recent.delete(key);this.pruned=physics.time;}
 }
 heartbeat(c){
  const ctx=this.context;if(!ctx||ctx.state!=='running')return;
  const now=ctx.currentTime,gain=this.master.gain;gain.cancelScheduledValues(now);gain.setValueAtTime(clamp(c.soundVolume??.2,0,1)*.35,now);
  // A stopped Hydra clock cannot leave a long voice ringing indefinitely.
  // No independent render/physics timer is started by this preset.
  gain.setValueAtTime(clamp(c.soundVolume??.2,0,1)*.35,now+.09);gain.linearRampToValueAtTime(0,now+.12);
 }
 playImpact(event,c){
  const ctx=this.context,now=ctx.currentTime,t=now+.002,duration=Math.max(2/ctx.sampleRate,c.soundDuration),voices=Math.max(1,Math.round(c.soundVoices??12));
  while(this.voices.length>=voices)this.release(this.voices[0],now,.003);
  let hash=Math.imul(event.a+1,73856093)^Math.imul(event.b+4,19349663);hash=((hash>>>0)%65536)/65535;
  const frequency=clamp((c.soundFrequency??440)*2**((hash*2-1)*Math.max(0,c.soundVariation??0)),0,ctx.sampleRate*.45),click=c.soundClick>.5;
  const dynamics=clamp(c.soundDynamics??.75,0,1),level=(1-dynamics)+dynamics*Math.sqrt(clamp(event.speed/3,0,1));
  const source=click?ctx.createBufferSource():ctx.createOscillator(),gain=ctx.createGain(),pan=ctx.createStereoPanner();let filter=null;
  if(click){source.buffer=this.noise;source.loop=true;filter=ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=1.6;source.connect(filter);filter.connect(gain);}
  else{source.type='sine';source.frequency.value=frequency;source.connect(gain);}
  const az=c.cameraAngle??0;pan.pan.value=clamp((event.x*Math.cos(az)-event.z*Math.sin(az))/2.6,-1,1)*clamp(c.soundStereo??.6,0,1);
  gain.connect(pan);pan.connect(this.master);const attack=Math.min(.002,duration*.2),peak=Math.max(.0001,level);
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(peak,t+attack);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);gain.gain.linearRampToValueAtTime(0,t+duration+.003);
  const voice={source,gain,pan,filter,end:t+duration+.005};this.voices.push(voice);source.onended=()=>this.clean(voice);source.start(t);source.stop(voice.end);
  this.stats.played++;this.stats.lastFrequency=frequency;this.stats.lastType=click?'click':'sine';this.stats.peakVoices=Math.max(this.stats.peakVoices,this.voices.length);
 }
 clean(v){const i=this.voices.indexOf(v);if(i>=0)this.voices.splice(i,1);for(const node of[v.source,v.gain,v.pan,v.filter])try{node?.disconnect();}catch(_){}v.source.onended=null;}
 release(v,now,fade=0){
  try{v.gain.gain.cancelScheduledValues(now);v.gain.gain.setValueAtTime(v.gain.gain.value,now);v.gain.gain.linearRampToValueAtTime(0,now+fade);v.source.stop(now+fade+.001);}catch(_){}
  // Keep the short stealing fade connected; its onended callback disconnects.
  const i=this.voices.indexOf(v);if(i>=0)this.voices.splice(i,1);
 }
 flush(c){
  if(this.dead)return;
  if(!this.enabled(c)||!this.running()){this.mute();return;}
  const ctx=this.ensure();if(!ctx||ctx.state!=='running'){this.pending.clear();return;}
  this.heartbeat(c);const now=ctx.currentTime;for(const voice of[...this.voices])if(voice.end<=now)this.clean(voice);
  const max=Math.max(1,Math.round(c.soundVoices??12)),events=[...this.pending.values()].sort((a,b)=>b.speed-a.speed).slice(0,max);this.pending.clear();
  for(const event of events)this.playImpact(event,c);
 }
 mute(){
  if(this.dead)return;
  this.pending.clear();
  if(this.context&&this.master){const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.value=0;this.master.gain.setValueAtTime(0,now);for(const v of[...this.voices]){this.release(v,now);this.clean(v);}}
  if(!this.dead)this.stats.state=this.context?.state||'off';
 }
 silence(){this.mute();this.active.clear();this.primed=false;}
 reset(){this.silence();this.recent.clear();this.pruned=0;}
 dispose(){
  if(this.dead)return;this.silence();this.dead=true;this.root?.removeEventListener('input',this.gesture);this.root?.removeEventListener('pilami-hydra-code-change',this.codeChange);
  document.removeEventListener('click',this.gesture);document.removeEventListener('keydown',this.gesture);window.removeEventListener('pagehide',this.codeChange);window.removeEventListener('pilami-hydra-error',this.stopEvent);
  document.removeEventListener('click',this.stopClick,true);document.removeEventListener('keydown',this.stopKey,true);
  try{this.master?.disconnect();this.output?.disconnect();}catch(_){}this.context?.close().catch(()=>{});this.noise=null;this.stats.state='closed';
 }
}
