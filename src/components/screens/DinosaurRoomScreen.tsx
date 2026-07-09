import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Lock, Sparkles, Utensils, Zap } from 'lucide-react';
import { getFoodItemConfig, getItemsByCategory, type FoodItemConfig } from '../../config/itemConfig';
import { dinosaurSpecies } from '../../data/dinosaurSpecies';
import type { DinosaurState, OwnedDinosaur } from '../../types/game';
import petHomeBackground from '../../assets/pet/backgrounds/bg_pet_home_forest.png';
import petGreenMain from '../../assets/pet/backgrounds/pet_green_main-removebg-preview.png';
import petNameplatePanel from '../../assets/pet/panels/panel_pet_nameplate-removebg-preview.png';
import petStatusPanel from '../../assets/pet/panels/panel_pet_status-removebg-preview.png';

type DinoView = 'care' | 'playground';
type DinosaurInteractionChange = Partial<Pick<DinosaurState, 'exp' | 'mood' | 'stamina'>>;
type InventoryItemState = { itemId: string; quantity: number };
const showDeveloperPanels = false;

export interface DinosaurRoomScreenProps {
  view: DinoView;
  dinosaur: DinosaurState;
  activeOwnedDinosaur: OwnedDinosaur;
  ownedDinosaurs: OwnedDinosaur[];
  ownedCostumeIds: string[];
  feedback: string;
  inventory: InventoryItemState[];
  selectedFoodItemId: string | null;
  onView: (view: DinoView) => void;
  onSelectFood: (itemId: string) => void;
  onSelectAdjacentDinosaur: (direction: -1 | 1) => void;
  onEquipCostume: (itemId: string) => void;
  onDinosaurInteraction: (changes: DinosaurInteractionChange, message: string) => void;
  onFeed?: () => void;
  onGoToHatchery?: () => void;
}

export function DinosaurRoomScreen({
  dinosaur,
  activeOwnedDinosaur,
  ownedDinosaurs,
  inventory,
  selectedFoodItemId,
  onSelectFood,
  onSelectAdjacentDinosaur,
  onFeed,
  onGoToHatchery,
}: DinosaurRoomScreenProps) {
  const activeSpecies = dinosaurSpecies.find((species) => species.speciesId === activeOwnedDinosaur.speciesId);
  const uniqueOwnedDinosaurs = getUniqueOwnedDinosaurs(ownedDinosaurs);
  const activeSpeciesName = activeSpecies?.displayName ?? activeSpecies?.name ?? '공룡 친구';

  return (
    <div className="pet-screen pet-bg relative grid h-full min-h-0 grid-rows-[8%_52%_18%_22%] gap-2 overflow-hidden rounded-[30px] border-4 border-white bg-emerald-100 p-2">
      <img src={petHomeBackground} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-lime-100/5 to-emerald-950/10" />

      <header className="pet-header relative z-10 flex min-h-0 items-center justify-center">
        <div className="rounded-[18px] border-4 border-white bg-white/72 px-5 py-2 text-lg font-black text-emerald-950 shadow-sm">우리 공룡</div>
      </header>

      <section className="pet-main-zone relative z-10 grid min-h-0 grid-cols-[0.16fr_0.54fr_0.30fr] gap-2">
        <aside className="pet-side-menu grid min-h-0 content-start gap-2 pt-1">
          <button className="pet-side-menu-button pet-side-menu-button--active min-h-14 rounded-[17px] border-[3px] border-white bg-gradient-to-b from-lime-300 to-emerald-500 px-1.5 text-[12px] font-black leading-tight text-emerald-950 shadow-[0_5px_0_#059669]">
            공룡<br />보기
          </button>
          {onGoToHatchery && (
            <button
              onClick={onGoToHatchery}
              className="pet-side-menu-button pet-hatchery-button min-h-14 rounded-[17px] border-[3px] border-white bg-gradient-to-b from-orange-200 to-amber-400 px-1.5 text-[12px] font-black leading-tight text-amber-950 shadow-[0_5px_0_#d97706] transition active:translate-y-1 active:shadow-none"
            >
              알<br />부화장
            </button>
          )}
        </aside>

        <section className="pet-main-stage min-h-0 overflow-hidden">
          <DinosaurStage dinosaur={dinosaur} ownedCount={uniqueOwnedDinosaurs.length} onSelectAdjacentDinosaur={onSelectAdjacentDinosaur} />
        </section>

        <aside className="pet-status-zone min-h-0">
          <DinosaurStatusPanel dinosaur={dinosaur} />
        </aside>
      </section>

      <section className="pet-info-zone relative z-10 flex min-h-0 items-center justify-center">
        <div className="pet-info-action-group flex w-max max-w-full items-stretch justify-center gap-3">
          <DinosaurNamePanel dinosaur={dinosaur} activeSpeciesName={activeSpeciesName} />
          <FeedPanel inventory={inventory} selectedFoodItemId={selectedFoodItemId} onFeed={onFeed} />
        </div>
      </section>

      <section className="pet-food-bag-zone relative z-10 min-h-0">
        <FoodBagPanel inventory={inventory} selectedFoodItemId={selectedFoodItemId} onSelectFood={onSelectFood} onFeed={onFeed} />
        {showDeveloperPanels && <DeveloperDinosaurDebugPanel dinosaur={dinosaur} activeOwnedDinosaur={activeOwnedDinosaur} inventory={inventory} />}
      </section>
    </div>
  );
}

function DinosaurStage({
  dinosaur,
  ownedCount,
  onSelectAdjacentDinosaur,
}: {
  dinosaur: DinosaurState;
  ownedCount: number;
  onSelectAdjacentDinosaur: (direction: -1 | 1) => void;
}) {
  const canSwitchDinosaur = ownedCount > 1;

  return (
    <section className="pet-dino-carousel pet-stage-background relative h-full min-h-0 overflow-hidden rounded-[28px] bg-transparent">
      {canSwitchDinosaur && (
        <>
          <button
            aria-label="이전 공룡"
            onClick={() => onSelectAdjacentDinosaur(-1)}
            className="pet-dino-arrow pet-dino-arrow--prev absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[17px] border-4 border-white bg-white/88 text-emerald-800 shadow-[0_5px_0_#86efac] transition active:translate-y-[calc(-50%+4px)] active:shadow-none"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            aria-label="다음 공룡"
            onClick={() => onSelectAdjacentDinosaur(1)}
            className="pet-dino-arrow pet-dino-arrow--next absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[17px] border-4 border-white bg-white/88 text-emerald-800 shadow-[0_5px_0_#86efac] transition active:translate-y-[calc(-50%+4px)] active:shadow-none"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}
      <div className="pet-dino-layer relative z-10 flex h-full min-h-0 items-end justify-center pb-1">
        <div className="absolute bottom-4 h-8 w-[62%] rounded-[50%] bg-emerald-900/12 blur-sm" />
        <img
          src={petGreenMain}
          alt={dinosaur.name}
          className="pet-dino-image relative z-10 max-h-[82%] max-w-[95%] object-contain drop-shadow-[0_18px_20px_rgba(20,83,45,.24)]"
        />
      </div>
    </section>
  );
}

function DinosaurNamePanel({ dinosaur, activeSpeciesName }: { dinosaur: DinosaurState; activeSpeciesName: string }) {
  const expPercent = getExpProgressPercent(dinosaur.exp, dinosaur.expToNextLevel);

  return (
    <section className="pet-name-panel relative h-[86px] w-[300px] overflow-hidden rounded-[18px] border-[3px] border-white bg-white/86 px-3 py-2 shadow-sm">
      <img src={petNameplatePanel} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
      <div className="relative z-10 flex h-full min-h-0 flex-col justify-center">
        <p className="truncate text-[11px] font-black text-amber-700">{activeSpeciesName}</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <h3 className="truncate text-[clamp(1rem,2vw,1.25rem)] font-black leading-none text-emerald-950">{dinosaur.name}</h3>
          <span className="shrink-0 rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-black text-emerald-800">Lv. {dinosaur.level}</span>
        </div>
        <div className="pet-exp-bar mt-1.5">
          <div className="mb-0.5 flex justify-between text-[10px] font-black text-emerald-800">
            <span>EXP</span>
            <span>{dinosaur.exp} / {dinosaur.expToNextLevel}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-emerald-100 shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: `${expPercent}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeedPanel({
  inventory,
  selectedFoodItemId,
  onFeed,
}: {
  inventory: InventoryItemState[];
  selectedFoodItemId: string | null;
  onFeed?: () => void;
}) {
  const selectedFood = selectedFoodItemId ? getFoodItemConfig(selectedFoodItemId) : null;
  const selectedInventoryItem = selectedFoodItemId ? inventory.find((item) => item.itemId === selectedFoodItemId) : null;
  const quantity = selectedInventoryItem?.quantity ?? 0;
  const canFeed = Boolean(selectedFood && quantity > 0 && onFeed);

  return (
    <section className="pet-feed-panel grid h-[86px] w-[133px] content-center gap-1 rounded-[18px] border-[3px] border-white bg-amber-50/92 px-2 py-2 shadow-sm">
      <div className="min-w-0 text-center">
        <p className="text-[10px] font-black text-amber-700">보유 사료</p>
        <p className="truncate text-sm font-black text-amber-950">{selectedFood ? `${selectedFood.name} x${quantity}` : '사료 선택'}</p>
      </div>
      <button
        onClick={onFeed}
        disabled={!canFeed}
        className="pet-feed-button inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-[14px] border-[3px] border-white bg-gradient-to-b from-amber-300 to-orange-400 px-2 text-xs font-black text-white shadow-orange transition active:translate-y-1 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none"
      >
        <Utensils className="h-5 w-5" />
        먹이주기
      </button>
    </section>
  );
}

function DinosaurStatusPanel({ dinosaur }: { dinosaur: DinosaurState }) {
  const staminaPercent = getPercentValue(dinosaur.stamina, dinosaur.maxStamina);
  const growthPercent = getGrowthPercent(dinosaur.level);
  const statusMessage = getGrowthStatusMessage(dinosaur.level, staminaPercent);

  return (
    <section className="pet-status-panel relative h-full min-h-0 overflow-hidden rounded-[24px] p-3 shadow-sm">
      <img src={petStatusPanel} alt="" className="absolute inset-0 h-full w-full object-fill opacity-95" />
      <div className="absolute inset-1 rounded-[22px] bg-white/28" />
      <div className="relative z-10 flex h-full min-h-0 flex-col justify-start pt-1">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <h4 className="text-base font-black text-emerald-950">성장 상태</h4>
        </div>
        <div className="grid gap-2">
          <MiniMeter icon={Heart} label="행복" value={dinosaur.happiness} tone="from-pink-400 to-rose-500" />
          <MiniMeter icon={Zap} label="체력" value={staminaPercent} tone="from-emerald-400 to-lime-500" />
          <MiniMeter icon={Sparkles} label="성장" value={growthPercent} tone="from-cyan-400 to-sky-500" />
          <div className="rounded-[14px] bg-white/78 px-2.5 py-2 shadow-sm">
            <p className="text-[11px] font-black text-emerald-700">상태메시지</p>
            <p className="mt-1 text-xs font-black leading-snug text-emerald-950">{statusMessage}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FoodBagPanel({
  inventory,
  selectedFoodItemId,
  onSelectFood,
}: {
  inventory: InventoryItemState[];
  selectedFoodItemId: string | null;
  onSelectFood: (itemId: string) => void;
  onFeed?: () => void;
}) {
  const visibleSlotCount = 5;
  const targetSlotCount = 10;
  const [firstVisibleSlotIndex, setFirstVisibleSlotIndex] = useState(0);
  const foodItems = getItemsByCategory('food') as FoodItemConfig[];
  const foodSlots: Array<{ id: string; food: FoodItemConfig | null; quantity: number; lockedLabel?: string }> = [
    ...foodItems.map((food) => ({
      id: food.id,
      food,
      quantity: inventory.find((item) => item.itemId === food.id)?.quantity ?? 0,
    })),
    ...Array.from({ length: Math.max(0, targetSlotCount - foodItems.length) }, (_, index) => ({
      id: `locked-food-slot-${index + 1}`,
      food: null,
      quantity: 0,
      lockedLabel: '잠금',
    })),
  ];
  const maxFirstVisibleSlotIndex = Math.max(0, foodSlots.length - visibleSlotCount);
  const safeFirstVisibleSlotIndex = Math.min(firstVisibleSlotIndex, maxFirstVisibleSlotIndex);
  const visibleSlots = foodSlots.slice(safeFirstVisibleSlotIndex, safeFirstVisibleSlotIndex + visibleSlotCount);
  const canSlidePrev = safeFirstVisibleSlotIndex > 0;
  const canSlideNext = safeFirstVisibleSlotIndex < maxFirstVisibleSlotIndex;

  return (
    <section className="pet-food-bag mx-auto grid h-full min-h-0 w-full max-w-[740px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[22px] border-4 border-white bg-white/84 px-3 py-2 shadow-lg">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h4 className="text-base font-black text-emerald-950">사료가방</h4>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">
            {safeFirstVisibleSlotIndex + 1}-{safeFirstVisibleSlotIndex + visibleSlots.length} / {foodSlots.length}
          </span>
          <Utensils className="h-5 w-5 text-orange-500" />
        </div>
      </div>
      <div className="grid min-h-0 grid-cols-[42px_minmax(0,1fr)_42px] items-stretch gap-2">
        <button
          aria-label="이전 사료"
          disabled={!canSlidePrev}
          onClick={() => setFirstVisibleSlotIndex((current) => Math.max(0, current - visibleSlotCount))}
          className="pet-food-arrow pet-food-arrow--prev flex min-h-0 items-center justify-center rounded-[16px] border-4 border-white bg-white/86 text-amber-800 shadow-sm transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="grid min-h-0 grid-cols-5 gap-2 overflow-hidden">
        {visibleSlots.map(({ id, food, quantity, lockedLabel }) => {
          if (!food) {
            return (
              <div key={id} className="pet-food-slot grid min-h-0 place-items-center rounded-[16px] border-4 border-dashed border-slate-200 bg-slate-50/80 px-2 text-center text-xs font-black text-slate-400">
                <Lock className="h-5 w-5" />
                {lockedLabel}
              </div>
            );
          }

          const isSelected = selectedFoodItemId === food.id;
          const isDisabled = quantity <= 0;

          return (
            <button
              key={food.id}
              disabled={isDisabled}
              onClick={() => onSelectFood(food.id)}
              className={`pet-food-slot ${isSelected ? 'pet-food-slot--selected' : ''} min-h-0 rounded-[16px] border-4 px-2 py-1.5 text-center shadow-sm transition active:translate-y-1 ${
                isSelected ? 'border-amber-400 bg-gradient-to-b from-yellow-200 to-orange-200 text-amber-950 shadow-[0_5px_0_#f59e0b]' : 'border-white bg-gradient-to-b from-amber-100 to-orange-100 text-amber-950'
              } ${isDisabled ? 'cursor-not-allowed opacity-45 shadow-none' : 'hover:brightness-105'}`}
            >
              <p className="truncate text-sm font-black">{food.name}</p>
              <p className="mt-1 rounded-full bg-white px-2 py-0.5 text-xs font-black text-orange-700">x{quantity}</p>
              {isSelected && <p className="mx-auto mt-1 w-fit rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">선택</p>}
            </button>
          );
        })}
        </div>
        <button
          aria-label="다음 사료"
          disabled={!canSlideNext}
          onClick={() => setFirstVisibleSlotIndex((current) => Math.min(maxFirstVisibleSlotIndex, current + visibleSlotCount))}
          className="pet-food-arrow pet-food-arrow--next flex min-h-0 items-center justify-center rounded-[16px] border-4 border-white bg-white/86 text-amber-800 shadow-sm transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
}

function DeveloperDinosaurDebugPanel({
  dinosaur,
  activeOwnedDinosaur,
  inventory,
}: {
  dinosaur: DinosaurState;
  activeOwnedDinosaur: OwnedDinosaur;
  inventory: InventoryItemState[];
}) {
  return (
    <details className="rounded-[26px] border-4 border-dashed border-slate-200 bg-white/62 px-4 py-3">
      <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용: 공룡 상태 데이터</summary>
      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500">
        <p className="break-all rounded-[18px] bg-white/80 px-3 py-2 font-mono">dinosaur id: {activeOwnedDinosaur.id}</p>
        <p className="break-all rounded-[18px] bg-white/80 px-3 py-2 font-mono">species id: {activeOwnedDinosaur.speciesId}</p>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(inventory, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(dinosaur, null, 2)}</pre>
      </div>
    </details>
  );
}

function MiniMeter({ icon: Icon, label, value, tone }: { icon: typeof Heart; label: string; value: number; tone: string }) {
  const percent = clampUiPercent(value);

  return (
    <div className="rounded-[14px] bg-white/78 px-2.5 py-1.5 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-black text-emerald-900">
        <span className="inline-flex min-w-0 items-center gap-1">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}

function clampUiPercent(value: number) {
  return Math.max(0, Math.min(100, Math.floor(Number.isFinite(value) ? value : 0)));
}

function getPercentValue(value: number, max = 100) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return clampUiPercent((value / max) * 100);
}

function getExpProgressPercent(rawExp: number, expToNextLevel?: number) {
  return getPercentValue(rawExp, expToNextLevel ?? 0);
}

function getGrowthPercent(level: number) {
  return clampUiPercent((Math.max(0, level) / 20) * 100);
}

function getGrowthStatusMessage(level: number, staminaPercent: number) {
  if (level >= 20) return '성장 완료!';
  if (staminaPercent < 35) return '먹이를 주면 더 힘이 나요!';
  return '레벨 20이 되면 성장 완료!';
}

function getUniqueOwnedDinosaurs(ownedDinosaurs: OwnedDinosaur[]) {
  const seenSpeciesIds = new Set<string>();

  return ownedDinosaurs.filter((dinosaur) => {
    if (seenSpeciesIds.has(dinosaur.speciesId)) return false;
    seenSpeciesIds.add(dinosaur.speciesId);
    return true;
  });
}
