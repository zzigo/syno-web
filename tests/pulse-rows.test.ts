import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{compile}from'../src/core/parser';
const source=readFileSync(new URL('../library/pieces/Pulse-rows.syn',import.meta.url),'utf8'),bar=4*60/170,form=source.slice(0,source.indexOf('# PLAY THE FORM'));
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('Pulse rows is a finite 48-bar form, with one-bar instrument rows and a four-bar riser',()=>{
 const score=compile(source);assert.deepEqual(score.diagnostics,[]);close(score.duration,48*bar);assert.ok(score.events.length>500&&score.events.length<2048);
 for(const name of ['kick','snare','hats','bass','lowbass','air','roll']){const row=compile(form+'\n'+name);assert.deepEqual(row.diagnostics,[],name);close(row.duration,bar);}
 const riser=compile(form+'\nriser');close(riser.duration,4*bar);assert.equal(riser.events[0].volume.end,0);
});
test('breakdowns remove drums and bass; second drop changes the bass without losing the bar grid',()=>{
 const score=compile(source);for(const start of [12,28]){const events=score.events.filter(e=>e.t>=start*bar-1e-8&&e.t<(start+4)*bar-1e-8);assert.ok(events.length);assert.ok(events.every(e=>e.wave==='t'&&e.freq.start>=220));}
 const definitions=(name:string)=>{const start=source.indexOf(name+'='),end=source.indexOf('\n',start);return score.events.filter(e=>e.soundRange&&e.soundRange.from>=start&&e.soundRange.to<=end);};
 const snare=definitions('snare');close(snare[0].t,4*bar+60/170);close(snare[1].t,4*bar+3*60/170);
 const low=definitions('lowbass');assert.ok(low.length);close(low[0].t,36*bar);
 assert.ok(definitions('spores').every(e=>!!e.node));assert.ok(definitions('bass').every(e=>!e.node));
});
