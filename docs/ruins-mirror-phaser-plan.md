# 오래된 유적지 미러 퍼즐 Phaser 설계안

## 1. 설계 목표

- React/Vite 앱 안에 Phaser 미니게임을 필요한 동안만 생성하고 종료 시 완전히 정리한다.
- Stage 1/2/3이 같은 시스템을 공유하고, 퍼즐 내용은 TypeScript 코드와 분리된 config로 관리한다.
- 4 × 4, 5 × 5를 기본으로 지원하고 6 × 6을 최대 크기로 제한한다.
- 768 × 1024 portrait-first 좌표계를 기준으로 하되 다양한 세로 화면에서 비율을 유지한다.
- 구형 iPad에서 입력 반응성과 일정한 프레임을 우선하고 지속 애니메이션, 필터, 파티클을 최소화한다.

이 문서는 구현 전 설계안이며 Phaser 설치 또는 코드 변경을 포함하지 않는다.

## 2. 권장 Phaser Scene 구조

```text
RuinsMirrorGame (Phaser.Game, React가 생명주기 소유)
├─ RuinsMirrorBootScene
│  └─ 최소 부트 설정, 로딩 Scene 전환
├─ RuinsMirrorPreloadScene
│  └─ Stage에 필요한 공통/선택 에셋 로드, 진행 상태 전달
├─ RuinsMirrorPuzzleScene
│  ├─ PuzzleBoard
│  ├─ BeamSystem
│  ├─ MirrorSystem
│  ├─ TargetSystem
│  └─ MissionManager
└─ RuinsMirrorResultScene (선택)
   └─ 클리어 요약/Stage 3 보물상자; 앱 공통 UI를 쓰면 React 오버레이로 대체
```

- Boot/Preload는 자산 로딩 책임만 갖고 퍼즐 규칙을 알지 않는다.
- PuzzleScene은 시스템을 조합하고 입력을 연결하지만 광선 계산과 진행 규칙을 직접 구현하지 않는다.
- 결과/일시정지/뒤로가기처럼 앱 상태와 강하게 연결된 화면은 React HTML 오버레이가 접근성과 재사용 측면에서 유리하다.

## 3. 핵심 모듈 책임

### PuzzleBoard

- config를 읽어 보드 크기, 셀 좌표, 타일과 장애물을 생성한다.
- 논리 좌표 `(column, row)`와 Phaser 월드 좌표 사이 변환을 담당한다.
- 4 × 4, 5 × 5, 최대 6 × 6을 동일 API로 처리한다.
- 보드 외부, 막힌 셀, 오브젝트 점유를 조회하는 인터페이스를 제공한다.
- 보드 전체를 매 입력마다 다시 만들지 않고 변경된 셀만 시각 갱신한다.

### BeamSystem

- 광원에서 격자 방향으로 광선을 진행시키고 거울, 벽, 목표와의 충돌 순서를 계산한다.
- 방향은 `north | east | south | west`, 거울은 `/`와 `\\` 반사 규칙으로 처리한다.
- 순환 경로를 막기 위해 `(cell, direction)` 방문 집합과 최대 진행 단계 상한을 둔다.
- 계산 결과를 선분 목록으로 반환하며 렌더링은 Phaser Graphics 한두 개에 모아 수행한다.
- 거울 회전 시 `clear()` 후 선분을 다시 그리는 방식을 기본으로 한다. 각 빛 조각을 개별 Sprite로 만들지 않는다.
- glow filter 대신 굵은 저알파 외곽선과 밝은 중심선을 2-pass로 그리는 방식을 권장한다.

### MirrorSystem

- 거울 생성, 회전 가능 여부, 현재 방향, 터치 입력을 관리한다.
- 한 번 터치할 때 90도 회전하고 짧은 tween 종료 여부와 관계없이 논리 방향은 즉시 확정한다.
- 입력 이벤트마다 BeamSystem 재계산을 요청한다.
- 터치 영역을 셀 안에서 충분히 크게 유지하고 멀티포인터 연속 입력은 한 프레임에 한 번만 반영한다.

### TargetSystem

- 목표 제단의 위치와 필수 여부를 관리한다.
- BeamSystem 결과를 받아 각 목표의 활성 상태를 갱신한다.
- 모든 필수 목표가 활성화됐을 때 한 번만 `allTargetsActivated` 이벤트를 발생시킨다.
- 시각 연출이 끝나기 전에 중복 클리어가 저장되지 않도록 완료 상태를 잠근다.

### MissionManager

- Stage와 퍼즐 순서, 현재 퍼즐 번호, 힌트, 초기화, 클리어 전환을 관리한다.
- Stage 1의 고정 순서와 Stage 3의 검증된 퍼즐 풀 선택을 같은 인터페이스로 제공한다.
- 게임 규칙의 성공 이벤트를 React 호스트의 `onFinishRun(runId, rewards)` 계약으로 변환한다.
- 시간제한 및 실패 상태는 만들지 않는다. 나가기와 초기화는 실패 보상/페널티 이벤트를 발생시키지 않는다.

## 4. 퍼즐 config 구조

권장 위치는 `src/config/ruinsMirror/`이며 시스템 코드와 분리한다.

```text
src/config/ruinsMirror/
├─ types.ts
├─ stage1.ts
├─ stage2.ts
├─ stage3.ts
└─ index.ts
```

개념 스키마:

```ts
type Direction = 'north' | 'east' | 'south' | 'west';
type MirrorOrientation = 'slash' | 'backslash';

interface RuinsMirrorPuzzleConfig {
  id: string;
  stage: 1 | 2 | 3;
  grid: { columns: 4 | 5 | 6; rows: 4 | 5 | 6 };
  emitter: { column: number; row: number; direction: Direction };
  targets: Array<{ id: string; column: number; row: number; required: boolean }>;
  mirrors: Array<{
    id: string;
    column: number;
    row: number;
    initial: MirrorOrientation;
    rotatable: boolean;
  }>;
  blockers: Array<{ column: number; row: number }>;
  hintSteps: Array<{ mirrorId: string; message: string }>;
}
```

- config는 화면 좌표나 에셋 import를 포함하지 않는다.
- 로드 시 범위, 중복 셀, 광원/목표 존재 여부를 검증한다.
- 제작 단계에서 간단한 solver 또는 테스트로 모든 초기 배치가 풀이 가능함을 검증한다.
- Stage 3 반복 선택은 `puzzle.id` 최근 이력을 사용하고, config 자체의 정답을 런타임 UI에 노출하지 않는다.

## 5. portrait-first 화면 및 리사이즈

- Phaser 논리 크기는 768 × 1024를 기준으로 설정한다.
- Scale Manager의 종횡비 유지형 배율과 중앙 정렬을 사용하고, 부모 React 컨테이너 크기 변화에 맞춰 resize한다.
- 게임 보드는 정사각형 안전 영역 안에 두며 HUD와 하단 조작은 별도 영역으로 둔다.
- safe area가 필요한 앱 내비게이션/모달은 React가 담당하고 Phaser canvas는 전달받은 실제 가용 영역만 사용한다.
- 화면 회전 시 진행 상태를 보존하고 재레이아웃하되, 1차 MVP는 세로 방향 안내를 우선한다.

## 6. 구형 iPad 성능 원칙

- WebGL을 기본 후보로 하되 실제 iPad Safari에서 안정성을 확인하고 필요하면 Canvas renderer fallback을 허용한다.
- 한 퍼즐에서 사용하는 텍스처 수와 최대 해상도를 제한하고, 배경은 화면보다 과도하게 큰 원본을 로드하지 않는다.
- 지속 파티클, 실시간 blur, pipeline/filter, 동적 그림자, 대형 반투명 레이어를 최소화한다.
- 거울 idle 애니메이션은 없거나 저빈도 tween으로 제한한다. 클리어/터치 이펙트는 짧게 재생하고 종료한다.
- 빛 경로는 Phaser Graphics 기반으로 한 번에 그리며, 상태가 바뀔 때만 재계산·재렌더링한다.
- 매 프레임 React state를 갱신하지 않는다. Phaser 내부 상태와 React 앱 상태는 시작/일시정지/클리어/종료 경계에서만 동기화한다.
- Scene 종료 시 input listener, timer, tween, texture 참조와 Phaser.Game 인스턴스를 정리한다.
- Stage 1 실제 기기 테스트에서 입력 지연, canvas 메모리 재진입, 10~15분 발열과 프레임 안정성을 확인한다.

## 7. React 앱과 Phaser 결합 권장안

React에 `RuinsMirrorGameHost` 컴포넌트를 두고 다음 수명주기를 권장한다.

1. Adventure가 `number-ruins`와 Stage 번호로 실행을 요청한다.
2. Host가 `div` ref를 Phaser parent로 넘겨 `Phaser.Game`을 한 번 생성한다.
3. React → Phaser에는 Stage 번호, runId, 퍼즐 config, 일시정지 상태를 전달한다.
4. Phaser → React에는 `ready`, `puzzleComplete`, `runComplete`, `requestExit`, `requestPause`처럼 작은 이벤트만 전달한다.
5. 클리어 시 기존 `onFinishRun(runId, rewards)`를 한 번 호출한다.
6. Host unmount 시 `game.destroy(true)`와 이벤트 구독 해제를 수행한다.

React는 Adventure 진입 확인, 앱 내비게이션, 저장, 보상, 유물 복원을 소유하고 Phaser는 퍼즐 플레이만 소유하도록 경계를 둔다. DOM HUD를 canvas 위에 겹치는 경우 부모에 `position: relative`, canvas와 오버레이에 명확한 z-index 및 pointer-events 정책을 둔다.

## 8. 구현 단계 제안

1. Stage 1 config와 순수 Beam 경로 계산 규칙을 먼저 확정한다.
2. Phaser Host 수명주기와 4 × 4 PuzzleScene을 연결한다.
3. 거울 터치, Graphics 빛 경로, 제단 클리어를 구현한다.
4. React 공통 인트로/일시정지/결과 UI를 연결한다.
5. 실제 iPad에서 Stage 1 아이 테스트를 진행한다.
6. 관찰 결과에 따라 5 × 5, 고정 거울/벽, Stage 3 풀과 유물 보상을 순차 확장한다.

## 9. 기존 프로젝트 조사

### 9.1 Adventure 미니게임 연결 방식

- `src/App.tsx`: `activeAdventureRun`으로 `gameId`, `runId`, `stageNumber`를 보관하고 진입 비용, 실행, 종료, 보상 저장을 총괄한다. `startAdventureGame`, `finishAdventureRun`, `restoreRegionRelic`가 주요 통합 지점이다.
- `src/components/screens/AdventureGameShell.tsx`: `gameId`에 따라 `LavaPathPrototype` 또는 `SkyIslandPrototype` React 컴포넌트를 선택한다. 유적 게임 추가 시 `number-ruins` 분기와 Phaser Host 연결이 필요하다.
- `src/data/adventureRegions.ts`: `ancientRuins` 지역은 존재하지만 현재 `gameId`가 없고 `comingSoon` 표시다.
- `src/config/adventureRegionStatus.ts`: `ancientRuins: 'comingSoon'`이다. MVP를 실제 진입 가능하게 만들 때 상태 변경 검토가 필요하다.
- `src/config/minigameConfig.ts`: `MinigameId`에 `number-ruins`와 진입 비용 정의가 이미 있다.
- `src/config/adventureStageCatalog.ts`: `getRegionForGame('number-ruins')`는 `ancientRuins`로 연결되지만, 이 지역 Stage의 `implemented`는 현재 `false`다.

따라서 새 Phaser 게임은 독립 라우터를 추가하기보다 기존 `App → AdventureGameShell → 미니게임 → onFinishRun` 계약에 맞추는 것이 변경 범위가 가장 작다. 다만 미러 퍼즐은 실패 페널티가 없으므로 기존 유료 진입/재시도 정책을 그대로 적용할지는 구현 전 제품 결정이 필요하다.

### 9.2 Stage 1/2/3 공통 구조

- `src/config/adventureStageCatalog.ts`: 모든 지역에 1/2/3 Stage 카탈로그, 순차 번호, 구현 여부, Stage 3 보물상자/유물 후보 메타데이터가 있다.
- `src/utils/adventureStageProgress.ts`: 방문/클리어 상태를 저장하며 이전 Stage를 클리어해야 다음 Stage가 열린다.
- `src/components/screens/AdventureMapScreen.tsx`: 지역 상세에서 Stage 카드와 잠김/신규/완료 상태를 표시하고 선택한 Stage를 `onStartGame`으로 전달한다.
- `src/components/screens/LavaPathPrototype.tsx`, `src/components/screens/SkyIslandPrototype.tsx`: 단일 게임 컴포넌트가 `stageNumber`로 Stage 변형을 처리하고 공통 인트로와 Stage 3 보물상자를 사용한다.

미러 퍼즐도 Stage별 Scene을 복제하지 않고 `RuinsMirrorPuzzleScene + stage config` 조합으로 공통화하는 편이 현행 진행 구조와 맞는다.

### 9.3 유물조각 5개 수집 및 복원 연동

- `src/config/regionalRelicConfig.ts`: `REGION_RELIC_PART_GOAL = 5`이며 `ancientRuins`의 완성 유물과 5개 부품 정의가 이미 있다.
- `src/assets/adventure/relics/index.ts`: 유적 유물조각, 완성본, 실루엣과 공통 유물 UI를 import/export한다.
- `src/config/worldMapRelicConfig.ts`: 지역별 `ownedPartIds`, `completed`, Stage 3 최초 클리어, 상자 개봉 수, 연속 미획득 횟수를 정규화한다. `resolveRegionFinalChest`는 미보유 조각 중 하나를 확률 및 pity 규칙으로 지급하고, `canRestoreRegionRelic`은 5종 보유를 확인한다.
- `src/App.tsx`: 현재 Stage 3 Final 상자 보상 연동은 `lavaValley`와 `skyIsland`만 명시적으로 처리한다. `ancientRuins`에도 `resolveRegionFinalChest('ancientRuins', ...)`를 호출하도록 확장해야 한다.
- `src/components/screens/AdventureMapScreen.tsx`: 유물 보관소에서 5개 슬롯, 보유 조각, 복원 가능 상태와 복원 행동을 이미 제공한다.

현행 데이터 모델은 오래된 유적지 5조각 수집과 수동 복원을 수용할 수 있다. Stage 1 MVP에서는 이 경로를 호출하지 않고, Stage 3 구현 시 기존 보상 저장 함수의 지역 분기를 일반화하는 것이 권장된다.

### 9.4 기존 공통 UI 재사용 가능 여부

| 파일 | 재사용 판단 | 메모 |
| --- | --- | --- |
| `src/components/AdventureStageIntro.tsx` | 재사용 가능 | Stage 번호, 제목, 안내, 시작 버튼을 받는 공통 React 모달 |
| `src/components/AdventureFinalTreasure.tsx` | 조건부 가능 | API는 일반적이지만 CSS class가 `lava-core-*`에 결합되어 있어 스타일 분리 필요 |
| `src/components/MinigameEntryConfirm.tsx` | 재사용 가능 | 기존 Adventure 진입 비용 정책을 유지하는 경우 사용 |
| `src/components/NavigationArrow.tsx` | 재사용 가능 | React 오버레이에 뒤로가기/이동 UI가 필요할 때 검토 |
| `src/components/ResourceChip.tsx` | 조건부 가능 | 코인 등 앱 자원을 HUD에 보여줄 때만 필요; 퍼즐 핵심에는 불필요 |
| `src/components/screens/AdventureMapScreen.tsx` | 재사용 가능 | Stage 선택과 유물 보관소는 이미 지역 공통 구조 |
| `src/index.css` | 부분 재사용 | safe-area, Stage 인트로, 모달 패턴이 있으나 기존 게임별 class 결합은 분리 필요 |

Phaser canvas 내부 버튼을 공통 React 컴포넌트로 직접 재사용할 수는 없다. 인트로, 일시정지, 결과, 보상 UI를 canvas 위 React 오버레이로 두면 재사용 범위와 접근성을 유지할 수 있다.

### 9.5 Phaser 패키지 도입 여부

- `package.json`의 dependencies/devDependencies에 Phaser가 없다.
- 현재 두 Adventure 미니게임은 React/DOM, `requestAnimationFrame`, CSS 애니메이션으로 구현되어 있다.
- 요청된 기술 방향이 Phaser 기반이므로 실제 구현 단계에서는 `phaser` 런타임 의존성 추가가 필요하다.
- 현재 단계에서는 설치하지 않는다. 도입 시 번들 크기, Vite 코드 스플리팅, iPad Safari renderer, React Strict Mode에서의 중복 생성 방지와 unmount 정리를 먼저 검증해야 한다.

### 9.6 조사한 기존 파일 목록

- `package.json`
- `src/App.tsx`
- `src/data/adventureRegions.ts`
- `src/config/adventureRegionStatus.ts`
- `src/config/minigameConfig.ts`
- `src/config/adventureStageCatalog.ts`
- `src/config/adventureStages.ts`
- `src/utils/adventureStageProgress.ts`
- `src/config/regionalRelicConfig.ts`
- `src/config/worldMapRelicConfig.ts`
- `src/config/adventureCollectibles.ts`
- `src/utils/adventureRewards.ts`
- `src/utils/gameStorage.ts`
- `src/components/screens/AdventureMapScreen.tsx`
- `src/components/screens/AdventureGameShell.tsx`
- `src/components/screens/LavaPathPrototype.tsx`
- `src/components/screens/SkyIslandPrototype.tsx`
- `src/components/AdventureStageIntro.tsx`
- `src/components/AdventureFinalTreasure.tsx`
- `src/components/MinigameEntryConfirm.tsx`
- `src/components/NavigationArrow.tsx`
- `src/components/ResourceChip.tsx`
- `src/assets/adventure/index.ts`
- `src/assets/adventure/relics/index.ts`
- `src/index.css`
- `docs/touch-tablet-ui-guidelines.md`
- `docs/mobile-game-performance.md`
