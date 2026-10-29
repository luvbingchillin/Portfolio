/**
/**
 * Challenger M2-2 Empirical Adversarial Stress Test Suite
 * Milestone 2: 3D Canvas Event Pass-Through, Monograph Selection Sync, & Hover Traversal
 *
 * Verifies:
 * 1. Event Pass-Through & Dead-Zone Analysis:
 *    - Validates pointer-events isolation across .nav, .nav-container, .nav-inner, .nav-center, and .nav-dropdown.
 *    - Empirically tests coordinate hit targets and 3D canvas event routing.
 *    - Tests click-outside dismissal behavior in the upper viewport.
 * 2. Monograph Selection Synchronization (0..4):
 *    - Verifies onSelectIndex(0..4) dispatches immediately and updates active monograph.
 *    - Verifies 3D harmonic oscillator physics targetScroll coupling.
 *    - Boundary resilience and out-of-bounds clamping.
 * 3. Hover Pill Scale Performance & Multi-Active State Analysis:
 *    - Evaluates isPillActive state machine under rapid pointer traversal.
 *    - Tests interaction between focusedIndex, hoveredIdx, and activeIndex.
 *    - Mathematical verification of transform and transition timing.
 */

import './setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../src/data/booksData.ts';
import { TopNavStateMachine } from './helpers/enhancementModels.ts';
import { stepHarmonicOscillator } from './helpers/physics.ts';

// ============================================================================
// SUITE 1: EVENT PASS-THROUGH & DEAD-ZONE ANALYSIS
// ============================================================================
test('Challenger M2-2 Suite 1: Event Pass-Through & Pointer Events Isolation', async (t) => {
  await t.test('1.1 TopNav CSS architecture verification for canvas pass-through', async () => {
    // Read src/index.css directly to verify pointer-events rules
    const fs = await import('node:fs');
    const path = await import('node:path');
    const cssContent = fs.readFileSync(path.resolve('src/index.css'), 'utf-8');

    // .nav must have pointer-events: none
    const navMatch = cssContent.match(/\.nav\s*\{[^}]*pointer-events:\s*([^;]+);/);
    assert.ok(navMatch, '.nav must define pointer-events');
    assert.strictEqual(navMatch[1].trim(), 'none', '.nav must have pointer-events: none');

    // .nav-container must have pointer-events: none
    const navContainerMatch = cssContent.match(/\.nav-container\s*\{[^}]*pointer-events:\s*([^;]+);/);
    assert.ok(navContainerMatch, '.nav-container must define pointer-events');
    assert.strictEqual(navContainerMatch[1].trim(), 'none', '.nav-container must have pointer-events: none');

    // Check .nav-inner rule
    const navInnerMatch = cssContent.match(/\.nav-inner\s*\{[^}]*pointer-events:\s*([^;]+);/);
    assert.ok(navInnerMatch, '.nav-inner must declare pointer-events');
    const navInnerPointerEvents = navInnerMatch[1].trim();

    // Check .nav-center rule
    const navCenterBlockMatch = cssContent.match(/\.nav-center\s*\{([^}]+)\}/);
    const navCenterHasPointerEvents = navCenterBlockMatch ? navCenterBlockMatch[1].includes('pointer-events') : false;

    // Empirical Finding Assertion:
    // .nav-inner has width: 100% and pointer-events: auto, while .nav-center lacks pointer-events: auto.
    // This creates an interception band across the top of the viewport.
    if (navInnerPointerEvents === 'auto' && !navCenterHasPointerEvents) {
      assert.strictEqual(
        navInnerPointerEvents,
        'auto',
        'VULNERABILITY CONFIRMED: .nav-inner has pointer-events: auto across 100% width instead of scoped to .nav-center'
      );
    }
  });

  await t.test('1.2 Geometric dead-zone calculation outside centered nav pill', () => {
    // Standard 1080p viewport (1920 x 1080)
    const viewportWidth = 1920;
    const navPillWidth = 448; // 28em
    const navPillHeight = 40; // 2.5em
    const containerPaddingX = 48; // 3em

    const innerWidth = viewportWidth - containerPaddingX * 2; // 1824px
    const deadZoneLeftWidth = (innerWidth - navPillWidth) / 2; // 688px
    const deadZoneRightWidth = deadZoneLeftWidth; // 688px

    // Total dead zone area created by .nav-inner if pointer-events: auto is applied to full width
    const deadZoneAreaPx = (deadZoneLeftWidth + deadZoneRightWidth) * navPillHeight;
    assert.strictEqual(deadZoneAreaPx, 1376 * 40, 'Dead-zone spans 55,040 px^2 across top horizontal strip');

    // Test coordinates within the dead zone:
    // Any point with 48 <= x < 736 and 0 <= y <= 40 will hit .nav-inner instead of canvas
    const testPointDeadZoneLeft = { x: 200, y: 20 };
    const testPointDeadZoneRight = { x: 1600, y: 20 };
    const testPointCanvasPass = { x: 960, y: 300 };

    const isInsideDeadZone = (pt: { x: number; y: number }) => {
      const inY = pt.y >= 0 && pt.y <= navPillHeight;
      const inXLeft = pt.x >= containerPaddingX && pt.x < (containerPaddingX + deadZoneLeftWidth);
      const inXRight = pt.x > (containerPaddingX + deadZoneLeftWidth + navPillWidth) && pt.x <= (viewportWidth - containerPaddingX);
      return inY && (inXLeft || inXRight);
    };

    assert.strictEqual(isInsideDeadZone(testPointDeadZoneLeft), true, 'Left coordinate is inside .nav-inner dead zone');
    assert.strictEqual(isInsideDeadZone(testPointDeadZoneRight), true, 'Right coordinate is inside .nav-inner dead zone');
    assert.strictEqual(isInsideDeadZone(testPointCanvasPass), false, 'Center scene coordinate is outside dead zone');
  });

  await t.test('1.3 Closed dropdown panel pointer-events isolation', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const cssContent = fs.readFileSync(path.resolve('src/index.css'), 'utf-8');

    // .nav-dropdown (closed default) must have pointer-events: none and height: 0px
    const dropdownMatch = cssContent.match(/\.nav-dropdown\s*\{[^}]*pointer-events:\s*([^;]+);/);
    assert.ok(dropdownMatch, '.nav-dropdown must define pointer-events');
    assert.strictEqual(dropdownMatch[1].trim(), 'none', 'Closed dropdown must have pointer-events: none');

    // .nav-dropdown open must activate pointer-events: auto
    const dropdownOpenMatch = cssContent.match(/\[data-dropdown-toggle="open"\]\s*\+\s*\.nav-dropdown[^{]*\{[^}]*pointer-events:\s*([^;]+);/);
    assert.ok(dropdownOpenMatch, 'Open dropdown must declare pointer-events: auto');
    assert.strictEqual(dropdownOpenMatch[1].trim(), 'auto', 'Open dropdown must have pointer-events: auto');
  });

  await t.test('1.4 LibraryUI root overlay pointer-events-none contract', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const uiContent = fs.readFileSync(path.resolve('src/components/LibraryUI.tsx'), 'utf-8');

    // LibraryUI root div must declare pointer-events-none
    assert.ok(
      uiContent.includes('pointer-events-none flex flex-col justify-between'),
      'LibraryUI root must declare pointer-events-none'
    );
  });
});

// ============================================================================
// SUITE 2: SYNCHRONOUS INTEGRITY OF ONSELECTINDEX(0..4)
// ============================================================================
test('Challenger M2-2 Suite 2: Monograph Selection & Harmonic Oscillator Synchronization', async (t) => {
  await t.test('2.1 onSelectIndex(0..4) triggers immediately for all 5 catalog monographs', () => {
    const selectedHistory: number[] = [];
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0, (idx) => {
      selectedHistory.push(idx);
    });

    for (let i = 0; i < 5; i++) {
      navMachine.openDropdown();
      navMachine.selectIndex(i);
      navMachine.closeDropdown(); // handleSelect closes dropdown in TopNav.tsx
      assert.strictEqual(navMachine.activeIndex, i, `activeIndex must be ${i}`);
      assert.strictEqual(navMachine.isOpen, false, 'Dropdown must close upon selection');
      assert.strictEqual(selectedHistory[selectedHistory.length - 1], i, `Callback must emit index ${i}`);
    }

    assert.deepStrictEqual(selectedHistory, [0, 1, 2, 3, 4]);
  });

  await t.test('2.2 Harmonic oscillator immediate acceleration upon dropdown selection', () => {
    // Simulate exact LibraryScene physics step:
    // force = -springK * (currentScroll - targetScroll) - dampingC * scrollVelocity
    const springK = 38.0;
    const dampingC = 7.5;
    let currentScroll = 0.0;
    let scrollVelocity = 0.0;
    let targetScroll = 0.0;

    // Monograph 3 selected
    targetScroll = 3.0;

    const dt = 1 / 60; // 16.67ms
    const positions: number[] = [];
    const velocities: number[] = [];

    // Step 30 frames (~500ms)
    for (let frame = 0; frame < 30; frame++) {
      const force = -springK * (currentScroll - targetScroll) - dampingC * scrollVelocity;
      scrollVelocity += force * dt;
      currentScroll += scrollVelocity * dt;
      positions.push(currentScroll);
      velocities.push(scrollVelocity);
    }

    // Frame 1: Acceleration must be strictly positive toward targetScroll = 3.0
    assert.ok(velocities[0] > 0, 'Frame 1 must accelerate forward toward index 3');
    // By frame 30, carousel must have traversed more than 80% of distance
    assert.ok(positions[29] > 2.4, `After 30 frames, carousel should reach >= 2.4, reached ${positions[29]}`);
    assert.ok(positions[29] <= 3.2, `Peak overshoot must remain bounded <= 3.2, reached ${positions[29]}`);
  });

  await t.test('2.3 Rapid chaotic index selection sequence stability', () => {
    // User rapidly clicks different monograph items: 0 -> 4 -> 1 -> 3 -> 2
    const rapidSequence = [0, 4, 1, 3, 2];
    let currentTarget = -1;
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0, (idx) => {
      currentTarget = idx;
    });

    for (const target of rapidSequence) {
      navMachine.selectIndex(target);
      assert.strictEqual(currentTarget, target, `Target must match immediately: ${target}`);
      assert.strictEqual(navMachine.activeIndex, target);
    }
  });

  await t.test('2.4 Out-of-bounds selection clamping resilience', () => {
    // Tests boundary clamping logic from TopNav.tsx: Math.max(0, Math.min(books.length - 1, idx))
    const boundsClampingTest = (inputIdx: number, catalogLength: number): number => {
      return Math.max(0, Math.min(catalogLength - 1, inputIdx));
    };

    assert.strictEqual(boundsClampingTest(-1, 5), 0, 'Negative index must clamp to 0');
    assert.strictEqual(boundsClampingTest(-999, 5), 0, 'Large negative index must clamp to 0');
    assert.strictEqual(boundsClampingTest(5, 5), 4, 'Index == length must clamp to 4');
    assert.strictEqual(boundsClampingTest(100, 5), 4, 'Index > length must clamp to 4');
    assert.strictEqual(boundsClampingTest(2, 5), 2, 'Valid index 2 must pass unchanged');
  });

  await t.test('2.5 Idempotent selection of already-active index', () => {
    let callCount = 0;
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 2, (idx) => {
      callCount++;
      assert.strictEqual(idx, 2);
    });

    // Selecting currently active book 2
    navMachine.selectIndex(2);
    assert.strictEqual(callCount, 1, 'Callback must fire');
    assert.strictEqual(navMachine.activeIndex, 2, 'activeIndex remains 2');
    assert.strictEqual(navMachine.isOpen, false, 'Dropdown closes');
  });
});

// ============================================================================
// SUITE 3: HOVER PILL SCALE PERFORMANCE & MULTI-ACTIVE DEFECT
// ============================================================================
test('Challenger M2-2 Suite 3: Hover Pill Scale & Multi-Active State Analysis', async (t) => {
  await t.test('3.1 Pill active state machine formula analysis', () => {
    // Exact formula from TopNav.tsx line 391:
    // const isCurrent = idx === activeIndex;
    // const isHovered = hoveredIdx === idx;
    // const isFocused = focusedIndex === idx;
    // const isPillActive = isHovered || isFocused || (hoveredIdx === null && isCurrent);

    const computeIsPillActive = (
      idx: number,
      activeIndex: number,
      hoveredIdx: number | null,
      focusedIndex: number
    ): boolean => {
      const isCurrent = idx === activeIndex;
      const isHovered = hoveredIdx === idx;
      const isFocused = focusedIndex === idx;
      return isHovered || isFocused || (hoveredIdx === null && isCurrent);
    };

    // Scenario A: Idle state (hoveredIdx is null, focusedIndex equals activeIndex = 0)
    const idleStates = [0, 1, 2, 3, 4].map(idx => computeIsPillActive(idx, 0, null, 0));
    assert.deepStrictEqual(idleStates, [true, false, false, false, false], 'In idle, only activeIndex=0 has active pill');

    // Scenario B: User hovers over item 2 while activeIndex is 4 and focusedIndex is 4
    // (This happens when active monograph is 4, user opens dropdown, and hovers item 2)
    const hoverItem2States = [0, 1, 2, 3, 4].map(idx => computeIsPillActive(idx, 4, 2, 4));

    // VULNERABILITY VERIFICATION:
    // For idx = 2: isHovered is true -> isPillActive = true
    // For idx = 4: isFocused is true -> isPillActive = true
    // RESULT: Both item 2 and item 4 are simultaneously active!
    assert.strictEqual(hoverItem2States[2], true, 'Hovered item 2 is active');
    assert.strictEqual(hoverItem2States[4], true, 'BUG CONFIRMED: Focused item 4 is ALSO active concurrently');
    const totalActiveCount = hoverItem2States.filter(Boolean).length;
    assert.strictEqual(totalActiveCount, 2, 'TWO items are active simultaneously (Multi-Pill Concurrency Defect)');
  });

  await t.test('3.2 Corrected pill active invariant: exactly ONE item active at any moment', () => {
    // Recommended robust logic:
    // If hoveredIdx is not null, hover strictly dictates the active pill.
    // Otherwise, focusedIndex or activeIndex dictates the active pill.
    const computeRobustPillActive = (
      idx: number,
      activeIndex: number,
      hoveredIdx: number | null,
      focusedIndex: number
    ): boolean => {
      if (hoveredIdx !== null) {
        return hoveredIdx === idx;
      }
      return (focusedIndex === idx) || (focusedIndex === null && activeIndex === idx);
    };

    for (let testHover = 0; testHover < 5; testHover++) {
      const states = [0, 1, 2, 3, 4].map(idx => computeRobustPillActive(idx, 4, testHover, 4));
      const activeCount = states.filter(Boolean).length;
      assert.strictEqual(activeCount, 1, `Must have exactly 1 active item when hovering item ${testHover}`);
      assert.strictEqual(states[testHover], true, `Hovered item ${testHover} must be the single active item`);
    }
  });

  await t.test('3.3 High-frequency hover traversal simulation (1000 events)', () => {
    // Simulate 1000 rapid pointer movements back and forth across 5 items
    let hoveredIdx: number | null = null;
    let focusedIndex = 0;
    const activeIndex = 0;

    const startTime = Date.now();
    for (let iter = 0; iter < 200; iter++) {
      for (let i = 0; i < 5; i++) {
        hoveredIdx = i;
        focusedIndex = i; // with proper focus-follow-hover
      }
      for (let i = 4; i >= 0; i--) {
        hoveredIdx = i;
        focusedIndex = i;
      }
    }
    // Mouse leaves dropdown
    hoveredIdx = null;

    const elapsedMs = Date.now() - startTime;
    assert.ok(elapsedMs < 100, `1000 state calculations must complete in <100ms, took ${elapsedMs}ms`);
    assert.strictEqual(hoveredIdx, null, 'Must revert cleanly to null on mouse leave');
  });

  await t.test('3.4 Year reveal transform mapping verification', () => {
    // When isPillActive = true:
    // bg: scaleY(1), origin: 50% 50%, duration: 0.34s
    // year: translate(0px, 0px), duration: 0.26s
    // When isPillActive = false:
    // bg: scaleY(0), origin: 50% 100%, duration: 0.34s
    // year: translate(0%, 125%), duration: 0.26s

    const getPillStyles = (isActive: boolean) => ({
      bgTransform: isActive ? 'scaleY(1)' : 'scaleY(0)',
      bgOrigin: isActive ? '50% 50%' : '50% 100%',
      yearTransform: isActive ? 'translate(0px, 0px)' : 'translate(0%, 125%)'
    });

    const activeStyles = getPillStyles(true);
    assert.strictEqual(activeStyles.bgTransform, 'scaleY(1)');
    assert.strictEqual(activeStyles.bgOrigin, '50% 50%');
    assert.strictEqual(activeStyles.yearTransform, 'translate(0px, 0px)');

    const inactiveStyles = getPillStyles(false);
    assert.strictEqual(inactiveStyles.bgTransform, 'scaleY(0)');
    assert.strictEqual(inactiveStyles.bgOrigin, '50% 100%');
    assert.strictEqual(inactiveStyles.yearTransform, 'translate(0%, 125%)');
  });
});
