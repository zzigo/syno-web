import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/ai/[[path]]';
test('ORF transport only exposes the three existing gateway routes',async()=>{
  const r=await onRequest({request:new Request('https://lab.example/api/orf/v1/secrets'),params:{path:['v1','secrets']}});assert.equal(r.status,404);
  const wrong=await onRequest({request:new Request('https://lab.example/api/orf/v1/models',{method:'POST'}),params:{path:['v1','models']}});assert.equal(wrong.status,404);
});
test('ORF transport forwards to the configured gateway without browser-origin or unrelated headers',async()=>{
  const original=globalThis.fetch;let forwarded='';let captured:RequestInit|undefined;
  globalThis.fetch=async(input,init)=>{forwarded=String(input);captured=init;return new Response('{"models":[]}',{headers:{'Content-Type':'application/json'}});};
  try{
    const response=await onRequest({request:new Request('https://lab.example/api/orf/v1/models',{headers:{Origin:'https://lab.example','X-Not-Orf':'private'}}),params:{path:['v1','models']}});
    assert.equal(forwarded,'https://orf.zztt.org/api/v1/models');assert.equal(new Headers(captured?.headers).get('Origin'),'https://orf.zztt.org');assert.equal(new Headers(captured?.headers).get('X-Not-Orf'),null);assert.equal(response.status,200);
  }finally{globalThis.fetch=original;}
});
test('unreachable ORF returns an explicit failure without a model fallback',async()=>{
  const original=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('offline');};
  try{const r=await onRequest({request:new Request('https://lab.example/api/orf/v1/models'),params:{path:['v1','models']}});assert.equal(r.status,502);assert.match(await r.text(),/No substitute model/);}finally{globalThis.fetch=original;}
});
test('public event stream removes gateway branding and origin across split chunks',async()=>{
  const original=globalThis.fetch;
  const encoder=new TextEncoder();
  globalThis.fetch=async()=>new Response(new ReadableStream({start(controller){for(const part of [': O','RF stream connected\n\ndata: {"delta":"hello","event":{"message":"ORF ready at https://orf.zztt.org/api"}}\n\ndata: [DONE]\n\n'])controller.enqueue(encoder.encode(part));controller.close();}}),{headers:{'Content-Type':'text/event-stream'}});
  try{
    const res=await onRequest({request:new Request('https://lab.example/api/ai/v1/chat/completions',{method:'POST',body:'{}'}),params:{path:['v1','chat','completions']}});
    const body=await res.text();assert.doesNotMatch(body,/\bORF\b|zztt\.org/);assert.match(body,/"delta":"hello"/);assert.match(body,/data: \[DONE\]/);
  }finally{globalThis.fetch=original;}
});
