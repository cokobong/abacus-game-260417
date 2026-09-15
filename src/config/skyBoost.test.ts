import assert from 'node:assert/strict';
import test from 'node:test';
import { canActivateSkyBoost, getSkyLightningInterval, getSkyLightningRenderX, getSkyLightningTargetLanes, resolveSkyObstacleCollision, SKY_BOOST_COOLDOWN_MS, SKY_BOOST_DURATION_MS, SKY_LIGHTNING_STRIKE_MS, SKY_LIGHTNING_TRIGGER_DISTANCE_PX, SKY_LIGHTNING_WARNING_MS } from './skyBoost';

test('sky shield lasts 4 seconds and keeps its cooldown', () => {
  assert.equal(SKY_BOOST_DURATION_MS, 4000);
  assert.equal(SKY_BOOST_COOLDOWN_MS, 8000);
  assert.equal(canActivateSkyBoost(7999, 8000), false);
  assert.equal(canActivateSkyBoost(8000, 8000), true);
});

test('an active sky boost blocks collisions without ending at the first hit', () => {
  assert.deepEqual(resolveSkyObstacleCollision(true), { blocked: true, damage: 0, consumeBoost: false });
  assert.deepEqual(resolveSkyObstacleCollision(false), { blocked: false, damage: 1, consumeBoost: false });
});

test('lightning intervals follow each Stage target range', () => {
  assert.equal(getSkyLightningInterval(2, 'normal', () => 0), 12000);
  assert.equal(getSkyLightningInterval(2, 'normal', () => 1), 18000);
  assert.equal(getSkyLightningInterval(3, 'normal', () => 0), 8000);
  assert.equal(getSkyLightningInterval(3, 'hard', () => 1), 10000);
});

test('lightning cloud uses proximity timing and Stage-specific target lanes', () => {
  assert.equal(SKY_LIGHTNING_TRIGGER_DISTANCE_PX, 220);
  assert.equal(SKY_LIGHTNING_WARNING_MS, 700);
  assert.equal(SKY_LIGHTNING_STRIKE_MS, 360);
  assert.deepEqual(getSkyLightningTargetLanes(2, 'hard', 2, 5), [2]);
  assert.deepEqual(getSkyLightningTargetLanes(3, 'normal', 2, 5, () => 1), [2, 3]);
  assert.deepEqual(getSkyLightningTargetLanes(3, 'hard', 2, 5), [1, 2, 3]);
  assert.deepEqual(getSkyLightningTargetLanes(3, 'hard', 0, 5), [0, 1]);
});

test('lightning warning follows its cloud but strike renders on the fixed player X line', () => {
  assert.equal(getSkyLightningRenderX(54, 'idle', 26), 54);
  assert.equal(getSkyLightningRenderX(54, 'warning', 26), 54);
  assert.equal(getSkyLightningRenderX(54, 'striking', 26), 26);
  assert.equal(getSkyLightningRenderX(54, 'done', 26), 26);
});
