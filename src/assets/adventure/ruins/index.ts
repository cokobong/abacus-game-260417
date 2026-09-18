import explorerIdle from './characters/ruins_explorer_idle.png';
import explorerPushLeft from './characters/ruins_explorer_push_left.png';
import explorerPushRight from './characters/ruins_explorer_push_right.png';
import explorerPushUp from './characters/ruins_explorer_push_up.png';
import explorerBlockedSide from './characters/ruins_explorer_blocked_side.png';
import explorerBlockedFront from './characters/ruins_explorer_blocked_front.png';
import relicBox from './objects/relic_box.png';
import goalAltar from './objects/ruins_goal_altar.png';
import goalAltarActive from './objects/ruins_goal_altar_active.png';
import sealedGate from './objects/sealed_gate.png';
import floorTile from './tiles/ruins_floor_tile_v2.png';
import wallTile from './tiles/ruins_wall_tile_v2.png';
import cannotPushPopup from './ui/ruins_cannot_push_popup.png';

export const ruinsSokobanAssets = {
  characters: {
    idle: explorerIdle,
    push: { left: explorerPushLeft, right: explorerPushRight, up: explorerPushUp, down: explorerPushUp },
    blocked: { horizontal: explorerBlockedSide, vertical: explorerBlockedFront },
  },
  objects: { relicBox, goalAltar, goalAltarActive, sealedGate },
  tiles: { floor: floorTile, wall: wallTile },
  ui: { cannotPushPopup },
} as const;
