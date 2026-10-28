// Blocks are equal-density rectangles; mass is proportional to width.
// At every seam, the center of mass above it must lie inside the actual
// contact patch with a 7px safety margin. At least 28% must touch.
export function assessStack(blocks, platform) {
  const joints = [];
  let mass = 0, moment = 0;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i], below = i ? blocks[i - 1] : platform;
    mass += b.w;
    moment += b.x * b.w;
    const left = Math.max(b.x - b.w / 2, below.x - below.w / 2);
    const right = Math.min(b.x + b.w / 2, below.x + below.w / 2);
    const center = moment / mass;
    const half = (right - left) / 2 - 7;
    const risk = half > 0 ? Math.abs(center - (left + right) / 2) / half : Infinity;
    joints[i] = { risk, center, left, right };
    if (right - left < Math.min(b.w, below.w) * .28 || risk >= 1) {
      return { stable: false, risk: 1, joints, reason: 'The weight tipped past its support.' };
    }
  }
  return { stable: true, risk: Math.max(0, ...joints.map(j => j.risk)), joints, reason: '' };
}

// Unfold the reflected track, move, then fold back. Handles multiple bounces.
export function advanceSlider(x, direction, speed, dt, min, max) {
  const span = max - min;
  const phase = ((direction > 0 ? x - min : span * 2 - (x - min)) + speed * dt) % (span * 2);
  return phase < span ? { x: min + phase, direction: 1 } : { x: max - (phase - span), direction: -1 };
}
