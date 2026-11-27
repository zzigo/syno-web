# Independent loops — accepted notation, pending implementation

Decision date: 2026-11-25.

The composer accepted `(…)*` as the notation for indefinite repetition with an independent clock. This document records the design; the current parser and scheduler do not implement it. Examples marked proposed are not executable library presets.

## Duration and figuration

`'n4` sets a quarter-note event duration and `'n8` an eighth-note duration at the current `!b` tempo. At 60 BPM they are 1 s and 0.5 s. Duration alone does not retrigger a sound. Repetition creates successive attacks; a sequence additionally advances through its cells.

Currently, parallel scalar sounds start together and the global Loop switch repeats their complete finite score. Consequently, `s201'n4 t50'n8` has two attacks at the beginning of each one-second cycle: the triangle ends halfway through, then waits.

Executable workaround for four seconds of quarter notes against eighth notes:

```syno
!b60
(s201'n4)4
(t50'n8)8
```

Both groups last four seconds. Global Loop repeats that complete form.

## Accepted extension

| Notation | Meaning | Status |
| --- | --- | --- |
| `(…)` | Execute the group once | Implemented |
| `(…)4` | Execute the group four times consecutively | Implemented |
| `(…)*` | Repeat the group indefinitely on its own clock | Accepted; not implemented |

Proposed:

```syno
!b60
(s201'n4)*
(t50'n8)*
```

The first group attacks at 0, 1, 2, 3… seconds; the second at 0, 0.5, 1, 1.5… seconds. Neither group waits for the other's duration or requires a calculated finite repeat count. Parallel groups begin together unless their surrounding context supplies a different origin.

The period is the duration of one complete group body, using the existing group-duration rules. A body may contain simultaneous voices, sequences, finite subgroups and relative sections. Its next iteration starts when that body finishes. Reverb and echo tails may overlap successive iterations; they do not determine the period.

`*` immediately after a closing parenthesis is the repeat suffix. This reuses an existing character without changing parameter placeholders inside definitions:

```syno
# Existing parameter slots; implemented:
fm=s*:s*v2'1
fm220,55

# Proposed indefinite repetition of an invocation:
(fm220,55)*
```

Bare parentheses retain their grouping and processing role. Indefinite repetition is explicit; existing parenthesized patches do not silently become independent loops.

## Implementation boundaries still to settle

- Interaction between indefinite groups and the global Loop switch, including how to stop renewal while allowing current voices and tails to finish. Panic must remain immediate.
- A sequential `;` cannot advance past an indefinitely running section without an explicit finite endpoint. The compiler should diagnose that situation rather than invent an end time; finite bounds are not specified here.
- Nested indefinite groups and growth bodies: define their ownership and completion before supporting them. An unbounded child must not imply infinite compile-time expansion.
- Update mode U L needs a clear commit boundary for independent clocks, especially when one edit changes several groups. The current single global-cycle behavior is not a solution to that future case.
- Shared postfix effects must have explicit resource ownership across iterations. Scheduler renewal must use bounded lookahead and release obsolete voices, buses and circuits.

Implement as runtime renewal, not a pre-expanded infinite event list. Preserve seeded reproducibility across iterations and expose each group's phase for inspection. Keep this proposal out of executable examples and model-language instructions until implemented and verified.

## Proposed probabilistic rests — 2026-11-25

Composer request: a group may remain silent with a probability expressed in tenths. This is a notation proposal, not implemented. The requested probability scale and 50% default are recorded below; treating a bare postfix `~` as a certain rest is the recommended interpretation, pending confirmation.

| Proposed notation | Probability of silence per execution |
| --- | --- |
| `(…)~?1` | 10% |
| `(…)~?9` | 90% |
| `(…)~?` | 50%, equivalent to `~?5` |
| `(…)~?0` | 0% |
| `(…)~` | Recommended: certain silence, 100% |

The digit denotes probability of **silence**, not sound: `~?9` sounds approximately 10% of the time. The default is a probability, not a fixed alternation between sound and silence. The proposed compact scale is 0–9; certain silence has the separate bare `~` form.

Proposed examples:

```syno
!b60
# Eight quarter-note slots; each slot has its own 10% rest chance.
((s220v2'n4)~?1)8

# Make one decision for the complete two-voice group, per repetition.
((s220v2'n4 t330v1'n4)~?5)8

# Independent renewal plus a new rest decision each iteration:
((t50'n8)~?9)*
```

### Musical semantics to preserve

- A rest occupies the duration of that execution. It suppresses new attacks without shortening the cycle, moving later sections or accelerating the loop.
- A group receives one shared decision per execution: its simultaneous voices either play together or rest together. Nested groups may make their own decisions when their parent is audible.
- Finite repeats and future independent loops redraw on every execution. Use a separate seeded random stream keyed by group identity and iteration; rest choices must not consume timbre/pitch random draws or change generated pitches merely by being enabled.
- Omit excitation rather than abruptly muting an already sounding effect return. Notes and reverb/delay tails from earlier executions may continue over a rest.
- Existing `~` **inside a sequence list** remains a deterministic rest cell. The proposed postfix extends that meaning to complete group executions.
- A rest does not stop the global transport or act as an instruction to cancel agents or other independent processes.

Before implementation, settle the legal suffix order relative to finite counts, `*` and output processors, and how rest decisions appear in compiled data and visuals. The nested examples above make the intended per-execution grouping explicit without claiming those suffixes already parse.
