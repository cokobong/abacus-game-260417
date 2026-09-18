import { getRuinsMirrorObstacles, getRuinsMirrorSource, getRuinsMirrorTargets, type RuinsMirrorDefinition, type RuinsMirrorDirection, type RuinsMirrorOrientation, type RuinsMirrorPuzzleConfig } from '../config/ruinsMirror';

export type RuinsMirrorGridPoint = { column: number; row: number };
export type RuinsMirrorBeamSegment = { from: RuinsMirrorGridPoint; to: RuinsMirrorGridPoint };

const DIRECTION_STEP: Record<RuinsMirrorDirection, RuinsMirrorGridPoint> = {
  north: { column: 0, row: -1 }, east: { column: 1, row: 0 },
  south: { column: 0, row: 1 }, west: { column: -1, row: 0 },
};
const REFLECTIONS: Record<RuinsMirrorOrientation, Record<RuinsMirrorDirection, RuinsMirrorDirection>> = {
  slash: { north: 'east', east: 'north', south: 'west', west: 'south' },
  backslash: { north: 'west', west: 'north', south: 'east', east: 'south' },
};
const keyOf = (point: RuinsMirrorGridPoint) => `${point.column},${point.row}`;

export function traceRuinsMirrorBeam(config: RuinsMirrorPuzzleConfig, orientations: ReadonlyMap<string, RuinsMirrorOrientation>, activeMirrors?: readonly RuinsMirrorDefinition[]) {
  const segments: RuinsMirrorBeamSegment[] = [];
  const reachedTargets = new Set<string>();
  const visited = new Set<string>();
  const source = getRuinsMirrorSource(config);
  const targets = getRuinsMirrorTargets(config);
  const obstacles = getRuinsMirrorObstacles(config);
  const mirrors = activeMirrors ?? (config.mode === 'fixed' ? config.mirrors : []);
  const splitters = config.mode === 'fixed' ? (config.splitters ?? []) : [];
  const beams: Array<{ current: RuinsMirrorGridPoint; direction: RuinsMirrorDirection }> = [
    { current: { column: source.column, row: source.row }, direction: source.direction },
  ];
  let reflections = 0;

  while (beams.length > 0 && visited.size < 400) {
    const beam = beams.shift()!;
    const stateKey = `${keyOf(beam.current)},${beam.direction}`;
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);
    const step = DIRECTION_STEP[beam.direction];
    const next = { column: beam.current.column + step.column, row: beam.current.row + step.row };
    segments.push({ from: beam.current, to: next });
    if (next.column < 0 || next.row < 0 || next.column >= config.grid.columns || next.row >= config.grid.rows) continue;
    if (obstacles.some(item => item.column === next.column && item.row === next.row)) continue;
    const target = targets.find(item => item.column === next.column && item.row === next.row);
    if (target) {
      reachedTargets.add(keyOf(target));
      continue;
    }
    const splitter = splitters.find(item => item.column === next.column && item.row === next.row);
    if (splitter) {
      splitter.outputs.forEach(direction => beams.push({ current: next, direction }));
      continue;
    }
    const mirror = mirrors.find(item => item.column === next.column && item.row === next.row);
    if (mirror) {
      reflections += 1;
      const orientation = mirror.rotatable ? (orientations.get(mirror.id) ?? mirror.initial) : mirror.initial;
      beams.push({ current: next, direction: REFLECTIONS[orientation][beam.direction] });
      continue;
    }
    beams.push({ current: next, direction: beam.direction });
  }

  return {
    segments,
    reachedTarget: reachedTargets.size === targets.length,
    reachedTargets,
    reflections,
  };
}
