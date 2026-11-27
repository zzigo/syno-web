/// <reference lib="webworker" />
import {KokoroTTS} from 'kokoro-js';
import {env} from '@huggingface/transformers';
let model:Promise<KokoroTTS>|undefined;
const scope=self as unknown as DedicatedWorkerGlobalScope;
env.allowLocalModels=false;
const wasm=env.backends.onnx.wasm!;
wasm.numThreads=1;wasm.proxy=false;wasm.wasmPaths=new URL('/voice-runtime/',scope.location.origin).href;
let queue=Promise.resolve();
scope.onmessage=({data}:{data:{id:number;text:string}})=>{
 queue=queue.then(async()=>{
  const {id,text}=data;
  try{
   scope.postMessage({id,status:'Voice · loading Kokoro · first use ≈95 MB'});
   model??=KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'wasm',progress_callback:p=>{
    if(p.status==='progress')scope.postMessage({id,status:`Voice · loading ${Math.round(p.progress)}%`});
   }}).catch(error=>{model=undefined;throw error;});
   const tts=await model;scope.postMessage({id,status:'Voice · synthesizing locally'});
   const audio=await tts.generate(text,{voice:'af_heart',speed:1});
   const samples=new Float32Array(audio.audio);
   scope.postMessage({id,samples,sampleRate:audio.sampling_rate},[samples.buffer]);
  }catch(error){scope.postMessage({id,error:error instanceof Error?error.message:String(error)});}
 });
};
