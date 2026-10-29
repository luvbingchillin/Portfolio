import { useState, useEffect, useRef, useMemo } from 'react';
import type { FC } from 'react';

/**
 * Athenaeum 3D Portfolio — Stylized Dark Mechanical Preloader & Boot Sequence
 * Feature 7: Stylized Odometer Preloader Screen
 * 
 * Bulletproof, rock-solid implementation with guaranteed visible typography,
 * smooth forward-rolling numbers (000% -> 100%), 4-beat stage progression,
 * and guaranteed transition in 2.2 seconds.
 */

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

export interface PreloaderProps {
  onLoaded: () => void;
  externalProgress?: number;
  minDurationMs?: number;
  revealDurationMs?: number;
}

export const Preloader: FC<PreloaderProps> = ({
  onLoaded,
  externalProgress,
  minDurationMs = 2200,
  revealDurationMs = 800
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const completedRef = useRef(false);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  // Derive current beat
  const activeBeat = useMemo(() => {
    for (const b of PRELOADER_BEATS) {
      if (currentProgress <= b.endPct) {
        return b;
      }
    }
    return PRELOADER_BEATS[PRELOADER_BEATS.length - 1];
  }, [currentProgress]);

  const externalProgressRef = useRef(externalProgress);
  useEffect(() => {
    externalProgressRef.current = externalProgress;
  }, [externalProgress]);

  // Smooth forward-rolling progression loop
  useEffect(() => {
    const startTime = performance.now();
    let animId: number;
    let intervalId: ReturnType<typeof setInterval>;

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - startTime);
      // Time-based smooth monotonic progression: reaches 100% at minDurationMs
      const timePct = Math.min(100, (elapsed / minDurationMs) * 100);

      // If external progress is provided and further ahead, take the higher value
      const ext = typeof externalProgressRef.current === 'number' ? Math.max(0, Math.min(100, externalProgressRef.current)) : 0;
      const target = Math.max(timePct, ext);

      setCurrentProgress((prev) => {
        const next = Math.max(prev, target);
        return next;
      });

      // Completion Condition: 100% reached
      if (target >= 100 && !completedRef.current) {
        completedRef.current = true;
        clearInterval(intervalId);
        cancelAnimationFrame(animId);
        setCurrentProgress(100);
        setIsExiting(true);

        setTimeout(() => {
          onLoadedRef.current();
        }, revealDurationMs);
        return;
      }

      if (!completedRef.current) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    // Reliable 30ms timer fallback to guarantee smooth progression even if rAF is delayed or tab is in background
    intervalId = setInterval(() => {
      if (!completedRef.current) {
        tick(performance.now());
      }
    }, 30);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(intervalId);
    };
  }, [minDurationMs, revealDurationMs]);

  const displayValue = Math.min(100, Math.floor(currentProgress));
  const hundreds = Math.floor(displayValue / 100);
  const tens = Math.floor((displayValue % 100) / 10);
  const ones = displayValue % 10;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Application preloader and boot sequence"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.5rem',
        backgroundColor: '#ffffff',
        color: '#171c1c',
        userSelect: 'none',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.03)' : 'scale(1)',
        pointerEvents: isExiting ? 'none' : 'auto',
        transition: `opacity ${revealDurationMs}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${revealDurationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`
      }}
    >
      {/* Background Architectural Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.7,
          background: 'radial-gradient(circle at center, rgba(255,255,255,1) 40%, rgba(245,245,244,0.85) 80%, #eae7e4 100%)'
        }}
      />

      {/* Top Header Eyebrow Metadata */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          paddingBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '9999px',
              backgroundColor: '#891a20',
              display: 'inline-block',
              boxShadow: '0 0 8px rgba(137, 26, 32, 0.4)'
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#171c1c'
            }}
          >
            ATHENAEUM ARCHIVES // BOOT SEQUENCE
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: '#57534e'
          }}
        >
          REV. 2026.10 // 60 FPS LOCKED
        </div>
      </header>

      {/* Central Odometer Counter & Telemetry */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          margin: 'auto 0'
        }}
      >
        {/* Odometer Digit Display Housing */}
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem 2rem',
            borderRadius: '4px',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(212, 175, 55, 0.15)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Odometer Numbers */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              fontFamily: 'var(--font-mono)',
              fontSize: '4.5rem',
              fontWeight: 700,
              lineHeight: 1,
              color: '#171c1c',
              letterSpacing: '0.04em'
            }}
          >
            {/* Hundreds digit (appears when >= 100) */}
            <span
              style={{
                display: hundreds > 0 ? 'inline-block' : 'none',
                color: '#171c1c'
              }}
            >
              {hundreds}
            </span>
            {/* Tens digit */}
            <span style={{ display: 'inline-block', color: '#171c1c' }}>
              {tens}
            </span>
            {/* Ones digit */}
            <span style={{ display: 'inline-block', color: '#171c1c' }}>
              {ones}
            </span>
            {/* Percentage Symbol */}
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.75rem',
                color: '#a17a15',
                marginLeft: '0.5rem',
                letterSpacing: '0.1em'
              }}
            >
              %
            </span>
          </div>
        </div>

        {/* Minimal Progress Hairline Bar */}
        <div
          style={{
            width: '18rem',
            height: '3px',
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            marginTop: '1.5rem',
            borderRadius: '9999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${currentProgress}%`,
              background: 'linear-gradient(90deg, #891a20 0%, #a17a15 100%)',
              transition: 'width 0.12s linear'
            }}
          />
        </div>

        {/* Beat Title & Telemetry */}
        <div style={{ marginTop: '1.5rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              color: '#171c1c',
              letterSpacing: '-0.02em',
              marginBottom: '0.25rem'
            }}
          >
            {activeBeat.name}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#57534e'
            }}
          >
            {activeBeat.telemetry}
          </p>
        </div>
      </main>

      {/* Footer System Telemetry */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          paddingTop: '1rem',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.2em',
          color: '#57534e'
        }}
      >
        <span>STAGE 0{activeBeat.beat} / 04</span>
        <span style={{ textTransform: 'uppercase', color: currentProgress >= 100 ? '#891a20' : '#57534e' }}>
          {currentProgress >= 100 ? 'PIPELINE PRIMED // LAUNCHING' : 'CALIBRATING WebGL2'}
        </span>
      </footer>
    </aside>
  );
};

export default Preloader;
