/** Shared elapsed-time orbit; pausing never snaps back to the initial camera. */
export function createOrbitClock(radiansPerMs:number){
 let phase=0,last:number|undefined,wasEnabled=false;
 return {sample(now:number,enabled:boolean){
  if(last!==undefined&&wasEnabled)phase+=Math.max(0,now-last)*radiansPerMs;
  last=now;wasEnabled=enabled;return phase;
 }};
}
