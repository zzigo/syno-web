/** A single minimal replacement, shared by the editor animation and its tests. */
export function mutationRange(before:string,after:string){
 let from=0,tail=0;
 while(from<before.length&&from<after.length&&before[from]===after[from])from++;
 // Never split a surrogate pair when a musical comment contains emoji.
 if(from>0&&/[\uD800-\uDBFF]/.test(before[from-1]))from--;
 while(tail<before.length-from&&tail<after.length-from&&before[before.length-1-tail]===after[after.length-1-tail])tail++;
 if(tail>0&&/[\uDC00-\uDFFF]/.test(after[after.length-tail]))tail--;
 return {from,to:after.length-tail,removed:before.slice(from,before.length-tail),inserted:after.slice(from,after.length-tail)};
}
