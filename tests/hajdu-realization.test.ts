import test from'node:test';import assert from'node:assert/strict';import{readFileSync,existsSync}from'node:fs';import{homedir}from'node:os';import{join}from'node:path';import{compile}from'../src/core/parser';import{presets}from'../src/core/presets';
const source=readFileSync(new URL('../library/pieces/Studie-II-Hajdu.syn',import.meta.url),'utf8');
test('Hajdu realization is compact, has 380 five-sine objects and preserves high components',()=>{
 const s=compile(source);assert.deepEqual(s.diagnostics,[]);assert.equal(s.events.length,1900);assert.equal(s.duration,175.527);assert.equal(s.outputBuses.length,1);assert.deepEqual(s.outputBuses[0].effects.map(e=>e.kind),['reverb','volume']);assert.ok(Math.max(...s.events.map(e=>e.freq.start))>17249);assert.ok(source.length<20000);
 const groups=new Map<number,typeof s.events>();for(const e of s.events)groups.set(e.from,[...groups.get(e.from)??[],e]);assert.equal(groups.size,380);assert.ok([...groups.values()].every(events=>events.length===5));
 assert.equal(presets.find(p=>p.file==='pieces/Studie-II-Hajdu.syn')?.category,'Pieces');assert.ok(presets.some(p=>p.file==='pieces/After-Studie-II.syn'));
});
const local=process.env.HAJDU_MAX_PATH??join(homedir(),"Library/Application Support/Cycling '74/Max 9/Examples/synths/very-special-guest/stockhausen-studie-II.maxpat");
test('all translated pitches, dynamics, gates, onsets and family counts match the supplied Max event table',{skip:!existsSync(local)},()=>{
 function* children(p:any):Generator<any>{for(const {box}of p.boxes??[])if(box.patcher){yield box;yield*children(box.patcher);}}
 const patch=JSON.parse(readFileSync(local,'utf8')).patcher,player=[...children(patch)].find(b=>b.text==='p score-player').patcher,rows=player.boxes.find((b:any)=>b.box.coll_data).box.coll_data.data;
 const s=compile(source),groups=new Map<number,typeof s.events>();for(const e of s.events)groups.set(e.from,[...groups.get(e.from)??[],e]);let ms=0;
 const objects=[...groups.values()].sort((a,b)=>a[0].t-b[0].t||a[0].from-b[0].from);assert.equal(objects.length,rows.length);
 rows.forEach((row:any,i:number)=>{const[mix,root,a0,a1,duration,delta]=row.value;objects[i].sort((a,b)=>a.freq.start-b.freq.start).forEach((e,j)=>{assert.ok(Math.abs(e.t-ms/1000)<1e-9);assert.equal(e.dur,Math.floor(duration/76.2*1000+.5)/1000);assert.ok(Math.abs(e.freq.start-root*5**(j*mix/25))<1e-5);assert.ok(Math.abs(e.volume.start-9*10**(a0/20))<1e-9);assert.ok(Math.abs(e.volume.end-9*10**(a1/20))<1e-9);assert.equal(e.volume.duration,e.dur);assert.equal(e.pan.start,(mix-3)/2);});ms+=Math.floor(delta/76.2*1000+.5);});
});
