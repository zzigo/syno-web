import test from 'node:test';import assert from 'node:assert/strict';import {chopClock} from '../src/audio/chop-clock';import {chopPeriod} from '../src/audio/effects';
test('visual chopper matches open/closed native phases and retains phase across a hot rate edit',()=>{
 const period=chopPeriod(9),clock=chopClock({start:9,end:9,duration:0},2);assert.equal(clock.levelAt(1),0);assert.equal(clock.levelAt(2+.2*period),1);assert.equal(clock.levelAt(2+.75*period),0);
 const before=clock.levelAt(2+.7*period);clock.update({start:9,end:0,duration:2},2+.7*period,0);assert.equal(clock.levelAt(2+.7*period),before);
 for(let t=2;t<6;t+=.01){const level=clock.levelAt(t);assert.ok(Number.isFinite(level)&&level>=0&&level<=1);}
});
