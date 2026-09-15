import lavaComplete from './completed/lava/volcano_king_sword.png';
import skyComplete from './completed/sky/sky_wing_compass.png';
import ruinsComplete from './completed/ruins/ancient_sun_tablet.png';
import deepSeaComplete from './completed/deep-sea/abyss_pearl_chalice.png';
import iceComplete from './completed/ice/frost_crystal_crown.png';
import lavaSilhouette from './silhouettes/lava/volcano_king_sword.png';
import skySilhouette from './silhouettes/sky/sky_wing_compass.png';
import ruinsSilhouette from './silhouettes/ruins/ancient_sun_tablet.png';
import deepSeaSilhouette from './silhouettes/deep-sea/abyss_pearl_chalice.png';
import iceSilhouette from './silhouettes/ice/frost_crystal_crown.png';
import magmaCrystal from './parts/lava/magma_crystal.png';
import lavaHilt from './parts/lava/lava_hilt.png';
import tyrannoMedal from './parts/lava/tyranno_medal.png';
import volcanoBlade from './parts/lava/volcano_blade.png';
import flameCore from './parts/lava/flame_core.png';
import skyCrystal from './parts/sky/sky_crystal.png';
import cloudCompassDisc from './parts/sky/cloud_compass_disc.png';
import pterosaurMedal from './parts/sky/pterosaur_medal.png';
import skyWings from './parts/sky/sky_wings.png';
import windCore from './parts/sky/wind_core.png';
import emeraldStone from './parts/ruins/emerald_stone.png';
import ancientTablet from './parts/ruins/ancient_tablet.png';
import dinosaurSkullEmblem from './parts/ruins/dinosaur_skull_emblem.png';
import sunGear from './parts/ruins/sun_gear.png';
import runeCore from './parts/ruins/rune_core.png';
import abyssPearl from './parts/deep-sea/abyss_pearl.png';
import coralChaliceBase from './parts/deep-sea/coral_chalice_base.png';
import seaDragonMedal from './parts/deep-sea/sea_dragon_medal.png';
import goldenShellCup from './parts/deep-sea/golden_shell_cup.png';
import vortexCore from './parts/deep-sea/vortex_core.png';
import eternalIceCrystal from './parts/ice/eternal_ice_crystal.png';
import glacierCrownFrame from './parts/ice/glacier_crown_frame.png';
import mammothMedal from './parts/ice/mammoth_medal.png';
import snowflakeCrownOrnament from './parts/ice/snowflake_crown_ornament.png';
import frostCore from './parts/ice/frost_core.png';
import lavaCardBackground from './ui/cards/01_volcano_region_card_bg.png';
import skyCardBackground from './ui/cards/02_sky_region_card_bg.png';
import ruinsCardBackground from './ui/cards/03_ruins_region_card_bg.png';
import deepSeaCardBackground from './ui/cards/04_deepsea_region_card_bg.png';
import iceCardBackground from './ui/cards/05_ice_region_card_bg.png';
import commonCardFrame from './ui/frames/06_relic_card_common_frame.png';
import selectedCardFrame from './ui/frames/07_relic_card_selected_frame.png';
import completeBadge from './ui/badges/08_relic_complete_badge.png';
import incompleteBadge from './ui/badges/09_relic_incomplete_badge.png';
import lavaAltar from './ui/altars/01_relic_altar_volcano.png';
import skyAltar from './ui/altars/02_relic_altar_sky.png';
import ruinsAltar from './ui/altars/03_relic_altar_ruins.png';
import deepSeaAltar from './ui/altars/04_relic_altar_deepsea.png';
import iceAltar from './ui/altars/05_relic_altar_ice.png';
import fiveSlotFrame from './ui/slots/06_relic_slot_frame_5set.png';
import singleSlotFrame from './ui/slots/07_relic_slot_single_frame.png';
import restoreAura from './ui/effects/08_relic_restore_orb_aura.png';
import completeGlow from './ui/effects/09_relic_restore_complete_glow.png';

export const regionalRelicImages = {
  lavaValley: { complete: lavaComplete, silhouette: lavaSilhouette, parts: { magma_crystal: magmaCrystal, lava_hilt: lavaHilt, tyranno_medal: tyrannoMedal, volcano_blade: volcanoBlade, flame_core: flameCore } },
  skyIsland: { complete: skyComplete, silhouette: skySilhouette, parts: { sky_crystal: skyCrystal, cloud_compass_disc: cloudCompassDisc, pterosaur_medal: pterosaurMedal, sky_wings: skyWings, wind_core: windCore } },
  ancientRuins: { complete: ruinsComplete, silhouette: ruinsSilhouette, parts: { emerald_stone: emeraldStone, ancient_tablet: ancientTablet, dinosaur_skull_emblem: dinosaurSkullEmblem, sun_gear: sunGear, rune_core: runeCore } },
  deepSeaCanyon: { complete: deepSeaComplete, silhouette: deepSeaSilhouette, parts: { abyss_pearl: abyssPearl, coral_chalice_base: coralChaliceBase, sea_dragon_medal: seaDragonMedal, golden_shell_cup: goldenShellCup, vortex_core: vortexCore } },
  iceContinent: { complete: iceComplete, silhouette: iceSilhouette, parts: { eternal_ice_crystal: eternalIceCrystal, glacier_crown_frame: glacierCrownFrame, mammoth_medal: mammothMedal, snowflake_crown_ornament: snowflakeCrownOrnament, frost_core: frostCore } },
} as const;

export const regionalRelicUiAssets = {
  cards: {
    lavaValley: lavaCardBackground,
    skyIsland: skyCardBackground,
    ancientRuins: ruinsCardBackground,
    deepSeaCanyon: deepSeaCardBackground,
    iceContinent: iceCardBackground,
  },
  altars: {
    lavaValley: lavaAltar,
    skyIsland: skyAltar,
    ancientRuins: ruinsAltar,
    deepSeaCanyon: deepSeaAltar,
    iceContinent: iceAltar,
  },
  frames: { common: commonCardFrame, selected: selectedCardFrame },
  badges: { complete: completeBadge, incomplete: incompleteBadge },
  slots: { five: fiveSlotFrame, single: singleSlotFrame },
  effects: { restoring: restoreAura, complete: completeGlow },
} as const;
