import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const clientPath=fileURLToPath(new URL('./vendor/orf-client/index.ts',import.meta.url));
export default defineConfig({
  plugins: [
    {
      name:'anonymous-existing-gateway-client',enforce:'pre',
      transform(code,id){
        if(id!==clientPath)return;
        // Reuse the existing SDK's chat/inventory implementation; exclude its other apps.
        const ast=ts.createSourceFile(id,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
        const removals:{from:number;to:number}[]=[];
        for(const statement of ast.statements)if(ts.isClassDeclaration(statement))for(const member of statement.members){
          if(member.name&&['musiki','glip'].includes(member.name.getText(ast)))removals.push({from:member.getFullStart(),to:member.end});
        }
        for(const range of removals.sort((a,b)=>b.from-a.from))code=code.slice(0,range.from)+code.slice(range.to);
        return {code:code.replaceAll('https://orf.zztt.org/api','/api/ai').replace(/\bORF\b/g,'Model gateway'),map:null};
      }
    },
    svelte()
  ],
  resolve:{alias:{
    '@orf/client':clientPath,
    '@orf/core':fileURLToPath(new URL('./vendor/orf-core/index.ts',import.meta.url))
  }},
  server:{fs:{allow:['..']},proxy:{
    '/api/ai':{target:'https://orf.zztt.org',changeOrigin:true,
      rewrite:path=>path.replace(/^\/api\/ai/,'/api'),
      configure:proxy=>proxy.on('proxyReq',request=>request.removeHeader('origin'))}
  }},
  worker:{format:'es'},
  build:{sourcemap:false,rollupOptions:{maxParallelFileOps:16,input:{main:fileURLToPath(new URL('./index.html',import.meta.url)),embed:fileURLToPath(new URL('./embed.html',import.meta.url))}}}
});
