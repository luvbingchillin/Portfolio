import test from 'node:test';
import assert from 'node:assert/strict';

export class RenderLoopDirtyTracker {
  isDirty = true;
  velocity = 0;
  isDragging = false;
  currentFlip = 0;
  targetFlip = 0;
  renderCallCount = 0;

  updateDirtyState(): void {
    const isMoving = Math.abs(this.velocity) > 0.0001;
    const isFlipping = Math.abs(this.currentFlip - this.targetFlip) > 0.001;
    this.isDirty = this.isDragging || isMoving || isFlipping;
  }

  tick(): boolean {
    this.updateDirtyState();
    if (this.isDirty) {
      this.renderCallCount++;
      return true;
    }
    return false;
  }
}

test('Tier 1 - Feature 11: Render Loop Optimization & Dirty Flag', async (t) => {
  await t.test('11.1 Dragging state marks loop dirty', () => {
    const tracker = new RenderLoopDirtyTracker();
    tracker.isDragging = true;
    const rendered = tracker.tick();
    assert.strictEqual(rendered, true, 'Should render while dragging');
    assert.strictEqual(tracker.isDirty, true);
  });

  await t.test('11.2 Residual velocity marks loop dirty', () => {
    const tracker = new RenderLoopDirtyTracker();
    tracker.isDragging = false;
    tracker.velocity = 0.05;
    const rendered = tracker.tick();
    assert.strictEqual(rendered, true, 'Should render while velocity > 0.0001');
    assert.strictEqual(tracker.isDirty, true);
  });

  await t.test('11.3 Active flip angle interpolation marks loop dirty', () => {
    const tracker = new RenderLoopDirtyTracker();
    tracker.isDragging = false;
    tracker.velocity = 0;
    tracker.currentFlip = 0.5;
    tracker.targetFlip = Math.PI;
    const rendered = tracker.tick();
    assert.strictEqual(rendered, true, 'Should render while flipping');
    assert.strictEqual(tracker.isDirty, true);
  });

  await t.test('11.4 Idle state cleanly bypasses render call (0% GPU)', () => {
    const tracker = new RenderLoopDirtyTracker();
    tracker.isDragging = false;
    tracker.velocity = 0;
    tracker.currentFlip = 0;
    tracker.targetFlip = 0;
    
    const rendered = tracker.tick();
    assert.strictEqual(rendered, false, 'Should bypass render when completely idle');
    assert.strictEqual(tracker.isDirty, false);
    assert.strictEqual(tracker.renderCallCount, 0, 'No WebGL render call should occur when idle');
  });

  await t.test('11.5 Re-excitation immediately marks loop dirty', () => {
    const tracker = new RenderLoopDirtyTracker();
    // Start idle
    tracker.isDragging = false;
    tracker.velocity = 0;
    tracker.tick();
    assert.strictEqual(tracker.isDirty, false);

    // Re-excite with new velocity impulse
    tracker.velocity = 0.12;
    const rendered = tracker.tick();
    assert.strictEqual(rendered, true, 'Should immediately re-activate rendering upon impulse');
    assert.strictEqual(tracker.isDirty, true);
  });
});
