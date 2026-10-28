import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

test('Tier 2 - Feature 12 Boundary: Build, Lint & Environment Integrity', async (t) => {
  await t.test('B12.1 Node.js environment version check (>=20)', () => {
    const majorVersion = parseInt(process.versions.node.split('.')[0], 10);
    assert.ok(majorVersion >= 20, `Node.js major version must be >= 20, was ${majorVersion}`);
  });

  await t.test('B12.2 Vite configuration build settings', () => {
    const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
    assert.ok(fs.existsSync(viteConfigPath), 'vite.config.ts must exist');
    const content = fs.readFileSync(viteConfigPath, 'utf-8');
    assert.ok(content.includes('defineConfig'), 'vite.config.ts must export defineConfig');
    assert.ok(content.includes('@vitejs/plugin-react'), 'vite.config.ts must configure react plugin');
  });

  await t.test('B12.3 Gitignore excludes build artifacts and node_modules', () => {
    const gitignorePath = path.join(projectRoot, '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist');
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    assert.ok(content.includes('node_modules'), '.gitignore must ignore node_modules');
    assert.ok(content.includes('dist'), '.gitignore must ignore dist');
  });

  await t.test('B12.4 TypeScript app configuration strictness', () => {
    const tsconfigAppPath = path.join(projectRoot, 'tsconfig.app.json');
    const rawContent = fs.readFileSync(tsconfigAppPath, 'utf-8');
    const cleanJson = rawContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    const tsconfig = JSON.parse(cleanJson);
    assert.strictEqual(tsconfig.compilerOptions.noEmit, true, 'noEmit must be true for Vite bundler mode');
    assert.strictEqual(tsconfig.compilerOptions.jsx, 'react-jsx', 'jsx must be react-jsx');
  });

  await t.test('B12.5 Dist index.html asset tags well-formedness', () => {
    const distIndex = path.join(projectRoot, 'dist', 'index.html');
    const html = fs.readFileSync(distIndex, 'utf-8');
    // Verify script tags have type="module"
    assert.match(html, /<script type="module"/i, 'Bundled scripts must use type="module"');
    // Verify stylesheet link tag
    assert.match(html, /<link rel="stylesheet"/i, 'Bundled CSS must be linked');
  });
});
