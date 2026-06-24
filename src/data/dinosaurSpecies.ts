import type { Id, OwnedDinosaur } from '../types/game';

export type DinosaurSpeciesRarity = OwnedDinosaur['rarity'];

export interface DinosaurSpecies {
  speciesId: Id;
  name: string;
  defaultName: string;
  displayName: string;
  rarity: DinosaurSpeciesRarity;
  description: string;
  dexDescription: string;
  personality: string;
  favoriteFoodName: string;
  habitat: DinosaurHabitatId;
  discoveryHint: string;
  foundMethodLabel: string;
  silhouette: string;
  unlockHint: string;
}

export type DinosaurHabitatId = 'green-forest' | 'sparkle-cave' | 'volcano-island' | 'secret-land';

export const dinosaurSpecies: DinosaurSpecies[] = [
  {
    speciesId: 'green-little',
    name: '초록 꼬마',
    defaultName: '초록 꼬마',
    displayName: '초록 꼬마',
    rarity: 'common',
    description: '처음 모험을 함께 시작하는 밝고 호기심 많은 공룡이에요.',
    dexDescription: '작은 발걸음으로도 씩씩하게 앞으로 나아가는 밝은 공룡이에요.',
    personality: '호기심 많음',
    favoriteFoodName: '말랑 열매',
    habitat: 'green-forest',
    discoveryHint: '초록 잎사귀 사이에서 반짝이는 눈을 가진 친구예요.',
    foundMethodLabel: '처음 대표 공룡으로 만남',
    silhouette: '●',
    unlockHint: '처음 대표 공룡으로 만날 수 있어요.',
  },
  {
    speciesId: 'baby-tricera',
    name: '아기 트리케라',
    defaultName: '아기 트리케라',
    displayName: '트리케라',
    rarity: 'common',
    description: '단단한 뿔과 큰 프릴을 가진 든든한 친구예요.',
    dexDescription: '작은 뿔로 길을 살피며 친구들을 지켜주는 든든한 공룡이에요.',
    personality: '든든함',
    favoriteFoodName: '바삭 잎사귀',
    habitat: 'green-forest',
    discoveryHint: '둥근 프릴과 작은 뿔이 보이는 친구 같아요.',
    foundMethodLabel: '알에서 태어남',
    silhouette: '▲',
    unlockHint: '알을 부화시키면 만날 수 있어요.',
  },
  {
    speciesId: 'tiny-tyranno',
    name: '꼬마 티라노',
    defaultName: '꼬마 티라노',
    displayName: '티라노',
    rarity: 'rare',
    description: '용감한 성격으로 어려운 문제 앞에서도 씩씩해요.',
    dexDescription: '어려운 문제 앞에서도 꼬리를 번쩍 들고 도전하는 용감한 공룡이에요.',
    personality: '용감함',
    favoriteFoodName: '톡톡 고기볼',
    habitat: 'sparkle-cave',
    discoveryHint: '작은 이빨과 씩씩한 꼬리가 보이는 친구예요.',
    foundMethodLabel: '희귀 알에서 태어남',
    silhouette: '◆',
    unlockHint: '훈련으로 알 게이지를 모아 부화시켜 보세요.',
  },
  {
    speciesId: 'long-brachio',
    name: '롱롱 브라키오',
    defaultName: '롱롱 브라키오',
    displayName: '브라키오',
    rarity: 'rare',
    description: '긴 목으로 멀리 있는 반짝 보상도 잘 찾아내요.',
    dexDescription: '긴 목으로 숲 너머를 바라보며 새로운 길을 찾아주는 공룡이에요.',
    personality: '느긋함',
    favoriteFoodName: '높은 나뭇잎',
    habitat: 'green-forest',
    discoveryHint: '아주 긴 목이 나무 위로 빼꼼 보일지도 몰라요.',
    foundMethodLabel: '알 부화 보상으로 만남',
    silhouette: '│',
    unlockHint: '새 알 부화 보상으로 등장할 예정이에요.',
  },
  {
    speciesId: 'plate-stego',
    name: '반짝 스테고',
    defaultName: '반짝 스테고',
    displayName: '스테고',
    rarity: 'common',
    description: '등의 골판이 기분에 따라 반짝이는 차분한 공룡이에요.',
    dexDescription: '등의 골판이 기분에 따라 살짝 반짝이는 차분한 공룡이에요.',
    personality: '차분함',
    favoriteFoodName: '말랑 열매',
    habitat: 'green-forest',
    discoveryHint: '등에 반짝이는 무늬가 있는 공룡 같아요.',
    foundMethodLabel: '초록 알에서 태어남',
    silhouette: '★',
    unlockHint: '알을 부화시키면 만날 수 있어요.',
  },
  {
    speciesId: 'sky-ptera',
    name: '하늘 프테라',
    defaultName: '하늘 프테라',
    displayName: '프테라',
    rarity: 'epic',
    description: '하늘을 가르는 빠른 날갯짓으로 모험 소식을 가져와요.',
    dexDescription: '반짝이는 바람을 타고 날아와 새로운 소식을 전해주는 공룡이에요.',
    personality: '자유로움',
    favoriteFoodName: '구름 젤리',
    habitat: 'sparkle-cave',
    discoveryHint: '날개 그림자가 머리 위를 지나간 것 같아요.',
    foundMethodLabel: '희귀한 알에서 태어남',
    silhouette: '⌁',
    unlockHint: '희귀한 알에서 만날 수 있을지도 몰라요.',
  },
  {
    speciesId: 'armor-ankylo',
    name: '철갑 안킬로',
    defaultName: '철갑 안킬로',
    displayName: '안킬로',
    rarity: 'rare',
    description: '단단한 갑옷처럼 꾸준함을 좋아하는 믿음직한 공룡이에요.',
    dexDescription: '단단한 갑옷을 입은 것처럼 천천히, 끝까지 해내는 공룡이에요.',
    personality: '꾸준함',
    favoriteFoodName: '단단 견과',
    habitat: 'volcano-island',
    discoveryHint: '등이 울퉁불퉁하고 꼬리가 묵직한 친구예요.',
    foundMethodLabel: '알 부화로 만남',
    silhouette: '■',
    unlockHint: '훈련과 부화를 계속 이어가면 발견할 수 있어요.',
  },
  {
    speciesId: 'swift-raptor',
    name: '번개 랩터',
    defaultName: '번개 랩터',
    displayName: '랩터',
    rarity: 'epic',
    description: '빠른 발과 날카로운 집중력으로 콤보 훈련을 좋아해요.',
    dexDescription: '번개처럼 빠르게 달리며 반짝이는 집중력을 보여주는 공룡이에요.',
    personality: '재빠름',
    favoriteFoodName: '번개 사탕',
    habitat: 'secret-land',
    discoveryHint: '발자국이 너무 빨라서 반짝 선만 남았어요.',
    foundMethodLabel: '특별한 알에서 태어남',
    silhouette: '!',
    unlockHint: '특별한 알 부화 보상으로 준비 중이에요.',
  },
];

export function getDinosaurSpecies(speciesId: Id) {
  return dinosaurSpecies.find((species) => species.speciesId === speciesId) ?? null;
}
