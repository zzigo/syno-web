import type {Ramp} from '../core/types';
import {rampValueAt,sliceRamp} from '../core/curves';
import {chopCurve,chopPeriod} from './effects';
const curve=chopCurve();
/** Integrate the same piecewise-linear playback rates at native 128-frame quantum boundaries. */
export function chopClock(initial:Ramp,startAt:number,sampleRate=48000){
 let anchor=startAt,phase=0,lastTime=NaN,lastLevel=0;
 let points:{time:number;value:number}[]=[];
 const raw=(ramp:Ramp)=>{points=Array.from({length:ramp.duration?65:1},(_,i)=>({time:ramp.duration*i/64,value:1/chopPeriod(rampValueAt(ramp,ramp.duration*i/64))}));};raw(initial);
 const quantum=128/sampleRate;
 const rateAt=(at:number)=>{const age=Math.max(0,at-anchor);for(let i=1;i<points.length;i++)if(age<points[i].time){const a=points[i-1],b=points[i];return a.value+(b.value-a.value)*(age-a.time)/(b.time-a.time);}return points.at(-1)!.value;};
 const cycles=(now:number)=>{
  if(now<=anchor)return 0;if(points.length===1)return (now-anchor)*points[0].value;
  const first=Math.floor(anchor/quantum+1e-9),firstEnd=Math.min(now,(first+1)*quantum);
  let total=(firstEnd-anchor)*rateAt(first*quantum);if(firstEnd>=now)return total;
  const end=Math.floor(now/quantum+1e-9),begin=first+1;
  for(let i=0;i<points.length-1;i++){
   const a=points[i],b=points[i+1],step=b.time-a.time;if(step<=0)continue;
   const lo=Math.max(begin,Math.ceil((anchor+a.time)/quantum-1e-9)),hi=Math.min(end-1,Math.ceil((anchor+b.time)/quantum-1e-9)-1);
   if(hi<lo)continue;const count=hi-lo+1,slope=(b.value-a.value)/step,sumTimes=quantum*(lo+hi)*count/2;
   total+=quantum*(count*a.value+slope*(sumTimes-count*(anchor+a.time)));
  }
  const last=points.at(-1)!,held=Math.max(begin,Math.ceil((anchor+last.time)/quantum-1e-9));if(end>held)total+=(end-held)*quantum*last.value;
  return total+Math.max(0,now-end*quantum)*rateAt(end*quantum);
 };
 const phaseAt=(now:number)=>phase+cycles(now);
 const reanchor=(now:number)=>{phase=now<startAt?0:phaseAt(now);anchor=Math.max(now,startAt);lastTime=NaN;};
 return {levelAt(now:number){if(now<startAt)return 0;if(now===lastTime)return lastLevel;lastTime=now;const p=((phaseAt(now)%1)+1)%1*curve.length,i=Math.floor(p),f=p-i;return lastLevel=curve[i]+(curve[(i+1)%curve.length]-curve[i])*f;},
 update(next:Ramp,now:number,age:number){reanchor(now);raw(sliceRamp(next,Math.max(0,age)));},
 updateNative(next:Ramp,now:number){reanchor(now);points=(next.points??[{time:0,value:next.start},...(next.duration?[{time:next.duration,value:next.end}]:[])]).map(p=>({time:p.time,value:p.value*sampleRate/curve.length}));}};
}
