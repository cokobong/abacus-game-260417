import { BookOpen, Heart, LockKeyhole, Map, Sparkles, Star, Trees, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { dinosaurSpecies, dexTargetSpeciesCount, type DinosaurHabitatId, type DinosaurSpecies } from '../../data/dinosaurSpecies';
import type { OwnedDinosaur } from '../../types/game';

export interface DexScreenProps {
  ownedDinosaurs: OwnedDinosaur[];
  discoveredSpeciesIds: string[];
  onViewOwnedDinosaur: (speciesId: string) => void;
}

type DexHabitatFilter = DinosaurHabitatId | 'all';

const habitatMeta: Record<DexHabitatFilter, { label: string; shortLabel: string; description: string; tone: string }> = {
  all: {
    label: '전체 스티커북',
    shortLabel: '전체',
    description: '만난 공룡과 아직 숨어 있는 공룡을 한눈에 볼 수 있어요.',
    tone: 'from-amber-100 to-lime-100 text-emerald-950',
  },
  'green-forest': {
    label: '초록 숲 친구들',
    shortLabel: '초록 숲',
    description: '나뭇잎 사이에서 조용히 반짝이는 공룡들이 살아요.',
    tone: 'from-lime-100 to-emerald-100 text-emerald-950',
  },
  'sparkle-cave': {
    label: '반짝 동굴 친구들',
    shortLabel: '반짝 동굴',
    description: '수정빛 동굴에서 특별한 친구들이 기다려요.',
    tone: 'from-sky-100 to-violet-100 text-violet-950',
  },
  'volcano-island': {
    label: '화산섬 친구들',
    shortLabel: '화산섬',
    description: '따뜻한 돌길과 붉은 흙 위를 걷는 든든한 공룡들이에요.',
    tone: 'from-orange-100 to-rose-100 text-orange-950',
  },
  'secret-land': {
    label: '비밀의 땅',
    shortLabel: '비밀',
    description: '아직 이름 모를 발자국이 남아 있는 신비한 곳이에요.',
    tone: 'from-slate-100 to-cyan-100 text-slate-800',
  },
};

const habitatOrder: DexHabitatFilter[] = ['all', 'green-forest', 'sparkle-cave', 'volcano-island', 'secret-land'];

const rarityLabels: Record<OwnedDinosaur['rarity'], string> = {
  common: '일반',
  rare: '희귀',
  epic: '영웅',
  special: '특별',
  legendary: '전설',
};

export function DexScreen({ ownedDinosaurs, discoveredSpeciesIds, onViewOwnedDinosaur }: DexScreenProps) {
  const [activeHabitat, setActiveHabitat] = useState<DexHabitatFilter>('all');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const uniqueOwnedDinosaurs = useMemo(() => getUniqueOwnedDinosaurs(ownedDinosaurs), [ownedDinosaurs]);
  const ownedBySpecies = useMemo(() => getOwnedDinosaurBySpecies(uniqueOwnedDinosaurs), [uniqueOwnedDinosaurs]);
  const discoveredSpeciesSet = useMemo(() => new Set([...discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId)]), [discoveredSpeciesIds, uniqueOwnedDinosaurs]);
  const discoveredCount = dinosaurSpecies.filter((species) => isSpeciesDiscovered(species, discoveredSpeciesSet)).length;
  const selectedSpecies = selectedSpeciesId ? dinosaurSpecies.find((species) => species.speciesId === selectedSpeciesId) ?? null : null;
  const visibleHabitats = activeHabitat === 'all' ? habitatOrder.filter((habitat) => habitat !== 'all') : [activeHabitat];

  return (
    <div className="grid gap-5">
      <DexProgressHeader discoveredCount={discoveredCount} totalCount={dexTargetSpeciesCount} />
      <DexHabitatTabs activeHabitat={activeHabitat} discoveredSpeciesSet={discoveredSpeciesSet} onHabitat={setActiveHabitat} />

      <div className="grid gap-5">
        {visibleHabitats.map((habitat) => (
          <DexHabitatSection key={habitat} habitat={habitat} discoveredSpeciesSet={discoveredSpeciesSet} ownedBySpecies={ownedBySpecies} onSelectSpecies={setSelectedSpeciesId} />
        ))}
      </div>

      <DeveloperDexDebugPanel ownedDinosaurs={ownedDinosaurs} discoveredSpeciesIds={discoveredSpeciesIds} />

      {selectedSpecies && (
        <DexDetailModal
          species={selectedSpecies}
          ownedDinosaur={ownedBySpecies[selectedSpecies.speciesId]}
          isDiscovered={isSpeciesDiscovered(selectedSpecies, discoveredSpeciesSet)}
          onClose={() => setSelectedSpeciesId(null)}
          onViewOwnedDinosaur={onViewOwnedDinosaur}
        />
      )}
    </div>
  );
}

function DexProgressHeader({ discoveredCount, totalCount }: { discoveredCount: number; totalCount: number }) {
  const progressPercent = Math.round((discoveredCount / totalCount) * 100);
  const nextGoal = discoveredCount >= totalCount ? '도감을 모두 채웠어요!' : `${Math.min(totalCount, discoveredCount + 2)}마리를 만나면 다음 페이지가 더 풍성해져요.`;

  return (
    <section className="overflow-hidden rounded-[34px] border-4 border-white bg-[linear-gradient(135deg,#f7e7bd,#d8f3c8_48%,#c7e8ff)] p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-black text-emerald-800">
            <BookOpen className="h-4 w-4" />
            공룡 스티커북
          </p>
          <h3 className="mt-3 text-4xl font-black text-emerald-950">공룡 도감</h3>
          <p className="mt-2 font-black text-emerald-800">공룡 친구들을 만나고 전시장을 채워보세요!</p>
        </div>
        <div className="rounded-[26px] border-4 border-white bg-white/88 px-5 py-4 text-center shadow-sm">
          <p className="text-sm font-black text-slate-500">만난 공룡</p>
          <p className="text-3xl font-black text-emerald-950">{discoveredCount} / {totalCount}</p>
        </div>
      </div>
      <div className="mt-5 rounded-full border-4 border-white bg-white/70 p-1">
        <div className="h-5 rounded-full bg-gradient-to-r from-lime-400 via-emerald-400 to-sky-400 transition-all" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="mt-3 rounded-[20px] bg-white/74 px-4 py-3 text-sm font-black text-emerald-900">{nextGoal}</p>
    </section>
  );
}

function DexHabitatTabs({
  activeHabitat,
  discoveredSpeciesSet,
  onHabitat,
}: {
  activeHabitat: DexHabitatFilter;
  discoveredSpeciesSet: Set<string>;
  onHabitat: (habitat: DexHabitatFilter) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-[28px] border-4 border-white bg-white/74 p-2 shadow-sm">
      {habitatOrder.map((habitat) => {
        const meta = habitatMeta[habitat];
        const speciesInHabitat = habitat === 'all' ? dinosaurSpecies : dinosaurSpecies.filter((species) => species.habitat === habitat);
        const discoveredCount = speciesInHabitat.filter((species) => isSpeciesDiscovered(species, discoveredSpeciesSet)).length;
        const isActive = habitat === activeHabitat;

        return (
          <button
            key={habitat}
            onClick={() => onHabitat(habitat)}
            className={`min-h-14 shrink-0 rounded-[18px] px-4 text-left text-sm font-black transition active:translate-y-1 ${
              isActive ? 'bg-emerald-500 text-white shadow-[0_4px_0_#059669]' : 'bg-white/84 text-slate-600 hover:bg-lime-50'
            }`}
          >
            <span className="block">{meta.shortLabel}</span>
            <span className={`text-xs ${isActive ? 'text-white/84' : 'text-slate-400'}`}>{discoveredCount}/{speciesInHabitat.length}</span>
          </button>
        );
      })}
    </div>
  );
}

function DexHabitatSection({
  habitat,
  discoveredSpeciesSet,
  ownedBySpecies,
  onSelectSpecies,
}: {
  habitat: DinosaurHabitatId;
  discoveredSpeciesSet: Set<string>;
  ownedBySpecies: Record<string, OwnedDinosaur | undefined>;
  onSelectSpecies: (speciesId: string) => void;
}) {
  const meta = habitatMeta[habitat];
  const speciesList = dinosaurSpecies.filter((species) => species.habitat === habitat);

  return (
    <section className={`rounded-[34px] border-4 border-white bg-gradient-to-br ${meta.tone} p-4 shadow-lg`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="inline-flex items-center gap-2 text-2xl font-black">
            <Map className="h-5 w-5" />
            {meta.label}
          </h4>
          <p className="mt-1 text-sm font-black opacity-75">{meta.description}</p>
        </div>
        <span className="rounded-full bg-white/82 px-4 py-2 text-sm font-black shadow-sm">
          {speciesList.filter((species) => isSpeciesDiscovered(species, discoveredSpeciesSet)).length}/{speciesList.length} 발견
        </span>
      </div>
      <DexStickerGrid speciesList={speciesList} discoveredSpeciesSet={discoveredSpeciesSet} ownedBySpecies={ownedBySpecies} onSelectSpecies={onSelectSpecies} />
    </section>
  );
}

function DexStickerGrid({
  speciesList,
  discoveredSpeciesSet,
  ownedBySpecies,
  onSelectSpecies,
}: {
  speciesList: DinosaurSpecies[];
  discoveredSpeciesSet: Set<string>;
  ownedBySpecies: Record<string, OwnedDinosaur | undefined>;
  onSelectSpecies: (speciesId: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {speciesList.map((species) => (
        <DexDinosaurCard key={species.speciesId} species={species} isDiscovered={isSpeciesDiscovered(species, discoveredSpeciesSet)} ownedDinosaur={ownedBySpecies[species.speciesId]} onSelect={() => onSelectSpecies(species.speciesId)} />
      ))}
    </div>
  );
}

function DexDinosaurCard({ species, isDiscovered, ownedDinosaur, onSelect }: { species: DinosaurSpecies; isDiscovered: boolean; ownedDinosaur?: OwnedDinosaur; onSelect: () => void }) {
  const isPlaceholder = Boolean(species.isPlaceholder);

  return (
    <button
      onClick={onSelect}
      className={`relative min-h-72 overflow-hidden rounded-[30px] border-4 p-4 text-left shadow-lg transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 ${
        isDiscovered ? 'border-white bg-white/90 text-emerald-950' : isPlaceholder ? 'border-slate-200 bg-slate-100/82 text-slate-500' : 'border-white/70 bg-slate-100/86 text-slate-500'
      }`}
    >
      <div className="absolute right-4 top-4 rounded-full bg-white/86 px-3 py-1 text-xs font-black shadow-sm">{isDiscovered ? '발견 완료' : isPlaceholder ? species.lockedLabel ?? '준비 중' : '미발견'}</div>
      <div className={`mb-4 flex h-40 items-center justify-center rounded-[26px] border-4 border-white ${isDiscovered ? 'bg-gradient-to-b from-sky-100 via-lime-100 to-amber-100' : 'bg-gradient-to-b from-slate-200 to-slate-300'}`}>
        {isDiscovered ? <DexDinoAvatar species={species} size="card" /> : <DexSilhouette species={species} />}
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-black">{isDiscovered ? species.displayName : '???'}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${isDiscovered ? 'bg-amber-100 text-amber-800' : 'bg-white/74 text-slate-400'}`}>{isDiscovered ? rarityLabels[species.rarity] : isPlaceholder ? '준비 중' : '힌트'}</span>
      </div>
      <p className="mt-3 min-h-14 text-sm font-black leading-relaxed opacity-75">{isDiscovered ? species.dexDescription : isPlaceholder ? species.unlockHint : '아직 만나지 못했어요. 카드를 눌러 힌트를 볼 수 있어요.'}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${isDiscovered ? 'bg-lime-100 text-lime-800' : 'bg-white/80 text-slate-400'}`}>
          {isDiscovered ? <Heart className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
          {isDiscovered ? ownedDinosaur?.name ?? species.displayName : isPlaceholder ? '잠금' : '실루엣'}
        </span>
        {isDiscovered && <Star className="h-6 w-6 fill-amber-300 text-amber-400" />}
      </div>
    </button>
  );
}

function DexDetailModal({
  species,
  ownedDinosaur,
  isDiscovered,
  onClose,
  onViewOwnedDinosaur,
}: {
  species: DinosaurSpecies;
  ownedDinosaur?: OwnedDinosaur;
  isDiscovered: boolean;
  onClose: () => void;
  onViewOwnedDinosaur: (speciesId: string) => void;
}) {
  const isPlaceholder = Boolean(species.isPlaceholder);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 pb-[calc(112px+env(safe-area-inset-bottom))] pt-5 backdrop-blur-sm">
      <section className="grid max-h-full min-h-0 w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[32px] border-4 border-white bg-gradient-to-b from-white via-lime-50 to-sky-50 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="flex justify-end px-4 pt-4">
          <button aria-label="닫기" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-slate-900 text-white transition active:translate-y-1">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="grid min-h-0 gap-4 overflow-y-auto px-5 pb-4 text-center">
          <div className={`mx-auto flex h-52 w-full max-w-sm items-center justify-center rounded-[30px] border-4 border-white ${isDiscovered ? 'bg-gradient-to-b from-sky-100 via-lime-100 to-amber-100' : 'bg-gradient-to-b from-slate-200 to-slate-300'}`}>
            {isDiscovered ? <DexDinoAvatar species={species} size="modal" /> : <DexSilhouette species={species} large />}
          </div>
          <div>
            <p className="text-sm font-black text-emerald-700">{isDiscovered ? `${rarityLabels[species.rarity]} · ${habitatMeta[species.habitat].shortLabel}` : isPlaceholder ? `${species.lockedLabel ?? '준비 중'} · ${habitatMeta[species.habitat].shortLabel}` : '아직 비어 있는 스티커 자리'}</p>
            <h3 className="mt-1 text-4xl font-black text-emerald-950">{isDiscovered ? species.displayName : '???'}</h3>
          </div>
          {isDiscovered ? (
            <>
              <p className="rounded-[22px] border-4 border-white bg-white/90 px-4 py-3 text-lg font-black leading-relaxed text-emerald-900 shadow-sm">{species.dexDescription}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <DexInfoPill label="성격" value={species.personality} />
                <DexInfoPill label="좋아하는 먹이" value={species.favoriteFoodName} />
                <DexInfoPill label="만난 방법" value={species.foundMethodLabel} />
                <DexInfoPill label="만난 날" value={ownedDinosaur ? formatDate(ownedDinosaur.obtainedAt) : '기록 준비 중'} />
              </div>
            </>
          ) : isPlaceholder ? (
            <div className="grid gap-3">
              <p className="rounded-[22px] border-4 border-white bg-white/90 px-4 py-3 text-lg font-black text-slate-600 shadow-sm">아직 준비 중인 도감 자리예요.</p>
              <p className="rounded-[22px] bg-slate-100 px-4 py-3 text-base font-black leading-relaxed text-slate-700">힌트: {species.discoveryHint} {species.unlockHint}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              <p className="rounded-[22px] border-4 border-white bg-white/90 px-4 py-3 text-lg font-black text-slate-600 shadow-sm">아직 만나지 못한 공룡이에요.</p>
              <p className="rounded-[22px] bg-sky-100 px-4 py-3 text-base font-black leading-relaxed text-sky-900">힌트: {species.discoveryHint} 알을 더 부화시키면 만날 수 있을지도 몰라요!</p>
            </div>
          )}
        </div>
        <div className="grid gap-3 border-t-4 border-white bg-white/90 p-4 text-center">
          {isDiscovered && ownedDinosaur && (
            <button
              onClick={() => onViewOwnedDinosaur(species.speciesId)}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[22px] border-4 border-white bg-gradient-to-b from-emerald-400 to-emerald-600 px-8 text-lg font-black text-white shadow-[0_6px_0_#059669] transition active:translate-y-1 active:shadow-none"
            >
              <Trees className="h-6 w-6" />
              우리 공룡으로 보기
            </button>
          )}
          <button onClick={onClose} className="min-h-12 rounded-[18px] bg-slate-100 px-6 text-sm font-black text-slate-600 transition active:translate-y-1">닫기</button>
        </div>
      </section>
    </div>
  );
}

function DexInfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-white/90 px-4 py-3 text-left shadow-sm">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-emerald-950">{value}</p>
    </div>
  );
}

function DexDinoAvatar({ species, size }: { species: DinosaurSpecies; size: 'card' | 'modal' }) {
  const scale = size === 'modal' ? 'h-40 w-44' : 'h-28 w-32';

  return (
    <div className={`relative ${scale}`}>
      <div className="absolute bottom-[12%] left-1/2 h-[58%] w-[68%] -translate-x-1/2 rounded-[45%] border-4 border-emerald-200 bg-emerald-400" />
      <div className="absolute bottom-[55%] left-[56%] h-[32%] w-[34%] rounded-[45%] border-4 border-emerald-200 bg-emerald-300" />
      <div className="absolute bottom-[74%] left-[65%] h-[8%] w-[8%] rounded-full bg-slate-900" />
      <div className="absolute bottom-[58%] left-[4%] h-[16%] w-[40%] -rotate-12 rounded-full bg-emerald-500" />
      <div className="absolute bottom-[3%] left-[34%] h-[18%] w-[13%] rounded-full bg-emerald-500" />
      <div className="absolute bottom-[3%] right-[30%] h-[18%] w-[13%] rounded-full bg-emerald-500" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-emerald-800 shadow-sm">{species.silhouette}</div>
    </div>
  );
}

function DexSilhouette({ species, large = false }: { species: DinosaurSpecies; large?: boolean }) {
  return (
    <div className={`${large ? 'h-36 w-36 text-6xl' : 'h-24 w-24 text-5xl'} flex items-center justify-center rounded-full border-4 border-white bg-slate-400 font-black text-white shadow-inner`}>
      {species.silhouette}
    </div>
  );
}

function DeveloperDexDebugPanel({ ownedDinosaurs, discoveredSpeciesIds }: { ownedDinosaurs: OwnedDinosaur[]; discoveredSpeciesIds: string[] }) {
  return (
    <details className="rounded-[26px] border-4 border-dashed border-slate-200 bg-white/62 px-4 py-3">
      <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용: 도감 데이터</summary>
      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500">
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(ownedDinosaurs, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(discoveredSpeciesIds, null, 2)}</pre>
        <pre className="max-h-44 overflow-auto rounded-[18px] bg-white/80 px-3 py-2">{JSON.stringify(dinosaurSpecies, null, 2)}</pre>
      </div>
    </details>
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

function isSpeciesDiscovered(species: DinosaurSpecies, discoveredSpeciesSet: Set<string>) {
  return !species.isPlaceholder && discoveredSpeciesSet.has(species.speciesId);
}

function getOwnedDinosaurBySpecies(ownedDinosaurs: OwnedDinosaur[]) {
  return ownedDinosaurs.reduce<Record<string, OwnedDinosaur | undefined>>((bySpecies, dinosaur) => {
    bySpecies[dinosaur.speciesId] = dinosaur;
    return bySpecies;
  }, {});
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(timestamp));
}
