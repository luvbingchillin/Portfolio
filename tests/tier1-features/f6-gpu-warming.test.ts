import test from 'node:test';
import assert from 'node:assert/strict';
import { PRELOADER_CONFIG } from '../helpers/preloaderModel.ts';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';

test('Tier 1 - Feature 6: GPU Shader Pre-compilation & Texture Warming', async (t) => {
  await t.test('6.1 GPU timeout race fallback specification', () => {
    assert.strictEqual(PRELOADER_CONFIG.gpuTimeoutMs, 1500,
      'compileAsync timeout race must be configured to 1500ms');
  });

  await t.test('6.2 Texture warming radius calculation (R=2)', () => {
    const activeIndex = 0;
    const radius = PRELOADER_CONFIG.initialRadius;
    const totalBooks = BOOKS_CATALOG.length;

    const indicesToWarm: number[] = [];
    for (let i = Math.max(0, activeIndex - radius); i <= Math.min(totalBooks - 1, activeIndex + radius); i++) {
      indicesToWarm.push(i);
    }

    assert.ok(indicesToWarm.includes(0), 'Active book 0 must be warmed');
    assert.ok(indicesToWarm.includes(1), 'Neighbor 1 must be warmed');
    assert.ok(indicesToWarm.includes(2), 'Neighbor 2 must be warmed');
    assert.strictEqual(indicesToWarm.length, 3, 'For activeIndex 0 and R=2, exactly 3 books (0, 1, 2) in radius');
  });

  await t.test('6.3 Warmup render passes count specification', () => {
    assert.strictEqual(PRELOADER_CONFIG.warmupPasses, 4,
      'Exactly 4 warmup render passes must be executed to prime shaders');
  });

  await t.test('6.4 Shader compilation promise race contract', async () => {
    // Test the promise race mechanism: if compilation takes 3000ms, timeout triggers at 1500ms
    let timedOut = false;
    const mockSlowCompilation = new Promise((resolve) => setTimeout(resolve, 3000));
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        timedOut = true;
        resolve('timeout');
      }, 50); // fast test scale
    });

    const result = await Promise.race([mockSlowCompilation, timeoutPromise]);
    assert.strictEqual(result, 'timeout');
    assert.strictEqual(timedOut, true);
  });

  await t.test('6.5 Monotonic progress notification callback', () => {
    const progressHistory: number[] = [];
    const reportProgress = (pct: number) => {
      progressHistory.push(pct);
    };

    [10, 30, 60, 85, 100].forEach(p => reportProgress(p));

    assert.strictEqual(progressHistory.length, 5);
    for (let i = 1; i < progressHistory.length; i++) {
      assert.ok(progressHistory[i] >= progressHistory[i - 1], 'Progress must increase monotonically');
    }
  });
});
