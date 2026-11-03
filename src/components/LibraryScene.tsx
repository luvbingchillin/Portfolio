import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import * as THREE from 'three';
import type { ProjectBook } from '../types/book.ts';
import {
  createFrontCoverTexture,
  createSpineTexture,
  createBackCoverTexture,
  createPaperEdgesTexture,
  prepareAllBookTexturesAsync,
  ensureFontsReady
} from '../utils/textureGenerators.ts';
import { safeAspect, prepareSceneAssets } from '../utils/gpuWarming.ts';
import type { BookTextures } from '../utils/gpuWarming.ts';

export interface LibrarySceneProps {
  books: ProjectBook[];
  activeIndex: number;
  isFlipped: boolean;
  isLoaded?: boolean;
  onProgress?: (pct: number) => void;
  onReady?: () => void;
  onSelectBook: (index: number) => void;
  onOpenSpread: () => void;
  onFlip?: (flipped: boolean) => void;
}

export const LibraryScene: FC<LibrarySceneProps> = ({
  books,
  activeIndex,
  isFlipped,
  isLoaded = true,
  onProgress,
  onReady,
  onSelectBook,
  onOpenSpread,
  onFlip
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isLoadedRef = useRef(Boolean(isLoaded));
  const revealStartTimeRef = useRef<number | null>(null);

  const onSelectBookRef = useRef(onSelectBook);
  onSelectBookRef.current = onSelectBook;
  const onOpenSpreadRef = useRef(onOpenSpread);
  onOpenSpreadRef.current = onOpenSpread;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onFlipRef = useRef(onFlip);
  onFlipRef.current = onFlip;

  const requestRenderRef = useRef<(frames?: number) => void>(() => {});

  // References for mutable state within the requestAnimationFrame loop
  const stateRef = useRef({
    activeIndex,
    isFlipped,
    targetScroll: activeIndex,
    currentScroll: activeIndex,
    scrollVelocity: 0,
    smoothedVelocity: 0,
    bookScrolls: books.map(() => activeIndex),
    flipAngle: isFlipped ? Math.PI : 0,
    flipTargetAngle: isFlipped ? Math.PI : 0,
    flipStartAngle: isFlipped ? Math.PI : 0,
    flipStartTime: 0,
    flipDurationMs: 1050,
    isFlipping: false,
    // Tilt (vertical) animation state
    tiltAngle: 0,
    tiltTargetAngle: 0,
    tiltStartAngle: 0,
    tiltStartTime: 0,
    tiltDurationMs: 1050,
    isTilting: false,
    isDragging: false,
    dragStartX: 0,
    dragStartScroll: 0,
    lastDragX: 0,
    lastDragY: 0,
    dragDelta: 0,
    mouseX: 0,
    mouseY: 0,
    booksCount: books.length,
    // dragMode: 'scroll' browses shelf, 'rotate' spins active book
    dragMode: 'scroll' as 'scroll' | 'rotate',
    hoveredBookIndex: null as number | null,
    hoverProgress: 0,
    bookHovers: books.map(() => 0),
  });




  // Keep references synced
  useEffect(() => {
    stateRef.current.activeIndex = activeIndex;
    stateRef.current.targetScroll = activeIndex;
    // Reset tilt when switching books
    stateRef.current.tiltAngle = 0;
    requestRenderRef.current(20);
  }, [activeIndex]);

  useEffect(() => {
    stateRef.current.isFlipped = isFlipped;
    const targetAngle = isFlipped ? Math.PI : 0;
    if (Math.abs(stateRef.current.flipTargetAngle - targetAngle) > 0.001) {
      stateRef.current.flipStartAngle = stateRef.current.flipAngle;
      stateRef.current.flipTargetAngle = targetAngle;
      stateRef.current.flipStartTime = performance.now();
      const angularDist = Math.abs(targetAngle - stateRef.current.flipStartAngle);
      stateRef.current.flipDurationMs = Math.max(100, 1050 * (angularDist / Math.PI));
      stateRef.current.isFlipping = true;
    }
    requestRenderRef.current(30);
  }, [isFlipped]);

  useEffect(() => {
    if (isLoaded && !isLoadedRef.current) {
      isLoadedRef.current = true;
      revealStartTimeRef.current = performance.now();
      requestRenderRef.current(40);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (stateRef.current.bookScrolls.length !== books.length) {
      stateRef.current.bookScrolls = books.map(() => stateRef.current.currentScroll);
    }
    if (stateRef.current.bookHovers.length !== books.length) {
      stateRef.current.bookHovers = books.map(() => 0);
    }
    stateRef.current.booksCount = books.length;
  }, [books]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;

    // --- 1. Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 7, 14);

    const initialWidth = container.clientWidth || window.innerWidth;
    const initialHeight = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(
      initialWidth <= 768 ? 48 : 40,
      safeAspect(initialWidth, initialHeight),
      0.1,
      100
    );
    camera.position.set(0, 0, 4.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    container.appendChild(renderer.domElement);

    // --- 2. Studio Lighting Rig (A24 Reference Setup) ---
    // Key directional light: warm specular highlights on cover art & gold foil
    const keyLight = new THREE.DirectionalLight(0xfff9e8, 1.1);
    keyLight.position.set(3.5, 4.0, 6.0);
    scene.add(keyLight);

    // Soft fill light: gentle illumination on shadow side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5.0, -2.0, 4.0);
    scene.add(fillLight);

    // Cool rim light: crisp blue edge separation on spine and top edges
    const rimLight = new THREE.DirectionalLight(0x499ff5, 0.75);
    rimLight.position.set(0, 3.0, -6.0);
    scene.add(rimLight);

    // Studio ambient light: lifts deep leather tones against pure white
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    // --- 3. Gallery Group (Isometric slanted studio view matching A24 reference site) ---
    // Rotated -30 deg on X, -30 deg on Y with 1.08 scale
    const galleryGroup = new THREE.Group();
    galleryGroup.rotation.x = THREE.MathUtils.degToRad(-30);
    galleryGroup.rotation.y = THREE.MathUtils.degToRad(-30);
    galleryGroup.scale.setScalar(1.08);
    scene.add(galleryGroup);

    // --- 4. Assemble 3D Books ---
    const bookWidth = 1.6;
    const bookHeight = 2.3;
    const bookThickness = 0.34;
    const boardThickness = 0.035;

    const paperEdgesTexture = createPaperEdgesTexture();

    const bookGroups: THREE.Group[] = [];
    const bookTexturesMap: BookTextures[] = [];

    books.forEach((book, idx) => {
      const bookGroup = new THREE.Group();
      bookGroup.userData = { index: idx, id: book.id };

      // Front & Spine & Back Procedural Textures
      const frontTex = createFrontCoverTexture(book);
      const spineTex = createSpineTexture(book);
      const backTex = createBackCoverTexture(book);

      bookTexturesMap.push({
        front: frontTex,
        spine: spineTex,
        back: backTex,
        paperEdges: paperEdgesTexture
      });

      // Shared Leather Material for cover edges
      const leatherEdgeMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(book.coverColor),
        roughness: 0.4,
        metalness: 0.1,
        clearcoat: 0.4,
        clearcoatRoughness: 0.1
      });

      // Front Cover Board
      const frontBoardGeo = new THREE.BoxGeometry(bookWidth, bookHeight, boardThickness);
      const frontBoardMats = [
        leatherEdgeMat,
        leatherEdgeMat,
        leatherEdgeMat,
        leatherEdgeMat,
        new THREE.MeshPhysicalMaterial({
          map: frontTex,
          roughness: 0.35,
          metalness: 0.18,
          clearcoat: 0.5,
          clearcoatRoughness: 0.08
        }),
        leatherEdgeMat
      ];
      const frontBoard = new THREE.Mesh(frontBoardGeo, frontBoardMats);
      frontBoard.position.set(0, 0, bookThickness / 2);
      bookGroup.add(frontBoard);

      // Back Cover Board
      const backBoardGeo = new THREE.BoxGeometry(bookWidth, bookHeight, boardThickness);
      const backBoardMats = [
        leatherEdgeMat,
        leatherEdgeMat,
        leatherEdgeMat,
        leatherEdgeMat,
        leatherEdgeMat,
        new THREE.MeshPhysicalMaterial({
          map: backTex,
          roughness: 0.35,
          metalness: 0.18,
          clearcoat: 0.5,
          clearcoatRoughness: 0.08
        })
      ];
      const backBoard = new THREE.Mesh(backBoardGeo, backBoardMats);
      backBoard.position.set(0, 0, -bookThickness / 2);
      bookGroup.add(backBoard);

      // Book Spine (Left side)
      const spineGeo = new THREE.BoxGeometry(boardThickness, bookHeight, bookThickness);
      const spineMats = [
        leatherEdgeMat,
        new THREE.MeshPhysicalMaterial({
          map: spineTex,
          roughness: 0.35,
          metalness: 0.18,
          clearcoat: 0.5,
          clearcoatRoughness: 0.08
        }),
        leatherEdgeMat,
        leatherEdgeMat,
        leatherEdgeMat,
        leatherEdgeMat
      ];
      const spine = new THREE.Mesh(spineGeo, spineMats);
      spine.position.set(-bookWidth / 2 + boardThickness / 2, 0, 0);
      bookGroup.add(spine);

      // Paper Pages Block
      const pagesGeo = new THREE.BoxGeometry(
        bookWidth - boardThickness * 1.5,
        bookHeight - 0.08,
        bookThickness - boardThickness * 1.8
      );
      const paperMat = new THREE.MeshStandardMaterial({
        map: paperEdgesTexture,
        roughness: 0.75,
        metalness: 0.15
      });
      const pagesBlock = new THREE.Mesh(pagesGeo, paperMat);
      pagesBlock.position.set(boardThickness, 0, 0);
      bookGroup.add(pagesBlock);

      // Silk Ribbon Bookmark
      const ribbonGeo = new THREE.BoxGeometry(0.08, 0.45, 0.01);
      const ribbonMat = new THREE.MeshStandardMaterial({
        color: 0x891a20,
        roughness: 0.3,
        metalness: 0.1
      });
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.position.set(0.2, -bookHeight / 2 - 0.16, 0.02);
      ribbon.rotation.z = -0.15;
      bookGroup.add(ribbon);

      galleryGroup.add(bookGroup);
      bookGroups.push(bookGroup);
    });

    // --- 4b. Visual Indicator for Current Selected Book (Reticle & Soft Pedestal) ---
    const indicatorGroup = new THREE.Group();
    indicatorGroup.name = 'selectedBookIndicator';

    // A. GROUND PEDESTAL & SHADOW (Flat on horizontal floor beneath book, y = -1.22)
    const groundGroup = new THREE.Group();
    groundGroup.rotation.x = -Math.PI / 2;
    groundGroup.position.y = -1.22;

    // 1. Soft radial ambient contact shadow disc
    const shadowGeo = new THREE.CircleGeometry(1.65, 48);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 12, 64, 64, 64);
      grad.addColorStop(0, 'rgba(30, 30, 30, 0.28)');
      grad.addColorStop(0.45, 'rgba(30, 30, 30, 0.09)');
      grad.addColorStop(1, 'rgba(30, 30, 30, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    groundGroup.add(shadowMesh);

    // 2. Outer hairline focus ring on ground
    const outerGroundGeo = new THREE.RingGeometry(1.36, 1.378, 64);
    const groundRingMat = new THREE.MeshBasicMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const outerGroundMesh = new THREE.Mesh(outerGroundGeo, groundRingMat);
    outerGroundMesh.position.z = 0.002;
    groundGroup.add(outerGroundMesh);

    // 3. Inner focus ring on ground
    const innerGroundGeo = new THREE.RingGeometry(1.16, 1.172, 64);
    const innerGroundMat = new THREE.MeshBasicMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const innerGroundMesh = new THREE.Mesh(innerGroundGeo, innerGroundMat);
    innerGroundMesh.position.z = 0.003;
    groundGroup.add(innerGroundMesh);

    // 4. Ground quadrant ticks (4 ticks at 0, 90, 180, 270 deg)
    const tickMat = new THREE.MeshBasicMaterial({
      color: 0x891a20, // Crimson brand accent
      transparent: true,
      opacity: 0.70,
      depthWrite: false
    });
    for (let t = 0; t < 4; t++) {
      const tickGeo = new THREE.PlaneGeometry(0.02, 0.12);
      const tickMesh = new THREE.Mesh(tickGeo, tickMat);
      const angle = (t * Math.PI) / 2;
      tickMesh.position.set(Math.cos(angle) * 1.37, Math.sin(angle) * 1.37, 0.004);
      tickMesh.rotation.z = angle;
      groundGroup.add(tickMesh);
    }
    indicatorGroup.add(groundGroup);

    // B. FLOATING RETICLE AROUND ACTIVE BOOK MODEL (Encircles the active volume at y = 0)
    const haloGroup = new THREE.Group();
    haloGroup.position.y = 0;

    // 1. Floating surrounding halo ring
    const haloRingGeo = new THREE.RingGeometry(1.48, 1.498, 64);
    const haloRingMat = new THREE.MeshBasicMaterial({
      color: 0x891a20, // Brand crimson accent
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const haloRingMesh = new THREE.Mesh(haloRingGeo, haloRingMat);
    haloGroup.add(haloRingMesh);

    // 2. Cardinal focus brackets around the model
    const haloTickMat = new THREE.MeshBasicMaterial({
      color: 0x891a20,
      transparent: true,
      opacity: 0.80,
      depthWrite: false
    });
    for (let t = 0; t < 4; t++) {
      const tickGeo = new THREE.PlaneGeometry(0.02, 0.10);
      const tickMesh = new THREE.Mesh(tickGeo, haloTickMat);
      const angle = (t * Math.PI) / 2;
      tickMesh.position.set(Math.cos(angle) * 1.49, Math.sin(angle) * 1.49, 0.002);
      tickMesh.rotation.z = angle;
      haloGroup.add(tickMesh);
    }
    indicatorGroup.add(haloGroup);

    galleryGroup.add(indicatorGroup);

    // --- 5. Background Asynchronous Preloading & GPU Warming Pipeline ---
    const runWarmup = async () => {
      try {
        onProgressRef.current?.(10);
        // Beat 1: Validate fonts
        await ensureFontsReady(1500);
        if (isDisposed) return;
        onProgressRef.current?.(25);

        // Beat 2: Batch texture preparation with mapped progress (25% -> 60%)
        onProgressRef.current?.(35);
        await prepareAllBookTexturesAsync(books, (pct) => {
          if (isDisposed) return;
          const mapped = Math.round(25 + (pct / 100) * 35);
          onProgressRef.current?.(mapped);
        });
        if (isDisposed) return;
        onProgressRef.current?.(60);

        // Beat 3: GPU shader pre-compilation & warming (60% -> 95%)
        await prepareSceneAssets({
          renderer,
          scene,
          camera,
          books,
          activeIndex: stateRef.current.activeIndex,
          textures: bookTexturesMap,
          bookGroups,
          onProgress: (pct) => {
            if (!isDisposed) onProgressRef.current?.(pct);
          }
        });
        if (isDisposed) return;

        // Beat 4: Ready for reveal
        onProgressRef.current?.(100);
        onReadyRef.current?.();
      } catch (err) {
        console.warn('Asset warmup encountered warning:', err);
        if (!isDisposed) {
          onProgressRef.current?.(100);
          onReadyRef.current?.();
        }
      }
    };

    runWarmup();

    // --- 6. Spring Physics & Animation Loop ---
    // Pre-allocated scratch objects for zero-allocation animation loop
    const CAMERA_ORIGIN = new THREE.Vector3(0, 0, 0);
    const RAYCAST_MOUSE = new THREE.Vector2(-999, -999);
    const raycaster = new THREE.Raycaster();

    // Cached container layout bounds to eliminate layout thrashing in handleMouseMove
    let boundsLeft = 0;
    let boundsTop = 0;
    let boundsWidth = initialWidth || window.innerWidth || 1;
    let boundsHeight = initialHeight || window.innerHeight || 1;

    const updateBounds = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      boundsLeft = rect.left;
      boundsTop = rect.top;
      boundsWidth = rect.width || window.innerWidth || 1;
      boundsHeight = rect.height || window.innerHeight || 1;
    };
    updateBounds();

    let decayFrames = 30; // initial settling frames
    const requestRender = (frames = 10) => {
      decayFrames = Math.max(decayFrames, frames);
    };
    requestRenderRef.current = requestRender;

    let lastTime = 0;
    let animationFrameId: number;

    const tick = (now: DOMHighResTimeStamp = performance.now()) => {
      animationFrameId = requestAnimationFrame(tick);

      if (lastTime === 0) lastTime = now;
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      // Delta-time normalization: clamp between 0.0005s and 0.08s
      const safeDt = Math.min(0.08, Math.max(0.0005, rawDt));
      const step60 = safeDt * 60;

      const state = stateRef.current;

      // 1. Spring Physics Step (2nd-Order Damped Harmonic Oscillator)
      // Differential equation: d^2x/dt^2 + gamma * dx/dt + omega_0^2 * (x - target) = 0
      // omega_0 = 9.5 rad/s, gamma = 12.0 s^-1, friction = 0.89
      const scrollDiff = state.targetScroll - state.currentScroll;
      const springForce = scrollDiff * (9.5 * 9.5 * 0.001); // 0.09025
      const dampingForce = -state.scrollVelocity * (12.0 * 0.01); // 0.12

      // Velocity update with step60 scaling and friction damping
      state.scrollVelocity = (state.scrollVelocity + (springForce + dampingForce) * step60) * Math.pow(0.89, step60);
      state.currentScroll += state.scrollVelocity * step60;

      // Deadband snap when near equilibrium
      if (!state.isDragging && Math.abs(scrollDiff) < 0.0008 && Math.abs(state.scrollVelocity) < 0.004) {
        state.currentScroll = state.targetScroll;
        state.scrollVelocity = 0;
      }

      // 2. Asymmetric Velocity Filter (Ce)
      // Fast attack (14) on acceleration vs slow release (6) on deceleration
      const rawVel = state.scrollVelocity;
      const filterRate = Math.abs(rawVel) > Math.abs(state.smoothedVelocity) ? 14 : 6;
      state.smoothedVelocity += (rawVel - state.smoothedVelocity) * Math.min(1.0, safeDt * filterRate);
      if (Math.abs(state.smoothedVelocity) < 0.00005) {
        state.smoothedVelocity = 0;
      }

      // 3. Dynamic Distance-Dependent Follow Lag
      // Each book follows master scroll with k(h) = clamp(11.0 - h * 1.15, 6.5, 15.0)
      const numBooks = bookGroups.length;
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

      // 4. Smooth 1.05s Flip Rotation with Smoothstep S-curve
      // Horizontal flip interpolation
      if (state.isFlipping) {
        const elapsed = now - state.flipStartTime;
        const tau = Math.min(1.0, elapsed / state.flipDurationMs);
        const smoothTau = tau * tau * (3 - 2 * tau);
        state.flipAngle = state.flipStartAngle + (state.flipTargetAngle - state.flipStartAngle) * smoothTau;
        if (tau >= 1.0) {
          state.flipAngle = state.flipTargetAngle;
          state.isFlipping = false;
        }
      }
      // Vertical tilt interpolation
      if (state.isTilting) {
        const elapsed = now - state.tiltStartTime;
        const tau = Math.min(1.0, elapsed / state.tiltDurationMs);
        const smoothTau = tau * tau * (3 - 2 * tau);
        state.tiltAngle = state.tiltStartAngle + (state.tiltTargetAngle - state.tiltStartAngle) * smoothTau;
        if (tau >= 1.0) {
          state.tiltAngle = state.tiltTargetAngle;
          state.isTilting = false;
        }
      }

      // 5. Fan Reveal Progression (1.15s)
      let fanProgress = 1.0;
      if (!isLoadedRef.current) {
        fanProgress = 0.0;
      } else if (revealStartTimeRef.current !== null) {
        const elapsed = now - revealStartTimeRef.current;
        const tau = Math.min(1.0, elapsed / 1150);
        fanProgress = 1 - Math.pow(1 - tau, 3);
      }
      const isRevealing = fanProgress < 1.0;

      // 6. Dirty Flag Check & 10-Frame Settling Buffer
      const isMoving = Math.abs(state.scrollVelocity) > 0.0001 ||
                       Math.abs(state.smoothedVelocity) > 0.0001 ||
                       Math.abs(state.targetScroll - state.currentScroll) > 0.0008;
      const isFlipping = state.isFlipping || Math.abs(state.flipAngle - state.flipTargetAngle) > 0.001;

      // Hover Transition: update per-book smooth exponential approach (dt * 10) matching A24
      let isAnyHoverActive = false;
      for (let i = 0; i < numBooks; i++) {
        const isThisHovered = (state.hoveredBookIndex === i && !state.isDragging);
        const targetHover = isThisHovered ? 1.0 : 0.0;
        state.bookHovers[i] += (targetHover - state.bookHovers[i]) * Math.min(1.0, safeDt * 10);
        if (Math.abs(state.bookHovers[i] - targetHover) < 0.001) {
          state.bookHovers[i] = targetHover;
        }
        if (state.bookHovers[i] > 0.001) {
          isAnyHoverActive = true;
        }
      }
      state.hoverProgress = state.bookHovers[state.activeIndex] || 0;

      const isDirectlyActive = state.isDragging || isMoving || isAnyBookLagging || isFlipping || isRevealing || isAnyHoverActive;

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

      // Short-circuit render if completely idle (0% GPU)
      if (!isDirectlyActive && decayFrames === 0) {
        return;
      }

      // 7. Aerodynamic Drag Banking Calculations
      const Ce = state.smoothedVelocity;
      const absCe = Math.abs(Ce);
      const signCe = Math.sign(Ce);

      // Pitch tilt (flowLean): sgn(Ce) * sqrt(|Ce|) * 0.055, clamped [-0.30, 0.30]
      const rawLean = signCe * Math.sqrt(absCe) * 0.055;
      const flowLean = Math.max(-0.30, Math.min(0.30, rawLean));

      // Roll bank (flowBank): -Ce * 0.32
      const flowBank = Ce === 0 ? 0 : -Ce * 0.32;

      // Downforce dip (flowDip): -|Ce| * 0.014 (clamped to [-0.09, 0.0])
      const flowDip = absCe === 0 ? 0 : -Math.min(0.09, absCe * 0.014);

      // Hover Tilt: only activates when actively hovering a model (matching A24 hoverTiltStrength = 0.21)
      const hoverTiltStrength = 0.21;

      // 8. Zero-Allocation Indexed Loop: Position & Orient Book Meshes
      for (let idx = 0; idx < numBooks; idx++) {
        const group = bookGroups[idx];
        const offset = idx - state.bookScrolls[idx];
        const absOffset = Math.abs(offset);
        const isActive = absOffset < 0.35;

        // Cylindrical Arc Spacing & Geometry (Feature 10)
        // theta = 0.35 * offset
        // X = sin(theta) * 5.52
        // Z = -cos(theta) * 2.4 + 2.4 (mapped into Three.js as -Z)
        const theta = 0.35 * offset;
        const arcX = Math.sin(theta) * 5.52;
        const arcZ = Math.cos(theta) * 2.4 - 2.4; // depth recession into screen (-Z)

        // Elevation Peaking & Scale Attenuation (matching A24 active elevation)
        const elevation = Math.max(0, 1 - absOffset * 1.5) * 0.18;
        const bookY = (isActive ? 0.06 : 0) + elevation * 0.12 + flowDip;
        const bookScale = 1.0 - Math.min(1, absOffset) * (1.0 - 0.80);

        // Interpolated Fan Reveal Coordinates with Flight Recede (-2.2)
        const targetX = arcX * (0.35 + 0.65 * fanProgress);
        const targetZ = -2.2 + (arcZ - (-2.2)) * fanProgress;
        const targetY = bookY;
        const scale = bookScale * (0.8 + 0.2 * fanProgress);

        group.position.x = targetX;
        group.position.y = targetY;
        group.position.z = targetZ;
        group.scale.setScalar(scale);

        // Per-book dynamic interactive hover response
        const bookHover = state.bookHovers[idx] || 0;
        const bookSwayX = state.mouseX * hoverTiltStrength * bookHover;
        const bookSwayY = state.mouseY * hoverTiltStrength * bookHover;

        // Aerodynamic Drag Rotations & Yaw
        if (isActive) {
          // Center Active Tome: flip angle + hover tilt + banked tilt
          group.rotation.y = state.flipAngle + bookSwayX + flowBank * 0.70;
          group.rotation.x = -bookSwayY + flowLean + state.tiltAngle;
          group.rotation.z = flowBank * 0.35;
        } else {
          // Neighbor Tomes: inward orientation along arc + aerodynamic banking + interactive hover movement
          const angleTowardsCenter = -Math.sign(offset) * 0.22 * fanProgress;
          group.rotation.y = angleTowardsCenter + flowBank + bookSwayX * 0.85;
          group.rotation.x = flowLean - bookSwayY * 0.85;
          group.rotation.z = flowBank * 0.25 + bookSwayX * 0.20;

          // Tactile hover reaction on neighbor books: subtly elevate & bring forward towards viewer
          if (bookHover > 0.001) {
            group.position.y += bookHover * 0.12;
            group.position.z += bookHover * 0.35;
            group.scale.multiplyScalar(1.0 + bookHover * 0.06);
          }
        }
      }

      // 9. Update Active Book Visual Indicator Reticle & Soft Pedestal
      if (indicatorGroup) {
        indicatorGroup.visible = fanProgress > 0.05;
        const activeGroup = bookGroups[state.activeIndex];
        if (activeGroup) {
          const targetIndX = activeGroup.position.x;
          const targetIndZ = activeGroup.position.z;
          const targetIndY = activeGroup.position.y;
          // Smooth glide across books during navigation
          indicatorGroup.position.x += (targetIndX - indicatorGroup.position.x) * Math.min(1.0, safeDt * 12);
          indicatorGroup.position.z += (targetIndZ - indicatorGroup.position.z) * Math.min(1.0, safeDt * 12);
          indicatorGroup.position.y = targetIndY;
          const pulse = 1.0 + 0.015 * Math.sin(now * 0.003);
          indicatorGroup.scale.setScalar((0.85 + 0.15 * fanProgress) * (activeGroup.scale.x / 1.08) * pulse);
        }
      }

      // Camera position remains stable at center (0, 0, 4.4) — no unwanted whole-scene drifting
      camera.position.set(0, 0, 4.4);
      camera.lookAt(CAMERA_ORIGIN);

      renderer.render(scene, camera);
    };

    tick();

    // --- 7. Interaction Handlers ---
    const handleMouseMove = (e: MouseEvent) => {
      const x = ((e.clientX - boundsLeft) / boundsWidth) * 2 - 1;
      const y = -(((e.clientY - boundsTop) / boundsHeight) * 2 - 1);
      stateRef.current.mouseX = x;
      stateRef.current.mouseY = y;
      RAYCAST_MOUSE.x = x;
      RAYCAST_MOUSE.y = y;

      if (!isLoadedRef.current) return;

      if (stateRef.current.isDragging) {
        const deltaX = e.clientX - stateRef.current.lastDragX;
        stateRef.current.lastDragX = e.clientX;

        if (stateRef.current.dragMode === 'rotate') {
          // Dragging on the active book: horizontal drag controls yaw, vertical drag controls pitch (tilt)
          const deltaY = e.clientY - stateRef.current.lastDragY;
          stateRef.current.lastDragY = e.clientY;
          // Horizontal drag -> yaw (Y rotation)
          stateRef.current.flipAngle += deltaX * (2 * Math.PI / boundsWidth);
          // Vertical drag -> pitch (X rotation)
          stateRef.current.tiltAngle += deltaY * (2 * Math.PI / boundsHeight);
          // Clamp tilt angle to reasonable range (±π/2)
          const maxTilt = Math.PI / 2;
          stateRef.current.tiltAngle = Math.max(-maxTilt, Math.min(maxTilt, stateRef.current.tiltAngle));
          // Keep flip target in sync so isFlipping doesn't fight live drag
          stateRef.current.flipTargetAngle = stateRef.current.flipAngle;
          stateRef.current.isFlipping = false;
        } else {
          // Dragging on empty space: scroll the shelf
          stateRef.current.targetScroll -= deltaX * 0.0075;
          stateRef.current.targetScroll = Math.max(
            -0.4,
            Math.min(books.length - 1 + 0.4, stateRef.current.targetScroll)
          );
        }
        requestRender(10);
      } else {
        // Raycast to check if mouse is over a 3D book model
        raycaster.setFromCamera(RAYCAST_MOUSE, camera);
        const hits = raycaster.intersectObjects(galleryGroup.children, true);
        let hoveredIdx: number | null = null;
        if (hits.length > 0) {
          let hitObj: THREE.Object3D | null = hits[0].object;
          while (hitObj && hitObj.parent && hitObj.parent !== galleryGroup && hitObj.parent !== scene) {
            hitObj = hitObj.parent;
          }
          if (hitObj && typeof hitObj.userData?.index === 'number') {
            hoveredIdx = hitObj.userData.index;
          }
        }

        const wasHovered = stateRef.current.hoveredBookIndex !== null;
        stateRef.current.hoveredBookIndex = hoveredIdx;

        // Interactive cursor pointer when hovering over ANY 3D book model
        if (container) {
          container.style.cursor = hoveredIdx !== null ? 'pointer' : (stateRef.current.isDragging ? 'grabbing' : 'default');
        }

        let anyHoverTransition = false;
        for (let i = 0; i < stateRef.current.bookHovers.length; i++) {
          if (stateRef.current.bookHovers[i] > 0.001) {
            anyHoverTransition = true;
            break;
          }
        }

        if (hoveredIdx !== null || wasHovered || anyHoverTransition) {
          requestRender(10);
        }
      }
    };

    const handleMouseLeave = () => {
      stateRef.current.hoveredBookIndex = null;
      RAYCAST_MOUSE.set(-999, -999);
      if (container) {
        container.style.cursor = 'default';
      }
      let anyHover = false;
      for (let i = 0; i < stateRef.current.bookHovers.length; i++) {
        if (stateRef.current.bookHovers[i] > 0.001) {
          anyHover = true;
          break;
        }
      }
      if (anyHover) {
        requestRender(10);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isLoadedRef.current) return;

      // Raycast on mousedown to decide drag mode
      const nx = ((e.clientX - boundsLeft) / boundsWidth) * 2 - 1;
      const ny = -(((e.clientY - boundsTop) / boundsHeight) * 2 - 1);
      const pickMouse = new THREE.Vector2(nx, ny);
      const pickRay = new THREE.Raycaster();
      pickRay.setFromCamera(pickMouse, camera);
      const hits = pickRay.intersectObjects(scene.children, true);

      let hitActiveBook = false;
      if (hits.length > 0) {
        let hitObj: THREE.Object3D | null = hits[0].object;
        while (hitObj && hitObj.parent && hitObj.parent !== galleryGroup && hitObj.parent !== scene) {
          hitObj = hitObj.parent;
        }
        if (hitObj?.userData && hitObj.userData.index === stateRef.current.activeIndex) {
          hitActiveBook = true;
        }
      }

      stateRef.current.isDragging = true;
      stateRef.current.dragMode = hitActiveBook ? 'rotate' : 'scroll';
      stateRef.current.dragStartX = e.clientX;
      stateRef.current.lastDragX = e.clientX;
      // Initialise vertical drag tracking
      stateRef.current.lastDragY = e.clientY;
      stateRef.current.dragStartScroll = stateRef.current.targetScroll;
      requestRender(10);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isLoadedRef.current) return;
      if (!stateRef.current.isDragging) return;
      stateRef.current.isDragging = false;
      requestRender(10);

      const totalDrag = Math.abs(e.clientX - stateRef.current.dragStartX);

      if (stateRef.current.dragMode === 'rotate') {
        // Gradually snap yaw back to front face (0 rad)
        stateRef.current.flipStartAngle = stateRef.current.flipAngle;
        stateRef.current.flipTargetAngle = 0;
        stateRef.current.flipStartTime = performance.now();
        const flipAngularDist = Math.abs(stateRef.current.flipAngle);
        stateRef.current.flipDurationMs = Math.max(200, 500 * (flipAngularDist / Math.PI));
        stateRef.current.isFlipping = true;
        stateRef.current.isFlipped = false;
        onFlipRef.current?.(false);
        // Gradually snap pitch back to level (0 rad)
        stateRef.current.tiltStartAngle = stateRef.current.tiltAngle;
        stateRef.current.tiltTargetAngle = 0;
        stateRef.current.tiltStartTime = performance.now();
        const tiltAngularDist = Math.abs(stateRef.current.tiltAngle);
        stateRef.current.tiltDurationMs = Math.max(200, 500 * (tiltAngularDist / Math.PI));
        stateRef.current.isTilting = true;
      } else if (totalDrag > 8) {
        // Shelf scroll: snap to nearest book
        const snapped = Math.round(stateRef.current.targetScroll);
        const clamped = Math.max(0, Math.min(books.length - 1, snapped));
        stateRef.current.targetScroll = clamped;
        onSelectBookRef.current(clamped);
      } else {
        // Click: raycast for book open or selection
        raycaster.setFromCamera(RAYCAST_MOUSE, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          let hitObj: THREE.Object3D | null = intersects[0].object;
          while (hitObj && hitObj.parent && hitObj.parent !== galleryGroup && hitObj.parent !== scene) {
            hitObj = hitObj.parent;
          }
          if (hitObj && hitObj.userData && typeof hitObj.userData.index === 'number') {
            const clickedIdx = hitObj.userData.index;
            if (clickedIdx === stateRef.current.activeIndex) {
              const isMidFlip = stateRef.current.flipAngle > 0.15 && stateRef.current.flipAngle < Math.PI - 0.15;
              if (!isMidFlip) {
                onOpenSpreadRef.current();
              }
            } else {
              onSelectBookRef.current(clickedIdx);
            }
          }
        }
      }
    };

    // Wheel navigation (horizontal or vertical delta)
    const handleWheel = (e: WheelEvent) => {
      if (!isLoadedRef.current) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      stateRef.current.targetScroll += delta * 0.003;
      stateRef.current.targetScroll = Math.max(
        0,
        Math.min(books.length - 1, stateRef.current.targetScroll)
      );
      requestRender(10);
      const snapped = Math.round(stateRef.current.targetScroll);
      if (snapped !== stateRef.current.activeIndex && Math.abs(stateRef.current.targetScroll - snapped) < 0.25) {
        onSelectBookRef.current(snapped);
      }
    };

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      updateBounds();
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = safeAspect(w, h);
      camera.fov = w <= 768 ? 48 : 40;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      requestRender(5);
    };

    // WebGL Context Loss Handlers
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animationFrameId);
    };

    const handleContextRestored = () => {
      lastTime = 0;
      requestRender(20);
      tick();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateBounds, { passive: true });
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Cleanup
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateBounds);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [books]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
    />
  );
};
