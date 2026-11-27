# Reused components

## HYLON FOLD generators

`src/vendor/fold-generators.js` was initially copied from of the user's existing `Documents/ChatGPT/apomixis.bin/master-spec/packages/fold/generators.js`, retrieved locally on 2026-11-22. Its apomixis implementation has since been adapted for clonal capsules and dispersal; the remaining algorithms retain their upstream provenance. It contains the seeded PRNG and apomixis, phyllotaxis, stolon, apical dominance, tropism and colonisation implementations. It remains identified as upstream project code; the new repository license does not purport to replace any upstream terms.

## ORF

The existing `@orf/client` and browser-only `@orf/core` type contracts are snapshotted in `vendor/` from the ORF workspace. `vendor/orf-snapshot.json` records source paths and SHA-256 checksums; aliases point to these local files so a standalone clone can build. The ORF package declares MIT licensing. The MIT license text is in `vendor/LICENSE-MIT.txt`; preserve the upstream licensing when distributing this copy; no agent or model backend is copied here.

## Other libraries

CodeMirror 6, Dockview, Svelte and Lucide are installed from their official npm packages. Their licenses and copyright notices remain in their package distributions. Build source maps are disabled; build artifacts do not contain credentials.

## Local voice

Kokoro-JS 1.2.1 and the Kokoro-82M-v1.0 ONNX model use Apache-2.0 terms. Transformers.js uses Apache-2.0; ONNX Runtime Web uses MIT. Preserve their package notices. Runtime notices and licenses are distributed under `/voice-runtime/`. Kokoro model/voice files are fetched directly from their published model repository on first use and retained by the browser runtime cache. The speech/PCM approach is adapted from the existing reader; the 16-band vocoder architecture follows the earlier audio prototype. No GPL meSpeak code or identity-specific voice clone is bundled.

## Studie II score data / Georg Hajdu realization

`library/pieces/Studie-II-Hajdu.syn` translates the 380-row score table in the user's installed Max example `stockhausen-studie-II.maxpat`. Real-time version: Georg Hajdu, with Les Stuck, Sven Bey, Thorsten Floth, Catrin Groth and Ulrike Luttmann; thanks Werner Funk. Source score notice: 1954 Stockhausen Verlag; the Max example states “Used with permission.” This provenance statement does not relicense score-derived data under 0BSD or assert a separate permission grant to syNo. No Max UI/assets or Max DSP source is distributed. See `docs/hajdu-studie-ii.md` and its hash manifest for scope and sonic differences.

## Optional native multichannel probe

The isolated `tools/multichannel` package uses audify 1.10.1 (MIT), whose package includes RtAudio and Opus with their own upstream notices. Preserve the installed package licenses. Native dependencies are not bundled into the public syNo site. The browser diagnostic and WAV encoder are new 0BSD code. Format references are linked in `docs/multichannel-first-test.md`; no codec implementation was copied.

## Optional file encoders

MP3 export loads the unmodified, replaceable ESM file of @breezystack/lamejs1.2.7 (LGPL-3.0) at `/audio-codecs/lamejs.js`. Its license is `/audio-codecs/lamejs-LICENSE.txt`; the npm distribution package is `/audio-codecs/breezystack-lamejs-1.2.7.tgz`. The corresponding upstream source and build files at commit1fb0ef5fa177413107e2e107d054a9b994e3f79c are also distributed at `/audio-codecs/lamejs-corresponding-source.tar.gz`. Replace that module with a compatible Mp3Encoder implementation to relink independently of syNo; no LAME code is merged into the application bundle. Upstream: https://github.com/shijinyu/lamejs.

Ogg export uses the unmodified `dist/libvorbis.js` from vorbis-encoder-js1.0.2 as `/audio-codecs/libvorbis.js`, loaded in a worker. Complete package, source, build recipe and upstream notices: `/audio-codecs/vorbis-encoder-js-1.0.2.tgz`. The package manifest states ISC; its README states MIT for the wrapper and Xiph BSD-style terms for libogg/libvorbis. Preserve all original notices; those components are not relicensed0BSD. syNo's direct-call worker adapter is new0BSD and avoids the upstream dynamic cwrap/eval helper. Source: https://github.com/miyabisun/vorbis-encoder-js.
