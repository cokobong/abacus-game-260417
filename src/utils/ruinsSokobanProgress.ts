import { RUINS_SOKOBAN_STAGE_2 } from '../config/ruinsSokoban';

export function normalizeRuinsSokobanClears(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const valid = new Set(RUINS_SOKOBAN_STAGE_2.map(mission => mission.id));
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && valid.has(id)))];
}

export function firstUnclearedRuinsMission(clearedIds: readonly string[]) {
  const cleared = new Set(clearedIds);
  return RUINS_SOKOBAN_STAGE_2.findIndex(mission => !cleared.has(mission.id));
}

export function clearRuinsMission(clearedIds: readonly string[], missionId: string) {
  return normalizeRuinsSokobanClears([...clearedIds, missionId]);
}
