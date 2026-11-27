/** Bracketed planar turtle; normalized geometry, independent from musical pitch. 0BSD. */
export interface TurtlePoint {x:number;y:number;z:number}
export interface TurtleSegment {id:number;parent:number|null;symbolIndex:number;depth:number;start:TurtlePoint;end:TurtlePoint;t:number;dur:number}
export interface TurtleTrace {angle:number;taper:number;segments:TurtleSegment[]}
export function turtleGeometry(word:string,angle:number,symbols:Set<string>,taper=1):TurtleTrace {
 if(!Number.isFinite(angle)||angle<=0||angle>180)throw new Error('L turtle angle must be greater than 0 and at most 180 degrees.');
 let x=0,y=0,heading=Math.PI/2,parent:number|null=null,depth=0;
 const stack:{x:number;y:number;heading:number;parent:number|null;depth:number}[]=[],segments:TurtleSegment[]=[];
 for(let i=0;i<word.length;i++){
  const ch=word[i];
  if(ch==='['){stack.push({x,y,heading,parent,depth});depth++;continue;}
  if(ch===']'){const saved=stack.pop();if(!saved)throw new Error('Unbalanced L branch brackets.');({x,y,heading,parent,depth}=saved);continue;}
  if(ch==='+'){heading+=angle*Math.PI/180;continue;}
  if(ch==='-'){heading-=angle*Math.PI/180;continue;}
  if(!symbols.has(ch))continue;
  const start={x,y,z:0};x+=Math.cos(heading)*taper**depth;y+=Math.sin(heading)*taper**depth;
  const segment:TurtleSegment={id:segments.length,parent,symbolIndex:i,depth,start,end:{x,y,z:0},t:0,dur:0};segments.push(segment);parent=segment.id;
 }
 if(stack.length)throw new Error('Unbalanced L branch brackets.');
 const points=segments.flatMap(s=>[s.start,s.end]);
 if(points.length){
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const scale=1.8/Math.max(maxX-minX,maxY-minY,1),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  for(const s of segments)for(const p of [s.start,s.end]){p.x=(p.x-cx)*scale;p.y=(p.y-cy)*scale;}
 }
 return {angle,taper,segments};
}
