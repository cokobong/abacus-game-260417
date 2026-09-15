import type { AdventureRegionId } from '../data/adventureRegions';
import { regionalRelicImages } from '../assets/adventure/relics';

export type RelicPartDefinition = {
  id: string;
  name: string;
  role: string;
  image: string;
};

export type RelicDefinition = {
  regionId: AdventureRegionId;
  relicId: string;
  name: string;
  form: string;
  completeImage: string;
  silhouetteImage: string;
  parts: readonly RelicPartDefinition[];
};

export const REGION_RELICS: Record<AdventureRegionId, RelicDefinition> = {
  lavaValley: {
    regionId: 'lavaValley', relicId: 'volcano_king_sword', name: '화산왕의 검',
    form: '용암석 제단에 꽂히는 티라노 상징의 대형 전설검', completeImage: regionalRelicImages.lavaValley.complete, silhouetteImage: regionalRelicImages.lavaValley.silhouette,
    parts: [
      { id: 'magma_crystal', name: '마그마 크리스탈', role: '검에 용암의 힘을 공급하는 결정', image: regionalRelicImages.lavaValley.parts.magma_crystal },
      { id: 'lava_hilt', name: '용암석 검자루', role: '전설검을 지탱하는 손잡이', image: regionalRelicImages.lavaValley.parts.lava_hilt },
      { id: 'tyranno_medal', name: '티라노 메달', role: '화산왕의 자격을 증명하는 문장', image: regionalRelicImages.lavaValley.parts.tyranno_medal },
      { id: 'volcano_blade', name: '화산왕의 칼날', role: '검의 중심이 되는 거대한 칼날', image: regionalRelicImages.lavaValley.parts.volcano_blade },
      { id: 'flame_core', name: '불꽃의 핵', role: '완성된 검을 깨우는 동력핵', image: regionalRelicImages.lavaValley.parts.flame_core },
    ],
  },
  skyIsland: {
    regionId: 'skyIsland', relicId: 'sky_wing_compass', name: '천공의 날개 나침반',
    form: '마법 나침반을 커다란 황금 날개가 감싸는 천공 장치', completeImage: regionalRelicImages.skyIsland.complete, silhouetteImage: regionalRelicImages.skyIsland.silhouette,
    parts: [
      { id: 'sky_crystal', name: '하늘 수정', role: '천공의 기운을 모으는 결정', image: regionalRelicImages.skyIsland.parts.sky_crystal },
      { id: 'cloud_compass_disc', name: '구름 나침반판', role: '하늘길의 방향을 표시하는 원반', image: regionalRelicImages.skyIsland.parts.cloud_compass_disc },
      { id: 'pterosaur_medal', name: '익룡 메달', role: '천공 수호자의 문장', image: regionalRelicImages.skyIsland.parts.pterosaur_medal },
      { id: 'sky_wings', name: '천공의 날개', role: '나침반을 감싸고 부양시키는 날개', image: regionalRelicImages.skyIsland.parts.sky_wings },
      { id: 'wind_core', name: '바람의 핵', role: '천공 장치를 움직이는 동력핵', image: regionalRelicImages.skyIsland.parts.wind_core },
    ],
  },
  ancientRuins: {
    regionId: 'ancientRuins', relicId: 'ancient_sun_tablet', name: '고대 태양기계 석판',
    form: '태양 기어와 공룡 문장이 결합되는 고대 문명의 기계 석판', completeImage: regionalRelicImages.ancientRuins.complete, silhouetteImage: regionalRelicImages.ancientRuins.silhouette,
    parts: [
      { id: 'emerald_stone', name: '에메랄드 원석', role: '고대 기계에 에너지를 공급하는 원석', image: regionalRelicImages.ancientRuins.parts.emerald_stone },
      { id: 'ancient_tablet', name: '고대 석판', role: '모든 장치를 결합하는 기반', image: regionalRelicImages.ancientRuins.parts.ancient_tablet },
      { id: 'dinosaur_skull_emblem', name: '공룡 두개골 문장', role: '고대 공룡 문명의 권위를 나타내는 문장', image: regionalRelicImages.ancientRuins.parts.dinosaur_skull_emblem },
      { id: 'sun_gear', name: '태양 기어', role: '태양의 움직임을 재현하는 기어', image: regionalRelicImages.ancientRuins.parts.sun_gear },
      { id: 'rune_core', name: '고대 문자핵', role: '석판의 문자를 작동시키는 핵', image: regionalRelicImages.ancientRuins.parts.rune_core },
    ],
  },
  deepSeaCanyon: {
    regionId: 'deepSeaCanyon', relicId: 'abyss_pearl_chalice', name: '심해왕의 진주 성배',
    form: '거대한 심해 진주를 황금 조개 성배와 산호가 감싸는 성물', completeImage: regionalRelicImages.deepSeaCanyon.complete, silhouetteImage: regionalRelicImages.deepSeaCanyon.silhouette,
    parts: [
      { id: 'abyss_pearl', name: '심해 진주', role: '심해의 힘을 품은 중심 보석', image: regionalRelicImages.deepSeaCanyon.parts.abyss_pearl },
      { id: 'coral_chalice_base', name: '산호 성배받침', role: '성배를 지탱하는 산호 받침', image: regionalRelicImages.deepSeaCanyon.parts.coral_chalice_base },
      { id: 'sea_dragon_medal', name: '해룡 메달', role: '심해 왕국 수호자의 문장', image: regionalRelicImages.deepSeaCanyon.parts.sea_dragon_medal },
      { id: 'golden_shell_cup', name: '황금 조개잔', role: '진주를 감싸는 성배 본체', image: regionalRelicImages.deepSeaCanyon.parts.golden_shell_cup },
      { id: 'vortex_core', name: '소용돌이의 핵', role: '성배의 해류를 만드는 동력핵', image: regionalRelicImages.deepSeaCanyon.parts.vortex_core },
    ],
  },
  iceContinent: {
    regionId: 'iceContinent', relicId: 'frost_crystal_crown', name: '빙설왕의 수정 왕관',
    form: '푸른 얼음수정을 중심으로 눈꽃 장식이 결합되는 빙설 성물', completeImage: regionalRelicImages.iceContinent.complete, silhouetteImage: regionalRelicImages.iceContinent.silhouette,
    parts: [
      { id: 'eternal_ice_crystal', name: '영원의 얼음수정', role: '녹지 않는 빙설의 중심 결정', image: regionalRelicImages.iceContinent.parts.eternal_ice_crystal },
      { id: 'glacier_crown_frame', name: '빙하 왕관틀', role: '왕관의 부품을 지탱하는 틀', image: regionalRelicImages.iceContinent.parts.glacier_crown_frame },
      { id: 'mammoth_medal', name: '매머드 메달', role: '빙설왕의 권위를 나타내는 문장', image: regionalRelicImages.iceContinent.parts.mammoth_medal },
      { id: 'snowflake_crown_ornament', name: '눈꽃 왕관장식', role: '왕관을 완성하는 눈꽃 장식', image: regionalRelicImages.iceContinent.parts.snowflake_crown_ornament },
      { id: 'frost_core', name: '냉기의 핵', role: '왕관의 냉기를 유지하는 동력핵', image: regionalRelicImages.iceContinent.parts.frost_core },
    ],
  },
};

export const REGION_RELIC_PART_GOAL = 5;

export function getRelicDefinition(regionId: AdventureRegionId) {
  return REGION_RELICS[regionId];
}

export function getOwnedRelicParts(regionId: AdventureRegionId, ownedPartIds: readonly string[]) {
  const owned = new Set(ownedPartIds);
  return REGION_RELICS[regionId].parts.filter((part) => owned.has(part.id));
}

export function getMissingRelicParts(regionId: AdventureRegionId, ownedPartIds: readonly string[]) {
  const owned = new Set(ownedPartIds);
  return REGION_RELICS[regionId].parts.filter((part) => !owned.has(part.id));
}

export function hasAllRelicParts(regionId: AdventureRegionId, ownedPartIds: readonly string[]) {
  return getMissingRelicParts(regionId, ownedPartIds).length === 0;
}
