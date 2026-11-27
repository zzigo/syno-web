import {drawApomixis} from './apomixis';
import {layoutEvents} from '../core/visualization';
// SPDX-License-Identifier: 0BSD
import type {CompiledScore,NoteEvent} from '../core/types';
import {spatialPosition,spatialGains,effectiveRouting,roomScale} from '../core/spatial';
import {rampValueAt} from '../core/curves';
import {drawWaveGlyph} from './glyphs';
export const SPACE_COLORS={room:'#7c9f946e',growth:'#91d69b',sound:'#87dced',speaker:'#e5bb7e'};
export const ROOM_EDGES=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]] as const;
export const ROOM_CORNERS=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]] as const;
type Project=(x:number,y:number,z:number)=>number[];
export function spatialAspect(score:CompiledScore):[number,number,number]{const half=roomScale(score.speakers??[],score.room),max=Math.max(...half,...(score.speakers??[]).flatMap(s=>[Math.abs(s.x),Math.abs(s.y),Math.abs(s.z)]),.001);return half.map(v=>v/max) as [number,number,number];}
export function drawSpatial(ctx:CanvasRenderingContext2D,score:CompiledScore,time:number,playing:boolean,project:Project,events:NoteEvent[]=score.events,orientation?:{yaw:number;pitch:number;scale:number},outline=true){
 const speakers=score.speakers??[],half=roomScale(speakers,score.room);
 const point=(s:{x:number;y:number;z:number})=>[s.x/half[0],s.y/half[1],s.z/half[2]];
 const stroke=(a:number[],b:number[],color:string,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();};
 if(outline){
  for(const [a,b] of ROOM_EDGES)stroke(project(...ROOM_CORNERS[a] as [number,number,number]),project(...ROOM_CORNERS[b] as [number,number,number]),SPACE_COLORS.room,1.15);
  for(const v of [-.5,0,.5]){stroke(project(-1,-1,v),project(1,-1,v),'#7c9f9414');stroke(project(v,-1,-1),project(v,-1,1),'#7c9f9414');}
  ctx.font='9px ui-monospace,monospace';ctx.fillStyle='#819b8e';const axes:[[number,number,number],string][]=[[[1,-1,1],score.room?`X · ${score.room[0]} m`:'X · RIGHT'],[[-1,1,-1],score.room?`Y · ${score.room[1]} m`:'Y · UP'],[[-1,-1,1],score.room?`Z · ${score.room[2]} m`:'Z · DEPTH']];for(const [p,label]of axes){const xy=project(...p);ctx.fillText(label,xy[0]+10,xy[1]+16);}
 }
 // Growth is the organism scaffold, not a replacement for the speaker/source layer.
 const growth=score.events.filter(e=>e.node).slice(0,1024),lookup=new Map(growth.map(e=>[`${e.growthInstance??e.lSystemIndex??0}:${e.node!.id}`,e]));
 for(const e of growth){const n=e.node!,xy=project(n.x,n.y,n.z),parent=lookup.get(`${e.growthInstance??e.lSystemIndex??0}:${n.parent}`)?.node;
  if(parent&&!n.capsule)stroke(project(parent.x,parent.y,parent.z),xy,'#91d69b32',.7);
  ctx.fillStyle=playing&&time<e.t?'#91d69b27':'#91d69b88';ctx.beginPath();ctx.arc(xy[0],xy[1],1.6,0,Math.PI*2);ctx.fill();
 }
 drawApomixis(ctx,layoutEvents(score.events,'cube').map(p=>p.event.node?{...p,x:p.event.node.x,y:p.event.node.y,z:p.event.node.z}:p),project,time,playing);
 const speakerPoints=speakers.map(s=>{const p=point(s);return project(p[0],p[1],p[2]);});
 // Co-located outputs are legal: keep their shared physical anchor and show every ID.
 const groups=new Map<string,number[]>();speakers.forEach((s,i)=>{const key=[s.x,s.y,s.z].join(',');groups.set(key,[...(groups.get(key)??[]),i]);});
 for(const indices of groups.values()){const xy=speakerPoints[indices[0]],label=indices.map(i=>speakers[i].id).join('·'),width=Math.max(18,label.length*6+8);ctx.fillStyle='#131a13';ctx.strokeStyle=SPACE_COLORS.speaker;ctx.lineWidth=1;ctx.fillRect(xy[0]-width/2,xy[1]-9,width,18);ctx.strokeRect(xy[0]-width/2,xy[1]-9,width,18);ctx.font='10px ui-monospace,monospace';ctx.fillStyle=SPACE_COLORS.speaker;ctx.fillText(label,xy[0]-label.length*3,xy[1]+3);const roles=indices.map(i=>speakers[i].role).filter(Boolean).join('·');if(roles){ctx.font='8px ui-monospace,monospace';ctx.fillStyle='#bda276';ctx.fillText(roles,xy[0]-roles.length*2.5,xy[1]+21);}}
 const glyph=(event:NoteEvent,p:number[],alpha=1)=>{const xy=project(p[0],p[1],p[2]);
  if(playing&&orientation&&alpha>.03){ctx.save();ctx.globalAlpha=Math.min(1,alpha);drawWaveGlyph(ctx,event.wave,event.id+score.seed,Math.max(0,time-event.t),p as [number,number,number],7+3*alpha,orientation.scale,orientation.yaw,orientation.pitch,project,190,true,.85);ctx.restore();}
  else{ctx.fillStyle=SPACE_COLORS.sound;ctx.globalAlpha=playing?alpha:.5;ctx.beginPath();ctx.arc(xy[0],xy[1],playing?4:2,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
 };
 for(const event of events){const age=time-event.t,active=playing&&age>=0&&age<event.dur;if(playing&&(!active||(event.gateLevel??1)<.02))continue;if(!playing&&event.id>127)continue;
  const routing=effectiveRouting(score,event,playing?time:event.t),spatial=routing.spatial,pan=routing.pan,routeAge=routing.age;
  if(spatial?.mode==='outputs'){
   const weights=spatialGains(spatial,pan,routeAge,speakers,score.room);
   weights.forEach((weight,i)=>{if(weight<=0||!speakers[i])return;const xy=speakerPoints[i],p=point(speakers[i]);if(active){ctx.strokeStyle=`rgba(135,220,237,${Math.min(1,.2+weight*.7)})`;ctx.beginPath();ctx.arc(xy[0],xy[1],14+weight*7,0,Math.PI*2);ctx.stroke();ctx.fillStyle=SPACE_COLORS.sound;ctx.font='8px ui-monospace,monospace';ctx.fillText(String(speakers[i].id),xy[0]+14,xy[1]-12-i%3*8);}glyph(event,p,Math.min(1,weight));});continue;
  }
  const position=spatialPosition({spatial,pan},routeAge),xy=project(position[0],position[1],position[2]);
  if(speakers.length){const weights=spatialGains(spatial,pan,routeAge,speakers,score.room);weights.forEach((weight,i)=>{if(active)stroke(xy,speakerPoints[i],`rgba(135,220,237,${weight*.28})`);});}
  if(spatial?.mode==='xyz'){
   ctx.setLineDash([2,5]);let previous: number[]|undefined;
   for(let i=0;i<=48;i++){const p=spatialPosition({spatial,pan},event.dur*i/48),next=project(p[0],p[1],p[2]);if(previous)stroke(previous,next,'#87dced55');previous=next;}ctx.setLineDash([]);
  }
  glyph(event,position,active?.3+.7*Math.min(1,rampValueAt(event.volume,Math.max(0,age))/9):.5);
 }
 if(outline){ctx.font='8px ui-monospace,monospace';let x=Math.max(8,ctx.canvas.clientWidth-225);const y=ctx.canvas.clientHeight-12;for(const [label,color]of [['growth',SPACE_COLORS.growth],['sound',SPACE_COLORS.sound],['speaker',SPACE_COLORS.speaker]]){ctx.fillStyle=color;ctx.fillText('· '+label,x,y);x+=72;}}
}
