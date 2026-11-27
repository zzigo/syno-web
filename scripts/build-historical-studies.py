"""Original procedural miniatures; no upstream score or orchestra is copied.
I: independently composed additive spectra, individual amplitude/onset/lifetime.
II: 100 * 5**(index/25), five-tone families, short slices, delayed wet observation.
References and scope: docs/historical-studies.md.
"""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
fmt=lambda x:format(x,'.9g')

# Original material and temporal order for a 42-second additive miniature.
rows=[(0,1.7,[211,293,419],[1.9,1.2,.75]),(2.3,2.4,[137,349,521,733],[1.2,1.7,.8,.5]),(6,1.1,[463,619],[1.9,1.3]),(8,3.2,[173,277,443,709,1133],[1.5,1.1,.8,.6,.4]),(12.5,1.6,[317,503,797],[1.7,1.2,.7]),(15,2.7,[109,233,487,977],[1.5,1.2,.9,.6]),(19,3.3,[223,367,601,983,1609,2633],[1.6,1.2,.9,.7,.5,.3]),(23.5,.8,[569,887],[2,1]),(26,2.2,[149,383,991],[1.6,1.1,.7]),(30,3.6,[197,311,491,773,1217],[1.8,1.3,.9,.6,.4]),(35,1.7,[421,673,1069,1699],[1.5,1.1,.7,.4]),(38,4,[157,397,1003],[1.7,1.1,.6])]
text=['# AFTER STUDIE I / original procedural miniature / 42 seconds / Loop OFF.', '# Reference: Stockhausen, Studie I (1953), programme note published by IRCAM.', '# Individual sine frequencies, levels, attacks and lifetimes compose each spectrum.', '# This is a new event schedule, NOT a transcription or the original recording.', '# Source/provenance: docs/historical-studies.md in the development repository.', '# Every line is one independently shaped pure sine; no FM or borrowed score data.','']
for i,(at,dur,freqs,levels) in enumerate(rows):
 text.append(f'# SPECTRUM {i+1:02} / {len(freqs)} independent sine components.')
 for j,(freq,level) in enumerate(zip(freqs,levels)):
  offset=0 if i==11 else j*.017
  length=dur if i==11 else dur*(1-j*.055)
  attack=min(.12+.019*j,length*.2);release=min(.25+.021*j,length*.3);hold=length-attack-release
  text.append(f"{fmt(at+offset)}s{freq}v0'{fmt(attack)}>{fmt(level)}'{fmt(hold)}>0'{fmt(release)}e0p0")
 text.append('')
(root/'library/pieces/After-Studie-I.syn').write_text('\n'.join(text)+'\n')

# A new sequence of fifteen objects, on a mathematical lattice rather than a copied score.
text=['# AFTER STUDIE II / five-tone tape apparatus / original procedural miniature.', '# Reference: the instrument-construction research of Antonio de Sousa Dias.', '# https://github.com/asousadias/Stockhausen_ElektronischStudie2_1954', '# This is NOT his score excerpt and NOT a complete reconstruction of Studie II.', '# Frequencies derive independently from 100 * 5^(k/25); five mixture widths.', '# Five 55.5 ms sine slices excite a reverb; every dry slice ends at 277.5 ms.', '# Each output contour remains exactly ZERO through at least 350 ms.', '# Consequently only the chamber tail is heard. Reverb is the material, not decoration.', '# syNo r9 uses its existing synthetic 6.65 s stereo IR, not the historical 10 s chamber.', '# New onsets, envelopes and object order below are composed for this syNo miniature.', '# Loop OFF. Source/provenance: docs/historical-studies.md.','']
text+=['# Exact absolute-frequency table: one definition, one-based n positions.', 'u[f '+' '.join(fmt(100*5**(i/25)) for i in range(81))+']','']
for name,duration in [('short',1.4),('middle',2),('long',2.8)]:
 text.append(f'{name}=({{')
 for j in range(5):
  offset='' if j==0 else fmt(j*.0555)
  text.append(f" {offset}s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555")
 text.append(f"}}r9v0>0>*>*>0'{duration})")
 text.append('')
text+=['# Five families, two/three widths alternating; every cell has five sine slices.', '# Function arguments: five Hz-table positions, then two output-envelope levels.','']
# 5 families × 3 cells; 30 output processors fit the current engine budget.
widths=[1,3,5,2,4]
roots=[9,24,15,32,20,27,12,35,22,17,30,11,26,18,33]
for i,index in enumerate(roots):
 width=widths[i//3];freqs=[index+j*width+1 for j in range(5)];name=['short','long','middle'][i%3]
 levels=[(4.8,1.2),(1.1,4.5),(3.5,.8)][(i//3+i)%3]
 text.append(f"# OBJECT {i+1:02} / lattice step {index}, mixture spacing {width}.")
 text.append(name+','.join([fmt(freqs[0]),*[fmt(f) for f in freqs[1:]],*[fmt(v) for v in levels]]))
 if i<14:text.append(';'+(['0.35','0.8','0.15','0.55','0.25'][i%5]))
(root/'library/pieces/After-Studie-II.syn').write_text('\n'.join(text)+'\n')
