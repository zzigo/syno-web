<script lang="ts">
  import {visualDrag} from '../visuals/interaction.svelte';
  import {camera} from '../camera.svelte';
  import {scoreCommentKeys,commentKeydown} from '../editor/comments';
  import {performanceSlots,PLAY_KEYS} from '../core/performance';
  import { onMount } from 'svelte';
  import { Compartment, EditorState, StateEffect, StateField, type Range } from '@codemirror/state';
  import { EditorView, Decoration, ViewPlugin, keymap, lineNumbers, highlightActiveLine, drawSelection, type DecorationSet, WidgetType } from '@codemirror/view';
  import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
  import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
  import { setDiagnostics } from '@codemirror/lint';
  import { session,activateEditorFile, updateSource, play, stop, chooseVisualization,updateContext,requestEditorUpdate,togglePerformance } from '../state.svelte';
  import {scoreColors as colors} from '../editor/syntax';
  import type { VisualMode } from '../core/visualization';
  import { ChevronDown } from '@lucide/svelte';
  import { registerEditor, changeNumber } from '../editor/controller';
  let {documentId='editor'}:{documentId?:string}=$props();
  const active=$derived(session.activeDocumentId===documentId);
  const file=$derived(session.editorFiles.find(f=>f.id===documentId));
  const source=$derived(active?session.source:file?.source??'');
  let host: HTMLDivElement; let view: EditorView | undefined;
  const wrapping=new Compartment();const wrapMode=$derived(session.wrapMode);
  $effect(()=>{const mode=session.wrapMode;if(view){view.dispatch({effects:wrapping.reconfigure(mode?EditorView.lineWrapping:[])});view.requestMeasure();}});
  const activeEffect=StateEffect.define<{from:number;to:number}[]>();
  const activeField=StateField.define<DecorationSet>({
    create:()=>Decoration.none,
    update(value,tr) {
      value=value.map(tr.changes);
      for(const effect of tr.effects) if(effect.is(activeEffect)) {
        const ranges=effect.value.filter(r=>r.to>r.from&&r.to<=tr.state.doc.length);
        value=Decoration.set(ranges.map(r=>Decoration.mark({class:'syno-sounding'}).range(r.from,r.to)),true);
      }
      return tr.docChanged?Decoration.none:value;
    },
    provide:field=>EditorView.decorations.from(field)
  });
  class RemovedMutation extends WidgetType {
    readonly text:string;constructor(text:string){super();this.text=text;}
    eq(other:RemovedMutation){return this.text===other.text;}
    toDOM(){const span=document.createElement('span');span.className='syno-mutation-removed';span.textContent=this.text;span.title='Removed fragment';span.setAttribute('aria-hidden','true');return span;}
  }
  const mutationEffect=StateEffect.define<typeof session.mutationVisual>();
  const mutationField=StateField.define<DecorationSet>({
    create:()=>Decoration.none,
    update(value,tr){
      value=value.map(tr.changes);
      for(const effect of tr.effects)if(effect.is(mutationEffect)){
        const edit=effect.value;if(!edit||edit.to>tr.state.doc.length){value=Decoration.none;continue;}
        const ranges:Range<Decoration>[]=[];
        if(edit.to>edit.from)ranges.push(Decoration.mark({class:`syno-mutating ${edit.agent?'agent':'local'} ${edit.settled?'settled':''}`}).range(edit.from,edit.to));
        if(edit.revealed<edit.to)ranges.push(Decoration.mark({class:'syno-mutation-unwritten'}).range(edit.revealed,edit.to));
        if(edit.removed&&!edit.settled)ranges.push(Decoration.widget({widget:new RemovedMutation(edit.removed),side:-1}).range(edit.from));
        value=Decoration.set(ranges,true);
      }
      return value;
    },provide:field=>EditorView.decorations.from(field)
  });
  $effect(()=>{const edit=session.mutationVisual;if(view&&active)view.dispatch({effects:mutationEffect.of(edit?{...edit}:undefined)});});
  const performanceLock=new Compartment();
  const performanceEffect=StateEffect.define<{from:number;to:number;key:string}[]>();
  const performanceMarks=StateField.define<DecorationSet>({create:()=>Decoration.none,update(value,tr){value=value.map(tr.changes);for(const effect of tr.effects)if(effect.is(performanceEffect))value=Decoration.set(effect.value.filter(slot=>slot.from>=0&&slot.to>slot.from&&slot.to<=tr.state.doc.length).map(slot=>Decoration.mark({class:'syno-performance-value',attributes:{title:slot.key}}).range(slot.from,slot.to)),true);return value;},provide:field=>EditorView.decorations.from(field)});
  $effect(()=>{const enabled=session.performanceMode&&active,anchor=session.performanceAnchor,source=session.source;if(view)view.dispatch({effects:[performanceLock.reconfigure(EditorState.readOnly.of(enabled)),performanceEffect.of(enabled?performanceSlots(source,anchor).map((slot,i)=>({...slot,key:PLAY_KEYS[i].join(' / ')})):[])]});});
  function selection(){if(!view)return;const range=view.state.selection.main;const line=view.state.doc.lineAt(range.head);void play(range.empty?line.text:view.state.sliceDoc(range.from,range.to),range.empty?line.from:range.from,range.empty?'line':'selection');}
  onMount(()=>{
    view=new EditorView({parent:host,state:EditorState.create({doc:source,extensions:[
      lineNumbers(),history(),performanceLock.of(EditorState.readOnly.of(session.performanceMode)),performanceMarks,drawSelection(),highlightActiveLine(),activeField,mutationField,colors,wrapping.of(session.wrapMode?EditorView.lineWrapping:[]),
      EditorView.contentAttributes.of({'aria-label':'syNo score editor','spellcheck':'false','autocapitalize':'off','autocorrect':'off'}),
      autocompletion({override:[context=>{const word=context.matchBefore(/!?[A-Za-z]*/);if(!word||(!context.explicit&&word.from===word.to))return null;return {from:word.from,options:[
        {label:'!sc',type:'keyword',detail:'continuous sequence (default)'},{label:'!sa',type:'keyword',detail:'articulate each step'},{label:'!sx',type:'keyword',detail:'spatial gaps are silent steps'},{label:'!b120',type:'keyword',detail:'tempo in BPM'},{label:'!f6:48 reichp 1',type:'keyword',detail:'future · rotate target every 6 s'},{label:'uJMA',type:'keyword',detail:'just major tuning'},{label:'@pov/dfs',type:'keyword',detail:'XYZ pan/frequency/volume · depth-first'},
        {label:'!vl',type:'keyword',detail:'L-system branches visual'},{label:'!vp',type:'keyword',detail:'parameter cube · @XYZ'},{label:'!vf',type:'keyword',detail:'phyllotaxis visual'},{label:'!vs',type:'keyword',detail:'room, speakers and trajectories'},{label:'!vt',type:'keyword',detail:'temporal score · Stocky'},{label:'!stocky',type:'keyword',detail:'temporal score alias'},{label:'!room[20 10 30]',type:'keyword',detail:'width / height / depth in metres'},{label:'spk8',type:'keyword',detail:'octophonic full-range ring'},{label:'spk7.1.4',type:'keyword',detail:'12 role-labelled output channels / overhead layout'},{label:'spkOCT',type:'keyword',detail:'octophonic preset alias'},{label:'!vc',type:'keyword',detail:'cube visual'},
        {label:"s?[110:880]v2e0254'?",type:'function',detail:'independent random pitch and duration'},{label:'?[s a]165',type:'function',detail:'seeded timbre choice per node'},
        {label:"l_[the trees are singing]:s[n1 3 5 8]'n4r3",type:'function',detail:'local Kokoro voice / melodic vocoder'},
        {label:'s220',type:'function',detail:'sine · Hz'},{label:'t220',type:'function',detail:'triangle · Hz'},{label:'a220',type:'function',detail:'sawtooth · Hz'},
        {label:'L4 A>AB B>A @A=aa @B=bb',type:'keyword',detail:'L-system · define aa and bb first'},
        {label:"G234 (s220v1'0.2)",type:'keyword',detail:'scoped growth · compact N/U/D'},{label:"A& (s220v1'0.2)",type:'keyword',detail:'agentic rewrite of the parenthesized material'},{label:'L& (',type:'keyword',detail:'agentic L grammar scope'},
        {label:'G',type:'keyword',detail:'phyllotaxis'},{label:'A',type:'keyword',detail:'apomixis'},{label:'S',type:'keyword',detail:'stolon'},
        {label:'H',type:'keyword',detail:'apical dominance'},{label:'R',type:'keyword',detail:'tropism'},{label:'K',type:'keyword',detail:'colonisation'},
        {label:'N32',type:'variable',detail:'32 generations'},{label:'U0.08',type:'variable',detail:'mutation rate'},{label:'D1',type:'variable',detail:'growth spread'}]};}]}),
      EditorView.domEventHandlers({keydown:commentKeydown}),
      keymap.of([...scoreCommentKeys,
        {key:'Mod-e',run:()=>{togglePerformance();return true;}},
        {key:'Mod-Enter',run:()=>{void play();return true;}},
        
        {key:'Alt-Enter',run:()=>{selection();return true;}},
        {key:'Mod-p',run:()=>{window.dispatchEvent(new Event('syno:commands'));return true;}},
        
        {key:'Mod-Alt-Enter',run:()=>{selection();return true;}},
        {key:'Mod-.',run:()=>{stop();return true;}},
        {key:'Alt-ArrowUp',run:()=>changeNumber(1)},{key:'Alt-ArrowDown',run:()=>changeNumber(-1)},
        {key:'Alt-Shift-ArrowUp',run:()=>changeNumber(1,true)},{key:'Alt-Shift-ArrowDown',run:()=>changeNumber(-1,true)},
        indentWithTab,...completionKeymap,...defaultKeymap,...historyKeymap]),
      EditorView.updateListener.of(update=>{if(update.focusChanged&&update.view.hasFocus){activateEditorFile(documentId);registerEditor(update.view);}if(update.docChanged&&active&&session.performanceMode)session.performanceAnchor=update.changes.mapPos(session.performanceAnchor,-1);if(update.docChanged&&active&&update.state.doc.toString()!==session.source){session.mutationVisual=undefined;updateSource(update.state.doc.toString());requestEditorUpdate();}if(update.view.hasFocus&&(update.selectionSet||update.docChanged||update.focusChanged)){updateContext(update.state.doc.toString(),update.state.selection.main.head);}})
    ]})});
    if(active){registerEditor(view);view.focus();session.envelopeOwner='editor';session.envelopeCursor=view.state.selection.main.head;updateContext(source,view.state.selection.main.head);}
    const moved=()=>{if(view)view.setRoot(view.dom.ownerDocument);};window.addEventListener('syno:document-moved',moved);
    const sectionCursor=(event:Event)=>{if(!active||!view)return;const from=(event as CustomEvent<{from:number}>).detail.from;view.dispatch({selection:{anchor:Math.min(from,view.state.doc.length)},effects:EditorView.scrollIntoView(from,{y:'center'})});view.focus();};window.addEventListener('syno:section-cursor',sectionCursor);
    return()=>{window.removeEventListener('syno:document-moved',moved);window.removeEventListener('syno:section-cursor',sectionCursor);if(active)registerEditor();view?.destroy();view=undefined;};
  });
  $effect(()=>{
    session.codeRevision;
    if(view&&view.state.doc.toString()!==source){const old=view.state.doc.toString(),next=source;let from=0,tail=0;while(from<old.length&&from<next.length&&old[from]===next[from])from++;while(tail<old.length-from&&tail<next.length-from&&old[old.length-1-tail]===next[next.length-1-tail])tail++;view.dispatch({changes:{from,to:old.length-tail,insert:next.slice(from,next.length-tail)}});}
  });
  $effect(()=>{
    const diagnostics=active?session.score.diagnostics:[];
    if(view)view.dispatch(setDiagnostics(view.state,diagnostics.map(d=>({...d,from:Math.min(d.from,view!.state.doc.length),to:Math.min(d.to,view!.state.doc.length),severity:'error' as const}))));
  });
  $effect(()=>{
    const ids=session.activeIds;const score=session.applied;const dirty=session.dirty;const running=session.playing&&session.playbackOwner==='editor'&&session.playbackDocumentId===documentId;
    if(view){const ranges=running&&!dirty&&score?score.events.filter(e=>ids.includes(e.id)).flatMap(e=>e.traces):[];
      const unique=[...new Map(ranges.map(r=>[`${r.from}:${r.to}`,r])).values()];view.dispatch({effects:activeEffect.of(unique)});}
  });
  let followed=-1;
  $effect(()=>{const enabled=session.followTime,running=session.playing,ids=session.activeIds,score=session.applied;if(!enabled||!running){followed=-1;return;}if(!view||session.playbackDocumentId!==documentId||!score||active&&session.dirty)return;const event=score.events.find(e=>ids.includes(e.id));if(!event)return;const from=Math.min(event.from,view.state.doc.length),line=view.state.doc.lineAt(from).number;if(line!==followed){followed=line;view.dispatch({effects:EditorView.scrollIntoView(from,{y:'center',yMargin:50})});}});
</script>
<div class="editor-pod">
  <div class="editor-meta"><span class="editor-state" class:changed={session.dirty}>{session.mutationVisual?(session.mutationVisual.agent?'AGENT':'GROWTH')+(session.mutationVisual.settled?' SETTLING':' WRITING'):session.pendingHotEdit?(session.loop?'NEXT LOOP':'NEXT PLAY'):session.dirty?'UNAPPLIED EDITS':session.playing?(session.playbackOwner==='editor'?'LIVE':'AGENT'):'READY'}</span>

    <div class="visual-select"><select aria-label="Right-side visualization" title="Visual messages: !vc / !vp / !vf / !vl / !vs / !vt" value={session.visualization} onchange={(event)=>chooseVisualization(event.currentTarget.value as VisualMode)}><option value="cube">fold · room</option><option value="parameters">parameters · @XYZ</option><option value="phyllotaxis">phyllotaxis</option><option value="lsystem">branches</option><option value="stocky">stocky · score</option><option value="spatial">spatial · speakers</option></select><ChevronDown size={10} aria-hidden="true"/></div>
  </div>
  <div class="editor-body">
    <div class="editor-host" data-wrap={wrapMode} style:--score-width={wrapMode===1?'70vw':'30vw'} bind:this={host}></div>
    <button type="button" class="editor-orbit-zone" class:panning={camera.panMode} style:pointer-events={session.draggingPod?'none':undefined} style:width={wrapMode===1?'30%':wrapMode===2?'70%':'43%'} use:visualDrag aria-label="Orbit the embedded FOLD view" title="Drag to rotate · pinch to zoom · Shift+drag / Shift+scroll to pan"></button>
  </div>
  <div class="editor-foot"><span>⌘ ↵ play / apply</span><span>⌥ ↵ line / selection</span><span>⌘ . stop</span><span>⌥ ↑ ↓ change value</span></div>
</div>
