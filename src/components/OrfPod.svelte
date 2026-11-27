<script lang="ts">
  import {duplicateProposalDescendant} from '../core/agent-proposal';
  import {compactAgentNumbers} from '../core/agent-numbers';
  import {chooseDefaultModel} from '../integrations/default-model';
  import {inferenceRetry} from '../integrations/agent-retry';
  import {tokenUsage} from '../integrations/model-activity';
  import { onMount } from 'svelte';
  import { orf, localModels, proposalRequest, extractScore } from '../integrations/orf';
  import AgentScore from './AgentScore.svelte';
  import {Copy,Check,Play,Square,OctagonX,Pause,Undo2,RefreshCw,Info,ChevronDown,ChevronUp,Send} from '@lucide/svelte';
  import { session, replaceSource, stop,commitMutation,undoMutation,chooseAgentModel } from '../state.svelte';
  import {mutationRange} from '../editor/mutation-range';
  import { compile, sha256 } from '../core/parser';
  import {parseDaughter,daughterCode,apomicticMessages} from '../core/apomictic-agent';
  import {parseAddition,additionProtocolError,validateAccretion,accretionCapacity,accretionMessages} from '../core/accretion';
  import {directedOptions,decisionIndex,type MutationRegion} from '../core/mutation';
  import type { TelemetryMetrics } from '@orf/core';
  let choosing=$state(false);let models=$derived(session.aiModels),model=$derived(session.aiSelectedModel);let instruction=$state('Make the growth more sparse and the notes shorter.');
  let rawExpanded=$state(false);let responseIndex=$state(-1);
  let proposalEditor=$state<AgentScore>();let copied=$state(false),edited=$state<string|undefined>();
  let output=$state(''),reasoning=$state(''),status=$state('Loading VPS model inventory…'),busy=$state(false),runId=$state('');
  const displayedResponse=$derived(responseIndex>=0?session.agentResponses[responseIndex]?.raw??'':output||session.agentResponses.at(-1)?.raw||'');
  let telemetry=$state<TelemetryMetrics|undefined>();
  let elapsed=$state(0),receivedChunks=$state(0);let startedAt=0,activityTimer:ReturnType<typeof setInterval>|undefined;
  const tokenCount=$derived(telemetry?`${telemetry.promptTokenBasis==='provider'&&telemetry.completionTokenBasis==='provider'?'':'≈'}${telemetry.totalTokens} tok`:receivedChunks?`${receivedChunks} chunks`:'… tok');
  let activityKind='',activityPhase='idle',promptCharacters=0;
  function publishActivity(){session.aiActivity={working:busy,phase:activityPhase,algorithm:activityKind,elapsed,...tokenUsage(telemetry,promptCharacters,output.length+reasoning.length)};}
  function archiveResponse(){session.agentResponses=[...session.agentResponses,{model,kind:activityKind,raw:output,reason:status,seconds:(performance.now()-startedAt)/1000}];}
  function beginActivity(kind:string,messages:{content:string}[]){responseIndex=-1;activityKind=kind;activityPhase='waiting';promptCharacters=messages.reduce((sum,m)=>sum+m.content.length,0);publishActivity();}
  let controller:AbortController|undefined;
  function mutationPreview(edit:{before:string;after:string}){
    const diff=mutationRange(edit.before,edit.after),start=edit.before.lastIndexOf('\n',diff.from-1)+1;
    const beforeEnd=edit.before.indexOf('\n',diff.from+diff.removed.length),afterEnd=edit.after.indexOf('\n',diff.from+diff.inserted.length);
    return {removed:edit.before.slice(start,beforeEnd<0?edit.before.length:beforeEnd),inserted:edit.after.slice(start,afterEnd<0?edit.after.length:afterEnd)};
  }
  let before='';let history=$state<object[]>([]);
  const proposed=$derived(edited??(choosing?(session.mutationMode==='accumulate'?compactAgentNumbers(parseAddition(output)??''):''):compactAgentNumbers(extractScore(output))));
  const validation=$derived(compile(proposed,session.seed));
  async function refresh(){
    const abort=new AbortController();controller=abort;
    try{session.aiModels=await localModels(abort.signal);session.aiSelectedModel=chooseDefaultModel(models,session.defaultModel)?.id??'';session.aiModelReady=!!model;status=models.length?'Connected to local model gateway':'No local text model is installed.';}
    catch(e){status=e instanceof Error?e.message:String(e);}
  }
  onMount(()=>{void refresh();const mutate=(event:Event)=>{void evolveRegion((event as CustomEvent<MutationRegion>).detail);};const cancel=()=>{if(busy)controller?.abort();};window.addEventListener('syno:mutate-ai',mutate);window.addEventListener('syno:stop-agents',cancel);return()=>{window.removeEventListener('syno:mutate-ai',mutate);window.removeEventListener('syno:stop-agents',cancel);session.aiModelReady=false;controller?.abort();if(activityTimer)clearInterval(activityTimer);busy=false;activityPhase='closed';publishActivity();};});

  async function generate(){
    if(!model||busy)return;choosing=false;
    controller=new AbortController();
    startedAt=performance.now();elapsed=0;receivedChunks=0;activityTimer=setInterval(()=>{elapsed=(performance.now()-startedAt)/1000;publishActivity();},200);
    before=session.source;output='';edited=undefined;reasoning='';runId='';telemetry=undefined;busy=true;status='Waiting for the model…';
    const request={...proposalRequest(model,before,instruction,controller.signal),maxTokens:-1};beginActivity('proposal',request.messages);
    try{
      const metrics=await orf.chat.stream(request,chunk=>{
        if(chunk.error)throw new Error(chunk.error);
        if(chunk.telemetry)telemetry=chunk.telemetry;
        if(chunk.delta||chunk.reasoningDelta)receivedChunks++;
        if(chunk.delta){output+=chunk.delta;status='Receiving score proposal';}
        if(chunk.reasoningDelta)reasoning+=chunk.reasoningDelta;
        if(chunk.runId)runId=chunk.runId;
        if(chunk.event)status=chunk.event.message;activityPhase='streaming';publishActivity();
      });
      telemetry=metrics;activityPhase='done';status=output?'Proposal received. Check it before applying.':'The model returned no score.';
    }catch(e){activityPhase=controller.signal.aborted?'stopped':'error';status=controller.signal.aborted?'Generation stopped. Partial text retained.':e instanceof Error?e.message:String(e);}
    finally{archiveResponse();if(activityTimer)clearInterval(activityTimer);elapsed=(performance.now()-startedAt)/1000;busy=false;publishActivity();}
  }
  let retryModel='',retryAt=0,retryFailures=0;
  function mutationFailure(error:unknown){
    const retry=inferenceRetry(error,retryFailures);
    if(retry.seconds){retryModel=model;retryFailures++;retryAt=performance.now()+retry.seconds*1000;}
    return retry.message+(retry.seconds?` · retry in ${retry.seconds}s · current music retained`:'');
  }
  function mutationSucceeded(){retryAt=0;retryFailures=0;}
  async function evolveRegion(region:MutationRegion){
    if(busy||!model)return;if(model!==retryModel){retryFailures=0;retryAt=0;retryModel=model;}if(performance.now()<retryAt)return;if(session.mutationMode==='accumulate'){await growRegion(region);return;}const beforeSource=session.source,body=beforeSource.slice(region.from,region.to);
    const options=directedOptions(beforeSource,region,session.seed,session.mutationGeneration,session.mutationHistory.flatMap(edit=>[edit.before,edit.after]));
    if(!options.length){session.mutationStatus='AI · no valid mutation options';return;}
    const describe=(after:string)=>{let from=0,end=0;while(beforeSource[from]===after[from]&&from<beforeSource.length&&from<after.length)from++;while(end<beforeSource.length-from&&end<after.length-from&&beforeSource[beforeSource.length-1-end]===after[after.length-1-end])end++;return JSON.stringify({remove:beforeSource.slice(from,beforeSource.length-end).slice(0,120),insert:after.slice(from,after.length-end).slice(0,120)});};
    busy=true;choosing=true;output='';edited=undefined;reasoning='';telemetry=undefined;controller=new AbortController();startedAt=performance.now();elapsed=0;receivedChunks=0;activityTimer=setInterval(()=>{elapsed=(performance.now()-startedAt)/1000;publishActivity();},200);session.mutationStatus=`AI ${region.algorithm} · choosing an edit`;status='Choosing a validated mutation';
    const request={...proposalRequest(model,body,'Choose a mutation',controller.signal),maxTokens:-1,format:'json',temperature:.2,seed:session.seed+session.mutationGeneration+(directedAttempt++)*997,messages:[{role:'system' as const,content:'You direct a live musical notation performance. Choose one of the numbered valid edits. Return ONLY JSON with one key edit whose value is the chosen integer index. No explanation. Example response: {"edit":0}'},{role:'user' as const,content:`Growth algorithm: ${region.algorithm}. ${region.algorithm==='L'?'Choose a structural grammar rewrite: branches, symbols or rule extensions.':'Evolve only the parenthesized musical material.'} Region:\n${body.slice(0,6000)}\nChoose one edit:\n${options.map((o,i)=>`${i}: ${o.description} ${describe(o.source)}`).join('\n')}`} ]};
    beginActivity(region.algorithm,request.messages);let selected:number|undefined;
    try{
      try{telemetry=await orf.chat.stream(request,chunk=>{
        if(chunk.error)throw Error(chunk.error);if(chunk.telemetry)telemetry=chunk.telemetry;
        if(chunk.delta){output+=chunk.delta;receivedChunks++;selected=decisionIndex(output,options.length);}
        if(chunk.reasoningDelta)reasoning+=chunk.reasoningDelta;
        activityPhase='streaming';publishActivity();if(selected!==undefined)controller?.abort();
      });}catch(error){if(selected===undefined)throw error;}
      const index=selected??decisionIndex(output,options.length)??-1,candidate=options[index]?.source;
      if(session.source!==beforeSource)session.mutationStatus='AI discarded · source edited during generation';
      else if(!candidate)session.mutationStatus='AI rejected · response is not an available JSON edit index';
      else if(!session.mutationPaused&&session.playing){mutationSucceeded();activityPhase='writing';publishActivity();edited=candidate;await commitMutation(candidate,`AI ${region.algorithm} · ${options[index].description}`);if(session.source===candidate)session.mutationStatus=options[index].description;}
      activityPhase='done';status=session.mutationStatus;
    }catch(error){activityPhase=controller?.signal.aborted?'stopped':'error';session.mutationStatus=controller?.signal.aborted?'AI mutation stopped':mutationFailure(error);status=session.mutationStatus;}
    finally{archiveResponse();if(activityTimer)clearInterval(activityTimer);elapsed=(performance.now()-startedAt)/1000;busy=false;publishActivity();}
  }
  let growthAttempt=0;let directedAttempt=0;
  async function growRegion(region:MutationRegion){
    const beforeSource=session.source,body=beforeSource.slice(region.from,region.to),capacity=accretionCapacity(beforeSource,region,session.seed,session.mutationLayerLimit);
    if(capacity.full){session.mutationPaused=true;session.mutationStatus='Growth limit reached · earlier music retained';return;}
    busy=true;choosing=true;output='';edited=undefined;reasoning='';telemetry=undefined;controller=new AbortController();startedAt=performance.now();elapsed=0;receivedChunks=0;
    activityTimer=setInterval(()=>{elapsed=(performance.now()-startedAt)/1000;publishActivity();},200);
    session.mutationStatus=`AI ${region.algorithm} · writing a new layer`;status=session.mutationStatus;
    let messages;try{messages=region.algorithm==='A'?apomicticMessages(beforeSource,region,session.seed,session.mutationLastRejection,session.mutationGeneration):accretionMessages(body,region.algorithm,session.score.duration,capacity.limit-capacity.expressions,session.mutationLastRejection,region.parameters,model);}catch(error){session.mutationPaused=true;session.mutationStatus=error instanceof Error?error.message:String(error);status=session.mutationStatus;if(activityTimer)clearInterval(activityTimer);busy=false;publishActivity();return;}
    const request={...proposalRequest(model,body,'Grow by adding a new layer',controller.signal),messages,maxTokens:-1,format:'json',temperature:.35,seed:session.seed+session.mutationGeneration+(growthAttempt++)*997};
    beginActivity(region.algorithm,request.messages);let receivedAddition:string|undefined,daughter:unknown,conversionError='',protocolError:string|undefined;
    try{
      try{telemetry=await orf.chat.stream(request,chunk=>{if(chunk.error)throw Error(chunk.error);if(chunk.telemetry)telemetry=chunk.telemetry;if(chunk.delta){output+=chunk.delta;receivedChunks++;protocolError=additionProtocolError(output,region.algorithm==='A'?'daughter':'append');if(region.algorithm==='A'){daughter=parseDaughter(output);if(daughter!==undefined){try{receivedAddition=daughterCode(beforeSource,region,session.seed,daughter,session.mutationGeneration);}catch(error){conversionError=error instanceof Error?error.message:String(error);}}}else receivedAddition=parseAddition(output);}if(chunk.reasoningDelta)reasoning+=chunk.reasoningDelta;activityPhase='streaming';publishActivity();if(receivedAddition!==undefined||daughter!==undefined||protocolError)controller?.abort();});}catch(error){if(receivedAddition===undefined&&daughter===undefined&&!protocolError)throw error;}

      if(session.source!==beforeSource){session.mutationStatus='Growth discarded · source edited during generation';}
      else if(!session.mutationPaused&&session.playing){
        const addition=receivedAddition??(region.algorithm==='A'?undefined:parseAddition(output)),checked=addition?validateAccretion(beforeSource,region,addition,session.seed,session.mutationLayerLimit):undefined;
        if(!checked?.ok){session.mutationLastRejection=protocolError??checked?.error??(conversionError||(region.algorithm==='A'?'Expected JSON with a daughter object; no syNo syntax should be generated.':'Incomplete or invalid append JSON; no complete quoted append string was received'));session.mutationStatus='Growth rejected · '+session.mutationLastRejection+' · paused; inspect response and Resume';session.mutationPaused=true;activityPhase='error';}
        else {mutationSucceeded();session.mutationLastRejection='';activityPhase='writing';publishActivity();edited=checked.source;await commitMutation(checked.source,`AI ${region.algorithm} · added ${checked.addedEvents} events · ${checked.expressions}/${capacity.limit} expressions`);session.mutationStatus='New layer added · earlier music retained';if(checked.expressions>=capacity.limit)session.mutationPaused=true;}
      }else session.mutationStatus='Growth stopped · proposal not applied';
      if(activityPhase!=='error')activityPhase='done';status=session.mutationStatus;
    }catch(error){activityPhase=controller?.signal.aborted?'stopped':'error';session.mutationStatus=controller?.signal.aborted?'Growth generation stopped':mutationFailure(error);status=session.mutationStatus;}
    finally{archiveResponse();if(activityTimer)clearInterval(activityTimer);elapsed=(performance.now()-startedAt)/1000;busy=false;publishActivity();}
  }
  async function copyProposal(){try{await navigator.clipboard.writeText(proposed);copied=true;setTimeout(()=>copied=false,1500);}catch{status='Select the score text and press Cmd/Ctrl+C to copy.';}}
  async function apply(){
    if(busy||validation.diagnostics.length)return;
    const currentSource=session.source;
    const duplicate=duplicateProposalDescendant(currentSource,proposed,session.seed);if(duplicate){status=duplicate;return;}
    history.push({model,runId,requestSource:before,rawResponse:output,sourceBefore:currentSource,sourceAfter:proposed,beforeHash:await sha256(compile(currentSource,session.seed).canonical),afterHash:await sha256(validation.canonical),seed:session.seed});
    replaceSource(proposed,'Agent proposal');status='Proposal applied to editor. Cmd+Enter to play.';
  }
</script>
<div class="pod-body agent-pod">
  <header class="agents-header">
    <span class="eyebrow">AGENTS</span>
    <span class="agent-activity" class:working={busy} aria-label="Model activity" title="Input + output tokens; ≈ is an estimate. No syNo output token cap; finishes on a complete response, model EOS or Stop."><i aria-hidden="true"></i><span>{elapsed.toFixed(1)}s</span><span>{tokenCount}</span></span>
    <button class="icon-button" onclick={()=>{session.mutationPaused=!session.mutationPaused;if(session.mutationPaused){session.mutationVisual=undefined;controller?.abort();}}} aria-label={session.mutationPaused?'Resume mutation':'Pause mutation'} title={session.mutationPaused?'Resume mutation':'Pause mutation'}>{#if session.mutationPaused}<Play size={14}/>{:else}<Pause size={14}/>{/if}</button>
    <button class="icon-button" onclick={undoMutation} disabled={!session.mutationHistory.length} aria-label="Undo mutation" title="Undo latest mutation and pause"><Undo2 size={14}/></button>
    <button class="icon-button" onclick={()=>controller?.abort()} disabled={!busy} aria-label="Stop generation" title="Stop generation; keep all received text"><OctagonX size={14}/></button>
    <button class="icon-button info-help" aria-label="About agent growth" title="& starts agents on Play. Earlier music stays in Accumulate. Closing this pod only hides it. Generated scores are compiled before adoption; Stop cancels audio and generation."><Info size={12}/></button>
  </header>
  <section class="agent-settings" aria-label="Agent parameters">
    <div class="setting"><label>Model · default<select aria-label="Installed model" title="This selection is saved as the syNo default model" value={model} onchange={(event)=>chooseAgentModel(event.currentTarget.value)} disabled={busy}>{#each models as m}<option value={m.id}>{m.name}</option>{/each}</select></label><button class="icon-button" onclick={()=>void refresh()} disabled={busy} aria-label="Refresh model inventory" title="Refresh installed models"><RefreshCw size={13}/></button></div>
    <div class="setting"><label>Behavior<select aria-label="Agent mutation behavior" bind:value={session.mutationMode} disabled={busy}><option value="directed">Directed edits</option><option value="accumulate">Accumulate</option></select></label><button class="icon-button info-help" aria-label="About mutation behavior" title="Directed chooses varied validated edits. Accumulate writes audible new layers while retaining earlier events. A asks the model for daughter parameters; syNo serializes valid FM syntax. Clonal parentage, somatic changes, dormancy and dispersal guide the growth. Invalid additions pause with their diagnosis."><Info size={12}/></button></div>
    <label>Interval · s<input aria-label="Mutation interval seconds" type="number" min="1" max="60" bind:value={session.mutationEvery}/></label>
    <label>Expressions<input aria-label="Growth expression limit" type="number" min="2" max="24" step="1" bind:value={session.mutationLayerLimit} onchange={()=>session.mutationLayerLimit=Math.max(2,Math.min(24,Math.round(session.mutationLayerLimit||12)))}/></label>
    <div class="setting instruction-field"><label>Instruction<textarea aria-label="Agent instruction" bind:value={instruction} rows="2" placeholder="Manual proposal instruction…"></textarea></label><button class="icon-button" onclick={()=>void generate()} disabled={busy||!model||!instruction.trim()} aria-label="Request proposal" title="Request a complete score proposal manually"><Send size={14}/></button></div>
  </section>
  <p class="status-note" aria-live="polite">{status}</p>
  <section class="recent-mutations" aria-label="Recent mutations">
    <div class="section-caption"><span>RECENT MUTATIONS · {session.mutationHistory.length}</span><button class="icon-button info-help" aria-label="About mutation history" title="Open any entry to inspect changed lines and its complete historical patch. Inspection does not change playback."><Info size={12}/></button></div>
    {#each session.mutationHistory.slice().reverse() as edit}
      {@const diff=mutationPreview(edit)}
      <details class="mutation-entry"><summary>{edit.description}</summary><div class="mutation-diff">
      {#if diff.removed}<div class="eyebrow">BEFORE · changed lines</div><pre class="mutation-removed">{diff.removed}</pre>{/if}
      {#if diff.inserted}<div class="eyebrow">AFTER · changed lines</div><pre class="mutation-added">{diff.inserted}</pre>{/if}
      <details><summary>Complete patch after this mutation</summary><pre>{edit.after}</pre></details></div></details>
    {/each}
    {#if !session.mutationHistory.length}<span class="muted">No adopted mutations yet.</span>{/if}
  </section>
  <section class="proposal-pane" aria-label="Proposed score">
    <div class="proposal-tools"><span>PROPOSED SCORE</span><div>
      <button class="icon-button" onclick={()=>void copyProposal()} disabled={!proposed} title="Copy score, including partial output" aria-label="Copy proposed score">{#if copied}<Check size={14}/>{:else}<Copy size={14}/>{/if}</button>
      <button class="icon-button" onclick={()=>{if(session.playing&&session.playbackOwner==='agent')stop();else proposalEditor?.playAll();}} disabled={!proposed||!!validation.diagnostics.length} title="Play proposal · Alt+Enter plays selection or line" aria-label="Play proposed score"><Play size={14}/></button>
      <button class="icon-button" onclick={stop} title="Stop all audio (Cmd+.)" aria-label="Stop all proposal audio"><Square size={12}/></button>
      <button class="icon-button" disabled={busy||!proposed||!!validation.diagnostics.length||(choosing&&!edited)} onclick={()=>void apply()} title="Replace editor with this complete proposal" aria-label="Apply proposal to editor"><Check size={14}/></button>
    </div></div>
    {#if proposed}<AgentScore bind:this={proposalEditor} source={proposed} streaming={busy||(choosing&&!edited)} onedit={(code)=>edited=code}/>{:else}<p class="proposal-placeholder">{busy?'Receiving response…':'No proposed score yet.'}</p>{/if}
  </section>
  {#if reasoning}<details><summary>Model reasoning</summary><pre>{reasoning}</pre></details>{/if}
  <section class="raw-pane" aria-label="Raw responses">
    <div class="section-caption"><span>RAW RESPONSE</span>
      <select aria-label="Response attempt" value={responseIndex} onchange={(event)=>responseIndex=Number(event.currentTarget.value)}><option value={-1}>Current / latest</option>{#each session.agentResponses as response,index}<option value={index}>#{index+1} · {response.reason}</option>{/each}</select>
      <button class="icon-button" onclick={()=>rawExpanded=!rawExpanded} aria-label={rawExpanded?'Show four response lines':'Show ten response lines'} title="Expand 4 → 10 lines, then scroll">{#if rawExpanded}<ChevronUp size={13}/>{:else}<ChevronDown size={13}/>{/if}</button>
    </div>
    {#if responseIndex>=0}<p class="response-reason">{session.agentResponses[responseIndex]?.reason}</p>{/if}
    <textarea class="raw-response" aria-label="Raw response text" readonly rows={rawExpanded?10:4} value={displayedResponse} placeholder="Received text and rejected attempts remain available here."></textarea>
  </section>
</div>


<style>
 .agents-header{display:flex;align-items:center;gap:5px;flex-wrap:wrap;position:sticky;top:0;background:#0d1612;z-index:2;padding:7px 0}
 .agents-header .agent-activity{margin:0 auto 0 0;font-size:10px;gap:6px}
 .agents-header .icon-button,.agent-settings .icon-button{width:27px;height:27px;border-radius:2px;flex-shrink:0}
 .info-help{opacity:.48}.info-help:hover{opacity:1}
 .agent-pod{container-type:inline-size;padding:12px}
 .agent-settings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 10px;align-items:end}
 .setting{display:flex;align-items:end;gap:3px;min-width:0}.setting label{flex:1}
 .instruction-field{grid-column:1 / -1}
 .proposal-placeholder{font-size:11px;color:var(--dim);margin:6px 0;padding:8px 0}
 @container(max-width:260px){.agent-settings{grid-template-columns:minmax(0,1fr)}}
 .agent-settings label{margin:0;font-size:9px;min-width:0;gap:4px}.agent-settings select,.agent-settings input,.agent-settings textarea{width:100%;min-width:0;font-size:11px;padding:6px 7px;line-height:1.4}.agent-pod .agent-settings input[type=number]{max-width:none;width:100%;padding:6px 7px}
 .section-caption{display:flex;align-items:center;gap:7px;font-size:10px;letter-spacing:.09em;margin:10px 0 6px}
 .section-caption select{font-size:10px;min-width:0;flex:1}.recent-mutations{font-size:11px}
 .mutation-entry{margin:4px 0}.mutation-entry summary{cursor:pointer;padding:5px 0}
 .raw-response{box-sizing:border-box;width:100%;font:11px/1.5 monospace;min-height:6em;max-height:15em;resize:vertical;overflow:auto;white-space:pre-wrap}
 .response-reason{font-size:10px;overflow-wrap:anywhere}.mutation-diff pre{white-space:pre-wrap;overflow-wrap:anywhere;user-select:text;font-size:11px}
</style>
