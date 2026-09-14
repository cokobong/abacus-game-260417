import assert from 'node:assert/strict';
import test from 'node:test';
import { getSkyStormRockMotion, getSkyStormRockTrackingY, SKY_STAGE_3_NORMAL_DANGER_REST_MS, SKY_STAGE_3_NORMAL_INTERVAL_MULTIPLIER, SKY_STAGE_3_NORMAL_SEQUENCE_GAP, SKY_STORM_ROCK_SPAWN_CHANCE, SKY_STORM_ROCK_SPEED_MULTIPLIER, SKY_STORM_ROCK_TRACKING_STRENGTH, SKY_STORM_ROCK_WAVE_AMPLITUDE } from './skyStormRock';

test('storm rocks are tuned for Stage 3 normal and hard patterns', () => {
  assert.ok(SKY_STORM_ROCK_SPAWN_CHANCE.hard > SKY_STORM_ROCK_SPAWN_CHANCE.normal);
  assert.ok(SKY_STORM_ROCK_WAVE_AMPLITUDE.hard > SKY_STORM_ROCK_WAVE_AMPLITUDE.normal);
  assert.equal(SKY_STORM_ROCK_SPAWN_CHANCE.normal, .215);
  assert.equal(SKY_STORM_ROCK_SPEED_MULTIPLIER.normal, .95);
  assert.ok(SKY_STORM_ROCK_TRACKING_STRENGTH.hard > SKY_STORM_ROCK_TRACKING_STRENGTH.normal);
  assert.equal(SKY_STAGE_3_NORMAL_INTERVAL_MULTIPLIER, 1.25);
  assert.equal(SKY_STAGE_3_NORMAL_DANGER_REST_MS, 1200);
  assert.equal(SKY_STAGE_3_NORMAL_SEQUENCE_GAP, 15);
});

test('storm rock moves vertically toward the player as it approaches', () => {
  assert.equal(getSkyStormRockTrackingY(20, 60, 130, 130, 26, .75), 20);
  assert.equal(getSkyStormRockTrackingY(20, 60, 78, 130, 26, .75), 35);
  assert.equal(getSkyStormRockTrackingY(20, 60, 26, 130, 26, .75), 50);
});

test('storm rock motion stays inside its visual wave and rotates over time', () => {
  const start = getSkyStormRockMotion(0, 2, 8);
  const later = getSkyStormRockMotion(500, 2, 8);
  assert.ok(Math.abs(start.yOffset) <= 8 && Math.abs(later.yOffset) <= 8);
  assert.notEqual(start.rotation, later.rotation);
});
