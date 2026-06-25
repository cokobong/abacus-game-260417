import { ChevronLeft, ChevronRight, Heart, Shirt, Sparkles, Utensils, Zap } from 'lucide-react';
import { getFoodItemConfig, getItemConfig, type DinosaurStatEffect } from '../../config/itemConfig';
import { dinosaurSpecies } from '../../data/dinosaurSpecies';
import type { CostumeSlot, DinosaurState, EquippedCostumes, OwnedDinosaur } from '../../types/game';
import { getGrowthStageLabel } from '../../utils/dinosaurGrowth';

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
  onFeed: () => void;
}

export function DinosaurRoomScreen({
  view,
  dinosaur,
  activeOwnedDinosaur,
  ownedDinosaurs,
  ownedCostumeIds,
  feedback,
  inventory,
  selectedFoodItemId,
  onView,
  onSelectFood,
  onSelectAdjacentDinosaur,
  onEquipCostume,
  onDinosaurInteraction,
  onFeed,
}: DinosaurRoomScreenProps) {
  const activeSpecies = dinosaurSpecies.find((species) => species.speciesId === activeOwnedDinosaur.speciesId);
  const uniqueOwnedDinosaurs = getUniqueOwnedDinosaurs(ownedDinosaurs);
  const ownedCostumes = ownedCostumeIds
    .map((itemId) => getItemConfig(itemId))
    .filter((item): item is NonNullable<ReturnType<typeof getItemConfig>> & { category: 'costume' } => item?.category === 'costume');

  if (view === 'playground') {
    return (
      <section className="game-panel h-full min-h-0 p-3">
        <button onClick={() => onView('care')} className="mb-2 min-h-12 rounded-full border-4 border-white bg-white/90 px-5 text-sm font-black text-emerald-800 shadow-sm transition active:translate-y-1">
          우리 공룡으로 돌아가기
        </button>
        <div className="grid min-h-0 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="relative flex min-h-[clamp(380px,calc(100vh-15rem),560px)] flex-col items-center justify-end overflow-hidden rounded-[32px] border-4 border-white bg-gradient-to-b from-sky-100 via-emerald-100 to-lime-300 p-5 text-center shadow-inner">
            <div className="absolute bottom-0 left-0 right-0 h-32 rounded-t-[50%] bg-lime-400/70" />
            <DinoAvatar size="hero" />
            <h3 className="relative z-10 text-3xl font-black text-emerald-950">작은 놀이터</h3>
            <p className="relative z-10 mt-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-black text-emerald-700 shadow-sm">{feedback}</p>
          </div>
          <div className="grid content-start gap-3">
            <DinosaurStateMiniPanel dinosaur={dinosaur} />
            <div className="rounded-[22px] border-4 border-white bg-lime-100 px-4 py-3 shadow-sm">
              <p className="text-sm font-black text-emerald-700">최근 변화</p>
              <p className="mt-1 text-lg font-black text-emerald-950">{feedback}</p>
            </div>
            <PlayButton label="쓰다듬기" onClick={() => onDinosaurInteraction({ mood: 5 }, '행복 +5')} />
            <PlayButton label="공 던지기" onClick={() => onDinosaurInteraction({ mood: 10, stamina: -5 }, '행복 +10, 체력 -5')} />
            <PlayButton label="쉬게 하기" onClick={() => onDinosaurInteraction({ stamina: 10, mood: 3 }, '체력 +10, 행복 +3')} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[220px_minmax(0,1fr)_230px]">
      <aside className="grid min-h-0 content-start gap-3 xl:order-1">
        <FoodInventoryPanel inventory={inventory} selectedFoodItemId={selectedFoodItemId} onSelectFood={onSelectFood} onFeed={onFeed} />
      </aside>

      <section className="game-panel min-h-0 overflow-hidden p-3 xl:order-2">
        <DinosaurMainCard
          dinosaur={dinosaur}
          activeOwnedDinosaur={activeOwnedDinosaur}
          activeSpeciesName={activeSpecies?.displayName ?? activeSpecies?.name ?? '공룡 친구'}
          activeSpeciesDescription={activeSpecies?.description ?? '보유한 공룡을 돌볼 수 있어요.'}
          ownedCount={uniqueOwnedDinosaurs.length}
          feedback={feedback}
          onSelectAdjacentDinosaur={onSelectAdjacentDinosaur}
        />
      </section>

      <aside className="grid min-h-0 content-start gap-3 xl:order-3">
        <section className="rounded-[22px] border-4 border-white bg-white/84 p-3 shadow-sm">
          <p className="text-xs font-black text-emerald-700">오늘의 반응</p>
          <p className="mt-1 text-base font-black leading-relaxed text-emerald-950">{getDinosaurMoodText(dinosaur, feedback)}</p>
          <button onClick={() => onView('playground')} className="mt-2 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[16px] border-4 border-white bg-gradient-to-b from-emerald-300 to-emerald-500 px-4 text-sm font-black text-white shadow-green transition active:translate-y-1">
            <Heart className="h-4 w-4" />
            놀이터로 이동
          </button>
        </section>
        <DinosaurStateMiniPanel dinosaur={dinosaur} />
        <CostumeEquipPanel activeOwnedDinosaur={activeOwnedDinosaur} ownedCostumes={ownedCostumes} onEquipCostume={onEquipCostume} />
        {showDeveloperPanels && <DeveloperDinosaurDebugPanel dinosaur={dinosaur} activeOwnedDinosaur={activeOwnedDinosaur} inventory={inventory} />}
      </aside>
    </div>
  );
}

function DinosaurMainCard({
  dinosaur,
  activeOwnedDinosaur,
  activeSpeciesName,
  activeSpeciesDescription,
  ownedCount,
  feedback,
  onSelectAdjacentDinosaur,
}: {
  dinosaur: DinosaurState;
  activeOwnedDinosaur: OwnedDinosaur;
  activeSpeciesName: string;
  activeSpeciesDescription: string;
  ownedCount: number;
  feedback: string;
  onSelectAdjacentDinosaur: (direction: -1 | 1) => void;
}) {
  return (
    <section className="relative min-h-[clamp(460px,calc(100vh-14.5rem),610px)] overflow-hidden rounded-[34px] border-4 border-white bg-gradient-to-b from-sky-100 via-emerald-100 to-lime-300 p-5 shadow-inner">
      <div className="absolute bottom-0 left-0 right-0 h-32 rounded-t-[50%] bg-lime-400/70" />
      <div className="absolute left-4 top-4 z-20 rounded-[18px] border-4 border-white bg-white/90 px-3 py-2 shadow-lg">
        <p className="text-xs font-black text-amber-700">대표 공룡</p>
        <h3 className="text-2xl font-black text-emerald-950 md:text-4xl">{dinosaur.name}</h3>
      </div>
      <div className="absolute right-4 top-4 z-20 rounded-[18px] border-4 border-white bg-amber-100 px-3 py-2 text-xs font-black text-amber-900 shadow-lg">
        {activeSpeciesName} · {getGrowthStageLabel(dinosaur.growthStage)} · Lv. {dinosaur.level}
      </div>
      {ownedCount > 1 && (
        <>
          <button
            aria-label="이전 공룡"
            onClick={() => onSelectAdjacentDinosaur(-1)}
            className="absolute left-5 top-1/2 z-20 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-[24px] border-4 border-white bg-white/92 text-emerald-800 shadow-[0_6px_0_#86efac] transition active:translate-y-[calc(-50%+4px)] active:shadow-none"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button
            aria-label="다음 공룡"
            onClick={() => onSelectAdjacentDinosaur(1)}
            className="absolute right-5 top-1/2 z-20 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-[24px] border-4 border-white bg-white/92 text-emerald-800 shadow-[0_6px_0_#86efac] transition active:translate-y-[calc(-50%+4px)] active:shadow-none"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </>
      )}
      <div className="relative z-10 flex min-h-[clamp(390px,calc(100vh-18rem),520px)] items-end justify-center pb-16 pt-24">
        <DinoAvatar size="hero" />
      </div>
      <div className="absolute inset-x-4 bottom-4 z-20 rounded-[22px] border-4 border-white bg-white/92 px-4 py-3 text-center shadow-lg">
        <p className="text-lg font-black text-emerald-950">{feedback || `${dinosaur.name}가 기다리고 있어요!`}</p>
        <p className="mt-1 text-sm font-black leading-relaxed text-emerald-700/75">{activeSpeciesDescription}</p>
        <p className="mt-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-black text-violet-800">착용: {formatEquippedCostumes(activeOwnedDinosaur.equippedCostumes)}</p>
      </div>
    </section>
  );
}

function DinosaurStateMiniPanel({ dinosaur }: { dinosaur: DinosaurState }) {
  return (
    <section className="rounded-[24px] border-4 border-white bg-white/78 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-600" />
        <h4 className="text-base font-black text-emerald-950">상태</h4>
      </div>
      <div className="grid gap-1.5">
        <MiniMeter icon={Zap} label="경험치" value={getExpPercent(dinosaur.exp, dinosaur.expToNextLevel)} tone="from-cyan-400 to-sky-500" />
        <MiniMeter icon={Sparkles} label="체력" value={getPercentValue(dinosaur.stamina, dinosaur.maxStamina)} tone="from-emerald-400 to-lime-500" />
        <MiniMeter icon={Heart} label="행복" value={dinosaur.happiness} tone="from-pink-400 to-rose-500" />
      </div>
    </section>
  );
}

function FoodInventoryPanel({
  inventory,
  selectedFoodItemId,
  onSelectFood,
  onFeed,
}: {
  inventory: InventoryItemState[];
  selectedFoodItemId: string | null;
  onSelectFood: (itemId: string) => void;
  onFeed: () => void;
}) {
  const foodItems = inventory
    .map((inventoryItem) => ({ inventoryItem, food: getFoodItemConfig(inventoryItem.itemId) }))
    .filter((entry): entry is { inventoryItem: InventoryItemState; food: NonNullable<ReturnType<typeof getFoodItemConfig>> } => Boolean(entry.food));
  const selectedFood = selectedFoodItemId ? getFoodItemConfig(selectedFoodItemId) : null;

  return (
    <section className="rounded-[24px] border-4 border-white bg-white/84 p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-amber-700">먹이 가방</p>
          <h4 className="text-xl font-black text-emerald-950">먹이 적용</h4>
        </div>
        <Utensils className="h-7 w-7 text-orange-500" />
      </div>
      <div className="mb-2 rounded-[18px] bg-amber-50 px-3 py-2">
        <p className="text-xs font-black text-amber-700">선택한 먹이</p>
        <p className="mt-1 text-base font-black text-amber-950">{selectedFood ? selectedFood.name : '먹이를 선택해주세요.'}</p>
        <p className="mt-1 text-xs font-black text-amber-700">행복할수록 체력이 더 잘 회복돼요.</p>
      </div>
      <button onClick={onFeed} className="mb-2 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] border-4 border-white bg-gradient-to-b from-amber-300 to-orange-400 px-5 text-base font-black text-white shadow-orange transition active:translate-y-1">
        <Utensils className="h-5 w-5" />
        먹이 주기
      </button>
      <div className="grid gap-2">
        {foodItems.map(({ inventoryItem, food }) => {
          const isSelected = selectedFoodItemId === inventoryItem.itemId;
          const isDisabled = inventoryItem.quantity <= 0;

          return (
            <button
              key={inventoryItem.itemId}
              disabled={isDisabled}
              onClick={() => onSelectFood(inventoryItem.itemId)}
              className={`min-h-16 rounded-[18px] border-4 px-3 py-2 text-left shadow-sm transition active:translate-y-1 ${
                isSelected ? 'border-amber-400 bg-gradient-to-b from-yellow-200 to-orange-200 text-amber-950 shadow-[0_6px_0_#f59e0b]' : 'border-white bg-gradient-to-b from-amber-100 to-orange-100'
              } ${isDisabled ? 'cursor-not-allowed opacity-45 shadow-none' : 'hover:brightness-105'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-amber-950">{food.name}</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-700">x{inventoryItem.quantity}</span>
              </div>
              <p className="mt-1 text-xs font-black text-amber-700">{formatDinosaurStatChanges(food.effect)}</p>
              {isSelected && <p className="mt-1 w-fit rounded-full bg-amber-500 px-3 py-0.5 text-xs font-black text-white">선택됨</p>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CostumeEquipPanel({
  activeOwnedDinosaur,
  ownedCostumes,
  onEquipCostume,
}: {
  activeOwnedDinosaur: OwnedDinosaur;
  ownedCostumes: Array<NonNullable<ReturnType<typeof getItemConfig>> & { category: 'costume' }>;
  onEquipCostume: (itemId: string) => void;
}) {
  return (
    <section className="rounded-[24px] border-4 border-white bg-white/84 p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-violet-700">코스튬 옷장</p>
          <h4 className="text-xl font-black text-emerald-950">코스튬 적용</h4>
        </div>
        <Shirt className="h-7 w-7 text-violet-500" />
      </div>
      <div className="mb-2 grid gap-1 rounded-[18px] bg-violet-50 px-3 py-2 text-xs font-black text-violet-800">
        <p className="text-violet-900">착용 중</p>
        {costumeSlots.map((slot) => (
          <div key={slot} className="flex items-center justify-between gap-3">
            <span>{getCostumeSlotLabel(slot)}</span>
            <span className="text-right text-violet-950">{getEquippedCostumeName(activeOwnedDinosaur.equippedCostumes?.[slot]) ?? '착용 없음'}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        {ownedCostumes.length === 0 ? (
          <p className="rounded-[20px] bg-slate-100 px-4 py-3 text-sm font-black text-slate-500">상점에서 코스튬을 구매하면 여기에 표시돼요.</p>
        ) : (
          ownedCostumes.map((costume) => {
            const isEquipped = activeOwnedDinosaur.equippedCostumes?.[costume.slot] === costume.id;
            return (
              <button
                key={costume.id}
                onClick={() => onEquipCostume(costume.id)}
                className={`rounded-[20px] border-4 px-3 py-2 text-left shadow-sm transition active:translate-y-1 ${
                  isEquipped ? 'border-violet-300 bg-violet-100 text-violet-950' : 'border-white bg-white/90 text-slate-700 hover:bg-violet-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black">{costume.name}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${isEquipped ? 'bg-violet-500 text-white' : 'bg-white text-violet-800'}`}>{isEquipped ? '착용 중' : getCostumeSlotLabel(costume.slot)}</span>
                </div>
                <p className="mt-1 text-xs font-black text-slate-500">{isEquipped ? '클릭하면 벗기기' : '착용하기'}</p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

const costumeSlots: CostumeSlot[] = ['head', 'neck', 'body', 'accessory'];

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
        <pre className="overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(activeOwnedDinosaur.equippedCostumes ?? {}, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(inventory, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(dinosaur, null, 2)}</pre>
      </div>
    </details>
  );
}

function MiniMeter({ icon: Icon, label, value, tone }: { icon: typeof Heart; label: string; value: number; tone: string }) {
  const percent = clampUiPercent(value);

  return (
    <div className="rounded-[18px] bg-white/78 px-3 py-2 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-black text-emerald-900">
        <span className="inline-flex items-center gap-1">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100 shadow-inner">
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

function getExpPercent(exp: number, expToNextLevel?: number) {
  return getPercentValue(exp, expToNextLevel ?? 0);
}

function DinoAvatar({ size }: { size: 'small' | 'large' | 'hero' }) {
  const shellSize = size === 'hero' ? 'h-[340px] w-[340px]' : size === 'large' ? 'h-60 w-60' : 'h-24 w-24';
  const bodySize = size === 'hero' ? 'h-48 w-52' : size === 'large' ? 'h-32 w-36' : 'h-14 w-[4.5rem]';
  const headSize = size === 'hero' ? 'h-32 w-36' : size === 'large' ? 'h-[5.5rem] w-[6.5rem]' : 'h-11 w-[3.25rem]';
  const eyeSize = size === 'hero' ? 'h-4 w-4' : size === 'large' ? 'h-3 w-3' : 'h-1.5 w-1.5';

  return (
    <div className={`relative z-10 ${shellSize} max-h-full max-w-full drop-shadow-2xl`} aria-label="선택한 공룡">
      <div className={`absolute bottom-[13%] left-1/2 ${bodySize} -translate-x-1/2 rounded-[45%] border-4 border-emerald-200 bg-emerald-400`} />
      <div className={`absolute left-1/2 top-[12%] ${headSize} -translate-x-1/2 rounded-[45%] border-4 border-emerald-200 bg-emerald-300`} />
      <div className="absolute left-[38%] top-[27%] h-[12%] w-[12%] rounded-full bg-white">
        <div className={`absolute left-1/2 top-1/2 ${eyeSize} -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800`} />
      </div>
      <div className="absolute right-[38%] top-[27%] h-[12%] w-[12%] rounded-full bg-white">
        <div className={`absolute left-1/2 top-1/2 ${eyeSize} -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800`} />
      </div>
      <div className="absolute left-1/2 top-[43%] h-[4%] w-[18%] -translate-x-1/2 rounded-full bg-emerald-700/35" />
      <div className="absolute bottom-[30%] left-[17%] h-[16%] w-[12%] rotate-[-20deg] rounded-full bg-emerald-300" />
      <div className="absolute bottom-[30%] right-[17%] h-[16%] w-[12%] rotate-[20deg] rounded-full bg-emerald-300" />
      <div className="absolute bottom-[4%] left-[34%] h-[18%] w-[13%] rounded-full bg-emerald-500" />
      <div className="absolute bottom-[4%] right-[34%] h-[18%] w-[13%] rounded-full bg-emerald-500" />
      <div className="absolute right-[5%] top-[52%] h-[18%] w-[30%] rotate-[28deg] rounded-full bg-emerald-300" />
      <div className="absolute left-1/2 top-[8%] h-[8%] w-[8%] -translate-x-1/2 rounded-full bg-amber-200" />
      <div className="absolute left-[42%] top-[7%] h-[6%] w-[6%] rounded-full bg-amber-200" />
      <div className="absolute right-[42%] top-[7%] h-[6%] w-[6%] rounded-full bg-amber-200" />
    </div>
  );
}

function PlayButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="game-button min-h-16 bg-gradient-to-b from-emerald-300 to-emerald-500 shadow-green">
      {label}
    </button>
  );
}

function getUniqueOwnedDinosaurs(ownedDinosaurs: OwnedDinosaur[]) {
  const seenSpeciesIds = new Set<string>();

  return ownedDinosaurs.filter((dinosaur) => {
    if (seenSpeciesIds.has(dinosaur.speciesId)) return false;
    seenSpeciesIds.add(dinosaur.speciesId);
    return true;
  });
}

function getDinosaurMoodText(dinosaur: DinosaurState, fallback: string) {
  if (fallback) return fallback;
  if (dinosaur.mood >= 70) return `${dinosaur.name}가 기분 좋아 보여요.`;
  if (dinosaur.stamina < 30) return `${dinosaur.name}가 조금 쉬고 싶어해요.`;
  if (dinosaur.mood < 40) return `${dinosaur.name}가 조금 심심해요. 놀이터에서 같이 놀아주세요.`;
  return `${dinosaur.name}가 기다리고 있어요!`;
}

function formatEquippedCostumes(equippedCostumes?: EquippedCostumes) {
  const names = Object.values(equippedCostumes ?? {})
    .map((itemId) => getCostumeName(itemId))
    .filter(Boolean);

  return names.length > 0 ? names.join(', ') : '착용 없음';
}

function getCostumeName(itemId?: string) {
  if (!itemId) return null;

  const item = getItemConfig(itemId);
  return item?.category === 'costume' ? item.name : null;
}

function getEquippedCostumeName(itemId?: string) {
  return getCostumeName(itemId);
}

function getCostumeSlotLabel(slot: CostumeSlot) {
  const labels: Record<CostumeSlot, string> = {
    head: '머리',
    neck: '목',
    body: '몸',
    accessory: '액세서리',
  };

  return labels[slot];
}

function formatDinosaurStatChanges(effect: DinosaurStatEffect) {
  const changes = [
    effect.mood ? `행복 +${effect.mood}` : null,
    effect.exp ? `EXP +${effect.exp}` : null,
    effect.stamina ? `체력 +${effect.stamina}` : null,
  ].filter(Boolean);

  return changes.join(', ') || '외형 전용';
}
