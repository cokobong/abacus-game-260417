import assert from 'node:assert/strict';
import test from 'node:test';
import { RUINS_SOKOBAN_STAGE_1, RUINS_SOKOBAN_STAGE_2, parseSokobanPuzzle } from '../config/ruinsSokoban';
import { areAllBoxesOnGoals, createSokobanState, getStaticDeadlockKeys, moveSokoban, solveSokoban } from './ruinsSokobanRules';

test('movement, wall collision, push, box collision and undo snapshots are deterministic', () => {
  const puzzle = parseSokobanPuzzle(RUINS_SOKOBAN_STAGE_1[1]);
  const initial = createSokobanState(puzzle);
  const pushed = moveSokoban(puzzle, initial, 'down');
  assert.equal(pushed.moved, true);
  assert.equal(pushed.pushed, true);
  assert.equal(areAllBoxesOnGoals(puzzle, pushed.state), true);
  assert.deepEqual(initial.boxes, puzzle.boxStarts, 'the previous state stays immutable for Undo');
  assert.equal(moveSokoban(puzzle, initial, 'up').blockedBy, 'wall');
});

test('failed box pushes are distinguished from ordinary wall bumps for blocked feedback', () => {
  const puzzle = parseSokobanPuzzle(RUINS_SOKOBAN_STAGE_1[1]);
  const initial = createSokobanState(puzzle);
  const firstPush = moveSokoban(puzzle, initial, 'down');
  const blockedPush = moveSokoban(puzzle, firstPush.state, 'down');
  assert.equal(blockedPush.moved, false);
  assert.equal(blockedPush.blockedBy, 'wall');
  assert.equal(blockedPush.attemptedPush, true);
  assert.equal(moveSokoban(puzzle, initial, 'up').attemptedPush, false);
});

test('all Stage 1 and Stage 2 puzzle configs are solvable at their verified costs', t => {
  for (const config of [...RUINS_SOKOBAN_STAGE_1, ...RUINS_SOKOBAN_STAGE_2]) {
    const puzzle = parseSokobanPuzzle(config);
    assert.equal(puzzle.boxStarts.length, puzzle.goals.size, `${config.id} box/goal count`);
    const result = solveSokoban(puzzle);
    assert.ok(result.solution, `${config.id} solvable`);
    assert.equal(result.solution.pushes, config.expectedMinPushes, `${config.id} minimum pushes`);
    assert.equal(result.solution.moves, config.expectedMinMoves, `${config.id} moves among minimum-push solutions`);
    t.diagnostic(`${config.id}: pushes ${result.solution.pushes}, moves ${result.solution.moves}, states ${result.exploredStates}`);
  }
});

test('Stage 2 has no solution below the intended easy-route threshold and exposes deadlock cells', () => {
  let previousPushes = 0;
  for (const config of RUINS_SOKOBAN_STAGE_2) {
    const puzzle = parseSokobanPuzzle(config);
    const result = solveSokoban(puzzle);
    assert.ok(result.solution);
    assert.ok(result.solution.pushes > (config.maxEasyPushes ?? -1), `${config.id} no overly easy route`);
    assert.ok(result.solution.pushes > previousPushes, `${config.id} push difficulty rises`);
    previousPushes = result.solution.pushes;
    assert.ok(getStaticDeadlockKeys(puzzle).size > 0, `${config.id} has major static deadlocks`);
  }
});

test('tutorial deadlock missions mark non-goal corners', () => {
  for (const config of RUINS_SOKOBAN_STAGE_1.filter(item => item.showDeadlockHint)) {
    assert.ok(getStaticDeadlockKeys(parseSokobanPuzzle(config)).size > 0, `${config.id} deadlock hints`);
  }
});

test('Stage 1 teaches seven focused movement patterns and every mission provides hints', () => {
  assert.equal(RUINS_SOKOBAN_STAGE_1.length, 7);
  assert.deepEqual(RUINS_SOKOBAN_STAGE_1.map(config => config.mission), [1, 2, 3, 4, 5, 6, 7]);
  for (const config of RUINS_SOKOBAN_STAGE_1) {
    assert.ok(config.tutorial?.introText, `${config.id} intro`);
    assert.ok(config.tutorial?.hintSteps.length, `${config.id} hints`);
  }
});

test('Stage 2 puzzle boards stay unchanged and hints are progressive', () => {
  assert.deepEqual(RUINS_SOKOBAN_STAGE_2.map(config => config.board), [
    ['######', '# .. #', '# #$ #', '# $  #', '#  @E#', '######'],
    ['#######', '# . . #', '#  #  #', '# $$  #', '#  #$ #', '# @ .E#', '#######'],
    ['#######', '# .####', '# .   #', '# .$$ #', '#  $  #', '#  @ E#', '#######'],
  ]);
  assert.ok(RUINS_SOKOBAN_STAGE_2.every(config => config.tutorial?.hintSteps.length === 3));
});
