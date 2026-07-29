import dinopediaDefault from './nav_dinopedia_default.png';
import dinopediaSelected from './nav_dinopedia_selected.png';
import myDinosaurDefault from './nav_my_dinosaur_default.png';
import myDinosaurSelected from './nav_my_dinosaur_selected.png';
import settingsDefault from './nav_settings_default.png';
import settingsSelected from './nav_settings_selected.png';
import shopDefault from './nav_shop_default.png';
import shopSelected from './nav_shop_selected.png';
import trainingDefault from './nav_training_default.png';
import trainingSelected from './nav_training_selected.png';

export const bottomNavAssets = {
  training: { default: trainingDefault, selected: trainingSelected },
  dino: { default: myDinosaurDefault, selected: myDinosaurSelected },
  shop: { default: shopDefault, selected: shopSelected },
  pokedex: { default: dinopediaDefault, selected: dinopediaSelected },
  settings: { default: settingsDefault, selected: settingsSelected },
} as const;
