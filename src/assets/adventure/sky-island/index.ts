import idle from './player/pteranodon_idle.png'; import fly1 from './player/pteranodon_fly_1.png'; import fly2 from './player/pteranodon_fly_2.png'; import fly3 from './player/pteranodon_fly_3.png'; import up from './player/pteranodon_up.png'; import down from './player/pteranodon_down.png'; import hurt from './player/pteranodon_hurt.png'; import victory from './player/pteranodon_victory.png';
import far from './background/sky_background_far.png'; import mid from './background/sky_background_mid.png'; import near from './background/sky_background_near.png';
import lightningCloud from './obstacles/lightning_cloud_obstacle.png'; import flyingRock from './obstacles/flying_rock_obstacle.png'; import spikeCloud from './obstacles/spike_cloud_obstacle.png';
import coin from './collectibles/sky_coin.png'; import rareFragment from './collectibles/rare_fragment_sky.png';
import cloudLane from './environment/cloud_lane_strip.png'; import platform from './environment/floating_island_platform.png'; import goalGate from './environment/goal_gate_cloud_arch.png'; import checkpoint from './environment/checkpoint_cloud_flag.png';
import hudTop from './ui/hud/sky_top_hud_panel.png'; import hudHealth from './ui/hud/sky_health_panel.png'; import hudCoin from './ui/hud/sky_coin_panel.png'; import hudFragment from './ui/hud/sky_fragment_panel.png'; import hudDistance from './ui/hud/sky_distance_panel.png';
import pause from './ui/buttons/sky_pause_button.png'; import moveUp from './ui/buttons/move_up_button.png'; import moveDown from './ui/buttons/move_down_button.png'; import boost from './ui/buttons/sky_boost_button_ready.png';
import pauseMenu from './ui/events/pause_menu_panel_sky.png'; import result from './ui/events/result_clear_panel_sky.png'; import combo from './ui/events/combo_popup_sky.png'; import speech from './ui/events/speech_bubble_sky.png';
import speedLines from './effects/fly_speed_lines_sky.png'; import coinSparkle from './effects/coin_pickup_sparkle_sky.png'; import itemSparkle from './effects/item_pickup_sparkle_sky.png'; import hurtBurst from './effects/hurt_cloud_burst.png'; import clearBurst from './effects/clear_burst_sky.png';

export const skyIslandAssets = {
  player: { idle, fly: [fly1, fly2, fly3], up, down, hurt, victory }, background: { far, mid, near },
  obstacles: { flyingRock, lightningCloud, spikeCloud }, collectibles: { coin, rareFragment },
  environment: { cloudLane, platform, goalGate, checkpoint },
  ui: { hud: { top: hudTop, health: hudHealth, coin: hudCoin, fragment: hudFragment, distance: hudDistance }, buttons: { pause, moveUp, moveDown, boost }, events: { pauseMenu, result, combo, speech } },
  effects: { speedLines, coinSparkle, itemSparkle, hurtBurst, clearBurst },
} as const;
