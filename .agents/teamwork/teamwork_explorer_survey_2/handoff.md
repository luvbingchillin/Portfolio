# Handoff Report: Portfolio Codebase Architecture & Navigation/Info Inventory

**Agent**: `survey_explorer_2`  
**Date**: 2026-10-29  
**Working Directory**: `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_survey_2`  
**Parent Conversation ID**: `769b646f-c552-41bc-9868-9a381d080792`

---

## 1. Observation

### 1.1 Project Structure & Build Baseline
- **Framework & Dependencies** (`package.json:12-26`):
  - React 19.3.1 (`react`, `react-dom`)
  - Three.js 0.182.0 (`three`, `@types/three`)
  - Vite 8.3.5 (`vite`, `@vitejs/plugin-react`)
  - TypeScript 7.0.2 (`typescript`)
  - Oxlint 1.89.0 (`oxlint`)
- **Build Status**: Command `cd C:\Users\kangy\Desktop\Portfolio; npm run build` (`tsc -b && vite build`) executes cleanly with zero errors (`exit code 0`, 27 modules transformed, producing `dist/assets/index-BweFzqQe.js`).
- **Test Suite Status**:
  - `node tests/runner.ts` executes 26 test files across 4 tiers: **182/182 assertions PASS (100.0%)** in 8.98s.
  - `node --test tests/tier5-adversarial/*.ts`: **41/41 assertions PASS (100.0%)** in 1.83s.
  - Total: **223 passed assertions, 0 failures**.

---

### 1.2 Existing Navigation Inventory & Mechanisms
- **State Architecture** (`src/App.tsx:8-25`):
  - `activeIndex` (state number, 0 to 4): Tracks the currently active/focused monograph book.
  - `isFlipped` (state boolean): Tracks whether the book spine/back cover is shown instead of the front cover.
  - `isSpreadOpen` (state boolean): Tracks whether the two-page detail reading spread modal is open.
  - `isLoaded` & `isPreloaderMounted` (booleans): Preloader state.
- **Rendered Navigation Controls**:
  1. **Top Bar** (`src/components/LibraryUI.tsx:69-102`):
     - Currently a full-width floating masthead container (`border-b border-[#31383b]/60 bg-[#171c1c]/60 backdrop-blur-md`).
     - Contains:
       - Brand title: `The Athenaeum // Monograph Series // Vol. 2026`
       - Status indicator: `COLLECTION 01 • COMPUTATIONAL SYSTEMS | UTC {currentTime}`
       - Right badge: `INDEX [{formatIndex(activeIndex)} / {formatIndex(books.length - 1)}]` (non-interactive label)
     - **Observation**: The current top bar contains *zero* clickable navigation links.
  2. **Catalog Aside Card (Middle-Left)** (`src/components/LibraryUI.tsx:153-181`):
     - `Open Folio [Enter]` button: Triggers `onOpenSpread()` -> opens `BookDetailModal`.
     - `Flip Spine [Space]` / `Show Front` button: Triggers `onToggleFlip()` -> rotates active book $180^\circ$ ($0 \leftrightarrow \pi$).
     - External GitHub icon anchor: `<a href={activeBook.githubUrl} target="_blank" rel="noopener noreferrer">` -> opens repository in new tab.
  3. **Bottom Bar (Shelf Navigation)** (`src/components/LibraryUI.tsx:186-255`):
     - `ChevronLeft` button: Triggers `onSelectIndex(Math.max(0, activeIndex - 1))`, disabled when `activeIndex === 0`.
     - Numbered jump buttons (`01` through `05`): Triggers `onSelectIndex(idx)` for each book index.
     - `ChevronRight` button: Triggers `onSelectIndex(Math.min(books.length - 1, activeIndex + 1))`, disabled when `activeIndex === books.length - 1`.
     - Continuous progress indicator bar: `width: progressRatio%` (`src/components/LibraryUI.tsx:226-231`).
     - Keycap hints (`src/components/LibraryUI.tsx:234-253`): `← → Browse`, `Space Flip Spine`, `Enter Open Folio`, `Drag / Scroll Shelf`.
  4. **Modal Navigation** (`src/components/BookDetailModal.tsx:32-38, 137-159`):
     - Close `X` button: Triggers `onClose()` (`Escape` key also bound).
     - External links: `Source Code` (`book.githubUrl`) and `Live System` (`book.liveUrl`).
  5. **3D Canvas Direct Manipulation** (`src/components/LibraryScene.tsx:577-666`):
     - Mouse drag horizontally: Updates `targetScroll -= deltaX * 0.0075`. On mouseup (`totalDrag > 8px`), snaps to `Math.round(targetScroll)` and calls `onSelectBook(clamped)`.
     - Raycast click (`totalDrag <= 8px`):
       - Clicking active book (when not mid-flip) calls `onOpenSpread()` (`LibraryScene.tsx:637-640`).
       - Clicking neighboring book calls `onSelectBook(clickedIdx)` (`LibraryScene.tsx:642-643`).
     - Mouse wheel (`wheel` event): Adjusts `targetScroll += delta * 0.003`.
  6. **Global Keyboard Listeners** (`src/App.tsx:27-50`):
     - Ignored when `isSpreadOpen || !isLoaded`.
     - `ArrowLeft`: `setActiveIndex(prev => Math.max(0, prev - 1))`
     - `ArrowRight`: `setActiveIndex(prev => Math.min(BOOKS_CATALOG.length - 1, prev + 1))`
     - `Space`: `setIsFlipped(prev => !prev)`
     - `Enter`: `setIsSpreadOpen(true)`

---

### 1.3 Existing Information & Content Inventory
- **Site Metadata** (`index.html:7`):
  - Page title: `Athenaeum // Kang's Portfolio & Archive`
- **Curator / Author Identity** (`src/data/booksData.ts`, `src/components/BookDetailModal.tsx:132-134`):
  - Name: `Kang Yuchen` (curator of all catalog monographs)
  - GitHub username: `luvbingchillin`
  - GitHub URLs: `https://github.com/luvbingchillin/Code-search`, `https://github.com/luvbingchillin/Portfolio`, profile: `https://github.com/luvbingchillin`
- **Catalog Dataset** (`src/data/booksData.ts:3-154`):
  - Contains exactly 5 monographs (`BOOKS_CATALOG`):
    1. **Code Search Engine** (2026, Systems & Tools, Call No: `QA 76.73 .C63 2026`, Stack: `TypeScript`, `Rust`, `Tree-Sitter`, `Vector Search`, `React`)
    2. **Biomedical Vision** (2025, Machine Learning, Call No: `RC 78.7 .D53 2025`, Stack: `Python`, `PyTorch`, `OpenCV`, `Scikit-Image`, `CUDA`)
    3. **Physical Rendering** (2025, Graphics & 3D, Call No: `T 385 .G72 2025`, Stack: `WebGL 2.0`, `Three.js`, `GLSL Shaders`, `Vite`, `TypeScript`)
    4. **Autonomous Agents** (2026, Systems & Tools, Call No: `Q 335 .O73 2026`, Stack: `Node.js`, `TypeScript`, `WebSockets`, `SQLite`, `Docker`)
    5. **Athenaeum Archive** (2026, Interactive, Call No: `Z 675 .A84 2026`, Stack: `React 19`, `Three.js`, `TypeScript`, `Vite`, `Canvas 2D API`)
  - Each item features: `id`, `title`, `subtitle`, `edition`, `callNumber`, `year`, `category`, `curator`, `shortDescription`, `fullSynopsis`, `techStack` (3-5 items), `metrics` (exactly 3 items), `keyFeatures` (4 items), `coverColor`, `accentColor`, `pagesEdgeColor`, `githubUrl`, `liveUrl`, `stackShelf`.
- **System Telemetry & Status**:
  - Live 24-hour UTC chronometer (`src/components/LibraryUI.tsx:38-55`): `now.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'UTC' })`.
  - Collection identifier: `COLLECTION 01 • COMPUTATIONAL SYSTEMS`.
  - Preloader telemetry: `REV. 2026.10 // 60 FPS LOCKED`, `CALIBRATING WebGL2` / `PIPELINE PRIMED // LAUNCHING`.

---

### 1.4 3D Scene Architecture (`src/components/LibraryScene.tsx`)
- **Technology**: Vanilla Three.js (`import * as THREE from 'three'`). No `@react-three/fiber` or `@react-three/drei`.
- **Mount & Lifecycle**:
  - Attached via `mountRef = useRef<HTMLDivElement>(null)` (`LibraryScene.tsx:114-140, 718-722`).
  - Container div has `absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none`.
- **Renderer Settings** (`LibraryScene.tsx:135-140`):
  ```ts
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(initialWidth, initialHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  ```
  Note: `alpha: true` enables transparency over whatever CSS background is behind the canvas.
- **Scene Fog & Clear Color** (`LibraryScene.tsx:120-121`):
  ```ts
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x171c1c, 0.055);
  ```
  **CRITICAL OBSERVATION**: Fog color is hardcoded to dark charcoal `0x171c1c` with density `0.055`. If the page background changes to `#ffffff` without modifying `scene.fog`, all books and the shelf will be veiled in a muddy dark shadow.
- **Camera Configuration** (`LibraryScene.tsx:126-133, 566-570`):
  - `PerspectiveCamera(38, safeAspect(...), 0.1, 100)` at `(0, 0.4, 4.8)` looking at `(0, 0, 0)`.
  - Subtle mouse sway: `camera.position.x = state.mouseX * 0.15; camera.position.y = 0.4 + state.mouseY * 0.1`.
- **Lighting Rig** (`LibraryScene.tsx:142-161`):
  - Warm Key Light: `DirectionalLight(0xffecd2, 1.4)` at `(3.5, 4.0, 4.5)`
  - Amber Desk Glow: `PointLight(0xffb042, 1.8, 12, 1.2)` at `(0, 1.8, 2.2)`
  - Rim Light: `DirectionalLight(0x7da4d9, 0.65)` at `(-4.0, 3.5, -3.0)`
  - Ambient Light: `AmbientLight(0x281c12, 0.55)` (deep warm dark brown)
- **Geometry & Materials**:
  - Shelf: `BoxGeometry(32, 0.35, 3.5)` with `MeshStandardMaterial({ color: 0x16110d, roughness: 0.4, metalness: 0.2 })` at `(0, -1.38, 0)`.
  - Brass Lip: `BoxGeometry(32, 0.05, 0.06)` with `MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 })`.
  - 3D Books (5 groups): Box geometries for Front, Back, Spine, Pages Block, Silk Ribbon.
    - Leather edges: `MeshPhysicalMaterial({ color: book.coverColor, roughness: 0.4, metalness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.1 })`.
    - Procedural CanvasTextures generated dynamically via `src/utils/textureGenerators.ts`.
- **Cylindrical Arc & Spring Physics** (`LibraryScene.tsx:403-446, 520-564`):
  - Damped harmonic oscillator differential equation: $\omega_0 = 9.5\text{ rad/s}, \gamma = 12.0\text{ s}^{-1}, \text{friction} = 0.89$.
  - Arc positioning: $\theta = 0.35 \times \text{offset}$, $X = \sin(\theta) \times 5.52$, $Z = \cos(\theta) \times 2.4 - 2.4$.
  - Drag banking: `flowLean`, `flowBank`, `flowDip` based on `smoothedVelocity`.
  - Render loop dirty flag short-circuits rendering at equilibrium (`0% GPU`).

---

### 1.5 UI Overlays & Layering Architecture
- **Root DOM Tree** (`src/App.tsx:71-113`):
  1. `<main className="relative w-screen h-screen overflow-hidden bg-[#171c1c] text-[#f2f2f2] font-body">`
  2. Background atmosphere: `<div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(...)] ... />`
  3. 3D WebGL Canvas (`<LibraryScene />`): Container has `absolute inset-0 w-full h-full cursor-grab ...` (`z-index: auto` / base layer 0).
  4. Preloader (`<Preloader />`): `fixed inset-0 z-[9999]`, background `#171c1c`.
  5. UI Overlay container (`src/App.tsx:95`): `<div className="transition-opacity duration-700 ...">` wrapping `<LibraryUI />`.
  6. Modal (`<BookDetailModal />`): `fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md`.
- **`LibraryUI` Overlay Styling & Event Pass-Through** (`src/components/LibraryUI.tsx:67`):
  - Container: `absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-8 z-10 select-none`.
  - By setting `pointer-events-none` on the full container and `pointer-events-auto` on `<header>`, `<aside>`, and `<footer>`, click and drag events in the center of the viewport pass directly into the 3D canvas `renderer.domElement`.

---

## 2. Logic Chain

### 2.1 Top-Middle Navigation Bar Adaptation Logic
1. **Reference Requirement**:
   - The reference website (`https://a24.raviklaassens.com/`) features a centered floating dock/pill navigation bar (`.nav`) at `top: 0; left: 0; right: 0; display: flex; justify-content: center` with:
     - Left brand mark / logo.
     - Section/collection links (e.g., "Films", "Television").
     - An "Index" trigger button that opens an animated dropdown list of all titles with years, with smooth scrolling/selection.
2. **Local Portfolio Data Mapping**:
   - The Portfolio already has an exact 1-to-1 counterpart:
     - Brand mark: "ATHENAEUM" or "KANG" logo mark.
     - Section tabs: "Works" / "Projects" (or "Archive" / "Catalog").
     - "Index" button with dropdown list: Contains the 5 catalog monographs (`Code Search Engine`, `Biomedical Vision`, `Physical Rendering`, `Autonomous Agents`, `Athenaeum Archive`) along with their publication years (`2026`, `2025`).
   - Action mechanism:
     - Clicking an item in the Index dropdown dispatches `onSelectIndex(idx)`.
     - Because `LibraryScene`'s harmonic oscillator responds to `activeIndex` changes via `stateRef.current.targetScroll = activeIndex`, selecting an item from the dropdown smoothly glides the 3D book carousel to that monograph immediately.
   - Preserves all keyboard bindings (`ArrowLeft`, `ArrowRight`, `Space`, `Enter`) established in `App.tsx:27-45`.

### 2.2 Top-Right Information Section Adaptation Logic
1. **Reference Structure (`.experience_info`)**:
   - In `a24.raviklaassens.com`, `.experience_info` is a structured metadata panel consisting of:
     - Title: `heading-s` (e.g. "BACKROOMS")
     - Table rows (`.info-content_panel`) separated by hairline horizontal dividers (`.divider-horizontal`):
       - Left label: `subheading-xs` uppercase (e.g. `DIRECTED BY`, `YEAR`, `STARRING`)
       - Right value: `paragraph-m` right-aligned (e.g. `Kane Parsons`, `2026`, `Chiwetel Ejiofor`)
2. **Current Portfolio Allocation**:
   - Currently, `LibraryUI.tsx` places the active monograph metadata in a bulky floating card on the bottom-left (`<aside className="... bg-[#171c1c]/90 ...">`), while the top bar has redundant status text (`COLLECTION 01 • COMPUTATIONAL SYSTEMS`).
3. **Clean Adaptation to Top-Right**:
   - Move active monograph metadata to a fixed/absolute container in the top right (`top: 1.5rem; right: 2rem; width: 280px-320px; z-index: 20`):
     - **Title**: `activeBook.title.toUpperCase()` (`font-heading`, tracking `-0.04em`)
     - **Row 1**: `CURATED BY` (left, `font-eyebrow`) — `Kang Yuchen` (right, `font-body`)
     - **Row 2**: `YEAR` — `activeBook.year`
     - **Row 3**: `CATEGORY` — `activeBook.category`
     - **Row 4**: `CALL NUMBER` — `activeBook.callNumber` (or primary tech stack)
     - **Divider rules**: `border-t border-black/10` or `#e5e7eb`
   - Additional details (full synopsis, drop cap, 3 metrics, key features) remain accessible via "Open Folio" in the bottom controls or when clicking the 3D book, which opens the full `BookDetailModal`.
   - Live UTC chronometer (`UTC {currentTime}`) can sit cleanly either in the nav bar or above the information section.

### 2.3 White Background Color & Visual Styling Adaptation Logic
1. **DOM & Canvas Alpha Alignment**:
   - In `App.tsx:71`, `bg-[#171c1c]` must be updated to `bg-white` (`#ffffff`).
   - The dark radial gradient vignette in `App.tsx:73` (`bg-[radial-gradient(...)] from-[#31383b]/30 ...`) must be removed or switched to a clean, subtle off-white/light gradient.
   - `index.css:88, 120, 138`: Update `--color-eerie-black` / `--bg-library` to `#ffffff`, and `--text-primary` to `#171c1c` / `#000000`.
2. **3D Scene Fog Invalidation & Correction**:
   - Observation: `scene.fog = new THREE.FogExp2(0x171c1c, 0.055)` in `src/components/LibraryScene.tsx:121`.
   - On a white canvas, this dark fog darkens receding books into muddy black silhouette edges.
   - Solution: Update fog color to `0xffffff` with subtle density (`0.035` - `0.045`), or replace with `THREE.Fog(0xffffff, 4.0, 9.5)`. This ensures receding books fade naturally into the pure white background.
3. **Lighting Rig Contrast Adjustments**:
   - In `LibraryScene.tsx:142-161`:
     - Key light (`DirectionalLight` 1.4): Maintain warm key light (`0xfff8f0`, 1.35) to cast crisp highlights on gold foil stamping.
     - Ambient light: Currently `0x281c12, 0.55`. Against white, dark leather covers (`#1a2436`, `#2b1b1b`, `#281a33`, `#2a1a10`) appear very dark. Raising ambient light to neutral soft warm (`0x606060` or `0x55504a`, intensity 0.75 - 0.85) ensures rich leather grain visibility without washing out gold foil stamping.
     - Desk glow point light: Adjust from heavy orange `0xffb042` to warm golden radiance (`0xffe2a0`, 1.2).
   - Shelf base: Dark mahogany shelf (`#16110d`) with brass lip (`#d4af37`) provides a handsome architectural pedestal anchoring the 3D books against the white background.
4. **UI Contrast & Theming**:
   - Text color: `#000000` / `#171c1c` for headings and primary copy; `#555555` / `#666666` for labels and muted eyebrows.
   - Floating nav container: `rgba(255, 255, 255, 0.85)` with `backdrop-filter: blur(12px)` and subtle border `rgba(0, 0, 0, 0.08)`.
   - Action buttons: White pill buttons with dark borders (`border border-black/15 text-black hover:border-black/50`).

---

## 3. Caveats
1. **Test Invariants**:
   - Existing tests in `tests/tier1-features/f4-editorial-ui.test.ts` and `tests/tier5-adversarial/tier5-ui-preloader.test.ts` assert specific catalog properties (e.g. `fullSynopsis`, `callNumber`, `metrics.length === 3`, `dropCapChar`). All underlying catalog data in `src/data/booksData.ts` and the modal contracts in `BookDetailModal.tsx` must be preserved intact.
2. **Zero-Allocation RAF Invariant**:
   - Test `T5.3 Zero-Allocation RAF Guarantees` in `tests/tier5-adversarial/tier5-webgl-physics.test.ts` scans `tick()` in `LibraryScene.tsx` for object allocations (`new THREE.*`, `map()`, `filter()`). Any adjustments to lighting or fog must be made during scene initialization (`useEffect`), NOT inside the `tick()` animation loop.
3. **Mobile & Viewport Scaling**:
   - On screens `< 768px`, the top-middle nav bar should collapse its items cleanly or hide redundant labels, and the top-right information section should collapse to an expandable pill or dock below the canvas to prevent overlapping mobile viewports.

---

## 4. Conclusion
1. **Existing Navigation**:
   - Catalog contains 5 project books (`0` to `4`).
   - Current navigation is driven by bottom shelf buttons (`01`-`05`, chevrons), keyboard arrow keys, and direct 3D mouse drag/wheel/raycast interactions.
   - The top masthead contains no navigation links and can be cleanly replaced by the reference website's **Top-Middle Navigation Bar** featuring brand logo, section tabs, and an interactive **Index dropdown** that lists all 5 monographs and dispatches `onSelectIndex(idx)`.
2. **Existing Information**:
   - Complete metadata exists for Curator (`Kang Yuchen`), GitHub (`luvbingchillin`), and all 5 books (Title, Year, Category, Stack, Call Number, Shelf).
   - These map directly and cleanly into the reference website's **Top-Right Information Section** (`.experience_info`) format with stacked label-value rows and horizontal divider rules.
3. **3D Scene Architecture**:
   - Built with vanilla Three.js (`alpha: true`), rendering inside a full-screen canvas.
   - Switching the primary background to `#ffffff` requires:
     1. Updating `scene.fog` from dark `0x171c1c` to white `0xffffff`.
     2. Moderating ambient lighting from `0x281c12` to neutral warm (`0x606060`, ~0.80) to preserve rich leather textures against white.
     3. Replacing the dark vignette overlay in `App.tsx` with clean white/transparent backdrop.
4. **UI Overlays**:
   - Layered cleanly via `z-index`: Canvas (`z-0`), UI Overlays (`z-10` with `pointer-events-none` container), Modal (`z-50`), Preloader (`z-9999`).
   - The new top-middle nav bar and top-right information section fit naturally into this overlay structure without disrupting canvas pointer events.

---

## 5. Verification Method

To independently verify all findings and validate future implementations:

1. **Build Verification**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   npm run build
   ```
   *Expected result*: Exits with code 0; `dist/index.html` and bundles built cleanly.

2. **Core 4-Tier Test Suite Verification**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node tests/runner.ts
   ```
   *Expected result*: 182 / 182 assertions pass across all 4 tiers with 100% success.

3. **Tier 5 Adversarial Test Verification**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node --test tests/tier5-adversarial/*.ts
   ```
   *Expected result*: 41 / 41 assertions pass with 100% success.

4. **Code Inspection**:
   - `src/App.tsx`: Verify overlay hierarchy and keyboard bindings.
   - `src/components/LibraryUI.tsx`: Verify existing navigation controls and metadata bindings.
   - `src/components/LibraryScene.tsx`: Lines 120-161 for `scene.fog`, renderer `alpha`, and lighting rig.
   - `src/data/booksData.ts`: Verify 5 monographs and metadata completeness.

5. **Invalidation Conditions**:
   - Any modification to `LibraryScene.tsx` `tick()` that introduces object instantiations (`new THREE.Vector3`) will fail Tier 5 test `T5.3`.
   - Removing required book fields (`callNumber`, `stackShelf`, `metrics`, `fullSynopsis`) will fail Tier 1 Feature 4 tests.
