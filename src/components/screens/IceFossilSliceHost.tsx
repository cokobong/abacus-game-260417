import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { IceAction } from './iceFossil/iceFossilPrototypeConfig';
import { ICE_FOSSIL_SLICE, type SliceToolAction } from './iceFossil/iceFossilSliceConfig';
import type { IceFossilSliceController, SliceHudState } from './iceFossil/createIceFossilSliceGame';

const keyboard: Record<string, IceAction> = {
  a: 'left', d: 'right', w: 'up', s: 'down',
  j: 'toolRepair', k: 'toolHeat', l: 'toolElectric',
};
const directions: { action: IceAction; label: string; symbol: string }[] = [
  { action: 'up', label: '위', symbol: '↑' }, { action: 'left', label: '왼쪽', symbol: '←' },
  { action: 'right', label: '오른쪽', symbol: '→' }, { action: 'down', label: '아래', symbol: '↓' },
];
const tools: { action: SliceToolAction; label: string; symbol: string }[] = [
  { action: 'toolRepair', label: '렌치 J', symbol: '🔧' },
  { action: 'toolHeat', label: '열 도구 K', symbol: '♨' },
  { action: 'toolElectric', label: '전기 L', symbol: '⚡' },
];
const initialHud: SliceHudState = { remaining: ICE_FOSSIL_SLICE.durationSeconds, stage: 0, stageLabel: '얼음 원석', backlog: 0, selectedTool: 'toolRepair' };

export function IceFossilSliceHost({ onExit }: { onExit: () => void }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<IceFossilSliceController | null>(null);
  const [run, setRun] = useState(0);
  const [hud, setHud] = useState(initialHud);
  const [feedback, setFeedback] = useState('화석 원석이 생산라인에 들어갑니다.');
  const [result, setResult] = useState<'success' | 'timeout' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const parent = parentRef.current;
    if (!parent) return;
    void import('./iceFossil/createIceFossilSliceGame').then(({ createIceFossilSliceGame }) => {
      if (cancelled) return;
      controllerRef.current = createIceFossilSliceGame(parent, { onHud: setHud, onFeedback: setFeedback, onResult: setResult });
      setLoading(false);
    }).catch(error => { console.error('[Ice fossil slice] load failed', error); setLoading(false); setFeedback('2차 slice를 열지 못했어요.'); });
    return () => { cancelled = true; controllerRef.current?.destroy(); controllerRef.current = null; };
  }, [run]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const action = keyboard[event.key.toLowerCase()];
      if (!action) return;
      event.preventDefault();
      if (action.startsWith('tool')) { if (!event.repeat) controllerRef.current?.act(action as SliceToolAction); }
      else controllerRef.current?.setHeld(action, true);
    };
    const up = (event: KeyboardEvent) => {
      const action = keyboard[event.key.toLowerCase()];
      if (action && !action.startsWith('tool')) controllerRef.current?.setHeld(action, false);
    };
    const blur = () => directions.forEach(({ action }) => controllerRef.current?.setHeld(action, false));
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  const press = (action: IceAction) => (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); controllerRef.current?.setHeld(action, true);
  };
  const release = (action: IceAction) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    controllerRef.current?.setHeld(action, false);
  };
  const retry = () => { setHud(initialHud); setResult(null); setLoading(true); setRun(value => value + 1); };
  const time = `${String(Math.floor(hud.remaining / 60)).padStart(2, '0')}:${String(hud.remaining % 60).padStart(2, '0')}`;

  return <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#061d31] text-white" aria-label="얼음대륙 화석 복원 2차 slice">
    <div className="z-10 flex items-center justify-between bg-[#102f49] px-3 py-2 text-xs shadow-lg">
      <button type="button" className="rounded-lg bg-white/15 px-3 py-2 font-bold" onClick={onExit}>← 나가기</button>
      <div className="text-center"><strong className="block text-sm">화석 복원 기지</strong><span className="text-cyan-200">{hud.stage + 1}/6 · {hud.stageLabel}</span></div>
      <strong className={hud.remaining <= 15 ? 'text-amber-300' : ''} aria-label={`남은 시간 ${hud.remaining}초`}>{time}</strong>
    </div>
    <div className="z-10 flex h-7 items-center justify-between bg-[#0b263d] px-3 text-[11px] text-cyan-100">
      <span>공정 {'●'.repeat(hud.stage + 1)}{'○'.repeat(5 - hud.stage)}</span>
      <span className={hud.backlog ? 'font-black text-amber-300' : ''}>{hud.backlog ? `대기 ${hud.backlog}개` : '라인 정상'}</span>
    </div>
    <div ref={parentRef} className="min-h-0 flex-1 overflow-hidden [&_canvas]:mx-auto [&_canvas]:block" aria-hidden="true" />
    <p className="z-10 min-h-9 bg-[#123b55] px-3 py-2 text-center text-sm" role="status">{feedback}</p>
    <div className="z-10 flex items-end justify-between gap-3 bg-[#061d31] px-3 pb-[calc(.65rem+env(safe-area-inset-bottom))] pt-2 touch-none">
      <div className="grid w-32 grid-cols-3 gap-1" aria-label="이동 방향">
        {directions.map(({ action, label, symbol }) => <button key={action} type="button" aria-label={label} className={`h-11 rounded-xl bg-cyan-700 text-xl font-bold active:bg-cyan-400 ${action === 'up' ? 'col-start-2' : action === 'left' ? 'col-start-1 row-start-2' : action === 'right' ? 'col-start-3 row-start-2' : 'col-start-2 row-start-3'}`} onPointerDown={press(action)} onPointerUp={release(action)} onPointerCancel={release(action)} onLostPointerCapture={() => controllerRef.current?.setHeld(action, false)}>{symbol}</button>)}
      </div>
      <div className="flex gap-1" aria-label="공구 선택">
        {tools.map(({ action, label, symbol }) => <button key={action} type="button" aria-label={label} className={`flex h-14 min-w-14 flex-col items-center justify-center rounded-xl px-1 text-xl active:scale-95 ${hud.selectedTool === action ? 'bg-amber-400 text-slate-950 ring-2 ring-white' : 'bg-slate-600'}`} onClick={() => controllerRef.current?.act(action)}><span>{symbol}</span><small className="text-[10px] font-bold">{label}</small></button>)}
      </div>
    </div>
    {loading && <div className="absolute inset-0 z-20 grid place-items-center bg-[#061d31]/90" role="status">복원 기지를 가동하고 있어요…</div>}
    {result && <div className="absolute inset-0 z-20 grid place-items-center bg-[#041827]/90 p-5"><div className="w-full max-w-sm rounded-3xl border-4 border-cyan-200 bg-[#eafcff] p-6 text-center text-[#143750]" role="dialog" aria-modal="true"><div className="mb-2 text-5xl">{result === 'success' ? '🦴✨' : '🧊'}</div><h2 className="text-2xl font-black">{result === 'success' ? '복원 완료!' : '시간 종료'}</h2><p className="my-4">{result === 'success' ? '얼음 속 화석이 복원대에 안전하게 장착됐어요.' : `복원 ${hud.stage + 1}/6 · 생산라인을 더 빠르게 복구해 보세요.`}</p><div className="flex justify-center gap-2"><button type="button" className="rounded-xl bg-cyan-700 px-4 py-3 font-bold text-white" onClick={retry}>다시 도전</button><button type="button" className="rounded-xl bg-slate-200 px-4 py-3 font-bold" onClick={onExit}>나가기</button></div></div></div>}
  </section>;
}
