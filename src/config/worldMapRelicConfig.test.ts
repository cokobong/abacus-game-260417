import assert from 'node:assert/strict';
import test from 'node:test';
import { REGION_RELICS } from './regionalRelicConfig';
import { canRestoreRegionRelic, normalizeRegionRelicProgress, resolveLavaFinalChest } from './worldMapRelicConfig';

test('5개 지역은 고유한 유물 부품 5종씩을 가진다', () => {
  const definitions = Object.values(REGION_RELICS);
  const partIds = definitions.flatMap((definition) => definition.parts.map((part) => part.id));
  assert.equal(definitions.length, 5);
  assert.ok(definitions.every((definition) => definition.parts.length === 5));
  assert.equal(new Set(partIds).size, 25);
});

test('기존 숫자 진행도는 앞 순서의 부품 ID로 손실 없이 마이그레이션한다', () => {
  const progress = normalizeRegionRelicProgress({ lavaValley: { fragments: 3, completed: false, consecutiveMisses: 2, stage3FirstCleared: true, chestOpenedCount: 4 } });
  assert.deepEqual(progress.lavaValley.ownedPartIds, ['magma_crystal', 'lava_hilt', 'tyranno_medal']);
  assert.equal(progress.lavaValley.consecutiveMisses, 2);
  assert.deepEqual(progress.skyIsland.ownedPartIds, []);
  assert.equal('fragments' in progress.lavaValley, false);
});

test('저장된 부품 ID가 있으면 legacy count보다 우선하며 잘못된 ID와 중복을 제거한다', () => {
  const progress = normalizeRegionRelicProgress({ lavaValley: { ownedPartIds: ['flame_core', 'flame_core', 'unknown'], fragments: 5 } });
  assert.deepEqual(progress.lavaValley.ownedPartIds, ['flame_core']);
});

test('기본 확률 성공은 미보유 부품 하나를 지급하고 miss를 초기화한다', () => {
  const resolved = resolveLavaFinalChest(normalizeRegionRelicProgress().lavaValley, () => .1);
  assert.equal(resolved.outcome.acquired, true);
  assert.equal(resolved.outcome.partId, 'magma_crystal');
  assert.equal(resolved.progress.ownedPartIds.length, 1);
  assert.equal(resolved.progress.consecutiveMisses, 0);
});

test('획득 성공은 중복 없이 미보유 부품만 고르고 5/5 이후 지급하지 않는다', () => {
  const current = { ...normalizeRegionRelicProgress().lavaValley, ownedPartIds: ['magma_crystal', 'lava_hilt', 'tyranno_medal', 'volcano_blade'], consecutiveMisses: 3 };
  const resolved = resolveLavaFinalChest(current, () => .999);
  assert.equal(resolved.outcome.partId, 'flame_core');
  assert.equal(new Set(resolved.progress.ownedPartIds).size, 5);
  const capped = resolveLavaFinalChest(resolved.progress, () => 0);
  assert.equal(capped.outcome.acquired, false);
  assert.deepEqual(capped.progress.ownedPartIds, resolved.progress.ownedPartIds);
});

test('도감과 무관하게 고유 부품 5종일 때만 명시적 복원이 가능하다', () => {
  const progress = { ...normalizeRegionRelicProgress().lavaValley, ownedPartIds: REGION_RELICS.lavaValley.parts.map((part) => part.id) };
  assert.equal(canRestoreRegionRelic('lavaValley', progress), true);
  assert.equal(canRestoreRegionRelic('lavaValley', { ...progress, ownedPartIds: progress.ownedPartIds.slice(0, 4) }), false);
  assert.equal(canRestoreRegionRelic('lavaValley', { ...progress, completed: true }), false);
});

test('실패는 miss를 누적하고 2회 실패부터 상승 확률을 적용한다', () => {
  const current = { ...normalizeRegionRelicProgress().lavaValley, consecutiveMisses: 2 };
  assert.equal(resolveLavaFinalChest(current, () => .69).outcome.acquired, true);
  const missed = resolveLavaFinalChest({ ...current, consecutiveMisses: 0 }, () => .9);
  assert.equal(missed.outcome.acquired, false);
  assert.equal(missed.progress.consecutiveMisses, 1);
});
