import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{compile,eventData}from'../src/core/parser';import{rampValueAt}from'../src/core/curves';
const read=(name:string)=>readFileSync(new URL('../library/pieces/'+name+'.syn',import.meta.url),'utf8');
test('After Studie I is a new forty-two second additive form with independently shaped pure components',()=>{
 const source=read('After-Studie-I'),s=compile(source);assert.deepEqual(s.diagnostics,[]);assert.equal(s.duration,42);assert.equal(s.events.length,44);assert.ok(s.events.every(e=>e.wave==='s'&&!e.modulation&&e.envelope==='off'&&e.volume.points?.at(-1)?.value===0));assert.deepEqual(eventData(s),eventData(compile(source)));
});
test('After Studie II admits only chamber tails after the five dry slices have finished',()=>{
 const s=compile(read('After-Studie-II'));assert.deepEqual(s.diagnostics,[]);assert.ok(Math.abs(s.duration-37.05)<1e-8);assert.equal(s.outputBuses.length,15);assert.equal(s.events.length,75);assert.equal(s.feedback.length,0);
 s.outputBuses.forEach((bus,i)=>{const events=s.events.filter(e=>e.outputBus===bus.id),ramp=bus.effects[1].ramp!;assert.equal(events.length,5);assert.deepEqual(bus.effects.map(e=>e.kind),['reverb','volume']);const width=[1,3,5,2,4][Math.floor(i/3)];events.forEach((event,j)=>{assert.ok(Math.abs(event.t-bus.t-j*.0555)<1e-9);assert.ok(Math.abs(event.freq.start/events[0].freq.start-5**(j*width/25))<1e-8);assert.equal(event.reverb,0);});const dryEnd=Math.max(...events.map(e=>e.t+e.dur))-bus.t;assert.ok(dryEnd<.278);assert.equal(rampValueAt(ramp,dryEnd),0);assert.equal(rampValueAt(ramp,bus.dur/4),0);assert.ok(rampValueAt(ramp,bus.dur/2)>0);});
});

test('Reich remains a rotating transport-loop piece after the folder move',async()=>{
 const {presets}=await import('../src/core/presets');const p=presets.find(p=>p.file==='pieces/Reich-future.syn');assert.equal(p?.category,'Pieces');assert.equal(p?.loop,true);assert.deepEqual(compile(p!.code).diagnostics,[]);assert.ok(p!.code.includes('!f6:48 reichp 1'));assert.ok(!presets.some(p=>p.file==='sequences/Reich-future.syn'));
});
