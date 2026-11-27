import test from 'node:test';import assert from 'node:assert/strict';import {compile,eventData} from '../src/core/parser';import {parseAddition,validateAccretion,accretionCapacity,accretionMessages} from '../src/core/accretion';
const source="# retain this\nG234& (\ns165v0.4e0254'1.2p-0.5\nt330:s82.5i2v0.2e0254'0.6p0.5r2\n)";
function region(text=source){return compile(text).mutations![0];}
test('autonomous additions preserve original text and every musical event while adding a layer',()=>{
 const added="0.3a495v0.15f4e0254'0.3p0.6",result=validateAccretion(source,region(),added,3181);assert.equal(result.ok,true);if(!result.ok)return;
 assert.equal(result.source.slice(0,region().to),source.slice(0,region().to));assert.ok(result.source.endsWith(')'));assert.equal(result.addedEvents,1);assert.equal(result.expressions,3);
 const before=compile(source),after=compile(result.source);assert.equal(after.duration,before.duration);assert.deepEqual(eventData(after).filter((_,i)=>after.events[i].id<before.events.length),eventData(before));
 const second=validateAccretion(result.source,region(result.source),"s660v0.1e0254'0.2",3181);assert.equal(second.ok,true);
});
test('the model returns actual new notation, not a candidate index or arbitrary executable text',()=>{
 assert.equal(parseAddition('{"append":"t330v0.1\'0.3"}'),"t330v0.1'0.3");for(const output of ['{"edit":1}','write some notes','{"append":3}','{"append":""}'])assert.equal(parseAddition(output),undefined);
 assert.equal(validateAccretion(source,region(),'fetch("/private")',3181).ok,false);assert.equal(validateAccretion(source,region(),") s220v0.1'0.1 G&(",3181).ok,false);
 const messages=accretionMessages(source,'G',1.2,2);assert.match(messages[0].content,/LANGUAGE/);assert.match(messages[0].content,/never replace/);assert.match(messages[0].content,/1.2 seconds/);
});
test('growth rejects changes to loop timing, existing music, new inputs, loud layers or no audible addition',()=>{
 for(const code of ["s440v0.1'3", "i1v0.1'0.1", "s440v3'0.1",'# only a comment',"s440v0'0.1"]){const result=validateAccretion(source,region(),code,3181);assert.equal(result.ok,false,code);}
 const outside=source+"\nn2v0.1'0.2";assert.equal(validateAccretion(outside,region(outside),"s440v0.1'0.2",3181).ok,false,'changing deterministic old noise IDs is rejected');
 const r=validateAccretion(source,region(),"s440v0.1'0.2",3181,2);assert.equal(r.ok,false);assert.equal(accretionCapacity(source,region(),3181,2).full,true);
});
test('sequences, FM and existing feedback remain intact while new voices grow beside them',()=>{
 const score="K354& (s[220 330 ~ 440]v0.4e0254'n8\n{n2v0.01'0.02e0}d0.013g1.04f5v1'1.2\n)";const before=compile(score);assert.deepEqual(before.diagnostics,[]);
 const result=validateAccretion(score,region(score),"t660:s165i2v0.1e0254'0.3",3181);assert.equal(result.ok,true);if(result.ok){const after=compile(result.source);assert.equal(after.feedback.length,before.feedback.length);assert.equal(after.duration,before.duration);}
});
test('streamed append strings are usable as soon as their quoted value is complete',()=>{
 assert.equal(parseAddition('{"append":"s330v0.1\'0.2"'),"s330v0.1'0.2");assert.equal(parseAddition('{"append":"s330v0.1'),undefined);assert.equal(parseAddition('{"append":"s330v0.1\\n t440v0.1\'0.2"'),"s330v0.1\n t440v0.1'0.2");assert.equal(parseAddition('{"edit":0,"append":"s330"'),undefined);
});
test('named calls count as separate growth expressions instead of bypassing the cap',()=>{
 const named="tone=s330v0.1'0.2\nG&(tone tone s220v0.3'1)";assert.equal(accretionCapacity(named,region(named),3181).expressions,3);
});

test('accretion rejects the reported quieter FM clone but accepts a genuinely new layer',()=>{
 const patch="A143& (\ns165:s41.25i1.2v0.6e0254'1.2p-0.5\n)",r=region(patch);
 const copy=validateAccretion(patch,r,"s165:s41.25i1.2v0.30e0254'1.2p-0.5",3181);
 assert.equal(copy.ok,false);if(!copy.ok)assert.match(copy.error,/duplicate/);
 assert.equal(validateAccretion(patch,r,"s247.5:s61.875i1.2v0.3e0254'1.2p0.5",3181).ok,true);
});

test('A accretion uses audible parent-relative levels and explains real lineage controls',async()=>{
 const {accretionLevels}=await import('../src/core/accretion');
 const patch="A143& (\ns165:s41.25i1.2v0.6e0254'1.2p-0.5\n0.3t165:s41.25i1.8v0.4e0254'1.2p0.5\n)",r=region(patch);
 const levels=accretionLevels(patch,r,3181);assert.ok(levels.max>.5);assert.ok(levels.min>.05);
 const tiny=validateAccretion(patch,r,"t330v0.05e0254'0.1p-0.2",3181);assert.equal(tiny.ok,false);if(!tiny.ok)assert.match(tiny.error,/too quiet or too brief/);
 const child="0.15s165:s41.25i1.2>2.4'0.8v0>0.6>0'1.1e0p0.2>0.6'1.1";assert.equal(validateAccretion(patch,r,child,3181).ok,true);
 const prompt=accretionMessages(patch,'A',1.5,10,'',r.parameters).map(m=>m.content).join('\n');assert.match(prompt,/APOMIXIS/);assert.match(prompt,/clonal parent/);assert.match(prompt,/N=2/);assert.match(prompt,/U=0.444/);
});
test('a lowpass that erases a new pitched fundamental does not count as an audible addition',()=>{
 const patch="A143&(s165:s41.25i1.2v0.6e0254'1.2p-0.5 0.3t165:s41.25i1.8v0.4e0254'1.2p0.5)";
 assert.equal(validateAccretion(patch,region(patch),"s330:s82.5i2v0.15p-0.8f0.6r0.4d0.3h0.9e0254'1.1",3181).ok,false);
 assert.equal(validateAccretion(patch,region(patch),"s330:s82.5i2v0.4p-0.8f5e0254'1.1",3181).ok,true);
});

test('SmolLM receives a concise executable contract, not a song brief',()=>{
 const messages=accretionMessages("s220v0.4e0'2",'R',2,3,'',undefined,'ollama:smollm2:1.7b');
 const prompt=messages.map(m=>m.content).join('\n');
 assert.ok(prompt.length<2500);assert.match(messages[0].content,/one key "append"/);assert.match(messages[1].content,/bend pitch or pan smoothly/);assert.doesNotMatch(messages[1].content,/TROPISM:/);
 const example=JSON.parse(messages[0].content.match(/Output shape example: (\{.*\})\. Compose/)![1]);
 assert.deepEqual(compile(example.append).diagnostics,[]);
 assert.match(accretionMessages('s220','R',2,3,'Wrong envelope',undefined,'smollm2')[1].content,/Correction required: Wrong envelope/);
});
test('incompatible streamed envelopes are diagnosed before metadata can consume generation',async()=>{
 const {additionProtocolError}=await import('../src/core/accretion');
 for(const text of ['{','{"app','{"append":','{"append":"s220"}'])assert.equal(additionProtocolError(text),undefined);
 for(const key of ['content','name','genre','description','edit']){
  const text=JSON.stringify({[key]:{name:'TROPISM',genre:'Song'}});
  assert.match(additionProtocolError(text)!,/Expected.*append/);assert.equal(parseAddition(text),undefined);
 }
 assert.equal(additionProtocolError('{"daughter":{','daughter'),undefined);
 assert.match(additionProtocolError('{"content":{','daughter')!,/daughter/);
});
