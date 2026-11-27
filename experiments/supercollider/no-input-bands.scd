/* User-contributed reference: two resonant bands, drive before filtering,
   continuous noise excitation and independent asymmetric returns.
   This is a reference for the NEXT circuit topology, not the current web lowpass circuit.
*/
(
SynthDef(\noInputSim, { |out=0, fb1=0.72, fb2=0.68, freq1=220, freq2=880, drive=2.5, amp=0.15|
    var local, n1, n2, sig;
    local = LocalIn.ar(2);
    n1 = (local[0] + PinkNoise.ar(0.0005)) * drive;
    n2 = (local[1] + WhiteNoise.ar(0.0005)) * drive;
    n1 = BPF.ar(n1.tanh, freq1.clip(40, 8000), 0.25) * fb1;
    n2 = BPF.ar(n2.tanh, freq2.clip(40, 8000), 0.2) * fb2;
    LocalOut.ar([
        DelayC.ar(n1 + (n2 * 0.35), 0.1, 0.013),
        DelayC.ar(n2 + (n1 * 0.35), 0.1, 0.029)
    ]);
    sig = Limiter.ar((n1 + n2) * amp, 0.7);
    Out.ar(out, sig);
}).add;
)
// s.boot;
// x = Synth(\noInputSim);
// x.set(\freq1,145,\freq2,620,\fb1,0.82,\fb2,0.75,\drive,4);
// x.free;
