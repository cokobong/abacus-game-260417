import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import type { MinigameRunRewards } from '../../config/minigameConfig';
import { ARCADE_STAGE_2, type ArcadeDirection } from '../../config/deepSea/arcadeStage2';
import type { createDeepSeaArcade } from './deepSea/createDeepSeaArcade';

interface Props {
  runId: string;
  onExit: () => void;
  onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards;
  onRetry: (retryAfterFailure?: boolean) => void;
}

export function DeepSeaArcadeHost({ runId, onExit, onFinishRun, onRetry }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ReturnType<typeof createDeepSeaArcade> | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const heldKeysRef = useRef<ArcadeDirection[]>([]);
  const coinsRef = useRef(0);
  const committedRef = useRef(false);
  const finishRef = useRef(onFinishRun);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(3);
  const [coins, setCoins] = useState(0);
  const [paidCoins, setPaidCoins] = useState(0);
  const [treasures, setTreasures] = useState<string[]>([]);
  const [power, setPower] = useState(0);
  const [exitReady, setExitReady] = useState(false);
  const [result, setResult] = useState<'playing' | 'clear' | 'failure'>('playing');
  const [feedback, setFeedback] = useState('보물 3개를 찾고 출구로 탈출하세요!');
  const [position, setPosition] = useState<{ column: number; row: number }>({ ...ARCADE_STAGE_2.playerStart });
  finishRef.current = onFinishRun;

  useEffect(() => {
    let cancelled = false;
    const parent = parentRef.current;
    if (!parent) return;
    void import('./deepSea/createDeepSeaArcade').then(({ createDeepSeaArcade }) => {
      if (cancelled) return;
      controllerRef.current = createDeepSeaArcade(parent, {
        onPosition: setPosition,
        onCoin: total => { coinsRef.current = total; setCoins(total); },
        onTreasure: (_id, label) => { setTreasures(current => [...current, label]); setFeedback(`${label} 찾았다!`); },
        onHealth: value => { setHealth(value); setFeedback(value ? '잠수함이 부딪혔어요! 조심하세요.' : '잠수함이 고장 났어요.'); },
        onPower: setPower,
        onExitReady: () => { setExitReady(true); setFeedback('출구가 열렸어요! 탈출하세요.'); },
        onClear: () => {
          if (!committedRef.current) {
            committedRef.current = true;
            const paid = finishRef.current(runId, { coins: coinsRef.current, rareFragments: 0, shopItems: [] });
            setPaidCoins(paid.coins);
          }
          setResult('clear');
        },
        onFail: () => setResult('failure'),
      });
      setLoading(false);
    }).catch(error => { console.error('[Deep Sea Arcade] Phaser load failed', error); setLoading(false); setFeedback('게임을 불러오지 못했어요.'); });
    return () => { cancelled = true; controllerRef.current?.destroy(); controllerRef.current = null; };
  }, [runId]);

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
    <section className="deep-sea-game deep-sea-arcade" aria-label="심해협곡 Stage 2 아케이드">
      <header className="deep-sea-hud">
        <button type="button" onClick={onExit}><ChevronLeft aria-hidden="true" /> 지도</button>
        <div className="deep-sea-status">
          <strong>STAGE 2 · 깊은 물길</strong>
          <span>잠수함 {health === 3 ? '정상' : health === 2 ? '파손' : health === 1 ? '위험' : '고장'} {power > 0 ? `· 전기 ${power}초` : ''}</span>
          <b>코인 {coins} · 보물 {treasures.length}/3</b>
        </div>
        <div className="deep-sea-actions"><div className={exitReady ? 'deep-sea-exit is-open' : 'deep-sea-exit'}>출구 {exitReady ? '열림' : '잠김'}</div></div>
      </header>
      <aside className="deep-sea-objectives" aria-label="보물 목표">
        <strong>보물 {treasures.length}/3 · 모두 찾으면 출구가 열려요</strong>
        <div>{ARCADE_STAGE_2.treasures.map(item => <span key={item.id} className={treasures.includes(item.label) ? 'is-done' : ''}>{treasures.includes(item.label) ? '✓' : '◇'} {item.label}</span>)}</div>
      </aside>
      <div className="deep-sea-canvas" ref={parentRef} aria-hidden="true" />
      <svg className="deep-sea-arcade-map" viewBox="0 0 22 22" aria-label="미니맵: 노란 점은 잠수함, 초록 점은 출구">
        {Array.from(ARCADE_STAGE_2.floor, key => {
          const [column, row] = key.split(',').map(Number);
          return <rect key={key} x={column} y={row} width="1" height="1" fill="#4b8b9a" />;
        })}
        <rect x={ARCADE_STAGE_2.exit.column} y={ARCADE_STAGE_2.exit.row} width="1" height="1" fill="#58df9e" />
        <circle cx={position.column + .5} cy={position.row + .5} r="1" fill="#ffe06c" />
      </svg>
      <div className="deep-sea-feedback" role="status">{feedback}</div>
      <nav className="deep-sea-dpad" aria-label="잠수함 방향 조작" onPointerDown={onPadDown} onPointerMove={onPadMove} onPointerOut={onPadOut} onPointerUp={onPadEnd} onPointerCancel={onPadEnd} onLostPointerCapture={onPadEnd}>
        <button data-direction="up" className="is-up" aria-label="위로 이동">▲</button>
        <button data-direction="left" className="is-left" aria-label="왼쪽으로 이동">◀</button>
        <i aria-hidden="true" />
        <button data-direction="right" className="is-right" aria-label="오른쪽으로 이동">▶</button>
        <button data-direction="down" className="is-down" aria-label="아래로 이동">▼</button>
      </nav>
      {loading && <div className="deep-sea-overlay" role="status">심해협곡을 준비하고 있어요…</div>}
      {result !== 'playing' && <div className="deep-sea-overlay"><section className="deep-sea-result" role="dialog" aria-modal="true">
        <span>{result === 'clear' ? 'STAGE 2 CLEAR' : '다시 도전!'}</span>
        <h2>{result === 'clear' ? '탐험 성공' : '잠수함이 고장 났어요'}</h2>
        <p>코인 {result === 'clear' ? paidCoins : 0} 획득 · 보물 {treasures.length}/3{result === 'failure' ? ' · 이번 판 보상 없음' : ''}</p>
        <div><button type="button" onClick={() => onRetry(result === 'failure')}><RotateCcw aria-hidden="true" /> 다시 하기</button><button type="button" onClick={onExit}>모험맵으로</button></div>
      </section></div>}
    </section>
  );
}
