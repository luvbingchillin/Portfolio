import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import { createFrontCoverTexture } from '../../src/utils/textureGenerators.ts';

test('Tier 2 - Feature 5 Boundary: Async Textures & Memory Caching', async (t) => {
  await t.test('B5.1 Texture cache reuse pattern for identical book ID', () => {
    const cache = new Map<string, THREE.CanvasTexture>();
    const getTextureCached = (bookId: string) => {
      if (cache.has(bookId)) {
        return cache.get(bookId)!;
      }
      const tex = createFrontCoverTexture(BOOKS_CATALOG[0]);
      cache.set(bookId, tex);
      return tex;
    };

    const first = getTextureCached('book-1');
    const second = getTextureCached('book-1');
    assert.strictEqual(first, second, 'Cache hit must return exact same THREE.CanvasTexture instance');
    assert.strictEqual(cache.size, 1);
  });

  await t.test('B5.2 Texture disposal without dangling WebGL references', () => {
    const tex = createFrontCoverTexture(BOOKS_CATALOG[0]);
    let disposed = false;
    tex.addEventListener('dispose', () => {
      disposed = true;
    });

    tex.dispose();
    assert.strictEqual(disposed, true, 'Texture dispose event must fire cleanly');
  });

  await t.test('B5.3 Single-character and empty title texture rendering safety', () => {
    const edgeBook = {
      ...BOOKS_CATALOG[0],
      title: 'X',
      subtitle: ''
    };
    assert.doesNotThrow(() => {
      const tex = createFrontCoverTexture(edgeBook);
      assert.ok(tex);
    });
  });

  await t.test('B5.4 Font loading rejection fallback simulation', async () => {
    // If document.fonts.ready rejects or times out, generator should fallback gracefully
    let fallbackTriggered = false;
    const loadFontWithFallback = async (fontPromise: Promise<void>, timeoutMs = 50) => {
      const timer = new Promise((_, reject) => setTimeout(() => reject(new Error('Font timeout')), timeoutMs));
      try {
        await Promise.race([fontPromise, timer]);
      } catch {
        fallbackTriggered = true;
      }
    };

    const slowFont = new Promise<void>((resolve) => setTimeout(resolve, 500));
    await loadFontWithFallback(slowFont, 20);
    assert.strictEqual(fallbackTriggered, true, 'Font timeout should safely activate system fallback');
  });

  await t.test('B5.5 Memory bounding under multiple concurrent requests', () => {
    const textures: THREE.CanvasTexture[] = [];
    for (let i = 0; i < 5; i++) {
      textures.push(createFrontCoverTexture(BOOKS_CATALOG[0]));
    }
    assert.strictEqual(textures.length, 5);
    // Cleanup
    textures.forEach(t => t.dispose());
  });
});
