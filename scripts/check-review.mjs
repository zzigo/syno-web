import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
const forbidden=/zztt\.org|zzigo|azzigotti|luciano|\/Users\/zztt|\bORF\b|\/api\/orf/ig;
const issues=[];
async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await scan(file);else if(/\.(js|css|html|json|map|syn|txt)$/.test(file)){const body=await readFile(file,'utf8');const found=[...body.matchAll(forbidden)].map(m=>m[0]);if(found.length)issues.push({file,found:[...new Set(found)]});}}}
await scan('dist');
if(issues.length){console.error('Review build contains identifying strings:',issues);process.exit(1);}
console.log('Review assets: no known author identifiers, personal domains, gateway branding or source maps.');
