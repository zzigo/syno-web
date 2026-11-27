import type {NoteEvent} from './types';
/** Lyric payloads and piece titles are literal text, never numeric notation or comments. */
export function lyricRanges(source:string){
 const ranges:{from:number;to:number;text:string}[]=[];
 for(let at=0;at<source.length;at++){
  if(source[at]==='#'){const end=source.indexOf('\n',at);at=end<0?source.length:end;continue;}
  const prefix=source.slice(at).match(/^(?:l_?|!t(?:itle)?)\[/)?.[0];
  if(prefix&&!/[a-z_]/.test(source[at-1]??'')){
   const start=at+prefix.length,end=source.indexOf(']',start);ranges.push({from:at,to:end<0?source.length:end+1,text:source.slice(start,end<0?undefined:end)});at=end<0?source.length:end;
  }
 }
 return ranges;
}
export function lyricDuration(text:string){return Math.max(1,Math.min(60,text.trim().split(/\s+/u).length*.4+.4));}
export function stripScoreComments(source:string){
 const ranges=lyricRanges(source);let text='',at=0;
 for(const range of ranges){text+=source.slice(at,range.from).replace(/#[^\n]*/g,'')+source.slice(range.from,range.to);at=range.to;}
 return text+source.slice(at).replace(/#[^\n]*/g,'');
}

/** Gate-clock synchronization, not inferred word/phoneme alignment. Chopper gaps retain the verse. */
export function lyricCaption(events:NoteEvent[],time:number){
 const active=events.filter(e=>e.lyrics?.captions&&time>=e.t&&time<e.t+e.dur).sort((a,b)=>b.t-a.t||a.id-b.id);
 return [...new Set(active.map(e=>e.lyrics!.text.trim()))].slice(0,2).join('\n');
}
