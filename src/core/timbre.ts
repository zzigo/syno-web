import {rng} from '../vendor/fold-generators.js';
import type {Wave} from './types';
export function timbreForCycle(options:Wave[],seed:number,id:number,cycle:number):Wave{
 const stream=(seed^Math.imul(id+1,0x9e3779b9)^Math.imul(cycle,0x85ebca6b))>>>0;
 return options[Math.floor(rng(stream)()*options.length)];
}
export function frequencyForCycle(range:[number,number],seed:number,id:number,cycle:number){
 const stream=(seed^Math.imul(id+1,0xc2b2ae35)^Math.imul(cycle,0x27d4eb2f))>>>0;
 return range[0]*(range[1]/range[0])**rng(stream)();
}
/** Independent stream: uniform duration in seconds, reproducible per event and loop. */
export function durationForCycle(range:[number,number],seed:number,id:number,cycle:number){
 const stream=(seed^Math.imul(id+1,0x165667b1)^Math.imul(cycle,0xd3a2646c)^0xa511e9b3)>>>0;
 return range[0]+(range[1]-range[0])*rng(stream)();
}
export function panForCycle(base:import('./types').Ramp,choice:import('./types').PanRandom,seed:number,id:number,cycle:number,duration:number){
 const draw=(range:[number,number],salt:number)=>{const stream=(seed^Math.imul(id+1,0x9e3779b1)^Math.imul(cycle,0x7f4a7c15)^salt)>>>0;return range[0]+(range[1]-range[0])*rng(stream)();};
 const start=choice.start?draw(choice.start,0x632be5ab):base.start;
 const end=choice.sweep?(choice.end?draw(choice.end,0x85157af5):base.end):start;
 return {...base,start,end,duration:choice.followDuration?duration:base.duration};
}
export function frequencyRampForCycle(event:Pick<import('./types').NoteEvent,'freq'|'freqRange'|'freqEndRange'|'freqRandomSweep'|'freqSweepFollowsGate'|'dur'|'id'>,seed:number,cycle:number){
 const start=event.freqRange?frequencyForCycle(event.freqRange,seed,event.id,cycle):event.freq.start;
 const end=event.freqRandomSweep?(event.freqEndRange?frequencyForCycle(event.freqEndRange,seed^0x68bc21eb,event.id,cycle):event.freq.end):start;
 return {...event.freq,start,end,duration:event.freqRandomSweep?(event.freqSweepFollowsGate?event.dur:event.freq.duration):0};
}
