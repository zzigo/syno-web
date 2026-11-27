import test from 'node:test';import assert from 'node:assert/strict';import {tokenUsage,activityLabel} from '../src/integrations/model-activity';
test('model usage marks live estimates and replaces them with provider token counts',()=>{
 assert.deepEqual(tokenUsage(undefined,101,9),{promptTokens:26,completionTokens:3,estimated:true});
 const provider={promptTokens:30,completionTokens:5,totalTokens:35,durationMs:100,ttftMs:10,tokensPerSec:50,costUsd:0,promptTokenBasis:'provider' as const,completionTokenBasis:'provider' as const};
 assert.deepEqual(tokenUsage(provider,101,9),{promptTokens:30,completionTokens:5,estimated:false});assert.equal(tokenUsage({...provider,completionTokenBasis:'chunks'},101,9).estimated,true);
 const activity={working:true,phase:'streaming',algorithm:'L',elapsed:1,...tokenUsage(undefined,101,9)};assert.match(activityLabel(activity),/AI L .*≈26\/3/);assert.match(activityLabel({...activity,working:false,estimated:false}),/ai L 26\/3/);
});
test('partial telemetry cannot pin live output at zero and inactive regions explain their state',async()=>{
 const {agentIndicator}=await import('../src/integrations/model-activity');const a={working:false,phase:'idle',algorithm:'',elapsed:0,promptTokens:0,completionTokens:0,estimated:true};
 const flags={paused:false,playing:true,ready:false};assert.equal(agentIndicator(a,'K',flags)?.label,'AI K MODEL');assert.equal(agentIndicator(a,'K',{...flags,ready:true})?.label,'AI K WAIT');assert.equal(agentIndicator(a,'K',{...flags,ready:true,paused:true})?.label,'AI K PAUSE');
 const metrics={promptTokens:0,completionTokens:0,totalTokens:0,durationMs:0,ttftMs:0,tokensPerSec:0,costUsd:0,promptTokenBasis:'estimate' as const,completionTokenBasis:'chunks' as const};assert.equal(tokenUsage(metrics,100,40).completionTokens,10);assert.match(activityLabel({...a,working:true,algorithm:'K',phase:'waiting',elapsed:3.5}),/wait 3.5s/);
});
