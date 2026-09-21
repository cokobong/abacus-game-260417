export type SkyLaneDifficulty = 'easy' | 'normal' | 'challenge';

export interface SkyObstacleLaneState {
  recent: number[];
  lastDirection: -1 | 0 | 1;
  consecutiveSame: number;
}

export const SKY_OBSTACLE_RECENT_LANE_COUNT = 3;
export const SKY_OBSTACLE_MAX_SAME_LANE = 2;

export function createSkyObstacleLaneState(): SkyObstacleLaneState {
  return { recent: [], lastDirection: 0, consecutiveSame: 0 };
}

const repeatWeights: Record<SkyLaneDifficulty, number> = { easy: .23, normal: .15, challenge: .12 };

export function selectSkyObstacleLane(
  difficulty: SkyLaneDifficulty,
  laneCount: number,
  state: SkyObstacleLaneState,
  excluded: ReadonlySet<number> = new Set(),
  random: () => number = Math.random,
) {
  const lastLane = state.recent.at(-1);
  const previousLane = state.recent.at(-2);
  const candidates = Array.from({ length: laneCount }, (_, lane) => lane).filter((lane) => !excluded.has(lane));
  const weights = candidates.map((lane) => {
    if (lastLane === undefined) return 1;
    if (lane === lastLane && state.consecutiveSame >= SKY_OBSTACLE_MAX_SAME_LANE) return 0;
    const delta = Math.abs(lane - lastLane);
    let weight = lane === lastLane ? repeatWeights[difficulty] : difficulty === 'easy' ? (delta === 1 ? 1.6 : .9) : difficulty === 'normal' ? (delta === 1 ? 1.15 : 1) : (delta <= 2 ? 1.25 : .8);
    if (state.lastDirection !== 0 && lane !== lastLane && Math.sign(lane - lastLane) === -state.lastDirection) weight *= difficulty === 'easy' ? 1.2 : 1.5;
    const recentUses = state.recent.filter((recentLane) => recentLane === lane).length;
    weight *= Math.max(.45, 1 - recentUses * (difficulty === 'challenge' ? .24 : .16));
    if (previousLane !== undefined && lane === previousLane) weight *= .82;
    return weight;
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  const lane = candidates.find((_, index) => ((roll -= weights[index]) <= 0)) ?? candidates.at(-1) ?? 0;
  const direction = lastLane === undefined ? 0 : Math.sign(lane - lastLane) as -1 | 0 | 1;
  state.consecutiveSame = lane === lastLane ? state.consecutiveSame + 1 : 1;
  if (direction !== 0) state.lastDirection = direction;
  state.recent = [...state.recent, lane].slice(-SKY_OBSTACLE_RECENT_LANE_COUNT);
  return lane;
}

export function createSkyObstacleWave(
  difficulty: SkyLaneDifficulty,
  laneCount: number,
  obstacleCount: number,
  state: SkyObstacleLaneState,
  random: () => number = Math.random,
) {
  const maxBlocked = difficulty === 'challenge' ? Math.max(1, laneCount - 2) : Math.max(1, laneCount - 1);
  const lanes: number[] = [];
  const occupied = new Set<number>();
  for (let index = 0; index < Math.min(obstacleCount, maxBlocked); index += 1) {
    const lane = selectSkyObstacleLane(difficulty, laneCount, state, occupied, random);
    lanes.push(lane);
    occupied.add(lane);
  }
  return lanes;
}
