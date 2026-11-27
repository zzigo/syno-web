import {lyricRanges} from './lyrics';
/** Lexical number roles for notation colour and editable mutation targets. 0BSD. */
export interface NumberRole {from:number;to:number;kind:'pitch'|'frequency'|'value';text:string}
export function numberRoles(source:string):NumberRole[]{
 const literals=lyricRanges(source);
 const result:NumberRole[]=[],stack:('pitch'|'frequency'|'value')[]=[];let role:'frequency'|'value'='value',time=false;
 for(let i=0;i<source.length;){const literal=literals.find(r=>i>=r.from&&i<r.to);if(literal){i=literal.to;continue;}const c=source[i];if(c==='#'){const end=source.indexOf('\n',i);i=end<0?source.length:end;continue;}
  if(c===';'){const label=source.slice(i+1).match(/^(?:<[^>]*>|(?![bn]\d)[A-Za-z_][A-Za-z_0-9-]*)/);if(label){i+=label[0].length+1;continue;}role='value';time=true;i++;continue;}
  if(c==='?'&&!stack.length&&/(?:^|[\s(=])(?:\d+(?:\.\d*)?)?$/.test(source.slice(0,i))){role='frequency';time=false;}
  if(c==='['){const next=source.slice(i+1).match(/^\s*n(?=[\s\d+*-])/),absolute=source[i-1]==='u'&&/^f/.test(source.slice(i+1));stack.push(absolute?'frequency':next?'pitch':stack.at(-1)??role);i++;continue;}
  if(c===']'){stack.pop();i++;continue;}
  if(c==="'"){role='value';time=true;i++;continue;}
  if(c==='*'){const reference=source.slice(i+1).match(/^\d+/);i+=1+(reference?.[0].length??0);continue;}
  const number=source.slice(i).match(/^(?:[+]+|[-]+)?(?:\d+(?:\.\d*)?|\.\d+)/);
  if(number){result.push({from:i,to:i+number[0].length,kind:stack.at(-1)??role,text:number[0]});i+=number[0].length;continue;}
  if(stack.at(-1)==='pitch'&&c==='n'){i++;continue;}
  const name=source.slice(i).match(/^[a-z_]{2,}/);if(name){i+=name[0].length;role='value';time=false;continue;}
  if('staqo'.includes(c)&&/[\d?[*.]/.test(source[i+1]??'')){role='frequency';time=false;}
  else if(/[vpefrhdigwNUD]/.test(c)){role='value';time=false;}
  else if(c==='n'&&!time)role='value';
  else if(/\s/.test(c)&&!stack.length){role='value';time=false;}
  i++;
 }
 return result;
}
