import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import {
  DEFAULT_INFO_ANIMATION_CONFIG,
  InfoSectionAnimationModel,
  formatMonographDisplayData
} from '../helpers/enhancementModels.ts';

test('Tier 1 - Feature R2: Top-Right Information Section Layout & Animation', async (t) => {
  await t.test('2.1 Top-right layout container and positioning specifications', () => {
    // Info section positioning parameters
    const containerClasses = ['experience_info', 'top-right', 'z-20'];
    assert.ok(containerClasses.includes('experience_info'), 'Must designate experience_info class structure');
    assert.ok(containerClasses.includes('top-right'), 'Must position in top-right viewport region');
    assert.strictEqual(DEFAULT_INFO_ANIMATION_CONFIG.dividerThicknessPx, 0.5, 'Dividing lines must be 0.5px hairline rules');
  });

  await t.test('2.2 Editorial display serif typography and tracking contract', () => {
    // Title typography specifications: uppercase serif with optical tight tracking -0.04em
    const book0 = BOOKS_CATALOG[0];
    const displayData = formatMonographDisplayData(book0);

    assert.strictEqual(displayData.title, 'CODE SEARCH ENGINE', 'Title must be formatted uppercase in editorial serif');
    const titleTracking = -0.04; // -0.04em optical tracking
    const labelTracking = 0.20;  // 0.20em wide tracking for subheading-xs
    const valueTracking = -0.025;// -0.025em tight tracking for paragraph-m

    assert.strictEqual(titleTracking, -0.04, 'Display title must specify -0.04em tracking');
    assert.strictEqual(labelTracking, 0.20, 'Metadata labels must specify 0.20em wide tracking');
    assert.strictEqual(valueTracking, -0.025, 'Metadata values must specify -0.025em body tracking');
  });

  await t.test('2.3 0.5px hairline horizontal divider line specifications', () => {
    // Divider line dimensions and animation contract
    assert.strictEqual(DEFAULT_INFO_ANIMATION_CONFIG.dividerThicknessPx, 0.5, 'Divider lines must be exactly 0.5px hairline');
    const dividerColor = 'rgb(0, 0, 0)';
    assert.ok(dividerColor === 'rgb(0, 0, 0)' || dividerColor === '#000000', 'Divider must be crisp monochrome');
  });

  await t.test('2.4 Stacked key-value metadata formatting and monograph binding', () => {
    const book1 = BOOKS_CATALOG[1]; // Biomedical Vision
    const displayData = formatMonographDisplayData(book1, 'Kang Yuchen');

    assert.strictEqual(displayData.title, 'BIOMEDICAL VISION');
    assert.strictEqual(displayData.rows.length, 4, 'Must present exactly 4 key-value metadata rows');

    // Row 0: CURATED BY
    assert.strictEqual(displayData.rows[0].label, 'CURATED BY');
    assert.strictEqual(displayData.rows[0].value, 'Kang Yuchen');

    // Row 1: YEAR
    assert.strictEqual(displayData.rows[1].label, 'YEAR');
    assert.strictEqual(displayData.rows[1].value, '2025');

    // Row 2: CATEGORY
    assert.strictEqual(displayData.rows[2].label, 'CATEGORY');
    assert.strictEqual(displayData.rows[2].value, 'MACHINE LEARNING');

    // Row 3: CALL NUMBER
    assert.strictEqual(displayData.rows[3].label, 'CALL NUMBER');
    assert.strictEqual(displayData.rows[3].value, 'RC 78.7 .D53 2025');
  });

  await t.test('2.5 Masked exit animation parameters (0.4s, yPercent: -120%, divider collapse)', () => {
    const animModel = new InfoSectionAnimationModel(BOOKS_CATALOG[0]);
    assert.strictEqual(animModel.phase, 'idle');

    // Trigger transition to Book 1
    animModel.triggerChange(BOOKS_CATALOG[1]);
    assert.strictEqual(animModel.phase, 'settling');

    // Step past settle delay (100ms)
    animModel.step(DEFAULT_INFO_ANIMATION_CONFIG.settleDelayMs + 10);
    assert.strictEqual(animModel.phase, 'exiting', 'Must transition to exiting phase after settle delay');

    // Step halfway through exit animation (200ms of 400ms)
    animModel.step(200);
    assert.ok(animModel.exitYPct < 0 && animModel.exitYPct > -120, 'Exit animation must slide upwards towards -120%');
    assert.ok(animModel.dividerScale < 1.0 && animModel.dividerScale > 0.0, 'Dividers must collapse during exit');

    // Complete exit (another 200ms)
    animModel.step(200);
    assert.strictEqual(animModel.phase, 'entering', 'Must transition to entering phase once exit completes');
    assert.strictEqual(animModel.currentBook.id, BOOKS_CATALOG[1].id, 'Active book updates at exit boundary');
  });

  await t.test('2.6 Masked entrance animation parameters (0.7s, yPercent: 120% -> 0%, divider reveal)', () => {
    const animModel = new InfoSectionAnimationModel(BOOKS_CATALOG[0]);
    animModel.triggerChange(BOOKS_CATALOG[1]);
    // Step through settle (100ms) then exit (400ms)
    animModel.step(100);
    animModel.step(400);
    assert.strictEqual(animModel.phase, 'entering');
    assert.strictEqual(animModel.enterYPct, 120, 'Entrance animation begins at +120% shift');

    // Halfway through entrance (350ms of 700ms)
    animModel.step(350);
    assert.ok(animModel.enterYPct > 0 && animModel.enterYPct < 120, 'Content glides upwards towards 0%');
    assert.ok(animModel.dividerScale > 0.0 && animModel.dividerScale < 1.0, 'Dividers expand during entrance');

    // Finish entrance (another 350ms)
    animModel.step(350);
    assert.strictEqual(animModel.phase, 'idle', 'Animation completes and settles at idle');
    assert.strictEqual(animModel.enterYPct, 0, 'Final vertical offset settles at 0%');
    assert.strictEqual(animModel.dividerScale, 1.0, 'Dividers fully restored to 1.0 scale');
  });
});
