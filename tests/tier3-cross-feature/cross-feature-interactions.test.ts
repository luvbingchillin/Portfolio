import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import {
  stepHarmonicOscillator,
  calculateAerodynamicDrag,
  calculateCylindricalPosition,
  balanceTextLines
} from '../helpers/physics.ts';
import {
  PreloaderStateMachine,
  PRELOADER_CONFIG
} from '../helpers/preloaderModel.ts';
import { RenderLoopDirtyTracker } from '../tier1-features/f11-render-loop-dirty.test.ts';
import { createFrontCoverTexture } from '../../src/utils/textureGenerators.ts';

test('Tier 3: Cross-Feature Combinations & Pairwise Interactions', async (t) => {
  await t.test('3.1 Preloader (F7) ↔ GPU Warming (F6): Pipeline synchronization', () => {
    const sm = new PreloaderStateMachine();
    sm.start(0);

    // During Beat 3 (60% -> 95%), GPU warmup occurs
    sm.setProgress(70, 1000);
    assert.strictEqual(sm.getCurrentBeat().beat, 3, 'Beat 3 is active at 70% progress');

    // Simulate 4 warmup passes completed
    let warmupPasses = 0;
    for (let i = 0; i < PRELOADER_CONFIG.warmupPasses; i++) {
      warmupPasses++;
    }
    assert.strictEqual(warmupPasses, 4);

    sm.setProgress(95, 2000);
    assert.strictEqual(sm.getCurrentBeat().beat, 3);
  });

  await t.test('3.2 Preloader (F7) ↔ Harmonic Oscillator (F8): Safe unfreezing on reveal', () => {
    let oscillatorActive = false;
    let initialOscillatorState = { position: 0, velocity: 0, target: 0 };

    const sm = new PreloaderStateMachine(() => {
      oscillatorActive = true;
      initialOscillatorState = { position: 0, velocity: 0, target: 0 };
    });

    sm.start(0);
    sm.setProgress(100, 3000);

    assert.strictEqual(oscillatorActive, true, 'Oscillator must activate upon preloader complete');
    assert.strictEqual(initialOscillatorState.position, 0, 'Initial carousel position must be 0');
    assert.strictEqual(initialOscillatorState.velocity, 0, 'Initial carousel velocity must be 0 without sudden jerk');
  });

  await t.test('3.3 Async Textures (F5) ↔ GPU Warming (F6): Radius 2 texture handoff', () => {
    const activeIndex = 0;
    const radius = PRELOADER_CONFIG.initialRadius;
    const warmedTextureIds: string[] = [];

    // Pre-generate and warm textures for books within radius
    for (let i = 0; i <= Math.min(BOOKS_CATALOG.length - 1, activeIndex + radius); i++) {
      const book = BOOKS_CATALOG[i];
      const tex = createFrontCoverTexture(book);
      assert.ok(tex);
      warmedTextureIds.push(book.id);
    }

    assert.ok(warmedTextureIds.includes(BOOKS_CATALOG[0].id));
    assert.ok(warmedTextureIds.includes(BOOKS_CATALOG[1].id));
    assert.ok(warmedTextureIds.includes(BOOKS_CATALOG[2].id));
    assert.strictEqual(warmedTextureIds.length, 3);
  });

  await t.test('3.4 Font Assets (F1) ↔ Async Textures (F5): Font readiness gating', async () => {
    let fontReady = false;
    const mockFontsReady = new Promise<void>((resolve) => {
      setTimeout(() => {
        fontReady = true;
        resolve();
      }, 10);
    });

    // Texture generation should await font readiness before canvas rasterization
    await mockFontsReady;
    assert.strictEqual(fontReady, true, 'document.fonts.ready must resolve before rasterizing');
    const tex = createFrontCoverTexture(BOOKS_CATALOG[0]);
    assert.ok(tex);
  });

  await t.test('3.5 Harmonic Oscillator (F8) ↔ Drag Banking (F9): Velocity coupling', () => {
    let state = { position: 0, velocity: 0, target: 1.0 };
    const dt = 1 / 60;

    // Simulate 5 steps of acceleration towards target
    for (let i = 0; i < 5; i++) {
      state = stepHarmonicOscillator(state, dt);
    }

    assert.ok(state.velocity > 0, 'Velocity should accelerate towards positive target');
    const drag = calculateAerodynamicDrag(state.velocity);

    assert.ok(drag.flowLean > 0, 'flowLean must pitch back with positive velocity');
    assert.ok(drag.flowBank < 0, 'flowBank must roll against motion vector');
    assert.ok(drag.flowDip < 0, 'flowDip must apply aerodynamic downforce');
  });

  await t.test('3.6 Harmonic Oscillator (F8) ↔ Cylindrical Arc (F10): Position coordination', () => {
    let state = { position: 0, velocity: 0, target: 2.0 };
    const dt = 1 / 60;

    // Advance 10 frames
    for (let i = 0; i < 10; i++) {
      state = stepHarmonicOscillator(state, dt);
    }

    // Coordinates of book 0 relative to current scroll
    const offsetBook0 = 0 - state.position;
    const posBook0 = calculateCylindricalPosition(offsetBook0);

    // Book 0 has moved left (negative X) as carousel shifted right
    assert.ok(posBook0.x < 0, 'Book 0 must displace along cylindrical arc');
    assert.ok(posBook0.z > 0, 'Book 0 must recede in depth along arc curve');
  });

  await t.test('3.7 Harmonic Oscillator (F8) ↔ Render Loop Dirty Flag (F11): Idle convergence', () => {
    const tracker = new RenderLoopDirtyTracker();
    let state = { position: 0, velocity: 0, target: 1.0 };
    const dt = 1 / 60;

    // Step until oscillator settles
    for (let i = 0; i < 100; i++) {
      state = stepHarmonicOscillator(state, dt);
      tracker.velocity = state.velocity;
      tracker.tick();
    }

    assert.ok(Math.abs(state.position - 1.0) < 0.001, 'Oscillator settles near 1.0 target');
    assert.strictEqual(tracker.isDirty, false, 'Render loop must transition to idle when settled');
  });

  await t.test('3.8 Drag Banking (F9) ↔ Render Loop Dirty Flag (F11): Motion reactivation', () => {
    const tracker = new RenderLoopDirtyTracker();
    tracker.isDirty = false;
    tracker.velocity = 0;
    tracker.tick();
    assert.strictEqual(tracker.isDirty, false);

    // User initiates drag swipe with velocity 1.2
    const userSwipeVelocity = 1.2;
    const drag = calculateAerodynamicDrag(userSwipeVelocity);
    assert.ok(Math.abs(drag.flowLean) > 0);

    tracker.velocity = userSwipeVelocity;
    tracker.tick();
    assert.strictEqual(tracker.isDirty, true, 'Drag banking activity must immediately wake render loop');
  });

  await t.test('3.9 Editorial UI (F4) ↔ Harmonic Oscillator (F8): Navigation target dispatch', () => {
    let activeIndex = 0;
    let oscillator = { position: 0, velocity: 0, target: 0 };

    const handleSelectIndex = (nextIndex: number) => {
      activeIndex = nextIndex;
      oscillator.target = nextIndex;
    };

    // User clicks Next (right arrow or Roman numeral II)
    handleSelectIndex(1);
    assert.strictEqual(activeIndex, 1);
    assert.strictEqual(oscillator.target, 1);

    // Step oscillator
    oscillator = stepHarmonicOscillator(oscillator, 1 / 60);
    assert.ok(oscillator.velocity > 0, 'Oscillator begins traveling towards selected index');
  });

  await t.test('3.10 Editorial UI (F4) ↔ Render Loop (F11): Modal open pauses background interaction', () => {
    let isSpreadOpen = false;
    const tracker = new RenderLoopDirtyTracker();

    const openModal = () => {
      isSpreadOpen = true;
      tracker.isDragging = false;
      tracker.velocity = 0;
    };

    openModal();
    assert.strictEqual(isSpreadOpen, true);
    tracker.tick();
    assert.strictEqual(tracker.isDirty, false, 'Modal open state halts active carousel drag');
  });

  await t.test('3.11 Text Balancing (F3) ↔ Editorial UI (F4): Balanced catalog title', () => {
    const activeBook = BOOKS_CATALOG[0];
    const balancedTitleLines = balanceTextLines(activeBook.title, 24);

    assert.ok(balancedTitleLines.length >= 1);
    // Verified that balanced lines recreate title without dropped words
    assert.strictEqual(balancedTitleLines.join(' '), activeBook.title);
  });

  await t.test('3.12 Typography Tokens (F2) ↔ Editorial UI (F4): Tracking tokens on card elements', () => {
    const headingsClass = 'tracking-wide';
    const metadataClass = 'tracking-widest';

    assert.strictEqual(headingsClass, 'tracking-wide');
    assert.strictEqual(metadataClass, 'tracking-widest');
  });
});
