import assert from 'node:assert/strict';
import test from 'node:test';
import { DEEP_SEA_STAGE_1_MAP, DEEP_SEA_STAGE_2_MAP, deepSeaTileKey, type DeepSeaMapConfig, type DeepSeaTilePoint } from '.';

function reachableFrom(map: DeepSeaMapConfig, start: DeepSeaTilePoint) {
  const visited = new Set([deepSeaTileKey(start)]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { column: current.column + dc, row: current.row + dr };
      const key = deepSeaTileKey(next);
      if (next.column < 0 || next.row < 0 || next.column >= map.columns || next.row >= map.rows || map.walls.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return visited;
}

test('deep sea Stage 1 map is a valid reachable 26x26 mockup', () => {
  const map = DEEP_SEA_STAGE_1_MAP;
  assert.equal(map.columns, 26);
  assert.equal(map.rows, 26);
  assert.equal(map.discoveries.length, 3);
  assert.equal(map.requiredDiscoveries, 2);
  assert.equal(new Set(map.discoveries.map(item => item.id)).size, 3);
  const reachable = reachableFrom(map, map.playerStart);
  assert.ok(reachable.has(deepSeaTileKey(map.exit)), 'exit reachable');
  map.discoveries.forEach(item => assert.ok(reachable.has(deepSeaTileKey(item)), `${item.id} reachable`));
  map.patrols.flatMap(patrol => patrol.points).forEach(point => assert.ok(reachable.has(deepSeaTileKey(point)), 'patrol point reachable'));
  assert.ok(reachable.size >= 400, 'map has enough explorable floor');
});

test('deep sea Stage 2 map is a connected 36x36 exploration mockup', () => {
  const map = DEEP_SEA_STAGE_2_MAP;
  assert.equal(map.columns, 36);
  assert.equal(map.rows, 36);
  assert.equal(map.cameraZoom, 1.2);
  assert.equal(map.visionRadiusTiles, 4.5);
  assert.equal(map.sonarUses, 3);
  assert.equal(map.patrols.length, 2);
  assert.equal(map.requiredDiscoveries, 3);
  assert.equal(map.patrols.find(enemy => enemy.kind === 'shark')?.behavior, 'chase');
  assert.equal(map.patrols.find(enemy => enemy.kind === 'octopus')?.behavior, 'ambush');
  assert.equal(map.pickups?.filter(item => item.kind === 'coin').length, 8);
  assert.equal(map.pickups?.filter(item => item.kind === 'smallChest').length, 2);
  assert.deepEqual(new Set(map.pickups?.filter(item => item.kind === 'repair' || item.kind === 'sonar').map(item => item.kind)), new Set(['repair', 'sonar']));
  const reachable = reachableFrom(map, map.playerStart);
  assert.ok(reachable.has(deepSeaTileKey(map.exit)), 'exit reachable');
  map.discoveries.forEach(item => assert.ok(reachable.has(deepSeaTileKey(item)), `${item.id} reachable`));
  map.patrols.flatMap(patrol => patrol.points).forEach(point => assert.ok(reachable.has(deepSeaTileKey(point)), 'patrol point reachable'));
  map.pickups?.forEach(item => assert.ok(reachable.has(deepSeaTileKey(item)), `${item.id} reachable`));
  assert.ok(reachable.size >= 500, 'larger map has enough connected explorable floor');
});
