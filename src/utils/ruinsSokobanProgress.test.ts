import assert from 'node:assert/strict';
import test from 'node:test';
import { completeRuinsMissionWithReward, clearRuinsMission, firstUnclearedRuinsMission, isRuinsMissionUnlocked, normalizeRuinsSokobanClears } from './ruinsSokobanProgress';
import type { RegionRelicProgress } from '../config/worldMapRelicConfig';

test('Stage 2 resumes at the first uncleared mission and only advances after a clear', () => {
  let cleared: string[] = [];
  for (let mission = 1; mission <= 10; mission += 1) {
    assert.equal(firstUnclearedRuinsMission(cleared), mission - 1);
    cleared = clearRuinsMission(cleared, `ruins-sokoban-2-${mission}`);
  }
  assert.equal(firstUnclearedRuinsMission(cleared), -1);
  assert.deepEqual(clearRuinsMission(cleared, 'ruins-sokoban-2-10'), cleared);
});

test('saved mission IDs reject unrelated regions, malformed values, and duplicates', () => {
  assert.deepEqual(normalizeRuinsSokobanClears(['ruins-sokoban-2-1', 'ruins-sokoban-2-1', 'ruins-sokoban-3-1', null]), ['ruins-sokoban-2-1', 'ruins-sokoban-3-1']);
});

test('Stage 3 unlocks sequentially and keeps completed missions available', () => {
  const cleared = ['ruins-sokoban-3-1'];
  assert.equal(firstUnclearedRuinsMission(cleared, 3), 1);
  assert.equal(isRuinsMissionUnlocked(cleared, 0), true);
  assert.equal(isRuinsMissionUnlocked(cleared, 1), true);
  assert.equal(isRuinsMissionUnlocked(cleared, 2), false);
});

test('milestone clear and fixed relic reward are idempotent', () => {
  const progress: RegionRelicProgress = { ownedPartIds: [], completed: false, consecutiveMisses: 0, stage3FirstCleared: false, chestOpenedCount: 0 };
  const first = completeRuinsMissionWithReward([], progress, 'ruins-sokoban-3-4');
  assert.equal(first.awardedPartId, 'ancient_tablet');
  assert.deepEqual(first.relicProgress.ownedPartIds, ['ancient_tablet']);
  const repeated = completeRuinsMissionWithReward(first.clearedMissionIds, first.relicProgress, 'ruins-sokoban-3-4');
  assert.equal(repeated.awardedPartId, undefined);
  assert.deepEqual(repeated.relicProgress.ownedPartIds, ['ancient_tablet']);
});
