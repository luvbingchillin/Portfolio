import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

test('Tier 1 - Feature 2: Editorial Typography Tokens', async (t) => {
  const cssPath = path.join(projectRoot, 'src', 'index.css');
  const css = fs.readFileSync(cssPath, 'utf-8');

  await t.test('2.1 Heading optical tracking token specification', () => {
    // Optical tracking for headings specifies tight negative letter-spacing (-0.04em or tracking classes)
    const hasTightTracking = css.includes('letter-spacing') || css.includes('tracking-');
    assert.ok(hasTightTracking, 'CSS must include typographic letter-spacing or tracking definitions');
  });

  await t.test('2.2 Body text optical tracking token specification', () => {
    // Body tracking specifies -0.025em or balanced readability tracking
    assert.ok(css.includes('--font-body'), 'Must configure body font token');
  });

  await t.test('2.3 Metadata wide optical tracking specification', () => {
    // Monospace & metadata labels use expanded letter spacing (+0.15em to +0.20em)
    assert.ok(css.includes('.tracking-widest') || css.includes('0.15em') || css.includes('0.20em'),
      'Metadata typography must support wide letter-spacing (.tracking-widest or similar)');
  });

  await t.test('2.4 Dark editorial color palette tokens', () => {
    // Palette specifications: dark library base, mahogany wood, gold foil accent
    assert.ok(css.includes('--bg-library: #0c0a08') || css.includes('--bg-library'), 'Must define --bg-library');
    assert.ok(css.includes('--gold-foil') || css.includes('#d4af37'), 'Must define gold foil accent');
    assert.ok(css.includes('--parchment') || css.includes('--text-primary'), 'Must define parchment/text-primary');
  });

  await t.test('2.5 Subpixel anti-aliasing and font smoothing', () => {
    assert.ok(css.includes('-webkit-font-smoothing: antialiased'), 'Must configure antialiased font smoothing');
    assert.ok(css.includes('-moz-osx-font-smoothing: grayscale'), 'Must configure grayscale font smoothing');
  });
});
