import test from 'node:test';import assert from 'node:assert/strict';
import {compile} from '../src/core/parser';import {adsrPoints,cursorEvent,previewEnvelope} from '../src/core/envelope';
test('cursor follows each sound, a function body and its invocation, leaving comments empty',()=>{
 const source="# envelope\nfoo=(s220e9151'2 t330e0254'1)\nfoo\nn1v0>1>0'4e0",s=compile(source);assert.deepEqual(s.diagnostics,[]);
 assert.equal(cursorEvent(s,source,source.indexOf('e9151')+2)?.envelope,'9151');assert.equal(cursorEvent(s,source,source.indexOf('e0254')+2)?.envelope,'0254');
 assert.equal(cursorEvent(s,source,source.lastIndexOf('foo')+1)?.envelope,'9151');assert.equal(cursorEvent(s,source,3),undefined);
 const contour=cursorEvent(s,source,source.indexOf('v0')+1)!;assert.equal(contour.envelope,'off');assert.deepEqual(previewEnvelope(contour),[{time:0,value:0},{time:2,value:1},{time:4,value:0}]);
});
test('ADSR preview includes the real duration and clips all stages for very short notes',()=>{
 for(const dur of [.001,.01,1,100]){const p=adsrPoints('9999',dur);assert.equal(p.at(-1)?.time,dur);assert.equal(p.at(-1)?.value,0);assert.ok(p.every((v,i)=>v.time>=0&&v.time<=dur&&v.value>=0&&v.value<=1&&(!i||v.time>=p[i-1].time)));}
 assert.deepEqual(adsrPoints('off',2),[{time:0,value:1},{time:2,value:1}]);
 const p=adsrPoints('0254',1);assert.equal(p[1].time,.003);assert.equal(p[2].value,5/9);assert.ok(Math.abs(1-p[3].time-.18)<1e-9);
});
