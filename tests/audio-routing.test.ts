import {sectionScore} from '../src/core/sections';
import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from '../src/audio/engine';
import {compile} from '../src/core/parser';
import {presets} from '../src/core/presets';
class Context {
 currentTime=0;sampleRate=48000;destination={};nodes:any[]=[];sources:any[]=[];
 param(){return {value:0,calls:[] as {kind:string;value:number;time:number}[],setValueAtTime(value:number,time:number){this.calls.push({kind:'set',value,time});},linearRampToValueAtTime(value:number,time:number){this.calls.push({kind:'linear',value,time});},exponentialRampToValueAtTime(value:number,time:number){this.calls.push({kind:'exp',value,time});},setTargetAtTime(){},cancelScheduledValues(){}};}
 node(extra:any={}){const n={connections:[] as unknown[],disconnected:false,connect(target:unknown){this.connections.push(target);return target;},disconnect(){this.disconnected=true;},...extra};this.nodes.push(n);return n;}
 createPeriodicWave(real:Float32Array,imag:Float32Array){return {real:Array.from(real),imag:Array.from(imag)};}
 createGain(){return this.node({gain:this.param()});}createStereoPanner(){return this.node({pan:this.param()});}
 createDynamicsCompressor(){return this.node({threshold:this.param(),knee:this.param(),ratio:this.param()});}
 createAnalyser(){return this.node({fftSize:256});}createChannelSplitter(){return this.node();}createChannelMerger(){return this.node();}
 createConvolver(){return this.node({buffer:null});}
 createDelay(maximum=1){return this.node({delayTime:this.param(),maximum});}createBiquadFilter(){return this.node({frequency:this.param(),Q:this.param()});}createWaveShaper(){return this.node();}
 createBuffer(channels:number,length:number){const data=Array.from({length:channels},()=>new Float32Array(length));return {getChannelData:(c:number)=>data[c]};}
 source(extra:any={}){const n=this.node({startAt:0,stopAt:0,start(t:number){this.startAt=t;},stop(t:number){this.stopAt=t;},...extra});this.sources.push(n);return n;}
 createBufferSource(){return this.source({playbackRate:this.param()});}createOscillator(){const osc=this.source({frequency:this.param()});osc.setPeriodicWave=(wave:unknown)=>osc.periodicWave=wave;return osc;}
 async resume(){}
}
async function withContext(run:(engine:AudioEngine,ctx:Context)=>Promise<void>){const original=globalThis.AudioContext;globalThis.AudioContext=Context as unknown as typeof AudioContext;const engine=new AudioEngine();try{await run(engine,new Context());}finally{engine.stop();globalThis.AudioContext=original;}}
test('feedback outlives its source and Stop disconnects every shared circuit node',async()=>withContext(async(engine)=>{
 engine.loop=false;await engine.start(compile("{n1v0.03'0.02e0}d0.012g1.12f6.6v2'16"));
 const ctx=engine.context as unknown as Context;assert.equal(ctx.sources.length,1);
 const returns=ctx.nodes.filter(n=>n.gain?.calls.some((c:any)=>c.value===1.12));assert.equal(returns.length,2);
 assert.ok(returns.every(n=>n.gain.calls.some((c:any)=>c.value===0&&c.time===16.06)));
 ctx.currentTime=2;(engine as any).tick();assert.equal(engine.running,true);
 engine.stop();assert.equal(ctx.nodes[0].gain.calls.at(-1).value,0,'panic sets the master gain exactly to zero');assert.ok(returns.every(n=>n.disconnected));assert.equal(engine.running,false);
}));
test('continuous Shepard starts with six in-flight voices, renews and drains after loop off',async()=>withContext(async(engine)=>{
 const study=presets.find(p=>p.file==='Shepard-continuous.syn')!;
 await engine.start(compile(study.code));const ctx=engine.context as unknown as Context;
 assert.equal(ctx.sources.length,6);ctx.currentTime=.1;assert.equal(engine.visualEvents.length,6);
 const starts=ctx.sources.map(n=>n.frequency.calls[0].value).sort((a,b)=>a-b);
 assert.ok(Math.abs(starts[2]-440)<1e-8);assert.ok(ctx.sources.every(n=>n.frequency.calls.some((c:any)=>c.kind==='exp')));
 ctx.currentTime=3.3;(engine as any).tick();assert.equal(ctx.sources.length,7);ctx.currentTime=3.4;assert.equal(engine.visualEvents.length,6);
 engine.loop=false;ctx.currentTime=4;(engine as any).tick();assert.equal(engine.running,true);assert.equal(ctx.sources.length,7);
 ctx.currentTime=25;(engine as any).tick();assert.equal(engine.running,false);
}));

test('two-band circuit schedules separate native bandpass filters and return paths',async()=>withContext(async(engine)=>{
 await engine.start(compile("{n1v0.03'0.02e0}b220,880q0.25,0.2k2.5g0.72,0.68d0.013,0.029v4'8"));
 const ctx=engine.context as unknown as Context,bands=ctx.nodes.filter(n=>n.type==='bandpass');
 assert.equal(bands.length,2);assert.deepEqual(bands.map(n=>n.frequency.calls[0].value),[220,880]);assert.deepEqual(bands.map(n=>n.Q.calls[0].value),[4,5]);
 assert.deepEqual(ctx.nodes.filter(n=>n.delayTime).map(n=>n.delayTime.calls[0].value),[.013,.029]);
 engine.stop();assert.ok(bands.every(n=>n.disconnected));
}));

test('post-chain bus routes circuit output through reverb and preserves its tail until Stop',async()=>withContext(async(engine)=>{
 engine.loop=false;await engine.start(compile("{{s220v0.03'0.2e0}d0.2g1.4f4x0.5v5'1}r8"));
 const ctx=engine.context as unknown as Context,verb=ctx.nodes.find(n=>n.buffer&&n.buffer.getChannelData&&!('startAt' in n));
 assert.ok(verb,'one convolver is allocated for the complete chain');
 ctx.currentTime=2;(engine as any).tick();assert.equal(engine.running,true,'the post-chain tail survives circuit end');
 engine.stop();assert.equal(ctx.nodes[0].gain.calls.at(-1).value,0);assert.equal(verb.disconnected,true);
}));

test('hot numeric changes retime active automation without replacing sources or resetting transport',async()=>withContext(async(engine)=>{
 await engine.start(compile("s220v2p-1'20e0"));const ctx=engine.context as unknown as Context;ctx.currentTime=2;
 const before=engine.time;await engine.hotUpdate(compile("s330v3p0'20e0"));
 assert.equal(ctx.sources.length,1);assert.equal(engine.time,before);assert.equal(ctx.sources[0].frequency.calls.at(-1).value,330);
 const pan=ctx.nodes.find(n=>n.pan);assert.equal(pan.pan.calls.at(-1).value,0);
}));
test('hot feedback gain changes preserve the already oscillating circuit graph',async()=>withContext(async(engine)=>{
 const code="{n1v0.03'0.02e0}d0.012g1.12f6.6v2'16";await engine.start(compile(code));const ctx=engine.context as unknown as Context;ctx.currentTime=2;
 const count=ctx.nodes.length;await engine.hotUpdate(compile(code.replace('g1.12','g1.13')));assert.equal(ctx.nodes.length,count);assert.equal(engine.time,1.94);
 assert.equal(ctx.nodes.filter(n=>n.gain?.calls.some((c:any)=>c.value===1.13)).length,2);
}));

test('runtime renews random pitch at the next loop with its deterministic cycle stream',async()=>withContext(async(engine)=>{
 const {frequencyForCycle}=await import('../src/core/timbre');await engine.start(compile("??v2'0.22e0"));const ctx=engine.context as unknown as Context;
 ctx.currentTime=.2;(engine as any).tick();assert.equal(ctx.sources.length,2);
 assert.equal(ctx.sources[1].frequency.calls[0].value,frequencyForCycle([55,1760],3181,0,1));
 ctx.currentTime=.29;assert.equal(engine.visualEvents[0].freq.start,ctx.sources[1].frequency.calls[0].value);
}));

test('chopper sweep schedules native rate automation for its full transition',async()=>withContext(async(engine)=>{
 await engine.start(compile("s220h0.1>3'4e0"));const ctx=engine.context as unknown as Context,gate=ctx.sources.find(n=>n.playbackRate?.calls.length);
 assert.ok(gate);assert.ok(gate.playbackRate.calls[0].value>gate.playbackRate.calls.at(-1).value);assert.equal(gate.playbackRate.calls.at(-1).time,4.06);assert.equal(gate.playbackRate.calls.length,65);
}));

test('random duration loops renew without maximum-length silent padding and report the current cycle',async()=>withContext(async(engine)=>{
 const code="s?[110:880]v2e0254'?[0.2:0.8]",first=compile(code,3181),second=compile(code,3181,1);
 await engine.start(first);const ctx=engine.context as unknown as Context;
 const nextAt=.06+first.duration;ctx.currentTime=nextAt-.09;(engine as any).tick();
 assert.equal(ctx.sources.length,2);assert.ok(Math.abs(ctx.sources[1].startAt-nextAt)<1e-9);
 assert.ok(Math.abs(ctx.sources[1].stopAt-(nextAt+second.duration+.005))<1e-9);
 assert.equal(engine.currentScore?.duration,first.duration,'lookahead must not display the next cycle early');
 ctx.currentTime=nextAt+.01;assert.equal(engine.currentScore?.duration,second.duration);assert.ok(Math.abs(engine.cycleTime-.01)<1e-9);
 assert.equal(engine.visualEvents.at(-1)?.dur,second.events[0].dur);
 engine.stop();assert.equal(engine.cycleTime,0);
}));
test('random duration with Loop off plays one sampled phrase and stops',async()=>withContext(async(engine)=>{
 engine.loop=false;const score=compile("s220v2e0254'?[0.2:0.8]");await engine.start(score);const ctx=engine.context as unknown as Context;
 ctx.currentTime=.06+score.duration+.02;(engine as any).tick();assert.equal(engine.running,false);assert.equal(ctx.sources.length,1);
}));
test('visual-only edits preserve a random-time cycle and update its source ranges',async()=>withContext(async(engine)=>{
 const code="s220v2e0254'?[0.2:0.8]",first=compile(code),nextAt=.06+first.duration;await engine.start(first);const ctx=engine.context as unknown as Context;
 ctx.currentTime=nextAt-.09;(engine as any).tick();ctx.currentTime=nextAt+.01;
 const before=engine.cycleTime,count=ctx.sources.length;engine.refreshSourceRanges(compile('!vf\n'+code));
 assert.equal(engine.cycleTime,before);assert.equal(ctx.sources.length,count);assert.equal(engine.currentScore?.visualization,'phyllotaxis');assert.equal(engine.visualEvents.at(-1)?.from,4);
 const second=compile(code,3181,1);ctx.currentTime=nextAt+second.duration-.09;(engine as any).tick();assert.ok(Math.abs(ctx.sources[2].startAt-(nextAt+second.duration))<1e-9);
}));
test('native random pan and pitch sweeps renew endpoints and fit a random gate',async()=>withContext(async(engine)=>{
 const code="??>?v2e0254p?>?'?[0.2:0.8]",s=compile(code);await engine.start(s);const ctx=engine.context as unknown as Context;
 assert.equal(ctx.sources[0].frequency.calls[0].value,s.events[0].freq.start);assert.equal(ctx.sources[0].frequency.calls.at(-1).value,s.events[0].freq.end);assert.ok(Math.abs(ctx.sources[0].frequency.calls.at(-1).time-(.06+s.duration))<1e-9);
 const pan=ctx.nodes.find(n=>n.pan);assert.equal(pan.pan.calls[0].value,s.events[0].pan.start);assert.equal(pan.pan.calls.at(-1).value,s.events[0].pan.end);
 ctx.currentTime=.06+s.duration-.09;(engine as any).tick();const next=compile(code,3181,1);assert.equal(ctx.sources[1].frequency.calls.at(-1).value,next.events[0].freq.end);
 ctx.currentTime=.06+s.duration+.01;assert.equal(engine.visualEvents[0].pan.end,next.events[0].pan.end);
}));
test('visual gate tracks a voice chopper and every chopper in its output bus chain',async()=>withContext(async(engine)=>{
 engine.loop=false;await engine.start(compile("{s220v2'2h9}h3r2"));const ctx=engine.context as unknown as Context;
 ctx.currentTime=.06+.02;assert.ok(engine.visualEvents[0].gateLevel!>.9);
 ctx.currentTime=.06+.75*.9;assert.equal(engine.visualEvents[0].gateLevel,0,'voice gate is closed');
 ctx.currentTime=.06+.75*(.1+3*.8/9);assert.equal(engine.visualEvents[0].gateLevel,0,'shared bus gate is closed independently');
}));
test('voice and bus choppers initialize their rate before a non-quantized start',async()=>withContext(async(engine)=>{
 await engine.start(compile("{s220v2'2h9}h3"));const ctx=engine.context as unknown as Context,gates=ctx.sources.filter(n=>n.playbackRate);
 assert.equal(gates.length,2);const rates=gates.map(n=>n.playbackRate.value).sort((a,b)=>a-b),expected=[256/(48000*.9),256/(48000*(.1+3*.8/9))].sort((a,b)=>a-b);
 rates.forEach((rate,i)=>assert.ok(Math.abs(rate-expected[i])<1e-12));
}));
test('continuous sequences keep one native oscillator and articulate only when requested',async()=>withContext(async(engine)=>{await engine.start(compile("s[110 165 220 330]v2e0'n8"));const ctx=engine.context as unknown as Context;assert.equal(ctx.sources.filter(n=>n.frequency).length,1);assert.deepEqual(ctx.sources[0].frequency.calls.map((c:{value:number})=>c.value),[110,165,220,330]);assert.ok(ctx.sources[0].frequency.calls.every((c:{kind:string})=>c.kind==='set'));}));

test('future rotation reaches the native scheduler on successive phrase boundaries',async()=>withContext(async(engine)=>{await engine.start(compile("!sa\nvoice=(s[110 220 330]'n8)\n!f1:2 voice 1\nvoice"));const ctx=engine.context as unknown as Context;for(let t=.1;t<2.1;t+=.1){ctx.currentTime=t;(engine as unknown as {tick:()=>void}).tick();}const score=engine.currentScore!;assert.equal(score.events[0].freq.start,330);assert.ok(ctx.sources.some(n=>n.frequency?.calls[0]?.value===330&&n.startAt>1.5));}));
test('structural hot edits wait for the next loop without cutting the current voice',async()=>withContext(async(engine)=>{await engine.start(compile("s220v2'2e0"));const ctx=engine.context as unknown as Context;ctx.currentTime=.5;const first=ctx.sources[0],time=engine.time;assert.equal(await engine.hotUpdate(compile("t330v2'3e0")),false);assert.equal(engine.time,time);assert.equal(ctx.sources.length,1);assert.equal(first.stopAt,2.065);ctx.currentTime=2;(engine as unknown as {tick:()=>void}).tick();assert.equal(ctx.sources.length,2);assert.equal(ctx.sources[1].startAt,2.06);assert.equal(ctx.sources[1].frequency.calls[0].value,330);ctx.currentTime=2.1;(engine as unknown as {tick:()=>void}).tick();assert.equal(engine.editRevision,1);assert.equal(engine.currentScore?.duration,3);}));
test('hot edits glide for one second and a repeated edit holds the audible intermediate value',async()=>withContext(async(engine)=>{const {automationPlan}=await import('../src/audio/automation');const {rampValueAt}=await import('../src/core/curves');await engine.start(compile("s220v2p-1'20e0"));const ctx=engine.context as unknown as Context;ctx.currentTime=2;await engine.hotUpdate(compile("s440v3p1'20e0"));const param=ctx.sources[0].frequency,plan=automationPlan(param)!;assert.equal(plan.ramp.start,220);assert.equal(rampValueAt(plan.ramp,.5),Math.sqrt(220*440));assert.equal(rampValueAt(plan.ramp,1),440);ctx.currentTime=2.5;await engine.hotUpdate(compile("s330v4p0'20e0"));assert.equal(automationPlan(param)!.ramp.start,Math.sqrt(220*440));assert.equal(ctx.sources.length,1);assert.equal(engine.time,2.44);}));
test('editing pan does not reschedule an unchanged pitch contour',async()=>withContext(async(engine)=>{await engine.start(compile("s220>440'20v2p-1e0"));const ctx=engine.context as unknown as Context,param=ctx.sources[0].frequency,count=param.calls.length;ctx.currentTime=2;await engine.hotUpdate(compile("s220>440'20v2p1e0"));assert.equal(param.calls.length,count);assert.equal(ctx.sources.length,1);}));
test('equal static reverb voices share one convolver instead of multiplying native tails',async()=>withContext(async(engine)=>{await engine.start(compile("s220v1'1r3 t330v1'1r3 a440v1'1r3"));const ctx=engine.context as unknown as Context;assert.equal(ctx.nodes.filter(n=>n.buffer&&!('startAt' in n)).length,1);assert.equal(engine.health.reverbs,1);engine.stop();assert.equal(engine.health.reverbs,0);}));
test('input requests a stream only on Play and panic releases every microphone track',async()=>withContext(async(engine)=>{const descriptor=Object.getOwnPropertyDescriptor(navigator,'mediaDevices');let requested=0,stopped=0;const stream={getAudioTracks:()=>[{getSettings:()=>({channelCount:1})}],getTracks:()=>[{stop:()=>stopped++}]};Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{requested++;return stream;}}});const original=(Context.prototype as unknown as {createMediaStreamSource?:()=>unknown}).createMediaStreamSource;(Context.prototype as unknown as {createMediaStreamSource:()=>unknown}).createMediaStreamSource=function(this:Context){return this.node();};try{assert.equal(requested,0);await engine.start(compile("!i1=(0.9) id0.3v2'1"));assert.equal(requested,1);assert.equal(engine.inputReady,true);engine.stop();assert.equal(stopped,1);assert.equal(engine.inputReady,false);}finally{if(descriptor)Object.defineProperty(navigator,'mediaDevices',descriptor);else delete (navigator as unknown as {mediaDevices?:unknown}).mediaDevices;if(original)(Context.prototype as unknown as {createMediaStreamSource:()=>unknown}).createMediaStreamSource=original;else delete (Context.prototype as unknown as {createMediaStreamSource?:()=>unknown}).createMediaStreamSource;}}));
test('a pan transition inside a growth definition reaches its endpoint before the source ends',async()=>withContext(async(engine)=>{await engine.start(compile("left=(A N12 s220v0.7e1354'0.8p-0.6>1)\nright=(A N12 s222.75v0.7e1354'0.8p0.6>-1)\nleft right"));const ctx=engine.context as unknown as Context,panners=ctx.nodes.filter(n=>n.pan);assert.equal(panners.length,4);for(const p of panners){assert.equal(p.pan.calls.at(-1).kind,'linear');assert.ok(Math.abs(p.pan.calls.at(-1).time-.86)<1e-9);assert.ok(Math.abs(p.pan.calls.at(-1).value)===1);}assert.ok(ctx.sources.every(n=>n.stopAt>=.86));}));

test('offset input pan sweep reaches its endpoint while its channel remains open for the entire gate',async()=>withContext(async(engine)=>{
 const descriptor=Object.getOwnPropertyDescriptor(navigator,'mediaDevices');
 const stream={getAudioTracks:()=>[{getSettings:()=>({channelCount:1})}],getTracks:()=>[{stop(){}}]};
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>stream}});
 const prototype=Context.prototype as unknown as {createMediaStreamSource?:()=>unknown},original=prototype.createMediaStreamSource;
 prototype.createMediaStreamSource=function(this:Context){return this.node();};
 try{
  engine.loop=false;await engine.start(compile("2i1h.1p1>-1'0.5"));const ctx=engine.context as unknown as Context;
  ctx.currentTime=2;(engine as any).tick();
  const pan=ctx.nodes.find(n=>n.pan);assert.equal(pan.pan.calls.at(-1).value,-1);assert.ok(Math.abs(pan.pan.calls.at(-1).time-2.56)<1e-9);
  const tap=ctx.nodes.find(n=>n.gain?.calls.some((c:any)=>c.value===1&&Math.abs(c.time-2.06)<1e-9)&&n.gain.calls.some((c:any)=>c.value===0&&Math.abs(c.time-2.565)<1e-9));assert.ok(tap);
  assert.ok(tap.gain.calls.some((c:any)=>c.value===0&&Math.abs(c.time-2.565)<1e-9));
 }finally{engine.stop();if(descriptor)Object.defineProperty(navigator,'mediaDevices',descriptor);else delete (navigator as unknown as {mediaDevices?:unknown}).mediaDevices;if(original)prototype.createMediaStreamSource=original;else delete prototype.createMediaStreamSource;}
}));

test('FM voice v automates the carrier output; the modulator connects only to frequency',async()=>withContext(async(engine)=>{
 await engine.start(compile("t82.5>1000:s270.5i9>0v1>0'5"));const ctx=engine.context as unknown as Context,[carrier,modulator]=ctx.sources;
 assert.equal(carrier.type,'triangle');assert.equal(modulator.type,'sine');const depth=modulator.connections[0] as any;assert.deepEqual(depth.connections,[carrier.frequency]);
 assert.ok(ctx.nodes.some(n=>n.gain?.calls.some((c:any)=>c.value===.16/9&&c.time===.06)&&n.gain.calls.some((c:any)=>c.value===0&&Math.abs(c.time-5.06)<1e-9)));
 assert.ok(depth.gain.calls.some((c:any)=>c.value===0&&c.time===2.06));
}));
test('group gain is downstream of its whole reverb mix and hot edits retain its graph',async()=>withContext(async(engine)=>{
 await engine.start(compile("(s220v1'5 t330v1'5)r3v9>0'5"));const ctx=engine.context as unknown as Context;
 const fader=ctx.nodes.find(n=>n.gain?.calls.some((c:any)=>c.value===1&&c.time===.06)&&n.gain.calls.some((c:any)=>c.value===0&&Math.abs(c.time-5.06)<1e-9));assert.ok(fader);
 const reverb=ctx.nodes.find(n=>n.buffer&&!('startAt' in n)),wet=reverb.connections[0],sum=wet.connections[0];assert.ok(sum.connections.includes(fader),'both wet and dry pass through the final group fader');
 const nodes=ctx.nodes.length;ctx.currentTime=1;assert.equal(await engine.hotUpdate(compile("(s220v1'5 t330v1'5)r3v6>0'5")),true);assert.equal(ctx.nodes.length,nodes);
 engine.stop();assert.ok(fader.disconnected);
}));

test('an accumulated layer queues without cutting the original voice and joins it at the next loop',async()=>withContext(async(engine)=>{
 const {validateAccretion}=await import('../src/core/accretion');const source="G&(s220v0.3'1)",old=compile(source),checked=validateAccretion(source,old.mutations![0],"t330v0.1'0.2",3181);assert.equal(checked.ok,true);if(!checked.ok)return;
 await engine.start(old);const ctx=engine.context as unknown as Context,original=ctx.sources[0];ctx.currentTime=.2;
 assert.equal(await engine.hotUpdate(compile(checked.source)),false);assert.equal(ctx.sources.length,1);assert.equal(original.stopAt,1.065);
 ctx.currentTime=1;(engine as any).tick();assert.equal(ctx.sources.length,3);assert.equal(ctx.sources[1].frequency.calls[0].value,220);assert.equal(ctx.sources[2].frequency.calls[0].value,330);assert.equal(ctx.sources[1].startAt,1.06);assert.equal(ctx.sources[2].startAt,1.06);
}));

test('native free, nested-bus and feedback delay lines receive full sweeps and enough buffer capacity',async()=>{
 for(const source of ["s100v0.1e0'12d1>9'12", "((s100v0.1e0'12)d1>9'12)r3", "{s100v0.1e0'0.1}d1>9'12g0.8v1'12"]){await withContext(async(engine)=>{await engine.start(compile(source));const ctx=engine.context as unknown as Context,delays=ctx.nodes.filter(n=>n.delayTime);assert.ok(delays.length);for(const d of delays){const end=d.delayTime.calls.at(-1);assert.equal(end.kind,'linear');assert.ok(Math.abs(end.time-12.06)<1e-8);assert.ok(end.value>=9);assert.ok(d.maximum>=end.value);}});}
});
test('increasing a voice or group delay in hot edit retains its graph and extends tail lifetime',async()=>{
 for(const group of [false,true])await withContext(async(engine)=>{
  const score=(end:number)=>compile(group?`(s100v0.1e0'12)d0.1>${end}'12`:`s100v0.1e0'12d0.1>${end}'12`);engine.loop=false;await engine.start(score(1));const ctx=engine.context as unknown as Context,number=ctx.nodes.length;ctx.currentTime=.5;assert.equal(await engine.hotUpdate(score(9)),true);assert.equal(ctx.nodes.length,number);ctx.currentTime=21;(engine as any).tick();assert.equal(engine.running,true,'the longer echo tail survives the old cleanup horizon');
 });
});

test('generator routing creates a harmonic carrier/modulator pair and queues bank changes safely',async()=>withContext(async(engine)=>{
 const score=compile("G123@gov s220v1e0'1");assert.deepEqual(score.diagnostics,[]);assert.ok(score.events.every(e=>typeof e.generatorMix==='number'));
 await engine.start(score);const ctx=engine.context as unknown as Context;assert.ok(ctx.sources.length>=2);assert.equal(ctx.sources.length%2,0);assert.ok(ctx.sources.every(n=>n.periodicWave));
 const next={...score,events:score.events.map(e=>({...e,generatorMix:(e.generatorMix!+1)%9}))};const count=ctx.sources.length;assert.equal(await engine.hotUpdate(next),false);assert.equal(engine.queuedScore,next);assert.equal(ctx.sources.length,count);
}));

test('next-loop mode queues compatible values without touching voices or committing a distant boundary',async()=>withContext(async(engine)=>{
 await engine.start(compile("s220v2'20e0"));const ctx=engine.context as unknown as Context,first=ctx.sources[0];ctx.currentTime=.5;
 const next=compile("s440v2'20e0");assert.equal(engine.queueUpdate(next),true);(engine as any).tick();
 assert.equal(engine.queuedScore,next);assert.equal(engine.currentScore?.events[0].freq.start,220);assert.equal(ctx.sources.length,1);assert.equal(first.frequency.calls[0].value,220);
 engine.cancelQueuedUpdate();ctx.currentTime=20;(engine as any).tick();assert.equal(ctx.sources[1].frequency.calls[0].value,220);
}));
test('next-loop mode applies only the latest valid queued snapshot at the real boundary',async()=>withContext(async(engine)=>{
 await engine.start(compile("s220v2'2e0"));const ctx=engine.context as unknown as Context;ctx.currentTime=.5;
 engine.queueUpdate(compile("s330v2'2e0"));engine.queueUpdate(compile("t440v2'3e0"));assert.equal(engine.queueUpdate(compile('t:')),false);
 ctx.currentTime=2;(engine as any).tick();assert.equal(ctx.sources[1].frequency.calls[0].value,440);assert.equal(ctx.sources[1].type,'triangle');
 ctx.currentTime=2.1;(engine as any).tick();assert.equal(engine.currentScore?.duration,3);assert.equal(engine.editRevision,1);
}));
test('on-writing parameters retain the oscillator and use Glide; invalid text preserves current audio',async()=>withContext(async(engine)=>{
 await engine.start(compile("s220v2'10e0"));const ctx=engine.context as unknown as Context;ctx.currentTime=1;const first=ctx.sources[0],time=engine.time;
 assert.equal(await engine.writeUpdate(compile("s330v2'10e0")),true);assert.equal(ctx.sources.length,1);assert.equal(engine.time,time);
 assert.equal(await engine.writeUpdate(compile('s220:')),false);assert.equal(engine.currentScore?.events[0].freq.start,330);assert.ok(Math.abs(first.stopAt-10.065)<1e-9);
}));
test('on-writing structure crossfades graphs at a fresh phrase without restarting the global clock',async()=>withContext(async(engine)=>{
 await engine.start(compile("s220v2'20e0"));const ctx=engine.context as unknown as Context;ctx.currentTime=3;const time=engine.time,master=ctx.nodes[0],old=(engine as any).graph;
 assert.equal(await engine.writeUpdate(compile("(t330v2'2e0)r4")),true);
 assert.equal(engine.time,time);assert.equal(engine.currentScore?.events[0].wave,'t');assert.ok(Math.abs(engine.cycleTime)<.001);assert.equal(ctx.sources.length,2);
 assert.ok(old.gain.calls.some((c:any)=>c.kind==='linear'&&c.value===0));assert.ok((engine as any).graph.gain.calls.some((c:any)=>c.kind==='linear'&&c.value===1));
 assert.equal(master.gain.calls.at(-1).value,.6);assert.equal(engine.editRevision,1);assert.equal(engine.lastEditMode,'write');assert.equal(engine.queuedScore,undefined);
}));
test('on-writing structure can renew a Loop-off phrase and then drain instead of looping',async()=>withContext(async(engine)=>{
 engine.loop=false;await engine.start(compile("s220v2'20e0"));const ctx=engine.context as unknown as Context;ctx.currentTime=2;
 assert.equal(await engine.writeUpdate(compile("t330v2'1e0")),true);assert.equal(ctx.sources.length,2);
 ctx.currentTime=4;(engine as any).tick();assert.equal(engine.running,false);
}));

test('UL commenting removes a layer at the boundary, accepts a completely silent draft and resumes',async()=>withContext(async(engine)=>{
 const source="s220v2'1e0\nt440v2'1e0";
 await engine.start(compile(source));const ctx=engine.context as unknown as Context;
 assert.equal(ctx.sources.length,2);
 ctx.currentTime=.3;assert.equal(engine.queueUpdate(compile("# s220v2'1e0\nt440v2'1e0")),true);
 (engine as any).tick();assert.equal(ctx.sources.length,2,'current loop is preserved');
 ctx.currentTime=1;(engine as any).tick();assert.equal(ctx.sources.length,3);
 assert.equal(ctx.sources.at(-1).type,'triangle','only the uncommented layer is retriggered');
 const silent=compile("# s220v2'1e0\n# t440v2'1e0",3181,0,0,true);
 assert.deepEqual(silent.diagnostics,[]);assert.equal(silent.events.length,0);
 assert.equal(engine.queueUpdate(silent),true);
 ctx.currentTime=2;(engine as any).tick();ctx.currentTime=2.1;(engine as any).tick();
 assert.equal(engine.currentScore?.events.length,0);assert.equal(ctx.sources.length,3);assert.equal(engine.running,true);assert.equal(engine.currentScore?.duration,1);
 engine.refreshSourceRanges(compile('# another comment',3181,0,0,true));
 assert.equal(engine.currentScore?.duration,1,'comment-only edits must not collapse the silent clock to zero');
 assert.ok(compile('s220:',3181,0,0,true).diagnostics.length,'invalid writing still retains audio');
 engine.queueUpdate(compile(source));ctx.currentTime=3;(engine as any).tick();
 assert.equal(ctx.sources.length,5,'uncommenting returns both rows on the original clock');
}));

test('lyrics use PCM as the source, vocoder as an owned graph, and panic stops both carrier and speech',async()=>withContext(async(engine)=>{
 (engine as any).lyricBuffers.set('hello',{duration:2});
 await engine.start(compile("l[hello]:s[220 330]v4'1r2"));const ctx=engine.context as unknown as Context;
 assert.equal(ctx.sources.length,2,'one PCM modulator and one harmonic carrier');
 assert.equal(ctx.sources[0].playbackRate.value,1);assert.equal(ctx.sources[1].frequency.calls[0].value,220);
 assert.equal(ctx.nodes.filter(n=>n.type==='bandpass').length,32,'sixteen analysis and synthesis bands');
 assert.equal(engine.queueUpdate(compile("l[new words]:s220'2")),false,'new text requires prepared PCM');
 assert.equal(engine.lastError,'Press Play to prepare changed lyrics.');
 engine.stop();assert.ok(ctx.sources.every(n=>n.stopAt!==undefined));assert.equal(engine.running,false);
}));
test('STOP during local voice preparation cannot cause delayed autoplay',async()=>withContext(async(engine)=>{
 let release!:(v:any)=>void;
 (engine as any).speech={synthesize:()=>new Promise(resolve=>release=resolve),cancel(){}};
 const start=engine.start(compile("l[hello]'2"));await Promise.resolve();await Promise.resolve();
 engine.stop();release({samples:new Float32Array(24000),sampleRate:24000});
 assert.equal(await start,false);assert.equal(engine.running,false);
}));

test('ordered bus filter/pan process a named output together and hot edits retain the native nodes',async()=>withContext(async(engine)=>{
 const source="roll=(s220v2'8 t330v1'8) {roll}f1>8p1>-1r3";
 await engine.start(compile(source));const ctx=engine.context as unknown as Context;
 const filter=ctx.nodes.find(n=>n.type==='lowpass'),pan=ctx.nodes.find(n=>n.pan);
 assert.ok(filter&&pan);assert.ok(filter.connections.includes(pan),'the written filter feeds the written panner');
 assert.equal(pan.pan.calls[0].value,1);assert.ok(pan.pan.calls.some((c:any)=>c.value===-1&&Math.abs(c.time-8.06)<1e-9));
 ctx.currentTime=2;const count=ctx.nodes.length;assert.equal(await engine.hotUpdate(compile(source.replace('f1>8p1>-1','f2>7p0.5>-0.5'))),true);assert.equal(ctx.nodes.length,count);assert.equal(engine.time,1.94);
 assert.ok(pan.pan.calls.some((c:any)=>c.value===-.5));assert.equal(engine.currentScore?.feedback.length,0);
}));

test('vocoder w crossfades owned dry/wet gains and hot edits retain the speech and carrier',async()=>withContext(async(engine)=>{
 (engine as any).lyricBuffers.set('hello',{duration:2});
 await engine.start(compile("l_[hello]:s220w0v4'2"));const ctx=engine.context as unknown as Context;
 assert.ok(ctx.nodes.some(n=>n.gain?.calls.some((c:any)=>c.value===1.8)),'w0 exposes normalized raw voice');
 const count=ctx.nodes.length;ctx.currentTime=.5;assert.equal(await engine.hotUpdate(compile("l_[hello]:s220w9v4'2")),true);assert.equal(ctx.nodes.length,count);assert.equal(ctx.sources.length,2);
 assert.ok(ctx.nodes.some(n=>n.gain?.calls.some((c:any)=>c.value===1)),'w9 opens vocoder path');
}));

test('selected sections retain their span during hot edits and return to whole piece if marks are removed',async()=>withContext(async(engine)=>{
 const full=compile(";intro s220'1 ;chorus t330v1'1");await engine.start(sectionScore(full,1));
 assert.equal(await engine.hotUpdate(compile(";intro s220'1 ;chorus t440v1'1")),true);assert.equal(engine.currentScore!.events.length,1);assert.equal(engine.currentScore!.events[0].freq.start,440);assert.equal(engine.currentScore!.playbackRange?.index,1);
 assert.equal(await engine.hotUpdate(compile("q550'1")),false);assert.equal(engine.queuedScore!.playbackRange?.index,-1);
}));
test('random section loops redraw only the selected span rather than reverting to the full source',async()=>withContext(async(engine)=>{
 const full=compile(";intro s220'1 ;chorus t?[330 440]v1'1");await engine.start(sectionScore(full,1));const ctx=engine.context as unknown as Context;
 for(let i=1;i<=5;i++){ctx.currentTime=i+.07;(engine as any).tick();assert.equal(engine.currentScore!.events.length,1);assert.equal(engine.currentScore!.playbackRange?.index,1);assert.ok([330,440].includes(engine.currentScore!.events[0].freq.start));}
}));
