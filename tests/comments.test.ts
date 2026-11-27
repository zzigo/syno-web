import test from 'node:test';import assert from 'node:assert/strict';import {EditorState,EditorSelection} from '@codemirror/state';import {scoreCommentChanges} from '../src/editor/comments';
const toggle=(state:EditorState)=>state.update({changes:scoreCommentChanges(state)}).state;
test('comment toggles one line, selected lines, indentation and blank lines as one edit',()=>{
 const text='  s220\n\n  t330\nq440',state=EditorState.create({doc:text,selection:{anchor:0,head:text.indexOf('q440')}}),commented=toggle(state);
 assert.equal(commented.doc.toString(),'  # s220\n\n  # t330\nq440');assert.equal(toggle(commented).doc.toString(),text);
 const single=EditorState.create({doc:'s220\nt330',selection:{anchor:8}});assert.equal(toggle(single).doc.toString(),'s220\n# t330');
 const mixed=EditorState.create({doc:'# s220\nt330',selection:{anchor:0,head:11}});assert.equal(toggle(mixed).doc.toString(),'# # s220\n# t330');
});
test('overlapping multiple selections do not comment a line twice',()=>{
 const state=EditorState.create({doc:'s220\nt330',selection:EditorSelection.create([EditorSelection.cursor(0),EditorSelection.cursor(3),EditorSelection.cursor(7)]),extensions:[EditorState.allowMultipleSelections.of(true)]});
 assert.equal(toggle(state).doc.toString(),'# s220\n# t330');
});
