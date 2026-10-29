# Milestone 1 Implementation Dispatch: White Background & Visual Harmony

Read:
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_1\handoff.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2\handoff.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2\library_scene_lighting.patch`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_3\handoff.md`

## File Ownership
You exclusively own and modify:
- `src/App.tsx`
- `src/index.css`
- `src/components/LibraryScene.tsx`
- `src/components/Preloader.tsx`
- `src/components/LibraryUI.tsx`
- `src/components/BookDetailModal.tsx`

## Required Implementations
1. **`src/index.css` & `src/App.tsx`**:
   - Update CSS variables: `--bg-library: #ffffff;`, `--text-primary: #171c1c;`, `--text-muted: #57534e;`. Preserve legacy token names (`--gold-foil`, `--parchment`).
   - Add light utility classes as specified in Explorer 1 handoff.
   - In `src/App.tsx`: update `<main>` to `bg-white text-[#171c1c]` and remove/replace the dark radial gradient vignette.
2. **`src/components/LibraryScene.tsx`**:
   - Apply lighting & fog calibration from Explorer 2 report/patch:
     - `scene.fog = new THREE.FogExp2(0xffffff, 0.032)`
     - `ambientLight = new THREE.AmbientLight(0xfdfbf7, 0.85)`
     - `keyLight = new THREE.DirectionalLight(0xfff8f0, 1.25)` at `(3.5, 4.0, 4.5)`
     - `deskGlow = new THREE.PointLight(0xffecd2, 0.9, 12, 1.4)` at `(0, 1.8, 2.2)`
     - `rimLight = new THREE.DirectionalLight(0x94b4dc, 0.55)` at `(-4.0, 3.5, -3.0)`
     - `renderer.toneMappingExposure = 1.02`
   - CRITICAL: Keep `tick()` loop 100% untouched. Zero object allocations in RAF.
3. **`src/components/Preloader.tsx`, `LibraryUI.tsx`, `BookDetailModal.tsx`**:
   - Update styling per Explorer 3 handoff for white background, high-contrast dark typography, frosted borders, and dark drop caps.
   - Preserve all data properties, IDs, click handlers, and test invariants.
4. **Build & Test Verification**:
   - Run `npm run build` — must succeed with zero errors.
   - Run `node tests/runner.ts` — all 182 existing tests must pass with 100% success.
   - Run `node --test tests/tier5-adversarial/*.ts` — all 41 adversarial tests must pass.
   - Run `npm run lint` — must pass with 0 errors.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your handoff report to:
`C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_worker_m1_1\handoff.md`
Maintain your heartbeat in `progress.md`.


## 2026-10-29T01:14:11Z
You are teamwork_worker_m1_1.
Your working directory is: C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_worker_m1_1
Your parent is orchestrator (conv ID: 769b646f-c552-41bc-9868-9a381d080792).

MANDATORY: You MUST read the original request at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md
Also read your detailed dispatch instructions at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_worker_m1_1\DISPATCH.md
Also read the Explorer handoff reports:
- C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_1\handoff.md
- C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2\handoff.md
- C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2\library_scene_lighting.patch
- C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_3\handoff.md

Write ownership: You exclusively own and modify:
- src/App.tsx
- src/index.css
- src/components/LibraryScene.tsx
- src/components/Preloader.tsx
- src/components/LibraryUI.tsx
- src/components/BookDetailModal.tsx

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Execute the implementations:
1. Update src/index.css and src/App.tsx for white background (#ffffff) and WCAG AAA contrast tokens (--bg-library: #ffffff;, --text-primary: #171c1c;, --text-muted: #57534e;) while preserving legacy token names. Remove dark radial vignette.
2. Apply 3D scene lighting and white exponential fog (scene.fog = new THREE.FogExp2(0xffffff, 0.032), ambientLight = new THREE.AmbientLight(0xfdfbf7, 0.85), keyLight, deskGlow, rimLight, exposure 1.02). Keep tick() loop 100% untouched.
3. Update Preloader.tsx, LibraryUI.tsx, and BookDetailModal.tsx for crisp white styling and dark typography while preserving all data fields and test invariants.
4. Verify by running build (npm run build) and tests (node tests/runner.ts, node --test tests/tier5-adversarial/*.ts, npm run lint).

Maintain heartbeat in C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_worker_m1_1\progress.md.
Write handoff report to:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_worker_m1_1\handoff.md
Send a message to your parent when done.
