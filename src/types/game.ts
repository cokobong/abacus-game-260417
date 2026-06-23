export type Id = string;
export type UnixTimeMs = number;

export type AnswerSource = 'manual' | 'bluetooth';
export type ProblemOperator = '+' | '-';
export type ProblemStatus = 'ready' | 'answering' | 'correct' | 'retry';
export type TrainingSessionStatus = 'running' | 'showing_feedback' | 'completed';
export type SubmissionResult = 'correct' | 'wrong' | null;
export type RewardReason = 'problem_correct' | 'set_complete';
export type RewardType = 'coin' | 'exp' | 'hatch_progress' | 'dinosaur_mood';

export interface TrainingProblem {
  id: Id;
  index: number;
  numbers: number[];
  operators: ProblemOperator[];
  correctAnswer: number;
  displayText: string;
  status: ProblemStatus;
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
  hunger: number;
  stamina: number;
}

export interface OwnedDinosaur {
  id: Id;
  speciesId: Id;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'special' | 'legendary';
  level: number;
  exp: number;
  mood: number;
  hunger: number;
  stamina: number;
  obtainedAt: UnixTimeMs;
}

export interface EggState {
  id: Id;
  name: string;
  rarity: 'normal' | 'rare' | 'special';
  eggType: string;
  hatchProgress: number;
  lastHatchedDinosaurName?: string;
  lastHatchedDinosaurRarity?: OwnedDinosaur['rarity'];
  lastHatchMessage?: string;
  // TODO: When egg purchases are added, move toward ownedEggs + activeEggId.
  // Flow: shop egg purchase -> choose owned egg -> train active egg -> hatch at 100%.
}
