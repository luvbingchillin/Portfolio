import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { FC } from 'react';
import type { ProjectBook } from '../types/book';

export interface EditorialInfoSectionProps {
  activeBook: ProjectBook;
  currentTime?: string;
  curator?: string;
  className?: string;
}

export interface MonographMetadataRow {
  label: string;
  value: string;
}

export interface MonographDisplayData {
  title: string;
  rows: MonographMetadataRow[];
}

/**
 * Authoritative data extraction helper with safe defensive defaults.
 * Follows tests/tier1-features/r2-info-section.test.ts specifications.
 */
export function formatMonographDisplayData(
  book: ProjectBook,
  curator = 'Kang Yuchen'
): MonographDisplayData {
  return {
    title: (book.title || 'UNTITLED').toUpperCase(),
    rows: [
      { label: 'CURATED BY', value: curator || book.curator || 'Kang Yuchen' },
      { label: 'YEAR', value: String(book.year ?? '') },
      { label: 'CATEGORY', value: (book.category || '').toUpperCase() },
      { label: 'CALL NUMBER', value: book.callNumber || '' }
    ]
  };
}

/**
 * Live 24-hour UTC chronometer hook.
 * Formats time as HH:MM:SS in UTC with proper interval cleanup.
 * If externalTime is passed as prop, bypasses internal timer.
 */
function useUtcChronometer(externalTime?: string): string {
  const [internalTime, setInternalTime] = useState<string>(() => {
    if (externalTime) return externalTime;
    return new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' });
  });

  useEffect(() => {
    if (externalTime) {
      setInternalTime(externalTime);
      return;
    }
    const updateTime = () => {
      const now = new Date();
      setInternalTime(now.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' }));
    };
    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, [externalTime]);

  return externalTime || internalTime;
}

type AnimationPhase = 'idle' | 'settling' | 'exiting' | 'entering';

const ANIM_CONFIG = {
  settleDelayMs: 100,     // 100ms
  outDurationMs: 400,     // 0.4s
  inDurationMs: 700,      // 0.7s
  outLineStaggerSec: 0.016,
  inLineStaggerSec: 0.05,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)'
};

export const EditorialInfoSection: FC<EditorialInfoSectionProps> = ({
  activeBook,
  currentTime: externalTime,
  curator = 'Kang Yuchen',
  className = ''
}) => {
  const liveTime = useUtcChronometer(externalTime);

  // Animation phase & display book state
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [displayBook, setDisplayBook] = useState<ProjectBook>(activeBook);
  const pendingBookRef = useRef<ProjectBook | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  // Clear pending timers safely on unmount or re-schedule
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  // Handle activeBook changes with interrupt safety (Test B2.2 & B2.5)
  useEffect(() => {
    // 1. No-op if same book is requested when idle (B2.5)
    if (activeBook.id === displayBook.id && phase === 'idle') {
      return;
    }

    // 2. If already in transition, update pendingBookRef to latest selection
    pendingBookRef.current = activeBook;

    if (phase !== 'idle') {
      // Ongoing transition: pendingBookRef will be picked up at the exit boundary
      return;
    }

    // 3. Initiate settle -> exit -> enter pipeline
    clearAllTimeouts();
    setPhase('settling');

    // Settle delay: 100ms
    const settleTimer = window.setTimeout(() => {
      setPhase('exiting');

      // Exit duration: 400ms
      const exitTimer = window.setTimeout(() => {
        // Swap book at exit boundary
        const nextBook = pendingBookRef.current || activeBook;
        setDisplayBook(nextBook);
        pendingBookRef.current = null;
        setPhase('entering');

        // Entrance duration: 700ms
        const enterTimer = window.setTimeout(() => {
          setPhase('idle');
        }, ANIM_CONFIG.inDurationMs);

        timeoutsRef.current.push(enterTimer);
      }, ANIM_CONFIG.outDurationMs);

      timeoutsRef.current.push(exitTimer);
    }, ANIM_CONFIG.settleDelayMs);

    timeoutsRef.current.push(settleTimer);
  }, [activeBook, displayBook.id, phase, clearAllTimeouts]);

  // Format data for currently displayed monograph
  const displayData = useMemo(
    () => formatMonographDisplayData(displayBook, curator),
    [displayBook, curator]
  );

  // Compute transform and transition styles based on phase
  const isExiting = phase === 'exiting';
  const isEntering = phase === 'entering';

  const getTextTransform = (staggerIndex: number) => {
    if (isExiting) {
      return {
        transform: 'translateY(-120%)',
        transition: `transform 0.4s ${ANIM_CONFIG.easing} ${staggerIndex * ANIM_CONFIG.outLineStaggerSec}s`
      };
    }
    if (isEntering) {
      return {
        transform: 'translateY(0%)',
        transition: `transform 0.7s ${ANIM_CONFIG.easing} ${0.06 + staggerIndex * ANIM_CONFIG.inLineStaggerSec}s`
      };
    }
    return {
      transform: 'translateY(0%)',
      transition: 'none'
    };
  };

  const getDividerStyle = (staggerIndex: number) => {
    if (isExiting) {
      return {
        transform: 'scaleX(0)',
        transformOrigin: '0% 50%',
        transition: `transform 0.4s ${ANIM_CONFIG.easing} ${staggerIndex * ANIM_CONFIG.outLineStaggerSec}s`
      };
    }
    if (isEntering) {
      return {
        transform: 'scaleX(1)',
        transformOrigin: '0% 50%',
        transition: `transform 0.7s ${ANIM_CONFIG.easing} ${0.06 + staggerIndex * ANIM_CONFIG.inLineStaggerSec}s`
      };
    }
    return {
      transform: 'scaleX(1)',
      transformOrigin: '0% 50%',
      transition: 'none'
    };
  };

  return (
    <div
      className={`experience_info top-right z-20 pointer-events-none select-none ${className}`}
      data-testid="editorial-info-section"
      aria-label="Monograph Archival Information"
    >
      {/* 1. UTC Chronometer & Archival Telemetry */}
      <div className="info-telemetry flex items-center justify-between text-[10px] font-mono tracking-[0.20em] text-[#78716c] pb-2 border-b border-black/10 mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#891a20]" />
          <span>UTC {liveTime}</span>
        </span>
        <span className="text-[#a8a29e]">MONOGRAPH // 2026</span>
      </div>

      {/* 2. Display Serif Heading (Title) with Mask */}
      <div
        className="info-title-wrap overflow-hidden"
        data-disc-mask={phase}
      >
        <h2
          className="heading-s custom-element font-heading text-2xl sm:text-3xl lg:text-[2.25rem] font-normal uppercase text-[#171c1c] tracking-[-0.04em] leading-[1.08] m-0"
          style={getTextTransform(0)}
        >
          {displayData.title}
        </h2>
      </div>

      {/* 3. Stacked Key-Value Rows with 0.5px Hairline Dividers */}
      <div className="info-content flex flex-col gap-2.5 mt-3">
        {displayData.rows.map((row, idx) => {
          const stagger = idx + 1;
          return (
            <div
              key={row.label}
              className="info-content_panel relative pt-2"
            >
              {/* 0.5px Hairline Divider */}
              <div
                className="divider-horizontal top"
                style={getDividerStyle(stagger)}
              />

              <div className="flex items-baseline justify-between mt-1.5 gap-4">
                {/* Left Metadata Eyebrow Label */}
                <div
                  className="info-content_label-wrap overflow-hidden shrink-0"
                  data-disc-mask={phase}
                >
                  <span
                    className="subheading-xs custom-element font-eyebrow text-[10px] uppercase text-[#78716c] tracking-[0.20em] block"
                    style={getTextTransform(stagger)}
                  >
                    {row.label}
                  </span>
                </div>

                {/* Right Metadata Value */}
                <div
                  className="overflow-hidden min-w-0"
                  data-disc-mask={phase}
                >
                  <span
                    className="paragraph-m text-align-right custom-element font-body text-sm sm:text-base font-medium text-[#171c1c] tracking-[-0.025em] text-right block truncate"
                    style={getTextTransform(stagger)}
                    title={row.value}
                  >
                    {row.value || '—'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EditorialInfoSection;
