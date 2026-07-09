import { ChevronLeft, ChevronRight, Egg, Lock, PackageOpen, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getEggItemConfig, getHatchItemConfig, getItemsByCategory, type EggCategory, type HatchItemConfig } from '../../config/itemConfig';
import type { EggState, OwnedDinosaur, OwnedEgg } from '../../types/game';
import { getHatchCandidates, type HatchCandidateResult } from '../../utils/hatchCandidates';
import petHomeBackground from '../../assets/pet/backgrounds/bg_pet_home_forest.png';

type InventoryItemState = { itemId: string; quantity: number };
const showDeveloperPanels = false;

export type HatchResult = {
  eggName: string;
  eggRarity: EggState['rarity'];
  dinosaurName: string;
  speciesName: string;
  rarity: OwnedDinosaur['rarity'];
  message: string;
};

export interface HatcheryScreenProps {
  ownedEggs: OwnedEgg[];
  activeEggId: string | null;
  ownedDinosaurs: OwnedDinosaur[];
  inventory: InventoryItemState[];
  feedback?: string;
  hatchResult: HatchResult | null;
  onSelectEgg: (eggId: string) => void;
  onUseHatchItem: (itemId: string) => void;
  onHatchEgg: () => void;
  onGoToDex: () => void;
  onGoToDino: () => void;
  onCloseHatchResult: () => void;
}

export function HatcheryScreen({
  ownedEggs,
  activeEggId,
  ownedDinosaurs,
  inventory,
  feedback,
  hatchResult,
  onSelectEgg,
  onUseHatchItem,
  onHatchEgg,
  onGoToDex,
  onGoToDino,
  onCloseHatchResult,
}: HatcheryScreenProps) {
  const [selectedHatchItemId, setSelectedHatchItemId] = useState<string | null>(null);
  const activeEgg = getSelectedOwnedEgg(ownedEggs, activeEggId);
  const activeEggIndex = activeEgg ? ownedEggs.findIndex((egg) => egg.id === activeEgg.id) : -1;
  const hatchItems = useMemo(
    () =>
      inventory
        .map((entry) => ({ inventoryItem: entry, config: getHatchItemConfig(entry.itemId) }))
        .filter((entry): entry is { inventoryItem: InventoryItemState; config: HatchItemConfig } => Boolean(entry.config)),
    [inventory],
  );
  const selectedHatchItem = selectedHatchItemId ? hatchItems.find((entry) => entry.inventoryItem.itemId === selectedHatchItemId) ?? null : null;
  const hatchCandidateResult = useMemo(() => getHatchCandidates(activeEgg, ownedDinosaurs), [activeEgg, ownedDinosaurs]);
  const hatchProgress = clampProgress(activeEgg?.hatchProgress ?? 0);
  const isHatchReady = Boolean(activeEgg && hatchProgress >= 100);
  const canHatch = isHatchReady && hatchCandidateResult.candidates.length > 0 && !hatchResult;

  useEffect(() => {
    const firstAvailableItem = hatchItems.find((entry) => entry.inventoryItem.quantity > 0);
    if (!selectedHatchItemId && firstAvailableItem) {
      setSelectedHatchItemId(firstAvailableItem.inventoryItem.itemId);
      return;
    }

    if (selectedHatchItemId && !hatchItems.some((entry) => entry.inventoryItem.itemId === selectedHatchItemId && entry.inventoryItem.quantity > 0)) {
      setSelectedHatchItemId(firstAvailableItem?.inventoryItem.itemId ?? null);
    }
  }, [hatchItems, selectedHatchItemId]);

  function selectAdjacentEgg(direction: -1 | 1) {
    if (!activeEgg || ownedEggs.length <= 1) return;

    const nextIndex = (activeEggIndex + direction + ownedEggs.length) % ownedEggs.length;
    const nextEgg = ownedEggs[nextIndex];
    if (nextEgg) onSelectEgg(nextEgg.id);
  }

  function useSelectedHatchItem() {
    if (!selectedHatchItem || selectedHatchItem.inventoryItem.quantity <= 0 || hatchResult) return;
    onUseHatchItem(selectedHatchItem.inventoryItem.itemId);
  }

  return (
    <div className="hatchery-screen hatchery-bg relative grid h-full min-h-0 grid-cols-[82px_minmax(0,1fr)_230px] grid-rows-[auto_minmax(0,43fr)_minmax(0,15fr)_minmax(0,22fr)] gap-2 overflow-hidden rounded-[30px] border-4 border-white bg-emerald-100 p-2">
      <img src={petHomeBackground} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-amber-100/8 to-emerald-950/10" />

      <header className="hatchery-header relative z-10 col-span-3 grid min-h-12 grid-cols-[82px_minmax(0,1fr)_230px] items-center gap-2">
        <button
          onClick={onGoToDino}
          className="inline-flex h-11 items-center justify-center rounded-[16px] border-[3px] border-white bg-white/88 text-emerald-800 shadow-sm transition active:translate-y-1"
          aria-label="우리 공룡으로 돌아가기"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="truncate rounded-[18px] border-4 border-white bg-white/78 px-4 py-2 text-center text-xl font-black text-emerald-950 shadow-sm">알 부화장</h2>
        <div className="truncate rounded-[18px] border-4 border-white bg-amber-100/88 px-3 py-2 text-center text-sm font-black text-amber-900 shadow-sm">
          {getHatchStatusText(activeEgg, hatchCandidateResult)}
        </div>
      </header>

      <aside className="hatchery-side-menu relative z-10 col-start-1 row-span-2 row-start-2 grid min-h-0 content-start gap-2 pt-1">
        <button
          onClick={onGoToDino}
          className="hatchery-side-menu-button min-h-16 rounded-[18px] border-[3px] border-white bg-gradient-to-b from-lime-200 to-emerald-400 px-1.5 text-[13px] font-black leading-tight text-emerald-950 shadow-[0_5px_0_#059669] transition active:translate-y-1 active:shadow-none"
        >
          공룡<br />보기
        </button>
        <button className="hatchery-side-menu-button hatchery-side-menu-button--active min-h-16 rounded-[18px] border-[3px] border-white bg-gradient-to-b from-orange-200 to-amber-400 px-1.5 text-[13px] font-black leading-tight text-amber-950 shadow-[0_5px_0_#d97706]">
          알<br />부화장
        </button>
      </aside>

      <section className="hatchery-main-stage relative z-10 col-start-2 row-start-2 min-h-0 overflow-hidden">
        <EggStage
          activeEgg={activeEgg}
          eggCount={ownedEggs.length}
          hatchProgress={hatchProgress}
          canHatch={canHatch}
          hatchCandidateResult={hatchCandidateResult}
          onPreviousEgg={() => selectAdjacentEgg(-1)}
          onNextEgg={() => selectAdjacentEgg(1)}
        />
      </section>

      <aside className="hatchery-egg-slots relative z-10 col-start-3 row-start-2 min-h-0">
        <EggSlotPanel ownedEggs={ownedEggs} activeEgg={activeEgg} onSelectEgg={onSelectEgg} />
      </aside>

      <section className="hatchery-action-row relative z-10 col-span-2 col-start-2 row-start-3 grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(190px,230px)] gap-2">
        <HatchStatusPanel activeEgg={activeEgg} hatchCandidateResult={hatchCandidateResult} feedback={feedback} />
        <HatchActionPanel
          activeEgg={activeEgg}
          selectedHatchItem={selectedHatchItem}
          canHatch={canHatch}
          hatchResult={hatchResult}
          onUseHatchItem={useSelectedHatchItem}
          onHatchEgg={onHatchEgg}
        />
      </section>

      <section className="relative z-10 col-span-3 row-start-4 min-h-0">
        <HatchItemBagPanel
          inventory={inventory}
          hatchItems={hatchItems}
          selectedHatchItemId={selectedHatchItemId}
          disabled={!activeEgg || Boolean(hatchResult)}
          onSelectHatchItem={setSelectedHatchItemId}
        />
        {showDeveloperPanels && <DeveloperHatcheryDebugPanel activeEggId={activeEggId} activeEgg={activeEgg} ownedEggs={ownedEggs} inventory={inventory} hatchResult={hatchResult} />}
      </section>

      {hatchResult && <HatchResultPanel result={hatchResult} onGoToDex={onGoToDex} onGoToDino={onGoToDino} onClose={onCloseHatchResult} />}
    </div>
  );
}

function EggStage({
  activeEgg,
  eggCount,
  hatchProgress,
  canHatch,
  hatchCandidateResult,
  onPreviousEgg,
  onNextEgg,
}: {
  activeEgg: OwnedEgg | null;
  eggCount: number;
  hatchProgress: number;
  canHatch: boolean;
  hatchCandidateResult: HatchCandidateResult;
  onPreviousEgg: () => void;
  onNextEgg: () => void;
}) {
  const canSwitchEgg = eggCount > 1;
  const category = activeEgg ? getOwnedEggCategory(activeEgg) : 'normal';

  return (
    <section className="relative h-full min-h-0 overflow-hidden rounded-[28px] bg-transparent">
      {canSwitchEgg && (
        <>
          <button
            aria-label="이전 알"
            onClick={onPreviousEgg}
            className="absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-[18px] border-4 border-white bg-white/88 text-orange-800 shadow-[0_5px_0_#fdba74] transition active:translate-y-[calc(-50%+4px)] active:shadow-none"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            aria-label="다음 알"
            onClick={onNextEgg}
            className="absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-[18px] border-4 border-white bg-white/88 text-orange-800 shadow-[0_5px_0_#fdba74] transition active:translate-y-[calc(-50%+4px)] active:shadow-none"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}
      <div className="hatchery-egg-layer relative z-10 flex h-full min-h-0 flex-col items-center justify-end pb-3">
        {activeEgg ? (
          <>
            <div className={`hatchery-egg-glow absolute bottom-[26%] h-52 w-52 rounded-full blur-2xl ${getEggGlowTone(category)}`} />
            <div className="hatchery-egg-nest absolute bottom-4 h-14 w-[48%] rounded-[50%] bg-amber-900/14 blur-sm" />
            <div className={`hatchery-egg-image relative z-10 flex h-[82%] max-h-[330px] w-[min(46%,230px)] max-w-[230px] items-center justify-center rounded-[50%] border-[12px] border-white bg-gradient-to-br shadow-2xl ${getEggShellTone(category)}`}>
              <Egg className="h-[46%] w-[46%] text-orange-400/78" />
              {canHatch && <span className="absolute -right-4 top-8 rounded-full border-4 border-white bg-lime-400 px-3 py-1 text-xs font-black text-lime-950 shadow-lg">가능</span>}
            </div>
            <div className="relative z-10 mt-2 w-full max-w-md rounded-[18px] border-4 border-white bg-white/80 px-3 py-2 shadow-sm">
              <div className="mb-1 flex justify-between text-xs font-black text-emerald-800">
                <span>{getEggCategoryLabel(category)}</span>
                <span>{hatchProgress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-orange-100 shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-cyan-400" style={{ width: `${hatchProgress}%` }} />
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto grid max-w-sm place-items-center rounded-[26px] border-4 border-white bg-white/86 px-5 py-8 text-center shadow-lg">
            <PackageOpen className="h-16 w-16 text-orange-400" />
            <h3 className="mt-3 text-2xl font-black text-emerald-950">보유한 알이 없어요.</h3>
            <p className="mt-1 text-sm font-black text-emerald-700/75">상점에서 알을 준비해보세요.</p>
          </div>
        )}
      </div>
      {activeEgg && hatchCandidateResult.matchingSpecies.length === 0 && <p className="absolute bottom-4 left-4 z-20 max-w-[220px] truncate rounded-full bg-white/80 px-3 py-1 text-xs font-black text-orange-800 shadow-sm">후보 준비 중</p>}
    </section>
  );
}

function EggSlotPanel({ ownedEggs, activeEgg, onSelectEgg }: { ownedEggs: OwnedEgg[]; activeEgg: OwnedEgg | null; onSelectEgg: (eggId: string) => void }) {
  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[24px] border-4 border-white bg-white/82 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-orange-700">보유 알</p>
          <h4 className="text-xl font-black text-emerald-950">{Math.min(ownedEggs.length, eggSlotCategories.length)}/3</h4>
        </div>
        <Egg className="h-6 w-6 text-orange-500" />
      </div>
      <div className="grid min-h-0 gap-2">
        {eggSlotCategories.map((category) => {
          const egg = ownedEggs.find((ownedEgg) => getOwnedEggCategory(ownedEgg) === category) ?? null;
          const isActive = egg?.id === activeEgg?.id;

          if (!egg) {
            return (
              <div key={category} className="hatchery-egg-slot hatchery-egg-slot--locked grid min-h-0 content-center rounded-[18px] border-4 border-dashed border-orange-100 bg-orange-50/72 px-3 py-2 text-left text-orange-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-black">{getEggCategoryLabel(category)}</span>
                  <Lock className="h-4 w-4 shrink-0" />
                </div>
                <p className="mt-1 truncate text-xs font-black text-orange-700">미보유</p>
              </div>
            );
          }

          return (
            <button
              key={category}
              onClick={() => onSelectEgg(egg.id)}
              className={`hatchery-egg-slot ${isActive ? 'hatchery-egg-slot--selected hatchery-egg-slot--active' : ''} min-h-0 rounded-[18px] border-4 px-3 py-2 text-left shadow-sm transition active:translate-y-1 ${
                isActive ? 'border-amber-300 bg-amber-100 text-amber-950 shadow-[0_5px_0_#fbbf24]' : 'border-white bg-white/90 text-slate-600 hover:bg-orange-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-black">{getEggCategoryLabel(category)}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black">{isActive ? '선택' : '보유'}</span>
              </div>
              <p className="mt-1 truncate text-xs font-black opacity-75">{clampProgress(egg.hatchProgress)}% · {egg.name}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HatchStatusPanel({ activeEgg, hatchCandidateResult, feedback }: { activeEgg: OwnedEgg | null; hatchCandidateResult: HatchCandidateResult; feedback?: string }) {
  const progress = clampProgress(activeEgg?.hatchProgress ?? 0);
  const status = getHatchStatusText(activeEgg, hatchCandidateResult);

  return (
    <section className="hatchery-status-panel grid min-h-0 content-center overflow-hidden rounded-[22px] border-4 border-white bg-white/86 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-orange-700">부화 상태</p>
          <p className="truncate text-xl font-black text-emerald-950">{status}</p>
        </div>
        <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-sm font-black text-orange-800">{progress}%</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-orange-100 shadow-inner">
        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-cyan-400" style={{ width: `${progress}%` }} />
      </div>
      {feedback && <p className="mt-1 truncate text-xs font-black text-emerald-700">{feedback}</p>}
    </section>
  );
}

function HatchActionPanel({
  activeEgg,
  selectedHatchItem,
  canHatch,
  hatchResult,
  onUseHatchItem,
  onHatchEgg,
}: {
  activeEgg: OwnedEgg | null;
  selectedHatchItem: { inventoryItem: InventoryItemState; config: HatchItemConfig } | null;
  canHatch: boolean;
  hatchResult: HatchResult | null;
  onUseHatchItem: () => void;
  onHatchEgg: () => void;
}) {
  const canUseItem = Boolean(activeEgg && selectedHatchItem && selectedHatchItem.inventoryItem.quantity > 0 && !hatchResult);

  return (
    <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
      <button
        disabled={!canUseItem}
        onClick={onUseHatchItem}
        className="hatchery-hatch-item-button inline-flex min-h-0 items-center justify-center gap-2 rounded-[18px] border-4 border-white bg-gradient-to-b from-amber-300 to-orange-400 px-3 text-sm font-black text-white shadow-orange transition active:translate-y-1 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none"
      >
        <Sparkles className="h-5 w-5" />
        {selectedHatchItem ? `${selectedHatchItem.config.name} x${selectedHatchItem.inventoryItem.quantity}` : '아이템 선택'}
      </button>
      <button
        disabled={!canHatch}
        onClick={onHatchEgg}
        className="hatchery-hatch-button inline-flex min-h-0 items-center justify-center gap-2 rounded-[18px] border-4 border-white bg-gradient-to-b from-lime-300 to-emerald-500 px-3 text-sm font-black text-emerald-950 shadow-green transition active:translate-y-1 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none"
      >
        <Egg className="h-5 w-5" />
        부화하기
      </button>
    </section>
  );
}

function HatchItemBagPanel({
  inventory,
  hatchItems,
  selectedHatchItemId,
  disabled,
  onSelectHatchItem,
}: {
  inventory: InventoryItemState[];
  hatchItems: Array<{ inventoryItem: InventoryItemState; config: HatchItemConfig }>;
  selectedHatchItemId: string | null;
  disabled: boolean;
  onSelectHatchItem: (itemId: string) => void;
}) {
  const visibleSlotCount = 5;
  const targetSlotCount = 10;
  const [firstVisibleSlotIndex, setFirstVisibleSlotIndex] = useState(0);
  const hatchItemConfigs = getItemsByCategory('hatchItem') as HatchItemConfig[];
  const itemSlots: Array<{ id: string; config: HatchItemConfig | null; quantity: number; lockedLabel?: string }> = [
    ...hatchItemConfigs.map((config) => ({
      id: config.id,
      config,
      quantity: inventory.find((item) => item.itemId === config.id)?.quantity ?? hatchItems.find((item) => item.inventoryItem.itemId === config.id)?.inventoryItem.quantity ?? 0,
    })),
    ...Array.from({ length: Math.max(0, targetSlotCount - hatchItemConfigs.length) }, (_, index) => ({
      id: `locked-hatch-item-slot-${index + 1}`,
      config: null,
      quantity: 0,
      lockedLabel: '잠금',
    })),
  ];
  const maxFirstVisibleSlotIndex = Math.max(0, itemSlots.length - visibleSlotCount);
  const safeFirstVisibleSlotIndex = Math.min(firstVisibleSlotIndex, maxFirstVisibleSlotIndex);
  const visibleSlots = itemSlots.slice(safeFirstVisibleSlotIndex, safeFirstVisibleSlotIndex + visibleSlotCount);
  const canSlidePrev = safeFirstVisibleSlotIndex > 0;
  const canSlideNext = safeFirstVisibleSlotIndex < maxFirstVisibleSlotIndex;

  return (
    <section className="hatchery-item-bag mx-auto grid h-full min-h-0 w-full max-w-[740px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[22px] border-4 border-white bg-white/84 px-3 py-2 shadow-lg">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h4 className="text-base font-black text-emerald-950">부화 아이템</h4>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">
            {safeFirstVisibleSlotIndex + 1}-{safeFirstVisibleSlotIndex + visibleSlots.length} / {itemSlots.length}
          </span>
          <Sparkles className="h-5 w-5 text-amber-500" />
        </div>
      </div>
      <div className="grid min-h-0 grid-cols-[42px_minmax(0,1fr)_42px] items-stretch gap-2">
        <button
          aria-label="이전 부화 아이템"
          disabled={!canSlidePrev}
          onClick={() => setFirstVisibleSlotIndex((current) => Math.max(0, current - visibleSlotCount))}
          className="hatchery-item-arrow flex min-h-0 items-center justify-center rounded-[16px] border-4 border-white bg-white/86 text-amber-800 shadow-sm transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="hatchery-item-list grid min-h-0 grid-cols-5 gap-2 overflow-hidden">
          {visibleSlots.map(({ id, config, quantity, lockedLabel }) => {
            if (!config) {
              return (
                <div key={id} className="hatchery-item-slot hatchery-item-slot--locked grid min-h-0 place-items-center rounded-[16px] border-4 border-dashed border-slate-200 bg-slate-50/80 px-2 text-center text-xs font-black text-slate-400">
                  <Lock className="h-5 w-5" />
                  {lockedLabel}
                </div>
              );
            }

            const isSelected = selectedHatchItemId === config.id;
            const isDisabled = disabled || quantity <= 0;

            return (
              <button
                key={config.id}
                disabled={isDisabled}
                onClick={() => onSelectHatchItem(config.id)}
                className={`hatchery-item-slot ${isSelected ? 'hatchery-item-slot--selected' : ''} min-h-0 rounded-[16px] border-4 px-2 py-1.5 text-center shadow-sm transition active:translate-y-1 ${
                  isSelected ? 'border-amber-400 bg-gradient-to-b from-yellow-200 to-orange-200 text-amber-950 shadow-[0_5px_0_#f59e0b]' : 'border-white bg-gradient-to-b from-amber-100 to-orange-100 text-amber-950'
                } ${isDisabled ? 'cursor-not-allowed opacity-45 shadow-none' : 'hover:brightness-105'}`}
              >
                <p className="truncate text-sm font-black">{config.name}</p>
                <p className="mt-1 rounded-full bg-white px-2 py-0.5 text-xs font-black text-orange-700">x{quantity}</p>
                {isSelected && <p className="mx-auto mt-1 w-fit rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">선택</p>}
              </button>
            );
          })}
        </div>
        <button
          aria-label="다음 부화 아이템"
          disabled={!canSlideNext}
          onClick={() => setFirstVisibleSlotIndex((current) => Math.min(maxFirstVisibleSlotIndex, current + visibleSlotCount))}
          className="hatchery-item-arrow flex min-h-0 items-center justify-center rounded-[16px] border-4 border-white bg-white/86 text-amber-800 shadow-sm transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
}

function HatchResultPanel({ result, onGoToDex, onGoToDino, onClose }: { result: HatchResult; onGoToDex: () => void; onGoToDino: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 pb-[calc(112px+env(safe-area-inset-bottom))] pt-5 backdrop-blur-sm">
      <section className="max-h-full w-full max-w-2xl overflow-y-auto rounded-[36px] border-4 border-white bg-gradient-to-b from-amber-100 via-white to-lime-100 p-5 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)] md:p-8">
        <p className="mx-auto mb-4 w-fit rounded-full bg-orange-200 px-5 py-2 text-sm font-black text-orange-900">알이 톡! 하고 갈라졌어요!</p>
        <div className="mx-auto grid max-w-lg grid-cols-[0.8fr_1fr] items-end gap-4">
          <div className="relative flex min-h-48 items-end justify-center">
            <div className="absolute bottom-0 h-10 w-40 rounded-full bg-orange-900/10 blur-md" />
            <div className="relative flex h-36 w-44 items-end justify-center overflow-hidden rounded-b-[50%] border-[10px] border-white border-t-0 bg-gradient-to-br from-amber-100 via-white to-orange-200 shadow-xl">
              <Egg className="mb-8 h-20 w-20 text-orange-300" />
              <div className="absolute left-4 top-2 h-12 w-16 -rotate-12 rounded-[50%] border-8 border-white bg-orange-100" />
              <div className="absolute right-4 top-4 h-10 w-14 rotate-12 rounded-[50%] border-8 border-white bg-orange-100" />
            </div>
          </div>
          <div className="relative flex min-h-56 items-end justify-center rounded-[30px] bg-gradient-to-b from-sky-100 to-lime-200 p-4 shadow-inner">
            <DinoAvatar />
          </div>
        </div>
        <h3 className="mt-5 text-4xl font-black text-emerald-950">{result.dinosaurName}</h3>
        <p className="mt-2 text-lg font-black text-emerald-800">
          {result.speciesName} · {formatRarity(result.rarity)}
        </p>
        <p className="mx-auto mt-4 max-w-lg rounded-[24px] border-4 border-white bg-white/90 px-5 py-4 text-lg font-black leading-relaxed text-emerald-900 shadow-sm">{result.message}</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <button onClick={onGoToDex} className="min-h-14 rounded-full bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#0284c7] transition active:translate-y-1 active:shadow-none">
            도감으로 이동
          </button>
          <button onClick={onGoToDino} className="min-h-14 rounded-full bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#b45309] transition active:translate-y-1 active:shadow-none">
            우리 공룡으로 이동
          </button>
          <button onClick={onClose} className="min-h-14 rounded-full bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#047857] transition active:translate-y-1 active:shadow-none">
            계속 부화장 보기
          </button>
        </div>
      </section>
    </div>
  );
}

function DinoAvatar() {
  return (
    <div className="relative z-10 h-52 w-52 drop-shadow-2xl" aria-label="태어난 아기 공룡">
      <div className="absolute bottom-[13%] left-1/2 h-28 w-32 -translate-x-1/2 rounded-[45%] border-4 border-emerald-200 bg-emerald-400" />
      <div className="absolute left-1/2 top-[12%] h-24 w-28 -translate-x-1/2 rounded-[45%] border-4 border-emerald-200 bg-emerald-300" />
      <div className="absolute left-[38%] top-[27%] h-[12%] w-[12%] rounded-full bg-white">
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800" />
      </div>
      <div className="absolute right-[38%] top-[27%] h-[12%] w-[12%] rounded-full bg-white">
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800" />
      </div>
      <div className="absolute left-1/2 top-[43%] h-[4%] w-[18%] -translate-x-1/2 rounded-full bg-emerald-700/35" />
      <div className="absolute bottom-[30%] left-[17%] h-[16%] w-[12%] rotate-[-20deg] rounded-full bg-emerald-300" />
      <div className="absolute bottom-[30%] right-[17%] h-[16%] w-[12%] rotate-[20deg] rounded-full bg-emerald-300" />
      <div className="absolute bottom-[4%] left-[34%] h-[18%] w-[13%] rounded-full bg-emerald-500" />
      <div className="absolute bottom-[4%] right-[34%] h-[18%] w-[13%] rounded-full bg-emerald-500" />
      <div className="absolute right-[5%] top-[52%] h-[18%] w-[30%] rotate-[28deg] rounded-full bg-emerald-300" />
    </div>
  );
}

function DeveloperHatcheryDebugPanel({
  activeEggId,
  activeEgg,
  ownedEggs,
  inventory,
  hatchResult,
}: {
  activeEggId: string | null;
  activeEgg: OwnedEgg | null;
  ownedEggs: OwnedEgg[];
  inventory: InventoryItemState[];
  hatchResult: HatchResult | null;
}) {
  return (
    <details className="rounded-[26px] border-4 border-dashed border-slate-200 bg-white/62 px-4 py-3">
      <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용: 알 상태 데이터</summary>
      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500">
        <p className="break-all rounded-[18px] bg-white/80 px-3 py-2 font-mono">activeEggId: {activeEggId ?? '-'}</p>
        <pre className="max-h-40 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(activeEgg, null, 2)}</pre>
        <pre className="max-h-40 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(ownedEggs, null, 2)}</pre>
        <pre className="max-h-40 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(inventory, null, 2)}</pre>
        <pre className="max-h-40 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(hatchResult, null, 2)}</pre>
      </div>
    </details>
  );
}

function getSelectedOwnedEgg(ownedEggs: OwnedEgg[], activeEggId?: string | null) {
  return ownedEggs.find((egg) => egg.id === activeEggId) ?? ownedEggs[0] ?? null;
}

const eggSlotCategories: EggCategory[] = ['normal', 'special', 'rare'];

function getOwnedEggCategory(egg: OwnedEgg): EggCategory {
  if (egg.eggCategory) return egg.eggCategory;

  const itemConfig = getEggItemConfig(egg.eggItemId);
  if (itemConfig) return itemConfig.eggCategory;
  if (egg.eggType === 'rare-spark' || egg.eggType === 'special') return 'special';
  if (egg.eggType === 'rare') return 'rare';
  return 'normal';
}

function getEggCategoryLabel(category: EggCategory) {
  const labels: Record<EggCategory, string> = {
    normal: '일반 알',
    special: '특별 알',
    rare: '희귀 알',
  };
  return labels[category];
}

function getEggShellTone(category: EggCategory) {
  if (category === 'rare') return 'from-violet-100 via-white to-fuchsia-200';
  if (category === 'special') return 'from-sky-100 via-white to-cyan-200';
  return 'from-amber-100 via-white to-orange-200';
}

function getEggGlowTone(category: EggCategory) {
  if (category === 'rare') return 'bg-violet-300/40';
  if (category === 'special') return 'bg-cyan-300/40';
  return 'bg-amber-300/45';
}

function getEggCategoryBadgeTone(category: EggCategory) {
  if (category === 'rare') return 'bg-violet-100 text-violet-800';
  if (category === 'special') return 'bg-sky-100 text-sky-800';
  return 'bg-white/90 text-orange-800';
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getHatchStatusText(activeEgg: OwnedEgg | null, hatchCandidateResult: HatchCandidateResult) {
  if (!activeEgg) return '알 선택 필요';

  const progress = clampProgress(activeEgg.hatchProgress);
  if (progress < 100) return `부화 진행 ${progress}%`;
  if (hatchCandidateResult.matchingSpecies.length === 0) return '후보 준비 중';
  if (hatchCandidateResult.candidates.length === 0) return '새 후보 없음';
  return '부화 가능';
}

function formatRarity(rarity: OwnedDinosaur['rarity']) {
  const labels: Record<OwnedDinosaur['rarity'], string> = {
    common: '일반',
    rare: '희귀',
    epic: '영웅',
    special: '특별',
    legendary: '전설',
  };

  return labels[rarity];
}
