import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,eventData} from '../src/core/parser';
import {durationForCycle} from '../src/core/timbre';
test('the proposed random-pitch/random-duration score compiles with independent bounded draws',()=>{
 const source="s?[110:880]v2e0254'?",a=compile(source,3181),b=compile(source,3181);
 assert.deepEqual(a.diagnostics,[]);assert.deepEqual(eventData(a),eventData(b));const e=a.events[0];
 assert.deepEqual(e.durationRange,[.1,2]);assert.ok(e.dur>=.1&&e.dur<=2);assert.equal(e.dur,durationForCycle([.1,2],3181,0,0));assert.equal(a.duration,e.dur);
 const durations=Array.from({length:12},(_,cycle)=>compile(source,3181,cycle).events[0].dur);assert.equal(new Set(durations).size,12);
 assert.notEqual(e.dur,compile(source,7).events[0].dur);
 assert.equal(compile("s220v2'?",3181).events[0].dur,e.dur,'pitch does not consume the duration random stream');
});
test('finite sequences advance by actual durations, and time choices work in noise and functions',()=>{
 const source="tone=n2v0.2e0254'?[0.1:0.8]\n(tone)4",s=compile(source);
 assert.deepEqual(s.diagnostics,[]);assert.equal(s.events.length,4);let t=0;for(const e of s.events){assert.ok(Math.abs(e.t-t)<1e-9);assert.ok(e.dur>=.1&&e.dur<=.8);t+=e.dur;}assert.equal(s.duration,t);
 assert.notDeepEqual(s.events.map(e=>e.t),compile(source,3181,1).events.map(e=>e.t));
 assert.equal(compile("s220'?[0.4:0.4]").duration,.4);
});
test('random durations reject invalid bounds and preserve source ranges and ordinary durations',()=>{
 for(const src of ["s220'?[0:1]","s220'?[2:1]","s220'?[0.1:90000]","s220'?[0.1 2"]){assert.ok(compile(src).diagnostics.length,src);}
 const src="2s220v2'?[0.1:0.4]",e=compile(src).events[0];assert.equal(src.slice(e.from,e.to),src);assert.equal(e.t,2);
 assert.equal(compile("s220'0.4").events[0].dur,.4);assert.equal(compile("s220'?'0.4").events[0].durationRange,undefined);
 // Explicit lifetimes must cover the upper bound, including future loop draws.
 assert.ok(compile("{s220'?[0.1:2]}g0.8'1").diagnostics.length);
 assert.ok(compile("{s220'?[0.1:2]}r2'1").diagnostics.length);
});
