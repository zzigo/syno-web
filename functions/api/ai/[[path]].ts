/** Thin transport to the existing ORF gateway; no agent runtime lives here. */
interface Context { request: Request; params: { path: string[] } }
const paths: Record<string,string> = { 'v1/models':'GET', 'v1/models/installed':'GET', 'v1/chat/completions':'POST' };
function publicText(text:string){return text.replace(/https?:\/\/orf\.zztt\.org(?:\/api)?/gi,'[model gateway]').replace(/\bORF\b/g,'Model gateway');}
function anonymousStream(body:ReadableStream<Uint8Array>){
  const decoder=new TextDecoder(),encoder=new TextEncoder();let buffer='';
  return body.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({
    transform(chunk,controller){buffer+=decoder.decode(chunk,{stream:true});let newline;while((newline=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,newline+1);buffer=buffer.slice(newline+1);controller.enqueue(encoder.encode(publicText(line)));}},
    flush(controller){buffer+=decoder.decode();if(buffer)controller.enqueue(encoder.encode(publicText(buffer)));}
  }));
}
export async function onRequest({request,params}:Context):Promise<Response> {
  const path=(params.path||[]).join('/');
  if(paths[path]!==request.method)return new Response('Not found',{status:404});
  if(Number(request.headers.get('content-length')||0)>100000)return new Response('Request too large',{status:413});
  const headers=new Headers({'Accept':'application/json, text/event-stream','Origin':'https://orf.zztt.org'});
  if(request.method==='POST')headers.set('Content-Type','application/json');
  const authorization=request.headers.get('Authorization');if(authorization)headers.set('Authorization',authorization);
  try {
    const upstream=await fetch(`https://orf.zztt.org/api/${path}`,{method:request.method,headers,body:request.method==='POST'?request.body:undefined,signal:request.signal});
    if(request.method==='GET'&&upstream.ok){
      const data=await upstream.json() as {installed?:Record<string,unknown>[];models?:Record<string,unknown>[]};
      const named=(model:Record<string,unknown>)=>!/(?:https?:\/\/|\b(?:\d{1,3}\.){3}\d{1,3})/i.test(String(model.name??'')+' '+String(model.id??''));
      const pick=(model:Record<string,unknown>)=>Object.fromEntries(['id','name','isCloud','parameterSize','provider','isLocal'].filter(key=>key in model).map(key=>[key,model[key]]));
      return Response.json(path==='v1/models/installed'?{installed:(data.installed||[]).filter(named).map(pick)}:{models:(data.models||[]).filter(named).map(pick)},{headers:{'Cache-Control':'no-store'}});
    }
    const body=upstream.body&&upstream.headers.get('Content-Type')?.includes('text/event-stream')?anonymousStream(upstream.body):publicText(await upstream.text());
    return new Response(body,{status:upstream.status,headers:{'Content-Type':upstream.headers.get('Content-Type')||'application/json','Cache-Control':'no-store, no-transform','X-Content-Type-Options':'nosniff'}});
  }catch{return Response.json({error:'The model gateway is unreachable. No substitute model was used.'},{status:502});}
}
