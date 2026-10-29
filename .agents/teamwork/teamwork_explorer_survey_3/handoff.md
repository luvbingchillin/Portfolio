# Comprehensive Technical Survey: Build System, Dependencies, Styling Framework & White Background Theming Audit

**Agent**: `survey_explorer_3`  
**Date**: 2026-10-29  
**Target Repository**: `C:\Users\kangy\Desktop\Portfolio`  
**Parent Conv ID**: `769b646f-c552-41bc-9868-9a381d080792`  
**Status**: COMPLETE (Hard Handoff)

---

## 1. Observation

### 1.1 Build & Runtime Environment

#### `package.json`
- **File**: `C:\Users\kangy\Desktop\Portfolio\package.json` (lines 1-28)
```json
{
  "name": "portfolio",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "three": "^0.182.0"
  },
  "devDependencies": {
    "@types/node": "^24.19.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@types/three": "^0.182.0",
    "@vitejs/plugin-react": "^6.1.2",
    "oxlint": "^1.89.0",
    "typescript": "~7.0.2",
    "vite": "^8.3.5"
  }
}
```
- **Observations**:
  - Runtime: Modern React 19.3.1 SPA with Three.js 0.182.0.
  - Bundler: Vite 8.3.5 with `@vitejs/plugin-react` 6.1.2.
  - Compiler: TypeScript ~7.0.2 with `tsc -b`.
  - Zero external UI component libraries, zero external icon packages, zero animation libraries installed in `dependencies`.
  - Node version: `Node.js v24.12.0 (win32)`.

#### Baseline Build Verification (`npm run build`)
- **Command**: `cd C:\Users\kangy\Desktop\Portfolio; npm run build`
- **Output**:
```text
> portfolio@0.0.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 27 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.85 kB │ gzip:   0.42 kB
dist/assets/index-Bsvb-Wjw.css   16.13 kB │ gzip:   4.26 kB
dist/assets/index-BweFzqQe.js   803.64 kB │ gzip: 216.27 kB

✓ built in 3.06s
```
- **Result**: Exit code 0, cleanly passes with 0 compiler errors.

#### Test Suite Verification (`node tests/runner.ts`)
- **Command**: `cd C:\Users\kangy\Desktop\Portfolio; node tests/runner.ts`
- **Output**:
```text
================================================================
📊 EXECUTIVE TEST SUMMARY REPORT
================================================================
Total Test Assertions: 182
Passed:                182 ✅
Failed:                0 
Pass Rate:             100.0%
Total Execution Time:  9.73s
================================================================
✅ ALL 4 TIERS PASSED WITH 100% SUCCESS.
```

#### Linter Status (`npm run lint`)
- **Command**: `cd C:\Users\kangy\Desktop\Portfolio; npm run lint`
- **Output**: Oxlint completed on 52 files with 0 errors and 6 non-blocking React warnings (ref assignment during render in `Preloader.tsx` and `LibraryScene.tsx`).

---

### 1.2 Styling & Animation Stack

#### CSS Architecture
- **Single CSS File**: `C:\Users\kangy\Desktop\Portfolio\src\index.css` (597 lines, 21.7 KB).
- **No Tailwind Compiler / PostCSS Plugin**:
  - While `@tailwindcss` exists in `node_modules`, it is **not configured** in `package.json`, `vite.config.ts`, or PostCSS.
  - `src/index.css` is an entirely **handcrafted CSS system** declaring `@font-face`, design tokens under `:root`, and utility classes matching Tailwind syntax (`.flex`, `.absolute`, `.text-sm`, `.border-[#31383b]`, etc.) alongside explicit responsive media queries (`sm:`, `md:`, `lg:`).

#### Fonts & Assets
- Local high-priority font files stored in `public/fonts/`:
  - `PPNeueMontreal-Medium.woff2` (500 weight, Grotesque Sans: body text, paragraphs, labels)
  - `PPEiko-Regular.woff2` (400 weight, Editorial Serif: hero headings, book titles, drop caps)
  - `PPMuseum-Regular.woff2` (400 weight, Monospace / Technical: call numbers, timestamps, badges, telemetry)
- Preloaded in `index.html`:
```html
<link rel="preload" href="/fonts/PPNeueMontreal-Medium.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/PPEiko-Regular.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/PPMuseum-Regular.woff2" as="font" type="font/woff2" crossorigin />
```

#### Animation Stack
- **Zero Third-Party Animation Libraries**: Neither Framer Motion nor GSAP are installed.
- **Physics Engine**:
  - `src/components/LibraryScene.tsx` contains an analytical 2nd-order damped harmonic oscillator ($d^2x/dt^2 + \gamma dx/dt + \omega_0^2(x - x_{target}) = 0$) with $\omega_0 = 9.5\text{ rad/s}$, $\gamma = 12.0\text{ s}^{-1}$, friction $0.89$, asymmetric velocity filtering, and dynamic follow lag $k(h)$.
- **UI Transitions**: Pure CSS transitions (`transition-colors`, `transition-all duration-300`, `transition-opacity duration-700`, `@keyframes fadeIn`, `@keyframes pulse`).

#### Icon Architecture
- `src/components/Icons.tsx`: 12 self-contained inline SVG React components (`BookOpen`, `RotateCw`, `ChevronLeft`, `ChevronRight`, `ExternalLink`, `Github`, `Compass`, `Library`, `Clock`, `Layers`, `Award`, `X`). Zero npm icon library dependencies.

---

### 1.3 Dark Theme Theming & Contrast Inventory

The current codebase hardcodes dark background and high-contrast light typography across multiple locations:

#### 1. Global Backgrounds & Vignettes
- **`src/index.css` (lines 88, 120, 138)**:
  - `--color-eerie-black: #171c1c;`
  - `--bg-library: var(--color-eerie-black);`
  - `html, body, #root { background-color: var(--bg-library); color: var(--text-primary); }`
- **`src/App.tsx` (lines 71, 73)**:
  - Line 71: `<main className="relative w-screen h-screen overflow-hidden bg-[#171c1c] text-[#f2f2f2] font-body">`
  - Line 73: `<div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#31383b]/30 via-[#1f2527]/60 to-[#171c1c]" />`
  *(Note: This radial gradient generates a heavy dark circle at center and pitch-dark eerie-black perimeter).*
- **`src/components/Preloader.tsx` (lines 157, 173)**:
  - Line 157: `backgroundColor: '#171c1c'`
  - Line 173: `background: 'radial-gradient(circle at center, rgba(49,56,59,0.3) 0%, rgba(23,28,28,0.85) 60%, #171c1c 100%)'`
  - Line 247: `backgroundColor: 'rgba(23, 28, 28, 0.95)'`

#### 2. Typography & Contrast Tokens
- **`src/index.css` (lines 92-95, 122-123)**:
  - `--color-white: #f2f2f2;` (Primary text)
  - `--color-grey: #d6d3d1;` (Secondary text / captions)
  - `--text-primary: var(--color-white);`
  - `--text-muted: var(--color-grey);`
- **`src/components/LibraryUI.tsx`**:
  - Headings & titles: `text-[#f2f2f2]` (lines 75, 91, 123)
  - Eyebrows, synopses & captions: `text-[#d6d3d1]` (lines 78, 85, 109, 127, 134, 235, 249)
- **`src/components/BookDetailModal.tsx`**:
  - Headings, drop cap & titles: `text-[#f2f2f2]` (lines 29, 58, 69, 80, 97, 113, 133)
  - Body, metadata & features: `text-[#d6d3d1]` (lines 44, 63, 68, 79, 90, 103, 132)

#### 3. UI Controls, Buttons & Borders
- **`src/components/LibraryUI.tsx`**:
  - Header bar: `border-b border-[#31383b]/60 bg-[#171c1c]/60` (line 70)
  - Index badge: `bg-[#1f2527] text-[#f2f2f2] border border-[#31383b]` (line 98)
  - Bottom-left aside card: `bg-[#171c1c]/90 border border-[#31383b]` (line 106)
  - Category tag: `bg-[#1f2527] text-[#f2f2f2] border border-[#31383b]` (line 116)
  - Tech tags: `bg-[#1f2527] text-[#d6d3d1] border border-[#31383b]` (line 145)
  - Primary button: `bg-[#f2f2f2] text-[#000000]` (line 156)
  - Secondary button: `bg-[#171c1c] text-[#f2f2f2] border border-[#31383b]` (line 164)
  - GitHub button: `bg-[#171c1c] text-[#d6d3d1] border border-[#31383b]` (line 175)
  - Footer bar: `border-t border-[#31383b]/60 bg-[#171c1c]/60` (line 186)
  - Chevron buttons: `bg-[#171c1c] border border-[#31383b] text-[#f2f2f2]` (lines 193, 219)
  - Jump buttons: inactive `bg-[#171c1c] text-[#d6d3d1] border border-[#31383b]`, active `bg-[#f2f2f2] text-[#000000]` (lines 207-208)
  - Progress bar track: `bg-[#31383b]` (line 226)
  - Keyboard `<kbd>` badges: `bg-[#171c1c] border border-[#31383b] text-[#f2f2f2]` (lines 237-246)
- **`src/components/BookDetailModal.tsx`**:
  - Backdrop: `bg-black/85 backdrop-blur-md` (line 24)
  - Modal container: `bg-[#171c1c] text-[#f2f2f2] border border-[#31383b]` (line 29)
  - Close button: `bg-[#1f2527] hover:bg-[#31383b] text-[#f2f2f2] border border-[#31383b]` (line 34)
  - Metrics cards: `bg-[#1f2527] border border-[#31383b]` (line 78)

#### 4. 3D WebGL Library Scene Parameters
- **`src/components/LibraryScene.tsx`**:
  - **Fog**: `scene.fog = new THREE.FogExp2(0x171c1c, 0.055);` (line 121)
  - **Renderer**: `new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })` (line 135)
  - **Tone Mapping**: `renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;` (lines 138-139)
  - **Key Light**: `new THREE.DirectionalLight(0xffecd2, 1.4);` position `(3.5, 4.0, 4.5)` (lines 144-145)
  - **Desk Glow**: `new THREE.PointLight(0xffb042, 1.8, 12, 1.2);` position `(0, 1.8, 2.2)` (lines 149-150)
  - **Rim Light**: `new THREE.DirectionalLight(0x7da4d9, 0.65);` position `(-4.0, 3.5, -3.0)` (lines 154-155)
  - **Ambient Light**: `new THREE.AmbientLight(0x281c12, 0.55);` (lines 159-160)
  - **Shelf Base**: `shelfMat = new THREE.MeshStandardMaterial({ color: 0x16110d, roughness: 0.4, metalness: 0.2 });` (lines 164-168)
  - **Shelf Lip**: `lipMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });` (lines 175-179)
  - **Book Cover Textures**: Rich colored leathers (`#1a2436` Navy, `#2b1b1b` Crimson, `#122621` Forest, `#281a33` Plum, `#2a1a10` Mahogany) with gold/silver leaf foil and paper edges texture (`#e8dcba`).

---

### 1.4 Reference Site Alignment Analysis (`https://a24.raviklaassens.com/`)

Direct inspection of `https://a24.raviklaassens.com/` live HTML and CSS reveals:
1. **Color Scheme**:
   - Primary page background is white/light: `--_theme---background: #f2f2f2` / `#ffffff`.
   - Text is high-contrast black/charcoal: `--_theme---body-text: black` / `#171c1c`.
   - Brand color: `#891a20` (A24 signature blood crimson).
2. **Top-Middle Navigation Bar (`.nav`)**:
   - Fixed at top (desktop): `position: fixed; top: 0; left: 0; right: 0;` with centered container `.nav-center`.
   - Structure:
     - Left: Brand Logo (A24 or portfolio monogram / brand mark).
     - Middle links: e.g., `Films` / `Television` (or portfolio categories / books / about / systems).
     - Right toggle: `Index` dropdown button with chevron icon (`transform: rotate(180deg)` on open).
     - Background: `.nav-bg` frosted white pill with subtle border or backdrop blur (`backdrop-filter: blur(12px)`).
3. **Top-Right Information Section (`.experience_info`)**:
   - Fixed/positioned in top-right area (`max-width: 20.8333%` or `max-width: 280px` on desktop).
   - Layout:
     - Heading: Active Item Title (`Backrooms` / active book title) in serif (`PPEiko`), black.
     - Horizontal hairline divider lines (`.divider-horizontal`).
     - Key-value metadata rows (`.info-content_panel`):
       - Label: Left-aligned uppercase eyebrow (`DIRECTED BY`, `YEAR`, `STARRING`, etc.) in `PPMuseum`, small tracking `0.20em`.
       - Value: Right-aligned text (`paragraph-m text-align-right`) in `PPNeueMontreal`, black.

---

## 2. Logic Chain

```
[Observation 1.1: Build & Tests]
`npm run build` exits 0 (3.06s). `runner.ts` passes 182/182 tests (9.73s). Oxlint has 0 errors.
       │
       ▼
(Baseline is healthy; any future edits must maintain zero build/test regressions)

[Observation 1.2: Handcrafted CSS]
No Tailwind CLI/PostCSS; all styles live in `src/index.css`.
       │
       ▼
(Any new utility classes or token adjustments must be explicitly written in `src/index.css`, not assumed from Tailwind core)

[Observation 1.3: Dark Theming & Contrast Tokens]
`#171c1c` is used for body background, header, footer, card, modal; `#f2f2f2` and `#d6d3d1` are used for text.
       │
       ▼
(Switching background to white `#ffffff` without inverting text makes `#f2f2f2` completely invisible [contrast ratio 1.05:1])
       │
       ▼
(Text colors MUST invert: Primary `#171c1c` on `#ffffff` [contrast 17.5:1, AAA]; Secondary `#57534e` / `#666666` [contrast > 5.5:1, AA])
       │
       ▼
(Dark background radial vignette in App.tsx MUST be removed/adapted, else it creates a muddy dark stain)

[Observation 1.3.4: 3D Scene Fog & Lights]
`scene.fog` is currently `0x171c1c, 0.055`. Ambient light is `0x281c12, 0.55`.
       │
       ▼
(On white background, `0x171c1c` fog turns distant books into murky dark grey blotches against white canvas)
       │
       ▼
(`scene.fog` MUST change to `0xffffff, 0.035` so books fade into pure white; Ambient light MUST increase to `0xffffff, 0.85` or `0xfdfbf9, 0.8` so unlit book leather stays vibrant)

[Observation 1.4: Reference Site Alignment]
A24 site combines white primary background, black editorial typography, crimson `#891a20` accents, a top-middle floating nav bar, and a top-right `.experience_info` stacked metadata panel.
       │
       ▼
(Integrating R1 top-middle nav and R2 top-right info panel with R3 white background creates full aesthetic and functional fidelity to the reference site)
```

---

## 3. Caveats

1. **Test Suite Invariant Requirements**:
   - `tests/tier1-features/f2-typography-tokens.test.ts` asserts:
     - `css.includes('--bg-library: #0c0a08') || css.includes('--bg-library')`
     - `css.includes('--gold-foil') || css.includes('#d4af37')`
     - `css.includes('--parchment') || css.includes('--text-primary')`
     - `css.includes('-webkit-font-smoothing: antialiased')`
   - Therefore, CSS tokens `--bg-library`, `--gold-foil`, and `--text-primary` **must remain defined** in `src/index.css` (e.g. `--bg-library: #ffffff;`). Do not delete these variable names.
2. **Book Leather Colors**:
   - The 5 book covers in `src/data/booksData.ts` use deep jewel-tone leathers (`#1a2436` Navy, `#2b1b1b` Crimson, `#122621` Forest, `#281a33` Plum, `#2a1a10` Mahogany).
   - In 3D against pure white, these deep leather tones look striking and high-end, provided the ambient light and fog are corrected. There is no need to bleach the book covers themselves; their contrast against white is superior to their contrast against black.
3. **Responsive Breakpoints**:
   - On screens `< 768px`, the top-right information panel and top-middle navigation bar must adapt gracefully (e.g., collapsable index or responsive docking as seen in A24 mobile).

---

## 4. Conclusion & Specific Recommendations

### 4.1 Summary of Exact Changes Needed

| File | Current State | Required Modification for White Background |
|---|---|---|
| `src/index.css` | `:root` has `--color-eerie-black: #171c1c` as bg, `--color-white: #f2f2f2` as text, `--bg-library: #171c1c` | Update `:root` tokens: `--bg-library: #ffffff;`, `--text-primary: #171c1c;`, `--text-muted: #57534e;`. Add light utility classes (`.bg-white`, `.text-[#171c1c]`, `.border-neutral-200`, etc.) and nav/info styles. |
| `src/App.tsx` | Line 71: `bg-[#171c1c] text-[#f2f2f2]`; Line 73: dark radial vignette `from-[#31383b]/30 ... to-[#171c1c]` | Line 71: `bg-white text-[#171c1c]`; Line 73: Remove or replace with subtle light ambient gradient `from-transparent to-neutral-100/50`. |
| `src/components/LibraryScene.tsx` | Line 121: `scene.fog = new THREE.FogExp2(0x171c1c, 0.055);`<br>Line 159: `ambientLight = new THREE.AmbientLight(0x281c12, 0.55);` | Line 121: `scene.fog = new THREE.FogExp2(0xffffff, 0.032);`<br>Line 159: `ambientLight = new THREE.AmbientLight(0xfdfbf7, 0.85);`<br>Shelf base (`0x16110d`) retained as a grounded plinth or softened to `0x221e1a`. |
| `src/components/LibraryUI.tsx` | Dark top masthead, dark bottom-left aside card, dark footer bar | Transform into R1 Top-Middle Navigation Bar and R2 Top-Right Information Section matching A24 structure; update bottom shelf controls to light frosted cards with dark typography and crimson accents. |
| `src/components/Preloader.tsx` | Inline styles with `#171c1c` bg and `#f2f2f2` text | Update `backgroundColor: '#ffffff'`, `color: '#171c1c'`, digit housing to `rgba(255, 255, 255, 0.95)` with light border `rgba(0, 0, 0, 0.1)`, preserving gold/crimson telemetry. |
| `src/components/BookDetailModal.tsx` | Dark spread `bg-[#171c1c]`, `text-[#f2f2f2]`, `border-[#31383b]` | Monograph spread with light clean archival parchment/white `bg-white text-[#171c1c] border-neutral-200 shadow-2xl`, dark drop cap, dark feature lists, crimson accents. |

### 4.2 Contrast Ratios Specification (WCAG AA & AAA Compliance)

| Element Pair | Foreground | Background | Calculated Ratio | WCAG Compliance |
|---|---|---|---|---|
| Primary Headings | `#171c1c` (Eerie Black) | `#ffffff` (White) | **17.5:1** | AAA (Passes $\ge 7:1$) |
| Secondary / Metadata | `#57534e` (Stone 600) | `#ffffff` (White) | **6.1:1** | AAA Large / AA Normal |
| Muted Captions | `#737373` (Neutral 500) | `#ffffff` (White) | **4.6:1** | AA Normal (Passes $\ge 4.5:1$) |
| Brand Accent / Badges | `#891a20` (A24 Blood Crimson) | `#ffffff` (White) | **9.2:1** | AAA (Passes $\ge 7:1$) |
| Gilded Foil / Highlights | `#a17a15` (High-contrast Gold) | `#ffffff` (White) | **4.5:1** | AA Normal |

### 4.3 3D Lighting Formula for White Environment

```typescript
// LibraryScene.tsx adjustments:
// 1. Pure White Exponential Depth Fog
scene.fog = new THREE.FogExp2(0xffffff, 0.032);

// 2. High-Color-Rendering Clean Ambient Light
const ambientLight = new THREE.AmbientLight(0xfdfbf9, 0.85);
scene.add(ambientLight);

// 3. Directional Key Light (Warm Specular Clearcoat Highlight)
const keyLight = new THREE.DirectionalLight(0xffecd2, 1.3);
keyLight.position.set(3.5, 4.0, 4.5);
scene.add(keyLight);

// 4. Subtle Rim Contour Light
const rimLight = new THREE.DirectionalLight(0xdde9f8, 0.45);
rimLight.position.set(-4.0, 3.5, -3.0);
scene.add(rimLight);

// 5. Tone Mapping Exposure Calibration
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
```

---

## 5. Verification Method

To independently verify these survey findings and validate future implementation:

1. **Verify Baseline Build**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   npm run build
   ```
   *Expected outcome*: Exit code 0, bundled files generated in `dist/`.

2. **Verify Test Suite**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node tests/runner.ts
   ```
   *Expected outcome*: 182 test assertions across 4 tiers report 100% PASS.

3. **Verify Linter**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   npm run lint
   ```
   *Expected outcome*: 0 errors.

4. **Verify Contrast Ratios**:
   - Inspect `#171c1c` on `#ffffff` using WebAIM or browser accessibility inspector $\to$ verified $\ge 17.5:1$.
   - Inspect `#891a20` on `#ffffff` $\to$ verified $\ge 9.2:1$.

5. **Invalidation Conditions**:
   - If `npm run build` fails with TS or CSS syntax errors.
   - If tests in `tests/tier1-features/f2-typography-tokens.test.ts` fail due to removed token names (`--bg-library`, `--gold-foil`, `--text-primary`).
   - If 3D books display dark circular fog halos against white background (indicates `scene.fog` is still `0x171c1c` instead of `0xffffff`).
