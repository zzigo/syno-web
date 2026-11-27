import {lyricRanges} from './lyrics';
import {numberRoles} from './number-roles';
export const PLAY_KEYS=[['q','a'],['w','s'],['e','d'],['r','f'],['t','g'],['y','h'],['u','j'],['i','k'],['o','l'],['p',';'],['[',"'"]] as const;
const codes=[['KeyQ','KeyA'],['KeyW','KeyS'],['KeyE','KeyD'],['KeyR','KeyF'],['KeyT','KeyG'],['KeyY','KeyH'],['KeyU','KeyJ'],['KeyI','KeyK'],['KeyO','KeyL'],['KeyP','Semicolon'],['BracketLeft','Quote']];
export function playKey(code:string,key:string){for(let index=0;index<PLAY_KEYS.length;index++)for(let side=0;side<2;side++)if(code===codes[index][side]||(!code&&key.toLowerCase()===PLAY_KEYS[index][side]))return {index,direction:side===0?1:-1};}
export interface PerformanceSlot {from:number;to:number;text:string;label:string;step:number;min:number;max:number;log:boolean;integer:boolean}
export function performanceSlots(source:string,cursor:number,limit:number=PLAY_KEYS.length):PerformanceSlot[]{
 const values:PerformanceSlot[]=[];
 for(const role of numberRoles(source)){
  if(!Number.isFinite(Number(role.text)))continue;
  const before=source[role.from-1],packed=/^[0-9]{3}$/.test(role.text)&&/[GASHRK]/.test(before??''),adsr=/^[0-9]{4}$/.test(role.text)&&before==='e';
  if(packed||adsr){for(let i=0;i<role.text.length;i++)values.push({from:role.from+i,to:role.from+i+1,text:role.text[i],label:packed?`${before} · ${['N','U','D'][i]}`:`e · ${['A','D','S','R'][i]}`,step:1,min:0,max:9,log:false,integer:true});continue;}
  const prefix=source.slice(source.lastIndexOf('\n',role.from-1)+1,role.from),op=prefix.match(/([A-Za-z'])(?:[^A-Za-z']*)$/)?.[1]??'';
  // e0 is a bypass switch, not one ADSR stage; grow count / other real numbers remain editable.
  if(before==='e'&&role.text==='0')continue;
  const digits=role.text.includes('.')?role.text.length-role.text.indexOf('.')-1:0,number=Number(role.text),frequency=role.kind==='frequency',time=/'(?:[nb])?(?:[\d./]+[<>][nb]?)?$/.test(prefix),integer=!time&&['N','L','n'].includes(op);
  const bounds:Record<string,[number,number]>={p:[-1,1],v:[0,9],w:[0,9],f:[0,9],r:[0,9],h:[0,9],i:[0,20],d:[.001,9],U:[0,1],D:[.1,3],N:[1,128],L:[0,16],n:[1,3],x:[0,1]};
  const [min,max]=frequency?[20,20000]:time?[.001,86400]:bounds[op]??[Math.min(0,number),Math.max(9,number*4)];
  values.push({from:role.from,to:role.to,text:role.text,label:frequency?'Hz':time?(op==='n'?'figure n':op==='b'?'beats':'seconds'):op||'value',step:10**-digits,min,max,log:frequency||time||op==='d',integer});
 }
 return values.filter(v=>v.to>cursor).slice(0,limit);
}
export function slotValue(slot:PerformanceSlot,value:number){
 const bounded=Math.max(slot.min,Math.min(slot.max,value));
 if(slot.integer)return String(Math.round(bounded)).padStart(slot.text.length,'0');
 const original=slot.text.includes('.')?slot.text.length-slot.text.indexOf('.')-1:0;
 const rounded=Number(bounded.toFixed(6)),needed=String(rounded).split('.')[1]?.length??0;
 return rounded.toFixed(Math.min(6,Math.max(original,needed)));
}
export function slotAtPosition(slot:PerformanceSlot,unit:number){const t=Math.max(0,Math.min(1,unit));return slot.log?slot.min*(slot.max/slot.min)**t:slot.min+(slot.max-slot.min)*t;}
export function slotPosition(slot:PerformanceSlot){const value=Math.max(slot.min,Math.min(slot.max,Number(slot.text)));return slot.log?Math.log(value/slot.min)/Math.log(slot.max/slot.min):(value-slot.min)/(slot.max-slot.min);}

export interface PerformanceTime{from:number;to:number;text:string;unit:'s'|'n'|'b';numerator:number;divisor:number;step:number}
/** Dedicated comma/period control finds the first written time at or after the saved anchor. */
export function performanceTime(source:string,cursor:number):PerformanceTime|undefined{
 for(const match of source.matchAll(/'([nb]?)(\d+(?:\.\d*)?|\.\d+)(?:\/(\d+(?:\.\d*)?|\.\d+))?/g)){
  const from=match.index!,to=from+match[0].length;if(to<cursor||lyricRanges(source).some(r=>from>=r.from&&from<r.to))continue;
  const lineStart=source.lastIndexOf('\n',from)+1;if([...source.slice(lineStart,from).matchAll(/#/g)].some(m=>!lyricRanges(source).some(r=>lineStart+m.index!>=r.from&&lineStart+m.index!<r.to)))continue;
  const numeric=match[2],decimals=numeric.includes('.')?numeric.length-numeric.indexOf('.')-1:0;
  return {from,to,text:match[0],unit:match[1] as 'n'|'b'||'s',numerator:Number(numeric),divisor:Number(match[3]??1),step:10**-decimals};
 }
}
export function changePerformanceTime(time:PerformanceTime,direction:number,fine=false){
 const factor=fine?2**.25:2;
 const numerator=time.unit==='n'?time.numerator*(direction>0?1/factor:factor):time.unit==='b'?time.numerator*(direction>0?factor:1/factor):time.numerator+direction*time.step*(fine?.1:1);
 return timeText(time,Math.max(.001,numerator));
}
export function timeText(time:PerformanceTime,numerator:number){
 const original=time.text.match(/[\d.]+/)![0],decimals=original.includes('.')?original.length-original.indexOf('.')-1:0,value=Number(numerator.toFixed(6)),needed=String(value).split('.')[1]?.length??0;
 return "'"+(time.unit==='s'?'':time.unit)+value.toFixed(Math.min(6,Math.max(decimals,needed)))+(time.divisor!==1?'/'+time.divisor:'');
}

/** At end-of-score, recover the last numeric statement instead of opening an empty PLAY console. */
export function performanceAnchorAt(source:string,cursor:number){
 const next=performanceSlots(source,cursor,1)[0];if(next)return next.from;
 const all=performanceSlots(source,0,Number.MAX_SAFE_INTEGER),last=all.at(-1);if(!last)return Math.max(0,Math.min(source.length,cursor));
 const lineStart=source.lastIndexOf('\n',last.from-1)+1;return all.find(slot=>slot.from>=lineStart)!.from;
}
