# Lyrics / initial implementation and next rhythm layer

Implemented: local Kokoro q8, `af_heart` English, same model/PCM approach used in the reader. A module worker keeps inference off the UI/audio thread. The first lyric Play downloads about 95 MB of model/voice data plus the WASM runtime; synthesis is local and written text is not sent to a provider. Model assets come from Hugging Face. PCM is cached in memory (24 texts); model downloads use the runtime's browser cache. Stop cancels pending preparation; no delayed autoplay. Preparation finishes before the transport starts.

`l[this is a verse]` uses a deterministic estimated gate: 0.4 s per whitespace word + 0.4 s, bounded to 1–60 s. `'4` sets the phrase gate explicitly. Rendered speech is fitted to that gate by resampling. Cadence proportions are retained, but raw speech pitch/formants change with the fit ratio; this is not formant-preserving time stretching.

`l[the trees are singing]:s[n1 3 5 8]'n4` routes the voice into a 16-band analysis/synthesis vocoder. The continuous carrier melody is independent of word boundaries. Default `!sc` says the text once over the full phrase. In `!sa` each note takes its consecutive fraction of the same phrase buffer, not a new rendition of the whole text. Rests discard their portion. No linguistic word/syllable alignment is claimed. `s` uses a harmonic sine bank; t/a/q use differently weighted harmonic banks. The colon in this context connects voice/modulator to musical carrier; ordinary oscillator `s:t` remains FM. v/p/f/h/d/r and parenthesized output effects use the existing audio graph, including master, recorder and panic.

New text needs explicit Play to prepare its PCM. Cached pitch/effect edits keep the existing U/Glide behavior. No mic, cloud credentials or new service are required. Google/Chirp is not integrated in this prototype. The compiler emits deterministic lyric event metadata; neural PCM is not covered by the score's event-hash reproducibility claim.

Precise manually written prosody is already possible with individual events and relative section separators:

```syno
!b100
l[this]:a220'n8 ;
l[is]:a247'n16 ;
l[the]:a262'n16 ;
l[first]:a330'n4
```

A newline alone keeps events parallel. Short gates can make spoken fragments hard to understand.

## Composer's accepted future direction — not executable yet

Whole phrase first; later explicit syllabification such as `sy-llabe` and duration lists:

- `'[n8]`: broadcast one figure across musical/articulation cells.
- `'[(n8)6]`: explicit sixfold repetition (equivalence depends on six target cells).
- `'[(n8)3 n4 (n8)2]`: compressed mixed rhythmic pattern.
- `'[1 1 ? 0.5 1 1]`: mixed literal seconds and random durations.
- `'?`: existing whole-event random gate; a future list must keep the established seeded random rules.

Need to decide list expansion, mismatch/broadcast, rest ownership, cell-to-syllable alignment, held syllables/melismas, and phonetic forced alignment. None of the new list/syllabification forms is implemented or included in executable presets. The composer chose a continuous phrase crossing the melody as the first implementation.

## Cinema captions and intelligibility

Implemented `l_[text]`: same PCM voice plus a yellow cinema cue tied to the actual event gate. Captions survive chop gaps but end at the gate and disappear on Stop; they render into canvas video/PNG too. No word-level alignment is inferred. `l[text]` keeps the voice without a cue.

Implemented lyric-vocoder `w`: 0 raw speech, 9 fully vocoded (default), with equal-power blend and dry-level matching. `w2>8` follows the complete phrase; `w2>8'4` fixes four seconds. Prepared w edits use the existing hot automation/Glide path. `w` is rejected on ordinary oscillators or an unvocoded lyric. FM still uses i.

Soft machines (Pieces) supplies an original speculative-fiction lyric song with twelve cached phrases, nine sections, 96 bars at 144 BPM (160 s), and different wet/dry trajectories on repeated hooks.

The composer reserves `*` for function arguments. Repetition uses parenthesized expressions with a count; no rhythmic multiplication with `*` is planned. The time-array forms above remain future work.
