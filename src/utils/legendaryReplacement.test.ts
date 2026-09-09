import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { getDinosaurSpecies, dinosaurSpecies } from '../data/dinosaurSpecies';
import { getEggItemConfig, getEggRequiredFragments } from '../config/itemConfig';
import { REPLACEMENT_LEGENDARY_EGGS } from '../config/legendaryEggConfig';
import { getHatchCandidates } from './hatchCandidates';
import { getEggPurchaseState, getLegendaryCategoryStates } from './eggPurchaseState';
import type { OwnedDinosaur, OwnedEgg } from '../types/game';

const legacyOwned = ['volcanodon', 'starano', 'volcano-island-rare', 'secret-land-rare'].map(speciesId => ({ speciesId }) as OwnedDinosaur);
function egg(id: string): OwnedEgg {
  const config = getEggItemConfig(id)!;
  return { id, eggItemId: id, name: config.name, rarity: config.rarity, eggType: config.eggType, eggCategory: config.eggCategory, eggHabitatId: config.eggHabitatId, hatchProgress: 100, createdAt: 1 };
}

test('전설 교체는 새 ID와 실제 성장 PNG 6장을 사용하며 도감은 지역별 8종이다', () => {
  for (const old of legacyOwned) assert.equal(getDinosaurSpecies(old.speciesId), null);
  for (const entry of REPLACEMENT_LEGENDARY_EGGS) {
    const species = getDinosaurSpecies(entry.speciesId)!;
    assert.equal(species.rarity, 'legendary');
    assert.equal(species.habitat, entry.habitat);
    assert.equal(dinosaurSpecies.filter(s => s.habitat === entry.habitat).length, 8);
    for (const stage of ['baby', 'youth', 'adult'] as const) {
      assert.ok(species.images?.[stage].includes(stage + '_' + entry.speciesId));
      assert.ok(existsSync(new URL(species.images![stage])));
    }
    assert.equal(new Set(Object.values(species.images!)).size, 3);
  }
});

test('구형 해금/보유 전설알은 새 전설종을 주지 않고 신규 지역알만 해당 종으로 연결된다', () => {
  for (const id of ['legend-egg', 'volcano-island-rare-egg', 'secret-land-rare-egg', 'legacy-legend-rare-egg']) {
    assert.ok(getHatchCandidates(egg(id), legacyOwned).candidates.every(s => !REPLACEMENT_LEGENDARY_EGGS.some(e => e.speciesId === s.speciesId)));
  }
  for (const entry of REPLACEMENT_LEGENDARY_EGGS) {
    assert.deepEqual(getHatchCandidates(egg(entry.id), legacyOwned).candidates.map(s => s.speciesId), [entry.speciesId]);
    assert.equal(getLegendaryCategoryStates(legacyOwned).find(s => s.habitatId === entry.habitat)?.status, 'locked');
  }
});

test('Stage 3와 유물 2개를 모두 요구하고 코인 0/희귀조각 20 규칙을 가지며 판매는 준비중이다', () => {
  const progress = { lavaValley: { completedStages: [1, 2] as (1 | 2)[], visitedStages: [] } };
  assert.equal(getLegendaryCategoryStates([], undefined, progress)[0].status, 'locked');
  assert.equal(getLegendaryCategoryStates([], undefined, {}, { 'volcano-island': 2 })[0].status, 'locked');
  for (const count of [0, 1, NaN, Infinity]) assert.equal(getLegendaryCategoryStates([], undefined, progress, { 'volcano-island': count })[0].status, 'locked');
  assert.equal(getLegendaryCategoryStates([], undefined, progress, { 'volcano-island': 2 })[0].status, 'available');
  for (const id of ['legend-egg', ...REPLACEMENT_LEGENDARY_EGGS.map(e => e.id)]) {
    const config = getEggItemConfig(id)!;
    assert.equal(config.price, 0);
    assert.deepEqual(getEggRequiredFragments(config), [{ itemId: 'rare-egg-fragment', amount: 20 }]);
    for (const quantity of [19, 20, 999]) assert.equal(getEggPurchaseState(config, 0, [{ itemId: 'rare-egg-fragment', quantity }], legacyOwned, []).status, 'comingSoon');
  }
});
