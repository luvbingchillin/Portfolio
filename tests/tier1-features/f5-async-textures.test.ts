import '../setup.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BOOKS_CATALOG } from '../../src/data/booksData.ts';
import {
  createFrontCoverTexture,
  createSpineTexture,
  createBackCoverTexture,
  createPaperEdgesTexture
} from '../../src/utils/textureGenerators.ts';

test('Tier 1 - Feature 5: Async Texture Generator & Cache', async (t) => {
  const sampleBook = BOOKS_CATALOG[0];

  await t.test('5.1 Front cover texture generation & dimensions', () => {
    const tex = createFrontCoverTexture(sampleBook);
    assert.ok(tex instanceof THREE.CanvasTexture, 'Should produce THREE.CanvasTexture');
    assert.strictEqual(tex.image.width, 1024, 'Front cover width must be 1024px');
    assert.strictEqual(tex.image.height, 1400, 'Front cover height must be 1400px');
  });

  await t.test('5.2 Spine texture generation & dimensions', () => {
    const tex = createSpineTexture(sampleBook);
    assert.ok(tex instanceof THREE.CanvasTexture, 'Should produce THREE.CanvasTexture');
    assert.strictEqual(tex.image.width, 220, 'Spine width must be 220px');
    assert.strictEqual(tex.image.height, 1400, 'Spine height must be 1400px');
  });

  await t.test('5.3 Back cover texture generation & dimensions', () => {
    const tex = createBackCoverTexture(sampleBook);
    assert.ok(tex instanceof THREE.CanvasTexture, 'Should produce THREE.CanvasTexture');
    assert.strictEqual(tex.image.width, 1024, 'Back cover width must be 1024px');
    assert.strictEqual(tex.image.height, 1400, 'Back cover height must be 1400px');
  });

  await t.test('5.4 Paper edges texture wrapping and repeat', () => {
    const tex = createPaperEdgesTexture();
    assert.ok(tex instanceof THREE.CanvasTexture, 'Should produce THREE.CanvasTexture');
    assert.strictEqual(tex.image.width, 512, 'Paper edges width must be 512px');
    assert.strictEqual(tex.image.height, 512, 'Paper edges height must be 512px');
    assert.strictEqual(tex.wrapS, THREE.RepeatWrapping, 'wrapS must be RepeatWrapping');
    assert.strictEqual(tex.wrapT, THREE.RepeatWrapping, 'wrapT must be RepeatWrapping');
  });

  await t.test('5.5 SRGB color space configuration', () => {
    const frontTex = createFrontCoverTexture(sampleBook);
    assert.strictEqual(frontTex.colorSpace, THREE.SRGBColorSpace, 'Textures must use SRGBColorSpace');
  });
});
