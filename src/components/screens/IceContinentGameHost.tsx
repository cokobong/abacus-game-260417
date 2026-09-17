import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import type { MinigameRunRewards } from '../../config/minigameConfig';
import { createIceInput, ICE_KEYBOARD_ACTIONS, type IceAction } from '../../config/iceContinent/input';
import { createIceStage1State, ICE_STAGE_1 } from '../../config/iceContinent/stage1';
import type { createIceContinentGame, IceIssueNavigation } from './iceContinent/createIceContinentGame';

interface Props {
  runId: string;
  onExit: () => void;
  onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards;
  onRetry: (retryAfterFailure?: boolean) => void;
}

export function IceContinentGameHost({ runId, onExit, onFinishRun, onRetry }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ReturnType<typeof createIceContinentGame> | null>(null);
  const inputRef = useRef(createIceInput());
  const committedRef = useRef(false);
  const finishRef = useRef(onFinishRun);
  const [run, setRun] = useState(createIceStage1State);
  const [feedback, setFeedback] = useState('기지가 자동으로 생산해요. 문제가 생기면 달려가 고쳐주세요!');
  const [loading, setLoading] = useState(true);
  const [navigation, setNavigation] = useState<IceIssueNavigation>({ direction: null, layer: null });
  finishRef.current = onFinishRun;

  useEffect(() => {
    let cancelled = false;
    const parent = parentRef.current;
    if (!parent) return;
    void import('./iceContinent/createIceContinentGame').then(({ createIceContinentGame }) => {
      if (cancelled) return;
      gameRef.current = createIceContinentGame(parent, inputRef.current, {
        onState: setRun,
        onFeedback: setFeedback,
        onNavigation: setNavigation,
        onClear: () => {
          if (!committedRef.current) {
            committedRef.current = true;
            finishRef.current(runId, { coins: 0, rareFragments: 0, shopItems: [] });
          }
        },
        onFailure: () => setFeedback('기지가 오래 멈췄어요. 다시 도전해요!'),
      });
      setLoading(false);
    }).catch(error => { console.error('[Ice Continent] Phaser load failed', error); setLoading(false); setFeedback('게임을 불러오지 못했어요.'); });
    return () => { cancelled = true; gameRef.current?.destroy(); gameRef.current = null; inputRef.current.clearSource('keyboard'); inputRef.current.clearSource('touch'); };
  }, [runId]);

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      const action = ICE_KEYBOARD_ACTIONS[event.code];
      if (!action || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      event.preventDefault(); inputRef.current.set('keyboard', action, true);
    };
    const onUp = (event: KeyboardEvent) => {
      const action = ICE_KEYBOARD_ACTIONS[event.code];
      if (!action) return;
      event.preventDefault(); inputRef.current.set('keyboard', action, false);
    };
    const onBlur = () => inputRef.current.clearSource('keyboard');
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur); };
  }, []);

  const press = (action: IceAction) => (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    inputRef.current.set('touch', action, true);
  };
  const release = (action: IceAction) => (event: PointerEvent<HTMLButtonElement>) => {
    inputRef.current.set('touch', action, false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const incident = run.activeIssue ?? run.penguinAt;
  const incidentName = ICE_STAGE_1.machines.find(machine => machine.id === incident)?.name;
  const actionLabel = run.penguinAt ? '보내기' : run.activeIssue ? ICE_STAGE_1.issueLabels[run.activeIssue] : '작업';

  return <section className="ice-operation" aria-label="얼음대륙 Stage 1 프로토타입">
    <header className="ice-operation__hud">
      <button type="button" onClick={onExit}><ChevronLeft aria-hidden="true" /> 지도</button>
      <div><strong>빙하 기지 · Stage 1</strong><b>생산 목표 {run.produced} / {ICE_STAGE_1.target}</b></div>
      <span>{run.activeIssue ? `! ${incidentName} 고장 · 정지 ${Math.floor(run.stalledSeconds)}초` : run.penguinAt ? `🐧 ${incidentName} 방해 · 생산 느림` : '⚙ 생산 중'}</span>
    </header>
    {incident && <div className="ice-operation__direction" role="status">{navigation.direction === 'left' ? '← ! 왼쪽' : navigation.direction === 'right' ? '! → 오른쪽' : `${incidentName}가 화면에 보여요`}{navigation.layer === 'upper' ? ' · 위층' : ' · 아래층'}</div>}
    <div className="ice-operation__canvas" ref={parentRef} aria-hidden="true" />
    <div className="ice-operation__feedback" role="status">{feedback}</div>
    <small className="ice-operation__keys">이동 A/D · 사다리 W/S · 작업 K</small>
    <nav className="ice-operation__controls" aria-label="기지 터치 조작">
      <div className="ice-operation__dpad" role="group" aria-label="방향 조작">
        <button type="button" className="ice-operation__up" aria-label="사다리 오르기" onPointerDown={press('up')} onPointerUp={release('up')} onPointerOut={release('up')} onPointerCancel={release('up')} onLostPointerCapture={release('up')}>↑</button>
        <button type="button" className="ice-operation__left" aria-label="왼쪽으로 이동" onPointerDown={press('left')} onPointerUp={release('left')} onPointerOut={release('left')} onPointerCancel={release('left')} onLostPointerCapture={release('left')}>←</button>
        <span className="ice-operation__dpad-center" aria-hidden="true" />
        <button type="button" className="ice-operation__right" aria-label="오른쪽으로 이동" onPointerDown={press('right')} onPointerUp={release('right')} onPointerOut={release('right')} onPointerCancel={release('right')} onLostPointerCapture={release('right')}>→</button>
        <button type="button" className="ice-operation__down" aria-label="사다리 내리기" onPointerDown={press('down')} onPointerUp={release('down')} onPointerOut={release('down')} onPointerCancel={release('down')} onLostPointerCapture={release('down')}>↓</button>
      </div>
      <button type="button" className="ice-operation__action" aria-label={`${actionLabel} 작업`} onPointerDown={press('actionA')} onPointerUp={release('actionA')} onPointerOut={release('actionA')} onPointerCancel={release('actionA')} onLostPointerCapture={release('actionA')}>{actionLabel} A</button>
    </nav>
    {loading && <div className="ice-operation__overlay" role="status">빙하 기지를 준비하고 있어요…</div>}
    {run.phase !== 'playing' && <div className="ice-operation__overlay"><div className="ice-operation__result" role="dialog" aria-modal="true">
      <h2>{run.phase === 'clear' ? 'Stage Clear!' : '기지가 멈췄어요'}</h2>
      <p>생산 {run.produced} / {ICE_STAGE_1.target} · 해결 {run.repaired}번 · {Math.round(run.elapsedSeconds)}초</p>
      <div><button type="button" onClick={() => onRetry(run.phase === 'failure')}><RotateCcw aria-hidden="true" /> 다시 하기</button><button type="button" onClick={onExit}>모험맵으로</button></div>
    </div></div>}
  </section>;
}
