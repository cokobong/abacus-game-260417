import type { SokobanPuzzleConfig } from './types';

export const RUINS_SOKOBAN_STAGE_1: readonly SokobanPuzzleConfig[] = [
  {
    id: 'ruins-sokoban-1-1', stage: 1, mission: 1, title: '탐험가 움직이기',
    instruction: '화살표를 눌러 탐험가를 문까지 움직여요.',
    board: ['#####', '#@  #', '# # #', '#  E#', '#####'],
    completion: 'reachExit', highlights: ['player', 'directions'], showDeadlockHint: false, expectedMinPushes: 0, expectedMinMoves: 4,
  },
  {
    id: 'ruins-sokoban-1-2', stage: 1, mission: 2, title: '상자를 제단으로',
    instruction: '상자 쪽으로 걸어가면 상자가 앞으로 밀려요.',
    board: ['#####', '# @ #', '# $ #', '# .E#', '#####'],
    completion: 'boxesOnGoals', highlights: ['player', 'boxes', 'goals'], showDeadlockHint: false, expectedMinPushes: 1, expectedMinMoves: 1,
  },
  {
    id: 'ruins-sokoban-1-3', stage: 1, mission: 3, title: '당길 수 없어요',
    instruction: '상자는 당길 수 없어요. 잘못 밀면 되돌려요.',
    board: ['######', '#    #', '# @$ #', '#  .E#', '#    #', '######'],
    completion: 'boxesOnGoals', highlights: ['boxes', 'goals', 'undo', 'reset'], showDeadlockHint: true, expectedMinPushes: 1, expectedMinMoves: 3,
  },
  {
    id: 'ruins-sokoban-1-4', stage: 1, mission: 4, title: '구석을 조심해요',
    instruction: '상자를 구석에 밀면 다시 꺼낼 수 없어요.',
    board: ['######', '#  . #', '# #  #', '## $@#', '# # E#', '######'],
    completion: 'boxesOnGoals', highlights: ['boxes', 'goals', 'deadlocks', 'undo'], showDeadlockHint: true, expectedMinPushes: 2, expectedMinMoves: 4,
  },
  {
    id: 'ruins-sokoban-1-5', stage: 1, mission: 5, title: '어느 상자부터?',
    instruction: '두 상자를 모두 제단에 놓아요. 어느 상자를 먼저 밀까요?',
    board: ['######', '# .###', '# .  #', '# $$ #', '#  @E#', '######'],
    completion: 'boxesOnGoals', highlights: ['boxes', 'goals'], showDeadlockHint: true, expectedMinPushes: 4, expectedMinMoves: 10,
  },
] as const;
