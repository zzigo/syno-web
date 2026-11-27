/** Local canvas compositor: a MediaStream usable by MediaRecorder or WebRTC. 0BSD. */
export const captureFormats={portrait:{label:'Instagram Reel / Story',width:1080,height:1920},post:{label:'Instagram Post',width:1080,height:1080},feed:{label:'Instagram Portrait Feed',width:1080,height:1350},tiktok:{label:'TikTok',width:1080,height:1920},wide:{label:'Landscape',width:1920,height:1080}};
export type CaptureFormat=keyof typeof captureFormats;
export function fitFrame(width:number,height:number,aspect:number,center=.5){const h=Math.min(height*.9,width*.9/aspect),w=h*aspect;return {x:Math.max(0,Math.min(width-w,width*center-w/2)),y:(height-h)/2,width:w,height:h};}
export interface CropTransform {cx:number;cy:number;scale:number}
export type FrameRect={x:number;y:number;width:number;height:number};
const clamp=(value:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,value));
export function cropFrame(width:number,height:number,aspect:number,crop:CropTransform):FrameRect {
 const h=Math.min(height,width/aspect)*clamp(crop.scale,.1,1),w=h*aspect;
 return {x:clamp(width*crop.cx-w/2,0,width-w),y:clamp(height*crop.cy-h/2,0,height-h),width:w,height:h};
}
export function transformFrame(rect:FrameRect,dx:number,dy:number,action:string,width:number,height:number):CropTransform {
 let {x,y,width:w,height:h}=rect;const aspect=w/h;
 if(action==='move'){x=clamp(x+dx,0,width-w);y=clamp(y+dy,0,height-h);}
 else {const sx=action.includes('e')?1:-1,sy=action.includes('s')?1:-1,ax=sx>0?x:x+w,ay=sy>0?y:y+h;
  const max=Math.min((sx>0?width-ax:ax)/aspect,sy>0?height-ay:ay);
  h=clamp((aspect*(w+sx*dx)+h+sy*dy)/(aspect*aspect+1),Math.min(.1*Math.min(height,width/aspect),max),max);w=h*aspect;x=sx>0?ax:ax-w;y=sy>0?ay:ay-h;
 }
 return {cx:(x+w/2)/width,cy:(y+h/2)/height,scale:h/Math.min(height,width/aspect)};
}
export function saveBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function lines(ctx:CanvasRenderingContext2D,text:string,width:number){const result:string[]=[];let line='';for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){result.push(line);line=word;}else line=next;}if(line)result.push(line);return result;}
export function compose(canvas:HTMLCanvasElement,source:HTMLCanvasElement,options:{format:CaptureFormat;center:number;crop?:CropTransform;subtitle:string;code:string;lyric?:string}){
 const format=captureFormats[options.format];if(canvas.width!==format.width||canvas.height!==format.height){canvas.width=format.width;canvas.height=format.height;}const ctx=canvas.getContext('2d')!,rect=options.crop?cropFrame(source.width,source.height,format.width/format.height,options.crop):fitFrame(source.width,source.height,format.width/format.height,options.center);
 ctx.fillStyle='#0b1011';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,rect.x,rect.y,rect.width,rect.height,0,0,canvas.width,canvas.height);
 const margin=canvas.width*.06;
 if(options.code){const font=canvas.width/42;ctx.font=`${font}px ui-monospace,monospace`;const rows=options.code.split('\n').filter(s=>s.trim()&&!s.trimStart().startsWith('#')).slice(0,12).flatMap(s=>lines(ctx,s,canvas.width-margin*2));const height=Math.min(rows.length,18)*font*1.4+margin;ctx.fillStyle='#07100dda';ctx.fillRect(margin/2,margin/2,canvas.width-margin,height);ctx.fillStyle='#c4e7bb';rows.slice(0,18).forEach((row,i)=>ctx.fillText(row,margin,margin+font*(1+i*1.4)));}
 if(options.lyric){
  const font=Math.min(canvas.width/24,canvas.height/18);ctx.font=`600 ${font}px Arial,sans-serif`;
  const rows=lines(ctx,options.lyric,canvas.width-margin*2),y=canvas.height-canvas.height*.07-(rows.length-1)*font*1.3;
  ctx.fillStyle='#ffe15a';ctx.strokeStyle='#000';ctx.lineWidth=Math.max(2,font*.075);ctx.lineJoin='round';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=font*.12;
  rows.forEach((row,i)=>{ctx.strokeText(row,canvas.width/2,y+i*font*1.3);ctx.fillText(row,canvas.width/2,y+i*font*1.3);});ctx.shadowBlur=0;ctx.textAlign='left';
 }else if(options.subtitle){const font=canvas.width/24;ctx.font=`500 ${font}px system-ui,sans-serif`;const rows=lines(ctx,options.subtitle,canvas.width-margin*2).slice(0,3),height=rows.length*font*1.35+margin,y=canvas.height-height-margin;ctx.fillStyle='#07100de8';ctx.fillRect(margin/2,y,canvas.width-margin,height);ctx.fillStyle='#eff8e9';ctx.textAlign='center';rows.forEach((row,i)=>ctx.fillText(row,canvas.width/2,y+margin*.55+font*(1+i*1.35)));ctx.textAlign='left';}
}
