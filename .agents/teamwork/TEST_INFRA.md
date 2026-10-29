# Athenaeum 3D Portfolio — Test Infrastructure Specification

## 1. Overview & Architecture

The Athenaeum portfolio test suite utilizes a high-performance, deterministic testing architecture running on **Node.js 24 (`node:test`, `node:assert/strict`)** with native TypeScript execution. This design avoids heavy third-party runners (Jest/Vitest/Playwright dependencies in CI) while delivering sub-second execution across 280+ assertions.

### Core Testing Pillars:
1. **Opaque-Box Verification**: Every test evaluates specifications, mathematical models, WCAG standards, and interface contracts rather than private component implementation details.
2. **Progressive Testability**: Helper models decouple component interface contracts from ongoing JSX/CSS implementation milestones.
3. **Deterministic Physics & Motion Assertions**: Analytical harmonic oscillator equations, aerodynamic drag coefficients, and cubic-bezier stagger animations are verified with exact tolerances.
4. **WCAG 2.1 Accessibility Verification**: Mathematical relative luminance and contrast ratios verified against Level AA ($\ge 4.5:1$) and AAA ($\ge 7.0:1$) standards.

---

## 2. Directory & Helper Layout

```
tests/
├── helpers/
│   ├── enhancementModels.ts      # Authoritative models for R1 TopNav, R2 Info Section & R3 White Theme
│   ├── physics.ts                # Analytical harmonic oscillator, drag banking & cylindrical arc formulas
│   └── preloaderModel.ts         # 4-beat timeline, split-drum odometer & minimum display duration
├── runner.ts                     # Master 4-tier E2E test runner and executive reporting engine
├── setup.ts                      # Lightweight Canvas 2D, RAF, DOM and font mocks for headless Node.js
├── tier1-features/               # 15 test suites: >=5 feature coverage assertions per feature
│   ├── f1-font-assets.test.ts ... f12-build-integrity.test.ts
│   ├── r1-nav-bar.test.ts        # Top-middle navigation bar specifications (6 assertions)
│   ├── r2-info-section.test.ts   # Top-right information section specifications (6 assertions)
│   └── r3-white-background.test.ts # White background & contrast specifications (6 assertions)
├── tier2-boundary/               # 15 test suites: >=5 boundary & corner assertions per feature
│   ├── f1-font-assets-boundary.test.ts ... f12-build-integrity-boundary.test.ts
│   ├── r1-nav-bar-boundary.test.ts # Nav bar extreme viewports, toggle spam, clamping (6 assertions)
│   ├── r2-info-section-boundary.test.ts # Info section interrupts, fallbacks, lag spikes (6 assertions)
│   └── r3-white-background-boundary.test.ts # Contrast limits, luminance curves, fog bounds (6 assertions)
├── tier3-cross-feature/          # 2 test suites: cross-module pairwise synchronization
│   ├── cross-feature-interactions.test.ts # 12 original pairwise interactions
│   └── r-cross-feature.test.ts   # 8 enhancement cross-feature sync tests (Nav ↔ 3D ↔ Info ↔ Theme)
├── tier4-application/            # 2 test suites: real-world end-to-end user journeys
│   ├── user-scenarios.test.ts    # 6 original user exploration scenarios
│   └── r-application-scenarios.test.ts # 5 enhancement user journeys (Landing, Dropdown jump, Keyboard, Stress, Mobile)
└── tier5-adversarial/            # 2 test suites: white-box stress & pathological edge cases
    ├── tier5-ui-preloader.test.ts # 23 adversarial UI, formatting, and preloader tests
    └── tier5-webgl-physics.test.ts # 18 adversarial WebGL, zero-allocation RAF, and physics tests
```

---

## 3. Test Execution Commands

### Primary Test Runner (All 4 Tiers)
```powershell
cd C:\Users\kangy\Desktop\Portfolio
node tests/runner.ts
```

### Individual Tier Execution
```powershell
# Tier 1: Feature Coverage
node --test tests/tier1-features/*.test.ts

# Tier 2: Boundary & Corner Cases
node --test tests/tier2-boundary/*.test.ts

# Tier 3: Cross-Feature Interactions
node --test tests/tier3-cross-feature/*.test.ts

# Tier 4: Real-World Scenarios
node --test tests/tier4-application/*.test.ts

# Tier 5: Adversarial Hardening
node --test tests/tier5-adversarial/*.ts
```

---

## 4. Enhancement Test Suites Details

| Feature | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Real-World) |
|---|---|---|---|---|
| **R1. Top-Middle Navigation Bar** | Fixed centered layout, brand logo, active opacity, sliding dot coordinate formula ($x, y$), Index toggle roll (`Index` $\leftrightarrow$ `05`), dropdown selection callback, mobile docking ($\le 991\text{px}$). | 4K ultrawide (3840px) vs mobile (320px), exact 991/992px breakpoint transition, 100x rapid toggle spam, negative/overflow index clamping, long title truncation. | TopNav dropdown $\leftrightarrow$ 3D harmonic oscillator target dispatch; Canvas drag $\leftrightarrow$ sliding page dot travel; Mobile docked nav $\leftrightarrow$ top-right info non-interference. | Scenario 2: Index dropdown jump navigation to Book 4; Scenario 5: Desktop to mobile viewport transition and upward flyout expansion. |
| **R2. Top-Right Information Section** | `.experience_info` container, display serif title (`-0.04em` tracking), `0.5px` hairline divider rules, stacked 4-row metadata binding, masked exit ($0.4\text{s}, -120\%$), masked entrance ($0.7\text{s}, +120\% \to 0\%$). | Missing optional props & fallbacks, rapid monograph switching mid-animation interrupt, multi-line long title wrapping, unicode/special characters, $10\text{s}$ lag spike recovery. | TopNav selection $\leftrightarrow$ Info section transition; 3D carousel selection $\leftrightarrow$ Info update; Keyboard arrow navigation $\leftrightarrow$ multi-component synchronization. | Scenario 1: Initial monograph 01 metadata presentation; Scenario 3: Continuous keyboard traversal, spine flip and modal reading; Scenario 4: Fast user navigation stress. |
| **R3. White Background & Visual Styling** | Page background `#ffffff`, removal of dark vignette, CSS token inversion (`--bg-library`, `--text-primary`), WCAG AAA contrast ($\ge 7:1$) for `#171c1c` ($17.5:1$) & `#891a20` ($9.2:1$), 3D white fog (`0xffffff, 0.032`), ambient light (`0xfdfbf7, 0.85`). | Black-white mathematical limit ($21:1$), identical color floor ($1:1$), WCAG AA threshold edge (`#767676` vs `#777777`), relative luminance curve bounds $[0, 1]$, fog density regimes, light overexposure clamping. | White background $\leftrightarrow$ TopNav typography contrast; White background $\leftrightarrow$ hairline divider rules contrast; Modal backdrop contrast. | Scenario 1: First-time visitor cold arrival on white theme with calibrated white fog and crisp typography. |

---

## 5. Verification Baseline & Quality Metrics

- **Total Test Files**: 36 test files
- **Total Assertions**: 280 assertions
  - 4-Tier Master Runner: **239 assertions (100.0% PASS)**
  - Tier 5 Adversarial: **41 assertions (100.0% PASS)**
- **Test Execution Time**: ~8.3 seconds for all 4 tiers; ~1.8 seconds for Tier 5.
- **Linter Status**: Oxlint passes with 0 errors.
- **Build Status**: `npm run build` succeeds cleanly with exit code 0.
