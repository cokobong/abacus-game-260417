import type { DinosaurHabitatId } from '../data/dinosaurSpecies';
import type { AdventureRegionId } from '../data/adventureRegions';

export const LEGENDARY_EGG_REQUIRED_RELIC_FRAGMENTS = 2;
export const LEGENDARY_EGG_RARE_FRAGMENT_COST = 20;
// Enable only after region relic persistence and the region purchase flow exist.
export const LEGENDARY_PURCHASE_ENABLED = false;
export const LEGENDARY_REGION_BY_HABITAT: Record<DinosaurHabitatId, AdventureRegionId> = {
  'volcano-island': 'lavaValley', 'sky-island': 'skyIsland', 'ancient-ruins': 'ancientRuins',
  'deep-sea': 'deepSeaCanyon', 'ice-continent': 'iceContinent',
};
// New egg identities prevent already-purchased legacy eggs from granting new species.
export const REPLACEMENT_LEGENDARY_EGGS = [
  { id: 'magmarex-legend-egg', speciesId: 'magmarex', habitat: 'volcano-island', name: '화산지대 전설알', speciesName: '마그마렉스' },
  { id: 'luminadon-legend-egg', speciesId: 'luminadon', habitat: 'sky-island', name: '고공정원 전설알', speciesName: '루미나돈' },
] as const;
