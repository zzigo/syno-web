import type {CompiledScore,ScoreSection,Ramp} from './types';
import {sliceRamp} from './curves';
/** Named marks share the compiler's existing scoped ; clock. */
export function scoreSections(score:CompiledScore):ScoreSection[]{const marks=score.sections??[];return marks.length&&marks[0].t>0?[{name:'start',t:0,from:0,to:0},...marks]:marks;}
export function sectionAtTime(score:CompiledScore,time:number){const sections=scoreSections(score);let i=sections.length-1;while(i>=0&&sections[i].t>time+1e-7)i--;return i;}
export function sectionAtCursor(score:CompiledScore,cursor:number){const sections=scoreSections(score);const definition=sections.findIndex(s=>s.definition&&cursor>=s.definition.from&&cursor<s.definition.to);if(definition>=0)return definition;let index=-1;for(let i=0;i<sections.length;i++)if(sections[i].from<=cursor&&(index<0||sections[i].from>=sections[index].from))index=i;return index;}
export function tempoAt(score:CompiledScore,position:number,byCursor=false){return [...(score.tempos??[])].filter(t=>(byCursor?t.from:t.t)<=position).at(-1)?.bpm;}
export function sectionScore(score:CompiledScore,index:number):CompiledScore{
 if(index<0)return {...score,playbackRange:{index:-1,from:0,to:score.duration}};
 const sections=scoreSections(score),section=sections[index];if(!section)throw Error('Section no longer exists.');
 const from=section.t,to=sections.slice(index+1).find(s=>s.t>from)?.t??score.duration,duration=to-from;if(duration<.001)throw Error('This section has no playable duration.');
 const clip=(item:{t:number;dur:number})=>item.t<to&&item.t+item.dur>from;
 const ramps=<T extends object>(item:T,age:number):T=>Object.fromEntries(Object.entries(item).map(([key,value])=>[key,value&&typeof value==='object'&&'start'in value&&'end'in value&&'duration'in value?sliceRamp(value as Ramp,age):value])) as T;
 const events=score.events.filter(clip).map(e=>({...ramps(e,Math.max(0,from-e.t)),t:Math.max(0,e.t-from),dur:Math.min(to,e.t+e.dur)-Math.max(from,e.t),durationRange:undefined,durationChoices:undefined}));
 // Buses/circuits crossing the selected boundary resume with their written controls at that age.
 const outputBuses=score.outputBuses.filter(clip).map(b=>{const age=Math.max(0,from-b.t);return {...ramps(b,age),t:Math.max(0,b.t-from),dur:Math.min(to,b.t+b.dur)-Math.max(from,b.t),effects:b.effects.map(e=>({...e,...(e.ramp?{ramp:sliceRamp(e.ramp,age)}:{})}))};});
 const feedback=score.feedback.filter(clip).map(c=>({...ramps(c,Math.max(0,from-c.t)),t:Math.max(0,c.t-from),dur:Math.min(to,c.t+c.dur)-Math.max(from,c.t)}));
 const buses=new Map(outputBuses.map((b,i)=>[b.id,i])),circuits=new Map(feedback.map((c,i)=>[c.id,i]));
 return {...score,sections:score.sections?.filter(s=>s.t>=from&&s.t<to).map(s=>({...s,t:s.t-from})),events:events.map(e=>({...e,outputBus:e.outputBus===undefined?undefined:buses.get(e.outputBus),feedbackBus:e.feedbackBus===undefined?undefined:circuits.get(e.feedbackBus)})),outputBuses:outputBuses.map((b,i)=>({...b,id:i,parent:b.parent===undefined?undefined:buses.get(b.parent)})),feedback:feedback.map((c,i)=>({...c,id:i,outputBus:c.outputBus===undefined?undefined:buses.get(c.outputBus)})),period:undefined,duration,playbackRange:{index,from,to}};
}
