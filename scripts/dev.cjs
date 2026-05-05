#!/usr/bin/env node
// Wrapper that runs Next dev with cwd = schoolerp/.
// Used by .claude/launch.json so preview tools can launch the dev server.
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
process.chdir(root);

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const args = ['dev', ...process.argv.slice(2)];

const child = spawn(process.execPath, [nextBin, ...args], {
  stdio: 'inherit',
  env: process.env,
  cwd: root,
});

child.on('exit', (code) => process.exit(code ?? 0));
