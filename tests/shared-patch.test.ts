import test from 'node:test';import assert from 'node:assert/strict';
import {encodePatch,decodePatch,patchLink,patchFromHash,patchSnapshot,type PatchSnapshot} from '../src/core/shared-patch';
import {saveLocalPatch,readLocalPatches,LOCAL_PATCHES_KEY} from '../src/core/local-patches';
import {compile,eventData} from '../src/core/parser';
const patch:PatchSnapshot={version:1,title:'Raíces · 🌱',source:"# música y crecimiento 🌱\n!b100 !sa\ns[165 220 ~ 330]v0.6e0254'n8\nt165:s41.25i1.2>3'1.2v0.4e0254'1.2",seed:4294967295,loop:false};
const rawToken=(p:unknown)=>'1j.'+Buffer.from(JSON.stringify(p)).toString('base64url');
test('sharing preserves Unicode, exact code, seed, loop and musical data',async()=>{
 const token=await encodePatch(patch),decoded=await decodePatch(token);assert.deepEqual(decoded,patch);assert.deepEqual(eventData(compile(decoded.source,decoded.seed)),eventData(compile(patch.source,patch.seed)));
 assert.deepEqual(await decodePatch(rawToken(patch)),patch);
 const url=new URL(await patchLink('https://notation-review-27.pages.dev/?discard=1#old',patch));assert.equal(url.search,'');assert.ok(url.hash.startsWith('#patch=1'));assert.deepEqual(await patchFromHash(url.hash),patch);assert.equal(await patchFromHash('#other'),undefined);
});
test('a shared link remains an immutable snapshot after later edits',async()=>{
 const original=await patchLink('https://example.test/',patch);const changed=await patchLink('https://example.test/',{...patch,source:patch.source+'\ns440v1'});assert.notEqual(original,changed);assert.deepEqual(await patchFromHash(new URL(original).hash),patch);
});
test('sharing rejects malformed formats, invalid metadata and excessive expansion',async()=>{
 for(const token of ['','2j.abc','1j.!','1g.YWJj',rawToken({source:'s220'}),rawToken({...patch,seed:-1}),rawToken({...patch,loop:'yes'}),rawToken({...patch,source:'x'.repeat(64001)})])await assert.rejects(decodePatch(token));
 const bytes=new TextEncoder().encode('x'.repeat(300001)),gzip=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());await assert.rejects(decodePatch('1g.'+Buffer.from(gzip).toString('base64url')),/size/);
 assert.throws(()=>patchSnapshot({...patch,title:'x'.repeat(201)}));
});
function memory(){const data=new Map<string,string>();return {getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};}
test('named local snapshots survive a new read, deduplicate identical copies and retain versions',()=>{
 const storage=memory(),a=saveLocalPatch(storage,patch);assert.equal(readLocalPatches(storage).length,1);assert.equal(saveLocalPatch(storage,patch).id,a.id);
 const b=saveLocalPatch(storage,{...patch,source:patch.source+'\ns440v1'});assert.notEqual(a.id,b.id);assert.equal(readLocalPatches(storage).length,2);assert.deepEqual(readLocalPatches(storage)[1],a);
});
test('storage failures and corrupt libraries do not erase existing patches or claim a save',()=>{
 const full={getItem:()=>null,setItem:()=>{throw Error('Quota exceeded');}};assert.throws(()=>saveLocalPatch(full,patch),/Quota/);
 const storage=memory();storage.setItem(LOCAL_PATCHES_KEY,'corrupt');assert.throws(()=>saveLocalPatch(storage,patch));assert.equal(storage.getItem(LOCAL_PATCHES_KEY),'corrupt');
});

test('embed HTML keeps the snapshot in the fragment and supports code overlay on/off',async()=>{
 const {patchEmbed,embedOptions}=await import('../src/core/shared-patch');
 for(const code of [true,false]){
  const html=await patchEmbed('https://example.test/?old=1#old',{...patch,title:'<sound "&">'},code);
  assert.ok(html.startsWith('<iframe '));assert.ok(html.includes('title="&lt;sound &quot;&amp;&quot;&gt;"'));
  const src=html.match(/src="([^"]+)"/)![1].replaceAll('&amp;','&'),url=new URL(src);
  assert.deepEqual(embedOptions(src),{enabled:true,code});assert.equal(url.searchParams.has('old'),false);
  assert.equal((await patchFromHash(url.hash))?.source,patch.source);assert.ok(html.includes('allowfullscreen'));
 }
 assert.deepEqual(embedOptions('https://example.test/'),{enabled:false,code:false});
});
