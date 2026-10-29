# Handoff Report: 3D Scene Fog & Studio Lighting Calibration Plan (Feature 2)

**Agent**: `teamwork_explorer_m1_2`  
**Date**: 2026-10-29  
**Working Directory**: `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2`  
**Target File**: `src/components/LibraryScene.tsx`  
**Parent Conversation ID**: `769b646f-c552-41bc-9868-9a381d080792`  
**Patch Artifact**: `library_scene_lighting.patch` (in working directory)

---

## 1. Observation

### 1.1 Existing 3D Scene Fog & Clear Color Configuration
In `src/components/LibraryScene.tsx` (lines 120-140):
```typescript
120:     const scene = new THREE.Scene();
121:     scene.fog = new THREE.FogExp2(0x171c1c, 0.055);
...
135:     const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
136:     renderer.setSize(initialWidth, initialHeight);
137:     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
138:     renderer.toneMapping = THREE.ACESFilmicToneMapping;
139:     renderer.toneMappingExposure = 1.05;
140:     container.appendChild(renderer.domElement);
```
- Line 121 instantiates `new THREE.FogExp2(0x171c1c, 0.055)` using the dark background color `0x171c1c`.
- Line 135 initializes `renderer` with `alpha: true`, allowing the DOM background color behind the canvas (`<main>` in `App.tsx`) to show through.

### 1.2 Existing Lighting Rig Configuration
In `src/components/LibraryScene.tsx` (lines 142-161):
```typescript
142:     // --- 2. Atmospheric Library Lighting Rig ---
143:     // Warm reading lamp key light
144:     const keyLight = new THREE.DirectionalLight(0xffecd2, 1.4);
145:     keyLight.position.set(3.5, 4.0, 4.5);
146:     scene.add(keyLight);
147: 
148:     // Soft amber desk glow
149:     const deskGlow = new THREE.PointLight(0xffb042, 1.8, 12, 1.2);
150:     deskGlow.position.set(0, 1.8, 2.2);
151:     scene.add(deskGlow);
152: 
153:     // High library clerestory window rim light
154:     const rimLight = new THREE.DirectionalLight(0x7da4d9, 0.65);
155:     rimLight.position.set(-4.0, 3.5, -3.0);
156:     scene.add(rimLight);
157: 
158:     // Deep ambient tone
159:     const ambientLight = new THREE.AmbientLight(0x281c12, 0.55);
160:     scene.add(ambientLight);
```
- Line 159 sets `AmbientLight` to `0x281c12, 0.55`. Color `0x281c12` is deep saturated brown ($R=40, G=28, B=18$), yielding an effective ambient intensity of only $\sim 0.08$.
- Line 144 sets `DirectionalLight` to `0xffecd2, 1.4` (warm peachy incandescent lamp).
- Line 149 sets `PointLight` to `0xffb042, 1.8, 12, 1.2` (saturated orange-amber desk glow).
- Line 154 sets `DirectionalLight` to `0x7da4d9, 0.65` (cool sky blue rim light).

### 1.3 Static Zero-Allocation RAF Invariant Enforced in Test Suite
In `tests/tier5-adversarial/tier5-webgl-physics.test.ts` (lines 184-216):
```typescript
184:   await t.test('T5.3 Zero-Allocation RAF Guarantees: Static code audit of tick() in LibraryScene.tsx', () => {
...
190:     const tickStartMatch = content.indexOf('const tick = (now: DOMHighResTimeStamp = performance.now()) => {');
191:     assert.ok(tickStartMatch > 0, 'Must locate tick() function in LibraryScene.tsx');
192: 
193:     const tickEndMatch = content.indexOf('tick();', tickStartMatch);
194:     assert.ok(tickEndMatch > tickStartMatch, 'Must locate end of tick()');
195: 
196:     const tickBody = content.substring(tickStartMatch, tickEndMatch);
197: 
198:     // 1. Verify zero 'new ' operator expressions inside tick()
199:     const newMatches = tickBody.match(/\bnew\s+[A-Za-z0-9_.]+/g);
200:     assert.strictEqual(newMatches, null, `Found forbidden new allocations inside tick(): ${newMatches?.join(', ')}`);
...
208:     // 3. Verify no Array.prototype.map, filter, or slice in tick loop
209:     assert.strictEqual(tickBody.includes('.map('), false, 'No .map() inside tick()');
210:     assert.strictEqual(tickBody.includes('.filter('), false, 'No .filter() inside tick()');
211:     assert.strictEqual(tickBody.includes('.slice('), false, 'No .slice() inside tick()');
```
- Line 199 statically asserts that zero `new ` expressions exist between `const tick =` (line 390) and `tick();` (line 574).
- Lines 208-211 assert that `.map()`, `.filter()`, and `.slice()` are forbidden inside `tick()`.

---

## 2. Logic Chain

### 2.1 Scene Fog Recalibration to Pure White (`0xffffff, 0.032`)
1. **From Observation 1.1**: The Three.js canvas has `alpha: true` and is overlaid directly on top of the DOM background.
2. In Three.js standard materials (`MeshPhysicalMaterial`, `MeshStandardMaterial`), the fragment shader computes fog via:
   $$\text{color} = \text{mix}(\text{fragColor}, \text{fogColor}, \text{fogFactor})$$
3. In the dark theme, mixing toward `0x171c1c` blended receding meshes into the dark `#171c1c` background. But when the page background is changed to `#ffffff`, mixing toward `0x171c1c` produces a dark charcoal silhouette/smoke halo around receding book meshes (at $Z < 0$) and shelf ends, destroying visual continuity.
4. Setting `scene.fog = new THREE.FogExp2(0xffffff, 0.032)` mixes receding fragments toward pure white `#ffffff`:
   - At active book distance ($d \approx 4.8$): $\text{fogFactor} = 1 - e^{-(4.8 \times 0.032)} = 1 - e^{-0.1536} \approx 0.14$. The active book retains 86% of its direct crisp contrast with a delicate studio atmospheric softening.
   - At neighbor tomes ($d \approx 6.0$): $\text{fogFactor} \approx 0.17$, maintaining full clarity of typography and cover art.
   - At shelf horizon ends ($X = \pm 16, d \approx 16.7$): $\text{fogFactor} = 1 - e^{-(16.7 \times 0.032)} \approx 0.42$, allowing the dark mahogany shelf to seamlessly dissolve into the pure white infinity horizon without jarring clipped polygon edges.

### 2.2 Studio Lighting Rig Calibration
1. **Ambient Light (`new THREE.AmbientLight(0xfdfbf7, 0.85)`)**:
   - **From Observation 1.2**: Current ambient light is `0x281c12, 0.55` (effective luminance $\approx 0.08$). Against pure white (`#ffffff`), human contrast perception adapts to white luminance (1.0). The dark leather book covers (`#1a2436` midnight navy, `#2b1b1b` deep oxblood, `#281a33` obsidian purple) appear nearly black and underexposed, obscuring leather grain and cover details.
   - Adjusting ambient light to `0xfdfbf7, 0.85` provides a pristine, high-end gallery studio fill ($R=253, G=251, B=247$ — neutral warm white) that elevates dark leather base tones, preserving rich color fidelity and leather grain visibility.
2. **Directional Key Light (`new THREE.DirectionalLight(0xfff8f0, 1.25)`)**:
   - **From Observation 1.2**: Current key light is `0xffecd2, 1.4` at `(3.5, 4.0, 4.5)`. The color `0xffecd2` has a noticeable peachy-amber tint, and combined with raised ambient (0.85), an intensity of 1.4 risks blowing out specular clearcoat highlights on the active book.
   - Calibrating to `0xfff8f0` (clean studio warm) at intensity `1.25` strikes an optimal balance: it casts razor-sharp specular highlights across the `MeshPhysicalMaterial` clearcoat (`clearcoat: 0.5`, `clearcoatRoughness: 0.08`), illuminating gold foil typography with metallic brilliance while preventing highlight clipping.
3. **Desk Glow Point Light (`new THREE.PointLight(0xffecd2, 0.9, 12, 1.4)`)**:
   - **From Observation 1.2**: Current point light is `0xffb042, 1.8` at `(0, 1.8, 2.2)`. Heavy orange (`0xffb042`) creates an unnatural amber stain on white surfaces.
   - Reducing intensity to `0.9` with clean warm color `0xffecd2` and decay `1.4` transforms it into a subtle fill light that gently illuminates the brass shelf lip (`#d4af37`, roughness 0.25, metalness 0.85) and bottom edge of the books without casting an orange tint across the white page.
4. **Rim Light (`new THREE.DirectionalLight(0x94b4dc, 0.55)`)**:
   - **From Observation 1.2**: Current rim light is `0x7da4d9, 0.65` at `(-4.0, 3.5, -3.0)`.
   - Calibrating to `0x94b4dc, 0.55` provides crisp silhouette delineation between dark leather spine edges and the white background without neon blue saturation.
5. **Renderer Tone Mapping Exposure (`renderer.toneMappingExposure = 1.02`)**:
   - **From Observation 1.1**: Current exposure is `1.05` under `ACESFilmicToneMapping`.
   - Calibrating exposure to `1.02` (within contract range `1.0 - 1.05`) compresses highlight shoulders smoothly, preventing clipping on the pure white canvas while maintaining punchy micro-contrast.

### 2.3 Verification of the Zero-Allocation RAF Invariant
1. **From Observation 1.3**: Test `T5.3` in `tests/tier5-adversarial/tier5-webgl-physics.test.ts` statically scans lines between `const tick =` and `tick();` for any `new ` expressions or array iteration methods.
2. All proposed adjustments are **100% confined to scene setup inside `useEffect`** (lines 121, 139, 142-161):
   - `scene.fog` is instantiated once at scene creation.
   - `keyLight`, `deskGlow`, `rimLight`, and `ambientLight` are instantiated once and added to the scene.
   - `renderer.toneMappingExposure` is assigned once on the renderer instance.
3. The `tick()` animation loop (lines 390-574) remains completely untouched. No object allocations (`new THREE.*`), closures, or array methods are introduced.
4. Therefore, the zero-allocation invariant is completely preserved and `T5.3` will continue to pass unconditionally.

---

## 3. Caveats

1. **DOM Container Synchronization**:
   - While `LibraryScene.tsx` sets `scene.fog = new THREE.FogExp2(0xffffff, 0.032)` and uses a transparent canvas (`alpha: true`), the parent container `<main>` in `src/App.tsx` and the background tokens in `src/index.css` must simultaneously be switched to `#ffffff` (Feature 1 scope). If the DOM background remained `#171c1c`, white fog would produce a white haze over a dark screen.
2. **GPU Warming Shader Cache**:
   - During initial load, `prepareSceneAssets` compiles shaders via `renderer.compileAsync(scene, camera)`. Because `scene.fog` is present during scene assembly before `compileSceneWithTimeout` runs, the Three.js shader pipeline primes the white fog shader variations upfront with zero runtime compilation stutter.
3. **Texture Clearcoat Specularities**:
   - Canvas textures generated by `textureGenerators.ts` include gold foil lettering rendered with canvas linear gradients. The adjusted directional light `1.25` at `0xfff8f0` enhances the metallic gold sheen without washing out the dark leather base texture.

---

## 4. Conclusion

1. **Exact Code Changes Required in `src/components/LibraryScene.tsx`**:
   - Line 121:
     ```typescript
     // Before
     scene.fog = new THREE.FogExp2(0x171c1c, 0.055);
     // After
     scene.fog = new THREE.FogExp2(0xffffff, 0.032);
     ```
   - Line 139:
     ```typescript
     // Before
     renderer.toneMappingExposure = 1.05;
     // After
     renderer.toneMappingExposure = 1.02;
     ```
   - Lines 142-161:
     ```typescript
     // Before
     // --- 2. Atmospheric Library Lighting Rig ---
     // Warm reading lamp key light
     const keyLight = new THREE.DirectionalLight(0xffecd2, 1.4);
     keyLight.position.set(3.5, 4.0, 4.5);
     scene.add(keyLight);

     // Soft amber desk glow
     const deskGlow = new THREE.PointLight(0xffb042, 1.8, 12, 1.2);
     deskGlow.position.set(0, 1.8, 2.2);
     scene.add(deskGlow);

     // High library clerestory window rim light
     const rimLight = new THREE.DirectionalLight(0x7da4d9, 0.65);
     rimLight.position.set(-4.0, 3.5, -3.0);
     scene.add(rimLight);

     // Deep ambient tone
     const ambientLight = new THREE.AmbientLight(0x281c12, 0.55);
     scene.add(ambientLight);

     // After
     // --- 2. Studio Lighting Rig (Pure White Theming) ---
     // Key directional light: crisp specular highlights on gold foil typography
     const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.25);
     keyLight.position.set(3.5, 4.0, 4.5);
     scene.add(keyLight);

     // Soft warm desk fill: gentle illumination on lower book boards and brass shelf inlay
     const deskGlow = new THREE.PointLight(0xffecd2, 0.9, 12, 1.4);
     deskGlow.position.set(0, 1.8, 2.2);
     scene.add(deskGlow);

     // Cool rim light: crisp silhouette separation between dark leather spines and white background
     const rimLight = new THREE.DirectionalLight(0x94b4dc, 0.55);
     rimLight.position.set(-4.0, 3.5, -3.0);
     scene.add(rimLight);

     // Clean studio ambient light: lifts deep leather tones and prevents muddy shadows on white
     const ambientLight = new THREE.AmbientLight(0xfdfbf7, 0.85);
     scene.add(ambientLight);
     ```

2. **Patch Artifact Available**:
   The full machine-applicable diff is saved at `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2\library_scene_lighting.patch`.

3. **Zero-Allocation Invariant**:
   Strictly zero allocations or array calls in `tick()`. All modifications are 100% confined to one-time initialization in `useEffect`.

---

## 5. Verification Method

### 5.1 Static Code Audit & Zero-Allocation RAF Invariant
Run the Tier 5 adversarial physics and WebGL test suite:
```powershell
cd C:\Users\kangy\Desktop\Portfolio
node --test tests/tier5-adversarial/tier5-webgl-physics.test.ts
```
- **Assertion `T5.3`**: Audits `LibraryScene.tsx` to verify zero `new ` allocations, zero `.map()`, `.filter()`, `.slice()` inside `tick()`, and presence of pre-allocated scratch objects (`CAMERA_ORIGIN`, `RAYCAST_MOUSE`, `raycaster`).
- **Expected Result**: 16/16 tests PASS.

### 5.2 Full Test Suite Regression Check
Run all 26 test files across 4 tiers:
```powershell
cd C:\Users\kangy\Desktop\Portfolio
node tests/runner.ts
```
- **Expected Result**: 182/182 assertions PASS (100.0%).

### 5.3 Production Build Verification
Verify TypeScript type-checking and Vite production asset bundling:
```powershell
cd C:\Users\kangy\Desktop\Portfolio
npm run build
```
- **Expected Result**: Clean exit with code 0.

### 5.4 Invalidation Conditions
- Any introduction of `new THREE.*` or `.map()` inside `tick()` will fail test `T5.3`.
- Any fog color other than `#ffffff` or `0xffffff` will produce dark halo fringes against the white background.
- Ambient light below 0.70 will result in dark, muddy book covers lacking contrast against pure white.
