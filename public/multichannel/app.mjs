// SPDX-License-Identifier: 0BSD
import { configuration, frequency, stereo, wav, manifest } from './signal.mjs';
const $ = id => document.getElementById(id);
let context, source, animation, nativeAvailable = false;
const config = () => configuration({ channels: $('channels').value });
function draw() {
  $('outputs').replaceChildren(...Array.from({ length: config().channels }, (_, ch) => {
    const el = document.createElement('div'); el.className = 'channel';
    el.append(`OUT ${ch + 1}`); const small = document.createElement('small'); small.textContent = `${frequency(ch)} Hz`; el.append(small); return el;
  }));
}
function clearPreview() {
  if (source) { source.onended = null; try { source.stop(); } catch {} source.disconnect(); source = null; }
  cancelAnimationFrame(animation); document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
}
async function request(path, body) {
  const result = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await result.json(); if (!result.ok) throw new Error(data.error || result.statusText); return data;
}
async function stop() {
  clearPreview();
  if (nativeAvailable) await request('/api/stop', {}).catch(error => $('status').textContent = error.message);
  $('status').textContent = 'Stopped.';
}
$('preview').onclick = async () => {
  try {
    await stop(); context ??= new AudioContext({ sampleRate: 48000 }); await context.resume();
    const c = config(), buffer = context.createBuffer(2, c.frames, c.sampleRate);
    stereo(c).forEach((data, ch) => buffer.copyToChannel(data, ch));
    const node = context.createBufferSource(); source = node; node.buffer = buffer; node.connect(context.destination);
    const start = context.currentTime + .05; node.start(start);
    $('status').textContent = 'ST reference · sequential channels, left → right.';
    node.onended = () => { if (source === node) { clearPreview(); $('status').textContent = 'ST reference finished.'; } };
    const tick = () => { const ch = Math.floor((context.currentTime - start) / .5);
      [...$('outputs').children].forEach((el, index) => el.classList.toggle('active', ch === index)); animation = requestAnimationFrame(tick); }; tick();
  } catch (error) { $('status').textContent = error.message; }
};
$('stop').onclick = stop;
$('channels').onchange = async () => { await stop(); draw(); };
function download(data, type, name) {
  const url = URL.createObjectURL(new Blob([data], { type })), anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('wav').onclick = () => {
  try { const c = config(); download(wav(c), 'audio/wav', `syno-output-test-${c.channels}ch.wav`);
    $('status').textContent = `WAV exported · ${c.channels} discrete channels · ${(c.frames / c.sampleRate).toFixed(1)} s. Download the channel map alongside it.`;
  } catch (error) { $('status').textContent = error.message; }
};
$('manifest').onclick = () => download(JSON.stringify(manifest(config()), null, 2), 'application/json', `syno-output-test-${config().channels}ch.json`);
$('test').onclick = async () => {
  try {
    if (!$('device').value) throw new Error('Select a device first.');
    clearPreview(); $('report').textContent = '';
    await request('/api/start', { device: Number($('device').value), channels: config().channels, loopback: $('loopback').checked });
    $('status').textContent = 'Native test running · one output at a time.';
  } catch (error) { $('status').textContent = error.message; }
};
async function connect() {
  // A public/static page remains an offline WAV/ST tool; do not contact localhost from it.
  if (!['127.0.0.1', 'localhost'].includes(location.hostname) || location.port !== '5198') {
    $('connection').textContent = 'WAV and ST available here. Native output: run the local test service at 127.0.0.1:5198.'; return;
  }
  try {
    const devices = await request('/api/devices'); nativeAvailable = true;
    for (const device of devices.filter(d => d.outputChannels > 0)) {
      const option = document.createElement('option'); option.value = device.id;
      option.textContent = `${device.name} · ${device.outputChannels} out`; $('device').append(option);
    }
    $('device').disabled = false; $('test').disabled = false;
    $('device').onchange = () => { const device = devices.find(d => d.id === Number($('device').value));
      $('loopback').disabled = !device?.name.includes('BlackHole');
      $('loopback').checked = !!device?.name.includes('BlackHole'); };
    $('connection').textContent = 'Local native backend connected. Choose an explicit device.';
    const blackhole = devices.find(d => d.name.includes('BlackHole') && d.outputChannels >= config().channels);
    if (blackhole) $('device').value = blackhole.id;
    $('device').onchange();
    setInterval(async () => { try { const state = await request('/api/status');
      if (state.state === 'done' || state.state === 'failed') { $('status').textContent = state.report?.pass === false ? 'FAIL · inspect the return-channel report.' : state.report?.pass === true ? 'PASS · virtual return matches every output. Physical speakers are not verified.' : 'Native test completed · inspect the report / physical outputs.'; $('report').textContent = JSON.stringify(state.report, null, 2); }
      if (state.state === 'error') $('status').textContent = state.error;
    } catch { $('status').textContent = 'Local service disconnected.'; } }, 1000);
  } catch (error) { $('connection').textContent = error.message; }
}
document.addEventListener('keydown', event => { if (event.code === 'Escape' || ((event.metaKey || event.ctrlKey) && event.code === 'Period') || (event.code === 'Space' && !['INPUT','SELECT','BUTTON'].includes(document.activeElement?.tagName))) { event.preventDefault(); stop(); } });
draw(); connect();
