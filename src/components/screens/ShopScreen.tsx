import { Package } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  shopFoodItemImages,
  shopItemCard,
  eggCommon,
  eggLegendary,
  eggRare,
  eggSpecial,
  shopItemHatchRareFragment,
  shopItemHatchSparkleEnergy,
  shopItemHatchWarmBlanket,
  shopItemHatchWarmStone,
  shopPriceChip,
  shopPopupBuyButton,
  shopPopupEffectPanel,
  shopPopupExitButton,
  shopPopupOwnedPanel,
  shopPopupPanel,
  shopPopupPricePanel,
  shopStatusChip,
} from '../../assets/shop';
import { getEggRequiredFragments, itemConfigs, type ItemConfig } from '../../config/itemConfig';
import type { OwnedDinosaur, OwnedEgg } from '../../types/game';
import { getEggPurchaseState, getLegendaryCategoryStates } from '../../utils/eggPurchaseState';
import { getFoodDietLabel } from '../../utils/dinosaurDiet';
import { playSound } from '../../audio/audioManager';
import { trainingUiAssets } from '../../assets/ui/training';
import { lavaValleyAssets } from '../../assets/adventure/lava-valley';
import { LAVA_VALLEY_RARE_FRAGMENT_ITEM_ID } from '../../config/minigameConfig';
import { ResourceChip } from '../ResourceChip';
import { SHOP_CATALOG } from '../../config/shopCatalog';

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
}

const shopCategories: Array<{ id: ShopCategoryId; label: string; defaultIcon: string; selectedIcon: string }> = [
  { id: 'food', label: '음식', defaultIcon: shopIconCategoryFoodDefault, selectedIcon: shopIconCategoryFoodSelected },
  { id: 'egg', label: '알', defaultIcon: shopIconCategoryEggDefault, selectedIcon: shopIconCategoryEggSelected },
  { id: 'hatchItem', label: '부화 아이템', defaultIcon: shopIconCategoryHatchDefault, selectedIcon: shopIconCategoryHatchSelected },
];

const shopItemAssets: Record<string, string> = {
  ...shopFoodItemImages,
  'green-starter-egg': eggCommon,
  'rare-spark-egg': eggSpecial,
  'rare-egg': eggRare,
  'legend-egg': eggLegendary,
  'hatch-warm-stone': shopItemHatchWarmStone,
  'hatch-warm-blanket': shopItemHatchWarmBlanket,
  'hatch-spark-energy': shopItemHatchSparkleEnergy,
  'rare-egg-fragment': shopItemHatchRareFragment,
};

export function ShopScreen({ coins, feedback, inventory, ownedDinosaurs, ownedEggs, ownedCostumeIds, onPurchase }: ShopScreenProps) {
  const [activeCategory, setActiveCategory] = useState<ShopCategoryId>('food');
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const visibleItems = useMemo(
    () =>
      SHOP_CATALOG[activeCategory]
        .map((itemId) => itemConfigs.find((item) => item.id === itemId))
        .filter((item): item is ItemConfig => Boolean(item))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [activeCategory],
  );
  const detailItem = detailItemId ? itemConfigs.find((item) => item.id === detailItemId) ?? null : null;
  const rareFragments = getOwnedInventoryQuantity(inventory, LAVA_VALLEY_RARE_FRAGMENT_ITEM_ID);

  useEffect(() => {
    if (!detailItem) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setDetailItemId(null);
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [detailItem]);

  return (
    <section
      className="shop-screen relative mx-auto grid h-full min-h-0 w-full max-w-[860px] grid-rows-[auto_minmax(0,1fr)] gap-[clamp(10px,1.5dvh,16px)] overflow-hidden rounded-[30px] bg-cover bg-center p-2.5 text-emerald-950 md:p-3"
      style={{ backgroundImage: `url(${shopBackground})` }}
    >
      <div className="relative z-10 mx-auto flex max-w-full flex-wrap items-center justify-center gap-2 px-1" aria-label="보유 자원">
        <ResourceChip label="코인" value={coins} icon={trainingUiAssets.rewardCoin} />
        <ResourceChip label="희귀조각" value={rareFragments} icon={lavaValleyAssets.collectibles.rareEggShard} tone="rare" />
      </div>

      <div className="shop-main-content relative z-10 grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
        <div className="shop-category-tabs mx-auto grid w-full max-w-[720px] grid-cols-3 gap-2 rounded-[24px] border-4 border-white bg-white/70 p-2 shadow-sm">
          {shopCategories.map(({ id, label, defaultIcon, selectedIcon }) => {
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => {
                  if (!isActive) {
                    playSound('ui_tab_switch');
                    setActiveCategory(id);
                  }
                }}
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

        <section className="shop-content-panel grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[24px] border-2 border-white/90 bg-[rgba(255,250,232,0.86)] px-2 py-1.5 shadow-[0_8px_20px_rgba(80,90,40,0.14)] backdrop-blur-[2px]">
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
                  onOpenDetails={() => setDetailItemId(item.id)}
                  onPurchase={() => onPurchase(item.id)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {detailItem && createPortal(
        <ShopItemDetailDialog
          item={detailItem}
          coins={coins}
          inventory={inventory}
          ownedDinosaurs={ownedDinosaurs}
          ownedEggs={ownedEggs}
          ownedCostumeIds={ownedCostumeIds}
          onPurchase={() => onPurchase(detailItem.id)}
          onClose={() => setDetailItemId(null)}
        />,
        document.body,
      )}
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
  onOpenDetails,
  onPurchase,
}: {
  key?: string;
  item: ItemConfig;
  coins: number;
  inventory: InventoryItemState[];
  ownedDinosaurs: OwnedDinosaur[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onOpenDetails: () => void;
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

      <button
        type="button"
        onClick={onOpenDetails}
        aria-label={`${item.name} 상세정보 보기`}
        className="shop-item-card__icon absolute left-[8%] top-[3%] grid h-[40%] w-[84%] place-items-center overflow-hidden border-0 bg-transparent p-0"
      >
        {itemAsset && <img src={itemAsset} alt="" className="h-[82%] w-[82%] object-contain" />}
        <span className="shop-item-card__owned-badge absolute right-0.5 top-0.5 z-10 min-w-[20px] rounded-full border-2 border-white bg-amber-200/95 px-1.5 py-0.5 text-[clamp(8px,1.15vw,11px)] font-black leading-none text-amber-950 shadow-[0_2px_4px_rgba(120,53,15,0.24)]">
          x{status.ownedQuantity}
        </span>
      </button>

      <button
        type="button"
        onClick={onOpenDetails}
        className="shop-item-card__name absolute inset-x-[5%] top-[41%] flex h-[8%] min-w-0 items-center justify-center border-0 bg-transparent p-0"
        aria-label={`${item.name} 상세정보 보기`}
      >
        <h3 className="line-clamp-2 w-full text-[clamp(10px,1.6vw,14.5px)] font-black leading-[1.05] text-slate-950">{item.name}</h3>
      </button>

      <div className="shop-item-card__price absolute left-1/2 top-[49%] h-[17%] w-[88%] -translate-x-1/2 overflow-hidden">
        <img src={shopPriceChip} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
        <p className="relative z-10 flex h-full translate-x-[10px] items-center justify-center gap-1 truncate px-[9%] text-[clamp(11px,1.65vw,15px)] font-extrabold text-amber-950">
          <span>{item.price.toLocaleString()}</span>
          {isRareEgg && requiredFragment && (
            <>
              <span className="text-amber-700">+</span>
              <Package className="h-[clamp(16px,2.2dvh,21px)] w-[clamp(16px,2.2dvh,21px)] shrink-0 text-violet-600" />
              <span>{fragmentQuantity}/{requiredFragment.amount}</span>
            </>
          )}
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
        onClick={(event) => {
          event.stopPropagation();
          playSound('ui_button_tap');
          onPurchase();
        }}
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
          className="shop-item-card__buy-image pointer-events-none absolute inset-0 h-full w-full object-contain object-center"
        />
      </button>
    </article>
  );
}

function ShopItemDetailDialog({
  item,
  coins,
  inventory,
  ownedDinosaurs,
  ownedEggs,
  ownedCostumeIds,
  onPurchase,
  onClose,
}: {
  item: ItemConfig;
  coins: number;
  inventory: InventoryItemState[];
  ownedDinosaurs: OwnedDinosaur[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onPurchase: () => void;
  onClose: () => void;
}) {
  const status = getItemStatus(item, coins, inventory, ownedDinosaurs, ownedEggs, ownedCostumeIds);
  const itemAsset = shopItemAssets[item.id];
  const effectLabel = getShopItemEffectLabel(item);
  const requiredFragment = item.category === 'egg' ? getEggRequiredFragments(item)[0] : null;
  const fragmentQuantity = requiredFragment ? getOwnedInventoryQuantity(inventory, requiredFragment.itemId) : 0;
  const legendaryCategories = item.category === 'egg' && item.eggCategory === 'legendary' ? getLegendaryCategoryStates(ownedDinosaurs) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-emerald-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-item-detail-title"
        className="relative my-auto aspect-[566/898] w-[min(92vw,calc(88dvh*566/898),440px)] flex-none overflow-hidden text-amber-950 drop-shadow-[0_28px_42px_rgba(42,25,10,.42)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <img src={shopPopupPanel} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" draggable={false} />

        <div className="absolute inset-x-[8%] bottom-[4.5%] top-[4%] flex min-h-0 flex-col items-center text-center">
          <div className="grid h-[clamp(104px,18dvh,158px)] w-[clamp(130px,28vw,200px)] flex-none place-items-center">
            {itemAsset && <img src={itemAsset} alt="" className="h-full w-full object-contain" draggable={false} />}
          </div>

          <h2 id="shop-item-detail-title" className="mt-[1%] line-clamp-2 w-full flex-none text-[clamp(1.35rem,3.2dvh,2rem)] font-black leading-tight text-emerald-950">{item.name}</h2>
          <p className="mt-[1.5%] line-clamp-2 w-[92%] flex-none text-[clamp(0.78rem,1.65dvh,0.98rem)] font-bold leading-[1.35] text-amber-900">{item.description}</p>

          {effectLabel && (
            <div className="relative mt-[3%] aspect-[538/232] w-[88%] flex-none">
              <img src={shopPopupEffectPanel} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" draggable={false} />
              <div className="absolute inset-[12%_8%_16%] flex flex-col items-center justify-center">
                <span className="text-[clamp(0.68rem,1.4dvh,0.82rem)] font-black text-emerald-700">효과</span>
                <strong className="mt-[1%] block truncate text-[clamp(1rem,2.4dvh,1.45rem)] font-black text-emerald-950">{effectLabel}</strong>
                {item.category === 'food' && (
                  <span className="mt-[1%] text-[clamp(0.62rem,1.25dvh,0.78rem)] font-black text-amber-800">
                    {getFoodDietLabel(item.dietType)}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-[2.5%] grid w-[90%] flex-none grid-cols-2 gap-[3%]">
            <div className="relative aspect-[530/210] min-w-0">
              <img src={shopPopupPricePanel} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" draggable={false} />
              <div className="absolute inset-[12%_8%_17%] flex flex-col items-center justify-center">
                <span className="text-[clamp(0.62rem,1.3dvh,0.78rem)] font-black text-amber-700">가격</span>
                <strong className="block max-w-full truncate text-[clamp(0.9rem,2dvh,1.2rem)] font-black">{item.price.toLocaleString()}코인</strong>
              </div>
            </div>
            <div className="relative aspect-[530/209] min-w-0">
              <img src={shopPopupOwnedPanel} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" draggable={false} />
              <div className="absolute inset-[12%_8%_17%] flex flex-col items-center justify-center">
                <span className="text-[clamp(0.62rem,1.3dvh,0.78rem)] font-black text-emerald-700">현재 보유</span>
                <strong className="block max-w-full truncate text-[clamp(0.9rem,2dvh,1.2rem)] font-black text-emerald-950">{status.ownedQuantity}개</strong>
              </div>
            </div>
          </div>

          {requiredFragment && (
            <p className="mt-[1%] flex-none text-[clamp(0.65rem,1.3dvh,0.8rem)] font-black text-violet-800">
              희귀조각 {fragmentQuantity}/{requiredFragment.amount}개
            </p>
          )}

          {legendaryCategories.length > 0 && (
            <div className="mt-[1%] grid w-[90%] grid-cols-2 gap-1 text-[clamp(0.58rem,1.15dvh,0.72rem)] font-black">
              {legendaryCategories.map((category) => <span key={category.habitatId} className="rounded-full bg-violet-50 px-2 py-1 text-violet-900">{getHabitatLabel(category.habitatId)} {category.discovered}/{category.required} {category.status === 'completed' ? '완료' : category.status === 'available' ? '✓' : '🔒'}</span>)}
            </div>
          )}

          <div className="mt-auto grid w-[92%] flex-none grid-cols-2 items-center gap-[3%]">
            <button
              type="button"
              disabled={!status.canBuy}
              aria-label={status.canBuy ? '구매하기' : status.actionLabel}
              onClick={() => {
                playSound('ui_button_tap');
                onPurchase();
              }}
              className="aspect-[561/191] w-full border-0 bg-transparent p-0 transition focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lime-500 active:scale-95 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-45"
            >
              <img src={shopPopupBuyButton} alt="" className="block h-full w-full object-contain" draggable={false} />
            </button>
            <button
              type="button"
              aria-label="나가기"
              onClick={() => {
                playSound('ui_button_tap');
                onClose();
              }}
              className="aspect-[538/194] w-full border-0 bg-transparent p-0 transition focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-500 active:scale-95"
            >
              <img src={shopPopupExitButton} alt="" className="block h-full w-full object-contain" draggable={false} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function getShopItemEffectLabel(item: ItemConfig) {
  if (item.category === 'food') return `경험치 +${item.expValue}`;
  if (item.category === 'hatchItem' && item.effect.hatchProgress > 0) return `부화 진행도 +${item.effect.hatchProgress}%`;
  if (item.category === 'egg') return `${getEggCategoryLabel(item)} 부화`;
  return null;
}

function getCategoryLead(category: ShopCategoryId) {
  if (category === 'food') return '훈련으로 모은 코인으로 공룡 먹이를 골라요';
  if (category === 'egg') return '알부화장에서 키울 새 알을 준비해요';
  return '알을 더 따뜻하게 돌볼 부화 재료예요';
}

function getItemStatus(item: ItemConfig, coins: number, inventory: InventoryItemState[], ownedDinosaurs: OwnedDinosaur[], ownedEggs: OwnedEgg[], ownedCostumeIds: string[]) {
  if (item.category === 'egg') {
    const purchaseState = getEggPurchaseState(item, coins, inventory, ownedDinosaurs, ownedEggs);
    return { ownedQuantity: purchaseState.ownedQuantity, actionLabel: purchaseState.label, canBuy: !purchaseState.disabled };
  }
  const ownedQuantity = getOwnedQuantity(item, inventory, ownedEggs, ownedCostumeIds);
  const hasEnoughCoins = coins >= item.price;

  return {
    ownedQuantity,
    actionLabel: hasEnoughCoins ? '구매 가능' : '코인 부족',
    canBuy: hasEnoughCoins,
  };
}

function getEggCategoryLabel(item: ItemConfig) {
  if (item.category !== 'egg') return '';
  if (item.eggCategory === 'normal') return '일반알';
  if (item.eggCategory === 'special') return '특수알';
  if (item.eggCategory === 'legendary') return '전설알';
  return '희귀알';
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

function getHabitatLabel(habitatId: string) {
  return ({ 'green-forest': '초록 숲', 'sparkle-cave': '반짝 동굴', 'volcano-island': '화산섬', 'secret-land': '비밀의 땅' } as Record<string, string>)[habitatId] ?? habitatId;
}
