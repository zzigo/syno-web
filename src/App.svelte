<script lang="ts">
  import {UPDATE_INFO,UPDATE_MODES} from './core/update-mode';
  import { onMount } from 'svelte';
  import { Play, Square, Repeat2, Code2, Sprout, ListTree, Bot, CircleHelp, Command, Focus, Download, Upload, Library, Maximize2, X, RotateCcw, Pin, PinOff, Share2, Save, Scan } from '@lucide/svelte';
  import FooterMore from './components/FooterMore.svelte';
  import SharePatch from './components/SharePatch.svelte';
  import {patchSnapshot,patchFromHash,embedOptions,type PatchSnapshot} from './core/shared-patch';
  import {readLocalPatches,type LocalPatch,LOCAL_PATCHES_KEY} from './core/local-patches';
  import CaptureControls from './components/CaptureControls.svelte';
  import PerformanceControls from './components/PerformanceControls.svelte';
  import EnvelopeMini from './components/EnvelopeMini.svelte';
  import AudioRender from './components/AudioRender.svelte';
  import Workspace from './components/Workspace.svelte';import Growth from './components/Growth.svelte';
  import { session, engine, play, stop, updateSource, replaceSource,commitMutation,chooseAgentModel,cycleUpdateMode,setUpdateMode,togglePerformance,navigateSection,toggleFollowTime,chooseVisualization } from './state.svelte';
  import { presets,type StudyPreset } from './core/presets';import { sha256 } from './core/parser';import { download } from './core/export';
  import {scoreSections,sectionAtTime,sectionAtCursor,tempoAt} from './core/sections';
  import { focusEditor } from './editor/controller';
  import {agentIndicator} from './integrations/model-activity';
  import {mutateLocal} from './core/mutation';
  import {setSequenceMessage} from './core/sequences';
  import type { PodId } from './core/types';
  import {camera,toggleAutoOrbit} from './camera.svelte';
  import {visualDrag as orbitDrag,stockyCamera} from './visuals/interaction.svelte';
  import {resetStocky,stockyZoomAt} from './visuals/stocky-input';
  let shareDialog=$state<{patch:PatchSnapshot;incoming:boolean}>();
  function localLibrary(){try{return readLocalPatches(localStorage);}catch{return [];}}
  let localPatches=$state<LocalPatch[]>(localLibrary());
  function refreshLocalLibrary(){localPatches=localLibrary();}
  function openShare(){try{shareDialog={patch:patchSnapshot({version:1,grammar:2,title:session.title,source:session.source,seed:session.seed,loop:session.loop}),incoming:false};}catch(error){session.message=error instanceof Error?error.message:String(error);}}
  function openPatch(patch:PatchSnapshot,event?:MouseEvent){stop();session.seed=patch.seed;session.loop=patch.loop;engine.loop=patch.loop;session.mutationPaused=false;session.mutationHistory=[];workspace?.openFile(patch.source,patch.title,patch.title.endsWith('.syn')?patch.title:patch.title+'.syn','local:'+patch.title+':'+patch.source,patch.seed,patch.loop,event?.metaKey||event?.ctrlKey?'split':event?.shiftKey?'tab':'replace');session.message='Patch opened · press Play when ready';}
  const embed=embedOptions(location.href);
  let embedReady=$state(false);
  let shareRead=0;
  async function readSharedLink(){const generation=++shareRead;try{const patch=await patchFromHash(location.hash);if(patch&&generation===shareRead){if(embed.enabled){openPatch(patch);session.infoHidden=true;embedReady=true;}else shareDialog={patch,incoming:true};}}catch(error){session.message=error instanceof Error?error.message:String(error);}}
  let dragEndedAt=-Infinity;
  function startPodDrag(event:DragEvent,id:PodId){if(!event.dataTransfer)return;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-syno-pod',id);session.draggingPod=id;}
  function startFileDrag(event:DragEvent,data:{source:string;title:string;name:string;key?:string;seed?:number;loop?:boolean}){if(event.dataTransfer){event.dataTransfer.effectAllowed='copyMove';event.dataTransfer.setData('application/x-syno-file',JSON.stringify(data));}}
  function endPodDrag(){session.draggingPod=undefined;dragEndedAt=performance.now();}
  function togglePod(id:PodId){if(performance.now()-dragEndedAt>250)workspace?.toggle(id);}
  function savedLibraryPin(){try{return localStorage.getItem('syno.lab.libraryPinned')==='true';}catch{return false;}}
  let libraryPinned=$state(savedLibraryPin());
  function toggleLibraryPin(){libraryPinned=!libraryPinned;library=true;try{localStorage.setItem('syno.lab.libraryPinned',String(libraryPinned));}catch{}}
  let workspace:Workspace;let pods=$state<string[]>(['editor']),palette=$state(false),query=$state(''),library=$state(savedLibraryPin());
  let fileInput:HTMLInputElement;let commandInput=$state<HTMLInputElement>();
  const aiIndicator=$derived(agentIndicator(session.aiActivity,session.score.mutations?.find(r=>r.agent)?.algorithm,{paused:session.mutationPaused,playing:session.playing,ready:session.aiModelReady}));
  const studyGroups=[...new Set(presets.map(p=>p.category??'Synthesis'))].map(name=>({name,studies:presets.filter(p=>(p.category??'Synthesis')===name)}));
  const podActions=[{id:'editor' as PodId,label:'Editor',key:'1',icon:Code2},{id:'fold' as PodId,label:'FOLD growth',key:'2',icon:Sprout},{id:'events' as PodId,label:'Event stream',key:'3',icon:ListTree},{id:'agents' as PodId,label:'Agents',key:'4',icon:Bot}];
  const commands=$derived([
    ...(['sc','sa','sx'] as const).map((mode,index)=>({name:`Sequence behavior: ${['continuous','articulated','spatial'][index]}`,key:'',run:()=>{replaceSource(setSequenceMessage(session.source,mode),session.title);focusEditor();}})),
    {name:'Play / apply score',key:'⌘ ↵',run:()=>void play()},
    {name:'Stop all audio',key:'⌘ .',run:stop},
    {name:'Previous section',key:'⌘ [',run:()=>navigateSection(-1)},
    {name:'Next section',key:'⌘ ]',run:()=>navigateSection(1)},
    {name:'Toggle follow current time',key:'Alt F',run:toggleFollowTime},
    ...podActions.map(p=>({name:`Open ${p.label}`,key:`⌘ ${p.key}`,run:()=>workspace?.open(p.id)})),
    {name:'Stocky · zoom horizontal in',key:'+',run:()=>stockyZoomAt(stockyCamera,2)},
    {name:'Stocky · zoom horizontal out',key:'−',run:()=>stockyZoomAt(stockyCamera,.5)},
    {name:'Stocky · fit whole score 1:1',key:'0',run:()=>resetStocky(stockyCamera)},
    {name:'Detach active pod into a window',key:'',run:()=>void workspace?.detach()},
    {name:'Toggle automatic scene orbit',key:'',run:()=>toggleAutoOrbit()},
    {name:'Reset scene pan / zoom',key:'',run:()=>{camera.panX=0;camera.panY=0;camera.zoom=1;}},
    {name:'Toggle keyboard PLAY / EDIT mode',key:'⌘ E',run:togglePerformance},
    {name:'Cycle update mode · manual / next loop / on writing',key:'',run:cycleUpdateMode},
    ...UPDATE_MODES.map(mode=>({name:`Update mode: ${UPDATE_INFO[mode].title}`,key:'',run:()=>setUpdateMode(mode)})),
    {name:'Cycle word wrap · 100 / 70 / 30%',key:'Ctrl Z',run:()=>session.wrapMode=(session.wrapMode+1)%3},
    {name:'Toggle visuals-only mode',key:'Ctrl M',run:toggleInfo},
    {name:'Toggle fullscreen',key:'Ctrl F',run:()=>void toggleFullscreen()},
    {name:'Focus editor',key:'⌘ ⇧ F',run:()=>workspace?.focus()},
    {name:'Help for command under cursor',key:'Ctrl H',run:openContextHelp},
    {name:'Language & shortcuts',key:'',run:()=>workspace?.open('help')},
    {name:'Reset panel layout',key:'',run:()=>workspace?.reset()},
    {name:'Record / stop video + audio',key:'Alt V',run:()=>window.dispatchEvent(new Event('syno:record'))},
    {name:'Render audio · stereo / spatial',key:'Alt R',run:()=>window.dispatchEvent(new Event('syno:audio-render'))},
    ...(['cube','parameters','spatial','phyllotaxis','lsystem','stocky'] as const).map((mode,index)=>({name:`Visual: ${['FOLD / room','parameter cube · @XYZ','room + growth + trajectories','phyllotaxis','L-system branches','Stocky temporal score'][index]}`,key:['!vc','!vp','!vs','!vf','!vl','!vt'][index],run:()=>chooseVisualization(mode)})),
    {name:'Speakers · spatial view',key:'!vs',run:()=>chooseVisualization('spatial')},
    {name:'Speakers · overlay on FOLD',key:'',run:()=>session.spatialOverlay=!session.spatialOverlay},
    {name:'Capture formats / settings',key:'Alt Shift V',run:()=>window.dispatchEvent(new Event('syno:capture-settings'))},
    {name:'Save scene PNG',key:'Alt P',run:()=>window.dispatchEvent(new Event('syno:capture-image'))},
    {name:'Toggle command subtitles',key:'Alt C',run:()=>window.dispatchEvent(new Event('syno:captions'))},
    {name:'Toggle capture frame',key:'Alt G',run:()=>window.dispatchEvent(new Event('syno:guide'))},
    {name:'Share patch link',key:'',run:openShare},
    {name:'Save patch to My patches',key:'',run:openShare},
    ...localPatches.map(p=>({name:`Open My patch: ${p.title}`,key:'',run:()=>openPatch(p)})),
    {name:'Save score to file',key:'⌘ S',run:save},
    ...presets.map(p=>({name:`Load study: ${p.name}`,key:'',run:()=>{loadStudy(p);}}))
  ].filter(c=>c.name.toLowerCase().includes(query.toLowerCase())));
  function loadStudy(p:StudyPreset,event?:MouseEvent){workspace?.openFile(p.code,p.name,p.file?.split('/').at(-1)??p.name+'.syn','library:'+p.file,p.seed,p.loop,event?.metaKey||event?.ctrlKey?'split':event?.shiftKey?'tab':'replace');}
  function openContextHelp(){const command=session.contextCommand;if(!command){workspace?.open('help');return;}session.helpFocus={section:command.section,request:(session.helpFocus?.request??0)+1};workspace?.open('help');}
  function toggleInfo(){session.infoHidden=!session.infoHidden;palette=false;if(!libraryPinned)library=false;if(session.infoHidden)requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('.scene-orbit-zone')?.focus());else requestAnimationFrame(focusEditor);}
  async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{session.message='Fullscreen is unavailable in this browser window.';}}
  function save(){download(session.fileName,session.source,'text/plain');session.message='Score downloaded';}
  function togglePalette(){palette=!palette;query='';if(!libraryPinned)library=false;}
  function execute(run:()=>void){palette=false;run();}
  function keydown(e:KeyboardEvent){
    if(e.defaultPrevented)return;
    const mod=e.metaKey||e.ctrlKey;
    if(e.key==='Escape'){shareDialog=undefined;session.captureModal=false;palette=false;if(!libraryPinned)library=false;return;}
    if(mod&&['p','k'].includes(e.key.toLowerCase())){e.preventDefault();togglePalette();}
    else if(mod&&e.key==='.'){e.preventDefault();stop();}
    else if(mod&&e.key==='Enter'&&!e.altKey){e.preventDefault();void play();}
    else if(mod&&['1','2','3','4'].includes(e.key)){e.preventDefault();workspace?.open(podActions[Number(e.key)-1].id);}
    else if(mod&&e.shiftKey&&e.key.toLowerCase()==='f'){e.preventDefault();workspace?.focus();}
    else if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();save();}
  }
  const loopEnabled=$derived.by(()=>{const configured=session.loop;return session.playing?engine.loop:configured;});
  const headerScore=$derived(session.playing?(session.playbackScore??session.applied??session.score):session.score);
  const sections=$derived(scoreSections(headerScore));
  const sectionIndex=$derived(session.playing?sectionAtTime(headerScore,session.time+(session.applied?.playbackRange?.from??0)):sectionAtCursor(headerScore,session.envelopeCursor));
  const sectionName=$derived(sections[sectionIndex]?.name);
  const headerTempo=$derived(tempoAt(headerScore,session.playing?session.time+(session.applied?.playbackRange?.from??0):session.envelopeCursor,!session.playing)??headerScore.tempos?.[0]?.bpm);
  let hashGeneration=0;
  $effect(()=>{const canonical=session.score.canonical;const current=++hashGeneration;void sha256(canonical).then(hash=>{if(current===hashGeneration)session.hash=hash;});});
  $effect(()=>{if(palette&&commandInput)commandInput.focus();});
  onMount(()=>{
    void readSharedLink();window.addEventListener('hashchange',readSharedLink);const storageChanged=(event:StorageEvent)=>{if(event.key===LOCAL_PATCHES_KEY)refreshLocalLibrary();};window.addEventListener('storage',storageChanged);
    // Panic runs before focused editors, modals or dock panels consume keyboard events.
    const panic=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&['BracketLeft','BracketRight'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();navigateSection(e.code==='BracketRight'?1:-1);return;}
      if(e.altKey&&!e.metaKey&&!e.ctrlKey&&e.code==='KeyF'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)toggleFollowTime();return;}
      if(e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==='h'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)openContextHelp();return;}
      if((e.metaKey||e.ctrlKey)&&!e.altKey&&(e.code==='KeyE'||e.key.toLowerCase()==='e')){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){palette=false;togglePerformance();}return;}
      if(e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();e.stopImmediatePropagation();session.wrapMode=(session.wrapMode+1)%3;return;}
      if(e.altKey&&!e.ctrlKey&&!e.metaKey&&['KeyR','KeyV','KeyP','KeyC','KeyG'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();const name=e.code==='KeyR'?'syno:audio-render':e.code==='KeyV'?(e.shiftKey?'syno:capture-settings':'syno:record'):e.code==='KeyP'?'syno:capture-image':e.code==='KeyC'?'syno:captions':'syno:guide';window.dispatchEvent(new Event(name));}
      else if(e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.shiftKey&&['m','f'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();if(e.key.toLowerCase()==='m')toggleInfo();else void toggleFullscreen();}
      else if(((e.metaKey||e.ctrlKey)&&(e.code==='Period'||e.key==='.'))||e.key==='Escape'){
        e.preventDefault();e.stopImmediatePropagation();stop();
        if(e.key==='Escape'){shareDialog=undefined;session.captureModal=false;palette=false;if(!libraryPinned)library=false;}
      }else if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='p'){e.preventDefault();e.stopImmediatePropagation();togglePalette();}
    };
    window.addEventListener('keydown',panic,{capture:true});
    window.addEventListener('syno:commands',togglePalette);
    let frame=0,previousIds='',editRevision=engine.editRevision,mutationAt=0;let mutating=false;

    function tick(){
      frame=requestAnimationFrame(tick);session.playing=engine.running;
      if(editRevision!==engine.editRevision){editRevision=engine.editRevision;session.applied=engine.currentScore;session.pendingHotEdit=engine.pendingUpdate;session.pendingSection=undefined;if(engine.currentScore?.canonical===session.score.canonical)session.playbackScore=session.score;session.dirty=!!session.score.diagnostics.length||engine.currentScore?.canonical!==session.score.canonical;session.message=engine.lastEditMode==='write'?'Live structure updated · phrase renewed':'Update applied at loop boundary';}
      if(engine.failure){session.message=engine.failure;engine.failure='';}
      if(engine.running&&engine.currentScore?.randomTimeSource&&!session.dirty)session.applied=engine.currentScore;
      if(!engine.running)mutationAt=0;
      if(engine.running&&session.playbackDocumentId===session.activeDocumentId&&!session.mutationPaused&&!mutating&&engine.time>=mutationAt+Math.max(1,session.mutationEvery)){
        mutationAt=engine.time;const regions=session.score.mutations??[],region=regions[session.mutationGeneration%Math.max(1,regions.length)];
        if(region&&!session.score.diagnostics.length){if(region.agent){window.dispatchEvent(new CustomEvent('syno:mutate-ai',{detail:region}));}
        else {const result=mutateLocal(session.source,region,session.seed,session.mutationGeneration);if(result){mutating=true;void commitMutation(result.source,result.description).finally(()=>mutating=false);}}}
      }
      session.audioHealth=engine.health;session.time=engine.cycleTime;session.totalTime=engine.time;session.level=engine.level;
      session.visualEvents=engine.running?engine.visualEvents:[];
      const ids=engine.running?engine.activeSourceIds:[];
      const signature=ids.join(',');if(signature!==previousIds){previousIds=signature;session.activeIds=ids;}
    }
    tick();return()=>{shareRead++;window.removeEventListener('hashchange',readSharedLink);window.removeEventListener('storage',storageChanged);window.removeEventListener('keydown',panic,{capture:true});window.removeEventListener('syno:commands',togglePalette);cancelAnimationFrame(frame);void engine.dispose();};
  });
  async function importFile(e:Event){const input=e.target as HTMLInputElement;const file=input.files?.[0];if(file){if(file.size>64000){session.message='Score exceeds 64,000 characters.';}else workspace?.openFile(await file.text(),file.name,file.name);}input.value='';}
  function seedChange(){session.seed=Math.max(0,Math.min(4294967295,Math.round(session.seed||0)));updateSource(session.source);}
</script>
<svelte:window onkeydown={keydown}/>
<div class="app-shell" class:embed-mode={embed.enabled} class:visuals-only={session.infoHidden}>
  <header class="masthead">
    <div class="brand" title="synthetic Notation"><span class="brand-mark">sy<span>N</span>o</span></div>
    <EnvelopeMini/>
    <div class="piece-context">
      {#if session.playing}<span class="piece-title" title={headerScore.title??session.playbackFileName}>{headerScore.title??session.playbackFileName}</span>{/if}
      {#if sectionName||session.pendingSection}<div class="section-nav"><select aria-label="Current section" title={loopEnabled?'Sections · Cmd/Ctrl+[ previous · Cmd/Ctrl+] next · running changes enter at the next loop':'Sections · Cmd/Ctrl+[ previous · Cmd/Ctrl+] next · Loop off: queued for next Play'} value={session.pendingSection?session.selectedSection:sectionIndex} onchange={event=>navigateSection(0,Number(event.currentTarget.value))}><option value={-1}>whole piece</option>{#each sections as section,index}<option value={index}>{section.name}</option>{/each}</select>{#if session.pendingSection}<span class="section-queued" title="Queued for the next loop">↗</span>{/if}</div>{/if}
    </div>
    <div class="transport">
      <button class:running={session.playing} class="play-button" onclick={()=>{if(session.playing)stop();else void play();}} title="Play / apply: Cmd/Ctrl+Enter · Stop: Cmd/Ctrl+." aria-label={session.playing?'Stop playback':'Play score'}>{#if session.playing}<Square size={14} fill="currentColor"/>{:else}<Play size={15} fill="currentColor"/>{/if}</button>
      <button class="icon-button" class:enabled={loopEnabled} aria-pressed={loopEnabled} onclick={()=>{session.loop=!loopEnabled;engine.loop=session.loop;}} title="Loop score" aria-label="Loop score"><Repeat2 size={17}/></button>
      <span class="timecode">{Math.floor(session.time/60).toString().padStart(2,'0')}:{(session.time%60).toFixed(1).padStart(4,'0')}</span>
      {#if headerTempo!==undefined}<span class="tempo-readout" title="Written tempo · !b" aria-label="Tempo">{headerTempo}<small>BPM</small></span>{/if}
      <div class="meter" title="Measured local audio level"><i style:width={`${session.level*100}%`}></i></div>
      <input class="master-volume" aria-label="Master volume" title="Master volume" type="range" min="0" max="1" step="0.01" bind:value={session.master} oninput={()=>engine.setVolume(session.master)}/>
      <button class="icon-button fullscreen" onclick={()=>void toggleFullscreen()} title="Fullscreen (Ctrl+F)" aria-label="Fullscreen"><Maximize2 size={16}/></button>
    </div>
  </header>
  <main class="studio" class:library-docked={library&&libraryPinned}>
    <nav class="ribbon" aria-label="Workspace pods">
      <div class="ribbon-top">{#each podActions as pod}<button class:active={pods.includes(pod.id)} class="ribbon-button pod-drag-source" draggable="true" ondragstart={event=>startPodDrag(event,pod.id)} ondragend={endPodDrag} onclick={()=>togglePod(pod.id)} title={`${pod.label} · drag to dock (Cmd+${pod.key})`} aria-label={pod.label} aria-pressed={pods.includes(pod.id)}><pod.icon size={19}/><span>{pod.key}</span></button>{/each}
        <div class="ribbon-divider"></div>
        <button class="ribbon-button" class:active={library} onclick={()=>{library=!library;palette=false;}} title="Studies" aria-label="Studies"><Library size={19}/></button>
        <button class="ribbon-button" onclick={()=>fileInput.click()} title="Import score" aria-label="Import score"><Upload size={18}/></button>
        <button class="ribbon-button" onclick={save} title="Save score (Cmd+S)" aria-label="Save score"><Download size={18}/></button>
        <button class="ribbon-button" onclick={openShare} title="Share patch link / save local copy" aria-label="Share patch"><Share2 size={18}/></button>
      </div>
      <div class="ribbon-bottom"><button class="ribbon-button" onclick={()=>workspace?.focus()} title="Focus editor (Cmd+Shift+F)" aria-label="Focus editor"><Focus size={19}/></button><button class="ribbon-button" onclick={togglePalette} title="Commands (Cmd+P)" aria-label="Commands"><Command size={18}/></button><button class="ribbon-button pod-drag-source" draggable="true" ondragstart={event=>startPodDrag(event,'help')} ondragend={endPodDrag} onclick={()=>togglePod('help')} title="Language & shortcuts · drag to dock" aria-label="Language and shortcuts"><CircleHelp size={19}/></button></div>
    </nav>
    <section class="stage" aria-label="Live coding workspace"><Growth background={true}/><Workspace bind:this={workspace} onchange={(ids)=>pods=ids}/>
      {#if session.infoHidden}<button type="button" class="scene-orbit-zone interactive" use:orbitDrag tabindex="0" aria-label="Orbit the biological growth view" title="Drag to orbit · pinch to zoom · Shift+drag to pan"></button>{/if}
      {#if embed.enabled&&embedReady}
        {#if embed.code}<pre class="embed-code" aria-label="Embedded score code">{session.source}</pre>{/if}
        <div class="embed-transport"><button class="icon-button" aria-label={session.playing?'Stop embedded score':'Play embedded score'} title={session.playing?'Stop':'Play'} onclick={()=>session.playing?stop():void play()}>{#if session.playing}<Square size={18}/>{:else}<Play size={18}/>{/if}</button><span role="status">{session.playing?'PLAYING':session.message==='Patch opened · press Play when ready'?'syNo · click to play':session.message}</span></div>
      {/if}
      <CaptureControls/>
      <div class="scene-caption" aria-hidden="true"><span>FOLD / {session.visualization==='parameters'?'PARAMETERS · @XYZ':session.visualization==='spatial'?'SPEAKERS · '+(session.score.speakers?.length??0)+' OUTPUTS':session.visualization==='stocky'?'STOCKY · SCORE':session.visualization==='phyllotaxis'?'PHYLLOTAXIS · POINTS':(session.score.generator||'SOUND').toUpperCase()}</span><span>{session.score.events.length} events · seed {session.seed}</span></div>
    </section>
    {#if library}<aside class="library-flyout" class:pinned={libraryPinned}><div class="flyout-title"><span>LIBRARY</span><div class="library-title-actions"><button class="icon-button" onclick={openShare} aria-label="Save patch to My patches" title="Save current patch locally"><Save size={15}/></button><button class="icon-button" class:enabled={libraryPinned} aria-pressed={libraryPinned} onclick={toggleLibraryPin} aria-label={libraryPinned?'Unpin library':'Pin library'} title={libraryPinned?'Unpin library':'Pin library · keep open while browsing'}>{#if libraryPinned}<PinOff size={15}/>{:else}<Pin size={15}/>{/if}</button><button class="icon-button" onclick={()=>library=false} aria-label="Close studies"><X size={16}/></button></div></div><details class="study-folder" open><summary>My patches · {localPatches.length}</summary>{#each localPatches as patch}<button class="study" draggable="true" ondragstart={event=>startFileDrag(event,{source:patch.source,title:patch.title,name:patch.title+'.syn',key:'saved:'+patch.id,seed:patch.seed,loop:patch.loop})} title={`Saved ${patch.savedAt} · seed ${patch.seed} · Loop ${patch.loop?'on':'off'}`} onclick={event=>{openPatch(patch,event);if(!libraryPinned)library=false;}}>{patch.title}</button>{/each}{#if !localPatches.length}<p class="local-library-empty">Save a patch here from the Share button.</p>{/if}</details>{#each studyGroups as group}<details class="study-folder"><summary>{group.name}</summary>{#each group.studies as preset}<button class="study" draggable="true" ondragstart={event=>startFileDrag(event,{source:preset.code,title:preset.name,name:preset.file?.split('/').at(-1)??preset.name+'.syn',key:'library:'+preset.file,seed:preset.seed,loop:preset.loop})} title={preset.detail+' · click: replace · Shift: tab · Cmd/Ctrl: split · drag to dock'} onclick={event=>{loadStudy(preset,event);if(!libraryPinned)library=false;}}>{preset.name}</button>{/each}</details>{/each}</aside>{/if}
  </main>
  <footer class="statusbar">
<button class="context-command" class:available={!!session.contextCommand} disabled={!session.contextCommand} aria-label="Command under cursor · open Help" title={session.contextCommand?`${session.contextCommand.name} · ${session.contextCommand.token} · click / Ctrl+H to open Help`:"Move the cursor over a syNo command · Ctrl+H opens Help"} onclick={openContextHelp}><span>{session.contextCommand?.name??'syNo language'}</span></button>
<div class="footer-group edit-group" role="group" aria-label="Editor and performance"><button class="follow-time" class:enabled={session.followTime} aria-pressed={session.followTime} aria-label="Follow current time" title={`Follow current time: ${session.followTime?'on':'off'} · editor + Stocky · Alt F`} onclick={toggleFollowTime}>F</button><button class="wrap-status" class:enabled={session.wrapMode!==0} aria-label="Cycle word wrap" title={`Word wrap ${[100,70,30][session.wrapMode]}%${session.wrapMode===0?' · free / off':''} · Ctrl+Z · cycle 100 → 70 → 30`} onclick={()=>session.wrapMode=(session.wrapMode+1)%3}>W{#if session.wrapMode}<small>{[100,70,30][session.wrapMode]}</small>{/if}</button><button class="performance-status" class:enabled={session.performanceMode} aria-label="Keyboard PLAY mode" aria-pressed={session.performanceMode} title="Keyboard PLAY / EDIT · Cmd/Ctrl+E · Q/A … [/' change values from the cursor" onclick={togglePerformance}>E<small>{session.performanceMode?'PLAY':''}</small></button><button class="update-status" class:enabled={session.updateMode!=='manual'} class:pending={session.pendingHotEdit} onclick={cycleUpdateMode} aria-label={`Update mode: ${session.updateMode}`} title={`${UPDATE_INFO[session.updateMode].title} · click to cycle manual → next loop → on writing. Alt-arrows follows this mode; Cmd/Ctrl+Enter always applies immediately.`}>U<small>{UPDATE_INFO[session.updateMode].mark}</small></button><label class="hot-glide" title="Parameter smoothing in seconds · U selects manual / next loop / on-writing updates">glide <input aria-label="Hot edit glide seconds" type="number" min="0" max="10" step="0.1" bind:value={session.hotEditSeconds} onchange={()=>{session.hotEditSeconds=Math.max(0,Math.min(10,Number(session.hotEditSeconds)||0));try{localStorage.setItem('syno.lab.hotEditSeconds',String(session.hotEditSeconds));}catch{}}}/>s</label></div>
<div class="footer-group space-group" role="group" aria-label="Space and view"><button class="view-status" class:enabled={camera.autoRotate} aria-pressed={camera.autoRotate} aria-label="Automatic scene rotation" title="AUTO · autopan / automatic Y orbit · camera only" onclick={()=>toggleAutoOrbit()}>AUTO</button>{#if session.visualization==='stocky'}<button class="view-status" aria-label="Reset Stocky horizontal zoom" title="Stocky horizontal zoom · pinch / + − · click or 0 = fit 1:1" onclick={()=>resetStocky(stockyCamera)}>{stockyCamera.zoom===1?'1:1':stockyCamera.zoom.toFixed(1)+'×'}</button>{:else}<button class="view-status" aria-label="Toggle cube projection" title={`Projection: ${camera.projection} · click to toggle`} onclick={()=>camera.projection=camera.projection==='isometric'?'perspective':'isometric'}>{camera.projection==='isometric'?'ISO':'PER'}</button>{/if}<button class="view-status" class:enabled={camera.panMode} aria-label="Toggle scene pan" aria-pressed={camera.panMode} title="PAN · drag to move scene · Shift+drag / Shift+two-finger scroll · double-click resets position" onclick={()=>camera.panMode=!camera.panMode} ondblclick={()=>{camera.panX=0;camera.panY=0;}}>PAN</button><button class:enabled={session.spatialOverlay} aria-pressed={session.spatialOverlay} aria-label="Speaker overlay" title="Speakers · overlay on FOLD · independent of parameter XYZ" onclick={()=>session.spatialOverlay=!session.spatialOverlay}>SP</button></div>
<div class="footer-group output-group" role="group" aria-label="Audio render and video"><button class="audio-render-status" aria-label="Render audio" title="R · Alt R · render audio · stereo / spatial · WAV / OGG / MP3" onclick={()=>window.dispatchEvent(new Event('syno:audio-render'))}>R</button><div class="video-well" role="group" aria-label="Video and image capture"><button class="video-main" class:live={session.recording} aria-label={session.recording?'Stop video recording':'Record video and audio'} title="V · video + audio · Alt V / Shift-click for composition formats" onclick={e=>window.dispatchEvent(new Event(e.shiftKey?'syno:capture-settings':'syno:record'))}>V</button><div class="video-subs"><button aria-label="Video composition settings" title="Video formats · Alt Shift V" onclick={()=>window.dispatchEvent(new Event('syno:capture-settings'))}>⋯</button><button class:enabled={session.subtitles} aria-pressed={session.subtitles} aria-label="Command subtitles" title="Command subtitles · Alt C" onclick={()=>session.subtitles=!session.subtitles}>CC</button><button aria-label="Save scene image" title="Save PNG · Alt P" onclick={()=>window.dispatchEvent(new Event('syno:capture-image'))}>PNG</button><button class:enabled={session.captureGuide} aria-pressed={session.captureGuide} aria-label="Capture frame" title="Composition frame · Alt G" onclick={()=>session.captureGuide=!session.captureGuide}><Scan size={11}/></button></div></div></div>
<div class="agent-status-group"><span class="agent-model-select" title={`Agent model · ${session.aiSelectedModel.replace(/^ollama:/,'')||'loading inventory'} · selection saves the syNo default`}><select aria-label="Agent model" value={session.aiSelectedModel} disabled={session.aiActivity.working||!session.aiModels.length} onchange={(event)=>chooseAgentModel(event.currentTarget.value)}>{#if !session.aiModels.length}<option value="">model…</option>{/if}{#each session.aiModels as m}<option value={m.id}>{m.name}</option>{/each}</select><span aria-hidden="true">⌄</span></span>{#if aiIndicator}<button class="ai-status" class:working={aiIndicator.working} aria-label="AI token activity" title={`${aiIndicator.title} · ${session.mutationStatus}`} onclick={()=>workspace?.open('agents')}><i aria-hidden="true"></i>{aiIndicator.label}</button>{/if}</div>
<div class="footer-group monitor-group" role="group" aria-label="Audio monitor"><button class="audio-health" aria-label="Audio health monitor" title={`Audio ${session.audioHealth.state} · ${session.audioHealth.voices} voices · ${session.audioHealth.reverbs} shared reverbs · ${session.audioHealth.late} late · ${session.audioHealth.dropped} dropped · ${session.audioHealth.invalid} invalid`} onclick={()=>workspace?.open('events')}>{session.audioHealth.invalid||session.audioHealth.error?'AUDIO !':`AUDIO ${session.audioHealth.voices}v`}</button><span class="status-indicator" class:invalid={session.score.diagnostics.length>0} class:live={session.playing}></span><span class="status-message" role="status">{session.score.diagnostics[0]?.message||session.message}</span></div>
<FooterMore onseed={seedChange} onreset={()=>workspace?.reset()} onaudio={()=>workspace?.open('events')}/></footer>
</div>
<input type="file" accept=".syn,.syno,.txt,text/plain" bind:this={fileInput} onchange={(e)=>void importFile(e)} hidden/>
{#if palette}<div class="palette-backdrop" role="presentation" onclick={(e)=>{if(e.target===e.currentTarget)palette=false;}}><dialog open class="command-palette" aria-modal="true" aria-label="Command palette"><div class="command-search"><Command size={18}/><input bind:this={commandInput} aria-label="Search commands" bind:value={query} placeholder="What would you like to do?" onkeydown={(e)=>{if(e.key==='Enter'&&commands[0]){e.preventDefault();execute(commands[0].run);}}}/><button class="icon-button" onclick={()=>palette=false} aria-label="Close commands"><X size={16}/></button></div><div class="command-results">{#each commands as command}<button onclick={()=>execute(command.run)}><span>{command.name}</span><kbd>{command.key}</kbd></button>{/each}{#if !commands.length}<p>No matching commands.</p>{/if}</div></dialog></div>{/if}

<PerformanceControls/><AudioRender/>
{#if shareDialog}{#key shareDialog.patch}<SharePatch patch={shareDialog.patch} incoming={shareDialog.incoming} onclose={()=>shareDialog=undefined} onopen={openPatch} onsaved={()=>{refreshLocalLibrary();session.message='Saved in My patches';}}/>{/key}{/if}
<style>.local-library-empty{font-size:10px;line-height:1.5;color:var(--dim);padding:0 12px 8px}</style>
