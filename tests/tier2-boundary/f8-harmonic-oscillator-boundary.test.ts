import test from 'node:test';
import assert from 'node:assert/strict';
import { stepHarmonicOscillator } from '../helpers/physics.ts';

test('Tier 2 - Feature 8 Boundary: Harmonic Oscillator Extremes & Stabilities', async (t) => {
  await t.test('B8.1 Zero delta time (dt = 0) returns identical state without error', () => {
    const initial = { position: 1.5, velocity: 0.8, target: 2.0 };
    const result = stepHarmonicOscillator(initial, 0);
    assert.deepStrictEqual(result, initial);
  });

  await t.test('B8.2 Delta time spike (dt = 1.0s, background tab resume) stability', () => {
    // When browser tab is backgrounded, dt can spike to 1000ms. Simulation must not produce NaN or Infinity.
    const initial = { position: 0, velocity: 0, target: 3.0 };
    const result = stepHarmonicOscillator(initial, 1.0);
    assert.ok(Number.isFinite(result.position), 'Position must be finite number after large dt step');
    assert.ok(Number.isFinite(result.velocity), 'Velocity must be finite number after large dt step');
    assert.ok(!Number.isNaN(result.position));
  });

  await t.test('B8.3 State at equilibrium with zero velocity remains stationary', () => {
    const atEquilibrium = { position: 4.0, velocity: 0, target: 4.0 };
    const result = stepHarmonicOscillator(atEquilibrium, 1 / 60);
    assert.strictEqual(result.position, 4.0);
    assert.strictEqual(result.velocity, 0);
  });

  await t.test('B8.4 Massive velocity impulse (v = 500.0) convergence without divergence', () => {
    let state = { position: 0, velocity: 500.0, target: 0 };
    const dt = 1 / 60;

    for (let i = 0; i < 60; i++) {
      state = stepHarmonicOscillator(state, dt);
    }
    // High friction and damping must rapidly attenuate extreme velocities
    assert.ok(Math.abs(state.velocity) < 1.0,
      `Extreme velocity should be dampened below 1.0 within 60 frames, was ${state.velocity}`);
  });

  await t.test('B8.5 Microscopic displacement deadband snap (<0.0001)', () => {
    const nearRest = { position: 2.00005, velocity: 0.00002, target: 2.0 };
    const result = stepHarmonicOscillator(nearRest, 1 / 60);
    assert.strictEqual(result.position, 2.0, 'Deadband should snap position exactly to target');
    assert.strictEqual(result.velocity, 0, 'Deadband should snap velocity exactly to 0');
  });
});
