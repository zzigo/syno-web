# SuperCollider → syNo: circuit study

This is an executable SuperCollider prototype and a proposed language mapping. The braces and period syntax described below are now implemented in the browser as an initial adaptation. The original design notes are retained below; the two-band drive/BPF topology is now implemented as a separate browser circuit variant (b/q/k controls).

## What was verified

The local SuperCollider 3.13 executable rendered these examples offline at 48 kHz stereo, without opening a hardware input or output:

- `feedback-decay.wav`: return gain 0.85. A single short excitation dies away; late RMS ≈ 9.46e-17.
- `feedback-circuit.wav`: return gain 1.12. The same excitation produces sustained oscillation: late RMS ≈ 0.0485, peak ≈ 0.0711, all samples finite. No continuing external input is required.
- `shepard-continuous.wav`: six sinusoidal voices descend logarithmically across six octaves. Phase wraps happen at zero amplitude. A 42-second render crosses two full 20-second periods; first/late RMS ≈ 0.0261/0.0275.

The RMS measurements demonstrate persistence and bounded output for this circuit and these settings; they are not a proof that every parameter configuration self-oscillates. Feedback behavior depends on losses, delay, filtering and channel routing.

## The circuit

`internal excitation + returned output → delay → DC removal → lowpass → tanh → returned output`

Stereo cross-routing blends each channel's own return with the other channel's return. Output amplitude is independent from feedback gain. The circuit has a release gate and a final output limiter. A digital circuit with exactly zero initial state and no excitation stays silent: the example supplies one tiny seed transient.

`:` remains FM. Its current oscillator → frequency-parameter connection does not return the carrier's output into its input.

## Initial syNo mapping

```text
{ n1v0.03'0.02 }d0.012g1.12f6.6v2'16
```

- `{ … }`: one shared closed audio circuit, not textual recursion or repetition.
- The sounds inside inject their outputs into its summing input. Several sounds share the same circuit.
- `d`: delay in seconds; `g`: return gain, including values greater than one.
- `f`: existing perceptual lowpass scale; `v`: output level, separate from g.
- Final `'16`: circuit lifetime in seconds, including sound after the excitation ends.
- Stereo routing needs a deliberate next design choice: a compact cross parameter for a two-channel circuit, or named ports and a routing matrix for multiple independent circuits. A local two-channel loop is the first executable prototype, not yet an arbitrary multi-bus patch language.
- The first browser transfer should support a shared circuit with explicit excitation, adjustable delay/gain/filter, bounded saturation and deterministic teardown on Stop. Delay changes need smoothing.

## Continuous descent

The existing browser transport repeats at the end of the full score. For the author's staggered ten-second voices, the final onset at eight seconds makes a cycle eighteen seconds long, so voice density falls before the next cycle.

The implemented form is `( … )'0.5`: renew the group every half second while previous voices continue. This requires overlapping recurrence in the scheduler, explicit polyphony validation, and playback/visual source tracking across cycle boundaries; merely changing the displayed cycle duration would be incorrect. A second, separate issue is logarithmic frequency interpolation: current `>` sweeps are linear in Hz; the new `^` operator supplies exponential frequency glides. The SuperCollider example implements the logarithmic trajectory directly and establishes a reference to port.

## Reproduce

From the repository root on this Mac:

```sh
/Applications/SuperCollider.app/Contents/MacOS/sclang -D -u 57129 /Users/zztt/projects/26-syno-web/experiments/supercollider/render.scd
```

`feedback.scd` and `shepard.scd` also contain live-use examples. Evaluate their SynthDefs, boot the server, then run the commented Synth commands. No extension UGens are required. Existing installed Maths extension binaries issue architecture warnings on this Mac; they are not used by either graph.

References:

- https://doc.sccode.org/Classes/LocalIn.html — a LocalIn/LocalOut return adds one control block of latency. The SC delay values in this prototype are not a pitch calibration.
- https://doc.sccode.org/Guides/Non-Realtime-Synthesis.html — offline Score rendering.
- https://webaudio.github.io/web-audio-api/#DelayNode — browser feedback cycles need delay and have render-quantum constraints. Similar topology will not imply sample-identical SuperCollider/browser output.
