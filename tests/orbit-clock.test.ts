import test from 'node:test';
import assert from 'node:assert/strict';
import {createOrbitClock} from '../src/visuals/orbit-clock';
test('orbit pauses in place and resumes without including the paused interval',()=>{
 const clock=createOrbitClock(.001);
 assert.equal(clock.sample(100,true),0);
 assert.equal(clock.sample(1100,true),1);
 assert.equal(clock.sample(1100,false),1);
 assert.equal(clock.sample(9000,false),1);
 assert.equal(clock.sample(9000,true),1);
 assert.equal(clock.sample(10000,true),2);
 // Two canvases sampling the shared clock do not double its speed.
 assert.equal(clock.sample(10000,true),2);
});
