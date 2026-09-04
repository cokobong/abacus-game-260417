import assert from 'node:assert/strict';
import test from 'node:test';
import { getEggItemConfig, legacyEggItemConfigs } from '../config/itemConfig';
import { SHOP_CATALOG } from '../config/shopCatalog';
import { dinosaurSpecies, getDinosaurSpecies, type DinosaurSpecies } from '../data/dinosaurSpecies';
import type { OwnedDinosaur, OwnedEgg } from '../types/game';
import { getEggPurchaseState, getLegendaryCategoryStates } from './eggPurchaseState';
import { getHatchCandidates } from './hatchCandidates';

function egg(id: string) { const item = getEggItemConfig(id); assert.ok(item); return item; }
function ownedDinosaur(speciesId: string): OwnedDinosaur { return { id: `owned-${speciesId}`, speciesId, name: speciesId, rarity: getDinosaurSpecies(speciesId)?.rarity ?? 'common', level: 1, exp: 0, expToNextLevel: 100, growthStage: 'baby', mood: 70, happiness: 70, stamina: 70, maxStamina: 100, obtainedAt: 1 }; }
function ownedEgg(itemId: string): OwnedEgg { const item = egg(itemId); return { id: `owned-${itemId}`, eggItemId: itemId, name: item.name, rarity: item.rarity, eggType: item.eggType, eggCategory: item.eggCategory, eggHabitatId: item.eggHabitatId, hatchProgress: 0, createdAt: 1 }; }

test('상점 알은 common/special/rare/legendary 4종만 유지한다', () => {
  assert.deepEqual(SHOP_CATALOG.egg, ['green-starter-egg', 'rare-spark-egg', 'rare-egg', 'legend-egg']);
  assert.deepEqual(SHOP_CATALOG.egg.map((id) => egg(id).rarity), ['common', 'special', 'rare', 'legendary']);
  assert.deepEqual(SHOP_CATALOG.egg.map((id) => [egg(id).price, egg(id).requiredFragmentAmount ?? 0]), [[500, 0], [900, 0], [1200, 3], [0, 10]]);
});

test('일반/특수/희귀 알 pool은 해당 rarity의 미획득 공룡만 반환한다', () => {
  for (const [eggId, rarity] of [['green-starter-egg', 'common'], ['rare-spark-egg', 'special'], ['rare-egg', 'rare']] as const) {
    const first = dinosaurSpecies.find((species) => species.rarity === rarity)!;
    const result = getHatchCandidates(ownedEgg(eggId), [ownedDinosaur(first.speciesId)]);
    assert.ok(result.matchingSpecies.every((species) => species.rarity === rarity));
    assert.ok(result.candidates.every((species) => species.rarity === rarity && species.speciesId !== first.speciesId));
  }
});

test('희귀 알은 pool empty를 재화 부족보다 먼저 품절 판정한다', () => {
  const item = egg('rare-egg');
  const ownedRare = dinosaurSpecies.filter((species) => species.rarity === 'rare').map((species) => ownedDinosaur(species.speciesId));
  assert.equal(getEggPurchaseState(item, 0, [], ownedRare, []).status, 'soldOut');
  assert.equal(getEggPurchaseState(item, 1200, [], [], []).status, 'insufficientFragments');
  assert.equal(getEggPurchaseState(item, 1200, [{ itemId: 'rare-egg-fragment', quantity: 3 }], [], []).status, 'available');
});

test('legacy 지역 희귀알은 판매하지 않지만 기존 linked creature를 그대로 부화한다', () => {
  assert.ok(legacyEggItemConfigs.every((item) => !SHOP_CATALOG.egg.includes(item.id as never)));
  for (const item of legacyEggItemConfigs) assert.deepEqual(getHatchCandidates(ownedEgg(item.id), []).candidates.map((species) => species.speciesId), [item.linkedSpeciesId]);
});

test('전설 도감 조건은 non-legendary 수에 맞춰 5 이하로 clamp하고 중복을 막는다', () => {
  const base = dinosaurSpecies.filter((species) => species.habitat === 'green-forest').slice(0, 3);
  const legendary: DinosaurSpecies = { ...base[0], speciesId: 'forest-legend-test', displayName: '숲 전설', name: '숲 전설', defaultName: '숲 전설', rarity: 'legendary', starterSelectable: false };
  const pool = [...base, legendary];
  assert.equal(getLegendaryCategoryStates([], pool)[0].required, 3);
  assert.equal(getLegendaryCategoryStates(base.map((species) => ownedDinosaur(species.speciesId)), pool)[0].status, 'available');
  assert.equal(getLegendaryCategoryStates([...base.map((species) => ownedDinosaur(species.speciesId)), ownedDinosaur(legendary.speciesId)], pool)[0].status, 'completed');
});

test('직렬화 후에도 legacy eggItemId와 연결 공룡이 유지된다', () => {
  const restored = JSON.parse(JSON.stringify(ownedEgg('ocean-blue-egg'))) as OwnedEgg;
  assert.equal(getHatchCandidates(restored, []).candidates[0]?.speciesId, 'crystalo');
});
