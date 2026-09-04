import { getEggRequiredFragments, type EggItemConfig } from '../config/itemConfig';
import { dexHabitats, dinosaurSpecies, type DinosaurHabitatId, type DinosaurSpecies } from '../data/dinosaurSpecies';
import type { OwnedDinosaur, OwnedEgg } from '../types/game';
import { canBuyEggItem } from './hatchCandidates';

export const LEGENDARY_REQUIRED_DISCOVERIES = 5;
export const LEGENDARY_FRAGMENT_COST = 10;
export type EggPurchaseStatus = 'available' | 'soldOut' | 'locked' | 'insufficientCoins' | 'insufficientFragments' | 'completed';

export type EggPurchaseState = {
  status: EggPurchaseStatus;
  disabled: boolean;
  label: string;
  ownedQuantity: number;
  coinCost: number;
  fragmentCost: number;
  availablePoolCount: number;
};

export type LegendaryCategoryState = { habitatId: DinosaurHabitatId; discovered: number; required: number; status: 'available' | 'locked' | 'completed' | 'unavailable'; legendarySpeciesId?: string };

export function getLegendaryCategoryStates(ownedDinosaurs: OwnedDinosaur[], speciesPool: DinosaurSpecies[] = dinosaurSpecies): LegendaryCategoryState[] {
  const ownedIds = new Set(ownedDinosaurs.map((dinosaur) => dinosaur.speciesId));
  return dexHabitats.map((habitatId) => {
    const categorySpecies = speciesPool.filter((species) => species.habitat === habitatId && !species.isPlaceholder && species.status !== 'planned');
    const nonLegendary = categorySpecies.filter((species) => species.rarity !== 'legendary');
    const legendary = categorySpecies.find((species) => species.rarity === 'legendary');
    const discovered = nonLegendary.filter((species) => ownedIds.has(species.speciesId)).length;
    const required = Math.min(LEGENDARY_REQUIRED_DISCOVERIES, nonLegendary.length);
    const status = !legendary ? 'unavailable' : ownedIds.has(legendary.speciesId) ? 'completed' : discovered >= required ? 'available' : 'locked';
    return { habitatId, discovered, required, status, legendarySpeciesId: legendary?.speciesId };
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
  const ownedQuantity = ownedEggs.filter((egg) => egg.eggItemId === item.id).length;
  const availability = canBuyEggItem(item, ownedDinosaurs, ownedEggs, speciesPool);
  const purchaseLimitReached = ownedQuantity >= (item.purchaseLimit ?? Number.POSITIVE_INFINITY);
  const linkedSpeciesOwned = Boolean(item.linkedSpeciesId && ownedDinosaurs.some((dinosaur) => dinosaur.speciesId === item.linkedSpeciesId));
  const requiredFragments = getEggRequiredFragments(item);
  const fragmentCost = requiredFragments.reduce((total, fragment) => total + fragment.amount, 0);
  const base = { ownedQuantity, coinCost: item.price, fragmentCost, availablePoolCount: availability.remainingCandidateCount };

  if (item.eggCategory === 'legendary') {
    const categories = getLegendaryCategoryStates(ownedDinosaurs, speciesPool);
    const implemented = categories.filter((category) => category.status !== 'unavailable');
    if (implemented.length === 0) return { ...base, status: 'locked', disabled: true, label: '전설 준비 중' };
    if (implemented.every((category) => category.status === 'completed')) return { ...base, status: 'completed', disabled: true, label: '모든 전설 완료' };
    if (!implemented.some((category) => category.status === 'available')) return { ...base, status: 'locked', disabled: true, label: '도감 조건 필요' };
  }

  if (purchaseLimitReached || linkedSpeciesOwned || (!availability.hasEggInCategory && availability.remainingCandidateCount === 0)) {
    return { ...base, status: 'soldOut', disabled: true, label: '품절' };
  }
  if (availability.hasEggInCategory) {
    return { ...base, status: 'locked', disabled: true, label: `${getEggCategoryLabel(item)} 보유 중` };
  }
  if (coins < item.price) return { ...base, status: 'insufficientCoins', disabled: true, label: '코인 부족' };
  const hasEnoughFragments = requiredFragments.every((fragment) => (inventory.find((entry) => entry.itemId === fragment.itemId)?.quantity ?? 0) >= fragment.amount);
  if (requiredFragments.length > 0 && !hasEnoughFragments) return { ...base, status: 'insufficientFragments', disabled: true, label: '조각 부족' };
  return { ...base, status: 'available', disabled: false, label: item.eggCategory === 'legendary' ? '전설 선택' : '구매 가능' };
}

function getEggCategoryLabel(item: EggItemConfig) {
  if (item.eggCategory === 'normal') return '일반알';
  if (item.eggCategory === 'special') return '특수알';
  if (item.eggCategory === 'legendary') return '전설알';
  return '희귀알';
}
