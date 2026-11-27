import type {Ramp} from './types';
export const MAX_TIME_SECONDS=86400;
/** Three timed values mean attack / hold / release. Two-value ramps retain v0>1'4. */
export function intensityContour(values:number[],times:(number|undefined)[]):Ramp {
  if(values.length<2||values.length>16)throw new Error('Intensity contours require 2–16 values.');
  if(values.some(value=>!Number.isFinite(value)))throw new Error('Intensity values must be finite.');
  if(times.some(time=>time!==undefined&&(!Number.isFinite(time)||time<0||time>MAX_TIME_SECONDS)))throw new Error('Contour times must be 0–86400 seconds.');
  const start=values[0],end=values.at(-1)!;
  if(values.length===2&&times[0]===undefined){const duration=times[1]??2;if(!duration)throw new Error('A two-value sweep needs a positive duration.');return {start,end,duration};}
  const points=[{time:0,value:start}];let duration=0;
  const add=(value:number,time:number)=>{duration+=time;points.push({time:duration,value});};
  if(values.length===3){
    const total=times[0]===undefined&&times[1]===undefined?times[2]:undefined;
    add(values[1],total!==undefined?total/2:times[0]??2);
    if(times[1])add(values[1],times[1]!);
    add(values[2],total!==undefined?total/2:times[2]??2);
  }else if(values.length===2){
    add(values[1],times[0]??2);if(times[1])add(values[1],times[1]!);
  }else{
    if(times.slice(0,-1).some(time=>time!==undefined))throw new Error('Long contours accept one final total time; per-phase times use three values.');
    const step=(times.at(-1)??(values.length-1)*2)/(values.length-1);
    for(const value of values.slice(1))add(value,step);
  }
  if(duration<=0||duration>MAX_TIME_SECONDS)throw new Error('Contour duration must be greater than 0 and at most 86400 seconds.');
  return {start,end,duration,points};
}

/** Samples the same piecewise linear automation used by the audio engine. */
export function rampValueAt(ramp:import('./types').Ramp,time:number):number {
  if(time<=0)return ramp.start;
  if(ramp.points){
    let previous=ramp.points[0];
    for(const next of ramp.points.slice(1)){
      if(time<next.time){if(ramp.step)return previous.value;const span=next.time-previous.time;return span>0?(ramp.exponential?previous.value*(next.value/previous.value)**((time-previous.time)/span):previous.value+(next.value-previous.value)*(time-previous.time)/span):next.value;}
      previous=next;
    }
    return previous.value;
  }
  const fraction=ramp.duration>0?Math.min(1,time/ramp.duration):0;
  return ramp.exponential?ramp.start*(ramp.end/ramp.start)**fraction:ramp.start+(ramp.end-ramp.start)*fraction;
}

/** Preserve a curve's elapsed phase when a recurring voice is already in flight. */
export function sliceRamp(ramp:Ramp,age:number):Ramp {
 if(age<=0)return ramp;
 const start=rampValueAt(ramp,age),duration=Math.max(0,ramp.duration-age);
 if(ramp.points)return {start,end:ramp.end,duration,...(ramp.exponential?{exponential:true}:{}),...(ramp.step?{step:true}:{}),points:[{time:0,value:start},...ramp.points.filter(p=>p.time>age).map(p=>({time:p.time-age,value:p.value}))]};
 return {...ramp,start,duration};
}

/** General control path: one final time is a total; intermediate times specify segment lengths. */
export function parameterContour(values:number[],times:(number|undefined)[],reverse=false,exponential=false):Ramp {
 if(values.length<2||values.length>16||values.some(v=>!Number.isFinite(v)))throw Error('Control contours need 2–16 finite values.');
 if(times.some(t=>t!==undefined&&(!Number.isFinite(t)||t<=0||t>MAX_TIME_SECONDS)))throw Error('Contour times must be positive and at most 86400 seconds.');
 if(exponential&&values.some(v=>v<=0))throw Error('Exponential contours need positive values.');
 const totalOnly=times.slice(0,-1).every(t=>t===undefined),total=times.at(-1),points=[{time:0,value:values[0]}];let duration=0;
 for(let i=1;i<values.length;i++){duration+=totalOnly&&total!==undefined?total/(values.length-1):times[i]??2;points.push({time:duration,value:values[i]});}
 if(duration<=0||duration>MAX_TIME_SECONDS)throw Error('Contour duration must be positive and at most 86400 seconds.');
 const ordered=reverse?points.slice().reverse().map(p=>({time:duration-p.time,value:p.value})):points;
 return {start:ordered[0].value,end:ordered.at(-1)!.value,duration,points:ordered,...(exponential?{exponential:true}:{})};
}
export function fitRampDuration(ramp:Ramp,duration:number):Ramp {return {...ramp,duration,...(ramp.points?{points:ramp.points.map(p=>({...p,time:ramp.duration?p.time*duration/ramp.duration:0}))}:{})};}

export function rampPeak(ramp:Ramp){return Math.max(ramp.start,ramp.end,...(ramp.points?.map(p=>p.value)??[]));}
