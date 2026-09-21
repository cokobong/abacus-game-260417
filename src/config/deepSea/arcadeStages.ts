import { ARCADE_STAGE_2, ARCADE_STAGE_2_TUNING, arcadeKey, type ArcadePoint } from './arcadeStage2';

export type DeepSeaMission = '1-1' | '1-2' | '1-3' | '2' | '3';
export type ArcadeEnemyKind = 'shark' | 'octopus' | 'jellyfish';
export type ArcadeGate = { id: string; column: number; row: number; openMs: number; warningMs: number; closedMs: number; phaseMs: number };
export type ArcadeBoard = {
  columns: number; rows: number; tileSize: number; floor: Set<string>;
  playerStart: ArcadePoint; exit: ArcadePoint;
  treasures: readonly { id: string; label: string; column: number; row: number }[];
  orbs: readonly ArcadePoint[]; coins: readonly ArcadePoint[];
  enemyStarts: readonly { id: string; kind: ArcadeEnemyKind; column: number; row: number }[];
  gates?: readonly ArcadeGate[];
};
export type DeepSeaStageConfig = {
  id: DeepSeaMission; title: string; board: ArcadeBoard;
  exitRule: 'coins' | 'power' | 'treasures'; coinGoal: number;
  enemySpeed: number; damageEnabled: boolean; minimapEnabled: boolean;
  timeTarget: string;
  templateId?: string;
  powerDurationMs?: number;
  jellyfishSpeed?: number;
  jellyfishHoldDurationMs?: number;
  jellyfishRecontactGraceMs?: number;
  cameraZoom?: number;
};

const floor = new Set<string>();
for (const row of [2, 6, 10]) for (let column = 2; column <= 12; column += 1) floor.add(arcadeKey({ column, row }));
for (const column of [2, 6, 10, 12]) for (let row = 2; row <= 10; row += 1) floor.add(arcadeKey({ column, row }));
const point = (column: number, row: number): ArcadePoint => ({ column, row });
const tutorialBase = { columns: 14, rows: 13, tileSize: 56, floor, playerStart: point(2, 10), exit: point(12, 10) };

export const DEEP_SEA_STAGES: Record<Exclude<DeepSeaMission, '3'>, DeepSeaStageConfig> = {
  '1-1': {
    id: '1-1', title: '이동 연습', timeTarget: '45~60초', exitRule: 'coins', coinGoal: 5,
    enemySpeed: 0, damageEnabled: false, minimapEnabled: false,
    board: { ...tutorialBase, treasures: [], orbs: [], enemyStarts: [], coins: [point(4, 10), point(6, 10), point(6, 8), point(6, 6), point(8, 6)] },
  },
  '1-2': {
    id: '1-2', title: '상어와 전기 구슬', timeTarget: '60~90초', exitRule: 'power', coinGoal: 0,
    enemySpeed: .68, damageEnabled: true, minimapEnabled: false,
    board: { ...tutorialBase, treasures: [], orbs: [point(6, 10), point(6, 6)], coins: [], enemyStarts: [{ id: 'shark-tutorial', kind: 'shark', column: 10, row: 10 }] },
  },
  '1-3': {
    id: '1-3', title: '보물 탈출', timeTarget: '90초~2분', exitRule: 'treasures', coinGoal: 0,
    enemySpeed: .8, damageEnabled: true, minimapEnabled: true,
    board: {
      ...tutorialBase,
      treasures: [
        { id: 'compass', label: '오래된 나침반', column: 2, row: 2 },
        { id: 'key', label: '녹슨 배 열쇠', column: 10, row: 2 },
        { id: 'necklace', label: '조개 목걸이', column: 10, row: 10 },
      ],
      orbs: [point(6, 10)], coins: [point(4, 10), point(6, 6), point(8, 2)],
      enemyStarts: [
        { id: 'shark-tutorial', kind: 'shark', column: 10, row: 6 },
        { id: 'octopus-tutorial', kind: 'octopus', column: 6, row: 2 },
      ],
    },
  },
  '2': { id: '2', title: '깊은 물길', timeTarget: '2~3분', exitRule: 'treasures', coinGoal: 0, enemySpeed: 1, damageEnabled: true, minimapEnabled: true, cameraZoom: ARCADE_STAGE_2_TUNING.stage2CameraZoom, board: ARCADE_STAGE_2 },
};
