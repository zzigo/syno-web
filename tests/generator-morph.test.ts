import test from 'node:test';import assert from 'node:assert/strict';import {compile,eventData} from '../src/core/parser';import {generatorMorph,GENERATOR_STAGES} from '../src/core/generator-morph';import {harmonicCoefficients} from '../src/audio/generator-morph';import {cubeAxes} from '../src/visuals/axis-labels';
test('default growth actually maps X pan, Y frequency and Z intensity',()=>{
 const a=compile("G123 s165v3'0.2"),b=compile("G123@pov s165v3'0.2");assert.deepEqual(a.diagnostics,[]);assert.deepEqual(eventData(a),eventData(b));
 for(const e of a.events){assert.equal(e.axisMap,'pov');assert.equal(e.pan.start,e.node!.x);assert.equal(e.volume.start,3*(e.node!.z+1)/2);}
 const held=cubeAxes(compile("G123 s165v3p0.5'0.2").events);assert.match(held.labels[0],/p PAN \(manual\)/);assert.match(held.labels[2],/v INTENSITY/);assert.ok(!held.labels.join(' ').includes('UNMAPPED'));
});
test('generator bank is ordered, continuous and has all carrier/modulator pairs',()=>{
 assert.equal(GENERATOR_STAGES.length,20);assert.deepEqual(GENERATOR_STAGES.slice(0,4).map(s=>s.label),['s','t','a','q']);assert.deepEqual(GENERATOR_STAGES.slice(4,8).map(s=>s.label),['s:s','s:t','s:a','s:q']);assert.equal(GENERATOR_STAGES.at(-1)!.label,'q:q');
 for(let i=0;i<20;i++){const state=generatorMorph(i*9/19);assert.equal(state.label,GENERATOR_STAGES[i].label);assert.equal(state.fmMix,i<4?0:1);}
 const mid=generatorMorph(.5*9/19);assert.equal(mid.carrier[0],.5);assert.equal(mid.carrier[1],.5);
 const boundary=generatorMorph(3.5*9/19);assert.ok(Math.abs(boundary.fmMix-.5)<1e-12);
 for(let value=0;value<=9;value+=.1){const a=harmonicCoefficients(generatorMorph(value).carrier),b=harmonicCoefficients(generatorMorph(value+.00001).carrier);assert.ok(Math.abs(Math.hypot(...a)-1)<1e-6);assert.ok(Math.hypot(...a.map((v,i)=>v-b[i]))<.001);}
});
test('g target reaches real event data, respects scope and clearly identifies unsupported noise',()=>{
 const score=compile("G123@gov(s110v2'0.2) s440'0.1");assert.deepEqual(score.diagnostics,[]);const growth=score.events.filter(e=>e.node);assert.ok(growth.length>1);for(const e of growth){assert.equal(e.generatorMix,Math.max(0,Math.min(9,(e.node!.x+1)*4.5)));}assert.match(cubeAxes(growth).labels[0],/g GENERATORS/);assert.ok(eventData(score).some(e=>typeof e.generatorMix==='number'));
 const noise=compile("G123@gov n2v1'0.2");assert.deepEqual(noise.diagnostics,[]);assert.ok(noise.events.every(e=>e.generatorMix===undefined&&e.freq.start===2));assert.match(cubeAxes(noise.events).labels[0],/noise\/input/);
});
