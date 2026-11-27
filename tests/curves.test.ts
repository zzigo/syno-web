import test from 'node:test';
import assert from 'node:assert/strict';
import {compile} from '../src/core/parser';
import {intensityContour} from '../src/core/curves';
test('untimed noise contour rises and falls without a hold',()=>{
 const s=compile('n1v0>1>0e0');assert.deepEqual(s.diagnostics,[]);assert.equal(s.duration,4);assert.equal(s.events[0].envelope,'off');
 assert.deepEqual(s.events[0].volume.points,[{time:0,value:0},{time:2,value:1},{time:4,value:0}]);
});
test('timed contour implements the requested 1000 / 100 / 1000 seconds',()=>{
 const s=compile("n1v0'1000>1'100>0'1000e0");assert.deepEqual(s.diagnostics,[]);assert.equal(s.duration,2100);
 assert.deepEqual(s.events[0].volume.points,[{time:0,value:0},{time:1000,value:1},{time:1100,value:1},{time:2100,value:0}]);
});
test('two-point sweeps and ordinary volume gates remain compatible',()=>{
 assert.deepEqual(compile("s220v0>1'4").events[0].volume,{start:0,end:1,duration:4});
 assert.equal(compile("s220v3'4").events[0].dur,4);
 assert.equal(compile('s220e0000').events[0].envelope,'0000');
});
test('interior peaks and oversized durations are validated',()=>{
 assert.ok(compile('n1v0>10>0').diagnostics.length);
 assert.throws(()=>intensityContour([0,1,0],[86400,1,86400]),/duration/);
 assert.deepEqual(intensityContour([0,1,.5,0],[]).points?.map(p=>p.time),[0,2,4,6]);
});
