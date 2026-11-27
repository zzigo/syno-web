export interface EditorFile {id:string;name:string;title:string;source:string;seed?:number;loop?:boolean;key?:string}
export const FILES_KEY='syno.lab.editorFiles.v1';
export function fileName(name:string){return name.split('/').at(-1)||'score.syn';}
export function readEditorFiles(storage:Pick<Storage,'getItem'>):EditorFile[]{try{const data=JSON.parse(storage.getItem(FILES_KEY)||'[]');if(!Array.isArray(data))return [];return data.filter((d:EditorFile)=>typeof d.id==='string'&&/^(?:editor|file-\d+)$/.test(d.id)&&typeof d.source==='string'&&d.source.length<=64000&&typeof d.name==='string'&&typeof d.title==='string').slice(0,24);}catch{return [];}}
