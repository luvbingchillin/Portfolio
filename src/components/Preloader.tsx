import { useState, useEffect, useRef, useMemo } from 'react';
import type { FC } from 'react';

/**
 * Athenaeum 3D Portfolio — Stylized Dark Mechanical Preloader & Boot Sequence
 * Feature 7: Stylized Odometer Preloader Screen
 * 
 * Capabilities:
 * 1. Mechanical Split-Drum Odometer Counter: 3-column vertical rolling drum strips (0-100%).
 * 2. 4-Beat Progression Timeline: Mapped to real pipeline stages (min theatrical duration >= 2.85s).
 * 3. Smooth Rollover Mechanics: Forward-rolling 20-digit strips with column stagger delays.
 * 4. Monotonic Progress Guarantee: Regressive updates are ignored; holds until assets are ready.
 * 5. Single Completion Guard: onLoaded fires strictly once after both progress == 100% and elapsed >= 2.85s.
 * 6. Theatrical Reveal Transition: Coordinates 1.15s exit aperture fade with 3D shelf fan-out.
 */

import { PRELOADER_BEATS, PRELOADER_CONFIG } from '../utils/gpuWarming.ts';
import type { PreloaderBeat } from '../utils/gpuWarming.ts';

export type { PreloaderBeat };

// 20-digit rolling strip: 01234567890123456789
const ROLLING_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface DrumColumnProps {
  digitIndex: number;
  staggerDelay: number;
  isVisible?: boolean;
  isHundreds?: boolean;
}

const DrumColumn: FC<DrumColumnProps> = ({ digitIndex, staggerDelay, isVisible = true, isHundreds = false }) => {
  // Translate offset: each digit occupies 5% of the 20-digit column
  const translateY = -(digitIndex * 5);

  return (
    <div
      className={`relative inline-block overflow-hidden transition-all select-none ${
        isHundreds
          ? isVisible
            ? 'w-[0.62em] opacity-100 mr-[0.04em]'
            : 'w-0 opacity-0 mr-0'
          : 'w-[0.62em]'
      }`}
      style={{
        height: '1.15em',
        transitionDuration: '380ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* 20-Digit Vertical Strip */}
      <div
        className="flex flex-col will-change-transform"
        style={{
          transform: `translateY(${translateY}%)`,
          transition: `transform 0.48s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s`
        }}
      >
        {ROLLING_DIGITS.map((digit, idx) => (
          <div
            key={idx}
            className="h-[1.15em] flex items-center justify-center font-heading text-6xl sm:text-7xl md:text-8xl text-[#f2f2f2] tabular-nums leading-none"
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
};

export interface PreloaderProps {
  onLoaded: () => void;
  externalProgress?: number;
  minDurationMs?: number;
  revealDurationMs?: number;
}

export const Preloader: FC<PreloaderProps> = ({
  onLoaded,
  externalProgress,
  minDurationMs = PRELOADER_CONFIG.minDurationMs,
  revealDurationMs = PRELOADER_CONFIG.revealDurationMs
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const completedRef = useRef(false);
  const externalProgressRef = useRef(externalProgress);

  useEffect(() => {
    externalProgressRef.current = externalProgress;
  }, [externalProgress]);

  // Derive continuous drum indices for forward-rolling odometer motion
  const { hundredsIndex, tensIndex, onesIndex, isHundredsVisible } = useMemo(() => {
    const val = Math.floor(currentProgress);
    const ones = val % 20;
    const tens = Math.floor(val / 10) % 20;
    const hundreds = Math.floor(val / 100) % 20;
    return {
      hundredsIndex: hundreds,
      tensIndex: tens,
      onesIndex: ones,
      isHundredsVisible: val >= 100
    };
  }, [currentProgress]);

  // Derive current beat
  const activeBeat = useMemo(() => {
    for (const b of PRELOADER_BEATS) {
      if (currentProgress <= b.endPct) {
        return b;
      }
    }
    return PRELOADER_BEATS[PRELOADER_BEATS.length - 1];
  }, [currentProgress]);

  // Animation frame loop driving theatrical minimum duration and external progress synchronization
  useEffect(() => {
    const startTime = Date.now();
    let animId: number;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      // Theatrical time-based progress [0, 100]
      const timeProgress = Math.min(100, (elapsed / minDurationMs) * 100);

      // Real pipeline progress (defaults to timeProgress if externalProgress is undefined)
      const ext = externalProgressRef.current;
      const realProgress = ext !== undefined
        ? Math.max(0, Math.min(100, ext))
        : timeProgress;

      // Displayed progress must satisfy monotonic progression and theatrical minimum duration
      setCurrentProgress((prev) => {
        // If assets finished early, advance with timeProgress up to 100%
        // If assets take longer than minDuration, clamp to realProgress
        const target = realProgress >= 100
          ? Math.min(100, timeProgress)
          : Math.min(realProgress, timeProgress);

        return Math.max(prev, target);
      });

      // Completion Condition: Progress is 100% AND elapsed >= minDuration
      if (
        realProgress >= 100 &&
        elapsed >= minDurationMs &&
        !completedRef.current
      ) {
        completedRef.current = true;
        setCurrentProgress(100);
        setIsExiting(true);

        // Notify parent to unfreeze 3D scene and initiate fan reveal
        onLoaded();
        return;
      }

      if (!completedRef.current) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [minDurationMs, onLoaded]);

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Application preloader and boot sequence"
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 md:p-14 bg-[#171c1c] text-[#f2f2f2] select-none transition-all ${
        isExiting ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        transitionDuration: `${revealDurationMs}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Background Architectural Vignette */}
      <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#31383b]/20 via-[#171c1c]/70 to-[#171c1c]" />

      {/* Top Header Eyebrow Metadata */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#31383b]/40 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#891a20] animate-pulse" />
          <span className="font-eyebrow text-xs tracking-[0.20em] uppercase text-[#d6d3d1]">
            ATHENAEUM ARCHIVES // BOOT SEQUENCE
          </span>
        </div>
        <div className="font-eyebrow text-[11px] tracking-[0.20em] text-[#8c8c8c] hidden sm:block">
          REV. 2026.10 // 60 FPS LOCKED
        </div>
      </header>

      {/* Central Odometer Counter & Telemetry */}
      <main className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
        {/* Split-Drum Tumbler Housing */}
        <div className="relative inline-flex items-center justify-center px-6 py-4 rounded-sm border border-[#31383b]/60 bg-[#171c1c]/90 shadow-2xl backdrop-blur-sm">
          {/* Top & Bottom Gradient Mask Overlay */}
          <div className="absolute inset-0 pointer-events-none rounded-sm bg-gradient-to-b from-[#171c1c]/90 via-transparent to-[#171c1c]/90" />

          {/* Center Drum Seam Slit */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#31383b]/50 -translate-y-1/2 pointer-events-none" />

          {/* Odometer Drum Columns */}
          <div className="relative z-10 flex items-baseline">
            {/* Hundreds Column (Expands width at 100%) */}
            <DrumColumn
              digitIndex={hundredsIndex}
              staggerDelay={0.10}
              isVisible={isHundredsVisible}
              isHundreds
            />

            {/* Tens Column (Stagger 0.05s) */}
            <DrumColumn
              digitIndex={tensIndex}
              staggerDelay={0.05}
              isVisible={true}
            />

            {/* Ones Column (Stagger 0.00s) */}
            <DrumColumn
              digitIndex={onesIndex}
              staggerDelay={0.00}
              isVisible={true}
            />

            {/* Percentage Glyph */}
            <span className="ml-1 font-eyebrow text-lg sm:text-xl text-[#891a20] tracking-[0.20em]">
              %
            </span>
          </div>
        </div>

        {/* Minimal Progress Hairline Bar */}
        <div className="w-56 sm:w-72 h-[2px] bg-[#31383b]/70 mt-6 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#891a20] to-[#f2f2f2] transition-all duration-150 ease-out"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        {/* Beat Title & Telemetry */}
        <div className="mt-5 space-y-1">
          <p className="font-heading text-lg sm:text-xl tracking-[-0.025em] text-[#f2f2f2]">
            {activeBeat.name}
          </p>
          <p className="font-eyebrow text-[11px] tracking-[0.20em] uppercase text-[#8c8c8c]">
            {activeBeat.telemetry}
          </p>
        </div>
      </main>

      {/* Footer System Telemetry */}
      <footer className="relative z-10 flex items-center justify-between border-t border-[#31383b]/40 pt-4 text-[11px] font-eyebrow tracking-[0.20em] text-[#8c8c8c]">
        <span>STAGE 0{activeBeat.beat} / 04</span>
        <span className="text-right uppercase">
          {currentProgress >= 100 ? 'PIPELINE PRIMED // LAUNCHING' : 'CALIBRATING WebGL2'}
        </span>
      </footer>
    </aside>
  );
};

export default Preloader;
