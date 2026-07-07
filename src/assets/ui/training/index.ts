const trainingModules = import.meta.glob('./*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const characterModules = import.meta.glob('../../characters/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function trainingAsset(fileName: string) {
  return trainingModules[`./${fileName}`];
}

export const trainingUiAssets = {
  titleBanner: trainingAsset('training_title_banner.png'),
  problemBadge: trainingAsset('badge_problem_progress.png'),
  correctBadge: trainingAsset('badge_correct.png'),
  wrongBadge: trainingAsset('badge_wrong.png'),
  cheerBubble: trainingAsset('speechbubble_cheer_01.png'),
  rewardCoin: trainingAsset('reward_coin_icon.png'),
  rewardPebble: trainingAsset('reward_item_pebble_icon.png'),
  rewardEgg: trainingAsset('reward_egg_icon.png'),
  hintLamp: trainingAsset('hint_lamp_icon.png'),
  bluetoothWait: trainingAsset('bluetooth_wait_icon.png'),
  cornerTopLeft: trainingAsset('corner_leaf_top_left.png'),
  cornerTopRight: trainingAsset('corner_leaf_top_right.png'),
  cornerBottomLeft: trainingAsset('corner_leaf_bottom_left.png'),
  cornerBottomRight: trainingAsset('corner_leaf_bottom_right.png'),
  footprints: trainingAsset('dino_footprints_small.png'),
  cheerDino: characterModules['../../characters/training_cheer_dino.png'],
} as const;

