<script lang="ts">
 import {onMount} from 'svelte';import {X,Copy,Check,Save,FolderOpen,Share2} from '@lucide/svelte';
 import {patchLink,patchEmbed,type PatchSnapshot} from '../core/shared-patch';
 import {saveLocalPatch} from '../core/local-patches';
 let {patch,incoming=false,onclose,onopen,onsaved}:{patch:PatchSnapshot;incoming?:boolean;onclose:()=>void;onopen:(patch:PatchSnapshot)=>void;onsaved:()=>void}=$props();
 let embed=$state(''),showCode=$state(true);
 let dialog:HTMLDialogElement;let title=$state(''),link=$state(''),message=$state(''),busy=$state(false),copied=$state(false),saved=$state(false);let linkField=$state<HTMLInputElement>();
 const snapshot=()=>({...patch,title:title.trim()||'Untitled patch'});
 onMount(()=>{title=patch.title;dialog.showModal();});
 async function copy(){busy=true;copied=false;try{link=await patchLink(location.href,snapshot());await navigator.clipboard.writeText(link);copied=true;message='Link copied. This version stays unchanged when you keep editing.';}catch(error){message=link?'Select the link and press Cmd/Ctrl+C.':error instanceof Error?error.message:String(error);if(link){linkField?.focus();linkField?.select();}}finally{busy=false;}}
 async function copyEmbed(){busy=true;try{embed=await patchEmbed(location.href,snapshot(),showCode);await navigator.clipboard.writeText(embed);message='Embed copied · click Play inside the player to start audio.';}catch(error){message=embed?'Select the embed code and press Cmd/Ctrl+C.':String(error);}finally{busy=false;}}
 function save(){try{saveLocalPatch(localStorage,snapshot());saved=true;onsaved();message='Saved in Library → My patches, in this browser.';}catch(error){message='Could not save locally: '+(error instanceof Error?error.message:String(error));}}
</script>
<dialog bind:this={dialog} class="share-patch" aria-labelledby="share-title" oncancel={onclose} onclose={onclose}>
 <header><h2 id="share-title">{incoming?'Shared patch':'Share patch'}</h2><button class="icon-button" onclick={onclose} aria-label="Close share dialog"><X size={16}/></button></header>
 <label>Title<input aria-label="Patch title" maxlength="200" bind:value={title} oninput={()=>{link='';embed='';copied=false;saved=false;}}/></label>
 <p>{incoming?'Open this snapshot or keep a local copy. Press Play when ready.':'The link contains this version of your code, seed and Loop setting.'}</p>
 {#if incoming}<pre class="shared-code" aria-label="Shared patch code">{patch.source}</pre>{/if}
 <div class="snapshot-info">SEED {patch.seed} · LOOP {patch.loop?'ON':'OFF'}</div>
 {#if link}<label>Patch link<input bind:this={linkField} aria-label="Shared patch link" readonly value={link} onfocus={(event)=>event.currentTarget.select()}/></label>{/if}
 <div class="share-actions">
 {#if incoming}<button onclick={()=>{onopen(snapshot());onclose();}}><FolderOpen size={14}/>Open in editor</button>{/if}
 <button onclick={save} disabled={saved}>{#if saved}<Check size={14}/>{:else}<Save size={14}/>{/if}{saved?'Saved locally':'Save to My patches'}</button>
 <button onclick={()=>void copy()} disabled={busy}>{#if copied}<Check size={14}/>{:else if incoming}<Share2 size={14}/>{:else}<Copy size={14}/>{/if}{busy?'Creating…':copied?'Copied':'Copy link'}</button>
 </div>
 <div class="embed-options"><label><input type="checkbox" bind:checked={showCode} onchange={()=>embed=''}/>Code overlay</label><button onclick={()=>void copyEmbed()} disabled={busy}><Copy size={14}/>Copy embed</button></div>
 {#if embed}<label>Embed HTML<textarea aria-label="Embed HTML" readonly value={embed} rows="4" onfocus={event=>event.currentTarget.select()}></textarea></label>{/if}
 <p class="share-message" role="status">{message}</p>
 <small>My patches stays in this browser. Download a .syn file for a separate backup.</small>
</dialog>
<style>
 .share-patch{width:min(480px,calc(100vw - 24px));max-height:calc(100dvh - 32px);overflow:auto;background:#101915;color:#c8d2cd;border:1px solid #334736;border-radius:4px;padding:18px;font:12px/1.6 var(--mono)}
 .share-patch::backdrop{background:#000a}.share-patch header{display:flex;align-items:center;justify-content:space-between;gap:8px}.share-patch h2{font-size:15px;font-weight:400;margin:0 0 12px}
 label{display:block;font-size:10px;color:var(--dim);margin:8px 0}input{display:block;width:100%;background:#0b1410;border:1px solid #334736;padding:8px;color:#d5e4d0;font:11px var(--mono);border-radius:2px}
 .embed-options{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px}.embed-options label{display:flex;align-items:center;gap:7px}.embed-options input{width:auto;margin:0}.embed-options button{display:flex;align-items:center;gap:6px;font-size:11px;padding:7px 9px}textarea{width:100%;background:#0b1410;border:1px solid #334736;color:#d5e4d0;font:10px var(--mono);padding:8px;resize:vertical}
 .share-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.share-actions button{display:flex;align-items:center;gap:6px;font-size:11px;padding:7px 9px}.snapshot-info,small{font-size:10px;color:var(--dim)}.shared-code{max-height:200px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;background:#0b1410;padding:10px;font-size:11px;user-select:text}.share-message{min-height:1.6em;color:var(--lime)}
</style>
