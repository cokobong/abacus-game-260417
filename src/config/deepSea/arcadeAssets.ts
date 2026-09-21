// Vite resolves the moved inbox files here. Phaser only decodes the keys used by a run.
const urls = import.meta.glob('../../assets/adventure/deep-sea/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

function asset(folder: string, name: string) {
  const path = `../../assets/adventure/deep-sea/${folder}/deepsea_${name}.png`;
  const url = urls[path];
  if (!url) throw new Error(`Missing deep-sea asset: ${path}`);
  return { key: `deepsea:${folder}:${name}`, url };
}

export const DEEP_SEA_ASSETS = {
  player: {
    normal: asset('player', 'submarine_normal'), damaged: asset('player', 'submarine_damaged'),
    critical: asset('player', 'submarine_critical'), powered: asset('player', 'submarine_powered'),
  },
  enemy: { shark: asset('enemies', 'enemy_shark'), octopus: asset('enemies', 'enemy_octopus'), jellyfish: asset('enemies', 'enemy_jellyfish') },
  world: {
    floor: asset('world', 'tile_floor'), wall: asset('world', 'tile_wall'), rock: asset('world', 'rock'),
    ruins: asset('world', 'ruins'), seaweed: asset('world', 'seaweed'), coral: asset('world', 'coral'), wreck: asset('world', 'wreck'),
  },
  gate: { open: asset('gates', 'gate_open'), warning: asset('gates', 'gate_warning'), closed: asset('gates', 'gate_closed') },
  exit: { locked: asset('exits', 'exit_locked'), active: asset('exits', 'exit_active') },
  pickup: { coin: asset('pickups', 'coin'), orb: asset('pickups', 'powerup_electric_orb') },
  treasure: {
    pearl: asset('treasures', 'treasure_pearl'), map: asset('treasures', 'treasure_map'),
    tablet: asset('treasures', 'treasure_relic_tablet'), trident: asset('treasures', 'treasure_trident'),
    vase: asset('treasures', 'treasure_vase'), crown: asset('treasures', 'treasure_crown'),
  },
  effect: { bubbles: asset('effects', 'bubbles'), sand: asset('effects', 'sand_cloud'), portal: asset('effects', 'portal_fx') },
  ui: {
    health: asset('ui', 'hud_submarine_status'), coin: asset('ui', 'hud_coin_count'),
    treasure: asset('ui', 'hud_treasure_count'), power: asset('ui', 'hud_powerup_timer'),
    minimapPlayer: asset('ui', 'minimap_player'), minimapTreasure: asset('ui', 'minimap_treasure'),
    minimapGate: asset('ui', 'minimap_gate'), tutorial: asset('ui', 'tutorial_popup_panel'),
    objective: asset('ui', 'objective_banner'), result: asset('ui', 'result_card_frame'),
  },
  background: {
    stage1: asset('backgrounds', 'stage1_bg_game'), stage2: asset('backgrounds', 'stage2_bg_game'),
    stage3: asset('backgrounds', 'stage3_bg_game'),
  },
} as const;

export type DeepSeaAsset = { key: string; url: string };

export function deepSeaTreasureAsset(id: string): DeepSeaAsset | null {
  const treasure = DEEP_SEA_ASSETS.treasure;
  const mapping: Record<string, DeepSeaAsset> = {
    compass: treasure.map,
    'gold-jar': treasure.vase,
    'broken-crown': treasure.crown,
    'blue-jewel-box': treasure.tablet,
    'stage3-pearl': treasure.pearl,
    'stage3-crown': treasure.crown,
    'stage3-trident': treasure.trident,
  };
  return mapping[id] ?? null;
}
