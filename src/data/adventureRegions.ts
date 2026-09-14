import { adventureMapAssets } from '../assets/adventure';
import { MINIGAME_ENTRY_COST, type MinigameId } from '../config/minigameConfig';
import { ADVENTURE_REGION_STATUS } from '../config/adventureRegionStatus';

export type AdventureRegionId = 'lavaValley' | 'skyIsland' | 'ancientRuins' | 'deepSeaCanyon' | 'iceContinent';
export type AdventureRegionStatus = 'open' | 'comingSoon' | 'locked';

export interface AdventureRegion {
  id: AdventureRegionId;
  name: string;
  description: string;
  status: AdventureRegionStatus;
  position: { left: number; top: number };
  poster: string;
  gameId?: MinigameId;
  entryCost?: number;
  unavailableLabel?: string;
}

export const ADVENTURE_REGIONS: Record<AdventureRegionId, AdventureRegion> = {
  lavaValley: {
    id: 'lavaValley', name: '용암계곡', description: '뜨거운 용암을 피해 달리며 보물을 모아요!', status: ADVENTURE_REGION_STATUS.lavaValley,
    position: { left: 25, top: 29 }, poster: adventureMapAssets.regionPanels.lavaValley,
    gameId: 'lava-stepping-stones', entryCost: MINIGAME_ENTRY_COST['lava-stepping-stones'],
  },
  skyIsland: {
    id: 'skyIsland', name: '하늘섬', description: '구름 사이를 날며 하늘의 보물을 찾아요!', status: ADVENTURE_REGION_STATUS.skyIsland,
    position: { left: 76, top: 30 }, poster: adventureMapAssets.regionPanels.skyIsland,
    gameId: 'sky-number-clouds', entryCost: MINIGAME_ENTRY_COST['sky-number-clouds'],
  },
  ancientRuins: {
    id: 'ancientRuins', name: '오래된 유적지', description: '거울을 돌려 빛을 제단까지 연결해요!', status: ADVENTURE_REGION_STATUS.ancientRuins,
    position: { left: 51, top: 51 }, poster: adventureMapAssets.regionPanels.ancientRuins,
    gameId: 'number-ruins', entryCost: MINIGAME_ENTRY_COST['number-ruins'],
  },
  deepSeaCanyon: {
    id: 'deepSeaCanyon', name: '심해협곡', description: '깊은 바닷속 미스터리를 탐험해요!', status: ADVENTURE_REGION_STATUS.deepSeaCanyon,
    position: { left: 25, top: 72 }, poster: adventureMapAssets.regionPanels.deepSeaCanyon, unavailableLabel: '잠김',
  },
  iceContinent: {
    id: 'iceContinent', name: '얼음대륙', description: '차가운 얼음세계를 누비며 비밀을 찾아요!', status: ADVENTURE_REGION_STATUS.iceContinent,
    position: { left: 76, top: 73 }, poster: adventureMapAssets.regionPanels.iceContinent, unavailableLabel: '잠김',
  },
};

export const adventureRegions = Object.values(ADVENTURE_REGIONS);
