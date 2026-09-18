import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import type { MinigameRunRewards } from '../../config/minigameConfig';
import type { ArcadeDirection } from '../../config/deepSea/arcadeStage2';
import { DEEP_SEA_STAGES, type DeepSeaMission } from '../../config/deepSea/arcadeStages';
import { createStage3Config, type Stage3GateState } from '../../config/deepSea/arcadeStage3';
import type { RelicChestOutcome } from '../../config/worldMapRelicConfig';
import { DEEP_SEA_ASSETS as ART, deepSeaTreasureAsset } from '../../config/deepSea/arcadeAssets';
import type { createDeepSeaArcade } from './deepSea/createDeepSeaArcade';

interface Props {
  stageNumber: 1 | 2 | 3;
  runId: string;
  onExit: () => void;
  onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards;
  onRetry: (retryAfterFailure?: boolean) => void;
}

const tutorialMessages: Record<string, string> = {
  movement_intro: '방향 버튼을 누르고 있으면 잠수함이 계속 움직여요.',
  buffered_turn: '미리 방향을 누르면 갈림길에서 자동으로 돌아요.',
  first_coin: '코인을 모아보세요!',
  first_enemy: '상어와 부딪히면 잠수함이 손상돼요.',
  first_hit: '잠시 동안은 다시 부딪혀도 괜찮아요.',
  first_powerup: '전기 구슬을 먹으면 잠시 동안 적들이 도망가요!',
  powered_hit: '지금은 상어를 쫓아낼 수 있어요!',
  treasure_approach: '바닷속 보물을 찾아보세요!',
  first_treasure: '보물 3개를 찾으면 출구가 열려요.',
  second_treasure: '보물 2/3!',
  third_treasure: '보물을 모두 찾았어요!',
  exit_unlocked: '출구가 열렸어요! 탈출하세요.',
};
const seenTutorialIds = new Set<string>(); // Session only; persistent tutorial progress is a later step.
const shortTreasureNames: Record<string, string> = {
  compass: '나침반', key: '배 열쇠', necklace: '조개 목걸이',
  'gold-jar': '항아리', 'broken-crown': '왕관', 'blue-jewel-box': '보석 상자',
  'stage3-pearl': '진주', 'stage3-crown': '해마 왕관', 'stage3-trident': '세 갈래 창',
};

export function DeepSeaArcadeHost({ stageNumber, runId, onExit, onFinishRun, onRetry }: Props) {
  const [mission, setMission] = useState<DeepSeaMission>(stageNumber === 1 ? '1-1' : stageNumber === 2 ? '2' : '3');
  const [attempt, setAttempt] = useState(0);
  const stage3Config = useMemo(() => stageNumber === 3 ? createStage3Config(runId) : null, [stageNumber, runId]);
  const config = mission === '3' ? stage3Config! : DEEP_SEA_STAGES[mission];
  const board = config.board;
  const parentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ReturnType<typeof createDeepSeaArcade> | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const heldKeysRef = useRef<ArcadeDirection[]>([]);
  const coinsRef = useRef(0);
  const tutorialCoinsRef = useRef(0);
  const committedRef = useRef(false);
  const finishRef = useRef(onFinishRun);
  const [tutorialQueue, setTutorialQueue] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(3);
  const [coins, setCoins] = useState(0);
  const [paidCoins, setPaidCoins] = useState(0);
  const [relicOutcome, setRelicOutcome] = useState<RelicChestOutcome | null>(null);
  const [gateStates, setGateStates] = useState<Record<string, Stage3GateState>>({});
  const [treasures, setTreasures] = useState<string[]>([]);
  const [power, setPower] = useState(0);
  const [exitReady, setExitReady] = useState(false);
  const [result, setResult] = useState<'playing' | 'clear' | 'failure'>('playing');
  const [feedback, setFeedback] = useState(stageNumber === 1 ? '짧은 연습을 시작해요!' : '보물 3개를 찾고 출구로 탈출하세요!');
  const [position, setPosition] = useState<{ column: number; row: number }>({ ...board.playerStart });
  finishRef.current = onFinishRun;

  const showTutorial = (id: string) => {
    if (mission === '2' || mission === '3' || !tutorialMessages[id]) return;
    const scopedId = `${mission}:${id}`;
    if (seenTutorialIds.has(scopedId)) return;
    seenTutorialIds.add(scopedId);
    setTutorialQueue(current => [...current, tutorialMessages[id]]);
  };

  useEffect(() => { controllerRef.current?.setTutorialPaused(tutorialQueue.length > 0); }, [tutorialQueue]);

  useEffect(() => {
    let cancelled = false;
    const parent = parentRef.current;
    if (!parent) return;
    void import('./deepSea/createDeepSeaArcade').then(({ createDeepSeaArcade }) => {
      if (cancelled) return;
      controllerRef.current = createDeepSeaArcade(parent, config, {
        onPosition: setPosition,
        onCoin: total => { coinsRef.current = total; setCoins(total); },
        onTreasure: (_id, label, count) => { setTreasures(current => [...current, label]); setFeedback(`${label} 찾았다! 보물 ${count}/3`); },
        onHealth: value => { setHealth(value); setFeedback(value ? '잠수함이 부딪혔어요! 잠시 안전해요.' : '잠수함이 너무 많이 손상됐어요.'); },
        onPower: setPower,
        onGateStates: setGateStates,
        onJellyfishHold: () => setFeedback('해파리에게 붙잡혔어요! 잠시 움직일 수 없어요.'),
        onExitReady: () => { setExitReady(true); setFeedback(mission === '2' || mission === '3' || mission === '1-3' ? '보물을 모두 찾았어요! 출구가 열렸어요.' : '출구가 열렸어요! 탈출하세요.'); showTutorial('exit_unlocked'); },
        onClear: () => {
          if ((mission === '2' || mission === '3' || mission === '1-3') && !committedRef.current) {
            committedRef.current = true;
            const paid = finishRef.current(runId, { coins: coinsRef.current + tutorialCoinsRef.current, rareFragments: 0, shopItems: [] });
            setPaidCoins(paid.coins);
            setRelicOutcome(paid.relicOutcome ?? null);
          }
          setResult('clear');
        },
        onFail: () => setResult('failure'),
        onTutorialEvent: showTutorial,
      });
      setLoading(false);
    }).catch(error => { console.error('[Deep Sea Arcade] Phaser load failed', error); setLoading(false); setFeedback('게임을 불러오지 못했어요.'); });
    return () => { cancelled = true; controllerRef.current?.destroy(); controllerRef.current = null; };
  }, [runId, mission, attempt]);

  const startMission = (next: Exclude<DeepSeaMission, '3'>) => {
    if (next !== mission && result === 'clear') tutorialCoinsRef.current += coinsRef.current;
    const nextBoard = DEEP_SEA_STAGES[next].board;
    setMission(next); setAttempt(value => value + 1); setTutorialQueue([]);
    coinsRef.current = 0; setCoins(0); setPaidCoins(0); setHealth(3); setTreasures([]);
    setPower(0); setExitReady(false); setResult('playing'); setLoading(true);
    setPosition({ ...nextBoard.playerStart });
    setFeedback(next === '1-2' ? '전기 구슬을 찾아보세요!' : next === '1-3' ? '보물 3개를 찾으세요!' : '코인 5개를 모으세요!');
  };

  useEffect(() => {
    const keys: Record<string, ArcadeDirection> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
    const onKey = (event: KeyboardEvent) => {
      const direction = keys[event.key];
      if (!direction) return;
      event.preventDefault();
      if (!heldKeysRef.current.includes(direction)) heldKeysRef.current.push(direction);
      if (activePointerRef.current === null) controllerRef.current?.setDirection(heldKeysRef.current.at(-1) ?? null);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const direction = keys[event.key];
      if (!direction) return;
      event.preventDefault();
      heldKeysRef.current = heldKeysRef.current.filter(value => value !== direction);
      if (activePointerRef.current === null) controllerRef.current?.setDirection(heldKeysRef.current.at(-1) ?? null);
    };
    const onBlur = () => { heldKeysRef.current = []; controllerRef.current?.setDirection(null); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', onBlur); };
  }, []);

  const directionAt = (x: number, y: number, pad: HTMLElement): ArcadeDirection | null => {
    const element = document.elementFromPoint(x, y);
    const button = element?.closest<HTMLButtonElement>('button[data-direction]');
    return button && pad.contains(button) ? button.dataset.direction as ArcadeDirection : null;
  };
  const onPadDown = (event: PointerEvent<HTMLElement>) => {
    if (activePointerRef.current !== null) return;
    const direction = directionAt(event.clientX, event.clientY, event.currentTarget);
    if (!direction) return;
    event.preventDefault();
    activePointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    controllerRef.current?.setDirection(direction);
  };
  const onPadMove = (event: PointerEvent<HTMLElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    controllerRef.current?.setDirection(directionAt(event.clientX, event.clientY, event.currentTarget));
  };
  const onPadOut = (event: PointerEvent<HTMLElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    controllerRef.current?.setDirection(null);
  };
  const onPadEnd = (event: PointerEvent<HTMLElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    activePointerRef.current = null;
    controllerRef.current?.setDirection(heldKeysRef.current.at(-1) ?? null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section className={`deep-sea-game deep-sea-arcade${mission === '2' ? ' is-stage-2' : ''}`} aria-label={`심해협곡 Stage ${mission} 아케이드`}>
      <header className="deep-sea-hud">
        <button type="button" onClick={onExit}><ChevronLeft aria-hidden="true" /> 지도</button>
        <div className="deep-sea-status">
          <strong>STAGE {mission} · {config.title}</strong>
          <div className="deep-sea-status-main">
          {mission !== '1-1' && <span className={`deep-sea-condition is-${health === 3 ? 'normal' : health === 2 ? 'damaged' : 'critical'}`} style={{ backgroundImage: `url(${ART.ui.health.url})` }}>잠수함 {health === 3 ? '정상' : health === 2 ? '파손' : health === 1 ? '위험' : '고장'}</span>}
          <div className="deep-sea-hud-counts"><b style={{ backgroundImage: `url(${ART.ui.coin.url})` }}>코인 {mission === '1-1' ? `${Math.min(coins, config.coinGoal)}/${config.coinGoal}` : coins}</b>{board.treasures.length > 0 && <b style={{ backgroundImage: `url(${ART.ui.treasure.url})` }}>보물 {treasures.length}/3</b>}{power > 0 && <em className={power <= 2 ? 'is-ending' : ''} style={{ backgroundImage: `url(${ART.ui.power.url})` }}>전기 {power}초</em>}</div>
          </div>
        </div>
        <div className="deep-sea-actions"><div className={exitReady ? 'deep-sea-exit is-open' : 'deep-sea-exit'}>출구 {exitReady ? '열림' : '잠김'}</div></div>
      </header>
      <aside className="deep-sea-objectives" aria-label="현재 목표">
        <strong style={{ backgroundImage: `url(${ART.ui.objective.url})` }}>{mission === '1-1' ? `코인 ${Math.min(coins, config.coinGoal)}/${config.coinGoal}개를 모아 출구를 여세요` : mission === '1-2' ? '전기 구슬을 먹고 출구로 탈출하세요' : `보물 ${treasures.length}/3 · 모두 찾으면 출구가 열려요`}</strong>
        {board.treasures.length > 0 && <div>{board.treasures.map(item => <span key={item.id} className={`deep-sea-treasure-pill${treasures.includes(item.label) ? ' is-done' : ''}`}>{deepSeaTreasureAsset(item.id) ? <img src={deepSeaTreasureAsset(item.id)!.url} alt="" /> : <i aria-hidden="true">◇</i>}<span className="deep-sea-treasure-name">{shortTreasureNames[item.id] ?? item.label}</span>{treasures.includes(item.label) && <i aria-label="획득">✓</i>}</span>)}</div>}
      </aside>
      <div className="deep-sea-viewport">
        <div className="deep-sea-canvas" ref={parentRef} aria-hidden="true" />
      {config.minimapEnabled && <svg className="deep-sea-arcade-map" viewBox={`0 0 ${board.columns} ${board.rows}`} aria-label="미니맵: 노란 점은 잠수함, 출구는 잠기면 회색·열리면 초록색">
        {Array.from(board.floor as Set<string>, key => {
          const [column, row] = key.split(',').map(Number);
          return <rect key={key} x={column} y={row} width="1" height="1" fill="#4b8b9a" />;
        })}
        {board.treasures.filter(item => !treasures.includes(item.label)).map(item => <image key={item.id} href={ART.ui.minimapTreasure.url} x={item.column - .15} y={item.row - .15} width="1.3" height="1.3" />)}
        {(board.gates ?? []).map(gate => <g key={gate.id}><rect x={gate.column + .04} y={gate.row + .04} width=".92" height=".92" fill={gateStates[gate.id] === 'CLOSED' ? '#e66674' : gateStates[gate.id] === 'WARNING' ? '#ffd273' : '#70d9db'} /><image href={ART.ui.minimapGate.url} x={gate.column + .15} y={gate.row + .15} width=".7" height=".7" /></g>)}
        {exitReady && <circle cx={board.exit.column + .5} cy={board.exit.row + .5} r="1.25" fill="none" stroke="#a2ffce" strokeWidth=".35" />}
        <rect x={board.exit.column} y={board.exit.row} width="1" height="1" fill={exitReady ? '#58df9e' : '#667b83'} />
        <image href={ART.ui.minimapPlayer.url} x={position.column - .5} y={position.row - .5} width="2" height="2" />
        </svg>}
      </div>
      <div className="deep-sea-feedback" role="status">{feedback}</div>
      <nav className="deep-sea-dpad" aria-label="잠수함 방향 조작" onPointerDown={onPadDown} onPointerMove={onPadMove} onPointerOut={onPadOut} onPointerUp={onPadEnd} onPointerCancel={onPadEnd} onLostPointerCapture={onPadEnd}>
        <button data-direction="up" className="is-up" aria-label="위로 이동">▲</button>
        <button data-direction="left" className="is-left" aria-label="왼쪽으로 이동">◀</button>
        <i aria-hidden="true" />
        <button data-direction="right" className="is-right" aria-label="오른쪽으로 이동">▶</button>
        <button data-direction="down" className="is-down" aria-label="아래로 이동">▼</button>
      </nav>
      {tutorialQueue.length > 0 && result === 'playing' && <><div className="deep-sea-tutorial-backdrop" /><div className="deep-sea-tutorial" role="dialog" aria-modal="true" aria-label="게임 안내" style={{ backgroundImage: `url(${ART.ui.tutorial.url})` }}><p>{tutorialQueue[0]}</p><button type="button" onClick={() => setTutorialQueue(current => current.slice(1))}>계속하기</button></div></>}
      {loading && <div className="deep-sea-overlay" role="status">심해협곡을 준비하고 있어요…</div>}
      {result !== 'playing' && <div className="deep-sea-overlay"><section className="deep-sea-result" role="dialog" aria-modal="true" style={{ backgroundImage: `url(${ART.ui.result.url})` }}>
        <span>{result === 'clear' ? `STAGE ${mission} CLEAR` : '다시 도전!'}</span>
        <h2>{result === 'clear' ? '탐험 성공' : '잠수함이 너무 많이 손상됐어요'}</h2>
        <p>코인 {result === 'clear' ? paidCoins : 0} 획득{board.treasures.length > 0 ? ` · 보물 ${treasures.length}/3` : ''}{result === 'failure' ? ' · 이번 판 보상 없음' : ''}</p>
        {result === 'clear' && mission === '3' && <p>찾은 바닷속 보물: {treasures.join(' · ')}</p>}
        {result === 'clear' && mission === '3' && relicOutcome && <p>{relicOutcome.acquired ? `${relicOutcome.partName} 획득!` : '이번에는 유물부품을 찾지 못했어요.'} · 유물부품 {relicOutcome.ownedPartCount}/{relicOutcome.goal}</p>}
        <div>{result === 'clear' && mission === '1-1' && <button type="button" onClick={() => startMission('1-2')}>Stage 1-2로</button>}
          {result === 'clear' && mission === '1-2' && <button type="button" onClick={() => startMission('1-3')}>Stage 1-3으로</button>}
          <button type="button" onClick={() => mission === '2' || mission === '3' ? onRetry(result === 'failure') : startMission(mission)}><RotateCcw aria-hidden="true" /> 다시 하기</button><button type="button" onClick={onExit}>모험맵으로</button></div>
      </section></div>}
    </section>
  );
}
