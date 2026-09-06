import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyLavaValleyRewards,
  chargeMinigameEntry,
  createLavaValleyShopDropPlan,
  LAVA_VALLEY_COIN_PATTERNS,
  LAVA_VALLEY_COLLECTIBLE_LANES,
  LAVA_VALLEY_ENTRY_COST,
  LAVA_VALLEY_DURATION_SECONDS,
  SKY_ISLAND_DURATION_SECONDS,
  SKY_ISLAND_ENTRY_COST,
  LAVA_VALLEY_REWARDS_CONFIG,
  createRareFragmentSpawnPlan,
  RARE_FRAGMENT_COUNT_WEIGHTS,
  LAVA_VALLEY_RARE_FRAGMENT_ITEM_ID,
  MAX_RARE_FRAGMENTS_PER_RUN,
  lavaValleyRetryRequiresEntry,
  shouldCommitLavaValleyRewards,
} from './minigameConfig';
import { LAVA_VALLEY_SHOP_DROP_POOLS, SHOP_CATALOG } from './shopCatalog';
import { itemConfigs } from './itemConfig';

test('용암계곡과 하늘섬은 동일하게 입장료 150코인을 차감한다', () => {
  assert.equal(LAVA_VALLEY_ENTRY_COST, 150);
  assert.equal(chargeMinigameEntry(1000, 'lava-stepping-stones'), 850);
  assert.equal(chargeMinigameEntry(149, 'lava-stepping-stones'), null);
  assert.equal(SKY_ISLAND_ENTRY_COST, 150);
  assert.equal(chargeMinigameEntry(1000, 'sky-number-clouds'), 850);
  assert.equal(chargeMinigameEntry(149, 'sky-number-clouds'), null);
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
  assert.equal(result.state.inventory.find((item) => item.itemId === LAVA_VALLEY_RARE_FRAGMENT_ITEM_ID)?.quantity, 3);
});

test('용암계곡은 120초이며 한 판 드롭 계획은 판매 중인 비알 아이템 1~2개만 포함한다', () => {
  assert.equal(LAVA_VALLEY_DURATION_SECONDS, 120);
  assert.equal(SKY_ISLAND_DURATION_SECONDS, 120);
  assert.equal(LAVA_VALLEY_REWARDS_CONFIG.gameDurationSeconds, LAVA_VALLEY_DURATION_SECONDS);
  for (let index = 0; index < 200; index += 1) {
    const plan = createLavaValleyShopDropPlan();
    assert.ok(plan.length >= 1 && plan.length <= 2);
    assert.ok(plan.every((drop) => drop.category === 'food' || drop.category === 'hatchItem'));
    assert.ok(plan.every((drop) => !SHOP_CATALOG.egg.includes(drop.itemId as never)));
    assert.ok(plan.every((drop) => itemConfigs.some((item) => item.id === drop.itemId && item.category === drop.category)));
    if (plan.length === 2) assert.ok(plan[1].spawnAtSeconds - plan[0].spawnAtSeconds >= 20);
  }
});

test('희귀조각은 난이도별 예약 분포를 사용하고 획득 보상은 판당 3개로 제한한다', () => {
  assert.deepEqual(RARE_FRAGMENT_COUNT_WEIGHTS.normal, [0.22, 0.50, 0.23, 0.05]);
  assert.equal(MAX_RARE_FRAGMENTS_PER_RUN, 3);
  for (const difficulty of ['easy', 'normal', 'challenge'] as const) {
    let seed = 246813579; const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 0x100000000; };
    const plans = Array.from({ length: 1000 }, () => createRareFragmentSpawnPlan(difficulty, 120, random));
    const average = plans.reduce((sum, plan) => sum + plan.length, 0) / plans.length;
    const expectedRange = difficulty === 'easy' ? [0.8, 1.0] : difficulty === 'normal' ? [1.0, 1.2] : [1.2, 1.4];
    assert.ok(average >= expectedRange[0] && average <= expectedRange[1]);
    assert.ok(plans.every((plan) => plan.length <= 3 && plan.every((entry, index) => index === 0 || entry.spawnAtSeconds - plan[index - 1].spawnAtSeconds >= 20)));
  }
});

test('상점 드롭 개수는 늘리지 않고 120초 진행률에 맞춘 시간대에 배치한다', () => {
  const oneDrop = createLavaValleyShopDropPlan(() => 0);
  assert.equal(oneDrop.length, 1);
  assert.equal(oneDrop[0].spawnAtSeconds, 25 * (120 / 90));

  const randomValues = [0.75, 0, 0, 0, 0, 0, 0];
  const twoDrops = createLavaValleyShopDropPlan(() => randomValues.shift() ?? 0);
  assert.equal(twoDrops.length, 2);
  assert.equal(twoDrops[0].spawnAtSeconds, 20 * (120 / 90));
  assert.equal(twoDrops[1].spawnAtSeconds, 55 * (120 / 90));
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
