import test from'node:test';import assert from'node:assert/strict';import{parseTuning,degreeHz,quantizeHz}from'../src/core/tuning';import{compile}from'../src/core/parser';import{numberRoles}from'../src/core/number-roles';
test('absolute Hz tables preserve written values/order and ignore o for absolute pitches',()=>{
 const t=parseTuning('[f 178.496293 190.365394 440]');assert.deepEqual(t.frequencies,[178.496293,190.365394,440]);assert.equal(degreeHz(1,t,110),190.365394);assert.equal(quantizeHz(189,t,880),190.365394);
 const s=compile("!sa u[f 178.496293 190.365394 440] o880 s[n1 2 3]'0.2");assert.deepEqual(s.diagnostics,[]);assert.deepEqual(s.events.map(e=>e.freq.start),t.frequencies);
 assert.deepEqual(parseTuning('[f440,220,330]').frequencies,[440,220,330]);
});
test('absolute tables reject missing/out-of-range/duplicate values and finite index overflow',()=>{
 for(const text of ['[f]','[f 0 220]','[f 220 220]','[f 220 20001]','[f 220 330]:2/1'])assert.throws(()=>parseTuning(text),text);
 assert.ok(compile('u[f 220 330] s[n3]').diagnostics.length);assert.deepEqual(compile('u[f 220 330] s[n+1]').diagnostics,[]);assert.equal(compile('u[f 220 330] s[n+1]').events[0].freq.start,440);
});
test('Hz tables quantize growth and expose frequency-colored values; indexed arguments are not PLAY values',()=>{
 const s=compile("u[f 220 330 440] G N8 s220'0.1");assert.deepEqual(s.diagnostics,[]);assert.ok(s.events.every(e=>[220,330,440].includes(e.freq.start)));
 assert.deepEqual(numberRoles('u[f 178.496293 190.365394]').map(r=>r.kind),['frequency','frequency']);assert.deepEqual(numberRoles("s*1v*2>*3'*4").map(r=>r.text),[]);
});
test('sequence table positions and gate lengths can be reusable function arguments',()=>{
 const s=compile("u[f 178.496293 190.365394 440] tone=s[n*]v*e0090'* tone2,3,0.5");assert.deepEqual(s.diagnostics,[]);assert.equal(s.events[0].freq.start,190.365394);assert.equal(s.events[0].dur,.5);assert.equal(s.events[0].volume.start,3);
});
