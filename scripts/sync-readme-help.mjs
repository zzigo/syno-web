import {readFile,writeFile} from 'node:fs/promises';
const source=await readFile('src/core/help-content.ts','utf8');
const end=source.search(/;\s*export function/),sections=JSON.parse(source.slice(source.indexOf('=')+1,end));
const appendix=sections.map(section=>`<details>\n<summary>${section.title}</summary>\n\n${section.html}\n\n</details>`).join('\n\n');
const readme=await readFile('README.md','utf8');
if(!readme.includes('<!-- SYNO_HELP_START -->')||!readme.includes('<!-- SYNO_HELP_END -->'))throw Error('README help markers are missing.');
await writeFile('README.md',readme.replace(/<!-- SYNO_HELP_START -->[\s\S]*?<!-- SYNO_HELP_END -->/,`<!-- SYNO_HELP_START -->\n${appendix}\n<!-- SYNO_HELP_END -->`));
