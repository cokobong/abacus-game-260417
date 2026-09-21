export type IceMachineId = 'generator' | 'conveyor' | 'heater';
export type IcePenguinMachineId = 'relay' | 'pump';
export type IceLayer = 'lower' | 'upper';
export type IceRunPhase = 'playing' | 'clear' | 'failure';
export interface IceStage1State {
  phase: IceRunPhase;
  elapsedSeconds: number;
  produced: number;
  productionProgress: number;
  activeIssue: IceMachineId | null;
  penguinAt: IcePenguinMachineId | null;
  issueIndex: number;
  nextIssueAt: number;
  stalledSeconds: number;
  repaired: number;
}

export const ICE_STAGE_1 = {
  worldWidth: 1920,
  viewportWidth: 768,
  lowerPlayerY: 670,
  upperPlayerY: 505,
  upperLeft: 395,
  upperRight: 1530,
  ladders: [480, 960, 1440],
  ladderRadius: 78,
  target: 20,
  secondsPerProduct: 2.8,
  penguinProductionMultiplier: 2,
  firstIssueAt: 9,
  nextIssueDelay: 10,
  failureAfterStoppedSeconds: 36,
  interactionRange: 105,
  playerSpeed: 330,
  machines: [
    { id: 'generator', name: '발전기', x: 180, layer: 'lower' },
    { id: 'conveyor', name: '컨베이어', x: 1040, layer: 'lower' },
    { id: 'relay', name: '운반 제어기', x: 1530, layer: 'lower' },
    { id: 'heater', name: '히터', x: 675, layer: 'upper' },
    { id: 'pump', name: '가공 작업대', x: 1330, layer: 'upper' },
  ],
  issueOrder: ['generator', 'conveyor', 'heater', 'penguin'] as const,
  issueLabels: { generator: '켜기', conveyor: '치우기', heater: '녹이기' },
} as const;

export function iceLadderAt(x: number): number | null {
  return ICE_STAGE_1.ladders.find(point => Math.abs(point - x) <= ICE_STAGE_1.ladderRadius) ?? null;
}

export function createIceStage1State(): IceStage1State {
  return { phase: 'playing', elapsedSeconds: 0, produced: 0, productionProgress: 0, activeIssue: null, penguinAt: null, issueIndex: 0, nextIssueAt: ICE_STAGE_1.firstIssueAt, stalledSeconds: 0, repaired: 0 };
}

export function advanceIceStage1(state: IceStage1State, seconds: number, random: () => number = Math.random): IceStage1State {
  if (state.phase !== 'playing' || seconds <= 0) return state;
  const elapsedSeconds = state.elapsedSeconds + seconds;
  if (state.activeIssue) {
    const stalledSeconds = state.stalledSeconds + seconds;
    return { ...state, elapsedSeconds, stalledSeconds, phase: stalledSeconds >= ICE_STAGE_1.failureAfterStoppedSeconds ? 'failure' : 'playing' };
  }
  const productSeconds = ICE_STAGE_1.secondsPerProduct * (state.penguinAt ? ICE_STAGE_1.penguinProductionMultiplier : 1);
  const totalProgress = state.productionProgress + seconds / productSeconds;
  const newProducts = Math.floor(totalProgress);
  const produced = Math.min(ICE_STAGE_1.target, state.produced + newProducts);
  if (produced >= ICE_STAGE_1.target) return { ...state, elapsedSeconds, produced, productionProgress: 0, phase: 'clear' };
  const shouldSpawn = !state.penguinAt && elapsedSeconds >= state.nextIssueAt;
  const event = shouldSpawn ? ICE_STAGE_1.issueOrder[state.issueIndex % ICE_STAGE_1.issueOrder.length] : null;
  return {
    ...state, elapsedSeconds, produced,
    productionProgress: totalProgress % 1,
    activeIssue: event && event !== 'penguin' ? event : null,
    penguinAt: event === 'penguin' ? (random() < .5 ? 'relay' : 'pump') : state.penguinAt,
    issueIndex: shouldSpawn ? state.issueIndex + 1 : state.issueIndex,
  };
}

export function repairIceStage1(state: IceStage1State): IceStage1State {
  if (state.phase !== 'playing' || (!state.activeIssue && !state.penguinAt)) return state;
  return { ...state, activeIssue: null, penguinAt: null, repaired: state.repaired + 1, stalledSeconds: 0, nextIssueAt: state.elapsedSeconds + ICE_STAGE_1.nextIssueDelay };
}
