import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Baby,
  Bluetooth,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  Egg,
  Map,
  Play,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react';
import { BluetoothTestPanel, type BluetoothNotificationPayload } from './components/BluetoothTestPanel';
import { DexScreen, DinosaurRoomScreen, HatcheryScreen, PlaygroundScreen, SettingsScreen, ShopScreen, TrainingScreen } from './components/screens';
import type { HatchResult } from './components/screens/HatcheryScreen';
import { fallbackFoodEffect, getEggItemConfig, getFoodItemConfig, getHatchItemConfig, getItemConfig, type DinosaurStatEffect } from './config/itemConfig';
import { trainingFatigueConfig } from './config/trainingFatigueConfig';
import { abacusLevels, getAbacusLevel, getDefaultStageIdForLevel, getLevelForStageId, getStagesForLevel } from './data/abacusLevels';
import { abacusStages, getGeneratorFallbackStage, getStageById } from './data/abacusStages';
import { dinosaurSpecies } from './data/dinosaurSpecies';
import { useTrainingSession } from './hooks/useTrainingSession';
import type { AbacusLevelConfig, AbacusStageConfig, DinosaurState, EggState, EquippedCostumes, LevelProgressRecord, NextTrainingRecommendation, OperationMode, OwnedDinosaur, OwnedEgg, Reward, StageProgressRecord, SubmissionResult, TrainingProblem, TrainingProgressEvaluation, TrainingSession, TrainingSessionRecord, UserProfile } from './types/game';
import { generateTrainingProblems } from './utils/generateTrainingProblems';
import { evaluateLevelProgress, evaluateStageProgress, getNextTrainingRecommendation } from './utils/evaluateTrainingProgress';
import { clearGameState, loadGameState, saveGameState } from './utils/gameStorage';
import { calculateTrainingRewards, type TrainingRewardResult } from './utils/trainingRewards';

type MainTab = 'training' | 'dino' | 'hatchery' | 'shop' | 'pokedex' | 'adventure' | 'settings';
type DinoView = 'care' | 'playground';
type DinosaurInteractionChange = Partial<Pick<DinosaurState, 'exp' | 'mood' | 'hunger' | 'stamina'>>;
type InventoryItemState = { itemId: string; quantity: number };
type ProblemCountOverride = 5 | 10 | 15 | 20;
type NumberCountOverride = 'stage-default' | 3 | 4 | 5 | 6;
type DigitTypeOverride = 'stage-default' | 'one-digit' | 'two-digit' | 'mixed-digit';
type ResolvedDigitType = Exclude<DigitTypeOverride, 'stage-default'>;
type OperationsOverride = 'stage-default' | 'add' | 'subtract' | 'mixed';
type CompletedTrainingSummary = TrainingRewardResult & {
  sessionId: string;
  totalProblems: number;
  correctCount: number;
  wrongCount: number;
  completedAt: number;
};
type GameState = {
  userProfile: UserProfile | null;
  player: { coins: number };
  selectedLevel: number;
  selectedStageId: string;
  problemCountOverride?: ProblemCountOverride;
  numberCountOverride: NumberCountOverride;
  digitTypeOverride: DigitTypeOverride;
  operationsOverride: OperationsOverride;
  dinosaur: DinosaurState;
  ownedDinosaurs: OwnedDinosaur[];
  discoveredSpeciesIds: string[];
  egg: EggState;
  ownedEggs: OwnedEgg[];
  activeEggId: string | null;
  ownedCostumeIds: string[];
  inventory: InventoryItemState[];
  trainingHistory: TrainingSessionRecord[];
  progressByLevel: Record<number, LevelProgressRecord>;
  progressByStage: Record<string, StageProgressRecord>;
};

const mainTabs: Array<{ id: MainTab; label: string; icon: typeof Play; color: string; active: string }> = [
  { id: 'training', label: '훈련장', icon: Play, color: 'text-cyan-700', active: 'from-cyan-300 to-sky-300 border-cyan-200' },
  { id: 'dino', label: '우리 공룡', icon: Baby, color: 'text-amber-700', active: 'from-amber-300 to-orange-300 border-amber-200' },
  { id: 'hatchery', label: '알 부화장', icon: Egg, color: 'text-orange-700', active: 'from-orange-300 to-yellow-300 border-orange-200' },
  { id: 'shop', label: '상점', icon: ShoppingBag, color: 'text-violet-700', active: 'from-violet-300 to-fuchsia-300 border-violet-200' },
  { id: 'pokedex', label: '도감', icon: BookOpen, color: 'text-sky-700', active: 'from-sky-300 to-blue-300 border-sky-200' },
  { id: 'adventure', label: '모험', icon: Map, color: 'text-emerald-700', active: 'from-emerald-300 to-lime-300 border-emerald-200' },
  { id: 'settings', label: '설정', icon: Settings, color: 'text-slate-700', active: 'from-slate-200 to-slate-300 border-slate-200' },
];

const mapCards = [
  { name: '숲길 산책', state: '준비 중', reward: '알 조각 후보' },
  { name: '반짝 강가', state: '훈련 1세트 후 입장', reward: '코인 보너스' },
  { name: '구름 언덕', state: '추후 공개', reward: '희귀 단서' },
];

const defaultSelectedLevel = 1;
const defaultSelectedStageId = getDefaultStageIdForLevel(defaultSelectedLevel) ?? 'L1-DRAFT-01';

const initialDinosaurState: DinosaurState = {
  id: 'dino-green-little',
  name: '초록 꼬마',
  level: 3,
  exp: 44,
  mood: 74,
  hunger: 68,
  stamina: 81,
};

const initialEggState: EggState = {
  id: 'egg-normal-mystery',
  name: '미확인 일반 알',
  rarity: 'normal',
  eggType: 'starter-normal',
  hatchProgress: 62,
};

const initialOwnedEgg: OwnedEgg = {
  id: 'owned-egg-starter-normal',
  eggItemId: 'green-starter-egg',
  name: '초록 알',
  rarity: initialEggState.rarity,
  eggType: initialEggState.eggType,
  hatchProgress: initialEggState.hatchProgress,
  createdAt: 0,
};

const initialOwnedDinosaur: OwnedDinosaur = {
  id: 'owned-dino-green-little',
  speciesId: 'green-little',
  name: initialDinosaurState.name,
  rarity: 'common',
  level: initialDinosaurState.level,
  exp: initialDinosaurState.exp,
  mood: initialDinosaurState.mood,
  hunger: initialDinosaurState.hunger,
  stamina: initialDinosaurState.stamina,
  obtainedAt: 0,
};

const initialInventory: InventoryItemState[] = [
  { itemId: 'soft-berry', quantity: 3 },
  { itemId: 'leaf-snack', quantity: 5 },
  { itemId: 'dino-cookie', quantity: 1 },
  { itemId: 'small-hat', quantity: 0 },
  { itemId: 'green-starter-egg', quantity: 0 },
];

const hatchableDinosaurPool = dinosaurSpecies;
const maxTrainingHistoryRecords = 30;

const defaultGameState: GameState = {
  userProfile: null,
  player: { coins: 1240 },
  selectedLevel: defaultSelectedLevel,
  selectedStageId: defaultSelectedStageId,
  problemCountOverride: undefined,
  numberCountOverride: 'stage-default',
  digitTypeOverride: 'stage-default',
  operationsOverride: 'stage-default',
  dinosaur: initialDinosaurState,
  ownedDinosaurs: [initialOwnedDinosaur],
  discoveredSpeciesIds: [initialOwnedDinosaur.speciesId],
  egg: initialEggState,
  ownedEggs: [initialOwnedEgg],
  activeEggId: initialOwnedEgg.id,
  ownedCostumeIds: [],
  inventory: initialInventory,
  trainingHistory: [],
  progressByLevel: {},
  progressByStage: {},
};

function normalizeGameState(state: Partial<GameState>): GameState {
  const ownedDinosaurs = getUniqueOwnedDinosaurs(state.ownedDinosaurs ?? defaultGameState.ownedDinosaurs);
  const discoveredSpeciesIds = getUniqueSpeciesIds([...(state.discoveredSpeciesIds ?? defaultGameState.discoveredSpeciesIds), ...ownedDinosaurs.map((dinosaur) => dinosaur.speciesId)]);
  const selectedDinosaur = getSelectedOwnedDinosaur(ownedDinosaurs, state.userProfile?.selectedDinosaurId);
  const selectedLevel = getAbacusLevel(state.selectedLevel ?? defaultSelectedLevel)?.level ?? defaultSelectedLevel;
  const selectedLevelStages = getStagesForLevel(selectedLevel);
  const selectedStageId =
    state.selectedStageId && selectedLevelStages.some((stage) => stage.id === state.selectedStageId)
      ? state.selectedStageId
      : getDefaultStageIdForLevel(selectedLevel) ?? defaultSelectedStageId;
  const problemCountOverride = normalizeProblemCountOverride(state.problemCountOverride);
  const numberCountOverride = normalizeNumberCountOverride(state.numberCountOverride);
  const digitTypeOverride = normalizeDigitTypeOverride(state.digitTypeOverride);
  const operationsOverride = normalizeOperationsOverride(state.operationsOverride);
  const trainingHistory = normalizeTrainingHistory(state.trainingHistory);
  const progressByLevel = normalizeProgressByLevel(state.progressByLevel);
  const progressByStage = normalizeProgressByStage(state.progressByStage);
  const ownedEggs = normalizeOwnedEggs(state.ownedEggs, state.egg);
  const activeEgg = getSelectedOwnedEgg(ownedEggs, state.activeEggId);
  const activeEggId = activeEgg?.id ?? null;
  const ownedCostumeIds = getUniqueSpeciesIds([...(state.ownedCostumeIds ?? []), ...getOwnedCostumeIdsFromInventory(state.inventory ?? defaultGameState.inventory)]);
  const userProfile = state.userProfile
    ? {
        ...state.userProfile,
        selectedDinosaurId: selectedDinosaur?.id ?? state.userProfile.selectedDinosaurId,
        dinosaurName: selectedDinosaur?.name ?? state.userProfile.dinosaurName,
      }
    : null;

  return {
    ...defaultGameState,
    ...state,
    player: {
      ...defaultGameState.player,
      ...state.player,
    },
    selectedLevel,
    selectedStageId,
    problemCountOverride,
    numberCountOverride,
    digitTypeOverride,
    operationsOverride,
    dinosaur: {
      ...defaultGameState.dinosaur,
      ...state.dinosaur,
      ...(selectedDinosaur ? ownedDinosaurToDinosaurState(selectedDinosaur) : {}),
    },
    ownedDinosaurs,
    discoveredSpeciesIds,
    egg: {
      ...defaultGameState.egg,
      ...(activeEggToEggState(activeEgg) ?? {}),
      ...(!activeEgg ? state.egg : {}),
      lastHatchedDinosaurName: state.egg?.lastHatchedDinosaurName,
      lastHatchedDinosaurRarity: state.egg?.lastHatchedDinosaurRarity,
      lastHatchMessage: state.egg?.lastHatchMessage,
      hatchProgress: activeEgg ? activeEgg.hatchProgress : clampPercent(state.egg?.hatchProgress ?? defaultGameState.egg.hatchProgress),
    },
    ownedEggs,
    activeEggId,
    ownedCostumeIds,
    inventory: state.inventory ?? defaultGameState.inventory,
    trainingHistory,
    progressByLevel,
    progressByStage,
    userProfile,
  };
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getUniqueSpeciesIds(speciesIds: string[]) {
  return Array.from(new Set(speciesIds));
}

function getUniqueOwnedDinosaurs(ownedDinosaurs: OwnedDinosaur[]) {
  const seenSpeciesIds = new Set<string>();

  return ownedDinosaurs
    .filter((dinosaur) => {
      if (seenSpeciesIds.has(dinosaur.speciesId)) return false;

      seenSpeciesIds.add(dinosaur.speciesId);
      return true;
    })
    .map((dinosaur) => ({
      ...dinosaur,
      equippedCostumes: dinosaur.equippedCostumes ?? {},
    }));
}

function getAvailableHatchSpecies(ownedDinosaurs: OwnedDinosaur[]) {
  const ownedSpeciesIds = new Set(getUniqueOwnedDinosaurs(ownedDinosaurs).map((dinosaur) => dinosaur.speciesId));
  return hatchableDinosaurPool.filter((species) => !ownedSpeciesIds.has(species.speciesId));
}

function normalizeOwnedEggs(ownedEggs?: OwnedEgg[], legacyEgg?: EggState) {
  const sourceEggs =
    ownedEggs !== undefined
      ? ownedEggs
      : legacyEgg
        ? [
            {
              id: legacyEgg.id,
              eggItemId: legacyEgg.eggType === 'rare-spark' ? 'rare-spark-egg' : 'green-starter-egg',
              name: legacyEgg.name,
              rarity: legacyEgg.rarity,
              eggType: legacyEgg.eggType,
              hatchProgress: legacyEgg.hatchProgress,
              createdAt: 0,
            },
          ]
        : defaultGameState.ownedEggs;

  return sourceEggs.map((egg) => ({
    ...egg,
    hatchProgress: clampPercent(egg.hatchProgress),
  }));
}

function getSelectedOwnedEgg(ownedEggs: OwnedEgg[], activeEggId?: string | null) {
  return ownedEggs.find((egg) => egg.id === activeEggId) ?? ownedEggs[0] ?? null;
}

function activeEggToEggState(egg: OwnedEgg | null): EggState | null {
  if (!egg) return null;

  return {
    id: egg.id,
    name: egg.name,
    rarity: egg.rarity,
    eggType: egg.eggType,
    hatchProgress: egg.hatchProgress,
  };
}

function normalizeProblemCountOverride(value: unknown): ProblemCountOverride | undefined {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return numericValue === 5 || numericValue === 10 || numericValue === 15 || numericValue === 20 ? numericValue : undefined;
}

function normalizeNumberCountOverride(value: unknown): NumberCountOverride {
  if (value === 'stage-default') return value;

  const numericValue = typeof value === 'string' ? Number(value) : value;
  return numericValue === 3 || numericValue === 4 || numericValue === 5 || numericValue === 6 ? numericValue : 'stage-default';
}

function normalizeDigitTypeOverride(value: unknown): DigitTypeOverride {
  return value === 'stage-default' || value === 'one-digit' || value === 'two-digit' || value === 'mixed-digit' ? value : 'stage-default';
}

function normalizeOperationsOverride(value: unknown): OperationsOverride {
  return value === 'stage-default' || value === 'add' || value === 'subtract' || value === 'mixed' ? value : 'stage-default';
}

function normalizeTrainingHistory(value: unknown): TrainingSessionRecord[] {
  return Array.isArray(value) ? (value.filter((item) => item && typeof item === 'object') as TrainingSessionRecord[]).slice(0, maxTrainingHistoryRecords) : [];
}

function normalizeProgressByLevel(value: unknown): Record<number, LevelProgressRecord> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<number, LevelProgressRecord>) : {};
}

function normalizeProgressByStage(value: unknown): Record<string, StageProgressRecord> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, StageProgressRecord>) : {};
}

function createOwnedEggFromItem(itemId: string, createdAt = Date.now()): OwnedEgg | null {
  const item = getEggItemConfig(itemId);
  if (!item) return null;

  return {
    id: `owned-egg-${item.id}-${createdAt}`,
    eggItemId: item.id,
    name: item.name,
    rarity: item.rarity,
    eggType: item.eggType,
    hatchProgress: 0,
    createdAt,
  };
}

function addInventoryQuantity(inventory: InventoryItemState[], itemId: string, quantity: number) {
  const existingItem = inventory.find((item) => item.itemId === itemId);
  if (!existingItem) return [...inventory, { itemId, quantity }];

  return inventory.map((item) => (item.itemId === itemId ? { ...item, quantity: item.quantity + quantity } : item));
}

function createDisplayReward(label: string, amount = 0): Reward {
  return {
    id: `display-reward-${Date.now()}-${label}`,
    reason: 'set_complete',
    type: 'coin',
    amount,
    targetId: null,
    label,
    grantedAt: Date.now(),
  };
}

function updateProgressByLevel(progressByLevel: Record<number, LevelProgressRecord>, record: TrainingSessionRecord) {
  const current = progressByLevel[record.selectedLevel] ?? {
    totalSessions: 0,
    totalProblems: 0,
    totalCorrect: 0,
    totalWrong: 0,
    bestAccuracy: 0,
    lastAccuracy: 0,
    completedStageIds: [],
  };

  return {
    ...progressByLevel,
    [record.selectedLevel]: {
      totalSessions: current.totalSessions + 1,
      totalProblems: current.totalProblems + record.totalProblems,
      totalCorrect: current.totalCorrect + record.correctCount,
      totalWrong: current.totalWrong + record.wrongCount,
      bestAccuracy: Math.max(current.bestAccuracy, record.accuracy),
      lastAccuracy: record.accuracy,
      lastTrainedAt: record.completedAt,
      completedStageIds: Array.from(new Set([...current.completedStageIds, record.selectedStageId])),
    },
  };
}

function updateProgressByStage(progressByStage: Record<string, StageProgressRecord>, record: TrainingSessionRecord) {
  const current = progressByStage[record.selectedStageId] ?? {
    totalSessions: 0,
    totalProblems: 0,
    totalCorrect: 0,
    totalWrong: 0,
    bestAccuracy: 0,
    lastAccuracy: 0,
  };

  return {
    ...progressByStage,
    [record.selectedStageId]: {
      totalSessions: current.totalSessions + 1,
      totalProblems: current.totalProblems + record.totalProblems,
      totalCorrect: current.totalCorrect + record.correctCount,
      totalWrong: current.totalWrong + record.wrongCount,
      bestAccuracy: Math.max(current.bestAccuracy, record.accuracy),
      lastAccuracy: record.accuracy,
      lastTrainedAt: record.completedAt,
    },
  };
}

function addTrainingRecordToHistory(trainingHistory: TrainingSessionRecord[], record: TrainingSessionRecord) {
  if (trainingHistory.some((item) => item.id === record.id)) return trainingHistory;
  return [record, ...trainingHistory].slice(0, maxTrainingHistoryRecords);
}

function getOwnedCostumeIdsFromInventory(inventory: InventoryItemState[]) {
  return inventory.filter((item) => item.quantity > 0 && getItemConfig(item.itemId)?.category === 'costume').map((item) => item.itemId);
}

function getCostumeName(itemId?: string) {
  if (!itemId) return null;

  const item = getItemConfig(itemId);
  return item?.category === 'costume' ? item.name : null;
}

function formatEquippedCostumes(equippedCostumes?: EquippedCostumes) {
  const names = Object.values(equippedCostumes ?? {})
    .map((itemId) => getCostumeName(itemId))
    .filter(Boolean);

  return names.length > 0 ? names.join(', ') : '착용 없음';
}

function getSelectedOwnedDinosaur(ownedDinosaurs: OwnedDinosaur[], selectedDinosaurId?: string | null) {
  return ownedDinosaurs.find((dinosaur) => dinosaur.id === selectedDinosaurId) ?? ownedDinosaurs[0] ?? null;
}

function ownedDinosaurToDinosaurState(dinosaur: OwnedDinosaur): DinosaurState {
  return {
    id: dinosaur.id,
    name: dinosaur.name,
    level: dinosaur.level,
    exp: dinosaur.exp,
    mood: dinosaur.mood,
    hunger: dinosaur.hunger,
    stamina: dinosaur.stamina,
  };
}

function updateSelectedOwnedDinosaur(state: GameState, updater: (dinosaur: OwnedDinosaur) => OwnedDinosaur): GameState {
  const uniqueOwnedDinosaurs = getUniqueOwnedDinosaurs(state.ownedDinosaurs);
  const selectedDinosaur = getSelectedOwnedDinosaur(uniqueOwnedDinosaurs, state.userProfile?.selectedDinosaurId);
  if (!selectedDinosaur) return state;

  const updatedDinosaur = updater(selectedDinosaur);
  const ownedDinosaurs = uniqueOwnedDinosaurs.map((dinosaur) => (dinosaur.id === updatedDinosaur.id ? updatedDinosaur : dinosaur));

  return {
    ...state,
    dinosaur: ownedDinosaurToDinosaurState(updatedDinosaur),
    ownedDinosaurs,
    userProfile: state.userProfile
      ? {
          ...state.userProfile,
          selectedDinosaurId: updatedDinosaur.id,
          dinosaurName: updatedDinosaur.name,
        }
      : state.userProfile,
  };
}

function getTrainingConditionEffects(dinosaur: OwnedDinosaur) {
  const isLowEnergy = dinosaur.stamina < trainingFatigueConfig.lowEnergyThreshold;
  const isLowFullness = dinosaur.hunger < trainingFatigueConfig.lowFullnessThreshold;
  const rewardMultiplier = isLowEnergy || isLowFullness ? trainingFatigueConfig.lowConditionRewardMultiplier : 1;
  const warnings = [
    isLowEnergy ? '공룡이 조금 지쳤어요. 놀이터에서 쉬게 해주세요!' : null,
    isLowFullness ? '배가 고파요. 먹이를 주면 더 힘내서 훈련할 수 있어요!' : null,
  ].filter(Boolean) as string[];

  return {
    rewardMultiplier,
    staminaCost: trainingFatigueConfig.energyCostPerCorrect,
    hungerCost: trainingFatigueConfig.fullnessCostPerCorrect,
    warnings,
  };
}

function formatTrainingRewardFeedback(dinosaur: OwnedDinosaur) {
  const effects = getTrainingConditionEffects(dinosaur);
  const costParts = [`체력 -${effects.staminaCost}`, `포만감 -${effects.hungerCost}`];
  return [...costParts, ...effects.warnings].join(', ');
}

function getDinoStaminaMessage(stamina: number) {
  if (stamina >= 70) return '훈련할 힘이 충분해요!';
  if (stamina >= 30) return '조금 지쳤지만 아직 괜찮아요.';
  if (stamina > 0) return '많이 지쳤어요. 조금만 더 하고 쉬어요.';

  return '지쳐서 지금은 훈련할 수 없어요. 쉬거나 먹이를 주세요.';
}

function getTrainingDinoReaction({
  isSetComplete,
  submissionResult,
  stamina,
}: {
  isSetComplete: boolean;
  submissionResult: SubmissionResult;
  stamina: number;
}) {
  if (isSetComplete) return '끝까지 해냈어요!';
  if (stamina <= 0) return '너무 지쳤어요. 잠깐 쉬고 싶어해요.';
  if (submissionResult === 'correct') return '좋았어! 공룡이 신나해요!';
  if (submissionResult === 'wrong') return '괜찮아요. 다시 해볼까요?';
  if (stamina < 30) return '조금 지쳤지만 아직 해볼 수 있어요.';

  return '함께 훈련할 준비가 됐어요!';
}

function getAnswerFeedbackText({
  feedback,
  isSetComplete,
  submissionResult,
  stamina,
}: {
  feedback: string;
  isSetComplete: boolean;
  submissionResult: SubmissionResult;
  stamina: number;
}) {
  if (isSetComplete) return '훈련 완료!';
  if (stamina <= 0) return '지쳐서 지금은 훈련할 수 없어요. 쉬거나 먹이를 주세요.';
  if (submissionResult === 'correct') return '맞았어요!';
  if (submissionResult === 'wrong') return '다시 해볼까요?';

  return feedback;
}

function formatDinosaurStatChanges(effect: DinosaurStatEffect) {
  const changes = [
    effect.hunger ? `포만감 +${effect.hunger}` : null,
    effect.mood ? `행복 +${effect.mood}` : null,
    effect.exp ? `EXP +${effect.exp}` : null,
    effect.stamina ? `체력 +${effect.stamina}` : null,
  ].filter(Boolean);

  return changes.join(', ');
}

function getLevelSettingSummary(stages: AbacusStageConfig[]) {
  if (stages.length === 0) {
    return {
      numberCount: '준비 중',
      numberSize: '준비 중',
      problemCount: '준비 중',
      operations: '준비 중',
    };
  }

  const minNumberCount = Math.min(...stages.map((stage) => stage.defaultNumberCount));
  const maxNumberCount = Math.max(...stages.map((stage) => stage.defaultNumberCount));
  const minProblemCount = Math.min(...stages.map((stage) => stage.defaultProblemCount));
  const maxProblemCount = Math.max(...stages.map((stage) => stage.defaultProblemCount));
  const digitTypes = Array.from(new Set(stages.map((stage) => stage.defaultDigitType)));
  const operations = Array.from(new Set(stages.map((stage) => stage.defaultOperation)));

  return {
    numberCount: minNumberCount === maxNumberCount ? `${minNumberCount}개` : `${minNumberCount}~${maxNumberCount}개`,
    numberSize: digitTypes.length === 1 ? formatDigitTypeLabel(digitTypes[0]) : digitTypes.map(formatDigitTypeLabel).join(' / '),
    problemCount: minProblemCount === maxProblemCount ? `${minProblemCount}문제` : `${minProblemCount}~${maxProblemCount}문제`,
    operations: operations.map(formatOperationModeLabel).join(' / '),
  };
}

function getRecommendedProblemCount(levelConfig: AbacusLevelConfig | null, selectedStage: AbacusStageConfig | null) {
  return selectedStage?.defaultProblemCount ?? levelConfig?.recommendedProblemCount ?? 10;
}

function getEffectiveProblemCount(_levelConfig: AbacusLevelConfig | null, selectedStage: AbacusStageConfig | null, override?: ProblemCountOverride) {
  return override ?? selectedStage?.defaultProblemCount ?? 10;
}

function getEffectiveNumberCount(selectedStage: AbacusStageConfig | null, override: NumberCountOverride) {
  if (override !== 'stage-default') return override;
  return selectedStage?.defaultNumberCount ?? 2;
}

function getEffectiveDigitType(selectedStage: AbacusStageConfig | null, override: DigitTypeOverride): ResolvedDigitType {
  if (override !== 'stage-default') return override;
  return selectedStage?.defaultDigitType ?? 'one-digit';
}

function getEffectiveOperationMode(selectedStage: AbacusStageConfig | null, override: OperationsOverride): OperationMode {
  if (override !== 'stage-default') return override;

  return selectedStage?.defaultOperation ?? 'add';
}

function formatNumberCountOverride(value: NumberCountOverride, stages: AbacusStageConfig[]) {
  if (value !== 'stage-default') return `${value}개`;
  return `단계 기본값 (${getLevelSettingSummary(stages).numberCount})`;
}

function formatDigitTypeLabel(value: ResolvedDigitType) {
  const labels: Record<ResolvedDigitType, string> = {
    'one-digit': '한 자리',
    'two-digit': '두 자리',
    'mixed-digit': '한 자리 + 두 자리',
  };

  return labels[value];
}

function formatDigitTypeOverride(value: DigitTypeOverride, selectedStage: AbacusStageConfig | null) {
  if (value !== 'stage-default') return formatDigitTypeLabel(value);
  return `단계 기본값 (${formatDigitTypeLabel(getEffectiveDigitType(selectedStage, 'stage-default'))})`;
}

function formatOperationModeLabel(value: OperationMode) {
  const labels: Record<OperationMode, string> = {
    add: '덧셈만',
    subtract: '뺄셈만',
    mixed: '덧셈 + 뺄셈',
  };

  return labels[value];
}

function formatOperationsOverride(value: OperationsOverride, stages: AbacusStageConfig[]) {
  if (value !== 'stage-default') return formatOperationModeLabel(value);
  return `단계 기본값 (${getLevelSettingSummary(stages).operations})`;
}

function formatMasteryStatus(value: TrainingProgressEvaluation['status']) {
  const labels: Record<TrainingProgressEvaluation['status'], string> = {
    'not-started': '시작 전',
    'needs-practice': '연습 필요',
    'in-progress': '진행 중',
    'almost-mastered': '거의 숙달',
    mastered: '숙달',
  };

  return labels[value];
}

function getEffectiveOperationsLabel(value: OperationsOverride, stages: AbacusStageConfig[]) {
  if (value !== 'stage-default') return formatOperationModeLabel(value);

  return getLevelSettingSummary(stages).operations;
}

function isOperationsOverrideRecommended(value: OperationsOverride, stages: AbacusStageConfig[]) {
  if (value === 'stage-default') return true;

  return stages.some((stage) => stage.allowedOperations.includes(value));
}

export default function App() {
  const [initialLoadResult] = useState(() => {
    const loaded = loadGameState(defaultGameState);
    return {
      ...loaded,
      state: normalizeGameState(loaded.state),
    };
  });
  const [phase, setPhase] = useState<'title' | 'onboarding' | 'app'>(() => (initialLoadResult.state.userProfile ? 'title' : 'onboarding'));
  const [activeTab, setActiveTab] = useState<MainTab>('training');
  const hasMountedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const [gameState, setGameState] = useState<GameState>(initialLoadResult.state);
  const activeOwnedDinosaur = getSelectedOwnedDinosaur(gameState.ownedDinosaurs, gameState.userProfile?.selectedDinosaurId) ?? initialOwnedDinosaur;
  const activeDinosaur = ownedDinosaurToDinosaurState(activeOwnedDinosaur);
  const activeEgg = getSelectedOwnedEgg(gameState.ownedEggs, gameState.activeEggId);
  const [trainingRunId, setTrainingRunId] = useState(0);
  const selectedLevelConfig = getAbacusLevel(gameState.selectedLevel) ?? getAbacusLevel(defaultSelectedLevel);
  const selectedLevelStages = getStagesForLevel(gameState.selectedLevel);
  const selectedStage = getStageById(gameState.selectedStageId) ?? getStageById(defaultSelectedStageId) ?? null;
  const generatorStage = getGeneratorFallbackStage(selectedStage) ?? selectedStage;
  const effectiveProblemCount = getEffectiveProblemCount(selectedLevelConfig, selectedStage, gameState.problemCountOverride);
  const effectiveNumberCount = getEffectiveNumberCount(selectedStage, gameState.numberCountOverride);
  const effectiveDigitType = getEffectiveDigitType(selectedStage, gameState.digitTypeOverride);
  const effectiveOperationMode = getEffectiveOperationMode(selectedStage, gameState.operationsOverride);
  const trainingProblemSet = useMemo(
    () =>
      generatorStage
        ? generateTrainingProblems({
            stage: generatorStage,
            problemCount: effectiveProblemCount,
            numberCount: effectiveNumberCount,
            digitType: effectiveDigitType,
            operationMode: effectiveOperationMode,
          })
        : [],
    [effectiveDigitType, effectiveNumberCount, effectiveOperationMode, effectiveProblemCount, generatorStage, trainingRunId],
  );
  const effectiveNumberCountLabel = `${effectiveNumberCount}개`;
  const effectiveDigitTypeLabel = formatDigitTypeLabel(effectiveDigitType);
  const effectiveOperationsLabel = getEffectiveOperationsLabel(gameState.operationsOverride, selectedLevelStages);
  const selectedLevelEvaluation = useMemo(
    () =>
      evaluateLevelProgress({
        level: gameState.selectedLevel,
        progressByLevel: gameState.progressByLevel,
        trainingHistory: gameState.trainingHistory,
      }),
    [gameState.progressByLevel, gameState.selectedLevel, gameState.trainingHistory],
  );
  const selectedStageEvaluation = useMemo(
    () =>
      evaluateStageProgress({
        stageId: gameState.selectedStageId,
        progressByStage: gameState.progressByStage,
        trainingHistory: gameState.trainingHistory,
      }),
    [gameState.progressByStage, gameState.selectedStageId, gameState.trainingHistory],
  );
  const nextTrainingRecommendation = useMemo(
    () =>
      getNextTrainingRecommendation({
        selectedLevel: gameState.selectedLevel,
        selectedStageId: gameState.selectedStageId,
        progressByLevel: gameState.progressByLevel,
        progressByStage: gameState.progressByStage,
        trainingHistory: gameState.trainingHistory,
        abacusLevels,
        abacusStages,
      }),
    [gameState.progressByLevel, gameState.progressByStage, gameState.selectedLevel, gameState.selectedStageId, gameState.trainingHistory],
  );
  const trainingSettingsKey = [
    gameState.selectedLevel,
    gameState.selectedStageId,
    generatorStage?.id ?? 'no-stage',
    effectiveProblemCount,
    effectiveNumberCount,
    effectiveDigitType,
    effectiveOperationMode,
    trainingRunId,
  ].join(':');
  const usesFallbackGenerator = Boolean(selectedStage && generatorStage && selectedStage.id !== generatorStage.id);
  const [lastRewards, setLastRewards] = useState<Reward[]>([]);
  const [setCompleteRewards, setSetCompleteRewards] = useState<Reward[]>([]);
  const [completedTrainingSummary, setCompletedTrainingSummary] = useState<CompletedTrainingSummary | null>(null);
  const [lastTrainingEffects, setLastTrainingEffects] = useState<string[]>([]);
  const training = useTrainingSession(trainingProblemSet, {
    onCorrectAnswer: () => applyCorrectAnswerTrainingCost(),
    onSetComplete: (completedSession) => applyTrainingCompletionRewards(completedSession),
    formatCorrectRewardFeedback: () => `정답! ${formatTrainingRewardFeedback(activeOwnedDinosaur)}`,
    formatSetCompleteFeedback: () => '세트 완료! 결과와 보상이 정리됐어요.',
    resetKey: trainingSettingsKey,
  });
  const [lastBluetoothInput, setLastBluetoothInput] = useState<BluetoothNotificationPayload | null>(null);
  const [dinoView, setDinoView] = useState<DinoView>('care');
  const [dinoFeedback, setDinoFeedback] = useState('오늘도 주산훈련을 기다리고 있어요.');
  const [hatchResult, setHatchResult] = useState<HatchResult | null>(null);
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<string | null>('soft-berry');
  const [shopFeedback, setShopFeedback] = useState('상점은 목업입니다. 실제 구매는 아직 연결하지 않았습니다.');
  const [storageFeedback, setStorageFeedback] = useState(initialLoadResult.message);
  const lastBluetoothConfirmRef = useRef<{ hex: string; time: number; problemIndex: number } | null>(null);
  const rewardedSessionIdsRef = useRef<Set<string>>(new Set());
  const isHatchingRef = useRef(false);

  const activeMeta = useMemo(() => mainTabs.find((tab) => tab.id === activeTab) ?? mainTabs[0], [activeTab]);

  useEffect(() => {
    setCompletedTrainingSummary(null);
    setSetCompleteRewards([]);
  }, [trainingSettingsKey]);

  useEffect(() => {
    if (activeTab !== 'hatchery') {
      setHatchResult(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!hatchResult) {
      isHatchingRef.current = false;
    }
  }, [hatchResult]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const savedAt = saveGameState(gameState);
    const message = savedAt ? `저장됨: ${new Date(savedAt).toLocaleString()}` : 'localStorage를 사용할 수 없어 저장하지 못했어요.';
    setStorageFeedback(message);
    console.log(message);
  }, [gameState]);

  function resetSavedGameState() {
    clearGameState();
    skipNextSaveRef.current = true;
    setGameState(defaultGameState);
    setSelectedFoodItemId('soft-berry');
    setLastRewards([]);
    setSetCompleteRewards([]);
    setLastTrainingEffects([]);
    setDinoFeedback('저장 데이터를 초기화했어요.');
    setShopFeedback('상점은 목업입니다. 실제 구매는 아직 연결하지 않았습니다.');
    setStorageFeedback('저장 데이터를 초기화하고 기본 상태로 되돌렸어요.');
    setPhase('onboarding');
    console.log('Cleared local game state.');
  }

  function completeOnboarding(profileInput: { childName: string; ageOrGrade: string; dinosaurName: string }) {
    const childName = profileInput.childName.trim() || '친구';
    const ageOrGrade = profileInput.ageOrGrade.trim() || '초등';
    const dinosaurName = profileInput.dinosaurName.trim() || '몽이';
    const createdAt = Date.now();
    const userProfile: UserProfile = {
      id: `profile-${createdAt}`,
      childName,
      ageOrGrade,
      createdAt,
      selectedDinosaurId: initialOwnedDinosaur.id,
      dinosaurName,
      parentModeEnabled: false,
    };
    const starterDinosaur: OwnedDinosaur = {
      ...initialOwnedDinosaur,
      name: dinosaurName,
    };

    setGameState({
      ...defaultGameState,
      userProfile,
      dinosaur: ownedDinosaurToDinosaurState(starterDinosaur),
      ownedDinosaurs: [starterDinosaur],
      discoveredSpeciesIds: [starterDinosaur.speciesId],
      ownedEggs: [initialOwnedEgg],
      activeEggId: initialOwnedEgg.id,
      egg: activeEggToEggState(initialOwnedEgg) ?? defaultGameState.egg,
    });
    setDinoFeedback(`${dinosaurName}와 함께 모험을 시작해요.`);
    setPhase('app');
  }

  function selectTrainingLevel(level: number) {
    const levelConfig = getAbacusLevel(level);
    if (!levelConfig) return;

    setGameState((current) => ({
      ...current,
      selectedLevel: levelConfig.level,
      selectedStageId: getDefaultStageIdForLevel(levelConfig.level) ?? current.selectedStageId,
    }));
  }

  function selectTrainingStage(stageId: string) {
    const stage = getStageById(stageId);
    if (!stage) return;
    const levelConfig = getLevelForStageId(stage.id);

    setGameState((current) => ({
      ...current,
      selectedLevel: levelConfig?.level ?? current.selectedLevel,
      selectedStageId: stage.id,
    }));
  }

  function updateProblemCountOverride(value: ProblemCountOverride | 'stage-default') {
    setGameState((current) => ({
      ...current,
      problemCountOverride: value === 'stage-default' ? undefined : value,
    }));
  }

  function updateNumberCountOverride(value: NumberCountOverride) {
    setGameState((current) => ({
      ...current,
      numberCountOverride: value,
    }));
  }

  function updateDigitTypeOverride(value: DigitTypeOverride) {
    setGameState((current) => ({
      ...current,
      digitTypeOverride: value,
    }));
  }

  function updateOperationsOverride(value: OperationsOverride) {
    setGameState((current) => ({
      ...current,
      operationsOverride: value,
    }));
  }

  function applyCorrectAnswerTrainingCost() {
    const targetDinosaur = getSelectedOwnedDinosaur(gameState.ownedDinosaurs, gameState.userProfile?.selectedDinosaurId) ?? initialOwnedDinosaur;
    const trainingEffects = getTrainingConditionEffects(targetDinosaur);

    setGameState((current) =>
      updateSelectedOwnedDinosaur(current, (dinosaur) => ({
        ...dinosaur,
        stamina: clampPercent(dinosaur.stamina - trainingEffects.staminaCost),
        hunger: clampPercent(dinosaur.hunger - trainingEffects.hungerCost),
      })),
    );
    setLastRewards([]);
    setLastTrainingEffects([
      `체력 -${trainingEffects.staminaCost}`,
      `포만감 -${trainingEffects.hungerCost}`,
      ...(trainingEffects.warnings ?? []),
    ]);
  }

  function applyTrainingCompletionRewards(completedSession: TrainingSession) {
    if (rewardedSessionIdsRef.current.has(completedSession.id)) return;
    rewardedSessionIdsRef.current.add(completedSession.id);

    const completedProblemIds = new Set(completedSession.answers.filter((answerRecord) => answerRecord.isCorrect).map((answerRecord) => answerRecord.problemId));
    const correctCount = completedProblemIds.size;
    const wrongCount = completedSession.answers.filter((answerRecord) => !answerRecord.isCorrect).length;
    const rewardSummary = calculateTrainingRewards({
      totalProblems: completedSession.problems.length,
      correctCount,
      wrongCount,
      selectedLevel: gameState.selectedLevel,
      activeDinosaurCondition: {
        stamina: activeOwnedDinosaur.stamina,
        hunger: activeOwnedDinosaur.hunger,
      },
    });
    const completedAt = completedSession.completedAt ?? Date.now();
    const hatchReward = rewardSummary.hatchItems[0];
    const hatchItem = hatchReward ? getHatchItemConfig(hatchReward.itemId) : null;
    const trainingRecord: TrainingSessionRecord = {
      id: `training-record-${completedSession.id}`,
      completedAt: new Date(completedAt).toISOString(),
      selectedLevel: gameState.selectedLevel,
      selectedStageId: selectedStage?.id ?? gameState.selectedStageId,
      problemCount: effectiveProblemCount,
      numberCount: effectiveNumberCount,
      digitType: effectiveDigitType,
      operationMode: effectiveOperationMode,
      totalProblems: completedSession.problems.length,
      correctCount,
      wrongCount,
      accuracy: rewardSummary.accuracy,
      earnedCoins: rewardSummary.coins,
      earnedExp: rewardSummary.dinosaurExp,
      earnedItems: rewardSummary.hatchItems,
      activeDinosaurId: activeOwnedDinosaur.id,
    };

    setGameState((current) => {
      const withPlayerAndInventory: GameState = {
        ...current,
        player: {
          ...current.player,
          coins: current.player.coins + rewardSummary.coins,
        },
        inventory: rewardSummary.hatchItems.reduce((inventory, item) => addInventoryQuantity(inventory, item.itemId, item.quantity), current.inventory),
        trainingHistory: addTrainingRecordToHistory(current.trainingHistory, trainingRecord),
        progressByLevel: updateProgressByLevel(current.progressByLevel, trainingRecord),
        progressByStage: updateProgressByStage(current.progressByStage, trainingRecord),
      };

      return updateSelectedOwnedDinosaur(withPlayerAndInventory, (dinosaur) => ({
        ...dinosaur,
        exp: clampPercent(dinosaur.exp + rewardSummary.dinosaurExp),
        mood: clampPercent(dinosaur.mood + rewardSummary.happiness),
      }));
    });

    setCompletedTrainingSummary({
      ...rewardSummary,
      sessionId: completedSession.id,
      totalProblems: completedSession.problems.length,
      correctCount,
      wrongCount,
      completedAt,
    });
    setSetCompleteRewards([
      createDisplayReward(`코인 +${rewardSummary.coins}`, rewardSummary.coins),
      createDisplayReward(`공룡 EXP +${rewardSummary.dinosaurExp}`, rewardSummary.dinosaurExp),
      createDisplayReward(`공룡 기분 +${rewardSummary.happiness}`, rewardSummary.happiness),
      ...(hatchReward ? [createDisplayReward(`${hatchItem?.name ?? hatchReward.itemId} ${hatchReward.quantity}개`, hatchReward.quantity)] : []),
    ]);
    setLastRewards([]);
    setLastTrainingEffects(hatchReward ? [`${hatchItem?.name ?? hatchReward.itemId} ${hatchReward.quantity}개를 얻었어요.`] : []);
  }

  function restartTrainingSet() {
    setCompletedTrainingSummary(null);
    setSetCompleteRewards([]);
    setLastRewards([]);
    setLastTrainingEffects([]);
    setTrainingRunId((current) => current + 1);
  }

  function applyDinosaurInteraction(changes: DinosaurInteractionChange, message: string) {
    setGameState((current) =>
      updateSelectedOwnedDinosaur(current, (dinosaur) => ({
        ...dinosaur,
        exp: clampPercent(dinosaur.exp + (changes.exp ?? 0)),
        mood: clampPercent(dinosaur.mood + (changes.mood ?? 0)),
        hunger: clampPercent(dinosaur.hunger + (changes.hunger ?? 0)),
        stamina: clampPercent(dinosaur.stamina + (changes.stamina ?? 0)),
      })),
    );
    setDinoFeedback(message);
  }

  function feedDinosaur() {
    const inventoryIds = gameState.inventory.map((item) => item.itemId);
    if (!selectedFoodItemId) {
      setDinoFeedback('먹이를 먼저 선택해주세요.');
      return;
    }

    const inventoryItem = gameState.inventory.find((item) => {
      const config = getItemConfig(item.itemId);
      return config?.category === 'food' && item.itemId === selectedFoodItemId;
    });
    if (!inventoryItem) {
      setDinoFeedback(`선택한 먹이를 찾지 못했어요. 보유 id: ${inventoryIds.join(', ') || '없음'}`);
      console.warn('Selected food item is missing from inventory.', {
        selectedFoodItemId,
        inventoryIds,
      });
      return;
    }

    if (inventoryItem.quantity <= 0) {
      setDinoFeedback('선택한 먹이가 없어요. 다른 먹이를 선택해주세요.');
      return;
    }

    const foodConfig = getFoodItemConfig(inventoryItem.itemId);
    const effect = foodConfig?.effect ?? fallbackFoodEffect;
    const foodName = foodConfig?.name ?? inventoryItem.itemId;

    if (!foodConfig) {
      console.warn('Food item config missing. Applying fallback effect.', {
        usedItemId: inventoryItem.itemId,
        inventoryIds,
      });
    }

    let remainingQuantity = inventoryItem.quantity;
    setGameState((current) => {
      const currentInventoryItem = current.inventory.find((item) => item.itemId === inventoryItem.itemId);
      remainingQuantity = Math.max(0, (currentInventoryItem?.quantity ?? 0) - 1);

      return {
        ...updateSelectedOwnedDinosaur(current, (dinosaur) => ({
          ...dinosaur,
          exp: clampPercent(dinosaur.exp + (effect.exp ?? 0)),
          mood: clampPercent(dinosaur.mood + (effect.mood ?? 0)),
          hunger: clampPercent(dinosaur.hunger + (effect.hunger ?? 0)),
          stamina: clampPercent(dinosaur.stamina + (effect.stamina ?? 0)),
        })),
        inventory: current.inventory.map((item) => (item.itemId === inventoryItem.itemId ? { ...item, quantity: remainingQuantity } : item)),
      };
    });
    if (remainingQuantity <= 0) {
      setSelectedFoodItemId(null);
    }
    setDinoFeedback(foodConfig ? `${foodName}를 먹었어요! ${formatDinosaurStatChanges(effect)}` : `${foodName}를 먹었어요! ${formatDinosaurStatChanges(effect)} (config 없음, 보유 id: ${inventoryIds.join(', ')})`);
  }

  function purchaseItem(itemId: string) {
    const item = getItemConfig(itemId);
    if (!item) {
      setShopFeedback(`아이템 정보를 찾지 못했어요. itemId: ${itemId}`);
      return;
    }

    if (item.category === 'dinosaur') {
      setShopFeedback('공룡 해금 기능은 다음 단계에서 연결 예정입니다.');
      return;
    }

    if (!Number.isFinite(item.price) || item.price <= 0) {
      setShopFeedback('이 아이템은 아직 구매할 수 없어요.');
      return;
    }

    const isOwnedCostume = item.category === 'costume' && gameState.ownedCostumeIds.includes(item.id);
    const ownedQuantity = item.category === 'egg' ? gameState.ownedEggs.filter((egg) => egg.eggItemId === item.id).length : item.category === 'costume' ? (isOwnedCostume ? 1 : 0) : gameState.inventory.find((inventoryItem) => inventoryItem.itemId === item.id)?.quantity ?? 0;
    if (isOwnedCostume) {
      setShopFeedback('이미 보유 중이에요.');
      return;
    }

    if (gameState.player.coins < item.price) {
      setShopFeedback('코인이 부족해요.');
      return;
    }

    if (item.category === 'egg') {
      const newEgg = createOwnedEggFromItem(item.id);
      if (!newEgg) {
        setShopFeedback(`알 정보를 찾지 못했어요. itemId: ${item.id}`);
        return;
      }

      setGameState((current) => ({
        ...current,
        player: {
          ...current.player,
          coins: current.player.coins - item.price,
        },
        ownedEggs: [...current.ownedEggs, newEgg],
        activeEggId: current.activeEggId ?? newEgg.id,
        egg: current.activeEggId ? current.egg : activeEggToEggState(newEgg) ?? current.egg,
      }));
      setShopFeedback(`${item.name}을 구매했어요! 코인 -${item.price}`);
      return;
    }

    if (item.category === 'costume') {
      setGameState((current) => ({
        ...current,
        player: {
          ...current.player,
          coins: current.player.coins - item.price,
        },
        ownedCostumeIds: current.ownedCostumeIds.includes(item.id) ? current.ownedCostumeIds : [...current.ownedCostumeIds, item.id],
      }));
      setShopFeedback(`${item.name}를 구매했어요!`);
      return;
    }

    setGameState((current) => {
      const existingInventoryItem = current.inventory.find((inventoryItem) => inventoryItem.itemId === item.id);
      const nextInventory = existingInventoryItem
        ? current.inventory.map((inventoryItem) => (inventoryItem.itemId === item.id ? { ...inventoryItem, quantity: inventoryItem.quantity + 1 } : inventoryItem))
        : [...current.inventory, { itemId: item.id, quantity: 1 }];

      return {
        ...current,
        player: {
          ...current.player,
          coins: current.player.coins - item.price,
        },
        inventory: nextInventory,
      };
    });

    setShopFeedback(`${item.name}를 구매했어요! 코인 -${item.price}`);
  }

  function hatchEgg() {
    if (hatchResult || isHatchingRef.current) return;

    const currentActiveEgg = getSelectedOwnedEgg(gameState.ownedEggs, gameState.activeEggId);
    if (!currentActiveEgg || currentActiveEgg.hatchProgress < 100) return;

    isHatchingRef.current = true;
    const uniqueOwnedDinosaurs = getUniqueOwnedDinosaurs(gameState.ownedDinosaurs);
    const ownedSpeciesIds = new Set(uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId));
    const hatchedTemplate = getAvailableHatchSpecies(uniqueOwnedDinosaurs)[0];

    if (!hatchedTemplate) {
      setGameState((current) => ({
        ...current,
        ownedDinosaurs: uniqueOwnedDinosaurs,
        discoveredSpeciesIds: getUniqueSpeciesIds([...current.discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId)]),
        egg: {
          ...current.egg,
          ...(activeEggToEggState(currentActiveEgg) ?? {}),
          lastHatchMessage: '모든 공룡을 발견했어요! 다음 업데이트를 기다려주세요.',
        },
      }));
      isHatchingRef.current = false;
      return;
    }

    if (ownedSpeciesIds.has(hatchedTemplate.speciesId)) {
      setGameState((current) => ({
        ...current,
        ownedDinosaurs: uniqueOwnedDinosaurs,
        discoveredSpeciesIds: getUniqueSpeciesIds([...current.discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId)]),
        egg: {
          ...current.egg,
          ...(activeEggToEggState(currentActiveEgg) ?? {}),
          lastHatchMessage: '이미 만난 공룡이에요.',
        },
      }));
      isHatchingRef.current = false;
      return;
    }

    setGameState((current) => {
      const stillActiveEgg = getSelectedOwnedEgg(current.ownedEggs, current.activeEggId);
      if (!stillActiveEgg || stillActiveEgg.id !== currentActiveEgg.id || stillActiveEgg.hatchProgress < 100) return current;

      const obtainedAt = Date.now();
      const newDinosaur: OwnedDinosaur = {
        id: `owned-${hatchedTemplate.speciesId}-${obtainedAt}`,
        speciesId: hatchedTemplate.speciesId,
        name: hatchedTemplate.defaultName,
        rarity: hatchedTemplate.rarity,
        level: 1,
        exp: 0,
        mood: 70,
        hunger: 70,
        stamina: 70,
        obtainedAt,
      };

      const nextOwnedEggs = current.ownedEggs.filter((egg) => egg.id !== currentActiveEgg.id);
      const nextActiveEgg = getSelectedOwnedEgg(nextOwnedEggs, nextOwnedEggs[0]?.id);

      return {
        ...current,
        ownedDinosaurs: [...uniqueOwnedDinosaurs, newDinosaur],
        discoveredSpeciesIds: getUniqueSpeciesIds([...current.discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId), newDinosaur.speciesId]),
        ownedEggs: nextOwnedEggs,
        activeEggId: nextActiveEgg?.id ?? null,
        dinosaur: ownedDinosaurToDinosaurState(newDinosaur),
        userProfile: current.userProfile
          ? {
              ...current.userProfile,
              selectedDinosaurId: newDinosaur.id,
              dinosaurName: newDinosaur.name,
            }
          : current.userProfile,
        egg: {
          ...current.egg,
          ...(activeEggToEggState(nextActiveEgg) ?? {
            id: `no-active-egg-${obtainedAt}`,
            name: '선택된 알 없음',
            rarity: 'normal' as const,
            eggType: 'none',
            hatchProgress: 0,
          }),
          lastHatchedDinosaurName: undefined,
          lastHatchedDinosaurRarity: undefined,
          lastHatchMessage: undefined,
        },
      };
    });
    setHatchResult({
      eggName: currentActiveEgg.name,
      eggRarity: currentActiveEgg.rarity,
      dinosaurName: hatchedTemplate.defaultName,
      speciesName: hatchedTemplate.displayName,
      rarity: hatchedTemplate.rarity,
      message: `${hatchedTemplate.defaultName}가 태어났어요! 새 공룡이 우리 공룡과 도감에 추가되었어요.`,
    });
  }

  function selectAdjacentDinosaur(direction: -1 | 1) {
    setGameState((current) => {
      const ownedDinosaurs = getUniqueOwnedDinosaurs(current.ownedDinosaurs);
      if (ownedDinosaurs.length === 0) return current;

      const selectedDinosaur = getSelectedOwnedDinosaur(ownedDinosaurs, current.userProfile?.selectedDinosaurId) ?? ownedDinosaurs[0];
      const selectedIndex = Math.max(0, ownedDinosaurs.findIndex((dinosaur) => dinosaur.id === selectedDinosaur.id));
      const nextIndex = (selectedIndex + direction + ownedDinosaurs.length) % ownedDinosaurs.length;
      const nextDinosaur = ownedDinosaurs[nextIndex];

      return {
        ...current,
        dinosaur: ownedDinosaurToDinosaurState(nextDinosaur),
        ownedDinosaurs,
        userProfile: current.userProfile
          ? {
              ...current.userProfile,
              selectedDinosaurId: nextDinosaur.id,
              dinosaurName: nextDinosaur.name,
            }
          : current.userProfile,
      };
    });
  }

  function viewOwnedDinosaurFromDex(speciesId: string) {
    setGameState((current) => {
      const ownedDinosaurs = getUniqueOwnedDinosaurs(current.ownedDinosaurs);
      const nextDinosaur = ownedDinosaurs.find((dinosaur) => dinosaur.speciesId === speciesId);
      if (!nextDinosaur) return current;

      return {
        ...current,
        dinosaur: ownedDinosaurToDinosaurState(nextDinosaur),
        ownedDinosaurs,
        userProfile: current.userProfile
          ? {
              ...current.userProfile,
              selectedDinosaurId: nextDinosaur.id,
              dinosaurName: nextDinosaur.name,
            }
          : current.userProfile,
      };
    });
    setActiveTab('dino');
  }

  function selectActiveEgg(eggId: string) {
    setGameState((current) => {
      const nextActiveEgg = current.ownedEggs.find((egg) => egg.id === eggId) ?? null;
      if (!nextActiveEgg) return current;

      return {
        ...current,
        activeEggId: nextActiveEgg.id,
        egg: {
          ...current.egg,
          ...(activeEggToEggState(nextActiveEgg) ?? {}),
        },
      };
    });
  }

  function useHatchItem(itemId: string) {
    const item = getHatchItemConfig(itemId);
    if (!item) return;

    setGameState((current) => {
      const activeEgg = getSelectedOwnedEgg(current.ownedEggs, current.activeEggId);
      if (!activeEgg) {
        return {
          ...current,
          egg: {
            ...current.egg,
            lastHatchMessage: '부화시킬 알을 선택해주세요.',
          },
        };
      }

      const inventoryItem = current.inventory.find((entry) => entry.itemId === item.id);
      if (!inventoryItem || inventoryItem.quantity <= 0) {
        return {
          ...current,
          egg: {
            ...current.egg,
            ...(activeEggToEggState(activeEgg) ?? {}),
            lastHatchMessage: '상점에서 부화 아이템을 구매하거나 훈련 세트를 완료해보세요.',
          },
        };
      }

      const nextOwnedEggs = current.ownedEggs.map((egg) => (egg.id === activeEgg.id ? { ...egg, hatchProgress: clampPercent(egg.hatchProgress + item.effect.hatchProgress) } : egg));
      const nextActiveEgg = getSelectedOwnedEgg(nextOwnedEggs, activeEgg.id);

      return {
        ...current,
        ownedEggs: nextOwnedEggs,
        inventory: current.inventory.map((entry) => (entry.itemId === item.id ? { ...entry, quantity: Math.max(0, entry.quantity - 1) } : entry)),
        egg: {
          ...current.egg,
          ...(activeEggToEggState(nextActiveEgg) ?? {}),
          lastHatchMessage: `${item.name}을 사용했어요! 알 부화 게이지 +${item.effect.hatchProgress}%`,
        },
      };
    });
  }

  function equipCostume(itemId: string) {
    const item = getItemConfig(itemId);
    if (item?.category !== 'costume') return;

    if (!gameState.ownedCostumeIds.includes(item.id)) {
      setDinoFeedback('보유 중인 코스튬만 착용할 수 있어요.');
      return;
    }

    let isUnequipping = false;
    setGameState((current) =>
      updateSelectedOwnedDinosaur(current, (dinosaur) => {
        const equippedCostumes = { ...(dinosaur.equippedCostumes ?? {}) };
        isUnequipping = equippedCostumes[item.slot] === item.id;

        if (isUnequipping) {
          delete equippedCostumes[item.slot];
          return {
            ...dinosaur,
            equippedCostumes,
          };
        }

        return {
          ...dinosaur,
          equippedCostumes: {
            ...equippedCostumes,
            [item.slot]: item.id,
          },
        };
      }),
    );
    setDinoFeedback(isUnequipping ? `${item.name}를 벗었어요.` : `${item.name}를 입었어요!`);
  }

  function handleBluetoothNumber(value: string) {
    training.setAnswer(value);
  }

  function handleBluetoothNotification(payload: BluetoothNotificationPayload) {
    setLastBluetoothInput(payload);

    if (payload.parsedNumber !== null && !payload.isConfirmSignal) {
      handleBluetoothNumber(String(payload.parsedNumber));
    }

    if (payload.isConfirmSignal) {
      const now = Date.now();
      const lastConfirm = lastBluetoothConfirmRef.current;
      if (lastConfirm?.hex === payload.hex && lastConfirm.problemIndex === training.currentProblemIndex && now - lastConfirm.time < 600) {
        return;
      }

      lastBluetoothConfirmRef.current = { hex: payload.hex, time: now, problemIndex: training.currentProblemIndex };

      if (payload.parsedNumber === null) {
        training.reportBluetoothParseError();
        return;
      }

      const bluetoothAnswer = String(payload.parsedNumber);
      training.setAnswer(bluetoothAnswer);
      training.submitAnswer('bluetooth', bluetoothAnswer);
    }
  }

  if (phase === 'title') {
    return (
      <div className="min-h-screen overflow-hidden bg-gradient-to-b from-sky-200 via-cyan-100 to-lime-100 p-4 text-slate-800 md:p-8">
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
          <section className="relative grid w-full gap-8 overflow-hidden rounded-[40px] border-4 border-white bg-white/78 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.22)] backdrop-blur md:grid-cols-[1fr_0.9fr] md:p-10">
            <SkyDecor />
            <div className="relative z-10 flex flex-col justify-center">
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border-2 border-cyan-200 bg-white px-5 py-2 text-sm font-black text-cyan-800 shadow-sm">
                <Sparkles className="h-4 w-4" />
                주산훈련으로 자라는 공룡 친구
              </div>
              <h1 className="text-5xl font-black leading-tight text-emerald-950 md:text-7xl">주산 공룡 모험</h1>
              <p className="mt-5 max-w-xl text-xl font-black leading-relaxed text-emerald-800/80">
                문제를 풀고 보상을 모아 알을 부화시키고, 내 공룡을 돌보는 밝은 학습 모험입니다.
              </p>
              <button
                onClick={() => setPhase('app')}
                className="mt-8 inline-flex min-h-20 w-fit items-center justify-center gap-3 rounded-[26px] border-4 border-white bg-gradient-to-b from-cyan-400 to-cyan-500 px-10 text-2xl font-black text-white shadow-[0_10px_0_#0891b2,0_20px_28px_rgba(8,145,178,0.28)] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_5px_0_#0891b2]"
              >
                훈련 시작
                <Play className="h-7 w-7 fill-white" />
              </button>
            </div>

            <div className="relative z-10 flex min-h-[440px] items-end justify-center rounded-[36px] bg-gradient-to-b from-sky-100 via-emerald-50 to-lime-200 p-6 shadow-inner">
              <div className="absolute bottom-0 left-0 right-0 h-28 rounded-t-[50%] bg-lime-300/70" />
              <div className="absolute left-8 top-8 rounded-[24px] border-4 border-white bg-white/90 px-5 py-4 shadow-lg">
                <p className="text-sm font-black text-cyan-700">오늘의 문제</p>
                <p className="text-4xl font-black text-slate-950">7 + 5 = ?</p>
              </div>
              <div className="absolute right-8 top-8 rounded-full border-4 border-white bg-amber-300 px-5 py-3 text-lg font-black text-amber-950 shadow-lg">+10 코인</div>
              <div className="absolute bottom-16 left-10 flex h-36 w-28 items-center justify-center rounded-[50%] border-8 border-white bg-gradient-to-br from-amber-200 to-orange-300 shadow-xl">
                <Egg className="h-14 w-14 text-white" />
              </div>
              <DinoAvatar size="hero" />
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (phase === 'onboarding') {
    return <OnboardingView onComplete={completeOnboarding} />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-sky-200 via-cyan-100 to-lime-100 pb-28 text-slate-800">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.9),transparent_16%),radial-gradient(circle_at_72%_20%,rgba(255,255,255,0.75),transparent_14%)]" />
      <header className="sticky top-0 z-20 px-3 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[28px] border-4 border-white bg-white/82 px-3 py-3 shadow-[0_12px_30px_rgba(14,116,144,0.16)] backdrop-blur md:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border-4 border-white bg-gradient-to-b from-emerald-300 to-emerald-400 text-white shadow-md">
              <Baby className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-black text-emerald-950 md:text-3xl">주산 공룡 모험</h1>
              <p className="hidden text-sm font-black text-emerald-700/75 sm:block">주산훈련 → 보상 → 알부화와 성장</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderPill icon={Coins} label={gameState.player.coins.toLocaleString()} tone="coin" />
            <HeaderPill icon={Star} label={`Lv. ${activeDinosaur.level}`} tone="level" />
            <HeaderPill icon={BookOpen} label={`${gameState.selectedLevel}단계`} tone="book" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-3 py-3 md:px-6">
        <section className="mb-4 flex items-center gap-3 rounded-[30px] border-4 border-white bg-white/72 p-3 shadow-[0_10px_28px_rgba(14,116,144,0.12)] backdrop-blur md:p-4">
          <div className={`flex h-16 w-16 items-center justify-center rounded-[24px] border-4 border-white bg-gradient-to-b ${activeMeta.active} text-white shadow-md`}>
            <activeMeta.icon className={`h-8 w-8 ${activeMeta.color}`} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-emerald-950">{activeMeta.label}</h2>
            <p className="text-sm font-black text-emerald-700/70">화면 흐름과 디자인 방향을 확인하는 목업입니다.</p>
          </div>
        </section>

        {activeTab === 'training' && (
          <TrainingScreen>
            <TrainingView
              problems={trainingProblemSet}
              currentProblem={training.currentProblem}
              currentProblemIndex={training.currentProblemIndex}
              totalProblems={training.totalProblems}
              correctCount={training.correctCount}
              wrongCount={training.wrongCount}
              answer={training.answer}
              feedback={training.feedback}
              submissionResult={training.submissionResult}
              lastRewards={lastRewards}
              lastTrainingEffects={lastTrainingEffects}
              setCompleteRewards={setCompleteRewards}
              completedTrainingSummary={completedTrainingSummary}
              isSetComplete={training.isSetComplete}
              bluetoothInput={lastBluetoothInput}
              selectedLevelConfig={selectedLevelConfig}
              effectiveProblemCount={effectiveProblemCount}
              effectiveNumberCountLabel={effectiveNumberCountLabel}
              effectiveDigitTypeLabel={effectiveDigitTypeLabel}
              effectiveOperationsLabel={effectiveOperationsLabel}
              usesFallbackGenerator={usesFallbackGenerator}
              activeOwnedDinosaur={activeOwnedDinosaur}
              ownedDinosaurs={gameState.ownedDinosaurs}
              onSelectAdjacentDinosaur={selectAdjacentDinosaur}
              onAnswer={training.setAnswer}
              onCheck={() => training.submitAnswer('manual')}
              onChooseProblem={training.chooseProblem}
              onRestartTraining={restartTrainingSet}
              onGoToDino={() => setActiveTab('dino')}
              onGoToHatchery={() => setActiveTab('hatchery')}
            />
          </TrainingScreen>
        )}
        {activeTab === 'dino' && (
          <DinosaurRoomScreen
            view={dinoView}
            dinosaur={activeDinosaur}
            activeOwnedDinosaur={activeOwnedDinosaur}
            ownedDinosaurs={gameState.ownedDinosaurs}
            ownedCostumeIds={gameState.ownedCostumeIds}
            feedback={dinoFeedback}
            inventory={gameState.inventory}
            selectedFoodItemId={selectedFoodItemId}
            onView={setDinoView}
            onSelectFood={setSelectedFoodItemId}
            onSelectAdjacentDinosaur={selectAdjacentDinosaur}
            onEquipCostume={equipCostume}
            onDinosaurInteraction={applyDinosaurInteraction}
            onFeed={feedDinosaur}
          />
        )}
        {activeTab === 'hatchery' && (
          <HatcheryScreen
            ownedEggs={gameState.ownedEggs}
            activeEggId={gameState.activeEggId}
            ownedDinosaurs={gameState.ownedDinosaurs}
            inventory={gameState.inventory}
            feedback={gameState.egg.id === gameState.activeEggId ? gameState.egg.lastHatchMessage : undefined}
            hatchResult={hatchResult}
            onSelectEgg={selectActiveEgg}
            onUseHatchItem={useHatchItem}
            onHatchEgg={hatchEgg}
            onGoToDex={() => {
              setHatchResult(null);
              setActiveTab('pokedex');
            }}
            onGoToDino={() => {
              setHatchResult(null);
              setActiveTab('dino');
            }}
            onCloseHatchResult={() => setHatchResult(null)}
          />
        )}
        {activeTab === 'shop' && (
          <ShopScreen coins={gameState.player.coins} feedback={shopFeedback} inventory={gameState.inventory} ownedEggs={gameState.ownedEggs} ownedCostumeIds={gameState.ownedCostumeIds} onPurchase={purchaseItem} />
        )}
        {activeTab === 'pokedex' && <DexScreen ownedDinosaurs={gameState.ownedDinosaurs} discoveredSpeciesIds={gameState.discoveredSpeciesIds} onViewOwnedDinosaur={viewOwnedDinosaurFromDex} />}
        {activeTab === 'adventure' && (
          <PlaygroundScreen>
            <AdventureView />
          </PlaygroundScreen>
        )}
        {activeTab === 'settings' && (
          <SettingsScreen>
            <SettingsView
              userProfile={gameState.userProfile}
              levels={abacusLevels}
              selectedLevel={gameState.selectedLevel}
              selectedLevelConfig={selectedLevelConfig}
              selectedStage={selectedStage}
              selectedStageId={gameState.selectedStageId}
              selectedLevelStages={selectedLevelStages}
              problemCountOverride={gameState.problemCountOverride}
              numberCountOverride={gameState.numberCountOverride}
              digitTypeOverride={gameState.digitTypeOverride}
              operationsOverride={gameState.operationsOverride}
              trainingHistory={gameState.trainingHistory}
              selectedLevelEvaluation={selectedLevelEvaluation}
              selectedStageEvaluation={selectedStageEvaluation}
              nextTrainingRecommendation={nextTrainingRecommendation}
              storageFeedback={storageFeedback}
              onSelectLevel={selectTrainingLevel}
              onSelectStage={selectTrainingStage}
              onProblemCountOverride={updateProblemCountOverride}
              onNumberCountOverride={updateNumberCountOverride}
              onDigitTypeOverride={updateDigitTypeOverride}
              onOperationsOverride={updateOperationsOverride}
              onResetSavedGameState={resetSavedGameState}
              onBluetoothNotification={handleBluetoothNotification}
            />
          </SettingsScreen>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 px-2 pb-2">
        <div className="mx-auto grid max-w-5xl grid-cols-7 gap-1 rounded-[30px] border-4 border-white bg-white/90 p-2 shadow-[0_-12px_34px_rgba(14,116,144,0.2)] backdrop-blur">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-[22px] border-2 text-[10px] font-black transition active:translate-y-1 sm:text-sm ${
                  active
                    ? `border-white bg-gradient-to-b ${tab.active} shadow-[0_6px_0_rgba(15,23,42,0.16)]`
                    : 'border-transparent bg-transparent text-slate-500 hover:bg-sky-50'
                }`}
              >
                <Icon className={`h-6 w-6 ${active ? tab.color : 'text-slate-400'}`} />
                <span className={active ? 'text-slate-900' : ''}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function TrainingView({
  problems,
  currentProblem,
  currentProblemIndex,
  totalProblems,
  correctCount,
  wrongCount,
  answer,
  feedback,
  submissionResult,
  lastRewards,
  lastTrainingEffects,
  setCompleteRewards,
  completedTrainingSummary,
  isSetComplete,
  bluetoothInput,
  selectedLevelConfig,
  effectiveProblemCount,
  effectiveNumberCountLabel,
  effectiveDigitTypeLabel,
  effectiveOperationsLabel,
  usesFallbackGenerator,
  activeOwnedDinosaur,
  ownedDinosaurs,
  onSelectAdjacentDinosaur,
  onAnswer,
  onCheck,
  onChooseProblem,
  onRestartTraining,
  onGoToDino,
  onGoToHatchery,
}: {
  problems: TrainingProblem[];
  currentProblem: TrainingProblem;
  currentProblemIndex: number;
  totalProblems: number;
  correctCount: number;
  wrongCount: number;
  answer: string;
  feedback: string;
  submissionResult: SubmissionResult;
  lastRewards: Reward[];
  lastTrainingEffects: string[];
  setCompleteRewards: Reward[];
  completedTrainingSummary: CompletedTrainingSummary | null;
  isSetComplete: boolean;
  bluetoothInput: BluetoothNotificationPayload | null;
  selectedLevelConfig: AbacusLevelConfig | null;
  effectiveProblemCount: number;
  effectiveNumberCountLabel: string;
  effectiveDigitTypeLabel: string;
  effectiveOperationsLabel: string;
  usesFallbackGenerator: boolean;
  activeOwnedDinosaur: OwnedDinosaur;
  ownedDinosaurs: OwnedDinosaur[];
  onSelectAdjacentDinosaur: (direction: -1 | 1) => void;
  onAnswer: (value: string) => void;
  onCheck: () => void;
  onChooseProblem: (index: number) => void;
  onRestartTraining: () => void;
  onGoToDino: () => void;
  onGoToHatchery: () => void;
}) {
  const bluetoothStatus = bluetoothInput ? 'Bluetooth 입력 수신' : 'Bluetooth 입력 대기';
  const bluetoothStatusTone = bluetoothInput ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800';
  const activeDinosaur = ownedDinosaurToDinosaurState(activeOwnedDinosaur);
  const canSubmitAnswer = activeDinosaur.stamina > 0 && !isSetComplete;
  const staminaMessage = getDinoStaminaMessage(activeDinosaur.stamina);
  const dinoReaction = getTrainingDinoReaction({ isSetComplete, submissionResult, stamina: activeDinosaur.stamina });
  const answerFeedback = getAnswerFeedbackText({ feedback, isSetComplete, submissionResult, stamina: activeDinosaur.stamina });
  const problemExpression = currentProblem.expressionText ?? currentProblem.displayText;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section className="game-panel p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-3xl font-black text-emerald-950">오늘의 주산훈련</h3>
            <p className="mt-1 font-black text-emerald-700/70">
              {isSetComplete ? `세트 완료! 정답 ${correctCount}/${totalProblems}` : `문제 ${currentProblemIndex + 1}/${totalProblems} · 정답 ${correctCount}개 · 오답 시도 ${wrongCount}회`}
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border-4 border-white px-4 py-2 text-xs font-black shadow-sm ${bluetoothStatusTone}`}>
            <Bluetooth className="h-4 w-4" />
            {bluetoothStatus}
          </div>
        </div>

        <div className="mb-5 rounded-[28px] border-4 border-white bg-white/82 p-4 shadow-sm">
          {selectedLevelConfig ? (
            <>
              <p className="text-sm font-black text-cyan-700">
                현재 훈련: {selectedLevelConfig.title} · {selectedLevelConfig.summary}
              </p>
              <p className="mt-1 text-xs font-black text-slate-500">문제 진행률: 문제 {Math.min(currentProblemIndex + 1, totalProblems)}/{totalProblems}</p>
              <p className="mt-1 text-xs font-black text-slate-500">
                {effectiveProblemCount}문제 · {effectiveNumberCountLabel} 수 · {effectiveDigitTypeLabel} · {effectiveOperationsLabel}
              </p>
              {usesFallbackGenerator && <p className="mt-1 text-xs font-black text-amber-700">이 단계는 임시 생성 규칙으로 연동 중입니다.</p>}
            </>
          ) : (
            <p className="text-sm font-black text-slate-500">선택된 교재 단계 정보를 찾지 못했어요.</p>
          )}
        </div>

        {isSetComplete ? (
          <div className="rounded-[34px] border-4 border-white bg-gradient-to-b from-lime-100 via-white to-amber-100 p-5 shadow-inner md:p-8">
            <TrainingCompletePanel
              summary={completedTrainingSummary}
              totalProblems={totalProblems}
              correctCount={correctCount}
              wrongCount={wrongCount}
              setCompleteRewards={setCompleteRewards}
              activeDinosaurName={activeDinosaur.name}
              lastTrainingEffects={lastTrainingEffects}
              onRestartTraining={onRestartTraining}
              onGoToDino={onGoToDino}
              onGoToHatchery={onGoToHatchery}
            />
          </div>
        ) : (
          <div className="rounded-[34px] border-4 border-white bg-gradient-to-b from-cyan-100 via-white to-amber-100 p-5 shadow-inner md:p-8">
            <CurrentProblemCard
              answer={answer}
              answerFeedback={answerFeedback}
              bluetoothInput={bluetoothInput}
              canSubmitAnswer={canSubmitAnswer}
              currentProblemIndex={currentProblemIndex}
              onAnswer={onAnswer}
              onCheck={onCheck}
              problemExpression={problemExpression}
              staminaMessage={staminaMessage}
              totalProblems={totalProblems}
            />
          </div>
        )}

        <details className="mt-5 rounded-[24px] border-4 border-dashed border-cyan-100 bg-white/60 px-4 py-3">
          <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용: 생성된 문제 전체 보기</summary>
          <div className="mt-3 grid gap-2 rounded-[22px] border-4 border-white bg-white/70 px-4 py-3 text-xs font-black text-slate-600 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-emerald-800">마지막 Bluetooth 수신값</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">{bluetoothInput?.parsedNumber ?? '-'}</span>
            </div>
            <p className="break-all font-mono font-bold text-slate-500">raw: {bluetoothInput?.raw ?? '-'}</p>
            <p className="break-all font-mono font-bold text-slate-500">hex: {bluetoothInput?.hex ?? '-'}</p>
            <p className="break-all font-mono font-bold text-slate-500">text: {bluetoothInput?.text ?? '-'}</p>
            {bluetoothInput?.isConfirmSignal && <p className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-800">confirm signal received</p>}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {problems.map((problem, index) => (
              <button
                key={problem.id}
                onClick={() => onChooseProblem(index)}
                className={`min-h-24 rounded-[26px] border-4 px-4 text-left shadow-sm transition active:translate-y-1 ${
                  currentProblemIndex === index ? 'border-white bg-gradient-to-b from-cyan-200 to-sky-200 text-cyan-950 shadow-[0_6px_0_#67e8f9]' : 'border-white bg-white/80 text-slate-600'
                }`}
              >
                <p className="text-xs font-black text-cyan-700">미션 {index + 1}</p>
                <p className="mt-1 text-3xl font-black">{problem.expressionText ?? problem.displayText}</p>
              </button>
            ))}
          </div>
        </details>
      </section>

      <aside className="grid content-start gap-3">
        <ActiveDinoReactionPanel
          dinosaur={activeDinosaur}
          activeOwnedDinosaur={activeOwnedDinosaur}
          ownedDinosaurs={ownedDinosaurs}
          reaction={dinoReaction}
          staminaMessage={staminaMessage}
          onSelectAdjacentDinosaur={onSelectAdjacentDinosaur}
        />
        <div className="rounded-[30px] border-4 border-white bg-white/84 p-5 shadow-lg">
          <h4 className="text-xl font-black text-emerald-950">훈련 메모</h4>
          <div className="mt-3 grid gap-2">
            {lastRewards.length > 0 ? (
              lastRewards.map((reward) => (
                <p key={reward.id} className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
                  {reward.label}
                </p>
              ))
            ) : (
              <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-500">정답 후 여기에 표시됩니다.</p>
            )}
          </div>
          <p className="mt-3 rounded-[20px] bg-cyan-50 px-4 py-3 text-sm font-black leading-relaxed text-cyan-800">
            훈련 중에는 체력만 확인해요. 경험치와 기분 변화는 완료 화면에서 정리됩니다.
          </p>
        </div>
      </aside>
    </div>
  );
}

function CurrentProblemCard({
  answer,
  answerFeedback,
  bluetoothInput,
  canSubmitAnswer,
  currentProblemIndex,
  onAnswer,
  onCheck,
  problemExpression,
  staminaMessage,
  totalProblems,
}: {
  answer: string;
  answerFeedback: string;
  bluetoothInput: BluetoothNotificationPayload | null;
  canSubmitAnswer: boolean;
  currentProblemIndex: number;
  onAnswer: (value: string) => void;
  onCheck: () => void;
  problemExpression: string;
  staminaMessage: string;
  totalProblems: number;
}) {
  return (
    <>
      <div className="text-center">
        <p className="mb-2 text-sm font-black text-cyan-700">문제 {currentProblemIndex + 1}/{totalProblems}</p>
        <p className="mx-auto max-w-4xl break-words text-5xl font-black leading-tight text-emerald-950 md:text-7xl">{problemExpression}</p>
      </div>
      <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={answer}
          onChange={(event) => onAnswer(event.target.value)}
          disabled={!canSubmitAnswer}
          inputMode="numeric"
          placeholder="답 입력"
          className="min-h-20 rounded-[24px] border-4 border-white bg-white px-5 text-4xl font-black text-slate-900 shadow-inner outline-none focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
        <button
          disabled={!canSubmitAnswer}
          onClick={onCheck}
          className="game-button min-h-20 bg-gradient-to-b from-cyan-400 to-cyan-500 shadow-cyan disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="h-6 w-6" />
          정답 확인
        </button>
      </div>
      <AbacusInputGuide bluetoothInput={bluetoothInput} />
      {!canSubmitAnswer && (
        <p className="mx-auto mt-3 max-w-xl rounded-[20px] border-4 border-white bg-amber-100 px-4 py-3 text-center text-sm font-black text-amber-900">
          {staminaMessage}
        </p>
      )}
      <p className="mx-auto mt-5 max-w-xl rounded-[24px] border-4 border-white bg-white/90 px-5 py-4 text-center text-lg font-black text-emerald-900 shadow-sm">{answerFeedback}</p>
    </>
  );
}

function AbacusInputGuide({ bluetoothInput }: { bluetoothInput: BluetoothNotificationPayload | null }) {
  return (
    <div className="mx-auto mt-4 grid max-w-xl gap-2 rounded-[22px] border-4 border-white bg-white/70 px-4 py-3 text-sm font-black text-slate-600 shadow-sm">
      <p className="text-center text-emerald-900">주판알을 답에 맞게 움직인 뒤 리턴 버튼을 눌러주세요.</p>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-cyan-800">Bluetooth 제출값</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">{bluetoothInput?.parsedNumber ?? '-'}</span>
      </div>
    </div>
  );
}

function ActiveDinoReactionPanel({
  dinosaur,
  activeOwnedDinosaur,
  ownedDinosaurs,
  reaction,
  staminaMessage,
  onSelectAdjacentDinosaur,
}: {
  dinosaur: DinosaurState;
  activeOwnedDinosaur: OwnedDinosaur;
  ownedDinosaurs: OwnedDinosaur[];
  reaction: string;
  staminaMessage: string;
  onSelectAdjacentDinosaur: (direction: -1 | 1) => void;
}) {
  const activeSpecies = dinosaurSpecies.find((species) => species.speciesId === activeOwnedDinosaur.speciesId);
  const uniqueOwnedCount = getUniqueOwnedDinosaurs(ownedDinosaurs).length;

  return (
    <div className="rounded-[30px] border-4 border-white bg-white/86 p-5 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          aria-label="이전 훈련 공룡"
          disabled={uniqueOwnedCount <= 1}
          onClick={() => onSelectAdjacentDinosaur(-1)}
          className="flex h-12 w-12 items-center justify-center rounded-[18px] border-4 border-white bg-lime-100 text-emerald-800 shadow-sm transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
        <div className="text-center">
          <p className="text-sm font-black text-cyan-700">{dinosaur.name}와 함께 훈련 중</p>
          <h4 className="text-2xl font-black text-emerald-950">{activeSpecies?.displayName ?? activeOwnedDinosaur.speciesId}</h4>
        </div>
        <button
          aria-label="다음 훈련 공룡"
          disabled={uniqueOwnedCount <= 1}
          onClick={() => onSelectAdjacentDinosaur(1)}
          className="flex h-12 w-12 items-center justify-center rounded-[18px] border-4 border-white bg-lime-100 text-emerald-800 shadow-sm transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      </div>
      <div className="flex min-h-36 items-end justify-center rounded-[28px] border-4 border-white bg-gradient-to-b from-sky-100 via-emerald-100 to-lime-200 p-3 shadow-inner">
        <DinoAvatar size="small" />
      </div>
      <div className="mt-4 rounded-[22px] border-4 border-white bg-white/80 p-3 shadow-sm">
        <div className="mb-2 flex justify-between text-sm font-black text-emerald-900">
          <span>체력</span>
          <span>{dinosaur.stamina}%</span>
        </div>
        <div className="h-5 overflow-hidden rounded-full bg-slate-100 shadow-inner">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-500" style={{ width: `${dinosaur.stamina}%` }} />
        </div>
        <p className="mt-2 text-xs font-black text-emerald-700">{staminaMessage}</p>
      </div>
      <p className="mt-3 rounded-[20px] bg-cyan-50 px-4 py-3 text-center text-sm font-black leading-relaxed text-cyan-800">{reaction}</p>
      <p className="mt-2 rounded-full bg-violet-100 px-4 py-2 text-center text-xs font-black text-violet-800">착용: {formatEquippedCostumes(activeOwnedDinosaur.equippedCostumes)}</p>
    </div>
  );
}

function TrainingCompletePanel({
  summary,
  totalProblems,
  correctCount,
  wrongCount,
  setCompleteRewards,
  activeDinosaurName,
  lastTrainingEffects,
  onRestartTraining,
  onGoToDino,
  onGoToHatchery,
}: {
  summary: CompletedTrainingSummary | null;
  totalProblems: number;
  correctCount: number;
  wrongCount: number;
  setCompleteRewards: Reward[];
  activeDinosaurName: string;
  lastTrainingEffects: string[];
  onRestartTraining: () => void;
  onGoToDino: () => void;
  onGoToHatchery: () => void;
}) {
  const hatchReward = summary?.hatchItems[0];
  const hatchItem = hatchReward ? getHatchItemConfig(hatchReward.itemId) : null;
  const rewardText = setCompleteRewards.length > 0 ? setCompleteRewards.map((reward) => reward.label).join(', ') : '정산 대기';

  return (
    <div className="mx-auto mt-5 grid max-w-xl gap-3 rounded-[28px] border-4 border-white bg-lime-100 px-5 py-5 text-emerald-950 shadow-sm">
      <div className="text-center">
        <h4 className="text-3xl font-black">훈련 완료!</h4>
        <p className="mt-1 text-sm font-black text-emerald-700">{activeDinosaurName}도 끝까지 함께했어요!</p>
      </div>
      <div className="grid gap-2 rounded-[22px] bg-white/80 p-4 text-sm font-black text-slate-700">
        <div className="flex justify-between gap-3">
          <span>총 문제</span>
          <span>{summary?.totalProblems ?? totalProblems}문제</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>정답</span>
          <span>{summary?.correctCount ?? correctCount}개</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>오답 시도</span>
          <span>{summary?.wrongCount ?? wrongCount}회</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>정확도</span>
          <span>{summary ? `${summary.accuracy}%` : '정산 중'}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>획득 코인</span>
          <span>{summary ? `${summary.coins}코인` : '정산 중'}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>공룡 경험치</span>
          <span>{summary ? `+${summary.dinosaurExp}` : '정산 중'}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>행복감 변화</span>
          <span>{summary ? `+${summary.happiness}` : '정산 중'}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span>획득 아이템</span>
          <span>{hatchReward ? `${hatchItem?.name ?? hatchReward.itemId} ${hatchReward.quantity}개` : '정산 중'}</span>
        </div>
      </div>
      <div className="rounded-[20px] bg-white/70 px-4 py-3 text-sm font-black text-emerald-800">
        <p>공룡 상태 변화: 경험치와 행복감이 반영됐고, 체력은 훈련 중 문제를 맞힐 때마다 소모됐어요.</p>
        {lastTrainingEffects.length > 0 && (
          <div className="mt-2 grid gap-2">
            {lastTrainingEffects.map((effect) => (
              <p key={effect} className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
                {effect}
              </p>
            ))}
          </div>
        )}
      </div>
      <p className="rounded-[20px] bg-white/70 px-4 py-3 text-center text-sm font-black text-emerald-800">세트 완료 보상: {rewardText}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <button onClick={onRestartTraining} className="rounded-full bg-cyan-500 px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#0891b2] transition active:translate-y-1 active:shadow-none">
          다시 훈련하기
        </button>
        <button onClick={onGoToDino} className="rounded-full bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#b45309] transition active:translate-y-1 active:shadow-none">
          우리 공룡 보러가기
        </button>
        <button onClick={onGoToHatchery} className="rounded-full bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-[0_4px_0_#c2410c] transition active:translate-y-1 active:shadow-none">
          알 부화장 가기
        </button>
      </div>
    </div>
  );
}

function TrainingDinosaurCard({
  dinosaur,
  activeOwnedDinosaur,
  ownedDinosaurs,
  onSelectAdjacentDinosaur,
}: {
  dinosaur: DinosaurState;
  activeOwnedDinosaur: OwnedDinosaur;
  ownedDinosaurs: OwnedDinosaur[];
  onSelectAdjacentDinosaur: (direction: -1 | 1) => void;
}) {
  const activeSpecies = dinosaurSpecies.find((species) => species.speciesId === activeOwnedDinosaur.speciesId);
  const uniqueOwnedCount = getUniqueOwnedDinosaurs(ownedDinosaurs).length;

  return (
    <div className="rounded-[30px] border-4 border-white bg-white/86 p-5 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          aria-label="이전 훈련 공룡"
          disabled={uniqueOwnedCount <= 1}
          onClick={() => onSelectAdjacentDinosaur(-1)}
          className="flex h-12 w-12 items-center justify-center rounded-[18px] border-4 border-white bg-lime-100 text-emerald-800 shadow-sm transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
        <div className="text-center">
          <p className="text-sm font-black text-cyan-700">함께 훈련 중!</p>
          <h4 className="text-2xl font-black text-emerald-950">{dinosaur.name}</h4>
        </div>
        <button
          aria-label="다음 훈련 공룡"
          disabled={uniqueOwnedCount <= 1}
          onClick={() => onSelectAdjacentDinosaur(1)}
          className="flex h-12 w-12 items-center justify-center rounded-[18px] border-4 border-white bg-lime-100 text-emerald-800 shadow-sm transition active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      </div>
      <div className="flex min-h-44 items-end justify-center rounded-[28px] border-4 border-white bg-gradient-to-b from-sky-100 via-emerald-100 to-lime-200 p-3 shadow-inner">
        <DinoAvatar size="small" />
      </div>
      <p className="mt-3 rounded-full bg-amber-100 px-4 py-2 text-center text-sm font-black text-amber-800">
        {activeSpecies?.displayName ?? activeOwnedDinosaur.speciesId} · {rarityLabels[activeOwnedDinosaur.rarity]} · Lv. {dinosaur.level}
      </p>
      <p className="mt-2 rounded-full bg-violet-100 px-4 py-2 text-center text-sm font-black text-violet-800">착용: {formatEquippedCostumes(activeOwnedDinosaur.equippedCostumes)}</p>
      <div className="mt-4 grid gap-3">
        <Meter label="EXP" value={dinosaur.exp} tone="from-cyan-400 to-sky-500" />
        <Meter label="행복" value={dinosaur.mood} tone="from-pink-400 to-rose-500" />
        <Meter label="체력" value={dinosaur.stamina} tone="from-emerald-400 to-lime-500" />
        <Meter label="포만감" value={dinosaur.hunger} tone="from-amber-400 to-orange-500" />
      </div>
    </div>
  );
}

function OnboardingView({ onComplete }: { onComplete: (profileInput: { childName: string; ageOrGrade: string; dinosaurName: string }) => void }) {
  const [childName, setChildName] = useState('');
  const [ageOrGrade, setAgeOrGrade] = useState('');
  const [dinosaurName, setDinosaurName] = useState('');

  function submitProfile() {
    onComplete({ childName, ageOrGrade, dinosaurName });
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-b from-sky-200 via-cyan-100 to-lime-100 p-4 text-slate-800 md:p-8">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <section className="relative grid w-full gap-6 overflow-hidden rounded-[40px] border-4 border-white bg-white/84 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.22)] backdrop-blur md:grid-cols-[1fr_0.9fr] md:p-10">
          <SkyDecor />
          <div className="relative z-10">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border-2 border-cyan-200 bg-white px-5 py-2 text-sm font-black text-cyan-800 shadow-sm">
              <Sparkles className="h-4 w-4" />
              처음 만나는 공룡 친구
            </div>
            <h1 className="text-4xl font-black leading-tight text-emerald-950 md:text-6xl">프로필 만들기</h1>
            <p className="mt-4 max-w-lg text-lg font-black leading-relaxed text-emerald-800/80">이름을 정하고 대표 공룡과 함께 주산 모험을 시작해요.</p>

            <div className="mt-7 grid gap-4">
              <ProfileInput label="아이 이름/닉네임" value={childName} placeholder="친구" onChange={setChildName} />
              <ProfileInput label="나이 또는 학년" value={ageOrGrade} placeholder="8살 / 초2" onChange={setAgeOrGrade} />
              <ProfileInput label="대표 공룡 이름" value={dinosaurName} placeholder="몽이" onChange={setDinosaurName} />
            </div>

            <button
              onClick={submitProfile}
              className="mt-7 inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-[24px] border-4 border-white bg-gradient-to-b from-cyan-400 to-cyan-500 px-8 text-xl font-black text-white shadow-[0_8px_0_#0891b2,0_18px_24px_rgba(8,145,178,0.24)] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_4px_0_#0891b2] sm:w-fit"
            >
              모험 시작하기
              <Play className="h-6 w-6 fill-white" />
            </button>
          </div>

          <div className="relative z-10 flex min-h-[420px] items-end justify-center rounded-[36px] bg-gradient-to-b from-sky-100 via-emerald-50 to-lime-200 p-6 shadow-inner">
            <div className="absolute bottom-0 left-0 right-0 h-28 rounded-t-[50%] bg-lime-300/70" />
            <div className="absolute left-8 top-8 rounded-[24px] border-4 border-white bg-white/90 px-5 py-3 shadow-lg">
              <p className="text-sm font-black text-cyan-700">시작 공룡</p>
              <p className="text-3xl font-black text-slate-950">{dinosaurName.trim() || '몽이'}</p>
            </div>
            <DinoAvatar size="hero" />
          </div>
        </section>
      </main>
    </div>
  );
}

function ProfileInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="block rounded-[24px] border-4 border-white bg-white/90 p-4 shadow-sm">
      <span className="text-sm font-black text-emerald-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-12 w-full rounded-[18px] bg-slate-50 px-4 text-lg font-black text-slate-900 outline-none focus:bg-cyan-50"
      />
    </label>
  );
}

function AdventureView() {
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <section className="rounded-[34px] border-4 border-white bg-gradient-to-b from-emerald-100 to-lime-100 p-6 shadow-lg">
        <h3 className="text-3xl font-black text-emerald-950">모험 준비</h3>
        <p className="mt-3 font-black leading-relaxed text-emerald-700/80">추후 주산훈련 결과와 연결되어 알 조각과 단서를 얻는 탐험 콘텐츠입니다.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {mapCards.map((card) => (
          <article key={card.name} className="rounded-[32px] border-4 border-white bg-white/86 p-5 shadow-lg">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-b from-emerald-200 to-lime-300 text-emerald-800 shadow-inner">
              <Map className="h-12 w-12" />
            </div>
            <h4 className="text-2xl font-black text-emerald-950">{card.name}</h4>
            <p className="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">{card.state}</p>
            <p className="mt-3 font-black text-slate-500">{card.reward}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

const rarityLabels: Record<OwnedDinosaur['rarity'], string> = {
  common: '일반',
  rare: '희귀',
  epic: '영웅',
  special: '특별',
  legendary: '전설',
};

function SettingsView({
  userProfile,
  levels,
  selectedLevel,
  selectedLevelConfig,
  selectedStage,
  selectedStageId,
  selectedLevelStages,
  problemCountOverride,
  numberCountOverride,
  digitTypeOverride,
  operationsOverride,
  trainingHistory,
  selectedLevelEvaluation,
  selectedStageEvaluation,
  nextTrainingRecommendation,
  storageFeedback,
  onSelectLevel,
  onSelectStage,
  onProblemCountOverride,
  onNumberCountOverride,
  onDigitTypeOverride,
  onOperationsOverride,
  onResetSavedGameState,
  onBluetoothNotification,
}: {
  userProfile: UserProfile | null;
  levels: AbacusLevelConfig[];
  selectedLevel: number;
  selectedLevelConfig: AbacusLevelConfig | null;
  selectedStage: AbacusStageConfig | null;
  selectedStageId: string;
  selectedLevelStages: AbacusStageConfig[];
  problemCountOverride?: ProblemCountOverride;
  numberCountOverride: NumberCountOverride;
  digitTypeOverride: DigitTypeOverride;
  operationsOverride: OperationsOverride;
  trainingHistory: TrainingSessionRecord[];
  selectedLevelEvaluation: TrainingProgressEvaluation;
  selectedStageEvaluation: TrainingProgressEvaluation;
  nextTrainingRecommendation: NextTrainingRecommendation;
  storageFeedback: string;
  onSelectLevel: (level: number) => void;
  onSelectStage: (stageId: string) => void;
  onProblemCountOverride: (value: ProblemCountOverride | 'stage-default') => void;
  onNumberCountOverride: (value: NumberCountOverride) => void;
  onDigitTypeOverride: (value: DigitTypeOverride) => void;
  onOperationsOverride: (value: OperationsOverride) => void;
  onResetSavedGameState: () => void;
  onBluetoothNotification: (payload: BluetoothNotificationPayload) => void;
}) {
  const settingSummary = getLevelSettingSummary(selectedLevelStages);
  const effectiveProblemCount = getEffectiveProblemCount(selectedLevelConfig, selectedStage, problemCountOverride);
  const effectiveNumberCountLabel = numberCountOverride === 'stage-default' ? settingSummary.numberCount : `${numberCountOverride}개`;
  const effectiveDigitTypeLabel = formatDigitTypeLabel(getEffectiveDigitType(selectedStage, digitTypeOverride));
  const effectiveOperationsLabel = getEffectiveOperationsLabel(operationsOverride, selectedLevelStages);
  const isSelectedOperationsRecommended = isOperationsOverrideRecommended(operationsOverride, selectedLevelStages);

  return (
    <div className="grid gap-5">
      <section className="rounded-[34px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h3 className="text-3xl font-black text-slate-950">설정</h3>
        <p className="mt-2 font-black text-slate-500">아이의 실제 교재 진도에 맞춰 복습할 단계를 고릅니다.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[260px_1fr]">
          <label className="grid gap-2 text-sm font-black text-emerald-800">
            교재 단계
            <select
              value={String(selectedLevel)}
              onChange={(event) => onSelectLevel(Number(event.target.value))}
              className="min-h-12 rounded-[18px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-cyan-300"
            >
              {levels.map((level) => (
                <option key={level.level} value={level.level}>
                  {level.title} · {level.summary}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-[24px] bg-cyan-50 px-4 py-3">
            <p className="text-sm font-black text-cyan-700">
              선택됨: {selectedLevelConfig?.title ?? `${selectedLevel}단계`} · {selectedLevelConfig?.summary ?? '단계 정보 없음'}
            </p>
            <p className="mt-1 text-xs font-black text-slate-500">
              {selectedLevelConfig?.status === 'draft' ? '교재 재확인 후 수정 예정인 draft 단계입니다.' : selectedLevelConfig?.status === 'mvp' ? '현재 앱에서 우선 연결할 단계입니다.' : '문제 생성 연동은 추후 단계입니다.'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-black text-emerald-800">
            한 세트 문제 수
            <select
              value={problemCountOverride ? String(problemCountOverride) : 'stage-default'}
              onChange={(event) => {
                const value = event.target.value;
                onProblemCountOverride(value === 'stage-default' ? 'stage-default' : (Number(value) as ProblemCountOverride));
              }}
              className="min-h-12 rounded-[18px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-cyan-300"
            >
              <option value="stage-default">단계 기본값 ({getRecommendedProblemCount(selectedLevelConfig, selectedStage)}문제)</option>
              <option value="5">5문제</option>
              <option value="10">10문제</option>
              <option value="15">15문제</option>
              <option value="20">20문제</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-emerald-800">
            숫자 개수 / 행 수
            <select
              value={String(numberCountOverride)}
              onChange={(event) => onNumberCountOverride(normalizeNumberCountOverride(event.target.value))}
              className="min-h-12 rounded-[18px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-cyan-300"
            >
              <option value="stage-default">{formatNumberCountOverride('stage-default', selectedLevelStages)}</option>
              <option value="3">3개</option>
              <option value="4">4개</option>
              <option value="5">5개</option>
              <option value="6">6개</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-emerald-800">
            숫자 자리수
            <select
              value={digitTypeOverride}
              onChange={(event) => onDigitTypeOverride(normalizeDigitTypeOverride(event.target.value))}
              className="min-h-12 rounded-[18px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-cyan-300"
            >
              <option value="stage-default">{formatDigitTypeOverride('stage-default', selectedStage)}</option>
              <option value="one-digit">한 자리</option>
              <option value="two-digit">두 자리</option>
              <option value="mixed-digit">한 자리 + 두 자리</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-emerald-800">
            연산 방식
            <select
              value={operationsOverride}
              onChange={(event) => onOperationsOverride(normalizeOperationsOverride(event.target.value))}
              className="min-h-12 rounded-[18px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-cyan-300"
            >
              <option value="stage-default">{formatOperationsOverride('stage-default', selectedLevelStages)}</option>
              <option value="add">덧셈만</option>
              <option value="subtract">뺄셈만</option>
              <option value="mixed">덧셈 + 뺄셈</option>
            </select>
          </label>
        </div>
        <p className="mt-3 rounded-[20px] bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">
          한 세트 문제 수, 숫자 개수, 숫자 자리수, 연산 방식은 현재 훈련 문제 생성에 반영됩니다.
        </p>
        {!isSelectedOperationsRecommended && (
          <p className="mt-2 rounded-[20px] bg-amber-50 px-4 py-3 text-xs font-black text-amber-800">
            선택한 연산 방식은 현재 교재 단계에서는 권장하지 않거나 준비 중입니다.
          </p>
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SettingChip label="숫자 개수" value={effectiveNumberCountLabel} />
          <SettingChip label="숫자 크기" value={effectiveDigitTypeLabel} />
          <SettingChip label="세트 문제 수" value={`${effectiveProblemCount}문제`} />
          <SettingChip label="연산 방식" value={effectiveOperationsLabel} />
        </div>
        <details className="mt-4 rounded-[24px] border-4 border-dashed border-cyan-100 bg-white/60 px-4 py-3">
          <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용 세부 단계 설정</summary>
          <p className="mt-2 text-xs font-black text-slate-500">세부 stage id는 내부 문제 생성과 개발자 모드용입니다. 기본 부모 설정 화면에서는 교재 단계만 사용합니다.</p>
          <label className="mt-3 grid gap-2 text-xs font-black text-emerald-800">
            내부 stage
            <select
              value={selectedStageId}
              onChange={(event) => onSelectStage(event.target.value)}
              className="min-h-11 rounded-[16px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-cyan-300"
            >
              {(selectedLevelConfig?.stageIds.length ? selectedLevelConfig.stageIds : [selectedStageId]).map((stageId) => {
                const stage = getStageById(stageId);
                return (
                  <option key={stageId} value={stageId} disabled={!stage}>
                    {stageId} · {stage?.title ?? '데이터 준비 중'}
                  </option>
                );
              })}
            </select>
          </label>
          <p className="mt-2 text-xs font-black text-slate-500">
            현재 내부 단계: {selectedStage ? `${selectedStage.id} · ${selectedStage.title} · ${selectedStage.summary}` : '연결된 stage 데이터 없음'}
          </p>
          <p className="mt-1 text-xs font-black text-slate-500">
            자리수 설정: {digitTypeOverride} → {effectiveDigitTypeLabel} · generatorStatus: {selectedStage?.generatorStatus ?? '없음'} · curriculumStatus: {selectedStage?.curriculumStatus ?? '없음'}
          </p>
        </details>
        <details className="mt-4 rounded-[24px] border-4 border-dashed border-lime-100 bg-white/60 px-4 py-3">
          <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용: 학습 상태 평가</summary>
          <div className="mt-3 grid gap-2 text-xs font-black text-slate-600">
            <p className="rounded-[18px] bg-white/80 px-4 py-3">
              현재 단계: {selectedLevel}단계 · 최근 3세트 평균 정확도 {selectedLevelEvaluation.recentAccuracy}% · 상태 {formatMasteryStatus(selectedLevelEvaluation.status)}
            </p>
            <p className="rounded-[18px] bg-white/80 px-4 py-3">
              현재 stage: {selectedStageId} · 최근 3세트 평균 정확도 {selectedStageEvaluation.recentAccuracy}% · 오답 시도 {selectedStageEvaluation.recentWrongCount}회 · 상태 {formatMasteryStatus(selectedStageEvaluation.status)}
            </p>
            <p className="rounded-[18px] bg-white/80 px-4 py-3">
              추천: {nextTrainingRecommendation.message}
              {nextTrainingRecommendation.suggestedLevel ? ` · 제안 단계 ${nextTrainingRecommendation.suggestedLevel}단계` : ''}
              {nextTrainingRecommendation.suggestedStageId ? ` · ${nextTrainingRecommendation.suggestedStageId}` : ''}
            </p>
          </div>
        </details>
        <details className="mt-4 rounded-[24px] border-4 border-dashed border-emerald-100 bg-white/60 px-4 py-3">
          <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용: 최근 훈련 기록</summary>
          <div className="mt-3 grid gap-2">
            {trainingHistory.length > 0 ? (
              trainingHistory.slice(0, 10).map((record) => (
                <p key={record.id} className="rounded-[18px] bg-white/80 px-4 py-3 text-xs font-black text-slate-600">
                  {record.selectedLevel}단계 / {record.problemCount}문제 / {record.numberCount}개 수 / {formatDigitTypeLabel(record.digitType)} / {formatOperationModeLabel(record.operationMode)} / 정확도 {record.accuracy}% /{' '}
                  {new Date(record.completedAt).toLocaleString()}
                </p>
              ))
            ) : (
              <p className="rounded-[18px] bg-white/80 px-4 py-3 text-xs font-black text-slate-500">아직 저장된 훈련 기록이 없습니다.</p>
            )}
          </div>
        </details>
      </section>
      <section className="rounded-[34px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h3 className="text-2xl font-black text-emerald-950">프로필</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SettingChip label="이름" value={userProfile?.childName ?? '미설정'} />
          <SettingChip label="나이/학년" value={userProfile?.ageOrGrade ?? '미설정'} />
          <SettingChip label="대표 공룡" value={userProfile?.dinosaurName ?? '미설정'} />
          <SettingChip label="부모 모드" value={userProfile?.parentModeEnabled ? '켜짐' : '꺼짐'} />
        </div>
      </section>
      <section className="rounded-[34px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h3 className="text-2xl font-black text-slate-950">저장 데이터</h3>
        <p className="mt-2 font-black text-slate-500">이 브라우저의 localStorage에 현재 코인, 공룡, 알, 인벤토리를 저장합니다.</p>
        <p className="mt-4 rounded-[22px] border-4 border-white bg-slate-50 px-4 py-3 font-black text-slate-700 shadow-sm">{storageFeedback}</p>
        <button
          onClick={onResetSavedGameState}
          className="mt-4 rounded-full bg-slate-800 px-5 py-3 text-sm font-black text-white shadow-[0_4px_0_#0f172a] transition active:translate-y-1 active:shadow-none"
        >
          프로필/저장 데이터 초기화
        </button>
      </section>
      <section className="rounded-[28px] border-4 border-dashed border-slate-300 bg-white/70 p-4 md:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-white">
            <Bluetooth className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-950">주산 입력 장치 연결 테스트</h4>
            <p className="text-sm font-bold text-slate-500">Bluetooth 주판 입력을 확인하는 개발자 테스트 영역입니다.</p>
          </div>
        </div>
        <div className="scale-[0.98] rounded-[24px] bg-white/70 p-2">
          <BluetoothTestPanel onNotification={onBluetoothNotification} />
        </div>
      </section>
    </div>
  );
}

function HeaderPill({ icon: Icon, label, tone }: { icon: typeof Coins; label: string; tone: 'coin' | 'level' | 'book' }) {
  const toneClass = {
    coin: 'from-amber-200 to-yellow-300 text-amber-950',
    level: 'from-pink-200 to-rose-300 text-rose-950',
    book: 'from-sky-200 to-cyan-300 text-sky-950',
  }[tone];

  return (
    <div className={`inline-flex min-h-12 items-center gap-2 rounded-full border-4 border-white bg-gradient-to-b px-4 text-sm font-black shadow-sm ${toneClass}`}>
      <Icon className="h-5 w-5" />
      {label}
    </div>
  );
}

function DinoAvatar({ size }: { size: 'small' | 'large' | 'hero' }) {
  const shellSize = size === 'hero' ? 'h-[360px] w-[360px]' : size === 'large' ? 'h-64 w-64' : 'h-28 w-28';
  const bodySize = size === 'hero' ? 'h-52 w-56' : size === 'large' ? 'h-36 w-40' : 'h-16 w-20';
  const headSize = size === 'hero' ? 'h-36 w-40' : size === 'large' ? 'h-24 w-28' : 'h-12 w-14';
  const eyeSize = size === 'hero' ? 'h-4 w-4' : size === 'large' ? 'h-3 w-3' : 'h-1.5 w-1.5';

  return (
    <div className={`relative z-10 ${shellSize} drop-shadow-2xl`} aria-label="초록 꼬마 공룡">
      <div className={`absolute bottom-[13%] left-1/2 ${bodySize} -translate-x-1/2 rounded-[45%] border-4 border-emerald-200 bg-emerald-400`} />
      <div className={`absolute left-1/2 top-[12%] ${headSize} -translate-x-1/2 rounded-[45%] border-4 border-emerald-200 bg-emerald-300`} />
      <div className="absolute left-[38%] top-[27%] h-[12%] w-[12%] rounded-full bg-white">
        <div className={`absolute left-1/2 top-1/2 ${eyeSize} -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800`} />
      </div>
      <div className="absolute right-[38%] top-[27%] h-[12%] w-[12%] rounded-full bg-white">
        <div className={`absolute left-1/2 top-1/2 ${eyeSize} -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800`} />
      </div>
      <div className="absolute left-1/2 top-[43%] h-[4%] w-[18%] -translate-x-1/2 rounded-full bg-emerald-700/35" />
      <div className="absolute bottom-[30%] left-[17%] h-[16%] w-[12%] rotate-[-20deg] rounded-full bg-emerald-300" />
      <div className="absolute bottom-[30%] right-[17%] h-[16%] w-[12%] rotate-[20deg] rounded-full bg-emerald-300" />
      <div className="absolute bottom-[4%] left-[34%] h-[18%] w-[13%] rounded-full bg-emerald-500" />
      <div className="absolute bottom-[4%] right-[34%] h-[18%] w-[13%] rounded-full bg-emerald-500" />
      <div className="absolute right-[5%] top-[52%] h-[18%] w-[30%] rotate-[28deg] rounded-full bg-emerald-300" />
      <div className="absolute left-1/2 top-[8%] h-[8%] w-[8%] -translate-x-1/2 rounded-full bg-amber-200" />
      <div className="absolute left-[42%] top-[7%] h-[6%] w-[6%] rounded-full bg-amber-200" />
      <div className="absolute right-[42%] top-[7%] h-[6%] w-[6%] rounded-full bg-amber-200" />
    </div>
  );
}

function RewardCard({ icon: Icon, title, value, tone }: { icon: typeof Coins; title: string; value: string; tone: string }) {
  return (
    <div className={`rounded-[30px] border-4 border-white bg-gradient-to-b p-5 shadow-lg ${tone}`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[20px] bg-white/80 shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-sm font-black opacity-80">{title}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-[22px] border-4 border-white bg-white/80 p-3 shadow-sm">
      <div className="mb-2 flex justify-between text-sm font-black text-emerald-900">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-6 overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SettingChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border-4 border-white bg-slate-50 px-4 py-3 shadow-sm">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-800">{value}</p>
    </div>
  );
}

function SkyDecor() {
  return (
    <>
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-yellow-200/80" />
      <div className="absolute bottom-0 left-0 right-0 h-28 rounded-t-[50%] bg-lime-300/60" />
      <div className="absolute left-1/2 top-8 h-12 w-36 rounded-full bg-white/70 blur-sm" />
    </>
  );
}
