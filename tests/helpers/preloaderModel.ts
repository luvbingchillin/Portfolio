/**
 * Authoritative Preloader & Odometer Model for Athenaeum 3D Portfolio
 * Derived from ORIGINAL_REQUEST.md § R3 and PROJECT.md § Feature Inventory #6 & #7.
 */

export interface PreloaderBeat {
  beat: number;
  name: string;
  startPct: number;
  endPct: number;
}

export const PRELOADER_BEATS: PreloaderBeat[] = [
  { beat: 1, name: 'Font Asset Validation & Setup', startPct: 0, endPct: 25 },
  { beat: 2, name: 'Procedural Canvas Texture Generation', startPct: 25, endPct: 60 },
  { beat: 3, name: 'GPU Shader Pre-compilation & Warmup', startPct: 60, endPct: 95 },
  { beat: 4, name: 'Theatrical Gallery Fan Reveal', startPct: 95, endPct: 100 }
];

export const PRELOADER_CONFIG = {
  minDurationMs: 2850,    // 2.85s minimum display time
  gpuTimeoutMs: 1500,     // 1500ms timeout race for compileAsync
  warmupPasses: 4,        // Exactly 4 warmup render passes
  initialRadius: 2        // Textures warmed for activeIndex +- 2
};

export class PreloaderStateMachine {
  private currentProgress = 0;
  private startTime = 0;
  private isLoaded = false;
  private onLoadedCallback?: () => void;

  constructor(onLoaded?: () => void) {
    this.onLoadedCallback = onLoaded;
  }

  start(time = Date.now()): void {
    this.startTime = time;
    this.currentProgress = 0;
    this.isLoaded = false;
  }

  setProgress(pct: number, currentTime = Date.now()): void {
    const clamped = Math.max(0, Math.min(100, pct));
    if (clamped >= this.currentProgress) {
      this.currentProgress = clamped;
    }

    const elapsed = currentTime - this.startTime;
    if (this.currentProgress >= 100 && elapsed >= PRELOADER_CONFIG.minDurationMs && !this.isLoaded) {
      this.isLoaded = true;
      if (this.onLoadedCallback) {
        this.onLoadedCallback();
      }
    }
  }

  getProgress(): number {
    return this.currentProgress;
  }

  getCurrentBeat(): PreloaderBeat {
    for (const b of PRELOADER_BEATS) {
      if (this.currentProgress <= b.endPct) {
        return b;
      }
    }
    return PRELOADER_BEATS[PRELOADER_BEATS.length - 1];
  }

  getOdometerDigits(): { hundreds: number; tens: number; ones: number } {
    const val = Math.floor(this.currentProgress);
    const hundreds = Math.floor(val / 100);
    const tens = Math.floor((val % 100) / 10);
    const ones = val % 10;
    return { hundreds, tens, ones };
  }

  isComplete(): boolean {
    return this.isLoaded;
  }
}
