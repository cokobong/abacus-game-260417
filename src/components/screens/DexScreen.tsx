import { CalendarDays, Compass, Lightbulb, LockKeyhole, Map as MapIcon, Smile, Star, Trees, Utensils, X, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { dexBookAssets, dexDinosaurImages, dexEggImages, dexHabitatBadgeImages, dexTitleOrnamentImages, getDexSilhouetteImage } from '../../assets/dex';
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
    tone: 'from-[#fbf4df] to-[#f2eed9] text-emerald-950',
  },
  'green-forest': {
    label: '초록 숲 친구들',
    shortLabel: '초록 숲',
    description: '나뭇잎 사이에서 조용히 반짝이는 공룡들이 살아요.',
    tone: 'from-[#fbf4df] to-[#eef2d8] text-emerald-950',
  },
  'sparkle-cave': {
    label: '반짝 동굴 친구들',
    shortLabel: '반짝 동굴',
    description: '수정빛 동굴에서 특별한 친구들이 기다려요.',
    tone: 'from-[#fbf4df] to-[#eeeadf] text-violet-950',
  },
  'volcano-island': {
    label: '화산섬 친구들',
    shortLabel: '화산섬',
    description: '따뜻한 돌길과 붉은 흙 위를 걷는 든든한 공룡들이에요.',
    tone: 'from-[#fbf4df] to-[#f3e7d7] text-orange-950',
  },
  'secret-land': {
    label: '비밀의 땅 친구들',
    shortLabel: '비밀',
    description: '아직 이름 모를 발자국이 남아 있는 신비한 곳이에요.',
    tone: 'from-[#fbf4df] to-[#e9ebe2] text-slate-800',
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
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden rounded-[28px] border-4 border-white/70 bg-[linear-gradient(145deg,#f8f0dc,#f4ecd8_58%,#edf0dc)] p-2 pb-4 shadow-[0_16px_38px_rgba(83,72,48,0.12)]">
      <DexProgressHeader discoveredCount={discoveredCount} totalCount={dexTargetSpeciesCount} />

      <div className="grid min-h-0 gap-3 overflow-y-auto pb-4 md:grid-cols-[180px_minmax(0,1fr)_180px] md:overflow-hidden xl:grid-cols-[240px_minmax(0,1fr)_220px]">
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
    <section className="overflow-hidden rounded-[24px] border-2 border-white/90 bg-[#fffaf0]/94 px-4 py-2 shadow-[0_6px_18px_rgba(83,72,48,0.09)]">
      <div className="grid items-center gap-3 md:grid-cols-[minmax(240px,0.8fr)_minmax(280px,1.2fr)]">
        <div className="flex items-center gap-3">
          <img src={dexBookAssets.headerIcon} alt="공룡 도감" className="h-12 w-12 object-contain drop-shadow-sm" />
          <div><h3 className="text-2xl font-black leading-none text-amber-950">공룡 도감</h3><p className="mt-1.5 text-xs font-black text-amber-800/65">공룡 친구들을 만나고 모아보세요!</p></div>
        </div>
        <div className="grid items-center gap-3 rounded-[18px] bg-[#f8f0db]/75 px-3 py-1.5 md:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-[42px_1fr] items-center gap-2.5">
            <img src={dexBookAssets.progressEgg} alt="도감 진행" className="h-10 w-10 object-contain drop-shadow-sm" />
            <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3 text-xs font-black text-amber-950">
              <span>만난 공룡 {discoveredCount} / {totalCount}</span>
              <span className="text-emerald-700">{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-amber-100">
              <div className="h-full rounded-full bg-[#8eae68] transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-amber-200/60 pt-2 text-xs font-black text-amber-900 md:border-l md:border-t-0 md:pl-3 md:pt-0">
            <img src={dexBookAssets.rewardGift} alt="다음 보상" className="h-10 w-10 object-contain drop-shadow-sm" />
            <span className="max-w-36 leading-snug"><span className="block text-[10px] text-amber-700/65">다음 보상</span>{nextGoal}</span>
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
    <aside className="relative grid content-start gap-3 overflow-hidden rounded-[26px] border-2 border-white/90 bg-[#fdf7e9]/92 p-3 pb-32 shadow-[0_8px_20px_rgba(83,72,48,0.09)] sm:grid-cols-2 sm:pb-3 md:grid-cols-1 md:pb-32">
      {dexPageHabitats.map((habitat) => {
        const meta = habitatMeta[habitat];
        const speciesInHabitat = dinosaurSpecies.filter((species) => species.habitat === habitat);
        const discoveredCount = speciesInHabitat.filter((species) => isSpeciesDiscovered(species, discoveredSpeciesSet)).length;
        const isActive = habitat === activeHabitat;

        return (
          <button
            key={habitat}
            onClick={() => onHabitat(habitat)}
            className={`relative grid min-h-[88px] grid-cols-[68px_1fr] items-center gap-3 rounded-[20px] border-2 px-3 text-left font-black transition active:translate-y-1 ${
              isActive ? 'z-10 border-[#b8ca92] bg-[#e7efca] text-emerald-950 shadow-[0_5px_12px_rgba(86,105,58,.14)]' : 'border-white/50 bg-white/48 text-slate-600 hover:bg-white/80'
            }`}
          >
            <span className="relative flex h-16 w-16 items-center justify-center">
              <img src={dexHabitatBadgeImages[habitat]} alt="" className="h-full w-full object-contain" />
            </span>
            <span>
              <span className="block text-lg leading-tight">{meta.shortLabel}</span>
              <span className="mt-1 block text-xs text-slate-500">{discoveredCount} / {speciesInHabitat.length} 발견</span>
            </span>
            {isActive && <span className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rotate-45 border-r-2 border-t-2 border-[#b8ca92] bg-[#e7efca]" />}
          </button>
        );
      })}
      <img src={dexBookAssets.mascot} alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-5 left-1/2 hidden h-36 w-36 -translate-x-1/2 object-contain drop-shadow-[0_8px_8px_rgba(68,86,48,.18)] md:block" />
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
    <section className={`relative h-full min-h-0 overflow-hidden rounded-[26px] border-2 border-white/90 bg-gradient-to-br ${meta.tone} p-3 shadow-[0_8px_22px_rgba(83,72,48,0.1)] md:p-4`}>
      <div className="relative mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-amber-900/10 pb-2.5">
        <img src={dexTitleOrnamentImages[habitat]} alt="" aria-hidden="true" className="ml-auto h-10 w-28 object-contain object-right opacity-90" />
        <h4 className="whitespace-nowrap text-center text-xl font-black">{meta.label}</h4>
        <img src={dexTitleOrnamentImages[habitat]} alt="" aria-hidden="true" className="h-10 w-28 -scale-x-100 object-contain object-right opacity-90" />
        <span className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/55 px-2 py-1 text-[10px] font-black text-emerald-800/70">
          {speciesList.filter((species) => isSpeciesDiscovered(species, discoveredSpeciesSet)).length}/{speciesList.length} 발견
        </span>
      </div>
      <div className="relative min-h-0 overflow-y-auto pb-3 md:h-[calc(100%-2.75rem)]">
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

function DexDinosaurCard({ species, isDiscovered, onSelect }: { key?: string; species: DinosaurSpecies; isDiscovered: boolean; ownedDinosaur?: OwnedDinosaur; onSelect: () => void }) {
  const isPlaceholder = Boolean(species.isPlaceholder);
  const dinosaurImage = dexDinosaurImages[species.speciesId];

  return (
    <button
      onClick={onSelect}
      className={`group relative min-h-[222px] overflow-hidden rounded-[22px] border-2 p-2 text-center transition hover:-translate-y-1 active:translate-y-0 ${
        isDiscovered ? 'border-white bg-[#fffdf7] text-emerald-950 shadow-[0_7px_18px_rgba(83,72,48,0.12)]' : isPlaceholder ? 'border-stone-200/80 bg-[#eeeae0] text-stone-500 shadow-sm' : 'border-white/70 bg-[#eeeae0] text-stone-500 shadow-sm'
      }`}
    >
      {isDiscovered && <Star className="absolute right-3 top-3 z-10 h-5 w-5 fill-amber-300 text-amber-400 drop-shadow-sm" />}
      <div className={`relative mb-2 flex h-40 items-center justify-center overflow-hidden rounded-[17px] ${isDiscovered ? 'bg-[linear-gradient(180deg,#edf3df,#f8efd9)]' : 'bg-[radial-gradient(circle_at_50%_45%,#f8f2df,transparent_44%),linear-gradient(180deg,#dedfd8,#d2d3cb)]'}`}>
        {isDiscovered && <div className="absolute bottom-2 h-5 w-4/5 rounded-[50%] bg-emerald-900/10 blur-sm" />}
        {isDiscovered ? (
          dinosaurImage ? <img src={dinosaurImage} alt={species.displayName} className="h-full w-full scale-110 object-contain object-center transition-transform group-hover:scale-[1.15]" /> : <DexDinoAvatar species={species} size="card" />
        ) : (
          <DexSilhouette species={species} />
        )}
      </div>
      <h3 className={`font-black leading-tight ${isDiscovered ? 'text-xl' : 'text-base tracking-[0.18em] text-stone-500'}`}>{isDiscovered ? species.displayName : '???'}</h3>
      {isPlaceholder && <p className="mt-1 text-[10px] font-black text-stone-400">준비 중</p>}
    </button>
  );
}

function DexHintPanel({ activeHabitat, discoveredSpeciesSet }: { activeHabitat: DinosaurHabitatId; discoveredSpeciesSet: Set<string> }) {
  const speciesList = dinosaurSpecies.filter((species) => species.habitat === activeHabitat);
  const undiscovered = speciesList.find((species) => !isSpeciesDiscovered(species, discoveredSpeciesSet));
  const meta = habitatMeta[activeHabitat];
  const eggImage = undiscovered?.rarity === 'rare' ? dexEggImages.rare : dexEggImages.common;

  return (
    <aside className="grid content-start gap-3 rounded-[24px] border-2 border-white/90 bg-[#fdf7e9]/85 p-3 shadow-[0_8px_20px_rgba(83,72,48,0.09)] sm:grid-cols-2 md:grid-cols-1">
      <div className="rotate-1 rounded-[8px] bg-[#fffdf7] p-2.5 text-center shadow-[0_7px_16px_rgba(83,72,48,0.12)]">
        <div className="flex h-36 items-center justify-center overflow-hidden rounded-[7px] bg-[linear-gradient(180deg,#eee8db,#f6eedc)]">
          <img src={eggImage} alt={undiscovered?.rarity === 'rare' ? '희귀 공룡 알' : '공룡 알'} className="h-full w-full object-contain object-center" />
        </div>
        <p className="mt-2 text-xs font-black text-amber-950">다음 친구를 기다리는 알</p>
      </div>
      <div className="relative rotate-[-1deg] rounded-[6px_18px_8px_16px] bg-[#fff4c9] px-4 pb-4 pt-5 text-sm font-black text-stone-700 shadow-sm">
        <span className="absolute left-1/2 top-0 h-4 w-16 -translate-x-1/2 -translate-y-1/2 bg-amber-100/80" />
        <p className="text-sm text-amber-950">{meta.shortLabel} 탐험 메모</p>
        <p className="mt-2 line-clamp-4 leading-relaxed">{undiscovered ? undiscovered.discoveryHint : '이곳의 친구들을 모두 만났어요!'}</p>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-emerald-950/50 px-3 pb-[calc(96px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-md sm:px-5 sm:pt-6">
      <section className={`relative grid max-h-full min-h-0 w-full max-w-6xl grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[30px] border-[5px] border-white/90 shadow-[0_30px_100px_rgba(15,42,32,0.38)] sm:rounded-[40px] lg:min-h-[610px] ${isDiscovered ? 'bg-[linear-gradient(135deg,#fff9e9,#f1f4d5_48%,#e2f3d8)]' : 'bg-[linear-gradient(135deg,#f6f0df,#e6e3d8_50%,#d5ddd5)]'}`}>
        <button aria-label="닫기" onClick={onClose} className="absolute right-3 top-3 z-30 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-white/90 text-emerald-950 shadow-lg transition hover:rotate-6 active:translate-y-1 sm:right-5 sm:top-5">
          <X className="h-6 w-6" strokeWidth={3} />
        </button>
        <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[1.08fr_0.92fr] lg:overflow-hidden">
          <div className={`relative m-3 flex min-h-[300px] items-center justify-center overflow-hidden rounded-[28px] border-4 border-white/80 p-2 sm:m-5 sm:min-h-[390px] sm:rounded-[34px] lg:mr-2 lg:min-h-0 ${isDiscovered ? 'bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,225,.95),transparent_28%),linear-gradient(180deg,#dce9c9,#edf0d5_55%,#cad9ae)]' : 'bg-[radial-gradient(circle_at_50%_42%,rgba(255,253,221,.7),transparent_28%),linear-gradient(180deg,#d8ddd0,#c8cec1_55%,#b7bdae)]'}`}>
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_bottom,#759e61,transparent_68%)] opacity-50" />
            {!isDiscovered && <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-50/50 blur-3xl" />}
            <div className={`relative z-10 flex h-full w-full items-center justify-center ${isDiscovered ? 'drop-shadow-[0_18px_14px_rgba(48,78,40,.25)]' : 'opacity-80 drop-shadow-[0_16px_18px_rgba(44,49,43,.32)]'}`}>
            {isDiscovered ? (
              dinosaurImage ? <img src={dinosaurImage} alt={species.displayName} className="h-full max-h-[540px] w-full object-contain object-center" /> : <DexDinoAvatar species={species} size="modal" />
            ) : (
              <DexSilhouette species={species} large />
            )}
            </div>
          </div>
          <div className="flex min-h-0 flex-col px-5 pb-6 pt-2 sm:px-7 lg:overflow-y-auto lg:pb-6 lg:pl-6 lg:pr-8 lg:pt-8">
            <div className="pr-12">
              <span className="inline-flex rounded-full bg-white/75 px-3 py-1.5 text-xs font-black text-amber-800">★ {isDiscovered ? rarityLabels[species.rarity] : '수수께끼'}</span>
              <p className="mt-5 text-xs font-black tracking-[.18em] text-emerald-700/80">DINOSAUR FIELD NOTE</p>
              <h3 className={`mt-1 font-black leading-tight ${isDiscovered ? 'text-4xl text-emerald-950 sm:text-5xl' : 'text-3xl text-stone-700 sm:text-4xl'}`}>{isDiscovered ? species.displayName : '아직 만나지 못한 공룡이에요.'}</h3>
              <p className={`mt-3 text-base font-bold leading-relaxed ${isDiscovered ? 'text-emerald-900/80' : 'text-stone-600'}`}>{isDiscovered ? species.dexDescription : '어떤 공룡일까요? 탐험 노트에 남은 단서를 살펴보세요.'}</p>
            </div>
          {isDiscovered ? (
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                <DexInfoPill icon={Utensils} label="좋아하는 먹이" value={species.favoriteFoodName} tone="bg-orange-50 text-orange-700" />
                <DexInfoPill icon={Smile} label="성격" value={species.personality} tone="bg-rose-50 text-rose-700" />
                <DexInfoPill icon={Compass} label="만난 방법" value={species.foundMethodLabel} tone="bg-sky-50 text-sky-700" />
                <DexInfoPill icon={CalendarDays} label="만난 날" value={ownedDinosaur ? formatDate(ownedDinosaur.obtainedAt) : '기록 준비 중'} tone="bg-violet-50 text-violet-700" />
                {ownedDinosaur && <p className="col-span-full mt-1 text-center text-xs font-black text-emerald-800/70">{getGrowthStageLabel(ownedDinosaur.growthStage)} · Lv. {ownedDinosaur.level} · {ownedDinosaur.growthStage === 'adult' || ownedDinosaur.level >= 20 ? '성장 완료' : '쑥쑥 자라는 중'}</p>}
              </div>
          ) : (
            <div className="relative mt-6 rotate-[-.5deg] rounded-[8px_24px_12px_22px] border border-amber-200/70 bg-[#fff7cf] px-5 pb-5 pt-7 text-left shadow-[0_12px_25px_rgba(91,80,56,.16)]">
              <span className="absolute left-1/2 top-0 h-6 w-24 -translate-x-1/2 -translate-y-1/2 rotate-2 bg-amber-100/80 shadow-sm" />
              <p className="flex items-center gap-2 text-lg font-black text-amber-950"><Lightbulb className="h-6 w-6 fill-amber-300 text-amber-600" /> 탐험가의 힌트 메모</p>
              <div className="mt-4 grid gap-3 text-sm font-black leading-relaxed text-stone-700 sm:text-base"><p className="rounded-[16px] bg-white/55 px-4 py-3">✦ {species.discoveryHint}</p><p className="rounded-[16px] bg-white/55 px-4 py-3">🥚 {isPlaceholder ? species.unlockHint : '알을 더 부화시키면 만날 수 있을지도 몰라요.'}</p></div>
            </div>
          )}
          </div>
        </div>
        <div className="grid gap-3 border-t-2 border-white/80 bg-white/60 p-4 text-center backdrop-blur-sm sm:grid-cols-[minmax(0,1fr)_180px] sm:px-6">
          {isDiscovered && ownedDinosaur && (
            <button
              onClick={() => onViewOwnedDinosaur(species.speciesId)}
              className="inline-flex min-h-16 items-center justify-center gap-2 rounded-[24px] border-4 border-white bg-gradient-to-r from-violet-500 to-emerald-500 px-8 text-lg font-black text-white shadow-[0_7px_0_#4f8a69] transition hover:brightness-105 active:translate-y-1 active:shadow-none"
            >
              <Trees className="h-6 w-6" />
              우리 공룡으로 보기
            </button>
          )}
          {!isDiscovered && <button disabled className="min-h-16 cursor-not-allowed rounded-[24px] border-4 border-white/80 bg-stone-300/80 px-6 text-base font-black text-stone-600 shadow-inner">아직 만나지 못했어요</button>}
          <button onClick={onClose} className="min-h-16 rounded-[22px] border-4 border-white bg-[#fffaf0] px-6 text-base font-black text-emerald-900 shadow-[0_5px_0_#d9d2bd] transition hover:bg-white active:translate-y-1 active:shadow-none">닫기</button>
        </div>
      </section>
    </div>
  );
}

function DexInfoPill({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: string }) {
  return (
    <div className="grid min-h-[72px] grid-cols-[38px_1fr] items-center gap-2.5 rounded-[18px] border border-white/90 bg-white/68 px-3 py-2 text-left shadow-sm">
      <span className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${tone}`}><Icon className="h-5 w-5" strokeWidth={2.5} /></span>
      <span className="min-w-0"><span className="block text-[11px] font-black text-slate-500">{label}</span><span className="mt-0.5 block break-keep text-sm font-black leading-snug text-emerald-950 sm:text-base">{value}</span></span>
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
