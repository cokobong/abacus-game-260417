import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { IceFossilController } from './iceFossil/createIceFossilPrototypeGame';
import { ICE_PROTOTYPE, type IceAction } from './iceFossil/iceFossilPrototypeConfig';

const keyboard: Record<string, IceAction> = {
  a: 'left', d: 'right', w: 'up', s: 'down',
  j: 'toolRepair', k: 'toolHeat', l: 'toolElectric',
};
const directions: { action: IceAction; label: string; symbol: string }[] = [
  { action: 'up', label: '위', symbol: '↑' }, { action: 'left', label: '왼쪽', symbol: '←' },
  { action: 'right', label: '오른쪽', symbol: '→' }, { action: 'down', label: '아래', symbol: '↓' },
];
const tools: { action: IceAction; label: string; symbol: string }[] = [
  { action: 'toolRepair', label: '정비 J', symbol: '🔧' },
  { action: 'toolHeat', label: '해빙 K', symbol: '☀' },
  { action: 'toolElectric', label: '전기 L', symbol: '⚡' },
];

export function IceFossilPrototypeHost({ onExit }: { onExit: () => void }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<IceFossilController | null>(null);
  const [run, setRun] = useState(0);
  const [remaining, setRemaining] = useState<number>(ICE_PROTOTYPE.durationSeconds);
  const [feedback, setFeedback] = useState('얼음이 움직여요. 멈춘 곳을 찾아보세요!');
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<'success' | 'timeout' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const parent = parentRef.current;
    if (!parent) return;
    void import('./iceFossil/createIceFossilPrototypeGame').then(({ createIceFossilPrototypeGame }) => {
      if (cancelled) return;
      controllerRef.current = createIceFossilPrototypeGame(parent, {
        onTick: setRemaining, onFeedback: setFeedback, onProgress: setMounted, onResult: setResult,
      });
      setLoading(false);
    }).catch(error => { console.error('[Ice fossil prototype] load failed', error); setLoading(false); setFeedback('목업을 열지 못했어요.'); });
    return () => { cancelled = true; controllerRef.current?.destroy(); controllerRef.current = null; };
  }, [run]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const action = keyboard[event.key.toLowerCase()];
      if (!action) return;
      event.preventDefault();
      if (action.startsWith('tool')) { if (!event.repeat) controllerRef.current?.act(action); }
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
  const retry = () => { setRemaining(ICE_PROTOTYPE.durationSeconds); setMounted(false); setResult(null); setLoading(true); setRun(value => value + 1); };

  return <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#082337] text-white" aria-label="얼음대륙 화석 복원 목업">
    <div className="z-10 bg-amber-300 px-2 py-2 text-center text-sm font-black tracking-wide text-slate-950">ICE FOSSIL PROTOTYPE · 80 SEC</div>
    <header className="z-10 flex items-center justify-between gap-2 bg-[#123b55] px-3 py-2 text-sm shadow-lg">
      <button type="button" className="rounded-lg bg-white/15 px-3 py-2" onClick={onExit}>← 모험맵</button>
      <strong>화석 뼈 복원 {mounted ? '1/1' : '0/1'}</strong>
      <strong aria-label={`남은 시간 ${remaining}초`}>{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</strong>
    </header>
    <div ref={parentRef} className="min-h-0 flex-1 overflow-hidden [&_canvas]:mx-auto [&_canvas]:block" aria-hidden="true" />
    <p className="z-10 min-h-9 bg-[#123b55] px-3 py-2 text-center text-sm" role="status">{feedback}</p>
    <div className="z-10 flex items-end justify-between gap-3 bg-[#082337] px-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-2 touch-none">
      <div className="grid w-36 grid-cols-3 gap-1" aria-label="이동 방향">
        {directions.map(({ action, label, symbol }) => <button key={action} type="button" aria-label={label} className={`h-12 rounded-xl bg-cyan-700 text-2xl font-bold active:bg-cyan-400 ${action === 'up' ? 'col-start-2' : action === 'left' ? 'col-start-1 row-start-2' : action === 'right' ? 'col-start-3 row-start-2' : 'col-start-2 row-start-3'}`} onPointerDown={press(action)} onPointerUp={release(action)} onPointerCancel={release(action)} onLostPointerCapture={() => controllerRef.current?.setHeld(action, false)}>{symbol}</button>)}
      </div>
      <div className="flex gap-1" aria-label="공구 선택">
        {tools.map(({ action, label, symbol }) => <button key={action} type="button" aria-label={label} className="flex h-14 min-w-14 flex-col items-center justify-center rounded-xl bg-amber-600 px-1 text-xl active:bg-amber-400" onClick={() => controllerRef.current?.act(action)}><span>{symbol}</span><small className="text-[10px]">{label}</small></button>)}
      </div>
    </div>
    {loading && <div className="absolute inset-0 z-20 grid place-items-center bg-[#082337]/85" role="status">빙하 기지를 준비하고 있어요…</div>}
    {result && <div className="absolute inset-0 z-20 grid place-items-center bg-[#082337]/85 p-5"><div className="w-full max-w-sm rounded-2xl bg-[#e7faff] p-6 text-center text-[#143750]" role="dialog" aria-modal="true"><h2 className="text-2xl font-black">{result === 'success' ? '화석 뼈 복원 성공!' : '시간 종료'}</h2><p className="my-4">복원 상태 {mounted ? '1/1' : '0/1'} · 생산라인을 다시 살려보세요.</p><div className="flex justify-center gap-2"><button type="button" className="rounded-lg bg-cyan-700 px-4 py-3 text-white" onClick={retry}>다시 도전</button><button type="button" className="rounded-lg bg-slate-200 px-4 py-3" onClick={onExit}>모험맵</button></div></div></div>}
  </section>;
}
