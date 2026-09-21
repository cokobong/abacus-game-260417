import designs from '../../../docs/ruins-sokoban-puzzles.json';
import solverReport from '../../../docs/ruins-sokoban-solver-report.json';
import type { SokobanDirection, SokobanPuzzleConfig } from './types';

export const RUINS_SOKOBAN_STAGE_3 = designs
  .filter(puzzle => /^ruins-sokoban-3-\d+$/.test(puzzle.id))
  .map((puzzle, index): SokobanPuzzleConfig => {
    const result = solverReport.find(entry => entry.id === puzzle.id);
    if (!result) throw new Error(`${puzzle.id}: solver result is required`);
    return {
      id: puzzle.id,
      stage: 3,
      mission: index + 1,
      title: puzzle.title,
      instruction: '상자를 모두 제단에 놓으세요.',
      board: puzzle.board,
      completion: 'boxesOnGoals',
      highlights: [],
      showDeadlockHint: false,
      expectedMinPushes: result.minPushes,
      expectedMinMoves: result.movesAtMinPush,
      tutorial: {
        introText: '상자의 길과 밀 순서를 살펴보세요.',
        hintSteps: puzzle.hintSteps,
        hintMilestones: puzzle.hintMilestones.map(milestone => ({
          ...milestone,
          direction: milestone.direction as SokobanDirection,
          hints: milestone.hints as [string, string, string],
        })),
      },
    };
  });

export const RUINS_SOKOBAN_STAGE_3_MILESTONES: Readonly<Record<string, string>> = Object.fromEntries(
  designs
    .filter(puzzle => /^ruins-sokoban-3-\d+$/.test(puzzle.id) && 'milestoneRewardPartId' in puzzle)
    .map(puzzle => [puzzle.id, puzzle.milestoneRewardPartId as string]),
);
