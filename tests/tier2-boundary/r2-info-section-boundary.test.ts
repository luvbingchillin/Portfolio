import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import {
  InfoSectionAnimationModel,
  formatMonographDisplayData
} from '../helpers/enhancementModels.ts';

test('Tier 2 - Feature R2 Boundary: Top-Right Information Section Edge Cases', async (t) => {
  await t.test('B2.1 Missing optional props and fallback values', () => {
    const bookWithoutCallNo = {
      ...BOOKS_CATALOG[0],
      callNumber: ''
    };

    // When curator is omitted, must fallback to default 'Kang Yuchen'
    const displayDataDefaultCurator = formatMonographDisplayData(bookWithoutCallNo);
    assert.strictEqual(displayDataDefaultCurator.rows[0].value, 'Kang Yuchen', 'Default curator must be Kang Yuchen');

    // When custom curator provided, override cleanly
    const displayDataCustom = formatMonographDisplayData(bookWithoutCallNo, 'Archival Fellow A. Turing');
    assert.strictEqual(displayDataCustom.rows[0].value, 'Archival Fellow A. Turing');

    // Empty call number handles gracefully
    assert.strictEqual(displayDataCustom.rows[3].value, '');
  });

  await t.test('B2.2 Rapid monograph switching during ongoing animation (interrupt safety)', () => {
    const animModel = new InfoSectionAnimationModel(BOOKS_CATALOG[0]);

    // 1. Transition to Book 1
    animModel.triggerChange(BOOKS_CATALOG[1]);
    animModel.step(100); // settle
    animModel.step(200); // halfway exiting
    assert.strictEqual(animModel.phase, 'exiting');

    // 2. Mid-exit interrupt: User immediately selects Book 3
    animModel.triggerChange(BOOKS_CATALOG[3]);
    assert.strictEqual(animModel.pendingBook?.id, BOOKS_CATALOG[3].id, 'Pending book immediately swaps to latest selection');

    // 3. Complete settle & exit for the interrupted sequence
    animModel.step(100); // settle
    animModel.step(400); // exit
    assert.strictEqual(animModel.phase, 'entering');
    assert.strictEqual(animModel.currentBook.id, BOOKS_CATALOG[3].id, 'Active book updates directly to Book 3, skipping Book 1');

    // 4. Complete entrance
    animModel.step(700);
    assert.strictEqual(animModel.phase, 'idle');
    assert.strictEqual(animModel.currentBook.id, BOOKS_CATALOG[3].id);
  });

  await t.test('B2.3 Multi-line long title wrapping without clipping or breaking divider lines', () => {
    const longTitleBook = {
      ...BOOKS_CATALOG[0],
      title: 'A Treatise On The Foundations Of High-Dimensional Non-Euclidean Topologies In Distributed Machine Systems'
    };

    const display = formatMonographDisplayData(longTitleBook);
    assert.strictEqual(display.title, longTitleBook.title.toUpperCase());
    assert.ok(display.title.length > 80, 'Title is exceptionally long');

    // Must still produce exactly 4 metadata rows
    assert.strictEqual(display.rows.length, 4);
    display.rows.forEach(r => {
      assert.ok(r.label.length > 0);
      assert.ok(r.value.length >= 0);
    });
  });

  await t.test('B2.4 Special characters, ampersands, slashes, and unicode in metadata rows', () => {
    const unicodeBook = {
      ...BOOKS_CATALOG[0],
      title: 'Systems & Tools // Vol. IV — René René & Schrödinger’s Cat',
      category: 'Research & Development // 3D',
      callNumber: 'QA 76.73 / § 104-A [Ω]'
    };

    const display = formatMonographDisplayData(unicodeBook, 'Dr. H. von Helmholtz & Co.');
    assert.strictEqual(display.title, 'SYSTEMS & TOOLS // VOL. IV — RENÉ RENÉ & SCHRÖDINGER’S CAT');
    assert.strictEqual(display.rows[0].value, 'Dr. H. von Helmholtz & Co.');
    assert.strictEqual(display.rows[2].value, 'RESEARCH & DEVELOPMENT // 3D');
    assert.strictEqual(display.rows[3].value, 'QA 76.73 / § 104-A [Ω]');
  });

  await t.test('B2.5 Repeated trigger on the same book is a no-op when idle', () => {
    const animModel = new InfoSectionAnimationModel(BOOKS_CATALOG[0]);
    assert.strictEqual(animModel.phase, 'idle');

    // Triggering transition to the currently active book should not restart animations
    animModel.triggerChange(BOOKS_CATALOG[0]);
    assert.strictEqual(animModel.phase, 'idle', 'Phase should remain idle when selected book is identical');
    assert.strictEqual(animModel.pendingBook, undefined);
  });

  await t.test('B2.6 Delta time spike stability (dtMs = 10,000ms background tab resume)', () => {
    const animModel = new InfoSectionAnimationModel(BOOKS_CATALOG[0]);
    animModel.triggerChange(BOOKS_CATALOG[2]);
    assert.strictEqual(animModel.phase, 'settling');

    // Simulate 10-second background tab freeze resuming
    // Step through the phases with a large delta
    animModel.step(100);  // settle -> exiting
    animModel.step(10000);// massive delta -> entering
    animModel.step(10000);// massive delta -> idle

    assert.strictEqual(animModel.phase, 'idle', 'Animation must cleanly settle at idle following lag spike');
    assert.strictEqual(animModel.currentBook.id, BOOKS_CATALOG[2].id);
    assert.strictEqual(animModel.enterYPct, 0);
    assert.strictEqual(animModel.dividerScale, 1.0);
  });
});
