/* syNo circuit study. 0BSD.
   Evaluate the SynthDef, then the live examples below.
   Output feeds back into input; ':' in syNo currently only means FM.
   No microphone is opened. inBus is an optional INTERNAL audio bus.
*/
(
~feedbackDef = SynthDef(\synoFeedback, {
    |out=0, inBus=16, feedback=1.08, delay=0.012, cutoff=3500,
      cross=0.35, excite=0.003, inputGain=0, amp=0.12, gate=1|
    var returned, incoming, seed, routed, circuit, envelope;
    RandSeed.ir(1, 3181);
    returned = LocalIn.ar(2);
    incoming = In.ar(inBus, 2) * inputGain;
    // A tiny initial impulse starts the digital circuit. Zero in = zero out.
    seed = PinkNoise.ar(1 ! 2) * Decay2.ar(Impulse.ar(0), 0.001, 0.02) * excite;
    // Cross routes one channel's output back into the other's input.
    routed = (returned * (1 - cross.clip(0, 1))) + (returned.reverse * cross.clip(0, 1));
    circuit = DelayC.ar(incoming + seed + (routed * feedback.clip(0, 1.5)), 0.5,
        Lag.kr(delay.clip(0.001, 0.5), 0.1) * [1, 1.013]);
    circuit = LPF.ar(LeakDC.ar(circuit), Lag.kr(cutoff.clip(80, 12000), 0.1));
    circuit = circuit.tanh;
    envelope = EnvGen.kr(Env.asr(0.02, 1, 0.3), gate, doneAction: 2);
    LocalOut.ar(circuit * envelope);
    Out.ar(out, Limiter.ar(circuit * amp.clip(0, 0.25) * envelope, 0.25));
});
~feedbackDef.add;
)

// Start after s.boot; the circuit can keep sounding after its tiny seed ends.
// LocalIn/LocalOut adds ONE CONTROL BLOCK to the delay (not pitch calibrated).
// q = Synth(\synoFeedback);
// q.set(\feedback, 0.85);              // decaying feedback
// q.set(\feedback, 1.12);              // growth toward bounded saturation
// q.set(\delay, 0.004, \cutoff, 2200);  // change the circuit, not an oscillator
// q.set(\cross, 1);                    // output L -> input R; output R -> input L
// q.set(\gate, 0);                     // release, then free the whole circuit
// Cmd+. stops all synths.

// Optional: inject another synth's OUTPUT into this circuit's INPUT.
// Evaluate after boot; order is explicit: excitation before reader.
/*
(
~wire = Bus.audio(s, 2);
~circuit = Synth(\synoFeedback, [\inBus, ~wire.index, \inputGain, 1]);
~excitation = {
    Out.ar(~wire.index, Pan2.ar(Saw.ar(220, 0.025) * EnvGen.kr(Env.perc(0.01, 0.3), doneAction: 2)));
}.play(target: ~circuit, addAction: \addBefore);
)
// ~circuit.set(\feedback, 1.1, \delay, 0.02);
// ~circuit.set(\gate, 0); ~wire.free;
*/
