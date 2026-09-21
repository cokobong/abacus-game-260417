import assert from 'node:assert/strict';
import test from 'node:test';
import { arcadeKey, arcadeNeighbors, arcadeNextStep } from './arcadeStage2';
import { DEEP_SEA_STAGES } from './arcadeStages';

test('tutorial missions have distinct reachable goals and reuse the corridor path rules', () => {
  const one = DEEP_SEA_STAGES['1-1'];
  const two = DEEP_SEA_STAGES['1-2'];
  const three = DEEP_SEA_STAGES['1-3'];
  assert.equal(one.board.enemyStarts.length, 0);
  assert.equal(one.board.orbs.length, 0);
  assert.equal(one.board.treasures.length, 0);
  assert.ok(one.board.coins.length >= one.coinGoal);
  assert.equal(two.board.enemyStarts.length, 1);
  assert.equal(two.board.enemyStarts[0].kind, 'shark');
  assert.ok(two.board.orbs.length >= 1);
  assert.equal(two.board.treasures.length, 0);
  assert.deepEqual(three.board.enemyStarts.map(enemy => enemy.kind), ['shark', 'octopus']);
  assert.equal(three.board.treasures.length, 3);

  for (const mission of [one, two, three]) {
    const { board } = mission;
    const queue = [board.playerStart];
    const visited = new Set([arcadeKey(board.playerStart)]);
    for (let head = 0; head < queue.length; head += 1) for (const neighbor of arcadeNeighbors(queue[head], board.floor)) {
      const key = arcadeKey(neighbor);
      if (!visited.has(key)) { visited.add(key); queue.push(neighbor); }
    }
    assert.equal(visited.size, board.floor.size, `${mission.id}: isolated floor`);
    for (const goal of [board.exit, ...board.coins, ...board.orbs, ...board.treasures, ...board.enemyStarts]) {
      assert.ok(visited.has(arcadeKey(goal)), `${mission.id}: ${arcadeKey(goal)} reachable`);
      if (arcadeKey(goal) !== arcadeKey(board.playerStart)) {
        const step = arcadeNextStep(board.playerStart, goal, board.floor);
        assert.ok(arcadeNeighbors(board.playerStart, board.floor).some(neighbor => arcadeKey(neighbor) === arcadeKey(step)));
      }
    }
  }
});
