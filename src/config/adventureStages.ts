export interface AdventureStageConfig {
  stage: number;
  title: string;
  instruction: string;
  theme: 'lava' | 'sky';
}

export const SKY_ISLAND_STAGE_CONFIG: AdventureStageConfig = {
  stage: 1,
  title: '하늘섬',
  instruction: '위·아래로 피하고, 부스트로 위험을 한 번 막아요!',
  theme: 'sky',
};

export const LAVA_VALLEY_STAGE_CONFIG: AdventureStageConfig = {
  stage: 1,
  title: '용암계곡',
  instruction: '점프 버튼을 눌러 장애물을 피해요!',
  theme: 'lava',
};
