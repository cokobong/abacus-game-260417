export type Id = string;
export type UnixTimeMs = number;

export type AnswerSource = 'manual' | 'bluetooth';
export type ProblemOperator = '+' | '-';
export type ProblemStatus = 'ready' | 'answering' | 'correct' | 'retry';
export type TrainingSessionStatus = 'running' | 'showing_feedback' | 'completed';
export type SubmissionResult = 'correct' | 'wrong' | null;

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
