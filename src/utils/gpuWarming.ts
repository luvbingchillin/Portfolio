import * as THREE from 'three';
import type { ProjectBook } from '../types/book.ts';

/**
 * Athenaeum 3D Portfolio — GPU Shader Pre-compilation & Texture Warming Engine
 * Feature 6: GPU Shader Pre-compilation & Texture Warming
 * 
 * Capabilities:
 * 1. Asynchronous Shader Pre-compilation: Runs renderer.compileAsync protected by a strict 1500ms timeout race.
 * 2. Localized Neighborhood Warming: Proactively uploads canvas textures to GPU VRAM via renderer.initTexture()
 *    for books within radius R=2 of activeIndex.
 * 3. Multi-Angle Warmup Dummy Render Passes: Executes 4 diverse draw calls (neutral front, 180° back,
 *    flow banking/pitch, and restored rest) to prime hardware Pipeline State Objects (PSOs).
 * 4. Monotonic Progress Reporting: Emits strictly non-decreasing progress matching preloader Beat 3 (60% -> 95%).
 * 5. Robust Aspect Clamping & Zero-Dimension Protection: safeAspect prevents NaN/Infinity in projection matrices.
 */

export const PRELOADER_CONFIG = {
  minDurationMs: 2850,
  gpuTimeoutMs: 1500,
  warmupPasses: 4,
  initialRadius: 2,
  revealDurationMs: 1150
};

export interface PreloaderBeat {
  beat: number;
  name: string;
  telemetry: string;
  startPct: number;
  endPct: number;
}

export const PRELOADER_BEATS: PreloaderBeat[] = [
  {
    beat: 1,
    name: 'Font Asset Validation & Setup',
    telemetry: 'INITIALIZING ARCHIVAL REPOSITORY // VERIFYING TYPOGRAPHY',
    startPct: 0,
    endPct: 25
  },
  {
    beat: 2,
    name: 'Procedural Canvas Texture Generation',
    telemetry: 'SYNTHESIZING PROCEDURAL BINDINGS & LEATHER TEXTURES',
    startPct: 25,
    endPct: 60
  },
  {
    beat: 3,
    name: 'GPU Shader Pre-compilation & Warmup',
    telemetry: 'COMPILING GPU SHADER PIPELINES & WARMING VRAM CACHE',
    startPct: 60,
    endPct: 95
  },
  {
    beat: 4,
    name: 'Theatrical Gallery Fan Reveal',
    telemetry: 'DECRYPTING ARCHIVAL CODEX // REVEALING 3D FOLIO SHELF',
    startPct: 95,
    endPct: 100
  }
];

export interface BookTextures {
  front: THREE.Texture;
  spine: THREE.Texture;
  back: THREE.Texture;
  paperEdges?: THREE.Texture;
}

export interface PrepareSceneAssetsOptions {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera | THREE.Camera;
  books: ProjectBook[];
  activeIndex?: number;
  radius?: number;
  timeoutMs?: number;
  onProgress?: (pct: number) => void;
  startPct?: number; // 60
  endPct?: number;   // 95
  textures?: (BookTextures | undefined)[];
  bookGroups?: THREE.Group[];
}

/**
 * Calculates book indices within radius R of activeIndex, clamped to catalog bounds [0, totalBooks - 1].
 */
export function getWarmingIndices(
  activeIndex: number,
  totalBooks: number,
  radius: number = PRELOADER_CONFIG.initialRadius
): number[] {
  const indices: number[] = [];
  const start = Math.max(0, activeIndex - radius);
  const end = Math.min(totalBooks - 1, activeIndex + radius);
  for (let i = start; i <= end; i++) {
    indices.push(i);
  }
  return indices;
}

/**
 * Returns safe aspect ratio preventing zero-dimension or negative canvas dimensions.
 * Clamps width <= 0 or height <= 0 to standard 16/9.
 */
export function safeAspect(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 16 / 9;
  return width / height;
}

/**
 * Asynchronously compiles shaders for scene and camera with a strict 1500ms safety timeout race.
 */
export async function compileSceneWithTimeout(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  timeoutMs: number = PRELOADER_CONFIG.gpuTimeoutMs
): Promise<'compiled' | 'timeout'> {
  if (!renderer || typeof renderer.compileAsync !== 'function') {
    return 'compiled';
  }

  let timerId: ReturnType<typeof setTimeout> | undefined;

  const compilePromise = renderer.compileAsync(scene, camera)
    .then(() => 'compiled' as const)
    .catch((err) => {
      console.warn('compileAsync error encountered, falling back:', err);
      return 'timeout' as const;
    });

  const timeoutPromise = new Promise<'timeout'>((resolve) => {
    timerId = setTimeout(() => {
      resolve('timeout');
    }, timeoutMs);
  });

  try {
    return await Promise.race([compilePromise, timeoutPromise]);
  } finally {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
  }
}

/**
 * Proactively allocates and uploads textures to GPU VRAM using renderer.initTexture().
 */
export function warmTextures(
  renderer: THREE.WebGLRenderer,
  textures: (THREE.Texture | undefined)[]
): number {
  let count = 0;
  for (const tex of textures) {
    if (tex && renderer && typeof renderer.initTexture === 'function') {
      try {
        renderer.initTexture(tex);
        count++;
      } catch (err) {
        console.warn('initTexture warning:', err);
      }
    }
  }
  return count;
}

/**
 * Positions book meshes for a specific warmup render pose to trigger PSO compilation.
 */
export function layoutWarmupPose(
  bookGroups: THREE.Group[],
  currentScroll: number,
  flipAngle = 0,
  bankAngle = 0,
  flowLean = 0
): void {
  const hGap = 2.45;
  const depthGap = 0.95;
  const inactiveScale = 0.82;

  bookGroups.forEach((group, idx) => {
    const offset = idx - currentScroll;
    const absOffset = Math.abs(offset);

    group.position.x = offset * hGap;
    group.position.z = -absOffset * depthGap;

    const elevation = Math.max(0, 1 - absOffset * 1.5) * 0.18;
    group.position.y = -0.05 + elevation;

    const scale = 1.0 - Math.min(1, absOffset) * (1.0 - inactiveScale);
    group.scale.setScalar(scale);

    if (absOffset < 0.35) {
      group.rotation.y = flipAngle + bankAngle;
      group.rotation.x = flowLean;
      group.rotation.z = bankAngle * 0.5;
    } else {
      const angleTowardsCenter = -Math.sign(offset) * 0.22;
      group.rotation.y = angleTowardsCenter + bankAngle;
      group.rotation.x = flowLean;
      group.rotation.z = bankAngle * 0.3;
    }
  });
}

/**
 * Executes 4 multi-angle warmup passes:
 * 1. Front Neutral
 * 2. Flipped Back 180°
 * 3. Flow Banking & Pitch
 * 4. Restored Rest Pose
 */
export function executeWarmupPasses(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  bookGroups: THREE.Group[],
  activeIndex = 0,
  onPass?: (passNumber: number) => void
): number {
  const passes = PRELOADER_CONFIG.warmupPasses;

  for (let pass = 1; pass <= passes; pass++) {
    switch (pass) {
      case 1:
        layoutWarmupPose(bookGroups, activeIndex, 0, 0, 0);
        break;
      case 2:
        layoutWarmupPose(bookGroups, activeIndex, Math.PI, 0, 0);
        break;
      case 3:
        layoutWarmupPose(bookGroups, activeIndex + 0.3, 0.2, 0.35, -0.15);
        break;
      case 4:
        layoutWarmupPose(bookGroups, activeIndex, 0, 0, 0);
        break;
    }

    if (renderer && typeof renderer.render === 'function') {
      renderer.render(scene, camera);
    }
    if (onPass) {
      onPass(pass);
    }
  }

  return passes;
}

/**
 * Comprehensive GPU asset preparation pipeline for Beat 3 (60% -> 95%).
 * Integrates radius R=2 texture warming, compileSceneWithTimeout, and 4 warmup passes.
 */
export async function prepareSceneAssets(
  options: PrepareSceneAssetsOptions
): Promise<void> {
  const {
    renderer,
    scene,
    camera,
    books,
    activeIndex = 0,
    radius = PRELOADER_CONFIG.initialRadius,
    timeoutMs = PRELOADER_CONFIG.gpuTimeoutMs,
    onProgress,
    startPct = 60,
    endPct = 95,
    textures = [],
    bookGroups = []
  } = options;

  let currentProgress = startPct;
  const report = (pct: number) => {
    const clamped = Math.max(currentProgress, Math.min(100, Math.round(pct)));
    currentProgress = clamped;
    onProgress?.(clamped);
  };

  report(startPct); // 60%

  // 1. Texture warming over radius R=2
  const indices = getWarmingIndices(activeIndex, books.length, radius);
  const texturesToWarm: THREE.Texture[] = [];

  indices.forEach((idx) => {
    const t = textures[idx];
    if (t) {
      if (t.front) texturesToWarm.push(t.front);
      if (t.spine) texturesToWarm.push(t.spine);
      if (t.back) texturesToWarm.push(t.back);
      if (t.paperEdges) texturesToWarm.push(t.paperEdges);
    }
  });

  warmTextures(renderer, texturesToWarm);
  report(startPct + (endPct - startPct) * 0.43); // ~75%

  // 2. GPU Shader Pre-compilation with 1500ms safety timeout race
  await compileSceneWithTimeout(renderer, scene, camera, timeoutMs);
  report(startPct + (endPct - startPct) * 0.71); // ~85%

  // 3. Multi-angle 4 warmup dummy render passes
  if (bookGroups.length > 0) {
    executeWarmupPasses(renderer, scene, camera, bookGroups, activeIndex, (pass) => {
      const passPct = (startPct + (endPct - startPct) * 0.71) +
        ((endPct - (startPct + (endPct - startPct) * 0.71)) * (pass / PRELOADER_CONFIG.warmupPasses));
      report(passPct);
    });
  }

  report(endPct); // 95%
}
