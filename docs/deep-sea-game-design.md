# 심해협곡 미니게임 기획

## 1. 목적과 정체성

심해협곡은 잠수정을 조종해 넓은 미로형 해저 지형을 탐험하고, 발견물을 기록하며, 위험 생물을 피해 출구에 도달하는 탐험형 미로 어드벤처다. 핵심 감정은 제한된 정보 속에서 길을 찾아 새로운 장소를 발견하는 즐거움이다.

- 장르: 탐험형 미로 어드벤처
- 이동: 팩맨식 4방향 타일 이동
- 화면: 큰 타일맵과 잠수정 중심 카메라 추적
- 핵심 요소: 제한 시야, 탐험, 발견, 위험 회피, 수집
- 제외 요소: 전투, 레벨, 능력치, 장비 강화 등 RPG 성장
- 조작: 화면 하단 4방향 패드
- 체력: 하트 3개
- 기준 환경: 웹 호스팅, Phaser, iPad Pro 1세대 세로 화면

## 2. 핵심 탐사 루프

1. 잠수정이 입구에서 출발한다.
2. 보이는 통로를 따라 4방향으로 이동한다.
3. 시야 밖 공간을 열고 랜드마크, 발견물, 보물상자를 찾는다.
4. 발견물 가까이 접근하면 심해도감에 자동 등록되고 목표가 갱신된다.
5. 순찰·매복 위험과 환경 장애물을 피해 하트를 보존한다.
6. 필수 발견 조건을 달성하면 출구가 활성화된다.
7. 출구에 도달하면 수집 보상을 정산하고 발견 기록을 저장한다.

시간제한으로 서두르게 하기보다 길 찾기와 발견 자체가 긴장을 만들도록 한다. 같은 통로를 반복하게 하는 막다른 길은 짧게 유지하고, 큰 랜드마크와 색·형태가 다른 구역으로 위치 기억을 돕는다.

## 3. 공통 규칙

- 잠수정은 통과 가능한 타일 사이를 상·하·좌·우로 이동한다.
- 방향 전환 예약을 허용해 교차로 직전에 누른 입력도 자연스럽게 반영한다.
- 위험과 접촉하면 하트 1개를 잃고 짧은 무적 시간을 얻는다.
- 하트가 0이 되면 탐사를 중단한다.
- 실패 시 기본안은 이미 등록한 도감 기록은 유지하고, 런 중 코인·상자 보상은 일부만 유지하는 것이다. 정확한 비율은 목업 테스트 후 확정한다.
- 출구는 목표 충족 전에는 잠겨 있으며, 활성화 시 지도·HUD·화면 효과로 동시에 알린다.

## 4. Stage 구조

### Stage 1: 바다 입구

- 목업 맵: 1개
- 크기: 24×24~28×28 타일, 기준안 26×26
- 목표 시간: 3~5분
- 시야: 넓음
- 위험: 없거나 느린 순찰 생물 1마리
- 발견 목표: 산호 군락, 오래된 석상, 보물상자
- 클리어: 3개 중 2개 이상 발견하면 출구 활성화
- 학습 목표: 이동, 카메라 추적, 자동 발견, 목표 HUD, 출구 활성화를 별도 설명 없이 이해

맵은 튜토리얼이지만 작게 만들지 않는다. 입구 근처에 첫 발견물을 배치하고, 나머지 두 발견물은 서로 다른 갈림길에 둔다. 되돌아오는 길에는 지름길을 열어 반복 이동을 줄인다.

### Stage 2: 깊은 물길

- 목업 맵: 1개
- 크기: 28×28~32×32 타일, 기준안 30×30
- 목표 시간: 5~7분
- 시야: Stage 1보다 좁음
- 신규 기능: 소나, 기본 3회
- 위험 생물: 상어 순찰과 문어 매복
- 체력: 하트 3개
- 목표 구조: 필수 탐사 목표와 선택 목표 분리
- 수집: 일반 보물상자, 희귀 발견

권장 목표안은 필수 발견물 2개를 모두 찾으면 출구가 열리고, 희귀 생물 또는 숨은 난파물과 보물상자는 선택 보너스로 두는 것이다. 소나는 주변 통로와 미발견 관심 지점의 방향을 잠시 드러내되 정답 경로 전체를 표시하지 않는다.

### Stage 3: 심해 중심부와 맵팩

- MVP: 3~4개 맵
- 확장 목표: 10~12개 이상
- 맵 크기: 32×32~40×40
- 목표 시간: 7~10분
- 진입 방식: 랜덤 또는 플레이어 선택형
- 구성: 탐사 목표, 보물상자, 미니 도감, 위험 회피, 유물조각
- 장기 목표: 유물조각 5개 수집 → Final Map 개방 → 최종 유물 복원

Stage 3의 개별 맵은 규칙 코드를 추가하지 않고 맵 데이터와 목표·위험·보상 설정을 추가하는 방식으로 확장한다. 맵팩은 고유 테마, 발견물 목록, 위험 조합, 보상표를 가진다.

## 5. 심해도감

심해도감은 소비되지 않는 지역 발견 기록이다. 발견물의 일정 반경 안으로 들어가면 자동 등록하며, 등록 순간 짧은 이름표와 카테고리를 보여준다.

| 카테고리 | 예시 |
|---|---|
| 자연 | 산호 군락, 열수 분출공, 발광 해초 |
| 유적 | 오래된 석상, 제단, 석문 |
| 난파물 | 침몰선, 화물 상자, 닻 |
| 생물 | 상어, 문어, 해파리, 희귀 발광 생물 |

도감은 discoveryId, 이름, 카테고리, 최초 발견 맵, 희귀도, 발견 여부를 저장한다. 일부 발견물은 스테이지 목표로 참조하지만 보상 아이템과는 분리한다. 발견률은 발견한 고유 ID를 현재 공개된 전체 ID로 나눠 계산한다.

## 6. 위험 설계

- 상어: 지정 경로 순찰. 가까워지면 짧게 추적하고 추적 반경 밖에서는 순찰로 복귀한다.
- 문어: 정해진 은신 지점에서 대기하다 접근 시 한 번 돌진하고 재사용 대기 상태가 된다.
- 해파리: 고정 또는 짧은 반복 경로를 이동하는 접촉 위험.
- 해류: 일정 방향으로 잠수정을 밀며 조작을 완전히 빼앗지는 않는다.
- 낙석: 예고 표시 후 한 타일 또는 작은 범위에 발생한다.

Stage 1은 느린 순찰 하나 이하, Stage 2는 상어와 문어를 우선 사용한다. 동시에 화면에 활성화되는 추적형 적 수를 제한한다.

## 7. 보상 구조

### 즉시 보상

- 맵에서 수집하는 코인
- 보물상자
- 기존 상점 아이템

### 중기 보상

- 심해도감 영구 발견 기록
- 카테고리 및 전체 발견률
- 희귀 발견 기록

### 장기 보상

- Stage 3 유물조각 5개
- Final Map 개방
- 심해협곡 최종 유물 복원

한 런의 보상 결과는 지갑 보상과 영구 발견 기록을 구분한다. 중복 도감 발견은 새 기록으로 계산하지 않는다.

## 8. 유물조각과 Final Map

기존 지역 유물 시스템의 심해협곡 유물은 5개 부품으로 정의되어 있다. Stage 3 완료 보물상자에서 아직 없는 조각을 획득하는 기존 지역 공통 흐름을 우선 재사용한다. 5개를 모두 모으면 Final Map을 개방하고, Final Map 완료 뒤 유물 보관소에서 최종 복원을 확정하는 구조를 권장한다.

Final Map 개방 여부와 유물 복원 완료 여부는 분리한다. 조각 완성, Final Map 완료, 최종 복원 상태를 각각 표현할 수 있어야 한다.

## 9. 향후 업데이트 구조

- 맵: 타일맵 키와 시작점, 출구, 목표, 위험, 상자 배치 데이터
- 발견물: 전역 도감 정의와 맵별 배치 데이터
- 목표: 발견 개수, 특정 발견, 상자 개봉 등 선언형 조건
- 위험: 종류별 설정과 맵별 인스턴스 데이터
- 보상: 스테이지/맵별 보상표
- 맵팩: 공개 조건과 포함 맵 ID 목록

새 맵팩 추가 시 엔진 분기문보다 config와 타일맵 데이터를 추가하는 것을 원칙으로 한다.

## 10. 현재 프로젝트 연결 조사

- Phaser 재사용 가능: [src/components/screens/ruinsMirror/createRuinsMirrorGame.ts](../src/components/screens/ruinsMirror/createRuinsMirrorGame.ts)는 Phaser 게임의 지연 로딩, React host 콜백, scene restart와 destroy 패턴을 제공한다.
- 게임 진입 연결: [src/components/screens/AdventureGameShell.tsx](../src/components/screens/AdventureGameShell.tsx)에 심해협곡 분기가 아직 없다.
- 지역 ID와 잠금 상태: [src/data/adventureRegions.ts](../src/data/adventureRegions.ts)의 deepSeaCanyon에는 아직 gameId가 없다. [src/config/adventureRegionStatus.ts](../src/config/adventureRegionStatus.ts)는 현재 공개 상태를 관리한다.
- 스테이지 진행: [src/config/adventureStageCatalog.ts](../src/config/adventureStageCatalog.ts)와 [src/utils/adventureStageProgress.ts](../src/utils/adventureStageProgress.ts)를 통해 구현 여부, 순차 해금, 완료를 연결할 수 있다.
- 보상 계약: [src/config/minigameConfig.ts](../src/config/minigameConfig.ts)의 MinigameRunRewards와 onFinishRun 흐름을 확장해 코인·상점 아이템을 정산할 수 있다.
- 하트 UI/회복 규칙 참고: [src/components/screens/LavaPathPrototype.tsx](../src/components/screens/LavaPathPrototype.tsx), [src/components/screens/SkyIslandPrototype.tsx](../src/components/screens/SkyIslandPrototype.tsx), [src/config/adventureCollectibles.ts](../src/config/adventureCollectibles.ts).
- 유물 연결: [src/config/regionalRelicConfig.ts](../src/config/regionalRelicConfig.ts)에 심해협곡 유물 5부품이 이미 정의되어 있고, [src/config/worldMapRelicConfig.ts](../src/config/worldMapRelicConfig.ts)가 지역 공통 획득·복원 진행을 제공한다.
- 성능 기준: [docs/mobile-game-performance.md](./mobile-game-performance.md), [docs/touch-tablet-ui-guidelines.md](./touch-tablet-ui-guidelines.md).

심해도감은 현재 공룡 도감의 discoveredSpeciesIds와 의미가 다르므로 같은 배열에 섞지 않고 별도 저장 필드로 설계한다.
