# Studie II — Hajdu → syNo

This is a separate translation of the 380-row score table in the user's installed Max 9 example, `Examples/synths/very-special-guest/stockhausen-studie-II.maxpat`. The existing **After Studie I** and **After Studie II** remain original procedural miniatures.

Real-time realization: **Georg Hajdu**, assisted by Les Stuck, Sven Bey, Thorsten Floth, Catrin Groth and Ulrike Luttmann; special thanks to Werner Funk. The source example credits **1954 Stockhausen Verlag** and states “Used with permission.” That source statement is retained as provenance; it does not grant a new syNo license to the score data. Imported score-derived data are excluded from the new code's 0BSD license. No Max UI, images or DSP implementation is bundled.

## Translation

`scripts/import-hajdu-studie-ii.py` reads the local patch explicitly supplied to it. Its `p score-player` coll contains mixture type, root Hz, initial/final dB, gate length in centimeters, and distance to the next onset. Gates and each inter-onset distance convert separately using 76.2 cm/s and Max's nearest-millisecond rounding. The translated source retains every row in order, ending its last gate at **175.527 seconds** (last onset 174.434).

Each mixture has five pure sinusoids: `root * 5^(j*type/25)`, j=0…4. Five named functions ma–me express the five spacings, sharing one relative cents lattice with period 5/1. Their four arguments are root Hz, first intensity, last intensity and gate seconds. dB endpoints convert to `9 * 10^(dB/20)` for syNo's linear intensity. Numeric prefixes place each named call at its independent onset. Bare `*` opens the next argument; indexed `*2` etc reuse prior arguments, including `o*` and the apostrophe gate.

There are **1,900 sine events**, peaking at 35 simultaneous components; the highest component is about 17,249.756 Hz. The oscillator limit is 20 kHz. `docs/hajdu-studie-ii.json` records source/table hashes, counts, timing and differences. Regression tests compare all 380 rows and all 1,900 emitted components against the installed source when available; portable tests check the translated structure without that local dependency.

## Sonic differences

This is a score-data translation, not a sample-identical emulation of Max. It uses syNo e0090 edge fades in place of Max line~ onset/note-off behavior, equal-power StereoPanner positions by mixture type in place of the Max MIDI pan implementation, one shared synthetic convolution r4 instead of yafr2, and a uniform output v3 trim through the normal master limiter. Those choices affect attack, decay, spatial image and overall loudness. Effect tails can outlast the last gate.

## Absolute tables and the After Studies

After Studie II now defines its 81 exact frequencies once as `u[f ...]` and passes table positions to its mixture functions. `u[f ...]` preserves written order, ignores o, rejects missing positions and quantizes growth to the nearest listed frequency. Explicit octave register prefixes still transpose by octaves. The Hajdu translation uses a relative lattice instead, since each event changes its root. Stars remain function parameters; repetitions use `(expression)count`.
