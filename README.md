# Portfolio — 3D Library Scene

A personal portfolio built with **React + TypeScript + Vite**, featuring a fully interactive 3D book library rendered in **Three.js**.

---

## Features

### 3D Library Scene
- Mahogany shelf with brass inlay lip and procedural textures
- Books arranged on a **cylindrical arc** with depth recession and elevation peaking
- **Studio lighting rig**: key directional, warm desk fill, cool rim, ambient
- **Fan reveal animation** on load (1.15 s ease-out cubic)

### Book Interaction
- **Horizontal drag** → full 360° yaw (spin) of the active book
- **Vertical drag** → pitch (tilt) of the active book (clamped ±90°)
- **Release** → smooth gradual snap-back to front face (0° yaw, 0° pitch) via smoothstep S-curve; duration proportional to angular distance
- **Mouse parallax** → subtle camera sway and per-book sway on hover
- **Wheel / scroll** → browse the shelf; snaps to nearest book
- **Click** → select a book or open the spread view

### Animation System
- **Spring physics** (2nd-order damped harmonic oscillator) for shelf scroll
- **Asymmetric velocity filter** (fast attack / slow release) for aerodynamic banking effects
- **Dynamic follow lag** per book based on distance from active index
- **Smoothstep flip/tilt interpolation** for all rotation snap-backs
- Dirty-flag + 10-frame settling buffer → 0% GPU when idle

### UI
- Top-left info panel: project title, tags, description
- Spread/detail view on book open
- Progress loader during asset warmup

---

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | React 18 + TypeScript |
| 3D Rendering | Three.js (WebGL, ACESFilmic tone mapping) |
| Build | Vite 8 + Oxlint |
| Styling | Tailwind CSS |

---

## Project Structure

```
src/
├── components/
│   ├── LibraryScene.tsx   # Three.js scene, animation loop, interaction handlers
│   └── ...
├── utils/
│   ├── textureGenerators.ts  # Procedural canvas textures (cover, spine, back, paper)
│   └── gpuWarming.ts         # Asset preloading & GPU shader pre-compilation
├── types/
│   └── book.ts               # ProjectBook type definition
└── main.tsx
```

---

## Getting Started

```bash
npm install
npm run dev      # Development server (http://localhost:5173)
npm run build    # Production build → dist/
```

---

## Interaction Reference

| Gesture | Action |
|---------|--------|
| Drag on active book (horizontal) | Spin book (full 360°) |
| Drag on active book (vertical) | Tilt book (±90°) |
| Release drag | Smooth snap-back to front face |
| Drag on empty shelf | Scroll through books |
| Scroll wheel | Browse shelf |
| Click book | Select / open spread |
| Mouse move | Camera + book parallax sway |
