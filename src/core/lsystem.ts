import type {TurtleTrace} from './lsystem-turtle';
/** Deterministic context-free, parallel rewriting. No audio or UI dependencies. */
export interface RewriteRule { symbol:string; replacement:string }
export interface RewriteGeneration { index:number; word:string; parents:number[] }
export interface LSystemTrace { axiom:string; iterations:number; rules:RewriteRule[]; generations:RewriteGeneration[]; word:string; turtle?:TurtleTrace }
export const MAX_REWRITE_SYMBOLS=2048;
export function deriveLSystem(rules:RewriteRule[],iterations=4,axiom=rules[0]?.symbol||'A'):LSystemTrace {
  if(!Number.isInteger(iterations)||iterations<0||iterations>16)throw new Error('L requires 0–16 rewrite generations.');
  if(!/^[A-Z+\[\]-]+$/.test(axiom)||axiom.length>MAX_REWRITE_SYMBOLS)throw new Error('L-system axiom uses uppercase symbols and + - [ ].');
  if(!rules.length||rules.length>26)throw new Error('L requires 1–26 rewriting rules.');
  const table=new Map<string,string>();
  for(const rule of rules){
    if(!/^[A-Z]$/.test(rule.symbol)||!/^[A-Z+\[\]-]*$/.test(rule.replacement))throw new Error('L rules use one uppercase symbol and a replacement made of uppercase symbols and + - [ ].');
    if(table.has(rule.symbol))throw new Error(`Duplicate L rule for ${rule.symbol}.`);
    if(rule.replacement.length>MAX_REWRITE_SYMBOLS)throw new Error('L replacement exceeds the symbol budget.');
    table.set(rule.symbol,rule.replacement);
  }
  for(const text of [axiom,...rules.map(r=>r.replacement)]){let balance=0;for(const ch of text){if(ch==='[')balance++;if(ch===']'&&--balance<0)throw new Error('Unbalanced L branch brackets.');}if(balance)throw new Error('Unbalanced L branch brackets.');}
  const generations:RewriteGeneration[]=[{index:0,word:axiom,parents:Array(axiom.length).fill(-1)}];
  for(let generation=1;generation<=iterations;generation++){
    const previous=generations[generation-1].word;
    const parts:string[]=[],parents:number[]=[];let size=0;
    for(let parent=0;parent<previous.length;parent++){
      const symbol=previous[parent],replacement=table.get(symbol)??symbol;
      size+=replacement.length;
      if(size>MAX_REWRITE_SYMBOLS)throw new Error(`L generation ${generation} exceeds ${MAX_REWRITE_SYMBOLS} symbols.`);
      parts.push(replacement);for(let child=0;child<replacement.length;child++)parents.push(parent);
    }
    generations.push({index:generation,word:parts.join(''),parents});
  }
  return {axiom,iterations,rules:rules.map(rule=>({...rule})),generations,word:generations.at(-1)!.word};
}
