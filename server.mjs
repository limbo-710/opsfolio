import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = process.cwd();
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.txt':'text/plain; charset=utf-8' };
const insideRoot = (file) => file === root || file.startsWith(root + sep);
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const primary = resolve(root, relative);
    if (!insideRoot(primary)) { res.writeHead(403).end('Forbidden'); return; }
    let file = primary;
    try { await stat(file); } catch {
      file = resolve(root, 'public', relative);
      if (!insideRoot(file)) { res.writeHead(403).end('Forbidden'); return; }
    }
    try { if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html'); } catch {}
    if (!insideRoot(file)) { res.writeHead(403).end('Forbidden'); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options':'nosniff' });
    res.end(body);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }).end('Not found'); }
});
const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => console.log(`Portfolio server listening on ${port}`));
