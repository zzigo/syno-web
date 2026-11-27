/** Keep narration inspectable as score comments; never repair invalid musical tokens. */
export function extractScore(text:string):string {
  const fenced=text.match(/```(?:syno|text)?\s*\n([\s\S]*?)```/i);
  const candidate=(fenced?.[1]||text).trim();
  const names=new Set([...candidate.matchAll(/^\s*([a-z_]{2,})=/gm)].map(match=>match[1]));
  return candidate.split('\n').map(line=>{
    const trimmed=line.trim();if(!trimmed||trimmed.startsWith('#'))return line;
    const isCode=/^(?:!|\?|@|\$|[(){}]|[A-Z](?=[0-9.\s:>=]|$)|-?(?:\d+(?:\.\d*)?|\.\d+)[staqn]|[a-z](?=[0-9*:'<>^-]|$)|[a-z_]{2,}(?==|[-.\d]))/.test(trimmed)||names.has(trimmed);
    return isCode?line:`# ${line}`;
  }).join('\n');
}
