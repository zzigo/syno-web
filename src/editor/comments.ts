import {EditorState,type ChangeSpec} from '@codemirror/state';
import type {EditorView} from '@codemirror/view';
/** syNo uses # comments; independent of browser keyboard layout or language packages. */
export function scoreCommentChanges(state:EditorState):ChangeSpec[]{
 const lines=new Map<number,ReturnType<typeof state.doc.line>>();
 for(const range of state.selection.ranges){const first=state.doc.lineAt(range.from),last=state.doc.lineAt(range.to);for(let n=first.number;n<=last.number;n++){if(n===last.number&&n>first.number&&range.to===last.from)continue;const line=state.doc.line(n);if(line.text.trim())lines.set(n,line);}}
 const selected=[...lines.values()],uncomment=selected.length>0&&selected.every(line=>/^\s*#/.test(line.text));
 return selected.map(line=>{const indent=line.text.match(/^\s*/)?.[0].length??0,from=line.from+indent;return uncomment?{from,to:from+(line.text.slice(indent).startsWith('# ')?2:1),insert:''}:{from,insert:'# '};});
}
export function toggleScoreComments(view:EditorView){if(view.state.readOnly)return false;view.dispatch({changes:scoreCommentChanges(view.state),userEvent:'input.comment'});return true;}
export const scoreCommentKeys=[{key:'Mod-/',run:toggleScoreComments},{key:'Mod-Shift-7',run:toggleScoreComments}];
export function commentKeydown(event:KeyboardEvent,view:EditorView){if((event.metaKey||event.ctrlKey)&&!event.altKey&&(event.code==='Slash'||event.key==='/')){if(toggleScoreComments(view)){event.preventDefault();return true;}}return false;}
