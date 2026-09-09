import { LEGENDARY_EGG_REQUIRED_RELIC_FRAGMENTS, LEGENDARY_PURCHASE_ENABLED, LEGENDARY_REGION_BY_HABITAT } from '../config/legendaryEggConfig';
import { getAdventureStageState, type AdventureStageProgress } from './adventureStageProgress';
import { getEggRequiredFragments, type EggItemConfig } from '../config/itemConfig';
import { dexHabitats, dinosaurSpecies, type DinosaurHabitatId, type DinosaurSpecies } from '../data/dinosaurSpecies';
import type { OwnedDinosaur, OwnedEgg } from '../types/game';
import { canBuyEggItem } from './hatchCandidates';
import { getOwnedEggCount } from './eggMigration';


export type EggPurchaseStatus = 'available' | 'soldOut' | 'locked' | 'insufficientCoins' | 'insufficientFragments' | 'completed' | 'comingSoon';

export type EggPurchaseState = {
  status: EggPurchaseStatus;
  disabled: boolean;
  label: string;
  ownedQuantity: number;
  coinCost: number;
  fragmentCost: number;
  availablePoolCount: number;
};

export type LegendaryCategoryState = { habitatId: DinosaurHabitatId; stage3Unlocked: boolean; relicFragmentCount: number; requiredRelicFragments: number; status: 'available' | 'locked' | 'completed' | 'unavailable'; legendarySpeciesId?: string };

export function getLegendaryCategoryStates(ownedDinosaurs: OwnedDinosaur[], speciesPool: DinosaurSpecies[] = dinosaurSpecies, stageProgress: AdventureStageProgress = {}, relicFragments: Partial<Record<DinosaurHabitatId, number>> = {}): LegendaryCategoryState[] {
  const ownedIds = new Set(ownedDinosaurs.map((dinosaur) => dinosaur.speciesId));
  return dexHabitats.map((habitatId) => {
    const categorySpecies = speciesPool.filter((species) => species.habitat === habitatId && !species.isPlaceholder && species.status !== 'planned');
    const legendary = categorySpecies.find((species) => species.rarity === 'legendary');
    const stage3Unlocked = getAdventureStageState(stageProgress, LEGENDARY_REGION_BY_HABITAT[habitatId], 3) !== 'locked';
    const rawCount = relicFragments[habitatId];
    const relicFragmentCount = typeof rawCount === 'number' && Number.isFinite(rawCount) ? Math.max(0, Math.floor(rawCount)) : 0;
    const requiredRelicFragments = LEGENDARY_EGG_REQUIRED_RELIC_FRAGMENTS;
    const status = !legendary ? 'unavailable' : ownedIds.has(legendary.speciesId) ? 'completed' : stage3Unlocked && relicFragmentCount >= requiredRelicFragments ? 'available' : 'locked';
    return { habitatId, stage3Unlocked, relicFragmentCount, requiredRelicFragments, status, legendarySpeciesId: legendary?.speciesId };
  });
}

export function getEggPurchaseState(
  item: EggItemConfig,
  coins: number,
  inventory: Array<{ itemId: string; quantity: number }>,
  ownedDinosaurs: OwnedDinosaur[],
  ownedEggs: OwnedEgg[],
  speciesPool: DinosaurSpecies[] = dinosaurSpecies,
): EggPurchaseState {
  const ownedQuantity = getOwnedEggCount(ownedEggs, item.id);
  const availability = canBuyEggItem(item, ownedDinosaurs, ownedEggs, speciesPool);
  const purchaseLimitReached = ownedQuantity >= (item.purchaseLimit ?? Number.POSITIVE_INFINITY);
  const linkedSpeciesOwned = Boolean(item.linkedSpeciesId && ownedDinosaurs.some((dinosaur) => dinosaur.speciesId === item.linkedSpeciesId));
  const requiredFragments = getEggRequiredFragments(item);
  const fragmentCost = requiredFragments.reduce((total, fragment) => total + fragment.amount, 0);
  const base = { ownedQuantity, coinCost: item.price, fragmentCost, availablePoolCount: availability.remainingCandidateCount };

  if (item.eggCategory === 'legendary') {
    if (!LEGENDARY_PURCHASE_ENABLED) return { ...base, status: 'comingSoon', disabled: true, label: '준비중' };
    const categories = getLegendaryCategoryStates(ownedDinosaurs, speciesPool);
    const implemented = categories.filter((category) => category.status !== 'unavailable');
    if (implemented.length === 0) return { ...base, status: 'locked', disabled: true, label: '전설 준비 중' };
    if (implemented.every((category) => category.status === 'completed')) return { ...base, status: 'completed', disabled: true, label: '모든 전설 완료' };
    if (!implemented.some((category) => category.status === 'available')) return { ...base, status: 'locked', disabled: true, label: 'Stage 3 · 유물조각 조건 필요' };
  }

  if (purchaseLimitReached || linkedSpeciesOwned || (!availability.hasEggInCategory && availability.remainingCandidateCount === 0)) {
    return { ...base, status: 'soldOut', disabled: true, label: '품절' };
  }
  if (availability.hasEggInCategory) {
    return { ...base, status: 'locked', disabled: true, label: `${getEggCategoryLabel(item)} 보유 중` };
  }
  if (coins < item.price) return { ...base, status: 'insufficientCoins', disabled: true, label: '코인 부족' };
  const hasEnoughFragments = requiredFragments.every((fragment) => (inventory.find((entry) => entry.itemId === fragment.itemId)?.quantity ?? 0) >= fragment.amount);
  if (requiredFragments.length > 0 && !hasEnoughFragments) return { ...base, status: 'insufficientFragments', disabled: true, label: item.eggCategory === 'rare' ? '희귀조각이 부족해요' : '조각 부족' };
  return { ...base, status: 'available', disabled: false, label: item.eggCategory === 'legendary' ? '전설 선택' : '구매 가능' };
}

function getEggCategoryLabel(item: EggItemConfig) {
  if (item.eggCategory === 'normal') return '일반알';
  if (item.eggCategory === 'special') return '특수알';
  if (item.eggCategory === 'legendary') return '전설알';
  return '희귀알';
}
