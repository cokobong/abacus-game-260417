import type { AbacusStageConfig, DigitType, OperationMode } from '../types/game';

const draftNote = '주산수리셈 교재 재확인 후 수정 예정인 draft stage입니다. 실제 교재 내용 확인 후 data config만 수정해 반영합니다.';
const defaultNumberCounts = [2, 3, 4, 5, 6];
const defaultDigitTypes: DigitType[] = ['one-digit', 'two-digit', 'mixed-digit'];
const defaultOperations: OperationMode[] = ['add', 'subtract', 'mixed'];

function createDraftStage(config: {
  id: string;
  level: number;
  title: string;
  summary: string;
  minNumber: number;
  maxNumber: number;
  defaultProblemCount: number;
  defaultNumberCount: number;
  defaultDigitType: DigitType;
  defaultOperation: OperationMode;
  allowedNumberCounts?: number[];
  allowedDigitTypes?: DigitType[];
  allowedOperations?: OperationMode[];
  generatorStatus: AbacusStageConfig['generatorStatus'];
  tags?: string[];
  note?: string;
}): AbacusStageConfig {
  return {
    allowedNumberCounts: defaultNumberCounts,
    allowedDigitTypes: defaultDigitTypes,
    allowedOperations: defaultOperations,
    allowNegative: false,
    curriculumStatus: 'draft',
    note: draftNote,
    ...config,
    textbookLevel: `${config.level}단계`,
    objective: config.summary,
    digitCount: config.defaultDigitType === 'one-digit' ? 1 : config.defaultDigitType === 'two-digit' ? 2 : 2,
    numberCount: config.defaultNumberCount,
    operations: config.defaultOperation === 'mixed' ? ['add', 'subtract'] : [config.defaultOperation],
    minResult: 0,
    maxResult: config.maxNumber * config.defaultNumberCount,
    allowCarry: config.tags?.includes('carry') ?? false,
    allowBorrow: config.tags?.includes('borrow') ?? false,
    complementType: config.tags?.includes('five-complement') ? 'five' : config.tags?.includes('ten-complement') ? 'ten' : 'none',
    rowCount: Math.min(6, Math.max(2, config.defaultNumberCount)) as AbacusStageConfig['rowCount'],
    problemCountPerSet: config.defaultProblemCount,
    generatorStrategy: `${config.id.toLowerCase()}-draft-basic`,
    status: config.generatorStatus === 'ready' ? 'mvp' : config.generatorStatus === 'basic' ? 'draft' : 'later',
    sourceNote: draftNote,
  };
}

export const abacusStages: AbacusStageConfig[] = [
  createDraftStage({
    id: 'L1-DRAFT-01',
    level: 1,
    title: '1단계 대표 초안',
    summary: '수 개념과 받아올림 없는 한 자리 수',
    minNumber: 1,
    maxNumber: 9,
    defaultProblemCount: 10,
    defaultNumberCount: 2,
    defaultDigitType: 'one-digit',
    defaultOperation: 'mixed',
    allowedDigitTypes: ['one-digit'],
    generatorStatus: 'ready',
    tags: ['single-digit', 'no-carry', 'no-borrow'],
  }),
  createDraftStage({
    id: 'L2-DRAFT-01',
    level: 2,
    title: '2단계 대표 초안',
    summary: '수 가르기/모으기와 받아올림 있는 한 자리 덧셈 기초',
    minNumber: 1,
    maxNumber: 9,
    defaultProblemCount: 10,
    defaultNumberCount: 3,
    defaultDigitType: 'one-digit',
    defaultOperation: 'add',
    allowedDigitTypes: ['one-digit'],
    allowedOperations: ['add', 'mixed'],
    generatorStatus: 'basic',
    tags: ['single-digit', 'carry', 'ten-complement'],
  }),
  createDraftStage({
    id: 'L3-DRAFT-01',
    level: 3,
    title: '3단계 대표 초안',
    summary: '5와 10을 활용한 한 자리 덧셈·뺄셈',
    minNumber: 1,
    maxNumber: 9,
    defaultProblemCount: 10,
    defaultNumberCount: 3,
    defaultDigitType: 'one-digit',
    defaultOperation: 'mixed',
    allowedDigitTypes: ['one-digit'],
    generatorStatus: 'basic',
    tags: ['single-digit', 'five-complement', 'ten-complement'],
  }),
  createDraftStage({
    id: 'L4-DRAFT-01',
    level: 4,
    title: '4단계 대표 초안',
    summary: '50/100 만들기와 한 자리 수 연속 계산',
    minNumber: 1,
    maxNumber: 99,
    defaultProblemCount: 15,
    defaultNumberCount: 4,
    defaultDigitType: 'mixed-digit',
    defaultOperation: 'mixed',
    generatorStatus: 'todo',
    tags: ['make-50', 'make-100'],
  }),
  createDraftStage({
    id: 'L5-DRAFT-01',
    level: 5,
    title: '5단계 대표 초안',
    summary: '두 자리 수 기초와 10 활용 덧셈·뺄셈',
    minNumber: 10,
    maxNumber: 99,
    defaultProblemCount: 15,
    defaultNumberCount: 3,
    defaultDigitType: 'two-digit',
    defaultOperation: 'mixed',
    allowedDigitTypes: ['two-digit', 'mixed-digit'],
    generatorStatus: 'basic',
    tags: ['two-digit', 'ten-complement'],
  }),
  createDraftStage({
    id: 'L6-DRAFT-01',
    level: 6,
    title: '6단계 대표 초안',
    summary: '두 자리 수 연속 계산 준비',
    minNumber: 10,
    maxNumber: 99,
    defaultProblemCount: 20,
    defaultNumberCount: 4,
    defaultDigitType: 'two-digit',
    defaultOperation: 'mixed',
    allowedDigitTypes: ['two-digit', 'mixed-digit'],
    generatorStatus: 'basic',
    tags: ['two-digit', 'multi-row'],
  }),
  createDraftStage({
    id: 'L7-DRAFT-01',
    level: 7,
    title: '7단계 대표 초안',
    summary: '두 자리 수 덧셈·뺄셈 확장',
    minNumber: 10,
    maxNumber: 99,
    defaultProblemCount: 20,
    defaultNumberCount: 4,
    defaultDigitType: 'two-digit',
    defaultOperation: 'mixed',
    allowedDigitTypes: ['two-digit', 'mixed-digit'],
    generatorStatus: 'todo',
    tags: ['two-digit', 'expanded'],
  }),
  createDraftStage({
    id: 'L8-DRAFT-01',
    level: 8,
    title: '8단계 대표 초안',
    summary: '받아올림/받아내림이 포함된 두 자리 계산',
    minNumber: 10,
    maxNumber: 99,
    defaultProblemCount: 20,
    defaultNumberCount: 5,
    defaultDigitType: 'two-digit',
    defaultOperation: 'mixed',
    allowedDigitTypes: ['two-digit', 'mixed-digit'],
    generatorStatus: 'todo',
    tags: ['two-digit', 'carry', 'borrow'],
  }),
  createDraftStage({
    id: 'L9-DRAFT-01',
    level: 9,
    title: '9단계 대표 초안',
    summary: '여러 자리 수와 긴 연속 계산',
    minNumber: 1,
    maxNumber: 99,
    defaultProblemCount: 20,
    defaultNumberCount: 6,
    defaultDigitType: 'mixed-digit',
    defaultOperation: 'mixed',
    generatorStatus: 'todo',
    tags: ['long-form', 'multi-row'],
  }),
  createDraftStage({
    id: 'L10-DRAFT-01',
    level: 10,
    title: '10단계 대표 초안',
    summary: '종합 계산과 심화 연습',
    minNumber: 1,
    maxNumber: 99,
    defaultProblemCount: 20,
    defaultNumberCount: 6,
    defaultDigitType: 'mixed-digit',
    defaultOperation: 'mixed',
    generatorStatus: 'todo',
    tags: ['review', 'advanced'],
  }),
];

export function getStageById(stageId: string) {
  return abacusStages.find((stage) => stage.id === stageId) ?? null;
}

export function getMvpStages() {
  return abacusStages.filter((stage) => stage.generatorStatus === 'ready');
}

export function getPlannedStages() {
  return abacusStages.filter((stage) => stage.generatorStatus === 'basic' || stage.generatorStatus === 'todo');
}

export function getGeneratorFallbackStage(stage: AbacusStageConfig | null) {
  if (stage && stage.generatorStatus !== 'todo') return stage;

  const sameLevelFallback = stage ? abacusStages.find((candidate) => candidate.level === stage.level && candidate.generatorStatus !== 'todo') : null;
  return sameLevelFallback ?? getStageById('L1-DRAFT-01') ?? abacusStages[0] ?? null;
}
