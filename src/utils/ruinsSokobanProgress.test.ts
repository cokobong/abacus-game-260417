import assert from 'node:assert/strict';
import test from 'node:test';
import { clearRuinsMission, firstUnclearedRuinsMission, normalizeRuinsSokobanClears } from './ruinsSokobanProgress';

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
  assert.deepEqual(normalizeRuinsSokobanClears(['ruins-sokoban-2-1', 'ruins-sokoban-2-1', 'ruins-sokoban-3-1', null]), ['ruins-sokoban-2-1']);
});
