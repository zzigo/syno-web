import test from 'node:test';import assert from 'node:assert/strict';
import {agentNumber,compactAgentNumbers} from '../src/core/agent-numbers';
import {compile} from '../src/core/parser';
import {validateAccretion} from '../src/core/accretion';
import {numberRoles} from '../src/core/number-roles';
test('agent notation uses at most one decimal, stripping trailing zeroes and retaining nonzero gates',()=>{
 const compact=compactAgentNumbers("s247.220668:s61.805167i1.234v0.04e0254'0.025p-0.024r4.00");
 assert.equal(compact,"s247.2:s61.8i1.2v0.1e0254'0.1p-0.1r4");assert.deepEqual(compile(compact).diagnostics,[]);
 assert.equal(agentNumber(0), '0');assert.equal(agentNumber(-0),'0');assert.equal(agentNumber(1.25),'1.3');
 const literal="!t[version 1.234]\n# f0.005\nl_[3.14159 dreams]v0.345'1.23";
 assert.equal(compactAgentNumbers(literal),"!t[version 1.234]\n# f0.005\nl_[3.14159 dreams]v0.3'1.2");
});
test('rounding an appended layer never changes the precision of existing music',()=>{
 const source="A&(s165:s41.25i1.234v0.6'1.2p-0.555)",region=compile(source).mutations![0];
 const result=validateAccretion(source,region,"t330.123v0.456'0.432p0.345",3181);assert.equal(result.ok,true,JSON.stringify(result));if(!result.ok)return;
 assert.ok(result.source.startsWith(source.slice(0,region.to)));const inserted=result.source.slice(region.to,-1);
 for(const r of numberRoles(inserted))if(r.text.includes('.'))assert.ok(r.text.split('.')[1].length<=1);
 assert.ok(result.source.includes('s41.25i1.234'));
});
