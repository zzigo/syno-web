import {camera} from '../camera.svelte';
import {session} from '../state.svelte';
import {attachOrbitInput} from './orbit-input';
import {attachStockyInput} from './stocky-input';
export const stockyCamera=$state({zoom:1,center:.5});
export function visualDrag(element:HTMLElement){const orbit=attachOrbitInput(element,camera,()=>session.visualization!=='stocky'),stocky=attachStockyInput(element,stockyCamera,()=>session.visualization==='stocky',()=>session.followTime=false);return {destroy(){orbit.destroy();stocky.destroy();}};}
