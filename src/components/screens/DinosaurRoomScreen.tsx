import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Heart, Sparkles, Zap } from 'lucide-react';
import { getItemsByCategory, type FoodItemConfig } from '../../config/itemConfig';
import { dinosaurSpecies } from '../../data/dinosaurSpecies';
import type { DinosaurState, OwnedDinosaur } from '../../types/game';
import petHomeBackground from '../../assets/pet/backgrounds/bg_pet_home_forest.png';
import petGreenMain from '../../assets/pet/backgrounds/pet_green_main-removebg-preview.png';
import {
  myDinoFeedButtonDefault,
  myDinoFeedButtonDisabled,
  myDinoFeedButtonPressed,
  myDinoFoodBagPanel,
  myDinoFoodSlotDefault,
  myDinoFoodSlotDisabled,
  myDinoFoodSlotSelected,
  myDinoGrowthPanel,
  myDinoHatcheryButtonDefault,
  myDinoHatcheryButtonPressed,
  myDinoListButtonDefault,
  myDinoListButtonPressed,
  myDinoNameExpPanel,
  myDinoOwnedFoodPanel,
  myDinoTitlePanel,
} from '../../assets/pet/mydino';
import { shopFoodItemImages } from '../../assets/shop';

type DinoView = 'care' | 'playground';
type DinosaurInteractionChange = Partial<Pick<DinosaurState, 'exp' | 'mood' | 'stamina'>>;
type InventoryItemState = { itemId: string; quantity: number };

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
    <div className="pet-screen pet-bg relative grid h-full min-h-0 grid-rows-[clamp(52px,8dvh,78px)_minmax(0,1fr)_clamp(98px,14dvh,132px)_clamp(150px,24dvh,220px)] gap-1.5 overflow-hidden rounded-[30px] border-4 border-white bg-emerald-100 p-2 sm:gap-2">
      <img src={petHomeBackground} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-lime-100/5 to-emerald-950/10" />

      <header className="pet-header relative z-10 flex min-h-0 items-center justify-center">
        <div className="relative aspect-[1709/566] h-full max-h-[78px] w-auto max-w-[62%]">
          <img src={myDinoTitlePanel} alt="" className="absolute inset-0 h-full w-full object-contain" />
          <h2 className="absolute inset-x-[12%] bottom-[18%] top-[17%] flex items-center justify-center text-[clamp(1rem,3dvh,1.65rem)] font-black leading-none text-[#6b3b17] drop-shadow-[0_1px_0_rgba(255,255,255,.85)]">
            우리 공룡
          </h2>
        </div>
      </header>

      <section className="pet-main-zone relative z-10 grid min-h-0 grid-cols-[clamp(68px,14vw,100px)_minmax(0,1fr)_clamp(112px,25vw,198px)] gap-1.5 sm:gap-2">
        <aside className="pet-side-menu grid min-h-0 content-start gap-2 pt-1">
          <AssetButton
            label="공룡 보기"
            defaultAsset={myDinoListButtonDefault}
            pressedAsset={myDinoListButtonPressed}
            className="w-full"
            textClassName="left-[34%] right-[7%] text-[clamp(0.625rem,1.8vw,0.875rem)] text-white"
          />
          {onGoToHatchery && (
            <AssetButton
              label="알 부화장"
              defaultAsset={myDinoHatcheryButtonDefault}
              pressedAsset={myDinoHatcheryButtonPressed}
              onClick={onGoToHatchery}
              className="w-full"
              textClassName="left-[34%] right-[7%] text-[clamp(0.625rem,1.8vw,0.875rem)] text-amber-950"
            />
          )}
        </aside>

        <section className="pet-main-stage min-h-0 overflow-hidden">
          <DinosaurStage dinosaur={dinosaur} ownedCount={uniqueOwnedDinosaurs.length} onSelectAdjacentDinosaur={onSelectAdjacentDinosaur} />
        </section>

        <aside className="pet-status-zone min-h-0">
          <DinosaurStatusPanel dinosaur={dinosaur} />
        </aside>
      </section>

      <section className="pet-info-zone relative z-10 grid min-h-0 grid-cols-[minmax(0,1.1fr)_minmax(126px,.9fr)] items-center gap-1.5 sm:gap-2">
        <DinosaurNamePanel dinosaur={dinosaur} activeSpeciesName={activeSpeciesName} />
        <FeedPanel inventory={inventory} selectedFoodItemId={selectedFoodItemId} onFeed={onFeed} />
      </section>

      <section className="pet-food-bag-zone relative z-10 min-h-0">
        <FoodBagPanel inventory={inventory} selectedFoodItemId={selectedFoodItemId} onSelectFood={onSelectFood} />
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
            type="button"
            aria-label="이전 공룡"
            onClick={() => onSelectAdjacentDinosaur(-1)}
            className="pet-dino-arrow pet-dino-arrow--prev absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[14px] border-3 border-white bg-white/88 text-emerald-800 shadow-[0_4px_0_#86efac] transition active:translate-y-[calc(-50%+3px)] active:shadow-none sm:left-2 sm:h-11 sm:w-11"
          >
            <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
          <button
            type="button"
            aria-label="다음 공룡"
            onClick={() => onSelectAdjacentDinosaur(1)}
            className="pet-dino-arrow pet-dino-arrow--next absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[14px] border-3 border-white bg-white/88 text-emerald-800 shadow-[0_4px_0_#86efac] transition active:translate-y-[calc(-50%+3px)] active:shadow-none sm:right-2 sm:h-11 sm:w-11"
          >
            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
        </>
      )}
      <div className="pet-dino-layer relative z-10 flex h-full min-h-0 items-end justify-center pb-1">
        <div className="absolute bottom-4 h-8 w-[62%] rounded-[50%] bg-emerald-900/12 blur-sm" />
        <img
          src={petGreenMain}
          alt={dinosaur.name}
          className="pet-dino-image relative z-10 max-h-[86%] max-w-[96%] object-contain drop-shadow-[0_18px_20px_rgba(20,83,45,.24)]"
        />
      </div>
    </section>
  );
}

function DinosaurNamePanel({ dinosaur, activeSpeciesName }: { dinosaur: DinosaurState; activeSpeciesName: string }) {
  const expPercent = getExpProgressPercent(dinosaur.exp, dinosaur.expToNextLevel);

  return (
    <section className="pet-name-panel relative h-full min-h-0 overflow-hidden">
      <img src={myDinoNameExpPanel} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      <div className="absolute inset-x-[9%] bottom-[43%] top-[20%] flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[clamp(0.55rem,1.45vw,0.75rem)] font-black text-amber-700">{activeSpeciesName}</p>
          <h3 className="truncate text-[clamp(0.85rem,2.2vw,1.25rem)] font-black leading-tight text-emerald-950">{dinosaur.name}</h3>
        </div>
      </div>
      <div className="absolute bottom-[10%] left-[10%] top-[70%] flex w-[17%] items-center justify-center text-[clamp(0.58rem,1.7vw,0.82rem)] font-black text-emerald-900">
        Lv.{dinosaur.level}
      </div>
      <div className="absolute bottom-[9%] left-[29%] right-[10%] top-[69%] flex min-w-0 flex-col justify-center">
        <div className="flex justify-between gap-2 text-[clamp(0.5rem,1.25vw,0.68rem)] font-black text-emerald-800">
          <span>EXP</span>
          <span>{dinosaur.exp}/{dinosaur.expToNextLevel}</span>
        </div>
        <div className="mt-0.5 h-[clamp(5px,1dvh,9px)] overflow-hidden rounded-full bg-emerald-100 shadow-inner">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: `${expPercent}%` }} />
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedFood = selectedFoodItemId ? getShopFoodItems().find((food) => food.id === selectedFoodItemId) ?? null : null;
  const selectedInventoryItem = selectedFoodItemId ? inventory.find((item) => item.itemId === selectedFoodItemId) : null;
  const quantity = selectedInventoryItem?.quantity ?? 0;
  const selectedFoodImage = selectedFood ? shopFoodItemImages[selectedFood.id] : undefined;
  const canFeed = Boolean(selectedFood && quantity > 0 && onFeed && !isSubmitting);

  const handleFeed = () => {
    if (!canFeed || !onFeed) return;
    setIsSubmitting(true);
    onFeed();
    window.setTimeout(() => setIsSubmitting(false), 250);
  };

  return (
    <section className="pet-feed-panel grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-1">
      <div className="relative min-h-0 overflow-hidden">
        <img src={myDinoOwnedFoodPanel} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
        <div className="absolute bottom-[13%] left-[9%] top-[17%] flex w-[27%] items-center justify-center">
          {selectedFoodImage && <img src={selectedFoodImage} alt="" className="h-full w-full object-contain" />}
        </div>
        <div className="absolute bottom-[51%] left-[40%] right-[8%] top-[17%] flex min-w-0 items-center justify-center text-center text-[clamp(0.56rem,1.45vw,0.78rem)] font-black leading-tight text-amber-950">
          <span className="line-clamp-2">{selectedFood ? selectedFood.name : '사료를 선택하세요'}</span>
        </div>
        <div className="absolute bottom-[13%] left-[40%] right-[8%] top-[55%] flex items-center justify-center text-[clamp(0.58rem,1.5vw,0.82rem)] font-black text-orange-800">
          {selectedFood ? `보유 ${quantity}개` : '보유 수량 -'}
        </div>
      </div>
      <AssetButton
        label="먹이주기"
        defaultAsset={myDinoFeedButtonDefault}
        pressedAsset={myDinoFeedButtonPressed}
        disabledAsset={myDinoFeedButtonDisabled}
        disabled={!canFeed}
        onClick={handleFeed}
        className="mx-auto w-[min(100%,170px)]"
        textClassName="inset-x-[12%] text-[clamp(0.72rem,1.8vw,1rem)] text-white"
      />
    </section>
  );
}

function DinosaurStatusPanel({ dinosaur }: { dinosaur: DinosaurState }) {
  const staminaPercent = getPercentValue(dinosaur.stamina, dinosaur.maxStamina);
  const growthPercent = getGrowthPercent(dinosaur.level);
  const statusMessage = getGrowthStatusMessage(dinosaur.level, staminaPercent);

  return (
    <section className="pet-status-panel relative h-full min-h-0 overflow-visible">
      <img src={myDinoGrowthPanel} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      <div className="absolute bottom-[11%] left-[16%] right-[14%] top-[14%] flex min-h-0 flex-col">
        <div className="flex h-[13%] items-center justify-center gap-1 text-[clamp(0.62rem,1.65vw,0.92rem)] font-black text-[#6b3b17]">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <h4>성장 상태</h4>
        </div>
        <div className="grid min-h-0 flex-1 grid-rows-[repeat(3,minmax(0,1fr))_minmax(0,1.45fr)] gap-[2px] pt-1">
          <MiniMeter icon={Heart} label="행복" value={dinosaur.happiness} tone="from-pink-400 to-rose-500" />
          <MiniMeter icon={Zap} label="체력" value={staminaPercent} tone="from-emerald-400 to-lime-500" />
          <MiniMeter icon={Sparkles} label="성장" value={growthPercent} tone="from-cyan-400 to-sky-500" />
          <div className="flex min-h-0 flex-col justify-center px-[6%] py-0.5 text-center">
            <p className="text-[clamp(0.46rem,1.1vw,0.62rem)] font-black text-emerald-700">상태 메시지</p>
            <p className="line-clamp-2 text-[clamp(0.5rem,1.25vw,0.68rem)] font-black leading-tight text-emerald-950">{statusMessage}</p>
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
}) {
  const foodItems = getShopFoodItems();

  return (
    <section className="pet-food-bag relative mx-auto h-full min-h-0 w-full max-w-[820px] overflow-visible">
      <img src={myDinoFoodBagPanel} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      <h4 className="absolute left-[9%] top-[7%] flex h-[16%] w-[17%] items-center justify-center whitespace-nowrap text-[clamp(0.6rem,1.6vw,0.9rem)] font-black text-[#6b3b17]">사료 가방</h4>
      <div className="absolute bottom-[10%] left-[6%] right-[6%] top-[25%] flex min-h-0 snap-x gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {foodItems.map((food) => {
          const quantity = inventory.find((item) => item.itemId === food.id)?.quantity ?? 0;
          const isSelected = selectedFoodItemId === food.id;
          const isDisabled = quantity <= 0;
          const slotAsset = isDisabled ? myDinoFoodSlotDisabled : isSelected ? myDinoFoodSlotSelected : myDinoFoodSlotDefault;

          return (
            <button
              type="button"
              key={food.id}
              disabled={isDisabled}
              onClick={() => onSelectFood(food.id)}
              aria-pressed={isSelected}
              className="pet-food-slot relative aspect-square h-full min-h-[68px] min-w-[68px] max-w-[116px] flex-none snap-start bg-transparent p-0 transition active:scale-[0.97] disabled:cursor-not-allowed sm:min-h-[76px] sm:min-w-[76px]"
            >
              <img src={slotAsset} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
              <img src={shopFoodItemImages[food.id]} alt="" className={`pointer-events-none absolute inset-x-[18%] top-[11%] h-[55%] w-[64%] object-contain ${isDisabled ? 'grayscale opacity-55' : ''}`} />
              <span className="absolute bottom-[17%] left-[12%] right-[12%] truncate text-[clamp(0.48rem,1vw,0.62rem)] font-black leading-none text-amber-950">{food.name}</span>
              <span className="absolute bottom-[4%] right-[7%] rounded-full bg-white/90 px-1.5 py-0.5 text-[clamp(0.5rem,1vw,0.68rem)] font-black leading-none text-orange-800 shadow-sm">x{quantity}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AssetButton({
  label,
  defaultAsset,
  pressedAsset,
  disabledAsset,
  disabled = false,
  onClick,
  className = '',
  textClassName = '',
}: {
  label: string;
  defaultAsset: string;
  pressedAsset: string;
  disabledAsset?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  textClassName?: string;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const asset = disabled && disabledAsset ? disabledAsset : isPressed ? pressedAsset : defaultAsset;
  const release = () => setIsPressed(false);
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsPressed(true);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!disabled && (event.key === ' ' || event.key === 'Enter')) setIsPressed(true);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onKeyDown={handleKeyDown}
      onKeyUp={release}
      onBlur={release}
      aria-label={label}
      className={`relative aspect-[2.8/1] touch-manipulation overflow-hidden bg-transparent p-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed ${className}`}
    >
      <img src={asset} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
      <span className={`pointer-events-none absolute inset-y-[12%] flex items-center justify-center whitespace-nowrap font-black leading-none drop-shadow-[0_2px_1px_rgba(3,84,63,.85)] ${textClassName}`}>{label}</span>
    </button>
  );
}

function MiniMeter({ icon: Icon, label, value, tone }: { icon: typeof Heart; label: string; value: number; tone: string }) {
  const percent = clampUiPercent(value);

  return (
    <div className="flex min-h-0 flex-col justify-center px-[6%] py-0.5">
      <div className="flex items-center justify-between gap-1 text-[clamp(0.48rem,1.1vw,0.64rem)] font-black leading-none text-emerald-900">
        <span className="inline-flex min-w-0 items-center gap-0.5">
          <Icon className="h-3 w-3 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <span>{percent}%</span>
      </div>
      <div className="mt-1 h-[clamp(4px,.8dvh,8px)] overflow-hidden rounded-full bg-white/80 shadow-inner">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function getShopFoodItems() {
  return (getItemsByCategory('food') as FoodItemConfig[]).filter((food) => Boolean(shopFoodItemImages[food.id]));
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
  if (staminaPercent < 35) return '먹이를 주면 힘이 나요!';
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
