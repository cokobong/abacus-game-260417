import assert from 'node:assert/strict';
import test from 'node:test';
import { createSkyObstacleLaneState, createSkyObstacleWave, selectSkyObstacleLane } from './skyObstacleLanes';

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

test('하늘섬 obstacle lane은 동일 lane이 3번 연속되지 않는다', () => {
  const state = createSkyObstacleLaneState(), random = seededRandom(7), lanes: number[] = [];
  for (let index = 0; index < 1000; index += 1) lanes.push(selectSkyObstacleLane('normal', 3, state, new Set(), random));
  assert.equal(lanes.some((lane, index) => lane === lanes[index - 1] && lane === lanes[index - 2]), false);
});

test('도전 wave는 5개 lane을 모두 사용하고 항상 2개 이상의 safe lane을 남긴다', () => {
  const state = createSkyObstacleLaneState(), random = seededRandom(19), usage = [0, 0, 0, 0, 0];
  for (let index = 0; index < 1000; index += 1) {
    const lanes = createSkyObstacleWave('challenge', 5, index % 3 + 1, state, random);
    assert.ok(new Set(lanes).size <= 3);
    lanes.forEach((lane) => { usage[lane] += 1; });
  }
  usage.forEach((count) => assert.ok(count > 300 && count < 500, `lane usage ${usage.join(',')}`));
});
