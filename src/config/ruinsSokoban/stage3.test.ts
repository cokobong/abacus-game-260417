import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getRuinsSokobanMissions, parseSokobanPuzzle, RUINS_SOKOBAN_STAGE_3_MILESTONES } from './index';
import { createSokobanState, isMissionComplete, moveSokoban } from '../../utils/ruinsSokobanRules';
import type { SokobanDirection } from './types';

const designs = JSON.parse(readFileSync(new URL('../../../docs/ruins-sokoban-puzzles.json', import.meta.url), 'utf8')) as Array<{ id: string; board: string[]; hintSteps: string[]; hintMilestones?: Array<{ id: string; boxKeys: string[]; hints: string[] }> }>;
const reports = JSON.parse(readFileSync(new URL('../../../docs/ruins-sokoban-solver-report.json', import.meta.url), 'utf8')) as Array<{ id: string; shortestSolution: string }>;
const stage3Designs = designs.filter(puzzle => /^ruins-sokoban-3-\d+$/.test(puzzle.id));
const reportById = new Map(reports.map(report => [report.id, report]));
const direction: Record<string, SokobanDirection> = { U: 'up', D: 'down', L: 'left', R: 'right' };

test('Stage 3 runtime maps all twenty validated boards and hints in order', () => {
  const missions = getRuinsSokobanMissions(3);
  assert.equal(missions.length, 20);
  missions.forEach((mission, index) => {
    assert.equal(mission.id, `ruins-sokoban-3-${index + 1}`);
    assert.deepEqual(mission.board, stage3Designs[index].board);
    assert.deepEqual(mission.tutorial?.hintSteps, stage3Designs[index].hintSteps);
  });
});

test('every Stage 3 puzzle has 3-6 state milestones with three-level hints', () => {
  for (const mission of getRuinsSokobanMissions(3)) {
    const milestones = mission.tutorial?.hintMilestones ?? [];
    assert.ok(milestones.length >= 3 && milestones.length <= 6, mission.id);
    assert.equal(new Set(milestones.map(item => item.id)).size, milestones.length, mission.id);
    milestones.forEach(item => assert.equal(item.hints.length, 3, `${mission.id}:${item.id}`));
  }
});

test('all Stage 3 solver paths clear through runtime rules', () => {
  for (const mission of getRuinsSokobanMissions(3)) {
    const report = reportById.get(mission.id);
    assert.ok(report);
    const puzzle = parseSokobanPuzzle(mission);
    let state = createSokobanState(puzzle);
    for (const letter of report.shortestSolution) state = moveSokoban(puzzle, state, direction[letter]).state;
    assert.equal(isMissionComplete(puzzle, state), true, mission.id);
  }
});

test('Stage 3 milestone mapping is fixed and complete', () => {
  assert.deepEqual(RUINS_SOKOBAN_STAGE_3_MILESTONES, {
    'ruins-sokoban-3-4': 'ancient_tablet',
    'ruins-sokoban-3-8': 'dinosaur_skull_emblem',
    'ruins-sokoban-3-12': 'emerald_stone',
    'ruins-sokoban-3-16': 'rune_core',
    'ruins-sokoban-3-20': 'sun_gear',
  });
});
