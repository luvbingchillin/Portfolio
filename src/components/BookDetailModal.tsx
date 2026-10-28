import { useEffect } from 'react';
import type { FC } from 'react';
import type { ProjectBook } from '../types/book';
import { X, ExternalLink, Github, Layers, Award } from './Icons';

interface BookDetailModalProps {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Two-Page Archival Reading Spread */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl bg-[#f5ede0] text-[#1c1915] border border-[#d4af37]/40 flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#2a221b]/10 hover:bg-[#2a221b]/20 text-[#2a221b] transition-colors"
          title="Close folio (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PAGE (Exposition & Archival Metadata) */}
        <div className="flex-1 p-8 sm:p-12 border-b md:border-b-0 md:border-r border-[#d4af37]/30 relative">
          {/* Subtle page corner stamp */}
          <div className="text-[10px] uppercase font-mono tracking-widest text-[#8b7765] mb-6 flex justify-between items-center">
            <span>{book.stackShelf}</span>
            <span>{book.callNumber}</span>
          </div>

          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded text-xs font-serif tracking-wider bg-[#d4af37]/15 text-[#6c5112] border border-[#d4af37]/40 font-semibold">
              {book.category.toUpperCase()}
            </span>

            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a1410] leading-tight">
              {book.title}
            </h2>

            <p className="text-lg italic font-serif text-[#635547] border-l-2 border-[#d4af37] pl-3 py-0.5">
              {book.subtitle}
            </p>

            {/* Illuminated Drop-Cap Synopsis */}
            <div className="pt-4 text-[#2a241e] font-serif text-base leading-relaxed text-justify">
              <span className="float-left text-5xl font-serif font-bold text-[#8c6d23] leading-none pr-3 pt-1">
                {book.fullSynopsis.charAt(0)}
              </span>
              {book.fullSynopsis.slice(1)}
            </div>

            {/* Archival Metrics */}
            <div className="pt-6 grid grid-cols-3 gap-3">
              {book.metrics.map((m, i) => (
                <div key={i} className="p-3 rounded bg-[#ebe0ce] border border-[#d4af37]/25 text-center">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#7d6c5c]">{m.label}</div>
                  <div className="text-lg font-serif font-bold text-[#1f1914] mt-1">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PAGE (Key Systems, Technical Ingredients & Treatises) */}
        <div className="flex-1 p-8 sm:p-12 bg-[#f2e7d5] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="text-[10px] uppercase font-mono tracking-widest text-[#8b7765] flex justify-between items-center">
              <span>FOLIO ANNOTATION</span>
              <span>YEAR OF COMPOSITION: {book.year}</span>
            </div>

            {/* Key Technical Features */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#7a644e] mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#8c6d23]" />
                Treatise Highlights & Engineering Notes
              </h3>
              <ul className="space-y-2.5">
                {book.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="text-sm font-serif text-[#2f2720] flex items-start gap-2.5">
                    <span className="text-[#8c6d23] font-serif font-bold mt-0.5">§</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech Stack Ingredients */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#7a644e] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8c6d23]" />
                Applied Technologies & Medium
              </h3>
              <div className="flex flex-wrap gap-2">
                {book.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded text-xs font-mono bg-[#e4d6bf] text-[#2c231a] border border-[#cfbd9f]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Links & Sign-off */}
          <div className="pt-8 border-t border-[#d4af37]/30 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs font-serif italic text-[#726150]">
              Curated by <strong className="font-semibold text-[#1c1611]">{book.curator}</strong>
            </div>

            <div className="flex items-center gap-3">
              {book.githubUrl && (
                <a
                  href={book.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-medium bg-[#211a14] text-[#f4ecd8] hover:bg-[#382d22] transition-colors shadow-sm"
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-medium bg-[#8c6d23] text-white hover:bg-[#a6822c] transition-colors shadow-sm"
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
