import type {
  AbacusLevelConfig,
  AbacusStageConfig,
  LevelProgressRecord,
  NextTrainingRecommendation,
  StageProgressRecord,
  TrainingMasteryStatus,
  TrainingProgressEvaluation,
  TrainingSessionRecord,
} from '../types/game';

const recentWindowSize = 3;

function roundPercent(value: number) {
  return Math.round(value);
}

function getRecentRecords(records: TrainingSessionRecord[]) {
  return [...records]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, recentWindowSize);
}

function getAverageAccuracy(records: TrainingSessionRecord[]) {
  if (records.length === 0) return 0;
  return roundPercent(records.reduce((sum, record) => sum + record.accuracy, 0) / records.length);
}

function getRecentWrongCount(records: TrainingSessionRecord[]) {
  return records.reduce((sum, record) => sum + record.wrongCount, 0);
}

// Temporary heuristic. Tune these thresholds later with real learning data and educator review.
function getMasteryStatus(totalSessions: number, recentAccuracy: number): TrainingMasteryStatus {
  if (totalSessions === 0) return 'not-started';
  if (recentAccuracy < 60) return 'needs-practice';
  if (recentAccuracy < 80) return 'in-progress';
  if (recentAccuracy < 90) return 'almost-mastered';
  return totalSessions >= 3 ? 'mastered' : 'almost-mastered';
}

function getStatusRecommendation(status: TrainingMasteryStatus) {
  const messages: Record<TrainingMasteryStatus, string> = {
    'not-started': '아직 기록이 없습니다. 현재 단계부터 시작해보세요.',
    'needs-practice': '최근 정확도가 낮습니다. 현재 단계를 반복하는 것이 좋습니다.',
    'in-progress': '훈련이 진행 중입니다. 현재 단계를 조금 더 이어가세요.',
    'almost-mastered': '거의 안정적입니다. 한 번 더 풀고 다음 단계 준비가 가능합니다.',
    mastered: '충분히 안정적입니다. 다음 세부 단계나 다음 교재 단계로 넘어갈 수 있습니다.',
  };

  return messages[status];
}

function buildEvaluation({
  progress,
  records,
}: {
  progress?: Pick<LevelProgressRecord | StageProgressRecord, 'totalSessions' | 'totalProblems' | 'totalCorrect' | 'totalWrong' | 'bestAccuracy' | 'lastTrainedAt'>;
  records: TrainingSessionRecord[];
}): TrainingProgressEvaluation {
  const totalSessions = progress?.totalSessions ?? 0;
  const totalProblems = progress?.totalProblems ?? 0;
  const totalAttempts = (progress?.totalCorrect ?? 0) + (progress?.totalWrong ?? 0);
  const averageAccuracy = totalAttempts > 0 ? roundPercent(((progress?.totalCorrect ?? 0) / totalAttempts) * 100) : 0;
  const recentRecords = getRecentRecords(records);
  const recentAccuracy = getAverageAccuracy(recentRecords);
  const status = getMasteryStatus(totalSessions, recentAccuracy);

  return {
    status,
    totalSessions,
    totalProblems,
    averageAccuracy,
    bestAccuracy: progress?.bestAccuracy ?? 0,
    recentAccuracy,
    recentWrongCount: getRecentWrongCount(recentRecords),
    lastTrainedAt: progress?.lastTrainedAt,
    recommendation: getStatusRecommendation(status),
  };
}

export function evaluateLevelProgress({
  level,
  progressByLevel,
  trainingHistory,
}: {
  level: number;
  progressByLevel: Record<number, LevelProgressRecord>;
  trainingHistory: TrainingSessionRecord[];
}) {
  return buildEvaluation({
    progress: progressByLevel[level],
    records: trainingHistory.filter((record) => record.selectedLevel === level),
  });
}

export function evaluateStageProgress({
  stageId,
  progressByStage,
  trainingHistory,
}: {
  stageId: string;
  progressByStage: Record<string, StageProgressRecord>;
  trainingHistory: TrainingSessionRecord[];
}) {
  return buildEvaluation({
    progress: progressByStage[stageId],
    records: trainingHistory.filter((record) => record.selectedStageId === stageId),
  });
}

function findNextStage(selectedLevel: number, selectedStageId: string, abacusLevels: AbacusLevelConfig[], abacusStages: AbacusStageConfig[]) {
  const currentLevel = abacusLevels.find((level) => level.level === selectedLevel);
  const stageIds = currentLevel?.stageIds ?? [];
  const currentIndex = stageIds.indexOf(selectedStageId);
  const nextStageId = currentIndex >= 0 ? stageIds[currentIndex + 1] : null;
  if (nextStageId && abacusStages.some((stage) => stage.id === nextStageId)) {
    return { suggestedLevel: selectedLevel, suggestedStageId: nextStageId };
  }

  const nextLevel = abacusLevels.find((level) => level.level > selectedLevel && level.stageIds.length > 0);
  return nextLevel ? { suggestedLevel: nextLevel.level, suggestedStageId: nextLevel.defaultStageId ?? nextLevel.stageIds[0] } : {};
}

export function getNextTrainingRecommendation({
  selectedLevel,
  selectedStageId,
  progressByStage,
  trainingHistory,
  abacusLevels,
  abacusStages,
}: {
  selectedLevel: number;
  selectedStageId: string;
  progressByLevel: Record<number, LevelProgressRecord>;
  progressByStage: Record<string, StageProgressRecord>;
  trainingHistory: TrainingSessionRecord[];
  abacusLevels: AbacusLevelConfig[];
  abacusStages: AbacusStageConfig[];
}): NextTrainingRecommendation {
  const evaluation = evaluateStageProgress({ stageId: selectedStageId, progressByStage, trainingHistory });

  if (evaluation.status === 'not-started') {
    return {
      type: 'repeat-current',
      message: '아직 기록이 없습니다. 현재 단계부터 시작해보세요.',
      suggestedLevel: selectedLevel,
      suggestedStageId: selectedStageId,
    };
  }

  if (evaluation.status === 'needs-practice' || evaluation.status === 'in-progress') {
    return {
      type: 'repeat-current',
      message: evaluation.status === 'needs-practice' ? '현재 단계를 반복해 안정감을 먼저 만드는 것이 좋습니다.' : '현재 단계를 조금 더 이어가세요.',
      suggestedLevel: selectedLevel,
      suggestedStageId: selectedStageId,
    };
  }

  if (evaluation.status === 'almost-mastered') {
    return {
      type: 'repeat-current',
      message: '거의 숙달 상태입니다. 한 번 더 풀고 다음 단계로 이동할 준비를 해보세요.',
      suggestedLevel: selectedLevel,
      suggestedStageId: selectedStageId,
    };
  }

  const nextTarget = findNextStage(selectedLevel, selectedStageId, abacusLevels, abacusStages);
  return {
    type: nextTarget.suggestedStageId ? 'try-next-stage' : 'free-practice',
    message: nextTarget.suggestedStageId ? '현재 단계가 안정적입니다. 다음 단계 훈련을 추천할 수 있습니다.' : '마지막 단계까지 안정적입니다. 자유 복습을 추천합니다.',
    ...nextTarget,
  };
}
