import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LockKeyhole, X } from 'lucide-react';
import { adventureMapAssets } from '../../assets/adventure';
import { ADVENTURE_REGIONS, adventureRegions, type AdventureRegion, type AdventureRegionId } from '../../data/adventureRegions';
import { playSound } from '../../audio/audioManager';
import { ADVENTURE_STAGE_CATALOG, type AdventureStageNumber } from '../../config/adventureStageCatalog';
import { lavaValleyStageSelectAssets } from '../../assets/adventure/lava-valley';
import { canPlayAdventureStage, getAdventureStageState, type AdventureStageProgress } from '../../utils/adventureStageProgress';
import { dinosaurSpecies } from '../../data/dinosaurSpecies';
import { normalizeRegionRelicProgress, REGION_DEX_HABITAT, REGION_RELIC_FRAGMENT_GOAL, WORLD_GATE_REQUIRED_RELICS, type RegionRelicProgress } from '../../config/worldMapRelicConfig';

export interface AdventureMapScreenProps {
  coins: number;
  onStartGame: (gameId: string, stageNumber: AdventureStageNumber) => void;
  stageProgress: AdventureStageProgress;
  discoveredSpeciesIds: string[];
  relicProgress?: Partial<Record<AdventureRegionId, Partial<RegionRelicProgress>>>;
}

export function AdventureMapScreen({ coins, onStartGame, stageProgress, discoveredSpeciesIds, relicProgress }: AdventureMapScreenProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<AdventureRegionId | null>(null);
  const [worldGateOpen, setWorldGateOpen] = useState(false);
  const selectedRegion = selectedRegionId ? ADVENTURE_REGIONS[selectedRegionId] : null;
  const openRegionModal = (regionId: AdventureRegionId) => setSelectedRegionId(regionId);
  const regionRelics = normalizeRegionRelicProgress(relicProgress);
  const discoveredSet = new Set(discoveredSpeciesIds);
  const regionProgress = Object.fromEntries(adventureRegions.map((region) => {
    const habitat = REGION_DEX_HABITAT[region.id];
    const species = dinosaurSpecies.filter((entry) => entry.habitat === habitat);
    return [region.id, {
      dexFound: species.filter((entry) => discoveredSet.has(entry.speciesId)).length,
      dexTotal: species.length,
      relic: regionRelics[region.id],
    }];
  })) as Record<AdventureRegionId, { dexFound: number; dexTotal: number; relic: RegionRelicProgress }>;
  const completedRelics = adventureRegions.filter((region) => regionProgress[region.id].relic.completed).length;

  useEffect(() => {
    if (!selectedRegionId) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedRegionId(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedRegionId]);

  return (
    <section className="adventure-map-screen relative h-full min-h-0 w-full overflow-hidden">
      <div className="adventure-world-map absolute">
        <img src={adventureMapAssets.worldMap} alt="다섯 모험 지역이 이어진 세계 지도" className="h-full w-full object-contain" draggable={false} />
        {adventureRegions.map((region) => (
          <AdventureRegionHotspot key={region.id} region={region} progress={regionProgress[region.id]} onSelect={openRegionModal} />
        ))}
      </div>

      <img className="adventure-map-title pointer-events-none absolute left-1/2 top-[1.5%] z-20 w-[min(72%,31rem)] -translate-x-1/2 object-contain" src={adventureMapAssets.titleBanner} alt="모험 지도" draggable={false} />
      <button type="button" className="world-gate-summary" onClick={() => { playSound('ui_button_tap'); setWorldGateOpen(true); }} aria-label={`세계의 문 진행도 ${completedRelics} / ${WORLD_GATE_REQUIRED_RELICS}`}>
        <strong>세계의 문</strong>
        <span aria-hidden="true">{adventureRegions.map((region) => <i key={region.id} className={regionProgress[region.id].relic.completed ? 'is-active' : ''}>◆</i>)}</span>
        <small>{completedRelics} / {WORLD_GATE_REQUIRED_RELICS}</small>
      </button>

      {selectedRegion && (
        <RegionDetailModal
          key={selectedRegion.id}
          region={selectedRegion}
          stageProgress={stageProgress}
          coins={coins}
          onClose={() => setSelectedRegionId(null)}
          onStart={(stageNumber) => {
            if (!selectedRegion.gameId) return;
            playSound('ui_button_tap');
            onStartGame(selectedRegion.gameId, stageNumber);
          }}
        />
      )}
      {worldGateOpen && <WorldGateModal progress={regionProgress} completedCount={completedRelics} onClose={() => setWorldGateOpen(false)} />}
    </section>
  );
}

function AdventureRegionHotspot({ region, progress, onSelect }: { key?: string; region: AdventureRegion; progress: { dexFound: number; dexTotal: number; relic: RegionRelicProgress }; onSelect: (regionId: AdventureRegionId) => void }) {
  const statusLabel = region.status === 'open' ? '입장하기' : region.unavailableLabel;
  return (
    <div
      style={{ left: `${region.position.left}%`, top: `${region.position.top}%` }}
      className="adventure-region-hotspot-anchor absolute z-10"
    >
      <button
        type="button"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          event.stopPropagation();
          if (import.meta.env.DEV) console.debug('[Adventure hotspot] pointerdown', region.id, event.currentTarget.getBoundingClientRect());
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (import.meta.env.DEV) console.debug('[Adventure hotspot] click', region.id, event.detail, event.currentTarget.getBoundingClientRect());
          playSound('ui_button_tap');
          onSelect(region.id);
        }}
        className={`adventure-region-hotspot adventure-region-hotspot--${region.status}`}
        aria-label={`${region.name} 상세 정보 열기`}
      >
        <span className="adventure-region-hotspot__dot" aria-hidden="true" />
        <span className="adventure-region-hotspot__label">
          <strong>{region.name}</strong>
          <small>도감 {progress.dexFound}/{progress.dexTotal} · 유물 {progress.relic.fragments}/{REGION_RELIC_FRAGMENT_GOAL}</small>
          <small>{progress.relic.completed ? '완료' : <>{region.status === 'locked' && <LockKeyhole aria-hidden="true" />} {statusLabel}</>}</small>
        </span>
      </button>
    </div>
  );
}

function WorldGateModal({ progress, completedCount, onClose }: { progress: Record<AdventureRegionId, { relic: RegionRelicProgress }>; completedCount: number; onClose: () => void }) {
  return createPortal(
    <div className="world-gate-modal fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="world-gate-title" className="world-gate-modal__panel">
        <button type="button" onClick={onClose} className="world-gate-modal__close" aria-label="세계의 문 닫기"><X /></button>
        <h2 id="world-gate-title">세계의 문</h2>
        <p>지역 유물을 모두 모으면<br />새로운 세계로 가는 문이 열려요!</p>
        <ul>
          {adventureRegions.map((region) => <li key={region.id}><span>{region.name}</span><strong>{progress[region.id].relic.completed ? '완료' : '미완료'}</strong></li>)}
        </ul>
        <div className="world-gate-modal__count">현재: {completedCount} / {WORLD_GATE_REQUIRED_RELICS}</div>
        <button type="button" className="world-gate-modal__confirm" onClick={onClose}>확인</button>
      </section>
    </div>,
    document.body,
  );
}

function RegionDetailModal({ region, coins, onClose, onStart, stageProgress }: { key?: string; region: AdventureRegion; coins: number; onClose: () => void; onStart: (stageNumber: AdventureStageNumber) => void; stageProgress: AdventureStageProgress }) {
  const [selectedStage, setSelectedStage] = useState<AdventureStageNumber>(1);
  const canPlay = canPlayAdventureStage(stageProgress, region.id, selectedStage);
  const entryCost = region.entryCost ?? 0;
  const isOpen = region.status === 'open' && Boolean(region.gameId);
  const canAfford = coins >= entryCost;
  const remainingCoins = Math.max(0, coins - entryCost);

  return createPortal(
    <div className="adventure-region-modal fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="adventure-region-title" className={`adventure-region-modal__panel relative overflow-hidden rounded-[1.75rem] border-4 border-amber-200 bg-[#fff3ce] shadow-2xl ${region.id === 'lavaValley' ? 'adventure-region-modal__panel--stage-cards' : ''}`}>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-slate-700 text-white shadow-md" aria-label="상세 창 닫기"><X /></button>
        <img src={region.poster} alt={`${region.name} 포스터`} className="adventure-region-modal__poster object-contain" draggable={false} />
        <div className="adventure-region-modal__body text-center">
          <h2 id="adventure-region-title" className="text-2xl font-black text-amber-950">{region.name}</h2>
          <p className="mt-1 text-sm font-bold text-amber-800">{region.description}</p>
          <div className="adventure-stage-options" role="group" aria-label={`${region.name} Stage 선택`}>
            {ADVENTURE_STAGE_CATALOG[region.id].map((stage) => {
              const state = getAdventureStageState(stageProgress, region.id, stage.stageNumber);
              const enabled = isOpen && canPlayAdventureStage(stageProgress, region.id, stage.stageNumber);
              const label = state === 'locked' ? 'LOCKED · 잠김' : state === 'completed' ? '완료 · 다시 선택' : state === 'new' ? 'NEW' : '선택 가능';
              const isSelected = selectedStage === stage.stageNumber;
              const card = region.id === 'lavaValley' ? lavaValleyStageSelectAssets.cards[stage.stageNumber] : null;
              const showLocked = state === 'locked' || !stage.implemented;
              return <button key={stage.id} type="button" disabled={!enabled} aria-pressed={isSelected} aria-label={`Stage ${stage.stageNumber} · ${stage.name} · ${label}${!stage.implemented ? ' · 준비 중' : ` · ${stage.playTime}초`}`} onClick={() => setSelectedStage(stage.stageNumber)} className={`adventure-stage-option ${card ? 'adventure-stage-option--card' : ''}`}>
                {card && <span className="adventure-stage-card__visual">
                  <img className="adventure-stage-card__image" src={card} alt="" width="1086" height="1448" aria-hidden="true" draggable={false} />
                  {isSelected && <img className="adventure-stage-card__frame" src={lavaValleyStageSelectAssets.selectedFrame} alt="" width="1086" height="1448" aria-hidden="true" draggable={false} />}
                  {showLocked && <img className="adventure-stage-card__locked" src={lavaValleyStageSelectAssets.lockedOverlay} alt="" width="1086" height="1448" aria-hidden="true" draggable={false} />}
                  {state === 'completed' && <img className="adventure-stage-card__badge adventure-stage-card__badge--completed" src={lavaValleyStageSelectAssets.completedBadge} alt="완료" width="1254" height="1254" draggable={false} />}
                  {state === 'new' && <img className="adventure-stage-card__badge adventure-stage-card__badge--new" src={lavaValleyStageSelectAssets.newBadge} alt="새로 해금" width="1448" height="1086" draggable={false} />}
                  {isSelected && <img className="adventure-stage-card__selected" src={lavaValleyStageSelectAssets.selectedButton} alt="선택됨" width="2172" height="724" draggable={false} />}
                </span>}
                <strong className={card ? 'sr-only' : undefined}>Stage {stage.stageNumber} · {stage.name}</strong>
                <span className={card ? 'sr-only' : undefined}>{stage.description}</span>
                <small className={card ? 'adventure-stage-card__time' : undefined}>{card ? (!stage.implemented ? `${stage.playTime}초 예정` : `${stage.playTime}초`) : `${label}${!stage.implemented ? ' · 준비 중' : ` · ${stage.playTime}초`}`}</small>
              </button>;
            })}
          </div>

          {isOpen ? (
            <>
              <div className="adventure-entry-summary relative mt-3">
                <img src={adventureMapAssets.entryCoinBanner} alt="" className="block w-full object-contain" draggable={false} />
                <strong className="adventure-entry-summary__value absolute flex items-center justify-center">{entryCost === 0 ? '무료' : entryCost.toLocaleString()}</strong>
              </div>
              <div className="adventure-region-summary mt-2 grid grid-cols-3 rounded-2xl bg-white/75 text-xs font-black text-amber-900">
                <span>현재 코인<strong className="block text-base">{coins.toLocaleString()}</strong></span>
                <span>입장 비용<strong className="block text-base">{entryCost === 0 ? '무료' : entryCost.toLocaleString()}</strong></span>
                <span>입장 후<strong className="block text-base text-emerald-700">{remainingCoins.toLocaleString()}</strong></span>
              </div>
              {!canAfford && <p className="mt-2 font-black text-red-600">코인이 {(entryCost - coins).toLocaleString()}개 부족해요.</p>}
              <div className="adventure-region-modal__footer mt-3 grid grid-cols-[1fr_1.4fr] items-center gap-3">
                <button type="button" onClick={onClose} className="min-h-12 rounded-2xl bg-white font-black text-amber-900 shadow-[0_4px_0_#d6b77a]">취소</button>
                <button type="button" disabled={!canAfford || !canPlay} onClick={() => onStart(selectedStage)} aria-label={`Stage ${selectedStage} 모험 시작`} className="adventure-start-button disabled:cursor-not-allowed disabled:grayscale">
                  <img src={adventureMapAssets.startButton} alt="모험 시작" className="block w-full object-contain" draggable={false} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-3 rounded-2xl bg-slate-700 px-4 py-3 font-black text-white">{region.status === 'comingSoon' ? '준비 중' : '🔒 잠김'}</div>
              <div className="adventure-region-modal__footer mt-3 grid grid-cols-2 items-center gap-3">
                <button type="button" onClick={onClose} className="min-h-12 rounded-2xl bg-white font-black text-amber-900 shadow-[0_4px_0_#d6b77a]">취소</button>
                <button type="button" disabled className="min-h-12 cursor-not-allowed rounded-2xl bg-slate-500 font-black text-white opacity-80">{region.status === 'comingSoon' ? '준비 중' : '잠겨 있음'}</button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
