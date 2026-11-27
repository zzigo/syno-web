// SPDX-License-Identifier: 0BSD
// The unmodified upstream encoders remain separate, replaceable files.
self.onmessage=async ({data})=>{
 try {
  const {format,sampleRate,channels}=data;
  if(channels.length!==2)throw Error('OGG and MP3 export are stereo. Use WAV for discrete spatial channels.');
  let blob;
  if(format==='mp3'){
   const {Mp3Encoder}=await import('./lamejs.js');
   const encoder=new Mp3Encoder(2,sampleRate,192),chunks=[];
   for(let i=0;i<channels[0].length;i+=1152){const pcm=channels.map(c=>Int16Array.from(c.subarray(i,i+1152),v=>Math.round(Math.max(-1,Math.min(1,v))*32767)));const result=encoder.encodeBuffer(pcm[0],pcm[1]);if(result.length)chunks.push(new Uint8Array(result));}
   const last=encoder.flush();if(last.length)chunks.push(new Uint8Array(last));blob=new Blob(chunks,{type:'audio/mpeg'});
  }else if(format==='ogg'){
   self.module={exports:{}};importScripts('./libvorbis.js');const lib=self.module.exports;
   const encoder=lib._encoder_init(2,sampleRate,.5);if(!encoder)throw Error('Vorbis encoder initialization failed.');
   const chunks=[];
   const process=length=>{lib._encoder_process(encoder,length);const count=lib._encoder_data_len(encoder);if(count){const pointer=lib._encoder_transfer_data(encoder);chunks.push(new Uint8Array(lib.HEAPU8.subarray(pointer,pointer+count)));}};
   try{lib._encoder_stream_init(encoder);for(let i=0;i<channels[0].length;i+=4096){const length=Math.min(4096,channels[0].length-i),ptr=lib._encoder_analysis_buffer(encoder,length)>>>2;for(let ch=0;ch<2;ch++)lib.HEAPF32.set(channels[ch].subarray(i,i+length),lib.HEAPU32[ptr+ch]>>>2);process(length);}process(0);blob=new Blob(chunks,{type:'audio/ogg'});}finally{lib._encoder_clear(encoder);}
  }else throw Error('Unsupported codec.');
  self.postMessage({blob});
 }catch(error){self.postMessage({error:String(error)});}
};
