import type { RuinsMirrorFixedPuzzleConfig } from './types';

export const RUINS_MIRROR_STAGE_1_MISSIONS: readonly RuinsMirrorFixedPuzzleConfig[] = [
  {
    id: 'ruins-mirror-1-1',
    mode: 'fixed',
    mission: 1,
    title: '첫 번째 빛',
    instruction: '거울을 눌러 빛을 위쪽 제단으로 보내요.',
    grid: { columns: 4, rows: 4 },
    emitter: { column: 0, row: 3, direction: 'east' },
    target: { column: 2, row: 0 },
    mirrors: [
      { id: 'm1', column: 2, row: 3, initial: 'backslash', rotatable: true },
    ],
  },
  {
    id: 'ruins-mirror-1-2',
    mode: 'fixed',
    mission: 2,
    title: '빛을 아래로',
    instruction: '빛의 방향을 아래쪽 제단으로 바꿔요.',
    grid: { columns: 4, rows: 4 },
    emitter: { column: 0, row: 0, direction: 'east' },
    target: { column: 3, row: 3 },
    mirrors: [
      { id: 'm1', column: 3, row: 0, initial: 'slash', rotatable: true },
    ],
  },
  {
    id: 'ruins-mirror-1-3',
    mode: 'fixed',
    mission: 3,
    title: '두 번 반사',
    instruction: '거울 두 개를 돌려 왼쪽 제단까지 연결해요.',
    grid: { columns: 4, rows: 4 },
    emitter: { column: 0, row: 3, direction: 'east' },
    target: { column: 0, row: 1 },
    mirrors: [
      { id: 'm1', column: 1, row: 3, initial: 'backslash', rotatable: true },
      { id: 'm2', column: 1, row: 1, initial: 'slash', rotatable: true },
      { id: 'm3', column: 3, row: 2, initial: 'slash', rotatable: true },
    ],
  },
  {
    id: 'ruins-mirror-1-4',
    mode: 'fixed',
    mission: 4,
    title: '태양 제단 깨우기',
    instruction: '세 거울의 방향을 찾아 마지막 제단을 깨워요.',
    grid: { columns: 5, rows: 5 },
    emitter: { column: 0, row: 4, direction: 'east' },
    target: { column: 0, row: 3 },
    mirrors: [
      { id: 'm1', column: 2, row: 4, initial: 'backslash', rotatable: true },
      { id: 'm2', column: 2, row: 1, initial: 'slash', rotatable: true },
      { id: 'm3', column: 0, row: 1, initial: 'backslash', rotatable: true },
      { id: 'm4', column: 4, row: 3, initial: 'slash', rotatable: true },
    ],
  },
] as const;
