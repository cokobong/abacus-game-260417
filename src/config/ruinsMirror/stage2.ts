import type { RuinsMirrorPlacementPuzzleConfig } from './types';

export const RUINS_MIRROR_STAGE_2_MISSIONS: readonly RuinsMirrorPlacementPuzzleConfig[] = [
  {
    id: 'ruins-mirror-2-1', mode: 'placement', mission: 1,
    title: '거울 놓기', instruction: '빈 슬롯을 눌러 거울 두 개를 놓아 보세요.',
    grid: { columns: 5, rows: 5 },
    source: { column: 0, row: 2, direction: 'east' }, target: { column: 4, row: 0 },
    obstacles: [{ column: 3, row: 2 }, { column: 3, row: 3 }], mirrorInventory: 2,
    mirrorSlots: [{ id: 's1', column: 2, row: 2 }, { id: 's2', column: 2, row: 0 }, { id: 's3', column: 4, row: 4 }],
  },
  {
    id: 'ruins-mirror-2-2', mode: 'placement', mission: 2,
    title: '막힌 회랑', instruction: '네 슬롯 중 빛길에 필요한 두 곳을 찾아요.',
    grid: { columns: 5, rows: 5 },
    source: { column: 0, row: 4, direction: 'east' }, target: { column: 0, row: 1 },
    obstacles: [{ column: 4, row: 4 }, { column: 1, row: 3 }, { column: 4, row: 2 }], mirrorInventory: 2,
    mirrorSlots: [{ id: 's1', column: 3, row: 4 }, { id: 's2', column: 3, row: 1 }, { id: 's3', column: 1, row: 2 }, { id: 's4', column: 4, row: 0 }],
  },
  {
    id: 'ruins-mirror-2-3', mode: 'placement', mission: 3,
    title: '가짜 슬롯', instruction: '다섯 슬롯 중 필요한 세 곳에만 거울을 놓아요.',
    grid: { columns: 5, rows: 5 },
    source: { column: 0, row: 4, direction: 'east' }, target: { column: 4, row: 4 },
    obstacles: [{ column: 3, row: 4 }, { column: 2, row: 2 }, { column: 3, row: 2 }], mirrorInventory: 3,
    mirrorSlots: [{ id: 's1', column: 1, row: 4 }, { id: 's2', column: 1, row: 1 }, { id: 's3', column: 4, row: 1 }, { id: 's4', column: 2, row: 3 }, { id: 's5', column: 3, row: 0 }],
  },
  {
    id: 'ruins-mirror-2-4', mode: 'placement', mission: 4,
    title: '봉인의 중심', instruction: '가까운 길을 피해 여섯 슬롯 중 세 곳을 골라요.',
    grid: { columns: 5, rows: 5 },
    source: { column: 0, row: 2, direction: 'east' }, target: { column: 4, row: 2 },
    obstacles: [{ column: 2, row: 2 }, { column: 3, row: 2 }, { column: 2, row: 1 }, { column: 3, row: 3 }], mirrorInventory: 3,
    mirrorSlots: [{ id: 's1', column: 1, row: 2 }, { id: 's2', column: 1, row: 0 }, { id: 's3', column: 4, row: 0 }, { id: 's4', column: 0, row: 4 }, { id: 's5', column: 2, row: 3 }, { id: 's6', column: 4, row: 4 }],
  },
] as const;
