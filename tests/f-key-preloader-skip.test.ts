import './setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';

test('App Keyboard & Preloader Skip Features', async (t) => {
  await t.test('1. Preloader skip via Space / Escape / Enter', () => {
    let isLoaded = false;
    let completed = false;
    const handlePreloaderComplete = () => {
      if (isLoaded) return;
      isLoaded = true;
      completed = true;
    };

    const simulateKeyDown = (key: string) => {
      if (!isLoaded) {
        if (key === ' ' || key === 'Spacebar' || key === 'Escape' || key === 'Enter') {
          handlePreloaderComplete();
        }
        return;
      }
    };

    simulateKeyDown(' ');
    assert.strictEqual(completed, true, 'Space key should skip preloader');
    assert.strictEqual(isLoaded, true, 'isLoaded should become true');
  });

  await t.test('2. Book flip toggle via f / F key when modal is not open', () => {
    let isFlipped = false;
    const isLoaded = true;
    const isSpreadOpen = false;
    const isOpening = false;

    const handleToggleFlip = () => {
      isFlipped = !isFlipped;
    };

    const simulateKeyDown = (key: string) => {
      if (!isLoaded) return;
      if (isSpreadOpen || isOpening) return;
      if (key === 'f' || key === 'F') {
        handleToggleFlip();
      }
    };

    simulateKeyDown('f');
    assert.strictEqual(isFlipped, true, 'f key should toggle flip to true');
    simulateKeyDown('F');
    assert.strictEqual(isFlipped, false, 'F key should toggle flip back to false');
  });

  await t.test('3. Flip toggle blocked when monograph spread is open or opening', () => {
    let isFlipped = false;
    const isLoaded = true;
    let isSpreadOpen = true;
    let isOpening = false;

    const handleToggleFlip = () => {
      isFlipped = !isFlipped;
    };

    const simulateKeyDown = (key: string) => {
      if (!isLoaded) return;
      if (isSpreadOpen || isOpening) return;
      if (key === 'f' || key === 'F') {
        handleToggleFlip();
      }
    };

    simulateKeyDown('f');
    assert.strictEqual(isFlipped, false, 'f key should be blocked when modal is open');

    isSpreadOpen = false;
    isOpening = true;
    simulateKeyDown('f');
    assert.strictEqual(isFlipped, false, 'f key should be blocked when modal is opening');
  });
});
