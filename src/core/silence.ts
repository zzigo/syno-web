import {durationForCycle} from './timbre';
/** Probability gates retain duration/IDs; members of one group share the same draw. */
export function probabilisticSilence(gates:{key:number;chance:number}[]|undefined,seed:number,cycle:number){return gates?.some(g=>durationForCycle([0,1],seed,g.key,cycle)<g.chance)??false;}
