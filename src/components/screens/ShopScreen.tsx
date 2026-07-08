import { Coins, Egg, Package, Shirt, ShoppingBag, Sparkles, Utensils, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getEggRequiredFragments, itemConfigs, type EggCategory, type ItemConfig } from '../../config/itemConfig';
import type { OwnedDinosaur, OwnedEgg } from '../../types/game';
import { canBuyEggItem } from '../../utils/hatchCandidates';

type InventoryItemState = { itemId: string; quantity: number };
type ShopCategoryId = 'all' | 'food' | 'costume' | 'egg' | 'hatchItem';
const showDeveloperPanels = false;

export interface ShopScreenProps {
  coins: number;
  feedback: string;
  inventory: InventoryItemState[];
  ownedDinosaurs: OwnedDinosaur[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onPurchase: (itemId: string) => void;
}

const shopCategories: Array<{ id: ShopCategoryId; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'food', label: '먹이' },
  { id: 'costume', label: '코스튬' },
  { id: 'egg', label: '알' },
  { id: 'hatchItem', label: '부화 아이템' },
];

export function ShopScreen({ coins, feedback, inventory, ownedDinosaurs, ownedEggs, ownedCostumeIds, onPurchase }: ShopScreenProps) {
  const [activeCategory, setActiveCategory] = useState<ShopCategoryId>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = selectedItemId ? itemConfigs.find((item) => item.id === selectedItemId) ?? null : null;
  const visibleItems = useMemo(() => itemConfigs.filter((item) => isItemInCategory(item, activeCategory)).sort((a, b) => a.sortOrder - b.sortOrder), [activeCategory]);

  return (
    <div className="grid gap-5">
      <section className="rounded-[34px] border-4 border-white bg-gradient-to-r from-violet-100 to-fuchsia-100 p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-violet-700">공룡 모험 상점</p>
            <h3 className="text-3xl font-black text-violet-950">상점</h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border-4 border-white bg-amber-200 px-5 py-3 text-lg font-black text-amber-950 shadow-sm">
            <Coins className="h-5 w-5 text-amber-600" />
            {coins.toLocaleString()}
          </div>
        </div>
        <p className="mt-4 rounded-[22px] border-4 border-white bg-white/90 px-4 py-3 font-black text-violet-800 shadow-sm">{feedback}</p>
      </section>

      <ShopCategoryTabs activeCategory={activeCategory} onCategory={setActiveCategory} />
      <ShopItemGrid activeCategory={activeCategory} items={visibleItems} coins={coins} inventory={inventory} ownedDinosaurs={ownedDinosaurs} ownedEggs={ownedEggs} ownedCostumeIds={ownedCostumeIds} onSelectItem={setSelectedItemId} />
      {showDeveloperPanels && <DeveloperShopDebugPanel inventory={inventory} ownedEggs={ownedEggs} ownedCostumeIds={ownedCostumeIds} />}

      {selectedItem && <ShopItemDetailModal item={selectedItem} coins={coins} inventory={inventory} ownedDinosaurs={ownedDinosaurs} ownedEggs={ownedEggs} ownedCostumeIds={ownedCostumeIds} onClose={() => setSelectedItemId(null)} onPurchase={onPurchase} />}
    </div>
  );
}

function ShopCategoryTabs({ activeCategory, onCategory }: { activeCategory: ShopCategoryId; onCategory: (category: ShopCategoryId) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-[28px] border-4 border-white bg-white/74 p-2 shadow-sm">
      {shopCategories.map((category) => {
        const isActive = category.id === activeCategory;
        return (
          <button
            key={category.id}
            onClick={() => onCategory(category.id)}
            className={`min-h-14 shrink-0 rounded-[18px] px-4 text-sm font-black transition active:translate-y-1 ${
              isActive ? 'bg-violet-500 text-white shadow-[0_4px_0_#7c3aed]' : 'bg-white/80 text-slate-600 hover:bg-violet-50'
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

function ShopItemGrid({
  activeCategory,
  items,
  coins,
  inventory,
  ownedDinosaurs,
  ownedEggs,
  ownedCostumeIds,
  onSelectItem,
}: {
  activeCategory: ShopCategoryId;
  items: ItemConfig[];
  coins: number;
  inventory: InventoryItemState[];
  ownedDinosaurs: OwnedDinosaur[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onSelectItem: (itemId: string) => void;
}) {
  if (activeCategory === 'egg') {
    const eggItems = items.filter((item) => item.category === 'egg');
    const rareFragmentQuantity = getFragmentQuantity(inventory, rareEggFragmentItemId);
    const totalRareEggFragmentRequirement = getTotalRareEggFragmentRequirement();

    return (
      <section className="grid gap-3">
        <div className="grid gap-2 rounded-[24px] border-4 border-white bg-white/72 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black text-violet-900">알은 일반알, 특수알, 희귀알 3종류로 정리돼요.</p>
            {eggCategoryOrder.map((eggCategory) => (
              <span key={eggCategory} className={`rounded-full px-3 py-1 text-xs font-black ${getEggCategoryBadgeTone(eggCategory)}`}>{getEggCategoryLabel(eggCategory)}</span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-[18px] bg-violet-50 px-3 py-2 text-xs font-black text-violet-900">
            <span>보유 희귀알 조각: {rareFragmentQuantity}개</span>
            <span className="text-violet-500">|</span>
            <span>희귀알을 모두 열려면 총 {totalRareEggFragmentRequirement}개가 필요해요.</span>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {eggItems.map((item) => (
            <ShopEggCompactCard key={item.id} item={item} coins={coins} inventory={inventory} ownedDinosaurs={ownedDinosaurs} ownedEggs={ownedEggs} onSelect={() => onSelectItem(item.id)} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {items.map((item) => (
        <ShopItemCard key={item.id} item={item} coins={coins} inventory={inventory} ownedDinosaurs={ownedDinosaurs} ownedEggs={ownedEggs} ownedCostumeIds={ownedCostumeIds} onSelect={() => onSelectItem(item.id)} />
      ))}
    </section>
  );
}

function ShopEggCompactCard({ item, coins, inventory, ownedDinosaurs, ownedEggs, onSelect }: { key?: string; item: Extract<ItemConfig, { category: 'egg' }>; coins: number; inventory: InventoryItemState[]; ownedDinosaurs: OwnedDinosaur[]; ownedEggs: OwnedEgg[]; onSelect: () => void }) {
  const isRareEgg = isRareEggItem(item);
  const hasEnoughCoins = coins >= item.price;
  const ownedQuantity = ownedEggs.filter((egg) => egg.eggItemId === item.id).length;
  const requiredFragment = getPrimaryRequiredFragment(item);
  const fragmentQuantity = getFragmentQuantity(inventory, requiredFragment?.itemId);
  const requiredFragmentAmount = requiredFragment?.amount ?? 0;
  const missingFragmentAmount = Math.max(0, requiredFragmentAmount - fragmentQuantity);
  const hasEnoughFragments = isRareEgg && hasEnoughRequiredFragments(inventory, item);
  const eggAvailability = canBuyEggItem(item, ownedDinosaurs, ownedEggs);
  const statusLabel = eggAvailability.hasEggInCategory ? '이미 부화장에 있어요' : eggAvailability.remainingCandidateCount === 0 ? '모두 만났어요' : isRareEgg ? (hasEnoughFragments ? '희귀알 열기' : '조각 부족') : hasEnoughCoins ? '구매 가능' : '코인 부족';

  return (
    <button
      onClick={onSelect}
      className={`grid min-h-32 grid-cols-[64px_1fr] gap-3 rounded-[24px] border-4 p-3 text-left shadow-md transition hover:brightness-105 active:translate-y-1 ${
        isRareEgg ? 'border-violet-200 bg-violet-50/90 text-violet-900' : 'border-white bg-white/90 text-slate-800'
      }`}
    >
      <div className={`flex h-16 w-16 items-center justify-center rounded-[22px] border-4 border-white shadow-inner ${isRareEgg ? 'bg-gradient-to-b from-violet-100 to-fuchsia-100 text-violet-600' : getItemTone(item)}`}>
        <Egg className="h-9 w-9" />
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="truncate text-lg font-black text-slate-950">{item.name}</h4>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${getEggCategoryBadgeTone(item.eggCategory)}`}>{getEggCategoryLabel(item.eggCategory)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${isRareEgg ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-900'}`}>
            {isRareEgg ? <Package className="h-3.5 w-3.5" /> : <Coins className="h-3.5 w-3.5" />}
            {isRareEgg ? `내 조각 ${fragmentQuantity}개` : `${item.price}코인`}
          </span>
          {isRareEgg && <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-violet-700">필요 {requiredFragmentAmount}개</span>}
          {isRareEgg && missingFragmentAmount > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">부족 {missingFragmentAmount}개</span>}
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-slate-500">{eggAvailability.hasEggInCategory ? '부화장에 있음' : `보유 x${ownedQuantity}`}</span>
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-slate-500">남은 공룡 {eggAvailability.remainingCandidateCount}마리</span>
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-black text-slate-500">보유 알 {eggAvailability.ownedEggCountByCategory}개</span>
        </div>
        <p className={`mt-2 rounded-full px-3 py-1 text-center text-xs font-black ${eggAvailability.canBuyMore && ((isRareEgg && hasEnoughFragments) || (!isRareEgg && hasEnoughCoins)) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{statusLabel}</p>
      </div>
    </button>
  );
}

function ShopItemCard({
  item,
  coins,
  inventory,
  ownedDinosaurs,
  ownedEggs,
  ownedCostumeIds,
  onSelect,
}: {
  key?: string;
  item: ItemConfig;
  coins: number;
  inventory: InventoryItemState[];
  ownedDinosaurs: OwnedDinosaur[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onSelect: () => void;
}) {
  const status = getItemStatus(item, coins, inventory, ownedDinosaurs, ownedEggs, ownedCostumeIds);
  const Icon = getItemIcon(item);

  return (
    <button onClick={onSelect} className={`min-h-56 rounded-[28px] border-4 p-4 text-left shadow-lg transition hover:brightness-105 active:translate-y-1 ${status.isComingSoon ? 'border-slate-200 bg-slate-100/90 text-slate-600' : 'border-white bg-white/86 text-slate-800'}`}>
      <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-[26px] border-4 border-white shadow-inner ${getItemTone(item)}`}>
        <Icon className="h-10 w-10" />
      </div>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xl font-black text-slate-950">{item.name}</h4>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${status.isComingSoon ? 'bg-slate-200 text-slate-600' : 'bg-violet-100 text-violet-800'}`}>{getCategoryLabel(item)}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-black ${status.isComingSoon ? 'bg-slate-200 text-slate-600' : 'bg-amber-200 text-amber-950'}`}>
          <Coins className="h-4 w-4" />
          {status.isComingSoon ? '준비 중' : item.price}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-600">{status.ownedLabel}</span>
      </div>
      <p className={`mt-3 rounded-full px-3 py-1 text-center text-xs font-black ${status.isComingSoon ? 'bg-white/80 text-slate-500' : status.canBuy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{status.actionLabel}</p>
    </button>
  );
}

function ShopItemDetailModal({
  item,
  coins,
  inventory,
  ownedDinosaurs,
  ownedEggs,
  ownedCostumeIds,
  onClose,
  onPurchase,
}: {
  item: ItemConfig;
  coins: number;
  inventory: InventoryItemState[];
  ownedDinosaurs: OwnedDinosaur[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onClose: () => void;
  onPurchase: (itemId: string) => void;
}) {
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const status = getItemStatus(item, coins, inventory, ownedDinosaurs, ownedEggs, ownedCostumeIds);
  const Icon = getItemIcon(item);
  const missingCoins = Math.max(0, item.price - coins);
  const isRareEgg = item.category === 'egg' && isRareEggItem(item);
  const requiredFragment = item.category === 'egg' ? getPrimaryRequiredFragment(item) : null;
  const fragmentQuantity = isRareEgg ? getFragmentQuantity(inventory, requiredFragment?.itemId) : 0;
  const requiredFragmentAmount = isRareEgg ? requiredFragment?.amount ?? 0 : 0;
  const missingFragmentAmount = Math.max(0, requiredFragmentAmount - fragmentQuantity);

  function handlePurchase() {
    if (status.isComingSoon) return;

    if (status.isOwnedCostume) {
      setPurchaseMessage('이미 보유 중이에요. 우리 공룡 탭에서 입혀볼 수 있어요.');
      return;
    }

    if (item.category === 'egg' && status.eggAvailability?.hasEggInCategory) {
      setPurchaseMessage(`${getEggCategoryLabel(item.eggCategory)}은 이미 부화장에 있어요. 부화 후 다음 알을 준비할 수 있어요.`);
      return;
    }

    if (item.category === 'egg' && !status.canBuyEggMore) {
      setPurchaseMessage('이 알에서 만날 수 있는 공룡을 모두 만났어요. 다른 알을 선택해보세요.');
      return;
    }

    if (isRareEgg && !status.hasEnoughFragments) {
      setPurchaseMessage(`공통 희귀알 조각이 부족해요. 내 조각 ${fragmentQuantity}개 · 필요 ${requiredFragmentAmount}개 · 부족 ${missingFragmentAmount}개`);
      return;
    }

    if (!isRareEgg && !status.hasEnoughCoins) {
      setPurchaseMessage(`코인이 부족해요. ${missingCoins.toLocaleString()}코인이 더 필요해요.`);
      return;
    }

    onPurchase(item.id);
    setPurchaseMessage(getPurchaseSuccessMessage(item));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-3 pb-[calc(112px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm sm:px-4 sm:pt-6">
      <section className="grid max-h-full min-h-0 w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[28px] border-4 border-white bg-gradient-to-b from-white via-violet-50 to-cyan-50 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="flex justify-end px-3 pt-3">
          <button aria-label="닫기" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-slate-900 text-white transition active:translate-y-1">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="grid min-h-0 gap-3 overflow-y-auto px-4 pb-3 text-center sm:px-5">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] border-4 border-white shadow-inner sm:h-24 sm:w-24 ${getItemTone(item)}`}>
            <Icon className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <div>
            <p className="text-sm font-black text-violet-700">{getCategoryLabel(item)}</p>
            <h3 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{item.name}</h3>
          </div>
          <p className="rounded-[20px] border-4 border-white bg-white/90 px-4 py-2 text-sm font-black leading-relaxed text-emerald-900 shadow-sm sm:text-base">{getFriendlyDescription(item)}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`${isRareEgg ? 'bg-violet-100 text-violet-950' : 'bg-amber-100 text-amber-950'} rounded-[20px] px-4 py-2 shadow-sm`}>
              <p className={`text-xs font-black ${isRareEgg ? 'text-violet-700' : 'text-amber-700'}`}>{isRareEgg ? '필요 재료' : '가격'}</p>
              <p className="mt-1 inline-flex items-center justify-center gap-1 text-lg font-black sm:text-xl">
                {isRareEgg ? <Package className="h-5 w-5 text-violet-600" /> : <Coins className="h-5 w-5 text-amber-600" />}
                {isRareEgg ? `희귀알 조각 ${requiredFragmentAmount}개` : `${item.price}코인`}
              </p>
            </div>
            <div className="rounded-[20px] bg-white/90 px-4 py-2 text-slate-900 shadow-sm">
              <p className="text-xs font-black text-slate-500">{isRareEgg ? '보유 조각' : '내 코인'}</p>
              <p className="mt-1 inline-flex items-center justify-center gap-1 text-lg font-black sm:text-xl">
                {isRareEgg ? <Package className="h-5 w-5 text-violet-600" /> : <Coins className="h-5 w-5 text-amber-600" />}
                {isRareEgg ? `${fragmentQuantity}개` : `${coins.toLocaleString()}코인`}
              </p>
            </div>
          </div>
          {isRareEgg && (
            <p className="mx-auto w-fit rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
              내 조각 {fragmentQuantity}개 · 필요 {requiredFragmentAmount}개 · 부족 {missingFragmentAmount}개
            </p>
          )}
          <p className="mx-auto w-fit rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-slate-500">{status.ownedLabel}</p>
          {item.category === 'egg' && status.eggAvailability && (
            <p className="mx-auto w-fit rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-slate-500">
              남은 만남 가능 공룡 {status.eggAvailability.remainingCandidateCount}마리 · 보유 알 {status.eggAvailability.ownedEggCountByCategory}개
            </p>
          )}
        </div>
        <div className="grid gap-2 border-t-4 border-white bg-white/90 p-3 text-center sm:p-4">
          {status.isComingSoon ? (
            <p className="rounded-[18px] bg-slate-100 px-4 py-3 text-sm font-black text-slate-600">추후 모험에서 사용할 수 있어요. 아직 구매할 수 없는 아이템이에요.</p>
          ) : (
            <>
              <p className={`rounded-[18px] px-4 py-2 text-sm font-black ${status.canBuy || status.isOwnedCostume ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {purchaseMessage || getShopDetailMessage(item, status, isRareEgg, fragmentQuantity, requiredFragmentAmount, missingFragmentAmount, missingCoins)}
              </p>
              <button
                disabled={status.isOwnedCostume || (item.category === 'egg' && !status.canBuy)}
                onClick={handlePurchase}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[22px] border-4 border-white bg-gradient-to-b from-violet-400 to-violet-600 px-8 text-base font-black text-white shadow-[0_6px_0_#7c3aed] transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-16 sm:text-lg"
              >
                <ShoppingBag className="h-6 w-6" />
                {isRareEgg ? status.buttonLabel : status.hasEnoughCoins && !status.isOwnedCostume ? `${item.price}코인으로 구매` : status.buttonLabel}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function DeveloperShopDebugPanel({ inventory, ownedEggs, ownedCostumeIds }: { inventory: InventoryItemState[]; ownedEggs: OwnedEgg[]; ownedCostumeIds: string[] }) {
  return (
    <details className="rounded-[26px] border-4 border-dashed border-slate-200 bg-white/62 px-4 py-3">
      <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용: 상점 데이터</summary>
      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500">
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(inventory, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(ownedEggs, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(ownedCostumeIds, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(itemConfigs, null, 2)}</pre>
      </div>
    </details>
  );
}

function isItemInCategory(item: ItemConfig, category: ShopCategoryId) {
  if (!isVisibleShopItem(item)) return false;
  if (category === 'all') return true;
  if (category === 'egg') return item.category === 'egg';
  return item.category === category;
}

function isComingSoonItem(item: ItemConfig) {
  return item.category === 'dinosaur' || item.category === 'toy' || item.category === 'misc';
}

function isVisibleShopItem(item: ItemConfig) {
  return item.category === 'food' || item.category === 'costume' || item.category === 'egg' || item.category === 'hatchItem';
}

function getItemStatus(item: ItemConfig, coins: number, inventory: InventoryItemState[], ownedDinosaurs: OwnedDinosaur[], ownedEggs: OwnedEgg[], ownedCostumeIds: string[]) {
  const ownedQuantity = getOwnedQuantity(item, inventory, ownedEggs, ownedCostumeIds);
  const isOwnedCostume = item.category === 'costume' && ownedCostumeIds.includes(item.id);
  const isComingSoon = isComingSoonItem(item);
  const isRareEgg = item.category === 'egg' && isRareEggItem(item);
  const eggAvailability = item.category === 'egg' ? canBuyEggItem(item, ownedDinosaurs, ownedEggs) : null;
  const canBuyEggMore = item.category !== 'egg' || Boolean(eggAvailability?.canBuyMore);
  const hasEnoughFragments = isRareEgg && item.category === 'egg' && hasEnoughRequiredFragments(inventory, item);
  const hasEnoughCoins = coins >= item.price;
  const canBuy = !isComingSoon && !isOwnedCostume && canBuyEggMore && (isRareEgg ? hasEnoughFragments : hasEnoughCoins);
  const hasEggInCategory = item.category === 'egg' && Boolean(eggAvailability?.hasEggInCategory);
  const eggSoldOut = item.category === 'egg' && !hasEggInCategory && eggAvailability?.remainingCandidateCount === 0;

  return {
    ownedLabel: item.category === 'costume' ? (isOwnedCostume ? '보유 중' : '아직 없음') : item.category === 'egg' && hasEggInCategory ? '이미 부화장에 있어요' : `보유 x${ownedQuantity}`,
    actionLabel: isComingSoon ? '추후 사용 예정' : isOwnedCostume ? '이미 보유 중' : hasEggInCategory ? '이미 부화장에 있어요' : eggSoldOut ? '모두 만났어요' : isRareEgg ? (hasEnoughFragments ? '희귀알 열기' : '조각 부족') : hasEnoughCoins ? '구매 가능' : '코인 부족',
    buttonLabel: isOwnedCostume ? '이미 보유 중' : hasEggInCategory ? '이미 부화장에 있어요' : eggSoldOut ? '모두 만났어요' : isRareEgg ? (hasEnoughFragments ? '희귀알 열기' : '조각 부족') : hasEnoughCoins ? '구매하기' : '코인 부족',
    canBuy,
    canBuyEggMore,
    eggAvailability,
    hasEnoughFragments,
    hasEnoughCoins,
    isComingSoon,
    isOwnedCostume,
  };
}

function getOwnedQuantity(item: ItemConfig, inventory: InventoryItemState[], ownedEggs: OwnedEgg[], ownedCostumeIds: string[]) {
  if (item.category === 'egg') return ownedEggs.filter((egg) => egg.eggItemId === item.id).length;
  if (item.category === 'costume') return ownedCostumeIds.includes(item.id) ? 1 : 0;
  return inventory.find((inventoryItem) => inventoryItem.itemId === item.id)?.quantity ?? 0;
}

function getItemIcon(item: ItemConfig) {
  if (item.category === 'food') return Utensils;
  if (item.category === 'costume') return Shirt;
  if (item.category === 'egg') return Egg;
  if (item.category === 'hatchItem') return Sparkles;
  if (item.category === 'dinosaur') return Package;
  return ShoppingBag;
}

function getItemTone(item: ItemConfig) {
  if (item.category === 'food') return 'bg-gradient-to-b from-amber-100 to-orange-100 text-orange-600';
  if (item.category === 'costume') return 'bg-gradient-to-b from-violet-100 to-fuchsia-100 text-violet-600';
  if (item.category === 'egg') return 'bg-gradient-to-b from-orange-100 to-yellow-100 text-orange-500';
  if (item.category === 'hatchItem') return 'bg-gradient-to-b from-cyan-100 to-amber-100 text-amber-600';
  return 'bg-gradient-to-b from-slate-100 to-slate-200 text-slate-500';
}

function getCategoryLabel(item: ItemConfig) {
  if (item.category === 'egg') return getEggCategoryLabel(item.eggCategory);
  if (isComingSoonItem(item)) return '준비 중';
  const labels: Record<string, string> = {
    food: '먹이',
    costume: '코스튬',
    egg: '알',
    hatchItem: '부화 아이템',
  };
  return labels[item.category] ?? '기타';
}

function getFriendlyDescription(item: ItemConfig) {
  if (item.category === 'food') return `${item.name}은 공룡의 체력을 회복하는 먹이예요. 행복할수록 체력이 조금 더 잘 회복돼요.`;
  if (item.category === 'costume') return `${item.name}은 공룡을 꾸며주는 아이템이에요. 우리 공룡 탭에서 입혀볼 수 있어요.`;
  if (item.category === 'egg' && item.eggCategory === 'rare') {
    const requiredFragment = getPrimaryRequiredFragment(item);
    return `${item.name}은 모험에서 얻은 희귀알 조각 ${requiredFragment?.amount ?? 0}개로 열 수 있는 장기 목표 알이에요. 코인으로 바로 구매하지 않아요.`;
  }
  if (item.category === 'egg') return `${item.name}은 어떤 공룡이 태어날지 모르는 신비한 알이에요. 부화장에서 따뜻하게 돌봐주세요.`;
  if (item.category === 'hatchItem') return `${item.name}은 알에게 힘을 주는 부화 아이템이에요. 사용하면 안쪽의 아기 공룡이 조금 더 힘을 낼 수 있어요.`;
  if (item.category === 'dinosaur') return '모험에서 얻는 희귀 조각이에요. 공룡을 바로 얻는 아이템이 아니라, 나중에 특별한 알을 여는 재료로 사용할 예정이에요.';
  return item.description;
}

function getPurchaseSuccessMessage(item: ItemConfig) {
  if (item.category === 'food') return '구매했어요! 우리 공룡 먹이 가방에 넣었어요.';
  if (item.category === 'hatchItem') return '구매했어요! 알 부화장에서 사용할 수 있어요.';
  if (item.category === 'egg' && item.eggCategory === 'rare') return '희귀알을 얻었어요! 알 부화장에서 확인해보세요.';
  if (item.category === 'egg') return '구매했어요! 알 부화장에서 돌볼 수 있어요.';
  if (item.category === 'costume') return '구매했어요! 우리 공룡 탭에서 입혀볼 수 있어요.';
  return '구매했어요!';
}

function getShopDetailMessage(item: ItemConfig, status: ReturnType<typeof getItemStatus>, isRareEgg: boolean, fragmentQuantity: number, requiredFragmentAmount: number, missingFragmentAmount: number, missingCoins: number) {
  if (item.category === 'egg' && status.eggAvailability?.hasEggInCategory) return `${getEggCategoryLabel(item.eggCategory)}은 이미 부화장에 있어요. 부화 후 다음 알을 준비할 수 있어요.`;
  if (item.category === 'egg' && !status.canBuyEggMore) return '이 알에서 만날 수 있는 공룡을 모두 만났어요. 다른 알을 선택해보세요.';
  if (isRareEgg) return status.hasEnoughFragments ? '공통 희귀알 조각을 소비해서 이 희귀알을 열 수 있어요.' : `공통 희귀알 조각이 부족해요. 내 조각 ${fragmentQuantity}개 · 필요 ${requiredFragmentAmount}개 · 부족 ${missingFragmentAmount}개`;
  return status.hasEnoughCoins ? '구매할 수 있어요.' : `코인이 부족해요. ${missingCoins.toLocaleString()}코인이 더 필요해요.`;
}

function isRareEggItem(item: Extract<ItemConfig, { category: 'egg' }>) {
  return item.eggCategory === 'rare' && getEggRequiredFragments(item).length > 0;
}

function getPrimaryRequiredFragment(item: Extract<ItemConfig, { category: 'egg' }>) {
  return getEggRequiredFragments(item)[0] ?? null;
}

function hasEnoughRequiredFragments(inventory: InventoryItemState[], item: Extract<ItemConfig, { category: 'egg' }>) {
  const requiredFragments = getEggRequiredFragments(item);
  return requiredFragments.length > 0 && requiredFragments.every((fragment) => getFragmentQuantity(inventory, fragment.itemId) >= fragment.amount);
}

function getFragmentQuantity(inventory: InventoryItemState[], itemId?: string) {
  if (!itemId) return 0;
  return inventory.find((item) => item.itemId === itemId)?.quantity ?? 0;
}

const rareEggFragmentItemId = 'rare-egg-fragment';

function getTotalRareEggFragmentRequirement() {
  return itemConfigs
    .filter((item): item is Extract<ItemConfig, { category: 'egg' }> => item.category === 'egg' && item.eggCategory === 'rare')
    .reduce((total, item) => total + getEggRequiredFragments(item).reduce((itemTotal, fragment) => itemTotal + (fragment.itemId === rareEggFragmentItemId ? fragment.amount : 0), 0), 0);
}

const eggCategoryOrder: EggCategory[] = ['normal', 'special', 'rare'];

function getEggCategoryLabel(category: EggCategory) {
  const labels: Record<EggCategory, string> = {
    normal: '일반알',
    special: '특수알',
    rare: '희귀알',
  };
  return labels[category];
}

function getEggCategoryBadgeTone(category: EggCategory) {
  const tones: Record<EggCategory, string> = {
    normal: 'bg-orange-100 text-orange-800',
    special: 'bg-sky-100 text-sky-800',
    rare: 'bg-violet-100 text-violet-800',
  };
  return tones[category];
}
