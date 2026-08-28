import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Check, ChevronLeft, RotateCcw, Settings, X } from 'lucide-react';
import { lavaValleyAssets } from '../../assets/adventure/lava-valley';
import { getDinosaurSpecies } from '../../data/dinosaurSpecies';
import type { OwnedDinosaur } from '../../types/game';
import { getDinosaurImageForGrowthStage, getGrowthStageForLevel } from '../../utils/dinosaurGrowth';

type Operator = '+' | '-';
type DigitMode = 'oneDigit' | 'twoDigit';
type OperationMode = 'addition' | 'mixed';
type RunState = 'selecting' | 'running' | 'success' | 'failure';
type Operation = { operator: Operator; value: number };
type LavaStage = { id: number; options: Operation[] };
type LavaProblem = { startValue: number; targetValue: number; stages: LavaStage[] };
type LavaSettings = { stageCount: number; digitMode: DigitMode; operationMode: OperationMode };

const defaultSettings: LavaSettings = { stageCount: 3, digitMode: 'oneDigit', operationMode: 'addition' };
const initialProblem: LavaProblem = {
  startValue: 1,
  targetValue: 15,
  stages: [
    { id: 1, options: [{ operator: '+', value: 2 }, { operator: '+', value: 3 }, { operator: '+', value: 4 }] },
    { id: 2, options: [{ operator: '+', value: 3 }, { operator: '+', value: 4 }, { operator: '+', value: 5 }] },
    { id: 3, options: [{ operator: '+', value: 5 }, { operator: '+', value: 6 }, { operator: '+', value: 7 }] },
  ],
};

const operationKey = (operation: Operation) => `${operation.operator}${operation.value}`;
const applyOperation = (current: number, operation: Operation) => operation.operator === '+' ? current + operation.value : current - operation.value;
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

function buildProblem(settings: LavaSettings): LavaProblem {
  const [min, max] = settings.digitMode === 'oneDigit' ? [1, 9] : [10, 99];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const startValue = settings.digitMode === 'oneDigit' ? randomInt(1, 9) : randomInt(10, 99);
    const operators: Operator[] = Array.from({ length: settings.stageCount }, () => '+');
    if (settings.operationMode === 'mixed' && settings.stageCount > 1) {
      const subtractIndex = randomInt(0, settings.stageCount - 1);
      operators[subtractIndex] = '-';
      operators[(subtractIndex + 1) % settings.stageCount] = '+';
    } else if (settings.operationMode === 'mixed') {
      operators[0] = Math.random() < 0.5 ? '+' : '-';
    }
    let runningTotal = startValue;
    const answers: Operation[] = [];
    let valid = true;
    for (const operator of operators) {
      const allowedMax = operator === '-' ? Math.min(max, runningTotal - 1) : max;
      if (allowedMax < min) { valid = false; break; }
      const operation = { operator, value: randomInt(min, allowedMax) } satisfies Operation;
      runningTotal = applyOperation(runningTotal, operation);
      if (runningTotal <= 0) { valid = false; break; }
      answers.push(operation);
    }
    if (!valid || answers.length !== settings.stageCount) continue;
    const stages = answers.map((answer, index) => {
      const candidates = new Map<string, Operation>([[operationKey(answer), answer]]);
      while (candidates.size < 3) {
        const operator = settings.operationMode === 'addition' ? '+' : (Math.random() < 0.5 ? '+' : '-');
        const candidate = { operator, value: randomInt(min, max) } satisfies Operation;
        candidates.set(operationKey(candidate), candidate);
      }
      return { id: index + 1, options: shuffle([...candidates.values()]) };
    });
    return { startValue, targetValue: runningTotal, stages };
  }
  return initialProblem;
}

export interface LavaPathPrototypeProps { dinosaur: OwnedDinosaur; onExit: () => void }

export function LavaPathPrototype({ dinosaur, onExit }: LavaPathPrototypeProps) {
  const [settings, setSettings] = useState<LavaSettings>(defaultSettings);
  const [draftSettings, setDraftSettings] = useState<LavaSettings>(defaultSettings);
  const [problem, setProblem] = useState<LavaProblem>(initialProblem);
  const [selections, setSelections] = useState<Record<number, Operation>>({});
  const [runState, setRunState] = useState<RunState>('selecting');
  const [revealedStep, setRevealedStep] = useState(0);
  const [attempts, setAttempts] = useState(3);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const timersRef = useRef<number[]>([]);
  const orderedSelections = problem.stages.map((stage) => selections[stage.id]);
  const allSelected = orderedSelections.every(Boolean);
  const actualTotal = orderedSelections.reduce((total, operation) => operation ? applyOperation(total, operation) : total, problem.startValue);
  const isResolved = runState === 'success' || runState === 'failure';
  const canDepart = runState === 'selecting' && allSelected;
  const species = getDinosaurSpecies(dinosaur.speciesId);
  const dinosaurImage = useMemo(() => getDinosaurImageForGrowthStage(species?.images, getGrowthStageForLevel(dinosaur.level), species?.characterAsset), [dinosaur.level, species]);

  useEffect(() => () => clearAnimationTimers(), []);
  function clearAnimationTimers() { timersRef.current.forEach((timer) => window.clearTimeout(timer)); timersRef.current = []; }
  function resetRound(nextProblem: LavaProblem, nextSettings = settings) {
    clearAnimationTimers(); setSettings(nextSettings); setProblem(nextProblem); setSelections({}); setRunState('selecting'); setRevealedStep(0); setAttempts(3); setIsSettingsOpen(false);
  }
  function selectStone(stageId: number, operation: Operation) {
    if (runState === 'running' || runState === 'success') return;
    if (runState === 'failure') { setRunState('selecting'); setRevealedStep(0); }
    setSelections((current) => ({ ...current, [stageId]: operation }));
  }
  function startJourney() {
    if (!canDepart) return;
    clearAnimationTimers(); setRunState('running'); setRevealedStep(0);
    problem.stages.forEach((stage, index) => timersRef.current.push(window.setTimeout(() => setRevealedStep(stage.id), (index + 1) * 520)));
    timersRef.current.push(window.setTimeout(() => {
      setRevealedStep(problem.stages.length + 1);
      if (actualTotal === problem.targetValue) setRunState('success');
      else { setRunState('failure'); setAttempts((current) => current <= 1 ? 3 : current - 1); }
    }, (problem.stages.length + 1) * 520));
  }
  function openSettings() { if (runState !== 'running') { setDraftSettings(settings); setIsSettingsOpen(true); } }
  function applySettings() { resetRound(buildProblem(draftSettings), draftSettings); }
  function expressionText() {
    if (runState === 'selecting') return `${problem.startValue}${orderedSelections.map((operation) => operation ? ` ${operation.operator} ${operation.value}` : ' + ?').join('')} = ?`;
    const terms = orderedSelections.slice(0, Math.min(revealedStep, problem.stages.length)).map((operation) => operation ? ` ${operation.operator} ${operation.value}` : '').join('');
    return `${problem.startValue}${terms}${isResolved ? ` = ${actualTotal}` : ''}`;
  }
  const dinoStyle = { '--lava-progress': Math.min(revealedStep, problem.stages.length), '--lava-stage-count': problem.stages.length } as CSSProperties;
  const difference = actualTotal - problem.targetValue;

  return (
    <section className={`lava-path-game lava-path-game--${problem.stages.length}-stages relative h-full min-h-0 overflow-hidden`}>
      <img src={lavaValleyAssets.background} alt="" className="lava-path-game__background" aria-hidden="true" draggable={false} /><div className="lava-path-game__tint" aria-hidden="true" />
      <header className="lava-path-header relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pt-3 sm:px-5 sm:pt-5">
        <button type="button" onClick={onExit} className="lava-path-exit inline-flex min-h-12 w-fit items-center justify-center gap-1 rounded-[16px] border-[3px] border-amber-700 bg-gradient-to-b from-yellow-300 to-amber-400 px-3 text-sm font-black text-amber-950 shadow-[0_4px_0_#92400e] active:translate-y-1 active:shadow-none"><ChevronLeft className="h-5 w-5" /> 나가기</button>
        <h1 className="lava-wood-panel rounded-[18px] px-4 py-2 text-lg font-black text-amber-950 sm:px-6 sm:text-2xl">용암 계곡</h1>
        <button type="button" aria-label="게임 설정 열기" disabled={runState === 'running'} onClick={openSettings} className="lava-settings-button justify-self-end"><Settings className="h-6 w-6" /></button>
      </header>
      <section className="lava-goal-panel lava-wood-panel relative z-10 mx-auto mt-2 grid w-[min(88%,560px)] grid-cols-[1fr_auto_1fr] items-center px-4 py-2 text-center sm:mt-3">
        <div><span className="block rounded-full bg-emerald-600 px-2 text-xs font-black text-white">시작</span><strong className="lava-goal-number text-3xl font-black text-emerald-800 sm:text-4xl">{problem.startValue}</strong></div>
        <div className="px-3"><span className="block text-xs font-black text-red-800">탐험 기회</span><span aria-label={`탐험 기회 ${attempts}개`} className="whitespace-nowrap text-lg text-red-600">{'♥'.repeat(attempts)}<span className="opacity-25">{'♥'.repeat(3 - attempts)}</span></span></div>
        <div><span className="block rounded-full bg-red-600 px-2 text-xs font-black text-white">목표</span><strong className="lava-goal-number text-3xl font-black text-red-700 sm:text-4xl">{problem.targetValue}</strong></div>
      </section>
      <div className="lava-path-playfield relative z-10 mx-auto mt-2 min-h-0 w-full max-w-[680px] flex-1 px-3 sm:px-5" style={{ '--lava-stage-count': problem.stages.length } as CSSProperties}>
        <div className={`lava-treasure ${runState === 'success' ? 'lava-treasure--active' : ''} ${runState === 'failure' ? 'lava-treasure--locked' : ''}`} aria-label="도착 지점">
          <img className="lava-treasure__rays" src={lavaValleyAssets.effects.treasureGoldenRays} alt="" aria-hidden="true" />
          <img className="lava-treasure__rock" src={lavaValleyAssets.platforms.destination} alt="" aria-hidden="true" />
          <img className="lava-treasure__reward" src={runState === 'success' ? lavaValleyAssets.rewards.treasureChestOpen : runState === 'failure' ? lavaValleyAssets.rewards.ruinDoorLocked : lavaValleyAssets.rewards.treasureChestClosed} alt="" aria-hidden="true" />
          <span>도착!</span>
        </div>
        {[...problem.stages].reverse().map((stage) => <div key={stage.id} className="lava-stage-row"><span className="lava-stage-label">{stage.id}단계</span><div className="grid grid-cols-3 gap-[clamp(.4rem,2vw,1rem)]">{stage.options.map((operation) => {
          const selected = selections[stage.id] && operationKey(selections[stage.id]) === operationKey(operation);
          const passed = selected && revealedStep >= stage.id;
          const resultClass = isResolved && passed ? (runState === 'success' ? 'lava-stone--correct' : 'lava-stone--wrong') : '';
          const platformImage = resultClass === 'lava-stone--correct' ? lavaValleyAssets.platforms.success : resultClass === 'lava-stone--wrong' ? lavaValleyAssets.platforms.failure : selected ? lavaValleyAssets.platforms.selected : lavaValleyAssets.platforms.default;
          return <button key={operationKey(operation)} type="button" aria-label={`${stage.id}단계 ${operation.operator === '+' ? '더하기' : '빼기'} ${operation.value} 발판`} aria-pressed={!!selected} disabled={runState === 'running' || runState === 'success'} onClick={() => selectStone(stage.id, operation)} className={`lava-stone ${selected ? 'lava-stone--selected' : ''} ${passed && !isResolved ? 'lava-stone--journey' : ''} ${resultClass}`}>
            <img className="lava-stone__asset" src={platformImage} alt="" aria-hidden="true" />
            {passed && runState === 'running' && revealedStep === stage.id && <img className="lava-stone__effect lava-stone__effect--landing" src={lavaValleyAssets.effects.landingImpactDust} alt="" aria-hidden="true" />}
            {resultClass === 'lava-stone--wrong' && <img className="lava-stone__effect lava-stone__effect--crack" src={lavaValleyAssets.effects.platformCrackOverlay} alt="" aria-hidden="true" />}
            {resultClass === 'lava-stone--correct' && <img className="lava-stone__effect lava-stone__effect--sparkles" src={lavaValleyAssets.effects.successSparkles} alt="" aria-hidden="true" />}
            <span className="lava-stone__value">{operation.operator}{operation.value}</span>{selected && <Check className="lava-stone__check h-4 w-4" />}
          </button>;
        })}</div></div>)}
        <div className={`lava-dinosaur-rock ${runState === 'failure' ? 'lava-dinosaur-rock--failure' : ''}`} style={dinoStyle} aria-label={`${dinosaur.name} 현재 위치`}>
          <img className="lava-dinosaur-rock__platform" src={lavaValleyAssets.platforms.start} alt="" aria-hidden="true" />
          <img className="lava-dinosaur-rock__shadow" src={lavaValleyAssets.effects.dinosaurContactShadow} alt="" aria-hidden="true" />
          {runState === 'running' && <img className="lava-dinosaur-rock__dust" src={lavaValleyAssets.effects.jumpTakeoffDust} alt="" aria-hidden="true" />}
          {dinosaurImage ? <img className="lava-dinosaur-rock__dinosaur" src={dinosaurImage} alt={dinosaur.name} draggable={false} /> : <span className="relative z-10 text-4xl">🦖</span>}
        </div>
      </div>
      <footer className="lava-path-footer relative z-10 px-3 pb-3 sm:px-5 sm:pb-5">
        <div key={`${runState}-${revealedStep}`} className="lava-equation-panel lava-equation-panel--reveal lava-wood-panel mx-auto max-w-[620px] px-3 py-2 text-center text-[clamp(1rem,4vw,2rem)] font-black text-amber-950">{expressionText()}</div>
        {runState === 'failure' && <p className="lava-result-message">목표는 {problem.targetValue}인데 {actualTotal}가 되었어요. {difference < 0 ? `목표보다 ${Math.abs(difference)}가 작아요.` : `목표보다 ${difference}가 커요.`}</p>}
        {runState === 'selecting' && <p className="mt-1 text-center text-xs font-black text-yellow-100 drop-shadow-[0_2px_1px_#7c2d12]">{allSelected ? '선택을 마쳤다면 출발해 보세요!' : '각 단계에서 발판을 하나씩 골라보세요!'}</p>}
        <button type="button" disabled={!canDepart} onClick={startJourney} className="lava-depart-button mx-auto mt-2 flex min-h-14 w-[min(72%,420px)] items-center justify-center rounded-[22px] border-4 px-5 text-xl font-black transition active:translate-y-1 disabled:cursor-not-allowed">출발!</button>
      </footer>
      {isSettingsOpen && <div className="lava-modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="lava-settings-title" className="lava-settings-panel">
        <div className="flex items-center justify-between"><h2 id="lava-settings-title" className="text-xl font-black text-amber-950">게임 설정</h2><button type="button" aria-label="설정 취소" onClick={() => setIsSettingsOpen(false)}><X /></button></div>
        <LavaSettingGroup label="발판 수" values={[1, 2, 3, 4]} selected={draftSettings.stageCount} format={(value) => `${value}개`} onSelect={(stageCount) => setDraftSettings((current) => ({ ...current, stageCount }))} />
        <LavaSettingGroup label="숫자 자릿수" values={['oneDigit', 'twoDigit'] as const} selected={draftSettings.digitMode} format={(value) => value === 'oneDigit' ? '한 자리' : '두 자리'} onSelect={(digitMode) => setDraftSettings((current) => ({ ...current, digitMode }))} />
        <LavaSettingGroup label="계산 방식" values={['addition', 'mixed'] as const} selected={draftSettings.operationMode} format={(value) => value === 'addition' ? '덧셈' : '덧셈·뺄셈 혼합'} onSelect={(operationMode) => setDraftSettings((current) => ({ ...current, operationMode }))} />
        <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => setIsSettingsOpen(false)} className="lava-modal-button lava-modal-button--cancel">취소</button><button type="button" onClick={applySettings} className="lava-modal-button lava-modal-button--apply">적용</button></div>
      </section></div>}
      {runState === 'success' && <div className="lava-modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="lava-success-title" className="lava-success-panel"><div className="lava-success-reward"><img className="lava-success-reward__sparkles" src={lavaValleyAssets.effects.successSparkles} alt="" aria-hidden="true" /><img src={lavaValleyAssets.rewards.explorerRewardPouch} alt="탐험 보상 주머니" /></div><h2 id="lava-success-title" className="mt-3 text-2xl font-black text-emerald-900">용암 계곡을 건넜어요!</h2><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={() => resetRound(buildProblem(settings))} className="lava-modal-button lava-modal-button--cancel"><RotateCcw className="h-4 w-4" /> 다시 하기</button><button type="button" onClick={onExit} className="lava-modal-button lava-modal-button--apply">탐험 지도로</button></div></section></div>}
    </section>
  );
}

interface LavaSettingGroupProps<T extends string | number> { label: string; values: readonly T[]; selected: T; format: (value: T) => string; onSelect: (value: T) => void }
function LavaSettingGroup<T extends string | number>({ label, values, selected, format, onSelect }: LavaSettingGroupProps<T>) {
  return <fieldset className="mt-4"><legend className="mb-2 text-sm font-black text-amber-900">{label}</legend><div className="flex flex-wrap gap-2">{values.map((value) => <button key={value} type="button" aria-pressed={selected === value} onClick={() => onSelect(value)} className="lava-setting-choice">{format(value)}</button>)}</div></fieldset>;
}
