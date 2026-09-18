export const ICE_PROTOTYPE = {
  durationSeconds: 80,
  width: 650,
  height: 720,
  groundY: 530,
  upperY: 290,
  ladderX: 310,
  playerSpeed: 170,
  productSpeed: 17,
  interactionDistance: 66,
  playerAssetKey: 'ice-prototype-explorer',
  playerAssetUrl: null as string | null, // Supply the child's sprite URL here to replace the vector explorer.
} as const;

export type IceAction = 'left' | 'right' | 'up' | 'down' | 'toolRepair' | 'toolHeat' | 'toolElectric';
export type IceIssue = 'jam' | 'frozen' | 'power' | 'penguin';

export const ICE_ISSUES: Record<Exclude<IceIssue, 'penguin'>, { x: number; floor: 1 | 2; action: IceAction; label: string }> = {
  jam: { x: 170, floor: 1, action: 'toolRepair', label: '컨베이어 막힘' },
  frozen: { x: 430, floor: 2, action: 'toolHeat', label: '해빙기 동결' },
  power: { x: 550, floor: 2, action: 'toolElectric', label: '전원 문제' },
};
