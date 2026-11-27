import test from 'node:test';
import assert from 'node:assert/strict';
import {attachOrbitInput} from '../src/visuals/orbit-input';
test('two-touch pinch zooms without orbiting; three touches orbit and release resets the pinch',()=>{
 const listeners=new Map<string,Function>();const element={dataset:{},setPointerCapture(){},addEventListener(name:string,fn:Function){listeners.set(name,fn);},removeEventListener(name:string){listeners.delete(name);}};
 const camera={zoom:1,yaw:0,pitch:0,autoRotate:false},input=attachOrbitInput(element as unknown as HTMLElement,camera);
 const pointer=(name:string,id:number,x:number,y=0)=>listeners.get(name)!({pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y});
 pointer('pointerdown',1,0);pointer('pointerdown',2,100);pointer('pointermove',2,200);assert.equal(camera.zoom,2);assert.equal(camera.yaw,0);
 pointer('pointerdown',3,100);pointer('pointermove',3,130,30);assert.ok(camera.yaw<0);assert.ok(camera.pitch<0);assert.equal(camera.zoom,2);assert.equal(camera.autoRotate,false);
 pointer('pointerup',3,130,30);pointer('pointermove',2,100);assert.equal(camera.zoom,1);
 let prevented=false;listeners.get('wheel')!({ctrlKey:true,deltaY:-10000,preventDefault(){prevented=true;}});assert.equal(camera.zoom,4);assert.ok(prevented);
 listeners.get('wheel')!({ctrlKey:true,deltaY:10000,preventDefault(){}});assert.equal(camera.zoom,.35);
 const before=camera.zoom;listeners.get('wheel')!({ctrlKey:false,metaKey:false,deltaY:100,preventDefault(){throw Error('ordinary scroll must pass through');}});assert.equal(camera.zoom,before);
 input.destroy();assert.equal(listeners.size,0);
});
test('shift scroll and pan-mode dragging translate the scene without changing rotation or zoom',()=>{const listeners=new Map<string,Function>(),element={dataset:{},setPointerCapture(){},addEventListener(n:string,fn:Function){listeners.set(n,fn);},removeEventListener(n:string){listeners.delete(n);}};const camera={zoom:1,yaw:0,pitch:0,autoRotate:false,panX:0,panY:0,panMode:false};const input=attachOrbitInput(element as unknown as HTMLElement,camera);listeners.get('wheel')!({shiftKey:true,deltaX:12,deltaY:-8,preventDefault(){}});assert.equal(camera.panX,-12);assert.equal(camera.panY,8);camera.panMode=true;listeners.get('pointerdown')!({pointerId:1,pointerType:'touch',button:0,clientX:10,clientY:10});listeners.get('pointermove')!({pointerId:1,pointerType:'touch',button:0,clientX:30,clientY:40});assert.equal(camera.panX,8);assert.equal(camera.panY,38);assert.equal(camera.zoom,1);assert.equal(camera.yaw,0);input.destroy();});
