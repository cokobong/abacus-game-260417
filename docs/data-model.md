# 데이터 모델과 GameState 구조

이 문서는 1차 구현에서 사용할 로컬 저장 데이터 모델과 `GameState` 구조를 정리한다.
초기 버전은 서버 없이 `localStorage`를 사용하며, 추후 IndexedDB 또는 클라우드 저장으로 확장할 수 있게 버전 필드를 둔다.

## 1. 기본 원칙

- 게임 상태는 화면 컴포넌트 안에 흩어두지 않는다.
- 앱 실행 시 저장된 `GameState`를 불러온다.
- `GameState` 변경 시 자동 저장한다.
- 저장 데이터에는 `version`을 둔다.
- 필수 필드가 없으면 기본값으로 채운다.
- 알 수 없는 필드는 migration 전까지 가능한 한 보존한다.
- 저장/복원 실패가 문제풀이를 깨뜨리면 안 된다.

## 2. 저장 키

권장 저장 키:

```text
abacus-dino-game-state
```

백업 또는 migration 실패 시 임시 키:

```text
abacus-dino-game-state-backup
abacus-dino-game-state-corrupted
```

## 3. GameState 초안

```ts
interface GameState {
  version: number;
  profile: ProfileState;
  learning: LearningState;
  rewards: RewardState;
  dinosaurs: DinosaurState[];
  selectedDinosaurId: string | null;
  inventory: InventoryState;
  eggs: EggState[];
  activeHatchEggId: string | null;
  pokedex: PokedexState;
  activeAdventure: AdventureState | null;
  quests: QuestState;
  settings: SettingsState;
  meta: GameMetaState;
}
```

정확한 TypeScript 타입명은 구현 단계에서 조정할 수 있지만, 책임 영역은 위처럼 분리한다.

## 4. 프로필 상태

```ts
interface ProfileState {
  childName?: string;
  createdAt: number;
  lastPlayedAt: number | null;
  onboardingCompleted: boolean;
}
```

역할:

- 첫 실행 여부
- 온보딩 완료 여부
- 마지막 플레이 시각

## 5. 학습 상태

```ts
interface LearningState {
  totalSetsCompleted: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  recentSets: LearningSetSummary[];
  currentDifficultySettings: ProblemDifficultySettings;
  daily: DailyLearningState;
}

interface LearningSetSummary {
  completedAt: number;
  questionCount: number;
  correctCount: number;
  accuracy: number;
  totalTimeMs: number;
  speedGrade: "S" | "A" | "B" | "C" | "D";
  mode: "review" | "learning" | "challenge";
}
```

역할:

- 최근 5세트 기반 난이도 추천
- 하루 학습량 계산
- 결과 화면 통계

## 6. 보상 상태

```ts
interface RewardState {
  coins: number;
  totalCoinsEarned: number;
  totalExpEarned: number;
}
```

코인은 상점 구매에 사용한다.
EXP는 현재 선택된 공룡 성장에 반영한다.

## 7. 공룡 상태

```ts
interface DinosaurState {
  id: string;
  speciesId: string;
  nickname?: string;
  level: number;
  exp: number;
  hunger: number;
  happiness: number;
  stamina: number;
  personalityId: string;
  equippedCostumeIds: string[];
  obtainedAt: number;
}
```

원칙:

- `speciesId`는 공룡 데이터베이스의 정적 ID를 가리킨다.
- `id`는 개별 보유 공룡의 인스턴스 ID다.
- 공룡 레벨은 문제 난이도와 직접 연결하지 않는다.

## 8. 인벤토리 상태

```ts
interface InventoryState {
  foods: InventoryItemStack[];
  costumes: InventoryItemStack[];
  hatchItems: InventoryItemStack[];
  eggFragments: InventoryItemStack[];
}

interface InventoryItemStack {
  itemId: string;
  quantity: number;
}
```

원칙:

- 음식은 공룡 성장/상태 보조에 사용한다.
- 코스튬은 보유/착용 상태를 분리한다.
- 알 조각은 특정 공룡 직접 구매가 아니라 알 획득/부화 루프로 연결한다.

## 9. 알과 부화 상태

```ts
interface EggState {
  eggId: string;
  eggCategory: "basic" | "normal" | "rare" | "special" | "event" | "legendary";
  candidatePool: string[];
  progress: number;
  requiredProgress: number;
  hintStage: number;
  createdAt: number;
  status: "incubating" | "ready_to_hatch" | "hatched";
  activeBoosts: HatchBoostState[];
}

interface HatchBoostState {
  itemId: string;
  remainingSetCount: number;
  progressBonus: number;
}
```

부화는 시간 경과가 아니라 문제풀이 세트 성공으로 진행한다.
부화 보조 아이템은 즉시 부화가 아니라 다음 세트 보상을 강화한다.

## 10. 도감 상태

```ts
interface PokedexState {
  discoveredSpeciesIds: string[];
  seenEggCategoryIds: string[];
  unlockedHintIds: string[];
  duplicateCounts: Record<string, number>;
}
```

도감 정식 해금은 알 구매 시점이 아니라 부화 완료 시점에 처리한다.

## 11. 모험 상태

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

앱 재실행 시 `Date.now()`와 `endsAt`를 비교해 완료 여부를 계산한다.
보상은 사용자가 `보상 받기`를 눌렀을 때 지급한다.

## 12. 퀘스트와 하루 루틴

```ts
interface QuestState {
  dailyQuestIds: string[];
  completedQuestIds: string[];
  claimedQuestRewardIds: string[];
  achievementIds: string[];
}

interface DailyLearningState {
  date: string;
  completedSetCount: number;
  claimedDailyRewardIds: string[];
  streakDays: number;
}
```

날짜는 초기 버전에서 로컬 날짜 기준으로 처리한다.

## 13. 설정 상태

```ts
interface SettingsState {
  audio: AudioSettingsState;
  bluetooth: BluetoothSettingsState;
  parent: ParentSettingsState;
  accessibility: AccessibilitySettingsState;
}
```

예시:

```ts
interface ParentSettingsState {
  dailyRecommendedSets: number;
  restReminderAfterSets: number;
  autoDifficultyRecommendation: boolean;
  requireParentApprovalForNewConcept: boolean;
  enabledProblemConceptIds: string[];
  generationMode: "selected_only" | "review_mix" | "small_challenge";
}
```

## 14. 메타 상태

```ts
interface GameMetaState {
  savedAt: number;
  migrationHistory: number[];
  lastBackupAt: number | null;
}
```

역할:

- 저장 시각
- migration 이력
- 백업 안내 기준

## 15. 저장 타이밍

저장해야 하는 순간:

- 세트 완료 후 보상 정산
- 코인/아이템 구매
- 음식/코스튬 사용
- 알 등록
- 부화 progress 변경
- 부화 완료
- 도감 해금
- 모험 시작/보상 수령
- 설정 변경
- 백업/복원/초기화

문제풀이 중 매 입력마다 전체 GameState를 저장할 필요는 없다.
세트 진행 중 임시 상태는 메모리에서 관리하고, 세트 완료 시 정산 저장을 우선한다.

## 16. Migration 원칙

- 현재 앱이 요구하는 `version`보다 낮으면 migration을 실행한다.
- migration 실패 시 기존 데이터를 백업 키에 보존한다.
- 새 기본 상태로 시작할 수 있게 한다.
- 데이터가 손상되어 JSON 파싱이 안 되면 복구 안내를 표시한다.

자세한 백업/복구 정책은 `save-backup-recovery.md`에서 관리한다.
