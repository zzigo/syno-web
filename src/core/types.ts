import type { LSystemTrace } from './lsystem';
import type { VisualMode } from './visualization';
export interface Range { from: number; to: number }
export interface Diagnostic extends Range { message: string }
export type Wave = 's' | 't' | 'a' | 'q' | 'n' | 'i';
export interface Ramp { start: number; end: number; duration: number; exponential?:boolean;step?:boolean; points?:{time:number;value:number}[] }
export interface GrowthNode { id: number; parent: number | null; x: number; y: number; z: number; kind: string;born?:number;capsule?:import('./apomixis').Capsule }
export interface BusEffect {spatial?:import('./spatial').SpatialPan;kind:'reverb'|'chop'|'delay'|'volume'|'pan'|'filter';value:number;ramp?:Ramp}
export interface OutputBus extends Range {id:number;t:number;dur:number;tail:number;effects:BusEffect[];volume:Ramp;parent?:number}
export interface FeedbackCircuit extends Range { id:number;t:number;dur:number;outputBus?:number;delay:Ramp;delayRight?:Ramp;gain:Ramp;gainRight?:Ramp;filter:Ramp;volume:Ramp;cross:number;crossRamp?:Ramp;band?:{frequency:[Ramp,Ramp];rq:[number,number];rqRamps?:[Ramp,Ramp];drive:Ramp} }
export interface PanRandom {start?:[number,number];end?:[number,number];sweep:boolean;followDuration:boolean}
export interface NoteEvent extends Range {
  restGates?:{key:number;chance:number}[];
  spatial?:import('./spatial').SpatialPan;
  lyrics?:{text:string;vocoder:boolean;captions?:boolean;from?:number;to?:number};
  inputChannel?:number;sequence?:{mode:'continuous'|'articulated'|'spatial';step:number;length:number;slot?:number;name?:string};gateLevel?:number;panRandom?:PanRandom;soundRange?:Range;
  feedbackBus?:number;outputBus?:number;waveOptions?:Wave[];freqRange?:[number,number];freqEndRange?:[number,number];freqRandomSweep?:boolean;freqSweepFollowsGate?:boolean;durationRange?:[number,number];durationChoices?:number[];originId?:number;
  axisMap?:string;axisHolds?:string[];generatorMix?:number;growthInstance?:number; lSegment?:number; symbol?:string; generation?:number; symbolIndex?:number; lSystemIndex?:number;
  id: number; t: number; dur: number; freq: Ramp; pan: Ramp;
  wave: Wave; volume: Ramp; envelope: string; reverb: number;delay?:Ramp; filter?: Ramp; chop?: number;chopRamp?:Ramp;reverbRamp?:Ramp;
  vocoderMix?:Ramp;modulation?: Ramp; modulatorWave?: Exclude<Wave,'n'|'i'>; index: Ramp; traces: Range[]; node?: GrowthNode;
}
export interface ScoreSection extends Range {name:string;t:number;implicit?:boolean;definition?:Range}
export interface ScoreTempo extends Range {bpm:number;t:number}
export interface CompiledScore { speakerLayout?:{key:string;name:string;family:string;channelMask:number}; room?:import('./spatial').Room; speakers?:import('./spatial').Speaker[]; title?:string; sections?:ScoreSection[]; tempos?:ScoreTempo[]; playbackRange?:{index:number;from:number;to:number}; events: NoteEvent[]; mutations?:import('./mutation').MutationRegion[];inputGains?:Record<number,number>;randomTimeSource?:string; feedback:FeedbackCircuit[];outputBuses:OutputBus[]; period?:number; duration: number; canonical: string; seed: number; generator: string | null; visualization: VisualMode; viewMessages: Range[]; lSystems: (LSystemTrace & Range)[]; diagnostics: Diagnostic[] }
export type PodId = 'editor' | 'fold' | 'events' | 'agents' | 'help';
