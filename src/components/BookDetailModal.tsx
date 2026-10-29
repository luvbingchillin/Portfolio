import { useEffect } from 'react';
import type { FC } from 'react';
import type { ProjectBook } from '../types/book';
import { BalancedText } from '../utils/textBalance';
import { X, ExternalLink, Github, Layers, Award } from './Icons';

export interface BookDetailModalProps {
  book: ProjectBook | null;
  onClose: () => void;
}

export const BookDetailModal: FC<BookDetailModalProps> = ({ book, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Two-Page Archival Editorial Monograph Spread */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl bg-white text-[#171c1c] border border-black/10 flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-sm bg-white hover:bg-neutral-100 text-[#171c1c] border border-black/10 transition-colors cursor-pointer shadow-sm"
          title="Close Folio (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PAGE: Exposition & Archival Metadata */}
        <div className="flex-1 p-8 sm:p-12 border-b md:border-b-0 md:border-r border-black/10 relative bg-[#fafaf9]/50 md:bg-transparent">
          
          {/* Folio Stamp */}
          <div className="text-[10px] uppercase font-eyebrow tracking-[0.20em] text-[#57534e] mb-6 flex justify-between items-center border-b border-black/10 pb-2.5">
            <span>{book.stackShelf.toUpperCase()}</span>
            <span>CALL NO. {book.callNumber}</span>
          </div>

          <div className="space-y-4">
            <span className="inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-eyebrow tracking-[0.20em] bg-neutral-100 text-[#171c1c] border border-black/10">
              {book.category.toUpperCase()}
            </span>

            <BalancedText
              as="h2"
              lines={2}
              reserveLines={2}
              className="text-3xl sm:text-4xl font-heading font-normal text-[#171c1c] leading-[1.08] tracking-[-0.04em]"
            >
              {book.title}
            </BalancedText>

            <p className="text-base font-body text-[#57534e] tracking-[-0.025em] border-l-2 border-[#891a20] pl-3 py-0.5">
              {book.subtitle}
            </p>

            {/* Illuminated Editorial Drop-Cap Synopsis */}
            <div className="pt-4 text-[#292524] font-body text-sm sm:text-base leading-relaxed text-justify tracking-[-0.025em]">
              <span className="float-left text-5xl font-heading font-normal text-[#171c1c] leading-none pr-3 pt-0.5">
                {book.fullSynopsis.charAt(0)}
              </span>
              {book.fullSynopsis.slice(1)}
            </div>

            {/* Clean Archival Metric Grid */}
            <div className="pt-6 grid grid-cols-3 gap-3">
              {book.metrics.map((m, i) => (
                <div key={i} className="p-3 rounded-sm bg-neutral-50 border border-black/10 text-center">
                  <div className="text-[10px] font-eyebrow uppercase tracking-[0.20em] text-[#57534e]">{m.label}</div>
                  <div className="text-lg font-heading font-normal text-[#171c1c] mt-1 tabular-nums">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PAGE: Key Systems, Technical Ingredients & Treatises */}
        <div className="flex-1 p-8 sm:p-12 bg-white flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-[10px] uppercase font-eyebrow tracking-[0.20em] text-[#57534e] flex justify-between items-center border-b border-black/10 pb-2.5">
              <span>FOLIO ANNOTATION // SYSTEMS</span>
              <span>COMPOSITION: {book.year}</span>
            </div>

            {/* Key Technical Highlights */}
            <div>
              <h3 className="text-xs font-eyebrow uppercase tracking-[0.20em] text-[#171c1c] mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#891a20]" />
                Treatise Highlights & Engineering Notes
              </h3>
              <ul className="space-y-2.5">
                {book.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="text-sm font-body text-[#292524] flex items-start gap-2.5 tracking-[-0.025em]">
                    <span className="text-[#891a20] font-mono mt-0.5">—</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech Stack Ingredients */}
            <div>
              <h3 className="text-xs font-eyebrow uppercase tracking-[0.20em] text-[#171c1c] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#891a20]" />
                Applied Technologies & Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {book.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-sm text-xs font-mono tracking-wider bg-neutral-100 text-[#171c1c] border border-black/10"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Links & Sign-off */}
          <div className="pt-8 border-t border-black/10 flex flex-wrap items-center justify-between gap-4 mt-6">
            <div className="text-xs font-body italic text-[#57534e]">
              Curated by <strong className="font-medium text-[#171c1c] not-italic">{book.curator}</strong>
            </div>

            <div className="flex items-center gap-3">
              {book.githubUrl && (
                <a
                  href={book.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono font-medium bg-neutral-100 text-[#171c1c] border border-black/10 hover:border-[#891a20] hover:text-[#891a20] transition-colors shadow-sm"
                >
                  <Github className="w-3.5 h-3.5" />
                  Source Code
                </a>
              )}
              {book.liveUrl && book.liveUrl !== '#' && (
                <a
                  href={book.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono font-medium bg-[#171c1c] text-white hover:bg-black transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Live System
                </a>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
