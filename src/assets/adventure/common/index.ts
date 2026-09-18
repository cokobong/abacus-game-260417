import worldMap from './map/adventure_world_map.png';
import entryCoinBanner from './ui/adventure_entry_coin_banner.png';
import startButton from './ui/adventure_start_button.png';
import titleBanner from './ui/adventure_title_banner.png';
import ancientRuinsPanel from './ui/panel_ancient_ruins.png';
import deepSeaCanyonPanel from './ui/panel_deep_sea_canyon.png';
import iceContinentPanel from './ui/panel_ice_continent.png';
import lavaValleyPanel from './ui/panel_lava_valley.png';
import skyIslandPanel from './ui/panel_sky_island.png';

export const adventureMapAssets = {
  worldMap,
  titleBanner,
  startButton,
  entryCoinBanner,
  regionPanels: {
    lavaValley: lavaValleyPanel,
    skyIsland: skyIslandPanel,
    ancientRuins: ancientRuinsPanel,
    deepSeaCanyon: deepSeaCanyonPanel,
    iceContinent: iceContinentPanel,
  },
} as const;
