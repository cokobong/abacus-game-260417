import assert from 'node:assert/strict';
import test from 'node:test';
import type { OwnedEgg } from '../types/game';
import { canonicalizeEggItemId, getOwnedEggCount, migrateEggSystemV2 } from './eggMigration';

function egg(eggItemId: string, hatchProgress = 0, createdAt = 1): OwnedEgg {
  return { id: `owned-${eggItemId}-${createdAt}`, eggItemId, name: eggItemId, rarity: eggItemId === 'legend-egg' ? 'legendary' : 'rare', eggType: eggItemId === 'legend-egg' ? 'legendary' : 'rare', eggCategory: eggItemId === 'legend-egg' ? 'legendary' : 'rare', hatchProgress, createdAt };
}

test('legacy rare egg를 instance와 진행도를 보존해 통합 희귀알로 바꾼다', () => {
  const legacy = { ...egg('legacy-legend-rare-egg', 50), id: 'owned-egg-legend-egg-1788179464292', eggHabitatId: 'secret-land' };
  const result = migrateEggSystemV2([legacy], legacy.id);
  assert.deepEqual(result.ownedEggs[0], { ...legacy, eggItemId: 'rare-egg', name: '희귀 알', rarity: 'rare', eggType: 'rare', eggCategory: 'rare', eggHabitatId: undefined });
  assert.equal(result.activeEggId, legacy.id);
});

test('모든 과거 지역 희귀알 ID를 rare-egg로 canonicalize한다', () => {
  for (const id of ['green-forest-rare-egg', 'sparkle-cave-rare-egg', 'volcano-island-rare-egg', 'ocean-blue-egg', 'secret-land-rare-egg', 'legacy-legend-rare-egg']) {
    assert.equal(canonicalizeEggItemId(id), 'rare-egg');
  }
});

test('legacy와 canonical 중 active, 진행도, 생성일 순으로 하나만 보존한다', () => {
  const canonical = egg('rare-egg', 80, 2);
  const activeLegacy = egg('legacy-legend-rare-egg', 20, 3);
  const result = migrateEggSystemV2([canonical, activeLegacy], activeLegacy.id);
  assert.equal(result.ownedEggs.length, 1);
  assert.equal(result.ownedEggs[0]?.id, activeLegacy.id);
  assert.equal(result.activeEggId, activeLegacy.id);

  const byProgress = migrateEggSystemV2([canonical, egg('legacy-legend-rare-egg', 50, 1)], null);
  assert.equal(byProgress.ownedEggs[0]?.id, canonical.id);
});

test('canonical 및 새 legend egg는 변경하지 않고 반복 migration도 동일하다', () => {
  const input = [egg('rare-egg', 50), egg('legend-egg', 10, 2)];
  const once = migrateEggSystemV2(input, input[0].id);
  const twice = migrateEggSystemV2(once.ownedEggs, once.activeEggId);
  assert.deepEqual(twice, once);
  assert.equal(twice.ownedEggs[1]?.eggItemId, 'legend-egg');
  assert.equal(getOwnedEggCount([egg('legacy-legend-rare-egg')], 'rare-egg'), 1);
});

test('rare metadata를 가진 과거 legend-egg만 rare-egg로 바꾼다', () => {
  assert.equal(canonicalizeEggItemId('legend-egg', { eggCategory: 'rare', eggType: 'rare' }), 'rare-egg');
  assert.equal(canonicalizeEggItemId('legend-egg', { eggCategory: 'legendary', eggType: 'legendary' }), 'legend-egg');
});
