import test from'node:test';import assert from'node:assert/strict';import{compile,eventData}from'../src/core/parser';import{migrateRandomRanges}from'../src/core/random-brackets';import{patchSnapshot,encodePatch,decodePatch}from'../src/core/shared-patch';
test('frequency lists select only exact alternatives with comma/space equivalence, independently each cycle',()=>{
 const seen=new Set<number>();for(let cycle=0;cycle<64;cycle++){
  const a=compile('s?[100 200 400]',3181,cycle),b=compile('s?[100,200,400]',3181,cycle);assert.deepEqual(a.diagnostics,[]);assert.deepEqual(eventData(a),eventData(b));assert.ok([100,200,400].includes(a.events[0].freq.start));seen.add(a.events[0].freq.start);
  assert.ok([110,880].includes(compile('s?[110,880]',3181,cycle).events[0].freq.start));
 }assert.equal(seen.size,3);
});
test('colon intervals and open ends retain intermediate values and domain defaults',()=>{
 for(const text of ['s?[110:880]','s?[110:]','s?[:880]']){const s=compile(text);assert.deepEqual(s.diagnostics,[]);assert.ok(s.events[0].freq.start>55&&s.events[0].freq.start<1760);}
 assert.ok(![110,880].includes(compile('s?[110:880]').events[0].freq.start));
 for(const text of ['s?[880:110]','s?[1800:]','s220p?[-2:1]','s220\'?[3:]','s?[]'])assert.ok(compile(text).diagnostics.length,text);
});
test('choices apply to duration, pan, continuous controls and nested sequence cells',()=>{
 for(let cycle=0;cycle<12;cycle++){
  const s=compile("!sa s[300,400,500]'?[0.1,1]v?[1,3,5]p?[-1,0,1]h?[0.1,2,4]",3181,cycle);assert.deepEqual(s.diagnostics,[]);assert.ok(s.events.every(e=>[.1,1].some(d=>Math.abs(d-e.dur)<1e-9)&&[1,3,5].includes(e.volume.start)&&[-1,0,1].includes(e.pan.start)&&[.1,2,4].includes(e.chop!)));
  const cell=compile("!sa s[?[100,200,400] 500]v[?[:4] 2]'0.2",3181,cycle);assert.deepEqual(cell.diagnostics,[]);assert.ok([100,200,400].includes(cell.events[0].freq.start));assert.ok(cell.events[0].volume.start>=0&&cell.events[0].volume.start<=4);
 }
 assert.deepEqual(compile('?[s,a]220').diagnostics,[]);
});
test('legacy draft/snapshot ranges migrate without changing literal lyrics or comments; grammar-2 links stay exact',async()=>{
 const old="s?[110,880]'?[0.1 1] p?[-1,1]\nl[choose ?[1,2]] # ?[3,4]",migrated=migrateRandomRanges(old);assert.ok(migrated.startsWith("s?[110:880]'?[0.1:1] p?[-1:1]"));assert.ok(migrated.includes('l[choose ?[1,2]] # ?[3,4]'));
 const legacy=patchSnapshot({version:1,title:'old',source:'s?[110,880]',seed:3181,loop:true});assert.equal(legacy.source,'s?[110:880]');assert.equal(legacy.grammar,2);
 const current=patchSnapshot({version:1,grammar:2,title:'new',source:'s?[110,880]',seed:3181,loop:true}),token=await encodePatch(current);assert.ok(token.startsWith('2'));assert.deepEqual(await decodePatch(token),current);
});
