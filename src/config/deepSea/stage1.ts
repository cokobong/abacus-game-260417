import { deepSeaTileKey, type DeepSeaMapConfig } from './types';

function createStageOneWalls() {
  const walls = new Set<string>();
  const add = (column: number, row: number) => walls.add(deepSeaTileKey({ column, row }));
  for (let index = 0; index < 26; index += 1) {
    add(index, 0); add(index, 25); add(0, index); add(25, index);
  }
  const verticals = [
    { column: 5, from: 1, to: 20, gaps: [4, 12, 18] },
    { column: 10, from: 5, to: 24, gaps: [8, 16, 22] },
    { column: 15, from: 1, to: 20, gaps: [5, 13, 19] },
    { column: 20, from: 5, to: 24, gaps: [9, 17, 22] },
  ];
  verticals.forEach(line => {
    for (let row = line.from; row <= line.to; row += 1) if (!line.gaps.includes(row)) add(line.column, row);
  });
  const horizontals = [
    { row: 7, from: 1, to: 9, gaps: [3, 8] },
    { row: 11, from: 11, to: 19, gaps: [13, 18] },
    { row: 15, from: 1, to: 9, gaps: [4, 8] },
    { row: 18, from: 16, to: 24, gaps: [19, 23] },
    { row: 21, from: 6, to: 14, gaps: [9, 12] },
  ];
  horizontals.forEach(line => {
    for (let column = line.from; column <= line.to; column += 1) if (!line.gaps.includes(column)) add(column, line.row);
  });
  return walls;
}

export const DEEP_SEA_STAGE_1_MAP: DeepSeaMapConfig = {
  id: 'deep-sea-stage-1-mockup',
  stage: 1,
  columns: 26,
  rows: 26,
  tileSize: 64,
  cameraZoom: 1,
  visionRadiusTiles: 9,
  sonarRadiusTiles: 9,
  sonarUses: 0,
  playerStart: { column: 2, row: 23 },
  exit: { column: 23, row: 23 },
  requiredDiscoveries: 2,
  walls: createStageOneWalls(),
  discoveries: [
    { id: 'coral', label: '산호 군락', column: 3, row: 4 },
    { id: 'statue', label: '오래된 석상', column: 13, row: 13 },
    { id: 'chest', label: '보물상자', column: 23, row: 4, rewardCoins: 10 },
  ],
  patrols: [
    { id: 'slow-shark', speedTilesPerSecond: 0.72, points: [{ column: 12, row: 22 }, { column: 18, row: 22 }] },
  ],
};
