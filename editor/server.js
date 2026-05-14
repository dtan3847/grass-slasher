'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const WORLD_DATA = path.join(__dirname, '..', 'src', 'world-data.json');
const EDITOR_HTML = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    fs.readFile(EDITOR_HTML, (err, data) => {
      if (err) { res.writeHead(500); res.end('Internal error'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/world-data.json') {
    fs.readFile(WORLD_DATA, (err, data) => {
      if (err) { res.writeHead(500); res.end('Internal error'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/src/sprites.js') {
    const spritesPath = path.join(__dirname, '..', 'src', 'sprites.js');
    fs.readFile(spritesPath, (err, data) => {
      if (err) { res.writeHead(500); res.end('Internal error'); return; }
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(data);
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
        return;
      }
      const out = JSON.stringify(parsed, null, 2);
      fs.writeFile(WORLD_DATA, out, 'utf8', err => {
        if (err) { res.writeHead(500); res.end('Write error'); return; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Map editor server running at http://localhost:${PORT}`);
});
