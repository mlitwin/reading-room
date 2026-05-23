// Orchestrator: run every figure script under `<book>/` and write its stdout
// into `content/<book>/figures/<name>.svg`. Determinism is the contract — the
// SVGs are committed and consumed by the site generator.

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// svg-gen serializes back-face clipping as inline
// `clip-path="polygon(...) view-box"` attributes — a CSS-style form that
// Safari and WKWebView silently drop. Rewrite each occurrence as a
// `<clipPath>` element in defs + `clip-path="url(#cp-N)"` reference, which
// every browser supports. Per-element since the polygon depends on each
// ellipse's local transform.
function rewriteInlineClipPaths(svg) {
  const inline = /clip-path="polygon\(([^)]*)\)\s*view-box"/g;
  const clipPathEls = [];
  let counter = 0;
  const rewritten = svg.replace(inline, (_match, pointsRaw) => {
    counter += 1;
    const id = `cp-${counter}`;
    const points = pointsRaw
      .split(',')
      .map(pt => pt.trim().replace(/px/g, ''))
      .join(' ');
    clipPathEls.push(
      `<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><polygon points="${points}"/></clipPath>`
    );
    return `clip-path="url(#${id})"`;
  });
  if (clipPathEls.length === 0) return svg;
  const defsBlock = clipPathEls.join('\n    ');
  if (/<defs>/.test(rewritten)) {
    return rewritten.replace('<defs>', `<defs>\n    ${defsBlock}`);
  }
  return rewritten.replace(/<svg([^>]*)>/, `<svg$1>\n  <defs>\n    ${defsBlock}\n  </defs>`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_DIR = path.join(ROOT, 'content');

async function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], { stdio: ['ignore', 'pipe', 'inherit'] });
    const chunks = [];
    child.stdout.on('data', c => chunks.push(c));
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) return reject(new Error(`${scriptPath} exited ${code}`));
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });
}

async function main() {
  const bookDirs = (await fs.readdir(__dirname, { withFileTypes: true }))
    .filter(e => e.isDirectory() && e.name !== 'shared' && e.name !== 'node_modules')
    .map(e => e.name);

  let total = 0;
  for (const book of bookDirs) {
    const scriptDir = path.join(__dirname, book);
    const outDir = path.join(CONTENT_DIR, book, 'figures');
    await fs.mkdir(outDir, { recursive: true });
    const scripts = (await fs.readdir(scriptDir))
      .filter(n => n.endsWith('.js'))
      .sort();
    for (const script of scripts) {
      const raw = await runScript(path.join(scriptDir, script));
      const svg = rewriteInlineClipPaths(raw);
      const outFile = path.join(outDir, script.replace(/\.js$/, '.svg'));
      await fs.writeFile(outFile, svg);
      total++;
    }
  }
  console.log(`Wrote ${total} figure(s).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
