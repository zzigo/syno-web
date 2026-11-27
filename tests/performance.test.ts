import test from 'node:test';import assert from 'node:assert/strict';
import {performanceSlots,slotValue,slotAtPosition,slotPosition,playKey} from '../src/core/performance';import{compile}from'../src/core/parser';
test('PLAY maps compact growth and ADSR digits independently in source order',()=>{
 const source="G588@gop ?111v3>1i2e0254'0.11r4p-1>1",slots=performanceSlots(source,0);
 assert.deepEqual(slots.map(s=>s.text),['5','8','8','111','3','1','2','0','2','5','4']);assert.deepEqual(slots.slice(0,3).map(s=>s.label),['G · N','G · U','G · D']);
 const slot=slots[8],changed=source.slice(0,slot.from)+slotValue(slot,3)+source.slice(slot.to);assert.match(changed,/e0354/);assert.deepEqual(compile(changed).diagnostics,[]);
 const late=performanceSlots(source,source.indexOf("'0.11")+1);assert.equal(late[0].text,'0.11');assert.equal(late[0].step,.01);
});
test('PLAY ignores comments and names; anchors include the digit under the cursor',()=>{
 const source="# G999 100\nvoice=(s220v1'2)\nvoice";const slots=performanceSlots(source,0);assert.deepEqual(slots.map(s=>s.text),['220','1','2']);
 assert.equal(performanceSlots(source,source.indexOf('220')+1)[0].text,'220');assert.equal(performanceSlots(source,source.length).length,0);
});
test('PLAY key pairs use physical key codes and do not accidentally take other keys',()=>{
 assert.deepEqual(playKey('KeyQ','q'),{index:0,direction:1});assert.deepEqual(playKey('KeyA','a'),{index:0,direction:-1});assert.deepEqual(playKey('Semicolon','ñ'),{index:9,direction:-1});assert.deepEqual(playKey('Quote',"'"),{index:10,direction:-1});assert.equal(playKey('Space',' '),undefined);
});
test('PLAY values keep decimal calibre, packed digits and bounded slider endpoints',()=>{
 const source="s220v3p-1f4'0.11",slots=performanceSlots(source,0),seconds=slots.at(-1)!;assert.equal(slotValue(seconds,.1),'0.10');assert.equal(slotValue(seconds,.111),'0.111');
 const pan=slots.find(s=>s.label==='p')!;assert.equal(slotValue(pan,8),'1');assert.equal(slotAtPosition(pan,0),-1);assert.equal(slotAtPosition(pan,1),1);
 const frequency=slots[0];assert.ok(Math.abs(slotAtPosition(frequency,slotPosition(frequency))-220)<1e-8);
 assert.equal(slotValue(performanceSlots('G009',0)[0],-1),'0');assert.equal(slotValue(performanceSlots('G009',0)[2],10),'9');
});

test('comma shortens and period lengthens musical figures while numeric times retain decimal calibre',async()=>{
 const {performanceTime,changePerformanceTime}=await import('../src/core/performance');
 const n=performanceTime("s220'n4",0)!;assert.equal(changePerformanceTime(n,-1),"'n8");assert.equal(changePerformanceTime(n,1),"'n2");
 const seconds=performanceTime("s220'0.011",0)!;assert.equal(changePerformanceTime(seconds,-1),"'0.010");assert.equal(changePerformanceTime(seconds,1),"'0.012");
 const ratio=performanceTime("s220'n8/3",0)!;assert.equal(changePerformanceTime(ratio,-1),"'n16/3");
 const beats=performanceTime("s220'b2",0)!;assert.equal(changePerformanceTime(beats,-1),"'b1");
 const source="# '123\ns220'n4 t330'0.01";assert.equal(performanceTime(source,0)?.text,"'n4");assert.equal(performanceTime(source,source.indexOf('t330'))?.text,"'0.01");assert.equal(performanceTime('s220',0),undefined);
});

test('a PLAY anchor on a packed digit does not drift backward into the preceding digit',()=>{const source="G588 s220e0254'n4",first=performanceSlots(source,0)[1];assert.equal(performanceSlots(source,first.from)[0].from,first.from);const anchor=source.indexOf("'n4");assert.equal(performanceSlots(source,anchor)[0].text,'4');assert.equal(performanceSlots(source,anchor)[0].label,'figure n');});

test('PLAY at end-of-code recovers a complete row instead of an empty fader console',async()=>{
 const{performanceAnchorAt}=await import('../src/core/performance');
 const source="!b60\ns220v1e0254'n4h2r3",anchor=performanceAnchorAt(source,source.length);
 assert.equal(anchor,source.indexOf('220'));assert.equal(performanceSlots(source,anchor)[0].text,'220');
 assert.equal(performanceAnchorAt(source,source.indexOf('h2')),source.indexOf('h2')+1);
 assert.equal(performanceAnchorAt('',0),0);
});
