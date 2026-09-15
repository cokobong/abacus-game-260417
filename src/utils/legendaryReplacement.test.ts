import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_REGION_STATUS } from '../config/adventureRegionStatus';
import { dinosaurSpecies, getDinosaurSpecies } from '../data/dinosaurSpecies';
import { LEGENDARY_REGION_RULES } from '../config/legendaryEggConfig';
import { REGION_RELICS } from '../config/regionalRelicConfig';
import { getLegendaryHatchCandidate } from './hatchCandidates';
import { getLegendaryCategoryStates } from './eggPurchaseState';

test('전설 지역 config는 다섯 지역과 실제 전설 공룡을 한 번씩 연결한다', () => {
  assert.deepEqual(LEGENDARY_REGION_RULES.map((rule) => rule.regionId), Object.keys(ADVENTURE_REGION_STATUS));
  for (const rule of LEGENDARY_REGION_RULES) {
    const species = getDinosaurSpecies(rule.legendarySpeciesId);
    if (species?.status === 'planned' || species?.isPlaceholder) continue;
    assert.equal(species?.rarity, 'legendary');
    assert.equal(species?.habitat, rule.habitatId);
    assert.equal(getLegendaryHatchCandidate(rule.regionId)?.speciesId, rule.legendarySpeciesId);
  }
});

test('전설 자격은 open 지역의 도감 5종과 유효 유물 부품 2종을 모두 요구한다', () => {
  const rule = LEGENDARY_REGION_RULES.find((entry) => entry.regionId === 'lavaValley')!;
  const discovered = dinosaurSpecies.filter((species) => species.habitat === rule.habitatId && species.rarity !== 'legendary').slice(0, 5).map((species) => species.speciesId);
  const validParts = REGION_RELICS.lavaValley.parts.slice(0, 2).map((part) => part.id);
  const state = (parts: string[]) => getLegendaryCategoryStates([], undefined, discovered, { lavaValley: { ownedPartIds: parts } }).find((entry) => entry.regionId === 'lavaValley')!;
  assert.equal(state(validParts.slice(0, 1)).status, 'locked');
  assert.equal(state([validParts[0]!, 'invalid-part-id']).relicPartCount, 1);
  assert.equal(state(validParts).status, 'available');
});

test('locked/comingSoon 지역과 planned 전설은 자격 대상이 아니다', () => {
  const states = getLegendaryCategoryStates([], undefined, dinosaurSpecies.map((species) => species.speciesId), {
    deepSeaCanyon: { ownedPartIds: REGION_RELICS.deepSeaCanyon.parts.slice(0, 2).map((part) => part.id) },
    iceContinent: { ownedPartIds: REGION_RELICS.iceContinent.parts.slice(0, 2).map((part) => part.id) },
    ancientRuins: { ownedPartIds: REGION_RELICS.ancientRuins.parts.slice(0, 2).map((part) => part.id) },
  });
  assert.equal(states.find((state) => state.regionId === 'deepSeaCanyon')?.status, 'locked');
  assert.equal(states.find((state) => state.regionId === 'iceContinent')?.status, 'locked');
  assert.equal(states.find((state) => state.regionId === 'ancientRuins')?.status, 'unavailable');
});
