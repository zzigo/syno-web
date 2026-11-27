import test from 'node:test';import assert from 'node:assert/strict';
import {automaticUpdate,updateMode,UPDATE_MODES} from '../src/core/update-mode';
test('automatic updates are opt-in and restricted to valid dirty main-editor playback',()=>{
 assert.equal(updateMode(null),'manual');assert.equal(updateMode('bad'),'manual');
 for(const mode of UPDATE_MODES){assert.equal(updateMode(mode),mode);assert.equal(automaticUpdate(mode,true,'editor',true,true),mode==='manual'?undefined:mode);
 for(const [playing,owner,valid,dirty] of [[false,'editor',true,true],[true,'agent',true,true],[true,'editor',false,true],[true,'editor',true,false]] as const)assert.equal(automaticUpdate(mode,playing,owner,valid,dirty),undefined);}
});
