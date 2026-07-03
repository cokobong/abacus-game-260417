import { BookOpen, Egg, Heart, LockKeyhole, Map as MapIcon, Sparkles, Star, Trees, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { dexDinosaurImages, dexEggImages, dexHabitatImages, getDexSilhouetteImage } from '../../assets/dex';
import { dinosaurSpecies, dexTargetSpeciesCount, type DinosaurHabitatId, type DinosaurSpecies } from '../../data/dinosaurSpecies';
import type { OwnedDinosaur } from '../../types/game';
import { getGrowthStageLabel } from '../../utils/dinosaurGrowth';

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
const dexPageHabitats: DinosaurHabitatId[] = ['green-forest', 'sparkle-cave', 'volcano-island', 'secret-land'];
const showDeveloperPanels = false;

const rarityLabels: Record<OwnedDinosaur['rarity'], string> = {
  common: '일반',
  rare: '희귀',
  epic: '영웅',
  special: '특별',
  legendary: '전설',
};

export function DexScreen({ ownedDinosaurs, discoveredSpeciesIds, onViewOwnedDinosaur }: DexScreenProps) {
  const [activeHabitat, setActiveHabitat] = useState<DinosaurHabitatId>('green-forest');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const uniqueOwnedDinosaurs = useMemo(() => getUniqueOwnedDinosaurs(ownedDinosaurs), [ownedDinosaurs]);
  const ownedBySpecies = useMemo(() => getOwnedDinosaurBySpecies(uniqueOwnedDinosaurs), [uniqueOwnedDinosaurs]);
  const discoveredSpeciesSet = useMemo(() => new Set([...discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId)]), [discoveredSpeciesIds, uniqueOwnedDinosaurs]);
  const discoveredCount = dinosaurSpecies.filter((species) => isSpeciesDiscovered(species, discoveredSpeciesSet)).length;
  const selectedSpecies = selectedSpeciesId ? dinosaurSpecies.find((species) => species.speciesId === selectedSpeciesId) ?? null : null;

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.75),transparent_24%),linear-gradient(145deg,#f7efd6,#e8f4d8_48%,#dff5e9)] p-2 pb-4">
      <DexProgressHeader discoveredCount={discoveredCount} totalCount={dexTargetSpeciesCount} />

      <div className="grid min-h-0 gap-3 overflow-y-auto pb-4 lg:grid-cols-[210px_minmax(0,1fr)_250px] lg:overflow-hidden">
        <DexHabitatTabs activeHabitat={activeHabitat} discoveredSpeciesSet={discoveredSpeciesSet} onHabitat={setActiveHabitat} />
        <DexHabitatSection habitat={activeHabitat} discoveredSpeciesSet={discoveredSpeciesSet} ownedBySpecies={ownedBySpecies} onSelectSpecies={setSelectedSpeciesId} />
        <DexHintPanel activeHabitat={activeHabitat} discoveredSpeciesSet={discoveredSpeciesSet} />
      </div>

      {showDeveloperPanels && <DeveloperDexDebugPanel ownedDinosaurs={ownedDinosaurs} discoveredSpeciesIds={discoveredSpeciesIds} />}

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
  const nextGoalCount = Math.min(totalCount, Math.ceil((discoveredCount + 1) / 6) * 6 || 6);
  const nextGoal = discoveredCount >= totalCount ? '도감을 모두 채웠어요!' : `${nextGoalCount}마리 만나면 다음 보상`;

  return (
    <section className="relative overflow-hidden rounded-[30px] border-4 border-white bg-[linear-gradient(135deg,#fff8df,#f4edcf_52%,#dff3d2)] px-5 py-3 shadow-[0_12px_30px_rgba(73,92,53,0.18)]">
      <div className="pointer-events-none absolute -left-5 -top-8 h-28 w-28 rounded-full bg-white/35" />
      <div className="pointer-events-none absolute -bottom-10 right-[22%] h-24 w-24 rounded-full bg-lime-200/35" />
      <div className="grid items-center gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(360px,1.2fr)]">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border-4 border-white bg-amber-100 text-3xl shadow-sm">
            <BookOpen className="h-8 w-8 text-amber-800" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-amber-950">공룡 도감</h3>
            <p className="mt-1 text-sm font-black text-amber-800">공룡 친구들을 만나고 모아보세요!</p>
          </div>
        </div>
        <div className="grid items-center gap-4 rounded-[28px] border-4 border-white bg-white/86 px-5 py-3 shadow-sm md:grid-cols-[1fr_auto]">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm font-black text-amber-950">
              <span className="inline-flex items-center gap-2">
                <Egg className="h-6 w-6 text-lime-600" />
                만난 공룡 {discoveredCount} / {totalCount}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{progressPercent}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-amber-100 shadow-inner">
              <div className="h-full rounded-full bg-gradient-to-r from-lime-500 to-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-amber-100 pt-3 text-sm font-black text-amber-950 md:border-l md:border-t-0 md:pl-4 md:pt-0">
            <Star className="h-8 w-8 fill-amber-300 text-amber-400" />
            <span className="max-w-40 leading-snug">{nextGoal}</span>
            <span className="text-3xl">🎁</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function DexHabitatTabs({
  activeHabitat,
  discoveredSpeciesSet,
  onHabitat,
}: {
  activeHabitat: DinosaurHabitatId;
  discoveredSpeciesSet: Set<string>;
  onHabitat: (habitat: DinosaurHabitatId) => void;
}) {
  return (
    <aside className="grid content-start gap-3 rounded-[30px] border-4 border-white bg-[#fffaf0]/90 p-3 shadow-[0_10px_24px_rgba(73,92,53,0.15)] sm:grid-cols-2 lg:grid-cols-1">
      {dexPageHabitats.map((habitat) => {
        const meta = habitatMeta[habitat];
        const speciesInHabitat = dinosaurSpecies.filter((species) => species.habitat === habitat);
        const discoveredCount = speciesInHabitat.filter((species) => isSpeciesDiscovered(species, discoveredSpeciesSet)).length;
        const isActive = habitat === activeHabitat;

        return (
          <button
            key={habitat}
            onClick={() => onHabitat(habitat)}
            className={`relative grid min-h-[82px] grid-cols-[54px_1fr] items-center gap-3 rounded-[22px] border-4 px-3 text-left font-black transition active:translate-y-1 ${
              isActive ? 'border-lime-300 bg-gradient-to-br from-lime-100 to-emerald-100 text-emerald-950 shadow-[0_5px_0_#bef264]' : 'border-white bg-white/80 text-slate-600 hover:bg-lime-50'
            }`}
          >
            <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[16px] border-2 border-white bg-white/70 shadow-inner">
              <img src={dexHabitatImages[habitat]} alt="" className="h-full w-full object-cover" />
              <span className="absolute bottom-0.5 right-0.5 text-base drop-shadow">{getHabitatEmoji(habitat)}</span>
            </span>
            <span>
              <span className="block text-base">{meta.shortLabel}</span>
              <span className="text-sm text-slate-500">{discoveredCount} / {speciesInHabitat.length}</span>
            </span>
            {isActive && <span className="absolute -right-3 top-1/2 h-5 w-5 -translate-y-1/2 rotate-45 border-r-4 border-t-4 border-lime-300 bg-lime-100" />}
          </button>
        );
      })}
      <div className="mt-auto hidden rounded-[24px] bg-lime-100/80 p-3 text-center lg:block">
        <div className="mx-auto flex h-20 w-20 items-end justify-center rounded-full bg-lime-200 text-5xl shadow-inner">🦕</div>
      </div>
    </aside>
  );
}

function DexHabitatSection({
  habitat,
  discoveredSpeciesSet,
  ownedBySpecies,
  onSelectSpecies,
}: {
  key?: string;
  habitat: DinosaurHabitatId;
  discoveredSpeciesSet: Set<string>;
  ownedBySpecies: Record<string, OwnedDinosaur | undefined>;
  onSelectSpecies: (speciesId: string) => void;
}) {
  const meta = habitatMeta[habitat];
  const speciesList = dinosaurSpecies.filter((species) => species.habitat === habitat);

  return (
    <section className={`relative h-full min-h-0 overflow-hidden rounded-[34px] border-4 border-white bg-gradient-to-br ${meta.tone} p-4 shadow-[0_12px_28px_rgba(73,92,53,0.17)] md:p-5`}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full border-[18px] border-white/25" />
      <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-center">
        <Sparkles className="h-6 w-6 text-lime-700" />
        <h4 className="text-3xl font-black">{meta.label}</h4>
        <Sparkles className="h-6 w-6 text-lime-700" />
        <span className="ml-auto rounded-full bg-white/82 px-4 py-2 text-sm font-black shadow-sm">
          {speciesList.filter((species) => isSpeciesDiscovered(species, discoveredSpeciesSet)).length}/{speciesList.length} 발견
        </span>
      </div>
      <div className="relative min-h-0 overflow-y-auto pb-3 lg:h-[calc(100%-4rem)]">
        <DexStickerGrid speciesList={speciesList} discoveredSpeciesSet={discoveredSpeciesSet} ownedBySpecies={ownedBySpecies} onSelectSpecies={onSelectSpecies} />
      </div>
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
    <div className="grid min-h-0 grid-cols-2 content-start gap-3 sm:gap-4 xl:grid-cols-3">
      {speciesList.map((species) => (
        <DexDinosaurCard key={species.speciesId} species={species} isDiscovered={isSpeciesDiscovered(species, discoveredSpeciesSet)} ownedDinosaur={ownedBySpecies[species.speciesId]} onSelect={() => onSelectSpecies(species.speciesId)} />
      ))}
    </div>
  );
}

function DexDinosaurCard({ species, isDiscovered, ownedDinosaur, onSelect }: { key?: string; species: DinosaurSpecies; isDiscovered: boolean; ownedDinosaur?: OwnedDinosaur; onSelect: () => void }) {
  const isPlaceholder = Boolean(species.isPlaceholder);
  const dinosaurImage = dexDinosaurImages[species.speciesId];

  return (
    <button
      onClick={onSelect}
      className={`group relative min-h-[210px] overflow-hidden rounded-[24px] border-4 p-3 text-left transition hover:-translate-y-1 hover:brightness-105 active:translate-y-1 ${
        isDiscovered ? 'rotate-[0.3deg] border-white bg-[#fffdf5] text-emerald-950 shadow-[0_8px_0_#d9e9bd,0_14px_24px_rgba(57,83,46,0.16)]' : isPlaceholder ? 'border-stone-200 bg-stone-100 text-stone-500 shadow-[0_7px_0_#d6d3d1]' : 'border-white/80 bg-stone-100/95 text-stone-500 shadow-[0_7px_0_#d6d3d1]'
      }`}
    >
      <div className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm">
        <Heart className="h-4 w-4 fill-current" />
      </div>
      <div className={`relative mb-3 flex h-32 items-center justify-center overflow-hidden rounded-[20px] border-4 border-white ${isDiscovered ? 'bg-gradient-to-b from-sky-100 via-lime-100 to-amber-100' : 'bg-[repeating-linear-gradient(135deg,#e7e5e4,#e7e5e4_10px,#d6d3d1_10px,#d6d3d1_20px)]'}`}>
        {isDiscovered && <div className="absolute bottom-2 h-5 w-4/5 rounded-[50%] bg-emerald-900/10 blur-sm" />}
        {isDiscovered ? (
          dinosaurImage ? <img src={dinosaurImage} alt={species.displayName} className="h-full w-full object-contain object-center" /> : <DexDinoAvatar species={species} size="card" />
        ) : (
          <DexSilhouette species={species} />
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-black leading-tight">{isDiscovered ? species.displayName : '???'}</h3>
        <Star className={`h-6 w-6 ${isDiscovered ? 'fill-amber-300 text-amber-400' : 'text-stone-300'}`} />
      </div>
      <p className="mt-1 text-xs font-black text-slate-500">{isDiscovered ? ownedDinosaur?.name ?? rarityLabels[species.rarity] : isPlaceholder ? '아직 준비 중이에요' : '아직 만나지 못했어요'}</p>
      <span className={`absolute bottom-3 right-3 rounded-full px-2 py-1 text-[10px] font-black ${isDiscovered ? 'bg-lime-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
        {isDiscovered ? '발견 완료' : '미발견'}
      </span>
    </button>
  );
}

function DexHintPanel({ activeHabitat, discoveredSpeciesSet }: { activeHabitat: DinosaurHabitatId; discoveredSpeciesSet: Set<string> }) {
  const speciesList = dinosaurSpecies.filter((species) => species.habitat === activeHabitat);
  const undiscovered = speciesList.find((species) => !isSpeciesDiscovered(species, discoveredSpeciesSet));
  const meta = habitatMeta[activeHabitat];
  const eggImage = undiscovered?.rarity === 'rare' ? dexEggImages.rare : dexEggImages.common;

  return (
    <aside className="grid content-start gap-4 rounded-[30px] border-4 border-white bg-[#fffaf0]/90 p-4 shadow-[0_10px_24px_rgba(73,92,53,0.15)] sm:grid-cols-2 lg:grid-cols-1">
      <div className="rotate-2 rounded-[12px] border-4 border-white bg-white p-3 text-center shadow-lg">
        <div className="flex h-40 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-b from-violet-100 to-amber-100">
          <img src={eggImage} alt={undiscovered?.rarity === 'rare' ? '희귀 공룡 알' : '공룡 알'} className="h-full w-full object-contain object-center" />
        </div>
        <p className="mt-3 text-sm font-black leading-relaxed text-amber-950">알을 부화시켜 더 많은 공룡을 만나보세요!</p>
      </div>
      <div className="rounded-[24px] bg-lime-50 px-4 py-3 text-sm font-black text-emerald-900">
        <p className="text-base text-emerald-950">{meta.shortLabel} 힌트</p>
        <p className="mt-2 leading-relaxed">{undiscovered ? undiscovered.discoveryHint : '이 서식지 친구들을 모두 만났어요!'}</p>
      </div>
    </aside>
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
  const dinosaurImage = dexDinosaurImages[species.speciesId];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-emerald-950/45 px-4 pb-[calc(112px+env(safe-area-inset-bottom))] pt-5 backdrop-blur-sm">
      <section className={`grid max-h-full min-h-0 w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[32px] border-4 border-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] ${isDiscovered ? 'bg-gradient-to-b from-[#fffdf5] via-lime-50 to-sky-50' : 'bg-gradient-to-b from-stone-100 via-slate-100 to-stone-200'}`}>
        <div className="flex justify-end px-4 pt-4">
          <button aria-label="닫기" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-slate-900 text-white transition active:translate-y-1">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="grid min-h-0 gap-4 overflow-y-auto px-5 pb-4 text-center">
          <div className={`mx-auto flex h-52 w-full max-w-sm items-center justify-center rounded-[30px] border-4 border-white ${isDiscovered ? 'bg-gradient-to-b from-sky-100 via-lime-100 to-amber-100' : 'bg-gradient-to-b from-slate-200 to-slate-300'}`}>
            {isDiscovered ? (
              dinosaurImage ? <img src={dinosaurImage} alt={species.displayName} className="h-full w-full object-contain object-center" /> : <DexDinoAvatar species={species} size="modal" />
            ) : (
              <DexSilhouette species={species} large />
            )}
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
                {ownedDinosaur && <DexInfoPill label="성장 단계" value={`${getGrowthStageLabel(ownedDinosaur.growthStage)} · Lv. ${ownedDinosaur.level}`} />}
                {ownedDinosaur && <DexInfoPill label="성장 상태" value={ownedDinosaur.growthStage === 'adult' || ownedDinosaur.level >= 20 ? '성장 완료' : '함께 훈련 중'} />}
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
          <button onClick={onClose} className="min-h-14 rounded-[18px] bg-slate-100 px-6 text-sm font-black text-slate-600 transition active:translate-y-1">닫기</button>
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
  const scale = size === 'modal' ? 'h-40 w-44' : 'h-24 w-28';

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
    <img
      src={getDexSilhouetteImage(species.speciesId)}
      alt="미발견 공룡 실루엣"
      className={`${large ? 'h-full w-full' : 'h-full w-full'} object-contain object-center grayscale-[35%]`}
    />
  );
}

function getHabitatEmoji(habitat: DinosaurHabitatId) {
  if (habitat === 'sparkle-cave') return '💎';
  if (habitat === 'volcano-island') return '🌋';
  if (habitat === 'secret-land') return '❔';
  return '🌳';
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
