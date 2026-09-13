import assert from 'node:assert/strict';
import test from 'node:test';
import { canEnterLavaSecretRoute, createLavaCliffMission, createLavaSecretChestReward, createLavaStageRarePlan, createLavaStageShopPlan, getLavaCoinIntervalScale, getLavaEruptionPhase, getLavaGroundSpawnY, getLavaJumpPhysics, getLavaObstacleSpawnInterval, isLavaBonusRouteActive, LAVA_CLIFF_MISSION, LAVA_CLIFF_RARE_WEIGHTS, LAVA_STAGE_GAMEPLAY, LAVA_VALLEY_DIFFICULTY, LAVA_VOLCANO_CORE } from './lavaStageGameplay';
import { createLavaValleyShopDropPlan, createRareFragmentSpawnPlan, RARE_FRAGMENT_COUNT_WEIGHTS, normalizeLavaValleyRewards } from './minigameConfig';
import { getAdventureStage } from './adventureStageCatalog';
import { getLavaLandingHeight } from './lavaStageSegments';
import { completeAdventureStage, canPlayAdventureStage } from '../utils/adventureStageProgress';

const difficulties = ['normal', 'hard'] as const;

test('Stage별 체공시간은 100% → 90% → 85%로 짧아지고 Stage 3만 4층 높이를 확보한다', () => {
  assert.equal(getAdventureStage('lavaValley', 1).playTime, 120);
  assert.equal(getAdventureStage('lavaValley', 2).playTime, 150);
  assert.equal(LAVA_STAGE_GAMEPLAY[1].dashCooldownMs, 2000);
  assert.equal(LAVA_STAGE_GAMEPLAY[2].dashCooldownMs, 3000);
  for (const difficulty of difficulties) {
    const base = LAVA_VALLEY_DIFFICULTY[difficulty];
    const first = getLavaJumpPhysics(1, difficulty), second = getLavaJumpPhysics(2, difficulty), third = getLavaJumpPhysics(3, difficulty);
    assert.equal(first.jumpVelocity, base.jumpVelocity);
    assert.equal(first.gravity, base.gravity);
    assert.equal(first.apexHoldMs, base.apexHoldMs);
    const peak = (physics: typeof first) => physics.jumpVelocity ** 2 / (2 * physics.gravity);
    const airtime = (physics: typeof first) => 2 * physics.jumpVelocity / physics.gravity + physics.apexHoldMs / 1000;
    assert.ok(Math.abs(peak(first) - peak(second)) < 1e-10);
    assert.ok(Math.abs(airtime(second) / airtime(first) - .9) < 1e-10);
    assert.ok(Math.abs(airtime(third) / airtime(first) - .85) < 1e-10);
    assert.ok(Math.abs(peak(third) / peak(first) - 1.75) < 1e-10);
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

test('Stage 3 장애물은 초중후반으로 갈수록 촘촘하고 Stage 1/2보다 자주 등장한다', () => {
  for (const difficulty of difficulties) {
    const first = getLavaObstacleSpawnInterval(1, difficulty, 150);
    const second = getLavaObstacleSpawnInterval(2, difficulty, 150);
    const opening = getLavaObstacleSpawnInterval(3, difficulty, 30);
    const middle = getLavaObstacleSpawnInterval(3, difficulty, 90);
    const final = getLavaObstacleSpawnInterval(3, difficulty, 150);
    assert.ok(second.min < first.min && opening.min < second.min);
    assert.ok(middle.min < opening.min && final.min < middle.min);
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

test('Stage 2 upper route는 ramp 없이 점프로 진입 가능한 단일 발판을 사용한다', () => {
  assert.equal(LAVA_CLIFF_MISSION.platformWidth, 90);
  assert.deepEqual([
    LAVA_CLIFF_MISSION.fossilVisualSizePx, LAVA_CLIFF_MISSION.secretDoorWidthPx,
    LAVA_CLIFF_MISSION.secretDoorHeightPx, LAVA_CLIFF_MISSION.hudFossilIconSizePx,
  ], [60, 150, 176, 24]);
  assert.equal(LAVA_CLIFF_MISSION.secretDoorExclusionRadius, 26);
});

test('Stage 2/3 비밀상자는 유물조각 없이 고정 보너스를 만든다', () => {
  const reward = createLavaSecretChestReward(['basic-meat', 'special-snack'], () => 0);
  assert.deepEqual(reward, { coins: 0, rareFragments: 0, shopItems: [{ itemId: 'basic-meat', quantity: 1 }] });
  assert.equal('relicFragments' in reward, false);
});

test('용암 분출은 1.2초 경고를 완료한 뒤 활성화되고 1.1초 후 피해가 끝난다', () => {
  for (const age of [0, .6, 1.199]) assert.equal(getLavaEruptionPhase(age), 'warning');
  assert.equal(getLavaEruptionPhase(1.2), 'active');
  assert.equal(getLavaEruptionPhase(2.299), 'active');
  assert.equal(getLavaEruptionPhase(2.301), 'ending');
  assert.equal(getLavaEruptionPhase(2.751), 'done');
});

test('ground lava는 공통 track surface와 실측 발 보정값을 하나의 좌표로 사용한다', () => {
  assert.equal(getLavaGroundSpawnY(0), 'calc(20% + 0px)');
  assert.equal(getLavaGroundSpawnY(12.5), 'calc(20% + 12.5px)');
});

test('일반 희귀조각 기대량은 Stage 1의 1.2~1.3배이며 판당 3개 상한을 유지한다', () => {
  for (const difficulty of difficulties) {
    const expectation = (weights: readonly number[]) => weights.reduce((sum, weight, count) => sum + weight * count, 0);
    const ratio = expectation(LAVA_CLIFF_RARE_WEIGHTS[difficulty]) / expectation(RARE_FRAGMENT_COUNT_WEIGHTS[difficulty]);
    assert.ok(ratio < .2);
    for (const roll of [0, .2, .5, .8, .999999]) {
      assert.ok(createLavaStageRarePlan(1, difficulty, () => roll).length <= 1);
      const plan = createLavaStageRarePlan(2, difficulty, () => roll);
      assert.ok(plan.length <= 1);
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

test('문양 여부와 독립적인 Stage 2 완주는 플레이 가능한 Stage 3를 해금한다', () => {
  const first = completeAdventureStage({}, 'lavaValley', 1);
  const second = completeAdventureStage(first.progress, 'lavaValley', 2);
  assert.equal(second.unlockedStage, 3);
  assert.equal(canPlayAdventureStage(second.progress, 'lavaValley', 3), true);
  assert.equal(completeAdventureStage(second.progress, 'lavaValley', 2).unlockedStage, null);
});

test('Stage 3는 180초, 최대 4층 경로, 이동·붕괴 발판과 최종 상자 위치를 갖는다', () => {
  assert.equal(getAdventureStage('lavaValley', 3).playTime, 180);
  assert.equal(LAVA_STAGE_GAMEPLAY[3].symbolMission, true);
  assert.equal(LAVA_STAGE_GAMEPLAY[3].secretRoute, true);
  assert.equal(LAVA_STAGE_GAMEPLAY[3].eruptions, true);
  assert.equal(LAVA_VOLCANO_CORE.crumbleDelayMs, 850);
  assert.equal(LAVA_VOLCANO_CORE.finalTreasureAt, 174);
  assert.deepEqual(LAVA_VOLCANO_CORE.symbols.map(symbol => symbol.route), ['lower', 'middle', 'top']);
  assert.equal(LAVA_STAGE_GAMEPLAY[3].maxVerticalLevel, 4);
  assert.ok(LAVA_VOLCANO_CORE.symbols.every(symbol => symbol.at < LAVA_VOLCANO_CORE.gateAt));
  for (const difficulty of difficulties) {
    const physics = getLavaJumpPhysics(3, difficulty);
    assert.ok(physics.jumpVelocity ** 2 / (2 * physics.gravity) > LAVA_VOLCANO_CORE.topRouteHeight);
  }
});
