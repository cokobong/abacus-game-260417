import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, Gem, RotateCcw } from 'lucide-react';
import { lavaCliffBackground, lavaValleyAssets, lavaValleyStage2Assets, lavaValleyStage3Assets } from '../../assets/adventure/lava-valley';
import { adventureCommonAssets } from '../../assets/adventure';
import { applyHealthRestore, shouldSpawnHealthRestore } from '../../config/adventureCollectibles';
import type { OwnedDinosaur } from '../../types/game';
import { LAVA_VALLEY_COIN_PATTERNS, LAVA_VALLEY_COLLECTIBLE_LANES, LAVA_VALLEY_REWARDS_CONFIG, MAX_RARE_FRAGMENTS_PER_RUN, normalizeLavaValleyRewards, shouldCommitLavaValleyRewards, type LavaValleyEndReason, type MinigameItemReward, type MinigameRunRewards } from '../../config/minigameConfig';
import { getItemConfig } from '../../config/itemConfig';
import { shopItemImages } from '../../assets/shop';
import { preloadImages } from '../../utils/preloadImages';
import { LAVA_VALLEY_STAGE_CONFIG } from '../../config/adventureStages';
import { AdventureStageIntro } from '../AdventureStageIntro';
import { getAdventureStage, type AdventureStageNumber } from '../../config/adventureStageCatalog';
import { getLavaLandingHeight, getLavaPlatformAt, isOnLavaPlatform, LAVA_STAGE_THREE_MAX_PLATFORMS, LAVA_STAGE_THREE_SEGMENTS, LAVA_STAGE_TWO_SEGMENTS, LAVA_STAGE_TWO_MAX_PLATFORMS, type LavaPlatform, type LavaRoute } from '../../config/lavaStageSegments';
import { canEnterLavaSecretRoute, createLavaCliffMission, createLavaSecretChestReward, createLavaStageShopPlan, getLavaCoinIntervalScale, getLavaGroundSpawnY, getLavaObstacleSpawnInterval, isLavaBonusRouteActive, createLavaStageRarePlan, getLavaEruptionPhase, getLavaJumpPhysics, getLavaStageGameplay, LAVA_CLIFF_MISSION, LAVA_GROUND_TRACK_SURFACE_PERCENT, LAVA_VALLEY_DIFFICULTY, LAVA_VOLCANO_CORE, type LavaEruptionPhase } from '../../config/lavaStageGameplay';
import { LAVA_FINAL_CHEST_CONFIG } from '../../config/worldMapRelicConfig';
import { getDifficultyStorageKey, isAdventureDifficultyUnlocked, type AdventureDifficulty } from '../../config/adventureMinigameEconomy';
export { LAVA_VALLEY_DIFFICULTY } from '../../config/lavaStageGameplay';

export const LAVA_RUNNER_CONFIG = { gameDuration: LAVA_VALLEY_REWARDS_CONFIG.gameDurationSeconds, collectibleIntervalMin: 2600, collectibleIntervalMax: 3900, invincibleMs: 1400, playerX: 27, trackBottom: 12, footEffectBottom: 20, maxObstacles: 2, checkpointProgress: .5, dashDurationMs: 1000, dashRecoveryMs: 200, dashCooldownMs: getLavaStageGameplay(1).dashCooldownMs, dashSpeedMultiplier: 1.9 } as const;

type ObstacleKind = 'rock' | 'geyser';
type CollectibleKind = 'coin' | 'shard' | 'shopItem' | 'health_restore';
type RunnerItemKind = ObstacleKind | CollectibleKind | 'checkpoint' | 'symbol' | 'secretGate' | 'eruption' | 'bonusChest' | 'finalTreasure';
type RunnerItem = { id: number; kind: RunnerItemKind; x: number; height: number; route: LavaRoute; itemId?: string; label?: string; eruptionStartedAt?: number; phase?: LavaEruptionPhase };
type Result = 'playing' | 'success' | 'failure';
type Difficulty = AdventureDifficulty;
type PickupFeedback = { id: number; kind: CollectibleKind | 'checkpoint'; label: string };
type Burst = { id: number; kind: 'jump' | 'landing' | 'coin' | 'item' | 'fossil' | 'hurt' | 'checkpoint' | 'clear'; x: number; y: number };

const OBSTACLE_CLEARANCE: Record<ObstacleKind, number> = { rock: 6.5, geyser: 9 };
const OBSTACLE_WIDTH: Record<ObstacleKind, number> = { rock: 7, geyser: 6 };
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const isObstacle = (kind: RunnerItemKind): kind is ObstacleKind => kind === 'rock' || kind === 'geyser';
const isCollectible = (kind: RunnerItemKind): kind is CollectibleKind => kind === 'coin' || kind === 'shard' || kind === 'shopItem' || kind === 'health_restore';

export interface LavaPathPrototypeProps { stageNumber?: AdventureStageNumber; dinosaur: OwnedDinosaur; onExit: () => void; runId: string; onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards; onRetry: (retryAfterFailure?: boolean) => void; relicPartCount?: number; externalMainModalOpen?: boolean }

const PLAYER_PRELOAD_ASSETS = [lavaValleyAssets.player.idle, lavaValleyAssets.player.runSheet, lavaValleyAssets.player.jumpUp, lavaValleyAssets.player.fall, lavaValleyAssets.player.hurt, lavaValleyAssets.player.victory, adventureCommonAssets.healthRestore] as const;

type LavaValleyPlayerProps = { intro: boolean; invincible: boolean; jumping: boolean; jumpY: number; rising: boolean; success: boolean };

const LavaValleyPlayer = memo(function LavaValleyPlayer({ intro, invincible, jumping, jumpY, rising, success }: LavaValleyPlayerProps) {
  const stillImage = success ? lavaValleyAssets.player.victory : invincible ? lavaValleyAssets.player.hurt : jumping ? (rising ? lavaValleyAssets.player.jumpUp : lavaValleyAssets.player.fall) : intro ? lavaValleyAssets.player.idle : null;
  return <div className={`lava-runner__dino ${jumping ? 'lava-runner__dino--jump' : ''} ${invincible ? 'lava-runner__dino--hit' : ''}`} style={{ '--lava-jump-y': `${jumpY}%` } as CSSProperties}>
    {stillImage ? <img src={stillImage} alt="용암계곡 카르노타우루스" draggable={false} /> : <span className="lava-runner__run-sprite" role="img" aria-label="달리는 카르노타우루스" />}
  </div>;
});

const UpperTrackVisual = memo(function UpperTrackVisual() { return <img className="lava-core-platform__surface lava-stage2-upper-platform__surface" src={lavaValleyStage3Assets.floatingPlatform} alt="" aria-hidden="true" />; });
const FossilFragmentVisual = memo(function FossilFragmentVisual() { return <img className="lava-cliff-fossil" src={lavaValleyStage2Assets.fossilFragment} alt="화석조각" draggable={false} />; });
const FossilCounterVisual = memo(function FossilCounterVisual({ count, bonusLabel }: { count: number; bonusLabel?: string }) { return <div className={`lava-cliff-mission ${count === LAVA_CLIFF_MISSION.symbolCount ? 'is-complete' : ''}`} role="status"><img className="lava-cliff-mission__icon" src={lavaValleyStage2Assets.fossilHudIcon} alt="" aria-hidden="true" draggable={false} /> 화석조각 <b>{count}/{LAVA_CLIFF_MISSION.symbolCount}</b>{bonusLabel && <small>{bonusLabel}</small>}</div>; });
const SecretDoorVisual = memo(function SecretDoorVisual({ open }: { open: boolean }) { return <img className="lava-cliff-gate" src={open ? lavaValleyStage2Assets.secretDoorOpen : lavaValleyStage2Assets.secretDoorClosed} alt={open ? '열린 비밀문, 가까이 가면 입장' : '잠긴 비밀문, 화석조각 3개 필요'} draggable={false} />; });

export function LavaPathPrototype({ stageNumber = 1, onExit, runId, onFinishRun, onRetry, relicPartCount = 0, externalMainModalOpen = false }: LavaPathPrototypeProps) {
  const stageConfig = getAdventureStage('lavaValley', stageNumber);
  const gameDuration = stageConfig.playTime;
  const gameplay = getLavaStageGameplay(stageNumber);
  const background = stageNumber === 3 ? lavaValleyStage3Assets.background : stageNumber === 2 ? lavaCliffBackground : lavaValleyAssets.runnerBackground;
  const introConfig = useMemo(() => ({ ...LAVA_VALLEY_STAGE_CONFIG, stage: stageNumber, title: stageNumber === 1 ? LAVA_VALLEY_STAGE_CONFIG.title : stageConfig.name, instruction: stageNumber === 2 ? '화석조각을 모아 비밀문을 열어보세요!' : stageNumber === 3 ? '3단 발판에서 화석조각 3개를 모아 비밀문을 열어보세요!' : LAVA_VALLEY_STAGE_CONFIG.instruction }), [stageNumber, stageConfig]);
  const [symbols, setSymbols] = useState(0), [bonusRoute, setBonusRoute] = useState(false), [bonusChestOpen, setBonusChestOpen] = useState(false);
  const missionRef = useRef(createLavaCliffMission());
  const hudRef = useRef({ second: -1, invincible: false, dashing: false, cooldownBucket: -1 });
  const renderedItemIdsRef = useRef('');
  const [platforms, setPlatforms] = useState<LavaPlatform[]>([]);
  const platformsRef = useRef<LavaPlatform[]>([]), platformElementsRef = useRef(new Map<number, HTMLDivElement>());
  const itemElementsRef = useRef(new Map<number, HTMLDivElement>());
  const invalidObstacleIdsRef = useRef(new Set<number>());
  const playfieldRef = useRef<HTMLElement>(null), playerMotionRef = useRef<HTMLDivElement>(null);
  const fieldSizeRef = useRef({ width: 1, height: 1, footOffset: 0 });
  const travelRef = useRef(0), nextSegmentRef = useRef({ index: 0, start: 0 });
  const ridingPlatformIdRef = useRef<number | null>(null), finalTreasureSpawnedRef = useRef(false);
  const [rising, setRising] = useState(false);
  const [items, setItems] = useState<RunnerItem[]>([]);
  const [coins, setCoins] = useState(0), [shopItemCount, setShopItemCount] = useState(0), [rareShards, setRareShards] = useState(0), [health, setHealth] = useState(3), [timeLeft, setTimeLeft] = useState(gameDuration);
  const [jumping, setJumping] = useState(false), [invincible, setInvincible] = useState(false), [paused, setPaused] = useState(false), [result, setResult] = useState<Result>('playing');
  const [intro, setIntro] = useState(true), [showResult, setShowResult] = useState(false), [finishStep, setFinishStep] = useState<0 | 1 | 2>(0);
  const [finalChestPhase, setFinalChestPhase] = useState<'hidden' | 'closed' | 'opening' | 'open'>('hidden');
  const [committedRewards, setCommittedRewards] = useState<MinigameRunRewards | null>(null);
  const initialDifficulty = useMemo<Difficulty>(() => {
    const saved = window.localStorage.getItem(getDifficultyStorageKey('lavaValley', stageNumber));
    return saved === 'hard' && isAdventureDifficultyUnlocked('lavaValley', stageNumber, 'hard', relicPartCount) ? 'hard' : 'normal';
  }, [relicPartCount, stageNumber]);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty), [checkpointStage, setCheckpointStage] = useState<1 | 2>(1), [pickupFeedback, setPickupFeedback] = useState<PickupFeedback | null>(null);
  const [jumpGuideActive, setJumpGuideActive] = useState(false), [jumpPressed, setJumpPressed] = useState(false), [burst, setBurst] = useState<Burst | null>(null), [speech, setSpeech] = useState<string | null>(null), [combo, setCombo] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [dashing, setDashing] = useState(false), [dashCooldownMs, setDashCooldownMs] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const itemsRef = useRef<RunnerItem[]>([]), healthRef = useRef(3), resultRef = useRef<Result>('playing'), jumpingRef = useRef(false), invincibleUntilRef = useRef(0), pausedRef = useRef(false), introRef = useRef(true);
  const startTimeRef = useRef(0), lastFrameRef = useRef(0), nextObstacleRef = useRef(0), nextCollectibleRef = useRef(0), nextIdRef = useRef(1), pauseStartedRef = useRef(0), checkpointSpawnedRef = useRef(false), checkpointPassedRef = useRef(false);
  const dashUntilRef = useRef(0), dashReadyAtRef = useRef(0);
  const jumpYRef = useRef(0), jumpVelocityRef = useRef(0), apexHoldUntilRef = useRef(0), difficultyRef = useRef<Difficulty>(initialDifficulty), lastGroundedAtRef = useRef(performance.now()), jumpBufferedUntilRef = useRef(0), hasJumpedSinceGroundRef = useRef(false);
  const guidedObstacleIdsRef = useRef(new Set<number>()), highGuideCountRef = useRef(0), jumpGuideTimerRef = useRef<number | null>(null), coinStreakRef = useRef({ count: 0, lastAt: 0, lastComboAt: 0 });
  const coinsRef = useRef(0), shopItemsRef = useRef<MinigameItemReward[]>([]), rareShardsRef = useRef(0), rewardCommittedRef = useRef(false);
  const secretChestBonusRef = useRef<MinigameRunRewards['secretChestBonus']>();
  const finalChestBonusRef = useRef<MinigameRunRewards['finalChestBonus']>(), finalChestOpeningRef = useRef(false);
  const shopDropPlanRef = useRef<ReturnType<typeof createLavaStageShopPlan>>([]), spawnedShopDropIdsRef = useRef(new Set<number>()), timersRef = useRef<number[]>([]);
  const rareDropPlanRef = useRef<ReturnType<typeof createLavaStageRarePlan>>([]), spawnedRareDropIdsRef = useRef(new Set<number>()), rareStatsRef = useRef({ scheduled: 0, spawned: 0, collected: 0 });
  const healthRestoreSpawnedRef = useRef(false);

  const later = useCallback((action: () => void, delay: number) => { const timer = window.setTimeout(() => { timersRef.current = timersRef.current.filter(id => id !== timer); action(); }, delay); timersRef.current.push(timer); return timer; }, []);
  const showBurst = useCallback((kind: Burst['kind'], x: number, y: number) => setBurst({ id: nextIdRef.current++, kind, x, y }), []);
  const showFeedback = useCallback((kind: PickupFeedback['kind'], label: string) => { const feedback = { id: nextIdRef.current++, kind, label }; setPickupFeedback(feedback); later(() => setPickupFeedback((current) => current?.id === feedback.id ? null : current), 850); }, [later]);
  const showSpeech = useCallback((message: string) => { setSpeech(message); later(() => setSpeech((current) => current === message ? null : current), 2100); }, [later]);
  const beginRun = useCallback(() => { if (!introRef.current) return; introRef.current = false; setIntro(false); const now = performance.now(); shopDropPlanRef.current = createLavaStageShopPlan(stageNumber); rareDropPlanRef.current = createLavaStageRarePlan(stageNumber, difficultyRef.current); spawnedRareDropIdsRef.current.clear(); rareStatsRef.current = { scheduled: rareDropPlanRef.current.length, spawned: 0, collected: 0 }; startTimeRef.current = now; lastFrameRef.current = now; nextObstacleRef.current = now + 1500; nextCollectibleRef.current = now + 1000; showSpeech(introConfig.instruction); }, [showSpeech, stageNumber, introConfig]);
  const restartCurrentSession = useCallback((_reason: Extract<LavaValleyEndReason, 'hp_depleted' | 'manual_restart'>) => {
    if (_reason === 'hp_depleted') { onRetry(true); return; }
    timersRef.current.forEach(window.clearTimeout); timersRef.current = [];
    missionRef.current = createLavaCliffMission(); setSymbols(0); setBonusRoute(false); setBonusChestOpen(false);
    hudRef.current = { second: -1, invincible: false, dashing: false, cooldownBucket: -1 }; renderedItemIdsRef.current = '';
    if (jumpGuideTimerRef.current) window.clearTimeout(jumpGuideTimerRef.current);
    platformsRef.current = []; setPlatforms([]); platformElementsRef.current.clear(); itemElementsRef.current.clear(); invalidObstacleIdsRef.current.clear(); travelRef.current = 0; nextSegmentRef.current = { index: 0, start: 0 }; ridingPlatformIdRef.current = null; finalTreasureSpawnedRef.current = false; finalChestOpeningRef.current = false;
    if (playerMotionRef.current) playerMotionRef.current.style.transform = 'translateY(0px)';
    itemsRef.current = []; healthRef.current = 3; resultRef.current = 'playing'; jumpingRef.current = false; invincibleUntilRef.current = 0; pausedRef.current = false; introRef.current = true;
    startTimeRef.current = 0; lastFrameRef.current = 0; nextObstacleRef.current = 0; nextCollectibleRef.current = 0; pauseStartedRef.current = 0; checkpointSpawnedRef.current = false; checkpointPassedRef.current = false; healthRestoreSpawnedRef.current = false; dashUntilRef.current = 0; dashReadyAtRef.current = 0;
    jumpYRef.current = 0; jumpVelocityRef.current = 0; apexHoldUntilRef.current = 0; lastGroundedAtRef.current = performance.now(); jumpBufferedUntilRef.current = 0; hasJumpedSinceGroundRef.current = false; guidedObstacleIdsRef.current.clear(); highGuideCountRef.current = 0;
    coinsRef.current = 0; rareShardsRef.current = 0; shopItemsRef.current = []; secretChestBonusRef.current = undefined; finalChestBonusRef.current = undefined; rewardCommittedRef.current = false; shopDropPlanRef.current = []; spawnedShopDropIdsRef.current.clear(); spawnedRareDropIdsRef.current.clear(); rareStatsRef.current = { scheduled: 0, spawned: 0, collected: 0 }; coinStreakRef.current = { count: 0, lastAt: 0, lastComboAt: 0 };
    setItems([]); setCoins(0); setRareShards(0); setShopItemCount(0); setHealth(3); setTimeLeft(gameDuration); setJumping(false); setRising(false); setInvincible(false); setPaused(false); setResult('playing'); setShowResult(false); setFinishStep(0); setFinalChestPhase('hidden'); setCommittedRewards(null); setCheckpointStage(1); setPickupFeedback(null); setJumpGuideActive(false); setJumpPressed(false); setBurst(null); setSpeech(null); setCombo(false); setDashing(false); setDashCooldownMs(0); setIntro(true); setAttempt((value) => value + 1);
  }, [stageNumber, gameDuration, onRetry]);

  const startJump = useCallback(() => { const preset = getLavaJumpPhysics(stageNumber, difficultyRef.current); ridingPlatformIdRef.current = null; jumpingRef.current = true; hasJumpedSinceGroundRef.current = true; jumpBufferedUntilRef.current = 0; apexHoldUntilRef.current = 0; jumpVelocityRef.current = preset.jumpVelocity; setJumping(true); setRising(true); showBurst('jump', LAVA_RUNNER_CONFIG.playerX - 1, LAVA_RUNNER_CONFIG.footEffectBottom); }, [showBurst, stageNumber]);
  const jump = useCallback(() => { if (resultRef.current !== 'playing' || pausedRef.current || introRef.current) return; const now = performance.now(), preset = LAVA_VALLEY_DIFFICULTY[difficultyRef.current]; const canUseCoyoteTime = !hasJumpedSinceGroundRef.current && now - lastGroundedAtRef.current <= preset.coyoteTimeMs; if (!jumpingRef.current || canUseCoyoteTime) { startJump(); return; } jumpBufferedUntilRef.current = now + preset.jumpBufferMs; }, [startJump]);
  const dash = useCallback(() => { const now = performance.now(); if (resultRef.current !== 'playing' || pausedRef.current || introRef.current || now < dashReadyAtRef.current) return; dashUntilRef.current = now + LAVA_RUNNER_CONFIG.dashDurationMs; dashReadyAtRef.current = now + gameplay.dashCooldownMs; hudRef.current.dashing = true; setDashing(true); setDashCooldownMs(gameplay.dashCooldownMs); showBurst('jump', LAVA_RUNNER_CONFIG.playerX - 5, LAVA_RUNNER_CONFIG.footEffectBottom); }, [showBurst, gameplay]);
  const openSettings = () => { if (resultRef.current !== 'playing' || introRef.current) return; pauseStartedRef.current = performance.now(); pausedRef.current = true; setPaused(true); };
  const closeSettings = () => { const pausedFor = performance.now() - pauseStartedRef.current; startTimeRef.current += pausedFor; nextObstacleRef.current += pausedFor; nextCollectibleRef.current += pausedFor; invincibleUntilRef.current += pausedFor; if (dashUntilRef.current) dashUntilRef.current += pausedFor; if (dashReadyAtRef.current) dashReadyAtRef.current += pausedFor; if (apexHoldUntilRef.current) apexHoldUntilRef.current += pausedFor; lastFrameRef.current = performance.now(); pausedRef.current = false; setPaused(false); };
  const chooseDifficulty = (next: Difficulty) => { if (!isAdventureDifficultyUnlocked('lavaValley', stageNumber, next, relicPartCount)) return; difficultyRef.current = next; setDifficulty(next); window.localStorage.setItem(getDifficultyStorageKey('lavaValley', stageNumber), next); setJumpGuideActive(false); const preset = LAVA_VALLEY_DIFFICULTY[next]; nextObstacleRef.current = performance.now() + randomBetween(preset.obstacleSpawnIntervalMin, preset.obstacleSpawnIntervalMax); };
  const finish = useCallback((next: Exclude<Result, 'playing'>) => { if (resultRef.current !== 'playing') return; resultRef.current = next; itemsRef.current = []; setItems([]); const reason: LavaValleyEndReason = next === 'success' ? 'completed' : 'hp_depleted'; if (shouldCommitLavaValleyRewards(reason) && !rewardCommittedRef.current) { rewardCommittedRef.current = true; const rewards = normalizeLavaValleyRewards({ coins: 0, runCoins: coinsRef.current, rareFragments: rareShardsRef.current, shopItems: shopItemsRef.current, secretChestBonus: secretChestBonusRef.current, finalChestBonus: finalChestBonusRef.current }, stageConfig.itemPool); setCommittedRewards(onFinishRun(runId, rewards)); } setResult(next); if (next === 'success') { setFinishStep(1); showBurst('clear', 70, 48); later(() => setFinishStep(2), 700); later(() => setShowResult(true), 1500); } else { setCommittedRewards(null); setShowResult(true); } }, [later, onFinishRun, runId, showBurst, stageConfig]);

  const openFinalChest = useCallback(() => {
    if (stageNumber !== 3 || finalChestOpeningRef.current || finalChestPhase !== 'closed') return;
    finalChestOpeningRef.current = true;
    setFinalChestPhase('opening');
    const itemId = stageConfig.itemPool.food[0];
    const bonus = {
      coins: LAVA_FINAL_CHEST_CONFIG.coinReward,
      rareFragments: LAVA_FINAL_CHEST_CONFIG.rareFragmentReward,
      shopItems: itemId ? [{ itemId, quantity: LAVA_FINAL_CHEST_CONFIG.itemReward }] : [],
    };
    finalChestBonusRef.current = bonus;
    coinsRef.current += bonus.coins; rareShardsRef.current += bonus.rareFragments; shopItemsRef.current.push(...bonus.shopItems);
    setCoins(coinsRef.current); setRareShards(rareShardsRef.current); setShopItemCount(shopItemsRef.current.reduce((sum, reward) => sum + reward.quantity, 0));
    rewardCommittedRef.current = true;
    const rewards = normalizeLavaValleyRewards({ coins: 0, runCoins: coinsRef.current, rareFragments: rareShardsRef.current, shopItems: shopItemsRef.current, secretChestBonus: secretChestBonusRef.current, finalChestBonus: bonus }, stageConfig.itemPool);
    setCommittedRewards(onFinishRun(runId, rewards));
    showBurst('clear', 62, 42); showFeedback('coin', `최종 보물상자! 코인 +${bonus.coins} · 희귀조각 +${bonus.rareFragments} · 아이템 +1`);
    later(() => setFinalChestPhase('open'), 500);
    later(() => finish('success'), 1200);
  }, [finalChestPhase, finish, later, onFinishRun, runId, showBurst, showFeedback, stageConfig.itemPool, stageNumber]);

  useEffect(() => {
    let cancelled = false;
    setAssetsReady(false);
    preloadImages([...PLAYER_PRELOAD_ASSETS, background, ...(stageNumber >= 2 ? Object.values(lavaValleyStage2Assets) : []), ...(stageNumber === 3 ? Object.values(lavaValleyStage3Assets) : [])]).then(() => { if (!cancelled) setAssetsReady(true); }).catch((error) => console.error(error));
    return () => { cancelled = true; };
  }, [background, stageNumber]);
  useEffect(() => { const keyDown = (event: KeyboardEvent) => { if ((event.code === 'Space' || event.code === 'ArrowUp') && !event.repeat) { event.preventDefault(); jump(); } }; window.addEventListener('keydown', keyDown); return () => window.removeEventListener('keydown', keyDown); }, [jump]);
  useEffect(() => { const keyDown = (event: KeyboardEvent) => { if ((event.code === 'ShiftLeft' || event.code === 'ShiftRight') && !event.repeat) { event.preventDefault(); dash(); } }; window.addEventListener('keydown', keyDown); return () => window.removeEventListener('keydown', keyDown); }, [dash]);
  useEffect(() => () => { if (jumpGuideTimerRef.current) window.clearTimeout(jumpGuideTimerRef.current); timersRef.current.forEach(window.clearTimeout); }, []);
  useEffect(() => { if (import.meta.env.DEV && result !== 'playing') console.debug('[Lava Valley] rare fragments', rareStatsRef.current); }, [result]);
  useEffect(() => {
    const element = playfieldRef.current; if (!element) return;
    const update = () => {
      const dino = element.querySelector<HTMLElement>('.lava-runner__dino');
      // RUN cell foot is at y=432/512, inside the 90%-height sprite box.
      const footOffset = (dino?.offsetHeight ?? 0) * (1 - .9 * 432 / 512) * LAVA_VALLEY_DIFFICULTY[difficulty].playerVisualScale;
      fieldSizeRef.current = { width: element.clientWidth, height: element.clientHeight, footOffset };
      element.style.setProperty('--lava-ground-surface-y', getLavaGroundSpawnY(footOffset));
    };
    update(); const observer = new ResizeObserver(update); observer.observe(element); return () => observer.disconnect();
  }, [difficulty]);
  useEffect(() => {
    let frame = 0;
    const addMissionPlatform = (height: number) => {
      // Leave the surface under the player intact, then make one clear upper lane ahead.
      platformsRef.current = platformsRef.current.filter(platform => platform.x < 70).map(platform => ({ ...platform, width: Math.min(platform.width, 70 - platform.x) }));
      platformsRef.current.push({ id: nextIdRef.current++, x: 90, width: LAVA_CLIFF_MISSION.platformWidth, height, route: 'upper' });
      setPlatforms([...platformsRef.current]);
    };
    const updateCliffMission = (elapsed: number) => {
      const mission = missionRef.current;
      const isNearSecretDoor = (x: number) => itemsRef.current.some(item => item.kind === 'secretGate' && Math.abs(item.x - x) <= LAVA_CLIFF_MISSION.secretDoorExclusionRadius);
      const symbolPlan = stageNumber === 3 ? LAVA_VOLCANO_CORE.symbols : LAVA_CLIFF_MISSION.symbols;
      const symbol = gameplay.symbolMission ? symbolPlan[mission.spawned] : undefined;
      if (symbol && elapsed >= symbol.at) {
        const route = 'route' in symbol ? symbol.route : 'upper';
        if (stageNumber === 2) addMissionPlatform(symbol.height);
        if (stageNumber === 3 && route !== 'lower') {
          platformsRef.current.push({ id: nextIdRef.current++, x: 116, width: 34, height: symbol.height - 4, baseHeight: symbol.height - 4, route, behavior: 'static' });
          setPlatforms([...platformsRef.current]);
        }
        itemsRef.current.push({ id: nextIdRef.current++, kind: 'symbol', x: 132, height: symbol.height, route });
        mission.spawned += 1;
        showSpeech('화석조각을 모아 비밀문을 열어보세요!');
      }
      const gateAt = stageNumber === 3 ? LAVA_VOLCANO_CORE.gateAt : LAVA_CLIFF_MISSION.gateAt;
      if (gameplay.secretRoute && !mission.gateSpawned && elapsed >= gateAt) {
        mission.gateSpawned = true;
        itemsRef.current = itemsRef.current.filter(item => Math.abs(item.x - 112) > LAVA_CLIFF_MISSION.secretDoorExclusionRadius);
        platformsRef.current = platformsRef.current.filter(platform => platform.x + platform.width < 112 - LAVA_CLIFF_MISSION.secretDoorExclusionRadius || platform.x > 112 + LAVA_CLIFF_MISSION.secretDoorExclusionRadius);
        setPlatforms([...platformsRef.current]);
        itemsRef.current.push({ id: nextIdRef.current++, kind: 'secretGate', x: 112, height: 0, route: 'lower' });
        showSpeech(mission.symbols === LAVA_CLIFF_MISSION.symbolCount ? '비밀문이 열렸어요!' : '화석조각 3개가 있으면 열리는 비밀문이에요');
      }
      if (isLavaBonusRouteActive(mission, elapsed)) {
        // Stop spawning early enough for the last coins to reach the player before rejoining.
        if (elapsed >= mission.bonusNextCoin && elapsed < mission.bonusEnd - 3 && itemsRef.current.length < LAVA_CLIFF_MISSION.maxItems - 2) {
          for (const x of [95, 104]) itemsRef.current.push({ id: nextIdRef.current++, kind: 'coin', x, height: LAVA_CLIFF_MISSION.routeHeight + 4, route: 'secret' });
          mission.bonusNextCoin = elapsed + LAVA_CLIFF_MISSION.bonusCoinInterval;
        }
      } else if (mission.bonusStart >= 0 && platformsRef.current.some(platform => platform.route === 'secret')) {
        // A finite strip scrolls out from under the player, who falls to the safe ground.
        platformsRef.current = platformsRef.current.map(platform => platform.route === 'secret' ? { ...platform, x: -70, width: 100, route: 'upper' } : platform);
        setPlatforms([...platformsRef.current]); setBonusRoute(false);
        nextObstacleRef.current = performance.now() + 2500;
        showSpeech('다시 큰 길로! 끝까지 달려요!');
      }
      const eruptionTimes = stageNumber === 3 ? LAVA_VOLCANO_CORE.eruptionTimes : LAVA_CLIFF_MISSION.eruptionTimes;
      const eruptionAt = eruptionTimes[mission.eruptions];
      if (gameplay.eruptions && eruptionAt !== undefined && elapsed >= eruptionAt) {
        if (!isLavaBonusRouteActive(mission, elapsed) && !mission.gateSpawned && itemsRef.current.length < LAVA_CLIFF_MISSION.maxItems) {
          if (!isNearSecretDoor(110)) itemsRef.current.push({ id: nextIdRef.current++, kind: 'eruption', x: 110, height: 0, route: 'lower', phase: 'warning' });
        }
        mission.eruptions += 1;
      }
      for (const item of itemsRef.current) {
        if (item.kind !== 'eruption') continue;
        if (item.eruptionStartedAt === undefined && item.x <= 65) item.eruptionStartedAt = elapsed;
        item.phase = item.eruptionStartedAt === undefined ? 'warning' : getLavaEruptionPhase(elapsed - item.eruptionStartedAt);
      }
      itemsRef.current = itemsRef.current.filter(item => item.phase !== 'done');
    };
    const spawnObstacle = (now: number, preset: typeof LAVA_VALLEY_DIFFICULTY[Difficulty]) => {
      const count = itemsRef.current.filter(item => isObstacle(item.kind) || item.kind === 'eruption').length;
      // Stage 3 continuously seeds platform reward coins; those must not suppress its obstacle cadence.
      const spawnAreaBusy = itemsRef.current.some(item => item.x > 78 && (stageNumber === 3
        ? isObstacle(item.kind) || item.kind === 'eruption' || item.kind === 'secretGate' || item.kind === 'symbol' || item.kind === 'finalTreasure'
        : !isObstacle(item.kind)));
      const nearSecretDoor = itemsRef.current.some(item => item.kind === 'secretGate' && Math.abs(item.x - 110) <= LAVA_CLIFF_MISSION.secretDoorExclusionRadius);
      if (count < LAVA_RUNNER_CONFIG.maxObstacles && !spawnAreaBusy && !nearSecretDoor && itemsRef.current.length < LAVA_CLIFF_MISSION.maxItems) {
        const kind: ObstacleKind = Math.random() < preset.geyserChance ? 'geyser' : 'rock';
        const upper = gameplay.symbolMission && kind === 'rock' && Math.random() < .3 ? platformsRef.current.find(platform => platform.x <= 110 && platform.x + platform.width >= 120) : undefined;
        itemsRef.current.push({ id: nextIdRef.current++, kind, x: 110, height: upper?.height ?? 0, route: upper ? 'upper' : 'lower' });
      }
      const interval = getLavaObstacleSpawnInterval(stageNumber, difficultyRef.current, (now - startTimeRef.current) / 1000);
      nextObstacleRef.current = now + randomBetween(interval.min, interval.max);
    };
    const spawnCollectible = (now: number) => {
      const spawnAreaBusy = itemsRef.current.some(item => (isObstacle(item.kind) || item.kind === 'eruption') && item.x > 82);
      const nearSecretDoor = itemsRef.current.some(item => item.kind === 'secretGate' && Math.abs(item.x - 110) <= LAVA_CLIFF_MISSION.secretDoorExclusionRadius);
      if (!spawnAreaBusy && !nearSecretDoor && itemsRef.current.length < LAVA_CLIFF_MISSION.maxItems - 4) {
        if (shouldSpawnHealthRestore(healthRef.current, 3, healthRestoreSpawnedRef.current)) {
          healthRestoreSpawnedRef.current = true;
          itemsRef.current.push({ id: nextIdRef.current++, kind: 'health_restore', x: 110, height: LAVA_VALLEY_COLLECTIBLE_LANES.low, route: 'lower' });
        } else {
          const pattern = LAVA_VALLEY_COIN_PATTERNS[Math.floor(Math.random() * LAVA_VALLEY_COIN_PATTERNS.length)];
          const upper = gameplay.symbolMission && Math.random() < .4 ? platformsRef.current.find(platform => platform.x <= 108 && platform.x + platform.width >= 130) : undefined;
          pattern.forEach((height, index) => { const x = 108 + index * 7; itemsRef.current.push({ id: nextIdRef.current++, kind: 'coin', x, height: upper ? upper.height + 4 : height, route: upper ? 'upper' : 'lower' }); });
        }
      }
      nextCollectibleRef.current = now + randomBetween(LAVA_RUNNER_CONFIG.collectibleIntervalMin, LAVA_RUNNER_CONFIG.collectibleIntervalMax) * getLavaCoinIntervalScale(stageNumber);
    };
    const spawnScheduledRareFragment = (elapsedSeconds: number) => {
      const scheduled = rareDropPlanRef.current.find(drop => !spawnedRareDropIdsRef.current.has(drop.id) && elapsedSeconds >= drop.spawnAtSeconds);
      const nearSecretDoor = itemsRef.current.some(item => item.kind === 'secretGate' && Math.abs(item.x - 110) <= LAVA_CLIFF_MISSION.secretDoorExclusionRadius);
      if (!scheduled || nearSecretDoor || itemsRef.current.length >= LAVA_CLIFF_MISSION.maxItems || itemsRef.current.some(item => item.x > 78 && (isObstacle(item.kind) || item.kind === 'eruption' || item.kind === 'shopItem' || item.kind === 'shard'))) return;
      spawnedRareDropIdsRef.current.add(scheduled.id); rareStatsRef.current.spawned += 1;
      const onBonus = isLavaBonusRouteActive(missionRef.current, elapsedSeconds);
      itemsRef.current.push({ id: nextIdRef.current++, kind: 'shard', x: 110, height: onBonus ? LAVA_CLIFF_MISSION.routeHeight + 4 : Math.random() < .55 ? LAVA_VALLEY_COLLECTIBLE_LANES.low : LAVA_VALLEY_COLLECTIBLE_LANES.high, route: onBonus ? 'secret' : 'lower' });
    };
    const spawnScheduledShopItem = (elapsedSeconds: number) => {
      const onBonus = isLavaBonusRouteActive(missionRef.current, elapsedSeconds);
      const scheduled = shopDropPlanRef.current.find(drop => !spawnedShopDropIdsRef.current.has(drop.id) && elapsedSeconds >= drop.spawnAtSeconds);
      const nearSecretDoor = itemsRef.current.some(item => item.kind === 'secretGate' && Math.abs(item.x - 110) <= LAVA_CLIFF_MISSION.secretDoorExclusionRadius);
      if (!scheduled || nearSecretDoor || itemsRef.current.length >= LAVA_CLIFF_MISSION.maxItems || itemsRef.current.some(item => item.x > 78 && (!onBonus || item.kind !== 'coin'))) return;
      const item = getItemConfig(scheduled.itemId); if (!item) return;
      spawnedShopDropIdsRef.current.add(scheduled.id);
      const upper = gameplay.symbolMission ? platformsRef.current.find(platform => platform.x <= 110 && platform.x + platform.width >= 110) : undefined;
      const height = upper ? upper.height + 4 : Math.random() < .7 ? LAVA_VALLEY_COLLECTIBLE_LANES.low : LAVA_VALLEY_COLLECTIBLE_LANES.high;
      itemsRef.current.push({ id: nextIdRef.current++, kind: 'shopItem', itemId: item.id, label: item.name, x: 110, height, route: onBonus ? 'secret' : upper ? 'upper' : 'lower' });
    };
    const tick = (now: number) => {
      if (introRef.current || pausedRef.current) { lastFrameRef.current = now; frame = requestAnimationFrame(tick); return; }
      const preset = LAVA_VALLEY_DIFFICULTY[difficultyRef.current], physics = getLavaJumpPhysics(stageNumber, difficultyRef.current);
      const elapsedMs = now - startTimeRef.current, elapsed = elapsedMs / 1000, remaining = Math.max(0, Math.ceil(gameDuration - elapsed));
      if (hudRef.current.second !== remaining) { hudRef.current.second = remaining; setTimeLeft(remaining); }
      if (!remaining) {
        if (stageNumber !== 3) { finish('success'); return; }
        if (!finalTreasureSpawnedRef.current) {
          finalTreasureSpawnedRef.current = true;
          itemsRef.current = [{ id: nextIdRef.current++, kind: 'finalTreasure', x: 62, height: 0, route: 'lower' }];
          setItems([...itemsRef.current]); setFinalChestPhase('closed');
          showSpeech('최종 보물상자를 터치해서 열어 보세요!');
        }
        if (resultRef.current === 'playing') frame = requestAnimationFrame(tick); return;
      }
      const delta = Math.min((now - (lastFrameRef.current || now)) / 1000, .04); lastFrameRef.current = now;
      const nextInvincible = now < invincibleUntilRef.current;
      if (hudRef.current.invincible !== nextInvincible) { hudRef.current.invincible = nextInvincible; setInvincible(nextInvincible); }
      const isDashing = now < dashUntilRef.current;
      if (hudRef.current.dashing !== isDashing) { hudRef.current.dashing = isDashing; setDashing(isDashing); }
      const nextDashCooldown = Math.max(0, dashReadyAtRef.current - now), cooldownBucket = Math.ceil(nextDashCooldown / 100);
      if (hudRef.current.cooldownBucket !== cooldownBucket) { hudRef.current.cooldownBucket = cooldownBucket; setDashCooldownMs(nextDashCooldown); }
      const recoveryRatio = Math.max(0, Math.min(1, (dashUntilRef.current + LAVA_RUNNER_CONFIG.dashRecoveryMs - now) / LAVA_RUNNER_CONFIG.dashRecoveryMs));
      const movementMultiplier = isDashing ? LAVA_RUNNER_CONFIG.dashSpeedMultiplier : 1 + (LAVA_RUNNER_CONFIG.dashSpeedMultiplier - 1) * recoveryRatio;
      const movement = preset.runSpeed * movementMultiplier * delta;
      if (stageNumber === 2) {
        travelRef.current += movement;
        const before = platformsRef.current.length;
        platformsRef.current.forEach(platform => { if (platform.route !== 'secret') platform.x -= movement; });
        platformsRef.current = platformsRef.current.filter(platform => platform.x + platform.width > -5);
        let changed = before !== platformsRef.current.length;
        const next = nextSegmentRef.current;
        if (next.start <= travelRef.current + 112) {
          const segment = LAVA_STAGE_TWO_SEGMENTS[next.index % LAVA_STAGE_TWO_SEGMENTS.length];
          for (const template of isLavaBonusRouteActive(missionRef.current, elapsed) ? [] : segment.platforms) {
            if (platformsRef.current.length >= LAVA_STAGE_TWO_MAX_PLATFORMS) break;
            const platform: LavaPlatform = { id: nextIdRef.current++, x: next.start + template.offset - travelRef.current, width: template.width, height: template.height, route: 'upper' };
            if (platformsRef.current.some(existing => platform.x < existing.x + existing.width + 6 && platform.x + platform.width > existing.x - 6)) continue;
            platformsRef.current.push(platform);
            changed = true;
          }
          next.start += segment.length; next.index += 1;
        }
        if (changed) setPlatforms([...platformsRef.current]);
        if (!jumpingRef.current && !isOnLavaPlatform(platformsRef.current, LAVA_RUNNER_CONFIG.playerX, jumpYRef.current)) {
          jumpingRef.current = true; jumpVelocityRef.current = 0; apexHoldUntilRef.current = 0; setJumping(true); setRising(false);
        }
      }
      if (stageNumber === 3) {
        travelRef.current += movement;
        const before = platformsRef.current.length;
        let changed = false;
        for (const platform of platformsRef.current) {
          platform.x -= movement;
          if (platform.behavior === 'moving') {
            const previousHeight = platform.height;
            platform.height = (platform.baseHeight ?? platform.height) + Math.sin(elapsed * LAVA_VOLCANO_CORE.movingPlatformSpeed + (platform.motionPhase ?? 0)) * LAVA_VOLCANO_CORE.movingPlatformRange;
            if (ridingPlatformIdRef.current === platform.id && !jumpingRef.current) jumpYRef.current += platform.height - previousHeight;
          }
          if (platform.behavior === 'crumbling' && platform.crumbleStartedAt !== undefined && !platform.collapsed && now - platform.crumbleStartedAt >= LAVA_VOLCANO_CORE.crumbleDelayMs) {
            platform.collapsed = true; changed = true;
            if (ridingPlatformIdRef.current === platform.id) ridingPlatformIdRef.current = null;
          }
        }
        platformsRef.current = platformsRef.current.filter(platform => platform.x + platform.width > -5);
        if (before !== platformsRef.current.length) changed = true;
        const next = nextSegmentRef.current;
        if (next.start <= travelRef.current + 118) {
          const phase = elapsed < 60 ? 'opening' : elapsed < 125 ? 'middle' : 'final';
          const choices = LAVA_STAGE_THREE_SEGMENTS.filter(segment => segment.phase === phase);
          const segment = choices[next.index % choices.length];
          for (const template of segment.platforms) {
            if (platformsRef.current.length >= LAVA_STAGE_THREE_MAX_PLATFORMS) break;
            const platform: LavaPlatform = { id: nextIdRef.current++, x: next.start + template.offset - travelRef.current, width: template.width, height: template.height, baseHeight: template.height, route: template.route, behavior: template.behavior, motionPhase: next.index * 1.7 };
            if (missionRef.current.gateSpawned && platform.x < 112 + LAVA_CLIFF_MISSION.secretDoorExclusionRadius && platform.x + platform.width > 112 - LAVA_CLIFF_MISSION.secretDoorExclusionRadius) continue;
            if (platformsRef.current.some(existing => platform.x < existing.x + existing.width + 5 && platform.x + platform.width > existing.x - 5)) continue;
            platformsRef.current.push(platform); changed = true;
            const rewardCount = template.route === 'top' ? 4 : template.route === 'high' ? 3 : template.route === 'middle' ? 1 : 0;
            for (let index = 0; index < rewardCount; index += 1) itemsRef.current.push({ id: nextIdRef.current++, kind: 'coin', x: platform.x + platform.width * (index + 1) / (rewardCount + 1), height: platform.height + 4, route: template.route });
          }
          next.start += segment.length; next.index += 1;
        }
        if (changed) setPlatforms([...platformsRef.current]);
        if (!jumpingRef.current && !isOnLavaPlatform(platformsRef.current, LAVA_RUNNER_CONFIG.playerX, jumpYRef.current)) {
          ridingPlatformIdRef.current = null; jumpingRef.current = true; jumpVelocityRef.current = 0; apexHoldUntilRef.current = 0; setJumping(true); setRising(false);
        }
      }
      if (jumpingRef.current) {
        const previousY = jumpYRef.current;
        if (now >= apexHoldUntilRef.current) {
          const previousVelocity = jumpVelocityRef.current;
          jumpVelocityRef.current -= physics.gravity * delta;
          if (previousVelocity > 0 && jumpVelocityRef.current <= 0) { jumpVelocityRef.current = -.01; apexHoldUntilRef.current = now + physics.apexHoldMs; setRising(false); }
          else jumpYRef.current += jumpVelocityRef.current * delta;
        }
        const landing = getLavaLandingHeight(stageNumber >= 2 ? platformsRef.current : [], LAVA_RUNNER_CONFIG.playerX, previousY, jumpYRef.current, jumpVelocityRef.current);
        if (landing !== null) {
          jumpYRef.current = landing; jumpVelocityRef.current = 0; apexHoldUntilRef.current = 0; jumpingRef.current = false; hasJumpedSinceGroundRef.current = false; lastGroundedAtRef.current = now; setJumping(false);
          showBurst('landing', LAVA_RUNNER_CONFIG.playerX - 1, LAVA_RUNNER_CONFIG.footEffectBottom + landing);
          const landedPlatform = getLavaPlatformAt(platformsRef.current, LAVA_RUNNER_CONFIG.playerX, landing);
          ridingPlatformIdRef.current = landedPlatform?.id ?? null;
          if (stageNumber === 3 && landedPlatform?.behavior === 'crumbling' && landedPlatform.crumbleStartedAt === undefined) { landedPlatform.crumbleStartedAt = now; setPlatforms([...platformsRef.current]); }
          if (now <= jumpBufferedUntilRef.current) startJump();
        }
      } else { lastGroundedAtRef.current = now; hasJumpedSinceGroundRef.current = false; }
      if (playerMotionRef.current) playerMotionRef.current.style.transform = 'translateY(' + (-jumpYRef.current * fieldSizeRef.current.height / 100) + 'px)';
      for (const platform of platformsRef.current) {
        const element = platformElementsRef.current.get(platform.id);
        if (element) { element.style.transform = 'translateX(' + (platform.x * fieldSizeRef.current.width / 100) + 'px)'; element.style.bottom = 'calc(' + (20 + platform.height) + '% + ' + fieldSizeRef.current.footOffset + 'px)'; element.dataset.crumble = platform.collapsed ? 'collapsed' : platform.crumbleStartedAt !== undefined ? 'warning' : 'stable'; }
      }
      if (gameplay.symbolMission || gameplay.eruptions) updateCliffMission(elapsed);
      const onBonusRoute = isLavaBonusRouteActive(missionRef.current, elapsed);
      if (!onBonusRoute && now >= nextObstacleRef.current) spawnObstacle(now, preset);
      if (!onBonusRoute && now >= nextCollectibleRef.current) spawnCollectible(now);
      spawnScheduledRareFragment(elapsedMs / 1000);
      spawnScheduledShopItem(elapsedMs / 1000);
      if (!checkpointSpawnedRef.current && elapsedMs >= gameDuration * 1000 * LAVA_RUNNER_CONFIG.checkpointProgress && !itemsRef.current.some((item) => isObstacle(item.kind) && item.x > 72)) { checkpointSpawnedRef.current = true; itemsRef.current.push({ id: nextIdRef.current++, kind: 'checkpoint', x: 112, height: 0, route: 'lower' }); }
      itemsRef.current.forEach(item => { item.x -= movement; });
      itemsRef.current = itemsRef.current.filter(item => item.x > -15);
      if (preset.jumpGuideEnabled) { const guideTarget = itemsRef.current.find((item) => (isObstacle(item.kind) || (isCollectible(item.kind) && item.height === LAVA_VALLEY_COLLECTIBLE_LANES.high && highGuideCountRef.current < 2)) && item.x > LAVA_RUNNER_CONFIG.playerX && item.x <= LAVA_RUNNER_CONFIG.playerX + 34 && !guidedObstacleIdsRef.current.has(item.id)); if (guideTarget) { guidedObstacleIdsRef.current.add(guideTarget.id); if (isCollectible(guideTarget.kind)) highGuideCountRef.current += 1; setJumpGuideActive(false); requestAnimationFrame(() => setJumpGuideActive(true)); if (jumpGuideTimerRef.current) window.clearTimeout(jumpGuideTimerRef.current); jumpGuideTimerRef.current = window.setTimeout(() => setJumpGuideActive(false), 650); } }
      const removed = new Set<number>();
      for (const item of itemsRef.current) {
        if (invalidObstacleIdsRef.current.has(item.id)) { removed.add(item.id); continue; }
        if (item.kind === 'symbol') {
          if (Math.abs(item.x - LAVA_RUNNER_CONFIG.playerX) <= 8 && Math.abs(jumpYRef.current - item.height) <= 9) {
            removed.add(item.id); missionRef.current.symbols += 1; setSymbols(missionRef.current.symbols);
            showBurst('fossil', item.x, item.height + 20);
            showSpeech(missionRef.current.symbols === LAVA_CLIFF_MISSION.symbolCount ? '비밀문이 열렸어요!' : `화석조각 ${missionRef.current.symbols}/3!`);
          }
          continue;
        }
        if (item.kind === 'secretGate') {
          const mission = missionRef.current;
          const doorDistance = Math.abs(item.x - LAVA_RUNNER_CONFIG.playerX);
          if (!mission.gatePassed && canEnterLavaSecretRoute(mission.symbols, doorDistance)) {
            mission.gatePassed = true; mission.bonusStart = elapsed; mission.bonusEnd = elapsed + LAVA_CLIFF_MISSION.routeSeconds; mission.bonusNextCoin = elapsed;
            removed.add(item.id);
            platformsRef.current = [{ id: nextIdRef.current++, x: 0, width: 125, height: LAVA_CLIFF_MISSION.routeHeight, route: 'secret' }];
            setPlatforms([...platformsRef.current]); setBonusRoute(true);
            itemsRef.current.push({ id: nextIdRef.current++, kind: 'bonusChest', x: 82, height: LAVA_CLIFF_MISSION.routeHeight + 3, route: 'secret' });
            itemsRef.current.forEach(other => { if (isObstacle(other.kind) || other.kind === 'eruption') removed.add(other.id); });
            if (jumpYRef.current < LAVA_CLIFF_MISSION.routeHeight) { jumpYRef.current = LAVA_CLIFF_MISSION.routeHeight; jumpVelocityRef.current = 0; }
            showSpeech('비밀 샛길이에요! 아이템을 모아요!');
          }
          continue;
        }
        if (item.kind === 'bonusChest') {
          if (!missionRef.current.chestOpened && Math.abs(item.x - LAVA_RUNNER_CONFIG.playerX) <= 9) {
            missionRef.current.chestOpened = true; setBonusChestOpen(true);
            const bonus = createLavaSecretChestReward(stageConfig.itemPool.food);
            secretChestBonusRef.current = bonus;
            coinsRef.current += bonus.coins; rareShardsRef.current += bonus.rareFragments; shopItemsRef.current.push(...bonus.shopItems);
            setCoins(coinsRef.current); setRareShards(rareShardsRef.current); setShopItemCount(shopItemsRef.current.reduce((sum, reward) => sum + reward.quantity, 0));
            const itemName = bonus.shopItems[0] ? getItemConfig(bonus.shopItems[0].itemId)?.name : undefined;
            showBurst('coin', item.x, item.height + 18); showFeedback('coin', `비밀상자! +100 코인 · 희귀조각 +1${itemName ? ` · ${itemName} +1` : ''}`);
          }
          continue;
        }
        if (item.kind === 'eruption' && item.phase !== 'active') continue;
        if (item.kind === 'checkpoint') { if (!checkpointPassedRef.current && item.x <= LAVA_RUNNER_CONFIG.playerX) { checkpointPassedRef.current = true; setCheckpointStage(2); showFeedback('checkpoint', '체크포인트!'); showBurst('checkpoint', LAVA_RUNNER_CONFIG.playerX + 8, 20); } continue; }
        if (item.kind === 'health_restore') { if (Math.abs(item.x - LAVA_RUNNER_CONFIG.playerX) <= 7 && Math.abs(jumpYRef.current - item.height) <= 9) { removed.add(item.id); healthRef.current = applyHealthRestore(healthRef.current, 3); setHealth(healthRef.current); showBurst('item', item.x, item.height + 14); showFeedback('shopItem', '생명력 +1'); } continue; }
        if (isCollectible(item.kind)) { if (Math.abs(item.x - LAVA_RUNNER_CONFIG.playerX) <= 7 && Math.abs(jumpYRef.current - item.height) <= 9) { removed.add(item.id); showBurst(item.kind === 'coin' ? 'coin' : 'item', item.x, item.height + 14); if (item.kind === 'coin') { coinsRef.current += 1; setCoins(coinsRef.current); showFeedback('coin', '+1'); const streak = coinStreakRef.current; streak.count = now - streak.lastAt <= 1800 ? streak.count + 1 : 1; streak.lastAt = now; if (streak.count >= 3 && now - streak.lastComboAt > 5000) { streak.lastComboAt = now; streak.count = 0; setCombo(true); later(() => setCombo(false), 900); } } if (item.kind === 'shopItem' && item.itemId) { const existing = shopItemsRef.current.find((reward) => reward.itemId === item.itemId); shopItemsRef.current = existing ? shopItemsRef.current.map((reward) => reward.itemId === item.itemId ? { ...reward, quantity: reward.quantity + 1 } : reward) : [...shopItemsRef.current, { itemId: item.itemId, quantity: 1 }]; setShopItemCount((value) => value + 1); showFeedback('shopItem', (item.label ?? '아이템') + ' 획득!'); } if (item.kind === 'shard' && rareShardsRef.current < MAX_RARE_FRAGMENTS_PER_RUN) { rareShardsRef.current += 1; rareStatsRef.current.collected += 1; setRareShards(rareShardsRef.current); showFeedback('shard', '희귀조각 획득!'); showSpeech('희귀조각이다!'); } } continue; }
        if (!isObstacle(item.kind) && item.kind !== 'eruption') continue;
        const obstacleKind = item.kind === 'eruption' ? 'geyser' : item.kind;
        const collisionDistance = (10 * preset.playerHitboxScale + OBSTACLE_WIDTH[obstacleKind] * preset.obstacleHitboxScale) / 2;
        if (Math.abs(item.x - LAVA_RUNNER_CONFIG.playerX) <= collisionDistance && jumpYRef.current >= item.height - 3 && jumpYRef.current < item.height + OBSTACLE_CLEARANCE[obstacleKind] && now >= invincibleUntilRef.current) { removed.add(item.id); healthRef.current -= 1; setHealth(healthRef.current); invincibleUntilRef.current = now + LAVA_RUNNER_CONFIG.invincibleMs; hudRef.current.invincible = true; setInvincible(true); showBurst('hurt', LAVA_RUNNER_CONFIG.playerX + 4, 18); if (healthRef.current <= 0) { finish('failure'); return; } }
      }
      itemsRef.current = itemsRef.current.filter((item) => !removed.has(item.id));
      for (const item of itemsRef.current) {
        const element = itemElementsRef.current.get(item.id);
        if (!element) continue;
        element.style.transform = 'translateX(' + (item.x * fieldSizeRef.current.width / 100) + 'px) translateX(-50%)';
        if (item.kind === 'eruption') element.dataset.phase = item.phase ?? 'warning';
      }
      // React only receives spawn/despawn changes, not animation coordinates.
      const itemIds = itemsRef.current.map(item => `${item.id}:${item.phase ?? ''}`).join(',');
      if (renderedItemIdsRef.current !== itemIds) { renderedItemIdsRef.current = itemIds; setItems([...itemsRef.current]); } if (resultRef.current === 'playing') frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [attempt, finish, later, showBurst, showFeedback, showSpeech, startJump, stageNumber, gameDuration, gameplay]);

  const progress = ((gameDuration - timeLeft) / gameDuration) * 100;
  const trackCycle = useMemo(() => progress < 7 ? [lavaValleyAssets.track.start, ...lavaValleyAssets.track.tiles] : progress > 94 ? [...lavaValleyAssets.track.tiles, lavaValleyAssets.track.end] : checkpointStage === 1 && progress > 42 ? [lavaValleyAssets.track.tiles[0], lavaValleyAssets.track.checkpoint, lavaValleyAssets.track.tiles[1], lavaValleyAssets.track.tiles[2]] : [...lavaValleyAssets.track.tiles, lavaValleyAssets.track.tiles[1]], [checkpointStage, progress]);
  const itemImage = (item: RunnerItem) => item.kind === 'rock' ? lavaValleyAssets.obstacles.rock : item.kind === 'geyser' ? lavaValleyAssets.obstacles.geyser : item.kind === 'coin' ? lavaValleyAssets.collectibles.coin : item.kind === 'health_restore' ? adventureCommonAssets.healthRestore : item.kind === 'shopItem' && item.itemId ? shopItemImages[item.itemId] : item.kind === 'shard' ? lavaValleyAssets.collectibles.rareEggShard : lavaValleyAssets.environment.checkpoint;
  const burstImage = burst ? burst.kind === 'fossil' ? lavaValleyStage2Assets.fossilPickupEffect : lavaValleyAssets.effects[burst.kind === 'jump' ? 'jumpDust' : burst.kind === 'landing' ? 'landingDust' : burst.kind === 'coin' ? 'coinPickupSparkle' : burst.kind === 'item' ? 'itemPickupSparkle' : burst.kind === 'hurt' ? 'hurtImpact' : burst.kind === 'checkpoint' ? 'checkpointBurst' : 'clearBurst'] : null;
  const dashDisabled = intro || paused || result !== 'playing';
  const dashButtonImage = dashDisabled ? lavaValleyAssets.buttons.dashDisabled : dashing ? lavaValleyAssets.buttons.dashPressed : dashCooldownMs > 0 ? lavaValleyAssets.buttons.dashCooldown : lavaValleyAssets.buttons.dashReady;
  const formatTime = (seconds: number) => String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');

  return <section className={`lava-runner ${stageNumber >= 2 ? `lava-runner--stage-${stageNumber}` : ''} ${bonusRoute ? 'lava-runner--secret-route' : ''} ${paused ? 'lava-runner--paused' : ''} ${dashing ? 'lava-runner--dashing' : ''}`} data-layout={stageNumber === 3 ? 'tall' : 'default'} style={{ '--lava-player-x': `${LAVA_RUNNER_CONFIG.playerX}%`, '--lava-track-bottom': `${LAVA_RUNNER_CONFIG.trackBottom}%`, '--lava-ground-surface-y': `${LAVA_GROUND_TRACK_SURFACE_PERCENT}%`, '--lava-track-duration': `${2.8 * 32 / LAVA_VALLEY_DIFFICULTY[difficulty].runSpeed / (dashing ? LAVA_RUNNER_CONFIG.dashSpeedMultiplier : 1)}s`, '--lava-player-scale': LAVA_VALLEY_DIFFICULTY[difficulty].playerVisualScale, '--lava-obstacle-scale': LAVA_VALLEY_DIFFICULTY[difficulty].obstacleVisualScale } as CSSProperties}>
    <img src={background} alt={stageNumber === 3 ? '화산 심장부' : stageNumber === 2 ? '용암 절벽' : '용암이 흐르는 화산 계곡'} className="lava-runner__background" draggable={false} /><div className="lava-runner__shade" />
    <header className="lava-runner__header"><button type="button" className="lava-runner__exit" onClick={onExit}><ChevronLeft /> 지도</button><div className="lava-runner-hud lava-panel-root"><img className="lava-panel-bg" src={lavaValleyAssets.hud.top} alt="" aria-hidden="true" /><div className="lava-panel-overlay"><span className="lava-runner-hud__health" aria-label={`하트 ${health}개`}>{[0, 1, 2].map((slot) => <i key={slot} className={slot < health ? 'is-filled' : ''}>♥</i>)}</span><b className="lava-runner-hud__coin">{coins}</b><b className="lava-runner-hud__rare">{rareShards}</b><b className="lava-runner-hud__time"><span>{formatTime(timeLeft)}</span><small>{Math.round(progress)}%</small></b></div></div><button type="button" className="lava-runner__settings" onClick={openSettings} aria-label="일시정지 및 설정"><img src={lavaValleyAssets.buttons.pauseSettings} alt="" /></button><div className="lava-runner__progress"><i style={{ width: `${progress}%` }} /><span>Stage {stageNumber} · 구간 {checkpointStage}/2</span></div></header>
    <main ref={playfieldRef} className="lava-runner__playfield"><div className="lava-secret-route-matte" aria-hidden="true" />{gameplay.symbolMission && <FossilCounterVisual count={symbols} bonusLabel={bonusRoute ? `비밀 샛길 · ${Math.min(LAVA_CLIFF_MISSION.routeSeconds, Math.max(0, Math.ceil(missionRef.current.bonusEnd - (gameDuration - timeLeft))))}초` : undefined} />}<div className="lava-runner__track"><div className="lava-runner__track-strip">{[...trackCycle, ...trackCycle].map((src, index) => <img key={index} src={src} alt="" aria-hidden="true" />)}</div><img className="lava-runner__track-cracks" src={lavaValleyAssets.track.crackOverlay} alt="" aria-hidden="true" /><img className="lava-runner__track-edge" src={lavaValleyAssets.track.edgeStrip} alt="" aria-hidden="true" /></div>
      {progress < 12 && <img className="lava-runner-environment lava-runner-environment--warning" src={lavaValleyAssets.environment.warningSign} alt="장애물 주의" />}
      {platforms.map(platform => <div key={platform.id} ref={element => { if (element) platformElementsRef.current.set(platform.id, element); else platformElementsRef.current.delete(platform.id); }} className={`lava-upper-platform lava-upper-platform--${platform.route ?? 'upper'} lava-upper-platform--${platform.behavior ?? 'static'}`} data-crumble={platform.collapsed ? 'collapsed' : platform.crumbleStartedAt !== undefined ? 'warning' : 'stable'} aria-label={platform.behavior === 'moving' ? '움직이는 발판' : platform.behavior === 'crumbling' ? '금이 가는 발판' : platform.route === 'secret' ? '비밀 보너스 길' : '상단 발판'} style={{ width: platform.width + '%', bottom: 'calc(' + (20 + platform.height) + '% + ' + fieldSizeRef.current.footOffset + 'px)', transform: 'translateX(' + (platform.x * fieldSizeRef.current.width / 100) + 'px)' }}>{stageNumber === 3 ? <><img className="lava-core-platform__surface" src={platform.behavior === 'crumbling' ? lavaValleyStage3Assets.crackingPlatform : lavaValleyStage3Assets.floatingPlatform} alt="" aria-hidden="true" /><img className="lava-core-platform__effect" src={lavaValleyStage3Assets.breakingPlatformEffect} alt="" aria-hidden="true" /></> : <UpperTrackVisual />}</div>)}
      {items.map((item) => <div key={item.id} ref={element => { if (element) itemElementsRef.current.set(item.id, element); else itemElementsRef.current.delete(item.id); }}
        className={`lava-runner-item lava-runner-item--${item.kind} ${(item.kind === 'geyser' || item.kind === 'eruption') ? 'lava-runner-item--ground-lava' : ''} ${isCollectible(item.kind) && item.height === LAVA_VALLEY_COLLECTIBLE_LANES.high ? 'lava-runner-item--high' : ''}`}
        data-phase={item.phase} data-open={item.kind === 'secretGate' ? symbols === LAVA_CLIFF_MISSION.symbolCount : undefined}
        data-route={item.route}
        style={{ '--runner-x': '0%', '--runner-y': item.route !== 'lower' ? `calc(${item.height}% + ${fieldSizeRef.current.footOffset}px)` : `${item.height}%`, transform: 'translateX(' + (item.x * fieldSizeRef.current.width / 100) + 'px) translateX(-50%)' } as CSSProperties}>
        {item.kind === 'symbol' ? <FossilFragmentVisual />
          : item.kind === 'secretGate' ? <SecretDoorVisual open={symbols === LAVA_CLIFF_MISSION.symbolCount} />
          : item.kind === 'eruption' ? <div className="lava-cliff-eruption" role="img" aria-label={item.phase === 'warning' ? '용암 분출 예고' : item.phase === 'active' ? '용암 분출 중' : '용암 분출 종료'}><img className="lava-cliff-eruption__warning" src={lavaValleyStage2Assets.lavaWarningMarker} alt="" aria-hidden="true" draggable={false} /><img className="lava-cliff-eruption__active" src={lavaValleyStage2Assets.lavaEruption} alt="" aria-hidden="true" draggable={false} /></div>
          : item.kind === 'bonusChest' ? <img className="lava-cliff-bonus-chest" src={bonusChestOpen ? lavaValleyStage2Assets.bonusChestOpen : lavaValleyStage2Assets.bonusChestClosed} alt={bonusChestOpen ? '열린 비밀 보너스 상자' : '닫힌 비밀 보너스 상자'} draggable={false} />
          : item.kind === 'finalTreasure' ? <button type="button" className="lava-core-final-treasure-button" disabled={finalChestPhase !== 'closed'} onClick={openFinalChest} aria-label={finalChestPhase === 'closed' ? '최종 보물상자 열기' : '열린 최종 보물상자'}><img className="lava-core-final-treasure" src={finalChestPhase === 'open' ? lavaValleyStage3Assets.treasureChestOpen : lavaValleyStage3Assets.treasureChestClosed} alt="" draggable={false} />{finalChestPhase === 'opening' && <img className="lava-core-final-treasure-effect" src={lavaValleyStage3Assets.treasureOpenEffect} alt="" aria-hidden="true" />}</button>
          : <img src={itemImage(item)} alt={item.kind === 'rock' ? '바위 장애물' : item.kind === 'geyser' ? '용암 분출 장애물' : item.kind === 'coin' ? '공룡 코인' : item.kind === 'health_restore' ? '생명력 회복' : item.kind === 'shopItem' ? (item.label ?? '상점 아이템') + ' 보상' : item.kind === 'shard' ? '희귀 알 조각' : '체크포인트 깃발'} draggable={false} onError={(event) => { if (isObstacle(item.kind)) { invalidObstacleIdsRef.current.add(item.id); event.currentTarget.closest('.lava-runner-item')?.remove(); if (import.meta.env.DEV) console.warn(`[Lava Valley] obstacle asset skipped: ${item.kind}`); } }} />}
      </div>)}
      <div ref={playerMotionRef} className="lava-player-motion"><LavaValleyPlayer intro={intro} invincible={invincible} jumping={jumping} jumpY={0} rising={rising} success={result === 'success'} /></div>
      <div className="lava-runner-speed-lines" aria-hidden="true"><i /><i /><i /></div>
      <img className={`lava-runner-ground-shadow ${jumping ? 'is-jumping' : ''} ${dashing ? 'is-dashing' : ''}`} src={lavaValleyAssets.effects.dinosaurContactShadow} alt="" aria-hidden="true" />
      {burst && burstImage && <img key={burst.id} className={`lava-runner-burst lava-runner-burst--${burst.kind}`} style={{ left: `${burst.x}%`, bottom: `${burst.y}%` }} src={burstImage} alt="" aria-hidden="true" onAnimationEnd={() => setBurst((current) => current?.id === burst.id ? null : current)} />}
      {pickupFeedback && <div key={pickupFeedback.id} className={`lava-runner-pickup lava-runner-pickup--${pickupFeedback.kind}`} role="status">{pickupFeedback.label}</div>}
      {speech && <div className="lava-runner-speech lava-panel-root"><img className="lava-panel-bg" src={lavaValleyAssets.events.speechBubble} alt="" /><div className="lava-panel-overlay"><span className="lava-runner-speech__text">{speech}</span></div></div>}
      {combo && <div className="lava-runner-combo"><img src={lavaValleyAssets.events.comboPopup} alt="" /><b>3 콤보!</b></div>}
      {result === 'success' && !showResult && <div className="lava-runner-finish"><img className="lava-runner-finish__gate" src={lavaValleyAssets.environment.raceGateArch} alt="도착 지점" /><img className="lava-runner-finish__portal" src={lavaValleyAssets.environment.goalPortal} alt="클리어 포털" />{stageNumber === 1 && <img className="lava-runner-finish__chest" src={finishStep < 2 ? lavaValleyAssets.environment.treasureChestClosed : lavaValleyAssets.environment.treasureChestOpen} alt="보물 상자" />}</div>}
    </main>
    <footer className="lava-runner__controls"><button type="button" className={`lava-runner__dash ${dashing ? 'is-active' : ''}`} disabled={dashCooldownMs > 0 || dashDisabled} onPointerDown={(event) => { event.preventDefault(); dash(); }} aria-label={dashing ? '대시 중' : dashCooldownMs > 0 ? `대시 재사용까지 ${(dashCooldownMs / 1000).toFixed(1)}초` : '대시'}><img src={dashButtonImage} alt="" draggable={false} /><small aria-hidden="true">{!dashing && dashCooldownMs > 0 ? `${(dashCooldownMs / 1000).toFixed(1)}초` : ''}</small></button><button type="button" className={`lava-runner__jump ${jumpGuideActive ? 'lava-runner__jump--guide' : ''}`} onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setJumpPressed(true); jump(); }} onPointerUp={() => setJumpPressed(false)} onPointerCancel={() => setJumpPressed(false)} onPointerLeave={() => setJumpPressed(false)} aria-label="점프"><img src={jumpPressed ? lavaValleyAssets.buttons.jumpPressed : lavaValleyAssets.buttons.jumpNormal} alt="" /></button></footer>
    {!assetsReady && <div className="lava-runner-loading" role="status">모험 준비 중...</div>}
    {assetsReady && intro && <AdventureStageIntro config={introConfig} onStart={beginRun} />}
    {paused && !externalMainModalOpen && <div className="lava-runner-modal"><section role="dialog" aria-modal="true" aria-label="용암계곡 일시정지" className="lava-runner-pause-panel"><img src={lavaValleyAssets.events.pauseMenu} alt="PAUSE" /><div><button type="button" onClick={closeSettings}>계속하기</button><button type="button" onClick={() => onRetry(true)}>처음부터</button><button type="button" onClick={onExit}>지도</button></div><fieldset><legend>난이도</legend>{([['normal','기본'],['hard','어려움']] as const).map(([value,label]) => { const unlocked = isAdventureDifficultyUnlocked('lavaValley', stageNumber, value, relicPartCount); return <button type="button" key={value} disabled={!unlocked} aria-pressed={difficulty === value} onClick={() => chooseDifficulty(value)}>{label}{!unlocked ? ' (유물 부품 필요)' : ''}</button>; })}</fieldset></section></div>}
    {showResult && !externalMainModalOpen && <div className="lava-runner-modal lava-result-modal"><section role="dialog" aria-modal="true" aria-label={result === 'success' ? '용암계곡 탐험 완료' : '도전 실패'} className={`lava-result-panel ${result === 'failure' ? 'lava-result-panel--failure' : ''}`}>{result === 'success' ? <><div className="lava-result-panel__frame lava-panel-root"><img className="lava-panel-bg" src={lavaValleyAssets.events.resultClear} alt="CLEAR" /><div className="lava-panel-overlay lava-result-reward-overlay"><b className="lava-result-coin-value">+{committedRewards?.coins ?? 0}</b><b className="lava-result-fragment-value">+{committedRewards?.rareFragments ?? 0}</b></div></div>{committedRewards?.secretChestBonus && <div className="lava-secret-bonus-summary"><strong>비밀상자 보너스</strong><span>코인 +{committedRewards.secretChestBonus.coins}</span><span>희귀조각 +{committedRewards.secretChestBonus.rareFragments}</span>{committedRewards.secretChestBonus.shopItems.map(reward => <span key={reward.itemId}>{getItemConfig(reward.itemId)?.name ?? reward.itemId} +{reward.quantity}</span>)}</div>}{committedRewards?.finalChestBonus && <div className="lava-final-chest-summary"><strong>최종 보물상자</strong><span>코인 +{committedRewards.finalChestBonus.coins}</span><span>희귀조각 +{committedRewards.finalChestBonus.rareFragments}</span>{committedRewards.finalChestBonus.shopItems.map(reward => <span key={reward.itemId}>{getItemConfig(reward.itemId)?.name ?? reward.itemId} +{reward.quantity}</span>)}{committedRewards.relicOutcome && <div className={`lava-relic-result ${committedRewards.relicOutcome.acquired ? 'is-acquired' : ''}`}>{committedRewards.relicOutcome.partImage ? <img src={committedRewards.relicOutcome.partImage} alt={committedRewards.relicOutcome.partName ?? '용암계곡 유물 부품'} /> : <Gem aria-label="용암계곡 유물 부품" />}<span>{committedRewards.relicOutcome.acquired ? `${committedRewards.relicOutcome.partName}을(를) 찾았어요! · 용암계곡` : committedRewards.relicOutcome.ownedPartCount >= committedRewards.relicOutcome.goal ? '유물 부품 5종을 모두 찾았어요!' : '이번에는 유물 부품을 발견하지 못했어요. 다음에 다시 찾아봐요!'}<b>{committedRewards.relicOutcome.ownedPartCount} / {committedRewards.relicOutcome.goal}</b></span></div>}</div>}<div className="lava-result-item-box"><strong className="lava-result-item-title">획득 아이템</strong>{committedRewards?.shopItems.length ? <div className="lava-result-item-list">{committedRewards.shopItems.slice(0, 2).map((reward) => { const item = getItemConfig(reward.itemId); return <div className="lava-result-item-row" key={reward.itemId}><img src={shopItemImages[reward.itemId]} alt="" /><span>{item?.name ?? reward.itemId}</span><b>x{reward.quantity}</b></div>; })}{committedRewards.shopItems.length > 2 && <small>외 {committedRewards.shopItems.length - 2}종</small>}</div> : <p className="lava-result-item-empty">이번 판에는 추가 아이템이 없어요</p>}</div>{committedRewards?.relicOutcome?.newlyCompleted && <p className="lava-relic-restored" role="status">화산지대의 유물이 복원되었어요!</p>}</> : <div className="lava-result-failure-copy"><h2>아쉽다! 다시 도전해볼까?</h2><p>이번 보상은 저장되지 않았어요. 무료로 다시 연습할 수 있어요!</p></div>}<div className="lava-result-actions"><button type="button" onClick={result === 'success' ? onRetry : () => restartCurrentSession('hp_depleted')}><RotateCcw /> {result === 'success' ? '한 번 더' : '다시 도전'}</button><button type="button" onClick={onExit}>지도</button></div></section></div>}
  </section>;
}
