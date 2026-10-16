/* Pilami Link bridge 0.39.23: Windows diagnostic, read-only tempo and transport. */
'use strict';
const {WebSocketServer}=require('ws');
const {AbletonLink}=require('@ktamas77/abletonlink');
const HOST='127.0.0.1', PORT=8765;
const link=new AbletonLink(120);
let transportEvent=0,callbackPlaying=null,callbackAvailable=false;
// Link developers recommend enabling the start/stop subgroup before joining.
try { link.enableStartStopSync(true); } catch(e) { console.error('Start/Stop Sync impossible:',e.message); }
try {
  if(typeof link.setStartStopCallback==='function'){
    link.setStartStopCallback(value=>{
      callbackPlaying=Boolean(value); callbackAvailable=true; transportEvent++;
      console.log('Transport reçu de Link (callback) :',callbackPlaying?'PLAY':'STOP');
    });
  }
} catch(e) {console.warn('Callback transport indisponible :',e.message);}
link.enable(true);
const allowed=origin=>{
  if(!origin)return false;
  try{const u=new URL(origin);return (u.protocol==='https:'&&(u.hostname==='pilami.fr'||u.hostname==='www.pilami.fr'))||((u.hostname==='localhost'||u.hostname==='127.0.0.1')&&['http:','https:'].includes(u.protocol));}
  catch(_){return false;}
};
const wss=new WebSocketServer({host:HOST,port:PORT,verifyClient:info=>allowed(info.origin),maxPayload:1024});
wss.on('connection',()=>console.log('Navigateur Pilami connecté au bridge.'));
let previous={bpm:null,peers:null,playing:null};let transportError=null,sampleError=null;
const timer=setInterval(()=>{
  let bpm,beat,phase,phase16,phase32,peers;
  try{
    bpm=Number(link.getTempo());beat=Number(link.getBeat());phase=Number(link.getPhase(4));
    phase16=Number(link.getPhase(16));phase32=Number(link.getPhase(32));peers=Number(link.getNumPeers());
    if(![bpm,beat,phase,phase16,phase32,peers].every(Number.isFinite))throw new Error('Échantillon Link invalide');
    sampleError=null;
  }catch(e){if(sampleError!==e.message){console.error('Erreur lecture horloge:',e.message);sampleError=e.message;}return;}
  let playing=null,enabled=false;
  try{
    enabled=typeof link.isStartStopSyncEnabled==='function'?Boolean(link.isStartStopSyncEnabled()):false;
    if(enabled && typeof link.isPlaying==='function') playing=Boolean(link.isPlaying());
    transportError=null;
  }catch(e){if(transportError!==e.message){console.warn('Erreur lecture transport:',e.message);transportError=e.message;}}
  // Callback is kept as an independent diagnostic, not a replacement for a valid poll.
  if(playing===null && callbackAvailable)playing=callbackPlaying;
  if(previous.bpm===null||Math.abs(bpm-previous.bpm)>=.05||peers!==previous.peers||playing!==previous.playing){
    console.log('LINK :',bpm.toFixed(1),'BPM |',peers,'pair(s) | transport',playing===null?'INCONNU':playing?'PLAY':'STOP','| Start/Stop Sync',enabled?'ON':'OFF');
    previous={bpm,peers,playing};
  }
  const message=JSON.stringify({type:'link-state',bridgeVersion:'0.39.23',bpm,beat,phase,phase16,phase32,peers,playing,startStopSync:enabled,transportEvent});
  for(const client of wss.clients)if(client.readyState===1&&client.bufferedAmount<2048)client.send(message);
},100);
wss.on('listening',()=>console.log('Pilami Link v0.39.23 prêt : ws://'+HOST+':'+PORT+' — Activer LINK + Start/Stop Sync dans Live.'));
wss.on('error',e=>{console.error('ERREUR WEBSOCKET :',e.message);clearInterval(timer);process.exitCode=1;});
process.on('SIGINT',()=>{clearInterval(timer);wss.close();link.enable(false);process.exit(0);});
