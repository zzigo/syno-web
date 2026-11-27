import test from 'node:test';import assert from 'node:assert/strict';import {compile,eventData} from '../src/core/parser';import {cubeAxes} from '../src/visuals/axis-labels';
test('compact attached mappings support delay, reverb and filter with real axis values',()=>{
 const compact=compile("G123@drf s165v0.6'0.1"),spaced=compile("G123 @drf s165v0.6'0.1");assert.deepEqual(compact.diagnostics,[]);assert.deepEqual(eventData(compact),eventData(spaced));assert.ok(compact.events.length>1);
 for(const e of compact.events){assert.equal(e.axisMap,'drf');assert.equal(e.freq.start,165,'explicit remapping replaces the default pitch route');assert.equal(e.pan.start,0,'default pan no longer survives a different explicit X route');assert.ok(e.delay);assert.ok(e.filter);assert.ok(Math.abs(e.reverb-(e.node!.y+1)*4.5)<1e-9);assert.equal(e.filter!.start,(e.node!.z+1)*4.5);}
 assert.deepEqual(cubeAxes(compact.events).labels,['X · d DELAY','Y · r REVERB','Z · f FILTER']);
});
test('attached scoped mappings do not leak into following growths or ordinary notes',()=>{
 const score=compile("G123@drf(s165v0.6'0.1) A123@pov(t220v0.6'0.1) q440'0.1");assert.deepEqual(score.diagnostics,[]);assert.ok(score.events.some(e=>e.axisMap==='drf'));assert.ok(score.events.some(e=>e.axisMap==='pov'));assert.equal(score.events.find(e=>e.wave==='q')!.node,undefined);assert.equal(score.events.find(e=>e.wave==='q')!.axisMap,undefined);
 const axes=cubeAxes(score.events);assert.match(axes.labels[0],/DELAY.*PAN/);assert.match(axes.labels[1],/REVERB.*FREQUENCY/);assert.match(axes.labels[2],/FILTER.*INTENSITY/);
 const agent=compile("G123@drf&(s165v0.6'0.1)");assert.deepEqual(agent.diagnostics,[]);assert.equal(agent.mutations![0].agent,true);assert.equal(agent.mutations![0].parameters!.count,2);
});
test('axis tracking follows defaults, explicit held pan, noise and overwritten routes',()=>{
 assert.deepEqual(cubeAxes(compile("G123 s165'0.1").events).labels,['X · p PAN','Y · o FREQUENCY','Z · v INTENSITY']);
 for(const [source,map] of [["G123@pov s165p0.4'0.1",'pov'],["G123@pov n2'0.1",'pov'],["G123@oof s165'0.1",'oof']]){const score=compile(source);assert.deepEqual(score.diagnostics,[]);assert.ok(score.events.every(e=>e.axisMap===map),source);}
 assert.match(cubeAxes(compile("G123 s165p0.4'0.1").events).labels[0],/PAN \(manual\)/);
 assert.ok(compile("G123@pov n2'0.1").events.every(e=>e.freq.start===2),'frequency routing does not change the noise-kind selector');
 assert.deepEqual(cubeAxes(compile("s165'0.1").events).labels,['X · p PAN','Y · o FREQUENCY','Z · v INTENSITY']);
 const routed=compile("G123@drf s165'0.1");assert.ok(eventData(routed).every(e=>!('axisMap' in e)),'visual tracking metadata stays out of backend event comparisons');
});
