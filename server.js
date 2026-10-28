const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const TOKEN = process.env.RENDER_TOKEN || '';
const OUT = path.join(__dirname, 'renders', 'saipa-reel.mp4');
let job = 'idle';
let log = '';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    return res.end('ok');
  }

  if (req.headers.authorization !== `Bearer ${TOKEN}` || !TOKEN) {
    res.writeHead(401);
    return res.end('Unauthorized');
  }

  if (req.method === 'POST' && req.url === '/render') {
    if (job === 'running') {
      res.writeHead(409);
      return res.end('Render already running');
    }

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    job = 'running';
    log = '';
    res.writeHead(202, { 'Content-Type': 'text/plain' });
    res.end('Render started. Check /status');

    const child = spawn('npx', [
      'hyperframes', 'render',
      '--low-memory-mode', '--workers', '1', '--fps', '15', '--resume', '--keep-segments',
      '--output', OUT
    ], { cwd: __dirname, env: { ...process.env, HF_SEGMENTED_CAPTURE: 'true' } });

    child.stdout.on('data', d => log += d.toString());
    child.stderr.on('data', d => log += d.toString());
    child.on('error', e => {
      log += e.message;
      job = 'failed';
    });
    child.on('close', code => {
      job = code === 0 && fs.existsSync(OUT) ? 'done' : 'failed';
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('Status: ' + job + '\n' + log.slice(-3000));
  }

  if (req.method === 'GET' && req.url === '/download') {
    if (!fs.existsSync(OUT)) {
      res.writeHead(404);
      return res.end('No rendered video yet');
    }
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-Disposition': 'attachment; filename="saipa-reel.mp4"'
    });
    return fs.createReadStream(OUT).pipe(res);
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => console.log('Server listening on ' + PORT));
