import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Heart, Sparkles, Zap } from 'lucide-react';
import { getItemsByCategory, type FoodItemConfig } from '../../config/itemConfig';
import { dinosaurSpecies, type DinosaurSpecies } from '../../data/dinosaurSpecies';
import type { DinosaurState, OwnedDinosaur } from '../../types/game';
import petGreenMain from '../../assets/pet/backgrounds/pet_green_main-removebg-preview.png';
import { habitatBackgroundAssets } from '../../assets/dex';
import {
  dinoFeedButton,
  dinoFeedInfoPanel,
  myDinoFoodBagPanel,
  myDinoGrowthPanel,
  myDinoHatcheryButtonDefault,
  myDinoHatcheryButtonPressed,
  dinoNamePanelV2,
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
  const activeSpeciesName = activeSpecies?.displayName ?? activeSpecies?.name ?? '공룡 친구';

  return (
    <div className="pet-screen">
      <img src={habitatBackgroundAssets[activeSpecies?.habitat ?? 'green-forest']} alt="" className="pet-screen__background" />
      <div className="pet-screen__shade" />

      <div className="dinosaur-room-content">
        <section className="dinosaur-display-half" aria-label="공룡 표시 영역">
          <div className="pet-top-zone">
            <aside className="pet-side-menu" aria-label="공룡 화면 전환">
              {onGoToHatchery && (
                <AssetButton
                  label="알 부화장"
                  defaultAsset={myDinoHatcheryButtonDefault}
                  pressedAsset={myDinoHatcheryButtonPressed}
                  onClick={onGoToHatchery}
                  tone="dark"
                />
              )}
            </aside>

            <DinosaurStatusPanel dinosaur={dinosaur} />
          </div>

          <DinosaurStage
            dinosaur={dinosaur}
            species={activeSpecies}
            ownedCount={getUniqueOwnedDinosaurs(ownedDinosaurs).length}
            onSelectAdjacentDinosaur={onSelectAdjacentDinosaur}
          />
        </section>

        <section className="dinosaur-control-half" aria-label="공룡 관리 영역">
          <div className="dinosaur-control-row">
            <DinosaurIdentityPanel dinosaur={dinosaur} activeSpeciesName={activeSpeciesName} />
            <FeedAction inventory={inventory} selectedFoodItemId={selectedFoodItemId} onFeed={onFeed} />
          </div>
          <FeedInventory
            inventory={inventory}
            selectedFoodItemId={selectedFoodItemId}
            onSelectFood={onSelectFood}
          />
        </section>
      </div>
    </div>
  );
}

function DinosaurStage({
  dinosaur,
  species,
  ownedCount,
  onSelectAdjacentDinosaur,
}: {
  dinosaur: DinosaurState;
  species?: DinosaurSpecies;
  ownedCount: number;
  onSelectAdjacentDinosaur: (direction: -1 | 1) => void;
}) {
  const characterStyle = {
    '--dino-scale': species?.homeScale ?? 1,
    '--dino-x': `${species?.homeOffsetX ?? 0}px`,
    '--dino-y': `${species?.homeOffsetY ?? 0}px`,
  } as CSSProperties;

  return (
    <section className="pet-dino-stage" aria-label={`${dinosaur.name} 공룡`}>
      {ownedCount > 1 ? (
        <button type="button" aria-label="이전 공룡" onClick={() => onSelectAdjacentDinosaur(-1)} className="pet-dino-arrow pet-dino-arrow--prev">
          <ChevronLeft />
        </button>
      ) : <span className="pet-dino-arrow-spacer" aria-hidden="true" />}
      <div className="pet-dino-visual">
        <img
          src={species?.characterAsset ?? petGreenMain}
          alt={dinosaur.name}
          className="pet-dino-image"
          style={characterStyle}
          draggable={false}
        />
      </div>
      {ownedCount > 1 ? (
        <button type="button" aria-label="다음 공룡" onClick={() => onSelectAdjacentDinosaur(1)} className="pet-dino-arrow pet-dino-arrow--next">
          <ChevronRight />
        </button>
      ) : <span className="pet-dino-arrow-spacer" aria-hidden="true" />}
    </section>
  );
}

function DinosaurIdentityPanel({ dinosaur, activeSpeciesName }: { dinosaur: DinosaurState; activeSpeciesName: string }) {
  const expPercent = getExpProgressPercent(dinosaur.exp, dinosaur.expToNextLevel);

  return (
    <section className="pet-identity-panel" aria-label="공룡 이름과 경험치">
      <img src={dinoNamePanelV2} alt="" className="pet-identity-panel__asset" />
      <div className="pet-identity-panel__heading">
        <p>{activeSpeciesName}</p>
        <h3>{dinosaur.name}</h3>
      </div>
      <div className="pet-identity-panel__level">Lv. {dinosaur.level}</div>
      <div className="pet-exp">
        <div className="pet-exp__labels">
          <span>EXP</span>
          <span>{dinosaur.exp}/{dinosaur.expToNextLevel}</span>
        </div>
        <div className="pet-exp__track" role="progressbar" aria-label="경험치" aria-valuenow={expPercent} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${expPercent}%` }} />
        </div>
      </div>
    </section>
  );
}

function FeedAction({
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
  const quantity = selectedFoodItemId ? inventory.find((item) => item.itemId === selectedFoodItemId)?.quantity ?? 0 : 0;
  const canFeed = Boolean(selectedFood && quantity > 0 && onFeed && !isSubmitting);

  const handleFeed = () => {
    if (!canFeed || !onFeed) return;
    setIsSubmitting(true);
    onFeed();
    window.setTimeout(() => setIsSubmitting(false), 250);
  };

  return (
    <section className="pet-feed-action" aria-label="선택한 먹이">
      <div className="pet-selected-food__icon" aria-hidden="true">
        {selectedFood && <img src={shopFoodItemImages[selectedFood.id]} alt="" />}
      </div>
      <div className="pet-feed-info">
        <img src={dinoFeedInfoPanel} alt="" className="pet-feed-info__asset" />
        <div className="pet-feed-info__copy">
          <strong>{selectedFood?.name ?? '사료를 선택하세요'}</strong>
          <span>{selectedFood ? `보유 ${quantity}개` : '보유 수량 -'}</span>
        </div>
      </div>
      <button
        type="button"
        className="pet-feed-button"
        disabled={!canFeed}
        onClick={handleFeed}
        aria-label="먹이주기"
      >
        <img src={dinoFeedButton} alt="" draggable={false} />
      </button>
    </section>
  );
}

function DinosaurStatusPanel({ dinosaur }: { dinosaur: DinosaurState }) {
  const staminaPercent = getPercentValue(dinosaur.stamina, dinosaur.maxStamina);
  const growthPercent = getGrowthPercent(dinosaur.level);

  return (
    <section className="pet-status-panel" aria-label="성장 상태">
      <img src={myDinoGrowthPanel} alt="" className="pet-panel-asset" />
      <div className="pet-status-panel__content">
        <h4><Sparkles />성장 상태</h4>
        <MiniMeter icon={Heart} label="행복" value={dinosaur.happiness} tone="pink" />
        <MiniMeter icon={Zap} label="체력" value={staminaPercent} tone="green" />
        <MiniMeter icon={Sparkles} label="성장" value={growthPercent} tone="blue" />
        <p>{getGrowthStatusMessage(dinosaur.level, staminaPercent)}</p>
      </div>
    </section>
  );
}

function FeedInventory({
  inventory,
  selectedFoodItemId,
  onSelectFood,
}: {
  inventory: InventoryItemState[];
  selectedFoodItemId: string | null;
  onSelectFood: (itemId: string) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const foodItems = getShopFoodItems();

  const updateScrollButtons = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setCanScrollLeft(viewport.scrollLeft > 2);
    setCanScrollRight(viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth - 2);
  };

  useEffect(() => {
    updateScrollButtons();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      viewport.scrollBy({ left: event.deltaY, behavior: 'auto' });
    };
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      viewport.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const card = viewport.querySelector<HTMLElement>('.pet-food-card');
    viewport.scrollBy({ left: direction * ((card?.offsetWidth ?? viewport.clientWidth / 4) + 12), behavior: 'smooth' });
  };

  return (
    <section className="pet-food-inventory" aria-label="사료 가방">
      <img src={myDinoFoodBagPanel} alt="" className="pet-panel-asset" />
      <h4>사료 가방</h4>
      <button type="button" className="pet-inventory-arrow pet-inventory-arrow--prev" onClick={() => move(-1)} disabled={!canScrollLeft} aria-label="이전 사료">
        <ChevronLeft />
      </button>
      <div ref={viewportRef} className="pet-food-viewport" onScroll={updateScrollButtons}>
        {foodItems.map((food) => {
          const quantity = inventory.find((item) => item.itemId === food.id)?.quantity ?? 0;
          const selected = selectedFoodItemId === food.id;
          const disabled = quantity <= 0;
          return (
            <button
              type="button"
              key={food.id}
              disabled={disabled}
              onClick={() => onSelectFood(food.id)}
              aria-pressed={selected}
              className={`pet-food-card${selected ? ' is-selected' : ''}`}
            >
              <img src={shopFoodItemImages[food.id]} alt="" className="pet-food-card__image" />
              <span className="pet-food-card__name">{food.name}</span>
              <span className="pet-food-card__quantity">×{quantity}</span>
              {selected && <span className="pet-food-card__check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>
      <button type="button" className="pet-inventory-arrow pet-inventory-arrow--next" onClick={() => move(1)} disabled={!canScrollRight} aria-label="다음 사료">
        <ChevronRight />
      </button>
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
  tone = 'light',
  variant = 'menu',
  selected = false,
}: {
  label: string;
  defaultAsset: string;
  pressedAsset: string;
  disabledAsset?: string;
  disabled?: boolean;
  onClick?: () => void;
  tone?: 'light' | 'dark';
  variant?: 'menu' | 'feed';
  selected?: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const asset = disabled && disabledAsset ? disabledAsset : isPressed || selected ? pressedAsset : defaultAsset;
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
      aria-pressed={selected}
      className={`pet-asset-button pet-asset-button--${variant} pet-asset-button--${tone}${selected ? ' is-selected' : ''}`}
    >
      <img src={asset} alt="" draggable={false} />
      <span>{label}</span>
    </button>
  );
}

function MiniMeter({ icon: Icon, label, value, tone }: { icon: typeof Heart; label: string; value: number; tone: 'pink' | 'green' | 'blue' }) {
  const percent = clampUiPercent(value);
  return (
    <div className="pet-mini-meter">
      <div><span><Icon />{label}</span><strong>{percent}%</strong></div>
      <div className="pet-mini-meter__track"><span className={`pet-mini-meter__fill pet-mini-meter__fill--${tone}`} style={{ width: `${percent}%` }} /></div>
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
