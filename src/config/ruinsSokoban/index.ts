import { RUINS_SOKOBAN_STAGE_1 } from './stage1';
import { RUINS_SOKOBAN_STAGE_2 } from './stage2';
import { RUINS_SOKOBAN_STAGE_3 } from './stage3';

export { RUINS_SOKOBAN_STAGE_1, RUINS_SOKOBAN_STAGE_2, RUINS_SOKOBAN_STAGE_3 };
export { RUINS_SOKOBAN_STAGE_3_MILESTONES } from './stage3';
export { DIRECT_HINT_RESET_THRESHOLD, DIRECTION_HINT_RESET_THRESHOLD, SOFT_HINT_RESET_THRESHOLD, VISUAL_HINT_RESET_THRESHOLD } from './hintEscalation';
export { parseSokobanPuzzle, sokobanKey } from './types';
export type { SokobanCompletion, SokobanDirection, SokobanHighlight, SokobanHintMilestone, SokobanParsedPuzzle, SokobanPoint, SokobanPuzzleConfig, SokobanRuntimeSnapshot, SokobanTutorialConfig } from './types';

export function getRuinsSokobanMissions(stage: 1 | 2 | 3) {
  return stage === 1 ? RUINS_SOKOBAN_STAGE_1 : stage === 2 ? RUINS_SOKOBAN_STAGE_2 : RUINS_SOKOBAN_STAGE_3;
}
