import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import type { MinigameRunRewards } from '../../config/minigameConfig';
import type { DeepSeaDirection, DeepSeaDiscoveryKind } from '../../config/deepSea';
import type { DeepSeaGameController } from './deepSea/createDeepSeaGame';

interface DeepSeaGameHostProps {
  stageNumber: 1 | 2;
  runId: string;
  onExit: () => void;
  onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards;
  onRetry: (retryAfterFailure?: boolean) => void;
}

const OBJECTIVES: ReadonlyArray<{ id: DeepSeaDiscoveryKind; label: string }> = [
  { id: 'coral', label: '산호 군락 발견' },
  { id: 'statue', label: '오래된 석상 발견' },
  { id: 'chest', label: '보물상자 열기' },
];

export function DeepSeaGameHost({ stageNumber, runId, onExit, onFinishRun, onRetry }: DeepSeaGameHostProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<DeepSeaGameController | null>(null);
  const rewardCoinsRef = useRef(0);
  const committedRef = useRef(false);
  const finishRef = useRef(onFinishRun);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(3);
  const [discoveries, setDiscoveries] = useState<DeepSeaDiscoveryKind[]>([]);
  const [exitUnlocked, setExitUnlocked] = useState(false);
  const [outcome, setOutcome] = useState<'playing' | 'clear' | 'failure'>('playing');
  const [feedback, setFeedback] = useState(stageNumber === 1 ? '26×26 심해 지도를 탐험해 보세요.' : '36×36 깊은 물길을 소나와 함께 탐험해 보세요.');
  const [sonarUses, setSonarUses] = useState(stageNumber === 2 ? 3 : 0);
  const [rewardCoins, setRewardCoins] = useState(0);
  const [bonusPickups, setBonusPickups] = useState(0);
  finishRef.current = onFinishRun;

  useEffect(() => {
    let cancelled = false;
    const parent = parentRef.current;
    if (!parent) return;
    void import('./deepSea/createDeepSeaGame').then(({ createDeepSeaGame }) => {
      if (cancelled) return;
      controllerRef.current = createDeepSeaGame(parent, stageNumber, {
        onDiscovery: (id, label, rewardCoins) => {
          setDiscoveries(current => current.includes(id) ? current : [...current, id]);
          rewardCoinsRef.current += rewardCoins;
          setRewardCoins(rewardCoinsRef.current);
          setFeedback(rewardCoins > 0 ? `${label} 열기! 코인 +${rewardCoins}` : `${label} 발견!`);
        },
        onPickup: (kind, label, pickedCoins) => {
          rewardCoinsRef.current += pickedCoins;
          setRewardCoins(rewardCoinsRef.current);
          setBonusPickups(count => count + 1);
          setFeedback(kind === 'repair' ? `${label}! 하트를 회복했어요.` : kind === 'sonar' ? `${label}! 소나를 충전했어요.` : `${label}! 코인 +${pickedCoins}`);
        },
        onHealthChange: setHealth,
        onExitUnlocked: () => {
          setExitUnlocked(true);
          setFeedback('탐사 목표 달성! 출구가 활성화됐어요.');
        },
        onStageClear: () => {
          if (!committedRef.current) {
            committedRef.current = true;
            finishRef.current(runId, { coins: rewardCoinsRef.current, rareFragments: 0, shopItems: [] });
          }
          setOutcome('clear');
        },
        onFailure: () => setOutcome('failure'),
        onSonarUsesChange: setSonarUses,
      });
      setLoading(false);
    }).catch(error => {
      console.error('[Deep Sea] Phaser load failed', error);
      setLoading(false);
      setFeedback('심해 지도를 불러오지 못했어요.');
    });
    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [runId, stageNumber]);

  const press = (direction: DeepSeaDirection) => (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    controllerRef.current?.setDirection(direction);
  };
  const release = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    controllerRef.current?.setDirection(null);
  };

  return (
    <section className="deep-sea-game" aria-label="심해협곡 탐험">
      <header className="deep-sea-hud">
        <button type="button" onClick={onExit}><ChevronLeft aria-hidden="true" /> 지도</button>
        <div className="deep-sea-status">
          <strong>STAGE {stageNumber} · {stageNumber === 1 ? '바다 입구' : '깊은 물길'}</strong>
          <span aria-label={`하트 ${health}개`}>{'♥'.repeat(health)}{'♡'.repeat(3 - health)}</span>
          <b>코인 {rewardCoins} · 보너스 {bonusPickups}</b>
        </div>
        <div className="deep-sea-actions">
          <div className={exitUnlocked ? 'deep-sea-exit is-open' : 'deep-sea-exit'}>
            출구 {exitUnlocked ? '열림' : '잠김'}
          </div>
          {stageNumber === 2 && (
            <button type="button" disabled={sonarUses === 0 || outcome !== 'playing'} onClick={() => {
              if (controllerRef.current?.useSonar()) setFeedback('소나가 주변의 길과 물체를 잠시 밝혔어요.');
            }}>소나 {sonarUses}/3</button>
          )}
        </div>
      </header>

      <aside className="deep-sea-objectives" aria-label="탐사 목표">
        <strong>탐사 목표 {discoveries.length}/3 · {stageNumber === 2 ? '모두 찾으면' : '2개 완료 시'} 출구 개방</strong>
        <div>{OBJECTIVES.map(item => <span key={item.id} className={discoveries.includes(item.id) ? 'is-done' : ''}>{discoveries.includes(item.id) ? '✓' : '□'} {item.label}</span>)}</div>
      </aside>

      <div className="deep-sea-canvas" ref={parentRef} aria-hidden="true" />
      <div className="deep-sea-feedback" role="status">{feedback}</div>

      <nav className="deep-sea-dpad" aria-label="잠수정 방향 조작">
        <button className="is-up" aria-label="위로 이동" onPointerDown={press('up')} onPointerUp={release} onPointerCancel={release}>▲</button>
        <button className="is-left" aria-label="왼쪽으로 이동" onPointerDown={press('left')} onPointerUp={release} onPointerCancel={release}>◀</button>
        <i aria-hidden="true" />
        <button className="is-right" aria-label="오른쪽으로 이동" onPointerDown={press('right')} onPointerUp={release} onPointerCancel={release}>▶</button>
        <button className="is-down" aria-label="아래로 이동" onPointerDown={press('down')} onPointerUp={release} onPointerCancel={release}>▼</button>
      </nav>

      {loading && <div className="deep-sea-overlay" role="status">심해 지도를 준비하고 있어요…</div>}
      {outcome !== 'playing' && (
        <div className="deep-sea-overlay">
          <section className="deep-sea-result" role="dialog" aria-modal="true">
            <span>{outcome === 'clear' ? `STAGE ${stageNumber} CLEAR` : 'EXPLORATION ENDED'}</span>
            <h2>{outcome === 'clear' ? '심해 탐사를 완료했어요!' : '잠수정의 하트가 모두 사라졌어요'}</h2>
            <p>발견 {discoveries.length}/3 · 코인 {rewardCoins} · 보너스 {bonusPickups}</p>
            <div>
              <button type="button" onClick={() => onRetry(outcome === 'failure')}><RotateCcw aria-hidden="true" /> 다시 탐험</button>
              <button type="button" onClick={onExit}>지도로</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
