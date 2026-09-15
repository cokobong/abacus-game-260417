# 오래된 유적지 Sokoban Phaser 구현 계획

## 1. 범위와 원칙

Phaser 기반의 grid push 퍼즐 엔진을 만들고, React는 HUD·튜토리얼·결과를 담당한다. Stage 1/2의 퍼즐 데이터는 Scene에서 분리한다. 실제 구현 시 Stage 1과 Stage 2만 연결하며 Stage 3, 보상, 유물 시스템은 다루지 않는다.

기존 미러 퍼즐 Phaser host의 lazy import, Phaser.Game 생성, scene restart, destroy 생명주기 패턴은 참고하되 Sokoban 규칙 코드는 별도 모듈로 만든다.

## 2. 권장 파일 구조

- src/components/screens/RuinsSokobanGameHost.tsx
- src/components/screens/ruinsSokoban/createRuinsSokobanGame.ts
- src/components/screens/ruinsSokoban/scenes/RuinsSokobanScene.ts
- src/utils/ruinsSokobanRules.ts
- src/config/ruinsSokoban/types.ts
- src/config/ruinsSokoban/stage1.ts
- src/config/ruinsSokoban/stage2.ts
- src/config/ruinsSokoban/index.ts
- src/utils/ruinsSokobanRules.test.ts

초기 목업에서는 파일 수를 줄일 수 있지만, 이동·push·Undo·완료 판정은 Phaser 객체 없이 테스트 가능한 순수 함수로 둔다.

## 3. 퍼즐 상태 모델

권장 런타임 상태:

- player: 현재 grid 좌표
- boxes: box ID별 grid 좌표
- goals: 고정 grid 좌표 집합
- walls: 고정 grid 좌표 집합
- exit: 위치와 잠금 상태
- moveCount, pushCount
- history: 이전 player/boxes 스냅샷 스택
- outcome: playing, cleared

벽, 목표, 출구는 config 원본을 유지하고 플레이어와 상자 위치만 변경한다. 좌표 키는 column,row 문자열 또는 보드 폭을 이용한 정수 index로 통일한다.

## 4. Grid movement

입력 하나는 정확히 한 칸 이동 시도다.

1. 입력 방향으로 nextPlayer 좌표를 계산한다.
2. 벽이면 상태를 변경하지 않는다.
3. 상자가 없으면 history에 현재 상태를 저장하고 플레이어만 이동한다.
4. 상자가 있으면 상자 뒤 nextBox 좌표를 계산한다.
5. nextBox가 벽 또는 다른 상자면 상태를 변경하지 않는다.
6. 비어 있으면 history 저장 후 상자와 플레이어를 함께 이동한다.
7. 목표 완료와 출구 상태를 다시 계산한다.

빠른 연속 탭은 입력 queue를 최대 1개만 유지하거나 이동 애니메이션 동안 잠근다. 시각 애니메이션이 끝나기 전에 논리 상태가 두 번 적용되지 않게 한다.

길게 누르기 반복 이동은 Stage 1 테스트 후 결정한다. 초기안은 예측 가능한 한 번 탭 한 칸 이동이다.

## 5. 충돌 규칙

### wall collision

- nextPlayer가 wall set에 있으면 이동 불가
- 봉인문이 잠겨 있으면 벽과 동일하게 처리

### box push

- 플레이어가 상자 방향으로 이동할 때만 push
- 상자는 한 번에 정확히 한 칸 이동
- 당기기와 옆 밀기 없음

### box-box collision

- nextBox에 다른 상자가 있으면 push 불가
- 연쇄 push는 지원하지 않음

충돌 실패 입력은 history, moveCount, pushCount에 포함하지 않는다. 시각적으로 작은 흔들림이나 짧은 색 변화만 주고 지속 파티클은 사용하지 않는다.

## 6. 목표와 클리어 판정

- 모든 goal 좌표에 box가 있으면 goalsComplete
- goalsComplete가 되면 봉인문을 연다.
- 열린 출구 좌표로 플레이어가 이동하면 Mission Clear
- 상자가 목표에서 빠지면 출구를 다시 잠글지는 퍼즐별 정책으로 둘 수 있지만, 초기안은 모든 목표가 계속 채워져 있을 때만 열린 상태를 유지한다.

목표 위 상자는 별도 논리 타입으로 바꾸지 않고 box 좌표와 goal set의 교집합으로 표현한다.

## 7. 최소 deadlock 처리

초기 구현은 완전한 동적 deadlock solver를 만들지 않는다.

- 정적 deadlock: 목표가 아닌 모서리에 상자가 들어간 경우 감지
- 선택적 정적 표시: 벽을 따라 목표에 도달할 수 없는 명백한 칸
- 동적 deadlock: 상자 두 개가 서로 막는 경우 자동 판정보다 Undo/Reset 안내 중심

Stage 1-4에서는 비목표 모서리 감지 시 “여기서는 상자를 꺼낼 수 없어요” 안내와 Undo 강조를 제공한다. Stage 2에서는 즉시 정답을 알려주지 않도록 같은 안내를 지연하거나 설정으로 끌 수 있다.

향후 solver는 플레이어 도달 가능 영역, 가능한 push 상태, 목표 매칭을 기준으로 별도 개발한다.

## 8. Undo state stack

- 유효한 이동 직전에 player와 boxes를 스냅샷으로 저장
- 기본 최대 기록은 퍼즐 완료에 충분한 200~500 step
- Undo 시 마지막 스냅샷을 복원
- 목표 점등, 문 상태, 이동/push 수를 복원 상태에서 다시 계산
- 미션 시작 상태에서는 Undo 비활성
- 클리어 연출 중에는 Undo 입력 잠금

보드가 최대 7×7이고 상자가 3개이므로 스냅샷 복사는 구형 iPad에서도 충분히 작다. Phaser GameObject를 저장하지 않고 좌표 데이터만 저장한다.

## 9. Reset

- 현재 Mission config에서 초기 상태를 다시 생성
- history, 이동 수, push 수, 안내 상태를 초기화
- Reset 전 확인 팝업은 아이 테스트에서 방해가 되면 제거
- 튜토리얼 최초 설명을 다시 보여줄지는 별도 버튼 또는 config로 결정

Reset은 Phaser scene 전체 재생성보다 상태와 GameObject 위치 재설정 방식을 우선한다. 단순성과 안정성이 더 높다면 목업 단계에서는 scene restart도 허용한다.

## 10. Puzzle config

권장 타입 필드:

- id, stage, mission
- title, instruction
- columns, rows
- playerStart
- walls
- boxes: ID와 시작 좌표
- goals: ID와 좌표
- exit
- tutorialStep
- highlightTargets
- deadlockHintsEnabled
- verification: 최소 push, 최소 이동, 해답 존재 여부

config 로드 검증:

- 모든 좌표가 보드 안에 있음
- 벽·상자·플레이어·출구의 금지된 중복 없음
- 상자 수와 목표 수가 같음
- 목표가 벽 위에 없음
- 플레이어가 시작 상태에서 최소 한 칸 이동 가능
- solver가 실제 해답을 찾음

## 11. Stage/Mission 데이터 분리

- stage1.ts: 설명 문장, 하이라이트, 튜토리얼 옵션을 포함한 5개 config
- stage2.ts: 설명 의존 없이 풀 수 있는 3개 config
- index.ts: Stage 번호로 mission 배열 조회

Scene은 Mission ID에 따른 분기문을 갖지 않는다. 튜토리얼 차이는 config 이벤트를 React host가 표시한다.

## 12. Stage 3 퍼즐 풀 확장

Stage 3를 나중에 추가할 때 엔진 수정 없이 다음 데이터만 추가할 수 있어야 한다.

- 새로운 퍼즐 config 파일
- 난이도 태그
- 예상 최소 push와 이동 수
- deadlock 밀도
- 퍼즐 풀/맵팩 ID
- 공개 여부와 선택 가중치

무작위 선택 시 최근 플레이 퍼즐 제외와 난이도 범위를 관리하되 이번 구현 범위에서는 만들지 않는다.

## 13. React와 Phaser 역할

### React

- Stage/Mission 제목
- 튜토리얼 설명 패널
- 목표 진행과 이동/push 수
- Undo, Reset, 나가기
- 4방향 패드
- 데드락 안내와 완료 화면
- 앱의 Stage 선택 및 Mission 전환

### Phaser

- 보드와 오브젝트 렌더링
- 입력 명령 수신
- grid 이동 애니메이션
- 벽·상자 충돌
- 상자 push
- 목표/출구 시각 상태
- 보드 내 하이라이트

### 순수 규칙 모듈

- 이동 가능 여부
- 다음 상태 계산
- 목표 완료
- 정적 모서리 deadlock
- Undo 스냅샷
- 퍼즐 solver와 config 검증

Phaser가 앱 저장소를 직접 수정하지 않는다. React host에 상태 이벤트와 Mission 완료 이벤트만 전달한다.

## 14. iPad 세로 화면

- 논리 canvas는 세로 비율을 사용하고 Phaser Scale.FIT으로 맞춘다.
- safe-area-inset을 HUD와 방향 패드에 반영한다.
- 보드는 중앙의 남은 영역 안에서 가장 큰 정사각형으로 표시한다.
- 7×7에서도 각 칸과 캐릭터가 구분될 크기를 보장한다.
- 방향 패드는 엄지로 누르기 쉬운 하단 중앙에 고정한다.
- Undo와 Reset은 방향 패드와 떨어뜨려 오입력을 줄인다.
- 화면 회전 또는 resize 후 논리 보드 좌표는 바꾸지 않고 표시 크기만 갱신한다.

## 15. 구형 기기 성능 원칙

- 타일과 벽은 정적 graphics 또는 하나의 캐시 텍스처로 묶는다.
- React state를 매 프레임 갱신하지 않는다.
- 이동 애니메이션은 활성 GameObject 몇 개에만 적용한다.
- blur, filter, 지속 파티클을 사용하지 않는다.
- 보드 밖 오브젝트가 없으므로 카메라 추적과 대규모 물리 엔진을 사용하지 않는다.
- Arcade Physics 없이 정수 grid 충돌로 처리한다.
- texture atlas는 실제 에셋 단계에서만 검토한다.
- scene 종료 시 tween, input listener, Phaser.Game을 확실히 destroy한다.

목표는 60fps이며, 구형 iPad Safari에서 안정적인 입력과 30fps 이상 유지가 우선이다.

## 16. 테스트 계획

### 단위 테스트

- 빈 칸 이동
- 벽 충돌
- 정상 push
- 벽을 향한 push 실패
- 상자끼리 push 실패
- 상자를 당길 수 없음
- 목표 완료와 해제
- 출구 잠금과 클리어
- Undo 연속 복원
- Reset 초기화
- 비목표 모서리 deadlock

### 퍼즐 검증

- Stage 1/2 모든 config의 실제 해답
- 최소 push/이동 수
- 지나치게 짧은 우회 해답
- 초기 데드락 여부
- Stage 2 난이도 순서

### 수동 검증

- iPad 세로 화면의 칸 크기
- 빠른 탭과 반대 방향 입력
- Undo/Reset 오입력
- 캐릭터, 상자, 제단의 즉시 식별
- 튜토리얼 하이라이트의 이해도
- 장시간 반복 시 메모리와 입력 지연

## 17. 구현 순서

1. config 타입과 순수 상태 전이 함수
2. Stage 1/2 퍼즐 후보와 solver 검증
3. Phaser 보드 렌더링과 이동 애니메이션
4. React host, HUD, 방향 패드
5. Undo와 Reset
6. 목표/봉인문/클리어
7. Stage 1 설명 패널과 하이라이트
8. 최소 deadlock 안내
9. iPad 수동 테스트와 난이도 조정

실제 구현을 시작할 때 기존 미러 퍼즐 파일을 삭제하거나 덮어쓰지 않고 별도 Sokoban 모듈로 만든다.
