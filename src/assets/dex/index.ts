import brachioCard from './dinosaurs/brachio_card.png';
import stegoCard from './dinosaurs/stego_card.png';
import trexCard from './dinosaurs/trex_card.png';
import triceraCard from './dinosaurs/tricera_card.png';
import eggCommon from './eggs/egg_common.png';
import eggRare from './eggs/egg_rare.png';
import habitatCave from './habitats/habitat_cave.png';
import habitatForest from './habitats/habitat_forest.png';
import habitatSecret from './habitats/habitat_secret.png';
import habitatVolcano from './habitats/habitat_volcano.png';
import silhouetteHerbivore from './silhouettes/silhouette_herbivore.png';
import silhouetteLongneck from './silhouettes/silhouette_longneck.png';
import silhouetteTrex from './silhouettes/silhouette_trex.png';

export const dexDinosaurImages: Partial<Record<string, string>> = {
  'tiny-tyranno': trexCard,
  'baby-tricera': triceraCard,
  'plate-stego': stegoCard,
  'long-brachio': brachioCard,
};

const longneckSpeciesIds = new Set(['long-brachio', 'diplodocus', 'parasaurolophus', 'plesiosaurus']);
const theropodSpeciesIds = new Set(['tiny-tyranno', 'allosaurus', 'dilophosaurus', 'carnotaurus', 'spinosaurus', 'swift-raptor', 'mosasaurus']);

export function getDexSilhouetteImage(speciesId: string) {
  if (longneckSpeciesIds.has(speciesId)) return silhouetteLongneck;
  if (theropodSpeciesIds.has(speciesId)) return silhouetteTrex;
  return silhouetteHerbivore;
}

export const dexEggImages = {
  common: eggCommon,
  rare: eggRare,
} as const;

export const dexHabitatImages = {
  'green-forest': habitatForest,
  'sparkle-cave': habitatCave,
  'volcano-island': habitatVolcano,
  'secret-land': habitatSecret,
} as const;
