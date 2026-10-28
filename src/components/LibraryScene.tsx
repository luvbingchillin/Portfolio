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
}

export const LibraryScene: FC<LibrarySceneProps> = ({
  books,
  activeIndex,
  isFlipped,
  isLoaded = true,
  onProgress,
  onReady,
  onSelectBook,
  onOpenSpread
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isLoadedRef = useRef(Boolean(isLoaded));
  const revealStartTimeRef = useRef<number | null>(null);

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
    isDragging: false,
    dragStartX: 0,
    dragStartScroll: 0,
    lastDragX: 0,
    dragDelta: 0,
    mouseX: 0,
    mouseY: 0,
    booksCount: books.length
  });

  // Keep references synced
  useEffect(() => {
    stateRef.current.activeIndex = activeIndex;
    stateRef.current.targetScroll = activeIndex;
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
    stateRef.current.booksCount = books.length;
  }, [books]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;

    // --- 1. Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x171c1c, 0.055);

    const initialWidth = container.clientWidth || window.innerWidth;
    const initialHeight = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(
      38,
      safeAspect(initialWidth, initialHeight),
      0.1,
      100
    );
    camera.position.set(0, 0.4, 4.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // --- 2. Atmospheric Library Lighting Rig ---
    // Warm reading lamp key light
    const keyLight = new THREE.DirectionalLight(0xffecd2, 1.4);
    keyLight.position.set(3.5, 4.0, 4.5);
    scene.add(keyLight);

    // Soft amber desk glow
    const deskGlow = new THREE.PointLight(0xffb042, 1.8, 12, 1.2);
    deskGlow.position.set(0, 1.8, 2.2);
    scene.add(deskGlow);

    // High library clerestory window rim light
    const rimLight = new THREE.DirectionalLight(0x7da4d9, 0.65);
    rimLight.position.set(-4.0, 3.5, -3.0);
    scene.add(rimLight);

    // Deep ambient tone
    const ambientLight = new THREE.AmbientLight(0x281c12, 0.55);
    scene.add(ambientLight);

    // --- 3. Mahogany Library Shelf Base ---
    const shelfGeo = new THREE.BoxGeometry(32, 0.35, 3.5);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x16110d,
      roughness: 0.4,
      metalness: 0.2
    });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, -1.38, 0);
    scene.add(shelf);

    // Brass front inlay lip on shelf
    const lipGeo = new THREE.BoxGeometry(32, 0.05, 0.06);
    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });
    const shelfLip = new THREE.Mesh(lipGeo, lipMat);
    shelfLip.position.set(0, -1.18, 1.6);
    scene.add(shelfLip);

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

      scene.add(bookGroup);
      bookGroups.push(bookGroup);
    });

    // --- 5. Background Asynchronous Preloading & GPU Warming Pipeline ---
    const runWarmup = async () => {
      try {
        onProgress?.(10);
        // Beat 1: Validate fonts
        await ensureFontsReady(1500);
        if (isDisposed) return;
        onProgress?.(25);

        // Beat 2: Batch texture preparation with mapped progress (25% -> 60%)
        onProgress?.(35);
        await prepareAllBookTexturesAsync(books, (pct) => {
          if (isDisposed) return;
          const mapped = Math.round(25 + (pct / 100) * 35);
          onProgress?.(mapped);
        });
        if (isDisposed) return;
        onProgress?.(60);

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
            if (!isDisposed) onProgress?.(pct);
          }
        });
        if (isDisposed) return;

        // Beat 4: Ready for reveal
        onProgress?.(100);
        onReady?.();
      } catch (err) {
        console.warn('Asset warmup encountered warning:', err);
        if (!isDisposed) {
          onProgress?.(100);
          onReady?.();
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

      // Mouse Parallax Sway
      const swayX = state.mouseX * 0.18;
      const swayY = state.mouseY * 0.12;

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

        // Elevation Peaking & Scale Attenuation
        const elevation = Math.max(0, 1 - absOffset * 1.5) * 0.18;
        const shelfY = -0.05 + elevation + flowDip;
        const shelfScale = 1.0 - Math.min(1, absOffset) * (1.0 - 0.82);

        // Interpolated Fan Reveal Coordinates with Flight Recede (-2.2)
        const targetX = arcX * (0.35 + 0.65 * fanProgress);
        const targetZ = -2.2 + (arcZ - (-2.2)) * fanProgress;
        const targetY = shelfY;
        const scale = shelfScale * (0.8 + 0.2 * fanProgress);

        group.position.x = targetX;
        group.position.y = targetY;
        group.position.z = targetZ;
        group.scale.setScalar(scale);

        // Aerodynamic Drag Rotations & Yaw
        if (isActive) {
          // Center Active Tome: flip angle + mouse sway + banked tilt
          group.rotation.y = state.flipAngle + swayX + flowBank * 0.70;
          group.rotation.x = -swayY + flowLean;
          group.rotation.z = flowBank * 0.35;
        } else {
          // Neighbor Tomes: inward orientation toward desk + aerodynamic banking
          const angleTowardsCenter = -Math.sign(offset) * 0.22 * fanProgress;
          group.rotation.y = angleTowardsCenter + flowBank;
          group.rotation.x = flowLean;
          group.rotation.z = flowBank * 0.25;
        }
      }

      // Ambient camera breathing sway
      camera.position.x = state.mouseX * 0.15;
      camera.position.y = 0.4 + state.mouseY * 0.1;
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
        stateRef.current.targetScroll -= deltaX * 0.0075;
        // Clamp bounds with elastic overshoot
        stateRef.current.targetScroll = Math.max(
          -0.4,
          Math.min(books.length - 1 + 0.4, stateRef.current.targetScroll)
        );
        requestRender(10);
      } else {
        requestRender(4); // Parallax sway
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isLoadedRef.current) return;
      stateRef.current.isDragging = true;
      stateRef.current.dragStartX = e.clientX;
      stateRef.current.lastDragX = e.clientX;
      stateRef.current.dragStartScroll = stateRef.current.targetScroll;
      requestRender(10);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isLoadedRef.current) return;
      if (!stateRef.current.isDragging) return;
      stateRef.current.isDragging = false;
      requestRender(10);

      const totalDrag = Math.abs(e.clientX - stateRef.current.dragStartX);
      if (totalDrag > 8) {
        // Drag snap to nearest book
        const snapped = Math.round(stateRef.current.targetScroll);
        const clamped = Math.max(0, Math.min(books.length - 1, snapped));
        stateRef.current.targetScroll = clamped;
        onSelectBook(clamped);
      } else {
        // Click raycasting
        raycaster.setFromCamera(RAYCAST_MOUSE, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          let hitObj: THREE.Object3D | null = intersects[0].object;
          while (hitObj && hitObj.parent && hitObj.parent !== scene) {
            hitObj = hitObj.parent;
          }
          if (hitObj && hitObj.userData && typeof hitObj.userData.index === 'number') {
            const clickedIdx = hitObj.userData.index;
            if (clickedIdx === stateRef.current.activeIndex) {
              // Guard: Block opening detail modal while book is mid-flip
              const isMidFlip = stateRef.current.flipAngle > 0.05 && stateRef.current.flipAngle < Math.PI - 0.05;
              if (!isMidFlip) {
                onOpenSpread();
              }
            } else {
              // Click neighbor selects it
              onSelectBook(clickedIdx);
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
        onSelectBook(snapped);
      }
    };

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      updateBounds();
      camera.aspect = safeAspect(container.clientWidth, container.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
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
  }, [books, onSelectBook, onOpenSpread, onProgress, onReady]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
    />
  );
};
