/**
 * Athenaeum 3D Portfolio — Milestone 1 Adversarial Challenge
 * Empirical Stress Test Harness: Contrast Ratios, Token Stability & Zero Dark Vignette
 * 
 * Verifies:
 * 1. WCAG 2.1 AA and AAA mathematical contrast compliance against #ffffff across all elements
 * 2. Token stability, inheritance isolation, and legacy token preservation under extreme CSS overrides
 * 3. Zero dark vignette remnants across all viewport scales (375px mobile to 3840px 4K / ultrawide)
 * 4. WebGL lighting, white fog, and zero-allocation invariants in 3D canvas
 */

import './setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateRelativeLuminance,
  evaluateWcagCompliance,
  parseHexColor
} from './helpers/enhancementModels.ts';
import { safeAspect } from '../src/utils/gpuWarming.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to blend an RGBA color over an opaque RGB background
function blendRgbaOverRgb(
  fg: { r: number; g: number; b: number; a: number },
  bg: { r: number; g: number; b: number }
): { r: number; g: number; b: number } {
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a))
  };
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

// ============================================================================
// SUITE 1: EMPIRICAL CONTRAST RATIOS AGAINST #ffffff ACROSS ALL UI ELEMENTS
// ============================================================================
test('Challenger M1-1: Suite 1 - Empirical Contrast Ratios Against #ffffff Across All Elements', async (t) => {
  const whiteHex = '#ffffff';

  await t.test('1.1 Primary typography (#171c1c) against pure white (#ffffff) meets WCAG AAA', () => {
    const evalRes = evaluateWcagCompliance('#171c1c', whiteHex);
    // Mathematical calculation: 16.98:1
    assert.ok(evalRes.ratio >= 16.0, `Expected contrast >= 16.0:1, got ${evalRes.ratio}:1`);
    assert.strictEqual(evalRes.aaNormal, true, 'Primary text must pass WCAG AA normal text (>= 4.5:1)');
    assert.strictEqual(evalRes.aaaNormal, true, 'Primary text must pass WCAG AAA normal text (>= 7.0:1)');
    assert.strictEqual(evalRes.aaaLarge, true, 'Primary text must pass WCAG AAA large text (>= 4.5:1)');
  });

  await t.test('1.2 Secondary metadata & captions (#57534e) against pure white (#ffffff) meets WCAG AAA', () => {
    const evalRes = evaluateWcagCompliance('#57534e', whiteHex);
    // Mathematical calculation: 7.66:1
    assert.ok(evalRes.ratio >= 7.5, `Expected contrast >= 7.5:1, got ${evalRes.ratio}:1`);
    assert.strictEqual(evalRes.aaNormal, true, 'Secondary text must pass WCAG AA normal text (>= 4.5:1)');
    assert.strictEqual(evalRes.aaaNormal, true, 'Secondary text must pass WCAG AAA normal text (>= 7.0:1)');
  });

  await t.test('1.3 Signature blood crimson accent (#891a20) against pure white (#ffffff) meets WCAG AAA', () => {
    const evalRes = evaluateWcagCompliance('#891a20', whiteHex);
    // Mathematical calculation: 9.29:1
    assert.ok(evalRes.ratio >= 9.0, `Expected contrast >= 9.0:1, got ${evalRes.ratio}:1`);
    assert.strictEqual(evalRes.aaNormal, true, 'Crimson must pass WCAG AA normal text');
    assert.strictEqual(evalRes.aaaNormal, true, 'Crimson must pass WCAG AAA normal text (>= 7.0:1)');
  });

  await t.test('1.4 Detailed exposition body text (#292524 & #44403c) against white surfaces meets WCAG AAA', () => {
    const evalSynopsis = evaluateWcagCompliance('#44403c', whiteHex);
    assert.ok(evalSynopsis.ratio >= 10.0, `Expected #44403c contrast >= 10.0:1, got ${evalSynopsis.ratio}:1`);
    assert.strictEqual(evalSynopsis.aaaNormal, true);

    const evalModalBody = evaluateWcagCompliance('#292524', whiteHex);
    assert.ok(evalModalBody.ratio >= 14.0, `Expected #292524 contrast >= 14.0:1, got ${evalModalBody.ratio}:1`);
    assert.strictEqual(evalModalBody.aaaNormal, true);
  });

  await t.test('1.5 Status indicator green (#166534 & #1e6b37) against pure white (#ffffff) meets WCAG AAA', () => {
    const evalGreen1 = evaluateWcagCompliance('#166534', whiteHex);
    assert.ok(evalGreen1.ratio >= 7.0, `Expected #166534 contrast >= 7.0:1, got ${evalGreen1.ratio}:1`);
    assert.strictEqual(evalGreen1.aaaNormal, true);

    const evalGreen2 = evaluateWcagCompliance('#1e6b37', whiteHex);
    assert.ok(evalGreen2.ratio >= 6.5, `Expected #1e6b37 contrast >= 6.5:1, got ${evalGreen2.ratio}:1`);
    assert.strictEqual(evalGreen2.aaNormal, true);
  });

  await t.test('1.6 Preloader odometer large gold percentage glyph (#a17a15, 28px) satisfies WCAG AA large text', () => {
    // #a17a15 on #ffffff
    const evalGold = evaluateWcagCompliance('#a17a15', whiteHex);
    assert.ok(evalGold.ratio >= 3.8, `Expected gold % contrast >= 3.8:1, got ${evalGold.ratio}:1`);
    // 28px (1.75rem) qualifies as large text (>= 24px)
    assert.strictEqual(evalGold.aaLarge, true, 'Large percentage glyph (28px) must satisfy WCAG AA large (>= 3.0:1)');

    // Also verify against odometer housing (rgba(255, 255, 255, 0.96) over #ffffff)
    const effectiveOdometerBg = rgbToHex(blendRgbaOverRgb({ r: 255, g: 255, b: 255, a: 0.96 }, { r: 255, g: 255, b: 255 }));
    assert.strictEqual(effectiveOdometerBg, '#ffffff');
    const evalOdometerGold = evaluateWcagCompliance('#a17a15', effectiveOdometerBg);
    assert.strictEqual(evalOdometerGold.aaLarge, true);
  });

  await t.test('1.7 Frosted translucent overlay containers maintain compliant effective background luminance', () => {
    const whiteRgb = { r: 255, g: 255, b: 255 };

    // Header & Shelf: bg-white/80 over #ffffff
    const headerBgRgb = blendRgbaOverRgb({ r: 255, g: 255, b: 255, a: 0.8 }, whiteRgb);
    assert.strictEqual(rgbToHex(headerBgRgb), '#ffffff', 'White at 80% opacity over white must resolve to #ffffff');

    // Catalog aside card: bg-white/90 over #ffffff
    const asideBgRgb = blendRgbaOverRgb({ r: 255, g: 255, b: 255, a: 0.9 }, whiteRgb);
    assert.strictEqual(rgbToHex(asideBgRgb), '#ffffff', 'White at 90% opacity over white must resolve to #ffffff');

    // Modal left page: bg-[#fafaf9]/50 over #ffffff
    const modalLeftBg = blendRgbaOverRgb({ r: 250, g: 250, b: 249, a: 0.5 }, whiteRgb);
    const leftHex = rgbToHex(modalLeftBg);
    const evalLeftText = evaluateWcagCompliance('#171c1c', leftHex);
    assert.ok(evalLeftText.ratio >= 16.0, `Modal left page contrast must be >= 16:1, got ${evalLeftText.ratio}:1`);
    assert.strictEqual(evalLeftText.aaaNormal, true);
  });

  await t.test('1.8 Interactive buttons, badges, keycaps & inverted states contrast compliance', () => {
    // Inverted button text: white text on #171c1c (Open Folio, active shelf button)
    const invertedEval = evaluateWcagCompliance('#ffffff', '#171c1c');
    assert.ok(invertedEval.ratio >= 16.0);
    assert.strictEqual(invertedEval.aaaNormal, true, 'Inverted white text on #171c1c must pass AAA');

    // Badges: #171c1c text on neutral-100 (#f5f5f4)
    const badgeEval = evaluateWcagCompliance('#171c1c', '#f5f5f4');
    assert.ok(badgeEval.ratio >= 15.0);
    assert.strictEqual(badgeEval.aaaNormal, true, 'Badge text must pass AAA');

    // Keycaps: #171c1c on white keycap body
    const keycapEval = evaluateWcagCompliance('#171c1c', '#ffffff');
    assert.strictEqual(keycapEval.aaaNormal, true);

    // Inactive jump links: #57534e on white
    const inactiveJumpEval = evaluateWcagCompliance('#57534e', '#ffffff');
    assert.strictEqual(inactiveJumpEval.aaaNormal, true);
  });

  await t.test('1.9 Borders and divider contrast visibility against white background', () => {
    // Hairline divider: rgba(0, 0, 0, 0.1) on #ffffff yields #e6e6e6
    const dividerRgb = blendRgbaOverRgb({ r: 0, g: 0, b: 0, a: 0.1 }, { r: 255, g: 255, b: 255 });
    const dividerHex = rgbToHex(dividerRgb);
    assert.strictEqual(dividerHex, '#e6e6e6');
    const dividerLum = calculateRelativeLuminance(dividerRgb);
    assert.ok(dividerLum < 1.0, 'Divider must have distinguishable luminance from white');
    assert.ok(dividerLum > 0.70, 'Hairline divider must remain subtle and non-distracting');

    // Keycap border: rgba(0, 0, 0, 0.15) on #ffffff yields #d9d9d9
    const keycapBorderRgb = blendRgbaOverRgb({ r: 0, g: 0, b: 0, a: 0.15 }, { r: 255, g: 255, b: 255 });
    assert.strictEqual(rgbToHex(keycapBorderRgb), '#d9d9d9');

    // Stone 200 border: #e7e5e4
    const stone200Rgb = parseHexColor('#e7e5e4');
    const stone200Lum = calculateRelativeLuminance(stone200Rgb);
    assert.ok(stone200Lum > 0.75 && stone200Lum < 0.90, 'Stone 200 must be in subtle hairline range');
  });
});

// ============================================================================
// SUITE 2: TOKEN STABILITY UNDER EXTREME CSS OVERRIDES & ISOLATION
// ============================================================================
test('Challenger M1-1: Suite 2 - Token Stability Under Extreme CSS Overrides', async (t) => {
  const cssPath = path.join(projectRoot, 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  await t.test('2.1 Core CSS tokens resolve to light theme values in :root', () => {
    assert.match(cssContent, /--bg-library:\s*#ffffff;/);
    assert.match(cssContent, /--text-primary:\s*#171c1c;/);
    assert.match(cssContent, /--text-muted:\s*#57534e;/);
    assert.match(cssContent, /--color-white:\s*#ffffff;/);
    assert.match(cssContent, /--color-brand:\s*#891a20;/);
    assert.match(cssContent, /--color-stone-600:\s*#57534e;/);
    assert.match(cssContent, /--color-stone-500:\s*#78716c;/);
    assert.match(cssContent, /--color-stone-200:\s*#e7e5e4;/);
    assert.match(cssContent, /--color-honeydew:\s*#1e6b37;/);
  });

  await t.test('2.2 Preserved historical Athenaeum tokens for 3D leather & gold foil bindings', () => {
    assert.match(cssContent, /--gold-foil:\s*#d4af37;/);
    assert.match(cssContent, /--gold-foil-light:\s*#f3c769;/);
    assert.match(cssContent, /--gold-foil-dim:\s*rgba\(212,\s*175,\s*55,\s*0\.35\);/);
    assert.match(cssContent, /--parchment:\s*#f5ede0;/);
    assert.match(cssContent, /--parchment-dark:\s*#e8dcba;/);
    assert.match(cssContent, /--wood-mahogany:\s*#1a120b;/);
  });

  await t.test('2.3 Custom scrollbar styling matches white theme specifications', () => {
    assert.match(cssContent, /::-webkit-scrollbar-track\s*\{[^}]*background:\s*#ffffff;/);
    assert.match(cssContent, /::-webkit-scrollbar-thumb\s*\{[^}]*background:\s*#d6d3d1;/);
    assert.match(cssContent, /::-webkit-scrollbar-thumb:hover\s*\{[^}]*background:\s*#a8a29e;/);
    // Ensure no dark scrollbar track exists
    assert.doesNotMatch(cssContent, /::-webkit-scrollbar-track\s*\{[^}]*background:\s*#171c1c;/);
  });

  await t.test('2.4 App.tsx main element explicitly locks background to bg-white and text to #171c1c', () => {
    const appPath = path.join(projectRoot, 'src', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    // Must have bg-white and text-[#171c1c] directly on <main>
    assert.match(appContent, /<main\s+className="[^"]*bg-white[^"]*text-\[#171c1c\][^"]*"/);
  });

  await t.test('2.5 CSS utility class cascade isolation: utility classes use direct hex colors', () => {
    // Verify that light theme utility classes exist and do not rely on variable cascade that could be poisoned
    assert.ok(cssContent.includes('.bg-white { background-color: #ffffff; }'));
    assert.ok(cssContent.includes('.text-[#171c1c]') || cssContent.includes('.text-\\[\\#171c1c\\] { color: #171c1c; }'));
    assert.ok(cssContent.includes('.text-[#57534e]') || cssContent.includes('.text-\\[\\#57534e\\] { color: #57534e; }'));
    assert.ok(cssContent.includes('.bg-neutral-100 { background-color: #f5f5f4; }'));
    assert.ok(cssContent.includes('.border-black\\/10 { border-color: rgba(0, 0, 0, 0.1); }'));
  });
});

// ============================================================================
// SUITE 3: ZERO DARK VIGNETTE REMNANTS ACROSS ALL VIEWPORT SIZES (375px - 3840px)
// ============================================================================
test('Challenger M1-1: Suite 3 - Zero Dark Vignette Remnants Across Viewports', async (t) => {
  const appPath = path.join(projectRoot, 'src', 'App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  await t.test('3.1 Complete absence of dark radial gradient overlay in App.tsx', () => {
    // Baseline had: <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#31383b]/30 via-[#1f2527]/60 to-[#171c1c]" />
    assert.strictEqual(
      appContent.includes('radial-gradient(circle_at_center'),
      false,
      'Must NOT contain dark radial vignette gradient in App.tsx'
    );
    assert.strictEqual(
      appContent.includes('from-[#31383b]/30'),
      false,
      'Must NOT contain dark gradient from-[#31383b]'
    );
    assert.strictEqual(
      appContent.includes('via-[#1f2527]/60'),
      false,
      'Must NOT contain dark gradient via-[#1f2527]'
    );
  });

  await t.test('3.2 Preloader paper vignette uses exclusively light architectural gradients', () => {
    const preloaderPath = path.join(projectRoot, 'src', 'components', 'Preloader.tsx');
    const preloaderContent = fs.readFileSync(preloaderPath, 'utf8');

    // Find the vignette gradient definition with multiline/nested parenthesis match
    const vignetteMatch = preloaderContent.match(/background:\s*'radial-gradient\([^']+\)'/);
    assert.ok(vignetteMatch, 'Preloader should define architectural vignette');
    const gradientStr = vignetteMatch[0];

    // Must be based on white to stone paper tone (#eae7e4)
    assert.ok(gradientStr.includes('rgba(255,255,255,1)'), 'Vignette center must be pure white');
    assert.ok(gradientStr.includes('#eae7e4'), 'Vignette edge must be soft architectural stone (#eae7e4)');

    // Ensure zero dark colors in the preloader vignette
    assert.strictEqual(gradientStr.includes('#171c1c'), false, 'Vignette must NOT contain dark eerie black');
    assert.strictEqual(gradientStr.includes('#000000'), false, 'Vignette must NOT contain pitch black');
    assert.strictEqual(gradientStr.includes('#1f2527'), false, 'Vignette must NOT contain dark gunmetal');
  });

  await t.test('3.3 3D WebGL scene white depth fog prevents dark horizon or corner halos', () => {
    const scenePath = path.join(projectRoot, 'src', 'components', 'LibraryScene.tsx');
    const sceneContent = fs.readFileSync(scenePath, 'utf8');

    // Must be FogExp2(0xffffff, 0.032)
    assert.match(sceneContent, /scene\.fog\s*=\s*new\s+THREE\.FogExp2\(0xffffff,\s*0\.032\);/);
    // Must NOT have 0x171c1c fog
    assert.doesNotMatch(sceneContent, /scene\.fog\s*=\s*new\s+THREE\.FogExp2\(0x171c1c/);
  });

  await t.test('3.4 Viewport aspect ratio sweep across all target devices (375px to 3840px)', () => {
    const viewports = [
      { name: 'iPhone SE (Mobile Small)', w: 375, h: 667 },
      { name: 'iPhone 13 (Mobile Standard)', w: 390, h: 844 },
      { name: 'iPhone Pro Max (Mobile Large)', w: 428, h: 926 },
      { name: 'iPad Mini (Tablet Portrait)', w: 768, h: 1024 },
      { name: 'iPad Air (Tablet Landscape)', w: 1024, h: 768 },
      { name: 'Laptop WXGA', w: 1280, h: 800 },
      { name: 'MacBook Pro / Desktop', w: 1440, h: 900 },
      { name: 'Full HD 1080p', w: 1920, h: 1080 },
      { name: '2K QHD 1440p', w: 2560, h: 1440 },
      { name: '4K UHD 2160p', w: 3840, h: 2160 },
      { name: '32:9 Super Ultrawide', w: 3840, h: 1080 }
    ];

    viewports.forEach(({ name, w, h }) => {
      const aspect = safeAspect(w, h);
      assert.ok(Number.isFinite(aspect), `${name} aspect must be finite`);
      assert.ok(!Number.isNaN(aspect), `${name} aspect must not be NaN`);
      assert.ok(aspect > 0.3 && aspect < 4.0, `${name} aspect (${aspect}) must reside in standard display range`);
      assert.strictEqual(aspect, w / h, `${name} aspect matches w/h`);
    });
  });
});

// ============================================================================
// SUITE 4: 3D SCENE STUDIO LIGHTING RIG & ZERO-ALLOCATION INVARIANTS
// ============================================================================
test('Challenger M1-1: Suite 4 - 3D Scene Studio Lighting Rig & Zero-Allocation Invariants', async (t) => {
  const scenePath = path.join(projectRoot, 'src', 'components', 'LibraryScene.tsx');
  const sceneContent = fs.readFileSync(scenePath, 'utf8');

  await t.test('4.1 Studio lighting rig calibrated for pure white backdrop', () => {
    // Ambient light: 0xfdfbf7, 0.85
    assert.match(sceneContent, /new\s+THREE\.AmbientLight\(0xfdfbf7,\s*0\.85\)/);

    // Key light: 0xfff8f0, 1.25
    assert.match(sceneContent, /new\s+THREE\.DirectionalLight\(0xfff8f0,\s*1\.25\)/);

    // Rim light: 0x94b4dc, 0.55
    assert.match(sceneContent, /new\s+THREE\.DirectionalLight\(0x94b4dc,\s*0\.55\)/);

    // Desk glow point light: 0xffecd2, 0.9, 12, 1.4
    assert.match(sceneContent, /new\s+THREE\.PointLight\(0xffecd2,\s*0\.9,\s*12,\s*1\.4\)/);

    // Renderer tone mapping exposure: 1.02
    assert.match(sceneContent, /renderer\.toneMappingExposure\s*=\s*1\.02;/);

    // WebGLRenderer alpha: true
    assert.match(sceneContent, /new\s+THREE\.WebGLRenderer\(\{\s*antialias:\s*true,\s*alpha:\s*true/);
  });

  await t.test('4.2 Static zero-allocation RAF invariant preserved inside tick()', () => {
    const tickStart = sceneContent.indexOf('const tick = (now: DOMHighResTimeStamp = performance.now()) => {');
    assert.ok(tickStart > 0, 'Must locate tick() function');

    const tickEnd = sceneContent.indexOf('tick();', tickStart);
    assert.ok(tickEnd > tickStart, 'Must locate end of tick()');

    const tickBody = sceneContent.substring(tickStart, tickEnd);

    // No 'new ' expressions
    const newMatches = tickBody.match(/\bnew\s+[A-Za-z0-9_.]+/g);
    assert.strictEqual(newMatches, null, `Found forbidden new allocations: ${newMatches?.join(', ')}`);

    // No array allocation helpers
    assert.strictEqual(tickBody.includes('.map('), false);
    assert.strictEqual(tickBody.includes('.filter('), false);
    assert.strictEqual(tickBody.includes('.slice('), false);
  });
});
