import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {compile} from '../src/core/parser';import {presets} from '../src/core/presets';import {searchHelp} from '../src/core/help-content';
test('every comment/uncomment desk case compiles independently and the shared help includes it',async()=>{
 const text=await readFile(new URL('../library/Feedback-primer.syn',import.meta.url),'utf8'),cases=text.split('\n').filter(l=>/^# (?:[staqn]\d|[({])/.test(l)||/^[({]/.test(l)).map(l=>l.replace(/^# /,''));assert.equal(cases.length,16);for(const source of cases){const s=compile(source);assert.deepEqual(s.diagnostics,[],source);assert.ok(s.events.length);}
 const study=presets.find(p=>p.file==='Feedback-primer.syn');assert.equal(study?.loop,false);assert.equal(study?.code,text);assert.ok(searchHelp('comment/uncomment').some(s=>s.html.includes('Feedback-primer.syn')));
});
