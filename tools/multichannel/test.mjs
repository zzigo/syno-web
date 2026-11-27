// SPDX-License-Identifier: 0BSD
import test from 'node:test';
import assert from 'node:assert/strict';
import { configuration, sample, wav, stereo, interleavedBlock } from '../../public/multichannel/signal.mjs';
test('Sequential slots address exactly one channel, with silent gaps and fades', () => {
  const c = configuration({ channels: 8 });
  for (let channel = 0; channel < c.channels; channel++) {
    const start = channel * c.slotFrames;
    assert.equal(sample(c, start, channel), 0);
    for (let other = 0; other < c.channels; other++) {
      if (other !== channel) for (let i = 0; i < c.slotFrames; i += 131) assert.equal(sample(c, start + i, other), 0);
    }
    let energy = 0;
    for (let i = 0; i < c.toneFrames; i++) energy += sample(c, start + i, channel) ** 2;
    assert.ok(energy > 1);
    assert.equal(sample(c, start + c.toneFrames + 100, channel), 0);
  }
  assert.equal(sample(c, c.frames, 0), 0);
});
test('WAVE extensible header, PCM24 values and raw output order roundtrip', () => {
  const c = configuration({ channels: 4 });
  const bytes = wav(c), v = new DataView(bytes);
  assert.equal(v.getUint32(4, true), bytes.byteLength - 8);
  assert.equal(v.getUint16(20, true), 0xfffe); assert.equal(v.getUint16(22, true), 4);
  assert.equal(v.getUint16(34, true), 24); assert.equal(v.getUint32(40, true), 0);
  assert.equal(v.getUint32(44, true), 1); assert.equal(v.getUint32(64, true), c.frames * 4 * 3);
  for (let ch = 0; ch < 4; ch++) {
    const i = ch * c.slotFrames + 577, offset = 68 + (i * 4 + ch) * 3;
    let value = v.getUint8(offset) | (v.getUint8(offset + 1) << 8) | (v.getUint8(offset + 2) << 16);
    if (value & 0x800000) value -= 0x1000000;
    assert.ok(Math.abs(value / 8388607 - sample(c, i, ch)) < 1 / 8388607);
  }
});
test('ST reference keeps the N-source energy using equal-power channel positions', () => {
  const c = configuration({ channels: 8 }), [l, r] = stereo(c);
  for (let i = 577; i < c.frames; i += 229) {
    const channel = Math.floor(i / c.slotFrames), value = sample(c, i, channel);
    assert.ok(Math.abs(l[i] ** 2 + r[i] ** 2 - value ** 2) < 1e-9);
  }
});
test('Interleaving and finite native padding preserve layout', () => {
  const c = configuration({ channels: 2 });
  const pcm = interleavedBlock(c, c.frames - 100, 512);
  assert.equal(pcm.length, 1024);
  assert.ok([...pcm.slice(200)].every(v => v === 0));
  for (const channels of [0, 1.2, 33, NaN]) assert.throws(() => configuration({ channels }));
});
