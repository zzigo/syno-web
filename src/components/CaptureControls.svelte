<script lang="ts">
 import {lyricCaption} from '../core/lyrics';
 import {onMount} from 'svelte';import {session,engine} from '../state.svelte';
 import {captureFormats,fitFrame,cropFrame,transformFrame,compose,saveBlob,type CaptureFormat} from '../capture/composition';
 let recorder:MediaRecorder|undefined,stream:MediaStream|undefined,audio:{dispose:()=>void}|undefined;
 let preparing=false;
 const output=document.createElement('canvas');let frame=0,overlay:HTMLDivElement,width=$state(0),height=$state(0);
 const lyric=$derived(lyricCaption(session.visualEvents,session.totalTime));
 const format=$derived(captureFormats[session.captureFormat]);const rect=$derived(session.captureCrop?cropFrame(width,height,format.width/format.height,session.captureCrop):fitFrame(width,height,format.width/format.height,session.infoHidden?.5:.72));
 const captionRect=$derived(session.captureGuide||session.recording?rect:{x:0,y:0,width,height});
 let drag:{x:number;y:number;rect:typeof rect;action:string;id:number}|undefined;
 function begin(event:PointerEvent,action:string){event.preventDefault();event.stopPropagation();drag={x:event.clientX,y:event.clientY,rect:{...rect},action,id:event.pointerId};(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);}
 function move(event:PointerEvent){if(!drag||event.pointerId!==drag.id)return;event.stopPropagation();session.captureCrop=transformFrame(drag.rect,event.clientX-drag.x,event.clientY-drag.y,drag.action,width,height);}
 function end(){drag=undefined;}
 function adjust(event:KeyboardEvent,action:string){if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();event.stopPropagation();const step=event.shiftKey?1:8;session.captureCrop=transformFrame(rect,event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0,action,width,height);}
 function draw(){const source=document.querySelector<HTMLCanvasElement>('.growth-pod.background canvas');if(!source)return false;compose(output,source,{format:session.captureFormat,center:session.infoHidden?.5:.72,crop:session.captureCrop,lyric:lyricCaption(engine.running?engine.visualEvents:[],engine.time),subtitle:session.subtitles?session.subtitle:'',code:session.captureCode?session.source:''});return true;}
 async function picture(){if(!draw()){session.message='The scene is not ready.';return;}const blob=await new Promise<Blob|null>(resolve=>output.toBlob(resolve,'image/png'));if(blob){saveBlob(blob,`syNo-${session.captureFormat}.png`);session.message='Image saved';}}
 function settings(){session.captureModal=!session.captureModal;if(session.captureModal)session.captureGuide=true;}
 async function toggleRecording(){
  if(recorder?.state==='recording'){recorder.stop();return;}
  if(preparing||session.recording)return;preparing=true;
  try{
   if(!('MediaRecorder' in window)||!output.captureStream)throw Error('This browser does not support canvas recording.');
   if(!draw())throw Error('The scene is not ready.');const tap=await engine.captureAudio();audio=tap;stream=output.captureStream(30);for(const track of tap.stream.getAudioTracks())stream.addTrack(track);
   const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/mp4','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime)throw Error('No supported video encoder.');
   recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6_000_000});const chunks:BlobPart[]=[];
   recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
   recorder.onstop=()=>{saveBlob(new Blob(chunks,{type:recorder?.mimeType??mime}),`syNo-${session.captureFormat}.${mime.includes('mp4')?'mp4':'webm'}`);for(const track of stream?.getTracks()??[])track.stop();audio?.dispose();audio=undefined;stream=undefined;session.recording=false;session.message='Recording saved';};
   recorder.onerror=()=>{session.message='Video encoder failed.';if(recorder?.state==='recording')recorder.stop();};
   recorder.start(1000);session.recording=true;session.captureModal=false;session.message='Recording · Alt V to stop';
  }catch(error){for(const track of stream?.getTracks()??[])track.stop();audio?.dispose();session.recording=false;session.message=error instanceof Error?error.message:String(error);}finally{preparing=false;}
 }
 onMount(()=>{
  const resize=new ResizeObserver(()=>{width=overlay.clientWidth;height=overlay.clientHeight;});resize.observe(overlay);
  const tick=()=>{if(session.recording||session.captureModal)draw();frame=requestAnimationFrame(tick);};tick();
  const actions:Record<string,()=>void>={'syno:record':()=>void toggleRecording(),'syno:capture-settings':settings,'syno:capture-image':()=>void picture(),'syno:captions':()=>{session.subtitles=!session.subtitles;},'syno:guide':()=>{session.captureGuide=!session.captureGuide;}};
  for(const [name,action] of Object.entries(actions))window.addEventListener(name,action);
  return()=>{resize.disconnect();cancelAnimationFrame(frame);for(const [name,action] of Object.entries(actions))window.removeEventListener(name,action);if(recorder?.state==='recording')recorder.stop();};
 });
</script>
<div class="capture-overlay" bind:this={overlay}>
 {#if session.captureGuide}<div class="capture-guide" class:recording={session.recording} style:left={`${rect.x}px`} style:top={`${rect.y}px`} style:width={`${rect.width}px`} style:height={`${rect.height}px`}><button class="capture-move" aria-label="Move capture frame" title="Drag to move · arrows move · Shift for fine adjustment" onpointerdown={e=>begin(e,'move')} onpointermove={move} onpointerup={end} onpointercancel={end} onkeydown={e=>adjust(e,'move')}>⠿ {format.width} × {format.height}</button>{#each ['nw','ne','sw','se'] as corner}<button class={`capture-resize ${corner}`} aria-label={`Resize capture frame ${corner}`} title="Resize · keeps export aspect ratio" onpointerdown={e=>begin(e,corner)} onpointermove={move} onpointerup={end} onpointercancel={end} onkeydown={e=>adjust(e,corner)}></button>{/each}</div>{/if}
 {#if lyric}<div class="lyric-cinema" aria-label="Lyric subtitles" style:left={`${captionRect.x}px`} style:bottom={`${height-captionRect.y-captionRect.height+24}px`} style:width={`${captionRect.width}px`}>{lyric}</div>
 {:else if session.subtitles&&session.subtitle}<div class="social-subtitle" style:left={`${rect.x}px`} style:bottom={`${height-rect.y-rect.height+14}px`} style:width={`${rect.width}px`}>{session.subtitle}</div>{/if}
</div>
{#if session.captureModal}<div class="capture-backdrop" role="presentation" onclick={e=>{if(e.target===e.currentTarget)session.captureModal=false;}}><dialog open class="capture-modal" aria-label="Social capture settings">
 <div class="flyout-title"><span>CAPTURE</span><button class="icon-button" onclick={()=>session.captureModal=false} aria-label="Close capture settings">×</button></div>
 <label>Format<select aria-label="Capture format" bind:value={session.captureFormat} disabled={session.recording}>{#each Object.entries(captureFormats) as [key,f]}<option value={key}>{f.label} · {f.width}×{f.height}</option>{/each}</select></label>
 <label class="capture-option"><input type="checkbox" bind:checked={session.captureGuide}/> Composition guide · Alt G</label>
 <label class="capture-option"><input type="checkbox" bind:checked={session.subtitles}/> Command subtitles · Alt C</label>
 <label class="capture-option"><input type="checkbox" bind:checked={session.captureCode}/> Include score text</label>
 <button class="capture-reset" onclick={()=>session.captureCrop=undefined}>Reset frame position / size</button>
 <p>Scene + direct syNo audio · 30 fps · local MediaStream. Shift-click V to return here.</p>
 <div class="button-row"><button onclick={()=>void toggleRecording()}>{session.recording?'Stop recording':'Record video + audio'}</button><button onclick={()=>void picture()}>Save PNG</button></div>
 </dialog></div>{/if}
