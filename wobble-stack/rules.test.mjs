import test from 'node:test';
import assert from 'node:assert/strict';
import { assessStack, advanceSlider } from './rules.mjs';
const platform = { x: 210, w: 248 };
const block = x => ({ x, w: 142 });
test('centered towers remain stable', () => {
  assert.equal(assessStack(Array.from({ length: 30 }, () => block(210)), platform).stable, true);
});
test('a small overlap does not guarantee support', () => {
  assert.equal(assessStack([block(210), block(320)], platform).stable, false);
});
test('weight above a lower joint can topple otherwise supported neighbors', () => {
  assert.equal(assessStack([block(210), block(265), block(320)], platform).stable, false);
});
test('a balancing placement can reduce the stress at a lower joint', () => {
  const leaning = assessStack([block(210), block(265)], platform);
  const balanced = assessStack([block(210), block(265), block(210)], platform);
  assert.equal(balanced.stable, true);
  assert.ok(balanced.joints[1].risk < leaning.joints[1].risk);
});
test('whole-tower weight must stay over the rooftop platform', () => {
  assert.equal(assessStack([block(330), block(340)], platform).stable, false);
});
test('slider reflection preserves travel across frame rates and multiple bounces', () => {
  const once = advanceSlider(100, 1, 213, 5, 71, 349);
  let small = { x: 100, direction: 1 };
  for (let i = 0; i < 500; i++) small = advanceSlider(small.x, small.direction, 213, .01, 71, 349);
  assert.ok(Math.abs(once.x - 89) < 1e-8);
  assert.ok(Math.abs(once.x - small.x) < 1e-8);
  assert.equal(once.direction, small.direction);
  assert.ok(once.x >= 71 && once.x <= 349);
});
