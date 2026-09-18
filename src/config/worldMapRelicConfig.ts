import type { DinosaurHabitatId } from '../data/dinosaurSpecies';
import type { AdventureRegionId } from '../data/adventureRegions';
import { getMissingRelicParts, hasAllRelicParts, REGION_RELIC_PART_GOAL, REGION_RELICS } from './regionalRelicConfig';
import { rollDeepSeaRelicPart } from './deepSea/arcadeRelicRoll';

export const WORLD_GATE_REQUIRED_RELICS = 5;
export type RegionRelicProgress = {
  ownedPartIds: string[];
  completed: boolean;
  consecutiveMisses: number;
  stage3FirstCleared: boolean;
  chestOpenedCount: number;
  fossilFragmentIds?: number[];
};

export type RelicChestOutcome = {
  acquired: boolean;
  partId?: string;
  partName?: string;
  partImage?: string;
  ownedPartCount: number;
  goal: number;
  newlyCompleted: boolean;
};

export const LAVA_FINAL_CHEST_CONFIG = {
  relicDropRate: .375,
  relicPityBoostRate: .7,
  relicPityBoostAfterMisses: 2,
  relicPityThreshold: 3,
  coinReward: 0,
  rareFragmentReward: 0,
  itemReward: 1,
} as const;

export const REGION_DEX_HABITAT: Record<AdventureRegionId, DinosaurHabitatId> = {
  lavaValley: 'volcano-island',
  skyIsland: 'sky-island',
  ancientRuins: 'ancient-ruins',
  deepSeaCanyon: 'deep-sea',
  iceContinent: 'ice-continent',
};

// 유물 저장 구조가 연결되기 전까지 사용하는 안전한 표시 기본값이다.
export const DEFAULT_REGION_RELIC_PROGRESS: Record<AdventureRegionId, RegionRelicProgress> = {
  lavaValley: { ownedPartIds: [], completed: false, consecutiveMisses: 0, stage3FirstCleared: false, chestOpenedCount: 0 },
  skyIsland: { ownedPartIds: [], completed: false, consecutiveMisses: 0, stage3FirstCleared: false, chestOpenedCount: 0 },
  ancientRuins: { ownedPartIds: [], completed: false, consecutiveMisses: 0, stage3FirstCleared: false, chestOpenedCount: 0 },
  deepSeaCanyon: { ownedPartIds: [], completed: false, consecutiveMisses: 0, stage3FirstCleared: false, chestOpenedCount: 0 },
  iceContinent: { ownedPartIds: [], completed: false, consecutiveMisses: 0, stage3FirstCleared: false, chestOpenedCount: 0 },
};

type SavedRegionRelicProgress = Partial<RegionRelicProgress> & { fragments?: number };

export function normalizeRegionRelicProgress(progress?: Partial<Record<AdventureRegionId, SavedRegionRelicProgress>>) {
  return Object.fromEntries(Object.entries(DEFAULT_REGION_RELIC_PROGRESS).map(([regionId, fallback]) => {
    const saved = progress?.[regionId as AdventureRegionId];
    const definition = REGION_RELICS[regionId as AdventureRegionId];
    const allowedIds = new Set(definition.parts.map((part) => part.id));
    const migratedCount = Math.max(0, Math.min(REGION_RELIC_PART_GOAL, Math.floor(Number(saved?.fragments) || 0)));
    const sourceIds = Array.isArray(saved?.ownedPartIds)
      ? saved.ownedPartIds
      : definition.parts.slice(0, saved?.completed === true ? REGION_RELIC_PART_GOAL : migratedCount).map((part) => part.id);
    const ownedPartIds = [...new Set(sourceIds.filter((id): id is string => typeof id === 'string' && allowedIds.has(id)))];
    return [regionId, {
      ownedPartIds,
      completed: saved?.completed === true,
      consecutiveMisses: Math.max(0, Math.floor(Number(saved?.consecutiveMisses) || 0)),
      stage3FirstCleared: saved?.stage3FirstCleared === true,
      chestOpenedCount: Math.max(0, Math.floor(Number(saved?.chestOpenedCount) || 0)),
      ...((regionId === 'lavaValley' || regionId === 'skyIsland') ? { fossilFragmentIds: Array.isArray(saved?.fossilFragmentIds) ? [...new Set(saved.fossilFragmentIds.filter(id => id === 1 || id === 2 || id === 3))] : [] } : {}),
    }];
  })) as Record<AdventureRegionId, RegionRelicProgress>;
}

export function resolveLavaFinalChest(progress: RegionRelicProgress, random: () => number = Math.random) {
  return resolveRegionFinalChest('lavaValley', progress, random);
}

export function resolveRegionFinalChest(regionId: AdventureRegionId, progress: RegionRelicProgress, random: () => number = Math.random) {
  const missingParts = getMissingRelicParts(regionId, progress.ownedPartIds);
  const eligible = missingParts.length > 0;
  const deepSeaRoll = regionId === 'deepSeaCanyon'
    ? rollDeepSeaRelicPart(missingParts.map(part => part.id), progress.consecutiveMisses, random)
    : null;
  const dropRate = progress.consecutiveMisses >= LAVA_FINAL_CHEST_CONFIG.relicPityThreshold
    ? 1
    : progress.consecutiveMisses >= LAVA_FINAL_CHEST_CONFIG.relicPityBoostAfterMisses
      ? LAVA_FINAL_CHEST_CONFIG.relicPityBoostRate
      : LAVA_FINAL_CHEST_CONFIG.relicDropRate;
  const acquired = deepSeaRoll ? Boolean(deepSeaRoll.partId) : eligible && random() < dropRate;
  const acquiredPart = deepSeaRoll ? missingParts.find(part => part.id === deepSeaRoll.partId)
    : acquired ? missingParts[Math.min(missingParts.length - 1, Math.floor(random() * missingParts.length))] : undefined;
  const ownedPartIds = acquiredPart ? [...progress.ownedPartIds, acquiredPart.id] : progress.ownedPartIds;
  const completed = progress.completed;
  const nextProgress: RegionRelicProgress = {
    ownedPartIds,
    completed,
    consecutiveMisses: deepSeaRoll ? deepSeaRoll.consecutiveMisses : eligible ? acquired ? 0 : progress.consecutiveMisses + 1 : progress.consecutiveMisses,
    stage3FirstCleared: true,
    chestOpenedCount: progress.chestOpenedCount + 1,
    fossilFragmentIds: progress.fossilFragmentIds,
  };
  const outcome: RelicChestOutcome = { acquired, partId: acquiredPart?.id, partName: acquiredPart?.name, partImage: acquiredPart?.image, ownedPartCount: ownedPartIds.length, goal: REGION_RELIC_PART_GOAL, newlyCompleted: false };
  return { progress: nextProgress, outcome };
}

export function canRestoreRegionRelic(regionId: AdventureRegionId, progress: RegionRelicProgress) {
  return !progress.completed && hasAllRelicParts(regionId, progress.ownedPartIds);
}
