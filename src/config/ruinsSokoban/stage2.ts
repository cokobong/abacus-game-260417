import type { SokobanPuzzleConfig } from './types';

export const RUINS_SOKOBAN_STAGE_2: readonly SokobanPuzzleConfig[] = [
  {
    id: 'ruins-sokoban-2-1', stage: 2, mission: 1, title: '안쪽 제단부터',
    instruction: '상자 두 개를 제단에 놓으세요.',
    board: ['######', '# .. #', '# #$ #', '# $  #', '#  @E#', '######'],
    completion: 'boxesOnGoals', highlights: [], showDeadlockHint: false, expectedMinPushes: 5, expectedMinMoves: 16, maxEasyPushes: 4,
  },
  {
    id: 'ruins-sokoban-2-2', stage: 2, mission: 2, title: '기둥을 돌아서',
    instruction: '세 상자를 모두 제단에 놓으세요.',
    board: ['#######', '# . . #', '#  #  #', '# $$  #', '#  #$ #', '# @ .E#', '#######'],
    completion: 'boxesOnGoals', highlights: [], showDeadlockHint: false, expectedMinPushes: 6, expectedMinMoves: 37, maxEasyPushes: 5,
  },
  {
    id: 'ruins-sokoban-2-3', stage: 2, mission: 3, title: '좁은 유적 통로',
    instruction: '상자 순서와 구석을 조심하세요.',
    board: ['#######', '# .####', '# .   #', '# .$$ #', '#  $  #', '#  @ E#', '#######'],
    completion: 'boxesOnGoals', highlights: [], showDeadlockHint: false, expectedMinPushes: 8, expectedMinMoves: 19, maxEasyPushes: 7,
  },
] as const;
