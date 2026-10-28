import type { ProjectBook } from './types/book';

// 1. Domain Types
export type { ProjectBook } from './types/book';
export type Book = ProjectBook;

// 2. UI Component Props
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
}

export interface BookDetailModalProps {
  book: ProjectBook | null;
  onClose: () => void;
}

// 3. Motion & Physics Engine Configuration (Milestone 3)
export interface PhysicsConfig {
  snapFreq: number;       // Natural harmonic frequency (9.5)
  snapDamping: number;    // Damping ratio (12.0)
  friction: number;       // Momentum decay friction (0.89)
  flowLean: number;       // Drag lean sensitivity (0.055)
  flowLeanMax: number;    // Maximum lean angle (0.3 rad)
  flowBank: number;       // Roll banking factor (0.32)
  flowDip: number;        // Downforce vertical factor (0.014)
  flowDipMax: number;     // Maximum vertical displacement (0.06)
  flightRecede: number;   // Inactive book Z-axis recession (2.2)
  flipDuration: number;   // 180-deg flip duration (1.05s)
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  snapFreq: 9.5,
  snapDamping: 12.0,
  friction: 0.89,
  flowLean: 0.055,
  flowLeanMax: 0.3,
  flowBank: 0.32,
  flowDip: 0.014,
  flowDipMax: 0.06,
  flightRecede: 2.2,
  flipDuration: 1.05
};

// 4. Preloader & Boot Contracts (Milestone 2)
export interface PreloaderProps {
  onLoaded: () => void;
  progress?: number;
}
