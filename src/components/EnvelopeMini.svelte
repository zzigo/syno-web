<script lang="ts">
 import {session} from '../state.svelte';
 import {compile} from '../core/parser';
 import {cursorEvent,previewEnvelope,adsrPoints} from '../core/envelope';
 const source=$derived(session.envelopeOwner==='agent'?session.envelopeAgentSource:session.source);
 const score=$derived(session.envelopeOwner==='agent'?compile(source,session.seed):session.score);
 const selected=$derived(cursorEvent(score,source,session.envelopeCursor));
 const event=$derived.by(()=>{
  if(!selected)return;
  if(session.playing&&session.playbackOwner===session.envelopeOwner&&!(session.envelopeOwner==='editor'&&session.dirty)){
   const live=session.visualEvents.find(e=>e.from===selected.from&&e.to===selected.to&&e.envelope===selected.envelope&&(!selected.soundRange||e.soundRange?.from===selected.soundRange.from));if(live)return live;
  }
  return selected;
 });
 const points=$derived(event?previewEnvelope(event):[]);
 const path=$derived(event?points.map((p,i)=>`${i?'L':'M'}${(2+p.time/event.dur*92).toFixed(2)},${(24-p.value*21).toFixed(2)}`).join(' '):'');
 const time=$derived(event?(event.dur<1?event.dur.toFixed(3):event.dur.toFixed(2))+'s':'');
 const description=$derived.by(()=>{
  if(!event)return 'Envelope at cursor · place the cursor in a sound expression';
  if(event.envelope==='off')return `e0 · intensity contour · T ${time} · ADSR bypassed`;
  const p=adsrPoints(event.envelope,event.dur);return `e${event.envelope} · A ${((p[1].time-p[0].time)*1000).toFixed(1)} ms · D ${((p[2].time-p[1].time)*1000).toFixed(1)} ms · S ${(p[2].value*100).toFixed(0)}% · R ${((p[4].time-p[3].time)*1000).toFixed(1)} ms · T ${time}`;
 });
</script>
<div class="envelope-mini" class:empty={!event} role="img" aria-label={description} title={description} data-envelope={event?.envelope??'none'}>
 <svg viewBox="0 0 96 34" aria-hidden="true">
  <path class="envelope-baseline" d="M2 24H94"/>
  {#if event}<path class="envelope-fill" d={`${path} L94,24 L2,24 Z`}/><path class="envelope-line" d={path}/><text x="2" y="32">{event.envelope==='off'?'v / e0':'e'+event.envelope}<tspan x="94" text-anchor="end">{time}</tspan></text>{:else}<text x="48" y="18" text-anchor="middle">ADSR · T</text>{/if}
 </svg>
</div>
