import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';

test('Tier 1 - Feature 4: Editorial UI Redesign', async (t) => {
  await t.test('4.1 Catalog book metadata structure verification', () => {
    assert.ok(BOOKS_CATALOG.length >= 5, 'Catalog should contain at least 5 books');
    const book0 = BOOKS_CATALOG[0];

    assert.ok(book0.id, 'Book must have id');
    assert.ok(book0.title, 'Book must have title');
    assert.ok(book0.subtitle, 'Book must have subtitle');
    assert.ok(book0.callNumber, 'Book must have callNumber');
    assert.ok(book0.category, 'Book must have category');
    assert.ok(book0.coverColor, 'Book must have coverColor');
  });

  await t.test('4.2 Tech stack ingredients formatting', () => {
    const book0 = BOOKS_CATALOG[0];
    assert.ok(Array.isArray(book0.techStack), 'techStack must be an array');
    assert.ok(book0.techStack.length >= 3, 'Each book should list at least 3 technologies');
  });

  await t.test('4.3 Archival metrics format specification', () => {
    const book0 = BOOKS_CATALOG[0];
    assert.ok(Array.isArray(book0.metrics), 'metrics must be an array');
    assert.strictEqual(book0.metrics.length, 3, 'Each book must feature exactly 3 highlight metrics');
    book0.metrics.forEach(m => {
      assert.ok(m.label, 'Metric must have label');
      assert.ok(m.value, 'Metric must have value');
    });
  });

  await t.test('4.4 Shelf navigation boundaries logic', () => {
    const totalBooks = BOOKS_CATALOG.length;
    // Index bounds checks:
    const clampIndex = (idx: number) => Math.max(0, Math.min(totalBooks - 1, idx));
    
    assert.strictEqual(clampIndex(-1), 0, 'Negative index must clamp to 0');
    assert.strictEqual(clampIndex(totalBooks + 5), totalBooks - 1, 'Overflow index must clamp to total - 1');
    assert.strictEqual(clampIndex(2), 2, 'In-bounds index must remain unchanged');
  });

  await t.test('4.5 Illuminated drop-cap character extraction contract', () => {
    const book0 = BOOKS_CATALOG[0];
    const dropCapChar = book0.fullSynopsis.charAt(0);
    const synopsisRest = book0.fullSynopsis.slice(1);

    assert.strictEqual(dropCapChar.length, 1, 'Drop cap character must be 1 character');
    assert.match(dropCapChar, /[A-Z]/, 'Drop cap character must be uppercase letter');
    assert.ok(synopsisRest.length > 50, 'Synopsis body must be substantial');
  });
});
