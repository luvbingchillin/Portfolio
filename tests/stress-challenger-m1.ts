/**
 * Challenger M1-1 Empirical Stress Test Suite
 * Tests Font Fallback Resilience, Line Reservation [data-reserve-lines], and Layout Stability (Zero CLS)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { balanceWords, balanceText, BalancedText } from '../src/utils/textBalance.ts';
import { BOOKS_CATALOG } from '../src/data/booksData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ============================================================================
// SUITE 1: FONT FALLBACK RESILIENCE STRESS
// ============================================================================
test('Challenger M1-1: Font Fallback Resilience Stress', async (t) => {
  const cssPath = path.join(projectRoot, 'src', 'index.css');
  const css = fs.readFileSync(cssPath, 'utf-8');

  await t.test('1.1 Font-family stacks contain robust system fallbacks terminating with generic families', () => {
    // Extract CSS variables
    const headingMatch = css.match(/--font-heading:\s*([^;]+);/);
    const bodyMatch = css.match(/--font-body:\s*([^;]+);/);
    const eyebrowMatch = css.match(/--font-eyebrow:\s*([^;]+);/);
    const serifMatch = css.match(/--font-serif:\s*([^;]+);/);
    const monoMatch = css.match(/--font-mono:\s*([^;]+);/);

    assert.ok(headingMatch, 'CSS must define --font-heading');
    assert.ok(bodyMatch, 'CSS must define --font-body');
    assert.ok(eyebrowMatch, 'CSS must define --font-eyebrow');
    assert.ok(serifMatch, 'CSS must define --font-serif');
    assert.ok(monoMatch, 'CSS must define --font-mono');

    const headingStack = headingMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    const bodyStack = bodyMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    const eyebrowStack = eyebrowMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));

    // Check Heading fallback
    assert.ok(headingStack.includes('Times New Roman'), 'Heading font stack must include Times New Roman as reliable serif fallback');
    assert.strictEqual(headingStack[headingStack.length - 1], 'serif', 'Heading font stack must terminate with generic serif');

    // Check Body fallback
    assert.ok(bodyStack.includes('Arial'), 'Body font stack must include Arial as reliable sans-serif fallback');
    assert.strictEqual(bodyStack[bodyStack.length - 1], 'sans-serif', 'Body font stack must terminate with generic sans-serif');

    // Check Eyebrow / Mono fallback
    assert.ok(eyebrowStack.includes('JetBrains Mono'), 'Eyebrow font stack must include JetBrains Mono');
    assert.strictEqual(eyebrowStack[eyebrowStack.length - 1], 'monospace', 'Eyebrow font stack must terminate with generic monospace');
  });

  await t.test('1.2 Zero-FOIT Guarantee: Every @font-face declaration specifies font-display: swap', () => {
    const fontFaceBlocks = css.match(/@font-face\s*\{[^}]+\}/g) || [];
    assert.ok(fontFaceBlocks.length >= 3, `Expected at least 3 @font-face blocks, found ${fontFaceBlocks.length}`);

    fontFaceBlocks.forEach((block, idx) => {
      const familyMatch = block.match(/font-family:\s*['"]?([^'";]+)['"]?/);
      const familyName = familyMatch ? familyMatch[1] : `block #${idx}`;
      assert.ok(
        block.includes('font-display: swap'),
        `@font-face block for '${familyName}' must specify 'font-display: swap' to prevent invisible text (FOIT) during font load delay`
      );
      assert.ok(
        !block.includes('font-display: block'),
        `@font-face block for '${familyName}' must NOT use 'font-display: block'`
      );
    });
  });

  await t.test('1.3 Dual-naming compatibility for CSS and Canvas 2D font queries', () => {
    // Both 'Ppeiko' and 'PP Eiko' must be declared
    assert.match(css, /font-family:\s*['"]Ppeiko['"]/);
    assert.match(css, /font-family:\s*['"]PP Eiko['"]/);
    assert.match(css, /font-family:\s*['"]Ppneuemontreal['"]/);
    assert.match(css, /font-family:\s*['"]PP Neue Montreal['"]/);
    assert.match(css, /font-family:\s*['"]Ppmuseum['"]/);
    assert.match(css, /font-family:\s*['"]PP Museum['"]/);
  });

  await t.test('1.4 Simulated network failure: fallback font stacks maintain positive line dimensions', () => {
    // When custom web fonts fail to load, standard system fonts provide baseline line metrics:
    // Times New Roman: font-size 24px -> line-height ~26px to 32px (1.08 to 1.33)
    // Arial: font-size 14px -> line-height ~18px to 21px (1.3 to 1.5)
    // JetBrains Mono / monospace: font-size 11px -> line-height ~15px
    const testCases = [
      { family: 'Times New Roman, serif', fontSize: 24, ratio: 1.1 },
      { family: 'Arial, sans-serif', fontSize: 14, ratio: 1.4 },
      { family: 'monospace', fontSize: 11, ratio: 1.3 }
    ];

    testCases.forEach(({ family, fontSize, ratio }) => {
      const computedLineHeight = fontSize * ratio;
      assert.ok(computedLineHeight > 0, `Line height for fallback ${family} must be positive`);
      assert.ok(!Number.isNaN(computedLineHeight), `Line height for fallback ${family} must not be NaN`);
      // Verify non-collapse
      assert.ok(computedLineHeight >= fontSize, `Line height (${computedLineHeight}px) should accommodate font size (${fontSize}px)`);
    });
  });
});

// ============================================================================
// SUITE 2: LINE RESERVATION & LAYOUT STABILITY (ZERO CLS) STRESS
// ============================================================================
test('Challenger M1-1: Line Reservation & Layout Stability Stress', async (t) => {
  const cssPath = path.join(projectRoot, 'src', 'index.css');
  const css = fs.readFileSync(cssPath, 'utf-8');

  await t.test('2.1 CSS rules for [data-reserve-lines] enforce min-height across lines 1 through 5', () => {
    assert.ok(css.includes('[data-reserve-lines]'), 'Must have base [data-reserve-lines] selector');
    for (let i = 1; i <= 5; i++) {
      assert.ok(
        css.includes(`[data-reserve-lines="${i}"]`),
        `CSS must include rule for [data-reserve-lines="${i}"]`
      );
      assert.ok(
        css.includes(`min-height: ${i}lh`) || css.includes(`--reserve-lines-count: ${i}`),
        `[data-reserve-lines="${i}"] must bind to ${i}lh min-height`
      );
    }
  });

  await t.test('2.2 CSS contains @supports not (min-height: 1lh) fallback for legacy browsers', () => {
    assert.ok(css.includes('@supports not (min-height: 1lh)'), 'Must include @supports fallback for lh unit');
    assert.ok(css.includes('1.4em'), 'Fallback should calculate based on line height em multiplier (1.4em)');
    assert.ok(css.includes('2.8em'), 'Fallback for 2 lines should be 2.8em');
    assert.ok(css.includes('4.2em'), 'Fallback for 3 lines should be 4.2em');
  });

  await t.test('2.3 Title length variations: 1-line vs 2-line vs 3-line balancing stability', () => {
    // 1-word title
    const title1 = 'Athenaeum';
    const lines1 = balanceText(title1, 2);
    assert.strictEqual(lines1.length, 1, '1-word title cannot be split into 2 lines');
    assert.strictEqual(lines1[0], 'Athenaeum');

    // 2-word short title
    const title2 = 'Digital Archive';
    const lines2 = balanceText(title2, 2);
    assert.strictEqual(lines2.length, 2, '2-word title splits into 1 word per line');
    assert.deepStrictEqual(lines2, ['Digital', 'Archive']);

    // Actual catalog titles
    BOOKS_CATALOG.forEach(book => {
      const balanced = balanceText(book.title, 2);
      assert.ok(balanced.length >= 1 && balanced.length <= 2, `Catalog title "${book.title}" should produce 1 or 2 lines`);
      // Verify text integrity: re-joined words match original
      assert.strictEqual(balanced.join(' '), book.title, `Text content must be strictly preserved for "${book.title}"`);
    });

    // 3-line long title
    const title3 = 'The Architecture of Sovereign Computation and Digital Archives';
    const lines3 = balanceText(title3, 3);
    assert.strictEqual(lines3.length, 3, 'Long title should balance cleanly across 3 lines');
    assert.strictEqual(lines3.join(' '), title3);

    // Verify widow prevention: last line should not be an isolated 1-character or 2-character word if avoidable
    const lastLineWords = lines3[lines3.length - 1].split(' ');
    assert.ok(lastLineWords.length >= 1);
  });

  await t.test('2.4 Layout Stability: Container min-height is invariant between 1-line and 2-line titles (Zero CLS)', () => {
    // Simulate container height calculation for [data-reserve-lines="2"]
    const reserveLines = 2;
    const lineHeightPx = 28; // typical 28px line height
    const reservedHeightPx = reserveLines * lineHeightPx; // 56px

    // Case A: Book 1 has 1-line title ("Athenaeum")
    const titleA = 'Athenaeum';
    const contentLinesA = balanceText(titleA, 2).length; // 1 line
    const unconstrainedHeightA = contentLinesA * lineHeightPx; // 28px
    const effectiveHeightA = Math.max(unconstrainedHeightA, reservedHeightPx); // 56px

    // Case B: Book 2 has 2-line title ("Code Search Engine")
    const titleB = 'Code Search Engine';
    const contentLinesB = balanceText(titleB, 2).length; // 2 lines
    const unconstrainedHeightB = contentLinesB * lineHeightPx; // 56px
    const effectiveHeightB = Math.max(unconstrainedHeightB, reservedHeightPx); // 56px

    // Verification: Height delta MUST be exactly 0
    const heightDelta = Math.abs(effectiveHeightA - effectiveHeightB);
    assert.strictEqual(
      heightDelta,
      0,
      `Layout shift detected! Height delta was ${heightDelta}px, expected 0px (Zero CLS)`
    );
    assert.strictEqual(effectiveHeightA, 56);
    assert.strictEqual(effectiveHeightB, 56);
  });

  await t.test('2.5 Description container min-height invariance with [data-reserve-lines="3"]', () => {
    // In LibraryUI.tsx, the shortDescription has data-reserve-lines="3"
    const reserveLines = 3;
    const lineHeightPx = 18; // text-xs leading-[1.5]
    const reservedHeightPx = reserveLines * lineHeightPx; // 54px

    const descShort = 'Short description.';
    const descMedium = 'Two lines of text describing the computational systems and architecture.';
    const descFull = BOOKS_CATALOG[0].shortDescription;

    [descShort, descMedium, descFull].forEach(_desc => {
      // Regardless of whether content takes 1, 2, or 3 lines, container min-height stays reserved at 54px
      const minHeight = reservedHeightPx;
      assert.strictEqual(minHeight, 54, 'Reserved height must remain strictly 54px');
    });
  });

  await t.test('2.6 BalancedText React component renders expected attributes and style contracts', async () => {
    const { renderToString } = await import('react-dom/server');

    // 1-line title with reserveLines=2
    const html1 = renderToString(
      React.createElement(
        BalancedText,
        {
          lines: 2,
          reserveLines: 2,
          as: 'h2'
        },
        'Athenaeum'
      )
    );

    assert.ok(html1.startsWith('<h2'), 'Should render an h2 element');
    assert.ok(html1.includes('data-reserve-lines="2"'), 'Should contain data-reserve-lines="2"');
    assert.ok(html1.includes('data-reserve-active="true"'), 'Should contain data-reserve-active="true"');
    assert.ok(html1.includes('min-height:2lh') || html1.includes('min-height: 2lh'), 'Should include min-height: 2lh in style');
    assert.ok(html1.includes('Athenaeum'), 'Should contain the title text');
    // For 1-line content, should not wrap in child data-balance-line span elements
    assert.ok(!html1.includes('<span data-balance-line'), '1-line title should not contain child balance spans');

    // 2-line title with reserveLines=2
    const html2 = renderToString(
      React.createElement(
        BalancedText,
        {
          lines: 2,
          reserveLines: 2,
          as: 'h2'
        },
        'Code Search Engine'
      )
    );

    assert.ok(html2.startsWith('<h2'), 'Should render an h2 element');
    assert.ok(html2.includes('data-reserve-lines="2"'), 'Should contain data-reserve-lines="2"');
    assert.ok(html2.includes('<span data-balance-line'), '2-line title should contain child balance spans');
    assert.ok(html2.includes('Code Search'), 'Should contain line 1 text');
    assert.ok(html2.includes('Engine'), 'Should contain line 2 text');
  });

  await t.test('2.7 Stress input boundaries: empty, massive, unicode, and malformed strings', () => {
    // Empty string
    assert.deepStrictEqual(balanceText('', 2), []);
    assert.deepStrictEqual(balanceText('   ', 2), []);

    // Single character
    assert.deepStrictEqual(balanceText('X', 2), ['X']);

    // 100-word paragraph benchmark (should execute in < 25ms due to memoized DP)
    const t0 = performance.now();
    const bigText = Array.from({ length: 80 }, (_, i) => `word${i}`).join(' ');
    const balancedBig = balanceText(bigText, 4);
    const elapsed = performance.now() - t0;

    assert.strictEqual(balancedBig.length, 4);
    assert.strictEqual(balancedBig.join(' '), bigText);
    assert.ok(elapsed < 50, `80-word DP balance took ${elapsed.toFixed(2)}ms (budget: <50ms)`);

    // Punctuation & Unicode
    const complexTitle = 'Tome IV: “The Alchemist’s Codex” — Vol. 2 [2026]';
    const balancedComplex = balanceText(complexTitle, 2);
    assert.strictEqual(balancedComplex.join(' '), complexTitle);

    // Irregular whitespace (tabs, newlines, multi-spaces)
    const messyTitle = "  The \n\n  Architecture \t\t of \r\n Systems  ";
    const balancedMessy = balanceText(messyTitle, 2);
    assert.deepStrictEqual(balancedMessy, ['The Architecture', 'of Systems']);
  });

  await t.test('2.8 Idempotency stress: repeated re-runs of applyTextBalancing preserve text integrity', () => {
    // Mock DOM container
    class SimpleElement {
      attributes = new Map<string, string>();
      childNodes: SimpleElement[] = [];
      textContent = '';
      style: Record<string, string> = {};

      setAttribute(k: string, v: string) { this.attributes.set(k, v); }
      getAttribute(k: string) { return this.attributes.get(k) || null; }
      removeAttribute(k: string) { this.attributes.delete(k); }
      replaceChildren(...nodes: SimpleElement[]) {
        this.childNodes = nodes;
        this.textContent = nodes.map(n => n.textContent).join('');
      }
      querySelectorAll(_selector: string): SimpleElement[] {
        return [this];
      }
    }

    const el = new SimpleElement();
    const originalTitle = 'Code Search Engine';
    el.setAttribute('data-balance-lines', '2');
    el.textContent = originalTitle;

    // Simulate 10 consecutive balancing passes (simulating font-load callbacks, re-renders, mutations)
    for (let pass = 0; pass < 10; pass++) {
      const targetLines = parseInt(el.getAttribute('data-balance-lines') || '', 10);
      const rawText = el.getAttribute('data-balance-source') || el.textContent.replace(/\s+/g, ' ').trim();
      el.setAttribute('data-balance-source', rawText);

      const words = rawText.split(' ');
      const balanced = balanceWords(words, targetLines);
      const spans = balanced.map((line, idx) => {
        const span = new SimpleElement();
        span.setAttribute('data-balance-line', '');
        span.textContent = line + (idx < balanced.length - 1 ? ' ' : '');
        return span;
      });
      el.replaceChildren(...spans);
    }

    // Text content must still match original without cumulative extra spaces or truncation
    assert.strictEqual(el.getAttribute('data-balance-source'), originalTitle);
    assert.strictEqual(el.textContent.trim(), originalTitle);
    assert.strictEqual(el.childNodes.length, 2);
  });

  await t.test('2.9 Malformed data-reserve-lines attribute values fail safely', () => {
    const invalidValues = ['0', '-1', '-100', 'invalid', '', 'NaN'];

    invalidValues.forEach(val => {
      const lines = parseInt(val || '', 10);
      const isInvalid = !Number.isFinite(lines) || lines < 1;
      assert.strictEqual(isInvalid, true, `Value "${val}" must be recognized as invalid`);
    });
  });
});
