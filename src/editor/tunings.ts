import {contextCommandAt} from '../core/context-command';
import {tuningAliases} from '../core/tuning';

/** Cycle only a lexical named tuning; numeric/custom tunings keep their own controls. */
export function cycleTuning(source:string,cursor:number,direction:number){
 const command=contextCommandAt(source,cursor);
 if(command?.section!=='Tuning · cents, ratios, periods')return;
 const index=tuningAliases.indexOf(command.token.slice(1));
 if(index<0)return;
 const alias=tuningAliases[(index+Math.sign(direction)+tuningAliases.length)%tuningAliases.length];
 return {from:command.from,to:command.to,text:'u'+alias,caret:cursor};
}
