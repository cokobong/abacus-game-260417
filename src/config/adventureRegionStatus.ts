import type { AdventureRegionId, AdventureRegionStatus } from '../data/adventureRegions';

export const ADVENTURE_REGION_STATUS: Record<AdventureRegionId, AdventureRegionStatus> = {
  lavaValley: 'open',
  skyIsland: 'open',
  ancientRuins: 'open',
  deepSeaCanyon: 'open',
  iceContinent: 'open',
};
