import idle from './player/pteranodon_idle.png'; import fly1 from './player/pteranodon_fly_1.png'; import fly2 from './player/pteranodon_fly_2.png'; import fly3 from './player/pteranodon_fly_3.png'; import up from './player/pteranodon_up.png'; import down from './player/pteranodon_down.png'; import hurt from './player/pteranodon_hurt.png'; import victory from './player/pteranodon_victory.png';
import far from './background/sky_background_far.png'; import mid from './background/sky_background_mid.png'; import near from './background/sky_background_near.png';
import stage1Background from './background/sky_stage1_background.png'; import stage2Background from './background/sky_stage2_background.png'; import stage3Background from './background/sky_stage3_background.png';
import stage1Entry from './stages/sky_island_stage_1_entry.png'; import stage2Entry from './stages/sky_island_stage_2_entry.png'; import stage3Entry from './stages/sky_island_stage_3_entry.png';
import lightningCloud from './obstacles/lightning_cloud_obstacle.png'; import flyingRock from './obstacles/flying_rock_obstacle.png'; import spikeCloud from './obstacles/spike_cloud_obstacle.png';
import bird1 from './obstacles/bird_flock_obstacle_01.png'; import bird2 from './obstacles/bird_flock_obstacle_02.png'; import bird3 from './obstacles/bird_flock_obstacle_03.png'; import lightningStrike from './obstacles/lightning_strike_effect.png';
import coin from './collectibles/sky_coin.png'; import rareFragment from './collectibles/rare_fragment_sky.png';
import cloudLane from './environment/cloud_lane_strip.png'; import platform from './environment/floating_island_platform.png'; import goalGate from './environment/goal_gate_cloud_arch.png'; import checkpoint from './environment/checkpoint_cloud_flag.png';
import hudTop from './ui/hud/sky_top_hud_panel.png'; import hudHealth from './ui/hud/sky_health_panel.png'; import hudCoin from './ui/hud/sky_coin_panel.png'; import hudFragment from './ui/hud/sky_fragment_panel.png'; import hudDistance from './ui/hud/sky_distance_panel.png';
import pause from './ui/buttons/sky_pause_button.png'; import moveUp from './ui/buttons/move_up_button.png'; import moveDown from './ui/buttons/move_down_button.png'; import shield from './ui/buttons/sky_shield_button_ready.png';
import pauseMenu from './ui/events/pause_menu_panel_sky.png'; import result from './ui/events/result_clear_panel_sky.png'; import combo from './ui/events/combo_popup_sky.png'; import speech from './ui/events/speech_bubble_sky.png';
import speedLines from './effects/fly_speed_lines_sky.png'; import coinSparkle from './effects/coin_pickup_sparkle_sky.png'; import itemSparkle from './effects/item_pickup_sparkle_sky.png'; import hurtBurst from './effects/hurt_cloud_burst.png'; import clearBurst from './effects/clear_burst_sky.png';

export const skyIslandAssets = {
  player: { idle, fly: [fly1, fly2, fly3], up, down, hurt, victory }, background: { far, mid, near }, stageBackgrounds: { 1: stage1Background, 2: stage2Background, 3: stage3Background }, stageEntries: { 1: stage1Entry, 2: stage2Entry, 3: stage3Entry },
  obstacles: { flyingRock, lightningCloud, spikeCloud, bird: [bird1, bird2, bird3], lightningStrike }, collectibles: { coin, rareFragment },
  environment: { cloudLane, platform, goalGate, checkpoint },
  ui: { hud: { top: hudTop, health: hudHealth, coin: hudCoin, fragment: hudFragment, distance: hudDistance }, buttons: { pause, moveUp, moveDown, shield }, events: { pauseMenu, result, combo, speech } },
  effects: { speedLines, coinSparkle, itemSparkle, hurtBurst, clearBurst },
} as const;
