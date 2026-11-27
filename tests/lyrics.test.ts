import test from 'node:test';import assert from 'node:assert/strict';
import {compile,eventData} from '../src/core/parser';
import {numberRoles} from '../src/core/number-roles';
import {lyricRanges} from '../src/core/lyrics';
test('literal lyrics compile with a deterministic default gate and the normal effect chain',()=>{
 const score=compile("l[this is a verse of my first song]v3r4d0.3h2");
 assert.deepEqual(score.diagnostics,[]);assert.equal(score.events.length,1);assert.equal(score.events[0].lyrics?.text,'this is a verse of my first song');assert.equal(score.events[0].lyrics?.vocoder,false);assert.equal(score.events[0].envelope,'off');assert.equal(score.events[0].reverb,4);
});
test('a whole verse crosses a continuous carrier melody, while articulated notes take consecutive audio slices',()=>{
 const score=compile("!b120 l[the trees are singing]:s[n1 3 5 8]'n4r3");
 assert.deepEqual(score.diagnostics,[]);assert.equal(score.events.length,1);assert.equal(score.duration,2);assert.equal(score.events[0].lyrics?.vocoder,true);assert.equal(score.events[0].lyrics?.from,undefined);assert.equal(score.events[0].freq.points?.length,4);
 const articulated=compile("!b120 !sa l[the trees are singing]:a[n1 3 5 8]'n4");assert.deepEqual(articulated.diagnostics,[]);assert.equal(articulated.events.length,4);assert.deepEqual(articulated.events.map(e=>[e.lyrics?.from,e.lyrics?.to]),[[0,.25],[.25,.5],[.5,.75],[.75,1]]);
});
test('lyrics are literal: comments and digits do not become notation or PLAY values',()=>{
 const source="l[I sing #1, G234 and 440!]v2'3 # trailing comment";
 const score=compile(source);assert.deepEqual(score.diagnostics,[]);assert.equal(score.events[0].lyrics?.text,'I sing #1, G234 and 440!');assert.ok(score.canonical.includes('#1'));assert.ok(!score.canonical.includes('trailing comment'));assert.deepEqual(numberRoles(source).map(r=>r.text),['2','3']);assert.equal(lyricRanges('# l[ignore]\nl[yes]')[0].text,'yes');
 assert.notDeepEqual(eventData(score),eventData(compile(source.replace('440','441'))));
});
test('prosody can be composed as sequential lyric events with musical figures and waits',()=>{
 const score=compile("!b120 l[this]'n8 ; l[is]'n16 ; l[a]'n16 ; l[verse]'n4");assert.deepEqual(score.diagnostics,[]);assert.equal(score.duration,1);assert.deepEqual(score.events.map(e=>e.t),[0,.25,.375,.5]);
 for(const bad of ['l[]','l[unterminated','l[a [nested]]','l[hi]:n1'])assert.ok(compile(bad).diagnostics.length,bad);
});

 test('lyric payload does not masquerade as visual commands or block a duration control',async()=>{
 const {musicalCanonical}=await import('../src/core/visualization');const {performanceTime}=await import('../src/core/performance');const {contextCommandAt}=await import('../src/core/context-command');
 assert.notEqual(musicalCanonical('l[hi !vl world]'),musicalCanonical('l[hi world]'));
 const source="l[I sing #1]'4r2";assert.equal(performanceTime(source,0)?.numerator,4);assert.equal(contextCommandAt(source,source.length-1)?.name,'Reverberation');
 });

test('l_ adds synchronized captions without changing voice synthesis, effects or literal parsing',async()=>{
 const {lyricCaption,lyricRanges}=await import('../src/core/lyrics');
 const source="l_[my #1 verse]:s[220 330]'1r3";const score=compile(source);
 assert.deepEqual(score.diagnostics,[]);assert.equal(score.events[0].lyrics?.captions,true);assert.equal(score.events[0].lyrics?.text,'my #1 verse');assert.equal(score.events[0].dur,2);assert.deepEqual(numberRoles(source).map(r=>r.text),['220','330','1','3']);assert.equal(lyricRanges(source)[0].text,'my #1 verse');
 assert.equal(lyricCaption(score.events,-.01),'');assert.equal(lyricCaption(score.events,0),'my #1 verse');assert.equal(lyricCaption(score.events,1.99),'my #1 verse');assert.equal(lyricCaption(score.events,2),'');assert.equal(lyricCaption([],1),'');
 const sequence=compile("l_[first]'1 ; l_[second]'1");assert.deepEqual(sequence.diagnostics,[]);assert.equal(lyricCaption(sequence.events,.99),'first');assert.equal(lyricCaption(sequence.events,1),'second');
 assert.equal(lyricCaption(compile("l[hidden]'2").events,1),'');
 const articulated=compile("!sa l_[one verse]:a[220 330]'1");assert.deepEqual(articulated.diagnostics,[]);assert.equal(lyricCaption(articulated.events,1.2),'one verse');
 assert.ok(compile('l_=[]').diagnostics.length,'underscored variable names retain their definition grammar');
});

test('vocoder w is a 0–9 wet/dry control, follows the verse and leaves FM index independent',()=>{
 const s=compile("l_[the circuit sings]:a[220 330 440 220]w2>8v3'1r3");assert.deepEqual(s.diagnostics,[]);assert.equal(s.events[0].vocoderMix?.start,2);assert.equal(s.events[0].vocoderMix?.end,8);assert.equal(s.events[0].vocoderMix?.duration,4);assert.equal(s.events[0].index.start,1);
 const timed=compile("l[hello]:s220w9>0'3v3'4");assert.deepEqual(timed.diagnostics,[]);assert.equal(timed.events[0].vocoderMix?.duration,3);
 assert.equal(compile('l[hi]:s220').events[0].vocoderMix?.start,9);
 for(const code of ['s220w4','l[hello]w4','l[hello]:s220w10','l[hello]:s220w-1','l[hello]:s220w[1 2]'])assert.ok(compile(code).diagnostics.length,code);
});
