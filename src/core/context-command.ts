import {lyricRanges} from './lyrics';
import type{CompiledScore}from'./types';
export interface ContextCommand{from:number;to:number;token:string;name:string;section:string}
const names:Record<string,[string,string]>={
 s:['Sine oscillator','Sound atoms'],t:['Triangle oscillator','Sound atoms'],a:['Sawtooth oscillator','Sound atoms'],q:['Square oscillator','Sound atoms'],n:['Noise generator','Sound atoms'],'?':['Mutable timbre / pitch','Mutable timbre · ?'],
 w:['Voice / vocoder blend','Lyrics · l[text] · voice and vocoder'],v:['Intensity contour','Intensity contours'],p:['Stereo panning','Continuous controls'],e:['Attack–decay–sustain–release','Envelope · e0153'],f:['Low-pass filter','Filter, chopper, reverb'],r:['Reverberation','Filter, chopper, reverb'],h:['Chopper','Chopper · visual gate'],d:['Delay','Common delay · d3'],i:['FM modulation index','FM'],o:['Frequency','Continuous controls'],g:['Feedback return gain','Feedback · closed circuit'],x:['Stereo cross-feedback','Two-band feedback'],b:['Band-pass frequencies','Two-band feedback'],k:['Saturation drive','Two-band feedback'],
 G:['Phyllotaxis growth','Growth shorthand · G A S H R K · N U D'],A:['Apomixis growth','Growth shorthand · G A S H R K · N U D'],S:['Stolon growth','Growth shorthand · G A S H R K · N U D'],H:['Apical dominance','Growth shorthand · G A S H R K · N U D'],R:['Tropism growth','Growth shorthand · G A S H R K · N U D'],K:['Space colonisation','Growth shorthand · G A S H R K · N U D'],N:['Growth generations','Control tables · growth N U D · compact digits'],U:['Growth mutation','Control tables · growth N U D · compact digits'],D:['Growth spread','Control tables · growth N U D · compact digits'],L:['Lindenmayer rewriting','L-system · rewriting']
};
/** A lexical command survives incomplete drafts; targets are exact trusted Help section titles. */
export function contextCommandAt(source:string,cursor:number,score?:CompiledScore):ContextCommand|undefined{
 cursor=Math.max(0,Math.min(source.length,cursor));
 const literals=lyricRanges(source);const literal=literals.find(r=>cursor>=r.from&&cursor<r.to);if(literal)return {...literal,token:source.slice(literal.from,literal.to),name:source[literal.from]==='!'?'Piece title':'Lyrics / voice',section:source[literal.from]==='!'?'Piece title · named sections · transport':'Lyrics · l[text] · voice and vocoder'};
 const lineFrom=source.lastIndexOf('\n',Math.max(0,cursor-1))+1,lineTo=source.indexOf('\n',cursor),line=source.slice(lineFrom,lineTo<0?undefined:lineTo),comment=[...line.matchAll(/#/g)].find(m=>!literals.some(r=>lineFrom+m.index!>=r.from&&lineFrom+m.index!<r.to))?.index??-1;
 if(comment>=0&&cursor>=lineFrom+comment)return;
 const end=comment<0?lineFrom+line.length:lineFrom+comment;
 const make=(from:number,to:number,name:string,section:string):ContextCommand=>({from,to,token:source.slice(from,to),name,section});
 const hit=(from:number,to:number)=>cursor>=from&&(cursor<to||cursor===to&&(cursor===end||/\s/.test(source[cursor]??'')));
 const bracket=(at:number)=>{let depth=0;do{const c=source[at++];if(c==='[')depth++;if(c===']')depth--;}while(at<end&&depth>0);return at;};
 const valueEnd=(at:number)=>{while(at<end){if(source[at]==='['){at=bracket(at);continue;}if(/[?\d.<>^+\-/,*]/.test(source[at])){at++;continue;}break;}return at;};
 for(let at=lineFrom;at<end;){
  if(/\s/.test(source[at])){at++;continue;}const from=at,c=source[at],rest=source.slice(at,end);let name='',section='';
  const message=rest.match(/^!(?:f(?:[nb])?[\d./]+:\d+\s+[a-z_]+\s+-?\d+|[a-z]+(?:-?[\d.]+)?)/);
  const preset=rest.match(/^!?spk(?:\d+(?:\.\d+){0,2}|[A-Z]{3})(?=\s|$|[)}])/);
  if(preset){at+=preset[0].length;name='Speaker preset';section='Speaker presets · spk8 · spk5.1 · spk7.1.4';}
  else if(message){at+=message[0].length;const command=message[0].match(/^![a-z]+/)![0];
   if(command==='!spk'||command==='!speakers'||command==='!room'||command==='!r'){while(/\s/.test(source[at]??''))at++;if(source[at]==='[')at=bracket(at);}
   [name,section]=command==='!spk'||command==='!speakers'||command==='!room'||command==='!r'?['Speaker layout / spatial view','Spatial output · raw speakers · !spk · !vs']:command==='!b'?['Tempo · beats per minute','Sequences · one clock, three behaviors']:command==='!f'?['Future phrase rotation','Future · a named phrase shifts over time']:command==='!i'?['Input channel trim','Input · i, channel trim, mic and effects']:(command.startsWith('!v')||command==='!st'||command==='!stocky')?['Visual mode','Visual messages']:[{'!sc':'Continuous sequence','!sa':'Articulated sequence','!sx':'Spatial sequence'}[command]??'Message','Sequences · one clock, three behaviors'];
  }else if(c==='@'){
   const map=rest.match(/^@[pofvrhdig_]{3}(?:\/(?:born|dfs|bfs|nnb))?/);
   if(map){at+=map[0].length;name='XYZ parameter routing';section='Compact growth · XYZ routing';}
   else {const binding=rest.match(/^@[A-Z]+=[a-z_]+[\d.,-]*/);at+=binding?.[0].length??1;name='L-system symbol binding';section='L-system · rewriting';}
  }else if(c==='l'&&/^l_?\[/.test(source.slice(at))){at=bracket(at+(source[at+1]==='_'?2:1));name='Lyrics / voice';section='Lyrics · l[text] · voice and vocoder';
  }else if(c==='u'&&/^u(?:[A-Z]|\d|\[)/.test(rest)){
   at++;at=source[at]==='['?bracket(at):at+(source.slice(at,end).match(/^(?:[A-Z]{3}|\d+)/)?.[0].length??0);if(source[at]===':')at=valueEnd(at+1);name='Tuning / intonation';section='Tuning · cents, ratios, periods';
  }else if(c==="'"){
   at++;if(/[nb]/.test(source[at]??''))at++;at=valueEnd(at);while(/[nb]/.test(source[at]??'')&&/[<>]/.test(source[at-1]??''))at=valueEnd(at+1);name='Duration / musical figure';section='Time · duration, onset and pulse';
  }else if(c===';'){
   at++;const label=source.slice(at).match(/^(?:<[^>]*>|[A-Za-z_][A-Za-z_0-9-]*)/);if(label&&!/^[nb]\d/.test(label[0]))at+=label[0].length;else{if(/[nb]/.test(source[at]??''))at++;at=valueEnd(at);}name='Relative section / wait';section='Sections · ; · relative waits and repeated groups';
  }else if(/[GASHRKNUDL]/.test(c)){
   at=valueEnd(at+1);[name,section]=names[c];if(c==='p'&&/^p\[(?:o|x|\d{3})/.test(source.slice(from,at))){name=source[from+2]==='o'?'Discrete speaker output':'Spatial XYZ trajectory';section='Spatial output · raw speakers · !spk · !vs';}if(source[at]==='&'){at++;name+=' · agent';section='Autocode · local suffix G and agentic &G';}
  }else if(/[a-z_]/.test(c)&&/^[a-z_]{2,}/.test(rest)){
   at+=rest.match(/^[a-z_]{2,}/)![0].length;name='Named expression';section='Groups · finite repetition and names';
  }else if(names[c]){
   at=valueEnd(at+1);[name,section]=names[c];if(c==='p'&&/^p\[(?:o|x|\d{3})/.test(source.slice(from,at))){name=source[from+2]==='o'?'Discrete speaker output':'Spatial XYZ trajectory';section='Spatial output · raw speakers · !spk · !vs';}
   const previous=source.slice(lineFrom,from).trimEnd().at(-1),input=c==='i'&&(!previous||/[=(;{]/.test(previous)||/\s/.test(source[from-1]??''));
   if(input){name='Audio input channel';section='Input · i, channel trim, mic and effects';}
   const circuit=score?.feedback.some(f=>from>=f.from&&from<f.to)&&source.lastIndexOf('}',from)>source.lastIndexOf('{',from);
   if(c==='q'&&circuit){name='Band-pass reciprocal bandwidth';section='Two-band feedback';}
  }else if(/[\d.]/.test(c)){
   at=valueEnd(at);if(at===from)at++;name='Onset / time offset';section='Time · duration, onset and pulse';
  }else{
   at++;if(c===')')at+=source.slice(at,end).match(/^\d+/)?.[0].length??0;
   const punctuation:Record<string,[string,string]>={':':['Frequency modulation','FM'],'>':['Linear interpolation','Interpolation'],'<':['Reverse interpolation','Interpolation'],'^':['Exponential frequency glide','Interpolation'],'(':['Group / finite repetition','Groups · finite repetition and names'],')':['Group / finite repetition','Groups · finite repetition and names'],'{':['Audio bus / explicit feedback','Audio buses · {} · ordered chains'],'}':['Audio bus / explicit feedback','Audio buses · {} · ordered chains'],'*':['Open parameter','Open parameters'],'=':['Expression definition','Open parameters'],'&':['Agentic mutation','Autocode · local suffix G and agentic &G'],'~':['Rest cell','Sequences · one clock, three behaviors']};
   if(punctuation[c])[name,section]=punctuation[c];
  }
  if(name&&hit(from,at)){
   const system=score?.lSystems.find(s=>from>=s.from&&from<s.to);if(system&&/[A-Z]/.test(c)&&c!=='L')return make(from,at,'L-system production','L-system · rewriting');
   const char=source[cursor];if(['>','<','^'].includes(char))return make(cursor,cursor+1,char==='^'?'Exponential frequency glide':'Linear interpolation','Interpolation');
   if(char==='~')return make(cursor,cursor+1,'Rest cell','Sequences · one clock, three behaviors');
   return make(from,at,name,section);
  }
 }
}
