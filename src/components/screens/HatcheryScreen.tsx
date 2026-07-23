import { ChevronLeft, ChevronRight, Lock, PackageOpen, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  getEggItemConfig,
  getHatchItemConfig,
  getItemsByCategory,
  type EggCategory,
  type HatchItemConfig,
} from '../../config/itemConfig';
import type { EggState, OwnedDinosaur, OwnedEgg } from '../../types/game';
import { getHatchCandidates } from '../../utils/hatchCandidates';
import hatcheryBackground from '../../assets/hatchery/backgrounds/hatchery_bg_common.png';
import eggNamePanel from '../../assets/hatchery/ui/hatchery_egg_name_panel.png';
import eggStatusPanel from '../../assets/hatchery/ui/hatchery_egg_status_panel.png';
import {
  myDinoFoodBagPanel,
  myDinoFoodSlotDefault,
  myDinoFoodSlotDisabled,
  myDinoFoodSlotSelected,
  myDinoHatcheryButtonDefault,
  myDinoHatcheryButtonPressed,
  myDinoListButtonDefault,
  myDinoListButtonPressed,
  myDinoOwnedFoodPanel,
  myDinoTitlePanel,
} from '../../assets/pet/mydino';
import {
  shopItemEggForestRare,
  shopItemEggGreen,
  shopItemEggLegendary,
  shopItemEggOcean,
  shopItemEggSparkle,
  shopItemEggVolcanoRare,
  shopItemHatchRareFragment,
  shopItemHatchSparkleEnergy,
  shopItemHatchWarmBlanket,
  shopItemHatchWarmStone,
} from '../../assets/shop';

type InventoryItemState = { itemId: string; quantity: number };

const eggImages: Readonly<Record<string, string>> = {
  'green-starter-egg': shopItemEggGreen,
  'rare-spark-egg': shopItemEggSparkle,
  'green-forest-rare-egg': shopItemEggForestRare,
  'volcano-island-rare-egg': shopItemEggVolcanoRare,
  'ocean-blue-egg': shopItemEggOcean,
  'legend-egg': shopItemEggLegendary,
};

const hatchItemImages: Readonly<Record<string, string>> = {
  'hatch-warm-stone': shopItemHatchWarmStone,
  'hatch-warm-blanket': shopItemHatchWarmBlanket,
  'hatch-spark-energy': shopItemHatchSparkleEnergy,
  'rare-egg-fragment': shopItemHatchRareFragment,
};

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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const activeEgg = getSelectedEgg(ownedEggs, activeEggId);
  const eggOptions = useMemo(() => groupOwnedEggs(ownedEggs, activeEggId), [ownedEggs, activeEggId]);
  const activeIndex = activeEgg ? eggOptions.findIndex((option) => option.egg.eggItemId === activeEgg.eggItemId) : -1;
  const activeEggQuantity = activeIndex >= 0 ? eggOptions[activeIndex]?.quantity ?? 0 : 0;
  const hatchItems = useMemo(
    () =>
      (getItemsByCategory('hatchItem') as HatchItemConfig[]).map((config) => ({
        config,
        quantity: inventory.find((item) => item.itemId === config.id)?.quantity ?? 0,
      })),
    [inventory],
  );
  const selectedItem = hatchItems.find((item) => item.config.id === selectedItemId) ?? null;
  const candidates = useMemo(() => getHatchCandidates(activeEgg, ownedDinosaurs), [activeEgg, ownedDinosaurs]);
  const progress = clampProgress(activeEgg?.hatchProgress ?? 0);
  const canHatch = Boolean(activeEgg && progress >= 100 && candidates.candidates.length > 0 && !hatchResult);

  useEffect(() => {
    if (selectedItemId && hatchItems.some((item) => item.config.id === selectedItemId && item.quantity > 0)) return;
    setSelectedItemId(hatchItems.find((item) => item.quantity > 0)?.config.id ?? null);
  }, [hatchItems, selectedItemId]);

  function selectAdjacent(direction: -1 | 1) {
    if (eggOptions.length <= 1 || activeIndex < 0) return;
    const next = eggOptions[(activeIndex + direction + eggOptions.length) % eggOptions.length];
    if (next) onSelectEgg(next.egg.id);
  }

  return (
    <div className="hatch-screen">
      <img src={hatcheryBackground} alt="" className="hatch-screen__background" />
      <div className="hatch-screen__shade" />

      <section className="hatch-top-zone">
        <aside className="pet-side-menu" aria-label="공룡 화면 전환">
          <AssetSwitchButton label="공룡 보기" selected={false} defaultAsset={myDinoListButtonDefault} pressedAsset={myDinoListButtonPressed} onClick={onGoToDino} />
          <AssetSwitchButton label="알 부화장" selected defaultAsset={myDinoHatcheryButtonDefault} pressedAsset={myDinoHatcheryButtonPressed} />
        </aside>

        <header className="pet-header">
          <img src={myDinoTitlePanel} alt="" />
          <h2>알 부화장</h2>
        </header>

        <EggSummaryPanel activeEgg={activeEgg} progress={progress} quantity={activeEggQuantity} selectedItem={selectedItem} />
      </section>

      <section className="hatch-stage">
        {eggOptions.length > 1 && (
          <>
            <button type="button" className="pet-dino-arrow pet-dino-arrow--prev" aria-label="이전 알" onClick={() => selectAdjacent(-1)}><ChevronLeft /></button>
            <button type="button" className="pet-dino-arrow pet-dino-arrow--next" aria-label="다음 알" onClick={() => selectAdjacent(1)}><ChevronRight /></button>
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

      <section className="hatch-control-zone">
        <div className="hatch-info-zone">
          <EggIdentityPanel activeEgg={activeEgg} progress={progress} feedback={feedback} />
          <HatchAction
            activeEgg={activeEgg}
            item={selectedItem}
            canHatch={canHatch}
            blocked={Boolean(hatchResult)}
            onUse={() => selectedItem && onUseHatchItem(selectedItem.config.id)}
            onHatch={onHatchEgg}
          />
        </div>
        <HatchItemBag inventory={hatchItems} selectedItemId={selectedItemId} disabled={!activeEgg || Boolean(hatchResult)} onSelect={setSelectedItemId} />
      </section>

      {hatchResult && <HatchResultPanel result={hatchResult} onGoToDex={onGoToDex} onGoToDino={onGoToDino} onClose={onCloseHatchResult} />}
    </div>
  );
}

function EggSummaryPanel({
  activeEgg,
  progress,
  quantity,
  selectedItem,
}: {
  activeEgg: OwnedEgg | null;
  progress: number;
  quantity: number;
  selectedItem: { config: HatchItemConfig; quantity: number } | null;
}) {
  return (
    <aside className="hatch-summary" aria-label="선택한 알 상태">
      <img src={eggStatusPanel} alt="" className="hatch-summary__asset" />
      <div className="hatch-summary__cell hatch-summary__cell--egg">
        <strong>{activeEgg?.name ?? '보유 알 없음'}</strong>
        <span>{activeEgg ? `${getCategoryLabel(getEggCategory(activeEgg))} · ${getRarityLabel(activeEgg.rarity)}` : '상점에서 알을 준비해 주세요'}</span>
      </div>
      <div className="hatch-summary__cell hatch-summary__cell--progress">
        <div><strong>부화 진행도</strong><span>{progress}/100</span></div>
        <div className="hatch-summary__progress"><span style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="hatch-summary__cell hatch-summary__cell--stock">
        <strong>보유 {quantity}개</strong>
        <span>{selectedItem ? `${selectedItem.config.name} x${selectedItem.quantity}` : '부화 아이템을 선택하세요'}</span>
      </div>
    </aside>
  );
}

function EggIdentityPanel({ activeEgg, progress, feedback }: { activeEgg: OwnedEgg | null; progress: number; feedback?: string }) {
  return (
    <section className="hatch-identity" aria-label="알 정보와 부화 진행도">
      <img src={eggNamePanel} alt="" className="hatch-identity__asset" />
      <div className="hatch-identity__content">
        <h3>{activeEgg?.name ?? '보유한 알이 없어요'}</h3>
        <div className="hatch-identity__rarity">{activeEgg ? getRarityLabel(activeEgg.rarity) : '-'}</div>
        <div className="hatch-identity__progress">
          <div className="hatch-progress__labels"><span>부화 진행도</span><strong>{progress}/100</strong></div>
          <div className="hatch-progress__track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        {feedback && <small>{feedback}</small>}
      </div>
    </section>
  );
}

function HatchAction({
  activeEgg,
  item,
  canHatch,
  blocked,
  onUse,
  onHatch,
}: {
  activeEgg: OwnedEgg | null;
  item: { config: HatchItemConfig; quantity: number } | null;
  canHatch: boolean;
  blocked: boolean;
  onUse: () => void;
  onHatch: () => void;
}) {
  const canUse = Boolean(activeEgg && item && item.quantity > 0 && item.config.effect.hatchProgress > 0 && !blocked);
  return (
    <section className="hatch-action" aria-label="선택한 부화 아이템">
      <div className="hatch-selected-item">
        <img src={myDinoOwnedFoodPanel} alt="" className="pet-panel-asset" />
        <div className="hatch-selected-item__content">
          {item ? <img src={hatchItemImages[item.config.id]} alt="" /> : <Sparkles />}
          <div><strong>{item?.config.name ?? '아이템 선택'}</strong><span>보유 {item?.quantity ?? 0}개</span></div>
        </div>
      </div>
      <div className="hatch-action__buttons">
        <button type="button" disabled={!canUse} onClick={onUse}>아이템 사용</button>
        <button type="button" className="is-primary" disabled={!canHatch} onClick={onHatch}>부화하기</button>
      </div>
    </section>
  );
}

function HatchItemBag({
  inventory,
  selectedItemId,
  disabled,
  onSelect,
}: {
  inventory: Array<{ config: HatchItemConfig; quantity: number }>;
  selectedItemId: string | null;
  disabled: boolean;
  onSelect: (itemId: string) => void;
}) {
  const targetCount = Math.max(8, inventory.length);
  const slots = [...inventory, ...Array.from({ length: targetCount - inventory.length }, (_, index) => ({ config: null, quantity: 0, id: `locked-${index}` }))];
  const [page, setPage] = useState(0);
  const visibleCount = 4;
  const maxPage = Math.max(0, slots.length - visibleCount);
  const visible = slots.slice(page, page + visibleCount);

  return (
    <section className="hatch-bag" aria-label="부화 아이템 가방">
      <img src={myDinoFoodBagPanel} alt="" className="pet-panel-asset" />
      <h4>부화 아이템 가방</h4>
      <button type="button" className="pet-inventory-arrow pet-inventory-arrow--prev" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} aria-label="이전 부화 아이템"><ChevronLeft /></button>
      <div className="hatch-bag__items">
        {visible.map((slot, slotIndex) => {
          if (!slot.config) {
            return <div key={`locked-${page + slotIndex}`} className="hatch-item-card is-locked"><img src={myDinoFoodSlotDisabled} alt="" /><Lock /><span>잠김</span></div>;
          }
          const selected = selectedItemId === slot.config.id;
          return (
            <button key={slot.config.id} type="button" className={`hatch-item-card${selected ? ' is-selected' : ''}`} disabled={disabled} onClick={() => onSelect(slot.config!.id)}>
              <img src={selected ? myDinoFoodSlotSelected : slot.quantity > 0 ? myDinoFoodSlotDefault : myDinoFoodSlotDisabled} alt="" className="hatch-item-card__frame" />
              <span className="hatch-item-card__icon"><img src={hatchItemImages[slot.config.id]} alt="" /></span>
              <span className="hatch-item-card__meta"><strong>{slot.config.name}</strong><b>x{slot.quantity}</b></span>
            </button>
          );
        })}
      </div>
      <button type="button" className="pet-inventory-arrow pet-inventory-arrow--next" disabled={page >= maxPage} onClick={() => setPage((value) => Math.min(maxPage, value + 1))} aria-label="다음 부화 아이템"><ChevronRight /></button>
    </section>
  );
}

function HatchResultPanel({ result, onGoToDex, onGoToDino, onClose }: { result: HatchResult; onGoToDex: () => void; onGoToDino: () => void; onClose: () => void }) {
  return (
    <div className="hatch-result" role="dialog" aria-modal="true" aria-label="부화 결과">
      <section>
        <Sparkles />
        <p>{result.eggName}에서</p>
        <h3>{result.dinosaurName}</h3>
        <strong>{result.speciesName} 탄생!</strong>
        <span>{result.message}</span>
        <div><button onClick={onGoToDex}>도감 보기</button><button onClick={onGoToDino}>우리 공룡</button><button onClick={onClose}>계속 보기</button></div>
      </section>
    </div>
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
  return egg.eggCategory ?? getEggItemConfig(egg.eggItemId)?.eggCategory ?? (egg.rarity === 'rare' ? 'rare' : egg.rarity === 'special' ? 'special' : 'normal');
}

function getEggImage(egg: OwnedEgg) {
  return eggImages[egg.eggItemId] ?? (getEggCategory(egg) === 'normal' ? shopItemEggGreen : getEggCategory(egg) === 'rare' ? shopItemEggForestRare : shopItemEggSparkle);
}

function getCategoryLabel(category: EggCategory) {
  return category === 'normal' ? '일반 알' : category === 'rare' ? '희귀 알' : '특별 알';
}

function getRarityLabel(rarity: EggState['rarity']) {
  return rarity === 'normal' ? '일반' : rarity === 'rare' ? '희귀' : '특별';
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}
