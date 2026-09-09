import assert from 'node:assert/strict';
import test from 'node:test';
import { canEnterLavaSecretRoute, createLavaCliffMission, createLavaStageRarePlan, createLavaStageShopPlan, getLavaCoinIntervalScale, getLavaEruptionPhase, getLavaJumpPhysics, isLavaBonusRouteActive, LAVA_CLIFF_MISSION, LAVA_CLIFF_RARE_WEIGHTS, LAVA_STAGE_GAMEPLAY, LAVA_VALLEY_DIFFICULTY } from './lavaStageGameplay';
import { createLavaValleyShopDropPlan, createRareFragmentSpawnPlan, RARE_FRAGMENT_COUNT_WEIGHTS, normalizeLavaValleyRewards } from './minigameConfig';
import { getAdventureStage } from './adventureStageCatalog';
import { getLavaLandingHeight, isInLavaReservedZone } from './lavaStageSegments';
import { completeAdventureStage, canPlayAdventureStage } from '../utils/adventureStageProgress';

const difficulties = ['easy', 'normal', 'challenge'] as const;

test('Stage 1 물리와 대시는 그대로, Stage 2는 높이를 보존하고 체공시간 82%, 쿨타임 150%', () => {
  assert.equal(getAdventureStage('lavaValley', 1).playTime, 120);
  assert.equal(getAdventureStage('lavaValley', 2).playTime, 150);
  assert.equal(LAVA_STAGE_GAMEPLAY[1].dashCooldownMs, 2000);
  assert.equal(LAVA_STAGE_GAMEPLAY[2].dashCooldownMs, 3000);
  for (const difficulty of difficulties) {
    const base = LAVA_VALLEY_DIFFICULTY[difficulty];
    const first = getLavaJumpPhysics(1, difficulty), second = getLavaJumpPhysics(2, difficulty);
    assert.equal(first.jumpVelocity, base.jumpVelocity);
    assert.equal(first.gravity, base.gravity);
    assert.equal(first.apexHoldMs, base.apexHoldMs);
    const peak = (physics: typeof first) => physics.jumpVelocity ** 2 / (2 * physics.gravity);
    const airtime = (physics: typeof first) => 2 * physics.jumpVelocity / physics.gravity + physics.apexHoldMs / 1000;
    assert.ok(Math.abs(peak(first) - peak(second)) < 1e-10);
    assert.ok(Math.abs(airtime(second) / airtime(first) - .82) < 1e-10);
    assert.ok(peak(second) > Math.max(...LAVA_CLIFF_MISSION.symbols.map(symbol => symbol.height)));
    // Fixed-step integration at both 60 and 30 fps must still reach the highest platform.
    for (const dt of [1 / 60, 1 / 30]) {
      let y = 0, velocity = second.jumpVelocity, peakY = 0;
      while (velocity > 0) { velocity -= second.gravity * dt; y += velocity * dt; peakY = Math.max(peakY, y); }
      assert.ok(peakY > 18, `${difficulty} at ${1 / dt} fps`);
      assert.equal(getLavaLandingHeight([{ id: 1, x: 0, width: 100, height: 18 }], 27, peakY, 17, -10), 18);
    }
  }
});

test('화석조각 3개는 이번 판에만 존재하며 넉넉한 지상 접촉으로 비밀문을 연다', () => {
  const mission = createLavaCliffMission();
  assert.equal(mission.symbols, 0);
  assert.equal(LAVA_CLIFF_MISSION.symbols.length, 3);
  assert.ok(LAVA_CLIFF_MISSION.symbols.every(symbol => symbol.at < LAVA_CLIFF_MISSION.gateAt - 10));
  for (const count of [0, 1, 2]) assert.equal(canEnterLavaSecretRoute(count, 20), false);
  assert.equal(canEnterLavaSecretRoute(3, 0), true);
  assert.equal(canEnterLavaSecretRoute(3, 12), true);
  assert.equal(canEnterLavaSecretRoute(3, 12.01), false);
  mission.symbols = 3; mission.bonusStart = 113; mission.bonusEnd = 125;
  assert.equal(isLavaBonusRouteActive(mission, 112), false);
  assert.equal(isLavaBonusRouteActive(mission, 113), true);
  assert.equal(isLavaBonusRouteActive(mission, 124.99), true);
  assert.equal(isLavaBonusRouteActive(mission, 125), false);
  assert.equal(createLavaCliffMission().symbols, 0);
  assert.equal(createLavaCliffMission().chestOpened, false);
  assert.equal(isLavaBonusRouteActive(createLavaCliffMission(), 0), false);
  assert.equal(LAVA_CLIFF_MISSION.routeSeconds, 12);
});

test('transition ramp는 padding을 포함한 예약 구간이며 PNG 표시 크기는 고정 slot이다', () => {
  const ramp = [{ id: 1, x: 90, width: LAVA_CLIFF_MISSION.rampWidth, height: 14, route: 'transition' as const }];
  assert.equal(isInLavaReservedZone(ramp, 82), true);
  assert.equal(isInLavaReservedZone(ramp, 122), true);
  assert.equal(isInLavaReservedZone(ramp, 81.99), false);
  assert.equal(isInLavaReservedZone(ramp, 122.01), false);
  assert.deepEqual([
    LAVA_CLIFF_MISSION.rampVisualWidthPx, LAVA_CLIFF_MISSION.rampVisualHeightPx,
    LAVA_CLIFF_MISSION.fossilVisualSizePx, LAVA_CLIFF_MISSION.secretDoorWidthPx,
    LAVA_CLIFF_MISSION.secretDoorHeightPx, LAVA_CLIFF_MISSION.hudFossilIconSizePx,
  ], [190, 50, 60, 110, 130, 24]);
});

test('용암 분출은 1.2초 경고를 완료한 뒤 활성화되고 1.1초 후 피해가 끝난다', () => {
  for (const age of [0, .6, 1.199]) assert.equal(getLavaEruptionPhase(age), 'warning');
  assert.equal(getLavaEruptionPhase(1.2), 'active');
  assert.equal(getLavaEruptionPhase(2.299), 'active');
  assert.equal(getLavaEruptionPhase(2.301), 'ending');
  assert.equal(getLavaEruptionPhase(2.751), 'done');
});

test('희귀조각 기대량은 Stage 1의 1.2~1.3배이며 보너스에서도 총 3개 상한을 유지한다', () => {
  for (const difficulty of difficulties) {
    const expectation = (weights: readonly number[]) => weights.reduce((sum, weight, count) => sum + weight * count, 0);
    const ratio = expectation(LAVA_CLIFF_RARE_WEIGHTS[difficulty]) / expectation(RARE_FRAGMENT_COUNT_WEIGHTS[difficulty]);
    assert.ok(ratio >= 1.2 && ratio <= 1.3);
    for (const roll of [0, .2, .5, .8, .999999]) {
      assert.deepEqual(createLavaStageRarePlan(1, difficulty, () => roll), createRareFragmentSpawnPlan(difficulty, 120, () => roll));
      const plan = createLavaStageRarePlan(2, difficulty, () => roll);
      assert.ok(plan.length <= 3);
      assert.ok(plan.every(drop => drop.spawnAtSeconds > 0 && drop.spawnAtSeconds < 145));
    }
  }
  assert.equal(normalizeLavaValleyRewards({ coins: 0, rareFragments: 99, shopItems: [] }).rareFragments, 3);
  assert.equal(getLavaCoinIntervalScale(1), 1);
  assert.equal(getLavaCoinIntervalScale(2), 1.1);
});

test('보너스 음식/부화 아이템은 기존 2~3개 계획에서 재배치하고 유물은 지급하지 않는다', () => {
  const config = getAdventureStage('lavaValley', 2);
  for (const roll of [0, .4, .9, .999]) {
    assert.deepEqual(createLavaStageShopPlan(1, () => roll), createLavaValleyShopDropPlan(() => roll, getAdventureStage('lavaValley', 1)));
    const plan = createLavaStageShopPlan(2, () => roll);
    assert.ok(plan.length >= 2 && plan.length <= 3);
    assert.deepEqual(plan.slice(-2).map(drop => drop.category), ['food', 'hatchItem']);
    assert.ok(plan.every(drop => [...config.itemPool.food, ...config.itemPool.hatchItem].includes(drop.itemId)));
    assert.ok(plan.slice(-2).every(drop => drop.spawnAtSeconds > 110 && drop.spawnAtSeconds < 123));
  }
  assert.equal(config.futureRewardConfig.relicFragmentEligible, false);
  assert.equal(config.futureRewardConfig.treasureChestEnabled, false);
});

test('문양 여부와 독립적인 Stage 2 완주는 Stage 3 상태만 해금하고 게임 진입은 막는다', () => {
  const first = completeAdventureStage({}, 'lavaValley', 1);
  const second = completeAdventureStage(first.progress, 'lavaValley', 2);
  assert.equal(second.unlockedStage, 3);
  assert.equal(canPlayAdventureStage(second.progress, 'lavaValley', 3), false);
  assert.equal(completeAdventureStage(second.progress, 'lavaValley', 2).unlockedStage, null);
});
