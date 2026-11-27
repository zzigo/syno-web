import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,eventData} from '../src/core/parser';
import {extractScore} from '../src/integrations/agent-score';
test('wildcard timbres choose one concrete supported oscillator per generated node',()=>{
 const code="S N32 U0.08 D1.1\n?[s a]165v3e0254'0.22",s=compile(code,3181);
 assert.deepEqual(s.diagnostics,[]);assert.ok(s.events.length>1);assert.ok(s.events.every(e=>e.wave==='s'||e.wave==='a'));
 assert.equal(new Set(s.events.map(e=>e.wave)).size,2);
 assert.deepEqual(eventData(s),eventData(compile(code,3181)));assert.notDeepEqual(s.events.map(e=>e.wave),compile(code,3182).events.map(e=>e.wave));
 assert.deepEqual(eventData(s),eventData(compile('# comment\n'+code,3181)));
 const all=compile("G N32 ?165'0.1");assert.deepEqual(all.diagnostics,[]);assert.equal(new Set(all.events.map(e=>e.wave)).size,4);
 assert.equal(extractScore("?[s a]165v3'1"),"?[s a]165v3'1");
});
test('choice syntax rejects empty, unsupported or unclosed sets and works in functions',()=>{
 for(const code of ['?[]165','?[n s]165','?[s a165','?[z]165'])assert.ok(compile(code).diagnostics.length,code);
 assert.deepEqual(compile('tone=?[s a]*v2 tone220').diagnostics,[]);
});


test('each loop has a fresh reproducible timbre stream',async()=>{
 const {timbreForCycle}=await import('../src/core/timbre');
 const options=['s','t','a','q'] as const;
 const a=Array.from({length:16},(_,cycle)=>timbreForCycle([...options],3181,0,cycle));
 assert.ok(new Set(a).size>1);assert.deepEqual(a,Array.from({length:16},(_,cycle)=>timbreForCycle([...options],3181,0,cycle)));
});

test('s? randomizes pitch while ?? randomizes both independently within log bounds',async()=>{
 const {frequencyForCycle}=await import('../src/core/timbre');
 for(const code of ['s?','??','s?[110:880]','?[s a]?[110:880]']){const a=compile(code,3181),b=compile(code,3181);assert.deepEqual(a.diagnostics,[],code);assert.deepEqual(eventData(a),eventData(b));assert.ok(a.events[0].freq.start>=55&&a.events[0].freq.start<=1760);}
 assert.equal(compile('s?').events[0].wave,'s');
 const range:[number,number]=[110,880],frequencies=Array.from({length:8},(_,cycle)=>frequencyForCycle(range,3181,0,cycle));
 assert.equal(new Set(frequencies).size,8);assert.ok(frequencies.every(f=>f>=110&&f<=880));
 for(const code of ['s?[880:110]','s?[0:880]','n?','s?[110:20001]'])assert.ok(compile(code).diagnostics.length,code);
});

test('random pitch and pan endpoints support the proposed interpolated forms',()=>{
 const a=compile("??>?h.1"),b=compile("??v2e0254p?>?'?");assert.deepEqual(a.diagnostics,[]);assert.deepEqual(b.diagnostics,[]);
 assert.notEqual(a.events[0].freq.start,a.events[0].freq.end);assert.equal(a.events[0].chop,.1);
 const e=b.events[0];assert.ok(e.pan.start>=-1&&e.pan.end<=1);assert.notEqual(e.pan.start,e.pan.end);assert.equal(e.pan.duration,e.dur);
 const complete=compile("??>?v2e0254p?>?'?"),c=complete.events[0];assert.deepEqual(complete.diagnostics,[]);assert.equal(c.freq.duration,c.dur);assert.equal(c.pan.duration,c.dur);
 assert.equal(compile('s220>?').events[0].freq.start,220);assert.equal(compile('s?>440').events[0].freq.end,440);
 assert.equal(compile('s220p-1>?').events[0].pan.start,-1);assert.equal(compile('s220p?>0').events[0].pan.end,0);
 assert.deepEqual(compile("s?[110:220]>?[440:880]'3").diagnostics,[]);
 for(const code of ['s220p?[2:3]','s220p?[1:-1]','s220p?>?[0:2]','s?[0:110]>?','n1>?'])assert.ok(compile(code).diagnostics.length,code);
});
