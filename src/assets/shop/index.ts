export { default as shopBackground } from './backgrounds/shop_bg.png';
export { default as shopTitleBanner } from './panels/shop_title_banner.png';
export { default as shopItemCard } from './panels/shop_item_card.png';
export { default as shopPriceChip } from './panels/shop_price_chip.png';
export { default as shopStatusChip } from './panels/shop_status_chip.png';
export { default as shopBuyButtonDefault } from './buttons/shop_btn_buy_default.png';
export { default as shopBuyButtonPressed } from './buttons/shop_btn_buy_pressed.png';
export { default as shopBuyButtonDisabled } from './buttons/shop_btn_buy_disabled.png';
export { default as shopMyDinoButton } from './buttons/shop_btn_my_dino.png';
export { default as shopIconCategoryFoodDefault } from './categories/shop_icon_category_food_default.png';
export { default as shopIconCategoryFoodSelected } from './categories/shop_icon_category_food_selected.png';
export { default as shopIconCategoryEggDefault } from './categories/shop_icon_category_egg_default.png';
export { default as shopIconCategoryEggSelected } from './categories/shop_icon_category_egg_selected.png';
export { default as shopIconCategoryHatchDefault } from './categories/shop_icon_category_hatch_default.png';
export { default as shopIconCategoryHatchSelected } from './categories/shop_icon_category_hatch_selected.png';
import shopItemFoodMeat from './items/food/shop_item_food_meat.png';
import shopItemFoodSoftBerry from './items/food/shop_item_food_soft_berry.png';
import shopItemFoodLeaf from './items/food/shop_item_food_leaf.png';
import shopItemFoodDinoCookie from './items/food/shop_item_food_dino_cookie.png';
import shopItemFoodFish from './items/food/shop_item_food_fish.png';
import shopItemFoodFruitBasket from './items/food/shop_item_food_fruit_basket.png';
import shopItemFoodToughMeat from './items/food/shop_item_food_tough_meat.png';
import shopItemFoodSweetBerry from './items/food/shop_item_food_sweet_berry.png';

export {
  shopItemFoodMeat,
  shopItemFoodSoftBerry,
  shopItemFoodLeaf,
  shopItemFoodDinoCookie,
  shopItemFoodFish,
  shopItemFoodFruitBasket,
  shopItemFoodToughMeat,
  shopItemFoodSweetBerry,
};

export const shopFoodItemImages: Readonly<Record<string, string>> = {
  'basic-meat': shopItemFoodMeat,
  'soft-berry': shopItemFoodSoftBerry,
  'leaf-snack': shopItemFoodLeaf,
  'dino-cookie': shopItemFoodDinoCookie,
  'fish-bite': shopItemFoodFish,
  'berry-basket': shopItemFoodFruitBasket,
  'strong-meat': shopItemFoodToughMeat,
  'sweet-berry': shopItemFoodSweetBerry,
};
export { default as shopItemEggGreen } from './items/eggs/shop_item_egg_green.png';
export { default as shopItemEggSparkle } from './items/eggs/shop_item_egg_sparkle.png';
export { default as shopItemEggForestRare } from './items/eggs/shop_item_egg_forest_rare.png';
export { default as shopItemEggVolcanoRare } from './items/eggs/shop_item_egg_volcano_rare.png';
export { default as shopItemEggOcean } from './items/eggs/shop_item_egg_ocean.png';
export { default as shopItemEggLegendary } from './items/eggs/shop_item_egg_legendary.png';
import shopItemHatchWarmStone from './items/hatch/shop_item_hatch_warm_stone.png';
import shopItemHatchWarmBlanket from './items/hatch/shop_item_hatch_warm_blanket.png';
import shopItemHatchSparkleEnergy from './items/hatch/shop_item_hatch_sparkle_energy.png';
export { shopItemHatchWarmStone, shopItemHatchWarmBlanket, shopItemHatchSparkleEnergy };
export { default as shopItemHatchRareFragment } from './items/hatch/shop_item_hatch_rare_fragment.png';
export const shopItemImages: Readonly<Record<string, string>> = {
  ...shopFoodItemImages,
  'hatch-warm-stone': shopItemHatchWarmStone,
  'hatch-warm-blanket': shopItemHatchWarmBlanket,
  'hatch-spark-energy': shopItemHatchSparkleEnergy,
};
export { default as shopPopupPanel } from './popup/shop_popup_panel.png';
export { default as shopPopupEffectPanel } from './popup/shop_popup_effect_panel.png';
export { default as shopPopupPricePanel } from './popup/shop_popup_price_panel.png';
export { default as shopPopupOwnedPanel } from './popup/shop_popup_owned_panel.png';
export { default as shopPopupBuyButton } from './popup/shop_popup_btn_buy.png';
export { default as shopPopupExitButton } from './popup/shop_popup_btn_exit.png';
