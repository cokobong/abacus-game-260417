export const SKY_BOOST_DURATION_MS = 4000;
export const SKY_BOOST_COOLDOWN_MS = 8000;

export const SKY_LIGHTNING_INTERVALS_MS = {
  1: { normal: [28000, 38000], hard: [22000, 32000] },
  2: { normal: [12000, 18000], hard: [11000, 16000] },
  3: { normal: [8000, 13000], hard: [6000, 10000] },
} as const;
export const SKY_LIGHTNING_GAMEPLAY_ENABLED = false;

export const SKY_LIGHTNING_TRIGGER_DISTANCE_PX = 220;
export const SKY_LIGHTNING_WARNING_MS = 700;
export const SKY_LIGHTNING_STRIKE_MS = 360;
export const SKY_LIGHTNING_IMPACT_MS = 180;

export function getSkyLightningInterval(stage: 1 | 2 | 3, difficulty: 'normal' | 'hard', random: () => number = Math.random) {
  const [min, max] = SKY_LIGHTNING_INTERVALS_MS[stage][difficulty];
  return min + (max - min) * random();
}

export function getSkyLightningTargetLanes(stage: 1 | 2 | 3, difficulty: 'normal' | 'hard', cloudLane: number, laneCount: number, random: () => number = Math.random) {
  const lanes = new Set([cloudLane]);
  if (stage === 3 && difficulty === 'hard') {
    if (cloudLane > 0) lanes.add(cloudLane - 1);
    if (cloudLane < laneCount - 1) lanes.add(cloudLane + 1);
  } else if (stage === 3) {
    const preferred = random() < .5 ? cloudLane - 1 : cloudLane + 1;
    const fallback = preferred < 0 ? cloudLane + 1 : preferred >= laneCount ? cloudLane - 1 : preferred;
    if (fallback >= 0 && fallback < laneCount) lanes.add(fallback);
  }
  return [...lanes].sort((a, b) => a - b);
}

export function getSkyLightningRenderX(cloudX: number, phase: 'idle' | 'warning' | 'striking' | 'done' | undefined, playerFixedX: number) {
  return phase === 'striking' || phase === 'done' ? playerFixedX : cloudX;
}

export function canActivateSkyBoost(now: number, readyAt: number) {
  return now >= readyAt;
}

export function resolveSkyObstacleCollision(boostActive: boolean) {
  return boostActive
    ? { blocked: true, damage: 0, consumeBoost: false }
    : { blocked: false, damage: 1, consumeBoost: false };
}
