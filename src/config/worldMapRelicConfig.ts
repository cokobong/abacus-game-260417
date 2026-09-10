import type { DinosaurHabitatId } from '../data/dinosaurSpecies';
import type { AdventureRegionId } from '../data/adventureRegions';

export const WORLD_GATE_REQUIRED_RELICS = 5;
export const REGION_RELIC_FRAGMENT_GOAL = 5;

export type RegionRelicProgress = {
  fragments: number;
  completed: boolean;
};

export const REGION_DEX_HABITAT: Record<AdventureRegionId, DinosaurHabitatId> = {
  lavaValley: 'volcano-island',
  skyIsland: 'sky-island',
  ancientRuins: 'ancient-ruins',
  deepSeaCanyon: 'deep-sea',
  iceContinent: 'ice-continent',
};

// 유물 저장 구조가 연결되기 전까지 사용하는 안전한 표시 기본값이다.
export const DEFAULT_REGION_RELIC_PROGRESS: Record<AdventureRegionId, RegionRelicProgress> = {
  lavaValley: { fragments: 0, completed: false },
  skyIsland: { fragments: 0, completed: false },
  ancientRuins: { fragments: 0, completed: false },
  deepSeaCanyon: { fragments: 0, completed: false },
  iceContinent: { fragments: 0, completed: false },
};

export function normalizeRegionRelicProgress(progress?: Partial<Record<AdventureRegionId, Partial<RegionRelicProgress>>>) {
  return Object.fromEntries(Object.entries(DEFAULT_REGION_RELIC_PROGRESS).map(([regionId, fallback]) => {
    const saved = progress?.[regionId as AdventureRegionId];
    const fragments = Math.max(0, Math.min(REGION_RELIC_FRAGMENT_GOAL, Math.floor(Number(saved?.fragments) || 0)));
    return [regionId, { fragments, completed: saved?.completed === true }];
  })) as Record<AdventureRegionId, RegionRelicProgress>;
}
