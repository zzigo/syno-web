import test from 'node:test';
import assert from 'node:assert/strict';
import {adjustNumericToken as change} from '../src/editor/numbers';
test('caret selects hundreds, units, tenths or hundredths and retains its place',()=>{
 assert.equal(change('0254',1,1).text,'0354');
 assert.equal(change('123.45',0,1).text,'223.45');assert.equal(change('123.45',2,1).text,'124.45');
 assert.equal(change('123.45',4,1).text,'123.55');assert.equal(change('123.45',5,1).text,'123.46');
 const a=change('0.09',3,1);assert.equal(a.text,'0.10');assert.equal(change(a.text,a.caret,1).text,'0.11');
 assert.equal(change('0.12',4,-1).text,'0.11');assert.equal(change('0.12',3,1,true).text,'0.121');
 const fine=change('0.12',4,1,true);assert.equal(change(fine.text,fine.caret,1,true).text,'0.122');
 assert.equal(change('-0.01',4,1).text,'0.00');assert.equal(change('0.9',2,1).text,'1.0');
});
