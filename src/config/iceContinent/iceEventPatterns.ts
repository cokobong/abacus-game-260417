import type { IceEventPattern } from './iceMissionTypes';

export const ICE_EVENT_PATTERNS: Readonly<Record<string, IceEventPattern>> = {
  stage1_observe: { id: 'stage1_observe', slots: [] },
  stage1_repair: { id: 'stage1_repair', slots: [
    { id: 'learn-freeze', timeWindowSec: [12, 15], progressAtLeast: .16, candidates: [{ issueType: 'freeze', targetMachineIds: ['washer'], weight: 1, severity: 'low' }] },
    { id: 'learn-jam', timeWindowSec: [38, 43], progressAtLeast: .42, candidates: [{ issueType: 'jam', targetMachineIds: ['cutter'], weight: 1, severity: 'medium' }], suppressNearFinishSec: 14 },
  ] },
  stage1_operate: { id: 'stage1_operate', slots: [
    { id: 'upper-freeze', timeWindowSec: [10, 13], progressAtLeast: .1, candidates: [{ issueType: 'freeze', targetMachineIds: ['washer'], weight: 1, severity: 'low' }] },
    { id: 'penguin', timeWindowSec: [34, 39], progressAtLeast: .32, candidates: [{ issueType: 'penguin_interference', targetMachineIds: ['washer'], weight: 1, severity: 'medium' }] },
    { id: 'final-jam', timeWindowSec: [62, 68], progressAtLeast: .58, candidates: [{ issueType: 'jam', targetMachineIds: ['cutter'], weight: 1, severity: 'high' }], suppressNearFinishSec: 15 },
  ] },
  stage2_basic: { id: 'stage2_basic', slots: [
    { id: 'basic-freeze', timeWindowSec: [7, 9], candidates: [{ issueType: 'freeze', targetMachineIds: ['washer'], weight: 1, severity: 'high' }] },
    { id: 'basic-penguin', timeWindowSec: [28, 32], candidates: [{ issueType: 'penguin_interference', targetMachineIds: ['cutter'], weight: 1, severity: 'medium' }] },
    { id: 'basic-jam', timeWindowSec: [52, 57], candidates: [{ issueType: 'jam', targetMachineIds: ['cutter'], weight: 1, severity: 'high' }] },
    { id: 'basic-penguin-return', timeWindowSec: [76, 82], candidates: [{ issueType: 'penguin_interference', targetMachineIds: ['washer'], weight: 1, severity: 'medium' }], suppressNearFinishSec: 12 },
  ] },
  stage2_priority: { id: 'stage2_priority', slots: [
    { id: 'priority-warmup', timeWindowSec: [8, 12], candidates: [{ issueType: 'jam', targetMachineIds: ['cutter'], weight: 1, severity: 'low' }] },
    { id: 'priority-critical', timeWindowSec: [42, 48], progressAtLeast: .25, candidates: [{ issueType: 'power', targetMachineIds: ['generator'], weight: 1, severity: 'critical' }] },
    { id: 'priority-small', timeWindowSec: [43, 50], progressAtLeast: .25, concurrencyGroup: 'priority-pair', candidates: [{ issueType: 'jam', targetMachineIds: ['cutter'], weight: 1, severity: 'low' }] },
    { id: 'priority-freeze', timeWindowSec: [88, 98], progressAtLeast: .58, candidates: [{ issueType: 'freeze', targetMachineIds: ['washer'], weight: 1, severity: 'medium' }], suppressNearFinishSec: 18 },
  ] },
  stage2_backlog: { id: 'stage2_backlog', slots: [
    { id: 'queue-freeze', timeWindowSec: [8, 11], candidates: [{ issueType: 'freeze', targetMachineIds: ['washer'], weight: 1, severity: 'high' }] },
    { id: 'queue-penguin', timeWindowSec: [48, 56], progressAtLeast: .3, candidates: [{ issueType: 'penguin_interference', targetMachineIds: ['washer'], weight: 1, severity: 'medium' }] },
    { id: 'queue-power', timeWindowSec: [84, 94], progressAtLeast: .48, candidates: [{ issueType: 'power', targetMachineIds: ['generator'], weight: 1, severity: 'high' }] },
    { id: 'queue-jam', timeWindowSec: [118, 128], progressAtLeast: .68, candidates: [{ issueType: 'jam', targetMachineIds: ['cutter'], weight: 1, severity: 'medium' }], suppressNearFinishSec: 18 },
  ] },
  stage2_final: { id: 'stage2_final', slots: [
    { id: 'final-freeze', timeWindowSec: [7, 10], candidates: [{ issueType: 'freeze', targetMachineIds: ['washer'], weight: 1, severity: 'medium' }] },
    { id: 'final-power', timeWindowSec: [44, 50], progressAtLeast: .22, candidates: [{ issueType: 'power', targetMachineIds: ['generator'], weight: 1, severity: 'critical' }] },
    { id: 'final-penguin', timeWindowSec: [46, 53], progressAtLeast: .22, concurrencyGroup: 'final-pair-a', candidates: [{ issueType: 'penguin_interference', targetMachineIds: ['washer'], weight: 1, severity: 'low' }] },
    { id: 'final-jam', timeWindowSec: [96, 105], progressAtLeast: .48, candidates: [{ issueType: 'jam', targetMachineIds: ['cutter'], weight: 1, severity: 'high' }] },
    { id: 'final-block', timeWindowSec: [98, 108], progressAtLeast: .48, concurrencyGroup: 'final-pair-b', candidates: [{ issueType: 'conveyor_block', targetMachineIds: ['cracker'], weight: 1, severity: 'medium' }] },
    { id: 'final-last-freeze', timeWindowSec: [155, 166], progressAtLeast: .72, candidates: [{ issueType: 'freeze', targetMachineIds: ['washer'], weight: 1, severity: 'high' }], suppressNearFinishSec: 20 },
  ] },
};
