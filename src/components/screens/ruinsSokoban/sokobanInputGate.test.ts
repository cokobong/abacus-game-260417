import assert from 'node:assert/strict';
import test from 'node:test';
import { SokobanInputGate } from './sokobanInputGate';

test('mission transition resets completion and movement locks so a second input is accepted', () => {
  const gate = new SokobanInputGate();

  gate.resetForMission();
  gate.setEnabled(true);
  gate.startMovement();
  gate.finishMovement();
  gate.lockForCompletion();
  assert.equal(gate.canMove(), false);

  gate.resetForMission();
  gate.setEnabled(true);
  assert.equal(gate.canMove(), true, 'first input after transition');
  gate.startMovement();
  gate.finishMovement();
  assert.equal(gate.canMove(), true, 'second input after transition');
});
