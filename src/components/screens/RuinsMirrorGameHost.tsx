import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { MinigameRunRewards } from '../../config/minigameConfig';
import { AdventureStageIntro } from '../AdventureStageIntro';
import type { RuinsMirrorGameController } from './ruinsMirror/createRuinsMirrorGame';

interface RuinsMirrorGameHostProps {
  stageNumber: 1 | 2;
  runId: string;
  onExit: () => void;
  onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards;
  onRetry: (retryAfterFailure?: boolean) => void;
}

export function RuinsMirrorGameHost({ stageNumber, runId, onExit, onFinishRun, onRetry }: RuinsMirrorGameHostProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<RuinsMirrorGameController | null>(null);
  const committedRef = useRef(false);
  const finishRunRef = useRef(onFinishRun);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [stageComplete, setStageComplete] = useState(false);
  const [mission, setMission] = useState({ number: 1, title: '첫 번째 빛', instruction: '거울을 눌러 빛을 제단까지 연결해요.' });
  const [mirrorInventory, setMirrorInventory] = useState<{ remaining: number; total: number } | null>(null);
  finishRunRef.current = onFinishRun;

  useEffect(() => {
    let cancelled = false;
    if (!parentRef.current) return;
    const parent = parentRef.current;
    void import('./ruinsMirror/createRuinsMirrorGame').then(({ createRuinsMirrorGame }) => {
      if (cancelled) return;
      controllerRef.current = createRuinsMirrorGame(parent, stageNumber, {
        onMissionChange: (number, title, instruction) => {
          setMission({ number, title, instruction });
          setLoading(false);
        },
        onInventoryChange: (remaining, total) => setMirrorInventory({ remaining, total }),
        onStageComplete: () => {
          if (!committedRef.current) {
            committedRef.current = true;
            finishRunRef.current(runId, { coins: 0, rareFragments: 0, shopItems: [] });
          }
          setStageComplete(true);
        },
      });
    }).catch(error => {
      console.error('[Ruins Mirror] Phaser load failed', error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [runId, stageNumber]);

  return (
    <section className="ruins-mirror-shell" aria-label="오래된 유적지 빛 거울 퍼즐">
      <header className="ruins-mirror-hud">
        <button type="button" onClick={onExit} aria-label="모험 지도로 돌아가기">지도</button>
        <div>
          <strong>STAGE {stageNumber} · MISSION {mission.number}/4</strong>
          <span>{mission.title}</span>
        </div>
        <button type="button" onClick={() => controllerRef.current?.resetMission()} disabled={!started || stageComplete} aria-label="현재 미션 처음부터">
          <RotateCcw aria-hidden="true" /> 리셋
        </button>
      </header>
      <div className="ruins-mirror-instruction" role="status">{mission.instruction}</div>
      <div className="ruins-mirror-canvas" ref={parentRef} aria-hidden="true" />
      <footer className="ruins-mirror-footer">
        <span>{stageNumber === 2 && mirrorInventory ? `남은 거울 ${mirrorInventory.remaining}/${mirrorInventory.total}` : '거울을 터치하면 90° 돌아가요.'}</span>
        {stageNumber === 2 && <span>빈 슬롯: 설치 · 거울: 회전 · −: 회수</span>}
        <span>시간제한 · 실패 페널티 없음</span>
      </footer>
      {loading && <div className="ruins-mirror-overlay" role="status">유적의 빛을 준비하고 있어요...</div>}
      {!loading && !started && (
        <AdventureStageIntro
          config={{ stage: stageNumber, title: stageNumber === 1 ? '빛의 입구' : '봉인의 회랑', instruction: stageNumber === 1 ? '거울을 터치해 빛을 제단까지 연결해요!' : '돌기둥을 피해 빛을 제단까지 연결해요!', theme: 'ruins' }}
          onStart={() => setStarted(true)}
        />
      )}
      {stageComplete && (
        <div className="ruins-mirror-overlay">
          <section className="ruins-mirror-complete" role="dialog" aria-modal="true" aria-labelledby="ruins-stage-clear-title">
            <span>STAGE {stageNumber} CLEAR</span>
            <h2 id="ruins-stage-clear-title">{stageNumber === 1 ? '태양 제단이 깨어났어요!' : '봉인의 회랑을 밝혔어요!'}</h2>
            <p>네 개의 빛길을 모두 연결했어요.</p>
            <div>
              <button type="button" onClick={() => onRetry(false)}>다시 해보기</button>
              <button type="button" onClick={onExit}>모험 지도로</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
