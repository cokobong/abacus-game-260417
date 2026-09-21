import type { AdventureDifficulty } from './adventureMinigameEconomy';

export const SKY_STORM_ROCK_SPAWN_CHANCE: Record<AdventureDifficulty, number> = { normal: .215, hard: .52 };
export const SKY_STORM_ROCK_WAVE_AMPLITUDE: Record<AdventureDifficulty, number> = { normal: 5, hard: 11 };
export const SKY_STORM_ROCK_SPEED_MULTIPLIER: Record<AdventureDifficulty, number> = { normal: .95, hard: 1.08 };
export const SKY_STORM_ROCK_TRACKING_STRENGTH: Record<AdventureDifficulty, number> = { normal: .72, hard: .88 };
export const SKY_STAGE_3_NORMAL_INTERVAL_MULTIPLIER = 1.25;
export const SKY_STAGE_3_NORMAL_DANGER_REST_MS = 1200;
export const SKY_STAGE_3_NORMAL_SEQUENCE_GAP = 15;

export function getSkyStormRockMotion(elapsedMs: number, seed: number, amplitude: number) {
  const phase = elapsedMs / 420 + seed * 1.7;
  return { yOffset: Math.sin(phase) * amplitude, rotation: (elapsedMs / 5 + seed * 47) % 360 };
}

export function getSkyStormRockTrackingY(spawnY: number, playerY: number, x: number, spawnX: number, playerX: number, strength: number) {
  const approach = Math.max(0, Math.min(1, (spawnX - x) / (spawnX - playerX)));
  return spawnY + (playerY - spawnY) * approach * strength;
}
