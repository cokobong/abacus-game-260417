import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getRuinsSokobanMissions, parseSokobanPuzzle, sokobanKey } from './index';
import { getAdventureStage } from '../adventureStageCatalog';
import { createSokobanState, isMissionComplete, moveSokoban } from '../../utils/ruinsSokobanRules';
import type { SokobanDirection } from './types';

type DesignPuzzle = { id: string; board: string[]; hintSteps: string[] };
type SolverResult = { id: string; solutionPath: string; minPush: number; movesAtMinPush: number };

const designs = JSON.parse(readFileSync(new URL('../../../docs/ruins-sokoban-puzzles.json', import.meta.url), 'utf8')) as DesignPuzzle[];
const results = JSON.parse(readFileSync(new URL('../../../docs/ruins-sokoban-solver-report.json', import.meta.url), 'utf8')) as SolverResult[];
const stage2Designs = designs.filter(puzzle => /^ruins-sokoban-2-\d+$/.test(puzzle.id));
const stage2Results = new Map(results.map(result => [result.id, result]));
const directions: Record<string, SokobanDirection> = { U: 'up', D: 'down', L: 'left', R: 'right' };

test('all ten runtime Stage 2 missions match the validated boards and hints', () => {
  const missions = getRuinsSokobanMissions(2);
  assert.equal(missions.length, 10);
  assert.equal(stage2Designs.length, 10);
  assert.equal(getRuinsSokobanMissions(1).length, 7);

  for (const [index, mission] of missions.entries()) {
    const design = stage2Designs[index];
    assert.ok(design);
    assert.equal(mission.id, `ruins-sokoban-2-${index + 1}`);
    assert.equal(mission.id, design.id);
    assert.deepEqual(mission.board, design.board, `${mission.id}: board rows`);
    assert.deepEqual(mission.tutorial?.hintSteps, design.hintSteps, `${mission.id}: hints`);

    const parsed = parseSokobanPuzzle(mission);
    const cells = design.board.flatMap((row, y) => [...row].map((cell, x) => ({ cell, point: { column: x, row: y } })));
    const points = (symbols: string) => cells.filter(({ cell }) => symbols.includes(cell)).map(({ point }) => sokobanKey(point)).sort();
    assert.deepEqual([...parsed.walls].sort(), points('#'), `${mission.id}: walls`);
    assert.equal(sokobanKey(parsed.playerStart), points('@+')[0], `${mission.id}: player`);
    assert.deepEqual(parsed.boxStarts.map(sokobanKey).sort(), points('$*'), `${mission.id}: boxes`);
    assert.deepEqual([...parsed.goals].sort(), points('.*+'), `${mission.id}: goals`);
  }
});

test('solver paths clear every runtime Stage 2 mission using the actual movement rules', () => {
  for (const mission of getRuinsSokobanMissions(2)) {
    const result = stage2Results.get(mission.id);
    assert.ok(result, `${mission.id}: solver report`);
    const puzzle = parseSokobanPuzzle(mission);
    let state = createSokobanState(puzzle);
    for (const letter of result.solutionPath) {
      const direction = directions[letter];
      assert.ok(direction, `${mission.id}: valid solver direction`);
      const next = moveSokoban(puzzle, state, direction);
      assert.equal(next.moved, true, `${mission.id}: ${letter} at move ${state.moveCount + 1}`);
      state = next.state;
    }
    assert.equal(isMissionComplete(puzzle, state), true, `${mission.id}: clear`);
    assert.equal(state.pushCount, result.minPush, `${mission.id}: pushes`);
    assert.equal(state.moveCount, result.movesAtMinPush, `${mission.id}: moves`);
    assert.equal(mission.expectedMinPushes, result.minPush);
    assert.equal(mission.expectedMinMoves, result.movesAtMinPush);
  }
});

test('ancient ruins Stage 3 remains unavailable', () => {
  assert.equal(getAdventureStage('ancientRuins', 3).implemented, false);
});
