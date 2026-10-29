# Milestone 2 Implementation Dispatch: Top-Middle Navigation Bar

Read:
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_1\handoff.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_2\handoff.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_2\proposed_topnav.css`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_3\handoff.md`
- `C:\Users\kangy\Desktop\Portfolio\TEST_READY.md`

## File Ownership
You exclusively own and modify:
- `src/components/TopNav.tsx` (create new component)
- `src/index.css` (add TopNav CSS classes)
- `src/components/LibraryUI.tsx` (integrate TopNav)
- `src/App.tsx` (ensure clean props pass-through)

## Required Implementations
1. **`src/components/TopNav.tsx`**:
   - Implement top-middle fixed navigation replicating reference site DOM:
     `.nav > .nav-container > .nav-inner > .nav-center > .nav-center__list`.
   - Brand logo on left: crimson dot (`#891a20`) + "ATHENAEUM" in editorial serif.
   - Primary links: "Folio" (active) and "Treatise" (reader spread trigger) with animated sliding page dot (`.nav-page-dot`).
   - Coordinate calculation for `.nav-page-dot` matching `calculateNavPageDotPosition`.
   - Index toggle button:
     - Vertical masked track rolling word "Index" <-> book count "05" (`yPercent: -130%` / `130%`).
     - Chevron rotating `0deg` <-> `180deg`.
   - Flyout dropdown panel:
     - Width `28em`, background white `#ffffff`, smooth height transition (`24em`).
     - Renders all 5 catalog monographs (`BOOKS_CATALOG`) with title on left and publication year on right.
     - Hover pill scaling animation (`scaleY(0 -> 1)` with black background `#000000`, white text `#f2f2f2`, and sliding year reveal).
     - Clicking any monograph dispatches `onSelectIndex(idx)` to smoothly glide the 3D book carousel to that monograph via harmonic oscillator.
   - Mobile responsive docking: Viewports `<= 991px` dock navigation bar to bottom center with upward flyout expansion.
   - Keyboard navigation: `ArrowDown`, `ArrowUp`, `Enter`, `Escape`.
2. **`src/index.css`**:
   - Append all TopNav CSS rules from Explorer 2 (`proposed_topnav.css`).
3. **`src/components/LibraryUI.tsx`**:
   - Integrate `<TopNav>` in place of the old top masthead.
   - Ensure the container keeps `pointer-events-none` so 3D canvas drag/wheel interactions remain completely unhindered, with `pointer-events-auto` on the nav bar.
4. **Build & Test Verification**:
   - Run `npm run build` — must succeed with 0 errors.
   - Run `node tests/runner.ts` — all 239 assertions must pass with 100% success rate.
   - Run `node --test tests/tier5-adversarial/*.ts` — all 41 adversarial tests must pass.
   - Run `npm run lint` — must pass with 0 errors.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your handoff report to:
`C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_worker_m2_1\handoff.md`
Maintain your heartbeat in `progress.md`.


## 2026-10-29T01:42:48Z
[Message] timestamp=2026-10-29T01:42:48Z sender=769b646f-c552-41bc-9868-9a381d080792 priority=MESSAGE_PRIORITY_HIGH content=You are teamwork_worker_m2_1.
Your working directory is: C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_worker_m2_1
Your parent is orchestrator (conv ID: 769b646f-c552-41bc-9868-9a381d080792).

MANDATORY: You MUST read the original request at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md
Also read your detailed dispatch instructions at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_worker_m2_1\DISPATCH.md
Also read the Explorer handoff reports:
- C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_1\handoff.md
- C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_2\handoff.md
- C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_2\proposed_topnav.css
- C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_3\handoff.md
Also read TEST_READY.md at:
C:\Users\kangy\Desktop\Portfolio\TEST_READY.md

Write ownership: You exclusively own and modify:
- src/components/TopNav.tsx
- src/index.css
- src/components/LibraryUI.tsx
- src/App.tsx

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Execute the implementations:
1. Create src/components/TopNav.tsx replicating reference layout, logo, primary links with sliding indicator dot (.nav-page-dot), and Index dropdown with rolling word <-> count label and hover pill scale animations. Connect clicking items to onSelectIndex(idx). Include mobile bottom docking at <= 991px.
2. Add TopNav CSS rules to src/index.css from proposed_topnav.css.
3. Integrate TopNav into LibraryUI.tsx, replacing legacy top bar while keeping pointer-events-none container semantics.
4. Verify by running npm run build (0 errors), node tests/runner.ts (239/239 pass), node --test tests/tier5-adversarial/*.ts, npm run lint.

Maintain heartbeat in C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_worker_m2_1\progress.md.
Write handoff report to:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_worker_m2_1\handoff.md
Send a message to your parent when done.
