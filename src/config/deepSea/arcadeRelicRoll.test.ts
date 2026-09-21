import assert from 'node:assert/strict';
import test from 'node:test';
import { rollDeepSeaRelicPart } from './arcadeRelicRoll';

test('two misses guarantee the next clear and reset the miss streak', () => {
  const parts = ['pearl', 'shell', 'coral'];
  const first = rollDeepSeaRelicPart(parts, 0, () => .99);
  const second = rollDeepSeaRelicPart(parts, first.consecutiveMisses, () => .99);
  const third = rollDeepSeaRelicPart(parts, second.consecutiveMisses, () => .99);
  assert.equal(first.partId, undefined);
  assert.equal(second.partId, undefined);
  assert.equal(third.partId, 'coral');
  assert.equal(third.consecutiveMisses, 0);
});

test('roll only selects an unowned candidate and stops at five of five', () => {
  assert.equal(rollDeepSeaRelicPart(['last'], 2, () => .99).partId, 'last');
  assert.deepEqual(rollDeepSeaRelicPart([], 2, () => 0), { partId: undefined, consecutiveMisses: 2 });
  assert.equal(rollDeepSeaRelicPart(['pearl'], 0, () => .1).partId, 'pearl');
});
