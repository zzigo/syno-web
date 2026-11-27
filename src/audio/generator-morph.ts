import {generatorMorph} from '../core/generator-morph';
/** Equal-energy truncated Fourier series; native PeriodicWave handles band limiting. */
export function harmonicCoefficients(weights:number[],partials=64){
 const coefficients=new Float32Array(partials+1);
 for(let wave=0;wave<4;wave++){
  const series=Array.from({length:partials+1},(_,n)=>!n?0:wave===0?(n===1?1:0):wave===1?(n%2?(-1)**((n-1)/2)/(n*n):0):wave===2?(-1)**(n+1)/n:n%2?1/n:0);
  const norm=Math.hypot(...series)||1;for(let n=1;n<=partials;n++)coefficients[n]+=weights[wave]*series[n]/norm;
 }
 const norm=Math.hypot(...coefficients)||1;for(let n=1;n<=partials;n++)coefficients[n]/=norm;return coefficients;
}
const cache=new WeakMap<BaseAudioContext,Map<number,{carrier:PeriodicWave;modulator:PeriodicWave;fmMix:number}>>();
export function generatorWaves(ctx:BaseAudioContext,value:number){
 let bank=cache.get(ctx);if(!bank){bank=new Map();cache.set(ctx,bank);}const key=Math.round(value*1e6)/1e6;let entry=bank.get(key);
 if(!entry){const morph=generatorMorph(key),real=new Float32Array(65);entry={carrier:ctx.createPeriodicWave(real,harmonicCoefficients(morph.carrier),{disableNormalization:true}),modulator:ctx.createPeriodicWave(real,harmonicCoefficients(morph.modulator),{disableNormalization:true}),fmMix:morph.fmMix};if(bank.size>=256)bank.delete(bank.keys().next().value!);bank.set(key,entry);}
 return entry;
}
