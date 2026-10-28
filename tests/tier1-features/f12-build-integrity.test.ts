import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

test('Tier 1 - Feature 12: Build, Lint & Bundle Integrity', async (t) => {
  await t.test('12.1 package.json dependencies and scripts integrity', () => {
    const pkgPath = path.join(projectRoot, 'package.json');
    assert.ok(fs.existsSync(pkgPath), 'package.json must exist');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    assert.ok(pkg.scripts?.build, 'Must define npm run build');
    assert.ok(pkg.scripts?.lint, 'Must define npm run lint');
    assert.ok(pkg.dependencies?.three, 'Must include three.js dependency');
    assert.ok(pkg.dependencies?.react, 'Must include react dependency');
  });

  await t.test('12.2 TypeScript configuration files validation', () => {
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    const tsconfigAppPath = path.join(projectRoot, 'tsconfig.app.json');
    assert.ok(fs.existsSync(tsconfigPath), 'tsconfig.json must exist');
    assert.ok(fs.existsSync(tsconfigAppPath), 'tsconfig.app.json must exist');
  });

  await t.test('12.3 Oxlint configuration validation', () => {
    const oxlintrcPath = path.join(projectRoot, '.oxlintrc.json');
    assert.ok(fs.existsSync(oxlintrcPath), '.oxlintrc.json must exist');
  });

  await t.test('12.4 Production dist artifacts entry check', () => {
    const distIndex = path.join(projectRoot, 'dist', 'index.html');
    assert.ok(fs.existsSync(distIndex), 'dist/index.html must exist from build');
    const html = fs.readFileSync(distIndex, 'utf-8');
    assert.ok(html.includes('<div id="root">'), 'dist/index.html must contain root mount element');
  });

  await t.test('12.5 Production bundled assets check', () => {
    const assetsDir = path.join(projectRoot, 'dist', 'assets');
    assert.ok(fs.existsSync(assetsDir), 'dist/assets directory must exist');
    const files = fs.readdirSync(assetsDir);
    const hasJs = files.some(f => f.endsWith('.js'));
    const hasCss = files.some(f => f.endsWith('.css'));
    assert.ok(hasJs, 'dist/assets must contain bundled JS');
    assert.ok(hasCss, 'dist/assets must contain bundled CSS');
  });
});
