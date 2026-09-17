import assert from 'node:assert/strict';
import test from 'node:test';
import { ARCADE_STAGE_2 as board, arcadeIsFloor, arcadeKey, arcadeNeighbors, arcadeNextStep, type ArcadePoint } from './arcadeStage2';

test('Stage 2 arcade board keeps objectives, exit, pickups and enemies reachable', () => {
  assert.equal(board.columns, 22);
  assert.equal(board.rows, 22);
  assert.equal(board.tileSize, 56, 'walkable corridor grows from 48px to 56px');
  assert.equal(board.treasures.length, 3);
  assert.equal(board.enemyStarts.length, 3);
  const queue = [board.playerStart];
  const visited = new Set([arcadeKey(board.playerStart)]);
  for (let head = 0; head < queue.length; head += 1) for (const neighbor of arcadeNeighbors(queue[head])) {
    const key = arcadeKey(neighbor);
    if (!visited.has(key)) { visited.add(key); queue.push(neighbor); }
  }
  for (const point of [board.exit, ...board.treasures, ...board.orbs, ...board.coins, ...board.enemyStarts]) {
    assert.ok(visited.has(arcadeKey(point)), `${arcadeKey(point)} reachable`);
  }
  assert.equal(visited.size, board.floor.size, 'no isolated floor');
});

test('enemy shortest-path step never crosses a wall', () => {
  for (const enemy of board.enemyStarts) {
    let current: ArcadePoint = { column: enemy.column, row: enemy.row };
    for (let moves = 0; moves < board.floor.size && arcadeKey(current) !== arcadeKey(board.playerStart); moves += 1) {
      const next = arcadeNextStep(current, board.playerStart);
      assert.ok(arcadeIsFloor(next));
      assert.ok(arcadeNeighbors(current).some(point => arcadeKey(point) === arcadeKey(next)));
      current = next;
    }
    assert.equal(arcadeKey(current), arcadeKey(board.playerStart));
  }
});
