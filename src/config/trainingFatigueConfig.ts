export interface TrainingFatigueConfig {
  energyCostPerCorrect: number;
  lowEnergyThreshold: number;
  lowConditionRewardMultiplier: number;
}

export const trainingFatigueConfig: TrainingFatigueConfig = {
  energyCostPerCorrect: 1,
  lowEnergyThreshold: 20,
  lowConditionRewardMultiplier: 0.5,
};
