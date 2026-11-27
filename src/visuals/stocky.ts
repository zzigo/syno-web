import type {CompiledScore,NoteEvent,Ramp} from '../core/types';
import {rampValueAt} from '../core/curves';
import {adsrPoints} from '../core/envelope';
export interface Mixture {t:number;dur:number;lo:number;hi:number;events:NoteEvent[];curve:{time:number;value:number}[];peak:number}
/** One visual mixture for simultaneous components of the same written expression. */
export function stockyMixtures(score:CompiledScore):Mixture[]{
 const groups=new Map<string,Mixture>();for(const event of score.events){const key=[event.from,event.to,event.t,event.dur,event.outputBus,event.feedbackBus].join(':');let group=groups.get(key);const frequencies=event.wave==='n'||event.wave==='i'?[20,20000]:[event.freq.start,event.freq.end,...(event.freq.points?.map(p=>p.value)??[])].filter(f=>f>0);if(!group){group={t:event.t,dur:event.dur,lo:Infinity,hi:0,events:[],curve:[],peak:0};groups.set(key,group);}group.events.push(event);group.lo=Math.min(group.lo,...frequencies);group.hi=Math.max(group.hi,...frequencies);}const mixtures=[...groups.values()];for(const group of mixtures){const times=new Set(Array.from({length:97},(_,i)=>group.dur*i/96));for(const event of group.events){for(const p of adsrPoints(event.envelope,event.dur))times.add(p.time);for(const [ramp,offset]of intensityRamps(score,event)){for(const t of ramp.points?.map(p=>p.time)??[0,ramp.duration]){const local=t-offset;if(local>=0&&local<=group.dur)times.add(local);}}}group.curve=[...times].sort((a,b)=>a-b).map(time=>({time,value:Math.max(...group.events.map(e=>stockyIntensityAt(score,e,time)))}));group.peak=Math.max(...group.curve.map(p=>p.value));}return mixtures;
}
function intensityRamps(score:CompiledScore,event:NoteEvent):[Ramp,number][]{
 const ramps:[Ramp,number][]=[[event.volume,0]];let bus=event.outputBus;
 if(event.feedbackBus!==undefined){const circuit=score.feedback[event.feedbackBus];if(circuit){ramps.push([circuit.volume,event.t-circuit.t]);bus=circuit.outputBus;}}
 let limit=32;while(bus!==undefined&&limit-->0){const parent=score.outputBuses[bus];if(!parent)break;const offset=event.t-parent.t;ramps.push([parent.volume,offset],...parent.effects.filter(e=>e.kind==='volume').map(e=>[e.ramp??{start:e.value,end:e.value,duration:0},offset] as [Ramp,number]));bus=parent.parent;}return ramps;
}
/** Written note ADSR/intensity multiplied by every enclosing v stage, never an output meter. */
export function stockyIntensityAt(score:CompiledScore,event:NoteEvent,age:number){
 const envelope=adsrPoints(event.envelope,event.dur);let i=1;while(i<envelope.length-1&&envelope[i].time<age)i++;const a=envelope[i-1],b=envelope[i],mix=b.time===a.time?1:Math.max(0,Math.min(1,(age-a.time)/(b.time-a.time)));let value=a.value+(b.value-a.value)*mix;
 for(const [index,[ramp,offset]]of intensityRamps(score,event).entries())value*=rampValueAt(ramp,Math.max(0,age+offset))/(index===0?1:9);return Math.max(0,value);
}
export function stockyWindow(duration:number,time:number,follow:boolean,zoom?:number,center=.5){const total=Math.max(duration,1),span=zoom===undefined?(follow?Math.min(total,24):total):Math.max(.05,total/Math.max(1,zoom)),from=Math.max(0,Math.min(Math.max(0,duration-span),follow?time-span*.3:center*total-span*.5));return {from,to:from+span};}
export function drawStocky(ctx:CanvasRenderingContext2D,width:number,height:number,score:CompiledScore,mixtures:Mixture[],time:number,follow:boolean,background=false,zoom?:number,center=.5){
 const left=background?width*.53:48,right=width-22,top=38,bottom=height-38;if(right-left<90||bottom-top<100)return;const split=top+(bottom-top)*.69,gap=24,envTop=split+gap;
 const window=stockyWindow(score.duration,time,follow,zoom,center),x=(t:number)=>left+(t-window.from)/(window.to-window.from)*(right-left),y=(f:number)=>split-Math.log(Math.max(20,Math.min(20000,f))/20)/Math.log(1000)*(split-top),db=(v:number)=>bottom-Math.max(0,Math.min(60,60+20*Math.log10(Math.max(.000001,v)/9)))/60*(bottom-envTop);
 ctx.save();ctx.font='9px monospace';ctx.fillStyle='#7f998b';ctx.textAlign='right';
 for(const hz of [20,55,110,220,440,880,1760,3520,7040,14080,20000]){const yy=y(hz);ctx.strokeStyle='#6d85782b';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(right,yy);ctx.stroke();ctx.fillText(String(hz),left-7,yy+3);}
 for(const level of [0,-20,-40,-60]){const yy=db(9*10**(level/20));ctx.strokeStyle='#6d85782b';ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(right,yy);ctx.stroke();ctx.fillText(String(level),left-7,yy+3);}
 ctx.textAlign='left';ctx.fillText('Hz',left,top-14);ctx.fillText(width<700?'dB':'dB · written intensity + ADSR',left,envTop-9);
 for(let i=0;i<=6;i++){const t=window.from+(window.to-window.from)*i/6,xx=x(t);ctx.fillStyle='#6f877a';ctx.fillText(t.toFixed(window.to-window.from<10?1:0)+'s',Math.min(xx,right-20),bottom+18);}
 ctx.beginPath();ctx.rect(left,top,right-left,bottom-top+1);ctx.clip();
 for(const section of score.sections??[]){const xx=x(section.t);if(xx<left||xx>right)continue;ctx.setLineDash([2,5]);ctx.strokeStyle='#b9d0bb30';ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,bottom);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#90a68b';ctx.fillText(section.name,xx+4,top+10);}
 for(const group of mixtures){if(group.t>window.to||group.t+group.dur<window.from)continue;const active=time>=group.t&&time<group.t+group.dur,x0=x(group.t),x1=x(group.t+group.dur),y0=y(group.hi),y1=y(group.lo),h=Math.max(2,y1-y0);const gradient=ctx.createLinearGradient(x0,0,Math.max(x0+.01,x1),0);for(let i=0;i<=16;i++){const point=group.curve[Math.round(i*(group.curve.length-1)/16)];gradient.addColorStop(i/16,`rgba(190,224,166,${.02+(active?.42:.19)*(group.peak?point.value/group.peak:0)**.6})`);}ctx.fillStyle=gradient;ctx.strokeStyle=active?'#d3f1ae':'#b5c5b567';ctx.lineWidth=active?1:.6;ctx.fillRect(x0,y0,x1-x0,h);ctx.strokeRect(x0,y0,x1-x0,h);
  ctx.beginPath();ctx.moveTo(x0,bottom);for(const p of group.curve)ctx.lineTo(x(group.t+p.time),db(p.value));ctx.lineTo(x1,bottom);ctx.closePath();ctx.fillStyle=active?'#c8efab32':'#b5c5b51a';ctx.fill();ctx.strokeStyle=active?'#d7f6b6':'#a9c3ad99';ctx.lineWidth=active?1.3:.8;ctx.stroke();
  if(x1-x0>85&&group.curve.length){const start=group.curve[0].value,end=group.curve.at(-1)!.value;ctx.fillStyle='#c0d4b2';ctx.font='8px monospace';ctx.fillText(`v ${start.toFixed(2)} → ${group.peak.toFixed(2)} → ${end.toFixed(2)}`,x0+4,Math.max(top+20,y0+12));ctx.font='9px monospace';}
 }
 if(time>=window.from&&time<=window.to){ctx.strokeStyle='#f0d68e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x(time),top);ctx.lineTo(x(time),bottom);ctx.stroke();}ctx.restore();
}
