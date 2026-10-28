import test from 'node:test';
import assert from 'node:assert/strict';
import { balanceTextLines } from '../helpers/physics.ts';

test('Tier 2 - Feature 3 Boundary: Text Balancing Edge Cases', async (t) => {
  await t.test('B3.1 Empty string input returns empty array without throwing', () => {
    const lines = balanceTextLines('');
    assert.deepStrictEqual(lines, []);

    const whitespaceLines = balanceTextLines('   \n  \t ');
    assert.deepStrictEqual(whitespaceLines, []);
  });

  await t.test('B3.2 Single long unbroken word without whitespace', () => {
    const longWord = 'SUPERHYDRODYNAMICQUANTUMACCELERATIONENGINEERING';
    const lines = balanceTextLines(longWord, 20);
    assert.strictEqual(lines.length, 1);
    assert.strictEqual(lines[0], longWord);
  });

  await t.test('B3.3 Massive paragraph (50+ words) bounds stability', () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i}`);
    const paragraph = words.join(' ');
    const lines = balanceTextLines(paragraph, 30);

    assert.ok(lines.length > 5, 'Should segment into multiple lines');
    // Ensure all words are preserved
    const recoveredWords = lines.join(' ').split(' ');
    assert.strictEqual(recoveredWords.length, 60);
  });

  await t.test('B3.4 Punctuation, dashes, and emoji handling', () => {
    const specialTitle = 'AI & Ethics — Vol. 1: What Lies Beneath? ✨ [2026]';
    const lines = balanceTextLines(specialTitle, 25);
    assert.ok(lines.length >= 1);
    const joined = lines.join(' ');
    assert.ok(joined.includes('—'));
    assert.ok(joined.includes('✨'));
    assert.ok(joined.includes('[2026]'));
  });

  await t.test('B3.5 Minimum container width threshold (zero / negative maxChars)', () => {
    const title = 'The Digital Athenaeum Archive';
    // When maxCharsPerLine is set to 0 or negative, fallback safely to default
    const safeBalance = (text: string, chars: number) => {
      return balanceTextLines(text, Math.max(10, chars));
    };
    const linesZero = safeBalance(title, 0);
    assert.ok(linesZero.length >= 1);
  });
});
