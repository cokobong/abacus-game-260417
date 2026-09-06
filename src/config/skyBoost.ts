export const SKY_BOOST_DURATION_MS = 1800;
export const SKY_BOOST_COOLDOWN_MS = 8000;

export function canActivateSkyBoost(now: number, readyAt: number) {
  return now >= readyAt;
}

export function resolveSkyObstacleCollision(boostActive: boolean) {
  return boostActive
    ? { blocked: true, damage: 0, consumeBoost: true }
    : { blocked: false, damage: 1, consumeBoost: false };
}
