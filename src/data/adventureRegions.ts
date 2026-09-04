import { adventureMapAssets } from '../assets/adventure';
import { MINIGAME_ENTRY_COST, type MinigameId } from '../config/minigameConfig';

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
    id: 'lavaValley', name: '용암계곡', description: '뜨거운 용암을 피해 달리며 보물을 모아요!', status: 'open',
    position: { left: 28.5, top: 19.5 }, poster: adventureMapAssets.regionPanels.lavaValley,
    gameId: 'lava-stepping-stones', entryCost: MINIGAME_ENTRY_COST['lava-stepping-stones'],
  },
  skyIsland: {
    id: 'skyIsland', name: '하늘섬', description: '구름 사이를 날며 하늘의 보물을 찾아요!', status: 'open',
    position: { left: 73.5, top: 20.5 }, poster: adventureMapAssets.regionPanels.skyIsland,
    gameId: 'sky-number-clouds', entryCost: MINIGAME_ENTRY_COST['sky-number-clouds'],
  },
  ancientRuins: {
    id: 'ancientRuins', name: '오래된 유적지', description: '블록을 밀어 길을 만들고 유물을 찾아요!', status: 'comingSoon',
    position: { left: 54, top: 49.5 }, poster: adventureMapAssets.regionPanels.ancientRuins, unavailableLabel: '준비 중',
  },
  deepSeaCanyon: {
    id: 'deepSeaCanyon', name: '심해협곡', description: '깊은 바닷속 미스터리를 탐험해요!', status: 'locked',
    position: { left: 30.5, top: 73 }, poster: adventureMapAssets.regionPanels.deepSeaCanyon, unavailableLabel: '잠김',
  },
  iceContinent: {
    id: 'iceContinent', name: '얼음대륙', description: '차가운 얼음세계를 누비며 비밀을 찾아요!', status: 'locked',
    position: { left: 72, top: 76 }, poster: adventureMapAssets.regionPanels.iceContinent, unavailableLabel: '잠김',
  },
};

export const adventureRegions = Object.values(ADVENTURE_REGIONS);
