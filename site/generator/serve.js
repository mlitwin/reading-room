import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';
import { build } from './build.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const CONTENT_DIR = path.join(ROOT, 'content');
const READER_DIR = path.resolve(__dirname, '..', 'reader');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const PORT = Number(process.env.PORT ?? 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
};

let rebuilding = false;
let pending = false;

async function rebuild() {
  if (rebuilding) { pending = true; return; }
  rebuilding = true;
  try {
    const start = Date.now();
    await build();
    console.log(`rebuilt in ${Date.now() - start}ms`);
  } catch (err) {
    console.error('build failed:', err);
  } finally {
    rebuilding = false;
    if (pending) { pending = false; rebuild(); }
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filePath = path.join(DOCS_DIR, pathname);
    if (!filePath.startsWith(DOCS_DIR)) { res.writeHead(403); res.end('forbidden'); return; }
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile()) { res.writeHead(404); res.end('not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    createReadStream(filePath).pipe(res);
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
});

await build();

server.listen(PORT, () => {
  console.log(`serving ${path.relative(ROOT, DOCS_DIR)} at http://localhost:${PORT}`);
});

chokidar.watch([CONTENT_DIR, READER_DIR, TEMPLATES_DIR], { ignoreInitial: true })
  .on('all', (event, file) => {
    console.log(`change: ${path.relative(ROOT, file)} (${event})`);
    rebuild();
  });
