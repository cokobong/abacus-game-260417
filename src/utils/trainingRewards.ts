import { rewardConfig } from '../config/rewardConfig';

export interface TrainingRewardInput {
  totalProblems: number;
  correctCount: number;
  wrongCount: number;
  selectedLevel: number;
  activeDinosaurCondition?: {
    stamina: number;
  };
}

export interface TrainingRewardResult {
  coins: number;
  dinosaurExp: number;
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

export function calculateTrainingRewards({ totalProblems, correctCount, wrongCount }: TrainingRewardInput): TrainingRewardResult {
  const totalAttempts = correctCount + wrongCount;
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
  const rewardMultiplier = getRewardMultiplier(accuracy);
  const baseCoins = correctCount * 3 + 10;
  const baseExp = correctCount * 2;

  return {
    coins: Math.max(0, Math.round(baseCoins * rewardMultiplier)),
    dinosaurExp: Math.max(0, Math.round(baseExp * rewardMultiplier)),
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
