import test from 'node:test';
import assert from 'node:assert/strict';
import {extractScore} from '../src/integrations/agent-score';
import {compile} from '../src/core/parser';
test('agent narration becomes explicit comments while score statements are retained',()=>{
  const raw="Here is the updated score:\n!vc\n# SYNO\ns220v0>1'4\n\nThis score uses a rising intensity.";
  const score=extractScore(raw);assert.match(score,/^# Here is/);assert.match(score,/# This score/);assert.deepEqual(compile(score).diagnostics,[]);
});
test('comment normalization does not silently repair invalid musical tokens',()=>{
  assert.ok(compile(extractScore('Here is the score:\ns:s0v1')).diagnostics.length);
  assert.ok(compile(extractScore('Here is the score:\nP0\ns220')).diagnostics.length);
  assert.ok(compile(extractScore('Only a prose explanation here.')).diagnostics.length);
});
test('partial code can be copied and validated before a closing markdown fence arrives',()=>{
  const code=extractScore("```syno\ns220'1");assert.deepEqual(compile(code).diagnostics,[]);
  assert.equal(extractScore("```syno\ns220'1\n```"),"s220'1");
});
