import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,eventData} from '../src/core/parser';
import {sliceRamp,rampValueAt} from '../src/core/curves';
test('braces route multiple excitations into one shared circuit with independent controls',()=>{
 const s=compile("{ n1v0.03'0.02e0 1s220v1'0.1 }d0.012g1.12f6.6x0.35v2'16");
 assert.deepEqual(s.diagnostics,[]);assert.equal(s.feedback.length,1);assert.equal(s.duration,16);
 assert.ok(s.events.every(e=>e.feedbackBus===0));assert.equal(s.feedback[0].delay.start,.012);assert.equal(s.feedback[0].gain.start,1.12);
 assert.equal(s.feedback[0].volume.start,2);
 assert.deepEqual(eventData(s),eventData(compile("# comment\n{ n1v0.03'0.02e0 1s220v1'0.1 }d0.012g1.12f6.6x0.35v2'16")));
 assert.notDeepEqual(eventData(s),eventData(compile("{ n1v0.03'0.02e0 1s220v1'0.1 }d0.012g0.8f6.6x0.35v2'16")));
});
test('feedback validates nesting, lifetime, endpoints, silent circuits and channel coupling',()=>{
 for(const source of ["{}'10","{n1}g2","{n1}d0","{n1}x2","{n1}f10","{n1}v10","{n1'2}'1","{{n1}g0.9}g0.9","{n1"]){const s=compile(source);assert.ok(s.diagnostics.length,source);assert.equal(s.events.length,0);assert.equal(s.feedback.length,0);}
 assert.deepEqual(compile("{n1'0.1}g0.5>1.2'4d0.01>0.02'4v0>2>0'8").diagnostics,[]);
});
test('periodic recurrence preserves tails and encodes its period in musical data',()=>{
 const s=compile("(s3520^55'20v0>3>0'20e0)'3.3333333333333335");
 assert.deepEqual(s.diagnostics,[]);assert.equal(s.period,20/6);assert.equal(s.duration,20);
 assert.equal(s.events[0].freq.exponential,true);assert.ok(Math.abs(rampValueAt(s.events[0].freq,10)-440)<1e-9);
 const ramp=s.events[0].volume,part=sliceRamp(ramp,7);
 assert.equal(part.duration,13);assert.equal(rampValueAt(part,3),3);assert.equal(rampValueAt(part,13),0);
 for(const source of ["(s220'20)'0.01","(s220'20e0)'0.1","(s220e0)'1 s330","(s220)'1","({n1e0})'1"]){assert.ok(compile(source).diagnostics.length,source);}
 assert.ok(compile('s0^200').diagnostics.length);assert.ok(compile('s200^0').diagnostics.length);
});

test('two-band circuit preserves separate frequencies, widths, drive, gains and delays',()=>{
 const score=compile("{n2v0.03p-1'8e0 n1v0.03p1'8e0}b220,880q0.25,0.2k2.5g0.72,0.68d0.013,0.029x0.35v4'8");
 assert.deepEqual(score.diagnostics,[]);const c=score.feedback[0];
 assert.deepEqual(c.band?.frequency.map(f=>f.start),[220,880]);assert.deepEqual(c.band?.rq,[.25,.2]);assert.equal(c.band?.drive.start,2.5);
 assert.equal(c.gain.start,.72);assert.equal(c.gainRight?.start,.68);assert.equal(c.delay.start,.013);assert.equal(c.delayRight?.start,.029);
 for(const suffix of ['b20,880','b220,9000','b220,880q0','b220,880k11','g0.5,2','d0.01,0','k2'])assert.ok(compile(`{n1}${suffix}`).diagnostics.length,suffix);
});


test('outer braces apply one post-chain reverb bus to complete feedback outputs',()=>{
 const code="{{s220v0.03'0.2e0}d0.2g1.4f4x0.5v5'16}r8";
 const score=compile(code);assert.deepEqual(score.diagnostics,[]);assert.equal(score.feedback.length,1);assert.equal(score.outputBuses.length,1);
 assert.equal(score.feedback[0].outputBus,0);assert.equal(score.events[0].feedbackBus,0);assert.equal(score.events[0].outputBus,undefined);
 assert.equal(score.outputBuses[0].volume.start,9);assert.equal(score.outputBuses[0].effects[0].value,8);assert.equal(score.outputBuses[0].dur,16);assert.ok(score.outputBuses[0].tail>5);assert.equal(score.duration,16);
 assert.deepEqual(eventData(score),eventData(compile('# comment\n'+code)));
 assert.notDeepEqual(eventData(score),eventData(compile(code.replace('r8','r2'))));
});
test('nested output buses compose and direct notes share the same output route',()=>{
 const s=compile("{{s220'1 t330'1}r2 s440'1}r8");assert.deepEqual(s.diagnostics,[]);
 assert.equal(s.outputBuses.length,2);assert.equal(s.outputBuses[1].parent,0);assert.deepEqual(s.events.map(e=>e.outputBus),[1,1,0]);
 assert.ok(s.outputBuses[0].tail>s.outputBuses[1].tail);
 for(const code of ["{s220}r10","{s220'2}r4'1","{{s220}r4}g1.2"]){assert.ok(compile(code).diagnostics.length,code);}
});

test('r/h output effects preserve written order and attach after the full circuit',()=>{
 const base="{{n1v0.03'0.2e0}d0.005g1.11f5.8>1x0.35v2'26}";
 const a=compile(base+'r4h2'),b=compile(base+'h2r8');assert.deepEqual(a.diagnostics,[]);assert.deepEqual(b.diagnostics,[]);
 assert.deepEqual(a.outputBuses[0].effects.map(e=>e.kind),['reverb','chop']);assert.deepEqual(b.outputBuses[0].effects.map(e=>e.kind),['chop','reverb']);
 assert.notDeepEqual(eventData(compile('{s220}r8h2')),eventData(compile('{s220}h2r8')));
 const normal=compile('s200d3');assert.deepEqual(normal.diagnostics,[]);assert.equal(normal.events[0].delay?.start,3);
 assert.deepEqual(compile('{s200}d3r8').outputBuses[0].effects.map(e=>e.kind),['delay','reverb']);
});

test('continuous controls interpolate in sounds, ordered buses and feedback circuits',()=>{
 const note=compile("s220h0.1>3r0>8'4");assert.deepEqual(note.diagnostics,[]);assert.deepEqual(note.events[0].chopRamp,{start:.1,end:3,duration:2});assert.equal(note.events[0].reverbRamp?.end,8);assert.equal(note.duration,4);
 const bus=compile("{s220'1}h0.1>3'4r8>2'5");assert.deepEqual(bus.diagnostics,[]);assert.equal(bus.outputBuses[0].dur,5);assert.equal(bus.outputBuses[0].effects[0].ramp?.duration,4);
 const circuit=compile("{n1'0.1}b220,880q0.25>0.5'4,0.2>0.4'4k2.5x0.1>0.8'4g0.7,0.8d0.01,0.02");assert.deepEqual(circuit.diagnostics,[]);assert.equal(circuit.feedback[0].crossRamp?.end,.8);assert.equal(circuit.feedback[0].band?.rqRamps?.[0].end,.5);
 for(const code of ['s220h1>10','s220r1>10',"{s220}h1>10","{n1}g1x0.1>2"]){assert.ok(compile(code).diagnostics.length,code);}
});
