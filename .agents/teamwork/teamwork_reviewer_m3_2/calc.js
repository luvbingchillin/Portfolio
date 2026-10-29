function bezier(p0, p1, p2, p3, t) {
  const cx = 3 * p0;
  const bx = 3 * (p2 - p0) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1;
  const by = 3 * (p3 - p1) - cy;
  const ay = 1 - cy - by;
  let s = t;
  for (let i = 0; i < 8; i++) {
    const x = ((ax * s + bx) * s + cx) * s - t;
    if (Math.abs(x) < 1e-5) break;
    const dx = (3 * ax * s + 2 * bx) * s + cx;
    if (Math.abs(dx) < 1e-5) break;
    s -= x / dx;
  }
  return ((ay * s + by) * s + cy) * s;
}

const val = bezier(0.32, 0.72, 0, 1, 500 / 700);
console.log('Progress at 500ms / 700ms:', val);
console.log('Remaining translateY %:', 120 * (1 - val));
