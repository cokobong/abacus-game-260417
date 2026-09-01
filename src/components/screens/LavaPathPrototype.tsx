import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, RotateCcw, Settings, X } from 'lucide-react';
import { lavaValleyAssets } from '../../assets/adventure/lava-valley';
import { getDinosaurSpecies } from '../../data/dinosaurSpecies';
import type { OwnedDinosaur } from '../../types/game';
import { getDinosaurImageForGrowthStage, getGrowthStageForLevel } from '../../utils/dinosaurGrowth';

export const LAVA_RUNNER_CONFIG = { gameDuration: 45, collectibleIntervalMin: 2600, collectibleIntervalMax: 3900, invincibleMs: 1400, playerX: 27, trackBottom: 12, maxObstacles: 2, checkpointProgress: .5 } as const;
export const LAVA_VALLEY_DIFFICULTY = {
  easy: { runSpeed: 26.5, obstacleSpawnIntervalMin: 3100, obstacleSpawnIntervalMax: 4400, jumpVelocity: 104, gravity: 205, playerHitboxScale: .68, obstacleHitboxScale: .72, coyoteTimeMs: 180, jumpBufferMs: 180, geyserChance: .18 },
  normal: { runSpeed: 32, obstacleSpawnIntervalMin: 2400, obstacleSpawnIntervalMax: 3600, jumpVelocity: 98, gravity: 230, playerHitboxScale: .76, obstacleHitboxScale: .78, coyoteTimeMs: 110, jumpBufferMs: 110, geyserChance: .35 },
  challenge: { runSpeed: 36, obstacleSpawnIntervalMin: 2100, obstacleSpawnIntervalMax: 3100, jumpVelocity: 96, gravity: 240, playerHitboxScale: .84, obstacleHitboxScale: .88, coyoteTimeMs: 70, jumpBufferMs: 70, geyserChance: .5 },
} as const;

type ObstacleKind = 'rock' | 'geyser';
type CollectibleKind = 'coin' | 'meat' | 'shard';
type RunnerItemKind = ObstacleKind | CollectibleKind | 'checkpoint';
type RunnerItem = { id: number; kind: RunnerItemKind; x: number; height: number };
type Result = 'playing' | 'success' | 'failure';
type Difficulty = keyof typeof LAVA_VALLEY_DIFFICULTY;
type PickupFeedback = { id: number; kind: CollectibleKind | 'checkpoint'; label: string };
const COIN_PATTERNS = [[4, 4, 4], [4, 10, 16, 10, 4], [4, 9, 14]] as const;
const OBSTACLE_CLEARANCE: Record<ObstacleKind, number> = { rock: 6.5, geyser: 9 };
const OBSTACLE_WIDTH: Record<ObstacleKind, number> = { rock: 7, geyser: 6 };
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const isObstacle = (kind: RunnerItemKind): kind is ObstacleKind => kind === 'rock' || kind === 'geyser';
const isCollectible = (kind: RunnerItemKind): kind is CollectibleKind => kind === 'coin' || kind === 'meat' || kind === 'shard';

export interface LavaPathPrototypeProps { dinosaur: OwnedDinosaur; onExit: () => void }
export function LavaPathPrototype({ dinosaur, onExit }: LavaPathPrototypeProps) {
  const [items, setItems] = useState<RunnerItem[]>([]);
  const [coins, setCoins] = useState(0), [rareShards, setRareShards] = useState(0), [health, setHealth] = useState(3), [timeLeft, setTimeLeft] = useState(LAVA_RUNNER_CONFIG.gameDuration);
  const [jumping, setJumping] = useState(false), [jumpY, setJumpY] = useState(0), [invincible, setInvincible] = useState(false), [paused, setPaused] = useState(false), [result, setResult] = useState<Result>('playing'), [runId, setRunId] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal'), [checkpointStage, setCheckpointStage] = useState<1 | 2>(1), [pickupFeedback, setPickupFeedback] = useState<PickupFeedback | null>(null);
  const itemsRef = useRef<RunnerItem[]>([]), healthRef = useRef(3), resultRef = useRef<Result>('playing'), jumpingRef = useRef(false), invincibleUntilRef = useRef(0), pausedRef = useRef(false);
  const startTimeRef = useRef(performance.now()), lastFrameRef = useRef(0), nextObstacleRef = useRef(0), nextCollectibleRef = useRef(0), nextIdRef = useRef(1), pauseStartedRef = useRef(0), checkpointSpawnedRef = useRef(false), checkpointPassedRef = useRef(false);
  const jumpYRef = useRef(0), jumpVelocityRef = useRef(0), difficultyRef = useRef<Difficulty>('normal'), lastGroundedAtRef = useRef(performance.now()), jumpBufferedUntilRef = useRef(0), hasJumpedSinceGroundRef = useRef(false);
  const species = getDinosaurSpecies(dinosaur.speciesId);
  const dinosaurImage = useMemo(() => getDinosaurImageForGrowthStage(species?.images, getGrowthStageForLevel(dinosaur.level), species?.characterAsset), [dinosaur.level, species]);

  const showFeedback = useCallback((kind: PickupFeedback['kind'], label: string) => { const feedback = { id: nextIdRef.current++, kind, label }; setPickupFeedback(feedback); window.setTimeout(() => setPickupFeedback((current) => current?.id === feedback.id ? null : current), 850); }, []);
  const startJump = useCallback(() => { const preset = LAVA_VALLEY_DIFFICULTY[difficultyRef.current]; jumpingRef.current = true; hasJumpedSinceGroundRef.current = true; jumpBufferedUntilRef.current = 0; jumpVelocityRef.current = preset.jumpVelocity; setJumping(true); }, []);
  const jump = useCallback(() => { if (resultRef.current !== 'playing' || pausedRef.current) return; const now = performance.now(), preset = LAVA_VALLEY_DIFFICULTY[difficultyRef.current]; const canUseCoyoteTime = !hasJumpedSinceGroundRef.current && now - lastGroundedAtRef.current <= preset.coyoteTimeMs; if (!jumpingRef.current || canUseCoyoteTime) { startJump(); return; } jumpBufferedUntilRef.current = now + preset.jumpBufferMs; }, [startJump]);
  const openSettings = () => { if (resultRef.current !== 'playing') return; pauseStartedRef.current = performance.now(); pausedRef.current = true; setPaused(true); };
  const closeSettings = () => { const pausedFor = performance.now() - pauseStartedRef.current; startTimeRef.current += pausedFor; nextObstacleRef.current += pausedFor; nextCollectibleRef.current += pausedFor; invincibleUntilRef.current += pausedFor; lastFrameRef.current = performance.now(); pausedRef.current = false; setPaused(false); };
  const chooseDifficulty = (next: Difficulty) => { difficultyRef.current = next; setDifficulty(next); const preset = LAVA_VALLEY_DIFFICULTY[next]; nextObstacleRef.current = pauseStartedRef.current + randomBetween(preset.obstacleSpawnIntervalMin, preset.obstacleSpawnIntervalMax); };
  const finish = (next: Result) => { resultRef.current = next; itemsRef.current = []; setItems([]); setResult(next); };
  const reset = useCallback(() => { itemsRef.current = []; healthRef.current = 3; resultRef.current = 'playing'; jumpingRef.current = false; jumpYRef.current = 0; jumpVelocityRef.current = 0; invincibleUntilRef.current = 0; pausedRef.current = false; jumpBufferedUntilRef.current = 0; hasJumpedSinceGroundRef.current = false; checkpointSpawnedRef.current = false; checkpointPassedRef.current = false; startTimeRef.current = performance.now(); lastFrameRef.current = 0; nextObstacleRef.current = 0; nextCollectibleRef.current = 0; setItems([]); setCoins(0); setRareShards(0); setHealth(3); setTimeLeft(LAVA_RUNNER_CONFIG.gameDuration); setJumping(false); setJumpY(0); setInvincible(false); setPaused(false); setResult('playing'); setCheckpointStage(1); setPickupFeedback(null); setRunId((value) => value + 1); }, []);

  useEffect(() => { const keyDown = (event: KeyboardEvent) => { if ((event.code === 'Space' || event.code === 'ArrowUp') && !event.repeat) { event.preventDefault(); jump(); } }; window.addEventListener('keydown', keyDown); return () => window.removeEventListener('keydown', keyDown); }, [jump]);
  useEffect(() => {
    let frame = 0;
    const spawnObstacle = (now: number, preset: typeof LAVA_VALLEY_DIFFICULTY[Difficulty]) => { const count = itemsRef.current.filter((item) => isObstacle(item.kind)).length, spawnAreaBusy = itemsRef.current.some((item) => !isObstacle(item.kind) && item.x > 78); if (count < LAVA_RUNNER_CONFIG.maxObstacles && !spawnAreaBusy) { const kind: ObstacleKind = Math.random() < preset.geyserChance ? 'geyser' : 'rock'; itemsRef.current.push({ id: nextIdRef.current++, kind, x: 110, height: 0 }); } nextObstacleRef.current = now + randomBetween(preset.obstacleSpawnIntervalMin, preset.obstacleSpawnIntervalMax); };
    const spawnCollectible = (now: number) => { const spawnAreaBusy = itemsRef.current.some((item) => isObstacle(item.kind) && item.x > 82), specialOnScreen = itemsRef.current.some((item) => item.kind === 'meat' || item.kind === 'shard'); if (!spawnAreaBusy) { const roll = Math.random(); if (!specialOnScreen && roll < .06) itemsRef.current.push({ id: nextIdRef.current++, kind: 'shard', x: 110, height: 12 }); else if (!specialOnScreen && roll < .16) itemsRef.current.push({ id: nextIdRef.current++, kind: 'meat', x: 110, height: 8 }); else { const pattern = COIN_PATTERNS[Math.floor(Math.random() * COIN_PATTERNS.length)]; pattern.forEach((height, index) => itemsRef.current.push({ id: nextIdRef.current++, kind: 'coin', x: 108 + index * 7, height })); } } nextCollectibleRef.current = now + randomBetween(LAVA_RUNNER_CONFIG.collectibleIntervalMin, LAVA_RUNNER_CONFIG.collectibleIntervalMax); };
    const spawnCheckpoint = () => { checkpointSpawnedRef.current = true; itemsRef.current.push({ id: nextIdRef.current++, kind: 'checkpoint', x: 112, height: 0 }); };
    const tick = (now: number) => {
      if (pausedRef.current) { lastFrameRef.current = now; frame = requestAnimationFrame(tick); return; }
      const preset = LAVA_VALLEY_DIFFICULTY[difficultyRef.current], elapsedMs = now - startTimeRef.current, remaining = Math.max(0, Math.ceil(LAVA_RUNNER_CONFIG.gameDuration - elapsedMs / 1000)); setTimeLeft(remaining);
      if (!remaining) { finish('success'); return; }
      const delta = Math.min((now - (lastFrameRef.current || now)) / 1000, .04); lastFrameRef.current = now; setInvincible(now < invincibleUntilRef.current);
      if (jumpingRef.current) { jumpVelocityRef.current -= preset.gravity * delta; jumpYRef.current += jumpVelocityRef.current * delta; if (jumpYRef.current <= 0) { jumpYRef.current = 0; jumpVelocityRef.current = 0; jumpingRef.current = false; hasJumpedSinceGroundRef.current = false; lastGroundedAtRef.current = now; setJumping(false); if (now <= jumpBufferedUntilRef.current) startJump(); } setJumpY(jumpYRef.current); } else { lastGroundedAtRef.current = now; hasJumpedSinceGroundRef.current = false; }
      if (now >= nextObstacleRef.current) spawnObstacle(now, preset);
      if (now >= nextCollectibleRef.current) spawnCollectible(now);
      if (!checkpointSpawnedRef.current && elapsedMs >= LAVA_RUNNER_CONFIG.gameDuration * 1000 * LAVA_RUNNER_CONFIG.checkpointProgress && !itemsRef.current.some((item) => isObstacle(item.kind) && item.x > 72)) spawnCheckpoint();
      itemsRef.current = itemsRef.current.map((item) => ({ ...item, x: item.x - preset.runSpeed * delta })).filter((item) => item.x > -15);
      const removed = new Set<number>();
      for (const item of itemsRef.current) {
        if (item.kind === 'checkpoint') { if (!checkpointPassedRef.current && item.x <= LAVA_RUNNER_CONFIG.playerX) { checkpointPassedRef.current = true; setCheckpointStage(2); showFeedback('checkpoint', '체크포인트!'); } continue; }
        if (isCollectible(item.kind)) { if (Math.abs(item.x - LAVA_RUNNER_CONFIG.playerX) <= 6 && Math.abs(jumpYRef.current - item.height) <= 8) { removed.add(item.id); if (item.kind === 'coin') { setCoins((value) => value + 1); showFeedback('coin', '+1'); } if (item.kind === 'meat') { if (healthRef.current < 3) { healthRef.current += 1; setHealth(healthRef.current); showFeedback('meat', '하트 회복!'); } else { setCoins((value) => value + 3); showFeedback('meat', '보너스 +3'); } } if (item.kind === 'shard') { setRareShards((value) => value + 1); showFeedback('shard', '희귀 조각 획득!'); } } continue; }
        const collisionDistance = (10 * preset.playerHitboxScale + OBSTACLE_WIDTH[item.kind] * preset.obstacleHitboxScale) / 2;
        if (Math.abs(item.x - LAVA_RUNNER_CONFIG.playerX) <= collisionDistance && jumpYRef.current < OBSTACLE_CLEARANCE[item.kind] && now >= invincibleUntilRef.current) { removed.add(item.id); healthRef.current -= 1; setHealth(healthRef.current); invincibleUntilRef.current = now + LAVA_RUNNER_CONFIG.invincibleMs; setInvincible(true); if (healthRef.current <= 0) { finish('failure'); return; } }
      }
      itemsRef.current = itemsRef.current.filter((item) => !removed.has(item.id)); setItems([...itemsRef.current]); if (resultRef.current === 'playing') frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [runId, showFeedback, startJump]);

  const progress = ((LAVA_RUNNER_CONFIG.gameDuration - timeLeft) / LAVA_RUNNER_CONFIG.gameDuration) * 100, trackAssets = Array.from({ length: 8 }, () => lavaValleyAssets.platforms.default);
  const itemImage = (kind: RunnerItemKind) => kind === 'rock' ? lavaValleyAssets.obstacles.rock : kind === 'geyser' ? lavaValleyAssets.obstacles.geyser : kind === 'coin' ? lavaValleyAssets.collectibles.coin : kind === 'meat' ? lavaValleyAssets.collectibles.meat : kind === 'shard' ? lavaValleyAssets.collectibles.rareEggShard : lavaValleyAssets.checkpoint;
  return <section className={`lava-runner ${paused ? 'lava-runner--paused' : ''}`} style={{ '--lava-player-x': `${LAVA_RUNNER_CONFIG.playerX}%`, '--lava-track-bottom': `${LAVA_RUNNER_CONFIG.trackBottom}%`, '--lava-track-duration': `${2.8 * 32 / LAVA_VALLEY_DIFFICULTY[difficulty].runSpeed}s` } as CSSProperties}>
    <img src={lavaValleyAssets.runnerBackground} alt="용암이 흐르는 화산 계곡" className="lava-runner__background" draggable={false} /><div className="lava-runner__shade" />
    <header className="lava-runner__header"><button type="button" className="lava-runner__exit" onClick={onExit}><ChevronLeft /> 지도</button><div className="lava-runner__title"><h1>용암계곡</h1><p>달리며 점프해서 용암을 피하세요!</p></div><div className="lava-runner__hud"><span aria-label={`하트 ${health}개`}>{'❤️'.repeat(health)}<i>{'♡'.repeat(3 - health)}</i></span><b>🪙 {coins}　💎 {rareShards}</b></div><button type="button" className="lava-runner__settings" onClick={openSettings} aria-label="용암계곡 설정"><Settings /></button><div className="lava-runner__progress"><i style={{ width: `${progress}%` }} /><span>탐험 {checkpointStage}/2 · {timeLeft}초</span></div></header>
    <main className="lava-runner__playfield"><div className="lava-runner__track"><div className="lava-runner__track-strip">{[...trackAssets,...trackAssets].map((src,index) => <img key={index} src={src} alt="" aria-hidden="true" />)}</div></div>
      {items.map((item) => <div key={item.id} className={`lava-runner-item lava-runner-item--${item.kind}`} style={{ '--runner-x': `${item.x}%`, '--runner-y': `${item.height}%` } as CSSProperties}><img src={itemImage(item.kind)} alt={item.kind === 'rock' ? '바위 장애물' : item.kind === 'geyser' ? '용암 분출 장애물' : item.kind === 'coin' ? '공룡 코인' : item.kind === 'meat' ? '회복 고기' : item.kind === 'shard' ? '희귀 알 조각' : '체크포인트 깃발'} draggable={false} /></div>)}
      <div className={`lava-runner__dino ${jumping ? 'lava-runner__dino--jump' : ''} ${invincible ? 'lava-runner__dino--hit' : ''}`} style={{ '--lava-jump-y': `${jumpY}%` } as CSSProperties}>{jumping && <img className="lava-runner__jump-dust" src={lavaValleyAssets.effects.jumpTakeoffDust} alt="" aria-hidden="true" />}{dinosaurImage ? <img src={dinosaurImage} alt={`${dinosaur.name} 달리기`} draggable={false} /> : <span>🦖</span>}<img className="lava-runner__shadow" src={lavaValleyAssets.effects.dinosaurContactShadow} alt="" aria-hidden="true" /></div>
      {pickupFeedback && <div key={pickupFeedback.id} className={`lava-runner-pickup lava-runner-pickup--${pickupFeedback.kind}`} role="status">{pickupFeedback.label}</div>}
    </main>
    <footer className="lava-runner__controls"><button type="button" className="lava-runner__dash" disabled>대시<small>준비 중</small></button><button type="button" className="lava-runner__jump" onClick={jump}>점프! <b>⬆</b></button></footer>
    {paused && <div className="lava-runner-modal"><section role="dialog" aria-modal="true" aria-labelledby="lava-runner-settings-title" className="lava-runner-settings-panel"><div><h2 id="lava-runner-settings-title">용암계곡 설정</h2><button type="button" onClick={closeSettings} aria-label="설정 닫기"><X /></button></div><fieldset><legend>난이도</legend>{([['easy','쉬움'],['normal','보통'],['challenge','도전']] as const).map(([value,label]) => <button type="button" key={value} aria-pressed={difficulty === value} onClick={() => chooseDifficulty(value)}><i aria-hidden="true" /><b>{label}</b></button>)}</fieldset><button type="button" className="lava-runner-settings-resume" onClick={closeSettings}>게임으로 돌아가기</button></section></div>}
    {result !== 'playing' && <div className="lava-runner-modal"><section role="dialog" aria-modal="true"><h2>{result === 'success' ? '용암계곡 탐험 성공!' : '앗, 용암길이 너무 뜨거웠어요!'}</h2><p>모은 코인 <b>{coins}</b>개 · 희귀 조각 <b>{rareShards}</b>개</p><div className="lava-runner-modal__actions"><button type="button" onClick={reset}><RotateCcw /> 다시 하기</button><button type="button" onClick={onExit}>탐험 지도로</button></div></section></div>}
  </section>;
}
