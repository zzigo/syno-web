import type {NoteEvent} from '../core/types';
const names:Record<string,string>={p:'PAN',o:'FREQUENCY',v:'INTENSITY',f:'FILTER',r:'REVERB',h:'CHOPPER',d:'DELAY',i:'FM INDEX',g:'GENERATORS',_:'UNMAPPED'};
/** Use compiled routing, including lexical scope and held manual pan, not editor regexes. */
export function cubeAxes(events:NoteEvent[]){
 const growth=events.filter(e=>e.node),maps=[...new Set(growth.map(e=>e.axisMap??'pov'))];
 if(!maps.length)maps.push('pov');
 const labels=[0,1,2].map(axis=>{
  const targets=growth.length?growth.map(e=>({target:(e.axisMap??'pov')[axis]??'_',held:e.axisHolds?.[axis]})):maps.map(map=>({target:map[axis]??'_',held:undefined}));
  const descriptions=[...new Set(targets.map(({target,held})=>`${target} ${names[target]??target}${held?' ('+held+')':''}`))];
  return `${'XYZ'[axis]} · ${descriptions.join(' / ')}`;
 }) as [string,string,string];
 return {labels,summary:maps.map(map=>'@'+map).join(' · ')};
}
