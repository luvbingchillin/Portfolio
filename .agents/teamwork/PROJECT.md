# Project: Athenaeum Portfolio Enhancement (A24 Reference Alignment)

## Architecture
- **Framework & Runtime**: React 19 + Three.js 0.182 + Vite 8.3 + TypeScript 7.
- **Styling Architecture**: Handcrafted utility and token system in `src/index.css` paired with inline SVG React icons in `src/components/Icons.tsx`.
- **3D Scene Engine**: `LibraryScene.tsx` uses WebGLRenderer (`alpha: true`), analytical damped harmonic oscillator physics, dynamic CanvasTextures, and procedural leather materials.
- **UI Overlay Layer**: Positioned at `z-index: 10` with `pointer-events-none` container and `pointer-events-auto` on interactive controls to maintain full drag/wheel interaction with the 3D canvas.
- **Navigation & Info Components**:
  - `TopNav.tsx`: Top-middle floating navigation pill replicating A24 layout, sliding page dot, and index dropdown with animated word/count switch and item hover scale.
  - `EditorialInfoSection.tsx`: Top-right metadata display replicating A24 `experience_info` with display serif title, hairline dividers, and staggered entry/exit transitions.
  - `Theme System`: Pure white background (`#ffffff`), WCAG AAA compliant text (`#171c1c`), high-contrast crimson accents (`#891a20`), calibrated white scene fog (`0xffffff, 0.032`), and neutral studio lighting (`0xfdfbf7, 0.85`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | White Primary Background & Token Inversion | Switch page background to `#ffffff`, update CSS tokens (`--bg-library`, `--text-primary`), remove dark radial gradient vignette | M1 | ORIGINAL_REQUEST §R3 |
| F2 | 3D Scene Lighting & Fog Recalibration | Update `scene.fog` to `0xffffff, 0.032`, set ambient light to `0xfdfbf7, 0.85`, adjust exposure and reflections for crisp contrast on white | M1 | ORIGINAL_REQUEST §R3 |
| F3 | Base UI Controls Contrast & Theming | Update bottom shelf controls, keyboard hints, preloader, and modal to clean light frosted styling with high-contrast dark typography | M1 | ORIGINAL_REQUEST §R3 |
| F4 | Top-Middle Navigation Bar Layout & Structure | Implement fixed top-middle pill navigation with brand logo, nav links, and sliding indicator dot (`.nav-page-dot`) | M2 | ORIGINAL_REQUEST §R1 |
| F5 | Navigation Index Dropdown & Animations | Implement Index toggle with animated word <-> count roll (`Index` <-> `05`), rotating chevron, expanding panel, and hover pill scaling | M2 | ORIGINAL_REQUEST §R1 |
| F6 | Portfolio Navigation Integration | Connect dropdown items and nav links to `onSelectIndex(idx)` to seamlessly drive 3D book transitions | M2 | ORIGINAL_REQUEST §R1 |
| F7 | Mobile Navigation Docking | At viewports <= 991px, dock navigation bar to bottom center with upward flyout expansion | M2 | ORIGINAL_REQUEST §R1 |
| F8 | Top-Right Information Section Layout | Implement top-right metadata panel with display serif title, 0.5px hairline dividers, and stacked key-value rows | M3 | ORIGINAL_REQUEST §R2 |
| F9 | Portfolio Monograph Info Integration | Map active monograph data (Curator, Year, Category, Call Number/Tech Stack) and UTC chronometer into the info section | M3 | ORIGINAL_REQUEST §R2 |
| F10 | Information Section Stagger & Mask Transitions | Implement staggered exit (`yPercent: -120%`, 0.4s) and entrance (`yPercent: 120% -> 0%`, 0.7s) animations using `cubic-bezier(0.32, 0.72, 0, 1)` | M3 | ORIGINAL_REQUEST §R2 |
| F11 | E2E Test Suite Creation (Tiers 1-4) | Comprehensive opaque-box test suite verifying navigation bar, information section, white theme contrast, and interactions | Test Track | Dual Track |
| F12 | Full E2E Verification & Adversarial Hardening | Pass 100% of all E2E tests and perform white-box adversarial verification | M4 | Dual Track / Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | White Background & Visual Harmony | F1, F2, F3: CSS tokens, App background, 3D scene fog/lights, base UI contrast | None | DONE |
| M2 | Top-Middle Navigation Bar | F4, F5, F6, F7: Centered nav pill, sliding dot, index dropdown, 3D integration, mobile dock | M1 | DONE |
| M3 | Top-Right Information Section | F8, F9, F10: Editorial info panel, divider rules, metadata binding, transition animations | M1 | IN_PROGRESS |
| M4 | Final Milestone: E2E Verification & Adversarial Hardening | F12: Pass 100% E2E tests across Tiers 1-4, then Tier 5 adversarial hardening | M1, M2, M3, Test Track | PLANNED |

## Interface Contracts
### `TopNav` Component Contract
```typescript
interface TopNavProps {
  books: Book[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  brandTitle?: string;
  className?: string;
}
```
- Emits `onSelectIndex(idx)` when any monograph item in the Index dropdown or keyboard shortcut is selected.
- Renders brand logo on left, primary links with sliding `.nav-page-dot` in center, and Index toggle with rolling item count on right.

### `EditorialInfoSection` Component Contract
```typescript
interface EditorialInfoSectionProps {
  activeBook: Book;
  currentTime?: string;
  curator?: string;
  className?: string;
}
```
- Receives `activeBook` and renders title, author/curator, year, category, and call number.
- Triggers masked staggered slide animations whenever `activeBook.id` changes.

### Scene Lighting & Environment Contract
- `LibraryScene.tsx`:
  - `scene.fog`: `new THREE.FogExp2(0xffffff, 0.032)`
  - `ambientLight`: `new THREE.AmbientLight(0xfdfbf7, 0.85)`
  - `renderer.toneMappingExposure`: `1.0` - `1.05`
  - Zero object allocations in `tick()` loop.

## Code Layout
- `src/App.tsx`: Main layout, state management (`activeIndex`, `isFlipped`, `isSpreadOpen`), root background `#ffffff`, keyboard shortcuts.
- `src/index.css`: Global design tokens, typography rules, utility classes, `.nav` and `.experience_info` CSS rules.
- `src/components/TopNav.tsx`: Top-middle navigation component.
- `src/components/EditorialInfoSection.tsx`: Top-right editorial information component.
- `src/components/LibraryUI.tsx`: Top-level UI overlay orchestrating TopNav, EditorialInfoSection, and shelf controls.
- `src/components/LibraryScene.tsx`: 3D Three.js canvas, books carousel, lighting, white fog.
- `src/components/Preloader.tsx`: Telemetry preloader adapted to white theme.
- `src/components/BookDetailModal.tsx`: Monograph reading spread adapted to high-contrast white styling.
- `tests/`: 4-tier E2E tests and Tier 5 adversarial tests.
