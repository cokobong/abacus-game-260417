import { Baby, Coins, Egg, Fish, Leaf, Package, Plus, ShoppingBag, Sparkles, Utensils } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getEggRequiredFragments, itemConfigs, type ItemConfig } from '../../config/itemConfig';
import type { OwnedDinosaur, OwnedEgg } from '../../types/game';
import { canBuyEggItem } from '../../utils/hatchCandidates';

type InventoryItemState = { itemId: string; quantity: number };
type ShopCategoryId = 'food' | 'egg' | 'hatchItem';

export interface ShopScreenProps {
  coins: number;
  feedback: string;
  inventory: InventoryItemState[];
  ownedDinosaurs: OwnedDinosaur[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onPurchase: (itemId: string) => void;
  onGoToDino: () => void;
}

const shopCategories: Array<{ id: ShopCategoryId; label: string; Icon: typeof Utensils }> = [
  { id: 'food', label: '음식', Icon: Utensils },
  { id: 'egg', label: '알', Icon: Egg },
  { id: 'hatchItem', label: '부화 아이템', Icon: Sparkles },
];

const shopCatalog: Record<ShopCategoryId, string[]> = {
  food: ['basic-meat', 'soft-berry', 'leaf-snack', 'fish-bite', 'dino-cookie', 'berry-basket', 'strong-meat', 'sweet-berry'],
  egg: ['green-starter-egg', 'rare-spark-egg', 'green-forest-rare-egg', 'volcano-island-rare-egg', 'ocean-blue-egg', 'legend-egg'],
  hatchItem: ['hatch-warm-stone', 'hatch-warm-blanket', 'hatch-spark-energy', 'rare-egg-fragment'],
};

const itemEmojiById: Record<string, string> = {
  'basic-meat': '🥩',
  'soft-berry': '🍓',
  'leaf-snack': '🍃',
  'fish-bite': '🐟',
  'dino-cookie': '🍪',
  'berry-basket': '🧺',
  'strong-meat': '🍖',
  'sweet-berry': '🫐',
  'energy-leaf': '🌿',
  'special-snack': '⭐',
  'green-starter-egg': '🥚',
  'rare-spark-egg': '✨',
  'green-forest-rare-egg': '🌲',
  'volcano-island-rare-egg': '🌋',
  'ocean-blue-egg': '🌊',
  'legend-egg': '👑',
  'hatch-warm-stone': '🪨',
  'hatch-warm-blanket': '🧣',
  'hatch-spark-energy': '💫',
  'rare-egg-fragment': '💎',
};

export function ShopScreen({ coins, feedback, inventory, ownedDinosaurs, ownedEggs, ownedCostumeIds, onPurchase, onGoToDino }: ShopScreenProps) {
  const [activeCategory, setActiveCategory] = useState<ShopCategoryId>('food');
  const visibleItems = useMemo(
    () =>
      shopCatalog[activeCategory]
        .map((itemId) => itemConfigs.find((item) => item.id === itemId))
        .filter((item): item is ItemConfig => Boolean(item))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [activeCategory],
  );

  return (
    <section className="shop-screen relative mx-auto grid h-full min-h-0 w-full max-w-[860px] grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden rounded-[30px] border-4 border-white bg-[linear-gradient(180deg,#bdf4ff_0%,#dbf7c6_48%,#ffe7ae_100%)] p-2.5 text-emerald-950 shadow-[0_18px_45px_rgba(14,116,144,0.16)] md:p-3">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[radial-gradient(circle_at_16%_70%,rgba(34,197,94,.2),transparent_24%),radial-gradient(circle_at_80%_62%,rgba(251,191,36,.24),transparent_26%)]" />
      <div className="pointer-events-none absolute left-10 top-24 h-14 w-20 rounded-t-full bg-emerald-300/45" />
      <div className="pointer-events-none absolute right-14 top-32 h-10 w-16 rounded-t-full bg-lime-300/50" />

      <header className="shop-header relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="shop-title-sign justify-self-start rounded-[20px] border-[4px] border-amber-800 bg-gradient-to-b from-amber-300 to-orange-400 px-6 py-2.5 text-center shadow-[0_5px_0_#92400e]">
          <h2 className="text-[clamp(1.45rem,3dvh,2.05rem)] font-black leading-none text-amber-950">상점</h2>
        </div>

        <div className="shop-coin-bar flex min-h-14 items-center gap-2 rounded-full border-[4px] border-white bg-gradient-to-b from-amber-100 to-yellow-300 px-4 shadow-[0_5px_0_rgba(180,83,9,0.28)]">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-500 text-white shadow-inner">
            <Coins className="h-6 w-6" />
          </span>
          <span className="min-w-[118px] text-center text-[clamp(1.3rem,2.7dvh,1.9rem)] font-black tabular-nums text-amber-950">{coins.toLocaleString()}</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_3px_0_#047857]">
            <Plus className="h-5 w-5" />
          </span>
        </div>

        <button onClick={onGoToDino} className="shop-my-dino-button justify-self-end rounded-[20px] border-[4px] border-white bg-gradient-to-b from-lime-200 to-emerald-300 px-3 py-2 text-sm font-black text-emerald-950 shadow-[0_5px_0_#059669] transition active:translate-y-1 active:shadow-none">
          <span className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/75">
              <Baby className="h-5 w-5 text-emerald-700" />
            </span>
            내 공룡
          </span>
        </button>
      </header>

      <div className="shop-category-tabs relative z-10 mx-auto mt-2 grid w-full max-w-[720px] grid-cols-3 gap-2 rounded-[22px] border-4 border-white bg-white/70 p-1.5 shadow-sm">
        {shopCategories.map(({ id, label, Icon }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`min-h-11 rounded-[16px] border-[3px] text-sm font-black transition active:translate-y-1 ${
                isActive
                  ? 'border-white bg-gradient-to-b from-emerald-300 to-lime-400 text-emerald-950 shadow-[0_4px_0_#059669]'
                  : 'border-transparent bg-white/82 text-slate-500 hover:bg-lime-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Icon className="h-5 w-5" />
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <section className="shop-content-panel relative z-10 mt-2 grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[26px] border-4 border-white bg-[#fff7df]/92 p-2.5 shadow-[0_10px_24px_rgba(120,53,15,0.13)]">
        <div className="mb-2 grid min-h-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1">
          <p className="truncate text-xs font-black text-orange-900">{feedback || getCategoryLead(activeCategory)}</p>
          <p className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-black text-emerald-800">{visibleItems.length}개 상품</p>
        </div>
        <div className="shop-product-grid min-h-0 overflow-hidden">
          <div className="grid h-full grid-cols-4 grid-rows-2 gap-2.5">
            {visibleItems.map((item) => (
              <ShopProductCard
                key={item.id}
                item={item}
                coins={coins}
                inventory={inventory}
                ownedDinosaurs={ownedDinosaurs}
                ownedEggs={ownedEggs}
                ownedCostumeIds={ownedCostumeIds}
                onPurchase={() => onPurchase(item.id)}
              />
            ))}
          </div>
        </div>
      </section>

    </section>
  );
}

function ShopProductCard({
  item,
  coins,
  inventory,
  ownedDinosaurs,
  ownedEggs,
  ownedCostumeIds,
  onPurchase,
}: {
  key?: string;
  item: ItemConfig;
  coins: number;
  inventory: InventoryItemState[];
  ownedDinosaurs: OwnedDinosaur[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onPurchase: () => void;
}) {
  const status = getItemStatus(item, coins, inventory, ownedDinosaurs, ownedEggs, ownedCostumeIds);
  const Icon = getItemIcon(item);
  const isRareEgg = item.category === 'egg' && isRareEggItem(item);
  const requiredFragment = item.category === 'egg' ? getEggRequiredFragments(item)[0] : null;
  const fragmentQuantity = requiredFragment ? getOwnedInventoryQuantity(inventory, requiredFragment.itemId) : 0;

  return (
    <article className="shop-product-card grid min-h-0 grid-rows-[46px_auto_auto_30px] rounded-[18px] border-[3px] border-white bg-gradient-to-b from-white to-orange-50 p-2 text-center shadow-[0_5px_0_rgba(180,83,9,0.16)]">
      <div className={`mx-auto grid h-11 w-11 place-items-center rounded-[14px] border-[3px] border-white text-2xl shadow-inner ${getItemTone(item)}`}>
        <span aria-hidden="true">{itemEmojiById[item.id]}</span>
        {!itemEmojiById[item.id] && <Icon className="h-6 w-6" />}
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-[13px] font-black leading-tight text-slate-950">{item.name}</h3>
        <p className="mt-1 truncate text-[10px] font-black text-slate-500">{status.ownedLabel}</p>
      </div>

      <div className="grid gap-0.5">
        <p className="mx-auto inline-flex max-w-full items-center justify-center gap-1 truncate rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-950">
          {isRareEgg ? <Package className="h-3.5 w-3.5 text-violet-600" /> : <Coins className="h-3.5 w-3.5 text-amber-600" />}
          {isRareEgg && requiredFragment ? `${fragmentQuantity}/${requiredFragment.amount}` : item.price.toLocaleString()}
        </p>
        <p className={`truncate rounded-full px-2 py-0.5 text-[9px] font-black ${status.canBuy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>{status.actionLabel}</p>
      </div>

      <button
        onClick={onPurchase}
        disabled={!status.canBuy}
        className="shop-buy-button mt-0.5 rounded-[12px] border-2 border-white bg-gradient-to-b from-emerald-300 to-green-500 text-[11px] font-black text-emerald-950 shadow-[0_3px_0_#047857] transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none"
      >
        구매하기
      </button>
    </article>
  );
}

function getCategoryLead(category: ShopCategoryId) {
  if (category === 'food') return '훈련으로 모은 코인으로 공룡 먹이를 골라요';
  if (category === 'egg') return '알부화장에서 키울 새 알을 준비해요';
  return '알을 더 따뜻하게 돌볼 부화 재료예요';
}

function getItemStatus(item: ItemConfig, coins: number, inventory: InventoryItemState[], ownedDinosaurs: OwnedDinosaur[], ownedEggs: OwnedEgg[], ownedCostumeIds: string[]) {
  const ownedQuantity = getOwnedQuantity(item, inventory, ownedEggs, ownedCostumeIds);
  const isRareEgg = item.category === 'egg' && isRareEggItem(item);
  const eggAvailability = item.category === 'egg' ? canBuyEggItem(item, ownedDinosaurs, ownedEggs) : null;
  const hasEnoughFragments = item.category === 'egg' && isRareEgg ? hasEnoughRequiredFragments(inventory, item) : false;
  const hasEnoughCoins = coins >= item.price;
  const hasEggInCategory = item.category === 'egg' && Boolean(eggAvailability?.hasEggInCategory);
  const eggSoldOut = item.category === 'egg' && !hasEggInCategory && eggAvailability?.remainingCandidateCount === 0;
  const canBuyEggMore = item.category !== 'egg' || Boolean(eggAvailability?.canBuyMore);
  const canBuy = canBuyEggMore && !hasEggInCategory && !eggSoldOut && (isRareEgg ? hasEnoughFragments : hasEnoughCoins);

  return {
    ownedLabel: item.category === 'egg' && hasEggInCategory ? '부화장에 있음' : `보유 x${ownedQuantity}`,
    actionLabel: hasEggInCategory ? '이미 보유' : eggSoldOut ? '품절' : isRareEgg ? (hasEnoughFragments ? '조각 충분' : '조각 부족') : hasEnoughCoins ? '구매 가능' : '코인 부족',
    canBuy,
  };
}

function getOwnedQuantity(item: ItemConfig, inventory: InventoryItemState[], ownedEggs: OwnedEgg[], ownedCostumeIds: string[]) {
  if (item.category === 'egg') return ownedEggs.filter((egg) => egg.eggItemId === item.id).length;
  if (item.category === 'costume') return ownedCostumeIds.includes(item.id) ? 1 : 0;
  return getOwnedInventoryQuantity(inventory, item.id);
}

function getOwnedInventoryQuantity(inventory: InventoryItemState[], itemId: string) {
  return inventory.find((item) => item.itemId === itemId)?.quantity ?? 0;
}

function getItemIcon(item: ItemConfig) {
  if (item.category === 'food') {
    if (item.id.includes('leaf')) return Leaf;
    if (item.id.includes('fish')) return Fish;
    return Utensils;
  }
  if (item.category === 'egg') return Egg;
  if (item.category === 'hatchItem') return Sparkles;
  return ShoppingBag;
}

function getItemTone(item: ItemConfig) {
  if (item.category === 'food') return 'bg-gradient-to-b from-amber-100 to-orange-100 text-orange-600';
  if (item.category === 'egg') return 'bg-gradient-to-b from-yellow-100 to-orange-100 text-orange-500';
  if (item.id === 'rare-egg-fragment') return 'bg-gradient-to-b from-violet-100 to-fuchsia-100 text-violet-600';
  if (item.category === 'hatchItem') return 'bg-gradient-to-b from-cyan-100 to-lime-100 text-cyan-700';
  return 'bg-gradient-to-b from-slate-100 to-slate-200 text-slate-500';
}

function isRareEggItem(item: Extract<ItemConfig, { category: 'egg' }>) {
  return item.eggCategory === 'rare' && getEggRequiredFragments(item).length > 0;
}

function hasEnoughRequiredFragments(inventory: InventoryItemState[], item: Extract<ItemConfig, { category: 'egg' }>) {
  const requiredFragments = getEggRequiredFragments(item);
  return requiredFragments.length > 0 && requiredFragments.every((fragment) => getOwnedInventoryQuantity(inventory, fragment.itemId) >= fragment.amount);
}
