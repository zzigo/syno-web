import {migrateRandomRanges} from './random-brackets';
/** Portable, data-only patch snapshots. The fragment stays out of HTTP requests. */
export interface PatchSnapshot {version:1;grammar?:2;title:string;source:string;seed:number;loop:boolean}
const MAX_BYTES=300_000,MAX_ENCODED=400_000;
export function patchSnapshot(value:unknown):PatchSnapshot {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid patch snapshot.');
 const p=value as Record<string,unknown>;
 if(p.version!==1||p.grammar!==undefined&&p.grammar!==2||typeof p.source!=='string'||!p.source.trim()||p.source.length>64000||typeof p.title!=='string'||p.title.length>200||typeof p.seed!=='number'||!Number.isInteger(p.seed)||p.seed<0||p.seed>4294967295||typeof p.loop!=='boolean')throw Error('Invalid or unsupported patch snapshot.');
 const source=p.grammar===2?p.source:migrateRandomRanges(p.source);return {version:1,...(p.grammar===2||source!==p.source?{grammar:2 as const}:{}),title:p.title.trim()||'Untitled patch',source,seed:p.seed,loop:p.loop};
}
function base64(bytes:Uint8Array){let text='';for(const byte of bytes)text+=String.fromCharCode(byte);return btoa(text).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
async function bounded(stream:ReadableStream<Uint8Array>){const reader=stream.getReader(),chunks:Uint8Array[]=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES){await reader.cancel();throw Error('Shared patch exceeds the supported size.');}chunks.push(value);}}finally{reader.releaseLock();}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;}
export async function encodePatch(value:PatchSnapshot){
 const snapshot=patchSnapshot(value),bytes=new TextEncoder().encode(JSON.stringify(snapshot));if(bytes.length>MAX_BYTES)throw Error('Patch is too large to share.');
 if(typeof CompressionStream!=='undefined'){const compressed=await bounded(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')));if(compressed.length<bytes.length)return (snapshot.grammar===2?'2g.':'1g.')+base64(compressed);}
 return (snapshot.grammar===2?'2j.':'1j.')+base64(bytes);
}
export async function decodePatch(token:string):Promise<PatchSnapshot>{
 if(token.length>MAX_ENCODED||! /^[12][gj]\.[A-Za-z0-9_-]+$/.test(token))throw Error('Invalid or unsupported patch link.');
 try{const text=atob(token.slice(3).replaceAll('-','+').replaceAll('_','/')),bytes=Uint8Array.from(text,c=>c.charCodeAt(0));
 const decoded=token[1]==='g'?await bounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))):bytes;
 if(decoded.length>MAX_BYTES)throw Error('Patch is too large.');return patchSnapshot(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decoded)));
 }catch(error){throw Error('Cannot read shared patch: '+(error instanceof Error?error.message:String(error)));}
}
export async function patchLink(base:string,patch:PatchSnapshot){const url=new URL(base);url.search='';url.hash='patch='+await encodePatch(patch);return url.href;}
export async function patchFromHash(hash:string){if(!hash.startsWith('#patch='))return undefined;return decodePatch(hash.slice(7));}

export function embedOptions(base:string){const query=new URL(base).searchParams;return {enabled:/^\/embed(?:\.html)?$/.test(new URL(base).pathname)||query.get('embed')==='1',code:query.get('code')==='1'};}
export async function patchEmbed(base:string,patch:PatchSnapshot,showCode=true){
 const url=new URL(await patchLink(base,patch));url.pathname='/embed.html';url.searchParams.set('embed','1');url.searchParams.set('code',showCode?'1':'0');
 const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 return `<iframe src="${escape(url.href)}" title="${escape(patch.title)}" width="100%" height="560" allow="autoplay; fullscreen" allowfullscreen style="border:0"></iframe>`;
}
