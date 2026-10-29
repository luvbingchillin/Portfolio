# M1 Technical Plan: Base UI Controls, Badges, Buttons, Preloader & Modal Theming

**Agent**: `teamwork_explorer_m1_3`  
**Date**: 2026-10-29  
**Milestone**: M1 (White Background & Visual Harmony — Feature F3)  
**Parent Conv ID**: `769b646f-c552-41bc-9868-9a381d080792`  
**Status**: COMPLETE (Hard Handoff)

---

## 1. Observation

Direct examination of `src/components/Preloader.tsx`, `src/components/BookDetailModal.tsx`, `src/components/LibraryUI.tsx`, `src/index.css`, and related test suites reveals the following exact baseline implementations and invariants:

### 1.1 `src/components/Preloader.tsx` Current Styling & Invariants
- **File**: `C:\Users\kangy\Desktop\Portfolio\src\components\Preloader.tsx` (lines 144-367)
- **Root Element**:
  - Line 146: `<aside role="status" aria-live="polite" aria-label="Application preloader and boot sequence"`
  - Line 157: `backgroundColor: '#171c1c'`
  - Line 158: `color: '#f2f2f2'`
- **Vignette Background**:
  - Line 173: `background: 'radial-gradient(circle at center, rgba(49,56,59,0.3) 0%, rgba(23,28,28,0.85) 60%, #171c1c 100%)'`
- **Header Eyebrow**:
  - Line 185: `borderBottom: '1px solid rgba(49, 56, 59, 0.5)'`
  - Line 195: crimson status dot `backgroundColor: '#891a20'`
  - Line 206: title `color: '#d6d3d1'`
  - Line 217: telemetry `color: '#8c8c8c'`
- **Central Odometer Housing**:
  - Line 246: `border: '1px solid rgba(212, 175, 55, 0.3)'`
  - Line 247: `backgroundColor: 'rgba(23, 28, 28, 0.95)'`
  - Line 248: `boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'`
  - Line 261, 270, 276, 279: digits `color: '#f2f2f2'`
  - Line 287: `%` symbol `color: '#d4af37'`
- **Progress Track**:
  - Line 302: `backgroundColor: 'rgba(49, 56, 59, 0.8)'`
  - Line 312: `background: 'linear-gradient(90deg, #891a20 0%, #d4af37 100%)'`
- **Beat Title & Telemetry**:
  - Line 324: `color: '#f2f2f2'`
  - Line 337: `color: '#a89682'`
- **Footer**:
  - Line 353: `borderTop: '1px solid rgba(49, 56, 59, 0.5)'`
  - Line 358: `color: '#8c8c8c'`
  - Line 362: `color: currentProgress >= 100 ? '#d4af37' : '#8c8c8c'`

### 1.2 `src/components/BookDetailModal.tsx` Current Styling & Invariants
- **File**: `C:\Users\kangy\Desktop\Portfolio\src\components\BookDetailModal.tsx` (lines 24-166)
- **Container & Backdrop**:
  - Line 24: `<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">`
  - Line 26: `<div className="absolute inset-0" onClick={onClose} />`
  - Line 29: `<div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl bg-[#171c1c] text-[#f2f2f2] border border-[#31383b] flex flex-col md:flex-row">`
- **Close Button**:
  - Line 34: `bg-[#1f2527] hover:bg-[#31383b] text-[#f2f2f2] border border-[#31383b]`
- **Left Page**:
  - Line 41: `flex-1 p-8 sm:p-12 border-b md:border-b-0 md:border-r border-[#31383b] relative`
  - Line 44: folio stamp `text-[10px] uppercase font-eyebrow tracking-[0.20em] text-[#d6d3d1] mb-6 flex justify-between items-center border-b border-[#31383b] pb-2.5`
  - Line 50: category tag `bg-[#1f2527] text-[#f2f2f2] border border-[#31383b]`
  - Line 54: `<BalancedText as="h2" lines={2} reserveLines={2} className="text-3xl sm:text-4xl font-heading font-normal text-[#f2f2f2] leading-[1.08] tracking-[-0.04em]">{book.title}</BalancedText>`
  - Line 63: subtitle `text-[#d6d3d1] border-l-2 border-[#891a20] pl-3 py-0.5`
  - Line 68-73: drop-cap synopsis:
    - Line 68: body text `text-[#d6d3d1]`
    - Line 69: drop cap `float-left text-5xl font-heading font-normal text-[#f2f2f2] leading-none pr-3 pt-0.5` with `{book.fullSynopsis.charAt(0)}`
    - Line 72: `{book.fullSynopsis.slice(1)}`
  - Line 78: metrics card `p-3 rounded-sm bg-[#1f2527] border border-[#31383b]`
  - Line 79: metric label `text-[#d6d3d1]`
  - Line 80: metric value `text-[#f2f2f2]`
- **Right Page**:
  - Line 88: `flex-1 p-8 sm:p-12 bg-[#171c1c] flex flex-col justify-between`
  - Line 90: folio header `text-[#d6d3d1] border-[#31383b]`
  - Line 97, 113: section headings `text-[#f2f2f2]` with crimson icons `<Award className="... text-[#891a20]" />` and `<Layers className="... text-[#891a20]" />`
  - Line 103: feature list text `text-[#d6d3d1]` with `<span className="text-[#891a20] font-mono mt-0.5">—</span>`
  - Line 121: tech badges `bg-[#1f2527] text-[#f2f2f2] border border-[#31383b]`
  - Line 132: curator text `text-[#d6d3d1]` and name `text-[#f2f2f2]`
  - Line 142: GitHub button `bg-[#1f2527] text-[#f2f2f2] border border-[#31383b]`
  - Line 153: Live button `bg-[#f2f2f2] text-[#000000]`

### 1.3 `src/components/LibraryUI.tsx` Current Styling & Invariants
- **File**: `C:\Users\kangy\Desktop\Portfolio\src\components\LibraryUI.tsx` (lines 70-256)
- **Top Masthead**:
  - Line 70: `border-b border-[#31383b]/60 pb-3.5 backdrop-blur-md bg-[#171c1c]/60 px-5 py-3 rounded-sm`
  - Line 75: `text-[#f2f2f2]`
  - Line 78, 85: `text-[#d6d3d1]`
  - Line 98: `text-xs font-mono tracking-widest text-[#f2f2f2] bg-[#1f2527] px-3 py-1 rounded-sm border border-[#31383b]`
- **Bottom-Left Aside Catalog Card**:
  - Line 106: `bg-[#171c1c]/90 backdrop-blur-md p-6 rounded-sm border border-[#31383b] shadow-2xl text-[#f2f2f2] space-y-4`
  - Line 109: `text-[#d6d3d1] border-b border-[#31383b]`
  - Line 116: category tag `bg-[#1f2527] text-[#f2f2f2] border border-[#31383b]`
  - Line 123: title `<BalancedText as="h2" lines={2} reserveLines={2} className="... text-[#f2f2f2] ...">`
  - Line 127: subtitle `text-[#d6d3d1]`
  - Line 134: short description `data-reserve-lines="3"` and `text-[#d6d3d1]`
  - Line 145: tech tags `bg-[#1f2527] text-[#d6d3d1] border border-[#31383b]`
  - Line 156: Open Folio button `bg-[#f2f2f2] text-[#000000]`
  - Line 164: Flip Spine button `bg-[#171c1c] text-[#f2f2f2] border border-[#31383b]`
  - Line 175: GitHub button `bg-[#171c1c] text-[#d6d3d1] border border-[#31383b]`
- **Bottom Shelf Navigation Controls & Footer**:
  - Line 186: `border-t border-[#31383b]/60 pt-3.5 backdrop-blur-md bg-[#171c1c]/60 px-5 py-3 rounded-sm`
  - Line 193, 219: Chevrons `bg-[#171c1c] border border-[#31383b] text-[#f2f2f2] hover:border-[#891a20] hover:bg-[#1f2527] disabled:opacity-20`
  - Lines 206-209: Numeric jump buttons:
    - Active: `bg-[#f2f2f2] text-[#000000] font-bold shadow-sm`
    - Inactive: `bg-[#171c1c] text-[#d6d3d1] hover:text-white hover:bg-[#1f2527] border border-[#31383b]`
  - Line 226: Progress track `bg-[#31383b]`, fill `bg-[#891a20]`
  - Lines 235-248: Keycap `<kbd>` badges `px-1.5 py-0.5 rounded-sm bg-[#171c1c] border border-[#31383b] text-[#f2f2f2]` and label text `text-[#d6d3d1]`

### 1.4 Test Suite Invariants Verified Across Files
- **`tests/tier1-features/f4-editorial-ui.test.ts`**:
  - Asserts catalog fields: `id`, `title`, `subtitle`, `callNumber`, `category`, `coverColor`.
  - Asserts `techStack` length $\ge 3$.
  - Asserts `metrics` length 3, with `label` and `value`.
  - Asserts drop-cap extraction contract: `fullSynopsis.charAt(0)` is single character matching `/[A-Z]/`.
- **`tests/tier2-boundary/f4-editorial-ui-boundary.test.ts`**:
  - Asserts Previous button disabled at `activeIndex === 0`.
  - Asserts Next button disabled at `activeIndex === BOOKS_CATALOG.length - 1`.
  - Asserts missing optional `githubUrl` / `liveUrl` handled safely.
  - Asserts empty `keyFeatures` handled safely.
- **`tests/tier5-adversarial/tier5-ui-preloader.test.ts`**:
  - T5.1-T5.10: Odometer 20-digit translation math, rollover at 09->10 and 99->100, hundreds visible only when `val >= 100`, progress monotonicity, minimum 2.85s duration, single callback fire.
  - T5.19: Clamping `[0, N - 1]`, resetting `isFlipped` to false on index change.
  - T5.20: Keyboard isolation (preloader blocks keys, modal blocks shelf navigation, Escape closes modal).
  - T5.23: Modal backdrop click vs content click propagation isolation (`onClick={onClose}` on sibling backdrop).
- **`tests/stress-challenger-m1.ts`**:
  - Suite 2: Line reservation contracts `[data-reserve-lines="3"]` on description, `reserveLines={2}` on title `<BalancedText>`.

---

## 2. Logic Chain

```
[Observation 1.1 - 1.3: Hardcoded Dark Palettes]
Preloader, BookDetailModal, and LibraryUI currently use #171c1c (background) and #f2f2f2 / #d6d3d1 (text).
       │
       ▼
[Contrast Failure on Pure White #ffffff]
Light text (#f2f2f2 on #ffffff has 1.05:1 contrast; #d6d3d1 on #ffffff has 1.35:1 contrast).
Both are completely unreadable and violate WCAG 2.1 AA (4.5:1) and AAA (7:1).
       │
       ▼
[Systematic Color Inversion Formulation]
- Headings & Primary Digits: Invert to #171c1c (17.5:1 contrast against #ffffff, WCAG AAA compliant).
- Body & Synopses: Invert to #292524 (Stone 800) / #44403c (Stone 700) (> 8.7:1 contrast, AAA).
- Metadata & Labels: Invert to #57534e (Stone 600) (6.1:1 contrast, AA compliant).
- Brand Accent: Retain A24 Blood Crimson #891a20 (9.2:1 contrast against #ffffff, AAA).
- Foil Accent: Retain/darken Gold Foil to #a17a15 for text telemetry (4.54:1 contrast, AA compliant).
       │
       ▼
[Observation 1.4: Handcrafted CSS Architecture in src/index.css]
There is no Tailwind PostCSS/JIT plugin; styles live directly in src/index.css.
       │
       ▼
(Any new utility classes used in JSX — such as .bg-white/90, .bg-neutral-100, .border-black/10,
.text-[#171c1c], .text-[#57534e] — MUST be explicitly defined in src/index.css to avoid unstyled fallbacks)
       │
       ▼
[Test Invariants Preservation]
Every tested property (data-reserve-lines="3", reserveLines={2}, drop-cap char extraction,
metric mapping, disabled states, backdrop sibling structure) is mapped 1:1 into the new JSX.
```

---

## 3. Caveats

1. **CSS Utility Availability**:
   - Because `src/index.css` is handcrafted, any utility class referenced in JSX must exist in `src/index.css`. Section 4.4 lists the exact CSS declarations that must be added to `src/index.css`.
2. **Backdrop Scrim Density**:
   - For `BookDetailModal.tsx`, pitch-black `bg-black/85` obscures the 3D scene completely. Shifting to `bg-black/40 backdrop-blur-md` provides visual focus on the archival spread while allowing the ambient white library behind it to glow softly.
3. **M1 vs M2/M3 Scope**:
   - M1 focuses on white background harmony and base UI styling. M2 introduces `TopNav.tsx` (replacing the masthead), and M3 introduces `EditorialInfoSection.tsx` (replacing the aside card). The modifications to `LibraryUI.tsx` in M1 provide an immediately clean, harmonious UI that seamlessly transitions into M2 and M3.

---

## 4. Conclusion & Exact Code Changes

### 4.1 Plan for `src/components/Preloader.tsx`

#### Visual Design:
- Root container: White background (`#ffffff`), dark primary text (`#171c1c`).
- Architectural vignette: Invert from dark eerie black to soft paper vignette:
  `radial-gradient(circle at center, rgba(255,255,255,1) 40%, rgba(245,245,244,0.85) 80%, #eae7e4 100%)`.
- Header: Subtle divider `rgba(0, 0, 0, 0.08)`, title `#171c1c`, status `#57534e`.
- Odometer Housing: Clean frosted white card `rgba(255, 255, 255, 0.96)`, subtle gold border `rgba(212, 175, 55, 0.45)`, soft elevation shadow `0 20px 40px -15px rgba(0, 0, 0, 0.08)`.
- Digits: High-contrast `#171c1c` numerals with `#a17a15` gold `%` glyph.
- Progress Bar: Soft grey track `rgba(0, 0, 0, 0.08)`, crimson-to-gold gradient fill `linear-gradient(90deg, #891a20 0%, #a17a15 100%)`.
- Telemetry & Beat: Title `#171c1c`, telemetry `#57534e`.
- Footer: Divider `rgba(0, 0, 0, 0.08)`, text `#57534e`, launch status `#891a20`.

#### Exact Code Proposal for `Preloader.tsx` (lines 145-367):
```tsx
    <aside
      role="status"
      aria-live="polite"
      aria-label="Application preloader and boot sequence"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.5rem',
        backgroundColor: '#ffffff',
        color: '#171c1c',
        userSelect: 'none',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.03)' : 'scale(1)',
        pointerEvents: isExiting ? 'none' : 'auto',
        transition: `opacity ${revealDurationMs}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${revealDurationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`
      }}
    >
      {/* Background Architectural Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.7,
          background: 'radial-gradient(circle at center, rgba(255,255,255,1) 40%, rgba(245,245,244,0.85) 80%, #eae7e4 100%)'
        }}
      />

      {/* Top Header Eyebrow Metadata */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          paddingBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '9999px',
              backgroundColor: '#891a20',
              display: 'inline-block',
              boxShadow: '0 0 8px rgba(137, 26, 32, 0.4)'
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#171c1c'
            }}
          >
            ATHENAEUM ARCHIVES // BOOT SEQUENCE
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: '#57534e'
          }}
        >
          REV. 2026.10 // 60 FPS LOCKED
        </div>
      </header>

      {/* Central Odometer Counter & Telemetry */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          margin: 'auto 0'
        }}
      >
        {/* Odometer Digit Display Housing */}
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem 2rem',
            borderRadius: '4px',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(212, 175, 55, 0.15)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Odometer Numbers */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              fontFamily: 'var(--font-mono)',
              fontSize: '4.5rem',
              fontWeight: 700,
              lineHeight: 1,
              color: '#171c1c',
              letterSpacing: '0.04em'
            }}
          >
            {/* Hundreds digit (appears when >= 100) */}
            <span
              style={{
                display: hundreds > 0 ? 'inline-block' : 'none',
                color: '#171c1c'
              }}
            >
              {hundreds}
            </span>
            {/* Tens digit */}
            <span style={{ display: 'inline-block', color: '#171c1c' }}>
              {tens}
            </span>
            {/* Ones digit */}
            <span style={{ display: 'inline-block', color: '#171c1c' }}>
              {ones}
            </span>
            {/* Percentage Symbol */}
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.75rem',
                color: '#a17a15',
                marginLeft: '0.5rem',
                letterSpacing: '0.1em'
              }}
            >
              %
            </span>
          </div>
        </div>

        {/* Minimal Progress Hairline Bar */}
        <div
          style={{
            width: '18rem',
            height: '3px',
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            marginTop: '1.5rem',
            borderRadius: '9999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${currentProgress}%`,
              background: 'linear-gradient(90deg, #891a20 0%, #a17a15 100%)',
              transition: 'width 0.12s linear'
            }}
          />
        </div>

        {/* Beat Title & Telemetry */}
        <div style={{ marginTop: '1.5rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              color: '#171c1c',
              letterSpacing: '-0.02em',
              marginBottom: '0.25rem'
            }}
          >
            {activeBeat.name}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#57534e'
            }}
          >
            {activeBeat.telemetry}
          </p>
        </div>
      </main>

      {/* Footer System Telemetry */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          paddingTop: '1rem',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.2em',
          color: '#57534e'
        }}
      >
        <span>STAGE 0{activeBeat.beat} / 04</span>
        <span style={{ textTransform: 'uppercase', color: currentProgress >= 100 ? '#891a20' : '#57534e' }}>
          {currentProgress >= 100 ? 'PIPELINE PRIMED // LAUNCHING' : 'CALIBRATING WebGL2'}
        </span>
      </footer>
    </aside>
```

---

### 4.2 Plan for `src/components/BookDetailModal.tsx`

#### Visual Design:
- Backdrop: Soft focus scrim `bg-black/40 backdrop-blur-md` allowing the ambient white library to show through softly.
- Modal shell: Clean white archival folio `bg-white text-[#171c1c] border border-black/10 shadow-2xl`.
- Close button: Clean white card `bg-white hover:bg-neutral-100 text-[#171c1c] border border-black/10 shadow-sm`.
- Left page: Archival metadata in Stone 600 `text-[#57534e]`, category pill `bg-neutral-100 text-[#171c1c] border border-black/10`, title in display serif `text-[#171c1c]`, subtitle in Stone 600 with crimson left accent rule `border-l-2 border-[#891a20]`.
- Illuminated Drop-Cap: Dark drop cap `text-[#171c1c]`, synopsis text `text-[#292524]`.
- Metrics: Frosted light cards `bg-neutral-50 border border-black/10`, label in `text-[#57534e]`, value in `text-[#171c1c]`.
- Right page: Clean white background `bg-white`, section titles in `text-[#171c1c]` with crimson icons, feature text in `text-[#292524]` with crimson dashes, tech tags in `bg-neutral-100 text-[#171c1c] border border-black/10`.
- Buttons: GitHub in `bg-neutral-100 text-[#171c1c] border border-black/10 hover:border-[#891a20] hover:text-[#891a20]`, Live System in `bg-[#171c1c] text-white hover:bg-black shadow-sm`.

#### Exact Code Proposal for `BookDetailModal.tsx` (lines 24-164):
```tsx
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
```

---

### 4.3 Plan for `src/components/LibraryUI.tsx`

#### Visual Design:
- Top bar: Frosted white pill `bg-white/80 border-b border-black/10 shadow-sm`, title `text-[#171c1c]`, subtitle `text-[#57534e]`, index badge `bg-neutral-100 text-[#171c1c] border-black/10`.
- Aside card: Frosted white container `bg-white/90 border border-black/10 shadow-xl text-[#171c1c]`, category badge `bg-neutral-100 text-[#171c1c]`, title in `text-[#171c1c]`, description `text-[#44403c]`, tech stack tags `bg-neutral-100 text-[#44403c]`.
- Bottom shelf footer: Frosted card `bg-white/80 border-t border-black/10 shadow-sm`.
- Chevrons: `bg-white border border-black/10 text-[#171c1c] hover:border-[#891a20] hover:text-[#891a20] shadow-sm`.
- Jump numbers: Active `bg-[#171c1c] text-white font-bold`, Inactive `bg-white text-[#57534e] hover:text-[#171c1c] hover:bg-neutral-100 border border-black/10`.
- Continuous Progress track: Light track `bg-black/10`, bar `bg-[#891a20]`.
- Keyboard badges: `<kbd>` in `bg-white border border-black/15 text-[#171c1c] shadow-xs`, hints in `text-[#57534e]`.

#### Exact Code Proposal for `LibraryUI.tsx` (lines 70-256):
```tsx
      {/* 1. TOP BAR: A24 Editorial Masthead & Reading Chronometer */}
      <header className="flex items-center justify-between pointer-events-auto border-b border-black/10 pb-3.5 backdrop-blur-md bg-white/80 px-5 py-3 rounded-sm shadow-sm">
        {/* Brand / Publication Title */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#891a20] shadow-[0_0_8px_rgba(137,26,32,0.6)]" />
          <div>
            <h1 className="text-sm font-heading tracking-[-0.04em] text-[#171c1c] uppercase font-normal">
              The Athenaeum
            </h1>
            <p className="text-[10px] font-eyebrow tracking-[0.20em] text-[#57534e] uppercase">
              Monograph Series // Vol. 2026
            </p>
          </div>
        </div>

        {/* Center Wing / Reading Status Indicator */}
        <div className="hidden md:flex items-center gap-6 text-[11px] font-eyebrow tracking-[0.20em] text-[#57534e]">
          <span className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#166534]" />
            COLLECTION 01 • COMPUTATIONAL SYSTEMS
          </span>
          <span className="text-black/20">|</span>
          <span className="tabular-nums font-body text-[#171c1c] font-medium tracking-normal text-xs">
            UTC {currentTime || '12:00:00'}
          </span>
        </div>

        {/* Right Publication Numbering */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-widest text-[#171c1c] bg-neutral-100 px-3 py-1 rounded-sm border border-black/10">
            INDEX [{formatIndex(activeIndex)} / {formatIndex(books.length - 1)}]
          </span>
        </div>
      </header>

      {/* 2. MIDDLE SECTION: A24 Editorial Catalog Card (Bottom-Left) */}
      <div className="flex items-end justify-between pointer-events-none my-auto">
        <aside className="pointer-events-auto max-w-sm sm:max-w-md bg-white/90 backdrop-blur-md p-6 rounded-sm border border-black/10 shadow-xl text-[#171c1c] space-y-4">
          
          {/* Metadata Bar */}
          <div className="flex items-center justify-between text-[10px] font-eyebrow tracking-[0.20em] text-[#57534e] border-b border-black/10 pb-2.5">
            <span>{activeBook.callNumber}</span>
            <span>{activeBook.stackShelf}</span>
          </div>

          {/* Title & Category */}
          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-sm text-[10px] font-eyebrow tracking-[0.20em] bg-neutral-100 text-[#171c1c] border border-black/10">
              {activeBook.category.toUpperCase()}
            </span>
            <BalancedText
              as="h2"
              lines={2}
              reserveLines={2}
              className="text-2xl sm:text-3xl font-heading font-normal text-[#171c1c] tracking-[-0.04em] leading-[1.08]"
            >
              {activeBook.title}
            </BalancedText>
            <p className="text-sm font-body text-[#57534e] tracking-[-0.025em]">
              “{activeBook.subtitle}”
            </p>
          </div>

          {/* Synopsis */}
          <p
            className="text-xs sm:text-[13px] font-body leading-[1.5] text-[#44403c] tracking-[-0.025em]"
            data-reserve-lines="3"
          >
            {activeBook.shortDescription}
          </p>

          {/* Applied Technologies */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeBook.techStack.map((tech, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-sm text-[10px] font-mono tracking-wider bg-neutral-100 text-[#44403c] border border-black/10"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenSpread}
              className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono font-medium bg-[#171c1c] text-white hover:bg-black transition-all shadow-md cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Open Folio [Enter]
            </button>

            <button
              onClick={onToggleFlip}
              className="flex items-center gap-2 px-3.5 py-2 rounded-sm text-xs font-mono bg-white text-[#171c1c] border border-black/10 hover:border-[#891a20] hover:text-[#891a20] transition-colors cursor-pointer shadow-sm"
            >
              <RotateCw className={`w-3.5 h-3.5 transition-transform duration-300 ${isFlipped ? 'rotate-180 text-[#891a20]' : ''}`} />
              {isFlipped ? 'Show Front' : 'Flip Spine [Space]'}
            </button>

            {activeBook.githubUrl && (
              <a
                href={activeBook.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-sm bg-white text-[#57534e] border border-black/10 hover:border-[#171c1c] hover:text-[#171c1c] transition-colors shadow-sm"
                title="View Source on GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM BAR: Shelf Navigation & Keyboard Controls */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto border-t border-black/10 pt-3.5 backdrop-blur-md bg-white/80 px-5 py-3 rounded-sm shadow-sm">
        
        {/* Navigation Chevrons, Numeric Selector & Continuous Progress Track */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="p-2 rounded-sm bg-white border border-black/10 text-[#171c1c] hover:border-[#891a20] hover:text-[#891a20] hover:bg-neutral-50 disabled:opacity-20 transition-colors cursor-pointer shadow-sm"
            title="Previous Tome (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Minimalist Two-Digit Jump Links */}
          <div className="flex items-center gap-1.5">
            {books.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSelectIndex(idx)}
                className={`w-7 h-7 rounded-sm text-xs font-mono transition-all cursor-pointer ${
                  idx === activeIndex
                    ? 'bg-[#171c1c] text-white font-bold shadow-sm'
                    : 'bg-white text-[#57534e] hover:text-[#171c1c] hover:bg-neutral-100 border border-black/10'
                }`}
              >
                {formatIndex(idx)}
              </button>
            ))}
          </div>

          <button
            onClick={() => onSelectIndex(Math.min(books.length - 1, activeIndex + 1))}
            disabled={activeIndex === books.length - 1}
            className="p-2 rounded-sm bg-white border border-black/10 text-[#171c1c] hover:border-[#891a20] hover:text-[#891a20] hover:bg-neutral-50 disabled:opacity-20 transition-colors cursor-pointer shadow-sm"
            title="Next Tome (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Continuous Progress Indicator */}
          <div className="hidden sm:block ml-2 w-20 h-1 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#891a20] transition-all duration-300"
              style={{ width: `${progressRatio}%` }}
            />
          </div>
        </div>

        {/* Minimalist Keycap Badges */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono text-[#57534e]">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded-sm bg-white border border-black/15 text-[#171c1c] shadow-xs">←</kbd>
            <kbd className="px-1.5 py-0.5 rounded-sm bg-white border border-black/15 text-[#171c1c] shadow-xs">→</kbd>
            Browse
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 rounded-sm bg-white border border-black/15 text-[#171c1c] shadow-xs">Space</kbd>
            Flip Spine
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 rounded-sm bg-white border border-black/15 text-[#171c1c] shadow-xs">Enter</kbd>
            Open Folio
          </span>
          <span className="flex items-center gap-1.5 text-[#57534e]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#891a20]" />
            Drag / Scroll Shelf
          </span>
        </div>

      </footer>
```

---

### 4.4 Companion CSS Declarations for `src/index.css`

To ensure full rendering across all browsers without an active Tailwind CLI compiler, the following utility classes should be declared in `src/index.css`:

```css
/* ==========================================================================
 * Milestone 1 Light Theme Companion Utilities
 * ========================================================================== */

/* Backgrounds */
.bg-white\/90 { background-color: rgba(255, 255, 255, 0.9); }
.bg-white\/80 { background-color: rgba(255, 255, 255, 0.8); }
.bg-neutral-50 { background-color: #fafaf9; }
.bg-neutral-100 { background-color: #f5f5f4; }
.bg-black\/10 { background-color: rgba(0, 0, 0, 0.1); }
.bg-black\/40 { background-color: rgba(0, 0, 0, 0.4); }
.bg-black\/50 { background-color: rgba(0, 0, 0, 0.5); }
.bg-\[\#166534\] { background-color: #166534; }
.bg-\[\#fafaf9\]\/50 { background-color: rgba(250, 250, 249, 0.5); }

/* Typography Colors */
.text-\[\#171c1c\] { color: #171c1c; }
.text-\[\#57534e\] { color: #57534e; }
.text-\[\#44403c\] { color: #44403c; }
.text-\[\#292524\] { color: #292524; }
.text-black\/20 { color: rgba(0, 0, 0, 0.2); }

/* Borders */
.border-black\/10 { border-color: rgba(0, 0, 0, 0.1); }
.border-black\/15 { border-color: rgba(0, 0, 0, 0.15); }

/* Interactive Hover States */
.hover\:bg-neutral-50:hover { background-color: #fafaf9; }
.hover\:bg-neutral-100:hover { background-color: #f5f5f4; }
.hover\:bg-black:hover { background-color: #000000; }
.hover\:border-black\/20:hover { border-color: rgba(0, 0, 0, 0.2); }
.hover\:border-\[\#171c1c\]:hover { border-color: #171c1c; }
.hover\:text-\[\#171c1c\]:hover { color: #171c1c; }
.hover\:text-\[\#891a20\]:hover { color: #891a20; }

/* Box Shadows */
.shadow-xs { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); }

@media (min-width: 768px) {
  .md\:bg-transparent { background-color: transparent; }
}
```

---

## 5. Verification Method

To verify these changes upon implementation:

1. **Verify TypeScript & Production Build**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   npm run build
   ```
   *Expected outcome*: Exit code 0, 0 TypeScript compile errors.

2. **Verify Full Test Suite**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node tests/runner.ts
   ```
   *Expected outcome*: 182 / 182 tests pass (100% success rate across all 4 tiers).

3. **Verify Adversarial UI Suite**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node --test tests/tier5-adversarial/tier5-ui-preloader.test.ts
   ```
   *Expected outcome*: All 23 adversarial tests pass, including split-drum odometer, text balance line reservations, shelf clamping, keyboard modality, and backdrop click propagation.

4. **Verify Stress Challenger Suite**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node --test tests/stress-challenger-m1.ts
   ```
   *Expected outcome*: All font fallback, line reservation `data-reserve-lines="3"`, and layout stability tests pass.

5. **Visual Inspection**:
   - Preloader launches on clean white canvas with crisp dark numerals `#171c1c`, golden `%` symbol `#a17a15`, and crimson boot indicator `#891a20`.
   - Bottom shelf controls display as clean frosted light pills with dark numbers, solid black active item indicator, and clear keycaps (`←`, `→`, `Space`, `Enter`).
   - BookDetailModal opens as an archival white spread with dark drop-cap initial, sharp charcoal text, crimson section highlights, and 3 light-frosted metric cards.
