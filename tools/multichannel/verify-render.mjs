// SPDX-License-Identifier: 0BSD
// Local browser verification with the production CSP; never shipped in the public build.
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),dir=fileURLToPath(new URL('./',import.meta.url));
const html=await readFile(new URL('render-browser-test.html',import.meta.url),'utf8');
let code=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replaceAll("from '/src/","from '../../src/");
code=code.replace("const result=document.querySelector", "const writes=[];\nconst result=document.querySelector");
code=code.replace("const link=(blob,name)=>{", "const link=(blob,name)=>{writes.push(fetch('/artifact/'+name,{method:'POST',body:blob}).then(r=>{if(!r.ok)throw Error('Artifact save failed');}));");
code=code.replace('result.textContent=JSON.stringify({pass:true,...report},null,2);', "await Promise.all(writes);result.textContent=JSON.stringify({pass:true,...report},null,2);await fetch('/result',{method:'POST',body:result.textContent});");
const bundle=await build({stdin:{contents:code,resolveDir:dir,loader:'ts'},bundle:true,format:'esm',platform:'browser',write:false});
const csp=(await readFile(new URL('public/_headers',root),'utf8')).match(/Content-Security-Policy: (.+)/)[1];
const files=new Set(['spatial-raw-4ch.wav','spatial-monitor.ogg','spatial-monitor.mp3','room-7.1.4.wav']);
const server=createServer(async(req,res)=>{try{
 if(req.headers.host!=='127.0.0.1:5202'){res.writeHead(403).end();return;}
 if(req.method==='POST'){
  if(req.headers.origin!=='http://127.0.0.1:5202'){res.writeHead(403).end();return;}
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>6*1024*1024){res.writeHead(413).end();return;}chunks.push(chunk);}
  const data=Buffer.concat(chunks),name=req.url.startsWith('/artifact/')?req.url.slice(10):'';
  if(req.url==='/result'){JSON.parse(data.toString());await writeFile(new URL('output/spatial-browser-verification.json',root),data);}
  else if(files.has(name))await writeFile(new URL('output/'+name,root),data);else{res.writeHead(404).end();return;}
  res.writeHead(200).end('ok');return;
 }
 res.setHeader('Content-Security-Policy',csp);res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end(html.replace(/<script type="module">[\s\S]*?<\/script>/,'<script type="module" src="/test.js"></script>'));}
 else if(req.url==='/test.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].contents);}
 else if(['/audio-codecs/encode-worker.js','/audio-codecs/libvorbis.js','/audio-codecs/lamejs.js'].includes(req.url)){res.setHeader('Content-Type','text/javascript');res.end(await readFile(new URL('public'+req.url,root)));}
 else res.writeHead(404).end();
 }catch(error){res.writeHead(500).end(String(error));}});
server.listen(5202,'127.0.0.1',()=>console.log('Production-CSP render check: http://127.0.0.1:5202'));
