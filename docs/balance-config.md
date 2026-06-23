# 밸런스 Config 설계 초안

이 문서는 보상 계산 더미와 실제 게임 로직을 구현하기 전에, 운영 중 자주 조정될 가능성이 높은 밸런스 값을 코드 로직에서 분리하기 위한 config/data 구조를 정리한다.

이번 단계의 목적은 구현이 아니라, 어떤 값이 config로 빠져야 하는지와 이후 TypeScript 파일을 어떻게 나눌지 합의하는 것이다.

참고 문서:

- `docs/data-model.md`
- `docs/game-rule.md`
- `docs/game-settings.md`
- `docs/problem-difficulty.md`
- `docs/difficulty-progression.md`
- `docs/shop-items.md`
- `docs/parent-controls.md`
- `docs/daily-routine.md`

## 1. 설계 원칙

- 운영 중 조정될 수 있는 수치는 화면 컴포넌트, 문제 생성 함수, 보상 정산 함수 안에 하드코딩하지 않는다.
- 플레이어별 저장 상태와 전역 밸런스 config를 분리한다.
- 세트 시작 시점에는 적용된 config 값을 스냅샷으로 남겨, 이후 config가 바뀌어도 이미 진행 중인 세트의 정산이 흔들리지 않게 한다.
- 부모 설정은 config의 범위 안에서 선택하는 사용자 설정으로 둔다. 부모 설정이 전역 config를 직접 수정하지는 않는다.
- 초기에는 TypeScript 상수 파일로 시작하고, 운영 도구가 필요해지면 JSON 또는 원격 config로 옮길 수 있게 한다.
- config 값에는 `version`을 두어 저장 데이터, 세션 결과, 리포트가 어떤 밸런스 기준으로 계산되었는지 추적할 수 있게 한다.

## 2. Config 파일 분리 제안

초기 구현에서는 아래처럼 `src/config` 또는 `src/data/config` 아래에 파일을 나누는 방식을 제안한다.

```text
src/config/difficultyConfig.ts
src/config/rewardConfig.ts
src/config/economyConfig.ts
src/config/eggConfig.ts
src/config/growthConfig.ts
src/config/shopConfig.ts
src/config/fatigueConfig.ts
src/config/uxTimingConfig.ts
src/config/index.ts
```

파일 역할:

| 파일 | 역할 |
| --- | --- |
| `difficultyConfig.ts` | 문제 난이도, 출제 유형, 세트 길이, 자동 난이도 조정 기준 |
| `rewardConfig.ts` | 정답 보상, 콤보 보너스, 세트 완료 보너스, 난이도 배율, 재시도 보상 |
| `economyConfig.ts` | 일일 코인 소프트캡, 소프트캡 이후 배율, 재화 표시/정산 정책 |
| `eggConfig.ts` | 부화 게이지 획득량, 알 등급별 필요 게이지, 하루 진행 제한 |
| `growthConfig.ts` | EXP 획득량, 레벨별 필요 EXP, 먹이 효과, 상태 변화량 |
| `shopConfig.ts` | 아이템 가격, 효과, 레벨 제한, 카테고리, 판매 여부 |
| `fatigueConfig.ts` | 하루 권장 세트 수, 연속 훈련 후 휴식 안내, 부모 조정 범위 |
| `uxTimingConfig.ts` | 정답/보상/다음 문제 딜레이, 오답 피드백 문구 |
| `index.ts` | config export와 현재 config version 묶음 |

`shopConfig.ts`는 아이템 수가 많아지면 `shop/items.ts`, `shop/categories.ts`, `shop/effects.ts`처럼 다시 나눌 수 있다.

## 3. Difficulty Config

문제 생성 로직은 난이도 조건을 직접 들고 있지 않고, `difficultyConfig`에서 선택된 stage 또는 concept 정의를 읽어 문제를 생성한다.

조정 대상:

- 자릿수
- 한 문제의 항 개수
- 덧셈/뺄셈 비율
- 받아올림/받아내림 허용 여부
- 5의 보수 / 10의 보수 포함 여부
- 문제 세트 수
- 연속 정답 시 난이도 상승 기준
- 오답 시 복습 또는 난이도 유지 기준

타입 초안:

```ts
interface DifficultyConfig {
  version: string;
  defaultProfileId: string;
  profiles: DifficultyProfile[];
  progression: DifficultyProgressionRule;
}

interface DifficultyProfile {
  id: string;
  label: string;
  digitMode: "one_digit" | "two_digit" | "mixed";
  numberCount: number;
  problemCount: number;
  operationRatio: {
    addition: number;
    subtraction: number;
  };
  allowCarry: boolean;
  allowBorrow: boolean;
  includeFiveComplement: boolean;
  includeTenComplement: boolean;
  enabledConceptIds: string[];
}

interface DifficultyProgressionRule {
  autoIncreaseEnabledDefault: boolean;
  increaseAfterCorrectStreak: number;
  increaseAfterRecentAccuracy: number;
  recentSetWindow: number;
  maintainAfterWrongCount: number;
  reviewAfterWrongStreak: number;
}
```

예시 방향:

```ts
const difficultyConfig = {
  version: "2026-06-23.1",
  defaultProfileId: "single_digit_add_review",
  profiles: [
    {
      id: "single_digit_add_review",
      label: "1자리 덧셈 복습",
      digitMode: "one_digit",
      numberCount: 3,
      problemCount: 20,
      operationRatio: { addition: 1, subtraction: 0 },
      allowCarry: false,
      allowBorrow: false,
      includeFiveComplement: false,
      includeTenComplement: false,
      enabledConceptIds: ["single_digit_add_basic"]
    }
  ],
  progression: {
    autoIncreaseEnabledDefault: false,
    increaseAfterCorrectStreak: 10,
    increaseAfterRecentAccuracy: 0.9,
    recentSetWindow: 5,
    maintainAfterWrongCount: 2,
    reviewAfterWrongStreak: 3
  }
};
```

## 4. Reward Config

보상 계산 함수는 `TrainingResult`와 `rewardConfig`를 입력받아 `Reward[]`를 만든다.

조정 대상:

- 정답 1개당 코인
- 콤보 보너스
- 세트 완료 보너스
- 난이도별 보상 배율
- 오답 후 재시도 정답 보상 배율
- 정확도/속도 등급별 보너스

타입 초안:

```ts
interface RewardConfig {
  version: string;
  coinPerCorrect: number;
  retryCorrectMultiplier: number;
  setCompleteBonusByProblemCount: Record<number, number>;
  comboBonuses: ComboBonusRule[];
  difficultyMultipliers: Record<string, number>;
  accuracyBonuses: Record<AccuracyGrade, number>;
  speedBonuses: Record<SpeedGrade, SpeedBonusRule>;
}

interface ComboBonusRule {
  streak: number;
  coins: number;
}

interface SpeedBonusRule {
  coins: number;
  minAccuracyGrade: AccuracyGrade | null;
}
```

초기 기준은 `docs/game-rule.md`의 20문제 보상표를 옮겨오되, 실제 수치는 `rewardConfig`에서만 수정한다.

## 5. Economy Config

코인 제한은 보상 계산과 별도로 적용한다.
즉, `rewardConfig`가 기본 획득량을 계산하고, `economyConfig`가 오늘 이미 획득한 코인을 기준으로 소프트캡 배율을 적용한다.

조정 대상:

- 일일 코인 소프트캡
- 소프트캡 이후 보상 배율
- 하드캡 사용 여부
- 일일 코인 계산 기준 시간대

타입 초안:

```ts
interface EconomyConfig {
  version: string;
  dailyCoinSoftCap: number;
  afterSoftCapRewardMultiplier: number;
  hardCap: null;
  dailyResetTimezone: string;
}
```

초기 정책:

- 하드캡은 두지 않는다.
- 소프트캡 이후에도 보상은 0이 되지 않게 한다.
- 결과 화면에는 기본 획득량과 소프트캡 조정이 섞여 보이지 않도록, 필요할 때만 부드럽게 안내한다.

## 6. Egg Config

부화 진행은 학습 완료 보상과 연결되지만, 코인 보상과 별도 config에서 관리한다.

조정 대상:

- 정답당 부화 게이지
- 세트 완료 부화 보너스
- 일반/희귀 알 요구 게이지
- 하루 부화 진행 제한 가능성
- 부화 보조 아이템 배율 적용 방식

타입 초안:

```ts
interface EggConfig {
  version: string;
  hatchProgressPerCorrect: number;
  setCompleteHatchBonusByProblemCount: Record<number, number>;
  requiredProgressByEggCategory: Record<EggCategory, number>;
  dailyHatchProgressSoftCap: number | null;
  afterDailySoftCapMultiplier: number;
}
```

알 인스턴스의 `requiredProgress`는 생성 시점의 `eggConfig` 값을 복사해 저장한다.
나중에 config가 바뀌어도 이미 가진 알의 필요 게이지를 자동 변경할지 여부는 migration 정책으로 따로 결정한다.

## 7. Growth Config

공룡 성장은 학습 보상과 상점 아이템 효과가 만나는 영역이다.
EXP와 상태 변화량은 공룡 인스턴스에 직접 하드코딩하지 않고 `growthConfig`와 `shopConfig`의 item effect를 통해 적용한다.

조정 대상:

- 정답당 EXP
- 세트 완료 EXP
- 레벨별 필요 EXP
- 먹이 효과
- 행복/배고픔/체력 변화량
- 상태값 최소/최대

타입 초안:

```ts
interface GrowthConfig {
  version: string;
  expPerCorrect: number;
  setCompleteExpByProblemCount: Record<number, number>;
  expToNextLevel: number[];
  statBounds: {
    hunger: StatBound;
    happiness: StatBound;
    stamina: StatBound;
  };
  passiveStatChangePerDay: {
    hunger: number;
    happiness: number;
    stamina: number;
  };
}

interface StatBound {
  min: number;
  max: number;
}
```

먹이별 효과 수치는 `shopConfig`의 아이템 effect에 둔다.
레벨 곡선과 기본 성장 규칙은 `growthConfig`에 둔다.

## 8. Shop Config

상점은 나중에 아이템을 쉽게 추가/수정할 수 있도록 정적 데이터 중심으로 구성한다.
상점 화면은 이 config를 읽어 카테고리별로 표시하고, 구매 로직은 `priceCoins`, `levelRequirement`, `effects`를 기준으로 처리한다.

조정 대상:

- 아이템 가격
- 아이템 효과
- 레벨 제한
- 판매 여부
- 카테고리: 음식 / 코스튬 / 새로운 공룡
- 정렬 순서
- 일일 구매 제한

타입 초안:

```ts
interface ShopConfig {
  version: string;
  categories: ShopCategoryConfig[];
  items: ShopItemConfig[];
}

interface ShopCategoryConfig {
  id: "food" | "costume" | "new_dinosaur" | "hatch_boost" | "toy";
  label: string;
  sortOrder: number;
  visible: boolean;
}

interface ShopItemConfig {
  id: string;
  categoryId: ShopCategoryConfig["id"];
  name: string;
  description: string;
  priceCoins: number;
  levelRequirement: number | null;
  available: boolean;
  purchaseLimitPerDay: number | null;
  sortOrder: number;
  effects: ItemEffectConfig[];
  assetKey?: string;
}

interface ItemEffectConfig {
  type:
    | "grant_item"
    | "grant_egg"
    | "grant_egg_fragment"
    | "dinosaur_exp"
    | "dinosaur_stat"
    | "hatch_progress_multiplier"
    | "unlock_cosmetic";
  targetId: string | null;
  amount: number;
  durationSetCount?: number;
}
```

새로운 공룡 카테고리는 `공룡 즉시 구매`보다 `알`, `알 조각`, `해금 조건` 중심으로 설계한다.

## 9. Fatigue Config

학습량과 피로도는 보상량을 줄이는 패널티보다, 휴식 안내와 부모 설정을 위한 기준으로 둔다.

조정 대상:

- 하루 권장 세트 수
- 연속 훈련 후 휴식 안내 기준
- 부모 설정으로 조정 가능한 최소/최대 범위
- 휴식 안내 문구

타입 초안:

```ts
interface FatigueConfig {
  version: string;
  recommendedSetsPerDayDefault: number;
  recommendedSetsPerDayRange: {
    min: number;
    max: number;
  };
  restPromptAfterContinuousSets: number;
  restPromptCooldownMinutes: number;
}
```

부모 설정에는 `recommendedSetsPerDay` 같은 값만 저장하고, 허용 범위와 기본값은 `fatigueConfig`에서 관리한다.

## 10. UX Timing Config

피드백과 자동 진행 딜레이는 작은 값처럼 보이지만, 실제 플레이 감각에 큰 영향을 준다.
따라서 컴포넌트 내부 timeout 값으로 박아두지 않는다.

조정 대상:

- 정답 피드백 표시 시간
- 보상 표시 시간
- 다음 문제 자동 이동 딜레이
- 오답 피드백 문구
- 콤보/세트 완료 연출 시간

타입 초안:

```ts
interface UxTimingConfig {
  version: string;
  correctFeedbackMs: number;
  rewardToastMs: number;
  autoNextProblemDelayMs: number;
  setCompleteSummaryMinMs: number;
  wrongAnswerMessages: string[];
  retryCorrectMessages: string[];
}
```

오답 문구는 아이가 실패로 느끼지 않도록 짧고 부드러운 표현을 기본으로 둔다.

예시:

```ts
wrongAnswerMessages: [
  "다시 한번 해볼까요?",
  "천천히 맞춰봐요.",
  "괜찮아요. 같은 문제로 다시 가요."
]
```

## 11. SaveData와의 경계

config는 전역 기준이고, `SaveData`는 플레이어별 상태다.

`SaveData`에 저장할 값:

- 현재 보유 코인
- 오늘 획득한 코인
- 공룡 레벨과 EXP
- 알 현재 진행도와 필요 진행도
- 인벤토리 수량
- 부모가 선택한 설정값
- 최근 학습 결과
- 세트 시작 당시 config version

`SaveData`에 저장하지 않을 값:

- 정답 1개당 코인 기본값
- 콤보 보너스 테이블
- 레벨별 필요 EXP 전체 테이블
- 상점 전체 상품 목록
- UX 딜레이 기본값

예외:

- 이미 생성된 알의 `requiredProgress`처럼, 생성 당시 기준이 플레이 경험에 직접 영향을 주는 값은 인스턴스에 복사해 저장할 수 있다.
- 이미 구매한 아이템의 수량은 저장하지만, 아이템 정의 자체는 `shopConfig`에서 읽는다.

## 12. 구현 순서 제안

1. `difficultyConfig`, `rewardConfig`, `economyConfig`부터 만든다.
2. 문제 생성 함수가 `TrainingSettingsSnapshot`과 `difficultyConfig`를 함께 사용하게 한다.
3. 보상 계산 더미가 `TrainingResult`, `rewardConfig`, `economyConfig`를 입력받게 한다.
4. 세트 완료 정산에 `eggConfig`, `growthConfig`를 연결한다.
5. 상점 화면을 붙일 때 `shopConfig`를 정적 상품 데이터의 단일 출처로 사용한다.
6. 부모 설정 화면에서 `fatigueConfig`의 기본값과 허용 범위를 읽게 한다.
7. 훈련장 피드백 timeout과 문구를 `uxTimingConfig`로 옮긴다.

첫 구현에서는 config 파일을 작게 시작해도 된다.
중요한 점은 숫자와 테이블을 로직 안에 직접 넣지 않고, 계산 함수의 입력으로 넘기는 구조를 처음부터 유지하는 것이다.
