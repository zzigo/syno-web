import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,eventData} from '../src/core/parser';
import {numberRoles} from '../src/core/number-roles';
function score(source:string){const result=compile(source,3181);assert.deepEqual(result.diagnostics,[],source);return result;}
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('sections wait for finite repetitions and retain parallel actions within the new section',()=>{
 assert.deepEqual(score("(s220'1)3 10s110'1").events.map(e=>e.t),[0,1,2,10]);
 const result=score("(s220'1)3 ;10 s110'1 0.5t330'2 ; q440'1");
 assert.deepEqual(result.events.map(e=>e.t),[0,1,2,13,13.5,15.5]);close(result.duration,16.5);
});
test('nested sections and named phrases retain a local time origin on each repetition',()=>{
 const result=score("intro=(s220'1 ; t330'2) (intro ;1 q440'1)2 ; a110'1");
 assert.deepEqual(result.events.map(e=>e.t),[0,1,4,5,6,9,10]);close(result.duration,11);
});
test('growth section duration follows the longest generated voice and changes automatically with N',()=>{
 for(const n of [4,8]){
  const body=`G (N${n} U0.1 D1 s120v1'0.2)`;
  const initial=score(`(${body})3`),result=score(`(${body})3 ;10 t220'0.5`);
  close(result.events.at(-1)!.t,initial.duration+10);close(result.duration,initial.duration+10.5);
 }
});
test('output buses and feedback lifetimes finish before a section; effect tails do not delay the next',()=>{
 const a=score("(s220'1)r9d2 ; t330'1");assert.deepEqual(a.events.map(e=>e.t),[0,1]);assert.ok(a.outputBuses[0].tail>2);
 const b=score("{n1v0.03e0'0.02}g0.8f6v1'3 ;2 t330'1");assert.equal(b.events.at(-1)!.t,5);assert.equal(b.feedback[0].dur,3);
});
test('rests, beat waits and adjacent-only wait parsing have predictable section timing',()=>{
 assert.equal(score("s220'1 ;2").duration,3);
 assert.deepEqual(score("(s220'1 ;1)2 ; t330'1").events.map(e=>e.t),[0,2,4]);
 assert.deepEqual(score("!b120 s220'1 ;n4 t330'1 ;b2 a440'1").events.map(e=>e.t),[0,1.5,3.5]);
 assert.deepEqual(score("s220'1 ;\n10t330'1").events.map(e=>e.t),[0,11]);
 assert.deepEqual(score(";1 ;2 s220'1").events.map(e=>e.t),[3]);
 assert.equal(numberRoles('s220;10t330')[1].kind,'value');
});
test('sampled durations feed the next section and remain deterministic',()=>{
 const source="(s220'?[0.1:0.8])3 ;0.2 t330'0.1",a=score(source),b=score(source);
 assert.deepEqual(eventData(a),eventData(b));
 const previous=a.events[2];close(a.events[3].t,previous.t+previous.dur+.2);
});
test('section waits reject invalid and overflowing times',()=>{
 for(const source of ["s220'1 ;-1 t330", "s220'1 ;86400 t330", "s220'1 ;.0 ;86400", "s220'1 ;n0 t330"]){assert.ok(compile(source).diagnostics.length,source);}
});
