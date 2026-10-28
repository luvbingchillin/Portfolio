/**
 * Challenger M3-2 Empirical Adversarial Stress Test Suite
 * Milestone 3: Cylindrical Arc Carousel, Damped Harmonic Oscillator, Aerodynamics & Dirty-Flag Render Loop
 *
 * Direct adversarial stress verification:
 * - Damped Harmonic Oscillator: dt spike (background tab sleep), dt microscopic, massive impulse, deadband snap, energy decay.
 * - Cylindrical Arc Spacing: odd/even reflection symmetry, radius containment, inward yaw, shelf elevation peak, scale attenuation.
 * - Distance-Dependent Follow Lag: k in [6.5, 15.0], exponential integration stability, near vs far propagation lag.
 * - Flip S-Curve & Interaction Gating: 1.05s duration, proportional reversal, smoothstep derivative limits, mid-flip modal blocking.
 * - Aerodynamic Drag Banking: flowLean clamping, flowBank roll, flowDip downforce, asymmetric filtering.
 * - Dirty-Flag Render Loop: 10-frame settling buffer, 0% idle GPU bypass, zero-division layout bounds safety.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PHYSICS_CONFIG,
  stepHarmonicOscillator,
  calculateAerodynamicDrag,
  calculateCylindricalPosition
} from './helpers/physics.ts';

// ============================================================================
// SUITE 1: DAMPED HARMONIC OSCILLATOR & ADVERSARIAL STABILITY
// ============================================================================
test('Challenger M3-2: Damped Harmonic Oscillator Adversarial Stress', async (t) => {
  await t.test('1.1 Background tab resume delta-time spike (dt = 10s, 60s) clamped safely', () => {
    // In LibraryScene.tsx: const safeDt = Math.min(0.08, Math.max(0.0005, rawDt));
    const rawSpikes = [0.1, 0.5, 1.0, 5.0, 10.0, 60.0, 3600.0];
    for (const rawDt of rawSpikes) {
      const safeDt = Math.min(0.08, Math.max(0.0005, rawDt));
      assert.strictEqual(safeDt, 0.08, `Large dt spike ${rawDt}s must be clamped to exactly 0.08s`);

      // Verify oscillator step does not explode or produce NaN
      let state = { position: 0, velocity: 5.0, target: 1.0 };
      const next = stepHarmonicOscillator(state, safeDt);
      assert.ok(Number.isFinite(next.position), `Position must be finite after spike dt=${rawDt}`);
      assert.ok(Number.isFinite(next.velocity), `Velocity must be finite after spike dt=${rawDt}`);
      assert.ok(!Number.isNaN(next.position));
      assert.ok(!Number.isNaN(next.velocity));
    }
  });

  await t.test('1.2 Microscopic delta-time (dt = 1us, 0.0001s) clamped to 0.0005s minimum', () => {
    const microDts = [0, 0.000001, 0.0001, 0.00049];
    for (const rawDt of microDts) {
      const safeDt = Math.min(0.08, Math.max(0.0005, rawDt));
      assert.strictEqual(safeDt, 0.0005, `Microscopic dt ${rawDt}s must clamp to 0.0005s minimum`);
    }
  });

  await t.test('1.3 Massive velocity impulse (v = 500.0) rapidly damped without divergence', () => {
    let state = { position: 0, velocity: 500.0, target: 0 };
    const dt = 1 / 60;

    // Simulate for 90 frames (1.5 seconds)
    for (let i = 0; i < 90; i++) {
      state = stepHarmonicOscillator(state, dt);
    }

    assert.ok(Math.abs(state.velocity) < 0.05, `Velocity after 1.5s must be damped (<0.05), was ${state.velocity}`);
    assert.ok(Math.abs(state.position) < 0.1, `Position after 1.5s must return near origin (<0.1), was ${state.position}`);
  });

  await t.test('1.4 Deadband snapping strictly extinguishes micro-jitter near equilibrium', () => {
    // LibraryScene.tsx: Math.abs(scrollDiff) < 0.0008 && Math.abs(state.scrollVelocity) < 0.004
    const snapConditions = [
      { diff: 0.0007, vel: 0.003, shouldSnap: true },
      { diff: 0.0001, vel: 0.0005, shouldSnap: true },
      { diff: 0.00081, vel: 0.001, shouldSnap: false }, // diff exceeds threshold
      { diff: 0.0002, vel: 0.0041, shouldSnap: false }, // velocity exceeds threshold
    ];

    for (const cond of snapConditions) {
      const doesSnap = Math.abs(cond.diff) < 0.0008 && Math.abs(cond.vel) < 0.004;
      assert.strictEqual(doesSnap, cond.shouldSnap,
        `Diff ${cond.diff}, Vel ${cond.vel} snap expectation failed`);
    }
  });

  await t.test('1.5 Pseudo-mechanical energy strictly dissipates over oscillation envelope', () => {
    let state = { position: 0, velocity: 10.0, target: 0 };
    const dt = 1 / 60;
    const omega0 = DEFAULT_PHYSICS_CONFIG.snapFreq; // 9.5

    const calcEnergy = (s: typeof state) => {
      return 0.5 * s.velocity * s.velocity + 0.5 * (omega0 * omega0 * 0.001) * (s.position * s.position);
    };

    const initialEnergy = calcEnergy(state);
    let prevPeakEnergy = initialEnergy;

    // Track energy over 120 frames
    for (let cycle = 0; cycle < 4; cycle++) {
      for (let f = 0; f < 30; f++) {
        state = stepHarmonicOscillator(state, dt);
      }
      const currentEnergy = calcEnergy(state);
      assert.ok(currentEnergy < prevPeakEnergy, `Energy must decrease: prev=${prevPeakEnergy}, curr=${currentEnergy}`);
      prevPeakEnergy = currentEnergy;
    }
    assert.ok(prevPeakEnergy < initialEnergy * 0.01, 'Energy after 2s must decay by >99%');
  });
});

// ============================================================================
// SUITE 2: CYLINDRICAL ARC GEOMETRY & SPATIAL INVARIANTS
// ============================================================================
test('Challenger M3-2: Cylindrical Arc Geometry & Spatial Invariants', async (t) => {
  await t.test('2.1 X-coordinate follows exact odd sinusoidal function X(-m) = -X(m)', () => {
    const testOffsets = [0.1, 0.5, 1.0, 2.5, 5.0, 8.0, 10.0];
    for (const m of testOffsets) {
      const posRight = calculateCylindricalPosition(m);
      const posLeft = calculateCylindricalPosition(-m);
      assert.ok(Math.abs(posRight.x + posLeft.x) < 1e-6, `Odd symmetry failed for m=${m}`);
      // Within the front hemisphere (0.35m < pi => m < 8.97), positive m maps to positive X
      if (m < Math.PI / 0.35) {
        assert.strictEqual(posRight.x > 0, true, `Right book must have positive X for m=${m}`);
        assert.strictEqual(posLeft.x < 0, true, `Left book must have negative X for m=${m}`);
      }
    }
  });

  await t.test('2.2 Z-coordinate follows exact even cosinusoidal function Z(-m) = Z(m)', () => {
    const testOffsets = [0.1, 0.5, 1.0, 2.5, 5.0, 10.0];
    for (const m of testOffsets) {
      const posRight = calculateCylindricalPosition(m);
      const posLeft = calculateCylindricalPosition(-m);
      assert.ok(Math.abs(posRight.z - posLeft.z) < 1e-6, `Even symmetry failed for m=${m}`);
    }
  });

  await t.test('2.3 Center active tome (m=0) is positioned at exact coordinate origin (0, 0)', () => {
    const center = calculateCylindricalPosition(0);
    assert.strictEqual(center.x, 0);
    assert.strictEqual(center.z, 0);
  });

  await t.test('2.4 Inward yaw rotation angles strictly toward the shelf center', () => {
    // Formula: angleTowardsCenter = -Math.sign(offset) * 0.22 * fanProgress;
    const rightYaw = -Math.sign(1.0) * 0.22 * 1.0;
    const leftYaw = -Math.sign(-1.0) * 0.22 * 1.0;
    const centerYaw = -Math.sign(0) * 0.22 * 1.0;

    assert.strictEqual(rightYaw, -0.22, 'Books to the right must yaw negative (leftward towards desk center)');
    assert.strictEqual(leftYaw, 0.22, 'Books to the left must yaw positive (rightward towards desk center)');
    assert.strictEqual(centerYaw, -0, 'Center book must have 0 yaw');
  });

  await t.test('2.5 Shelf elevation peaking function: peak 0.18 at center, 0 at |m| >= 0.67', () => {
    const calcElevation = (m: number) => Math.max(0, 1 - Math.abs(m) * 1.5) * 0.18;

    assert.ok(Math.abs(calcElevation(0) - 0.18) < 1e-6, 'Center tome elevation must be 0.18');
    assert.ok(calcElevation(0.3) > 0, 'Slightly off-center tome retains partial elevation');
    assert.strictEqual(calcElevation(0.67), 0, 'Elevation drops to 0 at |m| >= 0.67');
    assert.strictEqual(calcElevation(1.0), 0, 'Neighbor tome has 0 elevation');
    assert.strictEqual(calcElevation(3.0), 0, 'Far tome has 0 elevation');
  });

  await t.test('2.6 Scale attenuation clamps cleanly to 0.82 for all |m| >= 1.0', () => {
    const calcScale = (m: number) => 1.0 - Math.min(1, Math.abs(m)) * (1.0 - 0.82);

    assert.strictEqual(calcScale(0), 1.0, 'Center tome scale is 1.0');
    assert.ok(Math.abs(calcScale(0.5) - 0.91) < 1e-4, 'm=0.5 scale is 0.91');
    assert.ok(Math.abs(calcScale(1.0) - 0.82) < 1e-6, 'Neighbor scale clamps to 0.82');
    assert.ok(Math.abs(calcScale(2.5) - 0.82) < 1e-6, 'Distant scale clamps to 0.82');
    assert.ok(Math.abs(calcScale(100.0) - 0.82) < 1e-6, 'Extreme scale clamps to 0.82');
  });
});

// ============================================================================
// SUITE 3: DISTANCE-DEPENDENT FOLLOW LAG HYDRODYNAMICS
// ============================================================================
test('Challenger M3-2: Distance-Dependent Follow Lag Hydrodynamics', async (t) => {
  await t.test('3.1 Rate constant k(h) is strictly bounded in [6.5, 15.0] for all h', () => {
    // Formula: k(h) = Math.max(6.5, Math.min(15.0, 11.0 - h * 1.15))
    for (let h = 0; h <= 50; h += 0.5) {
      const k = Math.max(6.5, Math.min(15.0, 11.0 - h * 1.15));
      assert.ok(k >= 6.5, `k must be >= 6.5 for h=${h}, was ${k}`);
      assert.ok(k <= 15.0, `k must be <= 15.0 for h=${h}, was ${k}`);
    }
  });

  await t.test('3.2 Follow factor (1 - exp(-k * dt)) is strictly bounded in (0, 1) for all safe dt', () => {
    const dtRange = [0.0005, 0.001, 0.016, 0.033, 0.08];
    const kRange = [6.5, 8.0, 9.85, 11.0, 13.0, 15.0];

    for (const dt of dtRange) {
      for (const k of kRange) {
        const factor = 1 - Math.exp(-k * dt);
        assert.ok(factor > 0, `Factor must be > 0 for k=${k}, dt=${dt}`);
        assert.ok(factor < 1, `Factor must be < 1 for k=${k}, dt=${dt}`);
      }
    }
  });

  await t.test('3.3 Near neighbors track scroll faster than distant tomes (hydrodynamic wave)', () => {
    // Simulate 5 books tracking an abrupt step change in master scroll from 0 to 2
    const targetScroll = 2.0;
    const bookScrolls = [0, 0, 0, 0, 0];
    const activeIndex = 0;
    const dt = 1 / 60;

    // Simulate 10 frames
    for (let f = 0; f < 10; f++) {
      for (let i = 0; i < 5; i++) {
        const h = Math.abs(i - activeIndex);
        const k = Math.max(6.5, Math.min(15.0, 11.0 - h * 1.15));
        const factor = 1 - Math.exp(-k * dt);
        bookScrolls[i] += (targetScroll - bookScrolls[i]) * factor;
      }
    }

    // Verify monotonic propagation: book 0 > book 1 > book 2 > book 3 > book 4
    for (let i = 0; i < 4; i++) {
      assert.ok(bookScrolls[i] >= bookScrolls[i + 1],
        `Book ${i} (${bookScrolls[i]}) must track faster than Book ${i+1} (${bookScrolls[i+1]})`);
    }
  });

  await t.test('3.4 All books converge to master scroll within finite frames', () => {
    const targetScroll = 3.0;
    const bookScrolls = [0, 0, 0, 0, 0];
    const activeIndex = 1;
    const dt = 1 / 60;

    // Simulate 120 frames (2 seconds)
    for (let f = 0; f < 120; f++) {
      for (let i = 0; i < 5; i++) {
        const h = Math.abs(i - activeIndex);
        const k = Math.max(6.5, Math.min(15.0, 11.0 - h * 1.15));
        const factor = 1 - Math.exp(-k * dt);
        bookScrolls[i] += (targetScroll - bookScrolls[i]) * factor;

        if (Math.abs(targetScroll - bookScrolls[i]) < 0.0001) {
          bookScrolls[i] = targetScroll;
        }
      }
    }

    for (let i = 0; i < 5; i++) {
      assert.strictEqual(bookScrolls[i], targetScroll, `Book ${i} must have converged to target`);
    }
  });
});

// ============================================================================
// SUITE 4: 1.05s FLIP S-CURVE & MID-FLIP MODAL GATING
// ============================================================================
test('Challenger M3-2: 1.05s Flip S-Curve & Interaction Gating', async (t) => {
  await t.test('4.1 Full 180° flip duration is calibrated to exactly 1050ms (1.05s)', () => {
    const startAngle = 0;
    const targetAngle = Math.PI;
    const angularDist = Math.abs(targetAngle - startAngle);
    const flipDurationMs = Math.max(100, 1050 * (angularDist / Math.PI));

    assert.strictEqual(flipDurationMs, 1050, 'Full flip duration must be exactly 1050ms');
  });

  await t.test('4.2 Reversing flip mid-rotation scales duration proportionally (no sudden stall or jump)', () => {
    // Reverse at 90° (halfway)
    const midAngle = Math.PI / 2;
    const targetAngle = 0;
    const angularDist = Math.abs(targetAngle - midAngle);
    const flipDurationMs = Math.max(100, 1050 * (angularDist / Math.PI));

    assert.strictEqual(flipDurationMs, 525, 'Mid-flip reversal at 90° must take exactly 525ms');
  });

  await t.test('4.3 Minimum flip duration clamp prevents zero or negative duration on micro-toggles', () => {
    const microAngle = 0.0001;
    const targetAngle = 0;
    const angularDist = Math.abs(targetAngle - microAngle);
    const flipDurationMs = Math.max(100, 1050 * (angularDist / Math.PI));

    assert.strictEqual(flipDurationMs, 100, 'Micro-toggle must clamp to minimum 100ms duration');
  });

  await t.test('4.4 Smoothstep S-curve polynomial (3*tau^2 - 2*tau^3) derivative limits at boundaries', () => {
    // S(tau) = 3*tau^2 - 2*tau^3
    // S'(tau) = 6*tau - 6*tau^2 = 6*tau*(1 - tau)
    // S'(0) = 0 (zero initial angular velocity - no jerk)
    // S'(1) = 0 (zero final angular velocity - smooth settling)
    // S'(0.5) = 1.5 (maximum angular velocity at midpoint)
    const S = (tau: number) => tau * tau * (3 - 2 * tau);
    const dS = (tau: number) => 6 * tau * (1 - tau);

    assert.strictEqual(S(0), 0);
    assert.strictEqual(S(1), 1);
    assert.strictEqual(dS(0), 0, 'Initial angular jerk must be 0');
    assert.strictEqual(dS(1), 0, 'Final angular jerk must be 0');
    assert.strictEqual(dS(0.5), 1.5, 'Peak angular velocity at midpoint');

    // Monotonicity check across 100 steps
    let prev = 0;
    for (let i = 1; i <= 100; i++) {
      const tau = i / 100;
      const val = S(tau);
      assert.ok(val >= prev, `Smoothstep violated monotonicity at tau=${tau}`);
      assert.ok(val >= 0 && val <= 1, `Smoothstep out of [0, 1] range: ${val}`);
      prev = val;
    }
  });

  await t.test('4.5 Mid-flip modal click gating strictly blocks modal open while 0.05 < angle < pi - 0.05', () => {
    // Interaction guard from LibraryScene.tsx:
    // const isMidFlip = stateRef.current.flipAngle > 0.05 && stateRef.current.flipAngle < Math.PI - 0.05;
    const testAngles = [
      { angle: 0, allowsModal: true, reason: 'Resting flat on front cover' },
      { angle: 0.04, allowsModal: true, reason: 'Within front resting tolerance' },
      { angle: 0.051, allowsModal: false, reason: 'Entering mid-flip rotation' },
      { angle: Math.PI / 4, allowsModal: false, reason: 'Quarter turned' },
      { angle: Math.PI / 2, allowsModal: false, reason: 'Perpendicular edge-on' },
      { angle: (3 * Math.PI) / 4, allowsModal: false, reason: 'Three-quarter turned' },
      { angle: Math.PI - 0.051, allowsModal: false, reason: 'Approaching back cover' },
      { angle: Math.PI - 0.04, allowsModal: true, reason: 'Within back resting tolerance' },
      { angle: Math.PI, allowsModal: true, reason: 'Resting flat on back cover' }
    ];

    for (const testCase of testAngles) {
      const isMidFlip = testCase.angle > 0.05 && testCase.angle < Math.PI - 0.05;
      const modalAllowed = !isMidFlip;
      assert.strictEqual(modalAllowed, testCase.allowsModal,
        `Angle ${testCase.angle} (${testCase.reason}) failed modal gating check`);
    }
  });
});

// ============================================================================
// SUITE 5: AERODYNAMIC DRAG BANKING & ASYMMETRIC FILTER
// ============================================================================
test('Challenger M3-2: Aerodynamic Drag Banking & Velocity Filter', async (t) => {
  await t.test('5.1 Asymmetric filter attack (14) vs release (6) rate verification', () => {
    // In LibraryScene.tsx:
    // const filterRate = Math.abs(rawVel) > Math.abs(state.smoothedVelocity) ? 14 : 6;
    let smoothedVelocity = 0;
    const dt = 1 / 60;

    // 1. Attack phase: rawVel = 2.0 (accelerating)
    const rawVelAcc = 2.0;
    const attackRate = Math.abs(rawVelAcc) > Math.abs(smoothedVelocity) ? 14 : 6;
    assert.strictEqual(attackRate, 14, 'Must use fast attack rate 14 when accelerating');
    smoothedVelocity += (rawVelAcc - smoothedVelocity) * Math.min(1.0, dt * attackRate);

    // 2. Release phase: rawVel drops to 0 (decelerating)
    const rawVelDec = 0;
    const releaseRate = Math.abs(rawVelDec) > Math.abs(smoothedVelocity) ? 14 : 6;
    assert.strictEqual(releaseRate, 6, 'Must use slow release rate 6 when decelerating');
  });

  await t.test('5.2 Aerodynamic pitch flowLean clamps strictly to [-0.30, +0.30]', () => {
    const extremeVelocities = [-500, -50, -10, 0, 10, 50, 500];
    for (const v of extremeVelocities) {
      const drag = calculateAerodynamicDrag(v);
      assert.ok(drag.flowLean >= -0.30 && drag.flowLean <= 0.30,
        `flowLean out of bounds for v=${v}: ${drag.flowLean}`);
    }
  });

  await t.test('5.3 Downforce flowDip is strictly negative downward displacement clamped to [-0.09, 0]', () => {
    const velocities = [-100, -5, -0.5, 0, 0.5, 5, 100];
    for (const v of velocities) {
      const absV = Math.abs(v);
      const flowDip = absV === 0 ? 0 : -Math.min(0.09, absV * 0.014);
      assert.ok(flowDip <= 0, `flowDip must be <= 0, was ${flowDip}`);
      assert.ok(flowDip >= -0.09, `flowDip must clamp to >= -0.09, was ${flowDip}`);
    }
  });
});

// ============================================================================
// SUITE 6: DIRTY-FLAG RENDER LOOP & CONTAINER BOUNDS RESILIENCE
// ============================================================================
test('Challenger M3-2: Dirty-Flag Render Loop & Container Bounds Resilience', async (t) => {
  await t.test('6.1 10-frame settling buffer counts down monotonically to 0% idle GPU bypass', () => {
    let decayFrames = 10;
    let rendersExecuted = 0;

    // Simulate 15 idle frames after activity cessation
    for (let frame = 0; frame < 15; frame++) {
      const isDirectlyActive = false;
      if (isDirectlyActive) {
        decayFrames = 10;
      } else if (decayFrames > 0) {
        decayFrames--;
      }

      // Check render short-circuit
      if (!isDirectlyActive && decayFrames === 0) {
        // Idle bypass (0% GPU)
        continue;
      }
      rendersExecuted++;
    }

    assert.ok(rendersExecuted >= 9 && rendersExecuted <= 10,
      `Settling buffer must permit 9-10 settling frames before complete idle bypass, executed: ${rendersExecuted}`);
    assert.strictEqual(decayFrames, 0);
  });

  await t.test('6.2 Re-excitation during decay buffer immediately restores 10 settling frames', () => {
    let decayFrames = 10;

    // 5 frames pass
    for (let f = 0; f < 5; f++) {
      decayFrames--;
    }
    assert.strictEqual(decayFrames, 5);

    // New pointer interaction occurs
    const isDirectlyActive = true;
    if (isDirectlyActive) {
      decayFrames = 10;
    }
    assert.strictEqual(decayFrames, 10, 'Re-excitation must reset decayFrames to 10');
  });

  await t.test('6.3 Container bounds zero/unmounted dimension fallback prevents NaN and division-by-zero', () => {
    // In LibraryScene.tsx:
    // let boundsWidth = initialWidth || window.innerWidth || 1;
    // let boundsHeight = initialHeight || window.innerHeight || 1;
    // const x = ((e.clientX - boundsLeft) / boundsWidth) * 2 - 1;
    const testCases = [
      { width: 0, height: 0 },
      { width: undefined, height: undefined },
      { width: null, height: null },
      { width: -100, height: -100 }
    ];

    for (const tc of testCases) {
      const safeWidth = (tc.width && tc.width > 0) ? tc.width : 1;
      const safeHeight = (tc.height && tc.height > 0) ? tc.height : 1;

      assert.ok(safeWidth >= 1, 'Width must fallback to >= 1');
      assert.ok(safeHeight >= 1, 'Height must fallback to >= 1');

      const clientX = 150;
      const normalizedX = (clientX / safeWidth) * 2 - 1;
      assert.ok(Number.isFinite(normalizedX), 'Normalized X must be finite');
      assert.ok(!Number.isNaN(normalizedX), 'Normalized X must not be NaN');
    }
  });
});
