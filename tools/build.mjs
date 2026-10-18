import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
await import('./render-sites.mjs');
await import('./render-guides.mjs');
const root = resolve(import.meta.dirname,'..');
await import('./build-pages.mjs');
