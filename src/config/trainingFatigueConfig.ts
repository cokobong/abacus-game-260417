export interface TrainingFatigueConfig {
  energyCostPerCorrect: number;
  fullnessCostPerCorrect: number;
  lowEnergyThreshold: number;
  lowFullnessThreshold: number;
  lowConditionRewardMultiplier: number;
}

export const trainingFatigueConfig: TrainingFatigueConfig = {
  energyCostPerCorrect: 1,
  fullnessCostPerCorrect: 1,
  lowEnergyThreshold: 20,
  lowFullnessThreshold: 20,
  lowConditionRewardMultiplier: 0.5,
};
