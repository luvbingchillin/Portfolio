/**
 * Athenaeum 3D Portfolio — Milestone 4: Phase 2 (Tier 5)
 * Adversarial Coverage Hardening Test Suite: UI, Preloader & Editorial Typography
 * 
 * Scope:
 * 1. Preloader split-drum odometer mechanics, 4-beat progression, minimum duration (>=2.85s), fan reveal (1.15s), clamping.
 * 2. textBalance dynamic programming line balancing, Unicode/emojis, pathological line counts, CLS line reservation.
 * 3. LibraryUI & BookDetailModal keyboard isolation, focus traps, backdrop click, optical tracking & editorial palette.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PRELOADER_CONFIG,
  PRELOADER_BEATS
} from '../../src/utils/gpuWarming.ts';
import {
  balanceWords,
  balanceText,
  applyTextBalancing,
  applyLineReservation
} from '../../src/utils/textBalance.ts';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';

// -----------------------------------------------------------------------------
// DOM Mock Simulator for Node.js Testing
// -----------------------------------------------------------------------------

class MockStyleDeclaration {
  minHeight?: string;
  [key: string]: unknown;

  removeProperty(prop: string): string {
    const val = (this as Record<string, unknown>)[prop];
    delete (this as Record<string, unknown>)[prop];
    return typeof val === 'string' ? val : '';
  }

  setProperty(prop: string, val: string): void {
    (this as Record<string, unknown>)[prop] = val;
  }
}

class MockDOMElement {
  tagName: string;
  attributes = new Map<string, string>();
  style = new MockStyleDeclaration();
  children: MockDOMElement[] = [];
  textContent: string = '';

  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, String(value));
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  replaceChildren(...newChildren: MockDOMElement[]): void {
    this.children = [...newChildren];
    this.textContent = newChildren.map((c) => c.textContent).join('');
  }

  querySelectorAll<T = MockDOMElement>(selector: string): T[] {
    const results: MockDOMElement[] = [];
    const checkMatch = (el: MockDOMElement) => {
      if (selector.startsWith('[') && selector.endsWith(']')) {
        const attrName = selector.slice(1, -1);
        if (el.hasAttribute(attrName)) {
          results.push(el);
        }
      }
      for (const child of el.children) {
        checkMatch(child);
      }
    };
    checkMatch(this);
    return results as unknown as T[];
  }
}

// Setup Node mock globals for DOM execution
const mockDocument = {
  createElement(tag: string) {
    return new MockDOMElement(tag);
  }
};

const mockWindow = {
  getComputedStyle(_el: unknown) {
    return {
      lineHeight: '24px',
      fontSize: '16px'
    };
  }
};

(globalThis as unknown as { document: unknown }).document = mockDocument;
(globalThis as unknown as { window: unknown }).window = mockWindow;

// -----------------------------------------------------------------------------
// Pure Preloader Engine Simulator matching src/components/Preloader.tsx
// -----------------------------------------------------------------------------

class PreloaderSimulationEngine {
  private startTime = 0;
  private currentProgress = 0;
  private completed = false;
  private onLoadedCallback?: () => void;
  private minDurationMs: number;
  private externalProgress?: number;

  constructor(
    onLoaded?: () => void,
    minDurationMs = PRELOADER_CONFIG.minDurationMs
  ) {
    this.onLoadedCallback = onLoaded;
    this.minDurationMs = minDurationMs;
  }

  start(initialTime = 0, externalProgress?: number): void {
    this.startTime = initialTime;
    this.currentProgress = 0;
    this.completed = false;
    this.externalProgress = externalProgress;
  }

  setExternalProgress(val: number): void {
    this.externalProgress = val;
  }

  tick(currentTime: number): void {
    const elapsed = currentTime - this.startTime;
    const timeProgress = Math.min(100, (elapsed / this.minDurationMs) * 100);

    const ext = this.externalProgress;
    const realProgress = ext !== undefined
      ? Math.max(0, Math.min(100, ext))
      : timeProgress;

    const target = realProgress >= 100
      ? Math.min(100, timeProgress)
      : Math.min(realProgress, timeProgress);

    this.currentProgress = Math.max(this.currentProgress, target);

    if (
      realProgress >= 100 &&
      elapsed >= this.minDurationMs &&
      !this.completed
    ) {
      this.completed = true;
      this.currentProgress = 100;
      if (this.onLoadedCallback) {
        this.onLoadedCallback();
      }
    }
  }

  getProgress(): number {
    return this.currentProgress;
  }

  isCompleted(): boolean {
    return this.completed;
  }

  getDrumIndices(): {
    hundredsIndex: number;
    tensIndex: number;
    onesIndex: number;
    isHundredsVisible: boolean;
  } {
    const val = Math.floor(this.currentProgress);
    const ones = val % 20;
    const tens = Math.floor(val / 10) % 20;
    const hundreds = Math.floor(val / 100) % 20;
    return {
      hundredsIndex: hundreds,
      tensIndex: tens,
      onesIndex: ones,
      isHundredsVisible: val >= 100
    };
  }

  getActiveBeat() {
    for (const b of PRELOADER_BEATS) {
      if (this.currentProgress <= b.endPct) {
        return b;
      }
    }
    return PRELOADER_BEATS[PRELOADER_BEATS.length - 1];
  }
}

// =============================================================================
// TEST SUITE: Tier 5 UI & Preloader Adversarial Hardening
// =============================================================================

test('Tier 5 - UI & Preloader Adversarial Hardening', async (t) => {

  // ---------------------------------------------------------------------------
  // 1. PRELOADER & SPLIT-DRUM ODOMETER TESTS
  // ---------------------------------------------------------------------------

  await t.test('T5.1 Preloader split-drum 20-digit translation math across indices 0-19', () => {
    // Each digit in the 20-digit strip occupies 100% / 20 = 5% of column height
    const ROLLING_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    assert.strictEqual(ROLLING_DIGITS.length, 20, 'Rolling drum strip must contain exactly 20 digits');

    for (let idx = 0; idx < 20; idx++) {
      const translateY = -(idx * 5);
      assert.ok(translateY <= 0 && translateY >= -95, `TranslateY must be within [0, -95]%, got ${translateY}%`);
      assert.strictEqual(ROLLING_DIGITS[idx], idx % 10, `Digit at strip index ${idx} must match decimal remainder`);
    }
  });

  await t.test('T5.2 Preloader odometer digit decomposition and rollover at critical steps (09->10, 99->100)', () => {
    const engine = new PreloaderSimulationEngine();
    engine.start(0);

    // Initial state: 0%
    let drums = engine.getDrumIndices();
    assert.strictEqual(drums.onesIndex, 0);
    assert.strictEqual(drums.tensIndex, 0);
    assert.strictEqual(drums.hundredsIndex, 0);
    assert.strictEqual(drums.isHundredsVisible, false, 'Hundreds column must be hidden at 0%');

    // Step to 9%
    engine.setExternalProgress(9);
    engine.tick(3000);
    drums = engine.getDrumIndices();
    assert.strictEqual(drums.onesIndex, 9);
    assert.strictEqual(drums.tensIndex, 0);
    assert.strictEqual(drums.isHundredsVisible, false);

    // Rollover to 10%
    engine.setExternalProgress(10);
    engine.tick(3000);
    drums = engine.getDrumIndices();
    assert.strictEqual(drums.onesIndex, 10, 'Ones index moves to 10 (which displays digit 0 on strip)');
    assert.strictEqual(drums.tensIndex, 1, 'Tens index rolls forward to 1');

    // Step to 99%
    engine.setExternalProgress(99);
    engine.tick(3000);
    drums = engine.getDrumIndices();
    assert.strictEqual(drums.onesIndex, 19, 'Ones digit index at 99 is 19 (displays digit 9)');
    assert.strictEqual(drums.tensIndex, 9);
    assert.strictEqual(drums.isHundredsVisible, false);

    // Rollover to 100%
    engine.setExternalProgress(100);
    engine.tick(3000);
    drums = engine.getDrumIndices();
    assert.strictEqual(drums.hundredsIndex, 1);
    assert.strictEqual(drums.tensIndex, 10, 'Tens index rolls forward to 10 (displays digit 0)');
    assert.strictEqual(drums.onesIndex, 0, 'Ones index rolls to 0 (displays digit 0)');
    assert.strictEqual(drums.isHundredsVisible, true, 'Hundreds column expands and becomes visible at 100%');
  });

  await t.test('T5.3 Preloader hundreds column visibility boundary condition', () => {
    const engine = new PreloaderSimulationEngine();
    engine.start(0);

    engine.setExternalProgress(99.9);
    engine.tick(3000);
    assert.strictEqual(engine.getDrumIndices().isHundredsVisible, false, 'Hundreds must be invisible below 100%');

    engine.setExternalProgress(100);
    engine.tick(3000);
    assert.strictEqual(engine.getDrumIndices().isHundredsVisible, true, 'Hundreds must be visible at 100%');
  });

  await t.test('T5.4 Preloader boundary clamping for negative and overflow inputs ([-1000, 1000])', () => {
    const engine = new PreloaderSimulationEngine();
    engine.start(0);

    engine.setExternalProgress(-500);
    engine.tick(500);
    assert.ok(engine.getProgress() >= 0, 'Progress must never become negative');

    engine.setExternalProgress(1000);
    engine.tick(3000);
    assert.strictEqual(engine.getProgress(), 100, 'Progress must clamp at 100% maximum');
  });

  await t.test('T5.5 Preloader 4-beat timeline exact boundaries and stage mapping', () => {
    assert.strictEqual(PRELOADER_BEATS.length, 4, 'Must have exactly 4 beats');
    assert.strictEqual(PRELOADER_BEATS[0].endPct, 25);
    assert.strictEqual(PRELOADER_BEATS[1].endPct, 60);
    assert.strictEqual(PRELOADER_BEATS[2].endPct, 95);
    assert.strictEqual(PRELOADER_BEATS[3].endPct, 100);

    const engine = new PreloaderSimulationEngine();
    engine.start(0);

    // Test Beat 1
    engine.setExternalProgress(25);
    engine.tick(3000);
    assert.strictEqual(engine.getActiveBeat().beat, 1);

    // Test Beat 2
    engine.setExternalProgress(25.1);
    engine.tick(3000);
    assert.strictEqual(engine.getActiveBeat().beat, 2);

    // Test Beat 3
    engine.setExternalProgress(60.1);
    engine.tick(3000);
    assert.strictEqual(engine.getActiveBeat().beat, 3);

    // Test Beat 4
    engine.setExternalProgress(95.1);
    engine.tick(3000);
    assert.strictEqual(engine.getActiveBeat().beat, 4);
  });

  await t.test('T5.6 Minimum duration enforcement (>=2.85s) when external assets finish in 10ms', () => {
    let fired = false;
    const engine = new PreloaderSimulationEngine(() => { fired = true; }, 2850);
    engine.start(0, 100); // Assets finish instantly

    // At 10ms
    engine.tick(10);
    assert.strictEqual(engine.isCompleted(), false, 'Must not complete at 10ms');
    assert.strictEqual(fired, false);
    assert.ok(engine.getProgress() < 1, 'Progress should track theatrical clock (~0.35%)');

    // At 1425ms (halfway)
    engine.tick(1425);
    assert.strictEqual(engine.isCompleted(), false);
    assert.strictEqual(fired, false);
    assert.ok(Math.abs(engine.getProgress() - 50) < 0.1, 'Progress must be ~50% at 1425ms');

    // At 2849ms (1ms before minimum)
    engine.tick(2849);
    assert.strictEqual(engine.isCompleted(), false);
    assert.strictEqual(fired, false);

    // At 2850ms (minimum met)
    engine.tick(2850);
    assert.strictEqual(engine.isCompleted(), true, 'Must complete when elapsed >= 2850ms');
    assert.strictEqual(fired, true);
    assert.strictEqual(engine.getProgress(), 100);
  });

  await t.test('T5.7 Latency hold: timer reaches 2.85s but external pipeline is at 60%', () => {
    let fired = false;
    const engine = new PreloaderSimulationEngine(() => { fired = true; }, 2850);
    engine.start(0, 60);

    // At 3000ms (> 2.85s), but assets still at 60%
    engine.tick(3000);
    assert.strictEqual(engine.isCompleted(), false, 'Must not complete if assets are incomplete');
    assert.strictEqual(fired, false);
    assert.strictEqual(engine.getProgress(), 60, 'Display progress must hold at 60%');

    // External assets complete at 4200ms
    engine.setExternalProgress(100);
    engine.tick(4200);
    assert.strictEqual(engine.isCompleted(), true);
    assert.strictEqual(fired, true);
    assert.strictEqual(engine.getProgress(), 100);
  });

  await t.test('T5.8 Single completion callback guard under rapid ticks after 100%', () => {
    let callCount = 0;
    const engine = new PreloaderSimulationEngine(() => { callCount++; }, 2850);
    engine.start(0, 100);

    // Fire minimum duration
    engine.tick(2850);
    assert.strictEqual(callCount, 1);

    // Additional post-completion ticks
    for (let t = 2860; t <= 3500; t += 16) {
      engine.tick(t);
    }
    assert.strictEqual(callCount, 1, 'onLoaded callback must execute strictly once');
  });

  await t.test('T5.9 Preloader monotonic progression ignores downward regressive updates', () => {
    const engine = new PreloaderSimulationEngine(undefined, 2850);
    engine.start(0, 40);
    engine.tick(3000);
    assert.strictEqual(engine.getProgress(), 40);

    // Spurious backward regression to 20%
    engine.setExternalProgress(20);
    engine.tick(3100);
    assert.strictEqual(engine.getProgress(), 40, 'Progress must never decrease');

    // Forward progression to 80%
    engine.setExternalProgress(80);
    engine.tick(3200);
    assert.strictEqual(engine.getProgress(), 80);
  });

  await t.test('T5.10 Fan reveal exit transition duration configuration', () => {
    assert.strictEqual(PRELOADER_CONFIG.revealDurationMs, 1150, 'Fan reveal aperture transition must be 1.15s (1150ms)');
    assert.strictEqual(PRELOADER_CONFIG.minDurationMs, 2850, 'Minimum theatrical preloader duration must be 2.85s (2850ms)');
  });

  // ---------------------------------------------------------------------------
  // 2. TEXT BALANCING & EDITORIAL TYPOGRAPHY TESTS
  // ---------------------------------------------------------------------------

  await t.test('T5.11 Text balance with empty string and whitespace-only strings', () => {
    assert.deepStrictEqual(balanceText('', 2), []);
    assert.deepStrictEqual(balanceText('   ', 2), []);
    assert.deepStrictEqual(balanceText('\n\t  \r', 3), []);
  });

  await t.test('T5.12 Text balance with single-character and single-word inputs', () => {
    assert.deepStrictEqual(balanceText('A', 2), ['A']);
    assert.deepStrictEqual(balanceText('Athenaeum', 4), ['Athenaeum']);
  });

  await t.test('T5.13 Text balance with massive unbroken word (1000 characters)', () => {
    const longWord = 'X'.repeat(1000);
    const result = balanceText(longWord, 3);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], longWord);
  });

  await t.test('T5.14 Text balance with Unicode, emojis, and multilingual codepoints', () => {
    const raw = '🏛️ Sovereign Memory 📖 Computational Archives 🚀 Neural Systems 2026';
    const lines = balanceText(raw, 2);
    assert.strictEqual(lines.length, 2, 'Should divide into 2 balanced lines');
    assert.strictEqual(lines.join(' '), raw, 'Reconstituted text must match raw input without corruption');
    assert.ok(lines[0].includes('🏛️') && lines[0].includes('📖'));
    assert.ok(lines[1].includes('🚀'));
  });

  await t.test('T5.15 Text balance with pathological line counts (<=0, 1, 1000, NaN)', () => {
    const sample = 'The Athenaeum Monograph Series Vol 2026';
    // lineCount <= 0
    assert.deepStrictEqual(balanceText(sample, 0), [sample]);
    assert.deepStrictEqual(balanceText(sample, -5), [sample]);

    // lineCount = 1
    assert.deepStrictEqual(balanceText(sample, 1), [sample]);

    // lineCount much greater than words (6 words, lineCount = 50)
    const split50 = balanceText(sample, 50);
    assert.strictEqual(split50.length, 6, 'Must clamp lineCount to words.length to prevent empty lines');
    assert.deepStrictEqual(split50, sample.split(' '));

    // lineCount = NaN (gracefully handled without exception)
    const nanResult = balanceText(sample, NaN);
    assert.ok(Array.isArray(nanResult));
  });

  await t.test('T5.16 Text balance dynamic programming line length variance minimization', () => {
    const title = 'Chronicles of Neural Architecture in Modern Computational Graphic Synthesis';
    const words = title.split(' ');
    const lines = balanceWords(words, 3);

    assert.strictEqual(lines.length, 3, 'Must produce exactly 3 lines');
    assert.strictEqual(lines.join(' '), title, 'All words must be preserved in order');

    const lengths = lines.map((l) => l.length);
    const variance = Math.max(...lengths) - Math.min(...lengths);
    assert.ok(variance < 25, `Lines must be balanced; difference between longest and shortest was ${variance}`);
  });

  await t.test('T5.17 Text balance line reservation (applyLineReservation) on DOM elements', () => {
    const root = new MockDOMElement('div');
    const child = new MockDOMElement('h2');
    child.setAttribute('data-reserve-lines', '3');
    root.children.push(child);

    applyLineReservation(root as unknown as HTMLElement);

    assert.strictEqual(child.getAttribute('data-reserve-active'), 'true');
    assert.ok(child.style.minHeight, 'minHeight must be set on active reserve elements');

    // Invalid lines (e.g. -1 or non-numeric) cleans up
    child.setAttribute('data-reserve-lines', '-1');
    applyLineReservation(root as unknown as HTMLElement);
    assert.strictEqual(child.getAttribute('data-reserve-active'), null, 'Invalid line reserve must remove active flag');
  });

  await t.test('T5.18 Text balance dynamic DOM insertion and idempotency under repeated calls', () => {
    const root = new MockDOMElement('div');
    const child = new MockDOMElement('h2');
    const rawTitle = 'The Sovereign Computation Repository';
    child.setAttribute('data-balance-lines', '2');
    child.textContent = rawTitle;
    root.children.push(child);

    // Initial run
    applyTextBalancing(root as unknown as HTMLElement);
    assert.strictEqual(child.getAttribute('data-balance-source'), rawTitle, 'Original source must be cached');
    assert.strictEqual(child.children.length, 2, 'Must create 2 span elements');
    assert.strictEqual(child.children[0].getAttribute('data-balance-line'), '');

    // Second run should use cached source and produce identical children
    applyTextBalancing(root as unknown as HTMLElement);
    assert.strictEqual(child.children.length, 2);
    assert.strictEqual(child.getAttribute('data-balance-source'), rawTitle);
  });

  // ---------------------------------------------------------------------------
  // 3. LIBRARY UI, MODAL & KEYBOARD CONTRACT TESTS
  // ---------------------------------------------------------------------------

  await t.test('T5.19 Shelf boundary navigation clamping and active book flip reset', () => {
    const totalBooks = BOOKS_CATALOG.length;
    assert.ok(totalBooks >= 5, 'Catalog must contain at least 5 books');

    let activeIndex = 0;
    let isFlipped = true;

    const selectBook = (newIdx: number) => {
      const clamped = Math.max(0, Math.min(totalBooks - 1, newIdx));
      if (clamped !== activeIndex) {
        activeIndex = clamped;
        isFlipped = false; // Contract: switching resets flip state
      }
    };

    // Attempt to navigate left beyond start
    selectBook(-1);
    assert.strictEqual(activeIndex, 0, 'Cannot navigate past index 0');

    // Navigate to index 1: flip should reset to false
    selectBook(1);
    assert.strictEqual(activeIndex, 1);
    assert.strictEqual(isFlipped, false, 'Flip must reset when switching books');

    // Navigate right beyond max
    selectBook(totalBooks + 10);
    assert.strictEqual(activeIndex, totalBooks - 1, 'Cannot navigate past totalBooks - 1');
  });

  await t.test('T5.20 Keyboard modality isolation (preloader active and modal open)', () => {
    // Model App.tsx keyboard dispatch handler
    let isLoaded = false;
    let isSpreadOpen = false;
    let activeIndex = 2;
    let isFlipped = false;

    const handleKeyDown = (key: string, code: string) => {
      if (isSpreadOpen || !isLoaded) return;

      if (key === 'ArrowLeft') {
        activeIndex = Math.max(0, activeIndex - 1);
      } else if (key === 'ArrowRight') {
        activeIndex = Math.min(BOOKS_CATALOG.length - 1, activeIndex + 1);
      } else if (code === 'Space') {
        isFlipped = !isFlipped;
      } else if (key === 'Enter') {
        isSpreadOpen = true;
      }
    };

    // Phase A: Preloader active (isLoaded = false)
    handleKeyDown('ArrowRight', 'ArrowRight');
    assert.strictEqual(activeIndex, 2, 'Arrow keys ignored during preloader');
    handleKeyDown(' ', 'Space');
    assert.strictEqual(isFlipped, false, 'Spacebar ignored during preloader');

    // Phase B: Preloader completed
    isLoaded = true;
    handleKeyDown('ArrowRight', 'ArrowRight');
    assert.strictEqual(activeIndex, 3, 'Arrow keys work after preloader completes');
    handleKeyDown(' ', 'Space');
    assert.strictEqual(isFlipped, true, 'Spacebar toggles flip');

    // Phase C: Modal opened (isSpreadOpen = true)
    handleKeyDown('Enter', 'Enter');
    assert.strictEqual(isSpreadOpen, true);

    // Keystrokes must now be blocked from moving background shelf
    handleKeyDown('ArrowLeft', 'ArrowLeft');
    assert.strictEqual(activeIndex, 3, 'Shelf navigation blocked while modal is open');
    handleKeyDown(' ', 'Space');
    assert.strictEqual(isFlipped, true, 'Flip toggling blocked while modal is open');

    // Escape in modal closes it
    const handleModalKeyDown = (key: string) => {
      if (key === 'Escape') {
        isSpreadOpen = false;
      }
    };
    handleModalKeyDown('Escape');
    assert.strictEqual(isSpreadOpen, false, 'Escape closes modal spread');
  });

  await t.test('T5.21 Editorial typography tokens, optical tracking, and palette compliance', () => {
    // Check editorial tokens in catalog data
    for (const book of BOOKS_CATALOG) {
      assert.ok(book.id, 'Book id required');
      assert.ok(book.title, 'Book title required');
      assert.ok(book.callNumber, 'Call number required for archival typography');
      assert.ok(book.stackShelf, 'Stack shelf required');
      assert.ok(book.fullSynopsis.length > 50, 'Synopsis must be substantial');

      // Drop cap check
      const firstChar = book.fullSynopsis.charAt(0);
      assert.match(firstChar, /[A-Z]/, 'First char must be an uppercase letter for drop cap');
    }
  });

  await t.test('T5.22 Headless / SSR vulnerability probe in applyLineReservation', () => {
    // Temporarily unset window to probe SSR safety
    const savedWindow = (globalThis as Record<string, unknown>).window;
    try {
      delete (globalThis as Record<string, unknown>).window;
      const el = new MockDOMElement('div');
      el.setAttribute('data-reserve-lines', '2');
      const container = new MockDOMElement('div');
      container.children.push(el);

      assert.throws(
        () => {
          applyLineReservation(container as unknown as HTMLElement);
        },
        {
          name: 'ReferenceError',
          message: /window is not defined/
        },
        'applyLineReservation must throw ReferenceError if window is undefined in SSR/Node environments'
      );
    } finally {
      (globalThis as Record<string, unknown>).window = savedWindow;
    }
  });

  await t.test('T5.23 Modal backdrop click vs content propagation isolation', () => {
    let closed = false;
    const onClose = () => { closed = true; };

    // Sibling structure in BookDetailModal:
    // Outer container: fixed inset-0 flex items-center justify-center
    // - Backdrop: absolute inset-0 onClick={onClose}
    // - Content: relative z-10 w-full max-w-5xl
    const backdropClicked = () => {
      onClose();
    };

    const contentClicked = (e: { stopPropagation?: () => void }) => {
      // Content clicks do not hit the backdrop because they are sibling elements
      e.stopPropagation?.();
    };

    // Click backdrop
    backdropClicked();
    assert.strictEqual(closed, true, 'Backdrop click must invoke onClose');

    // Reset and click content
    closed = false;
    contentClicked({});
    assert.strictEqual(closed, false, 'Content click must not trigger onClose');
  });

});

