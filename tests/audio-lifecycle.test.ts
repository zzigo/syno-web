import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from '../src/audio/engine';
import {compile} from '../src/core/parser';

test('a stop while audio activation is pending prevents delayed playback',async()=>{
  const original=globalThis.AudioContext;
  let resume:()=>void=()=>{};
  const param={value:0,setValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}};
  const node=()=>({gain:param,threshold:param,knee:param,ratio:param,fftSize:256,connect(next:unknown){return next;}});
  class PendingContext {
    currentTime=0;destination={};
    createWaveShaper(){return node();}createGain(){return node();}createDynamicsCompressor(){return node();}createAnalyser(){return node();}
    resume(){return new Promise<void>(resolve=>resume=resolve);}
  }
  globalThis.AudioContext=PendingContext as unknown as typeof AudioContext;
  try{
    const engine=new AudioEngine();const request=engine.start(compile("1s220'0.2"));
    engine.stop();resume();assert.equal(await request,false);assert.equal(engine.running,false);
  }finally{globalThis.AudioContext=original;}
});

test('intensity and panning schedule separate linear ramps on native AudioParams',async()=>{
  const original=globalThis.AudioContext;
  type Call={kind:string;value:number;time:number};
  const parameter=()=>({value:0,calls:[] as Call[],setValueAtTime(value:number,time:number){this.calls.push({kind:'set',value,time});},linearRampToValueAtTime(value:number,time:number){this.calls.push({kind:'ramp',value,time});},exponentialRampToValueAtTime(value:number,time:number){this.calls.push({kind:'exp',value,time});},setTargetAtTime(){},cancelScheduledValues(){}});
  const node=()=>({connect(next:unknown){return next;},disconnect(){}});
  class RecordingContext {
    sampleRate=48000;filters:any[]=[];buffers:any[]=[];currentTime=0;destination={};gains:(ReturnType<typeof node>&{gain:ReturnType<typeof parameter>})[]=[];panners:(ReturnType<typeof node>&{pan:ReturnType<typeof parameter>})[]=[];
    createWaveShaper(){return {...node(),curve:null};}
    createGain(){const gain={...node(),gain:parameter()};this.gains.push(gain);return gain;}
    createConvolver(){return {...node(),buffer:null};}
    createBiquadFilter(){const filter={...node(),frequency:parameter(),Q:parameter(),type:'lowpass'};this.filters.push(filter);return filter;}
    createBuffer(_channels:number,length:number){const data=new Float32Array(length);return {getChannelData(){return data;}};}
    createBufferSource(){const buffer={...node(),playbackRate:parameter(),buffer:null,loop:false,start(){},stop(){},onended:null};this.buffers.push(buffer);return buffer;}
    createStereoPanner(){const pan={...node(),pan:parameter()};this.panners.push(pan);return pan;}
    createDynamicsCompressor(){return {...node(),threshold:parameter(),knee:parameter(),ratio:parameter()};}
    createAnalyser(){return {...node(),fftSize:256};}
    createOscillator(){return {...node(),frequency:parameter(),type:'sine',start(){},stop(){},onended:null};}
    async resume(){}
  }
  globalThis.AudioContext=RecordingContext as unknown as typeof AudioContext;
  const engine=new AudioEngine();
  try{
    await engine.start(compile("s220v0>1'4p0>1'4"));
    const ctx=engine.context as unknown as RecordingContext;
    assert.ok(ctx.gains.some(g=>JSON.stringify(g.gain.calls)===JSON.stringify([{kind:'set',value:0,time:.06},{kind:'ramp',value:.16/9,time:4.06}])), 'intensity has its own linear gain ramp');
    assert.deepEqual(ctx.panners[0].pan.calls,[{kind:'set',value:0,time:.06},{kind:'ramp',value:1,time:4.06}]);
    assert.ok(ctx.gains.some(g=>g.gain.calls.length>2&&g.gain.calls.some(c=>c.value===1)),'envelope and intensity have independent gain controls');
    engine.stop();ctx.gains.length=0;
    await engine.start(compile("s220v0'1000>1'100>0'1000e0"));
    assert.ok(ctx.gains.some(g=>JSON.stringify(g.gain.calls)===JSON.stringify([{kind:'set',value:0,time:.06},{kind:'ramp',value:.16/9,time:1000.06},{kind:'ramp',value:.16/9,time:1100.06},{kind:'ramp',value:0,time:2100.06}])));
    assert.ok(ctx.gains.some(g=>JSON.stringify(g.gain.calls)===JSON.stringify([{kind:'set',value:1,time:.06}])));
    engine.stop();await engine.start(compile("s220f2>7'10h0.1e0"));
    assert.equal(ctx.filters[0].frequency.calls[0].kind,'set');assert.equal(ctx.filters[0].frequency.calls[1].kind,'exp');
    assert.equal(ctx.filters[0].frequency.calls[1].time,10.06);
    assert.equal(ctx.buffers[0].loop,true);assert.ok(ctx.buffers[0].playbackRate.calls[0].value>0);
    engine.stop();engine.loop=false;await engine.start(compile("s440v4'0.1r9e0"));
    ctx.currentTime=.5;(engine as any).tick();assert.equal(engine.running,true,'natural end must let the reverb tail sound');
    assert.equal(engine.cycleTime,.1,'tail does not wrap the non-looping time cursor');
    ctx.currentTime=7;(engine as any).tick();assert.equal(engine.running,false,'playback ends after the tail');
  }finally{engine.stop();globalThis.AudioContext=original;}
});
