<script lang="ts">
 import{onMount}from'svelte';
 import{session}from'../state.svelte';import{camera,toggleAutoOrbit}from'../camera.svelte';import{MoreHorizontal,X}from'@lucide/svelte';
 let{onseed,onreset,onaudio}:{onseed:()=>void;onreset:()=>void;onaudio:()=>void}=$props();
 let open=$state(false);
 function run(action:()=>void){open=false;action();}
 function capture(name:string){run(()=>window.dispatchEvent(new Event(name)));}
 onMount(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')open=false;};window.addEventListener('keydown',close,{capture:true});return()=>window.removeEventListener('keydown',close,{capture:true});});
</script>
<div class="footer-more">
 <button class="more-toggle" class:recording={session.recording} class:warning={!!session.audioHealth.invalid||!!session.audioHealth.error} aria-label="More controls and monitor" aria-expanded={open} aria-controls="footer-extra-controls" title="View, capture, seed, score fingerprint and layout" onclick={()=>open=!open}><MoreHorizontal size={18}/></button>
 {#if open}
  <button class="more-backdrop" tabindex="-1" aria-label="Close additional controls" onclick={()=>open=false}></button>
  <div id="footer-extra-controls" tabindex="-1" class="more-panel" role="dialog" aria-label="Additional controls and monitor">
   <header><span>MORE / MONITOR</span><button aria-label="Close controls menu" onclick={()=>open=false}><X size={15}/></button></header>
   <div class="more-actions"><button class:enabled={camera.autoRotate} aria-pressed={camera.autoRotate} onclick={()=>toggleAutoOrbit()}>Autopan · orbit <strong>{camera.autoRotate?'ON':'OFF'}</strong></button><button onclick={()=>capture('syno:audio-render')}>Render audio · ST / spatial</button><button onclick={()=>session.spatialOverlay=!session.spatialOverlay}>Speaker overlay {session.spatialOverlay?'ON':'OFF'}</button>
    <button onclick={()=>camera.projection=camera.projection==='isometric'?'perspective':'isometric'}>Projection <strong>{camera.projection==='isometric'?'ISO':'PER'}</strong></button>
    <button class:enabled={camera.panMode} aria-pressed={camera.panMode} onclick={()=>camera.panMode=!camera.panMode}>Scene pan <strong>{camera.panMode?'ON':'OFF'}</strong></button>
    <button class:recording={session.recording} onclick={()=>capture('syno:record')}>{session.recording?'V · Stop video':'V · Video + audio'}</button>
    <button onclick={()=>capture('syno:capture-settings')}>Video composition</button>
    <button onclick={()=>capture('syno:capture-image')}>Save image</button>
    <button class:enabled={session.subtitles} aria-pressed={session.subtitles} onclick={()=>session.subtitles=!session.subtitles}>Subtitles</button>
    <button class:enabled={session.captureGuide} aria-pressed={session.captureGuide} onclick={()=>session.captureGuide=!session.captureGuide}>Capture frame</button>
    <button onclick={()=>run(onaudio)}>Audio health</button>
   </div>
   <label class="more-seed">Random seed <input aria-label="Random seed" type="number" min="0" max="4294967295" bind:value={session.seed} onchange={onseed}/></label>
   <div class="more-monitor"><span>Score span <b>{session.score.duration.toFixed(2)} s</b></span><span>Audio <b>{session.audioHealth.voices} voices</b></span></div>
   <details><summary title="Fingerprint of normalized source text; excludes the random seed and is not an audio checksum">Source SHA-256</summary><code>{session.hash||'Computing…'}</code><p>Code version fingerprint. Seed is separate; Events has its own generated-event hash.</p></details>
   <button class="reset-menu" onclick={()=>run(onreset)}>Reset panel layout</button>
  </div>
 {/if}
</div>
<style>
 .footer-more{display:block}.more-toggle{position:relative;width:40px;height:44px;padding:0;display:grid;place-items:center;border:0;background:none;color:#9cba97}.more-toggle.recording:after{content:'';position:absolute;top:8px;right:7px;width:4px;height:4px;border-radius:50%;background:#ff9380}.more-toggle.warning{color:#ff9380}
 .more-backdrop{position:fixed;inset:0;z-index:20;width:100vw;height:100dvh;border:0;border-radius:0;background:#0005;padding:0}
 .more-panel{position:fixed;bottom:calc(var(--footer-height,30px) + 8px);right:8px;z-index:21;width:min(340px,calc(100vw - 16px));max-height:65dvh;overflow:auto;padding:12px;background:#101b16;border:1px solid #39513c;border-radius:5px;box-shadow:0 8px 35px #0009;font:11px var(--mono);color:#a9c2a4}
 header{display:flex;align-items:center;justify-content:space-between;font-size:9px;letter-spacing:.1em;margin-bottom:8px}header button{display:grid;place-items:center;width:32px;height:32px;padding:0;background:none;border:0}.more-actions{display:grid;grid-template-columns:1fr 1fr;gap:5px}.more-actions button{display:flex;align-items:center;justify-content:space-between;min-height:40px;padding:7px;text-align:left;font-size:10px;border:0;background:#a5caaa08}.more-actions strong{font-size:9px;font-weight:400}.more-actions button.enabled{color:#b6f29a}.more-actions button.recording{color:#ff9380}
 .more-seed{display:flex;gap:12px;align-items:center;justify-content:space-between;margin:14px 0}.more-seed input{min-width:0;width:130px;padding:8px;background:#0b130f;color:#c5dabb;border:1px solid #344838;font:12px var(--mono)}.more-monitor{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:9px;color:#738d78}.more-monitor span{display:flex;flex-direction:column;gap:5px}.more-monitor b{font-size:11px;font-weight:400;color:#a6bda0}
 details{margin-top:14px;font-size:10px}summary{cursor:pointer;min-height:32px;padding:8px 0}code{display:block;overflow-wrap:anywhere;font-size:10px;line-height:1.7;color:#c1d5b6}p{font-size:9px;line-height:1.7;color:#78917b}.reset-menu{margin-top:10px;width:100%;min-height:40px;background:none;font-size:10px}
 @media(max-width:700px) and (orientation:portrait){.footer-more{display:block}}
</style>
