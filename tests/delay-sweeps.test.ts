import test from 'node:test';import assert from 'node:assert/strict';import {compile} from '../src/core/parser';
test('delay interpolation compiles on free voices, parentheses, nested groups and brace output buses',()=>{
 for(const source of ['s100d1>9', '(s100)d1>9', '((s100)d1>9)r4','{s100}d1>9']){
  const s=compile(source);assert.deepEqual(s.diagnostics,[],source);const ramp=s.events[0].delay??s.outputBuses.flatMap(b=>b.effects).find(e=>e.kind==='delay')?.ramp;assert.deepEqual(ramp,{start:1,end:9,duration:2});
 }
 const voice=compile("s100'12d1>9").events[0];assert.equal(voice.delay?.duration,12);
 assert.deepEqual(compile("(s100'12)d1>9'12").outputBuses[0].effects[0].ramp,{start:1,end:9,duration:12});
 assert.deepEqual(compile("s100d1<9'4").events[0].delay,{start:9,end:1,duration:4});
 for(const source of ['s100d10','(s100)d10',"{s100}d10g0.8'12"])assert.ok(compile(source).diagnostics.length,source);
});
test('feedback lowpass and two-band returns preserve independent delay ramps up to nine seconds',()=>{
 for(const suffix of ["d1>9'8g0.8f5v1'12","d1>9'8,9>1'8b220,880g0.8v1'12"]){const s=compile('{s100v0.1\'0.1}'+suffix);assert.deepEqual(s.diagnostics,[]);assert.deepEqual(s.feedback[0].delay,{start:1,end:9,duration:8});if(s.feedback[0].delayRight)assert.deepEqual(s.feedback[0].delayRight,{start:9,end:1,duration:8});}
});
