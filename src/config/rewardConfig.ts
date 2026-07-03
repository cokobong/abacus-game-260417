export interface RewardBundleConfig {
  coins: number;
  hatchProgress: number;
  dinosaurMood: number;
  /** Raw EXP points, not progress percent. */
  dinoExp: number;
}

export type CoinRewardMultiplier = 0.7 | 1 | 1.3;

export const coinRewardOptions: Array<{ value: CoinRewardMultiplier; label: string; percent: number }> = [
  { value: 0.7, label: '적게', percent: 70 },
  { value: 1, label: '보통', percent: 100 },
  { value: 1.3, label: '많이', percent: 130 },
];

export const defaultCoinRewardMultiplier: CoinRewardMultiplier = 1;

export interface RewardConfig {
  version: string;
  correctAnswer: RewardBundleConfig;
  setComplete: RewardBundleConfig;
  hatchItemRewardOnSetComplete: string;
  hatchItemQuantityOnSetComplete: number;
}

export const rewardConfig: RewardConfig = {
  version: '2026-06-23.1',
  correctAnswer: {
    coins: 10,
    hatchProgress: 0,
    dinosaurMood: 1,
    dinoExp: 0,
  },
  setComplete: {
    coins: 30,
    hatchProgress: 0,
    dinosaurMood: 0,
    dinoExp: 15,
  },
  hatchItemRewardOnSetComplete: 'hatch-warm-stone',
  hatchItemQuantityOnSetComplete: 1,
};
