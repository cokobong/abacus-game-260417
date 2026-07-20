import { Baby, Coins, Package, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  shopBackground,
  shopBuyButtonDefault,
  shopBuyButtonDisabled,
  shopBuyButtonPressed,
  shopIconCategoryEggDefault,
  shopIconCategoryEggSelected,
  shopIconCategoryFoodDefault,
  shopIconCategoryFoodSelected,
  shopIconCategoryHatchDefault,
  shopIconCategoryHatchSelected,
  shopItemCard,
  shopItemEggForestRare,
  shopItemEggGreen,
  shopItemEggLegendary,
  shopItemEggOcean,
  shopItemEggSparkle,
  shopItemEggVolcanoRare,
  shopItemFoodDinoCookie,
  shopItemFoodFish,
  shopItemFoodFruitBasket,
  shopItemFoodLeaf,
  shopItemFoodMeat,
  shopItemFoodSoftBerry,
  shopItemFoodSweetBerry,
  shopItemFoodToughMeat,
  shopItemHatchRareFragment,
  shopItemHatchSparkleEnergy,
  shopItemHatchWarmBlanket,
  shopItemHatchWarmStone,
  shopPriceChip,
  shopStatusChip,
  shopTitleBanner,
} from '../../assets/shop';
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

const shopCategories: Array<{ id: ShopCategoryId; label: string; defaultIcon: string; selectedIcon: string }> = [
  { id: 'food', label: '음식', defaultIcon: shopIconCategoryFoodDefault, selectedIcon: shopIconCategoryFoodSelected },
  { id: 'egg', label: '알', defaultIcon: shopIconCategoryEggDefault, selectedIcon: shopIconCategoryEggSelected },
  { id: 'hatchItem', label: '부화 아이템', defaultIcon: shopIconCategoryHatchDefault, selectedIcon: shopIconCategoryHatchSelected },
];

const shopCatalog: Record<ShopCategoryId, string[]> = {
  food: ['basic-meat', 'soft-berry', 'leaf-snack', 'fish-bite', 'dino-cookie', 'berry-basket', 'strong-meat', 'sweet-berry'],
  egg: ['green-starter-egg', 'rare-spark-egg', 'green-forest-rare-egg', 'volcano-island-rare-egg', 'ocean-blue-egg', 'legend-egg'],
  hatchItem: ['hatch-warm-stone', 'hatch-warm-blanket', 'hatch-spark-energy', 'rare-egg-fragment'],
};

const shopItemAssets: Record<string, string> = {
  'basic-meat': shopItemFoodMeat,
  'soft-berry': shopItemFoodSoftBerry,
  'leaf-snack': shopItemFoodLeaf,
  'dino-cookie': shopItemFoodDinoCookie,
  'fish-bite': shopItemFoodFish,
  'berry-basket': shopItemFoodFruitBasket,
  'strong-meat': shopItemFoodToughMeat,
  'sweet-berry': shopItemFoodSweetBerry,
  'green-starter-egg': shopItemEggGreen,
  'rare-spark-egg': shopItemEggSparkle,
  'green-forest-rare-egg': shopItemEggForestRare,
  'volcano-island-rare-egg': shopItemEggVolcanoRare,
  'ocean-blue-egg': shopItemEggOcean,
  'legend-egg': shopItemEggLegendary,
  'hatch-warm-stone': shopItemHatchWarmStone,
  'hatch-warm-blanket': shopItemHatchWarmBlanket,
  'hatch-spark-energy': shopItemHatchSparkleEnergy,
  'rare-egg-fragment': shopItemHatchRareFragment,
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
    <section
      className="shop-screen relative mx-auto grid h-full min-h-0 w-full max-w-[860px] grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden rounded-[30px] bg-cover bg-center p-2.5 text-emerald-950 md:p-3"
      style={{ backgroundImage: `url(${shopBackground})` }}
    >

      <header className="shop-header relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <img
          src={shopTitleBanner}
          alt="상점"
          className="shop-title-sign h-auto w-[clamp(132px,19vw,210px)] justify-self-start object-contain"
        />

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

      <div className="shop-category-tabs relative z-10 mx-auto mt-2 grid w-full max-w-[720px] grid-cols-3 gap-2 rounded-[24px] border-4 border-white bg-white/70 p-2 shadow-sm">
        {shopCategories.map(({ id, label, defaultIcon, selectedIcon }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`min-h-[clamp(3.5rem,7.2dvh,4rem)] rounded-[18px] border-[3px] px-2 py-2 text-[clamp(0.9375rem,2.1dvh,1.125rem)] font-bold leading-tight transition active:translate-y-1 ${
                isActive
                  ? 'border-white bg-gradient-to-b from-emerald-300 to-lime-400 text-emerald-950 shadow-[0_4px_0_#059669]'
                  : 'border-transparent bg-white/82 text-slate-500 hover:bg-lime-50'
              }`}
            >
              <span className="flex h-full items-center justify-center gap-[clamp(0.25rem,1vw,0.75rem)]">
                <img src={isActive ? selectedIcon : defaultIcon} alt="" className="h-[clamp(2.25rem,5dvh,2.75rem)] w-[clamp(2.25rem,5dvh,2.75rem)] shrink-0 object-contain" />
                <span>{label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <section className="shop-content-panel relative z-10 mt-2 grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[24px] border-2 border-white/90 bg-[rgba(255,250,232,0.86)] px-2 py-1.5 shadow-[0_8px_20px_rgba(80,90,40,0.14)] backdrop-blur-[2px]">
        <div className="mb-1 grid min-h-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1 px-0.5">
          <p className="truncate text-[11px] font-black text-orange-900">{feedback || getCategoryLead(activeCategory)}</p>
          <p className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black text-emerald-800">{visibleItems.length}개 상품</p>
        </div>
        <div className="shop-product-grid min-h-0 overflow-hidden">
          <div className="grid h-full grid-cols-4 content-start items-start gap-x-1 gap-y-[10px]">
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
  const itemAsset = shopItemAssets[item.id];
  const [isPressed, setIsPressed] = useState(false);
  const isRareEgg = item.category === 'egg' && isRareEggItem(item);
  const requiredFragment = item.category === 'egg' ? getEggRequiredFragments(item)[0] : null;
  const fragmentQuantity = requiredFragment ? getOwnedInventoryQuantity(inventory, requiredFragment.itemId) : 0;

  return (
    <article className="shop-product-card relative aspect-[3/4] min-h-0 w-full overflow-hidden text-center">
      <img src={shopItemCard} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />

      <div className="shop-item-card__icon absolute left-[8%] top-[3%] grid h-[40%] w-[84%] place-items-center overflow-hidden">
        {itemAsset && <img src={itemAsset} alt="" className="h-[82%] w-[82%] object-contain" />}
        <span className="shop-item-card__owned-badge absolute right-0.5 top-0.5 z-10 min-w-[20px] rounded-full border-2 border-white bg-amber-200/95 px-1.5 py-0.5 text-[clamp(8px,1.15vw,11px)] font-black leading-none text-amber-950 shadow-[0_2px_4px_rgba(120,53,15,0.24)]">
          x{status.ownedQuantity}
        </span>
      </div>

      <div className="shop-item-card__name absolute inset-x-[5%] top-[41%] flex h-[8%] min-w-0 items-center justify-center">
        <h3 className="line-clamp-2 w-full text-[clamp(10px,1.6vw,14.5px)] font-black leading-[1.05] text-slate-950">{item.name}</h3>
      </div>

      <div className="shop-item-card__price absolute left-1/2 top-[49%] h-[17%] w-[88%] -translate-x-1/2 overflow-hidden">
        <img src={shopPriceChip} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
        <p className="relative z-10 flex h-full items-center justify-center gap-1.5 truncate px-[15%] text-[clamp(14px,2.25vw,20px)] font-extrabold text-amber-950">
          {isRareEgg ? <Package className="h-[clamp(22px,2.8dvh,26px)] w-[clamp(22px,2.8dvh,26px)] shrink-0 text-violet-600" /> : <Coins className="h-[clamp(22px,2.8dvh,26px)] w-[clamp(22px,2.8dvh,26px)] shrink-0 text-amber-600" />}
          {isRareEgg && requiredFragment ? `${fragmentQuantity}/${requiredFragment.amount}` : item.price.toLocaleString()}
        </p>
      </div>

      <div className="shop-item-card__status absolute left-1/2 top-[67%] h-[8%] w-[66%] -translate-x-1/2 overflow-hidden">
        <img src={shopStatusChip} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
        <p className={`relative z-10 flex h-full items-center justify-center truncate px-2 text-[clamp(9px,1.3vw,12px)] font-black ${status.canBuy ? 'text-emerald-900' : 'text-rose-800'}`}>
          {status.actionLabel}
        </p>
      </div>

      <button
        type="button"
        onClick={onPurchase}
        disabled={!status.canBuy}
        onPointerDown={() => status.canBuy && setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerCancel={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        aria-label="구매하기"
        className="shop-item-card__buy shop-buy-button absolute bottom-[3%] left-1/2 aspect-[3/1] h-auto w-[88%] -translate-x-1/2 overflow-hidden bg-transparent p-0 disabled:cursor-not-allowed"
      >
        <img
          src={!status.canBuy ? shopBuyButtonDisabled : isPressed ? shopBuyButtonPressed : shopBuyButtonDefault}
          alt=""
          className="shop-item-card__buy-image pointer-events-none absolute inset-0 h-full w-full object-fill object-center"
        />
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
    ownedQuantity,
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

function isRareEggItem(item: Extract<ItemConfig, { category: 'egg' }>) {
  return item.eggCategory === 'rare' && getEggRequiredFragments(item).length > 0;
}

function hasEnoughRequiredFragments(inventory: InventoryItemState[], item: Extract<ItemConfig, { category: 'egg' }>) {
  const requiredFragments = getEggRequiredFragments(item);
  return requiredFragments.length > 0 && requiredFragments.every((fragment) => getOwnedInventoryQuantity(inventory, fragment.itemId) >= fragment.amount);
}
