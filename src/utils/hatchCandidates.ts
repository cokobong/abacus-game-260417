import { getEggItemConfig, type EggCategory, type EggItemConfig } from '../config/itemConfig';
import { dexHabitats, dinosaurSpecies, type DinosaurHabitatId, type DinosaurSpecies } from '../data/dinosaurSpecies';
import type { OwnedDinosaur, OwnedEgg } from '../types/game';

export type HatchCandidateResult = {
  candidates: DinosaurSpecies[];
  matchingSpecies: DinosaurSpecies[];
};

export type EggPurchaseAvailability = {
  eggCategory: EggCategory;
  eggHabitatId?: DinosaurHabitatId;
  remainingCandidateCount: number;
  ownedEggCountByCategory: number;
  hasEggInCategory: boolean;
  availablePurchaseCount: number;
  canBuyMore: boolean;
};

export function getHatchCandidates(egg: OwnedEgg | null, ownedDinosaurs: OwnedDinosaur[], speciesPool: DinosaurSpecies[] = dinosaurSpecies): HatchCandidateResult {
  if (!egg) return { candidates: [], matchingSpecies: [] };

  const eggCategory = getEggCategoryForOwnedEgg(egg);
  const eggHabitatId = getEggHabitatForOwnedEgg(egg);
  const implementedSpecies = getImplementedSpecies(speciesPool);
  const linkedSpeciesId = getEggItemConfig(egg.eggItemId)?.linkedSpeciesId;
  const matchingSpecies = sortSpeciesByCollectionOrder(implementedSpecies.filter((species) => linkedSpeciesId ? species.speciesId === linkedSpeciesId : isSpeciesMatchForEgg(species, eggCategory, eggHabitatId)));
  const ownedSpeciesIds = new Set(ownedDinosaurs.map((dinosaur) => dinosaur.speciesId));

  return {
    matchingSpecies,
    candidates: matchingSpecies.filter((species) => !ownedSpeciesIds.has(species.speciesId)),
  };
}

export function selectHatchCandidate(egg: OwnedEgg | null, candidates: DinosaurSpecies[], random: () => number = Math.random) {
  if (!egg || candidates.length === 0) return null;
  if (getEggCategoryForOwnedEgg(egg) === 'rare') return candidates[0] ?? null;

  const randomIndex = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[randomIndex] ?? null;
}

export function getRemainingSpeciesCountForEggCategory(eggCategory: EggCategory, ownedDinosaurs: OwnedDinosaur[], speciesPool: DinosaurSpecies[] = dinosaurSpecies) {
  return getRemainingSpeciesCountForEggScope(eggCategory, undefined, ownedDinosaurs, speciesPool);
}

function getRemainingSpeciesCountForEggScope(eggCategory: EggCategory, eggHabitatId: DinosaurHabitatId | undefined, ownedDinosaurs: OwnedDinosaur[], speciesPool: DinosaurSpecies[] = dinosaurSpecies) {
  const ownedSpeciesIds = new Set(ownedDinosaurs.map((dinosaur) => dinosaur.speciesId));
  return sortSpeciesByCollectionOrder(getImplementedSpecies(speciesPool)).filter((species) => isSpeciesMatchForEgg(species, eggCategory, eggHabitatId) && !ownedSpeciesIds.has(species.speciesId)).length;
}

export function getOwnedEggCountByCategory(eggCategory: EggCategory, ownedEggs: OwnedEgg[]) {
  return ownedEggs.filter((egg) => getEggCategoryForOwnedEgg(egg) === eggCategory).length;
}

export function canBuyEggByCategory(eggCategory: EggCategory, ownedDinosaurs: OwnedDinosaur[], ownedEggs: OwnedEgg[], speciesPool: DinosaurSpecies[] = dinosaurSpecies): EggPurchaseAvailability {
  return canBuyEggByScope(eggCategory, undefined, ownedDinosaurs, ownedEggs, speciesPool);
}

function canBuyEggByScope(eggCategory: EggCategory, eggHabitatId: DinosaurHabitatId | undefined, ownedDinosaurs: OwnedDinosaur[], ownedEggs: OwnedEgg[], speciesPool: DinosaurSpecies[] = dinosaurSpecies): EggPurchaseAvailability {
  const remainingCandidateCount = getRemainingSpeciesCountForEggScope(eggCategory, eggHabitatId, ownedDinosaurs, speciesPool);
  const ownedEggCountByCategory = getOwnedEggCountByCategory(eggCategory, ownedEggs);
  const hasEggInCategory = ownedEggCountByCategory > 0;
  const availablePurchaseCount = hasEggInCategory ? 0 : Math.min(1, remainingCandidateCount);

  return {
    eggCategory,
    eggHabitatId,
    remainingCandidateCount,
    ownedEggCountByCategory,
    hasEggInCategory,
    availablePurchaseCount,
    canBuyMore: availablePurchaseCount > 0,
  };
}

export function canBuyEggItem(item: EggItemConfig, ownedDinosaurs: OwnedDinosaur[], ownedEggs: OwnedEgg[], speciesPool: DinosaurSpecies[] = dinosaurSpecies) {
  if (!item.linkedSpeciesId) return canBuyEggByScope(item.eggCategory, isDinosaurHabitatId(item.eggHabitatId) ? item.eggHabitatId : undefined, ownedDinosaurs, ownedEggs, speciesPool);
  const linkedSpecies = getImplementedSpecies(speciesPool).find((species) => species.speciesId === item.linkedSpeciesId);
  const alreadyOwned = ownedDinosaurs.some((dinosaur) => dinosaur.speciesId === item.linkedSpeciesId);
  const ownedEggCountByCategory = getOwnedEggCountByCategory(item.eggCategory, ownedEggs);
  const hasEggInCategory = ownedEggCountByCategory > 0;
  const remainingCandidateCount = linkedSpecies && !alreadyOwned ? 1 : 0;
  const ownedThisEggCount = ownedEggs.filter((egg) => egg.eggItemId === item.id).length;
  const purchaseLimitReached = ownedThisEggCount >= (item.purchaseLimit ?? 1);
  const availablePurchaseCount = hasEggInCategory || purchaseLimitReached ? 0 : remainingCandidateCount;
  return { eggCategory: item.eggCategory, eggHabitatId: item.eggHabitatId, remainingCandidateCount, ownedEggCountByCategory, hasEggInCategory, availablePurchaseCount, canBuyMore: availablePurchaseCount > 0 };
}

export function getEggCategoryForOwnedEgg(egg: OwnedEgg): EggCategory {
  const eggConfig = getEggItemConfig(egg.eggItemId);
  return egg.eggCategory ?? eggConfig?.eggCategory ?? getLegacyEggCategory(egg);
}

function getEggHabitatForOwnedEgg(egg: OwnedEgg): DinosaurHabitatId | undefined {
  if (isDinosaurHabitatId(egg.eggHabitatId)) return egg.eggHabitatId;
  const configuredHabitat = getEggItemConfig(egg.eggItemId)?.eggHabitatId;
  return isDinosaurHabitatId(configuredHabitat) ? configuredHabitat : undefined;
}

function isDinosaurHabitatId(value: unknown): value is DinosaurHabitatId {
  return typeof value === 'string' && dexHabitats.includes(value as DinosaurHabitatId);
}

function getImplementedSpecies(speciesPool: DinosaurSpecies[]) {
  return speciesPool.filter((species) => !species.isPlaceholder && species.status !== 'planned' && species.status !== 'locked' && species.unlockSource !== 'planned');
}

function sortSpeciesByCollectionOrder(species: DinosaurSpecies[]) {
  return [...species].sort((a, b) => a.collectionOrder - b.collectionOrder);
}

function getLegacyEggCategory(egg: OwnedEgg): EggCategory {
  if (egg.eggType === 'legendary') return 'legendary';
  if (egg.eggType === 'rare-spark' || egg.eggType === 'special') return 'special';
  if (egg.eggType === 'rare') return 'rare';
  return 'normal';
}

function isSpeciesMatchForEgg(species: DinosaurSpecies, eggCategory: EggCategory, eggHabitatId?: DinosaurHabitatId) {
  if (eggHabitatId && species.habitat !== eggHabitatId) return false;
  if (eggCategory === 'legendary') return species.rarity === 'legendary';
  if (species.eggCategory === eggCategory) return true;
  if (eggCategory === 'normal') return species.unlockSource === 'normal-egg';
  if (eggCategory === 'special') return species.unlockSource === 'special-egg';
  return species.unlockSource === 'rare-egg' || species.unlockSource === 'adventure-fragment';
}
