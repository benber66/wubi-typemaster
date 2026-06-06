// 静态文件服务器（仅用于本地预览 Storybook）
// 使用方法：node scripts/serve-storybook.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

const PORT = Number(process.argv[2] || 6006);
const ROOT = resolve(process.cwd(), 'storybook-static');

if (!existsSync(ROOT)) {
  console.error(`[serve-storybook] 目录不存在: ${ROOT}`);
  console.error('请先运行: pnpm build-storybook');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';

    // 安全检查：禁止越出 ROOT
    const filePath = join(ROOT, path);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    try {
      const s = await stat(filePath);
      if (s.isDirectory()) {
        // 尝试 /<dir>/index.html
        const idx = join(filePath, 'index.html');
        if (existsSync(idx)) {
          const data = await readFile(idx);
          res.writeHead(200, { 'Content-Type': MIME['.html'] });
          res.end(data);
          return;
        }
      }
      const data = await readFile(filePath);
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    } catch {
      // SPA fallback
      const fallback = join(ROOT, 'index.html');
      if (existsSync(fallback)) {
        const data = await readFile(fallback);
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(data);
        return;
      }
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});

server.listen(PORT, () => {
  console.log(`[serve-storybook] http://localhost:${PORT}/`);
  console.log('  预览 Pages/HomePage / SettingsPage / KeyboardPage 等 27 stories');
  console.log('  Ctrl+C 退出');
});
