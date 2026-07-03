import { rewardConfig, type CoinRewardMultiplier } from '../config/rewardConfig';
import type { GrowthSpeedMultiplier } from '../config/growthConfig';

export interface TrainingRewardInput {
  totalProblems: number;
  correctCount: number;
  wrongCount: number;
  selectedLevel: number;
  growthSpeedMultiplier: GrowthSpeedMultiplier;
  coinRewardMultiplier: CoinRewardMultiplier;
  activeDinosaurCondition?: {
    stamina: number;
  };
}

export interface TrainingRewardResult {
  baseCoins: number;
  coinRewardMultiplier: CoinRewardMultiplier;
  coins: number;
  baseDinoExp: number;
  growthSpeedMultiplier: GrowthSpeedMultiplier;
  /** Raw EXP points, not a percentage. */
  dinoExp: number;
  happiness: number;
  accuracy: number;
  rewardMultiplier: number;
  hatchItems: Array<{ itemId: string; quantity: number }>;
}

function getRewardMultiplier(accuracy: number) {
  if (accuracy >= 80) return 1;
  if (accuracy >= 50) return 0.8;
  return 0.6;
}

export function calculateTrainingRewards({ totalProblems, correctCount, wrongCount, growthSpeedMultiplier, coinRewardMultiplier }: TrainingRewardInput): TrainingRewardResult {
  const totalAttempts = correctCount + wrongCount;
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
  const rewardMultiplier = getRewardMultiplier(accuracy);
  const baseCoins = Math.max(0, Math.round((correctCount * 3 + 10) * rewardMultiplier));
  const adjustedCoins = Math.round(baseCoins * coinRewardMultiplier);
  const baseDinoExp = totalProblems > 0 ? rewardConfig.setComplete.dinoExp : 0;
  const adjustedDinoExp = Math.round(baseDinoExp * growthSpeedMultiplier);

  return {
    baseCoins,
    coinRewardMultiplier,
    coins: adjustedCoins,
    baseDinoExp,
    growthSpeedMultiplier,
    // Raw EXP points awarded once per completed set. Accuracy, per-answer
    // rewards, happiness, and item rewards must not alter this value.
    dinoExp: adjustedDinoExp,
    happiness: Math.max(0, Math.round(2 * rewardMultiplier)),
    accuracy,
    rewardMultiplier,
    hatchItems: [
      {
        itemId: rewardConfig.hatchItemRewardOnSetComplete,
        quantity: rewardConfig.hatchItemQuantityOnSetComplete,
      },
    ],
  };
}
