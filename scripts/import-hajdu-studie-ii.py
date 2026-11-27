"""Translate the user-supplied Max example into compact executable syNo functions.
Reads score data, not Max DSP/UI code. No Max patch or image asset is redistributed.
Usage: python3 scripts/import-hajdu-studie-ii.py /path/to/stockhausen-studie-II.maxpat
"""
import hashlib,json,math,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1])
patch=json.loads(source.read_text())['patcher']
def subpatches(p):
 for item in p.get('boxes',[]):
  b=item['box']
  if 'patcher' in b:
   yield b;yield from subpatches(b['patcher'])
player=next(b['patcher'] for b in subpatches(patch) if b.get('text')=='p score-player')
rows=next(b['box']['coll_data']['data'] for b in player['boxes'] if 'coll_data'in b['box'])
assert len(rows)==380 and all(len(row['value'])==6 for row in rows)
fmt=lambda value:format(value,'.11g')
ms=lambda cm:math.floor(cm/76.2*1000+.5)
text=['# KARLHEINZ STOCKHAUSEN / STUDIE II (1954)', '# syNo realization of the 380-event score data in Georg Hajdu\'s Max example.', '# Source: Max 9 / Examples / synths / very-special-guest / stockhausen-studie-II.maxpat.', '# Real-time version: Georg Hajdu. Assistance: Les Stuck, Sven Bey, Thorsten Floth,', '# Catrin Groth, Ulrike Luttmann. Special thanks: Werner Funk.', '# Score copyright: 1954 Stockhausen Verlag. The supplied Max example states Used with permission.', '# That credit is retained; score data are NOT relicensed under syNo\'s 0BSD code license.', '# No Max UI, image assets, or Max DSP source are bundled.', '# See docs/hajdu-studie-ii.md for the translation and its sonic differences.', '# Exact row order, roots, mixture types, dB endpoints and rounded-ms timing are retained.', '# syNo uses e0090 edge fades, standard equal-power panning and convolution r4;', '# it does NOT contain yafr2, nor claim sample-identical sound to Max.', '# One common r4v3 output chain; the two After Studies remain separate pieces.', '# Loop OFF. Each line below is one mixture, independent from the next onset.', '# ma / mb / mc / md / me = mixture spacing 1 / 2 / 3 / 4 / 5.', '# Call arguments: root Hz, first linear intensity, last linear intensity, gate seconds.', '# * opens the next argument; *2 reuses argument 2; apostrophe * takes gate from an argument.', '!sc','!st','']
# General function parameters expose root and shared amplitude/time, rather than five event copies.
lattice=' '.join(fmt(1200*math.log2(5)*i/25) for i in range(21))
text+=['# One reusable relative lattice; each mixture supplies its own root.',f'u[{lattice}]:5/1','']
for mixture,name in enumerate(['ma','mb','mc','md','me'],1):
 text += [f'# MIXTURE {mixture} / f[j] = root * 5^(j*{mixture}/25), j=0..4.',f'{name}=(', ' o*']
 for j in range(5):
  controls="v*>*e0090'*" if j==0 else "v*2>*3e0090'*4"
  text.append(f' s[n{1+j*mixture}]{controls}p{fmt((mixture-3)/2)}')
 text+=[')','']
text+=['# SCORE / onset prefix is in seconds; gates can overlap the next event.','{']
onset_ms=0;end_ms=0;families={str(i):0 for i in range(1,6)};boundaries=[]
for row in rows:
 mixture,freq,a0,a1,cm_dur,cm_delta=row['value'];mixture=int(mixture);duration_ms=ms(cm_dur);delta_ms=ms(cm_delta)
 families[str(mixture)]+=1;end_ms=max(end_ms,onset_ms+duration_ms);boundaries.extend([(onset_ms,1),(onset_ms+duration_ms,-1)])
 args=[freq,9*10**(a0/20),9*10**(a1/20),duration_ms/1000]
 text.append(f" {fmt(onset_ms/1000)}{['ma','mb','mc','md','me'][mixture-1]}"+','.join(fmt(a) for a in args))
 onset_ms+=delta_ms
text+=['}r4v3','']
out=root/'library/pieces/Studie-II-Hajdu.syn';out.write_text('\n'.join(text))
active=peak=0
for _,delta in sorted(boundaries):active+=delta;peak=max(peak,active)
metadata={'source':'Max 9 / very-special-guest / stockhausen-studie-II.maxpat','realization':'Georg Hajdu','scoreCopyright':'1954 Stockhausen Verlag','sourcePatchSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'scoreDataSha256':hashlib.sha256(json.dumps(rows,separators=(',',':')).encode()).hexdigest(),'eventCount':len(rows),'sineComponents':len(rows)*5,'mixtureCounts':families,'lastOnsetSeconds':onset_ms/1000,'durationSeconds':end_ms/1000,'peakMixtures':peak,'peakSineComponents':peak*5,'outputSourceBytes':out.stat().st_size,'differences':['standard e0090 instead of Max line~ 21ms onset / noteoff edge behavior','standard StereoPanner mixture positions instead of Max MIDI panning implementation','shared synthetic convolution r4 instead of yafr2','uniform syNo output trim v3 and standard master limiter']}
(root/'docs/hajdu-studie-ii.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(metadata,indent=2))
