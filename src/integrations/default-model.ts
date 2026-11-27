export const DEFAULT_MODEL='ollama:llama3.2:3b';
export const DEFAULT_MODEL_KEY='syno.lab.defaultModel';
export function chooseDefaultModel<T extends {id:string;name:string}>(models:T[],preferred=DEFAULT_MODEL){
 return models.find(m=>m.id===preferred)??models.find(m=>/llama3\.2:3b/i.test(m.id))??models.find(m=>/(?:^|[:/])llama/i.test(m.id)||/\bllama/i.test(m.name))??models.find(m=>/smollm/i.test(m.id+' '+m.name))??models[0];
}
