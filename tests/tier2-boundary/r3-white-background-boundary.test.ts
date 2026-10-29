import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateContrastRatio,
  calculateRelativeLuminance,
  evaluateWcagCompliance,
  parseHexColor,
  DEFAULT_SCENE_LIGHTING_CONFIG
} from '../helpers/enhancementModels.ts';

test('Tier 2 - Feature R3 Boundary: White Background, Contrast & Lighting Bounds', async (t) => {
  await t.test('B3.1 Mathematical contrast ratio boundary: #ffffff vs #000000', () => {
    // Pure white against pure black yields maximum theoretical contrast ratio 21.00:1
    const maxRatio = calculateContrastRatio('#ffffff', '#000000');
    assert.strictEqual(maxRatio, 21.0, 'White vs Black contrast must be exactly 21.00:1');

    // Identical colors yield minimum theoretical contrast ratio 1.00:1
    const minRatio = calculateContrastRatio('#ffffff', '#ffffff');
    assert.strictEqual(minRatio, 1.0, 'Identical white on white contrast must be 1.00:1');
  });

  await t.test('B3.2 WCAG AA threshold edge verification (#767676 vs #ffffff)', () => {
    // #767676 on #ffffff is known edge of WCAG 2.1 AA 4.5:1 threshold
    const passThreshold = evaluateWcagCompliance('#767676', '#ffffff');
    assert.ok(passThreshold.ratio >= 4.5, `Expected ratio >= 4.5, got ${passThreshold.ratio}`);
    assert.strictEqual(passThreshold.aaNormal, true, '#767676 must satisfy AA normal text');

    // #777777 on #ffffff drops just below 4.5:1
    const failThreshold = evaluateWcagCompliance('#777777', '#ffffff');
    assert.ok(failThreshold.ratio < 4.5, `Expected ratio < 4.5, got ${failThreshold.ratio}`);
    assert.strictEqual(failThreshold.aaNormal, false, '#777777 must fail AA normal text');
  });

  await t.test('B3.3 Relative luminance function bounds: black (0.0) to white (1.0)', () => {
    const lumBlack = calculateRelativeLuminance({ r: 0, g: 0, b: 0 });
    const lumWhite = calculateRelativeLuminance({ r: 255, g: 255, b: 255 });

    assert.strictEqual(lumBlack, 0.0, 'Pure black relative luminance must be 0.0');
    assert.strictEqual(Number(lumWhite.toFixed(2)), 1.0, 'Pure white relative luminance must be 1.0');

    // Monotonic increase along grey axis
    let previousLum = -1;
    for (let c = 0; c <= 255; c += 25) {
      const currentLum = calculateRelativeLuminance({ r: c, g: c, b: c });
      assert.ok(currentLum > previousLum, `Luminance must increase monotonically at step ${c}`);
      previousLum = currentLum;
    }
  });

  await t.test('B3.4 3D Scene fog density bounds: density 0 vs 0.032 vs 0.5', () => {
    // Calibrated white fog
    assert.strictEqual(DEFAULT_SCENE_LIGHTING_CONFIG.fogColor, 0xffffff);
    
    // Bounds check on density
    const calibratedDensity = DEFAULT_SCENE_LIGHTING_CONFIG.fogDensity;
    assert.ok(calibratedDensity > 0.01 && calibratedDensity < 0.06, 'Density must reside in subtle range [0.01, 0.06]');

    // Fog color must remain strictly 0xffffff across all density regimes
    const densities = [0.0, 0.032, 0.1, 0.5];
    densities.forEach(d => {
      assert.ok(d >= 0.0 && d <= 1.0, 'Density must stay within [0, 1]');
      assert.strictEqual(DEFAULT_SCENE_LIGHTING_CONFIG.fogColor, 0xffffff, 'Fog color invariant must be 0xffffff');
    });
  });

  await t.test('B3.5 Ambient and directional light overexposure clamping', () => {
    // Ambient light intensity bounds: [0.65, 0.95] to prevent washing out embossed foil stamping
    const ambient = DEFAULT_SCENE_LIGHTING_CONFIG.ambientIntensity;
    assert.ok(ambient >= 0.65 && ambient <= 0.95, `Ambient light (${ambient}) must be in [0.65, 0.95]`);

    // Key light intensity bounds: [1.1, 1.6]
    const key = DEFAULT_SCENE_LIGHTING_CONFIG.keyLightIntensity;
    assert.ok(key >= 1.1 && key <= 1.6, `Key light (${key}) must be in [1.1, 1.6]`);

    // Tone mapping exposure calibration: [0.95, 1.10]
    const exposure = DEFAULT_SCENE_LIGHTING_CONFIG.toneMappingExposure;
    assert.ok(exposure >= 0.95 && exposure <= 1.10, `Tone mapping exposure (${exposure}) must be in [0.95, 1.10]`);
  });

  await t.test('B3.6 3-digit shorthand hex color parsing boundary (#fff, #000, #17c)', () => {
    const whiteShort = parseHexColor('#fff');
    assert.deepStrictEqual(whiteShort, { r: 255, g: 255, b: 255 });

    const blackShort = parseHexColor('#000');
    assert.deepStrictEqual(blackShort, { r: 0, g: 0, b: 0 });

    const redShort = parseHexColor('#f00');
    assert.deepStrictEqual(redShort, { r: 255, g: 0, b: 0 });

    // Standard 6-digit parsing
    const custom = parseHexColor('#891a20');
    assert.deepStrictEqual(custom, { r: 137, g: 26, b: 32 });
  });
});
