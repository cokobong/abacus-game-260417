import background from './background/lava_valley_background.png';
import runnerBackground from './background/lava_valley_background2.png';
import carnotaurusIdle from './player/carnotaurus_idle_optimized.png';
import carnotaurusRunSheet from './player/carnotaurus_run_sheet.png';
import carnotaurusJumpUp from './player/carnotaurus_jump_up_optimized.png';
import carnotaurusFall from './player/carnotaurus_fall_optimized.png';
import carnotaurusHurt from './player/carnotaurus_hurt_optimized.png';
import carnotaurusVictory from './player/carnotaurus_victory_optimized.png';
import trackStart from './track/lava_track_start.png';
import trackEnd from './track/lava_track_end.png';
import trackCheckpoint from './track/lava_track_checkpoint.png';
import trackTileA from './track/lava_track_tile_a.png';
import trackTileB from './track/lava_track_tile_b.png';
import trackTileC from './track/lava_track_tile_c.png';
import trackCrackOverlay from './track/lava_crack_overlay.png';
import trackEdgeStrip from './track/lava_edge_strip.png';
import lavaRockObstacle from './obstacles/lava_rock_obstacle.png';
import lavaGeyserObstacle from './obstacles/lava_geyser_obstacle.png';
import dinoCoin from './collectibles/dino_coin_optimized.png';
import meatFoodItem from './collectibles/meat_food_item_optimized.png';
import rareEggShard from './collectibles/rare_egg_shard_optimized.png';
import dinosaurContactShadow from './effects/dinosaur_contact_shadow.png';
import jumpDust from './effects/jump_dust.png';
import landingDust from './effects/landing_dust.png';
import coinPickupSparkle from './effects/coin_pickup_sparkle.png';
import itemPickupSparkle from './effects/item_pickup_sparkle.png';
import hurtImpact from './effects/hurt_impact.png';
import checkpointBurst from './effects/checkpoint_burst.png';
import clearBurst from './effects/clear_burst.png';
import upgradedCheckpointFlag from './environment/upgraded_checkpoint_flag.png';
import warningSign from './environment/warning_sign.png';
import lavaTorchTotem from './environment/lava_torch_totem.png';
import magmaCrystalAltar from './environment/magma_crystal_altar.png';
import raceGateArch from './environment/race_gate_arch.png';
import goalPortal from './environment/goal_portal.png';
import treasureChestClosed from './environment/treasure_chest_closed.png';
import treasureChestOpen from './environment/treasure_chest_open.png';
import topHudPanel from './ui/hud/top_hud_panel.png';
import healthPanel from './ui/hud/health_panel.png';
import coinCounterPanel from './ui/hud/coin_counter_panel.png';
import rareFragmentPanel from './ui/hud/rare_fragment_panel.png';
import distanceTimePanel from './ui/hud/distance_time_panel.png';
import jumpButtonNormal from './ui/buttons/jump_button_normal.png';
import jumpButtonPressed from './ui/buttons/jump_button_pressed.png';
import dashButtonReady from './ui/buttons/dash_button_ready.png';
import dashButtonPressed from './ui/buttons/dash_button_pressed.png';
import dashButtonCooldown from './ui/buttons/dash_button_cooldown.png';
import dashButtonDisabled from './ui/buttons/dash_button_disabled.png';
import pauseSettingsButton from './ui/buttons/pause_settings_button.png';
import levelIntroPanel from './ui/events/level_intro_panel.png';
import pauseMenuPanel from './ui/events/pause_menu_panel.png';
import resultClearPanel from './ui/events/result_clear_panel.png';
import dinoSpeechBubble from './ui/events/dino_speech_bubble.png';
import comboPopup from './ui/events/combo_popup.png';

export const lavaValleyPlayerAssets = {
  idle: carnotaurusIdle,
  runSheet: carnotaurusRunSheet,
  jumpUp: carnotaurusJumpUp,
  fall: carnotaurusFall,
  hurt: carnotaurusHurt,
  victory: carnotaurusVictory,
} as const;

export const lavaValleyTrackAssets = {
  start: trackStart,
  end: trackEnd,
  checkpoint: trackCheckpoint,
  tiles: [trackTileA, trackTileB, trackTileC],
  crackOverlay: trackCrackOverlay,
  edgeStrip: trackEdgeStrip,
} as const;

export const lavaValleyHudAssets = { top: topHudPanel, health: healthPanel, coin: coinCounterPanel, rareFragment: rareFragmentPanel, distanceTime: distanceTimePanel } as const;
export const lavaValleyButtonAssets = {
  jumpNormal: jumpButtonNormal,
  jumpPressed: jumpButtonPressed,
  dashReady: dashButtonReady,
  dashPressed: dashButtonPressed,
  dashCooldown: dashButtonCooldown,
  dashDisabled: dashButtonDisabled,
  pauseSettings: pauseSettingsButton,
} as const;
export const lavaValleyEffectAssets = { dinosaurContactShadow, jumpDust, landingDust, coinPickupSparkle, itemPickupSparkle, hurtImpact, checkpointBurst, clearBurst } as const;
export const lavaValleyEnvironmentAssets = { checkpoint: upgradedCheckpointFlag, warningSign, lavaTorchTotem, magmaCrystalAltar, raceGateArch, goalPortal, treasureChestClosed, treasureChestOpen } as const;
export const lavaValleyEventUiAssets = { levelIntro: levelIntroPanel, pauseMenu: pauseMenuPanel, resultClear: resultClearPanel, speechBubble: dinoSpeechBubble, comboPopup } as const;

export const lavaValleyAssets = {
  background,
  runnerBackground,
  player: lavaValleyPlayerAssets,
  track: lavaValleyTrackAssets,
  hud: lavaValleyHudAssets,
  buttons: lavaValleyButtonAssets,
  effects: lavaValleyEffectAssets,
  environment: lavaValleyEnvironmentAssets,
  obstacles: { rock: lavaRockObstacle, geyser: lavaGeyserObstacle },
  collectibles: { coin: dinoCoin, meat: meatFoodItem, rareEggShard },
  events: lavaValleyEventUiAssets,
} as const;
