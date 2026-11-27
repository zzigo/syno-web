import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compile,eventData} from '../src/core/parser';
import {presets} from '../src/core/presets';
const source=readFileSync(new URL('../library/pieces/Confluencias.syn',import.meta.url),'utf8');
test('Confluencias has six forty-second parts and stays between three and ten principal voices',()=>{
 const score=compile(source,3181);assert.deepEqual(score.diagnostics,[]);assert.equal(score.duration,240);assert.equal(score.lSystems[0].word,'ABCDEF');
 const voices=[...score.events.filter(e=>e.feedbackBus===undefined).map(e=>({t:e.t,end:e.t+e.dur,weight:1})),...score.feedback.map(c=>({t:c.t,end:c.t+c.dur,weight:c.band?2:1}))];
 const boundaries=[...new Set([0,240,...voices.flatMap(e=>[e.t,e.end])])].sort((a,b)=>a-b);
 let maximum=0;
 for(let i=0;i<boundaries.length-1;i++){const t=(boundaries[i]+boundaries[i+1])/2;if(t>=240)continue;const count=voices.filter(v=>v.t<=t&&v.end>t).reduce((n,v)=>n+v.weight,0);assert.ok(count>=3&&count<=10,`${count} voices at ${t}`);maximum=Math.max(maximum,count);}
 assert.equal(maximum,10);
 const sections=score.events.filter(e=>e.dur===40&&!e.node&&e.feedbackBus===undefined).reduce((m,e)=>m.set(e.t,(m.get(e.t)??0)+1),new Map<number,number>());
 for(const t of [0,40,80,120,160,200])assert.equal(sections.get(t),3);
 assert.deepEqual(eventData(score),eventData(compile(source,3181)));
});
test('the climax contains a five-voice synchronous unison and recurring homorhythmic blocks',()=>{
 const score=compile(source);const groups=new Map<string,typeof score.events>();
 for(const e of score.events){if(e.node||e.feedbackBus!==undefined)continue;const key=`${e.t.toFixed(6)}:${e.dur.toFixed(6)}`;groups.set(key,[...(groups.get(key)??[]),e]);}
 assert.ok([...groups.values()].some(g=>g.length>=5&&g.every(e=>e.freq.start===220&&e.freq.end===220)&&g[0].t===184));
 assert.ok([...groups.values()].filter(g=>g.length>=3&&g.every(e=>e.envelope===g[0].envelope&&JSON.stringify(e.volume)===JSON.stringify(g[0].volume))).length>=12);
 const kinds=new Set(score.events.map(e=>e.node?.kind));for(const kind of ['leaf','ramet','seed','apex','tip','branch'])assert.ok(kinds.has(kind),kind);
 assert.ok(score.events.some(e=>e.modulation));assert.ok(score.events.some(e=>e.waveOptions));assert.ok(score.events.some(e=>e.freqRange));assert.ok(score.events.some(e=>e.freq.exponential));
 assert.ok(score.feedback.some(c=>c.band));assert.ok(score.feedback.some(c=>!c.band));
});
test('named growth expressions restore the caller controls instead of colouring later sections',()=>{
 const s=compile("grow=(G N2 s110'0.1) grow t220'1");assert.deepEqual(s.diagnostics,[]);assert.equal(s.events.filter(e=>e.wave==='t').length,1);assert.equal(s.events.find(e=>e.wave==='t')?.node,undefined);
 const preset=presets.find(p=>p.file==='pieces/Confluencias.syn');assert.equal(preset?.category,'Pieces');assert.equal(preset?.loop,false);assert.equal(preset?.seed,3181);
});
