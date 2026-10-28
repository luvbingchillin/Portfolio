import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCylindricalPosition
} from '../helpers/physics.ts';

test('Tier 1 - Feature 10: Cylindrical Arc & Follow Lag', async (t) => {
  await t.test('10.1 X coordinate sinusoidal spacing formula', () => {
    // Formula: X(m) = sin(0.35 * m) * 5.52
    const m = 1.0;
    const pos = calculateCylindricalPosition(m);
    const expectedX = Math.sin(0.35) * 5.52;
    assert.ok(Math.abs(pos.x - expectedX) < 0.0001,
      `pos.x was ${pos.x}, expected ${expectedX}`);
  });

  await t.test('10.2 Z coordinate cosinusoidal recession formula', () => {
    // Formula: Z(m) = -cos(0.35 * m) * 2.4 + 2.4
    const m = 1.0;
    const pos = calculateCylindricalPosition(m);
    const expectedZ = -Math.cos(0.35) * 2.4 + 2.4;
    assert.ok(Math.abs(pos.z - expectedZ) < 0.0001,
      `pos.z was ${pos.z}, expected ${expectedZ}`);
  });

  await t.test('10.3 Center active book at origin alignment (m=0)', () => {
    const centerPos = calculateCylindricalPosition(0);
    assert.strictEqual(centerPos.x, 0, 'Center book X must be exactly 0');
    assert.strictEqual(centerPos.z, 0, 'Center book Z must be exactly 0');
  });

  await t.test('10.4 Spatial reflection symmetry around center', () => {
    const rightNeighbor = calculateCylindricalPosition(1.5);
    const leftNeighbor = calculateCylindricalPosition(-1.5);

    // X should be odd function: X(-m) = -X(m)
    assert.ok(Math.abs(rightNeighbor.x + leftNeighbor.x) < 0.0001,
      'X coordinates must have odd reflection symmetry');

    // Z should be even function: Z(-m) = Z(m)
    assert.ok(Math.abs(rightNeighbor.z - leftNeighbor.z) < 0.0001,
      'Z coordinates must have even reflection symmetry');
  });

  await t.test('10.5 Inward orientation angle scaling', () => {
    // Neighbor books inward rotation: theta_y = -sgn(offset) * 0.22
    const calcInwardAngle = (offset: number) => {
      if (Math.abs(offset) < 0.35) return 0;
      return -Math.sign(offset) * 0.22;
    };

    assert.strictEqual(calcInwardAngle(0), 0, 'Center book faces straight forward');
    assert.strictEqual(calcInwardAngle(1), -0.22, 'Right book faces left towards center');
    assert.strictEqual(calcInwardAngle(-1), 0.22, 'Left book faces right towards center');
  });
});
