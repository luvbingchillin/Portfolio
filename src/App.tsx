import { useState, useEffect, useCallback } from 'react';
import { BOOKS_CATALOG } from './data/booksData.ts';
import { LibraryScene } from './components/LibraryScene.tsx';
import { LibraryUI } from './components/LibraryUI.tsx';
import { BookDetailModal } from './components/BookDetailModal.tsx';
import { Preloader } from './components/Preloader.tsx';

export function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
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

  const handleOpenSpread = useCallback(() => {
    setIsOpening(true);
    // Reference site handover timing (380ms): allow 3D book cover to smoothly open
    // towards the camera, then transition cleanly into the solid full-screen monograph spread
    const timer = window.setTimeout(() => {
      setIsSpreadOpen(true);
    }, 380);
    return () => clearTimeout(timer);
  }, []);

  const handleCloseSpread = useCallback(() => {
    setIsSpreadOpen(false);
    setIsOpening(false);
  }, []);

  const handleSelectIndex = useCallback((index: number) => {
    setActiveIndex(index);
    // Reset flip when switching to another book for clean presentation
    setIsFlipped(false);
  }, []);

  const handlePrevBook = useCallback(() => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
    setIsFlipped(false);
  }, []);

  const handleNextBook = useCallback(() => {
    setActiveIndex((prev) => Math.min(BOOKS_CATALOG.length - 1, prev + 1));
    setIsFlipped(false);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isLoaded) return;

      if (e.key === 'Escape') {
        if (isSpreadOpen) {
          handleCloseSpread();
        }
        return;
      }

      if (isSpreadOpen) return;

      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => Math.min(BOOKS_CATALOG.length - 1, prev + 1));
      } else if (e.key === 'Enter') {
        handleOpenSpread();
      }
    },
    [isSpreadOpen, isLoaded, handleCloseSpread, handleOpenSpread]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleFlip = useCallback((flipped: boolean) => {
    setIsFlipped(flipped);
  }, []);

  const handleToggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  return (
    <main className="relative w-screen h-screen bg-white text-[#171c1c] font-body overflow-hidden selection:bg-[#891a20] selection:text-white">
      
      {/* 3D WebGL Library Stage */}
      <div className="relative w-full h-full overflow-hidden">
        <LibraryScene
          books={BOOKS_CATALOG}
          activeIndex={activeIndex}
          isFlipped={isFlipped}
          isLoaded={isLoaded}
          onProgress={setLoadProgress}
          onSelectBook={handleSelectIndex}
          onOpenSpread={handleOpenSpread}
          onFlip={handleFlip}
          isModalOpen={isOpening || isSpreadOpen}
          isOpen={isOpening || isSpreadOpen}
        />

        {/* Preloader Screen */}
        {isPreloaderMounted && (
          <Preloader
            externalProgress={loadProgress}
            onLoaded={handlePreloaderComplete}
          />
        )}

        {/* Library UI Overlay (Fixed Top Navigation & Editorial Info) */}
        <div className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <LibraryUI
            books={BOOKS_CATALOG}
            activeIndex={activeIndex}
            isFlipped={isFlipped}
            onSelectIndex={handleSelectIndex}
            onToggleFlip={handleToggleFlip}
            onOpenSpread={handleOpenSpread}
            onCloseSpread={handleCloseSpread}
            isModalOpen={isOpening || isSpreadOpen}
          />
        </div>
      </div>

      {/* Archival Monograph Book Page Spread (Opens in-place over 3D book, matching reference site transition) */}
      {isSpreadOpen && (
        <BookDetailModal
          book={BOOKS_CATALOG[activeIndex]}
          currentIndex={activeIndex}
          totalCount={BOOKS_CATALOG.length}
          onClose={handleCloseSpread}
          onSelectPrev={handlePrevBook}
          onSelectNext={handleNextBook}
        />
      )}

    </main>
  );
}

export default App;
