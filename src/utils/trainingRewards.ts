import type { CoinRewardMultiplier } from '../config/rewardConfig';

export interface TrainingRewardInput {
  totalProblems: number;
  correctCount: number;
  wrongCount: number;
  numberCount: number;
  selectedLevel: number;
  coinRewardMultiplier: CoinRewardMultiplier;
  activeDinosaurCondition?: {
    stamina: number;
  };
}

export interface TrainingRewardResult {
  numberCount: number;
  numberCountRewardMultiplier: number;
  baseCoins: number;
  coinRewardMultiplier: CoinRewardMultiplier;
  coins: number;
  happiness: number;
  accuracy: number;
  rewardMultiplier: number;
  hatchItems: Array<{ itemId: string; quantity: number }>;
}

export const NUMBER_COUNT_REWARD_MULTIPLIERS: Readonly<Record<number, number>> = {
  3: 1,
  4: 1.2,
  5: 1.5,
  6: 1.8,
  7: 2.2,
  8: 2.6,
};

export function getNumberCountRewardMultiplier(numberCount: number) {
  return NUMBER_COUNT_REWARD_MULTIPLIERS[numberCount] ?? 1;
}

export function formatNumberCountRewardLabel(numberCount: number) {
  const multiplier = getNumberCountRewardMultiplier(numberCount);
  return multiplier === 1 ? '기본 보상' : `보상 ×${multiplier}`;
}

function getRewardMultiplier(accuracy: number) {
  if (accuracy >= 80) return 1;
  if (accuracy >= 50) return 0.8;
  return 0.6;
}

export function calculateTrainingRewards({ correctCount, wrongCount, numberCount, coinRewardMultiplier }: TrainingRewardInput): TrainingRewardResult {
  const totalAttempts = correctCount + wrongCount;
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
  const rewardMultiplier = getRewardMultiplier(accuracy);
  const numberCountRewardMultiplier = getNumberCountRewardMultiplier(numberCount);
  const accuracyAdjustedCoins = Math.max(0, Math.round((correctCount * 3 + 10) * rewardMultiplier));
  const baseCoins = Math.round(accuracyAdjustedCoins * coinRewardMultiplier);
  const adjustedCoins = Math.round(baseCoins * numberCountRewardMultiplier);

  return {
    numberCount,
    numberCountRewardMultiplier,
    baseCoins,
    coinRewardMultiplier,
    coins: adjustedCoins,
    happiness: 0,
    accuracy,
    rewardMultiplier,
    hatchItems: [],
  };
}
