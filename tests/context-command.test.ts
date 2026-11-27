import test from 'node:test';import assert from 'node:assert/strict';
import{contextCommandAt}from'../src/core/context-command';import{compile}from'../src/core/parser';import{helpSections}from'../src/core/help-content';
function at(source:string,token:string,offset=0){return contextCommandAt(source,source.indexOf(token)+offset,compile(source));}
test('cursor routes adjacent command starts, values, incomplete drafts and comments correctly',()=>{
 const source="s220v3p-1>1e0254'n4r5";
 assert.equal(at(source,'s220')?.name,'Sine oscillator');assert.equal(at(source,'v3')?.name,'Intensity contour');assert.equal(at(source,'p-1',2)?.name,'Stereo panning');assert.equal(at(source,'>')?.name,'Linear interpolation');assert.equal(at(source,'e0254',3)?.name,'Attack–decay–sustain–release');assert.equal(at(source,"'n4",2)?.name,'Duration / musical figure');
 assert.equal(at('s220v','v')?.name,'Intensity contour');assert.equal(contextCommandAt('# s220v3',5),undefined);assert.equal(contextCommandAt('s220 # v3',9),undefined);assert.equal(contextCommandAt('s220\n\n',6),undefined);
});
test('growth, complete XYZ maps, tempo, tuning, inputs, FM and section punctuation have exact Help targets',()=>{
 const cases:[string,string,string][]=[['G588@gop s220','G588','Phyllotaxis growth'],['G588@gop s220','@gop','XYZ parameter routing'],['R123@rgi s220','@rgi','XYZ parameter routing'],['!b60 s220','!b60','Tempo · beats per minute'],['uBPJ s220','uBPJ','Tuning / intonation'],['i1h3','i1','Audio input channel'],['s220:s55i2',':','Frequency modulation'],['s220:s55i2','i2','FM modulation index'],["s220'1 ;10 t330",';10','Relative section / wait'],['!vc s220','!vc','Visual mode'],['L3 A>AB B>A','L3','Lindenmayer rewriting']];
 for(const[source,token,name]of cases){const command=at(source,token);assert.equal(command?.name,name,source);assert.ok(helpSections.some(s=>s.title===command?.section),command?.section);}
});
test('musical duration transitions retain one time target rather than exposing n as noise',()=>{const source="s[220 330]'n8>n16";assert.equal(at(source,'n16',1)?.name,'Duration / musical figure');});

test('group and named-expression Help discusses repetition rather than runtime scope',()=>{for(const [source,token]of [["(s220'1)4",')4'],["phrase=(s220'1) phrase",'phrase']])assert.equal(at(source,token)?.section,'Groups · finite repetition and names');});
