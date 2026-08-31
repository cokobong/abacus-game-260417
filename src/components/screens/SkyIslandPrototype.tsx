import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, RotateCcw, Settings, X } from 'lucide-react';
import { getDinosaurSpecies } from '../../data/dinosaurSpecies';
import type { OwnedDinosaur } from '../../types/game';
import { getDinosaurImageForGrowthStage, getGrowthStageForLevel } from '../../utils/dinosaurGrowth';

export const SKY_ISLAND_CONFIG = {
  laneCount: 5, projectileSpeed: 72, gameDuration: 50, playerHealth: 3, playerInvincibleMs: 2000, attackerStartDelay: 7000,
} as const;
export const SKY_ISLAND_DIFFICULTY = {
  easy: { maxTargets: 3, maxAttackEnemies: 1, maxEnemyProjectiles: 1, spawnIntervalMin: 2400, spawnIntervalMax: 2800, firstFireDelayMin: 1800, firstFireDelayMax: 2500, enemyFireIntervalMin: 4500, enemyFireIntervalMax: 6000, enemyFireWarningMs: 1100, targetSpeed: 9.5, enemyProjectileSpeed: 25, attackerSpawnChance: .25 },
  normal: { maxTargets: 5, maxAttackEnemies: 2, maxEnemyProjectiles: 2, spawnIntervalMin: 1600, spawnIntervalMax: 2000, firstFireDelayMin: 800, firstFireDelayMax: 1400, enemyFireIntervalMin: 3000, enemyFireIntervalMax: 4500, enemyFireWarningMs: 900, targetSpeed: 11, enemyProjectileSpeed: 29, attackerSpawnChance: .4 },
  challenge: { maxTargets: 6, maxAttackEnemies: 3, maxEnemyProjectiles: 3, spawnIntervalMin: 1200, spawnIntervalMax: 1600, firstFireDelayMin: 500, firstFireDelayMax: 1000, enemyFireIntervalMin: 2300, enemyFireIntervalMax: 3500, enemyFireWarningMs: 700, targetSpeed: 13, enemyProjectileSpeed: 34, attackerSpawnChance: .55 },
} as const;
export type SkyBonusQuestion = { prompt: string; choices: number[]; answer: number };

type TargetKind = 'cloud' | 'star' | 'pterosaur' | 'attacker';
type Target = { id: number; lane: number; y: number; kind: TargetKind; warning?: boolean; warningLane?: number; fireAt?: number; nextAttackAt?: number };
type Projectile = { id: number; lane: number; y: number };
type EnemyProjectile = Projectile;
type Hit = { id: number; lane: number; y: number; label: string };
type Outcome = 'playing' | 'success' | 'failure';
type Difficulty = keyof typeof SKY_ISLAND_DIFFICULTY;
const TARGET_INFO: Record<TargetKind, { icon: string; label: string; points: number }> = {
  cloud: { icon: '☁️', label: '구름', points: 10 }, star: { icon: '⭐', label: '별', points: 20 },
  pterosaur: { icon: '🦅', label: '익룡', points: 30 }, attacker: { icon: '🦅', label: '공격 익룡', points: 50 },
};
const lanePosition = (lane: number) => `${((lane + .5) / SKY_ISLAND_CONFIG.laneCount) * 100}%`;
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const randomRegularKind = (): TargetKind => { const roll = Math.random(); return roll < .5 ? 'cloud' : roll < .8 ? 'star' : 'pterosaur'; };

export interface SkyIslandPrototypeProps { dinosaur: OwnedDinosaur; onExit: () => void }
export function SkyIslandPrototype({ dinosaur, onExit }: SkyIslandPrototypeProps) {
  const centerLane = Math.floor(SKY_ISLAND_CONFIG.laneCount / 2);
  const [playerLane, setPlayerLane] = useState(centerLane), [targets, setTargets] = useState<Target[]>([]), [shots, setShots] = useState<Projectile[]>([]), [enemyShots, setEnemyShots] = useState<EnemyProjectile[]>([]), [hits, setHits] = useState<Hit[]>([]);
  const [score, setScore] = useState(0), [health, setHealth] = useState(SKY_ISLAND_CONFIG.playerHealth), [timeLeft, setTimeLeft] = useState(SKY_ISLAND_CONFIG.gameDuration), [outcome, setOutcome] = useState<Outcome>('playing'), [invincible, setInvincible] = useState(false), [runId, setRunId] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal'), [settingsOpen, setSettingsOpen] = useState(false);
  const playerLaneRef = useRef(centerLane), targetsRef = useRef<Target[]>([]), shotsRef = useRef<Projectile[]>([]), enemyShotsRef = useRef<EnemyProjectile[]>([]), scoreRef = useRef(0), healthRef = useRef(SKY_ISLAND_CONFIG.playerHealth);
  const startTimeRef = useRef(performance.now()), lastFrameRef = useRef(0), nextSpawnAtRef = useRef(0), nextIdRef = useRef(1), outcomeRef = useRef<Outcome>('playing'), invincibleUntilRef = useRef(0), attackerEverSpawnedRef = useRef(false);
  const difficultyRef = useRef<Difficulty>('normal'), pausedRef = useRef(false), pauseStartedAtRef = useRef(0);
  const species = getDinosaurSpecies(dinosaur.speciesId);
  const dinosaurImage = useMemo(() => getDinosaurImageForGrowthStage(species?.images, getGrowthStageForLevel(dinosaur.level), species?.characterAsset), [dinosaur.level, species]);

  const move = useCallback((direction: -1 | 1) => { if (outcomeRef.current !== 'playing' || pausedRef.current) return; playerLaneRef.current = Math.max(0, Math.min(SKY_ISLAND_CONFIG.laneCount - 1, playerLaneRef.current + direction)); setPlayerLane(playerLaneRef.current); }, []);
  const fire = useCallback(() => { if (outcomeRef.current !== 'playing' || pausedRef.current) return; const shot = { id: nextIdRef.current++, lane: playerLaneRef.current, y: 84 }; shotsRef.current = [...shotsRef.current, shot]; setShots(shotsRef.current); }, []);
  const openSettings = () => { if (outcomeRef.current !== 'playing') return; pauseStartedAtRef.current = performance.now(); pausedRef.current = true; setSettingsOpen(true); };
  const closeSettings = () => { const pausedFor = performance.now() - pauseStartedAtRef.current; startTimeRef.current += pausedFor; nextSpawnAtRef.current += pausedFor; invincibleUntilRef.current += pausedFor; targetsRef.current = targetsRef.current.map((target) => ({ ...target, nextAttackAt: target.nextAttackAt ? target.nextAttackAt + pausedFor : undefined, fireAt: target.fireAt ? target.fireAt + pausedFor : undefined })); lastFrameRef.current = performance.now(); pausedRef.current = false; setSettingsOpen(false); };
  const chooseDifficulty = (next: Difficulty) => {
    difficultyRef.current = next; setDifficulty(next); const preset = SKY_ISLAND_DIFFICULTY[next]; let attackersKept = 0;
    targetsRef.current = targetsRef.current.filter((target) => target.kind !== 'attacker' || ++attackersKept <= preset.maxAttackEnemies).slice(0, preset.maxTargets);
    enemyShotsRef.current = enemyShotsRef.current.slice(0, preset.maxEnemyProjectiles); setTargets(targetsRef.current); setEnemyShots(enemyShotsRef.current);
  };
  const reset = useCallback(() => {
    playerLaneRef.current = centerLane; targetsRef.current = []; shotsRef.current = []; enemyShotsRef.current = []; scoreRef.current = 0; healthRef.current = SKY_ISLAND_CONFIG.playerHealth; outcomeRef.current = 'playing'; invincibleUntilRef.current = 0;
    startTimeRef.current = performance.now(); lastFrameRef.current = 0; nextSpawnAtRef.current = 0; attackerEverSpawnedRef.current = false; pausedRef.current = false; setSettingsOpen(false); setPlayerLane(centerLane); setTargets([]); setShots([]); setEnemyShots([]); setHits([]); setScore(0); setHealth(SKY_ISLAND_CONFIG.playerHealth); setTimeLeft(SKY_ISLAND_CONFIG.gameDuration); setOutcome('playing'); setInvincible(false); setRunId((value) => value + 1);
  }, [centerLane]);

  useEffect(() => { const keyDown = (event: KeyboardEvent) => { if (event.repeat) return; if (event.code === 'ArrowLeft' || event.code === 'KeyA') move(-1); if (event.code === 'ArrowRight' || event.code === 'KeyD') move(1); if (event.code === 'Space') { event.preventDefault(); fire(); } }; window.addEventListener('keydown', keyDown); return () => window.removeEventListener('keydown', keyDown); }, [fire, move]);
  useEffect(() => {
    let frame = 0;
    const finish = (result: Outcome) => { outcomeRef.current = result; targetsRef.current = []; shotsRef.current = []; enemyShotsRef.current = []; setTargets([]); setShots([]); setEnemyShots([]); setOutcome(result); };
    const tick = (now: number) => {
      if (pausedRef.current) { lastFrameRef.current = now; frame = requestAnimationFrame(tick); return; }
      const preset = SKY_ISLAND_DIFFICULTY[difficultyRef.current];
      const elapsedMs = now - startTimeRef.current, remaining = Math.max(0, Math.ceil(SKY_ISLAND_CONFIG.gameDuration - elapsedMs / 1000)); setTimeLeft(remaining);
      if (!remaining) { finish('success'); return; }
      setInvincible(now < invincibleUntilRef.current);
      const delta = Math.min((now - (lastFrameRef.current || now)) / 1000, .04); lastFrameRef.current = now;
      if (now >= nextSpawnAtRef.current && targetsRef.current.length < preset.maxTargets) {
        nextSpawnAtRef.current = now + randomBetween(preset.spawnIntervalMin, preset.spawnIntervalMax); const occupied = new Set(targetsRef.current.filter((target) => target.y < 24).map((target) => target.lane)); const free = Array.from({ length: SKY_ISLAND_CONFIG.laneCount }, (_, lane) => lane).filter((lane) => !occupied.has(lane)); const lane = free[Math.floor(Math.random() * free.length)] ?? Math.floor(Math.random() * SKY_ISLAND_CONFIG.laneCount);
        const attackerCount = targetsRef.current.filter((target) => target.kind === 'attacker').length;
        const shouldSpawnAttacker = elapsedMs >= SKY_ISLAND_CONFIG.attackerStartDelay && attackerCount < preset.maxAttackEnemies && (!attackerEverSpawnedRef.current || Math.random() < preset.attackerSpawnChance);
        const kind = shouldSpawnAttacker ? 'attacker' : randomRegularKind();
        if (kind === 'attacker') attackerEverSpawnedRef.current = true;
        const stagger = kind === 'attacker' && attackerCount > 0 ? randomBetween(300, 700) * attackerCount : 0;
        targetsRef.current = [...targetsRef.current, { id: nextIdRef.current++, lane, y: -7, kind, nextAttackAt: kind === 'attacker' ? now + randomBetween(preset.firstFireDelayMin, preset.firstFireDelayMax) + preset.enemyFireWarningMs + stagger : undefined }];
      }
      targetsRef.current = targetsRef.current.map((target) => {
        if (target.kind !== 'attacker') return target;
        if (!target.warning && target.nextAttackAt && now >= target.nextAttackAt - preset.enemyFireWarningMs) return { ...target, warning: true, warningLane: playerLaneRef.current, fireAt: target.nextAttackAt };
        if (target.warning && target.fireAt && now >= target.fireAt) {
          if (enemyShotsRef.current.length < preset.maxEnemyProjectiles) enemyShotsRef.current = [...enemyShotsRef.current, { id: nextIdRef.current++, lane: target.warningLane ?? target.lane, y: target.y + 5 }];
          return { ...target, warning: false, warningLane: undefined, fireAt: undefined, nextAttackAt: now + randomBetween(preset.enemyFireIntervalMin, preset.enemyFireIntervalMax) };
        }
        return target;
      });
      targetsRef.current = targetsRef.current.map((target) => ({ ...target, y: target.y + preset.targetSpeed * delta })).filter((target) => target.y < 96);
      shotsRef.current = shotsRef.current.map((shot) => ({ ...shot, y: shot.y - SKY_ISLAND_CONFIG.projectileSpeed * delta })).filter((shot) => shot.y > -5);
      enemyShotsRef.current = enemyShotsRef.current.map((shot) => ({ ...shot, y: shot.y + preset.enemyProjectileSpeed * delta })).filter((shot) => shot.y < 96);
      const hitTargetIds = new Set<number>(), hitShotIds = new Set<number>(), newHits: Hit[] = [];
      for (const shot of shotsRef.current) { const target = targetsRef.current.find((item) => !hitTargetIds.has(item.id) && item.lane === shot.lane && Math.abs(item.y - shot.y) < 5.5); if (!target) continue; hitTargetIds.add(target.id); hitShotIds.add(shot.id); const points = TARGET_INFO[target.kind].points; scoreRef.current += points; newHits.push({ id: nextIdRef.current++, lane: target.lane, y: target.y, label: `+${points}` }); }
      if (newHits.length) { setScore(scoreRef.current); setHits((current) => [...current, ...newHits]); newHits.forEach((hit) => window.setTimeout(() => setHits((current) => current.filter((item) => item.id !== hit.id)), 450)); }
      const playerHit = enemyShotsRef.current.find((shot) => shot.lane === playerLaneRef.current && shot.y >= 78 && shot.y <= 93);
      if (playerHit) {
        enemyShotsRef.current = enemyShotsRef.current.filter((shot) => shot.id !== playerHit.id);
        if (now >= invincibleUntilRef.current) { healthRef.current -= 1; setHealth(healthRef.current); invincibleUntilRef.current = now + SKY_ISLAND_CONFIG.playerInvincibleMs; setInvincible(true); if (healthRef.current <= 0) { finish('failure'); return; } }
      }
      targetsRef.current = targetsRef.current.filter((target) => !hitTargetIds.has(target.id)); shotsRef.current = shotsRef.current.filter((shot) => !hitShotIds.has(shot.id)); setTargets(targetsRef.current); setShots(shotsRef.current); setEnemyShots(enemyShotsRef.current); frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [runId]);

  return <section className="sky-island-game"><header className="sky-game-header"><button type="button" onClick={onExit} className="sky-exit"><ChevronLeft /> 지도</button><div className="sky-title"><span>☁️ 하늘섬</span><strong className="sky-health" aria-label={`하트 ${health}개`}>{'❤️'.repeat(health)}<i>{'♡'.repeat(SKY_ISLAND_CONFIG.playerHealth - health)}</i></strong></div><div className="sky-score"><span>점수 <b>{score}</b></span><span>남은 시간 <b>00:{String(timeLeft).padStart(2, '0')}</b></span></div><button type="button" className="sky-settings-button" onClick={openSettings} aria-label="하늘섬 설정 열기"><Settings /></button></header>
    <div className="sky-playfield" aria-label="5개 레인의 하늘섬 슈팅 게임"><div className="sky-sun" aria-hidden="true" /><div className="sky-distant-cloud sky-distant-cloud--one" aria-hidden="true" /><div className="sky-distant-cloud sky-distant-cloud--two" aria-hidden="true" /><div className="sky-lanes" aria-hidden="true">{Array.from({ length: SKY_ISLAND_CONFIG.laneCount }, (_, lane) => <i key={lane} />)}</div>
      {targets.map((target) => <div key={target.id} className={`sky-target sky-target--${target.kind} ${target.warning ? 'sky-target--warning' : ''}`} style={{ '--lane-x': lanePosition(target.lane), '--object-y': `${target.y}%` } as CSSProperties}>{target.warning && <b className="sky-warning">⚠</b>}{TARGET_INFO[target.kind].icon}<span>+{TARGET_INFO[target.kind].points}</span></div>)}
      {targets.filter((target) => target.warning).map((target) => <div key={`warning-${target.id}`} className="sky-lane-warning" style={{ '--lane-x': lanePosition(target.warningLane ?? target.lane) } as CSSProperties}>⚠ 피하기!</div>)}
      {shots.map((shot) => <div key={shot.id} className="sky-projectile" style={{ '--lane-x': lanePosition(shot.lane), '--object-y': `${shot.y}%` } as CSSProperties}>✦</div>)}{enemyShots.map((shot) => <div key={shot.id} className="sky-enemy-projectile" style={{ '--lane-x': lanePosition(shot.lane), '--object-y': `${shot.y}%` } as CSSProperties}>▼</div>)}{hits.map((hit) => <div key={hit.id} className="sky-hit" style={{ '--lane-x': lanePosition(hit.lane), '--object-y': `${hit.y}%` } as CSSProperties}>{hit.label}</div>)}
      <div className={`sky-player ${invincible ? 'sky-player--invincible' : ''}`} style={{ '--lane-x': lanePosition(playerLane) } as CSSProperties}>{dinosaurImage ? <img src={dinosaurImage} alt={dinosaur.name} draggable={false} /> : <span>🦖</span>}<i aria-hidden="true" /></div></div>
    <footer className="sky-controls"><button type="button" onClick={() => move(-1)} aria-label="한 칸 왼쪽으로 이동">◀<small>왼쪽</small></button><button type="button" className="sky-fire" onClick={fire}>발사 <b>✦</b></button><button type="button" onClick={() => move(1)} aria-label="한 칸 오른쪽으로 이동">▶<small>오른쪽</small></button></footer>
    {settingsOpen && <div className="sky-settings-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="sky-settings-title" className="sky-settings-panel"><div className="sky-settings-heading"><h2 id="sky-settings-title">하늘섬 설정</h2><button type="button" onClick={closeSettings} aria-label="설정 닫기"><X /></button></div><fieldset><legend>난이도</legend>{([['easy','쉬움','천천히 쏘고 피워요'],['normal','보통','적당한 쏘기와 피하기'],['challenge','도전','더 많은 적에게 도전해요']] as const).map(([value,label,description]) => <button type="button" key={value} aria-pressed={difficulty === value} onClick={() => chooseDifficulty(value)}><i aria-hidden="true" /> <span><b>{label}</b><small>{description}</small></span></button>)}</fieldset><button type="button" className="sky-settings-resume" onClick={closeSettings}>게임으로 돌아가기</button></section></div>}
    {outcome !== 'playing' && <div className="sky-modal"><section role="dialog" aria-modal="true"><div className="sky-modal-stars">{outcome === 'success' ? '⭐ ✨ ⭐' : '☁️ 🦖 ☁️'}</div><h2>{outcome === 'success' ? '하늘섬 탐험 완료!' : '하늘섬 탐험 실패!'}</h2><p>별빛 점수</p><strong>{score}점</strong><div><button type="button" onClick={reset}><RotateCcw /> 다시 하기</button><button type="button" onClick={onExit}>모험으로 돌아가기</button></div></section></div>}</section>;
}
