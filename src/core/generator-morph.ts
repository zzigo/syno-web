export const TONAL_WAVES=['s','t','a','q'] as const;
export type TonalWave=typeof TONAL_WAVES[number];
export const GENERATOR_STAGES:ReadonlyArray<{carrier:TonalWave;modulator?:TonalWave;label:string}>=[...TONAL_WAVES.map(carrier=>({carrier,label:carrier})),...TONAL_WAVES.flatMap(carrier=>TONAL_WAVES.map(modulator=>({carrier,modulator,label:carrier+':'+modulator})))];
/** Continuous harmonic coordinates, not a random waveform switch. */
export function generatorMorph(value:number){
 let position=Math.max(0,Math.min(9,value))/9*(GENERATOR_STAGES.length-1);if(Math.abs(position-Math.round(position))<1e-10)position=Math.round(position);const low=Math.floor(position),high=Math.min(GENERATOR_STAGES.length-1,low+1),mix=position-low,a=GENERATOR_STAGES[low],b=GENERATOR_STAGES[high];
 const carrier=[0,0,0,0],modulator=[0,0,0,0];carrier[TONAL_WAVES.indexOf(a.carrier)]+=1-mix;carrier[TONAL_WAVES.indexOf(b.carrier)]+=mix;
 if(a.modulator)modulator[TONAL_WAVES.indexOf(a.modulator)]+=1-mix;if(b.modulator)modulator[TONAL_WAVES.indexOf(b.modulator)]+=mix;
 const fmMix=modulator.reduce((sum,v)=>sum+v,0);if(fmMix)for(let i=0;i<4;i++)modulator[i]/=fmMix;else modulator[0]=1;
 const dominant=mix<.5?a:b;
 return {carrier,modulator,fmMix,carrierWave:dominant.carrier,modulatorWave:dominant.modulator??'s',label:low===high||mix<1e-9?a.label:a.label+' → '+b.label};
}
