import { useEffect, useRef, type FC } from 'react';
import type { ProjectBook } from '../types/book';
import { BalancedText } from '../utils/textBalance';
import { X, ExternalLink, Github, Layers, Award, ChevronLeft, ChevronRight, ArrowUp } from './Icons';

export interface BookDetailModalProps {
  book: ProjectBook | null;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onSelectPrev?: () => void;
  onSelectNext?: () => void;
  isClosing?: boolean;
}

export const BookDetailModal: FC<BookDetailModalProps> = ({
  book,
  currentIndex,
  totalCount,
  onClose,
  onSelectPrev,
  onSelectNext,
  isClosing = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    modalRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentIndex]);

  useEffect(() => {
    prevActiveElementRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || !modalRef.current.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !modalRef.current.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      } else if (e.key === 'ArrowLeft' && onSelectPrev && currentIndex > 0) {
        onSelectPrev();
      } else if (e.key === 'ArrowRight' && onSelectNext && currentIndex < totalCount - 1) {
        onSelectNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      prevActiveElementRef.current?.focus?.();
    };
  }, [onClose, onSelectPrev, onSelectNext, currentIndex, totalCount]);

  if (!book) return null;

  const leftPageNum = currentIndex * 2 + 1;
  const rightPageNum = currentIndex * 2 + 2;

  return (
    <div
      ref={modalRef}
      className={`monograph-page-viewport fixed inset-0 z-50 w-screen h-screen bg-[#fcf9f2] text-[#1a1614] overflow-y-auto flex flex-col selection:bg-[#891a20] selection:text-white ${
        isClosing ? 'animate-folio-out pointer-events-none' : 'animate-folio-in'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`${book.title} Monograph Details`}
    >
      {/* 1. Backdrop (Click outside closes folio modal, preserved for T5.23 test contract) */}
      <div
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close Monograph Overlay"
      />

      {/* 2. Top Header Bar (Full Bleed Paper Margin) */}
      <header className="relative z-20 w-full bg-[#f4ece0] border-b border-[#ded5c0] px-4 sm:px-8 py-3 flex items-center justify-between shrink-0 shadow-2xs animate-stagger-1">
        <div className="flex items-center gap-3 text-[10px] font-eyebrow uppercase tracking-[0.20em] text-[#675c4e]">
          <span className="text-[#891a20] font-bold">§ {String(currentIndex + 1).padStart(2, '0')}</span>
          <span className="hidden sm:inline">ATHENAEUM ARCHIVAL MONOGRAPH //</span>
          <span className="text-[#1a1614] font-medium">{book.category.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="min-h-[44px] flex items-center gap-2 px-3 py-1.5 rounded-xs bg-[#fcf9f2] hover:bg-white text-[#1a1614] border border-[#d5caa8] transition-all cursor-pointer shadow-2xs hover:border-[#891a20]/60 hover:text-[#891a20] text-[11px] font-eyebrow uppercase tracking-[0.16em] focus-visible:outline-2 focus-visible:outline-[#891a20] focus-visible:outline-offset-2"
            title="Return to 3D Shelf (Esc)"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[#891a20]" />
            <span>Return to 3D Shelf</span>
            <span className="text-[9px] text-[#675c4e] border border-[#ded5c0] px-1 rounded-xs">ESC</span>
          </button>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xs bg-[#fcf9f2] hover:bg-white text-[#1a1614] border border-[#d5caa8] transition-all cursor-pointer shadow-2xs hover:border-[#891a20]/60 hover:text-[#891a20] focus-visible:outline-2 focus-visible:outline-[#891a20] focus-visible:outline-offset-2"
            title="Close Folio (Esc)"
            aria-label="Close Folio (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. Main Reading Chamber: The Centered Two-Page Parchment Spread */}
      <div
        role="region"
        aria-label="Monograph Reading Chamber"
        className="relative z-10 w-full max-w-7xl mx-auto flex-1 p-3 sm:p-6 md:p-8 flex flex-col justify-center my-auto min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full rounded-xs bg-[#fbf8f1] border border-[#dfd4bd] shadow-[0_20px_50px_rgba(40,30,20,0.12),0_2px_8px_rgba(40,30,20,0.06)] flex flex-col overflow-hidden">
          {/* Top Spine Leather Headband Accent */}
          <div
            className="w-full h-1.5 shrink-0 opacity-90"
            style={{ backgroundColor: book.coverColor }}
          />

          {/* Crimson Bookmark Ribbon descending down the central spine fold */}
          <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-16 bg-[#891a20] shadow-md z-30 pointer-events-none rounded-b-xs">
            <div className="absolute bottom-0 inset-x-0 h-1 bg-[#d4af37]/60" />
          </div>

        {/* TWO-PAGE SPREAD GRID (Verso: Left Page / Recto: Right Page) */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#ded4be]">
          
          {/* ========================================================
              LEFT PAGE (VERSO): Exposition & Archival Metadata
             ======================================================== */}
          <div className="relative p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-[#fbf8f1] shadow-[inset_-20px_0_30px_-15px_rgba(50,35,20,0.05)] flex flex-col justify-between animate-stagger-2">
            
            <div className="space-y-6 sm:space-y-7 relative">
              
              {/* Running Folio Header (Left) */}
              <div className="flex justify-between items-center text-[10px] font-eyebrow uppercase tracking-[0.22em] text-[#675c4e] border-b border-[#ded5c0] pb-2.5">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#891a20] font-bold">§ {String(currentIndex + 1).padStart(2, '0')}</span>
                  <span>MONOGRAPH // {book.category.toUpperCase()}</span>
                </span>
                <span>CURATED BY {book.curator.toUpperCase()}</span>
              </div>

              {/* Classification Badges & Metadata Line */}
              <div className="flex items-center gap-2.5 flex-wrap text-[10px] font-eyebrow tracking-[0.18em] text-[#5c5347] uppercase">
                <span className="px-2.5 py-0.5 rounded-xs bg-[#1a1614] text-[#fbf8f1]">
                  {book.category}
                </span>
                <span className="text-[#675c4e]">•</span>
                <span className="border border-[#ded5c0] px-2 py-0.5 rounded-xs bg-[#f4eedf]/80">
                  CALL NO. {book.callNumber}
                </span>
                <span className="text-[#675c4e]">•</span>
                <span>YEAR {book.year}</span>
                <span className="text-[#675c4e]">•</span>
                <span>{book.edition}</span>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2">
                <BalancedText
                  as="h2"
                  lines={2}
                  reserveLines={2}
                  className="text-2xl sm:text-3xl lg:text-[2.5rem] font-heading font-normal uppercase text-[#1a1614] leading-[1.06] tracking-[-0.035em]"
                >
                  {book.title}
                </BalancedText>

                <p className="text-sm sm:text-base font-body text-[#5c5246] tracking-[-0.015em] leading-relaxed">
                  {book.subtitle}
                </p>
              </div>

              {/* Illuminated Editorial Drop-Cap Synopsis */}
              <div className="text-[#2b2520] font-body text-sm sm:text-[15px] leading-[1.75] tracking-[-0.015em] text-left pt-1">
                <p>
                  <span className="float-left text-5xl sm:text-6xl font-heading font-normal text-[#1a1614] leading-none pr-3 pt-0.5 font-serif select-none">
                    {book.fullSynopsis.charAt(0)}
                  </span>
                  {book.fullSynopsis.slice(1)}
                </p>
              </div>

              {/* Clean Archival Telemetry Metrics (Typographic Table) */}
              <div className="pt-4 border-t border-[#ded5c0]/70">
                <div className="text-[10.5px] font-eyebrow uppercase tracking-[0.20em] text-[#675c4e] pb-2 flex justify-between">
                  <span>ARCHIVAL TELEMETRY</span>
                  <span className="text-[#891a20]">TABLE 01</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-[#ded5c0] pt-1">
                  {book.metrics.map((m, i) => (
                    <div key={i} className={`px-3 py-1 ${i === 0 ? 'pl-0' : ''} ${i === 2 ? 'pr-0 text-right' : i === 1 ? 'text-center' : 'text-left'}`}>
                      <div className="text-[10.5px] font-eyebrow uppercase tracking-[0.16em] text-[#675c4e]">{m.label}</div>
                      <div className="text-base sm:text-lg lg:text-xl font-heading font-normal text-[#1a1614] mt-0.5 tabular-nums">{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Verso Folio Foot */}
            <div className="pt-4 mt-6 border-t border-[#ded5c0] flex justify-between items-center text-[10px] font-eyebrow uppercase tracking-[0.20em] text-[#675c4e] relative">
              <span>{book.stackShelf.toUpperCase()}</span>
              <span className="font-serif italic font-normal text-xs text-[#5c5246]">— {leftPageNum} —</span>
            </div>
          </div>

          {/* ========================================================
              RIGHT PAGE (RECTO): Systems, Stack & Live Actions
             ======================================================== */}
          <div className="relative p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-[#fbf8f1] shadow-[inset_20px_0_30px_-15px_rgba(50,35,20,0.05)] flex flex-col justify-between animate-stagger-3">
            
            <div className="space-y-6 sm:space-y-7 relative">
              
              {/* Running Folio Header (Right) */}
              <div className="flex justify-between items-center text-[10px] font-eyebrow uppercase tracking-[0.22em] text-[#675c4e] border-b border-[#ded5c0] pb-2.5">
                <span>ATELIER SPECIFICATION & ARCHITECTURE</span>
                <span className="text-[#891a20]">SECTION // B</span>
              </div>

              {/* Key Highlights & Architectural Treatises (Open, serene layout) */}
              <div className="space-y-3">
                <div className="text-[10px] font-eyebrow uppercase tracking-[0.20em] text-[#1a1614] flex items-center justify-between border-b border-[#ded5c0]/70 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#891a20]" />
                    Key Treatises & System Notes
                  </span>
                  <span className="font-mono text-[10.5px] text-[#675c4e]">{book.keyFeatures.length} ENTRIES</span>
                </div>

                <ul className="space-y-2.5 pt-1">
                  {book.keyFeatures.map((feat, idx) => (
                    <li key={idx} className="text-xs sm:text-[13.5px] font-body text-[#2b2520] flex items-start gap-2.5 tracking-[-0.015em] leading-relaxed">
                      <span className="text-[#891a20] font-mono text-xs font-bold shrink-0 mt-0.5">0{idx + 1}.</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Applied Technologies & Stack Ingredients */}
              <div className="space-y-2.5 pt-1">
                <div className="text-[10px] font-eyebrow uppercase tracking-[0.20em] text-[#1a1614] flex items-center gap-1.5 border-b border-[#ded5c0]/70 pb-2">
                  <Layers className="w-3.5 h-3.5 text-[#891a20]" />
                  <span>Applied Technologies & Stack</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {book.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xs text-[10px] font-eyebrow uppercase tracking-[0.14em] bg-[#f4ede0]/70 text-[#2c2621] border border-[#d8cca8] hover:border-[#891a20]/60 transition-colors shadow-3xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Physical Book Material Specifications (Elegant Colophon Footnote) */}
              <div className="pt-3 pb-1 border-t border-[#ded5c0]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-eyebrow uppercase tracking-[0.16em] text-[#6b6051]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#675c4e]">BINDING:</span>
                  <span className="text-[#1a1614] font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block border border-black/20" style={{ backgroundColor: book.coverColor }} />
                    {book.bindingMaterial || book.coverColor}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#675c4e]">FOIL:</span>
                  <span className="text-[#1a1614] font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block border border-black/20" style={{ backgroundColor: book.accentColor }} />
                    {book.foilMaterial || book.accentColor}
                  </span>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                {book.githubUrl && (
                  <a
                    href={book.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xs bg-[#1a1614] text-[#fbf8f1] hover:bg-[#891a20] transition-colors text-xs font-eyebrow uppercase tracking-[0.18em] shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[#891a20] focus-visible:outline-offset-2"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Source Code</span>
                  </a>
                )}
                {book.liveUrl && book.liveUrl !== '#' && (
                  <a
                    href={book.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xs bg-[#f4ece0] hover:bg-[#ede3d3] text-[#1a1614] border border-[#d5caa8] transition-colors text-xs font-eyebrow uppercase tracking-[0.18em] shadow-xs cursor-pointer hover:border-[#891a20]/60 focus-visible:outline-2 focus-visible:outline-[#891a20] focus-visible:outline-offset-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#891a20]" />
                    <span>Live Deployment</span>
                  </a>
                )}
              </div>

            </div>

            {/* Recto Folio Foot */}
            <div className="pt-4 mt-6 border-t border-[#ded5c0] flex justify-between items-center text-[10px] font-eyebrow uppercase tracking-[0.20em] text-[#675c4e] relative">
              <span className="font-serif italic font-normal text-xs text-[#5c5246]">— {rightPageNum} —</span>
              <span>KANG'S ATHENAEUM // MONOGRAPH</span>
            </div>
          </div>

        </div>

        {/* BOTTOM FOLIO NAVIGATION BAR */}
        <div className="p-3 sm:p-4 bg-[#f4ece0] border-t border-[#ded5c0] flex justify-between items-center gap-2 animate-stagger-4">
          <button
            onClick={onSelectPrev}
            disabled={!onSelectPrev || currentIndex === 0}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#fcf9f2] hover:bg-white text-[#2c2621] border border-[#d5caa8] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px] font-eyebrow uppercase tracking-[0.16em] cursor-pointer shadow-2xs focus-visible:outline-2 focus-visible:outline-[#891a20] focus-visible:outline-offset-2"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#891a20]" />
            <span>[←] Prev</span>
          </button>

          <button
            onClick={onClose}
            className="min-h-[44px] flex items-center gap-2 px-4 py-1.5 rounded-xs bg-[#1a1614] hover:bg-[#891a20] text-[#fbf8f1] transition-all text-[11px] font-eyebrow uppercase tracking-[0.18em] cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[#891a20] focus-visible:outline-offset-2"
          >
            <ArrowUp className="w-3 h-3" />
            <span>Return to 3D Shelf</span>
          </button>

          <button
            onClick={onSelectNext}
            disabled={!onSelectNext || currentIndex === totalCount - 1}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#fcf9f2] hover:bg-white text-[#2c2621] border border-[#d5caa8] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px] font-eyebrow uppercase tracking-[0.16em] cursor-pointer shadow-2xs focus-visible:outline-2 focus-visible:outline-[#891a20] focus-visible:outline-offset-2"
          >
            <span>Next [→]</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#891a20]" />
          </button>
        </div>

      </div>
      </div>
    </div>
  );
};
