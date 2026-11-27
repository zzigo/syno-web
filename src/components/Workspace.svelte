<script lang="ts">
  import {createPopoutController} from '../workspace/popouts';
  import { onMount, mount, unmount } from 'svelte';
  import { createDockview, themeDark, positionToDirection, type DockviewApi } from 'dockview';
  import 'dockview/dist/styles/dockview.css';
  import Editor from './Editor.svelte';import Growth from './Growth.svelte';import Events from './Events.svelte';import OrfPod from './OrfPod.svelte';import Help from './Help.svelte';
  import type { PodId } from '../core/types';
  import { session,embedded,ensureEditorFile,activateEditorFile,addEditorFile,closeEditorFile,replaceSource } from '../state.svelte';
  import { focusEditor } from '../editor/controller';
  let {onchange=(_:string[])=>{}}:{onchange?:(ids:string[])=>void}=$props();
  let container:HTMLDivElement;let api:DockviewApi|undefined;
  let popouts:ReturnType<typeof createPopoutController>|undefined;
  export async function detach(){return popouts?.detach();}
  const titles:Record<PodId,string>={editor:'EDITOR',fold:'FOLD',events:'EVENTS',agents:'AGENTS',help:'LANGUAGE / SHORTCUTS'};
  export function openFile(source:string,title:string,name:string,key?:string,seed?:number,loop?:boolean,mode:'replace'|'tab'|'split'='replace'){
    const reference=api?.getPanel(session.activeDocumentId)??api?.getPanel('editor');
    let id:string;
    if(mode==='replace'){
      ensureEditorFile();id=session.activeDocumentId;
      if(seed!==undefined)session.seed=seed;if(loop!==undefined)session.loop=loop;
      const file=session.editorFiles.find(f=>f.id===id);if(file)file.key=key;
      replaceSource(source,title,name);
    }else id=addEditorFile(source,title,name,key,seed,loop);
    if(!api)return id;
    let panel=api.getPanel(id);
    if(!panel)panel=api.addPanel({id,component:'editor',title:name,params:{documentId:id},position:{referencePanel:reference,direction:mode==='split'?'right':'within'}});
    else if(mode==='split'&&reference&&panel!==reference)panel.api.moveTo({group:reference.group,position:'right'});
    panel.api.setActive();requestAnimationFrame(()=>panel?.view.content.element.querySelector<HTMLElement>('.cm-content')?.focus());return id;
  }
  export function open(id:PodId){
    if(!api)return;let panel=api.getPanel(id==='editor'&&api.getPanel('editor')?session.activeDocumentId:id);
    if(panel){panel.api.setActive();if(id==='editor'){activateEditorFile(panel.id);panel.view.content.element.querySelector<HTMLElement>('.cm-content')?.focus();}return;}
    const reference=api.getPanel('editor');
    panel=api.addPanel({id,component:id,title:id==='editor'?(session.editorFiles.find(f=>f.id==='editor')?.name??'score.syn'):titles[id],...(reference&&innerWidth>700?{position:{direction:'right' as const,referencePanel:reference}}:{})});
    if(id==='editor'){activateEditorFile(panel.id);panel.view.content.element.querySelector<HTMLElement>('.cm-content')?.focus();}
  }
  export function toggle(id:PodId){if(!api)return;if(id==='editor'){open(id);return;}const panel=api.getPanel(id);if(panel)api.removePanel(panel);else open(id);}
  export function focus(){if(!api)return;open('editor');const panel=api.getPanel(session.activeDocumentId)??api.getPanel('editor')!;if(session.focusMode){api.exitMaximizedGroup();session.focusMode=false;}else{api.maximizeGroup(panel);session.focusMode=true;}focusEditor();}
  export function reset(){if(!api)return;api.clear();session.focusMode=false;open('editor');}
  $effect(()=>{for(const file of session.editorFiles)api?.getPanel(file.id)?.api.setTitle(file.name);});
  onMount(()=>{
    ensureEditorFile();
    // The agent service outlives its detachable UI panel. Closing the tab only hides it.
    const agentElement=document.createElement('div');agentElement.className='pod-mount pod-agents';
    const agentInstance=mount(OrfPod,{target:agentElement});
    popouts=createPopoutController(container,()=>api,text=>session.message=text);
    api=createDockview(container,{popoutUrl:'/popout.html',getTabContextMenuItems:()=>['popout','float','maximize','separator','close'],createRightHeaderActionComponent:group=>popouts!.header(group),theme:{...themeDark,name:'syno',className:'dockview-theme-syno'},
      createComponent:options=>{
        if(options.name==='agents')return {element:agentElement,init:()=>{},dispose:()=>agentElement.remove()};
        const element=document.createElement('div');element.className=`pod-mount pod-${options.name}`;
        let instance:ReturnType<typeof mount>|undefined;
        return {element,init:params=>{
          if(options.name==='editor')instance=mount(Editor,{target:element,props:{documentId:params.params?.documentId??params.api.id}});
          else if(options.name==='fold')instance=mount(Growth,{target:element});
          else if(options.name==='events')instance=mount(Events,{target:element});
          else instance=mount(Help,{target:element});
        },dispose:()=>{if(instance)void unmount(instance);}};
      }
    });
    try{const saved=embedded?null:localStorage.getItem('syno.lab.layout.v2');if(saved)api.fromJSON(JSON.parse(saved));}catch{api.clear();}
    for(const panel of [...api.panels])if(panel.id.startsWith('file-')&&!session.editorFiles.some(f=>f.id===panel.id))api.removePanel(panel);
    if(!api.getPanel('editor'))open('editor');
    const active=api.getPanel(session.activeDocumentId);active?.api.setActive();
    for(const panel of api.panels){const file=session.editorFiles.find(f=>f.id===panel.id);if(file)panel.api.setTitle(file.name);}
    let timer:ReturnType<typeof setTimeout>;
    const persist=()=>{onchange(api!.panels.map(p=>p.id));if(embedded)return;clearTimeout(timer);timer=setTimeout(()=>{try{localStorage.setItem('syno.lab.layout.v2',JSON.stringify(api!.toJSON()));}catch{}},150);};
    const consolidateMobile=()=>{
      if(!api||container.clientWidth>650)return;
      const editor=api.getPanel('editor');if(!editor)return;
      const selected=api.activePanel?.id;
      for(const panel of [...api.panels])if(panel.group!==editor.group&&panel.group.api.location.type==='grid')panel.api.moveTo({group:editor.group,position:'center',skipSetActive:true});
      if(selected)api.getPanel(selected)?.api.setActive();
    };
    const observer=new ResizeObserver(consolidateMobile);observer.observe(container);consolidateMobile();
    const dragOver=api.onUnhandledDragOver(event=>{
      if(event.nativeEvent instanceof DragEvent&&(session.draggingPod&&event.nativeEvent.dataTransfer?.types.includes('application/x-syno-pod')||event.nativeEvent.dataTransfer?.types.includes('application/x-syno-file')))event.accept();
    });
    const drop=api.onDidDrop(event=>{
      if(!(event.nativeEvent instanceof DragEvent))return;
      const file=event.nativeEvent.dataTransfer?.getData('application/x-syno-file');if(file){try{const data=JSON.parse(file);if(typeof data.source!=='string'||data.source.length>64000||typeof data.title!=='string'||typeof data.name!=='string')return;const id=openFile(data.source,data.title,data.name,data.key,data.seed,data.loop,'tab');if(id)api?.getPanel(id)?.api.moveTo({group:event.group,position:event.position,index:event.index});}catch{}return;}
      const id=event.nativeEvent.dataTransfer?.getData('application/x-syno-pod') as PodId;
      if(!api||id!==session.draggingPod||!Object.hasOwn(titles,id))return;
      const panel=api.getPanel(id);
      if(panel)panel.api.moveTo({group:event.group,position:event.position,index:event.index});
      else api.addPanel({id,component:id,title:id==='editor'?(session.editorFiles.find(f=>f.id==='editor')?.name??'score.syn'):titles[id],position:{...(event.group?{referenceGroup:event.group}:{}),direction:positionToDirection(event.position),index:event.index}});
      session.draggingPod=undefined;
    });
    const subscriptions=[dragOver,drop,api.onWillDragPanel(event=>popouts?.drag(event)),api.onWillDragGroup(event=>popouts?.drag(event)),api.onDidAddPopoutGroup(event=>popouts?.opened(event)),api.onWillClosePopoutWindow(event=>popouts?.closed(event)),api.onDidOpenPopoutWindowFail(()=>session.message='Window could not open · use ↗ or allow popups for this site.'),api.onDidRemovePopoutGroup(()=>popouts?.moved()),api.onDidActivePanelChange(({panel})=>{if(panel&&session.editorFiles.some(f=>f.id===panel.id)){activateEditorFile(panel.id);const el=panel.view.content.element.querySelector<HTMLElement>('.cm-content');el?.focus();}}),api.onDidRemovePanel(panel=>closeEditorFile(panel.id)),api.onDidLayoutChange(persist),api.onDidAddPanel(persist),api.onDidRemovePanel(persist)];persist();
    return()=>{observer.disconnect();clearTimeout(timer);subscriptions.forEach(s=>s.dispose());popouts?.dispose();api?.dispose();void unmount(agentInstance);api=undefined;};
  });
</script>
<div class="workspace" bind:this={container}></div>
