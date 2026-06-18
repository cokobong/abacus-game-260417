# 앱 실행 환경과 저장/PWA 계획

이 문서는 초기 실행 환경, 입력 우선순위, 로컬 저장, 추후 PWA 확장 방향을 정리한다.

## 1. 사용 환경 전제

이 게임은 초기에는 일반 모바일 앱이 아니라, 터치 기능이 있는 노트북에서 고정적으로 실행하는 로컬 웹앱으로 사용한다.

주 사용 환경:

- 터치 노트북
- 브라우저 기반 실행
- 로컬 개발 시 `localhost`
- 배포 시 Netlify 또는 유사한 웹 배포 환경
- 추후 PWA 형태로 설치형 앱처럼 전환 가능

따라서 초기 설계부터 터치 입력, 로컬 저장, 앱 재실행 후 상태 복원을 고려한다.

## 2. 실행 방식

초기 실행 방식:

```text
터치 노트북
→ Chrome/Edge 계열 브라우저 실행
→ localhost 또는 배포 URL 접속
→ 앱에서 설정/저장 상태 복원
→ 블루투스 주판 연결
→ 20문제 학습 세트 진행
```

개발 환경:

- 개발 중에는 `localhost`에서 실행한다.
- Web Bluetooth는 `localhost` 또는 HTTPS 환경에서 동작한다.
- 실제 기기 연결 테스트는 터치 노트북의 Chrome/Edge 계열 브라우저를 우선 대상으로 한다.

배포 환경:

- Netlify 또는 유사한 정적 웹 배포 환경을 우선한다.
- Web Bluetooth 사용을 위해 HTTPS 배포가 필요하다.
- 서버 로그인 없이도 1차 버전은 브라우저 로컬 저장만으로 동작하게 한다.

PWA 확장:

- 추후 앱 아이콘, manifest, service worker, 오프라인 캐시를 추가해 설치형 앱처럼 사용할 수 있다.
- PWA 전환 후에도 핵심 데이터는 우선 로컬 저장을 유지한다.
- 여러 기기 동기화가 필요해지면 클라우드 저장을 별도 단계로 검토한다.

## 3. 입력 우선순위

입력 방식은 다음 우선순위로 설계한다.

1. 블루투스 주판 입력
2. 터치 화면 키패드 입력
3. 마우스 입력
4. 키보드 입력은 개발/보조용

기본 학습 흐름에서는 블루투스 주판이 주 입력 장치다.
아이가 물리 주판에서 값을 만든 뒤 주판의 확인 버튼을 누르면, 앱은 해당 값을 정답 입력칸에 반영하고 자동 제출한다.

블루투스 주판을 사용할 수 없을 때는 화면 키패드를 터치해서 입력한다.
화면 키패드는 터치 노트북에서 사용하기 쉽도록 버튼 크기를 충분히 크게 잡는다.

마우스 입력은 보호자나 개발자가 조작할 때의 보조 입력으로 둔다.
키보드 입력은 개발/디버그 편의를 위한 보조 기능으로만 취급한다.

## 4. 터치 UI 설계 원칙

터치 노트북에서 아이가 직접 누르는 것을 기준으로 UI를 설계한다.

터치 UI 원칙:

- 주요 버튼은 손가락으로 누르기 쉽게 충분히 크게 만든다.
- 숫자 키패드는 7~8세 아이가 실수 없이 누를 수 있도록 간격을 둔다.
- 입력, 취소, 나가기, 설정 같은 버튼은 명확하게 구분한다.
- 너무 작은 아이콘만으로 기능을 표현하지 않는다.
- 하단 탭은 터치하기 쉬운 크기와 간격을 확보한다.
- 드래그보다 탭 중심 조작을 우선한다.
- 빠른 문제풀이 중 오입력을 줄이기 위해 숫자 버튼과 제출 버튼을 분리한다.

권장 크기:

| UI 요소 | 권장 최소 크기 |
| --- | ---: |
| 숫자 키패드 버튼 | 56px 이상 |
| 주요 CTA 버튼 | 64px 이상 |
| 하단 탭 터치 영역 | 56px 이상 |
| 작은 보조 버튼 | 44px 이상 |

권장 표현:

- 작은 텍스트 링크보다 카드형 버튼을 선호한다.
- 숫자 키패드는 버튼 사이 간격을 충분히 둔다.
- 제출 버튼은 숫자 키패드와 시각적으로 분리한다.
- 위험하거나 되돌리기 어려운 조작은 색상, 위치, 문구로 구분한다.

## 5. 로컬 저장 원칙

1차 버전은 서버 계정 없이 브라우저 로컬 저장을 사용한다.

저장 대상:

- 보유 코인
- 현재 공룡 목록
- 선택 중인 공룡
- 공룡별 레벨/EXP/상태
- 보유 음식
- 보유 코스튬
- 보유 알/알 조각
- 진행 중인 부화 알
- 진행 중인 모험
- 도감 해금 상태
- 출석/퀘스트 상태
- 블루투스 연결 설정 정보
- 사운드 설정 등 사용자 설정

저장 방식:

- 1차 버전은 `localStorage`를 기본으로 한다.
- 데이터 구조가 커지면 IndexedDB로 확장할 수 있다.
- 여러 기기 동기화가 필요해지면 Supabase/Firebase 같은 백엔드를 검토한다.
- 저장값은 앱 시작 시 복원한다.
- 저장값이 없거나 깨진 경우 기본값으로 시작한다.
- 주요 진행 상태는 변경 즉시 저장한다.

중요 원칙:

- 게임 상태를 화면 컴포넌트 안에 흩어두지 않는다.
- `GameState` 형태로 중앙 관리한다.
- 앱 실행 시 저장된 `GameState`를 불러온다.
- `GameState` 변경 시 자동 저장한다.
- 저장 데이터에는 버전 필드를 둔다.
- 추후 데이터 구조가 바뀔 수 있으므로 migration 가능성을 남긴다.

권장 `GameState` 초안:

```ts
interface GameState {
  version: number;
  coins: number;
  dinosaurs: DinosaurState[];
  selectedDinosaurId: string | null;
  inventory: InventoryState;
  eggs: EggState[];
  activeHatchEggId: string | null;
  activeAdventure: AdventureState | null;
  pokedex: PokedexState;
  attendance: AttendanceState;
  quests: QuestState[];
  bluetoothSettings: BluetoothSettingsState;
  userSettings: UserSettingsState;
}
```

저장 키 예시:

```text
abacus-dino-game-state
```

마이그레이션 원칙:

- 저장 데이터의 `version`이 현재 앱 버전보다 낮으면 migration 함수를 거친다.
- 알 수 없는 필드는 즉시 삭제하지 말고 가능한 한 보존한다.
- 필수 필드가 없으면 기본값으로 채운다.
- migration 실패 시 기존 저장 데이터를 백업 키로 남기고 새 기본 상태로 시작할 수 있다.

주의사항:

- 같은 브라우저/같은 프로필 기준으로만 데이터가 유지된다.
- 브라우저 캐시나 사이트 데이터 삭제 시 저장 데이터가 사라질 수 있다.
- 다른 기기와 자동 동기화되지 않는다.
- PWA로 설치해도 저장 정책은 브라우저 저장소 정책의 영향을 받는다.

## 6. 앱 재실행 후 복원

앱을 다시 실행하면 아이가 이전 상태를 이어서 볼 수 있어야 한다.

복원 흐름:

```text
앱 실행
→ 저장 데이터 읽기
→ 설정값 복원
→ 코인/아이템/공룡/알/도감 상태 복원
→ 블루투스 연결은 사용자가 다시 연결
→ 마지막 화면 또는 홈 화면으로 진입
```

복원 원칙:

- 저장된 학습/성장 데이터는 자동 복원한다.
- 블루투스 주판 연결은 브라우저 권한과 기기 상태에 따라 달라지므로 자동 연결을 보장하지 않는다.
- 연결 상태는 설정탭에서 명확하게 다시 확인한다.
- 복원 실패 시 아이가 놀라지 않도록 기본 홈 화면과 안내 문구를 제공한다.

## 7. 부화장 저장 방식

부화장은 시간보다 문제풀이 진행도가 핵심이다.
부화 상태는 앱을 껐다 켜도 이어져야 하므로 진행 중인 알 정보를 `GameState` 안에 저장한다.

부화 알 저장값:

```ts
interface HatchEggState {
  eggId: string;
  eggCategory: "basic" | "normal" | "rare" | "special" | "legendary";
  candidatePool: string[];
  progress: number;
  requiredProgress: number;
  hintStage: number;
  createdAt: number;
  status: "incubating" | "ready_to_hatch" | "hatched";
  activeBoosts?: HatchBoostState[];
}

interface HatchBoostState {
  itemId: string;
  remainingSetCount: number;
  progressBonus: number;
}
```

상태:

| 상태 | 의미 |
| --- | --- |
| `incubating` | 부화 진행 중 |
| `ready_to_hatch` | 진행 조건 완료, 부화 연출 대기 |
| `hatched` | 부화 완료 |

문제풀이 세트 성공 시 처리:

```text
20문제 세트 완료
→ 성공 조건 확인
→ progress 증가
→ activeBoosts가 있으면 progress 보너스 반영
→ 특정 진행률에 도달하면 hintStage 증가
→ progress >= requiredProgress이면 ready_to_hatch로 변경
→ GameState 자동 저장
```

`hintStage` 기준 예시:

| 진행률 | hintStage | 공개 효과 |
| ---: | ---: | --- |
| 0% | 0 | 기본 알 상태 |
| 25% | 1 | 알이 살짝 커짐 |
| 50% | 2 | 알 무늬가 진해지고 흔들림 효과 |
| 75% | 3 | 금이 가기 시작, 발자국/울음소리 힌트 공개 |
| 90% | 4 | 실루엣 또는 꼬리/뿔/날개 힌트 공개 |
| 100% | 5 | 부화 연출 후 공룡 등장 |

부화 보조 아이템 원칙:

- 즉시 부화를 끝내는 용도로 사용하지 않는다.
- 다음 문제풀이 보상을 강화하는 방식으로 설계한다.
- 부화 보조 아이템 효과도 `GameState`에 저장해 앱 재실행 후 유지한다.

예시:

```text
햇살 램프 사용
→ 다음 3세트 동안 부화 progress +1 보너스
→ 세트 성공 때마다 remainingSetCount 감소
→ 0이 되면 boost 제거
```

## 8. PWA 확장 메모

PWA는 초기 필수 구현이 아니라 후속 확장이다.

PWA 목표:

- 노트북 바탕화면 또는 시작 메뉴에서 앱처럼 실행
- 전체화면 또는 앱 창 형태로 실행
- 터치 노트북에서 브라우저 주소창 없이 사용
- 로컬 저장 데이터 유지
- 일부 오프라인 실행 가능성 검토

후속 구현 후보:

- 앱 이름과 아이콘
- `manifest.webmanifest`
- 홈 화면 설치 안내
- service worker 기반 정적 리소스 캐시
- 오프라인 시작 화면
- 저장 데이터 백업/내보내기

PWA에서도 Web Bluetooth 연결은 브라우저와 OS 지원 정책을 따른다.
따라서 설치형 앱처럼 보여도 블루투스 연결 제약은 웹 환경의 제약을 유지한다.

초기 코드 구현 시 고려할 것:

- 반응형보다 터치 노트북 고정 화면을 우선한다.
- 모바일 화면도 나중에 확장 가능하게 하되, 초기 타깃은 터치 노트북이다.
- 마우스 hover에 의존하지 않는다.
- pointer/touch 이벤트 친화적으로 구현한다.
- UI 크기와 간격은 터치 입력을 기준으로 잡는다.

## 9. 모험 시간형 퀘스트 저장 방식

모험은 시간이 걸리는 퀘스트다.
하지만 앱이 꺼져 있는 동안 실제 타이머가 계속 돌 필요는 없다.

모험 시작 시 저장할 값:

```ts
interface AdventureState {
  adventureId: string;
  dinosaurId: string;
  areaId: string;
  startedAt: number;
  durationMs: number;
  endsAt: number;
  status: "idle" | "in_progress" | "completed" | "claimed";
}
```

상태:

| 상태 | 의미 |
| --- | --- |
| `idle` | 진행 중인 모험 없음 |
| `in_progress` | 모험 진행 중 |
| `completed` | 시간이 끝났고 보상 수령 가능 |
| `claimed` | 보상 수령 완료 |

앱 재실행 시 처리:

```text
저장된 activeAdventure 불러오기
→ Date.now()와 endsAt 비교
→ 현재 시간이 endsAt보다 크거나 같으면 completed 상태로 표시
→ 보상 받기 버튼 활성화
```

예시:

```text
30분짜리 모험 시작
→ 앱 종료
→ 2시간 뒤 앱 재실행
→ Date.now() >= endsAt 확인
→ 모험 완료 처리
→ 보상 받기 버튼 표시
```

구현 원칙:

- 앱이 꺼져 있는 동안 별도 백그라운드 타이머를 돌리지 않는다.
- 저장된 `startedAt`, `durationMs`, `endsAt`를 기준으로 완료 여부를 계산한다.
- 보상은 `completed`에서 사용자가 수령했을 때만 지급한다.
- 보상을 받으면 상태를 `claimed`로 바꾼 뒤 저장한다.

## 10. 개발 단계 제안

1단계:

- `localStorage` 기반 `GameState` 저장
- 코인/EXP/공룡/아이템/부화/모험 상태 저장
- 앱 재실행 시 상태 복원

2단계:

- 블루투스 주판 연결
- 터치 키패드 보조 입력
- `InputController`로 입력 충돌 방지

3단계:

- 모험 시간형 퀘스트
- `startedAt`/`endsAt` 기반 완료 계산

4단계:

- 부화장 progress 저장
- 문제풀이 성공과 부화 게이지 연결

5단계:

- PWA 전환 검토
- 설치형 앱처럼 실행 가능하게 개선

## 11. 최종 메시지

이 프로젝트는 단순 웹페이지가 아니라, 터치 노트북에서 고정적으로 실행하는 주판 훈련용 로컬 웹앱이다.
초기에는 `localStorage` 기반으로 게임 상태를 저장하고, 앱을 껐다 켜도 모험/부화/공룡 성장/보유 아이템이 이어지도록 설계한다.
나중에 PWA로 전환하면 설치형 앱처럼 사용할 수 있다.
