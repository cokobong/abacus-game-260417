import { deepSeaTileKey, type DeepSeaMapConfig } from './types';

function createStageTwoWalls() {
  const columns = 36;
  const rows = 36;
  const walls = new Set<string>();
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) walls.add(deepSeaTileKey({ column, row }));
  }
  const carveRect = (left: number, top: number, right: number, bottom: number) => {
    for (let row = top; row <= bottom; row += 1) {
      for (let column = left; column <= right; column += 1) walls.delete(deepSeaTileKey({ column, row }));
    }
  };

  // 서로 다른 크기의 공간과 굽은 연결부로 산호·협곡·유적·위험·보물 구역을 만든다.
  carveRect(2, 27, 9, 33);   // 시작 해저
  carveRect(2, 13, 10, 21);  // 서쪽 협곡
  carveRect(2, 2, 10, 9);    // 산호 구역
  carveRect(13, 3, 20, 9);   // 좁은 북쪽 협곡
  carveRect(13, 13, 22, 22); // 중앙 유적
  carveRect(25, 2, 33, 10);  // 보물 구역
  carveRect(26, 14, 33, 22); // 위험 생물 구역
  carveRect(26, 27, 33, 33); // 출구 구역

  carveRect(5, 20, 7, 29);
  carveRect(8, 16, 15, 18);
  carveRect(15, 8, 17, 14);
  carveRect(8, 5, 14, 7);
  carveRect(19, 5, 26, 7);
  carveRect(21, 17, 27, 19);
  carveRect(29, 21, 31, 28);
  carveRect(19, 21, 21, 30);
  carveRect(20, 28, 27, 30);

  // 큰 방 안에서도 시선과 이동이 곧장 관통하지 않도록 섬 형태 장애물을 둔다.
  carveRect(4, 4, 8, 7);
  for (const point of [{ column: 6, row: 5 }, { column: 17, row: 16 }, { column: 18, row: 16 }, { column: 29, row: 17 }, { column: 30, row: 17 }, { column: 29, row: 30 }]) {
    walls.add(deepSeaTileKey(point));
  }
  return walls;
}

export const DEEP_SEA_STAGE_2_MAP: DeepSeaMapConfig = {
  id: 'deep-sea-stage-2-mockup',
  stage: 2,
  columns: 36,
  rows: 36,
  tileSize: 64,
  cameraZoom: 1.2,
  visionRadiusTiles: 4.5,
  sonarRadiusTiles: 9,
  sonarUses: 3,
  playerStart: { column: 4, row: 31 },
  exit: { column: 32, row: 31 },
  requiredDiscoveries: 2,
  walls: createStageTwoWalls(),
  discoveries: [
    { id: 'coral', label: '산호 군락', column: 4, row: 4 },
    { id: 'statue', label: '오래된 석상', column: 18, row: 18 },
    { id: 'chest', label: '희귀 보물상자', column: 31, row: 5, rewardCoins: 15 },
  ],
  patrols: [
    { id: 'stage2-shark', kind: 'shark', speedTilesPerSecond: 0.9, points: [{ column: 27, row: 20 }, { column: 32, row: 20 }, { column: 32, row: 15 }, { column: 27, row: 15 }] },
    { id: 'stage2-octopus', kind: 'octopus', speedTilesPerSecond: 0.55, points: [{ column: 15, row: 20 }, { column: 20, row: 20 }, { column: 20, row: 14 }, { column: 15, row: 14 }] },
  ],
};
