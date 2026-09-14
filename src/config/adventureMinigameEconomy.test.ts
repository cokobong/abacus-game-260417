import assert from 'node:assert/strict';
import test from 'node:test';
import { getAdventureRunCost, getDifficultyStorageKey, isAdventureDifficultyUnlocked, LAVA_VALLEY_ECONOMY, SKY_FOSSIL_OPPORTUNITY_CHANCE, SKY_ISLAND_ECONOMY, settleAdventureRunCoins } from './adventureMinigameEconomy';

test('하늘섬도 공통 Stage 경제와 2단계 난이도 해금을 사용한다', () => {
  assert.deepEqual(SKY_ISLAND_ECONOMY.stageEntryCost, { 1: 150, 2: 150, 3: 150 });
  assert.deepEqual(SKY_ISLAND_ECONOMY.retryCost, { 1: 0, 2: 50, 3: 150 });
  assert.deepEqual(SKY_ISLAND_ECONOMY.runCoinSettlementCap, { 1: 30, 2: 35, 3: 40 });
  assert.equal(getAdventureRunCost('skyIsland', 1, true), 0);
  assert.equal(getAdventureRunCost('skyIsland', 2, true), 50);
  assert.equal(isAdventureDifficultyUnlocked('skyIsland', 3, 'hard', 0), false);
  assert.equal(isAdventureDifficultyUnlocked('skyIsland', 3, 'hard', 1), true);
  assert.equal(getDifficultyStorageKey('skyIsland', 2), 'skyStage2Difficulty');
});

test('용암계곡 입장/실패 재도전 비용과 Stage별 지갑 정산 상한을 분리한다', () => {
  assert.deepEqual(LAVA_VALLEY_ECONOMY.stageEntryCost, { 1: 150, 2: 150, 3: 150 });
  assert.deepEqual(LAVA_VALLEY_ECONOMY.retryCost, { 1: 0, 2: 50, 3: 150 });
  assert.deepEqual(LAVA_VALLEY_ECONOMY.runCoinSettlementCap, { 1: 30, 2: 35, 3: 40 });
  for (const stage of [1, 2, 3] as const) {
    assert.equal(getAdventureRunCost('lavaValley', stage), 150);
    assert.equal(getAdventureRunCost('lavaValley', stage, true), LAVA_VALLEY_ECONOMY.retryCost[stage]);
    assert.equal(settleAdventureRunCoins('lavaValley', stage, 100), LAVA_VALLEY_ECONOMY.runCoinSettlementCap[stage]);
  }
});

test('Stage 3 어려움은 유물 부품 1개부터 열리고 난이도 저장 키는 Stage별이다', () => {
  assert.equal(isAdventureDifficultyUnlocked('lavaValley', 3, 'hard', 0), false);
  assert.equal(isAdventureDifficultyUnlocked('lavaValley', 3, 'hard', 1), true);
  assert.equal(isAdventureDifficultyUnlocked('lavaValley', 2, 'hard', 0), true);
  assert.deepEqual([1, 2, 3].map(stage => getDifficultyStorageKey('lavaValley', stage as 1 | 2 | 3)), ['lavaStage1Difficulty', 'lavaStage2Difficulty', 'lavaStage3Difficulty']);
});

test('희귀조각은 판당 최대 한 번만 계획되고 화석 세 번째 조각은 위험 선택에 배치된다', () => {
  for (const stage of [1, 2, 3] as const) for (const difficulty of ['normal', 'hard'] as const) {
    assert.ok(LAVA_VALLEY_ECONOMY.rareFragmentDropRate[stage][difficulty] <= .2);
  }
  const stage3Fossils = LAVA_VALLEY_ECONOMY.fossilFragmentRules.stages[3];
  assert.deepEqual(stage3Fossils.map(rule => rule.risk), ['low', 'medium', 'high']);
  assert.equal(stage3Fossils[2].route, 'top');
  assert.ok(stage3Fossils[2].at > stage3Fossils[1].at);
  assert.equal(LAVA_VALLEY_ECONOMY.secretChestWalletCoinReward, 0);
  assert.ok(SKY_FOSSIL_OPPORTUNITY_CHANCE[1].normal < SKY_FOSSIL_OPPORTUNITY_CHANCE[2].normal);
  assert.ok(SKY_FOSSIL_OPPORTUNITY_CHANCE[2].normal < SKY_FOSSIL_OPPORTUNITY_CHANCE[3].normal);
});
