import test from 'node:test';import assert from 'node:assert/strict';import {compile} from '../src/core/parser';import {speakerPreset,SPEAKER_PRESETS} from '../src/core/speaker-presets';import {spatialGains} from '../src/core/spatial';import {encodeWav} from '../src/audio/render-file';
test('Preset shorthand and named layouts distinguish octophony from surround',()=>{
 for(const [key,count] of [['1',1],['2',2],['2.1',3],['3.0',3],['3.1',4],['4',4],['4.0',4],['5.0',5],['5.1',6],['6.1',7],['7.1',8],['8',8],['12',12],['5.1.2',8],['5.1.4',10],['7.1.2',10],['7.1.4',12],['9.1.6',16]]as const){for(const prefix of ['spk','!spk']){const s=compile(`${prefix}${key} s100p[o1]`);assert.deepEqual(s.diagnostics,[],prefix+key);assert.equal(s.speakers?.length,count,key);}}
 assert.equal(speakerPreset('OCT').speakers.length,8);assert.equal(speakerPreset('STE').speakers.length,2);assert.equal(speakerPreset('OCT').channelMask,0);assert.equal(speakerPreset('7.1').speakers.filter(s=>s.lfe).length,1);assert.equal(speakerPreset('8').speakers.filter(s=>s.lfe).length,0);
});
test('Rings retain equal physical radii and angles inside a rectangular room',()=>{
 const s=compile('!room[20 6 30] spk8 s100');assert.deepEqual(s.diagnostics,[]);for(const p of s.speakers!)assert.ok(Math.abs(Math.hypot(p.x,p.z)-10)<1e-9);
 const height=compile('spk7.1.4 !r[20 6 30] s100');assert.deepEqual(height.diagnostics,[]);assert.ok(height.speakers!.every(p=>Math.abs(p.y)<=3));
});
test('LFE is omitted by positional DBAP and remains an unfiltered raw output',()=>{
 const s=compile("spk5.1 s100p[x 0 0 0]'1");assert.deepEqual(s.diagnostics,[]);const lfe=s.speakers!.findIndex(s=>s.lfe);const e=s.events[0];assert.equal(spatialGains(e.spatial,e.pan,0,s.speakers!)[lfe],0);
 const r=compile('spk5.1 s100p[o4]');assert.deepEqual(spatialGains(r.events[0].spatial,r.events[0].pan,0,r.speakers!),[0,0,0,1,0,0]);
});
test('WAVE masks match role counts, and raw rings remain unassigned',async()=>{
 for(const p of SPEAKER_PRESETS){if(p.channelMask){const count=p.channelMask.toString(2).replaceAll('0','').length;assert.equal(count,p.speakers.length,p.key);}}
 const p=speakerPreset('7.1.4');const v=new DataView(await encodeWav(p.speakers.map(()=>new Float32Array(10)),48000,p.channelMask).arrayBuffer());assert.equal(v.getUint32(40,true),p.channelMask);assert.equal(v.getUint16(22,true),12);
 for(const source of ['spk5 s100','!spkNOO s100','spk8 !spk[000 999] s100','(spk8 s100)'])assert.ok(compile(source).diagnostics.length,source);
});

test('Layout aliases cycle using Alt arrows without treating dots as decimal calibre',async()=>{
 const {cycleSpeakers}=await import('../src/editor/speakers');const source='spkOCT s100';const edit=cycleSpeakers(source,4,1);assert.equal(edit?.text,'spk12');assert.equal(cycleSpeakers('# spkOCT',5,1),undefined);assert.equal(cycleSpeakers('!spk[000 999]',5,1),undefined);
});
