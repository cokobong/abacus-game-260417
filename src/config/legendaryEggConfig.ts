import type { AdventureRegionId } from '../data/adventureRegions';
import type { DinosaurHabitatId } from '../data/dinosaurSpecies';

export const LEGENDARY_EGG_REQUIRED_DEX_DISCOVERIES = 5;
export const LEGENDARY_EGG_REQUIRED_RELIC_PARTS = 2;
export const LEGENDARY_EGG_RARE_FRAGMENT_COST = 20;
export const LEGENDARY_PURCHASE_ENABLED = true;

export type LegendaryRegionRule = {
  regionId: AdventureRegionId;
  habitatId: DinosaurHabitatId;
  legendarySpeciesId: string;
};

export const LEGENDARY_REGION_RULES: readonly LegendaryRegionRule[] = [
  { regionId: 'lavaValley', habitatId: 'volcano-island', legendarySpeciesId: 'magmarex' },
  { regionId: 'skyIsland', habitatId: 'sky-island', legendarySpeciesId: 'luminadon' },
  { regionId: 'ancientRuins', habitatId: 'ancient-ruins', legendarySpeciesId: 'ancient-guardian' },
  { regionId: 'deepSeaCanyon', habitatId: 'deep-sea', legendarySpeciesId: 'abyssrano' },
  { regionId: 'iceContinent', habitatId: 'ice-continent', legendarySpeciesId: 'ice-legend' },
] as const;
