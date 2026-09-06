import type { CoinRewardMultiplier } from './rewardConfig';
import { LAVA_VALLEY_SHOP_DROP_POOLS, type LavaValleyShopDropCategory } from './shopCatalog';

export type MinigameId = 'lava-stepping-stones' | 'sky-number-clouds' | 'number-ruins';

export const MINIGAME_ENTRY_COST: Partial<Record<MinigameId, number>> = {
  'lava-stepping-stones': 150,
  'sky-number-clouds': 150,
};

export const LAVA_VALLEY_ENTRY_COST = MINIGAME_ENTRY_COST['lava-stepping-stones']!;
export const SKY_ISLAND_ENTRY_COST = MINIGAME_ENTRY_COST['sky-number-clouds']!;
export const SKY_ISLAND_MOCK_MODE = true;
export const LAVA_VALLEY_RARE_FRAGMENT_ITEM_ID = 'rare-egg-fragment';
export const LAVA_VALLEY_DURATION_SECONDS = 120;
export const SKY_ISLAND_DURATION_SECONDS = 120;
export const MAX_RARE_FRAGMENTS_PER_RUN = 3;
export type RareFragmentDifficulty = 'easy' | 'normal' | 'challenge';
export const RARE_FRAGMENT_COUNT_WEIGHTS: Record<RareFragmentDifficulty, readonly [number, number, number, number]> = {
  easy: [0.30, 0.52, 0.15, 0.03],
  normal: [0.22, 0.50, 0.23, 0.05],
  challenge: [0.15, 0.48, 0.28, 0.09],
};
export interface RareFragmentSpawn { id: number; spawnAtSeconds: number }

export function rollRareFragmentCount(difficulty: RareFragmentDifficulty, random: () => number = Math.random) {
  const roll = random(); let cumulative = 0;
  for (let count = 0; count <= MAX_RARE_FRAGMENTS_PER_RUN; count += 1) { cumulative += RARE_FRAGMENT_COUNT_WEIGHTS[difficulty][count]; if (roll < cumulative) return count; }
  return MAX_RARE_FRAGMENTS_PER_RUN;
}

export function scheduleRareFragmentSpawns(count: number, durationSeconds: number, random: () => number = Math.random): RareFragmentSpawn[] {
  const normalizedCount = Math.min(MAX_RARE_FRAGMENTS_PER_RUN, Math.max(0, Math.floor(count)));
  const ranges = normalizedCount === 1 ? [[.29, .75]] : normalizedCount === 2 ? [[.21, .42], [.63, .88]] : normalizedCount === 3 ? [[.17, .29], [.46, .58], [.79, .92]] : [];
  return ranges.map(([start, end], index) => ({ id: index + 1, spawnAtSeconds: durationSeconds * (start + random() * (end - start)) }));
}

export function createRareFragmentSpawnPlan(difficulty: RareFragmentDifficulty, durationSeconds: number, random: () => number = Math.random) {
  return scheduleRareFragmentSpawns(rollRareFragmentCount(difficulty, random), durationSeconds, random);
}
const LAVA_VALLEY_TIMING_REFERENCE_SECONDS = 90;
export const LAVA_VALLEY_COLLECTIBLE_LANES = { low: 4, high: 18 } as const;
export const LAVA_VALLEY_COIN_PATTERNS = [
  [LAVA_VALLEY_COLLECTIBLE_LANES.low, LAVA_VALLEY_COLLECTIBLE_LANES.low, LAVA_VALLEY_COLLECTIBLE_LANES.low],
  [LAVA_VALLEY_COLLECTIBLE_LANES.high, LAVA_VALLEY_COLLECTIBLE_LANES.high],
  [LAVA_VALLEY_COLLECTIBLE_LANES.low, LAVA_VALLEY_COLLECTIBLE_LANES.low, LAVA_VALLEY_COLLECTIBLE_LANES.high, LAVA_VALLEY_COLLECTIBLE_LANES.high],
] as const;
export type LavaValleyEndReason = 'completed' | 'hp_depleted' | 'manual_restart' | 'exit';
export const LAVA_VALLEY_REWARDS_CONFIG = {
  gameDurationSeconds: LAVA_VALLEY_DURATION_SECONDS,
  shopItemDrops: {
    minPerRun: 1,
    maxPerRun: 2,
    categoryWeights: { food: 0.7, hatchItem: 0.3 },
  },
  rareFragments: { maxPerRun: MAX_RARE_FRAGMENTS_PER_RUN },
} as const;

export interface MinigameItemReward {
  itemId: string;
  quantity: number;
}

export interface MinigameRunRewards {
  coins: number;
  rareFragments: number;
  shopItems: MinigameItemReward[];
}

export interface LavaValleyShopDropPlanItem {
  id: number;
  category: LavaValleyShopDropCategory;
  itemId: string;
  spawnAtSeconds: number;
}

export interface MinigameEconomyState {
  coins: number;
  inventory: Array<{ itemId: string; quantity: number }>;
}

export function chargeMinigameEntry(coins: number, gameId: MinigameId) {
  const cost = MINIGAME_ENTRY_COST[gameId];
  if (cost === undefined || coins < cost) return null;
  return coins - cost;
}

export function shouldCommitLavaValleyRewards(reason: LavaValleyEndReason) {
  return reason === 'completed';
}

export function lavaValleyRetryRequiresEntry(reason: LavaValleyEndReason) {
  return reason === 'completed';
}

export function getAdjustedMinigameCoins(coins: number, multiplier: CoinRewardMultiplier) {
  return Math.max(0, Math.round(Math.max(0, coins) * multiplier));
}

export function normalizeLavaValleyRewards(rewards: MinigameRunRewards): MinigameRunRewards {
  const allowedIds = new Set([...LAVA_VALLEY_SHOP_DROP_POOLS.food, ...LAVA_VALLEY_SHOP_DROP_POOLS.hatchItem]);
  const quantities = rewards.shopItems.reduce<Record<string, number>>((result, item) => {
    if (allowedIds.has(item.itemId) && Number.isFinite(item.quantity) && item.quantity > 0) {
      result[item.itemId] = (result[item.itemId] ?? 0) + Math.floor(item.quantity);
    }
    return result;
  }, {});
  return {
    coins: Math.max(0, Math.floor(rewards.coins)),
    rareFragments: Math.min(MAX_RARE_FRAGMENTS_PER_RUN, Math.max(0, Math.floor(rewards.rareFragments))),
    shopItems: Object.entries(quantities).map(([itemId, quantity]) => ({ itemId, quantity })),
  };
}

export function createLavaValleyShopDropPlan(random: () => number = Math.random): LavaValleyShopDropPlanItem[] {
  const count = random() < 0.5 ? LAVA_VALLEY_REWARDS_CONFIG.shopItemDrops.minPerRun : LAVA_VALLEY_REWARDS_CONFIG.shopItemDrops.maxPerRun;
  const durationScale = LAVA_VALLEY_DURATION_SECONDS / LAVA_VALLEY_TIMING_REFERENCE_SECONDS;
  const timingRanges = (count === 1 ? [[25, 65]] : [[20, 35], [55, 75]]).map(([min, max]) => [min * durationScale, max * durationScale]);
  return timingRanges.map(([min, max], index) => {
    const category: LavaValleyShopDropCategory = random() < LAVA_VALLEY_REWARDS_CONFIG.shopItemDrops.categoryWeights.food ? 'food' : 'hatchItem';
    const pool = LAVA_VALLEY_SHOP_DROP_POOLS[category];
    const itemId = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
    return { id: index + 1, category, itemId, spawnAtSeconds: min + random() * (max - min) };
  });
}

function addQuantity(inventory: MinigameEconomyState['inventory'], itemId: string, quantity: number) {
  if (quantity <= 0) return inventory;
  const existing = inventory.find((item) => item.itemId === itemId);
  return existing
    ? inventory.map((item) => item.itemId === itemId ? { ...item, quantity: item.quantity + quantity } : item)
    : [...inventory, { itemId, quantity }];
}

export function applyLavaValleyRewards(state: MinigameEconomyState, rawRewards: MinigameRunRewards, multiplier: CoinRewardMultiplier) {
  const normalized = normalizeLavaValleyRewards(rawRewards);
  const rewards = { ...normalized, coins: getAdjustedMinigameCoins(normalized.coins, multiplier) };
  const inventoryWithShopItems = rewards.shopItems.reduce((inventory, item) => addQuantity(inventory, item.itemId, item.quantity), state.inventory);
  return {
    state: {
      coins: state.coins + rewards.coins,
      inventory: addQuantity(inventoryWithShopItems, LAVA_VALLEY_RARE_FRAGMENT_ITEM_ID, rewards.rareFragments),
    },
    rewards,
  };
}
