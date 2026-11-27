import test from 'node:test';
import assert from 'node:assert/strict';
import {cycleTuning} from '../src/editor/tunings';
import {tuningAliases} from '../src/core/tuning';
import {compile} from '../src/core/parser';

test('named tuning edits cycle in both directions at every token position, retaining the caret',()=>{
 for(const [index,alias] of tuningAliases.entries()){
  const source=`left=(u${alias} o220 s[n1 3 5]'n8) left`;
  for(let cursor=6;cursor<=10;cursor++)for(const direction of [-1,1]){
   const edit=cycleTuning(source,cursor,direction)!;
   assert.equal(edit.text,'u'+tuningAliases[(index+direction+tuningAliases.length)%tuningAliases.length]);
   assert.equal(edit.caret,cursor);
   assert.deepEqual(compile(source.slice(0,edit.from)+edit.text+source.slice(edit.to),3181).diagnostics,[]);
  }
 }
});
test('tuning cycling ignores comments, names, numbers, custom lists and neighboring controls',()=>{
 for(const [source,cursor] of [['# uDOR',4],['u15',2],['u[0 200 700]',5],['udor=()',3],['nameuDOR=()',6],['uDOR s220',7]] as const)
  assert.equal(cycleTuning(source,cursor,1),undefined);
});
