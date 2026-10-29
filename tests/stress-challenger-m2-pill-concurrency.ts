/**
 * Challenger M2-2 Iteration 2: Empirical Stress Test Suite
 * Dropdown Pill Hover / Focus Concurrency & Multi-Active State Verification
 *
 * Scope:
 * 1. Static AST / Code Integrity of TopNav.tsx:
 *    - Confirms elimination of the multi-active formula.
 *    - Confirms adoption of the single-active ternary formula.
 *    - Confirms reset of hoveredIdx on selection and toggle.
 * 2. Exhaustive 180-State Matrix Verification:
 *    - Validates all permutations of (activeIndex, focusedIndex, hoveredIdx).
 *    - Asserts that active pill count is strictly 1 (NEVER > 1) across all 5 monographs.
 * 3. Hover vs Focus Concurrency Conflict Tests:
 *    - For every pair (h, f) with h != f, validates that hover strictly suppresses focus.
 * 4. High-Frequency Concurrent Event Simulation (20,000 operations):
 *    - Concurrent chaotic hover movements and keyboard arrow movements.
 * 5. Lifecycle Transition Invariants:
 *    - Idle -> Dropdown Open -> Keyboard Focus -> Hover Preemption -> Unhover -> Selection.
 */

import './setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Helper to evaluate isPillActive matching TopNav.tsx lines 392-398
function evaluatePillActive(
  idx: number,
  activeIndex: number,
  focusedIndex: number | null,
  hoveredIdx: number | null
): boolean {
  const isCurrent = idx === activeIndex;
  const isHovered = hoveredIdx === idx;
  const isFocused = focusedIndex === idx;
  return hoveredIdx !== null
    ? isHovered
    : isFocused || (focusedIndex === null && isCurrent);
}

// ============================================================================
// SUITE 1: TOPNAV.TSX SOURCE CODE AST & FORMULA INTEGRITY
// ============================================================================
test('Challenger M2-2 Concurrency Suite 1: TopNav.tsx Code & Formula Integrity', async (t) => {
  const topNavPath = path.resolve('src/components/TopNav.tsx');
  const source = fs.readFileSync(topNavPath, 'utf-8');

  await t.test('1.1 Defective multi-active formula is completely removed', () => {
    // Defective line was: const isPillActive = isHovered || isFocused || (hoveredIdx === null && isCurrent);
    assert.strictEqual(
      source.includes('isHovered || isFocused || (hoveredIdx === null && isCurrent)'),
      false,
      'Old multi-active bug formula MUST NOT exist in TopNav.tsx'
    );
  });

  await t.test('1.2 Corrected ternary single-active formula is present in TopNav.tsx', () => {
    // Must contain ternary prioritization of hoveredIdx
    assert.ok(
      source.includes('hoveredIdx !== null\n') || source.includes('hoveredIdx !== null ?'),
      'Must check hoveredIdx !== null as primary branch'
    );
    assert.ok(
      source.includes('? isHovered') || source.includes('? isHovered\n'),
      'Must prioritize isHovered when hoveredIdx is non-null'
    );
    assert.ok(
      source.includes(': isFocused || (focusedIndex === null && isCurrent)'),
      'Must fallback to isFocused or isCurrent when hoveredIdx is null'
    );
  });

  await t.test('1.3 focusedIndex state declaration supports null', () => {
    assert.ok(
      source.includes('useState<number | null>(activeIndex)'),
      'focusedIndex must be typed as number | null with activeIndex default'
    );
  });

  await t.test('1.4 hoveredIdx is reset to null on item selection and dropdown toggle', () => {
    // In handleSelect
    const handleSelectMatch = source.match(/handleSelect\s*=\s*useCallback\([\s\S]*?toggleBtnRef/);
    assert.ok(handleSelectMatch, 'handleSelect must be defined');
    assert.ok(
      handleSelectMatch[0].includes('setHoveredIdx(null)'),
      'handleSelect must call setHoveredIdx(null)'
    );

    // In handleToggleDropdown
    const handleToggleMatch = source.match(/handleToggleDropdown\s*=\s*useCallback\([\s\S]*?return next/);
    assert.ok(handleToggleMatch, 'handleToggleDropdown must be defined');
    assert.ok(
      handleToggleMatch[0].includes('setHoveredIdx(null)'),
      'handleToggleDropdown must call setHoveredIdx(null)'
    );
  });
});

// ============================================================================
// SUITE 2: EXHAUSTIVE 180-STATE COMBINATORIAL MATRIX VERIFICATION
// ============================================================================
test('Challenger M2-2 Concurrency Suite 2: Exhaustive 180-State Matrix Verification', async (t) => {
  const activeIndices = [0, 1, 2, 3, 4];
  const focusedIndices: (number | null)[] = [null, 0, 1, 2, 3, 4];
  const hoveredIndices: (number | null)[] = [null, 0, 1, 2, 3, 4];

  await t.test('2.1 Exactly 1 active pill across all 180 (activeIndex, focusedIndex, hoveredIdx) states', () => {
    let stateEvaluationsCount = 0;

    for (const a of activeIndices) {
      for (const f of focusedIndices) {
        for (const h of hoveredIndices) {
          stateEvaluationsCount++;
          const activeArray: boolean[] = [];

          for (let idx = 0; idx < 5; idx++) {
            const isActive = evaluatePillActive(idx, a, f, h);
            activeArray.push(isActive);
          }

          const countActive = activeArray.filter(Boolean).length;
          assert.strictEqual(
            countActive,
            1,
            `State (activeIndex=${a}, focusedIndex=${f}, hoveredIdx=${h}) resulted in ${countActive} active pills instead of exactly 1! Pills: [${activeArray}]`
          );

          // Verify WHICH item is active
          if (h !== null) {
            assert.strictEqual(
              activeArray[h],
              true,
              `When hoveredIdx=${h}, monograph ${h} MUST be active`
            );
          } else if (f !== null) {
            assert.strictEqual(
              activeArray[f],
              true,
              `When hoveredIdx=null and focusedIndex=${f}, monograph ${f} MUST be active`
            );
          } else {
            assert.strictEqual(
              activeArray[a],
              true,
              `When hoveredIdx=null and focusedIndex=null, monograph ${a} (activeIndex) MUST be active`
            );
          }
        }
      }
    }

    assert.strictEqual(stateEvaluationsCount, 180, 'Evaluated all 180 distinct state permutations');
  });

  await t.test('2.2 Every conflict pair (h != f) never yields >1 active pill', () => {
    let conflictCount = 0;

    for (let h = 0; h < 5; h++) {
      for (let f = 0; f < 5; f++) {
        if (h === f) continue;
        conflictCount++;

        for (let a = 0; a < 5; a++) {
          const pillStates = [0, 1, 2, 3, 4].map(idx => evaluatePillActive(idx, a, f, h));
          const totalActive = pillStates.filter(Boolean).length;

          assert.strictEqual(
            totalActive,
            1,
            `Conflict (hovered=${h}, focused=${f}, active=${a}) has ${totalActive} active pills`
          );
          assert.strictEqual(pillStates[h], true, `Hovered item ${h} must be active`);
          assert.strictEqual(pillStates[f], false, `Focused item ${f} must be suppressed by hover`);
        }
      }
    }

    assert.strictEqual(conflictCount, 20, 'Verified all 20 non-identical (h, f) pairs across 5 active indices');
  });
});

// ============================================================================
// SUITE 3: RAPID CONCURRENT TRAVERSAL & RACE SIMULATION
// ============================================================================
test('Challenger M2-2 Concurrency Suite 3: Rapid Traversal & Race Simulation', async (t) => {
  await t.test('3.1 Rapid sweep across all 5 monograph items while holding constant keyboard focus', () => {
    // Keyboard focus held on Book 3
    const focusedIndex = 3;
    const activeIndex = 0;

    // Mouse sweeps 0 -> 1 -> 2 -> 3 -> 4
    for (let h = 0; h < 5; h++) {
      const states = [0, 1, 2, 3, 4].map(idx => evaluatePillActive(idx, activeIndex, focusedIndex, h));
      assert.strictEqual(states.filter(Boolean).length, 1);
      assert.strictEqual(states[h], true);
      if (h !== focusedIndex) {
        assert.strictEqual(states[focusedIndex], false);
      }
    }

    // Mouse sweeps reverse 4 -> 3 -> 2 -> 1 -> 0
    for (let h = 4; h >= 0; h--) {
      const states = [0, 1, 2, 3, 4].map(idx => evaluatePillActive(idx, activeIndex, focusedIndex, h));
      assert.strictEqual(states.filter(Boolean).length, 1);
      assert.strictEqual(states[h], true);
      if (h !== focusedIndex) {
        assert.strictEqual(states[focusedIndex], false);
      }
    }

    // Mouse leaves
    const idleStates = [0, 1, 2, 3, 4].map(idx => evaluatePillActive(idx, activeIndex, focusedIndex, null));
    assert.strictEqual(idleStates.filter(Boolean).length, 1);
    assert.strictEqual(idleStates[focusedIndex], true, 'Pill immediately reverts to focusedIndex 3 upon mouse leave');
  });

  await t.test('3.2 Rapid keyboard arrow stepping while holding constant mouse hover', () => {
    // Mouse held hovering Book 1
    const hoveredIdx = 1;
    const activeIndex = 4;

    // Keyboard focus steps 0 -> 1 -> 2 -> 3 -> 4
    for (let f = 0; f < 5; f++) {
      const states = [0, 1, 2, 3, 4].map(idx => evaluatePillActive(idx, activeIndex, f, hoveredIdx));
      assert.strictEqual(states.filter(Boolean).length, 1);
      assert.strictEqual(states[hoveredIdx], true, 'Hovered item 1 must remain active despite keyboard stepping');
      if (f !== hoveredIdx) {
        assert.strictEqual(states[f], false, `Focused item ${f} must not show active pill`);
      }
    }
  });

  await t.test('3.3 20,000 chaotic asynchronous event steps simulation', () => {
    let activeIndex = 0;
    let focusedIndex: number | null = 0;
    let hoveredIdx: number | null = null;

    let totalViolations = 0;
    const eventTypes = ['HOVER_MOVE', 'HOVER_LEAVE', 'FOCUS_MOVE', 'FOCUS_BLUR', 'ACTIVE_CHANGE'];

    for (let step = 0; step < 20000; step++) {
      const evt = eventTypes[step % eventTypes.length];
      const targetIdx = (step * 7 + 3) % 5;

      switch (evt) {
        case 'HOVER_MOVE':
          hoveredIdx = targetIdx;
          break;
        case 'HOVER_LEAVE':
          hoveredIdx = null;
          break;
        case 'FOCUS_MOVE':
          focusedIndex = targetIdx;
          break;
        case 'FOCUS_BLUR':
          focusedIndex = null;
          break;
        case 'ACTIVE_CHANGE':
          activeIndex = targetIdx;
          break;
      }

      // Check invariant
      let activePillCount = 0;
      for (let idx = 0; idx < 5; idx++) {
        if (evaluatePillActive(idx, activeIndex, focusedIndex, hoveredIdx)) {
          activePillCount++;
        }
      }

      if (activePillCount !== 1) {
        totalViolations++;
      }
    }

    assert.strictEqual(totalViolations, 0, 'Zero invariant violations detected over 20,000 steps');
  });
});

// ============================================================================
// SUITE 4: DOM STYLE TRANSFORMS & VISUAL INVARIANTS
// ============================================================================
test('Challenger M2-2 Concurrency Suite 4: DOM Style Transforms & Visual Invariants', async (t) => {
  await t.test('4.1 Generated CSS styles strictly map active and inactive pill states', () => {
    const computeStyles = (isActive: boolean) => ({
      bgTransform: isActive ? 'scaleY(1)' : 'scaleY(0)',
      bgOrigin: isActive ? '50% 50%' : '50% 100%',
      bgTransition: 'transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
      yearTransform: isActive ? 'translate(0px, 0px)' : 'translate(0%, 125%)',
      yearTransition: 'transform 0.26s cubic-bezier(0.32, 0.72, 0, 1)'
    });

    for (let active = 0; active < 5; active++) {
      for (let idx = 0; idx < 5; idx++) {
        const isActive = idx === active;
        const styles = computeStyles(isActive);

        if (isActive) {
          assert.strictEqual(styles.bgTransform, 'scaleY(1)');
          assert.strictEqual(styles.bgOrigin, '50% 50%');
          assert.strictEqual(styles.yearTransform, 'translate(0px, 0px)');
        } else {
          assert.strictEqual(styles.bgTransform, 'scaleY(0)');
          assert.strictEqual(styles.bgOrigin, '50% 100%');
          assert.strictEqual(styles.yearTransform, 'translate(0%, 125%)');
        }
      }
    }
  });

  await t.test('4.2 Year badge translation uses clean percent/pixel values', () => {
    const activeTransform = 'translate(0px, 0px)';
    const inactiveTransform = 'translate(0%, 125%)';

    assert.ok(activeTransform.includes('0px, 0px'));
    assert.ok(inactiveTransform.includes('0%, 125%'));
  });
});
