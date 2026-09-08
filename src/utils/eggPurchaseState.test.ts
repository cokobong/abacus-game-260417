import assert from 'node:assert/strict';
import test from 'node:test';
import { getEggItemConfig, getEggRequiredFragments, legacyEggItemConfigs, RARE_EGG_FRAGMENT_COST } from '../config/itemConfig';
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
  assert.deepEqual(SHOP_CATALOG.egg.map((id) => [egg(id).price, egg(id).requiredFragmentAmount ?? 0]), [[500, 0], [900, 0], [0, RARE_EGG_FRAGMENT_COST], [0, 10]]);
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
  assert.equal(getEggPurchaseState(item, 0, [{ itemId: 'rare-egg-fragment', quantity: RARE_EGG_FRAGMENT_COST }], [], []).status, 'available');
});

test('희귀알은 코인 없이 조각 15개로 구매하며 14개일 때 동일한 부족 안내를 표시한다', () => {
  const item = egg('rare-egg');
  assert.equal(RARE_EGG_FRAGMENT_COST, 15);
  for (const coins of [0, 1200, 999999]) {
    const insufficient = getEggPurchaseState(item, coins, [{ itemId: 'rare-egg-fragment', quantity: 14 }], [], []);
    assert.equal(insufficient.status, 'insufficientFragments');
    assert.equal(insufficient.disabled, true);
    assert.equal(insufficient.label, '희귀조각이 부족해요');
    const available = getEggPurchaseState(item, coins, [{ itemId: 'rare-egg-fragment', quantity: 15 }], [], []);
    assert.equal(available.status, 'available');
    assert.equal(available.disabled, false);
    assert.equal(available.coinCost, 0);
    assert.equal(available.fragmentCost, 15);
  }
  assert.equal(getEggPurchaseState(item, 0, [{ itemId: 'rare-egg-fragment', quantity: 30 }], [], [ownedEgg(item.id)]).disabled, true);
});

test('구형 희귀알도 코인 0과 공통 조각 비용을 사용하며 부화 메타데이터는 유지한다', () => {
  for (const item of [egg('rare-egg'), ...legacyEggItemConfigs]) {
    assert.equal(item.price, 0);
    assert.deepEqual(getEggRequiredFragments(item), [{ itemId: 'rare-egg-fragment', amount: RARE_EGG_FRAGMENT_COST }]);
  }
});

test('legacy 지역 희귀알은 판매 카탈로그에 노출되지 않는다', () => {
  assert.ok(legacyEggItemConfigs.every((item) => !SHOP_CATALOG.egg.includes(item.id as never)));
});

test('전설 도감 조건은 non-legendary 수에 맞춰 5 이하로 clamp하고 중복을 막는다', () => {
  const base = dinosaurSpecies.filter((species) => species.habitat === 'volcano-island').slice(0, 3);
  const legendary: DinosaurSpecies = { ...base[0], speciesId: 'forest-legend-test', displayName: '숲 전설', name: '숲 전설', defaultName: '숲 전설', rarity: 'legendary', starterSelectable: false };
  const pool = [...base, legendary];
  assert.equal(getLegendaryCategoryStates([], pool)[0].required, 3);
  assert.equal(getLegendaryCategoryStates(base.map((species) => ownedDinosaur(species.speciesId)), pool)[0].status, 'available');
  assert.equal(getLegendaryCategoryStates([...base.map((species) => ownedDinosaur(species.speciesId)), ownedDinosaur(legendary.speciesId)], pool)[0].status, 'completed');
});

test('전설알은 재화와 도감 조건을 충족해도 준비중으로 구매를 차단한다', () => {
  const item = egg('legend-egg');
  const discovered = dinosaurSpecies.filter((species) => species.rarity !== 'legendary').map((species) => ownedDinosaur(species.speciesId));
  for (const coins of [0, 999999]) {
    for (const ownedEggs of [[], [ownedEgg(item.id)]]) {
      const state = getEggPurchaseState(item, coins, [{ itemId: 'rare-egg-fragment', quantity: 999999 }], discovered, ownedEggs);
      assert.equal(state.status, 'comingSoon');
      assert.equal(state.disabled, true);
      assert.equal(state.label, '준비중');
    }
  }
});

test('일반알과 특수알은 기존 재화 및 보유 조건으로 구매한다', () => {
  for (const id of ['green-starter-egg', 'rare-spark-egg']) {
    const item = egg(id);
    assert.equal(getEggPurchaseState(item, item.price, [], [], []).status, 'available');
    assert.equal(getEggPurchaseState(item, item.price - 1, [], [], []).status, 'insufficientCoins');
    assert.equal(getEggPurchaseState(item, item.price, [], [], [ownedEgg(id)]).disabled, true);
  }
});
