import assert from 'node:assert/strict';
import test from 'node:test';
import { arcadeKey } from './arcadeStage2';
import { canJellyfishHold, createStage3Config, getStage3GateState, STAGE_3_SETTINGS, STAGE_3_TEMPLATES, validateStage3Board } from './arcadeStage3';

test('Stage 3 selects all four validated templates without overlapping spawns', () => {
  const selected = new Set<string>();
  for (let index = 0; index < 120; index += 1) {
    const seed = `stage3-run-${index}`;
    const config = createStage3Config(seed);
    selected.add(config.templateId!);
    assert.equal(config.board.columns, 26);
    assert.equal(config.board.rows, 26);
    assert.equal(config.board.treasures.length, 3);
    assert.deepEqual(config.board.enemyStarts.map(enemy => enemy.kind), ['shark', 'octopus', 'jellyfish']);
    assert.deepEqual(validateStage3Board(config.board), [], seed);
    assert.deepEqual(createStage3Config(seed).board.treasures.map(arcadeKey), config.board.treasures.map(arcadeKey), 'run seed is stable');
  }
  assert.deepEqual(selected, new Set(STAGE_3_TEMPLATES.map(template => template.id)));
});

test('closed gates preserve required routes and validation rejects occupied gate tiles', () => {
  const board = createStage3Config('gate-check').board;
  assert.deepEqual(validateStage3Board(board), []);
  const gate = board.gates![0];
  const invalid = { ...board, treasures: [{ ...board.treasures[0], column: gate.column, row: gate.row }, ...board.treasures.slice(1)] };
  assert.ok(validateStage3Board(invalid).some(issue => issue.includes('gate overlaps')));
});

test('gate cycle gives warning before blocking and reopens', () => {
  const gate = createStage3Config('gate-cycle').board.gates![0];
  assert.equal(getStage3GateState({ ...gate, phaseMs: 0 }, 0), 'OPEN');
  assert.equal(getStage3GateState({ ...gate, phaseMs: 0 }, gate.openMs), 'WARNING');
  assert.equal(getStage3GateState({ ...gate, phaseMs: 0 }, gate.openMs + gate.warningMs), 'CLOSED');
  assert.equal(getStage3GateState({ ...gate, phaseMs: 0 }, gate.openMs + gate.warningMs + gate.closedMs), 'OPEN');
  assert.equal(boardGateCount(), STAGE_3_SETTINGS.gateCount);
});

function boardGateCount() { return createStage3Config('gate-count').board.gates?.length; }

test('jellyfish hold respects power, current hold, and recontact grace', () => {
  assert.equal(STAGE_3_SETTINGS.jellyfishHoldDurationMs, 1800);
  assert.equal(STAGE_3_SETTINGS.jellyfishRecontactGraceMs, 400);
  assert.equal(canJellyfishHold(1000, 1500, 0, 0, false), false, 'powered player cannot be held');
  assert.equal(canJellyfishHold(1000, 0, 1300, 0, false), false, 'hold cannot restart while active');
  assert.equal(canJellyfishHold(1000, 0, 0, 1200, false), false, 'grace blocks immediate recontact');
  assert.equal(canJellyfishHold(1200, 0, 0, 1200, true), false, 'continuous contact does not retrigger');
  assert.equal(canJellyfishHold(1200, 0, 0, 1200, false), true, 'a new contact after grace can hold');
});
