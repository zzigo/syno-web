import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,eventData} from '../src/core/parser';
import {setViewMessage,layoutEvents,musicalCanonical} from '../src/core/visualization';

test('system visual messages preserve musical events, with the last message selecting the layout',()=>{
  const source="G N12\ns220v2'0.2";
  const base=compile(source),points=compile(`!vf\n${source}`),cube=compile(`!vf !vc\n${source}`);
  assert.deepEqual(points.diagnostics,[]);assert.equal(points.visualization,'phyllotaxis');assert.equal(cube.visualization,'cube');
  assert.deepEqual(eventData(base),eventData(points));assert.deepEqual(eventData(base),eventData(cube));
  assert.equal(musicalCanonical(base.canonical),musicalCanonical(points.canonical));
});
test('dropdown edits real messages while preserving examples in comments',()=>{
  const source="# !vf is a documented example\n!vc # active view\ns220'1\n!vc";
  const score=compile(source),changed=setViewMessage(source,'phyllotaxis',score.viewMessages);
  assert.match(changed,/# !vf is a documented example/);assert.match(changed,/!vf # active view/);
  assert.equal(compile(changed).viewMessages.length,1);
  assert.equal(compile(changed).visualization,'phyllotaxis');
  assert.match(setViewMessage("s220'1",'cube',[]),/^!vc\n/);
});
test('visual dropdown still replaces a message while other syntax is invalid',()=>{
  assert.equal(setViewMessage("!vc\ns220x3",'phyllotaxis',[]),"!vf\ns220x3");
});
test('unknown or nested visual messages are rejected',()=>{
  for(const code of ["!vx s220","(!vf s220)2"]){assert.ok(compile(code).diagnostics.length);}
});
test('point layout has one finite point per event and never mutates the score',()=>{
  const score=compile("G N16 s220'0.2"),before=JSON.stringify(score.events);
  const points=layoutEvents(score.events,'phyllotaxis');
  assert.equal(points.length,score.events.length);assert.equal(JSON.stringify(score.events),before);
  for(const point of points){assert.ok([point.x,point.y,point.z].every(Number.isFinite));assert.ok(Math.abs(point.y)<=1);}
  assert.deepEqual(layoutEvents([],'phyllotaxis'),[]);
  assert.ok(layoutEvents(compile("s220'1").events,'phyllotaxis').every(p=>Number.isFinite(p.y)));
});

test('plain sound trajectories follow pan, log pitch and multipoint intensity in score time',async()=>{
 const {soundPositionAt}=await import('../src/core/visualization');
 const score=compile("2s440>220'20v0>5>0'20.5p-1>1'20h5r3f8>2'20");
 assert.deepEqual(score.diagnostics,[]);const e=score.events[0],before=JSON.stringify(e);
 const start=soundPositionAt(e,0),middle=soundPositionAt(e,12),peak=soundPositionAt(e,12.25),end=soundPositionAt(e,30);
 assert.equal(start.x,-1);assert.equal(start.z,-1);assert.equal(middle.x,0);assert.ok(middle.y<start.y);
 assert.ok(Math.abs(peak.z-(5/9*2-1))<1e-10);assert.equal(end.x,1);assert.equal(end.z,-1);
 assert.equal(JSON.stringify(e),before);
});
test('trajectory sampling preserves holds, constant parameters and boundary values',async()=>{
 const {rampValueAt,soundPositionAt}=await import('../src/core/visualization');
 const event=compile("n1v0'1>9'2>0'1e0").events[0];
 assert.equal(rampValueAt(event.volume,2),9);assert.equal(rampValueAt(event.volume,4),0);
 assert.equal(soundPositionAt(event,2).y,0);assert.equal(soundPositionAt(event,2).z,1);
 assert.equal(soundPositionAt(event,-1).z,-1);
 assert.equal(soundPositionAt(compile('s440v3p.5').events[0],.5).x,.5);
});
