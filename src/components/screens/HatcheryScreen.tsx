import { ChevronLeft, ChevronRight, Egg, PackageOpen, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getEggItemConfig, getHatchItemConfig, type EggCategory } from '../../config/itemConfig';
import type { EggState, OwnedDinosaur, OwnedEgg } from '../../types/game';
import { getHatchCandidates, type HatchCandidateResult } from '../../utils/hatchCandidates';

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
        .filter((entry): entry is { inventoryItem: InventoryItemState; config: NonNullable<ReturnType<typeof getHatchItemConfig>> } => Boolean(entry.config) && entry.inventoryItem.quantity > 0),
    [inventory],
  );
  const selectedHatchItem = selectedHatchItemId ? hatchItems.find((entry) => entry.inventoryItem.itemId === selectedHatchItemId) ?? null : null;
  const hatchCandidateResult = useMemo(() => getHatchCandidates(activeEgg, ownedDinosaurs), [activeEgg, ownedDinosaurs]);
  const hatchProgress = clampProgress(activeEgg?.hatchProgress ?? 0);
  const isHatchReady = Boolean(activeEgg && hatchProgress >= 100);
  const canHatch = isHatchReady && hatchCandidateResult.candidates.length > 0 && !hatchResult;

  useEffect(() => {
    if (!selectedHatchItemId && hatchItems[0]) {
      setSelectedHatchItemId(hatchItems[0].inventoryItem.itemId);
      return;
    }

    if (selectedHatchItemId && !hatchItems.some((entry) => entry.inventoryItem.itemId === selectedHatchItemId)) {
      setSelectedHatchItemId(hatchItems[0]?.inventoryItem.itemId ?? null);
    }
  }, [hatchItems, selectedHatchItemId]);

  function selectAdjacentEgg(direction: -1 | 1) {
    if (!activeEgg || ownedEggs.length <= 1) return;

    const nextIndex = (activeEggIndex + direction + ownedEggs.length) % ownedEggs.length;
    const nextEgg = ownedEggs[nextIndex];
    if (nextEgg) onSelectEgg(nextEgg.id);
  }

  function useSelectedHatchItem() {
    if (!selectedHatchItem || hatchResult) return;
    onUseHatchItem(selectedHatchItem.inventoryItem.itemId);
  }

  return (
    <div className="relative grid h-full min-h-0 gap-3 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
      <aside className="grid min-h-0 content-start gap-3">
        <EggInventoryPanel ownedEggs={ownedEggs} activeEgg={activeEgg} onSelectEgg={onSelectEgg} />
        {showDeveloperPanels && <DeveloperHatcheryDebugPanel activeEggId={activeEggId} activeEgg={activeEgg} ownedEggs={ownedEggs} inventory={inventory} hatchResult={hatchResult} />}
      </aside>

      <section className="game-panel min-h-0 overflow-hidden p-2">
        <EggMainCard
          activeEgg={activeEgg}
          eggCount={ownedEggs.length}
          canHatch={canHatch}
          hatchCandidateResult={hatchCandidateResult}
          feedback={feedback}
          onPreviousEgg={() => selectAdjacentEgg(-1)}
          onNextEgg={() => selectAdjacentEgg(1)}
          onHatchEgg={onHatchEgg}
        />
      </section>

      <aside className="grid min-h-0 content-start gap-3">
        <HatchItemPanel hatchItems={hatchItems} selectedHatchItemId={selectedHatchItemId} disabled={!activeEgg || Boolean(hatchResult)} onSelectHatchItem={setSelectedHatchItemId} onUseHatchItem={useSelectedHatchItem} />
        <HatchStatusPanel activeEgg={activeEgg} hatchCandidateResult={hatchCandidateResult} />
      </aside>

      {hatchResult && <HatchResultPanel result={hatchResult} onGoToDex={onGoToDex} onGoToDino={onGoToDino} onClose={onCloseHatchResult} />}
    </div>
  );
}

function EggInventoryPanel({ ownedEggs, activeEgg, onSelectEgg }: { ownedEggs: OwnedEgg[]; activeEgg: OwnedEgg | null; onSelectEgg: (eggId: string) => void }) {
  const ownedEggCount = Math.min(ownedEggs.length, eggSlotCategories.length);

  return (
    <section className="rounded-[24px] border-4 border-white bg-white/84 p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-orange-700">알 슬롯</p>
          <h4 className="text-xl font-black text-emerald-950">{ownedEggCount}/3</h4>
        </div>
        <Egg className="h-7 w-7 text-orange-500" />
      </div>
      <div className="grid gap-2">
        {eggSlotCategories.map((category) => {
          const egg = ownedEggs.find((ownedEgg) => getOwnedEggCategory(ownedEgg) === category) ?? null;
          const isActive = egg?.id === activeEgg?.id;

          if (!egg) {
            return (
              <div key={category} className="rounded-[18px] border-4 border-dashed border-orange-100 bg-orange-50/80 px-3 py-2 text-left text-orange-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black">{getEmptyEggSlotTitle(category)}</span>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-black ${getEggCategoryBadgeTone(category)}`}>{getEggCategoryLabel(category)}</span>
                </div>
                <p className="mt-1 text-xs font-black text-orange-700">{getEmptyEggSlotDescription(category)}</p>
              </div>
            );
          }

          return (
            <button
              key={category}
              onClick={() => onSelectEgg(egg.id)}
              className={`rounded-[18px] border-4 px-3 py-2 text-left shadow-sm transition active:translate-y-1 ${
                isActive ? 'border-amber-300 bg-amber-100 text-amber-950 shadow-[0_5px_0_#fbbf24]' : 'border-white bg-white/90 text-slate-600 hover:bg-orange-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black">{egg.name}</span>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black">{isActive ? '부화 중' : getEggCategoryLabel(category)}</span>
              </div>
              <p className="mt-1 text-xs font-black opacity-75">부화 준비 {clampProgress(egg.hatchProgress)}%</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EggMainCard({
  activeEgg,
  eggCount,
  canHatch,
  hatchCandidateResult,
  feedback,
  onPreviousEgg,
  onNextEgg,
  onHatchEgg,
}: {
  activeEgg: OwnedEgg | null;
  eggCount: number;
  canHatch: boolean;
  hatchCandidateResult: HatchCandidateResult;
  feedback?: string;
  onPreviousEgg: () => void;
  onNextEgg: () => void;
  onHatchEgg: () => void;
}) {
  const progress = clampProgress(activeEgg?.hatchProgress ?? 0);
  const reaction = getEggReactionText(activeEgg, hatchCandidateResult, feedback);

  return (
    <section className="relative min-h-[clamp(410px,calc(100vh-15.75rem),540px)] overflow-hidden rounded-[28px] border-4 border-white bg-gradient-to-b from-orange-100 via-amber-100 to-cyan-100 p-4 text-center shadow-inner">
      <div className="absolute bottom-0 left-0 right-0 h-32 rounded-t-[50%] bg-amber-300/45" />
      {eggCount > 1 && (
        <>
          <button
            aria-label="이전 알"
            onClick={onPreviousEgg}
            className="absolute left-5 top-1/2 z-20 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-[24px] border-4 border-white bg-white/92 text-orange-800 shadow-[0_6px_0_#fdba74] transition active:translate-y-[calc(-50%+4px)] active:shadow-none"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button
            aria-label="다음 알"
            onClick={onNextEgg}
            className="absolute right-5 top-1/2 z-20 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-[24px] border-4 border-white bg-white/92 text-orange-800 shadow-[0_6px_0_#fdba74] transition active:translate-y-[calc(-50%+4px)] active:shadow-none"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </>
      )}
      <div className="relative z-10 flex min-h-[clamp(350px,calc(100vh-19rem),455px)] flex-col items-center justify-center pt-8">
        {activeEgg ? (
          <>
            <p className={`mb-2 rounded-full border-4 border-white px-4 py-1.5 text-sm font-black shadow-sm ${getEggCategoryBadgeTone(getOwnedEggCategory(activeEgg))}`}>{getEggCategoryLabel(getOwnedEggCategory(activeEgg))}</p>
            <div className="relative mb-3">
              <div className="absolute inset-x-10 bottom-0 h-12 rounded-full bg-orange-900/10 blur-md" />
              <div className="relative flex h-56 w-44 items-center justify-center rounded-[50%] border-[12px] border-white bg-gradient-to-br from-amber-100 via-white to-orange-200 shadow-2xl">
                <Egg className="h-24 w-24 text-orange-400" />
              </div>
              {progress >= 100 && <div className="absolute -right-7 top-8 rounded-full border-4 border-white bg-lime-400 px-3 py-1.5 text-sm font-black text-lime-950 shadow-lg">준비 완료</div>}
            </div>
            <h3 className="text-3xl font-black text-emerald-950 md:text-4xl">{activeEgg.name}</h3>
            <p className="mt-2 max-w-md rounded-[20px] border-4 border-white bg-white/90 px-4 py-2 text-base font-black leading-relaxed text-emerald-900 shadow-sm">{reaction}</p>
            <div className="mt-3 w-full max-w-xl rounded-[22px] border-4 border-white bg-white/82 p-3 shadow-sm">
              <div className="mb-2 flex justify-between text-sm font-black text-emerald-800">
                <span>{progress >= 100 ? '부화 준비 완료!' : '부화 준비'}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-5 overflow-hidden rounded-full bg-orange-100 shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-cyan-400" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button
              disabled={!canHatch}
              onClick={onHatchEgg}
              className={`mt-3 inline-flex min-h-14 items-center justify-center gap-2 rounded-[22px] border-4 border-white px-8 text-base font-black text-white transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 ${
                canHatch ? 'bg-gradient-to-b from-orange-400 to-amber-500 shadow-[0_7px_0_#d97706]' : 'bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_7px_0_#94a3b8]'
              }`}
            >
              <Egg className="h-6 w-6" />
              부화하기
            </button>
          </>
        ) : (
          <div className="mx-auto grid max-w-md place-items-center rounded-[28px] border-4 border-white bg-white/86 px-5 py-8 shadow-lg">
            <PackageOpen className="h-20 w-20 text-orange-400" />
            <h3 className="mt-4 text-3xl font-black text-emerald-950">아직 보유한 알이 없어요.</h3>
            <p className="mt-2 font-black text-emerald-700/75">상점에서 알을 데려올 수 있어요.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function HatchItemPanel({
  hatchItems,
  selectedHatchItemId,
  disabled,
  onSelectHatchItem,
  onUseHatchItem,
}: {
  hatchItems: Array<{ inventoryItem: InventoryItemState; config: NonNullable<ReturnType<typeof getHatchItemConfig>> }>;
  selectedHatchItemId: string | null;
  disabled: boolean;
  onSelectHatchItem: (itemId: string) => void;
  onUseHatchItem: () => void;
}) {
  const selectedItem = selectedHatchItemId ? hatchItems.find((entry) => entry.inventoryItem.itemId === selectedHatchItemId) ?? null : null;

  return (
    <section className="rounded-[24px] border-4 border-white bg-white/84 p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-amber-700">부화 아이템</p>
          <h4 className="text-xl font-black text-emerald-950">아이템 사용</h4>
        </div>
        <Sparkles className="h-7 w-7 text-amber-500" />
      </div>
      <div className="mb-2 rounded-[18px] bg-amber-50 px-3 py-2">
        <p className="text-xs font-black text-amber-700">선택한 아이템</p>
        <p className="mt-1 text-base font-black text-amber-950">{selectedItem ? selectedItem.config.name : '아이템을 선택해주세요.'}</p>
      </div>
      <button disabled={disabled || !selectedItem} onClick={onUseHatchItem} className="mb-2 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] border-4 border-white bg-gradient-to-b from-amber-300 to-orange-400 px-5 text-base font-black text-white shadow-orange transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-45">
        <Sparkles className="h-5 w-5" />
        사용하기
      </button>
      <div className="grid gap-2">
        {hatchItems.length === 0 ? (
          <p className="rounded-[20px] bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">상점에서 부화 아이템을 구매하거나 훈련 세트를 완료해보세요.</p>
        ) : (
          hatchItems.map(({ inventoryItem, config }) => {
            const isSelected = selectedHatchItemId === inventoryItem.itemId;
            return (
              <button
                key={inventoryItem.itemId}
                disabled={disabled || inventoryItem.quantity <= 0}
                onClick={() => onSelectHatchItem(inventoryItem.itemId)}
                className={`min-h-16 rounded-[18px] border-4 px-3 py-2 text-left shadow-sm transition active:translate-y-1 ${
                  isSelected ? 'border-amber-400 bg-gradient-to-b from-yellow-200 to-orange-200 text-amber-950 shadow-[0_6px_0_#f59e0b]' : 'border-white bg-gradient-to-b from-amber-100 to-orange-100 text-amber-950 hover:brightness-105'
                } disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black">{config.name}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black">x{inventoryItem.quantity}</span>
                </div>
                <p className="mt-1 text-xs font-black text-amber-700">부화 +{config.effect.hatchProgress}%</p>
                {isSelected && <p className="mt-1 w-fit rounded-full bg-amber-500 px-3 py-0.5 text-xs font-black text-white">선택됨</p>}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function HatchStatusPanel({ activeEgg, hatchCandidateResult }: { activeEgg: OwnedEgg | null; hatchCandidateResult: HatchCandidateResult }) {
  const progress = clampProgress(activeEgg?.hatchProgress ?? 0);
  const value = !activeEgg ? '선택 필요' : progress < 100 ? `${100 - progress}% 남음` : hatchCandidateResult.candidates.length === 0 ? '새 후보 없음' : '준비 완료';

  return (
    <section className="rounded-[22px] border-4 border-white bg-white/78 p-3 shadow-sm">
      <p className="text-xs font-black text-orange-700">부화 상태</p>
      <p className="mt-1 text-2xl font-black text-emerald-950">{value}</p>
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
        <p className="mt-2 text-lg font-black text-emerald-800">{result.speciesName} · {formatRarity(result.rarity)}</p>
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
    normal: '일반알',
    special: '특수알',
    rare: '희귀알',
  };
  return labels[category];
}

function getEmptyEggSlotTitle(category: EggCategory) {
  return `${getEggCategoryLabel(category)} 없음`;
}

function getEmptyEggSlotDescription(category: EggCategory) {
  if (category === 'rare') return '모험에서 희귀알 조각을 모아보세요.';
  return `상점에서 ${getEggCategoryLabel(category)}을 준비해보세요.`;
}

function getEggCategoryBadgeTone(category: EggCategory) {
  if (category === 'rare') return 'bg-violet-100 text-violet-800';
  if (category === 'special') return 'bg-sky-100 text-sky-800';
  return 'bg-white/90 text-orange-800';
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getEggReactionText(activeEgg: OwnedEgg | null, hatchCandidateResult: HatchCandidateResult, feedback?: string) {
  if (!activeEgg) return '부화할 알을 선택해주세요.';
  const progress = clampProgress(activeEgg.hatchProgress);
  if (progress < 100) return '부화 에너지를 더 채워주세요.';
  if (hatchCandidateResult.matchingSpecies.length === 0) return '이 알에서 만날 수 있는 공룡이 아직 준비 중이에요.';
  if (hatchCandidateResult.candidates.length === 0) return '이 알에서 만날 수 있는 새 공룡을 모두 만났어요. 다른 알을 부화해보세요.';
  if (feedback) return feedback;

  if (progress >= 100) return '조금만 더 있으면 깨어날 것 같아요.';
  if (progress >= 70) return '안에서 작은 소리가 들리는 것 같아요!';
  if (progress >= 30) return '알이 따뜻해지고 있어요.';
  return '이 알은 아직 조용해요.';
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
