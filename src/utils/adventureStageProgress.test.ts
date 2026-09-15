import assert from 'node:assert/strict';
import test from 'node:test';
import { ADVENTURE_STAGE_CATALOG, getAdventureStage } from '../config/adventureStageCatalog';
import { canPlayAdventureStage, completeAdventureStage, getAdventureStageState, normalizeAdventureStageProgress, visitAdventureStage } from './adventureStageProgress';
import { applyLavaValleyRewards, createLavaValleyShopDropPlan } from '../config/minigameConfig';
import { getItemConfig } from '../config/itemConfig';
import { getLavaLandingHeight, isOnLavaPlatform, LAVA_STAGE_THREE_SEGMENTS, LAVA_STAGE_TWO_SEGMENTS } from '../config/lavaStageSegments';

test('기존 저장/손상된 모험 진행은 초기화 없이 Stage 1 기본 해금으로 정규화한다', () => {
  for (const raw of [undefined, null, [], 'bad', { lavaValley: { completedStages: [2, 3], visitedStages: [3] } }]) {
    const progress = normalizeAdventureStageProgress(raw);
    assert.equal(getAdventureStageState(progress, 'lavaValley', 1), 'unlocked');
    assert.equal(getAdventureStageState(progress, 'lavaValley', 2), 'locked');
    assert.equal(getAdventureStageState(progress, 'lavaValley', 3), 'locked');
  }
  assert.equal(Object.keys(ADVENTURE_STAGE_CATALOG).length, 5);
});

test('첫 클리어만 다음 Stage를 해금하고 방문 전 NEW, 재선택과 JSON 복원을 지원한다', () => {
  const first = completeAdventureStage({}, 'lavaValley', 1);
  assert.equal(first.unlockedStage, 2);
  assert.equal(getAdventureStageState(first.progress, 'lavaValley', 2), 'new');
  assert.equal(getAdventureStageState(first.progress, 'skyIsland', 2), 'locked');
  assert.equal(completeAdventureStage(first.progress, 'lavaValley', 1).unlockedStage, null);
  const visited = visitAdventureStage(first.progress, 'lavaValley', 2);
  const restored = normalizeAdventureStageProgress(JSON.parse(JSON.stringify(visited)));
  assert.equal(getAdventureStageState(restored, 'lavaValley', 2), 'unlocked');
  assert.ok(canPlayAdventureStage(restored, 'lavaValley', 1));
  assert.ok(canPlayAdventureStage(restored, 'lavaValley', 2));
  const second = completeAdventureStage(restored, 'lavaValley', 2);
  assert.equal(second.unlockedStage, 3);
  assert.equal(getAdventureStageState(second.progress, 'lavaValley', 3), 'new');
  assert.equal(canPlayAdventureStage(second.progress, 'lavaValley', 3), true);
  assert.equal(completeAdventureStage({}, 'lavaValley', 2).unlockedStage, null);
  assert.equal(canPlayAdventureStage({}, 'deepSeaCanyon', 1), true);
  assert.equal(canPlayAdventureStage({}, 'deepSeaCanyon', 2), false);
});

test('Stage 3 발판 패턴은 초중후반과 최대 4층 경로, 이동·붕괴 동작을 포함한다', () => {
  assert.deepEqual([...new Set(LAVA_STAGE_THREE_SEGMENTS.map(segment => segment.phase))], ['opening', 'middle', 'final']);
  const platforms = LAVA_STAGE_THREE_SEGMENTS.flatMap(segment => [...segment.platforms]);
  assert.ok(platforms.some(platform => platform.route === 'middle'));
  assert.ok(platforms.some(platform => platform.route === 'high'));
  assert.ok(platforms.some(platform => platform.route === 'top' && platform.height === 32));
  assert.ok(platforms.some(platform => platform.behavior === 'moving'));
  assert.ok(platforms.some(platform => platform.behavior === 'crumbling'));
  assert.equal(getLavaLandingHeight([{ id: 9, x: 20, width: 40, height: 24, collapsed: true }], 27, 28, 20, -20), null);
});

test('Stage 1 드롭을 유지하고 Stage 2에서 기존 음식 2종과 2~3회 드롭을 확장한다', () => {
  const first = getAdventureStage('lavaValley', 1), second = getAdventureStage('lavaValley', 2);
  assert.equal(first.playTime, 120); assert.equal(second.playTime, 150);
  assert.ok(first.itemPool.food.every(id => second.itemPool.food.includes(id)));
  assert.ok(second.itemPool.food.length > first.itemPool.food.length);
  for (const id of [...second.itemPool.food, ...second.itemPool.hatchItem]) assert.ok(getItemConfig(id));
  for (const roll of [0, .99]) {
    const oldPlan = createLavaValleyShopDropPlan(() => roll);
    assert.deepEqual(createLavaValleyShopDropPlan(() => roll, first), oldPlan);
    const plan = createLavaValleyShopDropPlan(() => roll, second);
    assert.ok(plan.length >= 2 && plan.length <= 3);
    assert.ok(plan.every(item => item.spawnAtSeconds > 0 && item.spawnAtSeconds < second.playTime));
  }
  const economy = { coins: 200, inventory: [{ itemId: 'special-snack', quantity: 1 }] };
  const reward = { coins: 4, rareFragments: 9, shopItems: [{ itemId: 'special-snack', quantity: 1 }] };
  const applied = applyLavaValleyRewards(economy, reward, 1, second.itemPool);
  assert.equal(applied.state.coins, 204);
  assert.equal(applied.state.inventory.find(item => item.itemId === 'special-snack')?.quantity, 2);
  assert.equal(applied.rewards.rareFragments, 3);
  assert.deepEqual(applyLavaValleyRewards(economy, reward, 1, first.itemPool).rewards.shopItems, []);
  assert.equal(first.futureRewardConfig.relicFragmentEligible, false);
  assert.equal(second.futureRewardConfig.treasureChestEnabled, false);
});

test('상단 발판은 상승 통과/하강 착지/끝에서 이탈 후 지상 복귀를 지원한다', () => {
  const platforms = [{ id: 1, x: 20, width: 45, height: 14 }];
  assert.equal(getLavaLandingHeight(platforms, 27, 12, 16, 30), null);
  assert.equal(getLavaLandingHeight(platforms, 27, 16, 12, -30), 14);
  assert.equal(getLavaLandingHeight(platforms, 27, 10, 8, -30), null);
  assert.equal(isOnLavaPlatform(platforms, 27, 14), true);
  assert.equal(isOnLavaPlatform([{ ...platforms[0], x: -20 }], 27, 14), false);
  assert.equal(getLavaLandingHeight([], 27, 1, -2, -30), 0);
  assert.equal(isOnLavaPlatform([], 27, 0), true);
  assert.deepEqual(LAVA_STAGE_TWO_SEGMENTS.map(segment => segment.kind), ['ground', 'upper', 'branch', 'return']);
});
