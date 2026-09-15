import assert from 'node:assert/strict';
import test from 'node:test';
import { findSkySafeCollectibleSpawn, hasSkySpawnConflict, SKY_COLLECTIBLE_OBSTACLE_MIN_SPAWN_GAP } from './skySpawnSafety';

test('coin and obstacle reservations conflict in either insertion order', () => {
  const obstacle = { lane: 2, x: 120, obstacle: true };
  const coin = { lane: 2, x: 125, obstacle: false };
  assert.equal(hasSkySpawnConflict(coin, [obstacle]), true);
  assert.equal(hasSkySpawnConflict(obstacle, [coin]), true);
  assert.equal(hasSkySpawnConflict({ ...coin, lane: 1 }, [obstacle]), false);
});

test('collectible spawn moves away from a reserved obstacle zone', () => {
  const spawn = findSkySafeCollectibleSpawn(2, 5, 116, [{ lane: 2, x: 122, obstacle: true }]);
  assert.ok(spawn.lane !== 2 || Math.abs(spawn.x - 122) >= SKY_COLLECTIBLE_OBSTACLE_MIN_SPAWN_GAP);
  assert.equal(SKY_COLLECTIBLE_OBSTACLE_MIN_SPAWN_GAP, 18);
});
