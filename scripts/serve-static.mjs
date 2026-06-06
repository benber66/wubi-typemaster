#!/usr/bin/env node
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const root = process.argv[2] || 'out/renderer-test';
const port = parseInt(process.argv[3] || '5173', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

async function tryRead(p) {
  try {
    const s = await stat(p);
    if (s.isFile()) return { ok: true, path: p };
  } catch {}
  return { ok: false };
}

const server = http.createServer(async (req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // Block path traversal
  const safe = normalize(urlPath).replace(/^([\\/])+/, '');
  if (safe.includes('..')) {
    res.writeHead(403).end('forbidden');
    return;
  }

  const hasExt = extname(safe) !== '';
  const candidates = [
    join(root, safe),
    join(root, safe, 'index.html'),
  ];
  for (const c of candidates) {
    const r = await tryRead(c);
    if (r.ok) {
      const ext = extname(r.path).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      const body = await readFile(r.path);
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
      res.end(body);
      return;
    }
  }

  // SPA fallback: paths without extension → index.html
  if (!hasExt) {
    const r = await tryRead(join(root, 'index.html'));
    if (r.ok) {
      const body = await readFile(r.path);
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
      res.end(body);
      return;
    }
  }
  res.writeHead(404).end('not found');
});

server.listen(port, () => {
  console.log(`[serve] http://localhost:${port} (root: ${root})`);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
