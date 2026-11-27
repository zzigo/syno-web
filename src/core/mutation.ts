import {compactAgentNumbers} from './agent-numbers';
import {compile,eventData} from './parser';
import {numberRoles} from './number-roles';
import {createGenerator} from '../vendor/fold-generators.js';
export type MutationAlgorithm='G'|'A'|'S'|'H'|'R'|'K'|'L';
export interface MutationRegion {from:number;to:number;algorithm:MutationAlgorithm;agent:boolean;parameters?:{count:number;mutation:number;spread:number}}
const modes={G:'phyllotaxis',A:'apomixis',S:'stolon',H:'apical',R:'tropism',K:'colonisation'} as const;
export function mutateLocal(source:string,region:MutationRegion,seed:number,generation:number){
 const score=compile(source,seed);if(score.diagnostics.length)return undefined;
 if(region.algorithm==='L')return mutateGrammar(source,region,seed,generation);
 const settings=region.parameters;
 const generator=createGenerator(modes[region.algorithm],{mu:settings?.mutation??.15,spread:settings?.spread??1,cap:128,seeds:2},(seed+generation*997)>>>0);
 let point:{x:number;y:number;z:number}|undefined;for(let i=0;i<1+generation%(settings?.count??24);i++){const step=generator.step();point=step.born.at(-1)??point;}for(let i=0;!point&&i<32;i++)point=generator.step().born.at(-1);if(!point)return undefined;
 const ranges=[...new Map(score.events.filter(e=>e.soundRange&&e.soundRange.from>=region.from&&e.soundRange.to<=region.to).map(e=>[`${e.soundRange!.from}:${e.soundRange!.to}`,e.soundRange!])).values()];
 if(!ranges.length)return undefined;const picked=ranges[Math.min(ranges.length-1,Math.floor((point.x+1)*.5*ranges.length))],text=source.slice(picked.from,picked.to);
 const candidates:{from:number;to:number;text:string;label:string}[]=[];
 for(const role of numberRoles(source).filter(r=>r.from>=picked.from&&r.to<=picked.to)){
  if(role.kind==='pitch'){const prefix=role.text.match(/^[+-]+/)?.[0]??'',n=Number(role.text.slice(prefix.length));if(Number.isInteger(n)&&n>=1)candidates.push({from:role.from,to:role.to,text:prefix+Math.max(1,Math.min(32,n+(point.y>=0?1:-1))),label:'pitch position'});}
  if(role.kind==='frequency'){const n=Number(role.text);if(n>=20)candidates.push({from:role.from,to:role.to,text:(Math.max(20,Math.min(4000,n*2**(((point.y>=0?1:-1)*(1+Math.round(Math.abs(point.y)*4)))/12)))).toFixed(1),label:'frequency'});}
 }
 for(const match of text.matchAll(/([vfhpi])(-?(?:\d+(?:\.\d*)?|\.\d+))/g)){const old=Number(match[2]),control=match[1],delta=(point.z>=0?1:-1)*Math.max(.35,Math.abs(point.z))*(control==='p'?.6:control==='v'?.3:control==='i'?2:1.5),value=Math.max(control==='p'?-1:0,Math.min(control==='p'?1:control==='v'?2:control==='i'?20:9,old+delta));candidates.push({from:picked.from+match.index!+1,to:picked.from+match.index!+match[0].length,text:value.toFixed(1),label:control});}
 const cells=numberRoles(source).filter(r=>r.from>=picked.from&&r.to<=picked.to&&(r.kind==='pitch'||r.kind==='frequency')&&source.lastIndexOf('[',r.from)>picked.from);
 if(generation%5===4&&cells.length&&cells.length<24){const cell=cells[Math.floor(cells.length/2)];candidates.unshift({from:cell.to,to:cell.to,text:' '+cell.text,label:'add cell'});}
 if(generation%7===6&&cells.length>3){const cell=cells.at(-1)!;candidates.unshift({from:cell.from,to:cell.to,text:'',label:'subtract cell'});}
 // Occasional small branch insertion/removal; only standalone chains, never definitions or headers.
 const standalone=ranges.filter(r=>{const before=source.slice(Math.max(region.from,source.lastIndexOf('\n',r.from-1)+1),r.from).trim();return !before;});
 if(generation%5===4&&standalone.length&&ranges.length<8){const r=standalone[generation%standalone.length],original=source.slice(r.from,r.to),roles=numberRoles(source).filter(role=>role.from>=r.from&&role.to<=r.to&&(role.kind==='frequency'||role.kind==='pitch'));let copy=original;for(const role of roles.slice().reverse()){const n=Number(role.text);if(!Number.isFinite(n))continue;const value=role.kind==='frequency'?Math.max(20,Math.min(12000,n*[1.5,2,.75][generation%3])).toFixed(1):String(Math.max(1,n+2));copy=copy.slice(0,role.from-r.from)+value+copy.slice(role.to-r.from);}copy=copy.replace(/v([\d.]+)/,(_,v)=>'v'+Math.min(.5,Number(v)*.5).toFixed(1));candidates.unshift({from:region.to,to:region.to,text:'\n'+copy+'\n',label:'add branch'});}
 if(generation%7===6&&standalone.length>1){const r=standalone.at(-1)!;candidates.unshift({from:r.from,to:r.to,text:'',label:'subtract branch'});}
 const offset=candidates[0]?.label.match(/branch|cell/)?0:Math.min(candidates.length-1,Math.max(0,Math.floor((point.y+1)*.5*candidates.length)));for(let i=0;i<candidates.length;i++){const raw=candidates[(offset+i)%candidates.length],edit={...raw,text:compactAgentNumbers(raw.text)};if(source.slice(edit.from,edit.to)===edit.text)continue;const next=source.slice(0,edit.from)+edit.text+source.slice(edit.to);if(next.length>64000)continue;const checked=compile(next,seed);if(!checked.diagnostics.length&&checked.events.length<=512&&checked.duration<=120&&JSON.stringify(eventData(checked))!==JSON.stringify(eventData(score)))return {source:next,description:`${region.algorithm} · ${edit.label} · generation ${generation+1}`};}
 return undefined;
}

/** Diverse, musically distinct options; never bounce into a recent patch. */
export function directedOptions(source:string,region:MutationRegion,seed:number,generation:number,recent:string[]=[]){
 const blocked=new Set([source,...recent].map(text=>compile(text,seed).canonical));
 const pool=[...new Map(Array.from({length:40},(_,i)=>mutateLocal(source,region,seed,generation+i)).filter((r):r is NonNullable<typeof r>=>!!r).filter(r=>!blocked.has(compile(r.source,seed).canonical)).map(r=>[r.source,r])).values()];
 const buckets=new Map<string,typeof pool>();
 for(const option of pool){const label=option.description.split(' · ')[1];if(label==='v')continue;const bucket=buckets.get(label)??[];bucket.push(option);buckets.set(label,bucket);}
 const groups=[...buckets.values()],options:typeof pool=[];
 for(let row=0;row<2;row++)for(let j=0;j<groups.length;j++){const option=groups[(j+generation)%groups.length][row];if(option&&options.length<8)options.push({...option,description:option.description.replace(/generation \d+$/,`generation ${generation+1}`)});}
 return options;
}

/** Accept only an explicit bounded edit index; supports incremental JSON streaming. */
export function decisionIndex(text:string,count:number):number|undefined {
 let index:unknown;
 try{const value=JSON.parse(text);index=typeof value==='number'?value:typeof value.edit==='number'?value.edit:value.edit?.index;}catch{const match=text.match(/^\s*\{\s*"edit"\s*:\s*(?:\{\s*"index"\s*:\s*)?(\d+)(?=\s*[,}\n])/);if(match)index=Number(match[1]);}
 return typeof index==='number'&&Number.isInteger(index)&&index>=0&&index<count?index:undefined;
}

/** Rewrite the grammar itself, not just the pitches invoked by its symbols. */
function mutateGrammar(source:string,region:MutationRegion,seed:number,generation:number){
 const score=compile(source,seed),traces=score.lSystems.filter(t=>t.from>=region.from&&t.to<=region.to);
 const edits:{from:number;to:number;text:string;label:string}[]=[];
 for(const trace of traces){
  const rules=trace.rules as (typeof trace.rules[number]&{from:number;to:number})[];
  const letters=[...new Set(rules.flatMap(r=>[r.symbol,...r.replacement.match(/[A-Z]/g)??[]]))];
  for(const rule of rules){
   if(!Number.isInteger(rule.from)||!Number.isInteger(rule.to))continue;
   const from=rule.from+2,old=source.slice(from,rule.to),symbol=letters[(seed+generation)%letters.length]??rule.symbol;
   const options=[{text:old+symbol,label:'extend rule'}, {text:old+`[+${symbol}]`,label:'grow branch'}, {text:old.replace(/\[[^\[\]]+\]/,''),label:'prune branch'}, {text:old.replace(/[+-]/,c=>c==='+'?'-':'+'),label:'turn branch'}, {text:old.replace(/[A-Z]/,symbol),label:'change symbol'}];
   for(const option of options)if(option.text!==old)edits.push({from,to:rule.to,...option});
  }
 }
 for(let i=0;i<edits.length;i++){
  const edit=edits[(generation+i)%edits.length],next=source.slice(0,edit.from)+edit.text+source.slice(edit.to);
  if(next.length>64000)continue;const checked=compile(next,seed);
  if(!checked.diagnostics.length&&checked.events.length>0&&checked.events.length<=512&&checked.duration<=120&&JSON.stringify(checked.lSystems)!==JSON.stringify(score.lSystems))return {source:next,description:`L · ${edit.label} · generation ${generation+1}`};
 }
 return undefined;
}
