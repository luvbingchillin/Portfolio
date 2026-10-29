# M2 Explorer 3: Animations, Interactions & 3D Integration Plan for TopNav

Read:
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_survey_1\handoff.md`
- `C:\Users\kangy\Desktop\Portfolio\TEST_READY.md`

Your task:
1. Formulate the exact animation and interaction logic for `TopNav.tsx`:
   - Sliding page dot: Coordinate calculation function (`calculateNavPageDotPosition`), smooth tracking when active section changes.
   - Index button label transition: Smooth vertical track switch between "Index" and book count ("05") (`yPercent: -130%` / `130%`), and chevron rotation (`0deg` <-> `180deg`).
   - Dropdown item hover animation: Black pill scale up (`scaleY(0 -> 1)`) with text color inversion (black -> white) and year reveal.
   - Click-to-navigate: Calling `onSelectIndex(idx)` updates `activeIndex`, smoothly driving the 3D book carousel harmonic oscillator.
   - Keyboard accessibility: `ArrowDown`, `ArrowUp`, `Enter`, `Escape` handling.
2. Ensure full alignment with `tests/helpers/enhancementModels.ts` and test assertions in `tests/tier1-features/r1-nav-bar.test.ts` and `tests/tier2-boundary/r1-nav-bar-boundary.test.ts`.

Write your handoff report to:
`C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_3\handoff.md`
Maintain your heartbeat in `progress.md`.

## 2026-10-29T01:34:31Z
You are teamwork_explorer_m2_3.
Your working directory is: C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_3
Your parent is orchestrator (conv ID: 769b646f-c552-41bc-9868-9a381d080792).

Task:
1. Formulate the exact animation and interaction logic for TopNav.tsx:
- Sliding page dot: Coordinate calculation function (`calculateNavPageDotPosition`), smooth tracking when active section changes.
- Index button label transition: Smooth vertical track switch between "Index" and book count ("05") (`yPercent: -130%` / `130%`), and chevron rotation (`0deg` <-> `180deg`).
- Dropdown item hover animation: Black pill scale up (`scaleY(0 -> 1)`) with text color inversion (black -> white) and year reveal.
- Click-to-navigate: Calling `onSelectIndex(idx)` updates `activeIndex`, smoothly driving the 3D book carousel harmonic oscillator.
- Keyboard accessibility: `ArrowDown`, `ArrowUp`, `Enter`, `Escape` handling.
2. Ensure full alignment with `tests/helpers/enhancementModels.ts` and test assertions in `tests/tier1-features/r1-nav-bar.test.ts` and `tests/tier2-boundary/r1-nav-bar-boundary.test.ts`.
