// SPDX-License-Identifier: 0BSD
import {rampValueAt} from './curves';
import type {NoteEvent,Ramp} from './types';
export type Room=[number,number,number];
export interface Speaker {id:number;x:number;y:number;z:number;role?:string;lfe?:boolean}
export interface SpatialPan {mode:'xyz'|'outputs';values:Ramp[]}
export const DEFAULT_SPEAKERS:Speaker[]=[{id:1,x:-1,y:0,z:-1},{id:2,x:1,y:0,z:-1},{id:3,x:1,y:0,z:1},{id:4,x:-1,y:0,z:1}];
export function validateSpeakers(speakers:Speaker[]){
 if(speakers.length<1||speakers.length>32)throw Error('!spk needs 1–32 speakers.');
 if(new Set(speakers.map(s=>s.id)).size!==speakers.length)throw Error('Speaker IDs must be unique.');
 for(const s of speakers)if(!Number.isInteger(s.id)||s.id<1||![s.x,s.y,s.z].every(v=>Number.isFinite(v)&&Math.abs(v)<=1000))throw Error('Speaker rows are [positive ID x y z], coordinates within ±1000 metres.');
 return speakers;
}
export function roomScale(speakers:Speaker[],room?:Room):Room {const extent=Math.max(1e-3,...speakers.flatMap(s=>[Math.abs(s.x),Math.abs(s.y),Math.abs(s.z)]));return room?room.map(v=>v/2) as Room:[extent,extent,extent];}
export function dbap(point:number[],speakers:Speaker[],room?:Room){
 const scale=Math.max(1e-3,...speakers.flatMap(s=>[Math.abs(s.x),Math.abs(s.y),Math.abs(s.z)]));
 const half=roomScale(speakers,room),p=point.map((v,i)=>v*half[i]),blur=.1*scale;
 const weights=speakers.map(s=>s.lfe?0:1/Math.sqrt((p[0]-s.x)**2+(p[1]-s.y)**2+(p[2]-s.z)**2+blur**2));
 const norm=Math.hypot(...weights);return weights.map(v=>norm?v/norm:0);
}
export function spatialPosition(event:Pick<NoteEvent,'spatial'|'pan'>,age:number):number[]{
 return event.spatial?.mode==='xyz'?event.spatial.values.map(r=>rampValueAt(r,age)):[rampValueAt(event.pan,age),0,0];
}
export function spatialGains(spatial:SpatialPan|undefined,pan:Ramp,age:number,speakers:Speaker[],room?:Room){
 return spatial?.mode==='outputs'?spatial.values.map(r=>rampValueAt(r,age)/9):dbap(spatialPosition({spatial,pan},age),speakers,room);
}
export function stereoWeights(speakers:Speaker[]){
 const max=Math.max(.001,...speakers.map(s=>Math.abs(s.x)));
 // Fixed matrix headroom: coherent signals sent to every speaker cannot overload solely through the fold-down.
 const scale=1/Math.sqrt(speakers.length);
 return speakers.map(s=>{const a=(s.x/max+1)*Math.PI/4;return [Math.cos(a)*scale,Math.sin(a)*scale];});
}
/** A shared outer bus pan overrides placement, using the bus's own clock. */
export function effectiveRouting(score:import('./types').CompiledScore,event:NoteEvent,time:number){
 let spatial=event.spatial,pan=event.pan,age=Math.max(0,time-event.t),id=event.outputBus??(event.feedbackBus===undefined?undefined:score.feedback[event.feedbackBus]?.outputBus),limit=32;
 const offset=event.originId===undefined?0:event.t-(score.events.find(e=>e.id===event.originId)?.t??event.t);
 while(id!==undefined&&limit-->0){const bus=score.outputBuses[id];if(!bus)break;for(const effect of bus.effects)if(effect.kind==='pan'){spatial=effect.spatial;pan=effect.ramp??{start:effect.value,end:effect.value,duration:0};age=Math.max(0,time-bus.t-offset);}id=bus.parent;}
 return {spatial,pan,age};
}
