import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, RotateCcw, Settings, X } from 'lucide-react';
import pteranodonImage from '../../assets/adventure/sky-island/player/pteranodon_fly_placeholder.png';
import { lavaValleyAssets } from '../../assets/adventure/lava-valley';
import { shopItemImages } from '../../assets/shop';
import { LAVA_VALLEY_SHOP_DROP_POOLS } from '../../config/shopCatalog';
import { getItemConfig } from '../../config/itemConfig';
import { SKY_ISLAND_MOCK_MODE, type MinigameItemReward, type MinigameRunRewards } from '../../config/minigameConfig';
import type { OwnedDinosaur } from '../../types/game';
import { preloadImages } from '../../utils/preloadImages';

export const SKY_ISLAND_CONFIG = { gameDuration: 60, playerHealth: 3, playerInvincibleMs: 1200, playerX: 26, spawnX: 110, despawnX: -12, playerHitboxX: 7, playerHitboxY: 8, obstacleHitboxX: 6, obstacleHitboxY: 9, collectHitboxX: 11, collectHitboxY: 13 } as const;
export type SkyDifficulty = 'easy' | 'normal' | 'challenge';
export const SKY_DIFFICULTY = {
  easy: { level: 1, label: '쉬움', laneCount: 3, laneTransitionMs: 220, speed: 30, spawnIntervals: [[2200, 2600], [1950, 2350], [1750, 2150]], doubleBlockChances: [.03, .08, .15], playerHitboxScale: .8, obstacleHitboxScale: .88, collectHitboxScale: 1.22, extraRewardChance: .42 },
  normal: { level: 2, label: '보통', laneCount: 3, laneTransitionMs: 220, speed: 34, spawnIntervals: [[1900, 2300], [1600, 2050], [1400, 1850]], doubleBlockChances: [.08, .2, .35], playerHitboxScale: 1, obstacleHitboxScale: 1, collectHitboxScale: 1, extraRewardChance: .24 },
  challenge: { level: 3, label: '도전', laneCount: 5, laneTransitionMs: 185, speed: 40, spawnIntervals: [[1650, 2000], [1350, 1750], [1150, 1550]], doubleBlockChances: [.18, .38, .58], playerHitboxScale: 1.08, obstacleHitboxScale: 1.08, collectHitboxScale: .9, extraRewardChance: .1 },
} as const;
type SkyObjectKind = 'rock' | 'cloud' | 'thorn' | 'coin' | 'fragment' | 'shopItem';
type SkyObject = { id: number; lane: number; x: number; kind: SkyObjectKind; itemId?: string };
type Outcome = 'playing' | 'success' | 'failure';
type PatternEntry = { kind: SkyObjectKind; lane: number };
export const SKY_ISLAND_PATTERNS: readonly (readonly PatternEntry[])[] = [
  [{ kind: 'rock', lane: 2 }, { kind: 'coin', lane: 1 }],
  [{ kind: 'cloud', lane: 1 }, { kind: 'coin', lane: 0 }],
  [{ kind: 'thorn', lane: 0 }, { kind: 'coin', lane: 1 }],
  [{ kind: 'rock', lane: 2 }, { kind: 'coin', lane: 1 }, { kind: 'cloud', lane: 0 }],
  [{ kind: 'coin', lane: 2 }, { kind: 'thorn', lane: 1 }],
  [{ kind: 'cloud', lane: 1 }, { kind: 'fragment', lane: 0 }],
] as const;
export const SKY_ISLAND_CHALLENGE_PATTERNS: readonly (readonly PatternEntry[])[] = [
  [{ kind: 'rock', lane: 0 }, { kind: 'coin', lane: 2 }],
  [{ kind: 'cloud', lane: 1 }, { kind: 'thorn', lane: 3 }, { kind: 'coin', lane: 2 }],
  [{ kind: 'rock', lane: 0 }, { kind: 'cloud', lane: 3 }, { kind: 'coin', lane: 2 }, { kind: 'coin', lane: 4 }],
  [{ kind: 'thorn', lane: 1 }, { kind: 'rock', lane: 4 }, { kind: 'fragment', lane: 2 }],
  [{ kind: 'cloud', lane: 0 }, { kind: 'rock', lane: 1 }, { kind: 'thorn', lane: 3 }, { kind: 'coin', lane: 2 }],
  [{ kind: 'rock', lane: 1 }, { kind: 'cloud', lane: 2 }, { kind: 'thorn', lane: 4 }, { kind: 'coin', lane: 3 }],
] as const;
const OBSTACLES = new Set<SkyObjectKind>(['rock', 'cloud', 'thorn']);
export const getSkyLaneY = (lane: number, laneCount: number) => { const edge = laneCount === 5 ? 15 : 25; return 100 - edge - lane * ((100 - edge * 2) / (laneCount - 1)); };
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const phaseIndex = (elapsedSeconds: number) => elapsedSeconds < 15 ? 0 : elapsedSeconds < 35 ? 1 : 2;
const spawnDelay = (elapsedSeconds: number, difficulty: SkyDifficulty) => { const [min, max] = SKY_DIFFICULTY[difficulty].spawnIntervals[phaseIndex(elapsedSeconds)]; return randomBetween(min, max); };
const choosePattern = (elapsedSeconds: number, difficulty: SkyDifficulty) => { if (difficulty === 'challenge') return SKY_ISLAND_CHALLENGE_PATTERNS[Math.floor(Math.random() * SKY_ISLAND_CHALLENGE_PATTERNS.length)]; const singleObstaclePatterns = [SKY_ISLAND_PATTERNS[0], SKY_ISLAND_PATTERNS[1], SKY_ISLAND_PATTERNS[2], SKY_ISLAND_PATTERNS[4], SKY_ISLAND_PATTERNS[5]]; if (Math.random() < SKY_DIFFICULTY[difficulty].doubleBlockChances[phaseIndex(elapsedSeconds)]) return SKY_ISLAND_PATTERNS[3]; return singleObstaclePatterns[Math.floor(Math.random() * singleObstaclePatterns.length)]; };

const SkyIslandPlayer = memo(function SkyIslandPlayer({ invincible, bank }: { invincible: boolean; bank: 'up' | 'down' | null }) {
  return <div className={`sky-runner-player ${invincible ? 'sky-runner-player--invincible' : ''} ${bank ? `sky-runner-player--bank-${bank}` : ''}`}><img src={pteranodonImage} alt="날고 있는 프테라노돈" draggable={false} /></div>;
});

export interface SkyIslandPrototypeProps { dinosaur: OwnedDinosaur; onExit: () => void; runId: string; onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards; onRetry: () => void; externalMainModalOpen?: boolean }

export function SkyIslandPrototype({ onExit, runId, onFinishRun, onRetry, externalMainModalOpen = false }: SkyIslandPrototypeProps) {
  const [objects, setObjects] = useState<SkyObject[]>([]), [health, setHealth] = useState(3), [coins, setCoins] = useState(0), [fragments, setFragments] = useState(0), [itemCount, setItemCount] = useState(0), [timeLeft, setTimeLeft] = useState(60);
  const [outcome, setOutcome] = useState<Outcome>('playing'), [invincible, setInvincible] = useState(false), [paused, setPaused] = useState(false), [assetsReady, setAssetsReady] = useState(false), [tutorial, setTutorial] = useState(true), [attempt, setAttempt] = useState(0), [laneIndex, setLaneIndex] = useState(1), [difficulty, setDifficulty] = useState<SkyDifficulty>('easy'), [activeDifficulty, setActiveDifficulty] = useState<SkyDifficulty>('easy'), [bank, setBank] = useState<'up' | 'down' | null>(null);
  const [feedback, setFeedback] = useState<{ id: number; x: number; label: string; kind: 'collect' | 'hurt' } | null>(null), [committedRewards, setCommittedRewards] = useState<MinigameRunRewards | null>(null);
  const playfieldRef = useRef<HTMLDivElement | null>(null), playerElementRef = useRef<HTMLDivElement | null>(null), objectElementsRef = useRef(new Map<number, HTMLDivElement>()), objectsRef = useRef<SkyObject[]>([]);
  const playerYRef = useRef(50), targetPlayerYRef = useRef(50), laneIndexRef = useRef(1), activeDifficultyRef = useRef<SkyDifficulty>('easy'), healthRef = useRef(3), coinsRef = useRef(0), fragmentsRef = useRef(0), shopItemsRef = useRef<MinigameItemReward[]>([]), outcomeRef = useRef<Outcome>('playing'), pausedRef = useRef(false), startedRef = useRef(false);
  const startTimeRef = useRef(0), lastFrameRef = useRef(0), nextSpawnRef = useRef(0), nextIdRef = useRef(1), invincibleUntilRef = useRef(0), pauseStartedRef = useRef(0), rewardCommittedRef = useRef(false), feedbackTimerRef = useRef<number | null>(null), bankTimerRef = useRef<number | null>(null);
  const shopItemId = LAVA_VALLEY_SHOP_DROP_POOLS.food[0];

  const syncScene = useCallback(() => {
    const field = playfieldRef.current; if (!field) return;
    const width = field.clientWidth, height = field.clientHeight;
    if (playerElementRef.current) playerElementRef.current.style.transform = `translate3d(${width * SKY_ISLAND_CONFIG.playerX / 100}px,${height * playerYRef.current / 100}px,0)`;
    const laneCount = SKY_DIFFICULTY[activeDifficultyRef.current].laneCount;
    objectsRef.current.forEach((object) => { const element = objectElementsRef.current.get(object.id); if (element) element.style.transform = `translate3d(${width * object.x / 100}px,${height * getSkyLaneY(object.lane, laneCount) / 100}px,0)`; });
  }, []);
  const showFeedback = useCallback((label: string, kind: 'collect' | 'hurt') => { if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current); const next = { id: nextIdRef.current++, x: SKY_ISLAND_CONFIG.playerX, label, kind }; setFeedback(next); feedbackTimerRef.current = window.setTimeout(() => setFeedback((current) => current?.id === next.id ? null : current), 520); }, []);
  const beginRun = useCallback(() => { const now = performance.now(); startedRef.current = true; startTimeRef.current = now; lastFrameRef.current = now; nextSpawnRef.current = now + 900; setTutorial(false); }, []);
  const moveLane = useCallback((direction: -1 | 1) => { if (outcomeRef.current !== 'playing' || pausedRef.current || !startedRef.current) return; const preset = SKY_DIFFICULTY[activeDifficultyRef.current], nextLane = Math.max(0, Math.min(preset.laneCount - 1, laneIndexRef.current + direction)); if (nextLane === laneIndexRef.current) return; laneIndexRef.current = nextLane; targetPlayerYRef.current = getSkyLaneY(nextLane, preset.laneCount); setLaneIndex(nextLane); setBank(direction > 0 ? 'up' : 'down'); if (bankTimerRef.current) window.clearTimeout(bankTimerRef.current); bankTimerRef.current = window.setTimeout(() => setBank(null), preset.laneTransitionMs); }, []);
  const finish = useCallback((next: Exclude<Outcome, 'playing'>) => { if (outcomeRef.current !== 'playing') return; outcomeRef.current = next; objectsRef.current = []; setObjects([]); setOutcome(next); if (next === 'success' && !rewardCommittedRef.current) { rewardCommittedRef.current = true; const rewards = { coins: coinsRef.current, rareFragments: fragmentsRef.current, shopItems: shopItemsRef.current }; setCommittedRewards(SKY_ISLAND_MOCK_MODE ? rewards : onFinishRun(runId, rewards)); } }, [onFinishRun, runId]);
  const reset = useCallback(() => { const preset = SKY_DIFFICULTY[difficulty], centerLane = Math.floor(preset.laneCount / 2), centerY = getSkyLaneY(centerLane, preset.laneCount); objectsRef.current = []; objectElementsRef.current.clear(); laneIndexRef.current = centerLane; playerYRef.current = centerY; targetPlayerYRef.current = centerY; activeDifficultyRef.current = difficulty; healthRef.current = 3; coinsRef.current = 0; fragmentsRef.current = 0; shopItemsRef.current = []; outcomeRef.current = 'playing'; pausedRef.current = false; startedRef.current = false; rewardCommittedRef.current = false; invincibleUntilRef.current = 0; setObjects([]); setLaneIndex(centerLane); setActiveDifficulty(difficulty); setHealth(3); setCoins(0); setFragments(0); setItemCount(0); setTimeLeft(60); setOutcome('playing'); setInvincible(false); setPaused(false); setTutorial(true); setFeedback(null); setCommittedRewards(null); setAttempt((value) => value + 1); }, [difficulty]);
  const openSettings = () => { if (!startedRef.current || outcomeRef.current !== 'playing') return; pauseStartedRef.current = performance.now(); pausedRef.current = true; setPaused(true); };
  const closeSettings = () => { const pausedFor = performance.now() - pauseStartedRef.current; startTimeRef.current += pausedFor; nextSpawnRef.current += pausedFor; invincibleUntilRef.current += pausedFor; lastFrameRef.current = performance.now(); pausedRef.current = false; setPaused(false); };

  useEffect(() => { let cancelled = false; preloadImages([pteranodonImage, lavaValleyAssets.collectibles.coin, lavaValleyAssets.collectibles.rareEggShard, shopItemImages[shopItemId]]).then(() => { if (!cancelled) setAssetsReady(true); }).catch(console.error); return () => { cancelled = true; }; }, [shopItemId]);
  useEffect(() => { const down = (event: KeyboardEvent) => { if (event.repeat) return; if (event.code === 'ArrowDown') { event.preventDefault(); moveLane(-1); } if (event.code === 'ArrowUp') { event.preventDefault(); moveLane(1); } }; window.addEventListener('keydown', down); return () => window.removeEventListener('keydown', down); }, [moveLane]);
  useEffect(() => {
    let frame = 0;
    const spawn = (now: number) => { const elapsedSeconds = (now - startTimeRef.current) / 1000, selectedDifficulty = activeDifficultyRef.current, preset = SKY_DIFFICULTY[selectedDifficulty]; const entries: PatternEntry[] = choosePattern(elapsedSeconds, selectedDifficulty).map((entry) => ({ ...entry })); if (Math.random() < preset.extraRewardChance) { const occupied = new Set(entries.map((entry) => entry.lane)); const safeLane = Array.from({ length: preset.laneCount }, (_, lane) => lane).find((lane) => !occupied.has(lane)); if (safeLane !== undefined) entries.push({ kind: 'coin', lane: safeLane }); } if (Math.random() < .18) { const rewardIndex = entries.findIndex((entry) => !OBSTACLES.has(entry.kind)); if (rewardIndex >= 0) entries[rewardIndex] = { ...entries[rewardIndex], kind: 'shopItem' }; } objectsRef.current = [...objectsRef.current, ...entries.map((entry) => ({ id: nextIdRef.current++, lane: entry.lane, x: SKY_ISLAND_CONFIG.spawnX, kind: entry.kind, itemId: entry.kind === 'shopItem' ? shopItemId : undefined }))]; setObjects([...objectsRef.current]); nextSpawnRef.current = now + spawnDelay(elapsedSeconds, selectedDifficulty); };
    const tick = (now: number) => {
      if (!startedRef.current || pausedRef.current || outcomeRef.current !== 'playing') { lastFrameRef.current = now; syncScene(); frame = requestAnimationFrame(tick); return; }
      const delta = Math.min((now - (lastFrameRef.current || now)) / 1000, .04); lastFrameRef.current = now;
      const distanceToTarget = targetPlayerYRef.current - playerYRef.current;
      const movementPreset = SKY_DIFFICULTY[activeDifficultyRef.current], laneDistance = Math.abs(getSkyLaneY(0, movementPreset.laneCount) - getSkyLaneY(1, movementPreset.laneCount));
      const maxLaneStep = laneDistance * (1000 / movementPreset.laneTransitionMs) * delta;
      playerYRef.current += Math.sign(distanceToTarget) * Math.min(Math.abs(distanceToTarget), maxLaneStep);
      const remaining = Math.max(0, Math.ceil(60 - (now - startTimeRef.current) / 1000)); setTimeLeft((current) => current === remaining ? current : remaining); if (!remaining) { finish('success'); return; }
      if (now >= nextSpawnRef.current) spawn(now);
      const removed = new Set<number>();
      const difficultyPreset = SKY_DIFFICULTY[activeDifficultyRef.current];
      for (const object of objectsRef.current) {
        object.x -= difficultyPreset.speed * delta; if (object.x < SKY_ISLAND_CONFIG.despawnX) { removed.add(object.id); continue; }
        const distanceX = Math.abs(object.x - SKY_ISLAND_CONFIG.playerX), distanceY = Math.abs(getSkyLaneY(object.lane, difficultyPreset.laneCount) - playerYRef.current);
        const playerHitboxX = SKY_ISLAND_CONFIG.playerHitboxX * difficultyPreset.playerHitboxScale, playerHitboxY = SKY_ISLAND_CONFIG.playerHitboxY * difficultyPreset.playerHitboxScale, obstacleHitboxX = SKY_ISLAND_CONFIG.obstacleHitboxX * difficultyPreset.obstacleHitboxScale, obstacleHitboxY = SKY_ISLAND_CONFIG.obstacleHitboxY * difficultyPreset.obstacleHitboxScale;
        if (OBSTACLES.has(object.kind) && distanceX <= playerHitboxX + obstacleHitboxX && distanceY <= playerHitboxY + obstacleHitboxY && now >= invincibleUntilRef.current) { removed.add(object.id); healthRef.current -= 1; setHealth(healthRef.current); invincibleUntilRef.current = now + SKY_ISLAND_CONFIG.playerInvincibleMs; setInvincible(true); showFeedback('앗!', 'hurt'); if (healthRef.current <= 0) { finish('failure'); break; } }
        else if (!OBSTACLES.has(object.kind) && distanceX <= SKY_ISLAND_CONFIG.collectHitboxX * difficultyPreset.collectHitboxScale && distanceY <= SKY_ISLAND_CONFIG.collectHitboxY * difficultyPreset.collectHitboxScale) { removed.add(object.id); if (object.kind === 'coin') { coinsRef.current += 1; setCoins(coinsRef.current); showFeedback('+1', 'collect'); } if (object.kind === 'fragment' && fragmentsRef.current < 2) { fragmentsRef.current += 1; setFragments(fragmentsRef.current); showFeedback('조각 +1', 'collect'); } if (object.kind === 'shopItem' && object.itemId) { const found = shopItemsRef.current.find((item) => item.itemId === object.itemId); shopItemsRef.current = found ? shopItemsRef.current.map((item) => item.itemId === object.itemId ? { ...item, quantity: item.quantity + 1 } : item) : [...shopItemsRef.current, { itemId: object.itemId, quantity: 1 }]; setItemCount((value) => value + 1); showFeedback('아이템!', 'collect'); } }
      }
      const nextInvincible = now < invincibleUntilRef.current; setInvincible((current) => current === nextInvincible ? current : nextInvincible);
      if (removed.size && outcomeRef.current === 'playing') { objectsRef.current = objectsRef.current.filter((object) => !removed.has(object.id)); setObjects([...objectsRef.current]); }
      syncScene(); if (outcomeRef.current === 'playing') frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [attempt, finish, shopItemId, showFeedback, syncScene]);
  useEffect(() => () => { if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current); if (bankTimerRef.current) window.clearTimeout(bankTimerRef.current); }, []);

  const objectContent = (object: SkyObject) => object.kind === 'rock' ? '🪨' : object.kind === 'cloud' ? '🌩️' : object.kind === 'thorn' ? '🔴' : <img src={object.kind === 'coin' ? lavaValleyAssets.collectibles.coin : object.kind === 'fragment' ? lavaValleyAssets.collectibles.rareEggShard : object.itemId ? shopItemImages[object.itemId] : undefined} alt={object.kind === 'coin' ? '코인' : object.kind === 'fragment' ? '희귀조각' : getItemConfig(object.itemId ?? '')?.name ?? '상점 아이템'} />;
  return <section className={`sky-island-game sky-runner ${paused ? 'sky-runner--paused' : ''}`}><header className="sky-runner-hud"><button type="button" onClick={onExit} className="sky-exit"><ChevronLeft /> 지도</button><div className="sky-runner-hud__stats"><b>{'❤️'.repeat(health)}{'♡'.repeat(3 - health)}</b><span>🪙 {coins}</span><span>💎 {fragments}</span><span>🎁 {itemCount}</span><strong>⏱ {timeLeft}초</strong><small>{SKY_DIFFICULTY[activeDifficulty].level}단계</small></div><button type="button" className="sky-settings-button" onClick={openSettings} aria-label="일시정지"><Settings /></button></header>
    <div className="sky-runner-playfield" ref={playfieldRef}><div className="sky-runner-scenery sky-runner-far-clouds" aria-hidden="true"><i /><i /><i /><i /></div><div className="sky-runner-near-clouds" aria-hidden="true"><i /><i /></div><div className="sky-runner-lane-guides" aria-hidden="true">{Array.from({ length: SKY_DIFFICULTY[activeDifficulty].laneCount }, (_, lane) => <i key={lane} style={{ '--lane-y': `${getSkyLaneY(lane, SKY_DIFFICULTY[activeDifficulty].laneCount)}%` } as CSSProperties} />)}</div>{objects.map((object) => <div key={object.id} ref={(element) => { if (element) objectElementsRef.current.set(object.id, element); else objectElementsRef.current.delete(object.id); }} className={`sky-runner-object sky-runner-object--${object.kind}`}>{objectContent(object)}</div>)}<div ref={playerElementRef} className="sky-runner-player-anchor" data-lane={laneIndex}><SkyIslandPlayer invincible={invincible} bank={bank} /></div>{feedback && <div key={feedback.id} className={`sky-runner-feedback sky-runner-feedback--${feedback.kind}`} style={{ '--feedback-x': `${feedback.x}%` } as CSSProperties}>{feedback.label}</div>}</div>
    <footer className="sky-runner-controls"><div className="sky-runner-paddle" aria-label="비행 높이 조절">{([[1,'↑','위'],[-1,'↓','아래']] as const).map(([direction,icon,label]) => <button key={direction} type="button" onPointerDown={(event) => { event.preventDefault(); moveLane(direction); }} aria-label={`${label}로 한 칸 이동`}><b>{icon}</b><span>{label}</span></button>)}</div></footer>
    {!assetsReady && <div className="sky-runner-overlay" role="status">하늘 모험 준비 중...</div>}{assetsReady && tutorial && <button type="button" className="sky-runner-overlay sky-runner-tutorial" onClick={beginRun}><strong>↑ ↓ 버튼으로 높이를 바꿔요!</strong><span>장애물을 피하고 보물을 모아요</span><small>눌러서 시작</small></button>}
    {paused && !externalMainModalOpen && <div className="sky-settings-backdrop"><section className="sky-settings-panel"><div className="sky-settings-heading"><h2>잠깐 쉬어요</h2><button type="button" onClick={closeSettings}><X /></button></div><fieldset><legend>난이도 · 다음 판부터 적용</legend>{([['easy','1단계 쉬움'],['normal','2단계 보통'],['challenge','3단계 도전']] as const).map(([value,label]) => <button type="button" key={value} aria-pressed={difficulty === value} onClick={() => setDifficulty(value)}><i /><span><b>{label}</b><small>{value === 'easy' ? '천천히, 보물은 넉넉하게' : value === 'normal' ? '조금 빠르고 다양한 길' : '5개의 비행 길이 열려요!'}</small></span></button>)}</fieldset>{difficulty !== activeDifficulty && <p className="sky-settings-pending">선택한 난이도는 다음 판부터 적용돼요.</p>}<button type="button" className="sky-settings-resume" onClick={closeSettings}>계속하기</button><button type="button" className="sky-settings-resume" onClick={reset}>처음부터</button><button type="button" className="sky-settings-resume" onClick={onExit}>지도</button></section></div>}
    {outcome !== 'playing' && !externalMainModalOpen && <div className="sky-modal"><section><div className="sky-modal-stars">{outcome === 'success' ? '⭐ ✨ ⭐' : '☁️ 🦅 ☁️'}</div><h2>{outcome === 'success' ? '하늘섬 완료!' : '다시 날아볼까요?'}</h2>{outcome === 'success' ? <div className="sky-runner-result"><span>🪙 +{committedRewards?.coins ?? 0}</span><span>💎 +{committedRewards?.rareFragments ?? 0}</span>{committedRewards?.shopItems.map((reward) => <span key={reward.itemId}>🎁 {getItemConfig(reward.itemId)?.name ?? reward.itemId} x{reward.quantity}</span>)}</div> : <p>보상은 저장되지 않았어요. 무료로 다시 해요!</p>}<div><button type="button" onClick={outcome === 'success' ? onRetry : reset}><RotateCcw /> {outcome === 'success' ? '한 번 더' : '무료 재도전'}</button><button type="button" onClick={onExit}>지도</button></div></section></div>}
  </section>;
}
