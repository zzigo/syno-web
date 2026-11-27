<script lang="ts">
  import {scoreCommentKeys,commentKeydown} from '../editor/comments';
  import {onMount} from 'svelte';
  import {EditorState,Compartment,StateEffect,StateField} from '@codemirror/state';
  import {EditorView,Decoration,keymap,type DecorationSet} from '@codemirror/view';
  import {history,defaultKeymap,historyKeymap} from '@codemirror/commands';
  import {setDiagnostics} from '@codemirror/lint';
  import {scoreColors} from '../editor/syntax';
  import {session,play,stop,updateContext} from '../state.svelte';
  import {compile} from '../core/parser';
  let {source,streaming=false,onedit=(_:string)=>{}}:{source:string;streaming?:boolean;onedit?:(source:string)=>void}=$props();
  let host:HTMLDivElement;let view:EditorView|undefined,syncing=false;
  let lastPlayed=$state('');const readOnly=new Compartment();
  const highlight=StateEffect.define<{from:number;to:number}[]>();
  const live=StateField.define<DecorationSet>({create:()=>Decoration.none,update(value,tr){
    value=value.map(tr.changes);for(const effect of tr.effects)if(effect.is(highlight))value=Decoration.set(effect.value.filter(r=>r.from>=0&&r.to<=tr.state.doc.length&&r.to>r.from).map(r=>Decoration.mark({class:'syno-sounding'}).range(r.from,r.to)),true);
    return value;
  },provide:field=>EditorView.decorations.from(field)});
  export function playAll(){lastPlayed=source;void play(source,0,'selection','agent');}
  function selection(){if(!view)return;const range=view.state.selection.main,line=view.state.doc.lineAt(range.head);lastPlayed=source;void play(range.empty?line.text:view.state.sliceDoc(range.from,range.to),range.empty?line.from:range.from,range.empty?'line':'selection','agent');}
  onMount(()=>{
    view=new EditorView({parent:host,state:EditorState.create({doc:source,extensions:[scoreColors,history(),live,EditorView.lineWrapping,readOnly.of(EditorState.readOnly.of(streaming)),
      EditorView.contentAttributes.of({'aria-label':'Proposed score editor','spellcheck':'false'}),
      EditorView.domEventHandlers({keydown:commentKeydown}),
      keymap.of([...scoreCommentKeys,{key:'Alt-Enter',run:()=>{selection();return true;}},{key:'Mod-Alt-Enter',run:()=>{selection();return true;}},{key:'Mod-Enter',run:()=>{playAll();return true;}},{key:'Mod-.',run:()=>{stop();return true;}},{key:'Mod-p',run:()=>{window.dispatchEvent(new Event('syno:commands'));return true;}},...defaultKeymap,...historyKeymap]),
      EditorView.updateListener.of(update=>{if(update.docChanged&&!syncing)onedit(update.state.doc.toString());if((update.view.hasFocus||session.envelopeOwner==='agent'&&update.docChanged)&&(update.selectionSet||update.docChanged||update.focusChanged)){updateContext(update.state.doc.toString(),update.state.selection.main.head,'agent');}})
    ]})});
    return()=>{view?.destroy();view=undefined;};
  });
  $effect(()=>{
    const text=source;if(!view)return;const old=view.state.doc.toString();if(old===text)return;
    // Append/replace only the changed suffix so an existing selection survives streaming.
    let prefix=0;while(prefix<old.length&&prefix<text.length&&old[prefix]===text[prefix])prefix++;
    let suffix=0;while(suffix<old.length-prefix&&suffix<text.length-prefix&&old[old.length-1-suffix]===text[text.length-1-suffix])suffix++;
    syncing=true;view.dispatch({changes:{from:prefix,to:old.length-suffix,insert:text.slice(prefix,text.length-suffix)}});syncing=false;
  });
  $effect(()=>{if(view)view.dispatch({effects:readOnly.reconfigure(EditorState.readOnly.of(streaming))});});
  $effect(()=>{const diagnostic=compile(source,session.seed).diagnostics;if(view)view.dispatch(setDiagnostics(view.state,diagnostic.map(d=>({...d,severity:'error' as const}))));});
  $effect(()=>{
    const ids=session.activeIds,applied=session.applied;
    const ranges=session.playing&&session.playbackOwner==='agent'&&source===lastPlayed&&applied?applied.events.filter(e=>ids.includes(e.id)).flatMap(e=>e.traces):[];
    if(view)view.dispatch({effects:highlight.of([...new Map(ranges.map(r=>[`${r.from}:${r.to}`,r])).values()])});
  });
</script>
<div class="agent-score" bind:this={host}></div>
