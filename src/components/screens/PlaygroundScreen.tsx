import { Backpack, Coins, Compass, Egg, LockKeyhole, Map, Package, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { adventureAreas, type AdventureArea, type AdventureRewardCandidate } from '../../data/adventures';
import type { DinosaurState } from '../../types/game';
import type { AdventureRunResult } from '../../utils/adventureRewards';

type InventoryItemState = { itemId: string; quantity: number };
const showDeveloperPanels = false;

export interface PlaygroundScreenProps {
  activeDinosaur: DinosaurState | null;
  coins: number;
  inventory: InventoryItemState[];
  result: AdventureRunResult | null;
  feedback: string;
  onExplore: (areaId: string) => void;
  onCloseResult: () => void;
  onGoToDex: () => void;
  onGoToHatchery: () => void;
}

export function PlaygroundScreen({ activeDinosaur, coins, inventory, result, feedback, onExplore, onCloseResult, onGoToDex, onGoToHatchery }: PlaygroundScreenProps) {
  const [selectedAreaId, setSelectedAreaId] = useState(adventureAreas[0]?.id ?? '');
  const selectedArea = adventureAreas.find((area) => area.id === selectedAreaId) ?? adventureAreas[0];

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
      <AdventureHeader activeDinosaur={activeDinosaur} coins={coins} />
      <section className="grid min-h-0 gap-3 lg:grid-cols-[280px_1fr]">
        <div className="grid content-start gap-3">
          <ActiveDinoCompanionCard activeDinosaur={activeDinosaur} />
          <AdventurePrepCard feedback={feedback} />
        </div>
        <AdventureAreaGrid selectedAreaId={selectedArea?.id} coins={coins} onSelectArea={setSelectedAreaId} onExplore={onExplore} />
      </section>
      {showDeveloperPanels && <DeveloperAdventureDebugPanel activeDinosaur={activeDinosaur} inventory={inventory} result={result} selectedArea={selectedArea} />}

      {result && <AdventureResultModal result={result} onClose={onCloseResult} onGoToDex={onGoToDex} onGoToHatchery={onGoToHatchery} />}
    </div>
  );
}

function AdventureHeader({ activeDinosaur, coins }: { activeDinosaur: DinosaurState | null; coins: number }) {
  return (
    <section className="overflow-hidden rounded-[24px] border-4 border-white bg-[linear-gradient(135deg,#ccefd1,#d7f7ff_52%,#f7e7bd)] p-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/82 px-3 py-1.5 text-xs font-black text-emerald-800">
            <Compass className="h-4 w-4" />
            탐험 지도
          </p>
          <h3 className="mt-1 text-3xl font-black text-emerald-950">모험</h3>
        </div>
        <div className="grid gap-2 text-right">
          <p className="rounded-full border-4 border-white bg-white/88 px-3 py-1.5 text-xs font-black text-emerald-900 shadow-sm">{activeDinosaur ? `${activeDinosaur.name}와 함께` : '공룡 대기 중'}</p>
          <p className="inline-flex items-center justify-end gap-2 rounded-full border-4 border-white bg-amber-200 px-3 py-1.5 text-base font-black text-amber-950 shadow-sm">
            <Coins className="h-5 w-5 text-amber-600" />
            {coins.toLocaleString()}
          </p>
        </div>
      </div>
    </section>
  );
}

function ActiveDinoCompanionCard({ activeDinosaur }: { activeDinosaur: DinosaurState | null }) {
  return (
    <section className="rounded-[24px] border-4 border-white bg-white/86 p-3 shadow-lg">
      <p className="text-sm font-black text-emerald-700">오늘의 동행자</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-b from-lime-100 to-emerald-200 shadow-inner">
          <MiniDino />
        </div>
        <div>
          <h4 className="text-xl font-black text-emerald-950">{activeDinosaur?.name ?? '공룡 친구'}</h4>
          <p className="mt-1 text-xs font-black leading-relaxed text-slate-500">함께 다녀온 느낌을 주는 동행자예요.</p>
        </div>
      </div>
    </section>
  );
}

function AdventurePrepCard({ feedback }: { feedback: string }) {
  return (
    <section className="rounded-[24px] border-4 border-white bg-gradient-to-b from-amber-100 to-lime-100 p-3 shadow-lg">
      <p className="inline-flex items-center gap-2 rounded-full bg-white/82 px-3 py-1.5 text-xs font-black text-amber-800">
        <Backpack className="h-4 w-4" />
        모험 준비
      </p>
      <h4 className="mt-2 text-xl font-black text-emerald-950">훈련 뒤에는 더 멀리</h4>
      <p className="mt-1 text-xs font-black leading-relaxed text-emerald-800/80">탐험으로 조각과 도감 단서를 얻어요.</p>
      <p className="mt-2 rounded-[18px] bg-white/82 px-3 py-2 text-xs font-black text-emerald-900">{feedback}</p>
    </section>
  );
}

function AdventureAreaGrid({ selectedAreaId, coins, onSelectArea, onExplore }: { selectedAreaId?: string; coins: number; onSelectArea: (areaId: string) => void; onExplore: (areaId: string) => void }) {
  return (
    <section className="grid min-h-0 gap-3 md:grid-cols-3">
      {adventureAreas.map((area) => (
        <AdventureAreaCard key={area.id} area={area} isSelected={area.id === selectedAreaId} coins={coins} onSelect={() => onSelectArea(area.id)} onExplore={() => onExplore(area.id)} />
      ))}
    </section>
  );
}

function AdventureAreaCard({ area, isSelected, coins, onSelect, onExplore }: { key?: string; area: AdventureArea; isSelected: boolean; coins: number; onSelect: () => void; onExplore: () => void }) {
  const isReady = area.status === 'ready';
  const needsCoins = area.entryCost.type === 'coin' && coins < area.entryCost.amount;
  const disabled = !isReady || needsCoins || area.entryCost.type === 'ticket';

  return (
    <article className={`rounded-[24px] border-4 p-3 shadow-lg transition ${isSelected ? 'border-emerald-300 bg-white/94' : 'border-white bg-white/82'} ${!isReady ? 'text-slate-500' : 'text-emerald-950'}`}>
      <button onClick={onSelect} className="block w-full text-left">
        <div className={`mb-3 flex h-20 items-center justify-center rounded-[20px] border-4 border-white ${getAreaTone(area)}`}>
          {area.status === 'coming-soon' ? <LockKeyhole className="h-10 w-10" /> : <Map className="h-10 w-10" />}
        </div>
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xl font-black">{area.title}</h4>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black">{getStatusLabel(area)}</span>
        </div>
        <p className="mt-2 min-h-10 text-xs font-black leading-relaxed text-slate-500">{area.summary}</p>
        <p className="mt-2 rounded-[16px] bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800">입장 조건: {formatEntryCost(area)}</p>
        {area.entryNote && <p className="mt-1.5 rounded-[14px] bg-white/72 px-3 py-1.5 text-xs font-black text-slate-500">{area.entryNote}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {area.rewardCandidates.map((reward) => (
            <span key={`${area.id}-${reward.type}-${reward.itemId ?? reward.label}`} title={getRewardPurposeLabel(reward)} className="inline-flex items-center gap-1 rounded-full bg-white/86 px-3 py-1 text-xs font-black text-slate-600">
              <RewardIcon reward={reward} />
              {reward.label}
            </span>
          ))}
        </div>
      </button>
      <button
        disabled={disabled}
        onClick={onExplore}
        className="mt-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[18px] border-4 border-white bg-gradient-to-b from-emerald-400 to-emerald-600 px-5 text-base font-black text-white shadow-[0_5px_0_#059669] transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none"
      >
        <Compass className="h-5 w-5" />
        {getExploreButtonLabel(area, needsCoins)}
      </button>
    </article>
  );
}

function AdventureResultModal({ result, onClose, onGoToDex, onGoToHatchery }: { result: AdventureRunResult; onClose: () => void; onGoToDex: () => void; onGoToHatchery: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 pb-[calc(112px+env(safe-area-inset-bottom))] pt-5 backdrop-blur-sm">
      <section className="grid max-h-full min-h-0 w-full max-w-xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[32px] border-4 border-white bg-gradient-to-b from-white via-lime-50 to-sky-50 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="flex justify-end px-4 pt-4">
          <button aria-label="닫기" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-slate-900 text-white transition active:translate-y-1">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="grid min-h-0 gap-4 overflow-y-auto px-5 pb-4 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[32px] border-4 border-white bg-gradient-to-b from-lime-100 to-emerald-200 shadow-inner">
            <Sparkles className="h-14 w-14 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-black text-emerald-700">{result.areaTitle}</p>
            <h3 className="mt-1 text-3xl font-black text-emerald-950">{result.message}</h3>
          </div>
          <p className="rounded-[22px] border-4 border-white bg-white/90 px-4 py-3 text-base font-black leading-relaxed text-emerald-900 shadow-sm">{result.companionMessage}</p>
          <div className="grid gap-2">
            {result.rewards.map((reward) => (
              <p key={`${reward.type}-${reward.itemId ?? reward.label}`} className="grid gap-1 rounded-[18px] bg-white/90 px-4 py-3 text-base font-black text-slate-700 shadow-sm">
                <span className="inline-flex items-center justify-center gap-2">
                <RewardIcon reward={reward} />
                {reward.label}
                </span>
                {reward.type === 'fragment' && <span className="text-xs text-violet-700">희귀알마다 필요한 조각 수가 달라요.</span>}
              </p>
            ))}
          </div>
          {result.hasDexHint && <p className="rounded-[20px] bg-sky-100 px-4 py-3 text-sm font-black text-sky-900">도감에 새로운 힌트가 추가되었어요! 지금은 메시지로 표시하고, 나중에 힌트 저장 상태와 연결할 수 있어요.</p>}
        </div>
        <div className="grid gap-2 border-t-4 border-white bg-white/90 p-4 sm:grid-cols-3">
          <button onClick={onGoToDex} className="min-h-14 rounded-[18px] bg-sky-100 px-4 text-sm font-black text-sky-800 transition active:translate-y-1">도감으로 이동</button>
          <button onClick={onGoToHatchery} className="min-h-14 rounded-[18px] bg-orange-100 px-4 text-sm font-black text-orange-800 transition active:translate-y-1">알 부화장으로 이동</button>
          <button onClick={onClose} className="min-h-14 rounded-[18px] bg-emerald-500 px-4 text-sm font-black text-white transition active:translate-y-1">계속 모험하기</button>
        </div>
      </section>
    </div>
  );
}

function DeveloperAdventureDebugPanel({ activeDinosaur, inventory, result, selectedArea }: { activeDinosaur: DinosaurState | null; inventory: InventoryItemState[]; result: AdventureRunResult | null; selectedArea?: AdventureArea }) {
  return (
    <details className="rounded-[26px] border-4 border-dashed border-slate-200 bg-white/62 px-4 py-3">
      <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용: 모험 데이터</summary>
      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500">
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(adventureAreas, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(selectedArea, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(result, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(inventory, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(activeDinosaur, null, 2)}</pre>
        <p className="rounded-[18px] bg-white/80 px-3 py-2">TODO: 모험 티켓은 훈련 보상과 연결할 때 별도 state로 추가합니다.</p>
        <p className="rounded-[18px] bg-white/80 px-3 py-2">TODO: 탐험하기 클릭 후 숲길/발자국/반짝 효과를 보여주는 3초 내외 애니메이션을 추가할 수 있습니다.</p>
      </div>
    </details>
  );
}

function MiniDino() {
  return (
    <div className="relative h-16 w-20">
      <div className="absolute bottom-1 left-4 h-10 w-12 rounded-[45%] border-4 border-emerald-200 bg-emerald-400" />
      <div className="absolute bottom-7 right-1 h-7 w-8 rounded-[45%] border-4 border-emerald-200 bg-emerald-300" />
      <div className="absolute bottom-12 right-3 h-1.5 w-1.5 rounded-full bg-slate-900" />
      <div className="absolute bottom-1 left-8 h-4 w-2 rounded-full bg-emerald-500" />
      <div className="absolute bottom-1 right-5 h-4 w-2 rounded-full bg-emerald-500" />
    </div>
  );
}

function RewardIcon({ reward }: { reward: AdventureRewardCandidate }) {
  if (reward.type === 'coin') return <Coins className="h-4 w-4 text-amber-600" />;
  if (reward.type === 'food') return <Backpack className="h-4 w-4 text-orange-500" />;
  if (reward.type === 'hatchItem') return <Egg className="h-4 w-4 text-orange-500" />;
  if (reward.type === 'fragment') return <Package className="h-4 w-4 text-violet-500" />;
  return <Sparkles className="h-4 w-4 text-sky-500" />;
}

function getAreaTone(area: AdventureArea) {
  if (area.status === 'coming-soon') return 'bg-gradient-to-b from-slate-100 to-slate-300 text-slate-500';
  if (area.habitat === 'sparkle-cave') return 'bg-gradient-to-b from-sky-100 to-violet-100 text-violet-700';
  if (area.habitat === 'cloud-hill') return 'bg-gradient-to-b from-sky-100 to-white text-sky-700';
  return 'bg-gradient-to-b from-lime-100 to-emerald-200 text-emerald-700';
}

function getStatusLabel(area: AdventureArea) {
  if (area.status === 'coming-soon') return '추후 공개';
  if (area.status === 'locked') return area.unlockLabel ?? '잠김';
  return '탐험 가능';
}

function formatEntryCost(area: AdventureArea) {
  if (area.status === 'coming-soon') return area.unlockLabel ?? '추후 공개';
  if (area.entryLabel) return area.entryLabel;
  if (area.entryCost.type === 'free') return '무료 탐험';
  if (area.entryCost.type === 'coin') return `${area.entryCost.amount}코인`;
  return `모험 티켓 ${area.entryCost.amount}개 (준비 중)`;
}

function getExploreButtonLabel(area: AdventureArea, needsCoins: boolean) {
  if (area.status === 'coming-soon') return '준비 중';
  if (area.entryCost.type === 'ticket') return '티켓 준비 중';
  if (needsCoins) return '코인 부족';
  return '탐험하기';
}

function getRewardPurposeLabel(reward: AdventureRewardCandidate) {
  if (reward.type === 'fragment') return '희귀 알 해금용 조각';
  if (reward.type === 'dexHint') return '도감 힌트';
  if (reward.type === 'hatchItem') return '알 부화장에서 사용하는 아이템';
  if (reward.type === 'food') return '우리 공룡 탭에서 줄 수 있는 먹이';
  return '상점에서 사용할 수 있는 코인';
}
