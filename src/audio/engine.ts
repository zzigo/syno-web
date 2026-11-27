import {probabilisticSilence} from '../core/silence';
import {createSpatialPanner,connectStereoMonitor} from './spatial';
import {sectionScore} from '../core/sections';
import {LyricSpeech} from './lyric-speech';
import {lyricVocoder,lyricCarrier,vocoderBlend} from './lyric-vocoder';
import {generatorWaves} from './generator-morph';
import {chopClock} from './chop-clock';
import {adsrPoints} from '../core/envelope';
import {compile} from '../core/parser';
import {durationForCycle,panForCycle,frequencyRampForCycle,timbreForCycle} from '../core/timbre';
import {createEcho} from './delay';
import {createOutputBus} from './output-bus';
import {sliceRamp,rampPeak} from '../core/curves';
import {automateMapped,updateAutomation,automate,withAutomationSmoothing} from './automation';
import {createFeedbackCircuit} from './feedback';
import {filterHz,chopPeriod,chopCurve,echoTail,reverbSeconds,reverbMix} from './effects';
import { rng } from '../vendor/fold-generators.js';
import type { CompiledScore, NoteEvent, Ramp } from '../core/types';

export class AudioEngine {
  private speech=new LyricSpeech();private lyricBuffers=new Map<string,AudioBuffer>();
  onVoiceStatus?:(message:string)=>void;
  private lyricsReady(score:CompiledScore){return score.events.every(e=>!e.lyrics||this.lyricBuffers.has(e.lyrics.text));}
  private async prepareLyrics(score:CompiledScore){
    const texts=[...new Set(score.events.flatMap(e=>e.lyrics?[e.lyrics.text]:[]))];
    for(const [index,text] of texts.entries()){
      if(this.lyricBuffers.has(text))continue;
      this.onVoiceStatus?.(`Voice ${index+1}/${texts.length} · preparing`);
      const audio=await this.speech.synthesize(text,message=>this.onVoiceStatus?.(`Voice ${index+1}/${texts.length} · ${message.replace(/^Voice · /,'')}`));
      const buffer=this.context!.createBuffer(1,audio.samples.length,audio.sampleRate);buffer.getChannelData(0).set(audio.samples);
      if(this.lyricBuffers.size>=24)this.lyricBuffers.delete(this.lyricBuffers.keys().next().value!);this.lyricBuffers.set(text,buffer);
    }
  }

  context?: AudioContext;private inputStream?:MediaStream;private inputNodes:AudioNode[]=[];private inputChannels:GainNode[]=[];
  private master?: GainNode;private graph?:GainNode;private spatialNodes:AudioNode[]=[];private offline=false;
  lastEditMode:'loop'|'write'='loop';
  get pendingUpdate(){return !!this.queuedScore||this.editCommits.length>0;}
  private liveScore(score:CompiledScore){if(!score.playbackRange&&this.score?.playbackRange&&this.score.playbackRange.index>=0){try{score=sectionScore(score,this.score.playbackRange.index);}catch{score={...score,playbackRange:{index:-1,from:0,to:score.duration}};}}return score.events.length?score:{...score,duration:Math.max(score.duration,this.score?.period??this.score?.duration??1,.001)};}
  queueUpdate(score:CompiledScore){if(JSON.stringify([this.score?.speakers,this.score?.room])!==JSON.stringify([score.speakers,score.room])){this.lastError='Press Play to apply a changed speaker layout.';return false;}if(!this.running||score.diagnostics.length)return false;if(!this.lyricsReady(score)){this.lastError='Press Play to prepare changed lyrics.';return false;}this.queuedScore=this.liveScore(score);return true;}
  cancelQueuedUpdate(){this.queuedScore=undefined;}
  private analyser?: AnalyserNode;private compressor?:DynamicsCompressorNode;
  private sharedReverbs=new Map<AudioNode,Map<string,{input:GainNode;nodes:AudioNode[];end:number}>>();
  lateEvents=0;lastError='';private meterAt=-1;private meterPeak=0;private badSamples=0;private meterData=new Float32Array(256);
  private timer?: ReturnType<typeof setInterval>;
  private voices = new Set<{ source: AudioScheduledSourceNode; gain: GainNode; nodes: AudioNode[];event:NoteEvent;at:number;instance:number;age:number;cycle:number;gateAt:(now:number)=>number;update:(next:NoteEvent,now:number,age:number)=>void }>();
  private tails=new Set<AudioNode[]>();
  private circuitInstances=new Map<string,ReturnType<typeof createFeedbackCircuit>>();
  private outputInstances=new Map<string,ReturnType<typeof createOutputBus>>();
  private tasks:({t:number;bus:CompiledScore['outputBuses'][number]}|{t:number;event:NoteEvent}|{t:number;circuit:CompiledScore['feedback'][number]})[]=[];
  private serial=0;
  private randomSource?:string;private cycleAt=0;private sourceOffset=0;
  private windows:{at:number;cycle:number;score:CompiledScore}[]=[];
  failure='';
  hotEditSeconds=1;queuedScore?:CompiledScore;editRevision=0;private editCommits:number[]=[];
  private windowAt(now:number){for(let i=this.windows.length-1;i>=0;i--)if(this.windows[i].at<=now)return this.windows[i];return undefined;}
  private compileCycle(cycle:number){const score=compile(this.randomSource!,this.score!.seed,cycle,Math.max(0,(this.windows.find(w=>w.cycle===cycle)?.at??this.cycleAt)-this.startedAt));if(this.sourceOffset)score.events=score.events.map(e=>({...e,from:e.from+this.sourceOffset,to:e.to+this.sourceOffset,traces:e.traces.map(r=>({from:r.from+this.sourceOffset,to:r.to+this.sourceOffset}))}));return this.score?.playbackRange&&this.score.playbackRange.index>=0?sectionScore(score,this.score.playbackRange.index):score;}
  refreshSourceRanges(next:CompiledScore){
    next=this.liveScore(next);
    if(!this.randomSource||!next.randomTimeSource){this.score=next;return;}
    this.randomSource=next.randomTimeSource;
    const raw=compile(this.randomSource,next.seed);this.sourceOffset=next.events[0].from-(raw.events.find(e=>e.id===next.events[0].id)?.from??0);
    const plans=new Map<number,CompiledScore>();const plan=(cycle:number)=>{if(!plans.has(cycle))plans.set(cycle,this.compileCycle(cycle));return plans.get(cycle)!;};
    for(const window of this.windows)window.score=plan(window.cycle);
    this.score=plan(this.cycle);this.setTasks(this.score);
    for(const voice of this.voices){const e=plan(voice.cycle).events.find(e=>e.id===voice.event.id);if(e)voice.event={...voice.event,from:e.from,to:e.to,traces:e.traces,node:e.node,soundRange:e.soundRange};}
  }
  get currentScore(){if(!this.randomSource&&this.windows.length<=1)return this.score;const now=this.context?.currentTime??0;return this.windowAt(now)?.score??this.windows[0]?.score??this.score;}
  private setTasks(score:CompiledScore){this.tasks=[...score.outputBuses.map(bus=>({t:bus.t,bus})),...score.events.map(event=>({t:event.t,event})),...score.feedback.map(circuit=>({t:circuit.t,circuit}))].sort((a,b)=>a.t-b.t||('bus' in a?0:'circuit' in a?1:2)-('bus' in b?0:'circuit' in b?1:2)||('bus' in a&&'bus' in b?a.bus.id-b.bus.id:0));}

  get activeSourceIds(){const now=this.context?.currentTime??0;return [...this.voices].filter(v=>now>=v.at&&now<v.at+v.event.dur-v.age).map(v=>v.event.id);}
  private outputGate(event:NoteEvent,cycle:number,now:number){let id=event.feedbackBus===undefined?event.outputBus:this.score?.feedback[event.feedbackBus]?.outputBus,gain=1,limit=32;while(id!==undefined&&limit-->0){gain*=this.outputInstances.get(`${cycle}:${id}`)?.gateAt(now)??1;id=this.score?.outputBuses[id]?.parent;}return gain;}
  get visualEvents(){const now=this.context?.currentTime??0;return [...this.voices].filter(v=>now>=v.at&&now<v.at+v.event.dur-v.age).map(v=>({...v.event,id:v.instance,originId:v.event.id,t:v.at-this.startedAt-v.age,gateLevel:v.gateAt(now)*this.outputGate(v.event,v.cycle,now)}));}
  private impulses = new Map<string, AudioBuffer>();
  private index = 0; private cycle = 0;private nonLoopCycle=0; private startedAt = 0;
  private startVersion = 0;
  private finishAt=0;
  score?: CompiledScore;
  running = false; loop = true; volume = .6;
  droppedVoices = 0;
  get time() { return this.running && this.context ? Math.max(0, this.context.currentTime - this.startedAt) : 0; }
  get cycleTime() { if(!this.running)return 0;if(this.randomSource&&this.context){const now=this.context.currentTime,window=this.windowAt(now)??this.windows[0];return window?Math.max(0,Math.min(now-window.at,window.score.period??window.score.duration)):0;}const window=this.context?this.windowAt(this.context.currentTime):undefined;return window?Math.max(0,Math.min(this.context!.currentTime-window.at,window.score.period??window.score.duration)):0; }
  get level() {
    if (!this.analyser || !this.running) return 0;
    const values = this.meterData;this.analyser.getFloatTimeDomainData(values);
    return Math.min(1, Math.sqrt(values.reduce((a,b) => a+b*b,0)/values.length)*4);
  }
  get health(){const now=this.context?.currentTime??0;if(this.analyser&&now-this.meterAt>=.1&&typeof this.analyser.getFloatTimeDomainData==='function'){this.meterAt=now;this.analyser.getFloatTimeDomainData(this.meterData);this.meterPeak=0;for(const value of this.meterData){if(!Number.isFinite(value))this.badSamples++;else this.meterPeak=Math.max(this.meterPeak,Math.abs(value));}}
    return {state:this.context?.state??'idle',voices:this.voices.size,tails:this.tails.size,reverbs:[...this.sharedReverbs.values()].reduce((n,m)=>n+m.size,0),late:this.lateEvents,dropped:this.droppedVoices,peak:this.meterPeak,reduction:this.compressor?.reduction??0,invalid:this.badSamples,error:this.lastError};}
  private reverbSend(amount:number,destination:AudioNode,end:number){let sends=this.sharedReverbs.get(destination);if(!sends){sends=new Map();this.sharedReverbs.set(destination,sends);}const key=`${this.score!.seed}:${amount}`;let send=sends.get(key);if(!send){const input=this.context!.createGain(),reverb=this.context!.createConvolver();reverb.buffer=this.impulse(this.score!.seed,amount);input.connect(reverb).connect(destination);send={input,nodes:[input,reverb],end};sends.set(key,send);}send.end=Math.max(send.end,end);return send.input;}
  get inputReady(){return !!this.inputStream;}
  private ensureContext(){
    if (!this.context||this.context.state==='closed') {
      this.context = new AudioContext(); this.master = this.context.createGain();
      const limiter = this.context.createDynamicsCompressor();this.compressor=limiter;
      limiter.threshold.value = -12; limiter.knee.value = 12; limiter.ratio.value = 12;
      this.analyser = this.context.createAnalyser(); this.analyser.fftSize = 256;
      const ceiling=this.context.createWaveShaper(),curve=new Float32Array(8193);for(let i=0;i<curve.length;i++)curve[i]=Math.max(-.95,Math.min(.95,i/(curve.length-1)*2-1));ceiling.curve=curve;
      this.master.connect(limiter).connect(ceiling).connect(this.analyser).connect(this.context.destination);
    }
  }
  private groupedEmitter(id:number|undefined){let limit=32;while(id!==undefined&&limit-->0){const bus=this.score?.outputBuses[id];if(!bus)break;if(bus.effects.some(e=>e.kind==='pan'))return true;id=bus.parent;}return false;}
  private inputPlacement(id:number|undefined){return this.score?.speakers&&this.groupedEmitter(id)?{mode:'outputs' as const,values:this.score.speakers.map((_,i)=>({start:i===0?9:0,end:i===0?9:0,duration:0}))}:undefined;}
  private voicePlacement(event:NoteEvent){return event.spatial??(event.pan.start===0&&event.pan.end===0?this.inputPlacement(event.outputBus):undefined);}
  private connectGraph(score:CompiledScore){
    if(score.speakers){this.graph!.channelCount=score.speakers.length;this.graph!.channelCountMode='explicit';this.graph!.channelInterpretation='discrete';this.spatialNodes.push(...connectStereoMonitor(this.context!,this.graph!,score.speakers,this.master!));}
    else this.graph!.connect(this.master!);
  }
  /** Same scheduling/DSP as live playback; exactly one written execution plus effect tails. */
  async render(score:CompiledScore,spatial:boolean,volume=.6,onProgress?:(message:string)=>void){
    if(score.diagnostics.length||!score.events.length)throw Error('Render needs a valid, nonempty score.');
    if(score.events.some(e=>e.inputChannel))throw Error('Live input cannot be rendered offline. Record the input first.');
    if(spatial&&!score.speakers)throw Error('Spatial output needs a !spk speaker layout.');
    const busTail=Math.max(0,...score.outputBuses.filter(b=>b.parent===undefined).map(b=>b.tail));
    const tail=Math.max(0,...score.events.map(e=>reverbSeconds(e.reverb)+(e.delay?echoTail(rampPeak(e.delay)):0)),...score.feedback.map(c=>rampPeak(c.delay)*12));
    const duration=score.duration+tail+busTail+.05,channels=spatial?score.speakers!.length:2,sampleRate=48000,frames=Math.ceil(duration*sampleRate);
    if(frames*channels*4>384*1024*1024)throw Error('Render exceeds the 384 MiB audio buffer limit. Render a shorter section.');
    const context=new OfflineAudioContext(channels,frames,sampleRate),renderer=new AudioEngine();
    // Only shared BaseAudioContext DSP methods are used on this isolated renderer.
    renderer.context=context as unknown as AudioContext;renderer.offline=true;renderer.score=score;renderer.running=true;renderer.onVoiceStatus=onProgress;
    renderer.master=context.createGain();renderer.master.gain.value=volume;renderer.graph=context.createGain();
    if(spatial){renderer.graph.channelCount=channels;renderer.graph.channelCountMode='explicit';renderer.graph.channelInterpretation='discrete';renderer.graph.connect(renderer.master).connect(context.destination);}
    else {renderer.connectGraph(score);const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=12;const ceiling=context.createWaveShaper(),curve=new Float32Array(8193);for(let i=0;i<curve.length;i++)curve[i]=Math.max(-.95,Math.min(.95,i/(curve.length-1)*2-1));ceiling.curve=curve;renderer.master.connect(limiter).connect(ceiling).connect(context.destination);}
    try{
      await renderer.prepareLyrics(score);renderer.setTasks(score);
      for(const task of renderer.tasks){
        const output=(id:number|undefined):AudioNode=>id===undefined?renderer.graph!:renderer.outputInstances.get(`0:${id}`)!.input;
        if('bus' in task)renderer.outputInstances.set(`0:${task.bus.id}`,createOutputBus(context,task.bus,task.t,output(task.bus.parent),amount=>renderer.impulse(score.seed,amount),score.speakers,score.room));
        else if('circuit' in task){let dest=output(task.circuit.outputBus);if(score.speakers){const p=createSpatialPanner(context,score.speakers,renderer.inputPlacement(task.circuit.outputBus),{start:0,end:0,duration:0},task.t,task.circuit.dur,1,score.room);p.output.connect(dest);renderer.spatialNodes.push(...p.nodes);dest=p.input;}renderer.circuitInstances.set(`0:${task.circuit.id}`,createFeedbackCircuit(context,task.circuit,task.t,dest));}
        else renderer.schedule(task.event,task.t,task.event.feedbackBus===undefined?output(task.event.outputBus):renderer.circuitInstances.get(`0:${task.event.feedbackBus}`)!.input);
      }
      onProgress?.('Rendering audio…');const buffer=await context.startRendering();return {buffer,duration,tailSeconds:tail+busTail+.05};
    }finally{renderer.running=false;renderer.speech.dispose();renderer.outputInstances.forEach(b=>b.dispose());renderer.circuitInstances.forEach(c=>c.dispose());renderer.spatialNodes.forEach(n=>n.disconnect());}
  }
  async captureAudio(){this.ensureContext();await this.context!.resume();const destination=this.context!.createMediaStreamDestination();this.analyser!.connect(destination);return {stream:destination.stream,dispose:()=>{this.analyser?.disconnect(destination);for(const track of destination.stream.getTracks())track.stop();}};}
  async start(score: CompiledScore) {
    if (score.diagnostics.length || !score.events.length) throw new Error('Cannot play an invalid score.');
    this.stop();this.queuedScore=undefined; const requestVersion=this.startVersion;
    this.ensureContext();if(!this.context)throw Error('Audio context unavailable.');
    await this.context.resume();
    if(requestVersion!==this.startVersion)return false;
    try{await this.prepareLyrics(score);}catch(error){if(requestVersion!==this.startVersion)return false;throw error;}
    if(requestVersion!==this.startVersion)return false;
    if(score.events.some(e=>e.inputChannel)){
      if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphone input requires HTTPS and browser audio capture support.');
      const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:{ideal:8},echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      if(requestVersion!==this.startVersion){stream.getTracks().forEach(t=>t.stop());return false;}
      const channels=stream.getAudioTracks()[0]?.getSettings().channelCount??1,max=Math.max(...score.events.map(e=>e.inputChannel??1));
      if(max>channels){stream.getTracks().forEach(t=>t.stop());throw Error(`Input has ${channels} channel(s); i${max} is unavailable.`);}
      this.inputStream=stream;const input=this.context.createMediaStreamSource(stream),split=this.context.createChannelSplitter(channels);input.connect(split);this.inputNodes=[input,split];this.inputChannels=Array.from({length:channels},(_,i)=>{const gain=this.context!.createGain();split.connect(gain,i);this.inputNodes.push(gain);return gain;});
    }

    this.graph=this.context.createGain();this.graph.gain.value=1;this.connectGraph(score);
    this.setTasks(score);
    this.failure='';this.lastError='';this.lateEvents=0;this.badSamples=0;this.meterAt=-1;this.randomSource=score.randomTimeSource;this.sourceOffset=0;if(this.randomSource){const raw=compile(this.randomSource,score.seed);this.sourceOffset=score.events[0].from-(raw.events.find(e=>e.id===score.events[0].id)?.from??0);}this.serial=0;this.score = score; this.index = 0; this.cycle = 0;this.nonLoopCycle=0; this.droppedVoices = 0;
    this.startedAt = this.context.currentTime + .06;this.cycleAt=this.startedAt;this.windows=[{at:this.startedAt,cycle:0,score}];this.finishAt=this.startedAt+score.duration;
    this.master!.gain.setValueAtTime(this.volume, this.context.currentTime);
    this.running = true;
    if(this.loop&&score.period){
      const cycles=Math.ceil(score.duration/score.period);
      for(let cycle=-cycles;cycle<0;cycle++)for(const event of score.events){
        const age=-(cycle*score.period+event.t);
        const duration=event.durationRange?durationForCycle(event.durationRange,score.seed,event.id,cycle):event.dur;
        if(age>0&&age<duration)this.schedule(event,this.startedAt,this.graph!,age,cycle);
      }
    }
    this.tick(); this.timer = setInterval(() => {try{this.tick();}catch(error){this.lastError=error instanceof Error?error.message:String(error);this.failure='Audio scheduler: '+this.lastError;this.stop();}}, 25);return true;
  }
  async hotUpdate(score:CompiledScore){
    if(!this.running||!this.context||!this.score)return false;
    score=this.liveScore(score);
    if(!this.lyricsReady(score)){this.lastError='Press Play to prepare changed lyrics.';return false;}
    if(score.events.some(e=>e.inputChannel)&&!this.inputStream){this.queuedScore=score;this.lastError='Press Play to enable microphone input.';return false;}
    const old=this.score;if(JSON.stringify([old.speakers,old.room])!==JSON.stringify([score.speakers,score.room])){this.lastError='Speaker layout changed; press Play to rebuild spatial routing.';return false;}if(this.editCommits.length||old.randomTimeSource||score.randomTimeSource){this.queuedScore=score;return false;}
    const compatible=score.events.length===old.events.length&&score.feedback.length===old.feedback.length&&score.outputBuses.length===old.outputBuses.length&&score.duration===old.duration&&score.period===old.period&&score.events.every((e,i)=>{const p=old.events[i];return JSON.stringify(e.lyrics)===JSON.stringify(p.lyrics)&&e.t===p.t&&e.dur===p.dur&&e.wave===p.wave&&e.generatorMix===p.generatorMix&&e.inputChannel===p.inputChannel&&e.envelope===p.envelope&&e.modulatorWave===p.modulatorWave&&JSON.stringify(e.waveOptions)===JSON.stringify(p.waveOptions)&&e.reverb===p.reverb&&!!e.delay===!!p.delay&&!!e.filter===!!p.filter&&!!e.modulation===!!p.modulation&&(e.chop===undefined)===(p.chop===undefined)&&!(e.wave==='n'&&e.freq.start!==p.freq.start);})&&score.feedback.every((e,i)=>e.dur===old.feedback[i].dur&&!!e.band===!!old.feedback[i].band)&&score.outputBuses.every((e,i)=>e.dur===old.outputBuses[i].dur&&e.effects.length===old.outputBuses[i].effects.length&&e.effects.every((f,j)=>f.kind===old.outputBuses[i].effects[j].kind&&(f.kind!=='reverb'||JSON.stringify(f)===JSON.stringify(old.outputBuses[i].effects[j]))));
    if(!compatible){this.queuedScore=score;return false;}
    this.queuedScore=undefined;
    const now=this.context.currentTime;
    for(const voice of this.voices){let next=score.events.find(e=>e.id===voice.event.id);if(!next)continue;if(next.freqRange||next.freqEndRange)next={...next,freq:frequencyRampForCycle(next,score.seed,voice.cycle)};if(next.panRandom)next={...next,pan:panForCycle(next.pan,next.panRandom,score.seed,next.id,voice.cycle,next.dur)};const age=now-voice.at+voice.age;if(age<0||age>=next.dur)continue;withAutomationSmoothing(Math.min(this.hotEditSeconds,next.dur-age),()=>voice.update(next!,now,age));voice.event={...next,wave:voice.event.wave};this.finishAt=Math.max(this.finishAt,voice.at+next.dur-voice.age+reverbSeconds(next.reverb)+(next.delay?echoTail(rampPeak(next.delay)):0));}
    for(const [key,circuit] of this.circuitInstances){const next=score.feedback[Number(key.split(':')[1])];if(next)withAutomationSmoothing(Math.min(this.hotEditSeconds,Math.max(0,circuit.end-now)),()=>circuit.update(next,now));}
    for(const [key,bus] of this.outputInstances){const next=score.outputBuses[Number(key.split(':')[1])];if(next)withAutomationSmoothing(Math.min(this.hotEditSeconds,Math.max(0,bus.end-now)),()=>bus.update(next,now));this.finishAt=Math.max(this.finishAt,bus.end);}
    this.score=score;for(const window of this.windows)if(window.score===old)window.score=score;this.tasks=this.tasks.map(task=>'event' in task?{t:task.t,event:score.events.find(e=>e.id===task.event.id)!}:'circuit' in task?{t:task.t,circuit:score.feedback[task.circuit.id]}:{t:task.t,bus:score.outputBuses[task.bus.id]});return true;
  }
  /** Structural live edit: renew the graph at a fresh phrase boundary, retaining the session clock. */
  async writeUpdate(score:CompiledScore){
    if(!this.running||!this.context||!this.score||score.diagnostics.length)return false;
    if(JSON.stringify([this.score.speakers,this.score.room])!==JSON.stringify([score.speakers,score.room])){this.lastError='Press Play to apply a changed speaker layout.';return false;}
    score=this.liveScore(score);
    if(await this.hotUpdate(score))return true;
    if(!this.running||!this.context)return false;
    if(score.events.some(e=>e.inputChannel)&&!this.inputReady||!this.lyricsReady(score))return false;
    const ctx=this.context,now=ctx.currentTime,at=now+.015,fade=.05,oldGraph=this.graph;
    const voices=[...this.voices],tails=[...this.tails],circuits=[...this.circuitInstances.values()],buses=[...this.outputInstances.values()],sends=[...this.sharedReverbs.values()].flatMap(m=>[...m.values()]);
    if(oldGraph){oldGraph.gain.cancelScheduledValues(now);oldGraph.gain.setValueAtTime(oldGraph.gain.value,now);oldGraph.gain.linearRampToValueAtTime(0,at+fade);}
    for(const voice of voices){voice.source.onended=null;for(const node of voice.nodes)if('stop' in node)try{(node as AudioScheduledSourceNode).stop(at+fade);}catch{}}
    this.voices.clear();this.tails.clear();this.circuitInstances.clear();this.outputInstances.clear();this.sharedReverbs.clear();
    setTimeout(()=>{for(const voice of voices)voice.nodes.forEach(n=>n.disconnect());for(const nodes of tails)nodes.forEach(n=>n.disconnect());for(const circuit of circuits)circuit.dispose();for(const bus of buses)bus.dispose();for(const send of sends)send.nodes.forEach(n=>n.disconnect());oldGraph?.disconnect();},Math.ceil((.015+fade)*1000)+10);
    this.graph=ctx.createGain();this.graph.gain.setValueAtTime(0,now);this.graph.gain.setValueAtTime(0,at);this.graph.gain.linearRampToValueAtTime(1,at+fade);this.connectGraph(score);
    this.queuedScore=undefined;this.editCommits=[];this.randomSource=score.randomTimeSource;this.sourceOffset=0;
    if(this.randomSource){const raw=compile(this.randomSource,score.seed);this.sourceOffset=score.events[0].from-(raw.events.find(e=>e.id===score.events[0].id)?.from??0);}
    this.score=score;this.cycle++;this.nonLoopCycle=this.cycle;this.cycleAt=at;this.index=0;this.setTasks(score);this.windows=[{at,cycle:this.cycle,score}];this.finishAt=at+score.duration;
    this.lastEditMode='write';this.editRevision++;this.tick();return true;
  }
  setVolume(value: number) { this.volume = value; this.master?.gain.setTargetAtTime(value,this.context!.currentTime,.015); }
  stop() {
    this.startVersion++;this.speech.cancel();this.queuedScore=undefined;this.editCommits=[];
    if (this.timer) clearInterval(this.timer); this.timer = undefined;
    this.running = false;
    if(this.context&&this.master){this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setValueAtTime(0,this.context.currentTime);}
    for (const voice of this.voices) {
      try {
        const now = this.context!.currentTime;
        voice.gain.gain.cancelScheduledValues(now); voice.gain.gain.setTargetAtTime(0, now,.006);
        voice.source.stop(now+.025);
        setTimeout(()=>voice.nodes.forEach(node=>node.disconnect()),30);
      } catch { /* The voice may already have ended. */ }
    }
    this.voices.clear();this.inputStream?.getTracks().forEach(t=>t.stop());this.inputStream=undefined;this.inputNodes.forEach(n=>n.disconnect());this.inputNodes=[];this.inputChannels=[];for(const sends of this.sharedReverbs.values())for(const send of sends.values())for(const node of send.nodes)node.disconnect();this.sharedReverbs.clear();
    for(const nodes of this.tails)for(const node of nodes)node.disconnect();this.tails.clear();
    for(const circuit of this.circuitInstances.values())circuit.dispose();this.circuitInstances.clear();
    for(const bus of this.outputInstances.values())bus.dispose();this.outputInstances.clear();this.graph?.disconnect();this.graph=undefined;this.spatialNodes.forEach(n=>n.disconnect());this.spatialNodes=[];
  }
  async dispose() { this.stop(); this.speech.dispose(); await this.context?.close(); }
  private tick() {
    if (!this.score || !this.context || !this.running) return;
    for(const [destination,sends] of this.sharedReverbs){for(const [key,send] of sends)if(this.context.currentTime>send.end+.05){send.nodes.forEach(n=>n.disconnect());sends.delete(key);}if(!sends.size)this.sharedReverbs.delete(destination);}
    for(const [key,circuit] of this.circuitInstances)if(this.context.currentTime>circuit.end+.05){circuit.dispose();this.circuitInstances.delete(key);}
    for(const [key,bus] of this.outputInstances)if(this.context.currentTime>bus.end+.05){bus.dispose();this.outputInstances.delete(key);}
    if(this.windows.length>1){const now=this.context.currentTime;while(this.windows.length>1&&this.windows[1].at<=now)this.windows.shift();}
    while(this.editCommits.length&&this.context.currentTime>=this.editCommits[0]){this.editCommits.shift();this.editRevision++;}
    const horizon = this.context.currentTime + .12;
    let budget = 4096;
    while (budget-- > 0) {
      if(!this.loop&&this.cycle>this.nonLoopCycle){if(this.context.currentTime>=this.finishAt)this.stop();break;}
      if(this.index===0&&this.cycle>0&&this.cycleAt>horizon)break;
      if(this.queuedScore&&this.index===0&&this.cycle>0&&this.loop&&(!this.queuedScore.events.some(e=>e.inputChannel)||this.inputReady)){
        this.score=this.queuedScore;this.queuedScore=undefined;this.randomSource=this.score.randomTimeSource;this.sourceOffset=0;this.setTasks(this.score);this.windows=this.windows.filter(w=>w.at!==this.cycleAt);this.windows.push({at:this.cycleAt,cycle:this.cycle,score:this.score});this.editCommits.push(this.cycleAt);this.lastEditMode='loop';
      }
      if (this.index >= this.tasks.length) {
        if (!this.loop) {
          if (this.context.currentTime>=this.finishAt) this.stop();
          break;
        }
        this.cycleAt+=this.score.period??this.score.duration;this.cycle++; this.index=0;
        if(!this.randomSource&&!this.queuedScore)this.windows.push({at:this.cycleAt,cycle:this.cycle,score:this.score});
if(this.randomSource&&!this.queuedScore){
          const next=this.compileCycle(this.cycle);
          if(next.diagnostics.length){this.failure=next.diagnostics[0].message;this.stop();break;}
          this.score=next;this.setTasks(next);this.windows.push({at:this.cycleAt,cycle:this.cycle,score:next});
        }
        continue;
      }
      const task=this.tasks[this.index];
      if(!task)continue; // A valid silent live draft retains the loop clock, ready to unmute.
      const when=this.cycleAt + task.t;
      if (when > horizon) break;
      this.index++;
      const lateness=Math.max(0,this.context.currentTime-when);if(lateness>.08){this.lateEvents++;if('event' in task&&lateness>=task.event.dur){this.droppedVoices++;continue;}} 
      const at=Math.max(when,this.context.currentTime+.002);
      const output=(id:number|undefined)=>id===undefined?(this.graph??this.master)!:this.outputInstances.get(`${this.cycle}:${id}`)?.input;
      if('bus' in task){
        const destination=output(task.bus.parent);if(!destination)continue;
        const bus=createOutputBus(this.context,task.bus,at,destination,amount=>this.impulse(this.score!.seed,amount),this.score.speakers,this.score.room);
        this.outputInstances.set(`${this.cycle}:${task.bus.id}`,bus);this.finishAt=Math.max(this.finishAt,bus.end);
      }else if('circuit' in task){
        const destination=output(task.circuit.outputBus);if(!destination)continue;
        let circuitDestination=destination;if(this.score.speakers){const p=createSpatialPanner(this.context,this.score.speakers,this.inputPlacement(task.circuit.outputBus),{start:0,end:0,duration:0},at,task.circuit.dur,1,this.score.room);p.output.connect(destination);this.spatialNodes.push(...p.nodes);circuitDestination=p.input;}this.circuitInstances.set(`${this.cycle}:${task.circuit.id}`,createFeedbackCircuit(this.context,task.circuit,at,circuitDestination));this.finishAt=Math.max(this.finishAt,at+task.circuit.dur);
      }else this.schedule(task.event,at,task.event.feedbackBus===undefined?output(task.event.outputBus):this.circuitInstances.get(`${this.cycle}:${task.event.feedbackBus}`)?.input,lateness>.08?lateness:0);
    }
  }
  private ramp(param: AudioParam, ramp: Ramp, at: number, scale = 1) {
    automate(param,ramp,at,scale);
  }
  private impulse(seed: number,amount:number) {
    const key=`${seed}:${amount}`;if (this.impulses.has(key)) return this.impulses.get(key)!;
    const ctx=this.context!, buffer=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*reverbSeconds(amount)),ctx.sampleRate), random=rng(seed);
    for (let c=0;c<2;c++) { const data=buffer.getChannelData(c); for(let i=0;i<data.length;i++) data[i]=(random()*2-1)*Math.exp(-6.91*i/data.length)*Math.min(1,(data.length-i)/(ctx.sampleRate*.01)); }
    if(this.impulses.size>=16)this.impulses.delete(this.impulses.keys().next().value!);
    this.impulses.set(key,buffer); return buffer;
  }
  private schedule(event: NoteEvent, at: number,destination:AudioNode|undefined=this.graph??this.master,age=0,cycle=this.cycle) {
    if(!destination)return;
    if(probabilisticSilence(event.restGates,this.score!.seed,cycle))return;
    if(event.waveOptions)event={...event,wave:timbreForCycle(event.waveOptions,this.score!.seed,event.id,cycle)};
    if(event.durationRange)event={...event,dur:event.durationChoices?event.durationChoices[Math.min(event.durationChoices.length-1,Math.floor(durationForCycle([0,event.durationChoices.length],this.score!.seed,event.id,cycle)))]:durationForCycle(event.durationRange,this.score!.seed,event.id,cycle)};
    if(event.freqRange||event.freqEndRange)event={...event,freq:frequencyRampForCycle(event,this.score!.seed,cycle)};
    if(event.panRandom)event={...event,pan:panForCycle(event.pan,event.panRandom,this.score!.seed,event.id,cycle,event.dur)};
    const original=event;
    if(age)event={...event,...(event.spatial?{spatial:{...event.spatial,values:event.spatial.values.map(v=>sliceRamp(v,age))}}:{}),dur:event.dur-age,freq:sliceRamp(event.freq,age),pan:sliceRamp(event.pan,age),volume:sliceRamp(event.volume,age),index:sliceRamp(event.index,age),filter:event.filter&&sliceRamp(event.filter,age),delay:event.delay&&sliceRamp(event.delay,age),vocoderMix:event.vocoderMix&&sliceRamp(event.vocoderMix,age),modulation:event.modulation&&sliceRamp(event.modulation,age)};
    if (!this.offline && this.voices.size >= 256) { this.droppedVoices++; return; }
    const ctx=this.context!, end=at+event.dur, gain=ctx.createGain(), volume=ctx.createGain(), pan=ctx.createStereoPanner();
    this.finishAt=Math.max(this.finishAt,end+reverbSeconds(event.reverb)+(event.delay?echoTail(rampPeak(event.delay)):0));
    const clocks:ReturnType<typeof chopClock>[]=[];
    const nodes: AudioNode[]=[gain,volume,pan];
    const spatial=this.score?.speakers&&event.feedbackBus===undefined?createSpatialPanner(ctx,this.score.speakers,this.voicePlacement(event),event.pan,at,event.dur,1,this.score.room):undefined;
    const voiceDestination=spatial?spatial.input:destination;if(spatial){spatial.output.connect(destination);nodes.push(...spatial.nodes);}
    const volumeScale=event.inputChannel?1/9:event.lyrics?(event.lyrics.vocoder?.5/9:.9/9):.16/9;
    const updates:((next:NoteEvent,now:number,age:number)=>void)[]=[(next,now,age)=>{updateAutomation(volume.gain,next.volume,now,age,volumeScale);if(spatial)spatial.update(this.voicePlacement(next),next.pan,now,age);else updateAutomation(pan.pan,next.pan,now,age);}];
    let source: AudioScheduledSourceNode;
    if(event.lyrics){
      const buffer=this.lyricBuffers.get(event.lyrics.text);if(!buffer)return;
      const speech=ctx.createBufferSource();speech.buffer=buffer;
      const from=event.lyrics.from??0,to=event.lyrics.to??1,rate=buffer.duration*(to-from)/original.dur,offset=buffer.duration*from+age*rate;
      speech.playbackRate.value=rate;nodes.push(speech);
      let output:AudioNode=speech,carrier:OscillatorNode|undefined;
      if(event.lyrics.vocoder){
        carrier=ctx.createOscillator();carrier.setPeriodicWave(lyricCarrier(ctx,event.wave));this.ramp(carrier.frequency,event.freq,at,1);
        const vocoder=lyricVocoder(ctx,speech,carrier),blend=vocoderBlend(ctx,speech,vocoder.output,event.vocoderMix??{start:9,end:9,duration:0},at);nodes.push(carrier,...vocoder.nodes,...blend.nodes);output=blend.output;updates.push((next,now,age)=>blend.update(next.vocoderMix??{start:9,end:9,duration:0},now,age));
        updates.push((next,now,age)=>updateAutomation(carrier!.frequency,next.freq,now,age));
      }
      const proxy={connect:output.connect.bind(output),disconnect:output.disconnect.bind(output),onended:null as (()=>void)|null,start:(when:number)=>{speech.start(when,offset);carrier?.start(when);},stop:(when:number)=>{speech.stop(when);carrier?.stop(when);}};
      speech.onended=()=>proxy.onended?.();source=proxy as unknown as AudioScheduledSourceNode;
    }else if(event.inputChannel){
      const tap=ctx.createGain();tap.gain.setValueAtTime(0,ctx.currentTime);const channel=this.inputChannels[event.inputChannel-1];channel?.connect(tap);nodes.push(tap);let timer:ReturnType<typeof setTimeout>|undefined;
      const proxy={connect:tap.connect.bind(tap),disconnect:tap.disconnect.bind(tap),onended:null as (()=>void)|null,start:(when:number)=>tap.gain.setValueAtTime(1,when),stop:(when:number)=>{tap.gain.setValueAtTime(0,when);if(timer)clearTimeout(timer);timer=setTimeout(()=>{try{channel?.disconnect(tap);}catch{}proxy.onended?.();},Math.max(0,when-ctx.currentTime)*1000);}};source=proxy as unknown as AudioScheduledSourceNode;
    }else if (event.wave==='n') {
      const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*Math.min(2,event.dur)),ctx.sampleRate);
      const data=buffer.getChannelData(0),random=rng((this.score!.seed+event.id*997)>>>0);
      let last=0, pink=0;
      for (let i=0;i<data.length;i++) {
        const white=random()*2-1;
        last=(last+.02*white)/1.02; pink=.98*pink+.12*white;
        data[i]=event.freq.start===3 ? last*3.5 : event.freq.start===2 ? pink : white;
      }
      const noise=ctx.createBufferSource(); noise.buffer=buffer; noise.loop=true; source=noise;
    } else {
      const osc=ctx.createOscillator(),morph=event.generatorMix===undefined?undefined:generatorWaves(ctx,event.generatorMix);if(morph)osc.setPeriodicWave(morph.carrier);else osc.type=({s:'sine',t:'triangle',a:'sawtooth',q:'square'} as const)[event.wave as 's'|'t'|'a'|'q'];
      this.ramp(osc.frequency,event.freq,at,1); source=osc;
      updates.push((next,now,age)=>updateAutomation(osc.frequency,next.freq,now,age));
      if(event.modulation||morph) {
        const modulation=event.modulation??{...event.freq,start:event.freq.start/4,end:event.freq.end/4,points:event.freq.points?.map(p=>({...p,value:p.value/4}))},fmMix=morph?.fmMix??1;
        const mod=ctx.createOscillator(),depth=ctx.createGain();
        if(morph)mod.setPeriodicWave(morph.modulator);else mod.type=({s:'sine',t:'triangle',a:'sawtooth',q:'square'} as const)[event.modulatorWave||'s'];
        this.ramp(mod.frequency,modulation,at,1); this.ramp(depth.gain,event.index,at,modulation.start*fmMix);
        mod.connect(depth).connect(osc.frequency);mod.start(at);mod.stop(end); nodes.push(mod,depth);
        updates.push((next,now,age)=>{const target=next.modulation??{...next.freq,start:next.freq.start/4,end:next.freq.end/4,points:next.freq.points?.map(p=>({...p,value:p.value/4}))};updateAutomation(mod.frequency,target,now,age);updateAutomation(depth.gain,next.index,now,age,target.start*fmMix);});
      }
    }
    const envelope=adsrPoints(event.envelope,event.dur);gain.gain.setValueAtTime(envelope[0].value,at);if(event.envelope!=='off')for(const point of envelope.slice(1))gain.gain.linearRampToValueAtTime(point.value,at+point.time);
    this.ramp(volume.gain,event.volume,at,volumeScale);
    source.connect(gain).connect(volume);let tail: AudioNode=volume;
    if(event.filter) {
      const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.Q.value=.707;
      if(event.filter.points)automateMapped(filter.frequency,event.filter,v=>filterHz(v,ctx.sampleRate),at);else automate(filter.frequency,{start:filterHz(event.filter.start,ctx.sampleRate),end:filterHz(event.filter.end,ctx.sampleRate),duration:event.filter.duration,exponential:true},at);
      tail.connect(filter);tail=filter;nodes.push(filter);
      updates.push((next,now,age)=>automateMapped(filter.frequency,next.filter!,v=>filterHz(v,ctx.sampleRate),now,age));
    }
    if(event.chop!==undefined){
      const chopper=ctx.createGain(),gate=ctx.createBufferSource();
      const period=chopPeriod(event.chop),curve=chopCurve(),buffer=ctx.createBuffer(1,curve.length,ctx.sampleRate);
      buffer.getChannelData(0).set(curve);gate.buffer=buffer;gate.loop=true;
      const clock=chopClock(event.chopRamp??{start:event.chop,end:event.chop,duration:0},at,ctx.sampleRate);clocks.push(clock);
      gate.playbackRate.value=curve.length/(ctx.sampleRate*chopPeriod(event.chop));
      automateMapped(gate.playbackRate,event.chopRamp??{start:event.chop,end:event.chop,duration:0},v=>curve.length/(ctx.sampleRate*chopPeriod(v)),at);chopper.gain.value=0;
      gate.connect(chopper.gain);tail.connect(chopper);tail=chopper;nodes.push(chopper,gate);
      gate.start(at);gate.stop(end+.005);
      updates.push((next,now,age)=>{const ramp=next.chopRamp??{start:next.chop!,end:next.chop!,duration:0};const native=automateMapped(gate.playbackRate,ramp,v=>curve.length/(ctx.sampleRate*chopPeriod(v)),now,age);clock.updateNative(native,now);});
    }
    if(event.delay){const echo=createEcho(ctx,event.delay,at);tail.connect(echo.input);tail=echo.output;nodes.push(...echo.nodes);updates.push((next,now,age)=>echo.update(next.delay!,now,age));}
    tail.connect(pan);if(!spatial)this.ramp(pan.pan,event.pan,at,1);
    const mix=reverbMix(event.reverb),dry=ctx.createGain();if(event.reverbRamp)automateMapped(dry.gain,event.reverbRamp,v=>reverbMix(v).dry,at);else dry.gain.value=mix.dry;pan.connect(dry).connect(voiceDestination);nodes.push(dry);
    if(event.reverb&&!event.reverbRamp){const wet=ctx.createGain();wet.gain.value=mix.wet;pan.connect(wet).connect(this.reverbSend(event.reverb,voiceDestination,end+reverbSeconds(event.reverb)));nodes.push(wet);}
    else if(event.reverb) {
      const reverb=ctx.createConvolver(),wet=ctx.createGain();reverb.buffer=this.impulse(this.score!.seed,event.reverb);
      if(event.reverbRamp)automateMapped(wet.gain,event.reverbRamp,v=>reverbMix(v).wet,at);else wet.gain.value=mix.wet;pan.connect(reverb).connect(wet).connect(voiceDestination);nodes.push(reverb,wet);
      updates.push((next,now,age)=>{const r=next.reverbRamp??{start:next.reverb,end:next.reverb,duration:0};automateMapped(dry.gain,r,v=>reverbMix(v).dry,now,age);automateMapped(wet.gain,r,v=>reverbMix(v).wet,now,age);});
    }
    const voice={source,gain,nodes,event:original,at,age,cycle,instance:this.serial++,gateAt:(now:number)=>clocks.reduce((gain,clock)=>gain*clock.levelAt(now),1),update:(next:NoteEvent,now:number,age:number)=>{for(const apply of updates)apply(next,now,age);}};this.voices.add(voice);
    source.onended=()=>{this.voices.delete(voice);if(this.offline)return;if(!this.running){nodes.forEach(n=>n.disconnect());return;}this.tails.add(nodes);if(this.offline)return;setTimeout(()=>{source.disconnect();nodes.forEach(n=>n.disconnect());this.tails.delete(nodes);},(reverbSeconds(voice.event.reverb)+(voice.event.delay?echoTail(rampPeak(voice.event.delay)):0))*1000);};
    source.start(at);source.stop(end+.005);
  }
}
