import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Baby,
  Bluetooth,
  BookOpen,
  ChevronLeft,
  Coins,
  Egg,
  Map as MapIcon,
  Play,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import { BluetoothTestPanel, type BluetoothNotificationPayload } from './components/BluetoothTestPanel';
import { NavigationArrow } from './components/NavigationArrow';
import { DexScreen, DinosaurRoomScreen, HatcheryScreen, HomeScreen, PlaygroundScreen, SettingsScreen, ShopScreen, TrainingScreen } from './components/screens';
import type { HatchResult } from './components/screens/HatcheryScreen';
import { getEggItemConfig, getEggRequiredFragments, getFoodItemConfig, getHatchItemConfig, getItemConfig, itemConfigs, type DinosaurStatEffect } from './config/itemConfig';
import { trainingFatigueConfig } from './config/trainingFatigueConfig';
import { coinRewardOptions, defaultCoinRewardMultiplier, type CoinRewardMultiplier } from './config/rewardConfig';
import { abacusLevels, getAbacusLevel, getDefaultStageIdForLevel, getLevelForStageId, getStagesForLevel } from './data/abacusLevels';
import { abacusStages, getGeneratorFallbackStage, getStageById } from './data/abacusStages';
import { adventureAreas } from './data/adventures';
import { dinosaurSpecies, getDinosaurSpecies, getStarterSelectableSpecies } from './data/dinosaurSpecies';
import { useTrainingSession } from './hooks/useTrainingSession';
import type { AbacusLevelConfig, AbacusStageConfig, DinosaurState, EggState, EquippedCostumes, LevelProgressRecord, NextTrainingRecommendation, OperationMode, OwnedDinosaur, OwnedEgg, Reward, StageProgressRecord, SubmissionResult, TrainingProblem, TrainingProgressEvaluation, TrainingSession, TrainingSessionRecord, UserProfile } from './types/game';
import { generateTrainingProblems } from './utils/generateTrainingProblems';
import { evaluateLevelProgress, evaluateStageProgress, getNextTrainingRecommendation } from './utils/evaluateTrainingProgress';
import { clearGameState, loadGameState, saveGameState } from './utils/gameStorage';
import { createAdventureResult, type AdventureRunResult } from './utils/adventureRewards';
import { canBuyEggItem, getEggCategoryForOwnedEgg, getHatchCandidates } from './utils/hatchCandidates';
import { calculateTrainingRewards, type TrainingRewardResult } from './utils/trainingRewards';
import { applyDinosaurExp, clampHappiness, clampStamina, getAdjustedStaminaRecovery, getExpToNextLevel, getGrowthStageForLevel, getMaxStaminaForLevel, getStaminaRecoveryMultiplier } from './utils/dinosaurGrowth';
import { canDinosaurEat, getIncompatibleFoodMessage } from './utils/dinosaurDiet';
import { defaultGrowthSpeedMultiplier, growthConfig, growthSpeedOptions, type GrowthSpeedMultiplier } from './config/growthConfig';
import { trainingUiAssets } from './assets/ui/training';
import { bottomNavAssets } from './assets/ui/bottom-nav';
import { trainingAnswerPanel, trainingBackground, trainingCompleteFeedButton, trainingCompletePopupPanel, trainingCompleteRetryButton, trainingCompleteTitleBadge, trainingKeyDefault, trainingKeyDelete, trainingKeypadPanel, trainingKeyPressed, trainingKeySubmit, trainingProblemBoard, trainingStatusCorrectBanner, trainingStatusWrongBanner } from './assets/training';
import homeCoinBar from './assets/home/home_coin_bar.png?url';
import { playBackgroundMusic, playSound, stopBackgroundMusic, type BackgroundMusic } from './audio/audioManager';

type MainTab = 'training' | 'dino' | 'hatchery' | 'shop' | 'pokedex' | 'adventure' | 'settings';
type AppScreen = 'home' | MainTab;
type DinoView = 'care' | 'playground';
type DinosaurInteractionChange = Partial<Pick<DinosaurState, 'exp' | 'mood' | 'stamina'>>;
type InventoryItemState = { itemId: string; quantity: number };
type ProblemCountOverride = 5 | 10 | 15 | 20;
type NumberCountOverride = 'stage-default' | 3 | 4 | 5 | 6 | 7 | 8;
type DigitTypeOverride = 'stage-default' | 'one-digit' | 'two-digit' | 'three-digit' | 'mixed-digit' | 'mixed-two-three-digit';
type ResolvedDigitType = Exclude<DigitTypeOverride, 'stage-default'>;
type OperationsOverride = 'stage-default' | 'add' | 'subtract' | 'mixed';
type TrainingInputMode = 'pencil' | 'keypad' | 'bluetooth';
type CompletedTrainingSummary = TrainingRewardResult & {
  sessionId: string;
  totalProblems: number;
  correctCount: number;
  wrongCount: number;
  completedAt: number;
  elapsedMs: number;
};
type GameState = {
  userProfile: UserProfile | null;
  player: { coins: number };
  selectedDinosaurId: string;
  selectedLevel: number;
  selectedStageId: string;
  problemCountOverride?: ProblemCountOverride;
  numberCountOverride: NumberCountOverride;
  digitTypeOverride: DigitTypeOverride;
  operationsOverride: OperationsOverride;
  growthSpeedMultiplier: GrowthSpeedMultiplier;
  coinRewardMultiplier: CoinRewardMultiplier;
  dinosaur: DinosaurState;
  ownedDinosaurs: OwnedDinosaur[];
  discoveredSpeciesIds: string[];
  egg: EggState;
  ownedEggs: OwnedEgg[];
  activeEggId: string | null;
  ownedCostumeIds: string[];
  inventory: InventoryItemState[];
  trainingHistory: TrainingSessionRecord[];
  rewardedTrainingSessionIds: string[];
  progressByLevel: Record<number, LevelProgressRecord>;
  progressByStage: Record<string, StageProgressRecord>;
};

const mainTabs: Array<{ id: MainTab; label: string; icon: typeof Play; color: string; active: string }> = [
  { id: 'training', label: '훈련장', icon: Play, color: 'text-cyan-700', active: 'from-cyan-300 to-sky-300 border-cyan-200' },
  { id: 'dino', label: '우리 공룡', icon: Baby, color: 'text-amber-700', active: 'from-amber-300 to-orange-300 border-amber-200' },
  { id: 'hatchery', label: '알 부화장', icon: Egg, color: 'text-orange-700', active: 'from-orange-300 to-yellow-300 border-orange-200' },
  { id: 'shop', label: '상점', icon: ShoppingBag, color: 'text-violet-700', active: 'from-violet-300 to-fuchsia-300 border-violet-200' },
  { id: 'pokedex', label: '도감', icon: BookOpen, color: 'text-sky-700', active: 'from-sky-300 to-blue-300 border-sky-200' },
  { id: 'adventure', label: '모험', icon: MapIcon, color: 'text-emerald-700', active: 'from-emerald-300 to-lime-300 border-emerald-200' },
  { id: 'settings', label: '설정', icon: Settings, color: 'text-slate-700', active: 'from-slate-200 to-slate-300 border-slate-200' },
];

const visibleMainTabs = mainTabs.filter((tab) => tab.id === 'training' || tab.id === 'dino' || tab.id === 'shop' || tab.id === 'pokedex' || tab.id === 'settings');

const backgroundMusicByScreen: Partial<Record<AppScreen, BackgroundMusic>> = {
  home: 'home',
  dino: 'dinosaur',
  hatchery: 'dinosaur',
  shop: 'shop',
  pokedex: 'dinopedia',
};

const defaultSelectedLevel = 1;
const defaultSelectedStageId = getDefaultStageIdForLevel(defaultSelectedLevel) ?? 'L1-DRAFT-01';
const trainingInputModeStorageKey = 'abacus-game.training-input-mode';

function loadTrainingInputMode(): TrainingInputMode {
  if (typeof window === 'undefined') return 'pencil';

  try {
    const savedMode = window.localStorage.getItem(trainingInputModeStorageKey);
    return savedMode === 'keypad' || savedMode === 'bluetooth' || savedMode === 'pencil' ? savedMode : 'pencil';
  } catch {
    return 'pencil';
  }
}

const initialDinosaurState: DinosaurState = {
  id: 'dino-tiny-tyranno',
  name: '용감한 티라노',
  level: 4,
  exp: 9,
  expToNextLevel: getExpToNextLevel(4),
  growthStage: getGrowthStageForLevel(4),
  mood: 74,
  happiness: 74,
  stamina: 81,
  maxStamina: getMaxStaminaForLevel(3),
};

const initialEggState: EggState = {
  id: 'egg-normal-mystery',
  name: '미확인 일반 알',
  rarity: 'normal',
  eggType: 'normal',
  eggCategory: 'normal',
  hatchProgress: 62,
};

const initialOwnedEgg: OwnedEgg = {
  id: 'owned-egg-starter-normal',
  eggItemId: 'green-starter-egg',
  name: '초록 알',
  rarity: initialEggState.rarity,
  eggType: initialEggState.eggType,
  eggCategory: initialEggState.eggCategory,
  hatchProgress: initialEggState.hatchProgress,
  createdAt: 0,
};

const initialOwnedDinosaur: OwnedDinosaur = {
  id: 'owned-dino-tiny-tyranno',
  speciesId: 'tiny-tyranno',
  name: initialDinosaurState.name,
  rarity: 'common',
  level: initialDinosaurState.level,
  exp: initialDinosaurState.exp,
  expToNextLevel: initialDinosaurState.expToNextLevel,
  growthStage: initialDinosaurState.growthStage,
  mood: initialDinosaurState.mood,
  happiness: initialDinosaurState.happiness,
  stamina: initialDinosaurState.stamina,
  maxStamina: initialDinosaurState.maxStamina,
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
const showDeveloperPanels = false;
const showSettingsAdvancedPanels = true;
const eggOwnershipResetMigrationKey = 'abacus-dino-egg-ownership-reset-2026-07-25-v1';

const defaultGameState: GameState = {
  userProfile: null,
  player: { coins: 1240 },
  selectedDinosaurId: initialOwnedDinosaur.id,
  selectedLevel: defaultSelectedLevel,
  selectedStageId: defaultSelectedStageId,
  problemCountOverride: undefined,
  numberCountOverride: 'stage-default',
  digitTypeOverride: 'stage-default',
  operationsOverride: 'stage-default',
  growthSpeedMultiplier: defaultGrowthSpeedMultiplier,
  coinRewardMultiplier: defaultCoinRewardMultiplier,
  dinosaur: initialDinosaurState,
  ownedDinosaurs: [initialOwnedDinosaur],
  discoveredSpeciesIds: [initialOwnedDinosaur.speciesId],
  egg: initialEggState,
  ownedEggs: [initialOwnedEgg],
  activeEggId: initialOwnedEgg.id,
  ownedCostumeIds: [],
  inventory: initialInventory,
  trainingHistory: [],
  rewardedTrainingSessionIds: [],
  progressByLevel: {},
  progressByStage: {},
};

function resetOwnedEggDataOnce(state: GameState, loadedFromStorage: boolean): { state: GameState; didReset: boolean } {
  if (!loadedFromStorage || typeof window === 'undefined') return { state, didReset: false };

  try {
    if (window.localStorage.getItem(eggOwnershipResetMigrationKey) === 'done') return { state, didReset: false };
    window.localStorage.setItem(eggOwnershipResetMigrationKey, 'done');
  } catch {
    return { state, didReset: false };
  }

  return {
    state: {
      ...state,
      egg: {
        ...defaultGameState.egg,
        hatchProgress: 0,
        lastHatchedDinosaurName: undefined,
        lastHatchedDinosaurRarity: undefined,
        lastHatchMessage: undefined,
      },
      ownedEggs: [],
      activeEggId: null,
    },
    didReset: true,
  };
}

function normalizeGameState(state: Partial<GameState>): GameState {
  const rawUserProfile = isRecord(state.userProfile) ? state.userProfile : null;
  const legacyActiveDinosaurId = typeof (state as Partial<GameState> & { activeDinosaurId?: unknown }).activeDinosaurId === 'string' ? (state as Partial<GameState> & { activeDinosaurId?: string }).activeDinosaurId : undefined;
  const selectedDinosaurId = typeof state.selectedDinosaurId === 'string' ? state.selectedDinosaurId : typeof rawUserProfile?.selectedDinosaurId === 'string' ? rawUserProfile.selectedDinosaurId : legacyActiveDinosaurId;
  const ownedDinosaurs = getUniqueOwnedDinosaurs(getArrayValue(state.ownedDinosaurs, defaultGameState.ownedDinosaurs));
  const discoveredSpeciesIds = normalizeDiscoveredSpeciesIds([...getArrayValue(state.discoveredSpeciesIds, defaultGameState.discoveredSpeciesIds), ...ownedDinosaurs.map((dinosaur) => dinosaur.speciesId)]);
  const selectedDinosaur = getSelectedOwnedDinosaur(ownedDinosaurs, selectedDinosaurId);
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
  const growthSpeedMultiplier = normalizeGrowthSpeedMultiplier(state.growthSpeedMultiplier);
  const coinRewardMultiplier = normalizeCoinRewardMultiplier(state.coinRewardMultiplier);
  const trainingHistory = normalizeTrainingHistory(state.trainingHistory);
  const rewardedTrainingSessionIds = getArrayValue<unknown>(state.rewardedTrainingSessionIds, []).filter((id): id is string => typeof id === 'string');
  const progressByLevel = normalizeProgressByLevel(state.progressByLevel);
  const progressByStage = normalizeProgressByStage(state.progressByStage);
  const ownedEggs = normalizeOwnedEggs(state.ownedEggs, state.egg);
  const activeEgg = getSelectedOwnedEgg(ownedEggs, state.activeEggId);
  const activeEggId = activeEgg?.id ?? null;
  const rareEggFragmentsFallback =
    (state as Partial<GameState> & { rareEggFragments?: unknown }).rareEggFragments ??
    (state as Partial<GameState> & { resources?: { rareEggFragments?: unknown } }).resources?.rareEggFragments;
  const inventory = normalizeInventoryItems(state.inventory, rareEggFragmentsFallback);
  const ownedCostumeIds = getUniqueSpeciesIds([...getArrayValue(state.ownedCostumeIds, []), ...getOwnedCostumeIdsFromInventory(inventory)].filter((itemId): itemId is string => typeof itemId === 'string'));
  const userProfile = rawUserProfile
    ? {
        ...(rawUserProfile as UserProfile),
        id: typeof rawUserProfile.id === 'string' ? rawUserProfile.id : `profile-restored-${Date.now()}`,
        childName: typeof rawUserProfile.childName === 'string' ? rawUserProfile.childName : '친구',
        ageOrGrade: typeof rawUserProfile.ageOrGrade === 'string' ? rawUserProfile.ageOrGrade : '',
        createdAt: typeof rawUserProfile.createdAt === 'number' ? rawUserProfile.createdAt : Date.now(),
        selectedDinosaurId: selectedDinosaur?.id ?? selectedDinosaurId ?? initialOwnedDinosaur.id,
        dinosaurName: selectedDinosaur?.name ?? (typeof rawUserProfile.dinosaurName === 'string' ? rawUserProfile.dinosaurName : initialOwnedDinosaur.name),
        parentModeEnabled: typeof rawUserProfile.parentModeEnabled === 'boolean' ? rawUserProfile.parentModeEnabled : false,
      }
    : null;
  const playerCoins = normalizeNumber(state.player?.coins, defaultGameState.player.coins);

  return {
    ...defaultGameState,
    ...state,
    player: {
      ...defaultGameState.player,
      ...state.player,
      coins: playerCoins,
    },
    selectedLevel,
    selectedDinosaurId: selectedDinosaur?.id ?? selectedDinosaurId ?? initialOwnedDinosaur.id,
    selectedStageId,
    problemCountOverride,
    numberCountOverride,
    digitTypeOverride,
    operationsOverride,
    growthSpeedMultiplier,
    coinRewardMultiplier,
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
    inventory,
    trainingHistory,
    rewardedTrainingSessionIds,
    progressByLevel,
    progressByStage,
    userProfile,
  };
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getArrayValue<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function normalizeNumber(value: unknown, fallback: number) {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return typeof numericValue === 'number' && Number.isFinite(numericValue) ? numericValue : fallback;
}

function clampUiPercent(value: number) {
  return Math.max(0, Math.min(100, Math.floor(Number.isFinite(value) ? value : 0)));
}

function getPercentValue(value: number, max = 100) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return clampUiPercent((value / max) * 100);
}

function getExpProgressPercent(rawExp: number, expToNextLevel?: number) {
  return getPercentValue(rawExp, expToNextLevel ?? 0);
}

function getUniqueSpeciesIds(speciesIds: string[]) {
  return Array.from(new Set(speciesIds));
}

function getCurrentSpeciesId(speciesId: string) {
  const speciesIdAliases: Record<string, string> = {
    'green-little': 'tiny-tyranno',
    'green-forest-rare': 'leafcera',
    'sparkle-cave-rare': 'crystalo',
    'volcano-island-rare': 'volcanodon',
    'secret-land-rare': 'starano',
  };

  return speciesIdAliases[speciesId] ?? speciesId;
}

function getUniqueOwnedDinosaurs(ownedDinosaurs: unknown[]) {
  const seenSpeciesIds = new Set<string>();

  return ownedDinosaurs
    .map(normalizeOwnedDinosaurSpecies)
    .filter((dinosaur): dinosaur is OwnedDinosaur => Boolean(dinosaur))
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

function normalizeOwnedDinosaurSpecies(dinosaur: unknown): OwnedDinosaur | null {
  if (!isRecord(dinosaur) || typeof dinosaur.speciesId !== 'string') return null;
  const speciesId = getCurrentSpeciesId(dinosaur.speciesId);
  const species = getDinosaurSpecies(speciesId);
  if (!species || species.isPlaceholder || species.status === 'planned' || species.status === 'locked') return null;
  const level = Math.max(1, normalizeNumber(dinosaur.level, 1));
  const happinessFallback = normalizeNumber(dinosaur.happiness ?? dinosaur.mood, growthConfig.defaultHappiness);
  const maxStamina = normalizeNumber(dinosaur.maxStamina, getMaxStaminaForLevel(level));
  const rawName = typeof dinosaur.name === 'string' ? dinosaur.name : '';
  const normalizedName = speciesId !== dinosaur.speciesId && rawName === dinosaur.speciesId ? species.defaultName : rawName || species.defaultName;
  const rawEquippedCostumes = isRecord(dinosaur.equippedCostumes) ? dinosaur.equippedCostumes : {};

  const normalizedDinosaur: OwnedDinosaur = {
    id: typeof dinosaur.id === 'string' ? dinosaur.id : `owned-${speciesId}-restored`,
    speciesId,
    name: normalizedName,
    rarity: species.rarity,
    level,
    exp: Math.max(0, normalizeNumber(dinosaur.exp, 0)),
    expToNextLevel: normalizeNumber(dinosaur.expToNextLevel, getExpToNextLevel(level)),
    growthStage: dinosaur.growthStage === 'baby' || dinosaur.growthStage === 'child' || dinosaur.growthStage === 'teen' || dinosaur.growthStage === 'adult' ? dinosaur.growthStage : getGrowthStageForLevel(level),
    mood: clampHappiness(normalizeNumber(dinosaur.mood, happinessFallback)),
    happiness: clampHappiness(happinessFallback),
    stamina: clampStamina(normalizeNumber(dinosaur.stamina, growthConfig.defaultStamina), maxStamina),
    maxStamina,
    hunger: typeof dinosaur.hunger === 'number' ? dinosaur.hunger : undefined,
    obtainedAt: normalizeNumber(dinosaur.obtainedAt, Date.now()),
    equippedCostumes: rawEquippedCostumes,
  };

  return applyDinosaurExp(normalizedDinosaur, 0);
}

function normalizeOwnedEggs(ownedEggs?: unknown, legacyEgg?: EggState): OwnedEgg[] {
  const sourceEggs: OwnedEgg[] =
    Array.isArray(ownedEggs)
      ? (ownedEggs as OwnedEgg[])
      : legacyEgg
        ? [
            {
              id: legacyEgg.id,
              eggItemId: legacyEgg.eggType === 'rare-spark' || legacyEgg.eggType === 'special' ? 'rare-spark-egg' : 'green-starter-egg',
              name: legacyEgg.name,
              rarity: legacyEgg.rarity,
              eggType: legacyEgg.eggType,
              eggCategory: legacyEgg.eggCategory,
              hatchProgress: legacyEgg.hatchProgress,
              createdAt: 0,
            } as OwnedEgg,
          ]
        : defaultGameState.ownedEggs;

  const normalizedEggs: OwnedEgg[] = sourceEggs
    .filter((egg): egg is OwnedEgg => isRecord(egg) && typeof egg.id === 'string')
    .map((egg) => {
      const eggItemId = typeof egg.eggItemId === 'string' ? egg.eggItemId : egg.eggType === 'rare-spark' || egg.eggType === 'special' ? 'rare-spark-egg' : 'green-starter-egg';
      const eggConfig = getEggItemConfig(eggItemId);

      return {
        ...egg,
        eggItemId,
        name: typeof egg.name === 'string' ? egg.name : eggConfig?.name ?? '미확인 알',
        rarity: eggConfig?.rarity ?? egg.rarity ?? 'normal',
        eggType: eggConfig?.eggType ?? (typeof egg.eggType === 'string' ? egg.eggType : 'normal'),
        eggCategory: eggConfig?.eggCategory ?? egg.eggCategory ?? getEggCategoryForOwnedEgg({ ...egg, eggItemId }),
        eggHabitatId: egg.eggHabitatId ?? eggConfig?.eggHabitatId,
        hatchProgress: clampPercent(normalizeNumber(egg.hatchProgress, 0)),
        createdAt: normalizeNumber(egg.createdAt, 0),
      };
    });

  return getOneEggPerCategory(normalizedEggs);
}

function getOneEggPerCategory(ownedEggs: OwnedEgg[]): OwnedEgg[] {
  const selectedEggs = new Map<string, OwnedEgg>();

  ownedEggs.forEach((egg) => {
    const eggCategory = getEggCategoryForOwnedEgg(egg);
    const selectedEgg = selectedEggs.get(eggCategory);

    if (!selectedEgg || getEggSlotPriority(egg) > getEggSlotPriority(selectedEgg)) {
      selectedEggs.set(eggCategory, egg);
    }
  });

  const eggCategoryOrder = ['normal', 'special', 'rare'];
  return Array.from<OwnedEgg>(selectedEggs.values()).sort((a, b) => eggCategoryOrder.indexOf(getEggCategoryForOwnedEgg(a)) - eggCategoryOrder.indexOf(getEggCategoryForOwnedEgg(b)));
}

function getEggSlotPriority(egg: OwnedEgg) {
  return clampPercent(egg.hatchProgress ?? 0) * 1_000_000 + (egg.createdAt ?? 0);
}

function getEggCategoryLabel(category: NonNullable<OwnedEgg['eggCategory']>) {
  const labels: Record<NonNullable<OwnedEgg['eggCategory']>, string> = {
    normal: '일반알',
    special: '특수알',
    rare: '희귀알',
  };
  return labels[category];
}

function getHabitatShortLabel(habitatId: string) {
  const labels: Record<string, string> = {
    'green-forest': '초록 숲',
    'sparkle-cave': '반짝 동굴',
    'volcano-island': '화산섬',
    'secret-land': '비밀의 땅',
  };

  return labels[habitatId] ?? '새 서식지';
}

function normalizeInventoryItems(inventory: unknown, rareEggFragmentsFallback?: unknown) {
  const itemIdAliases: Record<string, string> = {
    'rare-tricera-fragment': 'rare-egg-fragment',
  };
  const inventoryItems = getArrayValue<InventoryItemState>(inventory, defaultGameState.inventory);
  const quantityByItemId = inventoryItems.reduce<Record<string, number>>((quantities, item) => {
    if (!isRecord(item) || typeof item.itemId !== 'string') return quantities;
    const itemId = itemIdAliases[item.itemId] ?? item.itemId;
    quantities[itemId] = (quantities[itemId] ?? 0) + Math.max(0, normalizeNumber(item.quantity, 0));
    return quantities;
  }, {});
  const rareEggFragmentFallbackQuantity = typeof rareEggFragmentsFallback === 'string' ? Number(rareEggFragmentsFallback) : rareEggFragmentsFallback;

  if (quantityByItemId['rare-egg-fragment'] === undefined && typeof rareEggFragmentFallbackQuantity === 'number' && Number.isFinite(rareEggFragmentFallbackQuantity) && rareEggFragmentFallbackQuantity > 0) {
    quantityByItemId['rare-egg-fragment'] = rareEggFragmentFallbackQuantity;
  }

  return Object.entries(quantityByItemId).map(([itemId, quantity]) => ({ itemId, quantity }));
}

function normalizeDiscoveredSpeciesIds(speciesIds: string[]) {
  return getUniqueSpeciesIds(speciesIds.map(getCurrentSpeciesId).filter((speciesId) => Boolean(getDinosaurSpecies(speciesId))));
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
    eggCategory: egg.eggCategory,
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
  return numericValue === 3 || numericValue === 4 || numericValue === 5 || numericValue === 6 || numericValue === 7 || numericValue === 8 ? numericValue : 'stage-default';
}

function normalizeDigitTypeOverride(value: unknown): DigitTypeOverride {
  return value === 'stage-default' || value === 'one-digit' || value === 'two-digit' || value === 'three-digit' || value === 'mixed-digit' || value === 'mixed-two-three-digit' ? value : 'stage-default';
}

function normalizeOperationsOverride(value: unknown): OperationsOverride {
  return value === 'stage-default' || value === 'add' || value === 'subtract' || value === 'mixed' ? value : 'stage-default';
}

function normalizeGrowthSpeedMultiplier(value: unknown): GrowthSpeedMultiplier {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return numericValue === 0.7 || numericValue === 1 || numericValue === 1.3 ? numericValue : defaultGrowthSpeedMultiplier;
}

function normalizeCoinRewardMultiplier(value: unknown): CoinRewardMultiplier {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return numericValue === 0.7 || numericValue === 1 || numericValue === 1.3 ? numericValue : defaultCoinRewardMultiplier;
}

function getAdjustedFoodExp(baseExp: number, growthSpeedMultiplier: GrowthSpeedMultiplier) {
  if (baseExp <= 0) return 0;
  return Math.max(1, Math.round(baseExp * growthSpeedMultiplier));
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
    eggCategory: item.eggCategory,
    eggHabitatId: item.eggHabitatId,
    hatchProgress: 0,
    createdAt,
  };
}

function addInventoryQuantity(inventory: InventoryItemState[], itemId: string, quantity: number) {
  const existingItem = inventory.find((item) => item.itemId === itemId);
  if (!existingItem) return [...inventory, { itemId, quantity }];

  return inventory.map((item) => (item.itemId === itemId ? { ...item, quantity: item.quantity + quantity } : item));
}

function subtractInventoryQuantity(inventory: InventoryItemState[], itemId: string, quantity: number) {
  return inventory.map((item) => (item.itemId === itemId ? { ...item, quantity: Math.max(0, item.quantity - quantity) } : item));
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

function getSelectedDinosaurId(state: Pick<GameState, 'selectedDinosaurId' | 'userProfile'>) {
  return state.selectedDinosaurId ?? state.userProfile?.selectedDinosaurId ?? null;
}

function ownedDinosaurToDinosaurState(dinosaur: OwnedDinosaur): DinosaurState {
  const level = Math.max(1, dinosaur.level ?? 1);
  const maxStamina = dinosaur.maxStamina ?? getMaxStaminaForLevel(level);
  const happiness = dinosaur.happiness ?? dinosaur.mood ?? growthConfig.defaultHappiness;

  return {
    id: dinosaur.id,
    name: dinosaur.name,
    level,
    exp: Math.max(0, dinosaur.exp ?? 0),
    expToNextLevel: dinosaur.expToNextLevel ?? getExpToNextLevel(level),
    growthStage: dinosaur.growthStage ?? getGrowthStageForLevel(level),
    mood: clampHappiness(dinosaur.mood ?? happiness),
    happiness: clampHappiness(happiness),
    stamina: clampStamina(dinosaur.stamina ?? growthConfig.defaultStamina, maxStamina),
    maxStamina,
  };
}

function updateSelectedOwnedDinosaur(state: GameState, updater: (dinosaur: OwnedDinosaur) => OwnedDinosaur): GameState {
  const uniqueOwnedDinosaurs = getUniqueOwnedDinosaurs(state.ownedDinosaurs);
  const selectedDinosaur = getSelectedOwnedDinosaur(uniqueOwnedDinosaurs, getSelectedDinosaurId(state));
  if (!selectedDinosaur) return state;

  const updatedDinosaur = updater(selectedDinosaur);
  const ownedDinosaurs = uniqueOwnedDinosaurs.map((dinosaur) => (dinosaur.id === updatedDinosaur.id ? updatedDinosaur : dinosaur));

  return {
    ...state,
    dinosaur: ownedDinosaurToDinosaurState(updatedDinosaur),
    ownedDinosaurs,
    selectedDinosaurId: updatedDinosaur.id,
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
  const rewardMultiplier = isLowEnergy ? trainingFatigueConfig.lowConditionRewardMultiplier : 1;
  const warnings = [
    isLowEnergy ? '체력이 조금 낮아요. 먹이를 주면 더 힘내요!' : null,
  ].filter(Boolean) as string[];

  return {
    rewardMultiplier,
    staminaCost: trainingFatigueConfig.energyCostPerCorrect,
    warnings,
  };
}

function formatTrainingRewardFeedback(dinosaur: OwnedDinosaur) {
  const effects = getTrainingConditionEffects(dinosaur);
  const costParts = [`체력 -${effects.staminaCost}`];
  return [...costParts, ...effects.warnings].join(', ');
}

function getDinoStaminaMessage(stamina: number) {
  if (stamina >= 70) return '훈련할 힘이 충분해요!';
  if (stamina >= 30) return '조금 지쳤지만 아직 괜찮아요.';
  if (stamina > 0) return '체력이 낮아요. 먹이를 주면 더 힘내요.';

  return '체력이 아주 낮아요. 지금도 훈련할 수 있지만 먹이를 주면 더 좋아요.';
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
  if (stamina <= 0) return '체력이 낮지만 함께 해볼 수 있어요.';
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
  if (stamina <= 0) return '체력이 낮아요. 먹이를 주면 더 힘내요.';
  if (submissionResult === 'correct') return '맞았어요!';
  if (submissionResult === 'wrong') return '다시 해볼까요?';

  return feedback;
}

function getTrainingMascotMessage({
  answer,
  isSetComplete,
  submissionResult,
}: {
  answer: string;
  isSetComplete: boolean;
  submissionResult: SubmissionResult;
}) {
  if (isSetComplete) return '완료!';
  if (submissionResult === 'correct') return '잘했어요!';
  if (submissionResult === 'wrong') return '한 번 더!';
  if (answer.length > 0) return '좋아요!';

  return '풀어볼까요?';
}

function formatDinosaurStatChanges(effect: DinosaurStatEffect) {
  const changes = [
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
    'three-digit': '세 자리',
    'mixed-digit': '한 자리 + 두 자리',
    'mixed-two-three-digit': '두·세 자리 혼합',
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
    const eggReset = resetOwnedEggDataOnce(loaded.state, loaded.loadedFromStorage);
    return {
      ...loaded,
      state: normalizeGameState(eggReset.state),
      message: eggReset.didReset ? '알 보유 데이터를 한 번 초기화했어요. 다른 진행 데이터는 유지됩니다.' : loaded.message,
    };
  });
  const [phase, setPhase] = useState<'title' | 'onboarding' | 'app'>('app');
  const [activeTab, setActiveTab] = useState<AppScreen>('home');
  const hasMountedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const [gameState, setGameState] = useState<GameState>(initialLoadResult.state);
  const [trainingInputMode, setTrainingInputMode] = useState<TrainingInputMode>(loadTrainingInputMode);
  const activeOwnedDinosaur = getSelectedOwnedDinosaur(gameState.ownedDinosaurs, getSelectedDinosaurId(gameState)) ?? initialOwnedDinosaur;
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
  const [isHatcheryOpen, setIsHatcheryOpen] = useState(false);
  const [dinoFeedback, setDinoFeedback] = useState('오늘도 주산훈련을 기다리고 있어요.');
  const [hatchResult, setHatchResult] = useState<HatchResult | null>(null);
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<string | null>(null);
  const [shopFeedback, setShopFeedback] = useState('상점은 목업입니다. 실제 구매는 아직 연결하지 않았습니다.');
  const [adventureFeedback, setAdventureFeedback] = useState('모험 티켓은 훈련 보상과 연결할 예정이에요. 지금은 무료 테스트 지역을 열어두었습니다.');
  const [adventureResult, setAdventureResult] = useState<AdventureRunResult | null>(null);
  const [storageFeedback, setStorageFeedback] = useState(initialLoadResult.message);
  const lastBluetoothConfirmRef = useRef<{ hex: string; time: number; problemIndex: number } | null>(null);
  const rewardedSessionIdsRef = useRef<Set<string>>(new Set(initialLoadResult.state.rewardedTrainingSessionIds));
  const isHatchingRef = useRef(false);
  const isFeedingRef = useRef(false);
  const dinoHappyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedFoodItemId) return;
    const selectedFood = getFoodItemConfig(selectedFoodItemId);
    const selectedSpecies = getDinosaurSpecies(activeOwnedDinosaur.speciesId);
    if (!canDinosaurEat(selectedSpecies, selectedFood)) {
      setSelectedFoodItemId(null);
    }
  }, [activeOwnedDinosaur.speciesId, selectedFoodItemId]);

  useEffect(() => {
    return () => {
      if (dinoHappyTimerRef.current !== null) {
        window.clearTimeout(dinoHappyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const backgroundMusic = backgroundMusicByScreen[activeTab];
    if (phase === 'app' && backgroundMusic) {
      playBackgroundMusic(backgroundMusic);
    } else {
      stopBackgroundMusic();
    }

    return () => {
      stopBackgroundMusic();
    };
  }, [activeTab, phase]);

  useEffect(() => {
    if (activeTab === 'dino' && !isHatcheryOpen) return;
    if (dinoHappyTimerRef.current !== null) {
      window.clearTimeout(dinoHappyTimerRef.current);
      dinoHappyTimerRef.current = null;
    }
  }, [activeTab, isHatcheryOpen]);

  useEffect(() => {
    try {
      window.localStorage.setItem(trainingInputModeStorageKey, trainingInputMode);
    } catch {
      // 저장소가 차단된 환경에서도 기본 입력 화면은 정상적으로 표시합니다.
    }
  }, [trainingInputMode]);

  function updateTrainingInputMode(mode: TrainingInputMode) {
    setTrainingInputMode(mode);
  }

  const activeMeta = useMemo(() => mainTabs.find((tab) => tab.id === activeTab) ?? mainTabs.find((tab) => tab.id === 'dino') ?? mainTabs[0], [activeTab]);
  const isHomeScreen = activeTab === 'home';
  const isTrainingScreen = activeTab === 'training';
  const showAppHeader = !isHomeScreen && !isTrainingScreen && activeTab !== 'dino' && activeTab !== 'shop' && activeTab !== 'pokedex';
  const showBottomNav = !isHomeScreen && !isTrainingScreen;
  const allowsPageScroll = activeTab !== 'training' && activeTab !== 'shop' && activeTab !== 'dino' && activeTab !== 'pokedex';

  useEffect(() => {
    setCompletedTrainingSummary(null);
    setSetCompleteRewards([]);
  }, [trainingSettingsKey]);

  useEffect(() => {
    if (!isHatcheryOpen) {
      setHatchResult(null);
    }
  }, [isHatcheryOpen]);

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
    setAdventureFeedback('모험 티켓은 훈련 보상과 연결할 예정이에요. 지금은 무료 테스트 지역을 열어두었습니다.');
    setAdventureResult(null);
    setStorageFeedback('저장 데이터를 초기화하고 기본 상태로 되돌렸어요.');
    setPhase('app');
    console.log('Cleared local game state.');
  }

  function completeOnboarding(profileInput: { childName: string; starterSpeciesId: string; dinosaurName: string }) {
    const childName = profileInput.childName.trim() || '친구';
    const starterSpecies = getStarterSelectableSpecies().find((species) => species.speciesId === profileInput.starterSpeciesId) ?? getStarterSelectableSpecies()[0] ?? getDinosaurSpecies(initialOwnedDinosaur.speciesId);
    const dinosaurName = profileInput.dinosaurName.trim() || starterSpecies?.defaultName || '몽이';
    const createdAt = Date.now();
    const starterDinosaur: OwnedDinosaur = {
      id: `owned-${starterSpecies?.speciesId ?? initialOwnedDinosaur.speciesId}-${createdAt}`,
      speciesId: starterSpecies?.speciesId ?? initialOwnedDinosaur.speciesId,
      name: dinosaurName,
      rarity: starterSpecies?.rarity ?? initialOwnedDinosaur.rarity,
      level: 1,
      exp: 0,
      expToNextLevel: getExpToNextLevel(1),
      growthStage: getGrowthStageForLevel(1),
      mood: 74,
      happiness: 74,
      stamina: 81,
      maxStamina: getMaxStaminaForLevel(1),
      obtainedAt: createdAt,
      equippedCostumes: {},
    };
    const userProfile: UserProfile = {
      id: `profile-${createdAt}`,
      childName,
      ageOrGrade: '',
      createdAt,
      selectedDinosaurId: starterDinosaur.id,
      dinosaurName,
      parentModeEnabled: false,
    };

    setGameState({
      ...defaultGameState,
      userProfile,
      selectedDinosaurId: starterDinosaur.id,
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

  function updateGrowthSpeedMultiplier(value: GrowthSpeedMultiplier) {
    setGameState((current) => ({
      ...current,
      growthSpeedMultiplier: value,
    }));
  }

  function updateCoinRewardMultiplier(value: CoinRewardMultiplier) {
    setGameState((current) => ({
      ...current,
      coinRewardMultiplier: value,
    }));
  }

  function applyCorrectAnswerTrainingCost() {
    const targetDinosaur = getSelectedOwnedDinosaur(gameState.ownedDinosaurs, getSelectedDinosaurId(gameState)) ?? initialOwnedDinosaur;
    const trainingEffects = getTrainingConditionEffects(targetDinosaur);

    setGameState((current) =>
      updateSelectedOwnedDinosaur(current, (dinosaur) => ({
        ...dinosaur,
        stamina: clampStamina(dinosaur.stamina - trainingEffects.staminaCost, dinosaur.maxStamina),
      })),
    );
    setLastRewards([]);
    setLastTrainingEffects([
      `체력 -${trainingEffects.staminaCost}`,
      ...(trainingEffects.warnings ?? []),
    ]);
  }

  function applyTrainingCompletionRewards(completedSession: TrainingSession) {
    if (rewardedSessionIdsRef.current.has(completedSession.id)) return;
    rewardedSessionIdsRef.current.add(completedSession.id);

    const completedProblemIds = new Set(completedSession.answers.filter((answerRecord) => answerRecord.isCorrect).map((answerRecord) => answerRecord.problemId));
    const correctCount = completedProblemIds.size;
    const wrongCount = completedSession.answers.filter((answerRecord) => !answerRecord.isCorrect).length;
    const resultReward = calculateTrainingRewards({
      totalProblems: completedSession.problems.length,
      correctCount,
      wrongCount,
      selectedLevel: gameState.selectedLevel,
      growthSpeedMultiplier: gameState.growthSpeedMultiplier,
      coinRewardMultiplier: gameState.coinRewardMultiplier,
      activeDinosaurCondition: {
        stamina: activeOwnedDinosaur.stamina,
      },
    });
    const completedAt = completedSession.completedAt ?? Date.now();
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
      accuracy: resultReward.accuracy,
      earnedCoins: resultReward.coins,
      earnedExp: 0,
      earnedItems: [],
      activeDinosaurId: activeOwnedDinosaur.id,
    };

    setGameState((current) => {
      return {
        ...current,
        player: {
          ...current.player,
          coins: current.player.coins + resultReward.coins,
        },
        trainingHistory: addTrainingRecordToHistory(current.trainingHistory, trainingRecord),
        rewardedTrainingSessionIds: Array.from(new Set([...current.rewardedTrainingSessionIds, completedSession.id])).slice(-100),
        progressByLevel: updateProgressByLevel(current.progressByLevel, trainingRecord),
        progressByStage: updateProgressByStage(current.progressByStage, trainingRecord),
      };
    });

    setCompletedTrainingSummary({
      ...resultReward,
      dinoExp: 0,
      happiness: 0,
      hatchItems: [],
      sessionId: completedSession.id,
      totalProblems: completedSession.problems.length,
      correctCount,
      wrongCount,
      completedAt,
      elapsedMs: Math.max(0, completedAt - completedSession.startedAt),
    });
    setSetCompleteRewards([
      createDisplayReward(`코인 +${resultReward.coins}`, resultReward.coins),
    ]);
    setLastRewards([]);
    setLastTrainingEffects([]);
    if (resultReward.coins > 0) {
      playSound('reward_coin');
    }
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
      updateSelectedOwnedDinosaur(current, (dinosaur) => {
        const grownDinosaur = changes.exp ? applyDinosaurExp(dinosaur, changes.exp) : dinosaur;
        const nextHappiness = clampHappiness(grownDinosaur.happiness + (changes.mood ?? 0));

        return {
          ...grownDinosaur,
          mood: nextHappiness,
          happiness: nextHappiness,
          stamina: clampStamina(grownDinosaur.stamina + (changes.stamina && changes.stamina > 0 ? getAdjustedStaminaRecovery(changes.stamina, nextHappiness) : changes.stamina ?? 0), grownDinosaur.maxStamina),
        };
      }),
    );
    const staminaBonus = changes.stamina && changes.stamina > 0 ? getAdjustedStaminaRecovery(changes.stamina, activeOwnedDinosaur.happiness) : null;
    setDinoFeedback(staminaBonus ? message.replace(`체력 +${changes.stamina}`, `체력 +${staminaBonus}`) : message);
  }

  function feedDinosaur() {
    if (isFeedingRef.current) return;

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
    const activeSpecies = getDinosaurSpecies(activeOwnedDinosaur.speciesId);
    if (!foodConfig || !activeSpecies || !canDinosaurEat(activeSpecies, foodConfig)) {
      setDinoFeedback(
        foodConfig && activeSpecies
          ? getIncompatibleFoodMessage(activeSpecies, foodConfig.name)
          : '먹이와 공룡 정보를 확인할 수 없어 먹이를 줄 수 없어요.',
      );
      return;
    }

    isFeedingRef.current = true;

    const effect = foodConfig.effect;
    const foodName = foodConfig.name;
    const baseFoodExp = foodConfig.expValue;
    const adjustedFoodExp = activeOwnedDinosaur.level >= 20 ? 0 : getAdjustedFoodExp(baseFoodExp, gameState.growthSpeedMultiplier);
    const willLevelUp = adjustedFoodExp > 0 && applyDinosaurExp(activeOwnedDinosaur, adjustedFoodExp).level > activeOwnedDinosaur.level;

    let remainingQuantity = inventoryItem.quantity;
    let gainedExp = 0;
    let didLevelUp = false;
    let blockedBeforeApply = false;
    setGameState((current) => {
      const currentInventoryItem = current.inventory.find((item) => item.itemId === inventoryItem.itemId);
      const selectedDinosaur = getSelectedOwnedDinosaur(getUniqueOwnedDinosaurs(current.ownedDinosaurs), getSelectedDinosaurId(current));
      const selectedSpecies = selectedDinosaur ? getDinosaurSpecies(selectedDinosaur.speciesId) : null;
      if (!currentInventoryItem || currentInventoryItem.quantity <= 0 || !selectedDinosaur || !canDinosaurEat(selectedSpecies, foodConfig)) {
        blockedBeforeApply = true;
        return current;
      }
      remainingQuantity = currentInventoryItem.quantity - 1;
      const currentBaseFoodExp = foodConfig.expValue;
      const currentAdjustedFoodExp = selectedDinosaur && selectedDinosaur.level < 20 ? getAdjustedFoodExp(currentBaseFoodExp, current.growthSpeedMultiplier) : 0;
      const adjustedEffect = selectedDinosaur
        ? {
            ...effect,
            exp: currentAdjustedFoodExp,
            stamina: getAdjustedStaminaRecovery(effect.stamina ?? 0, selectedDinosaur.happiness),
          }
        : effect;

      return {
        ...updateSelectedOwnedDinosaur(current, (dinosaur) => {
          const grownDinosaur = adjustedEffect.exp ? applyDinosaurExp(dinosaur, adjustedEffect.exp) : dinosaur;
          gainedExp = adjustedEffect.exp ?? 0;
          didLevelUp = grownDinosaur.level > dinosaur.level;
          const nextHappiness = clampHappiness(grownDinosaur.happiness + (adjustedEffect.mood ?? 0));

          return {
            ...grownDinosaur,
            mood: nextHappiness,
            happiness: nextHappiness,
            stamina: clampStamina(grownDinosaur.stamina + (adjustedEffect.stamina ?? 0), grownDinosaur.maxStamina),
          };
        }),
        inventory: current.inventory.map((item) => (item.itemId === inventoryItem.itemId ? { ...item, quantity: remainingQuantity } : item)),
      };
    });
    if (blockedBeforeApply) {
      isFeedingRef.current = false;
      setSelectedFoodItemId(null);
      setDinoFeedback('공룡이나 먹이 상태가 바뀌어 먹이를 주지 않았어요. 다시 선택해주세요.');
      return;
    }
    if (remainingQuantity <= 0) {
      setSelectedFoodItemId(null);
    }
    const activeHappiness = activeOwnedDinosaur.happiness;
    const recoveredStamina = getAdjustedStaminaRecovery(effect.stamina ?? 0, activeHappiness);
    const multiplier = getStaminaRecoveryMultiplier(activeHappiness);
    const recoveryMessage = `체력 +${recoveredStamina}${multiplier > 1 ? ` (행복 보너스 x${multiplier})` : ''}`;
    const expMessage = adjustedFoodExp > 0 ? `EXP +${gainedExp || adjustedFoodExp}` : '성장 완료';
    const levelMessage = didLevelUp ? ' 레벨이 올랐어요!' : '';
    setDinoFeedback(`${foodName}를 먹었어요! ${expMessage}, ${recoveryMessage}${levelMessage}`);
    playSound('dino_eat');
    if (didLevelUp || willLevelUp) {
      playSound('level_up');
    }
    if (dinoHappyTimerRef.current !== null) {
      window.clearTimeout(dinoHappyTimerRef.current);
    }
    dinoHappyTimerRef.current = window.setTimeout(() => {
      playSound('dino_happy');
      dinoHappyTimerRef.current = null;
    }, 320);
    window.setTimeout(() => {
      isFeedingRef.current = false;
    }, 250);
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

    if (item.category === 'egg') {
      const eggAvailability = canBuyEggItem(item, getUniqueOwnedDinosaurs(gameState.ownedDinosaurs), gameState.ownedEggs, hatchableDinosaurPool);
      if (eggAvailability.hasEggInCategory) {
        setShopFeedback(`${getEggCategoryLabel(item.eggCategory)}은 이미 부화장에 있어요. 부화 후 다음 알을 준비할 수 있어요.`);
        return;
      }

      if (!eggAvailability.canBuyMore) {
        setShopFeedback('이 알에서 만날 수 있는 공룡을 모두 만났어요. 다른 알을 선택해보세요.');
        return;
      }
    }

    const requiredEggFragments = item.category === 'egg' ? getEggRequiredFragments(item) : [];
    if (item.category === 'egg' && item.eggCategory === 'rare' && requiredEggFragments.length > 0) {
      const requiredFragments = requiredEggFragments;
      const missingFragment = requiredFragments.find((fragment) => (gameState.inventory.find((entry) => entry.itemId === fragment.itemId)?.quantity ?? 0) < fragment.amount);

      if (gameState.player.coins < item.price) {
        setShopFeedback(`코인이 부족해요. 내 코인 ${gameState.player.coins.toLocaleString()} · 필요 ${item.price.toLocaleString()}`);
        return;
      }

      if (missingFragment) {
        const currentFragmentQuantity = gameState.inventory.find((entry) => entry.itemId === missingFragment.itemId)?.quantity ?? 0;
        const missingFragmentAmount = Math.max(0, missingFragment.amount - currentFragmentQuantity);
        setShopFeedback(`공통 희귀알 조각이 부족해요. 내 조각 ${currentFragmentQuantity}개 · 필요 ${missingFragment.amount}개 · 부족 ${missingFragmentAmount}개`);
        return;
      }

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
        inventory: requiredFragments.reduce((inventory, fragment) => subtractInventoryQuantity(inventory, fragment.itemId, fragment.amount), current.inventory),
        ownedEggs: getOneEggPerCategory([...current.ownedEggs, newEgg]),
        activeEggId: current.activeEggId ?? newEgg.id,
        egg: current.activeEggId ? current.egg : activeEggToEggState(newEgg) ?? current.egg,
      }));
      setShopFeedback(`희귀알을 얻었어요! 코인 -${item.price.toLocaleString()} · 희귀알 조각 사용`);
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
        ownedEggs: getOneEggPerCategory([...current.ownedEggs, newEgg]),
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

  function runAdventure(areaId: string) {
    const area = adventureAreas.find((adventureArea) => adventureArea.id === areaId);
    if (!area) {
      setAdventureFeedback('모험 지역 정보를 찾지 못했어요.');
      return;
    }

    if (area.status !== 'ready') {
      setAdventureFeedback('아직 떠날 수 없는 모험이에요.');
      return;
    }

    if (area.entryCost.type === 'ticket') {
      setAdventureFeedback('모험 티켓은 다음 단계에서 훈련 1세트 완료 보상과 연결할 예정이에요.');
      return;
    }

    if (area.entryCost.type === 'coin' && gameState.player.coins < area.entryCost.amount) {
      setAdventureFeedback('코인이 부족해요. 훈련을 하면 코인을 더 모을 수 있어요.');
      return;
    }

    const result = createAdventureResult(area, activeDinosaur.name);
    setGameState((current) => {
      let nextCoins = current.player.coins - (area.entryCost.type === 'coin' ? area.entryCost.amount : 0);
      let nextInventory = current.inventory;

      result.rewards.forEach((reward) => {
        if (reward.type === 'coin') {
          nextCoins += reward.amount;
          return;
        }

        if ((reward.type === 'food' || reward.type === 'hatchItem' || reward.type === 'fragment') && reward.itemId) {
          nextInventory = addInventoryQuantity(nextInventory, reward.itemId, reward.amount);
        }
      });

      return {
        ...current,
        player: {
          ...current.player,
          coins: nextCoins,
        },
        inventory: nextInventory,
      };
    });
    if (result.rewards.some((reward) => reward.type === 'coin' && reward.amount > 0)) {
      playSound('reward_coin');
    }
    setAdventureResult(result);
    setAdventureFeedback(result.hasDexHint ? '도감 힌트를 발견했어요!' : `${area.title}을 다녀왔어요.`);
  }

  function hatchEgg() {
    if (hatchResult || isHatchingRef.current) return;

    const currentActiveEgg = getSelectedOwnedEgg(gameState.ownedEggs, gameState.activeEggId);
    if (!currentActiveEgg || currentActiveEgg.hatchProgress < 100) return;

    isHatchingRef.current = true;
    const uniqueOwnedDinosaurs = getUniqueOwnedDinosaurs(gameState.ownedDinosaurs);
    const hatchedTemplate = getHatchCandidates(currentActiveEgg, uniqueOwnedDinosaurs, hatchableDinosaurPool).candidates[0];

    if (!hatchedTemplate) {
      setGameState((current) => ({
        ...current,
        ownedDinosaurs: uniqueOwnedDinosaurs,
        discoveredSpeciesIds: getUniqueSpeciesIds([...current.discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId)]),
        egg: {
          ...current.egg,
          ...(activeEggToEggState(currentActiveEgg) ?? {}),
          lastHatchMessage: '이 알에서 만날 수 있는 새 공룡을 모두 만났어요. 다른 알을 부화해보세요.',
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
        expToNextLevel: getExpToNextLevel(1),
        growthStage: getGrowthStageForLevel(1),
        mood: 70,
        happiness: 70,
        stamina: 70,
        maxStamina: getMaxStaminaForLevel(1),
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
        selectedDinosaurId: newDinosaur.id,
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
            eggCategory: 'normal' as const,
            hatchProgress: 0,
          }),
          lastHatchedDinosaurName: undefined,
          lastHatchedDinosaurRarity: undefined,
          lastHatchMessage: undefined,
        },
      };
    });
    setHatchResult({
      speciesId: hatchedTemplate.speciesId,
      eggName: currentActiveEgg.name,
      eggRarity: currentActiveEgg.rarity,
      dinosaurName: hatchedTemplate.defaultName,
      speciesName: hatchedTemplate.displayName,
      rarity: hatchedTemplate.rarity,
      message:
        hatchedTemplate.rarity === 'rare'
          ? `${hatchedTemplate.displayName}를 만났어요! ${getHabitatShortLabel(hatchedTemplate.habitat)}의 희귀 공룡이에요.`
          : `${hatchedTemplate.defaultName}가 태어났어요! 새 공룡이 우리 공룡과 도감에 추가되었어요.`,
    });
  }

  function selectAdjacentDinosaur(direction: -1 | 1) {
    if (getUniqueOwnedDinosaurs(gameState.ownedDinosaurs).length > 1) {
      playSound('ui_tab_switch');
    }
    setGameState((current) => {
      const ownedDinosaurs = getUniqueOwnedDinosaurs(current.ownedDinosaurs);
      if (ownedDinosaurs.length === 0) return current;

      const selectedDinosaur = getSelectedOwnedDinosaur(ownedDinosaurs, getSelectedDinosaurId(current)) ?? ownedDinosaurs[0];
      const selectedIndex = Math.max(0, ownedDinosaurs.findIndex((dinosaur) => dinosaur.id === selectedDinosaur.id));
      const nextIndex = (selectedIndex + direction + ownedDinosaurs.length) % ownedDinosaurs.length;
      const nextDinosaur = ownedDinosaurs[nextIndex];

      return {
        ...current,
        dinosaur: ownedDinosaurToDinosaurState(nextDinosaur),
        ownedDinosaurs,
        selectedDinosaurId: nextDinosaur.id,
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
        selectedDinosaurId: nextDinosaur.id,
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
    if (eggId !== gameState.activeEggId) {
      playSound('ui_tab_switch');
    }
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

    const currentActiveEgg = getSelectedOwnedEgg(gameState.ownedEggs, gameState.activeEggId);
    const currentInventoryItem = gameState.inventory.find((entry) => entry.itemId === item.id);
    if (currentActiveEgg && currentInventoryItem && currentInventoryItem.quantity > 0 && item.effect.hatchProgress > 0) {
      playSound('item_use');
    }

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

      if (item.effect.hatchProgress <= 0) {
        return {
          ...current,
          egg: {
            ...current.egg,
            ...(activeEggToEggState(activeEgg) ?? {}),
            lastHatchMessage: `${item.name}은 희귀 알 구매 재료예요. 상점에서 희귀 알을 열 때 사용돼요.`,
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
    if (trainingInputMode !== 'bluetooth') return;
    training.setAnswer(value);
  }

  function handleBluetoothNotification(payload: BluetoothNotificationPayload) {
    setLastBluetoothInput(payload);
    if (trainingInputMode !== 'bluetooth') return;

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
    <div className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-b from-sky-200 via-cyan-100 to-lime-100 p-0 text-slate-800 md:p-4">
      <div className="tablet-app-shell relative flex flex-col overflow-hidden bg-gradient-to-b from-sky-200 via-cyan-100 to-lime-100 shadow-[0_22px_60px_rgba(14,116,144,0.28)] md:rounded-[34px] md:border-4 md:border-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.9),transparent_16%),radial-gradient(circle_at_72%_20%,rgba(255,255,255,0.75),transparent_14%)]" />
      {showAppHeader && <header className="relative z-20 shrink-0 px-3 py-2 md:px-5 md:py-3">
        <div className="mx-auto flex items-center justify-between gap-3 rounded-[22px] border-4 border-white bg-white/82 px-3 py-2 shadow-[0_12px_30px_rgba(14,116,144,0.16)] backdrop-blur md:px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playSound('ui_button_tap');
                setIsHatcheryOpen(false);
                setActiveTab('home');
              }}
              className="flex h-12 w-12 items-center justify-center rounded-[18px] border-4 border-white bg-gradient-to-b from-cyan-300 to-sky-400 text-white shadow-md transition active:translate-y-1"
              aria-label="홈으로 돌아가기"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border-4 border-white bg-gradient-to-b from-emerald-300 to-emerald-400 text-white shadow-md">
              <Baby className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg font-black text-emerald-950">{activeTab === 'dino' ? '우리 공룡' : '주산 공룡 모험'}</h1>
              {activeTab !== 'dino' && <p className="hidden text-sm font-black text-emerald-700/75 sm:block">주산훈련 → 보상 → 알부화와 성장</p>}
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-1">
            <HeaderPill icon={Coins} label={gameState.player.coins.toLocaleString()} tone="coin" />
          </div>
        </div>
      </header>}

      <main className={`relative z-10 mx-auto min-h-0 w-full overflow-x-hidden ${isHomeScreen || isTrainingScreen ? 'flex-1 overflow-hidden p-0' : `px-3 py-3 md:px-5 md:py-4 ${allowsPageScroll ? `flex-1 overflow-y-auto ${showBottomNav ? 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-[calc(5.5rem+env(safe-area-inset-bottom))]' : 'pb-[calc(1rem+env(safe-area-inset-bottom))]'}` : `flex-1 overflow-hidden ${showBottomNav ? 'pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-[calc(4.75rem+env(safe-area-inset-bottom))]' : 'pb-[calc(1rem+env(safe-area-inset-bottom))]'}`}`}`}>
        <section className={`${activeTab === 'pokedex' || activeTab === 'training' || activeTab === 'home' || activeTab === 'dino' || activeTab === 'shop' ? 'hidden' : 'flex'} mb-2 items-center gap-3 rounded-[24px] border-4 border-white bg-white/72 px-3 py-2 shadow-[0_10px_28px_rgba(14,116,144,0.12)] backdrop-blur`}>
          <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] border-4 border-white bg-gradient-to-b ${activeMeta.active} text-white shadow-md`}>
            <activeMeta.icon className={`h-7 w-7 ${activeMeta.color}`} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-emerald-950">{activeMeta.label}</h2>
            <p className="hidden text-xs font-black text-emerald-700/70 md:block">터치 화면 안에서 바로 사용할 수 있게 정리했어요.</p>
          </div>
        </section>

        {activeTab === 'home' && (
          <HomeScreen
            coins={gameState.player.coins}
            dinosaurName={activeDinosaur.name}
            onNavigate={(screen) => {
              playSound('ui_tab_switch');
              setIsHatcheryOpen(false);
              setActiveTab(screen);
            }}
          />
        )}

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
              inputMode={trainingInputMode}
              feedback={training.feedback}
              submissionResult={training.submissionResult}
              lastRewards={lastRewards}
              lastTrainingEffects={lastTrainingEffects}
              setCompleteRewards={setCompleteRewards}
              completedTrainingSummary={completedTrainingSummary}
              isSetComplete={training.isSetComplete}
              currentCoins={gameState.player.coins}
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
              onGoToShop={() => {
                setIsHatcheryOpen(false);
                setActiveTab('shop');
              }}
              onExitTraining={() => {
                setIsHatcheryOpen(false);
                setActiveTab('home');
              }}
              onGoToDino={() => {
                setIsHatcheryOpen(false);
                setActiveTab('dino');
              }}
              onGoToHatchery={() => {
                setActiveTab('dino');
                setIsHatcheryOpen(true);
              }}
            />
          </TrainingScreen>
        )}
        {activeTab === 'dino' && !isHatcheryOpen && (
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
            onSelectFood={(itemId) => {
              if (itemId !== selectedFoodItemId) {
                playSound('item_select');
                setSelectedFoodItemId(itemId);
              }
            }}
            onSelectAdjacentDinosaur={selectAdjacentDinosaur}
            onEquipCostume={equipCostume}
            onDinosaurInteraction={applyDinosaurInteraction}
            onFeed={feedDinosaur}
            onGoToHatchery={() => {
              playSound('ui_tab_switch');
              setIsHatcheryOpen(true);
            }}
          />
        )}
        {activeTab === 'dino' && isHatcheryOpen && (
          <HatcheryScreen
            ownedEggs={gameState.ownedEggs}
            activeEggId={gameState.activeEggId}
            ownedDinosaurs={gameState.ownedDinosaurs}
            inventory={gameState.inventory}
            hatchResult={hatchResult}
            onSelectEgg={selectActiveEgg}
            onUseHatchItem={useHatchItem}
            onHatchEgg={hatchEgg}
            onGoToDex={() => {
              setHatchResult(null);
              setIsHatcheryOpen(false);
              setActiveTab('pokedex');
            }}
            onGoToDino={() => {
              setHatchResult(null);
              setIsHatcheryOpen(false);
            }}
            onCloseHatchResult={() => setHatchResult(null)}
          />
        )}
        {activeTab === 'shop' && (
          <ShopScreen
            coins={gameState.player.coins}
            feedback={shopFeedback}
            inventory={gameState.inventory}
            ownedDinosaurs={gameState.ownedDinosaurs}
            ownedEggs={gameState.ownedEggs}
            ownedCostumeIds={gameState.ownedCostumeIds}
            onPurchase={purchaseItem}
          />
        )}
        {activeTab === 'pokedex' && (
          <DexScreen
            ownedDinosaurs={gameState.ownedDinosaurs}
            discoveredSpeciesIds={gameState.discoveredSpeciesIds}
            onViewOwnedDinosaur={viewOwnedDinosaurFromDex}
            onGoToHatchery={() => {
              setActiveTab('dino');
              setIsHatcheryOpen(true);
            }}
          />
        )}
        {activeTab === 'adventure' && (
          <PlaygroundScreen
            activeDinosaur={activeDinosaur}
            coins={gameState.player.coins}
            inventory={gameState.inventory}
            result={adventureResult}
            feedback={adventureFeedback}
            onExplore={runAdventure}
            onCloseResult={() => setAdventureResult(null)}
            onGoToDex={() => {
              setAdventureResult(null);
              setActiveTab('pokedex');
            }}
            onGoToHatchery={() => {
              setAdventureResult(null);
              setActiveTab('dino');
              setIsHatcheryOpen(true);
            }}
          />
        )}
        {activeTab === 'settings' && (
          <PortraitSettingsView
            levels={abacusLevels}
            selectedLevel={gameState.selectedLevel}
            selectedLevelConfig={selectedLevelConfig}
            growthSpeedMultiplier={gameState.growthSpeedMultiplier}
            coinRewardMultiplier={gameState.coinRewardMultiplier}
            problemCountOverride={gameState.problemCountOverride}
            numberCountOverride={gameState.numberCountOverride}
            digitTypeOverride={gameState.digitTypeOverride}
            operationsOverride={gameState.operationsOverride}
            storageFeedback={storageFeedback}
            trainingInputMode={trainingInputMode}
            onSelectLevel={selectTrainingLevel}
            onProblemCountOverride={updateProblemCountOverride}
            onNumberCountOverride={updateNumberCountOverride}
            onDigitTypeOverride={updateDigitTypeOverride}
            onOperationsOverride={updateOperationsOverride}
            onGrowthSpeedMultiplier={updateGrowthSpeedMultiplier}
            onCoinRewardMultiplier={updateCoinRewardMultiplier}
            onResetSavedGameState={resetSavedGameState}
            onTrainingInputMode={updateTrainingInputMode}
            onBluetoothNotification={handleBluetoothNotification}
          />
        )}
      </main>

      {showBottomNav && <nav className="bottom-nav-wrapper absolute inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.35rem+env(safe-area-inset-bottom))] md:px-5 md:pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="bottom-nav mx-auto grid grid-cols-5 place-items-center gap-1 rounded-[18px] border-[3px] border-white bg-white/90 p-1 shadow-[0_-8px_22px_rgba(14,116,144,0.18)] backdrop-blur md:gap-1.5 md:p-1.5">
          {visibleMainTabs.map((tab) => {
            const active = tab.id === activeTab;
            const assets = bottomNavAssets[tab.id as keyof typeof bottomNavAssets];
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id !== activeTab) {
                    playSound('ui_tab_switch');
                  }
                  setIsHatcheryOpen(false);
                  setActiveTab(tab.id);
                }}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
                className="bottom-nav-item flex h-[clamp(52px,7.5dvh,72px)] w-full items-center justify-center border-0 bg-transparent p-0 transition hover:brightness-105 active:translate-y-0.5"
              >
                <img
                  src={active ? assets.selected : assets.default}
                  alt=""
                  className="block h-full w-full object-contain"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </nav>}
      </div>
    </div>
  );
}

function HomeHubScreen({
  coins,
  activeDinosaur,
  onNavigate,
}: {
  coins: number;
  activeDinosaur: DinosaurState;
  onNavigate: (screen: Exclude<AppScreen, 'home' | 'hatchery' | 'adventure'>) => void;
}) {
  const hubActions: Array<{ id: Exclude<AppScreen, 'home' | 'hatchery' | 'adventure'>; label: string; icon: typeof Play; tone: string }> = [
    { id: 'training', label: '훈련 시작', icon: Play, tone: 'from-cyan-300 to-sky-500 text-sky-950 shadow-[0_7px_0_#0284c7]' },
    { id: 'dino', label: '공룡 보기', icon: Baby, tone: 'from-lime-300 to-emerald-400 text-emerald-950 shadow-[0_7px_0_#059669]' },
    { id: 'shop', label: '상점', icon: ShoppingBag, tone: 'from-amber-300 to-orange-400 text-amber-950 shadow-[0_7px_0_#d97706]' },
    { id: 'pokedex', label: '도감', icon: BookOpen, tone: 'from-sky-300 to-blue-400 text-blue-950 shadow-[0_7px_0_#2563eb]' },
    { id: 'settings', label: '설정', icon: Settings, tone: 'from-slate-200 to-slate-300 text-slate-800 shadow-[0_7px_0_#94a3b8]' },
  ];

  return (
    <section className="relative grid min-h-full overflow-hidden rounded-[30px] border-4 border-white bg-gradient-to-b from-sky-200 via-cyan-100 to-lime-100 px-4 pb-5 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] md:px-8 md:pb-8 md:pt-5">
      <div className="relative z-10 flex items-center justify-between">
        <button className="flex h-11 w-11 items-center justify-center rounded-[16px] border-4 border-white bg-white/82 text-cyan-700 shadow-md" aria-label="소리 설정">
          <Sparkles className="h-5 w-5" />
        </button>
        <div className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-4 border-white bg-amber-200 px-4 text-sm font-black text-amber-950 shadow-md">
          <Coins className="h-5 w-5" />
          {coins.toLocaleString()}
        </div>
      </div>

      <div className="relative z-10 flex min-h-[330px] flex-col items-center justify-center text-center md:min-h-[430px]">
        <p className="rounded-full border-2 border-white bg-white/72 px-4 py-1 text-xs font-black text-emerald-700 shadow-sm">매일 조금씩 강해지는 주산 모험</p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-emerald-950 drop-shadow-sm">공룡 주산<br />훈련소</h1>
        <div className="relative mt-3 flex h-48 w-full items-end justify-center overflow-hidden md:h-72">
          <div className="absolute bottom-0 h-24 w-64 rounded-t-[50%] bg-lime-300/70 md:h-32 md:w-96" />
          <DinoAvatar size="large" />
        </div>
        <p className="mt-2 max-w-xl text-sm font-black leading-snug text-emerald-800/80 md:text-base">
          {activeDinosaur.name}와 함께 문제를 풀고 코인을 모아 보세요.
        </p>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[700px] gap-3 md:grid-cols-2 md:gap-4">
        {hubActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className={`flex min-h-14 items-center justify-center gap-3 rounded-[22px] border-4 border-white bg-gradient-to-b px-5 text-lg font-black transition active:translate-y-1 active:shadow-none md:min-h-20 md:text-xl ${action.tone} ${action.id === 'training' ? 'md:col-span-2' : ''}`}
            >
              <Icon className="h-6 w-6 md:h-7 md:w-7" />
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PortraitSettingsView({
  levels,
  selectedLevel,
  selectedLevelConfig,
  growthSpeedMultiplier,
  coinRewardMultiplier,
  problemCountOverride,
  numberCountOverride,
  digitTypeOverride,
  operationsOverride,
  storageFeedback,
  trainingInputMode,
  onSelectLevel,
  onProblemCountOverride,
  onNumberCountOverride,
  onDigitTypeOverride,
  onOperationsOverride,
  onGrowthSpeedMultiplier,
  onCoinRewardMultiplier,
  onResetSavedGameState,
  onTrainingInputMode,
  onBluetoothNotification,
}: {
  levels: AbacusLevelConfig[];
  selectedLevel: number;
  selectedLevelConfig: AbacusLevelConfig | null;
  growthSpeedMultiplier: GrowthSpeedMultiplier;
  coinRewardMultiplier: CoinRewardMultiplier;
  problemCountOverride?: ProblemCountOverride;
  numberCountOverride: NumberCountOverride;
  digitTypeOverride: DigitTypeOverride;
  operationsOverride: OperationsOverride;
  storageFeedback: string;
  trainingInputMode: TrainingInputMode;
  onSelectLevel: (level: number) => void;
  onProblemCountOverride: (value: ProblemCountOverride | 'stage-default') => void;
  onNumberCountOverride: (value: NumberCountOverride) => void;
  onDigitTypeOverride: (value: DigitTypeOverride) => void;
  onOperationsOverride: (value: OperationsOverride) => void;
  onGrowthSpeedMultiplier: (value: GrowthSpeedMultiplier) => void;
  onCoinRewardMultiplier: (value: CoinRewardMultiplier) => void;
  onResetSavedGameState: () => void;
  onTrainingInputMode: (mode: TrainingInputMode) => void;
  onBluetoothNotification: (payload: BluetoothNotificationPayload) => void;
}) {
  return (
    <section className="grid min-w-0 gap-3 overflow-x-hidden pb-4">
      <div className="min-w-0 overflow-hidden rounded-[28px] border-4 border-white bg-white/82 p-3 shadow-lg sm:p-4">
        <p className="text-xs font-black text-slate-500">모바일 분기 설정</p>
        <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">설정</h3>
        <p className="mt-2 break-words text-[13px] font-black leading-snug text-slate-500 sm:text-sm sm:leading-relaxed">
          세로형 MVP에서는 꼭 필요한 항목만 먼저 보여줘요. 복잡한 개발자 설정은 기존 코드에 보존되어 있습니다.
        </p>
      </div>

      <fieldset className="min-w-0 overflow-hidden rounded-[24px] border-4 border-white bg-white/80 p-3 shadow-sm sm:p-4">
        <legend className="px-1 text-sm font-black text-violet-800">훈련장 입력 방식</legend>
        <p className="mb-3 mt-1 text-xs font-black leading-snug text-slate-500">훈련장에는 선택한 입력 화면 하나만 표시됩니다.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {([
            { value: 'pencil', label: '펜슬 입력', description: 'Apple Pencil Scribble 테스트용' },
            { value: 'keypad', label: '화면 키패드', description: '화면의 숫자 버튼으로 입력' },
            { value: 'bluetooth', label: '블루투스 주판', description: '연결된 주판 값으로 입력' },
          ] as const).map((option) => {
            const selected = trainingInputMode === option.value;
            return (
              <label
                key={option.value}
                className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-[18px] border-2 p-3 transition ${
                  selected ? 'border-violet-300 bg-violet-100 text-violet-950 shadow-[0_4px_0_#c4b5fd]' : 'border-slate-100 bg-white text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="training-input-mode"
                  value={option.value}
                  checked={selected}
                  onChange={() => onTrainingInputMode(option.value)}
                  className="h-5 w-5 shrink-0 accent-violet-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-black">{option.label}</span>
                  <span className="mt-1 block text-[11px] font-bold leading-snug opacity-70">{option.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="grid min-w-0 gap-2 overflow-hidden rounded-[24px] border-4 border-white bg-white/80 p-3 shadow-sm sm:p-4">
        <span className="text-sm font-black text-emerald-800">훈련 난이도</span>
        <select
          value={selectedLevel}
          onChange={(event) => onSelectLevel(Number(event.target.value))}
          className="min-h-12 w-full min-w-0 rounded-[16px] border-2 border-emerald-100 bg-white px-3 text-sm font-black text-slate-900 sm:text-base"
        >
          {levels.map((level) => (
            <option key={level.level} value={level.level}>
              {level.level}단계 · {level.title}
            </option>
          ))}
        </select>
        <span className="break-words text-xs font-black leading-snug text-slate-500">{selectedLevelConfig?.summary ?? '선택된 단계 정보가 없습니다.'}</span>
      </label>

      <label className="grid min-w-0 gap-2 overflow-hidden rounded-[24px] border-4 border-white bg-white/80 p-3 shadow-sm sm:p-4">
        <span className="text-sm font-black text-cyan-800">세트 문제 수</span>
        <select
          value={problemCountOverride ? String(problemCountOverride) : 'stage-default'}
          onChange={(event) => {
            const value = event.target.value;
            onProblemCountOverride(value === 'stage-default' ? 'stage-default' : (Number(value) as ProblemCountOverride));
          }}
          className="min-h-12 w-full min-w-0 rounded-[16px] border-2 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 sm:text-base"
        >
          <option value="stage-default">단계 기본값</option>
          <option value="5">5문제</option>
          <option value="10">10문제</option>
          <option value="15">15문제</option>
          <option value="20">20문제</option>
        </select>
      </label>

      <label className="grid min-w-0 gap-2 overflow-hidden rounded-[24px] border-4 border-white bg-white/80 p-3 shadow-sm sm:p-4">
        <span className="text-sm font-black text-emerald-800">문제 안 숫자 개수</span>
        <select
          value={String(numberCountOverride)}
          onChange={(event) => onNumberCountOverride(normalizeNumberCountOverride(event.target.value))}
          className="min-h-12 w-full min-w-0 rounded-[16px] border-2 border-emerald-100 bg-white px-3 text-sm font-black text-slate-900 sm:text-base"
        >
          <option value="stage-default">단계 기본값</option>
          <option value="3">3개</option>
          <option value="4">4개</option>
          <option value="5">5개</option>
          <option value="6">6개</option>
          <option value="7">7개</option>
          <option value="8">8개</option>
        </select>
        <span className="break-words text-xs font-black leading-snug text-slate-500">한 문제에 나오는 숫자 개수를 정합니다.</span>
      </label>

      <label className="grid min-w-0 gap-2 overflow-hidden rounded-[24px] border-4 border-white bg-white/80 p-3 shadow-sm sm:p-4">
        <span className="text-sm font-black text-sky-800">문제 자리수</span>
        <select
          value={digitTypeOverride}
          onChange={(event) => onDigitTypeOverride(normalizeDigitTypeOverride(event.target.value))}
          className="min-h-12 w-full min-w-0 rounded-[16px] border-2 border-sky-100 bg-white px-3 text-sm font-black text-slate-900 sm:text-base"
        >
          <option value="stage-default">단계 기본값</option>
          <option value="one-digit">한자리</option>
          <option value="two-digit">두자리</option>
          <option value="three-digit">세자리</option>
        </select>
      </label>

      <label className="grid min-w-0 gap-2 overflow-hidden rounded-[24px] border-4 border-white bg-white/80 p-3 shadow-sm sm:p-4">
        <span className="text-sm font-black text-rose-800">연산 방식</span>
        <select
          value={operationsOverride}
          onChange={(event) => onOperationsOverride(normalizeOperationsOverride(event.target.value))}
          className="min-h-12 w-full min-w-0 rounded-[16px] border-2 border-rose-100 bg-white px-3 text-sm font-black text-slate-900 sm:text-base"
        >
          <option value="stage-default">단계 기본값</option>
          <option value="add">덧셈</option>
          <option value="subtract">뺄셈</option>
          <option value="mixed">덧셈 + 뺄셈 혼합</option>
        </select>
      </label>

      <section className="min-w-0 overflow-hidden rounded-[24px] border-4 border-white bg-white/80 p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex min-w-0 items-center gap-2">
          <Bluetooth className="h-5 w-5 text-cyan-700" />
          <h4 className="min-w-0 break-words text-sm font-black text-cyan-900">Bluetooth 주판 연결</h4>
        </div>
        <div className="min-w-0 overflow-x-hidden rounded-[18px] bg-white/70 p-1.5 sm:p-2">
          <BluetoothTestPanel onNotification={onBluetoothNotification} />
        </div>
      </section>

      <section className="grid min-w-0 gap-3 overflow-hidden rounded-[24px] border-4 border-white bg-white/80 p-3 shadow-sm sm:p-4">
        <h4 className="text-sm font-black text-amber-800">성장 속도</h4>
        <div className="grid grid-cols-3 gap-2">
          {growthSpeedOptions.map((option) => {
            const selected = growthSpeedMultiplier === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onGrowthSpeedMultiplier(option.value)}
                className={`min-h-12 rounded-[16px] px-2 text-xs font-black transition active:translate-y-1 ${
                  selected ? 'bg-emerald-400 text-emerald-950 shadow-[0_4px_0_#059669]' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid min-w-0 gap-3 overflow-hidden rounded-[24px] border-4 border-white bg-white/80 p-3 shadow-sm sm:p-4">
        <h4 className="text-sm font-black text-amber-800">코인 보상 배율</h4>
        <div className="grid grid-cols-3 gap-2">
          {coinRewardOptions.map((option) => {
            const selected = coinRewardMultiplier === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onCoinRewardMultiplier(option.value)}
                className={`min-h-12 rounded-[16px] px-2 text-xs font-black transition active:translate-y-1 ${
                  selected ? 'bg-amber-300 text-amber-950 shadow-[0_4px_0_#d97706]' : 'bg-amber-50 text-amber-800'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[24px] border-4 border-white bg-white/80 p-3 shadow-sm sm:p-4">
        <h4 className="text-sm font-black text-slate-800">저장 데이터</h4>
        <p className="mt-2 break-words rounded-[18px] bg-slate-50 px-3 py-2 text-xs font-black leading-snug text-slate-500">{storageFeedback}</p>
        <button
          type="button"
          onClick={onResetSavedGameState}
          className="mt-3 min-h-12 w-full rounded-[16px] bg-slate-800 px-4 text-sm font-black text-white shadow-[0_4px_0_#0f172a] transition active:translate-y-1 active:shadow-none"
        >
          저장 데이터 초기화
        </button>
      </section>
    </section>
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
  inputMode,
  feedback,
  submissionResult,
  lastRewards,
  lastTrainingEffects,
  setCompleteRewards,
  completedTrainingSummary,
  isSetComplete,
  currentCoins,
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
  onGoToShop,
  onExitTraining,
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
  inputMode: TrainingInputMode;
  feedback: string;
  submissionResult: SubmissionResult;
  lastRewards: Reward[];
  lastTrainingEffects: string[];
  setCompleteRewards: Reward[];
  completedTrainingSummary: CompletedTrainingSummary | null;
  isSetComplete: boolean;
  currentCoins: number;
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
  onGoToShop: () => void;
  onExitTraining: () => void;
  onGoToDino: () => void;
  onGoToHatchery: () => void;
}) {
  const canSubmitAnswer = !isSetComplete;
  const problemExpression = currentProblem.expressionText ?? currentProblem.displayText;
  const mascotMessage = getTrainingMascotMessage({ answer, isSetComplete, submissionResult });

  return (
    <div className="training-screen h-full min-h-0" style={{ backgroundImage: `url(${trainingBackground})` }}>
      <section className="training-stage relative flex h-full min-h-0 flex-col overflow-hidden p-3 md:p-5">
        {!isSetComplete && <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-20">
          {trainingUiAssets.cornerTopLeft && <img src={trainingUiAssets.cornerTopLeft} alt="" className="absolute left-0 top-0 h-20 w-20 object-contain object-left-top" />}
          {trainingUiAssets.cornerTopRight && <img src={trainingUiAssets.cornerTopRight} alt="" className="absolute right-0 top-0 h-20 w-20 object-contain object-right-top" />}
          {trainingUiAssets.cornerBottomLeft && <img src={trainingUiAssets.cornerBottomLeft} alt="" className="absolute bottom-0 left-0 h-20 w-20 object-contain object-left-bottom" />}
          {trainingUiAssets.cornerBottomRight && <img src={trainingUiAssets.cornerBottomRight} alt="" className="absolute bottom-0 right-0 h-20 w-20 object-contain object-right-bottom" />}
          {trainingUiAssets.footprints ? <img src={trainingUiAssets.footprints} alt="" className="absolute bottom-20 right-4 h-14 w-24 rotate-12 object-contain" /> : <span className="absolute bottom-20 right-4 text-3xl">🐾</span>}
        </div>}
        {!isSetComplete && <div className="training-content-column relative z-10 mx-auto grid w-full max-w-[680px] shrink-0 gap-2">
          <div className="training-hud grid h-[clamp(58px,8dvh,74px)] grid-cols-[minmax(86px,1fr)_auto_minmax(86px,1fr)] items-center gap-2 rounded-[18px] border-2 border-white/90 bg-white/82 px-3 py-2 shadow-[0_6px_18px_rgba(14,116,144,.08)]">
            <button onClick={() => { playSound('ui_button_tap'); onExitTraining(); }} className="training-exit-button flex min-h-11 justify-self-start items-center justify-center rounded-[14px] bg-white px-4 text-sm font-black text-emerald-800 shadow-sm transition active:translate-y-1">
              나가기
            </button>
            <div className="training-progress-sign min-w-[220px] max-w-[400px] justify-self-center rounded-[14px] bg-[#f6d89d] px-4 py-2 text-center text-base font-black text-amber-950 shadow-[inset_0_-3px_0_rgba(120,53,15,.18)]">
              문제 {Math.min(currentProblemIndex + 1, totalProblems)} / {totalProblems}
            </div>
            <div className="training-coin-bar">
              <img src={homeCoinBar} alt="" className="training-coin-bar__image" aria-hidden="true" />
              <span className="training-coin-bar__value">{currentCoins.toLocaleString()}</span>
            </div>
          </div>
          <div className="training-score-summary mx-auto grid h-[clamp(48px,7dvh,62px)] w-[82%] max-w-[520px] grid-cols-2 gap-3">
            <TrainingStatusBadge asset={trainingStatusCorrectBanner} className="training-correct-badge">
              <strong className="training-status-banner__value">{correctCount}</strong>
            </TrainingStatusBadge>
            <TrainingStatusBadge asset={trainingStatusWrongBanner} className="training-wrong-badge">
              <strong className="training-status-banner__value">{wrongCount}</strong>
            </TrainingStatusBadge>
          </div>
        </div>}

        {isSetComplete ? (
          <div className="min-h-0 flex-1 px-1 pb-5 pt-1 sm:px-3">
            <TrainingCompletePanel
              summary={completedTrainingSummary}
              totalProblems={totalProblems}
              correctCount={correctCount}
              onRestartTraining={onRestartTraining}
              onGoToShop={onGoToShop}
              onGoToDino={onGoToDino}
            />
          </div>
        ) : (
          <div className="training-workspace relative z-10 mt-3 min-h-0 min-w-0 flex-1 overflow-hidden p-3 md:p-4">
            <CurrentProblemCard
              answer={answer}
              inputMode={inputMode}
              canSubmitAnswer={canSubmitAnswer}
              mascotMessage={mascotMessage}
              onAnswer={onAnswer}
              onCheck={onCheck}
              problemExpression={problemExpression}
              submissionResult={submissionResult}
            />
          </div>
        )}

        {showDeveloperPanels && <details className="mt-5 rounded-[24px] border-4 border-dashed border-cyan-100 bg-white/60 px-4 py-3">
          <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용: 생성된 문제 전체 보기</summary>
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
        </details>}
      </section>
    </div>
  );
}

function TrainingStatusBadge({ asset, className, children }: { asset?: string; className: string; children: ReactNode }) {
  return (
    <span className={asset ? `training-status-banner ${className}` : `relative flex min-h-11 min-w-0 items-center justify-center overflow-hidden rounded-[18px] border-2 px-4 py-2 shadow-sm ${className}`}>
      {asset && <img src={asset} alt="" className="training-status-banner__image" aria-hidden="true" />}
      <span className={asset ? 'training-status-banner__content' : 'relative z-10 text-base font-black'}>{children}</span>
    </span>
  );
}

function TrainingRewardIcon({ asset, fallback }: { asset?: string; fallback: ReactNode }) {
  return <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/55">{asset ? <img src={asset} alt="" className="h-full w-full object-contain" /> : fallback}</span>;
}

function TrainingBoardStatusBar({
  activeOwnedDinosaur,
  dinosaur,
  effectiveDigitTypeLabel,
  effectiveNumberCountLabel,
  effectiveOperationsLabel,
  effectiveProblemCount,
  reaction,
  selectedLevelTitle,
  staminaMessage,
  usesFallbackGenerator,
  ownedDinosaurs,
  onSelectAdjacentDinosaur,
}: {
  activeOwnedDinosaur: OwnedDinosaur;
  dinosaur: DinosaurState;
  effectiveDigitTypeLabel: string;
  effectiveNumberCountLabel: string;
  effectiveOperationsLabel: string;
  effectiveProblemCount: number;
  reaction: string;
  selectedLevelTitle?: string;
  staminaMessage: string;
  usesFallbackGenerator: boolean;
  ownedDinosaurs: OwnedDinosaur[];
  onSelectAdjacentDinosaur: (direction: -1 | 1) => void;
}) {
  const activeSpecies = dinosaurSpecies.find((species) => species.speciesId === activeOwnedDinosaur.speciesId);
  const uniqueOwnedCount = getUniqueOwnedDinosaurs(ownedDinosaurs).length;

  return (
    <div className="mt-3 grid min-w-0 items-center gap-2 overflow-hidden rounded-[20px] border-2 border-white/80 bg-white/58 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.9)] md:grid-cols-[minmax(0,1.35fr)_minmax(260px,.9fr)] xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,.9fr)_auto]">
      <div className="min-w-0">
        <p className="text-[10px] font-black tracking-wide text-cyan-700">현재 난이도</p>
        <p className="truncate text-xs font-black text-slate-600">{selectedLevelTitle ?? '단계 정보 확인 중'}</p>
        <p className="mt-0.5 truncate text-sm font-black text-emerald-950">
          {effectiveProblemCount}문제 · {effectiveNumberCountLabel} 수 · {effectiveDigitTypeLabel} · {effectiveOperationsLabel}
        </p>
        {usesFallbackGenerator && <p className="mt-0.5 text-[10px] font-black text-amber-700">임시 생성 규칙 사용 중</p>}
      </div>
      <div className="grid min-w-0 grid-cols-[auto_48px_minmax(0,1fr)_auto] items-center gap-2 overflow-hidden">
        <NavigationArrow
          direction="previous"
          ariaLabel="이전 훈련 공룡"
          disabled={uniqueOwnedCount <= 1}
          onClick={() => onSelectAdjacentDinosaur(-1)}
          className="h-11 w-11"
        />
        <div className="flex h-12 w-12 items-end justify-center overflow-hidden rounded-[12px] bg-gradient-to-b from-sky-50 to-lime-100">
          {trainingUiAssets.cheerDino ? <img src={trainingUiAssets.cheerDino} alt="함께 훈련 중인 공룡" className="h-full w-full object-contain" /> : <DinoAvatar size="small" />}
        </div>
        <div className="min-w-0">
          <p className="break-words text-xs font-black leading-snug text-cyan-700">{dinosaur.name}와 훈련 중</p>
          <p className="break-words text-sm font-black leading-snug text-emerald-950">{reaction}</p>
          <p className="break-words text-[10px] font-bold leading-snug text-slate-500">{activeSpecies?.displayName ?? activeOwnedDinosaur.speciesId} · {staminaMessage}</p>
        </div>
        <NavigationArrow
          direction="next"
          ariaLabel="다음 훈련 공룡"
          disabled={uniqueOwnedCount <= 1}
          onClick={() => onSelectAdjacentDinosaur(1)}
          className="h-11 w-11"
        />
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 rounded-[16px] bg-amber-50/80 px-3 py-2 text-xs font-black text-amber-950 md:col-span-2 md:justify-center xl:col-span-1">
        <span className="text-[10px] tracking-wide text-amber-700">세트 완료 보상</span>
        <TrainingRewardIcon asset={trainingUiAssets.rewardCoin} fallback={<Coins className="h-4 w-4" />} />
        <span>코인</span>
      </div>
    </div>
  );
}

function CurrentProblemCard({
  answer,
  inputMode,
  canSubmitAnswer,
  mascotMessage,
  onAnswer,
  onCheck,
  problemExpression,
  submissionResult,
}: {
  answer: string;
  inputMode: TrainingInputMode;
  canSubmitAnswer: boolean;
  mascotMessage: string;
  onAnswer: (value: string) => void;
  onCheck: () => void;
  problemExpression: string;
  submissionResult: SubmissionResult;
}) {
  const expressionElementRef = useRef<HTMLDivElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);
  const [expressionFit, setExpressionFit] = useState({ sizeIndex: 0, wrap: false });

  function appendDigit(digit: string) {
    if (!canSubmitAnswer) return;
    playSound('training_number_input');
    onAnswer(`${answer}${digit}`);
  }

  function deleteDigit() {
    if (!canSubmitAnswer) return;
    playSound('ui_button_tap');
    onAnswer(answer.slice(0, -1));
  }

  function clearAnswer() {
    if (!canSubmitAnswer) return;
    playSound('ui_button_tap');
    onAnswer('');
  }

  const expressionTokens = problemExpression.match(/\d+|[+−-]/g) ?? [problemExpression];
  const answerSize = answer.length <= 3
    ? 'training-answer-input--short'
    : answer.length <= 5
      ? 'training-answer-input--medium'
      : 'training-answer-input--long';
  const expressionSizes = [
    'training-problem-board__expression--hero',
    'training-problem-board__expression--large',
    'training-problem-board__expression--seven-items',
    'training-problem-board__expression--long',
    'training-problem-board__expression--small',
  ];
  const expressionSize = expressionSizes[expressionFit.sizeIndex];

  useLayoutEffect(() => {
    setExpressionFit({ sizeIndex: 0, wrap: false });
  }, [problemExpression]);

  useLayoutEffect(() => {
    const expressionElement = expressionElementRef.current;
    if (!expressionElement) return;

    const hasHorizontalOverflow = expressionElement.scrollWidth > expressionElement.clientWidth + 1;
    const hasVerticalOverflow = expressionElement.scrollHeight > expressionElement.clientHeight + 1;
    const lineCount = new Set(
      Array.from(expressionElement.children, (child) => (child as HTMLElement).offsetTop),
    ).size;

    if (!expressionFit.wrap && hasHorizontalOverflow) {
      if (expressionFit.sizeIndex < 2) {
        setExpressionFit((current) => ({ ...current, sizeIndex: current.sizeIndex + 1 }));
      } else {
        setExpressionFit((current) => ({ ...current, wrap: true }));
      }
      return;
    }

    if (expressionFit.wrap && (hasHorizontalOverflow || hasVerticalOverflow || lineCount > 2) && expressionFit.sizeIndex < expressionSizes.length - 1) {
      setExpressionFit((current) => ({ ...current, sizeIndex: current.sizeIndex + 1 }));
    }
  }, [expressionFit, expressionSizes.length]);

  useEffect(() => {
    const expressionElement = expressionElementRef.current;
    if (!expressionElement) return;

    const resizeObserver = new ResizeObserver(() => {
      setExpressionFit({ sizeIndex: 0, wrap: false });
    });
    resizeObserver.observe(expressionElement);
    return () => resizeObserver.disconnect();
  }, [problemExpression]);

  return (
    <div className={`training-input-layout training-input-layout--${inputMode} grid h-full min-h-0 min-w-0 gap-3 overflow-hidden`}>
      <section className="training-problem-board" aria-label="계산 문제">
        <img src={trainingProblemBoard} alt="" className="training-problem-board__image" aria-hidden="true" />
        <div className="training-problem-board__content">
          <p className="training-problem-board__instruction">다음을 계산해 보세요!</p>
          <div
            ref={expressionElementRef}
            className={`training-problem-board__expression ${expressionSize} ${expressionFit.wrap ? 'training-problem-board__expression--wrap' : ''}`}
            aria-label={problemExpression}
          >
            {expressionTokens.map((token, index) => (
              <span key={`${token}-${index}`} className={/^[-+−]$/.test(token) ? 'text-emerald-600' : ''}>{token}</span>
            ))}
          </div>
        </div>
      </section>

      {inputMode === 'pencil' ? (
        <section className="training-pencil-input mx-auto flex min-h-0 w-[84%] max-w-[680px] flex-col gap-3">
          <label className="training-pencil-input__field">
            <span className="sr-only">펜슬로 정답 입력</span>
            <input
              ref={answerInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              enterKeyHint="done"
              value={answer}
              onChange={(event) => onAnswer(event.target.value.replace(/\D/g, ''))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onCheck();
              }}
              disabled={!canSubmitAnswer}
              placeholder="여기에 숫자를 써 보세요"
              className={`training-pencil-input__control ${answerSize}`}
            />
          </label>
          <TrainingSubmissionStatus result={submissionResult} />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={!canSubmitAnswer} onClick={clearAnswer} className="training-pencil-action training-pencil-action--clear">지우기</button>
            <button type="button" disabled={!canSubmitAnswer} onClick={onCheck} className="training-pencil-action training-pencil-action--submit">입력</button>
          </div>
        </section>
      ) : (
        <>
          <AnswerDisplay
            answer={answer}
            answerSize={answerSize}
            inputMode={inputMode}
            label={inputMode === 'bluetooth' ? '주판 입력값' : '입력 중인 답'}
            submissionResult={submissionResult}
          />
          {inputMode === 'keypad' && (
            <div className="min-h-0 overflow-hidden pt-1">
              <NumberPad disabled={!canSubmitAnswer} onDigit={appendDigit} onDelete={deleteDigit} onSubmit={onCheck} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AnswerDisplay({
  answer,
  answerSize,
  inputMode,
  label,
  submissionResult,
}: {
  answer: string;
  answerSize: string;
  inputMode: Exclude<TrainingInputMode, 'pencil'>;
  label: string;
  submissionResult: SubmissionResult;
}) {
  return (
    <section className={`training-answer-row training-answer-row--${inputMode} mx-auto w-[84%] max-w-[680px] min-h-0`} aria-live="polite">
      <div className="training-answer-panel">
        <img src={trainingAnswerPanel} alt="" className="training-answer-panel__image" aria-hidden="true" />
        <span className="training-answer-panel__content">
          <span className="training-answer-panel__instruction">{label}</span>
          <output className={`training-answer-input ${answerSize}`}>{answer || '?'}</output>
        </span>
      </div>
      <TrainingSubmissionStatus result={submissionResult} />
    </section>
  );
}

function TrainingSubmissionStatus({ result }: { result: SubmissionResult }) {
  const isCorrect = result === 'correct';
  const isWrong = result === 'wrong';

  return (
    <div
      className={`training-submission-status ${
        isCorrect ? 'training-submission-status--correct' : isWrong ? 'training-submission-status--wrong' : 'training-submission-status--idle'
      }`}
      aria-live="polite"
      aria-atomic="true"
    >
      {isCorrect ? '✓ 정답!' : isWrong ? '! 다시 해봐!' : '\u00A0'}
    </div>
  );
}

function NumberPad({ disabled, onDigit, onDelete, onSubmit }: { disabled: boolean; onDigit: (digit: string) => void; onDelete: () => void; onSubmit: () => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="training-keypad">
      <img src={trainingKeypadPanel} alt="" className="training-keypad__image" aria-hidden="true" />
      <div className="training-keypad__grid">
        {keys.map((key) => (
          <button
            key={key}
            disabled={disabled}
            onClick={() => onDigit(key)}
            className="training-key training-key-number"
          >
            <img src={trainingKeyDefault} alt="" className="training-key-number__image training-key-number__image--default" aria-hidden="true" />
            <img src={trainingKeyPressed} alt="" className="training-key-number__image training-key-number__image--pressed" aria-hidden="true" />
            <span className="training-key-number__label">{key}</span>
          </button>
        ))}
        <button
          disabled={disabled}
          onClick={onDelete}
          className="training-key training-key-number training-key-delete"
        >
          <img src={trainingKeyDelete} alt="" className="training-key-number__image" aria-hidden="true" />
          <span className="training-key-delete__label">삭제</span>
        </button>
        <button
          disabled={disabled}
          onClick={() => onDigit('0')}
          className="training-key training-key-number"
        >
          <img src={trainingKeyDefault} alt="" className="training-key-number__image training-key-number__image--default" aria-hidden="true" />
          <img src={trainingKeyPressed} alt="" className="training-key-number__image training-key-number__image--pressed" aria-hidden="true" />
          <span className="training-key-number__label">0</span>
        </button>
        <button
          disabled={disabled}
          onClick={onSubmit}
          className="training-key training-key-number training-key-submit"
        >
          <img src={trainingKeySubmit} alt="" className="training-key-number__image" aria-hidden="true" />
          <span className="training-key-submit__label">입력</span>
        </button>
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
    <div className="grid min-h-[70px] grid-cols-[auto_56px_minmax(0,1fr)_auto] items-center gap-2 rounded-[16px] border-2 border-white bg-gradient-to-r from-lime-50/90 to-cyan-50/90 px-2.5 py-1.5 shadow-sm">
        <NavigationArrow
          direction="previous"
          ariaLabel="이전 훈련 공룡"
          disabled={uniqueOwnedCount <= 1}
          onClick={() => onSelectAdjacentDinosaur(-1)}
          className="h-11 w-11"
        />
        <div className="flex h-14 w-14 items-end justify-center overflow-hidden rounded-[12px] bg-gradient-to-b from-sky-50 to-lime-100">
          {trainingUiAssets.cheerDino ? <img src={trainingUiAssets.cheerDino} alt="응원하는 공룡" className="h-full w-full object-contain" /> : <DinoAvatar size="small" />}
        </div>
        <div className="relative min-w-0 overflow-hidden rounded-[12px] px-2 py-1">
          {trainingUiAssets.cheerBubble && <img src={trainingUiAssets.cheerBubble} alt="" className="absolute inset-0 h-full w-full object-fill opacity-80" />}
          <div className="relative z-10">
          <p className="text-xs font-black text-cyan-700">{dinosaur.name}와 함께 훈련 중!</p>
          <p className="truncate text-sm font-black text-emerald-950">{reaction}</p>
          <p className="truncate text-[10px] font-bold text-slate-500">{activeSpecies?.displayName ?? activeOwnedDinosaur.speciesId} · {staminaMessage}</p>
          </div>
        </div>
        <NavigationArrow
          direction="next"
          ariaLabel="다음 훈련 공룡"
          disabled={uniqueOwnedCount <= 1}
          onClick={() => onSelectAdjacentDinosaur(1)}
          className="h-11 w-11"
        />
    </div>
  );
}

function DinoTrainingMeter({ label, value, tone }: { label: string; value: number; tone: string }) {
  const percent = clampUiPercent(value);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-black text-emerald-900">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}

function TrainingCompletePanel({
  summary,
  totalProblems,
  correctCount,
  onRestartTraining,
  onGoToShop,
  onGoToDino,
}: {
  summary: CompletedTrainingSummary | null;
  totalProblems: number;
  correctCount: number;
  onRestartTraining: () => void;
  onGoToShop: () => void;
  onGoToDino: () => void;
}) {
  const displayTotalProblems = summary?.totalProblems ?? totalProblems;
  const displayCorrectCount = summary?.correctCount ?? correctCount;
  const displayAccuracy = summary?.accuracy ?? (displayTotalProblems > 0 ? Math.round((displayCorrectCount / displayTotalProblems) * 100) : 0);
  const accuracyRewardMultiplier = summary?.rewardMultiplier ?? (displayAccuracy >= 80 ? 1 : displayAccuracy >= 50 ? 0.8 : 0.6);
  const coinMultiplier = summary?.coinRewardMultiplier ?? 1;
  const hasCoinBonus = summary ? coinMultiplier !== 1 || summary.coins !== summary.baseCoins : false;
  const bonusCoinAmount = summary ? summary.coins - summary.baseCoins : 0;
  const subtitle = displayAccuracy >= 90 ? '정말 잘했어요!' : displayAccuracy >= 70 ? '좋았어요!' : '다시 도전해요!';
  const resultRows = [
    { icon: '✓', label: '정답 수', value: `${displayCorrectCount} / ${displayTotalProblems}`, className: 'text-emerald-700' },
    { icon: '%', label: '정확도', value: `${displayAccuracy}%`, className: 'text-cyan-700' },
    { icon: '★', label: '정확도 보너스', value: `x${accuracyRewardMultiplier}`, className: 'text-fuchsia-700 training-result-accuracy-bonus' },
    { icon: '⏱', label: '걸린 시간', value: summary ? formatTrainingDuration(summary.elapsedMs) : '정산 중', className: 'text-violet-700' },
    ...(hasCoinBonus
      ? [{ icon: '×', label: '코인 보너스', value: coinMultiplier !== 1 ? `x${coinMultiplier}` : `+${bonusCoinAmount.toLocaleString()}`, className: 'text-orange-700 training-result-coin-bonus' }]
      : []),
    { icon: '●', label: '획득 코인', value: summary ? `+${summary.coins.toLocaleString()}` : '정산 중', className: 'text-amber-600 training-result-coin-row' },
  ];

  return (
    <section className="training-complete-popup">
      <img src={trainingCompletePopupPanel} alt="" aria-hidden="true" className="training-complete-popup__background" />

      <div className="training-complete-popup__content">
        <header className="training-complete-popup__header">
          <img src={trainingCompleteTitleBadge} alt="" aria-hidden="true" className="training-complete-popup__title-badge" />
          <h4 className="sr-only">훈련 완료!</h4>
          <p className="training-complete-popup__subtitle">{subtitle}</p>
        </header>

        <section className="training-complete-popup__body">
          <div className="training-result-panel">
            {resultRows.map((row) => (
              <div key={row.label} className="training-result-row">
                <span className="training-result-row__heading">
                  <span className="training-result-row-icon">{row.icon}</span>
                  <span className="training-result-row-label">{row.label}</span>
                </span>
                <span className={`training-result-row-value ${row.className}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="training-result-actions">
          <button type="button" onClick={onGoToDino} className="training-result-action training-result-feed-button" aria-label="공룡에게 먹이 주기">
            <img src={trainingCompleteFeedButton} alt="" aria-hidden="true" className="training-result-action__image" />
          </button>
          <button type="button" onClick={onRestartTraining} className="training-result-action training-result-retry-button" aria-label="다시하기">
            <img src={trainingCompleteRetryButton} alt="" aria-hidden="true" className="training-result-action__image" />
          </button>
        </section>

        <p className="training-result-tip">
          연습을 꾸준히 하면 더 빨라질 수 있어요!
        </p>
      </div>
    </section>
  );
}

function formatTrainingDuration(elapsedMs: number) {
  const totalSeconds = Math.max(0, Math.round(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;
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
        <NavigationArrow
          direction="previous"
          ariaLabel="이전 훈련 공룡"
          disabled={uniqueOwnedCount <= 1}
          onClick={() => onSelectAdjacentDinosaur(-1)}
          className="h-14 w-14"
        />
        <div className="text-center">
          <p className="text-sm font-black text-cyan-700">함께 훈련 중!</p>
          <h4 className="text-2xl font-black text-emerald-950">{dinosaur.name}</h4>
        </div>
        <NavigationArrow
          direction="next"
          ariaLabel="다음 훈련 공룡"
          disabled={uniqueOwnedCount <= 1}
          onClick={() => onSelectAdjacentDinosaur(1)}
          className="h-14 w-14"
        />
      </div>
      <div className="flex min-h-44 items-end justify-center rounded-[28px] border-4 border-white bg-gradient-to-b from-sky-100 via-emerald-100 to-lime-200 p-3 shadow-inner">
        <DinoAvatar size="small" />
      </div>
      <p className="mt-3 rounded-full bg-amber-100 px-4 py-2 text-center text-sm font-black text-amber-800">
        {activeSpecies?.displayName ?? activeOwnedDinosaur.speciesId} · {rarityLabels[activeOwnedDinosaur.rarity]}
      </p>
      <p className="mt-2 rounded-full bg-violet-100 px-4 py-2 text-center text-sm font-black text-violet-800">착용: {formatEquippedCostumes(activeOwnedDinosaur.equippedCostumes)}</p>
      <div className="mt-4 grid gap-3">
        <Meter label="행복" value={dinosaur.happiness} tone="from-pink-400 to-rose-500" />
        <Meter label="체력" value={getPercentValue(dinosaur.stamina, dinosaur.maxStamina)} tone="from-emerald-400 to-lime-500" />
      </div>
    </div>
  );
}

function OnboardingView({ onComplete }: { onComplete: (profileInput: { childName: string; starterSpeciesId: string; dinosaurName: string }) => void }) {
  const starterSpecies = getStarterSelectableSpecies();
  const [childName, setChildName] = useState('');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(starterSpecies[0]?.speciesId ?? initialOwnedDinosaur.speciesId);
  const selectedSpecies = starterSpecies.find((species) => species.speciesId === selectedSpeciesId) ?? starterSpecies[0];
  const [dinosaurName, setDinosaurName] = useState(selectedSpecies?.defaultName ?? '몽이');

  function selectStarterSpecies(speciesId: string) {
    const species = starterSpecies.find((candidate) => candidate.speciesId === speciesId);
    setSelectedSpeciesId(speciesId);
    if (species) setDinosaurName(species.defaultName);
  }

  function submitProfile() {
    onComplete({ childName, starterSpeciesId: selectedSpeciesId, dinosaurName });
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-sky-200 via-cyan-100 to-lime-100 p-4 text-slate-800 md:p-6">
      <main className="mx-auto flex h-full max-w-5xl items-center justify-center">
        <section className="relative grid w-full gap-4 overflow-hidden rounded-[32px] border-4 border-white bg-white/84 p-4 shadow-[0_24px_60px_rgba(14,116,144,0.22)] backdrop-blur md:grid-cols-[1fr_0.82fr] md:p-6">
          <SkyDecor />
          <div className="relative z-10">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border-2 border-cyan-200 bg-white px-4 py-1.5 text-sm font-black text-cyan-800 shadow-sm">
              <Sparkles className="h-4 w-4" />
              처음 만나는 공룡 친구
            </div>
            <h1 className="text-4xl font-black leading-tight text-emerald-950 md:text-5xl">프로필 만들기</h1>
            <p className="mt-2 max-w-lg text-base font-black leading-relaxed text-emerald-800/80">이름을 정하고 대표 공룡과 함께 주산 모험을 시작해요.</p>

            <div className="mt-4 grid gap-3">
              <ProfileInput label="아이 이름/닉네임" value={childName} placeholder="친구" onChange={setChildName} />
              <div className="rounded-[22px] border-4 border-white bg-white/90 p-3 shadow-sm">
                <p className="text-sm font-black text-emerald-700">첫 번째 공룡 친구를 골라볼까요?</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {starterSpecies.map((species) => {
                    const isSelected = species.speciesId === selectedSpeciesId;
                    return (
                      <button
                        key={species.speciesId}
                        onClick={() => selectStarterSpecies(species.speciesId)}
                        className={`min-h-16 rounded-[18px] border-4 px-3 py-2 text-left transition active:translate-y-1 ${
                          isSelected ? 'border-cyan-300 bg-cyan-100 text-cyan-950 shadow-[0_5px_0_#67e8f9]' : 'border-white bg-slate-50 text-slate-700 hover:bg-cyan-50'
                        }`}
                      >
                        <span className="block text-lg font-black">{species.displayName}</span>
                        <span className="mt-1 block text-xs font-black opacity-70">{species.personality} · {species.defaultName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <ProfileInput label="첫 공룡 이름" value={dinosaurName} placeholder={selectedSpecies?.defaultName ?? '몽이'} onChange={setDinosaurName} />
            </div>

            <button
              onClick={submitProfile}
              className="mt-4 inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-[24px] border-4 border-white bg-gradient-to-b from-cyan-400 to-cyan-500 px-8 text-xl font-black text-white shadow-[0_8px_0_#0891b2,0_18px_24px_rgba(8,145,178,0.24)] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_4px_0_#0891b2] sm:w-fit"
            >
              모험 시작하기
              <Play className="h-6 w-6 fill-white" />
            </button>
          </div>

          <div className="relative z-10 flex min-h-[360px] items-end justify-center rounded-[28px] bg-gradient-to-b from-sky-100 via-emerald-50 to-lime-200 p-4 shadow-inner">
            <div className="absolute bottom-0 left-0 right-0 h-28 rounded-t-[50%] bg-lime-300/70" />
            <div className="absolute left-5 top-5 rounded-[20px] border-4 border-white bg-white/90 px-4 py-2 shadow-lg">
              <p className="text-sm font-black text-cyan-700">시작 공룡</p>
              <p className="text-3xl font-black text-slate-950">{dinosaurName.trim() || selectedSpecies?.defaultName || '몽이'}</p>
              <p className="mt-1 text-xs font-black text-slate-500">{selectedSpecies?.displayName ?? '공룡 친구'}</p>
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
    <label className="block rounded-[22px] border-4 border-white bg-white/90 p-3 shadow-sm">
      <span className="text-sm font-black text-emerald-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-14 w-full rounded-[18px] bg-slate-50 px-4 text-lg font-black text-slate-900 focus:bg-cyan-50"
      />
    </label>
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
  growthSpeedMultiplier,
  coinRewardMultiplier,
  discoveredDinosaurCount,
  totalDinosaurCount,
  unlockedItemCount,
  totalItemCount,
  currentCoins,
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
  onGrowthSpeedMultiplier,
  onCoinRewardMultiplier,
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
  growthSpeedMultiplier: GrowthSpeedMultiplier;
  coinRewardMultiplier: CoinRewardMultiplier;
  discoveredDinosaurCount: number;
  totalDinosaurCount: number;
  unlockedItemCount: number;
  totalItemCount: number;
  currentCoins: number;
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
  onGrowthSpeedMultiplier: (value: GrowthSpeedMultiplier) => void;
  onCoinRewardMultiplier: (value: CoinRewardMultiplier) => void;
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
      <section className="rounded-[30px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h3 className="text-2xl font-black text-slate-950">설정</h3>
        <p className="mt-1 text-sm font-black text-slate-500">교재 진도에 맞춰 복습할 단계를 고릅니다.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[260px_1fr]">
          <label className="grid gap-2 text-sm font-black text-emerald-800">
            교재 단계
            <select
              value={String(selectedLevel)}
              onChange={(event) => onSelectLevel(Number(event.target.value))}
              className="min-h-14 rounded-[18px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 focus:border-cyan-300"
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
              className="min-h-14 rounded-[18px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 focus:border-cyan-300"
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
              className="min-h-14 rounded-[18px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 focus:border-cyan-300"
            >
              <option value="stage-default">{formatNumberCountOverride('stage-default', selectedLevelStages)}</option>
              <option value="3">3개</option>
              <option value="4">4개</option>
              <option value="5">5개</option>
              <option value="6">6개</option>
              <option value="7">7개</option>
              <option value="8">8개</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-emerald-800">
            숫자 자리수
            <select
              value={digitTypeOverride}
              onChange={(event) => onDigitTypeOverride(normalizeDigitTypeOverride(event.target.value))}
              className="min-h-14 rounded-[18px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 focus:border-cyan-300"
            >
              <option value="stage-default">{formatDigitTypeOverride('stage-default', selectedStage)}</option>
              <option value="one-digit">한 자리</option>
              <option value="two-digit">두 자리</option>
              <option value="three-digit">세 자리</option>
              <option value="mixed-two-three-digit">두·세 자리 혼합</option>
              <option value="mixed-digit">한 자리 + 두 자리</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-emerald-800">
            연산 방식
            <select
              value={operationsOverride}
              onChange={(event) => onOperationsOverride(normalizeOperationsOverride(event.target.value))}
              className="min-h-14 rounded-[18px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 focus:border-cyan-300"
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
        {showSettingsAdvancedPanels && <details className="mt-4 rounded-[24px] border-4 border-dashed border-cyan-100 bg-white/60 px-4 py-3">
          <summary className="cursor-pointer text-sm font-black text-slate-700">개발자용 세부 단계 설정</summary>
          <p className="mt-2 text-xs font-black text-slate-500">세부 stage id는 내부 문제 생성과 개발자 모드용입니다. 기본 부모 설정 화면에서는 교재 단계만 사용합니다.</p>
          <label className="mt-3 grid gap-2 text-xs font-black text-emerald-800">
            내부 stage
            <select
              value={selectedStageId}
              onChange={(event) => onSelectStage(event.target.value)}
              className="min-h-11 rounded-[16px] border-4 border-cyan-100 bg-white px-3 text-sm font-black text-slate-900 focus:border-cyan-300"
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
        </details>}
        {showSettingsAdvancedPanels && <details className="mt-4 rounded-[24px] border-4 border-dashed border-lime-100 bg-white/60 px-4 py-3">
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
        </details>}
        {showSettingsAdvancedPanels && <details className="mt-4 rounded-[24px] border-4 border-dashed border-emerald-100 bg-white/60 px-4 py-3">
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
        </details>}
      </section>
      <section className="rounded-[30px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h3 className="text-2xl font-black text-emerald-950">보상 밸런스</h3>
        <p className="mt-2 text-sm font-black text-slate-500">아이의 훈련량에 맞춰 공룡 성장과 코인 보상을 조절해요.</p>
        <h4 className="mt-5 text-sm font-black text-emerald-800">공룡 성장 속도</h4>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {growthSpeedOptions.map((option) => {
            const isSelected = growthSpeedMultiplier === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onGrowthSpeedMultiplier(option.value)}
                className={`min-h-14 rounded-[20px] border-4 px-4 py-3 text-sm font-black transition ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-100 text-emerald-900 shadow-sm'
                    : 'border-white bg-slate-50 text-slate-600 hover:bg-emerald-50'
                }`}
              >
                {option.label} {option.percent}%
              </button>
            );
          })}
        </div>
        <h4 className="mt-5 text-sm font-black text-amber-800">코인 보상량</h4>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {coinRewardOptions.map((option) => {
            const isSelected = coinRewardMultiplier === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onCoinRewardMultiplier(option.value)}
                className={`min-h-14 rounded-[20px] border-4 px-4 py-3 text-sm font-black transition ${
                  isSelected
                    ? 'border-amber-400 bg-amber-100 text-amber-900 shadow-sm'
                    : 'border-white bg-slate-50 text-slate-600 hover:bg-amber-50'
                }`}
              >
                {option.label} {option.percent}%
              </button>
            );
          })}
        </div>
        <p className="mt-3 rounded-[18px] bg-cyan-50 px-4 py-3 text-xs font-black text-cyan-800">
          각 설정은 공룡 EXP와 코인에만 독립 적용되며, 난이도·행복·체력·아이템에는 영향을 주지 않습니다.
        </p>
        <div className="mt-5">
          <h4 className="text-base font-black text-slate-800">현재 해금 현황</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SettingChip label="공룡 도감" value={`${discoveredDinosaurCount} / ${totalDinosaurCount}`} />
            <SettingChip label="아이템" value={`${unlockedItemCount} / ${totalItemCount}`} />
            <SettingChip label="보유 코인" value={currentCoins.toLocaleString()} />
          </div>
        </div>
      </section>
      <section className="rounded-[30px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h3 className="text-2xl font-black text-emerald-950">프로필</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
            <SettingChip label="이름" value={userProfile?.childName ?? '미설정'} />
            <SettingChip label="나이/학년" value={userProfile?.ageOrGrade ?? '미설정'} />
            <SettingChip label="대표 공룡" value={userProfile?.dinosaurName ?? '미설정'} />
            <SettingChip label="부모 모드" value={userProfile?.parentModeEnabled ? '켜짐' : '꺼짐'} />
        </div>
      </section>
      <section className="rounded-[30px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h3 className="text-2xl font-black text-slate-950">저장 데이터</h3>
        <p className="mt-2 font-black text-slate-500">이 브라우저의 localStorage에 현재 코인, 공룡, 알, 인벤토리를 저장합니다.</p>
        <p className="mt-4 rounded-[22px] border-4 border-white bg-slate-50 px-4 py-3 font-black text-slate-700 shadow-sm">{storageFeedback}</p>
        <button
          onClick={onResetSavedGameState}
          className="mt-4 min-h-14 rounded-full bg-slate-800 px-5 text-sm font-black text-white shadow-[0_4px_0_#0f172a] transition active:translate-y-1 active:shadow-none"
        >
          프로필/저장 데이터 초기화
        </button>
      </section>
      {showSettingsAdvancedPanels && <section className="rounded-[28px] border-4 border-dashed border-slate-300 bg-white/70 p-4 md:p-5">
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
      </section>}
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
  const percent = clampUiPercent(value);

  return (
    <div className="rounded-[22px] border-4 border-white bg-white/80 p-3 shadow-sm">
      <div className="mb-2 flex justify-between text-sm font-black text-emerald-900">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-6 overflow-hidden rounded-full bg-slate-100 shadow-inner">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
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
