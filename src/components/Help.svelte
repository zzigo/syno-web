<script lang="ts">
 import {tick} from 'svelte';
 import {session} from '../state.svelte';
 import {searchHelp,helpSections} from '../core/help-content';
 let query=$state(''),focused=$state('');let root:HTMLDivElement;
 $effect(()=>{const target=session.helpFocus;if(!target)return;query='';focused=target.section;let active=true;void tick().then(()=>{if(!active||!root)return;const section=[...root.querySelectorAll<HTMLElement>('[data-help-section]')].find(node=>node.dataset.helpSection===target.section);section?.focus({preventScroll:true});section?.scrollIntoView({block:'start',inline:'nearest'});});return()=>{active=false;};});
 const sections=$derived(searchHelp(query));
</script>
<div class="pod-body guide" bind:this={root}>
 <div class="help-search"><div class="help-search-row"><input type="search" aria-label="Search language and shortcuts" placeholder="Search commands, examples, shortcuts…" bind:value={query}/>{#if query}<button aria-label="Clear help search" onclick={()=>query=''}>×</button>{/if}</div><span aria-live="polite">{query?`${sections.length} / ${helpSections.length} sections`: 'LANGUAGE / SHORTCUTS'}</span></div>
 {#each sections as section}<section data-help-section={section.title} class:focused={focused===section.title} tabindex="-1" aria-label={section.title}>{@html section.html}</section>{/each}
 {#if !sections.length}<p class="muted">No matches. Try “pan”, “ADSR”, “Alt” or “tuning”.</p>{/if}
</div>

<style>
 .guide>section{scroll-margin-top:90px;border-left:2px solid transparent;padding-left:8px;outline:none}.guide>section.focused{border-left-color:#a5cf92;background:#99ca8d07}
 .guide :global(.scale-table-scroll){max-width:100%;overflow-x:auto;margin:12px 0}
 .guide :global(.scale-table-scroll table){width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:11px}
 .guide :global(.scale-table-scroll th),.guide :global(.scale-table-scroll td){text-align:left;padding:6px 8px;vertical-align:top;border-bottom:1px solid #ffffff10}
 .guide :global(.scale-table-scroll th){color:var(--text-muted,#91a39b);font-weight:400}
</style>
