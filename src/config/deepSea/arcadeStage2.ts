export type ArcadePoint = { column: number; row: number };
export type ArcadeDirection = 'up' | 'down' | 'left' | 'right';
export const ARCADE_DIRECTIONS: Record<ArcadeDirection, ArcadePoint> = {
  up: { column: 0, row: -1 }, down: { column: 0, row: 1 },
  left: { column: -1, row: 0 }, right: { column: 1, row: 0 },
};
export const arcadeKey = ({ column, row }: ArcadePoint) => `${column},${row}`;
export const arcadeDistance = (a: ArcadePoint, b: ArcadePoint) => Math.abs(a.column - b.column) + Math.abs(a.row - b.row);

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
  { id: 'gold-jar', label: '금빛 항아리', column: 2, row: 2 },
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
  if (!reserved.has(key) && (column + row) % 2 === 0) coins.push({ column, row });
}

export const ARCADE_STAGE_2 = { columns, rows, tileSize: 56, floor, playerStart, exit, treasures, orbs, coins, enemyStarts };

export function arcadeIsFloor(point: ArcadePoint) { return floor.has(arcadeKey(point)); }
export function arcadeNeighbors(point: ArcadePoint): ArcadePoint[] {
  return Object.values(ARCADE_DIRECTIONS).map(step => ({ column: point.column + step.column, row: point.row + step.row })).filter(arcadeIsFloor);
}

// One shortest-path step on the tile graph. Three enemies query this only at tile boundaries.
export function arcadeNextStep(start: ArcadePoint, target: ArcadePoint): ArcadePoint {
  if (arcadeKey(start) === arcadeKey(target)) return start;
  const queue = [start];
  const seen = new Set([arcadeKey(start)]);
  const previous = new Map<string, ArcadePoint>();
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    for (const next of arcadeNeighbors(current)) {
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
