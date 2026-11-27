import test from 'node:test';import assert from 'node:assert/strict';import {inferenceRetry} from '../src/integrations/agent-retry';
test('transient inference failures back off without treating notation errors as server failures',()=>{
 assert.deepEqual([0,1,2,3,4,10].map(n=>inferenceRetry(Error('Ollama HTTP 500'),n).seconds),[5,10,20,40,60,60]);
 assert.equal(inferenceRetry('HTTP 429',0).seconds,5);assert.equal(inferenceRetry('Failed to fetch',0).seconds,5);
 for(const message of ['invalid syNo expression','HTTP 400','user stopped generation'])assert.equal(inferenceRetry(message,0).seconds,0);
});
