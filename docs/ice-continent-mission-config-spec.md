# 얼음대륙 Mission Config 사양

> 문서용 TypeScript 초안이다. 아직 runtime 파일을 생성하거나 기존 저장 타입을 변경하지 않는다. 명명은 현재 `src/config/iceContinent/stage1.ts`의 config-first 방식을 확장하며, 공통 `AdventureStageNumber = 1 | 2 | 3`과 얼음대륙 내부 Mission ID를 분리한다.

## 1. 핵심 타입

```ts
export type IceMissionId =
  | '1-1' | '1-2' | '1-3'
  | '2-1' | '2-2' | '2-3' | '2-4'
  | '3-1' | '3-2' | '3-3' | '3-4' | '3-5'
  | '3-6' | '3-7' | '3-8' | '3-9' | '3-10'
  | '3-11' | '3-12' | '3-13' | '3-14' | '3-15';

export type IceCampaignStage = 1 | 2 | 3;
export type IceMissionKind = 'tutorial' | 'sample' | 'skeleton';
export type IceDinosaurId = 'tyrannosaurus' | 'triceratops' | 'spinosaurus' | 'mosasaurus' | 'pteranodon';
export type IceMapTemplateId =
  | 'LAYOUT_A_BASIC_TWO_FLOOR' | 'LAYOUT_B_CENTER_LADDER'
  | 'LAYOUT_C_U_LINE' | 'LAYOUT_D_MERGE'
  | 'LAYOUT_E_PARTIAL_THREE_FLOOR' | 'LAYOUT_F_CENTRAL_RESTORATION';
export type IceIssueType = 'freeze' | 'jam' | 'power' | 'conveyor_block' | 'penguin_interference';
export type IceToolAction = 'toolHeat' | 'toolRepair' | 'toolElectric' | 'interact';
export type IceMachineId = string; // template 내부 stable ID. 좌표를 mission에 넣지 않는다.
export type IceQueuePolicy = 'fifo' | 'alternate' | 'missionSequence';
export type IceTravelDistance = 'short' | 'medium' | 'long';
export type IceSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IceMissionConfig {
  id: IceMissionId;
  stage: IceCampaignStage;
  order: number;
  kind: IceMissionKind;
  title: string;
  dinosaur?: IceDinosaurId;
  fossilPartIds: readonly string[];
  mapTemplate: IceMapTemplateId;
  mapVariant: IceTravelDistance;
  roundDurationSec: number;
  targetPlayTimeSec: readonly [min: number, max: number];
  player: { speed: number };
  production: IceProductionConfig;
  issues: IceIssueScheduleConfig;
  penguins: IcePenguinConfig;
  objective: IceObjectiveConfig;
  reward: IceRewardConfig;
  eventPatternIds: readonly IceEventPatternId[];
}

export interface IceProductionConfig {
  speed: number;
  processItemCount: number;
  processTimeByMachine: Readonly<Record<IceMachineId, number>>;
  sharedMachineIds: readonly IceMachineId[];
  machineCriticality: Readonly<Record<IceMachineId, 1 | 2 | 3>>;
  backlogCapacity: number;
  queuePolicy: IceQueuePolicy;
  restartSpeedMultiplier: number;
  restartDurationSec: number;
}

export interface IceIssueScheduleConfig {
  allowedTypes: readonly IceIssueType[];
  intervalSec: readonly [min: number, max: number];
  initialDelaySec: number;
  maxSimultaneous: 1 | 2 | 3;
  warningDurationSec: number;
  defaultRepairTimeSec: number;
  wrongToolPenaltySec: number;
  severityWeights: Partial<Record<IceSeverity, number>>;
  sameMachineCooldownSec: number;
}

export interface IcePenguinConfig {
  count: 0 | 1 | 2;
  interferenceRate: number; // 0..1, pattern slot의 후보 선택 가중치
  behaviorPatterns: readonly ('blockConveyor' | 'switchOff' | 'dropIceDebris' | 'blockAccess')[];
  respawnCooldownSec: number;
}

export interface IceObjectiveConfig {
  requiredPartIds: readonly string[];
  completionType: 'sampleDisplay' | 'partMounted' | 'fullSkeleton';
  assemblyGroupId?: string;
}

export type IceRewardConfig =
  | { type: 'none' }
  | { type: 'sampleCollection'; sampleCollectionId: string; grantPolicy: 'firstClearOnly' }
  | { type: 'skeletonProgress'; dinosaur: IceDinosaurId; partGroup: 1 | 2 }
  | { type: 'skeletonAndRelic'; dinosaur: IceDinosaurId; relicPartId: string; grantPolicy: 'firstClearOnly' };
```

`productionSpeed`, `processTime`, `issueFrequency`, `issueDelay`, `maxSimultaneousIssues`, `warningDuration`, `repairTime`, `wrongToolPenalty`, `penguinCount`, `penguinInterferenceRate`, `playerSpeed`, `machineCriticality`, `backlogCapacity`, `eventPattern`, `travelDistance`는 위 구조 밖의 scene 상수로 두지 않는다. 공통 난이도 preset을 펼친 뒤 미션 override를 적용해 최종 config를 만든다.

## 2. Map Template 계약

```ts
export interface IceMapTemplate {
  id: IceMapTemplateId;
  worldBounds: { x: number; y: number; width: number; height: number };
  cameraBounds: { x: number; y: number; width: number; height: number };
  floors: readonly { id: string; y: number; xMin: number; xMax: number }[];
  ladders: readonly { id: string; x: number; fromFloor: string; toFloor: string }[];
  playerSpawn: { x: number; floorId: string };
  machines: readonly { id: IceMachineId; kind: string; x: number; floorId: string; criticalityDefault: 1 | 2 | 3 }[];
  conveyorPaths: readonly { id: string; points: readonly { x: number; y: number }[]; queueAnchors: readonly { x: number; y: number }[] }[];
  issuePoints: readonly { id: string; machineId: IceMachineId; allowedTypes: readonly IceIssueType[] }[];
  penguinSpawnCandidates: readonly { x: number; floorId: string; behaviors: readonly string[] }[];
  restorationStand: { x: number; floorId: string; cameraFocus: { x: number; y: number; zoom: number } };
}
```

좌표와 카메라 경계는 템플릿만 소유한다. 미션은 machine ID, path ID, variant만 참조한다. shared machine의 두 입력 경로는 같은 machine ID를 가리키며 runtime queue가 `queuePolicy`로 처리한다.

## 3. Issue 정의

| type | 요구 행동 | 기본 경고 | 생산 영향 | world 시각 단서 | 방치 결과 |
| --- | --- | --- | --- | --- | --- |
| `freeze` | `toolHeat` | 서리 확산 | 설비 감속 후 정지 | 푸른 얼음 껍질, 냉기 입자 | 해당 설비와 하류 queue 정지 |
| `jam` | `toolRepair` | 기어 떨림 | 즉시 정지 | 흔들림, 걸린 얼음, 렌치 표식 | 입력 buffer backlog |
| `power` | `toolElectric` | 점멸 | 연결 설비 정지 | 꺼진 램프, 끊긴 전력선 | 파생 설비 감속 또는 정지 |
| `conveyor_block` | `interact` | 장애물 등장 | 해당 path 정지 | 큰 얼음 조각, 정지한 롤러 | 앞뒤 item queue |
| `penguin_interference` | `interact`/접근 | 실제 펭귄 | 행동별 감속·정지 | 펭귄 행동 자체 | 스위치 off, debris, 접근 지연 |

Issue instance는 `affectedMachineId`, `severity`, `warningDurationSec`, `productionMultiplier`, `requiredAction`, `repairDurationSec`, `visualCue`, `derivedFromIssueId?`를 가진다. `machineCriticality`는 scheduler와 world 경고 강도에 쓰되 HUD에 숫자로 표시하지 않는다.

## 4. Event Pattern 계약

```ts
export type IceEventPatternId =
  | 'tyranno_flow_01' | 'tyranno_route_02' | 'tyranno_backlog_03'
  | 'tricera_heavy_01' | 'tricera_bottleneck_02' | 'tricera_priority_03'
  | 'spino_sequence_01' | 'spino_merge_02' | 'spino_sequence_03'
  | 'mosa_freeze_01' | 'mosa_zones_02' | 'mosa_maintenance_03'
  | 'ptera_speed_01' | 'ptera_multitask_02' | 'ptera_finale_03';

export interface IceEventPattern {
  id: IceEventPatternId;
  slots: readonly IceEventSlot[];
}
export interface IceEventSlot {
  id: string;
  timeWindowSec: readonly [number, number];
  progressGate?: { partId?: string; afterMachineId?: IceMachineId };
  candidates: readonly {
    issueType: IceIssueType;
    targetMachineIds: readonly IceMachineId[];
    weight: number;
    severity: IceSeverity;
  }[];
  optional?: boolean;
  simultaneousGroup?: string;
  suppressIfRemainingUnderSec?: number;
}
```

Scheduler는 seeded RNG로 후보와 작은 jitter만 선택한다. slot 순서, 난이도, 동시 그룹은 유지된다. 접근 불가능, 동일 설비 cooldown 중, 동시 상한 초과, 제한시간 임박 조건이면 연기하거나 optional slot을 건너뛴다.

대표 패턴 초안:

- `tyranno_flow_01`: 35초 jam → 85초 freeze → 145초 power 후보. 항상 단일 사건.
- `tyranno_route_02`: 30초 가까운 freeze → 75~85초 먼 jam → 145초 power와 작은 penguin 후보가 짧게 겹침.
- `tyranno_backlog_03`: 45초 jam으로 queue 교육 → 105초 power → 160초 jam/freeze 동시 그룹 → 복구 surge.
- `tricera_heavy_01`: 긴 처리 구간 사이 conveyor_block 두 번. 처리 중 불필요한 사건은 억제.
- `tricera_bottleneck_02`: shared cutter의 warning → power 정지 → 하류 freeze 후보. 원인 복구 시 파생 회복.
- `tricera_priority_03`: 먼 critical jam과 가까운 penguin을 8~12초 차로 배치.
- `spino_sequence_01`: item B 투입 전 conveyor_block, item A 처리 후 jam. 순서가 뒤집혀도 실패가 아닌 지연.
- `spino_merge_02`: 30초 freeze → 60~70초 penguin → 100초 shared machine jam → 140초 power → 후반 후보 1개.
- `spino_sequence_03`: 세 part의 합류 gate마다 한 사건, 중반 한 번만 동시 그룹.
- `mosa_freeze_01`: 35~50초 간격 freeze, 같은 설비 연속 금지.
- `mosa_zones_02`: 좌측 freeze → 우측 power → 두 구역 warning 중 하나가 actual issue.
- `mosa_maintenance_03`: 선행 온도 warning을 점검하면 다음 freeze slot이 감속으로 완화됨.
- `ptera_speed_01`: 작은 jam/block를 짧게 배치하되 동시 2회는 한 번뿐.
- `ptera_multitask_02`: 짧은 issue 5회, 같은 구역 연속 금지, 매 2회 뒤 회복 구간.
- `ptera_finale_03`: 도입 단일 문제 → 중반 priority pair → 후반 controlled chain. 마지막 20초 신규 critical 금지.

## 5. Stage 3 Mission Config 15개 초안

아래 값은 첫 플레이테스트용이다. `speed`는 runtime 기준 배율, 시간은 초다. `processTimeByMachine`의 key는 템플릿 stable ID이며 실제 템플릿 작성 시 검증한다.

| id | map/거리 | 제한/목표 | 생산 | issue 설정 | penguin | objective | event | reward |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3-1 | A/short | 240 / 180~220 | speed 1.0, item 2, backlog 3, fifo | jam·freeze, 34~45, delay 28, max 1, repair 1.0 | 0 | tyranno head, mounted | flow_01 | skeleton group 1 |
| 3-2 | B/long | 255 / 200~235 | 1.0, item 3, backlog 3, fifo | freeze·jam·power, 32~42, delay 25, max 2 | 1 low | tyranno torso, mounted | route_02 | skeleton group 2 |
| 3-3 | C/medium | 270 / 220~250 | 1.05, item 4, backlog 4, fifo, surge 1.6×8s | all except block, 30~40, max 2 | 1 low | tyranno final, fullSkeleton | backlog_03 | eternal_ice_crystal |
| 3-4 | A/short | 270 / 220~245 | 0.82, item 2, long process, backlog 3 | block·jam, 42~52, max 1 | 0 | tricera head, mounted | heavy_01 | skeleton group 1 |
| 3-5 | C/medium | 285 / 230~265 | 0.9, item 3, cutter criticality 3, backlog 4 | power·freeze·jam, 36~46, max 2 | 1 low | tricera torso, mounted | bottleneck_02 | skeleton group 2 |
| 3-6 | B/long | 300 / 240~280 | 0.9, item 4, backlog 5, surge 1.5×8s | jam·block·penguin, 32~42, max 2 | 1 medium | tricera final, fullSkeleton | priority_03 | glacier_crown_frame |
| 3-7 | C/medium | 270 / 220~250 | 1.0, item 2, missionSequence, backlog 4 | jam·block, 38~48, max 2 | 0 | spino head, mounted | sequence_01 | skeleton group 1 |
| 3-8 | D/medium | 300 / 240~280 | 1.0, item 3, shared separator, alternate, backlog 5 | power·freeze·jam, 34~44, max 2 | 1 low | spino torso/spines, mounted | merge_02 | skeleton group 2 |
| 3-9 | F/long | 315 / 260~295 | 1.0, item 5, missionSequence, backlog 5 | jam·power·block·penguin, 32~42, max 2 | 1 medium | spino final, fullSkeleton | sequence_03 | mammoth_medal |
| 3-10 | A/medium | 270 / 220~250 | 0.95, item 3, backlog 4 | freeze·block, 28~38, max 2, warning 6 | 0 | mosa head, mounted | freeze_01 | skeleton group 1 |
| 3-11 | E/long | 300 / 245~280 | 0.95, item 3, zone buffers, backlog 4 | freeze·power, 34~44, max 2 | 1 low | mosa torso, mounted | zones_02 | skeleton group 2 |
| 3-12 | E/long | 315 / 260~295 | 0.98, item 4, backlog 5, surge 1.5×7s | freeze·power·penguin, 31~41, max 2, warning 8 | 1 medium | mosa final, fullSkeleton | maintenance_03 | snowflake_crown_ornament |
| 3-13 | B/medium | 270 / 220~250 | 1.35, item 5, backlog 3, surge 1.7×6s | jam·block, 27~35, max 2 | 1 low | ptera head, mounted | speed_01 | skeleton group 1 |
| 3-14 | F/long | 300 / 240~280 | 1.25, item 5, alternate, backlog 4 | freeze·power·jam, 24~32, max 2, repair .8 | 1 medium | ptera torso/wings, mounted | multitask_02 | skeleton group 2 |
| 3-15 | E/long | 360 / 280~330 | 1.2, item 6, missionSequence, backlog 5, surge 1.6×8s | all, 27~36, delay 20, max 3, warning 7 | 2 high | ptera final, fullSkeleton | finale_03 | frost_core |

정식 config에서는 위 표의 축약형을 사용하지 않고 `IceMissionConfig` 전체 필드를 명시한다. `max 3`인 3-15도 critical issue는 동시에 하나뿐이고 나머지는 낮은 severity 또는 펭귄이어야 한다.

## 6. Stage 1·2 적용

같은 schema를 사용하되 Stage 1은 `kind: 'tutorial'`, Stage 2는 `kind: 'sample'`이다.

- Stage 1: `1-1 이동`, `1-2 생산라인·공구`, `1-3 기본 수리 종합`; 각 1~2분.
- Stage 2: `2-1 t_rex_claw`, `2-2 tricera_small_horn`, `2-3 spino_neural_spine`, `2-4 small_dinosaur_foot_set`; 각 2~4분.
- Stage 2 reward는 `sampleCollection`, Stage 3 중간 보상은 `skeletonProgress`, 각 공룡 마지막은 `skeletonAndRelic`만 허용한다.

## 7. 저장·검증 경계

후속 구현에서 필요한 영구 상태는 `completedMissionIds`, `visitedMissionIds`, `restoredSampleIds`, `skeletonProgressByDinosaur`, `claimedRelicPartIds`, `saveVersion`이다. 기존 `AdventureStageNumber`와 `stage3FirstCleared` 하나로 22미션을 표현하지 않는다. 유물 지급은 `runId + missionId + firstClear`를 함께 검사한다.

데이터 검증기는 다음을 확인해야 한다.

- 22개의 고유 Mission ID와 끊김 없는 unlock 순서
- 모든 machine/part/event/template 참조의 존재
- event slot이 동시 상한과 제한시간을 위반하지 않음
- fullSkeleton 미션이 공룡마다 정확히 하나이고 relic ID가 1:1임
- Stage 2 sample ID가 relic ID와 겹치지 않음
- backlog queue anchor가 capacity 이상 존재함
- 모든 issue가 접근 가능한 floor와 대응 action을 가짐
