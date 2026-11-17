import * as THREE from 'three';
import type { ProjectBook } from '../types/book.ts';
import { balanceWords } from './textBalance.ts';

/**
 * Athenaeum 3D Portfolio — High-Performance Procedural Texture Engine
 * Feature 5: Async Texture Generator, Memory Caching & Font Readiness Gating
 * 
 * Capabilities:
 * 1. Time-Sliced Asynchronous Generation: Prevents main-thread freezing by chunking
 *    per-pixel leather grain & paper striation calculations across animation frames / microtasks.
 * 2. In-Memory Texture Caching: Reuses allocated GPU CanvasTextures across renders and components,
 *    eliminating redundant memory allocations (~12.7 MB per book).
 * 3. In-Flight Request Deduplication: Merges concurrent generation calls for identical book IDs.
 * 4. Font Readiness Gating: Awaits document.fonts.ready with timeout fallback before canvas rasterization
 *    to prevent fallback font flash or permanent degraded canvas typography.
 * 5. Disposal Lifecycle Tracking: Listens to texture 'dispose' events to prevent dangling cache references.
 * 6. Progress Reporting: Monotonic progress callback (0% -> 100%) for preloader Beat 2 integration.
 * 7. Backwards Compatibility: Full synchronous API preservation for existing callers and test suites.
 */

// ============================================================================
// 1. Types & Interfaces
// ============================================================================

export interface BookTextures {
  front: THREE.CanvasTexture;
  spine: THREE.CanvasTexture;
  back: THREE.CanvasTexture;
  edges: THREE.CanvasTexture;
}

export interface TextureGenerationOptions {
  timeSliced?: boolean;
  chunkSize?: number;
  awaitFonts?: boolean;
  fontTimeoutMs?: number;
}

// ============================================================================
// 2. Global Texture Cache & In-Flight Registry
// ============================================================================

const textureCache = new Map<string, THREE.CanvasTexture>();
const inFlightRequests = new Map<string, Promise<THREE.CanvasTexture>>();

export function getTextureCacheKey(type: 'front' | 'spine' | 'back' | 'edges', id?: string): string {
  return id ? `${type}:${id}` : type;
}

export function getTextureCache(): Map<string, THREE.CanvasTexture> {
  return textureCache;
}

export function getCachedTexture(key: string): THREE.CanvasTexture | undefined {
  return textureCache.get(key);
}

export function setCachedTexture(key: string, texture: THREE.CanvasTexture): void {
  registerCachedTexture(key, texture);
}

export function registerCachedTexture(key: string, texture: THREE.CanvasTexture): THREE.CanvasTexture {
  textureCache.set(key, texture);

  const onDispose = () => {
    texture.removeEventListener('dispose', onDispose);
    if (textureCache.get(key) === texture) {
      textureCache.delete(key);
    }
  };
  texture.addEventListener('dispose', onDispose);

  return texture;
}

export function disposeBookTextures(bookId: string): void {
  const keys = [
    getTextureCacheKey('front', bookId),
    getTextureCacheKey('spine', bookId),
    getTextureCacheKey('back', bookId)
  ];
  keys.forEach((k) => {
    const tex = textureCache.get(k);
    if (tex) {
      tex.dispose();
      textureCache.delete(k);
    }
  });
}

export function clearTextureCache(): void {
  const textures = Array.from(textureCache.values());
  textureCache.clear();
  inFlightRequests.clear();
  textures.forEach((t) => t.dispose());
}

// ============================================================================
// 3. Time-Slicing & Event Loop Cooperating Utility
// ============================================================================

export function yieldToMain(): Promise<void> {
  if (
    typeof window !== 'undefined' &&
    'scheduler' in window &&
    typeof (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler?.yield === 'function'
  ) {
    return (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler.yield();
  }
  if (typeof requestAnimationFrame !== 'undefined') {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ============================================================================
// 4. Font Readiness Gating & Safe Fallback
// ============================================================================

let fontsReadyPromise: Promise<boolean> | null = null;

export async function ensureFontsReady(timeoutMs = 1500): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.ready) {
    return true;
  }
  if (!fontsReadyPromise) {
    const readyPromise = document.fonts.ready.then(() => true);
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeoutMs);
    });
    fontsReadyPromise = Promise.race([readyPromise, timeoutPromise]).catch(() => false);
  }
  return fontsReadyPromise;
}

// ============================================================================
// 5. Procedural Noise Generators (Sync & Time-Sliced Async)
// ============================================================================

let sharedNoisePatternCanvas: HTMLCanvasElement | null = null;

function getNoisePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (typeof document === 'undefined') return null;
  if (!sharedNoisePatternCanvas) {
    const size = 64;
    sharedNoisePatternCanvas = document.createElement('canvas');
    sharedNoisePatternCanvas.width = size;
    sharedNoisePatternCanvas.height = size;
    const nCtx = sharedNoisePatternCanvas.getContext('2d');
    if (nCtx) {
      try {
        const img = nCtx.createImageData(size, size);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const val = Math.floor(Math.random() * 255);
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
          d[i + 3] = 32; // subtle ~12% alpha noise
        }
        nCtx.putImageData(img, 0, 0);
      } catch {
        // Fallback for mock environments
      }
    }
  }
  return ctx.createPattern ? ctx.createPattern(sharedNoisePatternCanvas, 'repeat') : null;
}

function addLeatherGrainSync(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string
): void {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Fast GPU pattern fill
  const pattern = getNoisePattern(ctx);
  if (pattern) {
    ctx.save();
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, width * 0.35,
    width / 2, height / 2, width * 0.8
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

async function addLeatherGrainAsync(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string,
  _chunkSize = 350_000
): Promise<void> {
  addLeatherGrainSync(ctx, width, height, baseColor);
  await yieldToMain();
}

// ============================================================================
// 6. Front Cover Texture (Sync & Async)
// ============================================================================

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    if (typeof ctx.arcTo === 'function') {
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
    } else {
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    }
  }
}

function safeSetLineDash(ctx: CanvasRenderingContext2D, segments: number[]): void {
  if (typeof ctx.setLineDash === 'function') {
    ctx.setLineDash(segments);
  }
}

function safeEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot = 0,
  start = 0,
  end = Math.PI * 2
): void {
  if (typeof ctx.ellipse === 'function') {
    ctx.ellipse(x, y, rx, ry, rot, start, end);
  } else {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(1, ry / (rx || 1));
    ctx.arc(0, 0, rx, start, end);
    ctx.restore();
  }
}

/**
 * 1. AST Syntax Tree & Inverted Index Radar (Code Search Engine)
 */
function drawCodeSearchEmblem(ctx: CanvasRenderingContext2D, foil: string): void {
  ctx.strokeStyle = foil;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  safeSetLineDash(ctx, [4, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, Math.PI * 2);
  ctx.stroke();
  safeSetLineDash(ctx, []);

  const drawNode = (x: number, y: number, r: number, fill = false) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = foil;
      ctx.fill();
    }
    ctx.stroke();
  };

  const rootX = 0, rootY = -48;
  const l1LeftX = -36, l1LeftY = -12;
  const l1RightX = 36, l1RightY = -12;
  const l2A = -52, l2AY = 30;
  const l2B = -20, l2BY = 30;
  const l2C = 20, l2CY = 30;
  const l2D = 52, l2DY = 30;

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY); ctx.lineTo(l1LeftX, l1LeftY);
  ctx.moveTo(rootX, rootY); ctx.lineTo(l1RightX, l1RightY);
  ctx.moveTo(l1LeftX, l1LeftY); ctx.lineTo(l2A, l2AY);
  ctx.moveTo(l1LeftX, l1LeftY); ctx.lineTo(l2B, l2BY);
  ctx.moveTo(l1RightX, l1RightY); ctx.lineTo(l2C, l2CY);
  ctx.moveTo(l1RightX, l1RightY); ctx.lineTo(l2D, l2DY);
  ctx.stroke();

  drawNode(rootX, rootY, 9, true);
  drawNode(l1LeftX, l1LeftY, 7, false);
  drawNode(l1RightX, l1RightY, 7, false);
  drawNode(l2A, l2AY, 5, true);
  drawNode(l2B, l2BY, 5, true);
  drawNode(l2C, l2CY, 5, true);
  drawNode(l2D, l2DY, 5, true);

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-68, -25); ctx.lineTo(-80, -25); ctx.lineTo(-80, 25); ctx.lineTo(-68, 25);
  ctx.moveTo(68, -25); ctx.lineTo(80, -25); ctx.lineTo(80, 25); ctx.lineTo(68, 25);
  ctx.stroke();

  ctx.font = '700 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = foil;
  ctx.fillText('< AST // IDX >', 0, 64);
}

/**
 * 2. Magic: The Gathering Card Draft Sigil (CardDrafter)
 */
function drawCardDrafterEmblem(ctx: CanvasRenderingContext2D, foil: string): void {
  ctx.strokeStyle = foil;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const px = Math.cos(angle) * 92;
    const py = Math.sin(angle) * 92;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(0, -6); ctx.lineTo(5, 0); ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fillStyle = foil;
    ctx.fill();
    ctx.restore();
  }

  const drawCardOutline = (angleRad: number, scale = 1, isCenter = false) => {
    ctx.save();
    ctx.rotate(angleRad);
    ctx.scale(scale, scale);
    const cardW = 50;
    const cardH = 74;
    const r = 5;

    if (isCenter) {
      ctx.fillStyle = foil;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, r);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    ctx.strokeStyle = foil;
    ctx.lineWidth = isCenter ? 2.5 : 1.5;
    ctx.beginPath();
    drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, r);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeRect(-cardW / 2 + 5, -cardH / 2 + 6, cardW - 10, 36);

    if (isCenter) {
      ctx.beginPath();
      safeEllipse(ctx, 0, -cardH / 2 + 24, 14, 11, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -cardH / 2 + 15);
      ctx.lineTo(6, -cardH / 2 + 24);
      ctx.lineTo(0, -cardH / 2 + 33);
      ctx.lineTo(-6, -cardH / 2 + 24);
      ctx.closePath();
      ctx.fillStyle = foil;
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-cardW / 2 + 8, cardH / 2 - 20); ctx.lineTo(cardW / 2 - 8, cardH / 2 - 20);
      ctx.moveTo(-cardW / 2 + 8, cardH / 2 - 13); ctx.lineTo(cardW / 2 - 8, cardH / 2 - 13);
      ctx.moveTo(-cardW / 2 + 8, cardH / 2 - 6);  ctx.lineTo(cardW / 2 - 18, cardH / 2 - 6);
      ctx.stroke();
    }
    ctx.restore();
  };

  drawCardOutline(-0.28, 0.92, false);
  drawCardOutline(0.28, 0.92, false);
  drawCardOutline(0, 1.0, true);
}

/**
 * 3. Enterprise AI & Talent Neural Growth Nexus (AutomateAI)
 */
function drawAutomateAIEmblem(ctx: CanvasRenderingContext2D, foil: string): void {
  ctx.strokeStyle = foil;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const x = Math.cos(angle) * 92;
    const y = Math.sin(angle) * 92;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = foil;
    ctx.fillRect(-3, -4, 6, 8);
    ctx.restore();
  }

  ctx.lineWidth = 1.2;
  safeSetLineDash(ctx, [3, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, 75, 0, Math.PI * 2);
  ctx.stroke();
  safeSetLineDash(ctx, []);

  const hexRadius = 45;
  const nodes: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    nodes.push([Math.cos(angle) * hexRadius, Math.sin(angle) * hexRadius]);
  }

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  nodes.forEach(([x, y]) => {
    ctx.moveTo(0, 0); ctx.lineTo(x, y);
  });
  for (let i = 0; i < 6; i++) {
    const [x1, y1] = nodes[i];
    const [x2, y2] = nodes[(i + 1) % 6];
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  nodes.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = foil;
    ctx.fill();
    ctx.stroke();
  });

  ctx.save();
  ctx.beginPath();
  const r1 = 18;
  const r2 = 6;
  for (let i = 0; i < 4; i++) {
    const a1 = (i * Math.PI) / 2;
    const a2 = a1 + Math.PI / 4;
    if (i === 0) ctx.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
    else ctx.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
    ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
  }
  ctx.closePath();
  ctx.fillStyle = foil;
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-28, 62); ctx.lineTo(0, 48); ctx.lineTo(28, 62);
  ctx.moveTo(-20, 72); ctx.lineTo(0, 58); ctx.lineTo(20, 72);
  ctx.stroke();
}

/**
 * 4. Illuminated Open Tome & Celestial Storyteller (A New Story)
 */
function drawANewStoryEmblem(ctx: CanvasRenderingContext2D, foil: string): void {
  ctx.strokeStyle = foil;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1;
  safeSetLineDash(ctx, [2, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, 80, 0, Math.PI * 2);
  ctx.stroke();
  safeSetLineDash(ctx, []);

  ctx.save();
  ctx.translate(0, -48);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? 14 : 5;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = foil;
  ctx.fill();

  ctx.strokeStyle = foil;
  ctx.lineWidth = 1.2;
  const rays = [-0.6, -0.3, 0.3, 0.6];
  rays.forEach((rAngle) => {
    const rx = Math.sin(rAngle) * 32;
    const ry = Math.cos(rAngle) * 25;
    ctx.beginPath();
    ctx.moveTo(Math.sin(rAngle) * 16, Math.cos(rAngle) * 12);
    ctx.lineTo(rx, ry);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.translate(0, 8);
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.bezierCurveTo(-20, 32, -45, 26, -58, 20);
  ctx.lineTo(-58, -18);
  ctx.bezierCurveTo(-45, -12, -20, -6, 0, -8);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.bezierCurveTo(20, 32, 45, 26, 58, 20);
  ctx.lineTo(58, -18);
  ctx.bezierCurveTo(45, -12, 20, -6, 0, -8);
  ctx.closePath();
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -8); ctx.lineTo(0, 36);
  ctx.stroke();

  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const yOffset = -2 + i * 8;
    ctx.beginPath();
    ctx.moveTo(-48, yOffset); ctx.lineTo(-12, yOffset + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, yOffset + 2); ctx.lineTo(48, yOffset);
    ctx.stroke();
  }
  ctx.restore();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 44);
  ctx.bezierCurveTo(-6, 54, 8, 62, 0, 72);
  ctx.stroke();
}

/**
 * 5. Classical Athenaeum Archway & Library Vault Key (Portfolio Archive)
 */
function drawPortfolioArchiveEmblem(ctx: CanvasRenderingContext2D, foil: string): void {
  ctx.strokeStyle = foil;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 80, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -62);
  ctx.lineTo(-44, -32);
  ctx.lineTo(44, -32);
  ctx.closePath();
  ctx.stroke();

  ctx.lineWidth = 1;
  for (let a = -Math.PI / 4; a <= Math.PI / 4; a += Math.PI / 8) {
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(Math.sin(a) * 16, -56 + Math.cos(a) * 14);
    ctx.stroke();
  }

  ctx.lineWidth = 2;
  ctx.strokeRect(-42, -32, 10, 72);
  ctx.strokeRect(32, -32, 10, 72);

  ctx.beginPath();
  ctx.arc(0, -10, 32, Math.PI, 0, false);
  ctx.stroke();

  ctx.fillStyle = foil;
  ctx.beginPath();
  ctx.moveTo(-5, -42); ctx.lineTo(5, -42); ctx.lineTo(4, -34); ctx.lineTo(-4, -34);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -6, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 4); ctx.lineTo(0, 34);
  ctx.moveTo(0, 24); ctx.lineTo(8, 24); ctx.lineTo(8, 28); ctx.lineTo(0, 28);
  ctx.moveTo(0, 30); ctx.lineTo(10, 30); ctx.lineTo(10, 34); ctx.lineTo(0, 34);
  ctx.stroke();

  ctx.strokeRect(-48, 40, 96, 6);
}

function drawProjectFrontEmblem(
  ctx: CanvasRenderingContext2D,
  width: number,
  cy: number,
  book: ProjectBook,
  foil: string
): void {
  ctx.save();
  ctx.translate(width / 2, cy);

  switch (book.id) {
    case 'code-search':
      drawCodeSearchEmblem(ctx, foil);
      break;
    case 'card-drafter':
      drawCardDrafterEmblem(ctx, foil);
      break;
    case 'automate-ai':
      drawAutomateAIEmblem(ctx, foil);
      break;
    case 'a-new-story':
      drawANewStoryEmblem(ctx, foil);
      break;
    case 'portfolio-archive':
    default:
      drawPortfolioArchiveEmblem(ctx, foil);
      break;
  }

  ctx.restore();
}

function drawFrontCoverArtwork(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  book: ProjectBook
): void {
  const foil = book.accentColor || '#d4af37';

  // Outer Gilded Ornamental Border
  ctx.strokeStyle = foil;
  ctx.lineWidth = 6;
  ctx.strokeRect(50, 50, width - 100, height - 100);

  ctx.lineWidth = 2;
  ctx.strokeRect(66, 66, width - 132, height - 132);

  // Corner filigree accents
  const corners = [
    [50, 50], [width - 50, 50],
    [50, height - 50], [width - 50, height - 50]
  ];
  ctx.fillStyle = foil;
  corners.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top Archive Classification Header
  ctx.textAlign = 'center';
  ctx.font = '500 24px "Ppmuseum", "PP Museum", "Cinzel", "Times New Roman", serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('PORTFOLIO ARCHIVES • VOL. XXIV', width / 2, 130);

  ctx.font = '400 20px "Ppmuseum", "PP Museum", "JetBrains Mono", monospace';
  ctx.letterSpacing = '3px';
  ctx.fillText((book.edition || '').toUpperCase(), width / 2, 170);

  // Decorative Central Divider Line
  ctx.beginPath();
  ctx.moveTo(width / 2 - 120, 220);
  ctx.lineTo(width / 2 + 120, 220);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Custom Emblem for this Specific Project
  drawProjectFrontEmblem(ctx, width, 420, book, foil);

  // Book Title (Majestic Serif with embossed shadow)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.font = '700 68px "Ppeiko", "PP Eiko", "Cinzel", "Cormorant Garamond", serif';
  ctx.letterSpacing = '4px';

  // Title wrapping with balanced line breaks
  const rawTitle = book.title || '';
  const words = rawTitle.split(' ').filter(Boolean);
  if (words.length > 2) {
    const balanced = balanceWords(words, 2);
    ctx.fillText(balanced[0] || '', width / 2, 680);
    ctx.fillText(balanced[1] || '', width / 2, 760);
  } else {
    ctx.fillText(rawTitle, width / 2, 720);
  }

  // Subtitle
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.font = '400 32px "Ppneuemontreal", "PP Neue Montreal", "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(book.subtitle ? `“${book.subtitle}”` : '', width / 2, 850);

  // Bottom Curator Info
  ctx.font = '600 24px "Ppmuseum", "PP Museum", "Cinzel", serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('CURATED & CODED BY', width / 2, 1150);

  ctx.font = '700 36px "Ppneuemontreal", "PP Neue Montreal", "Cormorant Garamond", serif';
  ctx.letterSpacing = '3px';
  ctx.fillText((book.curator || '').toUpperCase(), width / 2, 1205);

  // Bottom Call Number Plate
  ctx.strokeRect(width / 2 - 190, 1260, 380, 48);
  ctx.font = '500 20px "Ppmuseum", "PP Museum", "JetBrains Mono", monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText(book.callNumber || '', width / 2, 1292);
}

export function createFrontCoverTexture(book: ProjectBook): THREE.CanvasTexture {
  const cacheKey = getTextureCacheKey('front', book.id);
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const width = 1024;
  const height = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  addLeatherGrainSync(ctx, width, height, book.coverColor);
  drawFrontCoverArtwork(ctx, width, height, book);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return registerCachedTexture(cacheKey, texture);
}

export async function createFrontCoverTextureAsync(
  book: ProjectBook,
  options: TextureGenerationOptions = {}
): Promise<THREE.CanvasTexture> {
  const cacheKey = getTextureCacheKey('front', book.id);
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async () => {
    if (options.awaitFonts !== false) {
      await ensureFontsReady(options.fontTimeoutMs ?? 1500);
    }

    const width = 1024;
    const height = 1400;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    if (options.timeSliced !== false) {
      await addLeatherGrainAsync(ctx, width, height, book.coverColor, options.chunkSize);
    } else {
      addLeatherGrainSync(ctx, width, height, book.coverColor);
    }

    drawFrontCoverArtwork(ctx, width, height, book);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return registerCachedTexture(cacheKey, texture);
  })().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

// ============================================================================
// 7. Spine Texture (Sync & Async)
// ============================================================================

function drawProjectSpineSigil(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  book: ProjectBook,
  foil: string
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = foil;
  ctx.fillStyle = foil;

  switch (book.id) {
    case 'code-search': {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -22); ctx.lineTo(20, 0); ctx.lineTo(0, 22); ctx.lineTo(-20, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('</>', 0, 1);
      break;
    }
    case 'card-drafter': {
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-12, -18, 24, 36);
      ctx.beginPath();
      ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'automate-ai': {
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a1 = (i * Math.PI) / 2;
        const a2 = a1 + Math.PI / 4;
        if (i === 0) ctx.moveTo(Math.cos(a1) * 12, Math.sin(a1) * 12);
        else ctx.lineTo(Math.cos(a1) * 12, Math.sin(a1) * 12);
        ctx.lineTo(Math.cos(a2) * 4, Math.sin(a2) * 4);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'a-new-story': {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 12); ctx.lineTo(-14, 8); ctx.lineTo(-14, -8); ctx.lineTo(0, -5);
      ctx.lineTo(14, -8); ctx.lineTo(14, 8); ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -5); ctx.lineTo(0, 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -14, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'portfolio-archive':
    default: {
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-14, -18, 28, 36);
      ctx.beginPath();
      ctx.arc(0, -4, 10, Math.PI, 0, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

function drawSpineArtwork(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  book: ProjectBook
): void {
  const foil = book.accentColor || '#d4af37';

  // Bookbinding Raised Bands (Horizontal Ribs)
  const bandYPositions = [140, 360, 680, 1000, 1240];
  bandYPositions.forEach((y) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, y + 8, width, 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, y - 6, width, 4);
    ctx.fillStyle = foil;
    ctx.fillRect(20, y, width - 40, 6);
  });

  // Top Shelf Classification
  ctx.fillStyle = foil;
  ctx.textAlign = 'center';
  ctx.font = '600 16px "Ppmuseum", "PP Museum", "JetBrains Mono", monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText(book.year || '', width / 2, 90);

  // Miniature Gilded Spine Sigil
  drawProjectSpineSigil(ctx, width / 2, 250, book, foil);

  // Vertical Book Title
  ctx.save();
  ctx.translate(width / 2 + 10, 520);
  ctx.rotate(Math.PI / 2);
  ctx.font = '700 42px "Ppeiko", "PP Eiko", "Cinzel", serif';
  ctx.letterSpacing = '6px';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 8;
  ctx.fillText((book.title || '').toUpperCase(), 0, 0);
  ctx.restore();

  // Vertical Curator Name
  ctx.save();
  ctx.translate(width / 2 + 4, 840);
  ctx.rotate(Math.PI / 2);
  ctx.font = '500 22px "Ppneuemontreal", "PP Neue Montreal", "Cormorant Garamond", serif';
  ctx.letterSpacing = '4px';
  ctx.fillText((book.curator || '').toUpperCase(), 0, 0);
  ctx.restore();

  // Bottom Library Call Number
  ctx.font = '500 15px "Ppmuseum", "PP Museum", "JetBrains Mono", monospace';
  ctx.letterSpacing = '1px';
  const callParts = (book.callNumber || '').split(' ');
  ctx.fillText((callParts[0] || '') + ' ' + (callParts[1] || ''), width / 2, 1160);
  ctx.fillText(callParts.slice(2).join(' '), width / 2, 1185);
}

export function createSpineTexture(book: ProjectBook): THREE.CanvasTexture {
  const cacheKey = getTextureCacheKey('spine', book.id);
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const width = 220;
  const height = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  addLeatherGrainSync(ctx, width, height, book.coverColor);
  drawSpineArtwork(ctx, width, height, book);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return registerCachedTexture(cacheKey, texture);
}

export async function createSpineTextureAsync(
  book: ProjectBook,
  options: TextureGenerationOptions = {}
): Promise<THREE.CanvasTexture> {
  const cacheKey = getTextureCacheKey('spine', book.id);
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async () => {
    if (options.awaitFonts !== false) {
      await ensureFontsReady(options.fontTimeoutMs ?? 1500);
    }

    const width = 220;
    const height = 1400;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    if (options.timeSliced !== false) {
      await addLeatherGrainAsync(ctx, width, height, book.coverColor, options.chunkSize);
    } else {
      addLeatherGrainSync(ctx, width, height, book.coverColor);
    }

    drawSpineArtwork(ctx, width, height, book);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return registerCachedTexture(cacheKey, texture);
  })().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

// ============================================================================
// 8. Back Cover Texture (Sync & Async)
// ============================================================================

function drawBackCoverArtwork(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  book: ProjectBook
): void {
  // Mirror horizontal coordinates so orientation matches 180-deg rotation in 3D
  ctx.translate(width, 0);
  ctx.scale(-1, 1);

  const foil = book.accentColor || '#d4af37';

  // Outer Border
  ctx.strokeStyle = foil;
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Header
  ctx.fillStyle = foil;
  ctx.textAlign = 'center';
  ctx.font = '600 28px "Ppeiko", "PP Eiko", "Cinzel", serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('DISCOURSE & ARCHIVAL DIGEST', width / 2, 160);

  // Decorative divider
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 140, 200);
  ctx.lineTo(width / 2 + 140, 200);
  ctx.stroke();

  // Synopsis Paragraph
  ctx.textAlign = 'center';
  ctx.font = '400 26px/40px "Ppneuemontreal", "PP Neue Montreal", "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = '1px';

  const words = (book.fullSynopsis || '').split(' ').filter(Boolean);
  let line = '';
  let lineY = 280;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > width - 260 && i > 0) {
      ctx.fillText(line.trim(), width / 2, lineY);
      line = words[i] + ' ';
      lineY += 44;
      if (lineY > 600) break;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), width / 2, lineY);
  }

  // Key Technical Ingredients / Stamped Runes
  ctx.font = '700 22px "Ppeiko", "PP Eiko", "Cinzel", serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('COMPOSITION & MATERIAL MEDIUM', width / 2, 740);

  const techList = (book.techStack || []).join('  •  ');
  ctx.font = '500 22px "Ppmuseum", "PP Museum", "JetBrains Mono", monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText(techList, width / 2, 800);

  // Key Metrics Stamped in Gilded Boxes
  const boxW = 220;
  const boxH = 90;
  const metricsList = book.metrics || [];
  const startX = (width - (metricsList.length * boxW + Math.max(0, metricsList.length - 1) * 30)) / 2;
  metricsList.forEach((m, idx) => {
    const bx = startX + idx * (boxW + 30);
    const by = 880;
    ctx.strokeStyle = foil;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.font = '400 15px "Ppmuseum", "PP Museum", "JetBrains Mono", monospace';
    ctx.letterSpacing = '1px';
    ctx.fillText((m.label || '').toUpperCase(), bx + boxW / 2, by + 34);

    ctx.font = '700 26px "Ppeiko", "PP Eiko", "Cinzel", serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(m.value || '', bx + boxW / 2, by + 70);
  });

  // Simulated Library Barcode at Bottom
  const barcodeY = 1140;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(width / 2 - 160, barcodeY, 320, 100);

  ctx.fillStyle = '#000000';
  for (let x = width / 2 - 140; x < width / 2 + 140; x += 4) {
    if (Math.random() > 0.35) {
      const barW = Math.random() > 0.5 ? 3 : 1.5;
      ctx.fillRect(x, barcodeY + 12, barW, 60);
    }
  }
  ctx.font = '500 14px "Ppmuseum", "PP Museum", "JetBrains Mono", monospace';
  ctx.letterSpacing = '3px';
  ctx.fillText(`ISBN 978-0-24-${book.year || '2026'}`, width / 2, barcodeY + 88);
}

export function createBackCoverTexture(book: ProjectBook): THREE.CanvasTexture {
  const cacheKey = getTextureCacheKey('back', book.id);
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const width = 1024;
  const height = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  addLeatherGrainSync(ctx, width, height, book.coverColor);
  drawBackCoverArtwork(ctx, width, height, book);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return registerCachedTexture(cacheKey, texture);
}

export async function createBackCoverTextureAsync(
  book: ProjectBook,
  options: TextureGenerationOptions = {}
): Promise<THREE.CanvasTexture> {
  const cacheKey = getTextureCacheKey('back', book.id);
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async () => {
    if (options.awaitFonts !== false) {
      await ensureFontsReady(options.fontTimeoutMs ?? 1500);
    }

    const width = 1024;
    const height = 1400;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    if (options.timeSliced !== false) {
      await addLeatherGrainAsync(ctx, width, height, book.coverColor, options.chunkSize);
    } else {
      addLeatherGrainSync(ctx, width, height, book.coverColor);
    }

    drawBackCoverArtwork(ctx, width, height, book);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return registerCachedTexture(cacheKey, texture);
  })().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

// ============================================================================
// 9. Paper Edges Block Texture (Sync & Async)
// ============================================================================

function drawPaperEdgesArtwork(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Golden edge dusting wash (gilding)
  const goldGradient = ctx.createLinearGradient(0, 0, width, 0);
  goldGradient.addColorStop(0, 'rgba(212, 175, 55, 0.45)');
  goldGradient.addColorStop(0.5, 'rgba(245, 225, 140, 0.15)');
  goldGradient.addColorStop(1, 'rgba(212, 175, 55, 0.45)');
  ctx.fillStyle = goldGradient;
  ctx.fillRect(0, 0, width, height);
}

export function createPaperEdgesTexture(): THREE.CanvasTexture {
  const cacheKey = getTextureCacheKey('edges');
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f4ecd8';
  ctx.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += 2) {
    const shade = Math.sin(y * 12.0) * 15 + (Math.random() - 0.5) * 20;
    const r = Math.min(255, Math.max(0, 235 + shade));
    const g = Math.min(255, Math.max(0, 220 + shade));
    const b = Math.min(255, Math.max(0, 195 + shade));
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, y, width, 2);
  }

  drawPaperEdgesArtwork(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  return registerCachedTexture(cacheKey, texture);
}

export async function createPaperEdgesTextureAsync(
  options: TextureGenerationOptions = {}
): Promise<THREE.CanvasTexture> {
  const cacheKey = getTextureCacheKey('edges');
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f4ecd8';
  ctx.fillRect(0, 0, width, height);

  const rowChunk = 64;
  for (let y = 0; y < height; y += 2) {
    const shade = Math.sin(y * 12.0) * 15 + (Math.random() - 0.5) * 20;
    const r = Math.min(255, Math.max(0, 235 + shade));
    const g = Math.min(255, Math.max(0, 220 + shade));
    const b = Math.min(255, Math.max(0, 195 + shade));
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, y, width, 2);

    if (options.timeSliced !== false && y % rowChunk === 0) {
      await yieldToMain();
    }
  }

  drawPaperEdgesArtwork(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  return registerCachedTexture(cacheKey, texture);
}

// ============================================================================
// 10. High-Level Pipelines & Preloader Integration
// ============================================================================

/**
 * Generates all 4 textures for a single book asynchronously with font readiness gating.
 * Matches PROJECT.md interface contract:
 * generateBookTexturesAsync(book: Book): Promise<{ front: THREE.CanvasTexture, spine: THREE.CanvasTexture, back: THREE.CanvasTexture }>
 */
export async function generateBookTexturesAsync(
  book: ProjectBook,
  onProgress?: (pct: number) => void
): Promise<BookTextures> {
  await ensureFontsReady();
  if (onProgress) onProgress(10);

  const edges = await createPaperEdgesTextureAsync();
  if (onProgress) onProgress(25);

  const front = await createFrontCoverTextureAsync(book);
  if (onProgress) onProgress(60);

  const spine = await createSpineTextureAsync(book);
  if (onProgress) onProgress(80);

  const back = await createBackCoverTextureAsync(book);
  if (onProgress) onProgress(100);

  return { front, spine, back, edges };
}

/**
 * Batch-prepares textures for all books in catalog with monotonic progress reporting.
 * Integrates directly with Preloader Beat 2 (25% -> 60%).
 */
export async function prepareAllBookTexturesAsync(
  books: ProjectBook[],
  onProgress?: (pct: number) => void
): Promise<Map<string, BookTextures>> {
  await ensureFontsReady();

  const total = books.length;
  const result = new Map<string, BookTextures>();

  for (let i = 0; i < total; i++) {
    const book = books[i];
    const textures = await generateBookTexturesAsync(book);
    result.set(book.id, textures);

    if (onProgress) {
      const currentPct = Math.round(((i + 1) / total) * 100);
      onProgress(currentPct);
    }
  }

  return result;
}

/**
 * Prepares and warms textures within the specified radius R=2 of activeIndex.
 * Supports GPU Pre-compilation (Feature 6) handoff.
 */
export async function warmBookTexturesInRadius(
  books: ProjectBook[],
  activeIndex = 0,
  radius = 2,
  onProgress?: (pct: number) => void
): Promise<Map<string, BookTextures>> {
  await ensureFontsReady();

  const minIdx = Math.max(0, activeIndex - radius);
  const maxIdx = Math.min(books.length - 1, activeIndex + radius);
  const booksToWarm = books.slice(minIdx, maxIdx + 1);

  const result = new Map<string, BookTextures>();
  const total = booksToWarm.length;

  for (let i = 0; i < total; i++) {
    const book = booksToWarm[i];
    const textures = await generateBookTexturesAsync(book);
    result.set(book.id, textures);

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 100));
    }
  }

  return result;
}
