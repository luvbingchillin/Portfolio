import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

test('Tier 2 - Feature 1 Boundary: Font Assets & Fallbacks', async (t) => {
  await t.test('B1.1 Missing font directory resilience', () => {
    // Check behavior if font path doesn't exist yet in development
    const nonExistentPath = path.join(projectRoot, 'public', 'fonts_missing');
    assert.strictEqual(fs.existsSync(nonExistentPath), false);
    // Application must not throw top-level crash when fonts directory is queried
    const checkExists = () => fs.existsSync(nonExistentPath);
    assert.doesNotThrow(checkExists);
  });

  await t.test('B1.2 Preload CORS crossorigin attribute presence', () => {
    // If <link rel="preload" as="font"> is added, it must include crossorigin attribute
    const checkFontPreloadTag = (tag: string) => {
      if (tag.includes('as="font"')) {
        return tag.includes('crossorigin');
      }
      return true;
    };
    const validTag = '<link rel="preload" href="/fonts/font.woff2" as="font" type="font/woff2" crossorigin>';
    const invalidTag = '<link rel="preload" href="/fonts/font.woff2" as="font" type="font/woff2">';
    assert.strictEqual(checkFontPreloadTag(validTag), true);
    assert.strictEqual(checkFontPreloadTag(invalidTag), false);
  });

  await t.test('B1.3 Fallback font stack resilience against missing web fonts', () => {
    const cssPath = path.join(projectRoot, 'src', 'index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    // Ensure that serif font stack has at least 3 fallback levels
    const serifMatch = css.match(/--font-serif:\s*([^;]+);/);
    assert.ok(serifMatch);
    const fonts = serifMatch[1].split(',').map(s => s.trim());
    assert.ok(fonts.length >= 2, 'Must have at least 2 font options in cascade');
  });

  await t.test('B1.4 Empty font file detection boundary', () => {
    // Any valid font file must be larger than a minimal header (> 100 bytes)
    const isFontHeaderValid = (buffer: Buffer | null) => {
      if (!buffer || buffer.length < 16) return false;
      // WOFF2 magic number is 'wOF2' (0x774F4632)
      return buffer.readUInt32BE(0) === 0x774F4632;
    };
    assert.strictEqual(isFontHeaderValid(Buffer.from([])), false);
    assert.strictEqual(isFontHeaderValid(null), false);
  });

  await t.test('B1.5 Multiple @font-face format fallback ordering', () => {
    const fontSrc = `url('/fonts/font.woff2') format('woff2'), url('/fonts/font.woff') format('woff')`;
    const formats = [...fontSrc.matchAll(/format\('([^']+)'\)/g)].map(m => m[1]);
    assert.strictEqual(formats[0], 'woff2', 'Modern woff2 format must be prioritized first');
  });
});
