import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import {
  TopNavStateMachine,
  InfoSectionAnimationModel,
  formatMonographDisplayData,
  calculateNavPageDotPosition,
  evaluateWcagCompliance,
  DEFAULT_SCENE_LIGHTING_CONFIG
} from '../helpers/enhancementModels.ts';
import {
  stepHarmonicOscillator
} from '../helpers/physics.ts';

test('Tier 4: Enhancement Real-World Application End-to-End Scenarios', async (t) => {
  await t.test('Scenario 1: First-time visitor cold arrival on pure white theme', () => {
    // 1. Theme verification: Pure white background and text contrast
    const pageBg = '#ffffff';
    const primaryText = '#171c1c';
    const contrast = evaluateWcagCompliance(primaryText, pageBg);
    assert.strictEqual(contrast.aaaNormal, true, 'Landing page satisfies WCAG AAA contrast');

    // 2. 3D Scene initialization: white fog and ambient lighting
    assert.strictEqual(DEFAULT_SCENE_LIGHTING_CONFIG.fogColor, 0xffffff);
    assert.strictEqual(DEFAULT_SCENE_LIGHTING_CONFIG.fogDensity, 0.032);
    assert.strictEqual(DEFAULT_SCENE_LIGHTING_CONFIG.ambientIntensity, 0.85);

    // 3. Top-middle nav initialized in closed state
    const nav = new TopNavStateMachine(BOOKS_CATALOG, 0);
    assert.strictEqual(nav.isOpen, false);
    assert.strictEqual(nav.activeIndex, 0);
    assert.strictEqual(nav.getFormattedCount(), '05');

    // 4. Top-right info displays initial monograph 01 metadata
    const info = formatMonographDisplayData(BOOKS_CATALOG[0]);
    assert.strictEqual(info.title, 'CODE SEARCH ENGINE');
    assert.strictEqual(info.rows[0].value, 'Kang Yuchen');
    assert.strictEqual(info.rows[1].value, '2026');
  });

  await t.test('Scenario 2: Monograph discovery via Index dropdown jump', () => {
    let oscillator = { position: 0, velocity: 0, target: 0 };
    const infoModel = new InfoSectionAnimationModel(BOOKS_CATALOG[0]);

    const nav = new TopNavStateMachine(BOOKS_CATALOG, 0, (idx) => {
      oscillator.target = idx;
      infoModel.triggerChange(BOOKS_CATALOG[idx]);
    });

    // 1. User clicks Index toggle
    nav.toggleDropdown();
    assert.strictEqual(nav.isOpen, true);
    const roll = nav.getRollState();
    assert.strictEqual(roll.chevronDegrees, 180, 'Chevron rotated 180 degrees');
    assert.strictEqual(roll.wordTransform, 'translate(0, -130%)');
    assert.strictEqual(roll.countTransform, 'translate(0, 0)');

    // 2. User selects Book 3: "Autonomous Agents"
    nav.selectIndex(3);
    assert.strictEqual(oscillator.target, 3);

    // 3. Carousel spring activates
    oscillator = stepHarmonicOscillator(oscillator, 1 / 60);
    assert.ok(oscillator.velocity > 0);

    // 4. Info section executes masked transition
    infoModel.step(100); // settle
    infoModel.step(400); // exit
    assert.strictEqual(infoModel.phase, 'entering');
    assert.strictEqual(infoModel.currentBook.title, 'Autonomous Agents');

    infoModel.step(700); // entrance
    assert.strictEqual(infoModel.phase, 'idle');
    const display = formatMonographDisplayData(infoModel.currentBook);
    assert.strictEqual(display.title, 'AUTONOMOUS AGENTS');
    assert.strictEqual(display.rows[1].value, '2026');
  });

  await t.test('Scenario 3: Continuous keyboard traversal, spine inspection & modal reading', () => {
    let activeIndex = 0;
    let isFlipped = false;
    let isSpreadOpen = false;

    const nav = new TopNavStateMachine(BOOKS_CATALOG, 0);
    const infoModel = new InfoSectionAnimationModel(BOOKS_CATALOG[0]);

    const handleKey = (key: string) => {
      if (isSpreadOpen) {
        if (key === 'Escape') isSpreadOpen = false;
        return;
      }

      if (key === 'ArrowRight') {
        const next = Math.min(BOOKS_CATALOG.length - 1, activeIndex + 1);
        activeIndex = next;
        isFlipped = false;
        nav.selectIndex(next);
        infoModel.triggerChange(BOOKS_CATALOG[next]);
      } else if (key === 'ArrowLeft') {
        const prev = Math.max(0, activeIndex - 1);
        activeIndex = prev;
        isFlipped = false;
        nav.selectIndex(prev);
        infoModel.triggerChange(BOOKS_CATALOG[prev]);
      } else if (key === 'Space') {
        isFlipped = !isFlipped;
      } else if (key === 'Enter') {
        isSpreadOpen = true;
      }
    };

    // Traverse forward to book 4
    for (let i = 0; i < 4; i++) {
      handleKey('ArrowRight');
    }
    assert.strictEqual(activeIndex, 4);
    assert.strictEqual(nav.activeIndex, 4);

    // Boundary attempt beyond book 4
    handleKey('ArrowRight');
    assert.strictEqual(activeIndex, 4, 'Clamped at maximum catalog index 4');

    // Flip book to inspect spine
    handleKey('Space');
    assert.strictEqual(isFlipped, true, 'Spine inspection enabled');

    // Open detail spread modal
    handleKey('Enter');
    assert.strictEqual(isSpreadOpen, true, 'Detail spread modal open');

    // Arrows ignored while modal open
    handleKey('ArrowLeft');
    assert.strictEqual(activeIndex, 4, 'Keyboard navigation locked during modal inspection');

    // Close modal
    handleKey('Escape');
    assert.strictEqual(isSpreadOpen, false, 'Modal closed');
  });

  await t.test('Scenario 4: Fast user navigation stress & clean settling', () => {
    const infoModel = new InfoSectionAnimationModel(BOOKS_CATALOG[0]);
    const nav = new TopNavStateMachine(BOOKS_CATALOG, 0);

    // Rapid switches across books: 1 -> 3 -> 2 -> 4 within short intervals
    const targets = [1, 3, 2, 4];
    targets.forEach(t => {
      nav.selectIndex(t);
      infoModel.triggerChange(BOOKS_CATALOG[t]);
      infoModel.step(50); // only 50ms between rapid actions
    });

    // Settle to final selection (Book 4)
    infoModel.step(100); // settle
    infoModel.step(400); // exit
    infoModel.step(700); // enter

    assert.strictEqual(nav.activeIndex, 4);
    assert.strictEqual(infoModel.phase, 'idle');
    assert.strictEqual(infoModel.currentBook.id, BOOKS_CATALOG[4].id);
    assert.strictEqual(infoModel.enterYPct, 0);
    assert.strictEqual(infoModel.dividerScale, 1.0);
  });

  await t.test('Scenario 5: Responsive viewport transition (Desktop to Mobile)', () => {
    const nav = new TopNavStateMachine(BOOKS_CATALOG, 0);

    // Desktop mode (1440px)
    assert.strictEqual(nav.isMobileDocked(1440), false);
    
    // Resize down to Mobile (375px)
    assert.strictEqual(nav.isMobileDocked(375), true);

    // Dropdown flyout upward expansion check
    const mobileDockHeight = nav.config.mobileDockHeightEm;
    assert.strictEqual(mobileDockHeight, 3.5, 'Mobile dock bar height is 3.5em');

    // Sliding dot coordinate math on mobile screen (375px)
    const mobileListRect = { left: 20, right: 355, top: 10, bottom: 45, width: 335, height: 35 };
    const mobileActiveLabel = { left: 120, right: 180, top: 15, bottom: 35, width: 60, height: 20 };
    const dotPos = calculateNavPageDotPosition(mobileActiveLabel, mobileListRect, 4);

    assert.strictEqual(dotPos.x, 130.0);
    assert.strictEqual(dotPos.y, 29.0);
  });
});
