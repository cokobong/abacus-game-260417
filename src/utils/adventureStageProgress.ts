import { ADVENTURE_STAGE_CATALOG, getAdventureStage, type AdventureStageNumber } from '../config/adventureStageCatalog';
import type { AdventureRegionId } from '../data/adventureRegions';

export type AdventureStageState = 'locked' | 'new' | 'unlocked' | 'completed';
export type RegionStageProgress = { completedStages: AdventureStageNumber[]; visitedStages: AdventureStageNumber[] };
export type AdventureStageProgress = Partial<Record<AdventureRegionId, RegionStageProgress>>;
// Future metadata contracts only; no relic counters, rewards, or ending are persisted yet.
export interface FutureRegionRelicProgress { relicProgress: number; regionRelicCompleted: boolean; dexCompleted: boolean }
export interface FutureObeliskProgress { completedRegionRelics: AdventureRegionId[] }

export function normalizeAdventureStageProgress(raw: unknown): AdventureStageProgress {
  const result: AdventureStageProgress = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  for (const region of Object.keys(ADVENTURE_STAGE_CATALOG) as AdventureRegionId[]) {
    const entry = (raw as Record<string, unknown>)[region];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const data = entry as Record<string, unknown>;
    const completed: AdventureStageNumber[] = [];
    // Only a sequential, explicitly recorded clear unlocks the next stage.
    for (const stage of [1, 2, 3] as const) {
      if (!Array.isArray(data.completedStages) || !data.completedStages.includes(stage)) break;
      completed.push(stage);
    }
    const visited = ([1, 2, 3] as const).filter(stage => Array.isArray(data.visitedStages) && data.visitedStages.includes(stage) && (stage === 1 || completed.includes((stage - 1) as AdventureStageNumber)));
    result[region] = { completedStages: completed, visitedStages: visited };
  }
  return result;
}

export function getAdventureStageState(progress: AdventureStageProgress, region: AdventureRegionId, stage: AdventureStageNumber): AdventureStageState {
  const entry = progress[region];
  if (stage > 1 && !entry?.completedStages.includes((stage - 1) as AdventureStageNumber)) return 'locked';
  if (entry?.completedStages.includes(stage)) return 'completed';
  return stage > 1 && !entry?.visitedStages.includes(stage) ? 'new' : 'unlocked';
}

export function canPlayAdventureStage(progress: AdventureStageProgress, region: AdventureRegionId, stage: AdventureStageNumber) {
  return Boolean(getAdventureStage(region, stage)?.implemented) && getAdventureStageState(progress, region, stage) !== 'locked';
}

export function visitAdventureStage(progress: AdventureStageProgress, region: AdventureRegionId, stage: AdventureStageNumber): AdventureStageProgress {
  if (!canPlayAdventureStage(progress, region, stage)) return progress;
  const entry = progress[region] ?? { completedStages: [], visitedStages: [] };
  return { ...progress, [region]: { ...entry, visitedStages: [...new Set([...entry.visitedStages, stage])] } };
}

export function completeAdventureStage(progress: AdventureStageProgress, region: AdventureRegionId, stage: AdventureStageNumber) {
  if (!canPlayAdventureStage(progress, region, stage) || progress[region]?.completedStages.includes(stage)) return { progress, unlockedStage: null };
  const visited = visitAdventureStage(progress, region, stage);
  const entry = visited[region]!;
  return {
    progress: { ...visited, [region]: { ...entry, completedStages: [...entry.completedStages, stage] } },
    unlockedStage: stage < 3 ? (stage + 1) as AdventureStageNumber : null,
  };
}
