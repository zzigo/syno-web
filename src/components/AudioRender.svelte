<script lang="ts">
 import {onMount} from 'svelte';
 import {session} from '../state.svelte';
 import {compile} from '../core/parser';
 import {sectionScore} from '../core/sections';
 import {AudioEngine} from '../audio/engine';
 import {encodeWav,encodeCompressed,protectPeak,saveBlob} from '../audio/render-file';
 let lastMap=$state<Blob|undefined>(),mapName=$state('');
 let open=$state(false),output=$state('stereo'),format=$state('wav'),busy=$state(false),status=$state(''),controller:AbortController|undefined;
 const spatialAvailable=$derived(!!session.score.speakers);
 function modal(node:HTMLDialogElement){node.showModal();}
 function close(){controller?.abort();open=false;}
 async function render(){
  const source=session.source,seed=session.seed,volume=session.master,name=(session.score.title??session.fileName.replace(/\.syn$/i,'' )).replace(/[^a-zA-Z0-9_-]/g,'-')||'syno';
  let score=compile(source,seed);if(session.selectedSection>=0)score=sectionScore(score,session.selectedSection);
  if(score.diagnostics.length){status=score.diagnostics[0].message;return;}
  const spatial=output==='spatial',type=format;controller=new AbortController();const current=controller;busy=true;status='Preparing audio…';
  try {
   const {buffer,tailSeconds}=await new AudioEngine().render(score,spatial,volume,message=>{if(!current.signal.aborted)status=message;});
   if(current.signal.aborted)return;
   const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>new Float32Array(buffer.getChannelData(i))),protection=protectPeak(channels);
   status='Encoding…';await new Promise(resolve=>setTimeout(resolve,0));
   const blob=type==='wav'?encodeWav(channels,buffer.sampleRate,spatial?score.speakerLayout?.channelMask??0:3):await encodeCompressed(channels,buffer.sampleRate,type as 'ogg'|'mp3',current.signal);
   if(current.signal.aborted)return;
   const basename=`${name}-${spatial?buffer.numberOfChannels+'ch':'ST'}`;saveBlob(blob,`${basename}.${type}`);
   const map={version:1,title:score.title??name,seed,output:spatial?'discrete speakers':'stereo monitor',channels:buffer.numberOfChannels,sampleRate:buffer.sampleRate,duration:buffer.duration,tailSeconds,master:volume,peakProtection:protection,speakers:spatial?score.speakers:undefined,room:score.room,speakerLayout:score.speakerLayout,source,execution:'one written score execution; transport Loop and future AI mutations excluded'};
   lastMap=new Blob([JSON.stringify(map,null,2)],{type:'application/json'});mapName=`${basename}.json`;
   status=`Saved · ${buffer.numberOfChannels}ch · ${buffer.duration.toFixed(2)}s${protection.gain<1?' · linked peak attenuation applied':''}`;
  }catch(error){if(!current.signal.aborted)status=String(error);}finally{busy=false;}
 }
 onMount(()=>{const toggle=()=>{open=!open;};window.addEventListener('syno:audio-render',toggle);return()=>{controller?.abort();window.removeEventListener('syno:audio-render',toggle);};});
 $effect(()=>{if(output==='spatial'&&format!=='wav')format='wav';});
</script>
{#if open}<div class="render-backdrop" role="presentation" onclick={event=>{if(event.target===event.currentTarget)close();}}><dialog use:modal oncancel={event=>{event.preventDefault();close();}} class="render-modal" aria-modal="true" aria-label="Render audio" tabindex="-1" onkeydown={event=>{if(event.key==='Escape'){event.stopPropagation();close();}}}>
 <header><span>RENDER AUDIO</span><button aria-label="Close audio render" onclick={close}>×</button></header>
 <label>OUTPUT<select bind:value={output} disabled={busy}><option value="stereo">Stereo monitor</option><option value="spatial" disabled={!spatialAvailable}>Spatial · {session.score.speakers?.length??0} discrete channels</option></select></label>
 <label>FORMAT<select bind:value={format} disabled={busy}><option value="wav">WAV · PCM24 / 48 kHz</option><option value="ogg" disabled={output==='spatial'}>OGG · Vorbis / stereo</option><option value="mp3" disabled={output==='spatial'}>MP3 · 192 kb/s / stereo</option></select></label>
 <p>One written execution{session.selectedSection>=0?' of the selected section':''}, including effect tails. Uses the current master level. Transport Loop and future agent edits are excluded.</p>
 <p>Spatial WAV preserves speaker row order; no 5.1/7.1 assignment. Download the accompanying JSON channel map after rendering. OGG/MP3 are stereo listening copies. Live microphone input cannot render offline.</p>
 <button class="render-start" onclick={render} disabled={busy}>{busy?'Rendering…':'↓ Render audio'}</button>{#if busy}<button onclick={()=>controller?.abort()}>Cancel download</button>{/if}<output aria-live="polite">{status}</output>{#if lastMap}<button onclick={()=>saveBlob(lastMap!,mapName)}>↓ Channel map JSON</button>{/if}
 </dialog></div>{/if}
<style>
 .render-backdrop{position:fixed;inset:0;background:#050a08b8;z-index:140;display:grid;place-items:center;padding:16px}.render-modal{width:min(440px,100%);background:#101a15;border:1px solid #3c5143;padding:22px;color:#c1d2c5;font:12px ui-monospace,monospace;box-shadow:0 16px 80px #0009}.render-modal header{display:flex;justify-content:space-between;align-items:center;letter-spacing:.14em;margin-bottom:20px}.render-modal label{display:flex;justify-content:space-between;gap:16px;align-items:center;margin:16px 0;font-size:10px}.render-modal button,.render-modal select{font:inherit;color:inherit;background:#15231b;border:1px solid #3c5143;padding:8px;border-radius:2px}.render-modal p{font-size:11px;line-height:1.6;color:#899d90}.render-start{width:100%;margin-top:10px;cursor:pointer}.render-modal output{display:block;line-height:1.6;margin-top:12px;color:#99d7a3}.render-modal button:disabled{opacity:.5}
</style>
