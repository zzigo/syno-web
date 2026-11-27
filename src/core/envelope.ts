import type {CompiledScore,NoteEvent} from './types';
import {rampValueAt} from './curves';
export interface EnvelopePoint {time:number;value:number}
/** The same breakpoints drive native gain automation and the cursor preview. */
export function adsrPoints(envelope:string,duration:number):EnvelopePoint[]{
 if(envelope==='off')return [{time:0,value:1},{time:duration,value:1}];
 const [a,d,s,r]=envelope.split('').map(Number),attack=Math.min(duration*.2,.003+a*.015),decay=Math.min(duration*.2,.01+d*.02),release=Math.min(duration*.4,.02+r*.04);
 return [{time:0,value:0},{time:attack,value:1},{time:attack+decay,value:s/9},{time:Math.max(attack+decay,duration-release),value:s/9},{time:duration,value:0}];
}
export function cursorEvent(score:CompiledScore,source:string,cursor:number):NoteEvent|undefined{
 const start=source.lastIndexOf('\n',Math.max(0,cursor-1))+1,end=source.indexOf('\n',cursor),lineEnd=end<0?source.length:end,comment=source.indexOf('#',start);
 if(comment>=start&&comment<=cursor&&comment<lineEnd)return;
 const candidates=score.events.filter(e=>e.from<=cursor&&cursor<=e.to||e.soundRange&&e.soundRange.from<=cursor&&cursor<=e.soundRange.to);
 if(candidates.length)return candidates.sort((a,b)=>(a.soundRange&&a.soundRange.from<=cursor&&cursor<=a.soundRange.to?a.soundRange.to-a.soundRange.from:a.to-a.from)-(b.soundRange&&b.soundRange.from<=cursor&&cursor<=b.soundRange.to?b.soundRange.to-b.soundRange.from:b.to-b.from))[0];
 return score.events.filter(e=>e.from>=start&&e.from<lineEnd&&(!source.slice(e.to,cursor).includes('#'))).sort((a,b)=>Math.min(Math.abs(a.from-cursor),Math.abs(a.to-cursor))-Math.min(Math.abs(b.from-cursor),Math.abs(b.to-cursor)))[0];
}
export function previewEnvelope(event:NoteEvent){
 if(event.envelope!=='off')return adsrPoints(event.envelope,event.dur);
 const times=[0,event.dur,...(event.volume.points?.map(p=>p.time)??[event.volume.duration])].filter(t=>t>=0&&t<=event.dur).sort((a,b)=>a-b);
 const points=[...new Set(times)].map(time=>({time,value:rampValueAt(event.volume,time)}));const peak=Math.max(...points.map(p=>p.value),.000001);
 return points.map(p=>({...p,value:p.value/peak}));
}
