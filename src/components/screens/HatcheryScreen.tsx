import { PackageOpen } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavigationArrow } from '../NavigationArrow';
import {
  getEggItemConfig,
  getItemsByCategory,
  type EggCategory,
  type HatchItemConfig,
} from '../../config/itemConfig';
import type { EggState, OwnedDinosaur, OwnedEgg } from '../../types/game';
import { getHatchCandidates } from '../../utils/hatchCandidates';
import { playSound } from '../../audio/audioManager';
import { getDinosaurSpecies } from '../../data/dinosaurSpecies';
import hatcheryBackground from '../../assets/hatchery/backgrounds/hatchery_bg_common.png';
import hatcheryProgressPanel from '../../assets/hatchery/ui/hatchery_progress_panel.png';
import hatchItemSelectedPanel from '../../assets/hatchery/ui/hatch_item_selected_panel.png';
import hatchItemUseButton from '../../assets/hatchery/ui/hatch_btn_item_use.png';
import hatchStartButton from '../../assets/hatchery/ui/hatch_btn_start.png';
import hatchSuccessPanel from '../../assets/hatchery/success-popup/hatch_success_popup_panel.png';
import hatchSuccessCollectionButton from '../../assets/hatchery/success-popup/hatch_success_btn_collection.png';
import hatchSuccessMyDinosaurButton from '../../assets/hatchery/success-popup/hatch_success_btn_my_dinosaur.png';
import hatchSuccessContinueButton from '../../assets/hatchery/success-popup/hatch_success_btn_continue.png';
import {
  myDinoFoodBagPanel,
  myDinoListButtonDefault,
  myDinoListButtonPressed,
} from '../../assets/pet/mydino';
import {
  eggCommon,
  eggLegendary,
  eggRare,
  eggSpecial,
  shopItemHatchRareFragment,
  shopItemHatchSparkleEnergy,
  shopItemHatchWarmBlanket,
  shopItemHatchWarmStone,
} from '../../assets/shop';

type InventoryItemState = { itemId: string; quantity: number };
type HatchInventoryItem = { config: HatchItemConfig; quantity: number };

const eggImages: Readonly<Record<string, string>> = {
  'green-starter-egg': eggCommon,
  'rare-spark-egg': eggSpecial,
  'rare-egg': eggRare,
  'legend-egg': eggLegendary,
};

const hatchItemImages: Readonly<Record<string, string>> = {
  'hatch-warm-stone': shopItemHatchWarmStone,
  'hatch-warm-blanket': shopItemHatchWarmBlanket,
  'hatch-spark-energy': shopItemHatchSparkleEnergy,
  'rare-egg-fragment': shopItemHatchRareFragment,
};

export type HatchResult = {
  speciesId: string;
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
  hatchResult,
  onSelectEgg,
  onUseHatchItem,
  onHatchEgg,
  onGoToDex,
  onGoToDino,
  onCloseHatchResult,
}: HatcheryScreenProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const activeEgg = getSelectedEgg(ownedEggs, activeEggId);
  const eggOptions = useMemo(() => groupOwnedEggs(ownedEggs, activeEggId), [ownedEggs, activeEggId]);
  const activeIndex = activeEgg ? eggOptions.findIndex((option) => option.egg.eggItemId === activeEgg.eggItemId) : -1;
  const hatchItems = useMemo<HatchInventoryItem[]>(
    () =>
      (getItemsByCategory('hatchItem') as HatchItemConfig[]).map((config) => ({
        config,
        quantity: inventory.find((item) => item.itemId === config.id)?.quantity ?? 0,
      })),
    [inventory],
  );
  const selectedItem = hatchItems.find((item) => item.config.id === selectedItemId) ?? null;
  const progress = clampProgress(activeEgg?.hatchProgress ?? 0);
  const candidates = useMemo(() => getHatchCandidates(activeEgg, ownedDinosaurs), [activeEgg, ownedDinosaurs]);
  const canUseItem = Boolean(activeEgg && selectedItem && selectedItem.quantity > 0 && selectedItem.config.effect.hatchProgress > 0 && !hatchResult);
  const canHatch = Boolean(activeEgg && progress >= 100 && candidates.candidates.length > 0 && !hatchResult);

  function selectAdjacent(direction: -1 | 1) {
    if (eggOptions.length <= 1 || activeIndex < 0) return;
    const next = eggOptions[(activeIndex + direction + eggOptions.length) % eggOptions.length];
    if (next) onSelectEgg(next.egg.id);
  }

  return (
    <div className="hatch-screen">
      <img src={hatcheryBackground} alt="" className="hatch-screen__background" />

      <div className="hatchery-content">
        <div className="hatchery-mode-tabs" aria-label="공룡 화면 전환">
          <AssetSwitchButton
            label="공룡 보기"
            selected={false}
            defaultAsset={myDinoListButtonDefault}
            pressedAsset={myDinoListButtonPressed}
            onClick={() => {
              playSound('ui_tab_switch');
              onGoToDino();
            }}
          />
        </div>

        <section className="hatchery-egg-display" aria-label="선택한 알">
          {eggOptions.length > 1 && (
            <>
              <NavigationArrow direction="previous" ariaLabel="이전 알" onClick={() => selectAdjacent(-1)} className="pet-dino-arrow pet-dino-arrow--prev" />
              <NavigationArrow direction="next" ariaLabel="다음 알" onClick={() => selectAdjacent(1)} className="pet-dino-arrow pet-dino-arrow--next" />
            </>
          )}
          {activeEgg ? (
            <>
              <img src={getEggImage(activeEgg)} alt={activeEgg.name} className="hatch-stage__egg" />
              <p className="hatch-stage__caption">{activeEgg.name}</p>
            </>
          ) : (
            <div className="hatch-empty">
              <PackageOpen />
              <strong>보유한 알이 없어요</strong>
              <span>상점에서 알을 준비해 보세요.</span>
            </div>
          )}
        </section>

        <section className="hatchery-controls" aria-label="부화 제어 영역">
          <div className="hatchery-control-row">
            <div className="hatchery-progress-column">
              <HatchProgressPanel activeEgg={activeEgg} progress={progress} />
            </div>
            <div className="hatchery-action-column">
              <SelectedHatchItemPanel item={selectedItem} />
              <div className="hatch-action-buttons">
                <HatchActionButton
                  label="아이템 사용"
                  src={hatchItemUseButton}
                  disabled={!canUseItem}
                  onClick={() => selectedItem && onUseHatchItem(selectedItem.config.id)}
                />
                <HatchActionButton
                  label="부화하기"
                  src={hatchStartButton}
                  disabled={!canHatch}
                  onClick={() => {
                    playSound('ui_button_tap');
                    onHatchEgg();
                  }}
                />
              </div>
            </div>
          </div>
          <HatchItemBag
            inventory={hatchItems}
            selectedItemId={selectedItemId}
            onSelect={(itemId) => {
              if (itemId !== selectedItemId) {
                playSound('item_select');
                setSelectedItemId(itemId);
              }
            }}
          />
        </section>
      </div>

      {hatchResult && <HatchResultPanel result={hatchResult} onGoToDex={onGoToDex} onGoToDino={onGoToDino} onClose={onCloseHatchResult} />}
    </div>
  );
}

function HatchProgressPanel({ activeEgg, progress }: { activeEgg: OwnedEgg | null; progress: number }) {
  return (
    <section className="hatch-progress-panel" aria-label="알 부화 진행도">
      <img src={hatcheryProgressPanel} alt="" />
      <div className="hatch-progress-panel__content">
        <div className="hatch-progress-panel__title">
          <strong>{activeEgg?.name ?? '선택한 알 없음'}</strong>
          <span>{activeEgg ? getRarityLabel(activeEgg.rarity) : '-'}</span>
        </div>
        <div className="hatch-progress-panel__meter">
          <div><span>부화 진행도</span><strong>{progress}%</strong></div>
          <div className="hatch-progress-panel__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectedHatchItemPanel({ item }: { item: HatchInventoryItem | null }) {
  return (
    <section className="hatch-selected-panel" aria-label="선택한 부화 아이템">
      <img src={hatchItemSelectedPanel} alt="" className="hatch-selected-panel__background" />
      <div className="hatch-selected-panel__content">
        <span className="hatch-selected-panel__icon">
          {item && <img src={hatchItemImages[item.config.id]} alt="" />}
        </span>
        <div>
          <strong>{item?.config.name ?? '아이템을 선택하세요'}</strong>
          {item && <span>보유 {item.quantity}개</span>}
        </div>
      </div>
    </section>
  );
}

function HatchActionButton({ label, src, disabled, onClick }: { label: string; src: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" className="hatch-action-button" disabled={disabled} onClick={onClick}>
      <img src={src} alt="" />
      <span>{label}</span>
    </button>
  );
}

function HatchItemBag({
  inventory,
  selectedItemId,
  onSelect,
}: {
  inventory: HatchInventoryItem[];
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
}) {
  return (
    <section className="hatch-bag" aria-label="부화 아이템 가방">
      <img src={myDinoFoodBagPanel} alt="" className="hatch-bag__frame" />
      <h2>부화 아이템 가방</h2>
      <div className="hatch-bag__items">
        {inventory.map(({ config, quantity }) => {
          const selected = selectedItemId === config.id;
          const unavailable = quantity <= 0;
          return (
            <button
              key={config.id}
              type="button"
              className={`hatch-item-card${selected ? ' is-selected' : ''}`}
              disabled={unavailable}
              aria-pressed={selected}
              onClick={() => onSelect(config.id)}
            >
              <span className="hatch-item-card__visual">
                <img src={hatchItemImages[config.id]} alt="" className="hatch-item-card__icon" />
              </span>
              <span className="hatch-item-card__name">{config.name}</span>
              <span className="hatch-item-card__quantity">x{quantity}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HatchResultPanel({ result, onGoToDex, onGoToDino, onClose }: { result: HatchResult; onGoToDex: () => void; onGoToDino: () => void; onClose: () => void }) {
  const species = getDinosaurSpecies(result.speciesId);
  const dinosaurImage = species?.images?.baby ?? species?.characterAsset;
  const description = species?.description ?? result.message;

  return (
    <div className="hatch-result">
      <section role="dialog" aria-modal="true" aria-labelledby="hatch-success-title" className="hatch-success-popup">
        <img src={hatchSuccessPanel} alt="" aria-hidden="true" className="hatch-success-popup__panel" draggable={false} />
        <div className="hatch-success-popup__dinosaur">
          {dinosaurImage && <img src={dinosaurImage} alt={result.dinosaurName} draggable={false} />}
        </div>
        <div className="hatch-success-popup__copy">
          <p>새로운 공룡이 태어났어요!</p>
          <h2 id="hatch-success-title">{result.dinosaurName}</h2>
          <strong>{result.speciesName} · {result.eggName} ({getRarityLabel(result.eggRarity)})</strong>
          <span>{description}</span>
        </div>
        <div className="hatch-success-popup__actions">
          <HatchSuccessButton src={hatchSuccessCollectionButton} label="도감 보기" onClick={onGoToDex} />
          <HatchSuccessButton src={hatchSuccessMyDinosaurButton} label="우리 공룡" onClick={onGoToDino} />
          <HatchSuccessButton src={hatchSuccessContinueButton} label="계속 보기" onClick={onClose} />
        </div>
      </section>
    </div>
  );
}

function HatchSuccessButton({ src, label, onClick }: { src: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        playSound('ui_button_tap');
        onClick();
      }}
      className="hatch-success-popup__button"
    >
      <img src={src} alt="" aria-hidden="true" draggable={false} />
    </button>
  );
}

function AssetSwitchButton({ label, selected, defaultAsset, pressedAsset, onClick }: { label: string; selected: boolean; defaultAsset: string; pressedAsset: string; onClick?: () => void }) {
  return (
    <button type="button" className={`pet-asset-button pet-asset-button--menu pet-asset-button--dark${selected ? ' is-selected' : ''}`} onClick={onClick} aria-pressed={selected}>
      <img src={selected ? pressedAsset : defaultAsset} alt="" />
      <span>{label}</span>
    </button>
  );
}

function getSelectedEgg(eggs: OwnedEgg[], activeEggId: string | null) {
  return eggs.find((egg) => egg.id === activeEggId) ?? eggs[0] ?? null;
}

function groupOwnedEggs(eggs: OwnedEgg[], activeEggId: string | null) {
  const grouped = new Map<string, { egg: OwnedEgg; quantity: number }>();
  for (const egg of eggs) {
    const current = grouped.get(egg.eggItemId);
    if (!current) {
      grouped.set(egg.eggItemId, { egg, quantity: 1 });
      continue;
    }
    current.quantity += 1;
    if (egg.id === activeEggId) current.egg = egg;
  }
  return [...grouped.values()];
}

function getEggCategory(egg: OwnedEgg): EggCategory {
  return egg.eggCategory ?? getEggItemConfig(egg.eggItemId)?.eggCategory ?? (egg.rarity === 'legendary' ? 'legendary' : egg.rarity === 'rare' ? 'rare' : egg.rarity === 'special' ? 'special' : 'normal');
}

function getEggImage(egg: OwnedEgg) {
  return eggImages[egg.eggItemId] ?? (getEggCategory(egg) === 'normal' ? eggCommon : getEggCategory(egg) === 'rare' ? eggRare : getEggCategory(egg) === 'legendary' ? eggLegendary : eggSpecial);
}

function getRarityLabel(rarity: EggState['rarity']) {
  return rarity === 'normal' || rarity === 'common' ? '일반' : rarity === 'rare' ? '희귀' : rarity === 'legendary' ? '전설' : '특별';
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}
