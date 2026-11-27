// Runs in the detached document: fullscreen needs that window's user activation.
async function toggleFullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen({navigationUI:'hide'});delete document.documentElement.dataset.fullscreenError;}
 catch(error){document.documentElement.dataset.fullscreenError=String(error);let status=document.querySelector('.popout-status');if(!status){status=document.createElement('div');status.className='popout-status';status.setAttribute('role','status');document.body.append(status);}status.textContent='Fullscreen: '+(error?.message||'use the browser’s fullscreen command');}
}
document.addEventListener('click',event=>{if(event.target?.nodeType===1&&event.target.closest('[data-popout-fullscreen]')){event.preventDefault();event.stopImmediatePropagation();void toggleFullscreen();}},true);
window.addEventListener('keydown',event=>{if(event.ctrlKey&&!event.metaKey&&!event.altKey&&event.code==='KeyF'){event.preventDefault();event.stopImmediatePropagation();void toggleFullscreen();}},true);
document.addEventListener('fullscreenchange',()=>{document.documentElement.dataset.fullscreen=String(!!document.fullscreenElement);document.querySelector('.popout-status')?.remove();});
