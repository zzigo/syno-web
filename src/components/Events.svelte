<script lang="ts">
  import { session } from '../state.svelte';
  import { compile, eventData, sha256 } from '../core/parser';
  import {rampValueAt} from '../core/curves';
  import { download } from '../core/export';
  let eventHash=$state(''),verification=$state('');
  let generation=0;
  const score=$derived(session.score);
  function frequency(event:typeof score.events[number]){const live=session.playing?session.visualEvents.find(e=>e.originId===event.id):undefined;return live?rampValueAt(live.freq,session.totalTime-live.t):event.freq.start;}
  $effect(()=>{const data=JSON.stringify(eventData(score));const current=++generation;void sha256(data).then(h=>{if(current===generation)eventHash=h;});});
  function exportEvents(){download('syno-events.json',JSON.stringify({schema:'syno.events.v1',source:session.source,seed:session.seed,canonical:score.canonical,eventHash,period:score.period,feedback:score.feedback,outputBuses:score.outputBuses,events:score.events},null,2));}
  function check(){const again=compile(session.source,session.seed);verification=JSON.stringify(eventData(again))===JSON.stringify(eventData(score))?'Same score + seed: identical event data. This checks reproducibility; it is not a backend portability test.':'Event data differs.';}
</script>
<div class="pod-body">
  <details class="audio-health-panel"><summary>Audio health · {session.audioHealth.state} · {session.audioHealth.voices} voices</summary><p>Peak {session.audioHealth.peak.toFixed(3)} · compression {session.audioHealth.reduction.toFixed(1)} dB · {session.audioHealth.reverbs} shared reverbs · {session.audioHealth.tails} tails</p><p>{session.audioHealth.late} late events · {session.audioHealth.dropped} dropped · {session.audioHealth.invalid} invalid samples</p><p class="muted">Output ceiling ±0.95 after compression. Late notes resume at their elapsed position when possible. Silence may be written rests or notes waiting for a longer growth cycle.</p>{#if session.audioHealth.error}<p>{session.audioHealth.error}</p>{/if}</details>
  <div class="eyebrow">COMPILED FROM YOUR TEXT</div><h2>Event stream</h2>
  <div class="metrics"><div><strong>{score.events.length}</strong><span>events</span></div><div><strong>{score.duration.toFixed(2)}</strong><span>seconds / cycle</span></div><div><strong>{session.seed}</strong><span>seed</span></div></div>
  <p class="muted">{score.generator||'Sound atoms'} · source ranges preserved for playback highlights.</p>
  {#if score.period}<p class="muted">Renewal every {score.period.toFixed(3)} s · {score.duration.toFixed(2)} s voice span · tails overlap.</p>{/if}
  {#if score.outputBuses.length}<p class="muted">{score.outputBuses.length} shared output bus{score.outputBuses.length>1?'es':''} · post-processing after its complete chain.</p>{/if}
  {#if score.feedback.length}<p class="muted">{score.feedback.length} shared feedback circuit{score.feedback.length>1?'s':''} · output level independent from return gain.</p>{/if}
  <div class="hash-label">Event SHA-256<code class="hash">{eventHash||'Computing…'}</code></div>
  <div class="button-row"><button onclick={exportEvents} disabled={!!score.diagnostics.length}>Export JSON</button><button onclick={check} disabled={!!score.diagnostics.length}>Check reproducibility</button></div>
  {#if verification}<p class="status-note">{verification}</p>{/if}
  {#each score.lSystems as system}<details class="rewrite-trace" open><summary>L-system · {system.axiom} · {system.iterations} generations · {system.word.length} symbols</summary><div class="rewrite-generations">{#each system.generations as generation}<div class="rewrite-step"><span>{generation.index}</span><code>{generation.word||'∅'}</code></div>{/each}</div></details>{/each}
  <div class="event-list"><table><thead><tr><th>t / s</th><th>Hz</th><th>dur</th><th>atom</th>{#if score.lSystems.length}<th>symbol</th>{/if}</tr></thead><tbody>{#each score.events.slice(0,128) as event}<tr class:active={session.playing&&!session.dirty&&session.activeIds.includes(event.id)}><td>{event.t.toFixed(2)}</td><td>{event.inputChannel?`in${event.inputChannel}`:frequency(event).toFixed(1)}</td><td>{(event.durationRange&&session.playing?session.visualEvents.find(e=>e.originId===event.id)?.dur??event.dur:event.dur).toFixed(2)}</td><td>{event.waveOptions&&session.playing?session.visualEvents.find(e=>e.originId===event.id)?.wave??event.wave:event.wave}</td>{#if score.lSystems.length}<td>{event.symbol||'—'}</td>{/if}</tr>{/each}</tbody></table></div>
  {#if score.events.length>128}<p class="muted">First 128 events shown. Export contains all {score.events.length}.</p>{/if}
</div>
