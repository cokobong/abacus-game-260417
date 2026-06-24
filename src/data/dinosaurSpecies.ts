import type { Id, OwnedDinosaur } from '../types/game';

export type DinosaurSpeciesRarity = OwnedDinosaur['rarity'];
export type DinosaurUnlockSource = 'normal-egg' | 'special-egg' | 'rare-egg' | 'adventure-fragment' | 'planned';
export type DinosaurEggCategory = 'normal' | 'special' | 'rare';
export type DinosaurSpeciesStatus = 'available' | 'planned' | 'locked';

export interface DinosaurSpecies {
  speciesId: Id;
  name: string;
  defaultName: string;
  displayName: string;
  rarity: DinosaurSpeciesRarity;
  plannedRarity?: DinosaurSpeciesRarity;
  description: string;
  dexDescription: string;
  personality: string;
  favoriteFoodName: string;
  habitat: DinosaurHabitatId;
  eggCategory: DinosaurEggCategory;
  unlockSource: DinosaurUnlockSource;
  requiredFragmentId?: Id;
  starterSelectable?: boolean;
  collectionOrder: number;
  habitatOrder: number;
  discoveryHint: string;
  foundMethodLabel: string;
  silhouette: string;
  unlockHint: string;
  isPlaceholder?: boolean;
  status?: DinosaurSpeciesStatus;
  lockedLabel?: string;
}

export type DinosaurHabitatId = 'green-forest' | 'sparkle-cave' | 'volcano-island' | 'secret-land';

export const dexHabitats: DinosaurHabitatId[] = ['green-forest', 'sparkle-cave', 'volcano-island', 'secret-land'];
export const dexSpeciesSlotsPerHabitat = 6;
export const dexTargetSpeciesCount = dexHabitats.length * dexSpeciesSlotsPerHabitat;

const habitatOrderById: Record<DinosaurHabitatId, number> = {
  'green-forest': 1,
  'sparkle-cave': 2,
  'volcano-island': 3,
  'secret-land': 4,
};

const eggCategoryFoundMethod: Record<DinosaurEggCategory, string> = {
  normal: '일반 알에서 태어남',
  special: '특수 알에서 태어남',
  rare: '희귀 알에서 태어남',
};

const eggCategoryUnlockHint: Record<DinosaurEggCategory, string> = {
  normal: '일반알을 부화시키면 만날 수 있어요.',
  special: '특수알을 부화시키면 만날 수 있어요.',
  rare: '희귀알을 부화시키면 만날 수 있어요.',
};

const speciesDrafts: Array<{
  speciesId: Id;
  displayName: string;
  defaultName: string;
  rarity: DinosaurSpeciesRarity;
  habitat: DinosaurHabitatId;
  eggCategory: DinosaurEggCategory;
  unlockSource: DinosaurUnlockSource;
  starterSelectable?: boolean;
  collectionOrder: number;
  personality: string;
  favoriteFoodName: string;
  silhouette: string;
}> = [
  { speciesId: 'tiny-tyranno', displayName: '티라노사우르스', defaultName: '용감한 티라노', rarity: 'common', habitat: 'green-forest', eggCategory: 'normal', unlockSource: 'normal-egg', starterSelectable: true, collectionOrder: 1, personality: '용감함', favoriteFoodName: '톡톡 고기볼', silhouette: '◆' },
  { speciesId: 'baby-tricera', displayName: '트리케라', defaultName: '튼튼한 트리케라', rarity: 'common', habitat: 'green-forest', eggCategory: 'normal', unlockSource: 'normal-egg', starterSelectable: true, collectionOrder: 2, personality: '든든함', favoriteFoodName: '바삭 잎사귀', silhouette: '▲' },
  { speciesId: 'plate-stego', displayName: '스테고', defaultName: '반짝 스테고', rarity: 'common', habitat: 'green-forest', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 3, personality: '차분함', favoriteFoodName: '말랑 열매', silhouette: '★' },
  { speciesId: 'parasaurolophus', displayName: '파라사우롤로푸스', defaultName: '노래 파라사우', rarity: 'special', habitat: 'green-forest', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 4, personality: '다정함', favoriteFoodName: '숲 열매', silhouette: '♪' },
  { speciesId: 'armor-ankylo', displayName: '안킬로', defaultName: '철갑 안킬로', rarity: 'special', habitat: 'green-forest', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 5, personality: '꾸준함', favoriteFoodName: '단단 견과', silhouette: '■' },
  { speciesId: 'green-forest-rare', displayName: '초록 숲 희귀 공룡', defaultName: '초록 숲 수호자', rarity: 'rare', habitat: 'green-forest', eggCategory: 'rare', unlockSource: 'rare-egg', collectionOrder: 6, personality: '신비로움', favoriteFoodName: '빛나는 잎', silhouette: '◇' },
  { speciesId: 'long-brachio', displayName: '브라키오', defaultName: '느긋한 브라키오', rarity: 'common', habitat: 'sparkle-cave', eggCategory: 'normal', unlockSource: 'normal-egg', starterSelectable: true, collectionOrder: 7, personality: '느긋함', favoriteFoodName: '높은 나뭇잎', silhouette: '│' },
  { speciesId: 'allosaurus', displayName: '알로사우루스', defaultName: '날쌘 알로', rarity: 'common', habitat: 'sparkle-cave', eggCategory: 'normal', unlockSource: 'normal-egg', starterSelectable: true, collectionOrder: 8, personality: '날쌤', favoriteFoodName: '알록 고기볼', silhouette: 'A' },
  { speciesId: 'pachycephalosaurus', displayName: '파키케팔로', defaultName: '단단 파키', rarity: 'common', habitat: 'sparkle-cave', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 9, personality: '씩씩함', favoriteFoodName: '둥근 열매', silhouette: '●' },
  { speciesId: 'dilophosaurus', displayName: '딜로포사우루스', defaultName: '반짝 딜로포', rarity: 'special', habitat: 'sparkle-cave', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 10, personality: '호기심 많음', favoriteFoodName: '동굴 젤리', silhouette: 'D' },
  { speciesId: 'iguanodon', displayName: '이구아노돈', defaultName: '차분한 이구아노돈', rarity: 'special', habitat: 'sparkle-cave', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 11, personality: '차분함', favoriteFoodName: '반짝 잎', silhouette: 'I' },
  { speciesId: 'sparkle-cave-rare', displayName: '반짝 동굴 희귀 공룡', defaultName: '동굴 별빛이', rarity: 'rare', habitat: 'sparkle-cave', eggCategory: 'rare', unlockSource: 'rare-egg', collectionOrder: 12, personality: '영리함', favoriteFoodName: '별빛 사탕', silhouette: '✦' },
  { speciesId: 'carnotaurus', displayName: '카르노타우루스', defaultName: '씩씩 카르노', rarity: 'common', habitat: 'volcano-island', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 13, personality: '당당함', favoriteFoodName: '뜨끈 고기볼', silhouette: 'C' },
  { speciesId: 'kentrosaurus', displayName: '켄트로사우루스', defaultName: '뾰족 켄트로', rarity: 'common', habitat: 'volcano-island', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 14, personality: '꼼꼼함', favoriteFoodName: '화산 잎', silhouette: 'K' },
  { speciesId: 'dimetrodon', displayName: '디메트로돈', defaultName: '돛단 디메트로', rarity: 'common', habitat: 'volcano-island', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 15, personality: '느긋함', favoriteFoodName: '따뜻한 열매', silhouette: 'M' },
  { speciesId: 'spinosaurus', displayName: '스피노사우루스', defaultName: '물결 스피노', rarity: 'special', habitat: 'volcano-island', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 16, personality: '집중함', favoriteFoodName: '물결 젤리', silhouette: 'S' },
  { speciesId: 'therizinosaurus', displayName: '테리지노사우루스', defaultName: '긴손 테리지노', rarity: 'special', habitat: 'volcano-island', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 17, personality: '섬세함', favoriteFoodName: '긴 잎사귀', silhouette: 'T' },
  { speciesId: 'volcano-island-rare', displayName: '화산섬 희귀 공룡', defaultName: '화산 불꽃이', rarity: 'rare', habitat: 'volcano-island', eggCategory: 'rare', unlockSource: 'rare-egg', collectionOrder: 18, personality: '열정적', favoriteFoodName: '불꽃 사탕', silhouette: '△' },
  { speciesId: 'pteranodon', displayName: '프테라노돈', defaultName: '하늘 프테라', rarity: 'common', habitat: 'secret-land', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 19, personality: '자유로움', favoriteFoodName: '구름 젤리', silhouette: '⌁' },
  { speciesId: 'diplodocus', displayName: '디플로도쿠스', defaultName: '길쭉 디플로', rarity: 'common', habitat: 'secret-land', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 20, personality: '온화함', favoriteFoodName: '부드러운 잎', silhouette: 'L' },
  { speciesId: 'swift-raptor', displayName: '벨로시랩터', defaultName: '번개 벨로시랩터', rarity: 'common', habitat: 'secret-land', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 21, personality: '재빠름', favoriteFoodName: '번개 사탕', silhouette: '!' },
  { speciesId: 'plesiosaurus', displayName: '플레시오사우루스', defaultName: '물빛 플레시오', rarity: 'special', habitat: 'secret-land', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 22, personality: '우아함', favoriteFoodName: '물방울 젤리', silhouette: 'P' },
  { speciesId: 'mosasaurus', displayName: '모사사우루스', defaultName: '깊은 바다 모사', rarity: 'special', habitat: 'secret-land', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 23, personality: '대담함', favoriteFoodName: '바다 고기볼', silhouette: 'W' },
  { speciesId: 'secret-land-rare', displayName: '비밀의 땅 희귀 공룡', defaultName: '비밀 별지기', rarity: 'rare', habitat: 'secret-land', eggCategory: 'rare', unlockSource: 'rare-egg', collectionOrder: 24, personality: '신중함', favoriteFoodName: '비밀 열매', silhouette: '?' },
];

export const dinosaurSpecies: DinosaurSpecies[] = speciesDrafts.map((species) => ({
  ...species,
  name: species.defaultName,
  habitatOrder: habitatOrderById[species.habitat],
  starterSelectable: species.starterSelectable ?? false,
  description: `${species.displayName}은 주산훈련 모험에서 만날 수 있는 공룡이에요.`,
  dexDescription: `${species.displayName}은 도감 ${species.collectionOrder}번째 슬롯의 공룡이에요.`,
  discoveryHint: `${species.displayName}의 발자국이 도감에 남아 있어요.`,
  foundMethodLabel: species.starterSelectable ? '첫 공룡으로 선택 가능' : eggCategoryFoundMethod[species.eggCategory],
  unlockHint: species.starterSelectable ? '첫 공룡으로 고르거나 일반알에서 만날 수 있어요.' : eggCategoryUnlockHint[species.eggCategory],
  status: 'available',
}));

export function getDinosaurSpecies(speciesId: Id) {
  return dinosaurSpecies.find((species) => species.speciesId === speciesId) ?? null;
}

export function getStarterSelectableSpecies() {
  return dinosaurSpecies.filter((species) => species.starterSelectable === true && !species.isPlaceholder && species.status !== 'planned' && species.status !== 'locked' && species.eggCategory === 'normal');
}
