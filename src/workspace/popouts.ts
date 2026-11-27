import type {DockviewApi,DockviewGroupPanel} from 'dockview';
export function outsideViewport(event:Pick<MouseEvent,'clientX'|'clientY'>,view:Pick<Window,'innerWidth'|'innerHeight'>){return event.clientX<0||event.clientY<0||event.clientX>view.innerWidth||event.clientY>view.innerHeight;}
export function createPopoutController(root:HTMLElement,getApi:()=>DockviewApi|undefined,message:(text:string)=>void){
 const main=root.ownerDocument.defaultView!,actions=new Map<DockviewGroupPanel,()=>void>(),windows=new Map<Window,()=>void>();let dragEnd:((e:DragEvent)=>void)|undefined;
 const moved=()=>{main.dispatchEvent(new Event('syno:document-moved'));for(const refresh of actions.values())refresh();};
 const detach=async(item?:Parameters<DockviewApi['addPopoutGroup']>[0],position?:{left:number;top:number;width:number;height:number})=>{const api=getApi(),target=item??api?.activePanel;if(!api||!target)return false;const opened=await api.addPopoutGroup(target,{popoutUrl:'/popout.html',...(position?{position}:{})});if(!opened)message('Window could not open · use the pod’s ↗ button or allow popups for this site.');return opened;};
 const header=(group:DockviewGroupPanel)=>{
  const element=main.document.createElement('div');element.className='pod-window-actions';const button=main.document.createElement('button'),full=main.document.createElement('button');button.type=full.type='button';button.className=full.className='pod-window-button';full.textContent='⛶';full.dataset.popoutFullscreen='';full.title='Fullscreen this pod window · Ctrl+F';full.setAttribute('aria-label','Fullscreen detached pod');
  const refresh=()=>{const detached=element.ownerDocument!==main.document;button.textContent=detached?'↙':'↗';button.title=detached?'Return pod to main window':'Detach pod into a window · drag its tab outside the browser';button.setAttribute('aria-label',detached?'Dock pod':'Detach pod');full.hidden=!detached;};
  button.onclick=()=>{if(element.ownerDocument===main.document)void detach(group.activePanel??group);else{const ref=getApi()?.groups.find(g=>g!==group&&g.api.location.type==='grid');group.api.moveTo({...(ref?{group:ref}:{}),position:'right'});moved();}};
  element.append(button,full);actions.set(group,refresh);refresh();return{element,init:()=>refresh(),dispose:()=>{actions.delete(group);button.onclick=full.onclick=null;}};
 };
 const opened=(popup:{window:Window;group:DockviewGroupPanel})=>{const win=popup.window;win.document.title='syNo · '+(popup.group.activePanel?.title??'detached pod');win.document.documentElement.classList.add('syno-popout');
  const keyboard=(e:KeyboardEvent)=>{if(e.ctrlKey&&!e.metaKey&&!e.altKey&&e.code==='KeyF')return;const mod=e.metaKey||e.ctrlKey;if((mod&&['Period','Enter','KeyP','KeyE','KeyS','BracketLeft','BracketRight'].includes(e.code))||e.key==='Escape'||e.altKey&&['KeyF','KeyR','KeyP','KeyC','KeyG'].includes(e.code)||e.ctrlKey&&['KeyH','KeyZ'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();main.dispatchEvent(new KeyboardEvent('keydown',{key:e.key,code:e.code,ctrlKey:e.ctrlKey,metaKey:e.metaKey,altKey:e.altKey,shiftKey:e.shiftKey,repeat:e.repeat,bubbles:true,cancelable:true}));}};
  win.addEventListener('keydown',keyboard,{capture:true});windows.set(win,()=>win.removeEventListener('keydown',keyboard,{capture:true}));moved();win.requestAnimationFrame(moved);
 };
 const drag=(event:{nativeEvent:DragEvent|PointerEvent;panel?:Parameters<DockviewApi['addPopoutGroup']>[0];group?:DockviewGroupPanel})=>{
  if(event.nativeEvent.type!=='dragstart'||(event.nativeEvent.target as Node|null)?.ownerDocument!==main.document)return;const item=event.panel??event.group;if(!item)return;if(dragEnd)main.removeEventListener('dragend',dragEnd,{capture:true});
  dragEnd=(e:DragEvent)=>{main.removeEventListener('dragend',dragEnd!,{capture:true});dragEnd=undefined;if(e.dataTransfer?.dropEffect==='none'&&outsideViewport(e,main)){void detach(item,{left:e.screenX-80,top:e.screenY-30,width:850,height:650});}};main.addEventListener('dragend',dragEnd,{capture:true,once:true});
 };
 return{header,detach,opened,closed:(event:{window:Window})=>{windows.get(event.window)?.();windows.delete(event.window);main.setTimeout(moved,0);},drag,moved,dispose(){if(dragEnd)main.removeEventListener('dragend',dragEnd,{capture:true});for(const dispose of windows.values())dispose();windows.clear();actions.clear();}};
}
