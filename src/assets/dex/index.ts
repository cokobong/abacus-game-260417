import collectionBgCrystalCave from './collection/collection_bg_crystal_cave.png';
import collectionBgGreenForest from './collection/collection_bg_green_forest.png';
import collectionBgSecretLand from './collection/collection_bg_secret_land.png';
import collectionBgVolcanoIsland from './collection/collection_bg_volcano_island.png';
import eggCommon from './eggs/egg_common.png';
import eggRare from './eggs/egg_rare.png';
import habitatCave from './habitats/habitat_cave.png';
import habitatForest from './habitats/habitat_forest.png';
import habitatSecret from './habitats/habitat_secret.png';
import habitatVolcano from './habitats/habitat_volcano.png';
import dexBookIcon from './header/dex_book_icon.png';
import dexMascotGreen from './mascots/dex_mascot_green.png';
import habitatCaveBadge from './habitats/habitat_cave_badge.png';
import habitatForestBadge from './habitats/habitat_forest_badge.png';
import habitatSecretBadge from './habitats/habitat_secret_badge.png';
import habitatVolcanoBadge from './habitats/abitat_volcano_badge.png';
import ornamentCaveTitle from './ornaments/ornament_cave_title.png';
import ornamentForestTitle from './ornaments/ornament_forest_title.png';
import ornamentSecretTitle from './ornaments/habitat_secret_badge.png';
import ornamentVolcanoTitle from './ornaments/ornament_volcano_title.png';
import progressEggIcon from './rewards/progress_egg_icon.png';
import rewardGiftIcon from './rewards/reward_gift_icon.png';
import silhouetteHerbivore from './silhouettes/silhouette_herbivore.png';
import silhouetteLongneck from './silhouettes/silhouette_longneck.png';
import silhouetteTrex from './silhouettes/silhouette_trex.png';

export const habitatBackgroundAssets = {
  'green-forest': collectionBgGreenForest,
  'sparkle-cave': collectionBgCrystalCave,
  'volcano-island': collectionBgVolcanoIsland,
  'secret-land': collectionBgSecretLand,
} as const;

const longneckSpeciesIds = new Set(['long-brachio', 'diplodocus', 'parasaurolophus']);
const theropodSpeciesIds = new Set(['tiny-tyranno', 'allosaurus', 'dilophosaurus', 'carnotaurus', 'spinosaurus', 'swift-raptor', 'distortus-rex', 'indominus-rex']);

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

export const dexBookAssets = {
  headerIcon: dexBookIcon,
  mascot: dexMascotGreen,
  progressEgg: progressEggIcon,
  rewardGift: rewardGiftIcon,
} as const;

export const dexHabitatBadgeImages = {
  'green-forest': habitatForestBadge,
  'sparkle-cave': habitatCaveBadge,
  'volcano-island': habitatVolcanoBadge,
  'secret-land': habitatSecretBadge,
} as const;

export const dexTitleOrnamentImages = {
  'green-forest': ornamentForestTitle,
  'sparkle-cave': ornamentCaveTitle,
  'volcano-island': ornamentVolcanoTitle,
  'secret-land': ornamentSecretTitle,
} as const;
