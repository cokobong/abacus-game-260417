import type { AbacusLevelConfig } from '../types/game';
import { getStageById } from './abacusStages';

const curriculumDraftNote = '주산수리셈 교재 재확인 후 수정 예정인 draft 커리큘럼입니다.';

export const abacusLevels: AbacusLevelConfig[] = [
  {
    level: 1,
    title: '1단계',
    summary: '수 개념과 받아올림 없는 한 자리 수',
    stageIds: ['L1-DRAFT-01'],
    status: 'draft',
    defaultStageId: 'L1-DRAFT-01',
    recommendedProblemCount: 10,
    note: curriculumDraftNote,
  },
  {
    level: 2,
    title: '2단계',
    summary: '수 가르기/모으기와 받아올림 있는 한 자리 덧셈 기초',
    stageIds: ['L2-DRAFT-01'],
    status: 'draft',
    defaultStageId: 'L2-DRAFT-01',
    recommendedProblemCount: 10,
    note: curriculumDraftNote,
  },
  {
    level: 3,
    title: '3단계',
    summary: '5와 10을 활용한 한 자리 덧셈·뺄셈',
    stageIds: ['L3-DRAFT-01'],
    status: 'draft',
    defaultStageId: 'L3-DRAFT-01',
    recommendedProblemCount: 10,
    note: curriculumDraftNote,
  },
  {
    level: 4,
    title: '4단계',
    summary: '50/100 만들기와 한 자리 수 연속 계산',
    stageIds: ['L4-DRAFT-01'],
    status: 'draft',
    defaultStageId: 'L4-DRAFT-01',
    recommendedProblemCount: 15,
    note: curriculumDraftNote,
  },
  {
    level: 5,
    title: '5단계',
    summary: '두 자리 수 기초와 10 활용 덧셈·뺄셈',
    stageIds: ['L5-DRAFT-01'],
    status: 'draft',
    defaultStageId: 'L5-DRAFT-01',
    recommendedProblemCount: 15,
    note: curriculumDraftNote,
  },
  {
    level: 6,
    title: '6단계',
    summary: '두 자리 수 연속 계산 준비',
    stageIds: ['L6-DRAFT-01'],
    status: 'draft',
    defaultStageId: 'L6-DRAFT-01',
    recommendedProblemCount: 20,
    note: curriculumDraftNote,
  },
  {
    level: 7,
    title: '7단계',
    summary: '두 자리 수 덧셈·뺄셈 확장',
    stageIds: ['L7-DRAFT-01'],
    status: 'draft',
    defaultStageId: 'L7-DRAFT-01',
    recommendedProblemCount: 20,
    note: curriculumDraftNote,
  },
  {
    level: 8,
    title: '8단계',
    summary: '받아올림/받아내림이 포함된 두 자리 계산',
    stageIds: ['L8-DRAFT-01'],
    status: 'draft',
    defaultStageId: 'L8-DRAFT-01',
    recommendedProblemCount: 20,
    note: curriculumDraftNote,
  },
  {
    level: 9,
    title: '9단계',
    summary: '여러 자리 수와 긴 연속 계산',
    stageIds: ['L9-DRAFT-01'],
    status: 'draft',
    defaultStageId: 'L9-DRAFT-01',
    recommendedProblemCount: 20,
    note: curriculumDraftNote,
  },
  {
    level: 10,
    title: '10단계',
    summary: '종합 계산과 심화 연습',
    stageIds: ['L10-DRAFT-01'],
    status: 'draft',
    defaultStageId: 'L10-DRAFT-01',
    recommendedProblemCount: 20,
    note: curriculumDraftNote,
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
