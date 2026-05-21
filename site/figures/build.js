// Orchestrator: run every figure script under `<book>/` and write its stdout
// into `content/<book>/figures/<name>.svg`. Determinism is the contract — the
// SVGs are committed and consumed by the site generator.

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
      const svg = await runScript(path.join(scriptDir, script));
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
