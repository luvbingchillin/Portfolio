# Technical Plan & Handoff Report: Milestone 1 CSS Tokens, Background Colors & App Layout

**Agent**: `teamwork_explorer_m1_1`  
**Date**: 2026-10-29  
**Parent Conv ID**: `769b646f-c552-41bc-9868-9a381d080792`  
**Working Directory**: `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_1`  
**Status**: COMPLETE (Hard Handoff)

---

## 1. Observation

### 1.1 `src/App.tsx` Root Layout & Vignette
Direct inspection of `C:\Users\kangy\Desktop\Portfolio\src\App.tsx` (lines 70–75):
```tsx
70:   return (
71:     <main className="relative w-screen h-screen overflow-hidden bg-[#171c1c] text-[#f2f2f2] font-body">
72:       {/* Background Library Atmosphere: Subtle warm dark vignette */}
73:       <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#31383b]/30 via-[#1f2527]/60 to-[#171c1c]" />
74: 
75:       {/* 3D WebGL Library Scene (Three.js Canvas) - Mounted immediately under preloader for GPU warming */}
```
- Line 71 binds `<main>` background to dark eerie-black `#171c1c` and text to light `#f2f2f2`.
- Line 73 injects a full-screen radial dark gradient overlay (`opacity-40`, `from-[#31383b]/30 via-[#1f2527]/60 to-[#171c1c]`) that covers the entire canvas. On a white background, this layer creates a heavy dark ring and murky vignette staining the 3D scene.

### 1.2 `src/index.css` Token Definitions & Global Roots
Direct inspection of `C:\Users\kangy\Desktop\Portfolio\src\index.css`:
- **Lines 85–104** (Palette section):
```css
85:   /* -------------------------------------------------------------
86:    * 4. A24 EDITORIAL COLOR PALETTE
87:    * ------------------------------------------------------------- */
88:   --color-brand: #891a20;              /* A24 signature blood crimson */
89:   --color-brand-glow: rgba(137, 26, 32, 0.45);
90:   --color-eerie-black: #171c1c;        /* Dark background & base surface */
91:   --color-gunmetal: #31383b;           /* Card containers, borders & button outlines */
92:   --color-gunmetal-dim: rgba(49, 56, 59, 0.6);
93:   --color-surface-dark: #1f2527;
94:   --color-white: #f2f2f2;              /* Primary text & high-contrast elements */
95:   --color-white-muted: rgba(242, 242, 242, 0.85);
96:   --color-grey: #d6d3d1;               /* Secondary text, muted captions, subtle rules */
97:   --color-grey-dark: #8c8c8c;
98:   --color-honeydew: #e1f7e1;
99: 
100:   --_colors---swatch--brand: var(--color-brand);
101:   --_colors---swatch--eerie-black: var(--color-eerie-black);
102:   --_colors---swatch--gunmetal: var(--color-gunmetal);
103:   --_colors---swatch--surface-dark: var(--color-surface-dark);
104:   --_colors---swatch--white: var(--color-white);
105:   --_colors---swatch--grey: var(--color-grey);
106:   --_colors---swatch--honeydew: var(--color-honeydew);
```
- **Lines 107–126** (Foil & System Aliases):
```css
107:   /* -------------------------------------------------------------
108:    * 5. PRESERVED ATHENAEUM TOME FOIL TOKENS
109:    * Preserved for 3D book cover filigree and golden bindings
110:    * ------------------------------------------------------------- */
111:   --gold-foil: #d4af37;
112:   --gold-foil-light: #f3c769;
113:   --gold-foil-dim: rgba(212, 175, 55, 0.35);
114:   --parchment: #f5ede0;
115:   --parchment-dark: #e8dcba;
116:   --wood-mahogany: #1a120b;
117: 
118:   /* -------------------------------------------------------------
119:    * 6. SYSTEM ALIAS MAPPINGS (Backward Compatibility with M0 UI)
120:    * ------------------------------------------------------------- */
121:   --bg-library: var(--color-eerie-black);
122:   --bg-card: rgba(23, 28, 28, 0.92);
123:   --text-primary: var(--color-white);
124:   --text-muted: var(--color-grey);
125:   --font-serif: 'Ppeiko', 'PP Eiko', 'Times New Roman', serif;
126:   --font-mono: 'Ppmuseum', 'PP Museum', 'JetBrains Mono', monospace;
```
- **Lines 134–143** (HTML, Body, Root):
```css
134: html, body, #root {
135:   width: 100%;
136:   height: 100%;
137:   overflow: hidden;
138:   background-color: var(--bg-library);
139:   color: var(--text-primary);
140:   font-family: var(--font-body);
141:   -webkit-font-smoothing: antialiased;
142:   -moz-osx-font-smoothing: grayscale;
143: }
```
- **Lines 514–527** (Custom Scrollbar):
```css
514: /* Custom Scrollbar for Dark Folio Modal */
515: ::-webkit-scrollbar {
516:   width: 8px;
517: }
518: ::-webkit-scrollbar-track {
519:   background: #171c1c;
520: }
521: ::-webkit-scrollbar-thumb {
522:   background: #31383b;
523:   border-radius: 4px;
524: }
525: ::-webkit-scrollbar-thumb:hover {
526:   background: #454d52;
527: }
```

### 1.3 Test Suite Assertions for CSS Tokens
Direct inspection of `C:\Users\kangy\Desktop\Portfolio\tests\tier1-features\f2-typography-tokens.test.ts` (lines 32–42):
```typescript
32:   await t.test('2.4 Dark editorial color palette tokens', () => {
33:     // Palette specifications: dark library base, mahogany wood, gold foil accent
34:     assert.ok(css.includes('--bg-library: #0c0a08') || css.includes('--bg-library'), 'Must define --bg-library');
35:     assert.ok(css.includes('--gold-foil') || css.includes('#d4af37'), 'Must define gold foil accent');
36:     assert.ok(css.includes('--parchment') || css.includes('--text-primary'), 'Must define parchment/text-primary');
37:   });
38: 
39:   await t.test('2.5 Subpixel anti-aliasing and font smoothing', () => {
40:     assert.ok(css.includes('-webkit-font-smoothing: antialiased'), 'Must configure antialiased font smoothing');
41:     assert.ok(css.includes('-moz-osx-font-smoothing: grayscale'), 'Must configure grayscale font smoothing');
42:   });
```
Direct inspection of `C:\Users\kangy\Desktop\Portfolio\tests\stress-challenger-m1.ts` (lines 28–39):
```typescript
28:     const headingMatch = css.match(/--font-heading:\s*([^;]+);/);
29:     const bodyMatch = css.match(/--font-body:\s*([^;]+);/);
30:     const eyebrowMatch = css.match(/--font-eyebrow:\s*([^;]+);/);
31:     const serifMatch = css.match(/--font-serif:\s*([^;]+);/);
32:     const monoMatch = css.match(/--font-mono:\s*([^;]+);/);
```
- Token names `--bg-library`, `--gold-foil`, `--parchment`, `--text-primary`, `--font-heading`, `--font-body`, `--font-eyebrow`, `--font-serif`, `--font-mono` must be preserved in name.
- Changing `--bg-library` to `#ffffff;`, `--text-primary` to `#171c1c;`, and `--text-muted` to `#57534e;` satisfies all tests.

---

## 2. Logic Chain

1. **Background Color Inversion Requirement** (from Observation 1.1 & 1.2):
   - The user request (§R3) requires the primary background to be white (`#ffffff`).
   - `html, body, #root` derives its background from `var(--bg-library)` (`index.css:138`).
   - In `App.tsx:71`, the `<main>` element explicitly specifies `bg-[#171c1c]`.
   - Therefore, `--bg-library` in `src/index.css` must change to `#ffffff;`, and `<main>` in `src/App.tsx` must change to `bg-white` (or `bg-[#ffffff]`).

2. **Vignette Removal Requirement** (from Observation 1.1):
   - `App.tsx:73` renders `<div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#31383b]/30 via-[#1f2527]/60 to-[#171c1c]" />`.
   - On a white canvas, this dark gradient creates a severe dark ring with eerie-black corners.
   - Per requirements, this dark vignette must be completely removed so the 3D scene renders cleanly against `#ffffff`.

3. **Typography Inversion & WCAG AAA Contrast** (from Observation 1.2 & 1.3):
   - On `#ffffff`, light text (`#f2f2f2` / `--color-white`) has a contrast ratio of only 1.05:1 (unreadable).
   - Inverting primary text to `#171c1c` produces a contrast ratio of 16.7:1 against `#ffffff`, surpassing the WCAG AAA standard ($\ge 7:1$).
   - Updating secondary/muted text to `#57534e` (Stone 600) produces a contrast ratio of 7.66:1 against `#ffffff`, surpassing the WCAG AAA standard ($\ge 7:1$).
   - The signature A24 brand accent `#891a20` produces a contrast ratio of 9.27:1 against `#ffffff`, surpassing WCAG AAA.

4. **Test Suite Invariant Preservation** (from Observation 1.3):
   - `f2-typography-tokens.test.ts:34-36` asserts `css.includes('--bg-library')`, `css.includes('--gold-foil') || css.includes('#d4af37')`, and `css.includes('--parchment') || css.includes('--text-primary')`.
   - `stress-challenger-m1.ts:28-39` parses `--font-heading`, `--font-body`, `--font-eyebrow`, `--font-serif`, `--font-mono`.
   - Therefore, the token variable names must **not** be deleted or renamed. Setting `--bg-library: #ffffff;`, `--text-primary: #171c1c;`, and keeping `--gold-foil: #d4af37;`, `--parchment: #f5ede0;` preserves 100% test pass rate.

5. **Utility Class Independence** (from Observation 1.2):
   - The project does not use a dynamic Tailwind CLI or PostCSS compiler during runtime; all utility classes are statically declared in `src/index.css`.
   - Any new color classes (`.bg-white`, `.text-[#171c1c]`, `.text-[#57534e]`, `.border-[#e7e5e4]`, `.shadow-light-sm`, etc.) must be explicitly declared in `src/index.css` so that subsequent milestones (M2 navigation, M3 info section) and existing components have complete utility support without runtime styling failures.

---

## 3. Caveats

1. **No Source Modifications in This Explorer Phase**:
   - Per explorer role constraints, this report provides the exact change plan and code snippets. Modifications must be applied by the designated implementer agent.
2. **3D Scene Fog & Ambient Light Coupling**:
   - Setting background to white without updating Three.js fog (`scene.fog = new THREE.FogExp2(0x171c1c, 0.055)`) will cause distant books in `LibraryScene.tsx` to appear inside dark circular fog silhouettes. The M1 Scene Explorer / Implementer handles `LibraryScene.tsx` fog (`0xffffff, 0.032`) and ambient light (`0xfdfbf7, 0.85`), which perfectly complements this CSS/App layout change.
3. **Preloader Contrast**:
   - While `App.tsx` and `index.css` are updated to white, `Preloader.tsx` has inline styles. The M1 Base UI task handles `Preloader.tsx`'s inline styling to align with the white background.

---

## 4. Conclusion & Exact Implementation Plan

### 4.1 Exact Code Changes for `src/App.tsx`

**Target File**: `C:\Users\kangy\Desktop\Portfolio\src\App.tsx`  
**Target Lines**: Lines 70–75

#### Before:
```tsx
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#171c1c] text-[#f2f2f2] font-body">
      {/* Background Library Atmosphere: Subtle warm dark vignette */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#31383b]/30 via-[#1f2527]/60 to-[#171c1c]" />

      {/* 3D WebGL Library Scene (Three.js Canvas) - Mounted immediately under preloader for GPU warming */}
      <LibraryScene
```

#### After:
```tsx
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-white text-[#171c1c] font-body">
      {/* 3D WebGL Library Scene (Three.js Canvas) - Mounted immediately under preloader for GPU warming */}
      <LibraryScene
```

**Key Adjustments**:
- Root class changed from `bg-[#171c1c] text-[#f2f2f2]` to `bg-white text-[#171c1c]`.
- The dark radial vignette `<div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(...)] ... />` is removed entirely.

---

### 4.2 Exact Code Changes for `src/index.css`

**Target File**: `C:\Users\kangy\Desktop\Portfolio\src\index.css`

#### Change 1: `:root` Tokens (Lines 83–126)

##### Before:
```css
  /* -------------------------------------------------------------
   * 4. A24 EDITORIAL COLOR PALETTE
   * ------------------------------------------------------------- */
  --color-brand: #891a20;              /* A24 signature blood crimson */
  --color-brand-glow: rgba(137, 26, 32, 0.45);
  --color-eerie-black: #171c1c;        /* Dark background & base surface */
  --color-gunmetal: #31383b;           /* Card containers, borders & button outlines */
  --color-gunmetal-dim: rgba(49, 56, 59, 0.6);
  --color-surface-dark: #1f2527;
  --color-white: #f2f2f2;              /* Primary text & high-contrast elements */
  --color-white-muted: rgba(242, 242, 242, 0.85);
  --color-grey: #d6d3d1;               /* Secondary text, muted captions, subtle rules */
  --color-grey-dark: #8c8c8c;
  --color-honeydew: #e1f7e1;

  --_colors---swatch--brand: var(--color-brand);
  --_colors---swatch--eerie-black: var(--color-eerie-black);
  --_colors---swatch--gunmetal: var(--color-gunmetal);
  --_colors---swatch--surface-dark: var(--color-surface-dark);
  --_colors---swatch--white: var(--color-white);
  --_colors---swatch--grey: var(--color-grey);
  --_colors---swatch--honeydew: var(--color-honeydew);

  /* -------------------------------------------------------------
   * 5. PRESERVED ATHENAEUM TOME FOIL TOKENS
   * Preserved for 3D book cover filigree and golden bindings
   * ------------------------------------------------------------- */
  --gold-foil: #d4af37;
  --gold-foil-light: #f3c769;
  --gold-foil-dim: rgba(212, 175, 55, 0.35);
  --parchment: #f5ede0;
  --parchment-dark: #e8dcba;
  --wood-mahogany: #1a120b;

  /* -------------------------------------------------------------
   * 6. SYSTEM ALIAS MAPPINGS (Backward Compatibility with M0 UI)
   * ------------------------------------------------------------- */
  --bg-library: var(--color-eerie-black);
  --bg-card: rgba(23, 28, 28, 0.92);
  --text-primary: var(--color-white);
  --text-muted: var(--color-grey);
  --font-serif: 'Ppeiko', 'PP Eiko', 'Times New Roman', serif;
  --font-mono: 'Ppmuseum', 'PP Museum', 'JetBrains Mono', monospace;
```

##### After:
```css
  /* -------------------------------------------------------------
   * 4. A24 EDITORIAL COLOR PALETTE (Light Theme Architecture)
   * ------------------------------------------------------------- */
  --color-brand: #891a20;              /* A24 signature blood crimson */
  --color-brand-glow: rgba(137, 26, 32, 0.25);
  --color-eerie-black: #171c1c;        /* High-contrast black typography & dark accents */
  --color-stone-600: #57534e;          /* Muted text & secondary metadata */
  --color-stone-500: #78716c;          /* Subtle tertiary captions */
  --color-stone-200: #e7e5e4;          /* Stone 200 hairline border */
  --color-gunmetal: #31383b;           /* Preserved for compatibility */
  --color-gunmetal-dim: rgba(49, 56, 59, 0.6);
  --color-surface-dark: #1f2527;
  --color-white: #ffffff;              /* Pure white primary background */
  --color-white-off: #fafaf9;          /* Subtle warm off-white surface */
  --color-white-muted: rgba(255, 255, 255, 0.85);
  --color-grey: #57534e;               /* Remapped to Stone 600 */
  --color-grey-dark: #8c8c8c;
  --color-neutral-border: #e7e5e4;     /* Stone 200 hairline dividers */
  --color-honeydew: #1e6b37;           /* High-contrast emerald status on white */

  --_colors---swatch--brand: var(--color-brand);
  --_colors---swatch--eerie-black: var(--color-eerie-black);
  --_colors---swatch--gunmetal: var(--color-gunmetal);
  --_colors---swatch--surface-dark: var(--color-surface-dark);
  --_colors---swatch--white: var(--color-white);
  --_colors---swatch--grey: var(--color-stone-600);
  --_colors---swatch--honeydew: var(--color-honeydew);

  /* -------------------------------------------------------------
   * 5. PRESERVED ATHENAEUM TOME FOIL TOKENS
   * Preserved for 3D book cover filigree and golden bindings
   * ------------------------------------------------------------- */
  --gold-foil: #d4af37;
  --gold-foil-light: #f3c769;
  --gold-foil-dim: rgba(212, 175, 55, 0.35);
  --parchment: #f5ede0;
  --parchment-dark: #e8dcba;
  --wood-mahogany: #1a120b;

  /* -------------------------------------------------------------
   * 6. SYSTEM ALIAS MAPPINGS (Backward Compatibility with M0 UI)
   * ------------------------------------------------------------- */
  --bg-library: #ffffff;
  --bg-card: rgba(255, 255, 255, 0.85);
  --text-primary: #171c1c;
  --text-muted: #57534e;
  --font-serif: 'Ppeiko', 'PP Eiko', 'Times New Roman', serif;
  --font-mono: 'Ppmuseum', 'PP Museum', 'JetBrains Mono', monospace;
```

---

#### Change 2: Scrollbar Styling for White Theme (Lines 514–527)

##### Before:
```css
/* Custom Scrollbar for Dark Folio Modal */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #171c1c;
}
::-webkit-scrollbar-thumb {
  background: #31383b;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #454d52;
}
```

##### After:
```css
/* Custom Scrollbar for White Editorial Theme */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #ffffff;
}
::-webkit-scrollbar-thumb {
  background: #d6d3d1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #a8a29e;
}
```

---

### 4.3 Comprehensive Utility Classes Inventory for Light Theme

Add the following classes to `src/index.css` (grouped by category) to power all light UI controls across M1, M2, and M3:

```css
/* =============================================================
 * LIGHT THEME UTILITY CATALOG & A24 EXTENSIONS
 * ============================================================= */

/* 1. Backgrounds */
.bg-white { background-color: #ffffff; }
.bg-\[\#ffffff\] { background-color: #ffffff; }
.bg-white\/95 { background-color: rgba(255, 255, 255, 0.95); }
.bg-white\/90 { background-color: rgba(255, 255, 255, 0.9); }
.bg-white\/85 { background-color: rgba(255, 255, 255, 0.85); }
.bg-white\/80 { background-color: rgba(255, 255, 255, 0.8); }
.bg-white\/70 { background-color: rgba(255, 255, 255, 0.7); }
.bg-white\/60 { background-color: rgba(255, 255, 255, 0.6); }
.bg-white\/40 { background-color: rgba(255, 255, 255, 0.4); }
.bg-\[\#fafaf9\] { background-color: #fafaf9; }
.bg-\[\#f5f5f4\] { background-color: #f5f5f4; }
.bg-\[\#e7e5e4\] { background-color: #e7e5e4; }
.bg-black\/5 { background-color: rgba(0, 0, 0, 0.05); }
.bg-black\/10 { background-color: rgba(0, 0, 0, 0.1); }
.bg-black\/40 { background-color: rgba(0, 0, 0, 0.4); }

/* 2. Text Colors */
.text-\[\#171c1c\] { color: #171c1c; }
.text-\[\#57534e\] { color: #57534e; }
.text-\[\#78716c\] { color: #78716c; }
.text-\[\#a8a29e\] { color: #a8a29e; }
.text-\[\#1e6b37\] { color: #1e6b37; }
.text-black { color: #000000; }

/* 3. Borders & Dividers */
.border-\[\#e7e5e4\] { border-color: #e7e5e4; }
.border-\[\#e7e5e4\]\/60 { border-color: rgba(231, 229, 228, 0.6); }
.border-\[\#e7e5e4\]\/80 { border-color: rgba(231, 229, 228, 0.8); }
.border-\[\#d6d3d1\] { border-color: #d6d3d1; }
.border-\[\#171c1c\] { border-color: #171c1c; }
.border-\[\#171c1c\]\/10 { border-color: rgba(23, 28, 28, 0.1); }
.border-\[\#171c1c\]\/20 { border-color: rgba(23, 28, 28, 0.2); }
.border-black\/5 { border-color: rgba(0, 0, 0, 0.05); }
.border-black\/10 { border-color: rgba(0, 0, 0, 0.1); }
.border-neutral-200 { border-color: #e5e5e5; }
.border-neutral-300 { border-color: #d4d4d4; }

/* 4. Hover States */
.hover\:bg-\[\#f5f5f4\]:hover { background-color: #f5f5f4; }
.hover\:bg-\[\#e7e5e4\]:hover { background-color: #e7e5e4; }
.hover\:bg-\[\#171c1c\]:hover { background-color: #171c1c; }
.hover\:bg-white:hover { background-color: #ffffff; }
.hover\:text-\[\#171c1c\]:hover { color: #171c1c; }
.hover\:text-\[\#57534e\]:hover { color: #57534e; }
.hover\:text-black:hover { color: #000000; }
.hover\:border-\[\#171c1c\]:hover { border-color: #171c1c; }
.hover\:border-\[\#e7e5e4\]:hover { border-color: #e7e5e4; }
.hover\:border-\[\#891a20\]:hover { border-color: #891a20; }

/* 5. Light Shadows */
.shadow-light-sm { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03); }
.shadow-light-md { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04); }
.shadow-light-lg { box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04); }
.shadow-\[0_4px_20px_rgba\(0\,0\,0\,0\.06\)\] { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); }
.shadow-\[0_2px_8px_rgba\(0\,0\,0\,0\.04\)\] { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }

/* 6. Preloader Vertical Light Masks */
.from-white\/90 { --tw-gradient-from: rgba(255, 255, 255, 0.9); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(255, 255, 255, 0)); }
.to-white\/90 { --tw-gradient-to: rgba(255, 255, 255, 0.9); }
.from-white { --tw-gradient-from: #ffffff; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(255, 255, 255, 0)); }
.to-white { --tw-gradient-to: #ffffff; }

/* 7. Dedicated A24 Navigation & Editorial Component Styles */
.nav-page-dot {
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background-color: #891a20;
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.divider-horizontal {
  width: 100%;
  height: 1px;
  background-color: #e7e5e4;
}
```

---

### 4.4 WCAG Contrast Compliance Audit

| Role | Token / Value | Background | Contrast Ratio | WCAG 2.1 Level | Status |
|---|---|---|---|---|---|
| Primary Text | `--text-primary: #171c1c` | `#ffffff` | **16.7:1** | AAA ($\ge 7.0:1$) | PASSED |
| Secondary / Muted Text | `--text-muted: #57534e` | `#ffffff` | **7.66:1** | AAA ($\ge 7.0:1$) | PASSED |
| Tertiary Metadata | `#78716c` | `#ffffff` | **5.08:1** | AA ($\ge 4.5:1$) | PASSED |
| Brand Accent | `--color-brand: #891a20` | `#ffffff` | **9.27:1** | AAA ($\ge 7.0:1$) | PASSED |
| Status Indicator | `--color-honeydew: #1e6b37` | `#ffffff` | **6.14:1** | AA / AAA Large | PASSED |

---

## 5. Verification Method

### 5.1 Verification Commands
To verify the implementation once applied:

1. **Verify Full E2E Test Suite**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   node tests/runner.ts
   ```
   *Expected outcome*: 182/182 tests pass 100%, with `f2-typography-tokens.test.ts` passing all 5 subtests.

2. **Verify TypeScript & Production Build**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   npm run build
   ```
   *Expected outcome*: Exit code 0, bundled assets in `dist/`.

3. **Verify Linter**:
   ```powershell
   cd C:\Users\kangy\Desktop\Portfolio
   npm run lint
   ```
   *Expected outcome*: 0 errors.

### 5.2 Verification Files to Inspect
- `src/App.tsx`: Confirm line 71 uses `bg-white text-[#171c1c]` and line 73 radial vignette `<div>` is gone.
- `src/index.css`: Confirm `:root` contains `--bg-library: #ffffff;`, `--text-primary: #171c1c;`, `--text-muted: #57534e;` while keeping `--gold-foil: #d4af37;` and `--parchment: #f5ede0;`.

### 5.3 Invalidation Conditions
- If `tests/tier1-features/f2-typography-tokens.test.ts` fails, verify that `--bg-library`, `--gold-foil`, and `--parchment` / `--text-primary` token strings were not accidentally renamed or deleted.
- If `tests/stress-challenger-m1.ts` fails, verify that `--font-heading`, `--font-body`, and `--font-eyebrow` were unmodified.
- If the canvas exhibits a dark circle or dark edges, verify that the dark radial vignette in `App.tsx` was fully removed.
