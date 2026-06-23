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
  Heart,
  Map,
  Play,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react';
import { BluetoothTestPanel, type BluetoothNotificationPayload } from './components/BluetoothTestPanel';
import { fallbackFoodEffect, getFoodItemConfig, getItemConfig, getItemsByCategory, shopCategoryConfigs, type DinosaurStatEffect, type ItemCategory } from './config/itemConfig';
import { rewardConfig } from './config/rewardConfig';
import { trainingFatigueConfig } from './config/trainingFatigueConfig';
import { dinosaurSpecies } from './data/dinosaurSpecies';
import { trainingProblems } from './data/trainingProblems';
import { useTrainingSession } from './hooks/useTrainingSession';
import type { DinosaurState, EggState, OwnedDinosaur, Reward, RewardReason, TrainingProblem, UserProfile } from './types/game';
import { clearGameState, loadGameState, saveGameState } from './utils/gameStorage';
import { applyRewardsToDummyState, createRewardsFromBundle, formatRewardBundleSummary } from './utils/rewardCalculator';

type MainTab = 'training' | 'dino' | 'hatchery' | 'shop' | 'pokedex' | 'adventure' | 'settings';
type DinoView = 'care' | 'playground';
type DinosaurInteractionChange = Partial<Pick<DinosaurState, 'exp' | 'mood' | 'hunger' | 'stamina'>>;
type InventoryItemState = { itemId: string; quantity: number };
type GameState = {
  userProfile: UserProfile | null;
  player: { coins: number };
  dinosaur: DinosaurState;
  ownedDinosaurs: OwnedDinosaur[];
  discoveredSpeciesIds: string[];
  egg: EggState;
  inventory: InventoryItemState[];
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

const defaultGameState: GameState = {
  userProfile: null,
  player: { coins: 1240 },
  dinosaur: initialDinosaurState,
  ownedDinosaurs: [initialOwnedDinosaur],
  discoveredSpeciesIds: [initialOwnedDinosaur.speciesId],
  egg: initialEggState,
  inventory: initialInventory,
};

function normalizeGameState(state: Partial<GameState>): GameState {
  const ownedDinosaurs = getUniqueOwnedDinosaurs(state.ownedDinosaurs ?? defaultGameState.ownedDinosaurs);
  const discoveredSpeciesIds = getUniqueSpeciesIds([...(state.discoveredSpeciesIds ?? defaultGameState.discoveredSpeciesIds), ...ownedDinosaurs.map((dinosaur) => dinosaur.speciesId)]);
  const selectedDinosaur = getSelectedOwnedDinosaur(ownedDinosaurs, state.userProfile?.selectedDinosaurId);
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
    dinosaur: {
      ...defaultGameState.dinosaur,
      ...state.dinosaur,
      ...(selectedDinosaur ? ownedDinosaurToDinosaurState(selectedDinosaur) : {}),
    },
    ownedDinosaurs,
    discoveredSpeciesIds,
    egg: {
      ...defaultGameState.egg,
      ...state.egg,
      hatchProgress: clampPercent(state.egg?.hatchProgress ?? defaultGameState.egg.hatchProgress),
    },
    inventory: state.inventory ?? defaultGameState.inventory,
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

  return ownedDinosaurs.filter((dinosaur) => {
    if (seenSpeciesIds.has(dinosaur.speciesId)) return false;

    seenSpeciesIds.add(dinosaur.speciesId);
    return true;
  });
}

function getAvailableHatchSpecies(ownedDinosaurs: OwnedDinosaur[]) {
  const ownedSpeciesIds = new Set(getUniqueOwnedDinosaurs(ownedDinosaurs).map((dinosaur) => dinosaur.speciesId));
  return hatchableDinosaurPool.filter((species) => !ownedSpeciesIds.has(species.speciesId));
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
  const adjustedExp = Math.max(0, Math.round(rewardConfig.correctAnswer.dinosaurExp * effects.rewardMultiplier));
  const rewardParts = [`코인 +${rewardConfig.correctAnswer.coins}`, `알 부화 게이지 +${rewardConfig.correctAnswer.hatchProgress}%`, `공룡 EXP +${adjustedExp}`];

  if (rewardConfig.correctAnswer.dinosaurMood > 0) {
    rewardParts.push(`공룡 기분 +${rewardConfig.correctAnswer.dinosaurMood}`);
  }

  const costParts = [`체력 -${effects.staminaCost}`, `포만감 -${effects.hungerCost}`];
  return [...rewardParts, ...costParts, ...effects.warnings].join(', ');
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
  const [lastRewards, setLastRewards] = useState<Reward[]>([]);
  const [setCompleteRewards, setSetCompleteRewards] = useState<Reward[]>([]);
  const [lastTrainingEffects, setLastTrainingEffects] = useState<string[]>([]);
  const training = useTrainingSession(trainingProblems, {
    onCorrectAnswer: () => applyRewardBundle('problem_correct'),
    onSetComplete: () => applyRewardBundle('set_complete'),
    formatCorrectRewardFeedback: () => `정답! ${formatTrainingRewardFeedback(activeOwnedDinosaur)}`,
    formatSetCompleteFeedback: () => `세트 완료! ${formatRewardBundleSummary(rewardConfig.setComplete)}`,
  });
  const [lastBluetoothInput, setLastBluetoothInput] = useState<BluetoothNotificationPayload | null>(null);
  const [dinoView, setDinoView] = useState<DinoView>('care');
  const [dinoFeedback, setDinoFeedback] = useState('오늘도 주산훈련을 기다리고 있어요.');
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<string | null>('soft-berry');
  const [shopFeedback, setShopFeedback] = useState('상점은 목업입니다. 실제 구매는 아직 연결하지 않았습니다.');
  const [storageFeedback, setStorageFeedback] = useState(initialLoadResult.message);
  const lastBluetoothConfirmRef = useRef<{ hex: string; time: number; problemIndex: number } | null>(null);

  const activeMeta = useMemo(() => mainTabs.find((tab) => tab.id === activeTab) ?? mainTabs[0], [activeTab]);

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
    });
    setDinoFeedback(`${dinosaurName}와 함께 모험을 시작해요.`);
    setPhase('app');
  }

  function applyRewardBundle(reason: RewardReason) {
    const bundle = reason === 'set_complete' ? rewardConfig.setComplete : rewardConfig.correctAnswer;
    const targetDinosaur = getSelectedOwnedDinosaur(gameState.ownedDinosaurs, gameState.userProfile?.selectedDinosaurId) ?? initialOwnedDinosaur;
    const trainingEffects = reason === 'problem_correct' ? getTrainingConditionEffects(targetDinosaur) : null;
    const adjustedBundle =
      trainingEffects && trainingEffects.rewardMultiplier < 1
        ? {
            ...bundle,
            dinosaurExp: Math.max(0, Math.round(bundle.dinosaurExp * trainingEffects.rewardMultiplier)),
          }
        : bundle;
    const adjustedRewards = createRewardsFromBundle(reason, adjustedBundle, {
      dinosaurId: targetDinosaur.id,
      eggId: gameState.egg.id,
    });

    setGameState((current) => {
      const selectedDinosaur = getSelectedOwnedDinosaur(current.ownedDinosaurs, current.userProfile?.selectedDinosaurId);
      if (!selectedDinosaur) return applyRewardsToDummyState(current, adjustedRewards);

      const rewardAppliedState = applyRewardsToDummyState(
        {
          ...current,
          dinosaur: ownedDinosaurToDinosaurState(selectedDinosaur),
        },
        adjustedRewards,
      );
      const currentTrainingEffects = reason === 'problem_correct' ? getTrainingConditionEffects(selectedDinosaur) : null;

      return updateSelectedOwnedDinosaur(
        {
          ...current,
          player: rewardAppliedState.player,
          egg: rewardAppliedState.egg,
        },
        (dinosaur) => ({
          ...dinosaur,
          exp: rewardAppliedState.dinosaur.exp,
          mood: rewardAppliedState.dinosaur.mood,
          stamina: currentTrainingEffects ? clampPercent(dinosaur.stamina - currentTrainingEffects.staminaCost) : dinosaur.stamina,
          hunger: currentTrainingEffects ? clampPercent(dinosaur.hunger - currentTrainingEffects.hungerCost) : dinosaur.hunger,
        }),
      );
    });

    if (reason === 'set_complete') {
      setSetCompleteRewards(adjustedRewards);
      return;
    }

    setLastRewards(adjustedRewards);
    setLastTrainingEffects([
      `체력 -${trainingEffects?.staminaCost ?? 0}`,
      `포만감 -${trainingEffects?.hungerCost ?? 0}`,
      ...(trainingEffects?.rewardMultiplier && trainingEffects.rewardMultiplier < 1 ? [`EXP 보상 ${Math.round(trainingEffects.rewardMultiplier * 100)}% 적용`] : []),
      ...(trainingEffects?.warnings ?? []),
    ]);
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

    if (item.category === 'dinosaur' || item.category === 'egg') {
      setShopFeedback('공룡 해금 기능은 다음 단계에서 연결 예정입니다.');
      return;
    }

    if (!Number.isFinite(item.price) || item.price <= 0) {
      setShopFeedback('이 아이템은 아직 구매할 수 없어요.');
      return;
    }

    const ownedQuantity = gameState.inventory.find((inventoryItem) => inventoryItem.itemId === item.id)?.quantity ?? 0;
    if (item.category === 'costume' && ownedQuantity > 0) {
      setShopFeedback('이미 보유 중이에요.');
      return;
    }

    if (gameState.player.coins < item.price) {
      setShopFeedback('코인이 부족해요.');
      return;
    }

    setGameState((current) => {
      const existingInventoryItem = current.inventory.find((inventoryItem) => inventoryItem.itemId === item.id);
      const nextInventory = existingInventoryItem
        ? current.inventory.map((inventoryItem) => (inventoryItem.itemId === item.id ? { ...inventoryItem, quantity: item.category === 'costume' ? 1 : inventoryItem.quantity + 1 } : inventoryItem))
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
    setGameState((current) => {
      if (current.egg.hatchProgress < 100) return current;

      const uniqueOwnedDinosaurs = getUniqueOwnedDinosaurs(current.ownedDinosaurs);
      const ownedSpeciesIds = new Set(uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId));
      const hatchedTemplate = getAvailableHatchSpecies(uniqueOwnedDinosaurs)[0];

      if (!hatchedTemplate) {
        return {
          ...current,
          ownedDinosaurs: uniqueOwnedDinosaurs,
          discoveredSpeciesIds: getUniqueSpeciesIds([...current.discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId)]),
          egg: {
            ...current.egg,
            lastHatchMessage: '모든 공룡을 발견했어요! 다음 업데이트를 기다려주세요.',
          },
        };
      }

      if (ownedSpeciesIds.has(hatchedTemplate.speciesId)) {
        return {
          ...current,
          ownedDinosaurs: uniqueOwnedDinosaurs,
          discoveredSpeciesIds: getUniqueSpeciesIds([...current.discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId)]),
          egg: {
            ...current.egg,
            lastHatchMessage: '이미 만난 공룡이에요.',
          },
        };
      }

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

      return {
        ...current,
        ownedDinosaurs: [...uniqueOwnedDinosaurs, newDinosaur],
        discoveredSpeciesIds: getUniqueSpeciesIds([...current.discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId), newDinosaur.speciesId]),
        egg: {
          ...current.egg,
          id: `egg-normal-${obtainedAt}`,
          name: '미확인 일반 알',
          rarity: 'normal',
          eggType: 'starter-normal',
          hatchProgress: 0,
          lastHatchedDinosaurName: newDinosaur.name,
          lastHatchedDinosaurRarity: newDinosaur.rarity,
          lastHatchMessage: `${newDinosaur.name}가 태어났어요! 도감에 새 공룡이 등록되었어요.`,
        },
      };
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
            <HeaderPill icon={BookOpen} label="2/5" tone="book" />
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
          <TrainingView
            problems={trainingProblems}
            currentProblem={training.currentProblem}
            currentProblemIndex={training.currentProblemIndex}
            totalProblems={training.totalProblems}
            correctCount={training.correctCount}
            answer={training.answer}
            feedback={training.feedback}
            lastRewards={lastRewards}
            lastTrainingEffects={lastTrainingEffects}
            setCompleteRewards={setCompleteRewards}
            isSetComplete={training.isSetComplete}
            bluetoothInput={lastBluetoothInput}
            activeOwnedDinosaur={activeOwnedDinosaur}
            ownedDinosaurs={gameState.ownedDinosaurs}
            onSelectAdjacentDinosaur={selectAdjacentDinosaur}
            onAnswer={training.setAnswer}
            onCheck={() => training.submitAnswer('manual')}
            onChooseProblem={training.chooseProblem}
          />
        )}
        {activeTab === 'dino' && (
          <DinoViewPanel
            view={dinoView}
            dinosaur={activeDinosaur}
            activeOwnedDinosaur={activeOwnedDinosaur}
            ownedDinosaurs={gameState.ownedDinosaurs}
            feedback={dinoFeedback}
            inventory={gameState.inventory}
            selectedFoodItemId={selectedFoodItemId}
            onView={setDinoView}
            onSelectFood={setSelectedFoodItemId}
            onSelectAdjacentDinosaur={selectAdjacentDinosaur}
            onDinosaurInteraction={applyDinosaurInteraction}
            onFeed={feedDinosaur}
          />
        )}
        {activeTab === 'hatchery' && <HatcheryView egg={gameState.egg} ownedDinosaurs={gameState.ownedDinosaurs} onHatchEgg={hatchEgg} />}
        {activeTab === 'shop' && <ShopView feedback={shopFeedback} inventory={gameState.inventory} onPurchase={purchaseItem} />}
        {activeTab === 'pokedex' && <PokedexView ownedDinosaurs={gameState.ownedDinosaurs} discoveredSpeciesIds={gameState.discoveredSpeciesIds} />}
        {activeTab === 'adventure' && <AdventureView />}
        {activeTab === 'settings' && (
          <SettingsView
            userProfile={gameState.userProfile}
            storageFeedback={storageFeedback}
            onResetSavedGameState={resetSavedGameState}
            onBluetoothNotification={handleBluetoothNotification}
          />
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
  answer,
  feedback,
  lastRewards,
  lastTrainingEffects,
  setCompleteRewards,
  isSetComplete,
  bluetoothInput,
  activeOwnedDinosaur,
  ownedDinosaurs,
  onSelectAdjacentDinosaur,
  onAnswer,
  onCheck,
  onChooseProblem,
}: {
  problems: TrainingProblem[];
  currentProblem: TrainingProblem;
  currentProblemIndex: number;
  totalProblems: number;
  correctCount: number;
  answer: string;
  feedback: string;
  lastRewards: Reward[];
  lastTrainingEffects: string[];
  setCompleteRewards: Reward[];
  isSetComplete: boolean;
  bluetoothInput: BluetoothNotificationPayload | null;
  activeOwnedDinosaur: OwnedDinosaur;
  ownedDinosaurs: OwnedDinosaur[];
  onSelectAdjacentDinosaur: (direction: -1 | 1) => void;
  onAnswer: (value: string) => void;
  onCheck: () => void;
  onChooseProblem: (index: number) => void;
}) {
  const bluetoothStatus = bluetoothInput ? 'Bluetooth 입력 수신' : 'Bluetooth 입력 대기';
  const bluetoothStatusTone = bluetoothInput ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800';
  const activeDinosaur = ownedDinosaurToDinosaurState(activeOwnedDinosaur);
  const activeSpecies = dinosaurSpecies.find((species) => species.speciesId === activeOwnedDinosaur.speciesId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section className="game-panel p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-3xl font-black text-emerald-950">오늘의 주산훈련</h3>
            <p className="mt-1 font-black text-emerald-700/70">
              {isSetComplete ? `세트 완료! 정답 ${correctCount}/${totalProblems}` : `문제 ${currentProblemIndex + 1}/${totalProblems} · 정답 ${correctCount}개`}
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border-4 border-white px-4 py-2 text-xs font-black shadow-sm ${bluetoothStatusTone}`}>
            <Bluetooth className="h-4 w-4" />
            {bluetoothStatus}
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {problems.map((problem, index) => (
            <button
              key={problem.id}
              onClick={() => onChooseProblem(index)}
              className={`min-h-24 rounded-[26px] border-4 px-4 text-left shadow-sm transition active:translate-y-1 ${
                currentProblemIndex === index ? 'border-white bg-gradient-to-b from-cyan-200 to-sky-200 text-cyan-950 shadow-[0_6px_0_#67e8f9]' : 'border-white bg-white/80 text-slate-600'
              }`}
            >
              <p className="text-xs font-black text-cyan-700">미션 {index + 1}</p>
              <p className="mt-1 text-3xl font-black">{problem.displayText}</p>
            </button>
          ))}
        </div>

        <div className="rounded-[34px] border-4 border-white bg-gradient-to-b from-cyan-100 via-white to-amber-100 p-5 shadow-inner md:p-8">
          <div className="text-center">
            <p className="mb-2 text-sm font-black text-cyan-700">{isSetComplete ? '세트 완료' : '현재 문제'}</p>
            <p className="text-7xl font-black text-emerald-950 md:text-8xl">{isSetComplete ? '완료!' : currentProblem.displayText}</p>
          </div>
          <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={answer}
              onChange={(event) => onAnswer(event.target.value)}
              disabled={isSetComplete}
              inputMode="numeric"
              placeholder="답 입력"
              className="min-h-20 rounded-[24px] border-4 border-white bg-white px-5 text-4xl font-black text-slate-900 shadow-inner outline-none focus:border-cyan-300"
            />
            <button disabled={isSetComplete} onClick={onCheck} className="game-button min-h-20 bg-gradient-to-b from-cyan-400 to-cyan-500 shadow-cyan disabled:cursor-not-allowed disabled:opacity-60">
              <CheckCircle2 className="h-6 w-6" />
              정답 확인
            </button>
          </div>
          <div className="mx-auto mt-3 grid max-w-xl gap-2 rounded-[22px] border-4 border-white bg-white/70 px-4 py-3 text-xs font-black text-slate-600 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-emerald-800">마지막 Bluetooth 수신값</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">
                {bluetoothInput?.parsedNumber ?? '-'}
              </span>
            </div>
            <p className="break-all font-mono font-bold text-slate-500">raw: {bluetoothInput?.raw ?? '-'}</p>
            <p className="break-all font-mono font-bold text-slate-500">hex: {bluetoothInput?.hex ?? '-'}</p>
            <p className="break-all font-mono font-bold text-slate-500">text: {bluetoothInput?.text ?? '-'}</p>
            {bluetoothInput?.isConfirmSignal && (
              <p className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-800">confirm signal received</p>
            )}
          </div>
          <p className="mx-auto mt-5 max-w-xl rounded-[24px] border-4 border-white bg-white/90 px-5 py-4 text-center text-lg font-black text-emerald-900 shadow-sm">{feedback}</p>
          {isSetComplete && (
            <div className="mx-auto mt-3 max-w-xl rounded-[24px] border-4 border-white bg-lime-100 px-5 py-4 text-center text-lg font-black text-emerald-900 shadow-sm">
              세트 완료 보상: {setCompleteRewards.length > 0 ? setCompleteRewards.map((reward) => reward.label).join(', ') : '정산 대기'}
            </div>
          )}
        </div>
      </section>

      <aside className="grid content-start gap-3">
        <TrainingDinosaurCard
          dinosaur={activeDinosaur}
          activeOwnedDinosaur={activeOwnedDinosaur}
          ownedDinosaurs={ownedDinosaurs}
          onSelectAdjacentDinosaur={onSelectAdjacentDinosaur}
        />
        <RewardCard icon={Coins} title="정답 코인" value={`+${rewardConfig.correctAnswer.coins}`} tone="from-amber-200 to-yellow-300 text-amber-900" />
        <RewardCard icon={Egg} title="정답 부화 게이지" value={`+${rewardConfig.correctAnswer.hatchProgress}%`} tone="from-orange-200 to-amber-300 text-orange-900" />
        <RewardCard icon={Heart} title="정답 공룡 기분" value={`+${rewardConfig.correctAnswer.dinosaurMood}`} tone="from-pink-200 to-rose-300 text-rose-900" />
        <RewardCard icon={Sparkles} title="함께 훈련" value={activeSpecies?.displayName ?? activeOwnedDinosaur.speciesId} tone="from-cyan-200 to-sky-300 text-cyan-900" />
        <div className="rounded-[30px] border-4 border-white bg-white/84 p-5 shadow-lg">
          <h4 className="text-xl font-black text-emerald-950">최근 획득 보상</h4>
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
          {lastTrainingEffects.length > 0 && (
            <div className="mt-3 grid gap-2">
              {lastTrainingEffects.map((effect) => (
                <p key={effect} className="rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-800">
                  {effect}
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-[30px] border-4 border-white bg-lime-100 p-5 shadow-lg">
          <h4 className="text-xl font-black text-emerald-950">핵심 루프</h4>
          <p className="mt-2 font-black leading-relaxed text-emerald-700/80">훈련을 끝내면 보상을 얻고, 보상은 알부화와 공룡 돌봄으로 이어집니다.</p>
        </div>
      </aside>
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

function HatcheryView({ egg, ownedDinosaurs, onHatchEgg }: { egg: EggState; ownedDinosaurs: OwnedDinosaur[]; onHatchEgg: () => void }) {
  const uniqueOwnedDinosaurs = getUniqueOwnedDinosaurs(ownedDinosaurs);
  const hasAvailableHatchSpecies = getAvailableHatchSpecies(uniqueOwnedDinosaurs).length > 0;
  const isProgressReady = egg.hatchProgress >= 100;
  const canHatch = isProgressReady && hasAvailableHatchSpecies;
  const hatchGuideText = !hasAvailableHatchSpecies
    ? '모든 공룡을 발견했어요! 다음 업데이트를 기다려주세요.'
    : isProgressReady
      ? '부화 준비 완료! 새 공룡을 만나볼까요?'
      : '훈련을 해서 알을 부화시켜요!';

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section className="game-panel p-4 md:p-6">
        <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[36px] border-4 border-white bg-gradient-to-b from-orange-100 via-amber-100 to-cyan-100 p-6 text-center shadow-inner">
          <div className="relative mb-8">
            <div className="absolute inset-x-8 bottom-0 h-10 rounded-full bg-orange-900/10 blur-md" />
            <div className="relative flex h-64 w-48 items-center justify-center rounded-[50%] border-[12px] border-white bg-gradient-to-br from-amber-100 via-white to-orange-200 shadow-xl">
              <Egg className="h-24 w-24 text-orange-400" />
            </div>
            <div className="absolute -right-8 top-10 rounded-full border-4 border-white bg-cyan-400 px-4 py-2 text-lg font-black text-white shadow-lg">+{rewardConfig.correctAnswer.hatchProgress}%</div>
          </div>
          <h3 className="text-4xl font-black text-emerald-950">{egg.name}</h3>
          <p className="mt-2 max-w-md font-black leading-relaxed text-emerald-700/75">
            {hatchGuideText}
          </p>
          <div className="mt-8 w-full max-w-lg rounded-[26px] border-4 border-white bg-white/80 p-4 shadow-sm">
            <div className="mb-2 flex justify-between text-sm font-black text-emerald-800">
              <span>부화 진행률</span>
              <span>{egg.hatchProgress}%</span>
            </div>
            <div className="h-7 overflow-hidden rounded-full bg-orange-100 shadow-inner">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-cyan-400" style={{ width: `${egg.hatchProgress}%` }} />
            </div>
          </div>
          <button
            disabled={!canHatch}
            onClick={onHatchEgg}
            className="mt-6 inline-flex min-h-16 items-center justify-center gap-2 rounded-[24px] border-4 border-white bg-gradient-to-b from-orange-400 to-amber-500 px-8 text-lg font-black text-white shadow-[0_7px_0_#d97706] transition active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Egg className="h-6 w-6" />
            부화하기
          </button>
          {egg.lastHatchedDinosaurName && (
            <p className="mt-4 rounded-[24px] border-4 border-white bg-white/90 px-5 py-3 text-lg font-black text-emerald-900 shadow-sm">
              {egg.lastHatchMessage ?? `${egg.lastHatchedDinosaurName}가 태어났어요! 도감에 새 공룡이 등록되었어요.`}
            </p>
          )}
          {!egg.lastHatchedDinosaurName && egg.lastHatchMessage && (
            <p className="mt-4 rounded-[24px] border-4 border-white bg-white/90 px-5 py-3 text-lg font-black text-emerald-900 shadow-sm">{egg.lastHatchMessage}</p>
          )}
        </div>
      </section>
      <aside className="grid content-start gap-3">
        <RewardCard icon={Play} title="다음 행동" value="훈련 1세트" tone="from-cyan-200 to-sky-300 text-cyan-900" />
        <RewardCard icon={Sparkles} title="부화 상태" value={!hasAvailableHatchSpecies ? '전체 발견' : canHatch ? '준비 완료' : `${100 - egg.hatchProgress}% 남음`} tone="from-amber-200 to-yellow-300 text-amber-900" />
        <RewardCard icon={Baby} title="보유 공룡" value={`${uniqueOwnedDinosaurs.length}마리`} tone="from-orange-200 to-amber-300 text-orange-900" />
        <div className="rounded-[30px] border-4 border-white bg-white/84 p-5 shadow-lg">
          <h4 className="text-xl font-black text-emerald-950">최근 획득</h4>
          <p className="mt-2 font-black text-slate-600">{egg.lastHatchedDinosaurName ? `${egg.lastHatchedDinosaurName} · ${egg.lastHatchedDinosaurRarity}` : '아직 부화한 공룡이 없어요.'}</p>
        </div>
      </aside>
    </div>
  );
}

function DinoViewPanel({
  view,
  dinosaur,
  activeOwnedDinosaur,
  ownedDinosaurs,
  feedback,
  inventory,
  selectedFoodItemId,
  onView,
  onSelectFood,
  onSelectAdjacentDinosaur,
  onDinosaurInteraction,
  onFeed,
}: {
  view: DinoView;
  dinosaur: DinosaurState;
  activeOwnedDinosaur: OwnedDinosaur;
  ownedDinosaurs: OwnedDinosaur[];
  feedback: string;
  inventory: InventoryItemState[];
  selectedFoodItemId: string | null;
  onView: (view: DinoView) => void;
  onSelectFood: (itemId: string) => void;
  onSelectAdjacentDinosaur: (direction: -1 | 1) => void;
  onDinosaurInteraction: (changes: DinosaurInteractionChange, message: string) => void;
  onFeed: () => void;
}) {
  const activeSpecies = dinosaurSpecies.find((species) => species.speciesId === activeOwnedDinosaur.speciesId);
  const uniqueOwnedCount = getUniqueOwnedDinosaurs(ownedDinosaurs).length;

  if (view === 'playground') {
    return (
      <section className="game-panel p-4 md:p-6">
        <button onClick={() => onView('care')} className="mb-4 rounded-full border-4 border-white bg-white/90 px-5 py-3 text-sm font-black text-emerald-800 shadow-sm">
          우리 공룡으로 돌아가기
        </button>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="relative flex min-h-[520px] flex-col items-center justify-end overflow-hidden rounded-[36px] border-4 border-white bg-gradient-to-b from-sky-100 via-emerald-100 to-lime-300 p-6 text-center shadow-inner">
            <div className="absolute bottom-0 left-0 right-0 h-32 rounded-t-[50%] bg-lime-400/70" />
            <DinoAvatar size="hero" />
            <h3 className="relative z-10 text-4xl font-black text-emerald-950">작은 놀이터</h3>
            <p className="relative z-10 mt-2 rounded-full bg-white/90 px-5 py-2 font-black text-emerald-700 shadow-sm">{feedback}</p>
          </div>
          <div className="grid content-start gap-3">
            <div className="rounded-[30px] border-4 border-white bg-white/86 p-5 shadow-lg">
              <p className="text-sm font-black text-amber-700">놀이터 상태</p>
              <h3 className="mt-1 text-3xl font-black text-emerald-950">{dinosaur.name}</h3>
              <p className="mt-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">
                {activeSpecies?.displayName ?? activeOwnedDinosaur.speciesId} · {rarityLabels[activeOwnedDinosaur.rarity]} · Lv. {dinosaur.level}
              </p>
              <div className="mt-4 grid gap-3">
                <Meter label="EXP" value={dinosaur.exp} tone="from-cyan-400 to-sky-500" />
                <Meter label="행복" value={dinosaur.mood} tone="from-pink-400 to-rose-500" />
                <Meter label="체력" value={dinosaur.stamina} tone="from-emerald-400 to-lime-500" />
                <Meter label="포만감" value={dinosaur.hunger} tone="from-amber-400 to-orange-500" />
              </div>
            </div>
            <div className="rounded-[26px] border-4 border-white bg-lime-100 px-5 py-4 shadow-sm">
              <p className="text-sm font-black text-emerald-700">최근 변화</p>
              <p className="mt-1 text-lg font-black text-emerald-950">{feedback}</p>
            </div>
            <PlayButton label="쓰다듬기" onClick={() => onDinosaurInteraction({ mood: 1 }, '행복 +1')} />
            <PlayButton label="공 던지기" onClick={() => onDinosaurInteraction({ mood: 2, stamina: -1 }, '행복 +2, 체력 -1')} />
            <PlayButton label="쉬게 하기" onClick={() => onDinosaurInteraction({ stamina: 2 }, '체력 +2')} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <section className="game-panel p-4 md:p-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
          <div className="relative flex min-h-[560px] items-end justify-center overflow-hidden rounded-[36px] border-4 border-white bg-gradient-to-b from-sky-100 via-emerald-100 to-lime-300 p-6">
            <div className="absolute bottom-0 left-0 right-0 h-36 rounded-t-[50%] bg-lime-400/70" />
            <div className="absolute right-8 top-8 rounded-[24px] border-4 border-white bg-white/90 px-5 py-3 text-lg font-black text-emerald-800 shadow-lg">기분 {dinosaur.mood}%</div>
            {uniqueOwnedCount > 1 && (
              <>
                <button
                  aria-label="이전 공룡"
                  onClick={() => onSelectAdjacentDinosaur(-1)}
                  className="absolute left-5 top-1/2 z-20 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-[24px] border-4 border-white bg-white/92 text-emerald-800 shadow-[0_6px_0_#86efac] transition active:translate-y-[calc(-50%+4px)] active:shadow-none"
                >
                  <ChevronLeft className="h-10 w-10" />
                </button>
                <button
                  aria-label="다음 공룡"
                  onClick={() => onSelectAdjacentDinosaur(1)}
                  className="absolute right-5 top-1/2 z-20 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-[24px] border-4 border-white bg-white/92 text-emerald-800 shadow-[0_6px_0_#86efac] transition active:translate-y-[calc(-50%+4px)] active:shadow-none"
                >
                  <ChevronRight className="h-10 w-10" />
                </button>
              </>
            )}
            <DinoAvatar size="hero" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black text-amber-700">대표 공룡</p>
            <h3 className="text-5xl font-black text-emerald-950">{dinosaur.name}</h3>
            <p className="mt-2 rounded-full bg-amber-100 px-4 py-2 text-base font-black text-amber-800">
              {activeSpecies?.displayName ?? activeOwnedDinosaur.speciesId} · {rarityLabels[activeOwnedDinosaur.rarity]} · Lv. {dinosaur.level}
            </p>
            <p className="mt-3 rounded-[20px] border-4 border-white bg-white/80 px-4 py-3 text-sm font-black text-slate-500">
              {activeSpecies?.description ?? '보유한 공룡을 돌볼 수 있어요.'}
            </p>
            <div className="mt-6 grid gap-4">
              <Meter label="EXP" value={dinosaur.exp} tone="from-cyan-400 to-sky-500" />
              <Meter label="포만감" value={dinosaur.hunger} tone="from-amber-400 to-orange-500" />
              <Meter label="행복" value={dinosaur.mood} tone="from-pink-400 to-rose-500" />
              <Meter label="체력" value={dinosaur.stamina} tone="from-emerald-400 to-lime-500" />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={onFeed} className="game-button min-h-18 bg-gradient-to-b from-amber-300 to-orange-400 shadow-orange">
                먹이주기
              </button>
              <button onClick={() => onView('playground')} className="game-button min-h-18 bg-gradient-to-b from-emerald-300 to-emerald-500 shadow-green">
                놀이터로 이동
              </button>
            </div>
            <p className="mt-5 rounded-[24px] border-4 border-white bg-white/90 px-5 py-4 text-lg font-black text-emerald-900 shadow-sm">{feedback}</p>
          </div>
        </div>
      </section>
      <aside className="rounded-[34px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h4 className="mb-4 text-2xl font-black text-emerald-950">보유 사료 가방</h4>
        <p className="mb-3 rounded-[20px] bg-amber-50 px-4 py-2 text-sm font-black text-amber-800">
          {selectedFoodItemId ? `${getFoodItemConfig(selectedFoodItemId)?.name ?? selectedFoodItemId} 선택됨` : '선택 없음'}
        </p>
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          {inventory.filter((inventoryItem) => getItemConfig(inventoryItem.itemId)?.category === 'food').map((inventoryItem) => {
            const food = getFoodItemConfig(inventoryItem.itemId);
            if (!food) return null;
            const isSelected = selectedFoodItemId === inventoryItem.itemId;
            const isDisabled = inventoryItem.quantity <= 0;

            return (
              <button
                key={inventoryItem.itemId}
                disabled={isDisabled}
                onClick={() => onSelectFood(inventoryItem.itemId)}
                className={`flex min-h-32 flex-col items-center justify-center rounded-[26px] border-4 p-3 text-center shadow-sm transition active:translate-y-1 ${
                  isSelected
                    ? 'border-amber-400 bg-gradient-to-b from-yellow-200 to-orange-200 text-amber-950 shadow-[0_6px_0_#f59e0b]'
                    : 'border-white bg-gradient-to-b from-amber-100 to-orange-100'
                } ${isDisabled ? 'cursor-not-allowed opacity-45 shadow-none' : 'hover:brightness-105'}`}
              >
                <Utensils className="mb-2 h-7 w-7 text-orange-500" />
                <span className="text-sm font-black text-amber-950">{food.name}</span>
                <span className="mt-1 min-h-5 text-[11px] font-black text-amber-700">{formatDinosaurStatChanges(food.effect)}</span>
                <span className="mt-1 rounded-full bg-white px-3 py-1 text-sm font-black text-orange-700">x{inventoryItem.quantity}</span>
                {isSelected && <span className="mt-2 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white">선택됨</span>}
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function ShopView({ feedback, inventory, onPurchase }: { feedback: string; inventory: InventoryItemState[]; onPurchase: (itemId: string) => void }) {
  const categoryTone: Record<ItemCategory, { icon: typeof Utensils; tone: string }> = {
    food: { icon: Utensils, tone: 'from-amber-100 to-orange-100 border-amber-200 text-amber-800' },
    costume: { icon: Shirt, tone: 'from-violet-100 to-fuchsia-100 border-violet-200 text-violet-800' },
    dinosaur: { icon: Egg, tone: 'from-cyan-100 to-emerald-100 border-cyan-200 text-cyan-800' },
    egg: { icon: Egg, tone: 'from-orange-100 to-yellow-100 border-orange-200 text-orange-800' },
    toy: { icon: Sparkles, tone: 'from-lime-100 to-emerald-100 border-lime-200 text-lime-800' },
    misc: { icon: ShoppingBag, tone: 'from-slate-100 to-slate-200 border-slate-200 text-slate-800' },
  };

  return (
    <div className="grid gap-5">
      <section className="rounded-[34px] border-4 border-white bg-gradient-to-r from-violet-100 to-fuchsia-100 p-5 shadow-lg">
        <h3 className="text-3xl font-black text-violet-950">상점 목업</h3>
        <p className="mt-2 font-black text-violet-800/75">아이템 config를 기준으로 음식, 코스튬, 새로운 공룡 목표를 표시합니다.</p>
        <p className="mt-4 rounded-[22px] border-4 border-white bg-white/90 px-4 py-3 font-black text-violet-800 shadow-sm">{feedback}</p>
      </section>
      {shopCategoryConfigs.filter((category) => category.visible).sort((a, b) => a.sortOrder - b.sortOrder).map((category) => {
        const items = getItemsByCategory(category.id);
        const Icon = categoryTone[category.id].icon;
        return (
          <section key={category.id} className={`rounded-[34px] border-4 bg-gradient-to-b p-5 shadow-lg ${categoryTone[category.id].tone}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border-4 border-white bg-white/90 shadow-sm">
                <Icon className="h-8 w-8" />
              </div>
              <h4 className="text-3xl font-black">{category.label}</h4>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {items.map((item) => {
                const ownedQuantity = inventory.find((inventoryItem) => inventoryItem.itemId === item.id)?.quantity ?? 0;
                const extraLabel =
                  item.category === 'food'
                    ? formatDinosaurStatChanges(item.effect)
                    : item.category === 'costume'
                      ? item.cosmeticOnly ? '외형 전용' : formatDinosaurStatChanges(item.effect ?? {})
                      : item.category === 'dinosaur'
                        ? `${item.rarity} · ${item.unlockType}`
                        : '';

                return (
                <article key={item.name} className="rounded-[28px] border-4 border-white bg-white/86 p-4 shadow-sm">
                  <h5 className="text-xl font-black text-slate-950">{item.name}</h5>
                  <p className="mt-2 min-h-12 text-sm font-black text-slate-500">{item.description}</p>
                  {extraLabel && <p className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-black opacity-80">{extraLabel}</p>}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-sm font-black text-amber-950">
                      <Coins className="h-4 w-4 text-amber-600" />
                      {item.price}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">보유 {ownedQuantity}</span>
                    <button onClick={() => onPurchase(item.id)} className="rounded-full bg-violet-500 px-4 py-2 text-sm font-black text-white shadow-[0_4px_0_#7c3aed] transition active:translate-y-1 active:shadow-none">
                      구매
                    </button>
                  </div>
                </article>
                );
              })}
            </div>
          </section>
        );
      })}
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

function PokedexView({ ownedDinosaurs, discoveredSpeciesIds }: { ownedDinosaurs: OwnedDinosaur[]; discoveredSpeciesIds: string[] }) {
  const uniqueOwnedDinosaurs = getUniqueOwnedDinosaurs(ownedDinosaurs);
  const ownedCountBySpecies = uniqueOwnedDinosaurs.reduce<Record<string, number>>((counts, dinosaur) => {
    counts[dinosaur.speciesId] = (counts[dinosaur.speciesId] ?? 0) + 1;
    return counts;
  }, {});
  const discoveredSpeciesSet = new Set([...discoveredSpeciesIds, ...uniqueOwnedDinosaurs.map((dinosaur) => dinosaur.speciesId)]);
  const discoveredCount = dinosaurSpecies.filter((species) => discoveredSpeciesSet.has(species.speciesId)).length;

  return (
    <div className="grid gap-5">
      <section className="rounded-[34px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-3xl font-black text-emerald-950">공룡 도감</h3>
            <p className="mt-2 font-black text-slate-500">부화로 만난 공룡 종이 여기에 등록돼요.</p>
          </div>
          <div className="rounded-[24px] bg-sky-100 px-5 py-3 text-lg font-black text-sky-900">
            발견한 공룡 {discoveredCount} / {dinosaurSpecies.length}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dinosaurSpecies.map((species) => {
          const isDiscovered = discoveredSpeciesSet.has(species.speciesId);
          const ownedCount = ownedCountBySpecies[species.speciesId] ?? 0;

          return (
            <article key={species.speciesId} className={`rounded-[32px] border-4 border-white p-4 shadow-lg ${isDiscovered ? 'bg-white/86' : 'bg-slate-100/86'}`}>
              <div className={`mb-4 flex h-44 items-center justify-center rounded-[28px] ${isDiscovered ? 'bg-gradient-to-b from-sky-100 to-lime-100' : 'bg-gradient-to-b from-slate-200 to-slate-300'}`}>
                {isDiscovered ? (
                  <DinoAvatar size="small" />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-slate-400 text-5xl font-black text-white">{species.silhouette}</div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-xl font-black ${isDiscovered ? 'text-emerald-950' : 'text-slate-500'}`}>{isDiscovered ? species.displayName : '???'}</h3>
                {isDiscovered && <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-800">보유 {ownedCount}마리</span>}
              </div>
              <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-black ${isDiscovered ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-500'}`}>
                {rarityLabels[species.rarity]}
              </p>
              <p className="mt-3 min-h-16 text-sm font-black leading-relaxed text-slate-500">{isDiscovered ? species.description : species.unlockHint}</p>
              <p className={`mt-3 rounded-full px-3 py-1 text-center text-xs font-black ${isDiscovered ? 'bg-emerald-100 text-emerald-800' : 'bg-white/80 text-slate-500'}`}>
                {isDiscovered ? '우리 공룡에서 키울 수 있어요' : '미발견'}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SettingsView({
  userProfile,
  storageFeedback,
  onResetSavedGameState,
  onBluetoothNotification,
}: {
  userProfile: UserProfile | null;
  storageFeedback: string;
  onResetSavedGameState: () => void;
  onBluetoothNotification: (payload: BluetoothNotificationPayload) => void;
}) {
  return (
    <div className="grid gap-5">
      <section className="rounded-[34px] border-4 border-white bg-white/84 p-5 shadow-lg">
        <h3 className="text-3xl font-black text-slate-950">설정</h3>
        <p className="mt-2 font-black text-slate-500">문제 설정은 추후 연결 예정입니다.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SettingChip label="숫자 개수" value="3개" />
          <SettingChip label="숫자 크기" value="한 자리/두 자리 예시" />
          <SettingChip label="세트 문제 수" value="20문제 예정" />
          <SettingChip label="연산 방식" value="덧셈 + 뺄셈" />
        </div>
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

function PlayButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="game-button min-h-20 bg-gradient-to-b from-emerald-300 to-emerald-500 shadow-green">
      {label}
    </button>
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
