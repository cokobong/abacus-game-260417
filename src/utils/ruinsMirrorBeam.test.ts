import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RUINS_MIRROR_STAGE_1_MISSIONS,
  RUINS_MIRROR_STAGE_2_MISSIONS,
  type RuinsMirrorDefinition,
  type RuinsMirrorOrientation,
  type RuinsMirrorPlacementPuzzleConfig,
} from '../config/ruinsMirror';
import { canPlayAdventureStage, completeAdventureStage, getAdventureStageState } from './adventureStageProgress';
import { traceRuinsMirrorBeam } from './ruinsMirrorBeam';

const stage1Solutions: ReadonlyArray<ReadonlyMap<string, RuinsMirrorOrientation>> = [
  new Map([['m1', 'slash']]),
  new Map([['m1', 'backslash']]),
  new Map([['m1', 'slash'], ['m2', 'backslash']]),
  new Map([['m1', 'slash'], ['m2', 'backslash'], ['m3', 'slash']]),
];

test('Stage 1의 고정 거울 퍼즐과 기존 정답은 유지된다', () => {
  RUINS_MIRROR_STAGE_1_MISSIONS.forEach((mission, index) => {
    const initial = new Map(mission.mirrors.map(mirror => [mirror.id, mirror.initial] as const));
    assert.equal(traceRuinsMirrorBeam(mission, initial).reachedTarget, false, `${mission.id} initial`);
    assert.equal(traceRuinsMirrorBeam(mission, stage1Solutions[index]).reachedTarget, true, `${mission.id} solved`);
  });
});

function findPlacementSolutions(mission: RuinsMirrorPlacementPuzzleConfig) {
  const solutions: Array<{ mirrors: RuinsMirrorDefinition[]; segments: number }> = [];
  const combinations = 3 ** mission.mirrorSlots.length;
  for (let state = 0; state < combinations; state += 1) {
    let cursor = state;
    const mirrors: RuinsMirrorDefinition[] = [];
    for (const slot of mission.mirrorSlots) {
      const value = cursor % 3;
      cursor = Math.floor(cursor / 3);
      if (value > 0) mirrors.push({ ...slot, initial: value === 1 ? 'slash' : 'backslash', rotatable: true });
    }
    if (mirrors.length > mission.mirrorInventory) continue;
    const orientations = new Map(mirrors.map(mirror => [mirror.id, mirror.initial] as const));
    const result = traceRuinsMirrorBeam(mission, orientations, mirrors);
    if (result.reachedTarget) solutions.push({ mirrors, segments: result.segments.length });
  }
  return solutions;
}

test('Stage 2 네 미션은 제한된 거울을 슬롯에 배치해 풀 수 있다', () => {
  const expectedMinimumMirrors = [2, 2, 3, 3];
  RUINS_MIRROR_STAGE_2_MISSIONS.forEach((mission, index) => {
    assert.ok(mission.obstacles.length >= 2, `${mission.id} obstacles`);
    assert.ok(mission.mirrorSlots.length > mission.mirrorInventory, `${mission.id} inventory limit`);
    const solutions = findPlacementSolutions(mission);
    assert.ok(solutions.length > 0, `${mission.id} solvable`);
    assert.equal(Math.min(...solutions.map(solution => solution.mirrors.length)), expectedMinimumMirrors[index], `${mission.id} minimum mirrors`);
  });
});

test('Stage 2는 보유량보다 적은 거울로 푸는 우회 정답이 없다', () => {
  RUINS_MIRROR_STAGE_2_MISSIONS.forEach(mission => {
    const solutions = findPlacementSolutions(mission);
    assert.ok(solutions.every(solution => solution.mirrors.length === mission.mirrorInventory), `${mission.id} no short solution`);
    assert.equal(solutions.length, 1, `${mission.id} unique placement and orientation`);
  });
});

test('빛 경로 계산은 보드 밖이나 장애물에서 유한하게 끝난다', () => {
  for (const mission of [...RUINS_MIRROR_STAGE_1_MISSIONS, ...RUINS_MIRROR_STAGE_2_MISSIONS]) {
    const result = traceRuinsMirrorBeam(mission, new Map());
    assert.ok(result.segments.length > 0);
    assert.ok(result.segments.length <= 100);
  }
});

test('Stage 2 완료는 기존 진행 저장을 사용하고 Stage 3은 잠겨 있다', () => {
  const stage1 = completeAdventureStage({}, 'ancientRuins', 1);
  assert.equal(canPlayAdventureStage(stage1.progress, 'ancientRuins', 2), true);
  const stage2 = completeAdventureStage(stage1.progress, 'ancientRuins', 2);
  assert.equal(getAdventureStageState(stage2.progress, 'ancientRuins', 2), 'completed');
  assert.equal(canPlayAdventureStage(stage2.progress, 'ancientRuins', 3), false);
});
