import test from'node:test';import assert from'node:assert/strict';import{compile}from'../src/core/parser';
test('indexed parameters reuse opened arguments, including reference frequency and gate duration',()=>{
 const source="pair=(o* s[n1]v*>*e0090'* s[n5]v*2>*3e0090'*4) pair220,2,1,1.5";const s=compile(source);assert.deepEqual(s.diagnostics,[]);assert.equal(s.events.length,2);assert.deepEqual(s.events.map(e=>e.dur),[1.5,1.5]);assert.equal(s.events[0].freq.start,220);assert.ok(s.events[1].freq.start>220);assert.deepEqual(s.events.map(e=>[e.volume.start,e.volume.end,e.volume.duration]),[[2,1,1.5],[2,1,1.5]]);
});
test('onset prefixes on named calls are independent from previous call durations',()=>{
 const s=compile("tone=s*v2e0090'* tone220,2 0.5tone330,1 ;0.2 tone440,0.5");assert.deepEqual(s.diagnostics,[]);assert.deepEqual(s.events.map(e=>e.t),[0,.5,2.2]);assert.equal(s.duration,2.7);
});
test('invalid references, time arguments, roots and out-of-range high components reject clearly',()=>{
 for(const source of ['aa=s*1 aa220','aa=s*v*3 aa220,2',"aa=s220'* aa0",'aa=(o* s[n1]) aa0','s20001'])assert.ok(compile(source).diagnostics.length,source);
 assert.deepEqual(compile('s17250').diagnostics,[]);assert.deepEqual(compile("aa=s*'1 aa220").diagnostics,[]);
});

test('a gate argument is resolved once before nested sequence subdivision',()=>{
 const s=compile("seq=s[[220 330] 440]e0'* seq1");assert.deepEqual(s.diagnostics,[]);assert.equal(s.duration,2);assert.equal(s.events[0].dur,2);
 const articulated=compile("!sa seq=s[[220 330] 440]e0'* seq1");assert.deepEqual(articulated.diagnostics,[]);assert.deepEqual(articulated.events.map(e=>e.dur),[.5,.5,1]);
});
