import assert from 'node:assert/strict';
import test from 'node:test';
import { canActivateSkyBoost, resolveSkyObstacleCollision, SKY_BOOST_COOLDOWN_MS, SKY_BOOST_DURATION_MS } from './skyBoost';

test('sky boost lasts 1.8 seconds and keeps an 8 second cooldown', () => {
  assert.equal(SKY_BOOST_DURATION_MS, 1800);
  assert.equal(SKY_BOOST_COOLDOWN_MS, 8000);
  assert.equal(canActivateSkyBoost(7999, 8000), false);
  assert.equal(canActivateSkyBoost(8000, 8000), true);
});

test('an active sky boost cancels and consumes exactly one obstacle collision', () => {
  assert.deepEqual(resolveSkyObstacleCollision(true), { blocked: true, damage: 0, consumeBoost: true });
  assert.deepEqual(resolveSkyObstacleCollision(false), { blocked: false, damage: 1, consumeBoost: false });
});
