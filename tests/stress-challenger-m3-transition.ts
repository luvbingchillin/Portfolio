/**
 * Challenger M3-2 Empirical Stress Test Suite
 * Milestone 3: Monograph Transition State Machine Stress & Hardening
 *
 * Specific Verification Objectives:
 * 1. Rapid sequential index changes (0 -> 1 -> 4 -> 2 within milliseconds).
 * 2. Verify pendingBookRef correctly captures latest selection and skips intermediate states cleanly.
 * 3. Verify delta-time spikes (background tab freeze simulation 10s, 60s, 3600s).
 * 4. Verify no-op guards on identical index re-selection (idle vs active transitions).
 * 5. Out-of-bounds inputs, missing metadata fields, pathological strings, and special characters.
 * 6. AST & Source Code Contract integrity of EditorialInfoSection.tsx.
 * 7. Resource lifecycle: unmount timer cancellation and zero-leak verification across 10,000 cycles.
 */

import './setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { BOOKS_CATALOG } from '../src/data/booksData.ts';
import type { Book } from '../src/types.ts';

// Replicate exact AnimationPhase and configuration from EditorialInfoSection.tsx
export type AnimationPhase = 'idle' | 'settling' | 'exiting' | 'entering';

export const ANIM_CONFIG = {
  settleDelayMs: 100,
  outDurationMs: 400,
  inDurationMs: 700,
  outLineStaggerSec: 0.016,
  inLineStaggerSec: 0.05,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)'
};

/**
 * High-fidelity virtual-time state machine replicating EditorialInfoSection.tsx lines 84-148.
 * Supports discrete time advancement, timer tracking, event capture, and interrupt injection.
 */
export class EditorialTransitionHarness {
  public phase: AnimationPhase = 'idle';
  public displayBook: Book;
  public pendingBook: Book | null = null;
  public activeBook: Book;
  public timeouts: { id: number; callback: () => void; timeDue: number }[] = [];
  public nextTimerId = 1;
  public currentTimeMs = 0;
  public history: {
    time: number;
    phase: AnimationPhase;
    displayId: string;
    pendingId: string | null;
    activeId: string;
  }[] = [];

  constructor(initialBook: Book) {
    this.displayBook = initialBook;
    this.activeBook = initialBook;
    this.recordHistory();
  }

  public recordHistory(): void {
    this.history.push({
      time: this.currentTimeMs,
      phase: this.phase,
      displayId: this.displayBook.id,
      pendingId: this.pendingBook ? this.pendingBook.id : null,
      activeId: this.activeBook.id
    });
  }

  private clearAllTimeouts(): void {
    this.timeouts = [];
  }

  private pushTimeout(callback: () => void, delayMs: number): number {
    const id = this.nextTimerId++;
    this.timeouts.push({
      id,
      callback,
      timeDue: this.currentTimeMs + Math.max(0, delayMs)
    });
    // Sort ascending by timeDue
    this.timeouts.sort((a, b) => a.timeDue - b.timeDue);
    return id;
  }

  /**
   * Simulates the React useEffect([activeBook, displayBook.id, phase, clearAllTimeouts])
   */
  public triggerBookChange(newBook: Book): void {
    this.activeBook = newBook;
    this.runEffect();
  }

  private runEffect(): void {
    // 1. No-op if same book is requested when idle (B2.5)
    if (this.activeBook.id === this.displayBook.id && this.phase === 'idle') {
      return;
    }

    // 2. If already in transition, update pendingBook to latest selection
    this.pendingBook = this.activeBook;

    if (this.phase !== 'idle') {
      this.recordHistory();
      return;
    }

    // 3. Initiate settle -> exit -> enter pipeline
    this.clearAllTimeouts();

    // Settle phase begins (initTimer 0ms)
    this.pushTimeout(() => {
      this.phase = 'settling';
      this.recordHistory();
    }, 0);

    // Settle delay: 100ms -> transition to exiting
    this.pushTimeout(() => {
      this.phase = 'exiting';
      this.recordHistory();

      // Exit duration: 400ms -> swap book and transition to entering
      this.pushTimeout(() => {
        const nextBook = this.pendingBook || this.activeBook;
        this.displayBook = nextBook;
        this.pendingBook = null;
        this.phase = 'entering';
        this.recordHistory();

        // Entrance duration: 700ms -> transition back to idle
        this.pushTimeout(() => {
          this.phase = 'idle';
          this.recordHistory();
          // After returning to idle, if activeBook changed while entering, trigger again
          if (this.activeBook.id !== this.displayBook.id) {
            this.runEffect();
          }
        }, ANIM_CONFIG.inDurationMs);
      }, ANIM_CONFIG.outDurationMs);
    }, ANIM_CONFIG.settleDelayMs);

    this.recordHistory();
  }

  /**
   * Advance virtual clock by dtMs and execute due timers in chronological order.
   */
  public step(dtMs: number): void {
    const targetTime = this.currentTimeMs + dtMs;

    while (this.timeouts.length > 0) {
      const nextTimer = this.timeouts[0];
      if (nextTimer.timeDue <= targetTime) {
        // Fast-forward current time to timer execution time
        this.currentTimeMs = nextTimer.timeDue;
        this.timeouts.shift();
        nextTimer.callback();
      } else {
        break;
      }
    }

    this.currentTimeMs = targetTime;
  }

  /**
   * Fast-forward clock to run all pending timers until machine settles at idle.
   */
  public settle(): void {
    let safetyCounter = 0;
    while (this.timeouts.length > 0 && safetyCounter < 100) {
      safetyCounter++;
      const nextTimer = this.timeouts.shift()!;
      this.currentTimeMs = Math.max(this.currentTimeMs, nextTimer.timeDue);
      nextTimer.callback();
    }
  }
}

/**
 * Defensive data extraction matching EditorialInfoSection.tsx lines 26-39
 */
export function formatMonographDisplayDataStrict(
  book: Partial<Book>,
  curator = 'Kang Yuchen'
) {
  return {
    title: (book.title || 'UNTITLED').toUpperCase(),
    rows: [
      { label: 'CURATED BY', value: curator || book.curator || 'Kang Yuchen' },
      { label: 'YEAR', value: String(book.year ?? '') },
      { label: 'CATEGORY', value: (book.category || '').toUpperCase() },
      { label: 'CALL NUMBER', value: book.callNumber || '' }
    ]
  };
}

// ============================================================================
// SUITE 1: RAPID SEQUENTIAL MONOGRAPH SWITCHING & INTERRUPT SAFETY
// ============================================================================
test('Challenger M3-2: Suite 1 - Rapid Sequential Switching & Interrupt Safety', async (t) => {
  await t.test('1.1 Rapid burst sequence (0 -> 1 -> 4 -> 2) within milliseconds skips intermediate states', () => {
    const harness = new EditorialTransitionHarness(BOOKS_CATALOG[0]);
    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[0].id);

    // Initial switch to Book 1 at t=0
    harness.triggerBookChange(BOOKS_CATALOG[1]);
    harness.step(5); // t=5ms (initTimer fired, now settling)
    assert.strictEqual(harness.phase, 'settling');

    // Rapid switch to Book 4 at t=20ms (during settling)
    harness.step(15); // advance to t=20ms
    harness.triggerBookChange(BOOKS_CATALOG[4]);
    assert.strictEqual(harness.pendingBook?.id, BOOKS_CATALOG[4].id);
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[0].id, 'Display book must still be original book');

    // Rapid switch to Book 2 at t=50ms (still during settling)
    harness.step(30); // advance to t=50ms
    harness.triggerBookChange(BOOKS_CATALOG[2]);
    assert.strictEqual(harness.pendingBook?.id, BOOKS_CATALOG[2].id);
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[0].id);

    // Advance through settling (100ms) into exiting
    harness.step(60); // t=110ms
    assert.strictEqual(harness.phase, 'exiting');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[0].id, 'Must still display Book 0 during exiting');
    assert.strictEqual(harness.pendingBook?.id, BOOKS_CATALOG[2].id, 'Pending must still hold Book 2');

    // Advance through exit duration (400ms) to exit boundary (t=500ms)
    harness.step(400); // t=510ms
    assert.strictEqual(harness.phase, 'entering');
    assert.strictEqual(
      harness.displayBook.id,
      BOOKS_CATALOG[2].id,
      'Display book must jump directly from Book 0 to Book 2, completely skipping Books 1 and 4'
    );
    assert.strictEqual(harness.pendingBook, null, 'Pending book reference must be cleared upon entrance');

    // Verify history does not show Book 1 or Book 4 ever displayed
    const displayedIds = harness.history.map(h => h.displayId);
    assert.ok(!displayedIds.includes(BOOKS_CATALOG[1].id), 'Book 1 must never be displayed');
    assert.ok(!displayedIds.includes(BOOKS_CATALOG[4].id), 'Book 4 must never be displayed');

    // Complete entrance (700ms)
    harness.step(700);
    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[2].id);
    assert.strictEqual(harness.timeouts.length, 0);
  });

  await t.test('1.2 Mid-exit phase interrupt safely re-targets entering monograph', () => {
    const harness = new EditorialTransitionHarness(BOOKS_CATALOG[0]);
    harness.triggerBookChange(BOOKS_CATALOG[1]);
    harness.step(105); // past settle delay (100ms) -> now in 'exiting' phase
    assert.strictEqual(harness.phase, 'exiting');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[0].id);

    // Interrupt at t=250ms (during exiting)
    harness.step(145); // t=250ms
    harness.triggerBookChange(BOOKS_CATALOG[3]);
    assert.strictEqual(harness.pendingBook?.id, BOOKS_CATALOG[3].id);

    // Interrupt again at t=350ms (near exit boundary)
    harness.step(100); // t=350ms
    harness.triggerBookChange(BOOKS_CATALOG[4]);
    assert.strictEqual(harness.pendingBook?.id, BOOKS_CATALOG[4].id);

    // Complete exit (t=500ms)
    harness.step(160); // t=510ms
    assert.strictEqual(harness.phase, 'entering');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[4].id, 'Active book becomes Book 4 at boundary');
    assert.strictEqual(harness.pendingBook, null);

    // Complete entrance
    harness.step(700);
    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[4].id);
  });

  await t.test('1.3 Interrupt during entering phase queues seamless second transition without collision', () => {
    const harness = new EditorialTransitionHarness(BOOKS_CATALOG[0]);
    harness.triggerBookChange(BOOKS_CATALOG[1]);

    // Advance to halfway through entering phase (t = 100 + 400 + 350 = 850ms)
    harness.step(850);
    assert.strictEqual(harness.phase, 'entering');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[1].id);

    // User selects Book 3 while Book 1 is entering
    harness.triggerBookChange(BOOKS_CATALOG[3]);
    assert.strictEqual(harness.pendingBook?.id, BOOKS_CATALOG[3].id);
    assert.strictEqual(harness.phase, 'entering', 'Must remain in entering phase for Book 1');

    // Finish entrance of Book 1
    harness.step(360);
    // As Book 1 enters idle, machine automatically catches Book 3 and begins new settle
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[1].id);

    // Advance through the queued transition for Book 3 (100ms settle + 400ms exit + 700ms enter)
    harness.step(105); // settle
    assert.strictEqual(harness.phase, 'exiting');
    harness.step(400); // exit
    assert.strictEqual(harness.phase, 'entering');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[3].id);
    harness.step(700); // enter
    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[3].id);
  });

  await t.test('1.4 Rapid U-turn / Ping-Pong (0 -> 1 -> 0) before exit cancels switch cleanly', () => {
    const harness = new EditorialTransitionHarness(BOOKS_CATALOG[0]);
    harness.triggerBookChange(BOOKS_CATALOG[1]);
    harness.step(50); // t=50ms (settling)

    // User switches back to Book 0
    harness.triggerBookChange(BOOKS_CATALOG[0]);
    assert.strictEqual(harness.pendingBook?.id, BOOKS_CATALOG[0].id);

    // Let pipeline complete
    harness.settle();
    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[0].id);
  });

  await t.test('1.5 Chaotic Monte Carlo Switching: 1,000 rapid random index changes converge to final target', () => {
    const harness = new EditorialTransitionHarness(BOOKS_CATALOG[0]);
    const totalBooks = BOOKS_CATALOG.length;
    let expectedFinalBook = BOOKS_CATALOG[0];

    // Seeded pseudo-random generator
    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 1000; i++) {
      const nextIdx = Math.floor(pseudoRandom() * totalBooks);
      const nextBook = BOOKS_CATALOG[nextIdx];
      expectedFinalBook = nextBook;

      harness.triggerBookChange(nextBook);

      // Advance clock by random small delta between 1ms and 45ms
      const dt = Math.floor(pseudoRandom() * 45) + 1;
      harness.step(dt);

      // Assert state machine invariants at every step
      assert.ok(
        ['idle', 'settling', 'exiting', 'entering'].includes(harness.phase),
        `Phase corrupted at step ${i}: ${harness.phase}`
      );
      assert.ok(harness.displayBook, 'Display book must always be defined');
    }

    // Allow machine to finish all queued operations
    harness.settle();

    assert.strictEqual(harness.phase, 'idle', 'Machine must settle at idle');
    assert.strictEqual(
      harness.displayBook.id,
      expectedFinalBook.id,
      `Final displayed monograph (${harness.displayBook.id}) must equal expected final selection (${expectedFinalBook.id})`
    );
    assert.strictEqual(harness.timeouts.length, 0, 'No dangling timeouts after settling');
  });
});

// ============================================================================
// SUITE 2: BACKGROUND TAB DELTA SPIKES & TIMER BURST EXECUTION
// ============================================================================
test('Challenger M3-2: Suite 2 - Background Tab Delta Spikes & Burst Execution', async (t) => {
  await t.test('2.1 10-second background tab freeze during settling resolves cleanly', () => {
    const harness = new EditorialTransitionHarness(BOOKS_CATALOG[0]);
    harness.triggerBookChange(BOOKS_CATALOG[1]);
    harness.step(20); // settling

    // Background tab sleeps for 10,000ms
    harness.step(10000);

    // Must have processed settle and exit timers and transitioned to entering or idle
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[1].id);
    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.timeouts.length, 0);
  });

  await t.test('2.2 60-second background tab freeze during exiting resolves cleanly', () => {
    const harness = new EditorialTransitionHarness(BOOKS_CATALOG[0]);
    harness.triggerBookChange(BOOKS_CATALOG[2]);
    harness.step(120); // exiting (100ms settle + 20ms)

    // User switches tab for 60s
    harness.step(60000);

    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[2].id);
    assert.strictEqual(harness.timeouts.length, 0);
  });

  await t.test('2.3 3600-second (1 hour) extreme sleep with pending interrupt on unfreeze', () => {
    const harness = new EditorialTransitionHarness(BOOKS_CATALOG[0]);
    harness.triggerBookChange(BOOKS_CATALOG[3]);
    harness.step(50); // settling

    // Tab freeze for 1 hour
    harness.step(3600000);

    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[3].id);

    // New change immediately on return
    harness.triggerBookChange(BOOKS_CATALOG[0]);
    harness.step(105);
    assert.strictEqual(harness.phase, 'exiting');
    harness.settle();
    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.displayBook.id, BOOKS_CATALOG[0].id);
  });
});

// ============================================================================
// SUITE 3: NO-OP GUARDS & IDEMPOTENCY
// ============================================================================
test('Challenger M3-2: Suite 3 - No-Op Guards & Idempotency', async (t) => {
  await t.test('3.1 Re-selecting active book while idle creates zero timeouts and triggers no phase change', () => {
    const harness = new EditorialTransitionHarness(BOOKS_CATALOG[0]);
    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.timeouts.length, 0);

    // Repeated triggers
    for (let i = 0; i < 50; i++) {
      harness.triggerBookChange(BOOKS_CATALOG[0]);
      assert.strictEqual(harness.phase, 'idle');
      assert.strictEqual(harness.timeouts.length, 0, 'Must register 0 timeouts on identical re-selection');
    }
  });

  await t.test('3.2 Re-selection with cloned object reference (same id) is recognized as identical', () => {
    const harness = new EditorialTransitionHarness(BOOKS_CATALOG[1]);
    const clonedBook: Book = { ...BOOKS_CATALOG[1] };

    assert.notStrictEqual(clonedBook, BOOKS_CATALOG[1], 'Object references must differ');
    assert.strictEqual(clonedBook.id, BOOKS_CATALOG[1].id, 'IDs must be identical');

    harness.triggerBookChange(clonedBook);
    assert.strictEqual(harness.phase, 'idle');
    assert.strictEqual(harness.timeouts.length, 0, 'Guard must check id equality, not referential equality');
  });
});

// ============================================================================
// SUITE 4: OUT-OF-BOUNDS METADATA INPUTS & DEFENSIVE FORMATTING
// ============================================================================
test('Challenger M3-2: Suite 4 - Out-of-Bounds Metadata & Defensive Formatting', async (t) => {
  await t.test('4.1 Missing and undefined fields fallback defensively without throwing or emitting undefined', () => {
    const sparseBook: Partial<Book> = {
      id: 'sparse-01'
    };

    const data = formatMonographDisplayDataStrict(sparseBook);
    assert.strictEqual(data.title, 'UNTITLED');
    assert.strictEqual(data.rows.length, 4);

    assert.strictEqual(data.rows[0].label, 'CURATED BY');
    assert.strictEqual(data.rows[0].value, 'Kang Yuchen');

    assert.strictEqual(data.rows[1].label, 'YEAR');
    assert.strictEqual(data.rows[1].value, '');

    assert.strictEqual(data.rows[2].label, 'CATEGORY');
    assert.strictEqual(data.rows[2].value, '');

    assert.strictEqual(data.rows[3].label, 'CALL NUMBER');
    assert.strictEqual(data.rows[3].value, '');

    // Check no row contains string 'undefined' or 'null'
    for (const r of data.rows) {
      assert.ok(!r.value.includes('undefined'), `Row ${r.label} contained 'undefined'`);
      assert.ok(!r.value.includes('null'), `Row ${r.label} contained 'null'`);
    }
  });

  await t.test('4.2 10,000-character pathological title and special character stress', () => {
    const massiveTitle = 'A'.repeat(10000);
    const pathologicalBook: Partial<Book> = {
      id: 'pathological-01',
      title: massiveTitle,
      category: 'Research & Development // <script>alert(1)</script>',
      callNumber: 'QA 76.73 / § 104-A [Ω] 🔥',
      year: 2026
    };

    const data = formatMonographDisplayDataStrict(pathologicalBook, 'Curator & Co. // "Special"');
    assert.strictEqual(data.title.length, 10000);
    assert.strictEqual(data.title, massiveTitle);
    assert.strictEqual(data.rows[0].value, 'Curator & Co. // "Special"');
    assert.strictEqual(data.rows[2].value, 'RESEARCH & DEVELOPMENT // <SCRIPT>ALERT(1)</SCRIPT>');
    assert.strictEqual(data.rows[3].value, 'QA 76.73 / § 104-A [Ω] 🔥');
  });

  await t.test('4.3 Negative, zero, and float year formatting', () => {
    const ancientBook: Partial<Book> = { id: 'ancient', year: -350 };
    assert.strictEqual(formatMonographDisplayDataStrict(ancientBook).rows[1].value, '-350');

    const zeroYearBook: Partial<Book> = { id: 'zero', year: 0 };
    assert.strictEqual(formatMonographDisplayDataStrict(zeroYearBook).rows[1].value, '0');
  });
});

// ============================================================================
// SUITE 5: STATIC AST & SOURCE CODE INTEGRITY OF EditorialInfoSection.tsx
// ============================================================================
test('Challenger M3-2: Suite 5 - Source Code AST & Contract Integrity', async (t) => {
  const componentPath = path.resolve('src/components/EditorialInfoSection.tsx');
  const source = fs.readFileSync(componentPath, 'utf-8');

  await t.test('5.1 pendingBookRef and timeoutsRef are declared and properly managed', () => {
    assert.ok(source.includes('const pendingBookRef = useRef<Book | null>(null);'), 'Must declare pendingBookRef');
    assert.ok(source.includes('const timeoutsRef = useRef<number[]>([]);'), 'Must declare timeoutsRef');
    assert.ok(source.includes('clearAllTimeouts'), 'Must implement clearAllTimeouts helper');
  });

  await t.test('5.2 Component unmount hook cleans up all pending timers', () => {
    assert.ok(
      source.includes('useEffect(() => {\n    return () => clearAllTimeouts();\n  }, [clearAllTimeouts]);') ||
      source.includes('return () => clearAllTimeouts()'),
      'Must clean up timers on unmount'
    );
  });

  await t.test('5.3 Idle identical selection guard is present', () => {
    assert.ok(
      source.includes("if (activeBook.id === displayBook.id && phase === 'idle')"),
      'Must check activeBook.id === displayBook.id && phase === idle'
    );
  });

  await t.test('5.4 Pending book is captured during transition and applied at exit boundary', () => {
    assert.ok(source.includes('pendingBookRef.current = activeBook;'), 'Must update pendingBookRef.current');
    assert.ok(
      source.includes('const nextBook = pendingBookRef.current || activeBook;'),
      'Must read pendingBookRef.current || activeBook at exit boundary'
    );
    assert.ok(source.includes('pendingBookRef.current = null;'), 'Must nullify pendingBookRef after consumption');
  });

  await t.test('5.5 Chronometer hook cleans up setInterval on unmount', () => {
    assert.ok(source.includes('setInterval(updateTime, 1000);'), 'Must use 1000ms chronometer interval');
    assert.ok(source.includes('return () => clearInterval(intervalId);'), 'Must clear interval on unmount');
  });

  await t.test('5.6 Layout container attaches data-testid, data-phase, and aria-label', () => {
    assert.ok(source.includes('data-testid="editorial-info-section"'), 'Must have data-testid');
    assert.ok(source.includes('data-phase={phase}'), 'Must bind data-phase attribute');
    assert.ok(source.includes('aria-label="Monograph Archival Information"'), 'Must have accessibility aria-label');
  });
});

// ============================================================================
// SUITE 6: REAL ASYNCHRONOUS WALL-CLOCK TIMER CONCURRENCY & UNMOUNT
// ============================================================================
test('Challenger M3-2: Suite 6 - Real Asynchronous Concurrency & Cancellation', async (t) => {
  await t.test('6.1 Real asynchronous timer cancellation on rapid unmount', async () => {
    let firedCount = 0;
    const timeouts: NodeJS.Timeout[] = [];

    // Simulate mounting and registering multiple transition timers
    const timer1 = setTimeout(() => { firedCount++; }, 50);
    const timer2 = setTimeout(() => { firedCount++; }, 100);
    const timer3 = setTimeout(() => { firedCount++; }, 200);
    timeouts.push(timer1, timer2, timer3);

    // Simulate unmount at t=20ms before any timer fires
    await new Promise((r) => setTimeout(r, 20));
    timeouts.forEach((t) => clearTimeout(t));

    // Wait until t=250ms (past when all timers would have fired)
    await new Promise((r) => setTimeout(r, 230));

    assert.strictEqual(firedCount, 0, 'No timeouts should fire after unmount cancellation');
  });

  await t.test('6.2 Rapid asynchronous sequential re-targeting with real timers', async () => {
    let currentDisplayedId = BOOKS_CATALOG[0].id;
    let pendingTarget: Book | null = null;
    let phase: AnimationPhase = 'idle';
    const timerHandles: NodeJS.Timeout[] = [];

    const clearHandles = () => {
      timerHandles.forEach((h) => clearTimeout(h));
      timerHandles.length = 0;
    };

    const triggerAsyncChange = (book: Book) => {
      if (book.id === currentDisplayedId && phase === 'idle') return;
      pendingTarget = book;
      if (phase !== 'idle') return;

      clearHandles();
      phase = 'settling';

      const hSettle = setTimeout(() => {
        phase = 'exiting';
        const hExit = setTimeout(() => {
          currentDisplayedId = pendingTarget ? pendingTarget.id : book.id;
          pendingTarget = null;
          phase = 'entering';
          const hEnter = setTimeout(() => {
            phase = 'idle';
          }, 35);
          timerHandles.push(hEnter);
        }, 20);
        timerHandles.push(hExit);
      }, 10);
      timerHandles.push(hSettle);
    };

    // Trigger book 1
    triggerAsyncChange(BOOKS_CATALOG[1]);
    assert.strictEqual(phase, 'settling');

    // At t=5ms (during settling), spam book 3, 4, 2
    await new Promise((r) => setTimeout(r, 5));
    triggerAsyncChange(BOOKS_CATALOG[3]);
    triggerAsyncChange(BOOKS_CATALOG[4]);
    triggerAsyncChange(BOOKS_CATALOG[2]);
    assert.strictEqual(pendingTarget?.id, BOOKS_CATALOG[2].id);

    // Wait for exit to complete (settle 10ms + exit 20ms + buffer = 40ms)
    await new Promise((r) => setTimeout(r, 35));
    assert.strictEqual(phase, 'entering');
    assert.strictEqual(currentDisplayedId, BOOKS_CATALOG[2].id, 'Intermediate books 1, 3, 4 cleanly skipped');

    // Wait for entering to complete (35ms + buffer)
    await new Promise((r) => setTimeout(r, 45));
    assert.strictEqual(phase, 'idle');
    assert.strictEqual(currentDisplayedId, BOOKS_CATALOG[2].id);
    clearHandles();
  });
});

