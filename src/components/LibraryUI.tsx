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
        isModalOpen={isModalOpen}
      />

      {/* TOP-LEFT: Editorial Info Section */}
      <EditorialInfoSection
        activeBook={activeBook}
      />

    </div>
  );
};
