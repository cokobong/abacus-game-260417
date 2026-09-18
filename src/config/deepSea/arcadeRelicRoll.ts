import { STAGE_3_SETTINGS } from './arcadeStage3';

export function rollDeepSeaRelicPart(missingPartIds: readonly string[], consecutiveMisses: number, random: () => number = Math.random) {
  if (missingPartIds.length === 0) return { partId: undefined, consecutiveMisses };
  const guaranteed = consecutiveMisses >= STAGE_3_SETTINGS.relicPityThreshold;
  if (!guaranteed && random() >= STAGE_3_SETTINGS.relicDropChance) {
    return { partId: undefined, consecutiveMisses: consecutiveMisses + 1 };
  }
  const index = Math.min(missingPartIds.length - 1, Math.floor(random() * missingPartIds.length));
  return { partId: missingPartIds[index], consecutiveMisses: 0 };
}
