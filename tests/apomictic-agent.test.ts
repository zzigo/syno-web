import test from 'node:test';import assert from 'node:assert/strict';import {compile,eventData} from '../src/core/parser';import {validateAccretion} from '../src/core/accretion';import {daughterCode,parseDaughter,apomicticMessages,apomicticParents} from '../src/core/apomictic-agent';
const source="A143&(s165:s41.25i1.2v0.6e0254'1.2p-0.5 0.3t165:s41.25i1.8v0.4e0254'1.2p0.5)",region=compile(source).mutations![0];
const daughter={parent:0,shift:7,index:[1.2,3.6],level:.5,pan:[-.3,.5],onset:.1,duration:1.1};
test('AI daughter parameters serialize to valid FM and preserve every parent event',()=>{
 const code=daughterCode(source,region,3181,daughter),result=validateAccretion(source,region,code,3181);assert.equal(result.ok,true);if(!result.ok)return;
 const before=compile(source),after=compile(result.source),oldIds=new Set(before.events.map(e=>e.id)),child=after.events.find(e=>!oldIds.has(e.id))!;
 assert.deepEqual(after.diagnostics,[]);assert.ok(Math.abs(child.freq.start/child.modulation!.start-4)<1e-5);assert.equal(child.modulatorWave,'s');assert.equal(child.index.end,3.6);assert.equal(child.pan.end,.5);assert.equal(child.dur,1.1);assert.equal(child.t,.1);
 assert.deepEqual(eventData(after).filter((_,i)=>oldIds.has(after.events[i].id)),eventData(before));
 assert.deepEqual(parseDaughter(JSON.stringify({daughter})),daughter);
});
test('malformed FM strings, executable values and unknown keys cannot enter the serializer',()=>{
 for(const value of ['s330:v0.3t165',null,{...daughter,index:'v0.3'},{...daughter,parent:999},{...daughter,shift:Infinity},{...daughter,pan:[-2,1]},{...daughter,duration:2},{...daughter,append:'s330:v3'}])assert.throws(()=>daughterCode(source,region,3181,value));
 assert.equal(parseDaughter('{"append":"s330:v0.3t165"}'),undefined);assert.equal(parseDaughter('{"daughter":{"parent":0'),undefined);
});
test('daughter keeps the selected parent waveform; noise stays a noise-kind selector',()=>{
 const triangle=compile(daughterCode(source,region,3181,{...daughter,parent:1}));assert.deepEqual(triangle.diagnostics,[]);assert.equal(triangle.events[0].wave,'t');
 const patch="A143&(n2v0.6f5'1.5)",r=compile(patch).mutations![0],noise=compile(daughterCode(patch,r,3181,{...daughter,shift:12,filter:[5,8]}));assert.deepEqual(noise.diagnostics,[]);assert.equal(noise.events[0].wave,'n');assert.equal(noise.events[0].freq.start,2);assert.equal(noise.events[0].modulation,undefined);
});
test('A prompt requests composed parameters, not code punctuation or an edit-index menu',()=>{
 assert.equal(apomicticParents(source,region,3181).length,2);const messages=apomicticMessages(source,region,3181,'prior FM syntax was invalid');assert.match(messages[0].content,/DO NOT write syNo code/);assert.match(messages[0].content,/daughter/);assert.match(messages[1].content,/prior FM syntax/);assert.match(messages[1].content,/41.25/);assert.match(messages[1].content,/0.444/);
});
test('daughter pulses inherit a proportional rhythm, carry probability rests and allow timbral births',()=>{
 const rhythm=[1,.5,.5,2],code=daughterCode(source,region,3181,{...daughter,rhythm,rest:3,timbre:'q'}),checked=validateAccretion(source,region,code,3181);assert.equal(checked.ok,true,JSON.stringify(checked));
 const c=compile(code);assert.deepEqual(c.diagnostics,[]);assert.equal(c.events.length,4);assert.ok(c.events.every(e=>e.wave==='q'&&e.restGates?.[0].chance===.3));
 for(let i=0;i<rhythm.length;i++)assert.ok(Math.abs(c.events[i].dur-rhythm[i]*daughter.duration/4)<=.1);
 assert.ok(Math.abs(c.events.at(-1)!.t+c.events.at(-1)!.dur-(daughter.onset+daughter.duration))<1e-8);
 const birth=compile(daughterCode(source,region,3181,{...daughter,timbre:'s'},3));assert.ok(birth.events.every(e=>e.wave==='t'));assert.equal(birth.events.length,1);
 for(const bad of [{rhythm:[0,1]},{rhythm:[Infinity]},{rest:10},{rest:.5},{timbre:'code'}])assert.throws(()=>daughterCode(source,region,3181,{...daughter,...bad}));
 const prompt=apomicticMessages(source,region,3181,'',4).map(m=>m.content).join(' ');assert.match(prompt,/rhythmic variability/);assert.match(prompt,/20%/);assert.match(prompt,/timbr/);
});

test('a generated daughter is one named motif, so rhythmic cells do not exhaust the layer limit',()=>{const code=daughterCode(source,region,3181,daughter,0),checked=validateAccretion(source,region,code,3181);assert.equal(checked.ok,true,JSON.stringify(checked));if(checked.ok)assert.equal(checked.expressions,3);assert.match(code,/^apoa=/);assert.equal(compile(code).events.length,1);});

test('performance daughters develop a sustained identity; rhythmic variants avoid tiny fragments',()=>{const brief={...daughter,duration:.3,rhythm:[1,1,1,1,1],rest:2};const sustained=compile(daughterCode(source,region,3181,brief,0));assert.deepEqual(sustained.diagnostics,[]);assert.equal(sustained.events.length,1);assert.ok(sustained.events[0].dur>=.8);const rhythmic=compile(daughterCode(source,region,3181,brief,2));assert.deepEqual(rhythmic.diagnostics,[]);assert.ok(rhythmic.events.length<=3);assert.ok(rhythmic.events.every(e=>e.dur>=.4));assert.ok(rhythmic.events.every(e=>e.t+e.dur<=compile(source).duration+1e-8));});
