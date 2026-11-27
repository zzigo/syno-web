import {compile,eventData} from './parser';
import {audibleIdentity} from './audible-identity';
/** Full-score proposals may retain deliberate existing unisons, but cannot add duplicate descendants. */
export function duplicateProposalDescendant(beforeSource:string,afterSource:string,seed:number){
 const before=compile(beforeSource,seed),after=compile(afterSource,seed);if(after.diagnostics.length)return;
 const oldData=eventData(before),data=eventData(after),oldCounts=new Map<string,number>();
 before.events.forEach((e,i)=>{const key=audibleIdentity(e,oldData[i]);oldCounts.set(key,(oldCounts.get(key)??0)+1);});
 for(const region of after.mutations?.filter(r=>r.agent)??[]){const seen=new Map<string,number>();
  after.events.forEach((e,i)=>{if(e.from<region.from||e.to>region.to)return;const key=audibleIdentity(e,data[i]);seen.set(key,(seen.get(key)??0)+1);});
  for(const [key,count]of seen)if(count>Math.max(1,oldCounts.get(key)??0))return 'Rejected duplicate descendant in the proposed agent scope. Change its audible gesture before applying.';
 }
}
