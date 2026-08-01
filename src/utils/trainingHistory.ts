import type { DigitType, OperationMode, TrainingInputMode, TrainingSessionRecord } from '../types/game';

export const TRAINING_HISTORY_RETENTION_DAYS = 180;
export const MAX_TRAINING_HISTORY_RECORDS = 1000;

export interface DailyTrainingSummary {
  dateKey: string;
  sessions: TrainingSessionRecord[];
  totalProblems: number;
  completedSets: number;
  correctCount: number;
  incorrectCount: number;
  answeredProblems: number;
  accuracyRate: number;
  totalElapsedMs: number;
  averageAnswerMs: number;
}

export interface CommonTrainingSettings {
  digitTypes: DigitType[];
  operationModes: OperationMode[];
  numberCounts: number[];
  problemCountFrequency: Array<{ problemCount: number; sessions: number }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeInputMode(value: unknown): TrainingInputMode {
  return value === 'keypad' || value === 'bluetooth' || value === 'pencil' ? value : 'pencil';
}

function normalizeTrainingRecord(value: unknown): TrainingSessionRecord | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.completedAt !== 'string') return null;
  const completedAtMs = Date.parse(value.completedAt);
  if (!Number.isFinite(completedAtMs)) return null;

  const totalProblems = Math.max(0, finiteNumber(value.totalProblems, finiteNumber(value.problemCount)));
  const legacyCorrect = Math.max(0, finiteNumber(value.correctCount));
  const hasFirstAttemptStats = typeof value.answeredProblems === 'number' && Number.isFinite(value.answeredProblems);
  const answeredProblems = Math.max(0, finiteNumber(value.answeredProblems, totalProblems || legacyCorrect + finiteNumber(value.wrongCount)));
  const storedAccuracy = finiteNumber(value.accuracy, answeredProblems > 0 ? (legacyCorrect / answeredProblems) * 100 : 0);
  const correctCount = hasFirstAttemptStats
    ? Math.min(answeredProblems, legacyCorrect)
    : Math.min(answeredProblems, Math.round((storedAccuracy / 100) * answeredProblems));
  const wrongCount = hasFirstAttemptStats
    ? Math.max(0, finiteNumber(value.wrongCount, answeredProblems - correctCount))
    : answeredProblems - correctCount;
  const totalElapsedMs = Math.max(0, finiteNumber(value.totalElapsedMs));
  const averageAnswerMs = Math.max(0, finiteNumber(value.averageAnswerMs, answeredProblems > 0 ? totalElapsedMs / answeredProblems : 0));
  const {
    earnedExp: _legacyEarnedExp,
    exp: _legacyExp,
    baseExp: _legacyBaseExp,
    finalExp: _legacyFinalExp,
    expMultiplier: _legacyExpMultiplier,
    dinosaurExp: _legacyDinosaurExp,
    dinoExp: _legacyDinoExp,
    levelUp: _legacyLevelUp,
    ...compatibleValue
  } = value;

  return {
    ...(compatibleValue as unknown as TrainingSessionRecord),
    totalProblems,
    problemCount: Math.max(0, finiteNumber(value.problemCount, totalProblems)),
    numberCount: Math.max(0, finiteNumber(value.numberCount, 3)),
    correctCount,
    wrongCount: Math.min(answeredProblems, wrongCount),
    answeredProblems,
    accuracy: hasFirstAttemptStats && answeredProblems > 0 ? (correctCount / answeredProblems) * 100 : storedAccuracy,
    totalElapsedMs,
    averageAnswerMs,
    inputMode: normalizeInputMode(value.inputMode),
  };
}

export function getLocalDateKey(date: Date | number | string = new Date()) {
  const localDate = date instanceof Date ? date : new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeTrainingHistory(value: unknown, now = Date.now()) {
  if (!Array.isArray(value)) return [];
  const retentionStart = new Date(now);
  retentionStart.setHours(0, 0, 0, 0);
  retentionStart.setDate(retentionStart.getDate() - (TRAINING_HISTORY_RETENTION_DAYS - 1));

  const uniqueRecords = new Map<string, TrainingSessionRecord>();
  for (const item of value) {
    const record = normalizeTrainingRecord(item);
    if (!record || new Date(record.completedAt).getTime() < retentionStart.getTime() || uniqueRecords.has(record.id)) continue;
    uniqueRecords.set(record.id, record);
  }

  return [...uniqueRecords.values()]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, MAX_TRAINING_HISTORY_RECORDS);
}

export function addTrainingSessionRecord(history: TrainingSessionRecord[], record: TrainingSessionRecord) {
  if (history.some((item) => item.id === record.id)) return history;
  return normalizeTrainingHistory([record, ...history]);
}

export function getSessionsForDate(history: TrainingSessionRecord[], date: Date | number | string = new Date()) {
  const dateKey = getLocalDateKey(date);
  return history.filter((record) => getLocalDateKey(record.completedAt) === dateKey);
}

export function summarizeDailyTraining(history: TrainingSessionRecord[], date: Date | number | string = new Date()): DailyTrainingSummary {
  const sessions = getSessionsForDate(history, date);
  const correctCount = sessions.reduce((sum, record) => sum + record.correctCount, 0);
  const incorrectCount = sessions.reduce((sum, record) => sum + record.wrongCount, 0);
  const answeredProblems = sessions.reduce((sum, record) => sum + record.answeredProblems, 0);
  const totalElapsedMs = sessions.reduce((sum, record) => sum + record.totalElapsedMs, 0);

  return {
    dateKey: getLocalDateKey(date),
    sessions,
    totalProblems: sessions.reduce((sum, record) => sum + record.totalProblems, 0),
    completedSets: sessions.length,
    correctCount,
    incorrectCount,
    answeredProblems,
    accuracyRate: answeredProblems > 0 ? (correctCount / answeredProblems) * 100 : 0,
    totalElapsedMs,
    averageAnswerMs: answeredProblems > 0 ? totalElapsedMs / answeredProblems : 0,
  };
}

function getModes<T>(values: T[]) {
  if (values.length === 0) return [];
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const maximum = Math.max(...counts.values());
  return [...counts.entries()].filter(([, count]) => count === maximum).map(([value]) => value);
}

export function getMostCommonTrainingSettings(sessions: TrainingSessionRecord[]): CommonTrainingSettings {
  const problemCounts = new Map<number, number>();
  sessions.forEach((record) => problemCounts.set(record.problemCount, (problemCounts.get(record.problemCount) ?? 0) + 1));

  return {
    digitTypes: getModes(sessions.map((record) => record.digitType)),
    operationModes: getModes(sessions.map((record) => record.operationMode)),
    numberCounts: getModes(sessions.map((record) => record.numberCount)),
    problemCountFrequency: [...problemCounts.entries()]
      .map(([problemCount, sessionCount]) => ({ problemCount, sessions: sessionCount }))
      .sort((a, b) => a.problemCount - b.problemCount),
  };
}

export function summarizeRecentDays(history: TrainingSessionRecord[], days = 7, endDate = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(endDate);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - index);
    return summarizeDailyTraining(history, date);
  });
}

export function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}초`;
  return `${minutes}분 ${seconds}초`;
}

export function formatAverageSeconds(milliseconds: number) {
  return `${(Math.max(0, milliseconds) / 1000).toFixed(1)}초`;
}
