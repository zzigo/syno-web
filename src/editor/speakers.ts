// SPDX-License-Identifier: 0BSD
import {contextCommandAt} from '../core/context-command';
import {SPEAKER_PRESETS,speakerPreset} from '../core/speaker-presets';
export function cycleSpeakers(source:string,cursor:number,direction:number){
 const command=contextCommandAt(source,cursor);if(command?.name!=='Speaker preset')return;
 const prefix=command.token.startsWith('!')?'!spk':'spk',key=command.token.slice(prefix.length);let current:string;try{current=speakerPreset(key).key;}catch{return;}
 const i=SPEAKER_PRESETS.findIndex(p=>p.key===current);if(i<0)return;
 const next=SPEAKER_PRESETS[(i+Math.sign(direction)+SPEAKER_PRESETS.length)%SPEAKER_PRESETS.length].key,text=prefix+next;
 return {from:command.from,to:command.to,text,caret:Math.min(command.from+text.length,cursor)};
}
