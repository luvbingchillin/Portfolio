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

  // Preloader & Boot Sequence State
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

  // Keyboard navigation (arrow keys only — flip and open are now mouse/click driven)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isSpreadOpen || !isLoaded) return;

      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => Math.min(BOOKS_CATALOG.length - 1, prev + 1));
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

  const handleFlip = useCallback((flipped: boolean) => {
    setIsFlipped(flipped);
  }, []);

  const handleToggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-white text-[#171c1c] font-body">
      {/* 3D WebGL Library Scene */}
      <LibraryScene
        books={BOOKS_CATALOG}
        activeIndex={activeIndex}
        isFlipped={isFlipped}
        isLoaded={isLoaded}
        onProgress={setLoadProgress}
        onSelectBook={handleSelectIndex}
        onOpenSpread={handleOpenSpread}
        onFlip={handleFlip}
      />

      {/* Preloader Screen */}
      {isPreloaderMounted && (
        <Preloader
          externalProgress={loadProgress}
          onLoaded={handlePreloaderComplete}
        />
      )}

      {/* Library UI Overlay */}
      <div className={`transition-opacity duration-700 ${isLoaded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <LibraryUI
          books={BOOKS_CATALOG}
          activeIndex={activeIndex}
          isFlipped={isFlipped}
          onSelectIndex={handleSelectIndex}
          onToggleFlip={handleToggleFlip}
          onOpenSpread={handleOpenSpread}
          isModalOpen={isSpreadOpen}
        />
      </div>

      {/* Two-Page Archival Reading Spread */}
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
