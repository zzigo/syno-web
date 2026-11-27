// SPDX-License-Identifier: 0BSD
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = new URL('../../public/multichannel/', import.meta.url);
const probe = fileURLToPath(new URL('./probe.mjs', import.meta.url));
const port = 5198;
let child = null, status = { state: 'idle' };
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'" };
function run(args) {
  return new Promise((resolve, reject) => {
    const job = spawn(process.execPath, [probe, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    job.stdout.on('data', data => out += data); job.stderr.on('data', data => err += data);
    job.on('error', reject); job.on('close', code => code === 0 ? resolve(JSON.parse(out)) : reject(new Error(err || out)));
  });
}
async function stop() {
  const job = child;
  if (job) await new Promise(resolve => {
    const deadline = setTimeout(() => job.kill('SIGKILL'), 1000);
    job.once('close', () => { clearTimeout(deadline); resolve(); }); job.kill('SIGTERM');
  });
  status = { state: 'stopped' };
}
const server = createServer(async (req, res) => {
  const send = (code, value) => { res.writeHead(code, { ...headers, 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  try {
    if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`) return send(403, { error: 'Loopback host required.' });
    if (req.method === 'POST') {
      if (req.headers.origin !== `http://${req.headers.host}` || req.headers['content-type'] !== 'application/json') return send(403, { error: 'Same-origin JSON required.' });
      if (req.url === '/api/stop') { await stop(); return send(200, status); }
      if (req.url !== '/api/start') return send(404, { error: 'Unknown endpoint.' });
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 1024) return send(413, { error: 'Request too large.' }); }
      const input = JSON.parse(body);
      if (child) return send(409, { error: 'Stop the current test first.' });
      if (!Number.isInteger(input.device) || !Number.isInteger(input.channels) || input.channels < 1 || input.channels > 32) return send(400, { error: 'Explicit device ID and 1–32 channels required.' });
      const devices = await run(['--list']);
      // Device enumeration is asynchronous; recheck after it before starting a second job.
      if (child) return send(409, { error: 'A test is already running.' });
      const device = devices.find(d => d.id === input.device);
      if (!device || device.outputChannels < input.channels) return send(400, { error: 'Device has insufficient outputs.' });
      const args = ['--device', String(device.id), '--channels', String(input.channels)];
      if (input.loopback) args.push('--loopback');
      const job = spawn(process.execPath, [probe, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
      child = job; status = { state: 'running', channels: input.channels, device: device.name };
      let output = '', stderr = '';
      job.stdout.on('data', data => output += data); job.stderr.on('data', data => stderr += data);
      job.on('error', error => { if (child === job) { child = null; status = { state: 'error', error: String(error) }; } });
      job.on('close', code => {
        if (child !== job) return; child = null;
        try { status = { state: code === 0 ? 'done' : 'failed', report: JSON.parse(output), diagnostic: stderr }; }
        catch { status = { state: 'error', error: stderr || output || `Exit ${code}` }; }
      });
      return send(200, status);
    }
    if (req.method !== 'GET') return send(405, { error: 'Unsupported method.' });
    if (req.url === '/api/devices') return send(200, await run(['--list']));
    if (req.url === '/api/status') return send(200, status);
    const path = req.url?.split('?')[0];
    const files = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'],
      '/app.mjs': ['app.mjs', 'text/javascript'], '/signal.mjs': ['signal.mjs', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
    if (!files[path]) return send(404, { error: 'Not found.' });
    const [file, type] = files[path];
    res.writeHead(200, { ...headers, 'Content-Type': `${type}; charset=utf-8` }); res.end(await readFile(new URL(file, root)));
  } catch (error) { send(500, { error: String(error) }); }
});
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, async () => { await stop(); server.close(); });
server.listen(port, '127.0.0.1', () => console.log(`syNo output probe: http://127.0.0.1:${port}`));
