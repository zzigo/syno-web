import test from 'node:test';import assert from 'node:assert/strict';
import {createGenerator} from '../src/vendor/fold-generators.js';
import {capsuleVertices,CAPSULE_EDGES} from '../src/core/apomixis';
import {compile} from '../src/core/parser';
import {probabilisticSilence} from '../src/core/silence';
test('capsules inherit one parent and lineage; closed topology survives deformation',()=>{
 const gen=createGenerator('apomixis',{mu:.3,spread:2.9,seeds:2,cap:128},3181),nodes=new Map<number,any>();
 for(let step=0;step<24;step++)for(const node of gen.step().born){nodes.set(node.id,node);if(node.parent!==null){const parent=nodes.get(node.parent)!;assert.equal(node.capsule.lineage,parent.capsule.lineage);assert.equal(node.capsule.generation,parent.capsule.generation+1);assert.ok(node.capsule.scale<=parent.capsule.scale);assert.equal(node.kind,'spore');}}
 assert.ok(nodes.size>2);assert.equal(CAPSULE_EDGES.length,9);
 const c=nodes.get(3).capsule;for(const p of [[0,0,0],[1,.9,-.8]]){const vertices=capsuleVertices(c,...p as [number,number,number]);assert.equal(vertices.length,5);assert.ok(vertices.flat().every(Number.isFinite));for(const [a,b]of CAPSULE_EDGES)assert.notDeepEqual(vertices[a],vertices[b]);}
});
test('a scoped A reproduces the whole timing motif, preserving ratios inside every capsule',()=>{
 const score=compile("A N24 U0 D1 s165'0.2");assert.deepEqual(score.diagnostics,[]);
 const patch=compile("A501(s165'0.2 0.3t220'0.4)");assert.deepEqual(patch.diagnostics,[]);
 const cells=new Map<number,typeof patch.events>();for(const e of patch.events)cells.set(e.node!.id,[...(cells.get(e.node!.id)??[]),e]);assert.ok(cells.size>2);
 for(const cell of cells.values()){assert.equal(cell.length,2);assert.equal(cell[0].growthInstance,cell[1].growthInstance);assert.ok(Math.abs(cell[1].freq.start/cell[0].freq.start-220/165)<1e-9);assert.ok(Math.abs(cell[1].dur/cell[0].dur-2)<1e-9);assert.ok(Math.abs((cell[1].t-cell[0].t)/cell[0].dur-1.5)<1e-8);}
});
test('probabilistic silence is deterministic, re-drawn per loop and shared by a group',()=>{
 const score=compile("(s220'1 t330'1)~?2");assert.deepEqual(score.diagnostics,[]);assert.deepEqual(score.events[0].restGates,score.events[1].restGates);assert.equal(score.duration,1);
 const gates=score.events[0].restGates;let silent=0;for(let i=0;i<1000;i++){const result=probabilisticSilence(gates,3181,i);assert.equal(result,probabilisticSilence(gates,3181,i));if(result)silent++;}assert.ok(silent>140&&silent<260);
 assert.equal(compile("s220'1~?").events[0].restGates?.[0].chance,.5);assert.equal(compile("s220'1~?9").events[0].restGates?.[0].chance,.9);assert.ok(probabilisticSilence(compile("s220'1~").events[0].restGates,1,0));
});

test('static A inherits the carrier/modulator ratio across environmental pitch transforms',()=>{const c=compile("A534(s165:s41.25i2v0.6'0.2)");assert.deepEqual(c.diagnostics,[]);for(const e of c.events)assert.ok(Math.abs(e.freq.start/e.modulation!.start-4)<1e-9);});
