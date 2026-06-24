export type Id = string;
export type UnixTimeMs = number;

export type AnswerSource = 'manual' | 'bluetooth';
export type ProblemOperator = '+' | '-';
export type ProblemStatus = 'ready' | 'answering' | 'correct' | 'retry';
export type TrainingSessionStatus = 'running' | 'showing_feedback' | 'completed';
export type SubmissionResult = 'correct' | 'wrong' | null;
export type RewardReason = 'problem_correct' | 'set_complete';
export type RewardType = 'coin' | 'exp' | 'hatch_progress' | 'dinosaur_mood';
export type AbacusOperation = 'add' | 'subtract';
export type OperationMode = 'add' | 'subtract' | 'mixed';
export type DigitType = 'one-digit' | 'two-digit' | 'mixed-digit';
export type AbacusComplementType = 'none' | 'five' | 'ten' | 'mixed';
export type AbacusLevelStatus = 'mvp' | 'draft' | 'planned' | 'later';
export type AbacusStageStatus = 'mvp' | 'draft' | 'planned' | 'later';
export type CurriculumStatus = 'draft' | 'confirmed';
export type GeneratorStatus = 'ready' | 'basic' | 'todo';
export type TrainingMasteryStatus = 'not-started' | 'needs-practice' | 'in-progress' | 'almost-mastered' | 'mastered';
export type TrainingRecommendationType = 'repeat-current' | 'try-next-stage' | 'review-previous' | 'free-practice';

export interface AbacusLevelConfig {
  level: number;
  title: string;
  summary: string;
  stageIds: Id[];
  status: AbacusLevelStatus;
  defaultStageId?: Id;
  recommendedProblemCount?: number;
  note?: string;
}

export interface AbacusStageConfig {
  id: Id;
  level: number;
  title: string;
  summary: string;
  minNumber: number;
  maxNumber: number;
  defaultProblemCount: number;
  defaultNumberCount: number;
  defaultDigitType: DigitType;
  defaultOperation: OperationMode;
  allowedNumberCounts: number[];
  allowedDigitTypes: DigitType[];
  allowedOperations: OperationMode[];
  allowNegative: boolean;
  curriculumStatus: CurriculumStatus;
  generatorStatus: GeneratorStatus;
  tags?: string[];
  note?: string;
  textbookLevel?: string;
  objective?: string;
  digitCount?: 1 | 2 | 3;
  numberCount?: number;
  operations?: AbacusOperation[];
  minResult?: number;
  maxResult?: number;
  allowCarry?: boolean;
  allowBorrow?: boolean;
  complementType?: AbacusComplementType;
  complementFocus?: string;
  rowCount?: 2 | 3 | 4 | 5 | 6;
  problemCountPerSet?: number;
  rewardMultiplier?: number;
  generatorStrategy?: string;
  status?: AbacusStageStatus;
  sourceNote?: string;
}

export interface TrainingProblem {
  id: Id;
  index: number;
  numbers: number[];
  operators: ProblemOperator[];
  correctAnswer: number;
  displayText: string;
  status: ProblemStatus;
  expressionText?: string;
  answer?: number;
  level?: number;
  stageId?: Id;
}

export interface TrainingAnswer {
  id: Id;
  problemId: Id;
  problemIndex: number;
  submittedValue: number | null;
  rawInput: string;
  source: AnswerSource;
  isCorrect: boolean;
  submittedAt: UnixTimeMs;
  elapsedMsFromProblemStart: number;
}

export interface TrainingSession {
  id: Id;
  status: TrainingSessionStatus;
  problems: TrainingProblem[];
  currentProblemIndex: number;
  answers: TrainingAnswer[];
  startedAt: UnixTimeMs;
  completedAt: UnixTimeMs | null;
}

export interface TrainingSessionRecord {
  id: Id;
  completedAt: string;
  selectedLevel: number;
  selectedStageId: Id;
  problemCount: number;
  numberCount: number;
  digitType: DigitType;
  operationMode: OperationMode;
  totalProblems: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  earnedCoins: number;
  earnedExp: number;
  earnedItems: Array<{ itemId: Id; quantity: number }>;
  activeDinosaurId?: Id;
}

export interface LevelProgressRecord {
  totalSessions: number;
  totalProblems: number;
  totalCorrect: number;
  totalWrong: number;
  bestAccuracy: number;
  lastAccuracy: number;
  lastTrainedAt?: string;
  completedStageIds: Id[];
}

export interface StageProgressRecord {
  totalSessions: number;
  totalProblems: number;
  totalCorrect: number;
  totalWrong: number;
  bestAccuracy: number;
  lastAccuracy: number;
  lastTrainedAt?: string;
}

export interface TrainingProgressEvaluation {
  status: TrainingMasteryStatus;
  totalSessions: number;
  totalProblems: number;
  averageAccuracy: number;
  bestAccuracy: number;
  recentAccuracy: number;
  recentWrongCount: number;
  lastTrainedAt?: string;
  recommendation: string;
}

export interface NextTrainingRecommendation {
  type: TrainingRecommendationType;
  message: string;
  suggestedLevel?: number;
  suggestedStageId?: Id;
}

export interface Reward {
  id: Id;
  reason: RewardReason;
  type: RewardType;
  amount: number;
  targetId: Id | null;
  label: string;
  grantedAt: UnixTimeMs | null;
}

export interface PlayerState {
  coins: number;
}

export interface UserProfile {
  id: Id;
  childName: string;
  ageOrGrade: string;
  createdAt: UnixTimeMs;
  selectedDinosaurId: Id;
  dinosaurName: string;
  parentModeEnabled?: boolean;
}

export interface DinosaurState {
  id: Id;
  name: string;
  level: number;
  exp: number;
  mood: number;
  stamina: number;
  /** @deprecated 포만감은 MVP 주요 수치에서 제외한다. 기존 localStorage 호환용으로만 유지한다. */
  hunger?: number;
}

export type CostumeSlot = 'head' | 'neck' | 'body' | 'accessory';

export type EquippedCostumes = Partial<Record<CostumeSlot, Id>>;

export interface OwnedDinosaur {
  id: Id;
  speciesId: Id;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'special' | 'legendary';
  level: number;
  exp: number;
  mood: number;
  stamina: number;
  /** @deprecated 포만감은 MVP 주요 수치에서 제외한다. 기존 localStorage 호환용으로만 유지한다. */
  hunger?: number;
  obtainedAt: UnixTimeMs;
  equippedCostumes?: EquippedCostumes;
}

export interface EggState {
  id: Id;
  name: string;
  rarity: 'normal' | 'rare' | 'special';
  eggType: string;
  eggCategory?: 'normal' | 'special' | 'rare';
  hatchProgress: number;
  lastHatchedDinosaurName?: string;
  lastHatchedDinosaurRarity?: OwnedDinosaur['rarity'];
  lastHatchMessage?: string;
  // Legacy single-egg view retained while the runtime source of truth moves to ownedEggs + activeEggId.
}

export interface OwnedEgg {
  id: Id;
  eggItemId: Id;
  name: string;
  rarity: EggState['rarity'];
  eggType: string;
  eggCategory?: EggState['eggCategory'];
  eggHabitatId?: Id;
  hatchProgress: number;
  createdAt: UnixTimeMs;
}
