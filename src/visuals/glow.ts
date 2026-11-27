/** The glow and geometry share exactly the same projected origin. */
export function foldCentre(width:number,height:number,background:boolean,hidden:boolean,panX:number,panY:number){return {x:width*(background&&!hidden?.72:.5)+panX,y:height*.49+panY};}
export function drawFoldGlow(ctx:CanvasRenderingContext2D,x:number,y:number,radius:number,width:number,height:number){
 const glow=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,radius));
 glow.addColorStop(0,'rgba(43,83,53,0.44)');glow.addColorStop(.4,'rgba(28,56,37,0.22)');glow.addColorStop(1,'rgba(11,16,17,0)');
 ctx.save();ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);ctx.restore();
}
