import {waveMesh,type Vertex} from '../core/glyphs';
import type {Wave} from '../core/types';
export function drawWaveGlyph(ctx:CanvasRenderingContext2D,wave:Wave,seed:number,time:number,position:Vertex,radius:number,scale:number,yaw:number,pitch:number,project:(x:number,y:number,z:number)=>number[],hue:number,active:boolean,alpha:number){
 const centre=project(...position),mesh=waveMesh(wave,seed,time);
 ctx.save();ctx.globalAlpha=alpha;if(active){ctx.shadowColor=`hsl(${hue},70%,70%)`;ctx.shadowBlur=9;}
 if(!mesh){
  const gradient=ctx.createRadialGradient(centre[0]-radius*.3,centre[1]-radius*.35,radius*.08,centre[0],centre[1],radius);
  gradient.addColorStop(0,`hsl(${hue},60%,90%)`);gradient.addColorStop(.45,`hsl(${hue},50%,62%)`);gradient.addColorStop(1,`hsl(${hue},45%,24%)`);
  ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(centre[0],centre[1],radius,0,Math.PI*2);ctx.fill();
 }else{
  const r=radius/scale,verts=mesh.vertices.map(([x,y,z])=>project(position[0]+x*r,position[1]+y*r,position[2]+z*r));
  const depth=([x,y,z]:Vertex)=>(x*Math.sin(yaw)+z*Math.cos(yaw))*Math.cos(pitch)+y*Math.sin(pitch);
  const faces=[...mesh.faces].sort((a,b)=>a.reduce((s,i)=>s+depth(mesh.vertices[i]),0)/a.length-b.reduce((s,i)=>s+depth(mesh.vertices[i]),0)/b.length);
  for(const face of faces){
   const [a,b,c]=face.map(i=>mesh.vertices[i]),u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
   const normal:Vertex=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...normal)||1;
   const light=.3+.7*Math.abs((normal[0]*.25+normal[1]*.6+normal[2]*.7)/length);
   ctx.fillStyle=`hsl(${hue},${active?60:40}%,${25+light*(active?48:35)}%)`;ctx.strokeStyle=`hsla(${hue},60%,85%,.35)`;ctx.lineWidth=.55;
   ctx.beginPath();face.forEach((id,index)=>{const p=verts[id];if(index)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.closePath();ctx.fill();ctx.stroke();
  }
 }
 ctx.restore();
}
