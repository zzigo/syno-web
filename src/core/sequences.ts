import type {Ramp} from './types';
export type SequenceMode='continuous'|'articulated'|'spatial';
export interface Cell {value?:number;parameter?:number;random?:boolean;randomBounds?:[number,number];randomOpen?:[boolean,boolean];randomChoices?:number[];degree?:boolean;octave?:number;rest?:boolean;children?:Cell[];gap?:number}
export interface Sequence {cells:Cell[]}
export interface SeqLeaf {value?:number;parameter?:number;random?:boolean;randomBounds?:[number,number];randomOpen?:[boolean,boolean];randomChoices?:number[];degree?:boolean;octave?:number;rest?:boolean;at:number;dur:number;index:number}
export function sequenceLeaves(sequence:Sequence,step:number,spatial=false,shift=0):SeqLeaf[]{
 const leaves:SeqLeaf[]=[];let serial=0;
 const walk=(cells:Cell[],at:number,span:number,nested:boolean)=>{
  const list=cells.flatMap(cell=>[...(spatial?Array.from({length:cell.gap??0},()=>({rest:true} as Cell)):[]),cell]);
  if(!list.length)throw Error('A sequence cannot be empty.');let time=at;const unit=nested?span/list.length:step;
  const rotated=list.map((_,i)=>list[((i-shift)%list.length+list.length)%list.length]);
  for(const cell of rotated){if(cell.children)walk(cell.children,time,unit,true);else leaves.push({...cell,at:time,dur:unit,index:serial++});time+=unit;}
  return time;
 };walk(sequence.cells,0,0,false);return leaves;
}
export function stepped(points:{time:number;value:number}[],duration:number):Ramp {return {start:points[0].value,end:points.at(-1)!.value,duration,points,step:true};}
export const growthCounts=[1,2,4,8,12,24,32,48,64,128];
export function compactGrowth(digits:string){if(!/^\d{3}$/.test(digits))throw Error('A growth shorthand has three digits: N/U/D.');const [n,u,d]=digits.split('').map(Number);return {count:growthCounts[n],mutation:u/9,spread:.1+2.9*d/9};}
export function traverseNodes<T extends {id:number;parent:number|null;x:number;y:number;z:number}>(nodes:T[],mode:string):T[]{
 if(mode==='born')return nodes;
 const children=new Map<number|null,T[]>();for(const node of nodes){const parent=nodes.some(n=>n.id===node.parent)?node.parent:null;children.set(parent,[...(children.get(parent)??[]),node]);}
 if(mode==='bfs'){const queue=[...(children.get(null)??[])],result:T[]=[];for(let i=0;i<queue.length;i++){result.push(queue[i]);queue.push(...children.get(queue[i].id)??[]);}return result;}
 if(mode==='dfs'){const result:T[]=[];const visit=(n:T)=>{result.push(n);for(const child of children.get(n.id)??[])visit(child);};for(const node of children.get(null)??[])visit(node);return result;}
 const result:T[]=[],available=new Set<number>();while(result.length<nodes.length){const eligible=nodes.filter(n=>!available.has(n.id)&&(n.parent===null||available.has(n.parent)||!nodes.some(p=>p.id===n.parent)));const last=result.at(-1);eligible.sort((a,b)=>last?Math.hypot(a.x-last.x,a.y-last.y,a.z-last.z)-Math.hypot(b.x-last.x,b.y-last.y,b.z-last.z):a.id-b.id);const node=eligible[0];if(!node)break;available.add(node.id);result.push(node);}return result;
}
/** Replace score-level behavior messages; local expression modes remain scoped. */
export function setSequenceMessage(source:string,mode:'sc'|'sa'|'sx'){
 let depth=0,comment=false,result='';
 for(let i=0;i<source.length;i++){const c=source[i];if(c==='\n')comment=false;if(c==='#')comment=true;
  if(!comment){if('([{'.includes(c))depth++;if(')]}'.includes(c))depth--;if(depth===0&&/^!s[cax]\b/.test(source.slice(i))){i+=2;continue;}}
  result+=c;
 }
 return `!${mode}\n`+result;
}
