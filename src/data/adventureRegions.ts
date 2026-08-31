export type AdventureRegionStatus = 'available' | 'comingSoon' | 'locked';

export interface AdventureRegion {
  id: string;
  name: string;
  description: string;
  status: AdventureRegionStatus;
  position: {
    x: number;
    y: number;
  };
  gameId?: string;
}

export const adventureRegions: AdventureRegion[] = [
  {
    id: 'lava-valley',
    name: '용암 계곡',
    description: '징검다리를 건너 보물을 찾아요',
    status: 'available',
    position: { x: 27, y: 49 },
    gameId: 'lava-stepping-stones',
  },
  {
    id: 'sky-island',
    name: '하늘섬',
    description: '구름 위의 비밀을 찾아요',
    status: 'available',
    position: { x: 76, y: 22 },
    gameId: 'sky-number-clouds',
  },
  {
    id: 'number-ruins',
    name: '숫자 유적',
    description: '고대 숫자의 비밀을 풀어요',
    status: 'comingSoon',
    position: { x: 76, y: 68 },
  },
];
