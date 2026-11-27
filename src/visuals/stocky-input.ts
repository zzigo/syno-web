export interface StockyCamera {zoom:number;center:number}
export const STOCKY_MAX_ZOOM=128;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
/** Strong pinch gain: a 30% opening expands the timeline about eightfold. */
export function stockyZoomAt(state:StockyCamera,factor:number,anchor=.5){const old=1/state.zoom,from=clamp(state.center-old/2,0,1-old),world=from+clamp(anchor,0,1)*old;state.zoom=clamp(state.zoom*factor,1,STOCKY_MAX_ZOOM);const span=1/state.zoom;state.center=state.zoom===1?.5:clamp(world+(.5-anchor)*span,span/2,1-span/2);}
export function resetStocky(state:StockyCamera){state.zoom=1;state.center=.5;}
export function attachStockyInput(element:HTMLElement,state:StockyCamera,enabled=()=>true,onPan=()=>{}){
 const pointers=new Map<number,{x:number;y:number}>();let distance:number|undefined,lastX:number|undefined,gestureZoom=1,safariGesture=false;
 const width=()=>Math.max(1,element.getBoundingClientRect().width),anchor=(x:number)=>(x-element.getBoundingClientRect().left)/width();
 const pan=(pixels:number)=>{if(state.zoom===1)return;const half=.5/state.zoom;state.center=clamp(state.center+pixels/width()/state.zoom,half,1-half);onPan();};
 const wheel=(e:WheelEvent)=>{if(!enabled())return;if(e.ctrlKey||e.metaKey){e.preventDefault();if(!safariGesture)stockyZoomAt(state,Math.exp(-e.deltaY*.065),anchor(e.clientX));}else if(e.deltaX||e.shiftKey){e.preventDefault();pan(e.deltaX||e.deltaY);}};
 const down=(e:PointerEvent)=>{if(!enabled()||e.button!==0&&e.pointerType!=='touch')return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});element.setPointerCapture(e.pointerId);const p=[...pointers.values()];distance=p.length===2?Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y):undefined;lastX=p.length===1?e.clientX:undefined;};
 const move=(e:PointerEvent)=>{if(!enabled()||!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId)!;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...pointers.values()];if(p.length===2){const d=Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);if(distance&&d)stockyZoomAt(state,(d/distance)**8,anchor((p[0].x+p[1].x)/2));distance=d;}else if(p.length===1&&lastX!==undefined)pan(old.x-e.clientX);lastX=p.length===1?e.clientX:undefined;};
 const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);distance=undefined;lastX=pointers.size===1?[...pointers.values()][0].x:undefined;};
 const gestureStart=(e:Event)=>{if(!enabled())return;e.preventDefault();safariGesture=true;gestureZoom=state.zoom;};
 const gestureChange=(e:Event)=>{if(!enabled())return;e.preventDefault();const g=e as Event&{scale:number;clientX?:number};stockyZoomAt(state,gestureZoom*(g.scale||1)**8/state.zoom,g.clientX===undefined?.5:anchor(g.clientX));};
 const gestureEnd=()=>{safariGesture=false;};
 const reset=()=>{if(enabled())resetStocky(state);};
 const key=(e:KeyboardEvent)=>{if(!enabled()||e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey)return;if(['+','=','-','0','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();if(e.key==='0')resetStocky(state);else if(e.key.startsWith('Arrow'))pan((e.key==='ArrowLeft'?-1:1)*width()*.2);else stockyZoomAt(state,e.key==='-'?.5:2);}};
 const listeners:[string,EventListener][]=[['wheel',wheel as EventListener],['pointerdown',down as EventListener],['pointermove',move as EventListener],['pointerup',up as EventListener],['pointercancel',up as EventListener],['gesturestart',gestureStart],['gesturechange',gestureChange],['gestureend',gestureEnd],['dblclick',reset],['keydown',key as EventListener]];
 for(const [name,fn]of listeners)element.addEventListener(name,fn,{passive:false});return {destroy(){for(const [name,fn]of listeners)element.removeEventListener(name,fn);pointers.clear();}};
}
