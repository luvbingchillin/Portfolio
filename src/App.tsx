import { useState, useEffect, useCallback } from 'react';
import { BOOKS_CATALOG } from './data/booksData';
import { LibraryScene } from './components/LibraryScene';
import { LibraryUI } from './components/LibraryUI';
import { BookDetailModal } from './components/BookDetailModal';

export function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpreadOpen, setIsSpreadOpen] = useState(false);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is inside an input or modal is open (except for close)
      if (isSpreadOpen) return;

      if (e.key === 'ArrowLeft') {
        setActiveIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveIndex(prev => Math.min(BOOKS_CATALOG.length - 1, prev + 1));
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsSpreadOpen(true);
      }
    },
    [isSpreadOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelectIndex = (index: number) => {
    setActiveIndex(index);
    // Reset flip when switching to another book for clean presentation
    if (index !== activeIndex) {
      setIsFlipped(false);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0c0a08] text-[#f4ecd8] font-serif">
      {/* Background Library Atmosphere: Subtle warm vignette & architectural grain */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#3a2919]/30 via-[#1a120b]/60 to-[#0c0a08]" />

      {/* 3D WebGL Library Scene (Three.js Canvas) */}
      <LibraryScene
        books={BOOKS_CATALOG}
        activeIndex={activeIndex}
        isFlipped={isFlipped}
        onSelectBook={handleSelectIndex}
        onOpenSpread={() => setIsSpreadOpen(true)}
      />

      {/* Library UI Overlay */}
      <LibraryUI
        books={BOOKS_CATALOG}
        activeIndex={activeIndex}
        isFlipped={isFlipped}
        onSelectIndex={handleSelectIndex}
        onToggleFlip={() => setIsFlipped(prev => !prev)}
        onOpenSpread={() => setIsSpreadOpen(true)}
      />

      {/* Two-Page Archival Reading Spread (Opened Tome Modal) */}
      {isSpreadOpen && (
        <BookDetailModal
          book={BOOKS_CATALOG[activeIndex]}
          onClose={() => setIsSpreadOpen(false)}
        />
      )}
    </main>
  );
}

export default App;
