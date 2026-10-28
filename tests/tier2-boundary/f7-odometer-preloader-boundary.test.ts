import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PreloaderStateMachine,
  PRELOADER_CONFIG
} from '../helpers/preloaderModel.ts';

test('Tier 2 - Feature 7 Boundary: Odometer Preloader Bounds & Latency', async (t) => {
  await t.test('B7.1 Percentage inputs clamped within [0, 100]', () => {
    const sm = new PreloaderStateMachine();
    sm.start(0);

    sm.setProgress(-50, 100);
    assert.strictEqual(sm.getProgress(), 0, 'Negative percentage must be clamped to 0');

    sm.setProgress(150, 200);
    assert.strictEqual(sm.getProgress(), 100, 'Overflow percentage must be clamped to 100');
  });

  await t.test('B7.2 High-latency assets (>5s) smooth progress without early finish', () => {
    let completed = false;
    const sm = new PreloaderStateMachine(() => { completed = true; });
    sm.start(0);

    // At 4000ms, progress is 90%
    sm.setProgress(90, 4000);
    assert.strictEqual(sm.isComplete(), false, 'Must not complete while progress < 100%');

    // At 5500ms, progress reaches 100%
    sm.setProgress(100, 5500);
    assert.strictEqual(sm.isComplete(), true);
    assert.strictEqual(completed, true);
  });

  await t.test('B7.3 Split-drum digit column rollover (e.g. 9 to 10, 99 to 100)', () => {
    const sm = new PreloaderStateMachine();
    sm.start(0);

    sm.setProgress(9, 100);
    assert.deepStrictEqual(sm.getOdometerDigits(), { hundreds: 0, tens: 0, ones: 9 });

    sm.setProgress(10, 200);
    assert.deepStrictEqual(sm.getOdometerDigits(), { hundreds: 0, tens: 1, ones: 0 });

    sm.setProgress(99, 300);
    assert.deepStrictEqual(sm.getOdometerDigits(), { hundreds: 0, tens: 9, ones: 9 });

    sm.setProgress(100, 3000);
    assert.deepStrictEqual(sm.getOdometerDigits(), { hundreds: 1, tens: 0, ones: 0 });
  });

  await t.test('B7.4 Instant asset load (0ms) enforces full 2.85s theatrical duration', () => {
    let completed = false;
    const sm = new PreloaderStateMachine(() => { completed = true; });
    sm.start(1000);

    // Assets load instantly in cache
    sm.setProgress(100, 1001); // 1ms elapsed
    assert.strictEqual(sm.isComplete(), false, 'Must not finish immediately upon cached load');

    sm.setProgress(100, 1000 + PRELOADER_CONFIG.minDurationMs - 1);
    assert.strictEqual(sm.isComplete(), false, 'Must remain active until exactly 2850ms');

    sm.setProgress(100, 1000 + PRELOADER_CONFIG.minDurationMs);
    assert.strictEqual(sm.isComplete(), true);
    assert.strictEqual(completed, true);
  });

  await t.test('B7.5 Multiple consecutive start calls reset state cleanly', () => {
    const sm = new PreloaderStateMachine();
    sm.start(0);
    sm.setProgress(80, 500);
    assert.strictEqual(sm.getProgress(), 80);

    // User triggers reload or restart
    sm.start(1000);
    assert.strictEqual(sm.getProgress(), 0, 'Re-start must reset progress to 0');
    assert.strictEqual(sm.isComplete(), false);
  });
});
