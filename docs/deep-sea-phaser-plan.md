# 심해협곡 Phaser 구현 계획

## 1. 구현 범위

첫 구현은 Stage 1 목업 1맵과 Stage 2 목업 1맵까지다. 실제 에셋 없이 색상 타일, 도형, 텍스트 라벨로 게임 규칙과 체감을 검증한다. Stage 3는 데이터 구조만 미리 수용하고 맵과 게임플레이는 구현하지 않는다.

## 2. 권장 모듈 구조

향후 구현 시 다음과 같이 Phaser 실행 코드와 데이터를 분리한다.

- src/components/screens/DeepSeaGameHost.tsx: React와 Phaser 생명주기, 결과 콜백, 외부 모달 연결
- src/components/screens/deepSea/createDeepSeaGame.ts: Phaser.Game 생성과 destroy
- src/components/screens/deepSea/scenes/DeepSeaScene.ts: 맵, 카메라, 시스템 조합
- src/components/screens/deepSea/systems/: 이동, 시야, 위험, 발견, 목표, 보상 시스템
- src/config/deepSea/types.ts: 공통 config 타입
- src/config/deepSea/stage1.ts, stage2.ts: 스테이지별 맵 목록과 규칙
- src/config/deepSea/discoveries.ts: 심해도감 정의
- src/assets/adventure/deep-sea/: 나중에 적용할 에셋 진입점

목업 단계에서는 파일 수를 과도하게 늘리지 말고 scene과 순수 로직 모듈부터 시작한다. 경로 탐색, 목표 판정, 소나 횟수 같은 규칙은 Phaser 객체와 분리해 단위 테스트할 수 있게 한다.

## 3. Phaser Tilemap

- 타일 크기 기준안: 논리 48px. 화면 크기에 따라 카메라 zoom을 조절하되 맵 좌표는 고정한다.
- 레이어: floor, wall, decoration, collision, interactable marker.
- 목업은 숫자 배열 또는 CSV 타일맵으로 시작할 수 있다.
- 실제 제작 단계에서는 Tiled JSON 또는 Phaser tilemap JSON으로 교체한다.
- 충돌은 장식 스프라이트가 아니라 collision 레이어의 타일 속성으로 판정한다.
- 출발점, 출구, 발견물, 상자, 적 순찰점은 오브젝트 레이어 또는 동일한 config 좌표로 관리한다.

맵 데이터 로딩 뒤 중복 좌표, 맵 밖 좌표, 막힌 출구, 도달 불가능한 필수 목표를 검증하는 개발용 검사 함수를 둔다.

## 4. 카메라 추적

- 카메라는 잠수정 중심을 추적하고 월드 경계를 넘지 않는다.
- 즉시 고정보다 약한 lerp를 사용하되 멀미나 입력 지연처럼 느껴지지 않게 한다.
- 세로 화면에서 진행 방향 앞쪽이 조금 더 보이도록 작은 deadzone 또는 look-ahead를 검토한다.
- HUD와 4방향 패드는 카메라가 아닌 화면 고정 레이어에 둔다.
- resize 시 월드 좌표를 바꾸지 않고 카메라 viewport와 zoom만 갱신한다.

## 5. 4방향 이동

- 이동 상태는 currentDirection과 queuedDirection으로 나눈다.
- 플레이어가 방향 패드를 누르면 queuedDirection을 갱신한다.
- 다음 타일 중심에서 해당 방향이 열려 있으면 회전하고, 막혀 있으면 현재 방향을 유지하거나 정지한다.
- 대각선 이동은 허용하지 않는다.
- 이동 속도는 delta time 기반으로 계산한다.
- 키보드 방향키는 개발·접근성 보조 입력으로만 지원하고 기준 조작은 화면 패드다.

화면 패드는 포인터 다운 시 입력을 시작하고 포인터 업·취소·화면 이탈 시 반드시 해제한다. 연속 입력 중 반대 방향 전환도 허용한다.

## 6. 제한 시야와 fog of war

두 기능을 분리한다.

- 제한 시야: 잠수정 주변만 밝게 보이는 매 프레임 효과
- 탐험 기록 fog: 방문한 타일은 어둡지만 윤곽이 남는 영속 런 상태

권장 구현 순서:

1. 카메라 위에 저해상도 RenderTexture 또는 GeometryMask 기반 어둠 레이어를 둔다.
2. 잠수정 중심의 원형 또는 부드러운 다각형 영역을 지운다.
3. 방문 타일은 비트셋 또는 1차원 배열로 기록한다.
4. Stage 2 소나 사용 시 제한 시간 동안 반경을 넓히고 관심 지점 방향 신호를 표시한다.

타일마다 반투명 스프라이트를 생성하지 않는다. Stage 1은 넓은 반경, Stage 2는 좁은 반경을 config로 둔다. 소나는 기본 3회이며 재사용 대기시간을 짧게 두어 중복 터치를 방지한다.

## 7. 위험 AI

### 순찰

- config에 순찰점 배열을 저장한다.
- 현재 목표점까지 타일 경로로 이동하고 도착하면 다음 점으로 전환한다.
- 목업에서는 미리 검증된 통로의 순찰점만 사용해 매 프레임 경로 탐색을 피한다.

### 짧은 추적

- 플레이어가 반경 안에 있고 벽으로 완전히 차단되지 않았을 때만 추적한다.
- 경로 재계산은 매 프레임이 아니라 제한된 주기 또는 플레이어가 새 타일에 들어갔을 때 수행한다.
- 추적 시간 또는 이탈 거리를 넘으면 가장 가까운 순찰점으로 복귀한다.

### 문어 매복

- hidden, warning, lunge, cooldown의 단순 상태 머신으로 구현한다.
- 경고 표시 뒤 직선으로 짧게 돌진한다.
- 화면 밖 문어의 애니메이션과 AI 업데이트는 정지한다.

충돌 시 하트 1개 감소, 짧은 무적, 잠수정 점멸 또는 색상 변화만 적용한다. 전투·적 체력·공격 버튼은 만들지 않는다.

## 8. 발견물과 심해도감

발견물 config 권장 필드:

- id, catalogId, category, tile position
- discoveryRadiusTiles
- requiredForExit
- rarity
- oneTimePopup

플레이어가 새 타일에 진입했을 때만 가까운 발견물을 검사한다. 새 발견이면 런 상태에 추가하고 목표 시스템과 HUD에 이벤트를 보낸다. 저장은 React host의 완료/발견 콜백을 통해 앱 상태에서 처리한다. 도감 기록을 Phaser 내부 localStorage에 직접 저장하지 않는다.

## 9. 보물상자와 보상

- 상자는 closed, opened 두 상태만 가진다.
- 인접 또는 접촉 시 자동 개봉을 기본안으로 한다.
- 중복 개봉 방지를 위해 런별 openedChestIds를 유지한다.
- 일반 상자는 코인 또는 기존 상점 아이템을 지급한다.
- 희귀 상자와 Stage 3 최종 상자는 서로 다른 reward table을 참조한다.
- 실제 앱 정산은 기존 MinigameRunRewards/onFinishRun 경로를 사용하되 심해협곡 regionId를 인식하도록 확장이 필요하다.

실패 보상 정책이 확정되기 전에는 collected, committed를 분리해 구현한다.

## 10. 목표 관리

목표는 코드 콜백 묶음이 아니라 선언형 config로 둔다.

| 목표 종류 | 예 |
|---|---|
| discoverAny | 지정된 발견물 3개 중 2개 |
| discoverAll | 필수 발견물 모두 |
| openChest | 특정 또는 임의 상자 N개 |
| reachExit | 활성화된 출구 도달 |

ObjectiveManager는 이벤트를 받아 진행도를 계산하고 모든 필수 조건이 만족되면 출구를 활성화한다. 선택 목표는 출구 조건에 포함하지 않고 결과 화면의 추가 달성으로 표시한다.

## 11. Stage config

각 맵 config는 최소한 다음 데이터를 가진다.

- mapId, stage, mapPackId, tilemapKey, width, height
- playerStart, exit
- visionRadius, sonarCharges
- objectives, discoveries, chests
- hazard instances와 patrol points
- rewardTableId
- 예상 플레이 시간과 목업 검증 메타데이터

Stage 3는 stage3 map ID 배열과 선택 규칙만 추가한다. 새 맵은 config 등록과 타일맵 파일 추가로 플레이 가능해야 하며 scene 내부에 mapId별 조건문을 만들지 않는다.

## 12. 앱 연결 작업 목록

목업 구현 시 필요한 최소 변경 지점:

1. [src/config/minigameConfig.ts](../src/config/minigameConfig.ts): 심해협곡 MinigameId와 진입/보상 정책 추가
2. [src/data/adventureRegions.ts](../src/data/adventureRegions.ts): deepSeaCanyon에 gameId 연결
3. [src/config/adventureStageCatalog.ts](../src/config/adventureStageCatalog.ts): Stage 1/2 implemented 활성화와 플레이 시간 반영
4. [src/components/screens/AdventureGameShell.tsx](../src/components/screens/AdventureGameShell.tsx): DeepSeaGameHost 분기
5. [src/App.tsx](../src/App.tsx): deepSeaCanyon 보상 정산, 스테이지 완료, 지역 유물 진행 연결
6. [src/utils/gameStorage.ts](../src/utils/gameStorage.ts) 및 [src/types/game.ts](../src/types/game.ts): 심해도감 기록 저장 계약

현재 Phaser 패키지는 설치 선언되어 있으며 [src/components/screens/RuinsMirrorGameHost.tsx](../src/components/screens/RuinsMirrorGameHost.tsx)와 [src/components/screens/ruinsMirror/createRuinsMirrorGame.ts](../src/components/screens/ruinsMirror/createRuinsMirrorGame.ts)의 lazy import/destroy 방식을 재사용할 수 있다.

## 13. 구형 iPad 성능 원칙

[docs/mobile-game-performance.md](./mobile-game-performance.md)의 기존 기준을 Phaser에 맞춰 적용한다.

- 한 개의 Phaser game loop만 사용하고 React state를 매 프레임 갱신하지 않는다.
- HUD는 값이 바뀔 때만 React 또는 Phaser text를 갱신한다.
- 화면 밖 적, 파티클, 장식 애니메이션은 중지한다.
- 시야 마스크는 저해상도 단일 텍스처 중심으로 구현한다.
- 탐색 경로는 캐시하고 재계산 빈도를 제한한다.
- 파티클과 일회성 효과는 풀링하거나 종료 즉시 제거한다.
- 목업 타일은 단일 atlas 또는 graphics 캐시를 사용하고 타일별 DOM을 만들지 않는다.
- 실제 에셋은 중요 캐릭터 약 512px, 반복 수집물 128~256px 기준에서 시작한다.
- critical asset의 preload/decode가 끝난 뒤 게임을 시작한다.
- production build를 iPad Safari 실기기에서 검증한다.

초기 목표는 60fps이되 구형 기기에서 안정적인 30fps와 입력 반응 유지가 우선이다. 동시에 활성화하는 적, 광원, 파티클 수에 명시적 상한을 둔다.

## 14. 테스트 계획

- 순수 로직: 타일 이동, 회전 예약, 충돌, 하트, 목표 판정, 소나 횟수
- 맵 검증: 시작점에서 필수 목표와 출구까지 도달 가능, 좌표 유효, 중복 ID 없음
- 진행 통합: Stage 1 완료 후 Stage 2 해금, Stage 2 완료 후 미구현 Stage 3 잠금
- 보상 통합: 한 runId당 한 번만 정산
- 수동 실기기: 입력 지연, 카메라 멀미, fog 가독성, 장시간 플레이 메모리 증가
