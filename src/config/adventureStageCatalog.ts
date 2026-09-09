import type { AdventureRegionId } from '../data/adventureRegions';
import { LAVA_VALLEY_DURATION_SECONDS, SKY_ISLAND_DURATION_SECONDS } from './minigameConfig';
import { LAVA_VALLEY_SHOP_DROP_POOLS, type LavaValleyShopDropCategory } from './shopCatalog';

export type AdventureStageNumber = 1 | 2 | 3;
export type StageItemPool = Record<LavaValleyShopDropCategory, readonly string[]>;
export interface AdventureStage {
  id: string;
  stageNumber: AdventureStageNumber;
  name: string;
  description: string;
  implemented: boolean;
  playTime: number;
  itemPool: StageItemPool;
  shopDropCount: readonly [number, number];
  futureRewardConfig: { treasureChestEnabled: boolean; relicFragmentEligible: boolean };
}

const emptyPool: StageItemPool = { food: [], hatchItem: [] };
export const LAVA_STAGE_TWO_POOL: StageItemPool = {
  food: [...LAVA_VALLEY_SHOP_DROP_POOLS.food, 'energy-leaf', 'special-snack'],
  hatchItem: [...LAVA_VALLEY_SHOP_DROP_POOLS.hatchItem],
};

function regionStages(regionId: AdventureRegionId, names: readonly string[], descriptions: readonly string[]): AdventureStage[] {
  return ([1, 2, 3] as const).map((stageNumber, index) => ({
    id: `${regionId}-${stageNumber}`, stageNumber, name: names[index], description: descriptions[index],
    implemented: regionId === 'lavaValley' ? stageNumber <= 2 : regionId === 'skyIsland' && stageNumber === 1,
    playTime: regionId === 'lavaValley' && stageNumber === 1 ? LAVA_VALLEY_DURATION_SECONDS
      : regionId === 'skyIsland' && stageNumber === 1 ? SKY_ISLAND_DURATION_SECONDS : [120, 150, 180][index],
    itemPool: regionId === 'lavaValley' ? stageNumber === 1 ? LAVA_VALLEY_SHOP_DROP_POOLS : LAVA_STAGE_TWO_POOL : emptyPool,
    shopDropCount: regionId === 'lavaValley' ? stageNumber === 1 ? [1, 2] : [2, 3] : [0, 0],
    // Stage 3 설계용 예약. 실제 보물상자·유물 처리는 미구현.
    futureRewardConfig: { treasureChestEnabled: stageNumber === 3, relicFragmentEligible: stageNumber === 3 },
  }));
}

export const ADVENTURE_STAGE_CATALOG: Record<AdventureRegionId, AdventureStage[]> = {
  lavaValley: regionStages('lavaValley', ['화산 기슭', '용암 절벽', '화산 심장부'], ['기본 달리기와 점프', '위아래 길에서 화석조각 3개를 찾아 비밀 샛길을 열어요', '보물상자 · 유물조각 (준비 중)']),
  skyIsland: regionStages('skyIsland', ['구름 입구', '바람의 길', '하늘 중심부'], ['기본 레인 이동과 부스트', '새로운 비행 길 (준비 중)', '보물상자 · 유물조각 (준비 중)']),
  ancientRuins: regionStages('ancientRuins', ['유적 입구', '숨겨진 통로', '태양의 방'], ['기본 블록 퍼즐 (준비 중)', '문과 스위치 (준비 중)', '보물상자 · 유물조각 (준비 중)']),
  deepSeaCanyon: regionStages('deepSeaCanyon', ['바다 입구', '깊은 물길', '심해 중심부'], ['기본 탐험 (준비 중)', '확장 탐험 (준비 중)', '보물상자 · 유물조각 (준비 중)']),
  iceContinent: regionStages('iceContinent', ['눈 덮인 입구', '얼음 길', '빙하 중심부'], ['기본 탐험 (준비 중)', '확장 탐험 (준비 중)', '보물상자 · 유물조각 (준비 중)']),
};

export function getRegionForGame(gameId: string): AdventureRegionId | undefined {
  return ({ 'lava-stepping-stones': 'lavaValley', 'sky-number-clouds': 'skyIsland', 'number-ruins': 'ancientRuins' } as const)[gameId];
}

export function getAdventureStage(regionId: AdventureRegionId, stageNumber: AdventureStageNumber) {
  return ADVENTURE_STAGE_CATALOG[regionId][stageNumber - 1];
}
