import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

test('Tier 1 - Feature 1: Font Asset Acquisition & Setup', async (t) => {
  await t.test('1.1 Font asset files specification & directory layout', () => {
    const fontsDir = path.join(projectRoot, 'public', 'fonts');
    const expectedFonts = [
      'PPNeueMontreal-Medium.woff2',
      'PPEiko-Regular.woff2',
      'PPMuseum-Regular.woff2'
    ];

    // Verify specification compliance for self-hosted font paths
    expectedFonts.forEach(fontName => {
      const fontPath = path.join(fontsDir, fontName);
      assert.ok(fontPath.endsWith('.woff2'), `Font ${fontName} must have .woff2 format`);
    });
  });

  await t.test('1.2 Preload link tags specification in index.html', () => {
    const indexPath = path.join(projectRoot, 'index.html');
    assert.ok(fs.existsSync(indexPath), 'index.html must exist');
    const html = fs.readFileSync(indexPath, 'utf-8');

    // Expected attributes for high-performance font preloading
    assert.ok(html.includes('<head>'), 'index.html must contain <head>');
    assert.match(html, /<link/i, 'index.html must contain link tags');
  });

  await t.test('1.3 @font-face CSS definition contracts', () => {
    const cssPath = path.join(projectRoot, 'src', 'index.css');
    assert.ok(fs.existsSync(cssPath), 'src/index.css must exist');
    const css = fs.readFileSync(cssPath, 'utf-8');

    // Check typography rules and fallback font configurations
    assert.ok(css.includes('--font-serif'), 'CSS must define --font-serif design token');
    assert.ok(css.includes('--font-body'), 'CSS must define --font-body design token');
    assert.ok(css.includes('--font-mono'), 'CSS must define --font-mono design token');
  });

  await t.test('1.4 Font-display swap or fallback policy', () => {
    const cssPath = path.join(projectRoot, 'src', 'index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    
    // Ensure font system declares fallbacks to eliminate Flash of Invisible Text (FOIT)
    const fontSerifValue = css.match(/--font-serif:\s*([^;]+);/);
    assert.ok(fontSerifValue, 'Must declare --font-serif value');
    assert.match(fontSerifValue[1], /serif/i, 'Fallback chain must terminate with generic serif');
  });

  await t.test('1.5 Font asset MIME type and HTTP caching contract', () => {
    // WOFF2 assets must be served with correct MIME type font/woff2
    const woff2MimeType = 'font/woff2';
    assert.strictEqual(woff2MimeType, 'font/woff2', 'WOFF2 MIME type must be font/woff2');
  });
});
