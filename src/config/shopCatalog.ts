export const SHOP_CATALOG = {
  food: ['basic-meat', 'soft-berry', 'leaf-snack', 'dino-cookie', 'fish-bite', 'berry-basket', 'strong-meat', 'sweet-berry'],
  egg: ['green-starter-egg', 'rare-spark-egg', 'green-forest-rare-egg', 'volcano-island-rare-egg', 'ocean-blue-egg', 'legend-egg'],
  hatchItem: ['hatch-warm-stone', 'hatch-warm-blanket', 'hatch-spark-energy'],
} as const;

export type ShopCatalogCategory = keyof typeof SHOP_CATALOG;
export type LavaValleyShopDropCategory = 'food' | 'hatchItem';

export const LAVA_VALLEY_SHOP_DROP_POOLS: Record<LavaValleyShopDropCategory, readonly string[]> = {
  food: SHOP_CATALOG.food,
  hatchItem: SHOP_CATALOG.hatchItem,
};
