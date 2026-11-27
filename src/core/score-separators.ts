import {lyricRanges} from './lyrics';
/** A backslash separates parallel statements. Preserve offsets and literal/comment text. */
export function normalizeScoreSeparators(source:string){
 const literals=lyricRanges(source);let result='';
 for(let i=0;i<source.length;){const literal=literals.find(r=>r.from===i);if(literal){result+=source.slice(i,literal.to);i=literal.to;continue;}
  if(source[i]==='#'){const end=source.indexOf('\n',i),to=end<0?source.length:end;result+=source.slice(i,to);i=to;continue;}
  result+=source[i]==='\\'?'\n':source[i];i++;
 }
 return result;
}
