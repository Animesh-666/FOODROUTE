import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scaffold-manifest.json'), 'utf8'));
const errors = [];
for (const item of manifest.files) {
  const full = path.resolve(root, item.path);
  if (!full.startsWith(root + path.sep)) { errors.push(`Unsafe path: ${item.path}`); continue; }
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) errors.push(`Missing file: ${item.path}`);
  else if (item.path.endsWith('.json')) {
    try { JSON.parse(fs.readFileSync(full, 'utf8')); } catch { errors.push(`Invalid JSON: ${item.path}`); }
  }
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const ws of pkg.workspaces) {
  if (!fs.existsSync(path.join(root, ws, 'package.json'))) errors.push(`Missing workspace: ${ws}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Structure OK: ${manifest.files.length} files, ${pkg.workspaces.length} workspaces. Application implementation is pending.`);
