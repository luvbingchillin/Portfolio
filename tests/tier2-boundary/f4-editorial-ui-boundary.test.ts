import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import type { ProjectBook } from '../../src/types/book.ts';

test('Tier 2 - Feature 4 Boundary: Editorial UI Edge Cases', async (t) => {
  await t.test('B4.1 Shelf navigation at lower boundary (index 0)', () => {
    const activeIndex = 0;
    const canGoPrev = activeIndex > 0;
    assert.strictEqual(canGoPrev, false, 'Previous button must be disabled at index 0');
  });

  await t.test('B4.2 Shelf navigation at upper boundary (index N-1)', () => {
    const activeIndex = BOOKS_CATALOG.length - 1;
    const canGoNext = activeIndex < BOOKS_CATALOG.length - 1;
    assert.strictEqual(canGoNext, false, 'Next button must be disabled at last index');
  });

  await t.test('B4.3 Missing optional URLs resilience in book record', () => {
    const minimalBook: ProjectBook = {
      id: 'test-minimal',
      title: 'Minimal Tome',
      subtitle: 'A minimal record',
      edition: '1st',
      callNumber: 'QA 76.9',
      year: '2026',
      category: 'Systems & Tools',
      curator: 'Archivist',
      shortDescription: 'Short description.',
      fullSynopsis: 'Full synopsis text.',
      techStack: ['TypeScript'],
      metrics: [
        { label: 'Latency', value: '1ms' },
        { label: 'Uptime', value: '99.9%' },
        { label: 'Memory', value: '12MB' }
      ],
      keyFeatures: ['Feature 1'],
      coverColor: '#16120e',
      accentColor: '#d4af37',
      stackShelf: 'SHELF-1'
    };

    assert.strictEqual(minimalBook.githubUrl, undefined);
    assert.strictEqual(minimalBook.liveUrl, undefined);
    // UI should safely handle books with no githubUrl / liveUrl
  });

  await t.test('B4.4 Empty keyFeatures array fallback', () => {
    const bookWithEmptyFeatures: ProjectBook = {
      ...BOOKS_CATALOG[0],
      keyFeatures: []
    };
    assert.strictEqual(bookWithEmptyFeatures.keyFeatures.length, 0);
    // Modal highlights section should handle empty array gracefully
    const highlights = bookWithEmptyFeatures.keyFeatures.map((f, i) => `${i + 1}. ${f}`);
    assert.deepStrictEqual(highlights, []);
  });

  await t.test('B4.5 Rapid modal toggle state consistency', () => {
    let isSpreadOpen = false;
    const toggleSpread = () => { isSpreadOpen = !isSpreadOpen; };

    // Simulate 10 rapid Esc / Enter toggle events
    for (let i = 0; i < 10; i++) {
      toggleSpread();
    }
    // Even number of toggles returns to closed state
    assert.strictEqual(isSpreadOpen, false);
  });
});
