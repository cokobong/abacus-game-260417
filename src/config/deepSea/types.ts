export type DeepSeaDirection = 'up' | 'down' | 'left' | 'right';
export type DeepSeaTilePoint = { column: number; row: number };
export type DeepSeaDiscoveryKind = 'coral' | 'statue' | 'chest';
export type DeepSeaPickupKind = 'coin' | 'smallChest' | 'repair' | 'sonar';

export interface DeepSeaDiscoveryConfig extends DeepSeaTilePoint {
  id: DeepSeaDiscoveryKind;
  label: string;
  rewardCoins?: number;
}

export interface DeepSeaPatrolConfig {
  id: string;
  kind?: 'shark' | 'octopus';
  speedTilesPerSecond: number;
  points: readonly DeepSeaTilePoint[];
  behavior?: 'patrol' | 'chase' | 'ambush';
  detectionRadiusTiles?: number;
  activeSpeedMultiplier?: number;
  leashRadiusTiles?: number;
}

export interface DeepSeaPickupConfig extends DeepSeaTilePoint {
  id: string;
  kind: DeepSeaPickupKind;
  label: string;
  rewardCoins?: number;
  healthRestore?: number;
  sonarRestore?: number;
}

export interface DeepSeaMapConfig {
  id: string;
  stage: 1 | 2;
  columns: number;
  rows: number;
  tileSize: number;
  cameraZoom: number;
  visionRadiusTiles: number;
  sonarRadiusTiles: number;
  sonarUses: number;
  playerStart: DeepSeaTilePoint;
  exit: DeepSeaTilePoint;
  requiredDiscoveries: number;
  walls: ReadonlySet<string>;
  discoveries: readonly DeepSeaDiscoveryConfig[];
  patrols: readonly DeepSeaPatrolConfig[];
  pickups?: readonly DeepSeaPickupConfig[];
}

export const deepSeaTileKey = ({ column, row }: DeepSeaTilePoint) => `${column},${row}`;
