# AGENTS.md — SyNo + HYLON web project (plan only, no code yet)

Status: functional personal laboratory started 2026-11-22. Owner: Luciano.

Current group processing override: `(…)v/r/h/d` creates shared ordered output processors, including inline v gains; nesting is composition, not recursive feedback. `{…}g…` remains the feedback topology. Group postfix f/p/FM/named processor application are not implemented.

Current agent override: `&` plus Play starts agents automatically. No enable switch; closing Agents only hides its UI and must never abort a job. Pause/Stop explicitly cancel generation. Accumulate is the default: the model writes real appended layers while original events/IDs/effects/loop remain immutable. Directed edits is optional.

Current growth scope override: `G234 (…)` scopes static growth to its body. `G234& (…)`, `A& (…)` and other prefixes mark agentic editable bodies. `L& (…)` evolves L-system production rules, including branches; existing suffix spellings remain readable. Bottom AI displays latest request input/output token counts, with ≈ for estimates. The background glow is drawn into the growth canvas at the same projected origin as the geometry, and follows FOLD centre/pan; geometry shading stays unchanged. Initial model selection prefers Llama; Agents can save the syNo default in browser storage.

Current keyboard override: **Ctrl+Z** cycles free/100 → 70 → 30 wrap; bottom W shows state. Glide is in the bottom bar. **Cmd/Ctrl+P** opens the palette; `?` is musical source (seeded timbre choices). Alt arrows adjust the caret digit; Cmd/Ctrl+. and Escape are global panic.

Current user overrides: brand is **syNo**, expanded as **synthetic Notation**. The user subsequently requested the functional instrument, including generic AGENTS, at the paper address https://notation-review-27.pages.dev/. The earlier personal laboratory remains separate. Public assets and protocol responses must not expose the identity or domain of the existing inference service. ORF integration deliberately reuses the existing VPS gateway/SDK, never installs a new AI/agent backend. The author requested a small, spaced, regular-weight wordmark/caption and a square icon-only play button.

New laboratory code licence: **0BSD**. Upstream HYLON generators and ORF SDK retain their own provenance/terms (THIRD_PARTY_NOTICES.md). The old SyNo plugin is left untouched.

## 1. Purpose

A public web project that is the main evidence for the TENOR 2027 paper "SyNo: a 1-character synthetic notation for bio-inspired music structures". It must let a visitor write a SyNo score, hear it, see it grow (FOLD), browse the corpus, and verify that one score with one seed yields the same event stream on two backends.

Naming:
- SyNo: the language (one character per operation).
- HYLON: the environment (editor, runtime, views). Future "Ableton + TouchDesigner + infinito".
- Apomixis: the work (organ cycle). It is one case, not the project.

## 2. Hard constraints

1. Double-blind review: the review build is anonymous. No author name, festival or hall names, zztt.org links, or repo URL zzigo/syno in the page, the metadata, the commit history of the review mirror or the bundle. Provide an anonymised mirror and keep the identified site for after acceptance.
2. Determinism: same score and seed give the same event stream on every backend. No Math.random, no Date.now in the compiler or generators. One seeded PRNG.
3. Scores are data, not code. The compiler rejects unknown operators, validates before applying, and computes a canonical SHA-256.
4. Mobile first (the author works on a phone). Every view usable at 380 px.
5. No server needed for the core. Static hosting. Everything runs in the browser.
6. Licence: decide MIT or 0BSD for the SyNo repo (currently inconsistent). Record the decision here.

## 3. Reuse (read first, do not rewrite)

- master-spec/AGENTS.md: existing requirements of the organ system.
- master-spec/packages: fold, hylon-algos, hylon-runtime, hylon-audio, hylon-midi, hylon-registers, spore, hylon-visuals. Candidates to extract into the web core.
- master-spec/docs/FOLD.md: the growth cube specification.
- master-spec/packages/fold (read 2026-11-21, 406 lines): space.js (cube, Voronoi realisation from measured chains), generators.js (six pure generators: apomixis, phyllotaxis, stolon, apical, tropism, colonisation; mulberry32 seeded rng; DEFAULTS), engine.js, mapping.js (axis mapping x=bright, y=pitch, z=odd), la-synth.js, la-taxonomy.js, data/ (klais-stops, klais-timbre, ref-aria, ref-toccata). Already deterministic and DOM-free: good base for syno-gen and syno-fold.
- master-spec/scores: 18 corpus scores (the only place for score texts).
- github zzigo/syno: Obsidian plugin, TypeScript + Web Audio / AudioWorklet; atoms s t a q, sweep >, duration ', p, e, r, f.
- Mockups: 27-tenor-hylon/figs/fig-syno-editor-fold.svg and fig-syno-corpus-score.svg (visual target).

## 4. Architecture (proposed)

packages, monorepo:
1. syno-core: lexer, parser, validator, canonical form, SHA-256, seeded PRNG. No DOM, no audio.
2. syno-gen: generators as pure functions score+seed to event stream (mass, inhibition, golden, bands, L-system, cellular rule, fertility).
3. syno-backends: web (AudioWorklet), midi-export (SMF or JSON events), later laser.
4. syno-fold: FOLD cube view (WebGL or Canvas 2D).
5. syno-ui: views EDIT, FOLD, SCORE, CORPUS, TEST.
6. corpus: the 18 scores plus metadata (genealogy, operator tags).

Event stream: one JSON line per event {t, dur, voice, pitch, vel, src}. The portability test compares sorted streams by hash.

## 5. Grammar (decided on 2026-11-21 unless marked open)

Seven premises (see paper draft v0.3, section 3):
P1 defaults with chain explicit > local > operator > global. P2 one character per value or operation; spaces separate units; temporal header displaces start. P3 modulators `<` `>` interpolate, `:` FM, `'` time. P4 parentheses are loops (indefinite, or finite with a digit). P5 variables and functions unified: `=` assigns, `*` opens a parameter, `,` separates arguments; 1 char = primitive, 2+ chars = identifier. P6 lowercase = sound atoms, UPPERCASE = process operators (confirmed). P7 biological mechanisms are uppercase one-char operators.

Biological operator table (proposal, open): F fertility, M mass, E exclusion, I inhibition, G golden divergence, B band, L L-system, C cellular rule, A apomixis, U mutation, P polyembryony, T tuber, D dispersion, S stolon, H apical dominance, R tropism, K colonisation.

Open points:
1. Greek is dropped from source (no phone keyboard); optional display layer only.
2. The original SYNO dialog wrote generators in uppercase (`S440:S100`); the repo uses lowercase. Migration rule: lowercase.
3. `f` stays filter; fertility is `F`.
4. Converter from the corpus dialect (`fertility $SO 178 262`) to one-char form (`F$so178>262`), verified by event-stream hash.
5. Nested parentheses: one recurrence scale or hierarchical? Decide with a test case.
6. Density operational definition: non-comment characters per generated event, reported with the legibility caveat.

## 6. Views (from the mockups)

- EDIT: text editor with three-colour registers, live validation, hash.
- FOLD: growth cube. Y pitch, X brightness log2(centroid/f0), Z odd/even balance. Nodes animate with the score time cursor.
- SCORE: sections ribbon, fertility bars, curves (harmonicity, ambitus, elongation), note-intent strip.
- CORPUS: list of 18 scores, genealogy links, operator inventory tagged name / narration / parameter / mechanism.
- TEST: run the same score on two backends and show the equal/unequal hash and a diff of the first divergence.

## 6b. Second case: bass clarinet pod (multiphonics)

A pod that draws multiphonics as growth structures in the FOLD logic (node = multiphonic, partials placed in the cube; operators of section 5 grow chains). Performed with Chiara Percivati (bass clarinet). Data: a multiphonic data set to be confirmed (no Heather Roche data set found; candidates found: a 604-dyad clarinet multiphonic catalogue, ASU 2018). Session plan: 15 min talk, 5 min questions, 5 min performance (check against the call formats). Not on the critical path of the portability test.

## 7. Milestones (this week, adjust to the paper deadline)

M0 (day 1): grammar decisions (section 5), repo skeleton, anonymous hosting decided.
M1 (day 2): syno-core + converter + hash test on three corpus scores.
M2 (day 3): syno-gen for PHYLLOTAXIS mass; web backend plays it.
M3 (day 4): midi-export backend; portability test passes or fails and is reported.
M4 (day 5): views SCORE and CORPUS from real data; FOLD from extracted package.
M5 (day 6): replace paper mockups with real screenshots; freeze anonymous build.
M6 (day 7): paper final; deadline buffer.

Cut order if time runs out: laser, FOLD interactions, CORPUS genealogy, then the second case. Never cut the portability test.

## 8. Acceptance criteria

- Same score+seed gives the same SHA-256 on web and midi-export (or the divergence is documented).
- Review build contains no identifying strings (grep check in CI).
- 18 corpus scores parse; conversion to SyNo preserves hashes for those claimed in the paper.
- Loads under 3 s on a phone over 4G; works offline after first load.

## 9. Anonymity strategy

- Do not cite the EvoMusArt submission by title: "Anonymous (2027), paper in preparation".
- SyNo repo: do not link zzigo/syno in the review version. Create an anonymised mirror (fresh repository with a single squashed commit under a neutral account, or an anonymising mirror service such as anonymous.4open.science) and cite it as the "SyNo prototype (anonymous)". Check the call's own anonymisation instructions before choosing.
- Strip author names, festival and hall names, domains, and EXIF from images and PDFs. Add a grep check to the build.
- After acceptance, swap in the identified repository and site.

## 10. Open questions for Luciano

1. Folder name and location in ~/projects (currently 26-syno-web).
2. Shared code between SYNO (Obsidian) and the web core, or a fork? Recommendation: the web core is a new repository that imports the syntax and tests of SYNO; the anonymous mirror is made from it.
3. Source of the multiphonic data set.
4. Which TENOR formats are open this year (demo, poster, 10-minute artistic presentation)?

Current AGENTS override (2026-11-25): remove the output token-budget control and all client wall-clock generation cutoffs. Send maxTokens:-1 through the existing local gateway (Ollama num_predict:-1); stop generation on a complete structured response, EOS, explicit Stop/Pause, or a transport failure. Rejected additions pause rather than silently restart. Preserve every received raw attempt and its rejection/outcome in session history. Header has square icon controls and token measurement, settings are grouped, explanations are small info tooltips, recent mutations is an always-visible list of individually folded entries, Proposed Score follows, and Raw Response is always open at the bottom with 4→10 lines plus scrolling. Accretion volumes are parent-relative, not capped at v0.5; reject inaudibly brief/quiet additions. A& prompt explicitly describes apomictic lineage and the scoped N/U/D values. Cmd/Ctrl+/ toggles # comments in both editors (including keyboard-layout fallback).

Current generator-routing override (2026-11-25): default growth is @pov, with real X pan / Y frequency / Z intensity modulation. Keep the configured axis label when a manual/unsupported/overridden route is held, and annotate that reason rather than replacing it with UNMAPPED. g is an XYZ target only: a continuous 0–9 bank of four pure tonal atoms then all sixteen FM pairs. It blends 64-partial coefficients into native carrier/modulator PeriodicWaves; written FM Hz/index are retained, otherwise carrier/4 and i1 apply. Feedback g keeps its return-gain meaning. Noise/input do not enter this tonal bank. Generator-coordinate edits on running voices queue to the next loop to avoid discontinuous wavetable replacement. Help and Library contain the bank table/example.

Current small-model protocol override (2026-11-25): SmolLM growth uses a concise executable-notation prompt, with the growth character expressed as an editing task rather than a song brief. Other free-accretion models retain the fuller contract. In accumulate mode, an incompatible first JSON key (e.g. content/name/genre instead of append or daughter) terminates generation immediately, archives the received text, pauses mutations and supplies a precise correction on Resume. No automatic model switch or substitute musical layer.

Current section timing override (2026-11-25): ; advances the current emit scope's section origin to its latest event/group/circuit/bus end. An adjacent ;10 adds seconds; ;n4 / ;b2 use the current tempo. Later onset prefixes are relative to that origin. Nested groups, named calls and finite repeats keep local cursors. Trailing waits contribute to score/group duration. Effect tails overlap boundaries. The separator does not reset musical controls; use scoped growth prefixes to contain growth. Sections.syn is a Loop-off Synthesis example, with searchable Help documentation.


Current editor-performance override (2026-11-25): footer U cycles persistent Manual / Next loop / On writing. Typing and Alt-arrows obey that mode; default Manual leaves drafts for Cmd/Ctrl+Enter. Invalid text preserves current audio and cancels a not-yet-committed draft. Ordinary write updates debounce 300ms. Compatible values use Glide; structural write edits fade graph roots for50ms into a fresh phrase without resetting global transport time. Existing 120ms scheduler lookahead remains the commit window. Never auto-request a new mic. AI commits remain explicit.

Cmd/Ctrl+E or footer E toggles PLAY, locking text input and anchoring eleven numeric controls at the current caret. Physical pairs Q/A W/S E/D R/F T/G Y/H U/J I/K O/L P/Semicolon BracketLeft/Quote increment/decrement source-order values. Packed growth and ADSR digits split individually. Continuous Shift steps are one decimal finer. Only compiling edits enter the document. PLAY gestures explicitly hot-edit in Manual U, quantize in Loop U, and apply immediately in Write U. Custom vertical faders (48px wide minimum) form a compact desktop strip or full-width mobile bottom sheet; horizontal label scrolling reaches overflow. The generator, score source and control indices remain the same across keyboard and touch. See PLAY-values.syn and Help.

Accepted future syntax (composer, 2026-11-25): `(…)*` means indefinite repetition on an independent group clock. Bare `(…)` remains one execution; `(…)N` remains finite repetition. This is documented only, NOT implemented. Do not silently reinterpret existing groups or claim scalar musical durations already create autonomous clocks. See docs/independent-loops.md for the executable workaround, accepted notation and unresolved global Loop / ; / U-boundary / nested-loop / effect-ownership semantics. Do not add proposed syntax to executable Library presets or model prompts before implementation.

Future rest proposal (composer, 2026-11-25): group postfix `~?1` means 10% probability of silence; `~?9` 90%; bare `~?` defaults to `~?5` (50%). Preserve the execution's duration and make one seeded decision per group execution, independently of timbre/pitch RNG. Postfix bare `~` as certain silence is a recommendation awaiting confirmation. Group/atom suffix ordering and scheduler representation remain design work. See docs/independent-loops.md; none of these new postfixes are implemented or executable presets.


Current cursor Help/time override (2026-11-25): the footer names the current lexical command from either editor, including invalid/incomplete drafts; click opens an exact trusted Help section, clears search, highlights, scrolls and focuses it. Do not use a single command letter as a broad search. Comments/blank lines have no active command. PLAY Comma shortens and Period lengthens the first written time at/after its saved anchor; n halves/doubles duration, b halves/doubles value, literal seconds retain decimal calibre. A dedicated custom time fader is additional to the original eleven pairs. Numeric times remain seconds, not milliseconds; .001s=1ms. Cmd/Ctrl+Period remains panic. Long fades use v contours with e0; e ADSR digits remain short millisecond-scale phases rather than gate-normalized seconds.

Random-bracket design (composer clarification, 2026-11-25): distinguish exact choices, lower-bound, upper-bound and continuous ranges globally across numeric parameters. Recommended proposal: ?[a,b,c], ?[a:], ?[:b], ?[a:b]; plain [a b c] stays sequential. See docs/random-brackets.md. NOT implemented: current comma bounds still denote a continuous range. Do not silently change old patches or add these future forms to active presets/model instructions without coordinated migration. Open ends use documented random defaults, not maximal legal durations. No PLAY = action was requested by this clarification.

Random-array clarification (composer, 2026-11-25): commas and spaces are interchangeable array separators, with no independent musical meaning. Proposed `[a b c]` = `[a,b,c]`; `?[a b c]` = `?[a,b,c]` exact choices; `?[a:b]` continuous interval. This refines docs/random-brackets.md; the new global grammar remains pending implementation and migration.

Current contextual footer override (2026-11-26): command Help label has a fixed 180px desktop / 140px mobile slot, ellipsis and full hover title. Ctrl+H (Control, not Cmd) opens the current command's Help; without a command it opens the guide. Capture the shortcut before CodeMirror consumes it. Keep Cmd+H available to the OS. Palette and Help document the shortcut.

Current portrait/PLAY override (2026-11-26): portrait footer keeps W/E/U/Glide/model visible, with secondary capture/view/seed/source hash/reset in More. PLAY time lane stays fixed at the right while other faders scroll. Cmd/Ctrl+E includes a CodeMirror fallback; at end-of-code assign controls from the last numeric row. Alt arrows on a named u tuning cycle tuningAliases with wraparound and retained caret, using the existing U scheduling policy. Numeric and custom tuning edits retain digit behavior. Pulse-rows.syn is a finite 48-bar 170 BPM instrument-row arrangement; G is scoped to spores, not a transport loop.

Current live-silence override (2026-11-26): main-editor drafts compile with allowSilence, allowing comments/rests/unused definitions to emit zero voices without being mistaken for a syntax error. U L retains the previous cycle duration for silent drafts, supports uncommenting at a later boundary, and never reschedules a muted row. U W fades the structural graph into silence. Invalid drafts still retain current audio; effect tails decay naturally. Standalone compile remains strict by default.

Current lyrics override (2026-11-26): `l[text]` is literal local Kokoro speech (af_heart English); `l[text]:s/t/a/q[...]` sends that phrase through a 16-band vocoder with harmonic carrier banks. Default continuous mode speaks the whole phrase across the melody; articulated notes use consecutive PCM fractions. Prepare on explicit Play before transport; worker status goes to footer; Stop cancels preparation without delayed autoplay. New text requires Play; cached timbre/effect edits follow U. Text literals, including # and numbers, must not become comments or PLAY controls. Default gate is deterministic word-count estimate; duration fitting is resampling, not formant-preserving stretching or phonetic alignment. First use downloads model assets; text stays local. Google is not integrated. Time arrays / hyphenated syllable alignment are future work only; see docs/lyric-prosody.md.

Current shared-processing override (2026-11-26): {} always gathers an audio bus unless an explicit g enables feedback. Bus v/p/f/h/d/r stages are ordered and may repeat, including v as a stage rather than a hidden final gain. Untimed bus p/f ramps inherit the complete child span; explicit times remain literal. g owns internal d/f/v plus b/q/k/x; b/q/k/x and paired d require g. r/h/p are post-return effects; use an outer brace for post-return f/d/v stages. Bare/nested identity buses are valid; nested returns and buses within return paths remain unsupported. Keep legacy ()v/r/h/d processing compatible; new examples prefer {} for shared audio, () for grouping/repetition. Update model guide and Help with this current grammar.

Current lyric-performance override (2026-11-26): `l_[text]` adds yellow cinema phrase captions to the same lyric voice. Cues follow actual sounding events/time, clear on Stop/end, and enter canvas recordings/PNG independently of command CC. No word/phoneme alignment claim; command subtitles yield during lyric cues. Wet/dry `w0..9` is reserved for lyric vocoders (0 raw / 9 fully vocoded, default9), with equal-power mix and dry normalization. Untimed w ramps follow the whole phrase, explicit times remain literal; prepared hot edits retain native graph and use Glide. Oscillator FM i stays independent. Soft-machines.syn is a finite nine-section lyric song (144 BPM /96 bars /160 seconds/12 unique phrases); preserve isolated lyric sequencing scopes so musical backing does not advance verse starts.

Current historical-library override (2026-11-26): Reich-future.syn moves to Pieces, retaining Loop ON explicitly; changing category must not disable its future rotations. After-Studie-I.syn and After-Studie-II.syn are newly composed procedural miniatures, clearly marked NOT full score reconstructions. No upstream Csound/Max code or score schedule is copied. Study II derives five-tone frequencies on the 5^(1/25) lattice, injects five short slices ending at277.5ms, and keeps its ordered post-reverb v contour atzero until at least350ms, admitting chamber-only material. Its r9 IR differs from the historical chamber; docs/historical-studies.md records the sources and limitations.

Current grammar-2 override (2026-11-26): random alternatives use ?[a b c] = ?[a,b,c]; continuous ranges use ?[a:b], open endpoints ?[a:] / ?[:b]. Implemented globally for supported numeric controls, nested cells and literal-second duration choices. Existing Library ranges and old browser/shared snapshots migrate to colon; new snapshots carry grammar:2 and 2g/2j links. Plain-text imports use current grammar. u[f ...] is a finite absolute Hz table (1–512 distinct20..20000Hz values); o is ignored, written order retained, missing positions rejected, explicit octave prefixes retained. Stars are reserved for function arguments; *N references an already opened slot, including o*, gate apostrophe *, and s[n*]. Numeric prefixes work on named calls. User rejected rhythmic multiplication with stars, superseding the earlier indefinite-star proposal; keep finite (expression)count. Explicit bus processor time supplies missing plain-note gates; own gates, timed gestures, sequence clocks, finite repeats and feedback excitations retain timing. Separate Studie-II-Hajdu.syn translates the supplied local Max score table (380 mixtures,1900sines,175.527s), with score-data provenance excluded from 0BSD; both original After Studies remain. Document approximation to Max envelope/panning/yafr2.

Current header/files/sections override (2026-11-26): filename is the draggable editor pod tab title; no header palette/name button and no duplicate panic icon. Header order: brand, cursor ADSR, playing piece title/current section, one Play–Stop, Loop, Time, written BPM only when a tempo declaration exists. !t[...] / !title[...] are literal title messages, excluded from numeric editing/comments. ;name and ;<name with spaces> add named marks to the existing scoped relative clock; ;, ;10, ;n4 remain unchanged. Cmd/Ctrl+[ ] navigate sections: stopped moves cursor and sets next Play scope; playing queues a selected span at the current transport loop boundary (Loop off waits next Play). Whole piece is selectable. Section audition restarts voices/feedback, without restoring earlier effect state. Library click/import/share opens independent Editor files with local drafts; Library examples and tabs are draggable into Dockview positions. File focus must not overwrite other file texts or change running audio. F / Alt+F toggles editor auto-scroll without moving caret and a 24-second Stocky follow window; F stays essential in portrait footer. !st / !stocky is a visual-only frequency-band / written-intensity-and-ADSR dB score; default for Hajdu, not measured output spectra/loudness. Capture uses the same canvas. Keep all existing visual modes and global panic shortcuts.

Current detached/Stocky/section-name override (2026-11-26): Dockview same-origin /popout.html moves the existing pod into an external window. ↗ header, tab context menu and outside-viewport HTML5 drag request popout; ↙ or closing redocks; local /popout-controls.js owns fullscreen via ⛶ / Ctrl+F so user activation is in the displaying document. Blocked requests stay inline with an actionable status. Keep the opener alive; no duplicate audio/model engine is created. Editors setRoot on document migration; shortcut bridge retains panic; visual rAF and clock read the displaying window / shared AudioEngine. Exclude popouts from mobile auto-consolidation. FOLD pointer/trackpad rotation signs invert on both axes; pan, pinch zoom and keyboard axes retain their direction. Stocky has separate horizontal zoom/center state (1..128), strong pinch gain, touch/Safari/trackpad handlers, +/−/0, double-click fit and horizontal drag/scroll pan. 1:1 fits full duration even with F on; enabling F initially fits a24s window. Stocky lower intensity composes note v/ADSR and nested bus v stages at proper offsets; upper bands use envelope opacity. Curves are notation-derived, not measured tails/nonlinear-feedback energy. A sole unprefixed, zero-argument top-level call between ; boundaries becomes an implicit named section; explicit named separators take precedence, parallel calls/argument calls/internal instrument calls do not become sections. Cursor in its definition resolves the same section. Pulse rows retains its bare ; form without duplicated labels.

Future multichannel design (composer, 2026-11-26): see [docs/MULTICHANNEL-PLAN.md](docs/MULTICHANNEL-PLAN.md). Planning only: N raw-speaker outputs via a local Node/native-audio bridge, continuous ST preview, and a spatial FOLD domain independent of existing parameter mappings/camera. Preserve current o tuning/frequency and p sequence semantics. Typed p XYZ/direct-gain arrays, !spk layouts and DBAP are recommendations pending grammar/hardware validation, not executable syntax. First demonstrate distinct physical outputs and clock-stable PCM transport on the intended interface. Do not install native backends, change the compiler, add proposed presets/model instructions or deploy on the strength of this planning document alone. The public browser core remains independent of a local bridge.

Current multichannel probe (composer authorized first test, 2026-11-26): `npm run multichannel` starts an isolated loopback-only test UI at 127.0.0.1:5198. `tools/multichannel` pins audify 1.10.1 separately; no native dependency enters the browser bundle. `public/multichannel/` exports deterministic N-channel diagnostic WAV PCM24 and a channel-map JSON, with separate ST audition. Native BlackHole return tests passed for 8/16 channels; physical speakers and browser-to-Node PCM streaming remain unverified/unimplemented. See docs/multichannel-first-test.md. Do not describe this diagnostic as spatial p/DBAP or full-score multichannel export. Preserve grammar and the stereo instrument; future score export needs a true N graph and offline effect-tail policy.

Current online spatial output (composer, 2026-11-26): !spk[[id x y z] ...] declares 2–32 distinct speakers in metres; !spk[132 323 432] assigns IDs positionally with each digit d mapped d/4.5−1 metres. p[o1] / p[o1>2] are raw output-ID sends/linear crossfades, with no DBAP or normalization and other outputs zero. p[o gain ...] is a row-ordered0..9 gain matrix,9unity. p[x x y z] / p[423>111] are DBAP XYZ, normalized source coordinates uniformly scaled to layout extent; p sequences and tuning o remain unchanged. !vs selects Speakers; SP overlays it on FOLD without changing @ targets or audio when the camera moves. Layout edits require Play. N bus effects preserve lanes (bus reverb is per-lane mono); spatial bus p sums lanes into a shared mono emitter. Place spatial p outside feedback; internal circuits retain stereo topology before being gathered. Footer R opens true offline score render: one execution/selected section plus tails, WAV PCM24 ST or N, OGG/MP3 stereo only; JSON metadata/map available. Raw N export has no dynamics compressor; linked peak attenuation only above0.95 is reported. Browser monitor remains ST. Native browser-to-Node streaming is still future work. See docs/spatial-output.md and six Spatial output Library studies.

Current room/view/footer/preset override (composer, 2026-11-26): R/Alt R is audio render; V/Alt V is video + live stereo audio, Shift-click V / Alt Shift V opens video composition formats. Recess V + smaller CC/PNG/frame/settings in a subtle borderless footer well. Group editor F/W/E/U/Glide, space ISO/PER/PAN/SP, outputs, agents, then monitoring; More contains seed/hash/layout. Portrait retains essential model/editing and R/V. !room[width height depth] / !r[...] uses metres, centered origin,0.1..1000 per dimension. A room + layout binds growth nodes without explicit p to physical XYZ, preserving @ parameter mapping and explicit p priority. Compact !spk triplets use physical room half-dimensions; expanded rows stay metres. Keep the 12-edge room contour, green growth, cyan sounding bodies/trajectories, amber speakers; co-located output IDs are legal and remain discrete. Raw p[o1>4>3>2] divides the lifetime into equal crossfades. !vp now means parameter cube; !vf replaces old phyllotaxis !vp in Library. !vs is physical room/organism/sources; !vc shares room geometry when declared. !vt / !stocky is the temporal view, !st remains readable; !vd is reserved, not implemented. spkN / !spkN and names MON/STE/LCR/QUA/OCT/DOD/SUR select documented layouts. Bare4/8/12 are full-range cyclic rings; dotted layouts carry channel roles, not Atmos encoding. Ring geometry stays circular in rectangular rooms. DBAP excludes LFE; raw p may address it explicitly without automatic filtering/bass management. WAV writes a standard mask only for an exact supported role mapping, otherwise mask0 + JSON. See docs/spatial-output.md and Spatial output examples07–09. ITU/Dolby references do not imply certified conformance or native live streaming.

Current compact masthead override (composer, 2026-11-26): header and square Play are32px high at all breakpoints. syNo wordmark is regular13px desktop/12px portrait, with synthetic Notation on hover only; no always-visible caption. Preserve cursor envelope, playing title/sections and transport in that single-height row.

Current AUTO control (composer, 2026-11-26): footer Space group and portrait More expose camera.autoRotate as AUTO / Autopan orbit. It toggles automatic Y camera orbit only, independently of PAN drag and musical p. Pause freezes the accumulated orbit angle; resume continues without a phase jump. Manual orbit respects AUTO off.

Current editor gestures and file opening (2026-11-26): each Editor owns its right-hand FOLD gesture surface, covering the full code-body height and adapting to W 100/70/30. Opening other pods does not disable it; PAN stays inside the editor. Stage-wide gestures exist only in visuals-only mode. Library plain click replaces the active editor; Shift-click opens a tab; Cmd/Ctrl-click opens a right split. Dragging a file still creates/moves a tab to the chosen dock target.

Current growth defaults and embeds (2026-11-27): no whitespace required after growth/control sentences; N24 U0.08 D1 are the existing defaults. Parameter lists coexist with static growth; never merge all resulting nodes into a single continuous voice. Bare A&sound (and other G/S/H/R/K/L agent prefixes, optional compact digits/@) owns the remainder of the enclosing block; explicit &(...) scopes remain supported. Share → Copy embed targets /embed.html with optional code overlay and explicit user Play; only the dedicated embed document is frameable. Keep script/connect CSP restrictions on it.

Current A signature (2026-11-27): static A uses closed clonal capsules, shrinking 80% per generation (with minimum display size), deterministic environmental skew and single-parent filaments. D controls detachment distance; >2.5 is spore-like. Scoped A aligns the whole motif and scales its timing proportionally; shared feedback/output graphs retain their clocks. A& daughter JSON supports rhythm/rest/timbre, defaults to varied pulse proportions and ~?2, and births a related wave/noise variant every 3–5 daughters depending on U. Mothers remain immutable in Accumulate. Probability rests work after sounds and groups: ~?digit (digit/10), ~? default50%, ~ definite rest, same seeded draw per group/per loop, no timing collapse. A& ancestry visualization remains future work; do not fake lineage. See docs/growth/A-apomixis.md.

Current agent precision (2026-11-27): newly agent-written numeric notation uses at most one decimal place; integers omit .0. Normalize new accretion text and generated/directed edits, never the inherited parent source. Protect lyrics, titles and comments. Keep raw response history verbatim. Nonzero sub-tenth values become ±0.1 rather than accidental zero gates. A daughter uses a 0.1-second boundary grid, fits its original loop, and reduces pulse count when needed to retain positive gates. Duplicate detection compares the same numeric grid so rounding an old FM voice is not accepted as a new timbre.

Current sustained identity override (2026-11-27): A& prioritizes one long evolving daughter, rather than mandatory four-pulse subdivision. Only every third daughter may subdivide, normally with gates >=0.4 s. Short proposed durations expand within the existing score window; earlier music and the loop boundary remain intact. Independent transition times are valid; the issue was fragmented identity, not repeated time notation. The standalone GitHub tree vendors the existing browser SDK/types with MIT notice; do not restore sibling-workspace dependencies.

Current no-identical-descendant invariant (2026-11-27): automatic accumulation compares compiled audible fields, not raw AST spreads. Exclude call names/kinds, explicit/default flags and volume-only differences; normalize constant ramps and the one-decimal writing grid. Reject copies of existing voices and repeated new voices within one addition. Handwritten deliberate unisons remain legal.
