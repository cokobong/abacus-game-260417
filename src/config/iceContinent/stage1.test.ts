import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceIceStage1, createIceStage1State, iceLadderAt, ICE_STAGE_1, repairIceStage1 } from './stage1';
import { createIceInput, ICE_KEYBOARD_ACTIONS } from './input';
import { getAdventureStage, getRegionForGame } from '../adventureStageCatalog';
import { canPlayAdventureStage, normalizeAdventureStageProgress } from '../../utils/adventureStageProgress';
import { chargeMinigameEntry } from '../minigameConfig';

test('ice Stage 1 and implemented Stage 2 follow sequential progression and stay free', () => {
  const progress = normalizeAdventureStageProgress({});
  assert.equal(getRegionForGame('ice-operation-arcade'), 'iceContinent');
  assert.equal(getAdventureStage('iceContinent', 1).implemented, true);
  assert.equal(canPlayAdventureStage(progress, 'iceContinent', 1), true);
  assert.equal(getAdventureStage('iceContinent', 2).implemented, true);
  assert.equal(canPlayAdventureStage(progress, 'iceContinent', 2), false);
  assert.equal(canPlayAdventureStage(progress, 'iceContinent', 3), false);
  const stageOneComplete = normalizeAdventureStageProgress({ iceContinent: { completedStages: [1], visitedStages: [1] } });
  assert.equal(canPlayAdventureStage(stageOneComplete, 'iceContinent', 2), true);
  assert.equal(canPlayAdventureStage(stageOneComplete, 'iceContinent', 3), false);
  assert.equal(chargeMinigameEntry(10, 'ice-operation-arcade', 1), 10);
});

test('keyboard maps WASD and K/L to reusable actions with one press edge', () => {
  assert.deepEqual([ICE_KEYBOARD_ACTIONS.KeyW, ICE_KEYBOARD_ACTIONS.KeyA, ICE_KEYBOARD_ACTIONS.KeyS, ICE_KEYBOARD_ACTIONS.KeyD, ICE_KEYBOARD_ACTIONS.KeyK, ICE_KEYBOARD_ACTIONS.KeyL], ['up', 'left', 'down', 'right', 'actionA', 'actionB']);
  const input = createIceInput();
  input.set('keyboard', 'left', true);
  assert.equal(input.held('left'), true);
  input.set('touch', 'left', true);
  input.set('keyboard', 'left', false);
  assert.equal(input.held('left'), true);
  input.set('touch', 'left', false);
  assert.equal(input.held('left'), false);
  input.set('keyboard', 'actionA', true);
  input.set('keyboard', 'actionA', true);
  assert.equal(input.consumeActionA(), true);
  assert.equal(input.consumeActionA(), false);
  input.set('keyboard', 'actionA', false);
  input.set('keyboard', 'actionA', true);
  assert.equal(input.consumeActionA(), true);
  input.set('keyboard', 'actionB', true);
  input.set('keyboard', 'actionB', true);
  assert.equal(input.consumeActionB(), true);
  assert.equal(input.consumeActionB(), false);
});

test('touch directions stop on release and touch work has one press edge', () => {
  const input = createIceInput();
  for (const direction of ['up', 'left', 'down', 'right'] as const) {
    input.set('touch', direction, true);
    assert.equal(input.held(direction), true);
    input.set('touch', direction, false);
    assert.equal(input.held(direction), false);
  }
  input.set('touch', 'actionA', true);
  input.set('touch', 'actionA', true);
  assert.equal(input.consumeActionA(), true);
  assert.equal(input.consumeActionA(), false);
  input.set('touch', 'actionA', false);
});

test('v3 base has a 2.5-screen route, five machines and three ladders', () => {
  assert.equal(ICE_STAGE_1.worldWidth / ICE_STAGE_1.viewportWidth, 2.5);
  assert.equal(ICE_STAGE_1.machines.length, 5);
  assert.deepEqual(new Set(ICE_STAGE_1.machines.map(machine => machine.layer)), new Set(['lower', 'upper']));
  assert.equal(ICE_STAGE_1.ladders.length, 3);
  assert.equal(iceLadderAt(ICE_STAGE_1.ladders[0] + 60), ICE_STAGE_1.ladders[0]);
  assert.equal(iceLadderAt(ICE_STAGE_1.ladders[2] - 60), ICE_STAGE_1.ladders[2]);
  assert.equal(iceLadderAt(750), null);
});

test('one issue stops production, repair restarts it, and the issue sequence cycles', () => {
  let run = createIceStage1State();
  run = advanceIceStage1(run, ICE_STAGE_1.firstIssueAt);
  assert.ok(run.produced > 0);
  assert.equal(run.activeIssue, 'generator');
  const stoppedAt = run.produced;
  run = advanceIceStage1(run, 4);
  assert.equal(run.produced, stoppedAt);
  run = repairIceStage1(run);
  assert.equal(run.repaired, 1);
  run = advanceIceStage1(run, ICE_STAGE_1.secondsPerProduct);
  assert.ok(run.produced > stoppedAt);
  run = advanceIceStage1(run, ICE_STAGE_1.nextIssueDelay);
  assert.equal(run.activeIssue, 'conveyor');
});

test('long complete stoppage fails while repair can still lead to clear', () => {
  const stopped = advanceIceStage1(createIceStage1State(), ICE_STAGE_1.firstIssueAt);
  assert.equal(advanceIceStage1(stopped, ICE_STAGE_1.failureAfterStoppedSeconds).phase, 'failure');
  let run = createIceStage1State();
  for (let i = 0; i < 200 && run.phase === 'playing'; i += 1) {
    if (run.activeIssue || run.penguinAt) run = repairIceStage1(run);
    run = advanceIceStage1(run, .5);
  }
  assert.equal(run.phase, 'clear');
  assert.equal(run.produced, ICE_STAGE_1.target);
});

test('penguin is one serialized incident, slows production, and leaves on action A', () => {
  let run = createIceStage1State();
  for (let index = 0; index < 3; index += 1) {
    run = advanceIceStage1(run, run.nextIssueAt - run.elapsedSeconds, () => 0);
    assert.ok(run.activeIssue);
    run = repairIceStage1(run);
  }
  run = advanceIceStage1(run, run.nextIssueAt - run.elapsedSeconds, () => 0);
  assert.equal(run.activeIssue, null);
  assert.equal(run.penguinAt, 'relay');
  const produced = run.produced;
  run = advanceIceStage1({ ...run, productionProgress: 0 }, ICE_STAGE_1.secondsPerProduct);
  assert.equal(run.produced, produced);
  run = repairIceStage1(run);
  assert.equal(run.penguinAt, null);
  assert.equal(run.repaired, 4);
  run = advanceIceStage1({ ...run, productionProgress: 0 }, ICE_STAGE_1.secondsPerProduct);
  assert.equal(run.produced, produced + 1);
});
