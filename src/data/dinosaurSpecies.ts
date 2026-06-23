import type { Id, OwnedDinosaur } from '../types/game';

export type DinosaurSpeciesRarity = OwnedDinosaur['rarity'];

export interface DinosaurSpecies {
  speciesId: Id;
  name: string;
  defaultName: string;
  displayName: string;
  rarity: DinosaurSpeciesRarity;
  description: string;
  silhouette: string;
  unlockHint: string;
}

export const dinosaurSpecies: DinosaurSpecies[] = [
  {
    speciesId: 'green-little',
    name: '초록 꼬마',
    defaultName: '초록 꼬마',
    displayName: '초록 꼬마',
    rarity: 'common',
    description: '처음 모험을 함께 시작하는 밝고 호기심 많은 공룡이에요.',
    silhouette: '?',
    unlockHint: '처음 대표 공룡으로 만날 수 있어요.',
  },
  {
    speciesId: 'baby-tricera',
    name: '아기 트리케라',
    defaultName: '아기 트리케라',
    displayName: '트리케라',
    rarity: 'common',
    description: '단단한 뿔과 큰 프릴을 가진 든든한 친구예요.',
    silhouette: '?',
    unlockHint: '알을 부화시키면 만날 수 있어요.',
  },
  {
    speciesId: 'tiny-tyranno',
    name: '꼬마 티라노',
    defaultName: '꼬마 티라노',
    displayName: '티라노',
    rarity: 'rare',
    description: '용감한 성격으로 어려운 문제 앞에서도 씩씩해요.',
    silhouette: '?',
    unlockHint: '훈련으로 알 게이지를 모아 부화시켜 보세요.',
  },
  {
    speciesId: 'long-brachio',
    name: '롱롱 브라키오',
    defaultName: '롱롱 브라키오',
    displayName: '브라키오',
    rarity: 'rare',
    description: '긴 목으로 멀리 있는 반짝 보상도 잘 찾아내요.',
    silhouette: '?',
    unlockHint: '새 알 부화 보상으로 등장할 예정이에요.',
  },
  {
    speciesId: 'plate-stego',
    name: '반짝 스테고',
    defaultName: '반짝 스테고',
    displayName: '스테고',
    rarity: 'common',
    description: '등의 골판이 기분에 따라 반짝이는 차분한 공룡이에요.',
    silhouette: '?',
    unlockHint: '알을 부화시키면 만날 수 있어요.',
  },
  {
    speciesId: 'sky-ptera',
    name: '하늘 프테라',
    defaultName: '하늘 프테라',
    displayName: '프테라',
    rarity: 'epic',
    description: '하늘을 가르는 빠른 날갯짓으로 모험 소식을 가져와요.',
    silhouette: '?',
    unlockHint: '희귀한 알에서 만날 수 있을지도 몰라요.',
  },
  {
    speciesId: 'armor-ankylo',
    name: '철갑 안킬로',
    defaultName: '철갑 안킬로',
    displayName: '안킬로',
    rarity: 'rare',
    description: '단단한 갑옷처럼 꾸준함을 좋아하는 믿음직한 공룡이에요.',
    silhouette: '?',
    unlockHint: '훈련과 부화를 계속 이어가면 발견할 수 있어요.',
  },
  {
    speciesId: 'swift-raptor',
    name: '번개 랩터',
    defaultName: '번개 랩터',
    displayName: '랩터',
    rarity: 'epic',
    description: '빠른 발과 날카로운 집중력으로 콤보 훈련을 좋아해요.',
    silhouette: '?',
    unlockHint: '특별한 알 부화 보상으로 준비 중이에요.',
  },
];

export function getDinosaurSpecies(speciesId: Id) {
  return dinosaurSpecies.find((species) => species.speciesId === speciesId) ?? null;
}
