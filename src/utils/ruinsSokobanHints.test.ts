import assert from 'node:assert/strict';
import test from 'node:test';
import type { SokobanPuzzleConfig, SokobanRuntimeSnapshot } from '../config/ruinsSokoban';
import { getRuinsSokobanHintContextKey, resolveRuinsSokobanHint } from './ruinsSokobanHints';

const mission: SokobanPuzzleConfig = {
  id: 'ruins-sokoban-3-test', stage: 3, mission: 1, title: 'test', instruction: 'test',
  board: ['#####', '#@$.#', '#####'], completion: 'boxesOnGoals', highlights: [], showDeadlockHint: false,
  tutorial: {
    introText: 'test', hintSteps: ['fixed 1', 'fixed 2', 'fixed 3'],
    hintMilestones: [{ id: 'start', boxKeys: ['2,3'], boxPositions: ['2,3'], targetBoxIndex: 0, direction: 'right', hints: ['concept', 'target', 'action'] }],
  },
};
const snapshot: SokobanRuntimeSnapshot = {
  player: { column: 1, row: 3 }, boxes: [{ column: 2, row: 3 }], goalsCompleted: 0,
  moveCount: 0, pushCount: 0, deadlock: false,
};

test('matching state advances concept, target, action and then holds the last hint', () => {
  assert.equal(resolveRuinsSokobanHint(mission, snapshot, 0, false).message, 'concept');
  assert.equal(resolveRuinsSokobanHint(mission, snapshot, 1, false).message, 'target');
  assert.equal(resolveRuinsSokobanHint(mission, snapshot, 2, false).message, 'action');
  assert.equal(resolveRuinsSokobanHint(mission, snapshot, 20, false).message, 'action');
});

test('reset escalation reveals one current crate, then its next push direction', () => {
  const visual = resolveRuinsSokobanHint(mission, snapshot, 0, false, 15);
  assert.deepEqual(visual.visualTarget, snapshot.boxes[0]);
  assert.equal(visual.direction, undefined);
  const directional = resolveRuinsSokobanHint(mission, snapshot, 0, false, 19);
  assert.deepEqual(directional.visualTarget, snapshot.boxes[0]);
  assert.equal(directional.direction, 'right');
  assert.match(directional.message, /오른쪽/);
});

test('changed state uses a state-aware fallback and creates a new context', () => {
  const changed = { ...snapshot, player: { column: 2, row: 2 }, boxes: [{ column: 3, row: 3 }] };
  assert.equal(resolveRuinsSokobanHint(mission, changed, 0, true).kind, 'fallback');
  assert.notEqual(getRuinsSokobanHintContextKey(snapshot), getRuinsSokobanHintContextKey(changed));
});

test('deadlock overrides normal hints and emphasizes undo when available', () => {
  const result = resolveRuinsSokobanHint(mission, { ...snapshot, deadlock: true }, 0, true);
  assert.equal(result.kind, 'deadlock');
  assert.equal(result.emphasizeUndo, true);
  assert.match(result.message, /한 수 뒤로/);
});
