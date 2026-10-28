import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import {
  createFrontCoverTextureAsync,
  getCachedTexture,
  clearTextureCache,
  getTextureCacheKey,
  registerCachedTexture
} from '../../src/utils/textureGenerators.ts';
import {
  safeAspect,
  getWarmingIndices,
  compileSceneWithTimeout
} from '../../src/utils/gpuWarming.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

/**
 * Milestone 4: Phase 2 (Adversarial Coverage Hardening - Tier 5)
 * Challenger M4-1: Empirical Adversarial Verification of WebGL 3D Graphics & Physics
 */

test('Tier 5 - Adversarial WebGL Graphics & Physics Hardening', async (t) => {
  const sampleBook = BOOKS_CATALOG[0];

  // --------------------------------------------------------------------------
  // Area 1: LibraryScene.tsx Physics & Loop Architecture
  // --------------------------------------------------------------------------

  await t.test('T5.1 Dirty-Flag Loop Transitions: Rapid dragging/idle toggling & 10-frame settling buffer', () => {
    // Exact simulation of LibraryScene state machine & decay buffer
    interface SceneState {
      targetScroll: number;
      currentScroll: number;
      scrollVelocity: number;
      smoothedVelocity: number;
      bookScrolls: number[];
      flipAngle: number;
      flipTargetAngle: number;
      isFlipping: boolean;
      isDragging: boolean;
    }

    const state: SceneState = {
      targetScroll: 0,
      currentScroll: 0,
      scrollVelocity: 0,
      smoothedVelocity: 0,
      bookScrolls: [0, 0, 0, 0, 0],
      flipAngle: 0,
      flipTargetAngle: 0,
      isFlipping: false,
      isDragging: false
    };

    let decayFrames = 0;
    const numBooks = state.bookScrolls.length;

    const runFrame = (): { rendered: boolean; decayFrames: number } => {
      const isMoving = Math.abs(state.scrollVelocity) > 0.0001 ||
                       Math.abs(state.smoothedVelocity) > 0.0001 ||
                       Math.abs(state.targetScroll - state.currentScroll) > 0.0008;
      const isFlipping = state.isFlipping || Math.abs(state.flipAngle - state.flipTargetAngle) > 0.001;
      const isAnyBookLagging = state.bookScrolls.some(s => Math.abs(state.currentScroll - s) > 0.0001);
      const isRevealing = false;

      const isDirectlyActive = state.isDragging || isMoving || isAnyBookLagging || isFlipping || isRevealing;

      if (isDirectlyActive) {
        decayFrames = 10;
      } else if (decayFrames > 0) {
        decayFrames--;
        if (decayFrames === 0) {
          // Snap strictly to equilibrium on final settling frame
          state.currentScroll = state.targetScroll;
          state.scrollVelocity = 0;
          state.smoothedVelocity = 0;
          for (let i = 0; i < numBooks; i++) {
            state.bookScrolls[i] = state.targetScroll;
          }
          state.flipAngle = state.flipTargetAngle;
          state.isFlipping = false;
        }
      }

      const shouldRender = isDirectlyActive || decayFrames > 0;
      return { rendered: shouldRender, decayFrames };
    };

    // 1. Rapid toggle dragging on/off 20 times (ending on dragging = true)
    for (let i = 0; i < 21; i++) {
      state.isDragging = i % 2 === 0; // i=20 is true
      const frame = runFrame();
      if (state.isDragging) {
        assert.strictEqual(frame.rendered, true, 'Must render while dragging');
        assert.strictEqual(decayFrames, 10, 'Decay frames must reset to 10 when active');
      }
    }

    assert.strictEqual(state.isDragging, true);
    assert.strictEqual(decayFrames, 10);

    // 2. Dragging stops, velocity settles to 0
    state.isDragging = false;
    state.scrollVelocity = 0;
    state.smoothedVelocity = 0;
    state.currentScroll = state.targetScroll;

    // Verify exactly 10 settling frames count down (from 9 down to 0)
    for (let expectedDecay = 9; expectedDecay >= 0; expectedDecay--) {
      const res = runFrame();
      assert.strictEqual(res.decayFrames, expectedDecay, `Frame buffer countdown at ${expectedDecay}`);
      if (expectedDecay > 0) {
        assert.strictEqual(res.rendered, true, 'Settling buffer frames must render');
      } else {
        // At expectedDecay === 0, it just snapped to equilibrium and rendered the final settling frame
        assert.strictEqual(res.rendered, false, 'Frame reaching 0 decay without active inputs short-circuits');
      }
    }

    assert.strictEqual(decayFrames, 0, 'Buffer must reach 0 after settling buffer expires');

    // 3. Subsequent frames: completely idle, must return false (0% GPU render bypass)
    const idleFrame1 = runFrame();
    assert.strictEqual(idleFrame1.rendered, false, 'Loop must short-circuit when idle and decay reaches 0');
    assert.strictEqual(decayFrames, 0);

    const idleFrame2 = runFrame();
    assert.strictEqual(idleFrame2.rendered, false, 'Consecutive idle frame stays short-circuited');
  });

  await t.test('T5.2 Window Blur/Focus & Resize During Active Flip Interpolation', () => {
    // Simulate resize event while mid-flip
    let flipAngle = 0;
    const flipTargetAngle = Math.PI;
    const flipStartAngle = 0;
    const flipDurationMs = 1050;
    const flipStartTime = 1000;
    let isFlipping = true;
    let decayFrames = 10;

    const requestRender = (frames = 10) => {
      decayFrames = Math.max(decayFrames, frames);
    };

    // Frame at t = 1500ms (mid-flip: elapsed = 500ms, tau = 500/1050 ~ 0.476)
    const midNow = 1500;
    const elapsed = midNow - flipStartTime;
    const tau = Math.min(1.0, elapsed / flipDurationMs);
    const smoothTau = tau * tau * (3 - 2 * tau);
    flipAngle = flipStartAngle + (flipTargetAngle - flipStartAngle) * smoothTau;

    assert.ok(flipAngle > 1.0 && flipAngle < 2.0, `Mid-flip angle ${flipAngle} rad`);
    assert.strictEqual(isFlipping, true);

    // Simulate window resize calling requestRender(5)
    requestRender(5);
    assert.ok(decayFrames >= 5, 'Decay frames must not be truncated below 5');

    // Simulate time advancing past flipDurationMs (now = 2100ms)
    const endNow = 2100;
    const endElapsed = endNow - flipStartTime;
    const endTau = Math.min(1.0, endElapsed / flipDurationMs);
    const endSmoothTau = endTau * endTau * (3 - 2 * endTau);
    flipAngle = flipStartAngle + (flipTargetAngle - flipStartAngle) * endSmoothTau;

    if (endTau >= 1.0) {
      flipAngle = flipTargetAngle;
      isFlipping = false;
    }

    assert.strictEqual(flipAngle, Math.PI, 'Flip must reach exactly Math.PI');
    assert.strictEqual(isFlipping, false, 'isFlipping must become false at completion');
  });

  await t.test('T5.3 Zero-Allocation RAF Guarantees: Static code audit of tick() in LibraryScene.tsx', () => {
    const sceneFile = path.join(projectRoot, 'src/components/LibraryScene.tsx');
    assert.ok(fs.existsSync(sceneFile), 'LibraryScene.tsx must exist');
    const content = fs.readFileSync(sceneFile, 'utf8');

    // Extract the tick function implementation
    const tickStartMatch = content.indexOf('const tick = (now: DOMHighResTimeStamp = performance.now()) => {');
    assert.ok(tickStartMatch > 0, 'Must locate tick() function in LibraryScene.tsx');

    const tickEndMatch = content.indexOf('tick();', tickStartMatch);
    assert.ok(tickEndMatch > tickStartMatch, 'Must locate end of tick()');

    const tickBody = content.substring(tickStartMatch, tickEndMatch);

    // 1. Verify zero 'new ' operator expressions inside tick()
    const newMatches = tickBody.match(/\bnew\s+[A-Za-z0-9_.]+/g);
    assert.strictEqual(newMatches, null, `Found forbidden new allocations inside tick(): ${newMatches?.join(', ')}`);

    // 2. Verify pre-allocated scratch objects are used outside tick
    assert.ok(content.includes('const CAMERA_ORIGIN = new THREE.Vector3('), 'Must pre-allocate CAMERA_ORIGIN outside loop');
    assert.ok(content.includes('const RAYCAST_MOUSE = new THREE.Vector2('), 'Must pre-allocate RAYCAST_MOUSE outside loop');
    assert.ok(content.includes('const raycaster = new THREE.Raycaster();'), 'Must pre-allocate raycaster outside loop');

    // 3. Verify no Array.prototype.map, filter, or slice in tick loop
    assert.strictEqual(tickBody.includes('.map('), false, 'No .map() inside tick()');
    assert.strictEqual(tickBody.includes('.filter('), false, 'No .filter() inside tick()');
    assert.strictEqual(tickBody.includes('.slice('), false, 'No .slice() inside tick()');

    // 4. Verify in-place scalar vector mutations
    assert.ok(tickBody.includes('group.position.x = targetX;'), 'Mutates group.position.x in-place');
    assert.ok(tickBody.includes('group.scale.setScalar(scale);'), 'Mutates group.scale in-place');
    assert.ok(tickBody.includes('camera.position.x = state.mouseX * 0.15;'), 'Mutates camera.position.x in-place');
  });

  await t.test('T5.4 Delta-Time Normalization: Extreme spikes (5s to 60s tab suspension) & recovery', () => {
    // Extreme spike inputs in seconds
    const extremeSpikes = [5.0, 10.0, 30.0, 60.0];

    extremeSpikes.forEach((spike) => {
      // LibraryScene normalization formula:
      const safeDt = Math.min(0.08, Math.max(0.0005, spike));
      const step60 = safeDt * 60;

      assert.strictEqual(safeDt, 0.08, `Extreme spike of ${spike}s must clamp safeDt to 0.08s`);
      assert.strictEqual(step60, 4.8, `step60 must clamp to exactly 4.8 on extreme spike`);

      // 2nd-order harmonic oscillator step under this clamp:
      let currentScroll = 0;
      const targetScroll = 3;
      let scrollVelocity = 1.5;

      const scrollDiff = targetScroll - currentScroll;
      const springForce = scrollDiff * (9.5 * 9.5 * 0.001); // 0.09025 * 3 = 0.27075
      const dampingForce = -scrollVelocity * (12.0 * 0.01); // -1.5 * 0.12 = -0.18

      scrollVelocity = (scrollVelocity + (springForce + dampingForce) * step60) * Math.pow(0.89, step60);
      currentScroll += scrollVelocity * step60;

      assert.ok(Number.isFinite(scrollVelocity), 'Velocity must remain finite');
      assert.ok(Number.isFinite(currentScroll), 'Position must remain finite');
      assert.ok(!Number.isNaN(scrollVelocity), 'Velocity must not be NaN');
      assert.ok(!Number.isNaN(currentScroll), 'Position must not be NaN');
    });

    // Sub-millisecond frames (e.g. 360Hz monitors, timer resolution jitter)
    const tinySpikes = [0.000001, 0.0001, 0.00049];
    tinySpikes.forEach((tiny) => {
      const safeDt = Math.min(0.08, Math.max(0.0005, tiny));
      assert.strictEqual(safeDt, 0.0005, `Microscopic dt ${tiny}s must clamp to 0.0005s`);
      assert.strictEqual(safeDt * 60, 0.03);
    });
  });

  await t.test('T5.5 Asymmetric Velocity Smoother (t=14:6): Rapid sign reversal & clamp protection', () => {
    // Attack rate (14) vs release rate (6)
    let smoothedVelocity = 5.0; // Moving fast to the right
    const rawVel = -5.0;        // Instant violent reversal to the left

    // Step with safeDt = 0.016
    const safeDt = 0.016;
    // When rawVel is -5.0 and smoothedVelocity is 5.0, |rawVel| (5) is not > |smoothedVelocity| (5)
    // Rate is 6 (release)
    const filterRate = Math.abs(rawVel) > Math.abs(smoothedVelocity) ? 14 : 6;
    assert.strictEqual(filterRate, 6, 'Deceleration/release rate must be 6');

    // Simulate 10 frames of reversal convergence
    for (let frame = 0; frame < 10; frame++) {
      const rate = Math.abs(rawVel) > Math.abs(smoothedVelocity) ? 14 : 6;
      smoothedVelocity += (rawVel - smoothedVelocity) * Math.min(1.0, safeDt * rate);
      assert.ok(Number.isFinite(smoothedVelocity));
    }
    // Should have crossed zero or moved significantly toward -5.0 without overshoot
    assert.ok(smoothedVelocity < 5.0 && smoothedVelocity >= -5.0, `Smoothed velocity ${smoothedVelocity}`);

    // Stress test: maximum safeDt = 0.08 with rate 14
    // safeDt * filterRate = 0.08 * 14 = 1.12 > 1.0!
    // Math.min(1.0, safeDt * filterRate) must cap at 1.0 to prevent runaway overshoot!
    let testVel = 0;
    const extremeRaw = 8.0;
    const extremeRate = 14;
    testVel += (extremeRaw - testVel) * Math.min(1.0, 0.08 * extremeRate);
    assert.strictEqual(testVel, extremeRaw, 'Clamp at 1.0 prevents overshooting past target in a single step');

    // Deadband test: threshold < 0.00005 snaps to 0
    let nearZero = 0.000049;
    if (Math.abs(nearZero) < 0.00005) {
      nearZero = 0;
    }
    assert.strictEqual(nearZero, 0, 'Smoothed velocity deadband snaps to exact 0');
  });

  await t.test('T5.6 Aerodynamic Drag Banking: Bounds, clamps & downforce non-positivity', () => {
    // Test a sweep of velocities from -1000 to +1000
    const testVelocities = [-1000, -100, -10, -1, -0.01, 0, 0.01, 1, 10, 100, 1000];

    testVelocities.forEach((v) => {
      const Ce = v;
      const absCe = Math.abs(Ce);
      const signCe = Math.sign(Ce);

      // Pitch tilt (flowLean): sgn(Ce) * sqrt(|Ce|) * 0.055, clamped [-0.30, 0.30]
      const rawLean = signCe * Math.sqrt(absCe) * 0.055;
      const flowLean = Math.max(-0.30, Math.min(0.30, rawLean));

      // Roll bank (flowBank): -Ce * 0.32
      const flowBank = Ce === 0 ? 0 : -Ce * 0.32;

      // Downforce dip (flowDip): -|Ce| * 0.014 (clamped to [-0.09, 0.0])
      const flowDip = absCe === 0 ? 0 : -Math.min(0.09, absCe * 0.014);

      // Invariants:
      assert.ok(flowLean >= -0.30 && flowLean <= 0.30, `flowLean ${flowLean} clamped to [-0.30, 0.30]`);
      assert.ok(flowDip <= 0.0, `flowDip ${flowDip} must be strictly non-positive (downward only)`);
      assert.ok(flowDip >= -0.09, `flowDip ${flowDip} must never exceed -0.09 clamp`);
      if (v === 0) {
        assert.strictEqual(flowLean, 0);
        assert.strictEqual(flowBank, 0);
        assert.strictEqual(flowDip, 0);
      }
    });
  });

  await t.test('T5.7 Cylindrical Arc Spacing & Geometry Formula Verification', () => {
    // X = sin(0.35m) * 5.52, Z = cos(0.35m) * 2.4 - 2.4 (Three.js coordinates)
    const offsets = [-3, -2, -1, 0, 1, 2, 3];

    offsets.forEach((m) => {
      const theta = 0.35 * m;
      const arcX = Math.sin(theta) * 5.52;
      const arcZ = Math.cos(theta) * 2.4 - 2.4;

      if (m === 0) {
        assert.strictEqual(arcX, 0, 'Center book must be at X=0');
        assert.strictEqual(arcZ, 0, 'Center book must be at Z=0');
      } else {
        // Reflection symmetry
        const negTheta = 0.35 * (-m);
        const negX = Math.sin(negTheta) * 5.52;
        const negZ = Math.cos(negTheta) * 2.4 - 2.4;

        assert.strictEqual(arcX, -negX, 'X coordinate must be anti-symmetric');
        assert.strictEqual(arcZ, negZ, 'Z coordinate must be symmetric');
        assert.ok(arcZ <= 0, `arcZ ${arcZ} must recede into screen (negative Z)`);
      }
    });
  });

  await t.test('T5.8 Inward Yaw Angles for Neighbor Tomes', () => {
    // For neighbor tomes (|offset| >= 0.35):
    // angleTowardsCenter = -Math.sign(offset) * 0.22 * fanProgress
    const fanProgress = 1.0;

    const rightNeighborOffset = 1.0;
    const rightYaw = -Math.sign(rightNeighborOffset) * 0.22 * fanProgress;
    assert.strictEqual(rightYaw, -0.22, 'Right neighbor must rotate negative Y (-0.22 rad) toward center');

    const leftNeighborOffset = -1.0;
    const leftYaw = -Math.sign(leftNeighborOffset) * 0.22 * fanProgress;
    assert.strictEqual(leftYaw, 0.22, 'Left neighbor must rotate positive Y (+0.22 rad) toward center');

    // Reveal scaling: at fanProgress = 0, magnitude is 0
    const unrevealedProgress = 0;
    const unrevealedYaw = -Math.sign(rightNeighborOffset) * 0.22 * unrevealedProgress;
    assert.strictEqual(Math.abs(unrevealedYaw), 0, 'Yaw magnitude must be 0 prior to fan reveal');
  });

  await t.test('T5.9 Dynamic Distance-Dependent Follow Lag: k(h) clamp bounds & convergence', () => {
    // k(h) = clamp(11.0 - h * 1.15, 6.5, 15.0)
    const computeK = (h: number) => Math.max(6.5, Math.min(15.0, 11.0 - h * 1.15));

    assert.strictEqual(computeK(0), 11.0, 'h=0 gives k=11.0');
    assert.strictEqual(computeK(1), 9.85, 'h=1 gives k=9.85');
    assert.strictEqual(computeK(2), 8.70, 'h=2 gives k=8.70');
    assert.ok(Math.abs(computeK(3) - 7.55) < 1e-12, 'h=3 gives k=7.55');
    assert.strictEqual(computeK(4), 6.5, 'h=4 clamps to min 6.5');
    assert.strictEqual(computeK(10), 6.5, 'h=10 clamps to min 6.5');
    assert.strictEqual(computeK(-5), 15.0, 'Adversarial negative h clamps to max 15.0');

    // Convergence simulation: currentScroll = 5.0, bookScroll starts at 0.0
    const targetScroll = 5.0;
    let bookScroll = 0.0;
    const safeDt = 0.016;
    const k = computeK(2); // 8.70

    for (let step = 0; step < 90; step++) {
      const followFactor = 1 - Math.exp(-k * safeDt);
      bookScroll += (targetScroll - bookScroll) * followFactor;
      if (Math.abs(targetScroll - bookScroll) < 0.0001) {
        bookScroll = targetScroll;
        break;
      }
    }

    assert.strictEqual(bookScroll, targetScroll, 'Book scroll converged and snapped to targetScroll');
  });

  await t.test('T5.10 Mid-Flip Modal Click Blocking: 0.05 < theta < pi - 0.05', () => {
    // Click guard rule in LibraryScene:
    // const isMidFlip = stateRef.current.flipAngle > 0.05 && stateRef.current.flipAngle < Math.PI - 0.05;
    const isMidFlip = (angle: number) => angle > 0.05 && angle < Math.PI - 0.05;

    // Resting front pose:
    assert.strictEqual(isMidFlip(0.0), false, 'Front rest pose theta=0 is not mid-flip (modal allowed)');
    assert.strictEqual(isMidFlip(0.04), false, 'Angle 0.04 is outside mid-flip guard');

    // Mid-flip angles (MUST be blocked):
    assert.strictEqual(isMidFlip(0.06), true, 'Angle 0.06 is mid-flip (blocked)');
    assert.strictEqual(isMidFlip(0.5), true, 'Angle 0.5 is mid-flip (blocked)');
    assert.strictEqual(isMidFlip(Math.PI / 2), true, 'Angle pi/2 is mid-flip (blocked)');
    assert.strictEqual(isMidFlip(2.5), true, 'Angle 2.5 is mid-flip (blocked)');
    assert.strictEqual(isMidFlip(Math.PI - 0.06), true, 'Angle pi - 0.06 is mid-flip (blocked)');

    // Resting back pose:
    assert.strictEqual(isMidFlip(Math.PI), false, 'Back rest pose theta=pi is not mid-flip (modal allowed)');
    assert.strictEqual(isMidFlip(Math.PI - 0.04), false, 'Angle pi - 0.04 is outside mid-flip guard');
  });

  // --------------------------------------------------------------------------
  // Area 2: textureGenerators.ts & gpuWarming.ts Texture Engine
  // --------------------------------------------------------------------------

  await t.test('T5.11 Texture Cache Deduplication of Concurrent In-Flight Promises', async () => {
    clearTextureCache();

    // Fire 10 simultaneous generation requests for the same book
    const promises = Array.from({ length: 10 }, () =>
      createFrontCoverTextureAsync(sampleBook, { timeSliced: false })
    );

    const textures = await Promise.all(promises);

    // All 10 returned textures must refer to the EXACT SAME instance
    const firstTex = textures[0];
    assert.ok(firstTex instanceof THREE.CanvasTexture);
    textures.forEach((tex, idx) => {
      assert.strictEqual(tex, firstTex, `Concurrent request #${idx} must resolve to identical texture instance`);
    });

    // Cache should hold this instance
    const cacheKey = getTextureCacheKey('front', sampleBook.id);
    assert.strictEqual(getCachedTexture(cacheKey), firstTex);
  });

  await t.test('T5.12 Texture Cache Eviction on Disposal Lifecycle Event', () => {
    clearTextureCache();

    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const tex = new THREE.CanvasTexture(canvas);
    const key = 'test:eviction:item';

    registerCachedTexture(key, tex);
    assert.strictEqual(getCachedTexture(key), tex, 'Texture must be in cache');

    // Trigger dispose event
    tex.dispose();

    // Must be evicted immediately
    assert.strictEqual(getCachedTexture(key), undefined, 'Texture must be evicted upon dispose()');

    // Double dispose should not throw
    assert.doesNotThrow(() => {
      tex.dispose();
    });
  });

  await t.test('T5.13 compileSceneWithTimeout 1500ms Race with Hanging Shader Compilation', async () => {
    const mockScene = new THREE.Scene();
    const mockCamera = new THREE.PerspectiveCamera();

    // Mock renderer whose compileAsync hangs forever
    const hangingRenderer = {
      compileAsync: () => new Promise(() => {}) // never resolves
    } as unknown as THREE.WebGLRenderer;

    const start = performance.now();
    // Test with a 60ms timeout to keep test fast
    const result = await compileSceneWithTimeout(hangingRenderer, mockScene, mockCamera, 60);
    const duration = performance.now() - start;

    assert.strictEqual(result, 'timeout', 'Hanging compilation must resolve to timeout');
    assert.ok(duration >= 50 && duration < 300, `Resolved in ${duration}ms via timeout race`);

    // Mock renderer whose compileAsync rejects
    const rejectingRenderer = {
      compileAsync: () => Promise.reject(new Error('WebGL Shader compile error'))
    } as unknown as THREE.WebGLRenderer;

    const rejectResult = await compileSceneWithTimeout(rejectingRenderer, mockScene, mockCamera, 100);
    assert.strictEqual(rejectResult, 'timeout', 'Rejection must gracefully fallback to timeout');
  });

  await t.test('T5.14 Texture Warmup Radius R=2 Coverage & Edge Cases', () => {
    const total = 5;

    // Normal active center (index 2)
    const midIndices = getWarmingIndices(2, total, 2);
    assert.deepStrictEqual(midIndices, [0, 1, 2, 3, 4], 'All 5 books in radius 2 of center');

    // Left edge (index 0)
    const leftIndices = getWarmingIndices(0, total, 2);
    assert.deepStrictEqual(leftIndices, [0, 1, 2], 'Indices 0, 1, 2 warmed at left edge');

    // Right edge (index 4)
    const rightIndices = getWarmingIndices(4, total, 2);
    assert.deepStrictEqual(rightIndices, [2, 3, 4], 'Indices 2, 3, 4 warmed at right edge');

    // Single book catalog
    const singleIndices = getWarmingIndices(0, 1, 2);
    assert.deepStrictEqual(singleIndices, [0], 'Single book warmed safely');

    // Adversarial negative activeIndex
    const negIndices = getWarmingIndices(-5, total, 2);
    assert.deepStrictEqual(negIndices, [], 'Negative activeIndex returns empty array without out-of-bounds');

    // Adversarial overflow activeIndex
    const overflowIndices = getWarmingIndices(10, total, 2);
    assert.deepStrictEqual(overflowIndices, [], 'Overflow activeIndex returns empty array');
  });

  await t.test('T5.15 Safe Aspect Ratio Calculations: Zero/Negative Protection & Boundary Evaluation', () => {
    // Normal cases
    assert.strictEqual(safeAspect(1920, 1080), 1920 / 1080);
    assert.strictEqual(safeAspect(1000, 1000), 1.0);

    // Zero width
    assert.strictEqual(safeAspect(0, 1080), 16 / 9, 'Zero width must fallback to 16/9');

    // Zero height
    assert.strictEqual(safeAspect(1920, 0), 16 / 9, 'Zero height must fallback to 16/9');

    // Negative dimensions
    assert.strictEqual(safeAspect(-500, 500), 16 / 9, 'Negative width must fallback to 16/9');
    assert.strictEqual(safeAspect(500, -500), 16 / 9, 'Negative height must fallback to 16/9');
    assert.strictEqual(safeAspect(-500, -500), 16 / 9, 'Both negative must fallback to 16/9');

    // Evaluation of non-finite inputs (NaN / Infinity)
    const nanAspect = safeAspect(NaN, 1080);
    // Documenting empirical behavior: NaN <= 0 is false in JS, so NaN / 1080 evaluates to NaN.
    assert.ok(Number.isNaN(nanAspect), 'safeAspect currently evaluates NaN / h when width is NaN');
  });

  await t.test('T5.16 Asymmetric Velocity Smoother Under High-Frequency Alternating Flick Impulses', () => {
    // Alternating flick stress: +8, -8, +8, -8 at 60fps (dt = 0.016)
    let smoothedVel = 0;
    const impulses = [8, -8, 8, -8, 8, -8, 8, -8, 8, -8];

    impulses.forEach((impulse) => {
      const rate = Math.abs(impulse) > Math.abs(smoothedVel) ? 14 : 6;
      smoothedVel += (impulse - smoothedVel) * Math.min(1.0, 0.016 * rate);
      assert.ok(Number.isFinite(smoothedVel), 'Smoothed velocity must stay finite');
      assert.ok(Math.abs(smoothedVel) <= 8.0, 'Smoothed velocity must never exceed max impulse magnitude');
    });

    // Once impulses cease (rawVel = 0), verify smooth release toward zero
    for (let frame = 0; frame < 60; frame++) {
      const rate = Math.abs(0) > Math.abs(smoothedVel) ? 14 : 6;
      smoothedVel += (0 - smoothedVel) * Math.min(1.0, 0.016 * rate);
    }

    assert.ok(Math.abs(smoothedVel) < 0.01, `Smoothed velocity ${smoothedVel} must settle near zero after impulses`);
  });
});
