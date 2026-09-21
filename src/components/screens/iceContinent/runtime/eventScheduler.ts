import type { IceEventCandidate, IceEventPattern, IceEventSlot } from '../../../../config/iceContinent/iceMissionTypes';

export interface IceScheduledEvent { slotId: string; issueType: IceEventCandidate['issueType']; targetMachineId: string; severity: IceEventCandidate['severity'] }
export interface IceSchedulerState { seed: number; firedSlotIds: readonly string[]; scheduledTimes: Readonly<Record<string, number>> }

function random(seed: number) { const next = (seed * 1664525 + 1013904223) >>> 0; return { value: next / 0x100000000, seed: next }; }
export function createEventScheduler(pattern: IceEventPattern, seed = 260417): IceSchedulerState {
  let currentSeed = seed >>> 0; const scheduledTimes: Record<string, number> = {};
  for (const slot of pattern.slots) {
    const roll = random(currentSeed); currentSeed = roll.seed;
    scheduledTimes[slot.id] = slot.timeWindowSec[0] + (slot.timeWindowSec[1] - slot.timeWindowSec[0]) * roll.value;
  }
  return { seed: currentSeed, firedSlotIds: [], scheduledTimes };
}

export function nextScheduledEvent(state: IceSchedulerState, pattern: IceEventPattern, input: { elapsed: number; progress: number; activeIssueCount: number; maxSimultaneous: number; remaining: number }): { state: IceSchedulerState; event: IceScheduledEvent | null } {
  const slot = pattern.slots.find(candidate => isEligible(candidate, state, input));
  if (!slot) return { state, event: null };
  let seed = state.seed; let total = 0;
  slot.candidates.forEach(candidate => { total += candidate.weight; });
  const roll = random(seed); seed = roll.seed; let cursor = roll.value * total;
  const candidate = slot.candidates.find(item => { cursor -= item.weight; return cursor <= 0; }) ?? slot.candidates[0];
  const targetRoll = random(seed); seed = targetRoll.seed;
  const targetMachineId = candidate.targetMachineIds[Math.floor(targetRoll.value * candidate.targetMachineIds.length)] ?? candidate.targetMachineIds[0];
  return { state: { ...state, seed, firedSlotIds: [...state.firedSlotIds, slot.id] }, event: { slotId: slot.id, issueType: candidate.issueType, targetMachineId, severity: candidate.severity } };
}

function isEligible(slot: IceEventSlot, state: IceSchedulerState, input: { elapsed: number; progress: number; activeIssueCount: number; maxSimultaneous: number; remaining: number }) {
  return !state.firedSlotIds.includes(slot.id) && input.elapsed >= state.scheduledTimes[slot.id]
    && input.progress >= (slot.progressAtLeast ?? 0) && input.activeIssueCount < input.maxSimultaneous
    && (!slot.suppressNearFinishSec || input.remaining > slot.suppressNearFinishSec);
}

