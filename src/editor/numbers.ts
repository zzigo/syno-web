/** The digit under the caret sets the step; at token end use its last digit. */
export function adjustNumericToken(token:string,caret:number,direction:number,fine=false){
 let index=Math.max(0,Math.min(token.length-1,caret));
 while(index<token.length&&!/\d/.test(token[index]))index++;
 if(index>=token.length)index=token.length-1;
 const dot=token.indexOf('.'),decimal=dot<0?token.length:dot;
 const exponent=index<decimal?decimal-index-1:decimal-index;
 const power=exponent-(fine?1:0),step=10**power,precision=Math.min(12,Math.max(dot<0?0:token.length-dot-1,-power));
 const value=Number(token)+direction*step;
 if(!Number.isFinite(value)||Math.abs(value)>=1e21)return {text:token,caret,step};
 let text=value.toFixed(precision);if(dot<0&&/^0\d+$/.test(token)&&value>=0)text=text.padStart(token.length,'0');const newDot=text.includes('.')?text.indexOf('.'):text.length;
 const nextIndex=exponent>=0?newDot-exponent-1:newDot-exponent;
 return {text,caret:caret>=token.length&&precision===(dot<0?0:token.length-dot-1)?text.length:Math.max(text[0]==='-'?1:0,Math.min(text.length,nextIndex)),step};
}
