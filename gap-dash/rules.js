// Logical coordinates stay fixed even when the display changes shape.
export const WORLD = { width: 400, height: 680, left: 36, right: 364, y: 360, radius: 13, gateX: 200, gateWidth: 28, gap: 112, amplitude: 128, duration: .46 };
export function gateSpeed(score) { return .95 + Math.min(score, 30) * .035; }
export function gapCenter(phase) { return WORLD.y + Math.sin(phase) * WORLD.amplitude; }
export function hitsGate(x, center) {
  const dx = Math.max(Math.abs(x - WORLD.gateX) - WORLD.gateWidth / 2, 0);
  const dy = WORLD.gap / 2 - Math.abs(WORLD.y - center);
  // Circle against either solid rectangle; touching an edge counts as a hit.
  return dx <= WORLD.radius && (dy <= 0 || dx * dx + dy * dy <= WORLD.radius * WORLD.radius);
}
