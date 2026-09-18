export type ArcadePoint = { column: number; row: number };
export type ArcadeDirection = 'up' | 'down' | 'left' | 'right';
export const ARCADE_DIRECTIONS: Record<ArcadeDirection, ArcadePoint> = {
  up: { column: 0, row: -1 }, down: { column: 0, row: 1 },
  left: { column: -1, row: 0 }, right: { column: 1, row: 0 },
};
export const arcadeKey = ({ column, row }: ArcadePoint) => `${column},${row}`;
export const arcadeDistance = (a: ArcadePoint, b: ArcadePoint) => Math.abs(a.column - b.column) + Math.abs(a.row - b.row);

export const ARCADE_STAGE_2_TUNING = {
  playerSpeed: 260,
  turnSnapDistance: 8,
  sharkPatrolSpeed: 140,
  sharkChaseSpeed: 150,
  octopusSpeed: 118,
  sharkChaseRange: 7,
  octopusChaseRange: 6,
  enemySpawnDistance: 6,
  treasureMinDistance: 8,
  coinStride: 3,
  powerupDurationMs: 7000,
  powerEndGraceMs: 650,
  invulnerabilityDurationMs: 1300,
  respawnSafeDistance: 3,
  cameraZoom: 1.54,
  stage2CameraZoom: 1.65,
  cameraLerp: .18,
} as const;

const columns = 22;
const rows = 22;
const floor = new Set<string>();
const carve = (left: number, top: number, right: number, bottom: number) => {
  for (let row = top; row <= bottom; row += 1) {
    for (let column = left; column <= right; column += 1) floor.add(arcadeKey({ column, row }));
  }
};
// A fixed, connected arcade board. Parallel lanes and cross links give enemies and players alternate routes.
for (const row of [2, 6, 10, 14, 18]) carve(2, row, 20, row);
for (const column of [2, 6, 10, 14, 18, 20]) carve(column, 2, column, 18);
for (const [left, top, right, bottom] of [[9, 5, 11, 7], [17, 9, 19, 11], [1, 13, 3, 15], [13, 17, 15, 19]]) carve(left, top, right, bottom);

const treasures = [
  { id: 'gold-jar', label: '금빛 항아리', column: 6, row: 18 },
  { id: 'broken-crown', label: '부서진 왕관', column: 18, row: 2 },
  { id: 'blue-jewel-box', label: '파란 보석 상자', column: 18, row: 14 },
] as const;
const orbs = [{ column: 6, row: 10 }, { column: 18, row: 10 }] as const;
const playerStart = { column: 2, row: 18 };
const exit = { column: 20, row: 18 };
const enemyStarts = [
  { id: 'shark-1', kind: 'shark', column: 14, row: 2 },
  { id: 'shark-2', kind: 'shark', column: 10, row: 14 },
  { id: 'octopus', kind: 'octopus', column: 14, row: 10 },
] as const;
const reserved = new Set([...treasures, ...orbs, playerStart, exit, ...enemyStarts].map(arcadeKey));
const coins: ArcadePoint[] = [];
for (const key of floor) {
  const [column, row] = key.split(',').map(Number);
  if (!reserved.has(key) && (column + row) % ARCADE_STAGE_2_TUNING.coinStride === 0) coins.push({ column, row });
}

export const ARCADE_STAGE_2 = { columns, rows, tileSize: 56, floor, playerStart, exit, treasures, orbs, coins, enemyStarts };

export function validateArcadeBoard(board: {
  floor: ReadonlySet<string>; playerStart: ArcadePoint; exit: ArcadePoint;
  treasures: readonly ArcadePoint[]; orbs: readonly ArcadePoint[]; coins: readonly ArcadePoint[];
  enemyStarts: readonly ArcadePoint[];
}, enemySpawnDistance = 0, treasureMinDistance = 0): string[] {
  const errors: string[] = [];
  const occupied = new Map<string, string>();
  const groups: [string, readonly ArcadePoint[]][] = [
    ['player', [board.playerStart]], ['exit', [board.exit]], ['treasure', board.treasures],
    ['orb', board.orbs], ['enemy', board.enemyStarts], ['coin', board.coins],
  ];
  for (const [kind, points] of groups) for (const point of points) {
    const key = arcadeKey(point);
    if (!board.floor.has(key)) errors.push(`${kind} is outside corridor: ${key}`);
    if (occupied.has(key)) errors.push(`${kind} overlaps ${occupied.get(key)}: ${key}`);
    occupied.set(key, kind);
  }
  for (const enemy of board.enemyStarts) if (arcadeDistance(enemy, board.playerStart) < enemySpawnDistance) {
    errors.push(`enemy too close to player: ${arcadeKey(enemy)}`);
  }
  for (let i = 0; i < board.treasures.length; i += 1) for (let j = i + 1; j < board.treasures.length; j += 1) {
    if (arcadeDistance(board.treasures[i], board.treasures[j]) < treasureMinDistance) errors.push(`treasures too close: ${i},${j}`);
  }
  const queue = [board.playerStart];
  const visited = new Set([arcadeKey(board.playerStart)]);
  for (let head = 0; head < queue.length; head += 1) for (const next of arcadeNeighbors(queue[head], board.floor)) {
    const key = arcadeKey(next);
    if (!visited.has(key)) { visited.add(key); queue.push(next); }
  }
  for (const key of occupied.keys()) if (!visited.has(key)) errors.push(`unreachable tile: ${key}`);
  for (const enemy of board.enemyStarts) if (arcadeNeighbors(enemy, board.floor).length < 2) {
    errors.push(`enemy spawned in dead end: ${arcadeKey(enemy)}`);
  }
  return errors;
}

const stage2LayoutIssues = validateArcadeBoard(ARCADE_STAGE_2, ARCADE_STAGE_2_TUNING.enemySpawnDistance, ARCADE_STAGE_2_TUNING.treasureMinDistance);
if (stage2LayoutIssues.length) throw new Error(`Invalid deep-sea Stage 2 board: ${stage2LayoutIssues.join('; ')}`);

export function arcadeIsFloor(point: ArcadePoint, boardFloor: ReadonlySet<string> = floor) { return boardFloor.has(arcadeKey(point)); }
export function arcadeNeighbors(point: ArcadePoint, boardFloor: ReadonlySet<string> = floor): ArcadePoint[] {
  return Object.values(ARCADE_DIRECTIONS).map(step => ({ column: point.column + step.column, row: point.row + step.row })).filter(point => arcadeIsFloor(point, boardFloor));
}

// One shortest-path step on the tile graph. Three enemies query this only at tile boundaries.
export function arcadeNextStep(start: ArcadePoint, target: ArcadePoint, boardFloor: ReadonlySet<string> = floor): ArcadePoint {
  if (arcadeKey(start) === arcadeKey(target)) return start;
  const queue = [start];
  const seen = new Set([arcadeKey(start)]);
  const previous = new Map<string, ArcadePoint>();
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    for (const next of arcadeNeighbors(current, boardFloor)) {
      const key = arcadeKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      previous.set(key, current);
      if (key === arcadeKey(target)) {
        let step = next;
        while (arcadeKey(previous.get(arcadeKey(step))!) !== arcadeKey(start)) step = previous.get(arcadeKey(step))!;
        return step;
      }
      queue.push(next);
    }
  }
  return start;
}
