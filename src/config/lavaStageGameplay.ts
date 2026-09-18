import { getAdventureStage, type AdventureStageNumber } from './adventureStageCatalog';
import { createLavaValleyShopDropPlan, scheduleRareFragmentSpawns } from './minigameConfig';
import { LAVA_VALLEY_ECONOMY, type AdventureDifficulty } from './adventureMinigameEconomy';

// Stage 1 values are the original runner values; Stage 2 scales time, not height.
export const LAVA_VALLEY_DIFFICULTY = {
  normal: { playerVisualScale: 1.25, obstacleVisualScale: 1.18, runSpeed: 32, obstacleSpawnIntervalMin: 2400, obstacleSpawnIntervalMax: 3600, jumpVelocity: 98, gravity: 215, apexHoldMs: 100, playerHitboxScale: .76, obstacleHitboxScale: .78, coyoteTimeMs: 110, jumpBufferMs: 120, jumpGuideEnabled: false, geyserChance: .35 },
  hard: { playerVisualScale: 1.25, obstacleVisualScale: 1.18, runSpeed: 34, obstacleSpawnIntervalMin: 2050, obstacleSpawnIntervalMax: 2950, jumpVelocity: 98, gravity: 215, apexHoldMs: 100, playerHitboxScale: .82, obstacleHitboxScale: .86, coyoteTimeMs: 110, jumpBufferMs: 120, jumpGuideEnabled: false, geyserChance: .52 },
} as const;

export const LAVA_STAGE_GAMEPLAY = {
  1: { jumpAirTimeMultiplier: 1, jumpHeightMultiplier: 1, dashCooldownMs: 2000, obstacleIntervalScale: 1, maxVerticalLevel: 1, viewportHeightBonusPx: 0, rewardDensity: 1, rewardMultiplier: 1, symbolMission: false, secretRoute: false, eruptions: false },
  2: { jumpAirTimeMultiplier: .9, jumpHeightMultiplier: 1, dashCooldownMs: 3000, obstacleIntervalScale: .9, maxVerticalLevel: 2, viewportHeightBonusPx: 0, rewardDensity: 1.12, rewardMultiplier: 1.25, symbolMission: true, secretRoute: true, eruptions: true },
  3: { jumpAirTimeMultiplier: .85, jumpHeightMultiplier: 1.75, dashCooldownMs: 3000, obstacleIntervalScale: .82, maxVerticalLevel: 4, viewportHeightBonusPx: 20, rewardDensity: 1.3, rewardMultiplier: 1.25, symbolMission: true, secretRoute: true, eruptions: true },
} as const;

export const LAVA_VOLCANO_CORE = {
  movingPlatformSpeed: .85,
  movingPlatformRange: 4,
  crumbleDelayMs: 850,
  eruptionTimes: [18, 39, 61, 85, 110, 136, 159],
  finalTreasureAt: 174,
  middleRouteHeight: 15,
  highRouteHeight: 24,
  topRouteHeight: 32,
  highRouteRewardMultiplier: 1.35,
  symbols: LAVA_VALLEY_ECONOMY.fossilFragmentRules.stages[3],
  gateAt: 151,
} as const;

export const LAVA_GROUND_TRACK_SURFACE_PERCENT = 20;

export function getLavaGroundSpawnY(footOffsetPx: number) {
  return `calc(${LAVA_GROUND_TRACK_SURFACE_PERCENT}% + ${footOffsetPx}px)`;
}

export const LAVA_CLIFF_MISSION = {
  symbolCount: 3,
  symbols: LAVA_VALLEY_ECONOMY.fossilFragmentRules.stages[2],
  platformWidth: 90,
  fossilVisualSizePx: 60,
  secretDoorWidthPx: 150,
  secretDoorHeightPx: 176,
  secretDoorExclusionRadius: 26,
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

export const LAVA_SECRET_CHEST_REWARD = { coins: LAVA_VALLEY_ECONOMY.secretChestWalletCoinReward, rareFragments: 0, itemQuantity: 1 } as const;

export function createLavaSecretChestReward(itemPool: readonly string[], random: () => number = Math.random) {
  const itemId = itemPool[Math.min(itemPool.length - 1, Math.floor(random() * itemPool.length))];
  return {
    coins: LAVA_SECRET_CHEST_REWARD.coins,
    rareFragments: LAVA_SECRET_CHEST_REWARD.rareFragments,
    shopItems: itemId ? [{ itemId, quantity: LAVA_SECRET_CHEST_REWARD.itemQuantity }] : [],
  };
}

export function getLavaStageGameplay(stage: AdventureStageNumber) {
  return LAVA_STAGE_GAMEPLAY[stage];
}

export function getLavaJumpPhysics(stage: AdventureStageNumber, difficulty: AdventureDifficulty) {
  const base = LAVA_VALLEY_DIFFICULTY[difficulty];
  const config = getLavaStageGameplay(stage);
  const airtime = config.jumpAirTimeMultiplier, height = config.jumpHeightMultiplier;
  // v'=v*height/airtime and g'=g*height/airtime² independently preserve the requested peak and airtime.
  return { jumpVelocity: base.jumpVelocity * height / airtime, gravity: base.gravity * height / (airtime * airtime), apexHoldMs: base.apexHoldMs * airtime };
}

export function getLavaObstacleSpawnInterval(stage: AdventureStageNumber, difficulty: AdventureDifficulty, elapsedSeconds = 0) {
  const base = LAVA_VALLEY_DIFFICULTY[difficulty];
  const stageScale = getLavaStageGameplay(stage).obstacleIntervalScale;
  const phaseScale = stage !== 3 ? 1 : elapsedSeconds < 60 ? 1 : elapsedSeconds < 125 ? .83 : .73;
  return { min: base.obstacleSpawnIntervalMin * stageScale * phaseScale, max: base.obstacleSpawnIntervalMax * stageScale * phaseScale };
}

export function createLavaStageRarePlan(stage: AdventureStageNumber, difficulty: AdventureDifficulty, random: () => number = Math.random) {
  const duration = getAdventureStage('lavaValley', stage).playTime;
  return scheduleRareFragmentSpawns(random() < LAVA_VALLEY_ECONOMY.rareFragmentDropRate[stage][difficulty] ? 1 : 0, duration, random);
}

// Kept as an exported view for existing tuning diagnostics.
export const LAVA_CLIFF_RARE_WEIGHTS = {
  normal: [1 - LAVA_VALLEY_ECONOMY.rareFragmentDropRate[2].normal, LAVA_VALLEY_ECONOMY.rareFragmentDropRate[2].normal, 0, 0],
  hard: [1 - LAVA_VALLEY_ECONOMY.rareFragmentDropRate[2].hard, LAVA_VALLEY_ECONOMY.rareFragmentDropRate[2].hard, 0, 0],
} as const;

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

export function createLavaCliffMission(accumulatedFossils = 0) {
  return { symbols: Math.max(0, Math.min(LAVA_CLIFF_MISSION.symbolCount, accumulatedFossils)), spawned: 0, gateSpawned: false, gatePassed: false, chestOpened: false, bonusStart: -1, bonusEnd: -1, bonusNextCoin: 0, eruptions: 0 };
}

export function getLavaFossilOpportunityChance(stage: AdventureStageNumber, ownedCount: number) {
  if (stage === 1 || ownedCount >= LAVA_CLIFF_MISSION.symbolCount) return 0;
  if (ownedCount === 2) return stage === 3 ? .72 : .12;
  return stage === 3 ? .58 : .38;
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
