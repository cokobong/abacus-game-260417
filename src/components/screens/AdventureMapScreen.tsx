import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LockKeyhole, X } from 'lucide-react';
import { adventureMapAssets } from '../../assets/adventure';
import { ADVENTURE_REGIONS, adventureRegions, type AdventureRegion, type AdventureRegionId } from '../../data/adventureRegions';
import { playSound } from '../../audio/audioManager';

export interface AdventureMapScreenProps {
  coins: number;
  onStartGame: (gameId: string) => void;
}

export function AdventureMapScreen({ coins, onStartGame }: AdventureMapScreenProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<AdventureRegionId | null>(null);
  const selectedRegion = selectedRegionId ? ADVENTURE_REGIONS[selectedRegionId] : null;
  const openRegionModal = (regionId: AdventureRegionId) => setSelectedRegionId(regionId);

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
          <AdventureRegionHotspot key={region.id} region={region} onSelect={openRegionModal} />
        ))}
      </div>

      <img className="adventure-map-title pointer-events-none absolute left-1/2 top-[1.5%] z-20 w-[min(72%,31rem)] -translate-x-1/2 object-contain" src={adventureMapAssets.titleBanner} alt="모험 지도" draggable={false} />

      {selectedRegion && (
        <RegionDetailModal
          region={selectedRegion}
          coins={coins}
          onClose={() => setSelectedRegionId(null)}
          onStart={() => {
            if (!selectedRegion.gameId) return;
            playSound('ui_button_tap');
            onStartGame(selectedRegion.gameId);
          }}
        />
      )}
    </section>
  );
}

function AdventureRegionHotspot({ region, onSelect }: { key?: string; region: AdventureRegion; onSelect: (regionId: AdventureRegionId) => void }) {
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
          <small>{region.status === 'locked' && <LockKeyhole aria-hidden="true" />} {statusLabel}</small>
        </span>
      </button>
    </div>
  );
}

function RegionDetailModal({ region, coins, onClose, onStart }: { region: AdventureRegion; coins: number; onClose: () => void; onStart: () => void }) {
  const entryCost = region.entryCost ?? 0;
  const isOpen = region.status === 'open' && Boolean(region.gameId);
  const canAfford = coins >= entryCost;
  const remainingCoins = Math.max(0, coins - entryCost);

  return createPortal(
    <div className="adventure-region-modal fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="adventure-region-title" className="adventure-region-modal__panel relative overflow-hidden rounded-[1.75rem] border-4 border-amber-200 bg-[#fff3ce] shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-slate-700 text-white shadow-md" aria-label="상세 창 닫기"><X /></button>
        <img src={region.poster} alt={`${region.name} 포스터`} className="adventure-region-modal__poster object-contain" draggable={false} />
        <div className="adventure-region-modal__body text-center">
          <h2 id="adventure-region-title" className="text-2xl font-black text-amber-950">{region.name}</h2>
          <p className="mt-1 text-sm font-bold text-amber-800">{region.description}</p>

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
                <button type="button" disabled={!canAfford} onClick={onStart} className="adventure-start-button disabled:cursor-not-allowed disabled:grayscale">
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
