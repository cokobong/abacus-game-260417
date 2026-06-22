import type { TrainingProblem } from '../types/game';

export const trainingProblems: TrainingProblem[] = [
  {
    id: 'mock-problem-1',
    index: 0,
    numbers: [7, 5],
    operators: ['+'],
    correctAnswer: 12,
    displayText: '7 + 5',
    status: 'ready',
  },
  {
    id: 'mock-problem-2',
    index: 1,
    numbers: [13, 6],
    operators: ['-'],
    correctAnswer: 7,
    displayText: '13 - 6',
    status: 'ready',
  },
  {
    id: 'mock-problem-3',
    index: 2,
    numbers: [24, 18],
    operators: ['+'],
    correctAnswer: 42,
    displayText: '24 + 18',
    status: 'ready',
  },
];
