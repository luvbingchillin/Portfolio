import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isClosing, setIsClosing] = useState(false);
  const openTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  // Preloader & Boot Sequence State
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isPreloaderMounted, setIsPreloaderMounted] = useState(true);
  const isLoadedRef = useRef(false);

  const handlePreloaderComplete = useCallback(() => {
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;
    setIsLoaded(true);
    // Unmount Preloader from DOM after 1150ms fan reveal transition
    setTimeout(() => {
      setIsPreloaderMounted(false);
    }, 1150);
  }, []);

  const handleOpenSpread = useCallback(() => {
    if (isClosing) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpening(true);
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    openTimeoutRef.current = window.setTimeout(() => {
      setIsSpreadOpen(true);
      openTimeoutRef.current = null;
    }, 380);
  }, [isClosing]);

  const handleCloseSpread = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    setIsOpening(false);
    setIsClosing(true);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsSpreadOpen(false);
      setIsClosing(false);
      closeTimeoutRef.current = null;
    }, 220);
  }, []);

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
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

  const handleFlip = useCallback((flipped: boolean) => {
    setIsFlipped(flipped);
  }, []);

  const handleToggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Preloader active keyboard handler (Space or Escape skips boot sequence)
      if (!isLoaded) {
        if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          handlePreloaderComplete();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (isSpreadOpen || isOpening) {
          handleCloseSpread();
        }
        return;
      }

      if (isSpreadOpen || isOpening) return;

      // 'f' / 'F' key toggles book inspection flip when modal is not open
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFlip();
        return;
      }

      if (e.key === 'ArrowLeft') {
        handlePrevBook();
      } else if (e.key === 'ArrowRight') {
        handleNextBook();
      } else if (e.key === 'Enter') {
        handleOpenSpread();
      }
    },
    [
      isLoaded,
      isSpreadOpen,
      isOpening,
      handlePreloaderComplete,
      handleCloseSpread,
      handleToggleFlip,
      handlePrevBook,
      handleNextBook,
      handleOpenSpread
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <main
      onClick={!isLoaded ? handlePreloaderComplete : undefined}
      className={`relative w-screen h-screen bg-white text-[#171c1c] font-body overflow-hidden selection:bg-[#891a20] selection:text-white ${!isLoaded ? 'cursor-pointer' : ''}`}
    >
      
      {/* 3D WebGL Library Stage */}
      <div
        className="relative w-full h-full overflow-hidden"
        inert={isSpreadOpen && !isClosing ? true : undefined}
        aria-hidden={isSpreadOpen && !isClosing}
      >
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
          isOpen={isOpening || (isSpreadOpen && !isClosing)}
        />

        {/* Preloader Screen (Click to skip boot sequence) */}
        {isPreloaderMounted && (
          <div
            onClick={!isLoaded ? handlePreloaderComplete : undefined}
            className={!isLoaded ? 'cursor-pointer' : undefined}
          >
            <Preloader
              externalProgress={loadProgress}
              onLoaded={handlePreloaderComplete}
            />
          </div>
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
          isClosing={isClosing}
        />
      )}

    </main>
  );
}

export default App;
