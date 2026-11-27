import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,eventData} from '../src/core/parser';
import {validateAccretion} from '../src/core/accretion';
test('growth defaults and compact controls need no separator before their sound',()=>{
 for(const op of 'GASHRK')for(const suffix of ['', '321']){
  const compact=compile(`${op}${suffix}n1r9p[?]`,3181),spaced=compile(`${op}${suffix} n1r9p[?]`,3181);
  assert.deepEqual(compact.diagnostics,[],op+suffix);assert.ok(compact.events.length>0);assert.deepEqual(eventData(compact),eventData(spaced));
 }
 assert.deepEqual(eventData(compile('An1r9p[?]',3181)),eventData(compile('A N24 U0.08 D1 n1r9p[?]',3181)));
 assert.deepEqual(compile('GN2U0D1s220',3181).diagnostics,[]);
});
test('bare agent growth owns the remainder of its enclosing scope and accepts appended layers',()=>{
 const source='A&n1r9p[?]',score=compile(source,3181);
 assert.deepEqual(score.diagnostics,[]);assert.equal(score.events.length,1);
 const region=score.mutations![0];assert.equal(source.slice(region.from,region.to),'n1r9p[?]');assert.equal(region.agent,true);
 const result=validateAccretion(source,region,"t220v0.5'0.2",3181);assert.equal(result.ok,true,JSON.stringify(result));
 const nested=compile('(A&n1r9p[?])2 s440',3181);assert.deepEqual(nested.diagnostics,[]);assert.equal(nested.mutations?.length,1);assert.equal(nested.mutations?.[0].to,'(A&n1r9p[?])2 s440'.indexOf(')'));
 assert.ok(compile('A&',3181).diagnostics.length);
});
test('sequences coexist with growth without merging its polyphonic node events into one voice',()=>{
 const score=compile("G321s[220 330]p[?]'0.2",3181);assert.deepEqual(score.diagnostics,[]);assert.ok(score.events.length>1);assert.ok(score.events.every(e=>e.node&&e.pan.start>=-1&&e.pan.start<=1));
});
