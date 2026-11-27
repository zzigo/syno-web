// SPDX-License-Identifier: 0BSD
import audify from 'audify';
import { writeFile } from 'node:fs/promises';
import { configuration, frequency, interleavedBlock } from '../../public/multichannel/signal.mjs';
const { RtAudio, RtAudioFormat } = audify;
const args = process.argv.slice(2);
const option = name => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
const rt = new RtAudio();
const devices = rt.getDevices();
if (args.includes('--list')) { console.log(JSON.stringify(devices, null, 2)); process.exit(0); }
const c = configuration({ channels: option('--channels') });
const id = Number(option('--device'));
const device = devices.find(d => d.id === id);
if (!device || device.outputChannels < c.channels) throw new Error('Select an explicit device ID with enough output channels; use --list.');
const loopback = args.includes('--loopback');
if (loopback && (!device.name.includes('BlackHole') || device.inputChannels < c.channels))
  throw new Error('Automated return test is restricted to BlackHole. Physical input verification needs an explicit routing plan.');
const errors = [], captured = [];
let frameSize = 512, produced = 0, completed = 0, queued = 0, stopping = false;
let timeout, settle, totalBlocks;
const tailFrames = loopback ? 4800 : 0;
const report = { kind: 'native-output-probe', device: device.name, deviceId: id,
  channels: c.channels, sampleRate: c.sampleRate, loopback, physicalSpeakersVerified: false,
  backend: 'audify 1.10.1 / RtAudio', errors };
function close() {
  if (stopping) return; stopping = true; clearTimeout(timeout); clearTimeout(settle);
  try { rt.setFrameOutputCallback(null); rt.setInputCallback(null); rt.clearOutputQueue();
    if (rt.isStreamRunning()) rt.stop(); if (rt.isStreamOpen()) rt.closeStream();
  } catch (error) { errors.push(String(error)); }
}
process.on('SIGINT', () => { close(); process.exit(130); });
process.on('SIGTERM', () => { close(); process.exit(143); });
function enqueue() {
  if (stopping || produced >= totalBlocks) return;
  const pcm = interleavedBlock(c, produced * frameSize, frameSize);
  rt.write(Buffer.from(pcm.buffer)); produced++; queued++;
}
const done = new Promise((resolve, reject) => {
  try {
    frameSize = rt.openStream({ deviceId: id, nChannels: c.channels, firstChannel: 0 },
      loopback ? { deviceId: id, nChannels: c.channels, firstChannel: 0 } : null,
      RtAudioFormat.RTAUDIO_FLOAT32, c.sampleRate, frameSize, 'syNo channel probe',
      loopback ? buffer => { if (!stopping) captured.push(Buffer.from(buffer)); } : null,
      () => {
        if (stopping) return;
        completed++; queued--; enqueue();
        if (completed === totalBlocks) settle = setTimeout(resolve, 60);
      }, 0, (type, message) => { errors.push({ type, message }); });
    totalBlocks = Math.ceil((c.frames + tailFrames) / frameSize);
    report.frameSize = frameSize; report.latencyFrames = rt.getStreamLatency();
    for (let i = 0; i < Math.min(4, totalBlocks); i++) enqueue();
    rt.start();
    timeout = setTimeout(() => reject(new Error('Native output callback timed out.')), (c.frames / c.sampleRate + 5) * 1000);
  } catch (error) { reject(error); }
});
try {
  await done; close();
  report.completedBlocks = completed; report.finalQueuedBlocks = queued;
  if (loopback) {
    const data = Buffer.concat(captured), frames = data.length / (c.channels * 4);
    const values = new Float32Array(data.buffer, data.byteOffset, data.length / 4);
    const matrix = [];
    for (let input = 0; input < c.channels; input++) {
      const magnitudes = [];
      for (let source = 0; source < c.channels; source++) {
        let re = 0, im = 0;
        for (let i = 0; i < frames; i++) {
          const phase = 2 * Math.PI * frequency(source) * i / c.sampleRate;
          re += values[i * c.channels + input] * Math.cos(phase);
          im += values[i * c.channels + input] * Math.sin(phase);
        }
        magnitudes.push(Math.hypot(re, im) * 2 / frames);
      }
      const own = magnitudes[input], others = magnitudes.filter((_, i) => i !== input);
      const spectralSeparationDb = 20 * Math.log10(Math.max(1e-12, ...others) / Math.max(own, 1e-12));
      matrix.push({ input: input + 1, expectedHz: frequency(input), amplitude: own,
        strongestOutput: magnitudes.indexOf(Math.max(...magnitudes)) + 1, spectralSeparationDb,
        pass: own > c.amplitude * c.tone / (c.frames / c.sampleRate + .2) * .5 && spectralSeparationDb < -40 });
    }
    report.capturedFrames = frames; report.channelsResult = matrix;
    report.pass = matrix.every(row => row.pass) && errors.length === 0;
  } else report.pass = null;
  if (option('--report')) await writeFile(option('--report'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (report.pass === false) process.exitCode = 1;
} catch (error) { close(); console.error(error); process.exitCode = 1; }

// Audify retains native thread-safe callbacks after close; this finite CLI owns its process.
process.exit(process.exitCode ?? 0);
