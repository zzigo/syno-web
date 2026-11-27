// Headless NRT verification; does not boot a hardware audio device.
var root = thisProcess.nowExecutingPath.dirname;
var output = root +/+ "../../output";
var options = ServerOptions.new.numOutputBusChannels_(2).numInputBusChannels_(0);
thisProcess.interpreter.executeFile(root +/+ "feedback.scd");
thisProcess.interpreter.executeFile(root +/+ "shepard.scd");
Server.program = "/Applications/SuperCollider.app/Contents/Resources/scsynth";
Routine({
    var done;
    [
        ["feedback-decay.wav", ~feedbackDef, \synoFeedback, [\feedback, 0.85, \delay, 0.012], 8],
        ["feedback-circuit.wav", ~feedbackDef, \synoFeedback, [\feedback, 1.12, \delay, 0.012], 16],
        ["shepard-continuous.wav", ~shepardDef, \synoShepard, [\seconds, 20, \amp, 0.22], 42]
    ].do { |example|
        done = false;
        Score([
            [0.0, [\d_recv, example[1].asBytes]],
            [0.01, [\s_new, example[2], 1000, 0, 0] ++ example[3]],
            [example[4] - 0.6, [\n_set, 1000, \gate, 0]],
            [example[4], [\c_set, 0, 0]]
        ]).recordNRT(outputFilePath: output +/+ example[0], sampleRate: 48000,
            headerFormat: "WAV", sampleFormat: "float", options: options,
            duration: example[4], action: { done = true; });
        while { done.not } { 0.1.wait };
        ("Rendered " ++ example[0]).postln;
    };
    0.exit;
}).play(SystemClock);
