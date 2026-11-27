import {createOrbitClock} from './visuals/orbit-clock';
import {attachOrbitInput} from './visuals/orbit-input';
/** View state only. Camera motion never changes the seeded musical event stream. */
export const camera = $state({ yaw: -.55, pitch: .18, autoRotate: true, zoom:1,panX:0,panY:0,panMode:false,projection:'isometric' as 'isometric'|'perspective' });
export const ORBIT_DURATION_MS = 1000;
export const Y_RADIANS_PER_MS = .000012;
const orbitClock=createOrbitClock(Y_RADIANS_PER_MS);
export function orbitPhase(){return orbitClock.sample(performance.now(),camera.autoRotate);}
export function toggleAutoOrbit(){orbitPhase();camera.autoRotate=!camera.autoRotate;orbitPhase();}
export function orbitDrag(element:HTMLElement){return attachOrbitInput(element,camera);}
