import { RUINS_SOKOBAN_STAGE_2, RUINS_SOKOBAN_STAGE_3, RUINS_SOKOBAN_STAGE_3_MILESTONES } from '../config/ruinsSokoban';
import type { RegionRelicProgress } from '../config/worldMapRelicConfig';

const ALL_PERSISTED_MISSIONS = [...RUINS_SOKOBAN_STAGE_2, ...RUINS_SOKOBAN_STAGE_3];

export function normalizeRuinsSokobanClears(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const valid = new Set(ALL_PERSISTED_MISSIONS.map(mission => mission.id));
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && valid.has(id)))];
}

export function firstUnclearedRuinsMission(clearedIds: readonly string[], stage: 2 | 3 = 2) {
  const cleared = new Set(clearedIds);
  const missions = stage === 2 ? RUINS_SOKOBAN_STAGE_2 : RUINS_SOKOBAN_STAGE_3;
  return missions.findIndex(mission => !cleared.has(mission.id));
}

export function clearRuinsMission(clearedIds: readonly string[], missionId: string) {
  return normalizeRuinsSokobanClears([...clearedIds, missionId]);
}

export function isRuinsMissionUnlocked(clearedIds: readonly string[], missionIndex: number) {
  return missionIndex === 0 || clearedIds.includes(RUINS_SOKOBAN_STAGE_3[missionIndex - 1]?.id);
}

export function completeRuinsMissionWithReward(
  clearedIds: readonly string[],
  relicProgress: RegionRelicProgress,
  missionId: string,
) {
  const normalized = normalizeRuinsSokobanClears(clearedIds);
  const alreadyCleared = normalized.includes(missionId);
  const nextClearedIds = alreadyCleared ? normalized : clearRuinsMission(normalized, missionId);
  const milestonePartId = RUINS_SOKOBAN_STAGE_3_MILESTONES[missionId];
  const awardedPartId = !alreadyCleared && milestonePartId && !relicProgress.ownedPartIds.includes(milestonePartId) ? milestonePartId : undefined;
  const ownedPartIds = awardedPartId ? [...relicProgress.ownedPartIds, awardedPartId] : relicProgress.ownedPartIds;
  return {
    clearedMissionIds: nextClearedIds,
    relicProgress: { ...relicProgress, ownedPartIds, stage3FirstCleared: relicProgress.stage3FirstCleared || missionId.startsWith('ruins-sokoban-3-') },
    newlyCleared: !alreadyCleared,
    awardedPartId,
  };
}

export type RuinsMissionCompletionResult = ReturnType<typeof completeRuinsMissionWithReward>;
