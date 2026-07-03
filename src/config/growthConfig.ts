import type { DinosaurGrowthStage } from '../types/game';

export type GrowthSpeedMultiplier = 0.7 | 1 | 1.3;

export const growthSpeedOptions: Array<{ value: GrowthSpeedMultiplier; label: string; percent: number }> = [
  { value: 0.7, label: '느리게', percent: 70 },
  { value: 1, label: '보통', percent: 100 },
  { value: 1.3, label: '빠르게', percent: 130 },
];

export const defaultGrowthSpeedMultiplier: GrowthSpeedMultiplier = 1;

export interface GrowthConfig {
  version: string;
  baseMaxStamina: number;
  maxStaminaPerLevel: number;
  defaultHappiness: number;
  defaultStamina: number;
  statBounds: {
    happiness: { min: number; max: number };
    stamina: { min: number; max: number };
  };
  staminaRecoveryMultiplierByHappiness: Array<{
    minHappiness: number;
    multiplier: number;
  }>;
  growthStageByLevel: Array<{
    stage: DinosaurGrowthStage;
    minLevel: number;
    label: string;
    reaction: string;
  }>;
}

export const growthConfig: GrowthConfig = {
  version: '2026-06-25.1',
  baseMaxStamina: 100,
  maxStaminaPerLevel: 2,
  defaultHappiness: 70,
  defaultStamina: 100,
  statBounds: {
    happiness: { min: 0, max: 100 },
    stamina: { min: 0, max: 100 },
  },
  staminaRecoveryMultiplierByHappiness: [
    { minHappiness: 90, multiplier: 1.3 },
    { minHappiness: 70, multiplier: 1.2 },
    { minHappiness: 40, multiplier: 1.1 },
    { minHappiness: 0, multiplier: 1 },
  ],
  growthStageByLevel: [
    { stage: 'adult', minLevel: 20, label: '어른', reaction: '멋진 공룡으로 자랐어요!' },
    { stage: 'teen', minLevel: 10, label: '청소년', reaction: '이제 더 멀리 모험 갈 수 있어요!' },
    { stage: 'child', minLevel: 5, label: '어린이', reaction: '나 조금 더 컸어요!' },
    { stage: 'baby', minLevel: 1, label: '아기', reaction: '아직 작지만 씩씩하게 자라고 있어요!' },
  ],
};

