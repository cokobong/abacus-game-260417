import type { Id, OwnedDinosaur } from '../types/game';
import { dinosaurCharacterAssets, type DinosaurCharacterImages } from '../assets/dex/dinosaurs';

export type DinosaurSpeciesRarity = OwnedDinosaur['rarity'];
export type DinosaurUnlockSource = 'normal-egg' | 'special-egg' | 'rare-egg' | 'adventure-fragment' | 'planned';
export type DinosaurEggCategory = 'normal' | 'special' | 'rare';
export type DinosaurSpeciesStatus = 'available' | 'planned' | 'locked';
export type DinosaurDiet = 'herbivore' | 'carnivore' | 'omnivore';

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
  diet: DinosaurDiet;
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
  themeLabel?: string;
  characterAsset?: string;
  images?: DinosaurCharacterImages;
  homeScale: number;
  homeOffsetX: number;
  homeOffsetY: number;
  cardScale: number;
  cardOffsetX: number;
  cardOffsetY: number;
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

type DinosaurPresentation = Pick<
  DinosaurSpecies,
  'characterAsset' | 'images' | 'homeScale' | 'homeOffsetX' | 'homeOffsetY' | 'cardScale' | 'cardOffsetX' | 'cardOffsetY'
>;

const defaultDinosaurPresentation: DinosaurPresentation = {
  homeScale: 1,
  homeOffsetX: 0,
  homeOffsetY: 0,
  cardScale: 1,
  cardOffsetX: 0,
  cardOffsetY: 0,
};

const dinosaurPresentationBySpeciesId: Partial<Record<Id, DinosaurPresentation>> = {
  allosaurus: {
    images: dinosaurCharacterAssets.allosaurus,
    homeScale: 1,
    homeOffsetX: 0,
    homeOffsetY: 0,
    cardScale: 1,
    cardOffsetX: 0,
    cardOffsetY: 0,
  },
  'tiny-tyranno': {
    images: dinosaurCharacterAssets.trex,
    homeScale: 1,
    homeOffsetX: 0,
    homeOffsetY: 0,
    cardScale: 1,
    cardOffsetX: 0,
    cardOffsetY: 0,
  },
  'baby-tricera': {
    images: dinosaurCharacterAssets.tricera,
    homeScale: 1.06,
    homeOffsetX: -2,
    homeOffsetY: 0,
    cardScale: 1.04,
    cardOffsetX: -1,
    cardOffsetY: 0,
  },
  'plate-stego': {
    images: dinosaurCharacterAssets.stego,
    homeScale: 1.12,
    homeOffsetX: -4,
    homeOffsetY: 4,
    cardScale: 1.1,
    cardOffsetX: -3,
    cardOffsetY: 2,
  },
  'long-brachio': {
    images: dinosaurCharacterAssets.brachio,
    homeScale: 1.02,
    homeOffsetX: -2,
    homeOffsetY: 0,
    cardScale: 1.02,
    cardOffsetX: -1,
    cardOffsetY: 0,
  },
};

const dinosaurImagesBySpeciesId: Partial<Record<Id, DinosaurCharacterImages>> = {
  'tiny-tyranno': dinosaurCharacterAssets.trex,
  'baby-tricera': dinosaurCharacterAssets.tricera,
  'plate-stego': dinosaurCharacterAssets.stego,
  parasaurolophus: dinosaurCharacterAssets.parasauro,
  'armor-ankylo': dinosaurCharacterAssets.ankylo,
  leafcera: dinosaurCharacterAssets.leafcera,
  'long-brachio': dinosaurCharacterAssets.brachio,
  allosaurus: dinosaurCharacterAssets.allosaurus,
  pachycephalosaurus: dinosaurCharacterAssets.pachy,
  dilophosaurus: dinosaurCharacterAssets.dilophosaurus,
  iguanodon: dinosaurCharacterAssets.iguanodon,
  crystalo: dinosaurCharacterAssets.crystalo,
  carnotaurus: dinosaurCharacterAssets.carnotaurus,
  kentrosaurus: dinosaurCharacterAssets.kentrosaurus,
  dimetrodon: dinosaurCharacterAssets.dimetrodon,
  spinosaurus: dinosaurCharacterAssets.spino,
  therizinosaurus: dinosaurCharacterAssets.therizino,
  volcanodon: dinosaurCharacterAssets.volcanodon,
  pteranodon: dinosaurCharacterAssets.pteranodon,
  diplodocus: dinosaurCharacterAssets.diplodocus,
  'swift-raptor': dinosaurCharacterAssets.velociraptor,
  'distortus-rex': dinosaurCharacterAssets.distortusRex,
  'indominus-rex': dinosaurCharacterAssets.indominusRex,
  starano: dinosaurCharacterAssets.starano,
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

const discoveryHintBySpeciesId: Record<Id, string> = {
  'tiny-tyranno': '숲속에서 크고 힘찬 발자국이 발견됐어요.',
  'baby-tricera': '숲길에 뾰족한 흔적이 여러 개 남아 있어요.',
  'plate-stego': '나무 사이에서 넓적한 흔적이 반짝였어요.',
  parasaurolophus: '숲 깊은 곳에서 부드러운 울음소리가 들려요.',
  'armor-ankylo': '숲길에 단단한 갑옷 같은 흔적이 남아 있어요.',
  leafcera: '초록 숲의 가장 조용한 나무 아래에 숨어 있다는 소문이 있어요.',
  'long-brachio': '동굴 높은 곳의 잎사귀가 사라졌어요.',
  allosaurus: '동굴 바닥에 빠르게 달린 발자국이 이어져 있어요.',
  pachycephalosaurus: '동굴 벽에 둥글고 단단한 자국이 남아 있어요.',
  dilophosaurus: '반짝이는 동굴 안에서 작은 움직임이 보여요.',
  iguanodon: '동굴의 조용한 길에 가지런한 발자국이 있어요.',
  crystalo: '동굴 안에서 반짝이는 소리가 들려요.',
  carnotaurus: '화산섬에 힘차게 걸어간 흔적이 남아 있어요.',
  kentrosaurus: '화산섬 길가에서 뾰족한 흔적이 발견됐어요.',
  dimetrodon: '따뜻한 바위에 넓은 그림자가 비쳤어요.',
  spinosaurus: '화산섬 물가에서 커다란 물결이 일었어요.',
  therizinosaurus: '나뭇잎에 길고 가느다란 자국이 남아 있어요.',
  volcanodon: '뜨거운 용암 근처보다 따뜻한 바위 위에서 쉬는 걸 좋아해요.',
  pteranodon: '비밀의 땅 하늘에 커다란 그림자가 지나갔어요.',
  diplodocus: '비밀의 땅에 길게 이어진 흔적이 남아 있어요.',
  'swift-raptor': '눈 깜짝할 사이에 지나간 발자국이 보여요.',
  'distortus-rex': '비밀 연구소 근처에 커다란 발자국과 여러 갈래 자국이 남아 있어요.',
  'indominus-rex': '비밀 연구소 울타리에 거대한 발톱 자국이 남아 있어요.',
  starano: '별이 가장 많이 보이는 밤에 모습을 드러낸다는 이야기가 있어요.',
};

const kidFriendlyDexDescriptions: Record<Id, string> = {
  'tiny-tyranno': '티라노사우루스는 힘이 세고 용감한 친구예요. 친구를 지킬 때는 든든하지만, 맛있는 고기를 보면 금방 웃어요.',
  'baby-tricera': '트리케라는 큰 뿔로 친구들을 지켜주는 든든한 공룡이에요. 천천히 생각하고, 한 번 마음먹으면 끝까지 해내요.',
  'plate-stego': '스테고는 등에 멋진 골판이 있는 차분한 공룡이에요. 햇볕 아래에서 쉬며 친구들을 조용히 지켜봐요.',
  parasaurolophus: '파라사우롤로푸스는 노래하듯 부드러운 소리를 내는 친구예요. 기분 좋은 멜로디로 모두를 편안하게 해줘요.',
  'armor-ankylo': '안킬로는 단단한 갑옷을 입은 것처럼 튼튼한 공룡이에요. 느리지만 꾸준해서 친구들이 믿고 따라요.',
  leafcera: '리프케라는 잎사귀처럼 예쁜 뿔을 가진 신비한 친구예요. 숲길을 살금살금 걸으며 작은 새싹을 돌봐요.',
  'long-brachio': '브라키오는 긴 목으로 높은 나뭇잎도 쉽게 먹어요. 느긋하고 상냥해서 작은 친구들에게 인기가 많아요.',
  allosaurus: '알로사우루스는 달리기를 좋아하는 날쌘 공룡이에요. 빨리 움직이지만 친구를 놀라게 하지 않으려고 조심해요.',
  pachycephalosaurus: '파키케팔로는 동그란 머리가 자랑인 씩씩한 친구예요. 작은 일에도 포기하지 않고 다시 도전해요.',
  dilophosaurus: '딜로포사우루스는 반짝이는 동굴을 궁금해하는 호기심 많은 공룡이에요. 새로운 것을 보면 눈이 반짝반짝 빛나요.',
  iguanodon: '이구아노돈은 차분하게 생각하는 똑똑한 친구예요. 천천히 걸으며 좋은 길을 찾아내는 걸 잘해요.',
  crystalo: '크리스탈로는 수정처럼 반짝이는 꼬리를 가진 특별한 공룡이에요. 어두운 동굴에서도 친구들에게 길을 알려줘요.',
  carnotaurus: '카르노타우루스는 당당하게 걷는 씩씩한 공룡이에요. 처음 보는 길도 용기 내어 한 걸음씩 나아가요.',
  kentrosaurus: '켄트로사우루스는 뾰족한 가시를 가진 꼼꼼한 친구예요. 친구들이 다치지 않게 주변을 살피는 걸 좋아해요.',
  dimetrodon: '디메트로돈은 등에 멋진 돛을 펼친 느긋한 친구예요. 따뜻한 햇살을 받으며 쉬는 시간을 좋아해요.',
  spinosaurus: '스피노사우루스는 물가를 좋아하는 집중력 좋은 공룡이에요. 조용히 물결을 바라보며 생각을 모아요.',
  therizinosaurus: '테리지노사우루스는 긴 손을 가진 섬세한 친구예요. 나뭇잎을 조심조심 골라 친구들과 나누어 먹어요.',
  volcanodon: '불카노돈은 따뜻한 불꽃빛을 품은 열정적인 공룡이에요. 마음이 뜨거워서 친구를 응원하는 걸 좋아해요.',
  pteranodon: '프테라노돈은 하늘을 나는 걸 좋아하는 날쌘 친구예요. 멀리까지 날아가 새로운 길을 찾아와요.',
  diplodocus: '디플로도쿠스는 길고 부드러운 꼬리를 가진 온화한 공룡이에요. 느릿느릿 걸어도 언제나 친구 곁에 있어요.',
  'swift-raptor': '벨로시랩터는 번개처럼 빠르게 달리는 재빠른 친구예요. 장난을 좋아하지만 약속은 꼭 지켜요.',
  'distortus-rex': '디스토르투스 렉스는 티라노사우루스를 더 크게 만들려던 실험에서 태어난 돌연변이 크리처예요. 커다란 머리와 여섯 개의 팔다리로 무겁게 움직여요.',
  'indominus-rex': '인도미누스 렉스는 여러 동물의 특징을 모아 만든 거대하고 영리한 하이브리드 공룡이에요. 주변을 빠르게 살피고 숨어 움직이는 데 아주 능숙해요.',
  starano: '스타라노는 별빛 날개를 가진 조용하고 신중한 공룡이에요. 밤하늘을 보며 친구들의 소원을 들어줘요.',
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
  themeLabel?: string;
  description?: string;
  dexDescription?: string;
}> = [
  { speciesId: 'tiny-tyranno', displayName: '티라노사우르스', defaultName: '용감한 티라노', rarity: 'common', habitat: 'green-forest', eggCategory: 'normal', unlockSource: 'normal-egg', starterSelectable: true, collectionOrder: 1, personality: '용감함', favoriteFoodName: '톡톡 고기볼', silhouette: '◆' },
  { speciesId: 'baby-tricera', displayName: '트리케라', defaultName: '튼튼한 트리케라', rarity: 'common', habitat: 'green-forest', eggCategory: 'normal', unlockSource: 'normal-egg', starterSelectable: true, collectionOrder: 2, personality: '든든함', favoriteFoodName: '바삭 잎사귀', silhouette: '▲' },
  { speciesId: 'plate-stego', displayName: '스테고', defaultName: '반짝 스테고', rarity: 'common', habitat: 'green-forest', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 3, personality: '차분함', favoriteFoodName: '말랑 열매', silhouette: '★' },
  { speciesId: 'parasaurolophus', displayName: '파라사우롤로푸스', defaultName: '노래 파라사우', rarity: 'special', habitat: 'green-forest', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 4, personality: '다정함', favoriteFoodName: '숲 열매', silhouette: '♪' },
  { speciesId: 'armor-ankylo', displayName: '안킬로', defaultName: '철갑 안킬로', rarity: 'special', habitat: 'green-forest', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 5, personality: '꾸준함', favoriteFoodName: '단단 견과', silhouette: '■' },
  { speciesId: 'leafcera', displayName: '리프케라', defaultName: '리프케라', rarity: 'rare', habitat: 'green-forest', eggCategory: 'rare', unlockSource: 'rare-egg', collectionOrder: 6, personality: '신비로움', favoriteFoodName: '빛나는 잎', silhouette: '◇', themeLabel: '잎사귀 뿔 공룡', description: '초록 숲 깊은 곳에서만 만날 수 있는 나뭇잎 뿔을 가진 희귀 공룡이에요.', dexDescription: '초록 숲 깊은 곳에서만 만날 수 있는 나뭇잎 뿔 공룡이에요.' },
  { speciesId: 'long-brachio', displayName: '브라키오', defaultName: '느긋한 브라키오', rarity: 'common', habitat: 'sparkle-cave', eggCategory: 'normal', unlockSource: 'normal-egg', starterSelectable: true, collectionOrder: 7, personality: '느긋함', favoriteFoodName: '높은 나뭇잎', silhouette: '│' },
  { speciesId: 'allosaurus', displayName: '알로사우루스', defaultName: '날쌘 알로', rarity: 'common', habitat: 'sparkle-cave', eggCategory: 'normal', unlockSource: 'normal-egg', starterSelectable: true, collectionOrder: 8, personality: '날쌤', favoriteFoodName: '알록 고기볼', silhouette: 'A' },
  { speciesId: 'pachycephalosaurus', displayName: '파키케팔로', defaultName: '단단 파키', rarity: 'common', habitat: 'sparkle-cave', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 9, personality: '씩씩함', favoriteFoodName: '둥근 열매', silhouette: '●' },
  { speciesId: 'dilophosaurus', displayName: '딜로포사우루스', defaultName: '반짝 딜로포', rarity: 'special', habitat: 'sparkle-cave', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 10, personality: '호기심 많음', favoriteFoodName: '동굴 젤리', silhouette: 'D' },
  { speciesId: 'iguanodon', displayName: '이구아노돈', defaultName: '차분한 이구아노돈', rarity: 'special', habitat: 'sparkle-cave', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 11, personality: '차분함', favoriteFoodName: '반짝 잎', silhouette: 'I' },
  { speciesId: 'crystalo', displayName: '크리스탈로', defaultName: '크리스탈로', rarity: 'rare', habitat: 'sparkle-cave', eggCategory: 'rare', unlockSource: 'rare-egg', collectionOrder: 12, personality: '영리함', favoriteFoodName: '별빛 사탕', silhouette: '✦', themeLabel: '수정 꼬리 공룡', description: '반짝 동굴의 수정빛을 닮은 꼬리를 가진 희귀 공룡이에요.', dexDescription: '반짝 동굴의 수정빛을 닮은 꼬리를 가진 희귀 공룡이에요.' },
  { speciesId: 'carnotaurus', displayName: '카르노타우루스', defaultName: '씩씩 카르노', rarity: 'common', habitat: 'volcano-island', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 13, personality: '당당함', favoriteFoodName: '뜨끈 고기볼', silhouette: 'C' },
  { speciesId: 'kentrosaurus', displayName: '켄트로사우루스', defaultName: '뾰족 켄트로', rarity: 'common', habitat: 'volcano-island', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 14, personality: '꼼꼼함', favoriteFoodName: '화산 잎', silhouette: 'K' },
  { speciesId: 'dimetrodon', displayName: '디메트로돈', defaultName: '돛단 디메트로', rarity: 'common', habitat: 'volcano-island', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 15, personality: '느긋함', favoriteFoodName: '따뜻한 열매', silhouette: 'M' },
  { speciesId: 'spinosaurus', displayName: '스피노사우루스', defaultName: '물결 스피노', rarity: 'special', habitat: 'volcano-island', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 16, personality: '집중함', favoriteFoodName: '물결 젤리', silhouette: 'S' },
  { speciesId: 'therizinosaurus', displayName: '테리지노사우루스', defaultName: '긴손 테리지노', rarity: 'special', habitat: 'volcano-island', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 17, personality: '섬세함', favoriteFoodName: '긴 잎사귀', silhouette: 'T' },
  { speciesId: 'volcanodon', displayName: '불카노돈', defaultName: '불카노돈', rarity: 'rare', habitat: 'volcano-island', eggCategory: 'rare', unlockSource: 'rare-egg', collectionOrder: 18, personality: '열정적', favoriteFoodName: '불꽃 사탕', silhouette: '△', themeLabel: '불꽃 등 공룡', description: '화산섬의 따뜻한 불꽃을 등에 품은 희귀 공룡이에요.', dexDescription: '화산섬의 따뜻한 불꽃을 등에 품은 희귀 공룡이에요.' },
  { speciesId: 'pteranodon', displayName: '프테라노돈', defaultName: '하늘 프테라', rarity: 'common', habitat: 'secret-land', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 19, personality: '자유로움', favoriteFoodName: '구름 젤리', silhouette: '⌁' },
  { speciesId: 'diplodocus', displayName: '디플로도쿠스', defaultName: '길쭉 디플로', rarity: 'common', habitat: 'secret-land', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 20, personality: '온화함', favoriteFoodName: '부드러운 잎', silhouette: 'L' },
  { speciesId: 'swift-raptor', displayName: '벨로시랩터', defaultName: '번개 벨로시랩터', rarity: 'common', habitat: 'secret-land', eggCategory: 'normal', unlockSource: 'normal-egg', collectionOrder: 21, personality: '재빠름', favoriteFoodName: '번개 사탕', silhouette: '!' },
  { speciesId: 'distortus-rex', displayName: '디스토르투스 렉스', defaultName: 'D-렉스', rarity: 'special', habitat: 'secret-land', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 22, personality: '끈질김', favoriteFoodName: '특대 고기볼', silhouette: 'X', themeLabel: '돌연변이 티라노 크리처' },
  { speciesId: 'indominus-rex', displayName: '인도미누스 렉스', defaultName: 'I-렉스', rarity: 'special', habitat: 'secret-land', eggCategory: 'special', unlockSource: 'special-egg', collectionOrder: 23, personality: '영리함', favoriteFoodName: '거대 고기볼', silhouette: 'I' },
  { speciesId: 'starano', displayName: '스타라노', defaultName: '스타라노', rarity: 'rare', habitat: 'secret-land', eggCategory: 'rare', unlockSource: 'rare-egg', collectionOrder: 24, personality: '신중함', favoriteFoodName: '비밀 열매', silhouette: '?', themeLabel: '별빛 날개 공룡', description: '비밀의 땅 밤하늘에서 내려온 듯한 별빛 날개를 가진 희귀 공룡이에요.', dexDescription: '비밀의 땅 밤하늘에서 내려온 듯한 별빛 날개를 가진 희귀 공룡이에요.' },
];

const dinosaurDietBySpeciesId: Record<string, DinosaurDiet> = {
  'tiny-tyranno': 'carnivore',
  'baby-tricera': 'herbivore',
  'plate-stego': 'herbivore',
  parasaurolophus: 'herbivore',
  'armor-ankylo': 'herbivore',
  leafcera: 'herbivore',
  'long-brachio': 'herbivore',
  allosaurus: 'carnivore',
  pachycephalosaurus: 'herbivore',
  dilophosaurus: 'carnivore',
  iguanodon: 'herbivore',
  crystalo: 'omnivore',
  carnotaurus: 'carnivore',
  kentrosaurus: 'herbivore',
  dimetrodon: 'carnivore',
  spinosaurus: 'carnivore',
  therizinosaurus: 'omnivore',
  volcanodon: 'herbivore',
  pteranodon: 'carnivore',
  diplodocus: 'herbivore',
  'swift-raptor': 'carnivore',
  'distortus-rex': 'carnivore',
  'indominus-rex': 'carnivore',
  starano: 'omnivore',
};

export const dinosaurSpecies: DinosaurSpecies[] = speciesDrafts.map((species) => {
  const images = dinosaurImagesBySpeciesId[species.speciesId];

  return {
    ...species,
    ...defaultDinosaurPresentation,
    ...dinosaurPresentationBySpeciesId[species.speciesId],
    images,
    characterAsset: images?.baby,
    diet: dinosaurDietBySpeciesId[species.speciesId],
    name: species.defaultName,
    habitatOrder: habitatOrderById[species.habitat],
    starterSelectable: species.starterSelectable ?? false,
    description: kidFriendlyDexDescriptions[species.speciesId] ?? species.description ?? `${species.displayName}은 주산훈련 모험에서 만날 수 있는 공룡이에요.`,
    dexDescription: kidFriendlyDexDescriptions[species.speciesId] ?? species.dexDescription ?? `${species.displayName}은 도감 ${species.collectionOrder}번째 슬롯의 공룡이에요.`,
    discoveryHint: discoveryHintBySpeciesId[species.speciesId],
    foundMethodLabel: species.starterSelectable ? '첫 공룡으로 선택 가능' : eggCategoryFoundMethod[species.eggCategory],
    unlockHint: species.starterSelectable ? '첫 공룡으로 고르거나 일반알에서 만날 수 있어요.' : eggCategoryUnlockHint[species.eggCategory],
    status: 'available',
  };
});

export function getDinosaurSpecies(speciesId: Id) {
  return dinosaurSpecies.find((species) => species.speciesId === speciesId) ?? null;
}

export function getStarterSelectableSpecies() {
  return dinosaurSpecies.filter((species) => species.starterSelectable === true && !species.isPlaceholder && species.status !== 'planned' && species.status !== 'locked' && species.eggCategory === 'normal');
}
