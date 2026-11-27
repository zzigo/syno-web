import {cycleSpeakers} from './speakers';
import {lyricRanges} from '../core/lyrics';
import {session,applyHotEdit,applyWritingEdit} from '../state.svelte';
import {compile} from '../core/parser';
import {performanceSlots,slotValue,performanceTime,changePerformanceTime,timeText} from '../core/performance';
import {adjustNumericToken} from './numbers';
import {cycleTuning} from './tunings';
import type { EditorView } from '@codemirror/view';
export let activeEditor: EditorView | undefined;
export function registerEditor(view?: EditorView) { activeEditor=view; }
export function focusEditor(){activeEditor?.focus();}
export function changeNumber(direction: number, fine = false) {
  const view=activeEditor;if(!view)return false;
  const cursor=view.state.selection.main.head,line=view.state.doc.lineAt(cursor);
  if(lyricRanges(view.state.doc.toString()).some(r=>cursor>=r.from&&cursor<r.to))return false;
  const tuning=cycleTuning(view.state.doc.toString(),cursor,direction)??cycleSpeakers(view.state.doc.toString(),cursor,direction);
  if(tuning){view.dispatch({changes:{from:tuning.from,to:tuning.to,insert:tuning.text},selection:{anchor:tuning.caret}});return true;}
  const matches=[...line.text.matchAll(/-?(?:\d+(?:\.\d*)?|\.\d+)/g)];
  const match=matches.find(m=>cursor>=line.from+m.index!&&cursor<=line.from+m.index!+m[0].length);
  const label=line.text.match(/;(?:<[^>]*>|(?![bn]\d)[A-Za-z_][A-Za-z_0-9-]*)/);
  if(!match||line.text[match.index!-1]==='*'||label&&match.index!>=label.index!&&match.index!<label.index!+label[0].length)return false;
  const from=line.from+match.index!,to=from+match[0].length;
  const adjusted=adjustNumericToken(match[0],cursor-from,direction,fine);
  view.dispatch({changes:{from,to,insert:adjusted.text},selection:{anchor:from+adjusted.caret}});return true;
}

/** PLAY gestures are explicit hot edits; loop/write modes retain their own scheduling policy. */
export function performanceValue(index:number,value:number){
 const view=activeEditor;if(!view||!session.performanceMode)return false;
 const slot=performanceSlots(session.source,session.performanceAnchor)[index];if(!slot)return false;
 const text=slotValue(slot,value);if(text===slot.text)return false;
 const candidate=session.source.slice(0,slot.from)+text+session.source.slice(slot.to),score=compile(candidate,session.seed);
 if(score.diagnostics.length){session.message=`PLAY · ${score.diagnostics[0].message}`;return false;}
 view.dispatch({changes:{from:slot.from,to:slot.to,insert:text}});
 session.performancePulse=index;if(session.updateMode==='manual')void applyHotEdit();else if(session.updateMode==='write')void applyWritingEdit();return true;
}
export function performanceStep(index:number,direction:number,fine=false){const slot=performanceSlots(session.source,session.performanceAnchor)[index];return slot?performanceValue(index,Number(slot.text)+direction*slot.step*(fine&&!slot.integer?.1:1)):false;}

function replacePerformanceTime(text:string){
 const view=activeEditor,time=performanceTime(session.source,session.performanceAnchor);if(!view||!time||!session.performanceMode||text===time.text)return false;
 const candidate=session.source.slice(0,time.from)+text+session.source.slice(time.to),score=compile(candidate,session.seed);
 if(score.diagnostics.length){session.message=`PLAY · ${score.diagnostics[0].message}`;return false;}
 view.dispatch({changes:{from:time.from,to:time.to,insert:text}});session.performancePulse=11;
 if(session.updateMode==='manual')void applyHotEdit();else if(session.updateMode==='write')void applyWritingEdit();return true;
}
export function performanceTimeStep(direction:number,fine=false){const time=performanceTime(session.source,session.performanceAnchor);return time?replacePerformanceTime(changePerformanceTime(time,direction,fine)):false;}
export function performanceTimeValue(value:number){const time=performanceTime(session.source,session.performanceAnchor);return time?replacePerformanceTime(timeText(time,value)):false;}
