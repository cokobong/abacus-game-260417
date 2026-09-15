import type { SokobanPuzzleConfig } from './types';

export const RUINS_SOKOBAN_STAGE_2: readonly SokobanPuzzleConfig[] = [
  {
    id: 'ruins-sokoban-2-1', stage: 2, mission: 1, title: '안쪽 제단부터',
    instruction: '상자 두 개를 제단에 놓으세요.',
    board: ['######', '# .. #', '# #$ #', '# $  #', '#  @E#', '######'],
    completion: 'boxesOnGoals', highlights: [], showDeadlockHint: false, expectedMinPushes: 5, expectedMinMoves: 16, maxEasyPushes: 4,
    tutorial: { introText: '스스로 길을 찾아 상자를 제단에 올려보세요.', hintSteps: ['가운데 통로를 먼저 살펴보세요.', '아래쪽 상자를 먼저 움직여보세요.', '아래쪽 상자를 왼쪽으로 밀 자리를 찾아보세요.'] },
  },
  {
    id: 'ruins-sokoban-2-2', stage: 2, mission: 2, title: '기둥을 돌아서',
    instruction: '세 상자를 모두 제단에 놓으세요.',
    board: ['#######', '# . . #', '#  #  #', '# $$  #', '#  #$ #', '# @ .E#', '#######'],
    completion: 'boxesOnGoals', highlights: [], showDeadlockHint: false, expectedMinPushes: 6, expectedMinMoves: 37, maxEasyPushes: 5,
    tutorial: { introText: '상자마다 지나갈 길을 먼저 생각해보세요.', hintSteps: ['좁은 통로를 먼저 비워야 해요.', '오른쪽 아래 상자의 길을 먼저 찾아보세요.', '오른쪽 아래 상자를 위로 밀 자리를 찾아보세요.'] },
  },
  {
    id: 'ruins-sokoban-2-3', stage: 2, mission: 3, title: '좁은 유적 통로',
    instruction: '상자 순서와 구석을 조심하세요.',
    board: ['#######', '# .####', '# .   #', '# .$$ #', '#  $  #', '#  @ E#', '#######'],
    completion: 'boxesOnGoals', highlights: [], showDeadlockHint: false, expectedMinPushes: 8, expectedMinMoves: 19, maxEasyPushes: 7,
    tutorial: { introText: '상자를 밀 순서와 구석을 함께 살펴보세요.', hintSteps: ['목표에서 먼 상자부터 생각해보세요.', '가운데 상자의 길을 먼저 열어보세요.', '가운데 상자를 왼쪽으로 밀 자리를 찾아보세요.'] },
  },
] as const;
