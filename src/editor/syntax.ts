import {lyricRanges} from '../core/lyrics';
import {numberRoles} from '../core/number-roles';
import type {Range} from '@codemirror/state';
import {EditorView,Decoration,ViewPlugin,type DecorationSet} from '@codemirror/view';
  function colorize(view:EditorView) {
    const marks: Range<Decoration>[]=[];const source=view.state.doc.toString(),literals=lyricRanges(source),roles=numberRoles(source);
    for(const literal of literals)marks.push(Decoration.mark({class:'syno-atom'}).range(literal.from,literal.to));
    const regex=/#.*$|!stocky|!st|!title|!t|!speakers|!spk|!room|!r(?=\[)|!v[pclsft]|!s[cax]|![bf]|;(?:<[^>]*>|(?![bn]\d)[A-Za-z_][A-Za-z_0-9-]*)|!?spk(?:\d+(?:\.\d+){0,2}|[A-Z]{3})|\b[a-z_]{2,}(?==)|\*\d*|[A-Z]|[staqn](?=[\d*?\[])|[vpefrihdgxbqkow]|-?(?:\d+(?:\.\d*)?|\.\d+)|[?\[\]:;<>'*^=(),{}+/\-]/gm;
    for(const visible of view.visibleRanges) {
      const text=view.state.doc.sliceString(visible.from,visible.to);
      for(const m of text.matchAll(regex)) {
        const s=m[0],at=visible.from+m.index!;if(literals.some(r=>at>=r.from&&at<r.to))continue;const role=roles.find(r=>at>=r.from&&at<r.to);const cls=role&&role.kind!=='value'?role.kind:s[0]==='#'?'comment':s[0]==='!'||s.startsWith('spk')?'message':s[0]===';'?'name':/^[A-Z]$/.test(s)?'process':/^[staqn]$/.test(s)?'atom':/^[-.\d]/.test(s)?'number':/^[a-z_]{2,}$/.test(s)?'name':/^[vpefrihdgxbqkow]$/.test(s)?'modifier':'punctuation';
        marks.push(Decoration.mark({class:`syno-${cls}`}).range(visible.from+m.index!,visible.from+m.index!+s.length));
      }
    }
    return Decoration.set(marks,true);
  }
  export const scoreColors=ViewPlugin.fromClass(class {
    decorations:DecorationSet;
    constructor(view:EditorView){this.decorations=colorize(view);}
    update(update:{docChanged:boolean;viewportChanged:boolean;view:EditorView}){if(update.docChanged||update.viewportChanged)this.decorations=colorize(update.view);}
  },{decorations:p=>p.decorations});
