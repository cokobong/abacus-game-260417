import type { IceAction, IceIssue } from './iceFossilPrototypeConfig';

export const ICE_FOSSIL_SLICE = {
  durationSeconds: 105,
  viewportWidth: 480,
  height: 720,
  worldWidth: 960,
  upperY: 250,
  lowerY: 515,
  ladderX: 555,
  playerSpeed: 190,
  productSpeed: 43,
  interactionDistance: 78,
  repairSeconds: 0.85,
  machineProcessSeconds: 1.15,
  backlogSpacing: 55,
  dummySpawnSeconds: [7, 13],
  cameraLead: 54,
  completionSeconds: 3.2,
} as const;

export type SliceToolAction = Extract<IceAction, 'toolRepair' | 'toolHeat' | 'toolElectric'>;

export type SliceIssueDefinition = {
  id: IceIssue;
  x: number;
  floor: 1 | 2;
  action: SliceToolAction | 'approach';
  label: string;
  hint: string;
};

export const SLICE_ISSUES: Record<IceIssue, SliceIssueDefinition> = {
  jam: { id: 'jam', x: 250, floor: 2, action: 'toolRepair', label: '절단기 막힘', hint: '렌치' },
  power: { id: 'power', x: 440, floor: 2, action: 'toolElectric', label: '균열기 전원 문제', hint: '전기 도구' },
  frozen: { id: 'frozen', x: 710, floor: 1, action: 'toolHeat', label: '세척기 결빙', hint: '열 도구' },
  penguin: { id: 'penguin', x: 610, floor: 1, action: 'approach', label: '펭귄 방해', hint: '가까이 가기' },
};

export const SLICE_ROUTE = [
  { x: 70, y: 225, state: 0, label: '얼음 원석' },
  { x: 210, y: 225, state: 0, label: '투입' },
  { x: 250, y: 225, state: 1, label: '절단' },
  { x: 400, y: 225, state: 1, label: '운반' },
  { x: 440, y: 225, state: 2, label: '균열' },
  { x: 555, y: 225, state: 3, label: '화석 노출' },
  { x: 555, y: 490, state: 3, label: '하층 운반' },
  { x: 650, y: 490, state: 3, label: '세척 대기' },
  { x: 710, y: 490, state: 4, label: '세척' },
  { x: 835, y: 490, state: 4, label: '복원대 운반' },
  { x: 880, y: 490, state: 5, label: '복원대 장착' },
] as const;

export const ISSUE_AT_ROUTE_INDEX: Partial<Record<number, IceIssue>> = {
  2: 'jam',
  4: 'power',
  7: 'penguin',
  8: 'frozen',
};

