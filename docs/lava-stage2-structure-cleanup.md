# 용암계곡 Stage 2 구조 정리 보고

검증일: 2026-09-09

## 수정 파일

- `src/components/screens/LavaPathPrototype.tsx`
- `src/config/lavaStageGameplay.ts`
- `src/config/lavaStageGameplay.test.ts`
- `src/config/lavaStageSegments.ts`
- `src/config/adventureStageCatalog.ts`
- `src/index.css`
- `docs/lava-stage2-structure-cleanup.md`

새 이미지 에셋은 생성하거나 추가하지 않았다. 기존 Stage 2 배경도 그대로 유지했다.

## Ramp transition zone

상단 길을 `transition` ramp와 `upper` 발판으로 분리했다. Ramp의 논리 구간은 화면 너비 기준 24%이고 양쪽 8%를 추가 예약 영역으로 검사한다. Ramp를 배치할 때 예약 영역에 남은 기존 오브젝트를 제거하고, 이후 다음 항목을 그 구간에 생성하지 않는다.

- 일반 아이템
- 코인
- 희귀조각
- 화석조각
- 바위와 용암 장애물
- 체크포인트

Ramp는 하단에서 상단으로 이동하는 시각적 안내와 착지면만 담당한다. 화석조각은 ramp가 끝난 뒤의 상단 발판 x=132 지점에 명시적으로 배치한다.

## Route/lane 구분

`LavaRoute` 타입으로 `lower`, `upper`, `transition`, `secret`을 정의했다. 모든 런타임 아이템에 `route`를 기록하고 DOM에는 `data-route`로 노출한다. 발판에도 route를 기록하므로 이후 상단 전용 보상과 비밀길 보상을 게임 로직을 다시 나누지 않고 조절할 수 있다.

## 화석조각

내부 미션 필드명은 저장 호환과 변경 범위를 줄이기 위해 `symbols`를 유지했다. 사용자에게 표시되는 이름과 문구는 모두 화석조각으로 바꿨다.

- Stage 2 한 판에 3개
- HUD `화석조각 0 / 3` → `3 / 3`
- 안내 `화석조각을 모아 비밀문을 열어보세요!`
- 3/3 안내 `비밀문이 열렸어요!`
- 재시작 시 0/3 초기화
- 보상 및 프로필에 저장하지 않음

## 비밀문과 비밀길

비밀문을 상단 14% 발판에서 지상 route로 내렸다. 3/3 상태에서 문 중심과 플레이어 사이가 화면 너비의 12% 이내이면 점프 없이 자동 진입한다. 0~2/3이면 같은 trigger를 지나도 닫힌 상태를 유지하고 일반 Stage 클리어에는 영향이 없다.

비밀길은 기존과 같이 현재 스크롤 화면 안에서 12초 동안 이어진다. 새 장애물을 추가하지 않으며 보상 밀도를 유지한 뒤 일반 길로 복귀한다.

## `!` 표시 원인과 수정

간헐적으로 보인 `!`는 잘못된 obstacle key의 fallback이 아니라 `eruption`의 1.2초 사전 경고를 나타내던 텍스트 placeholder였다. 이를 텍스트가 없는 타원형 용암 균열 표시로 교체했다. 분출 본체는 기존 geyser 이미지를 사용한다.

바위·geyser·분출 이미지 로드가 실패하면 해당 ID를 invalid 집합에 넣고 DOM에서 숨긴 뒤 다음 tick에서 충돌 목록과 런타임 배열에서도 제거한다. 개발 모드에서만 `console.warn`을 남긴다. 따라서 투명한 장애물이나 텍스트 fallback이 충돌 판정에 남지 않는다.

## 독립적인 에셋 교체 slot과 실제 크기

| 용도 | Render slot | 실제 CSS 렌더 크기 |
|---|---|---:|
| Ramp | `RampVisual` / `.lava-cliff-ramp-visual` | 190 × 50px |
| 화석조각 | `FossilFragmentVisual` / `.lava-cliff-fossil` | 44 × 44px |
| 비밀문 | `SecretDoorVisual` / `.lava-cliff-gate` | 110 × 130px |
| HUD 화석 아이콘 | `FossilCounterVisual` / `.lava-cliff-mission__icon` | 24 × 24px |

현재는 CSS placeholder다. 다음 작업에서 각 slot 내부 또는 background만 PNG로 교체하면 되며, 수집·문 trigger·route 판정은 변경할 필요가 없다. Ramp는 기울어진 실루엣을 `clip-path`로 그리지만 요소의 실제 bounding box는 190×50px다.

실제 Stage 2 실행 화면에서 `getComputedStyle`과 `getBoundingClientRect()`로 다시 측정한 결과는 다음과 같다.

| 요소 | CSS width × height | 자체 transform/scale | 부모 transform/scale | DOM bounding rect | Effective size |
|---|---:|---|---|---:|---:|
| Ramp | 190 × 50px | 없음 | 스크롤용 translate, scale 없음 | 190 × 50px | 190 × 50px |
| 화석조각 | 44 × 44px | 없음 | 스크롤용 translate, scale 없음 | 44 × 44px | 44 × 44px |
| 비밀문 | 110 × 130px | 없음 | 스크롤용 translate, scale 없음 | 109.99997 × 130px | 110 × 130px |
| HUD 화석 아이콘 | 24 × 24px | 없음 | 중앙 정렬용 translateX, scale 없음 | 24 × 24px | 24 × 24px |

부모의 CSS transform matrix는 모두 `a=1, d=1`이어서 확대·축소가 없고 x축 위치 이동만 있었다. `clip-path`는 ramp의 내부 실루엣만 자르며 bounding box를 바꾸지 않는다.

개발 모드에서는 각 slot 안의 `ResizeObserver`가 실제 bounding rect를 반올림하여 `RAMP 190×50`, `FOSSIL 44×44`, `DOOR 110×130`, `HUD 24×24` 라벨로 표시한다. 라벨은 절대 위치와 `pointer-events: none`을 사용한다. `import.meta.env.DEV`가 false인 production에서는 observer가 생성되지 않고 라벨도 렌더되지 않는다.

## Stage 1과 기존 밸런스

Stage 2는 150초, 체공시간 82%, dash cooldown 3초, 화석 3개, 비밀길 12초를 유지했다. Stage 1의 120초, 점프 수치, dash cooldown 2초, 배경, spawn 및 보상 로직은 변경하지 않았다. Stage 2 완료 후 Stage 3 상태만 해금하고 강제 진입하지 않는 기존 진행 함수도 유지했다.

## 검증

- 브라우저 실제 화면: Stage 2 진입, 새 배경, `화석조각 0 / 3`, ramp와 화석조각 확인.
- 실제 Stage 2 브라우저 bounding box: ramp 190×50, 화석조각 44×44, 비밀문 약 110×130, HUD 아이콘 24×24.
- Ramp 표시 중 DOM bounding box 교차 검사: 아이템/코인/장애물 겹침 0건.
- 비밀문은 실제 Stage 2 DOM에서 109.99997×130px로 측정했다. 측정을 위해 등장 시점만 일시적으로 앞당긴 뒤 즉시 원래 110초로 복구했다. 이전 구현의 3/3 수집·비밀길 진입·복귀·완주 브라우저 검증에 이어 이번 변경에서는 진입 조건을 지상 자동 접촉으로 단순화했다.
- 자동 테스트: ramp 예약 경계, placeholder 크기, 3/3 문 trigger 12% 경계, 재시작용 새 미션 상태, Stage 3 해금, Stage 1 물리를 포함한다.
