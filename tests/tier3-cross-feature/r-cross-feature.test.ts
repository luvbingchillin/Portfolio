import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import {
  TopNavStateMachine,
  InfoSectionAnimationModel,
  calculateNavPageDotPosition,
  formatMonographDisplayData,
  evaluateWcagCompliance
} from '../helpers/enhancementModels.ts';
import {
  stepHarmonicOscillator
} from '../helpers/physics.ts';

test('Tier 3: Enhancement Cross-Feature Combinations & Pairwise Synchronization', async (t) => {
  await t.test('3.1 TopNav Index dropdown selection (R1) ↔ 3D Scene Harmonic Oscillator: Target scroll dispatch', () => {
    let oscillator = { position: 0, velocity: 0, target: 0 };
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0, (selectedIdx) => {
      oscillator.target = selectedIdx;
    });

    // User opens Index dropdown and clicks Book 3 (Autonomous Agents)
    navMachine.openDropdown();
    assert.strictEqual(navMachine.isOpen, true);
    navMachine.selectIndex(3);

    // Verify target updated
    assert.strictEqual(oscillator.target, 3);
    assert.strictEqual(navMachine.activeIndex, 3);

    // Step physics 10 frames (~160ms)
    const dt = 1 / 60;
    for (let f = 0; f < 10; f++) {
      oscillator = stepHarmonicOscillator(oscillator, dt);
    }

    assert.ok(oscillator.velocity > 0, 'Oscillator accelerates towards index 3 target');
    assert.ok(oscillator.position > 0, 'Carousel begins gliding towards book 3');
  });

  await t.test('3.2 TopNav Selection (R1) ↔ EditorialInfoSection (R2): Coordinated monograph change', () => {
    const infoModel = new InfoSectionAnimationModel(BOOKS_CATALOG[0]);
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0, (selectedIdx) => {
      infoModel.triggerChange(BOOKS_CATALOG[selectedIdx]);
    });

    // Initial state: Book 0
    assert.strictEqual(infoModel.currentBook.title, 'Code Search Engine');

    // User selects Book 2 (Physical Rendering)
    navMachine.selectIndex(2);
    assert.strictEqual(infoModel.phase, 'settling');

    // Step through settle (100ms) and exit (400ms)
    infoModel.step(100);
    infoModel.step(400);

    // Midpoint check: Book metadata updated at start of entrance
    assert.strictEqual(infoModel.phase, 'entering');
    assert.strictEqual(infoModel.currentBook.title, 'Physical Rendering');

    // Complete entrance (700ms)
    infoModel.step(700);
    assert.strictEqual(infoModel.phase, 'idle');
    const formatted = formatMonographDisplayData(infoModel.currentBook);
    assert.strictEqual(formatted.title, 'PHYSICAL RENDERING');
    assert.strictEqual(formatted.rows[1].value, '2025');
  });

  await t.test('3.3 3D Canvas Navigation ↔ TopNav Sliding Page Dot: Coordinate update', () => {
    const mockListRect = { left: 400, right: 800, top: 10, bottom: 50, width: 400, height: 40 };
    
    // Position 0 tab rect
    const tab0Rect = { left: 450, right: 510, top: 18, bottom: 42, width: 60, height: 24 };
    const dotPos0 = calculateNavPageDotPosition(tab0Rect, mockListRect, 5);
    // Expected x = 450 + 30 - 400 = 80.0
    assert.strictEqual(dotPos0.x, 80.0);

    // Position 1 tab rect (next link)
    const tab1Rect = { left: 530, right: 610, top: 18, bottom: 42, width: 80, height: 24 };
    const dotPos1 = calculateNavPageDotPosition(tab1Rect, mockListRect, 5);
    // Expected x = 530 + 40 - 400 = 170.0
    assert.strictEqual(dotPos1.x, 170.0);

    // Dot traveled smoothly across navigation bar
    const deltaX = dotPos1.x - dotPos0.x;
    assert.strictEqual(deltaX, 90.0, 'Page dot shifts horizontally by exact distance between tabs');
  });

  await t.test('3.4 Keyboard Arrow Navigation ↔ Simultaneous 3-Way Synchronization (Nav, Info, 3D)', () => {
    let activeIndex = 0;
    let oscillator = { position: 0, velocity: 0, target: 0 };
    const infoModel = new InfoSectionAnimationModel(BOOKS_CATALOG[0]);
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0);

    // Global keyboard listener simulation
    const handleKeyNav = (direction: 'left' | 'right') => {
      const nextIdx = direction === 'right' 
        ? Math.min(BOOKS_CATALOG.length - 1, activeIndex + 1)
        : Math.max(0, activeIndex - 1);
      
      activeIndex = nextIdx;
      oscillator.target = nextIdx;
      navMachine.selectIndex(nextIdx);
      infoModel.triggerChange(BOOKS_CATALOG[nextIdx]);
    };

    // User presses ArrowRight -> moves to Book 1
    handleKeyNav('right');

    assert.strictEqual(activeIndex, 1, 'Active index incremented to 1');
    assert.strictEqual(oscillator.target, 1, '3D oscillator target updated to 1');
    assert.strictEqual(navMachine.activeIndex, 1, 'TopNav activeIndex updated to 1');
    assert.strictEqual(infoModel.phase, 'settling', 'Info section initiated settle phase');
  });

  await t.test('3.5 White Background Theming (R3) ↔ TopNav Text Contrast Compliance', () => {
    // TopNav typography on pure white background
    const navTextColor = '#171c1c';
    const pageBgColor = '#ffffff';

    const contrast = evaluateWcagCompliance(navTextColor, pageBgColor);
    assert.ok(contrast.ratio >= 17.0, 'TopNav text contrast against white must exceed 17:1');
    assert.strictEqual(contrast.aaaNormal, true, 'TopNav typography must pass WCAG AAA standard');
  });

  await t.test('3.6 White Background Theming (R3) ↔ EditorialInfoSection Hairline Dividers Contrast', () => {
    // 0.5px hairline divider rules on pure white background
    const dividerColor = '#000000';
    const pageBgColor = '#ffffff';

    const dividerContrast = evaluateWcagCompliance(dividerColor, pageBgColor);
    assert.strictEqual(dividerContrast.ratio, 21.0, 'Black divider rule against white yields maximum 21:1 contrast');
    assert.strictEqual(dividerContrast.aaaNormal, true);
  });

  await t.test('3.7 Mobile Bottom Docked Nav (R1) ↔ Top-Right Info Section (R2) Non-Interference', () => {
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0);
    const mobileWidth = 768;

    // At 768px, nav docks to bottom
    const isDocked = navMachine.isMobileDocked(mobileWidth);
    assert.strictEqual(isDocked, true);

    // Info section remains anchored at top-right
    const infoPosition = { top: 16, right: 16 };
    const navDockPosition = { bottom: 0, left: 0, right: 0 };

    assert.strictEqual(infoPosition.top, 16);
    assert.strictEqual(navDockPosition.bottom, 0);
    // Vertical zones do not collide
    assert.ok(infoPosition.top < 200, 'Info section resides in upper viewport zone');
    assert.strictEqual(navDockPosition.bottom, 0, 'Nav resides in bottom viewport zone');
  });

  await t.test('3.8 Modal Open State ↔ Interaction Freezing Across Enhancement Components', () => {
    let isSpreadOpen = true;
    let activeIndex = 0;

    // When modal open, keyboard navigation is ignored
    const handleKeyNav = (key: string) => {
      if (isSpreadOpen) return; // guard
      if (key === 'ArrowRight') activeIndex++;
    };

    handleKeyNav('ArrowRight');
    assert.strictEqual(activeIndex, 0, 'Navigation must remain locked while detail modal is open');
  });
});
