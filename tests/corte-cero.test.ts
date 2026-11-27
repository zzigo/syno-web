import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compile,eventData} from '../src/core/parser';
import {presets} from '../src/core/presets';
const source=readFileSync(new URL('../library/pieces/Corte-cero.syn',import.meta.url),'utf8');
test('Corte Cero lasts two minutes and sends every excitation through a return circuit',()=>{
 const s=compile(source,3181);assert.deepEqual(s.diagnostics,[]);assert.ok(Math.abs(s.duration-120)<1e-9);
 assert.equal(s.feedback.length,16);assert.equal(s.outputBuses.length,20);assert.ok(s.events.every(e=>e.feedbackBus!==undefined));
 assert.deepEqual(s.feedback.filter(c=>c.band).map(c=>Math.round(c.t)),[0,30,60,90]);
 assert.deepEqual(eventData(s),eventData(compile(source,3181)));
 const preset=presets.find(p=>p.file==='pieces/Corte-cero.syn');assert.equal(preset?.category,'Pieces');assert.equal(preset?.loop,false);
});
test('the 160 BPM grid spans eighty beats per block while bandwidth, space and gates transform',()=>{
 const s=compile(source);for(const c of s.feedback.filter(c=>c.band)){
  const events=s.events.filter(e=>e.feedbackBus===c.id),onsets=events.filter(e=>e.wave!=='n'&&Math.abs((e.t-c.t)/.375-Math.round((e.t-c.t)/.375))<1e-7);
  // White Room deliberately replaces the pitched kick with a noise excitation.
  if(c.t<59||c.t>89)assert.equal(onsets.length,80);
  assert.ok(c.band?.rqRamps?.every(r=>r.start!==r.end));
 }
 assert.ok(s.outputBuses.filter(b=>b.parent===undefined).every(b=>b.effects.every(e=>e.kind==='reverb'||e.kind==='volume')));
 assert.ok(s.outputBuses.some(b=>b.effects.some(e=>e.kind==='reverb'&&e.ramp?.end===9)));
 const last=s.outputBuses.filter(b=>b.parent===undefined).at(-1)!;assert.equal(last.effects.at(-1)?.kind,'volume');assert.equal(last.effects.at(-1)?.ramp?.end,0);assert.ok(Math.abs(last.t+last.dur-120)<1e-9);
});

test('each block layers four moving returns, including an independent sub-bass trajectory',()=>{
 const s=compile(source);
 for(const t of [0,30,60,90]){
  const returns=s.feedback.filter(c=>c.t===t);assert.equal(returns.length,4);
  for(const c of returns){
   for(const r of [c.delay,c.gain,c.crossRamp!,...(c.band?[c.delayRight!,c.gainRight!,c.band.drive,...c.band.frequency,...c.band.rqRamps!]:[c.filter])]){
    assert.ok(r.duration===30&&r.start!==r.end);
   }
   assert.equal(c.volume.points?.length,5);assert.equal(c.volume.start,0);assert.equal(c.volume.end,0);
  }
  const sub=s.events.find(e=>e.t===t&&e.wave==='s'&&e.dur===30&&e.freq.start<60);
  assert.ok(sub);assert.ok(sub.freq.end>=20&&sub.freq.end<60);assert.notEqual(sub.freq.start,sub.freq.end);
  assert.ok(returns.some(c=>c.id===sub.feedbackBus&&!c.band));
 }
 assert.ok(s.outputBuses.every(b=>b.effects.every(e=>e.ramp&&e.ramp.start!==e.ramp.end)));
});
test('feedback circuit budget permits the sixteen scored returns and rejects overflow',()=>{
 const circuit="{s40v0.01'0.1}g0.8'1";
 assert.deepEqual(compile(Array(16).fill(circuit).join(' ')).diagnostics,[]);
 assert.ok(compile(Array(17).fill(circuit).join(' ')).diagnostics.some(d=>d.message.includes('16 feedback circuits')));
});

test('four independent chopper contours coexist before the common reverb in every block',()=>{
 const s=compile(source);for(const t of [0,30,60,90]){
  const circuits=s.feedback.filter(c=>c.t===t),gates=circuits.map(c=>s.outputBuses[c.outputBus!]);
  assert.equal(new Set(gates.map(b=>b.id)).size,4);
  assert.equal(new Set(gates.map(b=>b.effects[0].value)).size,4);
  assert.ok(gates.every(b=>b.effects[0].kind==='chop'&&b.parent!==undefined&&s.outputBuses[b.parent].effects[0].kind==='reverb'));
 }
});
