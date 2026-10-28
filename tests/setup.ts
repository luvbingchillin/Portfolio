/**
 * Athenaeum 3D Portfolio - Test Environment Setup & Mocks
 * Provides lightweight DOM, Canvas, WebGL, and Timer mocks for Node.js test runs.
 */

export class MockCanvasRenderingContext2D {
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  lineWidth = 1;
  font = '10px sans-serif';
  textAlign: CanvasTextAlign = 'start';
  letterSpacing = '0px';
  shadowColor = 'transparent';
  shadowBlur = 0;
  shadowOffsetY = 0;
  globalAlpha = 1.0;

  fillRect(_x: number, _y: number, _w: number, _h: number): void {}
  strokeRect(_x: number, _y: number, _w: number, _h: number): void {}
  stroke(): void {}
  fill(): void {}
  beginPath(): void {}
  closePath(): void {}
  arc(_x: number, _y: number, _r: number, _s: number, _e: number): void {}
  moveTo(_x: number, _y: number): void {}
  lineTo(_x: number, _y: number): void {}
  save(): void {}
  restore(): void {}
  translate(_x: number, _y: number): void {}
  rotate(_angle: number): void {}
  scale(_x: number, _y: number): void {}
  
  getImageData(_sx: number, _sy: number, sw: number, sh: number) {
    return { data: new Uint8ClampedArray(sw * sh * 4) };
  }
  
  putImageData(_imagedata: unknown, _dx: number, _dy: number): void {}
  
  createRadialGradient(_x0: number, _y0: number, _r0: number, _x1: number, _y1: number, _r1: number) {
    return {
      addColorStop(_offset: number, _color: string) {}
    };
  }

  createLinearGradient(_x0: number, _y0: number, _x1: number, _y1: number) {
    return {
      addColorStop(_offset: number, _color: string) {}
    };
  }

  measureText(text: string) {
    return {
      width: (text || '').length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2
    };
  }

  fillText(_text: string, _x: number, _y: number): void {}
}

export class MockHTMLCanvasElement {
  width = 1024;
  height = 1400;
  style: Record<string, string> = {};

  getContext(contextId: string) {
    if (contextId === '2d') {
      return new MockCanvasRenderingContext2D();
    }
    return null;
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 1920, height: 1080, right: 1920, bottom: 1080 };
  }
}

export function initTestEnvironment(): void {
  if (typeof globalThis.document === 'undefined') {
    const mockDoc = {
      createElement(tag: string) {
        if (tag === 'canvas') {
          return new MockHTMLCanvasElement();
        }
        return {
          style: {},
          setAttribute() {},
          getAttribute() { return null; },
          addEventListener() {},
          removeEventListener() {},
          appendChild() {},
          removeChild() {}
        };
      },
      fonts: {
        ready: Promise.resolve(),
        check() { return true; }
      },
      body: {
        appendChild() {},
        removeChild() {}
      }
    };
    (globalThis as unknown as { document: unknown }).document = mockDoc;
  }

  if (typeof globalThis.window === 'undefined') {
    (globalThis as unknown as { window: unknown }).window = globalThis;
  }

  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    (globalThis as unknown as { requestAnimationFrame: (cb: (time: number) => void) => number }).requestAnimationFrame = (cb) => {
      return setTimeout(() => cb(Date.now()), 16) as unknown as number;
    };
    (globalThis as unknown as { cancelAnimationFrame: (id: number) => void }).cancelAnimationFrame = (id) => {
      clearTimeout(id);
    };
  }
}

// Auto-initialize when imported
initTestEnvironment();
