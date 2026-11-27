import {alignApomicticMotif} from './apomixis';
import {speakerPreset} from './speaker-presets';
import {validateSpeakers,type Speaker,type SpatialPan} from './spatial';
import {randomBracket,type RandomSpec} from './random-brackets';
import {lyricDuration,stripScoreComments} from './lyrics';
import {parseTuning,degreeHz,quantizeHz,type Tuning} from './tuning';
import {sequenceLeaves,stepped,compactGrowth,traverseNodes,type Sequence,type Cell,type SequenceMode} from './sequences';
import {turtleGeometry} from './lsystem-turtle';
import {durationForCycle,frequencyForCycle,panForCycle,frequencyRampForCycle,timbreForCycle} from './timbre';
import {echoTail,reverbSeconds,MIN_DELAY_SECONDS,MAX_DELAY_SECONDS} from '../audio/effects';
import {intensityContour,MAX_TIME_SECONDS} from './curves';
import {deriveLSystem,type RewriteRule} from './lsystem';
import type { VisualMode } from './visualization';
import { createGenerator } from '../vendor/fold-generators.js';
import type { CompiledScore, Diagnostic, BusEffect, FeedbackCircuit, NoteEvent, Ramp, Range, Wave } from './types';

type Argument=number|{parameter:number};
type Value=Argument|{choices:number[]};
interface Setting {followGate?:boolean;random?:([number,number]|undefined)[]; value: Value; end?: Value; duration?: number; exponential?:boolean; contour?:{values:Value[];times:(number|undefined)[]};sequence?:Sequence }
interface SpatialSetting {mode:'xyz'|'outputs';values:Setting[];route?:number[]}
type Ast = Range & (
  | {kind:'rest';nodes:Ast[];chance:number}
  | {kind:'speakerPreset';key:string}
  | {kind:'room';room:import('./spatial').Room}
  | {kind:'speakers';speakers:Speaker[];compact?:boolean}
  | {kind:'section';wait:number;name?:string}
  | {kind:'title';text:string}
  | { kind: 'sound'; spatial?:SpatialSetting; lyrics?:NoteEvent['lyrics'];wet?:Setting;durationValue?:Argument;durationChoices?:number[]; wave: Wave;waveOptions?:Wave[];freqRange?:[number,number];freqEndRange?:[number,number];freqRandomSweep?:boolean;freqSweepFollowsGate?:boolean;durationRange?:[number,number];durationEnd?:number;gateExplicit?:boolean; freq: Setting; modulation?: Setting; modulatorWave?: Exclude<Wave,'n'|'i'>; index: Setting; volume: Setting; pan: Setting;panRandom?:import('./types').PanRandom; panExplicit:boolean; duration: number; envelope: string; reverb: Setting;delay?:Setting; filter?: Setting; chop?: Setting; offset: number }
  | { kind:'lsystem'; iterations:number; axiom?:string; angle?:number;taper?:number; headerTo:number; rules:(RewriteRule&Range)[]; bindings:({symbol:string;name:string;args:number[]}&Range)[] }
  | {kind:'config';bpm?:number;mode?:SequenceMode;tuning?:Tuning;root?:Argument;map?:string;walk?:string;input?:{channel:number;gain:number};future?:{name:string;every:number;count:number;shift:number}}
  | { kind: 'view'; mode: VisualMode }
  | { kind: 'loop'; nodes: Ast[]; count: number; scoped?:boolean;period?:number;mutation?:import('./mutation').MutationRegion }
  | {kind:'bus';nodes:Ast[];effects:(BusEffect&{setting?:Setting;spatialSetting?:SpatialSetting})[];volume?:Setting;duration?:number}
  | {kind:'feedback';nodes:Ast[];delay:Setting;delayRight?:Setting;gain:Setting;gainRight?:Setting;filter:Setting;volume:Setting;cross:number;crossSetting?:Setting;band?:[Setting,Setting];rq?:[Setting,Setting];drive?:Setting;filterExplicit?:boolean;duration?:number}
  | { kind: 'definition'; name: string; nodes: Ast[]; parameters: number }
  | { kind: 'call'; name: string; args: number[];offset?:number }
  | { kind: 'control'; operator: string; value?: number }
);
class SyntaxIssue extends Error { constructor(public from: number, public to: number, message: string) { super(message); } }
class Reader {
  p = 0; parameter = 0;tempo=120;
  constructor(private text: string) {}
  error(message: string): never { throw new SyntaxIssue(this.p, Math.min(this.text.length, this.p + 1), message); }
  peek() { return this.text[this.p] || ''; }
  spaces() {
    while (this.p < this.text.length) {
      if (/\s/.test(this.peek())) this.p++;
      else if (this.peek() === '#') { while (this.p < this.text.length && this.peek() !== '\n') this.p++; }
      else break;
    }
  }
  number(required = true): number | undefined {
    const m = this.text.slice(this.p).match(/^-?(?:\d+(?:\.\d*)?|\.\d+)/);
    if (!m) { if (required) this.error('Expected a number.'); return undefined; }
    this.p += m[0].length;
    const n = Number(m[0]); if (!Number.isFinite(n)) this.error('Number must be finite.');
    return n;
  }
  parameterValue():{parameter:number} {
    this.p++;const reference=this.number(false);
    if(reference!==undefined){if(!Number.isInteger(reference)||reference<1||reference>this.parameter)this.error('Parameter references *1, *2 ... must refer to an already opened argument.');return {parameter:reference-1};}
    return {parameter:this.parameter++};
  }
  randomSpec(defaults:[number,number],legal:[number,number]=defaults):RandomSpec {
    this.p++;if(this.peek()!=='[')return {range:defaults};this.p++;const end=this.text.indexOf(']',this.p);if(end<0)this.error('Close the random bracket with ].');const body=this.text.slice(this.p,end);this.p=end+1;
    try{return randomBracket(body,defaults,legal);}catch(error){this.error(error instanceof Error?error.message:String(error));}
  }
  time(){
    const unit=this.peek();if(unit==='b'||unit==='n')this.p++;
    let value=this.number()!;if(this.peek()==='/'){this.p++;const denominator=this.number()!;if(!(denominator>0))this.error('Time denominator must be positive.');value/=denominator;}
    if(unit==='b')value*=60/this.tempo;else if(unit==='n'){if(!(value>0))this.error('Note value must be positive.');value=4/value*60/this.tempo;}
    if(!(value>=0&&value<=MAX_TIME_SECONDS))this.error('Time must fit within 86400 seconds.');return value;
  }
  sequence(depth=0,pitchMode=false,legacy=false):Sequence{
    if(depth>16)this.error('Sequence nesting is limited to 16 levels.');this.p++;
    const remainder=this.text.slice(this.p),first=remainder.match(/^\s*n/);
    if(first){let nesting=1,end=this.p;for(;end<this.text.length;end++){if(this.text[end]==='[')nesting++;if(this.text[end]===']'&&!--nesting)break;}
      const body=this.text.slice(this.p,end),markers=body.match(/n(?=[\d-])/g)??[];
      legacy=markers.length>1||/^\s*n0(?:\s|\]|$)/.test(body);pitchMode=!legacy;
      if(pitchMode){this.p+=first[0].length;}
    }
    const cells:Cell[]=[];while(this.peek()&&this.peek()!==']'){
      const before=this.p;while(/[ ,\t\r\n]/.test(this.peek())&&this.peek())this.p++;const separator=this.text.slice(before,this.p),gap=cells.length&&!separator.includes(',')?Math.max(0,this.p-before-1):0;if(this.peek()===']')break;
      let cell:Cell;
      if(this.peek()==='[')cell={children:this.sequence(depth+1,pitchMode,legacy).cells};
      else if(this.peek()==='*'){const p=this.parameterValue() as {parameter:number};cell={parameter:p.parameter,degree:pitchMode};}
      else if(this.peek()==='~'){this.p++;cell={rest:true};}
      else if(this.peek()==='?'){if(this.text[this.p+1]==='['){const spec=this.randomSpec([-20000,20000],[-20000,20000]);cell={random:true,...('choices'in spec?{randomChoices:spec.choices}:{randomBounds:spec.range,randomOpen:spec.open}),degree:pitchMode};}else{this.p++;cell={random:true,degree:pitchMode};}}
      else if(pitchMode){const token=this.text.slice(this.p).match(/^([+]+|[-]+)?(\d+)/);if(!token)this.error('Pitch positions are positive integers; prefix + / - for octave registers.');this.p+=token![0].length;const position=Number(token![2]);if(position<1)this.error('Pitch positions start at 1.');const signs=token![1]??'';cell={value:position-1,degree:true,octave:signs.length*(signs[0]==='-'?-1:1)};}
      else {let degree=false;if(this.peek()==='n'){this.p++;degree=true;}cell={value:this.number()!,degree};}
      cell.gap=gap;cells.push(cell);if(cells.length>128)this.error('At most 128 cells per sequence.');if(this.peek()!==']'&&!/[\s,]/.test(this.peek()))this.error('Separate sequence values with spaces.');
    }if(this.peek()!==']')this.error('Close the sequence with ].');this.p++;if(!cells.length)this.error('A sequence cannot be empty.');return {cells};
  }
  value(fallback: number,onRandom?:(part:number)=>Value,bounds:[number,number]=[0,9]): Setting {
    if(this.peek()==='[')return {value:fallback,sequence:this.sequence()};
    const random:([number,number]|undefined)[]=[];let part=0;const read = (): Value => {
      const index=part++;if(onRandom&&this.peek()==='?')return onRandom(index);if(this.peek()==='?'){const spec=this.randomSpec(bounds);if('choices'in spec)return {choices:spec.choices};random[index]=spec.range;return fallback;}
      if (this.peek() === '*') return this.parameterValue();
      return this.number(false) ?? fallback;
    };
    const result: Setting = { value: read() };
    if (this.peek() === '>' || this.peek() === '<' || this.peek() === '^') {
      const direction = this.peek(); this.p++; result.end = read();if(direction==='^')result.exponential=true;
      if (direction === '<') [result.value, result.end] = [result.end, result.value];
      result.duration = 2;result.followGate=true;
      if (this.peek() === "'" && this.text[this.p+1]!=='?') { this.p++; result.duration = this.time();result.followGate=false; }
      if (!(result.duration! > 0 && result.duration! <= MAX_TIME_SECONDS)) this.error('Sweep time must be positive and at most 86400 seconds.');
    }
    if(random.some(Boolean))result.random=random;return result;
  }
  nodes(end = '', depth = 0): Ast[] {
    if (depth > 16) this.error('Maximum nesting depth is 16.');
    const tempoBefore=this.tempo;const nodes: Ast[] = [];
    this.spaces();
    while (this.p < this.text.length && (!end || this.peek() !== end)) {
      const from = this.p; const ch = this.peek();
      const prefix=this.text.slice(this.p).match(/^([GASHRK])(\d{3})?(?:@([pofvrhdig_]{3})(?:\/(born|dfs|bfs|nnb))?)?(&)?[ \t]*\(/);
      const bareAgent=this.text.slice(this.p).match(/^([GASHRKL])(\d{3})?(?:@([pofvrhdig_]{3})(?:\/(born|dfs|bfs|nnb))?)?&[ \t]*(?![ \t]*\()/);
      const agentL=ch==='L'&&/^L&[ \t]*\(/.test(this.text.slice(this.p));
      const legacyArgs=prefix&&!prefix[2]&&!prefix[5]&&/^\s*\d+(?:\.\d+)?\s*,/.test(this.text.slice(this.p+prefix[0].length));
      if(/^spk(?=[0-9A-Z])/.test(this.text.slice(this.p))){if(depth)this.error('Speaker presets belong at score level.');this.p+=3;const key=this.text.slice(this.p).match(/^(?:\d+(?:\.\d+){0,2}|[A-Z]{3})/)?.[0];if(!key)this.error('Choose a speaker layout.');this.p+=key.length;try{speakerPreset(key);}catch(e){this.error(String(e));}nodes.push({kind:'speakerPreset',key,from,to:this.p});}
      else if(bareAgent&&!prefix&&!agentL){
        this.p+=bareAgent[0].length;const bodyFrom=this.p,children=this.nodes(end,depth+1),bodyTo=this.p;
        if(!children.length)this.error('Growth needs a sound expression or a parenthesized body.');
        const parameters=bareAgent[2]?compactGrowth(bareAgent[2]):undefined;
        nodes.push({kind:'loop',nodes:[...(bareAgent[3]?[{kind:'config' as const,map:bareAgent[3],walk:bareAgent[4],from,to:bodyFrom}]:[]),...children],count:1,scoped:true,from,to:this.p,mutation:{from:bodyFrom,to:bodyTo,algorithm:ch as import('./mutation').MutationAlgorithm,agent:true,...(parameters?{parameters}:{})}});
      }else if((prefix&&!legacyArgs)||agentL){
        const algorithm=ch as import('./mutation').MutationAlgorithm,agent=agentL||!!prefix?.[5];
        this.p+=agentL?this.text.slice(this.p).match(/^L&[ \t]*\(/)![0].length:prefix![0].length;
        const bodyFrom=this.p,children=this.nodes(')',depth+1);if(this.peek()!==')')this.error('Missing closing growth scope.');const bodyTo=this.p++;
        const parameters=prefix?.[2]?compactGrowth(prefix[2]):undefined;
        const controls:Ast[]=!agent?[{kind:'control',operator:ch,from,to:from+1},...(parameters?['N','U','D'].map((operator,i)=>({kind:'control' as const,operator,value:[parameters.count,parameters.mutation,parameters.spread][i],from,to:from+4})):[])]:[];
        if(prefix?.[3])controls.push({kind:'config',map:prefix[3],walk:prefix[4],from,to:bodyFrom-1});
        nodes.push({kind:'loop',nodes:[...controls,...children],count:1,scoped:true,from,to:this.p,...(agent?{mutation:{from:bodyFrom,to:bodyTo,algorithm,agent:true,...(parameters?{parameters}:{})}}:{})});
      }else if(ch===';'){
        this.p++;
        // Only an adjacent value belongs to the separator; a following line can start with an onset.
        const wait=/^(?:[bn])?-?(?:\d|\.\d)/.test(this.text.slice(this.p))?this.time():0;
        let name:string|undefined;
        if(!wait&&!/^(?:[bn])?-?(?:\d|\.\d)/.test(this.text.slice(from+1))){
          if(this.peek()==='<'){this.p++;const end=this.text.indexOf('>',this.p);if(end<0)this.error('Close the section name with >.');name=this.text.slice(this.p,end).trim();this.p=end+1;if(!name||name.length>80)this.error('Section names need 1–80 characters.');}
          else {name=this.text.slice(this.p).match(/^[A-Za-z_][A-Za-z_0-9-]*/)?.[0];if(name)this.p+=name.length;}
        }
        nodes.push({kind:'section',wait,...(name?{name}:{}),from,to:this.p});
      }else if(ch==='!'){
        this.p++;const command=this.text.slice(this.p).match(/^[a-z]+/)?.[0];if(!command)this.error('Expected a message after !.');this.p+=command!.length;
        if(command==='room'||command==='r'){if(depth)this.error('Room dimensions belong at score level.');if(this.peek()!=='[')this.error('Use !room[width height depth] in metres.');this.p++;const room:number[]=[];while(this.peek()&&this.peek()!==']'){while(/[\s,]/.test(this.peek())&&this.peek())this.p++;if(this.peek()===']')break;room.push(this.number()!);if(room.length>3)this.error('Room needs width, height and depth.');}if(this.peek()!==']')this.error('Close the room with ].');this.p++;if(room.length!==3||room.some(v=>v<.1||v>1000))this.error('Room dimensions must be three values from 0.1 to 1000 metres.');nodes.push({kind:'room',room:room as import('./spatial').Room,from,to:this.p});}
        else if((command==='spk'||command==='speakers')&&this.peek()!=='['){if(depth)this.error('Speaker presets belong at score level.');const key=this.text.slice(this.p).match(/^(?:\d+(?:\.\d+){0,2}|[A-Z]{3})/)?.[0];if(!key)this.error('Use !spk8, !spkOCT or !spk[...].');this.p+=key.length;try{speakerPreset(key);}catch(e){this.error(String(e));}nodes.push({kind:'speakerPreset',key,from,to:this.p});}
        else if(command==='spk'||command==='speakers'){if(depth)this.error('Speaker layouts belong at score level.');if(this.peek()!=='[')this.error('Use !spk[[1 x y z] [2 x y z] ...].');this.p++;const speakers:Speaker[]=[];let compact=false;const skip=()=>{while(/[\s,]/.test(this.peek())&&this.peek())this.p++;};skip();if(this.peek()!=='['){compact=true;while(this.peek()&&this.peek()!==']'){const token=this.text.slice(this.p).match(/^\d{3}(?=[\s,\]])/);if(!token)this.error('Compact speakers use XYZ triplets, e.g. !spk[132 323 432].');this.p+=3;const [x,y,z]=[...token[0]].map(d=>Number(d)/4.5-1);speakers.push({id:speakers.length+1,x,y,z});if(speakers.length>32)this.error('At most 32 speakers.');skip();}}while(this.peek()==='['){this.p++;skip();const id=this.number()!;skip();const x=this.number()!;skip();const y=this.number()!;skip();const z=this.number()!;skip();if(this.peek()!==']')this.error('Each speaker is [id x y z].');this.p++;speakers.push({id,x,y,z});if(speakers.length>32)this.error('At most 32 speakers.');skip();}if(this.peek()!==']')this.error('Close !spk with ].');this.p++;try{validateSpeakers(speakers);}catch(e){this.error(String(e));}nodes.push({kind:'speakers',speakers,compact,from,to:this.p});}
        else if(command==='t'||command==='title'){if(depth)this.error('Piece titles belong at score level.');if(this.peek()!=='[')this.error('Use !t[Piece title].');this.p++;const end=this.text.indexOf(']',this.p);if(end<0)this.error('Close the piece title with ].');const text=this.text.slice(this.p,end).trim();if(!text||text.length>200)this.error('A piece title needs 1–200 characters.');this.p=end+1;nodes.push({kind:'title',text,from,to:this.p});}
        else if(['sc','sa','sx'].includes(command!))nodes.push({kind:'config',mode:command==='sc'?'continuous':command==='sa'?'articulated':'spatial',from,to:this.p});
        else if(command==='i'){if(depth)this.error('Input gain declarations belong at score level.');const channel=this.number(false)??1;if(!Number.isInteger(channel)||channel<1||channel>8)this.error('Input channels are 1–8.');if(this.peek()!=='=')this.error('Use !i1=(0.9) for input trim.');this.p++;const paren=this.peek()==='(';if(paren)this.p++;const gain=this.number()!;if(paren){if(this.peek()!==')')this.error('Close input trim with ).');this.p++;}if(gain<0||gain>1)this.error('Input trim is 0–1.');nodes.push({kind:'config',input:{channel,gain},from,to:this.p});}
        else if(command==='b'){const bpm=this.number()!;if(!(bpm>=1&&bpm<=999))this.error('Tempo !b must be 1–999 BPM.');this.tempo=bpm;nodes.push({kind:'config',bpm,from,to:this.p});}
        else if(command==='f'){if(depth)this.error('Schedule future at score level.');const every=this.time();if(!(every>0))this.error('Future interval must be positive.');if(this.peek()!==':')this.error('Use !f6:48 name 1 (interval:count, target, shift).');this.p++;const count=this.number()!;if(!Number.isInteger(count)||count<1||count>128)this.error('Future count must be 1–128.');while(/[ \t]/.test(this.peek()))this.p++;const name=this.text.slice(this.p).match(/^[a-z_]{2,}/)?.[0];if(!name)this.error('Future needs a named expression.');this.p+=name!.length;while(/[ \t]/.test(this.peek()))this.p++;const shift=this.number()!;if(!Number.isInteger(shift))this.error('Future shift is an integer.');nodes.push({kind:'config',future:{name:name!,every,count,shift},from,to:this.p});}
        else if(['vc','vp','vf','vl','vs','vt','st','stocky'].includes(command!)){if(depth>0)this.error('Visual messages belong at score level.');nodes.push({kind:'view',mode:command==='vc'?'cube':command==='vp'?'parameters':command==='vf'?'phyllotaxis':command==='vl'?'lsystem':command==='vs'?'spatial':'stocky',from,to:this.p});}
        else this.error('Unknown message. Use !sc, !sa, !sx, !b, !f or !vc/!vp/!vl.');
      } else if(ch==='u'&&/[\[A-Z0-9]/.test(this.text[this.p+1]??'')){
        this.p++;const start=this.p;if(this.peek()==='['){const end=this.text.indexOf(']',this.p);if(end<0)this.error('Close the tuning list with ].');this.p=end+1;if(this.peek()===':'){this.p++;this.number();if(this.peek()!=='/')this.error('A period is a ratio n/d.');this.p++;this.number();}}
        else {const token=this.text.slice(this.p).match(/^(?:[A-Z]{3}|\d+)/)?.[0];if(!token)this.error('Use u12, uJMA or u[...].');this.p+=token!.length;}
        let tuning:Tuning;try{tuning=parseTuning(this.text.slice(start,this.p));}catch(e){this.error(e instanceof Error?e.message:String(e));}nodes.push({kind:'config',tuning:tuning!,from,to:this.p});
      } else if(ch==='@'){
        this.p++;const map=this.text.slice(this.p,this.p+3);if(!/^[pofvrhdig_]{3}$/.test(map))this.error('XYZ map uses three targets: p/o/f/v/r/h/d/i/g/_.');this.p+=3;let walk:string|undefined;if(this.peek()==='/'){this.p++;walk=this.text.slice(this.p).match(/^[a-z]+/)?.[0];if(!walk||!['dfs','bfs','nnb','born'].includes(walk))this.error('Use dfs, bfs, nnb or born traversal.');this.p+=walk.length;}nodes.push({kind:'config',map,walk,from,to:this.p});
      } else if(ch==='o'&&/[\d.*]/.test(this.text[this.p+1]??'')){
        this.p++;const root=this.peek()==='*'?this.parameterValue():this.number()!;if(typeof root==='number'&&(root<20||root>12000))this.error('Root o is 20–12000 Hz.');nodes.push({kind:'config',root,from,to:this.p});
      } else if(ch==='{'){
        this.p++;const children=this.nodes('}',depth+1);if(this.peek()!=='}')this.error('Missing closing feedback brace.');this.p++;
        const effects:(BusEffect&{setting?:Setting;spatialSetting?:SpatialSetting})[]=[];let hasReturn=false,requiresReturn=false;
        const circuit:Ast&{kind:'feedback'}={kind:'feedback',nodes:children,delay:{value:.012},gain:{value:.85},filter:{value:6.6},volume:{value:2},cross:.35,from,to:this.p};
        const add=(kind:BusEffect['kind'],setting:Setting)=>{if(setting.sequence)this.error('Bus processors take scalar values or ramps.');effects.push({kind,value:typeof setting.value==='number'?setting.value:NaN,setting});};
        while(this.p<this.text.length&&!/\s|#|[)}]/.test(this.peek())){
          const op=this.peek();this.p++;
          if(op==='r'||op==='h')add(op==='r'?'reverb':'chop',this.value(1));
          else if(op==='p'){if(/^\[\s*(?:(?:xyz|x|o)(?:[\s,])|o\d|\d{3}(?:[><]|\]))/.test(this.text.slice(this.p)))effects.push({kind:'pan',value:0,spatialSetting:this.spatialValue()});else add('pan',this.value(0,undefined,[-1,1]));}
          else if(op==='d'){circuit.delay=this.value(.3,undefined,[MIN_DELAY_SECONDS,MAX_DELAY_SECONDS]);add('delay',circuit.delay);if(this.peek()===','){requiresReturn=true;this.p++;circuit.delayRight=this.value(.029,undefined,[MIN_DELAY_SECONDS,MAX_DELAY_SECONDS]);}}
          else if(op==='g'){hasReturn=true;circuit.gain=this.value(.85);if(this.peek()===','){this.p++;circuit.gainRight=this.value(.68);}}
          else if(op==='b'){requiresReturn=true;const left=this.value(220);let right=left;if(this.peek()===','){this.p++;right=this.value(880);}circuit.band=[left,right];}
          else if(op==='q'){requiresReturn=true;const left=this.value(.25);let right=left;if(this.peek()===','){this.p++;right=this.value(.2);}circuit.rq=[left,right];}
          else if(op==='k'){requiresReturn=true;circuit.drive=this.value(2.5);}
          else if(op==='f'){circuit.filter=this.value(6.6);circuit.filterExplicit=true;add('filter',circuit.filter);}
          else if(op==='v'){const v=this.intensity();circuit.volume=v.setting;if(v.gate!==undefined)circuit.duration=v.gate;add('volume',v.setting);}
          else if(op==='x'){requiresReturn=true;circuit.crossSetting=this.value(.35);}else if(op==="'")circuit.duration=this.time();else this.error(`Unknown bus/circuit control '${op}'. Use v/p/f/h/d/r; g explicitly enables feedback.`);
        }
        circuit.to=this.p;
        if(requiresReturn&&!hasReturn)this.error('Feedback controls b/q/k/x and paired delays require an explicit return g.');
        if(hasReturn)for(let i=effects.length-1;i>=0;i--)if(['delay','filter','volume'].includes(effects[i].kind))effects.splice(i,1);
        if(effects.length>8)this.error('At most eight effects per output bus.');
        if(hasReturn&&!effects.length)nodes.push(circuit);
        else nodes.push({kind:'bus',nodes:hasReturn?[circuit]:children,effects,duration:!hasReturn?circuit.duration:undefined,from,to:this.p});
      } else if(ch==='L'){
        nodes.push(this.lsystem());
      } else if (ch === '(') {
        this.p++; const children = this.nodes(')', depth + 1);
        if (this.peek() !== ')') this.error('Missing closing parenthesis.');
        const bodyTo=this.p;this.p++; const count = this.number(false);
        if (count !== undefined && (!Number.isInteger(count) || count < 1 || count > 128)) this.error('Repeat count must be an integer from 1 to 128.');
        let period:number|undefined;
        if(this.peek()==="'"){this.p++;period=this.time();if(depth!==0||count!==undefined)this.error('A recurring period belongs on one uncounted root loop.');if(!(period!>=.025&&period!<=86400))this.error('Loop period must be 0.025–86400 seconds.');}
        let mutation:import('./mutation').MutationRegion|undefined;const agent=this.peek()==='&';if(agent)this.p++;if(agent||/[GASHRKL]/.test(this.peek())&&this.peek()){const algorithm=this.peek();if(!'GASHRKL'.includes(algorithm)||!algorithm)this.error('Mutation suffix uses G/A/S/H/R/K/L, optionally preceded by & for AI.');this.p++;mutation={from:from+1,to:bodyTo,algorithm:algorithm as import('./mutation').MutationAlgorithm,agent};}
        const group:Ast={kind:'loop',from,to:this.p,nodes:children,count:count??0,period,mutation};
        const effects:(BusEffect&{setting?:Setting;spatialSetting?:SpatialSetting})[]=[];let lifetime:number|undefined;
        while(this.peek()&&'vrhd'.includes(this.peek())){
          const op=this.peek();this.p++;let setting:Setting;
          if(op==='v'){const volume=this.intensity();setting=volume.setting;if(volume.gate!==undefined)lifetime=volume.gate;}
          else setting=this.value(op==='d'?.3:1,undefined,op==='d'?[MIN_DELAY_SECONDS,MAX_DELAY_SECONDS]:[0,9]);
          if(setting.sequence)this.error('Group processors take scalar values or ramps; put parameter lists inside the group.');
          effects.push({kind:op==='v'?'volume':op==='r'?'reverb':op==='h'?'chop':'delay',value:typeof setting.value==='number'?setting.value:NaN,setting});
          if(effects.length>8)this.error('At most eight processors after a group.');
        }
        if(this.peek()&&/[a-z:]/.test(this.peek()))this.error('After a group use v/r/h/d. Sound atoms and FM colon are not group processors.');
        nodes.push(effects.length?{kind:'bus',nodes:[group],effects,duration:lifetime,from,to:this.p}:group);
      } else if (/[A-Z]/.test(ch)) {
        if (!'GASHRKNUD'.includes(ch)) this.error(`Operator ${ch} is not implemented in this prototype. Open the language guide for supported syntax.`);
        this.p++;
        if('GASHRK'.includes(ch)){
              const packed=this.text.slice(this.p).match(/^\d{3}(?![\d.])/)?.[0];
          if(packed){this.p+=3;const c=compactGrowth(packed);nodes.push({kind:'control',operator:ch,from,to:this.p},{kind:'control',operator:'N',value:c.count,from,to:this.p},{kind:'control',operator:'U',value:c.mutation,from,to:this.p},{kind:'control',operator:'D',value:c.spread,from,to:this.p});this.spaces();continue;}
          if(this.peek()==='('){this.p++;const values=[this.number()!];for(let i=0;i<2;i++){if(this.peek()!==',')this.error('Use A(30,0.8,3).');this.p++;values.push(this.number()!);}if(this.peek()!==')')this.error('Close growth arguments with ).');this.p++;nodes.push({kind:'control',operator:ch,from,to:this.p},...['N','U','D'].map((operator,i)=>({kind:'control' as const,operator,value:values[i],from,to:this.p})));this.spaces();continue;}
        }
        const value = this.number(false);
        if ('GASHRK'.includes(ch) && value !== undefined) this.error('Use G N32 U0.08 D1, G(32,0.08,1) or G583.');
        nodes.push({ kind: 'control', from, to: this.p, operator: ch, value });
      } else {
        const delayed=this.text.slice(this.p).match(/^(\d+(?:\.\d*)?|\.\d+)(?=[a-z_]{2,})/);const offset=delayed?Number(delayed[0]):undefined;if(delayed)this.p+=delayed[0].length;
        const name = this.text.slice(this.p).match(/^[a-z_]{2,}/)?.[0];
        if (name&&!this.text.slice(this.p).startsWith('l_[')&&!/^i[vpfhrde][\d.?]/.test(this.text.slice(this.p))) {
          this.p += name.length;
          if (this.peek() === '=') {
            if(offset!==undefined)this.error('An onset prefix belongs on a call, not a definition.');
            this.p++; const before = this.parameter; this.parameter = 0;
            let children: Ast[];
            if (this.peek() === '(') { this.p++; children = this.nodes(')', depth + 1); if (this.peek() !== ')') this.error('Missing definition parenthesis.'); this.p++; }
            else children = [this.sound(depth)];
            const parameters = this.parameter; this.parameter = before;
            nodes.push({ kind: 'definition', from, to: this.p, name, nodes: children, parameters });
          } else {
            const args: number[] = []; const first = this.number(false);
            if (first !== undefined) args.push(first);
            while (this.peek() === ',') { this.p++; args.push(this.number()!); }
            nodes.push({ kind: 'call', name, args, offset,from, to: this.p });
          }
        } else {if(delayed)this.p=from;nodes.push(this.sound(depth));}
      }
      if(this.peek()==='~'){this.p++;let chance=1;if(this.peek()==='?'){this.p++;const digit=this.text.slice(this.p).match(/^\d/)?.[0];chance=digit===undefined?.5:Number(digit)/10;if(digit)this.p++;}const child=nodes.pop()!;nodes.push({kind:'rest',nodes:[child],chance,from:child.from,to:this.p});}
      if (nodes.length > 2048) this.error('Score exceeds the 2048-statement budget.');
      if (this.p === from) this.error('Unexpected input.');
      if (nodes.at(-1)?.kind==='control'&&/[A-Z0-9a-z?]/.test(this.peek())&&this.peek()){this.spaces();continue;}
      if (this.p < this.text.length && !/\s|#|[)}]/.test(this.peek())) this.error(`Unexpected character '${this.peek()}'. Separate actions with a space.`);
      this.spaces();
    }
    if(depth>0)this.tempo=tempoBefore;return nodes;
  }
  spatialValue():SpatialSetting {
    this.p++;while(/\s/.test(this.peek())&&this.peek())this.p++;
    const direct=this.text.slice(this.p).match(/^o(\d+(?:[><]\d+)*)\]/);
    if(direct){this.p+=direct[0].length;const directions:string[]=direct[1].match(/[><]/g)??[];if(directions.includes('>')&&directions.includes('<'))this.error('Use one direction in a raw path; reverse the order for <.');const route=direct[1].split(/[><]/).map(Number);if(route.length>32)this.error('At most 32 steps in a raw output path.');if(directions[0]==='<')route.reverse();return {mode:'outputs',values:[],route};}
    const packed=this.text.slice(this.p).match(/^(\d{3})(?:([><])(\d{3}))?/);
    if(packed){this.p+=packed[0].length;const values:Setting[]=[...packed[1]].map((digit,i)=>({value:Number(digit)/4.5-1,...(packed[3]?{end:Number(packed[3][i])/4.5-1,duration:2,followGate:true}:{})}));if(packed[2]==='<')values.forEach(v=>{[v.value,v.end]=[v.end!,v.value];});if(this.peek()!==']')this.error('Packed XYZ is p[423] or p[423>111].');this.p++;return {mode:'xyz',values};}
    const marker=this.text.slice(this.p).match(/^(xyz|x|o)/)![0];this.p+=marker.length;
    const mode=marker==='o'?'outputs':'xyz',values:Setting[]=[];
    const skip=()=>{while(/[\s,]/.test(this.peek())&&this.peek())this.p++;};skip();
    while(this.peek()&&this.peek()!==']'){
      const before=this.p;const value=this.value(0,undefined,mode==='xyz'?[-1,1]:[0,9]);
      if(value.sequence||before===this.p)this.error('Spatial components take numbers, random values or ramps.');values.push(value);
      if(values.length>32)this.error('At most 32 spatial components.');
      if(this.peek()!==']'&&!/[\s,]/.test(this.peek()))this.error('Separate spatial components with a space or comma.');skip();
    }
    if(this.peek()!==']')this.error('Close the spatial p vector with ].');this.p++;
    if(mode==='xyz'&&values.length!==3||mode==='outputs'&&values.length<1)this.error('p[x ...] needs XYZ; p[o ...] needs one gain per speaker.');
    if(this.peek()==='>'||this.peek()==='<'){
      const direction=this.peek();this.p++;const other=this.spatialValue();
      if(other.mode!==mode||other.values.length!==values.length)this.error('Spatial endpoints need matching vector types and lengths.');
      values.forEach((v,i)=>{if(v.end!==undefined||other.values[i].end!==undefined)this.error('Use component ramps OR vector endpoint ramps.');v.end=other.values[i].value;v.duration=2;v.followGate=true;if(direction==='<')[v.value,v.end]=[v.end,v.value];});
      if(this.peek()==="'"){this.p++;const duration=this.time();if(!duration)this.error('Spatial sweep duration must be positive.');values.forEach(v=>{v.duration=duration;v.followGate=false;});}
    }
    return {mode,values};
  }
  panValue(){
    if(this.peek()==='[')return {setting:{value:0,sequence:this.sequence()} as Setting,random:undefined};
    const ranges:([number,number]|undefined)[]=[];
    const read=():Value=>{if(this.peek()==='?'){const spec=this.randomSpec([-1,1]);if('choices'in spec){ranges.push(undefined);return {choices:spec.choices};}ranges.push(spec.range);return 0;}ranges.push(undefined);if(this.peek()==='*')return this.parameterValue();return this.number(false)??0;};
    const setting:Setting={value:read()};let sweep=false,explicitTime=false;
    const direction=this.peek();if(direction==='>'||direction==='<'||direction==='^'){this.p++;sweep=true;setting.end=read();setting.duration=2;if(direction==='^')setting.exponential=true;if(this.peek()==="'"&&this.text[this.p+1]!=='?'){this.p++;setting.duration=this.time();explicitTime=true;}if(!(setting.duration!>0&&setting.duration!<=MAX_TIME_SECONDS))this.error('Sweep time must be positive and at most 86400 seconds.');if(direction==='<'){[setting.value,setting.end]=[setting.end!,setting.value];ranges.reverse();}}
    const random=ranges.some(Boolean)?{start:ranges[0],end:ranges[1],sweep,followDuration:sweep&&!explicitTime}:undefined;
    if(random&&setting.exponential)this.error('Random pan uses > or < interpolation.');
    setting.followGate=sweep&&!explicitTime;
    if(random?.followDuration)setting.duration=0;
    return {setting,random};
  }
  intensity():{setting:Setting;gate?:number} {
    if(this.peek()==='[')return {setting:{value:3,sequence:this.sequence()}};
    if(this.peek()==='?')return {setting:this.value(3)};
    const read=():Value=>{if(this.peek()==='*')return this.parameterValue();return this.number(false)??3;};
    const values:Value[]=[read()],times:(number|undefined)[]=[],directions:string[]=[];
    const time=()=>{if(this.peek()!=="'"||this.text[this.p+1]==='?')return undefined;this.p++;return this.time();};
    times.push(time());
    while(this.peek()==='>'||this.peek()==='<'){
      if(values.length>=16)this.error('Intensity contours support at most 16 values.');
      directions.push(this.peek());this.p++;values.push(read());times.push(time());
    }
    if(values.length===1)return {setting:{value:values[0]},gate:times[0]};
    if(directions.includes('<')){
      if(values.length!==2)this.error('Use > between multipoint intensity values; < is supported for two-value ramps.');
      [values[0],values[1]]=[values[1],values[0]];
    }
    let duration:number;
    try{duration=intensityContour(values.map(()=>0),times).duration;}catch(error){this.error(error instanceof Error?error.message:String(error));}
    return {setting:{value:values[0],end:values.at(-1),duration:duration!,followGate:times.every(t=>t===undefined),contour:{values,times}}};
  }
  lsystem():Ast {
    const from=this.p++;const digits=this.text.slice(this.p).match(/^\d+/)?.[0];let iterations=this.number(false)??4,packedAngle:number|undefined,taper:number|undefined;if(digits?.length===3){iterations=Number(digits[0]);packedAngle=5+Number(digits[1])*10;taper=.45+Number(digits[2])*.05;}let axiom:string|undefined;
    if(this.peek()===':'){this.p++;axiom=this.text.slice(this.p).match(/^[A-Z+\[\]-]+/)?.[0];if(!axiom)this.error('Expected an uppercase L-system axiom after colon.');this.p+=axiom!.length;}
    let angle:number|undefined=packedAngle;if(this.peek()==='/'){this.p++;angle=this.number();if(!(angle!>0&&angle!<=180))this.error('L turtle angle must be greater than 0 and at most 180 degrees.');if(this.peek()===','){this.p++;taper=this.number();if(!(taper!>=.1&&taper!<=1))this.error('L taper must be 0.1–1.');}}
    const headerTo=this.p,rules:(RewriteRule&Range)[]=[],bindings:({symbol:string;name:string;args:number[]}&Range)[]=[];
    while(this.p<this.text.length){
      while(/[ \t\r]/.test(this.peek())&&this.peek())this.p++;
      if(!this.peek()||this.peek()==='\n'||this.peek()==='#'||this.peek()===')'||this.peek()==='}')break;
      const start=this.p;
      if(this.peek()==='@'){
        this.p++;const symbol=this.peek();if(!/^[A-Z]$/.test(symbol))this.error('A musical binding needs an uppercase symbol: @A=aa.');this.p++;
        if(this.peek()!=='=')this.error('Expected = in a musical binding: @A=aa.');this.p++;
        const name=this.text.slice(this.p).match(/^[a-z_]{2,}/)?.[0];if(!name)this.error('Bind the symbol to an existing expression with a name of two or more letters.');this.p+=name!.length;
        const args:number[]=[];const first=this.number(false);if(first!==undefined)args.push(first);
        while(this.peek()===','){this.p++;args.push(this.number()!);}
        if(bindings.some(binding=>binding.symbol===symbol))this.error(`Duplicate musical binding for ${symbol}.`);
        bindings.push({symbol,name:name!,args,from:start,to:this.p});
      }else{
        const symbol=this.peek();if(!/^[A-Z]$/.test(symbol))this.error('Expected an L rule A>AB or musical binding @A=aa.');this.p++;
        if(this.peek()!=='>')this.error('Expected > in a rewriting rule, e.g. A>AB.');this.p++;
        const replacement=this.text.slice(this.p).match(/^[A-Z+\[\]-]*/)?.[0]||'';this.p+=replacement.length;
        rules.push({symbol,replacement,from:start,to:this.p});
      }
      if(this.p<this.text.length&&!/[\s#)}]/.test(this.peek()))this.error('Separate rewriting rules and bindings with spaces.');
    }
    return {kind:'lsystem',iterations,axiom,angle,taper,rules,bindings,from,to:this.p,headerTo};
  }
  sound(_depth: number): Ast {
    const from = this.p;
    const offset = this.number(false) ?? 0;
    let lyrics:NoteEvent['lyrics'];
    if(/^l_?\[/.test(this.text.slice(this.p))){
      const captions=this.text[this.p+1]==='_';this.p+=captions?3:2;const end=this.text.indexOf(']',this.p);if(end<0)this.error('Close the lyric text with ].');
      const text=this.text.slice(this.p,end);if(!text.trim()||text.length>500||text.includes('['))this.error('Lyrics need 1–500 characters, without nested brackets.');
      this.p=end+1;lyrics={text,vocoder:this.peek()===':',...(captions?{captions:true}:{})};if(lyrics.vocoder){this.p++;if(!this.peek()||!'staq'.includes(this.peek()))this.error('Use l[text]:s[notes], :t, :a or :q for a vocoder carrier.');}
    }
    let wave=lyrics&&!lyrics.vocoder?'s':this.peek() as Wave;let waveOptions:Wave[]|undefined;
    if(lyrics&&!lyrics.vocoder){ /* Literal voice uses the ordinary effect suffixes. */ }else if(this.peek()==='?'){
      this.p++;waveOptions=['s','t','a','q'];
      if(/^\[\s*[staq](?:[\s,]|\])/.test(this.text.slice(this.p))){
        this.p++;waveOptions=[];
        while(this.peek()&&this.peek()!==']'){
          if(/[\s,]/.test(this.peek())){this.p++;continue;}
          if(!'staq'.includes(this.peek()))this.error('Timbre choices support s, t, a and q; noise uses a different frequency argument.');
          waveOptions.push(this.peek() as Wave);this.p++;if(waveOptions.length>16)this.error('At most 16 timbre choices.');
        }
        if(this.peek()!==']')this.error('Missing closing timbre-choice bracket.');this.p++;
        if(!waveOptions.length)this.error('A timbre choice needs at least one sound atom.');
      }
      wave=waveOptions[0];
    }else{if (!'staqni'.includes(wave)||!wave)this.error(`Expected s, t, a, q, n, i or ?; found '${wave||'end of score'}'.`);this.p++;}
    const ranges:([number,number]|undefined)[]=[];const frequencyFrom=this.p;
    const freq=this.value(wave==='n'||wave==='i'?1:440,part=>{
      if(wave==='n'||wave==='i')this.error('Random Hz frequency requires a tonal oscillator.');
      const spec=this.randomSpec([55,1760],[20,20000]);if('choices'in spec){ranges[part]=undefined;return {choices:spec.choices};}ranges[part]=spec.range;return 440;
    });
    const frequencyText=this.text.slice(frequencyFrom,this.p);if(frequencyText.includes('<')){const first=ranges[0];ranges[0]=ranges[1];ranges[1]=first;}
    const freqRange=ranges[0],freqEndRange=ranges[1],freqRandomSweep=(!!freqRange||!!freqEndRange)&&freq.end!==undefined,freqSweepFollowsGate=freqRandomSweep&&!frequencyText.includes("'");
    let explicitDuration=false;
    const result: Ast & {kind:'sound'} = { kind: 'sound', lyrics,wave,waveOptions,freqRange,freqEndRange,freqRandomSweep,freqSweepFollowsGate, freq, from, to: this.p, offset,
      index: { value: 1 }, volume: { value: wave==='i'?9:3 }, pan: { value: 0 }, panExplicit:false, duration: freq.duration ?? (lyrics?lyricDuration(lyrics.text):wave==='i'?8:1), envelope: lyrics||wave==='i'?'off':'0253', reverb: {value:0} };
    while (this.p < this.text.length && !/\s|#|~|[)}]/.test(this.peek())) {
      const op = this.peek(); this.p++;
      if (op === ':') {
        const mod = this.peek();
        if (!mod||!'staq'.includes(mod)) this.error('FM requires a sound atom after colon: :s100, :t100, :a100 or :q100.');
        if(result.modulation)this.error('Only one FM modulator per sound is supported in this prototype.');
        this.p++; result.modulatorWave=mod as Exclude<Wave,'n'|'i'>; result.modulation = this.value(100,undefined,[20,12000]);
      } else if (op === 'o') result.freq=this.value(440);
      else if(op==='w'){if(!lyrics?.vocoder)this.error('w is a lyric vocoder blend: l[text]:s220w4.');result.wet=this.value(9,undefined,[0,9]);if(result.wet.sequence)this.error('Vocoder blend w takes one value or an interpolation.');}
      else if (op === 'i') result.index=this.value(1,undefined,[0,20]);
      else if (op === 'v') {const volume=this.intensity();result.volume=volume.setting;if(volume.gate!==undefined){result.duration=volume.gate;result.durationValue=undefined;explicitDuration=true;}}
      else if(op==='p'&&/^\[\s*(?:(?:xyz|x|o)(?:[\s,])|o\d|\d{3}(?:[><]|\]))/.test(this.text.slice(this.p))){result.spatial=this.spatialValue();result.panExplicit=true;}
      else if (op === 'p') {const pan=this.panValue();result.pan=pan.setting;result.panRandom=pan.random;result.panExplicit=true;}
      else if (op === "'") {
        result.durationValue=undefined;
        if(this.peek()==='*'){result.durationValue=this.parameterValue();result.durationRange=undefined;result.durationChoices=undefined;result.durationEnd=undefined;}
        else if(this.peek()==='?'){
          const spec=this.randomSpec([.1,2],[.001,MAX_TIME_SECONDS]);result.durationChoices='choices'in spec?spec.choices:undefined;const range:[number,number]='choices'in spec?[Math.min(...spec.choices),Math.max(...spec.choices)]:spec.range;result.durationRange=range;result.duration=range[1];
        }else {result.duration=this.time();result.durationRange=undefined;result.durationChoices=undefined;result.durationEnd=undefined;if(this.peek()==='>'||this.peek()==='<'){const direction=this.peek();this.p++;result.durationEnd=this.time();if(direction==='<')[result.duration,result.durationEnd]=[result.durationEnd,result.duration];}}
        explicitDuration=true;
      }
      else if (op === 'e') {
        if(this.peek()==='0'&&!/\d/.test(this.text[this.p+1]||'')){this.p++;result.envelope='off';continue;}
        const digits = this.text.slice(this.p).match(/^\d{4}(?!\d)/)?.[0];
        if (!digits) this.error('Envelope requires four digits, e.g. e0253.');
        result.envelope = digits; this.p += 4;
      } else if (op === 'r') result.reverb = this.value(1);
      else if (op === 'f') result.filter = this.value(9);
      else if(op==='d')result.delay=this.value(.3,undefined,[MIN_DELAY_SECONDS,MAX_DELAY_SECONDS]);
      else if (op === 'h') result.chop = this.value(1);
      else this.error(`Unknown modifier '${op}'.`);
    }
    // A timed input effect defines its gate when no separate gate was written;
    // the eight-second input fallback must not swallow a short timed gesture.
    if(wave==='i'&&!explicitDuration){const timed=[result.freq,result.pan,result.volume,result.modulation,result.index,result.filter,result.delay,result.chop,result.reverb,...(result.spatial?.values??[])].filter(v=>v?.duration&&!v.followGate);if(timed.length){result.duration=Math.max(...timed.map(v=>v!.duration!));explicitDuration=true;}}
    if(!explicitDuration)result.duration=Math.max(result.duration,result.pan.duration||0,result.volume.duration||0,result.modulation?.duration||0,result.index.duration||0,result.filter?.duration||0,result.delay?.duration||0,result.wet?.duration||0,result.chop?.duration||0,result.reverb.duration||0,...(result.spatial?.values.map(v=>v.duration??0)??[]));
    if([result.freq,result.pan,result.volume,result.filter,result.chop,result.index].some(v=>v?.sequence)&&!explicitDuration)result.duration=60/this.tempo;
    if(result.durationEnd!==undefined&&(![result.freq,result.pan,result.volume,result.filter,result.chop,result.index].some(v=>v?.sequence)||result.durationEnd<.001))this.error('A time transition requires a parameter sequence and positive step durations.');
    result.gateExplicit=explicitDuration;result.to = this.p;
    if (!(result.duration >= .001 && result.duration <= MAX_TIME_SECONDS)) this.error('Note duration must be between 0.001 and 86400 seconds.');
    if (!(offset >= 0 && offset <= 120)) this.error('Time offset must be between 0 and 120 seconds.');
    return result;
  }
}

const modes: Record<string, string> = { G: 'phyllotaxis', A: 'apomixis', S: 'stolon', H: 'apical', R: 'tropism', K: 'colonisation' };
export const MAX_EVENTS = 2048;
export function compile(source: string, seed = 3181, cycle = 0, elapsed = 0, allowSilence = false): CompiledScore {
  const stripped=stripScoreComments(source);
  const canonical = /!sx(?:\s|$)/.test(stripped)?stripped.trim():stripped.trim().replace(/\s+/g,' ');
  const result: CompiledScore = { events: [], feedback:[], outputBuses:[], duration: 0, canonical, seed: seed >>> 0, generator: null, visualization:'cube', viewMessages:[], lSystems:[], diagnostics: [] };
  if (source.length > 64000) return { ...result, diagnostics: [{ from: 0, to: source.length, message: 'Score exceeds 64,000 characters.' }] };
  const defs = new Map<string, Ast & {kind:'definition'}>();
  let count = 24, mu = .08, spread = 1, control: Range | undefined;
  let growthMode:string|null=null;const usedGrowthModes=new Set<string>();
  let workBudget = 20000,growthInstance=0;
  const inputGains:Record<number,number>={};
  let sequenceMode:SequenceMode='continuous',tuning:Tuning|undefined,root=110,map:string|undefined,walk='born';
  let apomicticScopeDepth=0,restDraw=0;
  let parameterDraw=0,sequenceDraw=0,inheritedGate:number|undefined;
  const futures:{name:string;every:number;count:number;shift:number}[]=[];
  const fail = (n: Range, message: string): never => { throw new SyntaxIssue(n.from, n.to, message); };
  const resolve = (s: Setting, args: number[], n: Range): Ramp => {
    const get = (v: Value) => {if(typeof v==='number')return v;if('parameter'in v)return args[v.parameter];result.randomTimeSource=source;return v.choices[Math.min(v.choices.length-1,Math.floor(durationForCycle([0,v.choices.length],result.seed,2000000+parameterDraw++,cycle)))];};
    if(s.contour){try{return intensityContour(s.contour.values.map(get),s.contour.times);}catch(error){fail(n,error instanceof Error?error.message:String(error));}}
    let start = get(s.value), end = s.end === undefined ? start : get(s.end);if(s.random){result.randomTimeSource=source;const id=1000000+parameterDraw++;if(s.random[0])start=durationForCycle(s.random[0],result.seed,id,cycle);end=s.end===undefined?start:s.random[1]?durationForCycle(s.random[1],result.seed^0xabc,id,cycle):end;}
    if (!Number.isFinite(start) || !Number.isFinite(end)) fail(n, 'Missing function argument.');
    if(s.exponential&&!(start>0&&end>0))fail(n,'Exponential sweep ^ needs positive endpoints.');
    return { start, end, duration: s.duration ?? 0,...(s.exponential?{exponential:true}:{}) };
  };
  const resolveSpatial=(setting:SpatialSetting,args:number[],range:Range,duration:number):SpatialPan=>{
    if(!result.speakers)fail(range,'Spatial p needs !spk[[1 x y z] [2 x y z] ...].');
    if(setting.route){const route=setting.route,speakers=result.speakers!;if(route.some(id=>!speakers.some(s=>s.id===id)))fail(range,'Raw p paths need declared speaker IDs.');return {mode:'outputs',values:speakers.map(s=>{const values=route.map(id=>s.id===id?9:0),points=values.map((value,i)=>({time:route.length>1?duration*i/(route.length-1):0,value}));return {start:values[0],end:values.at(-1)!,duration:route.length>1?duration:0,...(route.length>1?{points}:{})};})};}
    if(setting.mode==='outputs'&&setting.values.length!==result.speakers!.length)fail(range,'p[o ...] needs exactly one gain per declared speaker, in row order.');
    const values=setting.values.map(v=>{const ramp=resolve(v,args,range);if([ramp.start,ramp.end].some(x=>setting.mode==='xyz'?x< -1||x>1:x<0||x>9))fail(range,setting.mode==='xyz'?'Spatial XYZ is -1 to 1.':'Output gains are 0–9.');return v.followGate?{...ramp,duration}:ramp;});
    return {mode:setting.mode,values};
  };
  const emit = (nodes: Ast[], base: number, args: number[] = [], call?: Range, depth = 0): number => {
    if (--workBudget < 0) fail(call || nodes[0] || {from:0,to:1}, 'Score exceeds the expansion budget.');
    if (depth > 16) fail(call || nodes[0] || {from:0,to:1}, 'Recursive definition exceeds 16 calls.');
    let finish = base;
    const autoSections=new Set<Ast>();if(depth===0&&nodes.some(n=>n.kind==='section')){let segment:Ast[]=[];const flush=()=>{if(segment.length===1&&segment[0].kind==='call'&&!segment[0].args.length&&segment[0].offset===undefined)autoSections.add(segment[0]);segment=[];};for(const node of nodes){if(node.kind==='section')flush();else if(!['definition','config','title','view','control','speakers','speakerPreset','room'].includes(node.kind))segment.push(node);}flush();}
    for (let n of nodes) {
      if(n.kind==='sound'&&n.durationValue!==undefined){const duration=typeof n.durationValue==='number'?n.durationValue:args[n.durationValue.parameter];if(!Number.isFinite(duration)||duration<.001||duration>MAX_TIME_SECONDS)fail(n,'Duration argument must be 0.001–86400 seconds.');n={...n,duration,durationValue:undefined};}
      if(n.kind==='sound'&&!n.gateExplicit&&inheritedGate!==undefined&&![n.freq,n.pan,n.volume,n.filter,n.chop,n.index].some(v=>v?.sequence)&&![n.freq,n.pan,n.volume,n.filter,n.chop,n.index,n.modulation,n.reverb,n.delay,n.wet,...(n.spatial?.values??[])].some(v=>v?.duration&&!v.followGate)){const duration=inheritedGate-base-n.offset;if(duration<.001)fail(n,'An inherited bus gate must end after the sound onset; give sequenced/repeated sounds their own times.');n={...n,duration,gateExplicit:true};}
      if(n.kind==='speakers'||n.kind==='speakerPreset'||n.kind==='room')continue;
      if(n.kind==='title'){result.title=n.text;continue;}
      if(n.kind==='section'){base=finish+n.wait;if(n.name)(result.sections??=[]).push({name:n.name,t:base,from:n.from,to:n.to});if(base>MAX_TIME_SECONDS)fail(n,'Section time exceeds 86400 seconds.');finish=base;continue;}
      if(n.kind==='rest'){const first=result.events.length;const key=restDraw++,stop=emit(n.nodes,base,args,call,depth+1);for(const e of result.events.slice(first))e.restGates=[...(e.restGates??[]),{key,chance:n.chance}];finish=Math.max(finish,stop);continue;}
      if(n.kind==='config'){if(n.bpm)(result.tempos??=[]).push({bpm:n.bpm,t:base,from:n.from,to:n.to});if(n.input)inputGains[n.input.channel]=n.input.gain;if(n.mode)sequenceMode=n.mode;if(n.tuning)tuning=n.tuning;if(n.root!==undefined){const value=typeof n.root==='number'?n.root:args[n.root.parameter];if(!Number.isFinite(value)||value<20||value>12000)fail(n,'Root argument o must be 20–12000 Hz.');root=value;}if(n.map)map=n.map;if(n.walk)walk=n.walk;continue;}
      if(n.kind==='bus'){
        if(result.outputBuses.length>=32)fail(n,'At most 32 output buses.');
        const effects:BusEffect[]=n.effects.map(e=>{if(e.spatialSetting)return {kind:e.kind,value:0,spatial:resolveSpatial(e.spatialSetting,args,n,0)};const r=e.setting?resolve(e.setting,args,n):{start:e.value,end:e.value,duration:0},follow=(e.kind==='pan'||e.kind==='filter')&&e.setting?.followGate;return {kind:e.kind,value:r.start,...(r.duration||follow?{ramp:follow?{...r,duration:0}:r}:{})};});
        if(effects.some(e=>[e.value,e.ramp?.end??e.value,...(e.ramp?.points?.map(p=>p.value)??[])].some(v=>!Number.isFinite(v)||(e.kind==='delay'?v<MIN_DELAY_SECONDS||v>MAX_DELAY_SECONDS:e.kind==='pan'?v< -1||v>1:v<0||v>9))))fail(n,'Bus v/r/h/f must be 0–9; p is -1–1; d is 0.001–9 seconds.');
        if(result.outputBuses.reduce((sum,b)=>sum+b.effects.length,0)+n.effects.length>32)fail(n,'At most 32 shared output effects.');
        const volume=resolve(n.volume??{value:9},args,n);
        if([volume.start,volume.end,...(volume.points?.map(p=>p.value)||[])].some(v=>v<0||v>9))fail(n,'Bus output v must be 0–9.');
        const firstEvent=result.events.length,firstCircuit=result.feedback.length,id=result.outputBuses.length;
        const bus={id,t:base,dur:0,tail:effects.reduce((sum,e)=>sum+(e.kind==='reverb'?reverbSeconds(Math.max(e.value,e.ramp?.end??e.value)):e.kind==='delay'?echoTail(Math.max(e.value,e.ramp?.end??e.value)):0),0),effects,volume,from:n.from,to:n.to};result.outputBuses.push(bus);
        const previousGate=inheritedGate,gate=n.duration??Math.max(0,...n.effects.map((e,i)=>e.setting?.followGate===false?effects[i].ramp?.duration??0:0));if(gate>0)inheritedGate=base+gate;let end:number;try{end=emit(n.nodes,base,args,call,depth+1);}finally{inheritedGate=previousGate;}bus.dur=n.duration??Math.max(.001,end-base,volume.duration,...effects.map(e=>e.ramp?.duration??0));
        effects.forEach((effect,i)=>{if(effect.spatial)effect.spatial=resolveSpatial(n.effects[i].spatialSetting!,args,n,bus.dur);if(effect.ramp&&(effect.kind==='pan'||effect.kind==='filter')&&n.effects[i].setting?.followGate)effect.ramp.duration=bus.dur;});
        if(firstEvent===result.events.length)fail(n,'An output bus needs a sound or a circuit.');
        if(n.duration!==undefined&&result.events.slice(firstEvent).some(e=>e.t+(e.durationRange?.[1]??e.dur)>base+bus.dur)||bus.dur<end-base||bus.dur<=0||base+bus.dur>MAX_TIME_SECONDS)fail(n,'Output bus lifetime must cover its contents and fit within 86400 seconds.');
        let childTail=0;
        for(const event of result.events.slice(firstEvent))if(event.feedbackBus===undefined&&event.outputBus===undefined){event.outputBus=id;childTail=Math.max(childTail,event.reverb?reverbSeconds(event.reverb):0);}
        for(const c of result.feedback.slice(firstCircuit))if(c.outputBus===undefined)c.outputBus=id;
        for(const child of result.outputBuses.slice(id+1))if(child.parent===undefined){child.parent=id;childTail=Math.max(childTail,child.tail);}
        bus.tail+=childTail;
        finish=Math.max(finish,base+bus.dur);continue;
      }
      if(n.kind==='feedback'){
        if(result.feedback.length>=16)fail(n,'At most 16 feedback circuits.');
        const id=result.feedback.length,first=result.events.length,firstOutput=result.outputBuses.length;
        const circuit:FeedbackCircuit={id,t:base,dur:n.duration??8,from:n.from,to:n.to,delay:resolve(n.delay,args,n),gain:resolve(n.gain,args,n),filter:resolve(n.filter,args,n),volume:resolve(n.volume,args,n),cross:n.cross,...(n.crossSetting?{crossRamp:resolve(n.crossSetting,args,n)}:{})};if(circuit.crossRamp)circuit.cross=circuit.crossRamp.start;
        if(n.delayRight)circuit.delayRight=resolve(n.delayRight,args,n);
        if(n.gainRight)circuit.gainRight=resolve(n.gainRight,args,n);
        if(n.band&&n.filterExplicit)fail(n,'Select b for the two-band topology or f for the lowpass topology; do not combine them on the same circuit.');
        if(!n.band&&(n.rq||n.drive))fail(n,'Circuit q and k require a bandpass selector, e.g. b220,880.');
        const band=n.band?{frequency:n.band.map(s=>resolve(s,args,n)) as [Ramp,Ramp],rq:(n.rq?n.rq.map(s=>resolve(s,args,n).start):[.25,.2]) as [number,number],...(n.rq?{rqRamps:n.rq.map(s=>resolve(s,args,n)) as [Ramp,Ramp]}:{}),drive:resolve(n.drive??{value:2.5},args,n)}:undefined;
        if(band)circuit.band=band;
        const bounds=(r:Ramp,lo:number,hi:number)=>[r.start,r.end,...(r.points?.map(p=>p.value)||[])].every(v=>v>=lo&&v<=hi);
        if(!bounds(circuit.delay,MIN_DELAY_SECONDS,MAX_DELAY_SECONDS)||(n.delayRight&&!bounds(resolve(n.delayRight,args,n),MIN_DELAY_SECONDS,MAX_DELAY_SECONDS)))fail(n,'Circuit delay d must be 0.001–9 seconds.');
        if(!bounds(circuit.gain,0,1.5)||(n.gainRight&&!bounds(resolve(n.gainRight,args,n),0,1.5)))fail(n,'Circuit return gain g must be 0–1.5.');
        if(!bounds(circuit.filter,0,9)||!bounds(circuit.volume,0,9))fail(n,'Circuit f and v must be 0–9.');
        if(![circuit.cross,circuit.crossRamp?.end??circuit.cross].every(x=>x>=0&&x<=1))fail(n,'Circuit cross-routing x must be 0–1.');
        if(band){if(band.frequency.some(f=>!bounds(f,40,8000)))fail(n,'Band centres b must be 40–8000 Hz.');if([...band.rq,...(band.rqRamps?.map(r=>r.end)||[])].some(q=>q<.01||q>1))fail(n,'Band widths q must be 0.01–1 (reciprocal Q).');if(!bounds(band.drive,0,10))fail(n,'Band drive k must be 0–10.');}
        result.feedback.push(circuit);
        const previousGate=inheritedGate;inheritedGate=undefined;let end:number;try{end=emit(n.nodes,base,args,call,depth+1);}finally{inheritedGate=previousGate;}
        if(result.outputBuses.length!==firstOutput)fail(n,'Output-effect buses must wrap a feedback circuit, rather than sit inside its return path.');
        if(first===result.events.length)fail(n,'A digital feedback circuit needs an excitation, e.g. {n1v0.03\'0.02}.');
        if(result.events.slice(first).some(e=>e.feedbackBus!==undefined))fail(n,'Nested feedback circuits are not supported yet.');
        if(n.duration===undefined)circuit.dur=Math.max(8,end-base,...result.events.slice(first).map(e=>e.t+(e.durationRange?.[1]??e.dur)-base),circuit.delay.duration,circuit.gain.duration,circuit.filter.duration,circuit.volume.duration,...(band?[...band.frequency.map(f=>f.duration),band.drive.duration]:[]),n.delayRight?.duration??0,n.gainRight?.duration??0,circuit.crossRamp?.duration??0,...(band?.rqRamps?.map(r=>r.duration)||[]));
        if(result.events.slice(first).some(e=>e.t+(e.durationRange?.[1]??e.dur)>base+circuit.dur)||!(circuit.dur>=.025&&base+circuit.dur<=MAX_TIME_SECONDS)||end>base+circuit.dur)fail(n,'Circuit lifetime must cover its sounds and fit within 86400 seconds.');
        for(const event of result.events.slice(first)){event.feedbackBus=id;event.traces=[{from:n.from,to:n.to},...event.traces];}
        finish=Math.max(finish,base+circuit.dur);continue;
      }
      if(n.kind==='lsystem'){
        let trace:ReturnType<typeof deriveLSystem>;
        try{trace=deriveLSystem(n.rules,n.iterations,n.axiom);}catch(error){fail(n,error instanceof Error?error.message:String(error));}
        const branched=n.angle!==undefined||/[+\[\]-]/.test(trace!.word);
        const lSystemIndex=result.lSystems.length;
        if(branched)trace!.turtle=turtleGeometry(trace!.word,n.angle??25,new Set(n.bindings.map(b=>b.symbol)),n.taper??1);
        result.lSystems.push({...trace!,from:n.from,to:n.to});
        const bindings=new Map(n.bindings.map(binding=>[binding.symbol,binding]));
        for(const symbol of new Set(trace!.word)){
          if(!/[A-Z]/.test(symbol)||branched&&symbol==='X'&&!bindings.has(symbol))continue;
          const binding=bindings.get(symbol);if(!binding)fail(n,`L symbol ${symbol} needs a musical binding, e.g. @${symbol}=aa.`);
          const def=defs.get(binding!.name);if(!def)fail(binding!,`Define ${binding!.name} before L.`);
          if(binding!.args.length!==def!.parameters)fail(binding!,`${binding!.name} expects ${def!.parameters} arguments.`);
        }
        if(!growthMode)result.generator='l-system';
        let cursor=base,branchEnd=base;const clocks:number[]=[];
        const segments=new Map(trace!.turtle?.segments.map(segment=>[segment.symbolIndex,segment])??[]);
        for(let index=0;index<trace!.word.length;index++){
          const symbol=trace!.word[index];
          if(branched&&symbol==='['){clocks.push(cursor);continue;}
          if(branched&&symbol===']'){branchEnd=Math.max(branchEnd,cursor);cursor=clocks.pop()!;continue;}
          const binding=bindings.get(symbol);if(!binding)continue;
          const segment=segments.get(index),at=cursor;
          const firstEvent=result.events.length;
          cursor=emit([{kind:'call',name:binding.name,args:binding.args,from:binding.from,to:binding.to}],cursor,args,undefined,depth+1);
          if(segment){segment.t=at;segment.dur=cursor-at;}
          const parent=trace!.generations.at(-1)!.parents[index];
          const parentSymbol=n.iterations>0?trace!.generations[n.iterations-1].word[parent]:undefined;
          const rule=n.rules.find(rule=>rule.symbol===parentSymbol);
          for(let i=firstEvent;i<result.events.length;i++){
            const event=result.events[i];if(segment){event.lSegment=segment.id;event.node={id:segment.id,parent:segment.parent,...segment.end,kind:'l-system'};}event.symbol=symbol;event.generation=n.iterations;event.symbolIndex=index;event.lSystemIndex=lSystemIndex;
            event.traces=[{from:n.from,to:n.headerTo},...(rule?[{from:rule.from,to:rule.to}]:[]),...event.traces];
          }
        }
        finish=Math.max(finish,cursor,branchEnd);continue;
      }
      if(n.kind==='view'){result.visualization=n.mode;result.viewMessages.push({from:n.from,to:n.to});continue;}
      if (n.kind === 'definition') { defs.set(n.name, n); continue; }
      if (n.kind === 'control') {
        if (modes[n.operator]) { growthMode=modes[n.operator];usedGrowthModes.add(growthMode);result.generator = growthMode; control = n; }
        else if (n.operator === 'N') {
          if (n.value === undefined || !Number.isInteger(n.value) || n.value < 1 || n.value > 128) fail(n, 'N requires 1–128 generations.');
          count = n.value!;
        } else if (n.operator === 'U') {
          if (n.value === undefined || n.value < 0 || n.value > 1) fail(n, 'U requires a mutation rate from 0 to 1.'); mu = n.value!;
        } else if (n.operator === 'D') {
          if (n.value === undefined || n.value < .1 || n.value > 3) fail(n, 'D requires a spread from 0.1 to 3.'); spread = n.value!;
        }
        continue;
      }
      if (n.kind === 'call') {
        const def = defs.get(n.name); if (!def) fail(n, `Unknown variable '${n.name}'.`);
        if (n.args.length !== def!.parameters) fail(n, `${n.name} expects ${def!.parameters} arguments.`);
        if(autoSections.has(n)&&!(result.sections??[]).some(s=>s.t===base)) (result.sections??=[]).push({name:n.name,t:base,from:n.from,to:n.to,implicit:true,definition:{from:def!.from,to:def!.to}});
        const previous={count,mu,spread,growthMode,control,sequenceMode,tuning,root,map,walk};
        try{finish=Math.max(finish,emit(def!.nodes,base+(n.offset??0),n.args,n,depth+1));}
        finally{({count,mu,spread,growthMode,control,sequenceMode,tuning,root,map,walk}=previous);}continue;
      }
      if (n.kind === 'loop') {
        if(n.mutation){result.mutations??=[];if(!result.mutations.some(r=>r.from===n.mutation!.from&&r.to===n.mutation!.to))result.mutations.push(n.mutation);}
        if(n.period!==undefined){if(result.period!==undefined)fail(n,'Only one recurring root loop is supported.');result.period=n.period;}
        // A timed root loop can restart while its preceding notes still sound.
        const firstScopedEvent=result.events.length;
        const apomicticScope=apomicticScopeDepth===0&&n.scoped&&!n.mutation&&n.nodes[0]?.kind==='control'&&n.nodes[0].operator==='A';
        let loopEnd = base;
        const previous={count,mu,spread,growthMode,control,sequenceMode,tuning,root,map,walk};
        const previousGate=inheritedGate;if(n.count>1)inheritedGate=undefined;
        if(apomicticScope)apomicticScopeDepth++;
        try{for (let i = 0; i < (n.count || 1); i++) loopEnd = emit(n.nodes, loopEnd, args, call, depth + 1);}
        finally{if(apomicticScope)apomicticScopeDepth--;inheritedGate=previousGate;if(n.scoped)({count,mu,spread,growthMode,control,sequenceMode,tuning,root,map,walk}=previous);}
        if(apomicticScope){const motif=result.events.slice(firstScopedEvent);alignApomicticMotif(motif,motif[0]?.growthInstance);loopEnd=Math.max(loopEnd,...motif.map(e=>e.t+e.dur));}
        finish = Math.max(finish, loopEnd); continue;
      }
      const sequenceFields=['freq','pan','volume','filter','chop','index'] as const;
      const fields=sequenceFields.filter(key=>n[key]?.sequence);
      if(fields.length){
        const draw=sequenceDraw++;if(n.durationRange)result.randomTimeSource=source;
        const name=(call as Range&{name?:string})?.name;
        const rotation=futures.filter(f=>f.name===name).reduce((sum,f)=>sum+Math.min(f.count,Math.floor((elapsed+base+1e-9)/f.every))*f.shift,0);
        const lists=fields.map(key=>({key,leaves:sequenceLeaves(n[key]!.sequence!,n.duration,sequenceMode==='spatial',rotation)}));
        const lengths=lists.map(l=>Math.round((l.leaves.at(-1)!.at+l.leaves.at(-1)!.dur)/n.duration));
        const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;const steps=lengths.reduce((a,b)=>a*b/gcd(a,b),1);if(steps>128)fail(n,'Combined sequence period exceeds 128 steps.');const stepDurations=Array.from({length:steps},(_,i)=>n.durationChoices?n.durationChoices[Math.min(n.durationChoices.length-1,Math.floor(durationForCycle([0,n.durationChoices.length],result.seed,100000+draw*128+i,cycle)))]:n.durationRange?durationForCycle(n.durationRange,result.seed,100000+draw*128+i,cycle):n.durationEnd===undefined?n.duration:n.duration+(n.durationEnd-n.duration)*(steps===1?0:i/(steps-1)));const boundaries=[0];for(const d of stepDurations)boundaries.push(boundaries.at(-1)!+d);const warp=(time:number)=>{const step=time/n.duration,index=Math.min(steps-1,Math.floor(step+1e-9));return step>=steps?boundaries[steps]:boundaries[index]+(step-index)*stepDurations[index];};const duration=boundaries[steps];
        const times=[...new Set(lists.flatMap((l,index)=>Array.from({length:steps/lengths[index]},(_,repeat)=>l.leaves.map(v=>Number((v.at+repeat*lengths[index]*n.duration).toFixed(12)))).flat()))].sort((a,b)=>a-b);
        const first=result.events.length;
        for(let slot=0;slot<times.length;slot++){
          const rawTime=times[slot],time=warp(rawTime),end=slot+1<times.length?warp(times[slot+1]):duration;let rest=false;
          const copy={...n,...(n.lyrics?{lyrics:{...n.lyrics,from:time/duration,to:end/duration}}:{}),offset:0,duration:end-time,durationRange:undefined,durationChoices:undefined,durationEnd:undefined};
          for(const {key,leaves} of lists){const span=leaves.at(-1)!.at+leaves.at(-1)!.dur,local=rawTime%span,leaf=[...leaves].reverse().find(v=>v.at<=local+1e-9)!;if(leaf.rest){rest=true;break;}let value=leaf.parameter===undefined?leaf.value!:args[leaf.parameter]-(leaf.degree?1:0);if(leaf.parameter!==undefined&&(!Number.isFinite(value)||leaf.degree&&(!Number.isInteger(value)||value<0)))fail(n,'Sequence arguments require a finite value, or a positive integer pitch/table position.');if(leaf.random){result.randomTimeSource=source;const defaults:[number,number]=key==='freq'?(leaf.degree?[1,(tuning??parseTuning('12')).cents.length]:[55,1760]):key==='pan'?[-1,1]:key==='index'?[0,20]:[0,9],bounds:[number,number]=leaf.randomBounds?[leaf.randomOpen?.[0]?defaults[0]:leaf.randomBounds[0],leaf.randomOpen?.[1]?defaults[1]:leaf.randomBounds[1]]:defaults,choices=leaf.randomChoices,values=choices??bounds;
            if((!choices&&bounds[0]>bounds[1])||!values.every(Number.isFinite))fail(n,'Random bounds must be ordered and finite.');const id=200000+draw*16384+slot*16+sequenceFields.indexOf(key);
            if(leaf.degree&&(values.some(v=>!Number.isInteger(v)||v<1)))fail(n,'Random pitch positions use positive integers.');
            const domain=key==='freq'&&!leaf.degree?[20,20000]:key==='pan'?[-1,1]:key==='index'?[0,20]:key==='freq'?[1,Infinity]:[0,9];if(values.some(v=>v<domain[0]||v>domain[1]))fail(n,'Random cell values are outside the parameter range.');
            value=choices?choices[Math.min(choices.length-1,Math.floor(durationForCycle([0,choices.length],result.seed,id,cycle)))]:key==='freq'&&!leaf.degree?frequencyForCycle(bounds,result.seed,id,cycle):durationForCycle(leaf.degree?[bounds[0],bounds[1]+1]:bounds,result.seed,id,cycle);if(leaf.degree)value=choices?value-1:Math.min(bounds[1],Math.floor(value))-1;
          }
            if(key==='freq'){if(leaf.degree){try{value=degreeHz(value,tuning??parseTuning('12'),root)*2**(leaf.octave??0);}catch(error){fail(n,error instanceof Error?error.message:String(error));}}else if(tuning)value=quantizeHz(value,tuning,root);}
            copy[key]={value};
          }
          if(rest)continue;
          const start=result.events.length;emit([copy],base+n.offset+time,args,call,depth+1);
          for(const event of result.events.slice(start)){event.sequence={mode:sequenceMode,step:n.duration,length:duration/n.duration,slot:rawTime/n.duration,name};event.soundRange={from:n.from,to:n.to};}
        }
        const events=result.events.slice(first);
        if(sequenceMode==='continuous'&&events.length&&!growthMode){
          const firstEvent=events[0],start=base+n.offset;const merged={...firstEvent,...(n.lyrics?{lyrics:n.lyrics}:{}),t:start,dur:duration,sequence:{...firstEvent.sequence!,slot:undefined}};
          for(const key of fields){const points=events.map(e=>({time:e.t-start,value:key==='chop'?e.chop??0:(e[key] as Ramp|undefined)?.start??0}));if(!points.length)continue;const values=events.map(e=>key==='chop'?e.chop??0:(e[key] as Ramp|undefined)?.start);
            if(values.some(v=>v===undefined))continue;const ramp=stepped(points,duration);if(key==='chop'){merged.chop=ramp.start;merged.chopRamp=ramp;}else (merged as unknown as Record<string,unknown>)[key]=ramp;
          }
          if(events[0].t>start||events.some((e,i)=>i&&e.t>events[i-1].t+events[i-1].dur+1e-9)){const points=[{time:0,value:0}];for(const e of events){points.push({time:e.t-start,value:e.volume.start},{time:e.t-start+e.dur,value:0});}merged.volume=stepped(points,duration);}
          if(n.gateExplicit)for(const key of ['freq','pan','volume','filter','delay','index','modulation','chop','reverb'] as const){if(!n[key]?.followGate)continue;const field=key==='chop'?'chopRamp':key==='reverb'?'reverbRamp':key,ramp=merged[field] as Ramp|undefined;if(ramp)(merged as unknown as Record<string,unknown>)[field]={...ramp,duration,...(ramp.points?{points:ramp.points.map(p=>({...p,time:ramp.duration?p.time*duration/ramp.duration:0}))}:{})};}
          if(n.wet?.followGate&&merged.vocoderMix)merged.vocoderMix={...merged.vocoderMix,duration};
          merged.id=first;result.events.splice(first,events.length,merged);
        }
        finish=Math.max(finish,base+n.offset+duration);continue;
      }
      const range = call || n;
      const freq = resolve(n.freq, args, n), volume = resolve(n.volume, args, n), pan = resolve(n.pan, args, n);
      if ([volume.start,volume.end,...(volume.points?.map(point=>point.value)||[])].some(value=>value<0||value>9)) fail(n, 'Volume endpoints must be between 0 and 9.');
      if ([pan.start, pan.end].some(v => v < -1 || v > 1)) fail(n, 'Pan must be between -1 and 1.');
      if (n.wave === 'n'||n.wave==='i' ? freq.start < 1 || freq.start > (n.wave==='i'?8:3) || freq.start !== freq.end || !Number.isInteger(freq.start) : [freq.start, freq.end].some(v => v < 20 || v > 20000)) fail(n, n.wave==='i'?'Input channel must be an integer from 1 to 8.':n.wave === 'n' ? 'Noise variants: n1 white, n2 pink, n3 brown.' : 'Frequency must be between 20 and 20000 Hz.');
      const reverb=resolve(n.reverb,args,n),chop=n.chop&&resolve(n.chop,args,n);if([reverb.start,reverb.end].some(v=>v<0||v>9)||chop&&[chop.start,chop.end].some(v=>v<0||v>9))fail(n,'Reverb r and chopper h must be 0–9.');
      const delay=n.delay&&resolve(n.delay,args,n);if(delay&&[delay.start,delay.end].some(v=>v<MIN_DELAY_SECONDS||v>MAX_DELAY_SECONDS))fail(n,'Delay d must be 0.001–9 seconds.');
      const filter=n.filter&&resolve(n.filter,args,n);
      if(filter&&[filter.start,filter.end].some(v=>v<0||v>9))fail(n,'Filter f must be 0–9.');
      const modulation = n.modulation && resolve(n.modulation, args, n);
      if((n.wave==='n'||n.wave==='i')&&modulation)fail(n,'FM with a noise carrier is not implemented. Use s, t, a or q.');
      const wet=n.lyrics?.vocoder?resolve(n.wet??{value:9},args,n):undefined;if(wet&&[wet.start,wet.end].some(v=>v<0||v>9))fail(n,'Vocoder blend w must be 0–9.');
      const index=resolve(n.index,args,n);if([index.start,index.end].some(value=>value<0||value>20))fail(n,'FM index i must be between 0 and 20.');
      if (modulation && [modulation.start,modulation.end].some(v=>v<.1||v>12000)) fail(n,'FM modulator frequency must be 0.1–12000 Hz.');
      const add = (time: number, node?: NoteEvent['node']) => {
        const duration=n.durationChoices?n.durationChoices[Math.min(n.durationChoices.length-1,Math.floor(durationForCycle([0,n.durationChoices.length],result.seed,result.events.length,cycle)))]:n.durationRange?durationForCycle(n.durationRange,result.seed,result.events.length,cycle):n.duration;
        if (result.events.length >= MAX_EVENTS) fail(n, `Score exceeds the ${MAX_EVENTS}-event budget.`);
        const ratio = node && !map && n.wave !== 'n'&&n.wave!=='i' ? 2 ** (((node.y + 1) * 12) / 12) : 1;
        const randomRange=n.freqRange?.map(f=>Math.min(20000,f*ratio)) as [number,number]|undefined;
        const randomEndRange=n.freqEndRange?.map(f=>Math.min(20000,f*ratio)) as [number,number]|undefined;
        const e: NoteEvent = { ...range, id: result.events.length, t: time, dur: duration,...(n.lyrics?{lyrics:n.lyrics}:{}),...(n.durationRange?{durationRange:n.durationRange}:{}),...(n.durationChoices?{durationChoices:n.durationChoices}:{}), ...(n.wave==='i'?{inputChannel:freq.start}:{}),wave:n.waveOptions?timbreForCycle(n.waveOptions,result.seed,result.events.length,0):n.wave,...(n.waveOptions?{waveOptions:n.waveOptions}:{}),
          ...(randomRange?{freqRange:randomRange}:{}),...(randomEndRange?{freqEndRange:randomEndRange}:{}),...(n.freqRandomSweep?{freqRandomSweep:true,freqSweepFollowsGate:n.freqSweepFollowsGate}:{}),
          freq: { ...freq, start: Math.min(20000, freq.start * ratio), end: Math.min(20000, freq.end * ratio) },
          volume:n.wave==='i'?{...volume,start:volume.start*(inputGains[freq.start]??1),end:volume.end*(inputGains[freq.start]??1),points:volume.points?.map(p=>({...p,value:p.value*(inputGains[freq.start]??1)}))}:volume, pan: node&&!map&&!n.panExplicit ? { start: node.x, end: node.x, duration: 0 } : pan,
          ...(n.spatial?{spatial:resolveSpatial(n.spatial,args,n,duration)}:node&&result.room&&result.speakers&&!n.panExplicit?{spatial:{mode:'xyz' as const,values:[node.x,node.y,node.z].map(value=>({start:value,end:value,duration:0}))}}:{}),envelope: n.envelope,...(wet?{vocoderMix:n.wet?.followGate?{...wet,duration}:wet}:{}),delay, filter, chop:chop?.start,...(chop?.duration?{chopRamp:chop}:{}), reverb:Math.max(reverb.start,reverb.end),...(reverb.duration?{reverbRamp:reverb}:{}), modulation, modulatorWave:n.modulatorWave, index, traces: control ? [control, range] : [range], node,...(node?{axisMap:map??'pov',axisHolds:(map??'pov').split('').map((target,axis,targets)=>target!=='_'&&targets.lastIndexOf(target)!==axis?'overridden':target==='p'&&n.panExplicit?'manual':target==='o'&&(n.wave==='n'||n.wave==='i')?'noise/input':target==='g'&&(n.wave==='n'||n.wave==='i')?'noise/input':target==='i'&&!modulation&&!(map??'pov').includes('g')?'no FM':'')} :{}),soundRange:{from:n.from,to:n.to},...(n.panRandom?{panRandom:n.panRandom}:{}) };
        if(node){
          const route=map??'pov',routedVolume=e.volume;
          for(let axis=0;axis<3;axis++){const coordinate=[node.x,node.y,node.z][axis],unit=(coordinate+1)/2,target=route[axis];
            const scalar=(value:number):Ramp=>({start:value,end:value,duration:0});
            if(target==='p'&&!n.panExplicit)e.pan=scalar(coordinate);else if(target==='o'&&n.wave!=='n'&&n.wave!=='i')e.freq={...e.freq,start:Math.min(12000,freq.start*2**(coordinate+1)),end:Math.min(12000,freq.end*2**(coordinate+1))};
            else if(target==='v')e.volume={...routedVolume,start:routedVolume.start*unit,end:routedVolume.end*unit,points:routedVolume.points?.map(p=>({...p,value:p.value*unit}))};
            else if(target==='g'&&n.wave!=='n'&&n.wave!=='i')e.generatorMix=Math.max(0,Math.min(9,unit*9));else if(target==='r'){e.reverb=unit*9;e.reverbRamp=undefined;}else if(target==='f')e.filter=scalar(unit*9);else if(target==='h'){e.chop=unit*9;e.chopRamp=undefined;}else if(target==='d')e.delay=scalar(.001*8000**unit);else if(target==='i')e.index=scalar(unit*20);
          }
        }
        if(node&&tuning&&n.wave!=='n'&&n.wave!=='i'){e.freq={...e.freq,start:quantizeHz(e.freq.start,tuning,root),end:quantizeHz(e.freq.end,tuning,root)};}
        if(node?.capsule&&e.modulation){const start=e.freq.start/freq.start,end=e.freq.end/freq.end;e.modulation={...e.modulation,start:Math.min(12000,e.modulation.start*start),end:Math.min(12000,e.modulation.end*end),points:e.modulation.points?.map(p=>({...p,value:Math.min(12000,p.value*start)}))};}
        const fit=(r:Ramp,s:Setting|undefined):Ramp=>n.gateExplicit&&s?.followGate?{...r,duration,...(r.points?{points:r.points.map(p=>({...p,time:r.duration?p.time*duration/r.duration:0}))}:{})}:r;
        e.freq=fit(e.freq,n.freq);e.volume=fit(e.volume,n.volume);e.pan=fit(e.pan,n.pan);e.index=fit(e.index,n.index);
        if(e.filter)e.filter=fit(e.filter,n.filter);if(e.delay)e.delay=fit(e.delay,n.delay);if(e.modulation)e.modulation=fit(e.modulation,n.modulation);if(e.chopRamp)e.chopRamp=fit(e.chopRamp,n.chop);if(e.reverbRamp)e.reverbRamp=fit(e.reverbRamp,n.reverb);
        if(randomRange||randomEndRange)e.freq=frequencyRampForCycle(e,result.seed,cycle);
        if(n.panRandom)e.pan=panForCycle(pan,n.panRandom,result.seed,e.id,cycle,duration);
        if (time + (n.durationRange?.[1]??duration) > MAX_TIME_SECONDS) fail(n, 'Cycle exceeds the 86400-second budget.');
        result.events.push(e); finish = Math.max(finish, time + duration);
      };
      if(n.wave==='i'&&growthMode)fail(n,'Keep input channels beside growth voices, in a separate expression.');
      if (growthMode) {
        const instance=growthInstance++,firstGrowthEvent=result.events.length;
        const generator = createGenerator(growthMode, { mu, spread, cap: 512, seeds: 2 }, result.seed);
        const born:{node:NonNullable<NoteEvent['node']>;generation:number}[]=[];
        for(let i=0;i<count;i++){const step=generator.step();for(const node of step.born)born.push({node:{...node},generation:i});}
        const ordered=traverseNodes(born.map(n=>n.node),walk);
        for(let i=0;i<ordered.length;i++){const node=ordered[i],generation=walk==='born'?born.find(b=>b.node.id===node.id)!.generation:i;add(base+n.offset+generation*Math.max(.06,n.duration*.8),node);}
        const cells=result.events.slice(firstGrowthEvent);for(const event of cells)event.growthInstance=instance;
        if(growthMode==='apomixis'&&!apomicticScopeDepth)alignApomicticMotif(cells);
      } else add(base + n.offset);
    }
    return finish;
  };
  try {
    const reader = new Reader(source); const ast = reader.nodes();
  const rooms=ast.filter((n):n is Ast&{kind:'room'}=>n.kind==='room');if(rooms.length>1)fail(rooms[1],'Declare one room per score.');if(rooms.length)result.room=rooms[0].room;
  const presetNodes=ast.filter((n):n is Ast&{kind:'speakerPreset'}=>n.kind==='speakerPreset');
  const layoutNodes=ast.filter((n):n is Ast&{kind:'speakers'}=>n.kind==='speakers');
  if(layoutNodes.length+presetNodes.length>1)fail(layoutNodes[1]??presetNodes[0],'Declare one speaker layout per score.');if(presetNodes.length){const p=speakerPreset(presetNodes[0].key,result.room);result.speakers=p.speakers;result.speakerLayout={key:p.key,name:p.name,family:p.family,channelMask:p.channelMask};}
  if(layoutNodes.length){result.speakers=layoutNodes[0].speakers.map(s=>layoutNodes[0].compact&&result.room?{...s,x:s.x*result.room[0]/2,y:s.y*result.room[1]/2,z:s.z*result.room[2]/2}:{...s});}

    if (reader.p < source.length) throw new SyntaxIssue(reader.p, reader.p + 1, 'Unexpected closing parenthesis.');
    for(const n of ast)if(n.kind==='config'&&n.future){if(!ast.some(a=>a.kind==='definition'&&a.name===n.future!.name))fail(n,'Future target must be a named expression.');futures.push(n.future);}
    const scoreEnd=emit(ast, 0);if(result.events.some(e=>e.feedbackBus!==undefined&&e.spatial))fail(result.events.find(e=>e.feedbackBus!==undefined&&e.spatial)!,'Place spatial p on an outer bus around the feedback circuit, not on its internal excitation.');if(usedGrowthModes.size>1)result.generator='mixed';
    result.events.sort((a,b) => a.t - b.t || a.id - b.id);
    if(result.period!==undefined){
      if(ast.filter(n=>!['view','config','control','definition','speakers','speakerPreset','room','title'].includes(n.kind)).length!==1)fail({from:0,to:source.length},'A timed root loop must contain all musical actions.');
      if(result.feedback.length||result.outputBuses.length)fail({from:0,to:source.length},'Timed recurrence of feedback circuits is not supported yet.');
      if(result.events.some(e=>e.envelope!=='off'))fail({from:0,to:source.length},'Timed overlapping recurrence currently requires e0; shape the voice with v instead.');
      if(result.events.some(e=>e.t>=result.period!))fail({from:0,to:source.length},'Recurring note onsets must be before the loop period.');
      if(result.events.reduce((sum,e)=>sum+Math.ceil((e.durationRange?.[1]??e.dur)/result.period!),0)>48)fail({from:0,to:source.length},'Recurring overlap exceeds 48 voices.');
    }
    if (!result.events.length && !allowSilence) throw new SyntaxIssue(0, Math.min(1, source.length), 'Write a sound, e.g. s220\'1.');
    const boundaries=result.events.flatMap(e=>[{t:e.t,delta:1},{t:e.t+(e.durationRange?.[1]??e.dur),delta:-1}]).sort((a,b)=>a.t-b.t||a.delta-b.delta);
    let polyphony=0;for(const boundary of boundaries){polyphony+=boundary.delta;if(polyphony>48)throw new SyntaxIssue(0,Math.min(1,source.length),'Score exceeds 48 simultaneous voices.');}
    if(result.events.some(e=>e.durationRange)||futures.length)result.randomTimeSource=source;
    result.duration = Math.max(scoreEnd,...result.events.map(e => e.t + e.dur),...result.feedback.map(c=>c.t+c.dur),...result.outputBuses.map(b=>b.t+b.dur));
    result.sections?.sort((a,b)=>a.t-b.t||a.from-b.from);result.tempos?.sort((a,b)=>a.t-b.t||a.from-b.from);
    return result;
  } catch (e) {
    if (!(e instanceof SyntaxIssue)) throw e;
    return { ...result, events: [],feedback:[],outputBuses:[],period:undefined, duration: 0, diagnostics: [{ from: e.from, to: e.to, message: e.message }] };
  }
}
export async function sha256(text: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function eventData(score: CompiledScore) {
  const busData=(index:number):unknown=>{const {id,from,to,parent,...bus}=score.outputBuses[index];return {...bus,...(parent!==undefined?{parent:busData(parent)}:{})};};
  return score.events.map(({id,from,to,traces,node,gateLevel,soundRange,growthInstance,axisMap,axisHolds,lSegment,symbol,generation,symbolIndex,lSystemIndex,originId,feedbackBus,outputBus,...musical})=>{
    let feedback;
    if(feedbackBus!==undefined){const {id,from,to,outputBus,...c}=score.feedback[feedbackBus];feedback={...c,...(outputBus!==undefined?{outputBus:busData(outputBus)}:{})};}
    return {...musical,...(score.room?{room:score.room}:{}),...(score.speakerLayout?{speakerLayout:score.speakerLayout}:{}),...(score.speakers?{speakers:score.speakers}:{}),...(score.period!==undefined?{period:score.period}:{}),...(feedback?{feedback}:{}),...(outputBus!==undefined?{outputBus:busData(outputBus)}:{})};
  });
}
