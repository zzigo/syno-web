import test from 'node:test';import assert from 'node:assert/strict';import {compile} from '../src/core/parser';
test('parenthesized postfix volume scales the whole group without changing its voices',()=>{
 const s=compile("(s220v2'5 t330v3'5)v9>0'5");assert.deepEqual(s.diagnostics,[]);assert.equal(s.outputBuses.length,1);assert.ok(s.events.every(e=>e.outputBus===0));assert.deepEqual(s.events.map(e=>e.volume.start),[2,3]);assert.equal(s.outputBuses[0].effects[0].kind,'volume');assert.deepEqual(s.outputBuses[0].effects[0].ramp,{start:9,end:0,duration:5});
});
test('postfix order, nested parent routing and repeat counts are preserved',()=>{
 for(const [suffix,kinds]of [['v9>0\'5r4',['volume','reverb']],['r4v9>0\'5',['reverb','volume']],['h2d0.3r4v9>0\'5',['chop','delay','reverb','volume']]] as const){const s=compile("(s220'5)"+suffix);assert.deepEqual(s.diagnostics,[]);assert.deepEqual(s.outputBuses[0].effects.map(e=>e.kind),kinds);}
 const s=compile("((s220'0.1)4h2)r4v9>0'2");assert.deepEqual(s.diagnostics,[]);assert.equal(s.events.length,4);assert.equal(s.outputBuses.length,2);assert.equal(s.outputBuses[1].parent,0);assert.ok(s.events.every(e=>e.outputBus===1));
 for(const source of ["(s220)a","(s220):s100","(s220)f3","(s220)p1","(s220)v10","(s220)v[1 2]","(s220'5)v1'2"])assert.ok(compile(source).diagnostics.length,source);
});
test('postfix contours retain all points and can wrap an actual feedback return',()=>{
 const s=compile("({n2v0.01'0.05e0}d0.013g1.05f5v1'6)r3v0>9>0'8");assert.deepEqual(s.diagnostics,[]);assert.equal(s.feedback[0].outputBus,0);assert.equal(s.events[0].feedbackBus,0);const ramp=s.outputBuses[0].effects[1].ramp!;assert.equal(ramp.points?.length,3);assert.equal(ramp.points?.at(-1)?.value,0);assert.equal(ramp.duration,8);
});

test('braces are dry buses unless g explicitly creates a return, including nested identity buses',()=>{
 for(const code of ["{s220}","{{s220}}","{s220}v4","{s220}f2","{s220}p1>-1"]){const s=compile(code);assert.deepEqual(s.diagnostics,[],code);assert.equal(s.feedback.length,0,code);assert.ok(s.outputBuses.length);}
 for(const suffix of ['b220,880','q0.25','k2','x0.3','d0.01,0.02'])assert.ok(compile('{n1}'+suffix).diagnostics[0].message.includes('explicit return g'));
 const feedback=compile("{n1v0.01'0.01e0}f5d0.013g1.1v2'4p1>-1r3");assert.deepEqual(feedback.diagnostics,[]);assert.equal(feedback.feedback.length,1);assert.deepEqual(feedback.outputBuses[0].effects.map(e=>e.kind),['pan','reverb']);assert.equal(feedback.feedback[0].filter.start,5);assert.equal(feedback.feedback[0].outputBus,0);
});
test('named function buses preserve processor order, span-following pan/filter, explicit times and repeated effects',()=>{
 const s=compile("roll=(n1v1'8) {roll}p1>-1f1>8h2r3p0v4");assert.deepEqual(s.diagnostics,[]);const bus=s.outputBuses[0];assert.equal(s.events[0].volume.start,1);assert.equal(s.events[0].pan.start,0);assert.equal(s.feedback.length,0);
 assert.deepEqual(bus.effects.map(e=>e.kind),['pan','filter','chop','reverb','pan','volume']);assert.equal(bus.dur,8);assert.equal(bus.effects[0].ramp?.duration,8);assert.equal(bus.effects[1].ramp?.duration,8);
 const timed=compile("{s220'8}p1>-1'4f8>2'6");assert.deepEqual(timed.diagnostics,[]);assert.equal(timed.outputBuses[0].effects[0].ramp?.duration,4);assert.equal(timed.outputBuses[0].effects[1].ramp?.duration,6);
 const repeated=compile("{{s220'1}f3r4}f7p-1");assert.deepEqual(repeated.diagnostics,[]);assert.equal(repeated.outputBuses[1].parent,0);assert.equal(repeated.events[0].outputBus,1);
 for(const suffix of ['p-2','p0>2','f10','f2>-1','p[0 1]'])assert.ok(compile('{s220}'+suffix).diagnostics.length,suffix);
});

test('an explicitly timed bus processor supplies missing gates but respects written gates and repeat clocks',()=>{
 const s=compile("{s100 s200 s300 s400 s500 s700 s800}p1>-1f5>3'10");assert.deepEqual(s.diagnostics,[]);assert.equal(s.duration,10);assert.ok(s.events.every(e=>e.dur===10));assert.equal(s.outputBuses[0].effects[0].ramp?.duration,10);
 const mixed=compile("{s100'2 2s200 s300p-1>1'3}f5>3'10");assert.deepEqual(mixed.diagnostics,[]);assert.deepEqual(mixed.events.map(e=>e.dur),[2,3,8]);
 const repeated=compile("{(s220)4}f2>8'10");assert.deepEqual(repeated.diagnostics,[]);assert.deepEqual(repeated.events.map(e=>e.dur),[1,1,1,1]);
});
