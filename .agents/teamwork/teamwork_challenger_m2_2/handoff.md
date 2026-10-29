# Milestone 2 Empirical Challenge Report: 3D Canvas Event Pass-Through & Monograph Selection Sync

**Author**: `teamwork_challenger_m2_2`  
**Role**: Empirical Challenger (critic, specialist)  
**Parent Conversation ID**: `769b646f-c552-41bc-9868-9a381d080792`  
**Working Directory**: `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_challenger_m2_2`  
**Milestone**: M2 (Top-Middle Navigation Bar)  
**Verdict**: **REJECT** ❌ (2 Confirmed Critical Bugs Identified)  

---

## 1. Observation

Direct empirical observations were gathered via Playwright browser execution, DOM computed style inspection, event propagation tracing, and automated stress testing in `tests/stress-challenger-m2-pass-through.ts`.

### 1.1 Bug 1: Top Viewport Pointer Interception Dead-Zone (`.nav-inner`)

- **File**: `src/index.css`, Lines 721–729:
  ```css
  .nav-inner {
    width: 100%;
    padding-top: 0.5em;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    pointer-events: auto;
  }
  ```
- **File**: `src/index.css`, Lines 731–736:
  ```css
  .nav-center {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  ```
- **Empirical DOM Measurements (1040 x 748 Viewport)**:
  - `navInner.getBoundingClientRect()`:
    `{ x: 48, y: 0, width: 944, height: 40, top: 0, right: 992, bottom: 40, left: 48 }`
    `getComputedStyle(navInner).pointerEvents`: `"auto"`
  - `navCenter.getBoundingClientRect()`:
    `{ x: 367.7, y: 8, width: 304.5, height: 32, top: 8, right: 672.2, bottom: 40, left: 367.7 }`
- **Hit-Test Results (`document.elementFromPoint`)**:
  - `(x: 100, y: 20)` (empty space to the left of nav pill): Returns `<div class="nav-inner">`
  - `(x: 800, y: 20)` (empty space to the right of nav pill): Returns `<div class="nav-inner">`
  - `(x: 500, y: 100)` (below nav pill): Returns `<canvas>`
- **Event Propagation Test Output**:
  ```json
  {
    "hitsAt100_20": {
      "target": "nav-inner",
      "canvasMouseDownReceived": 0,
      "canvasWheelReceived": 0
    },
    "hitsAt500_100": {
      "target": "CANVAS",
      "canvasMouseDownReceived": 1,
      "canvasWheelReceived": 1
    }
  }
  ```
- **Click-Outside Dismissal Failure**:
  When the Index dropdown is OPEN, clicking at `(x: 100, y: 20)` dispatches `mousedown` on `<div class="nav-inner">`. Because `.nav-inner` is inside `<nav ref={navRef}>`, `navRef.current.contains(e.target)` is `true`. The dropdown **fails to close** and remains stuck open (`isOpen: true`), while the 3D canvas receives zero interaction.

---

### 1.2 Bug 2: Dropdown Multi-Active Pill Concurrency Defect

- **File**: `src/components/TopNav.tsx`, Lines 44 & 391:
  ```tsx
  44:  const [focusedIndex, setFocusedIndex] = useState<number>(activeIndex);
  ...
  391: const isCurrent = idx === activeIndex;
  392: const isHovered = hoveredIdx === idx;
  393: const isFocused = focusedIndex === idx;
  394: const isPillActive = isHovered || isFocused || (hoveredIdx === null && isCurrent);
  ```
- **Observed Behavior**:
  When the active monograph is Book 4 ("Athenaeum Archive"), `focusedIndex` is set to `4` on dropdown open. When the user moves the pointer to hover over Book 0 ("Code Search Engine"), `hoveredIdx` becomes `0`.
  - For Book 0 (`idx: 0`): `isHovered === true` $\to$ `isPillActive = true` (`scaleY(1)`, text white, year revealed).
  - For Book 4 (`idx: 4`): `isFocused === true` $\to$ `isPillActive = true` (`scaleY(1)`, text white, year revealed).
- **DOM Inspection Result**:
  ```json
  [
    {
      "index": 0,
      "title": "Code Search Engine",
      "bgTransform": "scaleY(1)",
      "yrTransform": "translate(0px, 0px)"
    },
    {
      "index": 1,
      "title": "Biomedical Vision",
      "bgTransform": "scaleY(0)",
      "yrTransform": "translate(0%, 125%)"
    },
    {
      "index": 2,
      "title": "Physical Rendering",
      "bgTransform": "scaleY(0)",
      "yrTransform": "translate(0%, 125%)"
    },
    {
      "index": 3,
      "title": "Autonomous Agents",
      "bgTransform": "scaleY(0)",
      "yrTransform": "translate(0%, 125%)"
    },
    {
      "index": 4,
      "title": "Athenaeum Archive",
      "bgTransform": "scaleY(1)",
      "yrTransform": "translate(0px, 0px)"
    }
  ]
  ```
- **Visual Capture**: Captured in Playwright screenshot (`.playwright-mcp/page-2026-10-29T02-01-45-909Z.png`): Both Book 0 and Book 4 are displayed simultaneously with active black background pills and revealed year badges.

---

### 1.3 Verified Positive Behavior: Monograph Selection & Harmonic Oscillator Coupling

- **Dropdown Selection (0..4)**:
  Selecting each monograph (0, 1, 2, 3, 4) in `TopNav.tsx` successfully invokes `onSelectIndex(idx)`.
  ```json
  [
    { "index": 0, "expectedTitle": "Code Search Engine", "currentTitle": "Code Search Engine", "matches": true },
    { "index": 1, "expectedTitle": "Biomedical Vision", "currentTitle": "Biomedical Vision", "matches": true },
    { "index": 2, "expectedTitle": "Physical Rendering", "currentTitle": "Physical Rendering", "matches": true },
    { "index": 3, "expectedTitle": "Autonomous Agents", "currentTitle": "Autonomous Agents", "matches": true },
    { "index": 4, "expectedTitle": "Athenaeum Archive", "currentTitle": "Athenaeum Archive", "matches": true }
  ]
  ```
- **Harmonic Oscillator Target Update**:
  `LibraryScene.tsx` immediately updates `stateRef.current.targetScroll = activeIndex` on prop update. The 2nd-order oscillator accelerates smoothly with force $F = -k \cdot (x - target) - c \cdot v$ ($k=38.0, c=7.5$).
- **Boundary Clamping**: Out-of-bounds indices are safely clamped to `[0, books.length - 1]`.

---

## 2. Logic Chain

1. **Dead-Zone Causality**:
   - `PROJECT.md` §Interface Contracts specifies: `"UI Overlay Layer: Positioned at z-index: 10 with pointer-events-none container and pointer-events-auto on interactive controls to maintain full drag/wheel interaction with the 3D canvas."`
   - In `src/index.css`, `.nav-inner` wraps `.nav-center` but spans `width: 100%`. Declaring `pointer-events: auto` on `.nav-inner` (rather than on `.nav-center`) causes the entire 40px-high horizontal strip across the upper viewport to become mouse-interactive.
   - Any mouse click, drag, or wheel event targeting this strip is intercepted by `.nav-inner`. Because `LibraryScene`'s event listeners are attached to its container canvas element, events intercepted by `.nav-inner` never bubble to the 3D scene.
   - Therefore, 3D canvas drag and wheel interactions fail in this region, violating the event pass-through contract.

2. **Click-Outside Dismissal Breakdown**:
   - `TopNav.tsx` lines 102–106 use `navRef.current.contains(e.target)` to determine whether a click occurred outside the navigation component.
   - Because `.nav-inner` is a descendant of `navRef.current`, clicks in the dead zone to the left or right of the navigation pill evaluate as *inside* the nav component.
   - Consequently, clicking in this empty area while the dropdown is open fails to dismiss the dropdown.

3. **Dual-Pill Concurrency Causality**:
   - The dropdown design specification demands that exactly one monograph pill is actively scaled and visible at any time.
   - Line 394 in `src/components/TopNav.tsx` computes `isPillActive` as `isHovered || isFocused || (hoveredIdx === null && isCurrent)`.
   - When the dropdown is toggled, `focusedIndex` is initialized to `activeIndex`. When the user hovers over another monograph `j`, `hoveredIdx` is set to `j`, but `focusedIndex` remains at `activeIndex`.
   - Since both `isHovered` (for item `j`) and `isFocused` (for item `activeIndex`) evaluate to `true`, both items render `scaleY(1)` and revealed year `translate(0px, 0px)` simultaneously.
   - This produces a visible UI glitch where two items appear selected at once.

---

## 3. Caveats

- **Scope Boundary**: As an empirical challenger with review-only constraints, no changes have been committed to `src/index.css` or `src/components/TopNav.tsx`.
- **Preloader Isolation**: All empirical measurements were executed after the 2.85s preloader timeline had fully completed and unmounted.
- **Milestone 3 Interaction**: The 40px dead zone at `y: 0..40` currently overlaps the exact viewport coordinates where Milestone 3's `EditorialInfoSection.tsx` will be positioned (`top: 1.5rem, right: 2rem`), making resolution of Bug 1 urgent prior to M3 integration.

---

## 4. Conclusion

### Final Assessment: **REJECT** ❌

While monograph selection (`onSelectIndex(0..4)`) and 3D harmonic oscillator synchronization work properly when triggered, Milestone 2 contains two confirmed critical bugs:
1. **Critical Event Interception Bug**: A 55,040 px² dead-zone across the top of the viewport intercepts clicks and scroll wheels, preventing 3D canvas interaction and breaking dropdown click-outside dismissal.
2. **Visual Concurrency Defect**: The dropdown renders two active black pills and two revealed years simultaneously when hovering over any non-active monograph.

### Actionable Remediation Specifications for Worker:

1. **Remediation for Bug 1 (`src/index.css`)**:
   - Update `.nav-inner`: Change `pointer-events: auto;` to `pointer-events: none;`.
   - Update `.nav-center`: Add `pointer-events: auto;`.
   - This confines mouse interactions strictly to the centered pill (`.nav-center`) and restores full event pass-through to the 3D canvas across the surrounding space.

2. **Remediation for Bug 2 (`src/components/TopNav.tsx`)**:
   - In `src/components/TopNav.tsx`, ensure hover state takes precedence over focus state:
     ```tsx
     const isPillActive = hoveredIdx !== null 
       ? isHovered 
       : (isFocused || isCurrent);
     ```
   - In `onMouseEnter`, synchronize focus index:
     ```tsx
     onMouseEnter={() => {
       setHoveredIdx(idx);
       setFocusedIndex(idx);
     }}
     ```
   - This ensures exactly one monograph pill is active at any time.

---

## 5. Verification Method

To independently verify these empirical findings and test the remediations:

1. **Run Dedicated Challenger Test Suite**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node --test tests/stress-challenger-m2-pass-through.ts
   ```
   *Verifies dead-zone area calculations, CSS pointer-events contracts, selection synchronization, and dual-active state machine behavior.*

2. **Run Master 4-Tier Test Runner**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node tests/runner.ts
   ```
   *Expected outcome: 239/239 passing.*

3. **Verify Hit-Testing in Live Browser**:
   Open browser at `http://localhost:3000/`, wait for preloader to dismiss, and execute in DevTools Console:
   ```javascript
   console.log('Dead zone check:', document.elementFromPoint(100, 20).className);
   // Bug: Returns "nav-inner"
   // Expected after fix: Returns "CANVAS" or canvas parent
   ```

4. **Verify Single-Pill Invariant in Dropdown**:
   Open Index dropdown when active tome is 4 ("Athenaeum Archive"). Hover over Book 0 ("Code Search Engine").
   - Bug: Both Book 0 and Book 4 have black background pills (`scaleY(1)`).
   - Expected after fix: Only Book 0 has black background pill (`scaleY(1)`), Book 4 is `scaleY(0)`.
