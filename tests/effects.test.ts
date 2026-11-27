import test from 'node:test';
import assert from 'node:assert/strict';
import {compile} from '../src/core/parser';
import {filterHz,chopPeriod,chopCurve,reverbSeconds,reverbMix} from '../src/audio/effects';
test('filter sweep, volume contour, pan and reverb compose independently',()=>{
 const s=compile("n1v0>0.1>0'10p-1>1'10f2>7'10");
 assert.deepEqual(s.diagnostics,[]);assert.equal(s.duration,10);
 assert.deepEqual(s.events[0].filter,{start:2,end:7,duration:10});
 assert.deepEqual(s.events[0].volume.points,[{time:0,value:0},{time:5,value:.1},{time:10,value:0}]);
 const chords=compile("s220v0>1>0'4p0r4e9111\ns660v0>0.1>0'4p0r4e9111\ns1100v0>0.1>0'3p1r4e9111\ns1320v0>0.1>0'3.5p-1r4e9111\ns1440v0>0.2>0'4p1>0'4r4e9111");
 assert.deepEqual(chords.diagnostics,[]);assert.equal(chords.events.length,5);assert.equal(chords.duration,4);
 assert.ok(chords.events.every(e=>e.reverb===4));
});
test('chopper preserves fractional v1 controls and validates ranges',()=>{
 const s=compile("n1v0>0.1>0'10p-1>1'4h0.1r1\n1n1v0>0.1>0'10p1>-1'4h0.1r1\n4n2v0>0.1>0'10p-1>1'4h0.2r1\n5n3v0>0.1>0'10p1>-1'4h0.2r1");
 assert.deepEqual(s.diagnostics,[]);assert.equal(s.duration,15);assert.equal(s.events[0].chop,.1);
 for(const text of ['n1h-1','n1h10','n1f-1','n1f2>10','n1r10','n8','n5'])assert.ok(compile(text).diagnostics.length,text);
 assert.ok(compile('n1f0h0').events.length);assert.equal(chopPeriod(0),.1);assert.equal(chopPeriod(9),.9);
});
test('perceptual cutoff and native chopper signal stay bounded',()=>{
 assert.equal(filterHz(0,48000),40);assert.equal(filterHz(9,48000),18000);assert.equal(filterHz(9,22050),9922.5);
 assert.ok(Math.abs(filterHz(4.5,48000)-Math.sqrt(40*18000))<1e-8);
 const curve=chopCurve();assert.equal(curve[0],1);assert.ok(curve[128]===0);assert.ok(curve.every(x=>x>=0&&x<=1));
});

test('reverb spans dry to predominantly wet and a longer finite tail',()=>{
 assert.deepEqual(reverbMix(0),{dry:1,wet:0});assert.equal(reverbSeconds(0),0);
 assert.ok(Math.abs(reverbSeconds(9)-6.65)<1e-10);
 for(let i=1;i<=9;i++){
  const mix=reverbMix(i);assert.ok(Math.abs(mix.dry**2+mix.wet**2-1)<1e-10);
  assert.ok(mix.wet>reverbMix(i-1).wet);assert.ok(reverbSeconds(i)>reverbSeconds(i-1));
 }
 assert.ok(reverbMix(9).wet>.95);assert.ok(reverbMix(9).dry<.31);
});
