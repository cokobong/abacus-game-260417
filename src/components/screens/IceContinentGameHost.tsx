import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import type { MinigameRunRewards } from '../../config/minigameConfig';
import { createIceInput, ICE_KEYBOARD_ACTIONS, type IceAction } from '../../config/iceContinent/input';
import { getIceMissionConfig, ICE_MISSION_CONFIGS, isPlayableIceMissionId, type PlayableIceMissionId } from '../../config/iceContinent/iceMissionConfigs';
import type { IceMissionId, IceTool } from '../../config/iceContinent/iceMissionTypes';
import type { createIceContinentGame, IceContinentController, IceIssueNavigation, IceMissionHud, IceTutorialPrompt } from './iceContinent/createIceContinentGame';

interface Props { runId: string; onExit: () => void; onFinishRun: (runId: string, rewards: MinigameRunRewards) => MinigameRunRewards; onRetry: (retryAfterFailure?: boolean) => void; missionId?: IceMissionId }
const TOOLS: { id: IceTool; icon: string; label: string; key: string }[] = [
  { id: 'toolRepair', icon: '🔧', label: '렌치', key: 'J' }, { id: 'toolHeat', icon: '♨', label: '열 도구', key: 'K' }, { id: 'toolElectric', icon: '⚡', label: '전기', key: 'L' },
];
const initialHud = (duration: number): IceMissionHud => ({ elapsed: 0, remaining: duration, progress: 0, visualState: 'raw', backlog: 0, backlogCapacity: 0, lost: 0, completed: 0, target: 1, selectedTool: 'toolRepair', highlightedTool: null, phase: 'playing', activeIssue: null, activeMachineName: null, surge: false, repaired: 0 });
const startPrompt = (config: ReturnType<typeof getIceMissionConfig>): IceTutorialPrompt | null => config ? { id: 'mission-start', title: config.tutorial.startTitle, body: config.tutorial.startBody, button: config.tutorial.startButton } : null;

export function IceContinentGameHost({ runId, onExit, onFinishRun, missionId }: Props) {
  const [selectedId, setSelectedId] = useState<PlayableIceMissionId>(() => {
    const queryMission = new URLSearchParams(window.location.search).get('iceMission');
    return missionId && isPlayableIceMissionId(missionId) ? missionId : isPlayableIceMissionId(queryMission) ? queryMission : '1-1';
  });
  const [runtimeEpoch, setRuntimeEpoch] = useState(0);
  const [completedMissionIds, setCompletedMissionIds] = useState<ReadonlySet<PlayableIceMissionId>>(() => new Set());
  const [collectedSampleIds, setCollectedSampleIds] = useState<ReadonlySet<string>>(() => new Set());
  const config = getIceMissionConfig(selectedId)!;
  const parentRef = useRef<HTMLDivElement>(null); const gameRef = useRef<IceContinentController | null>(null); const inputRef = useRef(createIceInput()); const committedRef = useRef(false); const finishRef = useRef(onFinishRun);
  const [hud, setHud] = useState(() => initialHud(config.durationSec)); const [feedback, setFeedback] = useState('빙하 기지를 준비하고 있어요.'); const [loading, setLoading] = useState(true); const [navigation, setNavigation] = useState<IceIssueNavigation>({ direction: null, layer: null }); finishRef.current = onFinishRun;
  const [tutorialPrompt, setTutorialPrompt] = useState<IceTutorialPrompt | null>(() => startPrompt(config));

  useEffect(() => {
    let cancelled = false; const parent = parentRef.current; if (!parent) return;
    setHud(initialHud(config.durationSec)); setTutorialPrompt(startPrompt(config)); setLoading(true);
    void import('./iceContinent/createIceContinentGame').then(({ createIceContinentGame }) => {
      if (cancelled) return; gameRef.current = createIceContinentGame(parent, inputRef.current, config, { onState: setHud, onFeedback: setFeedback, onNavigation: setNavigation, onTutorialPrompt: setTutorialPrompt, onClear: () => { setCompletedMissionIds(previous => new Set(previous).add(selectedId)); const sampleId = config.reward.type === 'sampleCollection' ? config.reward.id : null; if (sampleId) setCollectedSampleIds(previous => new Set(previous).add(sampleId)); }, onFailure: () => setFeedback('시간이 끝났어요. 생산 흐름을 다시 살려보세요!') }); setLoading(false);
    }).catch(error => { console.error('[Ice Continent] Phaser load failed', error); setLoading(false); setFeedback('게임을 불러오지 못했어요.'); });
    return () => { cancelled = true; gameRef.current?.destroy(); gameRef.current = null; inputRef.current.clearSource('keyboard'); inputRef.current.clearSource('touch'); };
  }, [config, runtimeEpoch, selectedId]);

  useEffect(() => {
    const keyTools: Record<string, IceTool> = { KeyJ: 'toolRepair', KeyK: 'toolHeat', KeyL: 'toolElectric' };
    const down = (event: KeyboardEvent) => { const tool = keyTools[event.code]; if (tool) { event.preventDefault(); if (!event.repeat) gameRef.current?.selectTool(tool); return; } const action = ICE_KEYBOARD_ACTIONS[event.code]; if (!action || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return; event.preventDefault(); inputRef.current.set('keyboard', action, true); };
    const up = (event: KeyboardEvent) => { const action = ICE_KEYBOARD_ACTIONS[event.code]; if (action) { event.preventDefault(); inputRef.current.set('keyboard', action, false); } };
    const blur = () => inputRef.current.clearSource('keyboard'); window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur); return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);
  const press = (action: IceAction) => (event: PointerEvent<HTMLButtonElement>) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); inputRef.current.set('touch', action, true); };
  const release = (action: IceAction) => (event: PointerEvent<HTMLButtonElement>) => { inputRef.current.set('touch', action, false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };
  const loadMission = (id: PlayableIceMissionId) => {
    gameRef.current?.destroy(); gameRef.current = null; inputRef.current.clearSource('keyboard'); inputRef.current.clearSource('touch');
    setHud(initialHud(ICE_MISSION_CONFIGS[id].durationSec)); setTutorialPrompt(startPrompt(ICE_MISSION_CONFIGS[id])); setFeedback('다음 복원 작업을 준비하고 있어요.'); setNavigation({ direction: null, layer: null }); setLoading(true);
    setSelectedId(id); setRuntimeEpoch(value => value + 1);
    const params = new URLSearchParams(window.location.search); params.set('iceMission', id); window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
  };
  const restartCurrent = () => loadMission(selectedId);
  const nextMission = () => { const nextId = config.nextMissionId; if (nextId && isPlayableIceMissionId(nextId)) loadMission(nextId); };
  const finishStage = () => { if (config.stage === 1 && !committedRef.current) { committedRef.current = true; finishRef.current(runId, { coins: 0, rareFragments: 0, shopItems: [] }); } onExit(); };
  const closeTutorial = () => { if (loading || !tutorialPrompt) return; if (tutorialPrompt.id === 'mission-start') gameRef.current?.startMission(); else gameRef.current?.acknowledgeTutorial(); setTutorialPrompt(null); };
  const time = `${String(Math.floor(hud.remaining / 60)).padStart(2, '0')}:${String(hud.remaining % 60).padStart(2, '0')}`;

  return <section className="ice-operation" aria-label={`얼음대륙 ${config.id} ${config.title}`}>
    <header className="ice-operation__hud"><button type="button" onClick={onExit}><ChevronLeft aria-hidden="true" /> 지도</button><div><strong>{config.id} · {config.title}</strong><b>{config.production.arcadeLoop ? `완성 ${hud.completed}/${hud.target}` : `복원 ${Math.floor(hud.progress * 100)}%`} · {time}</b></div><span className={hud.backlog >= hud.backlogCapacity && hud.backlog > 0 ? 'is-danger' : ''}>{hud.backlog ? `대기 ${hud.backlog}/${hud.backlogCapacity}${hud.lost ? ` · 손실 ${hud.lost}` : ''}` : hud.activeIssue ? `! ${hud.activeMachineName}` : hud.surge ? '⚡ 재가동 가속!' : '⚙ 생산 중'}</span></header>
    <div className="ice-operation__mission-tabs" aria-label={`Stage ${config.stage} 미션 선택`}>{(Object.keys(ICE_MISSION_CONFIGS) as PlayableIceMissionId[]).filter(id => ICE_MISSION_CONFIGS[id].stage === config.stage).map(id => <button key={id} type="button" aria-current={selectedId === id ? 'page' : undefined} onClick={() => loadMission(id)}>{id} {ICE_MISSION_CONFIGS[id].title}</button>)}</div>
    {hud.activeIssue && <div className="ice-operation__direction" role="status">{navigation.direction === 'left' ? '← ! 왼쪽' : navigation.direction === 'right' ? '! → 오른쪽' : `${hud.activeMachineName}가 화면에 보여요`}{navigation.layer === 'upper' ? ' · 위층' : navigation.layer === 'lower' ? ' · 아래층' : ''}</div>}
    <div className="ice-operation__canvas" ref={parentRef} aria-hidden="true" />
    <div className="ice-operation__feedback" role="status">{feedback}</div><small className="ice-operation__keys">{config.stage === 2 ? '이동 WASD · 근처에서 Space 또는 수리 버튼' : '이동 WASD · 도구 J/K/L · 근처에서 도구를 다시 누르면 수리'}</small>
    <nav className="ice-operation__controls" aria-label="기지 터치 조작"><div className="ice-operation__dpad" role="group" aria-label="방향 조작">
      <button type="button" className="ice-operation__up" aria-label="사다리 오르기" onPointerDown={press('up')} onPointerUp={release('up')} onPointerCancel={release('up')}>↑</button><button type="button" className="ice-operation__left" aria-label="왼쪽 이동" onPointerDown={press('left')} onPointerUp={release('left')} onPointerCancel={release('left')}>←</button><span className="ice-operation__dpad-center" aria-hidden="true" /><button type="button" className="ice-operation__right" aria-label="오른쪽 이동" onPointerDown={press('right')} onPointerUp={release('right')} onPointerCancel={release('right')}>→</button><button type="button" className="ice-operation__down" aria-label="사다리 내리기" onPointerDown={press('down')} onPointerUp={release('down')} onPointerCancel={release('down')}>↓</button>
    </div>{config.id === '1-1' ? hud.progress === 0 && <button type="button" className="ice-operation__action" onPointerDown={press('actionA')} onPointerUp={release('actionA')} onPointerCancel={release('actionA')}>초록 레버<br />켜기</button> : config.stage === 2 ? <button type="button" className="ice-operation__action ice-operation__repair" onClick={() => gameRef.current?.repair()}>🔧<br />수리</button> : <div className="ice-operation__tools">{TOOLS.map(tool => <button key={tool.id} type="button" className={`${hud.selectedTool === tool.id ? 'is-selected' : ''} ${hud.highlightedTool === tool.id ? 'is-tutorial-highlight' : ''}`} aria-pressed={hud.selectedTool === tool.id} onClick={() => gameRef.current?.selectTool(tool.id)}><b>{tool.icon}</b><small>{tool.label} {tool.key}</small></button>)}</div>}</nav>
    {loading && <div className="ice-operation__overlay" role="status">빙하 기지를 준비하고 있어요…</div>}
    {hud.phase !== 'playing' && <div className="ice-operation__overlay"><div className="ice-operation__result" role="dialog" aria-modal="true"><h2>{hud.phase === 'clear' ? config.tutorial.completionMessage : '시간 종료'}</h2><p>{config.title} · 복원 {Math.floor(hud.progress * 100)}% · 해결 {hud.repaired}번{hud.phase === 'clear' ? ` · Stage ${config.stage} 완료 ${[...completedMissionIds].filter(id => ICE_MISSION_CONFIGS[id].stage === config.stage).length}/${config.stage === 1 ? 3 : 4}` : ''}{config.reward.type === 'sampleCollection' && collectedSampleIds.has(config.reward.id) ? ' · 표본 등록' : ''}</p><div>{hud.phase === 'clear' ? <button type="button" onClick={config.nextMissionId ? nextMission : finishStage}>{config.nextMissionId ? '다음 미션' : `Stage ${config.stage} 완료`}</button> : <button type="button" onClick={restartCurrent}><RotateCcw aria-hidden="true" /> 다시 도전</button>}<button type="button" onClick={onExit}>미션 목록</button></div></div></div>}
    {tutorialPrompt && <div className="ice-operation__tutorial-dim"><div className="ice-operation__tutorial-popup" role="dialog" aria-modal="true" aria-labelledby="ice-tutorial-title"><div className="ice-operation__tutorial-icon" aria-hidden="true">{tutorialPrompt.id === 'first-freeze' ? '🧊♨️' : tutorialPrompt.id === 'first-penguin' ? '🐧' : '🦴✨'}</div><h2 id="ice-tutorial-title">{tutorialPrompt.title}</h2><p>{tutorialPrompt.body}</p><button type="button" disabled={loading} onClick={closeTutorial}>{tutorialPrompt.button}</button></div></div>}
  </section>;
}
