import type { AdventureDifficulty } from './adventureMinigameEconomy';
import type { AdventureStageNumber } from './adventureStageCatalog';

export const SKY_BIRD_SPAWN_CHANCE: Record<AdventureStageNumber, Record<AdventureDifficulty, number>> = {
  1: { normal: .06, hard: .1 },
  2: { normal: .34, hard: .44 },
  3: { normal: .39, hard: .68 },
};

export type SkyBirdPattern = 'single' | 'same-lane' | 'adjacent' | 'zigzag';

export function createSkyBirdPattern(stage: AdventureStageNumber, difficulty: AdventureDifficulty, laneCount: number, random: () => number = Math.random) {
  if (random() >= SKY_BIRD_SPAWN_CHANCE[stage][difficulty]) return null;
  const startLane = Math.min(laneCount - 1, Math.floor(random() * laneCount));
  if (stage === 1) return { kind: 'single' as const, lanes: [startLane] };
  const maxCount = stage === 3 && difficulty === 'hard' ? 3 : 2;
  const count = maxCount === 3 && random() < .48 ? 3 : random() < .72 ? 2 : 1;
  if (count === 1) return { kind: 'single' as const, lanes: [startLane] };
  const patternRoll = random();
  if (patternRoll < .3) return { kind: 'same-lane' as const, lanes: Array.from({ length: count }, () => startLane) };
  const direction = startLane >= laneCount - 1 ? -1 : startLane <= 0 ? 1 : random() < .5 ? -1 : 1;
  if (patternRoll < .7) return { kind: 'adjacent' as const, lanes: Array.from({ length: count }, (_, index) => Math.max(0, Math.min(laneCount - 1, startLane + direction * index))) };
  return { kind: 'zigzag' as const, lanes: Array.from({ length: count }, (_, index) => index % 2 === 0 ? startLane : Math.max(0, Math.min(laneCount - 1, startLane + direction))) };
}
