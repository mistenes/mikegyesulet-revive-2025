#!/usr/bin/env node
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const viteBin = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');

if (existsSync(viteBin)) {
  process.exit(0);
}

console.error('[build] Vite binary not found, installing dependencies...');
try {
  execSync('npm install --include=dev --no-progress', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NPM_CONFIG_FUND: 'false',
      NPM_CONFIG_AUDIT: 'false',
    },
  });
} catch (error) {
  console.error('[build] Failed to install dependencies needed for Vite.');
  process.exit(1);
}

if (!existsSync(viteBin)) {
  console.error('[build] Vite binary still missing after install.');
  process.exit(1);
}
