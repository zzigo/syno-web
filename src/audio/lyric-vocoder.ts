import {automateMapped} from './automation';
import type {Ramp} from '../core/types';
/** HYLON-style logarithmic analysis/synthesis bank: rectification → envelope → carrier bands. */
export function lyricVocoder(ctx:BaseAudioContext,modulator:AudioNode,carrier:AudioNode){
 const output=ctx.createGain(),nodes:AudioNode[]=[output];output.gain.value=2.5;
 const curve=Float32Array.from({length:2049},(_,i)=>Math.abs(i/1024-1));
 for(let band=0;band<16;band++){
  const hz=160*(6400/160)**(band/15),analysis=ctx.createBiquadFilter(),synthesis=ctx.createBiquadFilter(),rectifier=ctx.createWaveShaper(),envelope=ctx.createBiquadFilter(),depth=ctx.createGain(),gate=ctx.createGain();
  analysis.type=synthesis.type='bandpass';analysis.frequency.value=synthesis.frequency.value=hz;analysis.Q.value=synthesis.Q.value=3;
  rectifier.curve=curve;envelope.type='lowpass';envelope.frequency.value=35;envelope.Q.value=.707;depth.gain.value=8;gate.gain.value=0;
  modulator.connect(analysis).connect(rectifier).connect(envelope).connect(depth).connect(gate.gain);
  carrier.connect(synthesis).connect(gate).connect(output);nodes.push(analysis,synthesis,rectifier,envelope,depth,gate);
 }
 return {output,nodes};
}
/** A sine bank gives the s carrier enough harmonics to articulate consonants. */
export function lyricCarrier(ctx:BaseAudioContext,wave:string){
 const real=new Float32Array(65),imag=new Float32Array(65);
 for(let k=1;k<65;k++)imag[k]=wave==='q'&&k%2===0?0:wave==='t'?(k%2?1/k**1.4:0):1/k;
 return ctx.createPeriodicWave(real,imag);
}

/** Equal-power dry/wet blend; dry trim matches the standalone lyric voice. */
export function vocoderBlend(ctx:BaseAudioContext,drySource:AudioNode,wetSource:AudioNode,ramp:Ramp,at:number){
 const dry=ctx.createGain(),wet=ctx.createGain(),output=ctx.createGain();
 drySource.connect(dry).connect(output);wetSource.connect(wet).connect(output);
 const update=(value:Ramp,now:number,age=0)=>{automateMapped(dry.gain,value,v=>v>=9?0:1.8*Math.cos(Math.max(0,v)/9*Math.PI/2),now,age);automateMapped(wet.gain,value,v=>v<=0?0:Math.sin(Math.min(9,v)/9*Math.PI/2),now,age);};
 update(ramp,at);return{output,nodes:[dry,wet,output],update};
}
