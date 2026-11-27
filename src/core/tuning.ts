/** Explicit periods, strict numeric input, independent of MIDI/12-EDO. 0BSD. */
export interface Tuning {name:string;cents:number[];period:number;frequencies?:number[]}
const ratio=(text:string)=>{if(!/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(text))throw Error('Use positive n/d ratios.');const [n,d]=text.split('/').map(Number);if(!(n>0&&d>0))throw Error('Tuning ratios must be positive.');return 1200*Math.log2(n/d);};
const presets:Record<string,string>={JMA:'1/1 9/8 5/4 4/3 3/2 5/3 15/8 2/1',JMI:'1/1 9/8 6/5 4/3 3/2 8/5 9/5 2/1',PTH:'1/1 9/8 81/64 4/3 3/2 27/16 243/128 2/1',PEN:'1/1 9/8 5/4 3/2 5/3 2/1',DOR:'0 200 300 500 700 900 1000 1200',MAJ:'0 200 400 500 700 900 1100 1200',MIN:'0 200 300 500 700 800 1000 1200',PEL:'0 120 270 540 670 785 950 1200',SLD:'0 240 480 720 960 1200',BPJ:'1/1 27/25 25/21 9/7 7/5 75/49 5/3 9/5 49/25 15/7 7/3 63/25 25/9 3/1',HEX:'1/1 7/6 5/4 35/24 5/3 7/4 2/1',WCA:'1/1 17/16 9/8 19/16 5/4 21/16 11/8 3/2 13/8 5/3 7/4 15/8 2/1'};
export const tuningAliases=Object.keys(presets);
export function parseTuning(text:string):Tuning {
 const key=text.toUpperCase();if(presets[key])return {...parseTuning('['+presets[key]+']'),name:key};
 if(/^\d+$/.test(text)){const n=Number(text);if(n<2||n>512)throw Error('Equal divisions require 2–512 steps.');return {name:n+' EDO',period:1200,cents:Array.from({length:n},(_,i)=>1200*i/n)};}
 const match=text.match(/^\[([^\]]+)\](?::(\d+(?:\.\d+)?\/\d+(?:\.\d+)?))?$/);if(!match)throw Error('Use u12, uJMA or u[0 100 400 ...].');
 const absolute=match[1].trim().match(/^f\s*([\s\S]*)$/);
 if(absolute){
  if(match[2])throw Error('Absolute Hz tables do not take a period; use octave prefixes to change register.');
  const tokens=absolute[1].trim().split(/[\s,]+/);if(tokens.length<1||tokens.length>512||tokens.some(t=>!/^\d+(?:\.\d+)?$/.test(t)))throw Error('Use u[f 178.496293 190.365394 ...] with 1–512 Hz values.');
  const frequencies=tokens.map(Number);if(frequencies.some(f=>!Number.isFinite(f)||f<20||f>20000)||new Set(frequencies).size!==frequencies.length)throw Error('Absolute tuning frequencies must be distinct and between 20 and 20000 Hz.');
  return {name:'absolute Hz',frequencies,cents:frequencies.map(f=>1200*Math.log2(f/frequencies[0])),period:1200};
 }
 const tokens=match[1].trim().split(/\s+/);if(tokens.length>512)throw Error('At most 512 tuning degrees.');const ratios=tokens.some(t=>t.includes('/'));if(ratios&&tokens.some(t=>!t.includes('/')))throw Error('Do not mix cents and ratios.');
 let cents=tokens.map(t=>ratios?ratio(t):/^\d+(?:\.\d+)?$/.test(t)?Number(t):NaN);if(cents.some(v=>!Number.isFinite(v)||v<0))throw Error('Tuning degrees must be finite and non-negative.');
 let period=match[2]?ratio(match[2]):1200;if(!match[2]&&ratios&&tokens.length>1&&['2/1','3/1'].includes(tokens.at(-1)!))period=cents.at(-1)!;
 if(!ratios&&!match[2]&&cents.at(-1)===1200)period=1200;
 if(!(period>0&&period<=9600))throw Error('Tuning period must be positive and at most 9600 cents.');
 cents=cents.filter(c=>Math.abs(c-period)>.000001);if(!cents.includes(0))cents.unshift(0);cents.sort((a,b)=>a-b);
 if(cents.some((c,i)=>c>=period||i>0&&c-cents[i-1]<.000001))throw Error('Tuning degrees must be distinct and smaller than the period.');if(cents.length<2)throw Error('A tuning needs at least two distinct degrees.');return {name:'custom',period,cents};
}
export function degreeHz(degree:number,tuning:Tuning,root:number){if(!Number.isInteger(degree))throw Error('Scale degrees are integers.');if(tuning.frequencies){if(degree<0||degree>=tuning.frequencies.length)throw Error(`Hz-table positions are 1–${tuning.frequencies.length}; use + or - prefixes to change register.`);return tuning.frequencies[degree];}const n=tuning.cents.length,oct=Math.floor(degree/n),index=((degree%n)+n)%n;return root*2**((oct*tuning.period+tuning.cents[index])/1200);}
export function quantizeHz(hz:number,tuning:Tuning,root:number){if(tuning.frequencies)return tuning.frequencies.reduce((best,f)=>Math.abs(Math.log2(hz/f))<Math.abs(Math.log2(hz/best))?f:best); const cents=1200*Math.log2(hz/root),oct=Math.floor(cents/tuning.period);let best=0,distance=Infinity;for(let o=oct-1;o<=oct+1;o++)for(const d of tuning.cents){const c=o*tuning.period+d,delta=Math.abs(c-cents);if(delta<distance){distance=delta;best=c;}}return root*2**(best/1200);}
