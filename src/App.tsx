import { useState, useEffect, useCallback } from 'react';
import { BOOKS_CATALOG } from './data/booksData.ts';
import { LibraryScene } from './components/LibraryScene.tsx';
import { LibraryUI } from './components/LibraryUI.tsx';
import { BookDetailModal } from './components/BookDetailModal.tsx';
import { Preloader } from './components/Preloader.tsx';

export function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpreadOpen, setIsSpreadOpen] = useState(false);

  // Milestone 2 Preloader & Boot Sequence State
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isPreloaderMounted, setIsPreloaderMounted] = useState(true);

  const handlePreloaderComplete = useCallback(() => {
    setIsLoaded(true);
    // Unmount Preloader from DOM after 1150ms fan reveal transition
    setTimeout(() => {
      setIsPreloaderMounted(false);
    }, 1150);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if modal is open or preloader is active
      if (isSpreadOpen || !isLoaded) return;

      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => Math.min(BOOKS_CATALOG.length - 1, prev + 1));
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsSpreadOpen(true);
      }
    },
    [isSpreadOpen, isLoaded]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelectIndex = useCallback((index: number) => {
    setActiveIndex(index);
    // Reset flip when switching to another book for clean presentation
    setIsFlipped(false);
  }, []);

  const handleOpenSpread = useCallback(() => {
    setIsSpreadOpen(true);
  }, []);

  const handleCloseSpread = useCallback(() => {
    setIsSpreadOpen(false);
  }, []);

  const handleToggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#171c1c] text-[#f2f2f2] font-body">
      {/* Background Library Atmosphere: Subtle warm dark vignette */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#31383b]/30 via-[#1f2527]/60 to-[#171c1c]" />

      {/* 3D WebGL Library Scene (Three.js Canvas) - Mounted immediately under preloader for GPU warming */}
      <LibraryScene
        books={BOOKS_CATALOG}
        activeIndex={activeIndex}
        isFlipped={isFlipped}
        isLoaded={isLoaded}
        onProgress={setLoadProgress}
        onSelectBook={handleSelectIndex}
        onOpenSpread={handleOpenSpread}
      />

      {/* Stylized Dark Split-Drum Odometer Preloader Screen */}
      {isPreloaderMounted && (
        <Preloader
          externalProgress={loadProgress}
          onLoaded={handlePreloaderComplete}
        />
      )}

      {/* Library UI Overlay - Smoothly revealed as preloader completes */}
      <div className={`transition-opacity duration-700 ${isLoaded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <LibraryUI
          books={BOOKS_CATALOG}
          activeIndex={activeIndex}
          isFlipped={isFlipped}
          onSelectIndex={handleSelectIndex}
          onToggleFlip={handleToggleFlip}
          onOpenSpread={handleOpenSpread}
        />
      </div>

      {/* Two-Page Archival Reading Spread (Opened Tome Modal) */}
      {isSpreadOpen && (
        <BookDetailModal
          book={BOOKS_CATALOG[activeIndex]}
          onClose={handleCloseSpread}
        />
      )}
    </main>
  );
}

export default App;
