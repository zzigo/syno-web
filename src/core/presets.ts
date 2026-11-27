import {libraryStudies} from './library.generated';
export interface StudyPreset {name:string;detail:string;code:string;file?:string;category?:string;loop?:boolean;seed?:number}
export const presets:StudyPreset[] = [
 ...libraryStudies,
 {name:'Reverb range',category:'Effects',detail:'Dry / r1 / r4 / r9 · spaced impulses',code:`# REVERB RANGE\n# Turn LOOP off to hear the last tail decay.\ns440v4e0092'0.25r0\n2s440v4e0092'0.25r1\n5s440v4e0092'0.25r4\n10s440v4e0092'0.25r9`},
 {name:'Sound trajectories',category:'Visuals',detail:'X pan · Y frequency · Z intensity',code:`# SOUND TRAJECTORIES\n!vp\ns440>220'20v0>5>0'20.5p-1>1'20h5r3f8>2'20\ns220>440'20v0>3>0'20.5p1>-1'20h2r2f6>3'20\nq300>230'20v0>1>0'20.5p0>1'20h4f5>2'20\nt500>400'20v0>3>0'20.5p0>1'20h3r4f4>1'20\na600>700'20v0>4>0'20.5p-1>0'20h6f3>0.5'20\ns800>900'20v0>5>0'20.5p1>0'20r5f7>4'20\nq1000>800'20v0>3>0'20.5p0>-1'20h7f6>3'20\nt200>300'20v0>4>0'20.5p0>-1'20h1r1f5>2'20\na400>500'20v0>5>0'20.5p-1>1'20h8f4>1'20\ns600>700'20v0>3>0'20.5p1>-1'20h9r6f9>1'20`},
 {name:'Filter & chopper',category:'Effects',detail:'Cutoff sweep · stereo gate · reverb',code:`# FILTER & CHOPPER\n# f0..9: 40 Hz..18 kHz, logarithmic.\n# A final contour time covers both transitions.\nn1v0>1>0'10p-1>1'10f2>7'10e0\n1n3v0>1>0'10p1>-1'4h0.2r4e0`},
 {name:'Noise contour',detail:'Intensity · attack / hold / release',code:`# NOISE CONTOUR\n# 2 s rise, 1 s hold, 3 s fall; e0 bypasses ADSR.\nn1v0'2>1'1>0'3e0\n\n# Long form in seconds (35 minutes):\n# n1v0'1000>1'100>0'1000e0`},
 { name: 'Sound atoms', detail: 'syNo v1 / synthesis', code: `# SOUND ATOMS\n# Spaces are parallel actions; numeric prefixes are offsets.\n\ns110v3e0254'2\n0.5t165v2p-0.7e0254'1.5\n1s220>440'1v2p0.7\n\n# A finite loop repeats the group:\n(2s330v2e0153'0.2)4` },
 { name: 'FM bloom', detail: 'Frequency modulation / index sweep', code: `# FM BLOOM\n# i controls modulation index.\n\ns220:s55i0>6'4v3e1354\n0.4t165:t41.25i1>4'3v2p0.5` },
 { name: 'Functions & FM', detail: 'Open parameters / recursion', code: `# FUNCTIONS & FM\nfm=s*:s*i*v2e0254'1\n\nfm220,55,2\n(fm330,82.5,4)4\n\n# Each * opens one parameter. i = FM index.\n# Cmd+Alt+Enter plays the selected text or current line.` }
];
