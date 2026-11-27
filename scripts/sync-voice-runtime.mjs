import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
await mkdir('public/voice-runtime',{recursive:true});
for(const file of ['ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm'])await copyFile('node_modules/onnxruntime-web/dist/'+file,'public/voice-runtime/'+file);
for(const [name,path] of [['kokoro','node_modules/kokoro-js/LICENSE'],['transformers','node_modules/@huggingface/transformers/LICENSE'],['phonemizer','node_modules/phonemizer/LICENSE']])await writeFile(`public/voice-runtime/${name}-LICENSE.txt`,await readFile(path));
const runtime=await readFile('node_modules/onnxruntime-web/dist/ort.all.min.js','utf8');
const notices=(runtime.match(/\/\*[\s\S]*?\*\//g)||[]).filter(text=>/Copyright|license/i.test(text));
await writeFile('public/voice-runtime/onnxruntime-NOTICES.txt',notices.join('\n\n'));
