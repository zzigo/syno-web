import test from 'node:test';import assert from 'node:assert/strict';import {foldCentre,drawFoldGlow} from '../src/visuals/glow';
test('the background glow and cube share their projected centre, including negative pan and visuals-only',()=>{
 assert.deepEqual(foldCentre(1000,800,true,false,-220,40),{x:500,y:432});assert.deepEqual(foldCentre(1000,800,false,false,-220,40),{x:280,y:432});assert.deepEqual(foldCentre(1000,800,true,true,0,0),{x:500,y:392});
 const calls:unknown[][]=[];const ctx={createRadialGradient(...args:unknown[]){calls.push(args);return {addColorStop(){}};},save(){},restore(){},fillRect(){},fillStyle:''};drawFoldGlow(ctx as unknown as CanvasRenderingContext2D,500,432,600,1000,800);assert.deepEqual(calls[0],[500,432,0,500,432,600]);
});
