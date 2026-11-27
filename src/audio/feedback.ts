import {MAX_DELAY_SECONDS} from './effects';
import type {FeedbackCircuit} from '../core/types';
import {filterHz} from './effects';
import {automateMapped,updateAutomation,automate} from './automation';
/** Shared stereo circuit. Output level is outside the return path. No implicit excitation. */
export function createFeedbackCircuit(ctx:BaseAudioContext,circuit:FeedbackCircuit,at:number,destination:AudioNode){
 const nodes:AudioNode[]=[],input=ctx.createGain(),splitter=ctx.createChannelSplitter(2),merger=ctx.createChannelMerger(2),output=ctx.createGain(),gate=ctx.createGain();
 nodes.push(input,splitter,merger,output,gate);input.channelCount=2;input.channelCountMode='explicit';input.connect(splitter);
 const sums=[ctx.createGain(),ctx.createGain()];nodes.push(...sums);
 const end=at+circuit.dur,fade=Math.min(.02,circuit.dur/4);
 gate.gain.setValueAtTime(0,at);gate.gain.linearRampToValueAtTime(1,at+fade);gate.gain.setValueAtTime(1,end-fade);gate.gain.linearRampToValueAtTime(0,end);
 automate(output.gain,circuit.volume,at,.16/9);merger.connect(output).connect(gate).connect(destination);
 const curve=new Float32Array(2049);for(let i=0;i<curve.length;i++)curve[i]=Math.tanh(i/(curve.length-1)*2-1);
 const hot:((next:FeedbackCircuit,now:number,age:number)=>void)[]=[];
 const finish=()=>{let disposed=false;return {input,end,update(next:FeedbackCircuit,now:number){if(!!next.band!==!!circuit.band)return false;const age=Math.max(0,now-at);updateAutomation(output.gain,next.volume,now,age,.16/9);for(const apply of hot)apply(next,now,age);return true;},dispose(){if(disposed)return;disposed=true;for(const node of nodes)node.disconnect();}};};
 if(circuit.band){
  // Two-band topology: sum -> drive -> tanh -> BPF -> return gains -> cross matrix -> delays -> sum.
  const delays=[ctx.createDelay(MAX_DELAY_SECONDS*1.013+.01),ctx.createDelay(MAX_DELAY_SECONDS*1.013+.01)];nodes.push(...delays);
  for(let channel=0;channel<2;channel++){
   const drive=ctx.createGain(),shape=ctx.createWaveShaper(),band=ctx.createBiquadFilter(),dc=ctx.createBiquadFilter(),feedback=ctx.createGain(),same=ctx.createGain(),cross=ctx.createGain();
   nodes.push(drive,shape,band,dc,feedback,same,cross);
   const saturation=new Float32Array(4097);for(let i=0;i<saturation.length;i++)saturation[i]=Math.tanh((i/(saturation.length-1)*2-1)*8);
   automate(drive.gain,circuit.band.drive,at,1/8);shape.curve=saturation;shape.oversample='2x';
   splitter.connect(sums[channel],channel);sums[channel].connect(drive).connect(shape).connect(band).connect(dc).connect(feedback);
   band.type='bandpass';automateMapped(band.Q,circuit.band.rqRamps?.[channel]??{start:circuit.band.rq[channel],end:circuit.band.rq[channel],duration:0},v=>1/v,at);automate(band.frequency,circuit.band.frequency[channel],at);
   dc.type='highpass';dc.frequency.value=20;dc.Q.value=.707;
   automate(feedback.gain,channel===1?circuit.gainRight??circuit.gain:circuit.gain,at);feedback.gain.setValueAtTime(0,end);
   feedback.connect(merger,0,channel);
   same.gain.value=1;automate(cross.gain,circuit.crossRamp??{start:circuit.cross,end:circuit.cross,duration:0},at);
   feedback.connect(same).connect(delays[channel]);feedback.connect(cross).connect(delays[1-channel]);
   automate(delays[channel].delayTime,channel===1?circuit.delayRight??circuit.delay:circuit.delay,at);delays[channel].connect(sums[channel]);
   hot.push((next,now,age)=>{
    updateAutomation(drive.gain,next.band!.drive,now,age,1/8);updateAutomation(band.frequency,next.band!.frequency[channel],now,age);automateMapped(band.Q,next.band!.rqRamps?.[channel]??{start:next.band!.rq[channel],end:next.band!.rq[channel],duration:0},v=>1/v,now,age);
    updateAutomation(feedback.gain,channel===1?next.gainRight??next.gain:next.gain,now,age);feedback.gain.setValueAtTime(0,end);
    updateAutomation(delays[channel].delayTime,channel===1?next.delayRight??next.delay:next.delay,now,age);updateAutomation(cross.gain,next.crossRamp??{start:next.cross,end:next.cross,duration:0},now,age);
   });
  }
  return finish();
 }
 for(let channel=0;channel<2;channel++){
  const delay=ctx.createDelay(MAX_DELAY_SECONDS*1.013+.01),dc=ctx.createBiquadFilter(),filter=ctx.createBiquadFilter(),shape=ctx.createWaveShaper(),feedback=ctx.createGain(),same=ctx.createGain(),cross=ctx.createGain();
  nodes.push(delay,dc,filter,shape,feedback,same,cross);
  splitter.connect(sums[channel],channel);sums[channel].connect(delay).connect(dc).connect(filter).connect(shape);
  automate(delay.delayTime,channel===1?circuit.delayRight??circuit.delay:circuit.delay,at,channel===1&&!circuit.delayRight?1.013:1);
  dc.type='highpass';dc.frequency.value=20;dc.Q.value=.707;
  filter.type='lowpass';filter.Q.value=.707;
  automate(filter.frequency,{start:filterHz(circuit.filter.start,ctx.sampleRate),end:filterHz(circuit.filter.end,ctx.sampleRate),duration:circuit.filter.duration,exponential:true},at);
  shape.curve=curve;shape.oversample='2x';shape.connect(merger,0,channel);
  automate(feedback.gain,channel===1?circuit.gainRight??circuit.gain:circuit.gain,at);feedback.gain.setValueAtTime(0,end);
  shape.connect(feedback);automateMapped(same.gain,circuit.crossRamp??{start:circuit.cross,end:circuit.cross,duration:0},v=>1-v,at);automate(cross.gain,circuit.crossRamp??{start:circuit.cross,end:circuit.cross,duration:0},at);
  feedback.connect(same).connect(sums[channel]);feedback.connect(cross).connect(sums[1-channel]);
  hot.push((next,now,age)=>{
   updateAutomation(delay.delayTime,channel===1?next.delayRight??next.delay:next.delay,now,age,channel===1&&!next.delayRight?1.013:1);
   updateAutomation(filter.frequency,{start:filterHz(next.filter.start,ctx.sampleRate),end:filterHz(next.filter.end,ctx.sampleRate),duration:next.filter.duration,exponential:true},now,age);
   updateAutomation(feedback.gain,channel===1?next.gainRight??next.gain:next.gain,now,age);feedback.gain.setValueAtTime(0,end);automateMapped(same.gain,next.crossRamp??{start:next.cross,end:next.cross,duration:0},v=>1-v,now,age);updateAutomation(cross.gain,next.crossRamp??{start:next.cross,end:next.cross,duration:0},now,age);
  });
 }
 return finish();
}
