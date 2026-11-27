import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveLSystem} from '../src/core/lsystem';
const rules=[{symbol:'A',replacement:'AB'},{symbol:'B',replacement:'A'}];
test('L applies every production in parallel, without rewriting a new child in the same step',()=>{
  const trace=deriveLSystem(rules,4);
  assert.deepEqual(trace.generations.map(g=>g.word),['A','AB','ABA','ABAAB','ABAABABA']);
  assert.deepEqual(trace.generations[2].parents,[0,0,1]);
});
test('L supports the complete four-rule prototype and an explicit axiom',()=>{
  const all=[...rules,{symbol:'C',replacement:'DB'},{symbol:'D',replacement:'BC'}];
  assert.deepEqual(deriveLSystem(all,2,'C').generations.map(g=>g.word),['C','DB','BCA']);
});
test('symbols without a production retain their identity',()=>{
  assert.equal(deriveLSystem([{symbol:'A',replacement:'AB'}],2).word,'ABB');
});
test('L is deterministic and does not mutate its rules',()=>{
  const before=JSON.stringify(rules);assert.deepEqual(deriveLSystem(rules,8),deriveLSystem(rules,8));assert.equal(JSON.stringify(rules),before);
});
test('L rejects ambiguous rules and exponential expansions before allocation',()=>{
  assert.throws(()=>deriveLSystem([...rules,{symbol:'A',replacement:'B'}]),/Duplicate/);
  assert.throws(()=>deriveLSystem([{symbol:'A',replacement:'AA'}],16),/symbol/);
  assert.throws(()=>deriveLSystem(rules,1.5),/generations/);
});

import {compile} from '../src/core/parser';
test('L invokes the explicitly bound expressions in final-word order',()=>{
  const score=compile("aa=s220'0.2\nbb=t330'0.3\nL3 A>AB B>A @A=aa @B=bb");
  assert.deepEqual(score.diagnostics,[]);assert.equal(score.lSystems[0].word,'ABAAB');
  assert.deepEqual(score.events.map(e=>e.symbol),['A','B','A','A','B']);
  assert.deepEqual(score.events.map(e=>e.freq.start),[220,330,220,220,330]);
  const expected=[0,.2,.5,.7,.9];score.events.forEach((e,i)=>assert.ok(Math.abs(e.t-expected[i])<1e-9));
});
test('L bindings can invoke parameterized functions and an explicit axiom reaches C/D',()=>{
  const score=compile("tone=s*v2'0.1\nL2:C A>AB B>A C>DB D>BC @A=tone220 @B=tone330 @C=tone440 @D=tone550");
  assert.deepEqual(score.diagnostics,[]);assert.equal(score.lSystems[0].word,'BCA');assert.deepEqual(score.events.map(e=>e.freq.start),[330,440,220]);
});
test('L diagnostics reject undefined motifs and missing musical bindings',()=>{
  assert.match(compile('L A>AB B>A').diagnostics[0].message,/binding/);
  assert.match(compile('L A>AB B>A @A=aa @B=bb').diagnostics[0].message,/Define aa/);
  assert.match(compile("aa=s220\nL A>AB B>A @A=aa @A=aa").diagnostics[0].message,/Duplicate/);
});
test('L source maps highlight the invoked binding and applied production',()=>{
  const source="aa=s220'0.2\nbb=t330'0.2\nL1 A>AB B>A @A=aa @B=bb",score=compile(source);
  assert.deepEqual(score.diagnostics,[]);assert.equal(source.slice(score.events[1].from,score.events[1].to),'@B=bb');
  assert.ok(score.events[1].traces.some(range=>source.slice(range.from,range.to)==='A>AB'));
});

import {readFileSync} from 'node:fs';
import {layoutEvents} from '../src/core/visualization';
test('bracketed turtle restores geometry AND musical time at a fork',()=>{
 const s=compile("aa=n2v0.1'1\n!vl\nL0:F[+F][-F]F/45 F>F @F=aa");
 assert.deepEqual(s.diagnostics,[]);assert.equal(s.visualization,'lsystem');
 assert.deepEqual(s.events.map(e=>e.t),[0,1,1,1]);assert.equal(s.duration,2);
 const segments=s.lSystems[0].turtle!.segments;assert.equal(segments.length,4);
 assert.deepEqual(segments.map(s=>s.parent),[null,0,0,0]);
 assert.deepEqual(segments[1].start,segments[2].start);assert.ok(segments[1].end.x<segments[2].end.x);
 assert.ok(s.events.every(e=>e.freq.start===2&&e.node?.kind==='l-system'));
});
test('silent X, balanced grammar and bounded turtle angles have explicit semantics',()=>{
 const s=compile("aa=s110'0.1\nL2:X/25 X>F[+X][-X] @F=aa");assert.deepEqual(s.diagnostics,[]);
 assert.ok(s.events.every(e=>e.symbol==='F'));assert.ok(s.lSystems[0].word.includes('X'));
 for(const text of ["L2:F/0 F>F @F=aa","L2:F/181 F>F @F=aa","L2 F>F[+F @F=aa","L2 F>F] @F=aa"]){assert.ok(compile("aa=s110\n"+text).diagnostics.length,text);}
});
test('Tree and Leaf bind complete noise and FM motifs and preserve reproducible geometry',()=>{
 for(const file of ['L-tree.syn','L-leaf.syn']){
  const source=readFileSync(new URL('../library/'+file,import.meta.url),'utf8'),s=compile(source);
  assert.deepEqual(s.diagnostics,[]);assert.deepEqual(s,compile(source));
  assert.ok(s.events.some(e=>e.wave==='n'));assert.ok(s.events.some(e=>e.modulation));
  assert.ok(s.lSystems[0].turtle!.segments.some(p=>p.depth>=2));
  const points=layoutEvents(s.events,'lsystem');assert.ok(points.every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
  // Each structural segment carries a two-voice motif, with unchanged base Hz.
  assert.equal(s.events.length,2*s.lSystems[0].turtle!.segments.length);
  assert.ok(s.events.filter(e=>e.wave!=='n').every(e=>[82.5,110,330].includes(e.freq.start)));
 }
});
test('Forest keeps three independent growth instances and collision-free parent links',()=>{
 const source=readFileSync(new URL('../library/Forest.syn',import.meta.url),'utf8'),s=compile(source);
 assert.deepEqual(s.diagnostics,[]);assert.equal(new Set(s.events.map(e=>e.growthInstance)).size,3);
 assert.ok(s.events.some(e=>e.wave==='n'));assert.ok(s.events.some(e=>e.modulation));assert.ok(s.events.some(e=>e.waveOptions));
 const points=layoutEvents(s.events,'cube'),ids=new Set(points.map(p=>p.id));assert.equal(ids.size,points.length);
 for(const p of points){if(p.parent)assert.ok(ids.has(p.parent));assert.ok(Math.abs(p.x)<=1.01&&Math.abs(p.z)<=1.01);}
 const centres=[0,1,2].map(id=>{const group=points.filter(p=>p.event.growthInstance===id);return {x:group.reduce((s,p)=>s+p.x,0)/group.length,z:group.reduce((s,p)=>s+p.z,0)/group.length};});
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(Math.hypot(centres[i].x-centres[j].x,centres[i].z-centres[j].z)>.5);
});
