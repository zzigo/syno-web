/* syNo Shepard-Risset study. 0BSD.
   Six sine voices, logarithmic descent across six octaves.
   Each voice wraps at zero amplitude. One continuous synth: no score restart.
*/
(
~shepardDef = SynthDef(\synoShepard, { |out=0, seconds=20, amp=0.12, gate=1|
    var phase, voices, envelope;
    phase = Phasor.kr(0, ControlDur.ir / seconds.clip(2, 120), 0, 1);
    voices = Mix.fill(6, { |i|
        var p = (phase + (i / 6)).wrap(0, 1);
        var frequency = 55 * (2 ** ((1 - p) * 6));
        var window = sin(pi * p).squared;
        Pan2.ar(SinOsc.ar(frequency, 0, window / 6), sin(p * 2pi) * 0.6);
    });
    envelope = EnvGen.kr(Env.asr(0.2, 1, 0.5), gate, doneAction: 2);
    Out.ar(out, Limiter.ar(voices * amp.clip(0, 0.3) * envelope, 0.25));
});
~shepardDef.add;
)
// s.boot;
 x = Synth(\synoShepard);
 x.set(\seconds, 10); // faster descent; stays continuous
 x.set(\gate, 0);
