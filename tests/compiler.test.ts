import test from 'node:test';
import assert from 'node:assert/strict';
import { compile, eventData } from '../src/core/parser';
import { presets } from '../src/core/presets';
import { extractScore } from '../src/integrations/orf';

test('retains v1 sound atom, sweep, pan and ADSR semantics',()=>{
  const score=compile("s100>300'1v4p-1>1'1e9159 r3");
  assert.ok(score.diagnostics.length,'independent r3 must not be silently accepted');
  const valid=compile("s100>300'1v4p-1>1'1e9159r3");
  assert.deepEqual(valid.diagnostics,[]);const e=valid.events[0];
  assert.deepEqual(e.freq,{start:100,end:300,duration:1});assert.deepEqual(e.pan,{start:-1,end:1,duration:1});assert.equal(e.envelope,'9159');assert.equal(e.reverb,3);
});
test('presets compile with bounded finite values',()=>{
  for(const p of presets){const s=compile(p.code);assert.deepEqual(s.diagnostics,[],p.name);assert.ok(s.events.length>0);assert.ok(s.duration<=240);for(const e of s.events){assert.ok(Number.isFinite(e.t));assert.ok(Number.isFinite(e.freq.start));assert.ok(e.dur>0);}}
});
test('whitespace is parallel, offsets displace, finite loops repeat group duration',()=>{
  const s=compile("s220'1 0.5t330'1 (s440'0.25)4");assert.equal(s.events.length,6);
  assert.deepEqual(s.events.filter(e=>e.freq.start===440).map(e=>e.t),[0,.25,.5,.75]);assert.equal(s.duration,1.5);
});
test('parameterized definitions preserve call-site source spans',()=>{
  const source="fm=s*:s*v2'1\nfm220,55\nfm330,110";
  const s=compile(source);assert.deepEqual(s.diagnostics,[]);assert.equal(s.events[0].freq.start,220);assert.equal(s.events[0].modulation?.start,55);
  assert.equal(source.slice(s.events[1].from,s.events[1].to),'fm330,110');
});
test('same seed repeats all six imported HYLON generators; different seeds affect structure',()=>{
  for(const mode of 'GASHRK'){
    const code=`${mode} N32 U0.2 D1\ns110v3'0.2`;
    const a=compile(code,3181),b=compile(code,3181),c=compile(code,3182);
    assert.deepEqual(a.diagnostics,[],mode);assert.deepEqual(a,b,mode);assert.notDeepEqual(a.events.map(e=>e.node),c.events.map(e=>e.node),mode);
  }
});
test('comments alter source positions without altering musical event data',()=>{
  assert.deepEqual(eventData(compile("s220'1")),eventData(compile("# commentary\ns220'1")));
  assert.equal(compile("s220'1 # comment").canonical,compile("  s220'1 ").canonical);
});
test('unknown syntax and missing arguments reject the whole score',()=>{
  for(const source of ["s220'1 garbage","F0>10 s220","fm=s*:s*\nfm220",'s220v0>10\'1','s220p2','s220x3',"s220'0",'(s220','s220)','n9']){
    const s=compile(source);assert.ok(s.diagnostics.length,source);assert.equal(s.events.length,0,source);
  }
});
test('recursive and empty expansions are bounded',()=>{
  assert.ok(compile('aa=(aa) aa').diagnostics.length);
  assert.ok(compile('((((()128)128)128)128)128').diagnostics.length);
  assert.ok(compile('('.repeat(18)+'s220'+')'.repeat(18)).diagnostics.length);
});
test('source mappings select exact sounding chain and growth selector',()=>{
  const text="G N4\n# source\ns220v3'0.2";const s=compile(text);assert.deepEqual(s.diagnostics,[]);
  for(const event of s.events){assert.equal(text.slice(event.from,event.to),"s220v3'0.2");assert.equal(text.slice(event.traces[0].from,event.traces[0].to),'G');}
});
test('fenced model output is extracted without executing anything',()=>{
  assert.equal(extractScore("```syno\ns220'1\n```"),"s220'1");assert.ok(compile('<script>alert(1)</script>').diagnostics.length);
});

test('FM supports oscillator types and a swept modulation index',()=>{
  const score=compile("s220:t55i0>6'4v3e1354");assert.deepEqual(score.diagnostics,[]);
  assert.equal(score.events[0].modulatorWave,'t');assert.deepEqual(score.events[0].index,{start:0,end:6,duration:4});assert.equal(score.events[0].dur,4);
  assert.ok(compile("s220:s55i21").diagnostics.length);
  assert.ok(compile("s220:s55:s3").diagnostics.length,'unsupported nested FM must be rejected');
});

test('volume and pan interpolate independently and extend implicit note duration',()=>{
  const score=compile("s100>1000'4v0>1'3p0>1'5");assert.deepEqual(score.diagnostics,[]);
  const e=score.events[0];assert.deepEqual(e.volume,{start:0,end:1,duration:3});assert.deepEqual(e.pan,{start:0,end:1,duration:5});assert.equal(e.dur,5);
  assert.equal(compile('s220v0>1').events[0].dur,2);
  assert.deepEqual(compile("s220v1<0'4").events[0].volume,{start:0,end:1,duration:4});
});
test('explicit pan has precedence over growth-node panning',()=>{
  const score=compile("G N8 s220p0>1'4");assert.deepEqual(score.diagnostics,[]);
  for(const e of score.events)assert.deepEqual(e.pan,{start:0,end:1,duration:4});
});
test('every commented Scale desk alternative is a valid tuning and works with the same growth',async()=>{const {readFileSync}=await import('node:fs');const {parseTuning}=await import('../src/core/tuning');const source=readFileSync(new URL('../library/tunings/00-Scale-desk.syn',import.meta.url),'utf8');const choices=[...source.matchAll(/^# TRY (u.*?) \|/gm)].map(m=>m[1]);assert.ok(choices.length>=45);for(const choice of choices){assert.ok(parseTuning(choice.slice(1)).cents.length>=2,choice);assert.deepEqual(compile(`${choice} o110 G N8 U0.04 D0.8 s165v0.5'0.2`).diagnostics,[],choice);}});
