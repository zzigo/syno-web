import {lyricRanges} from './lyrics';
import type { NoteEvent, Range } from './types';
export type VisualMode = 'cube' | 'phyllotaxis' | 'lsystem' | 'stocky' | 'spatial' | 'parameters';
export const VIEW_MESSAGES = { cube: '!vc', phyllotaxis: '!vf', lsystem:'!vl',stocky:'!vt',spatial:'!vs',parameters:'!vp' } as const;
export function setViewMessage(source: string, mode: VisualMode, messages: Range[]): string {
  const command=VIEW_MESSAGES[mode];
  if(!messages.length){
    messages=[...source.matchAll(/^[ \t]*(!(?:v[pclsft]|st(?:ocky)?))(?=\s|#|$)/gm)].map(match=>({from:match.index!+match[0].indexOf(match[1]),to:match.index!+match[0].indexOf(match[1])+match[1].length}));
    if(!messages.length)return `${command}\n${source}`;
  }
  let text=source;
  const ordered=[...messages].sort((a,b)=>a.from-b.from);
  for(let i=ordered.length-1;i>=0;i--){const range=ordered[i];text=text.slice(0,range.from)+(i===0?command:'')+text.slice(range.to);}
  return text;
}
export function musicalCanonical(canonical:string){let text='',at=0;const strip=(part:string)=>part.replace(/(?:^|\s)!(?:v[pclsft]|st(?:ocky)?)(?=\s|$)/g,' ');for(const range of lyricRanges(canonical)){text+=strip(canonical.slice(at,range.from))+canonical.slice(range.from,range.to);at=range.to;}text=(text+strip(canonical.slice(at))).trim();return /!sx(?:\s|$)/.test(text)?text:text.replace(/\s+/g,' ');}
export interface VisualPoint { event:NoteEvent; id:string; parent:string|null; x:number; y:number; z:number; progress:number }
const GOLDEN=Math.PI*(3-Math.sqrt(5));
export function layoutEvents(events:NoteEvent[],mode:VisualMode):VisualPoint[]{
  const pitches=events.filter(e=>e.wave!=='n').map(e=>Math.log2(Math.max(20,e.freq.start)));
  const lo=Math.min(...pitches),hi=Math.max(...pitches);
  const instances=[...new Set(events.flatMap(event=>event.growthInstance===undefined?[]:[event.growthInstance]))];
  return events.map((event,index)=>{
    const progress=events.length>1?index/(events.length-1):.5;
    if(event.sequence?.mode==='spatial'){
      const rows=[...new Set(events.filter(e=>e.sequence?.mode==='spatial').map(e=>e.from))],row=rows.indexOf(event.from),column=event.sequence.slot??0;
      return {event,id:String(event.id),parent:null,x:-.9+1.8*column/Math.max(1,event.sequence.length-1),y:rows.length>1?.7-1.4*row/(rows.length-1):0,z:0,progress};
    }
    if(mode==='phyllotaxis'){
      // Display layout, not a new sound generator: pitch stays vertical;
      // event order supplies golden-angle divergence; pitch height tapers the form.
      const y=(event.wave==='n'||event.wave==='i')||!Number.isFinite(lo)||hi===lo?0:((Math.log2(Math.max(20,event.freq.start))-lo)/(hi-lo)*2-1)*.88;
      const height=(y/.88+1)/2;
      const radius=.1+.7*Math.sqrt(Math.max(0,Math.min(1,height))),angle=index*GOLDEN;
      return {event,id:String(event.id),parent:null,x:Math.cos(angle)*radius,y,z:Math.sin(angle)*radius,progress};
    }
    const node=event.node;const prefix=event.growthInstance!==undefined?`g:${event.growthInstance}`:event.lSegment!==undefined?`l:${event.lSystemIndex}`:String(event.from);
    let position=node?{x:node.x,y:node.y,z:node.z}:undefined;
    if(position&&event.growthInstance!==undefined&&instances.length>1){
      const group=instances.indexOf(event.growthInstance),columns=Math.ceil(Math.sqrt(instances.length)),rows=Math.ceil(instances.length/columns),factor=.82/Math.max(columns,rows);
      position={x:position.x*factor+(group%columns-(columns-1)/2)*2/columns,y:position.y*factor,z:position.z*factor+(Math.floor(group/columns)-(rows-1)/2)*2/rows};
    }
    return {event,id:node?`${prefix}:${node.id}`:String(event.id),parent:node?.parent!==undefined&&node.parent!==null?`${prefix}:${node.parent}`:null,
      x:position?.x??event.pan.start,y:position?.y??Math.max(-1,Math.min(1,(Math.log2(Math.max(20,event.freq.start)/110)/4)*2-1)),z:position?.z??Math.sin(index*GOLDEN)*.5,progress};
  });
}

export {rampValueAt} from './curves';
import {rampValueAt} from './curves';
/** Musical trajectories use fixed axes so changing a score does not rescale its motion. */
export function soundPositionAt(event:NoteEvent,scoreTime:number){
  const age=Math.max(0,Math.min(event.dur,scoreTime-event.t));
  const frequency=rampValueAt(event.freq,age),intensity=rampValueAt(event.volume,age);
  return {
    x:rampValueAt(event.pan,age),
    y:(event.wave==='n'||event.wave==='i')?0:Math.max(-1,Math.min(1,2*Math.log2(Math.max(20,frequency)/20)/Math.log2(12000/20)-1)),
    z:Math.max(-1,Math.min(1,intensity/9*2-1))
  };
}
