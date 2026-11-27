/** Pointer and wheel gestures shared by the background and FOLD pod. 0BSD. */
export interface OrbitState {yaw:number;pitch:number;autoRotate:boolean;zoom:number;panX?:number;panY?:number;panMode?:boolean}
export function attachOrbitInput(element: HTMLElement,camera:OrbitState,enabled=()=>true) {
  const pointers=new Map<number,{x:number;y:number;touch:boolean}>();
  let pinch:number|undefined;
  const distance=()=>{const touches=[...pointers.values()].filter(p=>p.touch);return touches.length===2?Math.hypot(touches[0].x-touches[1].x,touches[0].y-touches[1].y):undefined;};
  const zoom=(factor:number)=>{camera.zoom=Math.max(.35,Math.min(4,camera.zoom*factor));};
  const wheel=(e:WheelEvent)=>{if(!enabled())return;if(e.shiftKey||camera.panMode){e.preventDefault();camera.panX=(camera.panX??0)-(e.deltaX||0);camera.panY=(camera.panY??0)-e.deltaY;return;}if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(Math.exp(-e.deltaY*.008));}};
  let last:{x:number;y:number}|undefined;
  const center=(pan=camera.panMode)=>{
    const list=[...pointers.values()];
    if(!list.length||list[0].touch&&list.length<(pan?1:3))return undefined;
    return {x:list.reduce((a,p)=>a+p.x,0)/list.length,y:list.reduce((a,p)=>a+p.y,0)/list.length};
  };
  const down=(e:PointerEvent)=>{
    if(!enabled())return;
    if(e.pointerType!=='touch'&&e.button!==0)return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,touch:e.pointerType==='touch'});
    element.setPointerCapture(e.pointerId);last=center(e.shiftKey||camera.panMode);pinch=distance();
    if(last)element.dataset.orbitDragging='true';
  };
  const move=(e:PointerEvent)=>{
    if(!enabled()){pointers.clear();last=undefined;pinch=undefined;return;}if(!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,touch:e.pointerType==='touch'});
    const currentPinch=distance();if(!e.shiftKey&&!camera.panMode&&pinch&&currentPinch)zoom(currentPinch/pinch);pinch=currentPinch;
    const panning=e.shiftKey||camera.panMode,point=center(panning);
    if(last&&point&&panning){camera.panX=(camera.panX??0)+point.x-last.x;camera.panY=(camera.panY??0)+point.y-last.y;}
    else if(last&&point){camera.yaw-=(point.x-last.x)*.006;camera.pitch=Math.max(-.8,Math.min(.8,camera.pitch-(point.y-last.y)*.005));}
    last=point;
  };
  const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);last=center(e.shiftKey||camera.panMode);pinch=distance();if(!last)delete element.dataset.orbitDragging;};
  const key=(e:KeyboardEvent)=>{if(!enabled()||e.defaultPrevented)return;
    if((e.shiftKey||camera.panMode)&&e.key.startsWith('Arrow')){e.preventDefault();camera.panX=(camera.panX??0)+(e.key==='ArrowLeft'?-12:e.key==='ArrowRight'?12:0);camera.panY=(camera.panY??0)+(e.key==='ArrowUp'?-12:e.key==='ArrowDown'?12:0);return;}
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();camera.yaw+=e.key==='ArrowLeft'?-.12:.12;}
    if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();camera.pitch=Math.max(-.8,Math.min(.8,camera.pitch+(e.key==='ArrowUp'?-.08:.08)));}
  };
  element.addEventListener('wheel',wheel,{passive:false});element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',up);element.addEventListener('pointercancel',up);element.addEventListener('keydown',key);
  return {destroy(){element.removeEventListener('wheel',wheel);element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',up);element.removeEventListener('pointercancel',up);element.removeEventListener('keydown',key);pointers.clear();}};
}
