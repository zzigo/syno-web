/** Same local Kokoro model/PCM path used by the reader. No text is sent to a service. */
export class LyricSpeech {
 private worker?:Worker;private serial=0;
 private cache=new Map<string,{samples:Float32Array;sampleRate:number}>();
 private pending=new Map<number,{resolve:(v:{samples:Float32Array;sampleRate:number})=>void;reject:(e:Error)=>void;report?:(status:string)=>void}>();
 has(text:string){return this.cache.has(text);}
 async synthesize(text:string,report?:(status:string)=>void){
  const cached=this.cache.get(text);if(cached)return cached;
  if(!this.worker){
   this.worker=new Worker(new URL('./lyric-worker.ts',import.meta.url),{type:'module'});
   this.worker.onmessage=({data})=>{const request=this.pending.get(data.id);if(!request)return;if(data.status){request.report?.(data.status);return;}this.pending.delete(data.id);if(data.error)request.reject(new Error(`Voice: ${data.error}`));else request.resolve({samples:data.samples,sampleRate:data.sampleRate});};
   this.worker.onerror=()=>this.cancel('Voice worker could not start.');
  }
  const id=++this.serial;
  const audio=await new Promise<{samples:Float32Array;sampleRate:number}>((resolve,reject)=>{this.pending.set(id,{resolve,reject,report});this.worker!.postMessage({id,text});});
  if(this.cache.size>=24)this.cache.delete(this.cache.keys().next().value!);this.cache.set(text,audio);return audio;
 }
 cancel(message='Voice preparation stopped.'){
  if(!this.pending.size)return;
  this.worker?.terminate();this.worker=undefined;for(const request of this.pending.values())request.reject(new Error(message));this.pending.clear();
 }
 dispose(){this.cancel();this.worker?.terminate();this.worker=undefined;this.cache.clear();}
}
