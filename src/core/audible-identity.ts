import {agentNumber} from './agent-numbers';
import type {NoteEvent,Ramp} from './types';
const ramp=(value:Ramp|undefined)=>{
 if(!value)return undefined;
 if(value.start===value.end&&(!value.points||value.points.every(p=>p.value===value.start)))return {value:value.start};
 return value;
};
/** Ignore AST spelling, variable names, explicit-default flags and volume-only changes. */
export function audibleIdentity(event:NoteEvent,processing?:unknown){
 const graph=processing as {feedback?:unknown;outputBus?:unknown}|undefined;
 const identity={t:event.t,dur:event.dur,wave:event.wave,freq:ramp(event.freq),pan:ramp(event.pan),envelope:event.envelope,
  filter:ramp(event.filter),delay:ramp(event.delay),chop:event.chopRamp?ramp(event.chopRamp):event.chop,
  reverb:event.reverbRamp?ramp(event.reverbRamp):event.reverb,
  modulation:ramp(event.modulation),modulatorWave:event.modulation?event.modulatorWave??'s':undefined,index:event.modulation?ramp(event.index):undefined,
  generatorMix:event.generatorMix,spatial:event.spatial,lyrics:event.lyrics,vocoderMix:ramp(event.vocoderMix),inputChannel:event.inputChannel,
  waveOptions:event.waveOptions,freqRange:event.freqRange,freqEndRange:event.freqEndRange,freqRandomSweep:event.freqRandomSweep||undefined,
  durationRange:event.durationRange,durationChoices:event.durationChoices,panRandom:event.panRandom,restGates:event.restGates,
  feedback:graph?.feedback,outputBus:graph?.outputBus};
 return JSON.stringify(identity,(_key,value)=>typeof value==='number'?Number(agentNumber(value)):value);
}
