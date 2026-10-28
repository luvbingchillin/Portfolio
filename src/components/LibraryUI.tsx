import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { ProjectBook } from '../types/book';
import {
  BookOpen,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Github,
  Compass,
  Library,
  Clock
} from './Icons';

interface LibraryUIProps {
  books: ProjectBook[];
  activeIndex: number;
  isFlipped: boolean;
  onSelectIndex: (index: number) => void;
  onToggleFlip: () => void;
  onOpenSpread: () => void;
}

export const LibraryUI: FC<LibraryUIProps> = ({
  books,
  activeIndex,
  isFlipped,
  onSelectIndex,
  onToggleFlip,
  onOpenSpread
}) => {
  const activeBook = books[activeIndex];
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-8 z-10 select-none">
      
      {/* TOP BAR: Library Archive Navigation */}
      <header className="flex items-center justify-between pointer-events-auto border-b border-[#d4af37]/20 pb-4 backdrop-blur-sm bg-[#0e0c0a]/40 px-5 py-3 rounded-lg">
        {/* Brand / Crest */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[#241c14] border border-[#d4af37]/40 text-[#d4af37]">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-serif font-bold tracking-widest text-[#f5ede0] uppercase">
              The Athenaeum Archive
            </h1>
            <p className="text-[10px] font-mono tracking-wider text-[#a89682]">
              KANG YUCHEN • SPECIAL COLLECTIONS
            </p>
          </div>
        </div>

        {/* Center Department / Wing Indicator */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono tracking-widest text-[#9c8975]">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#d4af37]" />
            WING IV • COMPUTATIONAL MANUSCRIPTS
          </span>
          <span className="flex items-center gap-1.5 text-[#a69480]">
            <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
            READING ROOM: {currentTime || '18:50:00'}
          </span>
        </div>

        {/* Right Volume Counter */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-widest text-[#d4af37] bg-[#241c14] px-3 py-1.5 rounded border border-[#d4af37]/30">
            VOL. {romanNumerals[activeIndex] || activeIndex + 1} OF {romanNumerals[books.length - 1] || books.length}
          </span>
        </div>
      </header>

      {/* MIDDLE SECTION: Selected Tome Catalog Card (Left) */}
      <div className="flex items-end justify-between pointer-events-none my-auto">
        <aside className="pointer-events-auto max-w-sm sm:max-w-md bg-[#16120e]/85 backdrop-blur-md p-6 rounded-lg border border-[#d4af37]/30 shadow-2xl text-[#f4ecd8] space-y-4">
          
          {/* Card Header */}
          <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-[#d4af37] border-b border-[#d4af37]/20 pb-2">
            <span>{activeBook.callNumber}</span>
            <span>{activeBook.stackShelf}</span>
          </div>

          <div>
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider bg-[#d4af37]/15 text-[#e0bb56] border border-[#d4af37]/30 mb-2">
              {activeBook.category.toUpperCase()}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#f8f2e7] tracking-wide leading-tight">
              {activeBook.title}
            </h2>
            <p className="text-sm font-serif italic text-[#baa894] mt-1">
              “{activeBook.subtitle}”
            </p>
          </div>

          <p className="text-xs font-serif leading-relaxed text-[#d1c2b0]">
            {activeBook.shortDescription}
          </p>

          {/* Applied Technologies / Runes */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeBook.techStack.map((tech, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#282119] text-[#c9b9a6] border border-[#403529]"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenSpread}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-medium bg-[#d4af37] text-[#1c1409] hover:bg-[#e6c250] transition-colors shadow-lg cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Open Tome [Enter]
            </button>

            <button
              onClick={onToggleFlip}
              className="flex items-center gap-2 px-3 py-2 rounded text-xs font-mono bg-[#241c14] text-[#e8dcba] border border-[#d4af37]/40 hover:bg-[#33281d] transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              {isFlipped ? 'Show Front' : 'Flip to Spine [Space]'}
            </button>

            {activeBook.githubUrl && (
              <a
                href={activeBook.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded bg-[#241c14] text-[#e8dcba] border border-[#d4af37]/40 hover:bg-[#33281d] hover:text-[#d4af37] transition-colors"
                title="View Source on GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
          </div>
        </aside>
      </div>

      {/* BOTTOM BAR: Shelf Navigation & Keyboard Controls */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto border-t border-[#d4af37]/20 pt-4 backdrop-blur-sm bg-[#0e0c0a]/40 px-5 py-3 rounded-lg">
        
        {/* Navigation Arrows & Volume Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="p-2 rounded bg-[#241c14] border border-[#d4af37]/30 text-[#e8dcba] hover:bg-[#382b20] disabled:opacity-30 disabled:hover:bg-[#241c14] transition-colors cursor-pointer"
            title="Previous Tome (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Roman numeral jump links */}
          <div className="flex items-center gap-1.5">
            {books.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSelectIndex(idx)}
                className={`w-7 h-7 rounded text-xs font-mono transition-all cursor-pointer ${
                  idx === activeIndex
                    ? 'bg-[#d4af37] text-[#1c1409] font-bold shadow-md scale-105'
                    : 'bg-[#1e1711] text-[#9c8975] hover:text-[#f0e4d0] hover:bg-[#2d231b] border border-[#3b2f23]'
                }`}
              >
                {romanNumerals[idx] || idx + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => onSelectIndex(Math.min(books.length - 1, activeIndex + 1))}
            disabled={activeIndex === books.length - 1}
            className="p-2 rounded bg-[#241c14] border border-[#d4af37]/30 text-[#e8dcba] hover:bg-[#382b20] disabled:opacity-30 disabled:hover:bg-[#241c14] transition-colors cursor-pointer"
            title="Next Tome (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Keyboard and Gesture Shortcuts Guide */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono text-[#a89682]">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-[#221a13] border border-[#d4af37]/30 text-[#e8dcba]">←</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-[#221a13] border border-[#d4af37]/30 text-[#e8dcba]">→</kbd>
            Browse
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 rounded bg-[#221a13] border border-[#d4af37]/30 text-[#e8dcba]">Space</kbd>
            Flip Spine
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 rounded bg-[#221a13] border border-[#d4af37]/30 text-[#e8dcba]">Enter</kbd>
            Open Tome
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[#d4af37]">✦</span>
            Drag / Scroll Shelf
          </span>
        </div>

      </footer>
    </div>
  );
};
