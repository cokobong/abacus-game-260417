import { sokobanKey, type SokobanDirection, type SokobanParsedPuzzle, type SokobanPoint } from '../config/ruinsSokoban';

export interface SokobanState {
  player: SokobanPoint;
  boxes: readonly SokobanPoint[];
  moveCount: number;
  pushCount: number;
}

export interface SokobanMoveResult {
  state: SokobanState;
  moved: boolean;
  pushed: boolean;
  blockedBy?: 'wall' | 'box';
  attemptedPush?: boolean;
}

export const SOKOBAN_STEPS: Record<SokobanDirection, SokobanPoint> = {
  up: { column: 0, row: -1 }, down: { column: 0, row: 1 },
  left: { column: -1, row: 0 }, right: { column: 1, row: 0 },
};

const add = (point: SokobanPoint, step: SokobanPoint) => ({ column: point.column + step.column, row: point.row + step.row });

export function createSokobanState(puzzle: SokobanParsedPuzzle): SokobanState {
  return { player: { ...puzzle.playerStart }, boxes: puzzle.boxStarts.map(box => ({ ...box })), moveCount: 0, pushCount: 0 };
}

export function moveSokoban(puzzle: SokobanParsedPuzzle, state: SokobanState, direction: SokobanDirection): SokobanMoveResult {
  const step = SOKOBAN_STEPS[direction];
  const nextPlayer = add(state.player, step);
  if (puzzle.walls.has(sokobanKey(nextPlayer))) return { state, moved: false, pushed: false, blockedBy: 'wall', attemptedPush: false };
  const boxIndex = state.boxes.findIndex(box => sokobanKey(box) === sokobanKey(nextPlayer));
  if (boxIndex < 0) return { state: { ...state, player: nextPlayer, moveCount: state.moveCount + 1 }, moved: true, pushed: false };
  const nextBox = add(nextPlayer, step);
  if (puzzle.walls.has(sokobanKey(nextBox))) {
    return { state, moved: false, pushed: false, blockedBy: 'wall', attemptedPush: true };
  }
  if (state.boxes.some(box => sokobanKey(box) === sokobanKey(nextBox))) {
    return { state, moved: false, pushed: false, blockedBy: 'box', attemptedPush: true };
  }
  const boxes = state.boxes.map((box, index) => index === boxIndex ? nextBox : box);
  return { state: { player: nextPlayer, boxes, moveCount: state.moveCount + 1, pushCount: state.pushCount + 1 }, moved: true, pushed: true };
}

export function areAllBoxesOnGoals(puzzle: SokobanParsedPuzzle, state: SokobanState) {
  return state.boxes.length > 0 && state.boxes.every(box => puzzle.goals.has(sokobanKey(box)));
}

export function isMissionComplete(puzzle: SokobanParsedPuzzle, state: SokobanState) {
  return puzzle.completion === 'reachExit'
    ? sokobanKey(state.player) === sokobanKey(puzzle.exit)
    : areAllBoxesOnGoals(puzzle, state);
}

export function getStaticDeadlockKeys(puzzle: SokobanParsedPuzzle) {
  const result = new Set<string>();
  for (let row = 1; row < puzzle.rows - 1; row += 1) {
    for (let column = 1; column < puzzle.columns - 1; column += 1) {
      const point = { column, row };
      const key = sokobanKey(point);
      if (puzzle.walls.has(key) || puzzle.goals.has(key)) continue;
      const wall = (dc: number, dr: number) => puzzle.walls.has(sokobanKey({ column: column + dc, row: row + dr }));
      if ((wall(-1, 0) || wall(1, 0)) && (wall(0, -1) || wall(0, 1))) result.add(key);
    }
  }
  return result;
}

const stateKey = (state: SokobanState) => `${sokobanKey(state.player)}|${state.boxes.map(sokobanKey).sort().join(';')}`;

export function solveSokoban(puzzle: SokobanParsedPuzzle, maxStates = 250_000) {
  const initial = createSokobanState(puzzle);
  const queue: Array<{ state: SokobanState; path: SokobanDirection[] }> = [{ state: initial, path: [] }];
  const best = new Map([[stateKey(initial), '0,0']]);
  let exploredStates = 0;
  let solution: { path: SokobanDirection[]; pushes: number; moves: number } | null = null;
  while (queue.length && exploredStates < maxStates) {
    queue.sort((a, b) => a.state.pushCount - b.state.pushCount || a.state.moveCount - b.state.moveCount);
    const current = queue.shift()!;
    exploredStates += 1;
    if (isMissionComplete(puzzle, current.state)) {
      solution = { path: current.path, pushes: current.state.pushCount, moves: current.state.moveCount };
      break;
    }
    for (const direction of Object.keys(SOKOBAN_STEPS) as SokobanDirection[]) {
      const result = moveSokoban(puzzle, current.state, direction);
      if (!result.moved) continue;
      const key = stateKey(result.state);
      const cost = `${result.state.pushCount},${result.state.moveCount}`;
      const previous = best.get(key)?.split(',').map(Number);
      if (previous && (previous[0] < result.state.pushCount || (previous[0] === result.state.pushCount && previous[1] <= result.state.moveCount))) continue;
      best.set(key, cost);
      queue.push({ state: result.state, path: [...current.path, direction] });
    }
  }
  return { solution, exploredStates, exhausted: queue.length === 0 };
}
