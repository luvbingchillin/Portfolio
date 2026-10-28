import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAerodynamicDrag } from '../helpers/physics.ts';

test('Tier 2 - Feature 9 Boundary: Aerodynamic Drag Banking Edge Cases', async (t) => {
  await t.test('B9.1 Zero velocity input returns exact zeroes', () => {
    const drag = calculateAerodynamicDrag(0);
    assert.strictEqual(drag.flowLean, 0);
    assert.strictEqual(drag.flowBank, 0);
    assert.strictEqual(drag.flowDip, 0);
  });

  await t.test('B9.2 Microscopic velocity near zero (v = 0.0001)', () => {
    const drag = calculateAerodynamicDrag(0.0001);
    assert.ok(drag.flowLean > 0 && drag.flowLean < 0.001);
    assert.ok(drag.flowBank < 0);
    assert.ok(drag.flowDip <= 0);
  });

  await t.test('B9.3 Negative velocity directional sign inversion', () => {
    const posDrag = calculateAerodynamicDrag(3.0);
    const negDrag = calculateAerodynamicDrag(-3.0);

    assert.strictEqual(posDrag.flowLean, -negDrag.flowLean, 'flowLean must invert sign');
    assert.strictEqual(posDrag.flowBank, -negDrag.flowBank, 'flowBank must invert sign');
    assert.strictEqual(posDrag.flowDip, negDrag.flowDip, 'flowDip must remain identical (downward)');
  });

  await t.test('B9.4 Extreme velocity clamping stability (v = 1000.0)', () => {
    const extremeDrag = calculateAerodynamicDrag(1000.0);
    assert.strictEqual(extremeDrag.flowLean, 0.30, 'flowLean must never exceed 0.30');
    assert.ok(Number.isFinite(extremeDrag.flowBank));
    assert.ok(Number.isFinite(extremeDrag.flowDip));
  });

  await t.test('B9.5 Active vs inactive book orientation threshold boundary (|offset| = 0.35)', () => {
    const isBookActive = (offset: number) => Math.abs(offset) < 0.35;

    assert.strictEqual(isBookActive(0.0), true, 'Offset 0 is active');
    assert.strictEqual(isBookActive(0.34), true, 'Offset 0.34 is active');
    assert.strictEqual(isBookActive(0.35), false, 'Offset 0.35 is inactive neighbor');
    assert.strictEqual(isBookActive(1.0), false, 'Offset 1.0 is inactive neighbor');
  });
});
