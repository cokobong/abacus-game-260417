import assert from 'node:assert/strict';
import test from 'node:test';
import { ADVENTURE_HEALTH_RESTORE_ID, applyHealthRestore, shouldSpawnHealthRestore } from './adventureCollectibles';

test('공용 생명력 회복 아이템은 최대 체력을 넘지 않고 한 칸 회복한다', () => {
  assert.equal(ADVENTURE_HEALTH_RESTORE_ID, 'health_restore');
  assert.equal(applyHealthRestore(1, 3), 2);
  assert.equal(applyHealthRestore(2, 3), 3);
  assert.equal(applyHealthRestore(3, 3), 3);
});

test('생명력 회복 아이템은 피해 상태이며 아직 등장하지 않았을 때만 추첨한다', () => {
  assert.equal(shouldSpawnHealthRestore(3, 3, false, () => 0), false);
  assert.equal(shouldSpawnHealthRestore(2, 3, true, () => 0), false);
  assert.equal(shouldSpawnHealthRestore(2, 3, false, () => 0.11), true);
  assert.equal(shouldSpawnHealthRestore(2, 3, false, () => 0.12), false);
});
