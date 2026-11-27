import test from 'node:test';import assert from 'node:assert/strict';import {compile} from '../src/core/parser';import {mutateLocal} from '../src/core/mutation';import {numberRoles} from '../src/core/number-roles';
test('local and agentic suffixes preserve the musical data and mark only their body',()=>{for(const [suffix,agent] of [['G',false],['&G',true]] as const){const source=`!b100\n(s[n1 2 3 4]v1'n8)${suffix}`;const score=compile(source);assert.deepEqual(score.diagnostics,[]);assert.equal(score.mutations?.[0].agent,agent);const r=score.mutations![0];assert.equal(source.slice(r.from,r.to),"s[n1 2 3 4]v1'n8");assert.equal(score.events.length,1);}});
test('local mutations stay reproducible, valid and preserve code outside the marked region',()=>{for(const mode of ['G','A','S','H','R','K']){let source=`# outside\n(s[n1 2 3 4]v1f5'n8)${mode}\ns110v0.1'2`;for(let i=0;i<8;i++){const r=compile(source).mutations![0],a=mutateLocal(source,r,3181,i),b=mutateLocal(source,r,3181,i);assert.deepEqual(a,b);assert.ok(a,mode);assert.ok(a!.source.startsWith('# outside\n('));assert.ok(a!.source.endsWith("s110v0.1'2"));assert.deepEqual(compile(a!.source).diagnostics,[]);source=a!.source;}}});
test('pitch positions and frequencies receive distinct lexical roles including registers',()=>{const r=numberRoles("s[n1 2 [3 -1] ++2] v2 s[110 220] s440 # n7");assert.deepEqual(r.filter(x=>x.kind==='pitch').map(x=>x.text),['1','2','3','-1','++2']);assert.deepEqual(r.filter(x=>x.kind==='frequency').map(x=>x.text),['110','220','440']);});
test('input shorthand and channel trim compose with ordinary effects',()=>{const a=compile("!i1=(0.9)\nid3 ih3 i1v2'10");assert.deepEqual(a.diagnostics,[]);assert.equal(a.events.length,3);assert.ok(a.events.every(e=>e.wave==='i'&&e.inputChannel===1));assert.equal(a.events[0].delay?.start,3);assert.equal(a.events[1].chop,3);assert.equal(a.events[2].volume.start,1.8);for(const src of ['i9','!i1=(2) i1','i1:s220'])assert.ok(compile(src).diagnostics.length,src);});
test('agent decisions accept only an explicit bounded index, including an incomplete streamed object',async()=>{const {decisionIndex}=await import('../src/core/mutation');assert.equal(decisionIndex('{"edit":2}',4),2);assert.equal(decisionIndex('{"edit":{"index":1,"value":',4),1);for(const text of ['choose 1 please','{"edit":20}','{"edit":"1"}','{"value":1}','{"edit":-1}'])assert.equal(decisionIndex(text,4),undefined);});
test('tempo is lexical so an entire clocked patch can be wrapped for local mutation',()=>{const s=compile("s220'n8 (!b60 s330'n8) s440'n8");assert.deepEqual(s.diagnostics,[]);assert.deepEqual(s.events.map(e=>e.dur),[.25,.5,.25]);assert.deepEqual(compile("(!b100 s[n1 2 3]v1'n8)G").diagnostics,[]);});
test('mutable timbre frequency lists retain frequency colour while random effect bounds stay values',()=>{const r=numberRoles('?[300 [400 500]]h?[0.1:3]');assert.deepEqual(r.filter(x=>x.kind==='frequency').map(x=>x.text),['300','400','500']);assert.deepEqual(r.filter(x=>x.kind==='value').map(x=>x.text),['0.1','3']);});

test('editor mutation range preserves unchanged text and whole unicode characters',async()=>{
 const {mutationRange}=await import('../src/editor/mutation-range');
 for(const [before,after] of [['s220v1','s330v1'],['s220','s220 r3'],['s220 r3','s220'],['# 🌱\ns220','# 🌲\ns220'],['s220','s220']]){
  const edit=mutationRange(before,after);
  assert.equal(before.slice(0,edit.from)+edit.inserted+before.slice(edit.from+edit.removed.length),after);
  assert.equal(after.slice(edit.from,edit.to),edit.inserted);
  assert.ok(!/[\uDC00-\uDFFF]/.test(edit.inserted[0]??''));
 }
});

test('timed input pan has the same gate as constant pan, with a separate gate override',()=>{for(const src of ["2i1h.1p1>-1'0.5","2i1h.1p1'0.5"]){const s=compile(src);assert.deepEqual(s.diagnostics,[]);assert.equal(s.duration,2.5);assert.equal(s.events[0].t,2);assert.equal(s.events[0].dur,.5);}const held=compile("2i1h.1p1>-1'0.5'8").events[0];assert.equal(held.dur,8);assert.equal(held.pan.duration,.5);assert.equal(compile('i1').events[0].dur,8);assert.equal(compile('i1p1>-1').events[0].dur,8);});

test('prefix growth scopes only their parenthesized material and preserve old arguments',()=>{
 const source="G234 (s220'0.1) s440'0.1",score=compile(source);assert.deepEqual(score.diagnostics,[]);assert.ok(score.events.length>2);assert.ok(score.events.filter(e=>e.freq.start!==440).every(e=>e.node));const outside=score.events.find(e=>e.soundRange?.from===source.indexOf('s440'))!;assert.equal(outside.node,undefined);assert.equal(outside.freq.start,440);
 assert.deepEqual(compile("G(4,0.3,1) s220'0.1").diagnostics,[]);
 const both=compile("A234 (s220'0.1) H123 (t330'0.1) q440'0.1");assert.deepEqual(both.diagnostics,[]);assert.equal(new Set(both.events.filter(e=>e.node).map(e=>e.growthInstance)).size,2);assert.equal(both.events.find(e=>e.wave==='q')?.node,undefined);
});
test('prefix agent growth retains its algorithm, compact controls and exact writable body',()=>{
 for(const prefix of ['G234&','A&','S&','H&','R&','K&']){const source=`# before\n${prefix} (s220v1'0.2)\ns110'0.1`,score=compile(source);assert.deepEqual(score.diagnostics,[],prefix);const region=score.mutations![0];assert.equal(region.agent,true);assert.equal(region.algorithm,prefix[0]);assert.equal(source.slice(region.from,region.to),"s220v1'0.2");const changed=mutateLocal(source,region,3181,0)!;assert.ok(changed);assert.ok(changed.source.startsWith('# before\n'+prefix+' ('));assert.ok(changed.source.endsWith("\ns110'0.1"));if(prefix==='G234&')assert.equal(region.parameters?.count,4);}
});
test('agentic L mutates grammar structure reproducibly inside its parentheses',()=>{
 let source="# before\nL&(aa=s220v1'0.1\nbb=n2v0.2f5'0.1\nL3/25 A>A[+B]A B>BB @A=aa @B=bb)\ns110'0.1";
 const original=compile(source);assert.deepEqual(original.diagnostics,[]);let branchEdit=false;
 for(let generation=0;generation<5;generation++){const score=compile(source),region=score.mutations![0],a=mutateLocal(source,region,3181,generation),b=mutateLocal(source,region,3181,generation);assert.deepEqual(a,b);assert.ok(a);const next=compile(a!.source);assert.deepEqual(next.diagnostics,[]);assert.ok(a!.source.startsWith('# before\nL&('));assert.ok(a!.source.endsWith("\ns110'0.1"));assert.ok(a!.source.includes("bb=n2v0.2f5'0.1"),'noise timbre binding remains intact');assert.notEqual(next.lSystems[0].word,score.lSystems[0].word);branchEdit ||= /branch/.test(a!.description);source=a!.source;}
 assert.ok(branchEdit,'grammar offers branching changes, not only symbol counts');
});
test('the reported K354 agent patch has valid bounded candidates before a model is invoked',()=>{
 const source="K354& (\ns[220 ~ 330 440 ~]v0.4e0254'n8p-0.6r2\nt[660 440 ~ 880]v0.2f5e0254'n16p0.6\nn2v0.06f6h2e0254'0.4p0r3\n)";const score=compile(source);assert.deepEqual(score.diagnostics,[]);assert.equal(score.mutations![0].algorithm,'K');for(let i=0;i<8;i++){const candidate=mutateLocal(source,score.mutations![0],3181,i);assert.ok(candidate);assert.deepEqual(compile(candidate!.source).diagnostics,[]);}
});

test('A143 directed edits offer audible changes, divergent branches and no return to recent states',async()=>{
 const {directedOptions}=await import('../src/core/mutation');
 let source="A143& (\ns165:s41.25i1.2v0.6e0254'1.2p-0.5\n)";
 const initial=source,region=compile(source).mutations![0],choices=directedOptions(source,region,3181,0);
 assert.ok(choices.some(o=>/frequency/.test(o.description)));
 assert.ok(choices.some(o=>/ · i · /.test(o.description)));
 assert.ok(choices.every(o=>!/ · v · /.test(o.description)));
 const branch=choices.find(o=>/add branch/.test(o.description));assert.ok(branch);
 const events=compile(branch!.source).events;assert.equal(events[0].freq.start,165);assert.notEqual(events[1].freq.start,165,'branch is not just a quieter clone');
 const recent:string[]=[];
 for(let generation=0;generation<16;generation++){
  const score=compile(source),options=directedOptions(source,score.mutations![0],3181,generation,recent);
  assert.ok(options.length,'generation '+generation);assert.deepEqual(options,directedOptions(source,score.mutations![0],3181,generation,recent));
  for(const option of options){assert.deepEqual(compile(option.source).diagnostics,[]);assert.ok(!recent.includes(option.source));}
  recent.push(source);source=options[0].source;
 }
 assert.notEqual(source,initial);
});
