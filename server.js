const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const TOKEN = process.env.RENDER_TOKEN || '';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    return res.end('ok');
  }

  if (req.method === 'POST' && req.url === '/render') {
    if (!TOKEN || req.headers.authorization !== `Bearer ${TOKEN}`) {
      res.writeHead(401);
      return res.end('Unauthorized');
    }

    const output = path.join(__dirname, 'renders', 'saipa-reel.mp4');
    fs.mkdirSync(path.dirname(output), { recursive: true });

    const child = spawn('npx', [
      'hyperframes', 'render',
      '--low-memory-mode',
      '--workers', '1',
      '--output', output
    ], { cwd: __dirname });

    let log = '';
    child.stdout.on('data', d => log += d.toString());
    child.stderr.on('data', d => log += d.toString());

    child.on('close', code => {
      if (code === 0 && fs.existsSync(output)) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Render complete: ' + output);
      } else {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('Render failed:\n' + log.slice(-5000));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on ${PORT}`);
});
