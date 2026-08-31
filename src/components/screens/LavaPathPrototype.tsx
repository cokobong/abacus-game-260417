import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, RotateCcw, Settings, X } from 'lucide-react';
import { lavaValleyAssets } from '../../assets/adventure/lava-valley';
import { getDinosaurSpecies } from '../../data/dinosaurSpecies';
import type { OwnedDinosaur } from '../../types/game';
import { getDinosaurImageForGrowthStage, getGrowthStageForLevel } from '../../utils/dinosaurGrowth';

export const LAVA_RUNNER_CONFIG = {
  gameDuration: 45,
  runSpeed: 32,
  jumpVelocity: 98,
  gravity: 230,
  obstacleSpawnIntervalMin: 2400,
  obstacleSpawnIntervalMax: 3600,
  playerHitboxScale: .78,
  obstacleHitboxScale: .8,
  coinIntervalMin: 1200,
  coinIntervalMax: 2100,
  invincibleMs: 1400,
  playerX: 27,
  trackBottom: 12,
} as const;

type RunnerItemKind = 'rock' | 'flame' | 'coin' | 'reward';
type RunnerItem = { id: number; kind: RunnerItemKind; x: number; airborne: boolean };
type Result = 'playing' | 'success' | 'failure';
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

export interface LavaPathPrototypeProps { dinosaur: OwnedDinosaur; onExit: () => void }
export function LavaPathPrototype({ dinosaur, onExit }: LavaPathPrototypeProps) {
  const [items, setItems] = useState<RunnerItem[]>([]), [coins, setCoins] = useState(0), [health, setHealth] = useState(3), [timeLeft, setTimeLeft] = useState(LAVA_RUNNER_CONFIG.gameDuration);
  const [jumping, setJumping] = useState(false), [jumpY, setJumpY] = useState(0), [invincible, setInvincible] = useState(false), [paused, setPaused] = useState(false), [result, setResult] = useState<Result>('playing'), [runId, setRunId] = useState(0);
  const itemsRef = useRef<RunnerItem[]>([]), healthRef = useRef(3), resultRef = useRef<Result>('playing'), jumpingRef = useRef(false), invincibleUntilRef = useRef(0), pausedRef = useRef(false);
  const startTimeRef = useRef(performance.now()), lastFrameRef = useRef(0), nextObstacleRef = useRef(0), nextCoinRef = useRef(0), nextIdRef = useRef(1), pauseStartedRef = useRef(0);
  const jumpYRef = useRef(0), jumpVelocityRef = useRef(0);
  const species = getDinosaurSpecies(dinosaur.speciesId);
  const dinosaurImage = useMemo(() => getDinosaurImageForGrowthStage(species?.images, getGrowthStageForLevel(dinosaur.level), species?.characterAsset), [dinosaur.level, species]);

  const jump = useCallback(() => {
    if (resultRef.current !== 'playing' || pausedRef.current || jumpingRef.current) return;
    jumpingRef.current = true; jumpVelocityRef.current = LAVA_RUNNER_CONFIG.jumpVelocity; setJumping(true);
  }, []);
  const openSettings = () => { if (resultRef.current !== 'playing') return; pauseStartedRef.current = performance.now(); pausedRef.current = true; setPaused(true); };
  const closeSettings = () => { const pausedFor = performance.now() - pauseStartedRef.current; startTimeRef.current += pausedFor; nextObstacleRef.current += pausedFor; nextCoinRef.current += pausedFor; invincibleUntilRef.current += pausedFor; lastFrameRef.current = performance.now(); pausedRef.current = false; setPaused(false); };
  const finish = (next: Result) => { resultRef.current = next; itemsRef.current = []; setItems([]); setResult(next); };
  const reset = useCallback(() => {
    itemsRef.current = []; healthRef.current = 3; resultRef.current = 'playing'; jumpingRef.current = false; jumpYRef.current = 0; jumpVelocityRef.current = 0; invincibleUntilRef.current = 0; pausedRef.current = false;
    startTimeRef.current = performance.now(); lastFrameRef.current = 0; nextObstacleRef.current = 0; nextCoinRef.current = 0;
    setItems([]); setCoins(0); setHealth(3); setTimeLeft(LAVA_RUNNER_CONFIG.gameDuration); setJumping(false); setJumpY(0); setInvincible(false); setPaused(false); setResult('playing'); setRunId((value) => value + 1);
  }, []);

  useEffect(() => { const keyDown = (event: KeyboardEvent) => { if ((event.code === 'Space' || event.code === 'ArrowUp') && !event.repeat) { event.preventDefault(); jump(); } }; window.addEventListener('keydown', keyDown); return () => window.removeEventListener('keydown', keyDown); }, [jump]);
  useEffect(() => {
    let frame = 0;
    const tick = (now: number) => {
      if (pausedRef.current) { lastFrameRef.current = now; frame = requestAnimationFrame(tick); return; }
      const remaining = Math.max(0, Math.ceil(LAVA_RUNNER_CONFIG.gameDuration - (now - startTimeRef.current) / 1000)); setTimeLeft(remaining);
      if (!remaining) { finish('success'); return; }
      const delta = Math.min((now - (lastFrameRef.current || now)) / 1000, .04); lastFrameRef.current = now; setInvincible(now < invincibleUntilRef.current);
      if (jumpingRef.current) { jumpVelocityRef.current -= LAVA_RUNNER_CONFIG.gravity * delta; jumpYRef.current += jumpVelocityRef.current * delta; if (jumpYRef.current <= 0) { jumpYRef.current = 0; jumpVelocityRef.current = 0; jumpingRef.current = false; setJumping(false); } setJumpY(jumpYRef.current); }
      if (now >= nextObstacleRef.current) { nextObstacleRef.current = now + randomBetween(LAVA_RUNNER_CONFIG.obstacleSpawnIntervalMin, LAVA_RUNNER_CONFIG.obstacleSpawnIntervalMax); const kinds: RunnerItemKind[] = ['rock','flame']; itemsRef.current.push({ id: nextIdRef.current++, kind: kinds[Math.floor(Math.random() * kinds.length)], x: 110, airborne: false }); }
      if (now >= nextCoinRef.current) { nextCoinRef.current = now + randomBetween(LAVA_RUNNER_CONFIG.coinIntervalMin, LAVA_RUNNER_CONFIG.coinIntervalMax); itemsRef.current.push({ id: nextIdRef.current++, kind: Math.random() < .18 ? 'reward' : 'coin', x: 108, airborne: Math.random() < .55 }); }
      itemsRef.current = itemsRef.current.map((item) => ({ ...item, x: item.x - LAVA_RUNNER_CONFIG.runSpeed * delta })).filter((item) => item.x > -12);
      const collisionDistance = (10 * LAVA_RUNNER_CONFIG.playerHitboxScale + 7 * LAVA_RUNNER_CONFIG.obstacleHitboxScale) / 2;
      const collided = itemsRef.current.filter((item) => Math.abs(item.x - LAVA_RUNNER_CONFIG.playerX) <= collisionDistance);
      const removed = new Set<number>();
      collided.forEach((item) => {
        if (item.kind === 'coin' || item.kind === 'reward') { if (!item.airborne || jumpYRef.current >= 7) { removed.add(item.id); setCoins((value) => value + (item.kind === 'reward' ? 5 : 1)); } return; }
        if (jumpYRef.current < 5 && now >= invincibleUntilRef.current) { removed.add(item.id); healthRef.current -= 1; setHealth(healthRef.current); invincibleUntilRef.current = now + LAVA_RUNNER_CONFIG.invincibleMs; setInvincible(true); if (healthRef.current <= 0) finish('failure'); }
      });
      itemsRef.current = itemsRef.current.filter((item) => !removed.has(item.id)); setItems([...itemsRef.current]);
      if (resultRef.current === 'playing') frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [runId]);

  const progress = ((LAVA_RUNNER_CONFIG.gameDuration - timeLeft) / LAVA_RUNNER_CONFIG.gameDuration) * 100;
  const trackAssets = Array.from({ length: 8 }, () => lavaValleyAssets.platforms.default);
  return <section className="lava-runner" style={{ '--lava-player-x': `${LAVA_RUNNER_CONFIG.playerX}%`, '--lava-track-bottom': `${LAVA_RUNNER_CONFIG.trackBottom}%` } as CSSProperties}>
    <img src={lavaValleyAssets.runnerBackground} alt="용암이 흐르는 화산 계곡" className="lava-runner__background" draggable={false} /><div className="lava-runner__shade" />
    <header className="lava-runner__header"><button type="button" className="lava-runner__exit" onClick={onExit}><ChevronLeft /> 지도</button><div className="lava-runner__title"><h1>용암계곡</h1><p>달리며 점프해서 용암을 피하세요!</p></div><div className="lava-runner__hud"><span aria-label={`하트 ${health}개`}>{'❤️'.repeat(health)}<i>{'♡'.repeat(3 - health)}</i></span><b>🪙 {coins}</b></div><button type="button" className="lava-runner__settings" onClick={openSettings} aria-label="용암계곡 설정"><Settings /></button><div className="lava-runner__progress"><i style={{ width: `${progress}%` }} /><span>{timeLeft}초</span></div></header>
    <main className="lava-runner__playfield">
      <div className="lava-runner__track"><div className="lava-runner__track-strip">{[...trackAssets,...trackAssets].map((src,index) => <img key={index} src={src} alt="" aria-hidden="true" />)}</div></div>
      {items.map((item) => <div key={item.id} className={`lava-runner-item lava-runner-item--${item.kind} ${item.airborne ? 'lava-runner-item--airborne' : ''}`} style={{ '--runner-x': `${item.x}%` } as CSSProperties}>{item.kind === 'coin' ? '🪙' : item.kind === 'reward' ? <img src={lavaValleyAssets.rewards.explorerRewardPouch} alt="보상 주머니" /> : item.kind === 'flame' ? <i className="lava-runner-flame" aria-label="용암 분출" /> : <i className="lava-runner-rock" aria-label="바위 장애물" />}</div>)}
      <div className={`lava-runner__dino ${jumping ? 'lava-runner__dino--jump' : ''} ${invincible ? 'lava-runner__dino--hit' : ''}`} style={{ '--lava-jump-y': `${jumpY}%` } as CSSProperties}>{jumping && <img className="lava-runner__jump-dust" src={lavaValleyAssets.effects.jumpTakeoffDust} alt="" aria-hidden="true" />}{dinosaurImage ? <img src={dinosaurImage} alt={`${dinosaur.name} 달리기`} draggable={false} /> : <span>🦖</span>}<img className="lava-runner__shadow" src={lavaValleyAssets.effects.dinosaurContactShadow} alt="" aria-hidden="true" /></div>
    </main>
    <footer className="lava-runner__controls"><button type="button" className="lava-runner__dash" disabled>대시<small>준비 중</small></button><button type="button" className="lava-runner__jump" onClick={jump}>점프! <b>⬆</b></button></footer>
    {paused && <div className="lava-runner-modal"><section role="dialog" aria-modal="true"><div><h2>용암계곡 설정</h2><button type="button" onClick={closeSettings}><X /></button></div><p>게임이 잠시 멈췄어요.</p><button type="button" onClick={closeSettings}>게임으로 돌아가기</button></section></div>}
    {result !== 'playing' && <div className="lava-runner-modal"><section role="dialog" aria-modal="true"><h2>{result === 'success' ? '용암계곡 탐험 성공!' : '앗, 용암길이 너무 뜨거웠어요!'}</h2><p>모은 코인 <b>{coins}</b>개</p><div className="lava-runner-modal__actions"><button type="button" onClick={reset}><RotateCcw /> 다시 하기</button><button type="button" onClick={onExit}>탐험 지도로</button></div></section></div>}
  </section>;
}
