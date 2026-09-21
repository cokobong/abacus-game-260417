import { arcadeDistance, arcadeKey, arcadeNeighbors, validateArcadeBoard, type ArcadePoint } from './arcadeStage2';
import type { ArcadeBoard, ArcadeGate, DeepSeaStageConfig } from './arcadeStages';

export const STAGE_3_SETTINGS = {
  columns: 26, rows: 26, tileSize: 56, targetPlayTime: '3~4분', treasureCount: 3,
  enemyTypes: ['shark', 'octopus', 'jellyfish'], enemyCount: 3,
  sharkSpeed: 150, octopusSpeed: 118, jellyfishSpeed: 72,
  jellyfishHoldDurationMs: 1800, jellyfishRecontactGraceMs: 400,
  cameraZoom: 1.6,
  powerupCount: 2, powerupDurationMs: 7000,
  gateCount: 2, gateOpenMs: 6000, gateWarningMs: 1200, gateClosedMs: 3000,
  spawnSafetyDistance: 8, treasureMinDistance: 8, exitEnemyDistance: 5,
  validationRetryCount: 32, relicDropChance: .375, relicPityThreshold: 2,
} as const;

export type Stage3GateState = 'OPEN' | 'WARNING' | 'CLOSED';
export function canJellyfishHold(time: number, powerUntil: number, holdUntil: number, graceUntil: number, touchingPlayer: boolean) {
  return time >= powerUntil && time >= holdUntil && time >= graceUntil && !touchingPlayer;
}
export function getStage3GateState(gate: ArcadeGate, elapsedMs: number): Stage3GateState {
  const cycle = gate.openMs + gate.warningMs + gate.closedMs;
  const phase = ((elapsedMs + gate.phaseMs) % cycle + cycle) % cycle;
  return phase < gate.openMs ? 'OPEN' : phase < gate.openMs + gate.warningMs ? 'WARNING' : 'CLOSED';
}

type Template = {
  id: string; floor: Set<string>; playerStart: ArcadePoint;
  treasureSpawnCandidates: readonly (readonly ArcadePoint[])[];
  enemySpawnCandidates: { shark: readonly ArcadePoint[]; octopus: readonly ArcadePoint[]; jellyfish: readonly ArcadePoint[] };
  powerupSpawnCandidates: readonly ArcadePoint[]; exitCandidates: readonly ArcadePoint[];
  gatePositions: readonly ArcadePoint[]; coinPathCandidates: readonly ArcadePoint[];
};
const point = (column: number, row: number): ArcadePoint => ({ column, row });

function makeTemplate(id: string, columns: readonly number[], rows: readonly number[]): Template {
  const floor = new Set<string>();
  for (const row of rows) for (let column = columns[0]; column <= columns.at(-1)!; column += 1) floor.add(arcadeKey(point(column, row)));
  for (const column of columns) for (let row = rows[0]; row <= rows.at(-1)!; row += 1) floor.add(arcadeKey(point(column, row)));
  const last = columns.length - 1;
  const bottom = rows.length - 1;
  const playerStart = point(columns[0], rows[bottom]);
  const gatePositions = [point(columns[1] + 1, rows[1]), point(columns[last - 2] + 1, rows[bottom - 2])];
  return {
    id, floor, playerStart,
    treasureSpawnCandidates: [
      [point(columns[1], rows[bottom]), point(columns[0], rows[bottom - 1])],
      [point(columns[2], rows[2]), point(columns[1], rows[1])],
      [point(columns[last - 1], rows[0]), point(columns[last], rows[1])],
    ],
    enemySpawnCandidates: {
      shark: [point(columns[3], rows[2]), point(columns[last - 1], rows[3])],
      octopus: [point(columns[3], rows[1]), point(columns[2], rows[1])],
      jellyfish: [point(columns[last], rows[3]), point(columns[last - 1], rows[bottom - 1])],
    },
    powerupSpawnCandidates: [point(columns[2], rows[bottom]), point(columns[last - 1], rows[2]), point(columns[1], rows[1])],
    exitCandidates: [point(columns[last], rows[bottom]), point(columns[last], rows[bottom - 1])],
    gatePositions,
    coinPathCandidates: [...floor].map(key => { const [column, row] = key.split(',').map(Number); return point(column, row); })
      .filter(tile => (tile.column + tile.row) % 4 === 0),
  };
}

export const STAGE_3_TEMPLATES: readonly Template[] = [
  makeTemplate('loop', [2, 6, 10, 14, 18, 23], [2, 6, 10, 14, 18, 23]),
  makeTemplate('central_cross', [2, 7, 12, 17, 23], [2, 7, 12, 17, 23]),
  makeTemplate('side_detour', [2, 6, 11, 16, 21, 23], [2, 6, 11, 16, 21, 23]),
  makeTemplate('gate_focused', [2, 5, 9, 14, 19, 23], [2, 5, 9, 14, 19, 23]),
];

function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) state = Math.imul(state ^ seed.charCodeAt(index), 16777619);
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
const choose = <T,>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)];

function buildBoard(template: Template, random: () => number): ArcadeBoard {
  const treasures = template.treasureSpawnCandidates.map((candidates, index) => ({
    ...choose(candidates, random), id: ['stage3-pearl', 'stage3-crown', 'stage3-trident'][index],
    label: ['빛나는 진주', '해마 왕관', '세 갈래 창'][index],
  }));
  const enemyStarts = (['shark', 'octopus', 'jellyfish'] as const).map(kind => ({
    ...choose(template.enemySpawnCandidates[kind], random), id: `stage3-${kind}`, kind,
  }));
  const orbs = [choose(template.powerupSpawnCandidates, random)];
  const secondOrb = choose(template.powerupSpawnCandidates.filter(candidate => arcadeKey(candidate) !== arcadeKey(orbs[0])), random);
  if (STAGE_3_SETTINGS.powerupCount > 1) orbs.push(secondOrb);
  const exit = choose(template.exitCandidates, random);
  const gates: ArcadeGate[] = template.gatePositions.slice(0, STAGE_3_SETTINGS.gateCount).map((tile, index) => ({
    ...tile, id: `${template.id}-gate-${index + 1}`,
    openMs: STAGE_3_SETTINGS.gateOpenMs - index * 900,
    warningMs: STAGE_3_SETTINGS.gateWarningMs,
    closedMs: STAGE_3_SETTINGS.gateClosedMs,
    phaseMs: index * 1800,
  }));
  const occupied = new Set([...treasures, ...enemyStarts, ...orbs, exit, template.playerStart, ...gates].map(arcadeKey));
  const coins = template.coinPathCandidates.filter(tile => !occupied.has(arcadeKey(tile)));
  return { columns: STAGE_3_SETTINGS.columns, rows: STAGE_3_SETTINGS.rows, tileSize: STAGE_3_SETTINGS.tileSize,
    floor: template.floor, playerStart: template.playerStart, exit, treasures, orbs, coins, enemyStarts, gates };
}

export function validateStage3Board(board: ArcadeBoard): string[] {
  const errors = validateArcadeBoard(board, STAGE_3_SETTINGS.spawnSafetyDistance, STAGE_3_SETTINGS.treasureMinDistance);
  if (board.treasures.length !== STAGE_3_SETTINGS.treasureCount) errors.push('treasure count');
  if (board.enemyStarts.length !== STAGE_3_SETTINGS.enemyCount) errors.push('enemy count');
  if (board.orbs.length !== STAGE_3_SETTINGS.powerupCount) errors.push('powerup count');
  if (board.gates?.length !== STAGE_3_SETTINGS.gateCount) errors.push('gate count');
  for (const enemy of board.enemyStarts) if (arcadeDistance(enemy, board.exit) < STAGE_3_SETTINGS.exitEnemyDistance) errors.push(`enemy near exit: ${enemy.id}`);
  const occupied = new Set([board.playerStart, board.exit, ...board.treasures, ...board.orbs, ...board.enemyStarts, ...board.coins].map(arcadeKey));
  const closedFloor = new Set(board.floor);
  for (const gate of board.gates ?? []) {
    if (occupied.has(arcadeKey(gate))) errors.push(`gate overlaps pickup/spawn: ${gate.id}`);
    if (arcadeNeighbors(gate, board.floor).length < 2) errors.push(`gate in dead end: ${gate.id}`);
    closedFloor.delete(arcadeKey(gate));
  }
  const queue = [board.playerStart];
  const reached = new Set([arcadeKey(board.playerStart)]);
  for (let head = 0; head < queue.length; head += 1) for (const next of arcadeNeighbors(queue[head], closedFloor)) {
    const key = arcadeKey(next);
    if (!reached.has(key)) { reached.add(key); queue.push(next); }
  }
  for (const goal of [...board.treasures, board.exit]) if (!reached.has(arcadeKey(goal))) errors.push(`required goal blocked by gates: ${arcadeKey(goal)}`);
  return errors;
}

export function createStage3Config(runId: string): DeepSeaStageConfig {
  const random = seededRandom(runId);
  for (let attempt = 0; attempt < STAGE_3_SETTINGS.validationRetryCount; attempt += 1) {
    const template = choose(STAGE_3_TEMPLATES, random);
    const board = buildBoard(template, random);
    if (validateStage3Board(board).length === 0) return {
      id: '3', title: '심해 중심부', board, templateId: template.id,
      exitRule: 'treasures', coinGoal: 0, enemySpeed: 1, damageEnabled: true,
      minimapEnabled: true, timeTarget: STAGE_3_SETTINGS.targetPlayTime,
      cameraZoom: STAGE_3_SETTINGS.cameraZoom,
      powerDurationMs: STAGE_3_SETTINGS.powerupDurationMs, jellyfishSpeed: STAGE_3_SETTINGS.jellyfishSpeed,
      jellyfishHoldDurationMs: STAGE_3_SETTINGS.jellyfishHoldDurationMs, jellyfishRecontactGraceMs: STAGE_3_SETTINGS.jellyfishRecontactGraceMs,
    };
  }
  const fallbackRandom = () => 0;
  const template = STAGE_3_TEMPLATES[0];
  const board = buildBoard(template, fallbackRandom);
  const issues = validateStage3Board(board);
  if (issues.length) throw new Error(`Invalid Stage 3 fallback: ${issues.join('; ')}`);
  return { id: '3', title: '심해 중심부', board, templateId: template.id,
    exitRule: 'treasures', coinGoal: 0, enemySpeed: 1, damageEnabled: true,
    minimapEnabled: true, timeTarget: STAGE_3_SETTINGS.targetPlayTime,
    cameraZoom: STAGE_3_SETTINGS.cameraZoom,
    powerDurationMs: STAGE_3_SETTINGS.powerupDurationMs, jellyfishSpeed: STAGE_3_SETTINGS.jellyfishSpeed,
    jellyfishHoldDurationMs: STAGE_3_SETTINGS.jellyfishHoldDurationMs, jellyfishRecontactGraceMs: STAGE_3_SETTINGS.jellyfishRecontactGraceMs };
}
