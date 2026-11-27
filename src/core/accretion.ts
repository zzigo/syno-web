import {agentNumber,compactAgentNumbers} from './agent-numbers';
import {compile,eventData} from './parser';
import {filterHz} from '../audio/effects';
import type {MutationRegion} from './mutation';
/** Model output is a data-only insertion. Existing text and musical events are immutable. */
export function parseAddition(text:string):string|undefined {
 try{const value=JSON.parse(text);return typeof value.append==='string'&&value.append.trim()?value.append.trim():undefined;}catch{
  const match=text.match(/^\s*\{\s*"append"\s*:\s*("(?:[^"\\]|\\.)*")/);
  if(match)try{const value=JSON.parse(match[1]);return typeof value==='string'&&value.trim()?value.trim():undefined;}catch{}
  return undefined;
 }
}
export function accretionCapacity(source:string,region:MutationRegion,seed:number,limit=12){
 const score=compile(source,seed);
 const expressions=new Set(score.events.filter(e=>e.from>=region.from&&e.to<=region.to).map(e=>`${e.from}:${e.to}`)).size;
 return {expressions,limit,full:expressions>=limit||score.events.length>=512};
}
export function accretionLevels(source:string,region:MutationRegion,seed:number){
 const score=compile(source,seed),events=score.events.filter(e=>e.from>=region.from&&e.to<=region.to),peak=Math.max(.1,...events.map(e=>Math.max(e.volume.start,e.volume.end,...e.volume.points?.map(p=>p.value)??[])));
 return {min:Math.max(.01,Math.min(.3,peak*.15)),max:Math.max(.5,Math.min(3,peak*1.25)),suggested:[Math.max(.1,peak*.5),Math.min(3,peak)],presence:Math.min(.5,score.duration*.15)};
}
export function validateAccretion(source:string,region:MutationRegion,addition:string,seed:number,limit=12){
 addition=compactAgentNumbers(addition);
 const reject=(error:string)=>({ok:false as const,error});
 if(!addition.trim()||addition.length>6000)return reject('Write 1–6000 characters of new syNo material.');
 const before=compile(source,seed);if(before.diagnostics.length)return reject('The current score must be valid.');
 const insert='\n'+addition.trim()+'\n',candidate=source.slice(0,region.to)+insert+source.slice(region.to);
 if(candidate.length>64000)return reject('The score has reached its text limit.');
 const after=compile(candidate,seed);if(after.diagnostics.length)return reject(after.diagnostics[0].message);
 const enlarged=after.mutations?.find(r=>r.from===region.from&&r.to===region.to+insert.length&&r.algorithm===region.algorithm&&r.agent===region.agent);
 if(!enlarged||after.mutations?.length!==before.mutations?.length)return reject('The addition must stay inside the original mutable growth scope.');
 if(after.seed!==before.seed||after.period!==before.period||Math.abs(after.duration-before.duration)>1e-8)return reject('Keep the original seed, loop duration and pulse. Use shorter new layers.');
 if(after.events.length>512||after.duration>120)return reject('Growth reached the event or duration budget.');
 if(after.feedback.length!==before.feedback.length)return reject('Add voices, not a new feedback circuit.');
 const previous=eventData(before),next=eventData(after),byId=new Map(after.events.map((e,i)=>[e.id,i]));
 for(let i=0;i<before.events.length;i++){
  const index=byId.get(before.events[i].id);
  if(index===undefined||JSON.stringify(previous[i])!==JSON.stringify(next[index]))return reject('The addition changes existing music. Earlier voices, effects and timing must remain intact.');
 }
 const ids=new Set(before.events.map(e=>e.id)),added=after.events.filter(e=>!ids.has(e.id));
 const identity=(event:ReturnType<typeof eventData>[number])=>{const {volume,...music}=event;return JSON.stringify(music,(_key,value)=>typeof value==='number'?Number(agentNumber(value)):value);};
 const known=new Set(previous.map(identity));
 for(const event of after.events.map((e,i)=>({event:e,music:next[i]})).filter(({event})=>!ids.has(event.id))){const key=identity(event.music);if(known.has(key))return reject('Do not duplicate an existing voice with only a volume change. Change pitch, timbre, rhythm, pan or effects.');known.add(key);}
 if(!added.length||!added.some(e=>Math.max(e.volume.start,e.volume.end,...e.volume.points?.map(p=>p.value)??[])>0))return reject('Add at least one audible new event.');
 if(added.some(e=>e.inputChannel||e.feedbackBus!==undefined))return reject('New layers must use internal sound atoms outside feedback returns.');
 const levels=accretionLevels(source,region,seed),peaks=added.map(e=>Math.max(e.volume.start,e.volume.end,...e.volume.points?.map(p=>p.value)??[]));
 if(peaks.some(v=>v>levels.max))return reject(`New layer volume must be at most v${levels.max.toFixed(2)}, relative to the existing voices.`);
 const audible=added.map((e,i)=>{const cutoff=e.filter?filterHz(Math.max(e.filter.start,e.filter.end,...e.filter.points?.map(p=>p.value)??[]),48000):Infinity;return peaks[i]*(e.wave==='n'?1:Math.min(1,(cutoff/Math.min(e.freq.start,e.freq.end))**2));});
 if(!audible.some(v=>v>=levels.min)||added.reduce((total,e)=>total+e.dur,0)<levels.presence)return reject('The addition is too quiet or too brief to form an audible layer. Match the existing voice levels, keep the filter open enough for its fundamental, and develop the gesture.');
 const capacity=accretionCapacity(candidate,enlarged,seed,limit);if(capacity.expressions>limit)return reject('Growth reached its sound-expression limit.');
 return {ok:true as const,source:candidate,addedEvents:added.length,expressions:capacity.expressions};
}
/** Reject an incompatible envelope as soon as its first key is streamed. Never interpret prose as music. */
export function additionProtocolError(text:string,expected:'append'|'daughter'='append'):string|undefined {
 const first=text.match(/^\s*\{\s*"((?:[^"\\]|\\.)*)"\s*:/);
 if(!first)return undefined;
 let key:string;try{key=JSON.parse('"'+first[1]+'"');}catch{return undefined;}
 if(key!==expected)return `Expected {"${expected}":${expected==='append'?'"syNo code"':'{...}'}}; received key "${key.slice(0,60)}". Return executable notation data, not a song description or metadata. No music was changed.`;
 return undefined;
}
/** A compact real language contract, rather than a menu of precomputed edits. */
export function accretionMessages(body:string,algorithm:string,duration:number,remaining:number,lastError='',controls?:MutationRegion['parameters'],model=''){
 const region={from:0,to:body.length,algorithm:'A' as const,agent:true},levels=accretionLevels(body,region,3181),parent=compile(body).events.find(e=>e.modulation)||compile(body).events.find(e=>e.wave!=='n');
 const characters:Record<string,string>={A:'APOMIXIS: choose ONE existing voice as a clonal parent, retain its recognizable waveform/FM ratio and contour; grow a complete audible daughter gesture. Somatic mutation varies one or two dimensions (FM index, filter contour, onset or register). Dormancy changes onset; rare dispersal uses a fifth or octave. Never simply halve volume or append an unrelated short beep.',G:'PHYLLOTAXIS: progressively distribute related voices in pitch, pan and onset around a shared motif.',S:'STOLON: extend a connected runner gesture, then grow a related offshoot with a displaced onset.',H:'APICAL DOMINANCE: retain the leading voice and develop a subordinate lateral branch with contrasting register.',R:'TROPISM: bend a related voice toward a pitch/filter/pan target with a continuous trajectory.',K:'COLONISATION: fill an unoccupied register, rhythmic gap or stereo region with connected material.',L:'L-SYSTEM: grow a coherent related phrase beside the preserved grammar, not an unrelated isolated note.'};
 if(/smollm/i.test(model)){
  const goals:Record<string,string>={G:'distribute a related voice across pitch and pan',S:'extend a phrase with a delayed offshoot',H:'add a softer side voice below the lead',R:'bend pitch or pan smoothly toward a target',K:'fill a gap in register, time or pan',L:'add a related branching phrase',A:'add a related daughter voice'};
  const seconds=Math.max(.001,Math.min(duration,Math.max(levels.presence,.5))),gain=levels.suggested[0].toFixed(3),hz=parent?.freq.start??220,wave=parent?.wave??'s';
  return [
   {role:'system' as const,content:`You edit executable syNo notation. Output exactly one JSON object with one key "append" whose value is a string of NEW syNo code. No other keys. Never output content, name, genre, type, description, lyrics or a song summary. Preserve the existing music; your code is appended beside it.
Grammar: s/t/a/q followed by Hz are sine/triangle/saw/square; n1/n2/n3 are noise. v is volume, p is pan (-1..1), f is filter (4..9), r reverb (0..9), h chopper (0..9). Apostrophe sets duration in seconds. > makes a continuous transition: p-0.5>0.5'1. e0 bypasses ADSR. FM syntax: s220:s55i2. Whitespace separates simultaneous voices. A numeric prefix delays onset: 0.1s220.
Write ONE audible, related voice with changed pitch, pan or timbre, explicit v${levels.min.toFixed(3)}..${levels.max.toFixed(3)} and duration at least ${levels.presence.toFixed(3)} seconds. Onset + duration <= ${duration} seconds. Do not repeat an existing voice with only a volume change. No headers, definitions, parentheses, agent markers or new growth commands.
Output shape example: ${JSON.stringify({append:`${wave}${hz}v${gain}e0'${seconds}p-0.5>0.5'${seconds}`})}. Compose your own values.`},
   {role:'user' as const,content:`Task: ${goals[algorithm]??'add a related musical layer'}. ${controls?`Variation ${controls.mutation.toFixed(3)}; spread ${controls.spread.toFixed(3)}.`:''}
Existing syNo (keep):
${body}
${lastError?'Correction required: '+lastError+'\n':''}Return only {"append":"new syNo code"}.`}
  ];
 }
 return [
 {role:'system' as const,content:`You compose syNo by ACCRETION: write new musical layers beside the existing music, never replace it. Use at most one decimal place in generated syNo numbers (x.x). Return ONLY JSON {"append":"new syNo code"}. No markdown. The append string is inserted at the END of the provided parenthesized region. Do not repeat the existing code or close that region. A quieter copy is NOT a new layer: change pitch, timbre, rhythm, pan or effects.
LANGUAGE: s=sine, t=triangle, a=sawtooth, q=square; followed by Hz 20..12000. n1/2/3=white/pink/brown noise. Modifiers: v0..9 gain (NEW VOICES MUST EXPLICITLY USE v${levels.min.toFixed(2)}..${levels.max.toFixed(2)}; aim near v${levels.suggested.map(v=>v.toFixed(2)).join("..")}, relative to the parents), p-1..1 pan, f0..9 lowpass, r0..9 reverb, d0.001..9 echo, h0..9 chopper. e0254 ADSR, e0 bypass. Apostrophe sets seconds: t330v0.2e0254'0.3p0.5. A numeric prefix offsets onset: 0.2s440v0.1'0.2. Colon introduces FM: t330:s82.5i2v0.15'0.3. > and < interpolate parameters, independently timed with apostrophe. Whitespace separates simultaneous expressions. Lists s[220 330 ~ 440] subdivide rhythm; nested [ ] subdivide again; ~ rests. n-prefixed list positions use the current tuning; Hz lists are always valid. Multi-letter definitions: motif=(t330v0.1'0.3), invoke motif. Parentheses repeat finite groups: (s330v0.1'0.2)3. Keep all expression names unique. No new growth headers, agent markers, tempo declarations, input atoms, feedback circuits or global settings. Do not use JavaScript.
Add ONE developed audible layer or TWO complementary layers. Avoid tiny, nearly silent isolated beeps. Use contours or a small rhythmic cell to develop the parent material. Use only a few meaningful modifiers, not a catalogue of effects. Always write an explicit note duration. For pitched daughters omit f or use f4..9 so the filter does not erase the fundamental. ${parent?`A suitable parent has carrier ${parent.freq.start} Hz${parent.modulation?` and modulator ${parent.modulation.start} Hz`:""}, v${parent.volume.start}. Preserve this lineage or transpose the related frequencies together while developing a complete contour.`:"Develop the existing noise or timbral gesture."} Total new note time must be at least ${levels.presence.toFixed(2)} seconds. Keep previous material clearly audible. Total onset+duration of all new material must fit within ${duration} seconds so the loop never changes length. At most ${remaining} new sound expressions. Example valid response: {"append":"t330v0.1e0254'0.2p0.5"}. Compose your own coherent addition. Respond with real code, not a mutation choice/index.`},
 {role:'user' as const,content:`Growth character: ${characters[algorithm]??algorithm}. ${controls?`Controls: N=${controls.count} lineage steps, U=${controls.mutation.toFixed(3)} somatic variation, D=${controls.spread.toFixed(3)} spatial spread. Respect these characteristics without adding a static growth header.`:""} Current music to KEEP unchanged:\n${body}\nCompose new material that grows from its timbre, pitches or rhythm, while leaving room for all existing layers.${lastError?' Previous proposal was rejected: '+lastError+'. Correct that problem.':''} Return {"append":"..."}.`}
 ];}
