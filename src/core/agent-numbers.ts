import {numberRoles} from './number-roles';
/** Agent-written notation uses a tenth grid. Never turn a nonzero gate into zero. */
export function agentNumber(value:number){
 const magnitude=Math.round((Math.abs(value)+Number.EPSILON)*10)/10;
 return String(value===0?0:Math.sign(value)*(magnitude||.1));
}
export function compactAgentNumbers(source:string){
 let result=source;
 for(const role of numberRoles(source).reverse()){
  if(!role.text.includes('.'))continue;
  const value=Number(role.text);if(!Number.isFinite(value))continue;
  result=result.slice(0,role.from)+agentNumber(value)+result.slice(role.to);
 }
 return result;
}
