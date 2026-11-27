import {patchSnapshot,type PatchSnapshot} from './shared-patch';
export const LOCAL_PATCHES_KEY='syno.lab.patches.v1';
export interface LocalPatch extends PatchSnapshot {id:string;savedAt:string}
type StorageAccess=Pick<Storage,'getItem'|'setItem'>;
export function readLocalPatches(storage:StorageAccess):LocalPatch[]{
 const raw=storage.getItem(LOCAL_PATCHES_KEY);if(!raw)return [];
 const data=JSON.parse(raw);if(!Array.isArray(data))throw Error('The local patch library cannot be read.');
 return data.map(entry=>{const patch=patchSnapshot(entry);if(typeof entry.id!=='string'||entry.id.length>80||typeof entry.savedAt!=='string')throw Error('The local patch library contains an invalid entry.');return {...patch,id:entry.id,savedAt:entry.savedAt} as LocalPatch;});
}
export function saveLocalPatch(storage:StorageAccess,value:PatchSnapshot):LocalPatch{
 const patch=patchSnapshot(value),patches=readLocalPatches(storage),same=patches.find(p=>p.title===patch.title&&p.source===patch.source&&p.seed===patch.seed&&p.loop===patch.loop);if(same)return same;
 const entry={...patch,id:crypto.randomUUID(),savedAt:new Date().toISOString()};storage.setItem(LOCAL_PATCHES_KEY,JSON.stringify([entry,...patches]));return entry;
}
