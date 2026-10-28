import test from 'node:test';
import assert from 'node:assert/strict';
const { Game, STEP, TAU, SPIKE_ANGLE, speedFor } = await import('./physics.mjs');
function tick(game, seconds, decide = () => {}) {
  for (let i = 0; i < Math.round(seconds / STEP); i++) { decide(game); game.step(STEP); }
}
test('grounded runner hits the spike before scoring a lap', () => {
  const g = new Game(); tick(g, 8); assert.equal(g.dead, true); assert.equal(g.score, 0);
});
test('jump cannot be renewed in midair', () => {
  const g = new Game(); assert.equal(g.jump(), true); tick(g, .2);
  const height = g.height; assert.equal(g.jump(), false); assert.equal(g.height, height);
});
test('well timed jumps clear repeated laps at the speed cap', () => {
  const g = new Game(); g.score = 100; g.angle += 100 * TAU;
  tick(g, 25, g => {
    const ahead = ((SPIKE_ANGLE - g.angle) % TAU + TAU) % TAU;
    if (ahead < speedFor(g.score) * .27 && !g.airborne) g.jump();
  });
  assert.equal(g.dead, false); assert.ok(g.score >= 105); assert.ok(speedFor(1000) <= 2.8);
});
test('same simulated duration produces the same orbit and jump', () => {
  const a = new Game(), b = new Game(); a.jump(); b.jump();
  tick(a, 1); for (let i = 0; i < 60; i++) for (let n = 0; n < 4; n++) b.step(STEP);
  assert.ok(Math.abs(a.angle - b.angle) < 1e-9); assert.equal(a.height, b.height);
});

test('pace is brisk from the start and reaches its ceiling by lap twelve', () => {
  assert.equal(speedFor(0), 1.3);
  assert.equal(speedFor(6), 2.08);
  assert.equal(speedFor(12), 2.8);
  assert.equal(speedFor(1000), 2.8);
});
function attempt(lead, score) {
  const g = new Game(); g.score=score; g.angle+=score*TAU;
  let jumped=false;
  tick(g, 6, g => {
    const ahead=((SPIKE_ANGLE-g.angle)%TAU+TAU)%TAU;
    if(!jumped && ahead < speedFor(score)*lead) {g.jump();jumped=true;}
  });
  return g.score > score;
}
test('first-lap timing rewards a centered jump and rejects early or late taps', () => {
  assert.equal(attempt(.27,0),true);
  assert.equal(attempt(.46,0),false);
  assert.equal(attempt(.07,0),false);
});
test('top speed retains a usable timing window', () => {
  for(const lead of [.22,.27,.32]) assert.equal(attempt(lead,12),true, `lead ${lead}`);
});
