import { Coins, Egg, Package, Shirt, ShoppingBag, Sparkles, Utensils, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { itemConfigs, type ItemConfig } from '../../config/itemConfig';
import type { OwnedEgg } from '../../types/game';

type InventoryItemState = { itemId: string; quantity: number };
type ShopCategoryId = 'all' | 'food' | 'costume' | 'egg' | 'hatchItem' | 'comingSoon';

export interface ShopScreenProps {
  coins: number;
  feedback: string;
  inventory: InventoryItemState[];
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
  { id: 'comingSoon', label: '준비 중' },
];

export function ShopScreen({ coins, feedback, inventory, ownedEggs, ownedCostumeIds, onPurchase }: ShopScreenProps) {
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
      <ShopItemGrid items={visibleItems} coins={coins} inventory={inventory} ownedEggs={ownedEggs} ownedCostumeIds={ownedCostumeIds} onSelectItem={setSelectedItemId} />
      <DeveloperShopDebugPanel inventory={inventory} ownedEggs={ownedEggs} ownedCostumeIds={ownedCostumeIds} />

      {selectedItem && <ShopItemDetailModal item={selectedItem} coins={coins} inventory={inventory} ownedEggs={ownedEggs} ownedCostumeIds={ownedCostumeIds} onClose={() => setSelectedItemId(null)} onPurchase={onPurchase} />}
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
            className={`min-h-12 shrink-0 rounded-[18px] px-4 text-sm font-black transition active:translate-y-1 ${
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
  items,
  coins,
  inventory,
  ownedEggs,
  ownedCostumeIds,
  onSelectItem,
}: {
  items: ItemConfig[];
  coins: number;
  inventory: InventoryItemState[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onSelectItem: (itemId: string) => void;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <ShopItemCard key={item.id} item={item} coins={coins} inventory={inventory} ownedEggs={ownedEggs} ownedCostumeIds={ownedCostumeIds} onSelect={() => onSelectItem(item.id)} />
      ))}
    </section>
  );
}

function ShopItemCard({
  item,
  coins,
  inventory,
  ownedEggs,
  ownedCostumeIds,
  onSelect,
}: {
  item: ItemConfig;
  coins: number;
  inventory: InventoryItemState[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onSelect: () => void;
}) {
  const status = getItemStatus(item, coins, inventory, ownedEggs, ownedCostumeIds);
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
  ownedEggs,
  ownedCostumeIds,
  onClose,
  onPurchase,
}: {
  item: ItemConfig;
  coins: number;
  inventory: InventoryItemState[];
  ownedEggs: OwnedEgg[];
  ownedCostumeIds: string[];
  onClose: () => void;
  onPurchase: (itemId: string) => void;
}) {
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const status = getItemStatus(item, coins, inventory, ownedEggs, ownedCostumeIds);
  const Icon = getItemIcon(item);
  const missingCoins = Math.max(0, item.price - coins);

  function handlePurchase() {
    if (status.isComingSoon) return;

    if (status.isOwnedCostume) {
      setPurchaseMessage('이미 보유 중이에요. 우리 공룡 탭에서 입혀볼 수 있어요.');
      return;
    }

    if (!status.hasEnoughCoins) {
      setPurchaseMessage(`코인이 부족해요. ${missingCoins.toLocaleString()}코인이 더 필요해요.`);
      return;
    }

    onPurchase(item.id);
    setPurchaseMessage(getPurchaseSuccessMessage(item));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-3 pb-[calc(112px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm sm:px-4 sm:pt-6">
      <section className="grid max-h-full min-h-0 w-full max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[28px] border-4 border-white bg-gradient-to-b from-white via-violet-50 to-cyan-50 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="flex justify-end px-3 pt-3">
          <button aria-label="닫기" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-slate-900 text-white transition active:translate-y-1">
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
            <div className="rounded-[20px] bg-amber-100 px-4 py-2 text-amber-950 shadow-sm">
              <p className="text-xs font-black text-amber-700">가격</p>
              <p className="mt-1 inline-flex items-center justify-center gap-1 text-lg font-black sm:text-xl">
                <Coins className="h-5 w-5 text-amber-600" />
                {status.isComingSoon ? '준비 중' : `${item.price}코인`}
              </p>
            </div>
            <div className="rounded-[20px] bg-white/90 px-4 py-2 text-slate-900 shadow-sm">
              <p className="text-xs font-black text-slate-500">내 코인</p>
              <p className="mt-1 inline-flex items-center justify-center gap-1 text-lg font-black sm:text-xl">
                <Coins className="h-5 w-5 text-amber-600" />
                {coins.toLocaleString()}코인
              </p>
            </div>
          </div>
          <p className="mx-auto w-fit rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-slate-500">{status.ownedLabel}</p>
        </div>
        <div className="grid gap-2 border-t-4 border-white bg-white/90 p-3 text-center sm:p-4">
          {status.isComingSoon ? (
            <p className="rounded-[18px] bg-slate-100 px-4 py-3 text-sm font-black text-slate-600">추후 모험에서 사용할 수 있어요. 아직 구매할 수 없는 아이템이에요.</p>
          ) : (
            <>
              <p className={`rounded-[18px] px-4 py-2 text-sm font-black ${status.hasEnoughCoins || status.isOwnedCostume ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {purchaseMessage || (status.hasEnoughCoins ? '구매할 수 있어요.' : `코인이 부족해요. ${missingCoins.toLocaleString()}코인이 더 필요해요.`)}
              </p>
              <button
                disabled={status.isOwnedCostume}
                onClick={handlePurchase}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[22px] border-4 border-white bg-gradient-to-b from-violet-400 to-violet-600 px-8 text-base font-black text-white shadow-[0_6px_0_#7c3aed] transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-16 sm:text-lg"
              >
                <ShoppingBag className="h-6 w-6" />
                {status.hasEnoughCoins && !status.isOwnedCostume ? `${item.price}코인으로 구매` : status.buttonLabel}
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
  if (category === 'all') return true;
  if (category === 'comingSoon') return isComingSoonItem(item);
  return item.category === category && !isComingSoonItem(item);
}

function isComingSoonItem(item: ItemConfig) {
  return item.category === 'dinosaur' || item.category === 'toy' || item.category === 'misc';
}

function getItemStatus(item: ItemConfig, coins: number, inventory: InventoryItemState[], ownedEggs: OwnedEgg[], ownedCostumeIds: string[]) {
  const ownedQuantity = getOwnedQuantity(item, inventory, ownedEggs, ownedCostumeIds);
  const isOwnedCostume = item.category === 'costume' && ownedCostumeIds.includes(item.id);
  const isComingSoon = isComingSoonItem(item);
  const hasEnoughCoins = coins >= item.price;
  const canBuy = !isComingSoon && !isOwnedCostume && hasEnoughCoins;

  return {
    ownedLabel: item.category === 'costume' ? (isOwnedCostume ? '보유 중' : '아직 없음') : `보유 x${ownedQuantity}`,
    actionLabel: isComingSoon ? '추후 사용 예정' : isOwnedCostume ? '이미 보유 중' : hasEnoughCoins ? '구매 가능' : '코인 부족',
    buttonLabel: isOwnedCostume ? '이미 보유 중' : hasEnoughCoins ? '구매하기' : '코인 부족',
    canBuy,
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
  if (item.category === 'food') return `${item.name}은 공룡이 좋아하는 간식이에요. 먹으면 배도 든든해지고 기분도 조금 좋아질 수 있어요.`;
  if (item.category === 'costume') return `${item.name}은 공룡을 꾸며주는 아이템이에요. 우리 공룡 탭에서 입혀볼 수 있어요.`;
  if (item.category === 'egg') return `${item.name}은 어떤 공룡이 태어날지 모르는 신비한 알이에요. 부화장에서 따뜻하게 돌봐주세요.`;
  if (item.category === 'hatchItem') return `${item.name}은 알에게 힘을 주는 부화 아이템이에요. 사용하면 안쪽의 아기 공룡이 조금 더 힘을 낼 수 있어요.`;
  if (item.category === 'dinosaur') return '희귀 공룡을 만나기 위한 조각이에요. 추후 모험에서 사용할 수 있어요.';
  return item.description;
}

function getPurchaseSuccessMessage(item: ItemConfig) {
  if (item.category === 'food') return '구매했어요! 우리 공룡 먹이 가방에 넣었어요.';
  if (item.category === 'hatchItem') return '구매했어요! 알 부화장에서 사용할 수 있어요.';
  if (item.category === 'egg') return '구매했어요! 알 부화장에서 돌볼 수 있어요.';
  if (item.category === 'costume') return '구매했어요! 우리 공룡 탭에서 입혀볼 수 있어요.';
  return '구매했어요!';
}
