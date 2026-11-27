import {createSpatialPanner} from './spatial';
import type {Speaker,Room} from '../core/spatial';
import {chopClock} from './chop-clock';
import {createEcho} from './delay';
import type {OutputBus,Ramp} from '../core/types';
import {automateMapped,automate,updateAutomation} from './automation';
import {chopCurve,chopPeriod,reverbMix,filterHz} from './effects';
/** Every effect consumes the previous stage, preserving source order. */
function ordinaryBus(ctx:BaseAudioContext,bus:OutputBus,at:number,destination:AudioNode,impulse:(amount:number)=>AudioBuffer){
 const input=ctx.createGain(),volume=ctx.createGain(),nodes:AudioNode[]=[input,volume];let tail:AudioNode=input;
 const clocks:ReturnType<typeof chopClock>[]=[];
 const updates:((value:Ramp,now:number,age:number)=>void)[]=[];const stops:AudioBufferSourceNode[]=[];
 for(const effect of bus.effects){
  const ramp=effect.ramp??{start:effect.value,end:effect.value,duration:0};
  if(effect.kind==='reverb'){
   const dry=ctx.createGain(),wet=ctx.createGain(),sum=ctx.createGain(),reverb=ctx.createConvolver();nodes.push(dry,wet,sum,reverb);
   tail.connect(dry).connect(sum);tail.connect(reverb).connect(wet).connect(sum);
   const update=(value:Ramp,now:number,age=0)=>{const peak=Math.max(value.start,value.end);if(peak){const next=impulse(peak);if(reverb.buffer!==next)reverb.buffer=next;}automateMapped(dry.gain,value,v=>reverbMix(v).dry,now,age);automateMapped(wet.gain,value,v=>reverbMix(v).wet,now,age);};
   update(ramp,at);updates.push(update);tail=sum;
  }else if(effect.kind==='volume'){
   const gain=ctx.createGain();nodes.push(gain);tail.connect(gain);tail=gain;
   automate(gain.gain,ramp,at,1/9);updates.push((value,now,age)=>updateAutomation(gain.gain,value,now,age,1/9));
  }else if(effect.kind==='pan'){
   const pan=ctx.createStereoPanner();nodes.push(pan);tail.connect(pan);tail=pan;
   automate(pan.pan,ramp,at);updates.push((value,now,age)=>updateAutomation(pan.pan,value,now,age));
  }else if(effect.kind==='filter'){
   const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.Q.value=.707;nodes.push(filter);tail.connect(filter);tail=filter;
   automateMapped(filter.frequency,ramp,v=>filterHz(v,ctx.sampleRate),at);updates.push((value,now,age)=>automateMapped(filter.frequency,value,v=>filterHz(v,ctx.sampleRate),now,age));
  }else if(effect.kind==='delay'){
   const echo=createEcho(ctx,ramp,at);nodes.push(...echo.nodes);tail.connect(echo.input);tail=echo.output;updates.push((value,now,age)=>echo.update(value,now,age));
  }else{
   const chopper=ctx.createGain(),gate=ctx.createBufferSource(),curve=chopCurve(),buffer=ctx.createBuffer(1,curve.length,ctx.sampleRate);
   nodes.push(chopper,gate);buffer.getChannelData(0).set(curve);gate.buffer=buffer;gate.loop=true;chopper.gain.value=0;
   gate.playbackRate.value=curve.length/(ctx.sampleRate*chopPeriod(ramp.start));
   const clock=chopClock(ramp,at,ctx.sampleRate);clocks.push(clock);
   const update=(value:Ramp,now:number,age=0)=>{const native=automateMapped(gate.playbackRate,value,v=>curve.length/(ctx.sampleRate*chopPeriod(v)),now,age);clock.updateNative(native,now);};
   update(ramp,at);updates.push(update);gate.connect(chopper.gain);tail.connect(chopper);tail=chopper;gate.start(at);gate.stop(at+bus.dur+bus.tail);stops.push(gate);
  }
 }
 tail.connect(volume).connect(destination);automate(volume.gain,bus.volume,at,1/9);
 let disposed=false,current=bus;
 return {input,gateAt(now:number){return clocks.reduce((gain,clock)=>gain*clock.levelAt(now),1);},get end(){return at+current.dur+current.tail;},update(next:OutputBus,now:number){
  if(next.effects.length!==current.effects.length||next.effects.some((e,i)=>e.kind!==current.effects[i].kind))return false;
  next.effects.forEach((e,i)=>updates[i](e.ramp??{start:e.value,end:e.value,duration:0},now,Math.max(0,now-at)));for(const source of stops)source.stop(at+next.dur+next.tail);updateAutomation(volume.gain,next.volume,now,Math.max(0,now-at),1/9);current=next;return true;
 },dispose(){if(disposed)return;disposed=true;for(const node of nodes)node.disconnect();}};
}

/** Spatial buses preserve discrete lanes through effects; pan deliberately gathers a shared emitter. */
export function createOutputBus(ctx:BaseAudioContext,bus:OutputBus,at:number,destination:AudioNode,impulse:(amount:number)=>AudioBuffer,speakers?:Speaker[],room?:Room){
 if(!speakers)return ordinaryBus(ctx,bus,at,destination,impulse);
 const n=speakers.length,input=ctx.createGain();input.channelCount=n;input.channelCountMode='explicit';input.channelInterpretation='discrete';
 const nodes:AudioNode[]=[input],parts:ReturnType<typeof ordinaryBus>[]=[],panners:ReturnType<typeof createSpatialPanner>[]=[];
 let tail:AudioNode=input;
 for(const effect of bus.effects){
  if(effect.kind==='pan'){
   const p=createSpatialPanner(ctx,speakers,effect.spatial,effect.ramp??{start:effect.value,end:effect.value,duration:0},at,bus.dur,n,room);tail.connect(p.input);tail=p.output;panners.push(p);nodes.push(...p.nodes);
  }else{
   const split=ctx.createChannelSplitter(n),merge=ctx.createChannelMerger(n);nodes.push(split,merge);tail.connect(split);
   for(let ch=0;ch<n;ch++){
    const mono=ctx.createGain();mono.channelCount=1;mono.channelCountMode='explicit';nodes.push(mono);mono.connect(merge,0,ch);
    const part=ordinaryBus(ctx,{...bus,effects:[effect],volume:{start:9,end:9,duration:0}},at,mono,impulse);split.connect(part.input,ch);parts.push(part);
   }tail=merge;
  }
 }
 const gain=ctx.createGain();nodes.push(gain);tail.connect(gain).connect(destination);automate(gain.gain,bus.volume,at,1/9);
 let current=bus;
 return {input,get end(){return at+current.dur+current.tail;},gateAt(now:number){return parts.reduce((g,p,i)=>i%n===0?g*p.gateAt(now):g,1);},update(next:OutputBus,now:number){
   if(next.effects.length!==current.effects.length||next.effects.some((e,i)=>e.kind!==current.effects[i].kind))return false;
   let part=0,panner=0;const age=Math.max(0,now-at);
   for(const effect of next.effects){if(effect.kind==='pan')panners[panner++].update(effect.spatial,effect.ramp??{start:effect.value,end:effect.value,duration:0},now,age);
    else for(let ch=0;ch<n;ch++)parts[part++].update({...next,effects:[effect],volume:{start:9,end:9,duration:0}},now);}
   updateAutomation(gain.gain,next.volume,now,age,1/9);current=next;return true;
 },dispose(){parts.forEach(p=>p.dispose());nodes.forEach(node=>node.disconnect());}};
}
