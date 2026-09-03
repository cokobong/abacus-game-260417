import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyLavaValleyRewards,
  chargeMinigameEntry,
  createLavaValleyShopDropPlan,
  LAVA_VALLEY_COIN_PATTERNS,
  LAVA_VALLEY_COLLECTIBLE_LANES,
  LAVA_VALLEY_ENTRY_COST,
  LAVA_VALLEY_REWARDS_CONFIG,
  LAVA_VALLEY_RARE_FRAGMENT_ITEM_ID,
  MAX_RARE_FRAGMENTS_PER_RUN,
  lavaValleyRetryRequiresEntry,
  shouldCommitLavaValleyRewards,
} from './minigameConfig';
import { LAVA_VALLEY_SHOP_DROP_POOLS, SHOP_CATALOG } from './shopCatalog';
import { itemConfigs } from './itemConfig';

test('용암계곡은 150코인이고 목업 하늘섬은 무료다', () => {
  assert.equal(LAVA_VALLEY_ENTRY_COST, 150);
  assert.equal(chargeMinigameEntry(1000, 'lava-stepping-stones'), 850);
  assert.equal(chargeMinigameEntry(149, 'lava-stepping-stones'), null);
  assert.equal(chargeMinigameEntry(1000, 'sky-number-clouds'), 1000);
});

test('수집물 lane은 LOW/HIGH만 사용하고 코인 패턴은 두 행동 의미를 유지한다', () => {
  assert.deepEqual(LAVA_VALLEY_COLLECTIBLE_LANES, { low: 4, high: 18 });
  assert.ok(LAVA_VALLEY_COIN_PATTERNS.some((pattern) => pattern.every((height) => height === LAVA_VALLEY_COLLECTIBLE_LANES.low)));
  assert.ok(LAVA_VALLEY_COIN_PATTERNS.some((pattern) => Array.from<number>(pattern).includes(LAVA_VALLEY_COLLECTIBLE_LANES.high)));
  assert.ok(LAVA_VALLEY_COIN_PATTERNS.flat().every((height) => height === LAVA_VALLEY_COLLECTIBLE_LANES.low || height === LAVA_VALLEY_COLLECTIBLE_LANES.high));
});

test('완주만 보상을 지급하고 유료 재입장이 필요하다', () => {
  assert.equal(shouldCommitLavaValleyRewards('completed'), true);
  assert.equal(lavaValleyRetryRequiresEntry('completed'), true);
  for (const reason of ['hp_depleted', 'manual_restart', 'exit'] as const) {
    assert.equal(shouldCommitLavaValleyRewards(reason), false);
    assert.equal(lavaValleyRetryRequiresEntry(reason), false);
  }
});

test('용암계곡 보상은 기존 코인과 먹이/희귀조각 인벤토리에 누적한다', () => {
  const result = applyLavaValleyRewards(
    { coins: 850, inventory: [{ itemId: 'basic-meat', quantity: 2 }] },
    { coins: 50, shopItems: [{ itemId: 'basic-meat', quantity: 2 }, { itemId: 'hatch-warm-stone', quantity: 1 }, { itemId: 'green-starter-egg', quantity: 1 }, { itemId: 'rare-egg-fragment', quantity: 1 }], rareFragments: 1 },
    1,
  );
  assert.equal(result.state.coins, 900);
  assert.equal(result.state.inventory.find((item) => item.itemId === 'basic-meat')?.quantity, 4);
  assert.equal(result.state.inventory.find((item) => item.itemId === 'hatch-warm-stone')?.quantity, 1);
  assert.equal(result.state.inventory.find((item) => item.itemId === 'green-starter-egg'), undefined);
  assert.equal(result.state.inventory.find((item) => item.itemId === LAVA_VALLEY_RARE_FRAGMENT_ITEM_ID)?.quantity, 1);
});

test('코인 배율은 보상에만 적용하고 희귀조각은 판당 2개로 제한한다', () => {
  const result = applyLavaValleyRewards(
    { coins: 850, inventory: [] },
    { coins: 50, shopItems: [], rareFragments: 99 },
    1.3,
  );
  assert.equal(result.rewards.coins, 65);
  assert.equal(result.state.coins, 915);
  assert.equal(result.rewards.rareFragments, MAX_RARE_FRAGMENTS_PER_RUN);
  assert.equal(result.state.inventory.find((item) => item.itemId === LAVA_VALLEY_RARE_FRAGMENT_ITEM_ID)?.quantity, 2);
});

test('용암계곡은 90초이며 한 판 드롭 계획은 판매 중인 비알 아이템 1~2개만 포함한다', () => {
  assert.equal(LAVA_VALLEY_REWARDS_CONFIG.gameDurationSeconds, 90);
  for (let index = 0; index < 200; index += 1) {
    const plan = createLavaValleyShopDropPlan();
    assert.ok(plan.length >= 1 && plan.length <= 2);
    assert.ok(plan.every((drop) => drop.category === 'food' || drop.category === 'hatchItem'));
    assert.ok(plan.every((drop) => !SHOP_CATALOG.egg.includes(drop.itemId as never)));
    assert.ok(plan.every((drop) => itemConfigs.some((item) => item.id === drop.itemId && item.category === drop.category)));
    if (plan.length === 2) assert.ok(plan[1].spawnAtSeconds - plan[0].spawnAtSeconds >= 20);
  }
});

test('상점 아이템 카테고리 선택은 장기적으로 약 70:30이다', () => {
  let seed = 123456789;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  let food = 0;
  let hatchItem = 0;
  for (let index = 0; index < 10000; index += 1) {
    for (const drop of createLavaValleyShopDropPlan(random)) {
      if (drop.category === 'food') food += 1;
      else hatchItem += 1;
    }
  }
  const foodRatio = food / (food + hatchItem);
  assert.ok(foodRatio > 0.68 && foodRatio < 0.72, 'food ratio: ' + foodRatio);
  assert.deepEqual(LAVA_VALLEY_SHOP_DROP_POOLS.hatchItem, ['hatch-warm-stone', 'hatch-warm-blanket', 'hatch-spark-energy']);
});
