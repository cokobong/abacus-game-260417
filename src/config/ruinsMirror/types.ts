export type RuinsMirrorDirection = 'north' | 'east' | 'south' | 'west';
export type RuinsMirrorOrientation = 'slash' | 'backslash';

export interface RuinsMirrorCellPosition {
  column: number;
  row: number;
}

export interface RuinsMirrorDefinition extends RuinsMirrorCellPosition {
  id: string;
  initial: RuinsMirrorOrientation;
  rotatable: boolean;
}

interface RuinsMirrorPuzzleBase {
  id: string;
  mission: 1 | 2 | 3 | 4;
  title: string;
  instruction: string;
  grid: { columns: 4 | 5; rows: 4 | 5 };
  target: RuinsMirrorCellPosition;
}

export interface RuinsMirrorFixedPuzzleConfig extends RuinsMirrorPuzzleBase {
  mode: 'fixed';
  emitter: RuinsMirrorCellPosition & { direction: RuinsMirrorDirection };
  blockers?: RuinsMirrorCellPosition[];
  mirrors: RuinsMirrorDefinition[];
}

export interface RuinsMirrorPlacementPuzzleConfig extends RuinsMirrorPuzzleBase {
  mode: 'placement';
  source: RuinsMirrorCellPosition & { direction: RuinsMirrorDirection };
  obstacles: RuinsMirrorCellPosition[];
  mirrorSlots: Array<RuinsMirrorCellPosition & { id: string }>;
  mirrorInventory: number;
}

export type RuinsMirrorPuzzleConfig = RuinsMirrorFixedPuzzleConfig | RuinsMirrorPlacementPuzzleConfig;

export function getRuinsMirrorSource(config: RuinsMirrorPuzzleConfig) {
  return config.mode === 'placement' ? config.source : config.emitter;
}

export function getRuinsMirrorObstacles(config: RuinsMirrorPuzzleConfig) {
  return config.mode === 'placement' ? config.obstacles : (config.blockers ?? []);
}
