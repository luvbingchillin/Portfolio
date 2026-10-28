import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PreloaderStateMachine,
  PRELOADER_CONFIG,
  PRELOADER_BEATS
} from '../helpers/preloaderModel.ts';

test('Tier 1 - Feature 7: Stylized Odometer Preloader Screen', async (t) => {
  await t.test('7.1 Split-drum 3-column digit separation', () => {
    const sm = new PreloaderStateMachine();
    sm.start(0);

    sm.setProgress(7, 100);
    let digits = sm.getOdometerDigits();
    assert.deepStrictEqual(digits, { hundreds: 0, tens: 0, ones: 7 });

    sm.setProgress(42, 500);
    digits = sm.getOdometerDigits();
    assert.deepStrictEqual(digits, { hundreds: 0, tens: 4, ones: 2 });

    sm.setProgress(100, 3000);
    digits = sm.getOdometerDigits();
    assert.deepStrictEqual(digits, { hundreds: 1, tens: 0, ones: 0 });
  });

  await t.test('7.2 Monotonic percentage progression', () => {
    const sm = new PreloaderStateMachine();
    sm.start(0);

    sm.setProgress(20, 100);
    assert.strictEqual(sm.getProgress(), 20);

    // Negative regression attempt should be ignored
    sm.setProgress(15, 200);
    assert.strictEqual(sm.getProgress(), 20, 'Progress must never regress downwards');

    sm.setProgress(65, 300);
    assert.strictEqual(sm.getProgress(), 65);
  });

  await t.test('7.3 4-beat timeline stages classification', () => {
    const sm = new PreloaderStateMachine();
    sm.start(0);

    sm.setProgress(10, 100);
    assert.strictEqual(sm.getCurrentBeat().beat, 1);

    sm.setProgress(45, 500);
    assert.strictEqual(sm.getCurrentBeat().beat, 2);

    sm.setProgress(80, 1500);
    assert.strictEqual(sm.getCurrentBeat().beat, 3);

    sm.setProgress(98, 2500);
    assert.strictEqual(sm.getCurrentBeat().beat, 4);
    assert.strictEqual(PRELOADER_BEATS.length, 4, 'Must define exactly 4 timeline beats');
  });

  await t.test('7.4 Minimum display duration enforcement (>=2.85s)', () => {
    let completed = false;
    const sm = new PreloaderStateMachine(() => { completed = true; });
    sm.start(1000);

    // Reaching 100% early (e.g. at elapsed 1000ms < 2850ms) must not complete yet
    sm.setProgress(100, 2000);
    assert.strictEqual(sm.isComplete(), false, 'Must not complete before minDuration (2.85s)');
    assert.strictEqual(completed, false);

    // Once time passes 2850ms, completion fires
    sm.setProgress(100, 1000 + PRELOADER_CONFIG.minDurationMs);
    assert.strictEqual(sm.isComplete(), true);
    assert.strictEqual(completed, true);
  });

  await t.test('7.5 Single execution of completion callback', () => {
    let callCount = 0;
    const sm = new PreloaderStateMachine(() => { callCount++; });
    sm.start(0);

    sm.setProgress(100, 3000);
    sm.setProgress(100, 3500);
    sm.setProgress(100, 4000);

    assert.strictEqual(callCount, 1, 'onLoaded callback must only fire once');
  });
});
