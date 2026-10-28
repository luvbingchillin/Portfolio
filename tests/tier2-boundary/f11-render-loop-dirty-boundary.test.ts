import test from 'node:test';
import assert from 'node:assert/strict';
import { RenderLoopDirtyTracker } from '../tier1-features/f11-render-loop-dirty.test.ts';

test('Tier 2 - Feature 11 Boundary: Render Loop Optimization & Dirty Flags', async (t) => {
  await t.test('B11.1 Rapid toggle of dragging within 1ms', () => {
    const tracker = new RenderLoopDirtyTracker();
    tracker.isDragging = true;
    tracker.isDragging = false;
    tracker.velocity = 0;
    tracker.tick();
    assert.strictEqual(tracker.isDirty, false, 'Rapid release without velocity should be idle');
  });

  await t.test('B11.2 Velocity exactly at threshold (v = 0.0001)', () => {
    const tracker = new RenderLoopDirtyTracker();
    tracker.velocity = 0.0001;
    tracker.tick();
    // Threshold is > 0.0001, so exactly 0.0001 should settle to clean
    assert.strictEqual(tracker.isDirty, false);

    tracker.velocity = 0.00011;
    tracker.tick();
    assert.strictEqual(tracker.isDirty, true, 'Velocity > 0.0001 must mark dirty');
  });

  await t.test('B11.3 Consecutive idle frames (1,000 frames) zero render calls', () => {
    const tracker = new RenderLoopDirtyTracker();
    tracker.velocity = 0;
    tracker.isDragging = false;
    tracker.currentFlip = 0;
    tracker.targetFlip = 0;

    let calls = 0;
    for (let i = 0; i < 1000; i++) {
      if (tracker.tick()) {
        calls++;
      }
    }
    assert.strictEqual(calls, 0, '1,000 idle frames must produce exactly 0 render calls');
  });

  await t.test('B11.4 Flip angle deadband threshold at exactly 0.001 rad', () => {
    const tracker = new RenderLoopDirtyTracker();
    tracker.velocity = 0;
    tracker.currentFlip = 0.001;
    tracker.targetFlip = 0;
    tracker.tick();
    assert.strictEqual(tracker.isDirty, false, 'Diff <= 0.001 is inside deadband');

    tracker.currentFlip = 0.0011;
    tracker.tick();
    assert.strictEqual(tracker.isDirty, true, 'Diff > 0.001 is outside deadband');
  });

  await t.test('B11.5 Render loop performance budget: step time under 1ms', () => {
    const tracker = new RenderLoopDirtyTracker();
    tracker.velocity = 0.5;
    
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      tracker.tick();
    }
    const elapsed = performance.now() - start;
    const timePerTick = elapsed / 1000;

    // 60fps frame budget is 16.6ms. Dirty check logic should take < 0.05ms
    assert.ok(timePerTick < 0.05, `Dirty check took ${timePerTick}ms, well within frame budget`);
  });
});
