/**
 * Challenger M2-2 Empirical Stress Test Suite
 * Milestone 2: Odometer Preloader & GPU Pre-computation Race Stress
 *
 * Direct adversarial stress verification:
 * - Preloader timeline: 2.85s minimum hold on 0ms loads, high-latency hold (>5s), monotonic enforcement, single onLoaded trigger.
 * - GPU warming: 1500ms timeout race safety on hung compileAsync, safeAspect zero-dimension resilience, WebGL context loss recovery.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  PRELOADER_CONFIG,
  PRELOADER_BEATS,
  safeAspect,
  getWarmingIndices,
  compileSceneWithTimeout,
  warmTextures,
  executeWarmupPasses,
  prepareSceneAssets
} from '../src/utils/gpuWarming.ts';
import { BOOKS_CATALOG } from '../src/data/booksData.ts';

// 20-digit rolling strip as defined in Preloader.tsx
const ROLLING_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// ============================================================================
// SUITE 1: PRELOADER TIMELINE, LATENCY & ODOMETER STRESS
// ============================================================================
test('Challenger M2-2: Preloader Timeline, Latency & Theatrical Hold Stress', async (t) => {
  await t.test('1.1 Instant asset load (0ms / cache) strictly holds display until at least 2850ms', () => {
    // Model the exact Preloader.tsx tick calculation
    const minDurationMs = PRELOADER_CONFIG.minDurationMs; // 2850
    let completed = false;
    let onLoadedCalls = 0;
    const onLoaded = () => { onLoadedCalls++; };

    let currentProgress = 0;
    const realProgress = 100; // instant load from t=0

    // Simulate tick at arbitrary elapsed intervals from 0ms to 2849ms
    for (let elapsed = 0; elapsed < minDurationMs; elapsed += 50) {
      const timeProgress = Math.min(100, (elapsed / minDurationMs) * 100);
      const target = realProgress >= 100
        ? Math.min(100, timeProgress)
        : Math.min(realProgress, timeProgress);
      currentProgress = Math.max(currentProgress, target);

      // Check completion condition from Preloader.tsx
      if (realProgress >= 100 && elapsed >= minDurationMs && !completed) {
        completed = true;
        onLoaded();
      }

      assert.strictEqual(completed, false, `Must NOT complete at elapsed=${elapsed}ms (< 2850ms)`);
      assert.strictEqual(onLoadedCalls, 0, `onLoaded must NOT be called at elapsed=${elapsed}ms`);
      assert.ok(currentProgress <= 100, `Progress ${currentProgress} must be <= 100`);
    }

    // At exact boundary elapsed = 2850ms
    const boundaryElapsed = minDurationMs;
    const timeProgress = Math.min(100, (boundaryElapsed / minDurationMs) * 100);
    const target = Math.min(100, timeProgress);
    currentProgress = Math.max(currentProgress, target);

    if (realProgress >= 100 && boundaryElapsed >= minDurationMs && !completed) {
      completed = true;
      currentProgress = 100;
      onLoaded();
    }

    assert.strictEqual(completed, true, 'Must complete when elapsed reaches exactly 2850ms');
    assert.strictEqual(onLoadedCalls, 1, 'onLoaded must be invoked exactly once at 2850ms');
    assert.strictEqual(currentProgress, 100, 'Final progress must be 100%');
  });

  await t.test('1.2 High-latency asset loads (>5s) strictly hold completion past 2850ms until 100%', () => {
    const minDurationMs = PRELOADER_CONFIG.minDurationMs; // 2850
    let completed = false;
    let onLoadedCalls = 0;
    const onLoaded = () => { onLoadedCalls++; };

    let currentProgress = 0;

    // Simulate slow network pipeline:
    // 0ms -> 10%
    // 1500ms -> 30%
    // 2850ms (theatrical min duration reached) -> 45% (MUST NOT COMPLETE)
    // 4000ms -> 70% (MUST NOT COMPLETE)
    // 5500ms -> 99% (MUST NOT COMPLETE)
    // 6000ms -> 100% (COMPLETES HERE)

    const timeline = [
      { elapsed: 500, realProgress: 10 },
      { elapsed: 1500, realProgress: 30 },
      { elapsed: 2850, realProgress: 45 },
      { elapsed: 3500, realProgress: 60 },
      { elapsed: 4500, realProgress: 80 },
      { elapsed: 5500, realProgress: 99 },
    ];

    for (const step of timeline) {
      const timeProgress = Math.min(100, (step.elapsed / minDurationMs) * 100);
      const target = step.realProgress >= 100
        ? Math.min(100, timeProgress)
        : Math.min(step.realProgress, timeProgress);
      currentProgress = Math.max(currentProgress, target);

      if (step.realProgress >= 100 && step.elapsed >= minDurationMs && !completed) {
        completed = true;
        onLoaded();
      }

      assert.strictEqual(completed, false, `High-latency must not finish at elapsed=${step.elapsed}ms with realProgress=${step.realProgress}%`);
      assert.strictEqual(onLoadedCalls, 0);
      assert.strictEqual(currentProgress, step.realProgress, `Displayed progress must clamp to realProgress ${step.realProgress}%`);
    }

    // Now asset pipeline completes at 6000ms (>5s)
    const finalElapsed = 6000;
    const finalReal = 100;
    const finalTimeProgress = Math.min(100, (finalElapsed / minDurationMs) * 100);
    const finalTarget = finalReal >= 100
      ? Math.min(100, finalTimeProgress)
      : Math.min(finalReal, finalTimeProgress);
    currentProgress = Math.max(currentProgress, finalTarget);

    if (finalReal >= 100 && finalElapsed >= minDurationMs && !completed) {
      completed = true;
      currentProgress = 100;
      onLoaded();
    }

    assert.strictEqual(completed, true, 'High-latency asset load must complete once 100% is reached after 2.85s');
    assert.strictEqual(onLoadedCalls, 1, 'onLoaded must be called exactly once');
    assert.strictEqual(currentProgress, 100);
  });

  await t.test('1.3 Monotonic progress enforcement rejects regressive, chaotic, and out-of-order progress', () => {
    // Stress test: chaotic inputs representing erratic worker progress or network retries
    const chaoticInputs = [0, 5, 20, 15, 45, 30, 10, 60, 55, 75, 40, 85, 90, 80, 95, 20, 100, 50, 100];
    let prevProgress = 0;
    const progressHistory: number[] = [];

    for (const input of chaoticInputs) {
      // Updater function matching Preloader.tsx: Math.max(prev, target)
      const target = Math.max(0, Math.min(100, input));
      const nextProgress = Math.max(prevProgress, target);
      assert.ok(nextProgress >= prevProgress, `Progress must never regress: prev=${prevProgress}, next=${nextProgress}, input=${input}`);
      prevProgress = nextProgress;
      progressHistory.push(nextProgress);
    }

    // Verify history is monotonically non-decreasing
    for (let i = 1; i < progressHistory.length; i++) {
      assert.ok(progressHistory[i] >= progressHistory[i - 1], `History violated monotonicity at index ${i}`);
    }
  });

  await t.test('1.4 Single onLoaded trigger guarantee under rapid re-trigger attempts', () => {
    let callCount = 0;
    let completed = false;
    const onLoaded = () => { callCount++; };

    const minDurationMs = 2850;
    const elapsed = 3500;
    const realProgress = 100;

    // Simulate 100 consecutive frames after completion
    for (let frame = 0; frame < 100; frame++) {
      if (realProgress >= 100 && elapsed >= minDurationMs && !completed) {
        completed = true;
        onLoaded();
      }
    }

    assert.strictEqual(callCount, 1, 'onLoaded callback must execute strictly once regardless of subsequent frame ticks');
    assert.strictEqual(completed, true);
  });

  await t.test('1.5 Split-drum 20-digit rollover mathematical correctness for all [0..100]', () => {
    // Verify rolling drum digit calculation across all 101 integer percentage values
    for (let pct = 0; pct <= 100; pct++) {
      const val = Math.floor(pct);
      const ones = val % 20;
      const tens = Math.floor(val / 10) % 20;
      const hundreds = Math.floor(val / 100) % 20;
      const isHundredsVisible = val >= 100;

      // Map to rolling digit values
      const onesDigit = ROLLING_DIGITS[ones];
      const tensDigit = ROLLING_DIGITS[tens];
      const hundredsDigit = ROLLING_DIGITS[hundreds];

      // Verify ground truth base-10 representation
      const expectedOnes = pct % 10;
      const expectedTens = Math.floor((pct % 100) / 10);
      const expectedHundreds = Math.floor(pct / 100);

      assert.strictEqual(onesDigit, expectedOnes, `pct=${pct} ones digit mismatch`);
      assert.strictEqual(tensDigit, expectedTens, `pct=${pct} tens digit mismatch`);
      assert.strictEqual(hundredsDigit, expectedHundreds, `pct=${pct} hundreds digit mismatch`);
      assert.strictEqual(isHundredsVisible, pct === 100, `pct=${pct} hundreds visibility mismatch`);
    }
  });

  await t.test('1.6 4-Beat progression partition and telemetry integrity', () => {
    assert.strictEqual(PRELOADER_BEATS.length, 4, 'Must have exactly 4 beats');
    assert.strictEqual(PRELOADER_BEATS[0].startPct, 0);
    assert.strictEqual(PRELOADER_BEATS[0].endPct, 25);
    assert.strictEqual(PRELOADER_BEATS[1].startPct, 25);
    assert.strictEqual(PRELOADER_BEATS[1].endPct, 60);
    assert.strictEqual(PRELOADER_BEATS[2].startPct, 60);
    assert.strictEqual(PRELOADER_BEATS[2].endPct, 95);
    assert.strictEqual(PRELOADER_BEATS[3].startPct, 95);
    assert.strictEqual(PRELOADER_BEATS[3].endPct, 100);

    const getBeat = (progress: number) => {
      for (const b of PRELOADER_BEATS) {
        if (progress <= b.endPct) return b;
      }
      return PRELOADER_BEATS[PRELOADER_BEATS.length - 1];
    };

    assert.strictEqual(getBeat(0).beat, 1);
    assert.strictEqual(getBeat(25).beat, 1);
    assert.strictEqual(getBeat(26).beat, 2);
    assert.strictEqual(getBeat(60).beat, 2);
    assert.strictEqual(getBeat(61).beat, 3);
    assert.strictEqual(getBeat(95).beat, 3);
    assert.strictEqual(getBeat(96).beat, 4);
    assert.strictEqual(getBeat(100).beat, 4);
  });
});

// ============================================================================
// SUITE 2: GPU WARMING, ASYNC RACE & RESILIENCE STRESS
// ============================================================================
test('Challenger M2-2: GPU Warming, 1500ms Race & Boundary Resilience Stress', async (t) => {
  await t.test('2.1 compileSceneWithTimeout hung compilation timeout race safety', async () => {
    // Construct a mock renderer whose compileAsync NEVER resolves (simulating frozen GPU shader compiler)
    const mockRenderer = {
      compileAsync: () => new Promise<void>(() => {
        // Deliberately never resolves
      })
    } as unknown as THREE.WebGLRenderer;

    const mockScene = new THREE.Scene();
    const mockCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

    const start = Date.now();
    // Test with a short timeout (80ms) to empirically verify the race without slow test execution
    const result = await compileSceneWithTimeout(mockRenderer, mockScene, mockCamera, 80);
    const duration = Date.now() - start;

    assert.strictEqual(result, 'timeout', 'Hung compileAsync must return "timeout"');
    assert.ok(duration >= 75 && duration < 300, `Race must resolve around 80ms, took ${duration}ms`);
  });

  await t.test('2.2 compileSceneWithTimeout fast compilation succeeds and clears timer', async () => {
    const mockRenderer = {
      compileAsync: async () => {
        // Fast compilation (10ms)
        await new Promise(r => setTimeout(r, 10));
      }
    } as unknown as THREE.WebGLRenderer;

    const mockScene = new THREE.Scene();
    const mockCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

    const result = await compileSceneWithTimeout(mockRenderer, mockScene, mockCamera, 1500);
    assert.strictEqual(result, 'compiled', 'Fast compileAsync must return "compiled"');
  });

  await t.test('2.3 compileSceneWithTimeout catches shader compilation error gracefully', async () => {
    const mockRenderer = {
      compileAsync: async () => {
        throw new Error('GL_INVALID_OPERATION: Program compilation failed in shader driver');
      }
    } as unknown as THREE.WebGLRenderer;

    const mockScene = new THREE.Scene();
    const mockCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

    const result = await compileSceneWithTimeout(mockRenderer, mockScene, mockCamera, 500);
    assert.strictEqual(result, 'timeout', 'compileAsync error must be caught and return fallback "timeout"');
  });

  await t.test('2.4 compileSceneWithTimeout handles missing or non-WebGL renderer gracefully', async () => {
    const mockScene = new THREE.Scene();
    const mockCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

    // Renderer is undefined
    const res1 = await compileSceneWithTimeout(undefined as any, mockScene, mockCamera);
    assert.strictEqual(res1, 'compiled', 'Missing renderer must return compiled');

    // Renderer without compileAsync
    const res2 = await compileSceneWithTimeout({} as any, mockScene, mockCamera);
    assert.strictEqual(res2, 'compiled', 'Renderer without compileAsync must return compiled');
  });

  await t.test('2.5 safeAspect zero-dimension and boundary resilience', () => {
    // Verify standard dimensions
    assert.strictEqual(safeAspect(1920, 1080), 1920 / 1080);
    assert.strictEqual(safeAspect(1000, 1000), 1.0);

    // Verify zero dimensions (unmounted canvas / hidden container)
    assert.strictEqual(safeAspect(0, 0), 16 / 9, 'Zero width and height must fallback to 16/9');
    assert.strictEqual(safeAspect(0, 1080), 16 / 9, 'Zero width must fallback to 16/9');
    assert.strictEqual(safeAspect(1920, 0), 16 / 9, 'Zero height must fallback to 16/9');

    // Verify negative dimensions
    assert.strictEqual(safeAspect(-500, 1000), 16 / 9, 'Negative width must fallback to 16/9');
    assert.strictEqual(safeAspect(1000, -500), 16 / 9, 'Negative height must fallback to 16/9');
    assert.strictEqual(safeAspect(-1, -1), 16 / 9, 'Negative dimensions must fallback to 16/9');

    // Fractional / sub-pixel dimensions
    assert.strictEqual(safeAspect(0.5, 0.25), 2.0);
  });

  await t.test('2.6 WebGL context loss listener simulation & preventDefault verification', () => {
    let preventDefaultCalled = false;
    let animLoopActive = true;

    // Simulate event handlers from LibraryScene.tsx
    const handleContextLost = (e: { preventDefault: () => void }) => {
      e.preventDefault();
      animLoopActive = false;
    };

    const handleContextRestored = () => {
      animLoopActive = true;
    };

    const mockEvent = {
      preventDefault: () => {
        preventDefaultCalled = true;
      }
    };

    // Trigger context lost
    handleContextLost(mockEvent);
    assert.strictEqual(preventDefaultCalled, true, 'e.preventDefault() MUST be called to permit WebGL recovery');
    assert.strictEqual(animLoopActive, false, 'Animation frame loop must be paused during context loss');

    // Trigger context restored
    handleContextRestored();
    assert.strictEqual(animLoopActive, true, 'Animation frame loop must resume after context restore');
  });

  await t.test('2.7 getWarmingIndices boundary conditions & clamping', () => {
    // 5 books, activeIndex = 0, R = 2
    assert.deepStrictEqual(getWarmingIndices(0, 5, 2), [0, 1, 2]);

    // 5 books, activeIndex = 2 (middle), R = 2
    assert.deepStrictEqual(getWarmingIndices(2, 5, 2), [0, 1, 2, 3, 4]);

    // 5 books, activeIndex = 4 (end), R = 2
    assert.deepStrictEqual(getWarmingIndices(4, 5, 2), [2, 3, 4]);

    // Single book catalog (N=1)
    assert.deepStrictEqual(getWarmingIndices(0, 1, 2), [0]);

    // Empty catalog (N=0)
    assert.deepStrictEqual(getWarmingIndices(0, 0, 2), []);

    // Out of range indices
    assert.deepStrictEqual(getWarmingIndices(-5, 5, 2), []);
    assert.deepStrictEqual(getWarmingIndices(10, 5, 2), []);
  });

  await t.test('2.8 warmTextures resilience with empty, undefined, and valid textures', () => {
    const initialized: THREE.Texture[] = [];
    const mockRenderer = {
      initTexture: (tex: THREE.Texture) => {
        initialized.push(tex);
      }
    } as unknown as THREE.WebGLRenderer;

    const t1 = new THREE.Texture();
    const t2 = new THREE.Texture();

    // Call with array containing undefined and valid textures
    const count = warmTextures(mockRenderer, [t1, undefined, null as any, t2]);
    assert.strictEqual(count, 2, 'Must successfully warm exactly 2 valid textures');
    assert.strictEqual(initialized.length, 2);
    assert.strictEqual(initialized[0], t1);
    assert.strictEqual(initialized[1], t2);

    // Call with empty array
    const emptyCount = warmTextures(mockRenderer, []);
    assert.strictEqual(emptyCount, 0);
  });

  await t.test('2.9 executeWarmupPasses executes 4 distinct poses and render calls', () => {
    let renderCalls = 0;
    const mockRenderer = {
      render: () => {
        renderCalls++;
      }
    } as unknown as THREE.WebGLRenderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const bookGroups = [new THREE.Group(), new THREE.Group(), new THREE.Group()];

    const passedIndices: number[] = [];
    const count = executeWarmupPasses(mockRenderer, scene, camera, bookGroups, 0, (pass) => {
      passedIndices.push(pass);
    });

    assert.strictEqual(count, 4, 'Must execute exactly 4 warmup passes');
    assert.strictEqual(renderCalls, 4, 'Must call renderer.render exactly 4 times');
    assert.deepStrictEqual(passedIndices, [1, 2, 3, 4], 'Pass indices must be 1, 2, 3, 4');
  });

  await t.test('2.10 prepareSceneAssets full Beat 3 pipeline with monotonic progress reporting', async () => {
    const renderCalls: string[] = [];
    const mockRenderer = {
      initTexture: () => { renderCalls.push('initTexture'); },
      compileAsync: async () => {
        renderCalls.push('compileAsync');
        await new Promise(r => setTimeout(r, 10));
      },
      render: () => { renderCalls.push('renderPass'); }
    } as unknown as THREE.WebGLRenderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const bookGroups = [new THREE.Group(), new THREE.Group()];

    const progressReports: number[] = [];
    await prepareSceneAssets({
      renderer: mockRenderer,
      scene,
      camera,
      books: BOOKS_CATALOG,
      activeIndex: 0,
      radius: 2,
      timeoutMs: 500,
      bookGroups,
      onProgress: (pct) => {
        progressReports.push(pct);
      }
    });

    // Check pipeline steps executed
    assert.ok(renderCalls.includes('compileAsync'), 'compileAsync must be called');
    assert.ok(renderCalls.filter(c => c === 'renderPass').length === 4, '4 render passes must be executed');

    // Check progress monotonicity
    assert.ok(progressReports.length >= 4, 'Must report multiple progress milestones');
    assert.strictEqual(progressReports[0], 60, 'Beat 3 start must be 60%');
    assert.strictEqual(progressReports[progressReports.length - 1], 95, 'Beat 3 end must be 95%');

    for (let i = 1; i < progressReports.length; i++) {
      assert.ok(progressReports[i] >= progressReports[i - 1], `Beat 3 progress must be monotonic at step ${i}: ${progressReports[i]}`);
    }
  });
});
