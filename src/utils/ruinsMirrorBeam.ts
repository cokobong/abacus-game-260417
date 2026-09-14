import { getRuinsMirrorObstacles, getRuinsMirrorSource, type RuinsMirrorDefinition, type RuinsMirrorDirection, type RuinsMirrorOrientation, type RuinsMirrorPuzzleConfig } from '../config/ruinsMirror';

export type RuinsMirrorGridPoint = { column: number; row: number };
export type RuinsMirrorBeamSegment = { from: RuinsMirrorGridPoint; to: RuinsMirrorGridPoint };

const DIRECTION_STEP: Record<RuinsMirrorDirection, RuinsMirrorGridPoint> = {
  north: { column: 0, row: -1 },
  east: { column: 1, row: 0 },
  south: { column: 0, row: 1 },
  west: { column: -1, row: 0 },
};

const REFLECTIONS: Record<RuinsMirrorOrientation, Record<RuinsMirrorDirection, RuinsMirrorDirection>> = {
  slash: { north: 'east', east: 'north', south: 'west', west: 'south' },
  backslash: { north: 'west', west: 'north', south: 'east', east: 'south' },
};

export function traceRuinsMirrorBeam(config: RuinsMirrorPuzzleConfig, orientations: ReadonlyMap<string, RuinsMirrorOrientation>, activeMirrors?: readonly RuinsMirrorDefinition[]) {
  const segments: RuinsMirrorBeamSegment[] = [];
  const visited = new Set<string>();
  const source = getRuinsMirrorSource(config);
  const obstacles = getRuinsMirrorObstacles(config);
  const mirrors = activeMirrors ?? (config.mode === 'fixed' ? config.mirrors : []);
  let current: RuinsMirrorGridPoint = { column: source.column, row: source.row };
  let direction = source.direction;
  let reachedTarget = false;

  for (let stepCount = 0; stepCount < 100; stepCount += 1) {
    const stateKey = `${current.column},${current.row},${direction}`;
    if (visited.has(stateKey)) break;
    visited.add(stateKey);
    const step = DIRECTION_STEP[direction];
    const next = { column: current.column + step.column, row: current.row + step.row };
    segments.push({ from: current, to: next });
    if (next.column === config.target.column && next.row === config.target.row) {
      reachedTarget = true;
      break;
    }
    if (next.column < 0 || next.row < 0 || next.column >= config.grid.columns || next.row >= config.grid.rows) break;
    if (obstacles.some(blocker => blocker.column === next.column && blocker.row === next.row)) break;
    current = next;
    const mirror = mirrors.find(item => item.column === current.column && item.row === current.row);
    if (mirror) direction = REFLECTIONS[orientations.get(mirror.id) ?? mirror.initial][direction];
  }

  return { segments, reachedTarget };
}
