import type { AbacusLevelConfig } from '../types/game';
import { getStageById } from './abacusStages';

export const abacusLevels: AbacusLevelConfig[] = [
  {
    level: 1,
    title: '1단계',
    summary: '수 개념과 받아올림 없는 한 자리 수',
    stageIds: ['B0-02', 'S1-01', 'S1-02', 'S1-03', 'S1-04', 'S1-05', 'S1-06', 'S1-07'],
    status: 'mvp',
    defaultStageId: 'S1-01',
    recommendedProblemCount: 10,
  },
  {
    level: 2,
    title: '2단계',
    summary: '수 가르기/모으기와 받아올림 있는 한 자리 덧셈',
    stageIds: ['S2-02', 'S2-03', 'S2-04', 'S2-05', 'S2-06', 'S2-07', 'S2-M01', 'S2-M02'],
    status: 'planned',
    defaultStageId: 'S2-02',
    recommendedProblemCount: 10,
  },
  {
    level: 3,
    title: '3단계',
    summary: '5와 10을 활용한 한 자리 덧셈',
    stageIds: ['S3-01', 'S3-02', 'S3-03', 'S3-04'],
    status: 'planned',
    defaultStageId: 'S3-01',
    recommendedProblemCount: 10,
  },
  {
    level: 4,
    title: '4단계',
    summary: '50/100 만들기와 한 자리 4행',
    stageIds: ['S4-01', 'S4-02', 'S4-03'],
    status: 'later',
    recommendedProblemCount: 15,
  },
  {
    level: 5,
    title: '5단계',
    summary: '두 자리 수와 10 활용 덧셈·뺄셈',
    stageIds: ['S5-01', 'S5-02', 'S5-03'],
    status: 'later',
    recommendedProblemCount: 15,
  },
  {
    level: 6,
    title: '6단계',
    summary: '두 자리 수 연속 계산 준비 중',
    stageIds: [],
    status: 'later',
    recommendedProblemCount: 20,
  },
  {
    level: 7,
    title: '7단계',
    summary: '세 자리 수 계산 준비 중',
    stageIds: [],
    status: 'later',
    recommendedProblemCount: 20,
  },
  {
    level: 8,
    title: '8단계',
    summary: '곱셈/나눗셈 기초 준비 중',
    stageIds: [],
    status: 'later',
    recommendedProblemCount: 20,
  },
  {
    level: 9,
    title: '9단계',
    summary: '암산 전환과 속도 훈련 준비 중',
    stageIds: [],
    status: 'later',
    recommendedProblemCount: 20,
  },
  {
    level: 10,
    title: '10단계',
    summary: '급수형 문제와 종합 복습 준비 중',
    stageIds: [],
    status: 'later',
    recommendedProblemCount: 20,
  },
];

export function getAbacusLevel(level: number) {
  return abacusLevels.find((config) => config.level === level) ?? null;
}

export function getDefaultStageIdForLevel(level: number) {
  const levelConfig = getAbacusLevel(level);
  if (!levelConfig) return null;

  const defaultStage = levelConfig.defaultStageId ? getStageById(levelConfig.defaultStageId) : null;
  if (defaultStage) return defaultStage.id;

  return levelConfig.stageIds.find((stageId) => getStageById(stageId)) ?? null;
}

export function getStagesForLevel(level: number) {
  const levelConfig = getAbacusLevel(level);
  if (!levelConfig) return [];

  return levelConfig.stageIds.map((stageId) => getStageById(stageId)).filter(Boolean);
}

export function getLevelForStageId(stageId: string) {
  return abacusLevels.find((levelConfig) => levelConfig.stageIds.includes(stageId)) ?? null;
}
