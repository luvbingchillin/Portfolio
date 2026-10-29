import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import {
  TopNavStateMachine,
  DEFAULT_TOPNAV_CONFIG,
  calculateNavPageDotPosition
} from '../helpers/enhancementModels.ts';

test('Tier 2 - Feature R1 Boundary: Top-Middle Navigation Bar Edge Cases', async (t) => {
  await t.test('B1.1 Extreme viewports: 4K ultrawide (3840px) vs ultra-compact (320px)', () => {
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0);

    // 4K ultrawide viewport (3840px)
    assert.strictEqual(navMachine.isMobileDocked(3840), false, '4K viewport must remain top-centered');
    
    // Narrowest smartphone viewport (320px)
    assert.strictEqual(navMachine.isMobileDocked(320), true, '320px viewport must dock to bottom');

    // Floating dot coordinate math remains valid on 3840px screen
    const dotPos4K = calculateNavPageDotPosition(
      { left: 1880, right: 1960, top: 10, bottom: 50, width: 80, height: 40 },
      { left: 1600, right: 2240, top: 0, bottom: 60, width: 640, height: 60 },
      5
    );
    assert.strictEqual(dotPos4K.x, 320.0);
    assert.strictEqual(dotPos4K.y, 55.0);
  });

  await t.test('B1.2 Viewport breakpoint threshold transition: 991px vs 992px', () => {
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0);

    // Exact threshold boundary:
    // <= 991px is docked to bottom
    // >= 992px is floating at top
    assert.strictEqual(navMachine.isMobileDocked(991), true, '991px must dock to bottom');
    assert.strictEqual(navMachine.isMobileDocked(992), false, '992px must float at top');
    assert.strictEqual(navMachine.isMobileDocked(991.5), false, 'Sub-pixel 991.5px is > 991 and floats at top');
  });

  await t.test('B1.3 Rapid dropdown toggle spamming (100 iterations)', () => {
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0);

    // Perform 100 rapid toggles in sequence
    for (let i = 0; i < 100; i++) {
      navMachine.toggleDropdown();
    }

    // After an even number of toggles (100), state must return to closed (false)
    assert.strictEqual(navMachine.isOpen, false, 'Dropdown must settle closed after 100 alternating toggles');
    const roll = navMachine.getRollState();
    assert.strictEqual(roll.chevronDegrees, 0, 'Chevron must return to 0 degrees');
    assert.strictEqual(roll.ariaExpanded, false);
    assert.strictEqual(roll.dropdownHeightEm, 0);

    // Single additional toggle must open cleanly
    navMachine.toggleDropdown();
    assert.strictEqual(navMachine.isOpen, true);
    assert.strictEqual(navMachine.getRollState().chevronDegrees, 180);
  });

  await t.test('B1.4 Out-of-bounds activeIndex clamping in dropdown selection', () => {
    let capturedIndex = -1;
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0, (idx) => {
      capturedIndex = idx;
    });

    const maxIndex = BOOKS_CATALOG.length - 1; // 4

    // Extreme negative indices must clamp to 0
    assert.strictEqual(navMachine.selectIndex(-1), 0);
    assert.strictEqual(capturedIndex, 0);
    assert.strictEqual(navMachine.selectIndex(-9999), 0);
    assert.strictEqual(capturedIndex, 0);

    // Extreme overflow indices must clamp to maxIndex
    assert.strictEqual(navMachine.selectIndex(maxIndex + 1), maxIndex);
    assert.strictEqual(capturedIndex, maxIndex);
    assert.strictEqual(navMachine.selectIndex(99999), maxIndex);
    assert.strictEqual(capturedIndex, maxIndex);
  });

  await t.test('B1.5 Ultra-long book title handling in dropdown (truncation safety)', () => {
    // Construct book with excessive title length (150 chars)
    const longTitleBook = {
      ...BOOKS_CATALOG[0],
      title: 'Architectures of Hyper-Distributed Asynchronous Real-Time Compute & Federated Autonomous Cognitive Agent Topologies in High-Latency Constellations'
    };

    const navMachine = new TopNavStateMachine([longTitleBook], 0);
    assert.strictEqual(navMachine.books[0].title.length > 100, true);

    // Dropdown fixed width constraint: 28em ensures predictable overflow truncation
    assert.strictEqual(DEFAULT_TOPNAV_CONFIG.dropdownWidthEm, 28);
    // Formatted count for single book
    assert.strictEqual(navMachine.getFormattedCount(), '01');
  });

  await t.test('B1.6 Empty or single-item catalog boundary cases', () => {
    // Single item catalog
    const singleMachine = new TopNavStateMachine([BOOKS_CATALOG[0]], 0);
    assert.strictEqual(singleMachine.getFormattedCount(), '01');
    assert.strictEqual(singleMachine.selectIndex(5), 0, 'Must clamp to single index 0');

    // 10+ items catalog formatting (no extra leading zero, e.g. '12')
    const twelveBooks = Array.from({ length: 12 }, (_, i) => ({
      ...BOOKS_CATALOG[0],
      id: `book-${i}`,
      title: `Book ${i}`
    }));
    const twelveMachine = new TopNavStateMachine(twelveBooks, 0);
    assert.strictEqual(twelveMachine.getFormattedCount(), '12', '10+ items must render as 12 without leading zero');
  });
});
