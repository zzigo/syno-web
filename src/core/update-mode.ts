export const UPDATE_MODES=['manual','loop','write'] as const;
export type UpdateMode=typeof UPDATE_MODES[number];
export const UPDATE_MODE_KEY='syno.lab.updateMode';
export function updateMode(value:unknown):UpdateMode{return UPDATE_MODES.includes(value as UpdateMode)?value as UpdateMode:'manual';}
export const UPDATE_INFO={manual:{mark:'',title:'Manual · Cmd/Ctrl+Enter applies the score'},loop:{mark:'L',title:'Next loop · valid edits enter at the next cycle; invalid text cancels an uncommitted draft'},write:{mark:'W',title:'On writing · valid edits apply after 300 ms; parameters glide, structural edits crossfade into a fresh phrase'}};
export function automaticUpdate(mode:UpdateMode,playing:boolean,owner:string,valid:boolean,dirty:boolean){return playing&&owner==='editor'&&valid&&dirty&&mode!=='manual'?mode:undefined;}
