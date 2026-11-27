# Random brackets — grammar 2

Implemented 2026-11-26. Commas and spaces are interchangeable array separators.

| Form | Meaning |
| --- | --- |
| `?[a b c]`, `?[a,b,c]` | Choose one exact value; duplicates increase its weight |
| `?[a:]` | Continuous draw from a to the default random upper bound |
| `?[:b]` | Continuous draw from the default random lower bound to b |
| `?[a:b]` | Continuous draw within a…b |
| `?` | Both default random bounds |

`[a b c]` without a question mark remains ordered. `s?[110,880]` chooses only 110 or 880 Hz; `s?[110:880]` can produce intermediate frequencies. A colon inside random brackets is a range delimiter, independent of carrier:modulator FM outside brackets. Reversed/out-of-domain bounds are errors. Up to 128 exact alternatives are allowed. Commas with surrounding whitespace never introduce spatial rests; extra spaces without commas retain the existing spatial-mode behavior.

```syno
s?[100 200 400]v2'0.3
s[300 400 500]'?[0.1,1]
s220v?[1 3 5]p?[-1,0,1]h?[0.1:3]'1
s[?[100,200,400] 500]v[?[:4] 2]'0.2
```

The contract covers supported numeric random controls, frequency, pan, duration in seconds and nested parameter cells. Timbre enums accept `?[s,a]`; there is no continuous interval over waveform names. Numeric duration alternatives are seconds; random musical-figure lists are not implemented. In tuned n cells, alternatives are one-based tuning positions; continuous intervals select integer positions inclusively.

Default random bounds: frequency 55–1760 Hz (legal explicit Hz 20–20000), duration 0.1–2 seconds (legal explicit .001–86400), pan -1–1, ordinary normalized controls 0–9, FM index 0–20. Open ends use these defaults, not maximum legal limits. Explicit intervals must be nonempty; endpoints are never silently swapped. Frequencies draw logarithmically; seconds and numeric controls draw linearly. Draws are seeded and renew according to event/cycle policy, independently from timbre and time streams. An interval chooses a value; `>` / `<` describe continuous trajectories.

## Migration

Old two-number question lists represented continuous intervals. Bundled active scores, Help, model instructions and range regression tests now use colons. The one-time Library migration is recorded in `random-brackets-v2-migrated.json`; never rerun it against new exact-choice examples.

Existing browser drafts without `syno.lab.grammar=2` and old local/shared snapshots migrate executable two-number random lists to colon intervals. Literal lyrics and comments are preserved. New UI snapshots carry `grammar:2`; share tokens use envelope `2g.` or `2j.`, so old clients reject them rather than silently changing their meaning. Other snapshot metadata remains version 1. New plain-text imports have no historical metadata and use grammar 2: manually change old intended `?[a,b]` ranges to `?[a:b]`.
