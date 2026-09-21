import assert from 'node:assert/strict';
import test from 'node:test';
import { ICE_EVENT_PATTERNS } from './iceEventPatterns';
import { ICE_MAP_TEMPLATES } from './iceMapTemplates';
import { ICE_MISSION_CONFIGS } from './iceMissionConfigs';
import { createEventScheduler, nextScheduledEvent } from '../../components/screens/iceContinent/runtime/eventScheduler';
import { advanceProduction, createProductionState, productionBacklog, productionProgress, restartProduction } from '../../components/screens/iceContinent/runtime/productionModel';
import { validateIceMission } from '../../components/screens/iceContinent/runtime/missionValidator';

test('all playable Stage 1 and Stage 2 mission configs validate', () => {
  for (const config of Object.values(ICE_MISSION_CONFIGS)) {
    const result = validateIceMission(config);
    assert.deepEqual(result.errors, [], `${config.id}: ${result.errors.join(', ')}`);
    assert.equal(result.valid, true);
  }
});

test('Stage 2 missions have fixed sample rewards and sequential progression', () => {
  const ids = ['2-1', '2-2', '2-3', '2-4'] as const;
  assert.deepEqual(ids.map(id => ICE_MISSION_CONFIGS[id].nextMissionId), ['2-2', '2-3', '2-4', null]);
  assert.deepEqual(ids.map(id => ICE_MISSION_CONFIGS[id].reward.type === 'sampleCollection' ? ICE_MISSION_CONFIGS[id].reward.id : null), ['sample_trex_claw', 'sample_triceratops_horn', 'sample_spinosaurus_spine', 'sample_dinosaur_foot']);
  assert.deepEqual(ids.map(id => ICE_MISSION_CONFIGS[id].issues.maxSimultaneous), [1, 2, 2, 2]);
  assert.deepEqual(ids.map(id => ICE_EVENT_PATTERNS[ICE_MISSION_CONFIGS[id].eventPatternId].slots[0].timeWindowSec[0] <= 12), [true, true, true, true]);
  assert.ok(ICE_MAP_TEMPLATES[ICE_MISSION_CONFIGS['2-4'].mapTemplate].machines.length >= 5);
  assert.equal(ICE_MAP_TEMPLATES[ICE_MISSION_CONFIGS['2-4'].mapTemplate].machines.find(machine => machine.id === 'generator')?.criticality, 3);
});

test('Stage 1 mission registry defines a finite 1-1 to 1-3 progression', () => {
  assert.equal(ICE_MISSION_CONFIGS['1-1'].nextMissionId, '1-2');
  assert.equal(ICE_MISSION_CONFIGS['1-2'].nextMissionId, '1-3');
  assert.equal(ICE_MISSION_CONFIGS['1-3'].nextMissionId, null);
});

test('Stage 1 tutorial pacing and scripted lessons stay focused', () => {
  assert.deepEqual(ICE_MISSION_CONFIGS['1-1'].targetPlayTime, [45, 60]);
  assert.deepEqual(ICE_MISSION_CONFIGS['1-2'].targetPlayTime, [60, 75]);
  assert.deepEqual(ICE_MISSION_CONFIGS['1-3'].targetPlayTime, [75, 100]);
  assert.equal(ICE_MISSION_CONFIGS['1-1'].tutorial.requireStartAction, true);
  assert.deepEqual(ICE_EVENT_PATTERNS.stage1_observe.slots, []);
  assert.deepEqual(ICE_EVENT_PATTERNS.stage1_repair.slots.map(slot => slot.candidates[0].issueType), ['freeze', 'jam']);
  assert.deepEqual(ICE_EVENT_PATTERNS.stage1_operate.slots.map(slot => slot.candidates[0].issueType), ['freeze', 'penguin_interference', 'jam']);
});

test('validator reports invalid references and balance values', () => {
  const invalid = { ...ICE_MISSION_CONFIGS['1-1'], durationSec: 0, eventPatternId: 'missing', production: { ...ICE_MISSION_CONFIGS['1-1'].production, backlogCapacity: 0, processTimes: { missingMachine: 1 } } };
  const result = validateIceMission(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('durationSec')));
  assert.ok(result.errors.some(error => error.includes('eventPattern')));
  assert.ok(result.errors.some(error => error.includes('backlogCapacity')));
  assert.ok(result.errors.some(error => error.includes('missingMachine')));
});

test('production items queue at world anchors and restart with a bounded surge', () => {
  const config = ICE_MISSION_CONFIGS['1-2']; const map = ICE_MAP_TEMPLATES[config.mapTemplate];
  let state = createProductionState(config, map);
  state = advanceProduction(state, 13, config, map, false);
  assert.equal(state.items.filter(item => item.spawned).length, 3);
  state = advanceProduction(state, 1, config, map, true);
  assert.equal(productionBacklog(state), 3);
  assert.equal(state.inputPaused, true);
  const queuedPositions = state.items.slice(1).map(item => item.position);
  assert.deepEqual(queuedPositions[0], map.queueAnchors[1]);
  state = restartProduction(state, config);
  assert.equal(state.surgeRemaining, config.production.restartSurgeDuration);
  assert.equal(productionBacklog(state), 0);
  const before = state.items[0].routeProgress;
  state = advanceProduction(state, 1, config, map, false);
  assert.ok(state.items[0].routeProgress > before);
});

test('event scheduler is deterministic and respects progress and concurrency', () => {
  const pattern = ICE_EVENT_PATTERNS.stage1_repair;
  const a = createEventScheduler(pattern, 42); const b = createEventScheduler(pattern, 42);
  assert.deepEqual(a.scheduledTimes, b.scheduledTimes);
  const early = nextScheduledEvent(a, pattern, { elapsed: 100, progress: 0, activeIssueCount: 0, maxSimultaneous: 1, remaining: 100 });
  assert.equal(early.event, null);
  const blocked = nextScheduledEvent(a, pattern, { elapsed: 100, progress: 1, activeIssueCount: 1, maxSimultaneous: 1, remaining: 100 });
  assert.equal(blocked.event, null);
  const readyA = nextScheduledEvent(a, pattern, { elapsed: 100, progress: 1, activeIssueCount: 0, maxSimultaneous: 1, remaining: 100 });
  const readyB = nextScheduledEvent(b, pattern, { elapsed: 100, progress: 1, activeIssueCount: 0, maxSimultaneous: 1, remaining: 100 });
  assert.deepEqual(readyA.event, readyB.event);
  assert.equal(readyA.event?.slotId, 'learn-freeze');
});

test('an unblocked main fossil reaches the restoration stand within the mission limit', () => {
  const config = ICE_MISSION_CONFIGS['1-1']; const map = ICE_MAP_TEMPLATES[config.mapTemplate];
  let state = createProductionState(config, map);
  for (let elapsed = 0; elapsed < config.durationSec && !state.items[0].completed; elapsed += .25) state = advanceProduction(state, .25, config, map, false);
  assert.equal(state.items[0].completed, true);
  assert.equal(state.items[0].visualState, 'mounted');
});

test('redesigned 2-1 runs a fast loop to its completion target', () => {
  const config = ICE_MISSION_CONFIGS['2-1']; const map = ICE_MAP_TEMPLATES[config.mapTemplate];
  let state = createProductionState(config, map);
  for (let elapsed = 0; elapsed < config.durationSec && state.completedCount < config.production.targetCompleted; elapsed += .1) state = advanceProduction(state, .1, config, map, false);
  assert.equal(state.completedCount, config.production.targetCompleted);
  assert.equal(productionProgress(state, map, config), 1);
  assert.ok(state.items.filter(item => item.spawned).length <= 5);
});

test('redesigned 2-1 overload loses the oldest queued item without ending the run', () => {
  const config = ICE_MISSION_CONFIGS['2-1']; const map = ICE_MAP_TEMPLATES[config.mapTemplate];
  let state = createProductionState(config, map);
  for (let elapsed = 0; elapsed < 12 && state.lostCount === 0; elapsed += .1) state = advanceProduction(state, .1, config, map, true);
  assert.equal(state.lostCount, 1);
  assert.equal(productionBacklog(state), config.production.backlogCapacity);
  assert.ok(state.overloadPauseRemaining > 0);
});
