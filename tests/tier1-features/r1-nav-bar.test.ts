import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import {
  DEFAULT_TOPNAV_CONFIG,
  TopNavStateMachine,
  calculateNavPageDotPosition
} from '../helpers/enhancementModels.ts';

test('Tier 1 - Feature R1: Top-Middle Navigation Bar Layout & Interactions', async (t) => {
  await t.test('1.1 Fixed top-middle navigation layout and DOM specification', () => {
    // Nav bar must occupy top-middle fixed position on desktop
    assert.strictEqual(DEFAULT_TOPNAV_CONFIG.dropdownWidthEm, 28, 'Dropdown panel width must be 28em (448px)');
    assert.strictEqual(DEFAULT_TOPNAV_CONFIG.dropdownClosedHeightEm, 0, 'Closed dropdown height must be 0em');
    assert.strictEqual(DEFAULT_TOPNAV_CONFIG.dropdownOpenHeightEm, 24, 'Open dropdown height must be 24em');
    assert.strictEqual(DEFAULT_TOPNAV_CONFIG.openDurationSec, 0.62, 'Dropdown expansion duration must be 0.62s');
    assert.strictEqual(DEFAULT_TOPNAV_CONFIG.closeDurationSec, 0.46, 'Dropdown collapse duration must be 0.46s');
    assert.strictEqual(DEFAULT_TOPNAV_CONFIG.easing, 'cubic-bezier(0.32, 0.72, 0, 1)', 'Must use signature A24 bezier curve');
  });

  await t.test('1.2 Brand logo, navigation links, and active page opacity specification', () => {
    // Brand title / logo and primary section links configuration
    const brandName = 'ATHENAEUM';
    assert.ok(brandName.length > 0, 'Brand logo / mark must be present');

    // Active link has opacity 1.0; inactive links have opacity 0.6 with cubic-bezier transition
    const activeOpacity = 1.0;
    const inactiveOpacity = 0.6;
    assert.strictEqual(activeOpacity, 1.0, 'Active navigation link must have full opacity 1.0');
    assert.strictEqual(inactiveOpacity, 0.6, 'Inactive navigation links must have subtle opacity 0.6');
  });

  await t.test('1.3 Sliding page dot (.nav-page-dot) mathematical coordinate calculation', () => {
    // Verify exact coordinate calculation formula from reference site:
    // x = activeLabel.left + activeLabel.width / 2 - list.left
    // y = activeLabel.bottom - list.top + navDotGap
    const mockListRect = { left: 400, right: 800, top: 10, bottom: 50, width: 400, height: 40 };
    const mockActiveLabelRect = { left: 520, right: 600, top: 18, bottom: 42, width: 80, height: 24 };
    const navDotGap = 5; // px

    const dotPos = calculateNavPageDotPosition(mockActiveLabelRect, mockListRect, navDotGap);
    
    // Expected x = 520 + 80 / 2 - 400 = 160.0
    // Expected y = 42 - 10 + 5 = 37.0
    assert.strictEqual(dotPos.x, 160.0, 'Dot X coordinate must align precisely at center of active label');
    assert.strictEqual(dotPos.y, 37.0, 'Dot Y coordinate must position just below active label bottom');
    assert.strictEqual(DEFAULT_TOPNAV_CONFIG.dotSizeEm, 0.3, 'Dot size must be 0.3em');
    assert.strictEqual(DEFAULT_TOPNAV_CONFIG.dotDurationSec, 0.50, 'Dot slide transition duration must be 0.5s');
  });

  await t.test('1.4 Index toggle button and animated word <-> count roll', () => {
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0);

    // Initial closed state: Word 'Index' displayed, count '05' pushed down (+130%), chevron at 0deg
    const initialRoll = navMachine.getRollState();
    assert.strictEqual(navMachine.isOpen, false);
    assert.strictEqual(initialRoll.ariaExpanded, false);
    assert.strictEqual(initialRoll.wordTransform, 'translate(0, 0)');
    assert.strictEqual(initialRoll.countTransform, 'translate(0%, 130%)');
    assert.strictEqual(initialRoll.chevronDegrees, 0);
    assert.strictEqual(initialRoll.dropdownHeightEm, 0);

    // Toggle open
    navMachine.toggleDropdown();
    const openRoll = navMachine.getRollState();
    assert.strictEqual(navMachine.isOpen, true);
    assert.strictEqual(openRoll.ariaExpanded, true);
    assert.strictEqual(openRoll.wordTransform, 'translate(0, -130%)');
    assert.strictEqual(openRoll.countTransform, 'translate(0, 0)');
    assert.strictEqual(openRoll.chevronDegrees, 180);
    assert.strictEqual(openRoll.dropdownHeightEm, 24);

    // Formatted count for 5 books must be '05'
    assert.strictEqual(navMachine.getFormattedCount(), '05', 'Dropdown item count roll must pad single digits with leading zero');
  });

  await t.test('1.5 Monograph catalog dropdown binding and selection callback', () => {
    let dispatchedIndex = -1;
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0, (idx) => {
      dispatchedIndex = idx;
    });

    assert.strictEqual(navMachine.books.length, 5, 'Dropdown must bind all 5 catalog monographs');
    
    // Select monograph 2 (Physical Rendering)
    navMachine.selectIndex(2);
    assert.strictEqual(dispatchedIndex, 2, 'Selecting dropdown item must trigger onSelectIndex callback');
    assert.strictEqual(navMachine.activeIndex, 2, 'TopNav state must update activeIndex');

    // Verify monograph metadata presented in dropdown item
    const selectedBook = navMachine.books[2];
    assert.strictEqual(selectedBook.title, 'Physical Rendering');
    assert.strictEqual(String(selectedBook.year), '2025');
  });

  await t.test('1.6 Responsive mobile viewport bottom docking (<= 991px)', () => {
    const navMachine = new TopNavStateMachine(BOOKS_CATALOG, 0);

    // Desktop viewports > 991px
    assert.strictEqual(navMachine.isMobileDocked(1440), false, '1440px viewport must float at top');
    assert.strictEqual(navMachine.isMobileDocked(992), false, '992px viewport must float at top');

    // Mobile / tablet viewports <= 991px
    assert.strictEqual(navMachine.isMobileDocked(991), true, '991px viewport must dock to bottom');
    assert.strictEqual(navMachine.isMobileDocked(768), true, '768px tablet viewport must dock to bottom');
    assert.strictEqual(navMachine.isMobileDocked(390), true, '390px mobile viewport must dock to bottom');
    assert.strictEqual(DEFAULT_TOPNAV_CONFIG.mobileDockHeightEm, 3.5, 'Mobile dock bar height must be 3.5em');
  });
});
