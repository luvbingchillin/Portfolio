import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import * as THREE from 'three';
import type { ProjectBook } from '../types/book';
import {
  createFrontCoverTexture,
  createSpineTexture,
  createBackCoverTexture,
  createPaperEdgesTexture
} from '../utils/textureGenerators';

interface LibrarySceneProps {
  books: ProjectBook[];
  activeIndex: number;
  isFlipped: boolean;
  onSelectBook: (index: number) => void;
  onOpenSpread: () => void;
}

export const LibraryScene: FC<LibrarySceneProps> = ({
  books,
  activeIndex,
  isFlipped,
  onSelectBook,
  onOpenSpread
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References for mutable state within the requestAnimationFrame loop
  const stateRef = useRef({
    activeIndex,
    isFlipped,
    targetScroll: activeIndex,
    currentScroll: activeIndex,
    scrollVelocity: 0,
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
  }, [activeIndex]);

  useEffect(() => {
    stateRef.current.isFlipped = isFlipped;
  }, [isFlipped]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- 1. Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0e0c0a, 0.06);

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.4, 4.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
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

    // High library clerestory window rim light (subtle cool blue contrast)
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

    books.forEach((book, idx) => {
      const bookGroup = new THREE.Group();
      bookGroup.userData = { index: idx, id: book.id };

      // Front & Spine & Back Procedural Textures
      const frontTex = createFrontCoverTexture(book);
      const spineTex = createSpineTexture(book);
      const backTex = createBackCoverTexture(book);

      // Shared Leather Material for cover edges
      const leatherEdgeMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(book.coverColor),
        roughness: 0.4,
        metalness: 0.1,
        clearcoat: 0.4,
        clearcoatRoughness: 0.1
      });

      // Front Cover Board
      // [right, left, top, bottom, front, back]
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
        color: 0x991b1b,
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

    // --- 5. Spring Physics & Animation Loop ---
    const hGap = 2.45;
    const depthGap = 0.95;
    const inactiveScale = 0.82;

    let targetFlipAngle = 0;
    let currentFlipAngle = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    let animationFrameId: number;

    const tick = () => {
      animationFrameId = requestAnimationFrame(tick);

      const state = stateRef.current;

      // Smooth carousel spring interpolation
      const scrollDiff = state.targetScroll - state.currentScroll;
      state.scrollVelocity += scrollDiff * 0.12;
      state.scrollVelocity *= 0.78; // friction damping
      state.currentScroll += state.scrollVelocity;

      // Smooth flip angle (0 = front, PI = back/spine)
      targetFlipAngle = state.isFlipped ? Math.PI : 0;
      currentFlipAngle += (targetFlipAngle - currentFlipAngle) * 0.12;

      // Mouse Parallax Sway
      const swayX = state.mouseX * 0.18;
      const swayY = state.mouseY * 0.12;

      // Position each book along the carousel shelf
      bookGroups.forEach((group, idx) => {
        const offset = idx - state.currentScroll;
        const absOffset = Math.abs(offset);

        // Interpolated X and Z coordinates
        const targetX = offset * hGap;
        const targetZ = -absOffset * depthGap;

        // Active book elevates slightly off the shelf
        const elevation = Math.max(0, 1 - absOffset * 1.5) * 0.18;
        const targetY = -0.05 + elevation;

        // Subtle fluid flow bank / lean based on drag velocity
        const bankAngle = -state.scrollVelocity * 0.35;
        const flowLean = Math.sin(offset * 0.5) * -0.12;

        group.position.x = targetX;
        group.position.y = targetY;
        group.position.z = targetZ;

        // Scaling
        const scale = 1.0 - Math.min(1, absOffset) * (1.0 - inactiveScale);
        group.scale.setScalar(scale);

        // Rotation
        if (Math.abs(offset) < 0.35) {
          // Center active book: applies user flip and mouse hover tilt
          group.rotation.y = currentFlipAngle + swayX + bankAngle;
          group.rotation.x = -swayY + flowLean;
          group.rotation.z = bankAngle * 0.5;
        } else {
          // Neighboring books angle gently inward toward center reading desk
          const angleTowardsCenter = -Math.sign(offset) * 0.22;
          group.rotation.y = angleTowardsCenter + bankAngle;
          group.rotation.x = flowLean;
          group.rotation.z = bankAngle * 0.3;
        }
      });

      // Ambient camera breathing sway
      camera.position.x = state.mouseX * 0.15;
      camera.position.y = 0.4 + state.mouseY * 0.1;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    tick();

    // --- 6. Interaction Handlers ---
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.mouseX = x;
      stateRef.current.mouseY = y;
      mouse.x = x;
      mouse.y = y;

      if (stateRef.current.isDragging) {
        const deltaX = e.clientX - stateRef.current.lastDragX;
        stateRef.current.lastDragX = e.clientX;
        stateRef.current.targetScroll -= deltaX * 0.0075;
        // Clamp bounds with elastic overshoot
        stateRef.current.targetScroll = Math.max(
          -0.4,
          Math.min(books.length - 1 + 0.4, stateRef.current.targetScroll)
        );
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.dragStartX = e.clientX;
      stateRef.current.lastDragX = e.clientX;
      stateRef.current.dragStartScroll = stateRef.current.targetScroll;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!stateRef.current.isDragging) return;
      stateRef.current.isDragging = false;

      const totalDrag = Math.abs(e.clientX - stateRef.current.dragStartX);
      if (totalDrag > 8) {
        // Drag snap to nearest book
        const snapped = Math.round(stateRef.current.targetScroll);
        const clamped = Math.max(0, Math.min(books.length - 1, snapped));
        stateRef.current.targetScroll = clamped;
        onSelectBook(clamped);
      } else {
        // Click raycasting
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          let hitObj: THREE.Object3D | null = intersects[0].object;
          while (hitObj && hitObj.parent && hitObj.parent !== scene) {
            hitObj = hitObj.parent;
          }
          if (hitObj && hitObj.userData && typeof hitObj.userData.index === 'number') {
            const clickedIdx = hitObj.userData.index;
            if (clickedIdx === stateRef.current.activeIndex) {
              // Click on active book opens reading spread
              onOpenSpread();
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
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      stateRef.current.targetScroll += delta * 0.003;
      stateRef.current.targetScroll = Math.max(
        0,
        Math.min(books.length - 1, stateRef.current.targetScroll)
      );
      const snapped = Math.round(stateRef.current.targetScroll);
      if (snapped !== stateRef.current.activeIndex && Math.abs(stateRef.current.targetScroll - snapped) < 0.25) {
        onSelectBook(snapped);
      }
    };

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [books, onSelectBook, onOpenSpread]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
    />
  );
};
