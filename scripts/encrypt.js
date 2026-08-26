#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const password = process.env.STATICRYPT_PASSWORD || 'austria2026';
const source = path.join(root, 'index.source.html');
const outDir = path.join(root, 'encrypted');
const published = path.join(root, 'index.html');
const staticryptBin = path.join(root, 'node_modules', 'staticrypt', 'cli', 'index.js');

if (!fs.existsSync(source)) {
  console.error('Brak pliku index.source.html');
  process.exit(1);
}

const args = [
  staticryptBin,
  source,
  '-p', password,
  '-d', outDir,
  '--short',
  '--remember', '7',
  '--template-title', 'Austria Trip Planner - Demo',
  '--template-instructions', 'Podaj has\u0142o, aby otworzy\u0107 demo planera podr\u00f3\u017cy.',
  '--template-button', 'Wejd\u017a',
  '--template-placeholder', 'Has\u0142o',
  '--template-error', 'Nieprawid\u0142owe has\u0142o.'
];

const result = spawnSync(process.execPath, args, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS || '--use-system-ca' }
});

if (result.status !== 0) process.exit(result.status || 1);

const encrypted = path.join(outDir, 'index.source.html');
fs.copyFileSync(encrypted, published);
console.log('Zaszyfrowano: index.source.html -> index.html (StatiCrypt)');
