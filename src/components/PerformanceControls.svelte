<script lang="ts">
 import {onMount} from 'svelte';
 import {session,togglePerformance} from '../state.svelte';
 import {activeEditor,performanceStep,performanceValue,performanceTimeStep,performanceTimeValue} from '../editor/controller';
 import {PLAY_KEYS,performanceSlots,performanceAnchorAt,playKey,slotPosition,slotAtPosition,performanceTime} from '../core/performance';
 const slots=$derived(performanceSlots(session.source,session.performanceAnchor));
 const time=$derived(performanceTime(session.source,session.performanceAnchor));
 const timePosition=$derived(time?time.unit==='n'?1-Math.log2(time.numerator)/7:Math.log(Math.max(.001,time.numerator)/.001)/Math.log(86400/.001):0);
 let release:ReturnType<typeof setTimeout>|undefined,pointer:{id:number;index:number;element:HTMLElement}|undefined;
 let pending:{index:number;value:number}|undefined,frame=0;
 function pulse(){clearTimeout(release);release=setTimeout(()=>session.performancePulse=-1,180);}
 function flush(){frame=0;if(pending){const {index,value}=pending;pending=undefined;if(index===11)performanceTimeValue(value);else performanceValue(index,value);pulse();}}
 function position(event:PointerEvent,index:number){const element=event.currentTarget as HTMLElement,rect=element.getBoundingClientRect(),slot=slots[index];if(!slot)return;const value=slotAtPosition(slot,1-(event.clientY-rect.top)/rect.height);pending={index,value:slot.integer?Math.round(value):Number(value.toFixed(slot.log?3:2))};if(!frame)frame=requestAnimationFrame(flush);}
 function timePointer(event:PointerEvent){if(!time)return;const rect=(event.currentTarget as HTMLElement).getBoundingClientRect(),unit=Math.max(0,Math.min(1,1-(event.clientY-rect.top)/rect.height));pending={index:11,value:time.unit==='n'?2**Math.round((1-unit)*7):Number((.001*(86400/.001)**unit).toFixed(3))};if(!frame)frame=requestAnimationFrame(flush);}
 function down(event:PointerEvent,index:number){if(event.button!==0||pointer)return;event.preventDefault();const element=event.currentTarget as HTMLElement;element.setPointerCapture(event.pointerId);pointer={id:event.pointerId,index,element};if(index===11)timePointer(event);else position(event,index);}
 function move(event:PointerEvent,index:number){if(pointer?.id===event.pointerId&&pointer.index===index){event.preventDefault();if(index===11)timePointer(event);else position(event,index);}}
 function up(event:PointerEvent){if(pointer?.id!==event.pointerId)return;cancelAnimationFrame(frame);flush();pointer=undefined;}
 onMount(()=>{
  const toggle=()=>{if(session.performanceMode){const cursor=activeEditor?.state.selection.main.head??session.envelopeCursor;session.performanceAnchor=performanceAnchorAt(session.source,cursor);}else{pending=undefined;cancelAnimationFrame(frame);pointer=undefined;session.performancePulse=-1;}};
  const keyboard=(event:KeyboardEvent)=>{if(!session.performanceMode||event.metaKey||event.ctrlKey||event.altKey||event.isComposing)return;const target=event.target as HTMLElement;
   if(target?.closest('input,textarea,select,dialog,[role="dialog"]')||target?.isContentEditable&&!target.closest('[aria-label="syNo score editor"]'))return;
   if(['Comma','Period'].includes(event.code)){event.preventDefault();event.stopImmediatePropagation();performanceTimeStep(event.code==='Period'?1:-1,event.shiftKey);pulse();return;}
   const key=playKey(event.code,event.key);if(!key)return;event.preventDefault();event.stopImmediatePropagation();performanceStep(key.index,key.direction,event.shiftKey);pulse();
  };
  window.addEventListener('syno:performance-toggle',toggle);window.addEventListener('keydown',keyboard,{capture:true});
  return()=>{window.removeEventListener('syno:performance-toggle',toggle);window.removeEventListener('keydown',keyboard,{capture:true});clearTimeout(release);cancelAnimationFrame(frame);};
 });
</script>
{#if session.performanceMode}
 <section class="performance-panel" aria-label="PLAY keyboard and touch controls">
  <header><span>PLAY <small>⌘E · Q/A … [/' · , . time</small></span><span class="performance-hint">11 values from cursor · drag ↑↓</span><button onclick={togglePerformance} aria-label="Return to EDIT mode" title="Return to text editing · Cmd/Ctrl+E">EDIT</button></header>
  <div class="performance-tracks"><div class="performance-faders">
   {#each slots as slot,index}
    <div class="performance-fader" class:active={session.performancePulse===index}>
     <div class="performance-key">{PLAY_KEYS[index].join(' / ').toUpperCase()}</div>
     <span class="performance-label" title={slot.label}>{slot.label}</span>
     <div class="performance-rail" role="slider" tabindex="0" aria-label={`PLAY ${PLAY_KEYS[index].join('/')} ${slot.label}`} aria-valuemin={slot.min} aria-valuemax={slot.max} aria-valuenow={Number(slot.text)} aria-orientation="vertical" onpointerdown={event=>down(event,index)} onpointermove={event=>move(event,index)} onpointerup={up} onpointercancel={up} onlostpointercapture={up} onkeydown={event=>{if(['ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();performanceStep(index,event.key==='ArrowUp'?1:-1,event.shiftKey);pulse();}}}>
      <i style:height={`${Math.max(0,Math.min(1,slotPosition(slot)))*100}%`}></i><b style:bottom={`${Math.max(0,Math.min(1,slotPosition(slot)))*100}%`}></b>
     </div>
     <output>{slot.text}</output>
    </div>
   {/each}
   {#if !slots.length}<p>Leave the cursor before a value, then toggle EDIT / PLAY.</p>{/if}
  </div>
   {#if time}<div class="performance-fader performance-time" class:active={session.performancePulse===11}>
    <div class="performance-key">. / ,</div><span class="performance-label">{time.unit==='n'?'figure':time.unit==='b'?'beats':'seconds'}</span>
    <div class="performance-rail" role="slider" tabindex="0" aria-label="PLAY duration period/comma" aria-valuemin={.001} aria-valuemax={86400} aria-valuenow={time.numerator} aria-valuetext={time.text} aria-orientation="vertical" onpointerdown={event=>down(event,11)} onpointermove={event=>move(event,11)} onpointerup={up} onpointercancel={up} onlostpointercapture={up} onkeydown={event=>{if(['ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();performanceTimeStep(event.key==='ArrowUp'?1:-1,event.shiftKey);pulse();}}}><i style:height={`${Math.max(0,Math.min(1,timePosition))*100}%`}></i><b style:bottom={`${Math.max(0,Math.min(1,timePosition))*100}%`}></b></div><output>{time.text}</output>
   </div>{/if}
   {#if !time}<div class="performance-fader performance-time unavailable" title="Write a duration with apostrophe in the score to enable this fader"><div class="performance-key">. / ,</div><span class="performance-label">time</span><div class="performance-rail"></div><output>—</output></div>{/if}
  </div>
 </section>
{/if}
<style>
 .performance-panel{position:fixed;z-index:25;bottom:var(--footer-height,30px);left:56px;right:10px;background:#0b1512f5;border:1px solid #35483a;border-bottom:0;border-radius:4px 4px 0 0;box-shadow:0 -10px 35px #0004;font:10px var(--mono);backdrop-filter:blur(12px)}
 header{display:flex;align-items:center;gap:14px;padding:7px 10px;color:#b8dcb0;letter-spacing:.07em}header small{font-size:8px;color:#829882;letter-spacing:0}header button{margin-left:auto;background:transparent;border:0;padding:3px 7px;font:9px var(--mono);color:#b8dcb0}.performance-hint{font-size:8px;color:#758b7d}
 .performance-tracks{display:flex;min-width:0}.performance-time{flex:0 0 64px;width:64px;border-left:1px solid #3c5640;background:#101c15}.performance-time.unavailable{opacity:.4}.performance-faders{flex:1;min-width:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(48px,1fr);overflow-x:auto;overscroll-behavior-x:contain;padding:0 8px 5px;scrollbar-width:thin;touch-action:pan-x}
 .performance-fader{display:flex;flex-direction:column;align-items:center;min-width:48px;border-right:1px solid #25392c;color:#9dbb98;padding:2px 0}.performance-fader:last-child{border:0}.performance-fader.active{background:#b6f29a13;color:#d0ffc1}
 .performance-key{font-size:9px;padding:3px;touch-action:pan-x}.performance-label{font-size:7px;color:#6d8875;margin-bottom:5px}.performance-rail{position:relative;width:100%;height:65px;touch-action:none;cursor:ns-resize;outline:none;overflow:hidden;background:linear-gradient(90deg,transparent 47%,#314c3a 47%,#314c3a 53%,transparent 53%)}.performance-rail:focus-visible{box-shadow:inset 0 0 0 1px #8cb87e}.performance-rail i{position:absolute;bottom:0;left:calc(50% - 2px);width:4px;background:#a1d18d55;pointer-events:none}.performance-rail b{position:absolute;left:calc(50% - 13px);width:26px;height:6px;background:#8fb67e;border:1px solid #c1dfb044;transform:translateY(50%);box-sizing:border-box;pointer-events:none}.performance-fader.active b{background:#ceffba}output{display:block;font-size:10px;padding:5px 2px;min-height:12px}.performance-faders p{min-width:280px;color:#8ca18e}
 @media(max-width:700px){.performance-panel{left:0;right:0;bottom:var(--footer-height,35px);padding-bottom:env(safe-area-inset-bottom);border-radius:0}.performance-rail{height:125px}.performance-faders{grid-auto-columns:48px;padding:0 0 6px}.performance-hint{display:none}header{gap:5px;padding:8px}.performance-fader{padding-top:5px}.performance-key{font-size:10px}.performance-label{font-size:8px}}
</style>
