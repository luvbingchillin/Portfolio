# Reverse Engineering A24 Films (raviklaassens.com)

A comprehensive architectural and technical breakdown of the 3D, design, shader, and motion systems powering [a24.raviklaassens.com](https://a24.raviklaassens.com/).

---

## 1. High-Level Technology Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Framework** | **Astro** + Webflow export | SSG/SSR performance with clean DOM output |
| **3D Engine** | **Three.js (r178)** | WebGL2 rendering pipeline on full-screen canvas |
| **Smooth Scroll** | **Lenis** | Momentum & inertia smooth scrolling |
| **Page Transitions** | **Barba.js** | Seamless SPA transitions between `/` (Films) and `/television` |
| **Animation Engine**| **GSAP & ScrollTrigger** | High-performance timeline coordination and micro-interactions |
| **Typography Engine** | Custom Text Balancing script | Balances text line breaks (`[data-balance-lines]`) |

---

## 2. 3D Scene & Camera Configuration

The gallery uses an isometric-leaning perspective view that gives the discs an elegant slanted studio presentation.

```typescript
const cameraConfig = {
  cameraFOV: 40,
  cameraDistance: 4.4,
  galleryRotX: -30,    // Rotated -30 deg on X
  galleryRotY: -30,    // Rotated -30 deg on Y
  galleryScale: 1.08,
  exposure: 0.86,
  fogColor: '#FFFFFF',
  fogNear: 7,
  fogFar: 14
};
```

### Studio Lighting Setup
The iridescent sheen and specular plastic highlights are driven by a specialized 4-point studio rig:
1. **Key Light**: `DirectionalLight` (`#FFF9E8` warm tint, intensity `0.75`, position `[3.5, -8, 6]`)
2. **Fill Light**: `DirectionalLight` (`#FFFFFF`, intensity `0.3`, position `[-5, -2, 4]`)
3. **Rim Light**: `DirectionalLight` (`#499FF5` cool blue, intensity `0.75`, position `[0, 3, -6]`)
4. **Studio Softbox**: `RectAreaLight` + `RectAreaLightUniformsLib` (intensity `1.9`) positioned above to cast elongated linear reflections across the disc faces.
5. **Ambient Light**: `0.25` intensity to keep deep shadows clean without losing contrast.

---

## 3. Disc Geometry Construction

The CD/DVD disc is composed of multiple concentric meshes built with mathematical precision:

```
[ Center Hole: r = 0.14 ]
       ↓
[ Frosted Hub Ring: r = 0.14 → 0.24 ] (LatheGeometry with inner bevel)
       ↓
[ Matrix Code Ring: r = 0.24 → 0.32 ] (Radial gradient + concentric serial tracks)
       ↓
[ Front / Back Faces: r = 0.24 → 0.974 ] (RingGeometry, 220 radial segments)
       ↓
[ Outer Rim Bevel: r = 0.974 → 1.0 ] (LatheGeometry, 256 segments)
```

### Exact Geometric Dimensions
```typescript
const discDimensions = {
  holeSize: 0.14,          // Central clamp hole
  hubSize: 0.24,           // Transparent plastic hub boundary
  discThickness: 0.01,     // Physical disc depth
  edgeBleed: 0.026,        // Outer clear plastic margin
  edgeBevel: 1,            // Smooth rounded outer rim
  hGap: 2.3,               // Horizontal spacing between discs in gallery
  depthGap: 1.0,           // Z-axis recession for inactive discs
  inactiveScale: 0.8       // Scale factor for neighboring discs
};
```

### Planar UV Unwrapping for `RingGeometry`
Vite/Three.js default `RingGeometry` UVs are cylindrical/polar. To project flat artwork onto the disc ring, the vertex positions are remapped to normalized planar UV space:

```typescript
function unwrapDiscUV(geometry: THREE.BufferGeometry) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    // Maps [-1, 1] range to [0, 1] UV coordinate
    uv.setXY(i, (pos.getX(i) / 1.0) * 0.5 + 0.5, (pos.getY(i) / 1.0) * 0.5 + 0.5);
  }
  uv.needsUpdate = true;
}
```

---

## 4. Materials & Holographic CD Shaders

### 1. Back Face (Holographic Data Side)
The signature rainbow diffraction grating is achieved via Three.js's physical iridescence model (`MeshPhysicalMaterial`):

```typescript
const backSideMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#1A1E2A'),      // Dark base beneath metal reflective layer
  roughness: 0.23,
  metalness: 1.0,                         // High metalness gives specular mirror reflection
  clearcoat: 0.34,
  clearcoatRoughness: 0.06,
  iridescence: 1.0,                       // Full rainbow wave interference
  iridescenceIOR: 1.86,                   // Polycarbonate refractive index
  iridescenceThicknessRange: [140, 900],  // Nanometer thin-film interference range
  normalMap: backNormalMap,
  normalScale: new THREE.Vector2(0.5, 0.5),
  envMapIntensity: 1.5
});
```

### 2. Front Face (Printed Artwork)
```typescript
const frontSideMaterial = new THREE.MeshPhysicalMaterial({
  map: albumArtworkTexture,
  roughness: 0.42,
  metalness: 0.48,
  clearcoat: 0.8,
  clearcoatRoughness: 0.06,
  normalMap: frontNormalMap,              // Adds subtle print ink / microscopic scratch relief
  envMapIntensity: 1.2
});
```

### 3. Center Hub (Clear Polycarbonate Ring)
```typescript
const hubMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#FFFFFF'),
  transmission: 0.68,                     // Glass-like see-through refraction
  thickness: 0.6,
  ior: 2.0,                               // High optical density refraction
  roughness: 0.38,                        // Frosted satin interior
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  envMapIntensity: 1.6
});
```

---

## 5. Procedural Normal & Roughness Map Generation

Rather than loading large texture images, the website generates realistic optical grooves, ink grain, dust, and micro-scratches on CPU using `Float32Array` / `Uint8ClampedArray` heightmaps converted to normal vectors:

### Groove & Scratch Algorithm
```typescript
function generateDiscNormals(size = 512, s = { texScratches: 0.36, backRadialDetail: 1 }) {
  const data = new Uint8ClampedArray(size * size * 4);
  const heightMap = new Float32Array(size * size);
  const center = size / 2;

  // 1. Concentric audio/data tracks
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const r = Math.sqrt(dx * dx + dy * dy);
      // High-frequency concentric sine wave simulates laser tracks
      const ring = Math.sin(r * 3.2) * 0.5 * s.backRadialDetail;
      heightMap[y * size + x] = ring;
    }
  }

  // 2. Random radial scratches
  const scratchCount = Math.floor(30 * s.texScratches);
  for (let i = 0; i < scratchCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const len = 30 + Math.random() * 220;
    const startX = Math.random() * size;
    const startY = Math.random() * size;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (let step = 0; step < len; step++) {
      const px = Math.round(startX + dx * step);
      const py = Math.round(startY + dy * step);
      if (px >= 1 && py >= 1 && px < size - 1 && py < size - 1) {
        heightMap[py * size + px] -= 0.4;
      }
    }
  }

  // 3. Convert height differential to tangent normals
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const left = heightMap[y * size + (x - 1)];
      const right = heightMap[y * size + (x + 1)];
      const up = heightMap[(y - 1) * size + x];
      const down = heightMap[(y + 1) * size + x];

      let nx = left - right;
      let ny = up - down;
      let nz = 1.0;
      const inv = 1.0 / Math.hypot(nx, ny, nz);
      nx *= inv; ny *= inv; nz *= inv;

      const idx = (y * size + x) * 4;
      data[idx]     = (nx * 0.5 + 0.5) * 255;
      data[idx + 1] = (ny * 0.5 + 0.5) * 255;
      data[idx + 2] = (nz * 0.5 + 0.5) * 255;
      data[idx + 3] = 255;
    }
  }
  return new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
}
```

---

## 6. Physics, Fluid Motion & Gesture Dynamics

The disc movement blends mouse raycasting with a spring-damper physics simulation:

```typescript
const physicsConfig = {
  // Gallery Carousel Flow
  flowLean: 0.055,       // Tilts backwards/forwards based on drag velocity
  flowLeanMax: 0.3,
  flowBank: 0.32,        // Lateral banking during swift sweeps
  flowDip: 0.014,        // Subtle vertical dip when moving fast
  
  // Spring Snapping
  snapFreq: 9.5,         // Frequency of natural harmonic oscillation
  snapDamping: 12.0,     // Damping ratio (eliminates infinite oscillation)
  snapDuration: 0.46,
  
  // Interactive Hover Tilt
  hoverTiltStrength: 0.21,
  
  // Disc Flip Action (Spacebar / Click)
  flipRotation: Math.PI, // 180-degree flip around Y axis
  flipDuration: 1.05
};
```

---

## 7. How to Apply These Techniques to Your Portfolio

1. **Interactive 3D Project Showcase**:
   - Replace standard rectangular cards with spinning 3D vinyl / CD discs, cassettes, or glass tablets that showcase project artwork on front and tech stack/metrics on the holographic reverse.
2. **Custom Shader / Iridescent Aesthetics**:
   - Use Three.js `MeshPhysicalMaterial` iridescence to create futuristic badges, foil cards, or interactive cursor reactive elements.
3. **Smooth Scroll & Micro-Interactions**:
   - Combine `@studio-freight/lenis` (smooth scroll) with GSAP `ScrollTrigger` to seamlessly synchronize 3D canvas rotations with page scrolling.
