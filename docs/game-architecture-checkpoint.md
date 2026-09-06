# Game Architecture Checkpoint

이 문서는 다음 기능을 붙이기 전, 현재 게임 상태 구조와 데이터 흐름을 점검하기 위한 체크포인트다. 디자인 리팩터링은 아직 하지 않고, 상태 트리와 기능 연결을 안정화하는 데 집중한다.

## 현재 구현된 기능 트리

- 온보딩
  - 아이 이름/학년/대표 공룡 이름 입력
  - 입력 완료 후 기본 `GameState` 생성
- 저장/복원
  - `localStorage` key: `abacus-dino-game-state-v1`
  - 저장 payload: `{ version, savedAt, ...gameState }`
  - 파싱 실패 시 기본 상태 fallback, 원본은 corrupted key로 보관
- 훈련장
  - 정답/오답 처리
  - 정답 보상: 코인, 공룡 EXP, 공룡 기분, 알 부화 게이지
  - active dinosaur 표시와 좌우 전환
  - 정답 시 active dinosaur 체력 소모
  - 낮은 체력일 때 안내 메시지 표시
- 우리 공룡
  - 보유 공룡 캐러셀 전환
  - 현재 선택 공룡 상태 표시
  - food 아이템 선택 후 먹이주기
- 놀이터
  - 현재 선택 공룡 상태 표시
  - 쓰다듬기/공 던지기/쉬게 하기 더미 상호작용
- 상점
  - item config 기준 카테고리 표시
  - food 구매 시 코인 차감, inventory 수량 증가
  - costume 구매 시 보유 처리
  - dinosaur/egg 구매는 아직 메시지만 표시
- 알 부화장
  - 현재 단일 egg의 `hatchProgress` 표시
  - 100% 시 부화 가능
  - 미보유 species만 부화 후보로 사용
  - 모든 species 보유 시 부화 차단
- 도감
  - species 데이터 전체 표시
  - `ownedDinosaurs`/`discoveredSpeciesIds` 기준 발견 여부 표시
  - unique `speciesId` 기준 발견 수 계산

## 현재 GameState 구조

현재 런타임 `GameState`는 `src/App.tsx` 안에서 관리된다.

```ts
type GameState = {
  userProfile: UserProfile | null;
  player: { coins: number };
  dinosaur: DinosaurState;
  ownedDinosaurs: OwnedDinosaur[];
  discoveredSpeciesIds: string[];
  egg: EggState;
  inventory: InventoryItemState[];
};
```

### userProfile

- `id`
- `childName`
- `ageOrGrade`
- `createdAt`
- `selectedDinosaurId`
- `dinosaurName`
- `parentModeEnabled?`

현재 `selectedDinosaurId`는 `ownedDinosaurs[].id`를 가리킨다. 이전에는 단일 `dinosaur.id`와 혼동될 수 있었으나, 현재 active dinosaur 선택 기준은 보유 공룡 개체 id다.

### player

현재는 `coins`만 있다.

추후 후보:

- `totalCorrect`
- `selectedDinosaurId` 또는 `activeDinosaurId`
- 일일 루틴/보상 제한 상태

`selectedDinosaurId`를 `userProfile`에 둘지 `player`에 둘지는 아직 설계상 애매하다. 여러 아이 프로필을 지원할 계획이면 `userProfile` 아래가 자연스럽고, 한 플레이 진행 상태로 보면 `player`나 루트 `activeDinosaurId`가 더 명확하다.

### dinosaur

현재 `dinosaur`는 하위 호환용 대표 상태에 가깝다. 실제 성장/상호작용은 `ownedDinosaurs` 안의 선택 공룡에 반영되고, `dinosaur`는 `ownedDinosaurToDinosaurState`로 동기화된다.

위험 지점:

- `dinosaur`와 `ownedDinosaurs`가 둘 다 저장되므로 중복 source of truth가 생긴다.
- 다음 리팩터링 때는 `dinosaur`를 제거하거나 `activeDinosaur` derived value로만 쓰는 방향이 좋다.

### ownedDinosaurs

보유 공룡 개체 목록이다.
성장/EXP/레벨업/체력/행복 정책의 기준은 `docs/dinosaur-growth-system.md`를 따른다.

```ts
interface OwnedDinosaur {
  id: string;
  speciesId: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'special' | 'legendary';
  level: number;
  exp: number;
  mood: number;
  stamina: number;
  obtainedAt: number;
}
```

현재 정책:

- 한 `speciesId`당 1마리만 보유
- 저장 복원/화면 계산에서 중복 `speciesId` 제거
- active dinosaur는 `userProfile.selectedDinosaurId`로 선택

### egg

현재는 단일 current egg 구조다.

```ts
interface EggState {
  id: string;
  name: string;
  rarity: 'normal' | 'rare' | 'special';
  eggType: string;
  hatchProgress: number;
  lastHatchedDinosaurName?: string;
  lastHatchedDinosaurRarity?: OwnedDinosaur['rarity'];
  lastHatchMessage?: string;
}
```

다음 단계에서 바꿔야 할 방향:

```ts
type EggInventoryState = {
  ownedEggs: OwnedEgg[];
  activeEggId: string | null;
};

type OwnedEgg = {
  id: string;
  eggType: string;
  rarity: 'normal' | 'rare' | 'special';
  hatchProgress: number;
  purchasedAt?: number;
};
```

목표 흐름:

상점에서 알 구매 -> 알 부화장에 보유 알 표시 -> 부화시킬 알 선택 -> 훈련 보상으로 active egg의 `hatchProgress` 증가 -> 100% 시 부화

### inventory

현재 구조:

```ts
type InventoryItemState = {
  itemId: string;
  quantity: number;
};
```

현재는 `quantity > 0`이면 보유로 판단한다. food는 소모형 수량, costume은 `quantity: 1`이 보유 상태처럼 쓰인다.

위험 지점:

- costume은 수량보다 `owned: boolean`이 자연스럽다.
- egg는 inventory item으로 둘지 별도 `ownedEggs`로 둘지 결정이 필요하다.
- dinosaur item과 실제 `ownedDinosaurs` 사이 연결이 아직 없다.

### discoveredSpeciesIds

도감 발견 상태를 저장하는 배열이다. 현재 도감은 `discoveredSpeciesIds`와 `ownedDinosaurs.map(speciesId)`를 합쳐 unique set으로 계산한다.

위험 지점:

- 현재 정책은 “보유한 species = 발견한 species”에 가깝다.
- 나중에 도감에서 보기만 한 species, 이벤트 힌트 발견, 임시 발견 같은 개념이 생기면 `discoveredSpeciesIds`와 `ownedDinosaurs`의 의미를 분리해야 한다.

## 현재 item/inventory 구조

아이템 정의는 `src/config/itemConfig.ts`에 있다.

카테고리:

- `food`
- `costume`
- `dinosaur`
- `egg`
- `toy`
- `misc`

### food

food는 `effect`를 가진다.

- `basic-meat`: 체력 +20
- `soft-berry`: 체력 +10
- `leaf-snack`: 체력 +10
- `dino-cookie`: 체력 +30

먹이주기는 선택된 food item id를 기준으로 inventory 수량을 1 줄이고 active dinosaur의 체력을 회복한다. 행복이 높을수록 체력 회복량이 소폭 증가한다.

### costume

costume은 `cosmeticOnly`와 optional `effect`를 가질 수 있다. 현재 구매 시 inventory에 `quantity: 1`로 보유 처리되지만, 장착 구조는 없다.

필요한 다음 구조:

- `equippedCostumeIds` 또는 공룡별 `equipped`
- 공룡별 장착인지 계정 공통 장착인지 결정
- costume 효과가 있을 경우 성장/훈련 계산에 반영할지 결정

### dinosaur / egg

현재 구매 가능한 알은 `category: 'egg'`로 정의하고, 구매/해금 결과는 `inventory`가 아니라 `ownedEggs`에 반영한다. `rare-egg-fragment`는 모험 보상용 공통 재화이며, 서식지별 희귀알을 열 때 필요한 수량만 소비한다.

운영 기준:

- 알은 일반알/특수알/희귀알 3개 카테고리다.
- `ownedEggs`는 카테고리별 1개 슬롯처럼 동작한다.
- 같은 카테고리 알이 이미 있으면 추가 구매/해금하지 않는다.
- 자세한 알/희귀조각 정책은 `docs/adventure-system.md`와 `docs/shop-items.md`를 기준으로 한다.

## 현재 기능 흐름

### 훈련장 정답 -> 보상 -> active dinosaur 성장/소모

1. `useTrainingSession`이 정답을 판정한다.
2. 정답이면 active dinosaur의 체력을 소량 소모한다.
3. 세트 완료 시 `calculateTrainingRewards`가 코인, EXP, 행복, 부화 아이템 보상을 만든다.
4. active dinosaur에 EXP/행복 보상을 적용한다.
5. EXP가 내부 `expToNextLevel`에 도달하면 레벨업하고 남은 EXP는 이월한다.
6. 화면 표시용 EXP는 `exp / expToNextLevel`을 0~100으로 환산해 보여준다.
7. `localStorage` 자동 저장 effect가 변경된 `gameState`를 저장한다.

### 알 부화 -> ownedDinosaurs 추가 -> 도감 발견

1. `egg.hatchProgress >= 100`일 때 부화 가능하다.
2. `dinosaurSpecies` 중 아직 보유하지 않은 species만 후보가 된다.
3. 후보가 있으면 새 `OwnedDinosaur`를 생성한다.
4. `ownedDinosaurs`에 추가한다.
5. `discoveredSpeciesIds`에 speciesId를 추가한다.
6. 부화한 알은 `ownedEggs`에서 제거하고, 같은 카테고리 슬롯은 비운다.
7. 모든 species를 이미 보유했다면 부화를 막고 progress는 유지한다.

### 상점 구매 -> inventory 증가 -> 먹이주기 사용

1. 상점 카드의 item id로 `getItemConfig`를 조회한다.
2. food/costume은 코인이 충분하면 구매 가능하다.
3. food는 inventory quantity가 1 증가한다.
4. costume은 quantity가 1이 된다.
5. 우리 공룡 탭의 사료 가방은 inventory 중 category가 food인 항목만 표시한다.
6. 선택한 food를 먹이면 quantity를 1 줄이고 active dinosaur에 effect를 적용한다.

### 우리 공룡 전환 -> 훈련장/놀이터 연동

1. 좌우 화살표가 `selectAdjacentDinosaur`를 호출한다.
2. `userProfile.selectedDinosaurId`가 다음 `ownedDinosaurs[].id`로 바뀐다.
3. `dinosaur` 대표 상태도 선택 공룡으로 동기화한다.
4. 훈련장, 우리 공룡, 놀이터는 같은 active dinosaur를 표시한다.
5. localStorage 저장/복원 후에도 마지막 선택 공룡이 유지된다.

## 구조적으로 위험한 지점

1. legacy `egg` 구조
   - 런타임 기준 source of truth는 `ownedEggs + activeEggId`다.
   - legacy `egg`는 저장 데이터 호환과 현재 active egg 표시 fallback 용도로만 유지한다.

2. `dinosaur`와 `ownedDinosaurs` 중복 저장
   - 실제 source of truth는 `ownedDinosaurs`가 되어가고 있다.
   - `dinosaur`는 derived state로 이동하거나 제거하는 것이 좋다.

3. `selectedDinosaurId` 위치
   - 현재는 `userProfile.selectedDinosaurId`에 있다.
   - 장기적으로 `player.activeDinosaurId` 또는 루트 `activeDinosaurId`가 더 명확할 수 있다.

4. costume 장착 구조 부재
   - 구매/보유는 가능하지만 장착 대상과 저장 위치가 없다.
   - 공룡별 장착인지 계정 공통 장착인지 먼저 정해야 한다.

5. 도감 발견 상태 의미
   - 현재는 보유 공룡 기반 발견과 `discoveredSpeciesIds` 저장이 섞여 있다.
   - “발견했지만 보유하지 않음” 같은 상태가 필요하면 명시적 dex state가 필요하다.

6. localStorage migration
   - version 불일치 시 기본 상태로 fallback한다.
   - 저장 데이터에 새 성장 필드나 `ownedEggs`가 없어도 `normalizeGameState`에서 기본값을 채운다.

7. App.tsx 비대화
   - 상태 helper, 화면 컴포넌트, 비즈니스 로직이 한 파일에 모여 있다.
   - 기능 추가가 더 이어지기 전에 domain helper와 view component 분리를 계획해야 한다.

## 다음 구현 순서 추천

1. 구조 체크 완료
   - 현재 문서를 기준으로 다음 상태 변경 방향 합의

2. egg item 구매 / ownedEggs / activeEgg 구조
   - 구매 가능한 egg item을 `category: 'egg'`로 정리
   - `GameState`에 `ownedEggs`, `activeEggId` 추가
   - 기존 `egg`는 migration으로 첫 active egg로 변환

3. 코스튬 구매 / 보유
   - costume 보유 상태를 `quantity`로 계속 갈지 `owned`로 바꿀지 결정
   - 중복 구매 정책 확정

4. 코스튬 장착
   - 공룡별 장착 구조 추천: `ownedDinosaurs[].equippedCostumeIds`
   - 장착 UI는 우리 공룡 탭에서 시작

5. 디자인 목업 재정리
   - 기능 흐름이 안정된 뒤 훈련장/우리 공룡/상점/도감 레이아웃 정리
   - 지금은 디자인 리팩터링을 하지 않는다.

6. 컴포넌트 분리 / UI 리팩터링
   - `TrainingView`, `DinoViewPanel`, `HatcheryView`, `ShopView`, `PokedexView` 파일 분리
   - game state helper를 `src/utils` 또는 `src/state`로 분리
   - 저장 migration을 `gameStorage` 근처로 이동

## 구현 전 주의할 점

- 훈련장 채점/Bluetooth 입력 로직은 안정화된 영역이므로 건드리지 않는다.
- Bluetooth Test 패널은 별도 검증 도구로 유지한다.
- 다음 기능을 붙일 때 디자인 전면 수정은 피한다.
- `hunger`는 deprecated 호환 필드이며 주요 UI/로직에서는 사용하지 않는다.
- 새 보상/소모 숫자는 config로 분리한다.
- 저장 구조 변경 시 `GAME_STORAGE_VERSION`과 migration 전략을 먼저 정한다.
