import assert from 'node:assert/strict';
import test from 'node:test';
import { createSkyBirdPattern, SKY_BIRD_SPAWN_CHANCE } from './skyBirdPatterns';

test('bird flock weight rises by Stage and hard difficulty', () => {
  assert.ok(SKY_BIRD_SPAWN_CHANCE[1].normal < SKY_BIRD_SPAWN_CHANCE[2].normal);
  assert.ok(SKY_BIRD_SPAWN_CHANCE[2].normal < SKY_BIRD_SPAWN_CHANCE[3].normal);
  assert.ok(SKY_BIRD_SPAWN_CHANCE[3].hard > SKY_BIRD_SPAWN_CHANCE[3].normal);
  assert.equal(SKY_BIRD_SPAWN_CHANCE[3].normal, .39);
});

test('Stage 1 stays single while Stage 3 hard can create three-flock lane patterns', () => {
  const stage1Rolls = [0, .4]; let stage1Index = 0;
  assert.deepEqual(createSkyBirdPattern(1, 'normal', 3, () => stage1Rolls[stage1Index++] ?? 0), { kind: 'single', lanes: [1] });
  const stage3Rolls = [0, .4, 0, .5, .2, .9]; let stage3Index = 0;
  const pattern = createSkyBirdPattern(3, 'hard', 5, () => stage3Rolls[stage3Index++] ?? 0);
  assert.equal(pattern?.lanes.length, 3);
  assert.ok(pattern?.lanes.every(lane => lane >= 0 && lane < 5));
});
