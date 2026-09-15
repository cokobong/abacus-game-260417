export const SKY_COLLECTIBLE_OBSTACLE_MIN_SPAWN_GAP = 18;

export type SkySpawnReservation = { lane: number; x: number; obstacle: boolean };

export function hasSkySpawnConflict(candidate: SkySpawnReservation, reservations: readonly SkySpawnReservation[], minGap = SKY_COLLECTIBLE_OBSTACLE_MIN_SPAWN_GAP) {
  return reservations.some(reservation => reservation.lane === candidate.lane && reservation.obstacle !== candidate.obstacle && Math.abs(reservation.x - candidate.x) < minGap);
}

export function findSkySafeCollectibleSpawn(preferredLane: number, laneCount: number, preferredX: number, reservations: readonly SkySpawnReservation[]) {
  const lanes = [preferredLane, ...Array.from({ length: laneCount }, (_, lane) => lane).filter(lane => lane !== preferredLane)];
  const xPositions = [preferredX, preferredX + SKY_COLLECTIBLE_OBSTACLE_MIN_SPAWN_GAP, preferredX + SKY_COLLECTIBLE_OBSTACLE_MIN_SPAWN_GAP * 2];
  for (const x of xPositions) for (const lane of lanes) {
    const candidate = { lane, x, obstacle: false };
    if (!hasSkySpawnConflict(candidate, reservations)) return candidate;
  }
  return { lane: preferredLane, x: preferredX + SKY_COLLECTIBLE_OBSTACLE_MIN_SPAWN_GAP * 3, obstacle: false };
}
