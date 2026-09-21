export type SokobanDirection = 'up' | 'down' | 'left' | 'right';
export type SokobanPoint = { column: number; row: number };
export type SokobanCompletion = 'reachExit' | 'boxesOnGoals';
export type SokobanHighlight = 'player' | 'directions' | 'boxes' | 'goals' | 'deadlocks' | 'undo' | 'reset';

export interface SokobanTutorialConfig {
  introText: string;
  highlightCells?: readonly SokobanPoint[];
  highlightObjects?: readonly SokobanHighlight[];
  suggestedDirection?: SokobanDirection;
  dangerCells?: readonly SokobanPoint[];
  hintSteps: readonly string[];
  hintMilestones?: readonly SokobanHintMilestone[];
}

export interface SokobanHintMilestone {
  id: string;
  boxKeys: readonly string[];
  boxPositions: readonly string[];
  targetBoxIndex: number;
  direction: SokobanDirection;
  hints: readonly [string, string, string];
}

export interface SokobanRuntimeSnapshot {
  player: SokobanPoint;
  boxes: readonly SokobanPoint[];
  goalsCompleted: number;
  moveCount: number;
  pushCount: number;
  deadlock: boolean;
}

export interface SokobanPuzzleConfig {
  id: string;
  stage: 1 | 2 | 3;
  mission: number;
  title: string;
  instruction: string;
  board: readonly string[];
  completion: SokobanCompletion;
  highlights: readonly SokobanHighlight[];
  showDeadlockHint: boolean;
  tutorial?: SokobanTutorialConfig;
  expectedMinPushes?: number;
  expectedMinMoves?: number;
  maxEasyPushes?: number;
}

export interface SokobanParsedPuzzle extends SokobanPuzzleConfig {
  columns: number;
  rows: number;
  playerStart: SokobanPoint;
  boxStarts: readonly SokobanPoint[];
  walls: ReadonlySet<string>;
  goals: ReadonlySet<string>;
  exit: SokobanPoint;
}

export const sokobanKey = ({ column, row }: SokobanPoint) => `${column},${row}`;

export function parseSokobanPuzzle(config: SokobanPuzzleConfig): SokobanParsedPuzzle {
  const rows = config.board.length;
  const columns = config.board[0]?.length ?? 0;
  const walls = new Set<string>();
  const goals = new Set<string>();
  const boxStarts: SokobanPoint[] = [];
  let playerStart: SokobanPoint | undefined;
  let exit: SokobanPoint | undefined;
  config.board.forEach((line, row) => {
    if (line.length !== columns) throw new Error(`${config.id}: inconsistent row width`);
    [...line].forEach((cell, column) => {
      const point = { column, row };
      if (cell === '#') walls.add(sokobanKey(point));
      if (cell === '.' || cell === '*' || cell === '+') goals.add(sokobanKey(point));
      if (cell === '$' || cell === '*') boxStarts.push(point);
      if (cell === '@' || cell === '+') playerStart = point;
      if (cell === 'E') exit = point;
    });
  });
  if (!playerStart || !exit) throw new Error(`${config.id}: player and exit are required`);
  return { ...config, columns, rows, playerStart, boxStarts, walls, goals, exit };
}
