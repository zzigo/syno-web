import type {NoteEvent,Ramp} from './types';
export interface Capsule {lineage:number;generation:number;scale:number;stress:number;mother?:[number,number,number];flight:number}
/** One immutable motif, scaled as a whole inside every detached capsule. */
export function alignApomicticMotif(events:NoteEvent[],instance?:number){
 const cells=events.filter(e=>e.node?.capsule);if(!cells.length)return;
 if(instance!==undefined)for(const e of cells)e.growthInstance=instance;
 // Shared audio graphs retain their own clocks; do not stretch one voice away from its bus.
 if(cells.some(e=>e.outputBus!==undefined||e.feedbackBus!==undefined))return;
 const original=new Map(cells.map(e=>[e,{t:e.t,dur:e.dur}]));
 const onset=(e:NoteEvent)=>original.get(e)!.t-(e.node!.born??0)*Math.max(.06,original.get(e)!.dur*.8);
 const origin=Math.min(...cells.map(onset)),span=Math.max(.06,...cells.map(e=>onset(e)-origin+original.get(e)!.dur));
 const timed=(r:Ramp|undefined,factor:number)=>r?{...r,duration:r.duration*factor,points:r.points?.map(p=>({...p,time:p.time*factor}))}:undefined;
 for(const e of cells){const node=e.node!,c=node.capsule!,factor=c.generation&&instance!==undefined?Math.max(.65,Math.min(1.5,1+c.stress*.3*(node.z-node.x))):1;
  e.t=origin+(node.born??0)*span*.8+(onset(e)-origin)*factor;e.dur=original.get(e)!.dur*factor;
  for(const key of ['freq','volume','pan','filter','delay','modulation','index','chopRamp','reverbRamp','vocoderMix'] as const){const r=timed(e[key],factor);if(r)(e as unknown as Record<string,unknown>)[key]=r;}
 }
}
export const CAPSULE_EDGES=[[0,1],[1,2],[2,0],[0,3],[1,3],[2,3],[0,4],[1,4],[2,4]] as const;
/** Fixed topology: a closed triangular bipyramid; stress changes its embedding only. */
export function capsuleVertices(c:Capsule,x:number,y:number,z:number):[number,number,number][]{
 const vertices:[[number,number,number],[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[1,0,0],[-.5,0,.866],[-.5,0,-.866],[0,1.35,0],[0,-1.35,0]];
 const angle=(x+z)*c.stress*.8,co=Math.cos(angle),si=Math.sin(angle),stretch=1+c.stress*Math.abs(y)*.8;
 return vertices.map(([a,b,d])=>[(a*co-d*si)/Math.sqrt(stretch)+b*c.stress*x*.25,b*stretch,(a*si+d*co)/Math.sqrt(stretch)]);
}
