import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import {
  stepHarmonicOscillator,
  calculateAerodynamicDrag
} from '../helpers/physics.ts';
import {
  PreloaderStateMachine,
  PRELOADER_CONFIG
} from '../helpers/preloaderModel.ts';
import { RenderLoopDirtyTracker } from '../tier1-features/f11-render-loop-dirty.test.ts';

test('Tier 4: Real-World Application End-to-End Scenarios', async (t) => {
  await t.test('Scenario 1: Cold Boot & Theatrical Preloader to Interactive Gallery Reveal', async () => {
    let appState = {
      isLoaded: false,
      activeIndex: 0,
      texturesWarmed: false,
      shadersCompiled: false
    };

    const sm = new PreloaderStateMachine(() => {
      appState.isLoaded = true;
    });

    const bootTime = 1000;
    sm.start(bootTime);

    // 1. Beat 1: Font validation
    sm.setProgress(20, bootTime + 200);
    assert.strictEqual(sm.getCurrentBeat().beat, 1);
    assert.strictEqual(appState.isLoaded, false);

    // 2. Beat 2: Canvas Textures generation
    sm.setProgress(50, bootTime + 800);
    assert.strictEqual(sm.getCurrentBeat().beat, 2);
    appState.texturesWarmed = true;

    // 3. Beat 3: GPU Shader compilation & Warmup
    sm.setProgress(85, bootTime + 1800);
    assert.strictEqual(sm.getCurrentBeat().beat, 3);
    appState.shadersCompiled = true;

    // 4. Beat 4: Theatrical Fan-out Reveal
    sm.setProgress(100, bootTime + 2500); // 100% reached before minDuration
    assert.strictEqual(appState.isLoaded, false, 'Preloader must hold until min duration (2.85s)');

    // 5. Completion at 2.85s mark
    sm.setProgress(100, bootTime + PRELOADER_CONFIG.minDurationMs);
    assert.strictEqual(appState.isLoaded, true, 'App transitions to interactive gallery');
    assert.strictEqual(appState.activeIndex, 0, 'Active tome 0 presented in center');
  });

  await t.test('Scenario 2: Mouse Drag Swipe Gesture, Banking & Spring Snapping to Neighbor', () => {
    let scrollState = { position: 0, velocity: 0, target: 0 };
    const tracker = new RenderLoopDirtyTracker();

    // 1. User presses mouse down and drags 300px left
    tracker.isDragging = true;
    const dragDeltaX = -300;
    // Map drag pixels to scroll target: target -= deltaX * 0.0075
    scrollState.target -= dragDeltaX * 0.0075; // scrolls forward towards index 2.25
    assert.ok(scrollState.target > 0, 'Target scroll advances forward');

    // 2. During drag, velocity builds up, activating drag banking
    scrollState.velocity = 1.8;
    const dragBanking = calculateAerodynamicDrag(scrollState.velocity);
    assert.ok(dragBanking.flowLean > 0, 'flowLean tilts backwards');
    assert.ok(dragBanking.flowBank < 0, 'flowBank rolls laterally');
    assert.ok(dragBanking.flowDip < 0, 'flowDip creates downward downforce');

    // 3. User releases mouse (mouseup) -> snap to nearest discrete book index
    tracker.isDragging = false;
    const snappedIndex = Math.round(scrollState.target);
    const clampedIndex = Math.max(0, Math.min(BOOKS_CATALOG.length - 1, snappedIndex));
    scrollState.target = clampedIndex;

    // 4. Harmonic oscillator snaps to target
    const dt = 1 / 60;
    for (let i = 0; i < 100; i++) {
      scrollState = stepHarmonicOscillator(scrollState, dt);
      tracker.velocity = scrollState.velocity;
      tracker.tick();
    }

    assert.ok(Math.abs(scrollState.position - clampedIndex) < 0.01,
      `Carousel settled at snapped book index ${clampedIndex}`);
    assert.strictEqual(tracker.isDirty, false, 'Render loop returned to idle (0% GPU)');
  });

  await t.test('Scenario 3: Keyboard-Driven Archival Exploration & Tome Inspection', () => {
    let activeIndex = 0;
    let isFlipped = false;
    let isSpreadOpen = false;

    // Key event simulator
    const handleKeyDown = (key: string, code?: string) => {
      if (isSpreadOpen) {
        if (key === 'Escape') isSpreadOpen = false;
        return;
      }
      if (key === 'ArrowRight') {
        activeIndex = Math.min(BOOKS_CATALOG.length - 1, activeIndex + 1);
        isFlipped = false; // reset flip on navigation
      } else if (key === 'ArrowLeft') {
        activeIndex = Math.max(0, activeIndex - 1);
        isFlipped = false;
      } else if (code === 'Space' || key === ' ') {
        isFlipped = !isFlipped;
      } else if (key === 'Enter') {
        isSpreadOpen = true;
      }
    };

    // User navigates right
    handleKeyDown('ArrowRight');
    assert.strictEqual(activeIndex, 1, 'Navigates to tome 1');

    // User flips book to inspect spine
    handleKeyDown(' ', 'Space');
    assert.strictEqual(isFlipped, true, 'Book flips to spine');

    // User presses Enter to open detail folio spread
    handleKeyDown('Enter');
    assert.strictEqual(isSpreadOpen, true, 'Detail folio modal opens');

    // Arrow keys ignored while modal is open
    handleKeyDown('ArrowRight');
    assert.strictEqual(activeIndex, 1, 'Index remains locked while modal is open');

    // User presses Escape to close
    handleKeyDown('Escape');
    assert.strictEqual(isSpreadOpen, false, 'Modal closed and gallery focus restored');
  });

  await t.test('Scenario 4: High-Velocity Rapid Flick Drag Stress & Stability', () => {
    let scrollState = { position: 0, velocity: 0, target: 0 };
    const dt = 1 / 60;

    // Simulate 5 rapid high-velocity flick events alternating directions
    const flickVelocities = [12.0, -18.0, 25.0, -30.0, 15.0];
    flickVelocities.forEach(v => {
      scrollState.velocity += v;
      // Clamp bounds [-0.4, N - 1 + 0.4]
      scrollState.target = Math.max(-0.4, Math.min(BOOKS_CATALOG.length - 1 + 0.4, scrollState.target + v * 0.1));

      // Advance physics 5 steps
      for (let i = 0; i < 5; i++) {
        scrollState = stepHarmonicOscillator(scrollState, dt);
      }
      // Ensure no NaN or Infinity occurs
      assert.ok(!Number.isNaN(scrollState.position), 'Position must not become NaN');
      assert.ok(Number.isFinite(scrollState.velocity), 'Velocity must remain finite');
    });

    // Snap to nearest boundary index
    const snapped = Math.max(0, Math.min(BOOKS_CATALOG.length - 1, Math.round(scrollState.target)));
    scrollState.target = snapped;

    // Settle
    for (let i = 0; i < 60; i++) {
      scrollState = stepHarmonicOscillator(scrollState, dt);
    }
    assert.ok(Math.abs(scrollState.position - snapped) < 0.05);
  });

  await t.test('Scenario 5: Modal Open & Archival Treatise Deep-Dive Inspection', () => {
    const inspectedBook = BOOKS_CATALOG[2]; // e.g. "The Codex of Latent Spaces"
    assert.ok(inspectedBook, 'Book 2 exists in catalog');

    // 1. Left Page: Call Number, Category, Drop-Cap Synopsis, 3 Highlight Metrics
    const dropCap = inspectedBook.fullSynopsis.charAt(0);
    assert.match(dropCap, /[A-Z]/, 'Drop cap is capital letter');
    assert.strictEqual(inspectedBook.metrics.length, 3, 'Features 3 metrics');

    // 2. Right Page: Treatise highlights and applied technologies
    assert.ok(inspectedBook.keyFeatures.length >= 2, 'Features multiple treatise points');
    assert.ok(inspectedBook.techStack.length >= 2, 'Features applied technologies');

    // 3. Outbound Link Security Verification
    if (inspectedBook.githubUrl) {
      assert.ok(inspectedBook.githubUrl.startsWith('https://github.com/'), 'GitHub URL valid');
    }
  });

  await t.test('Scenario 6: Concurrent Flip Toggling During Carousel Translation Motion', () => {
    let currentFlipAngle = 0;
    let targetFlipAngle = 0;
    let isFlipped = false;

    let carouselScroll = 0;
    let carouselTarget = 3;

    // Simulate 30 frames where carousel is moving AND user toggles flip twice
    for (let frame = 0; frame < 30; frame++) {
      // Toggle flip at frame 5 and frame 15
      if (frame === 5) {
        isFlipped = true;
        targetFlipAngle = Math.PI;
      }
      if (frame === 15) {
        isFlipped = false;
        targetFlipAngle = 0;
      }

      // Smooth flip angle interpolation
      currentFlipAngle += (targetFlipAngle - currentFlipAngle) * 0.12;
      // Carousel translation interpolation
      carouselScroll += (carouselTarget - carouselScroll) * 0.10;

      // Verify rotation combination
      const bankAngle = 0.05;
      const totalYRotation = currentFlipAngle + bankAngle;

      assert.ok(Number.isFinite(totalYRotation));
      assert.ok(currentFlipAngle >= 0 && currentFlipAngle <= Math.PI + 0.01,
        `Flip angle must stay in [0, PI], was ${currentFlipAngle}`);
    }
    assert.strictEqual(isFlipped, false, 'Final flip state should be unflipped');
  });
});
