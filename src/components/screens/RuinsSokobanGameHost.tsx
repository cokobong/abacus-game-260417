import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, RotateCcw, Undo2 } from 'lucide-react';
import { ruinsSokobanAssets } from '../../assets/adventure/ruins';
import type { MinigameRunRewards } from '../../config/minigameConfig';
import type { SokobanDirection, SokobanPuzzleConfig } from '../../config/ruinsSokoban';
import type { RuinsSokobanController } from './ruinsSokoban/createRuinsSokobanGame';

interface RuinsSokobanGameHostProps {
  stageNumber: 1 | 2;
  runId: string;
  onExit: () => void;
  onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards;
  onRetry: (retryAfterFailure?: boolean) => void;
}

const EMPTY_MISSION: SokobanPuzzleConfig = {
  id: 'loading', stage: 1, mission: 1, title: '유적의 봉인문', instruction: '퍼즐을 준비하고 있어요.',
  board: [], completion: 'reachExit', highlights: [], showDeadlockHint: false,
};

export function RuinsSokobanGameHost({ stageNumber, runId, onExit, onFinishRun, onRetry }: RuinsSokobanGameHostProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<RuinsSokobanController | null>(null);
  const finishRef = useRef(onFinishRun);
  const committedRef = useRef(false);
  const blockedTimerRef = useRef<number | null>(null);
  const blockedShownRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [mission, setMission] = useState<SokobanPuzzleConfig>(EMPTY_MISSION);
  const [missionTotal, setMissionTotal] = useState(stageNumber === 1 ? 7 : 3);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [moves, setMoves] = useState(0);
  const [pushes, setPushes] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [feedback, setFeedback] = useState('탐험가를 움직여 유물 상자를 제단에 놓으세요.');
  const [stageComplete, setStageComplete] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState(false);
  const [blockedProminent, setBlockedProminent] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  finishRef.current = onFinishRun;

  useEffect(() => {
    let cancelled = false;
    const parent = parentRef.current;
    if (!parent) return;
    void import('./ruinsSokoban/createRuinsSokobanGame').then(({ createRuinsSokobanGame }) => {
      if (cancelled) return;
      controllerRef.current = createRuinsSokobanGame(parent, stageNumber, {
        onMissionChange: (config, total) => {
          blockedShownRef.current = false;
          setMission(config);
          setMissionTotal(total);
          setMoves(0);
          setPushes(0);
          setCanUndo(false);
          setFeedback(config.instruction);
          setHintStep(0);
          setTutorialOpen(config.stage === 1);
          setLoading(false);
        },
        onStateChange: (nextMoves, nextPushes, nextCanUndo) => {
          setMoves(nextMoves);
          setPushes(nextPushes);
          setCanUndo(nextCanUndo);
        },
        onBlocked: reason => {
          const prominent = stageNumber === 1 && !blockedShownRef.current;
          blockedShownRef.current = true;
          setFeedback(reason === 'box' ? '다른 상자가 막고 있어요.' : '앞이 막혀 있어 더는 밀 수 없어요.');
          setBlockedNotice(true);
          setBlockedProminent(prominent);
          if (blockedTimerRef.current !== null) window.clearTimeout(blockedTimerRef.current);
          blockedTimerRef.current = window.setTimeout(() => setBlockedNotice(false), prominent ? 1500 : 650);
        },
        onDeadlock: () => {
          const prominent = stageNumber === 1 && !blockedShownRef.current;
          blockedShownRef.current = true;
          setFeedback(stageNumber === 1 ? '구석에 들어가면 꺼내기 어려워요. 한 수 뒤로 돌아가요!' : '상자가 구석에 갇혔어요.');
          setBlockedNotice(true);
          setBlockedProminent(prominent);
          if (blockedTimerRef.current !== null) window.clearTimeout(blockedTimerRef.current);
          blockedTimerRef.current = window.setTimeout(() => setBlockedNotice(false), prominent ? 1500 : 650);
        },
        onStageComplete: () => {
          if (!committedRef.current) {
            committedRef.current = true;
            finishRef.current(runId, { coins: 0, rareFragments: 0, shopItems: [] });
          }
          setStageComplete(true);
        },
      });
    }).catch(error => {
      console.error('[Ruins Sokoban] Phaser load failed', error);
      setLoading(false);
      setFeedback('유적 퍼즐을 불러오지 못했어요.');
    });
    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
      if (blockedTimerRef.current !== null) window.clearTimeout(blockedTimerRef.current);
    };
  }, [runId, stageNumber]);

  const closeTutorial = () => {
    setTutorialOpen(false);
    controllerRef.current?.setEnabled(true);
  };
  const move = (direction: SokobanDirection) => controllerRef.current?.move(direction);
  const reset = () => {
    setFeedback('처음 상태로 돌아갔어요.');
    setBlockedNotice(false);
    controllerRef.current?.reset();
  };
  const showHint = () => {
    const hints = mission.tutorial?.hintSteps ?? [];
    if (hints.length === 0) return;
    setFeedback(hints[hintStep % hints.length]);
    setHintStep(step => (step + 1) % hints.length);
  };

  return (
    <section className="ruins-sokoban-shell" aria-label="오래된 유적지 상자 밀기 퍼즐">
      <header className="ruins-sokoban-hud">
        <button type="button" onClick={onExit}><ChevronLeft aria-hidden="true" /> 지도</button>
        <div>
          <strong>STAGE {stageNumber} · MISSION {mission.mission}/{missionTotal}</strong>
          <span>{mission.title}</span>
          <small>이동 {moves} · 밀기 {pushes}</small>
        </div>
        <div className="ruins-sokoban-tools">
          <button className={stageNumber === 1 && blockedNotice ? 'is-highlighted' : undefined} type="button" onClick={() => controllerRef.current?.undo()} disabled={!canUndo || tutorialOpen || stageComplete}><Undo2 aria-hidden="true" /> 한 수 뒤로</button>
          <button type="button" onClick={reset} disabled={tutorialOpen || stageComplete}><RotateCcw aria-hidden="true" /> 처음부터</button>
          <button type="button" onClick={showHint} disabled={tutorialOpen || stageComplete || !mission.tutorial?.hintSteps.length}>힌트</button>
        </div>
      </header>

      <div className="ruins-sokoban-canvas" ref={parentRef} aria-hidden="true" />
      <div className="ruins-sokoban-feedback" role="status">{feedback}</div>
      {blockedNotice && (
        <button
          className={`ruins-sokoban-cannot-push${stageNumber === 2 || !blockedProminent ? ' is-toast' : ''}`}
          type="button"
          aria-label="더는 밀 수 없어요. 안내 닫기"
          onClick={() => setBlockedNotice(false)}
        >
          <img src={ruinsSokobanAssets.ui.cannotPushPopup} alt="더는 밀 수 없어요. 앞이 막혀 있어요." />
        </button>
      )}

      <nav className={`ruins-sokoban-dpad${stageNumber === 1 && mission.tutorial?.suggestedDirection ? ` has-suggestion suggest-${mission.tutorial.suggestedDirection}` : ''}`} aria-label="탐험가 방향 조작">
        <button className="is-up" type="button" aria-label="위로 이동" onClick={() => move('up')}>▲</button>
        <button className="is-left" type="button" aria-label="왼쪽으로 이동" onClick={() => move('left')}>◀</button>
        <i aria-hidden="true">✦</i>
        <button className="is-right" type="button" aria-label="오른쪽으로 이동" onClick={() => move('right')}>▶</button>
        <button className="is-down" type="button" aria-label="아래로 이동" onClick={() => move('down')}>▼</button>
      </nav>

      {loading && <div className="ruins-sokoban-overlay" role="status">유적의 방을 준비하고 있어요…</div>}
      {!loading && tutorialOpen && !stageComplete && (
        <div className="ruins-sokoban-tutorial-backdrop">
          <section className="ruins-sokoban-tutorial" role="dialog" aria-modal="true" aria-labelledby="sokoban-tutorial-title">
            <div className="ruins-sokoban-tutorial-picture" aria-hidden="true">
              <span className="is-explorer">🧭</span><b>➜</b><span className="is-box">▣</span><b>➜</b><span className="is-goal">✦</span>
            </div>
            <div>
              <small>MISSION {mission.mission}</small>
              <h2 id="sokoban-tutorial-title">{mission.title}</h2>
              <p>{mission.tutorial?.introText ?? mission.instruction}</p>
            </div>
            <button type="button" onClick={closeTutorial}>확인</button>
          </section>
        </div>
      )}
      {stageComplete && (
        <div className="ruins-sokoban-overlay">
          <section className="ruins-sokoban-result" role="dialog" aria-modal="true">
            <span>STAGE {stageNumber} CLEAR</span>
            <h2>{stageNumber === 1 ? '상자 밀기 규칙을 모두 배웠어요!' : '유적의 퍼즐을 모두 풀었어요!'}</h2>
            <p>시간제한과 실패 페널티 없이 다시 도전할 수 있어요.</p>
            <div>
              <button type="button" onClick={() => onRetry(false)}><RotateCcw aria-hidden="true" /> 다시 하기</button>
              <button type="button" onClick={onExit}>지도로</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
