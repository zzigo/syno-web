import {agentNumber,compactAgentNumbers} from './agent-numbers';
import {compile} from './parser';
import {accretionLevels} from './accretion';
import type {MutationRegion} from './mutation';
import type {NoteEvent} from './types';
interface Daughter {parent:number;shift:number;level:number;onset:number;duration:number;rhythm?:number[];rest?:number;timbre?:'s'|'t'|'a'|'q'|'n1'|'n2'|'n3';index?:number|number[];filter?:number|number[];pan?:number|number[]}
/** The model composes parameters, never punctuation or an edit index. */
export function parseDaughter(text:string):unknown|undefined {try{const value=JSON.parse(text);return value&&typeof value==='object'?value.daughter:undefined;}catch{return undefined;}}
export function apomicticParents(source:string,region:MutationRegion,seed:number){
 const events=compile(source,seed).events.filter(e=>e.from>=region.from&&e.to<=region.to&&e.wave!=='i'&&e.feedbackBus===undefined);
 return [...new Map(events.map(e=>[`${e.from}:${e.to}`,e])).values()];
}
const number=agentNumber;
function pair(value:unknown,lo:number,hi:number,name:string):number|number[]{
 const values=Array.isArray(value)?value:[value];if(values.length<1||values.length>16||values.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi))throw Error(`${name} must be a number or 2–16 waypoints within ${lo}…${hi}.`);
 return values.length===1?values[0] as number:values as number[];
}
function control(op:string,value:number|number[],duration:number){return op+(Array.isArray(value)?`${value.map(number).join('>')}'${number(duration)}`:number(value));}
function inherited(op:string,ramp:{start:number;end:number;points?:{value:number}[]}|undefined,duration:number){return ramp?control(op,ramp.points?ramp.points.map(p=>p.value):ramp.start===ramp.end?ramp.start:[ramp.start,ramp.end],duration):'';}
export function daughterCode(source:string,region:MutationRegion,seed:number,value:unknown,generation?:number){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Expected a JSON daughter object.');
 const d=value as Daughter,keys=Object.keys(d);if(keys.some(key=>!['parent','shift','level','onset','duration','index','pan','filter','rhythm','rest','timbre'].includes(key)))throw Error('Daughter accepts parent, shift, level, onset, duration, rhythm, rest, timbre, index, pan and filter only.');
 const score=compile(source,seed),parents=apomicticParents(source,region,seed),parent=parents[d.parent];
 if(!Number.isInteger(d.parent)||!parent)throw Error('Choose an available parent number.');
 for(const [key,lo,hi] of [['shift',-12,12],['level',0,9],['onset',0,score.duration],['duration',.001,score.duration]] as const){const n=d[key];if(typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi)throw Error(`${key} must be within ${lo}…${hi}.`);}
 if(d.onset+d.duration>score.duration+1e-8)throw Error('The daughter must fit inside the existing loop.');
 let rhythm=d.rhythm??[1];
 if(!Array.isArray(rhythm)||!rhythm.length||rhythm.length>8||rhythm.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<=0||v>8))throw Error('rhythm needs 1–8 positive proportions, at most 8 each.');
 const rest=d.rest??(generation===undefined?0:2);if(!Number.isInteger(rest)||rest<0||rest>9)throw Error('rest is a 0–9 silence-probability digit.');
 const mutation=region.parameters?.mutation??.08,birthEvery=3+Math.round((1-mutation)*2);
 const variants=parent.wave==='n'?['n1','n2','n3']:['s','t','a','q'];
 const maternal=parent.wave==='n'?'n'+parent.freq.start:parent.wave;
 const proposed=d.timbre??maternal;
 const timbre=generation!==undefined&&(generation+1)%birthEvery===0&&proposed===maternal?variants[(variants.indexOf(maternal)+1)%variants.length]:proposed;
 if(!['s','t','a','q','n1','n2','n3'].includes(timbre))throw Error('timbre uses s/t/a/q/n1/n2/n3.');
 const wave=timbre[0],noise=wave==='n';
 const ratio=2**(d.shift/12),frequency=(ramp:NoteEvent['freq'],noise=false)=>{
  const values=(ramp.points?.map(p=>p.value)??[ramp.start,ramp.end]).map(v=>noise?v:v*ratio);
  if(!noise&&values.some(n=>n<.1||n>12000))throw Error('The daughter frequency is outside the supported range.');
  return values.every(v=>v===values[0])?number(values[0]):`${values.map(number).join(ramp.exponential?'^':'>')}'${number(d.duration)}`;
 };
 const index=d.index===undefined?(parent.index.points?parent.index.points.map(p=>p.value):parent.index.start===parent.index.end?parent.index.start:[parent.index.start,parent.index.end]):pair(d.index,0,20,'index');
 const pan=d.pan===undefined?(parent.pan.points?parent.pan.points.map(p=>p.value):parent.pan.start===parent.pan.end?parent.pan.start:[parent.pan.start,parent.pan.end]):pair(d.pan,-1,1,'pan');
 const fm=!noise&&parent.modulation?':'+(parent.modulatorWave??'s')+frequency(parent.modulation)+control('i',index,d.duration):'';
 // One daughter capsule carries a proportional pulse motif, not unrelated notes.
 // Sustained daughters are the default; rhythmic subdivision is an occasional phenotype.
 const durationValue=generation===undefined?d.duration:Math.max(d.duration,Math.min(score.duration*.75,Math.max(.8,parent.dur*.8)));
 const onsetValue=Math.min(d.onset,Math.max(0,score.duration-durationValue));
 if(generation!==undefined&&(generation+1)%3!==0)rhythm=[1];
 const startTick=Math.round(onsetValue*10),endTick=Math.min(Math.floor(score.duration*10+1e-8),Math.round((onsetValue+durationValue)*10));
 if(endTick<=startTick)throw Error('The daughter needs at least 0.1 seconds on the one-decimal time grid.');
 const minPulseTicks=generation===undefined?1:Math.min(4,endTick-startTick);
 rhythm=rhythm.slice(0,Math.max(1,Math.min(rhythm.length,Math.floor((endTick-startTick)/minPulseTicks))));
 const sum=rhythm.reduce((a,b)=>a+b,0);let tick=startTick,weightAt=0;
 const pulses=rhythm.map((weight,slot)=>{weightAt+=weight;const next=slot===rhythm.length-1?endTick:Math.max(tick+minPulseTicks,Math.min(endTick-(rhythm.length-slot-1)*minPulseTicks,startTick+Math.round((endTick-startTick)*weightAt/sum))),duration=(next-tick)/10,onset=tick/10;tick=next;
  const freq=noise?timbre.slice(1):parent.wave==='n'?number(110*ratio):frequency(parent.freq);
  const pulseFm=fm.replace(/'[-\d.]+/g,"'"+number(duration));
  return `${onset?number(onset):''}${wave}${freq.replace(/'[-\d.]+/g,"'"+number(duration))}${pulseFm}v0>${number(d.level)}>0'${number(duration)}e${parent.envelope}'${number(duration)}${control('p',pan,duration)}${d.filter===undefined?inherited('f',parent.filter,duration):control('f',pair(d.filter,0,9,'filter'),duration)}${inherited('h',parent.chopRamp??(parent.chop===undefined?undefined:{start:parent.chop,end:parent.chop}),duration)}${inherited('d',parent.delay,duration)}${parent.reverb?'r'+number(parent.reverb):''}${rest?'~?'+rest:''}`;
 }).join('\n');
 if(generation===undefined)return compactAgentNumbers(pulses);
 let serial=generation,name='apo';do{name+=String.fromCharCode(97+serial%26);serial=Math.floor(serial/26);}while(serial);
 while(new RegExp('\\b'+name+'[ \t]*=').test(source))name+='a';
 return compactAgentNumbers(`${name}=(\n${pulses}\n)\n${name}`);
}
export function apomicticMessages(source:string,region:MutationRegion,seed:number,lastError='',generation=0){
 const score=compile(source,seed),levels=accretionLevels(source,region,seed),parents=apomicticParents(source,region,seed);
 if(!parents.length)throw Error('A needs an internal sound parent outside feedback returns.');
 const table=parents.map((p,i)=>({parent:i,wave:p.wave,Hz:p.freq.start,modulator:p.modulation?{wave:p.modulatorWave,Hz:p.modulation.start,index:p.index.start}:undefined,level:Math.max(p.volume.start,p.volume.end,...p.volume.points?.map(x=>x.value)??[]),pan:p.pan.start,duration:p.dur}));
 return [{role:'system' as const,content:`Compose one daughter voice by APOMIXIS. Write numbers with at most one decimal place (x.x); the host snaps pulse boundaries to 0.1 seconds. Inherit the chosen parent's identity and carrier/modulator ratio; a daughter may develop a related timbre without replacing her mother. Grow alongside all existing music. Choose musically meaningful somatic changes: FM index trajectory, transposition, onset (dormancy), pan trajectory and an audible intensity contour. The host writes the syNo syntax. DO NOT write syNo code, append, colons, or a complete patch.
Return ONLY JSON {"daughter":{"parent":0,"shift":0,"level":0.5,"onset":0.1,"duration":1,"index":[1.2,3.6],"pan":[-0.3,0.5]}}. This is the response shape; compose your own values. parent is a listed integer. shift is semitones -12..12, usually a small mutation or a fifth/octave dispersal. level must be ${levels.min.toFixed(3)}..${levels.max.toFixed(3)}, preferably ${levels.suggested.map(number).join('..')}. onset >= 0; duration >= ${levels.presence.toFixed(3)}; onset+duration <= ${number(score.duration)} seconds. index is optional 0..20, pan optional -1..1, filter optional 0..9 (use 4..9 to keep pitched material audible); each may be a number or an array of 2–16 waypoints, e.g. [1,7,2]. Use only the listed keys plus rhythm, rest and timbre. Sustained identity comes first: prefer one long evolving daughter gesture, occupying much of the loop. Do not turn every daughter into short repeated attacks. rhythm optionally gives 1–8 positive relative duration weights; the host permits subdivision only every third daughter, with pulses normally at least 0.4 seconds. Vary long contours, displacement and dormant rests; rhythm contrasts with sustained layers. rest is a 0–9 digit: 2 gives each daughter pulse a 20% chance of silence per loop, 5 gives 50%. Use moderate 1–4; preserve the original parent. timbre optionally chooses s/t/a/q/n1/n2/n3 as an inherited spectral mutation, not an unrelated new melody. If omitted, the host introduces a related timbral birth every 3–5 daughters depending on U. The host shapes a fade-in/fade-out contour. Change more than loudness.`},
 {role:'user' as const,content:`Parents: ${JSON.stringify(table)}\nN/U/D: ${JSON.stringify(region.parameters??{count:24,mutation:.08,spread:1})}. Daughter generation ${generation+1}. Choose a parent and develop a recognizable clonal gesture; prioritize sustained timbral identity, contrasting rhythmic variability and probabilistic silences. Keep an audible long contour; do not reduce this daughter to a uniform chain of tiny notes; U governs how adventurous the variation is, D its spatial spread.${lastError?' Last rejected proposal: '+lastError+'. Correct it.':''}\nReturn one daughter JSON object.`}];
}
