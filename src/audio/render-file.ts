// SPDX-License-Identifier: 0BSD
export function protectPeak(channels:Float32Array[]){
 let peak=0;for(const c of channels)for(const x of c){if(!Number.isFinite(x))throw Error('Render contains invalid samples; export stopped.');peak=Math.max(peak,Math.abs(x));}
 const gain=peak>.95?.95/peak:1;if(gain<1)for(const c of channels)for(let i=0;i<c.length;i++)c[i]*=gain;
 return {peak,gain};
}
export function encodeWav(channels:Float32Array[],rate:number,channelMask=channels.length===2?3:0){
 const count=channels.length,frames=channels[0]?.length??0;if(count<1||count>32||channels.some(c=>c.length!==frames))throw Error('WAV needs matching 1–32 channel buffers.');
 const bytes=frames*count*3;if(bytes>0xffffffff-68)throw Error('WAV exceeds RIFF size limit.');
 const buffer=new ArrayBuffer(68+bytes+bytes%2),view=new DataView(buffer),text=(at:number,s:string)=>[...s].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
 text(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,40,true);view.setUint16(20,0xfffe,true);view.setUint16(22,count,true);view.setUint32(24,rate,true);view.setUint32(28,rate*count*3,true);view.setUint16(32,count*3,true);view.setUint16(34,24,true);view.setUint16(36,22,true);view.setUint16(38,24,true);view.setUint32(40,channelMask,true);new Uint8Array(buffer,44,16).set([1,0,0,0,0,0,16,0,128,0,0,170,0,56,155,113]);text(60,'data');view.setUint32(64,bytes,true);
 let at=68;for(let i=0;i<frames;i++)for(const channel of channels){const value=channel[i];if(!Number.isFinite(value))throw Error('Invalid WAV sample.');const n=Math.round(Math.max(-1,Math.min(1,value))*8388607);view.setUint8(at++,n&255);view.setUint8(at++,(n>>8)&255);view.setUint8(at++,(n>>16)&255);}
 return new Blob([buffer],{type:'audio/wav'});
}
export function encodeCompressed(channels:Float32Array[],sampleRate:number,format:'ogg'|'mp3',signal:AbortSignal){
 return new Promise<Blob>((resolve,reject)=>{
  const worker=new Worker('/audio-codecs/encode-worker.js');
  const finish=()=>{signal.removeEventListener('abort',abort);worker.terminate();};
  const abort=()=>{finish();reject(Error('Render cancelled.'));};signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}
  worker.onmessage=({data})=>{finish();data.error?reject(Error(data.error)):resolve(data.blob);};worker.onerror=e=>{finish();reject(Error(e.message));};
  worker.postMessage({channels,sampleRate,format},channels.map(c=>c.buffer));
 });
}
export function saveBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
