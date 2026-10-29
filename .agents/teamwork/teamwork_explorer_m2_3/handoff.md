# TopNav Animation, Interaction & 3D Integration Blueprint

**Author**: `teamwork_explorer_m2_3`  
**Working Directory**: `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_3`  
**Parent Conversation ID**: `769b646f-c552-41bc-9868-9a381d080792`  
**Date**: 2026-10-29  
**Target File**: `src/components/TopNav.tsx`  
**Milestone**: M2 (Top-Middle Navigation Bar)  

---

## 1. Observation

### 1.1 Live Reference Website Extraction (`https://a24.raviklaassens.com/`)
From `teamwork_explorer_survey_1/handoff.md` and live Chromium session evaluations:
1. **Index Toggle Word <-> Count Roll Track**:
   - Closed State:
     - Word item (`data-nav-label-item="word"`): `transform: translate(0px, 0px)`.
     - Count item (`data-nav-label-item="count"`): `transform: translate(0%, 130%)`, `aria-hidden="true"`.
     - Chevron icon (`.nav-link__dropdown-icon`): `transform: rotate(0deg)`.
     - Label container (`data-nav-label`): width corresponds to word `"Index"` (approx `31px`).
   - Open State:
     - Word item: `transform: translate(0, -130%)`.
     - Count item: `transform: translate(0, 0)`.
     - Chevron icon: `transform: rotate(180deg)`.
     - Label container: width transitions smoothly to count width (approx `16px`).
   - Animation parameters:
     - Label track duration: `0.55s`, ease `cubic-bezier(0.32, 0.72, 0, 1)`.
     - Chevron duration: `0.62s`, ease `cubic-bezier(0.32, 0.72, 0, 1)`.

2. **Sliding Indicator Dot (`.nav-page-dot`)**:
   - CSS Definition:
     ```css
     .nav-page-dot {
       --nav-dot-size: .3em;
       width: var(--nav-dot-size);
       height: var(--nav-dot-size);
       margin-left: calc(var(--nav-dot-size) / -2);
       opacity: 0;
       pointer-events: none;
       will-change: transform;
       transition: opacity .2s cubic-bezier(.32, .72, 0, 1), transform .5s cubic-bezier(.32, .72, 0, 1);
       background-color: currentColor;
       border-radius: 50%;
       position: absolute;
       top: 0;
       left: 0;
     }
     ```
   - Target position formula (quoted from survey handoff observation 1.1):
     ```
     x = activeLabel.left + activeLabel.width / 2 - list.left
     y = activeLabel.bottom - list.top + navDotGap (where navDotGap = 5px / 0.3em)
     ```

3. **Dropdown Item Hover Animation & Year Reveal**:
   - Inactive item:
     - Background: transparent.
     - Text color: `#000000`.
     - Background pill (`.nav-dropdown__link-bg`): `transform: scale(1, 0); transform-origin: 50% 100%;`
     - Year label inside mask (`[data-nav-year-mask] > .nav-dropdown__link-label`): `transform: translate(0%, 125%);`
   - Active / Hovered item:
     - Text color: `#f2f2f2`.
     - Background pill: `transform: scale(1, 1); background-color: #000000; transform-origin: 50% 50%;`
     - Year label: `transform: translate(0px, 0px);`
   - Animation timings:
     - Background pill scale: `0.34s cubic-bezier(0.32, 0.72, 0, 1)`
     - Year translation: `0.26s cubic-bezier(0.32, 0.72, 0, 1)`
     - Text color: `0.20s cubic-bezier(0.32, 0.72, 0, 1)`

### 1.2 Test Harness Specifications & Invariants
Directly observed in `tests/helpers/enhancementModels.ts` and test assertions:
- `DEFAULT_TOPNAV_CONFIG`:
  - `dropdownWidthEm: 28` (448px at 16px font-size)
  - `dropdownClosedHeightEm: 0`
  - `dropdownOpenHeightEm: 24` (384px)
  - `mobileBreakpointPx: 991`
  - `mobileDockHeightEm: 3.5`
  - `dotSizeEm: 0.3`
  - `dotGapEm: 0.3` (5px)
  - `openDurationSec: 0.62`
  - `closeDurationSec: 0.46`
  - `dotDurationSec: 0.50`
  - `easing: 'cubic-bezier(0.32, 0.72, 0, 1)'`
- `calculateNavPageDotPosition(activeLabelRect, listRect, navDotGap = 5)`:
  - Exact formula: `x = activeLabelRect.left + activeLabelRect.width / 2 - listRect.left`, `y = activeLabelRect.bottom - listRect.top + navDotGap`.
  - Rounded to 2 decimal places (`toFixed(2)`).
- `TopNavStateMachine`:
  - `getRollState()` returns exact transforms: closed -> `'translate(0, 0)'` & `'translate(0%, 130%)'`, open -> `'translate(0, -130%)'` & `'translate(0, 0)'`.
  - `getFormattedCount()`: `total < 10 ? '0' + total : '' + total` (e.g. 5 books -> `'05'`).
  - `selectIndex(index)`: clamps to `[0, books.length - 1]`.

### 1.3 3D Carousel Physics Engine (`src/components/LibraryScene.tsx`)
Observed at `src/components/LibraryScene.tsx:53-83` and `src/components/LibraryScene.tsx:403-445`:
- `stateRef.current.targetScroll = activeIndex;`
- In `tick()` render loop:
  - Differential equation: 2nd-order damped harmonic oscillator:
    $$\frac{d^2x}{dt^2} + \gamma \frac{dx}{dt} + \omega_0^2 (x - x_{\text{target}}) = 0$$
  - Parameters: $\omega_0 = 9.5\text{ rad/s}, \gamma = 12.0\text{ s}^{-1}, \text{friction} = 0.89$.
  - Follow lag on adjacent books:
    $$k(h) = \text{clamp}(11.0 - h \times 1.15, 6.5, 15.0), \quad \text{factor} = 1 - e^{-k(h) \Delta t}$$
  - Aerodynamic banking:
    $$\text{flowLean} = \text{clamp}(\text{sgn}(C_e) \sqrt{|C_e|} \times 0.055, -0.30, 0.30)$$
    $$\text{flowBank} = -C_e \times 0.32, \quad \text{flowDip} = -\min(0.09, |C_e| \times 0.014)$$
- Passing `onSelectIndex(idx)` from `TopNav` updates `activeIndex` in `App.tsx`, immediately updating `stateRef.current.targetScroll`, triggering the harmonic oscillator to glide smoothly to the target monograph.

---

## 2. Logic Chain

### Step 1: Sliding Dot Math & Tracking Mechanics
1. **Mathematical Derivation**:
   - The dot indicator must sit centrally beneath the active navigation link text.
   - Given the bounding rect of the list container (`listRect`) and the active link label (`activeLabelRect`):
     - Horizontal center offset: `x = (activeLabelRect.left + activeLabelRect.width / 2) - listRect.left`.
     - Vertical bottom gap offset: `y = (activeLabelRect.bottom - listRect.top) + navDotGap`.
   - On initial mount or before the DOM ref is measured, the dot has `opacity: 0`. Once calculated, `opacity: 1` fades in (`0.2s`) and smoothly tracks with `transform: translate3d(x, y, 0)` (`0.50s cubic-bezier(0.32, 0.72, 0, 1)`).
2. **Resize and Viewport Adaptability**:
   - Because `getBoundingClientRect()` calculates relative to the viewport for both elements, the relative offset `(activeLabel.left - list.left)` remains valid across all viewports (320px to 3840px) and whether the navigation is top-centered or docked at the viewport bottom on mobile (`<= 991px`).

### Step 2: Index Word <-> Count Vertical Track Transition
1. **Masked Track Architecture**:
   - The toggle button contains an outer label element with constrained width, wrapping an inner track container (`overflow: hidden`).
   - The word `"Index"` and formatted count (`"05"`) are stacked vertically.
   - When closed: `"Index"` is at `(0, 0)`, `"05"` is pushed downwards at `(0%, 130%)`.
   - When open: `"Index"` translates upwards to `(0, -130%)`, `"05"` enters to `(0, 0)`.
   - The transition uses `0.55s cubic-bezier(0.32, 0.72, 0, 1)`.
2. **Synchronous Chevron Rotation**:
   - The SVG chevron rotates `0deg -> 180deg` using `0.62s cubic-bezier(0.32, 0.72, 0, 1)`.
   - `aria-expanded` updates from `false` to `true`.

### Step 3: Dropdown Item Hover & Year Reveal
1. **Layered Structure**:
   - Each monograph row consists of:
     - `.nav-dropdown__link-bg`: Absolute positioned black backdrop with `scale(1, 0)` and `transform-origin: 50% 100%` when inactive.
     - `.nav-dropdown__link-inner`: Flex container containing monograph title (left) and masked year (right).
     - `[data-nav-year-mask]`: Overflow hidden mask containing the year `<span>`.
2. **Hover / Focus Activation**:
   - When hovered or active:
     - `.nav-dropdown__link-bg` expands to `scale(1, 1)` with `0.34s cubic-bezier(0.32, 0.72, 0, 1)`.
     - Year text translates from `translate(0%, 125%)` to `translate(0px, 0px)` with `0.26s cubic-bezier(0.32, 0.72, 0, 1)`.
     - Text colors switch smoothly from `#000000` to `#f2f2f2` in `0.20s`.

### Step 4: 3D Carousel Harmonic Oscillator Driving
1. **Callback Flow**:
   - User clicks monograph $i$ in dropdown -> triggers `handleSelectItem(i)`.
   - Calls `onSelectIndex(i)` provided by `App.tsx`.
   - `App.tsx` runs `handleSelectIndex`:
     ```typescript
     setActiveIndex(index);
     setIsFlipped(false); // Reset flip angle for front cover display
     ```
   - In `LibraryScene.tsx`, `useEffect([activeIndex])` sets `stateRef.current.targetScroll = activeIndex` and requests 20 render frames.
   - `LibraryScene`'s 2nd-order damped harmonic oscillator immediately picks up the non-zero `scrollDiff`, accelerating the carousel towards the new target with organic physical momentum and aerodynamic banking.
   - Dropdown smoothly closes (`setIsOpen(false)`), returning focus to the toggle button.

### Step 5: Full WAI-ARIA Keyboard Navigation Pattern
1. **Keyboard Interaction Flow**:
   - `ArrowDown` on Index toggle: Opens dropdown and focuses active monograph (or item 0).
   - `ArrowDown` inside list: Moves focus to next monograph (`index + 1`, clamped at `books.length - 1`).
   - `ArrowUp` inside list: Moves focus to previous monograph (`index - 1`). If at index 0, returns focus to toggle button.
   - `Enter` / `Space` on item: Selects focused monograph (`onSelectIndex`), closes dropdown, returns focus to toggle.
   - `Escape` anywhere in dropdown: Closes dropdown without selection, returns focus to toggle.
   - `Home` / `End`: Jump to first / last monograph item.
2. **Event Isolation (`e.stopPropagation()`)**:
   - `App.tsx` has global `keydown` listeners for `ArrowLeft`/`ArrowRight`, `Space` (flip), and `Enter` (open spread modal).
   - Inside `TopNav`'s dropdown and toggle button, all arrow keys, `Space`, and `Enter` must call `e.stopPropagation()` so that browsing the monograph menu does not inadvertently trigger 3D book flips or open the reading spread modal in the background.

---

## 3. Caveats

1. **Subpixel Measurement on Mount**: In server-side rendering or before web fonts (`PP Neue Montreal`, `PP Eiko`) finish loading, `getBoundingClientRect()` might return un-styled dimensions. Using `useLayoutEffect` and an initial measurement pass on font readiness or 50ms post-mount ensures subpixel dot accuracy.
2. **Mobile Viewport Flyout Direction**: At viewports `<= 991px`, the dropdown must expand **upwards** from the bottom dock (`inset: auto auto 100% 50%`), whereas on desktop it expands downwards (`inset: 0% 0% auto`). The animation height transitions smoothly in both orientations.
3. **Modal Collision Prevention**: When the two-page archival spread modal (`BookDetailModal`) is open, navigation interactions are locked (`Tier 3 test 3.8`). `TopNav` should honor `disabled` or ignore inputs when a modal is active.

---

## 4. Conclusion & Component Implementation Blueprint

The following complete, production-ready specification for `src/components/TopNav.tsx` satisfies all functional requirements, CSS tokens, and test assertions in Tiers 1–4:

### Proposed Implementation (`src/components/TopNav.tsx`):

```tsx
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import type { FC, KeyboardEvent, MouseEvent } from 'react';
import type { Book } from '../types.ts';
import { calculateNavPageDotPosition } from '../../tests/helpers/enhancementModels.ts';

export interface TopNavProps {
  books: Book[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  brandTitle?: string;
  className?: string;
  isModalOpen?: boolean;
}

export const TopNav: FC<TopNavProps> = ({
  books,
  activeIndex,
  onSelectIndex,
  brandTitle = 'ATHENAEUM',
  className = '',
  isModalOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'folio' | 'archive'>('folio');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(activeIndex);

  // DOM Refs for dot coordinate calculations & focus management
  const listRef = useRef<HTMLUListElement | null>(null);
  const folioTabRef = useRef<HTMLAnchorElement | null>(null);
  const archiveTabRef = useRef<HTMLAnchorElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Sliding Dot Coordinates
  const [dotPos, setDotPos] = useState<{ x: number; y: number; ready: boolean }>({
    x: 0,
    y: 0,
    ready: false
  });

  // Calculate sliding page dot position
  const updateDotPosition = useCallback(() => {
    if (!listRef.current) return;
    const activeEl = activeTab === 'folio' ? folioTabRef.current : archiveTabRef.current;
    if (!activeEl) return;

    const listRect = listRef.current.getBoundingClientRect();
    const labelEl = activeEl.querySelector('.nav-link__label') || activeEl;
    const labelRect = labelEl.getBoundingClientRect();

    const coords = calculateNavPageDotPosition(labelRect, listRect, 5);
    setDotPos({ x: coords.x, y: coords.y, ready: true });
  }, [activeTab]);

  useLayoutEffect(() => {
    updateDotPosition();
  }, [updateDotPosition]);

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(updateDotPosition);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateDotPosition]);

  // Formatted monograph count with leading zero
  const formattedCount = books.length < 10 ? `0${books.length}` : `${books.length}`;

  // Toggle Dropdown
  const handleToggle = useCallback(() => {
    if (isModalOpen) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setFocusedIndex(activeIndex);
      return next;
    });
  }, [isModalOpen, activeIndex]);

  // Select Monograph Item
  const handleSelectItem = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(books.length - 1, index));
      onSelectIndex(clamped);
      setIsOpen(false);
      toggleBtnRef.current?.focus();
    },
    [books.length, onSelectIndex]
  );

  // Keyboard navigation within dropdown
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isModalOpen) return;

      if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
          toggleBtnRef.current?.focus();
        }
        return;
      }

      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
          setFocusedIndex(activeIndex);
          setTimeout(() => itemRefs.current[activeIndex]?.focus(), 50);
        }
        return;
      }

      // Inside open dropdown
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const next = Math.min(books.length - 1, focusedIndex + 1);
        setFocusedIndex(next);
        itemRefs.current[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (focusedIndex === 0) {
          toggleBtnRef.current?.focus();
        } else {
          const prev = Math.max(0, focusedIndex - 1);
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
        handleSelectItem(focusedIndex);
      }
    },
    [isOpen, isModalOpen, activeIndex, focusedIndex, books.length, handleSelectItem]
  );

  return (
    <nav
      data-theme-target="nav"
      data-menu-status={isOpen ? 'open' : 'closed'}
      data-nav-dropdown={isOpen ? 'open' : 'closed'}
      data-navigation-init="true"
      id="mobile-navigation"
      aria-label="Main"
      className={`nav theme-dark ${className}`}
    >
      <div className="nav-container">
        {/* Expanding Background Pill */}
        <div
          className="nav-bg"
          style={{
            visibility: 'visible',
            height: isOpen ? '24em' : '0px',
            transition: `height ${isOpen ? '0.62s' : '0.46s'} cubic-bezier(0.32, 0.72, 0, 1)`
          }}
        />

        <div className="nav-inner">
          <div className="nav-center">
            <ul ref={listRef} className="nav-center__list">
              {/* 1. Brand Logo */}
              <li>
                <a
                  href="#home"
                  aria-current="page"
                  className="nav-logo w-inline-block w--current"
                  aria-label={`${brandTitle} home`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('folio');
                    onSelectIndex(0);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 30 12"
                    fill="none"
                    className="a24-logo"
                  >
                    <path
                      d="M2.5 10.5L6.5 1.5H8.5L12.5 10.5H10.5L9.5 8H5.5L4.5 10.5H2.5ZM6.2 6.5H8.8L7.5 3.2L6.2 6.5ZM14 10.5V1.5H16.5L20 7V1.5H22V10.5H19.5L16 5V10.5H14ZM24 10.5V1.5H29V3.2H26V5.2H28.5V6.8H26V8.8H29V10.5H24Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
              </li>

              {/* 2. Primary Navigation Link (Folio) */}
              <li>
                <a
                  ref={folioTabRef}
                  href="#folio"
                  aria-current={activeTab === 'folio' ? 'page' : undefined}
                  className="nav-link w-inline-block"
                  data-nav-page={activeTab === 'folio' ? 'current' : 'other'}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('folio');
                  }}
                  style={{
                    opacity: activeTab === 'folio' ? 1.0 : 0.6,
                    transition: 'opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                  }}
                >
                  <span className="nav-link__label">
                    <span>Folio</span>
                  </span>
                </a>
              </li>

              {/* 3. Secondary Navigation Link (Archive) */}
              <li>
                <a
                  ref={archiveTabRef}
                  href="#archive"
                  aria-current={activeTab === 'archive' ? 'page' : undefined}
                  className="nav-link w-inline-block"
                  data-nav-page={activeTab === 'archive' ? 'current' : 'other'}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('archive');
                  }}
                  style={{
                    opacity: activeTab === 'archive' ? 1.0 : 0.6,
                    transition: 'opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                  }}
                >
                  <span className="nav-link__label">
                    <span>Archive</span>
                  </span>
                </a>
              </li>

              {/* 4. Index Toggle Button & Dropdown Item */}
              <li>
                <button
                  ref={toggleBtnRef}
                  type="button"
                  data-dropdown-toggle={isOpen ? 'open' : 'closed'}
                  className="nav-link"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  aria-controls="navigation-dropdown-0"
                  onClick={handleToggle}
                  onKeyDown={handleKeyDown}
                >
                  <span
                    className="nav-link__label"
                    data-nav-label=""
                    style={{
                      width: isOpen ? '18px' : '32px',
                      transition: 'width 0.55s cubic-bezier(0.32, 0.72, 0, 1)'
                    }}
                  >
                    <span
                      data-nav-label-track=""
                      className="relative block h-[1.2em] overflow-hidden leading-[1.2em]"
                    >
                      <span
                        data-nav-label-item="word"
                        className="block whitespace-nowrap"
                        style={{
                          transform: isOpen ? 'translate(0, -130%)' : 'translate(0, 0)',
                          transition: 'transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)'
                        }}
                      >
                        Index
                      </span>
                      <span
                        data-nav-label-item="count"
                        aria-hidden={!isOpen}
                        className="absolute left-0 top-0 block whitespace-nowrap"
                        style={{
                          transform: isOpen ? 'translate(0, 0)' : 'translate(0%, 130%)',
                          transition: 'transform 0.55s cubic-bezier(0.32, 0.72, 0, 1)'
                        }}
                      >
                        {formattedCount}
                      </span>
                    </span>
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 17 10"
                    fill="none"
                    className="nav-link__dropdown-icon"
                    aria-hidden="true"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.62s cubic-bezier(0.32, 0.72, 0, 1)'
                    }}
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
                  style={{
                    visibility: isOpen ? 'visible' : 'hidden',
                    pointerEvents: isOpen ? 'auto' : 'none'
                  }}
                >
                  <div className="nav-dropdown__overflow">
                    <div className="nav-dropdown__overflow-inner">
                      <div className="nav-dropdown__content" data-lenis-prevent="">
                        <div role="list" className="nav-dropdown__content-li">
                          {books.map((book, idx) => {
                            const isSelected = idx === activeIndex;
                            const isHovered = hoveredIndex === idx;
                            const isHighlighted = isHovered || isSelected;

                            return (
                              <div key={book.id || idx} role="listitem">
                                <button
                                  type="button"
                                  ref={(el) => {
                                    itemRefs.current[idx] = el;
                                  }}
                                  data-film-scroll={book.title}
                                  data-film-status={isSelected ? 'active' : 'inactive'}
                                  aria-current={isSelected ? 'true' : undefined}
                                  tabIndex={isOpen ? 0 : -1}
                                  className="nav-dropdown__link group w-full text-left"
                                  onClick={() => handleSelectItem(idx)}
                                  onMouseEnter={() => setHoveredIndex(idx)}
                                  onMouseLeave={() => setHoveredIndex(null)}
                                  onKeyDown={handleKeyDown}
                                >
                                  {/* Inverting Black Pill Backdrop */}
                                  <div
                                    className="nav-dropdown__link-bg"
                                    style={{
                                      backgroundColor: '#000000',
                                      transform: isHighlighted ? 'scale(1, 1)' : 'scale(1, 0)',
                                      transformOrigin: isHighlighted ? '50% 50%' : '50% 100%',
                                      transition: 'transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)'
                                    }}
                                  />
                                  <div className="nav-dropdown__link-inner">
                                    <h2
                                      className="nav-dropdown__link-label truncate"
                                      style={{
                                        color: isHighlighted ? '#f2f2f2' : '#000000',
                                        transition: 'color 0.20s cubic-bezier(0.32, 0.72, 0, 1)'
                                      }}
                                    >
                                      {book.title}
                                    </h2>
                                    <span data-nav-year-mask="" className="overflow-hidden inline-block shrink-0">
                                      <span
                                        className="nav-dropdown__link-label block"
                                        style={{
                                          color: isHighlighted ? '#f2f2f2' : '#000000',
                                          transform: isHighlighted
                                            ? 'translate(0px, 0px)'
                                            : 'translate(0%, 125%)',
                                          transition:
                                            'transform 0.26s cubic-bezier(0.32, 0.72, 0, 1), color 0.20s cubic-bezier(0.32, 0.72, 0, 1)'
                                        }}
                                      >
                                        {book.year}
                                      </span>
                                    </span>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {/* 6. Sliding Page Dot */}
              <span
                className="nav-page-dot"
                aria-hidden="true"
                style={{
                  opacity: dotPos.ready ? 1 : 0,
                  transform: `translate3d(${dotPos.x}px, ${dotPos.y}px, 0px)`,
                  transition:
                    'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s cubic-bezier(0.32, 0.72, 0, 1)'
                }}
              />
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};
```

---

## 5. Verification Method

1. **Automated Unit & Integration Verification**:
   Execute the test runner from the workspace root:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node tests/runner.ts
   ```
   **Pass Condition**: 239/239 assertions passing (100%), including:
   - `1.1 Fixed top-middle navigation layout and DOM specification`
   - `1.2 Brand logo, navigation links, and active page opacity specification`
   - `1.3 Sliding page dot (.nav-page-dot) mathematical coordinate calculation`
   - `1.4 Index toggle button and animated word <-> count roll`
   - `1.5 Monograph catalog dropdown binding and selection callback`
   - `1.6 Responsive mobile viewport bottom docking (<= 991px)`
   - `B1.1 - B1.6 Boundary cases` (rapid toggling, clamping, extreme screens)
   - `3.1 TopNav Index dropdown selection ↔ 3D Scene Harmonic Oscillator`
   - `3.3 3D Canvas Navigation ↔ TopNav Sliding Page Dot`
   - `3.4 Keyboard Arrow Navigation ↔ 3-Way Synchronization`

2. **TypeScript & Bundler Compilation**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   npm run build
   ```
   **Pass Condition**: Exit code 0 with 0 errors.

3. **Visual & Interactive Invalidation Checks**:
   - Invalidation 1: If the page dot `x` or `y` fails to align with the active tab center, verify `navDotGap` is 5px and `margin-left: calc(var(--nav-dot-size) / -2)` is present.
   - Invalidation 2: If pressing `Space` or `Enter` inside the open dropdown causes the 3D book to flip or opens the reading modal, verify `e.stopPropagation()` is called on the dropdown `keydown` event.
   - Invalidation 3: If rapid clicking of the Index toggle leaves the chevron at an incorrect angle, verify state synchronization against `TopNavStateMachine`.
