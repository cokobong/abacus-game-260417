import { LockKeyhole, Play } from 'lucide-react';
import adventureMapBg from '../../assets/adventure/lava-valley/background/adventure_map_bg.png';
import { adventureRegions, type AdventureRegion } from '../../data/adventureRegions';
import { playSound } from '../../audio/audioManager';

export interface AdventureMapScreenProps {
  onStartGame: (gameId: string) => void;
}

export function AdventureMapScreen({ onStartGame }: AdventureMapScreenProps) {
  return (
    <section className="adventure-map-screen relative h-full min-h-0 w-full overflow-hidden">
      <img src={adventureMapBg} alt="용암 계곡과 하늘섬, 숫자 유적이 있는 탐험 지도" className="absolute inset-0 h-full w-full object-cover object-center" draggable={false} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-100/10 via-transparent to-emerald-950/10" />

      <header className="adventure-map-title absolute left-1/2 top-[2.5%] z-10 w-[min(88%,590px)] -translate-x-1/2 rounded-[22px] border-4 border-[#9a6632] bg-[#fff1c7]/95 px-4 py-2 text-center shadow-[0_6px_0_#75451f,0_12px_24px_rgba(61,35,16,.22)]">
        <h1 className="text-[clamp(1.05rem,3.5vw,1.55rem)] font-black text-amber-950">탐험할 지역을 골라요</h1>
        <p className="mt-0.5 text-[clamp(.65rem,1.8vw,.85rem)] font-black text-emerald-800">공룡과 함께 새로운 장소를 탐험해 보세요!</p>
      </header>

      {adventureRegions.map((region) => (
        <AdventureRegionMarker key={region.id} region={region} onStartGame={onStartGame} />
      ))}
    </section>
  );
}

function AdventureRegionMarker({ region, onStartGame }: { key?: string; region: AdventureRegion; onStartGame: (gameId: string) => void }) {
  const available = region.status === 'available' && Boolean(region.gameId);

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => {
        if (!region.gameId) return;
        playSound('ui_button_tap');
        onStartGame(region.gameId);
      }}
      style={{ left: `${region.position.x}%`, top: `${region.position.y}%` }}
      className={`adventure-region-marker absolute z-10 -translate-x-1/2 -translate-y-1/2 text-center ${available ? 'adventure-region-marker--available' : 'adventure-region-marker--locked'}`}
      aria-label={available ? `${region.name} 모험 시작` : `${region.name} 준비 중`}
    >
      <span className="block text-[clamp(.8rem,2.8vw,1.05rem)] font-black leading-tight">{region.name}</span>
      {available ? (
        <>
          <span className="adventure-region-description mt-1 block text-[clamp(.58rem,1.7vw,.72rem)] font-bold leading-tight">{region.description}</span>
          <span className="mt-1.5 inline-flex min-h-8 items-center justify-center gap-1 rounded-full bg-gradient-to-b from-yellow-300 to-amber-400 px-3 text-[clamp(.62rem,1.8vw,.78rem)] font-black text-amber-950 shadow-[0_3px_0_#b45309]">
            <Play className="h-3.5 w-3.5 fill-current" /> 모험 시작
          </span>
        </>
      ) : (
        <span className="mt-1 inline-flex min-h-8 items-center justify-center gap-1 rounded-full bg-slate-500/85 px-3 text-[clamp(.62rem,1.8vw,.78rem)] font-black text-white">
          <LockKeyhole className="h-3.5 w-3.5" /> 준비 중
        </span>
      )}
    </button>
  );
}
