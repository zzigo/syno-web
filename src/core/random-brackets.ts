import {lyricRanges} from './lyrics';
export type RandomSpec={choices:number[]}|{range:[number,number];open?:[boolean,boolean]};
const numeric=(text:string)=>/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text.trim())?Number(text):NaN;
export function randomBracket(body:string,defaults:[number,number],legal:[number,number]):RandomSpec{
 const valid=(v:number)=>Number.isFinite(v)&&v>=legal[0]&&v<=legal[1];
 if(body.includes(':')){const parts=body.split(':');if(parts.length!==2)throw Error('A continuous random interval uses one colon: ?[110:880].');const lo=parts[0].trim()?numeric(parts[0]):defaults[0],hi=parts[1].trim()?numeric(parts[1]):defaults[1];if(!valid(lo)||!valid(hi)||lo>hi)throw Error('Random interval endpoints must be ordered and inside the parameter range; open ends use its default random bounds.');return{range:[lo,hi],open:[!parts[0].trim(),!parts[1].trim()]};}
 const choices=body.trim().split(/[\s,]+/).map(numeric);if(!body.trim()||choices.length>128||choices.some(v=>!valid(v)))throw Error('Random choices need 1–128 legal numeric values, separated by spaces or commas. Use a:b for an interval.');return{choices};
}
/** Old two-bound lists were continuous ranges. Migrate only executable numeric lists. */
export function migrateRandomRanges(source:string){
 const literals=lyricRanges(source),number='-?(?:\\d+(?:\\.\\d*)?|\\.\\d+)',pattern=new RegExp('\\?\\[\\s*('+number+')(?:\\s*,\\s*|\\s+)('+number+')\\s*\\]','g');
 return source.replace(pattern,(match,a,b,offset:number)=>{const line=source.lastIndexOf('\n',offset)+1;if(literals.some(r=>offset>=r.from&&offset<r.to)||[...source.slice(line,offset).matchAll(/#/g)].some(m=>!literals.some(r=>line+m.index!>=r.from&&line+m.index!<r.to)))return match;return`?[${a}:${b}]`;});
}
