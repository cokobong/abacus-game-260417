import type { IceMapTemplate, IceMapTemplateId } from './iceMissionTypes';

const machine = (id: string, name: string, kind: string, x: number, y: number, floor: 'lower' | 'upper', criticality: 1 | 2 | 3, allowedIssues: IceMapTemplate['machines'][number]['allowedIssues']): IceMapTemplate['machines'][number] => ({ id, name, kind, x, y, floor, criticality, allowedIssues });

const layoutA: IceMapTemplate = {
  id: 'LAYOUT_A_BASIC_TWO_FLOOR', worldBounds: { width: 1120, height: 720 }, cameraBounds: { x: 0, y: 0, width: 1120, height: 720 },
  floors: [{ id: 'upper', y: 250, xMin: 35, xMax: 650 }, { id: 'lower', y: 515, xMin: 590, xMax: 1080 }],
  ladders: [{ id: 'ladder-main', x: 620, from: 'lower', to: 'upper' }], playerSpawn: { x: 90, floor: 'upper' },
  machines: [
    machine('feeder', '원석 투입기', 'feeder', 100, 250, 'upper', 1, ['jam']),
    machine('cutter', '절단기', 'cutter', 285, 250, 'upper', 2, ['jam', 'power']),
    machine('cracker', '균열기', 'cracker', 485, 250, 'upper', 2, ['power', 'jam']),
    machine('washer', '세척기', 'washer', 790, 515, 'lower', 3, ['freeze', 'power']),
  ],
  conveyorPath: [
    { x: 70, y: 220, visualState: 'raw' }, { x: 210, y: 220, visualState: 'raw', machineId: 'feeder' },
    { x: 285, y: 220, visualState: 'cut', machineId: 'cutter' }, { x: 430, y: 220, visualState: 'cracked' },
    { x: 485, y: 220, visualState: 'silhouette', machineId: 'cracker' }, { x: 620, y: 220, visualState: 'exposed' },
    { x: 620, y: 485, visualState: 'exposed' }, { x: 720, y: 485, visualState: 'exposed' },
    { x: 790, y: 485, visualState: 'cleaned', machineId: 'washer' }, { x: 970, y: 485, visualState: 'cleaned' },
    { x: 1040, y: 485, visualState: 'mounted' },
  ],
  queueAnchors: [{ x: 705, y: 485 }, { x: 650, y: 485 }, { x: 590, y: 485 }, { x: 535, y: 220 }],
  restorationStand: { x: 1040, y: 485, floor: 'lower' },
  penguinSpawnCandidates: [{ x: 690, y: 485, floor: 'lower', machineId: 'washer' }],
  issuePoints: [{ machineId: 'cutter', allowedTypes: ['jam'] }, { machineId: 'cracker', allowedTypes: ['power', 'jam'] }, { machineId: 'washer', allowedTypes: ['freeze'] }],
};

const layoutB: IceMapTemplate = {
  ...layoutA, id: 'LAYOUT_B_CENTER_LADDER', worldBounds: { width: 1360, height: 720 }, cameraBounds: { x: 0, y: 0, width: 1360, height: 720 },
  floors: [{ id: 'upper', y: 250, xMin: 35, xMax: 760 }, { id: 'lower', y: 515, xMin: 650, xMax: 1325 }],
  ladders: [{ id: 'ladder-main', x: 700, from: 'lower', to: 'upper' }],
  machines: layoutA.machines.map(item => item.id === 'washer' ? { ...item, x: 980 } : item.id === 'cracker' ? { ...item, x: 560 } : item),
  conveyorPath: layoutA.conveyorPath.map(point => point.x >= 620 ? { ...point, x: point.x + (point.x >= 790 ? 260 : 80) } : point),
  queueAnchors: layoutA.queueAnchors.map(point => ({ ...point, x: point.x + 180 })),
  restorationStand: { x: 1280, y: 485, floor: 'lower' },
  penguinSpawnCandidates: [{ x: 820, y: 485, floor: 'lower', machineId: 'washer' }],
};

const extended = (id: IceMapTemplateId, width: number, controlFloor = false): IceMapTemplate => ({
  ...layoutB, id, worldBounds: { width, height: 720 }, cameraBounds: { x: 0, y: 0, width, height: 720 },
  floors: controlFloor
    ? [...layoutB.floors, { id: 'control', y: 105, xMin: 860, xMax: width - 60 }]
    : layoutB.floors.map(floor => floor.id === 'lower' ? { ...floor, xMax: width - 35 } : floor),
  ladders: controlFloor ? [...layoutB.ladders, { id: 'ladder-control', x: 1120, from: 'lower', to: 'control' }] : layoutB.ladders,
  machines: [...layoutB.machines, machine('generator', '주 발전기', 'generator', width - 150, 515, 'lower', 3, ['power'])],
  queueAnchors: [...layoutB.queueAnchors, { x: 760, y: 485 }, { x: 705, y: 485 }],
  issuePoints: [...layoutB.issuePoints, { machineId: 'generator', allowedTypes: ['power'] }],
  penguinSpawnCandidates: [...layoutB.penguinSpawnCandidates, { x: width - 300, y: 485, floor: 'lower', machineId: 'generator' }],
});
export const ICE_MAP_TEMPLATES: Readonly<Record<IceMapTemplateId, IceMapTemplate>> = {
  LAYOUT_A_BASIC_TWO_FLOOR: layoutA,
  LAYOUT_B_CENTER_LADDER: layoutB,
  LAYOUT_C_U_LINE: extended('LAYOUT_C_U_LINE', 1480),
  LAYOUT_D_MERGE: extended('LAYOUT_D_MERGE', 1580),
  LAYOUT_E_PARTIAL_THREE_FLOOR: extended('LAYOUT_E_PARTIAL_THREE_FLOOR', 1720, true),
  LAYOUT_F_CENTRAL_RESTORATION: extended('LAYOUT_F_CENTRAL_RESTORATION', 1580),
};
