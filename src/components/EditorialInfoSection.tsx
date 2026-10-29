import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { FC, CSSProperties } from 'react';
import type { Book } from '../types/book';

export interface EditorialInfoSectionProps {
  activeBook: Book;
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
 * Authoritative monograph data extraction with defensive defaults.
 * Follows tests/tier1-features/r2-info-section.test.ts specifications.
 */
export function formatMonographDisplayData(
  book: Book,
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
 * Formats time as HH:MM:SS in UTC with proper interval cleanup on unmount.
 * If externalTime is passed as prop, bypasses internal timer.
 */
function useUtcChronometer(externalTime?: string): string {
  const [internalTime, setInternalTime] = useState<string>(() => {
    if (externalTime) return externalTime;
    return new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' });
  });

  useEffect(() => {
    if (externalTime) return;
    const updateTime = () => {
      const now = new Date();
      setInternalTime(now.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' }));
    };
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, [externalTime]);

  return externalTime || internalTime;
}

export type AnimationPhase = 'idle' | 'settling' | 'exiting' | 'entering';

const ANIM_CONFIG = {
  settleDelayMs: 100,     // 100ms settle delay
  outDurationMs: 400,     // 0.4s exit duration
  inDurationMs: 700,      // 0.7s entrance duration
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
  const [displayBook, setDisplayBook] = useState<Book>(activeBook);
  const pendingBookRef = useRef<Book | null>(null);
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

    // Settle phase begins
    const initTimer = window.setTimeout(() => {
      setPhase('settling');
    }, 0);
    timeoutsRef.current.push(initTimer);

    // Settle delay: 100ms -> transition to exiting
    const settleTimer = window.setTimeout(() => {
      setPhase('exiting');

      // Exit duration: 400ms -> swap book and transition to entering
      const exitTimer = window.setTimeout(() => {
        const nextBook = pendingBookRef.current || activeBook;
        setDisplayBook(nextBook);
        pendingBookRef.current = null;
        setPhase('entering');

        // Entrance duration: 700ms -> transition back to idle
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

  return (
    <div
      className={`experience_info z-20 pointer-events-none select-none ${className}`}
      data-testid="editorial-info-section"
      aria-label="Monograph Archival Information"
      data-phase={phase}
    >
      {/* 1. UTC Chronometer & Archival Telemetry */}
      <div className="info-telemetry experience_info-chronometer flex items-center justify-between text-[10px] font-mono tracking-[0.20em] text-[#78716c] pb-2 border-b border-black/10 mb-3 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#891a20] experience_info-chronometer__pulse" />
          <span>UTC {liveTime}</span>
        </span>
        <span className="text-[#a8a29e]">MONOGRAPH // 2026</span>
      </div>

      {/* 2. Display Serif Heading (Title) with Mask */}
      <div
        className="info-title-wrap experience_info-mask overflow-hidden pointer-events-none"
        data-disc-mask={phase}
        style={{ '--line-index': 0 } as CSSProperties}
      >
        <h2
          className="heading-s custom-element experience_info-line font-heading text-2xl sm:text-3xl lg:text-[2.25rem] font-normal uppercase text-[#171c1c] tracking-[-0.04em] leading-[1.08] m-0"
        >
          {displayData.title}
        </h2>
      </div>

      {/* 3. Stacked Key-Value Rows with 0.5px Hairline Dividers */}
      <div className="info-content experience_info-details flex flex-col gap-2.5 mt-3 pointer-events-none">
        {displayData.rows.map((row, idx) => {
          const stagger = idx + 1;
          return (
            <div
              key={row.label}
              className="info-content_panel experience_info-item relative pt-2 pointer-events-none"
              style={{ '--line-index': stagger } as CSSProperties}
            >
              {/* 0.5px Hairline Divider */}
              <div
                className="divider-horizontal top experience_info-divider"
              />

              <div className="flex items-baseline justify-between mt-1.5 gap-4 pointer-events-none">
                {/* Left Metadata Eyebrow Label */}
                <div
                  className="info-content_label-wrap experience_info-mask overflow-hidden shrink-0 pointer-events-none"
                  data-disc-mask={phase}
                >
                  <span
                    className="subheading-xs custom-element experience_info-line experience_info-label font-eyebrow text-[10px] uppercase text-[#57534e] tracking-[0.20em] block"
                  >
                    {row.label}
                  </span>
                </div>

                {/* Right Metadata Value */}
                <div
                  className="experience_info-mask overflow-hidden min-w-0 pointer-events-none"
                  data-disc-mask={phase}
                >
                  <span
                    className="paragraph-m text-align-right custom-element experience_info-line experience_info-value font-body text-sm sm:text-base font-medium text-[#171c1c] tracking-[-0.025em] text-right block truncate"
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
