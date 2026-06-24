import { ChevronLeft, ChevronRight, Egg, PackageOpen, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getHatchItemConfig } from '../../config/itemConfig';
import { dinosaurSpecies } from '../../data/dinosaurSpecies';
import type { EggState, OwnedDinosaur, OwnedEgg } from '../../types/game';

type InventoryItemState = { itemId: string; quantity: number };

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
  const hasAvailableHatchSpecies = getAvailableHatchSpecies(ownedDinosaurs).length > 0;
  const canHatch = Boolean(activeEgg && clampProgress(activeEgg.hatchProgress) >= 100 && hasAvailableHatchSpecies && !hatchResult);

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
    <div className="relative grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
      <aside className="grid content-start gap-5">
        <EggInventoryPanel ownedEggs={ownedEggs} activeEgg={activeEgg} onSelectEgg={onSelectEgg} />
        <DeveloperHatcheryDebugPanel activeEggId={activeEggId} activeEgg={activeEgg} ownedEggs={ownedEggs} inventory={inventory} hatchResult={hatchResult} />
      </aside>

      <section className="game-panel overflow-hidden p-3 md:p-4">
        <EggMainCard
          activeEgg={activeEgg}
          eggCount={ownedEggs.length}
          canHatch={canHatch}
          hasAvailableHatchSpecies={hasAvailableHatchSpecies}
          feedback={feedback}
          onPreviousEgg={() => selectAdjacentEgg(-1)}
          onNextEgg={() => selectAdjacentEgg(1)}
          onHatchEgg={onHatchEgg}
        />
      </section>

      <aside className="grid content-start gap-5">
        <HatchItemPanel hatchItems={hatchItems} selectedHatchItemId={selectedHatchItemId} disabled={!activeEgg || Boolean(hatchResult)} onSelectHatchItem={setSelectedHatchItemId} onUseHatchItem={useSelectedHatchItem} />
        <HatchStatusPanel activeEgg={activeEgg} hasAvailableHatchSpecies={hasAvailableHatchSpecies} />
      </aside>

      {hatchResult && <HatchResultPanel result={hatchResult} onGoToDex={onGoToDex} onGoToDino={onGoToDino} onClose={onCloseHatchResult} />}
    </div>
  );
}

function EggInventoryPanel({ ownedEggs, activeEgg, onSelectEgg }: { ownedEggs: OwnedEgg[]; activeEgg: OwnedEgg | null; onSelectEgg: (eggId: string) => void }) {
  return (
    <section className="rounded-[30px] border-4 border-white bg-white/84 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-orange-700">보유 알</p>
          <h4 className="text-xl font-black text-emerald-950">{ownedEggs.length}개</h4>
        </div>
        <Egg className="h-7 w-7 text-orange-500" />
      </div>
      <div className="grid gap-2">
        {ownedEggs.length === 0 ? (
          <div className="rounded-[22px] bg-orange-50 px-4 py-4 text-sm font-black text-orange-800">
            <p>아직 보유한 알이 없어요.</p>
            <p className="mt-1 text-xs text-orange-700">상점에서 알을 데려올 수 있어요.</p>
          </div>
        ) : (
          ownedEggs.map((egg) => {
            const isActive = egg.id === activeEgg?.id;
            return (
              <button
                key={egg.id}
                onClick={() => onSelectEgg(egg.id)}
                className={`rounded-[20px] border-4 px-3 py-3 text-left shadow-sm transition active:translate-y-1 ${
                  isActive ? 'border-amber-300 bg-amber-100 text-amber-950 shadow-[0_5px_0_#fbbf24]' : 'border-white bg-white/90 text-slate-600 hover:bg-orange-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black">{egg.name}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black">{isActive ? '부화 중' : egg.rarity}</span>
                </div>
                <p className="mt-1 text-xs font-black opacity-75">부화 준비 {clampProgress(egg.hatchProgress)}%</p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function EggMainCard({
  activeEgg,
  eggCount,
  canHatch,
  hasAvailableHatchSpecies,
  feedback,
  onPreviousEgg,
  onNextEgg,
  onHatchEgg,
}: {
  activeEgg: OwnedEgg | null;
  eggCount: number;
  canHatch: boolean;
  hasAvailableHatchSpecies: boolean;
  feedback?: string;
  onPreviousEgg: () => void;
  onNextEgg: () => void;
  onHatchEgg: () => void;
}) {
  const progress = clampProgress(activeEgg?.hatchProgress ?? 0);
  const reaction = getEggReactionText(activeEgg, hasAvailableHatchSpecies, feedback);

  return (
    <section className="relative min-h-[660px] overflow-hidden rounded-[36px] border-4 border-white bg-gradient-to-b from-orange-100 via-amber-100 to-cyan-100 p-5 text-center shadow-inner md:p-6">
      <div className="absolute bottom-0 left-0 right-0 h-40 rounded-t-[50%] bg-amber-300/45" />
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
      <div className="relative z-10 flex min-h-[570px] flex-col items-center justify-center pt-10">
        {activeEgg ? (
          <>
            <p className="mb-3 rounded-full border-4 border-white bg-white/90 px-5 py-2 text-sm font-black text-orange-800 shadow-sm">{activeEgg.rarity} · {activeEgg.eggType}</p>
            <div className="relative mb-6">
              <div className="absolute inset-x-10 bottom-0 h-12 rounded-full bg-orange-900/10 blur-md" />
              <div className="relative flex h-80 w-60 items-center justify-center rounded-[50%] border-[14px] border-white bg-gradient-to-br from-amber-100 via-white to-orange-200 shadow-2xl">
                <Egg className="h-32 w-32 text-orange-400" />
              </div>
              {progress >= 100 && <div className="absolute -right-8 top-10 rounded-full border-4 border-white bg-lime-400 px-4 py-2 text-lg font-black text-lime-950 shadow-lg">준비 완료</div>}
            </div>
            <h3 className="text-4xl font-black text-emerald-950 md:text-5xl">{activeEgg.name}</h3>
            <p className="mt-3 max-w-md rounded-[24px] border-4 border-white bg-white/90 px-5 py-3 text-lg font-black leading-relaxed text-emerald-900 shadow-sm">{reaction}</p>
            <div className="mt-6 w-full max-w-xl rounded-[26px] border-4 border-white bg-white/82 p-4 shadow-sm">
              <div className="mb-2 flex justify-between text-sm font-black text-emerald-800">
                <span>{progress >= 100 ? '부화 준비 완료!' : '부화 준비'}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-7 overflow-hidden rounded-full bg-orange-100 shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-cyan-400" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button
              disabled={!canHatch}
              onClick={onHatchEgg}
              className={`mt-5 inline-flex min-h-16 items-center justify-center gap-2 rounded-[24px] border-4 border-white px-9 text-lg font-black text-white transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 ${
                canHatch ? 'bg-gradient-to-b from-orange-400 to-amber-500 shadow-[0_7px_0_#d97706]' : 'bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_7px_0_#94a3b8]'
              }`}
            >
              <Egg className="h-6 w-6" />
              부화하기
            </button>
          </>
        ) : (
          <div className="mx-auto grid max-w-md place-items-center rounded-[32px] border-4 border-white bg-white/86 px-6 py-10 shadow-lg">
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
    <section className="rounded-[30px] border-4 border-white bg-white/84 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-amber-700">부화 아이템</p>
          <h4 className="text-xl font-black text-emerald-950">아이템 사용</h4>
        </div>
        <Sparkles className="h-7 w-7 text-amber-500" />
      </div>
      <div className="mb-3 rounded-[20px] bg-amber-50 px-4 py-3">
        <p className="text-xs font-black text-amber-700">선택한 아이템</p>
        <p className="mt-1 text-base font-black text-amber-950">{selectedItem ? selectedItem.config.name : '아이템을 선택해주세요.'}</p>
      </div>
      <button disabled={disabled || !selectedItem} onClick={onUseHatchItem} className="mb-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[22px] border-4 border-white bg-gradient-to-b from-amber-300 to-orange-400 px-5 text-base font-black text-white shadow-orange transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-45">
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
                className={`min-h-20 rounded-[20px] border-4 px-3 py-2 text-left shadow-sm transition active:translate-y-1 ${
                  isSelected ? 'border-amber-400 bg-gradient-to-b from-yellow-200 to-orange-200 text-amber-950 shadow-[0_6px_0_#f59e0b]' : 'border-white bg-gradient-to-b from-amber-100 to-orange-100 text-amber-950 hover:brightness-105'
                } disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black">{config.name}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black">x{inventoryItem.quantity}</span>
                </div>
                <p className="mt-2 text-xs font-black text-amber-700">부화 +{config.effect.hatchProgress}%</p>
                {isSelected && <p className="mt-2 w-fit rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white">선택됨</p>}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function HatchStatusPanel({ activeEgg, hasAvailableHatchSpecies }: { activeEgg: OwnedEgg | null; hasAvailableHatchSpecies: boolean }) {
  const progress = clampProgress(activeEgg?.hatchProgress ?? 0);
  const value = !activeEgg ? '선택 필요' : !hasAvailableHatchSpecies ? '전체 발견' : progress >= 100 ? '준비 완료' : `${100 - progress}% 남음`;

  return (
    <section className="rounded-[26px] border-4 border-white bg-white/78 p-4 shadow-sm">
      <p className="text-xs font-black text-orange-700">부화 상태</p>
      <p className="mt-1 text-2xl font-black text-emerald-950">{value}</p>
    </section>
  );
}

function HatchResultPanel({ result, onGoToDex, onGoToDino, onClose }: { result: HatchResult; onGoToDex: () => void; onGoToDino: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <section className="w-full max-w-2xl rounded-[36px] border-4 border-white bg-gradient-to-b from-amber-100 via-white to-lime-100 p-5 text-center shadow-[0_24px_80px_rgba(15,23,42,0.28)] md:p-8">
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
          <button onClick={onGoToDex} className="rounded-full bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#0284c7] transition active:translate-y-1 active:shadow-none">
            도감으로 이동
          </button>
          <button onClick={onGoToDino} className="rounded-full bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#b45309] transition active:translate-y-1 active:shadow-none">
            우리 공룡으로 이동
          </button>
          <button onClick={onClose} className="rounded-full bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#047857] transition active:translate-y-1 active:shadow-none">
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

function getAvailableHatchSpecies(ownedDinosaurs: OwnedDinosaur[]) {
  const ownedSpeciesIds = new Set(ownedDinosaurs.map((dinosaur) => dinosaur.speciesId));
  return dinosaurSpecies.filter((species) => !ownedSpeciesIds.has(species.speciesId));
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getEggReactionText(activeEgg: OwnedEgg | null, hasAvailableHatchSpecies: boolean, feedback?: string) {
  if (!activeEgg) return '이 알은 아직 조용해요.';
  if (!hasAvailableHatchSpecies) return '모든 공룡을 발견했어요! 다음 업데이트를 기다려주세요.';
  if (feedback) return feedback;

  const progress = clampProgress(activeEgg.hatchProgress);
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
