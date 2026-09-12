import { LEGENDARY_EGG_REQUIRED_DEX_DISCOVERIES, LEGENDARY_EGG_REQUIRED_RELIC_PARTS, LEGENDARY_PURCHASE_ENABLED, LEGENDARY_REGION_RULES } from '../config/legendaryEggConfig';
import { getEggRequiredFragments, type EggItemConfig } from '../config/itemConfig';
import type { AdventureRegionId } from '../data/adventureRegions';
import { ADVENTURE_REGION_STATUS } from '../config/adventureRegionStatus';
import { dinosaurSpecies, type DinosaurHabitatId, type DinosaurSpecies } from '../data/dinosaurSpecies';
import type { OwnedDinosaur, OwnedEgg } from '../types/game';
import { getOwnedRelicParts } from '../config/regionalRelicConfig';
import { normalizeRegionRelicProgress, type RegionRelicProgress } from '../config/worldMapRelicConfig';
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

export type LegendaryCategoryState = {
  regionId: AdventureRegionId;
  habitatId: DinosaurHabitatId;
  dexFound: number;
  requiredDexDiscoveries: number;
  relicPartCount: number;
  requiredRelicParts: number;
  status: 'available' | 'locked' | 'completed' | 'unavailable';
  legendarySpeciesId: string;
};

export function getLegendaryCategoryStates(
  ownedDinosaurs: OwnedDinosaur[],
  speciesPool: DinosaurSpecies[] = dinosaurSpecies,
  discoveredSpeciesIds: readonly string[] = ownedDinosaurs.map((dinosaur) => dinosaur.speciesId),
  relicProgress?: Partial<Record<AdventureRegionId, Partial<RegionRelicProgress>>>,
): LegendaryCategoryState[] {
  const ownedIds = new Set(ownedDinosaurs.map((dinosaur) => dinosaur.speciesId));
  const discoveredIds = new Set(discoveredSpeciesIds);
  const normalizedRelics = normalizeRegionRelicProgress(relicProgress);
  return LEGENDARY_REGION_RULES.map(({ regionId, habitatId, legendarySpeciesId }) => {
    const categorySpecies = speciesPool.filter((species) => species.habitat === habitatId && !species.isPlaceholder && species.status !== 'planned' && species.status !== 'locked' && species.unlockSource !== 'planned');
    const legendary = categorySpecies.find((species) => species.speciesId === legendarySpeciesId && species.rarity === 'legendary');
    const dexFound = categorySpecies.filter((species) => discoveredIds.has(species.speciesId)).length;
    const requiredDexDiscoveries = LEGENDARY_EGG_REQUIRED_DEX_DISCOVERIES;
    const relicPartCount = getOwnedRelicParts(regionId, normalizedRelics[regionId].ownedPartIds).length;
    const requiredRelicParts = LEGENDARY_EGG_REQUIRED_RELIC_PARTS;
    const status = !legendary
      ? 'unavailable'
      : ownedIds.has(legendarySpeciesId)
        ? 'completed'
        : ADVENTURE_REGION_STATUS[regionId] !== 'open'
          ? 'locked'
          : dexFound >= requiredDexDiscoveries && relicPartCount >= requiredRelicParts
            ? 'available'
            : 'locked';
    return { regionId, habitatId, dexFound, requiredDexDiscoveries, relicPartCount, requiredRelicParts, status, legendarySpeciesId };
  });
}

export function getEggPurchaseState(
  item: EggItemConfig,
  coins: number,
  inventory: Array<{ itemId: string; quantity: number }>,
  ownedDinosaurs: OwnedDinosaur[],
  ownedEggs: OwnedEgg[],
  speciesPool: DinosaurSpecies[] = dinosaurSpecies,
  discoveredSpeciesIds: readonly string[] = ownedDinosaurs.map((dinosaur) => dinosaur.speciesId),
  relicProgress?: Partial<Record<AdventureRegionId, Partial<RegionRelicProgress>>>,
): EggPurchaseState {
  const ownedQuantity = getOwnedEggCount(ownedEggs, item.id);
  const availability = canBuyEggItem(item, ownedDinosaurs, ownedEggs, speciesPool);
  const purchaseLimitReached = ownedQuantity >= (item.purchaseLimit ?? Number.POSITIVE_INFINITY);
  const linkedSpeciesOwned = Boolean(item.linkedSpeciesId && ownedDinosaurs.some((dinosaur) => dinosaur.speciesId === item.linkedSpeciesId));
  const requiredFragments = getEggRequiredFragments(item);
  const fragmentCost = requiredFragments.reduce((total, fragment) => total + fragment.amount, 0);
  let base = { ownedQuantity, coinCost: item.price, fragmentCost, availablePoolCount: availability.remainingCandidateCount };

  if (item.eggCategory === 'legendary') {
    if (!LEGENDARY_PURCHASE_ENABLED) return { ...base, status: 'comingSoon', disabled: true, label: '준비중' };
    const categories = getLegendaryCategoryStates(ownedDinosaurs, speciesPool, discoveredSpeciesIds, relicProgress);
    const implemented = categories.filter((category) => category.status !== 'unavailable');
    const available = implemented.filter((category) => category.status === 'available');
    base = { ...base, availablePoolCount: available.length };
    if (implemented.length === 0) return { ...base, status: 'locked', disabled: true, label: '전설 준비 중' };
    if (implemented.every((category) => category.status === 'completed')) return { ...base, status: 'completed', disabled: true, label: '모든 전설 완료' };
    if (available.length === 0) return { ...base, status: 'locked', disabled: true, label: '지역 도감·유물 조건 필요' };
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
