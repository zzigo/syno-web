import {rampValueAt,sliceRamp} from '../core/curves';
import type {Ramp} from '../core/types';
type Plan={at:number;ramp:Ramp;key?:string;sample?:(age:number)=>number};
const plans=new WeakMap<AudioParam,Plan>();let smoothing=0;
/** A scoped policy for hot edits only; ordinary score articulation stays unchanged. */
export function withAutomationSmoothing<T>(seconds:number,apply:()=>T):T {const before=smoothing;smoothing=Math.max(0,seconds);try{return apply();}finally{smoothing=before;}}
export function automationPlan(param:AudioParam){return plans.get(param);}
function schedule(param:AudioParam,ramp:Ramp,at:number){
 param.setValueAtTime(ramp.start,at);
 if(ramp.points){for(const p of ramp.points.slice(1))ramp.step?param.setValueAtTime(p.value,at+p.time):ramp.exponential?param.exponentialRampToValueAtTime(p.value,at+p.time):param.linearRampToValueAtTime(p.value,at+p.time);}
 else if(ramp.duration){if(ramp.exponential)param.exponentialRampToValueAtTime(ramp.end,at+ramp.duration);else param.linearRampToValueAtTime(ramp.end,at+ramp.duration);}
}
export function automate(param:AudioParam,ramp:Ramp,at:number,scale=1){const scaled={...ramp,start:ramp.start*scale,end:ramp.end*scale,points:ramp.points?.map(p=>({time:p.time,value:p.value*scale}))};plans.set(param,{at,ramp:scaled,key:JSON.stringify(scaled)});schedule(param,scaled,at);}
function replace(param:AudioParam,target:Ramp,now:number,key:string){
 const previous=plans.get(param);if(previous?.key===key)return sliceRamp(previous.ramp,Math.max(0,now-previous.at));
 const current=previous?(previous.sample?.(Math.max(0,now-previous.at))??rampValueAt(previous.ramp,Math.max(0,now-previous.at))):param.value;
 if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(now);else param.cancelScheduledValues(now);
 if(!smoothing){plans.set(param,{at:now,ramp:target,key});schedule(param,target,now);return target;}
 // Preserve the audible value when repeated arrow edits interrupt the previous glide.
 const duration=smoothing,points=Array.from({length:33},(_,i)=>{const t=duration*i/32,mix=i/32,next=rampValueAt(target,t);return {time:t,value:current>0&&next>0?current*(next/current)**mix:current+(next-current)*mix};});
 const tail=sliceRamp(target,duration),finish=Math.max(duration,target.duration);
 const remaining=tail.points?.slice(1).map(p=>({time:p.time+duration,value:p.value}))??(target.duration>duration?[{time:target.duration,value:target.end}]:[]);
 const result:Ramp={start:current,end:target.end,duration:finish,points:[...points,...remaining]};
 // Keep exact step articulation after the edit window instead of smearing later cells.
 schedule(param,{start:current,end:points.at(-1)!.value,duration,points},now);schedule(param,tail,now+duration);
 plans.set(param,{at:now,ramp:result,key,sample:t=>t<duration?rampValueAt({start:current,end:points.at(-1)!.value,duration,points},t):rampValueAt(target,t)});return result;
}
export function updateAutomation(param:AudioParam,ramp:Ramp,now:number,age:number,scale=1){const r=sliceRamp(ramp,Math.max(0,age));const whole={...ramp,start:ramp.start*scale,end:ramp.end*scale,points:ramp.points?.map(p=>({time:p.time,value:p.value*scale}))};return replace(param,{...r,start:r.start*scale,end:r.end*scale,points:r.points?.map(p=>({time:p.time,value:p.value*scale}))},now,JSON.stringify(whole));}
export function automateMapped(param:AudioParam,ramp:Ramp,map:(value:number)=>number,now:number,age=0){
 const r=sliceRamp(ramp,Math.max(0,age)),points=r.duration?Array.from({length:65},(_,i)=>({time:r.duration*i/64,value:map(rampValueAt(r,r.duration*i/64))})):undefined;
 return replace(param,{start:map(r.start),end:map(r.end),duration:r.duration,points},now,'mapped:'+JSON.stringify([ramp,map(ramp.start),map(ramp.end)]));
}
