import {embedOptions} from './core/shared-patch';
export const embedded=typeof location!=='undefined'&&embedOptions(location.href).enabled;
import {FILES_KEY,readEditorFiles,type EditorFile} from './core/editor-files';
import {scoreSections,sectionAtTime,sectionAtCursor,sectionScore} from './core/sections';
import {migrateRandomRanges} from './core/random-brackets';
import {contextCommandAt,type ContextCommand} from './core/context-command';
import {UPDATE_MODES,UPDATE_MODE_KEY,updateMode,automaticUpdate,type UpdateMode} from './core/update-mode';
import {DEFAULT_MODEL,DEFAULT_MODEL_KEY} from './integrations/default-model';
import {mutationRange} from './editor/mutation-range';
import {describeAt} from './core/context-description';
import { AudioEngine } from './audio/engine';
import { compile } from './core/parser';
import { musicalCanonical, setViewMessage, type VisualMode } from './core/visualization';
import { presets } from './core/presets';
import type { CompiledScore,NoteEvent } from './core/types';
function savedSource() { const fallback=()=> (presets.find(p=>p.file==='G-phyllotaxis.syn')??presets[0]).code;if(embedded)return fallback();try {let source=localStorage.getItem('syno.lab.source');if(source&&localStorage.getItem('syno.lab.grammar')!=='2'){source=migrateRandomRanges(source);localStorage.setItem('syno.lab.source',source);localStorage.setItem('syno.lab.grammar','2');}localStorage.setItem('syno.lab.grammar','2');return source||fallback();} catch { return fallback(); } }
let editorUpdateTimer:ReturnType<typeof setTimeout>|undefined;
function cancelEditorTimer(){clearTimeout(editorUpdateTimer);editorUpdateTimer=undefined;}
const initialFiles=embedded||typeof localStorage==='undefined'?[]:readEditorFiles(localStorage);
const initialFile=initialFiles.find(f=>{try{return f.id===localStorage.getItem('syno.lab.activeFile');}catch{return false;}});
const initialSource=initialFile?.source??savedSource();
export const session = $state({
  editorFiles:initialFiles as EditorFile[],activeDocumentId:initialFile?.id??'editor',fileName:initialFile?.name??'score.syn',playbackDocumentId:'editor',playbackFileName:'score.syn',playbackScore:undefined as CompiledScore|undefined,selectedSection:-1,pendingSection:undefined as string|undefined,
  contextCommand:undefined as ContextCommand|undefined,helpFocus:undefined as {section:string;request:number}|undefined,
  followTime:false,performanceMode:false,performanceAnchor:0,performancePulse:-1,
  updateMode:(()=>{try{return updateMode(localStorage.getItem(UPDATE_MODE_KEY));}catch{return 'manual' as UpdateMode;}})(),
  defaultModel:(()=>{try{return localStorage.getItem(DEFAULT_MODEL_KEY)||DEFAULT_MODEL;}catch{return DEFAULT_MODEL;}})(),
  aiModels:[] as import('./integrations/orf').InstalledModel[],aiSelectedModel:'',
  mutationLastRejection:'',
  aiModelReady:false,
  aiActivity:{working:false,phase:'idle',algorithm:'',elapsed:0,promptTokens:0,completionTokens:0,estimated:true} as import('./integrations/model-activity').ModelActivity,
  draggingPod:undefined as import('./core/types').PodId|undefined,mutationVisual:undefined as {id:number;from:number;to:number;revealed:number;removed:string;agent:boolean;settled:boolean}|undefined,agentResponses:[] as {model:string;kind:string;raw:string;reason:string;seconds:number}[],mutationMode:'accumulate' as 'directed'|'accumulate',mutationLayerLimit:12,mutationPaused:false,mutationEvery:4,mutationGeneration:0,mutationStatus:'Waiting for a mutable region',mutationHistory:[] as {before:string;after:string;description:string}[],wrapMode:0,audioHealth:{state:'idle',voices:0,tails:0,reverbs:0,late:0,dropped:0,peak:0,reduction:0,invalid:0,error:''},pendingHotEdit:false,captureCrop:undefined as import('./capture/composition').CropTransform|undefined,hotEditSeconds:(()=>{try{const saved=localStorage.getItem('syno.lab.hotEditSeconds');return saved===null?1:Math.max(0,Math.min(10,Number(saved)||0));}catch{return 1;}})(),subtitles:false,subtitle:'',captureGuide:false,captureModal:false,captureFormat:'portrait' as import('./capture/composition').CaptureFormat,captureCode:false,recording:false,
  envelopeOwner:'editor' as 'editor'|'agent',envelopeCursor:0,envelopeAgentSource:'',
  spatialOverlay:false,
  visualization: compile(initialSource).visualization,
  playbackOwner:'editor' as 'editor'|'agent',
  source: initialSource, seed: initialFile?.seed??3181, playing: false, time: 0, totalTime: 0, level: 0,
  dirty: false, hash: '', message: 'Ready to play', activeIds: [] as number[], visualEvents:[] as NoteEvent[],
  score: compile(initialSource), applied: undefined as CompiledScore | undefined,
  title: initialFile?.title??'Untitled score', loop: initialFile?.loop??true, master: .6, codeRevision: 0, focusMode: false, infoHidden:false
});
export const engine = new AudioEngine();
engine.onVoiceStatus=message=>session.message=message;
export function updateSource(source: string) {
  cancelEditorTimer();
  const previous=session.score,next=compile(source,session.seed,0,0,true);
  const visualOnly=!previous.diagnostics.length&&!next.diagnostics.length&&previous.seed===next.seed&&musicalCanonical(previous.canonical)===musicalCanonical(next.canonical);
  const sameAsApplied=session.playbackOwner==='editor'&&session.applied&&!next.diagnostics.length&&session.applied.seed===next.seed&&musicalCanonical(session.applied.canonical)===musicalCanonical(next.canonical);
  const wasDirty=session.dirty;
  session.source=source;session.score=next;if(!next.diagnostics.length&&session.selectedSection>=scoreSections(next).length)session.selectedSection=-1;const file=session.editorFiles.find(f=>f.id===session.activeDocumentId);if(file){file.source=source;file.title=session.title;file.name=session.fileName;file.seed=session.seed;file.loop=session.loop;persistEditorFiles();}
  if(session.playbackOwner==='editor'){engine.cancelQueuedUpdate();session.pendingHotEdit=engine.pendingUpdate;}
  if(!next.diagnostics.length||next.viewMessages.length)session.visualization=next.visualization;
  session.dirty=sameAsApplied?false:visualOnly?wasDirty:true;
  // Update source ranges without restarting a running, otherwise unchanged score.
  if(session.playbackOwner==='editor'&&(visualOnly&&!wasDirty||sameAsApplied)&&session.applied){session.playbackScore=next;if(engine.running)engine.refreshSourceRanges(next);session.applied=engine.running?(engine.currentScore??next):next;}
  try{if(!embedded){localStorage.setItem('syno.lab.source',source);localStorage.setItem('syno.lab.grammar','2');}}catch{ /* Storage can be disabled. */ }
}
export function chooseVisualization(mode:VisualMode){
  const source=setViewMessage(session.source,mode,session.score.viewMessages);
  session.visualization=mode;updateSource(source);session.codeRevision++;
}
export function replaceSource(source: string, title='Untitled score',name?:string) {
  session.mutationVisual=undefined;session.mutationLastRejection='';session.title=title;session.fileName=name??(title==='Untitled score'?'score.syn':title.endsWith('.syn')?title:title+'.syn');session.selectedSection=-1;updateSource(source);session.codeRevision++;
}
export function stop() { cancelEditorTimer(); if(typeof window!=='undefined')window.dispatchEvent(new Event('syno:stop-agents'));session.mutationVisual=undefined;session.pendingHotEdit=false;session.pendingSection=undefined;engine.stop();session.playing=false;session.time=0;session.totalTime=0;session.level=0;session.activeIds=[];session.visualEvents=[];session.message='Stopped'; }
export async function play(source?: string, offset=0, scope:'line'|'selection'='selection', owner:'editor'|'agent'='editor') {
  cancelEditorTimer();
  const full=compile(source ?? session.source,session.seed);let result=full;
  if(!source&&session.selectedSection>=0&&!full.diagnostics.length){try{result=sectionScore(full,session.selectedSection);}catch(error){session.message=String(error);return false;}}
  if(result.diagnostics.length) {session.message=result.diagnostics[0].message;return false;}
  if(offset) result.events=result.events.map(e=>({...e,from:e.from+offset,to:e.to+offset,traces:e.traces.map(r=>({from:r.from+offset,to:r.to+offset}))}));
  try {
    engine.loop=session.loop; const started=await engine.start(result);if(!started)return false;session.applied=result;session.playbackScore=full;session.playbackFileName=session.fileName;session.playbackDocumentId=session.activeDocumentId;session.pendingSection=undefined;session.pendingHotEdit=false;session.playing=true;session.playbackOwner=owner;
    session.dirty=false;session.message=source?(scope==='line'?'Playing line':'Playing selection'):'Playing';return true;
  }catch(error){session.message=error instanceof Error?error.message:String(error);return false;}
}

export async function applyHotEdit(){
 const next=session.score;if(next.diagnostics.length)return;
 session.visualization=next.visualization;
 if(engine.running){engine.hotEditSeconds=session.hotEditSeconds;const applied=await engine.hotUpdate(next);session.playbackOwner='editor';if(applied){session.pendingHotEdit=false;session.applied=engine.currentScore??next;session.playbackScore=next;session.dirty=false;session.message=`Hot edit · ${session.hotEditSeconds}s glide`;}else if(engine.queuedScore){session.pendingHotEdit=true;session.dirty=true;session.message=next.events.some(e=>e.inputChannel)&&!engine.inputReady?'Press Play to enable microphone input':session.loop?'Edit queued · next loop':'Edit queued · next Play (Loop is off)';}}
}

export function togglePerformance(){session.performanceMode=!session.performanceMode;session.message=session.performanceMode?"PLAY · Q/A … [/' control values from the cursor":'EDIT · text keyboard restored';if(typeof window!=='undefined')window.dispatchEvent(new Event('syno:performance-toggle'));}
export function setUpdateMode(mode:UpdateMode){
 cancelEditorTimer();session.updateMode=mode;engine.cancelQueuedUpdate();session.pendingHotEdit=engine.pendingUpdate;
 try{localStorage.setItem(UPDATE_MODE_KEY,mode);}catch{}
 requestEditorUpdate();
}
export function cycleUpdateMode(){setUpdateMode(UPDATE_MODES[(UPDATE_MODES.indexOf(session.updateMode)+1)%UPDATE_MODES.length]);}
/** Only actual editor changes call this; library loads and AI writes keep their explicit apply paths. */
export function requestEditorUpdate(){
 cancelEditorTimer();
 const mode=automaticUpdate(session.updateMode,engine.running,session.playbackOwner,!session.score.diagnostics.length,session.dirty);
 if(!mode)return;
 const next=session.score;
 if(mode==='loop'){
  if(engine.queueUpdate(next)){session.pendingHotEdit=true;session.message=session.loop?'Update queued · next loop':'Update queued · next Play (Loop is off)';}else if(engine.lastError)session.message=engine.lastError;return;
 }
 editorUpdateTimer=setTimeout(()=>{editorUpdateTimer=undefined;if(session.score!==next||!engine.running||session.updateMode!=='write'||session.playbackOwner!=='editor')return;
  void applyWritingEdit(next);
 },300);
}

export async function applyWritingEdit(next=session.score){
 cancelEditorTimer();if(!engine.running||next.diagnostics.length||session.score!==next)return;
 engine.hotEditSeconds=session.hotEditSeconds;
 try{const applied=await engine.writeUpdate(next);if(session.score!==next)return;if(applied){session.applied=engine.currentScore??next;session.playbackScore=next;session.dirty=false;session.pendingHotEdit=false;session.message='On writing · valid edit applied';}else{session.pendingHotEdit=engine.pendingUpdate;session.message=engine.lastError||'Press Play to enable microphone input';}}catch(error){session.message=error instanceof Error?error.message:String(error);}
}

export function updateContext(source:string,cursor:number,owner:'editor'|'agent'='editor'){session.envelopeOwner=owner;session.envelopeCursor=cursor;if(owner==='agent')session.envelopeAgentSource=source;const score=owner==='editor'?session.score:compile(source,session.seed);session.subtitle=describeAt(source,cursor,score);session.contextCommand=contextCommandAt(source,cursor,score);}

let mutationVisualId=0;
export async function commitMutation(candidate:string,description:string){
 const checked=compile(candidate,session.seed);if(checked.diagnostics.length||candidate===session.source)return false;
 const before=session.source,range=mutationRange(before,candidate),id=++mutationVisualId;
 session.mutationHistory=[...session.mutationHistory.slice(-15),{before,after:candidate,description}];
 session.mutationVisual={id,from:range.from,to:range.to,revealed:range.from,removed:range.removed,agent:description.startsWith('AI '),settled:false};
 updateSource(candidate);session.codeRevision++;session.mutationGeneration++;session.mutationStatus=description;
 // The audio and compiler only ever receive the complete validated edit.
 await applyHotEdit();
 const characters=Array.from(range.inserted),chunk=Math.max(1,Math.ceil(characters.length/60)),count=Math.ceil(characters.length/chunk),step=Math.max(24,Math.min(90,1400/Math.max(1,count)));
 for(let cursor=0;cursor<characters.length;cursor+=chunk){
  await new Promise(resolve=>setTimeout(resolve,step));
  if(session.mutationVisual?.id!==id)return true;
  if(session.mutationPaused){session.mutationVisual=undefined;return true;}
  session.mutationVisual.revealed+=characters.slice(cursor,cursor+chunk).join('').length;
 }
 if(session.mutationVisual?.id===id){session.mutationVisual.settled=true;await new Promise(resolve=>setTimeout(resolve,900));if(session.mutationVisual?.id===id)session.mutationVisual=undefined;}
 return true;
}
export function undoMutation(){const edit=session.mutationHistory.at(-1);if(!edit)return;session.mutationPaused=true;if(session.source!==edit.after){session.mutationStatus='Source changed since mutation; undo in the editor to preserve intervening edits.';return;}session.mutationHistory=session.mutationHistory.slice(0,-1);replaceSource(edit.before,session.title);session.mutationStatus='Mutation reverted · paused';void applyHotEdit();}

export function chooseAgentModel(id:string){if(!session.aiModels.some(m=>m.id===id))return;session.aiSelectedModel=id;session.defaultModel=id;try{localStorage.setItem(DEFAULT_MODEL_KEY,id);}catch{};}

function persistEditorFiles(){if(embedded)return;try{localStorage.setItem(FILES_KEY,JSON.stringify(session.editorFiles));localStorage.setItem('syno.lab.activeFile',session.activeDocumentId);localStorage.setItem('syno.lab.source',session.source);localStorage.setItem('syno.lab.grammar','2');}catch{}}
export function ensureEditorFile(){if(!session.editorFiles.some(f=>f.id==='editor'))session.editorFiles.unshift({id:'editor',name:session.fileName,title:session.title,source:session.source,seed:session.seed,loop:session.loop});}
export function activateEditorFile(id:string){
 ensureEditorFile();const file=session.editorFiles.find(f=>f.id===id);if(!file||session.activeDocumentId===id)return;
 const old=session.editorFiles.find(f=>f.id===session.activeDocumentId);if(old){old.source=session.source;old.title=session.title;old.name=session.fileName;old.seed=session.seed;old.loop=session.loop;}
 cancelEditorTimer();session.activeDocumentId=id;session.title=file.title;session.fileName=file.name;session.source=file.source;session.seed=file.seed??3181;session.loop=file.loop??true;if(!engine.running)engine.loop=session.loop;session.score=compile(file.source,session.seed,0,0,true);if(!session.score.diagnostics.length)session.visualization=session.score.visualization;session.selectedSection=-1;session.mutationVisual=undefined;session.dirty=session.applied?.canonical!==session.score.canonical||session.playbackDocumentId!==id;session.codeRevision++;persistEditorFiles();
}
export function addEditorFile(source:string,title:string,name:string,key?:string,seed?:number,loop?:boolean){
 ensureEditorFile();const existing=key&&session.editorFiles.find(f=>f.key===key);if(existing){activateEditorFile(existing.id);return existing.id;}
 const n=Math.max(0,...session.editorFiles.map(f=>Number(f.id.replace('file-',''))||0))+1,id='file-'+n;
 session.editorFiles.push({id,source,title,name,key,seed:seed??session.seed,loop:loop??session.loop});activateEditorFile(id);persistEditorFiles();return id;
}
export function closeEditorFile(id:string){if(id==='editor')return;if(session.activeDocumentId===id)activateEditorFile('editor');persistEditorFiles();}
export function navigateSection(direction:number,target?:number){
 const full=session.playing?(session.playbackScore??session.score):session.score,sections=scoreSections(full);if(!sections.length){session.message='Name sections with ;intro ;chorus or ;<section name>';return;}
 const current=session.playing?(engine.queuedScore?.playbackRange?.index??sectionAtTime(full,session.time+(engine.currentScore?.playbackRange?.from??0))):session.selectedSection>=0?session.selectedSection:sectionAtCursor(full,session.envelopeCursor);
 const index=target??Math.max(0,Math.min(sections.length-1,current+direction));
 if(index>=sections.length)return;session.selectedSection=index;
 if(session.playing){try{const score=sectionScore(full,index);if(!score.events.length){session.message='This section has no sounding events.';return;}if(engine.queueUpdate(score)){session.pendingSection=index<0?'whole piece':sections[index].name;session.message=`Section queued · ${session.pendingSection} · ${engine.loop?'next loop':'next Play (Loop off)'}`;}}catch(error){session.message=String(error);}}
 else {const section=sections[index];session.envelopeCursor=section?.from??0;window.dispatchEvent(new CustomEvent('syno:section-cursor',{detail:{from:section?.from??0}}));session.message=index<0?'Whole piece selected':`Section · ${section.name}`;}
}

export function toggleFollowTime(){session.followTime=!session.followTime;window.dispatchEvent(new Event('syno:follow-time'));session.message=session.followTime?'Follow current time · on':'Follow current time · off';}
