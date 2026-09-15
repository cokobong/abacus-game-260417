export type RuinsMirrorDirection = 'north' | 'east' | 'south' | 'west';
export type RuinsMirrorOrientation = 'slash' | 'backslash';
export interface RuinsMirrorCellPosition { column: number; row: number }
export interface RuinsMirrorDefinition extends RuinsMirrorCellPosition { id: string; initial: RuinsMirrorOrientation; rotatable: boolean }
export interface RuinsMirrorSplitterDefinition extends RuinsMirrorCellPosition { id: string; outputs: readonly [RuinsMirrorDirection, RuinsMirrorDirection] }
interface RuinsMirrorPuzzleBase {
  id: string; mission: 1 | 2 | 3 | 4 | 5 | 6; title: string; instruction: string;
  grid: { columns: 4 | 5 | 7; rows: 4 | 5 | 7 }; target: RuinsMirrorCellPosition; targets?: readonly RuinsMirrorCellPosition[];
}
export interface RuinsMirrorFixedPuzzleConfig extends RuinsMirrorPuzzleBase {
  mode: 'fixed'; emitter: RuinsMirrorCellPosition & { direction: RuinsMirrorDirection };
  blockers?: readonly RuinsMirrorCellPosition[]; mirrors: readonly RuinsMirrorDefinition[];
  splitters?: readonly RuinsMirrorSplitterDefinition[]; solution?: Readonly<Record<string, RuinsMirrorOrientation>>; expectedMinimumReflections?: number;
}
/** Legacy placement data is retained only so old saved/config data remains type-compatible. */
export interface RuinsMirrorPlacementPuzzleConfig extends RuinsMirrorPuzzleBase {
  mode: 'placement'; source: RuinsMirrorCellPosition & { direction: RuinsMirrorDirection };
  obstacles: readonly RuinsMirrorCellPosition[]; mirrorSlots: ReadonlyArray<RuinsMirrorCellPosition & { id: string }>; mirrorInventory: number;
}
export type RuinsMirrorPuzzleConfig = RuinsMirrorFixedPuzzleConfig | RuinsMirrorPlacementPuzzleConfig;
export function getRuinsMirrorSource(config: RuinsMirrorPuzzleConfig) { return config.mode === 'placement' ? config.source : config.emitter }
export function getRuinsMirrorObstacles(config: RuinsMirrorPuzzleConfig) { return config.mode === 'placement' ? config.obstacles : (config.blockers ?? []) }
export function getRuinsMirrorTargets(config: RuinsMirrorPuzzleConfig) { return config.targets ?? [config.target] }
