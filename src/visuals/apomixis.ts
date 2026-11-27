import {CAPSULE_EDGES,capsuleVertices} from '../core/apomixis';
import type {VisualPoint} from '../core/visualization';
type Project=(x:number,y:number,z:number)=>number[];
/** Closed maternal/filial bodies; a single filament always stays inside its lineage. */
export function drawApomixis(ctx:CanvasRenderingContext2D,points:VisualPoint[],project:Project,time:number,playing:boolean){
 const unique=new Map<string,VisualPoint>();for(const p of points){if(!p.event.node?.capsule)continue;const old=unique.get(p.id);if(!old||p.event.t<old.event.t)unique.set(p.id,p);}
 const position=(p:VisualPoint):[number,number,number]=>{
  const parent=p.parent?unique.get(p.parent):undefined,c=p.event.node!.capsule!;
  const phase=playing&&parent?Math.max(0,Math.min(1,(time-p.event.t)/Math.max(.15,c.flight))):1,ease=1-(1-phase)**3;
  return parent?[parent.x+(p.x-parent.x)*ease,parent.y+(p.y-parent.y)*ease+Math.sin(phase*Math.PI)*.05*c.flight,parent.z+(p.z-parent.z)*ease]:[p.x,p.y,p.z];
 };
 const line=(a:number[],b:number[],color:string,width:number)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();};
 for(const p of unique.values()){
  if(playing&&time<p.event.t)continue;
  const c=p.event.node!.capsule!,center=position(p),xy=project(...center),parent=p.parent?unique.get(p.parent):undefined;
  if(parent)line(project(...position(parent)),xy,'#bba7da55',Math.max(.45,.9*c.scale));
  const radius=.075*c.scale,vertices=capsuleVertices(c,p.x,p.y,p.z).map(v=>project(center[0]+v[0]*radius,center[1]+v[1]*radius,center[2]+v[2]*radius));
  const active=playing&&time>=p.event.t&&time<p.event.t+p.event.dur;
  for(const [a,b]of CAPSULE_EDGES)line(vertices[a],vertices[b],c.generation===0?'#e8c798b0':active?'#b8f3cbd9':'#bba7da80',active?1.25:.7);
 }
}
