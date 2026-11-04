import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC, KeyboardEvent, MouseEvent } from 'react';
import type { ProjectBook } from '../types/book';

export interface TopNavProps {
  books: ProjectBook[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  brandTitle?: string;
  className?: string;
  onOpenSpread?: () => void;
  onCloseSpread?: () => void;
  isModalOpen?: boolean;
}

/**
 * Mathematical sliding page dot coordinate calculation
 * Matches A24 reference site:
 * x = activeLabel.left + activeLabel.width / 2 - list.left
 * y = activeLabel.bottom - list.top + navDotGap (5px)
 */
function calculateNavDotCoords(
  activeLabelRect: { left: number; right: number; top: number; bottom: number; width: number; height: number },
  listRect: { left: number; right: number; top: number; bottom: number; width: number; height: number },
  navDotGap = 5
): { x: number; y: number } {
  const x = activeLabelRect.left + activeLabelRect.width / 2 - listRect.left;
  const y = activeLabelRect.bottom - listRect.top + navDotGap;
  return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
}

export const TopNav: FC<TopNavProps> = ({
  books,
  activeIndex,
  onSelectIndex,
  brandTitle = 'PORTFOLIO',
  className = '',
  onOpenSpread,
  onCloseSpread,
  isModalOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualTab, setManualTab] = useState<'folio' | 'overview'>('folio');
  const activeTab = isModalOpen ? 'overview' : manualTab;
  const [isIndexHovered, setIsIndexHovered] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hoverOrigins, setHoverOrigins] = useState<Record<number, string>>({});
  const [focusedIndex, setFocusedIndex] = useState<number | null>(activeIndex);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 991 : false
  );
  const [dotPos, setDotPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  });

  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const folioTabRef = useRef<HTMLAnchorElement>(null);
  const overviewTabRef = useRef<HTMLAnchorElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Format count to always display padded 2-digit number (e.g. 05) or double digits (12)
  const formattedCount = books.length < 10 ? `0${books.length}` : `${books.length}`;

  // Sliding indicator dot coordinate calculation
  const updateDotPosition = useCallback(() => {
    if (!listRef.current) return;
    const activeEl = activeTab === 'folio' ? folioTabRef.current : overviewTabRef.current;
    if (!activeEl) return;

    const listRect = listRef.current.getBoundingClientRect();
    const labelEl = activeEl.querySelector('.nav-link__label') || activeEl;
    const labelRect = labelEl.getBoundingClientRect();

    if (listRect.width === 0 || labelRect.width === 0) return;

    const coords = calculateNavDotCoords(labelRect, listRect, 5);
    setDotPos({ x: coords.x, y: coords.y, visible: true });
  }, [activeTab]);

  useEffect(() => {
    updateDotPosition();
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991);
      updateDotPosition();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    if ('fonts' in document) {
      document.fonts.ready.then(updateDotPosition);
    }
    // Microtask / RAF pass for initial CSS font measurement
    const rafId = requestAnimationFrame(updateDotPosition);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, [updateDotPosition]);

  // Click outside and global Escape key handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | globalThis.MouseEvent) => {
      if (isOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleDocKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        toggleBtnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleDocKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleDocKeyDown);
    };
  }, [isOpen]);

  // Monograph selection with out-of-bounds clamping
  const handleSelect = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(books.length - 1, idx));
      onSelectIndex(clamped);
      setIsOpen(false);
      setHoveredIdx(null);
      toggleBtnRef.current?.focus();
    },
    [books.length, onSelectIndex]
  );

  // Dropdown toggle
  const handleToggleDropdown = useCallback(() => {
    if (isModalOpen) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setFocusedIndex(activeIndex);
      setHoveredIdx(null);
      return next;
    });
  }, [isModalOpen, activeIndex]);

  // Direction-aware hover entry and exit tracking (matches A24 reference site)
  const handleItemPointerEnter = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>, idx: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const fromTop = e.clientY - rect.top < rect.height / 2;
      setHoverOrigins((prev) => ({
        ...prev,
        [idx]: fromTop ? '50% 0%' : '50% 100%'
      }));
      setHoveredIdx(idx);
    },
    []
  );

  const handleItemPointerLeave = useCallback(
    (e: React.PointerEvent<HTMLAnchorElement>, idx: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const toTop = e.clientY - rect.top < rect.height / 2;
      setHoverOrigins((prev) => ({
        ...prev,
        [idx]: toTop ? '50% 0%' : '50% 100%'
      }));
      setHoveredIdx(null);
    },
    []
  );

  // Keyboard navigation on toggle button
  const handleToggleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (isModalOpen) return;
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(activeIndex);
          setTimeout(() => itemRefs.current[activeIndex]?.focus(), 40);
        } else {
          setIsOpen(false);
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    },
    [isModalOpen, isOpen, activeIndex]
  );

  // Keyboard navigation inside dropdown list
  const handleItemKeyDown = useCallback(
    (e: KeyboardEvent<HTMLAnchorElement>, idx: number) => {
      if (isModalOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const next = Math.min(books.length - 1, idx + 1);
        setFocusedIndex(next);
        itemRefs.current[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (idx === 0) {
          toggleBtnRef.current?.focus();
        } else {
          const prev = Math.max(0, idx - 1);
          setFocusedIndex(prev);
          itemRefs.current[prev]?.focus();
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        e.stopPropagation();
        setFocusedIndex(0);
        itemRefs.current[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        e.stopPropagation();
        const last = books.length - 1;
        setFocusedIndex(last);
        itemRefs.current[last]?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleSelect(idx);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        toggleBtnRef.current?.focus();
      }
    },
    [isModalOpen, books.length, handleSelect]
  );

  return (
    <nav
      ref={navRef}
      data-theme-target="nav"
      data-menu-status={isOpen ? 'open' : 'closed'}
      className={`nav theme-dark ${className}`}
      data-navigation-init="true"
      id="mobile-navigation"
      aria-label="Main"
      data-nav-dropdown={isOpen ? 'open' : 'closed'}
    >
      <div className="nav-container">
        {/* Background expansion pill */}
        <div
          className="nav-bg"
          style={{
            visibility: isOpen ? 'visible' : 'hidden',
            pointerEvents: isOpen ? 'auto' : 'none',
            height: isOpen ? (isMobile ? 'min(24em, 65vh)' : '24em') : '0px'
          }}
        />

        <div className="nav-inner">
          <div className="nav-center">
            <ul className="nav-center__list" ref={listRef} role="menubar">
              {/* 1. Brand Logo */}
              <li role="none">
                <a
                  href="/"
                  aria-current="page"
                  className="nav-logo w-inline-block w--current group"
                  aria-label={`${brandTitle} home`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(0);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span className="nav-logo__dot w-2 h-2 rounded-full bg-[#891a20] shadow-[0_0_6px_rgba(137,26,32,0.6)]" />
                    <span className="font-heading tracking-[-0.04em] font-normal text-xs uppercase text-[#171c1c]">
                      {brandTitle}
                    </span>
                  </span>
                </a>
              </li>

              {/* 2. Loading State (hidden when idle) */}
              <li
                className="nav-loading-item"
                aria-live="polite"
                aria-hidden="true"
                style={{ visibility: 'visible', display: 'none' }}
              >
                <span className="nav-link nav-loading">
                  <span className="nav-link__label">Projecting</span>
                  <span className="nav-loading__spinner" aria-hidden="true" />
                </span>
              </li>

              {/* 3. Primary Nav Links: Folio & Overview */}
              <li role="none">
                <a
                  ref={folioTabRef}
                  href="#folio"
                  data-hover=""
                  aria-current={activeTab === 'folio' ? 'page' : undefined}
                  className="nav-link w-inline-block"
                  data-nav-page={activeTab === 'folio' ? 'current' : 'other'}
                  onClick={(e) => {
                    e.preventDefault();
                    setManualTab('folio');
                    onCloseSpread?.();
                  }}
                >
                  <span className="nav-link__label" data-hover-target="">
                    <span data-hover-inner="" data-text="Folio">
                      <span data-hover-text="">Folio</span>
                    </span>
                  </span>
                </a>
              </li>

              <li role="none">
                <a
                  ref={overviewTabRef}
                  href="#overview"
                  data-hover=""
                  aria-current={activeTab === 'overview' ? 'page' : undefined}
                  className="nav-link w-inline-block"
                  data-nav-page={activeTab === 'overview' ? 'current' : 'other'}
                  onClick={(e) => {
                    e.preventDefault();
                    setManualTab('overview');
                    onOpenSpread?.();
                  }}
                >
                  <span className="nav-link__label" data-hover-target="">
                    <span data-hover-inner="" data-text="Overview">
                      <span data-hover-text="">Overview</span>
                    </span>
                  </span>
                </a>
              </li>

              {/* 4. Dropdown Toggle Item */}
              <li role="none">
                <button
                  ref={toggleBtnRef}
                  type="button"
                  data-dropdown-toggle={isOpen ? 'open' : 'closed'}
                  className="nav-link cursor-pointer"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  aria-controls="navigation-dropdown-0"
                  onPointerEnter={() => setIsIndexHovered(true)}
                  onPointerLeave={() => setIsIndexHovered(false)}
                  onClick={handleToggleDropdown}
                  onKeyDown={handleToggleKeyDown}
                >
                  <span
                    className="nav-link__label"
                    data-nav-label=""
                    style={{
                      width: (isOpen || isIndexHovered) ? '18px' : '32px',
                      transition: 'width 0.46s cubic-bezier(0.32, 0.72, 0, 1)'
                    }}
                  >
                    <span
                      data-nav-label-track=""
                      className="relative block overflow-hidden h-[1.3em]"
                    >
                      <span
                        data-nav-label-item="word"
                        style={{
                          transform: (isOpen || isIndexHovered) ? 'translate(0, -130%)' : 'translate(0, 0)',
                          transition: 'transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)',
                          display: 'block'
                        }}
                      >
                        Index
                      </span>
                      <span
                        data-nav-label-item="count"
                        aria-hidden={!isOpen && !isIndexHovered}
                        style={{
                          transform: (isOpen || isIndexHovered) ? 'translate(0, 0)' : 'translate(0%, 130%)',
                          transition: 'transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)',
                          position: 'absolute',
                          inset: 0,
                          display: 'block'
                        }}
                        className="font-mono text-xs tabular-nums text-center"
                      >
                        {formattedCount}
                      </span>
                    </span>
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="10"
                    viewBox="0 0 17 10"
                    fill="none"
                    className="nav-link__dropdown-icon"
                    aria-hidden="true"
                  >
                    <path
                      d="M1.5 1.5L8.5 8.5L15.5 1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* 5. Dropdown Flyout Panel */}
                <div
                  className="nav-dropdown"
                  id="navigation-dropdown-0"
                  aria-hidden={!isOpen}
                >
                  <div className="nav-dropdown__overflow">
                    <div className="nav-dropdown__overflow-inner">
                      <div className="nav-dropdown__content" data-lenis-prevent="">
                        <div role="list" className="nav-dropdown__content-li">
                          {books.map((book, idx) => {
                            const isCurrent = idx === activeIndex;
                            const isHovered = hoveredIdx === idx;
                            const isFocused = focusedIndex === idx;
                            // Current index remains active when hovering other items (matching A24 reference site)
                            const isPillActive = isCurrent || isHovered || isFocused;
                            const origin = hoverOrigins[idx] || (isCurrent ? '50% 50%' : '50% 100%');

                            return (
                              <div role="listitem" key={book.id || idx}>
                                <a
                                  href={`#book-${book.id || idx}`}
                                  ref={(el) => {
                                    itemRefs.current[idx] = el;
                                  }}
                                  data-film-scroll={book.title}
                                  data-film-status={isCurrent ? 'active' : 'inactive'}
                                  data-book-status={isCurrent ? 'active' : 'inactive'}
                                  data-pill-active={isPillActive ? 'true' : 'false'}
                                  aria-current={isCurrent ? 'true' : undefined}
                                  tabIndex={isOpen ? 0 : -1}
                                  className="nav-dropdown__link"
                                  onPointerEnter={(e) => handleItemPointerEnter(e, idx)}
                                  onPointerLeave={(e) => handleItemPointerLeave(e, idx)}
                                  onFocus={() => setFocusedIndex(idx)}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleSelect(idx);
                                  }}
                                  onKeyDown={(e) => handleItemKeyDown(e, idx)}
                                >
                                  <div
                                    className="nav-dropdown__link-bg"
                                    aria-hidden="true"
                                    style={{
                                      transform: isPillActive ? 'scaleY(1)' : 'scaleY(0)',
                                      transformOrigin: origin,
                                      transition: 'transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)'
                                    }}
                                  />
                                  <div className="nav-dropdown__link-inner">
                                    <h2 className="nav-dropdown__link-label">{book.title}</h2>
                                    <span data-nav-year-mask="">
                                      <span
                                        className="nav-dropdown__link-label"
                                        style={{
                                          transform: isPillActive
                                            ? 'translate(0px, 0px)'
                                            : 'translate(0%, 125%)',
                                          transition: 'transform 0.26s cubic-bezier(0.32, 0.72, 0, 1)'
                                        }}
                                      >
                                        {book.year}
                                      </span>
                                    </span>
                                  </div>
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="nav-dropdown__scrollbar" aria-hidden="true">
                    <div
                      className="nav-dropdown__scrollbar-progress"
                      style={{
                        height: `${(1 / Math.max(1, books.length)) * 100}%`,
                        transform: `translate3d(0px, ${(activeIndex / Math.max(1, books.length - 1)) * 100}%, 0px)`,
                        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                      }}
                    />
                  </div>
                </div>
              </li>

              {/* 6. Sliding Page Indicator Dot */}
              <span
                className="nav-page-dot"
                aria-hidden="true"
                style={{
                  opacity: dotPos.visible ? 1 : 0,
                  transform: `matrix(1, 0, 0, 1, ${dotPos.x}, ${dotPos.y})`
                }}
              />
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
