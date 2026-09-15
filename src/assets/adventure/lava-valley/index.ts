import background from './background/lava_valley_background.png';
import runnerBackground from './background/lava_valley_background2.png';
export { default as lavaCliffBackground } from './background/stage2/bg_lava_valley_stage2_lava_cliff.png';
import stage2FossilFragment from './stage2/collectibles/lava_stage2_fossil_fragment.png';
import stage2FossilHudIcon from './stage2/collectibles/lava_stage2_fossil_hud_icon.png';
import stage2LavaWarningMarker from './stage2/hazards/lava_stage2_lava_warning_marker.png';
import stage2LavaEruption from './stage2/hazards/lava_stage2_lava_eruption.png';
import stage2SecretDoorClosed from './stage2/secret/lava_stage2_secret_door_closed.png';
import stage2SecretDoorOpen from './stage2/secret/lava_stage2_secret_door_open.png';
import stage2BonusChestClosed from './stage2/secret/lava_stage2_bonus_chest_closed.png';
import stage2BonusChestOpen from './stage2/secret/lava_stage2_bonus_chest_open.png';
import stage2FossilPickupEffect from './stage2/effects/lava_stage2_fossil_pickup_effect.png';
import stage1VolcanoFoothillsCard from './ui/stage-select/stage1_volcano_foothills_card.png';
import stage2LavaCliffCard from './ui/stage-select/stage2_lava_cliff_card.png';
import stage3VolcanoCoreCard from './ui/stage-select/stage3_volcano_core_card.png';
import stage3MovingPlatformChain from './01_moving_platform_chain.png';
import stage3MovingPlatformHanging from './02_moving_platform_hanging.png';
import stage3FloatingPlatform from './03_floating_platform.png';
import stage3CrackingPlatform from './04_cracking_platform.png';
import stage3BreakingPlatformEffect from './05_breaking_platform_effect.png';
import stage3VolcanoCoreBackground from './01_stage3_volcano_core_background.png';
import stage3TreasureChestClosed from './02_stage3_treasure_chest_closed.png';
import stage3TreasureChestOpen from './03_stage3_treasure_chest_open.png';
import stage3TreasureOpenEffect from './04_stage3_treasure_open_effect.png';
import stageSelectedFrame from './ui/stage-select/stage_selected_frame.png';
import stageLockedOverlay from './ui/stage-select/stage_locked_overlay.png';
import stageCompletedBadge from './ui/stage-select/stage_completed_badge.png';
import stageNewBadge from './ui/stage-select/stage_new_badge.png';
import stageSelectedButton from './ui/stage-select/stage_selected_button.png';
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
export const lavaValleyEventUiAssets = { pauseMenu: pauseMenuPanel, resultClear: resultClearPanel, speechBubble: dinoSpeechBubble, comboPopup } as const;
export const lavaValleyStage2Assets = {
  fossilFragment: stage2FossilFragment,
  fossilHudIcon: stage2FossilHudIcon,
  lavaWarningMarker: stage2LavaWarningMarker,
  lavaEruption: stage2LavaEruption,
  secretDoorClosed: stage2SecretDoorClosed,
  secretDoorOpen: stage2SecretDoorOpen,
  bonusChestClosed: stage2BonusChestClosed,
  bonusChestOpen: stage2BonusChestOpen,
  fossilPickupEffect: stage2FossilPickupEffect,
} as const;
export const lavaValleyStage3Assets = {
  background: stage3VolcanoCoreBackground,
  movingPlatformChain: stage3MovingPlatformChain,
  movingPlatformHanging: stage3MovingPlatformHanging,
  floatingPlatform: stage3FloatingPlatform,
  crackingPlatform: stage3CrackingPlatform,
  breakingPlatformEffect: stage3BreakingPlatformEffect,
  treasureChestClosed: stage3TreasureChestClosed,
  treasureChestOpen: stage3TreasureChestOpen,
  treasureOpenEffect: stage3TreasureOpenEffect,
} as const;
export const lavaValleyStageSelectAssets = {
  cards: {
    1: stage1VolcanoFoothillsCard,
    2: stage2LavaCliffCard,
    3: stage3VolcanoCoreCard,
  },
  selectedFrame: stageSelectedFrame,
  lockedOverlay: stageLockedOverlay,
  completedBadge: stageCompletedBadge,
  newBadge: stageNewBadge,
  selectedButton: stageSelectedButton,
} as const;

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
