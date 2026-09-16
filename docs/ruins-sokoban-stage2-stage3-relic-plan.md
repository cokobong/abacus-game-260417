# 오래된 유적지 Sokoban Stage 2·3 및 유물 엔딩 조사와 설계

> **최신 확정 구조:** Stage 1의 현행 7문제는 유지한다. 아이가 이미 클리어한 현행 Stage 2의 3문제는 **전부 목업 기준점으로만 보존하고 정식 설계 데이터에서 제외**한다. Stage 2는 새 훈련 퍼즐 10문제, Stage 3은 새로 검토한 유물의 방 5문제다. 각 Stage 3 미션의 최초 클리어에 서로 다른 유물 부품을 확정 지급하고 5종 수집 후 보관소에서 `ancient_sun_tablet`을 복원한다. 도전방은 별도 선택 콘텐츠로 예약한다. 정식 설계 후보는 [퍼즐 사양](ruins-sokoban-puzzle-spec.md), [신규 보드 JSON](ruins-sokoban-puzzles.json), [solver 검증 결과](ruins-sokoban-solver-report.json)에 있다. 이전 목업은 [분리된 기록](ruins-sokoban-prototype-stage2.json)에만 있다. **현행 게임 코드는 여전히 목업 3문제를 실행하며, 이번 작업에서 React/Phaser 연결을 바꾸지 않았다.**

## 1. 현행 Stage 구조

2026-09-16 코드 기준이다. **현행 구현**과 아래의 **제안**을 구분한다.

| Stage | 현행 미션 | 클리어 조건 | 구현 상태 |
| --- | ---: | --- | --- |
| 1 | 7 | 1-1은 출구 도착, 1-2~1-7은 모든 상자를 목표에 배치 | 플레이 가능 |
| 2 | 3 | 세 미션 모두 모든 상자를 목표에 배치 | 플레이 가능, 목업 난이도 |
| 3 | 0 | 정의되지 않음 | 카탈로그 자리만 있고 `implemented: false` |

미션 데이터는 `src/config/ruinsSokoban/stage1.ts`, `stage2.ts`, `index.ts`, `types.ts`에 있다. `src/utils/ruinsSokobanRules.ts`의 `isMissionComplete`가 개별 미션을 판정한다. `src/components/screens/ruinsSokoban/createRuinsSokobanGame.ts`의 `MissionManager`는 미션을 순차 진행하고 마지막 완료 시 Stage 완료 콜백을 부른다. `src/components/screens/RuinsSokobanGameHost.tsx`는 이때 코인·희귀조각·아이템이 모두 0/빈 배열인 보상을 한 번 정산한다.

`src/config/adventureStageCatalog.ts`의 `ancientRuins`는 Stage 1·2만 구현 표시한다. Stage 3의 `futureRewardConfig`는 예약 메타데이터이며 실제 보상 처리가 아니다. `src/components/screens/AdventureGameShell.tsx`도 유적지 Stage 1·2만 Sokoban 호스트로 연결한다. 카탈로그의 유적지 이름과 설명은 현재 Sokoban 내용과 다르게 남아 있다. 지역 입장 상태는 `src/config/adventureRegionStatus.ts`에서 `open`, 지역과 게임 ID 연결은 `src/data/adventureRegions.ts` 및 `src/config/adventureStageCatalog.ts`에서 한다.

`src/utils/adventureStageProgress.ts`에서 직전 Stage의 명시적 클리어가 다음 Stage의 해금 조건이며, `implemented`도 입장 조건이다. `src/App.tsx`의 `finishAdventureRun`이 `completeAdventureStage`를 호출한다. `completedStages`와 `visitedStages`는 `src/utils/gameStorage.ts`의 `abacus-dino-game-state-v1` localStorage 상태에 저장되고 로드시 순차 클리어만 유효하게 정규화된다. **미션별 클리어, 현재 미션, 상자 위치, Undo 기록은 저장하지 않는다.** 재입장하면 Stage는 선택 가능하지만 첫 미션부터 시작한다. `src/config/ruinsSokoban/types.ts`에는 basic/hard 필드가 없고 Sokoban 호스트에는 난이도 선택이 없다. 다른 지역의 난이도 체계가 Sokoban에 연결된 것은 아니다.

## 2. 교체 대상인 현행 Stage 2 목업 난이도

`src/config/ruinsSokoban/stage2.ts`의 실제 보드를 기준으로 했다. 숫자는 플레이어 위치와 **상자 위치 전체를 상태로 둔 완전 탐색**에서 밀기 수를 먼저 최소화하고, 그중 이동 수를 최소화한 값이다. 데이터의 `expectedMinPushes`/`expectedMinMoves`와 일치한다. `maxEasyPushes`(4/5/7)는 실제 클리어 조건으로 사용하지 않는 메타데이터다.

| 미션 | 보드 | 상자/목표 | 최소 밀기/이동 | 사고 패턴과 위험 |
| --- | --- | --- | --- | --- |
| 2-1 안쪽 제단부터 | 6×6 | 2/2 | 5/16 | 중앙 기둥을 돌아 아래 상자를 먼저 처리하고 상자 뒤에 설 자리를 확보. 목표 아닌 가장자리·구석에 밀면 회수 불가. |
| 2-2 기둥을 돌아서 | 7×7 | 3/3 | 6/37 | 아래 오른쪽 상자와 중앙 두 상자의 경로를 분리하고 기둥 주위를 길게 우회. 이동 수는 많으나 밀기 계획은 비교적 짧다. 모서리와 통로 입구 막힘 주의. |
| 2-3 좁은 유적 통로 | 7×7 | 3/3 | 8/19 | 왼쪽 목표열에 넣을 순서와 가운데 상자의 이동 공간 확보. 위쪽 막다른 곳에 잘못 배치하거나 상자끼리 통로를 막으면 교착. |

모든 미션은 `boxesOnGoals` 조건이고 시간·밀기 횟수 제한은 없다. `src/utils/ruinsSokobanRules.ts`의 정적 deadlock 경고는 목표가 아닌 단순 벽 모서리만 탐지한다. 상자끼리 막거나 벽을 따라 복구 불가능한 배치는 완전히 판정하지 않는다. Undo/초기화로 회복 가능하다.

**기존 2-1~2-3은 모두 교체한다.** 5/16, 6/37, 8/19는 아이가 클리어한 목업의 비교 기준이다. 신규 2-1은 6밀기로 시작하고, 신규 2-2·2-3은 각각 강제된 상자 순서와 통로 순서를 훈련한다. 과거 `docs/ruins-sokoban-mockup-plan.md`의 목표 밀기 수는 설계 초안이다.

## 3. 현행 유물 정의와 획득

`src/config/regionalRelicConfig.ts`의 `ancientRuins`는 완성 유물 `ancient_sun_tablet`(고대 태양기계 석판)과 다섯 부품 `emerald_stone`, `ancient_tablet`, `dinosaur_skull_emblem`, `sun_gear`, `rune_core`를 정의한다. 각 PNG는 `src/assets/adventure/relics/parts/ruins/` 및 `completed/ruins/`에 실제 존재하며 실루엣도 `silhouettes/ruins/`에 있다. 정의 배열 순서는 위 순서이지만 **획득 순서를 뜻하지 않는다**.

`src/config/worldMapRelicConfig.ts`의 공통 `RegionRelicProgress`는 `ownedPartIds`, `completed`, `consecutiveMisses`, `stage3FirstCleared`, `chestOpenedCount`를 가진다. 정규화 과정에서 알 수 없는 ID와 중복 ID를 제거한다. 공통 `resolveRegionFinalChest`는 아직 없는 부품만 추첨해 중복 지급을 피한다. 기본 드랍률 37.5%, 연속 2회 실패 후 70%, 3회 실패 후 100%다. 이미 다 모았으면 부품을 지급하지 않는다. 추첨된 부품은 이 함수가 반환한 상태에 즉시 들어가지만, **현재 `src/App.tsx`의 `finishAdventureRun`은 용암계곡·하늘섬 Stage 3 최종 상자에서만 이 함수를 호출한다. 유적지에는 호출 경로가 없다.** 따라서 유적지 Stage 3 보상, 확률 드랍, 확정 지급, 난이도별 드랍은 현재 모두 미구현이다. `src/config/adventureStageCatalog.ts`의 유적지 item pool도 비어 있다.

## 4. 현행 복원과 엔딩

다섯 고유 부품을 얻어도 자동 복원되지는 않는다. `src/config/worldMapRelicConfig.ts`의 `canRestoreRegionRelic`이 다섯 종류 보유와 미완료를 검사한다. `src/components/screens/AdventureMapScreen.tsx`의 유물 보관소 상세 화면에서 **유물 복원하기** 버튼을 누르면 `src/App.tsx`의 `restoreRegionRelic`이 `completed: true`로 저장한다. 같은 localStorage 상태가 보관소 카드, 지역 지도 유물 0~5 표시, 완성 이미지, 세계의 문 5지역 진행도에 반영된다. `src/config/worldMapRelicConfig.ts`의 `WORLD_GATE_REQUIRED_RELICS`는 5다. 유적지만의 별도 엔딩 화면이나 복원 애니메이션 시퀀스는 없다. 보관소에는 복원 전/후 정적 광채와 제단 이미지가 있다.

`src/utils/adventureRewards.ts`는 별도의 일반 모험 결과 생성 코드이며 Sokoban 부품 지급 경로가 아니다. `src/utils/gameStorage.ts`는 전체 게임 상태 저장·백업을 맡고 부품 전용 저장소는 없다. `src/utils/adventureStageProgress.ts`의 `FutureRegionRelicProgress`는 예약 인터페이스이며 실제 저장 필드가 아니다.

## 5. 다른 지역 Stage 3 재사용성

용암계곡 `src/components/screens/LavaPathPrototype.tsx`는 Stage 3 최종 상자 등장·열기 연출, 일반 아이템 보너스, 성공 결과 화면의 유물 부품 결과를 구현한다. 상자 열기 때 `finalChestBonus`를 포함해 `onFinishRun`을 호출하고, `src/App.tsx`는 해당 보너스가 있을 때만 부품 추첨과 저장을 한다. 하늘섬에도 `src/App.tsx`의 공통 추첨 호출이 있다. `src/config/worldMapRelicConfig.ts`의 중복 방지·확률·pity·복원 조건은 지역 공통으로 재사용 가능하다. `src/config/adventureStageCatalog.ts`의 `futureRewardConfig` 자체는 동작하지 않는다.

| 요소 | 판단 | 이유 |
| --- | --- | --- |
| 부품 정의, 누락 부품, 중복 방지, 저장, 복원 조건 | **REUSE** | `ancientRuins` 정의와 공통 상태가 이미 있음 |
| `resolveRegionFinalChest`, `finishAdventureRun` 정산 | **EXTEND** | 추첨기는 지역 공통이지만 App 호출은 용암/하늘섬으로 한정 |
| 용암 상자 UI·결과 표시 | **EXTEND** | 흐름은 참고 가능하나 러너 컴포넌트에 묶여 있어 Sokoban 완료 화면에는 별도 연결 필요 |
| 유적지 Stage 3 퍼즐·보상 트리거·엔딩 장면 | **새 구현** | 현재 연결된 경로가 없음 |

## 6. 정식 Stage 2 제안

**확정 구성은 신규 10문제다.** 2-1 밀기 면 확보, 2-2 상자 순서, 2-3 통로 진입 순서, 2-4 반대 방향 선행 이동, 2-5 통로 확보, 2-6 상자 간 간섭, 2-7 목표 배정, 2-8 임시 배치, 2-9 반대 이동과 제단 비우기, 2-10 네 상자 종합 시험 순이다. 각 보드는 현행 목업과 다르다. 제한 탐색에서 의도한 기계적 조건을 금지하면 해당 보드는 풀리지 않았다. 2-1~2-3은 목업 클리어 아이의 새 출발점, 2-4~2-6은 시행착오, 2-7~2-9는 핵심 아이디어, 2-10은 Stage 3 진입 시험으로 계획한다. 밀기·이동 수만으로 실제 아동 체감 난이도까지 입증한 것은 아니다. 세 단계 힌트는 사고 방향 → 주목할 상자/통로 → 다음 한 번의 밀기 순서이며 전체 경로는 공개하지 않는다.

## 7. Stage 3 제안

**유물의 방은 5문제다.** 3-1 고대 석판의 방(`ancient_tablet`, 통로 순서·우회), 3-2 공룡 문장의 방(`dinosaur_skull_emblem`, 반대 방향·자리 확보), 3-3 에메랄드의 방(`emerald_stone`, 목표 배정·간섭), 3-4 룬 핵의 방(`rune_core`, 임시 배치·통로 확보), 3-5 태양 장치의 방(`sun_gear`, 네 상자 종합)이다. 3-1은 목표 위 상자를 다시 이동하지 않으면 해결되지 않는다. 3-2·3-5는 목표까지의 최소 배정 거리가 일시적으로 증가하는 밀기가 필수다. 3-3은 한 상자의 목표 배정과 상자 순서가 강제되고, 3-4는 반대 이동과 목표 비우기가 모두 필수다. 3-5에서도 인접한 두 상자의 밀기 순서가 강제된다. 최초 클리어 후 봉인 해제 → 부품 등장 → 획득 카드 연출을 고려한다. 엔진의 Stage 3 타입, 퍼즐 카탈로그, 최초 클리어 기록 및 재입장 구조는 아직 없다.

## 8. 유물 획득 A/B/C 비교

| 안 | 아이 동기·반복 플레이 | 노가다성 | 구현·기존 재사용 |
| --- | --- | --- | --- |
| A: Stage 3 완료마다 확률 부품 | 상자 기대감은 크지만 실패가 반복될 수 있음 | 높음, 특히 5종 수집까지 | 공통 상자 추첨기 재사용 쉬움. Stage 3 반복 동선 추가 필요 |
| B: 서로 다른 5퍼즐 최초 클리어마다 고유 부품 확정 | 문제 해결과 새 부품이 직접 연결되어 목표가 명확 | 낮음, 자율 재도전 가능 | 최초 클리어·미션별 보상 ID·저장 추가 필요. 보관소·복원은 재사용 |
| C: 반복 퍼즐 풀 + 일반 보상 + 중복 없는 확률/pity | 상자 기대와 재도전 유도 | pity가 제한하지만 여전히 반복 요구 | 현행 공통 추첨기와 가장 유사. 반복 풀 운영·일반 보상·결과 UI 필요 |

**B안으로 확정했다.** 아이가 실제로 퍼즐을 해결해 얻는 보상이라는 인과가 명확하다. 다섯 퍼즐을 각각 처음 풀 때 위 순서의 부품 하나를 확정 지급하고, 모두 모으면 보관소 복원 버튼을 사용한다. 마지막 퍼즐 클리어는 석판 복원 가능 안내와 유적지 엔딩 연출로 이어지게 한다. 재도전은 선택 가능하게 하되 부품을 다시 지급하지 않는다. 선택적 일반 보상이나 상자 연출은 추가할 수 있지만 부품 획득을 확률에 묶지 않는다.

## 9. 엔딩 에셋 현황과 추가 필요

기존 에셋: `src/assets/adventure/relics/parts/ruins/`의 5부품, `completed/ruins/ancient_sun_tablet.png`, `silhouettes/ruins/ancient_sun_tablet.png`, `ui/altars/03_relic_altar_ruins.png`, `ui/effects/08_relic_restore_orb_aura.png`·`09_relic_restore_complete_glow.png`, `ui/slots/06_relic_slot_frame_5set.png`, `ui/badges/08_relic_complete_badge.png`가 있다. `src/assets/adventure/relics/index.ts`에서 불러온다. 유적지 Sokoban에는 봉인문·상자·제단 이미지가 `src/assets/adventure/ruins/objects/`에 있다. 보관소의 완료 표시는 UI 텍스트와 badge로 처리한다.

추가 검토: 유적지만의 복원 완료 리본/명판, 봉인 해제 연속 효과, 최종 퍼즐에서 보관소로 이어지는 장면 또는 카드, 부품 확정 획득 결과 카드. 이 항목은 현재 유적지 전용 에셋으로 확인되지 않았으며, 정적 UI 조합과 CSS 연출로 대체 가능한지 먼저 결정한다. 기존 제단·광채·완성 이미지를 우선 재사용한다.

## 10. 구현 전 결정사항

1. 신규 Stage 2 10문제와 Stage 3 5문제의 solver 증명은 문서화했다. 실제 아이 테스트로 풀이 시간·Undo·힌트 사용과 체감 난이도 순서를 검토한다.
2. Stage 3 다섯 퍼즐을 순차 해금할지, 첫 입장부터 선택할지 결정한다. 미션별 최초 클리어 상태를 Stage 완료와 별도로 영속화해야 한다.
3. 확정된 부품-퍼즐 고정 매핑을 기준으로 지급 시점, 앱 종료·중복 콜백에 대한 멱등성을 정한다.
4. Stage 3 클리어와 다섯 부품 완료, 복원 버튼, 유적지 엔딩 화면의 순서를 확정한다.
5. 현재 카탈로그 설명과 지도 문구를 Sokoban으로 교체하고 Stage 3 구현 플래그를 연결할 시점을 정한다.
6. 보상 결과와 엔딩에 기존 정적 에셋만 쓸지 추가 제작할지 결정한다.

## 11. 확정 구조의 저장·보상 계약 제안

현행 `completedStages`/`visitedStages`는 그대로 Stage 단위로 유지하고, 유적지 전용 `missionProgress`를 게임 상태에 추가한다. 예시 형태는 `{ stage2: { clearedIds: string[] }, stage3: { clearedIds: string[] }, challenge: { unlocked: boolean, records: {} } }`다. 각 목록은 정의된 ID만 허용하고 중복을 제거한다. 입장 시 순서상 첫 미클리어 미션으로 이어 가며, 이미 푼 미션은 선택 재도전할 수 있게 한다. **미션 클리어 상태를 저장하되 퍼즐 내부의 상자 위치와 Undo는 저장 대상이 아니다.** Stage 2는 10개, Stage 3은 5개 ID 모두 클리어해야 기존 `completeAdventureStage`에 Stage 완료를 알린다. Stage 3 보상이 누락된 옛 저장 상태를 어떻게 보정할지도 구현 전에 정해야 한다.

Stage 3 클리어 트랜잭션은 미션 ID를 확인하고 `clearedIds`에 없을 때만 대응 부품 ID를 `regionRelicProgress.ancientRuins.ownedPartIds`에 추가한다. 미션 클리어와 부품 추가를 **같은 전체 게임 상태 변경과 `saveGameState` 호출**로 묶어 중복 콜백·재클리어에도 부품을 한 번만 준다. 이후 5종이면 `canRestoreRegionRelic`이 참이 되고 보관소에서 명시적 복원을 수행한다. 공통 확률 상자 추첨기는 유적지의 필수 부품 지급에 사용하지 않는다.

도전방은 메인 Stage 번호에 묶지 않은 별도 `challenge` 네임스페이스에 문제 ID와 선택적 최소 밀기 기록·별 등급을 둘 수 있도록 예약한다. 해금은 복원 완료 후로 제안한다. 이번 범위에는 실제 도전방 문제나 보상 연결을 포함하지 않는다.

참고로 과거 `docs/ruins-sokoban-game-design.md`, `docs/ruins-sokoban-mockup-plan.md`, `docs/ruins-sokoban-phaser-plan.md`는 Stage 3·유물 보상을 의도적으로 범위 밖에 둔 목업 설계 문서다. 그 안의 Stage 3 확장 구상이나 난이도 목표는 현재 구현으로 간주하지 않는다.
