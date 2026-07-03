import { growthConfig } from '../config/growthConfig';
import type { DinosaurGrowthStage, OwnedDinosaur } from '../types/game';

export function getExpToNextLevel(level: number) {
  return 20 + Math.max(1, level) * 5;
}

export function getGrowthStageForLevel(level: number): DinosaurGrowthStage {
  return growthConfig.growthStageByLevel.find((stage) => level >= stage.minLevel)?.stage ?? 'baby';
}

export function getGrowthStageLabel(stage: DinosaurGrowthStage) {
  return growthConfig.growthStageByLevel.find((entry) => entry.stage === stage)?.label ?? '아기';
}

export function getGrowthStageReaction(stage: DinosaurGrowthStage) {
  return growthConfig.growthStageByLevel.find((entry) => entry.stage === stage)?.reaction ?? '조금씩 자라고 있어요!';
}

export function getMaxStaminaForLevel(level: number) {
  return growthConfig.baseMaxStamina + Math.max(0, level - 1) * growthConfig.maxStaminaPerLevel;
}

export function getStaminaRecoveryMultiplier(happiness: number) {
  return growthConfig.staminaRecoveryMultiplierByHappiness.find((entry) => happiness >= entry.minHappiness)?.multiplier ?? 1;
}

export function getAdjustedStaminaRecovery(baseRecovery: number, happiness: number) {
  return Math.round(baseRecovery * getStaminaRecoveryMultiplier(happiness));
}

// Dinosaur EXP is stored as raw points. Percentages are derived only by UI
// meters as rawExp / expToNextLevel * 100.
export function applyDinosaurExp(dinosaur: OwnedDinosaur, gainedRawExp: number): OwnedDinosaur {
  let level = Math.max(1, dinosaur.level ?? 1);
  let rawExp = Math.max(0, (dinosaur.exp ?? 0) + gainedRawExp);
  let expToNextLevel = dinosaur.expToNextLevel ?? getExpToNextLevel(level);

  while (rawExp >= expToNextLevel) {
    rawExp -= expToNextLevel;
    level += 1;
    expToNextLevel = getExpToNextLevel(level);
  }

  const maxStamina = getMaxStaminaForLevel(level);

  return {
    ...dinosaur,
    level,
    exp: rawExp,
    expToNextLevel,
    growthStage: getGrowthStageForLevel(level),
    maxStamina,
    stamina: clampStat(dinosaur.stamina ?? growthConfig.defaultStamina, 0, maxStamina),
  };
}

export function clampHappiness(value: number) {
  return clampStat(value, growthConfig.statBounds.happiness.min, growthConfig.statBounds.happiness.max);
}

export function clampStamina(value: number, maxStamina = growthConfig.statBounds.stamina.max) {
  return clampStat(value, growthConfig.statBounds.stamina.min, maxStamina);
}

function clampStat(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

