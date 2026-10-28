import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { ProjectBook } from '../types/book';
import { BalancedText, initEditorialTypography } from '../utils/textBalance';
import {
  BookOpen,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Github
} from './Icons';

export interface LibraryUIProps {
  books: ProjectBook[];
  activeIndex: number;
  isFlipped: boolean;
  onSelectIndex: (index: number) => void;
  onToggleFlip: () => void;
  onOpenSpread: () => void;
  // Extended state contracts for motion & progress
  scrollProgress?: number;
  isDragging?: boolean;
  velocity?: number;
}

export const LibraryUI: FC<LibraryUIProps> = ({
  books,
  activeIndex,
  isFlipped,
  onSelectIndex,
  onToggleFlip,
  onOpenSpread,
  scrollProgress
}) => {
  const activeBook = books[activeIndex];
  const [currentTime, setCurrentTime] = useState('');

  // Live chronometer in 24-hour UTC format
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'UTC'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize and observe typography balance
  useEffect(() => {
    return initEditorialTypography();
  }, []);

  // Format indices with leading zero (e.g., 01, 02)
  const formatIndex = (n: number) => (n < 9 ? `0${n + 1}` : `${n + 1}`);

  // Calculate normalized progress percentage (0 - 100)
  const progressRatio = typeof scrollProgress === 'number'
    ? Math.max(0, Math.min(100, (scrollProgress / Math.max(1, books.length - 1)) * 100))
    : (activeIndex / Math.max(1, books.length - 1)) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-8 z-10 select-none">
      
      {/* 1. TOP BAR: A24 Editorial Masthead & Reading Chronometer */}
      <header className="flex items-center justify-between pointer-events-auto border-b border-[#31383b]/60 pb-3.5 backdrop-blur-md bg-[#171c1c]/60 px-5 py-3 rounded-sm">
        {/* Brand / Publication Title */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#891a20] shadow-[0_0_8px_rgba(137,26,32,0.6)]" />
          <div>
            <h1 className="text-sm font-heading tracking-[-0.04em] text-[#f2f2f2] uppercase font-normal">
              The Athenaeum
            </h1>
            <p className="text-[10px] font-eyebrow tracking-[0.20em] text-[#d6d3d1] uppercase">
              Monograph Series // Vol. 2026
            </p>
          </div>
        </div>

        {/* Center Wing / Reading Status Indicator */}
        <div className="hidden md:flex items-center gap-6 text-[11px] font-eyebrow tracking-[0.20em] text-[#d6d3d1]">
          <span className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e1f7e1]" />
            COLLECTION 01 • COMPUTATIONAL SYSTEMS
          </span>
          <span className="text-[#31383b]">|</span>
          <span className="tabular-nums font-body text-[#f2f2f2] font-medium tracking-normal text-xs">
            UTC {currentTime || '12:00:00'}
          </span>
        </div>

        {/* Right Publication Numbering */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-widest text-[#f2f2f2] bg-[#1f2527] px-3 py-1 rounded-sm border border-[#31383b]">
            INDEX [{formatIndex(activeIndex)} / {formatIndex(books.length - 1)}]
          </span>
        </div>
      </header>

      {/* 2. MIDDLE SECTION: A24 Editorial Catalog Card (Bottom-Left) */}
      <div className="flex items-end justify-between pointer-events-none my-auto">
        <aside className="pointer-events-auto max-w-sm sm:max-w-md bg-[#171c1c]/90 backdrop-blur-md p-6 rounded-sm border border-[#31383b] shadow-2xl text-[#f2f2f2] space-y-4">
          
          {/* Metadata Bar */}
          <div className="flex items-center justify-between text-[10px] font-eyebrow tracking-[0.20em] text-[#d6d3d1] border-b border-[#31383b] pb-2.5">
            <span>{activeBook.callNumber}</span>
            <span>{activeBook.stackShelf}</span>
          </div>

          {/* Title & Category */}
          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-eyebrow tracking-[0.20em] bg-[#1f2527] text-[#f2f2f2] border border-[#31383b]">
              {activeBook.category.toUpperCase()}
            </span>
            <BalancedText
              as="h2"
              lines={2}
              reserveLines={2}
              className="text-2xl sm:text-3xl font-heading font-normal text-[#f2f2f2] tracking-[-0.04em] leading-[1.08]"
            >
              {activeBook.title}
            </BalancedText>
            <p className="text-sm font-body text-[#d6d3d1] tracking-[-0.025em]">
              “{activeBook.subtitle}”
            </p>
          </div>

          {/* Synopsis */}
          <p
            className="text-xs sm:text-[13px] font-body leading-[1.5] text-[#d6d3d1] tracking-[-0.025em]"
            data-reserve-lines="3"
          >
            {activeBook.shortDescription}
          </p>

          {/* Applied Technologies */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeBook.techStack.map((tech, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-sm text-[10px] font-mono tracking-wider bg-[#1f2527] text-[#d6d3d1] border border-[#31383b]"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenSpread}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono font-medium bg-[#f2f2f2] text-[#000000] hover:bg-white transition-all shadow-md cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Open Folio [Enter]
            </button>

            <button
              onClick={onToggleFlip}
              className="flex items-center gap-2 px-3.5 py-2 rounded-sm text-xs font-mono bg-[#171c1c] text-[#f2f2f2] border border-[#31383b] hover:border-[#891a20] hover:text-white transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 transition-transform duration-300 ${isFlipped ? 'rotate-180 text-[#891a20]' : ''}`} />
              {isFlipped ? 'Show Front' : 'Flip Spine [Space]'}
            </button>

            {activeBook.githubUrl && (
              <a
                href={activeBook.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-sm bg-[#171c1c] text-[#d6d3d1] border border-[#31383b] hover:border-[#f2f2f2] hover:text-[#f2f2f2] transition-colors"
                title="View Source on GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM BAR: Shelf Navigation & Keyboard Controls */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto border-t border-[#31383b]/60 pt-3.5 backdrop-blur-md bg-[#171c1c]/60 px-5 py-3 rounded-sm">
        
        {/* Navigation Chevrons, Numeric Selector & Continuous Progress Track */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="p-2 rounded-sm bg-[#171c1c] border border-[#31383b] text-[#f2f2f2] hover:border-[#891a20] hover:bg-[#1f2527] disabled:opacity-20 transition-colors cursor-pointer"
            title="Previous Tome (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Minimalist Two-Digit Jump Links */}
          <div className="flex items-center gap-1.5">
            {books.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSelectIndex(idx)}
                className={`w-7 h-7 rounded-sm text-xs font-mono transition-all cursor-pointer ${
                  idx === activeIndex
                    ? 'bg-[#f2f2f2] text-[#000000] font-bold shadow-sm'
                    : 'bg-[#171c1c] text-[#d6d3d1] hover:text-white hover:bg-[#1f2527] border border-[#31383b]'
                }`}
              >
                {formatIndex(idx)}
              </button>
            ))}
          </div>

          <button
            onClick={() => onSelectIndex(Math.min(books.length - 1, activeIndex + 1))}
            disabled={activeIndex === books.length - 1}
            className="p-2 rounded-sm bg-[#171c1c] border border-[#31383b] text-[#f2f2f2] hover:border-[#891a20] hover:bg-[#1f2527] disabled:opacity-20 transition-colors cursor-pointer"
            title="Next Tome (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Continuous Progress Indicator */}
          <div className="hidden sm:block ml-2 w-20 h-1 bg-[#31383b] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#891a20] transition-all duration-300"
              style={{ width: `${progressRatio}%` }}
            />
          </div>
        </div>

        {/* Minimalist Keycap Badges */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono text-[#d6d3d1]">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded-sm bg-[#171c1c] border border-[#31383b] text-[#f2f2f2]">←</kbd>
            <kbd className="px-1.5 py-0.5 rounded-sm bg-[#171c1c] border border-[#31383b] text-[#f2f2f2]">→</kbd>
            Browse
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 rounded-sm bg-[#171c1c] border border-[#31383b] text-[#f2f2f2]">Space</kbd>
            Flip Spine
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 rounded-sm bg-[#171c1c] border border-[#31383b] text-[#f2f2f2]">Enter</kbd>
            Open Folio
          </span>
          <span className="flex items-center gap-1.5 text-[#d6d3d1]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#891a20]" />
            Drag / Scroll Shelf
          </span>
        </div>

      </footer>
    </div>
  );
};
