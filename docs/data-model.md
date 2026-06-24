# 데이터 모델 설계 초안

이 문서는 목업 확인 이후 실제 구현으로 넘어가기 전에 사용할 TypeScript 데이터 구조 초안을 정리한다.
이번 단계의 목적은 코드 구현이 아니라, 주산훈련, 문제 세션, 보상, 공룡 성장, 알 부화, 상점, 도감, 로컬 저장이 어떤 데이터로 연결되는지 미리 맞추는 것이다.

참고 문서:

- `docs/game-structure.md`
- `docs/game-settings.md`
- `docs/balance-config.md`
- `docs/shop-items.md`
- `docs/bluetooth-abacus.md`
- `docs/mockup-review.md`
- `docs/visual-feedback.md`

## 1. 설계 원칙

- 훈련 세션 진행 상태는 화면 컴포넌트 안에 흩어두지 않고 `TrainingSession` 같은 별도 상태로 관리한다.
- 운영 중 조정될 수 있는 난이도, 보상, 부화, 성장, 상점, UX 타이밍 수치는 로직에 하드코딩하지 않고 `docs/balance-config.md` 기준으로 별도 config/data 파일에서 관리한다.
- 세트 진행 중 임시 입력, 피드백, 현재 문제 상태는 메모리에 둔다.
- 코인, EXP, 공룡 성장, 알 부화 진행, 아이템 구매, 도감 해금처럼 영구 보존이 필요한 결과만 `SaveData`에 저장한다.
- 전역 config와 플레이어 저장값은 분리한다. 예를 들어 정답당 코인, 콤보 보너스, 상점 가격표는 config이고, 현재 보유 코인, 인벤토리 수량, 알 진행도는 저장값이다.
- 문제풀이 중 매 입력마다 전체 저장 데이터를 갱신하지 않는다. 기본 저장 시점은 세트 완료 정산, 구매, 아이템 사용, 부화 완료, 설정 변경이다.
- 물리 주판에는 별도 초기화 버튼이 없다. 새 문제 시작 시 앱 내부 입력값과 피드백만 초기화한다.
- Bluetooth 리턴 버튼은 현재 주판알 배열값 전송과 정답 확인 역할을 함께 한다.
- Bluetooth 리턴 수신 시 방금 수신한 `parsedValue`를 직접 채점 함수에 넘긴다. `setState` 이후 값을 다시 읽어 채점하지 않는다.
- 정답이면 짧은 피드백 후 자동으로 다음 문제로 이동한다.
- 오답이면 같은 문제에서 재시도할 수 있다.
- 목업의 문제 카드 수동 선택은 테스트용이며, 최종 구현에서는 세트 안에서 자동 진행한다.

## 2. 공통 타입 후보

아래 타입들은 본문 타입에서 반복 사용하기 위한 문자열 union 초안이다.

```ts
type Id = string;
type UnixTimeMs = number;

type AnswerSource = "bluetooth" | "keypad" | "keyboard" | "debug";
type ProblemOperator = "+" | "-";
type ProblemStatus = "ready" | "answering" | "correct" | "retry" | "skipped";
type SessionStatus = "idle" | "running" | "showing_feedback" | "completed" | "abandoned";
type AccuracyGrade = "S" | "A" | "B" | "C" | "D";
type SpeedGrade = "S" | "A" | "B" | "C" | "D";
type EggCategory = "normal" | "rare" | "special" | "event" | "legendary";
type EggStatus = "owned" | "incubating" | "ready_to_hatch" | "hatched";
type ItemCategory = "food" | "toy" | "costume" | "hatch_boost" | "egg_fragment" | "adventure";
type RewardReason = "problem_correct" | "set_complete" | "streak" | "accuracy" | "speed" | "quest" | "adventure" | "shop_purchase" | "hatch";
```

초기 구현에서는 union을 작게 시작하고, 데이터가 늘어날 때만 확장한다.

## 3. TrainingSession

### 역할

한 번의 주산훈련 세트 상태를 나타낸다.
설정값에 따라 생성된 문제 목록, 현재 문제 인덱스, 정답/오답 기록, 진행 상태, 결과 정산 전 보상 예측치를 가진다.

### 타입 초안

```ts
interface TrainingSession {
  id: Id;
  status: SessionStatus;
  configVersion: string;
  settings: TrainingSettingsSnapshot;
  problems: TrainingProblem[];
  currentProblemIndex: number;
  answers: TrainingAnswer[];
  startedAt: UnixTimeMs;
  completedAt: UnixTimeMs | null;
  feedbackUntil: UnixTimeMs | null;
  pendingRewards: Reward[];
  result: TrainingResult | null;
}

interface TrainingSettingsSnapshot {
  numberCount: 3 | 4 | 5 | 6;
  digitMode: "one_digit" | "two_digit";
  problemCount: 10 | 15 | 20;
  includeSubtraction: boolean;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `id` | 세트 단위 고유 ID |
| `status` | 세트 진행 상태 |
| `configVersion` | 세트 시작 시 적용된 밸런스 config version |
| `settings` | 세트 시작 시점의 문제 설정 스냅샷 |
| `problems` | 세트에 포함된 문제 목록 |
| `currentProblemIndex` | 자동 진행 중 현재 문제 위치 |
| `answers` | 제출된 답안 기록. 오답 재시도도 별도 기록으로 남긴다 |
| `startedAt` | 세트 시작 시각 |
| `completedAt` | 세트 완료 시각 |
| `feedbackUntil` | 정답 후 짧은 피드백을 보여줄 종료 시각 |
| `pendingRewards` | 세트 중 화면에 보여줄 획득 예정 보상 |
| `result` | 세트 완료 후 계산된 최종 결과 |

### 연결 화면/기능

- 훈련장: 현재 문제, 진행률, 정답/오답 피드백, 자동 다음 문제 이동
- 결과 화면: 세트 완료 요약, 정확도, 시간, 보상
- 알 부화장/우리 공룡: 세트 완료 후 부화 진행과 EXP 반영
- 로컬 저장: 완료된 `TrainingResult`와 보상 정산만 `SaveData`에 반영

### 초기 필수 필드

- `id`
- `status`
- `configVersion`
- `settings`
- `problems`
- `currentProblemIndex`
- `answers`
- `startedAt`
- `completedAt`
- `result`

### 후속 확장 필드

- `feedbackUntil`
- `pendingRewards`
- config 세부 version 묶음
- 일시정지 상태
- 중도 이탈 복구 상태
- 약한 유형 분석용 메타데이터

## 4. TrainingProblem

### 역할

한 문제의 숫자 배열, 연산자, 정답, 표시용 문구를 나타낸다.
문제 생성 로직의 결과물이며, 채점은 `correctAnswer`를 기준으로 한다.

### 타입 초안

```ts
interface TrainingProblem {
  id: Id;
  index: number;
  numbers: number[];
  operators: ProblemOperator[];
  correctAnswer: number;
  displayText: string;
  status: ProblemStatus;
  createdAt: UnixTimeMs;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `id` | 문제 고유 ID |
| `index` | 세트 안의 0 기반 순서 |
| `numbers` | 문제에 나오는 숫자 배열 |
| `operators` | 숫자 사이 연산자. 길이는 `numbers.length - 1` |
| `correctAnswer` | 정답 |
| `displayText` | 화면 표시용 문제 문자열 |
| `status` | 현재 문제 상태 |
| `createdAt` | 문제 생성 시각 |

### 연결 화면/기능

- 훈련장 문제 카드
- 문제 생성 로직
- Bluetooth/키패드 공통 채점 함수
- 결과 화면의 문제별 리뷰

### 초기 필수 필드

- `id`
- `index`
- `numbers`
- `operators`
- `correctAnswer`
- `displayText`
- `status`

### 후속 확장 필드

- 난이도 태그
- 받아올림/받아내림 여부
- 문제 유형 ID
- 풀이 제한 시간
- 힌트 데이터

## 5. TrainingAnswer

### 역할

사용자가 제출한 답안 1회를 기록한다.
오답 후 같은 문제에서 재시도할 수 있으므로, 한 문제에 여러 `TrainingAnswer`가 생길 수 있다.

### 타입 초안

```ts
interface TrainingAnswer {
  id: Id;
  problemId: Id;
  problemIndex: number;
  submittedValue: number | null;
  rawInput: string;
  source: AnswerSource;
  isCorrect: boolean;
  submittedAt: UnixTimeMs;
  elapsedMsFromProblemStart: number;
  bluetoothPacketId?: Id;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `id` | 답안 제출 고유 ID |
| `problemId` | 연결된 문제 ID |
| `problemIndex` | 제출 시점의 문제 순서. 늦은 Bluetooth 이벤트 방지에 사용 |
| `submittedValue` | 숫자로 파싱된 제출값. 파싱 실패 시 `null` |
| `rawInput` | 입력칸 문자열 또는 Bluetooth raw 표시값 |
| `source` | Bluetooth, 키패드, 키보드 등 입력 출처 |
| `isCorrect` | 정답 여부 |
| `submittedAt` | 제출 시각 |
| `elapsedMsFromProblemStart` | 현재 문제 시작 후 제출까지 걸린 시간 |
| `bluetoothPacketId` | Bluetooth 입력 이벤트와 연결할 선택 필드 |

### 연결 화면/기능

- 훈련장 답 입력 및 피드백
- 오답 재시도 흐름
- Bluetooth 리턴 수신 후 직접 채점
- 결과 화면의 정답 수, 오답 수, 풀이 시간 계산

### 초기 필수 필드

- `id`
- `problemId`
- `problemIndex`
- `submittedValue`
- `rawInput`
- `source`
- `isCorrect`
- `submittedAt`
- `elapsedMsFromProblemStart`

### 후속 확장 필드

- `bluetoothPacketId`
- 오답 유형
- 재시도 횟수 캐시
- 입력 수정 이력

## 6. TrainingResult

### 역할

세트 완료 후 정산된 학습 결과다.
보상, 성장, 부화 진행, 최근 기록 저장의 기준이 된다.

### 타입 초안

```ts
interface TrainingResult {
  sessionId: Id;
  completedAt: UnixTimeMs;
  totalProblems: number;
  correctProblems: number;
  totalAttempts: number;
  accuracy: number;
  totalTimeMs: number;
  averageTimeMs: number;
  bestStreak: number;
  accuracyGrade: AccuracyGrade;
  speedGrade: SpeedGrade;
  rewards: Reward[];
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `sessionId` | 완료된 세트 ID |
| `completedAt` | 완료 시각 |
| `totalProblems` | 총 문제 수 |
| `correctProblems` | 최종 정답 처리된 문제 수 |
| `totalAttempts` | 오답 재시도를 포함한 총 제출 횟수 |
| `accuracy` | `correctProblems / totalProblems` |
| `totalTimeMs` | 전체 풀이 시간 |
| `averageTimeMs` | 문제당 평균 풀이 시간 |
| `bestStreak` | 가장 긴 연속 정답 수 |
| `accuracyGrade` | 정확도 등급 |
| `speedGrade` | 속도 등급 |
| `rewards` | 최종 지급할 보상 목록 |

### 연결 화면/기능

- 20문제 결과 화면
- 보상 정산
- 공룡 EXP 증가
- 알 부화 진행 증가
- 최근 학습 기록 저장

### 초기 필수 필드

- `sessionId`
- `completedAt`
- `totalProblems`
- `correctProblems`
- `accuracy`
- `totalTimeMs`
- `bestStreak`
- `accuracyGrade`
- `speedGrade`
- `rewards`

### 후속 확장 필드

- `totalAttempts`
- `averageTimeMs`
- 난이도 추천 결과
- 문제 유형별 정확도
- 부모용 상세 리포트

## 7. PlayerProfile

### 역할

플레이어의 기본 상태와 누적 재화를 관리한다.
아이가 앱을 다시 열었을 때 이어서 플레이할 수 있는 계정 없는 로컬 프로필이다.

### 타입 초안

```ts
interface PlayerProfile {
  id: Id;
  childName?: string;
  coins: number;
  totalCoinsEarned: number;
  totalExpEarned: number;
  createdAt: UnixTimeMs;
  lastPlayedAt: UnixTimeMs | null;
  onboardingCompleted: boolean;
  selectedDinosaurId: Id | null;
  activeEggId: Id | null;
  trainingStats: PlayerTrainingStats;
}

interface PlayerTrainingStats {
  totalSessionsCompleted: number;
  totalProblemsAnswered: number;
  totalCorrectProblems: number;
  currentDailyStreak: number;
  lastTrainingDate: string | null;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `id` | 로컬 프로필 ID |
| `childName` | 선택 입력 이름 |
| `coins` | 현재 보유 코인 |
| `totalCoinsEarned` | 누적 획득 코인 |
| `totalExpEarned` | 누적 획득 EXP |
| `createdAt` | 프로필 생성 시각 |
| `lastPlayedAt` | 마지막 실행/플레이 시각 |
| `onboardingCompleted` | 첫 안내 완료 여부 |
| `selectedDinosaurId` | 대표 공룡 ID |
| `activeEggId` | 현재 부화방의 활성 알 ID |
| `trainingStats` | 누적 학습 통계 |

### 연결 화면/기능

- 상단 HUD의 코인/대표 공룡/진행도
- 우리 공룡 탭의 선택 공룡
- 알 부화장 활성 알
- 설정/온보딩
- 로컬 저장 복원

### 초기 필수 필드

- `id`
- `coins`
- `createdAt`
- `lastPlayedAt`
- `onboardingCompleted`
- `selectedDinosaurId`
- `activeEggId`
- `trainingStats`

### 후속 확장 필드

- `childName`
- 부모 설정 연결
- 일일 권장 세트
- 휴식 알림 기록
- 다중 프로필

## 8. Dinosaur

성장/경험치/레벨업 정책의 기준 문서는 `docs/dinosaur-growth-system.md`다. 이 문서는 저장 데이터 구조와 필드 역할만 요약한다.

### 역할

보유한 공룡 한 마리를 나타낸다.
정적 종 데이터가 아니라, 플레이어가 실제로 얻고 키우는 개별 인스턴스다.

### 타입 초안

```ts
interface Dinosaur {
  id: Id;
  speciesId: Id;
  nickname?: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  growthStage: "baby" | "child" | "teen" | "adult";
  happiness: number;
  stamina: number;
  maxStamina: number;
  equippedCostumeIds: Id[];
  obtainedAt: UnixTimeMs;
  sourceEggId: Id | null;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `id` | 보유 공룡 인스턴스 ID |
| `speciesId` | 정적 공룡 종 데이터 ID |
| `nickname` | 별명 |
| `level` | 성장 레벨 |
| `exp` | 현재 EXP |
| `expToNextLevel` | 다음 레벨 필요 EXP |
| `growthStage` | 성장 단계 |
| `happiness` | 기분 상태 |
| `stamina` | 체력 상태 |
| `maxStamina` | 최대 체력 |
| `equippedCostumeIds` | 착용 중인 코스튬 ID |
| `obtainedAt` | 획득 시각 |
| `sourceEggId` | 부화로 얻은 경우 원본 알 ID |

현재 코드에서는 행복이 `mood`, 공룡 이름/별명이 `name`으로 저장될 수 있다. 문서상 의도와 코드 필드명이 다를 때는 `docs/dinosaur-growth-system.md`의 매핑 표를 기준으로 해석한다.

### 연결 화면/기능

- 우리 공룡 탭
- 놀이터 상호작용
- 음식/장난감 사용
- 세트 완료 EXP 지급
- 도감 해금 결과
- 모험 파견 후보

### 초기 필수 필드

- `id`
- `speciesId`
- `level`
- `exp`
- `expToNextLevel`
- `growthStage`
- `happiness`
- `stamina`
- `maxStamina`
- `equippedCostumeIds`
- `obtainedAt`

### 후속 확장 필드

- `nickname`
- `sourceEggId`
- 성격/personality
- 좋아하는 음식/장난감
- 모험 특성

## 9. Egg

### 역할

보유하거나 부화 중인 알 상태를 나타낸다.
새 공룡은 직접 구매가 아니라 알 또는 알 조각 획득, 부화, 랜덤 등장, 도감 해금 흐름으로 얻는다.

### 타입 초안

```ts
interface Egg {
  id: Id;
  category: EggCategory;
  displayName: string;
  status: EggStatus;
  candidateSpeciesIds: Id[];
  progress: number;
  requiredProgress: number;
  hintStage: number;
  maxHintStage: number;
  activeBoosts: HatchBoost[];
  createdAt: UnixTimeMs;
  incubatedAt: UnixTimeMs | null;
  hatchedAt: UnixTimeMs | null;
  hatchedDinosaurId: Id | null;
}

interface HatchBoost {
  itemId: Id;
  remainingSessionCount: number;
  progressBonus: number;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `id` | 알 인스턴스 ID |
| `category` | 일반/희귀/특별 등 알 카테고리 |
| `displayName` | 화면 표시 이름. 초기에는 `미확인 알`처럼 공룡명을 숨긴다 |
| `status` | 보유, 부화 중, 부화 가능, 부화 완료 상태 |
| `candidateSpeciesIds` | 부화 시 등장 후보 공룡 목록 |
| `progress` | 현재 부화 진행도 |
| `requiredProgress` | 부화 완료 필요 진행도 |
| `hintStage` | 공개된 힌트 단계 |
| `maxHintStage` | 총 힌트 단계 |
| `activeBoosts` | 부화 보조 아이템 효과 |
| `createdAt` | 획득 시각 |
| `incubatedAt` | 부화방 등록 시각 |
| `hatchedAt` | 부화 완료 시각 |
| `hatchedDinosaurId` | 부화 결과 공룡 ID |

### 연결 화면/기능

- 알 부화장
- 세트 완료 후 부화 진행 증가
- 상점의 알/알 조각 구매 결과
- 부화 완료 시 공룡 생성
- 도감 정식 해금

### 초기 필수 필드

- `id`
- `category`
- `displayName`
- `status`
- `candidateSpeciesIds`
- `progress`
- `requiredProgress`
- `hintStage`
- `createdAt`
- `incubatedAt`
- `hatchedAt`
- `hatchedDinosaurId`

### 후속 확장 필드

- `maxHintStage`
- `activeBoosts`
- 알 무늬/실루엣/울음소리 힌트
- 중복 방지 확률 보정
- 이벤트 알 만료일

## 10. InventoryItem

### 역할

플레이어가 보유한 아이템 묶음을 나타낸다.
상점의 정적 상품 데이터와 분리해서, 실제 보유 수량과 획득/사용 상태만 저장한다.

### 타입 초안

```ts
interface InventoryItem {
  itemId: Id;
  category: ItemCategory;
  quantity: number;
  acquiredAt: UnixTimeMs;
  lastUsedAt: UnixTimeMs | null;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `itemId` | 정적 아이템 데이터 ID |
| `category` | 음식, 장난감, 코스튬, 부화 보조 등 |
| `quantity` | 보유 수량 |
| `acquiredAt` | 처음 획득한 시각 |
| `lastUsedAt` | 마지막 사용 시각 |

### 연결 화면/기능

- 상점 구매 후 인벤토리 증가
- 우리 공룡/놀이터에서 음식, 장난감 사용
- 알 부화장에서 부화 보조 아이템 사용
- 코스튬 보유와 착용 상태

### 초기 필수 필드

- `itemId`
- `category`
- `quantity`

### 후속 확장 필드

- `acquiredAt`
- `lastUsedAt`
- 사용 제한
- 일일 구매 제한
- 소모기한

## 11. ShopItem

### 역할

상점에 진열되는 정적 상품 데이터다.
`InventoryItem`은 보유 상태이고, `ShopItem`은 구매 가능한 상품의 정의다.

### 타입 초안

```ts
interface ShopItem {
  id: Id;
  itemId: Id;
  category: ItemCategory;
  name: string;
  description: string;
  priceCoins: number;
  purchaseQuantity: number;
  available: boolean;
  sortOrder: number;
  effect: ShopItemEffect;
}

interface ShopItemEffect {
  type: "grant_item" | "grant_egg" | "grant_egg_fragment" | "unlock_cosmetic";
  targetId: Id;
  amount: number;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `id` | 상점 진열 항목 ID |
| `itemId` | 구매 후 인벤토리에 들어갈 아이템 ID |
| `category` | 상점 탭 분류 |
| `name` | 상품명 |
| `description` | 아이가 이해할 수 있는 설명 |
| `priceCoins` | 코인 가격 |
| `purchaseQuantity` | 1회 구매 수량 |
| `available` | 현재 판매 여부 |
| `sortOrder` | 표시 순서 |
| `effect` | 구매 시 적용할 효과 |

### 연결 화면/기능

- 상점 탭
- 코인 차감
- 인벤토리 증가
- 알/알 조각 획득
- 향후 데이터 파일 `src/data/items.ts`

### 초기 필수 필드

- `id`
- `itemId`
- `category`
- `name`
- `description`
- `priceCoins`
- `purchaseQuantity`
- `available`
- `effect`

### 후속 확장 필드

- `sortOrder`
- 구매 제한
- 해금 조건
- 추천 배지
- 이미지 경로
- 할인/이벤트 가격

## 12. DexEntry

### 역할

도감의 한 항목 상태를 나타낸다.
정적 공룡 데이터와 별도로, 플레이어가 해당 종을 보았는지, 부화로 해금했는지, 힌트를 얼마나 열었는지 저장한다.

### 타입 초안

```ts
interface DexEntry {
  speciesId: Id;
  status: "locked" | "hinted" | "discovered";
  discoveredAt: UnixTimeMs | null;
  firstDinosaurId: Id | null;
  hintStage: number;
  duplicateCount: number;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `speciesId` | 공룡 종 ID |
| `status` | 잠김, 힌트 공개, 정식 발견 상태 |
| `discoveredAt` | 부화 완료로 도감 해금된 시각 |
| `firstDinosaurId` | 처음 발견한 보유 공룡 ID |
| `hintStage` | 공개된 힌트 단계 |
| `duplicateCount` | 중복 획득 횟수 |

### 연결 화면/기능

- 도감 탭의 잠김/실루엣/해금 카드
- 알 부화 중 힌트 공개
- 부화 완료 후 정식 등록
- 중복 공룡 처리

### 초기 필수 필드

- `speciesId`
- `status`
- `discoveredAt`
- `firstDinosaurId`
- `hintStage`

### 후속 확장 필드

- `duplicateCount`
- 발견 조건 텍스트
- 진화 조건
- 지역/모험 연결
- 아이템 도감 항목

## 13. Reward

### 역할

훈련, 모험, 퀘스트, 부화 등에서 지급되는 보상 하나를 공통 형식으로 나타낸다.
결과 화면 표시와 실제 정산 로직이 같은 데이터를 공유하게 한다.

### 타입 초안

```ts
interface Reward {
  id: Id;
  reason: RewardReason;
  type: "coin" | "exp" | "hatch_progress" | "item" | "egg" | "egg_fragment" | "dex_unlock";
  amount: number;
  targetId: Id | null;
  label: string;
  grantedAt: UnixTimeMs | null;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `id` | 보상 항목 ID |
| `reason` | 지급 사유 |
| `type` | 보상 종류 |
| `amount` | 수량 또는 증가량 |
| `targetId` | EXP 대상 공룡, 진행 대상 알, 아이템 ID 등 |
| `label` | 결과 화면 표시 문구 |
| `grantedAt` | 실제 지급 시각. 예정 보상은 `null` |

### 연결 화면/기능

- 훈련 중 획득 예정 보상 표시
- 결과 화면 보상 목록
- 코인/EXP/부화 진행 정산
- 상점 구매 결과
- 모험 보상

### 초기 필수 필드

- `id`
- `reason`
- `type`
- `amount`
- `targetId`
- `label`

### 후속 확장 필드

- `grantedAt`
- 보상 묶음 ID
- 애니메이션 연출 키
- 확률 보상 정보
- 부모 리포트용 분류

## 14. BluetoothInputState

### 역할

Bluetooth 주판 연결 상태와 마지막 수신 입력을 관리한다.
이 상태는 입력 장치 상태일 뿐이며, 보상/성장/상점/도감 로직과 직접 결합하지 않는다.

### 타입 초안

```ts
interface BluetoothInputState {
  status: "unsupported" | "idle" | "requesting" | "connecting" | "connected" | "disconnected" | "error" | "dummy";
  deviceName: string | null;
  lastPacket: BluetoothPacket | null;
  lastParsedValue: number | null;
  lastConfirmedAt: UnixTimeMs | null;
  lastError: string | null;
  confirmGuard: BluetoothConfirmGuard;
}

interface BluetoothPacket {
  id: Id;
  rawHex: string;
  tens: number;
  ones: number;
  parsedValue: number | null;
  isConfirmed: boolean;
  receivedAt: UnixTimeMs;
}

interface BluetoothConfirmGuard {
  processedPacketId: Id | null;
  processedProblemIndex: number | null;
  processedRawHex: string | null;
  processedAt: UnixTimeMs | null;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `status` | Web Bluetooth 지원/연결 상태 |
| `deviceName` | 연결된 기기 이름 |
| `lastPacket` | 마지막 notification packet 파싱 결과 |
| `lastParsedValue` | 마지막 유효 숫자값 |
| `lastConfirmedAt` | 마지막 리턴/확인 수신 시각 |
| `lastError` | 연결 또는 파싱 오류 메시지 |
| `confirmGuard` | 중복 confirm 처리 방지 상태 |
| `rawHex` | 디버깅용 packet hex 문자열 |
| `parsedValue` | 채점에 직접 넘길 숫자값 |
| `isConfirmed` | 리턴 버튼 신호 여부 |

### 연결 화면/기능

- 설정 탭의 주산 입력 장치 연결 테스트
- 훈련장 답 입력칸
- Bluetooth 리턴 수신 시 `submitAnswer("bluetooth", String(parsedValue))`
- 중복 confirm debounce/guard
- 실기 테스트 raw packet 로그

### 초기 필수 필드

- `status`
- `deviceName`
- `lastPacket`
- `lastParsedValue`
- `lastConfirmedAt`
- `lastError`
- `confirmGuard`

### 후속 확장 필드

- 재연결 시도 횟수
- 브라우저 지원 상태 상세
- packet fixture 저장
- 세 자리 이상 자리수
- device id 권한 복구 정보

### 구현 규칙 메모

Bluetooth 리턴 처리 시 권장 흐름은 다음과 같다.

```ts
function handleBluetoothConfirm(packet: BluetoothPacket, currentProblemIndex: number) {
  if (!packet.isConfirmed) return;
  if (packet.parsedValue === null) return;
  if (isDuplicateConfirm(packet, currentProblemIndex)) return;

  inputController.setAnswer(String(packet.parsedValue));
  inputController.submitAnswer("bluetooth", String(packet.parsedValue));
}
```

핵심은 `setAnswer` 이후 React state의 `answer`를 다시 읽지 않고, 방금 수신한 `packet.parsedValue`를 직접 제출하는 것이다.

## 15. SaveData

### 역할

`localStorage`에 저장할 최상위 데이터 구조다.
로컬 앱 재실행 후 플레이어 프로필, 공룡, 알, 인벤토리, 도감, 설정, 최근 결과를 복원한다.

권장 저장 키:

```text
abacus-dino-game-state
```

백업 또는 migration 실패 시 임시 키:

```text
abacus-dino-game-state-backup
abacus-dino-game-state-corrupted
```

### 타입 초안

```ts
interface SaveData {
  version: number;
  profile: PlayerProfile;
  dinosaurs: Dinosaur[];
  eggs: Egg[];
  inventory: InventoryItem[];
  dex: DexEntry[];
  recentResults: TrainingResult[];
  settings: SaveSettings;
  meta: SaveMeta;
}

interface SaveSettings {
  training: TrainingSettingsSnapshot;
  parent: ParentTunableSettings;
  audioEnabled: boolean;
  bluetoothPreferred: boolean;
}

interface ParentTunableSettings {
  autoDifficultyEnabled: boolean;
  maxDifficultyProfileId: Id | null;
  recommendedSetsPerDay: number;
}

interface SaveMeta {
  savedAt: UnixTimeMs;
  migrationHistory: number[];
  lastBackupAt: UnixTimeMs | null;
}
```

### 필드 의미

| 필드 | 의미 |
| --- | --- |
| `version` | 저장 데이터 버전 |
| `profile` | 플레이어 기본 상태와 재화 |
| `dinosaurs` | 보유 공룡 목록 |
| `eggs` | 보유/부화 중/부화 완료 알 목록 |
| `inventory` | 보유 아이템 목록 |
| `dex` | 도감 해금 상태 |
| `recentResults` | 최근 학습 결과 목록 |
| `settings` | 문제 설정, 오디오, Bluetooth 선호 등 |
| `meta` | 저장 시각, migration, 백업 정보 |

`SaveSettings`에는 부모가 선택한 사용자 설정만 저장한다.
전역 밸런스 수치인 정답당 코인, 세트 완료 보너스, 일일 소프트캡, 상점 가격, 레벨별 필요 EXP, UX 딜레이는 `SaveData`에 복사하지 않고 config에서 읽는다.
단, 이미 생성된 알의 `requiredProgress`처럼 생성 시점의 플레이 경험을 유지해야 하는 값은 인스턴스 데이터에 복사해 저장할 수 있다.

### 연결 화면/기능

- 앱 시작 시 상태 복원
- 세트 완료 후 보상/성장/부화 정산 저장
- 상점 구매 저장
- 아이템 사용 저장
- 알 부화 완료와 도감 해금 저장
- 설정 변경 저장

### 초기 필수 필드

- `version`
- `profile`
- `dinosaurs`
- `eggs`
- `inventory`
- `dex`
- `recentResults`
- `settings`
- `meta`

### 후속 확장 필드

- 모험 진행 상태
- 퀘스트/업적
- 백업 내보내기/가져오기
- 부모 리포트
- 다중 프로필
- IndexedDB 전환용 asset/cache 메타

## 16. 초기 구현 순서 제안

문서 설계 이후 실제 코드화는 아래 순서가 좋다.

1. `TrainingSettingsSnapshot`, `TrainingProblem`, `TrainingSession`, `TrainingAnswer`, `TrainingResult`부터 구현한다.
2. `difficultyConfig`, `rewardConfig`, `economyConfig` 같은 초기 config 파일을 만든다.
3. 문제 생성 함수와 공통 채점 함수를 만들고, 문제 생성에 필요한 수치는 `difficultyConfig`에서 읽는다.
4. Bluetooth와 키패드가 같은 제출 함수로 들어오도록 입력 컨트롤러를 만든다.
5. 세트 완료 시 `rewardConfig`, `economyConfig`를 입력으로 받아 `Reward[]`와 `TrainingResult`를 계산한다.
6. `PlayerProfile`, `Dinosaur`, `Egg`, `InventoryItem`, `DexEntry`, `SaveData` 기본값을 만든다.
7. 세트 완료 정산을 `SaveData`에 반영하고 `localStorage` 저장/복원을 붙인다.
8. 이후 `eggConfig`, `growthConfig`, `shopConfig`, `fatigueConfig`, `uxTimingConfig`를 붙여 상점 구매, 아이템 사용, 부화 완료, 도감 해금을 별도 reducer/action으로 확장한다.

1차 구현의 핵심은 훈련 세션과 저장 가능한 정산 결과를 먼저 안정화하는 것이다.
상점, 도감, 모험은 데이터 구조를 준비하되, 실제 화면 동작은 훈련 세트 완료와 저장 복원이 안정된 뒤 붙이는 편이 안전하다.
