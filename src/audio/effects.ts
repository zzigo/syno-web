export const MIN_DELAY_SECONDS=.001;
export const MAX_DELAY_SECONDS=9;
/** Perceptual cutoff scale: equal steps span equal frequency ratios. */
export const filterHz=(value:number,sampleRate:number)=>Math.min(sampleRate*.45,40*(18000/40)**(value/9));
/** Retains the v1 chopper period scale, in seconds. h0 is fastest. */
export const chopPeriod=(value:number)=>.1+value*.8/9;
/** Native looping gate with short fades; no per-voice JavaScript timer. */
export function chopCurve(){
 const points=new Float32Array(256);
 for(let i=0;i<points.length;i++){
  const phase=i/(points.length-1);
  points[i]=phase<.48?1:phase<.5?( .5-phase)/.02:phase<.98?0:(phase-.98)/.02;
 }
 return points;
}

/** One control opens the wet mix and extends its audible decay. */
export const reverbSeconds=(amount:number)=>amount===0?0:.35+.7*amount;
export function reverbMix(amount:number){const angle=amount/9*Math.PI*.4;return {dry:Math.cos(angle),wet:Math.sin(angle)};}

export const echoTail=(seconds:number)=>seconds*8;
