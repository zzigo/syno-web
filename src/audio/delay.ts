import {rampPeak} from '../core/curves';
import type {Ramp} from '../core/types';
import {automate,updateAutomation} from './automation';
import {echoTail,MAX_DELAY_SECONDS} from './effects';
export function createEcho(ctx:BaseAudioContext,time:Ramp,at:number){
 const input=ctx.createGain(),output=ctx.createGain(),dry=ctx.createGain(),wet=ctx.createGain(),delay=ctx.createDelay(MAX_DELAY_SECONDS+.01),feedback=ctx.createGain();
 const nodes:AudioNode[]=[input,output,dry,wet,delay,feedback];dry.gain.value=.9;wet.gain.value=.45;feedback.gain.value=.38;
 input.connect(dry).connect(output);input.connect(delay).connect(wet).connect(output);delay.connect(feedback).connect(delay);automate(delay.delayTime,time,at);
 return {input,output,nodes,tail:echoTail(rampPeak(time)),update(next:Ramp,now:number,age=0){updateAutomation(delay.delayTime,next,now,age);}};
}
