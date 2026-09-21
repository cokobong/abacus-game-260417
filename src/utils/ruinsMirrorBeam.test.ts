import assert from 'node:assert/strict';
import test from 'node:test';
import { RUINS_MIRROR_STAGE_1_MISSIONS, RUINS_MIRROR_STAGE_2_MISSIONS, getRuinsMirrorTargets, type RuinsMirrorFixedPuzzleConfig, type RuinsMirrorOrientation } from '../config/ruinsMirror';
import { canPlayAdventureStage, completeAdventureStage, getAdventureStageState } from './adventureStageProgress';
import { traceRuinsMirrorBeam } from './ruinsMirrorBeam';

const stage1Solutions: ReadonlyArray<ReadonlyMap<string, RuinsMirrorOrientation>> = [
  new Map([['m1', 'slash']]), new Map([['m1', 'backslash']]),
  new Map([['m1', 'slash'], ['m2', 'backslash']]),
  new Map([['m1', 'slash'], ['m2', 'backslash'], ['m3', 'slash']]),
];

test('Stage 1 config and solutions remain unchanged and valid', () => {
  assert.equal(RUINS_MIRROR_STAGE_1_MISSIONS.length, 4);
  RUINS_MIRROR_STAGE_1_MISSIONS.forEach((mission, index) => {
    const initial = new Map(mission.mirrors.map(mirror => [mirror.id, mirror.initial] as const));
    assert.equal(traceRuinsMirrorBeam(mission, initial).reachedTarget, false, `${mission.id} initial`);
    assert.equal(traceRuinsMirrorBeam(mission, stage1Solutions[index]).reachedTarget, true, `${mission.id} solved`);
  });
});

function enumerateSolutions(mission: RuinsMirrorFixedPuzzleConfig) {
  const rotatable = mission.mirrors.filter(mirror => mirror.rotatable);
  const solutions: Array<{ orientations: Map<string, RuinsMirrorOrientation>; reflections: number }> = [];
  for (let state = 0; state < 2 ** rotatable.length; state += 1) {
    const orientations = new Map<string, RuinsMirrorOrientation>();
    rotatable.forEach((mirror, index) => orientations.set(mirror.id, (state & (1 << index)) === 0 ? 'slash' : 'backslash'));
    const result = traceRuinsMirrorBeam(mission, orientations);
    if (result.reachedTarget) solutions.push({ orientations, reflections: result.reflections });
  }
  return { rotatable, stateCount: 2 ** rotatable.length, solutions };
}

test('Stage 2 has six fixed-placement 7x7 missions with verified intended solutions', t => {
  assert.equal(RUINS_MIRROR_STAGE_2_MISSIONS.length, 6);
  RUINS_MIRROR_STAGE_2_MISSIONS.forEach(mission => {
    assert.deepEqual(mission.grid, { columns: 7, rows: 7 });
    assert.equal(mission.mode, 'fixed');
    assert.ok(mission.solution);
    const result = traceRuinsMirrorBeam(mission, new Map(Object.entries(mission.solution!)));
    assert.equal(result.reachedTarget, true, `${mission.id} intended solution`);
    assert.equal(result.reachedTargets.size, getRuinsMirrorTargets(mission).length, `${mission.id} all targets simultaneous`);
    t.diagnostic(`${mission.id}: ${mission.mirrors.filter(m => m.rotatable).length} rotatable mirrors, ${2 ** mission.mirrors.filter(m => m.rotatable).length} states`);
  });
});

test('Stage 2 exhaustive search rejects shorter unintended solutions', t => {
  RUINS_MIRROR_STAGE_2_MISSIONS.forEach(mission => {
    const { rotatable, stateCount, solutions } = enumerateSolutions(mission);
    assert.ok(solutions.length > 0, `${mission.id} solvable`);
    const minimumReflections = Math.min(...solutions.map(solution => solution.reflections));
    assert.equal(minimumReflections, mission.expectedMinimumReflections, `${mission.id} minimum reflections`);
    t.diagnostic(`${mission.id}: ${rotatable.length} mirrors / ${stateCount} states / ${solutions.length} solutions / min ${minimumReflections} reflections`);
  });
});

test('Stage 2 mechanic progression and final mission constraints are satisfied', () => {
  const counts = RUINS_MIRROR_STAGE_2_MISSIONS.map(mission => mission.mirrors.filter(mirror => mirror.rotatable).length);
  assert.ok(counts[0] >= 3 && counts[0] <= 4);
  assert.ok(counts[1] >= 3 && counts[1] <= 4);
  assert.ok(counts[2] >= 4 && counts[2] <= 5);
  assert.equal(RUINS_MIRROR_STAGE_2_MISSIONS[1].mirrors.filter(mirror => !mirror.rotatable).length, 1);
  assert.ok(RUINS_MIRROR_STAGE_2_MISSIONS[2].mirrors.some(mirror => mirror.id === 'dummy'));
  for (const mission of RUINS_MIRROR_STAGE_2_MISSIONS.slice(3)) {
    assert.equal(mission.splitters?.length, 1);
    assert.equal(getRuinsMirrorTargets(mission).length, 2);
  }
  const final = RUINS_MIRROR_STAGE_2_MISSIONS[5];
  assert.ok(counts[5] >= 5 && counts[5] <= 6);
  assert.ok(final.mirrors.some(mirror => mirror.id === 'dummy'));
  assert.ok((final.blockers?.length ?? 0) > 0);
  assert.ok((final.expectedMinimumReflections ?? 0) >= 4 && (final.expectedMinimumReflections ?? 0) <= 6);
});

test('beam tracing terminates safely for every initial mission state', () => {
  for (const mission of [...RUINS_MIRROR_STAGE_1_MISSIONS, ...RUINS_MIRROR_STAGE_2_MISSIONS]) {
    const result = traceRuinsMirrorBeam(mission, new Map());
    assert.ok(result.segments.length > 0 && result.segments.length <= 400);
  }
});

test('Stage 2 completion unlocks the implemented Stage 3 campaign', () => {
  const stage1 = completeAdventureStage({}, 'ancientRuins', 1);
  assert.equal(canPlayAdventureStage(stage1.progress, 'ancientRuins', 2), true);
  const stage2 = completeAdventureStage(stage1.progress, 'ancientRuins', 2);
  assert.equal(getAdventureStageState(stage2.progress, 'ancientRuins', 2), 'completed');
  assert.equal(canPlayAdventureStage(stage2.progress, 'ancientRuins', 3), true);
});
