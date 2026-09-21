# 얼음대륙 Stage 3 — 15미션 캠페인 설계

> 상태: 구현 전 확정 설계. 전체 원칙은 `ice-continent-fossil-restoration-arcade-final.md`, 타입·데이터 계약은 `ice-continent-mission-config-spec.md`를 따른다.

## 1. 캠페인 역할

Stage 3는 공룡 5종을 각각 세 미션에 걸쳐 복원하는 15미션 캠페인이다. 첫 미션은 새 운영 개념을 소개하고, 둘째 미션은 그 개념을 변형하며, 셋째 미션은 앞의 두 능력을 결합한다. 각 공룡의 세 번째 미션에서만 전체 골격을 결합하고 지정된 얼음대륙 유물 부품을 최초 1회 확정 지급한다.

학습 곡선은 `흐름 관찰 → 병목 식별 → 작업 순서 → 예방적 유지보수 → 우선순위·멀티태스킹`이다. 이는 다음 프로젝트인 마트 경영 시뮬레이션에서 필요한 흐름 관찰, 제한 자원 배치, 우선순위 판단으로 이어지는 다리다. 난이도를 단순히 사건 수로 올리지 않고 이동 거리, 병목, 순서, 공유 설비, 사건 조합, 타이밍, 펭귄, 동시 사건 순으로 축을 추가한다.

## 2. 15미션 상세표

| 미션 | 공룡 / 파트 | 맵 | 목표 시간 | 생산 방식 | 주/보조 문제 | 펭귄 | 동시 상한 | 핵심 능력 | 이벤트 패턴 | 최초 보상 | 직전 미션과의 차이 |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| 3-1 | 티라노 / 머리 | A | 3~4분 | 단일 라인, 표준 속도 | jam / freeze | 없음 | 1 | 흐름 관찰 | `tyranno_flow_01` | 머리 복원 | Stage 2보다 긴 라인을 관찰하되 사건은 하나씩 온다. |
| 3-2 | 티라노 / 몸통 | B | 3~4분 | 단일 라인, 긴 동선 | freeze / jam | 낮음 | 2 | 이동 계획 | `tyranno_route_02` | 몸통 복원 | 두 층의 먼 설비 사이를 이동하며 사건이 짧게 겹친다. |
| 3-3 | 티라노 / 다리·꼬리 | C | 4분 | backlog 4, 재가동 surge | jam / power | 낮음 | 2 | 기본 운영 종합 | `tyranno_backlog_03` | 전체 골격 + `eternal_ice_crystal` | 실제 적체와 두 문제의 우선순위를 처음 결합한다. |
| 3-4 | 트리케라 / 머리·뿔 | A | 4분 | 무거운 원석, 긴 공정 | conveyor_block / jam | 없음 | 1 | 처리시간 예측 | `tricera_heavy_01` | 머리·뿔 복원 | 생산물이 느려져 고장보다 공정 시간 자체를 읽어야 한다. |
| 3-5 | 트리케라 / 몸통 | C | 4~5분 | 단일 critical 병목 | power / freeze | 낮음 | 2 | 병목 식별 | `tricera_bottleneck_02` | 몸통 복원 | 특정 설비 정지가 전 라인에 큰 영향을 준다. |
| 3-6 | 트리케라 / 다리·꼬리 | B | 4~5분 | 무거운 부품 + 병목 | jam / penguin | 중간 | 2 | 영향도 우선순위 | `tricera_priority_03` | 전체 골격 + `glacier_crown_frame` | 가까운 펭귄과 먼 critical 고장 중 먼저 할 일을 고른다. |
| 3-7 | 스피노 / 머리 | C | 4분 | 두 process item 순서 | jam / conveyor_block | 없음 | 2 | 작업 순서 | `spino_sequence_01` | 머리 복원 | 두 부품이 같은 설비를 쓰며 투입 순서가 중요해진다. |
| 3-8 | 스피노 / 몸통·신경가시 | D | 4~5분 | 두 라인이 shared machine 합류 | power / freeze | 낮음 | 2 | 공유 자원 관리 | `spino_merge_02` | 몸통·신경가시 복원 | 독립 라인이 하나의 병목 설비에 합류한다. |
| 3-9 | 스피노 / 다리·꼬리 | F | 5분 | 3부품 sequencing | jam / power | 중간 | 2 | 순서 + 사건 대응 | `spino_sequence_03` | 전체 골격 + `mammoth_medal` | 여러 부품의 합류 순서와 장애 대응을 동시에 관리한다. |
| 3-10 | 모사 / 머리 | A | 4분 | 저온 라인, 해빙 반복 | freeze / conveyor_block | 없음 | 2 | 결빙 유지관리 | `mosa_freeze_01` | 머리 복원 | 결빙 예고가 잦지만 위치와 간격은 예측 가능하다. |
| 3-11 | 모사 / 몸통 | E | 4~5분 | 두 유지관리 구역 | freeze / power | 낮음 | 2 | 구역 순회 | `mosa_zones_02` | 몸통 복원 | 부분 3층에서 멀리 떨어진 두 구역의 상태를 번갈아 본다. |
| 3-12 | 모사 / 지느러미·꼬리 | E | 5분 | 온도 경고 후 정지 | freeze / power + penguin | 중간 | 2 | 예방적 유지보수 | `mosa_maintenance_03` | 전체 골격 + `snowflake_crown_ornament` | 경고 중 선제 점검하면 후속 결빙을 줄일 수 있다. |
| 3-13 | 프테라 / 머리·부리 | B | 4분 | 고속 생산, 작은 queue | jam / conveyor_block | 낮음 | 2 | 빠른 흐름 관찰 | `ptera_speed_01` | 머리·부리 복원 | 생산 속도가 빨라 작은 정지도 즉시 backlog로 보인다. |
| 3-14 | 프테라 / 몸통·날개 | F | 4~5분 | 다기계, 짧은 사건 반복 | freeze / power | 중간 | 2 | 전환 비용 관리 | `ptera_multitask_02` | 몸통·날개 복원 | 치명도는 낮지만 서로 먼 작은 문제가 리듬 있게 반복된다. |
| 3-15 | 프테라 / 날개·다리 | E | 5~6분 | 전 시스템 종합 | 전체 5종 | 높음(최대 2) | 3 | 우선순위·종합 운영 | `ptera_finale_03` | 전체 골격 + `frost_core` | 모든 축을 쓰되 검증된 세 구간으로 나눠 무작위 혼란을 막는다. |

`목표 시간`은 정상적인 아이 플레이의 클리어 목표다. 제한시간은 Config에서 목표 시간보다 30~60초 길게 둔다. 3-15도 제한시간 360초를 넘기지 않는다.

## 3. 공룡별 3미션 완성 구조

| 공룡 | 미션 1 | 미션 2 | 미션 3 / 결합 | 운영 테마 |
| --- | --- | --- | --- | --- |
| Tyrannosaurus | skull, jaw | spine, ribs, pelvis | hindlimbs, forelimbs, tail → 전체 결합 | 표준 운영 |
| Triceratops | skull, horns, frill | spine, ribs, pelvis | limbs, tail → 전체 결합 | 무거운 생산물과 병목 |
| Spinosaurus | skull, jaw | spine, neural spines, ribs | pelvis, limbs, tail → 전체 결합 | 순서와 공유 설비 |
| Mosasaurus | skull, jaw | vertebrae, ribs | flippers, tail → 전체 결합 | 결빙과 유지보수 |
| Pteranodon | skull, beak | torso, primary wings | secondary wings, legs → 전체 결합 | 고속 생산과 종합 운영 |

미션별 복원 결과는 복원대에 누적된다. 세 번째 미션 클리어 시 앞서 복원한 두 묶음과 현재 묶음을 결합하고, 카메라 이동 → 골격 조립 → 조명·광채 → 공룡 이름 → 유물 부품 순서로 짧게 연출한다. 재플레이에서는 골격 연출은 다시 볼 수 있지만 유물은 중복 지급하지 않는다.

## 4. Map Template

15개 Scene을 만들지 않는다. 하나의 runtime이 아래 템플릿과 Mission Config를 조합한다.

| ID | 역할 | 공간과 흐름 | 주요 사용 미션 |
| --- | --- | --- | --- |
| `LAYOUT_A_BASIC_TWO_FLOOR` | 표준 학습형 | 2층, 한쪽 사다리, 직렬 라인. world 1.5 viewport | 3-1, 3-4, 3-10 |
| `LAYOUT_B_CENTER_LADDER` | 이동 판단형 | 중앙 사다리, 양끝 critical 설비, world 1.8 viewport | 3-2, 3-6, 3-13 |
| `LAYOUT_C_U_LINE` | backlog·병목형 | 상층에서 진행해 하층으로 되돌아오는 U자, queue가 길게 보임 | 3-3, 3-5, 3-7 |
| `LAYOUT_D_MERGE` | 공유 설비형 | 좌우 두 투입 라인이 중앙 shared machine에서 합류 | 3-8 |
| `LAYOUT_E_PARTIAL_THREE_FLOOR` | 유지보수·종합형 | 메인 2층 + 짧은 제어층, 사다리 2개, 먼 유지관리 구역 | 3-11, 3-12, 3-15 |
| `LAYOUT_F_CENTRAL_RESTORATION` | 다부품 조립형 | 여러 라인이 중앙 복원대로 모임, 합류 순서가 보임 | 3-9, 3-14 |

각 템플릿 데이터는 `worldBounds`, `cameraBounds`, `floors`, `ladders`, `playerSpawn`, `machines`, `conveyorPaths`, `issuePoints`, `penguinSpawnCandidates`, `restorationStand`를 반드시 가진다. 좌표는 Mission Config에 복사하지 않고 템플릿의 stable ID를 참조한다. Config의 `travelDistance`는 좌표를 바꾸는 값이 아니라 템플릿 내부의 짧음/보통/김 배치 variant를 고르는 힌트다.

## 5. Event Pattern 원칙

- 사건은 시간 창과 진행 조건을 함께 사용할 수 있다. 예: `60~70초이며 main item이 균열기를 지난 뒤`.
- 각 slot은 확정 사건 하나 또는 제한된 후보 중 하나다. jitter는 기본 ±5초, 후반에도 ±8초를 넘기지 않는다.
- scheduler는 `maxSimultaneousIssues`, 접근 가능성, 동일 설비 cooldown, 남은 시간 최소치를 검사한다.
- critical 문제와 작은 문제를 겹칠 때 먼저 처리할 정답을 HUD 숫자가 아니라 정지한 라인, 쌓이는 생산물, 강한 경고 형태로 보여준다.
- 파생 문제는 원인을 해결하면 함께 회복한다. 파생 문제만 해결했을 때는 원인 설비로 짧은 시각 연결을 보인다.
- 마지막 20초에는 새 critical 사건을 만들지 않는다. 이미 예고된 finale slot만 허용한다.

## 6. Backlog와 restart surge

Backlog는 실제 production item 배열이다. 정지한 설비의 입력 buffer부터 `backlogCapacity`까지 world 좌표의 queue anchor에 차례로 배치한다. 용량 초과 시 새 원석 투입을 보류하며 아이템을 삭제하거나 HUD 숫자로만 축약하지 않는다. 문제 해결 뒤 `restartSpeedMultiplier`를 `restartDurationSec` 동안 적용하되 설비 처리 애니메이션은 생략하지 않는다. 앞 아이템과의 최소 간격을 유지하고, shared machine은 두 라인의 `queuePolicy`에 따라 `fifo`, `alternate`, `missionSequence` 중 하나로 꺼낸다.

## 7. 보상과 영구 진행

Stage 2의 네 표본은 별도 `sampleCollectionId`로 최초 클리어 시 등록한다. Stage 3의 부분 골격 진행과 유물은 이 컬렉션과 섞지 않는다.

| 미션 | 확정 유물 부품 | 기존 데이터 표시명 |
| --- | --- | --- |
| 3-3 | `eternal_ice_crystal` | 영원의 얼음수정 |
| 3-6 | `glacier_crown_frame` | 빙하 왕관틀 |
| 3-9 | `mammoth_medal` | 매머드 메달 |
| 3-12 | `snowflake_crown_ornament` | 눈꽃 왕관장식 |
| 3-15 | `frost_core` | 냉기의 핵 |

이 ID는 `src/config/regionalRelicConfig.ts`의 `frost_crystal_crown` 정의를 그대로 사용한다. RNG, pity, 일반 Stage 3 상자 추첨은 호출하지 않는다. 다섯 부품이 모두 있으면 기존 완성 이미지와 실루엣을 재사용해 **빙설왕의 수정 왕관** 복원 상태를 만든다. 지급 runtime과 저장 마이그레이션은 이번 문서 작업 범위가 아니다.

## 8. 구현 경계

이번 설계는 mission data, template data, event scheduler 계약을 확정한다. Stage 선택 UI, 22미션 저장, 보상 지급, Phaser template renderer는 후속 구현이다. 1차 prototype, 2차 vertical slice, 현재 Stage 1 runtime은 삭제하지 않으며 새 runtime을 검증할 때 참고 구현으로 유지한다.
