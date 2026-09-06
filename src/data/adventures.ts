import type { DinosaurHabitatId } from './dinosaurSpecies';

export type AdventureAreaStatus = 'ready' | 'locked' | 'coming-soon';
export type AdventureEntryCost = {
  type: 'coin' | 'ticket' | 'free';
  amount: number;
};

export type AdventureRewardCandidate = {
  type: 'coin' | 'food' | 'hatchItem' | 'fragment' | 'dexHint';
  itemId?: string;
  amount: number;
  label: string;
};

export type AdventureArea = {
  id: string;
  title: string;
  summary: string;
  status: AdventureAreaStatus;
  entryCost: AdventureEntryCost;
  entryLabel: string;
  entryNote?: string;
  rewardCandidates: AdventureRewardCandidate[];
  unlockLabel?: string;
  habitat?: DinosaurHabitatId | 'cloud-hill';
};

export const adventureAreas: AdventureArea[] = [
  {
    id: 'forest-walk',
    title: '숲길 산책',
    summary: '초록 숲길을 걸으며 작은 보물을 찾아봐요.',
    status: 'ready',
    entryCost: {
      type: 'free',
      amount: 0,
    },
    entryLabel: '무료 탐험',
    entryNote: '테스트용 무료 지역이에요.',
    habitat: 'ancient-ruins',
    rewardCandidates: [
      { type: 'coin', amount: 20, label: '코인 +20' },
      { type: 'food', itemId: 'soft-berry', amount: 1, label: '말랑 열매 x1' },
      { type: 'fragment', itemId: 'rare-egg-fragment', amount: 1, label: '희귀알 조각 x1' },
    ],
  },
  {
    id: 'sparkle-river',
    title: '반짝 강가',
    summary: '물가에 반짝이는 조각과 도감 단서가 숨어 있어요.',
    status: 'ready',
    entryCost: {
      type: 'free',
      amount: 0,
    },
    entryLabel: '모험 티켓 1개 필요',
    entryNote: '티켓 지급 전까지 무료 테스트로 열려 있어요.',
    habitat: 'sky-island',
    unlockLabel: '훈련 1세트 후 입장 예정',
    rewardCandidates: [
      { type: 'hatchItem', itemId: 'hatch-warm-stone', amount: 1, label: '따뜻한 돌멩이 x1' },
      { type: 'fragment', itemId: 'rare-egg-fragment', amount: 1, label: '희귀알 조각 x1' },
      { type: 'dexHint', amount: 1, label: '도감 힌트 x1' },
    ],
  },
  {
    id: 'cloud-hill',
    title: '구름 언덕',
    summary: '아직 멀리 있는 신비한 언덕이에요.',
    status: 'coming-soon',
    entryCost: {
      type: 'ticket',
      amount: 1,
    },
    entryLabel: '추후 공개',
    entryNote: '희귀 단서 지역으로 준비 중이에요.',
    habitat: 'cloud-hill',
    unlockLabel: '추후 공개',
    rewardCandidates: [{ type: 'dexHint', amount: 1, label: '희귀 단서 x1' }],
  },
];
