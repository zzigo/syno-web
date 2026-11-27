import test from 'node:test';import assert from 'node:assert/strict';
import {compile,eventData} from '../src/core/parser';import {dbap,spatialGains,DEFAULT_SPEAKERS} from '../src/core/spatial';
import {encodeWav,protectPeak} from '../src/audio/render-file';
const layout='!spk[[1 -1 0 -1] [2 1 0 -1] [3 1 0 1] [4 -1 0 1]]';
test('Speaker declaration and raw ID crossfade preserve zero output lanes',()=>{
 const score=compile(`${layout}\ns220v1'4p[o1>2]`);assert.deepEqual(score.diagnostics,[]);
 const event=score.events[0];assert.deepEqual(spatialGains(event.spatial,event.pan,0,score.speakers!),[1,0,0,0]);assert.deepEqual(spatialGains(event.spatial,event.pan,2,score.speakers!),[.5,.5,0,0]);assert.deepEqual(spatialGains(event.spatial,event.pan,4,score.speakers!),[0,1,0,0]);
});
test('Compact XYZ speakers are positional and source triplets interpolate all axes',()=>{
 const score=compile("!spk[132 323 432]\ns220'6p[423>111]");assert.deepEqual(score.diagnostics,[]);assert.equal(score.speakers![0].id,1);assert.equal(score.speakers![0].x,1/4.5-1);assert.equal(score.events[0].spatial!.values[0].duration,6);
 const expanded=compile(`${layout} s220'6p[x -1 0 1]>[x 1 0 -1]`);assert.deepEqual(expanded.diagnostics,[]);assert.equal(expanded.events[0].spatial!.values[0].end,1);
});
test('Sequences, tuning root and raw gain vectors retain distinct meanings',()=>{
 const seq=compile("o220 s220p[-1 0 1]'1");assert.deepEqual(seq.diagnostics,[]);assert.equal(seq.events[0].spatial,undefined);
 const score=compile(`${layout} s220p[o 0 9 0 0]'1`);assert.deepEqual(score.diagnostics,[]);assert.deepEqual(spatialGains(score.events[0].spatial,score.events[0].pan,0,score.speakers!),[0,1,0,0]);
 for(const code of [`${layout} s220p[o5]`,`${layout} s220p[o 0 9]`,`${layout} s220p[x 2 0 0]`,`s220p[423]`,'!spk[[1 0 0 0] [1 1 0 0]] s220'])assert.ok(compile(code).diagnostics.length,code);
});
test('Shared spatial buses inherit lifetime and data hashes include routing and layout',()=>{
 const s=compile(`${layout} {s220 s330}p[o1>2]'4`);assert.deepEqual(s.diagnostics,[]);assert.equal(s.outputBuses[0].effects[0].spatial!.values[0].duration,4);
 const a=JSON.stringify(eventData(compile(`${layout} s220p[o1]`))),b=JSON.stringify(eventData(compile(`${layout} s220p[o2]`)));assert.notEqual(a,b);assert.match(a,/speakers/);
});
test('DBAP regularizes speaker positions and preserves power; raw gains do not normalize',()=>{
 for(const p of [[0,0,0],[-1,0,-1],[1,1,1]]){const g=dbap(p,DEFAULT_SPEAKERS);assert.ok(g.every(Number.isFinite));assert.ok(Math.abs(g.reduce((s,v)=>s+v*v,0)-1)<1e-12);}
 const r={start:9,end:9,duration:0};assert.deepEqual(spatialGains({mode:'outputs',values:[r,r,r,r]},r,0,DEFAULT_SPEAKERS),[1,1,1,1]);
});
test('WAV PCM24 encodes discrete order and linked protection applies one gain',async()=>{
 const c=[new Float32Array([2,-2]),new Float32Array([.5,-.5])];const p=protectPeak(c);assert.equal(p.gain,.475);assert.ok(Math.abs(c[1][0]-.2375)<1e-7);const v=new DataView(await encodeWav(c,48000).arrayBuffer());assert.equal(v.getUint16(22,true),2);assert.equal(v.getUint16(34,true),24);assert.equal(v.getUint32(40,true),3);assert.throws(()=>protectPeak([new Float32Array([NaN])]));
});
