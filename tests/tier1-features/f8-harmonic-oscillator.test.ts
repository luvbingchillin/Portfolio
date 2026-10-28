import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PHYSICS_CONFIG,
  stepHarmonicOscillator
} from '../helpers/physics.ts';

test('Tier 1 - Feature 8: Analytical Damped Harmonic Oscillator', async (t) => {
  await t.test('8.1 Physics oscillator parameters specification', () => {
    assert.strictEqual(DEFAULT_PHYSICS_CONFIG.snapFreq, 9.5, 'Natural frequency snapFreq must be 9.5 rad/s');
    assert.strictEqual(DEFAULT_PHYSICS_CONFIG.snapDamping, 12.0, 'Damping snapDamping must be 12.0');
    assert.strictEqual(DEFAULT_PHYSICS_CONFIG.friction, 0.89, 'Friction damping must be 0.89');
    assert.strictEqual(DEFAULT_PHYSICS_CONFIG.snapDuration, 0.46, 'Snap duration must be 0.46s');
  });

  await t.test('8.2 Underdamped characteristic discriminant verification', () => {
    // For equation d^2x/dt^2 + gamma*dx/dt + omega_0^2 * x = 0:
    // Discriminant Delta = gamma^2 - 4*omega_0^2
    const gamma = DEFAULT_PHYSICS_CONFIG.snapDamping;
    const omega0 = DEFAULT_PHYSICS_CONFIG.snapFreq;
    const discriminant = gamma * gamma - 4 * omega0 * omega0;

    assert.ok(discriminant < 0, `Discriminant must be negative for snappy underdamped response (${discriminant})`);
  });

  await t.test('8.3 Oscillator convergence towards target position', () => {
    let state = { position: 0, velocity: 0, target: 1.0 };
    const dt = 1 / 60; // 60fps

    // Step for 40 frames (~0.66s)
    for (let frame = 0; frame < 40; frame++) {
      state = stepHarmonicOscillator(state, dt);
    }

    assert.ok(Math.abs(state.position - 1.0) < 0.05,
      `Oscillator position should settle near 1.0, was ${state.position}`);
    assert.ok(Math.abs(state.velocity) < 0.05,
      `Velocity should settle near 0, was ${state.velocity}`);
  });

  await t.test('8.4 Frame-rate independence stability check', () => {
    // Run two simulations with different timesteps (60fps vs 120fps) over 0.5s
    const totalTime = 0.5;
    
    // 60fps simulation
    let state60 = { position: 0, velocity: 0, target: 2.0 };
    const dt60 = 1 / 60;
    const steps60 = Math.round(totalTime / dt60);
    for (let i = 0; i < steps60; i++) {
      state60 = stepHarmonicOscillator(state60, dt60);
    }

    // 120fps simulation
    let state120 = { position: 0, velocity: 0, target: 2.0 };
    const dt120 = 1 / 120;
    const steps120 = Math.round(totalTime / dt120);
    for (let i = 0; i < steps120; i++) {
      state120 = stepHarmonicOscillator(state120, dt120);
    }

    assert.ok(Math.abs(state60.position - state120.position) < 0.2,
      `Simulations should yield comparable positions: 60fps=${state60.position}, 120fps=${state120.position}`);
  });

  await t.test('8.5 Mechanical energy decay over oscillation cycles', () => {
    let state = { position: 0, velocity: 0, target: 1.0 };
    const dt = 1 / 60;
    const omega0 = DEFAULT_PHYSICS_CONFIG.snapFreq;

    const calcEnergy = (s: typeof state) => {
      const displacement = s.position - s.target;
      return 0.5 * s.velocity * s.velocity + 0.5 * (omega0 * 0.1) * displacement * displacement;
    };

    const initialEnergy = calcEnergy(state);
    
    for (let i = 0; i < 30; i++) {
      state = stepHarmonicOscillator(state, dt);
    }
    const settledEnergy = calcEnergy(state);

    assert.ok(settledEnergy < initialEnergy,
      `Mechanical energy must decay (initial: ${initialEnergy}, settled: ${settledEnergy})`);
  });
});
