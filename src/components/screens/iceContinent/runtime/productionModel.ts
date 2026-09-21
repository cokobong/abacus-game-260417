import type { IceMapTemplate, IceMissionConfig, IcePoint, IceVisualState } from '../../../../config/iceContinent/iceMissionTypes';

export interface IceProductionItem {
  id: string; currentProcess: number; visualState: IceVisualState; position: IcePoint;
  currentMachine: string | null; queuedAt: number | null; blocked: boolean; completed: boolean;
  routeProgress: number; spawned: boolean; processRemaining: number;
}
export interface IceProductionState {
  elapsed: number; items: IceProductionItem[]; inputPaused: boolean; surgeRemaining: number;
  completedCount: number; lostCount: number; spawnElapsed: number; overloadPauseRemaining: number;
}

export function createProductionState(config: IceMissionConfig, map: IceMapTemplate): IceProductionState {
  return {
    elapsed: 0, inputPaused: false, surgeRemaining: 0, completedCount: 0, lostCount: 0,
    spawnElapsed: 0, overloadPauseRemaining: 0,
    items: Array.from({ length: config.production.processItemCount }, (_, index) => freshItem(index, map, index === 0)),
  };
}

function freshItem(index: number, map: IceMapTemplate, spawned: boolean): IceProductionItem {
  return { id: `item-${index}`, currentProcess: 0, visualState: 'raw', position: { ...map.conveyorPath[0] }, currentMachine: null, queuedAt: null, blocked: false, completed: false, routeProgress: 0, spawned, processRemaining: 0 };
}

export function advanceProduction(state: IceProductionState, seconds: number, config: IceMissionConfig, map: IceMapTemplate, lineBlocked: boolean): IceProductionState {
  if (seconds <= 0) return state;
  const elapsed = state.elapsed + seconds;
  const items = state.items.map(item => ({ ...item, position: { ...item.position } }));
  let completedCount = state.completedCount; let lostCount = state.lostCount;
  let overloadPauseRemaining = Math.max(0, state.overloadPauseRemaining - seconds);
  let spawnElapsed = state.spawnElapsed + (overloadPauseRemaining > 0 ? 0 : seconds);
  const canSpawn = !config.production.arcadeLoop || completedCount < config.production.targetCompleted;
  while (canSpawn && spawnElapsed >= config.production.spawnInterval) {
    const slot = items.find(item => !item.spawned || item.completed);
    if (!slot) break;
    Object.assign(slot, freshItem(Number(slot.id.replace('item-', '')), map, true));
    spawnElapsed -= config.production.spawnInterval;
  }
  if (!config.production.arcadeLoop) items.forEach((item, index) => { if (!item.spawned && elapsed >= index * config.production.spawnInterval) item.spawned = true; });

  const surgeRemaining = Math.max(0, state.surgeRemaining - seconds);
  const speed = config.production.speed * (surgeRemaining > 0 ? config.production.restartSurgeMultiplier : 1);
  const ordered = items.filter(item => item.spawned && !item.completed).sort((a, b) => b.routeProgress - a.routeProgress);
  ordered.forEach((item, order) => {
    if (lineBlocked) {
      item.blocked = true; item.queuedAt ??= elapsed;
      const anchor = map.queueAnchors[Math.min(order, map.queueAnchors.length - 1)]; if (anchor) item.position = { ...anchor };
      return;
    }
    item.blocked = false; item.queuedAt = null;
    if (item.processRemaining > 0) { item.processRemaining = Math.max(0, item.processRemaining - seconds); return; }
    const leader = ordered[order - 1]; const maximumProgress = leader ? leader.routeProgress - .28 : Number.POSITIVE_INFINITY;
    item.routeProgress = Math.max(item.routeProgress, Math.min(item.routeProgress + speed * seconds / 120, maximumProgress));
    const lastIndex = map.conveyorPath.length - 1;
    if (item.routeProgress >= lastIndex) {
      item.routeProgress = lastIndex; item.completed = true;
      if (config.production.arcadeLoop) { completedCount += 1; item.spawned = false; }
    }
    applyRouteState(item, config, map);
  });

  const queue = items.filter(item => item.spawned && item.blocked).sort((a, b) => (a.queuedAt ?? elapsed) - (b.queuedAt ?? elapsed));
  if (config.production.arcadeLoop && queue.length > config.production.backlogCapacity) {
    const lost = queue[0]; Object.assign(lost, freshItem(Number(lost.id.replace('item-', '')), map, false));
    lostCount += 1; overloadPauseRemaining = config.production.overloadPauseDuration; spawnElapsed = 0;
  }
  const backlog = items.filter(item => item.spawned && item.blocked).length;
  const inputPaused = lineBlocked && (config.production.arcadeLoop ? overloadPauseRemaining > 0 : backlog >= config.production.backlogCapacity);
  return { elapsed, items, inputPaused, surgeRemaining, completedCount, lostCount, spawnElapsed, overloadPauseRemaining };
}

function applyRouteState(item: IceProductionItem, config: IceMissionConfig, map: IceMapTemplate) {
  const index = Math.min(Math.floor(item.routeProgress), map.conveyorPath.length - 1);
  const from = map.conveyorPath[index]; const to = map.conveyorPath[Math.min(index + 1, map.conveyorPath.length - 1)]; const t = Math.min(1, item.routeProgress - index);
  item.position = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  item.currentProcess = index; item.visualState = from.visualState; item.currentMachine = from.machineId ?? null;
  if (Math.abs(t) < .001 && from.machineId) item.processRemaining = config.production.processTimes[from.machineId] ?? 0;
}

export function restartProduction(state: IceProductionState, config: IceMissionConfig): IceProductionState {
  return { ...state, surgeRemaining: config.production.restartSurgeDuration, items: state.items.map(item => ({ ...item, blocked: false, queuedAt: null })) };
}
export function productionProgress(state: IceProductionState, map: IceMapTemplate, config?: IceMissionConfig) {
  if (config?.production.arcadeLoop) return Math.min(1, state.completedCount / config.production.targetCompleted);
  const main = state.items[0]; return main ? main.routeProgress / (map.conveyorPath.length - 1) : 0;
}
export function productionBacklog(state: IceProductionState) { return state.items.filter(item => item.spawned && item.blocked).length; }
