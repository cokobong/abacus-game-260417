import background from './background/lava_valley_background.png';
import runnerBackground from './background/lava_valley_background2.png';
import platformDefault from './platforms/platform_default.png';
import platformSelected from './platforms/platform_selected.png';
import platformSuccess from './platforms/platform_success.png';
import platformFailure from './platforms/platform_failure.png';
import startRock from './platforms/start_rock.png';
import destinationRock from './platforms/destination_rock.png';
import dinosaurContactShadow from './effects/dinosaur_contact_shadow.png';
import jumpTakeoffDust from './effects/jump_takeoff_dust.png';
import landingImpactDust from './effects/landing_impact_dust.png';
import platformCrackOverlay from './effects/platform_crack_overlay.png';
import successSparkles from './effects/success_sparkles.png';
import treasureGoldenRays from './effects/treasure_golden_rays.png';
import explorerRewardPouch from './rewards/explorer_reward_pouch.png';
import ruinDoorLocked from './rewards/ruin_door_locked.png';
import treasureChestClosed from './rewards/treasure_chest_closed.png';
import treasureChestOpen from './rewards/treasure_chest_open.png';

export const lavaValleyAssets = {
  background,
  runnerBackground,
  platforms: {
    default: platformDefault,
    selected: platformSelected,
    success: platformSuccess,
    failure: platformFailure,
    start: startRock,
    destination: destinationRock,
  },
  effects: {
    dinosaurContactShadow,
    jumpTakeoffDust,
    landingImpactDust,
    platformCrackOverlay,
    successSparkles,
    treasureGoldenRays,
  },
  rewards: {
    explorerRewardPouch,
    ruinDoorLocked,
    treasureChestClosed,
    treasureChestOpen,
  },
} as const;
