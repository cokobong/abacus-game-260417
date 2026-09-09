import { getAdventureStage, type AdventureStageNumber } from './adventureStageCatalog';
import { createLavaValleyShopDropPlan, createRareFragmentSpawnPlan, scheduleRareFragmentSpawns, type RareFragmentDifficulty } from './minigameConfig';

// Stage 1 values are the original runner values; Stage 2 scales time, not height.
export const LAVA_VALLEY_DIFFICULTY = {
  easy: { playerVisualScale: 1.28, obstacleVisualScale: 1.2, runSpeed: 26.5, obstacleSpawnIntervalMin: 3100, obstacleSpawnIntervalMax: 4400, jumpVelocity: 101, gravity: 195, apexHoldMs: 120, playerHitboxScale: .68, obstacleHitboxScale: .72, coyoteTimeMs: 180, jumpBufferMs: 250, jumpGuideEnabled: true, geyserChance: .18 },
  normal: { playerVisualScale: 1.25, obstacleVisualScale: 1.18, runSpeed: 32, obstacleSpawnIntervalMin: 2400, obstacleSpawnIntervalMax: 3600, jumpVelocity: 98, gravity: 215, apexHoldMs: 100, playerHitboxScale: .76, obstacleHitboxScale: .78, coyoteTimeMs: 110, jumpBufferMs: 120, jumpGuideEnabled: false, geyserChance: .35 },
  challenge: { playerVisualScale: 1.25, obstacleVisualScale: 1.18, runSpeed: 36, obstacleSpawnIntervalMin: 2100, obstacleSpawnIntervalMax: 3100, jumpVelocity: 96, gravity: 228, apexHoldMs: 80, playerHitboxScale: .84, obstacleHitboxScale: .88, coyoteTimeMs: 70, jumpBufferMs: 70, jumpGuideEnabled: false, geyserChance: .5 },
} as const;

export const LAVA_STAGE_GAMEPLAY = {
  1: { jumpAirTimeMultiplier: 1, dashCooldownMs: 2000, rewardMultiplier: 1, symbolMission: false, secretRoute: false, eruptions: false },
  2: { jumpAirTimeMultiplier: .82, dashCooldownMs: 3000, rewardMultiplier: 1.25, symbolMission: true, secretRoute: true, eruptions: true },
} as const;

export const LAVA_CLIFF_MISSION = {
  symbolCount: 3,
  symbols: [{ at: 18, height: 10 }, { at: 46, height: 14 }, { at: 78, height: 18 }],
  platformWidth: 90,
  rampWidth: 24,
  rampVisualWidthPx: 190,
  rampVisualHeightPx: 50,
  fossilVisualSizePx: 60,
  secretDoorWidthPx: 110,
  secretDoorHeightPx: 130,
  hudFossilIconSizePx: 24,
  gateAt: 110,
  routeHeight: 14,
  routeSeconds: 12,
  bonusCoinInterval: 1.5,
  bonusItemTimes: [3, 7],
  mainCoinIntervalScale: 1.1,
  // Every route shares the same 3-fragment cap, and the same planned drops.
  eruptionTimes: [12, 31, 60, 91, 103, 134],
  eruptionWarningSeconds: 1.2,
  eruptionActiveSeconds: 1.1,
  eruptionEndSeconds: .45,
  maxItems: 28,
} as const;

export function getLavaStageGameplay(stage: AdventureStageNumber) {
  return LAVA_STAGE_GAMEPLAY[stage === 2 ? 2 : 1];
}

export function getLavaJumpPhysics(stage: AdventureStageNumber, difficulty: RareFragmentDifficulty) {
  const base = LAVA_VALLEY_DIFFICULTY[difficulty];
  const scale = getLavaStageGameplay(stage).jumpAirTimeMultiplier;
  // v/t and g/t² preserve v²/(2g), including the highest 18%-height platform.
  return { jumpVelocity: base.jumpVelocity / scale, gravity: base.gravity / (scale * scale), apexHoldMs: base.apexHoldMs * scale };
}

export const LAVA_CLIFF_RARE_WEIGHTS = {
  easy: [.18, .54, .24, .04], normal: [.10, .49, .32, .09], challenge: [.07, .38, .38, .17],
} as const;

export function createLavaStageRarePlan(stage: AdventureStageNumber, difficulty: RareFragmentDifficulty, random: () => number = Math.random) {
  const duration = getAdventureStage('lavaValley', stage).playTime;
  if (stage !== 2) return createRareFragmentSpawnPlan(difficulty, duration, random);
  const roll = random(); let sum = 0;
  const count = LAVA_CLIFF_RARE_WEIGHTS[difficulty].findIndex(weight => { sum += weight; return roll < sum; });
  return scheduleRareFragmentSpawns(count < 0 ? 3 : count, duration, random);
}

export type LavaEruptionPhase = 'warning' | 'active' | 'ending' | 'done';
export function getLavaEruptionPhase(age: number): LavaEruptionPhase {
  if (age < LAVA_CLIFF_MISSION.eruptionWarningSeconds) return 'warning';
  if (age < LAVA_CLIFF_MISSION.eruptionWarningSeconds + LAVA_CLIFF_MISSION.eruptionActiveSeconds) return 'active';
  if (age < LAVA_CLIFF_MISSION.eruptionWarningSeconds + LAVA_CLIFF_MISSION.eruptionActiveSeconds + LAVA_CLIFF_MISSION.eruptionEndSeconds) return 'ending';
  return 'done';
}

export function canEnterLavaSecretRoute(symbols: number, distanceFromDoor: number) {
  return symbols >= LAVA_CLIFF_MISSION.symbolCount && distanceFromDoor <= 12;
}

export function createLavaCliffMission() {
  return { symbols: 0, spawned: 0, gateSpawned: false, gatePassed: false, chestOpened: false, bonusStart: -1, bonusEnd: -1, bonusNextCoin: 0, eruptions: 0 };
}

export function isLavaBonusRouteActive(mission: ReturnType<typeof createLavaCliffMission>, elapsed: number) {
  return mission.bonusStart >= 0 && elapsed >= mission.bonusStart && elapsed < mission.bonusEnd;
}

export function createLavaStageShopPlan(stage: AdventureStageNumber, random: () => number = Math.random) {
  const config = getAdventureStage('lavaValley', stage);
  const plan = createLavaValleyShopDropPlan(random, config);
  if (stage !== 2) return plan;
  // Relocate the last two planned items into the gate window; never add another reward roll.
  return plan.map((drop, index) => {
    const bonusIndex = index - (plan.length - 2);
    if (bonusIndex < 0) return drop;
    const category: 'food' | 'hatchItem' = bonusIndex === 0 ? 'food' : 'hatchItem';
    const pool = config.itemPool[category];
    return { ...drop, category, itemId: pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))], spawnAtSeconds: LAVA_CLIFF_MISSION.gateAt + 3 + LAVA_CLIFF_MISSION.bonusItemTimes[bonusIndex] };
  });
}

export function getLavaCoinIntervalScale(stage: AdventureStageNumber) {
  const duration = getAdventureStage('lavaValley', stage).playTime;
  const baseDuration = getAdventureStage('lavaValley', 1).playTime;
  // Longer playtime supplies the 1.25 budget. Reserve a little main-route density for the bonus.
  return duration / baseDuration / getLavaStageGameplay(stage).rewardMultiplier * (stage === 2 ? LAVA_CLIFF_MISSION.mainCoinIntervalScale : 1);
}
