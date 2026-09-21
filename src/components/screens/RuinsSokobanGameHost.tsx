import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, LockKeyhole, RotateCcw, Undo2 } from 'lucide-react';
import { ruinsSokobanAssets } from '../../assets/adventure/ruins';
import type { MinigameRunRewards } from '../../config/minigameConfig';
import { getRuinsSokobanMissions, type SokobanDirection, type SokobanPuzzleConfig, type SokobanRuntimeSnapshot } from '../../config/ruinsSokoban';
import { REGION_RELICS } from '../../config/regionalRelicConfig';
import type { RuinsSokobanController } from './ruinsSokoban/createRuinsSokobanGame';
import { firstUnclearedRuinsMission, isRuinsMissionUnlocked, type RuinsMissionCompletionResult } from '../../utils/ruinsSokobanProgress';
import { saveRuinsSokobanDebugStat, type RuinsSokobanDebugStat } from '../../utils/ruinsSokobanDebugStats';
import { getRuinsSokobanHintContextKey, resolveRuinsSokobanHint } from '../../utils/ruinsSokobanHints';

interface RuinsSokobanGameHostProps {
  stageNumber: 1 | 2 | 3;
  runId: string;
  onExit: () => void;
  onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards;
  onRetry: (retryAfterFailure?: boolean) => void;
  clearedMissionIds: readonly string[];
  relicPartIds: readonly string[];
  onMissionComplete: (missionId: string) => RuinsMissionCompletionResult | undefined;
}

const EMPTY_MISSION: SokobanPuzzleConfig = {
  id: 'loading', stage: 1, mission: 1, title: '유적의 봉인문', instruction: '퍼즐을 준비하고 있어요.',
  board: [], completion: 'reachExit', highlights: [], showDeadlockHint: false,
};

export function RuinsSokobanGameHost({ stageNumber, runId, onExit, onFinishRun, onRetry, clearedMissionIds, relicPartIds, onMissionComplete }: RuinsSokobanGameHostProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<RuinsSokobanController | null>(null);
  const finishRef = useRef(onFinishRun);
  const missionCompleteRef = useRef(onMissionComplete);
  const clearedRef = useRef(clearedMissionIds);
  const statRef = useRef<RuinsSokobanDebugStat | null>(null);
  const startedAtRef = useRef(0);
  const committedRef = useRef(false);
  const blockedTimerRef = useRef<number | null>(null);
  const blockedShownRef = useRef(false);
  const hintContextRef = useRef('');
  const resetCountsRef = useRef<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [mission, setMission] = useState<SokobanPuzzleConfig>(EMPTY_MISSION);
  const [missionTotal, setMissionTotal] = useState(stageNumber === 1 ? 7 : stageNumber === 2 ? 10 : 20);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [moves, setMoves] = useState(0);
  const [pushes, setPushes] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [feedback, setFeedback] = useState('탐험가를 움직여 유물 상자를 제단에 놓으세요.');
  const [stageComplete, setStageComplete] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState(false);
  const [blockedProminent, setBlockedProminent] = useState(false);
  const [hintStep, setHintStep] = useState(0);
  const [runtimeSnapshot, setRuntimeSnapshot] = useState<SokobanRuntimeSnapshot | null>(null);
  const [hintUndoHighlighted, setHintUndoHighlighted] = useState(false);
  const [missionListOpen, setMissionListOpen] = useState(stageNumber === 3);
  const [missionClear, setMissionClear] = useState<{ result?: RuinsMissionCompletionResult; missionNumber: number } | null>(null);
  finishRef.current = onFinishRun;
  missionCompleteRef.current = onMissionComplete;
  clearedRef.current = clearedMissionIds;
  const saveStat = () => {
    if (!statRef.current) return;
    statRef.current.elapsedSeconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
    saveRuinsSokobanDebugStat(statRef.current);
  };

  useEffect(() => {
    let cancelled = false;
    const parent = parentRef.current;
    if (!parent) return;
    const statsInterval = stageNumber >= 2 ? window.setInterval(saveStat, 1000) : null;
    void import('./ruinsSokoban/createRuinsSokobanGame').then(({ createRuinsSokobanGame }) => {
      if (cancelled) return;
      const debugMission = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get('ruins-mission')?.replace('3-', '')) : NaN;
      const debugIndex = stageNumber === 3 && Number.isInteger(debugMission) && debugMission >= 1 && debugMission <= 20 ? debugMission - 1 : -1;
      const unclearedIndex = stageNumber === 1 ? 0 : firstUnclearedRuinsMission(clearedRef.current, stageNumber);
      const startIndex = debugIndex >= 0 ? debugIndex : unclearedIndex < 0 ? 0 : unclearedIndex;
      if (debugIndex >= 0) setMissionListOpen(false);
      controllerRef.current = createRuinsSokobanGame(parent, stageNumber, {
        onMissionComplete: id => {
          if (stageNumber === 1) return;
          if (statRef.current?.missionId === id) { statRef.current.cleared = true; saveStat(); }
          const result = missionCompleteRef.current(id);
          if (result) clearedRef.current = result.clearedMissionIds;
          delete resetCountsRef.current[id];
          if (stageNumber === 3) {
            console.info('[Ruins Sokoban] mission clear', id);
            setMissionClear({ result, missionNumber: Number(id.split('-').at(-1)) });
          }
        },
        onMissionChange: (config, total) => {
          if (stageNumber >= 2) {
            saveStat();
            statRef.current = { missionId: config.id, elapsedSeconds: 0, undoCount: 0, resetCount: 0, hintLevel: 0, cleared: false };
            startedAtRef.current = Date.now();
            saveStat();
          }
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
          if (stageNumber === 3) console.info('[Ruins Sokoban] mission start', config.id);
        },
        onStateChange: (nextMoves, nextPushes, nextCanUndo, snapshot) => {
          setMoves(nextMoves);
          setPushes(nextPushes);
          setCanUndo(nextCanUndo);
          setRuntimeSnapshot(snapshot);
          const contextKey = getRuinsSokobanHintContextKey(snapshot);
          if (hintContextRef.current !== contextKey) {
            hintContextRef.current = contextKey;
            setHintStep(0);
            setHintUndoHighlighted(false);
          }
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
          if (stageNumber === 3) setHintUndoHighlighted(true);
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
      }, startIndex < 0 ? 0 : startIndex);
    }).catch(error => {
      console.error('[Ruins Sokoban] Phaser load failed', error);
      setLoading(false);
      setFeedback('유적 퍼즐을 불러오지 못했어요.');
    });
    return () => {
      cancelled = true;
      if (statsInterval !== null) window.clearInterval(statsInterval);
      controllerRef.current?.destroy();
      saveStat();
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
    if (stageNumber >= 2 && statRef.current) { statRef.current.resetCount += 1; saveStat(); }
    if (stageNumber === 3) console.info('[Ruins Sokoban] reset', mission.id);
    if (stageNumber === 3) resetCountsRef.current[mission.id] = (resetCountsRef.current[mission.id] ?? 0) + 1;
    setFeedback('처음 상태로 돌아갔어요.');
    setBlockedNotice(false);
    controllerRef.current?.reset();
  };
  const showHint = () => {
    const hints = mission.tutorial?.hintSteps ?? [];
    if (hints.length === 0) return;
    if (stageNumber >= 2 && statRef.current) { statRef.current.hintLevel = Math.max(statRef.current.hintLevel, Math.min(hintStep + 1, hints.length)); saveStat(); }
    if (stageNumber === 3) console.info('[Ruins Sokoban] hint', mission.id, Math.min(hintStep + 1, hints.length));
    if (stageNumber === 3 && runtimeSnapshot) {
      const result = resolveRuinsSokobanHint(mission, runtimeSnapshot, hintStep, canUndo, resetCountsRef.current[mission.id] ?? 0);
      setFeedback(result.message);
      setHintUndoHighlighted(result.emphasizeUndo);
      if (result.visualTarget) controllerRef.current?.showHintMarker(result.visualTarget, result.direction);
      if (result.kind !== 'deadlock') setHintStep(step => Math.min(step + 1, 2));
    } else {
      setFeedback(hints[Math.min(hintStep, hints.length - 1)]);
      setHintStep(step => Math.min(step + 1, hints.length - 1));
    }
  };
  const stage3Missions = stageNumber === 3 ? getRuinsSokobanMissions(3) : [];
  const stage3Cleared = stage3Missions.filter(item => clearedMissionIds.includes(item.id)).length;
  const chooseMission = (index: number) => {
    if (!isRuinsMissionUnlocked(clearedRef.current, index) && !clearedRef.current.includes(stage3Missions[index]?.id)) return;
    setMissionClear(null);
    setMissionListOpen(false);
    setStageComplete(false);
    controllerRef.current?.selectMission(index);
  };
  const nextStage3Mission = () => {
    setMissionClear(null);
    if (!controllerRef.current?.nextMission()) {
      if (!committedRef.current) {
        committedRef.current = true;
        finishRef.current(runId, { coins: 0, rareFragments: 0, shopItems: [] });
      }
      setStageComplete(true);
    }
  };
  const awardedPart = missionClear?.result?.awardedPartId
    ? REGION_RELICS.ancientRuins.parts.find(part => part.id === missionClear.result?.awardedPartId)
    : undefined;

  return (
    <section className="ruins-sokoban-shell" aria-label="오래된 유적지 상자 밀기 퍼즐">
      <header className="ruins-sokoban-hud">
        <button type="button" onClick={onExit}><ChevronLeft aria-hidden="true" /> 지도</button>
        <div>
          <strong>{stageNumber === 3 ? `유적 심층 · ${stage3Cleared} / ${missionTotal}` : `STAGE ${stageNumber} · MISSION ${mission.mission}/${missionTotal}`}</strong>
          <span>{mission.title}</span>
          {stageNumber !== 3 && <small>이동 {moves} · 밀기 {pushes}</small>}
        </div>
        <div className="ruins-sokoban-tools">
          <button className={(stageNumber === 1 && blockedNotice) || hintUndoHighlighted ? 'is-highlighted' : undefined} type="button" onClick={() => { if (stageNumber >= 2 && statRef.current) { statRef.current.undoCount += 1; saveStat(); } setHintUndoHighlighted(false); controllerRef.current?.undo(); }} disabled={!canUndo || tutorialOpen || stageComplete || missionListOpen || Boolean(missionClear)}><Undo2 aria-hidden="true" /> 한 수 뒤로</button>
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
      {stageNumber === 3 && missionListOpen && !loading && (
        <div className="ruins-sokoban-overlay">
          <section className="ruins-sokoban-mission-list" role="dialog" aria-modal="true" aria-label="유적 심층 퍼즐 목록">
            <h2>유적 심층</h2><p>{stage3Cleared} / {missionTotal}</p>
            <div>{stage3Missions.map((item, index) => { const complete = clearedMissionIds.includes(item.id); const unlocked = complete || isRuinsMissionUnlocked(clearedMissionIds, index); return <button key={item.id} type="button" disabled={!unlocked} onClick={() => chooseMission(index)}><b>3-{index + 1}</b><span>{complete ? '✓ 완료' : unlocked ? '▶ 도전' : <><LockKeyhole aria-hidden="true" /> 잠금</>}</span></button>; })}</div>
            <button type="button" onClick={onExit}>지도로</button>
          </section>
        </div>
      )}
      {stageNumber === 3 && missionClear && !missionListOpen && (
        <div className="ruins-sokoban-overlay">
          <section className="ruins-sokoban-result" role="dialog" aria-modal="true">
            <span>{awardedPart ? '유적이 반응합니다' : 'PUZZLE CLEAR'}</span>
            {awardedPart ? <><h2>유물 조각 발견!</h2><img className="ruins-sokoban-relic" src={awardedPart.image} alt={awardedPart.name} /><p>{awardedPart.name} · {relicPartIds.includes(awardedPart.id) ? relicPartIds.length : relicPartIds.length + 1} / 5</p></> : <><h2>퍼즐을 해결했어요!</h2><p>다음 유적의 방이 열렸어요.</p></>}
            <div><button type="button" onClick={nextStage3Mission}>{missionClear.missionNumber < missionTotal ? '다음 퍼즐' : '현재 발견된 퍼즐 완료'}</button><button type="button" onClick={() => { setMissionClear(null); setMissionListOpen(true); }}>퍼즐 목록</button></div>
          </section>
        </div>
      )}
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
            <h2>{stageNumber === 1 ? '상자 밀기 규칙을 모두 배웠어요!' : stageNumber === 3 ? '현재 발견된 유적 퍼즐을 모두 해결했어요!' : '유적의 퍼즐을 모두 풀었어요!'}</h2>
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
