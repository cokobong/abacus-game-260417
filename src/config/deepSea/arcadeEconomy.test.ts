import assert from 'node:assert/strict';
import test from 'node:test';
import { applyDeepSeaPrototypeRewards, chargeMinigameEntry } from '../minigameConfig';

test('deep sea prototype entry stays free and clear payout stays separate from lava items', () => {
  assert.equal(chargeMinigameEntry(12, 'deep-sea-explorer', 2), 12);
  const original = { coins: 12, inventory: [{ itemId: 'food', quantity: 1 }] };
  const result = applyDeepSeaPrototypeRewards(original, { coins: 60, rareFragments: 3, shopItems: [{ itemId: 'lava-item', quantity: 1 }] }, 1, 2);
  assert.equal(result.rewards.coins, 45);
  assert.equal(result.state.coins, 57);
  assert.deepEqual(result.state.inventory, original.inventory);
  assert.equal(result.rewards.rareFragments, 0);
  assert.deepEqual(result.rewards.shopItems, []);
});
