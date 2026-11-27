import type {Wave} from './types';
export type Vertex=[number,number,number];
export interface Mesh {vertices:Vertex[];faces:number[][]}
const cube:Mesh={vertices:[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],faces:[[0,3,2,1],[4,5,6,7],[0,1,5,4],[3,7,6,2],[0,4,7,3],[1,2,6,5]]};
const pyramid:Mesh={vertices:[[-1,-.7,-1],[1,-.7,-1],[1,-.7,1],[-1,-.7,1],[0,1.3,0]],faces:[[0,3,2,1],[0,1,4],[1,2,4],[2,3,4],[3,0,4]]};
const ramp:Mesh={vertices:[[-1,-1,-.7],[1,-1,-.7],[1,1,-.7],[-1,-1,.7],[1,-1,.7],[1,1,.7]],faces:[[0,2,1],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]]};
const phi=(1+Math.sqrt(5))/2;
const ico:Mesh={vertices:[[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]].map(v=>{const n=Math.hypot(...v);return v.map(x=>x/n) as Vertex;}),faces:[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]]};
const gradients:Vertex[]=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
function hash(x:number,y:number,z:number,seed:number){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1442695041)^seed;h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;}
/** Seeded 3D gradient noise with quintic interpolation; no random mutable state. */
export function perlin3D(x:number,y:number,z:number,seed:number){
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;
 const fade=(t:number)=>t*t*t*(t*(t*6-15)+10),u=fade(fx),v=fade(fy),w=fade(fz);let value=0;
 for(let dx=0;dx<=1;dx++)for(let dy=0;dy<=1;dy++)for(let dz=0;dz<=1;dz++){
  const g=gradients[hash(ix+dx,iy+dy,iz+dz,seed)%12];
  value+=(g[0]*(fx-dx)+g[1]*(fy-dy)+g[2]*(fz-dz))*(dx?u:1-u)*(dy?v:1-v)*(dz?w:1-w);
 }
 return value;
}
export function waveMesh(wave:Wave,seed=0,time=0):Mesh|null {
 if(wave==='s')return null;if(wave==='t')return pyramid;if(wave==='a')return ramp;if(wave==='q')return cube;
 return {vertices:ico.vertices.map(([x,y,z])=>{const r=1+.55*perlin3D(x*1.6+7.31,y*1.6+3.7,z*1.6+time*.2,seed);return [x*r,y*r,z*r] as Vertex;}),faces:ico.faces};
}
