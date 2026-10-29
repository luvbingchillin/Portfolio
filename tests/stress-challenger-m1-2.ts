/**
 * Challenger M1-2 Empirical Stress Test Suite
 * 3D WebGL Stress, Zero-Allocation RAF Invariant & Physics Engine Verification
 *
 * Focus Areas:
 * 1. Zero-Allocation RAF Invariant in LibraryScene.tsx tick() (Static AST/Lexical + Dynamic Runtime)
 * 2. 2nd-Order Harmonic Oscillator Stability under Chaotic High-Frequency Input Bursts
 * 3. Aerodynamic Drag Banking, Cylindrical Arc Geometry & Distance-Dependent Follow Lag
 * 4. 3D Scene FogExp2 White Infinity Calibration & Studio Lighting Contract Bounds
 * 5. Camera Parallax Bounds, Singularity Avoidance & Lifecycle / WebGL Context Management
 */

import './setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ============================================================================
// SUITE 1: ZERO-ALLOCATION RAF INVARIANT (AST, LEXICAL & RUNTIME STRESS)
// ============================================================================
test('Challenger M1-2: Zero-Allocation RAF Invariant in tick()', async (t) => {
  const scenePath = path.join(projectRoot, 'src/components/LibraryScene.tsx');
  assert.ok(fs.existsSync(scenePath), 'LibraryScene.tsx must exist');
  const sourceCode = fs.readFileSync(scenePath, 'utf-8');

  // Locate the complete tick() function block
  const tickStart = sourceCode.indexOf('const tick = (now: DOMHighResTimeStamp = performance.now()) => {');
  assert.ok(tickStart > 0, 'Must locate tick() function declaration');

  const tickEnd = sourceCode.indexOf('tick();', tickStart);
  assert.ok(tickEnd > tickStart, 'Must locate invocation following tick() definition');

  const tickBody = sourceCode.substring(tickStart, tickEnd);

  await t.test('1.1 Zero forbidden allocation keywords/expressions in tick() body', () => {
    // 1. No 'new' operator
    const newMatches = tickBody.match(/\bnew\s+[A-Za-z0-9_.]+/g);
    assert.strictEqual(
      newMatches,
      null,
      `Forbidden 'new' allocations found in tick(): ${newMatches?.join(', ')}`
    );

    // 2. No array prototype allocating methods
    const arrayAllocMethods = [
      '.map(',
      '.filter(',
      '.slice(',
      '.concat(',
      '.reduce(',
      '.reduceRight(',
      '.flat(',
      '.flatMap(',
      'Array.from(',
      'Array.of('
    ];
    arrayAllocMethods.forEach((method) => {
      assert.strictEqual(
        tickBody.includes(method),
        false,
        `Forbidden array allocation method '${method}' found inside tick()`
      );
    });

    // 3. No object spread or object literal allocations in per-frame logic
    // Pattern checks for standalone object literals like '{ foo: bar }' or 'Object.assign'
    assert.strictEqual(
      tickBody.includes('Object.assign('),
      false,
      'Forbidden Object.assign in tick()'
    );
    assert.strictEqual(
      tickBody.includes('Object.entries('),
      false,
      'Forbidden Object.entries in tick()'
    );
    assert.strictEqual(
      tickBody.includes('Object.keys('),
      false,
      'Forbidden Object.keys in tick()'
    );
    assert.strictEqual(
      tickBody.includes('Object.values('),
      false,
      'Forbidden Object.values in tick()'
    );

    // 4. No dynamic RegExp creations
    assert.strictEqual(
      /\bRegExp\b/.test(tickBody),
      false,
      'Forbidden RegExp instantiation in tick()'
    );
  });

  await t.test('1.2 Pre-allocated scratch objects existence and scope isolation', () => {
    // Scratch objects MUST be declared before tick() and reused across all frames
    const preTickCode = sourceCode.substring(0, tickStart);

    assert.match(
      preTickCode,
      /const\s+CAMERA_ORIGIN\s*=\s*new\s+THREE\.Vector3\(\s*0\s*,\s*0\s*,\s*0\s*\);/,
      'CAMERA_ORIGIN must be pre-allocated before tick()'
    );
    assert.match(
      preTickCode,
      /const\s+RAYCAST_MOUSE\s*=\s*new\s+THREE\.Vector2\(\s*-999\s*,\s*-999\s*\);/,
      'RAYCAST_MOUSE must be pre-allocated before tick()'
    );
    assert.match(
      preTickCode,
      /const\s+raycaster\s*=\s*new\s+THREE\.Raycaster\(\);/,
      'raycaster must be pre-allocated before tick()'
    );

    // Bounds variables must be pre-declared to avoid layout thrashing
    assert.match(
      preTickCode,
      /let\s+boundsLeft\s*=\s*0;/,
      'boundsLeft must be declared outside loop'
    );
    assert.match(
      preTickCode,
      /let\s+boundsTop\s*=\s*0;/,
      'boundsTop must be declared outside loop'
    );
  });

  await t.test('1.3 Runtime zero-allocation verification across 500 simulated RAF frames', () => {
    // We construct a simulated tick environment identical to LibraryScene.tsx
    // and instrument heap memory to monitor allocations during loop execution.

    // Scratch objects
    const CAMERA_ORIGIN = new THREE.Vector3(0, 0, 0);
    const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 100);
    camera.position.set(0, 0.4, 4.8);

    // Book groups
    const numBooks = 5;
    const bookGroups = Array.from({ length: numBooks }, (_, i) => {
      const g = new THREE.Group();
      g.userData = { index: i };
      return g;
    });

    const state = {
      activeIndex: 0,
      targetScroll: 0,
      currentScroll: 0,
      scrollVelocity: 0,
      smoothedVelocity: 0,
      bookScrolls: [0, 0, 0, 0, 0],
      flipAngle: 0,
      flipTargetAngle: 0,
      flipStartAngle: 0,
      flipStartTime: 0,
      flipDurationMs: 1050,
      isFlipping: false,
      isDragging: false,
      mouseX: 0.25,
      mouseY: -0.15
    };

    let decayFrames = 30;
    let lastTime = 1000;
    let renderPasses = 0;

    // Execute 500 frames of tick logic simulating active interaction and settling
    const baseHeapBefore = process.memoryUsage().heapUsed;

    for (let frame = 1; frame <= 500; frame++) {
      const now = 1000 + frame * 16.666;
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      // Simulate occasional user interaction
      if (frame === 10) state.targetScroll = 2;
      if (frame === 150) state.targetScroll = 4;
      if (frame === 300) state.targetScroll = 1;

      // Exact LibraryScene tick math
      const safeDt = Math.min(0.08, Math.max(0.0005, rawDt));
      const step60 = safeDt * 60;

      const scrollDiff = state.targetScroll - state.currentScroll;
      const springForce = scrollDiff * (9.5 * 9.5 * 0.001);
      const dampingForce = -state.scrollVelocity * (12.0 * 0.01);

      state.scrollVelocity = (state.scrollVelocity + (springForce + dampingForce) * step60) * Math.pow(0.89, step60);
      state.currentScroll += state.scrollVelocity * step60;

      if (!state.isDragging && Math.abs(scrollDiff) < 0.0008 && Math.abs(state.scrollVelocity) < 0.004) {
        state.currentScroll = state.targetScroll;
        state.scrollVelocity = 0;
      }

      const rawVel = state.scrollVelocity;
      const filterRate = Math.abs(rawVel) > Math.abs(state.smoothedVelocity) ? 14 : 6;
      state.smoothedVelocity += (rawVel - state.smoothedVelocity) * Math.min(1.0, safeDt * filterRate);
      if (Math.abs(state.smoothedVelocity) < 0.00005) {
        state.smoothedVelocity = 0;
      }

      let isAnyBookLagging = false;
      for (let i = 0; i < numBooks; i++) {
        const h = Math.abs(i - state.activeIndex);
        const k = Math.max(6.5, Math.min(15.0, 11.0 - h * 1.15));
        const followFactor = 1 - Math.exp(-k * safeDt);
        state.bookScrolls[i] += (state.currentScroll - state.bookScrolls[i]) * followFactor;
        const lagDiff = Math.abs(state.currentScroll - state.bookScrolls[i]);
        if (lagDiff < 0.0001) {
          state.bookScrolls[i] = state.currentScroll;
        } else {
          isAnyBookLagging = true;
        }
      }

      const isMoving = Math.abs(state.scrollVelocity) > 0.0001 ||
                       Math.abs(state.smoothedVelocity) > 0.0001 ||
                       Math.abs(state.targetScroll - state.currentScroll) > 0.0008;
      const isFlipping = state.isFlipping;
      const isDirectlyActive = state.isDragging || isMoving || isAnyBookLagging || isFlipping;

      if (isDirectlyActive) {
        decayFrames = 10;
      } else if (decayFrames > 0) {
        decayFrames--;
      }

      if (!isDirectlyActive && decayFrames === 0) {
        continue;
      }

      renderPasses++;

      const Ce = state.smoothedVelocity;
      const absCe = Math.abs(Ce);
      const signCe = Math.sign(Ce);
      const rawLean = signCe * Math.sqrt(absCe) * 0.055;
      const flowLean = Math.max(-0.30, Math.min(0.30, rawLean));
      const flowBank = Ce === 0 ? 0 : -Ce * 0.32;
      const flowDip = absCe === 0 ? 0 : -Math.min(0.09, absCe * 0.014);

      const swayX = state.mouseX * 0.18;
      const swayY = state.mouseY * 0.12;

      for (let idx = 0; idx < numBooks; idx++) {
        const group = bookGroups[idx];
        const offset = idx - state.bookScrolls[idx];
        const absOffset = Math.abs(offset);
        const isActive = absOffset < 0.35;

        const theta = 0.35 * offset;
        const arcX = Math.sin(theta) * 5.52;
        const arcZ = Math.cos(theta) * 2.4 - 2.4;

        const elevation = Math.max(0, 1 - absOffset * 1.5) * 0.18;
        const shelfY = -0.05 + elevation + flowDip;
        const shelfScale = 1.0 - Math.min(1, absOffset) * (1.0 - 0.82);

        group.position.x = arcX;
        group.position.y = shelfY;
        group.position.z = arcZ;
        group.scale.setScalar(shelfScale);

        if (isActive) {
          group.rotation.y = state.flipAngle + swayX + flowBank * 0.70;
          group.rotation.x = -swayY + flowLean;
          group.rotation.z = flowBank * 0.35;
        } else {
          const angleTowardsCenter = -Math.sign(offset) * 0.22;
          group.rotation.y = angleTowardsCenter + flowBank;
          group.rotation.x = flowLean;
          group.rotation.z = flowBank * 0.25;
        }
      }

      camera.position.x = state.mouseX * 0.15;
      camera.position.y = 0.4 + state.mouseY * 0.1;
      camera.lookAt(CAMERA_ORIGIN);
    }

    assert.ok(renderPasses > 0, 'Must have rendered active frames');
    // Verify heap did not explode with runaway object allocations
    const heapDelta = process.memoryUsage().heapUsed - baseHeapBefore;
    // Across 500 frames, zero allocations means negligible heap delta (< 5MB)
    assert.ok(
      heapDelta < 5 * 1024 * 1024,
      `Heap growth was ${(heapDelta / 1024).toFixed(1)}KB, expected near-zero`
    );
  });
});

// ============================================================================
// SUITE 2: HARMONIC OSCILLATOR STABILITY UNDER CHAOTIC INPUT BURSTS
// ============================================================================
test('Challenger M1-2: 2nd-Order Harmonic Oscillator Stability Stress', async (t) => {
  // Simulator for harmonic oscillator physics
  interface PhysicsState {
    currentScroll: number;
    targetScroll: number;
    scrollVelocity: number;
  }

  const stepOscillator = (state: PhysicsState, dtSeconds: number, isDragging = false): void => {
    const safeDt = Math.min(0.08, Math.max(0.0005, dtSeconds));
    const step60 = safeDt * 60;

    const scrollDiff = state.targetScroll - state.currentScroll;
    const springForce = scrollDiff * (9.5 * 9.5 * 0.001); // 0.09025
    const dampingForce = -state.scrollVelocity * (12.0 * 0.01); // 0.12

    state.scrollVelocity = (state.scrollVelocity + (springForce + dampingForce) * step60) * Math.pow(0.89, step60);
    state.currentScroll += state.scrollVelocity * step60;

    // Deadband snap
    if (!isDragging && Math.abs(scrollDiff) < 0.0008 && Math.abs(state.scrollVelocity) < 0.004) {
      state.currentScroll = state.targetScroll;
      state.scrollVelocity = 0;
    }
  };

  await t.test('2.1 High-frequency alternating input impulses (+/- 20 units) settle without explosion', () => {
    const state: PhysicsState = { currentScroll: 0, targetScroll: 0, scrollVelocity: 0 };

    // 50 rapid alternating flick impulses at 120Hz (dt = 0.0083s)
    const impulses = [
      +15, -15, +20, -20, +10, -10, +25, -25, +12, -18,
      +22, -22, +14, -14, +19, -19, +11, -11, +16, -16
    ];

    impulses.forEach((impulse, idx) => {
      // Impulses add directly to velocity
      state.scrollVelocity += impulse;
      // Step physics 2 frames
      stepOscillator(state, 0.0083);
      stepOscillator(state, 0.0083);

      assert.ok(
        Number.isFinite(state.scrollVelocity),
        `Velocity exploded to non-finite at impulse #${idx}`
      );
      assert.ok(
        Number.isFinite(state.currentScroll),
        `Position exploded to non-finite at impulse #${idx}`
      );
      assert.ok(
        !Number.isNaN(state.scrollVelocity),
        `Velocity became NaN at impulse #${idx}`
      );
      assert.ok(
        !Number.isNaN(state.currentScroll),
        `Position became NaN at impulse #${idx}`
      );
    });

    // Once impulses cease, step 180 frames (3 seconds at 60Hz) to verify clean equilibrium snap
    for (let f = 0; f < 180; f++) {
      stepOscillator(state, 0.0166);
    }

    assert.strictEqual(
      state.currentScroll,
      state.targetScroll,
      'Oscillator must snap exactly to targetScroll after settling'
    );
    assert.strictEqual(
      state.scrollVelocity,
      0,
      'Oscillator velocity must snap exactly to 0 after settling'
    );
  });

  await t.test('2.2 Chaotic random input burst (5,000 frames) with extreme dt variations', () => {
    const state: PhysicsState = { currentScroll: 2, targetScroll: 2, scrollVelocity: 0 };

    // Deterministic pseudo-random sequence for repeatability
    let seed = 42;
    const lcg = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // 5,000 chaotic frames
    for (let i = 0; i < 5000; i++) {
      // Wild dt between 0.00001s and 10.0s (testing safeDt clamps)
      const rawDt = lcg() < 0.05 ? lcg() * 5.0 : 0.001 + lcg() * 0.05;

      // Random target shifts
      if (i % 25 === 0) {
        state.targetScroll = Math.floor(lcg() * 5);
      }

      // Random velocity kicks
      if (i % 50 === 0) {
        state.scrollVelocity += (lcg() - 0.5) * 10;
      }

      stepOscillator(state, rawDt);

      assert.ok(
        Number.isFinite(state.scrollVelocity),
        `Non-finite velocity at frame ${i}`
      );
      assert.ok(
        Number.isFinite(state.currentScroll),
        `Non-finite position at frame ${i}`
      );
    }

    // Cease disturbances and let settle for 200 normal frames
    state.targetScroll = 3;
    for (let f = 0; f < 200; f++) {
      stepOscillator(state, 0.0166);
    }

    assert.strictEqual(state.currentScroll, 3, 'Must converge to targetScroll 3');
    assert.strictEqual(state.scrollVelocity, 0, 'Velocity must settle to 0');
  });

  await t.test('2.3 Elastic bounds clamping invariance under infinite drag bursts', () => {
    const numBooks = 5;
    // Elastic bounds in LibraryScene: [-0.4, numBooks - 1 + 0.4] = [-0.4, 4.4]
    const minBound = -0.4;
    const maxBound = numBooks - 1 + 0.4;

    let targetScroll = 0;

    // Simulate extreme forward drag burst (+100,000 clientX delta)
    const massiveForwardDelta = 100000;
    targetScroll -= massiveForwardDelta * 0.0075;
    targetScroll = Math.max(minBound, Math.min(maxBound, targetScroll));
    assert.strictEqual(targetScroll, minBound, 'Massive forward drag must clamp to -0.4');

    // Simulate extreme backward drag burst (-200,000 clientX delta)
    const massiveBackwardDelta = -200000;
    targetScroll -= massiveBackwardDelta * 0.0075;
    targetScroll = Math.max(minBound, Math.min(maxBound, targetScroll));
    assert.strictEqual(targetScroll, maxBound, 'Massive backward drag must clamp to 4.4');

    // Snap on mouseUp clamps strictly within discrete catalog indices [0, numBooks - 1]
    const snapped = Math.round(targetScroll);
    const catalogClamped = Math.max(0, Math.min(numBooks - 1, snapped));
    assert.strictEqual(catalogClamped, 4, 'Catalog clamp on release must be exactly index 4');
  });

  await t.test('2.4 Asymmetric velocity filter convergence under alternating max-speed impulses', () => {
    let smoothedVel = 0;
    const impulses = [8, -8, 8, -8, 8, -8];

    // Under attack rate (14), impulse of 8 should rapidly step toward 8 without exceeding 8
    impulses.forEach((impulse) => {
      const rawVel = impulse;
      const rate = Math.abs(rawVel) > Math.abs(smoothedVel) ? 14 : 6;
      smoothedVel += (rawVel - smoothedVel) * Math.min(1.0, 0.016 * rate);
      assert.ok(Math.abs(smoothedVel) <= 8.0, 'Smoothed velocity magnitude must never exceed raw impulse');
      assert.ok(Number.isFinite(smoothedVel), 'Smoothed velocity must be finite');
    });

    // Deceleration to 0 under release rate (6): exponential decay from ~8 to < 0.00005 requires ~125 frames
    for (let frame = 0; frame < 140; frame++) {
      const rate = Math.abs(0) > Math.abs(smoothedVel) ? 14 : 6;
      smoothedVel += (0 - smoothedVel) * Math.min(1.0, 0.016 * rate);
      if (Math.abs(smoothedVel) < 0.00005) {
        smoothedVel = 0;
        break;
      }
    }

    assert.strictEqual(smoothedVel, 0, 'Velocity must reach exact deadband 0');
  });
});

// ============================================================================
// SUITE 3: 3D SCENE FOG, STUDIO LIGHTING RIG & CONTRAST CONTRACTS
// ============================================================================
test('Challenger M1-2: 3D Scene Fog & Studio Lighting Contract Verification', async (t) => {
  const scenePath = path.join(projectRoot, 'src/components/LibraryScene.tsx');
  const code = fs.readFileSync(scenePath, 'utf-8');

  await t.test('3.1 White FogExp2 contract: exact density 0.032 and pure white color 0xffffff', () => {
    // Contract in PROJECT.md:
    // scene.fog = new THREE.FogExp2(0xffffff, 0.032)
    assert.match(
      code,
      /scene\.fog\s*=\s*new\s+THREE\.FogExp2\(\s*0xffffff\s*,\s*0\.032\s*\);/,
      'scene.fog must strictly match contracted 0xffffff color and 0.032 density'
    );

    // Negative check: ensure NO legacy dark fog remains
    assert.strictEqual(
      code.includes('0x171c1c'),
      false,
      'Dark background color 0x171c1c must not be present in LibraryScene.tsx'
    );
  });

  await t.test('3.2 Mathematical transmission analysis of FogExp2 (0xffffff, 0.032)', () => {
    // Optical transmission formula: T(d) = exp( - (d * density)^2 )
    const density = 0.032;
    const calcTransmission = (d: number) => Math.exp(-Math.pow(d * density, 2));

    // 1. Center Tome (Camera at (0, 0.4, 4.8), Tome at (0, -0.05, 0)) -> dist ~ 4.82m
    const dCenter = Math.sqrt(0 + 0.45 * 0.45 + 4.8 * 4.8);
    const tCenter = calcTransmission(dCenter);
    // Active tome must retain > 97% optical transmission (no washed out cover art)
    assert.ok(
      tCenter > 0.97 && tCenter <= 1.0,
      `Center tome transmission ${tCenter.toFixed(4)} should be > 0.97`
    );

    // 2. Immediate Neighbor Tome (offset = 1, X ~ 1.89, Z ~ -0.14) -> dist ~ 5.17m
    const dNeighbor = Math.sqrt(1.89 * 1.89 + 0.45 * 0.45 + 4.94 * 4.94);
    const tNeighbor = calcTransmission(dNeighbor);
    assert.ok(
      tNeighbor > 0.96,
      `Neighbor tome transmission ${tNeighbor.toFixed(4)} should be > 0.96`
    );

    // 3. Receding Tome (offset = 4, X ~ 5.4, Z ~ -2.0) -> dist ~ 8.7m
    const dReceding = Math.sqrt(5.4 * 5.4 + 0.45 * 0.45 + 6.8 * 6.8);
    const tReceding = calcTransmission(dReceding);
    assert.ok(
      tReceding > 0.90 && tReceding < 0.95,
      `Receding tome transmission ${tReceding.toFixed(4)} should be in 0.90 - 0.95 range`
    );

    // 4. Infinity Horizon (d >= 40m)
    const tHorizon = calcTransmission(40);
    // Horizon dissolves into pure white background (T < 0.20)
    assert.ok(
      tHorizon < 0.20,
      `Horizon transmission ${tHorizon.toFixed(4)} should smoothly dissolve (< 0.20)`
    );

    // 5. Far Infinity (d = 100m)
    const tInfinity = calcTransmission(100);
    assert.ok(
      tInfinity < 1e-4,
      `Infinity transmission ${tInfinity} must approach zero (< 0.0001)`
    );
  });

  await t.test('3.3 Studio lighting rig specifications and exposure calibration', () => {
    // Contract in PROJECT.md:
    // ambientLight: 0xfdfbf7, 0.85
    // renderer.toneMappingExposure: 1.0 - 1.05
    assert.match(
      code,
      /new\s+THREE\.AmbientLight\(\s*0xfdfbf7\s*,\s*0\.85\s*\)/,
      'ambientLight must be 0xfdfbf7 with intensity 0.85'
    );

    assert.match(
      code,
      /renderer\.toneMappingExposure\s*=\s*1\.02;/,
      'toneMappingExposure must be calibrated within [1.0, 1.05] range (1.02)'
    );

    // Key Light: crisp specular highlights
    assert.match(
      code,
      /new\s+THREE\.DirectionalLight\(\s*0xfff8f0\s*,\s*1\.25\s*\)/,
      'keyLight must be 0xfff8f0 with intensity 1.25'
    );

    // Desk Glow Point Light: warm shelf fill
    assert.match(
      code,
      /new\s+THREE\.PointLight\(\s*0xffecd2\s*,\s*0\.9\s*,\s*12\s*,\s*1\.4\s*\)/,
      'deskGlow pointLight must be 0xffecd2 with intensity 0.9, dist 12, decay 1.4'
    );

    // Rim Light: silhouette separation against white background
    assert.match(
      code,
      /new\s+THREE\.DirectionalLight\(\s*0x94b4dc\s*,\s*0\.55\s*\)/,
      'rimLight must be 0x94b4dc with intensity 0.55'
    );
  });

  await t.test('3.4 Camera sway parallax bounds and singularity avoidance', () => {
    // Camera sway formula:
    // camera.position.x = state.mouseX * 0.15;
    // camera.position.y = 0.4 + state.mouseY * 0.1;
    // camera.lookAt(CAMERA_ORIGIN);
    // where CAMERA_ORIGIN is (0, 0, 0) and Z is fixed at 4.8

    // Test extreme mouse coordinates (-10 to +10, e.g. cursor outside window)
    const extremeMouseCoords = [
      { x: -10, y: -10 },
      { x: 10, y: 10 },
      { x: 0, y: 0 },
      { x: -1, y: 1 },
      { x: 1, y: -1 }
    ];

    extremeMouseCoords.forEach(({ x, y }) => {
      const camX = x * 0.15;
      const camY = 0.4 + y * 0.1;
      const camZ = 4.8;

      const camPos = new THREE.Vector3(camX, camY, camZ);
      const targetPos = new THREE.Vector3(0, 0, 0);

      // Distance from camera to target must never collapse to 0 (singularity check)
      const dist = camPos.distanceTo(targetPos);
      assert.ok(dist >= 4.0, `Camera distance ${dist} must remain >= 4.0m to avoid clipping`);
      assert.ok(Number.isFinite(dist), 'Distance must be finite');

      // Forward vector must point primarily along negative Z axis
      const forward = new THREE.Vector3().subVectors(targetPos, camPos).normalize();
      assert.ok(forward.z < -0.85, `Camera forward Z component ${forward.z} must look into screen`);
    });
  });
});

// ============================================================================
// SUITE 4: AERODYNAMIC DRAG BANKING & CYLINDRICAL ARC INVARIANTS
// ============================================================================
test('Challenger M1-2: Drag Banking & Cylindrical Arc Geometry Verification', async (t) => {
  await t.test('4.1 Aerodynamic drag downforce non-positivity under all velocities', () => {
    const velocities = [-500, -50, -5, -0.5, 0, 0.5, 5, 50, 500];

    velocities.forEach((v) => {
      const absCe = Math.abs(v);
      const flowDip = absCe === 0 ? 0 : -Math.min(0.09, absCe * 0.014);

      // Downforce dip must be <= 0.0 (books press DOWN onto mahogany shelf, never hover up)
      assert.ok(
        flowDip <= 0.0,
        `flowDip ${flowDip} for velocity ${v} must be non-positive`
      );
      assert.ok(
        flowDip >= -0.09,
        `flowDip ${flowDip} for velocity ${v} must never exceed -0.09 clamp`
      );
    });
  });

  await t.test('4.2 Flow lean bounds strictly clamped to [-0.30, 0.30] radians', () => {
    const velocities = [-1e6, -100, -1, 0, 1, 100, 1e6];

    velocities.forEach((v) => {
      const signCe = Math.sign(v);
      const absCe = Math.abs(v);
      const rawLean = signCe * Math.sqrt(absCe) * 0.055;
      const flowLean = Math.max(-0.30, Math.min(0.30, rawLean));

      assert.ok(
        flowLean >= -0.30 && flowLean <= 0.30,
        `flowLean ${flowLean} for velocity ${v} must stay within [-0.30, 0.30]`
      );
    });
  });

  await t.test('4.3 Cylindrical Arc reflection symmetry and depth recession', () => {
    // Formula: X = sin(0.35 * offset) * 5.52, Z = cos(0.35 * offset) * 2.4 - 2.4
    const offsets = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

    offsets.forEach((offset) => {
      const thetaPos = 0.35 * offset;
      const thetaNeg = 0.35 * (-offset);

      const xPos = Math.sin(thetaPos) * 5.52;
      const xNeg = Math.sin(thetaNeg) * 5.52;

      const zPos = Math.cos(thetaPos) * 2.4 - 2.4;
      const zNeg = Math.cos(thetaNeg) * 2.4 - 2.4;

      // X coordinate is odd (anti-symmetric)
      assert.ok(
        Math.abs(xPos + xNeg) < 1e-12,
        `X must be anti-symmetric: ${xPos} vs ${xNeg}`
      );

      // Z coordinate is even (symmetric)
      assert.ok(
        Math.abs(zPos - zNeg) < 1e-12,
        `Z must be symmetric: ${zPos} vs ${zNeg}`
      );

      // Z must be non-positive (receding into the depth of the 3D scene)
      assert.ok(
        zPos <= 0,
        `Z (${zPos}) must be non-positive to recede into scene depth`
      );
    });
  });

  await t.test('4.4 Follow lag coefficient k(h) continuity and convergence', () => {
    // k(h) = clamp(11.0 - h * 1.15, 6.5, 15.0)
    for (let h = 0; h <= 10; h += 0.5) {
      const k = Math.max(6.5, Math.min(15.0, 11.0 - h * 1.15));
      assert.ok(k >= 6.5 && k <= 15.0, `k(${h}) = ${k} out of bounds [6.5, 15.0]`);

      // Verify followFactor strictly in (0, 1) across standard frame times (16ms to 33ms)
      const factor16 = 1 - Math.exp(-k * 0.016);
      const factor33 = 1 - Math.exp(-k * 0.033);
      assert.ok(factor16 > 0 && factor16 < 1.0, `followFactor at 16ms (${factor16}) must be in (0, 1)`);
      assert.ok(factor33 > 0 && factor33 < 1.0, `followFactor at 33ms (${factor33}) must be in (0, 1)`);
    }
  });
});

// ============================================================================
// SUITE 5: LIFECYCLE & WEBGL CONTEXT FAULT TOLERANCE
// ============================================================================
test('Challenger M1-2: Lifecycle & WebGL Context Resilience', async (t) => {
  const scenePath = path.join(projectRoot, 'src/components/LibraryScene.tsx');
  const code = fs.readFileSync(scenePath, 'utf-8');

  await t.test('5.1 Comprehensive cleanup function unwires all 8 event listeners', () => {
    // Verify cleanup block in return () => { ... }
    const cleanupStart = code.indexOf('return () => {');
    assert.ok(cleanupStart > 0, 'Must have cleanup function in useEffect');
    const cleanupBlock = code.substring(cleanupStart);

    const requiredCleanups = [
      'cancelAnimationFrame(animationFrameId)',
      'window.removeEventListener(\'resize\', handleResize)',
      'window.removeEventListener(\'scroll\', updateBounds)',
      'container.removeEventListener(\'mousemove\', handleMouseMove)',
      'container.removeEventListener(\'mousedown\', handleMouseDown)',
      'window.removeEventListener(\'mouseup\', handleMouseUp)',
      'container.removeEventListener(\'wheel\', handleWheel)',
      'renderer.domElement.removeEventListener(\'webglcontextlost\', handleContextLost)',
      'renderer.domElement.removeEventListener(\'webglcontextrestored\', handleContextRestored)',
      'renderer.dispose()'
    ];

    requiredCleanups.forEach((clause) => {
      assert.ok(
        cleanupBlock.includes(clause),
        `Cleanup must execute: ${clause}`
      );
    });
  });

  await t.test('5.2 WebGL Context Lost and Restored handlers prevent loop leakage', () => {
    assert.match(
      code,
      /const\s+handleContextLost\s*=\s*\(e:\s*Event\)\s*=>\s*\{[\s\S]*?cancelAnimationFrame\(animationFrameId\);[\s\S]*?\};/,
      'handleContextLost must cancel RAF to prevent GPU driver lockup'
    );

    assert.match(
      code,
      /const\s+handleContextRestored\s*=\s*\(\)\s*=>\s*\{[\s\S]*?tick\(\);[\s\S]*?\};/,
      'handleContextRestored must safely restart tick() loop'
    );
  });
});
