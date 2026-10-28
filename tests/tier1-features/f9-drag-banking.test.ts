import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAerodynamicDrag,
  DRAG_CONFIG
} from '../helpers/physics.ts';

test('Tier 1 - Feature 9: Aerodynamic Drag Banking', async (t) => {
  await t.test('9.1 Flow lean pitch calculation formula', () => {
    const v = 4.0;
    const drag = calculateAerodynamicDrag(v);
    // Expected: sgn(4) * sqrt(4) * 0.055 = 1 * 2 * 0.055 = 0.11
    const expectedLean = 2.0 * DRAG_CONFIG.flowLeanMultiplier;
    assert.ok(Math.abs(drag.flowLean - expectedLean) < 0.001,
      `flowLean was ${drag.flowLean}, expected ~${expectedLean}`);
  });

  await t.test('9.2 Flow lean maximum clamp at 0.30', () => {
    const extremeV = 100.0;
    const drag = calculateAerodynamicDrag(extremeV);
    assert.strictEqual(drag.flowLean, 0.30, 'flowLean must be clamped at +0.30');

    const negativeExtremeV = -100.0;
    const negDrag = calculateAerodynamicDrag(negativeExtremeV);
    assert.strictEqual(negDrag.flowLean, -0.30, 'flowLean must be clamped at -0.30');
  });

  await t.test('9.3 Flow bank lateral roll angle calculation', () => {
    const v = 1.5;
    const drag = calculateAerodynamicDrag(v);
    // Expected: -1.5 * 0.32 = -0.48
    const expectedBank = -1.5 * 0.32;
    assert.ok(Math.abs(drag.flowBank - expectedBank) < 0.001,
      `flowBank was ${drag.flowBank}, expected ${expectedBank}`);
  });

  await t.test('9.4 Flow dip aerodynamic downforce calculation', () => {
    const vPositive = 2.0;
    const dragPositive = calculateAerodynamicDrag(vPositive);
    
    const vNegative = -2.0;
    const dragNegative = calculateAerodynamicDrag(vNegative);

    // Both positive and negative velocities must create downward (negative) dip
    assert.ok(dragPositive.flowDip < 0, 'flowDip must be downward (negative Y)');
    assert.strictEqual(dragPositive.flowDip, dragNegative.flowDip,
      'flowDip must be magnitude-symmetric for positive and negative velocities');
    assert.ok(Math.abs(dragPositive.flowDip - (-2.0 * 0.014)) < 0.0001);
  });

  await t.test('9.5 Flight recede Z-axis offset specification', () => {
    assert.strictEqual(DRAG_CONFIG.flightRecedeZ, -2.2,
      'Inactive book flight recede offset must be Z -= 2.2');
  });
});
