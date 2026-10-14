import { readdir, mkdir, copyFile, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const rootAssets = new Set(['app.js', 'styles.css', 'sw.js', 'manifest.json', 'robots.txt', 'sitemap.xml', 'ads.txt', 'app-ads.txt', '_redirects', '_headers']);
const assetExtension = /\.(?:css|js|json|png|jpe?g|svg|webp|ico|wav|mp3|m4a|woff2?)$/i;
let count = 0;
try {
  const stat = await lstat(output);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('dist must be a generated directory');
  await rm(output, { recursive: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await mkdir(output);
async function copyAsset(relative) {
  const destination = path.join(output, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(root, relative), destination);
  count += 1;
}
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && (entry.name.endsWith('.html') || rootAssets.has(entry.name))) {
    await copyAsset(entry.name);
  }
}
async function copyPublicAssets(relative) {
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) await copyPublicAssets(next);
    else if (entry.isFile() && assetExtension.test(entry.name)) await copyAsset(next);
  }
}
await copyPublicAssets('assets');
console.log(`Built ${count} public website assets in dist/`);
