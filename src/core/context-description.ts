import {lyricRanges} from './lyrics';
import {cursorEvent} from './envelope';
import type {CompiledScore} from './types';
export function describeAt(source:string,cursor:number,score:CompiledScore){
 const lyric=lyricRanges(source).find(r=>cursor>=r.from&&cursor<r.to);if(lyric)return `${source[lyric.from]==='!'?'Piece title':'Lyrics'} · ${lyric.text}`;
 const from=source.lastIndexOf('\n',Math.max(0,cursor-1))+1,to=source.indexOf('\n',cursor),line=source.slice(from,to<0?undefined:to);
 if(line.trimStart().startsWith('#')||line.indexOf('#')>=0&&cursor-from>=line.indexOf('#'))return '';
 const tokens=[...line.matchAll(/!f[\d.]+:\d+\s+[a-z_]+\s+-?\d+|!s[cax]|!b[\d.]+|u(?:\[[^\]]*\](?::[\d./]+)?|[A-Z]{3}|\d+)|@[povfhdi_]{3}(?:\/[a-z]+)?|[GASHRK]\d{3}|[NUD][\d.]+|'(?:[nb])?[\d./]+|[vpefrhdiogw](?:\[[^\]]*\]|[?\d.<>^\-]+)|[staqn?](?:\[[^\]]*\]|[?\d.<>^\-]+)/g)];
 const token=tokens.filter(t=>t.index!<=cursor-from).at(-1)?.[0],event=cursorEvent(score,source,cursor);
 if(!token)return event?`${event.wave} · ${event.freq.start.toFixed(1)} Hz · ${event.dur.toFixed(2)} s`:'';
 if(token==='!sc')return 'Continuous · one living voice, changing parameters';
 if(token==='!sa')return 'Articulated · a new envelope for each step';
 if(token==='!sx')return 'Spatial · extra spaces become silent steps';
 const future=token.match(/^!f([\d.]+):(\d+)\s+(\w+)\s+(-?\d+)/);
 if(future)return `Future · ${future[3]} shifts ${future[4]} · every ${future[1]} s × ${future[2]}`;
 if(token.startsWith('p[o'))return 'Discrete output gains · raw channels, no DBAP';
 if(/^p\[(?:x|\d{3})/.test(token))return 'Spatial XYZ trajectory · DBAP';
 if(token.startsWith('!b'))return `Tempo · ${token.slice(2)} beats per minute`;
 if(token.startsWith('u'))return `Tuning · ${token.slice(1)}`;
 if(token.startsWith('@'))return `XYZ routing · ${token.slice(1)}`;
 if(/^[GASHRK]/.test(token))return `Growth · ${token[0]} · N/U/D ${token.slice(1)}`;
 if(token.startsWith("'"))return `Time · ${token.slice(1)}${event?` · phrase ${event.dur.toFixed(2)} s`:''}`;
 if(event?.inputChannel&&token.startsWith('i'))return `Input · channel ${event.inputChannel}`;
 const names:Record<string,string>={w:'Voice / vocoder blend',s:'Sine',t:'Triangle',a:'Sawtooth',q:'Square',n:'Noise',v:'Intensity',p:'Pan',e:'ADSR',f:'Filter',r:'Reverb',h:'Chopper',d:'Delay',i:'FM index',o:'Frequency',g:'Return gain',N:'Generations',U:'Mutation',D:'Spread','?':'Mutable timbre / pitch'};
 return `${names[token[0]]??'Sound'} · ${token.slice(1)||'random'}${event?` · ${event.dur.toFixed(2)} s`:''}`;
}
