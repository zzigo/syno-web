import {audibleIdentity} from '../src/core/audible-identity';
import test from 'node:test';import assert from 'node:assert/strict';
import {compile} from '../src/core/parser';
test('onset prefixes shift groups, finite repeats and outer processor clocks together',()=>{
 for(const body of ["(n1v1.5e0122f6r8p?'0.4~?4)","(s220'0.2 t330'0.3)3","(s220'0.2)r4h2"]){
  const plain=compile(body,3181),shifted=compile('0.3'+body,3181);assert.deepEqual(shifted.diagnostics,[],body);assert.equal(shifted.events.length,plain.events.length);
  for(let i=0;i<plain.events.length;i++)assert.ok(Math.abs(shifted.events[i].t-plain.events[i].t-.3)<1e-9);
  for(let i=0;i<plain.outputBuses.length;i++)assert.ok(Math.abs(shifted.outputBuses[i].t-plain.outputBuses[i].t-.3)<1e-9);
 }
});
test('delayed group mutation regions still point at their exact editable body',()=>{
 const source="0.3(s220'0.4)&A",score=compile(source);assert.deepEqual(score.diagnostics,[]);assert.equal(source.slice(score.mutations![0].from,score.mutations![0].to),"s220'0.4");
 const group=compile("0.3(n1v1.5e0122f6r8p?'0.4~?4)",3181),sound=compile("0.3n1v1.5e0122f6r8p?'0.4~?4",3181);assert.equal(audibleIdentity(group.events[0]),audibleIdentity(sound.events[0]));
});

test('group ? uses seeded integer repeats, with explicit choices or closed ranges',()=>{
 const source="0.3(n1v1.5e0122f6r8p?'0.4~?4)?",counts=new Set<number>();
 for(let cycle=0;cycle<24;cycle++){const score=compile(source,3181,cycle),again=compile(source,3181,cycle);assert.deepEqual(score.diagnostics,[]);assert.deepEqual(score.events,again.events);assert.ok(score.events.length>=1&&score.events.length<=9);counts.add(score.events.length);assert.equal(score.randomTimeSource,source);assert.equal(score.events[0].t,.3);for(let i=1;i<score.events.length;i++)assert.ok(Math.abs(score.events[i].t-score.events[i-1].t-.4)<1e-8);}
 assert.ok(counts.size>1);
 for(let cycle=0;cycle<12;cycle++){assert.ok([2,4,8].includes(compile("(s220'0.1)?[2 4 8]",3181,cycle).events.length));const n=compile("(s220'0.1)?[2:8]",3181,cycle).events.length;assert.ok(n>=2&&n<=8);}
 for(const bad of ["(s220)?[0:2]","(s220)?[1.5 2]","(s220)?[129]","(s220)?'1"])assert.ok(compile(bad).diagnostics.length,bad);
});

test('a copied trailing backslash separates statements without changing onset, count or literal text',async()=>{const {normalizeScoreSeparators}=await import('../src/core/score-separators');const slash=String.fromCharCode(92);const body="0.3(n1v1.5e0122f6r8p?'0.4~?4)";for(const suffix of ['', '2','?']){const plain=compile(body+suffix,3181),copied=compile(body+suffix+slash,3181);assert.deepEqual(copied.diagnostics,[]);assert.equal(copied.canonical,plain.canonical);assert.deepEqual(copied.events,plain.events);}const parallel=compile("s220'1"+slash+"t330'1");assert.deepEqual(parallel.diagnostics,[]);assert.deepEqual(parallel.events.map(e=>e.t),[0,0]);const literal='!t[one'+slash+'two]'+slash+'# path C:'+slash+'folder'+slash+'file';assert.equal(normalizeScoreSeparators(literal),'!t[one'+slash+'two]\n# path C:'+slash+'folder'+slash+'file');});
