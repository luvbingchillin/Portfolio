import type { FC } from 'react';
import type { ProjectBook } from '../types/book';
import { TopNav } from './TopNav';
import { EditorialInfoSection } from './EditorialInfoSection';

export interface LibraryUIProps {
  books: ProjectBook[];
  activeIndex: number;
  isFlipped: boolean;
  onSelectIndex: (index: number) => void;
  onToggleFlip: () => void;
  onOpenSpread: () => void;
  onCloseSpread?: () => void;
  scrollProgress?: number;
  isDragging?: boolean;
  velocity?: number;
  isModalOpen?: boolean;
}

export const LibraryUI: FC<LibraryUIProps> = ({
  books,
  activeIndex,
  onSelectIndex,
  onOpenSpread,
  onCloseSpread,
  isModalOpen = false
}) => {
  const activeBook = books[activeIndex];

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none">

      {/* TOP-CENTER: A24 Fixed Navigation Bar */}
      <TopNav
        books={books}
        activeIndex={activeIndex}
        onSelectIndex={onSelectIndex}
        onOpenSpread={onOpenSpread}
        onCloseSpread={onCloseSpread}
        isModalOpen={isModalOpen}
      />

      {/* TOP-LEFT: Editorial Info Section */}
      <EditorialInfoSection
        activeBook={activeBook}
        className={`transition-all duration-500 ${isModalOpen ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}
      />

    </div>
  );
};
