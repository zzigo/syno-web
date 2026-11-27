import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{compile,eventData}from'../src/core/parser';
const source=readFileSync(new URL('../library/pieces/Soft-machines.syn',import.meta.url),'utf8');
test('Soft machines is a finite 96-bar song with nine timed sections and complete vocal cues',()=>{
 const score=compile(source);assert.deepEqual(score.diagnostics,[]);assert.ok(Math.abs(score.duration-160)<1e-8);assert.equal(score.outputBuses.length,9);assert.ok(score.events.length<2048);const bars=[8,16,8,8,16,8,8,16,8];score.outputBuses.forEach((b,i)=>assert.ok(Math.abs(b.dur-bars[i]*4*60/144)<1e-8));
 const voices=score.events.filter(e=>e.lyrics);assert.equal(new Set(voices.map(e=>e.lyrics!.text)).size,12);assert.ok(voices.every(e=>e.lyrics?.captions));assert.ok(voices.some(e=>e.vocoderMix?.end===0));assert.ok(voices.some(e=>e.vocoderMix?.end===8));assert.deepEqual(eventData(score),eventData(compile(source)));
});
test('breakdowns retain pads/lyrics and remove the kick and bass rows',()=>{
 const score=compile(source);for(const i of [2,5]){const b=score.outputBuses[i],events=score.events.filter(e=>e.t>=b.t-1e-8&&e.t<b.t+b.dur-1e-8);assert.ok(events.some(e=>e.lyrics));assert.ok(!events.some(e=>!e.lyrics&&e.wave!=='n'&&e.freq.start<100));}
});
