export interface RewardBundleConfig {
  coins: number;
  hatchProgress: number;
  dinosaurMood: number;
  dinosaurExp: number;
}

export interface RewardConfig {
  version: string;
  correctAnswer: RewardBundleConfig;
  setComplete: RewardBundleConfig;
}

export const rewardConfig: RewardConfig = {
  version: '2026-06-23.1',
  correctAnswer: {
    coins: 10,
    hatchProgress: 3,
    dinosaurMood: 1,
    dinosaurExp: 5,
  },
  setComplete: {
    coins: 30,
    hatchProgress: 10,
    dinosaurMood: 0,
    dinosaurExp: 15,
  },
};
