/** One-time source migration of repository-owned examples to explicit interval colons. */
import{readFileSync,writeFileSync,readdirSync,existsSync}from'node:fs';import{join}from'node:path';import{migrateRandomRanges}from'../src/core/random-brackets';
if(existsSync('docs/random-brackets-v2-migrated.json'))throw Error('Repository migration was already applied; do not rewrite new exact-choice syntax.');
function walk(dir:string){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.syn')){const before=readFileSync(p,'utf8'),after=migrateRandomRanges(before);if(after!==before)writeFileSync(p,after);}}}walk('library');
// Existing tests and instructional strings describe the old range contract; preserve their intent.
const number='-?(?:\\d+(?:\\.\\d*)?|\\.\\d+)',pair=new RegExp('\\?\\[\\s*('+number+')(?:\\s*,\\s*|\\s+)('+number+')\\s*\\]','g');
for(const path of ['src/core/help-content.ts','src/integrations/orf.ts','src/components/Editor.svelte',...readdirSync('tests').filter(f=>f.endsWith('.test.ts')&&!['absolute-tuning.test.ts','function-references.test.ts','hajdu-realization.test.ts'].includes(f)).map(f=>'tests/'+f)]){const before=readFileSync(path,'utf8');writeFileSync(path,before.replace(pair,'?[$1:$2]'));}

writeFileSync('docs/random-brackets-v2-migrated.json',JSON.stringify({grammar:2,applied:true},null,2)+'\n');
