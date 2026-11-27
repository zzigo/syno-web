import test from 'node:test';import assert from 'node:assert/strict';import{compile,eventData}from'../src/core/parser';import{scoreSections,sectionAtTime,sectionAtCursor,sectionScore,tempoAt}from'../src/core/sections';import{numberRoles}from'../src/core/number-roles';import{musicalCanonical,setViewMessage}from'../src/core/visualization';import{stockyMixtures,stockyWindow}from'../src/visuals/stocky';
test('piece title is literal, named sections retain scoped timing, tempo follows written declarations',()=>{
 const source="!t[One # 3 ?[1,2]]\n!b120 ;intro s220'1 ;<second verse> !b60 t330'n4 ;2 a440'1",score=compile(source); // first closing bracket terminates title
 assert.ok(score.diagnostics.length);
 const s=compile("!title[One # 3]\n!b120 ;intro s220'1 ;<second verse> !b60 t330'n4 ;2 a440'1");assert.deepEqual(s.diagnostics,[]);assert.equal(s.title,'One # 3');assert.deepEqual(s.sections?.map(x=>[x.name,x.t]),[['intro',0],['second verse',1]]);assert.deepEqual(s.events.map(e=>[e.t,e.dur]),[[0,1],[1,1],[4,1]]);assert.equal(tempoAt(s,0),120);assert.equal(tempoAt(s,1),60);assert.equal(tempoAt(s,s.tempos![1].from,true),60);assert.equal(sectionAtTime(s,1.1),1);assert.equal(sectionAtCursor(s,s.sections![1].to),1);assert.deepEqual(numberRoles('!t[Part 987] ;part2 ;<room 3>'),[]);
 for(const text of ['!t[] s220','!t[unclosed s220','(!t[x] s220)',';<unclosed s220'])assert.ok(compile(text).diagnostics.length,text);
});
test('section audition clips shared processing, remaps buses, preserves global source IDs and random renewal metadata',()=>{
 const full=compile("s110'1 ;first {s220v1>3'2}r2 ;second {{s?[330 440]v1'1}p-1>1}r4");assert.deepEqual(full.diagnostics,[]);assert.equal(scoreSections(full)[0].name,'start');const cut=sectionScore(full,2);assert.equal(cut.duration,1);assert.deepEqual(cut.sections?.map(s=>[s.name,s.t]),[['second',0]]);assert.equal(cut.events.length,1);assert.equal(cut.events[0].t,0);assert.equal(cut.events[0].id,2);assert.equal(cut.events[0].outputBus,1);assert.equal(cut.outputBuses[1].parent,0);assert.equal(cut.outputBuses[0].id,0);assert.equal(cut.playbackRange?.from,3);assert.equal(cut.playbackRange?.index,2);assert.ok(cut.randomTimeSource);assert.equal(sectionScore(full,-1).events.length,3);
});
test('named markers in repeated groups instantiate at each local clock without changing old bare ; and ;n4 waits',()=>{
 const s=compile("!b120 (;bud s220'0.5 ;n4 t330'0.5)2");assert.deepEqual(s.diagnostics,[]);assert.deepEqual(s.sections?.map(s=>s.t),[0,1.5]);assert.deepEqual(s.events.map(e=>e.t),[0,1,1.5,2.5]);
});
test('Stocky aliases affect only visualization, collapse mixture components and expose a bounded follow window',()=>{
 const text="tone=(s220'2 s330'2 s440'2) tone";const s=compile('!stocky '+text);assert.deepEqual(s.diagnostics,[]);assert.equal(s.visualization,'stocky');assert.deepEqual(eventData(s),eventData(compile(text)));assert.equal(stockyMixtures(s).length,1);assert.equal(stockyMixtures(s)[0].hi,440);assert.equal(stockyMixtures(s)[0].lo,220);assert.equal(musicalCanonical('!stocky '+text),musicalCanonical(text));assert.equal(setViewMessage('!stocky s220','cube',s.viewMessages),'!vc s220');assert.deepEqual(stockyWindow(175,100,true),{from:92.8,to:116.8});assert.deepEqual(stockyWindow(175,100,false),{from:0,to:175});
});
test('a sole zero-argument call between root separators inherits its name; parallel voices and timed/argument calls do not',()=>{
 const s=compile("intro=(s220'1) chorus=(t330'2) intro ; chorus");assert.deepEqual(s.diagnostics,[]);assert.deepEqual(s.sections?.map(s=>[s.name,s.t,s.implicit]),[['intro',0,true],['chorus',1,true]]);assert.equal(sectionAtCursor(s,8),0);
 const explicit=compile("intro=(s220'1) ;<opening room> intro");assert.deepEqual(explicit.sections?.map(s=>s.name),['opening room']);
 const parallel=compile("aa=s220 bb=t330 aa bb ; aa bb");assert.equal(parallel.sections?.length??0,0);
 const zero=compile("aa=s220 0aa ; 1aa");assert.equal(zero.sections?.length??0,0);
 const macros=compile("aa=s* aa220 ; 1aa330");assert.equal(macros.sections?.length??0,0);
});
