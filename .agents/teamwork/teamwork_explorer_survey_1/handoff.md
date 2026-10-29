# Reference Site Investigation & Specification Handoff Report

**Target Website**: `https://a24.raviklaassens.com/`  
**Investigating Agent**: `survey_explorer_1`  
**Working Directory**: `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_survey_1`  
**Parent Conversation ID**: `769b646f-c552-41bc-9868-9a381d080792`  
**Date**: 2026-10-29  

---

## 1. Observation

Direct observations extracted via live Chromium session (Playwright MCP) and decoded from production assets (`_astro/ExportPage.DV5vD961.css` and `_astro/main.qdXy8l6N.js`):

### 1.1 Top-Middle Navigation Bar Structure & Layout
1. **DOM Structure** (quoted from live DOM evaluation):
```html
<nav data-theme-target="nav" data-menu-status="closed" class="nav theme-dark" data-navigation-init="true" id="mobile-navigation" aria-label="Main" data-nav-dropdown="closed">
  <div class="nav-container">
    <div class="nav-bg" style="visibility: visible; height: 0px;"></div>
    <div class="nav-inner">
      <div class="nav-center">
        <ul class="nav-center__list">
          <!-- 1. Logo -->
          <li>
            <a href="/" aria-current="page" class="nav-logo w-inline-block w--current" aria-label="A24 home">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 30 12" fill="none" class="a24-logo">
                <path d="..." fill="currentColor"></path>
              </svg>
            </a>
          </li>
          <!-- 2. Loading State (hidden when idle) -->
          <li class="nav-loading-item" aria-live="polite" aria-hidden="true" style="visibility: visible; display: none;">
            <span class="nav-link nav-loading">
              <span class="nav-link__label">Projecting</span>
              <span class="nav-loading__spinner" aria-hidden="true"></span>
            </span>
          </li>
          <!-- 3. Primary Nav Links -->
          <li>
            <a href="/" aria-current="page" class="nav-link w-inline-block w--current" data-nav-page="current">
              <span class="nav-link__label"><span>Films</span></span>
            </a>
          </li>
          <li>
            <a href="/television" class="nav-link w-inline-block" data-nav-page="other">
              <span class="nav-link__label"><span>Television</span></span>
            </a>
          </li>
          <!-- 4. Dropdown Toggle Item -->
          <li>
            <button data-dropdown-toggle="closed" class="nav-link" aria-expanded="false" aria-haspopup="true" aria-controls="navigation-dropdown-0">
              <span class="nav-link__label" data-nav-label="" style="width: 31px;">
                <span data-nav-label-track="">
                  <span data-nav-label-item="word" style="transform: translate(0px, 0px);">Index</span>
                  <span data-nav-label-item="count" aria-hidden="true" style="transform: translate(0%, 130%);">12</span>
                </span>
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 17 10" fill="none" class="nav-link__dropdown-icon" aria-hidden="true">
                <path d="M1.5 1.5L8.5 8.5L15.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>
            <!-- 5. Dropdown Flyout Panel -->
            <div class="nav-dropdown" id="navigation-dropdown-0" aria-hidden="true">
              <div class="nav-dropdown__overflow">
                <div class="nav-dropdown__overflow-inner">
                  <div class="nav-dropdown__content" data-lenis-prevent="">
                    <div role="list" class="nav-dropdown__content-li">
                      <!-- Dropdown Items -->
                      <div role="listitem">
                        <a data-film-scroll="Backrooms" class="nav-dropdown__link" data-film-status="active" aria-current="true">
                          <div class="nav-dropdown__link-bg" style="transform: scale(1, 1);"></div>
                          <div class="nav-dropdown__link-inner">
                            <h2 class="nav-dropdown__link-label">Backrooms</h2>
                            <span data-nav-year-mask="">
                              <span class="nav-dropdown__link-label" style="transform: translate(0px, 0px);">2026</span>
                            </span>
                          </div>
                        </a>
                      </div>
                      <!-- Inactive Item -->
                      <div role="listitem">
                        <a data-film-scroll="The Invite" class="nav-dropdown__link" data-film-status="inactive">
                          <div class="nav-dropdown__link-bg" style="transform: scale(1, 0); transform-origin: 50% 100%;"></div>
                          <div class="nav-dropdown__link-inner">
                            <h2 class="nav-dropdown__link-label">The Invite</h2>
                            <span data-nav-year-mask="">
                              <span class="nav-dropdown__link-label" style="transform: translate(0%, 125%);">2026</span>
                            </span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="nav-dropdown__scrollbar">
                <div class="nav-dropdown__scrollbar-progress" style="height: 20%; transform: translate3d(0px, 0px, 0px);"></div>
              </div>
            </div>
          </li>
          <!-- 6. Sliding Page Dot -->
          <span class="nav-page-dot" aria-hidden="true" style="opacity: 1; transform: matrix(1, 0, 0, 1, 80.55, 22.86);"></span>
        </ul>
      </div>
    </div>
  </div>
</nav>
```

2. **Exact Computed Positioning & Dimensions** (Desktop 1440x900):
   - `.nav`: `position: fixed; top: 0px; left: 0px; right: 0px; width: 100%; z-index: 100;`
   - `.nav-container`: `padding: 0 3em; margin: 0 auto; width: 100%;`
   - `.nav-inner`: `padding-top: 0.5em; display: flex; justify-content: center; align-items: center;`
   - `.nav-center`: Horizontally centered (`left: 592px, right: 848px` at 1440px width -> exact center at 720px).
   - `.nav-center__list`: `display: flex; justify-content: center; align-items: center; gap: 0; margin: 0; padding: 0; list-style: none; position: relative;`
   - `.nav-logo`: `padding: 0.5em 1em; width: 30px viewBox svg; fill: currentColor;`
   - `.nav-link`: `padding: 0.5em 1em; gap: 0.375em; border-radius: 0.25em; display: flex; align-items: center; justify-content: center;`
   - `.nav-link[data-nav-page="current"]`: `opacity: 1; color: rgb(0, 0, 0);`
   - `.nav-link[data-nav-page="other"]`: `opacity: 0.6; color: rgb(0, 0, 0); transition: opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1);`

3. **Sliding Indicator Dot (`.nav-page-dot`)**:
   - CSS rule:
     ```css
     .nav-page-dot {
       --nav-dot-size: .3em;
       width: var(--nav-dot-size);
       height: var(--nav-dot-size);
       margin-left: calc(var(--nav-dot-size) / -2);
       opacity: 0;
       pointer-events: none;
       will-change: transform;
       transition: opacity .2s cubic-bezier(.32, .72, 0, 1);
       background-color: currentColor;
       border-radius: 50%;
       position: absolute;
       top: 0;
       left: 0;
     }
     ```
   - Target Coordinates Function:
     - `x = activeLabel.left + activeLabel.width / 2 - list.left`
     - `y = activeLabel.bottom - list.top + navDotGap` (where `--nav-dot-gap: 0.3em`, fallback 5px).
     - Transition: duration `0.5s`, ease `cubic-bezier(0.32, 0.72, 0, 1)`.

4. **Dropdown Panel (`.nav-bg` and `.nav-dropdown`)**:
   - Width: `28em` (`448px` at 16px font-size).
   - Background pill container (`.nav-bg`):
     ```css
     .nav-bg {
       background-color: rgb(255, 255, 255);
       width: 28em;
       height: 0px;
       margin-left: auto;
       margin-right: auto;
       position: absolute;
       inset: 0% 0% auto;
       transition: height 0.46s cubic-bezier(.32, .72, 0, 1);
     }
     .nav[data-nav-dropdown="open"] .nav-bg {
       height: 24em; /* --nav-open-height */
       transition-duration: 0.62s;
     }
     ```
   - Dropdown Toggle Animation:
     - When closed: label tracks word `"Index"`, count `"12"` is at `transform: translate(0%, 130%)`. Chevron is at `0deg`.
     - When open: label width transitions to count width (`0.55s`), word translates up `translate(0, -130%)`, count translates to `translate(0, 0)`. Chevron rotates `180deg` (`0.62s`).
   - Dropdown Links:
     - Inactive item: black text, `.nav-dropdown__link-bg` at `scale(1, 0)` with `transform-origin: 50% 100%`, year at `translate(0%, 125%)`.
     - Active / Hovered item: white text (`#f2f2f2`), `.nav-dropdown__link-bg` at `scale(1, 1)` with background `#000000`, year at `translate(0%, 0%)`.
     - Animation timing: background scale duration `0.34s`, year duration `0.26s`, ease `cubic-bezier(0.32, 0.72, 0, 1)`.

5. **Responsive Behavior (`@media (max-width: 991px)`)**:
   - The navigation moves from the top to the viewport bottom:
     `position: fixed; top: auto; bottom: 0; padding-bottom: calc(1em + env(safe-area-inset-bottom, 0px));`
   - Height: `--nav-dock-height: 3.5em`.
   - Dropdown flyout expands **UPWARDS**:
     `inset: auto auto 100% 50%; transform: translate(-50%);`
     `[data-dropdown-toggle="open"] + .nav-dropdown { height: calc(min(25em, 62vh) - 3.5em); }`

---

### 1.2 Top-Right Information Section (`experience_info`)
1. **DOM Structure**:
```html
<div class="experience_info">
  <div data-disc-mask="idle">
    <p class="custom-element heading-s">Backrooms</p>
  </div>
  <div class="info-content">
    <div class="info-content_panel">
      <div class="divider-horizontal top"></div>
      <div class="info-content_label-wrap">
        <div data-disc-mask="idle">
          <p class="custom-element subheading-xs">DIRECTED BY</p>
        </div>
      </div>
      <div data-disc-mask="idle">
        <p class="custom-element paragraph-m text-align-right">Kane Parsons</p>
      </div>
    </div>
    <div class="info-content_panel">
      <div class="divider-horizontal top"></div>
      <div class="info-content_label-wrap">
        <div data-disc-mask="idle">
          <p class="custom-element subheading-xs">YEAR</p>
        </div>
      </div>
      <div data-disc-mask="idle">
        <p class="custom-element paragraph-m text-align-right">2026</p>
      </div>
    </div>
    <div class="info-content_panel">
      <div class="divider-horizontal top"></div>
      <div class="info-content_label-wrap">
        <div data-disc-mask="idle">
          <p class="custom-element subheading-xs">STARRING</p>
        </div>
      </div>
      <div data-disc-mask="idle">
        <p class="custom-element paragraph-m text-align-right">Chiwetel Ejiofor<br>Renate Reinsve</p>
      </div>
    </div>
  </div>
</div>
```

2. **Typography & Styling Specifications**:
   - Container: `display: flex; flex-direction: column; gap: 0.5em; width: 100%; max-width: 20.8333%;` (approx 300px at 1440px).
   - Heading (Title):
     - Class: `heading-s`
     - Font: `PPEiko, Arial, sans-serif` (Editorial Display Serif)
     - Font size: `2.5em` / `40px` (scaled by `--size-font`)
     - Line height: `1.1em`
     - Font weight: `400`
     - Letter spacing: `-0.04em`
     - Text transform: uppercase
     - Color: `#000000`
   - Dividing Lines:
     - Class: `.divider-horizontal.top`
     - CSS: `position: absolute; inset: 0% 0% auto; width: 100%; height: 0.5px; background-color: #000000; will-change: transform;`
   - Labels ("DIRECTED BY", "YEAR", "STARRING"):
     - Class: `subheading-xs`
     - Font: `PPMuseum, Arial, sans-serif` (Eyebrow Grotesk)
     - Font size: `0.625em` / `10px`
     - Line height: `1.3em`
     - Font weight: `400`
     - Letter spacing: `0.2em`
     - Text transform: uppercase
     - Color: `#000000` (or subtle muted black)
   - Values ("Kane Parsons", "2026", "Chiwetel Ejiofor"):
     - Class: `paragraph-m.text-align-right`
     - Font: `PPNeueMontreal, Arial, sans-serif`
     - Font size: `1.125em` / `18px`
     - Line height: `1.4em`
     - Font weight: `500`
     - Letter spacing: `-0.025em`
     - Text align: right
     - Color: `#000000`

3. **Motion & Transitions (`I` configuration object in JS bundle)**:
   Quoted directly from `_astro/main.qdXy8l6N.js`:
   ```js
   var F = "energy",
       xe = "M0,0 C0.32,0.72 0,1 1,1",
       I = {
         settleDelay: 100,      // ms
         outDuration: 0.4,      // seconds
         outLineStagger: 0.016, // seconds
         outItemStagger: 0.016, // seconds
         outShift: -120,        // yPercent: -120%
         inDuration: 0.7,       // seconds
         inLineStagger: 0.05,   // seconds
         inItemStagger: 0.035,  // seconds
         inGroupGap: 0.06,      // seconds
         inShift: 120,          // yPercent: 120%
         heightDuration: 0.5    // seconds
       };
   ```
   - Exit Sequence:
     - Text slides UP and out: `yPercent: -120%`, duration `0.4s`, stagger `0.016s`.
     - Dividers collapse: `scaleX: 0`, transform-origin `0% 50%`.
     - Container masked with `[data-disc-mask="clip"]` (`overflow: hidden`).
   - Enter Sequence:
     - Next content placed inside mask at `yPercent: 120%`.
     - Text slides UP and in: `yPercent: 0%`, duration `0.7s`, stagger `0.05s`.
     - Dividers expand: `scaleX: 1`, duration `0.7s`.
     - All using custom easing: `cubic-bezier(0.32, 0.72, 0, 1)`.

---

### 1.3 Visual Presentation & Contrast on Light/White Background
1. **Palette Tokens**:
   - Primary Background: `#f2f2f2` / `#ffffff`
   - Primary Text / Dark Swatch: `#000000` (pure black)
   - Secondary / Eyebrow Text: `#000000` with subtle opacity or `#31383b` / `#737373`
   - Divider / Border Rules: `0.5px solid #000000` (or `rgba(0, 0, 0, 0.15)`)
   - Accent / Brand Red: `#891a20` (A24 deep crimson)
   - Hover Pill Background: `#000000` with text `#f2f2f2`
2. **Three.js Scene Lighting Against Light Background**:
   - Reference site uses bright key light (`keyIntensity: 0.75, keyColor: #FFF9E8`), rim light (`rimIntensity: 0.75, rimColor: #499FF5`), ambient fill (`fillIntensity: 0.3`), top strip lighting (`topStripIntensity: 1.9`), and pure white fog (`fogColor: #FFFFFF`).
   - Books/discs maintain tactile metallic/specular highlights, rim reflection, and cast soft grounding shadows against the light floor/backdrop.

---

## 2. Logic Chain

1. **Top-Middle Navigation**:
   - The user requested a navigation bar in the top-middle position matching the reference website's layout, typography, and animation behavior.
   - Observation 1.1 reveals the reference site's exact DOM: `.nav > .nav-container > .nav-inner > .nav-center > .nav-center__list`.
   - The navigation items include the brand logo, primary navigation links with an animated sliding dot (`.nav-page-dot`), and an "Index" button with a rolling item count.
   - Observation 1.1 step 4 documents the dropdown panel (`.nav-dropdown` and `.nav-bg`) expanding with `width: 28em`, smooth height expansion, and hoverable item pills that invert black/white.
   - Adapting existing portfolio links:
     - Portfolio's active catalog contains 5 books ("The Architecture of Open Systems", "Distributed Real-Time Compute", "Neural Interface Topologies", "Cryptographic Substrates", "Algorithmic Governance").
     - In the top-middle navigation:
       - Left: "ATHENAEUM" or monogram logo.
       - Center: "Folio" (or "Tomes" / "Catalog") as primary active link with the `.nav-page-dot` indicator underneath.
       - Secondary: "Archive" or "About".
       - Right: "Index" toggle button with item count `"05"` that expands the dropdown menu.
       - Dropdown menu lists all 5 books with Title on left and Year on right, highlighting the active book and permitting instant jump-to-book on click.

2. **Top-Right Information Section**:
   - The user requested a matching information section in the top-right position, adapting the portfolio's existing information.
   - Observation 1.2 shows the reference site's `experience_info` structure: an uppercase display serif title followed by stacked panels separated by `0.5px` dividers, pairing uppercase `subheading-xs` labels with right-aligned `paragraph-m` values.
   - Currently, the portfolio displays metadata in a bulky bottom-left modal card (`LibraryUI.tsx`).
   - Relocating this metadata to the top-right position using the exact `experience_info` layout creates an airy, museum-grade aesthetic.
   - The portfolio's existing data maps cleanly:
     - Title: `activeBook.title` (in `font-heading` uppercase serif)
     - Row 1: `AUTHOR` -> `activeBook.author` (or `Kang Y.`)
     - Row 2: `YEAR` -> `activeBook.publicationYear` (e.g. `2026`)
     - Row 3: `CATEGORY` -> `activeBook.category.toUpperCase()`
     - Row 4: `CALL NUMBER` -> `activeBook.callNumber`
     - Row 5: `COLLECTION` -> `MONOGRAPH SERIES // VOL. 2026`
   - Using the exact stagger and mask animations from Observation 1.2 (exit: `yPercent: -120%` in `0.4s`, enter: `yPercent: 120% -> 0%` in `0.7s`, ease `cubic-bezier(0.32, 0.72, 0, 1)`), the metadata updates seamlessly whenever the active book changes.

3. **White Background & Visual Styling**:
   - The user requested changing the primary background to white with appropriate contrast adjustments.
   - In `App.tsx`, changing `bg-[#171c1c]` to `bg-white` and removing the dark radial vignette.
   - In `LibraryScene.tsx`, setting `scene.background = new THREE.Color(0xffffff)` and `scene.fog = new THREE.FogExp2(0xffffff, ...)` allows the Three.js 3D books to sit naturally on the white page.
   - Lighting intensities in `LibraryScene.tsx` need moderate recalibration (enhancing directional light and ambient contrast so book spines and embossed foil stay punchy and legible).
   - In UI controls, adopting `#000000` text, subtle `0.5px` border lines, and crisp monochrome keycap badges preserves maximum readability.

---

## 3. Caveats

1. **Fluid Font Sizing**: The reference site uses `font-size: calc(clamp(992px, 100dvw, 3840px) / 120)`. In the portfolio, Tailwind rem/px units or CSS variables can be used. It is recommended to use standard Tailwind classes (`text-xs`, `text-sm`, `text-2xl`, etc.) or a simple `--size-font` fluid calculation to prevent layout breakage on standard desktop displays.
2. **Custom Fonts**: The reference site uses licensed commercial fonts (`PPEiko`, `PPNeueMontreal`, `PPMuseum`). The portfolio currently includes `Cinzel` / `Playfair Display` for `font-heading`, `Inter` / `Plus Jakarta Sans` for `font-body`, and `JetBrains Mono` for `font-mono`. These existing fonts map directly:
   - `PPEiko` -> `font-heading` (Playfair / Cinzel, uppercase display serif)
   - `PPNeueMontreal` -> `font-body` (clean modern sans-serif)
   - `PPMuseum` -> `font-eyebrow` (tracked uppercase grotesk)
3. **Mobile Screen Real Estate**: On screens `< 768px`, if both the top-right information section and the 3D book canvas occupy the screen, the info section should have `max-width: 100%` and reduce padding to avoid obscuring touch controls.

---

## 4. Conclusion & Actionable Blueprint

### Recommended Architectural Changes:

1. **New Component: `TopNav.tsx` (`src/components/TopNav.tsx`)**:
   - Implements `.nav-center` top-middle pill navigation with fixed positioning.
   - Features:
     - Athenaeum brand monogram on left.
     - "Tomes" / "Folio" primary link with animated sliding indicator dot (`.nav-page-dot`).
     - "Archive" link.
     - "Index [05]" toggle button with rotating chevron (`180deg`) and sliding label (`Index` <-> `05`).
     - Full dropdown menu (`width: 28em`, white background) listing all 5 portfolio books.
     - Interactive item hover with black pill slide-in (`scaleY(0 -> 1)`) and year reveal.
     - Click handler: calls `onSelectIndex(index)` to rotate the 3D scene directly.
     - Mobile responsive mode: docked to bottom center at `<= 991px` with upward dropdown expansion.

2. **New Component: `EditorialInfoSection.tsx` (`src/components/EditorialInfoSection.tsx`)**:
   - Fixed at top right (`position: absolute; top: 2rem; right: 2rem; width: 100%; max-width: 22rem; z-index: 20;`).
   - Title: `activeBook.title` in uppercase editorial serif.
   - Stack of `.info-content_panel` rows with horizontal dividing lines (`0.5px solid #000000`).
   - Displays Author, Year, Category, Call Number, and live UTC chronometer.
   - Staggered slide and divider reveal animations when `activeIndex` transitions, matching the reference timing (`0.4s` out, `0.7s` in, ease `cubic-bezier(0.32, 0.72, 0, 1)`).

3. **Background & Theme Adjustments in `App.tsx` & `LibraryScene.tsx`**:
   - Set page background to `#ffffff`.
   - Update `LibraryScene.tsx` background color to `#ffffff` and adjust fog/lights.
   - Adjust bottom keyboard controls and action buttons to high-contrast dark-on-white styling.

---

## 5. Verification Method

1. **Code & Build Verification**:
   - Run `npm run build` to verify TypeScript compliance and zero build warnings/errors.
2. **Visual Inspection**:
   - Top-middle nav: confirm fixed centered position, active sliding dot positioning, and dropdown opening behavior.
   - Dropdown hover: verify black pill scale-up and year reveal transitions.
   - Top-right info section: verify placement at viewport top-right, clean 0.5px dividers, and smooth exit/entrance animations when switching books with arrow keys (`Left`/`Right`).
   - Theme check: verify background is white (`#ffffff`), text is dark and legible, and 3D books remain vivid with realistic shadows.
3. **Responsive Verification**:
   - Resize viewport to 375px (mobile) and verify nav docks to bottom center with upward-expanding index drawer.

---
*Report generated and self-verified by `survey_explorer_1`.*
