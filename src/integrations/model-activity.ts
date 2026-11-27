import type {TelemetryMetrics} from '@orf/core';
export interface ModelActivity {working:boolean;phase:string;algorithm:string;elapsed:number;promptTokens:number;completionTokens:number;estimated:boolean}
export function tokenUsage(metrics:TelemetryMetrics|undefined,promptCharacters:number,responseCharacters:number){
 const promptProvider=metrics?.promptTokenBasis==='provider',completionProvider=metrics?.completionTokenBasis==='provider'&&((metrics?.completionTokens??0)>0||responseCharacters===0);
 return {promptTokens:promptProvider?metrics!.promptTokens:Math.max(metrics?.promptTokens??0,Math.ceil(promptCharacters/4)),completionTokens:completionProvider?metrics!.completionTokens:Math.max(metrics?.completionTokens??0,Math.ceil(responseCharacters/4)),estimated:!promptProvider||!completionProvider};
}
export function activityLabel(activity:ModelActivity){return `${activity.working?'AI':'ai'}${activity.algorithm&&activity.algorithm!=='proposal'?' '+activity.algorithm:''} ${activity.working?(activity.phase==='waiting'?'wait ':'')+activity.elapsed.toFixed(1)+'s · ':''}${activity.estimated?'≈':''}${activity.promptTokens}/${activity.completionTokens} tok`;}

export function agentIndicator(activity:ModelActivity,algorithm:string|undefined,flags:{paused:boolean;playing:boolean;ready:boolean}){
 const usage=`${activity.estimated?'≈':''}${activity.promptTokens}/${activity.completionTokens} tokens · ${activity.phase} · ${activity.elapsed.toFixed(1)}s`;
 if(activity.working)return {label:activityLabel(activity),working:activity.phase!=='writing',title:usage};
 if(!algorithm)return activity.algorithm?{label:activityLabel(activity),working:false,title:usage}:undefined;
 const label=`AI ${algorithm}`;
 if(flags.paused)return {label:label+' PAUSE',working:false,title:'Mutations are paused. Resume in Agents. '+usage};
 if(!flags.ready)return {label:label+' MODEL',working:false,title:'Waiting for an installed model. Open Agents. '+usage};
 if(activity.algorithm===algorithm&&activity.phase==='error')return {label:label+' !',working:false,title:usage};
 if(activity.algorithm===algorithm&&activity.completionTokens)return {label:activityLabel(activity),working:false,title:usage};
 return {label:label+(flags.playing?' WAIT':' READY'),working:false,title:(flags.playing?'Waiting for the next mutation interval. ':'Play the score to start mutations. ')+usage};
}
