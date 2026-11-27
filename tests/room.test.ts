import test from 'node:test';import assert from 'node:assert/strict';
import {compile,eventData} from '../src/core/parser';import {dbap,spatialGains} from '../src/core/spatial';
import {spatialAspect,ROOM_EDGES,ROOM_CORNERS} from '../src/visuals/spatial';
import {setViewMessage} from '../src/core/visualization';
test('Room aliases carry metres and scale compact speakers per axis, regardless of declaration order',()=>{
 const a=compile('!spk[000 999] !room[20 30 40] s100'),b=compile('!r[20,30,40] !spk[000 999] s100');
 assert.deepEqual(a.diagnostics,[]);assert.deepEqual(a.speakers,[{id:1,x:-10,y:-15,z:-20},{id:2,x:10,y:15,z:20}]);assert.deepEqual(a.speakers,b.speakers);assert.deepEqual(a.room,b.room);assert.deepEqual(spatialAspect(a),[.5,.75,1]);assert.match(JSON.stringify(eventData(a)),/room/);
 const measured=compile('!room[20 30 40] !spk[[9 -2 1 3] [8 2 1 3]] s100');assert.deepEqual(measured.speakers?.[0],{id:9,x:-2,y:1,z:3});
 for(const source of ['!room[20 0 30] s100','!r[1 2] s100','!r[1 2 3 4] s100','!r[1 2 3] !room[1 2 3] s100','(!room[1 2 3] s100)'])assert.ok(compile(source).diagnostics.length,source);
});
test('Co-located outputs remain independent through a multi-hop raw path',()=>{
 const score=compile("!spk[123 323 432 432] s100'6p[o1>4>3>2]");assert.deepEqual(score.diagnostics,[]);const e=score.events[0];
 for(const [at,expected]of [[0,[1,0,0,0]],[2,[0,0,0,1]],[4,[0,0,1,0]],[6,[0,1,0,0]]]as const)assert.deepEqual(spatialGains(e.spatial,e.pan,at,score.speakers!),expected);
 assert.deepEqual(spatialGains(e.spatial,e.pan,3,score.speakers!),[0,0,.5,.5]);assert.ok(compile('!spk[123 323] s100p[o1>4]').diagnostics.length);
});
test('Room growth follows its three coordinates unless an explicit pan overrides it',()=>{
 const score=compile('!room[20 10 30] !spk[000 999] G123(s220v1e0\'0.2)');assert.deepEqual(score.diagnostics,[]);assert.ok(score.events.length>1);for(const e of score.events){assert.equal(e.spatial?.mode,'xyz');assert.deepEqual(e.spatial?.values.map(r=>r.start),[e.node!.x,e.node!.y,e.node!.z]);}
 const raw=compile('!r[20 10 30] !spk[000 999] G123(s220p[o1])');assert.deepEqual(raw.diagnostics,[]);assert.ok(raw.events.every(e=>e.spatial?.mode==='outputs'));
});
test('Spatial and parameter view messages coexist as explicit choices, with Stocky aliases',()=>{
 for(const [message,mode] of [['!vc','cube'],['!vp','parameters'],['!vf','phyllotaxis'],['!vs','spatial'],['!vl','lsystem'],['!vt','stocky'],['!st','stocky'],['!stocky','stocky']]as const){const s=compile(`${message} s100`);assert.deepEqual(s.diagnostics,[]);assert.equal(s.visualization,mode);}
 assert.equal(setViewMessage('!st\ns100','stocky',compile('!st\ns100').viewMessages),'!vt\ns100');assert.ok(compile('!vd s100').diagnostics.length);
});
test('The room has a complete twelve-edge contour and DBAP accepts co-located speakers',()=>{
 assert.equal(ROOM_EDGES.length,12);assert.equal(ROOM_CORNERS.length,8);const speakers=[{id:1,x:1,y:2,z:3},{id:2,x:1,y:2,z:3}];const gain=dbap([0,0,0],speakers,[20,30,40]);assert.ok(gain.every(Number.isFinite));assert.ok(Math.abs(gain[0]**2+gain[1]**2-1)<1e-10);
});
