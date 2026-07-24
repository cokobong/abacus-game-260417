import { CalendarDays, Heart, LockKeyhole, Search, Smile, Sparkles, Star, Utensils, X, type LucideIcon } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { dexHabitatBadgeImages, dexTitleOrnamentImages, getDexSilhouetteImage, habitatBackgroundAssets } from '../../assets/dex';
import { dinosaurSpecies, type DinosaurHabitatId, type DinosaurSpecies } from '../../data/dinosaurSpecies';
import type { OwnedDinosaur } from '../../types/game';

export interface DexScreenProps {
  ownedDinosaurs: OwnedDinosaur[];
  discoveredSpeciesIds: string[];
  onViewOwnedDinosaur: (speciesId: string) => void;
  onGoToHatchery: () => void;
}

const habitatOrder: DinosaurHabitatId[] = ['green-forest', 'sparkle-cave', 'volcano-island', 'secret-land'];

const habitatMeta: Record<DinosaurHabitatId, { label: string; shortLabel: string; lockedLabel: string; accent: string }> = {
  'green-forest': {
    label: '초록 숲 친구들',
    shortLabel: '초록 숲',
    lockedLabel: '숲속 친구들이 기다려요',
    accent: 'from-lime-200 to-emerald-300 text-emerald-950',
  },
  'sparkle-cave': {
    label: '반짝 동굴 친구들',
    shortLabel: '반짝 동굴',
    lockedLabel: '동굴 안에서 반짝여요',
    accent: 'from-violet-100 to-sky-200 text-violet-950',
  },
  'volcano-island': {
    label: '화산섬 친구들',
    shortLabel: '화산섬',
    lockedLabel: '따뜻한 돌길을 좋아해요',
    accent: 'from-orange-100 to-amber-200 text-orange-950',
  },
  'secret-land': {
    label: '비밀의 땅 친구들',
    shortLabel: '비밀의 땅',
    lockedLabel: '비밀 지도에 숨어 있어요',
    accent: 'from-slate-100 to-emerald-100 text-slate-800',
  },
};

const rarityLabels: Record<OwnedDinosaur['rarity'], string> = {
  common: '공통',
  rare: '희귀',
  epic: '영웅',
  special: '특별',
  legendary: '전설',
};

export function DexScreen({ ownedDinosaurs, discoveredSpeciesIds, onViewOwnedDinosaur, onGoToHatchery }: DexScreenProps) {
  const [activeHabitat, setActiveHabitat] = useState<DinosaurHabitatId>('green-forest');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const uniqueOwnedDinosaurs = useMemo(() => getUniqueOwnedDinosaurs(ownedDinosaurs), [ownedDinosaurs]);
  const ownedBySpecies = useMemo(() => getOwnedDinosaurBySpecies(uniqueOwnedDinosaurs), [uniqueOwnedDinosaurs]);
  const discoveredSpeciesSet = useMemo(() => new Set([...discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId)]), [discoveredSpeciesIds, uniqueOwnedDinosaurs]);
  const activeSpeciesList = dinosaurSpecies.filter((species) => species.habitat === activeHabitat).sort((a, b) => a.habitatOrder - b.habitatOrder || a.collectionOrder - b.collectionOrder);
  const selectedSpecies = selectedSpeciesId ? dinosaurSpecies.find((species) => species.speciesId === selectedSpeciesId) ?? null : null;

  return (
    <section className="encyclopedia-screen dex-screen relative mx-auto flex h-full min-h-0 w-full max-w-[920px] flex-col overflow-hidden rounded-[34px] border-[6px] border-[#9a6a3a] bg-[#f8edd4] p-3 text-emerald-950 shadow-[0_20px_52px_rgba(62,43,25,0.24)]">
      <div className="dex-bg pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_9%,rgba(132,204,22,.28),transparent_12%),radial-gradient(circle_at_88%_8%,rgba(34,197,94,.22),transparent_14%),linear-gradient(180deg,rgba(255,255,255,.55),transparent_26%)]" />
      <span className="pointer-events-none absolute left-7 top-2 h-9 w-20 rotate-[-10deg] rounded-full bg-lime-500/35 blur-[1px]" />
      <span className="pointer-events-none absolute right-8 top-3 h-9 w-24 rotate-[10deg] rounded-full bg-green-500/30 blur-[1px]" />

      <div
        className="dex-board dex-board--habitat relative z-10 flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden rounded-[30px] border-4 border-white/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_12px_28px_rgba(83,72,48,.12)]"
        style={{ backgroundImage: `url(${habitatBackgroundAssets[activeHabitat]})` }}
      >
        <div className="dex-board__background-wash" />
        <DexCategoryTabs activeHabitat={activeHabitat} discoveredSpeciesSet={discoveredSpeciesSet} onSelectHabitat={setActiveHabitat} />
        <DexMainCollection habitat={activeHabitat} speciesList={activeSpeciesList} discoveredSpeciesSet={discoveredSpeciesSet} ownedBySpecies={ownedBySpecies} onSelectSpecies={setSelectedSpeciesId} />
      </div>

      {selectedSpecies && (
        <DexDetailModal
          species={selectedSpecies}
          ownedDinosaur={ownedBySpecies[selectedSpecies.speciesId]}
          isDiscovered={isSpeciesDiscovered(selectedSpecies, discoveredSpeciesSet)}
          onClose={() => setSelectedSpeciesId(null)}
          onViewOwnedDinosaur={onViewOwnedDinosaur}
          onGoToHatchery={onGoToHatchery}
        />
      )}
    </section>
  );
}

function DexCategoryTabs({
  activeHabitat,
  discoveredSpeciesSet,
  onSelectHabitat,
}: {
  activeHabitat: DinosaurHabitatId;
  discoveredSpeciesSet: Set<string>;
  onSelectHabitat: (habitat: DinosaurHabitatId) => void;
}) {
  return (
    <nav className="encyclopedia-category-tabs mx-auto grid w-[min(94%,760px)] flex-none grid-cols-4 gap-[clamp(6px,1.4vw,12px)]" aria-label="도감 카테고리">
      {habitatOrder.map((habitat) => {
        const meta = habitatMeta[habitat];
        const speciesInHabitat = getSpeciesByHabitat(habitat);
        const discoveredCount = speciesInHabitat.filter((species) => isSpeciesDiscovered(species, discoveredSpeciesSet)).length;
        const isActive = habitat === activeHabitat;
        const isLocked = discoveredCount === 0 && habitat !== 'green-forest';

        return (
          <button
            key={habitat}
            onClick={() => onSelectHabitat(habitat)}
            aria-pressed={isActive}
            className={`dex-category-item ${isActive ? 'dex-category-item--active' : ''} ${isLocked ? 'dex-category-item--locked' : ''} grid min-h-[78px] min-w-0 grid-cols-[clamp(36px,5vw,48px)_minmax(0,1fr)] items-center gap-1.5 rounded-[18px] border-3 px-2 text-left font-black transition active:translate-y-1 ${
              isActive ? 'border-lime-400 bg-gradient-to-b from-lime-100 to-lime-200 text-emerald-950 shadow-[0_4px_0_rgba(101,163,13,.22)]' : 'border-white/75 bg-white/72 text-stone-600 hover:bg-white'
            } ${isLocked ? 'opacity-65' : ''}`}
          >
            <span className="relative grid place-items-center">
              <img src={dexHabitatBadgeImages[habitat]} alt="" className="h-[clamp(36px,5vw,48px)] w-[clamp(36px,5vw,48px)] object-contain" />
              {isLocked && <LockKeyhole className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white/90 p-0.5 text-stone-500" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[clamp(11px,1.6vw,15px)]">{meta.shortLabel}</span>
              <span className="mt-0.5 block text-[clamp(10px,1.35vw,13px)] text-stone-500">{discoveredCount} / {speciesInHabitat.length}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function DexMainCollection({
  habitat,
  speciesList,
  discoveredSpeciesSet,
  ownedBySpecies,
  onSelectSpecies,
}: {
  habitat: DinosaurHabitatId;
  speciesList: DinosaurSpecies[];
  discoveredSpeciesSet: Set<string>;
  ownedBySpecies: Record<string, OwnedDinosaur | undefined>;
  onSelectSpecies: (speciesId: string) => void;
}) {
  const meta = habitatMeta[habitat];
  const discoveredCount = speciesList.filter((species) => isSpeciesDiscovered(species, discoveredSpeciesSet)).length;

  return (
    <section className="dex-main-panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="encyclopedia-category-header mx-auto flex min-h-12 w-[min(94%,760px)] flex-none items-center justify-between gap-3 rounded-[18px] border-2 border-white/80 bg-[#fffdf7]/72 px-3 py-1.5">
        <span className="flex min-w-0 items-center gap-2">
          <img src={dexTitleOrnamentImages[habitat]} alt="" className="h-8 w-16 flex-none object-contain" />
          <h3 className="truncate text-[clamp(1.05rem,2.3dvh,1.5rem)] font-black text-emerald-950">{meta.label}</h3>
        </span>
        <span className="flex-none rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-emerald-800">{discoveredCount} / {speciesList.length}</span>
      </header>

      <div className="encyclopedia-card-area mt-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        <div className="encyclopedia-card-grid mx-auto grid w-[min(94%,760px)] grid-cols-2 gap-[clamp(10px,2vw,18px)] pb-[clamp(12px,2vh,22px)]">
          {speciesList.map((species) => (
            <DexDinosaurCard
              key={species.speciesId}
              species={species}
              isDiscovered={isSpeciesDiscovered(species, discoveredSpeciesSet)}
              ownedDinosaur={ownedBySpecies[species.speciesId]}
              onSelect={() => onSelectSpecies(species.speciesId)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DexDinosaurCard({ species, isDiscovered, ownedDinosaur, onSelect }: { key?: string; species: DinosaurSpecies; isDiscovered: boolean; ownedDinosaur?: OwnedDinosaur; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`dex-dino-card ${isDiscovered ? '' : 'dex-dino-card--locked'} relative grid min-h-[210px] grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[22px] border-4 p-2 text-center transition hover:-translate-y-0.5 active:translate-y-0 ${
        isDiscovered ? 'border-lime-400 bg-[#fffdf7] text-emerald-950 shadow-[0_6px_14px_rgba(83,72,48,.14)]' : 'border-white/80 bg-[#e9dfca] text-stone-600 shadow-sm'
      }`}
    >
      {isDiscovered && <Heart className="absolute left-3 top-3 z-10 h-7 w-7 fill-rose-400 text-white drop-shadow-sm" />}
      <div className={`dex-dino-image relative flex min-h-0 items-center justify-center overflow-hidden rounded-[16px] ${isDiscovered ? 'bg-[linear-gradient(180deg,#bfeaff,#f4edc9)]' : 'bg-[linear-gradient(180deg,#d7ccb4,#c9bda3)]'}`}>
        {isDiscovered ? (
          species.characterAsset ? (
            <img
              src={species.characterAsset}
              alt={species.displayName}
              className="dex-character-image h-full w-full object-contain object-center"
              style={getDexCharacterStyle(species)}
              draggable={false}
            />
          ) : <DexDinoAvatar species={species} />
        ) : (
          <DexSilhouette species={species} />
        )}
      </div>
      <div className="pt-2">
        <div className="flex items-center justify-center gap-1.5">
          <Star className={`h-5 w-5 ${isDiscovered ? 'fill-amber-300 text-amber-400' : 'fill-stone-300 text-stone-300'}`} />
          <h4 className={`truncate text-lg font-black leading-tight ${isDiscovered ? 'text-emerald-950' : 'tracking-[0.16em] text-stone-600'}`}>{isDiscovered ? species.displayName : '???'}</h4>
        </div>
        {!isDiscovered && <p className="mt-0.5 truncate text-[11px] font-black text-stone-500">{species.isPlaceholder ? '준비 중이에요' : '아직 만나지 못했어요'}</p>}
        {ownedDinosaur && <p className="mt-0.5 text-[10px] font-black text-emerald-700">Lv.{ownedDinosaur.level}</p>}
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
  onGoToHatchery,
}: {
  species: DinosaurSpecies;
  ownedDinosaur?: OwnedDinosaur;
  isDiscovered: boolean;
  onClose: () => void;
  onViewOwnedDinosaur: (speciesId: string) => void;
  onGoToHatchery: () => void;
}) {
  const discoveredDateLabel = getDiscoveredDateLabel(ownedDinosaur);

  return (
    <div className="dex-detail-modal fixed inset-0 z-40 flex items-center justify-center bg-emerald-950/50 px-4 pb-[calc(92px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-md">
      <section className="relative grid max-h-full min-h-0 w-full max-w-3xl grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[30px] border-[5px] border-white bg-[#fff8e8] shadow-[0_30px_100px_rgba(15,42,32,.38)]">
        <button aria-label="닫기" onClick={onClose} className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border-4 border-white bg-white/92 text-emerald-950 shadow-lg">
          <X className="h-6 w-6" />
        </button>

        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 overflow-y-auto p-5">
          <div className={`flex min-h-[330px] items-center justify-center overflow-hidden rounded-[26px] border-4 border-white ${isDiscovered ? 'bg-[linear-gradient(180deg,#c6edff,#eaf2cf)]' : 'bg-[#d6cbb6]'}`}>
            {isDiscovered ? (
              species.characterAsset ? (
                <img
                  src={species.characterAsset}
                  alt={species.displayName}
                  className="dex-character-image h-full max-h-[430px] w-full object-contain"
                  style={getDexCharacterStyle(species)}
                  draggable={false}
                />
              ) : <DexDinoAvatar species={species} large />
            ) : (
              <DexSilhouette species={species} large />
            )}
          </div>

          <div className="min-w-0 pr-10">
            <span className="inline-flex rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-emerald-800">{isDiscovered ? rarityLabels[species.rarity] : '미발견'}</span>
            <h3 className="mt-4 text-4xl font-black leading-tight text-emerald-950">{isDiscovered ? species.displayName : '???'}</h3>
            <p className="mt-3 text-sm font-bold leading-relaxed text-stone-700">{isDiscovered ? species.description : '아직 만나지 못한 공룡이에요. 알을 부화시키거나 힌트를 따라가 보세요.'}</p>

            {isDiscovered ? (
              <div className="mt-5 grid gap-2">
                <DexInfoPill icon={Utensils} label="좋아하는 먹이" value={species.favoriteFoodName} tone="bg-orange-50 text-orange-700" />
                <DexInfoPill icon={Smile} label="성격" value={species.personality} tone="bg-rose-50 text-rose-700" />
                <DexInfoPill icon={Sparkles} label="성장 상태" value={getGrowthSummary(ownedDinosaur)} tone="bg-sky-50 text-sky-700" />
                <DexInfoPill icon={CalendarDays} label="만난 날" value={discoveredDateLabel} tone="bg-violet-50 text-violet-700" />
              </div>
            ) : (
              <div className="mt-5 rounded-[20px] bg-[#fff1b8] p-4 text-sm font-black leading-relaxed text-stone-700 shadow-sm">
                <p className="flex items-center gap-2 text-amber-950"><Search className="h-5 w-5" /> 발견 힌트</p>
                <p className="mt-2">{species.discoveryHint}</p>
                <p className="mt-2">{species.unlockHint}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 border-t-2 border-white bg-white/65 p-4 sm:grid-cols-2">
          {isDiscovered && ownedDinosaur ? (
            <button onClick={() => onViewOwnedDinosaur(species.speciesId)} className="min-h-14 rounded-[20px] border-4 border-white bg-gradient-to-r from-lime-400 to-emerald-500 text-base font-black text-emerald-950 shadow-[0_5px_0_#059669] transition active:translate-y-1 active:shadow-none">
              우리 공룡으로 보기
            </button>
          ) : (
            <button onClick={onGoToHatchery} className="min-h-14 rounded-[20px] border-4 border-white bg-gradient-to-r from-amber-200 to-orange-300 text-base font-black text-amber-950 shadow-[0_5px_0_#d97706] transition active:translate-y-1 active:shadow-none">
              알부화장으로 가기
            </button>
          )}
          <button onClick={onClose} className="min-h-14 rounded-[20px] border-4 border-white bg-white text-base font-black text-emerald-900 shadow-[0_5px_0_#d9d2bd] transition active:translate-y-1 active:shadow-none">닫기</button>
        </div>
      </section>
    </div>
  );
}

function DexInfoPill({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: string }) {
  return (
    <div className="grid grid-cols-[38px_minmax(0,1fr)] items-center gap-2 rounded-[16px] border border-white/90 bg-white/72 px-3 py-2 text-left shadow-sm">
      <span className={`grid h-10 w-10 place-items-center rounded-[13px] ${tone}`}><Icon className="h-5 w-5" /></span>
      <span className="min-w-0"><span className="block text-[11px] font-black text-slate-500">{label}</span><span className="block truncate text-sm font-black text-emerald-950">{value}</span></span>
    </div>
  );
}

function DexDinoAvatar({ species, large = false }: { species: DinosaurSpecies; large?: boolean }) {
  return (
    <div className={`relative ${large ? 'h-52 w-56' : 'h-28 w-32'}`}>
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
      className={`${large ? 'h-full max-h-[360px]' : 'h-full'} w-full object-contain object-center grayscale opacity-65`}
    />
  );
}

function getDexCharacterStyle(species: DinosaurSpecies) {
  return {
    '--dino-scale': species.cardScale,
    '--dino-x': `${species.cardOffsetX}px`,
    '--dino-y': `${species.cardOffsetY}px`,
  } as CSSProperties;
}

function getSpeciesByHabitat(habitat: DinosaurHabitatId) {
  return dinosaurSpecies.filter((species) => species.habitat === habitat).sort((a, b) => a.habitatOrder - b.habitatOrder || a.collectionOrder - b.collectionOrder);
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

function getGrowthSummary(ownedDinosaur?: OwnedDinosaur) {
  if (!ownedDinosaur || !Number.isFinite(ownedDinosaur.level)) {
    return '아직 미확인';
  }

  const level = Math.max(1, Math.floor(ownedDinosaur.level));
  return `${getDexGrowthStageLabel(level)} · Lv.${level}`;
}

function getDexGrowthStageLabel(level: number) {
  if (level >= 20) return '성장 완료';
  if (level >= 10) return '청소년';
  if (level >= 5) return '어린이';
  return '아기';
}

function getDiscoveredDateLabel(ownedDinosaur?: OwnedDinosaur) {
  // TODO: discoveredAt 저장 필드가 생기면 최초 획득/부화 시각을 우선 표시한다.
  return formatDiscoveredDate(ownedDinosaur?.obtainedAt) ?? '기록 준비 중';
}

function formatDiscoveredDate(timestamp?: number | null) {
  if (!timestamp || !Number.isFinite(timestamp)) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1970) return null;

  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
