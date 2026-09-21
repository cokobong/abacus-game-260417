export const RUINS_SOKOBAN_DEBUG_KEY = 'ruinsSokobanDebugStats';
export interface RuinsSokobanDebugStat {
  missionId: string;
  elapsedSeconds: number;
  undoCount: number;
  resetCount: number;
  hintLevel: number;
  cleared: boolean;
}

export function saveRuinsSokobanDebugStat(stat: RuinsSokobanDebugStat) {
  try {
    const raw = localStorage.getItem(RUINS_SOKOBAN_DEBUG_KEY);
    const previous = raw ? JSON.parse(raw) as Record<string, RuinsSokobanDebugStat> : {};
    localStorage.setItem(RUINS_SOKOBAN_DEBUG_KEY, JSON.stringify({ ...previous, [stat.missionId]: stat }));
  } catch (error) {
    console.warn('[Ruins Sokoban] Debug stats unavailable', error);
  }
}
