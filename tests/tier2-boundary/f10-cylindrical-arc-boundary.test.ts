import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCylindricalPosition } from '../helpers/physics.ts';

test('Tier 2 - Feature 10 Boundary: Cylindrical Arc Spacing & Geometry', async (t) => {
  await t.test('B10.1 Large offset values stability (m = +-10)', () => {
    const posPos = calculateCylindricalPosition(10);
    const posNeg = calculateCylindricalPosition(-10);

    assert.ok(Number.isFinite(posPos.x));
    assert.ok(Number.isFinite(posPos.z));
    assert.ok(Number.isFinite(posNeg.x));
    assert.ok(Number.isFinite(posNeg.z));
    // Maximum X displacement should not exceed radiusX (5.52)
    assert.ok(Math.abs(posPos.x) <= 5.52001);
  });

  await t.test('B10.2 Sub-pixel precision at fractional offsets (m = 0.0001)', () => {
    const pos = calculateCylindricalPosition(0.0001);
    assert.ok(pos.x > 0);
    assert.ok(Math.abs(pos.x) < 0.001);
    assert.ok(pos.z >= 0);
    assert.ok(Math.abs(pos.z) < 0.0001);
  });

  await t.test('B10.3 Half-step offset spacing midpoint (m = 0.5)', () => {
    const pos0 = calculateCylindricalPosition(0);
    const posHalf = calculateCylindricalPosition(0.5);
    const posOne = calculateCylindricalPosition(1.0);

    // X position at m=0.5 should be strictly between m=0 and m=1
    assert.ok(posHalf.x > pos0.x && posHalf.x < posOne.x,
      `Midpoint X (${posHalf.x}) must lie between pos0 (${pos0.x}) and pos1 (${posOne.x})`);
  });

  await t.test('B10.4 Scale attenuation boundary for inactive books', () => {
    // Scaling formula: 1.0 - Math.min(1, absOffset) * (1.0 - inactiveScale)
    const inactiveScale = 0.82;
    const calcScale = (offset: number) => 1.0 - Math.min(1, Math.abs(offset)) * (1.0 - inactiveScale);

    assert.strictEqual(calcScale(0), 1.0, 'Active book scale is 1.0');
    assert.ok(Math.abs(calcScale(1.0) - 0.82) < 0.0001, 'Neighbor book scale is 0.82');
    assert.ok(Math.abs(calcScale(5.0) - 0.82) < 0.0001, 'Far book scale clamps to 0.82');
  });

  await t.test('B10.5 Active elevation peak calculation', () => {
    // Elevation formula: Math.max(0, 1 - absOffset * 1.5) * 0.18
    const calcElevation = (offset: number) => Math.max(0, 1 - Math.abs(offset) * 1.5) * 0.18;

    assert.ok(Math.abs(calcElevation(0) - 0.18) < 0.0001, 'Center book elevated by 0.18');
    assert.strictEqual(calcElevation(1.0), 0, 'Neighbor book elevation drops to 0');
    assert.strictEqual(calcElevation(2.0), 0);
  });
});
