import type { SokobanPuzzleConfig } from './types';

export const RUINS_SOKOBAN_STAGE_1: readonly SokobanPuzzleConfig[] = [
  {
    id: 'ruins-sokoban-1-1', stage: 1, mission: 1, title: '화살표로 이동해요', instruction: '화살표를 눌러 탐험가를 움직여보세요.',
    board: ['#####', '#@  #', '# # #', '#  E#', '#####'], completion: 'reachExit', highlights: ['player', 'directions'], showDeadlockHint: false, expectedMinPushes: 0, expectedMinMoves: 4,
    tutorial: { introText: '화살표를 눌러 탐험가를 움직여보세요.', highlightObjects: ['player', 'directions'], suggestedDirection: 'right', hintSteps: ['빛나는 방향으로 움직여보세요.'] },
  },
  {
    id: 'ruins-sokoban-1-2', stage: 1, mission: 2, title: '상자를 앞으로 밀어요', instruction: '상자 뒤에서 앞으로 밀어보세요.',
    board: ['#####', '# @ #', '# $ #', '# .E#', '#####'], completion: 'boxesOnGoals', highlights: ['player', 'boxes', 'goals'], showDeadlockHint: false, expectedMinPushes: 1, expectedMinMoves: 1,
    tutorial: { introText: '탐험가 → 상자 → 제단 순서로 서면 밀 수 있어요.', highlightObjects: ['player', 'boxes', 'goals'], suggestedDirection: 'down', hintSteps: ['상자를 제단 쪽으로 밀어보세요.'] },
  },
  {
    id: 'ruins-sokoban-1-3', stage: 1, mission: 3, title: '상자 뒤로 돌아가요', instruction: '상자를 왼쪽으로 밀려면 먼저 오른쪽으로 돌아가세요.',
    board: ['######', '#    #', '# .$ #', '# @  #', '#   E#', '######'], completion: 'boxesOnGoals', highlights: ['player', 'boxes', 'goals'], showDeadlockHint: false, expectedMinPushes: 1, expectedMinMoves: 4,
    tutorial: { introText: '상자를 왼쪽으로 밀고 싶나요? 먼저 오른쪽으로 돌아가세요.', highlightCells: [{ column: 3, row: 3 }, { column: 4, row: 3 }, { column: 4, row: 2 }], highlightObjects: ['boxes', 'goals'], suggestedDirection: 'right', hintSteps: ['상자 뒤쪽으로 돌아가볼까요?', '상자의 오른쪽에 서보세요.'] },
  },
  {
    id: 'ruins-sokoban-1-4', stage: 1, mission: 4, title: '상자는 당길 수 없어요', instruction: '상자는 밀 수 있지만 당길 수는 없어요.',
    board: ['######', '#    #', '# @$ #', '#  .E#', '#    #', '######'], completion: 'boxesOnGoals', highlights: ['boxes', 'goals', 'undo'], showDeadlockHint: false, expectedMinPushes: 1, expectedMinMoves: 3,
    tutorial: { introText: '잘못 밀었나요? 괜찮아요. 한 수 뒤로 돌아가면 돼요.', highlightObjects: ['boxes', 'undo'], hintSteps: ['상자는 당길 수 없어요.', '한 수 뒤로를 눌러 다시 생각해보세요.'] },
  },
  {
    id: 'ruins-sokoban-1-5', stage: 1, mission: 5, title: '구석은 위험해요', instruction: '상자를 목표가 아닌 구석에 밀지 마세요.',
    board: ['######', '#  . #', '# #  #', '## $@#', '# # E#', '######'], completion: 'boxesOnGoals', highlights: ['boxes', 'goals', 'deadlocks', 'undo'], showDeadlockHint: true, expectedMinPushes: 2, expectedMinMoves: 4,
    tutorial: { introText: '구석에 들어간 상자는 꺼내기 어려워요.', highlightObjects: ['deadlocks', 'undo'], dangerCells: [{ column: 4, row: 4 }], hintSteps: ['이 구석은 위험해요.', '상자를 위쪽으로 먼저 밀어보세요.'] },
  },
  {
    id: 'ruins-sokoban-1-6', stage: 1, mission: 6, title: '먼저 길을 만들어요', instruction: '목표보다 먼저 상자가 지나갈 길을 만들어보세요.',
    board: ['#######', '# . . #', '# $$  #', '#  @  #', '#    E#', '#######'], completion: 'boxesOnGoals', highlights: ['boxes', 'goals'], showDeadlockHint: true, expectedMinPushes: 3, expectedMinMoves: 6,
    tutorial: { introText: '상자끼리 길을 막을 수 있어요. 먼저 공간을 만들어요.', highlightObjects: ['boxes', 'goals'], hintSteps: ['먼저 길을 만들어볼까요?', '왼쪽 상자를 먼저 제단에 올려 통로를 비워보세요.'] },
  },
  {
    id: 'ruins-sokoban-1-7', stage: 1, mission: 7, title: '어떤 상자가 먼저일까요?', instruction: '두 상자를 밀 순서를 생각해보세요.',
    board: ['#######', '# ..###', '# $$  #', '#  @ E#', '#######'], completion: 'boxesOnGoals', highlights: ['boxes', 'goals'], showDeadlockHint: true, expectedMinPushes: 2, expectedMinMoves: 4,
    tutorial: { introText: '한 상자가 다른 상자의 길을 막지 않게 순서를 골라요.', highlightObjects: ['boxes', 'goals'], hintSteps: ['어떤 상자를 먼저 밀까요?', '오른쪽 상자를 먼저 움직여보세요.'] },
  },
] as const;
