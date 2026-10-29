# Investigation & Remediation Plan: TopNav Multi-Active Pill Hover Concurrency Defect

**Author**: `teamwork_explorer_m2_r2_2`  
**Role**: Teamwork Explorer (Investigator, Synthesizer)  
**Parent Conversation ID**: `769b646f-c552-41bc-9868-9a381d080792`  
**Working Directory**: `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_2`  
**Target File**: `src/components/TopNav.tsx`  
**Milestone**: M2-r2 (Top-Middle Navigation Bar Remediation)  
**Status**: COMPLETE ✅  

---

## 1. Observation

### 1.1 Direct Source Code Inspection
In `src/components/TopNav.tsx`, lines 43–44 and 388–395:

```tsx
43:  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
44:  const [focusedIndex, setFocusedIndex] = useState<number>(activeIndex);
...
388: {books.map((book, idx) => {
389:   const isCurrent = idx === activeIndex;
390:   const isHovered = hoveredIdx === idx;
391:   const isFocused = focusedIndex === idx;
392:   const isPillActive = isHovered || isFocused || (hoveredIdx === null && isCurrent);
```

And in lines 416–439:
```tsx
416:   <div
417:     className="nav-dropdown__link-bg"
418:     style={{
419:       transform: isPillActive ? 'scaleY(1)' : 'scaleY(0)',
420:       transformOrigin: isPillActive ? '50% 50%' : '50% 100%',
421:       transition: 'transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)'
422:     }}
423:   />
424:   <div className="nav-dropdown__link-inner">
425:     <h2 className="nav-dropdown__link-label">{book.title}</h2>
426:     <span data-nav-year-mask="">
427:       <span
428:         className="nav-dropdown__link-label"
429:         style={{
430:           transform: isPillActive
431:             ? 'translate(0px, 0px)'
432:             : 'translate(0%, 125%)',
433:           transition: 'transform 0.26s cubic-bezier(0.32, 0.72, 0, 1)'
434:         }}
435:       >
436:         {book.year}
437:       </span>
438:     </span>
439:   </div>
```

### 1.2 Verbatim Defect Demonstration
As documented by `teamwork_challenger_m2_2` in empirical stress test `tests/stress-challenger-m2-pass-through.ts` (lines 257–267) and Playwright capture:
- When the active monograph is Book 4 ("Athenaeum Archive"), upon opening the dropdown:
  - `activeIndex = 4`
  - `focusedIndex = 4` (set via `setFocusedIndex(activeIndex)` on dropdown open in line 139)
- When the user hovers over Book 0 ("Code Search Engine"):
  - `hoveredIdx = 0`
  - For Book 0 (`idx: 0`): `isHovered === true` $\implies$ `isPillActive = true`. Book 0 renders `scaleY(1)` and revealed year `translate(0px, 0px)`.
  - For Book 4 (`idx: 4`): `isHovered === false`, BUT `isFocused === true` (because `focusedIndex === 4`). The expression `isHovered || isFocused || ...` evaluates to `true` $\implies$ `isPillActive = true`. Book 4 ALSO renders `scaleY(1)` and revealed year `translate(0px, 0px)`.
- **Result**: Exactly **2** monograph items render active black pills (`scaleY(1)`) and revealed year labels simultaneously, violating the single-selection visual invariant of the A24 navigation component.

---

## 2. Logic Chain

1. **State Machine Root Cause**:
   - `isPillActive` in `TopNav.tsx` line 392 is composed with non-exclusive logical OR operators: `isHovered || isFocused || (hoveredIdx === null && isCurrent)`.
   - `hoveredIdx` and `focusedIndex` are independent React state variables.
   - When the user interacts via a pointer (mouse/stylus), `hoveredIdx` changes with cursor position (`onMouseEnter`), while `focusedIndex` remains at whatever item last held keyboard focus or the initial `activeIndex`.
   - Because `isHovered || isFocused` evaluates to `true` whenever *either* condition matches, any mismatch between `hoveredIdx` and `focusedIndex` produces multiple concurrent `true` evaluations across the catalog list.

2. **Pointer Intent Precedence Requirement**:
   - When a pointer is interacting with the list (`hoveredIdx !== null`), pointer hover intent represents the user's active, conscious focus of attention.
   - Under pointer interaction, keyboard focus indicators must not create conflicting visual highlights.
   - Therefore, when `hoveredIdx !== null`, `isPillActive` must evaluate **strictly and solely** to `isHovered`. All other terms (`isFocused`, `isCurrent`) must be suppressed.

3. **Fallback to Keyboard Focus & Current Monograph**:
   - When the pointer is not hovering over any dropdown item (`hoveredIdx === null`), the navigation pill highlight must fall back to keyboard navigation or current scene state.
   - If a monograph has keyboard focus (`focusedIndex === idx`), that monograph's pill must be active (`isFocused = true`).
   - If no monograph has keyboard focus (`focusedIndex === null`), the currently loaded monograph (`idx === activeIndex`, i.e. `isCurrent`) must be active.
   - To prevent dual activation when navigating via keyboard (where `focusedIndex` may differ from `activeIndex`), `isCurrent` must only activate when `focusedIndex === null`.
   - This yields the exact formula:
     ```tsx
     const isPillActive =
       hoveredIdx !== null
         ? isHovered
         : isFocused || (focusedIndex === null && isCurrent);
     ```

4. **Single-Pill Invariant Proof**:
   Let $N$ be the number of monographs ($N=5$). Let $A$ be the count of items with `isPillActive === true`.
   - **Case 1**: `hoveredIdx !== null`
     - $hoveredIdx = k \in \{0, \dots, N-1\}$.
     - For $idx = k$: $isHovered = true \implies isPillActive = true$.
     - For all $idx \neq k$: $isHovered = false \implies isPillActive = false$.
     - Total active: $A = 1$.
   - **Case 2**: `hoveredIdx === null` and `focusedIndex \in \{0, \dots, N-1\}`
     - $focusedIndex = m$.
     - For $idx = m$: $isFocused = true$, $(focusedIndex === null \land isCurrent) = false \implies isPillActive = true$.
     - For all $idx \neq m$: $isFocused = false$, $(focusedIndex === null \land isCurrent) = false \implies isPillActive = false$.
     - Total active: $A = 1$.
   - **Case 3**: `hoveredIdx === null` and `focusedIndex === null`
     - For $idx = activeIndex$: $isFocused = false$, $(focusedIndex === null \land isCurrent) = true \implies isPillActive = true$.
     - For all $idx \neq activeIndex$: $isFocused = false$, $(focusedIndex === null \land isCurrent) = false \implies isPillActive = false$.
     - Total active: $A = 1$.
   - In all reachable states, $A \equiv 1$. Dual-selection is mathematically impossible.

---

## 3. Caveats

1. **Bug 1 Separation**:
   - `teamwork_challenger_m2_2` identified two distinct defects: Bug 1 (CSS `.nav-inner` pointer-events dead-zone) and Bug 2 (TopNav multi-active pill concurrency).
   - This report and remediation plan exclusively address Bug 2 in `src/components/TopNav.tsx`. Bug 1 (`src/index.css`) is tracked as a peer task for worker remediation.
2. **Keyboard Focus Tracking vs Pointer Sync**:
   - While `onMouseEnter` can optionally call `setFocusedIndex(idx)`, keeping `focusedIndex` uncoupled from casual mouseover ensures that if the mouse leaves the dropdown without clicking, the highlight returns cleanly to the active monograph (`activeIndex`) rather than getting stranded on an unselected item.
3. **TypeScript Type Safety**:
   - `focusedIndex` is typed as `number | null` (`useState<number | null>(activeIndex)`), guaranteeing that strict TypeScript type-checking will not warn on `focusedIndex === null`.

---

## 4. Conclusion & Actionable Implementation Plan

### 4.1 State Machine Truth Table

| State | `hoveredIdx` | `focusedIndex` | `activeIndex` | Active Item | Reason | Active Count |
|---|---|---|---|---|---|---|
| **Dropdown Open (Default)** | `null` | `4` | `4` | Book 4 | `isFocused === true` | **1** |
| **Pointer Hover Book 0** | `0` | `4` | `4` | Book 0 | `hoveredIdx !== null && isHovered` | **1** |
| **Pointer Hover Book 2** | `2` | `4` | `4` | Book 2 | `hoveredIdx !== null && isHovered` | **1** |
| **Pointer Leaves Dropdown** | `null` | `4` | `4` | Book 4 | `hoveredIdx === null && isFocused` | **1** |
| **Keyboard ArrowUp to Book 3** | `null` | `3` | `4` | Book 3 | `hoveredIdx === null && isFocused` | **1** |
| **Unfocused / Blur** | `null` | `null` | `4` | Book 4 | `focusedIndex === null && isCurrent` | **1** |

### 4.2 Exact Unified Diff Patch for `src/components/TopNav.tsx`

```diff
--- a/src/components/TopNav.tsx
+++ b/src/components/TopNav.tsx
@@ -41,7 +41,7 @@ export const TopNav: FC<TopNavProps> = ({
   const [manualTab, setManualTab] = useState<'folio' | 'treatise'>('folio');
   const activeTab = isModalOpen ? 'treatise' : manualTab;
   const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
-  const [focusedIndex, setFocusedIndex] = useState<number>(activeIndex);
+  const [focusedIndex, setFocusedIndex] = useState<number | null>(activeIndex);
   const [isMobile, setIsMobile] = useState(() =>
     typeof window !== 'undefined' ? window.innerWidth <= 991 : false
   );
@@ -126,6 +126,7 @@ export const TopNav: FC<TopNavProps> = ({
       const clamped = Math.max(0, Math.min(books.length - 1, idx));
       onSelectIndex(clamped);
       setIsOpen(false);
+      setHoveredIdx(null);
       toggleBtnRef.current?.focus();
     },
     [books.length, onSelectIndex]
@@ -137,7 +138,10 @@ export const TopNav: FC<TopNavProps> = ({
     if (isModalOpen) return;
     setIsOpen((prev) => {
       const next = !prev;
-      if (next) setFocusedIndex(activeIndex);
+      if (next) {
+        setFocusedIndex(activeIndex);
+      }
+      setHoveredIdx(null);
       return next;
     });
   }, [isModalOpen, activeIndex]);
@@ -389,7 +393,10 @@ export const TopNav: FC<TopNavProps> = ({
                             const isCurrent = idx === activeIndex;
                             const isHovered = hoveredIdx === idx;
                             const isFocused = focusedIndex === idx;
-                            const isPillActive = isHovered || isFocused || (hoveredIdx === null && isCurrent);
+                            const isPillActive =
+                              hoveredIdx !== null
+                                ? isHovered
+                                : isFocused || (focusedIndex === null && isCurrent);
 
                             return (
                               <div role="listitem" key={book.id || idx}>
```

---

## 5. Verification Method

### 5.1 Verification Commands

1. **Run Full 4-Tier Test Suite**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node tests/runner.ts
   ```
   *Expected outcome*: 239/239 test assertions pass (100% success rate).

2. **Run Challenger Adversarial Stress Suite**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node --test tests/stress-challenger-m2-pass-through.ts
   ```
   *Expected outcome*: 16/16 tests pass, validating Suite 3's corrected formula invariant ($A \equiv 1$).

3. **TypeScript Compilation & Production Bundle Check**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   npm run build
   ```
   *Expected outcome*: `tsc -b && vite build` completes with zero type errors.

### 5.2 Browser DOM Inspection Verification
1. Open `http://localhost:3000/`. Wait for the 2.85s preloader to complete.
2. Ensure active monograph is Book 4 ("Athenaeum Archive").
3. Click the Index toggle to expand the dropdown.
4. Move pointer over Book 0 ("Code Search Engine").
5. In DevTools Console, inspect active pill backgrounds:
   ```javascript
   const items = Array.from(document.querySelectorAll('.nav-dropdown__link')).map(el => ({
     title: el.querySelector('.nav-dropdown__link-label')?.textContent,
     scale: getComputedStyle(el.querySelector('.nav-dropdown__link-bg')).transform
   }));
   console.table(items);
   ```
   *Pass Condition*:
   - Book 0 `scale`: `matrix(1, 0, 0, 1, 0, 0)` (`scaleY(1)`)
   - Books 1..4 `scale`: `matrix(1, 0, 0, 0, 0, 0)` (`scaleY(0)`)
   - Count of active pills with `scaleY(1)` is strictly **1**.

### 5.3 Invalidation Conditions
This plan is invalidated if:
1. `hoveredIdx !== null` produces more than 1 item with `isPillActive = true`.
2. Keyboard navigation fails to highlight the focused item when `hoveredIdx === null`.
3. Closing and reopening the dropdown leaves stale hover state.
