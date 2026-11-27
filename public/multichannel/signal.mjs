// SPDX-License-Identifier: 0BSD
// Shared deterministic diagnostic signal; no syNo grammar changes.
export function configuration(input = {}) {
  const c = { channels: Number(input.channels ?? 8), sampleRate: 48000,
    tone: 0.4, gap: 0.1, amplitude: 10 ** (-30 / 20) };
  if (!Number.isInteger(c.channels) || c.channels < 1 || c.channels > 32)
    throw new Error('Choose 1–32 channels.');
  c.slotFrames = Math.round((c.tone + c.gap) * c.sampleRate);
  c.toneFrames = Math.round(c.tone * c.sampleRate);
  c.frames = c.channels * c.slotFrames;
  return c;
}
export const frequency = channel => 220 + channel * 55;
export function sample(c, frame, channel) {
  if (frame < 0 || frame >= c.frames || Math.floor(frame / c.slotFrames) !== channel) return 0;
  const local = frame % c.slotFrames;
  if (local >= c.toneFrames) return 0;
  const fade = Math.round(0.01 * c.sampleRate);
  const envelope = Math.min(1, local / fade, (c.toneFrames - 1 - local) / fade);
  if (envelope <= 0) return 0;
  return c.amplitude * envelope * Math.sin(2 * Math.PI * frequency(channel) * frame / c.sampleRate);
}
export function interleavedBlock(c, start, count) {
  const pcm = new Float32Array(count * c.channels);
  for (let i = 0; i < count; i++) for (let ch = 0; ch < c.channels; ch++)
    pcm[i * c.channels + ch] = sample(c, start + i, ch);
  return pcm;
}
export function stereo(c) {
  const left = new Float32Array(c.frames), right = new Float32Array(c.frames);
  for (let frame = 0; frame < c.frames; frame++) {
    const ch = Math.floor(frame / c.slotFrames), angle = c.channels === 1 ? Math.PI / 4 : ch / (c.channels - 1) * Math.PI / 2;
    const value = sample(c, frame, ch);
    left[frame] = value * Math.cos(angle); right[frame] = value * Math.sin(angle);
  }
  return [left, right];
}
export function manifest(c) {
  return { kind: 'syNo multichannel diagnostic, not a rendered score', format: 'WAVE_FORMAT_EXTENSIBLE / PCM24',
    channels: c.channels, sampleRate: c.sampleRate, duration: c.frames / c.sampleRate,
    channelMask: 0, order: 'discrete channels in file order; no surround assignment', peakDbFS: -30,
    outputs: Array.from({ length: c.channels }, (_, ch) => ({ output: ch + 1,
      frequencyHz: frequency(ch), onsetSeconds: ch * c.slotFrames / c.sampleRate, toneSeconds: c.tone })) };
}
export function wav(c) {
  const bytes = c.frames * c.channels * 3, padding = bytes % 2;
  const buffer = new ArrayBuffer(68 + bytes + padding), view = new DataView(buffer);
  const text = (offset, s) => [...s].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 40, true); view.setUint16(20, 0xfffe, true);
  view.setUint16(22, c.channels, true); view.setUint32(24, c.sampleRate, true);
  view.setUint32(28, c.sampleRate * c.channels * 3, true); view.setUint16(32, c.channels * 3, true);
  view.setUint16(34, 24, true); view.setUint16(36, 22, true); view.setUint16(38, 24, true);
  view.setUint32(40, 0, true); // Raw output order, deliberately not a 5.1/7.1 speaker mask.
  new Uint8Array(buffer, 44, 16).set([1,0,0,0,0,0,16,0,128,0,0,170,0,56,155,113]);
  text(60, 'data'); view.setUint32(64, bytes, true);
  let offset = 68;
  for (let i = 0; i < c.frames; i++) for (let ch = 0; ch < c.channels; ch++) {
    const value = Math.round(Math.max(-1, Math.min(1, sample(c, i, ch))) * 8388607);
    view.setUint8(offset++, value & 255); view.setUint8(offset++, (value >> 8) & 255); view.setUint8(offset++, (value >> 16) & 255);
  }
  return buffer;
}
