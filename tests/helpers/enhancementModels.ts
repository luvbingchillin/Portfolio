/**
 * Authoritative Models & Contracts for Athenaeum Portfolio Enhancement
 * Derived from ORIGINAL_REQUEST.md, PROJECT.md, and survey handoffs.
 * 
 * Contains:
 * 1. TopNav layout, state machine, dot positioning math, and responsive docking models
 * 2. EditorialInfoSection metadata binding, layout tokens, and masked stagger animation models
 * 3. Color contrast calculator (WCAG 2.1 AA/AAA) and 3D scene lighting/fog specification models
 */

import type { Book } from '../../src/types.ts';

// ============================================================================
// 1. TOP-MIDDLE NAVIGATION BAR SPECIFICATIONS & STATE MODEL
// ============================================================================

export interface TopNavConfig {
  dropdownWidthEm: number;     // 28em (448px)
  dropdownClosedHeightEm: number; // 0em
  dropdownOpenHeightEm: number;   // 24em (384px)
  mobileBreakpointPx: number;  // 991px
  mobileDockHeightEm: number;  // 3.5em
  dotSizeEm: number;           // 0.3em
  dotGapEm: number;            // 0.3em (approx 5px)
  openDurationSec: number;     // 0.62s
  closeDurationSec: number;    // 0.46s
  dotDurationSec: number;      // 0.50s
  easing: string;              // cubic-bezier(0.32, 0.72, 0, 1)
}

export const DEFAULT_TOPNAV_CONFIG: TopNavConfig = {
  dropdownWidthEm: 28,
  dropdownClosedHeightEm: 0,
  dropdownOpenHeightEm: 24,
  mobileBreakpointPx: 991,
  mobileDockHeightEm: 3.5,
  dotSizeEm: 0.3,
  dotGapEm: 0.3,
  openDurationSec: 0.62,
  closeDurationSec: 0.46,
  dotDurationSec: 0.50,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)'
};

export interface RectLike {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Authoritative sliding page dot position calculation
 * Exact formula from survey observation 1.1:
 * x = activeLabel.left + activeLabel.width / 2 - list.left
 * y = activeLabel.bottom - list.top + navDotGap
 */
export function calculateNavPageDotPosition(
  activeLabelRect: RectLike,
  listRect: RectLike,
  navDotGap = 5
): { x: number; y: number } {
  const x = activeLabelRect.left + activeLabelRect.width / 2 - listRect.left;
  const y = activeLabelRect.bottom - listRect.top + navDotGap;
  return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
}

export class TopNavStateMachine {
  public isOpen = false;
  public activeIndex = 0;
  public books: Book[];
  public onSelectCallback?: (index: number) => void;
  public config: TopNavConfig;

  constructor(books: Book[], initialIndex = 0, onSelect?: (index: number) => void, config = DEFAULT_TOPNAV_CONFIG) {
    this.books = books;
    this.activeIndex = Math.max(0, Math.min(books.length - 1, initialIndex));
    this.onSelectCallback = onSelect;
    this.config = config;
  }

  toggleDropdown(): boolean {
    this.isOpen = !this.isOpen;
    return this.isOpen;
  }

  openDropdown(): void {
    this.isOpen = true;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  selectIndex(index: number): number {
    const clamped = Math.max(0, Math.min(this.books.length - 1, index));
    this.activeIndex = clamped;
    if (this.onSelectCallback) {
      this.onSelectCallback(clamped);
    }
    return clamped;
  }

  getRollState(): {
    wordTransform: string;
    countTransform: string;
    chevronDegrees: number;
    dropdownHeightEm: number;
    ariaExpanded: boolean;
  } {
    if (this.isOpen) {
      return {
        wordTransform: 'translate(0, -130%)',
        countTransform: 'translate(0, 0)',
        chevronDegrees: 180,
        dropdownHeightEm: this.config.dropdownOpenHeightEm,
        ariaExpanded: true
      };
    }
    return {
      wordTransform: 'translate(0, 0)',
      countTransform: 'translate(0%, 130%)',
      chevronDegrees: 0,
      dropdownHeightEm: this.config.dropdownClosedHeightEm,
      ariaExpanded: false
    };
  }

  getFormattedCount(): string {
    const total = this.books.length;
    return total < 10 ? `0${total}` : `${total}`;
  }

  isMobileDocked(viewportWidthPx: number): boolean {
    return viewportWidthPx <= this.config.mobileBreakpointPx;
  }
}

// ============================================================================
// 2. TOP-RIGHT INFORMATION SECTION SPECIFICATIONS & ANIMATION MODEL
// ============================================================================

export interface InfoAnimationConfig {
  settleDelayMs: number;     // 100ms
  outDurationSec: number;    // 0.4s
  outLineStaggerSec: number; // 0.016s
  outShiftPct: number;       // -120%
  inDurationSec: number;     // 0.7s
  inLineStaggerSec: number;  // 0.05s
  inShiftPct: number;        // 120%
  easing: string;            // cubic-bezier(0.32, 0.72, 0, 1)
  dividerThicknessPx: number;// 0.5px
}

export const DEFAULT_INFO_ANIMATION_CONFIG: InfoAnimationConfig = {
  settleDelayMs: 100,
  outDurationSec: 0.4,
  outLineStaggerSec: 0.016,
  outShiftPct: -120,
  inDurationSec: 0.7,
  inLineStaggerSec: 0.05,
  inShiftPct: 120,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
  dividerThicknessPx: 0.5
};

export interface MonographMetadataRow {
  label: string;
  value: string;
}

export interface MonographDisplayData {
  title: string;
  rows: MonographMetadataRow[];
}

export function formatMonographDisplayData(book: Book, curator = 'Kang Yuchen'): MonographDisplayData {
  return {
    title: book.title.toUpperCase(),
    rows: [
      { label: 'CURATED BY', value: curator },
      { label: 'YEAR', value: String(book.year) },
      { label: 'CATEGORY', value: book.category.toUpperCase() },
      { label: 'CALL NUMBER', value: book.callNumber }
    ]
  };
}

export type AnimationPhase = 'idle' | 'settling' | 'exiting' | 'entering';

export class InfoSectionAnimationModel {
  public phase: AnimationPhase = 'idle';
  public currentBook: Book;
  public pendingBook?: Book;
  public elapsedTimeMs = 0;
  public exitYPct = 0;
  public enterYPct = 0;
  public dividerScale = 1.0;
  public config: InfoAnimationConfig;

  constructor(initialBook: Book, config = DEFAULT_INFO_ANIMATION_CONFIG) {
    this.currentBook = initialBook;
    this.config = config;
    this.enterYPct = 0;
    this.exitYPct = 0;
    this.dividerScale = 1.0;
  }

  triggerChange(nextBook: Book): void {
    if (nextBook.id === this.currentBook.id && this.phase === 'idle') return;
    this.pendingBook = nextBook;
    this.phase = 'settling';
    this.elapsedTimeMs = 0;
  }

  step(dtMs: number): void {
    if (this.phase === 'idle') return;

    this.elapsedTimeMs += dtMs;

    if (this.phase === 'settling') {
      if (this.elapsedTimeMs >= this.config.settleDelayMs) {
        this.phase = 'exiting';
        this.elapsedTimeMs = 0;
      }
      return;
    }

    if (this.phase === 'exiting') {
      const exitTotalMs = this.config.outDurationSec * 1000;
      const progress = Math.min(1.0, this.elapsedTimeMs / exitTotalMs);
      this.exitYPct = progress * this.config.outShiftPct; // 0 -> -120%
      this.dividerScale = 1.0 - progress; // collapses from 1.0 to 0.0

      if (progress >= 1.0) {
        if (this.pendingBook) {
          this.currentBook = this.pendingBook;
          this.pendingBook = undefined;
        }
        this.phase = 'entering';
        this.elapsedTimeMs = 0;
        this.enterYPct = this.config.inShiftPct; // start from +120%
      }
      return;
    }

    if (this.phase === 'entering') {
      const enterTotalMs = this.config.inDurationSec * 1000;
      const progress = Math.min(1.0, this.elapsedTimeMs / enterTotalMs);
      // Easing simulation towards 0%
      this.enterYPct = this.config.inShiftPct * (1.0 - progress); // +120% -> 0%
      this.dividerScale = progress; // expands from 0.0 to 1.0

      if (progress >= 1.0) {
        this.phase = 'idle';
        this.elapsedTimeMs = 0;
        this.enterYPct = 0;
        this.exitYPct = 0;
        this.dividerScale = 1.0;
      }
    }
  }
}

// ============================================================================
// 3. COLOR CONTRAST, WCAG 2.1 & 3D SCENE LIGHTING SPECIFICATIONS
// ============================================================================

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function parseHexColor(hex: string): RgbColor {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const intVal = parseInt(clean, 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255
  };
}

/**
 * Standard WCAG 2.1 Relative Luminance formula:
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function calculateRelativeLuminance(rgb: RgbColor): number {
  const normalize = (val: number) => {
    const s = Math.max(0, Math.min(255, val)) / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = normalize(rgb.r);
  const g = normalize(rgb.g);
  const b = normalize(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2.1 Contrast Ratio:
 * CR = (L1 + 0.05) / (L2 + 0.05) where L1 is lighter, L2 is darker.
 */
export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const fgRgb = parseHexColor(fgHex);
  const bgRgb = parseHexColor(bgHex);
  const lum1 = calculateRelativeLuminance(fgRgb);
  const lum2 = calculateRelativeLuminance(bgRgb);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export interface WcagEvaluation {
  ratio: number;
  aaNormal: boolean;  // >= 4.5
  aaLarge: boolean;   // >= 3.0
  aaaNormal: boolean; // >= 7.0
  aaaLarge: boolean;  // >= 4.5
}

export function evaluateWcagCompliance(fgHex: string, bgHex: string): WcagEvaluation {
  const ratio = calculateContrastRatio(fgHex, bgHex);
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3.0,
    aaaNormal: ratio >= 7.0,
    aaaLarge: ratio >= 4.5
  };
}

export interface SceneLightingConfig {
  fogColor: number;           // 0xffffff
  fogDensity: number;         // 0.032
  ambientColor: number;       // 0xfdfbf7
  ambientIntensity: number;   // 0.85
  keyLightColor: number;      // 0xffecd2
  keyLightIntensity: number;  // 1.3 - 1.4
  toneMappingExposure: number;// 1.0 - 1.05
  canvasAlpha: boolean;       // true
}

export const DEFAULT_SCENE_LIGHTING_CONFIG: SceneLightingConfig = {
  fogColor: 0xffffff,
  fogDensity: 0.032,
  ambientColor: 0xfdfbf7,
  ambientIntensity: 0.85,
  keyLightColor: 0xffecd2,
  keyLightIntensity: 1.35,
  toneMappingExposure: 1.0,
  canvasAlpha: true
};
