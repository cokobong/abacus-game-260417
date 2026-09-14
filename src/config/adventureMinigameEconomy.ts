import type { AdventureRegionId } from '../data/adventureRegions';
import type { AdventureStageNumber } from './adventureStageCatalog';

export type AdventureDifficulty = 'normal' | 'hard';

export interface AdventureRegionEconomyConfig {
  stageEntryCost: Record<AdventureStageNumber, number>;
  retryCost: Record<AdventureStageNumber, number>;
  runCoinSettlementCap: Record<AdventureStageNumber, number>;
  rareFragmentDropRate: Record<AdventureStageNumber, Record<AdventureDifficulty, number>>;
  fossilFragmentRules: {
    count: number;
    stages: Record<AdventureStageNumber, readonly { at: number; height: number; route: string; risk: 'low' | 'medium' | 'high' }[]>;
  };
  difficultyUnlockRules: { stage3HardRequiresRelicParts: number };
  selectedDifficultyStoragePrefix: string;
  secretChestWalletCoinReward: number;
}

export const ADVENTURE_MINIGAME_ECONOMY: Partial<Record<AdventureRegionId, AdventureRegionEconomyConfig>> = {
  lavaValley: {
    stageEntryCost: { 1: 150, 2: 150, 3: 150 },
    retryCost: { 1: 0, 2: 50, 3: 150 },
    runCoinSettlementCap: { 1: 30, 2: 35, 3: 40 },
    // One scheduled opportunity at most; collection still requires taking its risky lane.
    rareFragmentDropRate: {
      1: { normal: .08, hard: .12 },
      2: { normal: .11, hard: .16 },
      3: { normal: .14, hard: .2 },
    },
    fossilFragmentRules: {
      count: 3,
      stages: {
        1: [],
        2: [
          { at: 18, height: 10, route: 'upper', risk: 'low' },
          { at: 52, height: 16, route: 'upper', risk: 'medium' },
          { at: 96, height: 20, route: 'upper', risk: 'high' },
        ],
        3: [
          { at: 32, height: 4, route: 'lower', risk: 'low' },
          { at: 91, height: 23, route: 'middle', risk: 'medium' },
          { at: 142, height: 36, route: 'top', risk: 'high' },
        ],
      },
    },
    difficultyUnlockRules: { stage3HardRequiresRelicParts: 1 },
    selectedDifficultyStoragePrefix: 'lavaStage',
    secretChestWalletCoinReward: 0,
  },
  skyIsland: {
    stageEntryCost: { 1: 150, 2: 150, 3: 150 },
    retryCost: { 1: 0, 2: 50, 3: 150 },
    runCoinSettlementCap: { 1: 30, 2: 35, 3: 40 },
    rareFragmentDropRate: {
      1: { normal: .06, hard: .09 },
      2: { normal: .09, hard: .13 },
      3: { normal: .12, hard: .18 },
    },
    fossilFragmentRules: {
      count: 3,
      stages: {
        1: [{ at: 58, height: 0, route: 'safe', risk: 'low' }],
        2: [{ at: 72, height: 0, route: 'changing', risk: 'medium' }],
        3: [{ at: 78, height: 0, route: 'danger', risk: 'high' }],
      },
    },
    difficultyUnlockRules: { stage3HardRequiresRelicParts: 1 },
    selectedDifficultyStoragePrefix: 'skyStage',
    secretChestWalletCoinReward: 0,
  },
};

export const LAVA_VALLEY_ECONOMY = ADVENTURE_MINIGAME_ECONOMY.lavaValley!;
export const SKY_ISLAND_ECONOMY = ADVENTURE_MINIGAME_ECONOMY.skyIsland!;
export const SKY_FOSSIL_OPPORTUNITY_CHANCE: Record<AdventureStageNumber, Record<AdventureDifficulty, number>> = {
  1: { normal: .42, hard: .5 },
  2: { normal: .56, hard: .64 },
  3: { normal: .72, hard: .8 },
};

export function getAdventureRunCost(regionId: AdventureRegionId, stage: AdventureStageNumber, retryAfterFailure = false) {
  const config = ADVENTURE_MINIGAME_ECONOMY[regionId];
  return config ? (retryAfterFailure ? config.retryCost[stage] : config.stageEntryCost[stage]) : 0;
}

export function settleAdventureRunCoins(regionId: AdventureRegionId, stage: AdventureStageNumber, runCoins: number) {
  const cap = ADVENTURE_MINIGAME_ECONOMY[regionId]?.runCoinSettlementCap[stage] ?? 0;
  return Math.min(cap, Math.max(0, Math.floor(runCoins)));
}

export function isAdventureDifficultyUnlocked(regionId: AdventureRegionId, stage: AdventureStageNumber, difficulty: AdventureDifficulty, relicPartCount: number) {
  if (difficulty === 'normal' || stage !== 3) return true;
  const required = ADVENTURE_MINIGAME_ECONOMY[regionId]?.difficultyUnlockRules.stage3HardRequiresRelicParts ?? Number.POSITIVE_INFINITY;
  return relicPartCount >= required;
}

export function getDifficultyStorageKey(regionId: AdventureRegionId, stage: AdventureStageNumber) {
  const prefix = ADVENTURE_MINIGAME_ECONOMY[regionId]?.selectedDifficultyStoragePrefix ?? regionId;
  return `${prefix}${stage}Difficulty`;
}
