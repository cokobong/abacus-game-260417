export type IceMissionId = '1-1' | '1-2' | '1-3' | `2-${1 | 2 | 3 | 4}`
  | `3-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`;
export type IceMissionKind = 'tutorial' | 'sample' | 'skeleton';
export type IceMapTemplateId = 'LAYOUT_A_BASIC_TWO_FLOOR' | 'LAYOUT_B_CENTER_LADDER' | 'LAYOUT_C_U_LINE' | 'LAYOUT_D_MERGE' | 'LAYOUT_E_PARTIAL_THREE_FLOOR' | 'LAYOUT_F_CENTRAL_RESTORATION';
export type IceIssueType = 'freeze' | 'jam' | 'power' | 'conveyor_block' | 'penguin_interference';
export type IceTool = 'toolHeat' | 'toolRepair' | 'toolElectric' | 'interact';
export type IceVisualState = 'raw' | 'cut' | 'cracked' | 'silhouette' | 'exposed' | 'cleaned' | 'mounted';
export type IceSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IceQueuePolicy = 'fifo' | 'alternate' | 'missionSequence';
export type IceFloorId = 'lower' | 'upper' | 'control';

export interface IcePoint { x: number; y: number }
export interface IceMachineDefinition {
  id: string; name: string; kind: string; x: number; y: number; floor: IceFloorId;
  criticality: 1 | 2 | 3; allowedIssues: readonly IceIssueType[];
}
export interface IceMapTemplate {
  id: IceMapTemplateId;
  worldBounds: { width: number; height: number };
  cameraBounds: { x: number; y: number; width: number; height: number };
  floors: readonly { id: IceFloorId; y: number; xMin: number; xMax: number }[];
  ladders: readonly { id: string; x: number; from: IceFloorId; to: IceFloorId }[];
  playerSpawn: { x: number; floor: IceFloorId };
  machines: readonly IceMachineDefinition[];
  conveyorPath: readonly (IcePoint & { visualState: IceVisualState; machineId?: string })[];
  queueAnchors: readonly IcePoint[];
  restorationStand: IcePoint & { floor: IceFloorId };
  penguinSpawnCandidates: readonly (IcePoint & { floor: IceFloorId; machineId: string })[];
  issuePoints: readonly { machineId: string; allowedTypes: readonly IceIssueType[] }[];
}
export interface IceEventCandidate { issueType: IceIssueType; targetMachineIds: readonly string[]; weight: number; severity: IceSeverity }
export interface IceEventSlot {
  id: string; timeWindowSec: readonly [number, number]; candidates: readonly IceEventCandidate[];
  progressAtLeast?: number; concurrencyGroup?: string; suppressNearFinishSec?: number;
}
export interface IceEventPattern { id: string; slots: readonly IceEventSlot[] }
export interface IceMissionConfig {
  id: IceMissionId; stage: 1 | 2 | 3; kind: IceMissionKind; title: string;
  nextMissionId: IceMissionId | null;
  tutorial: {
    startTitle: string; startBody: string; startButton: string; completionMessage: string;
    requireStartAction: boolean; guidedIssueTypes: readonly IceIssueType[];
  };
  dinosaur?: string; fossilPartIds: readonly string[]; mapTemplate: IceMapTemplateId;
  durationSec: number; targetPlayTime: readonly [number, number]; playerSpeed: number;
  production: {
    speed: number; processItemCount: number; processTimes: Readonly<Record<string, number>>;
    sharedMachineIds: readonly string[]; backlogCapacity: number; queuePolicy: IceQueuePolicy;
    restartSurgeMultiplier: number; restartSurgeDuration: number;
    arcadeLoop: boolean; spawnInterval: number; targetCompleted: number; overloadPauseDuration: number;
  };
  issues: {
    allowedTypes: readonly IceIssueType[]; interval: readonly [number, number]; warningDuration: number;
    repairDuration: number; wrongToolPenalty: number; maxSimultaneous: 1 | 2 | 3;
    severity: IceSeverity;
  };
  penguins: { count: 0 | 1 | 2; interferenceRate: number; behaviorPatterns: readonly ('blockConveyor' | 'switchOff' | 'dropIceDebris' | 'blockAccess')[] };
  objective: { requiredParts: readonly string[]; completionType: 'partMounted' | 'sampleDisplay' | 'fullSkeleton' };
  reward: { type: 'none' } | { type: 'sampleCollection'; id: string } | { type: 'skeletonProgress'; id: string };
  eventPatternId: string;
}

export const ICE_ISSUE_TOOLS: Readonly<Record<IceIssueType, IceTool>> = {
  freeze: 'toolHeat', jam: 'toolRepair', power: 'toolElectric', conveyor_block: 'interact', penguin_interference: 'interact',
};
