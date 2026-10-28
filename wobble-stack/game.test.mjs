// Run the real game loop with a minimal DOM/canvas adapter: no browser dependency.
import test from 'node:test';
import assert from 'node:assert/strict';

test('full run: thirty landings, camera follow, pause, blocked storage, collapse and retry', async () => {
  const nodes = new Map();
  const listeners = new Map();
  let raf, storageWrites = 0, now = performance.now(), jellyPositions = [];
  const nativeWrites = [];
  const noop = () => {};
  const context = new Proxy({}, { get: (_, name) => name === 'createLinearGradient' ? () => ({ addColorStop: noop }) : name === 'translate' ? (x, y) => { if (x !== 0) jellyPositions.push({ x, y }); } : noop, set: () => true });
  function node(id) {
    const handlers = new Map();
    const n = { id, textContent: '', value: '0', dataset: {}, hidden: true, handlers, setAttribute: noop, addEventListener: (name, fn) => handlers.set(name, fn), getBoundingClientRect: () => ({ width: 390, height: 844 }), getContext: () => context };
    nodes.set(id, n); return n;
  }
  for (const id of ['canvas', 'score', 'best', 'message', 'hint', 'pause', 'overlay', 'eyebrow', 'title', 'description', 'result', 'action', 'actionHint', 'game']) node(id);
  globalThis.document = { hidden: false, querySelector: selector => nodes.get(selector === '.game' ? 'game' : selector.slice(1)), getElementById: id => nodes.get(id), addEventListener: (name, fn) => listeners.set(name, fn) };
  globalThis.window = { addEventListener: (name, fn) => listeners.set(name, fn), wobbleNative: { bestScore: 0, saveBestScore(value) { nativeWrites.push(value); throw Error('native storage unavailable'); } } };
  globalThis.devicePixelRatio = 1;
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.ResizeObserver = class { observe() {} };
  globalThis.localStorage = { getItem() { throw Error('blocked'); }, setItem() { storageWrites++; throw Error('blocked'); } };
  globalThis.requestAnimationFrame = fn => { raf = fn; };
  await import('./game.mjs');
  const state = () => nodes.get('game').dataset.state;
  const score = () => Number(nodes.get('score').value);
  const click = id => nodes.get(id).handlers.get('click')();
  const space = () => listeners.get('keydown')({ code: 'Space', repeat: false, preventDefault: noop, target: { tagName: 'BODY' } });
  const tick = () => { jellyPositions = []; now += 1000 / 120; raf(now); };
  const advance = seconds => { for (let i = 0; i < Math.round(seconds * 120); i++) tick(); };
  const until = predicate => { for (let i = 0; i < 500 && !predicate(); i++) tick(); assert.ok(predicate(), `Expected condition, state=${state()}, score=${score()}`); };
  tick();
  assert.equal(state(), 'ready');
  advance(1.2); space();
  assert.equal(state(), 'falling');
  click('pause'); advance(2);
  assert.equal(state(), 'paused'); assert.equal(score(), 0);
  click('action');
  until(() => score() === 1);
  // Each fresh slider starts at a known edge. Aim near the same center each time.
  for (let expected = 2; expected <= 30; expected++) {
    const previous = expected - 1;
    const speed = Math.min(190, 108 + previous * 4);
    const distance = previous % 2 ? 338 - 211 : 211 - 82;
    advance(distance / speed); space();
    until(() => score() === expected || state() === 'over');
    assert.equal(score(), expected);
  }
  advance(.5);
  assert.ok(jellyPositions.at(-1).y > 180 && jellyPositions.at(-1).y < 360, 'camera keeps incoming block beneath the HUD');
  assert.ok(storageWrites >= 30, 'blocked writes preserve the playable session');
  assert.deepEqual(nativeWrites, Array.from({ length: 30 }, (_, i) => i + 1), 'native bridge receives each best score; errors do not interrupt play');
  listeners.get('wobble-native-pause')();
  assert.equal(state(), 'paused', 'native lifecycle event pauses the game');
  click('action');
  document.hidden = true; listeners.get('visibilitychange')();
  assert.equal(state(), 'paused'); advance(2); assert.equal(score(), 30);
  document.hidden = false; listeners.get('visibilitychange')();
  assert.equal(state(), 'paused', 'returning to tab waits for intentional resume');
  click('action');
  // A deliberate far-edge placement overlaps a little, but is not supported.
  const speed = Math.min(190, 108 + score() * 4);
  advance((338 - jellyPositions.at(-1).x) / speed);
  space(); until(() => state() === 'over');
  assert.equal(score(), 30, 'failed placements earn no point');
  click('action');
  assert.equal(state(), 'ready'); assert.equal(score(), 0);
  assert.equal(nodes.get('best').textContent, 'BEST 30');
  advance(.2); assert.equal(state(), 'ready', 'retry leaves timing under player control');
});
