// SPDX-License-Identifier: 0BSD
import type {Speaker,Room} from './spatial';
export interface SpeakerPreset {key:string;name:string;family:'mono'|'stereo'|'ring'|'surround'|'height';speakers:Speaker[];channelMask:number}
const position=(role:string,azimuth:number,elevation=0,lfe=false)=>{const a=azimuth*Math.PI/180,e=elevation*Math.PI/180;return {id:0,role,x:lfe?0:Math.sin(a)*Math.cos(e),y:lfe?0:Math.sin(e),z:lfe?0:-Math.cos(a)*Math.cos(e),...(lfe?{lfe:true}:{})};};
const FL=()=>position('FL',-30),FR=()=>position('FR',30),FC=()=>position('FC',0),LFE=()=>position('LFE',0,0,true),BL=()=>position('BL',-150),BR=()=>position('BR',150),SL=()=>position('SL',-90),SR=()=>position('SR',90);
const front=()=>[FL(),FR(),FC()];
const five=()=>[...front(),position('SL',-110),position('SR',110)];
const seven=()=>[...front(),BL(),BR(),SL(),SR()];
const bass=(s:Speaker[])=>[...s.slice(0,3),LFE(),...s.slice(3)];
const topFour=()=>[position('TFL',-45,45),position('TFR',45,45),position('TBL',-135,45),position('TBR',135,45)];
const topTwo=()=>[position('TML',-90,80),position('TMR',90,80)];
const preset=(key:string,name:string,family:SpeakerPreset['family'],speakers:Speaker[],channelMask=0):SpeakerPreset=>({key,name,family,speakers:speakers.map((s,i)=>({...s,id:i+1})),channelMask});
const ring=(n:number)=>Array.from({length:n},(_,i)=>position(`O${i+1}`,-180/n+i*360/n));
export const SPEAKER_PRESETS:SpeakerPreset[]=[
 preset('1','Mono','mono',[FC()],4),
 preset('2','Stereo','stereo',[FL(),FR()],3),
 preset('2.1','Stereo + LFE','surround',[FL(),FR(),LFE()],11),
 preset('3.0','LCR','surround',front(),7),
 preset('3.1','LCR + LFE','surround',bass(front()),15),
 preset('4','Quad ring','ring',ring(4)),
 preset('4.0','Quad · WAVE order','surround',[position('FL',-45),position('FR',45),position('BL',-135),position('BR',135)],51),
 preset('5.0','5.0 surround','surround',five(),0x607),
 preset('5.1','5.1 surround','surround',bass(five()),0x60f),
 preset('6.1','6.1 surround','surround',[...front(),LFE(),position('BC',180),SL(),SR()],0x70f),
 preset('7.1','7.1 surround','surround',bass(seven()),0x63f),
 preset('8','Octophonic ring','ring',ring(8)),
 preset('12','Twelve-speaker ring','ring',ring(12)),
 // TML/TMR and wide channels have no exact WAVEFORMATEXTENSIBLE mask positions: keep discrete order + JSON roles.
 preset('5.1.2','5.1.2 overhead','height',[...bass(five()),...topTwo()]),
 preset('5.1.4','5.1.4 overhead','height',[...bass(five()),...topFour()],0x2d60f),
 preset('7.1.2','7.1.2 overhead','height',[...bass(seven()),...topTwo()]),
 preset('7.1.4','7.1.4 overhead','height',[...bass(seven()),...topFour()],0x2d63f),
 preset('9.1.6','9.1.6 overhead','height',[...bass(seven()),position('FWL',-60),position('FWR',60),...topFour(),...topTwo()])
];
export const SPEAKER_ALIASES:Record<string,string>={MON:'1',STE:'2',LCR:'3.0',QUA:'4',OCT:'8',DOD:'12',SUR:'5.1'};
export function speakerPreset(key:string,room?:Room){
 key=SPEAKER_ALIASES[key]??({'1.0':'1','2.0':'2','8.0':'8','12.0':'12'} as Record<string,string>)[key]??key;
 const p=SPEAKER_PRESETS.find(p=>p.key===key);if(!p)throw Error('Unknown speaker preset. Use spk2/4/8/12, spk5.1, spk7.1.4 or a documented name such as spkOCT.');
 const radius=room?Math.min(room[0],room[2],...(p.family==='height'?[room[1]]:[]))/2:1;
 return {...p,speakers:p.speakers.map(s=>({...s,x:s.x*radius,y:s.y*radius,z:s.z*radius}))};
}
