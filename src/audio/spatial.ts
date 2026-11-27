// SPDX-License-Identifier: 0BSD
import {spatialGains,stereoWeights,type Speaker,type SpatialPan,type Room} from '../core/spatial';
import type {Ramp} from '../core/types';
import {updateAutomation} from './automation';
/** Mono emitter -> discrete speaker gains. Position is sampled at 100 Hz then linearly interpolated. */
export function createSpatialPanner(ctx:BaseAudioContext,speakers:Speaker[],spatial:SpatialPan|undefined,pan:Ramp,at:number,duration:number,inputChannels=1,room?:Room){
 const input=ctx.createGain();input.channelCount=inputChannels;input.channelCountMode='explicit';
 const mono=ctx.createGain();mono.channelCount=1;mono.channelCountMode='explicit';
 const output=ctx.createChannelMerger(speakers.length),nodes:AudioNode[]=[input,mono,output];
 if(inputChannels>1){input.channelInterpretation='discrete';const split=ctx.createChannelSplitter(inputChannels);nodes.push(split);input.connect(split);for(let i=0;i<inputChannels;i++)split.connect(mono,i);}else input.connect(mono);
 const gains=speakers.map((_,i)=>{const gain=ctx.createGain();mono.connect(gain);gain.connect(output,0,i);nodes.push(gain);return gain;});
 const update=(next:SpatialPan|undefined,nextPan:Ramp,now:number,age=0)=>{
   const remaining=Math.max(.01,duration-age),count=Math.max(2,Math.ceil(Math.min(remaining,Math.max(nextPan.duration,...(next?.values.map(v=>v.duration)??[]),.01))*100)+1);
   gains.forEach((gain,i)=>{
     const points=Array.from({length:Math.min(24001,count)},(_,j)=>{const time=j/(Math.min(24001,count)-1)*Math.min(remaining,Math.max(nextPan.duration,...(next?.values.map(v=>v.duration)??[]),.01));return {time,value:spatialGains(next,nextPan,age+time,speakers,room)[i]};});
     const r={start:points[0].value,end:points.at(-1)!.value,duration:points.at(-1)!.time,points};
     updateAutomation(gain.gain,r,now,0);
   });
 };
 update(spatial,pan,at);
 return {input,output,nodes,update};
}
export function connectStereoMonitor(ctx:BaseAudioContext,source:AudioNode,speakers:Speaker[],destination:AudioNode){
 const split=ctx.createChannelSplitter(speakers.length),merge=ctx.createChannelMerger(2),nodes:AudioNode[]=[split,merge];
 source.connect(split);stereoWeights(speakers).forEach((weights,i)=>weights.forEach((value,ch)=>{const gain=ctx.createGain();gain.gain.value=value;split.connect(gain,i);gain.connect(merge,0,ch);nodes.push(gain);}));merge.connect(destination);return nodes;
}
