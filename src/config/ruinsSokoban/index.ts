import { RUINS_SOKOBAN_STAGE_1 } from './stage1';
import { RUINS_SOKOBAN_STAGE_2 } from './stage2';

export { RUINS_SOKOBAN_STAGE_1, RUINS_SOKOBAN_STAGE_2 };
export { parseSokobanPuzzle, sokobanKey } from './types';
export type { SokobanCompletion, SokobanDirection, SokobanHighlight, SokobanParsedPuzzle, SokobanPoint, SokobanPuzzleConfig, SokobanTutorialConfig } from './types';

export function getRuinsSokobanMissions(stage: 1 | 2) {
  return stage === 1 ? RUINS_SOKOBAN_STAGE_1 : RUINS_SOKOBAN_STAGE_2;
}
